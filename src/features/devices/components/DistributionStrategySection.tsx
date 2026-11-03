import React from 'react'
import { Compass } from 'lucide-react'

export const DistributionStrategySection: React.FC = () => {
  return (
    <div
      data-testid="distribution-strategy-section"
      className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)]/80 border border-[var(--border-subtle)] space-y-8 shadow-sm"
    >
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-[var(--accent-primary)]" />
            <h3 className="font-display font-bold text-xl text-[var(--text-primary)]">
              PIXEL Distribution Strategy Analysis
            </h3>
          </div>
          <p className="text-xs font-mono text-[var(--text-muted)]">
            Strategic framework balancing direct-to-consumer digital monetization with broad linear television reach.
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30 w-fit">
          ACADEMIC &amp; COMMERCIAL BLUEPRINT
        </span>
      </div>

      {/* ─── 6 Strategic Pillars ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs leading-relaxed">
        {/* Pillar 1 */}
        <div className="p-5 rounded-2xl bg-[var(--bg-elevated)]/50 border border-[var(--border-subtle)] space-y-2.5">
          <div className="flex items-center gap-2 font-display font-bold text-sm text-[var(--text-primary)]">
            <span className="w-6 h-6 rounded-lg bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] flex items-center justify-center font-mono text-xs">
              01
            </span>
            <span>Direct-to-Consumer (D2C) OTT Foundation</span>
          </div>
          <p className="text-[var(--text-secondary)]">
            By owning the web streaming platform directly, PIXEL captures 100% of subscriber revenue without app-store commission deductions, while gathering first-party viewer telemetry to inform content commissioning and ad targeting.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="p-5 rounded-2xl bg-[var(--bg-elevated)]/50 border border-[var(--border-subtle)] space-y-2.5">
          <div className="flex items-center gap-2 font-display font-bold text-sm text-[var(--text-primary)]">
            <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-mono text-xs">
              02
            </span>
            <span>Mobile &amp; Smart TV Living Room Ubiquity</span>
          </div>
          <p className="text-[var(--text-secondary)]">
            Expanding into native mobile apps (iOS / Android) and 10-foot television clients (Samsung Tizen, LG webOS, Google TV) addresses personal mobile commuter habits and multi-person living room primetime viewing under a single unified login.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="p-5 rounded-2xl bg-[var(--bg-elevated)]/50 border border-[var(--border-subtle)] space-y-2.5">
          <div className="flex items-center gap-2 font-display font-bold text-sm text-[var(--text-primary)]">
            <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono text-xs">
              03
            </span>
            <span>Cable &amp; DTH Operator Partnerships</span>
          </div>
          <p className="text-[var(--text-secondary)]">
            Rather than treating traditional television as obsolete, PIXEL partners with established satellite and cable distributors (Tata Play, Airtel, Jio, Hathway). This unlocks instant access to 60M+ Indian TV homes, leveraging established carrier billing infrastructure.
          </p>
        </div>

        {/* Pillar 4 */}
        <div className="p-5 rounded-2xl bg-[var(--bg-elevated)]/50 border border-[var(--border-subtle)] space-y-2.5">
          <div className="flex items-center gap-2 font-display font-bold text-sm text-[var(--text-primary)]">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono text-xs">
              04
            </span>
            <span>Unified Linear, Catch-up &amp; OTT Convergence</span>
          </div>
          <p className="text-[var(--text-secondary)]">
            A viewer watching a linear broadcast can seamlessly jump into the 7-day catch-up catalogue or explore full unedited director cuts on OTT with one remote click, creating a virtuous feedback loop between broadcast exposure and on-demand engagement.
          </p>
        </div>

        {/* Pillar 5 */}
        <div className="p-5 rounded-2xl bg-[var(--bg-elevated)]/50 border border-[var(--border-subtle)] space-y-2.5">
          <div className="flex items-center gap-2 font-display font-bold text-sm text-[var(--text-primary)]">
            <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-mono text-xs">
              05
            </span>
            <span>Tiered Multi-Screen Monetization</span>
          </div>
          <p className="text-[var(--text-secondary)]">
            Simultaneous screen limits (Free: 1 screen, Standard: 2 screens, Premium: 4 screens) encourage household plan upgrades without penalizing individual mobile viewers, protecting Average Revenue Per User (ARPU) while offering a zero-cost entry tier.
          </p>
        </div>

        {/* Pillar 6 */}
        <div className="p-5 rounded-2xl bg-[var(--bg-elevated)]/50 border border-[var(--border-subtle)] space-y-2.5">
          <div className="flex items-center gap-2 font-display font-bold text-sm text-[var(--text-primary)]">
            <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-mono text-xs">
              06
            </span>
            <span>Coherent Brand &amp; UX Parity Across Screens</span>
          </div>
          <p className="text-[var(--text-secondary)]">
            "One Story. Every Screen." guarantees that color schemes (Midnight Slate &amp; Deep Indigo), typographic hierarchy, and viewing positions remain consistent whether navigating with a mouse, touch swipe, or television infrared remote control.
          </p>
        </div>
      </div>
    </div>
  )
}
