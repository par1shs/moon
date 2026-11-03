import React, { useEffect, useRef, useState } from 'react'
import { useCustomCursorSetting } from '../hooks/useCustomCursorSetting'
import { useReducedMotionPreference } from '../../../hooks/useReducedMotionPreference'

/**
 * Custom Miniature Cinema Projector Cursor.
 * Features:
 * - Vintage-inspired 35mm projector geometry with dual film reels, lens, and directional volumetric light beam.
 * - Reactive states: subtle default, lens flare & scale on clickable elements, automatic hide over text inputs, aperture flash on click.
 * - Fully accessible: pointer-events: none, native click/drag functionality intact.
 * - Zero React re-renders on movement (driven by requestAnimationFrame and DOM transforms).
 * - Desktop fine-pointer only (disabled on touchscreens).
 */
export const CinemaProjectorCursor: React.FC = () => {
  const { isCursorEnabled } = useCustomCursorSetting()
  const reducedMotion = useReducedMotionPreference()
  const cursorRef = useRef<HTMLDivElement>(null)
  const beamRef = useRef<SVGPolygonElement>(null)
  const flashRef = useRef<SVGCircleElement>(null)
  const reelsRef = useRef<SVGGElement>(null)

  const [isFinePointer, setIsFinePointer] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(pointer: fine)').matches
  })

  // Watch fine-pointer media query changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(pointer: fine)')
    const handleChange = (e: MediaQueryListEvent) => setIsFinePointer(e.matches)
    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [])

  // Toggle body class to hide default OS cursor when cinema projector is active
  useEffect(() => {
    if (typeof document === 'undefined') return
    const shouldActivate = isCursorEnabled && isFinePointer

    if (shouldActivate) {
      document.body.classList.add('has-cinema-cursor')
    } else {
      document.body.classList.remove('has-cinema-cursor')
    }

    return () => {
      document.body.classList.remove('has-cinema-cursor')
    }
  }, [isCursorEnabled, isFinePointer])

  // Direct rAF pointer tracking & state management
  useEffect(() => {
    if (!isCursorEnabled || !isFinePointer) return

    let targetX = -100
    let targetY = -100
    let currentX = -100
    let currentY = -100
    let isMoving = false
    let isHoveringClickable = false
    let isHoveringTextInput = false
    let isVisible = false
    let reelRotation = 0
    let rafId: number | null = null

    const updateTransform = () => {
      const ease = reducedMotion ? 1.0 : 0.22
      const dx = targetX - currentX
      const dy = targetY - currentY

      currentX += dx * ease
      currentY += dy * ease

      // Subtle film reel rotation as pointer glides across canvas
      if (!reducedMotion) {
        const speed = Math.hypot(dx, dy)
        reelRotation = (reelRotation + speed * 0.4) % 360
        if (reelsRef.current) {
          reelsRef.current.style.transform = `rotate(${reelRotation.toFixed(1)}deg)`
        }
      }

      if (cursorRef.current) {
        // Offset lens aperture right to pointer hotspot
        cursorRef.current.style.transform = `translate3d(${(currentX - 5).toFixed(1)}px, ${(currentY - 5).toFixed(1)}px, 0)`
      }

      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        rafId = requestAnimationFrame(updateTransform)
      } else {
        isMoving = false
      }
    }

    const handlePointerMove = (e: PointerEvent) => {
      targetX = e.clientX
      targetY = e.clientY

      if (!isVisible) {
        isVisible = true
        if (cursorRef.current && !isHoveringTextInput) {
          cursorRef.current.style.opacity = '1'
        }
      }

      // Check element under pointer
      const target = e.target as HTMLElement | null
      if (target) {
        const textInputElem = target.closest(
          'input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]'
        )
        const isNowTextInput = Boolean(textInputElem)

        if (isNowTextInput !== isHoveringTextInput) {
          isHoveringTextInput = isNowTextInput
          if (cursorRef.current) {
            cursorRef.current.style.opacity = isNowTextInput ? '0' : '1'
          }
        }

        if (!isNowTextInput) {
          const clickableElem = target.closest(
            'button, a, [role="button"], [tabindex="0"], .cursor-pointer, input[type="button"], input[type="submit"], [data-clickable="true"]'
          )
          const isNowClickable = Boolean(clickableElem)

          if (isNowClickable !== isHoveringClickable) {
            isHoveringClickable = isNowClickable
            if (cursorRef.current) {
              cursorRef.current.classList.toggle('cursor-hover-clickable', isNowClickable)
            }
            if (beamRef.current) {
              beamRef.current.style.opacity = isNowClickable ? '0.70' : '0.28'
            }
          }
        }
      }

      if (!isMoving) {
        isMoving = true
        rafId = requestAnimationFrame(updateTransform)
      }
    }

    const handlePointerDown = () => {
      if (cursorRef.current) {
        cursorRef.current.classList.add('cursor-active-click')
      }
      // Brief aperture flash
      if (flashRef.current) {
        flashRef.current.style.opacity = '1'
        setTimeout(() => {
          if (flashRef.current) flashRef.current.style.opacity = '0'
        }, 110)
      }
    }

    const handlePointerUp = () => {
      if (cursorRef.current) {
        cursorRef.current.classList.remove('cursor-active-click')
      }
    }

    const handleMouseLeave = () => {
      isVisible = false
      if (cursorRef.current) {
        cursorRef.current.style.opacity = '0'
      }
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerdown', handlePointerDown, { passive: true })
    window.addEventListener('pointerup', handlePointerUp, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointerup', handlePointerUp)
      document.removeEventListener('mouseleave', handleMouseLeave)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [isCursorEnabled, isFinePointer, reducedMotion])

  if (!isCursorEnabled || !isFinePointer) {
    return null
  }

  return (
    <div
      ref={cursorRef}
      data-testid="cinema-projector-cursor"
      className="fixed top-0 left-0 pointer-events-none z-[9999] select-none opacity-0 transition-opacity duration-150 will-change-transform"
      style={{
        width: '68px',
        height: '34px',
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 68 34"
        width="68"
        height="34"
        className="w-full h-full overflow-visible transition-transform duration-150"
      >
        <defs>
          {/* Volumetric projection beam gradient tied directly to active profile accent */}
          <linearGradient id="cinema-lens-beam-grad" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.85" />
            <stop offset="30%" stopColor="var(--accent-glow)" stopOpacity="0.38" />
            <stop offset="70%" stopColor="var(--accent-glow)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>

          {/* Aperture flash filter */}
          <radialGradient id="aperture-flash-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="40%" stopColor="var(--accent-primary)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ─── 1. Volumetric Light Beam ─── */}
        <polygon
          ref={beamRef}
          data-testid="cursor-light-beam"
          points="28.5,15.5 66,7 66,29 28.5,20.5"
          fill="url(#cinema-lens-beam-grad)"
          className="transition-opacity duration-200"
          style={{ opacity: 0.28 }}
        />

        {/* ─── 2. Cinema Projector Hardware Group ─── */}
        <g className="cinema-projector-body-group">
          {/* Shadow beneath chassis */}
          <rect
            x="7"
            y="26"
            width="17"
            height="2"
            rx="1"
            className="fill-black/40"
          />

          {/* Dual Film Reels on Top (Spins on pointer movement) */}
          <g
            ref={reelsRef}
            style={{
              transformOrigin: '14px 6px',
            }}
          >
            {/* Supply Reel (Left) */}
            <circle
              cx="9"
              cy="6"
              r="4.5"
              className="fill-[#FAF6F0] dark:fill-[#FAF6F0] light:fill-[#1E2538] stroke-[#C9C3B6] dark:stroke-[#5A647E] light:stroke-[#0F131D]"
              strokeWidth="0.8"
            />
            <circle cx="9" cy="6" r="1.3" className="fill-[#1B2130] dark:fill-[#1B2130] light:fill-[#BAC7DE]" />
            <line x1="9" y1="2" x2="9" y2="4.8" stroke="currentColor" strokeWidth="0.6" className="text-[#3E4A68] dark:text-[#8E9AB6] light:text-[#4F5D7E]" />
            <line x1="6.5" y1="7.5" x2="8" y2="6.5" stroke="currentColor" strokeWidth="0.6" className="text-[#3E4A68] dark:text-[#8E9AB6] light:text-[#4F5D7E]" />
            <line x1="11.5" y1="7.5" x2="10" y2="6.5" stroke="currentColor" strokeWidth="0.6" className="text-[#3E4A68] dark:text-[#8E9AB6] light:text-[#4F5D7E]" />

            {/* Take-up Reel (Right) */}
            <circle
              cx="19"
              cy="6"
              r="4.5"
              className="fill-[#FAF6F0] dark:fill-[#FAF6F0] light:fill-[#1E2538] stroke-[#C9C3B6] dark:stroke-[#5A647E] light:stroke-[#0F131D]"
              strokeWidth="0.8"
            />
            <circle cx="19" cy="6" r="1.3" className="fill-[#1B2130] dark:fill-[#1B2130] light:fill-[#BAC7DE]" />
            <line x1="19" y1="2" x2="19" y2="4.8" stroke="currentColor" strokeWidth="0.6" className="text-[#3E4A68] dark:text-[#8E9AB6] light:text-[#4F5D7E]" />
            <line x1="16.5" y1="7.5" x2="18" y2="6.5" stroke="currentColor" strokeWidth="0.6" className="text-[#3E4A68] dark:text-[#8E9AB6] light:text-[#4F5D7E]" />
            <line x1="21.5" y1="7.5" x2="20" y2="6.5" stroke="currentColor" strokeWidth="0.6" className="text-[#3E4A68] dark:text-[#8E9AB6] light:text-[#4F5D7E]" />

            {/* Film path snippet between reels */}
            <path
              d="M 11.5 7.2 Q 14 10 16.5 7.2"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
              className="text-[#3E4A68] dark:text-[#8E9AB6] light:text-[#4F5D7E]"
            />
          </g>

          {/* Projector Chassis Body (High contrast in both Dark and Light modes) */}
          <rect
            x="6"
            y="11"
            width="18"
            height="14"
            rx="2"
            className="fill-[#FAF6F0] dark:fill-[#FAF6F0] light:fill-[#182030] stroke-[#D5CFC5] dark:stroke-[#4B556E] light:stroke-[#0C101A]"
            strokeWidth="0.9"
          />

          {/* Ventilation Louver Ribs */}
          <line x1="8.5" y1="14.5" x2="13.5" y2="14.5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" className="text-[#A59F93] dark:text-[#4F5A77] light:text-[#64748B]" />
          <line x1="8.5" y1="17" x2="13.5" y2="17" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" className="text-[#A59F93] dark:text-[#4F5A77] light:text-[#64748B]" />
          <line x1="8.5" y1="19.5" x2="13.5" y2="19.5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" className="text-[#A59F93] dark:text-[#4F5A77] light:text-[#64748B]" />

          {/* Drive Knob / Motor Hub Dial */}
          <circle cx="18.5" cy="18" r="2.2" className="fill-[#343E56] dark:fill-[#343E56] light:fill-[#BAC7DE]" />
          <circle cx="18.5" cy="18" r="0.8" className="fill-[#FAF6F0] dark:fill-[#FAF6F0] light:fill-[#182030]" />

          {/* Lens Barrel Assembly */}
          <rect
            x="23.5"
            y="14"
            width="3.5"
            height="8"
            rx="0.8"
            className="fill-[#2B354C] dark:fill-[#2B354C] light:fill-[#475569]"
          />

          {/* Lens Bezel Rim */}
          <rect
            x="26.5"
            y="13"
            width="2.2"
            height="10"
            rx="0.8"
            className="fill-[#FAF6F0] dark:fill-[#FAF6F0] light:fill-[#182030] stroke-[#A59F93] dark:stroke-[#627092] light:stroke-[#0F131D]"
            strokeWidth="0.6"
          />

          {/* Optical Glass Lens Element (Tinted with active profile accent) */}
          <ellipse
            cx="28.5"
            cy="18"
            rx="0.9"
            ry="3.5"
            className="fill-[var(--accent-primary)] shadow-sm"
          />

          {/* Aperture Flash Element (Flashes on Click) */}
          <circle
            ref={flashRef}
            data-testid="cursor-lens-flash"
            cx="28.5"
            cy="18"
            r="4.5"
            fill="url(#aperture-flash-grad)"
            className="opacity-0 transition-opacity duration-100 pointer-events-none"
          />
        </g>
      </svg>
    </div>
  )
}
