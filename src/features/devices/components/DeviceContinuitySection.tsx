import React, { useState } from 'react'
import {
  Cast,
  ArrowRight,
  Tv,
  Smartphone,
  Laptop,
  CheckCircle2,
} from 'lucide-react'
import type { RegisteredDevice } from '../types'
import type { ViewingHistoryItem } from '../../../types'
import { Button } from '../../../components/common/Button'
import { ALL_DISCOVERY_TITLES } from '../../../data/sampleContent'

export interface DeviceContinuitySectionProps {
  devices: RegisteredDevice[]
  currentDevice: RegisteredDevice
  continueWatching: ViewingHistoryItem[]
  onHandoff: (payload: {
    targetDeviceId: string
    contentId: string
    contentTitle: string
    contentThumbnailUrl: string
    progressPercentage: number
    remainingMinutes?: number
    episodeTitle?: string
    seasonNumber?: number
    episodeNumber?: number
  }) => { success: boolean; targetDeviceName: string }
}

export const DeviceContinuitySection: React.FC<DeviceContinuitySectionProps> = ({
  devices,
  currentDevice,
  continueWatching,
  onHandoff,
}) => {
  const otherDevices = devices.filter((d) => d.id !== currentDevice.id)
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(
    otherDevices[0]?.id || ''
  )
  const [handoffFeedback, setHandoffFeedback] = useState<{
    targetDeviceName: string
    title: string
    progress: number
    remaining?: number
  } | null>(null)

  // Primary content to handoff: first item in continue watching or fallback featured
  const activeContinueItem = continueWatching[0]
  const matchedContent = activeContinueItem
    ? ALL_DISCOVERY_TITLES.find((c) => c.id === activeContinueItem.contentId)
    : ALL_DISCOVERY_TITLES[0]

  const contentTitle = matchedContent?.title || 'Signal in the Static'
  const contentThumbnail =
    matchedContent?.backdropUrl ||
    matchedContent?.posterUrl ||
    '/images/posters/cyberpunk_glitch_series_poster.png'
  const progressPercent = activeContinueItem?.progress || 65
  const remainingMins = activeContinueItem?.remainingMinutes || 18

  const handleExecuteHandoff = (targetId?: string) => {
    const target = targetId || selectedDeviceId || otherDevices[0]?.id
    if (!target) return

    const result = onHandoff({
      targetDeviceId: target,
      contentId: matchedContent?.id || 'port-1',
      contentTitle,
      contentThumbnailUrl: contentThumbnail,
      progressPercentage: progressPercent,
      remainingMinutes: remainingMins,
      episodeTitle: activeContinueItem?.episodeTitle,
      seasonNumber: activeContinueItem?.seasonNumber,
      episodeNumber: activeContinueItem?.episodeNumber,
    })

    if (result.success) {
      setHandoffFeedback({
        targetDeviceName: result.targetDeviceName,
        title: contentTitle,
        progress: progressPercent,
        remaining: remainingMins,
      })
      setTimeout(() => setHandoffFeedback(null), 6000)
    }
  }

  return (
    <div
      data-testid="device-continuity-section"
      className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)]/80 border border-[var(--border-subtle)] space-y-6 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Cast className="w-5 h-5 text-[var(--accent-primary)]" />
            <h3 className="font-display font-bold text-xl text-[var(--text-primary)]">
              Cross-Device Viewing Continuity
            </h3>
          </div>
          <p className="text-xs font-mono text-[var(--text-muted)]">
            Seamlessly transfer active viewing sessions between personal handhelds and living room screens.
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[var(--accent-primary)]/15 text-[var(--accent-secondary)] border border-[var(--accent-primary)]/30 w-fit">
          SIMULATED CONTINUITY ENGINE
        </span>
      </div>

      {/* ─── Handoff Confirmation Alert ─── */}
      {handoffFeedback && (
        <div
          data-testid="handoff-confirmation-alert"
          className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-200 text-xs font-mono flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-sm text-emerald-300">
                Playback Transferred to {handoffFeedback.targetDeviceName}!
              </p>
              <p className="text-emerald-200/90 text-xs mt-0.5">
                Resuming <strong>"{handoffFeedback.title}"</strong> at {handoffFeedback.progress}% progress
                {handoffFeedback.remaining ? ` (${handoffFeedback.remaining}m remaining)` : ''}.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setHandoffFeedback(null)}
            className="text-emerald-400 hover:text-emerald-200 text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ─── Active Content & Device Bridge Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Source: Current Viewing Session */}
        <div className="p-5 rounded-2xl bg-[var(--bg-elevated)]/60 border border-[var(--border-subtle)] space-y-4">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[var(--text-muted)] uppercase">Source Device</span>
            <span className="font-bold text-emerald-400">ACTIVE SCREEN</span>
          </div>

          <div className="space-y-1">
            <h4 className="font-display font-bold text-base text-[var(--text-primary)]">
              {currentDevice.name}
            </h4>
            <p className="text-xs font-mono text-[var(--text-muted)]">
              {currentDevice.modelName} • {currentDevice.browserOrApp || currentDevice.os}
            </p>
          </div>

          {/* Active Title Snapshot */}
          <div className="p-3 rounded-xl bg-[var(--bg-main)]/80 border border-[var(--border-subtle)] flex items-center gap-3">
            <div className="w-14 h-9 rounded-lg overflow-hidden bg-black shrink-0 border border-white/10">
              <img
                src={contentThumbnail}
                alt={contentTitle}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-xs text-[var(--text-primary)] truncate block">
                {contentTitle}
              </span>
              <span className="text-[10px] font-mono text-[var(--text-muted)] block">
                {progressPercent}% watched • {remainingMins}m remaining
              </span>
            </div>
          </div>
        </div>

        {/* Transfer Controls Arrow / Bridge */}
        <div className="flex flex-col justify-center items-center p-6 rounded-2xl bg-[var(--bg-elevated)]/30 border border-dashed border-[var(--border-subtle)] space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/40 flex items-center justify-center text-[var(--accent-primary)] shadow-xs">
            <Cast className="w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-1 max-w-xs">
            <p className="font-display font-bold text-sm text-[var(--text-primary)]">
              Simulate Handoff
            </p>
            <p className="text-[11px] font-mono text-[var(--text-muted)]">
              Push playback to another demonstration screen while preserving exact timecode.
            </p>
          </div>

          {otherDevices.length > 0 ? (
            <div className="w-full space-y-2">
              <select
                data-testid="handoff-target-select"
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
              >
                {otherDevices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.category.toUpperCase()})
                  </option>
                ))}
              </select>

              <Button
                variant="primary"
                size="sm"
                data-testid="simulate-handoff-btn"
                onClick={() => handleExecuteHandoff()}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                className="w-full justify-center font-mono text-xs font-bold"
              >
                Handoff Playback
              </Button>
            </div>
          ) : (
            <span className="text-xs font-mono text-amber-300">
              No other devices registered. Add a device below to test handoff.
            </span>
          )}
        </div>

        {/* Target Devices Quick Handoff Buttons */}
        <div className="p-5 rounded-2xl bg-[var(--bg-elevated)]/60 border border-[var(--border-subtle)] space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[var(--text-muted)] uppercase">Registered Target Screens</span>
            <span className="text-[var(--text-muted)]">{otherDevices.length} available</span>
          </div>

          <div className="space-y-2">
            {otherDevices.slice(0, 3).map((dev) => (
              <button
                key={dev.id}
                type="button"
                data-testid={`quick-handoff-${dev.id}`}
                onClick={() => handleExecuteHandoff(dev.id)}
                className="w-full p-2.5 rounded-xl bg-[var(--bg-main)]/60 hover:bg-[var(--accent-primary)]/15 border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/40 flex items-center justify-between text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {dev.category === 'smart-tv' ? (
                    <Tv className="w-4 h-4 text-sky-400 shrink-0" />
                  ) : dev.category === 'mobile' ? (
                    <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Laptop className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[var(--text-primary)] block truncate">
                      {dev.name}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] block">
                      {dev.modelName}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-bold text-[var(--accent-secondary)] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                  <span>Send</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Prototype simulation disclaimer */}
      <div className="p-3 rounded-xl bg-[var(--bg-main)]/60 border border-[var(--border-subtle)] text-center">
        <span className="text-[11px] font-mono text-[var(--text-muted)]">
          Simulation Only: Demonstrates seamless session handoff and timecode preservation across screens. Real cloud synchronization requires persistent backend infrastructure.
        </span>
      </div>
    </div>
  )
}
