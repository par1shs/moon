import { useState, useCallback, useMemo } from 'react'
import type { SubscriptionPlanId } from '../types'
import type {
  AdCampaign,
  AdDecisionContext,
  AdProfileFrequencyMap,
} from '../types/advertising'
import {
  decideAd,
  getProfileAdFrequency,
  recordAdImpression,
  recordAdCompletion,
  recordAdClick,
  clearProfileAdFrequency,
  resolveProgramSponsorship,
} from '../services/adDecisionEngine'
import { CENTRAL_CAMPAIGNS } from '../data/campaigns'

export function useAdDecisionEngine(profileId: string = 'default', tier: SubscriptionPlanId = 'free') {
  const [prevProfileId, setPrevProfileId] = useState(profileId)
  const [frequencyMap, setFrequencyMap] = useState<AdProfileFrequencyMap>(() =>
    getProfileAdFrequency(profileId)
  )

  if (prevProfileId !== profileId) {
    setPrevProfileId(profileId)
    setFrequencyMap(getProfileAdFrequency(profileId))
  }

  const refreshFrequency = useCallback(() => {
    setFrequencyMap(getProfileAdFrequency(profileId))
  }, [profileId])

  const requestAd = useCallback(
    (params: Omit<AdDecisionContext, 'tier' | 'profileId'>): AdCampaign | null => {
      const decision = decideAd({
        ...params,
        tier,
        profileId,
      })
      return decision
    },
    [tier, profileId]
  )

  const logImpression = useCallback(
    (campaignId: string) => {
      recordAdImpression(campaignId, profileId)
      refreshFrequency()
    },
    [profileId, refreshFrequency]
  )

  const logCompletion = useCallback(
    (campaignId: string) => {
      recordAdCompletion(campaignId, profileId)
      refreshFrequency()
    },
    [profileId, refreshFrequency]
  )

  const logClick = useCallback(
    (campaignId: string) => {
      recordAdClick(campaignId, profileId)
      refreshFrequency()
    },
    [profileId, refreshFrequency]
  )

  const resetFrequency = useCallback(() => {
    clearProfileAdFrequency(profileId)
    setFrequencyMap({})
  }, [profileId])

  // Aggregate metrics calculation for Insights
  const aggregateMetrics = useMemo(() => {
    const totalCampaigns = CENTRAL_CAMPAIGNS.length
    const activeCampaigns = CENTRAL_CAMPAIGNS.filter((c) => c.isActive).length

    // Simulated base + live local profile impressions
    let localTotalImpressions = 0
    let localTotalCompletions = 0
    let localTotalClicks = 0

    Object.values(frequencyMap).forEach((rec) => {
      localTotalImpressions += rec.impressionCount
      localTotalCompletions += rec.completedCount
      localTotalClicks += rec.clicksCount
    })

    const baseImpressions = CENTRAL_CAMPAIGNS.reduce(
      (sum, c) => sum + (c.simulatedMetrics?.impressions || 0),
      0
    )
    const baseCompletions = CENTRAL_CAMPAIGNS.reduce(
      (sum, c) => sum + (c.simulatedMetrics?.completedViews || 0),
      0
    )
    const baseClicks = CENTRAL_CAMPAIGNS.reduce(
      (sum, c) => sum + (c.simulatedMetrics?.clicks || 0),
      0
    )
    const baseSpend = CENTRAL_CAMPAIGNS.reduce(
      (sum, c) => sum + (c.simulatedMetrics?.spendINR || 0),
      0
    )

    const totalImpressions = baseImpressions + localTotalImpressions
    const totalCompletions = baseCompletions + localTotalCompletions
    const totalClicks = baseClicks + localTotalClicks
    const completionRate =
      totalImpressions > 0 ? ((totalCompletions / totalImpressions) * 100).toFixed(1) : '0.0'

    return {
      totalCampaigns,
      activeCampaigns,
      totalImpressions,
      totalCompletions,
      totalClicks,
      totalSpendINR: baseSpend,
      completionRate: `${completionRate}%`,
      localTotalImpressions,
      localTotalCompletions,
      localTotalClicks,
    }
  }, [frequencyMap])

  return {
    frequencyMap,
    requestAd,
    logImpression,
    logCompletion,
    logClick,
    resetFrequency,
    resolveProgramSponsorship,
    aggregateMetrics,
    campaigns: CENTRAL_CAMPAIGNS,
  }
}
