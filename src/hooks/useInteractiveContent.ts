import { useState, useEffect, useCallback, useMemo } from 'react'
import type {
  InteractiveItem,
  UserParticipationRecord,
  InteractionResults,
} from '../types/interactive'
import { SAMPLE_INTERACTIVE_ITEMS } from '../data/interactiveContent'

const INTERACTIVE_UPDATE_EVENT = 'junction-interactive-update'

export function useInteractiveContent(profileId: string = 'default') {
  const storageKey = `junction_interactions_v1_${profileId || 'default'}`

  // Load participation records for current active profile
  const [participations, setParticipations] = useState<Record<string, UserParticipationRecord>>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })

  // Synchronize when profileId / storageKey changes
  const [prevKey, setPrevKey] = useState(storageKey)
  if (prevKey !== storageKey) {
    setPrevKey(storageKey)
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
      setParticipations(stored ? JSON.parse(stored) : {})
    } catch {
      setParticipations({})
    }
  }

  // Synchronize on cross-tab and in-tab custom events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        try {
          setParticipations(JSON.parse(e.newValue))
        } catch {
          // ignore
        }
      }
    }

    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ profileId?: string; interactionId?: string }>
      if (!customEvent.detail || customEvent.detail.profileId === (profileId || 'default')) {
        try {
          const stored = localStorage.getItem(storageKey)
          setParticipations(stored ? JSON.parse(stored) : {})
        } catch {
          // ignore
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener(INTERACTIVE_UPDATE_EVENT, handleCustomEvent)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener(INTERACTIVE_UPDATE_EVENT, handleCustomEvent)
    }
  }, [storageKey, profileId])

  // Persist records helper
  const persist = useCallback(
    (updated: Record<string, UserParticipationRecord>) => {
      setParticipations(updated)
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated))
        window.dispatchEvent(
          new CustomEvent(INTERACTIVE_UPDATE_EVENT, {
            detail: { profileId: profileId || 'default' },
          })
        )
      } catch (err) {
        console.warn('Failed to persist interactive participation:', err)
      }
    },
    [storageKey, profileId]
  )

  // Has user participated?
  const hasParticipated = useCallback(
    (interactionId: string): boolean => {
      return Boolean(participations[interactionId])
    },
    [participations]
  )

  // Get participation record
  const getParticipation = useCallback(
    (interactionId: string): UserParticipationRecord | undefined => {
      return participations[interactionId]
    },
    [participations]
  )

  // Get item by ID
  const getItemById = useCallback((interactionId: string): InteractiveItem | undefined => {
    return SAMPLE_INTERACTIVE_ITEMS.find((it) => it.id === interactionId)
  }, [])

  // Submit Poll Vote
  const submitPollVote = useCallback(
    (interactionId: string, optionId: string): boolean => {
      const item = getItemById(interactionId)
      if (!item || item.status === 'closed') return false
      if (participations[interactionId]) return false // Prevent duplicate voting

      const record: UserParticipationRecord = {
        interactionId,
        type: 'poll',
        submittedAtISO: new Date().toISOString(),
        selectedOptionId: optionId,
        userVoteAdded: true,
      }

      const next = { ...participations, [interactionId]: record }
      persist(next)
      return true
    },
    [getItemById, participations, persist]
  )

  // Submit Audience Vote
  const submitAudienceVote = useCallback(
    (interactionId: string, optionId: string): boolean => {
      const item = getItemById(interactionId)
      if (!item || item.status === 'closed') return false
      if (participations[interactionId]) return false // Prevent duplicate voting

      const record: UserParticipationRecord = {
        interactionId,
        type: 'voting',
        submittedAtISO: new Date().toISOString(),
        selectedOptionId: optionId,
        userVoteAdded: true,
      }

      const next = { ...participations, [interactionId]: record }
      persist(next)
      return true
    },
    [getItemById, participations, persist]
  )

  // Submit Quiz Answers
  const submitQuizAnswers = useCallback(
    (
      interactionId: string,
      answers: Record<string, string>,
      score: number,
      total: number
    ): boolean => {
      const item = getItemById(interactionId)
      if (!item || item.status === 'closed') return false
      if (participations[interactionId]) return false // Prevent retakes once completed

      const record: UserParticipationRecord = {
        interactionId,
        type: 'quiz',
        submittedAtISO: new Date().toISOString(),
        quizAnswers: answers,
        quizScore: score,
        quizTotal: total,
        userVoteAdded: true,
      }

      const next = { ...participations, [interactionId]: record }
      persist(next)
      return true
    },
    [getItemById, participations, persist]
  )

  // Calculate dynamic results with user vote factored in
  const getInteractionResults = useCallback(
    (interactionId: string): InteractionResults | null => {
      const item = getItemById(interactionId)
      if (!item) return null

      const userRecord = participations[interactionId]
      const hasUserVoted = Boolean(userRecord)
      const userSelectedOptionId = userRecord?.selectedOptionId

      // Compute display votes
      let computedTotalVotes = item.totalVotes
      if (hasUserVoted && userSelectedOptionId) {
        computedTotalVotes += 1
      }

      const options = item.options.map((opt) => {
        const isUserSelection = opt.id === userSelectedOptionId
        const displayVotes = opt.voteCount + (isUserSelection ? 1 : 0)
        const rawPercent = computedTotalVotes > 0 ? (displayVotes / computedTotalVotes) * 100 : 0
        const percentage = Math.round(rawPercent * 10) / 10

        return {
          ...opt,
          displayVotes,
          percentage,
          isUserSelection,
        }
      })

      return {
        interactionId,
        type: item.type,
        totalVotes: computedTotalVotes,
        hasUserVoted,
        userSelectedOptionId,
        options,
        isClosed: item.status === 'closed',
      }
    },
    [getItemById, participations]
  )

  // Find interactions linked to a programme
  const getInteractionsForProgram = useCallback(
    (programId: string, programTitle?: string): InteractiveItem[] => {
      return SAMPLE_INTERACTIVE_ITEMS.filter((it) => {
        if (it.programId === programId || programId.includes(it.programId)) return true
        if (programTitle && it.programTitle.toLowerCase() === programTitle.toLowerCase()) return true
        return false
      })
    },
    []
  )

  // Find interactions linked to a channel
  const getInteractionsForChannel = useCallback((channelId: string): InteractiveItem[] => {
    return SAMPLE_INTERACTIVE_ITEMS.filter((it) => it.channelId === channelId)
  }, [])

  // Reset interactions for profile
  const resetInteractionsForProfile = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
      setParticipations({})
      window.dispatchEvent(
        new CustomEvent(INTERACTIVE_UPDATE_EVENT, {
          detail: { profileId: profileId || 'default' },
        })
      )
    } catch {
      // ignore
    }
  }, [storageKey, profileId])

  const allInteractions = useMemo(() => SAMPLE_INTERACTIVE_ITEMS, [])

  return {
    items: allInteractions,
    participations,
    hasParticipated,
    getParticipation,
    getItemById,
    submitPollVote,
    submitAudienceVote,
    submitQuizAnswers,
    getInteractionResults,
    getInteractionsForProgram,
    getInteractionsForChannel,
    resetInteractionsForProfile,
  }
}
