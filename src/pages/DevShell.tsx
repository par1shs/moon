import React, { useState } from 'react'
import { motion } from 'motion/react'
import {
  Play,
  Bookmark,
  Sparkles,
  Layers,
  Palette,
  Maximize2,
  Info,
} from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { BASE_PALETTE } from '../styles/tokens'
import {
  BrandLogo,
  Button,
  IconButton,
  Badge,
  Divider,
  SectionHeading,
  LoadingIndicator,
  Tooltip,
  HorizontalCarousel,
} from '../components/common'
import { ContentCard } from '../components/cards'
import { Modal } from '../components/modals'
import { PageContainer } from '../components/layout'
import {
  SAMPLE_PORTRAIT_CARDS,
  SAMPLE_LANDSCAPE_CARDS,
  SAMPLE_FEATURED_CARDS,
} from '../data/sampleContent'
import type { ContentMetadata } from '../types'
import { staggerContainerVariants } from '../styles/animations'

export interface DevShellProps {
  onLaunchStartup?: () => void
}

export const DevShell: React.FC<DevShellProps> = ({ onLaunchStartup }) => {
  const { currentAccent, availableAccents, setAccent } = useTheme()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedContent, setSelectedContent] = useState<ContentMetadata | null>(null)
  const [btnLoading, setBtnLoading] = useState(false)

  const handleCardInfo = (content: ContentMetadata) => {
    setSelectedContent(content)
    setIsModalOpen(true)
  }

  return (
    <PageContainer as="main" variant="default" className="py-8 sm:py-12 md:py-16">
      {/* Brand Header */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[var(--border-subtle)]"
      >
        <div className="space-y-3">
          {/* Platform Logo */}
          <BrandLogo size="lg" showTagline={true} />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--accent-secondary)] font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Your entertainment destination.</span>
          </div>
        </div>

        {/* Dynamic Theme Runtime Switcher (Phase 1 demonstration of CSS variables) */}
        <div className="flex flex-col sm:items-end gap-2 bg-[var(--bg-card)] p-3.5 rounded-xl border border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
            <Palette className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Active Accent Token (CSS Variable):</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {availableAccents.map((acc) => {
              const isActive = acc.id === currentAccent.id
              return (
                <button
                  key={acc.id}
                  onClick={() => setAccent(acc.id)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium cursor-pointer transition-all flex items-center gap-1.5 border ${
                    isActive
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-muted)] text-[var(--text-primary)] shadow-sm'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-inner"
                    style={{ backgroundColor: acc.primary }}
                  />
                  <span>{acc.name.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>
        </div>
      </motion.header>

      {/* Dev Preview Notice */}
      <div className="my-8 p-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse shrink-0" />
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            <strong className="text-[var(--text-primary)] font-semibold">Phase 1 Dev Shell:</strong>{' '}
            Visual design tokens, typography, CSS variables, and core components verification. The full streaming homepage, profile selector, and catalogue will be integrated in subsequent phases.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onLaunchStartup && (
            <Button
              variant="primary"
              size="sm"
              onClick={onLaunchStartup}
              leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
            >
              Launch Startup Intro
            </Button>
          )}
          <Badge variant="accent" size="sm" className="hidden md:inline-flex">
            PHASE 1 COMPLETE
          </Badge>
        </div>
      </div>

      {/* SECTION 1: DESIGN TOKENS & COLOR PALETTE */}
      <motion.section
        variants={staggerContainerVariants}
        initial="hidden"
        animate="visible"
        className="my-12"
      >
        <SectionHeading
          title="Base Color Palette & Design Tokens"
          eyebrow="SYSTEM SPECIFICATION"
          subtitle="Strict adherence to dark, cinematic, non-neon color aesthetics. All colors mapped to runtime CSS custom properties."
        />

        {/* Base Palette Swatches */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          <ColorSwatch label="Main BG" hex={BASE_PALETTE.main} token="--bg-main" />
          <ColorSwatch label="Secondary BG" hex={BASE_PALETTE.secondary} token="--bg-secondary" />
          <ColorSwatch label="Card BG" hex={BASE_PALETTE.card} token="--bg-card" />
          <ColorSwatch label="Elevated" hex={BASE_PALETTE.elevated} token="--bg-elevated" />
          <ColorSwatch label="Text Primary" hex={BASE_PALETTE.textPrimary} token="--text-primary" />
          <ColorSwatch label="Text Secondary" hex={BASE_PALETTE.textSecondary} token="--text-secondary" />
          <ColorSwatch label="Text Muted" hex={BASE_PALETTE.textMuted} token="--text-muted" />
          <ColorSwatch label="Accent Primary" hex={currentAccent.primary} token="--accent-primary" isAccent />
        </div>
      </motion.section>

      <Divider />

      {/* SECTION 2: TYPOGRAPHY HIERARCHY */}
      <section className="my-12">
        <SectionHeading
          title="Typography System"
          eyebrow="EDITORIAL DISPLAY & CLEAN UI"
          subtitle="Display headings powered by Plus Jakarta Sans. UI, metadata, and body copy rendered in DM Sans."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border-subtle)]">
          <div className="space-y-4">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--accent-secondary)]">
              Headings (Plus Jakarta Sans)
            </span>
            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">H1 / Display (40px Extrabold)</span>
                <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)]">
                  The Cinematic Era of Hybrid TV
                </h1>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">H2 / Section Title (24px Bold)</span>
                <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">
                  Original Series & Live Broadcasts
                </h2>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">H3 / Subheading (18px Semibold)</span>
                <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                  Curated Channels & Personal Vault
                </h3>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--accent-secondary)]">
              Body & Interface (DM Sans)
            </span>
            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">Body Regular (15px)</span>
                <p className="text-[var(--text-primary)] text-sm sm:text-base leading-relaxed">
                  <span className="font-pixel font-bold text-[var(--accent-primary)]">PIXEL</span> synthesizes broadcast television reliability with the non-linear flexibility of next-generation on-demand streaming.
                </p>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">Secondary / Metadata (13px)</span>
                <p className="text-[var(--text-secondary)] text-xs sm:text-sm">
                  Ultra HD 4K • Dolby Vision • Spatial Audio • 5.1 Surround • PG-13
                </p>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">Muted Footnote (11px Uppercase)</span>
                <p className="text-[var(--text-muted)] text-[11px] font-mono uppercase tracking-wider">
                  © 2026 PIXEL INC. ALL RIGHTS RESERVED.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* SECTION 3: CORE COMPONENT SHOWCASE */}
      <section className="my-12">
        <SectionHeading
          title="Interactive Global Components"
          eyebrow="FOUNDATION LIBRARY"
          subtitle="Modular, configurable buttons, icon controls, badges, loaders, and tooltips."
        />

        {/* Buttons & Badges Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Buttons Matrix */}
          <div className="bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border-subtle)] space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--accent-secondary)]">
                Button Variants & Sizes
              </span>
              <button
                onClick={() => setBtnLoading(!btnLoading)}
                className="text-xs font-mono text-[var(--accent-primary)] hover:underline cursor-pointer"
              >
                Toggle Loading State
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                size="md"
                isLoading={btnLoading}
                leftIcon={<Play className="w-4 h-4 fill-current" />}
              >
                Watch Now
              </Button>

              <Button
                variant="secondary"
                size="md"
                isLoading={btnLoading}
                leftIcon={<Bookmark className="w-4 h-4" />}
              >
                Add to List
              </Button>

              <Button variant="outline" size="md">
                View Trailer
              </Button>

              <Button variant="ghost" size="md">
                Dismiss
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--border-subtle)]">
              <Button variant="primary" size="sm">
                Small (sm)
              </Button>
              <Button variant="primary" size="md">
                Medium (md)
              </Button>
              <Button variant="primary" size="lg">
                Large (lg)
              </Button>
              <Button variant="danger" size="sm">
                Cancel
              </Button>
            </div>
          </div>

          {/* IconButtons, Tooltips & Badges */}
          <div className="bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border-subtle)] space-y-5">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--accent-secondary)]">
              Icon Buttons, Tooltips & Status Badges
            </span>

            <div className="flex flex-wrap items-center gap-4">
              <Tooltip content="Play stream immediately" position="top">
                <IconButton
                  icon={<Play className="w-4 h-4 fill-current ml-0.5" />}
                  aria-label="Play"
                  variant="primary"
                />
              </Tooltip>

              <Tooltip content="Add title to your watch queue" position="top">
                <IconButton
                  icon={<Bookmark className="w-4 h-4" />}
                  aria-label="Bookmark"
                  variant="secondary"
                />
              </Tooltip>

              <Tooltip content="Inspect technical audio & video details" position="top">
                <IconButton
                  icon={<Info className="w-4 h-4" />}
                  aria-label="Information"
                  variant="elevated"
                />
              </Tooltip>

              <Tooltip content="Launch interactive modal test" position="top">
                <IconButton
                  icon={<Maximize2 className="w-4 h-4" />}
                  aria-label="Open Modal Preview"
                  variant="outline"
                  onClick={() => setIsModalOpen(true)}
                />
              </Tooltip>
            </div>

            <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-2.5">
              <Badge variant="live" size="sm">
                LIVE BROADCAST
              </Badge>
              <Badge variant="accent" size="sm">
                4K ULTRA HD
              </Badge>
              <Badge variant="default" size="sm">
                DOLBY ATMOS
              </Badge>
              <Badge variant="outline" size="sm">
                CC / SUBTITLES
              </Badge>
              <Badge variant="subtle" size="sm">
                50 FPS
              </Badge>
            </div>

            <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <LoadingIndicator variant="spinner" size="sm" />
                <LoadingIndicator variant="dots" size="sm" />
                <LoadingIndicator variant="pulse-bar" size="sm" />
              </div>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                Restrained Cinematic Loaders
              </span>
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* SECTION 4: CONTENT CARD VARIANTS & HORIZONTAL CAROUSEL */}
      <section className="my-12">
        <SectionHeading
          title="Content Card Variants & Carousel System"
          eyebrow="STREAMING CARDS FOUNDATION"
          subtitle="Configured for portrait posters (2:3), landscape episode/channel previews (16:9), and wide featured spotlights."
        />

        {/* 1. Portrait Poster Carousel */}
        <div className="mb-12">
          <HorizontalCarousel
            title="Portrait Poster Variant"
            eyebrow="2:3 ASPECT RATIO"
            subtitle="Standard cinematic movie & series posters with watch progress bar and hover overlay."
          >
            {SAMPLE_PORTRAIT_CARDS.map((card) => (
              <ContentCard
                key={card.id}
                content={card}
                variant="portrait"
                onInfo={handleCardInfo}
                onPlay={(c) => alert(`Playback demo triggered for "${c.title}"`)}
              />
            ))}
          </HorizontalCarousel>
        </div>

        {/* 2. Landscape Thumbnail Carousel */}
        <div className="mb-12">
          <HorizontalCarousel
            title="Landscape Thumbnail Variant"
            eyebrow="16:9 ASPECT RATIO"
            subtitle="Optimized for traditional linear TV channels, live events, sports, and continue watching."
          >
            {SAMPLE_LANDSCAPE_CARDS.map((card) => (
              <ContentCard
                key={card.id}
                content={card}
                variant="landscape"
                onInfo={handleCardInfo}
                onPlay={(c) => alert(`Playback demo triggered for "${c.title}"`)}
              />
            ))}
          </HorizontalCarousel>
        </div>

        {/* 3. Featured Spotlight Card */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-mono font-semibold tracking-wider text-[var(--accent-secondary)]">
                WIDE SPOTLIGHT VARIANT
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                Featured Content Spotlight
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SAMPLE_FEATURED_CARDS.map((card) => (
              <ContentCard
                key={card.id}
                content={card}
                variant="featured"
                onInfo={handleCardInfo}
                onPlay={(c) => alert(`Playback demo triggered for "${c.title}"`)}
              />
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* SECTION 5: MODAL TEST & TECHNICAL SPECIFICATION */}
      <section className="my-12">
        <div className="p-6 rounded-xl bg-gradient-to-r from-[var(--bg-card)] to-[var(--bg-secondary)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[var(--accent-secondary)]">
              <Layers className="w-4 h-4" />
              <h4 className="font-display font-bold text-base text-[var(--text-primary)]">
                Modal & Animation Transition Verification
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-xl leading-relaxed">
              Verify accessible backdrop blur, keyboard ESC dismissal, focus trapping, and spring motion dialog transitions.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => {
              setSelectedContent(SAMPLE_PORTRAIT_CARDS[0])
              setIsModalOpen(true)
            }}
            leftIcon={<Maximize2 className="w-4 h-4" />}
          >
            Launch Modal Preview
          </Button>
        </div>
      </section>

      {/* Interactive Modal Component */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedContent ? selectedContent.title : 'JUNCTION+ Component Preview'}
        description={selectedContent?.subtitle || 'Accessible modal dialog with restrained cinematic backdrop blur.'}
        size="lg"
      >
        <div className="space-y-4 pt-2">
          {selectedContent && selectedContent.backdropUrl && (
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
              <img
                src={selectedContent.backdropUrl}
                alt={selectedContent.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {selectedContent?.description ||
              'This modal illustrates the global dialog overlay foundation. In Phase 2, this modal structure will serve as the container for movie synopsis details, episode pickers, avatar selection, and stream configuration.'}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            {selectedContent?.quality && (
              <Badge variant="accent" size="sm">
                {selectedContent.quality}
              </Badge>
            )}
            {selectedContent?.rating && (
              <Badge variant="default" size="sm">
                RATED {selectedContent.rating}
              </Badge>
            )}
            {selectedContent?.duration && (
              <Badge variant="outline" size="sm">
                {selectedContent.duration}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              leftIcon={<Play className="w-4 h-4 fill-current" />}
              onClick={() => {
                alert(`Starting playback for ${selectedContent?.title || 'preview'}`)
                setIsModalOpen(false)
              }}
            >
              Stream Now
            </Button>
          </div>
        </div>
      </Modal>

      {/* Footer */}
      <footer className="pt-8 pb-12 mt-12 border-t border-[var(--border-subtle)] text-center space-y-2">
        <BrandLogo size="sm" className="mx-auto" />
        <p className="text-xs text-[var(--text-muted)] font-mono">
          <span className="font-pixel font-bold text-[var(--accent-primary)]">PIXEL</span> Design System & Streaming Architecture
        </p>
      </footer>
    </PageContainer>
  )
}

interface ColorSwatchProps {
  label: string
  hex: string
  token: string
  isAccent?: boolean
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ label, hex, token, isAccent = false }) => {
  return (
    <div
      className={`p-3 rounded-lg border transition-all ${
        isAccent
          ? 'bg-[var(--accent-muted)] border-[var(--accent-primary)]/40'
          : 'bg-[var(--bg-card)] border-[var(--border-subtle)]'
      }`}
    >
      <div
        className="w-full h-10 rounded-md mb-2 border border-white/10 shadow-inner"
        style={{ backgroundColor: hex }}
      />
      <div className="space-y-0.5">
        <span className="block text-[11px] font-medium text-[var(--text-primary)] truncate">
          {label}
        </span>
        <span className="block text-[10px] font-mono text-[var(--text-muted)] truncate">
          {hex}
        </span>
        <span className="block text-[9px] font-mono text-[var(--text-secondary)] opacity-60 truncate">
          {token}
        </span>
      </div>
    </div>
  )
}
