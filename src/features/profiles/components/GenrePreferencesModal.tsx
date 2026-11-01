import React, { useState } from 'react'
import { Check, Sparkles, RotateCcw } from 'lucide-react'
import { Modal } from '../../../components/modals/Modal'
import { Button } from '../../../components/common/Button'
import { GENRES_LIST } from '../../../data/sampleContent'
import type { Profile } from '../types'

export interface GenrePreferencesModalProps {
  isOpen: boolean
  onClose: () => void
  profile: Profile
  currentGenres: string[]
  onSave: (genres: string[]) => void
  onReset: () => void
}

const AVAILABLE_GENRES = GENRES_LIST.filter((g) => g !== 'All Genres')

export const GenrePreferencesModal: React.FC<GenrePreferencesModalProps> = ({
  isOpen,
  onClose,
  profile,
  currentGenres,
  onSave,
  onReset,
}) => {
  const [selected, setSelected] = useState<string[]>(currentGenres)
  const [prevPropsGenres, setPrevPropsGenres] = useState(currentGenres)

  if (prevPropsGenres !== currentGenres) {
    setPrevPropsGenres(currentGenres)
    setSelected(currentGenres)
  }

  const handleToggle = (genre: string) => {
    setSelected((prev) => {
      const exists = prev.includes(genre)
      if (exists) {
        // Keep at least one genre
        if (prev.length <= 1) return prev
        return prev.filter((g) => g !== genre)
      } else {
        return [...prev, genre]
      }
    })
  }

  const handleSave = () => {
    onSave(selected)
    onClose()
  }

  const handleReset = () => {
    onReset()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Customise Interests • ${profile.name}`}
      size="md"
    >
      <div className="space-y-6">
        <div className="space-y-1">
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            Select your favourite genres to personalise your homepage, recommendations, and discovery shelves.
          </p>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--accent-secondary)] pt-1">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Recommendations adapt instantly to your selected interests</span>
          </div>
        </div>

        {/* Genre Grid Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {AVAILABLE_GENRES.map((genre) => {
            const isSelected = selected.includes(genre)
            return (
              <button
                key={genre}
                type="button"
                onClick={() => handleToggle(genre)}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)] text-[var(--text-primary)] shadow-sm'
                    : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-white/20 hover:text-[var(--text-primary)]'
                }`}
              >
                <span className="text-xs font-medium font-sans truncate mr-1.5">
                  {genre}
                </span>
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                    isSelected
                      ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[var(--accent-contrast)]'
                      : 'border-[var(--border-subtle)] bg-transparent'
                  }`}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
              </button>
            )
          })}
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              Save Preferences
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
