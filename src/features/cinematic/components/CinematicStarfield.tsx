import React, { memo, useEffect, useRef } from 'react'
import { useReducedMotionPreference } from '../../../hooks/useReducedMotionPreference'
import { scrollCoordinator } from '../../../utils/scrollCoordinator'

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
  /** Whether to enable multi-depth scroll parallax (for My List, Devices, Membership) */
  enableParallax?: boolean
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
 * Dense 3-Layer Celestial Architecture (~224 stars total):
 * Layer 1 (Distant): 120 stars, tiniest, slowest parallax (~17% scroll displacement)
 * Layer 2 (Mid): 72 stars, medium, moderate parallax (~21% scroll displacement)
 * Layer 3 (Foreground): 32 stars, brighter, fastest parallax (~25% scroll displacement)
 */
function generateDenseLayers(): {
  layer1: StarItem[]
  layer2: StarItem[]
  layer3: StarItem[]
} {
  const rng = createPrng(777)

  // ─── Layer 1: Distant Stars (120 stars: 15 cols x 8 rows) ───
  const layer1: StarItem[] = []
  const twinkleL1 = new Set([11, 28, 47, 65, 89, 108])
  const l1Durations = [4.6, 5.4, 6.2, 4.8, 5.8, 6.4]
  const l1Delays = [0.4, 1.6, 2.7, 3.8, 0.9, 2.1]
  let t1 = 0

  const colsL1 = 15
  const rowsL1 = 8
  for (let r = 0; r < rowsL1; r++) {
    for (let c = 0; c < colsL1; c++) {
      const idx = r * colsL1 + c
      const x = ((c + 0.06 + rng() * 0.88) / colsL1) * 1600
      // Spread across y: 15 to 1285 to accommodate top reserve for downward parallax
      const y = ((r + 0.05 + rng() * 0.90) / rowsL1) * 1270 + 15
      const radius = 0.45 + rng() * 0.28 // ~0.9–1.46px diameter
      const baseOpacity = 0.32 + rng() * 0.24 // 0.32–0.56
      const colorRoll = rng()
      const colorType: StarItem['colorType'] =
        colorRoll < 0.65 ? 'cool' : colorRoll < 0.88 ? 'white' : 'indigo'
      const isTwinkle = twinkleL1.has(idx)

      layer1.push({
        id: `d1-${idx}`,
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        r: Math.round(radius * 100) / 100,
        baseOpacity: Math.round(baseOpacity * 100) / 100,
        colorType,
        twinkle: isTwinkle
          ? {
              duration: l1Durations[t1],
              delay: l1Delays[t1++],
              dimOpacity: Math.round(baseOpacity * 0.22 * 100) / 100,
            }
          : undefined,
      })
    }
  }

  // ─── Layer 2: Mid-Distance Stars (72 stars: 12 cols x 6 rows) ───
  const layer2: StarItem[] = []
  const twinkleL2 = new Set([8, 21, 35, 49, 58, 67])
  const l2Durations = [3.9, 4.5, 5.2, 5.9, 4.2, 6.0]
  const l2Delays = [0.8, 1.9, 3.1, 1.2, 2.5, 3.7]
  let t2 = 0

  const colsL2 = 12
  const rowsL2 = 6
  for (let r = 0; r < rowsL2; r++) {
    for (let c = 0; c < colsL2; c++) {
      const idx = r * colsL2 + c
      const x = ((c + 0.08 + rng() * 0.84) / colsL2) * 1600
      const y = ((r + 0.06 + rng() * 0.88) / rowsL2) * 1270 + 15
      const radius = 0.75 + rng() * 0.35 // ~1.5–2.2px diameter
      const baseOpacity = 0.52 + rng() * 0.24 // 0.52–0.76
      const colorRoll = rng()
      const colorType: StarItem['colorType'] =
        colorRoll < 0.50 ? 'white' : colorRoll < 0.78 ? 'cool' : 'ivory'
      const isTwinkle = twinkleL2.has(idx)

      layer2.push({
        id: `d2-${idx}`,
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        r: Math.round(radius * 100) / 100,
        baseOpacity: Math.round(baseOpacity * 100) / 100,
        colorType,
        twinkle: isTwinkle
          ? {
              duration: l2Durations[t2],
              delay: l2Delays[t2++],
              dimOpacity: Math.round(baseOpacity * 0.25 * 100) / 100,
            }
          : undefined,
      })
    }
  }

  // ─── Layer 3: Foreground Stars (32 stars: 8 cols x 4 rows) ───
  const layer3: StarItem[] = []
  const twinkleL3 = new Set([5, 14, 22, 29])
  const accentIndices = new Set([3, 11, 19, 27])
  const l3Durations = [3.5, 4.3, 5.0, 5.7]
  const l3Delays = [0.3, 1.4, 2.6, 3.5]
  let t3 = 0

  const colsL3 = 8
  const rowsL3 = 4
  for (let r = 0; r < rowsL3; r++) {
    for (let c = 0; c < colsL3; c++) {
      const idx = r * colsL3 + c
      const x = ((c + 0.08 + rng() * 0.84) / colsL3) * 1600
      const y = ((r + 0.08 + rng() * 0.84) / rowsL3) * 1270 + 15
      const radius = 1.18 + rng() * 0.32 // ~2.36–3.0px diameter
      const baseOpacity = 0.72 + rng() * 0.23 // 0.72–0.95
      const isAccent = accentIndices.has(idx)
      const isTwinkle = twinkleL3.has(idx)

      let colorType: StarItem['colorType'] = 'white'
      if (isAccent) {
        colorType = 'accent'
      } else if (rng() < 0.4) {
        colorType = 'ivory'
      }

      layer3.push({
        id: `d3-${idx}`,
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        r: Math.round(radius * 100) / 100,
        baseOpacity: Math.round(baseOpacity * 100) / 100,
        colorType,
        hasGlow: true,
        twinkle: isTwinkle
          ? {
              duration: l3Durations[t3],
              delay: l3Delays[t3++],
              dimOpacity: Math.round(baseOpacity * 0.28 * 100) / 100,
            }
          : undefined,
      })
    }
  }

  return { layer1, layer2, layer3 }
}

