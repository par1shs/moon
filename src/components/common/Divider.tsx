import React from 'react'

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  label?: string
  className?: string
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  label,
  className = '',
}) => {
  if (orientation === 'vertical') {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={`inline-block w-px self-stretch bg-[var(--border-subtle)] ${className}`}
      />
    )
  }

  if (label) {
    return (
      <div
        role="separator"
        aria-orientation="horizontal"
        className={`flex items-center my-6 ${className}`}
      >
        <div className="flex-grow border-t border-[var(--border-subtle)]" />
        <span className="px-3 text-xs uppercase tracking-widest text-[var(--text-muted)] font-display font-medium">
          {label}
        </span>
        <div className="flex-grow border-t border-[var(--border-subtle)]" />
      </div>
    )
  }

  return (
    <hr
      role="separator"
      className={`border-0 border-t border-[var(--border-subtle)] my-6 w-full ${className}`}
    />
  )
}
