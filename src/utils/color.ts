import { getColor, getSwatches } from 'colorthief'
import type { AccentTheme } from '../types'

/**
 * Utility to extract dominant color and muted tones from an image element or image URL
 * and convert it to a JUNCTION+ compatible AccentTheme.
 * Used for dynamic profile/avatar theming in Phase 2.
 */
export async function extractPaletteFromImage(
  imageElement: HTMLImageElement,
  themeId = 'avatar-extracted-theme',
  themeName = 'Avatar Theme'
): Promise<AccentTheme> {
  try {
    const swatches = await getSwatches(imageElement)
    const dominantColor = await getColor(imageElement)

    // Prefer Muted or Vibrant swatch to fit the dark cinematic aesthetic
    const selectedColor = swatches.Muted?.color || dominantColor

    if (selectedColor) {
      const rgb = selectedColor.rgb()
      const hex = selectedColor.hex()

      return {
        id: themeId,
        name: themeName,
        primary: hex,
        secondary: swatches.LightMuted?.color.hex() || hex,
        muted: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.18)`,
        accentBg: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.10)`,
        accentBorder: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`,
        borderFocus: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.55)`,
        glow: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`,
        contrast: '#0C0D0F',
      }
    }
  } catch (err) {
    console.warn('Could not extract color from image, falling back to default', err)
  }

  // Fallback to terracotta brand accent
  return {
    id: themeId,
    name: themeName,
    primary: '#C98769',
    secondary: '#D6A58B',
    muted: 'rgba(201, 135, 105, 0.18)',
    accentBg: 'rgba(201, 135, 105, 0.10)',
    accentBorder: 'rgba(201, 135, 105, 0.35)',
    borderFocus: 'rgba(201, 135, 105, 0.55)',
    glow: 'rgba(201, 135, 105, 0.35)',
    contrast: '#0C0D0F',
  }
}

export {
  extractThemeFromAvatar,
  calibrateCinematicColor,
  isSkinTone,
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  getContrastRatio,
} from '../features/theme/paletteExtractor'
