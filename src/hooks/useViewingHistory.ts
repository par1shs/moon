import { useState, useEffect, useCallback, useMemo } from 'react'
import type { ViewingHistoryItem, ContentMetadata, EpisodeMetadata, SeriesProgressSummary } from '../types'
import { ALL_DISCOVERY_TITLES } from '../data/sampleContent'

const HISTORY_STORAGE_PREFIX = 'junction_history_v1_'
const HISTORY_EVENT = 'junction_history_changed'

const ALL_MAP = new Map<string, ContentMetadata>()
ALL_DISCOVERY_TITLES.forEach((item) => {
  ALL_MAP.set(item.id, item)
})

// Seed history per known profile using verified catalogue IDs
const DEFAULT_SEEDS: Record<string, ViewingHistoryItem[]> = {
  'profile-aarav': [
    {
      contentId: 'port-1', // Signal in the Static (Flagship Series, 2 Seasons)
      profileId: 'profile-aarav',
      progress: 65,
      lastWatched: Date.now() - 2 * 3600 * 1000,
      seasonNumber: 1,
      episodeNumber: 2,
      episodeId: 'sm-s1-e2',
      episodeTitle: 'Sub-Zero Descent',
      remainingMinutes: 18,
      completed: false,
      watchedEpisodes: {
        'sm-s1-e1': {
          progress: 100,
          completed: true,
          seasonNumber: 1,
          episodeNumber: 1,
          episodeTitle: 'The Polar Beacon',
        },
        'sm-s1-e2': {
          progress: 65,
          completed: false,
          seasonNumber: 1,
          episodeNumber: 2,
          episodeTitle: 'Sub-Zero Descent',
          remainingMinutes: 18,
        },
      },
    },
    {
      contentId: 'port-3', // Velocity Night
      profileId: 'profile-aarav',
      progress: 75,
      lastWatched: Date.now() - 12 * 3600 * 1000,
      remainingMinutes: 22,
      completed: false,
    },
    {
      contentId: 'feat-2', // SYMPHONY OF THE VOID
      profileId: 'profile-aarav',
      progress: 100,
      lastWatched: Date.now() - 48 * 3600 * 1000,
      completed: true,
    },
  ],
  'profile-mira': [
    {
      contentId: 'ser-2', // Neon Overdrive (Series, 2 Seasons)
      profileId: 'profile-mira',
      progress: 80,
      lastWatched: Date.now() - 3 * 3600 * 1000,
      seasonNumber: 1,
      episodeNumber: 1,
      episodeId: 'no-s1-e1',
      episodeTitle: 'Silicon Dawn',
      remainingMinutes: 10,
      completed: false,
      watchedEpisodes: {
        'no-s1-e1': {
          progress: 80,
          completed: false,
          seasonNumber: 1,
          episodeNumber: 1,
          episodeTitle: 'Silicon Dawn',
          remainingMinutes: 10,
        },
      },
    },
    {
      contentId: 'mov-7', // The Glass Horizon
      profileId: 'profile-mira',
      progress: 30,
      lastWatched: Date.now() - 14 * 3600 * 1000,
      remainingMinutes: 42,
      completed: false,
    },
    {
      contentId: 'rom-1', // Love Across Wavelengths
      profileId: 'profile-mira',
      progress: 100,
      lastWatched: Date.now() - 72 * 3600 * 1000,
      completed: true,
    },
  ],
  'profile-kabir': [
    {
      contentId: 'ser-6', // Tokyo Midnight Protocol (Series, 2 Seasons)
      profileId: 'profile-kabir',
      progress: 55,
      lastWatched: Date.now() - 4 * 3600 * 1000,
      seasonNumber: 1,
      episodeNumber: 2,
      episodeId: 'tokyo-s1-e2',
      episodeTitle: 'Ghost in the Lattice',
      remainingMinutes: 22,
      completed: false,
      watchedEpisodes: {
        'tokyo-s1-e1': {
          progress: 100,
          completed: true,
          seasonNumber: 1,
          episodeNumber: 1,
          episodeTitle: 'Fiber & Neon',
        },
        'tokyo-s1-e2': {
          progress: 55,
          completed: false,
          seasonNumber: 1,
          episodeNumber: 2,
          episodeTitle: 'Ghost in the Lattice',
          remainingMinutes: 22,
        },
      },
    },
    {
      contentId: 'ser-5', // Subterranean Frequency
      profileId: 'profile-kabir',
      progress: 70,
      lastWatched: Date.now() - 20 * 3600 * 1000,
      remainingMinutes: 18,
      completed: false,
    },
    {
      contentId: 'mov-2', // Velocity Night: Apex
      profileId: 'profile-kabir',
      progress: 100,
      lastWatched: Date.now() - 36 * 3600 * 1000,
      completed: true,
    },
  ],
  'profile-kids': [
    {
      contentId: 'fam-1', // The Starlight Kingdom
      profileId: 'profile-kids',
      progress: 50,
      lastWatched: Date.now() - 2 * 3600 * 1000,
      remainingMinutes: 45,
      completed: false,
    },
    {
      contentId: 'ser-8', // Wild Soundscapes
      profileId: 'profile-kids',
      progress: 40,
      lastWatched: Date.now() - 24 * 3600 * 1000,
      seasonNumber: 1,
      episodeNumber: 1,
      episodeId: 'ws-s1-e1',
      episodeTitle: 'Amazon Dawn Chorus',
      remainingMinutes: 15,
      completed: false,
      watchedEpisodes: {
        'ws-s1-e1': {
          progress: 40,
          completed: false,
          seasonNumber: 1,
          episodeNumber: 1,
          episodeTitle: 'Amazon Dawn Chorus',
          remainingMinutes: 15,
        },
      },
    },
  ],
}

