import type { ContentMetadata } from '../../../types'

export interface SearchFilters {
  scope: 'All' | 'Movies' | 'Series' | 'Live'
  genre: string
  language: string
  sortBy: 'relevance' | 'popularity' | 'recent'
}

export interface SearchMatch {
  item: ContentMetadata
  score: number
  matchReason?: string
}

export interface SearchOutcome {
  matches: SearchMatch[]
  didYouMean?: string
  originalQuery: string
}

/**
 * Standard Levenshtein Distance implementation
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }

  return dp[m][n]
}

/**
 * Extract distinct dictionary keywords from catalogue
 */
export function buildCatalogueVocabulary(items: ContentMetadata[]): string[] {
  const wordsSet = new Set<string>()

  items.forEach((item) => {
    // Title words
    item.title
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .forEach((w) => {
        if (w.length >= 3) wordsSet.add(w.toLowerCase())
      })

    // Genres
    item.genres?.forEach((g) => {
      g.replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .forEach((w) => {
          if (w.length >= 3) wordsSet.add(w.toLowerCase())
        })
    })

    // Cast members
    item.cast?.forEach((c) => {
      c.replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .forEach((w) => {
          if (w.length >= 3) wordsSet.add(w.toLowerCase())
        })
    })

    // Director
    if (item.director) {
      item.director
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .forEach((w) => {
          if (w.length >= 3) wordsSet.add(w.toLowerCase())
        })
    }
  })

  return Array.from(wordsSet)
}

/**
 * Find closest spelling candidate for minor mistakes
 */
export function findSpellingCorrection(
  query: string,
  vocabulary: string[]
): string | undefined {
  const clean = query.trim().toLowerCase()
  if (clean.length < 3) return undefined

  // Split query into terms
  const terms = clean.split(/\s+/)
  let correctedTerms: string[] = []
  let hasCorrection = false

  for (const term of terms) {
    if (vocabulary.includes(term)) {
      correctedTerms.push(term)
      continue
    }

    // Allow max edit distance 1 for 3-5 chars, 2 for 6+ chars
    const maxDist = term.length <= 5 ? 1 : 2
    let bestWord: string | null = null
    let bestDist = maxDist + 1

    for (const vocabWord of vocabulary) {
      const dist = levenshteinDistance(term, vocabWord)
      if (dist < bestDist && dist <= maxDist) {
        bestDist = dist
        bestWord = vocabWord
      }
    }

    if (bestWord) {
      correctedTerms.push(bestWord)
      hasCorrection = true
    } else {
      correctedTerms.push(term)
    }
  }

  return hasCorrection ? correctedTerms.join(' ') : undefined
}

/**
 * Perform compound catalogue search
 */
