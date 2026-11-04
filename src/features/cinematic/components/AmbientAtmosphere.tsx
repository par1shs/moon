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
    accentOpacity: 0.28,
    accentScale: 1.0,
    accentXOffset: -120,
    accentYOffset: 70,
    midOpacity: 0.40,
    topOpacity: 0.85,
  },
  series: {
    accentOpacity: 0.22,
    accentScale: 0.95,
    accentXOffset: -160,
    accentYOffset: 90,
    midOpacity: 0.35,
    topOpacity: 0.78,
  },
  movies: {
    accentOpacity: 0.26,
    accentScale: 1.05,
    accentXOffset: -100,
    accentYOffset: 60,
    midOpacity: 0.42,
    topOpacity: 0.82,
    tintGradient: 'radial-gradient(ellipse at 70% 20%, rgba(217, 155, 82, 0.08) 0%, transparent 60%)',
  },
  discover: {
    accentOpacity: 0.32,
    accentScale: 1.10,
    accentXOffset: -80,
    accentYOffset: 50,
    midOpacity: 0.48,
    topOpacity: 0.90,
    tintGradient: 'radial-gradient(circle at 80% 25%, rgba(56, 189, 248, 0.06) 0%, transparent 65%)',
  },
  livetv: {
    accentOpacity: 0.16,
    accentScale: 0.90,
    accentXOffset: -200,
    accentYOffset: 120,
    midOpacity: 0.30,
    topOpacity: 0.70,
  },
  membership: {
    accentOpacity: 0.26,
    accentScale: 1.02,
    accentXOffset: -100,
    accentYOffset: 80,
    midOpacity: 0.38,
    topOpacity: 0.82,
    tintGradient: 'radial-gradient(circle at 75% 20%, rgba(234, 179, 8, 0.07) 0%, transparent 60%)',
  },
  search: {
    accentOpacity: 0.15,
    accentScale: 0.88,
    accentXOffset: -220,
    accentYOffset: 100,
    midOpacity: 0.28,
    topOpacity: 0.65,
  },
  mylist: {
    accentOpacity: 0.18,
    accentScale: 0.92,
    accentXOffset: -180,
    accentYOffset: 90,
    midOpacity: 0.32,
    topOpacity: 0.72,
  },
  devices: {
    accentOpacity: 0.24,
    accentScale: 1.0,
    accentXOffset: -130,
    accentYOffset: 70,
    midOpacity: 0.36,
    topOpacity: 0.80,
    tintGradient: 'radial-gradient(circle at 80% 20%, rgba(14, 165, 233, 0.07) 0%, transparent 60%)',
  },
  'ad-insights': {
    accentOpacity: 0.22,
    accentScale: 0.98,
    accentXOffset: -140,
    accentYOffset: 80,
    midOpacity: 0.34,
    topOpacity: 0.76,
  },
}

/**
 * Intelligent page-aware atmospheric background transitions.
 * Features:
 * - 3 distinct background depth layers moving vertically by 15-30px across scroll via rAF
 * - Layered colour atmosphere using Midnight Slate (#10131D) and Deep Indigo (#242B40)
 * - Static background depth pockets providing dimensionality when idle
 * - Ultra-subtle static film grain texture overlay (opacity ~0.025)
 * - Zero React re-renders during scrolling
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
        accentOpacity: 0.36,
        accentScale: 1.08,
        accentXOffset: -90,
        accentYOffset: 60,
        midOpacity: 0.44,
        topOpacity: 0.90,
      }
    }

    return PAGE_ATMOSPHERE_PRESETS[activePage] || PAGE_ATMOSPHERE_PRESETS.home
  }, [activePage, selectedDetailContent, isPlayerOpen])

  // Scroll-reactive layer movement (15-30px total across full scroll)
  useEffect(() => {
    if (reducedMotion) return

    const updateScrollParallax = () => {
      if (!containerRef.current) return

      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const ratio = scrollHeight > 0 ? Math.min(Math.max(scrollTop / scrollHeight, 0), 1) : 0

      // 3 distinct layers moving at different restrained rates: 16px, 24px, 30px
      const offset1 = (ratio * 16).toFixed(1)
      const offset2 = (ratio * 24).toFixed(1)
      const offset3 = (ratio * 30).toFixed(1)

      containerRef.current.style.setProperty('--atmos-offset-1', `${offset1}px`)
      containerRef.current.style.setProperty('--atmos-offset-2', `${offset2}px`)
      containerRef.current.style.setProperty('--atmos-offset-3', `${offset3}px`)
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
        } as React.CSSProperties
      }
    >
      {/* ─── Static Film Grain Texture Overlay ─── */}
      <div
        data-testid="cinematic-grain-overlay"
        className="absolute inset-0 pointer-events-none opacity-[0.025] mix-blend-overlay z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* ─── Layer 1: Top Header & Hero Aura (Midnight Slate & Deep Indigo) ─── */}
      <div
        data-testid="atmos-layer-1"
        className="absolute -top-[20%] left-1/2 w-[140vw] max-w-[1600px] h-[650px] rounded-[100%] blur-[120px] transition-opacity duration-700 ease-out will-change-transform"
        style={{
          background: 'var(--gradient-brand-aura-top)',
          opacity: config.topOpacity,
          transform: reducedMotion
            ? 'translateX(-50%)'
            : `translate3d(-50%, var(--atmos-offset-1), 0) scale(${config.accentScale})`,
        }}
      />

      {/* ─── Layer 2: Profile Accent Primary Ambient Aura ─── */}
      <div
        data-testid="atmos-layer-2"
        className="absolute w-[600px] h-[600px] rounded-full blur-[150px] transition-opacity duration-700 ease-out will-change-transform"
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

      {/* ─── Layer 3: Mid-Page Atmospheric Depth Pocket (Deep Indigo #242B40) ─── */}
      <div
        data-testid="atmos-layer-3"
        className="absolute top-[650px] -left-[200px] w-[700px] h-[700px] rounded-full blur-[170px] transition-opacity duration-700 ease-out will-change-transform"
        style={{
          background: 'var(--gradient-brand-aura-mid)',
          opacity: config.midOpacity,
          transform: reducedMotion
            ? 'none'
            : 'translate3d(0, var(--atmos-offset-3), 0)',
        }}
      />

      {/* ─── Static Background Depth Pocket (Lower Right Idle Depth) ─── */}
      <div
        data-testid="atmos-static-pocket"
        className="absolute bottom-[10%] -right-[150px] w-[550px] h-[550px] rounded-full blur-[180px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #242B40 0%, #10131D 60%, transparent 80%)',
          opacity: 0.28,
        }}
      />
    </div>
  )
}
