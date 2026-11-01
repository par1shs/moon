import React, { useState, useMemo } from 'react'
import {
  Bookmark,
  Compass,
  ArrowRight,
  ArrowUpDown,
  Filter,
} from 'lucide-react'
import type { Profile } from '../../profiles/types'
import type { ContentMetadata } from '../../../types'
import { Button } from '../../../components/common/Button'
import { ContentCard } from '../../../components/cards/ContentCard'
import { useWatchlist } from '../../../hooks/useWatchlist'
import {
  ALL_DISCOVERY_TITLES,
  SAMPLE_LIVE_CHANNELS,
  SAMPLE_PORTRAIT_CARDS,
  SAMPLE_FEATURED_CARDS,
  SAMPLE_LANDSCAPE_CARDS,
} from '../../../data/sampleContent'

// Comprehensive catalogue map to resolve any saved ID
const ALL_CATALOGUE_MAP = new Map<string, ContentMetadata>()
;[
  ...ALL_DISCOVERY_TITLES,
  ...SAMPLE_LIVE_CHANNELS,
  ...SAMPLE_PORTRAIT_CARDS,
  ...SAMPLE_FEATURED_CARDS,
  ...SAMPLE_LANDSCAPE_CARDS,
].forEach((item) => {
  if (!ALL_CATALOGUE_MAP.has(item.id)) {
    ALL_CATALOGUE_MAP.set(item.id, item)
  }
})

export type MyListCategory = 'all' | 'movie' | 'series' | 'live'
export type MyListSortOption = 'recent' | 'title-asc' | 'year-desc'

export interface MyListPageProps {
  profile: Profile
  onExploreHome?: () => void
  onExploreDiscover?: () => void
  onSelectContent?: (content: ContentMetadata) => void
}

