import type { SubscriptionPlanId } from '../../types'

export type DeviceCategory = 'desktop' | 'mobile' | 'tablet' | 'smart-tv' | 'set-top-box'

export interface DevicePlaybackState {
  contentId: string
  contentTitle: string
  contentThumbnailUrl: string
  progressPercentage: number
  remainingMinutes?: number
  episodeTitle?: string
  seasonNumber?: number
  episodeNumber?: number
  lastUpdatedISO: string
}

export interface RegisteredDevice {
  id: string
  name: string
  category: DeviceCategory
  modelName: string
  os?: string
  browserOrApp?: string
  ipLocation?: string
  registeredDateISO: string
  lastActiveISO: string
  isCurrentDevice: boolean
  isActiveStream: boolean // Whether this device currently counts toward active simultaneous screens
  currentPlayback?: DevicePlaybackState
}

export interface DeviceHandoffPayload {
  targetDeviceId: string
  contentId: string
  contentTitle: string
  progressPercentage: number
  remainingMinutes?: number
  episodeTitle?: string
  seasonNumber?: number
  episodeNumber?: number
}

export interface CableDTHPartner {
  id: string
  name: string
  type: 'DTH Satellite' | 'MSO Digital Cable' | 'IPTV / Fiber STB'
  subscriberReach: string
  integrationType: string
  linearChannelsAllocated: number
  stbMiddleware: string
  hotkeyRemoteIntegration: boolean
  carrierBillingSupported: boolean
  status: 'Production Partner' | 'Trial Operator' | 'Proposed Architecture'
  description: string
}

export interface ScreenAllowanceInfo {
  tier: SubscriptionPlanId
  maxScreens: number
  activeScreens: number
  remainingScreens: number
  isLimitReached: boolean
}
