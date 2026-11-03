import React from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { motion } from 'motion/react'
import { useAudio } from './useAudio'

export interface SoundControlProps {
  className?: string
  variant?: 'floating' | 'inline'
}

export const SoundControl: React.FC<SoundControlProps> = ({
  className = '',
  variant = 'floating',
}) => {
  const { isSoundEnabled, toggleSound } = useAudio()

  const baseStyles =
    variant === 'floating'
      ? 'fixed bottom-6 right-6 z-50'
      : 'relative'

  return (
    <div className={`${baseStyles} ${className}`}>
      <motion.button
        type="button"
        onClick={toggleSound}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isSoundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
        title={isSoundEnabled ? 'Sound is on (Click to mute)' : 'Sound is muted (Click to enable)'}
        className="group flex items-center gap-2 px-3 py-2 rounded-full bg-[var(--bg-card)]/80 hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/40 text-[var(--text-secondary)] hover:text-[var(--text-primary)] backdrop-blur-md shadow-lg transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
      >
        <span className="text-[var(--accent-primary)] transition-transform duration-200 group-hover:scale-110">
          {isSoundEnabled ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4 text-[var(--text-muted)]" />
          )}
        </span>

        <span className="text-xs font-mono tracking-wider uppercase pr-1 text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
          {isSoundEnabled ? 'Sound On' : 'Muted'}
        </span>
      </motion.button>
    </div>
  )
}
