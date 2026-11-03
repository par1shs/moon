import React, { useState } from 'react'
import type { Profile } from '../../profiles/types'
import { useSubscriptionTier } from '../../../hooks/useSubscriptionTier'
import { useAdDecisionEngine } from '../../../hooks/useAdDecisionEngine'
import {
  BarChart3,
  TrendingUp,
  RotateCcw,
  Layers,
  Eye,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  Clock,
} from 'lucide-react'
import { Button } from '../../../components/common/Button'

export interface AdInsightsPageProps {
  profile: Profile
  onNavigateHome?: () => void
}

export const AdInsightsPage: React.FC<AdInsightsPageProps> = ({ profile, onNavigateHome }) => {
  const { subscriptionTier } = useSubscriptionTier(profile.id)
  const {
    frequencyMap,
    resetFrequency,
    aggregateMetrics,
    campaigns,
  } = useAdDecisionEngine(profile.id, subscriptionTier)

  const [selectedFormat, setSelectedFormat] = useState<string>('all')

  const filteredCampaigns = campaigns.filter((c) => {
    if (selectedFormat === 'all') return true
    return c.format === selectedFormat
  })

  // Format distribution calculations
  const formatCounts = campaigns.reduce<Record<string, number>>((acc, c) => {
    acc[c.format] = (acc[c.format] || 0) + (c.simulatedMetrics?.impressions || 0)
    return acc
  }, {})

  const totalFormatImpressions = Object.values(formatCounts).reduce((a, b) => a + b, 0) || 1

  return (
    <div
      data-testid="ad-insights-dashboard"
      className="relative min-h-[calc(100vh-5rem)] w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300"
    >
      {/* ─── Page Header & Prototype Notice ─── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[var(--border-subtle)]">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              SIMULATED ANALYTICS
            </span>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              Profile: {profile.name} ({subscriptionTier.toUpperCase()} TIER)
            </span>
          </div>

          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[var(--text-primary)] tracking-tight">
            Advertising &amp; Sponsorship Insights
          </h1>

          <p className="text-sm text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            Centralised inventory decisioning, frequency tracking, and simulated commercial performance metrics. Prototype demonstration only.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            data-testid="reset-ad-frequency-btn"
            onClick={resetFrequency}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset Profile Ad Frequency
          </Button>

          {onNavigateHome && (
            <Button variant="primary" size="sm" onClick={onNavigateHome}>
              Back to Home
            </Button>
          )}
        </div>
      </div>

      {/* ─── Prototype Disclaimer Banner ─── */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs font-mono text-amber-200">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Internal Prototype Disclosure:</strong> All advertisers, campaigns, telemetry data, and impressions are simulated purely for frontend prototype modeling. No real advertising networks, tracking beacons, or payments are connected.
        </p>
      </div>

      {/* ─── Key Metrics KPI Grid ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Campaigns */}
        <div
          data-testid="kpi-total-campaigns"
          className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-1 shadow-sm"
        >
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-[11px] font-mono uppercase">Total Campaigns</span>
            <Layers className="w-4 h-4 text-[var(--accent-primary)]" />
          </div>
          <p className="font-display font-bold text-2xl text-[var(--text-primary)]">
            {aggregateMetrics.totalCampaigns}
          </p>
          <p className="text-[10px] font-mono text-[var(--text-muted)]">Fictional brands</p>
        </div>

        {/* Active Campaigns */}
        <div
          data-testid="kpi-active-campaigns"
          className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-1 shadow-sm"
        >
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-[11px] font-mono uppercase">Active Now</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="font-display font-bold text-2xl text-emerald-400">
            {aggregateMetrics.activeCampaigns}
          </p>
          <p className="text-[10px] font-mono text-emerald-400/80">Inventory ready</p>
        </div>

        {/* Total Impressions */}
        <div
          data-testid="kpi-total-impressions"
          className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-1 shadow-sm"
        >
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-[11px] font-mono uppercase">Impressions</span>
            <Eye className="w-4 h-4 text-sky-400" />
          </div>
          <p className="font-display font-bold text-2xl text-[var(--text-primary)]">
            {(aggregateMetrics.totalImpressions / 1000).toFixed(1)}k
          </p>
          <p className="text-[10px] font-mono text-sky-400/80">
            +{aggregateMetrics.localTotalImpressions} live profile views
          </p>
        </div>

        {/* Completed Views */}
        <div
          data-testid="kpi-completed-views"
          className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-1 shadow-sm"
        >
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-[11px] font-mono uppercase">Completed Views</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="font-display font-bold text-2xl text-[var(--text-primary)]">
            {(aggregateMetrics.totalCompletions / 1000).toFixed(1)}k
          </p>
          <p className="text-[10px] font-mono text-indigo-400/80">
            +{aggregateMetrics.localTotalCompletions} live completions
          </p>
        </div>

        {/* Completion Rate */}
        <div
          data-testid="kpi-completion-rate"
          className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-1 shadow-sm"
        >
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-[11px] font-mono uppercase">Completion %</span>
            <BarChart3 className="w-4 h-4 text-amber-400" />
          </div>
          <p className="font-display font-bold text-2xl text-amber-400">
            {aggregateMetrics.completionRate}
          </p>
          <p className="text-[10px] font-mono text-amber-400/80">Average across formats</p>
        </div>

        {/* Simulated Spend */}
        <div
          data-testid="kpi-simulated-spend"
          className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-1 shadow-sm"
        >
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-[11px] font-mono uppercase">Partner Value</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="font-display font-bold text-2xl text-emerald-400">
            ₹{(aggregateMetrics.totalSpendINR / 100000).toFixed(1)}L
          </p>
          <p className="text-[10px] font-mono text-[var(--text-muted)]">Simulated billing</p>
        </div>
      </div>

      {/* ─── Ad Format Distribution & Live Profile Frequency Panel ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ad Format Distribution */}
        <div
          data-testid="ad-format-distribution"
          className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-4 shadow-sm"
        >
          <div className="space-y-1">
            <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
              Ad Format Distribution
            </h3>
            <p className="text-xs text-[var(--text-muted)] font-mono">
              Share of aggregate simulated impressions
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { format: 'pre-roll', label: 'Pre-Roll Video', color: 'bg-sky-500' },
              { format: 'mid-roll', label: 'Mid-Roll Video', color: 'bg-indigo-500' },
              { format: 'programme-sponsorship', label: 'Live TV Sponsorship', color: 'bg-amber-500' },
              { format: 'sponsored-card', label: 'Sponsored Card', color: 'bg-pink-500' },
              { format: 'banner', label: 'Contextual Banner', color: 'bg-emerald-500' },
            ].map((item) => {
              const count = formatCounts[item.format] || 0
              const pct = ((count / totalFormatImpressions) * 100).toFixed(1)
              return (
                <div key={item.format} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[var(--text-secondary)]">{item.label}</span>
                    <span className="text-[var(--text-primary)] font-semibold">{pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden border border-white/5">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-300`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Live Profile Frequency State */}
        <div
          data-testid="local-frequency-panel"
          className="lg:col-span-2 p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                  Live Profile Ad Frequency State
                </h3>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                Persisted in LocalStorage per profile ({`junction_ad_frequency_v1_${profile.id}`})
              </p>
            </div>

            <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-white/5 border border-white/10 text-[var(--accent-secondary)]">
              {Object.keys(frequencyMap).length} Campaigns Tracked
            </span>
          </div>

          {Object.keys(frequencyMap).length === 0 ? (
            <div className="p-8 rounded-2xl bg-[var(--bg-elevated)]/50 border border-[var(--border-subtle)] text-center space-y-2">
              <Clock className="w-6 h-6 text-[var(--text-muted)] mx-auto opacity-60" />
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                No advertisements have played for {profile.name} yet.
              </p>
              <p className="text-xs text-[var(--text-muted)] font-mono max-w-md mx-auto">
                Play an on-demand movie on the Free tier to observe the deterministic ad rotation and frequency cap logging.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
              {Object.entries(frequencyMap).map(([campId, rec]) => {
                const camp = campaigns.find((c) => c.id === campId)
                return (
                  <div
                    key={campId}
                    data-testid={`frequency-record-${campId}`}
                    className="p-3 rounded-xl bg-[var(--bg-elevated)]/80 border border-[var(--border-subtle)] space-y-1.5 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--text-primary)] truncate max-w-[180px]">
                        {camp?.advertiserName || campId}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {camp?.format || 'ad'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                      <span>Impressions: <strong className="text-white">{rec.impressionCount}</strong>/{camp?.frequencyCap || 5}</span>
                      <span>Completed: <strong className="text-emerald-400">{rec.completedCount}</strong></span>
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] truncate">
                      Last: {rec.lastImpressionISO ? new Date(rec.lastImpressionISO).toLocaleTimeString() : 'N/A'}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Campaign Performance Table ─── */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
              Centralised Campaign Directory
            </h3>
            <p className="text-xs text-[var(--text-muted)] font-mono">
              Fictional campaign metadata, placement formats, and targeted subscription tiers
            </p>
          </div>

          {/* Format Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            {[
              { id: 'all', label: 'All Formats' },
              { id: 'pre-roll', label: 'Pre-Roll' },
              { id: 'mid-roll', label: 'Mid-Roll' },
              { id: 'programme-sponsorship', label: 'Live TV' },
              { id: 'sponsored-card', label: 'Sponsored' },
              { id: 'banner', label: 'Banner' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFormat(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  selectedFormat === f.id
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-bold shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Advertiser &amp; Campaign</th>
                <th className="py-3 px-3">Format</th>
                <th className="py-3 px-3">Target Tiers</th>
                <th className="py-3 px-3 text-right">Impressions</th>
                <th className="py-3 px-3 text-right">Completions</th>
                <th className="py-3 px-3 text-right">Completion Rate</th>
                <th className="py-3 px-3 text-center">Cap</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filteredCampaigns.map((camp) => {
                const completionPct =
                  camp.simulatedMetrics.impressions > 0
                    ? (
                        (camp.simulatedMetrics.completedViews /
                          camp.simulatedMetrics.impressions) *
                        100
                      ).toFixed(1)
                    : '0.0'

                return (
                  <tr
                    key={camp.id}
                    data-testid={`campaign-row-${camp.id}`}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3.5 px-3">
                      <div>
                        <span className="font-bold text-[var(--text-primary)] block">
                          {camp.advertiserName}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {camp.campaignName}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white border border-white/15">
                        {camp.format}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1">
                        {camp.targetTiers.map((t) => (
                          <span
                            key={t}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              t === 'free'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : t === 'standard'
                                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            }`}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-right text-[var(--text-primary)]">
                      {camp.simulatedMetrics.impressions.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-3 text-right text-emerald-400">
                      {camp.simulatedMetrics.completedViews.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-3 text-right font-bold text-[var(--accent-secondary)]">
                      {completionPct}%
                    </td>

                    <td className="py-3.5 px-3 text-center text-[var(--text-muted)]">
                      {camp.frequencyCap}/profile
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      {camp.isActive ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-red-950/60 text-red-300 border border-red-500/40">
                          EXPIRED
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
