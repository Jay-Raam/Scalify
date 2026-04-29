import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SendHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/cn'

interface ChatInputProps {
    onSend: (text: string) => void
    isLoading: boolean
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
    const [text, setText] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const adjustHeight = () => {
        const ta = textareaRef.current
        if (!ta) return
        ta.style.height = 'auto'
        ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
    }

    const handleSend = () => {
        const trimmed = text.trim()
        if (!trimmed || isLoading) return
        onSend(trimmed)
        setText('')
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleClear = () => {
        setText('')
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
        }
    }

    const canSend = text.trim().length > 0 && !isLoading

    return (
        <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus-within:border-purple-300 focus-within:ring-2 focus-within:ring-purple-100 transition-all">
            <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onInput={adjustHeight}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder="Type in Tamil or English..."
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none disabled:opacity-50 leading-relaxed py-0.5"
                style={{ minHeight: '24px', maxHeight: '120px' }}
            />

            <div className="flex items-center gap-1 shrink-0">
                <AnimatePresence>
                    {text && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }}
                            transition={{ duration: 0.12 }}
                            onClick={handleClear}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
                        >
                            <X size={14} />
                        </motion.button>
                    )}
                </AnimatePresence>

                <motion.button
                    whileTap={canSend ? { scale: 0.88 } : undefined}
                    onClick={handleSend}
                    disabled={!canSend}
                    className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200',
                        canSend
                            ? 'bg-gray-900 text-white hover:bg-gray-700'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    )}
                >
                    {isLoading ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full"
                        />
                    ) : (
                        <SendHorizontal size={14} />
                    )}
                </motion.button>
            </div>
        </div>
    )
}
