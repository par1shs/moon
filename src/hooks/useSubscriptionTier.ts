import { useState, useEffect, useCallback, useMemo } from 'react'
import type {
  SubscriptionTier,
  SubscriptionPlanId,
  SubscriptionInfo,
  BillingFrequency,
} from '../types'
import { getPlanById } from '../data/subscriptionPlans'

const SUB_KEY_PREFIX = 'junction_subscription_v1_'
const LEGACY_TIER_PREFIX = 'junction_sub_tier_'
export const SUB_CHANGED_EVENT = 'junction_subscription_changed'

function computeRenewalDate(billingFrequency: BillingFrequency, fromDate = new Date()): string {
  const renewal = new Date(fromDate)
  if (billingFrequency === 'annual') {
    renewal.setFullYear(renewal.getFullYear() + 1)
  } else {
    renewal.setDate(renewal.getDate() + 30)
  }
  return renewal.toISOString()
}

export function createDefaultSubscription(
  planId: SubscriptionPlanId = 'free',
  billingFrequency: BillingFrequency = 'monthly'
): SubscriptionInfo {
  const plan = getPlanById(planId)
  const now = new Date().toISOString()
  return {
    planId,
    planName: plan.name,
    billingFrequency,
    status: 'active',
    startDateISO: now,
    renewalDateISO: computeRenewalDate(billingFrequency),
    cancelAtPeriodEnd: false,
    isTrial: false,
  }
}

/**
 * Loads subscription for a profile, safely migrating from legacy junction_sub_tier_
 */
export function loadAndMigrateSubscription(profileId: string): SubscriptionInfo {
  if (typeof window === 'undefined') {
    return createDefaultSubscription('free')
  }

  const effectiveId = profileId || 'default'
  const newStorageKey = `${SUB_KEY_PREFIX}${effectiveId}`
  const legacyStorageKey = `${LEGACY_TIER_PREFIX}${effectiveId}`

  try {
    // 1. Try reading the new subscription format
    const rawNew = localStorage.getItem(newStorageKey)
    if (rawNew) {
      const parsed = JSON.parse(rawNew) as SubscriptionInfo
      if (parsed && ['free', 'standard', 'premium'].includes(parsed.planId)) {
        return parsed
      }
    }

    // 2. Safely migrate from legacy key if present
    const rawLegacy = localStorage.getItem(legacyStorageKey)
    if (rawLegacy === 'premium') {
      const migrated = createDefaultSubscription('premium')
      localStorage.setItem(newStorageKey, JSON.stringify(migrated))
      return migrated
    }
    if (rawLegacy === 'standard') {
      const migrated = createDefaultSubscription('standard')
      localStorage.setItem(newStorageKey, JSON.stringify(migrated))
      return migrated
    }
    if (rawLegacy === 'free') {
      const migrated = createDefaultSubscription('free')
      localStorage.setItem(newStorageKey, JSON.stringify(migrated))
      return migrated
    }
  } catch (err) {
    console.warn('Failed to parse subscription from localStorage:', err)
  }

  // 3. Fallback to Free subscription
  const fallback = createDefaultSubscription('free')
  try {
    localStorage.setItem(newStorageKey, JSON.stringify(fallback))
  } catch {
    // Ignored
  }
  return fallback
}

