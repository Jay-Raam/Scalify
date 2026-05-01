import { useRef, useState, useEffect } from 'react'
import { useMutation } from '@apollo/client'
import toast from 'react-hot-toast'
import { SEND_MESSAGE } from '@/lib/graphql'
import type { Message, ChatResponse } from '@/types'

const BUSINESS_ID = '674abc123def456789012345'

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const [sendMessageMutation] = useMutation<{ sendMessage: ChatResponse }>(SEND_MESSAGE)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const { data } = await sendMessageMutation({
        variables: {
          businessId: BUSINESS_ID,
          sessionId: sessionId ?? undefined,
          message: text,
        },
      })

      if (data?.sendMessage) {
        const { message, detectedLanguage, sessionId: newSessionId } = data.sendMessage
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: message,
          timestamp: new Date().toISOString(),
          detectedLanguage,
        }
        setMessages((prev) => [...prev, assistantMessage])
        setSessionId(newSessionId)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send message'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    setSessionId(null)
  }

  return { messages, isLoading, sendMessage, clearChat, chatEndRef }
}
