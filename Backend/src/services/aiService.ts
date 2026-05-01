import OpenAI from 'openai'
import { env } from '../config/env.js'
import logger from '../utils/logger.js'

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: env.OPENROUTER_API_KEY,
})

export interface AIServiceParams {
  faqs: Array<{ question: string; answer: string; language: string; category: string }>
  userMessage: string
  detectedLanguage: 'tamil' | 'english'
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  businessName?: string
  fileContext?: string
  attachments?: Array<{
    name: string
    type: 'file' | 'image'
    mimeType: string
    content: string
  }>
}

async function callOpenRouter(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  model = env.LLM_MODEL
): Promise<OpenAI.Chat.ChatCompletion> {
  return client.chat.completions.create({
    model,
    max_tokens: 1024,
    temperature: 0.2,
    messages,
  })
}

function fallbackMessage(language: 'tamil' | 'english'): string {
  if (language === 'tamil') {
    return 'மன்னிக்கவும், இப்போது சரியான பதிலை உருவாக்க முடியவில்லை. தயவுசெய்து உங்கள் கேள்வியை வேறு முறையில் கேளுங்கள்.'
  }
  return "Sorry, I couldn't generate a reliable answer right now. Please try rephrasing your question."
}

function hasTamilScript(text: string): boolean {
  return /[\u0B80-\u0BFF]/.test(text)
}

export async function generateChatResponse(params: AIServiceParams): Promise<string> {
  const { faqs, userMessage, detectedLanguage, chatHistory, businessName, fileContext, attachments } = params

  const faqContext = faqs
    .slice(0, 50)
    .map((f) => `Q: ${f.question} | A: ${f.answer}`)
    .join('\n')

  const fileSection = fileContext ? `\nFILE/IMAGE CONTEXT:\n${fileContext.slice(0, 8000)}` : ''
  const imageAttachments = (attachments ?? []).filter((att) => att.type === 'image')

  const systemPrompt = `You are a helpful, friendly AI assistant for ${businessName || 'the user'}.

KNOWLEDGE BASE:
${faqContext || 'No FAQ entries available yet.'}${fileSection}

LANGUAGE RULE: The customer is writing in ${detectedLanguage}. You MUST reply ONLY in ${detectedLanguage}.
If Tamil: respond in natural, conversational Tamil using Tamil script.
If English: respond in clear, simple English.
Never mix Tamil and English in the same sentence unless a brand/product name requires it.
Never output random tokens, gibberish, or transliterated mixed words.

BEHAVIOR RULES:
- You are a general assistant: answer normal world-knowledge questions directly and clearly
- If files/images are attached, prioritize them over general knowledge
- If FAQ/business context exists, use it when relevant
- If you are uncertain, say so briefly instead of inventing facts
- Keep answers concise (2-4 sentences max)
- Be warm and professional
- Never fabricate unknown details`

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.slice(-10).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    imageAttachments.length > 0
      ? {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `${userMessage}\n\nUse the attached image(s) and file context to answer precisely.`,
            },
            ...imageAttachments.slice(0, 2).map((img) => ({
              type: 'image_url' as const,
              image_url: { url: img.content },
            })),
          ],
        }
      : { role: 'user', content: userMessage },
  ]

  const selectedModel =
    imageAttachments.length > 0
      ? env.LLM_VISION_MODEL || 'meta-llama/llama-3.2-11b-vision-instruct:free'
      : env.LLM_MODEL

  try {
    const response = await callOpenRouter(messages, selectedModel)

    logger.info('AI response generated', {
      model: selectedModel,
      finishReason: response.choices[0]?.finish_reason,
    })

    const content = response.choices[0]?.message?.content?.trim() || ''
    if (!content) {
      return fallbackMessage(detectedLanguage)
    }

    // Guardrail for low-quality free-model outputs when Tamil is expected.
    if (detectedLanguage === 'tamil' && !hasTamilScript(content)) {
      return fallbackMessage('tamil')
    }

    return content
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string }

    if (error?.status === 429) {
      logger.warn('OpenRouter rate limit hit — waiting 60s before retry')
      await new Promise((resolve) => setTimeout(resolve, 60000))

      const retryResponse = await callOpenRouter(messages, selectedModel)
      logger.info('AI response generated (retry after 429)', {
        model: selectedModel,
        finishReason: retryResponse.choices[0]?.finish_reason,
      })
      const retryContent = retryResponse.choices[0]?.message?.content?.trim() || ''
      if (!retryContent) {
        return fallbackMessage(detectedLanguage)
      }

      if (detectedLanguage === 'tamil' && !hasTamilScript(retryContent)) {
        return fallbackMessage('tamil')
      }

      return retryContent
    }

    if (error?.status === 529) {
      throw new Error('AI service temporarily unavailable')
    }

    logger.error('AI service error', {
      error: error?.message ?? String(err),
      model: selectedModel,
    })
    throw new Error('Failed to generate response')
  }
}

export function detectLanguage(text: string): 'tamil' | 'english' {
  const trimmed = text.trim().toLowerCase()
  const tamilRange = /[\u0B80-\u0BFF]/
  if (tamilRange.test(trimmed)) return 'tamil'

  // Detect common Tanglish words typed in Latin script.
  const tanglishHints = [
    'enna', 'epdi', 'eppadi', 'machan', 'venum', 'pann', 'panra', 'pathi', 'iruku', 'illa', 'unga', 'nan', 'naan', 'neenga', 'seri', 'thambi', 'akka',
  ]
  const hintCount = tanglishHints.reduce((acc, word) => {
    return acc + (trimmed.includes(word) ? 1 : 0)
  }, 0)

  return hintCount >= 2 ? 'tamil' : 'english'
}
