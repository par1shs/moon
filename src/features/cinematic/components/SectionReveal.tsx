import React, { useEffect, useRef, useState } from 'react'
import { useReducedMotionPreference } from '../../../hooks/useReducedMotionPreference'

export interface SectionRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
  threshold?: number
  rootMargin?: string
  'data-testid'?: string
}

/**
 * SectionReveal
 *
 * Cinematic reveal wrapper using IntersectionObserver.
 * Fades section container from opacity 0 -> 1 and translates upward by 12px
 * with a 380ms ease-out curve once it enters viewport.
 * Disconnects/unobserves after triggering once.
 * Immediately visible when prefers-reduced-motion is enabled.
 */
export const SectionReveal: React.FC<SectionRevealProps> = ({
  children,
  className = '',
  delay = 0,
  threshold = 0.08,
  rootMargin = '0px 0px -40px 0px',
  'data-testid': testId,
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [hasIntersected, setHasIntersected] = useState(
    () => typeof IntersectionObserver === 'undefined'
  )
  const reducedMotion = useReducedMotionPreference()
  const isVisible = hasIntersected || reducedMotion

  useEffect(() => {
    if (reducedMotion || typeof IntersectionObserver === 'undefined') return

    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry && entry.isIntersecting) {
          setHasIntersected(true)
          observer.unobserve(element)
        }
      },
      {
        threshold,
        rootMargin,
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [reducedMotion, threshold, rootMargin])

  return (
    <div
      ref={ref}
      data-testid={testId || 'section-reveal'}
      data-revealed={isVisible ? 'true' : 'false'}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
        transition: reducedMotion
          ? 'none'
          : `opacity 380ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 380ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: isVisible ? 'auto' : 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}
