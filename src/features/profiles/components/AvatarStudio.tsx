import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Shuffle, RotateCcw, Save, X, Palette, User, Eye, Shirt, Gem, Image } from 'lucide-react'
import { Button } from '../../../components/common/Button'
import { AvatarRenderer } from './AvatarRenderer'
import { useReducedMotionPreference } from '../../../hooks/useReducedMotionPreference'
import { generateRandomAvatarConfig, createDefaultAvatarConfig } from '../utils/avatarRandom'
import {
  BASE_CHARACTERS,
  SKIN_TONES,
  HAIRSTYLES,
  HAIR_COLORS,
  EYE_STYLES,
  EYE_COLORS,
  OUTFITS,
  OUTFIT_COLORS,
  ACCESSORIES,
  BACKGROUNDS,
} from '../data/avatarOptions'
import type { AvatarConfig, AvatarStyle } from '../types'

// ─── Category Tabs ──────────────────────────────────────────────
const CATEGORIES = [
  { key: 'character', label: 'Character', icon: User },
  { key: 'skin', label: 'Skin Tone', icon: Palette },
  { key: 'hairstyle', label: 'Hair', icon: User },
  { key: 'haircolor', label: 'Hair Color', icon: Palette },
  { key: 'eyes', label: 'Eyes', icon: Eye },
  { key: 'eyecolor', label: 'Eye Color', icon: Eye },
  { key: 'outfit', label: 'Outfit', icon: Shirt },
  { key: 'outfitcolor', label: 'Outfit Color', icon: Palette },
  { key: 'accessories', label: 'Accessories', icon: Gem },
  { key: 'background', label: 'Background', icon: Image },
] as const

type CategoryKey = (typeof CATEGORIES)[number]['key']

// ─── Props ──────────────────────────────────────────────────────
export interface AvatarStudioProps {
  isOpen: boolean
  initialConfig?: AvatarConfig
  onClose: () => void
  onSave: (config: AvatarConfig) => void
}

