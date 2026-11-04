import React, { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { Play, Info, Plus, Check } from 'lucide-react'
import type { ContentMetadata } from '../../../types'
import { Button } from '../../../components/common/Button'
import { IconButton } from '../../../components/common/IconButton'
import { Badge } from '../../../components/common/Badge'
import { useReducedMotionPreference } from '../../../hooks/useReducedMotionPreference'

export interface HeroBannerProps {
  content: ContentMetadata
  onPlay?: (content: ContentMetadata) => void
  onInfo?: (content: ContentMetadata) => void
  onAddToList?: (content: ContentMetadata) => void
  isSaved?: boolean
  className?: string
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  content,
  onPlay,
  onInfo,
  onAddToList,
  isSaved = false,
  className = '',
}) => {
  const reducedMotion = useReducedMotionPreference()
  const bannerImage = content.backdropUrl || content.posterUrl
  const artworkRef = useRef<HTMLDivElement>(null)
  const rafIdRef = useRef<number | null>(null)

  // Subtle Hero Parallax: 8-12px transform-based vertical shift on artwork only
  useEffect(() => {
    if (reducedMotion) return

    // Disable on touch devices
    const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
    if (isTouch) return

    const updateParallax = () => {
      if (!artworkRef.current) return
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0

      // Subtly translate artwork vertically: capped at 10px (within 8-12px range)
      const offset = Math.min(10, Math.max(0, scrollY * 0.035))
      artworkRef.current.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0) scale(1.04)`
    }

    const onScroll = () => {
      if (rafIdRef.current !== null) return
      rafIdRef.current = requestAnimationFrame(() => {
        updateParallax()
        rafIdRef.current = null
      })
    }

    updateParallax()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [reducedMotion])

  return (
    <section
      aria-label={`Featured: ${content.title}`}
      className={`relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-card)] min-h-[380px] sm:min-h-[440px] lg:min-h-[500px] flex flex-col justify-end p-5 sm:p-10 lg:p-14 select-none shadow-[var(--shadow-elevated)] ${className}`}
    >
      {/* Background Image with subtle hero parallax (8-12px transform) */}
      {bannerImage && (
        <div
          ref={artworkRef}
          data-testid="hero-parallax-artwork"
          className="absolute inset-0 z-0 overflow-hidden will-change-transform"
          style={{
            transform: 'translate3d(0, 0px, 0) scale(1.04)',
          }}
        >
          <img
            src={bannerImage}
            alt={content.title}
            className="w-full h-full object-cover object-center filter brightness-[0.8] contrast-[1.08]"
            loading="eager"
          />
        </div>
      )}

      {/* Permanent Brand Primary Radial Gradient with Deep Indigo & Midnight Slate depth */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: 'var(--gradient-brand-hero)',
        }}
      />

      {/* Dynamic Accent Ambient Glow blob */}
      <div
        className="absolute top-0 right-0 w-[350px] sm:w-[550px] h-[350px] sm:h-[550px] rounded-full pointer-events-none blur-3xl opacity-30 transition-all duration-700 z-10"
        style={{
          background: 'radial-gradient(circle, var(--accent-glow) 0%, rgba(0,0,0,0) 70%)',
        }}
      />

      {/* Cinematic Vignette Gradients: Bottom-heavy & Left-heavy protection for text */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: 'var(--hero-vignette-bottom)',
        }}
      />
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: 'var(--hero-vignette-left)',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none z-10" />

      {/* Top Right Badges */}
      <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20 flex items-center gap-2">
        {content.badge && (
          <Badge variant="accent" size="sm">
            {content.badge}
          </Badge>
        )}
        {content.quality && (
          <Badge variant="subtle" size="sm">
            {content.quality}
          </Badge>
        )}
        {content.rating && (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-[var(--bg-card)]/80 border border-[var(--border-subtle)] text-[var(--text-secondary)] backdrop-blur-md">
            {content.rating}
          </span>
        )}
      </div>

      {/* Hero Content Information Block */}
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-20 max-w-2xl sm:max-w-3xl space-y-3 sm:space-y-4"
      >
        {/* Eyebrow / Categories */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {content.eyebrow && (
            <span className="text-xs font-mono uppercase tracking-[0.22em] text-[var(--accent-secondary)] font-semibold">
              {content.eyebrow}
            </span>
          )}
          {content.year && (
            <span className="text-xs font-mono text-[var(--text-muted)]">
              • {content.year}
            </span>
          )}
          {content.duration && (
            <span className="text-xs font-mono text-[var(--text-muted)]">
              • {content.duration}
            </span>
          )}
        </div>

        {/* Hero Title */}
        <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--text-primary)] leading-[1.1] drop-shadow-md">
          {content.title}
        </h1>

        {/* Subtitle / Description */}
        <p className="text-xs sm:text-sm lg:text-base text-[var(--text-secondary)] font-normal leading-relaxed max-w-xl line-clamp-2 sm:line-clamp-3 drop-shadow">
          {content.description || content.subtitle}
        </p>

        {/* Progress Bar (if in progress) */}
        {content.progress !== undefined && content.progress > 0 && (
          <div className="space-y-1 max-w-xs sm:max-w-md pt-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
              <span>Resume Playback</span>
              <span className="text-[var(--accent-primary)] font-semibold">{content.progress}% watched</span>
            </div>
            <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-300"
                style={{ width: `${content.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <Button
            variant="primary"
            size="md"
            leftIcon={<Play className="w-4 h-4 fill-current ml-0.5" />}
            onClick={() => onPlay?.(content)}
          >
            Play Now
          </Button>

          <Button
            variant="secondary"
            size="md"
            leftIcon={<Info className="w-4 h-4" />}
            onClick={() => onInfo?.(content)}
          >
            More Info
          </Button>

          <IconButton
            icon={isSaved ? <Check className="w-4 h-4 text-[var(--accent-primary)]" /> : <Plus className="w-4 h-4" />}
            aria-label={isSaved ? "Saved to My List" : "Add to My List"}
            variant="elevated"
            size="sm"
            onClick={() => onAddToList?.(content)}
            className="rounded-xl border border-[var(--border-subtle)]"
          />
        </div>
      </motion.div>
    </section>
  )
}
