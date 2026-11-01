/**
 * JUNCTION+ Dynamic Palette Extractor
 * 
 * Extracts and synthesizes a cinematic, WCAG-compliant accent palette
 * from an avatar configuration or SVG artwork.
 * 
 * Rules:
 * - Prioritizes outfit, accessory, and background colors.
 * - Explicitly avoids skin tones as the primary accent.
 * - Enforces minimum contrast against dark charcoal (#0C0D0F).
 * - Restrains saturation to filmic, non-neon levels.
 */

import type { AccentTheme } from '../../types'
import type { AvatarConfig } from '../profiles/types'
import { OUTFIT_COLORS, SKIN_TONES } from '../profiles/data/avatarOptions'
import { DEFAULT_ACCENT } from '../../styles/tokens'

// ─── Color Math Helpers ──────────────────────────────────────────

export interface RGB {
  r: number
  g: number
  b: number
}

export interface HSL {
  h: number // 0 - 360
  s: number // 0 - 100
  l: number // 0 - 100
}

/** Parse a hex color string into RGB */
export function hexToRgb(hex: string): RGB | null {
  const cleanHex = hex.trim().replace(/^#/, '')
  let r = 0
  let g = 0
  let b = 0

  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16)
    g = parseInt(cleanHex[1] + cleanHex[1], 16)
    b = parseInt(cleanHex[2] + cleanHex[2], 16)
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16)
    g = parseInt(cleanHex.substring(2, 4), 16)
    b = parseInt(cleanHex.substring(4, 6), 16)
  } else {
    return null
  }

  if (isNaN(r) || isNaN(g) || isNaN(b)) return null
  return { r, g, b }
}

/** Convert RGB to Hex string */
export function rgbToHex({ r, g, b }: RGB): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)))
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, '0').toUpperCase()
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/** Convert RGB to HSL */
export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255

  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  const delta = max - min

  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min)

    switch (max) {
      case rNorm:
        h = ((gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0)) * 60
        break
      case gNorm:
        h = ((bNorm - rNorm) / delta + 2) * 60
        break
      case bNorm:
        h = ((rNorm - gNorm) / delta + 4) * 60
        break
    }
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

/** Convert HSL to RGB */
export function hslToRgb({ h, s, l }: HSL): RGB {
  const sNorm = s / 100
  const lNorm = l / 100

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = lNorm - c / 2

  let rPrime = 0
  let gPrime = 0
  let bPrime = 0

  if (h >= 0 && h < 60) {
    rPrime = c
    gPrime = x
    bPrime = 0
  } else if (h >= 60 && h < 120) {
    rPrime = x
    gPrime = c
    bPrime = 0
  } else if (h >= 120 && h < 180) {
    rPrime = 0
    gPrime = c
    bPrime = x
  } else if (h >= 180 && h < 240) {
    rPrime = 0
    gPrime = x
    bPrime = c
  } else if (h >= 240 && h < 300) {
    rPrime = x
    gPrime = 0
    bPrime = c
  } else if (h >= 300 && h < 360) {
    rPrime = c
    gPrime = 0
    bPrime = x
  }

  return {
    r: Math.round((rPrime + m) * 255),
    g: Math.round((gPrime + m) * 255),
    b: Math.round((bPrime + m) * 255),
  }
}

/** Calculate relative luminance according to WCAG 2.1 specifications */
export function getLuminance({ r, g, b }: RGB): number {
  const [rLinear, gLinear, bLinear] = [r, g, b].map(v => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear
}

/** Calculate contrast ratio between two colors */
export function getContrastRatio(rgb1: RGB, rgb2: RGB): number {
  const lum1 = getLuminance(rgb1)
  const lum2 = getLuminance(rgb2)
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)
  return (brightest + 0.05) / (darkest + 0.05)
}

// ─── Skin Tone Detection ─────────────────────────────────────────

// Canonical skin tones from avatarOptions.ts
const CANONICAL_SKIN_HEXES = new Set(SKIN_TONES.map(s => s.hex.toUpperCase()))

/**
 * Checks if a color matches one of the avatar illustrated skin tones.
 * Avoids selecting flesh/skin colors as primary accent.
 */
export function isSkinTone(hex: string): boolean {
  if (!hex) return false
  return CANONICAL_SKIN_HEXES.has(hex.trim().toUpperCase())
}

// ─── Cinematic Calibration ───────────────────────────────────────

const CHARCOAL_BG: RGB = { r: 12, g: 13, b: 15 } // #0C0D0F

/**
 * Calibrate an extracted accent color for JUNCTION+'s dark cinematic interface:
 * 1. Guarantees adequate contrast against #0C0D0F (> 4.5:1).
 * 2. Restrains saturation (30% - 68%) so it never appears neon or harsh.
 * 3. Keeps lightness in a comfortable cinematic band (50% - 68%).
 */
