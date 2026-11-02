import type { Advertisement, SponsorInfo, SubscriptionTier, ContentMetadata } from '../types'

/**
 * Fictional Brand Sponsors for PIXEL+
 */
export const SAMPLE_SPONSORS: Record<string, SponsorInfo> = {
  apex: {
    name: 'Apex Quantum Dynamics',
    tagline: 'Processing tomorrow at light speed.',
    badgeText: 'SPONSORED BY APEX QUANTUM',
    logoUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=400&auto=format&fit=crop',
    sponsorUrl: 'https://apex-quantum.fictional',
  },
  veloce: {
    name: 'Veloce Motors',
    tagline: 'Precision aerodynamics meets 1,200 pure electric horsepower.',
    badgeText: 'PRESENTED BY VELOCE MOTORS',
    logoUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=400&auto=format&fit=crop',
    sponsorUrl: 'https://veloce-motors.fictional',
  },
  nordic: {
    name: 'Nordic Pure Energy',
    tagline: 'Perpetual baseload energy for planetary infrastructure.',
    badgeText: 'POWERED BY NORDIC PURE',
    logoUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=400&auto=format&fit=crop',
    sponsorUrl: 'https://nordic-pure.fictional',
  },
  omnisynth: {
    name: 'OmniSynth Audio Labs',
    tagline: '64-channel holographic spatial acoustics in pocket form.',
    badgeText: 'SPONSORED BY OMNISYNTH',
    logoUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop',
    sponsorUrl: 'https://omnisynth-audio.fictional',
  },
  krypton: {
    name: 'Krypton Chrono',
    tagline: 'Atomic titanium tourbillons engineered for orbital environments.',
    badgeText: 'OFFICIAL TIMEKEEPER: KRYPTON',
    logoUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=400&auto=format&fit=crop',
    sponsorUrl: 'https://krypton-chrono.fictional',
  },
}

/**
 * Centralised AVOD Advertisement Campaigns (Fictional Brands)
 */
export const SAMPLE_ADVERTISEMENTS: Advertisement[] = [
  {
    id: 'ad-apex-preroll',
    advertiserName: 'Apex Quantum Dynamics',
    campaignTitle: 'Next-Generation Neural Supercomputing',
    tagline: 'Scalable cryogenic cloud clusters for machine intelligence.',
    mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop',
    durationSeconds: 15,
    placement: 'pre-roll',
    canSkip: true,
    skipOffsetSeconds: 5,
    callToActionText: 'Discover Quantum Cloud',
    sponsorUrl: 'https://apex-quantum.fictional/neural',
    accentColor: '#38BDF8',
    startDateISO: '2026-01-01T00:00:00Z',
    endDateISO: '2026-12-31T23:59:59Z',
  },
  {
    id: 'ad-veloce-preroll',
    advertiserName: 'Veloce Motors',
    campaignTitle: 'Aero-GT: Zero-Emission Hypercar',
    tagline: 'Accelerate 0-100 km/h in 1.8 seconds with active ground-effect downforce.',
    mediaUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop',
    durationSeconds: 15,
    placement: 'pre-roll',
    canSkip: true,
    skipOffsetSeconds: 5,
    callToActionText: 'Configure Your Aero-GT',
    sponsorUrl: 'https://veloce-motors.fictional/aero-gt',
    accentColor: '#F59E0B',
    startDateISO: '2026-01-01T00:00:00Z',
    endDateISO: '2026-12-31T23:59:59Z',
  },
  {
    id: 'ad-nordic-midroll',
    advertiserName: 'Nordic Pure Energy',
    campaignTitle: 'Glacial Geothermal Grids',
    tagline: 'Zero-carbon sub-surface thermodynamic electricity generation.',
    mediaUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop',
    durationSeconds: 15,
    placement: 'mid-roll',
    canSkip: true,
    skipOffsetSeconds: 5,
    callToActionText: 'Explore Sustainable Grids',
    sponsorUrl: 'https://nordic-pure.fictional/geothermal',
    accentColor: '#10B981',
    startDateISO: '2026-01-01T00:00:00Z',
    endDateISO: '2026-12-31T23:59:59Z',
  },
  {
    id: 'ad-omni-midroll',
    advertiserName: 'OmniSynth Audio Labs',
    campaignTitle: 'Holographic Transducer Array',
    tagline: 'Binaural field acoustic reconstruction calibrated for cinema enthusiasts.',
    mediaUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop',
    durationSeconds: 15,
    placement: 'mid-roll',
    canSkip: true,
    skipOffsetSeconds: 5,
    callToActionText: 'Hear The Future',
    sponsorUrl: 'https://omnisynth-audio.fictional/spatial',
    accentColor: '#8B5CF6',
    startDateISO: '2026-01-01T00:00:00Z',
    endDateISO: '2026-12-31T23:59:59Z',
  },
  {
    id: 'ad-krypton-sponsored',
    advertiserName: 'Krypton Chrono',
    campaignTitle: 'Orbital Tourbillon Caliber-9',
    tagline: 'Certified chronometric resilience for extra-vehicular astronautics.',
    mediaUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=1200&auto=format&fit=crop',
    durationSeconds: 10,
    placement: 'sponsored',
    canSkip: true,
    skipOffsetSeconds: 3,
    callToActionText: 'View Horology Gallery',
    sponsorUrl: 'https://krypton-chrono.fictional/caliber9',
    accentColor: '#EC4899',
    startDateISO: '2026-01-01T00:00:00Z',
    endDateISO: '2026-12-31T23:59:59Z',
  },
]

/**
 * Resolver for Pre-Roll Advertisement
 * Returns null if user is on Premium tier or if content is exempt
 */
export function getPreRollAd(
  contentId?: string,
  tier: SubscriptionTier = 'free'
): Advertisement | null {
  if (tier === 'premium') return null

  const preRolls = SAMPLE_ADVERTISEMENTS.filter((ad) => ad.placement === 'pre-roll')
  if (preRolls.length === 0) return null

  // Deterministically select based on contentId hash or default to first
  if (!contentId) return preRolls[0]
  const charSum = contentId.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  return preRolls[charSum % preRolls.length]
}

/**
 * Resolver for Mid-Roll Advertisement
 * Returns null if user is on Premium tier
 */
export function getMidRollAd(
  contentId?: string,
  tier: SubscriptionTier = 'free'
): Advertisement | null {
  if (tier === 'premium') return null

  const midRolls = SAMPLE_ADVERTISEMENTS.filter((ad) => ad.placement === 'mid-roll')
  if (midRolls.length === 0) return null

  if (!contentId) return midRolls[0]
  const charSum = contentId.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  return midRolls[charSum % midRolls.length]
}

/**
 * Checks if on-demand content is eligible for AVOD ad insertions
 */
export function isContentEligibleForAds(
  content: ContentMetadata | null,
  tier: SubscriptionTier
): boolean {
  if (tier === 'premium' || !content) return false
  // Live broadcast channels stream their own broadcast breaks; on-demand movies & series get AVOD ads
  return content.type === 'movie' || content.type === 'series'
}
