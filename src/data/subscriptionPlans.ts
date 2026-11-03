import type {
  SubscriptionPlan,
  SubscriptionPlanId,
  PlanFeatureComparisonRow,
} from '../types'

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    tagline: 'Essential TV and advertising-supported streaming.',
    monthlyPrice: 0,
    annualPrice: 0,
    currency: '₹',
    badgeText: 'FREE TIER',
    highlightColor: '#94A3B8',
    adSupported: true,
    maxVideoQuality: '720p HD',
    audioQuality: 'Stereo',
    catalogueAccess: 'Selected Titles',
    bonusContentAccess: false,
    interactiveAccess: false,
    priorityCatchUp: false,
    screensSimultaneous: 1,
    features: [
      'Selected Live TV broadcast channels',
      'Standard video quality (720p HD)',
      'Advertising-supported playback',
      'Eligible catch-up broadcasts (7 days)',
      'Stream on 1 screen at a time',
    ],
  },
  standard: {
    id: 'standard',
    name: 'Standard',
    tagline: 'Full HD on-demand streaming with zero advertisements.',
    monthlyPrice: 149,
    annualPrice: 1490, // Save ₹298 (~₹124/mo)
    currency: '₹',
    badgeText: 'MOST POPULAR',
    highlightColor: '#38BDF8',
    adSupported: false,
    maxVideoQuality: '1080p Full HD',
    audioQuality: '5.1 Surround',
    catalogueAccess: 'Full Catalogue',
    bonusContentAccess: true,
    interactiveAccess: false,
    priorityCatchUp: false,
    screensSimultaneous: 2,
    features: [
      'Everything in Free',
      '100% ad-free on-demand streaming',
      '1080p Full HD streaming quality',
      '5.1 Surround Sound audio',
      'Full on-demand catalogue & extended cuts',
      'Behind-the-scenes bonus featurettes',
      'All catch-up TV broadcasts included',
      'Stream on 2 screens simultaneously',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    tagline: 'Cinematic 4K HDR, Dolby Atmos and interactive television.',
    monthlyPrice: 249,
    annualPrice: 2490, // Save ₹498 (~₹207/mo)
    currency: '₹',
    badgeText: 'ULTIMATE EXPERIENCE',
    highlightColor: '#F59E0B',
    adSupported: false,
    maxVideoQuality: '4K HDR',
    audioQuality: 'Dolby Atmos 5.1',
    catalogueAccess: 'Full Catalogue + Exclusives',
    bonusContentAccess: true,
    interactiveAccess: true,
    priorityCatchUp: true,
    screensSimultaneous: 4,
    features: [
      'Everything in Standard',
      'Ultra-crisp 4K HDR Master quality',
      'Immersive Dolby Atmos spatial acoustics',
      'Interactive TV: Live Polls, Voting & Quizzes',
      'Exclusive featurettes & director commentary',
      'Priority extended 14-day catch-up window',
      'Stream on 4 screens simultaneously',
    ],
  },
}

export const SUBSCRIPTION_PLAN_LIST: SubscriptionPlan[] = [
  SUBSCRIPTION_PLANS.free,
  SUBSCRIPTION_PLANS.standard,
  SUBSCRIPTION_PLANS.premium,
]

export function getPlanById(id?: string): SubscriptionPlan {
  if (id === 'standard') return SUBSCRIPTION_PLANS.standard
  if (id === 'premium') return SUBSCRIPTION_PLANS.premium
  return SUBSCRIPTION_PLANS.free
}

export function calculateAnnualSavings(plan: SubscriptionPlan): {
  savingsAmount: number
  monthlyEquivalent: number
  percentDiscount: number
} {
  if (plan.monthlyPrice === 0) {
    return { savingsAmount: 0, monthlyEquivalent: 0, percentDiscount: 0 }
  }
  const fullAnnualCost = plan.monthlyPrice * 12
  const savingsAmount = fullAnnualCost - plan.annualPrice
  const monthlyEquivalent = Math.round(plan.annualPrice / 12)
  const percentDiscount = Math.round((savingsAmount / fullAnnualCost) * 100)
  return { savingsAmount, monthlyEquivalent, percentDiscount }
}

