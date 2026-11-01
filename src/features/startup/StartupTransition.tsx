import React, { useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { StartupScreen } from './StartupScreen'
import { ProfileSelectionScreen } from '../profiles/ProfileSelectionScreen'

export interface StartupTransitionProps {
  onOpenDevShell: () => void
  initialScreen?: 'startup' | 'profiles'
}

const ACTIVE_PROFILE_KEY = 'junction_active_profile_v1'
const STARTUP_SEEN_KEY = 'junction_startup_seen'

export const StartupTransition: React.FC<StartupTransitionProps> = ({
  onOpenDevShell,
  initialScreen,
}) => {
  const [currentScreen, setCurrentScreen] = useState<'startup' | 'profiles'>(() => {
    if (initialScreen) return initialScreen
    if (typeof window !== 'undefined') {
      try {
        const hasActive = Boolean(localStorage.getItem(ACTIVE_PROFILE_KEY))
        const hasSeenStartup = Boolean(sessionStorage.getItem(STARTUP_SEEN_KEY))
        if (hasActive || hasSeenStartup) {
          return 'profiles'
        }
      } catch {
        // Fall back
      }
    }
    return 'startup'
  })

  const handleStartupComplete = () => {
    try {
      sessionStorage.setItem(STARTUP_SEEN_KEY, 'true')
    } catch {
      // Ignored
    }
    setCurrentScreen('profiles')
  }

  const handleReplayIntro = () => {
    setCurrentScreen('startup')
  }

  return (
    <AnimatePresence mode="wait">
      {currentScreen === 'startup' ? (
        <StartupScreen
          key="startup-screen"
          onComplete={handleStartupComplete}
          autoAdvance={true}
        />
      ) : (
        <ProfileSelectionScreen
          key="profile-selection"
          onReplayIntro={handleReplayIntro}
          onOpenDevShell={onOpenDevShell}
        />
      )}
    </AnimatePresence>
  )
}
