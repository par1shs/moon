import React, { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, RotateCcw, ShieldCheck } from 'lucide-react'
import type { Profile } from '../types'
import { BrandLogo } from '../../../components/common/BrandLogo'
import { Button } from '../../../components/common/Button'
import { SoundControl } from '../../audio/SoundControl'
import { AvatarRenderer } from './AvatarRenderer'
import { useReducedMotionPreference } from '../../../hooks/useReducedMotionPreference'
import { AmbientRisingPixels } from '../../startup/components/AmbientRisingPixels'

export interface ProfileWelcomeProps {
  profile: Profile
  onContinueToApp: () => void
  onBackToProfiles: () => void
  onReplayStartupIntro?: () => void
  onOpenDevShell?: () => void
  autoAdvance?: boolean
}

export const ProfileWelcome: React.FC<ProfileWelcomeProps> = ({
  profile,
  onContinueToApp,
  onBackToProfiles,
  onReplayStartupIntro,
  onOpenDevShell,
  autoAdvance = true,
}) => {
  const reducedMotion = useReducedMotionPreference()
  const timerRef = useRef<number | null>(null)

  // Auto-advance to the streaming homepage after a brief moment (or immediate on click)
  useEffect(() => {
    if (autoAdvance) {
      const duration = reducedMotion ? 1600 : 2800
      timerRef.current = window.setTimeout(() => {
        onContinueToApp()
      }, duration)
    }

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [autoAdvance, onContinueToApp, reducedMotion])

  const handleManualContinue = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
    }
    onContinueToApp()
  }

  const handleSwitch = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
    }
    onBackToProfiles()
  }

  return (
    <motion.div
      key={`welcome-${profile.id}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="min-h-screen w-full bg-transparent text-[var(--text-primary)] flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden relative"
    >
      {/* Ambient Rising Pixels */}
      <AmbientRisingPixels />

      {/* Permanent Brand Primary Atmospheric Glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-[100%] blur-[130px] opacity-70 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, #242B40 0%, #151B2E 45%, transparent 75%)' }}
      />

      {/* Dynamic Ambient Background Glow in Profile's Accent Color */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] rounded-full pointer-events-none blur-3xl opacity-35 transition-all duration-700"
        style={{
          background: `radial-gradient(circle, var(--accent-glow) 0%, rgba(0,0,0,0) 70%)`,
        }}
      />

      {/* Top Navigation */}
      <header className="w-full flex items-center justify-between z-10">
        <BrandLogo size="sm" />

        <div className="flex items-center gap-2">
          {onReplayStartupIntro && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReplayStartupIntro}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Replay Intro
            </Button>
          )}

          {onOpenDevShell && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenDevShell}
            >
              Dev Shell
            </Button>
          )}
        </div>
      </header>

      {/* Center Welcome Hero */}
      <main className="w-full max-w-xl mx-auto my-auto flex flex-col items-center text-center py-10 z-10">
        {/* Animated Avatar Frame */}
        <motion.div
          initial={{ scale: reducedMotion ? 1 : 0.9, opacity: 0, y: reducedMotion ? 0 : 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-6 sm:mb-8"
        >
          <div className="p-2 rounded-3xl border-2 border-[var(--accent-primary)]/40 shadow-[var(--shadow-elevated)] bg-[var(--bg-card)]/50 backdrop-blur-md">
            <AvatarRenderer
              config={profile.avatarConfig}
              size="xl"
              isKids={profile.isKidsProfile}
            />
          </div>

          {/* Status Pip */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[10px] font-mono uppercase tracking-widest text-[var(--accent-secondary)] shadow-md flex items-center gap-1.5 whitespace-nowrap">
            {profile.isKidsProfile ? (
              <>
                <ShieldCheck className="w-3 h-3 text-[var(--accent-primary)]" />
                <span>Kids Safe Active</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                <span>Profile Loaded</span>
              </>
            )}
          </div>
        </motion.div>

        {/* Text Reveal */}
        <motion.div
          initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
          className="space-y-3 mb-8"
        >
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--accent-secondary)]">
            EXPERIENCE READY
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Welcome, {profile.name}.
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-secondary)] font-normal max-w-md mx-auto leading-relaxed">
            Your <span className="font-pixel font-bold text-[var(--accent-primary)]">PIXEL+</span> experience is ready.
          </p>
        </motion.div>

        {/* Action Controls */}
        <motion.div
          initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto"
        >
          <Button
            variant="primary"
            size="lg"
            onClick={handleManualContinue}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto min-w-[180px]"
          >
            Enter PIXEL+
          </Button>

          <Button
            variant="ghost"
            size="md"
            onClick={handleSwitch}
            className="w-full sm:w-auto"
          >
            Switch Profile
          </Button>
        </motion.div>
      </main>

      {/* Footer / Discrete Sound Control */}
      <footer className="w-full flex items-center justify-between text-xs text-[var(--text-muted)] font-mono z-10">
        <span className="font-pixel font-bold tracking-wider">
          PIXEL<span className="text-[var(--accent-primary)]">+</span> • ONE STORY. EVERY SCREEN.
        </span>
        <SoundControl variant="inline" />
      </footer>
    </motion.div>
  )
}
