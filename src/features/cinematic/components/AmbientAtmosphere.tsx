import React, { useMemo, useEffect, useRef } from 'react'
import type { NavigationPage } from '../../home/components/TopNavigation'
import type { ContentMetadata } from '../../../types'
import { useReducedMotionPreference } from '../../../hooks/useReducedMotionPreference'
import { scrollCoordinator } from '../../../utils/scrollCoordinator'
import { CinematicStarfield } from './CinematicStarfield'

export interface AmbientAtmosphereProps {
  activePage?: NavigationPage
  selectedDetailContent?: ContentMetadata | null
  isPlayerOpen?: boolean
}

interface AtmospherePresetConfig {
  accentOpacity: number
  accentScale: number
  accentXOffset: number
  accentYOffset: number
  midOpacity: number
  topOpacity: number
  tintGradient?: string
}

/**
 * Page Atmosphere Presets:
 * - Group A (Home, Series, Movies, Discover, Live TV): Restored earlier darker cinematic values
 * - Group B (My List, Devices, Membership): Preserved existing lighter starfield atmosphere
 */
const PAGE_ATMOSPHERE_PRESETS: Record<string, AtmospherePresetConfig> = {
  // ─── Main Sections (Restored Darker Gradient Atmosphere) ───
  home: {
    accentOpacity: 0.32,
    accentScale: 1.0,
    accentXOffset: -80,
    accentYOffset: 60,
    midOpacity: 0.44,
    topOpacity: 0.88,
  },
  series: {
    accentOpacity: 0.25,
    accentScale: 0.95,
    accentXOffset: -120,
    accentYOffset: 80,
    midOpacity: 0.38,
    topOpacity: 0.80,
  },
  movies: {
    accentOpacity: 0.30,
    accentScale: 1.05,
    accentXOffset: -70,
    accentYOffset: 50,
    midOpacity: 0.46,
    topOpacity: 0.85,
    tintGradient: 'radial-gradient(ellipse at 70% 20%, rgba(217, 155, 82, 0.09) 0%, transparent 60%)',
  },
  discover: {
    accentOpacity: 0.35,
    accentScale: 1.10,
    accentXOffset: -60,
    accentYOffset: 40,
    midOpacity: 0.50,
    topOpacity: 0.92,
    tintGradient: 'radial-gradient(circle at 80% 25%, rgba(56, 189, 248, 0.08) 0%, transparent 65%)',
  },
  livetv: {
    accentOpacity: 0.20,
    accentScale: 0.90,
    accentXOffset: -160,
    accentYOffset: 100,
    midOpacity: 0.34,
    topOpacity: 0.74,
  },
  search: {
    accentOpacity: 0.18,
    accentScale: 0.88,
    accentXOffset: -180,
    accentYOffset: 90,
    midOpacity: 0.30,
    topOpacity: 0.68,
  },

  // ─── Starfield Sections (Preserved Lighter Gradient Atmosphere) ───
  mylist: {
    accentOpacity: 0.42,
    accentScale: 0.96,
    accentXOffset: -120,
    accentYOffset: 70,
    midOpacity: 0.54,
    topOpacity: 0.84,
  },
  devices: {
    accentOpacity: 0.50,
    accentScale: 1.05,
    accentXOffset: -80,
    accentYOffset: 50,
    midOpacity: 0.60,
    topOpacity: 0.90,
    tintGradient: 'radial-gradient(circle at 80% 20%, rgba(14, 165, 233, 0.16) 0%, transparent 65%)',
  },
  membership: {
    accentOpacity: 0.52,
    accentScale: 1.08,
    accentXOffset: -60,
    accentYOffset: 60,
    midOpacity: 0.64,
    topOpacity: 0.92,
    tintGradient: 'radial-gradient(circle at 75% 20%, rgba(234, 179, 8, 0.16) 0%, transparent 65%)',
  },
  'ad-insights': {
    accentOpacity: 0.45,
    accentScale: 1.02,
    accentXOffset: -90,
    accentYOffset: 60,
    midOpacity: 0.58,
    topOpacity: 0.86,
  },
}

/**
 * Intelligent Page-Aware Atmospheric Background.
 * Supports:
 * - Restored darker gradients on Home, Series, Movies, Discover, Live TV
 * - Preserved lighter gradients & dense 3-layer parallax starfield on My List, Devices, Membership
 * - Smooth 550ms opacity-based crossfade between dark and lighter atmosphere
 * - 100% theme-aware in both Dark Mode and Light Mode
 * - GPU compositor transforms driven by unified scrollCoordinator
 */
