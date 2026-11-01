import { useState, useEffect, useCallback } from 'react'

const SEARCH_HISTORY_PREFIX = 'junction_search_history_v1_'
const SEARCH_HISTORY_EVENT = 'junction_search_history_changed'

const DEFAULT_SEEDS: Record<string, string[]> = {
  'profile-aarav': ['Chronos', 'Velocity Night', 'Sci-Fi'],
  'profile-mira': ['Parisian Hours', 'Drama', 'Love Across Wavelengths'],
  'profile-kabir': ['Tokyo Protocol', 'Cyber Vanguard', 'Action'],
  'profile-kids': ['Starlight Kingdom', 'Animals'],
}

export function useSearchHistory(profileId: string) {
  const storageKey = `${SEARCH_HISTORY_PREFIX}${profileId}`

  const getSavedHistory = useCallback((): string[] => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) return parsed
      }
      const seed = DEFAULT_SEEDS[profileId] || []
      localStorage.setItem(storageKey, JSON.stringify(seed))
      return seed
    } catch {
      return DEFAULT_SEEDS[profileId] || []
    }
  }, [storageKey, profileId])

  const [recentSearches, setRecentSearches] = useState<string[]>(getSavedHistory)
  const [prevKey, setPrevKey] = useState(storageKey)

  if (prevKey !== storageKey) {
    setPrevKey(storageKey)
    setRecentSearches(getSavedHistory())
  }

  // Cross-component and cross-tab sync
  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ profileId: string }>
      if (!customEvent.detail || customEvent.detail.profileId === profileId) {
        setRecentSearches(getSavedHistory())
      }
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey) {
        setRecentSearches(getSavedHistory())
      }
    }

    window.addEventListener(SEARCH_HISTORY_EVENT, handleSync)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener(SEARCH_HISTORY_EVENT, handleSync)
      window.removeEventListener('storage', handleStorage)
    }
  }, [storageKey, profileId, getSavedHistory])

  const saveHistory = useCallback(
    (newSearches: string[]) => {
      setRecentSearches(newSearches)
      try {
        localStorage.setItem(storageKey, JSON.stringify(newSearches))
        window.dispatchEvent(
          new CustomEvent(SEARCH_HISTORY_EVENT, { detail: { profileId } })
        )
      } catch (err) {
        console.error('Failed to save search history', err)
      }
    },
    [storageKey, profileId]
  )

  const addSearch = useCallback(
    (term: string) => {
      const trimmed = term.trim()
      if (!trimmed || trimmed.length < 2) return

      // Deduplicate case-insensitively and keep top 8
      const filtered = recentSearches.filter(
        (t) => t.toLowerCase() !== trimmed.toLowerCase()
      )
      saveHistory([trimmed, ...filtered].slice(0, 8))
    },
    [recentSearches, saveHistory]
  )

  const removeSearch = useCallback(
    (term: string) => {
      saveHistory(recentSearches.filter((t) => t !== term))
    },
    [recentSearches, saveHistory]
  )

  const clearSearches = useCallback(() => {
    saveHistory([])
  }, [saveHistory])

  return {
    recentSearches,
    addSearch,
    removeSearch,
    clearSearches,
  }
}
