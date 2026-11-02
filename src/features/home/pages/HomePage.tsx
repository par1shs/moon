import React, { useState, useMemo } from 'react'
import { Sparkles, SlidersHorizontal } from 'lucide-react'
import type { Profile } from '../../profiles/types'
import type { ContentMetadata, EpisodeMetadata } from '../../../types'
import { HeroBanner } from '../components/HeroBanner'
import { HorizontalCarousel } from '../../../components/common/HorizontalCarousel'
import { ContentCard } from '../../../components/cards/ContentCard'
import { Button } from '../../../components/common/Button'
import { useWatchlist } from '../../../hooks/useWatchlist'
import { useViewingHistory } from '../../../hooks/useViewingHistory'
import { useUserPreferences } from '../../../hooks/useUserPreferences'
import { generateRecommendations } from '../../recommendations/recommendationEngine'
import { GenrePreferencesModal } from '../../profiles/components/GenrePreferencesModal'
import { SimulatedPlayerModal } from '../../../components/player/SimulatedPlayerModal'
import {
  ALL_DISCOVERY_TITLES,
  SAMPLE_FEATURED_CARDS,
  SAMPLE_SERIES_CARDS,
  SAMPLE_MOVIE_CARDS,
} from '../../../data/sampleContent'

export interface HomePageProps {
  profile: Profile
  onExploreSeries?: () => void
  onExploreMovies?: () => void
  onSelectContent?: (content: ContentMetadata) => void
}

