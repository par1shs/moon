import React, { useState, useMemo, useCallback } from 'react'
import {
  Radio,
  Filter,
  Clock,
  Play,
  Calendar,
  Info,
  Maximize2,
  Tv,
  RotateCcw,
} from 'lucide-react'
import type { Profile } from '../../profiles/types'
import type { ContentMetadata } from '../../../types'
import type { EPGChannel, EPGProgram, CatchUpProgramItem, CatchUpStatus } from '../../../types/epg'
import { Badge } from '../../../components/common/Badge'
import { Button } from '../../../components/common/Button'
import { useEPGSchedule } from '../../../hooks/useEPGSchedule'
import { useProgramReminders } from '../../../hooks/useProgramReminders'
import { useViewingHistory } from '../../../hooks/useViewingHistory'
import { EPGNowAndNext } from '../../live/components/EPGNowAndNext'
import { EPGFullGuide } from '../../live/components/EPGFullGuide'
import { CatchUpSection } from '../../live/components/CatchUpSection'
import { ProgramInfoModal } from '../../live/components/ProgramInfoModal'
import { ReminderToast } from '../../live/components/ReminderToast'
import {
  SimulatedPlayerModal,
  type CatchUpProgramInfo,
} from '../../../components/player/SimulatedPlayerModal'
import { ALL_DISCOVERY_TITLES } from '../../../data/sampleContent'

const CATEGORIES = ['All Channels', 'News', 'Sports', 'Cinema', 'Culture']

export interface LiveTVPageProps {
  profile?: Profile
  onSelectContent?: (content: ContentMetadata) => void
}

