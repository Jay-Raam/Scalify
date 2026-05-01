import { AnimatePresence, motion } from 'framer-motion'
import { Bot, RotateCcw, Sparkles } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { ChatInput } from './ChatInput'

export function ChatWindow() {
    const { messages, isLoading, sendMessage, clearChat, chatEndRef } = useChat()

    return (
        <div className="flex flex-col h-full">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto chat-scrollbar">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
                    <AnimatePresence>
                        {messages.length === 0 && !isLoading ? (
                            <motion.div
                                key="empty-state"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.4 }}
                                className="flex flex-col items-center justify-center pt-16 sm:pt-24 pb-10 text-center"
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.06, 1] }}
                                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                                    className="w-14 h-14 rounded-2xl bg-linear-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-5 shadow-lg shadow-purple-200"
                                >
                                    <Sparkles size={26} className="text-white" />
                                </motion.div>
                                <h2 className="text-xl font-semibold text-gray-800 mb-1">How can I help you?</h2>
                                <p className="text-gray-400 text-sm">Ask anything in Tamil or English</p>
                            </motion.div>
                        ) : (
                            messages.map((msg, index) => (
                                <MessageBubble
                                    key={msg.id}
                                    message={msg}
                                    isLast={index === messages.length - 1}
                                />
                            ))
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {isLoading && (
                            <motion.div
                                key="typing-indicator"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-start gap-3 mb-6"
                            >
                                <div className="w-7 h-7 rounded-lg bg-linear-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                                    <Bot size={14} className="text-white" />
                                </div>
                                <div className="pt-2">
                                    <TypingIndicator />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div ref={chatEndRef} />
                </div>
            </div>

            {/* Input Bar */}
            <div className="border-t border-gray-100 bg-white px-4 sm:px-6 py-3 sm:py-4 shrink-0">
                <div className="max-w-2xl mx-auto">
                    {messages.length > 0 && (
                        <div className="flex justify-end mb-2">
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onClick={clearChat}
                                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
                            >
                                <RotateCcw size={11} />
                                New chat
                            </motion.button>
                        </div>
                    )}
                    <ChatInput onSend={sendMessage} isLoading={isLoading} />
                    <p className="text-center text-xs text-gray-300 mt-2 hidden sm:block">
                        Press Enter to send · Shift+Enter for new line
                    </p>
                </div>
            </div>
        </div>
    )
}
