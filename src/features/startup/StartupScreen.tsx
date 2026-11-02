import React, { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { Sparkles } from 'lucide-react'
import { SoundControl } from '../audio/SoundControl'
import { playStartupSonicIdentity } from './StartupAudio'
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference'
import { AmbientRisingPixels } from './components/AmbientRisingPixels'
import { PixelFormationLogo } from './components/PixelFormationLogo'

export interface StartupScreenProps {
  onComplete: () => void
  autoAdvance?: boolean
}

export const StartupScreen: React.FC<StartupScreenProps> = ({
  onComplete,
  autoAdvance = true,
}) => {
  const reducedMotion = useReducedMotionPreference()
  const audioTriggeredRef = useRef(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    // Synchronize sonic logo with visual appearance (~700ms in normal mode, ~200ms in reduced motion)
    const audioDelay = reducedMotion ? 200 : 700
    const audioTimer = window.setTimeout(() => {
      if (!audioTriggeredRef.current) {
        audioTriggeredRef.current = true
        playStartupSonicIdentity()
      }
    }, audioDelay)

    // Complete sequence after 3.6 seconds (or 1.8 seconds if reduced motion)
    if (autoAdvance) {
      const completionDuration = reducedMotion ? 1800 : 3600
      timerRef.current = window.setTimeout(() => {
        onComplete()
      }, completionDuration)
    }

    return () => {
      window.clearTimeout(audioTimer)
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [onComplete, autoAdvance, reducedMotion])

  const handleSkip = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    onComplete()
  }

  return (
    <motion.section
      key="startup-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.45, ease: 'easeInOut' } }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg-main)] px-4 select-none overflow-hidden"
      aria-label="PIXEL Startup Intro"
      data-testid="startup-screen"
    >
      {/* ─── 1. Ambient Background Rising Pixels (coming up from the bottom) ─── */}
      <AmbientRisingPixels />

      {/* ─── 2. Subtle Ambient Light / Gradient Effect ─── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{
          opacity: reducedMotion ? 0.12 : 0.22,
          scale: 1,
        }}
        transition={{
          duration: reducedMotion ? 0.6 : 2.0,
          ease: 'easeOut',
          delay: reducedMotion ? 0 : 0.2,
        }}
        className="absolute w-[360px] h-[360px] sm:w-[600px] sm:h-[600px] md:w-[750px] md:h-[750px] rounded-full pointer-events-none blur-3xl z-0"
        style={{
          background:
            'radial-gradient(circle, var(--accent-primary) 0%, var(--accent-glow) 40%, transparent 70%)',
        }}
      />

      {/* ─── 3. Center Cinematic Container with Pixels Coming Up and Forming PIXEL+ ─── */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-xl">
        {/* Pixels emerging from bottom and assembling into PIXEL in pixelated font */}
        <PixelFormationLogo />

        {/* Tagline: "ONE STORY. EVERY SCREEN." */}
        <motion.div
          initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reducedMotion ? 0.3 : 0.6,
            ease: 'easeOut',
            delay: reducedMotion ? 0.4 : 1.8,
          }}
          className="mt-5"
        >
          <span className="font-pixel font-bold uppercase text-[var(--text-primary)] text-xs sm:text-sm tracking-[0.22em] sm:tracking-[0.28em]">
            ONE STORY. EVERY SCREEN.
          </span>
        </motion.div>

        {/* Welcome message */}
        <motion.div
          initial={{ opacity: 0, y: reducedMotion ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reducedMotion ? 0.3 : 0.6,
            ease: 'easeOut',
            delay: reducedMotion ? 0.6 : 2.2,
          }}
          className="mt-3.5 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--bg-card)]/80 border border-[var(--border-subtle)] backdrop-blur-md shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-[var(--accent-secondary)]" />
          <span className="text-[11px] sm:text-xs text-[var(--text-secondary)] font-medium">
            Welcome to <span className="font-pixel font-bold text-[var(--accent-primary)]">PIXEL</span> — Your entertainment destination.
          </span>
        </motion.div>
      </div>

      {/* Top-Right Quick Skip Option */}
      <div className="absolute top-6 right-6 z-20">
        <button
          type="button"
          onClick={handleSkip}
          aria-label="Skip startup intro"
          data-testid="skip-intro-btn"
          className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer bg-white/5 hover:bg-white/10 rounded border border-[var(--border-subtle)] backdrop-blur-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
        >
          Skip Intro
        </button>
      </div>

      {/* Discreet Bottom-Right Sound Control */}
      <SoundControl variant="floating" />
    </motion.section>
  )
}
