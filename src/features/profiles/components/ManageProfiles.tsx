import React, { useState } from 'react'
import { Sparkles, Trash2, Palette, Shield } from 'lucide-react'
import type { Profile, AvatarConfig } from '../types'
import { Modal } from '../../../components/modals/Modal'
import { Button } from '../../../components/common/Button'
import { AvatarRenderer } from './AvatarRenderer'
import { AvatarStudio } from './AvatarStudio'

// ─── Add Profile Modal ──────────────────────────────────────────
export interface AddProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (name: string, isKids: boolean, avatarConfig?: AvatarConfig) => void
}

export const AddProfileModal: React.FC<AddProfileModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('')
  const [isKids, setIsKids] = useState(false)
  const [showAvatarStudio, setShowAvatarStudio] = useState(false)
  const [pendingAvatarConfig, setPendingAvatarConfig] = useState<AvatarConfig | undefined>(undefined)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onAdd(name.trim(), isKids, pendingAvatarConfig)
    // Reset local state
    setName('')
    setIsKids(false)
    setPendingAvatarConfig(undefined)
    setShowAvatarStudio(false)
    onClose()
  }

  const handleClose = () => {
    setName('')
    setIsKids(false)
    setPendingAvatarConfig(undefined)
    setShowAvatarStudio(false)
    onClose()
  }

  const handleAvatarSave = (config: AvatarConfig) => {
    setPendingAvatarConfig(config)
    setShowAvatarStudio(false)
  }

  return (
    <>
      <Modal
        isOpen={isOpen && !showAvatarStudio}
        onClose={handleClose}
        title="Create your own PIXEL+ profile."
        description="Add a profile for another viewer to personalize stories and recommendations."
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          {/* Profile Name Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="add-profile-name"
              className="block text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)]"
            >
              Profile Name
            </label>
            <input
              id="add-profile-name"
              type="text"
              required
              autoFocus
              maxLength={24}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Maya, Rohan"
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm transition-all outline-none"
            />
          </div>

          {/* Kids Profile Toggle */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)]/60 border border-[var(--border-subtle)] flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[var(--accent-secondary)]" />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Kids Profile?
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Shows exclusively titles and experiences suitable for young viewers.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isKids}
              onClick={() => setIsKids(!isKids)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isKids ? 'bg-[var(--accent-primary)]' : 'bg-white/15'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isKids ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Avatar Studio Section */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-between gap-3">
            {pendingAvatarConfig ? (
              /* Show saved avatar preview */
              <div className="flex items-center gap-3">
                <AvatarRenderer config={pendingAvatarConfig} size="sm" isKids={isKids} />
                <div className="space-y-0.5">
                  <span className="text-xs font-mono uppercase tracking-wider text-[var(--accent-secondary)]">
                    Custom Avatar
                  </span>
                  <p className="text-xs text-[var(--text-muted)]">
                    Avatar saved. Click to edit again.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <Palette className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
                <span>Customize illustrated artwork &amp; accessories</span>
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAvatarStudio(true)}
              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
            >
              {pendingAvatarConfig ? 'Edit Avatar' : 'Open Avatar Studio'}
            </Button>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!name.trim()}>
              Save Profile
            </Button>
          </div>
        </form>
      </Modal>

      {/* Avatar Studio (full-screen overlay) */}
      <AvatarStudio
        isOpen={showAvatarStudio}
        initialConfig={pendingAvatarConfig}
        onClose={() => setShowAvatarStudio(false)}
        onSave={handleAvatarSave}
      />
    </>
  )
}

