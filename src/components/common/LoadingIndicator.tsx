import React from 'react'
import type { ComponentSize } from '../../types'

export interface LoadingIndicatorProps {
  variant?: 'spinner' | 'dots' | 'pulse-bar'
  size?: ComponentSize
  label?: string
  className?: string
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  variant = 'spinner',
  size = 'md',
  label,
  className = '',
}) => {
  const sizeMap: Record<ComponentSize, { spinner: string; dot: string; bar: string }> = {
    sm: { spinner: 'w-4 h-4 border-2', dot: 'w-1.5 h-1.5', bar: 'h-1 w-20' },
    md: { spinner: 'w-7 h-7 border-[2.5px]', dot: 'w-2.5 h-2.5', bar: 'h-1.5 w-32' },
    lg: { spinner: 'w-10 h-10 border-3', dot: 'w-3.5 h-3.5', bar: 'h-2 w-48' },
  }

  const s = sizeMap[size]

  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex flex-col items-center justify-center gap-3 ${className}`}
    >
      {variant === 'spinner' && (
        <div
          className={`${s.spinner} rounded-full border-white/10 border-t-[var(--accent-primary)] animate-spin`}
        />
      )}

      {variant === 'dots' && (
        <div className="flex items-center gap-1.5">
          <span
            className={`${s.dot} rounded-full bg-[var(--accent-primary)] animate-pulse`}
            style={{ animationDelay: '0ms' }}
          />
          <span
            className={`${s.dot} rounded-full bg-[var(--accent-primary)] animate-pulse`}
            style={{ animationDelay: '180ms' }}
          />
          <span
            className={`${s.dot} rounded-full bg-[var(--accent-primary)] animate-pulse`}
            style={{ animationDelay: '360ms' }}
          />
        </div>
      )}

      {variant === 'pulse-bar' && (
        <div className={`${s.bar} rounded-full bg-white/10 overflow-hidden relative`}>
          <div className="absolute inset-y-0 left-0 bg-[var(--accent-primary)] w-1/3 rounded-full animate-[pulse_1.5s_ease-in-out_infinite]" />
        </div>
      )}

      {label && (
        <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-mono">
          {label}
        </span>
      )}
    </div>
  )
}
