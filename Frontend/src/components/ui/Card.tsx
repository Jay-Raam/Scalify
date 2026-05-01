import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'

interface CardProps {
    children: React.ReactNode
    className?: string
    hover?: boolean
}

export function Card({ children, className, hover = false }: CardProps) {
    return (
        <motion.div
            whileHover={hover ? { y: -2 } : undefined}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className={cn(
                'bg-white border border-gray-100 rounded-2xl shadow-sm',
                className
            )}
        >
            {children}
        </motion.div>
    )
}
