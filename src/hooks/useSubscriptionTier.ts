import { useState, useEffect, useCallback } from 'react'
import type { SubscriptionTier } from '../types'

const SUB_TIER_PREFIX = 'junction_sub_tier_'
const SUB_TIER_EVENT = 'junction_subscription_changed'

export function useSubscriptionTier(profileId?: string) {
  const effectiveProfileId = profileId || 'default'
  const storageKey = `${SUB_TIER_PREFIX}${effectiveProfileId}`

  const getSavedTier = useCallback((): SubscriptionTier => {
    if (typeof window === 'undefined') return 'free'
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored === 'free' || stored === 'premium') {
        return stored
      }
    } catch {
      // Ignored
    }
    return 'free'
  }, [storageKey])

  const [tier, setTierState] = useState<SubscriptionTier>(getSavedTier)
  const [prevKey, setPrevKey] = useState(storageKey)

  // Sync state if profile changes during render
  if (prevKey !== storageKey) {
    setPrevKey(storageKey)
    setTierState(getSavedTier())
  }

  // Cross-component and storage event synchronization
  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ profileId: string; tier: SubscriptionTier }>
      if (!customEvent.detail || customEvent.detail.profileId === effectiveProfileId) {
        setTierState(getSavedTier())
      }
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey) {
        setTierState(getSavedTier())
      }
    }

    window.addEventListener(SUB_TIER_EVENT, handleSync)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener(SUB_TIER_EVENT, handleSync)
      window.removeEventListener('storage', handleStorage)
    }
  }, [storageKey, effectiveProfileId, getSavedTier])

  const setTier = useCallback(
    (newTier: SubscriptionTier) => {
      setTierState(newTier)
      try {
        localStorage.setItem(storageKey, newTier)
        window.dispatchEvent(
          new CustomEvent(SUB_TIER_EVENT, {
            detail: { profileId: effectiveProfileId, tier: newTier },
          })
        )
      } catch (err) {
        console.error('Failed to save subscription tier to localStorage', err)
      }
    },
    [storageKey, effectiveProfileId]
  )

  const toggleTier = useCallback(() => {
    setTier(tier === 'free' ? 'premium' : 'free')
  }, [tier, setTier])

  return {
    tier,
    subscriptionTier: tier,
    isFreeTier: tier === 'free',
    isPremiumTier: tier === 'premium',
    setTier,
    toggleTier,
  }
}
