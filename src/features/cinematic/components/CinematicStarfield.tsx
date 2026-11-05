import React, { memo } from 'react'
import { useReducedMotionPreference } from '../../../hooks/useReducedMotionPreference'

export interface CinematicStarfieldProps {
  className?: string
  /** Whether the starfield is currently visible (for smooth cinematic transitions) */
  visible?: boolean
  /** Star count and distribution preset */
  density?: 'dense' | 'subtle'
  /** Whether to tint a few stars with the active profile accent */
  showAccentStars?: boolean
  /** Base opacity multiplier */
  opacity?: number
  /** Test identifier */
  testId?: string
}

interface StarItem {
  id: string
  x: number
  y: number
  r: number
  baseOpacity: number
  colorType: 'cool' | 'white' | 'ivory' | 'indigo' | 'accent'
  hasGlow?: boolean
  twinkle?: {
    duration: number
    delay: number
    dimOpacity: number
  }
}

/**
 * Deterministic pseudo-random number generator (Mulberry32).
 * Guarantees 100% reproducible star distributions without hydration mismatches.
 */
function createPrng(seed: number) {
  let s = seed
  return () => {
    let t = (s += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Dense preset (~120 stars): Used in My List, Devices, and Membership.
 * Pure static SVG with 8 gently twinkling stars using CSS opacity.
 */
function generateDenseStars(): StarItem[] {
  const rng = createPrng(404)
  const stars: StarItem[] = []
  const twinkleIndices = new Set([9, 22, 38, 55, 68, 83, 97, 112])
  const accentIndices = new Set([14, 45, 77, 105])
  const durations = [3.8, 4.4, 5.1, 5.8, 4.2, 5.4, 6.0, 4.8]
  const delays = [0.4, 1.2, 2.1, 3.2, 0.8, 1.9, 2.7, 3.8]
  let t = 0

  const cols = 12
  const rows = 10

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c
      const x = ((c + 0.08 + rng() * 0.84) / cols) * 1600
      const y = ((r + 0.06 + rng() * 0.88) / rows) * 1000

      // Varied sizes: predominantly 1–2px (radii 0.65–1.1px), few slightly brighter (1.3–1.8px)
      const sizeRoll = rng()
      let radius = 0.65 + rng() * 0.45 // ~1.3–2.2px diameter
      let baseOpacity = 0.48 + rng() * 0.28 // 0.48–0.76
      let hasGlow = false

      if (sizeRoll > 0.88) {
        radius = 1.35 + rng() * 0.45 // ~2.7–3.6px diameter
        baseOpacity = 0.78 + rng() * 0.18 // 0.78–0.96
        hasGlow = true
      }

      const isAccent = accentIndices.has(idx)
      const isTwinkle = twinkleIndices.has(idx)

      let colorType: StarItem['colorType'] = 'cool'
      const colorRoll = rng()
      if (isAccent) {
        colorType = 'accent'
      } else if (colorRoll < 0.45) {
        colorType = 'white'
      } else if (colorRoll < 0.72) {
        colorType = 'cool'
      } else if (colorRoll < 0.88) {
        colorType = 'ivory'
      } else {
        colorType = 'indigo'
      }

      stars.push({
        id: `d-${idx}`,
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        r: Math.round(radius * 100) / 100,
        baseOpacity: Math.round(baseOpacity * 100) / 100,
        colorType,
        hasGlow,
        twinkle: isTwinkle
          ? {
              duration: durations[t],
              delay: delays[t++ % delays.length],
              dimOpacity: Math.round(baseOpacity * 0.22 * 100) / 100,
            }
          : undefined,
      })
    }
  }

  return stars
}

/**
 * Subtle preset (~64 stars): Used in Startup Intro and Profile Welcome.
 * Stationary, understated, non-competing with central logo and avatar.
 */
function generateSubtleStars(): StarItem[] {
  const rng = createPrng(808)
  const stars: StarItem[] = []
  const twinkleIndices = new Set([7, 19, 34, 48, 59])
  const accentIndices = new Set([12, 28, 52])
  const durations = [4.2, 5.0, 5.8, 4.6, 6.2]
  const delays = [0.5, 1.8, 2.9, 1.1, 2.2]
  let t = 0

  const cols = 9
  const rows = 7

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c
      const x = ((c + 0.08 + rng() * 0.84) / cols) * 1600
      const y = ((r + 0.08 + rng() * 0.84) / rows) * 1000

      const sizeRoll = rng()
      let radius = 0.60 + rng() * 0.40 // ~1.2–2.0px diameter
      let baseOpacity = 0.42 + rng() * 0.26 // 0.42–0.68

      if (sizeRoll > 0.90) {
        radius = 1.15 + rng() * 0.35
        baseOpacity = 0.70 + rng() * 0.18
      }

      const isAccent = accentIndices.has(idx)
      const isTwinkle = twinkleIndices.has(idx)

      let colorType: StarItem['colorType'] = 'cool'
      const colorRoll = rng()
      if (isAccent) {
        colorType = 'accent'
      } else if (colorRoll < 0.50) {
        colorType = 'white'
      } else if (colorRoll < 0.80) {
        colorType = 'cool'
      } else {
        colorType = 'ivory'
      }

      stars.push({
        id: `s-${idx}`,
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        r: Math.round(radius * 100) / 100,
        baseOpacity: Math.round(baseOpacity * 100) / 100,
        colorType,
        twinkle: isTwinkle
          ? {
              duration: durations[t],
              delay: delays[t++ % delays.length],
              dimOpacity: Math.round(baseOpacity * 0.25 * 100) / 100,
            }
          : undefined,
      })
    }
  }

  return stars
}

