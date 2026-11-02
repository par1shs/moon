import React, { useState } from 'react'
import { motion } from 'motion/react'
import { Settings, Check, RotateCcw, LayoutGrid } from 'lucide-react'
import { BrandLogo } from '../../components/common/BrandLogo'
import { ThemeToggle } from '../../components/common/ThemeToggle'
import { Button } from '../../components/common/Button'
import { SoundControl } from '../audio/SoundControl'
import { ProfileGrid } from './components/ProfileGrid'
import { AddProfileModal, EditProfileModal } from './components/ManageProfiles'
import { ProfileWelcome } from './components/ProfileWelcome'
import { MainLayout } from '../home/components/MainLayout'
import { useProfiles } from './hooks/useProfiles'
import type { Profile } from './types'
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference'
import { useTheme } from '../../hooks/useTheme'

const STREAMING_SESSION_KEY = 'junction_in_streaming'

export interface ProfileSelectionScreenProps {
  onReplayIntro?: () => void
  onOpenDevShell?: () => void
}

export const ProfileSelectionScreen: React.FC<ProfileSelectionScreenProps> = ({
  onReplayIntro,
  onOpenDevShell,
}) => {
  const reducedMotion = useReducedMotionPreference()
  const { setCustomAccent } = useTheme()
  const {
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
  } = useProfiles()

  // State for streaming view vs profile selection
  const [inStreamingView, setInStreamingView] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return Boolean(sessionStorage.getItem(STREAMING_SESSION_KEY))
    } catch {
      return false
    }
  })

  // State for selecting / animating
  const [animatingProfileId, setAnimatingProfileId] = useState<string | null>(null)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Profile click handler with selection animation
  const handleProfileSelect = (profile: Profile) => {
    // Immediately apply this profile's palette so selection rings and ambient glow reflect it instantly
    if (profile.themePalette) {
      setCustomAccent(profile.themePalette)
    }
    setAnimatingProfileId(profile.id)

    // Allow the selection highlight and card fade-out animation to play (~450ms)
    const delay = reducedMotion ? 50 : 450
    window.setTimeout(() => {
      selectProfile(profile)
      setAnimatingProfileId(null)
    }, delay)
  }

  const handleEnterStreaming = () => {
    try {
      sessionStorage.setItem(STREAMING_SESSION_KEY, 'true')
    } catch {
      // Ignored
    }
    setInStreamingView(true)
  }

  const handleEditProfile = (profile: Profile) => {
    setEditingProfile(profile)
  }

  const handleBackToProfiles = () => {
    try {
      sessionStorage.removeItem(STREAMING_SESSION_KEY)
    } catch {
      // Ignored
    }
    setInStreamingView(false)
    clearActiveProfile()
    setAnimatingProfileId(null)
  }

  // If a profile is confirmed and active, display either MainLayout or Welcome screen
  if (activeProfile) {
    if (inStreamingView) {
      return (
        <MainLayout
          profile={activeProfile}
          profiles={profiles}
          onSwitchProfile={handleBackToProfiles}
          onUpdateProfile={updateProfile}
          onUpdateAvatar={updateProfileAvatar}
          onDeleteProfile={deleteProfile}
          onReplayIntro={onReplayIntro}
          onOpenDevShell={onOpenDevShell}
        />
      )
    }

    return (
      <ProfileWelcome
        profile={activeProfile}
        onContinueToApp={handleEnterStreaming}
        onBackToProfiles={handleBackToProfiles}
        onReplayStartupIntro={onReplayIntro}
        onOpenDevShell={onOpenDevShell}
      />
    )
  }

  return (
    <motion.div
      key="profile-selection-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="min-h-screen w-full bg-transparent text-[var(--text-primary)] flex flex-col justify-between p-6 sm:p-10 select-none overflow-x-hidden relative"
    >
      {/* Ambient Brand Primary Radial Glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[950px] h-[650px] rounded-[100%] blur-[130px] opacity-70 pointer-events-none"
        style={{ background: 'var(--gradient-brand-aura-mid)' }}
      />
      {/* Top Header */}
      <header className="w-full flex items-center justify-between">
        <BrandLogo size="sm" />

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {onReplayIntro && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReplayIntro}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Replay Intro
            </Button>
          )}

          {onOpenDevShell && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenDevShell}
              leftIcon={<LayoutGrid className="w-3.5 h-3.5" />}
            >
              Dev Shell
            </Button>
          )}
        </div>
      </header>

      {/* Main Center Content */}
      <main className="w-full max-w-5xl mx-auto my-auto flex flex-col items-center text-center py-8 sm:py-12">
        {/* Headings */}
        <motion.div
          initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-2 mb-10 sm:mb-14"
        >
          <span className="text-xs font-mono uppercase tracking-widest text-[var(--accent-secondary)]">
            {isManaging ? 'PROFILE CUSTOMIZATION' : 'ACCOUNT SELECTION'}
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Who&apos;s watching?
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-secondary)] font-normal max-w-md mx-auto">
            {isManaging
              ? 'Select a profile to edit its name or adjust viewing restrictions.'
              : 'Choose your profile to continue.'}
          </p>
        </motion.div>

        {/* Profile Grid */}
        <ProfileGrid
          profiles={profiles}
          selectedProfileId={animatingProfileId}
          isManaging={isManaging}
          onSelect={handleProfileSelect}
          onEdit={handleEditProfile}
          onAddClick={() => setIsAddModalOpen(true)}
        />

        {/* Manage Profiles Action */}
        <motion.div
          initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="mt-12 sm:mt-16"
        >
          <Button
            variant={isManaging ? 'primary' : 'outline'}
            size="md"
            onClick={() => setIsManaging(!isManaging)}
            leftIcon={
              isManaging ? (
                <Check className="w-4 h-4" />
              ) : (
                <Settings className="w-4 h-4" />
              )
            }
            className="tracking-wider uppercase font-mono text-xs"
          >
            {isManaging ? 'Done Managing' : 'Manage Profiles'}
          </Button>
        </motion.div>
      </main>

      {/* Footer / Discrete Sound Control */}
      <footer className="w-full flex items-center justify-between text-xs text-[var(--text-muted)] font-mono">
        <span className="font-pixel font-bold tracking-wider">
          PIXEL<span className="text-[var(--accent-primary)]">+</span> • ONE STORY. EVERY SCREEN.
        </span>
        <SoundControl variant="inline" />
      </footer>

      {/* Modals */}
      <AddProfileModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={(name, isKids, avatarConfig) => addProfile(name, isKids, avatarConfig)}
      />

      <EditProfileModal
        profile={
          editingProfile
            ? profiles.find((p) => p.id === editingProfile.id) ?? editingProfile
            : null
        }
        isOpen={editingProfile !== null}
        canDelete={profiles.length > 1}
        onClose={() => setEditingProfile(null)}
        onUpdate={(id, updates) => updateProfile(id, updates)}
        onUpdateAvatar={(id, avatarConfig) => updateProfileAvatar(id, avatarConfig)}
        onDelete={(id) => deleteProfile(id)}
      />
    </motion.div>
  )
}
