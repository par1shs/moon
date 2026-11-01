import { createContext } from 'react'

export interface AudioContextValue {
  isSoundEnabled: boolean
  toggleSound: () => void
  setSoundEnabled: (enabled: boolean) => void
  playStartupSound: (force?: boolean) => Promise<boolean>
  playProfileSelectSound: (force?: boolean) => Promise<boolean>
  initAudioOnUserGesture: () => Promise<void>
}

export const AudioContext = createContext<AudioContextValue | undefined>(undefined)