export const LiveTVPage: React.FC<LiveTVPageProps> = ({
  profile,
  onSelectContent,
}) => {
  // Navigation & Filter state
  const [selectedCategory, setSelectedCategory] = useState('All Channels')
  const [viewMode, setViewMode] = useState<'now-next' | 'full-guide' | 'catch-up'>('now-next')
  const [tunedChannelId, setTunedChannelId] = useState('ch-101')

  // Detailed Modal inspection state
  const [inspectedProgram, setInspectedProgram] = useState<{
    channel: EPGChannel
    program: EPGProgram
  } | null>(null)

  // Full-Screen Live Player state
  const [isLivePlayerOpen, setIsLivePlayerOpen] = useState(false)

  // Catch-Up On-Demand Player state
  const [catchUpPlayerState, setCatchUpPlayerState] = useState<{
    content: ContentMetadata
    catchUpProgram: CatchUpProgramInfo
    initialProgress: number
  } | null>(null)
  const [isCatchUpPlayerOpen, setIsCatchUpPlayerOpen] = useState(false)

  // ─── Profile-Isolated Viewing History Engine ───
  const {
    updateProgress,
    markCompleted,
    getHistoryItem,
  } = useViewingHistory(profile?.id || 'default')

  const getHistoryProgress = useCallback(
    (contentId: string) => {
      const item = getHistoryItem(contentId)
      if (!item) return undefined
      return { progress: item.progress, completed: Boolean(item.completed) }
    },
    [getHistoryItem]
  )

  // ─── Time-Aware EPG Schedule Engine ───
  const {
    currentTime,
    channels,
    filteredChannels,
    channelSchedules,
    channelLiveStates,
    activeCatchUpItems,
    catchUpShelves,
    getChannelLiveState,
    getProgramStatus,
    getCatchUpStatus: getScheduleCatchUpStatus,
    formatTime,
    formatTimeRange,
  } = useEPGSchedule(selectedCategory)

  // ─── Profile-Isolated Reminders Engine ───
  const {
    reminders,
    dueReminder,
    toggleReminder,
    hasReminder,
    dismissDueReminder,
  } = useProgramReminders(profile?.id || 'default')

  // Currently tuned channel and its dynamic live state
  const tunedChannel = useMemo(() => {
    return channels.find((c) => c.id === tunedChannelId) || channels[0]
  }, [channels, tunedChannelId])

  const tunedState = useMemo(() => {
    return (
      channelLiveStates[tunedChannel.id] ||
      getChannelLiveState(tunedChannel, currentTime)
    )
  }, [channelLiveStates, getChannelLiveState, tunedChannel, currentTime])

  const tunedCurrentProgram = tunedState.currentProgram
  const tunedNextProgram = tunedState.nextProgram

  // Construct ContentMetadata representation of tuned channel for player
  const tunedContentMetadata: ContentMetadata = useMemo(() => {
    return {
      id: tunedChannel.id,
      title: tunedChannel.title,
      subtitle: tunedCurrentProgram
        ? `${tunedCurrentProgram.title} • ${tunedCurrentProgram.genre}`
        : tunedChannel.subtitle,
      description: tunedCurrentProgram
        ? tunedCurrentProgram.description
        : tunedChannel.subtitle,
      type: 'live',
      rating: tunedCurrentProgram?.rating || 'PG',
      quality: tunedChannel.quality,
      duration: 'Live 24/7',
      year: 'ON AIR',
      backdropUrl: tunedCurrentProgram?.artworkUrl || tunedChannel.backdropUrl,
      posterUrl: tunedCurrentProgram?.artworkUrl || tunedChannel.backdropUrl,
      broadcastSchedule: {
        channelNumber: tunedChannel.channelNumber,
        channelName: tunedChannel.title,
        airTime: tunedCurrentProgram
          ? formatTimeRange(
              tunedCurrentProgram.startTime,
              tunedCurrentProgram.endTime
            )
          : 'Continuous 24/7',
        isLiveNow: true,
      },
    }
  }, [tunedChannel, tunedCurrentProgram, formatTimeRange])

  // Channel Surfing Handlers (within full-screen player or EPG)
  const handlePreviousChannel = useCallback(() => {
    const idx = channels.findIndex((c: EPGChannel) => c.id === tunedChannelId)
    const prevIdx = (idx - 1 + channels.length) % channels.length
    setTunedChannelId(channels[prevIdx].id)
  }, [channels, tunedChannelId])

  const handleNextChannel = useCallback(() => {
    const idx = channels.findIndex((c: EPGChannel) => c.id === tunedChannelId)
    const nextIdx = (idx + 1) % channels.length
    setTunedChannelId(channels[nextIdx].id)
  }, [channels, tunedChannelId])

  // Watch Live handler
  const handleWatchLive = useCallback(
    (channel: EPGChannel, _program?: EPGProgram) => {
      setTunedChannelId(channel.id)
      setIsLivePlayerOpen(true)
    },
    []
  )

  // Watch Catch-up handler
  const handleWatchCatchUp = useCallback(
    (
      itemOrProgram:
        | CatchUpProgramItem
        | { program: EPGProgram; channel: EPGChannel; status?: CatchUpStatus }
    ) => {
      const program = itemOrProgram.program
      const channel = itemOrProgram.channel
      const status =
        'status' in itemOrProgram && itemOrProgram.status
          ? itemOrProgram.status
          : getScheduleCatchUpStatus(program)

      const catchUpContentId = `catchup-${program.id}`
      const existingHistory = getHistoryItem(catchUpContentId)
      const initialProg = existingHistory?.progress || 0
      const durationMin = program.durationMinutes || 60

      const catchUpContent: ContentMetadata = {
        id: catchUpContentId,
        title: program.title,
        subtitle: `Channel ${channel.channelNumber}: ${channel.title}`,
        description: program.description,
        type: 'movie',
        rating: program.rating || 'PG',
        quality: channel.quality || 'HD',
        duration: `${durationMin}m`,
        year: new Date(program.startTime).getFullYear().toString(),
        backdropUrl: program.artworkUrl || channel.backdropUrl,
        posterUrl: program.artworkUrl || channel.backdropUrl,
      }

      const catchUpProgramInfo: CatchUpProgramInfo = {
        channelNumber: channel.channelNumber,
        channelTitle: channel.title,
        programTitle: program.title,
        broadcastDateText: status.broadcastDateText,
        expiryText: status.expiryText,
        genre: program.genre,
        isExpiringSoon: status.isExpiringSoon,
      }

      setCatchUpPlayerState({
        content: catchUpContent,
        catchUpProgram: catchUpProgramInfo,
        initialProgress: initialProg,
      })
      setIsCatchUpPlayerOpen(true)
    },
    [getHistoryItem, getScheduleCatchUpStatus]
  )

  // Open linked on-demand content handler
  const handleOpenLinkedContent = useCallback(
    (contentId: string) => {
      if (!onSelectContent) return
      const found = ALL_DISCOVERY_TITLES.find((c) => c.id === contentId)
      if (found) {
        onSelectContent(found)
      }
    },
    [onSelectContent]
  )

  return (
    <div className="space-y-8 pb-16 select-none" data-testid="live-tv-page">
      {/* ─── Top Header & Clock ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--accent-secondary)]">
              LINEAR BROADCAST • ELECTRONIC PROGRAMME GUIDE
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
            <Radio className="w-8 h-8 text-[var(--accent-primary)] animate-pulse" />
            <span>Live TV &amp; Programme Guide</span>
          </h1>
          <p className="text-sm text-[var(--text-secondary)] max-w-xl">
            Real-time linear broadcast network with continuous multi-channel
            scheduling, programme reminders, and instant live player tuning.
          </p>
        </div>

        {/* Live Local Clock Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto px-3.5 py-2 rounded-2xl bg-[var(--bg-elevated)]/70 border border-[var(--border-subtle)] text-xs font-mono">
          <Clock className="w-4 h-4 text-[var(--accent-primary)]" />
          <span className="text-[var(--text-muted)]">Local Time:</span>
          <span className="text-[var(--text-primary)] font-bold">
            {formatTime(currentTime)}
          </span>
          {reminders.length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-[var(--accent-primary)]/20 text-[var(--accent-secondary)] border border-[var(--accent-primary)]/40 font-semibold">
              {reminders.length} {reminders.length === 1 ? 'Reminder' : 'Reminders'}
            </span>
          )}
        </div>
      </div>

      {/* ─── Tuned Live Broadcast Spotlight Banner ─── */}
      <div
        data-testid="spotlight-banner"
        className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-[var(--accent-primary)]/50 bg-[var(--bg-card)] p-5 sm:p-7 flex flex-col md:flex-row items-center gap-6 shadow-[var(--shadow-elevated)]"
      >
        {/* Spotlight Video/Artwork Thumbnail */}
        <div
          className="relative w-full md:w-1/2 aspect-video rounded-2xl overflow-hidden bg-black border border-[var(--border-subtle)] cursor-pointer group"
          onClick={() => setIsLivePlayerOpen(true)}
        >
          <img
            src={
              tunedCurrentProgram?.artworkUrl || tunedChannel.backdropUrl
            }
            alt={tunedChannel.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/30" />

          {/* Badges on Thumbnail */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <Badge variant="live" size="sm">
              ON AIR LIVE
            </Badge>
            <Badge variant="subtle" size="sm">
              CH {tunedChannel.channelNumber}
            </Badge>
            <Badge variant="subtle" size="sm">
              {tunedChannel.quality}
            </Badge>
          </div>

          {/* Center Play Overlay on Hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
            <div className="w-14 h-14 rounded-full bg-[var(--accent-primary)] text-[var(--accent-contrast)] flex items-center justify-center shadow-xl">
              <Play className="w-6 h-6 fill-current ml-1" />
            </div>
          </div>

          {/* Bottom Live Bar on Thumbnail */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-mono text-white/90">
            <span className="truncate">
              {tunedCurrentProgram?.title || tunedChannel.subtitle}
            </span>
            <span className="text-[var(--accent-secondary)] font-semibold shrink-0 ml-2">
              {tunedState.remainingMinutes}m remaining
            </span>
          </div>
        </div>

        {/* Spotlight Channel & Programme Info */}
        <div className="w-full md:w-1/2 space-y-3.5">
          <div className="flex items-center gap-2">
            <Badge variant="accent">CURRENTLY TUNED</Badge>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              {tunedChannel.category} • {tunedChannel.quality}
            </span>
          </div>

          <div>
            <span className="text-xs font-mono text-[var(--accent-secondary)] uppercase tracking-wider block">
              Channel {tunedChannel.channelNumber} • {tunedChannel.title}
            </span>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-[var(--text-primary)]">
              {tunedCurrentProgram
                ? tunedCurrentProgram.title
                : tunedChannel.title}
            </h2>
          </div>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2">
            {tunedCurrentProgram
              ? tunedCurrentProgram.description
              : tunedChannel.subtitle}
          </p>

          {/* Live Progress Bar */}
          {tunedCurrentProgram && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[var(--text-muted)]">
                  {formatTimeRange(
                    tunedCurrentProgram.startTime,
                    tunedCurrentProgram.endTime
                  )}
                </span>
                <span className="text-[var(--accent-secondary)] font-semibold">
                  {tunedState.progressPercent}% elapsed
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-full transition-all duration-300"
                  style={{ width: `${tunedState.progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Next Programme Preview */}
          {tunedNextProgram && (
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono flex items-center justify-between text-[var(--text-muted)]">
              <span className="truncate">
                Up Next: <strong className="text-white">{tunedNextProgram.title}</strong>
              </span>
              <span className="shrink-0 text-[var(--accent-secondary)] ml-2">
                {formatTime(tunedNextProgram.startTime)}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Maximize2 className="w-4 h-4" />}
              onClick={() => setIsLivePlayerOpen(true)}
            >
              Watch Live Full Screen
            </Button>

            {tunedCurrentProgram && (
              <Button
                variant="outline"
                size="md"
                leftIcon={<Info className="w-4 h-4 text-[var(--accent-primary)]" />}
                onClick={() =>
                  setInspectedProgram({
                    channel: tunedChannel,
                    program: tunedCurrentProgram,
                  })
                }
              >
                Program Details
              </Button>
            )}

            <span className="text-xs font-mono text-[var(--accent-secondary)] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-ping" />
              Live Broadcast Active
            </span>
          </div>
        </div>
      </div>

      {/* ─── EPG Controls Bar: Mode Switcher & Category Filters ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-mono pr-2 shrink-0">
            <Filter className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Filter:</span>
          </div>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 whitespace-nowrap cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
                selectedCategory === cat
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] shadow-md font-semibold'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-white/20 hover:text-[var(--text-primary)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* EPG View Mode Switcher Pills */}
        <div className="flex items-center gap-1.5 bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--border-subtle)] shrink-0 self-start md:self-auto">
          <button
            type="button"
            data-testid="mode-now-and-next"
            onClick={() => setViewMode('now-next')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
              viewMode === 'now-next'
                ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-bold shadow-sm'
                : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Now &amp; Next</span>
          </button>

          <button
            type="button"
            data-testid="mode-full-guide"
            onClick={() => setViewMode('full-guide')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
              viewMode === 'full-guide'
                ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-bold shadow-sm'
                : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Full Guide</span>
          </button>

          <button
            type="button"
            data-testid="mode-catch-up"
            onClick={() => setViewMode('catch-up')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
              viewMode === 'catch-up'
                ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-bold shadow-sm'
                : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Catch-up TV</span>
          </button>
        </div>
      </div>

      {/* ─── EPG View: Now & Next vs Full Guide vs Catch-up TV ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
          <span>
            {viewMode === 'now-next'
              ? `NOW & NEXT SCHEDULE • LINEAR BROADCAST (${filteredChannels.length} CHANNELS)`
              : viewMode === 'full-guide'
              ? `FULL EPG TIMELINE GUIDE • 24/7 BROADCAST (${filteredChannels.length} CHANNELS)`
              : `CATCH-UP TV ARCHIVE • 7 & 14-DAY ON-DEMAND BROADCASTS (${activeCatchUpItems.length} AVAILABLE)`}
          </span>
          <span className="hidden sm:inline">
            {viewMode === 'catch-up'
              ? 'ALL PROGRAMMES DIGITALLY ARCHIVED FOR ON-DEMAND STREAMING'
              : 'CLICK ANY PROGRAMME FOR DETAILS & ACTIONS'}
          </span>
        </div>

        {viewMode === 'now-next' ? (
          <EPGNowAndNext
            channels={filteredChannels}
            liveStates={channelLiveStates}
            tunedChannelId={tunedChannelId}
            hasReminder={hasReminder}
            onSelectProgram={(channel, program) =>
              setInspectedProgram({ channel, program })
            }
            onTuneChannel={(id) => setTunedChannelId(id)}
            onWatchLive={handleWatchLive}
            onToggleReminder={toggleReminder}
            formatTime={formatTime}
            formatTimeRange={formatTimeRange}
          />
        ) : viewMode === 'full-guide' ? (
          <EPGFullGuide
            channels={filteredChannels}
            channelSchedules={channelSchedules}
            tunedChannelId={tunedChannelId}
            currentTime={currentTime}
            hasReminder={hasReminder}
            onSelectProgram={(channel, program) =>
              setInspectedProgram({ channel, program })
            }
            onTuneChannel={(id) => setTunedChannelId(id)}
            onWatchLive={handleWatchLive}
            onToggleReminder={toggleReminder}
            getProgramStatus={getProgramStatus}
            formatTime={formatTime}
            formatTimeRange={formatTimeRange}
          />
        ) : (
          <CatchUpSection
            channels={filteredChannels}
            activeCatchUpItems={activeCatchUpItems}
            catchUpShelves={catchUpShelves}
            getHistoryProgress={getHistoryProgress}
            onWatchCatchUp={handleWatchCatchUp}
            onInspectProgram={(item) =>
              setInspectedProgram({
                channel: item.channel,
                program: item.program,
              })
            }
            onOpenLinkedContent={handleOpenLinkedContent}
          />
        )}
      </div>

      {/* ─── Program Details Modal ─── */}
      {inspectedProgram && (
        <ProgramInfoModal
          isOpen={Boolean(inspectedProgram)}
          onClose={() => setInspectedProgram(null)}
          program={inspectedProgram.program}
          channel={inspectedProgram.channel}
          status={getProgramStatus(inspectedProgram.program, currentTime)}
          progressPercent={
            channelLiveStates[inspectedProgram.channel.id]?.progressPercent
          }
          remainingMinutes={
            channelLiveStates[inspectedProgram.channel.id]?.remainingMinutes
          }
          hasReminder={hasReminder(inspectedProgram.program.id)}
          savedCatchUpProgress={
            getHistoryProgress(`catchup-${inspectedProgram.program.id}`)?.progress
          }
          onToggleReminder={toggleReminder}
          onWatchLive={handleWatchLive}
          onWatchCatchUp={(program, channel, status) => {
            handleWatchCatchUp({ program, channel, status })
          }}
          onOpenLinkedContent={handleOpenLinkedContent}
          formatTimeRange={formatTimeRange}
        />
      )}

      {/* ─── In-App Reminder Due Toast Notification ─── */}
      <ReminderToast
        reminder={dueReminder}
        onWatchLive={(channelId) => {
          setTunedChannelId(channelId)
          setIsLivePlayerOpen(true)
        }}
        onDismiss={dismissDueReminder}
      />

      {/* ─── Full-Screen Live Video Player Experience ─── */}
      <SimulatedPlayerModal
        isOpen={isLivePlayerOpen}
        content={tunedContentMetadata}
        onClose={() => setIsLivePlayerOpen(false)}
        onProgressUpdate={() => {}}
        onMarkCompleted={() => {}}
        liveProgram={
          tunedCurrentProgram
            ? {
                channelNumber: tunedChannel.channelNumber,
                channelTitle: tunedChannel.title,
                programTitle: tunedCurrentProgram.title,
                programGenre: tunedCurrentProgram.genre,
                programDuration: `${tunedCurrentProgram.durationMinutes}m`,
                channelCategory: tunedChannel.category,
              }
            : undefined
        }
        onPreviousChannel={handlePreviousChannel}
        onNextChannel={handleNextChannel}
      />

      {/* ─── Full-Screen Catch-Up Video Player Experience ─── */}
      {catchUpPlayerState && (
        <SimulatedPlayerModal
          isOpen={isCatchUpPlayerOpen}
          content={catchUpPlayerState.content}
          initialProgress={catchUpPlayerState.initialProgress}
          catchUpProgram={catchUpPlayerState.catchUpProgram}
          onClose={() => setIsCatchUpPlayerOpen(false)}
          onProgressUpdate={(contentId, progress, details) => {
            updateProgress(contentId, progress, details)
          }}
          onMarkCompleted={(contentId) => {
            markCompleted(contentId)
          }}
        />
      )}
    </div>
  )
}
export default LiveTVPage
