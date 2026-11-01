import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { AudioContext } from './AudioContextDefinition'
import { audioManager } from './audioManager'

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSoundEnabled, setIsSoundEnabledState] = useState<boolean>(() =>
    audioManager.getSoundEnabled()
  )

  const toggleSound = useCallback(() => {
    const next = audioManager.toggleSound()
    setIsSoundEnabledState(next)
    if (next) {
      audioManager.playStartupSound(true)
    }
  }, [])

  const setSoundEnabled = useCallback((enabled: boolean) => {
    audioManager.setSoundEnabled(enabled)
    setIsSoundEnabledState(enabled)
  }, [])

  const playStartupSound = useCallback(async (force = false) => {
    return audioManager.playStartupSound(force)
  }, [])

  const playProfileSelectSound = useCallback(async (force = false) => {
    return audioManager.playProfileSelectSound(force)
  }, [])

  const initAudioOnUserGesture = useCallback(async () => {
    const ctx = audioManager.getContext()
    if (ctx && ctx.state === 'suspended') {
      try {
        await ctx.resume()
      } catch {
        // Ignored
      }
    }
  }, [])

  // Global user gesture listener to unlock audio if user clicks anywhere
  useEffect(() => {
    const handleGesture = () => {
      initAudioOnUserGesture()
    }
    window.addEventListener('click', handleGesture, { once: true, passive: true })
    window.addEventListener('keydown', handleGesture, { once: true, passive: true })
    window.addEventListener('touchstart', handleGesture, { once: true, passive: true })

    return () => {
      window.removeEventListener('click', handleGesture)
      window.removeEventListener('keydown', handleGesture)
      window.removeEventListener('touchstart', handleGesture)
    }
  }, [initAudioOnUserGesture])

  const value = useMemo(
    () => ({
      isSoundEnabled,
      toggleSound,
      setSoundEnabled,
      playStartupSound,
      playProfileSelectSound,
      initAudioOnUserGesture,
    }),
    [
      isSoundEnabled,
      toggleSound,
      setSoundEnabled,
      playStartupSound,
      playProfileSelectSound,
      initAudioOnUserGesture,
    ]
  )

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
}
