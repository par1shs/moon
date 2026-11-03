import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Tv,
  X,
  Play,
  Info,
  Clock,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react'
import type { ContentMetadata } from '../../../types'
import type { Profile } from '../../profiles/types'
import { AvatarRenderer } from '../../profiles/components/AvatarRenderer'
import {
  SAMPLE_FEATURED_CARDS,
  SAMPLE_MOVIE_CARDS,
  SAMPLE_SERIES_CARDS,
  SAMPLE_LIVE_CHANNELS,
} from '../../../data/sampleContent'
import { useReducedMotionPreference } from '../../../hooks/useReducedMotionPreference'

export interface SmartTVPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  profile: Profile
  onSelectContent?: (content: ContentMetadata) => void
  onPlayContent?: (content: ContentMetadata) => void
}

interface TVShelf {
  id: string
  title: string
  items: ContentMetadata[]
}

const TV_NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'movies', label: 'Movies' },
  { id: 'series', label: 'Series' },
  { id: 'live', label: 'Live TV' },
  { id: 'exit', label: 'Exit TV Mode' },
]

const DEFAULT_TV_SHELVES: TVShelf[] = [
  {
    id: 'spotlight',
    title: 'Trending Primetime Highlights',
    items: SAMPLE_FEATURED_CARDS.slice(0, 6),
  },
  {
    id: 'movies',
    title: 'Blockbuster Feature Films (4K HDR)',
    items: SAMPLE_MOVIE_CARDS.slice(0, 6),
  },
  {
    id: 'series',
    title: 'Acclaimed Original Series',
    items: SAMPLE_SERIES_CARDS.slice(0, 6),
  },
  {
    id: 'live',
    title: 'Live Television Broadcasts',
    items: SAMPLE_LIVE_CHANNELS.slice(0, 6),
  },
]

