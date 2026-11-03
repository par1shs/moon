import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  X,
  Play,
  Plus,
  Check,
  RotateCcw,
  Radio,
  Bell,
  BellRing,
  Film,
  Volume2,
  Sparkles,
  Layers,
} from 'lucide-react'
import type { ContentMetadata, EpisodeMetadata, BonusFeaturette } from '../../types'
import type { Profile } from '../profiles/types'
import { Button } from '../../components/common/Button'
import { IconButton } from '../../components/common/IconButton'
import { Badge } from '../../components/common/Badge'
import { ContentCard } from '../../components/cards/ContentCard'
import { Modal } from '../../components/modals/Modal'
import { SimulatedPlayerModal } from '../../components/player/SimulatedPlayerModal'
import { PlanUpgradeModal } from '../../components/subscription/PlanUpgradeModal'
import { SponsorInfoModal } from '../../components/sponsorship/SponsorInfoModal'
import { useSubscriptionTier } from '../../hooks/useSubscriptionTier'
import { useWatchlist } from '../../hooks/useWatchlist'
import { useViewingHistory } from '../../hooks/useViewingHistory'
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference'
import {
  SAMPLE_FEATURED_CARDS,
  SAMPLE_PORTRAIT_CARDS,
  SAMPLE_SERIES_CARDS,
  SAMPLE_MOVIE_CARDS,
  SAMPLE_LIVE_CHANNELS,
  SAMPLE_LANDSCAPE_CARDS,
} from '../../data/sampleContent'

const ALL_CATALOGUE_MAP = new Map<string, ContentMetadata>()
;[
  ...SAMPLE_FEATURED_CARDS,
  ...SAMPLE_PORTRAIT_CARDS,
  ...SAMPLE_SERIES_CARDS,
  ...SAMPLE_MOVIE_CARDS,
  ...SAMPLE_LIVE_CHANNELS,
  ...SAMPLE_LANDSCAPE_CARDS,
].forEach((item) => {
  if (!ALL_CATALOGUE_MAP.has(item.id)) {
    ALL_CATALOGUE_MAP.set(item.id, item)
  }
})

export interface ContentDetailsModalProps {
  content: ContentMetadata | null
  isOpen: boolean
  onClose: () => void
  profile: Profile
  onSelectRelated?: (content: ContentMetadata) => void
  onPlay?: (content: ContentMetadata, episode?: EpisodeMetadata) => void
  onWatchLive?: (channelId: string) => void
  onWatchCatchUp?: (programId: string, channelId: string) => void
}

