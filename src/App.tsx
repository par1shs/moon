import React, { useState, Suspense, lazy } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { AudioProvider } from './features/audio/AudioProvider'
import { StartupTransition } from './features/startup/StartupTransition'
import { PointerAmbientGradient } from './features/cinematic/components/PointerAmbientGradient'
import { CinemaProjectorCursor } from './features/cinematic/components/CinemaProjectorCursor'

const DevShell = lazy(() => import('./pages/DevShell').then((m) => ({ default: m.DevShell })))

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
            <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center font-mono text-xs text-[var(--text-muted)]">
                  INITIALIZING DEV ENVIRONMENT...
                </div>
              }
            >
              <DevShell onLaunchStartup={() => setActiveView('experience')} />
            </Suspense>
          )}
        </div>
      </AudioProvider>
    </ThemeProvider>
  )
}

export default App
