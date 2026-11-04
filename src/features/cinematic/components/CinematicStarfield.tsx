import React, { useEffect, useRef, memo } from 'react'
import { scrollCoordinator } from '../../../utils/scrollCoordinator'
import { useReducedMotionPreference } from '../../../hooks/useReducedMotionPreference'

export interface CinematicStarfieldProps {
  isPlayerOpen?: boolean
}

interface StarItem {
  id: string
  x: number
  y: number
  r: number
  baseOpacity: number
  colorType: 'cool' | 'white' | 'ivory' | 'indigo' | 'accent'
  twinkle?: {
    duration: number
    delay: number
    dimOpacity: number
  }
}

/**
 * Deterministic pseudo-random number generator (Mulberry32).
 * Guarantees 100% reproducible star distributions across renders and SSR.
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
 * Pre-generate the 3 celestial starfield depth layers once at module level.
 * Total: 156 stars (88 distant, 48 mid, 20 foreground).
 * Twinkling: 11 stars total (~7.1%), individually delayed with 3.3s–6.8s cycles.
 */
function generateStarLayers(): {
  layer1: StarItem[]
  layer2: StarItem[]
  layer3: StarItem[]
} {
  const rng = createPrng(1337)

  // ─── Layer 1: Distant Stars (88 stars: 11 cols x 8 rows) ───
  // Highest density, smallest sizes (0.8–1.3px), faint opacity (0.22–0.44), slowest parallax (~8px)
  const layer1: StarItem[] = []
  const twinkleL1 = new Set([7, 23, 49, 71])
  const l1Durations = [4.8, 5.6, 6.2, 6.8]
  const l1Delays = [0.5, 1.8, 3.1, 4.4]
  let t1 = 0

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 11; c++) {
      const idx = r * 11 + c
      const x = ((c + 0.12 + rng() * 0.76) / 11) * 1600
      const y = ((r + 0.12 + rng() * 0.76) / 8) * 1000
      const radius = 0.45 + rng() * 0.25 // diameter ~0.9–1.4px
      const baseOpacity = 0.22 + rng() * 0.22
      const colorType: StarItem['colorType'] = rng() > 0.28 ? 'cool' : 'white'
      const isTwinkle = twinkleL1.has(idx)

      layer1.push({
        id: `s1-${idx}`,
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        r: Math.round(radius * 100) / 100,
        baseOpacity: Math.round(baseOpacity * 100) / 100,
        colorType,
        twinkle: isTwinkle
          ? {
              duration: l1Durations[t1],
              delay: l1Delays[t1++],
              dimOpacity: Math.round(baseOpacity * 0.25 * 100) / 100,
            }
          : undefined,
      })
    }
  }

  // ─── Layer 2: Mid-Distance Stars (48 stars: 8 cols x 6 rows) ───
  // Medium density, medium sizes (1.4–2.0px), moderate opacity (0.44–0.68), medium parallax (~16px)
  const layer2: StarItem[] = []
  const twinkleL2 = new Set([5, 18, 31, 42])
  const l2Durations = [3.8, 4.5, 5.2, 5.9]
  const l2Delays = [0.8, 1.9, 2.7, 4.1]
  let t2 = 0

  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 8; c++) {
      const idx = r * 8 + c
      const x = ((c + 0.10 + rng() * 0.80) / 8) * 1600
      const y = ((r + 0.10 + rng() * 0.80) / 6) * 1000
      const radius = 0.72 + rng() * 0.30 // diameter ~1.4–2.0px
      const baseOpacity = 0.44 + rng() * 0.24
      const colorRoll = rng()
      const colorType: StarItem['colorType'] =
        colorRoll < 0.6 ? 'white' : colorRoll < 0.82 ? 'ivory' : 'indigo'
      const isTwinkle = twinkleL2.has(idx)

      layer2.push({
        id: `s2-${idx}`,
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        r: Math.round(radius * 100) / 100,
        baseOpacity: Math.round(baseOpacity * 100) / 100,
        colorType,
        twinkle: isTwinkle
          ? {
              duration: l2Durations[t2],
              delay: l2Delays[t2++],
              dimOpacity: Math.round(baseOpacity * 0.28 * 100) / 100,
            }
          : undefined,
      })
    }
  }

  // ─── Layer 3: Foreground Stars (20 stars: 5 cols x 4 rows) ───
  // Lower density, brighter stars (2.1–2.6px), bright opacity (0.65–0.85), faster parallax (~24px)
  const layer3: StarItem[] = []
  const twinkleL3 = new Set([4, 12, 19])
  const accentL3 = new Set([3, 11, 17])
  const l3Durations = [3.3, 4.1, 4.7]
  const l3Delays = [0.3, 1.4, 2.6]
  let t3 = 0

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 5; c++) {
      const idx = r * 5 + c
      const x = ((c + 0.08 + rng() * 0.84) / 5) * 1600
      const y = ((r + 0.08 + rng() * 0.84) / 4) * 1000
      const radius = 1.05 + rng() * 0.25 // diameter ~2.1–2.6px
      const baseOpacity = 0.65 + rng() * 0.20
      const isAccent = accentL3.has(idx)
      const isTwinkle = twinkleL3.has(idx)

      let colorType: StarItem['colorType'] = 'white'
      if (isAccent) {
        colorType = 'accent'
      } else if (rng() < 0.3) {
        colorType = 'ivory'
      }

      layer3.push({
        id: `s3-${idx}`,
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        r: Math.round(radius * 100) / 100,
        baseOpacity: isAccent ? 0.62 : Math.round(baseOpacity * 100) / 100,
        colorType,
        twinkle: isTwinkle
          ? {
              duration: l3Durations[t3],
              delay: l3Delays[t3++],
              dimOpacity: Math.round(baseOpacity * 0.30 * 100) / 100,
            }
          : undefined,
      })
    }
  }

  return { layer1, layer2, layer3 }
}

