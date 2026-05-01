import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@apollo/client'
import toast from 'react-hot-toast'
import { FileText, Image as ImageIcon, Send, Sparkles, X } from 'lucide-react'
import { SEND_MESSAGE } from '@/lib/graphql'
import type { Message, ChatResponse } from '@/types'

const BUSINESS_ID = '674abc123def456789012345'

interface UploadedFile {
    id: string
    name: string
    type: 'file' | 'image'
    mimeType: string
    size: number
    content?: string
}

function buildThinkingPhrases(message?: Message): string[] {
    if (!message) return ['Thinking', 'Preparing response', 'Finalizing answer']

    const text = message.content.toLowerCase()
    const hasFile = message.attachments?.some((a) => a.type === 'file')
    const hasImage = message.attachments?.some((a) => a.type === 'image')

    if (hasFile && /resume|cv/.test(text)) {
        return [
            'Reading your resume',
            'Reviewing strengths and gaps',
            'Preparing rating and suggestions',
        ]
    }

    if (hasImage) {
        return ['Analyzing uploaded image', 'Extracting visual details', 'Writing clear answer']
    }

    if (hasFile) {
        return ['Reading uploaded file', 'Extracting important points', 'Preparing response']
    }

    if (/rate|score|review|feedback/.test(text)) {
        return ['Reviewing your request', 'Scoring with context', 'Preparing actionable feedback']
    }

    return ['Understanding your question', 'Thinking through the answer', 'Finalizing response']
}

