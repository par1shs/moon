import React, { useState } from 'react'
import {
  Laptop,
  Smartphone,
  Tablet,
  Tv,
  HardDrive,
  Pencil,
  Check,
  X,
  Trash2,
  Play,
  Pause,
  Cast,
  Clock,
  MapPin,
} from 'lucide-react'
import type { RegisteredDevice, DeviceCategory } from '../types'
import { Button } from '../../../components/common/Button'

export interface DeviceCardProps {
  device: RegisteredDevice
  onRename: (deviceId: string, newName: string) => void
  onRemove: (deviceId: string) => void
  onToggleStream: (deviceId: string) => void
  onHandoff: (deviceId: string) => void
}

const CATEGORY_ICONS: Record<DeviceCategory, React.ComponentType<{ className?: string }>> = {
  desktop: Laptop,
  mobile: Smartphone,
  tablet: Tablet,
  'smart-tv': Tv,
  'set-top-box': HardDrive,
}

function formatLastActive(iso: string, isActive: boolean): string {
  if (isActive) return 'Active now'
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return 'Recently'
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return 'Recently'
  }
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  onRename,
  onRemove,
  onToggleStream,
  onHandoff,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(device.name)
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false)

  const IconComponent = CATEGORY_ICONS[device.category] || Tv

  const handleSaveRename = () => {
    if (editName.trim()) {
      onRename(device.id, editName.trim())
    }
    setIsEditing(false)
  }

  return (
    <div
      data-testid={`device-card-${device.id}`}
      className={`relative rounded-3xl p-5 sm:p-6 transition-all border ${
        device.isActiveStream
          ? 'bg-[var(--bg-card)]/90 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
          : 'bg-[var(--bg-card)]/70 border-[var(--border-subtle)] hover:border-[var(--border-hover)]'
      } flex flex-col justify-between gap-5 select-none`}
    >
      {/* ─── Top Row: Icon, Status Badges & Menu ─── */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs ${
                device.isActiveStream
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)]'
              }`}
            >
              <IconComponent className="w-6 h-6" />
            </div>

            <div>
              {/* Friendly Name or Edit Input */}
              {isEditing ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    data-testid={`rename-device-input-${device.id}`}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="px-2 py-1 rounded-lg bg-[var(--bg-main)] border border-[var(--accent-primary)] text-sm font-bold text-[var(--text-primary)] focus:outline-none font-mono"
                    autoFocus
                  />
                  <button
                    type="button"
                    data-testid={`save-rename-btn-${device.id}`}
                    onClick={handleSaveRename}
                    className="p-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                    title="Save"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditName(device.name)
                      setIsEditing(false)
                    }}
                    className="p-1 rounded-lg bg-white/10 text-white/60 hover:text-white"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h4
                    data-testid={`device-name-${device.id}`}
                    className="font-display font-bold text-base sm:text-lg text-[var(--text-primary)]"
                  >
                    {device.name}
                  </h4>
                  <button
                    type="button"
                    data-testid={`rename-device-btn-${device.id}`}
                    onClick={() => setIsEditing(true)}
                    className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer"
                    title="Rename device"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              )}

              <p className="text-xs font-mono text-[var(--text-muted)]">
                {device.modelName} • {device.browserOrApp || device.os}
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {device.isCurrentDevice && (
              <span
                data-testid="this-device-badge"
                className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[var(--accent-primary)]/20 text-[var(--accent-secondary)] border border-[var(--accent-primary)]/40"
              >
                THIS DEVICE
              </span>
            )}

            <span
              data-testid={`device-status-badge-${device.id}`}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
                device.isActiveStream
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border-subtle)]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  device.isActiveStream ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                }`}
              />
              <span>{device.isActiveStream ? 'Active Stream' : 'Standby'}</span>
            </span>
          </div>
        </div>

        {/* ─── Current Playback Snapshot ─── */}
        {device.currentPlayback && (
          <div
            data-testid={`device-playback-${device.id}`}
            className="p-3.5 rounded-2xl bg-[var(--bg-elevated)]/60 border border-[var(--border-subtle)] flex items-center justify-between gap-3 text-xs font-mono"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-8 rounded-lg overflow-hidden bg-black shrink-0 border border-white/10">
                <img
                  src={device.currentPlayback.contentThumbnailUrl}
                  alt={device.currentPlayback.contentTitle}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="min-w-0">
                <span className="font-bold text-[var(--text-primary)] truncate block">
                  {device.currentPlayback.contentTitle}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] block truncate">
                  {device.currentPlayback.episodeTitle
                    ? `S${device.currentPlayback.seasonNumber || 1}:E${device.currentPlayback.episodeNumber || 1} • ${device.currentPlayback.episodeTitle}`
                    : `${device.currentPlayback.progressPercentage}% watched`}
                  {device.currentPlayback.remainingMinutes
                    ? ` (${device.currentPlayback.remainingMinutes}m left)`
                    : ''}
                </span>
              </div>
            </div>

            {/* Progress pill */}
            <div className="text-right shrink-0">
              <span className="font-bold text-[var(--accent-primary)] text-xs">
                {device.currentPlayback.progressPercentage}%
              </span>
              <div className="w-16 h-1 rounded-full bg-white/15 overflow-hidden mt-1">
                <div
                  className="h-full bg-[var(--accent-primary)] rounded-full"
                  style={{ width: `${device.currentPlayback.progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Metadata info: Last active & location */}
        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] pt-1">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-white/40" />
            <span>Last active: {formatLastActive(device.lastActiveISO, device.isActiveStream || device.isCurrentDevice)}</span>
          </span>

          {device.ipLocation && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-white/40" />
              <span>{device.ipLocation}</span>
            </span>
          )}
        </div>
      </div>

      {/* ─── Bottom Actions Row ─── */}
      <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {/* Toggle Active Stream */}
          <Button
            variant={device.isActiveStream ? 'outline' : 'secondary'}
            size="sm"
            data-testid={`toggle-stream-btn-${device.id}`}
            onClick={() => onToggleStream(device.id)}
            leftIcon={
              device.isActiveStream ? (
                <Pause className="w-3 h-3 text-amber-400" />
              ) : (
                <Play className="w-3 h-3 text-emerald-400" />
              )
            }
            className="text-xs font-mono"
          >
            {device.isActiveStream ? 'Pause Stream' : 'Simulate Stream'}
          </Button>

          {/* Handoff to this device */}
          {!device.isCurrentDevice && (
            <Button
              variant="ghost"
              size="sm"
              data-testid={`handoff-device-btn-${device.id}`}
              onClick={() => onHandoff(device.id)}
              leftIcon={<Cast className="w-3 h-3 text-[var(--accent-primary)]" />}
              className="text-xs font-mono text-[var(--accent-secondary)] hover:text-[var(--text-primary)]"
              title="Transfer active playback to this device"
            >
              Handoff to Device
            </Button>
          )}
        </div>

        {/* Remove device */}
        <div>
          {isConfirmingRemove ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-rose-300">Confirm?</span>
              <button
                type="button"
                data-testid={`confirm-remove-btn-${device.id}`}
                onClick={() => onRemove(device.id)}
                className="px-2 py-1 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-mono font-bold cursor-pointer"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingRemove(false)}
                className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white/70 text-xs font-mono cursor-pointer"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              data-testid={`remove-device-btn-${device.id}`}
              onClick={() => setIsConfirmingRemove(true)}
              className="p-2 rounded-xl text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Remove registered device"
              aria-label={`Remove ${device.name}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
