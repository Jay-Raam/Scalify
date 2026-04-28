import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './Button'

interface ModalProps {
    isOpen: boolean
    onConfirm: () => void
    onCancel: () => void
    title: string
    message: string
    confirmLabel?: string
    confirmVariant?: 'primary' | 'secondary' | 'danger' | 'ghost'
}

export function Modal({
    isOpen,
    onConfirm,
    onCancel,
    title,
    message,
    confirmLabel = 'Confirm',
    confirmVariant = 'danger',
}: ModalProps) {
    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={onCancel}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                        <p className="text-gray-500 text-sm mb-6">{message}</p>
                        <div className="flex gap-3 justify-end">
                            <Button variant="ghost" size="sm" onClick={onCancel}>
                                Cancel
                            </Button>
                            <Button variant={confirmVariant} size="sm" onClick={onConfirm}>
                                {confirmLabel}
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    )
}
