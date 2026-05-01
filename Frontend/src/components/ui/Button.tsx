import { motion } from 'framer-motion'
import { Spinner } from './Spinner'
import { cn } from '@/lib/cn'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    isLoading?: boolean
}

export function Button({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    children,
    className,
    disabled,
    ...props
}: ButtonProps) {
    const base =
        'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
        primary:
            'bg-gradient-to-r from-purple-600 to-indigo-500 text-white hover:from-purple-700 hover:to-indigo-600 shadow-sm hover:shadow-md',
        secondary:
            'border border-purple-500 text-purple-600 hover:bg-purple-50',
        danger:
            'bg-red-500 text-white hover:bg-red-600 shadow-sm',
        ghost:
            'text-gray-600 hover:bg-gray-100',
    }

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
    }

    return (
        <motion.button
            whileTap={!disabled && !isLoading ? { scale: 0.96 } : undefined}
            className={cn(base, variants[variant], sizes[size], className)}
            disabled={disabled || isLoading}
            {...(props as unknown as React.ComponentProps<typeof motion.button>)}
        >
            {isLoading && <Spinner size="sm" />}
            {children}
        </motion.button>
    )
}