export const AmbientAtmosphere: React.FC<AmbientAtmosphereProps> = ({
  activePage = 'home',
  selectedDetailContent = null,
  isPlayerOpen = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  // Layer Set A refs (Base darker gradients)
  const l1Ref = useRef<HTMLDivElement>(null)
  const l2Ref = useRef<HTMLDivElement>(null)
  const l3Ref = useRef<HTMLDivElement>(null)
  const l4Ref = useRef<HTMLDivElement>(null)

  // Layer Set B refs (Lighter starfield gradients)
  const l1StarRef = useRef<HTMLDivElement>(null)
  const l2StarRef = useRef<HTMLDivElement>(null)
  const l3StarRef = useRef<HTMLDivElement>(null)
  const l4StarRef = useRef<HTMLDivElement>(null)

  const reducedMotion = useReducedMotionPreference()

  const config = useMemo<AtmospherePresetConfig>(() => {
    if (isPlayerOpen) {
      return {
        accentOpacity: 0.04,
        accentScale: 0.8,
        accentXOffset: -200,
        accentYOffset: 150,
        midOpacity: 0.08,
        topOpacity: 0.15,
      }
    }

    if (selectedDetailContent) {
      return {
        accentOpacity: 0.42,
        accentScale: 1.08,
        accentXOffset: -60,
        accentYOffset: 45,
        midOpacity: 0.52,
        topOpacity: 0.90,
      }
    }

    return PAGE_ATMOSPHERE_PRESETS[activePage] || PAGE_ATMOSPHERE_PRESETS.home
  }, [activePage, selectedDetailContent, isPlayerOpen])

  // Selective Starfield Atmosphere: Active ONLY on My List, Devices, and Membership
  const isStarfieldSection = useMemo(() => {
    if (isPlayerOpen) return false
    return activePage === 'mylist' || activePage === 'devices' || activePage === 'membership'
  }, [activePage, isPlayerOpen])

  // Scroll-reactive layer movement: driven by unified scrollCoordinator
  // Directly updates compositor transforms without React state or CSS variable recalculations
  useEffect(() => {
    if (reducedMotion) return

    const updateOffsets = (scrollTop: number) => {
      const offset1 = Math.min(28, scrollTop * 0.06).toFixed(1)
      const offset2 = Math.min(42, scrollTop * 0.08).toFixed(1)
      const offset3 = Math.min(55, scrollTop * 0.10).toFixed(1)
      const offset4 = Math.min(45, scrollTop * 0.09).toFixed(1)

      // Only manipulate the active layer set's DOM nodes to eliminate redundant compositor updates
      if (!isStarfieldSection) {
        if (l1Ref.current) {
          l1Ref.current.style.transform = `translate3d(-50%, ${offset1}px, 0) scale(${config.accentScale})`
        }
        if (l2Ref.current) {
          l2Ref.current.style.transform = `translate3d(0, ${offset2}px, 0) scale(${config.accentScale})`
        }
        if (l3Ref.current) {
          l3Ref.current.style.transform = `translate3d(0, ${offset3}px, 0)`
        }
        if (l4Ref.current) {
          l4Ref.current.style.transform = `translate3d(0, ${offset4}px, 0)`
        }
      } else {
        if (l1StarRef.current) {
          l1StarRef.current.style.transform = `translate3d(-50%, ${offset1}px, 0) scale(${config.accentScale})`
        }
        if (l2StarRef.current) {
          l2StarRef.current.style.transform = `translate3d(0, ${offset2}px, 0) scale(${config.accentScale})`
        }
        if (l3StarRef.current) {
          l3StarRef.current.style.transform = `translate3d(0, ${offset3}px, 0)`
        }
        if (l4StarRef.current) {
          l4StarRef.current.style.transform = `translate3d(0, ${offset4}px, 0)`
        }
      }
    }

    updateOffsets(scrollCoordinator.getScrollY())

    const unsubscribe = scrollCoordinator.subscribe((scrollTop) => {
      updateOffsets(scrollTop)
    })

    return () => {
      unsubscribe()
    }
  }, [reducedMotion, config.accentScale, isStarfieldSection])

  return (
    <div
      ref={containerRef}
      data-testid="ambient-atmosphere"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* ─── Layer Set A: Base Main Sections Atmosphere (Darker Gradient) ─── */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700 ease-out"
        style={{
          opacity: isStarfieldSection ? 0 : 1,
          visibility: isStarfieldSection ? 'hidden' : 'visible',
          transition: 'opacity 550ms cubic-bezier(0.16, 1, 0.3, 1), visibility 550ms ease-out',
        }}
      >
        {/* Layer 1: Top Header & Hero Aura */}
        <div
          ref={l1Ref}
          data-testid="atmos-layer-1"
          className="absolute -top-[12%] left-1/2 w-[130vw] max-w-[1500px] h-[550px] rounded-[100%] blur-3xl transition-opacity duration-700 ease-out will-change-transform z-[1]"
          style={{
            background: 'var(--atmos-dark-top)',
            opacity: config.topOpacity,
            transform: `translate3d(-50%, 0px, 0) scale(${config.accentScale})`,
          }}
        />

        {/* Layer 2: Profile Accent Primary Ambient Aura */}
        <div
          ref={l2Ref}
          data-testid="atmos-layer-2"
          className="absolute w-[560px] h-[560px] rounded-full blur-3xl transition-opacity duration-700 ease-out will-change-transform z-[1]"
          style={{
            top: `${config.accentYOffset}px`,
            right: `${config.accentXOffset}px`,
            opacity: config.accentOpacity,
            transform: `translate3d(0, 0px, 0) scale(${config.accentScale})`,
            background: 'var(--atmos-dark-accent)',
          }}
        />

        {/* Layer 3: Mid-Page Deep Indigo Radial Pocket */}
        <div
          ref={l3Ref}
          data-testid="atmos-layer-3"
          className="absolute top-[35%] -left-[100px] w-[660px] h-[660px] rounded-full blur-3xl transition-opacity duration-700 ease-out will-change-transform z-[1]"
          style={{
            background: 'var(--atmos-dark-mid)',
            opacity: config.midOpacity,
            transform: 'translate3d(0, 0px, 0)',
          }}
        />

        {/* Layer 4: Lower-Page Accent Pocket */}
        <div
          ref={l4Ref}
          data-testid="atmos-layer-4"
          className="absolute top-[65%] -right-[120px] w-[580px] h-[580px] rounded-full blur-3xl transition-opacity duration-700 ease-out will-change-transform pointer-events-none z-[1]"
          style={{
            background: 'var(--atmos-dark-lower)',
            opacity: config.accentOpacity * 0.85,
            transform: 'translate3d(0, 0px, 0)',
          }}
        />

        {/* Static Background Depth Pocket */}
        <div
          data-testid="atmos-static-pocket"
          className="absolute bottom-[6%] -left-[100px] w-[520px] h-[520px] rounded-full blur-3xl pointer-events-none z-[1]"
          style={{
            background: 'var(--atmos-dark-static)',
            opacity: 0.32,
          }}
        />
      </div>

      {/* ─── Layer Set B: Starfield Sections Atmosphere (Preserved Lighter Gradient) ─── */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700 ease-out"
        style={{
          opacity: isStarfieldSection ? 1 : 0,
          visibility: isStarfieldSection ? 'visible' : 'hidden',
          transition: 'opacity 550ms cubic-bezier(0.16, 1, 0.3, 1), visibility 550ms ease-out',
        }}
      >
        {/* Lighter Top Aura */}
        <div
          ref={l1StarRef}
          className="absolute -top-[12%] left-1/2 w-[130vw] max-w-[1500px] h-[550px] rounded-[100%] blur-3xl transition-opacity duration-700 ease-out will-change-transform z-[1]"
          style={{
            background: 'var(--atmos-star-top)',
            opacity: config.topOpacity,
            transform: `translate3d(-50%, 0px, 0) scale(${config.accentScale})`,
          }}
        />

        {/* Lighter Accent Glow */}
        <div
          ref={l2StarRef}
          className="absolute w-[560px] h-[560px] rounded-full blur-3xl transition-opacity duration-700 ease-out will-change-transform z-[1]"
          style={{
            top: `${config.accentYOffset}px`,
            right: `${config.accentXOffset}px`,
            opacity: config.accentOpacity,
            transform: `translate3d(0, 0px, 0) scale(${config.accentScale})`,
            background: 'var(--atmos-star-accent)',
          }}
        />

        {/* Lighter Mid-Page Pocket */}
        <div
          ref={l3StarRef}
          className="absolute top-[35%] -left-[100px] w-[660px] h-[660px] rounded-full blur-3xl transition-opacity duration-700 ease-out will-change-transform z-[1]"
          style={{
            background: 'var(--atmos-star-mid)',
            opacity: config.midOpacity,
            transform: 'translate3d(0, 0px, 0)',
          }}
        />

        {/* Lighter Lower-Page Pocket */}
        <div
          ref={l4StarRef}
          className="absolute top-[65%] -right-[120px] w-[580px] h-[580px] rounded-full blur-3xl transition-opacity duration-700 ease-out will-change-transform pointer-events-none z-[1]"
          style={{
            background: 'var(--atmos-star-lower)',
            opacity: config.accentOpacity * 0.85,
            transform: 'translate3d(0, 0px, 0)',
          }}
        />

        {/* Lighter Static Pocket */}
        <div
          className="absolute bottom-[6%] -left-[100px] w-[520px] h-[520px] rounded-full blur-3xl pointer-events-none z-[1]"
          style={{
            background: 'var(--atmos-star-static)',
            opacity: 0.45,
          }}
        />
      </div>

      {/* ─── Optional Page Tint Gradient Overlay ─── */}
      {config.tintGradient && (
        <div
          className="absolute inset-0 transition-opacity duration-700 ease-out z-[1]"
          style={{
            background: config.tintGradient,
            opacity: config.accentOpacity * 1.3,
          }}
        />
      )}

      {/* ─── Selective Cinematic Starfield: Active ONLY on My List, Devices, Membership ─── */}
      <CinematicStarfield
        visible={isStarfieldSection}
        density="dense"
        showAccentStars={true}
        enableParallax={true}
        testId="selective-starfield"
      />

      {/* ─── Static Film Grain Texture Overlay (GPU Composited) ─── */}
      <div
        data-testid="cinematic-grain-overlay"
        className="absolute inset-0 pointer-events-none opacity-[0.032] mix-blend-overlay z-10 will-change-transform"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          transform: 'translateZ(0)',
        }}
      />
    </div>
  )
}
