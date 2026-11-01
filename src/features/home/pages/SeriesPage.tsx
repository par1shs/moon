import React, { useState, useMemo } from 'react'
import { Tv, Filter, Play, Plus, Check } from 'lucide-react'
import { ContentCard } from '../../../components/cards/ContentCard'
import { Modal } from '../../../components/modals/Modal'
import { Button } from '../../../components/common/Button'
import { Badge } from '../../../components/common/Badge'
import { SAMPLE_SERIES_CARDS } from '../../../data/sampleContent'
import { useWatchlist } from '../../../hooks/useWatchlist'
import type { ContentMetadata } from '../../../types'
import type { Profile } from '../../profiles/types'

const CATEGORIES = [
  'All Series',
  'Drama',
  'Sci-Fi',
  'Crime & Thriller',
  'Docuseries',
  'Limited Series',
]

export interface SeriesPageProps {
  profile?: Profile
  onSelectContent?: (content: ContentMetadata) => void
  onExploreDiscover?: () => void
}

export const SeriesPage: React.FC<SeriesPageProps> = ({
  profile,
  onSelectContent,
  onExploreDiscover,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('All Series')
  const [selectedContent, setSelectedContent] = useState<ContentMetadata | null>(null)
  const [playingContent, setPlayingContent] = useState<ContentMetadata | null>(null)
  const { isInWatchlist, toggleWatchlist } = useWatchlist(
    profile?.id || 'default_user',
    profile?.isKidsProfile || false
  )

  const handleOpenDetails = (item: ContentMetadata) => {
    if (onSelectContent) {
      onSelectContent(item)
    } else {
      setSelectedContent(item)
    }
  }

  const filteredSeries = useMemo(() => {
    if (selectedCategory === 'All Series') {
      return SAMPLE_SERIES_CARDS
    }
    return SAMPLE_SERIES_CARDS.filter((item) =>
      item.genres?.includes(selectedCategory)
    )
  }, [selectedCategory])

  const handleToggleList = (item: ContentMetadata) => {
    toggleWatchlist(item.id)
  }

  return (
    <div className="space-y-8 pb-12 select-none">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--accent-secondary)]">
            EPISODIC CATALOGUE
          </span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
          <Tv className="w-8 h-8 text-[var(--accent-primary)]" />
          <span>Original Series &amp; Television</span>
        </h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-xl">
          Dive into seasons of critically acclaimed originals, serialized dramas, and deep-universe science fiction.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-mono pr-2">
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
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-white/20 hover:text-[var(--text-primary)]'
            }`}
          >
            {cat}
          </button>
        ))}

        {onExploreDiscover && (
          <button
            type="button"
            onClick={onExploreDiscover}
            className="px-3.5 py-1.5 rounded-full text-xs font-mono text-[var(--accent-secondary)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 hover:border-[var(--accent-primary)]/50 hover:text-[var(--accent-primary)] transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ml-auto"
          >
            <span>Browse All Genres</span>
            <span>&rarr;</span>
          </button>
        )}
      </div>

      {/* Series Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
          <span>CATALOGUE • {selectedCategory.toUpperCase()} ({filteredSeries.length} TITLES)</span>
          <span>4K HDR • SPATIAL AUDIO</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {filteredSeries.map((series) => (
            <ContentCard
              key={series.id}
              content={series}
              variant="portrait"
              isGrid={true}
              isSaved={isInWatchlist(series.id)}
              onPlay={(c) => setPlayingContent(c)}
              onInfo={(c) => handleOpenDetails(c)}
              onAddToList={handleToggleList}
            />
          ))}
        </div>
      </div>

      {/* Content Details Modal */}
      <Modal
        isOpen={Boolean(selectedContent)}
        onClose={() => setSelectedContent(null)}
        title={selectedContent?.title || ''}
        size="lg"
      >
        {selectedContent && (
          <div className="space-y-5">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
              <img
                src={selectedContent.backdropUrl || selectedContent.posterUrl}
                alt={selectedContent.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent" />
              <div className="absolute top-3 left-3 flex gap-2">
                {selectedContent.badge && <Badge variant="accent">{selectedContent.badge}</Badge>}
                {selectedContent.quality && <Badge variant="subtle">{selectedContent.quality}</Badge>}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[var(--text-secondary)]">
              {selectedContent.rating && (
                <span className="px-2 py-0.5 rounded bg-white/10 text-white font-semibold">
                  {selectedContent.rating}
                </span>
              )}
              {selectedContent.year && <span>{selectedContent.year}</span>}
              {selectedContent.duration && <span>• {selectedContent.duration}</span>}
              {selectedContent.genres?.map((g) => (
                <span key={g} className="px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                  {g}
                </span>
              ))}
            </div>

            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {selectedContent.description || selectedContent.subtitle || 'Immerse yourself in this critically acclaimed original television series on JUNCTION+.'}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="md"
                leftIcon={<Play className="w-4 h-4 fill-current ml-0.5" />}
                onClick={() => {
                  setPlayingContent(selectedContent)
                  setSelectedContent(null)
                }}
              >
                Play Season 1
              </Button>
              <Button
                variant="secondary"
                size="md"
                leftIcon={isInWatchlist(selectedContent.id) ? <Check className="w-4 h-4 text-[var(--accent-primary)]" /> : <Plus className="w-4 h-4" />}
                onClick={() => handleToggleList(selectedContent)}
              >
                {isInWatchlist(selectedContent.id) ? 'In My List' : 'Add to My List'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Playback Modal */}
      <Modal
        isOpen={Boolean(playingContent)}
        onClose={() => setPlayingContent(null)}
        title={playingContent ? `Now Playing: ${playingContent.title}` : ''}
        size="xl"
      >
        {playingContent && (
          <div className="space-y-4">
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-[var(--border-subtle)]">
              <img
                src={playingContent.backdropUrl || playingContent.posterUrl}
                alt={playingContent.title}
                className="w-full h-full object-cover opacity-60 filter blur-[2px]"
              />
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-4 text-center p-6">
                <div className="w-16 h-16 rounded-full bg-[var(--accent-primary)] text-[var(--accent-contrast)] flex items-center justify-center shadow-2xl animate-pulse">
                  <Play className="w-8 h-8 fill-current ml-1" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-display font-bold text-xl text-white">
                    {playingContent.title} - Episode 1
                  </h4>
                  <p className="text-xs font-mono text-[var(--accent-secondary)]">
                    Original Series • {playingContent.quality || '4K HDR'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
