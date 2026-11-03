import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Volume2,
  VolumeX,
  Users,
  Pencil,
  ShieldCheck,
  RotateCcw,
  Code2,
  Sparkles,
  BarChart3,
  Tv,
  Film,
} from 'lucide-react'
import type { Profile } from '../../profiles/types'
import { AvatarRenderer } from '../../profiles/components/AvatarRenderer'
import { ThemeToggle } from '../../../components/common/ThemeToggle'
import { useAudio } from '../../audio/useAudio'
import { useReducedMotionPreference } from '../../../hooks/useReducedMotionPreference'
import { useSubscriptionTier } from '../../../hooks/useSubscriptionTier'
import { useCustomCursorSetting } from '../../cinematic/hooks/useCustomCursorSetting'

export interface ProfileMenuProps {
  isOpen: boolean
  onClose: () => void
  profile: Profile
  onSwitchProfile: () => void
  onManageProfile: () => void
  onNavigateToMembership?: () => void
  onNavigateToAdInsights?: () => void
  onNavigateToDevices?: () => void
  onReplayIntro?: () => void
  onOpenDevShell?: () => void
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({
  isOpen,
  onClose,
  profile,
  onSwitchProfile,
  onManageProfile,
  onNavigateToMembership,
  onNavigateToAdInsights,
  onNavigateToDevices,
  onReplayIntro,
  onOpenDevShell,
}) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotionPreference()
  const { isSoundEnabled, toggleSound } = useAudio()
  const { isCursorEnabled, toggleCursor } = useCustomCursorSetting()
  const { tier, plan, isFreeTier, toggleTier } = useSubscriptionTier(profile.id)

