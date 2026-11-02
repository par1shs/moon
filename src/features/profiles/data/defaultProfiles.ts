import type { Profile } from '../types'

/**
 * Default Seed Profiles for JUNCTION+
 * 
 * Each profile contains an original illustrated avatar configuration
 * and a tailored brand accent color mapped to the theme engine.
 */
export const DEFAULT_PROFILES: Profile[] = [
  {
    id: 'profile-aarav',
    name: 'Aarav',
    avatarId: 'avatar-aarav',
    avatarConfig: {
      id: 'avatar-aarav',
      characterStyle: 'director',
      primaryColor: '#C98769', // Terracotta Coral
      secondaryColor: '#D6A58B',
      bgGradient: 'linear-gradient(145deg, #2A1D17 0%, #151312 60%, #3D261C 120%)',
      accessory: 'glasses',
      accentGlow: 'rgba(201, 135, 105, 0.35)',
    },
    isKidsProfile: false,
    accentColor: '#C98769',
    themePalette: {
      id: 'theme-avatar-aarav',
      name: "Aarav's Palette",
      primary: '#C98769',
      secondary: '#D6A58B',
      muted: 'rgba(201, 135, 105, 0.16)',
      accentBg: 'rgba(201, 135, 105, 0.10)',
      accentBorder: 'rgba(201, 135, 105, 0.35)',
      borderFocus: 'rgba(201, 135, 105, 0.55)',
      glow: 'rgba(201, 135, 105, 0.30)',
      contrast: '#0C0D0F',
    },
    createdAt: 1700000001000,
  },
  {
    id: 'profile-mira',
    name: 'Mira',
    avatarId: 'avatar-mira',
    avatarConfig: {
      id: 'avatar-mira',
      characterStyle: 'producer',
      primaryColor: '#D99B52', // Cinematic Amber
      secondaryColor: '#E6B77E',
      bgGradient: 'linear-gradient(145deg, #2D2214 0%, #171512 60%, #3E2F1A 120%)',
      accessory: 'headphones',
      accentGlow: 'rgba(217, 155, 82, 0.35)',
    },
    isKidsProfile: false,
    accentColor: '#D99B52',
    themePalette: {
      id: 'theme-avatar-mira',
      name: "Mira's Palette",
      primary: '#D99B52',
      secondary: '#E6B77E',
      muted: 'rgba(217, 155, 82, 0.16)',
      accentBg: 'rgba(217, 155, 82, 0.10)',
      accentBorder: 'rgba(217, 155, 82, 0.35)',
      borderFocus: 'rgba(217, 155, 82, 0.55)',
      glow: 'rgba(217, 155, 82, 0.30)',
      contrast: '#0C0D0F',
    },
    createdAt: 1700000002000,
  },
]
