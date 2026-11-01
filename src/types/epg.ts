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
