import React from 'react'

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showTagline?: boolean
  className?: string
  animated?: boolean
}

const sizeConfig = {
  sm: {
    text: 'text-lg',
    plusSize: 'w-3.5 h-3.5',
    plusText: 'text-sm',
    tagline: 'text-[9px]',
    gap: 'gap-1.5',
  },
  md: {
    text: 'text-2xl',
    plusSize: 'w-4 h-4',
    plusText: 'text-base',
    tagline: 'text-[10px]',
    gap: 'gap-2',
  },
  lg: {
    text: 'text-3xl sm:text-4xl',
    plusSize: 'w-5 h-5 sm:w-6 sm:h-6',
    plusText: 'text-xl sm:text-2xl',
    tagline: 'text-xs tracking-[0.25em]',
    gap: 'gap-2.5',
  },
  xl: {
    text: 'text-4xl sm:text-5xl md:text-6xl',
    plusSize: 'w-7 h-7 sm:w-9 sm:h-9',
    plusText: 'text-2xl sm:text-3xl',
    tagline: 'text-xs sm:text-sm tracking-[0.3em]',
    gap: 'gap-3',
  },
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showTagline = false,
  className = '',
}) => {
  const cfg = sizeConfig[size]

  return (
    <div className={`inline-flex flex-col items-start select-none ${className}`}>
      {/* Wordmark + Plus */}
      <div className={`flex items-center tracking-[-0.03em] ${cfg.gap}`}>
        <span
          className={`font-display font-extrabold tracking-wider text-[var(--text-primary)] ${cfg.text}`}
          style={{ letterSpacing: '0.04em' }}
        >
          JUNCTION
        </span>

        {/* Distinctive stylized junction plus mark */}
        <span
          className="relative inline-flex items-center justify-center font-display font-black text-[var(--accent-primary)] transition-colors duration-300"
          aria-label="Plus"
        >
          <svg
            className={`${cfg.plusSize} overflow-visible`}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Horizontal Bar with subtle junction intersect notch */}
            <rect
              x="2"
              y="9"
              width="20"
              height="6"
              rx="2"
              fill="currentColor"
            />
            {/* Vertical Bar intersecting cleanly */}
            <rect
              x="9"
              y="2"
              width="6"
              height="20"
              rx="2"
              fill="currentColor"
            />
            {/* Intersection focal pip */}
            <circle cx="12" cy="12" r="1.5" fill="var(--bg-main)" />
          </svg>
        </span>
      </div>

      {/* Primary Tagline */}
      {showTagline && (
        <span
          className={`font-display font-semibold uppercase text-[var(--text-muted)] mt-1 tracking-widest ${cfg.tagline}`}
        >
          ONE STORY. EVERY SCREEN.
        </span>
      )}
    </div>
  )
}