// ─── Edit Profile Modal ─────────────────────────────────────────
export interface EditProfileModalProps {
  profile: Profile | null
  isOpen: boolean
  canDelete: boolean
  onClose: () => void
  onUpdate: (id: string, updates: Partial<Pick<Profile, 'name' | 'isKidsProfile'>>) => void
  onUpdateAvatar: (id: string, avatarConfig: AvatarConfig) => void
  onDelete: (id: string) => void
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  profile,
  isOpen,
  canDelete,
  onClose,
  onUpdate,
  onUpdateAvatar,
  onDelete,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showAvatarStudio, setShowAvatarStudio] = useState(false)

  if (!profile) return null

  const handleAvatarSave = (newConfig: AvatarConfig) => {
    onUpdateAvatar(profile.id, newConfig)
    setShowAvatarStudio(false)
  }

  const handleClose = () => {
    setShowAvatarStudio(false)
    setConfirmDelete(false)
    onClose()
  }

  return (
    <>
      <Modal
        isOpen={isOpen && !confirmDelete && !showAvatarStudio}
        onClose={handleClose}
        title="Edit Profile"
        description="Modify viewer details, personalized avatar, and viewing restrictions."
        size="md"
      >
        <EditProfileForm
          key={profile.id}
          profile={profile}
          canDelete={canDelete}
          onClose={handleClose}
          onUpdate={onUpdate}
          onOpenAvatarStudio={() => setShowAvatarStudio(true)}
          onRequestDelete={() => setConfirmDelete(true)}
        />
      </Modal>

      {/* Confirmation Dialog before Deletion */}
      <Modal
        isOpen={confirmDelete && !showAvatarStudio}
        onClose={() => setConfirmDelete(false)}
        title="Delete Profile?"
        size="sm"
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Are you sure you want to delete{' '}
            <strong className="text-[var(--text-primary)]">{profile.name}</strong>?
            All viewing history and personalized watchlists will be permanently removed.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(false)}
            >
              Keep Profile
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => {
                onDelete(profile.id)
                setConfirmDelete(false)
                onClose()
              }}
            >
              Yes, Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Full-screen Avatar Studio overlay */}
      <AvatarStudio
        isOpen={showAvatarStudio}
        initialConfig={profile.avatarConfig}
        onClose={() => setShowAvatarStudio(false)}
        onSave={handleAvatarSave}
      />
    </>
  )
}

// ─── Edit Profile Form ──────────────────────────────────────────
interface EditProfileFormProps {
  profile: Profile
  canDelete: boolean
  onClose: () => void
  onUpdate: (id: string, updates: Partial<Pick<Profile, 'name' | 'isKidsProfile'>>) => void
  onOpenAvatarStudio: () => void
  onRequestDelete: () => void
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({
  profile,
  canDelete,
  onClose,
  onUpdate,
  onOpenAvatarStudio,
  onRequestDelete,
}) => {
  const [name, setName] = useState(profile.name)
  const [isKids, setIsKids] = useState(profile.isKidsProfile)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onUpdate(profile.id, {
      name: name.trim(),
      isKidsProfile: isKids,
    })
    onClose()
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 pt-1">
      {/* Prominent Active Avatar Section with Clear Edit Button */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col sm:flex-row items-center gap-5">
        <div className="relative group shrink-0">
          <AvatarRenderer config={profile.avatarConfig} size="lg" isKids={isKids} />
          <button
            type="button"
            onClick={onOpenAvatarStudio}
            aria-label="Change Avatar artwork"
            className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white"
          >
            <div className="w-10 h-10 rounded-full bg-[var(--bg-card)]/90 border border-white/20 flex items-center justify-center text-[var(--accent-primary)] shadow-md">
              <Palette className="w-4 h-4" />
            </div>
          </button>
        </div>

        <div className="flex-1 space-y-2.5 text-center sm:text-left">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--accent-secondary)]">
              Active Avatar
            </span>
            <h4 className="font-display font-bold text-lg text-[var(--text-primary)]">
              {name || profile.name}
            </h4>
            <p className="text-xs text-[var(--text-muted)]">
              Original illustrated character &amp; palette
            </p>
          </div>

          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenAvatarStudio}
              leftIcon={<Palette className="w-4 h-4 text-[var(--accent-primary)]" />}
              className="border-[var(--border-hover)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 text-[var(--text-primary)] font-medium"
            >
              Change Avatar
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Name Input */}
      <div className="space-y-1.5">
        <label
          htmlFor="edit-profile-name"
          className="block text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)]"
        >
          Profile Name
        </label>
        <input
          id="edit-profile-name"
          type="text"
          required
          maxLength={24}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] text-sm transition-all outline-none"
        />
      </div>

      {/* Kids Profile Switch */}
      <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)]/60 border border-[var(--border-subtle)] flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Kids Profile Safe Mode
          </span>
          <p className="text-xs text-[var(--text-muted)]">
            Restricts catalogue to curated family and children content.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={isKids}
          onClick={() => setIsKids(!isKids)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            isKids ? 'bg-[var(--accent-primary)]' : 'bg-white/15'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              isKids ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Delete Action (Protected if last remaining) */}
      <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
        {canDelete ? (
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onRequestDelete}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Delete Profile
          </Button>
        ) : (
          <span className="text-xs font-mono text-[var(--text-muted)]">
            Last remaining profile cannot be removed.
          </span>
        )}

        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={!name.trim()}>
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  )
}
