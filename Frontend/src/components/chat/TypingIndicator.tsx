import { motion } from 'framer-motion'

const containerVariants = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.15,
        },
    },
}

const dotVariants = {
    initial: { y: 0 },
    animate: {
        y: [0, -8, 0],
        transition: {
            repeat: Infinity,
            ease: 'easeInOut' as const,
            duration: 0.6,
        },
    },
}

export function TypingIndicator() {
    return (
        <motion.div
            variants={containerVariants}
            initial="initial"
            animate="animate"
            className="inline-flex items-center gap-1 bg-gray-100 rounded-2xl px-4 py-3"
        >
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    variants={dotVariants}
                    className="w-2 h-2 rounded-full bg-purple-400"
                />
            ))}
        </motion.div>
    )
}
