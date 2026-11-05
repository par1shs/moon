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

const PAGE_ATMOSPHERE_PRESETS: Record<string, AtmospherePresetConfig> = {
  home: {
    accentOpacity: 0.55,
    accentScale: 1.05,
    accentXOffset: -60,
    accentYOffset: 50,
    midOpacity: 0.65,
    topOpacity: 0.95,
  },
  series: {
    accentOpacity: 0.48,
    accentScale: 1.0,
    accentXOffset: -100,
    accentYOffset: 70,
    midOpacity: 0.58,
    topOpacity: 0.88,
  },
  movies: {
    accentOpacity: 0.52,
    accentScale: 1.10,
    accentXOffset: -50,
    accentYOffset: 45,
    midOpacity: 0.68,
    topOpacity: 0.92,
    tintGradient: 'radial-gradient(ellipse at 70% 20%, rgba(217, 155, 82, 0.18) 0%, transparent 65%)',
  },
  discover: {
    accentOpacity: 0.58,
    accentScale: 1.15,
    accentXOffset: -40,
    accentYOffset: 35,
    midOpacity: 0.72,
    topOpacity: 0.96,
    tintGradient: 'radial-gradient(circle at 80% 25%, rgba(56, 189, 248, 0.16) 0%, transparent 70%)',
  },
  livetv: {
    accentOpacity: 0.38,
    accentScale: 0.95,
    accentXOffset: -140,
    accentYOffset: 90,
    midOpacity: 0.50,
    topOpacity: 0.82,
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
  search: {
    accentOpacity: 0.35,
    accentScale: 0.92,
    accentXOffset: -160,
    accentYOffset: 80,
    midOpacity: 0.48,
    topOpacity: 0.78,
  },
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
 * Enhanced for high visibility in well-lit rooms:
 * - Vivid radial gradient pockets shifting 25-55px vertically as you scroll
 * - Midnight Slate (#10131D) and Deep Indigo (#242B40) permanent foundation
 * - Pronounced profile accent illumination clearly perceptible
 * - Static background depth pockets providing rich dimensionality
 * - Static SVG fractal noise film grain texture overlay
 */
export const AmbientAtmosphere: React.FC<AmbientAtmosphereProps> = ({
  activePage = 'home',
  selectedDetailContent = null,
  isPlayerOpen = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const l1Ref = useRef<HTMLDivElement>(null)
  const l2Ref = useRef<HTMLDivElement>(null)
  const l3Ref = useRef<HTMLDivElement>(null)
  const l4Ref = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotionPreference()

  const config = useMemo<AtmospherePresetConfig>(() => {
    if (isPlayerOpen) {
      return {
        accentOpacity: 0.08,
        accentScale: 0.8,
        accentXOffset: -200,
        accentYOffset: 150,
        midOpacity: 0.12,
        topOpacity: 0.20,
      }
    }

    if (selectedDetailContent) {
      return {
        accentOpacity: 0.60,
        accentScale: 1.12,
        accentXOffset: -50,
        accentYOffset: 40,
        midOpacity: 0.70,
        topOpacity: 0.96,
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
  // Directly updates compositor transforms without CSS variable style recalculation
  useEffect(() => {
    if (reducedMotion) return

    return scrollCoordinator.subscribe((scrollTop) => {
      const offset1 = Math.min(28, scrollTop * 0.06).toFixed(1)
      const offset2 = Math.min(42, scrollTop * 0.08).toFixed(1)
      const offset3 = Math.min(55, scrollTop * 0.10).toFixed(1)
      const offset4 = Math.min(45, scrollTop * 0.09).toFixed(1)

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
    })
  }, [reducedMotion, config.accentScale])

  return (
    <div
      ref={containerRef}
      data-testid="ambient-atmosphere"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* ─── Layer 1: Top Header & Hero Aura (Deep Indigo & Midnight Slate) ─── */}
      <div
        ref={l1Ref}
        data-testid="atmos-layer-1"
        className="absolute -top-[12%] left-1/2 w-[130vw] max-w-[1500px] h-[550px] rounded-[100%] blur-[70px] transition-opacity duration-700 ease-out will-change-transform z-[1]"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, #32436D 0%, #1D263D 45%, #10131D 75%, transparent 95%)',
          opacity: config.topOpacity,
          transform: `translate3d(-50%, 0px, 0) scale(${config.accentScale})`,
        }}
      />

      {/* ─── Layer 2: Profile Accent Primary Ambient Aura (Upper Right Glow) ─── */}
      <div
        ref={l2Ref}
        data-testid="atmos-layer-2"
        className="absolute w-[560px] h-[560px] rounded-full blur-[80px] transition-opacity duration-700 ease-out will-change-transform z-[1]"
        style={{
          top: `${config.accentYOffset}px`,
          right: `${config.accentXOffset}px`,
          opacity: config.accentOpacity,
          transform: `translate3d(0, 0px, 0) scale(${config.accentScale})`,
          background: 'radial-gradient(circle, var(--accent-glow) 0%, var(--accent-primary) 30%, transparent 70%)',
        }}
      />

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

      {/* ─── Layer 3: Mid-Page Deep Indigo Radial Pocket (Mid Left) ─── */}
      <div
        ref={l3Ref}
        data-testid="atmos-layer-3"
        className="absolute top-[35%] -left-[100px] w-[660px] h-[660px] rounded-full blur-[85px] transition-opacity duration-700 ease-out will-change-transform z-[1]"
        style={{
          background: 'radial-gradient(circle, #2D3A5D 0%, #1A2238 45%, #10131D 75%, transparent 88%)',
          opacity: config.midOpacity,
          transform: 'translate3d(0, 0px, 0)',
        }}
      />

      {/* ─── Layer 4: Lower-Page Accent & Indigo Pocket (Mid-Lower Right) ─── */}
      <div
        ref={l4Ref}
        data-testid="atmos-layer-4"
        className="absolute top-[65%] -right-[120px] w-[580px] h-[580px] rounded-full blur-[85px] transition-opacity duration-700 ease-out will-change-transform pointer-events-none z-[1]"
        style={{
          background: 'radial-gradient(circle, var(--accent-glow) 0%, #293452 45%, transparent 75%)',
          opacity: config.accentOpacity * 0.85,
          transform: 'translate3d(0, 0px, 0)',
        }}
      />

      {/* ─── Static Background Depth Pocket (Lower Left Idle Depth) ─── */}
      <div
        data-testid="atmos-static-pocket"
        className="absolute bottom-[6%] -left-[100px] w-[520px] h-[520px] rounded-full blur-[90px] pointer-events-none z-[1]"
        style={{
          background: 'radial-gradient(circle, #2B3754 0%, #10131D 60%, transparent 80%)',
          opacity: 0.45,
        }}
      />

      {/* ─── Selective Cinematic Starfield: Active ONLY on My List, Devices, Membership ─── */}
      <CinematicStarfield
        visible={isStarfieldSection}
        density="dense"
        showAccentStars={true}
        testId="selective-starfield"
      />

      {/* ─── Static Film Grain Texture Overlay (GPU Composited) ─── */}
      <div
        data-testid="cinematic-grain-overlay"
        className="absolute inset-0 pointer-events-none opacity-[0.035] mix-blend-overlay z-10 will-change-transform"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          transform: 'translateZ(0)',
        }}
      />
    </div>
  )
}
