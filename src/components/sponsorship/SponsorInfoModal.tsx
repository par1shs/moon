import React from 'react'
import { Modal } from '../modals/Modal'
import { Button } from '../common/Button'
import type { SponsorInfo } from '../../types'
import { Sparkles, ExternalLink, ShieldCheck, Award } from 'lucide-react'

export interface SponsorInfoModalProps {
  isOpen: boolean
  onClose: () => void
  sponsor: SponsorInfo | null
}

export const SponsorInfoModal: React.FC<SponsorInfoModalProps> = ({
  isOpen,
  onClose,
  sponsor,
}) => {
  if (!sponsor) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="md"
      className="max-w-xl"
    >
      <div data-testid="sponsor-info-modal" className="space-y-6">
        {/* Header Hero */}
        <div className="relative aspect-[16/8] sm:aspect-[21/9] w-full rounded-2xl overflow-hidden bg-black border border-[var(--border-subtle)] shadow-inner">
          {sponsor.logoUrl ? (
            <img
              src={sponsor.logoUrl}
              alt={sponsor.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-500/20 via-black to-slate-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

          {/* Top Partnership Pill */}
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-amber-500 text-black shadow-md flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 fill-black" />
              OFFICIAL BRAND PARTNER
            </span>
          </div>

          {/* Brand Name & Tagline in Hero */}
          <div className="absolute bottom-3 left-3 right-3 space-y-1">
            <h3 className="font-display font-bold text-xl sm:text-2xl text-white drop-shadow">
              {sponsor.name}
            </h3>
            <p className="text-xs font-mono text-amber-300 drop-shadow">
              {sponsor.tagline}
            </p>
          </div>
        </div>

        {/* Partnership Overview */}
        <div className="p-4 rounded-xl bg-[var(--bg-elevated)]/60 border border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--accent-secondary)]">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-semibold uppercase tracking-wider">
              {sponsor.badgeText || 'COMMERCIAL SPONSORSHIP DISCLOSURE'}
            </span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {sponsor.name} is proud to partner with PIXEL+ to support independent cinematic productions, 4K HDR live telecasts, and interactive viewer broadcasts.
          </p>
        </div>

        {/* Brand Mission & Initiative */}
        <div className="space-y-2 text-xs text-[var(--text-muted)] font-mono">
          <div className="flex items-center gap-2 text-[var(--text-primary)]">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">Verified Creative Partner</span>
          </div>
          <p className="leading-relaxed">
            Sponsorship branding enables complimentary high-definition broadcasting on our free tier while remaining completely optional and respectful of uninterrupted viewing.
          </p>
        </div>

        {/* Prototype Disclaimer */}
        <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-[var(--text-muted)]">
          <strong>Prototype Simulation:</strong> Fictional brand campaign created for educational and design demonstration. No commercial relationship exists.
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)]">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>

          <a
            data-testid="sponsor-modal-cta"
            href={sponsor.sponsorUrl || '#'}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => {
              if (!sponsor.sponsorUrl || sponsor.sponsorUrl.includes('.fictional')) {
                e.preventDefault()
                onClose()
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-display font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <span>Learn More About {sponsor.name.split(' ')[0]}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </Modal>
  )
}
