import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Subtitles,
  ArrowLeft,
  Check,
  CheckCircle2,
  Sparkles,
  Zap,
  Sliders,
  X,
  Radio,
  SkipForward,
} from 'lucide-react'
import { Badge } from '../common/Badge'
import { Button } from '../common/Button'
import type { ContentMetadata, EpisodeMetadata } from '../../types'

export interface LiveProgramInfo {
  channelNumber: string
  channelTitle: string
  programTitle: string
  programGenre?: string
  programDuration?: string
  programStartTime?: string
  programEndTime?: string
  channelCategory?: string
}

export interface SimulatedPlayerModalProps {
  isOpen: boolean
  content: ContentMetadata | null
  episode?: EpisodeMetadata
  initialProgress?: number
  onClose: () => void
  onProgressUpdate: (
    contentId: string,
    progress: number,
    details?: {
      episodeId?: string
      seasonNumber?: number
      episodeNumber?: number
      episodeTitle?: string
      completed?: boolean
      remainingMinutes?: number
      currentTime?: number
      duration?: number
    }
  ) => void
  onMarkCompleted: (contentId: string) => void
  onNextEpisode?: (nextEpisode: EpisodeMetadata) => void
  liveProgram?: LiveProgramInfo
  onPreviousChannel?: () => void
  onNextChannel?: () => void
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]
const STREAM_QUALITIES = ['Auto (4K HDR Master)', '1080p Full HD', '720p HD']
const SUBTITLE_OPTIONS = [
  'Off',
  'English [CC]',
  'Spanish',
  'French',
  'German',
  'Japanese',
  'Hindi',
]

// Realistic dialogue cues for simulated closed captions
const SAMPLE_SUBTITLE_CUES = [
  '[Subtle orchestral swell builds]',
  'Detecting localized gravitational displacement along the vector.',
  'Confirm signal telemetry before engaging the primary harmonic array.',
  'The frequency is multiplying across the sector...',
  'Look at the horizon. It isn’t shifting — we are.',
  'All auxiliary systems routing power to the central cooling core.',
  'This anomaly wasn’t formed naturally.',
  'Stand by for quantum transit sequence.',
  '[Dynamic spatial resonance fades]',
  'We only have one window before the oscillation collapses.',
]

function getNextEpisodeData(
  content: ContentMetadata | null,
  currentEpisode?: EpisodeMetadata
): { nextEp: EpisodeMetadata; seasonNumber: number; isNextSeason?: boolean } | null {
  if (!content || !content.seasons || content.seasons.length === 0) return null

  if (!currentEpisode) {
    if (content.seasons[0]?.episodes?.[1]) {
      return {
        nextEp: content.seasons[0].episodes[1],
        seasonNumber: content.seasons[0].seasonNumber,
      }
    }
    return null
  }

  for (let sIdx = 0; sIdx < content.seasons.length; sIdx++) {
    const season = content.seasons[sIdx]
    const epIdx = season.episodes.findIndex((e) => e.id === currentEpisode.id)
    if (epIdx !== -1) {
      if (epIdx + 1 < season.episodes.length) {
        return {
          nextEp: season.episodes[epIdx + 1],
          seasonNumber: season.seasonNumber,
        }
      }
      if (sIdx + 1 < content.seasons.length && content.seasons[sIdx + 1].episodes.length > 0) {
        return {
          nextEp: content.seasons[sIdx + 1].episodes[0],
          seasonNumber: content.seasons[sIdx + 1].seasonNumber,
          isNextSeason: true,
        }
      }
      return null
    }
  }
  return null
}

function parseDurationToSeconds(durationStr?: string, isEpisode?: boolean): number {
  if (!durationStr) return isEpisode ? 50 * 60 : 114 * 60

  const hourMatch = durationStr.match(/(\d+)\s*h/i)
  const minMatch = durationStr.match(/(\d+)\s*m/i)
  const secMatch = durationStr.match(/(\d+)\s*s/i)

  let total = 0
  if (hourMatch) total += parseInt(hourMatch[1], 10) * 3600
  if (minMatch) total += parseInt(minMatch[1], 10) * 60
  if (secMatch) total += parseInt(secMatch[1], 10)

  return total > 0 ? total : isEpisode ? 50 * 60 : 114 * 60
}

