import React from 'react'
import { Play, RotateCcw, Clock, Film } from 'lucide-react'
import type { CatchUpProgramItem } from '../../../types/epg'
import { Badge } from '../../../components/common/Badge'

export interface CatchUpCardProps {
  item: CatchUpProgramItem
  onWatchCatchUp: (item: CatchUpProgramItem) => void
  onInspectProgram: (item: CatchUpProgramItem) => void
  onOpenLinkedContent?: (contentId: string) => void
}

export const CatchUpCard: React.FC<CatchUpCardProps> = ({
  item,
  onWatchCatchUp,
  onInspectProgram,
  onOpenLinkedContent,
}) => {
  const { program, channel, catchUpStatus, savedProgress } = item
  const hasSavedProgress = savedProgress !== undefined && savedProgress > 0 && savedProgress < 95

  return (
    <div
      data-testid={`catch-up-card-${program.id}`}
      onClick={() => onInspectProgram(item)}
      className="group relative rounded-2xl overflow-hidden bg-gradient-to-b from-[var(--bg-elevated)]/90 via-[var(--bg-card)] to-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/60 transition-all duration-300 shadow-[var(--shadow-card)] hover:shadow-[0_12px_28px_-6px_rgba(36,43,64,0.45)] cursor-pointer select-none flex flex-col justify-between"
    >
      {/* Artwork Container */}
      <div className="relative aspect-video w-full bg-[var(--bg-secondary)] overflow-hidden">
        <img
          src={program.artworkUrl}
          alt={program.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5">
            <Badge variant="accent" size="sm" className="px-2 py-0.5 text-[10px] font-mono">
              CH {channel.channelNumber}
            </Badge>

            {catchUpStatus.isExpiringSoon ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse shadow-sm">
                EXPIRING SOON
              </span>
            ) : (
              <Badge variant="subtle" size="sm" className="text-[10px] font-mono">
                CATCH-UP
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            {program.linkedContentId && (
              <span
                data-testid="catch-up-ott-link-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  if (onOpenLinkedContent && program.linkedContentId) {
                    onOpenLinkedContent(program.linkedContentId)
                  }
                }}
                className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[var(--accent-primary)]/20 text-[var(--accent-secondary)] border border-[var(--accent-primary)]/40 hover:bg-[var(--accent-primary)] hover:text-white transition-colors cursor-pointer"
                title="Watch on Demand via OTT Catalogue"
              >
                OTT
              </span>
            )}
            <Badge variant="subtle" size="sm">
              {program.rating}
            </Badge>
          </div>
        </div>

        {/* Saved Progress Bar on Thumbnail */}
        {hasSavedProgress && (
          <div
            data-testid="catch-up-progress-bar"
            className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/60 overflow-hidden"
          >
            <div
              className="h-full bg-[var(--accent-primary)] transition-all duration-300"
              style={{ width: `${savedProgress}%` }}
            />
          </div>
        )}

        {/* Center Hover Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
          <div className="w-11 h-11 rounded-full bg-[var(--accent-primary)] text-[var(--accent-contrast)] flex items-center justify-center shadow-xl">
            {hasSavedProgress ? (
              <RotateCcw className="w-5 h-5 ml-0.5" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </div>
        </div>
      </div>

      {/* Card Content Details */}
      <div className="p-3.5 sm:p-4 space-y-2.5 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
            <span className="truncate">{channel.title}</span>
            <span>{program.durationMinutes}m</span>
          </div>

          <h4 className="font-display font-semibold text-sm sm:text-base text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors line-clamp-1">
            {program.title}
          </h4>

          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
            {program.description}
          </p>
        </div>

        {/* Broadcast Date & Catch-up Expiry Tag */}
        <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
            <span className="flex items-center gap-1 truncate">
              <Clock className="w-3 h-3 text-[var(--accent-secondary)] shrink-0" />
              <span className="truncate">{catchUpStatus.broadcastDateText}</span>
            </span>

            <span
              className={`font-semibold shrink-0 ml-1.5 ${
                catchUpStatus.isExpiringSoon
                  ? 'text-amber-400 font-bold'
                  : 'text-[var(--accent-secondary)]'
              }`}
            >
              {catchUpStatus.expiryText}
            </span>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              data-testid="catch-up-play-btn"
              onClick={(e) => {
                e.stopPropagation()
                onWatchCatchUp(item)
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:opacity-95 shadow-sm active:scale-98"
            >
              {hasSavedProgress ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Resume ({savedProgress}%)</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  <span>Watch Catch-up</span>
                </>
              )}
            </button>

            {program.linkedContentId && onOpenLinkedContent && (
              <button
                type="button"
                data-testid="view-ondemand-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenLinkedContent(program.linkedContentId!)
                }}
                className="p-1.5 rounded-xl border border-white/10 hover:border-white/30 text-white/80 hover:text-white bg-white/5 transition-colors cursor-pointer shrink-0"
                title="View On Demand (OTT Details)"
                aria-label="View on demand"
              >
                <Film className="w-4 h-4 text-[var(--accent-secondary)]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
