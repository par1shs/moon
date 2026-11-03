import type { SubscriptionPlanId } from './index'

export type AdFormat =
  | 'pre-roll'
  | 'mid-roll'
  | 'sponsored-card'
  | 'programme-sponsorship'
  | 'banner'

export interface CampaignMetrics {
  impressions: number
  completedViews: number
  clicks: number
  spendINR: number
}

export interface AdCampaign {
  id: string
  advertiserName: string
  campaignName: string
  campaignTitle?: string // Compatibility alias
  description: string
  format: AdFormat
  startDateISO: string
  endDateISO: string
  eligibleCategories?: string[]
  eligibleChannels?: string[]
  eligibleContentIds?: string[]
  targetTiers: SubscriptionPlanId[]
  frequencyCap: number
  frequencyCooldownMinutes?: number
  ctaLabel: string
  ctaDestination: string
  isActive: boolean
  tagline?: string
  mediaUrl: string
  accentColor?: string
  durationSeconds?: number
  canSkip?: boolean
  skipOffsetSeconds?: number
  sponsorBadgeText?: string
  sponsorLogoUrl?: string
  simulatedMetrics: CampaignMetrics
}

export interface AdFrequencyRecord {
  campaignId: string
  impressionCount: number
  lastImpressionISO: string
  completedCount: number
  clicksCount: number
}

export type AdProfileFrequencyMap = Record<string, AdFrequencyRecord>

export interface AdDecisionContext {
  format: AdFormat
  tier: SubscriptionPlanId
  profileId: string
  contentId?: string
  category?: string
  channelId?: string
  channelNumber?: string
  now?: Date
}