export function useSubscriptionTier(profileId?: string) {
  const effectiveProfileId = profileId || 'default'
  const storageKey = `${SUB_KEY_PREFIX}${effectiveProfileId}`
  const legacyKey = `${LEGACY_TIER_PREFIX}${effectiveProfileId}`

  const getSavedSubscription = useCallback((): SubscriptionInfo => {
    return loadAndMigrateSubscription(effectiveProfileId)
  }, [effectiveProfileId])

  const [subscription, setSubscriptionState] = useState<SubscriptionInfo>(getSavedSubscription)
  const [prevKey, setPrevKey] = useState(storageKey)

  // Sync state if profile changes during render
  if (prevKey !== storageKey) {
    setPrevKey(storageKey)
    setSubscriptionState(getSavedSubscription())
  }

  // Cross-component and storage event synchronization
  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{
        profileId: string
        subscription: SubscriptionInfo
      }>
      if (!customEvent.detail || customEvent.detail.profileId === effectiveProfileId) {
        setSubscriptionState(getSavedSubscription())
      }
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey || e.key === legacyKey) {
        setSubscriptionState(getSavedSubscription())
      }
    }

    window.addEventListener(SUB_CHANGED_EVENT, handleSync)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener(SUB_CHANGED_EVENT, handleSync)
      window.removeEventListener('storage', handleStorage)
    }
  }, [storageKey, legacyKey, effectiveProfileId, getSavedSubscription])

  // Helper to persist and broadcast changes
  const persistSubscription = useCallback(
    (newSub: SubscriptionInfo) => {
      setSubscriptionState(newSub)
      try {
        localStorage.setItem(storageKey, JSON.stringify(newSub))
        // Maintain legacy key for backward compatibility
        localStorage.setItem(legacyKey, newSub.planId)
        window.dispatchEvent(
          new CustomEvent(SUB_CHANGED_EVENT, {
            detail: { profileId: effectiveProfileId, subscription: newSub },
          })
        )
      } catch (err) {
        console.error('Failed to save subscription to localStorage', err)
      }
    },
    [storageKey, legacyKey, effectiveProfileId]
  )

  // Plan modification action
  const setPlan = useCallback(
    (planId: SubscriptionPlanId, billingFrequency?: BillingFrequency) => {
      const plan = getPlanById(planId)
      const freq = billingFrequency || subscription.billingFrequency || 'monthly'
      const updated: SubscriptionInfo = {
        ...subscription,
        planId,
        planName: plan.name,
        billingFrequency: freq,
        status: 'active',
        cancelAtPeriodEnd: false,
        renewalDateISO: computeRenewalDate(freq),
      }
      persistSubscription(updated)
    },
    [subscription, persistSubscription]
  )

  // Legacy setTier for backward compatibility
  const setTier = useCallback(
    (newTier: SubscriptionTier) => {
      setPlan(newTier)
    },
    [setPlan]
  )

  // Quick toggle cycling Free -> Standard -> Premium -> Free
  const toggleTier = useCallback(() => {
    const cycle: Record<SubscriptionPlanId, SubscriptionPlanId> = {
      free: 'standard',
      standard: 'premium',
      premium: 'free',
    }
    const nextTier = cycle[subscription.planId] || 'free'
    setPlan(nextTier)
  }, [subscription.planId, setPlan])

  // Cancel subscription action
  const cancelSubscription = useCallback(() => {
    const updated: SubscriptionInfo = {
      ...subscription,
      cancelAtPeriodEnd: true,
      cancelledDateISO: new Date().toISOString(),
      status: 'cancelled',
    }
    persistSubscription(updated)
  }, [subscription, persistSubscription])

  // Reactivate cancelled subscription action
  const reactivateSubscription = useCallback(() => {
    const updated: SubscriptionInfo = {
      ...subscription,
      cancelAtPeriodEnd: false,
      status: 'active',
    }
    persistSubscription(updated)
  }, [subscription, persistSubscription])

  const plan = useMemo(() => getPlanById(subscription.planId), [subscription.planId])

  return {
    subscription,
    tier: subscription.planId,
    subscriptionTier: subscription.planId, // Backward compatibility
    plan,
    billingFrequency: subscription.billingFrequency,
    isFreeTier: subscription.planId === 'free',
    isStandardTier: subscription.planId === 'standard',
    isPremiumTier: subscription.planId === 'premium',
    isAdFree: subscription.planId !== 'free',
    canAccess4K: subscription.planId === 'premium',
    canAccess1080p: subscription.planId !== 'free',
    canAccessInteractive: subscription.planId === 'premium',
    canAccessBonus: subscription.planId !== 'free',
    canAccessFullCatalogue: subscription.planId !== 'free',
    setPlan,
    setTier,
    toggleTier,
    cancelSubscription,
    reactivateSubscription,
  }
}
