import React, { useState, useMemo, useCallback } from 'react'
import {
  Clock,
  Sparkles,
  AlertTriangle,
  Flame,
  Radio,
  Search,
  CheckCircle2,
} from 'lucide-react'
import type { EPGChannel, CatchUpProgramItem } from '../../../types/epg'
import { CatchUpCard } from './CatchUpCard'

export interface CatchUpSectionProps {
  channels: EPGChannel[]
  activeCatchUpItems: CatchUpProgramItem[]
  catchUpShelves: {
    recentlyAired: CatchUpProgramItem[]
    availableToday: CatchUpProgramItem[]
    expiringSoon: CatchUpProgramItem[]
    recentlyMissed: CatchUpProgramItem[]
    byChannel: Record<string, CatchUpProgramItem[]>
  }
  getHistoryProgress: (contentId: string) => { progress: number; completed: boolean } | undefined
  onWatchCatchUp: (item: CatchUpProgramItem) => void
  onInspectProgram: (item: CatchUpProgramItem) => void
  onOpenLinkedContent?: (contentId: string) => void
}

const GENRES = [
  'All Genres',
  'News & Analysis',
  'Finance',
  'Motorsport',
  'Film Noir',
  'Classic Comedy',
  'Cosmic Ambient',
  'Natural Wonder',
  'Esports',
  'Wildlife',
  'Archaeology',
]

