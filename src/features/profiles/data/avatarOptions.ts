// Avatar customization option definitions for JUNCTION+ avatar studio
// These options are used by the AvatarStudio UI and the AvatarRenderer to build
// layered SVG avatars. All values are simple primitives that can be persisted in
// LocalStorage as part of an AvatarConfig.

export const BASE_CHARACTERS = [
  { key: 'director', label: 'Director (Aarav)' },
  { key: 'producer', label: 'Producer (Mira)' },
  { key: 'explorer', label: 'Explorer (Kabir)' },
  { key: 'cosmic-bot', label: 'Cosmic Bot (Kids)' },
  { key: 'creator', label: 'Creator' },
] as const;

export const SKIN_TONES = [
  { key: 'light', hex: '#F5D6C6' },
  { key: 'fair', hex: '#E2C1A9' },
  { key: 'medium', hex: '#CFA58C' },
  { key: 'olive', hex: '#B58A6F' },
  { key: 'dark', hex: '#8C5E4A' },
] as const;

export const HAIRSTYLES = [
  { key: 'bald', label: 'Bald' },
  { key: 'short', label: 'Short' },
  { key: 'medium', label: 'Medium' },
  { key: 'long', label: 'Long' },
  { key: 'curly', label: 'Curly' },
  { key: 'wavy', label: 'Wavy' },
] as const;

export const HAIR_COLORS = [
  { key: 'black', hex: '#2C2C2C' },
  { key: 'brown', hex: '#5C4033' },
  { key: 'auburn', hex: '#7A3B24' },
  { key: 'blonde', hex: '#C5A26D' },
  { key: 'red', hex: '#B02E0C' },
  { key: 'gray', hex: '#7A7A7A' },
] as const;

export const EYE_STYLES = [
  { key: 'round', label: 'Round' },
  { key: 'almond', label: 'Almond' },
  { key: 'narrow', label: 'Narrow' },
] as const;

export const EYE_COLORS = [
  { key: 'brown', hex: '#5A381E' },
  { key: 'hazel', hex: '#8E663C' },
  { key: 'green', hex: '#4A7A3E' },
  { key: 'blue', hex: '#3B5C9E' },
  { key: 'gray', hex: '#7A7A85' },
] as const;

export const OUTFITS = [
  { key: 'tshirt', label: 'T‑Shirt' },
  { key: 'shirt', label: 'Shirt' },
  { key: 'hoodie', label: 'Hoodie' },
  { key: 'jacket', label: 'Jacket' },
  { key: 'sweater', label: 'Sweater' },
] as const;

export const OUTFIT_COLORS = [
  { key: 'terracotta', hex: '#C98769' },
  { key: 'muted-olive', hex: '#A5A58C' },
  { key: 'deep-blue', hex: '#345F78' },
  { key: 'slate', hex: '#5C6A73' },
  { key: 'warm-gray', hex: '#8A847B' },
] as const;

export const ACCESSORIES = [
  { key: 'none', label: 'None' },
  { key: 'glasses', label: 'Glasses' },
  { key: 'sunglasses', label: 'Sunglasses' },
  { key: 'headphones', label: 'Headphones' },
  { key: 'cap', label: 'Cap' },
  { key: 'hat', label: 'Hat' },
] as const;

export const BACKGROUNDS = [
  { key: 'solid-dark', css: '#0C0D0F' },
  { key: 'solid-charcoal', css: '#141619' },
  { key: 'gradient-warm', css: 'linear-gradient(135deg, #0C0D0F, #141619)' },
  { key: 'gradient-cool', css: 'linear-gradient(135deg, #0C0D0F, #242629)' },
] as const;

// Types derived from the constant arrays for strong typing elsewhere
export type BaseCharacterKey = typeof BASE_CHARACTERS[number]['key'];
export type SkinToneKey = typeof SKIN_TONES[number]['key'];
export type HairStyleKey = typeof HAIRSTYLES[number]['key'];
export type HairColorKey = typeof HAIR_COLORS[number]['key'];
export type EyeStyleKey = typeof EYE_STYLES[number]['key'];
export type EyeColorKey = typeof EYE_COLORS[number]['key'];
export type OutfitKey = typeof OUTFITS[number]['key'];
export type OutfitColorKey = typeof OUTFIT_COLORS[number]['key'];
export type AccessoryKey = typeof ACCESSORIES[number]['key'];
export type BackgroundKey = typeof BACKGROUNDS[number]['key'];