export function ChatPageV2() {
    const [messages, setMessages] = useState<Message[]>([])
    const [uploads, setUploads] = useState<UploadedFile[]>([])
    const [isPreparingUpload, setIsPreparingUpload] = useState(false)
    const [inputText, setInputText] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [thinkingText, setThinkingText] = useState('Thinking')
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
    const [sessionId, setSessionId] = useState<string | null>(null)
    const chatEndRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const imageInputRef = useRef<HTMLInputElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const [sendMessageMutation] = useMutation<{ sendMessage: ChatResponse }>(SEND_MESSAGE)

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        const textarea = textareaRef.current
        if (!textarea) return

        textarea.style.height = 'auto'
        textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`
    }, [inputText])

    useEffect(() => {
        if (!isLoading) {
            setThinkingText('Thinking')
            return
        }

        const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')
        const phrases = buildThinkingPhrases(lastUserMessage)

        let phraseIndex = 0
        let charIndex = 0
        let holdTicks = 0

        const timer = window.setInterval(() => {
            const currentPhrase = phrases[phraseIndex] || 'Thinking'

            if (holdTicks > 0) {
                holdTicks -= 1
                return
            }

            if (charIndex < currentPhrase.length) {
                charIndex += 1
                setThinkingText(currentPhrase.slice(0, charIndex))
                return
            }

            holdTicks = 10
            phraseIndex = (phraseIndex + 1) % phrases.length
            charIndex = 0
            setThinkingText('')
        }, 45)

        return () => {
            window.clearInterval(timer)
        }
    }, [isLoading, messages])

    const readFile = (file: File, mode: 'text' | 'dataurl') =>
        new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve((reader.result as string) || '')
            reader.onerror = () => reject(new Error('Failed to read file'))

            if (mode === 'dataurl') {
                reader.readAsDataURL(file)
            } else {
                reader.readAsText(file)
            }
        })

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.currentTarget.value = ''
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            toast.error('File must be under 2MB')
            return
        }

        const isPdf =
            (file.type || '').toLowerCase() === 'application/pdf' ||
            file.name.toLowerCase().endsWith('.pdf')

        setIsPreparingUpload(true)
        try {
            const content = await readFile(file, isPdf ? 'dataurl' : 'text')
            const upload: UploadedFile = {
                id: `file-${Date.now()}`,
                name: file.name,
                type: 'file',
                mimeType: file.type || (isPdf ? 'application/pdf' : 'text/plain'),
                size: file.size,
                content: isPdf ? content : content.slice(0, 500000),
            }
            setUploads((prev) => [...prev, upload])
            toast.success(`File "${file.name}" uploaded`)
        } catch {
            toast.error('Unable to process this file')
        } finally {
            setIsPreparingUpload(false)
        }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.currentTarget.value = ''
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Image must be under 2MB')
            return
        }

        setIsPreparingUpload(true)
        try {
            const content = await readFile(file, 'dataurl')
            const upload: UploadedFile = {
                id: `image-${Date.now()}`,
                name: file.name,
                type: 'image',
                mimeType: file.type || 'image/*',
                size: file.size,
                content,
            }
            setUploads((prev) => [...prev, upload])
            toast.success(`Image "${file.name}" uploaded`)
        } catch {
            toast.error('Unable to process this image')
        } finally {
            setIsPreparingUpload(false)
        }
    }

    const sendMessage = async () => {
        if (isPreparingUpload) {
            toast.error('Please wait for upload to finish')
            return
        }

        const uploadsSnapshot = [...uploads]

        if (!inputText.trim() && uploadsSnapshot.length === 0) return

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: inputText,
            timestamp: new Date().toISOString(),
            attachments: uploadsSnapshot,
        }

        setMessages((prev) => [...prev, userMessage])
        setInputText('')
        setUploads([])
        setIsLoading(true)

        try {
            const messageWithContext =
                uploadsSnapshot.length > 0
                    ? `${inputText}\n\n[FILES ATTACHED: ${uploadsSnapshot.map((u) => `${u.name} (${u.type})`).join(', ')}]`
                    : inputText

            const { data } = await sendMessageMutation({
                variables: {
                    businessId: BUSINESS_ID,
                    sessionId: sessionId ?? undefined,
                    message: messageWithContext,
                    attachments: uploadsSnapshot.map((u) => ({
                        name: u.name,
                        type: u.type.toUpperCase(),
                        mimeType: u.mimeType,
                        size: u.size,
                        content: u.content || '',
                    })),
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
        setUploads([])
        setSessionId(null)
        setInputText('')
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
        }
    }

    const copyResponse = async (msg: Message) => {
        if (msg.role !== 'assistant' || !msg.content.trim()) return

        try {
            await navigator.clipboard.writeText(msg.content)
            setCopiedMessageId(msg.id)
            toast.success('Response copied')
            window.setTimeout(() => {
                setCopiedMessageId((current) => (current === msg.id ? null : current))
            }, 1200)
        } catch {
            toast.error('Unable to copy response')
        }
    }

    const quickPrompts = ['Today News', 'Create a Image', 'Kadhal Kavithai', 'Answer the Question']

    const onPickPrompt = (prompt: string) => {
        setInputText(prompt)
        requestAnimationFrame(() => {
            textareaRef.current?.focus()
        })
    }

    const canSend = (!inputText.trim() && uploads.length === 0) || isLoading || isPreparingUpload

    return (
        <div className="neo-chat">
            {/* Header */}
            <header className="neo-header">
                <div className="neo-header-content">
                    <h1 className="neo-logo">AI CHAT</h1>
                    <div className="neo-header-controls">
                        {messages.length > 0 && (
                            <button className="neo-clear-btn" onClick={clearChat}>
                                CLEAR
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Chat Area */}
            <main className="neo-messages" role="log" aria-live="polite">
                {messages.length === 0 ? (
                    <div className="neo-empty-state">
                        <div className="neo-empty-icon" aria-hidden="true">
                            <Sparkles size={18} />
                        </div>
                        <p className="neo-empty-text">No messages yet</p>
                        <div className="neo-chip-grid" role="list">
                            {quickPrompts.map((prompt) => (
                                <button
                                    key={prompt}
                                    type="button"
                                    className="neo-chip"
                                    onClick={() => onPickPrompt(prompt)}
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <article key={msg.id} className={`neo-message neo-message-${msg.role}`}>
                            <div className="neo-message-header">
                                <span className="neo-message-role">{msg.role.toUpperCase()}</span>
                                <div className="neo-message-meta">
                                    <span className="neo-message-time">
                                        {new Date(msg.timestamp).toLocaleTimeString()}
                                    </span>
                                    {msg.role === 'assistant' && (
                                        <button
                                            className="neo-copy-btn"
                                            onClick={() => copyResponse(msg)}
                                            title="Copy response"
                                            type="button"
                                        >
                                            {copiedMessageId === msg.id ? 'COPIED' : 'COPY'}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="neo-message-body">{msg.content}</div>
                            {msg.attachments && msg.attachments.length > 0 && (
                                <div className="neo-message-attachments">
                                    {msg.attachments.map((att) => (
                                        <div key={att.id} className="neo-attachment-tag">
                                            [{att.type.toUpperCase()}] {att.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </article>
                    ))
                )}
                {isLoading && (
                    <article className="neo-message neo-message-assistant">
                        <div className="neo-message-header">
                            <span className="neo-message-role">ASSISTANT</span>
                        </div>
                        <div className="neo-loader">
                            {thinkingText}
                            <span className="neo-typing-cursor">|</span>
                        </div>
                    </article>
                )}
                <div ref={chatEndRef} />
            </main>

            {/* Input Dock */}
            <footer className="neo-dock">
                <div className="neo-input-card">
                    {/* Upload previews inside the card */}
                    {uploads.length > 0 && (
                        <div className="neo-upload-preview">
                            {uploads.map((u) => (
                                <div key={u.id} className="neo-preview-item">
                                    <div className="neo-preview-leading">
                                        {u.type === 'image' ? (
                                            <img
                                                className="neo-preview-thumb"
                                                src={u.content}
                                                alt={u.name}
                                            />
                                        ) : (
                                            <span className="neo-preview-file-icon" aria-hidden="true">
                                                <FileText size={14} />
                                            </span>
                                        )}
                                        <span className="neo-preview-name" title={u.name}>
                                            {u.name}
                                        </span>
                                    </div>
                                    <button
                                        className="neo-preview-remove"
                                        onClick={() => setUploads((prev) => prev.filter((x) => x.id !== u.id))}
                                        type="button"
                                        aria-label={`Remove ${u.name}`}
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Textarea */}
                    <textarea
                        ref={textareaRef}
                        className="neo-textarea"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onInput={() => {
                            const ta = textareaRef.current
                            if (!ta) return
                            ta.style.height = 'auto'
                            ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                sendMessage()
                            }
                        }}
                        placeholder="Message AI Chat..."
                        disabled={isLoading}
                        rows={1}
                    />

                    {/* Toolbar: attachment buttons left, send button right */}
                    <div className="neo-toolbar">
                        <div className="neo-toolbar-left">
                            <button
                                className="neo-upload-btn"
                                onClick={() => fileInputRef.current?.click()}
                                title="Attach file"
                                disabled={isPreparingUpload}
                                type="button"
                            >
                                <FileText size={16} />
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".txt,.pdf,.doc,.docx,.json,.csv"
                                onChange={handleFileUpload}
                                style={{ display: 'none' }}
                            />

                            <button
                                className="neo-upload-btn"
                                onClick={() => imageInputRef.current?.click()}
                                title="Attach image"
                                disabled={isPreparingUpload}
                                type="button"
                            >
                                <ImageIcon size={16} />
                            </button>
                            <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                style={{ display: 'none' }}
                            />

                            {isPreparingUpload && (
                                <span className="neo-upload-processing">Processing…</span>
                            )}
                        </div>

                        <button
                            className="neo-send-btn"
                            onClick={sendMessage}
                            disabled={canSend}
                            type="button"
                            aria-label="Send message"
                        >
                            <Send size={14} />
                        </button>
                    </div>
                </div>
                <p className="neo-dock-hint">Scalify can make mistakes. Verify important information.</p>
            </footer>
        </div>
    )
}
