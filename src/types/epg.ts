import type { ContentMetadata } from './index'

export interface EPGProgram {
  id: string
  channelId: string
  title: string
  description: string
  startTime: Date
  endTime: Date
  durationMinutes: number
  genre: string
  artworkUrl: string
  rating: string
  linkedContentId?: string
  badge?: string
  // Catch-up metadata
  isCatchUpEligible?: boolean
  catchUpDays?: number
  catchUpExpiresAt?: Date
  // Interactive metadata (Phase 5C)
  hasInteractive?: boolean
  interactiveId?: string
}

export interface EPGChannel {
  id: string
  channelNumber: string
  title: string
  subtitle: string
  category: string
  quality: '4K HDR' | 'HD' | 'Dolby Atmos'
  backdropUrl: string
  logoText?: string
  contentRef?: ContentMetadata
}

export type EPGProgramStatus = 'ended' | 'live' | 'upcoming'

export interface CatchUpStatus {
  isAvailable: boolean
  isExpired: boolean
  isEligible: boolean
  remainingHours: number
  remainingDays: number
  expiryText: string
  isExpiringSoon: boolean
  broadcastDateText: string
}

export interface ChannelLiveState {
  channel: EPGChannel
  currentProgram: EPGProgram | null
  nextProgram: EPGProgram | null
  progressPercent: number
  remainingMinutes: number
  elapsedMinutes: number
}

export interface ProgramReminder {
  id: string
  programId: string
  channelId: string
  channelNumber: string
  channelTitle: string
  programTitle: string
  startTimeISO: string
  genre?: string
  artworkUrl?: string
  notified?: boolean
}

export interface CatchUpProgramItem {
  program: EPGProgram
  channel: EPGChannel
  catchUpStatus: CatchUpStatus
  savedProgress?: number
  savedRemainingMinutes?: number
}
