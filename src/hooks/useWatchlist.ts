import { useState, useEffect, useCallback } from 'react'

const WATCHLIST_STORAGE_PREFIX = 'junction_watchlist_v1_'
const WATCHLIST_EVENT = 'junction_watchlist_changed'

const DEFAULT_SEEDS: Record<string, string[]> = {
  default: ['port-1', 'mov-2', 'ser-2'],
  kids: ['port-4', 'ch-106'],
}

export function useWatchlist(profileId: string, isKids: boolean = false) {
  const storageKey = `${WATCHLIST_STORAGE_PREFIX}${profileId}`

  const getSavedWatchlist = useCallback((): string[] => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) return parsed
      }
      // Initial seed
      const seed = isKids ? DEFAULT_SEEDS.kids : DEFAULT_SEEDS.default
      localStorage.setItem(storageKey, JSON.stringify(seed))
      return seed
    } catch {
      return isKids ? DEFAULT_SEEDS.kids : DEFAULT_SEEDS.default
    }
  }, [storageKey, isKids])

  const [watchlistIds, setWatchlistIds] = useState<string[]>(getSavedWatchlist)
  const [prevKey, setPrevKey] = useState(storageKey)

  // Sync state if storageKey changed during render
  if (prevKey !== storageKey) {
    setPrevKey(storageKey)
    setWatchlistIds(getSavedWatchlist())
  }

  // Cross-component and cross-tab synchronizer
  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ profileId: string }>
      if (!customEvent.detail || customEvent.detail.profileId === profileId) {
        setWatchlistIds(getSavedWatchlist())
      }
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey) {
        setWatchlistIds(getSavedWatchlist())
      }
    }

    window.addEventListener(WATCHLIST_EVENT, handleSync)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener(WATCHLIST_EVENT, handleSync)
      window.removeEventListener('storage', handleStorage)
    }
  }, [storageKey, profileId, getSavedWatchlist])

  const saveWatchlist = useCallback(
    (newIds: string[]) => {
      setWatchlistIds(newIds)
      try {
        localStorage.setItem(storageKey, JSON.stringify(newIds))
        window.dispatchEvent(
          new CustomEvent(WATCHLIST_EVENT, { detail: { profileId } })
        )
      } catch (err) {
        console.error('Failed to save watchlist to localStorage', err)
      }
    },
    [storageKey, profileId]
  )

  const isInWatchlist = useCallback(
    (id: string) => watchlistIds.includes(id),
    [watchlistIds]
  )

  const toggleWatchlist = useCallback(
    (id: string) => {
      saveWatchlist(
        watchlistIds.includes(id)
          ? watchlistIds.filter((item) => item !== id)
          : [...watchlistIds, id]
      )
    },
    [watchlistIds, saveWatchlist]
  )

  const addToWatchlist = useCallback(
    (id: string) => {
      if (!watchlistIds.includes(id)) {
        saveWatchlist([...watchlistIds, id])
      }
    },
    [watchlistIds, saveWatchlist]
  )

  const removeFromWatchlist = useCallback(
    (id: string) => {
      if (watchlistIds.includes(id)) {
        saveWatchlist(watchlistIds.filter((item) => item !== id))
      }
    },
    [watchlistIds, saveWatchlist]
  )

  return {
    watchlistIds,
    isInWatchlist,
    toggleWatchlist,
    addToWatchlist,
    removeFromWatchlist,
  }
}
