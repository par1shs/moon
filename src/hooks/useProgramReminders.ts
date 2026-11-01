import { useState, useEffect, useCallback } from 'react'
import type { EPGProgram, EPGChannel, ProgramReminder } from '../types/epg'

const STORAGE_PREFIX = 'junction_reminders_'

export function useProgramReminders(profileId: string = 'default') {
  const storageKey = `${STORAGE_PREFIX}${profileId}`

  // Reminders state
  const [reminders, setReminders] = useState<ProgramReminder[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Currently triggered in-app reminder notification
  const [dueReminder, setDueReminder] = useState<ProgramReminder | null>(null)

  // Sync to LocalStorage whenever reminders change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(reminders))
    } catch {
      // Ignored
    }
  }, [reminders, storageKey])

  // Reload when profileId changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      setReminders(stored ? JSON.parse(stored) : [])
      setDueReminder(null)
    } catch {
      setReminders([])
    }
  }, [storageKey])

  // Check for due reminders periodically
  useEffect(() => {
    const checkDueReminders = () => {
      const now = Date.now()
      // A reminder is due if startTime is within next 5 minutes or within past 5 minutes, and not yet notified
      const match = reminders.find((r) => {
        if (r.notified) return false
        const startMs = new Date(r.startTimeISO).getTime()
        const diffMinutes = (startMs - now) / (60 * 1000)
        // Due if starting in 5 minutes or started less than 5 minutes ago
        return diffMinutes <= 5 && diffMinutes >= -5
      })

      if (match) {
        setDueReminder(match)
        // Mark as notified in list
        setReminders((prev) =>
          prev.map((r) => (r.id === match.id ? { ...r, notified: true } : r))
        )
      }
    }

    checkDueReminders()
    const timer = window.setInterval(checkDueReminders, 10000)
    return () => window.clearInterval(timer)
  }, [reminders])

  // Toggle reminder for a programme
  const toggleReminder = useCallback(
    (program: EPGProgram, channel: EPGChannel): boolean => {
      let added = false
      setReminders((prev) => {
        const existingIdx = prev.findIndex((r) => r.programId === program.id)
        if (existingIdx !== -1) {
          // Remove
          added = false
          return prev.filter((r) => r.programId !== program.id)
        } else {
          // Add
          added = true
          const newReminder: ProgramReminder = {
            id: `rem-${program.id}`,
            programId: program.id,
            channelId: channel.id,
            channelNumber: channel.channelNumber,
            channelTitle: channel.title,
            programTitle: program.title,
            startTimeISO: program.startTime.toISOString(),
            genre: program.genre,
            artworkUrl: program.artworkUrl,
            notified: false,
          }
          return [...prev, newReminder]
        }
      })
      return added
    },
    []
  )

  const hasReminder = useCallback(
    (programId: string): boolean => {
      return reminders.some((r) => r.programId === programId)
    },
    [reminders]
  )

  const removeReminder = useCallback((programId: string) => {
    setReminders((prev) => prev.filter((r) => r.programId !== programId))
  }, [])

  const dismissDueReminder = useCallback(() => {
    setDueReminder(null)
  }, [])

  return {
    reminders,
    dueReminder,
    toggleReminder,
    hasReminder,
    removeReminder,
    dismissDueReminder,
  }
}
