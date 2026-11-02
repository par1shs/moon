import React, { useEffect, useState, useMemo, useCallback } from 'react'
import type { AccentTheme, ColorMode } from '../types'
import { ThemeContext } from './ThemeContextDefinition'
import { DEFAULT_ACCENT, PRESET_ACCENTS } from '../styles/tokens'

interface ThemeProviderProps {
  children: React.ReactNode
  initialAccent?: AccentTheme
  initialColorMode?: ColorMode
}

export const COLOR_MODE_STORAGE_KEY = 'junction_color_mode_v1'

/**
 * Applies color mode ('dark' | 'light') to DOM and metadata elements.
 */
function applyColorModeToDOM(mode: ColorMode) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.remove('dark', 'light')
  root.classList.add(mode)
  root.setAttribute('data-theme', mode)

  const metaColorScheme = document.querySelector('meta[name="color-scheme"]')
  if (metaColorScheme) {
    metaColorScheme.setAttribute('content', mode)
  }

  const metaThemeColor = document.querySelector('meta[name="theme-color"]')
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', mode === 'light' ? '#EDF1F8' : '#0C0D0F')
  }
}

/**
 * Applies accent colors directly to CSS variables on :root.
 * This guarantees any component using CSS variables or Tailwind tokens
 * immediately reflects the active theme without hardcoded styles.
 */
function applyAccentToDOM(accent: AccentTheme, mode: ColorMode = 'dark') {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.style.setProperty('--accent-primary', accent.primary)
  root.style.setProperty('--accent-secondary', accent.secondary)
  root.style.setProperty('--accent-muted', accent.muted)
  root.style.setProperty('--accent-glow', accent.glow)
  // In light mode, ensure crisp text contrast on bright accent buttons
  const contrast = mode === 'light' ? '#FFFFFF' : accent.contrast || '#0C0D0F'
  root.style.setProperty('--accent-contrast', contrast)
  root.style.setProperty('--accent-bg', accent.accentBg || `${accent.primary}1A`)
  root.style.setProperty('--accent-border', accent.accentBorder || `${accent.primary}59`)
  root.style.setProperty('--border-focus', accent.borderFocus || `${accent.primary}73`)
}

const STORAGE_KEY = 'junction_profiles_v1'
const ACTIVE_PROFILE_KEY = 'junction_active_profile_v1'

/**
 * Retrieves initial color mode preference ('dark' | 'light').
 * Defaults to 'dark' for cinema OTT aesthetic, but preserves user's explicit selection.
 */
function getInitialColorMode(fallback: ColorMode = 'dark'): ColorMode {
  if (typeof window === 'undefined') return fallback
  try {
    const stored = localStorage.getItem(COLOR_MODE_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') {
      applyColorModeToDOM(stored)
      return stored
    }
  } catch {
    // Fall back to default
  }
  applyColorModeToDOM(fallback)
  return fallback
}

/**
 * Retrieves the persisted accent theme for the active profile immediately,
 * avoiding any FOUC (flash of unstyled/wrong colors) on page refresh.
 */
function getInitialAccent(fallbackAccent: AccentTheme = DEFAULT_ACCENT, mode: ColorMode = 'dark'): AccentTheme {
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
            applyAccentToDOM(found.themePalette, mode)
            return found.themePalette
          }
        }
      }
    }
  } catch {
    // Fall back to default
  }
  applyAccentToDOM(fallbackAccent, mode)
  return fallbackAccent
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialAccent = DEFAULT_ACCENT,
  initialColorMode = 'dark',
}) => {
  const [colorMode, setColorModeState] = useState<ColorMode>(() =>
    getInitialColorMode(initialColorMode)
  )

  const [currentAccent, setCurrentAccent] = useState<AccentTheme>(() =>
    getInitialAccent(initialAccent, colorMode)
  )

  useEffect(() => {
    applyColorModeToDOM(colorMode)
    applyAccentToDOM(currentAccent, colorMode)
  }, [colorMode, currentAccent])

  // Handle cross-tab color mode synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === COLOR_MODE_STORAGE_KEY) {
        if (e.newValue === 'light' || e.newValue === 'dark') {
          setColorModeState(e.newValue)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const setColorMode = useCallback((mode: ColorMode) => {
    try {
      localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode)
    } catch {
      // Storage might be unavailable
    }
    applyColorModeToDOM(mode)
    setColorModeState(mode)
  }, [])

  const toggleColorMode = useCallback(() => {
    const nextMode: ColorMode = colorMode === 'dark' ? 'light' : 'dark'
    setColorMode(nextMode)
  }, [colorMode, setColorMode])

  const setAccent = useCallback((accentId: string) => {
    const found = PRESET_ACCENTS.find((a) => a.id === accentId)
    if (found) {
      applyAccentToDOM(found, colorMode)
      setCurrentAccent(found)
    }
  }, [colorMode])

  const setCustomAccent = useCallback((custom: Partial<AccentTheme> & { primary: string }) => {
    const fullAccent: AccentTheme = {
      id: custom.id || 'custom-profile-theme',
      name: custom.name || 'Custom Theme',
      primary: custom.primary,
      secondary: custom.secondary || custom.primary,
      muted: custom.muted || `${custom.primary}2E`, // ~18% alpha
      glow: custom.glow || `${custom.primary}4D`, // ~30% alpha
      contrast: custom.contrast || (colorMode === 'light' ? '#FFFFFF' : '#0C0D0F'),
      accentBg: custom.accentBg || `${custom.primary}1A`,
      accentBorder: custom.accentBorder || `${custom.primary}59`,
      borderFocus: custom.borderFocus || `${custom.primary}73`,
    }
    applyAccentToDOM(fullAccent, colorMode)
    setCurrentAccent(fullAccent)
  }, [colorMode])

  const value = useMemo(
    () => ({
      colorMode,
      setColorMode,
      toggleColorMode,
      currentAccent,
      availableAccents: PRESET_ACCENTS,
      setAccent,
      setCustomAccent,
    }),
    [colorMode, setColorMode, toggleColorMode, currentAccent, setAccent, setCustomAccent]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
