import React, { useRef, useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { IconButton } from './IconButton'

export interface HorizontalCarouselProps {
  children: React.ReactNode
  title?: string
  eyebrow?: string
  subtitle?: string
  className?: string
  scrollStep?: number // pixels to scroll per click, defaults to 600
}

export const HorizontalCarousel: React.FC<HorizontalCarouselProps> = ({
  children,
  title,
  eyebrow,
  subtitle,
  className = '',
  scrollStep = 600,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 10)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }, [])

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true })
      window.addEventListener('resize', checkScroll)
    }
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [checkScroll])

  const scrollBy = (offset: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' })
    }
  }

  return (
    <div className={`relative group/carousel w-full ${className}`}>
      {/* Header with Title and Scroll Controls */}
      {(title || eyebrow) && (
        <div className="flex items-end justify-between mb-4">
          <div>
            {eyebrow && (
              <span className="block text-xs uppercase font-mono font-semibold tracking-wider text-[var(--accent-secondary)] mb-1">
                {eyebrow}
              </span>
            )}
            {title && (
              <h3 className="font-display text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
                {subtitle}
              </p>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="hidden sm:flex items-center gap-2">
            <IconButton
              icon={<ChevronLeft className="w-5 h-5" />}
              aria-label="Scroll left"
              variant="secondary"
              size="sm"
              disabled={!canScrollLeft}
              onClick={() => scrollBy(-scrollStep)}
            />
            <IconButton
              icon={<ChevronRight className="w-5 h-5" />}
              aria-label="Scroll right"
              variant="secondary"
              size="sm"
              disabled={!canScrollRight}
              onClick={() => scrollBy(scrollStep)}
            />
          </div>
        </div>
      )}

      {/* Track Container */}
      <div className="relative">
        {/* Left gradient fade & quick control for desktop */}
        {canScrollLeft && (
          <div className="hidden md:flex absolute -left-3 top-0 bottom-0 z-30 items-center justify-start pointer-events-none">
            <div className="pointer-events-auto">
              <IconButton
                icon={<ChevronLeft className="w-6 h-6" />}
                aria-label="Previous items"
                variant="elevated"
                size="md"
                onClick={() => scrollBy(-scrollStep)}
              />
            </div>
          </div>
        )}

        {/* Scrollable Track */}
        <div
          ref={scrollRef}
          className="flex items-stretch gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {children}
        </div>

        {/* Right gradient fade & quick control for desktop */}
        {canScrollRight && (
          <div className="hidden md:flex absolute -right-3 top-0 bottom-0 z-30 items-center justify-end pointer-events-none">
            <div className="pointer-events-auto">
              <IconButton
                icon={<ChevronRight className="w-6 h-6" />}
                aria-label="Next items"
                variant="elevated"
                size="md"
                onClick={() => scrollBy(scrollStep)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
