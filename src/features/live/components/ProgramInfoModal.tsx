import React from 'react'
import { Play, Bell, BellOff, Clock, Film, Radio } from 'lucide-react'
import type { EPGProgram, EPGChannel, EPGProgramStatus } from '../../../types/epg'
import { Modal } from '../../../components/modals/Modal'
import { Badge } from '../../../components/common/Badge'
import { Button } from '../../../components/common/Button'

export interface ProgramInfoModalProps {
  isOpen: boolean
  onClose: () => void
  program: EPGProgram | null
  channel: EPGChannel | null
  status: EPGProgramStatus
  progressPercent?: number
  remainingMinutes?: number
  hasReminder: boolean
  onToggleReminder: (program: EPGProgram, channel: EPGChannel) => void
  onWatchLive: (channel: EPGChannel, program: EPGProgram) => void
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
  onToggleReminder,
  onWatchLive,
  onOpenLinkedContent,
  formatTimeRange,
}) => {
  if (!program || !channel) return null

  const isLive = status === 'live'
  const isUpcoming = status === 'upcoming'

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
              ) : (
                <Badge variant="default" size="sm">
                  ENDED
                </Badge>
              )}
              <Badge variant="accent" size="sm">
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
                {formatTimeRange(program.startTime, program.endTime)}
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
                Scheduled Broadcast
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
        </div>

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
          <div className="flex items-center gap-2.5">
            {isLive ? (
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
            ) : isUpcoming ? (
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
            ) : null}

            {program.linkedContentId && onOpenLinkedContent && (
              <Button
                variant="outline"
                size="md"
                leftIcon={<Film className="w-4 h-4 text-[var(--accent-primary)]" />}
                onClick={() => {
                  onOpenLinkedContent(program.linkedContentId!)
                  onClose()
                }}
              >
                View On Demand
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
            <Radio className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Linear Feed: Ch {channel.channelNumber}</span>
          </div>
        </div>
      </div>
    </Modal>
  )
}
