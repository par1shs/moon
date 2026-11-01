import React, { useState, useRef, useMemo } from 'react'
import { Play, Bell, Clock, ChevronLeft, ChevronRight, Compass, Radio } from 'lucide-react'
import type { EPGChannel, EPGProgram, EPGProgramStatus } from '../../../types/epg'
import { Badge } from '../../../components/common/Badge'
import { Button } from '../../../components/common/Button'

export interface EPGFullGuideProps {
  channels: EPGChannel[]
  channelSchedules: Record<string, EPGProgram[]>
  tunedChannelId: string
  currentTime: Date
  hasReminder: (programId: string) => boolean
  onSelectProgram: (channel: EPGChannel, program: EPGProgram) => void
  onTuneChannel: (channelId: string) => void
  onWatchLive: (channel: EPGChannel, program: EPGProgram) => void
  onToggleReminder: (program: EPGProgram, channel: EPGChannel) => void
  getProgramStatus: (program: EPGProgram, now?: Date) => EPGProgramStatus
  formatTime: (date: Date) => string
  formatTimeRange: (start: Date, end: Date) => string
}

export const EPGFullGuide: React.FC<EPGFullGuideProps> = ({
  channels,
  channelSchedules,
  tunedChannelId,
  currentTime,
  hasReminder,
  onSelectProgram,
  onTuneChannel,
  onWatchLive,
  onToggleReminder,
  getProgramStatus,
  formatTime,
  formatTimeRange,
}) => {
  // Mobile selected channel tab
  const [mobileChannelId, setMobileChannelId] = useState<string>(tunedChannelId || channels[0]?.id)
  const [prevTunedId, setPrevTunedId] = useState(tunedChannelId)

  // Timeline window offset in minutes relative to currentTime (rounded down to half-hour)
  const [windowOffsetMinutes, setWindowOffsetMinutes] = useState(0)

  // Sync mobile selected channel if tuned channel changes
  if (prevTunedId !== tunedChannelId) {
    setPrevTunedId(tunedChannelId)
    if (tunedChannelId) {
      setMobileChannelId(tunedChannelId)
    }
  }

  // Calculate 5-hour timeline window starting 30 minutes before current half-hour
  const { windowStart, windowEnd, timeSlots } = useMemo(() => {
    const totalMinutes = 300 // 5 hours visible
    const base = new Date(currentTime)

    // Round to previous 30-min boundary
    const mins = base.getMinutes()
    base.setMinutes(mins < 30 ? 0 : 30, 0, 0)
    base.setMinutes(base.getMinutes() - 30 + windowOffsetMinutes)

    const start = new Date(base)
    const end = new Date(start.getTime() + totalMinutes * 60 * 1000)

    // Generate 30-minute slot markers
    const slots: Date[] = []
    let cursor = new Date(start)
    while (cursor.getTime() < end.getTime()) {
      slots.push(new Date(cursor))
      cursor = new Date(cursor.getTime() + 30 * 60 * 1000)
    }

    return {
      windowStart: start,
      windowEnd: end,
      timeSlots: slots,
    }
  }, [currentTime, windowOffsetMinutes])

  // Current time marker position percentage within visible window
  const currentTimePercent = useMemo(() => {
    const nowMs = currentTime.getTime()
    const startMs = windowStart.getTime()
    const endMs = windowEnd.getTime()
    if (nowMs < startMs || nowMs > endMs) return null
    return ((nowMs - startMs) / (endMs - startMs)) * 100
  }, [currentTime, windowStart, windowEnd])

  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  const handleJumpToNow = () => {
    setWindowOffsetMinutes(0)
  }

  const handlePrevWindow = () => {
    setWindowOffsetMinutes((prev) => prev - 120) // back 2 hours
  }

  const handleNextWindow = () => {
    setWindowOffsetMinutes((prev) => prev + 120) // forward 2 hours
  }

  const activeMobileChannel = channels.find((c) => c.id === mobileChannelId) || channels[0]
  const mobileSchedule = channelSchedules[activeMobileChannel?.id] || []

  return (
    <div className="space-y-4 select-none" data-testid="epg-full-guide">
      {/* ─── Top Guide Navigation & Time Controls ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Compass className="w-3.5 h-3.5 text-[var(--accent-primary)]" />}
            onClick={handleJumpToNow}
          >
            Jump to Now
          </Button>

          <span className="text-xs font-mono text-[var(--text-muted)] hidden sm:inline-block">
            {formatTime(windowStart)} – {formatTime(windowEnd)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevWindow}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-mono transition-colors cursor-pointer"
            title="Scroll earlier"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">-2 Hours</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/40 text-xs font-mono text-[var(--accent-secondary)]">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-ping" />
            <span className="font-semibold">LIVE TICK</span>
            <span className="text-white font-bold">{formatTime(currentTime)}</span>
          </div>

          <button
            type="button"
            onClick={handleNextWindow}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-mono transition-colors cursor-pointer"
            title="Scroll later"
          >
            <span className="hidden sm:inline">+2 Hours</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── DESKTOP & TABLET HORIZONTAL TIMELINE GRID ─── */}
      <div className="hidden md:block rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-card)]/90 shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto scrollbar-thin" ref={scrollContainerRef}>
          <div className="min-w-[1100px] relative">
            {/* ─── Header Ruler Row ─── */}
            <div className="flex border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/90 sticky top-0 z-20 backdrop-blur-md">
              {/* Channel Header column */}
              <div className="w-56 shrink-0 p-3.5 border-r border-[var(--border-subtle)] text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider flex items-center justify-between">
                <span>Channels ({channels.length})</span>
                <Radio className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              </div>

              {/* Time Slots Ruler */}
              <div className="flex-1 relative flex">
                {timeSlots.map((slot, idx) => (
                  <div
                    key={idx}
                    className="flex-1 p-3 text-xs font-mono text-[var(--text-secondary)] border-r border-white/5 flex items-center gap-1.5"
                  >
                    <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                    <span>{formatTime(slot)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ─── Channel Rows & Program Blocks Container ─── */}
            <div className="relative">
              {/* Live Current Time Red Vertical Line Marker */}
              {currentTimePercent !== null && (
                <div
                  className="absolute top-0 bottom-0 z-30 pointer-events-none flex flex-col items-center"
                  style={{
                    left: `calc(14rem + (100% - 14rem) * ${currentTimePercent / 100})`,
                  }}
                >
                  <div className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-mono font-bold shadow-lg -mt-3.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    <span>NOW</span>
                  </div>
                  <div className="w-0.5 flex-1 bg-red-500/90 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                </div>
              )}

              {/* Channel Rows */}
              {channels.map((ch) => {
                const isTuned = ch.id === tunedChannelId
                const schedule = channelSchedules[ch.id] || []
                const windowStartMs = windowStart.getTime()
                const windowEndMs = windowEnd.getTime()
                const windowDurationMs = windowEndMs - windowStartMs

                // Filter programmes that overlap with the visible 5-hour window
                const visiblePrograms = schedule.filter((p) => {
                  const s = p.startTime.getTime()
                  const e = p.endTime.getTime()
                  return e > windowStartMs && s < windowEndMs
                })

                return (
                  <div
                    key={ch.id}
                    className={`flex border-b border-[var(--border-subtle)] transition-colors ${
                      isTuned ? 'bg-[var(--accent-primary)]/5' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Channel Fixed Column */}
                    <div
                      onClick={() => onTuneChannel(ch.id)}
                      className={`w-56 shrink-0 p-3.5 border-r border-[var(--border-subtle)] flex items-center justify-between gap-2.5 cursor-pointer group bg-[var(--bg-card)]/95 sticky left-0 z-10 ${
                        isTuned ? 'ring-1 ring-[var(--accent-primary)]/40' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-lg border flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-transform ${
                            isTuned
                              ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] border-[var(--accent-primary)] scale-105 shadow-sm'
                              : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--accent-primary)] group-hover:scale-105'
                          }`}
                        >
                          {ch.channelNumber}
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-display font-semibold text-xs text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors truncate">
                            {ch.title}
                          </h4>
                          <span className="text-[10px] font-mono text-[var(--text-muted)] block truncate">
                            {ch.quality} • {ch.category}
                          </span>
                        </div>
                      </div>

                      {isTuned && (
                        <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] shrink-0 shadow-[0_0_8px_var(--accent-primary)]" />
                      )}
                    </div>

                    {/* Timeline Programme Cells */}
                    <div className="flex-1 relative h-20 overflow-hidden bg-black/20">
                      {visiblePrograms.map((program) => {
                        const status = getProgramStatus(program, currentTime)
                        const isLive = status === 'live'
                        const isEnded = status === 'ended'
                        const hasRem = hasReminder(program.id)

                        // Clamped start and end times within visible window
                        const pStartMs = Math.max(windowStartMs, program.startTime.getTime())
                        const pEndMs = Math.min(windowEndMs, program.endTime.getTime())

                        const leftPercent = ((pStartMs - windowStartMs) / windowDurationMs) * 100
                        const widthPercent = Math.max(1, ((pEndMs - pStartMs) / windowDurationMs) * 100)

                        // Live progress within this programme
                        let progressFill = 0
                        if (isLive) {
                          const totalMs = program.endTime.getTime() - program.startTime.getTime()
                          progressFill = Math.min(
                            100,
                            Math.max(0, ((currentTime.getTime() - program.startTime.getTime()) / totalMs) * 100)
                          )
                        }

                        return (
                          <div
                            key={program.id}
                            data-testid={`epg-program-block-${program.id}`}
                            onClick={() => onSelectProgram(ch, program)}
                            style={{
                              left: `${leftPercent}%`,
                              width: `${widthPercent}%`,
                            }}
                            className={`absolute top-1 bottom-1 p-2 rounded-xl border transition-all cursor-pointer group/cell overflow-hidden flex flex-col justify-between select-none ${
                              isLive
                                ? 'bg-[var(--bg-elevated)] border-[var(--accent-primary)]/80 ring-1 ring-[var(--accent-primary)]/50 shadow-[0_4px_16px_var(--accent-glow)] z-10'
                                : isEnded
                                ? 'bg-[var(--bg-card)]/40 border-white/5 text-[var(--text-muted)] opacity-60 hover:opacity-90'
                                : 'bg-[var(--bg-card)]/80 border-[var(--border-subtle)] hover:border-white/30 hover:bg-[var(--bg-elevated)]'
                            }`}
                          >
                            {/* Live Progress Background Tint */}
                            {isLive && (
                              <div
                                className="absolute inset-y-0 left-0 bg-[var(--accent-primary)]/15 pointer-events-none transition-all duration-300"
                                style={{ width: `${progressFill}%` }}
                              />
                            )}

                            {/* Top Details */}
                            <div className="relative z-10 flex items-center justify-between gap-1 text-[10px] font-mono">
                              <span
                                className={`truncate ${
                                  isLive
                                    ? 'text-[var(--accent-secondary)] font-bold'
                                    : 'text-[var(--text-muted)]'
                                }`}
                              >
                                {formatTimeRange(program.startTime, program.endTime)}
                              </span>

                              <div className="flex items-center gap-1 shrink-0">
                                {isLive && (
                                  <Badge variant="live" size="sm" className="px-1 py-0 text-[8px]">
                                    LIVE
                                  </Badge>
                                )}
                                {hasRem && (
                                  <Bell className="w-3 h-3 text-[var(--accent-primary)] fill-current" />
                                )}
                              </div>
                            </div>

                            {/* Title & Genre */}
                            <div className="relative z-10 min-w-0">
                              <h5 className="font-display font-semibold text-xs text-[var(--text-primary)] group-hover/cell:text-[var(--accent-primary)] transition-colors truncate">
                                {program.title}
                              </h5>
                              <span className="text-[10px] font-mono text-[var(--text-muted)] block truncate">
                                {program.genre} • {program.durationMinutes}m
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── MOBILE RESPONSIVE VERTICALLY STACKED SCHEDULE ─── */}
      <div data-testid="epg-mobile-guide" className="block md:hidden space-y-4">
        {/* Mobile Channel Horizontal Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {channels.map((ch) => {
            const isSelected = ch.id === mobileChannelId
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => setMobileChannelId(ch.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium whitespace-nowrap transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] border-[var(--accent-primary)] font-bold shadow-md'
                    : 'bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                }`}
              >
                CH {ch.channelNumber} • {ch.title.split(' ')[0]}
              </button>
            )
          })}
        </div>

        {/* Selected Channel Mobile Header */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] flex items-center justify-center font-mono font-bold text-sm">
              {activeMobileChannel.channelNumber}
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                {activeMobileChannel.title}
              </h3>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                {activeMobileChannel.category} • {activeMobileChannel.quality}
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onTuneChannel(activeMobileChannel.id)}
          >
            {activeMobileChannel.id === tunedChannelId ? 'Tuned' : 'Tune'}
          </Button>
        </div>

        {/* Vertical Chronological Schedule List */}
        <div className="space-y-3">
          {mobileSchedule.map((program) => {
            const status = getProgramStatus(program, currentTime)
            const isLive = status === 'live'
            const isEnded = status === 'ended'
            const hasRem = hasReminder(program.id)

            return (
              <div
                key={program.id}
                onClick={() => onSelectProgram(activeMobileChannel, program)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                  isLive
                    ? 'bg-[var(--bg-elevated)] border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/40 shadow-md'
                    : isEnded
                    ? 'bg-[var(--bg-card)]/40 border-white/5 opacity-60'
                    : 'bg-[var(--bg-card)] border-[var(--border-subtle)]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isLive ? (
                      <Badge variant="live" size="sm">
                        ON AIR
                      </Badge>
                    ) : (
                      <span className="text-xs font-mono text-[var(--accent-secondary)] font-semibold">
                        {formatTimeRange(program.startTime, program.endTime)}
                      </span>
                    )}
                    <span className="text-xs font-mono text-[var(--text-muted)]">
                      ({program.durationMinutes}m)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {hasRem && (
                      <Bell className="w-3.5 h-3.5 text-[var(--accent-primary)] fill-current" />
                    )}
                    <Badge variant="subtle" size="sm">
                      {program.rating}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-20 aspect-video rounded-lg overflow-hidden bg-black shrink-0 border border-white/10">
                    <img
                      src={program.artworkUrl}
                      alt={program.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-display font-bold text-sm text-[var(--text-primary)] truncate">
                      {program.title}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-1">
                      {program.description}
                    </p>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      {program.genre}
                    </span>
                  </div>
                </div>

                {/* Mobile Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-white/5 text-xs font-mono">
                  {isLive ? (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                      onClick={(e) => {
                        e.stopPropagation()
                        onWatchLive(activeMobileChannel, program)
                      }}
                    >
                      Watch Live
                    </Button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleReminder(program, activeMobileChannel)
                      }}
                      className="flex items-center gap-1 text-[var(--accent-secondary)]"
                    >
                      <Bell className="w-3 h-3" />
                      <span>{hasRem ? 'Reminder Set' : 'Remind Me'}</span>
                    </button>
                  )}
                  <span className="text-[var(--text-muted)] text-[11px]">Tap for details</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