export function executeSearch(
  catalogue: ContentMetadata[],
  rawQuery: string,
  filters: SearchFilters,
  vocabulary: string[]
): SearchOutcome {
  const query = rawQuery.trim().toLowerCase()

  // 1. Filter by Scope
  let pool = catalogue
  if (filters.scope === 'Movies') {
    pool = pool.filter((c) => c.type === 'movie')
  } else if (filters.scope === 'Series') {
    pool = pool.filter((c) => c.type === 'series')
  } else if (filters.scope === 'Live') {
    pool = pool.filter((c) => c.isLive || c.type === 'live')
  }

  // 2. Filter by Genre
  if (filters.genre !== 'All Genres') {
    pool = pool.filter((c) =>
      c.genres?.some((g) =>
        g.toLowerCase().includes(filters.genre.toLowerCase()) ||
        filters.genre.toLowerCase().includes(g.toLowerCase())
      )
    )
  }

  // 3. Filter by Language
  if (filters.language !== 'All Languages') {
    pool = pool.filter((c) =>
      c.audioLanguages?.some((lang) =>
        lang.toLowerCase().includes(filters.language.toLowerCase())
      )
    )
  }

  // If query is empty, return pool sorted by selected sort option
  if (!query) {
    const sorted = [...pool].sort((a, b) => {
      if (filters.sortBy === 'popularity') {
        return (b.popularity || 70) - (a.popularity || 70)
      }
      if (filters.sortBy === 'recent') {
        return (
          new Date(b.dateAdded || '2025-01-01').getTime() -
          new Date(a.dateAdded || '2025-01-01').getTime()
        )
      }
      return (b.popularity || 70) - (a.popularity || 70)
    })

    return {
      matches: sorted.map((item) => ({ item, score: item.popularity || 70 })),
      originalQuery: rawQuery,
    }
  }

  // Function to score an item against a search query
  const scoreItem = (item: ContentMetadata, q: string): { score: number; reason?: string } => {
    let score = 0
    let reason: string | undefined

    const titleLower = item.title.toLowerCase()
    const descLower = (item.description || '').toLowerCase()
    const subtitleLower = (item.subtitle || '').toLowerCase()
    const directorLower = (item.director || '').toLowerCase()
    const channelNum = item.broadcastSchedule?.channelNumber || ''

    // Exact Title Match
    if (titleLower === q) {
      score += 120
      reason = 'Exact Title Match'
    } else if (titleLower.startsWith(q)) {
      score += 90
      reason = 'Title Starts With'
    } else if (titleLower.includes(q)) {
      score += 70
      reason = 'Title Match'
    }

    // Cast Match
    const matchedCast = item.cast?.find((actor) => actor.toLowerCase().includes(q))
    if (matchedCast) {
      score += 55
      if (!reason) reason = `Cast: ${matchedCast}`
    }

    // Director Match
    if (directorLower.includes(q)) {
      score += 50
      if (!reason) reason = `Director: ${item.director}`
    }

    // Genre Match
    const matchedGenre = item.genres?.find((g) => g.toLowerCase().includes(q))
    if (matchedGenre) {
      score += 45
      if (!reason) reason = `Genre: ${matchedGenre}`
    }

    // Subtitle / Eyebrow Match
    if (subtitleLower.includes(q)) {
      score += 35
      if (!reason) reason = item.subtitle
    }

    // Channel Number Match
    if (channelNum && channelNum.includes(q)) {
      score += 65
      reason = `Channel ${channelNum}`
    }

    // Description Match
    if (descLower.includes(q)) {
      score += 25
      if (!reason) reason = 'Description Match'
    }

    // Baseline Popularity
    score += ((item.popularity || 75) / 100) * 10

    return { score, reason }
  }

  // Execute direct search
  let directMatches: SearchMatch[] = []
  pool.forEach((item) => {
    const { score, reason } = scoreItem(item, query)
    if (score > 15) {
      directMatches.push({ item, score, matchReason: reason })
    }
  })

  // If direct matches exist, sort and return
  if (directMatches.length > 0) {
    directMatches.sort((a, b) => {
      if (filters.sortBy === 'popularity') {
        return (b.item.popularity || 70) - (a.item.popularity || 70)
      }
      if (filters.sortBy === 'recent') {
        return (
          new Date(b.item.dateAdded || '2025-01-01').getTime() -
          new Date(a.item.dateAdded || '2025-01-01').getTime()
        )
      }
      return b.score - a.score
    })

    return {
      matches: directMatches,
      originalQuery: rawQuery,
    }
  }

  // No direct matches: attempt spelling correction / fuzzy match
  const didYouMean = findSpellingCorrection(query, vocabulary)
  if (didYouMean && didYouMean !== query) {
    const fuzzyMatches: SearchMatch[] = []
    pool.forEach((item) => {
      const { score, reason } = scoreItem(item, didYouMean)
      if (score > 15) {
        fuzzyMatches.push({ item, score, matchReason: reason })
      }
    })

    if (fuzzyMatches.length > 0) {
      fuzzyMatches.sort((a, b) => b.score - a.score)
      return {
        matches: fuzzyMatches,
        didYouMean,
        originalQuery: rawQuery,
      }
    }
  }

  return {
    matches: [],
    didYouMean,
    originalQuery: rawQuery,
  }
}
