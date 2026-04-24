import crypto from 'crypto'
import mongoose from 'mongoose'
import { PDFParse } from 'pdf-parse'
import ChatSession from '../../models/ChatSession.js'
import BusinessOwner from '../../models/BusinessOwner.js'
import * as cacheService from '../../services/cacheService.js'
import * as aiService from '../../services/aiService.js'
import * as faqService from '../../services/faqService.js'
import redis from '../../config/redis.js'
import { sendMessageSchema } from '../../utils/validators.js'
import logger from '../../utils/logger.js'

interface AttachmentInput {
  name: string
  type: 'file' | 'image'
  mimeType: string
  size: number
  content: string
}

async function extractPdfText(dataUrl: string): Promise<string | null> {
  const match = dataUrl.match(/^data:application\/pdf;base64,(.+)$/)
  if (!match?.[1]) return null

  try {
    const pdfBuffer = Buffer.from(match[1], 'base64')
    const parser = new PDFParse({ data: pdfBuffer })
    const parsed = await parser.getText()
    await parser.destroy()
    return parsed.text?.replace(/\s+/g, ' ').trim() || null
  } catch (error) {
    logger.warn('Failed to parse PDF attachment', {
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

async function buildAttachmentContext(attachments: AttachmentInput[] = []): Promise<string | undefined> {
  if (attachments.length === 0) return undefined

  const lines: string[] = []
  for (const att of attachments.slice(0, 5)) {
    if (att.type === 'file') {
      let text = att.content.replace(/\s+/g, ' ').trim().slice(0, 4000)

      if (att.mimeType === 'application/pdf' || att.name.toLowerCase().endsWith('.pdf')) {
        const parsedPdfText = await extractPdfText(att.content)
        if (parsedPdfText) {
          text = parsedPdfText.slice(0, 4000)
        } else {
          text = '[PDF uploaded, but text extraction failed. Ask user to upload a text-based PDF or paste resume text.]'
        }
      }

      lines.push(`FILE: ${att.name} (${att.mimeType})\n${text}`)
      continue
    }

    const imagePreview = att.content.slice(0, 120)
    lines.push(`IMAGE: ${att.name} (${att.mimeType})\nData URL preview: ${imagePreview}...`)
  }

  return lines.join('\n\n').slice(0, 12000)
}

function attachmentSeed(attachments: AttachmentInput[] = []): string {
  return attachments
    .map((att) => `${att.name}:${att.type}:${att.size}:${att.content.slice(0, 80)}`)
    .join('|')
}

export const chatResolvers = {
  Query: {
    getChatHistory: async (_: unknown, args: { sessionId: string }) => {
      const session = await ChatSession.findOne({ sessionId: args.sessionId }).select('messages')
      if (!session) return []
      return session.messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : String(m.timestamp),
        detectedLanguage: m.detectedLanguage,
      }))
    },

    health: async () => {
      return {
        status: 'ok',
        uptime: process.uptime(),
        memoryMB: process.memoryUsage().heapUsed / 1024 / 1024,
        mongoConnected: mongoose.connection.readyState === 1,
        redisConnected: redis.status === 'ready',
      }
    },
  },

  Mutation: {
    createSession: async (_: unknown, args: { businessId: string }) => {
      const sessionId = crypto.randomUUID()
      await ChatSession.create({
        sessionId,
        businessId: new mongoose.Types.ObjectId(args.businessId),
        messages: [],
      })
      return sessionId
    },

    sendMessage: async (
      _: unknown,
      args: {
        businessId: string
        sessionId?: string | null
        message: string
        attachments?: AttachmentInput[]
      }
    ) => {
      const data = sendMessageSchema.parse(args)
      const { businessId, message, attachments = [] } = data
      let { sessionId } = data

      const cacheKey = cacheService.generateCacheKey(businessId, message, attachmentSeed(attachments))

      try {
        const cached = await cacheService.getCached(cacheKey)

        if (cached) {
          const parsed = JSON.parse(cached) as { message: string; detectedLanguage: string }

          const now = new Date()
          const userMsg = {
            role: 'user' as const,
            content: message,
            detectedLanguage: parsed.detectedLanguage,
            timestamp: now,
          }
          const assistantMsg = {
            role: 'assistant' as const,
            content: parsed.message,
            detectedLanguage: parsed.detectedLanguage,
            timestamp: now,
          }

          if (sessionId) {
            await ChatSession.findOneAndUpdate(
              { sessionId },
              { $push: { messages: { $each: [userMsg, assistantMsg] } } }
            )
          } else {
            sessionId = crypto.randomUUID()
            await ChatSession.create({
              sessionId,
              businessId: new mongoose.Types.ObjectId(businessId),
              messages: [userMsg, assistantMsg],
            })
          }

          logger.info('Cache hit for chat message', { businessId, sessionId })

          return { message: parsed.message, detectedLanguage: parsed.detectedLanguage, sessionId }
        }

        // Cache miss — full AI flow
        const [faqs, businessOwner] = await Promise.all([
          cacheService.getOrSet(
            `faqs:${businessId}`,
            () => faqService.getFAQsByBusiness(businessId),
            3600
          ),
          BusinessOwner.findOne({ businessId: new mongoose.Types.ObjectId(businessId) }).select(
            'businessName'
          ),
        ])

        let chatHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
        if (sessionId) {
          const session = await ChatSession.findOne({ sessionId }).select('messages')
          if (session) {
            chatHistory = session.messages.slice(-20).map((m) => ({
              role: m.role,
              content: m.content,
            }))
          }
        }

        const detectedLanguage = aiService.detectLanguage(message)

        const fileContextFromAttachments = await buildAttachmentContext(attachments)

        // Backward-compatible marker parser for older frontend payloads.
        const fileContextMatch = message.match(/\[FILES ATTACHED: (.+?)\]/)
        const markerContext = fileContextMatch ? `Attached files: ${fileContextMatch[1]}` : undefined

        const fileContext = fileContextFromAttachments || markerContext
        const cleanMessage = message.replace(/\n\n\[FILES ATTACHED: .+?\]$/, '')

        const aiResponse = await aiService.generateChatResponse({
          faqs: faqs.map((f) => {
            const faq = f as unknown as Record<string, unknown>
            return {
              question: faq.question as string,
              answer: faq.answer as string,
              language: faq.language as string,
              category: faq.category as string,
            }
          }),
          userMessage: cleanMessage,
          detectedLanguage,
          chatHistory,
          businessName: businessOwner?.businessName,
          fileContext,
          attachments,
        })

        await cacheService.setCached(
          cacheKey,
          JSON.stringify({ message: aiResponse, detectedLanguage }),
          1800
        )

        const now = new Date()
        const userMsg = {
          role: 'user' as const,
          content: message,
          detectedLanguage,
          timestamp: now,
        }
        const assistantMsg = {
          role: 'assistant' as const,
          content: aiResponse,
          detectedLanguage,
          timestamp: now,
        }

        if (sessionId) {
          await ChatSession.findOneAndUpdate(
            { sessionId },
            { $push: { messages: { $each: [userMsg, assistantMsg] } } }
          )
        } else {
          sessionId = crypto.randomUUID()
          await ChatSession.create({
            sessionId,
            businessId: new mongoose.Types.ObjectId(businessId),
            messages: [userMsg, assistantMsg],
          })
        }

        return { message: aiResponse, detectedLanguage, sessionId }
      } catch (err) {
        logger.error('sendMessage error', {
          businessId,
          messageLength: message.length,
          error: err instanceof Error ? err.message : String(err),
        })
        throw new Error(
          err instanceof Error && err.message === 'AI service temporarily unavailable'
            ? 'Our AI service is temporarily unavailable. Please try again shortly.'
            : 'Failed to process your message. Please try again.'
        )
      }
    },
  },
}
