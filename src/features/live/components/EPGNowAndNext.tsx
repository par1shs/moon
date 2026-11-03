import React from 'react'
import { Play, Bell } from 'lucide-react'
import type { EPGChannel, EPGProgram, ChannelLiveState } from '../../../types/epg'
import { Badge } from '../../../components/common/Badge'
import { Button } from '../../../components/common/Button'

export interface EPGNowAndNextProps {
  channels: EPGChannel[]
  liveStates: Record<string, ChannelLiveState>
  tunedChannelId: string
  hasReminder: (programId: string) => boolean
  onSelectProgram: (channel: EPGChannel, program: EPGProgram) => void
  onTuneChannel: (channelId: string) => void
  onWatchLive: (channel: EPGChannel, program: EPGProgram) => void
  onToggleReminder: (program: EPGProgram, channel: EPGChannel) => void
  formatTime: (date: Date) => string
  formatTimeRange: (start: Date, end: Date) => string
}

export const EPGNowAndNext: React.FC<EPGNowAndNextProps> = ({
  channels,
  liveStates,
  tunedChannelId,
  hasReminder,
  onSelectProgram,
  onTuneChannel,
  onWatchLive,
  onToggleReminder,
  formatTime,
  formatTimeRange,
}) => {
  return (
    <div className="space-y-4 select-none" data-testid="epg-now-and-next">
      {channels.map((ch) => {
        const state = liveStates[ch.id]
        const isTuned = ch.id === tunedChannelId
        const currentEp = state?.currentProgram
        const nextEp = state?.nextProgram
        const progress = state?.progressPercent || 0
        const remaining = state?.remainingMinutes || 0

        return (
          <div
            key={ch.id}
            data-testid={`channel-card-${ch.id}`}
            className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 shadow-[var(--shadow-card)] ${
              isTuned
                ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/40 bg-[var(--bg-card)]'
                : 'border-[var(--border-subtle)] bg-[var(--bg-card)]/80 hover:border-white/20'
            }`}
          >
            {/* Top Channel Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
              <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => onTuneChannel(ch.id)}
              >
                <div
                  className={`w-11 h-11 rounded-xl border flex items-center justify-center font-mono font-bold text-sm shrink-0 transition-transform ${
                    isTuned
                      ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] border-[var(--accent-primary)] scale-105 shadow-md'
                      : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--accent-primary)] group-hover:scale-105'
                  }`}
                >
                  {ch.channelNumber}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-base text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                      {ch.title}
                    </h3>
                    {isTuned && (
                      <Badge variant="accent" size="sm">
                        CURRENTLY TUNED
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs font-mono text-[var(--text-muted)]">
                    {ch.category} • {ch.quality}
                  </span>
                </div>
              </div>

              {/* Channel Quick Actions */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {currentEp && (
                  <Button
                    variant={isTuned ? 'primary' : 'outline'}
                    size="sm"
                    leftIcon={<Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                    onClick={() => {
                      onTuneChannel(ch.id)
                      onWatchLive(ch, currentEp)
                    }}
                  >
                    Watch Live
                  </Button>
                )}

                <button
                  type="button"
                  onClick={() => onTuneChannel(ch.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
                    isTuned
                      ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)]/40 text-[var(--accent-secondary)] font-semibold'
                      : 'bg-white/5 border-white/10 text-[var(--text-muted)] hover:text-white hover:border-white/20'
                  }`}
                >
                  {isTuned ? '● Tuned' : 'Tune Channel'}
                </button>
              </div>
            </div>

            {/* Split Grid: ON NOW vs UPCOMING NEXT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              {/* ─── ON NOW BLOCK ─── */}
              {currentEp ? (
                <div
                  data-testid={`epg-now-block-${ch.id}`}
                  onClick={() => onSelectProgram(ch, currentEp)}
                  className="p-3.5 rounded-xl bg-[var(--bg-elevated)]/60 border border-[var(--accent-primary)]/30 hover:border-[var(--accent-primary)]/60 transition-all cursor-pointer group flex flex-col justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail Artwork */}
                    <div className="relative w-24 sm:w-28 aspect-video rounded-lg overflow-hidden bg-black shrink-0 border border-white/10">
                      <img
                        src={currentEp.artworkUrl}
                        alt={currentEp.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-1 left-1">
                        <Badge variant="live" size="sm" className="px-1 py-0 text-[9px]">
                          LIVE
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent-secondary)] font-bold">
                          ON NOW
                        </span>
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">
                          • {formatTimeRange(currentEp.startTime, currentEp.endTime)}
                        </span>
                        {currentEp.hasInteractive && (
                          <span
                            data-testid={`badge-interactive-${currentEp.id}`}
                            className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[var(--accent-primary)]/20 text-[var(--accent-secondary)] border border-[var(--accent-primary)]/40 shadow-xs"
                          >
                            ⚡ INTERACTIVE
                          </span>
                        )}
                        {(currentEp.sponsor || ch.sponsor) && (
                          <span
                            data-testid="epg-sponsor-badge"
                            className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs"
                          >
                            SPONSORED
                          </span>
                        )}
                      </div>

                      <h4 className="font-display font-semibold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors truncate">
                        {currentEp.title}
                      </h4>

                      <p className="text-xs text-[var(--text-secondary)] line-clamp-1">
                        {currentEp.description}
                      </p>
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[var(--accent-secondary)] font-medium">
                        {progress}% elapsed
                      </span>
                      <span className="text-[var(--text-muted)]">
                        {remaining}m remaining
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-black/60 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[var(--bg-elevated)]/30 border border-dashed border-[var(--border-subtle)] flex items-center justify-center text-xs font-mono text-[var(--text-muted)]">
                  Continuous Broadcast
                </div>
              )}

              {/* ─── UPCOMING NEXT BLOCK ─── */}
              {nextEp ? (
                <div
                  data-testid={`epg-next-block-${ch.id}`}
                  onClick={() => onSelectProgram(ch, nextEp)}
                  className="p-3.5 rounded-xl bg-[var(--bg-elevated)]/30 border border-[var(--border-subtle)] hover:border-white/20 transition-all cursor-pointer group flex flex-col justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail Artwork */}
                    <div className="relative w-24 sm:w-28 aspect-video rounded-lg overflow-hidden bg-black shrink-0 border border-white/10 opacity-80 group-hover:opacity-100 transition-opacity">
                      <img
                        src={nextEp.artworkUrl}
                        alt={nextEp.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-1 left-1">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-black/75 text-white/90">
                          {formatTime(nextEp.startTime)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                          UPCOMING NEXT
                        </span>
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">
                          • {nextEp.durationMinutes}m
                        </span>
                        {nextEp.hasInteractive && (
                          <span
                            data-testid={`badge-interactive-${nextEp.id}`}
                            className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[var(--accent-primary)]/20 text-[var(--accent-secondary)] border border-[var(--accent-primary)]/40 shadow-xs"
                          >
                            ⚡ INTERACTIVE
                          </span>
                        )}
                        {(nextEp.sponsor || ch.sponsor) && (
                          <span
                            data-testid="epg-sponsor-badge"
                            className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs"
                          >
                            SPONSORED
                          </span>
                        )}
                      </div>

                      <h4 className="font-display font-semibold text-sm text-[var(--text-primary)] group-hover:text-white transition-colors truncate">
                        {nextEp.title}
                      </h4>

                      <p className="text-xs text-[var(--text-secondary)] line-clamp-1">
                        {nextEp.description}
                      </p>
                    </div>
                  </div>

                  {/* Reminder Action Row */}
                  <div className="flex items-center justify-between pt-1 text-xs font-mono">
                    <span className="text-[var(--text-muted)] text-[11px]">
                      Starts at {formatTime(nextEp.startTime)}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleReminder(nextEp, ch)
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all cursor-pointer ${
                        hasReminder(nextEp.id)
                          ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] border-[var(--accent-primary)] font-semibold shadow-sm'
                          : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/15 hover:text-white'
                      }`}
                    >
                      <Bell className="w-3 h-3" />
                      <span>{hasReminder(nextEp.id) ? 'Reminder Set' : 'Remind Me'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[var(--bg-elevated)]/30 border border-dashed border-[var(--border-subtle)] flex items-center justify-center text-xs font-mono text-[var(--text-muted)]">
                  Schedule upcoming
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
