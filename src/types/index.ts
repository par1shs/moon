import type { ReactNode } from 'react'

/**
 * Visual Theme Types
 */
export interface AccentTheme {
  id: string
  name: string
  primary: string
  secondary: string
  muted: string
  glow: string
  contrast: string
  accentBg?: string
  accentBorder?: string
  borderFocus?: string
}

export type ColorMode = 'dark' | 'light'

export interface ThemeContextValue {
  colorMode: ColorMode
  setColorMode: (mode: ColorMode) => void
  toggleColorMode: () => void
  currentAccent: AccentTheme
  availableAccents: AccentTheme[]
  setAccent: (accentId: string) => void
  setCustomAccent: (accent: Partial<AccentTheme> & { primary: string }) => void
}

/**
 * Component Variants & Size Types
 */
export type ComponentSize = 'sm' | 'md' | 'lg'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
export type IconButtonVariant = 'primary' | 'secondary' | 'ghost' | 'elevated' | 'outline'
export type BadgeVariant = 'default' | 'accent' | 'outline' | 'live' | 'subtle'
export type ContentCardVariant = 'portrait' | 'landscape' | 'featured'

/**
 * Content Details Models
 */
export interface EpisodeMetadata {
  id: string
  episodeNumber: number
  title: string
  synopsis: string
  duration: string
  thumbnailUrl?: string
  progress?: number
}

export interface SeasonMetadata {
  seasonNumber: number
  title: string
  episodes: EpisodeMetadata[]
}

export interface BroadcastSchedule {
  channelNumber: string
  channelName: string
  airTime: string
  isLiveNow?: boolean
  scheduledDate?: string
}

/**
 * Phase 5D: Unified TV-to-OTT Models
 */
export interface BonusFeaturette {
  id: string
  title: string
  duration: string
  type: 'interview' | 'behind-the-scenes' | 'commentary' | 'deleted-scene' | 'aftershow'
  thumbnailUrl: string
  description: string
  year?: string
}

export interface ExtendedEditionInfo {
  isAvailable: boolean
  title: string
  additionalMinutes: number
  description: string
  editionType: "Director's Cut" | "Extended Cut" | "Special Edition" | "IMAX Enhanced"
}

export interface HybridBroadcastInfo {
  channelId: string
  channelNumber: string
  channelTitle: string
  isLiveNow?: boolean
  airTimeText?: string
  nextAirTimeISO?: string
  isCatchUpAvailable?: boolean
  catchUpExpiryText?: string
  catchUpProgramId?: string
}

/**
 * Phase 6A & 6B: AVOD & SVOD Subscription & Membership Models
 */
export type SubscriptionPlanId = 'free' | 'standard' | 'premium'
export type SubscriptionTier = SubscriptionPlanId

export type BillingFrequency = 'monthly' | 'annual'
export type SubscriptionStatus = 'active' | 'cancelled' | 'trial'

export interface SubscriptionInfo {
  planId: SubscriptionPlanId
  planName: string
  billingFrequency: BillingFrequency
  status: SubscriptionStatus
  startDateISO: string
  renewalDateISO: string
  cancelAtPeriodEnd: boolean
  cancelledDateISO?: string
  isTrial?: boolean
  trialEndsISO?: string
}

export interface SubscriptionPlan {
  id: SubscriptionPlanId
  name: string
  tagline: string
  monthlyPrice: number
  annualPrice: number
  currency: string
  badgeText?: string
  highlightColor: string
  adSupported: boolean
  maxVideoQuality: '720p HD' | '1080p Full HD' | '4K HDR'
  audioQuality: 'Stereo' | '5.1 Surround' | 'Dolby Atmos 5.1'
  catalogueAccess: 'Selected Titles' | 'Full Catalogue' | 'Full Catalogue + Exclusives'
  bonusContentAccess: boolean
  interactiveAccess: boolean
  priorityCatchUp: boolean
  screensSimultaneous: number
  features: string[]
}

export interface PlanFeatureComparisonRow {
  category: string
  feature: string
  free: string | boolean
  standard: string | boolean
  premium: string | boolean
  tooltip?: string
}

