import React from 'react'
import { motion } from 'motion/react'
import { Pencil } from 'lucide-react'
import type { Profile } from '../types'
import { AvatarRenderer } from './AvatarRenderer'
import { useReducedMotionPreference } from '../../../hooks/useReducedMotionPreference'

export interface ProfileCardProps {
  profile: Profile
  isSelected: boolean
  isAnySelected: boolean
  isManaging: boolean
  onSelect: (profile: Profile) => void
  onEdit: (profile: Profile) => void
  index: number
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  isSelected,
  isAnySelected,
  isManaging,
  onSelect,
  onEdit,
  index,
}) => {
  const reducedMotion = useReducedMotionPreference()

  const handleClick = () => {
    if (isManaging) {
      onEdit(profile)
    } else {
      onSelect(profile)
    }
  }

  // Animation states
  const isFadedOut = isAnySelected && !isSelected

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: reducedMotion ? 0 : 20 }}
      animate={{
        opacity: isFadedOut ? 0 : 1,
        scale: isSelected ? (reducedMotion ? 1 : 1.06) : isFadedOut ? 0.94 : 1,
        y: 0,
      }}
      transition={{
        duration: reducedMotion ? 0.2 : 0.45,
        delay: isAnySelected ? 0 : index * 0.07,
        ease: [0.2, 0, 0, 1],
      }}
      whileHover={
        isAnySelected || reducedMotion
          ? undefined
          : {
              y: -6,
              scale: 1.04,
              transition: { duration: 0.22, ease: 'easeOut' },
            }
      }
      whileTap={isAnySelected || reducedMotion ? undefined : { scale: 0.98 }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
      data-testid={`profile-card-${profile.name.toLowerCase()}`}
      aria-label={
        isManaging
          ? `Edit profile ${profile.name}`
          : `Select profile ${profile.name}${profile.isKidsProfile ? ' (Kids)' : ''}`
      }
      className="group relative flex flex-col items-center gap-3.5 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--bg-main)] rounded-2xl select-none"
    >
      {/* Avatar Box with Border & Hover Lighting */}
      <div
        className={`relative rounded-2xl p-1 transition-all duration-300 ${
          isSelected
            ? 'ring-4 ring-[var(--accent-primary)] shadow-[var(--shadow-accent-glow)]'
            : isManaging
            ? 'border-2 border-dashed border-[var(--border-hover)] group-hover:border-[var(--accent-primary)]'
            : 'border-2 border-transparent group-hover:border-[var(--accent-primary)]/60'
        }`}
      >
        <div className="overflow-hidden rounded-xl">
          <div className="transition-transform duration-500 group-hover:scale-105">
            <AvatarRenderer
              config={profile.avatarConfig}
              size="lg"
              isKids={profile.isKidsProfile}
            />
          </div>
        </div>

        {/* Edit Pencil Overlay during Manage Mode */}
        {isManaging && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[2px] rounded-xl transition-opacity duration-200 group-hover:bg-black/40">
            <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] border border-white/20 flex items-center justify-center text-[var(--text-primary)] shadow-lg group-hover:scale-110 group-hover:text-[var(--accent-primary)] transition-all">
              <Pencil className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>

      {/* Profile Name & Sub-badge */}
      <div className="flex flex-col items-center gap-0.5 text-center">
        <span className="font-display font-medium text-sm sm:text-base text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors duration-200">
          {profile.name}
        </span>

        {profile.isKidsProfile && !isManaging && (
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent-secondary)] opacity-80">
            Kids Safe
          </span>
        )}

        {isManaging && (
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent-primary)] flex items-center gap-1 group-hover:underline">
            <Pencil className="w-3 h-3" /> Edit Profile
          </span>
        )}
      </div>
    </motion.div>
  )
}
