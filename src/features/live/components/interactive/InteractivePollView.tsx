import React, { useState } from 'react'
import { Check, Vote, CheckCircle2, AlertCircle } from 'lucide-react'
import type { InteractiveItem } from '../../../../types/interactive'
import { useInteractiveContent } from '../../../../hooks/useInteractiveContent'
import { Button } from '../../../../components/common/Button'

export interface InteractivePollViewProps {
  item: InteractiveItem
  profileId?: string
  onComplete?: () => void
}

export const InteractivePollView: React.FC<InteractivePollViewProps> = ({
  item,
  profileId,
  onComplete,
}) => {
  const { hasParticipated, getParticipation, submitPollVote, getInteractionResults } =
    useInteractiveContent(profileId)

  const [selectedOptId, setSelectedOptId] = useState<string | null>(null)
  const isVoted = hasParticipated(item.id)
  const participation = getParticipation(item.id)
  const results = getInteractionResults(item.id)
  const isClosed = item.status === 'closed'

  const handleVote = () => {
    if (!selectedOptId || isVoted || isClosed) return
    const success = submitPollVote(item.id, selectedOptId)
    if (success && onComplete) {
      onComplete()
    }
  }

  return (
    <div className="space-y-5 select-none" data-testid={`poll-view-${item.id}`}>
      {/* Question Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[var(--accent-primary)]/20 text-[var(--accent-secondary)] border border-[var(--accent-primary)]/40 flex items-center gap-1">
            <Vote className="w-3 h-3" />
            {item.badge || 'LIVE POLL'}
          </span>
          {isClosed && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
              CONCLUDED
            </span>
          )}
          {isVoted && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-semibold">
              <Check className="w-2.5 h-2.5" />
              BALLOT RECORDED
            </span>
          )}
        </div>

        <h3 className="font-display font-bold text-lg sm:text-xl text-[var(--text-primary)] leading-snug">
          {item.question}
        </h3>

        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          {item.description}
        </p>
      </div>

      {/* ─── Voting Options or Live Results ─── */}
      <div className="space-y-2.5">
        {!isVoted && !isClosed ? (
          // UNVOTED INTERACTIVE FORM
          item.options.map((option) => {
            const isSelected = selectedOptId === option.id
            return (
              <button
                key={option.id}
                type="button"
                data-testid={`poll-option-${option.id}`}
                onClick={() => setSelectedOptId(option.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/15 ring-2 ring-[var(--accent-primary)]/40 shadow-sm'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 hover:bg-[var(--bg-elevated)] hover:border-white/20'
                }`}
              >
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="text-sm font-semibold text-[var(--text-primary)]">
                    {option.label}
                  </div>
                  {option.subtitle && (
                    <div className="text-xs text-[var(--text-muted)] line-clamp-1">
                      {option.subtitle}
                    </div>
                  )}
                </div>

                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                    isSelected
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--accent-contrast)]'
                      : 'border-white/30 bg-black/20'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            )
          })
        ) : (
          // LIVE / FINAL RESULTS DISPLAY
          results?.options.map((option) => {
            const isUserPick =
              option.id === participation?.selectedOptionId || option.isUserSelection
            return (
              <div
                key={option.id}
                data-testid={`poll-result-${option.id}`}
                className={`relative p-3.5 rounded-xl border overflow-hidden transition-all ${
                  isUserPick
                    ? 'border-[var(--accent-primary)]/70 bg-[var(--accent-primary)]/10 ring-1 ring-[var(--accent-primary)]/30'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40'
                }`}
              >
                {/* Background animated percentage bar */}
                <div
                  className={`absolute left-0 top-0 bottom-0 opacity-20 transition-all duration-700 ease-out ${
                    isUserPick ? 'bg-[var(--accent-primary)]' : 'bg-white/30'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(3, option.percentage))}%` }}
                />

                <div className="relative z-10 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">
                          {option.label}
                        </span>
                        {isUserPick && (
                          <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded bg-[var(--accent-primary)] text-[var(--accent-contrast)]">
                            YOUR VOTE
                          </span>
                        )}
                      </div>
                      {option.subtitle && (
                        <p className="text-xs text-[var(--text-muted)] line-clamp-1">
                          {option.subtitle}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono text-base font-extrabold text-[var(--accent-secondary)]">
                        {option.percentage}%
                      </span>
                      <div className="text-[10px] font-mono text-[var(--text-muted)]">
                        {option.displayVotes.toLocaleString()} votes
                      </div>
                    </div>
                  </div>

                  {/* Horizontal visual progress fill */}
                  <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        isUserPick
                          ? 'bg-[var(--accent-primary)]'
                          : 'bg-white/40'
                      }`}
                      style={{ width: `${option.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ─── Actions & Footnote ─── */}
      <div className="space-y-3 pt-2">
        {!isVoted && !isClosed && (
          <Button
            variant="primary"
            size="md"
            className="w-full"
            disabled={!selectedOptId}
            data-testid="submit-poll-vote"
            onClick={handleVote}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Submit Poll Vote
          </Button>
        )}

        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">
          <span>
            Total Audited Ballots: <strong className="text-[var(--text-primary)] font-bold">{results?.totalVotes.toLocaleString() || item.totalVotes.toLocaleString()}</strong>
          </span>
          <span>{item.closingTimeText}</span>
        </div>

        {item.disclosureNotice && (
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] opacity-80">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{item.disclosureNotice}</span>
          </div>
        )}
      </div>
    </div>
  )
}
