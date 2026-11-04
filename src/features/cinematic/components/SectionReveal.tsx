import React, { useEffect, useRef, useState } from 'react'
import { useReducedMotionPreference } from '../../../hooks/useReducedMotionPreference'

export interface SectionRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
  durationMs?: number
  threshold?: number
  rootMargin?: string
  'data-testid'?: string
}

/**
 * SectionReveal
 *
 * Cinematic reveal wrapper using IntersectionObserver.
 * Triggers when the section is substantially inside the viewport (threshold: 0.18)
 * and glides up smoothly and deliberately over 1200ms (or custom durationMs)
 * with a graceful ease-out curve, ensuring the transition is clearly observable.
 * Disconnects/unobserves after triggering once.
 * Immediately visible when prefers-reduced-motion is enabled.
 */
export const SectionReveal: React.FC<SectionRevealProps> = ({
  children,
  className = '',
  delay = 0,
  durationMs = 1200,
  threshold = 0.18,
  rootMargin = '0px 0px -50px 0px',
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
        transform: isVisible ? 'translateY(0)' : 'translateY(28px)',
        transition: reducedMotion
          ? 'none'
          : `opacity ${durationMs}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform ${durationMs}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
        willChange: isVisible ? 'auto' : 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}
