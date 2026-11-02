import React, { useState, useMemo } from 'react'
import {
  Sparkles,
  Filter,
  Vote,
  Trophy,
  HelpCircle,
  Radio,
  Clock,
  Layers,
} from 'lucide-react'
import type { InteractiveItem, InteractionType, InteractionStatus } from '../../../../types/interactive'
import { useInteractiveContent } from '../../../../hooks/useInteractiveContent'
import { InteractionCard } from './InteractionCard'
import { InteractivePanel } from './InteractivePanel'
import { Modal } from '../../../../components/modals/Modal'
import { EPG_CHANNELS } from '../../../../data/epgSchedule'

export interface InteractionHubProps {
  profileId?: string
  onTuneChannel?: (channelId: string) => void
  onWatchLiveWithInteractive?: (item: InteractiveItem) => void
}

export const InteractionHub: React.FC<InteractionHubProps> = ({
  profileId,
  onTuneChannel,
  onWatchLiveWithInteractive: _onWatchLiveWithInteractive,
}) => {
  const { items, hasParticipated } = useInteractiveContent(profileId)

  // Filters state
  const [selectedType, setSelectedType] = useState<InteractionType | 'all'>('all')
  const [selectedChannel, setSelectedChannel] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<InteractionStatus | 'all'>('all')

  // Selected item for modal participation
  const [activeItem, setActiveItem] = useState<InteractiveItem | null>(null)

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedType !== 'all' && item.type !== selectedType) return false
      if (selectedChannel !== 'all' && item.channelId !== selectedChannel) return false
      if (selectedStatus !== 'all' && item.status !== selectedStatus) return false
      return true
    })
  }, [items, selectedType, selectedChannel, selectedStatus])

  // Split into active and closed lists
  const activeItems = useMemo(
    () => filteredItems.filter((i) => i.status === 'active'),
    [filteredItems]
  )
  const closedItems = useMemo(
    () => filteredItems.filter((i) => i.status === 'closed'),
    [filteredItems]
  )

  const activeCount = items.filter((i) => i.status === 'active').length
  const userVotedCount = items.filter((i) => hasParticipated(i.id)).length

  return (
    <div className="space-y-8 select-none" data-testid="interaction-hub">
      {/* ─── Hero Highlight / Header ─── */}
      <div className="relative rounded-3xl overflow-hidden border border-[var(--accent-primary)]/40 bg-gradient-to-br from-[var(--accent-primary)]/20 via-[var(--bg-card)] to-[var(--bg-elevated)] p-6 sm:p-8 shadow-[var(--shadow-elevated)]">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-[var(--accent-primary)]/30 text-[var(--accent-secondary)] border border-[var(--accent-primary)]/50 flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              INTERACTIVE TELEVISION
            </span>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              Real-time Audience Participation Engine
            </span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Live Polls, Official Audience Voting &amp; Broadcast Quizzes
          </h2>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Shape live broadcasts in real-time. Vote for drivers and contestants, participate in daily news opinion polls, and test your subject mastery with time-synchronized television quizzes.
          </p>

          <div className="flex items-center gap-4 pt-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-[var(--accent-secondary)]">
              <Radio className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>{activeCount} Active Broadcasts</span>
            </div>
            <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <Clock className="w-4 h-4" />
              <span>{userVotedCount} Participated in this Profile</span>
            </div>
          </div>
        </div>

        {/* Ambient subtle glow background */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-[var(--accent-primary)]/15 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* ─── Filter Controls Bar ─── */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Interaction Type Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-mono pr-2 shrink-0">
              <Filter className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>Type:</span>
            </div>

            <button
              type="button"
              data-testid="filter-type-all"
              onClick={() => setSelectedType('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer ${
                selectedType === 'all'
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-bold shadow-md'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-white'
              }`}
            >
              All Types ({items.length})
            </button>

            <button
              type="button"
              data-testid="filter-type-poll"
              onClick={() => setSelectedType('poll')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer ${
                selectedType === 'poll'
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-bold shadow-md'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-white'
              }`}
            >
              <Vote className="w-3.5 h-3.5" />
              <span>Live Polls</span>
            </button>

            <button
              type="button"
              data-testid="filter-type-voting"
              onClick={() => setSelectedType('voting')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer ${
                selectedType === 'voting'
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-bold shadow-md'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Audience Voting</span>
            </button>

            <button
              type="button"
              data-testid="filter-type-quiz"
              onClick={() => setSelectedType('quiz')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer ${
                selectedType === 'quiz'
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-bold shadow-md'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Quizzes</span>
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--border-subtle)] self-start lg:self-auto">
            <button
              type="button"
              data-testid="filter-status-all"
              onClick={() => setSelectedStatus('all')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                selectedStatus === 'all'
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-bold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              data-testid="filter-status-active"
              onClick={() => setSelectedStatus('active')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                selectedStatus === 'active'
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-bold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              data-testid="filter-status-closed"
              onClick={() => setSelectedStatus('closed')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                selectedStatus === 'closed'
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-bold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              Concluded
            </button>
          </div>
        </div>

        {/* Channel quick filter strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 scrollbar-none text-xs font-mono border-t border-[var(--border-subtle)]/60">
          <span className="text-[var(--text-muted)] pr-1">Channels:</span>
          <button
            type="button"
            onClick={() => setSelectedChannel('all')}
            className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              selectedChannel === 'all'
                ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-secondary)] border-[var(--accent-primary)] font-bold'
                : 'bg-transparent text-[var(--text-muted)] border-transparent hover:border-white/10'
            }`}
          >
            All Channels
          </button>
          {EPG_CHANNELS.map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => setSelectedChannel(ch.id)}
              className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                selectedChannel === ch.id
                  ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-secondary)] border-[var(--accent-primary)] font-bold'
                  : 'bg-transparent text-[var(--text-muted)] border-transparent hover:border-white/10'
              }`}
            >
              CH {ch.channelNumber}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Active Interactions Grid ─── */}
      {activeItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
              LIVE &amp; ACTIVE BROADCAST INTERACTIONS ({activeItems.length})
            </span>
            <span className="hidden sm:inline">
              SELECT ANY ITEM TO CAST BALLOT OR TEST KNOWLEDGE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeItems.map((item) => (
              <InteractionCard
                key={item.id}
                item={item}
                profileId={profileId}
                onOpen={(it) => setActiveItem(it)}
                onTuneChannel={onTuneChannel}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── Concluded Results Section ─── */}
      {closedItems.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
            <span className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" />
              CONCLUDED BROADCAST RESULTS ({closedItems.length})
            </span>
            <span className="hidden sm:inline">ARCHIVED VERIFIED PUBLIC DATA</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {closedItems.map((item) => (
              <InteractionCard
                key={item.id}
                item={item}
                profileId={profileId}
                onOpen={(it) => setActiveItem(it)}
                onTuneChannel={onTuneChannel}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="text-center py-16 space-y-3 p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
          <Sparkles className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-50" />
          <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
            No Interactive Programmes Match Criteria
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
            Try adjusting your category or channel filters to explore live polls, audience voting, and broadcast quizzes.
          </p>
        </div>
      )}

      {/* ─── Interactive Dialog Modal ─── */}
      {activeItem && (
        <Modal
          isOpen={Boolean(activeItem)}
          onClose={() => setActiveItem(null)}
          size="lg"
        >
          <InteractivePanel
            item={activeItem}
            profileId={profileId}
            onClose={() => setActiveItem(null)}
          />
        </Modal>
      )}
    </div>
  )
}
