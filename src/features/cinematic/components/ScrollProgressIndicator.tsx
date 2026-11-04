import React, { useEffect, useRef } from 'react'

/**
 * ScrollProgressIndicator
 *
 * Pinned to the top of the viewport (2px height).
 * Smoothly expands using direct DOM transform: scaleX(progress) driven by
 * a passive scroll listener and requestAnimationFrame to ensure zero React re-renders.
 * Styled with active profile accent color and ambient glow.
 */
export const ScrollProgressIndicator: React.FC = () => {
  const barRef = useRef<HTMLDivElement>(null)
  const rafIdRef = useRef<number | null>(null)

  useEffect(() => {
    const updateProgress = () => {
      if (!barRef.current) return

      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight

      const progress = scrollHeight > 0 ? Math.min(Math.max(scrollTop / scrollHeight, 0), 1) : 0

      barRef.current.style.transform = `scaleX(${progress})`
    }

    const onScroll = () => {
      if (rafIdRef.current !== null) return
      rafIdRef.current = requestAnimationFrame(() => {
        updateProgress()
        rafIdRef.current = null
      })
    }

    // Initial calculation
    updateProgress()

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [])

  return (
    <div
      data-testid="scroll-progress-indicator"
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-[2px] z-50 pointer-events-none overflow-hidden"
    >
      <div
        ref={barRef}
        data-testid="scroll-progress-bar"
        className="w-full h-full bg-[var(--accent-primary)] origin-left will-change-transform transition-transform duration-75 ease-out shadow-[0_0_8px_var(--accent-glow)]"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  )
}