export function calibrateCinematicColor(rawHex: string): {
  primary: string
  secondary: string
  rgb: RGB
} {
  const rgb = hexToRgb(rawHex) || { r: 201, g: 135, b: 105 }
  const hsl = rgbToHsl(rgb)

  // Clamp saturation to prevent neon/oversaturated colors
  const calibratedSat = Math.min(68, Math.max(32, hsl.s))

  // Ensure lightness gives at least 4.5:1 contrast against #0C0D0F
  let calibratedLightness = Math.min(68, Math.max(50, hsl.l))

  let candidateRgb = hslToRgb({ h: hsl.h, s: calibratedSat, l: calibratedLightness })
  while (getContrastRatio(candidateRgb, CHARCOAL_BG) < 4.5 && calibratedLightness < 75) {
    calibratedLightness += 2
    candidateRgb = hslToRgb({ h: hsl.h, s: calibratedSat, l: calibratedLightness })
  }

  const primaryHex = rgbToHex(candidateRgb)

  // Secondary accent: a lighter, softer harmonious companion (+10% lightness)
  const secondaryLightness = Math.min(80, calibratedLightness + 10)
  const secondaryRgb = hslToRgb({
    h: (hsl.h + 2) % 360,
    s: Math.max(25, calibratedSat - 6),
    l: secondaryLightness,
  })
  const secondaryHex = rgbToHex(secondaryRgb)

  return {
    primary: primaryHex,
    secondary: secondaryHex,
    rgb: candidateRgb,
  }
}

// ─── Theme Generation ────────────────────────────────────────────

/**
 * Generate a cohesive AccentTheme from an AvatarConfig.
 * 
 * Prioritization:
 * 1. Outfit color (from outfitColorKey) if distinct and non-skin.
 * 2. Accessory / primary color from config.
 * 3. Secondary highlight from config.
 * 4. Fallback to default terracotta coral.
 */
export function extractThemeFromAvatar(
  config: AvatarConfig,
  profileName = 'Viewer'
): AccentTheme {
  try {
    // 1. Gather candidate colors from the avatar configuration
    let candidateHex: string | null = null
    let candidateSecondaryHex: string | null = null

    // Check outfit color
    if (config.outfitColorKey) {
      const outfitOption = OUTFIT_COLORS.find(o => o.key === config.outfitColorKey)
      if (outfitOption && !isSkinTone(outfitOption.hex)) {
        candidateHex = outfitOption.hex
      }
    }

    // Check primary color (accessories, director glasses, cosmic-bot antenna, etc.)
    if (!candidateHex && config.primaryColor && !isSkinTone(config.primaryColor)) {
      candidateHex = config.primaryColor
    }

    // If outfit was chosen, secondary can come from config.primaryColor or secondaryColor
    if (candidateHex && config.primaryColor && config.primaryColor !== candidateHex && !isSkinTone(config.primaryColor)) {
      candidateSecondaryHex = config.primaryColor
    } else if (config.secondaryColor && !isSkinTone(config.secondaryColor)) {
      candidateSecondaryHex = config.secondaryColor
    }

    // Fallback if candidate is still null (e.g. skin tone collision or missing)
    if (!candidateHex) {
      candidateHex = config.primaryColor || DEFAULT_ACCENT.primary
    }

    // Calibrate the chosen color for cinematic dark mode
    const calibrated = calibrateCinematicColor(candidateHex)
    const primaryHex = calibrated.primary
    const secondaryHex = candidateSecondaryHex
      ? calibrateCinematicColor(candidateSecondaryHex).primary
      : calibrated.secondary
    const rgb = calibrated.rgb

    const themeId = `theme-${config.id || 'custom'}`
    const themeName = `${profileName}'s Palette`

    return {
      id: themeId,
      name: themeName,
      primary: primaryHex,
      secondary: secondaryHex,
      muted: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.16)`,
      accentBg: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.10)`,
      accentBorder: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`,
      borderFocus: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.55)`,
      glow: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.30)`,
      contrast: '#0C0D0F', // deep charcoal ensures 6+:1 contrast on calibrated primary
    }
  } catch (error) {
    console.warn('Palette extraction failed, using default brand theme:', error)
    return {
      id: `theme-fallback-${Date.now()}`,
      name: 'Default Palette',
      primary: DEFAULT_ACCENT.primary,
      secondary: DEFAULT_ACCENT.secondary,
      muted: DEFAULT_ACCENT.muted,
      accentBg: 'rgba(201, 135, 105, 0.10)',
      accentBorder: 'rgba(201, 135, 105, 0.35)',
      borderFocus: 'rgba(201, 135, 105, 0.55)',
      glow: DEFAULT_ACCENT.glow,
      contrast: DEFAULT_ACCENT.contrast,
    }
  }
}
