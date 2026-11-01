import { useState, useEffect, useMemo, useCallback } from 'react'
import type { EPGChannel, EPGProgram, ChannelLiveState, EPGProgramStatus } from '../types/epg'
import { EPG_CHANNELS, generateRollingSchedule } from '../data/epgSchedule'

export function useEPGSchedule(selectedCategory: string = 'All Channels') {
  // Live ticking clock updated every 10 seconds
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date())
    }, 10000)
    return () => window.clearInterval(timer)
  }, [])

  // Filter channels based on selected category
  const filteredChannels = useMemo(() => {
    if (selectedCategory === 'All Channels') return EPG_CHANNELS
    return EPG_CHANNELS.filter((ch) => ch.category.toLowerCase() === selectedCategory.toLowerCase())
  }, [selectedCategory])

  // Rolling schedules for all channels (spans yesterday, today, tomorrow)
  const currentDay = currentTime.toDateString()
  const channelSchedules = useMemo(() => {
    const schedules: Record<string, EPGProgram[]> = {}
    for (const ch of EPG_CHANNELS) {
      schedules[ch.id] = generateRollingSchedule(ch.id, currentTime)
    }
    return schedules
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDay])

  // Helper to determine programme status relative to given time
  const getProgramStatus = useCallback(
    (program: EPGProgram, refTime: Date = currentTime): EPGProgramStatus => {
      const nowMs = refTime.getTime()
      const startMs = program.startTime.getTime()
      const endMs = program.endTime.getTime()

      if (nowMs >= startMs && nowMs < endMs) return 'live'
      if (nowMs < startMs) return 'upcoming'
      return 'ended'
    },
    [currentTime]
  )

  // Calculate live state for a channel at currentTime
  const getChannelLiveState = useCallback(
    (channel: EPGChannel, now: Date = currentTime): ChannelLiveState => {
      const schedule = channelSchedules[channel.id] || []
      const nowMs = now.getTime()

      // Find currently airing programme
      const currentProgram =
        schedule.find((p) => {
          const s = p.startTime.getTime()
          const e = p.endTime.getTime()
          return nowMs >= s && nowMs < e
        }) || null

      let nextProgram: EPGProgram | null = null
      let progressPercent = 0
      let remainingMinutes = 0
      let elapsedMinutes = 0

      if (currentProgram) {
        const s = currentProgram.startTime.getTime()
        const e = currentProgram.endTime.getTime()
        const totalDurationMs = e - s

        if (totalDurationMs > 0) {
          progressPercent = Math.min(100, Math.max(0, ((nowMs - s) / totalDurationMs) * 100))
          remainingMinutes = Math.max(0, Math.ceil((e - nowMs) / (60 * 1000)))
          elapsedMinutes = Math.max(0, Math.floor((nowMs - s) / (60 * 1000)))
        }

        // Find next programme right after current
        const nextIdx = schedule.findIndex((p) => p.id === currentProgram.id)
        if (nextIdx !== -1 && nextIdx + 1 < schedule.length) {
          nextProgram = schedule[nextIdx + 1]
        }
      } else {
        // Fallback: find first upcoming programme
        nextProgram = schedule.find((p) => p.startTime.getTime() > nowMs) || null
      }

      return {
        channel,
        currentProgram,
        nextProgram,
        progressPercent: Math.round(progressPercent),
        remainingMinutes,
        elapsedMinutes,
      }
    },
    [channelSchedules, currentTime]
  )

  // Map of live states for all channels
  const channelLiveStates = useMemo(() => {
    const states: Record<string, ChannelLiveState> = {}
    for (const ch of EPG_CHANNELS) {
      states[ch.id] = getChannelLiveState(ch, currentTime)
    }
    return states
  }, [getChannelLiveState, currentTime])

  // Get programmes within a specific time window for a channel
  const getProgramsInWindow = useCallback(
    (channelId: string, windowStart: Date, windowEnd: Date): EPGProgram[] => {
      const schedule = channelSchedules[channelId] || []
      const startMs = windowStart.getTime()
      const endMs = windowEnd.getTime()

      return schedule.filter((p) => {
        const pStart = p.startTime.getTime()
        const pEnd = p.endTime.getTime()
        return pEnd > startMs && pStart < endMs
      })
    },
    [channelSchedules]
  )

  // Time formatters using local time
  const formatTime = useCallback((date: Date): string => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }, [])

  const formatTimeRange = useCallback(
    (start: Date, end: Date): string => {
      return `${formatTime(start)} – ${formatTime(end)}`
    },
    [formatTime]
  )

  return {
    currentTime,
    channels: EPG_CHANNELS,
    filteredChannels,
    channelSchedules,
    channelLiveStates,
    getChannelLiveState,
    getProgramStatus,
    getProgramsInWindow,
    formatTime,
    formatTimeRange,
  }
}
