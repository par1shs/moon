import type { ContentMetadata, ViewingHistoryItem } from '../../types'
import type { Profile } from '../profiles/types'

export interface PersonalisedShelves {
  topPicks: ContentMetadata[]
  becauseYouWatched: {
    sourceTitle: ContentMetadata
    recommendations: ContentMetadata[]
  } | null
  trendingInInterests: {
    genreName: string
    titles: ContentMetadata[]
  } | null
  favouriteGenreShelves: Array<{
    genre: string
    title: string
    eyebrow: string
    titles: ContentMetadata[]
  }>
  recommendedForYou: ContentMetadata[]
}

/**
 * Deterministic Content Recommendation Engine
 */
export function generateRecommendations(
  catalogue: ContentMetadata[],
  profile: Profile,
  history: ViewingHistoryItem[],
  preferredGenres: string[],
  watchlistIds: string[]
): PersonalisedShelves {
  // 1. Filter by maturity rating if Kids profile
  let candidates = catalogue
  if (profile.isKidsProfile) {
    candidates = catalogue.filter((item) => {
      const isMuted = item.rating === '18+' || item.rating === '16+'
      const isKidFriendly =
        item.rating === 'All' ||
        item.rating === 'PG' ||
        item.genres?.some((g) => g === 'Family & Kids' || g === 'Documentary' || g === 'Comedy')
      return !isMuted && isKidFriendly
    })
  }

  // 2. Identify in-progress and completed IDs
  const inProgressIds = new Set(
    history
      .filter((h) => !h.completed && h.progress > 5 && h.progress < 95)
      .map((h) => h.contentId)
  )
  const completedIds = new Set(
    history.filter((h) => h.completed || h.progress >= 95).map((h) => h.contentId)
  )

  // 3. Extract recently watched genres from history
  const historyMap = new Map(catalogue.map((c) => [c.id, c]))
  const recentlyWatchedGenresCount = new Map<string, number>()
  let seriesWatchCount = 0
  let movieWatchCount = 0

  history.forEach((h) => {
    const item = historyMap.get(h.contentId)
    if (item) {
      if (item.type === 'series') seriesWatchCount++
      if (item.type === 'movie') movieWatchCount++
      item.genres?.forEach((g) => {
        recentlyWatchedGenresCount.set(
          g,
          (recentlyWatchedGenresCount.get(g) || 0) + 1
        )
      })
    }
  })

  // Preferred format
  const prefersSeries = seriesWatchCount > movieWatchCount
  const prefersMovies = movieWatchCount > seriesWatchCount

  // 4. Score each candidate title
  const scoredCandidates = candidates.map((item) => {
    let score = 0

    // Favourite genre alignment (ordered weight)
    preferredGenres.forEach((prefGenre, index) => {
      if (
        item.genres?.some(
          (g) =>
            g.toLowerCase().includes(prefGenre.toLowerCase()) ||
            prefGenre.toLowerCase().includes(g.toLowerCase())
        )
      ) {
        const weight = index === 0 ? 45 : index === 1 ? 32 : index === 2 ? 22 : 15
        score += weight
      }
    })

    // History genre affinity
    item.genres?.forEach((g) => {
      const watchedTimes = recentlyWatchedGenresCount.get(g) || 0
      score += Math.min(30, watchedTimes * 12)
    })

    // Watchlist affinity
    if (watchlistIds.includes(item.id)) {
      score += 25
    }

    // Type preference boost
    if (prefersSeries && item.type === 'series') score += 10
    if (prefersMovies && item.type === 'movie') score += 10

    // Popularity & recency baseline
    score += ((item.popularity || 75) / 100) * 15
    if (item.quality === '4K HDR') score += 4

    // Downweight completed content so it doesn't crowd out new suggestions
    if (completedIds.has(item.id)) {
      score -= 50
    }

    return { item, score }
  })

  // Sort by score descending
  scoredCandidates.sort((a, b) => b.score - a.score)

  // 5. Generate "Top Picks for [Profile Name]"
  // Exclude titles currently in progress or already completed
  const topPicks = scoredCandidates
    .filter((entry) => !inProgressIds.has(entry.item.id) && !completedIds.has(entry.item.id))
    .slice(0, 8)
    .map((entry) => entry.item)

  // 6. Generate "Because You Watched..."
  // Source is the latest item in history (in-progress or completed)
  let becauseYouWatched: PersonalisedShelves['becauseYouWatched'] = null
  const latestHistory = history[0]
  if (latestHistory) {
    const source = historyMap.get(latestHistory.contentId)
    if (source) {
      // Find titles similar to source (shared genres, similar tone)
      const similar = candidates
        .filter((c) => c.id !== source.id && !inProgressIds.has(c.id))
        .map((candidate) => {
          let simScore = 0
          const sharedGenres = candidate.genres?.filter((g) => source.genres?.includes(g)) || []
          simScore += sharedGenres.length * 25
          if (candidate.type === source.type) simScore += 10
          if (candidate.director && source.director && candidate.director === source.director) {
            simScore += 20
          }
          simScore += ((candidate.popularity || 75) / 100) * 10
          return { candidate, simScore }
        })
        .filter((entry) => entry.simScore > 15)
        .sort((a, b) => b.simScore - a.simScore)
        .slice(0, 6)
        .map((entry) => entry.candidate)

      if (similar.length > 0) {
        becauseYouWatched = {
          sourceTitle: source,
          recommendations: similar,
        }
      }
    }
  }

  // 7. Generate "Trending in Your Interests"
  let trendingInInterests: PersonalisedShelves['trendingInInterests'] = null
  const topGenre = preferredGenres[0] || 'Sci-Fi'
  const genreMatches = candidates
    .filter(
      (c) =>
        c.genres?.some(
          (g) =>
            g.toLowerCase().includes(topGenre.toLowerCase()) ||
            topGenre.toLowerCase().includes(g.toLowerCase())
        ) && !inProgressIds.has(c.id)
    )
    .sort((a, b) => (b.popularity || 70) - (a.popularity || 70))
    .slice(0, 7)

  if (genreMatches.length > 0) {
    trendingInInterests = {
      genreName: topGenre,
      titles: genreMatches,
    }
  }

  // 8. Generate Favourite Genre Shelves (up to 2 shelves)
  const favouriteGenreShelves: PersonalisedShelves['favouriteGenreShelves'] = []
  const topTwoGenres = preferredGenres.slice(0, 2)

  topTwoGenres.forEach((genre) => {
    const shelfTitles = candidates
      .filter((c) =>
        c.genres?.some(
          (g) =>
            g.toLowerCase().includes(genre.toLowerCase()) ||
            genre.toLowerCase().includes(g.toLowerCase())
        )
      )
      .slice(0, 6)

    if (shelfTitles.length > 0) {
      favouriteGenreShelves.push({
        genre,
        title: `Top in ${genre}`,
        eyebrow: `YOUR FAVOURITE • ${genre.toUpperCase()}`,
        titles: shelfTitles,
      })
    }
  })

  // 9. Generate "Recommended for You" (diverse discovery)
  const usedIds = new Set([
    ...topPicks.map((c) => c.id),
    ...(becauseYouWatched?.recommendations.map((c) => c.id) || []),
  ])

  const recommendedForYou = scoredCandidates
    .map((e) => e.item)
    .filter((c) => !usedIds.has(c.id) && !inProgressIds.has(c.id))
    .slice(0, 8)

  return {
    topPicks: topPicks.length > 0 ? topPicks : candidates.slice(0, 6),
    becauseYouWatched,
    trendingInInterests,
    favouriteGenreShelves,
    recommendedForYou:
      recommendedForYou.length > 0 ? recommendedForYou : candidates.slice(6, 12),
  }
}
