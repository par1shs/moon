import type { AccentTheme } from '../../types'

/**
 * Profile and Avatar System Types
 */

export type AvatarStyle =
  | 'director'
  | 'producer'
  | 'explorer'
  | 'cosmic-bot'
  | 'creator'
  | 'curator'

export type AvatarAccessory =
  | 'glasses'
  | 'headphones'
  | 'visor'
  | 'antenna'
  | 'stars'
  | 'none'

export interface AvatarConfig {
  id: string
  characterStyle: AvatarStyle
  primaryColor: string
  secondaryColor: string
  bgGradient: string // CSS gradient or tokens
  accessory?: AvatarAccessory
  accentGlow?: string
  // Customizable layer keys (used by Avatar Studio)
  skinToneKey?: string
  hairStyleKey?: string
  hairColorKey?: string
  eyeStyleKey?: string
  eyeColorKey?: string
  outfitKey?: string
  outfitColorKey?: string
  accessoryKey?: string
  backgroundKey?: string
}

export interface Profile {
  id: string
  name: string
  avatarId: string
  avatarConfig: AvatarConfig
  isKidsProfile: boolean
  accentColor: string
  themePalette?: AccentTheme
  createdAt: number
  subscriptionTier?: 'free' | 'premium'
}

export interface ProfileFormData {
  name: string
  isKidsProfile: boolean
  avatarConfig?: AvatarConfig
}
