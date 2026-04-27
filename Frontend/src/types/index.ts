export interface Attachment {
  id: string
  name: string
  type: 'file' | 'image'
  size: number
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  detectedLanguage?: string
  attachments?: Attachment[]
}

export interface ChatResponse {
  message: string
  detectedLanguage: string
  sessionId: string
}
