import React, { forwardRef } from 'react'
import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { ComponentSize, IconButtonVariant } from '../../types'
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference'

export interface IconButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children'> {
  icon: React.ReactNode
  'aria-label': string
  variant?: IconButtonVariant
  size?: ComponentSize
  shape?: 'circle' | 'rounded'
}

const sizeClasses: Record<ComponentSize, string> = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
}

const variantClasses: Record<IconButtonVariant, string> = {
  primary:
    'bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:brightness-110 active:brightness-95',
  secondary:
    'bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-[#2c2f34] border border-[var(--border-subtle)] hover:border-[var(--border-hover)]',
  ghost:
    'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 active:bg-white/10',
  elevated:
    'bg-[var(--bg-card)]/90 backdrop-blur-md text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] shadow-lg',
  outline:
    'bg-transparent text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]',
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      'aria-label': ariaLabel,
      variant = 'secondary',
      size = 'md',
      shape = 'circle',
      className = '',
      disabled = false,
      ...motionProps
    },
    ref
  ) => {
    const reducedMotion = useReducedMotionPreference()
    const radiusClass = shape === 'circle' ? 'rounded-full' : 'rounded-lg'

    return (
      <motion.button
        ref={ref}
        aria-label={ariaLabel}
        title={ariaLabel}
        whileHover={disabled || reducedMotion ? undefined : { scale: 1.05 }}
        whileTap={disabled || reducedMotion ? undefined : { scale: 0.95 }}
        disabled={disabled}
        className={`inline-flex items-center justify-center shrink-0 cursor-pointer select-none transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
          sizeClasses[size]
        } ${variantClasses[variant]} ${radiusClass} ${className}`}
        {...motionProps}
      >
        {icon}
      </motion.button>
    )
  }
)

IconButton.displayName = 'IconButton'
