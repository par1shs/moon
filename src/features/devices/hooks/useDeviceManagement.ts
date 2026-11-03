import { useState, useEffect, useCallback, useMemo } from 'react'
import type { RegisteredDevice, ScreenAllowanceInfo, DevicePlaybackState } from '../types'
import type { SubscriptionPlanId } from '../../../types'
import { SUBSCRIPTION_PLANS } from '../../../data/subscriptionPlans'
import { DEFAULT_REGISTERED_DEVICES_BY_PROFILE } from '../data/defaultDevices'

const DEVICES_STORAGE_PREFIX = 'junction_devices_v1_'
const DEVICES_EVENT = 'junction_devices_changed'

function createDefaultCurrentDevice(): RegisteredDevice {
  return {
    id: `dev-${Date.now()}`,
    name: 'Web Browser (This Device)',
    category: 'desktop',
    modelName: 'Web Browser Client',
    browserOrApp: 'Browser / Desktop',
    ipLocation: 'Local Client',
    registeredDateISO: new Date().toISOString(),
    lastActiveISO: new Date().toISOString(),
    isCurrentDevice: true,
    isActiveStream: true,
  }
}

export function useDeviceManagement(
  profileId: string,
  subscriptionTier: SubscriptionPlanId = 'free'
) {
  const storageKey = `${DEVICES_STORAGE_PREFIX}${profileId}`

  const getInitialDevices = useCallback((): RegisteredDevice[] => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch (err) {
      console.warn('Failed to load registered devices from localStorage:', err)
    }

    // Fallback to seed or default
    const seeds = DEFAULT_REGISTERED_DEVICES_BY_PROFILE[profileId]
    if (seeds && seeds.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(seeds))
      } catch {}
      return seeds
    }

    const defaultDev = [createDefaultCurrentDevice()]
    try {
      localStorage.setItem(storageKey, JSON.stringify(defaultDev))
    } catch {}
    return defaultDev
  }, [storageKey, profileId])

  const [devices, setDevices] = useState<RegisteredDevice[]>(getInitialDevices)
  const [prevKey, setPrevKey] = useState(storageKey)

  // Re-sync if storageKey changes during render (e.g. profile switch)
  if (prevKey !== storageKey) {
    setPrevKey(storageKey)
    setDevices(getInitialDevices())
  }

  // Cross-tab and in-tab event synchronization
  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ profileId: string }>
      if (!customEvent.detail || customEvent.detail.profileId === profileId) {
        setDevices(getInitialDevices())
      }
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey) {
        setDevices(getInitialDevices())
      }
    }

    window.addEventListener(DEVICES_EVENT, handleSync)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener(DEVICES_EVENT, handleSync)
      window.removeEventListener('storage', handleStorage)
    }
  }, [storageKey, profileId, getInitialDevices])

  // Save devices and dispatch event
  const persistDevices = useCallback(
    (newDevices: RegisteredDevice[]) => {
      setDevices(newDevices)
      try {
        localStorage.setItem(storageKey, JSON.stringify(newDevices))
        window.dispatchEvent(
          new CustomEvent(DEVICES_EVENT, { detail: { profileId } })
        )
      } catch (err) {
        console.error('Failed to persist registered devices:', err)
      }
    },
    [storageKey, profileId]
  )

  // Screen allowance metrics based on subscription tier
  const maxScreens = useMemo(() => {
    const plan = SUBSCRIPTION_PLANS[subscriptionTier]
    return plan?.screensSimultaneous || 1
  }, [subscriptionTier])

  const activeScreens = useMemo(() => {
    return devices.filter((d) => d.isActiveStream).length
  }, [devices])

  const screenAllowance: ScreenAllowanceInfo = useMemo(() => {
    const remaining = Math.max(0, maxScreens - activeScreens)
    return {
      tier: subscriptionTier,
      maxScreens,
      activeScreens,
      remainingScreens: remaining,
      isLimitReached: activeScreens >= maxScreens,
    }
  }, [subscriptionTier, maxScreens, activeScreens])

  const currentDevice = useMemo(() => {
    return (
      devices.find((d) => d.isCurrentDevice) ||
      devices[0] ||
      createDefaultCurrentDevice()
    )
  }, [devices])

  // Rename a registered device
  const renameDevice = useCallback(
    (deviceId: string, newName: string) => {
      const trimmed = newName.trim()
      if (!trimmed) return
      const updated = devices.map((d) =>
        d.id === deviceId
          ? {
              ...d,
              name: trimmed,
              lastActiveISO: new Date().toISOString(),
            }
          : d
      )
      persistDevices(updated)
    },
    [devices, persistDevices]
  )

  // Remove a registered device
  const removeDevice = useCallback(
    (deviceId: string) => {
      // Prevent deleting the currently active web device if it's the only one
      if (devices.length <= 1) {
        return { success: false, error: 'Cannot remove the only registered device.' }
      }
      const updated = devices.filter((d) => d.id !== deviceId)
      persistDevices(updated)
      return { success: true }
    },
    [devices, persistDevices]
  )

  // Add a newly registered device
  const addDevice = useCallback(
    (newDevice: Omit<RegisteredDevice, 'id' | 'registeredDateISO' | 'lastActiveISO'>) => {
      const now = new Date().toISOString()
      const device: RegisteredDevice = {
        ...newDevice,
        id: `dev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        registeredDateISO: now,
        lastActiveISO: now,
      }
      const updated = [...devices, device]
      persistDevices(updated)
      return { success: true, device }
    },
    [devices, persistDevices]
  )

  // Toggle active stream on a device with screen-limit enforcement
  const toggleDeviceStream = useCallback(
    (deviceId: string): { success: boolean; error?: string } => {
      const target = devices.find((d) => d.id === deviceId)
      if (!target) return { success: false, error: 'Device not found.' }

      // If turning on an active stream, enforce subscription screen allowance
      if (!target.isActiveStream) {
        if (activeScreens >= maxScreens) {
          return {
            success: false,
            error: `Your ${SUBSCRIPTION_PLANS[subscriptionTier].name} plan allows up to ${maxScreens} simultaneous screen${maxScreens > 1 ? 's' : ''}. Upgrade to Standard (2 screens) or Premium (4 screens) to stream on additional devices concurrently.`,
          }
        }
      }

      const updated = devices.map((d) =>
        d.id === deviceId
          ? {
              ...d,
              isActiveStream: !d.isActiveStream,
              lastActiveISO: new Date().toISOString(),
            }
          : d
      )
      persistDevices(updated)
      return { success: true }
    },
    [devices, activeScreens, maxScreens, subscriptionTier, persistDevices]
  )

  // Simulate cross-device viewing handoff
  const simulateHandoff = useCallback(
    (payload: {
      targetDeviceId: string
      contentId: string
      contentTitle: string
      contentThumbnailUrl: string
      progressPercentage: number
      remainingMinutes?: number
      episodeTitle?: string
      seasonNumber?: number
      episodeNumber?: number
    }): { success: boolean; targetDeviceName: string } => {
      const target = devices.find((d) => d.id === payload.targetDeviceId)
      const targetName = target?.name || 'Selected Device'

      const newPlayback: DevicePlaybackState = {
        contentId: payload.contentId,
        contentTitle: payload.contentTitle,
        contentThumbnailUrl: payload.contentThumbnailUrl,
        progressPercentage: payload.progressPercentage,
        remainingMinutes: payload.remainingMinutes,
        episodeTitle: payload.episodeTitle,
        seasonNumber: payload.seasonNumber,
        episodeNumber: payload.episodeNumber,
        lastUpdatedISO: new Date().toISOString(),
      }

      // Hand off stream: if we are at screen limit, release source stream to avoid exceeding limit
      const updated = devices.map((d) => {
        if (d.id === payload.targetDeviceId) {
          return {
            ...d,
            isActiveStream: true,
            currentPlayback: newPlayback,
            lastActiveISO: new Date().toISOString(),
          }
        }
        // If current device was active and screen limit is tight, pause current device stream
        if (d.isCurrentDevice && activeScreens >= maxScreens) {
          return {
            ...d,
            isActiveStream: false,
            lastActiveISO: new Date().toISOString(),
          }
        }
        return d
      })

      persistDevices(updated)
      return { success: true, targetDeviceName: targetName }
    },
    [devices, activeScreens, maxScreens, persistDevices]
  )

  // Reset to seeds (useful for test suites and debug)
  const resetDevices = useCallback(() => {
    const seeds = DEFAULT_REGISTERED_DEVICES_BY_PROFILE[profileId] || [createDefaultCurrentDevice()]
    persistDevices(seeds)
  }, [profileId, persistDevices])

  return {
    devices,
    currentDevice,
    screenAllowance,
    activeScreens,
    maxScreens,
    isLimitReached: screenAllowance.isLimitReached,
    renameDevice,
    removeDevice,
    addDevice,
    toggleDeviceStream,
    simulateHandoff,
    resetDevices,
  }
}
