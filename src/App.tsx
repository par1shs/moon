import React, { useState } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { AudioProvider } from './features/audio/AudioProvider'
import { StartupTransition } from './features/startup/StartupTransition'
import { DevShell } from './pages/DevShell'

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'experience' | 'devshell'>('experience')

  return (
    <ThemeProvider>
      <AudioProvider>
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] antialiased transition-colors duration-300">
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