export * from './advertising'

export type AdPlacementType = 'pre-roll' | 'mid-roll' | 'sponsored'

export interface Advertisement {
  id: string
  advertiserName: string
  campaignTitle: string
  tagline?: string
  mediaUrl: string
  durationSeconds: number
  placement: AdPlacementType
  canSkip: boolean
  skipOffsetSeconds: number
  eligibleContentIds?: string[]
  startDateISO?: string
  endDateISO?: string
  callToActionText?: string
  sponsorUrl?: string
  accentColor?: string
}

export interface SponsorInfo {
  name: string
  tagline: string
  badgeText?: string
  logoUrl?: string
  sponsorUrl?: string
}

/**
 * Discovery & Filtering Models
 */
export type SortOption =
  | 'popular'
  | 'recent'
  | 'year-desc'
  | 'year-asc'
  | 'alpha'

export interface DiscoveryFilters {
  genre: string
  contentType: 'all' | 'movie' | 'series'
  language: string
  year: string
  quality: string
  rating: string
  sortBy: SortOption
}

/**
 * Viewing History & Personalisation Models
 */
export interface WatchedEpisodeState {
  progress: number
  completed: boolean
  lastWatched?: number
  currentTime?: number
  duration?: number
  seasonNumber?: number
  episodeNumber?: number
  episodeTitle?: string
  remainingMinutes?: number
}

export interface SeriesProgressSummary {
  totalEpisodes: number
  completedEpisodes: number
  inProgressEpisodes: number
  overallPercent: number
  seasonProgress: Record<
    number,
    { total: number; completed: number; inProgress: number; percent: number }
  >
  lastWatchedEpisode?: {
    episode: EpisodeMetadata
    seasonNumber: number
    progress: number
    completed: boolean
  }
  nextEpisodeToWatch?: {
    episode: EpisodeMetadata
    seasonNumber: number
    isResume?: boolean
    isNextSeason?: boolean
  }
  isFullyCompleted: boolean
}

export interface ViewingHistoryItem {
  contentId: string
  profileId: string
  lastWatched: number // epoch timestamp in ms
  progress: number // percentage 0 to 100
  currentTime?: number // seconds elapsed
  duration?: number // total seconds
  remainingMinutes?: number // remaining minutes
  completed: boolean
  episodeId?: string
  seasonNumber?: number
  episodeNumber?: number
  episodeTitle?: string
  watchedEpisodes?: Record<string, WatchedEpisodeState>
}

export interface UserPreferences {
  profileId: string
  preferredGenres: string[]
  preferredContentType?: 'all' | 'movie' | 'series'
}

/**
 * Content Card Model
 */
export interface ContentMetadata {
  id: string
  title: string
  subtitle?: string
  eyebrow?: string
  description?: string
  posterUrl?: string
  backdropUrl?: string
  badge?: string
  isLive?: boolean
  rating?: string
  duration?: string
  year?: number | string
  quality?: '4K HDR' | 'HD' | 'UHD' | 'Dolby Atmos'
  genres?: string[]
  progress?: number // 0 to 100 for continue watching
  type?: 'movie' | 'series' | 'live'
  cast?: string[]
  creators?: string[]
  director?: string
  maturityAdvisory?: string
  audioLanguages?: string[]
  seasons?: SeasonMetadata[]
  broadcastSchedule?: BroadcastSchedule
  bonusContent?: BonusFeaturette[]
  extendedEdition?: ExtendedEditionInfo
  hybridBroadcast?: HybridBroadcastInfo
  sponsor?: SponsorInfo
  relatedIds?: string[]
  trailerUrl?: string
  popularity?: number // numeric rank for sorting
  dateAdded?: string // ISO date or release timestamp
}

/**
 * Layout Types
 */
export type PageContainerVariant = 'default' | 'fluid' | 'narrow'

export interface PageContainerProps {
  children: ReactNode
  variant?: PageContainerVariant
  className?: string
  as?: 'div' | 'main' | 'section'
}
