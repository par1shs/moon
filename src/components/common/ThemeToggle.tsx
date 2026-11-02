import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useTheme } from '../../hooks/useTheme'
import { useAudio } from '../../features/audio/useAudio'
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference'

export interface ThemeToggleProps {
  variant?: 'icon' | 'row'
  className?: string
  showLabel?: boolean
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  className = '',
  showLabel = false,
}) => {
  const { colorMode, toggleColorMode } = useTheme()
  const { playProfileSelectSound } = useAudio()
  const reducedMotion = useReducedMotionPreference()

  const isDark = colorMode === 'dark'

  const handleToggle = () => {
    playProfileSelectSound?.()
    toggleColorMode()
  }

  if (variant === 'row') {
    return (
      <div
        data-testid="theme-toggle-row"
        className={`px-3 py-2.5 rounded-lg flex items-center justify-between gap-2 hover:bg-[var(--border-subtle)] transition-colors duration-150 cursor-pointer ${className}`}
        onClick={handleToggle}
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-primary)]">
            {isDark ? (
              <Moon className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Sun className="w-3.5 h-3.5 fill-current" />
            )}
          </div>
          <div>
            <span className="block text-sm font-medium text-[var(--text-primary)]">
              Color Theme
            </span>
            <span className="block text-xs text-[var(--text-muted)] font-mono">
              {isDark ? 'Dark Mode (Active)' : 'Light Mode (Active)'}
            </span>
          </div>
        </div>

        {/* Accessible Switch Button */}
        <button
          type="button"
          role="switch"
          aria-checked={!isDark}
          data-testid="theme-toggle-switch"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={(e) => {
            e.stopPropagation()
            handleToggle()
          }}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
            !isDark ? 'bg-[var(--accent-primary)]' : 'bg-white/15'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
              !isDark ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      data-testid="theme-toggle-btn"
      onClick={handleToggle}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`group relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] bg-[var(--bg-card)]/80 hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-sm ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="dark-sun"
            initial={reducedMotion ? false : { rotate: -45, opacity: 0, scale: 0.8 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={reducedMotion ? undefined : { rotate: 45, opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center text-amber-400 group-hover:text-amber-300"
          >
            <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </motion.div>
        ) : (
          <motion.div
            key="light-moon"
            initial={reducedMotion ? false : { rotate: 45, opacity: 0, scale: 0.8 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={reducedMotion ? undefined : { rotate: -45, opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center text-[var(--accent-primary)]"
          >
            <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </motion.div>
        )}
      </AnimatePresence>

      {showLabel && (
        <span className="ml-2 text-xs font-mono font-medium">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  )
}
