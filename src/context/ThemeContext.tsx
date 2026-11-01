import React, { useEffect, useState, useMemo } from 'react'
import type { AccentTheme } from '../types'
import { ThemeContext } from './ThemeContextDefinition'
import { DEFAULT_ACCENT, PRESET_ACCENTS } from '../styles/tokens'

interface ThemeProviderProps {
  children: React.ReactNode
  initialAccent?: AccentTheme
}

/**
 * Applies accent colors directly to CSS variables on :root.
 * This guarantees any component using CSS variables or Tailwind tokens
 * immediately reflects the active theme without hardcoded styles.
 */
function applyAccentToDOM(accent: AccentTheme) {
  const root = document.documentElement
  root.style.setProperty('--accent-primary', accent.primary)
  root.style.setProperty('--accent-secondary', accent.secondary)
  root.style.setProperty('--accent-muted', accent.muted)
  root.style.setProperty('--accent-glow', accent.glow)
  root.style.setProperty('--accent-contrast', accent.contrast)
  root.style.setProperty('--accent-bg', accent.accentBg || `${accent.primary}1A`)
  root.style.setProperty('--accent-border', accent.accentBorder || `${accent.primary}59`)
  root.style.setProperty('--border-focus', accent.borderFocus || `${accent.primary}73`)
}

const STORAGE_KEY = 'junction_profiles_v1'
const ACTIVE_PROFILE_KEY = 'junction_active_profile_v1'

/**
 * Retrieves the persisted accent theme for the active profile immediately,
 * avoiding any FOUC (flash of unstyled/wrong colors) on page refresh.
 */
function getInitialAccent(fallbackAccent: AccentTheme = DEFAULT_ACCENT): AccentTheme {
  if (typeof window === 'undefined') return fallbackAccent
  try {
    const activeId = localStorage.getItem(ACTIVE_PROFILE_KEY)
    if (activeId) {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          const found = parsed.find((p: { id: string; themePalette?: AccentTheme }) => p.id === activeId)
          if (found?.themePalette) {
            applyAccentToDOM(found.themePalette)
            return found.themePalette
          }
        }
      }
    }
  } catch {
    // Fall back to default
  }
  applyAccentToDOM(fallbackAccent)
  return fallbackAccent
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialAccent = DEFAULT_ACCENT,
}) => {
  const [currentAccent, setCurrentAccent] = useState<AccentTheme>(() =>
    getInitialAccent(initialAccent)
  )

  useEffect(() => {
    applyAccentToDOM(currentAccent)
  }, [currentAccent])

  const setAccent = (accentId: string) => {
    const found = PRESET_ACCENTS.find((a) => a.id === accentId)
    if (found) {
      applyAccentToDOM(found)
      setCurrentAccent(found)
    }
  }

  const setCustomAccent = (custom: Partial<AccentTheme> & { primary: string }) => {
    const fullAccent: AccentTheme = {
      id: custom.id || 'custom-profile-theme',
      name: custom.name || 'Custom Theme',
      primary: custom.primary,
      secondary: custom.secondary || custom.primary,
      muted: custom.muted || `${custom.primary}2E`, // ~18% alpha
      glow: custom.glow || `${custom.primary}4D`, // ~30% alpha
      contrast: custom.contrast || '#0C0D0F',
      accentBg: custom.accentBg || `${custom.primary}1A`,
      accentBorder: custom.accentBorder || `${custom.primary}59`,
      borderFocus: custom.borderFocus || `${custom.primary}73`,
    }
    applyAccentToDOM(fullAccent)
    setCurrentAccent(fullAccent)
  }

  const value = useMemo(
    () => ({
      currentAccent,
      availableAccents: PRESET_ACCENTS,
      setAccent,
      setCustomAccent,
    }),
    [currentAccent]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