export const MyListPage: React.FC<MyListPageProps> = ({
  profile,
  onExploreHome,
  onExploreDiscover,
  onSelectContent,
}) => {
  const { watchlistIds, toggleWatchlist } = useWatchlist(
    profile.id,
    profile.isKidsProfile
  )

  const [activeTab, setActiveTab] = useState<MyListCategory>('all')
  const [sortBy, setSortBy] = useState<MyListSortOption>('recent')

  // Map watchlist IDs to full content objects (preserving order added)
  const allSavedItems = useMemo(() => {
    return watchlistIds
      .map((id) => ALL_CATALOGUE_MAP.get(id))
      .filter((item): item is ContentMetadata => Boolean(item))
  }, [watchlistIds])

  // Compute category counts
  const counts = useMemo(() => {
    return {
      all: allSavedItems.length,
      movie: allSavedItems.filter((i) => i.type === 'movie').length,
      series: allSavedItems.filter((i) => i.type === 'series').length,
      live: allSavedItems.filter((i) => i.isLive || i.type === 'live').length,
    }
  }, [allSavedItems])

  // Filter by category
  const filteredItems = useMemo(() => {
    let result = allSavedItems
    if (activeTab === 'movie') {
      result = result.filter((i) => i.type === 'movie')
    } else if (activeTab === 'series') {
      result = result.filter((i) => i.type === 'series')
    } else if (activeTab === 'live') {
      result = result.filter((i) => i.isLive || i.type === 'live')
    }

    // Sort
    return [...result].sort((a, b) => {
      if (sortBy === 'title-asc') {
        return a.title.localeCompare(b.title)
      }
      if (sortBy === 'year-desc') {
        const yA = typeof a.year === 'number' ? a.year : parseInt(String(a.year)) || 2026
        const yB = typeof b.year === 'number' ? b.year : parseInt(String(b.year)) || 2026
        return yB - yA
      }
      // 'recent': preserve insertion order (most recently added first)
      const idxA = watchlistIds.indexOf(a.id)
      const idxB = watchlistIds.indexOf(b.id)
      return idxB - idxA
    })
  }, [allSavedItems, activeTab, sortBy, watchlistIds])

  return (
    <div className="space-y-8 pb-12 select-none max-w-6xl mx-auto">
      {/* ─── Header ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--accent-secondary)] flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>PERSONAL VAULT • SAVED WATCHLIST</span>
          </span>
          <span className="text-xs font-mono text-[var(--text-muted)]">
            VIEWER: <strong className="text-[var(--text-primary)]">{profile.name}</strong>
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
              My List
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 max-w-xl">
              Curated series, feature films, and channels saved by{' '}
              <strong className="text-[var(--text-primary)]">{profile.name}</strong>. Access your watchlist anytime across all devices.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full text-xs font-mono bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/35 text-[var(--accent-secondary)] font-semibold whitespace-nowrap">
              {allSavedItems.length} {allSavedItems.length === 1 ? 'Title' : 'Titles'} Saved
            </span>
          </div>
        </div>
      </div>

      {/* ─── Filter Categories & Sorting Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--bg-card)]/80 border border-[var(--border-subtle)]">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {(
            [
              { id: 'all', label: 'All Saved', count: counts.all },
              { id: 'movie', label: 'Movies', count: counts.movie },
              { id: 'series', label: 'Series', count: counts.series },
              { id: 'live', label: 'Live TV', count: counts.live },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-semibold shadow-sm'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === tab.id
                    ? 'bg-black/25 text-[var(--accent-contrast)]'
                    : 'bg-white/10 text-[var(--text-muted)]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)] self-end sm:self-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-[var(--accent-secondary)]" />
          <span className="hidden md:inline">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as MyListSortOption)}
            aria-label="Sort My List"
            className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none cursor-pointer"
          >
            <option value="recent">Recently Added</option>
            <option value="title-asc">Title: A–Z</option>
            <option value="year-desc">Release Year: Newest</option>
          </select>
        </div>
      </div>

      {/* ─── Watchlist Grid or Category Empty State ─── */}
      {filteredItems.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
            <span>
              SHOWING {filteredItems.length} OF {allSavedItems.length} TITLES • {activeTab.toUpperCase()}
            </span>
            <span>CLICK CARD FOR DETAILS • ✕ TO REMOVE</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {filteredItems.map((item) => (
              <ContentCard
                key={item.id}
                content={item}
                variant="portrait"
                isGrid={true}
                isSaved={true}
                onRemove={() => toggleWatchlist(item.id)}
                onInfo={(c) => onSelectContent?.(c)}
                onAddToList={() => toggleWatchlist(item.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Empty Watchlist State */
        <div className="p-10 sm:p-16 rounded-3xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-card)]/40 text-center flex flex-col items-center justify-center space-y-5 max-w-xl mx-auto my-6">
          <div className="w-16 h-16 rounded-2xl bg-[var(--accent-muted)] border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)] shadow-lg">
            {allSavedItems.length === 0 ? (
              <Bookmark className="w-8 h-8" />
            ) : (
              <Filter className="w-8 h-8" />
            )}
          </div>

          <div className="space-y-2 max-w-md">
            <h2 className="font-display font-bold text-xl text-[var(--text-primary)]">
              {allSavedItems.length === 0
                ? 'Your Watchlist is Empty'
                : `No ${activeTab === 'live' ? 'Live TV' : activeTab} titles saved`}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              {allSavedItems.length === 0
                ? `As you explore titles across JUNCTION+, click the bookmark or plus icon on any series, movie, or channel to save it to your personal vault.`
                : `You haven't saved any ${activeTab === 'live' ? 'Live TV channels' : activeTab} titles yet. Try switching to "All Saved" or explore our catalogue.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {onExploreDiscover && (
              <Button
                variant="primary"
                size="md"
                onClick={onExploreDiscover}
                leftIcon={<Compass className="w-4 h-4" />}
              >
                Explore Discover Vault
              </Button>
            )}

            {onExploreHome && (
              <Button
                variant="secondary"
                size="md"
                onClick={onExploreHome}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Return to Home
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ─── Suggested Additions Footer Shelf ─── */}
      <div className="space-y-4 pt-8 border-t border-[var(--border-subtle)]">
        <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
          <span>RECOMMENDED ADDITIONS FOR {profile.name.toUpperCase()}</span>
          <span>CURATED DISCOVERY</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {ALL_DISCOVERY_TITLES.filter((item) => !watchlistIds.includes(item.id))
            .slice(0, 5)
            .map((item) => (
              <ContentCard
                key={`rec-${item.id}`}
                content={item}
                variant="portrait"
                isGrid={true}
                isSaved={false}
                onInfo={(c) => onSelectContent?.(c)}
                onAddToList={() => toggleWatchlist(item.id)}
              />
            ))}
        </div>
      </div>
    </div>
  )
}
