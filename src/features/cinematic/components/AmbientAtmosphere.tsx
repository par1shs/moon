import React, { useMemo, useEffect, useRef } from 'react'
import type { NavigationPage } from '../../home/components/TopNavigation'
import type { ContentMetadata } from '../../../types'
import { useReducedMotionPreference } from '../../../hooks/useReducedMotionPreference'

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
  membership: {
    accentOpacity: 0.30,
    accentScale: 1.02,
    accentXOffset: -80,
    accentYOffset: 70,
    midOpacity: 0.42,
    topOpacity: 0.85,
    tintGradient: 'radial-gradient(circle at 75% 20%, rgba(234, 179, 8, 0.08) 0%, transparent 60%)',
  },
  search: {
    accentOpacity: 0.18,
    accentScale: 0.88,
    accentXOffset: -180,
    accentYOffset: 90,
    midOpacity: 0.30,
    topOpacity: 0.68,
  },
  mylist: {
    accentOpacity: 0.22,
    accentScale: 0.92,
    accentXOffset: -140,
    accentYOffset: 80,
    midOpacity: 0.36,
    topOpacity: 0.76,
  },
  devices: {
    accentOpacity: 0.28,
    accentScale: 1.0,
    accentXOffset: -100,
    accentYOffset: 60,
    midOpacity: 0.40,
    topOpacity: 0.82,
    tintGradient: 'radial-gradient(circle at 80% 20%, rgba(14, 165, 233, 0.08) 0%, transparent 60%)',
  },
  'ad-insights': {
    accentOpacity: 0.25,
    accentScale: 0.98,
    accentXOffset: -110,
    accentYOffset: 70,
    midOpacity: 0.38,
    topOpacity: 0.78,
  },
}

/**
 * Intelligent Page-Aware Atmospheric Background.
 * Features:
 * - 4 distinct scroll-reactive atmospheric gradient pockets shifting 15-32px vertically
 * - Midnight Slate (#10131D) and Deep Indigo (#242B40) permanent foundation
 * - Dynamic profile accent illumination smoothly blended with pointer lighting
 * - Static background depth pockets providing rich dimensionality when idle
 * - Static SVG fractal noise film grain texture overlay (opacity ~0.028)
 * - Zero React re-renders during scrolling (pure CSS vars updated via rAF)
 */
