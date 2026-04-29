import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bot, Copy, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/cn'
import type { Message } from '@/types'

interface MessageBubbleProps {
    message: Message
    isLast: boolean
}

export function MessageBubble({ message }: MessageBubbleProps) {
    const [copied, setCopied] = useState(false)
    const isUser = message.role === 'user'

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const timeStr = new Date(message.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    })

    if (isUser) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="flex justify-end mb-5"
            >
                <div className="max-w-[85%] sm:max-w-[70%]">
                    <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed">
                        {message.content}
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5 text-right pr-1">{timeStr}</p>
                </div>
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="flex items-start gap-3 mb-7"
        >
            <div className="w-7 h-7 rounded-lg bg-linear-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <Bot size={14} className="text-white" />
            </div>

            <div className="flex-1 min-w-0">
                <div className={cn(
                    'text-sm text-gray-800 leading-7',
                    '[&>p]:mb-3 [&>p:last-child]:mb-0',
                    '[&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-3 [&>ul>li]:mb-1.5',
                    '[&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-3 [&>ol>li]:mb-1.5',
                    '[&>h1]:font-bold [&>h1]:text-base [&>h1]:mb-2 [&>h1]:text-gray-900',
                    '[&>h2]:font-semibold [&>h2]:text-sm [&>h2]:mb-2 [&>h2]:text-gray-900',
                    '[&>h3]:font-semibold [&>h3]:text-sm [&>h3]:mb-1 [&>h3]:text-gray-900',
                    '[&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-xs [&_code]:font-mono [&_code]:text-purple-700',
                    '[&>pre]:bg-gray-50 [&>pre]:border [&>pre]:border-gray-200 [&>pre]:p-3 [&>pre]:rounded-xl [&>pre]:overflow-x-auto [&>pre]:mb-3 [&>pre]:text-xs',
                    '[&>strong]:font-semibold [&>strong]:text-gray-900',
                    '[&>blockquote]:border-l-2 [&>blockquote]:border-purple-300 [&>blockquote]:pl-3 [&>blockquote]:text-gray-500 [&>blockquote]:italic [&>blockquote]:my-2'
                )}>
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>

                <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400">{timeStr}</span>
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
                    >
                        {copied
                            ? <><Check size={11} className="text-green-500" /><span className="text-green-500">Copied</span></>
                            : <><Copy size={11} /><span>Copy</span></>
                        }
                    </button>
                </div>
            </div>
        </motion.div>
    )
}
