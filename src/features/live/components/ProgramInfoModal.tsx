import React from 'react'
import { Play, Bell, BellOff, Clock, Film, Radio, RotateCcw, AlertTriangle, ShieldAlert, Sparkles } from 'lucide-react'
import type { EPGProgram, EPGChannel, EPGProgramStatus, CatchUpStatus } from '../../../types/epg'
import { Modal } from '../../../components/modals/Modal'
import { Badge } from '../../../components/common/Badge'
import { Button } from '../../../components/common/Button'
import { getCatchUpStatus } from '../../../data/epgSchedule'

export interface ProgramInfoModalProps {
  isOpen: boolean
  onClose: () => void
  program: EPGProgram | null
  channel: EPGChannel | null
  status: EPGProgramStatus
  progressPercent?: number
  remainingMinutes?: number
  hasReminder: boolean
  savedCatchUpProgress?: number
  onToggleReminder: (program: EPGProgram, channel: EPGChannel) => void
  onWatchLive: (channel: EPGChannel, program: EPGProgram) => void
  onWatchCatchUp?: (program: EPGProgram, channel: EPGChannel, catchUpStatus: CatchUpStatus) => void
  onOpenLinkedContent?: (contentId: string) => void
  formatTimeRange: (start: Date, end: Date) => string
}

