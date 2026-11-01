import React from 'react'
import type { Profile } from '../types'
import { ProfileCard } from './ProfileCard'
import { AddProfileCard } from './AddProfileCard'

export interface ProfileGridProps {
  profiles: Profile[]
  selectedProfileId: string | null
  isManaging: boolean
  onSelect: (profile: Profile) => void
  onEdit: (profile: Profile) => void
  onAddClick: () => void
}

export const ProfileGrid: React.FC<ProfileGridProps> = ({
  profiles,
  selectedProfileId,
  isManaging,
  onSelect,
  onEdit,
  onAddClick,
}) => {
  const isAnySelected = selectedProfileId !== null

  return (
    <div className="w-full flex items-center justify-center">
      {/* Responsive layout:
          - Mobile: 2-column grid (grid-cols-2 gap-4)
          - Tablet / Small Laptop: 3 or 4 columns (sm:grid-cols-3 md:flex md:flex-wrap md:justify-center md:gap-8)
          - Desktop: Balanced flex row (lg:flex-nowrap gap-6 lg:gap-8)
      */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap md:justify-center items-center gap-6 sm:gap-8 max-w-5xl mx-auto">
        {profiles.map((profile, idx) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            isSelected={selectedProfileId === profile.id}
            isAnySelected={isAnySelected}
            isManaging={isManaging}
            onSelect={onSelect}
            onEdit={onEdit}
            index={idx}
          />
        ))}

        {/* Add Profile Card (Hidden during Manage mode or when a profile is actively selected) */}
        {!isManaging && (
          <AddProfileCard
            onClick={onAddClick}
            isAnySelected={isAnySelected}
            index={profiles.length}
          />
        )}
      </div>
    </div>
  )
}
