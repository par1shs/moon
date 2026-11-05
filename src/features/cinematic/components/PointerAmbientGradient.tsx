import React, { useEffect, useRef } from 'react'
import { useReducedMotionPreference } from '../../../hooks/useReducedMotionPreference'

/**
 * High-performance pointer-following ambient gradient.
 * Uses requestAnimationFrame and CSS custom properties without React re-renders.
 * Automatically adapts to active profile accent and respects fine pointer/reduced motion.
 */
export const PointerAmbientGradient: React.FC = () => {
  const lightRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotionPreference()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const isFinePointer = window.matchMedia('(pointer: fine)').matches

    // If coarse touch device or reduced motion is preferred, use a static centered ambient aura
    if (!isFinePointer || reducedMotion) {
      if (lightRef.current) {
        lightRef.current.style.transform = `translate3d(${window.innerWidth * 0.5}px, ${window.innerHeight * 0.35}px, 0)`
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
    if (lightRef.current) {
      lightRef.current.style.transform = `translate3d(${currentX.toFixed(1)}px, ${currentY.toFixed(1)}px, 0)`
    }

    const updatePosition = () => {
      // Smooth cinematic dampening
      const ease = 0.12
      const dx = targetX - currentX
      const dy = targetY - currentY

      currentX += dx * ease
      currentY += dy * ease

      if (lightRef.current) {
        // High-performance compositor transform (bypasses CSS variable recalculation & style invalidation)
        lightRef.current.style.transform = `translate3d(${currentX.toFixed(1)}px, ${currentY.toFixed(1)}px, 0)`
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
      data-testid="pointer-ambient-gradient"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* 
        Subtle pointer-following ambient cinematic illumination.
        Blends active profile accent with soft exponential falloff into Midnight Slate.
        Composited via GPU hardware transform: translate3d for 60/120fps fluid responsiveness.
      */}
      <div
        ref={lightRef}
        className="absolute top-0 left-0 w-[800px] h-[800px] -ml-[400px] -mt-[400px] rounded-full pointer-events-none transition-opacity duration-500 opacity-24 will-change-transform"
        style={{
          background:
            'radial-gradient(circle at center, var(--accent-glow) 0%, var(--pointer-ambient-falloff, rgba(36, 43, 64, 0.28)) 32%, transparent 70%)',
        }}
      />
    </div>
  )
}
