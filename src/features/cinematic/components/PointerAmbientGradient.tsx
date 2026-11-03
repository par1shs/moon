import React, { useEffect, useRef } from 'react'
import { useReducedMotionPreference } from '../../../hooks/useReducedMotionPreference'

/**
 * High-performance pointer-following ambient gradient.
 * Uses requestAnimationFrame and CSS custom properties without React re-renders.
 * Automatically adapts to active profile accent and respects fine pointer/reduced motion.
 */
export const PointerAmbientGradient: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotionPreference()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const isFinePointer = window.matchMedia('(pointer: fine)').matches

    // If coarse touch device or reduced motion is preferred, use a static centered ambient aura
    if (!isFinePointer || reducedMotion) {
      if (containerRef.current) {
        containerRef.current.style.setProperty('--pointer-x', '50vw')
        containerRef.current.style.setProperty('--pointer-y', '35vh')
      }
      return
    }

    let targetX = window.innerWidth / 2
    let targetY = window.innerHeight / 2
    let currentX = targetX
    let currentY = targetY
    let isMoving = false
    let rafId: number | null = null

    // Initialize starting position
    if (containerRef.current) {
      containerRef.current.style.setProperty('--pointer-x', `${currentX}px`)
      containerRef.current.style.setProperty('--pointer-y', `${currentY}px`)
    }

    const updatePosition = () => {
      // Smooth cinematic dampening
      const ease = 0.12
      const dx = targetX - currentX
      const dy = targetY - currentY

      currentX += dx * ease
      currentY += dy * ease

      if (containerRef.current) {
        containerRef.current.style.setProperty('--pointer-x', `${currentX.toFixed(1)}px`)
        containerRef.current.style.setProperty('--pointer-y', `${currentY.toFixed(1)}px`)
      }

      // Automatically halt the rAF loop when movement settles to preserve CPU & GPU
      if (Math.abs(dx) > 0.2 || Math.abs(dy) > 0.2) {
        rafId = requestAnimationFrame(updatePosition)
      } else {
        isMoving = false
      }
    }

    const handlePointerMove = (e: PointerEvent) => {
      targetX = e.clientX
      targetY = e.clientY

      if (!isMoving) {
        isMoving = true
        rafId = requestAnimationFrame(updatePosition)
      }
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [reducedMotion])

  return (
    <div
      ref={containerRef}
      data-testid="pointer-ambient-gradient"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
      style={
        {
          '--pointer-x': '50vw',
          '--pointer-y': '35vh',
        } as React.CSSProperties
      }
    >
      {/* 
        Subtle pointer-following ambient cinematic illumination.
        Blends active profile accent with soft exponential falloff into Midnight Slate.
      */}
      <div
        className="absolute inset-0 transition-opacity duration-500 opacity-24"
        style={{
          background:
            'radial-gradient(750px circle at var(--pointer-x) var(--pointer-y), var(--accent-glow) 0%, rgba(36, 43, 64, 0.28) 32%, transparent 70%)',
        }}
      />
    </div>
  )
}