function formatTime(totalSeconds: number): string {
  const secs = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(secs / 3600)
  const minutes = Math.floor((secs % 3600) / 60)
  const seconds = secs % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export const SimulatedPlayerModal: React.FC<SimulatedPlayerModalProps> = ({
  isOpen,
  content,
  episode: propEpisode,
  initialProgress = 0,
  onClose,
  onProgressUpdate,
  onMarkCompleted,
  onNextEpisode,
  liveProgram,
  onPreviousChannel,
  onNextChannel,
}) => {
  // ─── Active Content & Episode State ───
  const initialEpisode = useMemo(() => {
    if (propEpisode) return propEpisode
    if (content?.seasons && content.seasons.length > 0 && content.seasons[0]?.episodes?.length > 0) {
      return content.seasons[0].episodes[0]
    }
    return undefined
  }, [propEpisode, content])

  const [currentEpisode, setCurrentEpisode] = useState<EpisodeMetadata | undefined>(initialEpisode)
  const [isPlaying, setIsPlaying] = useState(true)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [volume, setVolume] = useState(0.85)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedQuality, setSelectedQuality] = useState('Auto (4K HDR Master)')
  const [selectedAudio, setSelectedAudio] = useState('English [Original] (Dolby Atmos)')
  const [selectedSubtitle, setSelectedSubtitle] = useState('Off')

  // ─── Menu & Inactivity Controls ───
  const [showControls, setShowControls] = useState(true)
  const [activeSettingsTab, setActiveSettingsTab] = useState<'none' | 'menu' | 'speed' | 'audio' | 'subtitles' | 'quality'>('none')
  const [hudFeedback, setHudFeedback] = useState<{ icon: React.ReactNode; label: string } | null>(null)
  const hudTimeoutRef = useRef<number | null>(null)
  const controlsTimeoutRef = useRef<number | null>(null)

  // ─── Autoplay Next Episode Countdown State ───
  const [isAutoplayActive, setIsAutoplayActive] = useState(false)
  const [autoplayCountdown, setAutoplayCountdown] = useState(10)
  const autoplayTimerRef = useRef<number | null>(null)

  // ─── DOM & Time Refs ───
  const playerContainerRef = useRef<HTMLDivElement | null>(null)
  const lastSavedTimeRef = useRef<number>(0)
  const lastReportedProgressRef = useRef<number>(initialProgress)

  // Calculate total seconds for current title / episode
  const isSeries = Boolean(content?.type === 'series' || content?.seasons?.length)
  const totalDurationSeconds = useMemo(() => {
    if (currentEpisode) {
      return parseDurationToSeconds(currentEpisode.duration, true)
    }
    return parseDurationToSeconds(content?.duration, isSeries)
  }, [content, currentEpisode, isSeries])

  // Current playback time in seconds
  const [currentTime, setCurrentTime] = useState(() => (initialProgress / 100) * totalDurationSeconds)
  const currentTimeRef = useRef(currentTime)

  // Sync props change during render (when item, episode, or open state changes)
  const [prevProps, setPrevProps] = useState({
    contentId: content?.id,
    epId: propEpisode?.id,
    isOpen,
  })

  if (
    prevProps.contentId !== content?.id ||
    prevProps.epId !== propEpisode?.id ||
    prevProps.isOpen !== isOpen
  ) {
    setPrevProps({
      contentId: content?.id,
      epId: propEpisode?.id,
      isOpen,
    })
    const activeEp = propEpisode || (content?.seasons && content.seasons.length > 0 ? content.seasons[0]?.episodes?.[0] : undefined)
    setCurrentEpisode(activeEp)
    if (isOpen) {
      const duration = parseDurationToSeconds(
        activeEp?.duration || content?.duration,
        Boolean(content?.type === 'series' || content?.seasons?.length)
      )
      const initialSec = (initialProgress / 100) * duration
      setCurrentTime(initialSec)
      setIsPlaying(true)
      setIsAutoplayActive(false)
      setAutoplayCountdown(10)
    }
  }

  // Keep ref synchronized with current time
  useEffect(() => {
    currentTimeRef.current = currentTime
  }, [currentTime])

  // Derived progress percentage (0 - 100)
  const progressPercent = useMemo(() => {
    if (totalDurationSeconds <= 0) return 0
    return Math.min(100, Math.max(0, (currentTime / totalDurationSeconds) * 100))
  }, [currentTime, totalDurationSeconds])

  // Find next episode in season/series structure
  const nextEpisodeData = getNextEpisodeData(content, currentEpisode)

  // Current season number
  const currentSeasonNumber = useMemo(() => {
    if (!content || !content.seasons || !currentEpisode) return 1
    for (const season of content.seasons) {
      if (season.episodes.some((e) => e.id === currentEpisode.id)) {
        return season.seasonNumber
      }
    }
    return 1
  }, [content, currentEpisode])

  // Available audio languages from content metadata or fallback
  const availableAudioLanguages = useMemo(() => {
    if (content?.audioLanguages && content.audioLanguages.length > 0) {
      return content.audioLanguages
    }
    return ['English [Original] (Dolby Atmos)', 'Spanish (5.1)', 'French (5.1)', 'German (5.1)', 'Japanese (5.1)', 'Hindi (5.1)']
  }, [content])

  // Lock body scroll when player is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Flash HUD notification
  const triggerHud = useCallback((icon: React.ReactNode, label: string) => {
    if (hudTimeoutRef.current) {
      window.clearTimeout(hudTimeoutRef.current)
    }
    setHudFeedback({ icon, label })
    hudTimeoutRef.current = window.setTimeout(() => {
      setHudFeedback(null)
    }, 850)
  }, [])

  // Auto-hide controls timer
  const resetControlsTimer = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current)
    }
    if (isPlaying && activeSettingsTab === 'none' && !isAutoplayActive) {
      controlsTimeoutRef.current = window.setTimeout(() => {
        setShowControls(false)
      }, 3500)
    }
  }, [isPlaying, activeSettingsTab, isAutoplayActive])

  // Play next episode handler
  const handlePlayNextEpisode = useCallback(
    (nextEp: EpisodeMetadata) => {
      setIsAutoplayActive(false)
      setCurrentEpisode(nextEp)
      setCurrentTime(0)
      currentTimeRef.current = 0
      setIsPlaying(true)
      setShowControls(true)
      if (onNextEpisode) {
        onNextEpisode(nextEp)
      }
      triggerHud(<SkipForward className="w-8 h-8 text-[var(--accent-primary)]" />, `Playing ${nextEp.title}`)
    },
    [onNextEpisode, triggerHud]
  )

  // Save progress helper (throttled/batched)
  const persistProgress = useCallback(
    (timeSec: number, forceCompleted = false) => {
      if (!content) return
      const percent = totalDurationSeconds > 0 ? (timeSec / totalDurationSeconds) * 100 : 0
      const remainingMin = Math.max(0, Math.ceil((totalDurationSeconds - timeSec) / 60))
      const isCompleted = forceCompleted || percent >= 98

      onProgressUpdate(content.id, Math.min(100, Math.round(percent)), {
        episodeId: currentEpisode?.id,
        seasonNumber: currentSeasonNumber,
        episodeNumber: currentEpisode?.episodeNumber,
        episodeTitle: currentEpisode?.title,
        completed: isCompleted,
        remainingMinutes: isCompleted ? 0 : remainingMin,
        currentTime: Math.round(timeSec),
        duration: Math.round(totalDurationSeconds),
      })

      lastReportedProgressRef.current = percent
      lastSavedTimeRef.current = Date.now()

      if (isCompleted) {
        onMarkCompleted(content.id)
      }
    },
    [content, currentEpisode, currentSeasonNumber, totalDurationSeconds, onProgressUpdate, onMarkCompleted]
  )

  // ─── Continuous Playback Ticker ───
  useEffect(() => {
    if (!isOpen || !isPlaying || isAutoplayActive) return

    const intervalMs = 250
    const timer = window.setInterval(() => {
      setCurrentTime((prev) => {
        const deltaSeconds = (intervalMs / 1000) * playbackSpeed
        const next = prev + deltaSeconds
        currentTimeRef.current = next

        // Periodically persist progress (every 4 seconds of simulated playback)
        if (Date.now() - lastSavedTimeRef.current > 4000) {
          persistProgress(next)
        }

        // Reaching the end of playback
        if (next >= totalDurationSeconds) {
          setIsPlaying(false)
          currentTimeRef.current = totalDurationSeconds
          persistProgress(totalDurationSeconds, true)

          // If next episode exists, initiate autoplay countdown
          if (nextEpisodeData) {
            setIsAutoplayActive(true)
            setAutoplayCountdown(10)
          }
          return totalDurationSeconds
        }

        return next
      })
    }, intervalMs)

    return () => {
      window.clearInterval(timer)
    }
  }, [isOpen, isPlaying, playbackSpeed, totalDurationSeconds, isAutoplayActive, nextEpisodeData, persistProgress])

  // ─── Autoplay Countdown Ticker ───
  useEffect(() => {
    if (!isAutoplayActive || !nextEpisodeData) return

    const nextEp = nextEpisodeData.nextEp

    autoplayTimerRef.current = window.setInterval(() => {
      setAutoplayCountdown((prev) => {
        if (prev <= 1) {
          handlePlayNextEpisode(nextEp)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (autoplayTimerRef.current) {
        window.clearInterval(autoplayTimerRef.current)
      }
    }
  }, [isAutoplayActive, nextEpisodeData, handlePlayNextEpisode])

  // Cancel autoplay countdown
  const handleCancelAutoplay = () => {
    setIsAutoplayActive(false)
    if (autoplayTimerRef.current) {
      window.clearInterval(autoplayTimerRef.current)
    }
  }

  // ─── Playback Controls Actions ───
  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev
      if (next) {
        triggerHud(<Play className="w-8 h-8 text-[var(--accent-primary)] fill-current" />, 'Play')
      } else {
        triggerHud(<Pause className="w-8 h-8 text-[var(--accent-primary)] fill-current" />, 'Pause')
        persistProgress(currentTimeRef.current)
      }
      return next
    })
  }, [triggerHud, persistProgress])

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const percent = Number(e.target.value)
      const targetSeconds = (percent / 100) * totalDurationSeconds
      setCurrentTime(targetSeconds)
      currentTimeRef.current = targetSeconds
      persistProgress(targetSeconds)
      resetControlsTimer()
    },
    [totalDurationSeconds, persistProgress, resetControlsTimer]
  )

  const handleJump = useCallback(
    (deltaSec: number) => {
      setCurrentTime((prev) => {
        const next = Math.min(totalDurationSeconds, Math.max(0, prev + deltaSec))
        currentTimeRef.current = next
        persistProgress(next)
        if (deltaSec < 0) {
          triggerHud(<RotateCcw className="w-8 h-8 text-[var(--accent-secondary)]" />, '-10s')
        } else {
          triggerHud(<RotateCw className="w-8 h-8 text-[var(--accent-secondary)]" />, '+10s')
        }
        return next
      })
      resetControlsTimer()
    },
    [totalDurationSeconds, persistProgress, triggerHud, resetControlsTimer]
  )

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev
      if (next) {
        triggerHud(<VolumeX className="w-8 h-8 text-rose-400" />, 'Muted')
      } else {
        triggerHud(<Volume2 className="w-8 h-8 text-[var(--accent-primary)]" />, `Volume ${Math.round(volume * 100)}%`)
      }
      return next
    })
  }, [volume, triggerHud])

  const handleVolumeChange = useCallback(
    (delta: number) => {
      setVolume((prev) => {
        const next = Math.min(1, Math.max(0, prev + delta))
        setIsMuted(false)
        triggerHud(<Volume2 className="w-8 h-8 text-[var(--accent-primary)]" />, `Volume ${Math.round(next * 100)}%`)
        return next
      })
    },
    [triggerHud]
  )

  const handleSetSpeed = (speed: number) => {
    setPlaybackSpeed(speed)
    setActiveSettingsTab('none')
    triggerHud(<Zap className="w-8 h-8 text-[var(--accent-primary)]" />, `${speed}x Speed`)
  }

  // ─── Fullscreen API ───
  const toggleFullscreen = useCallback(async () => {
    const el = playerContainerRef.current
    if (!el) return
    try {
      if (!document.fullscreenElement) {
        if (el.requestFullscreen) {
          await el.requestFullscreen()
        } else if ((el as any).webkitRequestFullscreen) {
          await (el as any).webkitRequestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen()
        }
      }
    } catch {
      // Browsers may block if not triggered by gesture
    }
  }, [])

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    document.addEventListener('webkitfullscreenchange', handleFsChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange)
      document.removeEventListener('webkitfullscreenchange', handleFsChange)
    }
  }, [])

  // Close player handler
  const handleExitPlayer = useCallback(() => {
    persistProgress(currentTimeRef.current)
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
    setIsPlaying(false)
    onClose()
  }, [persistProgress, onClose])

  // ─── Keyboard Shortcuts ───
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is focusing a text input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return
      }

      resetControlsTimer()

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          handleTogglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          handleJump(-10)
          break
        case 'ArrowRight':
          e.preventDefault()
          handleJump(10)
          break
        case 'ArrowUp':
          e.preventDefault()
          handleVolumeChange(0.1)
          break
        case 'ArrowDown':
          e.preventDefault()
          handleVolumeChange(-0.1)
          break
        case 'KeyM':
          e.preventDefault()
          handleToggleMute()
          break
        case 'KeyF':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'BracketLeft':
        case 'PageUp':
          if (onPreviousChannel) {
            e.preventDefault()
            onPreviousChannel()
            triggerHud(<Radio className="w-8 h-8 text-[var(--accent-primary)]" />, 'Channel Prev')
          }
          break
        case 'BracketRight':
        case 'PageDown':
          if (onNextChannel) {
            e.preventDefault()
            onNextChannel()
            triggerHud(<Radio className="w-8 h-8 text-[var(--accent-primary)]" />, 'Channel Next')
          }
          break
        case 'Escape':
          e.preventDefault()
          if (activeSettingsTab !== 'none') {
            setActiveSettingsTab('none')
          } else if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {})
          } else {
            handleExitPlayer()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    isOpen,
    handleTogglePlay,
    handleJump,
    handleVolumeChange,
    handleToggleMute,
    toggleFullscreen,
    handleExitPlayer,
    resetControlsTimer,
    activeSettingsTab,
    onPreviousChannel,
    onNextChannel,
    triggerHud,
  ])

  if (!isOpen || !content) return null

  const heroImage = currentEpisode?.thumbnailUrl || content.backdropUrl || content.posterUrl
  const subtitleIndex = Math.floor(currentTime / 7) % SAMPLE_SUBTITLE_CUES.length
  const currentSubtitleText = SAMPLE_SUBTITLE_CUES[subtitleIndex]

  return (
    <div
      ref={playerContainerRef}
      onMouseMove={resetControlsTimer}
      onClick={() => {
        resetControlsTimer()
        if (activeSettingsTab !== 'none') setActiveSettingsTab('none')
      }}
      className={`fixed inset-0 z-[100] bg-[#0C0D0F] text-white select-none overflow-hidden flex flex-col justify-between transition-colors duration-300 font-sans ${
        !showControls ? 'cursor-none' : 'cursor-default'
      }`}
      role="region"
      aria-label={`Video player for ${content.title}`}
    >
      {/* ─── Background Cinematic Canvas ─── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Permanent Atmospheric Brand Primary Gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'var(--gradient-brand-player)',
          }}
        />

        {heroImage && (
          <img
            src={heroImage}
            alt={content.title}
            className={`w-full h-full object-cover filter brightness-[0.70] contrast-[1.10] opacity-80 transition-transform duration-1000 ease-out ${
              isPlaying ? 'scale-105' : 'scale-100'
            }`}
          />
        )}

        {/* Ambient Film Grain & Cinematic Gradient Protection */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C0D0F] via-black/40 to-[#0C0D0F]/80 pointer-events-none" />
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />

        {/* Dynamic Profile Accent Subtle Ambient Glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[150px] opacity-18 pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)' }}
        />
      </div>

      {/* ─── Center Action Flash HUD (Vol, Seek, Play/Pause, Speed) ─── */}
      {hudFeedback && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none flex flex-col items-center justify-center gap-2 p-6 rounded-3xl bg-black/75 border border-white/20 backdrop-blur-md shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="text-[var(--accent-primary)] drop-shadow-lg">
            {hudFeedback.icon}
          </div>
          <span className="font-mono text-xs uppercase tracking-widest text-white/90 font-semibold">
            {hudFeedback.label}
          </span>
        </div>
      )}

      {/* ─── Live Simulated Subtitles ─── */}
      {selectedSubtitle !== 'Off' && isPlaying && (
        <div className="absolute bottom-24 sm:bottom-28 left-6 right-6 z-30 pointer-events-none flex justify-center">
          <div className="max-w-2xl px-4 py-1.5 rounded-lg bg-black/75 backdrop-blur-sm border border-white/10 text-center shadow-lg">
            <span className="text-sm sm:text-base md:text-lg font-medium text-white/95 tracking-wide drop-shadow">
              {currentSubtitleText}
            </span>
          </div>
        </div>
      )}

      {/* ─── Top Bar: Title, Badges, Exit Player ─── */}
      <div
        className={`relative z-30 w-full p-4 sm:p-6 flex items-center justify-between bg-gradient-to-b from-black/90 via-black/40 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3 sm:gap-4 max-w-2xl">
          <button
            type="button"
            onClick={handleExitPlayer}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer shadow-lg shrink-0"
            title="Exit Player (Esc)"
            aria-label="Back to content library"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Live Channel Surfing Controls */}
          {(liveProgram || content.type === 'live') && onPreviousChannel && onNextChannel && (
            <div className="flex items-center gap-1 bg-black/60 border border-white/15 rounded-xl p-0.5 shrink-0">
              <button
                type="button"
                onClick={onPreviousChannel}
                className="px-2 py-1 rounded-lg hover:bg-white/15 text-white/90 text-xs font-mono transition-colors cursor-pointer"
                title="Previous Channel (PageUp / [)"
                aria-label="Previous channel"
              >
                ◀ CH
              </button>
              <button
                type="button"
                onClick={onNextChannel}
                className="px-2 py-1 rounded-lg hover:bg-white/15 text-white/90 text-xs font-mono transition-colors cursor-pointer"
                title="Next Channel (PageDown / ])"
                aria-label="Next channel"
              >
                CH ▶
              </button>
            </div>
          )}

          <div className="space-y-0.5 truncate">
            <div className="flex items-center gap-2">
              {(liveProgram || content.type === 'live') && (
                <Badge variant="live" size="sm" className="px-2 py-0.5 animate-pulse">
                  ● LIVE
                </Badge>
              )}
              <h2 className="font-display font-bold text-base sm:text-lg text-white truncate drop-shadow">
                {liveProgram
                  ? `CH ${liveProgram.channelNumber}: ${liveProgram.channelTitle}`
                  : content.title}
              </h2>
              {content.rating && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/15 text-white/80 border border-white/20">
                  {content.rating}
                </span>
              )}
            </div>

            <p className="text-xs font-mono text-[var(--accent-secondary)] truncate">
              {liveProgram
                ? `LIVE: ${liveProgram.programTitle}${liveProgram.programGenre ? ` • ${liveProgram.programGenre}` : ''}`
                : currentEpisode
                ? `Season ${currentSeasonNumber} • Episode ${currentEpisode.episodeNumber}: ${currentEpisode.title}`
                : content.subtitle || 'JUNCTION+ Stream Engine'}
            </p>
          </div>
        </div>

        {/* Top Right: Telemetry Watermark & Stream Indicator */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono">
          {liveProgram || content.type === 'live' ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/60 border border-red-500/40 text-red-300 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-[11px] uppercase tracking-wider font-bold">
                BROADCAST STREAM
              </span>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/15 text-white/80 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] uppercase tracking-wider text-[var(--accent-secondary)]">
                SIMULATED STREAM ENGINE
              </span>
            </div>
          )}

          <Badge variant="subtle" size="sm">
            {selectedQuality.split(' ')[0]}
          </Badge>
          <Badge variant="subtle" size="sm" className="hidden sm:inline-flex">
            ATMOS 5.1
          </Badge>
        </div>
      </div>

      {/* ─── Center Tap / Clickable Playback Surface ─── */}
      <div
        className="flex-1 w-full flex items-center justify-center relative cursor-pointer"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleTogglePlay()
          }
        }}
      >
        {/* Large Play Indicator when paused */}
        {!isPlaying && !isAutoplayActive && (
          <button
            type="button"
            onClick={handleTogglePlay}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[var(--accent-primary)] text-[var(--accent-contrast)] flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.8)] hover:scale-110 active:scale-95 transition-transform cursor-pointer border border-white/20"
            title="Resume Playback"
            aria-label="Resume Playback"
          >
            <Play className="w-10 h-10 sm:w-12 sm:h-12 fill-current ml-1" />
          </button>
        )}

        {/* ─── End-of-Episode Autoplay Countdown Overlay ─── */}
        {isAutoplayActive && nextEpisodeData && (
          <div
            data-testid="autoplay-overlay"
            onClick={(e) => e.stopPropagation()}
            className="p-5 sm:p-7 rounded-3xl bg-black/92 border border-[var(--accent-primary)]/50 shadow-2xl backdrop-blur-2xl max-w-lg w-full mx-4 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200 select-none z-40"
          >
            {/* Header Callout & Badges */}
            <div className="flex items-center justify-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-widest bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/40 text-[var(--accent-secondary)] font-semibold flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>
                  {nextEpisodeData.isNextSeason
                    ? 'SEASON FINALE COMPLETE • NEXT SEASON PREMIERE'
                    : 'NEXT EPISODE UPCOMING'}
                </span>
              </span>
            </div>

            {/* Next Episode Thumbnail & Title Row */}
            <div className="flex items-center gap-4 text-left p-3 rounded-2xl bg-white/5 border border-white/10">
              {nextEpisodeData.nextEp.thumbnailUrl ? (
                <div className="relative w-28 sm:w-36 aspect-video rounded-xl overflow-hidden bg-black shrink-0 border border-white/15">
                  <img
                    src={nextEpisodeData.nextEp.thumbnailUrl}
                    alt={nextEpisodeData.nextEp.title}
                    className="w-full h-full object-cover filter brightness-90"
                  />
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/80 text-white font-medium">
                    {nextEpisodeData.nextEp.duration}
                  </div>
                </div>
              ) : null}

              <div className="space-y-1 min-w-0 flex-1">
                <span className="text-xs font-mono text-[var(--accent-secondary)] block">
                  Season {nextEpisodeData.seasonNumber} • Episode {nextEpisodeData.nextEp.episodeNumber}
                </span>
                <h4 className="font-display font-bold text-sm sm:text-base text-white truncate">
                  {nextEpisodeData.nextEp.title}
                </h4>
                <p className="text-xs text-[var(--text-muted)] line-clamp-2">
                  {nextEpisodeData.nextEp.synopsis}
                </p>
              </div>
            </div>

            {/* Countdown Ring */}
            <div className="flex items-center justify-center gap-3 pt-1">
              <div className="w-11 h-11 rounded-full border-2 border-[var(--accent-primary)] flex items-center justify-center font-mono font-bold text-base text-[var(--accent-secondary)] shadow-[0_0_12px_var(--accent-glow)]">
                {autoplayCountdown}
              </div>
              <span className="text-xs text-white/80 font-mono">
                Autoplay starting in <strong className="text-[var(--text-primary)]">{autoplayCountdown}s</strong>
              </span>
            </div>

            {/* Actions: Play Now or Cancel */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => handlePlayNextEpisode(nextEpisodeData.nextEp)}
                leftIcon={<Play className="w-4 h-4 fill-current ml-0.5" />}
              >
                Play Now
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={handleCancelAutoplay}
              >
                Cancel Autoplay
              </Button>
            </div>
          </div>
        )}

        {/* ─── Series Finale Completed Celebration Banner (No Autoplay) ─── */}
        {!nextEpisodeData && progressPercent >= 98 && content.type === 'series' && (
          <div
            data-testid="series-finale-complete-banner"
            onClick={(e) => e.stopPropagation()}
            className="p-6 sm:p-8 rounded-3xl bg-black/92 border border-emerald-500/40 shadow-2xl backdrop-blur-2xl max-w-md w-full mx-4 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200 select-none z-40"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold">
                SERIES FINALE COMPLETE
              </span>
              <h3 className="font-display font-bold text-xl sm:text-2xl text-white">
                You’ve finished {content.title}
              </h3>
              <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto">
                All seasons and episodes in this series have been watched.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              {content.seasons?.[0]?.episodes?.[0] && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handlePlayNextEpisode(content.seasons![0].episodes[0])}
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                >
                  Watch Again
                </Button>
              )}
              <Button
                variant="outline"
                size="md"
                onClick={handleExitPlayer}
              >
                Exit Player
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Bottom Interactive Playback Controls Bar ─── */}
      <div
        className={`relative z-30 w-full p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/85 to-transparent space-y-3 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scrubber & Time Bar */}
        <div className="space-y-1.5">
          <div className="relative group flex items-center">
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progressPercent}
              onChange={handleSeek}
              aria-label="Seek playback position"
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)] focus:outline-none transition-all group-hover:h-3"
            />
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-white/80">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">
                {formatTime(currentTime)}
              </span>
              <span>/</span>
              <span className="text-[var(--text-muted)]">
                {formatTime(totalDurationSeconds)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[var(--accent-secondary)]">
                -{formatTime(Math.max(0, totalDurationSeconds - currentTime))} remaining
              </span>
              <span className="hidden sm:inline text-white/40">•</span>
              <span className="hidden sm:inline text-white/60">
                {Math.round(progressPercent)}%
              </span>
            </div>
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between pt-1">
          {/* Left Controls: Play/Pause, Rewind, Forward, Next Ep, Volume */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={handleTogglePlay}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer shadow-md"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            {/* Rewind 10s */}
            <button
              type="button"
              onClick={() => handleJump(-10)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/90 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1 font-mono border border-white/10"
              title="Rewind 10 seconds (←)"
              aria-label="Rewind 10 seconds"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">10s</span>
            </button>

            {/* Forward 10s */}
            <button
              type="button"
              onClick={() => handleJump(10)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/90 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1 font-mono border border-white/10"
              title="Forward 10 seconds (→)"
              aria-label="Forward 10 seconds"
            >
              <RotateCw className="w-4 h-4" />
              <span className="hidden sm:inline">10s</span>
            </button>

            {/* Next Episode Button (if available) */}
            {nextEpisodeData && (
              <button
                type="button"
                onClick={() => handlePlayNextEpisode(nextEpisodeData.nextEp)}
                className="px-2.5 py-1.5 rounded-xl bg-[var(--accent-primary)]/20 hover:bg-[var(--accent-primary)]/35 text-[var(--accent-secondary)] border border-[var(--accent-primary)]/40 transition-colors cursor-pointer text-xs flex items-center gap-1.5 font-mono shadow-sm"
                title={`Next: Episode ${nextEpisodeData.nextEp.episodeNumber}`}
                aria-label={`Play next episode: ${nextEpisodeData.nextEp.title}`}
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Next Episode</span>
              </button>
            )}

            {/* Volume Control Group */}
            <div className="flex items-center gap-1.5 pl-1 group/vol">
              <button
                type="button"
                onClick={handleToggleMute}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/90 hover:text-white transition-colors cursor-pointer"
                title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setVolume(val)
                  setIsMuted(false)
                }}
                aria-label="Adjust volume"
                className="w-14 sm:w-20 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)] focus:outline-none transition-all opacity-80 group-hover/vol:opacity-100"
              />
            </div>
          </div>

          {/* Right Controls: Speed, Subtitles, Settings, Fullscreen */}
          <div className="flex items-center gap-2">
            {/* Speed Selector Toggle */}
            <button
              type="button"
              onClick={() => setActiveSettingsTab(activeSettingsTab === 'speed' ? 'none' : 'speed')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
                playbackSpeed !== 1 || activeSettingsTab === 'speed'
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] border-[var(--accent-primary)] font-semibold'
                  : 'bg-white/5 hover:bg-white/15 text-white/90 border-white/10'
              }`}
              title="Playback Speed"
              aria-label="Playback speed"
            >
              {playbackSpeed}x
            </button>

            {/* Subtitles CC Toggle */}
            <button
              type="button"
              onClick={() => setActiveSettingsTab(activeSettingsTab === 'subtitles' ? 'none' : 'subtitles')}
              className={`p-2 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
                selectedSubtitle !== 'Off' || activeSettingsTab === 'subtitles'
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] border-[var(--accent-primary)]'
                  : 'bg-white/5 hover:bg-white/15 text-white/90 border-white/10'
              }`}
              title="Subtitles / Closed Captions"
              aria-label="Subtitles"
            >
              <Subtitles className="w-4 h-4" />
            </button>

            {/* General Settings Menu */}
            <button
              type="button"
              onClick={() => setActiveSettingsTab(activeSettingsTab === 'menu' ? 'none' : 'menu')}
              className={`p-2 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
                activeSettingsTab === 'menu'
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] border-[var(--accent-primary)]'
                  : 'bg-white/5 hover:bg-white/15 text-white/90 border-white/10'
              }`}
              title="Audio, Subtitles & Quality Settings"
              aria-label="Playback settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Mark Finished Shortcut */}
            <button
              type="button"
              data-testid="complete-playback-btn"
              onClick={() => {
                setCurrentTime(totalDurationSeconds)
                currentTimeRef.current = totalDurationSeconds
                setIsPlaying(false)
                persistProgress(totalDurationSeconds, true)
                if (nextEpisodeData) {
                  setIsAutoplayActive(true)
                  setAutoplayCountdown(10)
                }
                triggerHud(<CheckCircle2 className="w-8 h-8 text-emerald-400" />, 'Marked Completed')
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 text-xs font-mono transition-colors cursor-pointer"
              title="Mark as fully watched"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Complete</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/90 hover:text-white transition-colors cursor-pointer border border-white/10"
              title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Settings Popover Menus ─── */}
      {activeSettingsTab !== 'none' && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-20 right-4 sm:right-6 z-50 p-4 rounded-2xl bg-black/95 border border-white/20 shadow-2xl backdrop-blur-xl w-72 text-xs space-y-3 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/15">
            <span className="font-mono uppercase tracking-wider text-[var(--accent-secondary)] flex items-center gap-1.5 font-semibold">
              <Sliders className="w-3.5 h-3.5" />
              {activeSettingsTab === 'menu' && 'Player Settings'}
              {activeSettingsTab === 'speed' && 'Playback Speed'}
              {activeSettingsTab === 'subtitles' && 'Subtitles / CC'}
              {activeSettingsTab === 'audio' && 'Audio Track'}
              {activeSettingsTab === 'quality' && 'Video Quality'}
            </span>
            <button
              type="button"
              onClick={() => setActiveSettingsTab('none')}
              className="text-white/60 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Master Settings Menu View */}
          {activeSettingsTab === 'menu' && (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveSettingsTab('speed')}
                className="w-full px-3 py-2 rounded-xl hover:bg-white/10 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="text-white/80">Speed</span>
                <span className="text-[var(--accent-secondary)] font-mono">{playbackSpeed}x &rarr;</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSettingsTab('audio')}
                className="w-full px-3 py-2 rounded-xl hover:bg-white/10 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="text-white/80">Audio</span>
                <span className="text-[var(--accent-secondary)] font-mono truncate max-w-[120px] text-right">
                  {selectedAudio.split(' ')[0]} &rarr;
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSettingsTab('subtitles')}
                className="w-full px-3 py-2 rounded-xl hover:bg-white/10 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="text-white/80">Subtitles</span>
                <span className="text-[var(--accent-secondary)] font-mono">{selectedSubtitle} &rarr;</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSettingsTab('quality')}
                className="w-full px-3 py-2 rounded-xl hover:bg-white/10 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="text-white/80">Quality</span>
                <span className="text-[var(--accent-secondary)] font-mono truncate max-w-[120px] text-right">
                  {selectedQuality.split(' ')[0]} &rarr;
                </span>
              </button>
            </div>
          )}

          {/* Playback Speed Sub-menu */}
          {activeSettingsTab === 'speed' && (
            <div className="space-y-1">
              {PLAYBACK_SPEEDS.map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => handleSetSpeed(sp)}
                  className={`w-full px-3 py-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                    playbackSpeed === sp
                      ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-secondary)] font-bold'
                      : 'hover:bg-white/10 text-white/80'
                  }`}
                >
                  <span>{sp === 1 ? '1x (Normal)' : `${sp}x`}</span>
                  {playbackSpeed === sp && <Check className="w-4 h-4 text-[var(--accent-primary)]" />}
                </button>
              ))}
            </div>
          )}

          {/* Subtitles Sub-menu */}
          {activeSettingsTab === 'subtitles' && (
            <div className="space-y-1 max-h-56 overflow-y-auto scrollbar-thin">
              {SUBTITLE_OPTIONS.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => {
                    setSelectedSubtitle(sub)
                    setActiveSettingsTab('none')
                    triggerHud(<Subtitles className="w-8 h-8 text-[var(--accent-primary)]" />, `Subtitles: ${sub}`)
                  }}
                  className={`w-full px-3 py-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                    selectedSubtitle === sub
                      ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-secondary)] font-bold'
                      : 'hover:bg-white/10 text-white/80'
                  }`}
                >
                  <span>{sub}</span>
                  {selectedSubtitle === sub && <Check className="w-4 h-4 text-[var(--accent-primary)]" />}
                </button>
              ))}
            </div>
          )}

          {/* Audio Language Sub-menu */}
          {activeSettingsTab === 'audio' && (
            <div className="space-y-1 max-h-56 overflow-y-auto scrollbar-thin">
              {availableAudioLanguages.map((aud) => (
                <button
                  key={aud}
                  type="button"
                  onClick={() => {
                    setSelectedAudio(aud)
                    setActiveSettingsTab('none')
                    triggerHud(<Radio className="w-8 h-8 text-[var(--accent-primary)]" />, `Audio: ${aud}`)
                  }}
                  className={`w-full px-3 py-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                    selectedAudio === aud
                      ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-secondary)] font-bold'
                      : 'hover:bg-white/10 text-white/80'
                  }`}
                >
                  <span className="truncate pr-2">{aud}</span>
                  {selectedAudio === aud && <Check className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />}
                </button>
              ))}
            </div>
          )}

          {/* Stream Quality Sub-menu */}
          {activeSettingsTab === 'quality' && (
            <div className="space-y-1">
              {STREAM_QUALITIES.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setSelectedQuality(q)
                    setActiveSettingsTab('none')
                    triggerHud(<Zap className="w-8 h-8 text-[var(--accent-primary)]" />, `Quality: ${q}`)
                  }}
                  className={`w-full px-3 py-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                    selectedQuality === q
                      ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-secondary)] font-bold'
                      : 'hover:bg-white/10 text-white/80'
                  }`}
                >
                  <span>{q}</span>
                  {selectedQuality === q && <Check className="w-4 h-4 text-[var(--accent-primary)]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
