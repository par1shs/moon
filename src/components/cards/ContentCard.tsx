import React from 'react'
import { motion } from 'motion/react'
import { Play, Plus, Check, Info, X } from 'lucide-react'
import type { ContentCardVariant, ContentMetadata } from '../../types'
import { Badge } from '../common/Badge'
import { IconButton } from '../common/IconButton'
import { hoverLift } from '../../styles/animations'
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference'

export interface ContentCardProps {
  content: ContentMetadata
  variant?: ContentCardVariant
  onPlay?: (content: ContentMetadata) => void
  onInfo?: (content: ContentMetadata) => void
  onAddToList?: (content: ContentMetadata) => void
  onRemove?: (content: ContentMetadata) => void
  isSaved?: boolean
  className?: string
  isGrid?: boolean
  remainingTime?: string
}

export const ContentCard: React.FC<ContentCardProps> = ({
  content,
  variant = 'portrait',
  onPlay,
  onInfo,
  onAddToList,
  onRemove,
  isSaved = false,
  className = '',
  isGrid = false,
  remainingTime,
}) => {
  const reducedMotion = useReducedMotionPreference()

  // Aspect ratio & layout depending on variant
  const aspectConfig = {
    portrait: {
      container: isGrid ? 'w-full' : 'w-44 sm:w-52 md:w-60 flex-none',
      aspect: 'aspect-[2/3]',
    },
    landscape: {
      container: isGrid ? 'w-full' : 'w-64 sm:w-80 md:w-96 flex-none',
      aspect: 'aspect-video',
    },
    featured: {
      container: isGrid ? 'w-full' : 'w-[86vw] sm:w-[480px] md:w-[580px] flex-none',
      aspect: 'aspect-[16/9] sm:aspect-[21/9]',
    },
  }

  const cfg = aspectConfig[variant]
  const imageSrc =
    variant === 'portrait'
      ? content.posterUrl || content.backdropUrl
      : content.backdropUrl || content.posterUrl

  return (
    <motion.div
      data-testid={`content-card-${content.id}`}
      variants={reducedMotion ? undefined : hoverLift}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      onClick={() => onInfo?.(content)}
      className={`group relative rounded-lg overflow-hidden bg-gradient-to-b from-[var(--bg-elevated)]/90 via-[var(--bg-card)] to-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/70 transition-all duration-300 shadow-[var(--shadow-card)] hover:shadow-[0_14px_32px_-6px_rgba(0,0,0,0.65),0_0_20px_-6px_var(--accent-glow)] cursor-pointer select-none ${cfg.container} ${className}`}
    >
      {/* Media Container */}
      <div className={`relative w-full ${cfg.aspect} bg-[var(--bg-secondary)] overflow-hidden`}>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={content.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          /* Premium cinematic gradient placeholder */
          <div className="w-full h-full flex flex-col justify-end p-4 bg-gradient-to-t from-[var(--bg-card)] via-[#16181b] to-[#202328]">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--accent-secondary)]">
                PIXEL+ ORIGINAL
              </span>
            </div>
          </div>
        )}

        {/* Top Badges & Actions */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
          <div className="pointer-events-none flex items-center gap-1.5 flex-wrap">
            {content.isLive ? (
              <Badge variant="live" size="sm">
                LIVE TV
              </Badge>
            ) : content.badge ? (
              <Badge variant="accent" size="sm">
                {content.badge}
              </Badge>
            ) : null}

            {content.sponsor && (
              <span
                data-testid="card-sponsored-badge"
                className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
              >
                SPONSORED
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {content.quality && (
              <Badge variant="subtle" size="sm" className="pointer-events-none">
                {content.quality}
              </Badge>
            )}
            {onRemove && (
              <button
                type="button"
                aria-label={`Remove ${content.title}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(content)
                }}
                className="w-6 h-6 rounded-full bg-black/75 hover:bg-[var(--accent-primary)] hover:text-[var(--accent-contrast)] text-white/90 flex items-center justify-center transition-all cursor-pointer shadow-md focus:outline-none"
                title="Remove"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Watch Progress Bar */}
        {content.progress !== undefined && content.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-10">
            <div
              className="h-full bg-[var(--accent-primary)] transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, content.progress))}%` }}
            />
          </div>
        )}

        {/* Hover Overlay with Quick Controls */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 z-20">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <IconButton
                data-testid={`content-card-play-btn-${content.id}`}
                icon={<Play className="w-4 h-4 fill-current ml-0.5" />}
                aria-label={`Play ${content.title}`}
                variant="primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onPlay?.(content)
                }}
              />
              <IconButton
                icon={isSaved ? <Check className="w-4 h-4 text-[var(--accent-primary)]" /> : <Plus className="w-4 h-4" />}
                aria-label={isSaved ? `Remove ${content.title} from list` : `Add ${content.title} to list`}
                variant="elevated"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddToList?.(content)
                }}
              />
              <IconButton
                data-testid={`content-card-details-btn-${content.id}`}
                icon={<Info className="w-4 h-4" />}
                aria-label={`Details for ${content.title}`}
                variant="elevated"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onInfo?.(content)
                }}
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-mono">
              {content.rating && <span>{content.rating}</span>}
              {content.duration && <span>• {content.duration}</span>}
              {content.year && <span>• {content.year}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Card Info Footer */}
      <div className="p-3 bg-[var(--bg-card)]">
        {content.eyebrow && (
          <span className="block text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] truncate mb-0.5">
            {content.eyebrow}
          </span>
        )}
        <h4 className="font-display font-bold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-secondary)] transition-colors duration-200 truncate">
          {content.title}
        </h4>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          {content.subtitle && (
            <p className="text-xs text-[var(--text-muted)] truncate">
              {content.subtitle}
            </p>
          )}
          {remainingTime && (
            <span className="text-[10px] font-mono text-[var(--accent-secondary)] whitespace-nowrap shrink-0">
              {remainingTime}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
