export type AtmospherePreset =
  | 'home'
  | 'series'
  | 'movies'
  | 'discover'
  | 'livetv'
  | 'mylist'
  | 'search'
  | 'membership'
  | 'ad-insights'
  | 'devices'
  | 'details'
  | 'player'
  | 'neutral'

export interface AtmosphereConfig {
  preset: AtmospherePreset
  primaryAura: string
  accentAuraOpacity: number
  secondaryAura: string
  overlayTint?: string
}

export interface CursorState {
  x: number
  y: number
  isHoveringClickable: boolean
  isHoveringTextInput: boolean
  isClicking: boolean
  isVisible: boolean
}
