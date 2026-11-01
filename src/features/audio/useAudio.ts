import { useContext } from 'react'
import { AudioContext } from './AudioContextDefinition'
import type { AudioContextValue } from './AudioContextDefinition'

export const useAudio = (): AudioContextValue => {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider')
  }
  return context
}

export type { AudioContextValue }
