import { motion } from 'framer-motion'

interface SpinnerProps {
    size?: 'sm' | 'md'
}

export function Spinner({ size = 'md' }: SpinnerProps) {
    const dimension = size === 'sm' ? 16 : 24

    return (
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ width: dimension, height: dimension }}
            className="border-2 border-current border-t-transparent rounded-full shrink-0"
        />
    )
}
