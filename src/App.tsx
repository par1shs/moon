import React, { useState } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { AudioProvider } from './features/audio/AudioProvider'
import { StartupTransition } from './features/startup/StartupTransition'
import { DevShell } from './pages/DevShell'
import { PointerAmbientGradient } from './features/cinematic/components/PointerAmbientGradient'
import { CinemaProjectorCursor } from './features/cinematic/components/CinemaProjectorCursor'

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'experience' | 'devshell'>('experience')

  return (
    <ThemeProvider>
      <AudioProvider>
        <div className="min-h-screen bg-transparent text-[var(--text-primary)] antialiased transition-colors duration-300">
          {/* Global Cinematic Pointer Illumination & Custom Cinema Projector Cursor */}
          <PointerAmbientGradient />
          <CinemaProjectorCursor />

          {activeView === 'experience' ? (
            <StartupTransition onOpenDevShell={() => setActiveView('devshell')} />
          ) : (
            <DevShell onLaunchStartup={() => setActiveView('experience')} />
          )}
        </div>
      </AudioProvider>
    </ThemeProvider>
  )
}

export default App
