/**
 * JUNCTION+ / PIXEL — Interactive Television Data Models (Phase 5C)
 * 
 * Supports Live Polls, Audience Voting, and Programme Quizzes
 * with live percentage calculations, profile-specific persistence,
 * and seamless player/EPG integration.
 */

export type InteractionType = 'poll' | 'voting' | 'quiz'

export type InteractionStatus = 'active' | 'closed' | 'upcoming'

export interface InteractiveOption {
  id: string
  label: string
  subtitle?: string
  artworkUrl?: string
  avatarUrl?: string
  voteCount: number // simulated base vote count
  isCorrect?: boolean // for quiz
  explanation?: string // for quiz option explanation
}

export interface QuizQuestion {
  id: string
  question: string
  options: InteractiveOption[]
  correctOptionId: string
  explanation?: string
  timeLimitSeconds?: number
}

export interface InteractiveItem {
  id: string
  programId: string
  programTitle: string
  channelId: string
  channelNumber: string
  channelTitle: string
  type: InteractionType
  title: string
  question: string
  description: string
  badge?: string
  category: string
  status: InteractionStatus
  startTimeISO: string
  endTimeISO: string
  totalVotes: number // baseline simulated total
  options: InteractiveOption[]
  quizQuestions?: QuizQuestion[]
  closingTimeText?: string
  disclosureNotice?: string
}

export interface UserParticipationRecord {
  interactionId: string
  type: InteractionType
  submittedAtISO: string
  selectedOptionId?: string
  quizAnswers?: Record<string, string> // questionId -> selectedOptionId
  quizScore?: number
  quizTotal?: number
  userVoteAdded?: boolean
}

export interface InteractionResults {
  interactionId: string
  type: InteractionType
  totalVotes: number
  hasUserVoted: boolean
  userSelectedOptionId?: string
  options: (InteractiveOption & {
    percentage: number
    displayVotes: number
    isUserSelection: boolean
  })[]
  isClosed: boolean
}