export const PLAN_COMPARISON_MATRIX: PlanFeatureComparisonRow[] = [
  {
    category: 'Pricing & Billing',
    feature: 'Monthly Price',
    free: '₹0 / month',
    standard: '₹149 / month',
    premium: '₹249 / month',
  },
  {
    category: 'Pricing & Billing',
    feature: 'Annual Price (Save ~17%)',
    free: '₹0 / year',
    standard: '₹1,490 / year (₹124/mo)',
    premium: '₹2,490 / year (₹207/mo)',
  },
  {
    category: 'Viewing Experience',
    feature: 'Advertising',
    free: 'Ad-Supported (Pre-roll & Mid-roll)',
    standard: 'Ad-Free Playback',
    premium: 'Ad-Free Playback',
  },
  {
    category: 'Viewing Experience',
    feature: 'Maximum Video Quality',
    free: '720p HD',
    standard: '1080p Full HD',
    premium: '4K HDR Master',
  },
  {
    category: 'Viewing Experience',
    feature: 'Audio Quality',
    free: 'Stereo 2.0',
    standard: '5.1 Spatial Surround',
    premium: 'Dolby Atmos 5.1',
  },
  {
    category: 'Content Entitlements',
    feature: 'Live TV Channels',
    free: 'Selected Channels',
    standard: 'All 6 Broadcast Channels',
    premium: 'All 6 Channels + VIP Feeds',
  },
  {
    category: 'Content Entitlements',
    feature: 'On-Demand Catalogue',
    free: 'Limited Catalogue',
    standard: 'Full Catalogue',
    premium: 'Full Catalogue + Exclusives',
  },
  {
    category: 'Content Entitlements',
    feature: 'Bonus & Extended Editions',
    free: false,
    standard: true,
    premium: true,
  },
  {
    category: 'Interactive Features',
    feature: 'Live Polls, Voting & Quizzes',
    free: false,
    standard: false,
    premium: true,
    tooltip: 'Interactive Television featurettes require a Premium membership.',
  },
  {
    category: 'Catch-up TV',
    feature: 'Catch-up Availability Window',
    free: '7 Days',
    standard: '7 Days',
    premium: 'Priority 14 Days',
  },
  {
    category: 'Devices',
    feature: 'Simultaneous Screens',
    free: '1 Screen',
    standard: '2 Screens',
    premium: '4 Screens',
  },
]

export interface SubscriptionFAQ {
  question: string
  answer: string
}

export const SUBSCRIPTION_FAQS: SubscriptionFAQ[] = [
  {
    question: 'How does billing work on PIXEL+ in this prototype?',
    answer:
      'All membership plans and billing operations on PIXEL+ are simulated entirely on the frontend for this interactive prototype. No real payment methods, credit cards, or actual charges are ever requested or processed.',
  },
  {
    question: 'Can I upgrade or downgrade between Free, Standard, and Premium at any time?',
    answer:
      'Yes! You can switch between any plan instantly on the Membership page or profile settings. Plan upgrades unlock immediate access to ad-free viewing, higher resolutions, and interactive television. Downgrades take effect immediately for the active profile.',
  },
  {
    question: 'What are the savings with Annual Billing?',
    answer:
      'Annual billing provides 2 months free (saving approximately 17%). Standard is ₹1,490/year (equivalent to ₹124/month), and Premium is ₹2,490/year (equivalent to ₹207/month).',
  },
  {
    question: 'Are subscription plans tied to specific user profiles?',
    answer:
      'Yes, each profile on PIXEL+ maintains its own independent subscription plan stored locally in your browser. This enables you to simulate multiple membership tiers across different family members and test various viewing permissions.',
  },
  {
    question: 'What happens if I cancel my subscription?',
    answer:
      'If you cancel your paid subscription, your plan status marks as Cancelled with active benefits preserved until the end of the current billing cycle, after which it safely transitions back to Free tier.',
  },
  {
    question: 'What devices support 4K HDR and Dolby Atmos on Premium?',
    answer:
      '4K HDR and Dolby Atmos are available on compatible Smart TVs, 4K desktop displays, and mobile devices equipped with HDR10/Dolby Vision hardware decoders. Our video stream engine automatically adapts bitrate for seamless playback.',
  },
]