  // Handle click outside and Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          role="menu"
          aria-label="Profile and Settings Menu"
          initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.95, y: reducedMotion ? 0 : -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.95, y: reducedMotion ? 0 : -8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="absolute right-0 top-full mt-3 w-72 rounded-2xl bg-[var(--bg-card)]/95 backdrop-blur-xl border border-[var(--border-subtle)] shadow-[0_20px_48px_rgba(0,0,0,0.65)] p-3 z-50 select-none overflow-hidden"
        >
          {/* Active Profile Header */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--bg-elevated)]/60 border border-[var(--border-subtle)]">
            <div className="shrink-0 p-0.5 rounded-xl border border-[var(--accent-primary)]/40 bg-[var(--bg-main)]">
              <AvatarRenderer config={profile.avatarConfig} size="sm" isKids={profile.isKidsProfile} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-sm text-[var(--text-primary)] truncate">
                  {profile.name}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shrink-0" />
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                {profile.isKidsProfile ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-[var(--accent-primary)] shrink-0" />
                    <span className="text-[11px] font-mono text-[var(--accent-secondary)]">
                      Kids Safe Active
                    </span>
                  </>
                ) : (
                  <span className="text-[11px] font-mono text-[var(--text-muted)]">
                    Active Viewer
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action List */}
          <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] space-y-1">
            {/* Manage Profile */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onClose()
                onManageProfile()
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] active:bg-[var(--border-hover)] transition-colors duration-150 cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] group-hover:border-[var(--accent-primary)]/40 transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="block font-medium">Manage Profile</span>
                <span className="block text-xs text-[var(--text-muted)]">Edit avatar, name &amp; kids</span>
              </div>
            </button>

            {/* Switch Profile */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onClose()
                onSwitchProfile()
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] active:bg-[var(--border-hover)] transition-colors duration-150 cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] group-hover:border-[var(--accent-primary)]/40 transition-colors">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="block font-medium">Switch Profile</span>
                <span className="block text-xs text-[var(--text-muted)]">Return to Who's watching?</span>
              </div>
            </button>

            {/* Phase 6B: Subscription Tier & Plans Switcher */}
            <div className="space-y-1">
              <button
                type="button"
                role="menuitem"
                data-testid="toggle-subscription-tier-btn"
                onClick={() => {
                  toggleTier()
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] active:bg-[var(--border-hover)] transition-colors duration-150 cursor-pointer group"
                title="Click to cycle plans (Free -> Standard -> Premium)"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] group-hover:border-[var(--accent-primary)]/40 transition-colors">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div>
                    <span className="block font-medium">Subscription Tier</span>
                    <span className="block text-xs text-[var(--text-muted)]">
                      {plan.name} • {isFreeTier ? 'Ad-Supported' : '100% Ad-Free'}
                    </span>
                  </div>
                </div>

                <span
                  data-testid="subscription-tier-badge"
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase ${
                    tier === 'free'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : tier === 'standard'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {tier.toUpperCase()}
                </span>
              </button>

              {onNavigateToMembership && (
                <button
                  type="button"
                  role="menuitem"
                  data-testid="menu-membership-btn"
                  onClick={() => {
                    onClose()
                    onNavigateToMembership()
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-mono text-[var(--accent-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors cursor-pointer"
                >
                  <span>Manage Plans &amp; Billing</span>
                  <span>View All →</span>
                </button>
              )}

              {onNavigateToAdInsights && (
                <button
                  type="button"
                  role="menuitem"
                  data-testid="profile-ad-insights-link"
                  onClick={() => {
                    onClose()
                    onNavigateToAdInsights()
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-mono text-amber-300 hover:text-amber-200 hover:bg-[var(--border-subtle)] transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <BarChart3 className="w-3 h-3 text-amber-400" />
                    Advertising Insights
                  </span>
                  <span>Demo →</span>
                </button>
              )}

              {onNavigateToDevices && (
                <button
                  type="button"
                  role="menuitem"
                  data-testid="profile-devices-link"
                  onClick={() => {
                    onClose()
                    onNavigateToDevices()
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-mono text-sky-300 hover:text-sky-200 hover:bg-[var(--border-subtle)] transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Tv className="w-3 h-3 text-sky-400" />
                    Devices &amp; Screens
                  </span>
                  <span>Manage →</span>
                </button>
              )}
            </div>

            {/* Light / Dark Mode Toggle */}
            <ThemeToggle variant="row" />

            {/* Sound On/Off Toggle */}
            <div className="px-3 py-2.5 rounded-lg flex items-center justify-between gap-2 hover:bg-[var(--border-subtle)] transition-colors duration-150">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)]">
                  {!isSoundEnabled ? (
                    <VolumeX className="w-3.5 h-3.5 text-red-400" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  )}
                </div>
                <div>
                  <span className="block text-sm font-medium text-[var(--text-primary)]">
                    App Sound
                  </span>
                  <span className="block text-xs text-[var(--text-muted)]">
                    {!isSoundEnabled ? 'Audio effects muted' : 'Audio effects active'}
                  </span>
                </div>
              </div>

              {/* Accessible Switch Button */}
              <button
                type="button"
                role="switch"
                aria-checked={isSoundEnabled}
                aria-label={!isSoundEnabled ? 'Unmute application sound' : 'Mute application sound'}
                onClick={toggleSound}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
                  isSoundEnabled ? 'bg-[var(--accent-primary)]' : 'bg-[var(--text-muted)]/30'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isSoundEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Cinema Projector Cursor Toggle */}
            <div className="px-3 py-2.5 rounded-lg flex items-center justify-between gap-2 hover:bg-[var(--border-subtle)] transition-colors duration-150">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-primary)]">
                  <Film className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="block text-sm font-medium text-[var(--text-primary)]">
                    Projector Cursor
                  </span>
                  <span className="block text-xs text-[var(--text-muted)]">
                    {isCursorEnabled ? 'Cinema projector active' : 'Standard pointer'}
                  </span>
                </div>
              </div>

              {/* Accessible Switch Button */}
              <button
                type="button"
                role="switch"
                data-testid="toggle-cinema-cursor-btn"
                aria-checked={isCursorEnabled}
                aria-label={isCursorEnabled ? 'Disable cinema projector cursor' : 'Enable cinema projector cursor'}
                onClick={toggleCursor}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
                  isCursorEnabled ? 'bg-[var(--accent-primary)]' : 'bg-[var(--text-muted)]/30'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isCursorEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Replay Intro Option */}
            {onReplayIntro && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onClose()
                  onReplayIntro()
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors duration-150 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay Startup Intro</span>
              </button>
            )}

            {/* Dev Shell Option */}
            {onOpenDevShell && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onClose()
                  onOpenDevShell()
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors duration-150 cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Design System Dev Shell</span>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