// ─── Swatch Button ──────────────────────────────────────────────
const Swatch: React.FC<{
  color: string
  isSelected: boolean
  onClick: () => void
  label: string
}> = ({ color, isSelected, onClick, label }) => (
  <motion.button
    type="button"
    whileHover={{ scale: 1.12 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    aria-label={label}
    aria-pressed={isSelected}
    className={`w-9 h-9 rounded-full border-2 transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
      isSelected
        ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/40 scale-110'
        : 'border-[var(--border-subtle)] hover:border-white/30'
    }`}
    style={{ backgroundColor: color }}
  />
)

// ─── Option Pill ────────────────────────────────────────────────
const OptionPill: React.FC<{
  label: string
  isSelected: boolean
  onClick: () => void
}> = ({ label, isSelected, onClick }) => (
  <motion.button
    type="button"
    whileHover={{ scale: 1.04 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    aria-pressed={isSelected}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
      isSelected
        ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] shadow-md'
        : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-white/20 hover:text-[var(--text-primary)]'
    }`}
  >
    {label}
  </motion.button>
)

// ─── Avatar Studio Component ────────────────────────────────────
export const AvatarStudio: React.FC<AvatarStudioProps> = ({
  isOpen,
  initialConfig,
  onClose,
  onSave,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <AvatarStudioModal
          initialConfig={initialConfig}
          onClose={onClose}
          onSave={onSave}
        />
      )}
    </AnimatePresence>
  )
}

interface AvatarStudioModalProps {
  initialConfig?: AvatarConfig
  onClose: () => void
  onSave: (config: AvatarConfig) => void
}

const AvatarStudioModal: React.FC<AvatarStudioModalProps> = ({
  initialConfig,
  onClose,
  onSave,
}) => {
  const reducedMotion = useReducedMotionPreference()
  const [activeTab, setActiveTab] = useState<CategoryKey>('character')
  const [config, setConfig] = useState<AvatarConfig>(
    () => initialConfig ?? createDefaultAvatarConfig()
  )

  const updateConfig = useCallback((updates: Partial<AvatarConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }, [])

  const handleRandomise = useCallback(() => {
    const randomConfig = generateRandomAvatarConfig()
    // Preserve the existing id so edits don't lose identity
    setConfig(prev => ({ ...randomConfig, id: prev.id }))
  }, [])

  const handleReset = useCallback(() => {
    const defaults = initialConfig ?? createDefaultAvatarConfig()
    setConfig(defaults)
  }, [initialConfig])

  const handleSave = useCallback(() => {
    onSave(config)
  }, [config, onSave])

  // ─── Category Content Renderer ────────────────────────────────
  const renderCategoryContent = () => {
    switch (activeTab) {
      case 'character':
        return (
          <div className="flex flex-wrap gap-2.5">
            {BASE_CHARACTERS.map(c => (
              <OptionPill
                key={c.key}
                label={c.label}
                isSelected={config.characterStyle === c.key}
                onClick={() => updateConfig({ characterStyle: c.key as AvatarStyle })}
              />
            ))}
          </div>
        )
      case 'skin':
        return (
          <div className="flex flex-wrap gap-3">
            {SKIN_TONES.map(s => (
              <Swatch
                key={s.key}
                color={s.hex}
                isSelected={config.skinToneKey === s.key}
                onClick={() => updateConfig({ skinToneKey: s.key })}
                label={`Skin tone: ${s.key}`}
              />
            ))}
          </div>
        )
      case 'hairstyle':
        return (
          <div className="flex flex-wrap gap-2.5">
            {HAIRSTYLES.map(h => (
              <OptionPill
                key={h.key}
                label={h.label}
                isSelected={config.hairStyleKey === h.key}
                onClick={() => updateConfig({ hairStyleKey: h.key })}
              />
            ))}
          </div>
        )
      case 'haircolor':
        return (
          <div className="flex flex-wrap gap-3">
            {HAIR_COLORS.map(h => (
              <Swatch
                key={h.key}
                color={h.hex}
                isSelected={config.hairColorKey === h.key}
                onClick={() => updateConfig({ hairColorKey: h.key })}
                label={`Hair color: ${h.key}`}
              />
            ))}
          </div>
        )
      case 'eyes':
        return (
          <div className="flex flex-wrap gap-2.5">
            {EYE_STYLES.map(e => (
              <OptionPill
                key={e.key}
                label={e.label}
                isSelected={config.eyeStyleKey === e.key}
                onClick={() => updateConfig({ eyeStyleKey: e.key })}
              />
            ))}
          </div>
        )
      case 'eyecolor':
        return (
          <div className="flex flex-wrap gap-3">
            {EYE_COLORS.map(e => (
              <Swatch
                key={e.key}
                color={e.hex}
                isSelected={config.eyeColorKey === e.key}
                onClick={() => updateConfig({ eyeColorKey: e.key })}
                label={`Eye color: ${e.key}`}
              />
            ))}
          </div>
        )
      case 'outfit':
        return (
          <div className="flex flex-wrap gap-2.5">
            {OUTFITS.map(o => (
              <OptionPill
                key={o.key}
                label={o.label}
                isSelected={config.outfitKey === o.key}
                onClick={() => updateConfig({ outfitKey: o.key })}
              />
            ))}
          </div>
        )
      case 'outfitcolor':
        return (
          <div className="flex flex-wrap gap-3">
            {OUTFIT_COLORS.map(o => (
              <Swatch
                key={o.key}
                color={o.hex}
                isSelected={config.outfitColorKey === o.key}
                onClick={() => updateConfig({ outfitColorKey: o.key })}
                label={`Outfit color: ${o.key}`}
              />
            ))}
          </div>
        )
      case 'accessories':
        return (
          <div className="flex flex-wrap gap-2.5">
            {ACCESSORIES.map(a => (
              <OptionPill
                key={a.key}
                label={a.label}
                isSelected={
                  a.key === 'none'
                    ? !config.accessoryKey || config.accessoryKey === 'none'
                    : config.accessoryKey === a.key
                }
                onClick={() =>
                  updateConfig({
                    accessoryKey: a.key === 'none' ? undefined : a.key,
                    accessory: a.key === 'none' ? undefined : (a.key as AvatarConfig['accessory']),
                  })
                }
              />
            ))}
          </div>
        )
      case 'background':
        return (
          <div className="flex flex-wrap gap-3">
            {BACKGROUNDS.map(bg => (
              <motion.button
                type="button"
                key={bg.key}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  updateConfig({
                    backgroundKey: bg.key,
                    bgGradient: bg.css,
                  })
                }
                aria-label={`Background: ${bg.key}`}
                aria-pressed={config.backgroundKey === bg.key}
                className={`w-14 h-14 rounded-xl border-2 transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
                  config.backgroundKey === bg.key
                    ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/40'
                    : 'border-[var(--border-subtle)] hover:border-white/30'
                }`}
                style={{ background: bg.css }}
              />
            ))}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Avatar Studio"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Studio Panel */}
          <motion.div
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
            className="relative z-10 w-full max-w-4xl max-h-[90vh] bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
              <div>
                <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
                  Create Your Avatar
                </h2>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                  Make this profile yours.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close Avatar Studio"
                className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body — Two-column on desktop, stacked on mobile */}
            <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row">
              {/* LEFT: Avatar Preview */}
              <div className="lg:w-5/12 flex flex-col items-center justify-center gap-5 p-6 lg:p-8 bg-[var(--bg-main)]/50">
                <motion.div
                  key={config.characterStyle + (config.skinToneKey || '') + (config.hairStyleKey || '')}
                  initial={reducedMotion ? undefined : { scale: 0.97, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.25 }}
                >
                  <AvatarRenderer config={config} size="xl" />
                </motion.div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRandomise}
                    leftIcon={<Shuffle className="w-3.5 h-3.5" />}
                  >
                    Randomise
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    Reset
                  </Button>
                </div>
              </div>

              {/* RIGHT: Customization Panel */}
              <div className="lg:w-7/12 flex flex-col border-t lg:border-t-0 lg:border-l border-[var(--border-subtle)]">
                {/* Category Tabs */}
                <div className="flex overflow-x-auto px-4 pt-4 pb-2 gap-1 scrollbar-none border-b border-[var(--border-subtle)]">
                  {CATEGORIES.map(cat => {
                    const Icon = cat.icon
                    const isActive = activeTab === cat.key
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setActiveTab(cat.key)}
                        aria-selected={isActive}
                        role="tab"
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
                          isActive
                            ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {cat.label}
                      </button>
                    )
                  })}
                </div>

                {/* Options Panel */}
                <div className="flex-1 p-5 overflow-y-auto">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={reducedMotion ? undefined : { opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={reducedMotion ? undefined : { opacity: 0, x: -8 }}
                      transition={{ duration: 0.18 }}
                    >
                      <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-4">
                        {CATEGORIES.find(c => c.key === activeTab)?.label ?? ''}
                      </h3>
                      {renderCategoryContent()}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border-subtle)]">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSave}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Avatar
              </Button>
            </div>
          </motion.div>
        </div>
  )
}
