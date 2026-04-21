import { z } from 'zod'

const maxAttachmentBytes = 2 * 1024 * 1024

const attachmentSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['FILE', 'IMAGE', 'file', 'image']).transform((value) => {
    return value.toLowerCase() as 'file' | 'image'
  }),
  mimeType: z.string().min(1).max(120),
  size: z.number().int().positive().max(maxAttachmentBytes),
  content: z.string().min(1).max(3_000_000),
})

export const sendMessageSchema = z.object({
  businessId: z.string().min(1),
  message: z.string().min(1).max(2000),
  sessionId: z.string().optional(),
  attachments: z.array(attachmentSchema).max(5).optional(),
})

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  businessName: z.string().min(2).max(200),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
