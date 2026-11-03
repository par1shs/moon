import React, { useMemo } from 'react'
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
 * Provides subtle, seamless environmental lighting shifts between pages
 * with smooth 700ms CSS transforms and opacity fading.
 */
export const AmbientAtmosphere: React.FC<AmbientAtmosphereProps> = ({
  activePage = 'home',
  selectedDetailContent = null,
  isPlayerOpen = false,
}) => {
  const reducedMotion = useReducedMotionPreference()

  const config = useMemo<AtmospherePresetConfig>(() => {
    // Dim substantially during video playback to ensure zero interference
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

    // Slightly elevated backdrop glow when content details modal is open
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

  return (
    <div
      data-testid="ambient-atmosphere"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* ─── 1. Top Header & Hero Aura ─── */}
      <div
        className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[140vw] max-w-[1600px] h-[650px] rounded-[100%] blur-[120px] transition-all duration-700 ease-out"
        style={{
          background: 'var(--gradient-brand-aura-top)',
          opacity: config.topOpacity,
          transform: reducedMotion
            ? 'translateX(-50%)'
            : `translateX(-50%) scale(${config.accentScale})`,
        }}
      />

      {/* ─── 2. Profile Accent Primary Ambient Aura ─── */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full blur-[150px] transition-all duration-700 ease-out"
        style={{
          top: `${config.accentYOffset}px`,
          right: `${config.accentXOffset}px`,
          opacity: config.accentOpacity,
          transform: reducedMotion ? 'none' : `scale(${config.accentScale})`,
          background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
        }}
      />

      {/* ─── 3. Optional Page Tint Gradient Overlay ─── */}
      {config.tintGradient && (
        <div
          className="absolute inset-0 transition-opacity duration-700 ease-out"
          style={{
            background: config.tintGradient,
            opacity: config.accentOpacity * 1.2,
          }}
        />
      )}

      {/* ─── 4. Mid-Page Atmospheric Depth Pocket ─── */}
      <div
        className="absolute top-[650px] -left-[200px] w-[700px] h-[700px] rounded-full blur-[170px] transition-all duration-700 ease-out"
        style={{
          background: 'var(--gradient-brand-aura-mid)',
          opacity: config.midOpacity,
        }}
      />
    </div>
  )
}