export const AmbientAtmosphere: React.FC<AmbientAtmosphereProps> = ({
  activePage = 'home',
  selectedDetailContent = null,
  isPlayerOpen = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const rafIdRef = useRef<number | null>(null)
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
        accentOpacity: 0.38,
        accentScale: 1.08,
        accentXOffset: -70,
        accentYOffset: 50,
        midOpacity: 0.46,
        topOpacity: 0.92,
      }
    }

    return PAGE_ATMOSPHERE_PRESETS[activePage] || PAGE_ATMOSPHERE_PRESETS.home
  }, [activePage, selectedDetailContent, isPlayerOpen])

  // Scroll-reactive layer movement (15-32px vertical parallax shift)
  useEffect(() => {
    if (reducedMotion) return

    const updateScrollParallax = () => {
      if (!containerRef.current) return

      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0

      // Noticeable, restrained vertical displacement slower than content (0.035x - 0.065x)
      const offset1 = Math.min(18, scrollTop * 0.035).toFixed(1)
      const offset2 = Math.min(26, scrollTop * 0.05).toFixed(1)
      const offset3 = Math.min(32, scrollTop * 0.065).toFixed(1)
      const offset4 = Math.min(28, scrollTop * 0.055).toFixed(1)

      containerRef.current.style.setProperty('--atmos-offset-1', `${offset1}px`)
      containerRef.current.style.setProperty('--atmos-offset-2', `${offset2}px`)
      containerRef.current.style.setProperty('--atmos-offset-3', `${offset3}px`)
      containerRef.current.style.setProperty('--atmos-offset-4', `${offset4}px`)
    }

    const onScroll = () => {
      if (rafIdRef.current !== null) return
      rafIdRef.current = requestAnimationFrame(() => {
        updateScrollParallax()
        rafIdRef.current = null
      })
    }

    updateScrollParallax()

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [reducedMotion])

  return (
    <div
      ref={containerRef}
      data-testid="ambient-atmosphere"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden"
      aria-hidden="true"
      style={
        {
          '--atmos-offset-1': '0px',
          '--atmos-offset-2': '0px',
          '--atmos-offset-3': '0px',
          '--atmos-offset-4': '0px',
        } as React.CSSProperties
      }
    >
      {/* ─── Static Film Grain Texture Overlay ─── */}
      <div
        data-testid="cinematic-grain-overlay"
        className="absolute inset-0 pointer-events-none opacity-[0.028] mix-blend-overlay z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* ─── Layer 1: Top Header & Hero Aura (Midnight Slate & Deep Indigo) ─── */}
      <div
        data-testid="atmos-layer-1"
        className="absolute -top-[15%] left-1/2 w-[130vw] max-w-[1500px] h-[550px] rounded-[100%] blur-[90px] transition-opacity duration-700 ease-out will-change-transform"
        style={{
          background: 'var(--gradient-brand-aura-top)',
          opacity: config.topOpacity,
          transform: reducedMotion
            ? 'translateX(-50%)'
            : `translate3d(-50%, var(--atmos-offset-1), 0) scale(${config.accentScale})`,
        }}
      />

      {/* ─── Layer 2: Profile Accent Primary Ambient Aura (Upper Right) ─── */}
      <div
        data-testid="atmos-layer-2"
        className="absolute w-[520px] h-[520px] rounded-full blur-[100px] transition-opacity duration-700 ease-out will-change-transform"
        style={{
          top: `${config.accentYOffset}px`,
          right: `${config.accentXOffset}px`,
          opacity: config.accentOpacity,
          transform: reducedMotion
            ? 'none'
            : `translate3d(0, var(--atmos-offset-2), 0) scale(${config.accentScale})`,
          background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
        }}
      />

      {/* ─── Optional Page Tint Gradient Overlay ─── */}
      {config.tintGradient && (
        <div
          className="absolute inset-0 transition-opacity duration-700 ease-out"
          style={{
            background: config.tintGradient,
            opacity: config.accentOpacity * 1.2,
          }}
        />
      )}

      {/* ─── Layer 3: Mid-Page Deep Indigo Radial Pocket (Mid Left) ─── */}
      <div
        data-testid="atmos-layer-3"
        className="absolute top-[38%] -left-[100px] w-[620px] h-[620px] rounded-full blur-[110px] transition-opacity duration-700 ease-out will-change-transform"
        style={{
          background: 'radial-gradient(circle, #242B40 0%, #171E32 45%, #10131D 70%, transparent 85%)',
          opacity: config.midOpacity,
          transform: reducedMotion
            ? 'none'
            : 'translate3d(0, var(--atmos-offset-3), 0)',
        }}
      />

      {/* ─── Layer 4: Lower-Page Secondary Ambient Pocket (Mid-Lower Right) ─── */}
      <div
        data-testid="atmos-layer-4"
        className="absolute top-[68%] -right-[120px] w-[560px] h-[560px] rounded-full blur-[110px] transition-opacity duration-700 ease-out will-change-transform pointer-events-none"
        style={{
          background: 'radial-gradient(circle, var(--accent-glow) 0%, #242B40 40%, transparent 75%)',
          opacity: config.accentOpacity * 0.75,
          transform: reducedMotion
            ? 'none'
            : 'translate3d(0, var(--atmos-offset-4), 0)',
        }}
      />

      {/* ─── Static Background Depth Pocket (Lower Left Idle Depth) ─── */}
      <div
        data-testid="atmos-static-pocket"
        className="absolute bottom-[8%] -left-[120px] w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #242B40 0%, #10131D 60%, transparent 80%)',
          opacity: 0.32,
        }}
      />
    </div>
  )
}
