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
  hasGlow?: boolean
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
 * Total: 160 stars (88 distant, 48 mid, 24 foreground).
 * Twinkling: 12 stars (~7.5%), individually delayed with 3.2s–6.8s cycles.
 */
function generateStarLayers(): {
  layer1: StarItem[]
  layer2: StarItem[]
  layer3: StarItem[]
} {
  const rng = createPrng(1337)

  // ─── Layer 1: Distant Stars (88 stars: 11 cols x 8 rows) ───
  // High density, crisp small sizes (~1.6–2.4px diameter), clear opacity (0.55–0.78), slowest parallax (~8px)
  const layer1: StarItem[] = []
  const twinkleL1 = new Set([7, 23, 41, 57, 75])
  const l1Durations = [4.6, 5.4, 6.0, 6.6, 5.0]
  const l1Delays = [0.4, 1.6, 2.8, 4.0, 1.0]
  let t1 = 0

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 11; c++) {
      const idx = r * 11 + c
      // Natural jittered grid covering full screen including top sky (y from 10px to 990px)
      const x = ((c + 0.06 + rng() * 0.88) / 11) * 1600
      const y = ((r + 0.05 + rng() * 0.90) / 8) * 1000
      const radius = 0.82 + rng() * 0.38 // diameter ~1.64–2.40px (crisp pinpoints)
      const baseOpacity = 0.55 + rng() * 0.23 // 0.55–0.78 (clearly visible!)
      const colorType: StarItem['colorType'] = rng() > 0.3 ? 'cool' : 'white'
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
  // Medium density, medium sizes (~2.6–3.4px diameter), bright opacity (0.72–0.90), medium parallax (~16px)
  const layer2: StarItem[] = []
  const twinkleL2 = new Set([5, 18, 29, 42])
  const l2Durations = [3.8, 4.5, 5.2, 5.9]
  const l2Delays = [0.7, 1.8, 2.6, 3.9]
  let t2 = 0

  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 8; c++) {
      const idx = r * 8 + c
      const x = ((c + 0.06 + rng() * 0.88) / 8) * 1600
      const y = ((r + 0.05 + rng() * 0.90) / 6) * 1000
      const radius = 1.30 + rng() * 0.40 // diameter ~2.60–3.40px
      const baseOpacity = 0.72 + rng() * 0.18 // 0.72–0.90
      const colorRoll = rng()
      const colorType: StarItem['colorType'] =
        colorRoll < 0.55 ? 'white' : colorRoll < 0.80 ? 'ivory' : 'indigo'
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

  // ─── Layer 3: Foreground Stars (24 stars: 6 cols x 4 rows) ───
  // Lower density, radiant stars (~3.5–4.8px diameter), luminous opacity (0.85–1.0), faster parallax (~24px)
  const layer3: StarItem[] = []
  const twinkleL3 = new Set([3, 11, 20])
  const accentL3 = new Set([4, 10, 16, 22])
  const l3Durations = [3.4, 4.2, 4.8]
  const l3Delays = [0.3, 1.5, 2.7]
  let t3 = 0

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 6; c++) {
      const idx = r * 6 + c
      const x = ((c + 0.05 + rng() * 0.90) / 6) * 1600
      const y = ((r + 0.05 + rng() * 0.90) / 4) * 1000
      const radius = 1.75 + rng() * 0.55 // diameter ~3.5–4.6px
      const baseOpacity = 0.86 + rng() * 0.14 // 0.86–1.0
      const isAccent = accentL3.has(idx)
      const isTwinkle = twinkleL3.has(idx)
      const hasGlow = radius > 2.0

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
        baseOpacity: isAccent ? 0.85 : Math.round(baseOpacity * 100) / 100,
        colorType,
        hasGlow,
        twinkle: isTwinkle
          ? {
              duration: l3Durations[t3],
              delay: l3Delays[t3++],
              dimOpacity: Math.round(baseOpacity * 0.22 * 100) / 100,
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
          ...(star.hasGlow && {
            filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.75))',
          }),
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
 * - 12 gently twinkling stars (~7.5%) with irregular 3.2s–6.8s cycles and varied delays
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
        className="absolute -top-[36px] -bottom-[36px] left-0 right-0 pointer-events-none overflow-hidden transition-opacity duration-700 ease-out z-[3]"
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