export const SmartTVPreviewModal: React.FC<SmartTVPreviewModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSelectContent,
  onPlayContent,
}) => {
  const reducedMotion = useReducedMotionPreference()
  const modalContainerRef = useRef<HTMLDivElement>(null)

  // Navigation Focus State:
  // row: -1 = TV top nav bar; 0..N = TV content shelves
  // col: column index within that row
  const [focusedRow, setFocusedRow] = useState<number>(0)
  const [focusedCol, setFocusedCol] = useState<number>(0)
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('')
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)

  const shelves = DEFAULT_TV_SHELVES

  // Update digital clock every 10s
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      )
    }
    updateTime()
    const timer = setInterval(updateTime, 10000)
    return () => clearInterval(timer)
  }, [])

  // Identify currently focused content
  const activeShelf = focusedRow >= 0 && focusedRow < shelves.length ? shelves[focusedRow] : null
  const focusedContent: ContentMetadata | null =
    activeShelf && activeShelf.items[focusedCol] ? activeShelf.items[focusedCol] : shelves[0].items[0]

  // D-Pad Keyboard Controller
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          if (focusedRow > -1) {
            setFocusedRow((prev) => prev - 1)
            setFocusedCol((prev) => Math.min(prev, focusedRow === 0 ? TV_NAV_ITEMS.length - 1 : 5))
          }
          break

        case 'ArrowDown':
          e.preventDefault()
          if (focusedRow < shelves.length - 1) {
            setFocusedRow((prev) => prev + 1)
            const targetShelf = shelves[focusedRow + 1]
            setFocusedCol((prev) => Math.min(prev, (targetShelf?.items.length || 1) - 1))
          }
          break

        case 'ArrowLeft':
          e.preventDefault()
          if (focusedCol > 0) {
            setFocusedCol((prev) => prev - 1)
          }
          break

        case 'ArrowRight':
          e.preventDefault()
          if (focusedRow === -1) {
            if (focusedCol < TV_NAV_ITEMS.length - 1) {
              setFocusedCol((prev) => prev + 1)
            }
          } else if (activeShelf) {
            if (focusedCol < activeShelf.items.length - 1) {
              setFocusedCol((prev) => prev + 1)
            }
          }
          break

        case 'Enter':
        case ' ':
          e.preventDefault()
          if (focusedRow === -1) {
            const item = TV_NAV_ITEMS[focusedCol]
            if (item.id === 'exit') {
              onClose()
            } else if (item.id === 'live') {
              setFocusedRow(3)
              setFocusedCol(0)
            } else if (item.id === 'movies') {
              setFocusedRow(1)
              setFocusedCol(0)
            } else if (item.id === 'series') {
              setFocusedRow(2)
              setFocusedCol(0)
            } else {
              setFocusedRow(0)
              setFocusedCol(0)
            }
          } else if (focusedContent) {
            setActionFeedback(`Playing on Smart TV: ${focusedContent.title}`)
            setTimeout(() => setActionFeedback(null), 3000)
            if (onPlayContent) onPlayContent(focusedContent)
            else if (onSelectContent) onSelectContent(focusedContent)
          }
          break

        case 'Escape':
        case 'Backspace':
          e.preventDefault()
          onClose()
          break
      }
    },
    [isOpen, focusedRow, focusedCol, shelves, activeShelf, focusedContent, onClose, onPlayContent, onSelectContent]
  )

  useEffect(() => {
    if (!isOpen) return
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div
        ref={modalContainerRef}
        data-testid="smart-tv-preview-modal"
        className="fixed inset-0 z-[150] bg-[#050608] text-white overflow-hidden select-none flex flex-col font-sans"
        role="dialog"
        aria-modal="true"
        aria-label="Smart TV 10-Foot Experience Preview"
      >
        {/* TV Backdrop Atmosphere with ambient illumination */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 opacity-25 filter blur-3xl scale-110 pointer-events-none"
          style={{
            backgroundImage: `url(${focusedContent?.backdropUrl || focusedContent?.posterUrl || '/images/posters/cyberpunk_glitch_series_poster.png'})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-[#050608]/90 to-black/75 pointer-events-none" />

        {/* ─── 1. Smart TV Top Bar (10-Foot Navigation) ─── */}
        <header className="relative z-20 flex items-center justify-between px-8 sm:px-12 py-5 border-b border-white/10 bg-black/60 backdrop-blur-xl">
          {/* Brand & Input Source */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="font-pixel text-xl sm:text-2xl text-[var(--accent-primary)] tracking-wider">
                PIXEL
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest bg-sky-500/20 text-sky-300 border border-sky-500/40 uppercase">
                TV OS 4K
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-white/50">
              <Tv className="w-3.5 h-3.5 text-white/40" />
              <span>HDMI 1 • Samsung Smart Hub (3840×2160 @ 60Hz)</span>
            </div>
          </div>

          {/* TV Navigation Row */}
          <nav
            data-testid="tv-nav-row"
            className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10"
          >
            {TV_NAV_ITEMS.map((item, idx) => {
              const isFocused = focusedRow === -1 && focusedCol === idx
              return (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`tv-nav-item-${item.id}`}
                  onClick={() => {
                    setFocusedRow(-1)
                    setFocusedCol(idx)
                    if (item.id === 'exit') onClose()
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider font-bold transition-all cursor-pointer ${
                    isFocused
                      ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] shadow-[0_0_20px_var(--accent-primary)] ring-2 ring-white scale-105'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </nav>

          {/* Profile & TV Clock & Exit button */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-mono text-white/70">
              <Clock className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>{currentTimeStr || '19:45'}</span>
            </div>

            <div className="flex items-center gap-2 pl-3 border-l border-white/15">
              <AvatarRenderer config={profile.avatarConfig} size="sm" isKids={profile.isKidsProfile} />
              <span className="hidden sm:inline text-xs font-medium text-white/90">
                {profile.name}
              </span>
            </div>

            <button
              type="button"
              data-testid="exit-tv-preview-btn"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/20 hover:text-rose-300 border border-white/15 text-white/70 transition-colors cursor-pointer"
              title="Exit TV Preview (Esc)"
              aria-label="Exit TV Mode"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ─── 2. TV Main Body ─── */}
        <div className="relative z-10 flex-1 overflow-y-auto px-8 sm:px-12 py-6 space-y-8 scrollbar-thin">
          {/* Action Feedback Toast */}
          {actionFeedback && (
            <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-mono flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionFeedback}</span>
            </div>
          )}

          {/* ─── Hero Spotlight Billboard ─── */}
          {focusedContent && (
            <motion.div
              key={focusedContent.id}
              initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              data-testid="tv-hero-spotlight"
              className="relative rounded-3xl overflow-hidden border border-white/15 bg-gradient-to-r from-black/95 via-black/80 to-transparent p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl"
            >
              <div className="space-y-4 max-w-2xl">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase bg-[var(--accent-primary)] text-[var(--accent-contrast)]">
                    FOCUSED TITLE
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-white/10 text-white/90 border border-white/15">
                    {focusedContent.rating}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    4K HDR MASTER
                  </span>
                  <span className="text-xs font-mono text-white/50">
                    {focusedContent.duration} • {focusedContent.year} • {(focusedContent.genres || []).join(' • ')}
                  </span>
                </div>

                <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight drop-shadow-md">
                  {focusedContent.title}
                </h1>

                <p className="text-sm sm:text-base text-white/70 line-clamp-2 leading-relaxed">
                  {focusedContent.description}
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    data-testid="tv-hero-play-btn"
                    onClick={() => {
                      setActionFeedback(`Streaming: ${focusedContent.title}`)
                      if (onPlayContent) onPlayContent(focusedContent)
                    }}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-display font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_var(--accent-primary)] cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Watch Now [OK]</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectContent) onSelectContent(focusedContent)
                    }}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-mono font-bold transition-all cursor-pointer"
                  >
                    <Info className="w-4 h-4" />
                    <span>Details</span>
                  </button>
                </div>
              </div>

              {/* Spotlight Poster Thumbnail Preview */}
              <div className="hidden md:block w-56 sm:w-64 aspect-video rounded-2xl overflow-hidden border border-white/20 shadow-2xl shrink-0 group">
                <img
                  src={focusedContent.backdropUrl || focusedContent.posterUrl}
                  alt={focusedContent.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </motion.div>
          )}

          {/* ─── Horizontal TV Content Shelves ─── */}
          <div className="space-y-8">
            {shelves.map((shelf, rowIdx) => (
              <div key={shelf.id} data-testid={`tv-shelf-${shelf.id}`} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-lg sm:text-xl text-white flex items-center gap-2">
                    <span className="w-1.5 h-4 rounded-full bg-[var(--accent-primary)]" />
                    {shelf.title}
                  </h2>
                  <span className="text-xs font-mono text-white/40">
                    Row {rowIdx + 1} of {shelves.length}
                  </span>
                </div>

                {/* Horizontal Shelf Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {shelf.items.map((item, colIdx) => {
                    const isFocused = focusedRow === rowIdx && focusedCol === colIdx
                    return (
                      <div
                        key={item.id}
                        data-testid={`tv-card-${rowIdx}-${colIdx}`}
                        data-focused={isFocused ? 'true' : 'false'}
                        onClick={() => {
                          setFocusedRow(rowIdx)
                          setFocusedCol(colIdx)
                        }}
                        className={`group relative rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer ${
                          isFocused
                            ? 'ring-4 ring-[var(--accent-primary)] scale-105 z-20 shadow-[0_12px_32px_rgba(0,0,0,0.9),0_0_24px_var(--accent-primary)] border-2 border-white'
                            : 'border border-white/10 hover:border-white/30 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <div className="aspect-video w-full bg-slate-900 overflow-hidden">
                          <img
                            src={item.backdropUrl || item.posterUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        {/* Title pill & focus glow */}
                        <div
                          className={`p-2.5 transition-colors ${
                            isFocused
                              ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)]'
                              : 'bg-black/80 text-white'
                          }`}
                        >
                          <p className="font-bold text-xs truncate">{item.title}</p>
                          <div className="flex items-center justify-between text-[10px] font-mono opacity-80 mt-0.5">
                            <span>{item.rating}</span>
                            <span>{item.duration}</span>
                          </div>
                        </div>

                        {isFocused && (
                          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/90 text-[9px] font-mono font-bold text-white border border-white/30 shadow-md">
                            SELECT [OK]
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── 3. TV Remote Control Navigation Helper Pill & Virtual D-Pad ─── */}
        <footer className="relative z-20 flex flex-col sm:flex-row items-center justify-between px-8 sm:px-12 py-3.5 bg-black/80 border-t border-white/10 backdrop-blur-xl gap-3">
          {/* Instructions */}
          <div className="flex items-center gap-3 sm:gap-6 text-xs font-mono text-white/70 flex-wrap">
            <span className="flex items-center gap-1.5">
              <kbd className="px-2 py-0.5 rounded bg-white/10 border border-white/20 font-bold text-[11px]">
                ▲ ▼ ◄ ►
              </kbd>
              <span>D-Pad Navigate</span>
            </span>

            <span className="flex items-center gap-1.5">
              <kbd className="px-2 py-0.5 rounded bg-white/10 border border-white/20 font-bold text-[11px]">
                ENTER / OK
              </kbd>
              <span>Watch / Select</span>
            </span>

            <span className="flex items-center gap-1.5">
              <kbd className="px-2 py-0.5 rounded bg-white/10 border border-white/20 font-bold text-[11px]">
                ESC / Back
              </kbd>
              <span>Exit TV Mode</span>
            </span>
          </div>

          {/* Virtual On-Screen D-Pad for Mouse & Touch Testing */}
          <div
            data-testid="virtual-dpad"
            className="flex items-center gap-2 p-1 rounded-xl bg-white/5 border border-white/10"
            title="Clickable TV Remote D-Pad for Desktop/Mouse testing"
          >
            <span className="text-[10px] font-mono text-white/50 px-1 hidden md:inline">
              VIRTUAL D-PAD:
            </span>
            <button
              type="button"
              data-testid="dpad-up"
              onClick={() => {
                if (focusedRow > -1) setFocusedRow((prev) => prev - 1)
              }}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 active:scale-90 text-white cursor-pointer"
              title="D-Pad Up"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              data-testid="dpad-down"
              onClick={() => {
                if (focusedRow < shelves.length - 1) setFocusedRow((prev) => prev + 1)
              }}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 active:scale-90 text-white cursor-pointer"
              title="D-Pad Down"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              data-testid="dpad-left"
              onClick={() => {
                if (focusedCol > 0) setFocusedCol((prev) => prev - 1)
              }}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 active:scale-90 text-white cursor-pointer"
              title="D-Pad Left"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              data-testid="dpad-right"
              onClick={() => {
                const maxCol = focusedRow === -1 ? TV_NAV_ITEMS.length - 1 : (activeShelf?.items.length || 6) - 1
                if (focusedCol < maxCol) setFocusedCol((prev) => prev + 1)
              }}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 active:scale-90 text-white cursor-pointer"
              title="D-Pad Right"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              data-testid="dpad-ok"
              onClick={() => {
                if (focusedContent) {
                  setActionFeedback(`Selected via D-Pad: ${focusedContent.title}`)
                  setTimeout(() => setActionFeedback(null), 3000)
                  if (onPlayContent) onPlayContent(focusedContent)
                }
              }}
              className="px-2 py-1 rounded-lg bg-[var(--accent-primary)] hover:brightness-110 active:scale-90 text-[var(--accent-contrast)] font-bold text-[10px] font-mono cursor-pointer"
              title="D-Pad Select / OK"
            >
              OK
            </button>
          </div>
        </footer>
      </div>
    </AnimatePresence>
  )
}
