import React, { useState, useMemo } from 'react'
import {
  Compass,
  Filter,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import type { Profile } from '../../profiles/types'
import type { ContentMetadata, SortOption } from '../../../types'
import { ContentCard } from '../../../components/cards/ContentCard'
import { HorizontalCarousel } from '../../../components/common/HorizontalCarousel'
import { Button } from '../../../components/common/Button'
import { useWatchlist } from '../../../hooks/useWatchlist'
import {
  ALL_DISCOVERY_TITLES,
  GENRES_LIST,
  GENRE_EDITORIALS,
} from '../../../data/sampleContent'

const LANGUAGES = [
  'All Languages',
  'English',
  'Spanish',
  'Japanese',
  'French',
  'German',
  'Hindi',
]

const YEARS = ['All Years', '2026', '2025', 'Restored Classics']

const QUALITIES = ['All Qualities', '4K HDR', 'Dolby Atmos', 'HD']

const RATINGS = ['All Ratings', '18+', '16+', '13+', 'PG', 'All']

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Most Popular', value: 'popular' },
  { label: 'Recently Added', value: 'recent' },
  { label: 'Release Year: Newest First', value: 'year-desc' },
  { label: 'Release Year: Oldest First', value: 'year-asc' },
  { label: 'A–Z Title', value: 'alpha' },
]

export interface DiscoverPageProps {
  profile: Profile
  onSelectContent?: (content: ContentMetadata) => void
  initialGenre?: string
}

