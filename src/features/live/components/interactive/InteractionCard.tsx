import React from 'react'
import { Vote, Trophy, HelpCircle, Check, ArrowRight, Play } from 'lucide-react'
import type { InteractiveItem } from '../../../../types/interactive'
import { useInteractiveContent } from '../../../../hooks/useInteractiveContent'
import { Button } from '../../../../components/common/Button'

export interface InteractionCardProps {
  item: InteractiveItem
  profileId?: string
  onOpen: (item: InteractiveItem) => void
  onTuneChannel?: (channelId: string) => void
}

export const InteractionCard: React.FC<InteractionCardProps> = ({
  item,
  profileId,
  onOpen,
  onTuneChannel,
}) => {
  const { hasParticipated, getParticipation } = useInteractiveContent(profileId)
  const isVoted = hasParticipated(item.id)
  const record = getParticipation(item.id)
  const isClosed = item.status === 'closed'

  return (
    <div
      data-testid={`interaction-card-${item.id}`}
      className={`relative rounded-2xl border p-4 sm:p-5 flex flex-col justify-between gap-4 transition-all duration-200 shadow-md ${
        isVoted
          ? 'border-[var(--accent-primary)]/60 bg-[var(--bg-card)]'
          : 'border-[var(--border-subtle)] bg-[var(--bg-card)]/90 hover:border-white/20'
      }`}
    >
      {/* Top Metadata Row */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {/* Channel Pill */}
            <span
              onClick={() => onTuneChannel?.(item.channelId)}
              className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-[var(--bg-elevated)] text-[var(--accent-primary)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/50 cursor-pointer transition-colors"
              title={`Tune Channel ${item.channelNumber}`}
            >
              CH {item.channelNumber} • {item.channelTitle}
            </span>

            {/* Type Badge */}
            {item.type === 'poll' ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--accent-primary)]/20 text-[var(--accent-secondary)] border border-[var(--accent-primary)]/40 flex items-center gap-1">
                <Vote className="w-3 h-3" />
                POLL
              </span>
            ) : item.type === 'voting' ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                VOTING
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                QUIZ
              </span>
            )}
          </div>

          {/* Status Badge */}
          {isClosed ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
              CONCLUDED
            </span>
          ) : isVoted ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-semibold">
              <Check className="w-2.5 h-2.5" />
              {item.type === 'quiz' ? `COMPLETED (${record?.quizScore}/${record?.quizTotal})` : 'PARTICIPATED'}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
              ACTIVE NOW
            </span>
          )}
        </div>

        {/* Programme Title Context */}
        <div className="text-xs font-mono text-[var(--text-muted)]">
          Programme: <span className="text-[var(--text-secondary)] font-semibold">{item.programTitle}</span>
        </div>

        {/* Interaction Title & Question */}
        <div className="space-y-1.5">
          <h3 className="font-display font-bold text-base sm:text-lg text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors line-clamp-2">
            {item.title}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
            {item.question}
          </p>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
        <span className="text-[11px] font-mono text-[var(--text-muted)]">
          {item.type === 'quiz'
            ? `${item.quizQuestions?.length || 3} Questions`
            : `${item.options.length} Options • ${item.totalVotes.toLocaleString()} votes`}
        </span>

        <div className="flex items-center gap-2">
          {onTuneChannel && !isClosed && (
            <button
              type="button"
              onClick={() => onTuneChannel(item.channelId)}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
              title={`Tune to CH ${item.channelNumber}`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          )}

          <Button
            variant={isVoted || isClosed ? 'outline' : 'primary'}
            size="sm"
            data-testid={`open-interaction-btn-${item.id}`}
            onClick={() => onOpen(item)}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            {isClosed ? 'View Results' : isVoted ? 'View Results' : item.type === 'quiz' ? 'Start Quiz' : 'Vote Now'}
          </Button>
        </div>
      </div>
    </div>
  )
}
