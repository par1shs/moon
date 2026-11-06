import React, { useState, useMemo, useEffect } from 'react'
import {
  Search,
  X,
  Clock,
  TrendingUp,
  Sparkles,
  ArrowUpDown,
  Filter,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react'
import { ContentCard } from '../../../components/cards/ContentCard'
import { Button } from '../../../components/common/Button'
import {
  ALL_DISCOVERY_TITLES,
  SAMPLE_LIVE_CHANNELS,
  GENRES_LIST,
} from '../../../data/sampleContent'
import { useWatchlist } from '../../../hooks/useWatchlist'
import { useSearchHistory } from '../../../hooks/useSearchHistory'
import {
  buildCatalogueVocabulary,
  executeSearch,
  type SearchFilters,
} from '../utils/searchUtils'
import type { ContentMetadata } from '../../../types'
import type { Profile } from '../../profiles/types'

const TRENDING_SEARCHES = [
  'KALEIDOSCOPE',
  'Echoes of Chronos',
  'Velocity Night',
  'The Glitch Cafe',
  'Zero Gravity',
  'Subterranean',
  'Parisian Hours',
  '4K HDR Master',
]

const LANGUAGES_LIST = [
  'All Languages',
  'English',
  'Spanish',
  'Japanese',
  'French',
  'German',
  'Hindi',
]

const ALL_SEARCH_ITEMS: ContentMetadata[] = [
  ...ALL_DISCOVERY_TITLES,
  ...SAMPLE_LIVE_CHANNELS,
]

// Deduplicate
const UNIQUE_SEARCH_MAP = new Map<string, ContentMetadata>()
ALL_SEARCH_ITEMS.forEach((item) => {
  if (!UNIQUE_SEARCH_MAP.has(item.id)) {
    UNIQUE_SEARCH_MAP.set(item.id, item)
  }
})
const UNIQUE_CATALOGUE = Array.from(UNIQUE_SEARCH_MAP.values())
const CATALOGUE_VOCABULARY = buildCatalogueVocabulary(UNIQUE_CATALOGUE)

/**
 * Text highlight component
 */
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = text.split(regex)
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-[var(--accent-primary)]/25 text-[var(--accent-secondary)] px-0.5 rounded font-bold"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}

export interface SearchPageProps {
  profile?: Profile
  onSelectContent?: (content: ContentMetadata) => void
}

export const SearchPage: React.FC<SearchPageProps> = ({ profile, onSelectContent }) => {
  const profileId = profile?.id || 'default_user'
  const isKids = profile?.isKidsProfile || false

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [scope, setScope] = useState<'All' | 'Movies' | 'Series' | 'Live'>('All')
  const [selectedGenre, setSelectedGenre] = useState('All Genres')
  const [selectedLanguage, setSelectedLanguage] = useState('All Languages')
  const [sortBy, setSortBy] = useState<'relevance' | 'popularity' | 'recent'>('relevance')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Watchlist & Search History (Profile Isolated)
  const { isInWatchlist, toggleWatchlist } = useWatchlist(profileId, isKids)
  const { recentSearches, addSearch, removeSearch, clearSearches } = useSearchHistory(profileId)

  // Debounce search query execution (120ms) to ensure smooth input responsiveness
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 120)
    return () => clearTimeout(timer)
  }, [query])

  // Auto-record search term into recent history after user pauses typing (debounce 1.2s)
  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.trim().length < 3) return
    const timer = setTimeout(() => {
      addSearch(debouncedQuery)
    }, 1200)
    return () => clearTimeout(timer)
  }, [debouncedQuery, addSearch])

  const searchFilters: SearchFilters = useMemo(
    () => ({
      scope,
      genre: selectedGenre,
      language: selectedLanguage,
      sortBy,
    }),
    [scope, selectedGenre, selectedLanguage, sortBy]
  )

  // Execute compound search with debounced query
  const outcome = useMemo(() => {
    return executeSearch(UNIQUE_CATALOGUE, debouncedQuery, searchFilters, CATALOGUE_VOCABULARY)
  }, [debouncedQuery, searchFilters])

  const handleSelectQuery = (term: string) => {
    setQuery(term)
    setDebouncedQuery(term)
    addSearch(term)
  }

  const handleClearFilters = () => {
    setScope('All')
    setSelectedGenre('All Genres')
    setSelectedLanguage('All Languages')
    setSortBy('relevance')
  }

  return (
    <div className="space-y-8 pb-12 select-none max-w-6xl mx-auto">
      {/* ─── Search Header & Input Bar ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--accent-secondary)] flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>HYBRID STREAM INDEX • SEARCH &amp; DISCOVER</span>
          </span>
          <span className="text-xs font-mono text-[var(--text-muted)]">
            VIEWER: <strong className="text-[var(--text-primary)]">{profile?.name || 'GUEST'}</strong>
          </span>
        </div>

        {/* Input Container */}
        <div className="relative group">
          <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-[var(--accent-primary)] pointer-events-none transition-transform group-focus-within:scale-110" />
          <input
            type="text"
            data-testid="search-input"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                addSearch(query)
              }
            }}
            placeholder="Search titles, actors, directors, genres, languages, channels..."
            aria-label="Search content library"
            className="w-full pl-12 sm:pl-14 pr-12 py-3.5 sm:py-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/30 text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm sm:text-base md:text-lg transition-all outline-none shadow-xl"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
              aria-label="Clear search query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--bg-card)]/80 border border-[var(--border-subtle)]">
          {/* Scope Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs font-mono text-[var(--text-muted)] mr-1 hidden sm:inline">Scope:</span>
            {(['All', 'Movies', 'Series', 'Live'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setScope(tab)}
                className={`px-3 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  scope === tab
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-semibold shadow-sm'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab === 'Live' ? 'Live TV' : tab}
              </button>
            ))}
          </div>

          {/* Right Controls: Sort & Filter Toggle */}
          <div className="flex items-center gap-2">
            {/* Sorting Dropdown */}
            <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)]">
              <ArrowUpDown className="w-3.5 h-3.5 text-[var(--accent-secondary)]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort search results"
                className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none cursor-pointer"
              >
                <option value="relevance">Relevance</option>
                <option value="popularity">Most Popular</option>
                <option value="recent">Recently Added</option>
              </select>
            </div>

            <Button
              variant={showAdvancedFilters ? 'secondary' : 'outline'}
              size="sm"
              leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <span>Filters</span>
            </Button>
          </div>
        </div>

        {/* Expandable Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="p-4 rounded-2xl bg-[var(--bg-elevated)]/60 border border-[var(--border-subtle)] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs animate-in fade-in duration-200">
            {/* Genre Filter */}
            <div className="space-y-1.5">
              <label htmlFor="search-genre" className="font-mono text-[var(--text-muted)] uppercase text-[11px] block">
                Filter by Genre
              </label>
              <select
                id="search-genre"
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none cursor-pointer"
              >
                {GENRES_LIST.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Filter */}
            <div className="space-y-1.5">
              <label htmlFor="search-language" className="font-mono text-[var(--text-muted)] uppercase text-[11px] block">
                Audio / Language
              </label>
              <select
                id="search-language"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none cursor-pointer"
              >
                {LANGUAGES_LIST.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ─── Suggested Searches When Query is Empty ─── */}
      {!query && (
        <div className="space-y-6 pt-2">
          {/* Recent Searches (Profile Isolated) */}
          {recentSearches.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  <span>RECENT SEARCHES ({profile?.name})</span>
                </span>
                <button
                  type="button"
                  onClick={clearSearches}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Clear All
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term) => (
                  <div
                    key={term}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/50 text-xs text-[var(--text-secondary)] transition-all group"
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectQuery(term)}
                      className="cursor-pointer hover:text-[var(--text-primary)]"
                    >
                      {term}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSearch(term)}
                      className="text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
                      title="Remove from history"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending Searches */}
          <div className="space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[var(--accent-secondary)]" />
              <span>TRENDING SEARCHES ON PIXEL+</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {TRENDING_SEARCHES.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => handleSelectQuery(term)}
                  className="px-3.5 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/50 hover:text-[var(--accent-secondary)] text-xs text-[var(--text-secondary)] transition-all cursor-pointer shadow-sm"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Genre Jump Shortcuts */}
          <div className="space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>POPULAR GENRE HUBS</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {['Sci-Fi', 'Crime & Thriller', 'Action', 'Comedy', 'Drama', 'Documentary', 'Romance'].map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => handleSelectQuery(genre)}
                  className="px-3 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-white/20 text-xs text-[var(--text-secondary)] hover:text-white transition-colors cursor-pointer"
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Search Results Section ─── */}
      <div className="space-y-4 pt-2">
        {/* Spelling Correction "Did You Mean" Banner */}
        {outcome.didYouMean && outcome.didYouMean !== query.trim().toLowerCase() && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 flex items-center justify-between gap-4">
            <div className="space-y-0.5 text-xs sm:text-sm">
              <span className="text-[var(--text-secondary)]">
                Showing results for{' '}
                <strong className="text-[var(--accent-secondary)] font-semibold underline cursor-pointer" onClick={() => setQuery(outcome.didYouMean!)}>
                  {outcome.didYouMean}
                </strong>{' '}
                instead of &quot;{query}&quot;
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuery(outcome.didYouMean!)}
            >
              Use &quot;{outcome.didYouMean}&quot;
            </Button>
          </div>
        )}

        {/* Results Header Counter */}
        <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
          <span>
            {query
              ? `RESULTS FOR "${query.toUpperCase()}" (${outcome.matches.length} FOUND)`
              : `POPULAR VAULT TITLES (${outcome.matches.length})`}
          </span>
          <span>HYBRID STREAM INDEX</span>
        </div>

        {/* Results Grid */}
        {outcome.matches.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {outcome.matches.map(({ item, matchReason }) => (
              <div key={item.id} className="flex flex-col space-y-1">
                <ContentCard
                  content={item}
                  variant="portrait"
                  isGrid={true}
                  isSaved={isInWatchlist(item.id)}
                  onInfo={(c) => onSelectContent?.(c)}
                  onAddToList={(c) => toggleWatchlist(c.id)}
                />
                {query && matchReason && (
                  <div className="px-1 text-[10px] font-mono text-[var(--accent-secondary)] truncate">
                    <span>
                      <HighlightedText text={matchReason} query={query} />
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Empty Search Results State */
          <div className="p-10 sm:p-14 rounded-3xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-card)]/40 text-center space-y-4 max-w-xl mx-auto my-6">
            <div className="w-14 h-14 rounded-2xl bg-[var(--accent-muted)] border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)] mx-auto shadow-md">
              <Filter className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-display font-bold text-lg sm:text-xl text-[var(--text-primary)]">
                No titles found matching &quot;{query}&quot;
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-md mx-auto">
                We couldn&apos;t find any titles matching all current filters in {scope === 'Live' ? 'Live TV' : scope}. Try loosening your filter criteria or try one of the suggested keywords below.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {['KALEIDOSCOPE', 'Chronos', 'Velocity', 'The Glitch Cafe', 'Subterranean'].map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => handleSelectQuery(kw)}
                  className="px-3 py-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:text-white transition-colors cursor-pointer"
                >
                  {kw}
                </button>
              ))}
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setQuery('')
                  handleClearFilters()
                }}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Clear Search &amp; Filters
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
