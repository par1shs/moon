import React from 'react'
import { X, Sparkles } from 'lucide-react'
import type { InteractiveItem } from '../../../../types/interactive'
import { InteractivePollView } from './InteractivePollView'
import { InteractiveVotingView } from './InteractiveVotingView'
import { InteractiveQuizView } from './InteractiveQuizView'

export interface InteractivePanelProps {
  item: InteractiveItem
  profileId?: string
  onClose?: () => void
  isEmbeddedInPlayer?: boolean
}

export const InteractivePanel: React.FC<InteractivePanelProps> = ({
  item,
  profileId,
  onClose,
  isEmbeddedInPlayer = false,
}) => {
  return (
    <div
      data-testid="interactive-panel"
      className={`flex flex-col h-full ${
        isEmbeddedInPlayer
          ? 'space-y-4'
          : 'p-5 sm:p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xl'
      }`}
    >
      {/* Panel Top Navigation / Context Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/40 flex items-center justify-center text-[var(--accent-secondary)] shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent-secondary)] font-bold truncate">
              CH {item.channelNumber} • {item.channelTitle}
            </div>
            <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
              {item.programTitle}
            </div>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            data-testid="close-interactive-panel"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer shrink-0"
            title="Close Panel"
            aria-label="Close interactive panel"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Interactive Body based on Type */}
      <div className="flex-1 overflow-y-auto pr-1">
        {item.type === 'poll' && (
          <InteractivePollView item={item} profileId={profileId} />
        )}
        {item.type === 'voting' && (
          <InteractiveVotingView item={item} profileId={profileId} />
        )}
        {item.type === 'quiz' && (
          <InteractiveQuizView item={item} profileId={profileId} />
        )}
      </div>
    </div>
  )
}
