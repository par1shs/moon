/**
 * JUNCTION+ Design Tokens
 * 
 * Centralized design tokens establishing the visual foundation of the platform.
 * All colors are bound to CSS variables to support runtime dynamic theming
 * (e.g. avatar color extraction in Phase 2).
 */

export interface ColorPalette {
  main: string
  secondary: string
  card: string
  elevated: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  borderSubtle: string
  borderHover: string
}

/**
 * Permanent Brand Primary tokens establishing the cinematic foundation.
 * These remain stable and identical across profiles.
 */
export interface BrandPrimaryTokens {
  foundation: string
  midnight: string
  indigo: string
  nav: string
  gradientBase: string
  gradientSubtle: string
  gradientRadial: string
  gradientHero: string
  gradientModal: string
  gradientPlayer: string
}

export const BRAND_PRIMARY: BrandPrimaryTokens = {
  foundation: '#0C0D0F',
  midnight: '#10131D',
  indigo: '#242B40',
  nav: 'rgba(16, 19, 29, 0.92)',
  gradientBase: 'linear-gradient(180deg, #10131D 0%, #0C0D0F 100%)',
  gradientSubtle: 'linear-gradient(160deg, #182032 0%, #10131D 50%, #0C0D0F 100%)',
  gradientRadial: 'radial-gradient(120% 70% at 50% 0%, #242B40 0%, #151B2E 35%, #10131D 65%, #0C0D0F 100%)',
  gradientHero: 'radial-gradient(120% 85% at 80% 15%, rgba(36, 43, 64, 0.75) 0%, rgba(21, 27, 46, 0.75) 40%, rgba(16, 19, 29, 0.90) 70%, rgba(12, 13, 15, 0.98) 100%)',
  gradientModal: 'linear-gradient(180deg, #182032 0%, #10131D 45%, #0C0D0F 100%)',
  gradientPlayer: 'radial-gradient(ellipse 110% 80% at 50% 15%, #242B40 0%, #151B2E 40%, #10131D 70%, #0C0D0F 100%)',
}

export interface AccentPalette {
  id: string
  name: string
  primary: string
  secondary: string
  muted: string
  glow: string
  contrast: string
  accentBg?: string
  accentBorder?: string
  borderFocus?: string
}

export const BASE_PALETTE: ColorPalette = {
  main: '#0C0D0F',
  secondary: '#10131D',
  card: '#141824',
  elevated: '#1B2130',
  textPrimary: '#F4F0EA',
  textSecondary: '#AAA69F',
  textMuted: '#77746F',
  borderSubtle: 'rgba(255, 255, 255, 0.09)',
  borderHover: 'rgba(255, 255, 255, 0.18)',
}

/**
 * Default Warm Terracotta/Coral brand accent.
 * Additional presets demonstrate the dynamic runtime theme system ready for Phase 2 avatar extraction.
 */
export const DEFAULT_ACCENT: AccentPalette = {
  id: 'terracotta',
  name: 'Terracotta Coral (Default)',
  primary: '#C98769',
  secondary: '#D6A58B',
  muted: 'rgba(201, 135, 105, 0.18)',
  glow: 'rgba(201, 135, 105, 0.35)',
  contrast: '#0C0D0F',
  accentBg: 'rgba(201, 135, 105, 0.10)',
  accentBorder: 'rgba(201, 135, 105, 0.35)',
  borderFocus: 'rgba(201, 135, 105, 0.55)',
}

export const PRESET_ACCENTS: AccentPalette[] = [
  DEFAULT_ACCENT,
  {
    id: 'amber-gold',
    name: 'Cinematic Amber',
    primary: '#D99B52',
    secondary: '#E6B77E',
    muted: 'rgba(217, 155, 82, 0.18)',
    glow: 'rgba(217, 155, 82, 0.35)',
    contrast: '#0C0D0F',
    accentBg: 'rgba(217, 155, 82, 0.10)',
    accentBorder: 'rgba(217, 155, 82, 0.35)',
    borderFocus: 'rgba(217, 155, 82, 0.55)',
  },
  {
    id: 'nordic-sage',
    name: 'Nordic Sage',
    primary: '#7E9F8E',
    secondary: '#A2BCB0',
    muted: 'rgba(126, 159, 142, 0.18)',
    glow: 'rgba(126, 159, 142, 0.35)',
    contrast: '#0C0D0F',
    accentBg: 'rgba(126, 159, 142, 0.10)',
    accentBorder: 'rgba(126, 159, 142, 0.35)',
    borderFocus: 'rgba(126, 159, 142, 0.55)',
  },
  {
    id: 'crimson-noir',
    name: 'Crimson Noir',
    primary: '#BD6161',
    secondary: '#D08585',
    muted: 'rgba(189, 97, 97, 0.18)',
    glow: 'rgba(189, 97, 97, 0.35)',
    contrast: '#0C0D0F',
    accentBg: 'rgba(189, 97, 97, 0.10)',
    accentBorder: 'rgba(189, 97, 97, 0.35)',
    borderFocus: 'rgba(189, 97, 97, 0.55)',
  },
  {
    id: 'dusk-slate',
    name: 'Dusk Slate',
    primary: '#8091A8',
    secondary: '#A3B0C2',
    muted: 'rgba(128, 145, 168, 0.18)',
    glow: 'rgba(128, 145, 168, 0.35)',
    contrast: '#0C0D0F',
    accentBg: 'rgba(128, 145, 168, 0.10)',
    accentBorder: 'rgba(128, 145, 168, 0.35)',
    borderFocus: 'rgba(128, 145, 168, 0.55)',
  },
]

export const TYPOGRAPHY = {
  fonts: {
    display: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    ui: "'DM Sans', system-ui, -apple-system, sans-serif",
  },
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  tracking: {
    tighter: '-0.04em',
    tight: '-0.02em',
    normal: '0',
    wide: '0.02em',
    wider: '0.05em',
    widest: '0.12em',
  },
} as const

export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const
