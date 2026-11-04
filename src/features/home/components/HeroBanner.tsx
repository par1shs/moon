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
  const cardRef = useRef<HTMLElement>(null)
  const artworkRef = useRef<HTMLDivElement>(null)
  const rafIdRef = useRef<number | null>(null)

  // Card Parallax: Entire hero card scrolls slightly slower than standard content
  useEffect(() => {
    if (reducedMotion) return

    const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
    if (isTouch) return

    const updateParallax = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0

      // The whole hero card lags slightly behind scroll (e.g. shifts down by ~18% of scroll up to 45px)
      if (cardRef.current) {
        const cardOffset = Math.min(45, scrollY * 0.18)
        cardRef.current.style.transform = `translate3d(0, ${cardOffset.toFixed(1)}px, 0)`
      }

      // Inside the card, the backdrop image also shifts with subtle inner depth
      if (artworkRef.current) {
        const artOffset = Math.min(25, scrollY * 0.08)
        artworkRef.current.style.transform = `translate3d(0, ${artOffset.toFixed(1)}px, 0) scale(1.06)`
      }
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
      ref={cardRef}
      aria-label={`Featured: ${content.title}`}
      className={`relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-card)] min-h-[380px] sm:min-h-[440px] lg:min-h-[500px] flex flex-col justify-end p-5 sm:p-10 lg:p-14 select-none shadow-[var(--shadow-elevated)] will-change-transform ${className}`}
      style={{
        transform: 'translate3d(0, 0px, 0)',
      }}
    >
      {/* Background Image: Brightness increased so the cinematic artwork is clearly visible */}
      {bannerImage && (
        <div
          ref={artworkRef}
          data-testid="hero-parallax-artwork"
          className="absolute inset-0 z-0 overflow-hidden will-change-transform"
          style={{
            transform: 'translate3d(0, 0px, 0) scale(1.06)',
          }}
        >
          <img
            src={bannerImage}
            alt={content.title}
            className="w-full h-full object-cover object-center filter brightness-[0.95] contrast-[1.12]"
            loading="eager"
          />
        </div>
      )}

      {/* Balanced Radial Gradient: Protects readability without blacking out the image */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: 'radial-gradient(120% 85% at 75% 20%, rgba(40, 52, 85, 0.40) 0%, rgba(16, 19, 29, 0.65) 50%, rgba(12, 13, 15, 0.88) 100%)',
        }}
      />

      {/* Dynamic Accent Ambient Glow blob */}
      <div
        className="absolute top-0 right-0 w-[350px] sm:w-[550px] h-[350px] sm:h-[550px] rounded-full pointer-events-none blur-3xl opacity-35 transition-all duration-700 z-10"
        style={{
          background: 'radial-gradient(circle, var(--accent-glow) 0%, rgba(0,0,0,0) 70%)',
        }}
      />

      {/* Cinematic Vignette Gradients: Soft text legibility protection */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(12, 13, 15, 0.92) 0%, rgba(16, 19, 29, 0.60) 40%, transparent 100%)',
        }}
      />
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(to right, rgba(12, 13, 15, 0.92) 0%, rgba(16, 19, 29, 0.55) 45%, transparent 100%)',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none z-10" />

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
          {content.genres && content.genres.length > 0 && (
            <span className="text-xs font-mono text-[var(--text-muted)] hidden sm:inline">
              • {content.genres.slice(0, 2).join(' / ')}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="font-display font-extrabold text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-[var(--text-primary)] tracking-tight leading-[1.08] drop-shadow-md">
          {content.title}
        </h1>

        {/* Subtitle / Description */}
        <p className="text-sm sm:text-base md:text-lg text-[var(--text-secondary)] max-w-2xl line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow">
          {content.description || content.subtitle}
        </p>

        {/* Primary Call to Action Button Row */}
        <div className="pt-2 sm:pt-4 flex flex-wrap items-center gap-3 sm:gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={() => onPlay?.(content)}
            leftIcon={<Play className="w-5 h-5 fill-current" />}
            className="shadow-lg shadow-[var(--accent-primary)]/20"
          >
            Play Preview
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => onInfo?.(content)}
            leftIcon={<Info className="w-5 h-5" />}
          >
            More Info
          </Button>

          <IconButton
            icon={isSaved ? <Check className="w-5 h-5 text-[var(--accent-primary)]" /> : <Plus className="w-5 h-5" />}
            aria-label={isSaved ? 'Remove from My List' : 'Add to My List'}
            onClick={() => onAddToList?.(content)}
            variant={isSaved ? 'outline' : 'ghost'}
            className="rounded-full w-11 h-11 border border-white/20 bg-black/40 hover:bg-black/60 backdrop-blur-md"
          />
        </div>
      </motion.div>
    </section>
  )
}
