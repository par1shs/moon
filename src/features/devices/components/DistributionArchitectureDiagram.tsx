import React, { useState } from 'react'
import {
  Globe,
  Radio,
  Tv,
  Smartphone,
  Laptop,
  HardDrive,
  ArrowDown,
  Workflow,
} from 'lucide-react'

export const DistributionArchitectureDiagram: React.FC = () => {
  const [activePathFilter, setActivePathFilter] = useState<'all' | 'ott' | 'broadcast'>('all')

  const isOttActive = activePathFilter === 'all' || activePathFilter === 'ott'
  const isBroadcastActive = activePathFilter === 'all' || activePathFilter === 'broadcast'

  return (
    <div
      data-testid="distribution-architecture-diagram"
      className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)]/80 border border-[var(--border-subtle)] space-y-8 shadow-sm"
    >
      {/* ─── Header & Interactive Path Filter ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Workflow className="w-5 h-5 text-[var(--accent-primary)]" />
            <h3 className="font-display font-bold text-xl text-[var(--text-primary)]">
              Multi-Tier Distribution Architecture
            </h3>
          </div>
          <p className="text-xs font-mono text-[var(--text-muted)]">
            End-to-end infrastructure topology connecting content ingest with dual delivery pipelines and multi-device endpoints.
          </p>
        </div>

        {/* Path Filter Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] self-start sm:self-auto">
          <button
            type="button"
            data-testid="arch-filter-all"
            onClick={() => setActivePathFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              activePathFilter === 'all'
                ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            All Paths
          </button>
          <button
            type="button"
            data-testid="arch-filter-ott"
            onClick={() => setActivePathFilter('ott')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              activePathFilter === 'ott'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            OTT / Internet
          </button>
          <button
            type="button"
            data-testid="arch-filter-broadcast"
            onClick={() => setActivePathFilter('broadcast')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              activePathFilter === 'broadcast'
                ? 'bg-amber-500 text-black shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Cable &amp; DTH Broadcast
          </button>
        </div>
      </div>

      {/* ─── Diagram Flowchart Canvas ─── */}
      <div className="space-y-6">
        {/* ============================================================== */}
        {/* TIER 1: CONTENT MASTER & INGESTION LAYER */}
        {/* ============================================================== */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-elevated)]/60 border border-[var(--border-subtle)] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)]" />
              <h4 className="font-display font-bold text-base text-[var(--text-primary)]">
                1. PIXEL Content Layer (Asset &amp; Telemetry Masters)
              </h4>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-white/10 text-white/80">
              ORIGIN MASTER STORAGE
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-xl bg-[var(--bg-main)]/70 border border-[var(--border-subtle)] text-xs font-mono space-y-1">
              <span className="font-bold text-[var(--text-primary)] block">Originals Catalogue</span>
              <span className="text-[10px] text-[var(--text-muted)] block">
                4K HDR Masters &amp; Dolby Atmos assets
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-main)]/70 border border-[var(--border-subtle)] text-xs font-mono space-y-1">
              <span className="font-bold text-[var(--text-primary)] block">Live Broadcast Feeds</span>
              <span className="text-[10px] text-[var(--text-muted)] block">
                Linear channels &amp; SDI live studio up-links
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-main)]/70 border border-[var(--border-subtle)] text-xs font-mono space-y-1">
              <span className="font-bold text-[var(--text-primary)] block">Catch-up Engine</span>
              <span className="text-[10px] text-[var(--text-muted)] block">
                7-day rolling broadcast recording library
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-main)]/70 border border-[var(--border-subtle)] text-xs font-mono space-y-1">
              <span className="font-bold text-[var(--text-primary)] block">Interactive Telemetry</span>
              <span className="text-[10px] text-[var(--text-muted)] block">
                Real-time polls, audience voting &amp; quizzes
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-main)]/70 border border-[var(--border-subtle)] text-xs font-mono space-y-1">
              <span className="font-bold text-[var(--text-primary)] block">Extended Editions</span>
              <span className="text-[10px] text-[var(--text-muted)] block">
                Director cuts &amp; bonus behind-the-scenes
              </span>
            </div>
          </div>
        </div>

        {/* Connecting Pipe / Divider */}
        <div className="flex items-center justify-center gap-4 text-xs font-mono text-[var(--text-muted)]">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--border-subtle)] to-transparent" />
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <ArrowDown className="w-3.5 h-3.5 text-[var(--accent-primary)] animate-bounce" />
            <span>Dual Ingestion &amp; Distribution Pathways</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--border-subtle)] to-transparent" />
        </div>

        {/* ============================================================== */}
        {/* TIER 2: DISTRIBUTION LAYER (DUAL PIPELINES) */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pathway A: Internet OTT Delivery */}
          <div
            className={`p-5 sm:p-6 rounded-2xl border transition-all space-y-4 ${
              isOttActive
                ? 'bg-sky-500/10 border-sky-500/40 shadow-md'
                : 'bg-[var(--bg-elevated)]/25 border-[var(--border-subtle)] opacity-40'
            }`}
          >
            <div className="flex items-center justify-between border-b border-sky-500/30 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-sky-400" />
                <h4 className="font-display font-bold text-base text-[var(--text-primary)]">
                  Pathway A: Internet OTT Distribution
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30">
                IP BROADBAND
              </span>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Global content delivery network (CDN) edge infrastructure delivering adaptive bitrate video with dynamic multi-tier tokens.
            </p>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-[var(--bg-card)]/80 border border-sky-500/30 text-xs font-mono space-y-1">
                <span className="font-bold text-sky-300 block">Multi-CDN Edge Delivery</span>
                <span className="text-[10px] text-[var(--text-muted)] block">
                  Dynamic routing across Akamai, Cloudflare &amp; CloudFront edge points of presence
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-card)]/80 border border-sky-500/30 text-xs font-mono space-y-1">
                <span className="font-bold text-sky-300 block">Adaptive Bitrate (ABR) Transcoding</span>
                <span className="text-[10px] text-[var(--text-muted)] block">
                  HLS / MPEG-DASH ladders (720p 2.5 Mbps &rarr; 1080p 6 Mbps &rarr; 4K 18.5 Mbps HEVC)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-card)]/80 border border-sky-500/30 text-xs font-mono space-y-1">
                <span className="font-bold text-sky-300 block">Widevine / FairPlay DRM &amp; Telemetry</span>
                <span className="text-[10px] text-[var(--text-muted)] block">
                  Hardware-enforced content protection &amp; active session concurrency control
                </span>
              </div>
            </div>
          </div>

          {/* Pathway B: Traditional Cable & DTH Broadcast */}
          <div
            className={`p-5 sm:p-6 rounded-2xl border transition-all space-y-4 ${
              isBroadcastActive
                ? 'bg-amber-500/10 border-amber-500/40 shadow-md'
                : 'bg-[var(--bg-elevated)]/25 border-[var(--border-subtle)] opacity-40'
            }`}
          >
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-amber-400" />
                <h4 className="font-display font-bold text-base text-[var(--text-primary)]">
                  Pathway B: Cable &amp; DTH Distribution
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                LINEAR SATELLITE &amp; CABLE
              </span>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Multiplexed broadcast delivery over geostationary satellite transponders and digital addressable cable headends.
            </p>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-[var(--bg-card)]/80 border border-amber-500/30 text-xs font-mono space-y-1">
                <span className="font-bold text-amber-300 block">DTH Satellite Transponders</span>
                <span className="text-[10px] text-[var(--text-muted)] block">
                  Ku-band satellite uplink to Tata Play &amp; Airtel Digital TV (DVB-S2 QPSK/8PSK)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-card)]/80 border border-amber-500/30 text-xs font-mono space-y-1">
                <span className="font-bold text-amber-300 block">MSO Digital Cable Headends</span>
                <span className="text-[10px] text-[var(--text-muted)] block">
                  QAM 256 digital multiplexing across Hathway &amp; DEN metropolitan cable networks
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-card)]/80 border border-amber-500/30 text-xs font-mono space-y-1">
                <span className="font-bold text-amber-300 block">Hybrid Reverse-EPG Return Path</span>
                <span className="text-[10px] text-[var(--text-muted)] block">
                  Broadband-assisted catch-up TV retrieval directly through the set-top box remote
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Connecting Pipe / Divider */}
        <div className="flex items-center justify-center gap-4 text-xs font-mono text-[var(--text-muted)]">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--border-subtle)] to-transparent" />
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <ArrowDown className="w-3.5 h-3.5 text-[var(--accent-primary)] animate-bounce" />
            <span>Viewer Terminal Endpoints</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--border-subtle)] to-transparent" />
        </div>

        {/* ============================================================== */}
        {/* TIER 3: VIEWER DEVICES LAYER */}
        {/* ============================================================== */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-elevated)]/60 border border-[var(--border-subtle)] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <h4 className="font-display font-bold text-base text-[var(--text-primary)]">
                3. Viewer Device Ecosystem (Multi-Screen Endpoints)
              </h4>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-white/10 text-white/80">
              TARGET ENDPOINTS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Desktop */}
            <div className="p-4 rounded-xl bg-[var(--bg-main)]/80 border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center gap-2 text-[var(--accent-primary)]">
                <Laptop className="w-5 h-5" />
                <span className="font-bold text-sm text-[var(--text-primary)]">Desktop &amp; Web</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                Chrome, Safari, Firefox, Edge via HTML5 WebCodecs &amp; EME DRM.
              </p>
              <div className="text-[10px] font-mono text-[var(--accent-secondary)]">
                Interactive: Mouse &amp; Keyboard
              </div>
            </div>

            {/* Mobile / Tablet */}
            <div className="p-4 rounded-xl bg-[var(--bg-main)]/80 border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <Smartphone className="w-5 h-5" />
                <span className="font-bold text-sm text-[var(--text-primary)]">Mobile &amp; Tablet</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                iOS and Android responsive touch clients with portrait/landscape viewing.
              </p>
              <div className="text-[10px] font-mono text-emerald-300">
                Interactive: Touch Gestures
              </div>
            </div>

            {/* Smart TV */}
            <div className="p-4 rounded-xl bg-[var(--bg-main)]/80 border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center gap-2 text-sky-400">
                <Tv className="w-5 h-5" />
                <span className="font-bold text-sm text-[var(--text-primary)]">Connected Smart TV</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                Samsung Tizen, LG webOS, Google TV &amp; Apple TV native 10-foot clients.
              </p>
              <div className="text-[10px] font-mono text-sky-300">
                Interactive: Remote D-Pad / OK
              </div>
            </div>

            {/* Set-Top Box */}
            <div className="p-4 rounded-xl bg-[var(--bg-main)]/80 border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center gap-2 text-purple-400">
                <HardDrive className="w-5 h-5" />
                <span className="font-bold text-sm text-[var(--text-primary)]">Hybrid Set-Top Box</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                Tata Play Binge, Airtel Xstream, JioFiber STB with carrier billing.
              </p>
              <div className="text-[10px] font-mono text-purple-300">
                Interactive: Operator Remote Hotkey
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Technical architecture notice */}
      <div className="p-3.5 rounded-xl bg-[var(--bg-main)]/60 border border-[var(--border-subtle)] text-center">
        <span className="text-[11px] font-mono text-[var(--text-muted)]">
          Architectural Notice: The Multi-CDN routing, adaptive bitrate ladder transcoding, and satellite/cable headend uplinks depicted in this topology model PIXEL's enterprise distribution specification. In this frontend prototype, simulated playback and state emulation represent these layers.
        </span>
      </div>
    </div>
  )
}
