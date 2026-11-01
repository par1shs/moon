import React, { forwardRef } from 'react'
import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { ButtonVariant, ComponentSize } from '../../types'
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference'

export interface ButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children?: React.ReactNode
  variant?: ButtonVariant
  size?: ComponentSize
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const sizeClasses: Record<ComponentSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 font-medium rounded-md',
  md: 'h-10 px-4 text-sm gap-2 font-medium rounded-lg',
  lg: 'h-12 px-6 text-base gap-2.5 font-semibold rounded-lg',
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:brightness-110 active:brightness-95 shadow-[0_2px_12px_rgba(0,0,0,0.4)]',
  secondary:
    'bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-[#2c2f34] border border-[var(--border-subtle)] active:border-[var(--border-hover)]',
  ghost:
    'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 active:bg-white/10',
  outline:
    'bg-transparent text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]',
  danger:
    'bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 active:bg-red-500/30',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled = false,
      className = '',
      ...motionProps
    },
    ref
  ) => {
    const reducedMotion = useReducedMotionPreference()
    const isDisabled = disabled || isLoading

    return (
      <motion.button
        ref={ref}
        whileHover={isDisabled || reducedMotion ? undefined : { scale: 1.015 }}
        whileTap={isDisabled || reducedMotion ? undefined : { scale: 0.985 }}
        transition={{ duration: 0.15 }}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center select-none transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${
          sizeClasses[size]
        } ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...motionProps}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </span>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'