const DENSE_STARS = generateDenseStars()
const SUBTLE_STARS = generateSubtleStars()

const getStarFill = (colorType: StarItem['colorType'], showAccent: boolean): string => {
  switch (colorType) {
    case 'cool':
      return 'var(--star-color-cool)'
    case 'white':
      return 'var(--star-color-white)'
    case 'ivory':
      return 'var(--star-color-ivory)'
    case 'indigo':
      return 'var(--star-color-indigo)'
    case 'accent':
      return showAccent ? 'var(--accent-primary)' : 'var(--star-color-white)'
  }
}

/**
 * CinematicStarfield Component (Reusable & Selective)
 *
 * Provides a lightweight, GPU-composited static starfield atmosphere with
 * gentle asynchronous CSS twinkling and smooth opacity transitions.
 *
 * Free of scroll listeners, JavaScript animation loops, and heavy transforms.
 */
export const CinematicStarfield: React.FC<CinematicStarfieldProps> = memo(
  ({
    className = '',
    visible = true,
    density = 'dense',
    showAccentStars = true,
    opacity = 1,
    testId = 'cinematic-starfield',
  }) => {
    const reducedMotion = useReducedMotionPreference()
    const stars = density === 'dense' ? DENSE_STARS : SUBTLE_STARS

    return (
      <div
        data-testid={testId}
        className={`absolute inset-0 pointer-events-none overflow-hidden select-none ${className}`}
        style={{
          opacity: visible ? opacity : 0,
          visibility: visible ? 'visible' : 'hidden',
          transition: 'opacity 550ms cubic-bezier(0.16, 1, 0.3, 1), visibility 550ms ease-out',
        }}
        aria-hidden="true"
      >
        <svg
          className="w-full h-full pointer-events-none"
          viewBox="0 0 1600 1000"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          {stars.map((star) => {
            const isTwinkle = Boolean(star.twinkle) && !reducedMotion
            const style: React.CSSProperties = {
              opacity: star.baseOpacity,
              ...(star.hasGlow && {
                filter: 'drop-shadow(0 0 2.5px rgba(255, 255, 255, 0.65))',
              }),
            }

            if (isTwinkle && star.twinkle) {
              ;(style as Record<string, string | number>)['--star-base-op'] = star.baseOpacity
              ;(style as Record<string, string | number>)['--star-dim-op'] = star.twinkle.dimOpacity
              style.animationDuration = `${star.twinkle.duration}s`
              style.animationDelay = `${star.twinkle.delay}s`
            }

            return (
              <circle
                key={star.id}
                data-testid={`star-${star.id}`}
                cx={star.x}
                cy={star.y}
                r={star.r}
                fill={getStarFill(star.colorType, showAccentStars)}
                className={isTwinkle ? 'star-twinkle' : undefined}
                style={style}
              />
            )
          })}
        </svg>
      </div>
    )
  }
)

CinematicStarfield.displayName = 'CinematicStarfield'
