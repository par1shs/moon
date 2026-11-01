import { useState, useEffect, useCallback } from 'react'
import type { UserPreferences } from '../types'

const PREFERENCES_STORAGE_PREFIX = 'junction_preferences_v1_'
const PREFERENCES_EVENT = 'junction_preferences_changed'

const DEFAULT_PROFILE_PREFERENCES: Record<string, string[]> = {
  'profile-aarav': ['Sci-Fi', 'Crime & Thriller', 'Action'],
  'profile-mira': ['Drama', 'Romance', 'Mystery'],
  'profile-kabir': ['Action', 'Sci-Fi', 'Documentary'],
  'profile-kids': ['Family & Kids', 'Comedy'],
}

const FALLBACK_GENRES = ['Drama', 'Sci-Fi']

export function useUserPreferences(profileId: string, isKids: boolean = false) {
  const storageKey = `${PREFERENCES_STORAGE_PREFIX}${profileId}`

  const getSavedPreferences = useCallback((): UserPreferences => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && Array.isArray(parsed.preferredGenres)) {
          return parsed
        }
      }

      const defaultGenres =
        DEFAULT_PROFILE_PREFERENCES[profileId] ||
        (isKids ? ['Family & Kids', 'Comedy'] : FALLBACK_GENRES)

      const initial: UserPreferences = {
        profileId,
        preferredGenres: defaultGenres,
        preferredContentType: 'all',
      }

      localStorage.setItem(storageKey, JSON.stringify(initial))
      return initial
    } catch {
      return {
        profileId,
        preferredGenres:
          DEFAULT_PROFILE_PREFERENCES[profileId] ||
          (isKids ? ['Family & Kids', 'Comedy'] : FALLBACK_GENRES),
        preferredContentType: 'all',
      }
    }
  }, [storageKey, profileId, isKids])

  const [preferences, setPreferences] = useState<UserPreferences>(getSavedPreferences)
  const [prevKey, setPrevKey] = useState(storageKey)

  if (prevKey !== storageKey) {
    setPrevKey(storageKey)
    setPreferences(getSavedPreferences())
  }

  // Cross-component and cross-tab sync
  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ profileId: string }>
      if (!customEvent.detail || customEvent.detail.profileId === profileId) {
        setPreferences(getSavedPreferences())
      }
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey) {
        setPreferences(getSavedPreferences())
      }
    }

    window.addEventListener(PREFERENCES_EVENT, handleSync)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener(PREFERENCES_EVENT, handleSync)
      window.removeEventListener('storage', handleStorage)
    }
  }, [storageKey, profileId, getSavedPreferences])

  const savePreferences = useCallback(
    (newPrefs: UserPreferences) => {
      setPreferences(newPrefs)
      try {
        localStorage.setItem(storageKey, JSON.stringify(newPrefs))
        window.dispatchEvent(
          new CustomEvent(PREFERENCES_EVENT, { detail: { profileId } })
        )
      } catch (err) {
        console.error('Failed to save preferences to localStorage', err)
      }
    },
    [storageKey, profileId]
  )

  const updatePreferredGenres = useCallback(
    (genres: string[]) => {
      savePreferences({
        ...preferences,
        preferredGenres: genres,
      })
    },
    [preferences, savePreferences]
  )

  const toggleGenre = useCallback(
    (genre: string) => {
      const current = preferences.preferredGenres
      const exists = current.includes(genre)
      const updated = exists
        ? current.filter((g) => g !== genre)
        : [...current, genre]

      // Keep at least one genre
      if (updated.length > 0) {
        updatePreferredGenres(updated)
      }
    },
    [preferences.preferredGenres, updatePreferredGenres]
  )

  const resetPreferences = useCallback(() => {
    const defaultGenres =
      DEFAULT_PROFILE_PREFERENCES[profileId] ||
      (isKids ? ['Family & Kids', 'Comedy'] : FALLBACK_GENRES)

    savePreferences({
      profileId,
      preferredGenres: defaultGenres,
      preferredContentType: 'all',
    })
  }, [profileId, isKids, savePreferences])

  return {
    preferences,
    preferredGenres: preferences.preferredGenres,
    updatePreferredGenres,
    toggleGenre,
    resetPreferences,
  }
}
