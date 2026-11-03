import React, { useState } from 'react'
import {
  HardDrive,
  Radio,
  Tv,
  Layers,
  Users,
} from 'lucide-react'
import { DEFAULT_CABLE_DTH_PARTNERS } from '../data/defaultDevices'
import type { CableDTHPartner } from '../types'

export const CableDTHSection: React.FC = () => {
  const [selectedPartner, setSelectedPartner] = useState<CableDTHPartner>(
    DEFAULT_CABLE_DTH_PARTNERS[0]
  )

  return (
    <div
      data-testid="cable-dth-section"
      className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)]/80 border border-[var(--border-subtle)] space-y-8 shadow-sm"
    >
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-[var(--accent-primary)]" />
            <h3 className="font-display font-bold text-xl text-[var(--text-primary)]">
              Set-Top Box &amp; Cable / DTH Distribution
            </h3>
          </div>
          <p className="text-xs font-mono text-[var(--text-muted)]">
            Conceptual hybrid convergence model bridging linear broadcast television with PIXEL on-demand streaming.
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-500/15 text-sky-300 border border-sky-500/30 w-fit">
          PROPOSED INTEGRATION ARCHITECTURE
        </span>
      </div>

      {/* ─── 4 Pillars of Hybrid Cable & DTH Integration ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[var(--bg-elevated)]/50 border border-[var(--border-subtle)] space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Radio className="w-5 h-5" />
          </div>
          <h4 className="font-display font-bold text-sm text-[var(--text-primary)]">
            1. Linear Satellite &amp; Cable Multiplexing
          </h4>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            DVB-S2 (Ku-band transponder) and DVB-C (QAM) broadcast transmission delivering live channels to 50M+ living rooms with zero internet bandwidth or buffering.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-elevated)]/50 border border-[var(--border-subtle)] space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Layers className="w-5 h-5" />
          </div>
          <h4 className="font-display font-bold text-sm text-[var(--text-primary)]">
            2. Electronic Programme Guide (EPG)
          </h4>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Automated DVB-SI metadata synchronization projecting PIXEL 7-day schedules directly into the operator's primary television electronic programme guide.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-elevated)]/50 border border-[var(--border-subtle)] space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Tv className="w-5 h-5" />
          </div>
          <h4 className="font-display font-bold text-sm text-[var(--text-primary)]">
            3. Reverse-EPG Catch-up TV
          </h4>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Broadband return-path integration enabling viewers to navigate backward on their television remote to watch any broadcast aired over the previous 7 days on-demand.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-elevated)]/50 border border-[var(--border-subtle)] space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <h4 className="font-display font-bold text-sm text-[var(--text-primary)]">
            4. Hybrid STB OTT App Launcher
          </h4>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Pre-installed operator application with dedicated remote control hotkeys, single sign-on (SSO), and carrier billing consolidated onto monthly cable or DTH bills.
          </p>
        </div>
      </div>

      {/* ─── Proposed Operator Partnerships ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-display font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
            <Users className="w-4 h-4 text-[var(--accent-primary)]" />
            <span>Proposed Indian Operator Distribution Blueprints</span>
          </h4>
          <span className="text-xs font-mono text-[var(--text-muted)]">
            Total Potential Reach: 63+ Million Households
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {DEFAULT_CABLE_DTH_PARTNERS.map((partner) => {
            const isSelected = selectedPartner.id === partner.id
            return (
              <div
                key={partner.id}
                data-testid={`operator-card-${partner.id}`}
                onClick={() => setSelectedPartner(partner)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                  isSelected
                    ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)] shadow-md'
                    : 'bg-[var(--bg-elevated)]/50 border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-display font-bold text-sm text-[var(--text-primary)] block">
                    {partner.name}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-white/10 text-white/80 shrink-0">
                    {partner.type.split(' ')[0]}
                  </span>
                </div>

                <div className="space-y-1 text-xs font-mono">
                  <div className="flex items-center justify-between text-[var(--text-muted)]">
                    <span>Reach:</span>
                    <strong className="text-emerald-400">{partner.subscriberReach}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[var(--text-muted)]">
                    <span>Linear Channels:</span>
                    <strong className="text-[var(--text-primary)]">{partner.linearChannelsAllocated} HD Feeds</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[var(--text-muted)]">
                    {partner.carrierBillingSupported ? 'Carrier Billing: Yes' : 'Direct Sub Only'}
                  </span>
                  {partner.hotkeyRemoteIntegration && (
                    <span className="text-amber-300 font-bold">Remote Hotkey</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Selected Partner Deep-Dive Box */}
        {selectedPartner && (
          <div className="p-5 rounded-2xl bg-[var(--bg-elevated)]/70 border border-[var(--border-subtle)] space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
                <h5 className="font-display font-bold text-sm text-[var(--text-primary)]">
                  {selectedPartner.name} — Technical Architecture Specification
                </h5>
              </div>
              <span className="text-xs font-mono text-[var(--accent-secondary)]">
                Middleware: {selectedPartner.stbMiddleware}
              </span>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {selectedPartner.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-2 border-t border-[var(--border-subtle)]">
              <div>
                <span className="text-[var(--text-muted)] uppercase block text-[10px]">Distribution Type</span>
                <span className="font-bold text-[var(--text-primary)]">{selectedPartner.type}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] uppercase block text-[10px]">Audience Base</span>
                <span className="font-bold text-emerald-400">{selectedPartner.subscriberReach}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] uppercase block text-[10px]">Remote Hotkey</span>
                <span className="font-bold text-[var(--text-primary)]">
                  {selectedPartner.hotkeyRemoteIntegration ? 'Yes (PIXEL Button)' : 'In-Menu Launcher'}
                </span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] uppercase block text-[10px]">Billing Integration</span>
                <span className="font-bold text-purple-400">
                  {selectedPartner.carrierBillingSupported ? 'Unified Operator Invoicing' : 'Direct Subscription'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Conceptual Disclaimer */}
      <div className="p-3 rounded-xl bg-[var(--bg-main)]/60 border border-[var(--border-subtle)] text-center">
        <span className="text-[11px] font-mono text-[var(--text-muted)]">
          Academic Prototype Notice: The broadcast multiplexing, DVB-SI EPG integration and operator partnership models presented above describe PIXEL's conceptual enterprise distribution architecture. No live broadcast transponders or carrier agreements exist in this prototype.
        </span>
      </div>
    </div>
  )
}