const { layer1: STAR_LAYER_1, layer2: STAR_LAYER_2, layer3: STAR_LAYER_3 } =
  generateStarLayers()

const getStarFill = (colorType: StarItem['colorType']): string => {
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
      return 'var(--accent-primary)'
  }
}

/**
 * Render an individual SVG star layer
 */
const StarSvgLayer: React.FC<{
  stars: StarItem[]
  testIdPrefix: string
}> = memo(({ stars, testIdPrefix }) => {
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 1600 1000"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {stars.map((star) => {
        const isTwinkle = Boolean(star.twinkle)
        const style: React.CSSProperties = {
          opacity: star.baseOpacity,
        }

        if (star.twinkle) {
          ;(style as Record<string, string | number>)['--star-base-op'] = star.baseOpacity
          ;(style as Record<string, string | number>)['--star-dim-op'] = star.twinkle.dimOpacity
          style.animationDuration = `${star.twinkle.duration}s`
          style.animationDelay = `${star.twinkle.delay}s`
        }

        return (
          <circle
            key={star.id}
            data-testid={`${testIdPrefix}-${star.id}`}
            cx={star.x}
            cy={star.y}
            r={star.r}
            fill={getStarFill(star.colorType)}
            className={isTwinkle ? 'star-twinkle' : undefined}
            style={style}
          />
        )
      })}
    </svg>
  )
})

StarSvgLayer.displayName = 'StarSvgLayer'

/**
 * CinematicStarfield Component
 *
 * Implements a subtle, dense, 3-layer parallax starfield embedded into PIXEL's
 * atmospheric night sky background.
 *
 * Key features:
 * - 3 independent depth layers (Distant, Mid-Distance, Foreground)
 * - Restrained 8–24px smooth transform-based parallax driven by scrollCoordinator
 * - 11 gently twinkling stars (~7.1%) with irregular 3.3–6.8s cycles and varied delays
 * - 100% GPU composited translate3d without React re-renders or layout reflows
 * - Seamless theme support: luminous celestial points in dark mode, soft slate/indigo in light mode
 * - Restrained active profile accent tint on subtle foreground stars
 * - Respects prefers-reduced-motion
 */
export const CinematicStarfield: React.FC<CinematicStarfieldProps> = memo(
  ({ isPlayerOpen = false }) => {
    const l1Ref = useRef<HTMLDivElement>(null)
    const l2Ref = useRef<HTMLDivElement>(null)
    const l3Ref = useRef<HTMLDivElement>(null)
    const reducedMotion = useReducedMotionPreference()

    useEffect(() => {
      if (reducedMotion) return

      return scrollCoordinator.subscribe((scrollTop) => {
        const s = Math.max(0, scrollTop)
        // Parallax depth: Distant ~8px max, Mid ~16px max, Foreground ~24px max
        const offset1 = -(Math.min(8, s * 0.007))
        const offset2 = -(Math.min(16, s * 0.013))
        const offset3 = -(Math.min(24, s * 0.020))

        if (l1Ref.current) {
          l1Ref.current.style.transform = `translate3d(0, ${offset1.toFixed(1)}px, 0)`
        }
        if (l2Ref.current) {
          l2Ref.current.style.transform = `translate3d(0, ${offset2.toFixed(1)}px, 0)`
        }
        if (l3Ref.current) {
          l3Ref.current.style.transform = `translate3d(0, ${offset3.toFixed(1)}px, 0)`
        }
      })
    }, [reducedMotion])

    return (
      <div
        data-testid="cinematic-starfield"
        className="absolute -top-[36px] -bottom-[36px] left-0 right-0 pointer-events-none overflow-hidden transition-opacity duration-700 ease-out"
        style={{
          opacity: isPlayerOpen ? 0.15 : 'var(--starfield-layer-opacity, 1)',
        }}
        aria-hidden="true"
      >
        {/* ─── Layer 1: Distant Stars (Slowest Parallax, ~8px max) ─── */}
        <div
          ref={l1Ref}
          data-testid="starfield-layer-distant"
          className="starfield-layer-distant absolute inset-0 pointer-events-none will-change-transform z-[2]"
          style={{ transform: 'translate3d(0, 0px, 0)' }}
        >
          <StarSvgLayer stars={STAR_LAYER_1} testIdPrefix="star-l1" />
        </div>

        {/* ─── Layer 2: Mid-Distance Stars (Medium Parallax, ~16px max) ─── */}
        <div
          ref={l2Ref}
          data-testid="starfield-layer-mid"
          className="starfield-layer-mid absolute inset-0 pointer-events-none will-change-transform z-[3]"
          style={{ transform: 'translate3d(0, 0px, 0)' }}
        >
          <StarSvgLayer stars={STAR_LAYER_2} testIdPrefix="star-l2" />
        </div>

        {/* ─── Layer 3: Foreground Stars (Fastest Parallax, ~24px max) ─── */}
        <div
          ref={l3Ref}
          data-testid="starfield-layer-foreground"
          className="starfield-layer-foreground absolute inset-0 pointer-events-none will-change-transform z-[4]"
          style={{ transform: 'translate3d(0, 0px, 0)' }}
        >
          <StarSvgLayer stars={STAR_LAYER_3} testIdPrefix="star-l3" />
        </div>
      </div>
    )
  }
)

CinematicStarfield.displayName = 'CinematicStarfield'
