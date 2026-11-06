import React, { useState } from 'react'
import {
  Tv,
  Smartphone,
  Laptop,
  Tablet,
  Plus,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react'
import type { Profile } from '../../profiles/types'
import type { ContentMetadata } from '../../../types'
import { useDeviceManagement } from '../hooks/useDeviceManagement'
import { useSubscriptionTier } from '../../../hooks/useSubscriptionTier'
import { useViewingHistory } from '../../../hooks/useViewingHistory'
import { DeviceCard } from '../components/DeviceCard'
import { AddDeviceModal } from '../components/AddDeviceModal'
import { SmartTVPreviewModal } from '../components/SmartTVPreviewModal'
import { DeviceContinuitySection } from '../components/DeviceContinuitySection'
import { CableDTHSection } from '../components/CableDTHSection'
import { DistributionArchitectureDiagram } from '../components/DistributionArchitectureDiagram'
import { DistributionStrategySection } from '../components/DistributionStrategySection'
import { DEVICE_CATEGORIES_META } from '../data/defaultDevices'
import { Button } from '../../../components/common/Button'

export interface DeviceExperiencePageProps {
  profile: Profile
  onNavigateToMembership?: () => void
  onSelectContent?: (content: ContentMetadata) => void
  onPlayContent?: (content: ContentMetadata) => void
}

export const DeviceExperiencePage: React.FC<DeviceExperiencePageProps> = ({
  profile,
  onNavigateToMembership,
  onSelectContent,
  onPlayContent,
}) => {
  const { tier: subscriptionTier, plan } = useSubscriptionTier(profile.id)
  const { history } = useViewingHistory(profile.id)

  const {
    devices,
    currentDevice,
    screenAllowance,
    activeScreens,
    maxScreens,
    isLimitReached,
    renameDevice,
    removeDevice,
    addDevice,
    toggleDeviceStream,
    simulateHandoff,
    resetDevices,
  } = useDeviceManagement(profile.id, subscriptionTier)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isTVPreviewOpen, setIsTVPreviewOpen] = useState(false)
  const [limitErrorMessage, setLimitErrorMessage] = useState<string | null>(null)

  const handleToggleStreamWithFeedback = (deviceId: string) => {
    const res = toggleDeviceStream(deviceId)
    if (!res.success) {
      setLimitErrorMessage(res.error || 'Simultaneous screen limit reached for your plan.')
      setTimeout(() => setLimitErrorMessage(null), 6000)
    } else {
      setLimitErrorMessage(null)
    }
  }

  return (
    <div
      data-testid="device-experience-page"
      className="min-h-screen rounded-3xl border border-[var(--devices-container-border)] bg-[var(--devices-container-bg)] backdrop-blur-md text-[var(--text-primary)] pb-24 pt-10 sm:pt-12 px-5 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-12 font-sans shadow-2xl transition-all duration-300 transform-gpu"
      style={{ transform: 'translateZ(0)' }}
    >
      {/* ─── 1. Header & Simultaneous Screen Allowance Pill ─── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[var(--border-subtle)] pb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-xl sm:text-2xl text-[var(--accent-primary)] tracking-wider">
              PIXEL
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--text-muted)]">
              • DISTRIBUTION &amp; DEVICES
            </span>
          </div>

          <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight text-[var(--text-primary)]">
            One Story. Every Screen.
          </h1>

          <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-3xl leading-relaxed">
            Experience multi-screen continuity across web browsers, mobile touch clients, living room 10-foot Smart TVs, and hybrid cable/DTH set-top boxes.
          </p>
        </div>

        {/* ─── Screen Limit Gauge & Plan Entitlement Card ─── */}
        <div
          data-testid="screen-limit-indicator"
          className="p-5 rounded-2xl bg-[var(--bg-card)]/90 border border-[var(--border-subtle)] space-y-3 min-w-[280px] sm:min-w-[320px] shadow-sm shrink-0"
        >
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[var(--text-muted)] uppercase tracking-wider">Simultaneous Screens</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                subscriptionTier === 'free'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : subscriptionTier === 'standard'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {plan.name} Tier
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-black text-2xl text-[var(--text-primary)]">
                {activeScreens}
              </span>
              <span className="text-sm font-mono text-[var(--text-muted)]">
                / {maxScreens} Screen{maxScreens > 1 ? 's' : ''} in Use
              </span>
            </div>

            <span className="text-xs font-mono font-bold text-emerald-400">
              {screenAllowance.remainingScreens} Available
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isLimitReached ? 'bg-amber-400' : 'bg-[var(--accent-primary)]'
              }`}
              style={{
                width: `${Math.min(100, Math.max(10, (activeScreens / maxScreens) * 100))}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] pt-1">
            <span>Profile: <strong>{profile.name}</strong></span>
            {onNavigateToMembership && (
              <button
                type="button"
                data-testid="upgrade-screens-link"
                onClick={onNavigateToMembership}
                className="text-[var(--accent-secondary)] hover:text-[var(--text-primary)] font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Upgrade Screens</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Screen Limit Warning Alert (When Limit Reached or Exceeded) ─── */}
      {(isLimitReached || limitErrorMessage) && (
        <div
          data-testid="screen-limit-warning"
          className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/35 text-amber-900 dark:text-amber-200 text-xs font-mono flex items-start sm:items-center justify-between gap-4 animate-in fade-in"
        >
          <div className="flex items-start sm:items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div className="space-y-0.5">
              <span className="font-bold text-amber-950 dark:text-amber-300 block">
                Simultaneous Screen Allowance Limit Reached ({activeScreens}/{maxScreens})
              </span>
              <p className="text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
                {limitErrorMessage ||
                  `Your ${plan.name} plan is capped at ${maxScreens} active screen${maxScreens > 1 ? 's' : ''}. Upgrade to Standard (2 screens) or Premium (4 screens) to stream simultaneously across multiple household devices.`}
              </p>
            </div>
          </div>

          {onNavigateToMembership && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToMembership}
              className="text-xs font-mono text-amber-900 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/20 shrink-0"
            >
              Compare Plans
            </Button>
          )}
        </div>
      )}

      {/* ─── 2. Smart TV 10-Foot Mode Showcase Banner ─── */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-10 border border-[var(--border-subtle)] bg-[var(--devices-banner-bg)] flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl transition-colors duration-300">
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center gap-2">
            <Tv className="w-5 h-5 text-[var(--accent-primary)]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent-secondary)]">
              LIVING ROOM EXPERIENCE
            </span>
          </div>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl text-[var(--text-primary)] tracking-tight">
            Smart TV 10-Foot Preview Mode
          </h2>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Experience PIXEL on the big screen with our genuine television layout, large content artwork, remote-control D-pad arrow navigation, and visible focus states built for living room viewing.
          </p>

          <div className="flex items-center gap-4 pt-2">
            <Button
              variant="primary"
              size="lg"
              data-testid="launch-smart-tv-preview-btn"
              onClick={() => setIsTVPreviewOpen(true)}
              leftIcon={<Tv className="w-4 h-4" />}
              className="font-display font-bold text-sm tracking-wide shadow-lg shadow-[var(--accent-primary)]/20 cursor-pointer"
            >
              Launch Smart TV Preview
            </Button>

            <span className="text-xs font-mono text-[var(--text-muted)] hidden sm:inline">
              Supports Arrow Keys (▲▼◄►) &amp; Enter/OK
            </span>
          </div>
        </div>

        {/* TV Graphic Mockup Badge */}
        <div className="w-48 sm:w-64 aspect-video rounded-2xl bg-black/80 border-2 border-white/20 p-2 flex flex-col justify-between shadow-2xl shrink-0">
          <div className="flex items-center justify-between text-[9px] font-mono text-white/50">
            <span>PIXEL TV OS</span>
            <span>4K HDR 60Hz</span>
          </div>
          <div className="text-center space-y-1">
            <span className="font-pixel text-lg text-[var(--accent-primary)] block">PIXEL</span>
            <span className="text-[10px] font-mono text-white/70 block">D-Pad Ready UI</span>
          </div>
          <div className="flex justify-center gap-1">
            <span className="w-8 h-1 rounded-full bg-[var(--accent-primary)]" />
            <span className="w-8 h-1 rounded-full bg-white/20" />
            <span className="w-8 h-1 rounded-full bg-white/20" />
          </div>
        </div>
      </div>

      {/* ─── 3. Four Device Categories Overview Grid ─── */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="font-display font-bold text-2xl text-[var(--text-primary)]">
            Supported Device Ecosystem
          </h2>
          <p className="text-xs sm:text-sm font-mono text-[var(--text-muted)]">
            Explore PIXEL's dedicated presentation tiers tailored to physical viewing distance and input modalities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {Object.values(DEVICE_CATEGORIES_META).slice(0, 4).map((meta) => {
            const Icon =
              meta.id === 'desktop'
                ? Laptop
                : meta.id === 'mobile'
                ? Smartphone
                : meta.id === 'tablet'
                ? Tablet
                : Tv

            return (
              <div
                key={meta.id}
                data-testid={`category-card-${meta.id}`}
                className="p-5 sm:p-6 rounded-3xl bg-[var(--bg-card)]/80 border border-[var(--border-subtle)] flex flex-col justify-between gap-4 space-y-3"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-primary)]">
                    <Icon className="w-5 h-5" />
                  </div>

                  <div>
                    <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                      {meta.title}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-1">
                      {meta.subtitle}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2 text-[11px] font-mono text-[var(--text-muted)]">
                  <div>
                    <span className="block uppercase text-[10px] text-[var(--text-muted)]">Resolution</span>
                    <strong className="text-[var(--text-primary)]">{meta.maxResolution.split(' ')[0]}</strong>
                  </div>
                  <div>
                    <span className="block uppercase text-[10px] text-[var(--text-muted)]">Interaction</span>
                    <span className="text-[var(--text-secondary)]">{meta.interactionModel.split(' ')[0]}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── 4. Cross-Device Viewing Continuity & Handoff ─── */}
      <DeviceContinuitySection
        devices={devices}
        currentDevice={currentDevice}
        continueWatching={history}
        onHandoff={simulateHandoff}
      />

      {/* ─── 5. Registered Devices Management Section ─── */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-display font-bold text-2xl text-[var(--text-primary)]">
              Registered Devices &amp; Active Screens
            </h2>
            <p className="text-xs sm:text-sm font-mono text-[var(--text-muted)]">
              Manage household screens authorized for <strong>{profile.name}</strong> • Screen allowance enforced per plan.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              data-testid="reset-devices-btn"
              onClick={resetDevices}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              className="font-mono text-xs"
              title="Reset demonstration devices to defaults"
            >
              Reset Devices
            </Button>

            <Button
              variant="primary"
              size="sm"
              data-testid="add-device-btn"
              onClick={() => setIsAddModalOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="font-mono text-xs font-bold"
            >
              Add Device
            </Button>
          </div>
        </div>

        {/* Devices Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {devices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              onRename={renameDevice}
              onRemove={removeDevice}
              onToggleStream={handleToggleStreamWithFeedback}
              onHandoff={(targetId) => {
                simulateHandoff({
                  targetDeviceId: targetId,
                  contentId: 'port-1',
                  contentTitle: 'Signal in the Static',
                  contentThumbnailUrl: '/images/posters/cyberpunk_glitch_series_poster.png',
                  progressPercentage: 65,
                  remainingMinutes: 18,
                })
              }}
            />
          ))}
        </div>
      </div>

      {/* ─── 6. Cable & DTH Conceptual Operator Integration ─── */}
      <CableDTHSection />

      {/* ─── 7. Multi-Tier Distribution Architecture Diagram ─── */}
      <DistributionArchitectureDiagram />

      {/* ─── 8. Distribution Strategy Analysis ─── */}
      <DistributionStrategySection />

      {/* ─── Modals: Add Device & Smart TV Preview ─── */}
      <AddDeviceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addDevice}
        profileName={profile.name}
      />

      <SmartTVPreviewModal
        isOpen={isTVPreviewOpen}
        onClose={() => setIsTVPreviewOpen(false)}
        profile={profile}
        onSelectContent={onSelectContent}
        onPlayContent={onPlayContent}
      />
    </div>
  )
}
