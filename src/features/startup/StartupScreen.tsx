import React, { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { Sparkles } from 'lucide-react'
import { BrandLogo } from '../../components/common/BrandLogo'
import { SoundControl } from '../audio/SoundControl'
import { playStartupSonicIdentity } from './StartupAudio'
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference'

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

    // Complete sequence after 3.4 seconds (or 1.8 seconds if reduced motion)
    if (autoAdvance) {
      const completionDuration = reducedMotion ? 1800 : 3400
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
    >
      {/* 1 & 2: Subtle Ambient Light / Gradient Effect */}
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
        className="absolute w-[360px] h-[360px] sm:w-[600px] sm:h-[600px] md:w-[750px] md:h-[750px] rounded-full pointer-events-none blur-3xl"
        style={{
          background:
            'radial-gradient(circle, var(--accent-primary) 0%, var(--accent-glow) 40%, transparent 70%)',
        }}
      />

      {/* Center Cinematic Container */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-xl">
        {/* 3 & 4: PIXEL Logo with Light Sweep */}
        <motion.div
          initial={{
            opacity: 0,
            scale: reducedMotion ? 1 : 0.96,
            y: reducedMotion ? 0 : 4,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          transition={{
            duration: reducedMotion ? 0.4 : 0.9,
            ease: [0.16, 1, 0.3, 1],
            delay: reducedMotion ? 0.1 : 0.5,
          }}
          className="relative inline-block overflow-hidden px-4 py-2"
        >
          {/* Logo mark */}
          <BrandLogo size="xl" showTagline={false} />

          {/* 4: Restrained Light Sweep across the logo */}
          {!reducedMotion && (
            <motion.div
              initial={{ x: '-120%', opacity: 0 }}
              animate={{
                x: '220%',
                opacity: [0, 0.4, 0.6, 0.3, 0],
              }}
              transition={{
                duration: 0.95,
                ease: [0.4, 0, 0.2, 1],
                delay: 1.25,
              }}
              className="absolute inset-y-0 w-1/2 pointer-events-none"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.18) 50%, transparent 100%)',
                transform: 'skewX(-20deg)',
              }}
            />
          )}
        </motion.div>

        {/* 5: Tagline: "ONE STORY. EVERY SCREEN." */}
        <motion.div
          initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reducedMotion ? 0.3 : 0.6,
            ease: 'easeOut',
            delay: reducedMotion ? 0.4 : 1.9,
          }}
          className="mt-4"
        >
          <span className="font-pixel font-bold uppercase text-[var(--text-primary)] text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.25em]">
            ONE STORY. EVERY SCREEN.
          </span>
        </motion.div>

        {/* 6: Supporting line: "Your entertainment destination." */}
        <motion.div
          initial={{ opacity: 0, y: reducedMotion ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reducedMotion ? 0.3 : 0.6,
            ease: 'easeOut',
            delay: reducedMotion ? 0.6 : 2.4,
          }}
          className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-card)]/60 border border-[var(--border-subtle)] backdrop-blur-sm"
        >
          <Sparkles className="w-3 h-3 text-[var(--accent-secondary)]" />
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
