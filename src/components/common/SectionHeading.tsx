import React from 'react'

export interface SectionHeadingProps {
  title: string
  eyebrow?: string
  subtitle?: string
  action?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  title,
  eyebrow,
  subtitle,
  action,
  size = 'md',
  className = '',
}) => {
  const titleSizes = {
    sm: 'text-lg sm:text-xl font-bold',
    md: 'text-xl sm:text-2xl lg:text-3xl font-extrabold',
    lg: 'text-2xl sm:text-3xl lg:text-4xl font-extrabold',
  }

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5 ${className}`}
    >
      <div className="space-y-1">
        {eyebrow && (
          <span className="block text-xs uppercase font-mono font-semibold tracking-widest text-[var(--accent-secondary)]">
            {eyebrow}
          </span>
        )}
        <h2
          className={`font-display text-[var(--text-primary)] tracking-tight leading-tight ${titleSizes[size]}`}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-[var(--text-secondary)] font-normal max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {action && <div className="shrink-0 sm:self-end">{action}</div>}
    </div>
  )
}