export const CatchUpSection: React.FC<CatchUpSectionProps> = ({
  channels,
  activeCatchUpItems,
  catchUpShelves,
  getHistoryProgress,
  onWatchCatchUp,
  onInspectProgram,
  onOpenLinkedContent,
}) => {
  const [selectedChannelId, setSelectedChannelId] = useState<string>('all')
  const [selectedGenre, setSelectedGenre] = useState<string>('All Genres')
  const [searchQuery, setSearchQuery] = useState('')

  // Enrich item with profile-isolated viewing history progress
  const enrichItem = useCallback(
    (item: CatchUpProgramItem): CatchUpProgramItem => {
      const historyState = getHistoryProgress(`catchup-${item.program.id}`)
      return {
        ...item,
        savedProgress: historyState ? historyState.progress : undefined,
      }
    },
    [getHistoryProgress]
  )

  // Filter items by channel, genre, and search query
  const filterList = useCallback(
    (items: CatchUpProgramItem[]): CatchUpProgramItem[] => {
      return items
        .filter((item) => {
          if (selectedChannelId !== 'all' && item.channel.id !== selectedChannelId) {
            return false
          }
          if (
            selectedGenre !== 'All Genres' &&
            !item.program.genre.toLowerCase().includes(selectedGenre.toLowerCase())
          ) {
            return false
          }
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            const matchTitle = item.program.title.toLowerCase().includes(q)
            const matchDesc = item.program.description.toLowerCase().includes(q)
            const matchGenre = item.program.genre.toLowerCase().includes(q)
            const matchChannel = item.channel.title.toLowerCase().includes(q)
            if (!matchTitle && !matchDesc && !matchGenre && !matchChannel) return false
          }
          return true
        })
        .map(enrichItem)
    },
    [selectedChannelId, selectedGenre, searchQuery, enrichItem]
  )

  const filteredRecentlyAired = useMemo(
    () => filterList(catchUpShelves.recentlyAired),
    [catchUpShelves.recentlyAired, filterList]
  )
  const filteredAvailableToday = useMemo(
    () => filterList(catchUpShelves.availableToday),
    [catchUpShelves.availableToday, filterList]
  )
  const filteredExpiringSoon = useMemo(
    () => filterList(catchUpShelves.expiringSoon),
    [catchUpShelves.expiringSoon, filterList]
  )
  const filteredRecentlyMissed = useMemo(
    () => filterList(catchUpShelves.recentlyMissed),
    [catchUpShelves.recentlyMissed, filterList]
  )

  // Total matching titles
  const totalCount = useMemo(() => {
    return filterList(activeCatchUpItems).length
  }, [activeCatchUpItems, filterList])

  return (
    <div className="space-y-10 select-none" data-testid="catch-up-section">
      {/* ─── Filter & Search Toolbar ─── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--accent-secondary)] font-bold">
              CATCH-UP TV DISCOVERY
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-white/5 border border-white/10 text-[var(--text-muted)]">
              {totalCount} Programmes Available
            </span>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              data-testid="catch-up-search"
              placeholder="Search catch-up programmes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] border border-white/10 text-xs text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors font-mono"
            />
          </div>
        </div>

        {/* Channel Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-mono text-[var(--text-muted)] shrink-0 pr-1">Channel:</span>
          <button
            type="button"
            data-testid="filter-channel-all"
            onClick={() => setSelectedChannelId('all')}
            className={`px-3 py-1 rounded-xl text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
              selectedChannelId === 'all'
                ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-bold shadow-sm'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white border border-[var(--border-subtle)]'
            }`}
          >
            All Channels
          </button>
          {channels.map((ch) => (
            <button
              key={ch.id}
              type="button"
              data-testid={`filter-channel-${ch.id}`}
              onClick={() => setSelectedChannelId(ch.id)}
              className={`px-3 py-1 rounded-xl text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
                selectedChannelId === ch.id
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-bold shadow-sm'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white border border-[var(--border-subtle)]'
              }`}
            >
              CH {ch.channelNumber} • {ch.title.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Genre Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-mono text-[var(--text-muted)] shrink-0 pr-1">Genre:</span>
          {GENRES.map((g) => (
            <button
              key={g}
              type="button"
              data-testid={`filter-genre-${g.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              onClick={() => setSelectedGenre(g)}
              className={`px-3 py-1 rounded-full text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
                selectedGenre === g
                  ? 'bg-white/20 text-white font-semibold border border-white/30'
                  : 'bg-white/5 text-[var(--text-muted)] hover:text-white border border-white/5'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Shelf 1: Recently Aired (Concluded in last 48 hours) ─── */}
      {filteredRecentlyAired.length > 0 && (
        <section className="space-y-4" data-testid="shelf-recently-aired">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[var(--accent-primary)]" />
              <h3 className="font-display font-bold text-lg sm:text-xl text-[var(--text-primary)]">
                Recently Aired
              </h3>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                • Available to Replay Now
              </span>
            </div>
            <span className="text-xs font-mono text-[var(--accent-secondary)]">
              {filteredRecentlyAired.length} Titles
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredRecentlyAired.map((item) => (
              <CatchUpCard
                key={item.program.id}
                item={item}
                onWatchCatchUp={onWatchCatchUp}
                onInspectProgram={onInspectProgram}
                onOpenLinkedContent={onOpenLinkedContent}
              />
            ))}
          </div>
        </section>
      )}

      {/* ─── Shelf 2: Available Today ─── */}
      {filteredAvailableToday.length > 0 && (
        <section className="space-y-4" data-testid="shelf-available-today">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="font-display font-bold text-lg sm:text-xl text-[var(--text-primary)]">
                Available Today
              </h3>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                • Fresh from Today's Linear Schedule
              </span>
            </div>
            <span className="text-xs font-mono text-[var(--accent-secondary)]">
              {filteredAvailableToday.length} Titles
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredAvailableToday.map((item) => (
              <CatchUpCard
                key={item.program.id}
                item={item}
                onWatchCatchUp={onWatchCatchUp}
                onInspectProgram={onInspectProgram}
                onOpenLinkedContent={onOpenLinkedContent}
              />
            ))}
          </div>
        </section>
      )}

      {/* ─── Shelf 3: Expiring Soon (< 48 hours left) ─── */}
      {filteredExpiringSoon.length > 0 && (
        <section className="space-y-4" data-testid="shelf-expiring-soon">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
              <h3 className="font-display font-bold text-lg sm:text-xl text-[var(--text-primary)]">
                Expiring Soon
              </h3>
              <span className="text-xs font-mono text-amber-300">
                • Last Chance to Watch Before Leaving Catch-up
              </span>
            </div>
            <span className="text-xs font-mono text-amber-400 font-bold">
              {filteredExpiringSoon.length} Titles Expiring
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredExpiringSoon.map((item) => (
              <CatchUpCard
                key={item.program.id}
                item={item}
                onWatchCatchUp={onWatchCatchUp}
                onInspectProgram={onInspectProgram}
                onOpenLinkedContent={onOpenLinkedContent}
              />
            ))}
          </div>
        </section>
      )}

      {/* ─── Shelf 4: Recently Missed (Featured Highlighted Shows) ─── */}
      {filteredRecentlyMissed.length > 0 && (
        <section className="space-y-4" data-testid="shelf-recently-missed">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-400" />
              <h3 className="font-display font-bold text-lg sm:text-xl text-[var(--text-primary)]">
                Recently Missed Highlights
              </h3>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                • Flagship Debates, Tournaments &amp; Restored Masterpieces
              </span>
            </div>
            <span className="text-xs font-mono text-[var(--accent-secondary)]">
              {filteredRecentlyMissed.length} Titles
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredRecentlyMissed.map((item) => (
              <CatchUpCard
                key={item.program.id}
                item={item}
                onWatchCatchUp={onWatchCatchUp}
                onInspectProgram={onInspectProgram}
                onOpenLinkedContent={onOpenLinkedContent}
              />
            ))}
          </div>
        </section>
      )}

      {/* ─── Shelf 5: Catch-up by Channel ─── */}
      <section className="space-y-8 pt-4 border-t border-[var(--border-subtle)]" data-testid="shelf-by-channel">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-[var(--accent-primary)]" />
          <h3 className="font-display font-bold text-lg sm:text-xl text-[var(--text-primary)]">
            Catch-up by Channel
          </h3>
          <span className="text-xs font-mono text-[var(--text-muted)]">
            • Complete Broadcast Networks
          </span>
        </div>

        {channels
          .filter((ch) => selectedChannelId === 'all' || ch.id === selectedChannelId)
          .map((ch) => {
            const channelItems = filterList(catchUpShelves.byChannel[ch.id] || []).slice(0, 8)
            if (channelItems.length === 0) return null

            return (
              <div
                key={ch.id}
                data-testid={`shelf-by-channel-${ch.id}`}
                className="space-y-3.5 p-4 rounded-2xl bg-[var(--bg-card)]/50 border border-[var(--border-subtle)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-contrast)] flex items-center justify-center font-mono font-bold text-xs">
                      {ch.channelNumber}
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm sm:text-base text-white">
                        {ch.title}
                      </h4>
                      <span className="text-[11px] font-mono text-[var(--text-muted)]">
                        {ch.category} • {ch.quality}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-[var(--accent-secondary)]">
                    {channelItems.length} Available
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {channelItems.map((item) => (
                    <CatchUpCard
                      key={item.program.id}
                      item={item}
                      onWatchCatchUp={onWatchCatchUp}
                      onInspectProgram={onInspectProgram}
                      onOpenLinkedContent={onOpenLinkedContent}
                    />
                  ))}
                </div>
              </div>
            )
          })}
      </section>

      {/* Empty State */}
      {totalCount === 0 && (
        <div className="p-12 text-center rounded-2xl bg-[var(--bg-card)] border border-dashed border-[var(--border-subtle)] space-y-3">
          <Sparkles className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-50" />
          <h4 className="font-display font-bold text-base text-white">
            No Catch-up Programmes Match Your Filters
          </h4>
          <p className="text-xs font-mono text-[var(--text-muted)] max-w-sm mx-auto">
            Try selecting "All Channels" and "All Genres" or clearing your search query.
          </p>
        </div>
      )}
    </div>
  )
}