export function useViewingHistory(profileId: string) {
  const storageKey = `${HISTORY_STORAGE_PREFIX}${profileId}`

  const getSavedHistory = useCallback((): ViewingHistoryItem[] => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) return parsed
      }
      // Seed if known profile, else empty array
      const seed = DEFAULT_SEEDS[profileId] || []
      localStorage.setItem(storageKey, JSON.stringify(seed))
      return seed
    } catch {
      return DEFAULT_SEEDS[profileId] || []
    }
  }, [storageKey, profileId])

  const [history, setHistory] = useState<ViewingHistoryItem[]>(getSavedHistory)
  const [prevKey, setPrevKey] = useState(storageKey)

  // Sync state if storageKey changed during render
  if (prevKey !== storageKey) {
    setPrevKey(storageKey)
    setHistory(getSavedHistory())
  }

  // Sync across tabs and custom events
  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ profileId: string }>
      if (!customEvent.detail || customEvent.detail.profileId === profileId) {
        setHistory(getSavedHistory())
      }
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey) {
        setHistory(getSavedHistory())
      }
    }

    window.addEventListener(HISTORY_EVENT, handleSync)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener(HISTORY_EVENT, handleSync)
      window.removeEventListener('storage', handleStorage)
    }
  }, [storageKey, profileId, getSavedHistory])

  const saveHistory = useCallback(
    (newHistory: ViewingHistoryItem[]) => {
      setHistory(newHistory)
      try {
        localStorage.setItem(storageKey, JSON.stringify(newHistory))
        window.dispatchEvent(
          new CustomEvent(HISTORY_EVENT, { detail: { profileId } })
        )
      } catch (err) {
        console.error('Failed to save viewing history to localStorage', err)
      }
    },
    [storageKey, profileId]
  )

  /**
   * Update or insert viewing progress
   */
  const updateProgress = useCallback(
    (
      contentId: string,
      progress: number,
      details?: {
        episodeId?: string
        seasonNumber?: number
        episodeNumber?: number
        episodeTitle?: string
        completed?: boolean
        remainingMinutes?: number
        currentTime?: number
        duration?: number
      }
    ) => {
      const isCompleted = details?.completed ?? progress >= 95
      const now = Date.now()

      setHistory((prev) => {
        const existingIdx = prev.findIndex((item) => item.contentId === contentId)
        const existingItem = existingIdx >= 0 ? prev[existingIdx] : undefined
        const existingWatched = existingItem?.watchedEpisodes || {}
        const nextWatched = { ...existingWatched }

        if (details?.episodeId) {
          nextWatched[details.episodeId] = {
            progress: Math.min(100, Math.max(0, progress)),
            completed: isCompleted,
            lastWatched: now,
            currentTime: details.currentTime,
            duration: details.duration,
            seasonNumber: details.seasonNumber,
            episodeNumber: details.episodeNumber,
            episodeTitle: details.episodeTitle,
            remainingMinutes: details.remainingMinutes,
          }
        }

        const newEntry: ViewingHistoryItem = {
          contentId,
          profileId,
          progress: Math.min(100, Math.max(0, progress)),
          lastWatched: now,
          completed: isCompleted,
          remainingMinutes: details?.remainingMinutes,
          currentTime: details?.currentTime,
          duration: details?.duration,
          episodeId: details?.episodeId ?? existingItem?.episodeId,
          seasonNumber: details?.seasonNumber ?? existingItem?.seasonNumber,
          episodeNumber: details?.episodeNumber ?? existingItem?.episodeNumber,
          episodeTitle: details?.episodeTitle ?? existingItem?.episodeTitle,
          watchedEpisodes: nextWatched,
        }

        let updated: ViewingHistoryItem[]
        if (existingIdx >= 0) {
          updated = [newEntry, ...prev.filter((_, idx) => idx !== existingIdx)]
        } else {
          updated = [newEntry, ...prev]
        }

        try {
          localStorage.setItem(storageKey, JSON.stringify(updated))
          window.dispatchEvent(
            new CustomEvent(HISTORY_EVENT, { detail: { profileId } })
          )
        } catch (err) {
          console.error('Failed to update progress', err)
        }

        return updated
      })
    },
    [storageKey, profileId]
  )

  /**
   * Mark content as completed (100%)
   */
  const markCompleted = useCallback(
    (
      contentId: string,
      episodeDetails?: {
        episodeId?: string
        seasonNumber?: number
        episodeNumber?: number
        episodeTitle?: string
      }
    ) => {
      updateProgress(contentId, 100, {
        ...episodeDetails,
        completed: true,
        remainingMinutes: 0,
      })
    },
    [updateProgress]
  )

  /**
   * Mark an individual episode completed
   */
  const markEpisodeCompleted = useCallback(
    (
      contentId: string,
      episodeId: string,
      seasonNumber?: number,
      episodeNumber?: number,
      episodeTitle?: string
    ) => {
      updateProgress(contentId, 100, {
        episodeId,
        seasonNumber,
        episodeNumber,
        episodeTitle,
        completed: true,
        remainingMinutes: 0,
      })
    },
    [updateProgress]
  )

  /**
   * Retrieve episode-specific viewing progress for a given episode
   */
  const getEpisodeProgress = useCallback(
    (
      contentId: string,
      episodeId: string,
      seasonNumber?: number,
      episodeNumber?: number
    ): {
      progress: number
      completed: boolean
      currentTime?: number
      duration?: number
      remainingMinutes?: number
    } => {
      const item = history.find((h) => h.contentId === contentId)
      if (!item) return { progress: 0, completed: false }

      // 1. Direct record in watchedEpisodes map
      if (item.watchedEpisodes && item.watchedEpisodes[episodeId]) {
        const epState = item.watchedEpisodes[episodeId]
        return {
          progress: epState.progress,
          completed: epState.completed,
          currentTime: epState.currentTime,
          duration: epState.duration,
          remainingMinutes: epState.remainingMinutes,
        }
      }

      // 2. Exact match on series' last active episode
      if (item.episodeId === episodeId) {
        return {
          progress: item.progress,
          completed: item.completed,
          currentTime: item.currentTime,
          duration: item.duration,
          remainingMinutes: item.remainingMinutes,
        }
      }

      // 3. Sequential heuristic fallback: if user is on S1:E2, earlier episodes in that season or earlier seasons were completed
      if (
        seasonNumber !== undefined &&
        episodeNumber !== undefined &&
        item.seasonNumber !== undefined &&
        item.episodeNumber !== undefined
      ) {
        if (
          seasonNumber < item.seasonNumber ||
          (seasonNumber === item.seasonNumber && episodeNumber < item.episodeNumber)
        ) {
          return { progress: 100, completed: true }
        }
        if (seasonNumber === item.seasonNumber && episodeNumber === item.episodeNumber) {
          return { progress: item.progress, completed: item.completed }
        }
      }

      return { progress: 0, completed: false }
    },
    [history]
  )

  /**
   * Calculate complete series progress statistics and determine the next episode to watch
   */
  const getSeriesProgress = useCallback(
    (content: ContentMetadata): SeriesProgressSummary => {
      const seasons = content.seasons || []
      const historyItem = history.find((h) => h.contentId === content.id)

      let totalEpisodes = 0
      let completedEpisodes = 0
      let inProgressEpisodes = 0
      const seasonProgress: Record<
        number,
        { total: number; completed: number; inProgress: number; percent: number }
      > = {}

      let lastWatchedEpisode:
        | {
            episode: EpisodeMetadata
            seasonNumber: number
            progress: number
            completed: boolean
          }
        | undefined = undefined

      let nextEpisodeToWatch:
        | {
            episode: EpisodeMetadata
            seasonNumber: number
            isResume?: boolean
            isNextSeason?: boolean
          }
        | undefined = undefined

      let foundNext = false

      seasons.forEach((season) => {
        let seasonCompleted = 0
        let seasonInProgress = 0
        const sTotal = season.episodes.length
        totalEpisodes += sTotal

        season.episodes.forEach((ep) => {
          const epState = getEpisodeProgress(
            content.id,
            ep.id,
            season.seasonNumber,
            ep.episodeNumber
          )

          if (epState.completed) {
            seasonCompleted++
            completedEpisodes++
          } else if (epState.progress > 0) {
            seasonInProgress++
            inProgressEpisodes++
          }

          // Match last watched episode
          if (historyItem && historyItem.episodeId === ep.id) {
            lastWatchedEpisode = {
              episode: ep,
              seasonNumber: season.seasonNumber,
              progress: epState.progress,
              completed: epState.completed,
            }
          }

          // Find first uncompleted episode for "Next Episode To Watch"
          if (!foundNext && !epState.completed) {
            const isNextSeasonTransition =
              lastWatchedEpisode !== undefined &&
              lastWatchedEpisode.completed &&
              season.seasonNumber > lastWatchedEpisode.seasonNumber

            nextEpisodeToWatch = {
              episode: ep,
              seasonNumber: season.seasonNumber,
              isResume: epState.progress > 0,
              isNextSeason: isNextSeasonTransition,
            }
            foundNext = true
          }
        })

        seasonProgress[season.seasonNumber] = {
          total: sTotal,
          completed: seasonCompleted,
          inProgress: seasonInProgress,
          percent: sTotal > 0 ? Math.round((seasonCompleted / sTotal) * 100) : 0,
        }
      })

      // Fallback matching for lastWatchedEpisode if episodeId wasn't stored
      if (
        !lastWatchedEpisode &&
        historyItem &&
        historyItem.seasonNumber &&
        historyItem.episodeNumber
      ) {
        const foundSeason = seasons.find((s) => s.seasonNumber === historyItem.seasonNumber)
        const foundEp = foundSeason?.episodes.find(
          (e) => e.episodeNumber === historyItem.episodeNumber
        )
        if (foundEp && foundSeason) {
          lastWatchedEpisode = {
            episode: foundEp,
            seasonNumber: foundSeason.seasonNumber,
            progress: historyItem.progress,
            completed: historyItem.completed,
          }
        }
      }

      const overallPercent =
        totalEpisodes > 0 ? Math.round((completedEpisodes / totalEpisodes) * 100) : 0

      return {
        totalEpisodes,
        completedEpisodes,
        inProgressEpisodes,
        overallPercent,
        seasonProgress,
        lastWatchedEpisode,
        nextEpisodeToWatch,
        isFullyCompleted: totalEpisodes > 0 && completedEpisodes === totalEpisodes,
      }
    },
    [history, getEpisodeProgress]
  )

  /**
   * Remove item from history (e.g. from Continue Watching)
   */
  const removeFromHistory = useCallback(
    (contentId: string) => {
      const filtered = history.filter((item) => item.contentId !== contentId)
      saveHistory(filtered)
    },
    [history, saveHistory]
  )

  /**
   * Clear all history for profile
   */
  const clearHistory = useCallback(() => {
    saveHistory([])
  }, [saveHistory])

  /**
   * Get specific history item
   */
  const getHistoryItem = useCallback(
    (contentId: string) => history.find((item) => item.contentId === contentId),
    [history]
  )

  /**
   * Continue Watching list (in-progress items that are NOT completed)
   * Enriched with full ContentMetadata
   */
  const continueWatchingList = useMemo(() => {
    return history
      .filter((h) => !h.completed && h.progress > 0 && h.progress < 95)
      .map((h) => {
        const metadata = ALL_MAP.get(h.contentId)
        if (!metadata) return null

        let subtitle = metadata.subtitle
        let eyebrow = 'CONTINUE WATCHING'
        let remaining = h.remainingMinutes ? `${h.remainingMinutes}m left` : undefined

        if (h.episodeNumber) {
          const sNum = h.seasonNumber || 1
          subtitle = h.episodeTitle
            ? `S${sNum}:E${h.episodeNumber} "${h.episodeTitle}"`
            : `Season ${sNum} • Episode ${h.episodeNumber}`
          eyebrow = `SEASON ${sNum}`
          if (!remaining) {
            remaining = `${Math.max(5, Math.round((100 - h.progress) * 0.45))}m left`
          }
        } else if (!remaining) {
          remaining = `${Math.max(5, Math.round((100 - h.progress) * 1.1))}m left`
        }

        const enriched: ContentMetadata = {
          ...metadata,
          progress: h.progress,
          subtitle,
          eyebrow,
        }

        return {
          content: enriched,
          history: h,
          remainingTime: remaining,
        }
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
  }, [history])

  /**
   * Recently Watched list (all items with history, ordered by lastWatched)
   */
  const recentlyWatchedList = useMemo(() => {
    return history
      .map((h) => {
        const metadata = ALL_MAP.get(h.contentId)
        if (!metadata) return null
        return {
          content: {
            ...metadata,
            progress: h.progress,
            badge: h.completed ? 'WATCHED' : metadata.badge,
          },
          history: h,
        }
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
  }, [history])

  return {
    history,
    continueWatchingList,
    recentlyWatchedList,
    updateProgress,
    markCompleted,
    markEpisodeCompleted,
    removeFromHistory,
    clearHistory,
    getHistoryItem,
    getEpisodeProgress,
    getSeriesProgress,
  }
}