/**
 * Subtle preset (~63 stars): Stationary, non-competing, for Startup Intro and Profile Welcome.
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

const { layer1: DENSE_L1, layer2: DENSE_L2, layer3: DENSE_L3 } = generateDenseLayers()
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
 * Pure SVG Layer Renderer with CSS-driven Asynchronous Twinkling
 */
const StarSvgLayer: React.FC<{
  stars: StarItem[]
  testIdPrefix: string
  showAccentStars: boolean
  viewBox?: string
}> = memo(({ stars, testIdPrefix, showAccentStars, viewBox = '0 0 1600 1300' }) => {
  const reducedMotion = useReducedMotionPreference()

  return (
    <svg
      className="w-full h-full pointer-events-none"
      viewBox={viewBox}
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
            data-testid={`${testIdPrefix}-${star.id}`}
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
  )
})

StarSvgLayer.displayName = 'StarSvgLayer'

/**
 * CinematicStarfield Component
 *
 * Implements a high-density, multi-depth celestial starfield with:
 * - 3 independent depth layers (Distant ~17%, Mid ~21%, Foreground ~25% scroll displacement)
 * - Restrained downward parallax movement driven by unified scrollCoordinator
 * - 16 gently twinkling stars (~7.1%) with irregular cycles
 * - 100% GPU composited translate3d without React re-renders or layout reflows
 * - Seamless theme support: luminous white/ivory in dark mode, deep celestial slate in light mode
 * - Respects prefers-reduced-motion
 */
