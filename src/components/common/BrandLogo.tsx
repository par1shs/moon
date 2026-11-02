import React from 'react'

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showTagline?: boolean
  className?: string
  animated?: boolean
}

const sizeConfig = {
  sm: {
    text: 'text-xl',
    plusSize: 'w-3.5 h-3.5',
    plusText: 'text-sm',
    tagline: 'text-[9px]',
    gap: 'gap-1.5',
  },
  md: {
    text: 'text-2xl sm:text-3xl',
    plusSize: 'w-4 h-4 sm:w-4.5 sm:h-4.5',
    plusText: 'text-base',
    tagline: 'text-[10px]',
    gap: 'gap-2',
  },
  lg: {
    text: 'text-4xl sm:text-5xl',
    plusSize: 'w-5 h-5 sm:w-6 sm:h-6',
    plusText: 'text-xl sm:text-2xl',
    tagline: 'text-xs tracking-[0.25em]',
    gap: 'gap-2.5',
  },
  xl: {
    text: 'text-5xl sm:text-6xl md:text-7xl',
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
          className={`font-pixel font-bold tracking-wider text-[var(--text-primary)] ${cfg.text} drop-shadow-sm`}
          style={{ letterSpacing: '0.08em' }}
        >
          PIXEL
        </span>

        {/* Distinctive stylized pixel plus mark */}
        <span
          className="relative inline-flex items-center justify-center font-pixel font-bold text-[var(--accent-primary)] transition-colors duration-300"
          aria-label="Plus"
        >
          <svg
            className={`${cfg.plusSize} overflow-visible`}
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Minecraft pixel-grid style plus */}
            <rect x="6" y="2" width="4" height="12" fill="currentColor" />
            <rect x="2" y="6" width="12" height="4" fill="currentColor" />
            {/* Center pixel highlight */}
            <rect x="6" y="6" width="4" height="4" fill="currentColor" opacity="0.85" />
          </svg>
        </span>
      </div>

      {/* Primary Tagline */}
      {showTagline && (
        <span
          className={`font-pixel font-semibold uppercase text-[var(--text-muted)] mt-1 tracking-widest ${cfg.tagline}`}
        >
          ONE STORY. EVERY SCREEN.
        </span>
      )}
    </div>
  )
}
