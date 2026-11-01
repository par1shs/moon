// Utility to generate a random avatar configuration for JUNCTION+ Avatar Studio
import {
  BASE_CHARACTERS,
  SKIN_TONES,
  HAIRSTYLES,
  HAIR_COLORS,
  EYE_STYLES,
  EYE_COLORS,
  OUTFITS,
  OUTFIT_COLORS,
  ACCESSORIES,
  BACKGROUNDS,
} from '../data/avatarOptions'
import type { AvatarConfig } from '../types'

/** Pick a random element from a readonly array */
const randomItem = <T,>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)]

/** Generate a simple unique ID without external dependencies */
const generateId = (): string =>
  `avatar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

/** Create a default baseline avatar config (deterministic) */
export const createDefaultAvatarConfig = (): AvatarConfig => ({
  id: generateId(),
  characterStyle: 'creator',
  primaryColor: '#C98769',
  secondaryColor: '#D6A58B',
  bgGradient: 'linear-gradient(135deg, #0C0D0F, #141619)',
  skinToneKey: 'medium',
  hairStyleKey: 'short',
  hairColorKey: 'brown',
  eyeStyleKey: 'round',
  eyeColorKey: 'brown',
  outfitKey: 'tshirt',
  outfitColorKey: 'terracotta',
  accessoryKey: undefined,
  backgroundKey: 'gradient-warm',
})

/** Generate a fully randomised avatar config */
export const generateRandomAvatarConfig = (): AvatarConfig => {
  const character = randomItem(BASE_CHARACTERS).key as AvatarConfig['characterStyle']
  const skin = randomItem(SKIN_TONES).key
  const hairStyle = randomItem(HAIRSTYLES).key
  const hairColor = randomItem(HAIR_COLORS).key
  const eyeStyle = randomItem(EYE_STYLES).key
  const eyeColor = randomItem(EYE_COLORS).key
  const outfit = randomItem(OUTFITS).key
  const outfitColor = randomItem(OUTFIT_COLORS).key
  const accessory = randomItem(ACCESSORIES).key
  const background = randomItem(BACKGROUNDS).key

  return {
    id: generateId(),
    characterStyle: character,
    primaryColor: '#C98769',
    secondaryColor: '#D6A58B',
    bgGradient: BACKGROUNDS.find(b => b.key === background)?.css || '#0C0D0F',
    accessory: accessory !== 'none' ? (accessory as AvatarConfig['accessory']) : undefined,
    skinToneKey: skin,
    hairStyleKey: hairStyle,
    hairColorKey: hairColor,
    eyeStyleKey: eyeStyle,
    eyeColorKey: eyeColor,
    outfitKey: outfit,
    outfitColorKey: outfitColor,
    accessoryKey: accessory !== 'none' ? accessory : undefined,
    backgroundKey: background,
  }
}