export const CinematicStarfield: React.FC<CinematicStarfieldProps> = memo(
  ({
    className = '',
    visible = true,
    density = 'dense',
    showAccentStars = true,
    opacity = 1,
    testId = 'cinematic-starfield',
    enableParallax = density === 'dense',
  }) => {
    const l1Ref = useRef<HTMLDivElement>(null)
    const l2Ref = useRef<HTMLDivElement>(null)
    const l3Ref = useRef<HTMLDivElement>(null)
    const reducedMotion = useReducedMotionPreference()

    // ─── Downward Scroll Parallax (18–25% of scroll displacement) ───
    useEffect(() => {
      if (reducedMotion || !enableParallax || density !== 'dense' || !visible) return

      const updateParallax = (scrollTop: number) => {
        const s = Math.max(0, scrollTop)
        // Distant stars: slowest (~17%)
        const offset1 = Math.min(180, s * 0.17)
        // Mid-distance stars: moderate (~21%)
        const offset2 = Math.min(220, s * 0.21)
        // Foreground stars: fastest (~25%)
        const offset3 = Math.min(260, s * 0.25)

        if (l1Ref.current) {
          l1Ref.current.style.transform = `translate3d(0, ${offset1.toFixed(1)}px, 0)`
        }
        if (l2Ref.current) {
          l2Ref.current.style.transform = `translate3d(0, ${offset2.toFixed(1)}px, 0)`
        }
        if (l3Ref.current) {
          l3Ref.current.style.transform = `translate3d(0, ${offset3.toFixed(1)}px, 0)`
        }
      }

      // Initial alignment on mount / page change
      updateParallax(window.scrollY || document.documentElement.scrollTop || 0)

      const unsubscribe = scrollCoordinator.subscribe((scrollTop) => {
        updateParallax(scrollTop)
      })

      const handleScroll = () => {
        updateParallax(window.scrollY || document.documentElement.scrollTop || 0)
      }
      window.addEventListener('scroll', handleScroll, { passive: true })

      return () => {
        unsubscribe()
        window.removeEventListener('scroll', handleScroll)
      }
    }, [reducedMotion, enableParallax, density, visible])

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
        {density === 'dense' ? (
          <>
            {/* ─── Layer 1: Distant Stars (Slowest Parallax, ~17% downward) ─── */}
            <div
              ref={l1Ref}
              data-testid="starfield-layer-distant"
              className="absolute -top-[240px] -bottom-[60px] left-0 right-0 pointer-events-none will-change-transform z-[2]"
              style={{ transform: 'translate3d(0, 0px, 0)' }}
            >
              <StarSvgLayer
                stars={DENSE_L1}
                testIdPrefix="star-l1"
                showAccentStars={showAccentStars}
                viewBox="0 0 1600 1300"
              />
            </div>

            {/* ─── Layer 2: Mid-Distance Stars (Moderate Parallax, ~21% downward) ─── */}
            <div
              ref={l2Ref}
              data-testid="starfield-layer-mid"
              className="absolute -top-[240px] -bottom-[60px] left-0 right-0 pointer-events-none will-change-transform z-[3]"
              style={{ transform: 'translate3d(0, 0px, 0)' }}
            >
              <StarSvgLayer
                stars={DENSE_L2}
                testIdPrefix="star-l2"
                showAccentStars={showAccentStars}
                viewBox="0 0 1600 1300"
              />
            </div>

            {/* ─── Layer 3: Foreground Stars (Fastest Parallax, ~25% downward) ─── */}
            <div
              ref={l3Ref}
              data-testid="starfield-layer-foreground"
              className="absolute -top-[240px] -bottom-[60px] left-0 right-0 pointer-events-none will-change-transform z-[4]"
              style={{ transform: 'translate3d(0, 0px, 0)' }}
            >
              <StarSvgLayer
                stars={DENSE_L3}
                testIdPrefix="star-l3"
                showAccentStars={showAccentStars}
                viewBox="0 0 1600 1300"
              />
            </div>
          </>
        ) : (
          /* ─── Subtle Stationary Single-Layer Preset (Startup & Welcome) ─── */
          <div className="absolute inset-0 pointer-events-none z-[2]">
            <StarSvgLayer
              stars={SUBTLE_STARS}
              testIdPrefix="star-subtle"
              showAccentStars={showAccentStars}
              viewBox="0 0 1600 1000"
            />
          </div>
        )}
      </div>
    )
  }
)

CinematicStarfield.displayName = 'CinematicStarfield'
