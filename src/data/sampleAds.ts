import type { Advertisement, SponsorInfo, SubscriptionTier, ContentMetadata } from '../types'
import { FICTIONAL_SPONSORS, CENTRAL_CAMPAIGNS } from './campaigns'
import { decideAd } from '../services/adDecisionEngine'

/**
 * Fictional Brand Sponsors for JUNCTION+ / PIXEL
 */
export const SAMPLE_SPONSORS: Record<string, SponsorInfo> = FICTIONAL_SPONSORS

/**
 * Centralised AVOD Advertisement Campaigns
 */
export const SAMPLE_ADVERTISEMENTS: Advertisement[] = CENTRAL_CAMPAIGNS.map((c) => ({
  id: c.id,
  advertiserName: c.advertiserName,
  campaignTitle: c.campaignName,
  tagline: c.tagline,
  mediaUrl: c.mediaUrl,
  durationSeconds: c.durationSeconds || 15,
  placement:
    c.format === 'pre-roll'
      ? 'pre-roll'
      : c.format === 'mid-roll'
        ? 'mid-roll'
        : 'sponsored',
  canSkip: c.canSkip ?? true,
  skipOffsetSeconds: c.skipOffsetSeconds || 5,
  eligibleContentIds: c.eligibleContentIds,
  startDateISO: c.startDateISO,
  endDateISO: c.endDateISO,
  callToActionText: c.ctaLabel,
  sponsorUrl: c.ctaDestination,
  accentColor: c.accentColor || '#38BDF8',
}))

/**
 * Resolver for Pre-Roll Advertisement
 * Returns null if user is on Standard or Premium tier (ad-free SVOD)
 * Utilises the deterministic Ad Decision Engine with frequency tracking
 */
export function getPreRollAd(
  contentId?: string,
  tier: SubscriptionTier = 'free',
  profileId: string = 'default'
): Advertisement | null {
  if (tier !== 'free') return null

  const decision = decideAd({
    format: 'pre-roll',
    tier,
    profileId,
    contentId,
  })

  if (!decision) return null

  return {
    id: decision.id,
    advertiserName: decision.advertiserName,
    campaignTitle: decision.campaignName,
    tagline: decision.tagline,
    mediaUrl: decision.mediaUrl,
    durationSeconds: decision.durationSeconds || 15,
    placement: 'pre-roll',
    canSkip: decision.canSkip ?? true,
    skipOffsetSeconds: decision.skipOffsetSeconds || 5,
    eligibleContentIds: decision.eligibleContentIds,
    startDateISO: decision.startDateISO,
    endDateISO: decision.endDateISO,
    callToActionText: decision.ctaLabel,
    sponsorUrl: decision.ctaDestination,
    accentColor: decision.accentColor || '#38BDF8',
  }
}

/**
 * Resolver for Mid-Roll Advertisement
 * Returns null if user is on Standard or Premium tier (ad-free SVOD)
 * Utilises the deterministic Ad Decision Engine with frequency tracking
 */
export function getMidRollAd(
  contentId?: string,
  tier: SubscriptionTier = 'free',
  profileId: string = 'default'
): Advertisement | null {
  if (tier !== 'free') return null

  const decision = decideAd({
    format: 'mid-roll',
    tier,
    profileId,
    contentId,
  })

  if (!decision) return null

  return {
    id: decision.id,
    advertiserName: decision.advertiserName,
    campaignTitle: decision.campaignName,
    tagline: decision.tagline,
    mediaUrl: decision.mediaUrl,
    durationSeconds: decision.durationSeconds || 15,
    placement: 'mid-roll',
    canSkip: decision.canSkip ?? true,
    skipOffsetSeconds: decision.skipOffsetSeconds || 5,
    eligibleContentIds: decision.eligibleContentIds,
    startDateISO: decision.startDateISO,
    endDateISO: decision.endDateISO,
    callToActionText: decision.ctaLabel,
    sponsorUrl: decision.ctaDestination,
    accentColor: decision.accentColor || '#8B5CF6',
  }
}

/**
 * Checks if on-demand content is eligible for AVOD ad insertions
 * Free plan: ad-supported
 * Standard & Premium plans: 100% ad-free
 */
export function isContentEligibleForAds(
  content: ContentMetadata | null,
  tier: SubscriptionTier
): boolean {
  if (tier !== 'free' || !content) return false
  return content.type === 'movie' || content.type === 'series'
}
