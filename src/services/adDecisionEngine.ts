import type {
  AdCampaign,
  AdDecisionContext,
  AdProfileFrequencyMap,
  AdFrequencyRecord,
} from '../types/advertising'
import type { SubscriptionPlanId, SponsorInfo } from '../types'
import type { EPGProgram, EPGChannel } from '../types/epg'
import { CENTRAL_CAMPAIGNS, FICTIONAL_SPONSORS } from '../data/campaigns'

const STORAGE_PREFIX = 'junction_ad_frequency_v1_'

/**
 * Retrieves the profile-specific ad frequency map from LocalStorage
 */
export function getProfileAdFrequency(profileId: string = 'default'): AdProfileFrequencyMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${profileId}`)
    return raw ? JSON.parse(raw) : {}
  } catch (err) {
    console.error('Failed to load ad frequency state:', err)
    return {}
  }
}

/**
 * Saves the profile-specific ad frequency map to LocalStorage
 */
export function saveProfileAdFrequency(
  profileId: string = 'default',
  map: AdProfileFrequencyMap
): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${profileId}`, JSON.stringify(map))
  } catch (err) {
    console.error('Failed to persist ad frequency state:', err)
  }
}

/**
 * Checks whether an ad campaign is strictly eligible for decisioning
 */
export function isCampaignEligible(
  campaign: AdCampaign,
  ctx: AdDecisionContext,
  frequencyMap: AdProfileFrequencyMap
): boolean {
  // 1. Active status check
  if (!campaign.isActive) return false

  // 2. Format check
  if (campaign.format !== ctx.format) return false

  // 3. Date window check
  const now = ctx.now || new Date()
  const start = new Date(campaign.startDateISO)
  const end = new Date(campaign.endDateISO)
  if (now < start || now > end) return false

  // 4. Subscription Tier Rules
  // Standard and Premium users receive ZERO conventional video ads (ad-free SVOD)
  if (ctx.format === 'pre-roll' || ctx.format === 'mid-roll') {
    if (ctx.tier !== 'free') return false
  }
  if (!campaign.targetTiers.includes(ctx.tier)) return false

  // 5. Eligible Content IDs
  if (
    campaign.eligibleContentIds &&
    campaign.eligibleContentIds.length > 0 &&
    ctx.contentId &&
    !campaign.eligibleContentIds.includes(ctx.contentId)
  ) {
    return false
  }

  // 6. Eligible Channels
  if (campaign.eligibleChannels && campaign.eligibleChannels.length > 0) {
    const channelMatch =
      (ctx.channelId && campaign.eligibleChannels.includes(ctx.channelId)) ||
      (ctx.channelNumber && campaign.eligibleChannels.includes(ctx.channelNumber))
    if (!channelMatch) return false
  }

  // 7. Eligible Categories (if specified and not 'All')
  if (
    campaign.eligibleCategories &&
    campaign.eligibleCategories.length > 0 &&
    !campaign.eligibleCategories.includes('All') &&
    ctx.category
  ) {
    const categoryMatches = campaign.eligibleCategories.some((cat) =>
      ctx.category?.toLowerCase().includes(cat.toLowerCase())
    )
    if (!categoryMatches) return false
  }

  // 8. Frequency Cap Rule
  const record = frequencyMap[campaign.id]
  if (record && record.impressionCount >= campaign.frequencyCap) {
    return false
  }

  return true
}

/**
 * Deterministic Ad Decisioning Engine
 * Rotates fairly across eligible campaigns by least impressions and oldest recency
 */
export function decideAd(ctx: AdDecisionContext): AdCampaign | null {
  // Standard and Premium never receive video ads
  if ((ctx.format === 'pre-roll' || ctx.format === 'mid-roll') && ctx.tier !== 'free') {
    return null
  }

  const frequencyMap = getProfileAdFrequency(ctx.profileId)

  // Filter all candidates
  const eligible = CENTRAL_CAMPAIGNS.filter((campaign) =>
    isCampaignEligible(campaign, ctx, frequencyMap)
  )

  if (eligible.length === 0) return null

  // Sort deterministically to prevent repeated ads in quick succession
  eligible.sort((a, b) => {
    const aRecord = frequencyMap[a.id]
    const bRecord = frequencyMap[b.id]

    const aImpressions = aRecord?.impressionCount || 0
    const bImpressions = bRecord?.impressionCount || 0

    // Priority 1: Pick campaign with fewer impressions
    if (aImpressions !== bImpressions) {
      return aImpressions - bImpressions
    }

    // Priority 2: Pick campaign shown longest ago (oldest lastImpressionISO)
    const aTime = aRecord?.lastImpressionISO ? new Date(aRecord.lastImpressionISO).getTime() : 0
    const bTime = bRecord?.lastImpressionISO ? new Date(bRecord.lastImpressionISO).getTime() : 0
    if (aTime !== bTime) {
      return aTime - bTime
    }

    // Priority 3: Predictable lexicographical tie-break
    return a.id.localeCompare(b.id)
  })

  return eligible[0] || null
}

