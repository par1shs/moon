import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Laptop,
  Smartphone,
  Tablet,
  Tv,
  HardDrive,
  X,
  Plus,
} from 'lucide-react'
import type { DeviceCategory, RegisteredDevice } from '../types'
import { Button } from '../../../components/common/Button'
import { useReducedMotionPreference } from '../../../hooks/useReducedMotionPreference'

export interface AddDeviceModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (device: Omit<RegisteredDevice, 'id' | 'registeredDateISO' | 'lastActiveISO'>) => void
  profileName: string
}

const CATEGORY_OPTIONS: { id: DeviceCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'desktop', label: 'Desktop / PC', icon: Laptop },
  { id: 'mobile', label: 'Smartphone', icon: Smartphone },
  { id: 'tablet', label: 'Tablet', icon: Tablet },
  { id: 'smart-tv', label: 'Smart TV', icon: Tv },
  { id: 'set-top-box', label: 'Set-Top Box', icon: HardDrive },
]

export const AddDeviceModal: React.FC<AddDeviceModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  profileName,
}) => {
  const reducedMotion = useReducedMotionPreference()
  const [category, setCategory] = useState<DeviceCategory>('smart-tv')
  const [deviceName, setDeviceName] = useState<string>('')
  const [modelName, setModelName] = useState<string>('')
  const [simulatedCode] = useState<string>(() => {
    const num = Math.floor(100000 + Math.random() * 900000)
    return `${num.toString().slice(0, 3)}-${num.toString().slice(3)}`
  })

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const name = deviceName.trim() || `${profileName}'s ${category.replace('-', ' ').toUpperCase()}`
    const model = modelName.trim() || `${category.toUpperCase()} Demonstration Client`

    onAdd({
      name,
      category,
      modelName: model,
      browserOrApp: `PIXEL Client v2.4`,
      ipLocation: 'Simulated Local Network',
      isCurrentDevice: false,
      isActiveStream: false,
    })

    onClose()
  }

  return (
    <AnimatePresence>
      <div
        data-testid="add-device-modal"
        className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-device-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.95, y: reducedMotion ? 0 : 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.95, y: reducedMotion ? 0 : 16 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-2xl p-6 sm:p-8 space-y-6"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--accent-secondary)]">
                SIMULATED PROVISIONING
              </span>
            </div>
            <h3 id="add-device-title" className="font-display font-bold text-2xl text-[var(--text-primary)]">
              Register New Device
            </h3>
            <p className="text-xs font-mono text-[var(--text-muted)]">
              Link a television, set-top box or mobile client to profile: <strong>{profileName}</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category Selector */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] block">
                Select Device Category
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {CATEGORY_OPTIONS.map((opt) => {
                  const Icon = opt.icon
                  const isSelected = category === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      data-testid={`add-device-cat-${opt.id}`}
                      onClick={() => setCategory(opt.id)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--accent-primary)]/20 border-[var(--accent-primary)] text-[var(--accent-secondary)] font-bold shadow-xs'
                          : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <Icon className="w-4 h-4 mb-1" />
                      <span className="text-[10px] font-mono">{opt.label.split(' ')[0]}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Friendly Device Name Input */}
            <div className="space-y-1.5">
              <label htmlFor="device-friendly-name" className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] block">
                Friendly Device Name
              </label>
              <input
                id="device-friendly-name"
                data-testid="add-device-name-input"
                type="text"
                placeholder={category === 'smart-tv' ? 'e.g. Master Bedroom Sony Bravia' : 'e.g. Office iPad Air'}
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] font-mono"
              />
            </div>

            {/* Device Model / OS */}
            <div className="space-y-1.5">
              <label htmlFor="device-model-input" className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] block">
                Hardware Model / Platform
              </label>
              <input
                id="device-model-input"
                data-testid="add-device-model-input"
                type="text"
                placeholder="e.g. Sony Google TV 4K / Android 13"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] font-mono"
              />
            </div>

            {/* Simulated 6-Digit Pair Code Box */}
            <div className="p-4 rounded-2xl bg-[var(--bg-elevated)]/70 border border-[var(--border-subtle)] space-y-2 text-center">
              <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase block">
                Simulated Device Pairing PIN
              </span>
              <div className="font-mono font-black text-2xl tracking-widest text-[var(--accent-primary)] bg-[var(--bg-main)] py-2 rounded-xl border border-[var(--border-subtle)]">
                {simulatedCode}
              </div>
              <span className="text-[10px] font-mono text-[var(--text-muted)] block">
                Enter this code on the target television or set-top box client screen.
              </span>
            </div>

            {/* Submit Action */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                data-testid="add-device-submit-btn"
                leftIcon={<Plus className="w-4 h-4" />}
                className="w-full justify-center font-display font-bold"
              >
                Complete Registration
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
