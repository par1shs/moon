import React from 'react'
import { Bell, Play, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import type { ProgramReminder } from '../../../types/epg'
import { Button } from '../../../components/common/Button'

export interface ReminderToastProps {
  reminder: ProgramReminder | null
  onWatchLive: (channelId: string) => void
  onDismiss: () => void
}

export const ReminderToast: React.FC<ReminderToastProps> = ({
  reminder,
  onWatchLive,
  onDismiss,
}) => {
  if (!reminder) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="fixed top-20 right-4 sm:right-8 z-50 max-w-md w-full p-4 rounded-2xl bg-[var(--bg-elevated)]/95 border border-[var(--accent-primary)]/60 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl select-none"
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/40 flex items-center justify-center shrink-0 text-[var(--accent-secondary)] shadow-sm">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent-secondary)] font-semibold">
                PROGRAMME REMINDER
              </span>
              <button
                type="button"
                onClick={onDismiss}
                className="text-[var(--text-muted)] hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                title="Dismiss"
                aria-label="Dismiss reminder"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h4 className="font-display font-bold text-sm text-[var(--text-primary)] truncate">
              {reminder.programTitle}
            </h4>

            <p className="text-xs font-mono text-[var(--text-secondary)]">
              Starting on <strong className="text-white">CH {reminder.channelNumber}</strong> • {reminder.channelTitle}
            </p>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
                onClick={() => {
                  onWatchLive(reminder.channelId)
                  onDismiss()
                }}
              >
                Tune &amp; Watch Live
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
