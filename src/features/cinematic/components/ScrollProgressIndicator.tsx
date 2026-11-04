import React, { useEffect, useRef } from 'react'
import { scrollCoordinator } from '../../../utils/scrollCoordinator'

/**
 * ScrollProgressIndicator
 *
 * Pinned to the top of the viewport (2px height).
 * Smoothly expands using direct DOM transform: scaleX(progress) driven by
 * the unified high-performance scrollCoordinator to eliminate forced reflows.
 * Styled with active profile accent color and ambient glow.
 */
export const ScrollProgressIndicator: React.FC = () => {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return scrollCoordinator.subscribe((scrollTop, maxScroll) => {
      if (!barRef.current) return
      const progress = maxScroll > 0 ? Math.min(Math.max(scrollTop / maxScroll, 0), 1) : 0
      barRef.current.style.transform = `scaleX(${progress})`
    })
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
        className="w-full h-full bg-[var(--accent-primary)] origin-left will-change-transform shadow-[0_0_8px_var(--accent-glow)]"
        style={{ transformOrigin: '0% 50%', transform: 'scaleX(0)' }}
      />
    </div>
  )
}
