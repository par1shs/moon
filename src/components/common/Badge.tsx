import React from 'react'
import type { BadgeVariant } from '../../types'

export interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  className?: string
  icon?: React.ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]',
  accent:
    'bg-[var(--accent-muted)] text-[var(--accent-secondary)] border border-[var(--accent-primary)]/30 font-semibold',
  outline:
    'bg-transparent text-[var(--text-secondary)] border border-[var(--border-subtle)]',
  live:
    'bg-red-500/15 text-red-300 border border-red-500/30 font-semibold tracking-wider uppercase',
  subtle:
    'bg-white/5 text-[var(--text-secondary)] backdrop-blur-sm',
}

const sizeClasses = {
  sm: 'text-[10px] px-2 py-0.5 rounded gap-1 tracking-wider',
  md: 'text-xs px-2.5 py-1 rounded-md gap-1.5 font-medium tracking-normal',
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
  icon,
}) => {
  return (
    <span
      className={`inline-flex items-center uppercase font-mono select-none font-medium ${
        sizeClasses[size]
      } ${variantClasses[variant]} ${className}`}
    >
      {variant === 'live' && (
        <span className="relative flex h-1.5 w-1.5 mr-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
        </span>
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  )
}