export const ProgramInfoModal: React.FC<ProgramInfoModalProps> = ({
  isOpen,
  onClose,
  program,
  channel,
  status,
  progressPercent = 0,
  remainingMinutes = 0,
  hasReminder,
  savedCatchUpProgress,
  onToggleReminder,
  onWatchLive,
  onWatchCatchUp,
  onOpenLinkedContent,
  formatTimeRange,
}) => {
  if (!program || !channel) return null

  const isLive = status === 'live'
  const isUpcoming = status === 'upcoming'
  const isEnded = status === 'ended'

  const catchUpStatus = isEnded ? getCatchUpStatus(program) : null
  const hasCatchUpProgress = savedCatchUpProgress !== undefined && savedCatchUpProgress > 0 && savedCatchUpProgress < 95

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`CH ${channel.channelNumber}: ${channel.title}`}
      size="lg"
    >
      <div className="space-y-5 select-none" data-testid="program-info-modal">
        {/* Artwork Header */}
        <div className="relative aspect-video sm:aspect-[21/9] w-full rounded-2xl overflow-hidden bg-black border border-[var(--border-subtle)] shadow-inner">
          <img
            src={program.artworkUrl}
            alt={program.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isLive ? (
                <Badge variant="live" size="sm">
                  ON AIR NOW
                </Badge>
              ) : isUpcoming ? (
                <Badge variant="subtle" size="sm">
                  UPCOMING
                </Badge>
              ) : catchUpStatus?.isAvailable ? (
                <Badge variant="accent" size="sm" className="bg-[var(--accent-primary)]/20 text-[var(--accent-secondary)] border-[var(--accent-primary)]/40 font-bold">
                  CATCH-UP AVAILABLE
                </Badge>
              ) : catchUpStatus?.isExpired ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-red-950/60 text-red-300 border border-red-500/40 font-bold">
                  CATCH-UP EXPIRED
                </span>
              ) : (
                <Badge variant="default" size="sm">
                  CATCH-UP UNAVAILABLE
                </Badge>
              )}

              <Badge variant="subtle" size="sm">
                CH {channel.channelNumber}
              </Badge>
              <Badge variant="subtle" size="sm">
                {channel.quality}
              </Badge>
            </div>

            {program.rating && (
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-black/70 text-white border border-white/20 font-bold">
                {program.rating}
              </span>
            )}
          </div>

          {/* Bottom Title inside Hero */}
          <div className="absolute bottom-3 left-3 right-3 space-y-1">
            <span className="text-xs font-mono text-[var(--accent-secondary)] uppercase tracking-wider block">
              {channel.title} • {program.genre}
            </span>
            <h3 className="font-display font-bold text-xl sm:text-2xl text-white drop-shadow">
              {program.title}
            </h3>
          </div>
        </div>

        {/* Schedule & Time Breakdown */}
        <div className="p-4 rounded-xl bg-[var(--bg-elevated)]/60 border border-[var(--border-subtle)] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <Clock className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
              <span className="font-semibold text-white">
                {catchUpStatus?.broadcastDateText || formatTimeRange(program.startTime, program.endTime)}
              </span>
              <span className="text-[var(--text-muted)]">({program.durationMinutes} mins)</span>
            </div>

            {isLive && (
              <span className="text-[var(--accent-secondary)] font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-ping" />
                {progressPercent}% elapsed • {remainingMinutes}m remaining
              </span>
            )}

            {isUpcoming && (
              <span className="text-emerald-400 font-semibold">
                Scheduled Linear Broadcast
              </span>
            )}

            {isEnded && catchUpStatus?.isAvailable && (
              <span
                className={`font-semibold ${
                  catchUpStatus.isExpiringSoon ? 'text-amber-400 font-bold' : 'text-[var(--accent-secondary)]'
                }`}
              >
                {catchUpStatus.expiryText}
              </span>
            )}

            {isEnded && catchUpStatus?.isExpired && (
              <span className="text-red-400 font-semibold">
                Availability window expired
              </span>
            )}
          </div>

          {/* Live Progress Bar */}
          {isLive && (
            <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}

          {/* Catch-up Availability Callout */}
          {isEnded && catchUpStatus?.isAvailable && (
            <div className="flex items-center gap-2 pt-1 text-xs font-mono text-[var(--text-muted)] border-t border-white/5">
              {catchUpStatus.isExpiringSoon ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Clock className="w-4 h-4 text-[var(--accent-secondary)] shrink-0" />
              )}
              <span>
                Broadcast on <strong>{channel.title}</strong> • Catch-up eligible for {program.catchUpDays || 7} days post-broadcast.
              </span>
            </div>
          )}

          {/* Catch-up Expired / Unavailable Callout */}
          {isEnded && !catchUpStatus?.isAvailable && (
            <div className="flex items-center gap-2 pt-1 text-xs font-mono text-[var(--text-muted)] border-t border-white/5">
              <ShieldAlert className="w-4 h-4 text-white/40 shrink-0" />
              <span>
                {catchUpStatus?.isExpired
                  ? 'Catch-up window has expired. This broadcast is no longer available on catch-up.'
                  : 'Catch-up is unavailable for this programme due to broadcast rights limitations.'}
              </span>
            </div>
          )}
        </div>

        {/* Interactive Television Callout */}
        {program.hasInteractive && (
          <div
            data-testid="modal-interactive-section"
            className="p-3.5 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/40 flex items-center justify-center text-[var(--accent-secondary)] shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  ⚡ Interactive Broadcast Available
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Live polls, audience voting, or quizzes available for this programme.
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              data-testid="program-interact-btn"
              onClick={() => {
                onClose()
                onWatchLive(channel, program)
              }}
              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
            >
              Watch &amp; Interact
            </Button>
          </div>
        )}

        {/* Description */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
            Programme Synopsis
          </h4>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {program.description}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)]">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live Play Action */}
            {isLive && (
              <Button
                variant="primary"
                size="md"
                leftIcon={<Play className="w-4 h-4 fill-current ml-0.5" />}
                onClick={() => {
                  onWatchLive(channel, program)
                  onClose()
                }}
              >
                Watch Live
              </Button>
            )}

            {/* Upcoming Reminder Action */}
            {isUpcoming && (
              <Button
                variant={hasReminder ? 'outline' : 'primary'}
                size="md"
                leftIcon={
                  hasReminder ? (
                    <BellOff className="w-4 h-4 text-[var(--accent-secondary)]" />
                  ) : (
                    <Bell className="w-4 h-4" />
                  )
                }
                onClick={() => onToggleReminder(program, channel)}
              >
                {hasReminder ? 'Reminder Set (Cancel)' : 'Remind Me'}
              </Button>
            )}

            {/* Ended: Watch Catch-up Action (Only if eligible & not expired!) */}
            {isEnded && catchUpStatus?.isAvailable && onWatchCatchUp && (
              <Button
                variant="primary"
                size="md"
                data-testid="modal-watch-catchup-btn"
                leftIcon={
                  hasCatchUpProgress ? (
                    <RotateCcw className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )
                }
                onClick={() => {
                  onWatchCatchUp(program, channel, catchUpStatus)
                  onClose()
                }}
              >
                {hasCatchUpProgress
                  ? `Resume Catch-up (${savedCatchUpProgress}%)`
                  : 'Watch Catch-up'}
              </Button>
            )}

            {/* Linked OTT On-Demand Action */}
            {program.linkedContentId && onOpenLinkedContent && (
              <Button
                variant={isEnded && !catchUpStatus?.isAvailable ? 'primary' : 'outline'}
                size="md"
                data-testid="modal-view-ondemand-btn"
                leftIcon={<Film className="w-4 h-4 text-[var(--accent-primary)]" />}
                onClick={() => {
                  onOpenLinkedContent(program.linkedContentId!)
                  onClose()
                }}
              >
                Watch On Demand (OTT)
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
            <Radio className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Channel {channel.channelNumber}</span>
          </div>
        </div>
      </div>
    </Modal>
  )
}