export const ContentDetailsModal: React.FC<ContentDetailsModalProps> = ({
  content,
  isOpen,
  onClose,
  profile,
  onSelectRelated,
  onPlay,
  onWatchLive,
  onWatchCatchUp,
}) => {
  const reducedMotion = useReducedMotionPreference()
  const { isInWatchlist, toggleWatchlist } = useWatchlist(
    profile.id,
    profile.isKidsProfile
  )
  const {
    getHistoryItem,
    updateProgress,
    markCompleted,
    getEpisodeProgress,
    getSeriesProgress,
  } = useViewingHistory(profile.id)

  const [selectedSeasonIdx, setSelectedSeasonIdx] = useState(0)
  const [hasReminder, setHasReminder] = useState(false)
  const [isExtendedEdition, setIsExtendedEdition] = useState(false)
  const [activeBonusFeature, setActiveBonusFeature] = useState<BonusFeaturette | null>(null)
  const [activePlayerTitle, setActivePlayerTitle] = useState<string | null>(null)
  const [activePlayerSubtitle, setActivePlayerSubtitle] = useState<string | null>(null)
  const [isInteractivePlayerOpen, setIsInteractivePlayerOpen] = useState(false)
  const [activePlayerEpisode, setActivePlayerEpisode] = useState<EpisodeMetadata | undefined>(undefined)
  const [prevContentId, setPrevContentId] = useState(content?.id)
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false)

  // Phase 6B: Subscription Tier & Feature Gating
  const { tier, isFreeTier, setPlan } = useSubscriptionTier(profile.id)
  const [upgradeModalState, setUpgradeModalState] = useState<{
    isOpen: boolean
    targetPlanId?: 'standard' | 'premium'
    featureName?: string
    featureDescription?: string
  } | null>(null)

  const isSeries = Boolean(content?.type === 'series' || (content?.seasons && content.seasons.length > 0))

  // Dynamically calculate series progress and next episode to watch
  const seriesProgress = useMemo(() => {
    if (!content || !isSeries) return null
    return getSeriesProgress(content)
  }, [content, isSeries, getSeriesProgress])

  const handlePlayBonusFeature = (bonus: BonusFeaturette) => {
    if (isFreeTier) {
      setUpgradeModalState({
        isOpen: true,
        targetPlanId: 'standard',
        featureName: `Bonus Feature: ${bonus.title}`,
        featureDescription:
          'Behind-the-scenes interviews, deleted scenes, and special featurettes require a Standard or Premium plan. Upgrade to unlock full access ad-free.',
      })
      return
    }
    setActiveBonusFeature(bonus)
    setIsInteractivePlayerOpen(true)
  }

  // Reset or initialize season when content changes during render
  if (prevContentId !== content?.id) {
    setPrevContentId(content?.id)
    setHasReminder(false)
    setIsExtendedEdition(false)
    setActiveBonusFeature(null)

    let initialSeasonIdx = 0
    if (content && isSeries && content.seasons && seriesProgress?.nextEpisodeToWatch) {
      const targetSeasonIdx = content.seasons.findIndex(
        (s) => s.seasonNumber === seriesProgress.nextEpisodeToWatch?.seasonNumber
      )
      if (targetSeasonIdx !== -1) {
        initialSeasonIdx = targetSeasonIdx
      }
    }
    setSelectedSeasonIdx(initialSeasonIdx)
  }

  // Handle ESC key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  // Resolve related titles
  const relatedContent = useMemo(() => {
    if (!content) return []
    if (content.relatedIds && content.relatedIds.length > 0) {
      return content.relatedIds
        .map((id) => ALL_CATALOGUE_MAP.get(id))
        .filter((c): c is ContentMetadata => Boolean(c) && (c as ContentMetadata).id !== content.id)
        .slice(0, 5)
    }
    // Fallback: match by genre or type
    return Array.from(ALL_CATALOGUE_MAP.values())
      .filter((c): c is ContentMetadata => Boolean(c) && c.id !== content.id && Boolean(c.genres?.some((g) => content.genres?.includes(g))))
      .slice(0, 5)
  }, [content])

  if (!isOpen || !content) return null

  const currentSeason = isSeries && content.seasons ? content.seasons[selectedSeasonIdx] : null
  const isSaved = isInWatchlist(content.id)
  const heroImage = content.backdropUrl || content.posterUrl
  const historyItem = content ? getHistoryItem(content.id) : undefined

  const handlePlayNow = (episode?: EpisodeMetadata) => {
    let targetEpisode = episode
    if (!targetEpisode && isSeries && seriesProgress) {
      if (seriesProgress.nextEpisodeToWatch) {
        targetEpisode = seriesProgress.nextEpisodeToWatch.episode
      } else if (content.seasons?.[0]?.episodes?.[0]) {
        targetEpisode = content.seasons[0].episodes[0]
      }
    }

    if (onPlay) {
      onPlay(content, targetEpisode)
    } else {
      setActivePlayerEpisode(targetEpisode)
      setIsInteractivePlayerOpen(true)
    }
  }

  const handleWatchTrailer = () => {
    setActivePlayerTitle(`${content.title} — Official Trailer`)
    setActivePlayerSubtitle('PIXEL+ Theatrical Preview • 4K HDR Atmos')
  }

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex justify-center p-0 sm:p-4 md:p-6 lg:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="details-title"
      >
        {/* Backdrop Dismiss Click */}
        <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

        {/* Modal Window Container */}
        <motion.div
          data-testid="content-details-modal"
          initial={reducedMotion ? false : { opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          style={{ background: 'var(--gradient-brand-modal)' }}
          className="relative w-full max-w-5xl rounded-none sm:rounded-3xl overflow-hidden border border-[var(--border-subtle)] shadow-[0_25px_60px_rgba(0,0,0,0.8)] my-auto select-none flex flex-col z-10"
        >
          {/* ─── Hero Cinematic Artwork Area ─── */}
          <div className="relative w-full aspect-[16/10] sm:aspect-[21/9] min-h-[340px] sm:min-h-[420px] bg-black overflow-hidden flex flex-col justify-end p-6 sm:p-10 lg:p-12">
            {heroImage && (
              <img
                src={heroImage}
                alt={content.title}
                className="absolute inset-0 w-full h-full object-cover filter brightness-[0.82] contrast-[1.06]"
              />
            )}

            {/* Brand Primary Radial Glow (Deep Indigo / Midnight Slate depth) */}
            <div
              className="absolute inset-0 z-10 pointer-events-none"
              style={{
                background:
                  'radial-gradient(110% 85% at 75% 15%, rgba(36, 43, 64, 0.75) 0%, rgba(21, 27, 46, 0.75) 45%, rgba(16, 19, 29, 0.90) 75%, rgba(12, 13, 15, 0.98) 100%)',
              }}
            />

            {/* Ambient Dynamic Theme Glow Blob */}
            <div
              className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full pointer-events-none blur-3xl opacity-35 z-10"
              style={{
                background: 'radial-gradient(circle, var(--accent-glow) 0%, rgba(0,0,0,0) 70%)',
              }}
            />

            {/* Deep Cinematic Gradients */}
            <div
              className="absolute inset-0 z-10 pointer-events-none"
              style={{
                background:
                  'linear-gradient(to top, var(--bg-card) 0%, rgba(16, 19, 29, 0.85) 50%, transparent 100%)',
              }}
            />
            <div
              className="absolute inset-0 z-10 pointer-events-none"
              style={{
                background:
                  'linear-gradient(to right, rgba(16, 19, 29, 0.95) 0%, rgba(16, 19, 29, 0.50) 60%, transparent 100%)',
              }}
            />

            {/* Close Button Top Right */}
            <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-30">
              <IconButton
                icon={<X className="w-5 h-5" />}
                aria-label="Close details"
                variant="elevated"
                size="md"
                onClick={onClose}
                className="rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-white shadow-lg"
              />
            </div>

            {/* Hero Information Block */}
            <div className="relative z-20 space-y-3 sm:space-y-4 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2.5">
                {content.badge && (
                  <Badge variant="accent" size="sm">
                    {content.badge}
                  </Badge>
                )}
                {content.quality && (
                  <Badge variant="subtle" size="sm">
                    {content.quality}
                  </Badge>
                )}
                {content.rating && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-black/70 border border-white/15 text-[var(--text-secondary)]">
                    {content.rating}
                  </span>
                )}
                {content.duration && (
                  <span className="text-xs font-mono text-[var(--text-muted)]">
                    •{' '}
                    {isExtendedEdition && content.extendedEdition
                      ? `${content.duration} (+${content.extendedEdition.additionalMinutes}m ${content.extendedEdition.editionType})`
                      : content.duration}
                  </span>
                )}
                {content.year && (
                  <span className="text-xs font-mono text-[var(--text-muted)]">
                    • {content.year}
                  </span>
                )}
              </div>

              <h1
                id="details-title"
                className="font-display text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--text-primary)] leading-[1.1] drop-shadow-md"
              >
                {isExtendedEdition && content.extendedEdition
                  ? content.extendedEdition.title
                  : content.title}
              </h1>

              {content.subtitle && (
                <p className="text-xs sm:text-sm font-mono text-[var(--accent-secondary)]">
                  {content.subtitle}
                </p>
              )}

              {/* Primary Actions Row */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<Play className="w-4 h-4 fill-current ml-0.5" />}
                  onClick={() => handlePlayNow()}
                >
                  {isSeries && seriesProgress
                    ? seriesProgress.nextEpisodeToWatch
                      ? seriesProgress.nextEpisodeToWatch.isResume
                        ? `Resume S${seriesProgress.nextEpisodeToWatch.seasonNumber}:E${seriesProgress.nextEpisodeToWatch.episode.episodeNumber} (${getEpisodeProgress(content.id, seriesProgress.nextEpisodeToWatch.episode.id, seriesProgress.nextEpisodeToWatch.seasonNumber, seriesProgress.nextEpisodeToWatch.episode.episodeNumber).progress}%)`
                        : seriesProgress.nextEpisodeToWatch.isNextSeason
                        ? `Start Season ${seriesProgress.nextEpisodeToWatch.seasonNumber} (E${seriesProgress.nextEpisodeToWatch.episode.episodeNumber})`
                        : `Play S${seriesProgress.nextEpisodeToWatch.seasonNumber}:E${seriesProgress.nextEpisodeToWatch.episode.episodeNumber}`
                      : seriesProgress.isFullyCompleted
                      ? 'Watch Again (S1:E1)'
                      : 'Play S1:E1'
                    : historyItem && !historyItem.completed && historyItem.progress > 0
                    ? `Resume (${historyItem.progress}%)`
                    : historyItem?.completed
                    ? 'Watch Again'
                    : isExtendedEdition
                    ? `Play ${content.extendedEdition?.editionType || 'Extended'}`
                    : 'Play Now'}
                </Button>

                {content.extendedEdition && (
                  <button
                    type="button"
                    data-testid="hybrid-extended-edition-btn"
                    onClick={() => {
                      if (isFreeTier) {
                        setUpgradeModalState({
                          isOpen: true,
                          targetPlanId: 'standard',
                          featureName: 'Extended Editions & Director’s Cuts',
                          featureDescription:
                            'Extended cuts, director editions, and alternate endings are available on Standard and Premium plans. Upgrade to unlock extended footage ad-free.',
                        })
                        return
                      }
                      setIsExtendedEdition(!isExtendedEdition)
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold border transition-all cursor-pointer ${
                      isExtendedEdition
                        ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] border-[var(--accent-primary)] shadow-md ring-2 ring-[var(--accent-primary)]/40'
                        : 'bg-[var(--bg-elevated)] hover:bg-white/10 text-[var(--text-secondary)] border-[var(--border-subtle)]'
                    }`}
                    title={content.extendedEdition.description}
                  >
                    <Layers className="w-4 h-4" />
                    <span>
                      {isExtendedEdition
                        ? `${content.extendedEdition.editionType} (+${content.extendedEdition.additionalMinutes}m)`
                        : `Switch to ${content.extendedEdition.editionType}`}
                    </span>
                  </button>
                )}

                <Button
                  variant="secondary"
                  size="md"
                  leftIcon={
                    isSaved ? (
                      <Check className="w-4 h-4 text-[var(--accent-primary)]" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )
                  }
                  onClick={() => toggleWatchlist(content.id)}
                >
                  {isSaved ? 'In My List' : 'Add to My List'}
                </Button>

                <Button
                  variant="ghost"
                  size="md"
                  leftIcon={<Film className="w-4 h-4" />}
                  onClick={handleWatchTrailer}
                >
                  Watch Trailer
                </Button>
              </div>

              {/* Series Last Watched Continuity Callout */}
              {isSeries && seriesProgress?.lastWatchedEpisode && (
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono text-[var(--accent-secondary)]">
                  <span className="text-[var(--text-muted)] uppercase tracking-wider text-[10px]">Last Watched:</span>
                  <span className="font-semibold text-white">
                    Season {seriesProgress.lastWatchedEpisode.seasonNumber}, Ep {seriesProgress.lastWatchedEpisode.episode.episodeNumber} &ldquo;{seriesProgress.lastWatchedEpisode.episode.title}&rdquo;
                  </span>
                  <span>•</span>
                  <span
                    className={
                      seriesProgress.lastWatchedEpisode.completed
                        ? 'text-emerald-400 font-bold'
                        : 'text-[var(--accent-primary)] font-bold'
                    }
                  >
                    {seriesProgress.lastWatchedEpisode.completed
                      ? 'Completed'
                      : `${seriesProgress.lastWatchedEpisode.progress}% watched`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ─── Body Details Container ─── */}
          <div className="p-6 sm:p-10 space-y-8 sm:space-y-10">
            {/* ─── Phase 5D: Hybrid Linear TV Integration Broadcast Banner ─── */}
            {(content.hybridBroadcast || content.broadcastSchedule) && (
              <div
                data-testid="hybrid-broadcast-banner"
                className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--accent-primary)]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)] shrink-0">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent-secondary)] font-semibold">
                        {content.hybridBroadcast?.isLiveNow || content.broadcastSchedule?.isLiveNow
                          ? '● BROADCASTING LIVE ON LINEAR TV'
                          : content.hybridBroadcast?.isCatchUpAvailable
                          ? 'AVAILABLE ON CATCH-UP & SCHEDULED TV'
                          : 'UPCOMING TV BROADCAST PREMIERE'}
                      </span>
                      <Badge variant="live" size="sm">
                        CH {content.hybridBroadcast?.channelNumber || content.broadcastSchedule?.channelNumber || '101'}
                      </Badge>
                    </div>
                    <p className="text-sm font-display font-bold text-[var(--text-primary)]">
                      {content.hybridBroadcast?.channelTitle || content.broadcastSchedule?.channelName}
                      {' • '}
                      {content.hybridBroadcast?.airTimeText || content.broadcastSchedule?.airTime}
                    </p>
                    {content.hybridBroadcast?.isCatchUpAvailable && content.hybridBroadcast?.catchUpExpiryText && (
                      <p className="text-xs font-mono text-amber-400">
                        {content.hybridBroadcast.catchUpExpiryText}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {(content.hybridBroadcast?.isLiveNow || content.broadcastSchedule?.isLiveNow) && (
                    <Button
                      variant="primary"
                      size="sm"
                      data-testid="hybrid-watch-live-btn"
                      leftIcon={<Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                      onClick={() => {
                        const chId = content.hybridBroadcast?.channelId || 'ch-101'
                        if (onWatchLive) {
                          onWatchLive(chId)
                        } else {
                          handlePlayNow()
                        }
                      }}
                    >
                      Watch Live on CH {content.hybridBroadcast?.channelNumber || content.broadcastSchedule?.channelNumber}
                    </Button>
                  )}

                  {!(content.hybridBroadcast?.isLiveNow || content.broadcastSchedule?.isLiveNow) && (
                    <Button
                      variant={hasReminder ? 'secondary' : 'outline'}
                      size="sm"
                      data-testid="hybrid-remind-me-btn"
                      leftIcon={
                        hasReminder ? (
                          <BellRing className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                        ) : (
                          <Bell className="w-3.5 h-3.5" />
                        )
                      }
                      onClick={() => setHasReminder(!hasReminder)}
                    >
                      {hasReminder ? 'Reminder Set' : 'Remind Me'}
                    </Button>
                  )}

                  {content.hybridBroadcast?.isCatchUpAvailable && (
                    <Button
                      variant="secondary"
                      size="sm"
                      data-testid="hybrid-watch-catchup-btn"
                      leftIcon={<RotateCcw className="w-3.5 h-3.5 text-amber-400" />}
                      onClick={() => {
                        const progId = content.hybridBroadcast?.catchUpProgramId || `catchup-${content.id}`
                        const chId = content.hybridBroadcast?.channelId || 'ch-101'
                        if (onWatchCatchUp) {
                          onWatchCatchUp(progId, chId)
                        } else {
                          handlePlayNow()
                        }
                      }}
                    >
                      Watch Catch-up TV
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* ─── Phase 6A & 6C: Sponsored Content Disclosure & CTA ─── */}
            {content.sponsor && (
              <div
                data-testid="details-sponsor-box"
                className="p-3.5 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 text-xs font-mono"
              >
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-amber-500 text-black text-[10px]">
                    SPONSORED
                  </span>
                  <span className="text-[var(--text-primary)]">
                    Presented in partnership with <strong>{content.sponsor.name}</strong>
                  </span>
                  <span className="hidden md:inline text-[var(--text-muted)]">
                    • {content.sponsor.tagline}
                  </span>
                </div>
                <button
                  type="button"
                  data-testid="details-sponsor-cta"
                  onClick={() => setIsSponsorModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold shrink-0 transition-colors cursor-pointer"
                >
                  Sponsor Details &rarr;
                </button>
              </div>
            )}

            {/* ─── Synopsis & Metadata Grid ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Full Synopsis & Genres */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-display font-bold text-lg text-[var(--text-primary)] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span>About {content.title}</span>
                </h3>
                <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
                  {content.description || content.subtitle}
                </p>

                {content.genres && (
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <span className="text-xs font-mono text-[var(--text-muted)] mr-1">
                      Genres:
                    </span>
                    {content.genres.map((g) => (
                      <span
                        key={g}
                        className="px-3 py-1 rounded-full text-xs font-mono bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)]"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Cast, Creators, Audio Specifications */}
              <div className="space-y-4 p-5 rounded-2xl bg-[var(--bg-elevated)]/40 border border-[var(--border-subtle)] text-xs font-mono">
                {content.cast && content.cast.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[var(--text-muted)] uppercase tracking-wider block">
                      Starring:
                    </span>
                    <span className="text-[var(--text-primary)] font-sans text-xs font-medium leading-relaxed block">
                      {content.cast.join(', ')}
                    </span>
                  </div>
                )}

                {(content.director || (content.creators && content.creators.length > 0)) && (
                  <div className="space-y-1">
                    <span className="text-[var(--text-muted)] uppercase tracking-wider block">
                      Creators / Director:
                    </span>
                    <span className="text-[var(--text-primary)] font-sans text-xs font-medium block">
                      {content.director || content.creators?.join(', ')}
                    </span>
                  </div>
                )}

                {content.maturityAdvisory && (
                  <div className="space-y-1">
                    <span className="text-[var(--text-muted)] uppercase tracking-wider block">
                      Maturity Advisory:
                    </span>
                    <span className="text-[var(--text-secondary)] block">
                      {content.maturityAdvisory}
                    </span>
                  </div>
                )}

                {content.audioLanguages && (
                  <div className="space-y-1">
                    <span className="text-[var(--text-muted)] uppercase tracking-wider block flex items-center gap-1">
                      <Volume2 className="w-3 h-3 text-[var(--accent-secondary)]" />
                      <span>Audio &amp; Subtitles:</span>
                    </span>
                    <span className="text-[var(--text-secondary)] block">
                      {content.audioLanguages.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ─── Series-Specific Section: Progress Overview, Season Selector & Episodes ─── */}
            {isSeries && content.seasons && content.seasons.length > 0 && (
              <div className="space-y-6 pt-4 border-t border-[var(--border-subtle)]">
                {/* ─── Section 6: Series Progress Overview Card ─── */}
                {seriesProgress && seriesProgress.totalEpisodes > 0 && (
                  <div
                    data-testid="series-progress-overview"
                    className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-elevated)]/60 border border-[var(--border-subtle)] space-y-3.5 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[var(--accent-primary)]" />
                        <h4 className="font-display font-bold text-sm sm:text-base text-[var(--text-primary)]">
                          Series Progress Overview
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-[var(--accent-primary)]/15 text-[var(--accent-secondary)] border border-[var(--accent-primary)]/30 font-semibold">
                          {seriesProgress.overallPercent}% Complete
                        </span>
                      </div>

                      {seriesProgress.lastWatchedEpisode && (
                        <span className="text-xs font-mono text-[var(--text-muted)]">
                          Active:{' '}
                          <strong className="text-[var(--text-primary)]">
                            S{seriesProgress.lastWatchedEpisode.seasonNumber}:E{seriesProgress.lastWatchedEpisode.episode.episodeNumber}
                          </strong>{' '}
                          ({seriesProgress.lastWatchedEpisode.progress}%)
                        </span>
                      )}
                    </div>

                    {/* Overall Progress Bar */}
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-full transition-all duration-500"
                        style={{ width: `${seriesProgress.overallPercent}%` }}
                      />
                    </div>

                    {/* Compact Stat Chips */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs font-mono">
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex flex-col gap-0.5">
                        <span className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider">Total</span>
                        <span className="text-[var(--text-primary)] font-bold text-sm">
                          {seriesProgress.totalEpisodes} Episodes
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex flex-col gap-0.5">
                        <span className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider">Completed</span>
                        <span className="text-emerald-400 font-bold text-sm flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>{seriesProgress.completedEpisodes} Watched</span>
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex flex-col gap-0.5">
                        <span className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider">In Progress</span>
                        <span className="text-[var(--accent-secondary)] font-bold text-sm">
                          {seriesProgress.inProgressEpisodes} Episodes
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex flex-col gap-0.5">
                        <span className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider">Current Season</span>
                        <span className="text-[var(--text-primary)] font-bold text-sm">
                          {currentSeason
                            ? `${seriesProgress.seasonProgress[currentSeason.seasonNumber]?.completed || 0}/${currentSeason.episodes.length} (${seriesProgress.seasonProgress[currentSeason.seasonNumber]?.percent || 0}%)`
                            : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── Section 2: Season Selection Header & Selector ─── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <div className="space-y-0.5">
                    <h3 className="font-display font-bold text-xl text-[var(--text-primary)]">
                      Episodes
                    </h3>
                    {currentSeason && (
                      <p className="text-xs font-mono text-[var(--text-muted)]">
                        {currentSeason.title || `Season ${currentSeason.seasonNumber}`} • {currentSeason.episodes.length} Episodes
                      </p>
                    )}
                  </div>

                  {/* Season Selector Tabs / Pills */}
                  {content.seasons.length > 1 ? (
                    <div
                      className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
                      role="tablist"
                      aria-label="Season selector"
                    >
                      {content.seasons.map((season, idx) => {
                        const isSelected = selectedSeasonIdx === idx
                        const sProg = seriesProgress?.seasonProgress[season.seasonNumber]
                        const isSeasonDone = Boolean(sProg && sProg.completed === season.episodes.length && season.episodes.length > 0)

                        return (
                          <button
                            key={season.seasonNumber}
                            type="button"
                            role="tab"
                            aria-selected={isSelected}
                            onClick={() => setSelectedSeasonIdx(idx)}
                            className={`group flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-semibold shadow-[0_4px_16px_var(--accent-glow)]'
                                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)]'
                            }`}
                          >
                            <span>Season {season.seasonNumber}</span>
                            {isSeasonDone ? (
                              <Check
                                className={`w-3.5 h-3.5 ${
                                  isSelected ? 'text-[var(--accent-contrast)]' : 'text-emerald-400'
                                }`}
                              />
                            ) : (
                              <span className="text-[10px] font-mono opacity-80">
                                ({season.episodes.length})
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-mono bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                        {content.seasons[0].title || 'Season 1'}
                      </span>
                    </div>
                  )}
                </div>

                {/* ─── Section 3: Episode Cards Rail with Progress Indicators ─── */}
                {currentSeason && (
                  <div className="space-y-3.5">
                    {currentSeason.episodes.map((ep) => {
                      const epState = getEpisodeProgress(
                        content.id,
                        ep.id,
                        currentSeason.seasonNumber,
                        ep.episodeNumber
                      )
                      const isCompleted = epState.completed
                      const isInProgress = !isCompleted && epState.progress > 0

                      return (
                        <div
                          key={ep.id}
                          data-testid="episode-card"
                          onClick={() => handlePlayNow(ep)}
                          className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer group ${
                            isInProgress
                              ? 'bg-[var(--bg-elevated)]/60 border-[var(--accent-primary)]/60 shadow-[0_4px_20px_var(--accent-glow)]'
                              : isCompleted
                              ? 'bg-[var(--bg-elevated)]/25 border-emerald-500/25 hover:border-emerald-500/50'
                              : 'bg-[var(--bg-elevated)]/30 border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)]/60 hover:border-[var(--accent-primary)]/40'
                          }`}
                        >
                          <div className="flex items-start sm:items-center gap-4 min-w-0">
                            {/* Episode Thumbnail */}
                            <div className="relative w-32 sm:w-44 aspect-video rounded-xl overflow-hidden bg-black shrink-0 border border-[var(--border-subtle)]">
                              {ep.thumbnailUrl && (
                                <img
                                  src={ep.thumbnailUrl}
                                  alt={ep.title}
                                  className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                                    isCompleted ? 'brightness-75 contrast-95' : ''
                                  }`}
                                />
                              )}

                              {/* Hover Play Icon Overlay */}
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-9 h-9 rounded-full bg-[var(--accent-primary)] text-[var(--accent-contrast)] flex items-center justify-center shadow-lg">
                                  <Play className="w-4 h-4 fill-current ml-0.5" />
                                </div>
                              </div>

                              {/* Progress Bar (if in progress) */}
                              {isInProgress && (
                                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/50 overflow-hidden">
                                  <div
                                    className="h-full bg-[var(--accent-primary)] transition-all duration-300"
                                    style={{ width: `${epState.progress}%` }}
                                  />
                                </div>
                              )}

                              {/* Completed Checkmark Overlay */}
                              {isCompleted && (
                                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-500/95 text-black text-[10px] font-mono font-bold flex items-center gap-1 shadow-md">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  <span>WATCHED</span>
                                </div>
                              )}
                            </div>

                            {/* Episode Information */}
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                                <span className="text-[var(--accent-secondary)] font-semibold">
                                  Episode {ep.episodeNumber}
                                </span>
                                <span className="text-[var(--text-muted)]">•</span>
                                <span className="text-[var(--text-muted)]">{ep.duration}</span>

                                {isInProgress && (
                                  <>
                                    <span className="text-[var(--text-muted)]">•</span>
                                    <span className="text-[var(--accent-primary)] font-semibold">
                                      {epState.progress}% watched
                                    </span>
                                  </>
                                )}

                                {isCompleted && (
                                  <>
                                    <span className="text-[var(--text-muted)]">•</span>
                                    <span className="text-emerald-400 font-semibold">
                                      Completed
                                    </span>
                                  </>
                                )}
                              </div>

                              <h4 className="font-display font-semibold text-sm sm:text-base text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors truncate">
                                {ep.title}
                              </h4>

                              <p className="text-xs text-[var(--text-secondary)] line-clamp-2 max-w-xl leading-relaxed">
                                {ep.synopsis}
                              </p>
                            </div>
                          </div>

                          {/* Action Button: Play / Resume / Watch Again */}
                          <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0">
                            {isInProgress ? (
                              <Button
                                variant="primary"
                                size="sm"
                                leftIcon={<Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handlePlayNow(ep)
                                }}
                              >
                                Resume ({epState.progress}%)
                              </Button>
                            ) : isCompleted ? (
                              <Button
                                variant="secondary"
                                size="sm"
                                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handlePlayNow(ep)
                                }}
                              >
                                Watch Again
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                leftIcon={<Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handlePlayNow(ep)
                                }}
                                className="group-hover:bg-[var(--accent-primary)] group-hover:text-[var(--accent-contrast)]"
                              >
                                Play
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ─── Phase 5D: Bonus Content & Behind-The-Scenes Shelf ─── */}
            {content.bonusContent && content.bonusContent.length > 0 && (
              <div
                data-testid="hybrid-bonus-content-section"
                className="space-y-4 pt-4 border-t border-[var(--border-subtle)]"
              >
                <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                    <strong className="text-[var(--text-primary)] uppercase tracking-wider">
                      Bonus Content &amp; Behind-the-Scenes
                    </strong>
                  </span>
                  <span className="text-[var(--accent-secondary)]">
                    {content.bonusContent.length} EXCLUSIVE FEATURETTES
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {content.bonusContent.map((bonus) => (
                    <div
                      key={bonus.id}
                      data-testid={`bonus-card-${bonus.id}`}
                      onClick={() => handlePlayBonusFeature(bonus)}
                      className="group relative rounded-2xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/50 transition-all p-3 space-y-3 cursor-pointer shadow-sm hover:shadow-md"
                    >
                      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/60">
                        <img
                          src={bonus.thumbnailUrl}
                          alt={bonus.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />

                        {/* Play hover badge */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)] text-[var(--accent-contrast)] flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                          </div>
                        </div>

                        {/* Duration badge */}
                        <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/80 text-white border border-white/20">
                          {bonus.duration}
                        </span>

                        {/* Type badge */}
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-mono uppercase font-bold tracking-wider bg-[var(--accent-primary)]/90 text-[var(--accent-contrast)] shadow">
                          {bonus.type}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-display font-bold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors line-clamp-1">
                          {bonus.title}
                        </h4>
                        <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                          {bonus.description}
                        </p>
                      </div>

                      <div className="pt-1 flex items-center justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`bonus-play-btn-${bonus.id}`}
                          leftIcon={<Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePlayBonusFeature(bonus)
                          }}
                          className="group-hover:bg-[var(--accent-primary)] group-hover:text-[var(--accent-contrast)] text-xs"
                        >
                          Play Featurette
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Related / More Like This Shelf ─── */}
            {relatedContent.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-[var(--border-subtle)]">
                <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
                  <span>MORE LIKE THIS</span>
                  <span>PIXEL+ RECOMMENDATIONS</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {relatedContent.map((item) => (
                    <ContentCard
                      key={item.id}
                      content={item}
                      variant="portrait"
                      isGrid={true}
                      isSaved={isInWatchlist(item.id)}
                      onPlay={() => handlePlayNow()}
                      onInfo={(c) => {
                        if (onSelectRelated) {
                          onSelectRelated(c)
                        }
                      }}
                      onAddToList={(c) => toggleWatchlist(c.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Interactive Stream Engine Player Modal */}
      <SimulatedPlayerModal
        isOpen={isInteractivePlayerOpen}
        content={content}
        profileId={profile.id}
        episode={activePlayerEpisode}
        bonusFeature={activeBonusFeature || undefined}
        initialProgress={
          activeBonusFeature
            ? 0
            : activePlayerEpisode
            ? getEpisodeProgress(
                content.id,
                activePlayerEpisode.id,
                currentSeason?.seasonNumber,
                activePlayerEpisode.episodeNumber
              ).progress
            : historyItem?.progress || 0
        }
        onClose={() => {
          setIsInteractivePlayerOpen(false)
          setActivePlayerEpisode(undefined)
          setActiveBonusFeature(null)
        }}
        onNextEpisode={(nextEp) => setActivePlayerEpisode(nextEp)}
        onProgressUpdate={updateProgress}
        onMarkCompleted={markCompleted}
      />

      {/* Simulated Trailer Preview Modal */}
      <Modal
        isOpen={Boolean(activePlayerTitle)}
        onClose={() => setActivePlayerTitle(null)}
        title={activePlayerTitle || ''}
        size="xl"
      >
        <div className="space-y-4">
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-[var(--border-subtle)]">
            {heroImage && (
              <img
                src={heroImage}
                alt={activePlayerTitle || ''}
                className="w-full h-full object-cover opacity-60 filter blur-[2px]"
              />
            )}
            <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-4 text-center p-6">
              <div className="w-16 h-16 rounded-full bg-[var(--accent-primary)] text-[var(--accent-contrast)] flex items-center justify-center shadow-2xl animate-pulse">
                <Play className="w-8 h-8 fill-current ml-1" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-bold text-xl text-white">
                  {activePlayerTitle}
                </h4>
                <p className="text-xs font-mono text-[var(--accent-secondary)]">
                  {activePlayerSubtitle || 'PIXEL+ Stream Engine • 4K HDR Atmos'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-mono">
            <span>Spatial Audio 5.1 Active</span>
            <span>Bitrate: 18.5 Mbps Ultra-HD</span>
          </div>
        </div>
      </Modal>

      {/* Phase 6B: Contextual Plan Upgrade Modal */}
      {upgradeModalState && (
        <PlanUpgradeModal
          isOpen={upgradeModalState.isOpen}
          onClose={() => setUpgradeModalState(null)}
          currentPlanId={tier}
          targetPlanId={upgradeModalState.targetPlanId}
          featureName={upgradeModalState.featureName}
          featureDescription={upgradeModalState.featureDescription}
          onConfirmPlanChange={(planId, freq) => {
            setPlan(planId, freq)
            setUpgradeModalState(null)
          }}
        />
      )}

      {/* Phase 6C: Sponsor Info Modal */}
      {content?.sponsor && (
        <SponsorInfoModal
          isOpen={isSponsorModalOpen}
          onClose={() => setIsSponsorModalOpen(false)}
          sponsor={content.sponsor}
        />
      )}
    </AnimatePresence>
  )
}