/**
 * Records an ad impression in the profile's frequency log
 */
export function recordAdImpression(campaignId: string, profileId: string = 'default'): void {
  const map = getProfileAdFrequency(profileId)
  const existing: AdFrequencyRecord = map[campaignId] || {
    campaignId,
    impressionCount: 0,
    lastImpressionISO: '',
    completedCount: 0,
    clicksCount: 0,
  }

  map[campaignId] = {
    ...existing,
    impressionCount: existing.impressionCount + 1,
    lastImpressionISO: new Date().toISOString(),
  }

  saveProfileAdFrequency(profileId, map)
}

/**
 * Records an ad completion in the profile's frequency log
 */
export function recordAdCompletion(campaignId: string, profileId: string = 'default'): void {
  const map = getProfileAdFrequency(profileId)
  const existing: AdFrequencyRecord = map[campaignId] || {
    campaignId,
    impressionCount: 1,
    lastImpressionISO: new Date().toISOString(),
    completedCount: 0,
    clicksCount: 0,
  }

  map[campaignId] = {
    ...existing,
    completedCount: existing.completedCount + 1,
  }

  saveProfileAdFrequency(profileId, map)
}

/**
 * Records an ad CTA click in the profile's frequency log
 */
export function recordAdClick(campaignId: string, profileId: string = 'default'): void {
  const map = getProfileAdFrequency(profileId)
  const existing: AdFrequencyRecord = map[campaignId] || {
    campaignId,
    impressionCount: 1,
    lastImpressionISO: new Date().toISOString(),
    completedCount: 0,
    clicksCount: 0,
  }

  map[campaignId] = {
    ...existing,
    clicksCount: existing.clicksCount + 1,
  }

  saveProfileAdFrequency(profileId, map)
}

/**
 * Clears the profile's frequency history (for testing or debugging)
 */
export function clearProfileAdFrequency(profileId: string = 'default'): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${profileId}`)
  } catch (err) {
    console.error('Failed to clear ad frequency state:', err)
  }
}

/**
 * Resolves programme sponsorship for linear TV broadcasts
 * Paid subscribers still see restrained programme sponsorship branding
 */
export function resolveProgramSponsorship(
  program?: EPGProgram | null,
  channel?: EPGChannel | null,
  tier: SubscriptionPlanId = 'free'
): SponsorInfo | null {
  // 1. Direct program sponsor metadata
  if (program?.sponsor) return program.sponsor

  // 2. Direct channel sponsor metadata
  if (channel?.sponsor) return channel.sponsor

  // 3. Fallback to active programme sponsorship campaign
  const campaign = CENTRAL_CAMPAIGNS.find(
    (c) =>
      c.isActive &&
      c.format === 'programme-sponsorship' &&
      c.targetTiers.includes(tier) &&
      (!c.eligibleChannels ||
        (channel &&
          (c.eligibleChannels.includes(channel.id) ||
            c.eligibleChannels.includes(channel.channelNumber))))
  )

  if (campaign) {
    return {
      name: campaign.advertiserName,
      tagline: campaign.tagline || campaign.description,
      badgeText: campaign.sponsorBadgeText || `PRESENTED BY ${campaign.advertiserName.toUpperCase()}`,
      logoUrl: campaign.sponsorLogoUrl || campaign.mediaUrl,
      sponsorUrl: campaign.ctaDestination,
    }
  }

  // 4. Default fictional sponsor for flagship sports/news channels
  if (channel?.channelNumber === '102') return FICTIONAL_SPONSORS.veloce
  if (channel?.channelNumber === '101') return FICTIONAL_SPONSORS.apex

  return null
}