export const DiscoverPage: React.FC<DiscoverPageProps> = ({
  profile,
  onSelectContent,
  initialGenre = 'All Genres',
}) => {
  const [selectedGenre, setSelectedGenre] = useState<string>(initialGenre)
  const [selectedType, setSelectedType] = useState<'all' | 'movie' | 'series'>('all')
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All Languages')
  const [selectedYear, setSelectedYear] = useState<string>('All Years')
  const [selectedQuality, setSelectedQuality] = useState<string>('All Qualities')
  const [selectedRating, setSelectedRating] = useState<string>('All Ratings')
  const [sortBy, setSortBy] = useState<SortOption>('popular')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const { isInWatchlist, toggleWatchlist } = useWatchlist(
    profile.id,
    profile.isKidsProfile
  )

  // Active filter count (excluding default values)
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (selectedGenre !== 'All Genres') count++
    if (selectedType !== 'all') count++
    if (selectedLanguage !== 'All Languages') count++
    if (selectedYear !== 'All Years') count++
    if (selectedQuality !== 'All Qualities') count++
    if (selectedRating !== 'All Ratings') count++
    return count
  }, [selectedGenre, selectedType, selectedLanguage, selectedYear, selectedQuality, selectedRating])

  // Reset all filters
  const handleClearAllFilters = () => {
    setSelectedGenre('All Genres')
    setSelectedType('all')
    setSelectedLanguage('All Languages')
    setSelectedYear('All Years')
    setSelectedQuality('All Qualities')
    setSelectedRating('All Ratings')
    setSortBy('popular')
  }

  // Filter & sort logic
  const filteredTitles = useMemo(() => {
    let result = ALL_DISCOVERY_TITLES

    // Genre filter
    if (selectedGenre !== 'All Genres') {
      result = result.filter((item) =>
        item.genres?.some(
          (g) =>
            g.toLowerCase() === selectedGenre.toLowerCase() ||
            (selectedGenre === 'Family & Kids' && (g === 'Family & Kids' || g === 'Documentaries' || item.rating === 'All'))
        )
      )
    }

    // Content Type filter
    if (selectedType !== 'all') {
      result = result.filter((item) => item.type === selectedType)
    }

    // Language filter
    if (selectedLanguage !== 'All Languages') {
      result = result.filter((item) =>
        item.audioLanguages?.some((lang) =>
          lang.toLowerCase().includes(selectedLanguage.toLowerCase())
        )
      )
    }

    // Release Year filter
    if (selectedYear !== 'All Years') {
      if (selectedYear === 'Restored Classics') {
        result = result.filter(
          (item) => typeof item.year === 'number' && item.year < 2000
        )
      } else {
        result = result.filter(
          (item) => String(item.year) === selectedYear
        )
      }
    }

    // Quality filter
    if (selectedQuality !== 'All Qualities') {
      result = result.filter((item) => item.quality === selectedQuality)
    }

    // Rating filter
    if (selectedRating !== 'All Ratings') {
      result = result.filter((item) => item.rating === selectedRating)
    }

    // Sorting
    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.popularity || 75) - (a.popularity || 75)
        case 'recent':
          return (
            new Date(b.dateAdded || '2025-01-01').getTime() -
            new Date(a.dateAdded || '2025-01-01').getTime()
          )
        case 'year-desc': {
          const yA = typeof a.year === 'number' ? a.year : 2026
          const yB = typeof b.year === 'number' ? b.year : 2026
          return yB - yA
        }
        case 'year-asc': {
          const yA = typeof a.year === 'number' ? a.year : 2026
          const yB = typeof b.year === 'number' ? b.year : 2026
          return yA - yB
        }
        case 'alpha':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })
  }, [
    selectedGenre,
    selectedType,
    selectedLanguage,
    selectedYear,
    selectedQuality,
    selectedRating,
    sortBy,
  ])

  const editorial = GENRE_EDITORIALS[selectedGenre] || GENRE_EDITORIALS['All Genres']

  // Curated genre shelves for the default "All Genres" overview
  const sciFiShelf = useMemo(
    () => ALL_DISCOVERY_TITLES.filter((i) => i.genres?.includes('Sci-Fi')).slice(0, 5),
    []
  )
  const dramaShelf = useMemo(
    () => ALL_DISCOVERY_TITLES.filter((i) => i.genres?.includes('Drama')).slice(0, 5),
    []
  )
  const comedyShelf = useMemo(
    () => ALL_DISCOVERY_TITLES.filter((i) => i.genres?.includes('Comedy')).slice(0, 5),
    []
  )

  return (
    <div className="space-y-8 sm:space-y-10 pb-16 select-none">
      {/* ─── Featured Genre Editorial Hero Spotlight ─── */}
      <section
        aria-label="Genre Showcase"
        className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-card)] min-h-[300px] sm:min-h-[360px] flex flex-col justify-end p-6 sm:p-10 lg:p-12 shadow-[var(--shadow-elevated)]"
      >
        {/* Backdrop Image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={editorial.backdropUrl}
            alt={editorial.name}
            className="w-full h-full object-cover filter brightness-[0.75] contrast-[1.08] transition-all duration-700"
          />
        </div>

        {/* Dynamic Accent Ambient Glow */}
        <div
          className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full pointer-events-none blur-3xl opacity-25 z-10"
          style={{
            background: 'radial-gradient(circle, var(--accent-glow) 0%, rgba(0,0,0,0) 70%)',
          }}
        />

        {/* Protection Gradients */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, rgba(12, 13, 15, 0.98) 0%, rgba(12, 13, 15, 0.65) 55%, transparent 100%)',
          }}
        />
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background:
              'linear-gradient(to right, rgba(12, 13, 15, 0.95) 0%, rgba(12, 13, 15, 0.45) 60%, transparent 100%)',
          }}
        />

        {/* Hero Content */}
        <div className="relative z-20 space-y-3 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-[var(--accent-secondary)] font-semibold flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>{editorial.tagline}</span>
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--text-primary)] leading-[1.1] drop-shadow-md">
            {editorial.name}
          </h1>

          <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-normal max-w-xl leading-relaxed drop-shadow">
            {editorial.description}
          </p>
        </div>
      </section>

      {/* ─── Genre Selection Pill Bar ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>BROWSE BY GENRE</span>
          </span>
          <span>{GENRES_LIST.length} CATEGORIES</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {GENRES_LIST.map((genre) => {
            const isSelected = selectedGenre === genre
            return (
              <button
                key={genre}
                type="button"
                onClick={() => setSelectedGenre(genre)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-150 whitespace-nowrap cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
                  isSelected
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] shadow-md font-semibold'
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-white/20 hover:text-[var(--text-primary)]'
                }`}
              >
                {genre}
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── Filter Controls Bar & Sorting ─── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-card)]/90 border border-[var(--border-subtle)] space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Quick Content Type Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] w-fit">
            {(
              [
                { label: 'All Content', value: 'all' },
                { label: 'Movies', value: 'movie' },
                { label: 'Series', value: 'series' },
              ] as const
            ).map((t) => (
              <button
                key={t.value}
                type="button"
                data-type-filter={t.value}
                onClick={() => setSelectedType(t.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  selectedType === t.value
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-semibold shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Right Actions: Filter Toggle & Sorting */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Sorting Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[var(--text-muted)] hidden sm:inline flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3 text-[var(--accent-secondary)]" />
                <span>Sort:</span>
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort catalogue by"
                className="px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Advanced Filters Toggle Button */}
            <Button
              variant={showAdvancedFilters ? 'secondary' : 'outline'}
              size="sm"
              leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="text-xs font-mono text-[var(--text-muted)] hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* ─── Expandable Advanced Filter Panel ─── */}
        {showAdvancedFilters && (
          <div className="pt-4 border-t border-[var(--border-subtle)] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            {/* Language */}
            <div className="space-y-1.5">
              <label htmlFor="filter-language" className="font-mono text-[var(--text-muted)] uppercase block text-[11px]">
                Language
              </label>
              <select
                id="filter-language"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none cursor-pointer"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            {/* Release Year */}
            <div className="space-y-1.5">
              <label htmlFor="filter-year" className="font-mono text-[var(--text-muted)] uppercase block text-[11px]">
                Release Year
              </label>
              <select
                id="filter-year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none cursor-pointer"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Content Quality */}
            <div className="space-y-1.5">
              <label htmlFor="filter-quality" className="font-mono text-[var(--text-muted)] uppercase block text-[11px]">
                Quality
              </label>
              <select
                id="filter-quality"
                value={selectedQuality}
                onChange={(e) => setSelectedQuality(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none cursor-pointer"
              >
                {QUALITIES.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>

            {/* Maturity Rating */}
            <div className="space-y-1.5">
              <label htmlFor="filter-rating" className="font-mono text-[var(--text-muted)] uppercase block text-[11px]">
                Rating
              </label>
              <select
                id="filter-rating"
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none cursor-pointer"
              >
                {RATINGS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Active Filter Chips Row */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--border-subtle)]">
            <span className="text-[11px] font-mono text-[var(--text-muted)] mr-1">Active:</span>
            {selectedGenre !== 'All Genres' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/40 text-[var(--accent-secondary)]">
                <span>Genre: {selectedGenre}</span>
                <X
                  className="w-3 h-3 hover:text-white cursor-pointer"
                  onClick={() => setSelectedGenre('All Genres')}
                />
              </span>
            )}
            {selectedType !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/40 text-[var(--accent-secondary)]">
                <span>Type: {selectedType === 'movie' ? 'Movies' : 'Series'}</span>
                <X
                  className="w-3 h-3 hover:text-white cursor-pointer"
                  onClick={() => setSelectedType('all')}
                />
              </span>
            )}
            {selectedLanguage !== 'All Languages' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/40 text-[var(--accent-secondary)]">
                <span>Lang: {selectedLanguage}</span>
                <X
                  className="w-3 h-3 hover:text-white cursor-pointer"
                  onClick={() => setSelectedLanguage('All Languages')}
                />
              </span>
            )}
            {selectedYear !== 'All Years' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/40 text-[var(--accent-secondary)]">
                <span>Year: {selectedYear}</span>
                <X
                  className="w-3 h-3 hover:text-white cursor-pointer"
                  onClick={() => setSelectedYear('All Years')}
                />
              </span>
            )}
            {selectedQuality !== 'All Qualities' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/40 text-[var(--accent-secondary)]">
                <span>Quality: {selectedQuality}</span>
                <X
                  className="w-3 h-3 hover:text-white cursor-pointer"
                  onClick={() => setSelectedQuality('All Qualities')}
                />
              </span>
            )}
            {selectedRating !== 'All Ratings' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/40 text-[var(--accent-secondary)]">
                <span>Rating: {selectedRating}</span>
                <X
                  className="w-3 h-3 hover:text-white cursor-pointer"
                  onClick={() => setSelectedRating('All Ratings')}
                />
              </span>
            )}
          </div>
        )}
      </div>

      {/* ─── Result Counter & Catalogue Header ─── */}
      <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
        <span>
          SHOWING {filteredTitles.length} OF {ALL_DISCOVERY_TITLES.length} TITLES • {selectedGenre.toUpperCase()}
        </span>
        <span>HYBRID STREAM VAULT</span>
      </div>

      {/* ─── Content Shelves (When viewing All Genres overview) ─── */}
      {selectedGenre === 'All Genres' && activeFilterCount === 0 && (
        <div className="space-y-8 sm:space-y-10">
          <HorizontalCarousel
            title="Speculative Sci-Fi & Deep Space"
            eyebrow="GENRE SPOTLIGHT"
            subtitle="Quantum odysseys and futuristic worldbuilding"
          >
            {sciFiShelf.map((item) => (
              <ContentCard
                key={`scifi-${item.id}`}
                content={item}
                variant="portrait"
                isSaved={isInWatchlist(item.id)}
                onInfo={(c) => onSelectContent?.(c)}
                onAddToList={(c) => toggleWatchlist(c.id)}
              />
            ))}
          </HorizontalCarousel>

          <HorizontalCarousel
            title="Prestige Human Drama"
            eyebrow="AWARD WINNING"
            subtitle="Deep emotional depth and character-driven journeys"
          >
            {dramaShelf.map((item) => (
              <ContentCard
                key={`drama-${item.id}`}
                content={item}
                variant="portrait"
                isSaved={isInWatchlist(item.id)}
                onInfo={(c) => onSelectContent?.(c)}
                onAddToList={(c) => toggleWatchlist(c.id)}
              />
            ))}
          </HorizontalCarousel>

          <HorizontalCarousel
            title="Comedies & Lighthearted Adventures"
            eyebrow="SATIRE & WIT"
            subtitle="From cyber coffee shops to zero-g roommates"
          >
            {comedyShelf.map((item) => (
              <ContentCard
                key={`com-${item.id}`}
                content={item}
                variant="portrait"
                isSaved={isInWatchlist(item.id)}
                onInfo={(c) => onSelectContent?.(c)}
                onAddToList={(c) => toggleWatchlist(c.id)}
              />
            ))}
          </HorizontalCarousel>
        </div>
      )}

      {/* ─── Filtered Content Grid or Empty State ─── */}
      {filteredTitles.length > 0 ? (
        <div className="space-y-4">
          {selectedGenre === 'All Genres' && activeFilterCount === 0 && (
            <h3 className="font-display font-bold text-xl text-[var(--text-primary)] pt-4">
              All Titles &amp; Archive
            </h3>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {filteredTitles.map((item) => (
              <ContentCard
                key={item.id}
                content={item}
                variant="portrait"
                isGrid={true}
                isSaved={isInWatchlist(item.id)}
                onInfo={(c) => onSelectContent?.(c)}
                onAddToList={(c) => toggleWatchlist(c.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Empty State UI */
        <div className="p-12 sm:p-16 rounded-3xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-card)]/40 text-center space-y-4 max-w-xl mx-auto my-6">
          <div className="w-14 h-14 rounded-2xl bg-[var(--accent-muted)] border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)] mx-auto shadow-md">
            <Filter className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-display font-bold text-xl text-[var(--text-primary)]">
              No Matching Titles
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              We couldn't find any titles matching all selected filters together. Try loosening one of your criteria or clearing filters.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={handleClearAllFilters}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Reset All Filters
          </Button>
        </div>
      )}
    </div>
  )
}