export const HomePage: React.FC<HomePageProps> = ({
  profile,
  onExploreSeries,
  onExploreMovies,
  onSelectContent,
}) => {
  // 1. Data hooks per profile (profile-isolated)
  const { isInWatchlist, toggleWatchlist, watchlistIds } = useWatchlist(
    profile.id,
    profile.isKidsProfile
  )
  const {
    history,
    continueWatchingList,
    recentlyWatchedList,
    updateProgress,
    markCompleted,
    removeFromHistory,
  } = useViewingHistory(profile.id)
  const {
    preferredGenres,
    updatePreferredGenres,
    resetPreferences,
  } = useUserPreferences(profile.id, profile.isKidsProfile)

  // 2. Modals state
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false)
  const [activePlayback, setActivePlayback] = useState<{
    content: ContentMetadata
    episode?: EpisodeMetadata
    progress: number
  } | null>(null)

  // 3. Deterministic recommendation engine calculations
  const recommendations = useMemo(() => {
    return generateRecommendations(
      ALL_DISCOVERY_TITLES,
      profile,
      history,
      preferredGenres,
      watchlistIds
    )
  }, [profile, history, preferredGenres, watchlistIds])

  const heroContent = SAMPLE_FEATURED_CARDS[0]

  const handleOpenDetails = (item: ContentMetadata) => {
    onSelectContent?.(item)
  }

  const handlePlayContent = (item: ContentMetadata, savedProgress: number = 0) => {
    setActivePlayback({
      content: item,
      progress: savedProgress,
    })
  }

  return (
    <div className="space-y-8 sm:space-y-10 pb-12 select-none">
      {/* ─── Hero Cinematic Showcase Banner ─── */}
      <HeroBanner
        content={heroContent}
        onPlay={(item) => handlePlayContent(item, 0)}
        onInfo={(item) => handleOpenDetails(item)}
        onAddToList={(item) => toggleWatchlist(item.id)}
        isSaved={isInWatchlist(heroContent.id)}
      />

      {/* ─── Section 1: Continue Watching (Landscape) ─── */}
      {continueWatchingList.length > 0 && (
        <HorizontalCarousel
          title="Continue Watching"
          eyebrow="RESUME PLAYBACK"
          subtitle={`Jump back in where you left off, ${profile.name}`}
        >
          {continueWatchingList.map(({ content, history: h, remainingTime }) => (
            <ContentCard
              key={`cw-${content.id}`}
              content={content}
              variant="landscape"
              remainingTime={remainingTime}
              isSaved={isInWatchlist(content.id)}
              onPlay={() => handlePlayContent(content, h.progress)}
              onInfo={() => handleOpenDetails(content)}
              onAddToList={() => toggleWatchlist(content.id)}
              onRemove={() => removeFromHistory(content.id)}
            />
          ))}
        </HorizontalCarousel>
      )}

      {/* ─── Section 2: Top Picks for [Profile Name] ─── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--accent-secondary)] font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>PERSONALISED FOR YOU</span>
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
              Top Picks for {profile.name}
            </h2>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPreferencesModalOpen(true)}
            leftIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-[var(--accent-primary)]" />}
          >
            <span>Interests: {preferredGenres.slice(0, 2).join(', ')}</span>
          </Button>
        </div>

        <HorizontalCarousel
          title=""
          eyebrow=""
          subtitle=""
        >
          {recommendations.topPicks.map((item) => (
            <ContentCard
              key={`top-${item.id}`}
              content={item}
              variant="portrait"
              isSaved={isInWatchlist(item.id)}
              onPlay={() => handlePlayContent(item, 0)}
              onInfo={() => handleOpenDetails(item)}
              onAddToList={() => toggleWatchlist(item.id)}
            />
          ))}
        </HorizontalCarousel>
      </div>

      {/* ─── Section 3: Because You Watched... (Dynamic Similarity) ─── */}
      {recommendations.becauseYouWatched && (
        <HorizontalCarousel
          title={`Because You Watched ${recommendations.becauseYouWatched.sourceTitle.title}`}
          eyebrow="MORE LIKE THIS"
          subtitle={`Similar storytelling, worldbuilding, and themes tailored to your taste`}
        >
          {recommendations.becauseYouWatched.recommendations.map((item) => (
            <ContentCard
              key={`byw-${item.id}`}
              content={item}
              variant="portrait"
              isSaved={isInWatchlist(item.id)}
              onPlay={() => handlePlayContent(item, 0)}
              onInfo={() => handleOpenDetails(item)}
              onAddToList={() => toggleWatchlist(item.id)}
            />
          ))}
        </HorizontalCarousel>
      )}

      {/* ─── Section 4: Trending in Your Interests ─── */}
      {recommendations.trendingInInterests && (
        <HorizontalCarousel
          title={`Trending in ${recommendations.trendingInInterests.genreName}`}
          eyebrow="HOT IN YOUR TASTE PROFILE"
          subtitle={`The most watched titles in your top preferred category this week`}
        >
          {recommendations.trendingInInterests.titles.map((item) => (
            <ContentCard
              key={`trend-${item.id}`}
              content={item}
              variant="portrait"
              isSaved={isInWatchlist(item.id)}
              onPlay={() => handlePlayContent(item, 0)}
              onInfo={() => handleOpenDetails(item)}
              onAddToList={() => toggleWatchlist(item.id)}
            />
          ))}
        </HorizontalCarousel>
      )}

      {/* ─── Section 5: Favourite Genre Shelves ─── */}
      {recommendations.favouriteGenreShelves.map((shelf) => (
        <HorizontalCarousel
          key={`fav-${shelf.genre}`}
          title={shelf.title}
          eyebrow={shelf.eyebrow}
          subtitle={`Curated selections from our ${shelf.genre} library`}
        >
          {shelf.titles.map((item) => (
            <ContentCard
              key={`fav-${shelf.genre}-${item.id}`}
              content={item}
              variant="portrait"
              isSaved={isInWatchlist(item.id)}
              onPlay={() => handlePlayContent(item, 0)}
              onInfo={() => handleOpenDetails(item)}
              onAddToList={() => toggleWatchlist(item.id)}
            />
          ))}
        </HorizontalCarousel>
      ))}

      {/* ─── Section 6: Recommended for You (Diverse Discovery) ─── */}
      <HorizontalCarousel
        title="Recommended for You"
        eyebrow="EXPAND YOUR HORIZONS"
        subtitle="Unexplored stories matched to your viewing history and watchlist"
      >
        {recommendations.recommendedForYou.map((item) => (
          <ContentCard
            key={`rec-${item.id}`}
            content={item}
            variant="portrait"
            isSaved={isInWatchlist(item.id)}
            onPlay={() => handlePlayContent(item, 0)}
            onInfo={() => handleOpenDetails(item)}
            onAddToList={() => toggleWatchlist(item.id)}
          />
        ))}
      </HorizontalCarousel>

      {/* ─── Section 7: Recently Watched & Finished ─── */}
      {recentlyWatchedList.length > 0 && (
        <HorizontalCarousel
          title="Recently Watched"
          eyebrow="YOUR VIEWING LOG"
          subtitle="Titles you've streamed across your sessions on PIXEL+"
        >
          {recentlyWatchedList.map(({ content, history: h }) => (
            <ContentCard
              key={`rw-${content.id}`}
              content={content}
              variant="landscape"
              isSaved={isInWatchlist(content.id)}
              onPlay={() => handlePlayContent(content, h.progress)}
              onInfo={() => handleOpenDetails(content)}
              onAddToList={() => toggleWatchlist(content.id)}
            />
          ))}
        </HorizontalCarousel>
      )}

      {/* ─── Section 8: Platform Staples (Premieres & Cinema) ─── */}
      <HorizontalCarousel
        title="PIXEL+ Premieres"
        eyebrow="EXCLUSIVE ORIGINAL CINEMA"
        subtitle="Mastered in 4K HDR with multi-channel Dolby Atmos audio"
      >
        {SAMPLE_FEATURED_CARDS.slice(1).map((item) => (
          <ContentCard
            key={`prem-${item.id}`}
            content={item}
            variant="featured"
            isSaved={isInWatchlist(item.id)}
            onPlay={() => handlePlayContent(item, 0)}
            onInfo={() => handleOpenDetails(item)}
            onAddToList={() => toggleWatchlist(item.id)}
          />
        ))}
      </HorizontalCarousel>

      <HorizontalCarousel
        title="Trending Series & Episodes"
        eyebrow="POPULAR TELEVISION"
        subtitle="The most-streamed original seasons across the platform"
      >
        {SAMPLE_SERIES_CARDS.map((item) => (
          <ContentCard
            key={`ser-${item.id}`}
            content={item}
            variant="portrait"
            isSaved={isInWatchlist(item.id)}
            onPlay={() => handlePlayContent(item, 0)}
            onInfo={() => handleOpenDetails(item)}
            onAddToList={() => toggleWatchlist(item.id)}
          />
        ))}
      </HorizontalCarousel>

      <HorizontalCarousel
        title="Blockbuster Feature Films"
        eyebrow="CINEMA ARCHIVE"
        subtitle="Theatrical releases, festival favorites, and restored classics"
      >
        {SAMPLE_MOVIE_CARDS.map((item) => (
          <ContentCard
            key={`mov-${item.id}`}
            content={item}
            variant="portrait"
            isSaved={isInWatchlist(item.id)}
            onPlay={() => handlePlayContent(item, 0)}
            onInfo={() => handleOpenDetails(item)}
            onAddToList={() => toggleWatchlist(item.id)}
          />
        ))}
      </HorizontalCarousel>

      {/* ─── Navigation Shortcut Footer Banners ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
        {onExploreSeries && (
          <div
            onClick={onExploreSeries}
            className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--accent-primary)]/50 transition-all cursor-pointer group flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase text-[var(--accent-secondary)]">EPISODIC VAULT</span>
              <h3 className="font-display font-bold text-lg text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                Explore All Series &rarr;
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Browse our complete multi-genre television collection.
              </p>
            </div>
          </div>
        )}

        {onExploreMovies && (
          <div
            onClick={onExploreMovies}
            className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--accent-primary)]/50 transition-all cursor-pointer group flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase text-[var(--accent-secondary)]">THEATRICAL</span>
              <h3 className="font-display font-bold text-lg text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                Explore All Feature Cinema &rarr;
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Dive into 4K HDR theatrical releases and documentaries.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ─── Genre Preferences Customizer Modal ─── */}
      <GenrePreferencesModal
        isOpen={isPreferencesModalOpen}
        onClose={() => setIsPreferencesModalOpen(false)}
        profile={profile}
        currentGenres={preferredGenres}
        onSave={updatePreferredGenres}
        onReset={resetPreferences}
      />

      {/* ─── Interactive Simulated Playback Engine Modal ─── */}
      <SimulatedPlayerModal
        isOpen={Boolean(activePlayback)}
        content={activePlayback?.content || null}
        episode={activePlayback?.episode}
        initialProgress={activePlayback?.progress || 0}
        onClose={() => setActivePlayback(null)}
        onNextEpisode={(nextEp) => {
          if (activePlayback) {
            setActivePlayback({
              ...activePlayback,
              episode: nextEp,
              progress: 0,
            })
          }
        }}
        onProgressUpdate={updateProgress}
        onMarkCompleted={markCompleted}
      />
    </div>
  )
}
