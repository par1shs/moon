import { useState, useEffect, useCallback } from 'react'
import type { Profile, AvatarConfig } from '../types'
import { DEFAULT_PROFILES } from '../data/defaultProfiles'
import { useAudio } from '../../audio/useAudio'
import { useTheme } from '../../../hooks/useTheme'
import { extractThemeFromAvatar } from '../../theme/paletteExtractor'
import { DEFAULT_ACCENT } from '../../../styles/tokens'

const STORAGE_KEY = 'junction_profiles_v1'
const ACTIVE_PROFILE_KEY = 'junction_active_profile_v1'

export function useProfiles() {
  const { playProfileSelectSound } = useAudio()
  const { setCustomAccent } = useTheme()

  const [profiles, setProfiles] = useState<Profile[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_PROFILES
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: Profile[] = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure all profiles have a cached themePalette
          return parsed.map((p) => {
            if (!p.themePalette) {
              const palette = extractThemeFromAvatar(p.avatarConfig, p.name)
              return {
                ...p,
                themePalette: palette,
                accentColor: palette.primary,
              }
            }
            return p
          })
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored profiles, restoring defaults:', e)
    }
    // Seed defaults
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PROFILES))
    } catch {
      // Ignored
    }
    return DEFAULT_PROFILES
  })

  // Restore active profile from localStorage on initial load
  const [activeProfile, setActiveProfile] = useState<Profile | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      const activeId = localStorage.getItem(ACTIVE_PROFILE_KEY)
      if (activeId) {
        const found = profiles.find((p) => p.id === activeId)
        if (found) return found
      }
    } catch {
      // Ignored
    }
    return null
  })

  const [isManaging, setIsManaging] = useState(false)

  // On mount or active profile change, sync active profile's theme
  useEffect(() => {
    if (activeProfile) {
      const palette =
        activeProfile.themePalette ||
        extractThemeFromAvatar(activeProfile.avatarConfig, activeProfile.name)
      setCustomAccent(palette)
    } else {
      setCustomAccent(DEFAULT_ACCENT)
    }
  }, [activeProfile, setCustomAccent])

  // Persist whenever profiles state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
    } catch (e) {
      console.error('Failed to save profiles to localStorage:', e)
    }
  }, [profiles])

  // Select a profile and trigger the audio + dynamic theme sync
  const selectProfile = useCallback(
    (profile: Profile) => {
      playProfileSelectSound()
      setActiveProfile(profile)

      try {
        localStorage.setItem(ACTIVE_PROFILE_KEY, profile.id)
      } catch {
        // Ignored
      }

      // Extract or retrieve cached theme palette from the selected avatar
      const palette =
        profile.themePalette ||
        extractThemeFromAvatar(profile.avatarConfig, profile.name)

      // Apply dynamically to design system tokens
      setCustomAccent(palette)
    },
    [playProfileSelectSound, setCustomAccent]
  )

  const clearActiveProfile = useCallback(() => {
    setActiveProfile(null)
    try {
      localStorage.removeItem(ACTIVE_PROFILE_KEY)
    } catch {
      // Ignored
    }
    // Revert to brand terracotta default accent on profile selection screen
    setCustomAccent(DEFAULT_ACCENT)
  }, [setCustomAccent])

  const updateProfile = useCallback(
    (id: string, updates: Partial<Pick<Profile, 'name' | 'isKidsProfile'>>) => {
      setProfiles((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p
          return {
            ...p,
            ...updates,
          }
        })
      )
    },
    []
  )

  const updateProfileAvatar = useCallback(
    (id: string, avatarConfig: AvatarConfig) => {
      // Regenerate theme palette for the updated avatar
      setProfiles((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p
          const newPalette = extractThemeFromAvatar(avatarConfig, p.name)
          return {
            ...p,
            avatarId: avatarConfig.id,
            avatarConfig,
            accentColor: newPalette.primary,
            themePalette: newPalette,
          }
        })
      )

      // If updating the currently active profile, immediately apply the regenerated palette
      setActiveProfile((prev) => {
        if (prev?.id === id) {
          const newPalette = extractThemeFromAvatar(avatarConfig, prev.name)
          setCustomAccent(newPalette)
          return {
            ...prev,
            avatarId: avatarConfig.id,
            avatarConfig,
            accentColor: newPalette.primary,
            themePalette: newPalette,
          }
        }
        return prev
      })
    },
    [setCustomAccent]
  )

  const deleteProfile = useCallback(
    (id: string): boolean => {
      // Rule: Do not allow deletion of the last remaining profile
      if (profiles.length <= 1) {
        return false
      }

      setProfiles((prev) => prev.filter((p) => p.id !== id))
      if (activeProfile?.id === id) {
        clearActiveProfile()
      }
      return true
    },
    [profiles.length, activeProfile, clearActiveProfile]
  )

  const addProfile = useCallback(
    (name: string, isKidsProfile = false, customConfig?: Partial<AvatarConfig>): Profile => {
      const id = `profile-${Date.now()}`
      const characterStyle = isKidsProfile
        ? 'cosmic-bot'
        : (['director', 'producer', 'explorer', 'creator', 'curator'][
            profiles.length % 5
          ] as AvatarConfig['characterStyle'])

      const paletteOptions = [
        { primary: '#C98769', secondary: '#D6A58B', gradient: 'linear-gradient(145deg, #2A1D17 0%, #151312 60%, #3D261C 120%)' },
        { primary: '#D99B52', secondary: '#E6B77E', gradient: 'linear-gradient(145deg, #2D2214 0%, #171512 60%, #3E2F1A 120%)' },
        { primary: '#7E9F8E', secondary: '#A2BCB0', gradient: 'linear-gradient(145deg, #182620 0%, #121815 60%, #23372E 120%)' },
        { primary: '#8091A8', secondary: '#A3B0C2', gradient: 'linear-gradient(145deg, #1A202C 0%, #13171F 60%, #263042 120%)' },
      ]
      const chosenPalette = paletteOptions[profiles.length % paletteOptions.length]

      const avatarConfig: AvatarConfig = {
        id: `avatar-${id}`,
        characterStyle,
        primaryColor: chosenPalette.primary,
        secondaryColor: chosenPalette.secondary,
        bgGradient: chosenPalette.gradient,
        accessory: isKidsProfile ? 'stars' : 'glasses',
        ...customConfig,
      }

      const profileName = name.trim() || 'New Viewer'
      // Extract customized palette for the new profile
      const themePalette = extractThemeFromAvatar(avatarConfig, profileName)

      const newProfile: Profile = {
        id,
        name: profileName,
        avatarId: avatarConfig.id,
        avatarConfig,
        isKidsProfile,
        accentColor: themePalette.primary,
        themePalette,
        createdAt: Date.now(),
      }

      setProfiles((prev) => [...prev, newProfile])
      return newProfile
    },
    [profiles.length]
  )

  return {
    profiles,
    activeProfile,
    isManaging,
    setIsManaging,
    selectProfile,
    clearActiveProfile,
    updateProfile,
    updateProfileAvatar,
    deleteProfile,
    addProfile,
  }
}
