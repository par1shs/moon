import React, { useState } from 'react'
import { Trophy, Check, CheckCircle2, AlertCircle } from 'lucide-react'
import type { InteractiveItem } from '../../../../types/interactive'
import { useInteractiveContent } from '../../../../hooks/useInteractiveContent'
import { Button } from '../../../../components/common/Button'

export interface InteractiveVotingViewProps {
  item: InteractiveItem
  profileId?: string
  onComplete?: () => void
}

export const InteractiveVotingView: React.FC<InteractiveVotingViewProps> = ({
  item,
  profileId,
  onComplete,
}) => {
  const { hasParticipated, getParticipation, submitAudienceVote, getInteractionResults } =
    useInteractiveContent(profileId)

  const [selectedOptId, setSelectedOptId] = useState<string | null>(null)
  const isVoted = hasParticipated(item.id)
  const participation = getParticipation(item.id)
  const results = getInteractionResults(item.id)
  const isClosed = item.status === 'closed'

  // Determine current front-runner
  const sortedOptions = results?.options ? [...results.options].sort((a, b) => b.displayVotes - a.displayVotes) : []
  const leaderId = sortedOptions[0]?.id

  const handleCastVote = () => {
    if (!selectedOptId || isVoted || isClosed) return
    const success = submitAudienceVote(item.id, selectedOptId)
    if (success && onComplete) {
      onComplete()
    }
  }

  return (
    <div className="space-y-5 select-none" data-testid={`voting-view-${item.id}`}>
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
            <Trophy className="w-3 h-3" />
            {item.badge || 'AUDIENCE VOTE'}
          </span>
          {isClosed && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
              VOTING CLOSED
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

      {/* ─── Contestant / Candidate Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {!isVoted && !isClosed ? (
          // VOTING CANDIDATE SELECTION
          item.options.map((option) => {
            const isSelected = selectedOptId === option.id
            return (
              <div
                key={option.id}
                data-testid={`voting-option-${option.id}`}
                onClick={() => setSelectedOptId(option.id)}
                className={`relative rounded-xl border p-3 flex flex-col justify-between gap-3 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/15 ring-2 ring-[var(--accent-primary)]/50 shadow-md'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 hover:bg-[var(--bg-elevated)] hover:border-white/20'
                }`}
              >
                {/* Photo / Artwork if available */}
                {option.artworkUrl && (
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black border border-white/10">
                    <img
                      src={option.artworkUrl}
                      alt={option.label}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    {isSelected && (
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-[10px] font-mono font-bold flex items-center gap-1 shadow">
                        <Check className="w-3 h-3 stroke-[3]" /> Selected
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <h4 className="font-display font-bold text-sm text-[var(--text-primary)]">
                    {option.label}
                  </h4>
                  {option.subtitle && (
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                      {option.subtitle}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-[var(--border-subtle)]/60 flex items-center justify-between text-xs font-mono">
                  <span className="text-[var(--text-muted)]">Select Candidate</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--accent-contrast)]'
                        : 'border-white/30'
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          // RESULTS BREAKDOWN
          results?.options.map((option) => {
            const isUserPick =
              option.id === participation?.selectedOptionId || option.isUserSelection
            const isLeader = option.id === leaderId

            return (
              <div
                key={option.id}
                data-testid={`voting-result-${option.id}`}
                className={`relative rounded-xl border p-3.5 space-y-3 overflow-hidden ${
                  isUserPick
                    ? 'border-[var(--accent-primary)]/80 bg-[var(--accent-primary)]/10 ring-1 ring-[var(--accent-primary)]/40'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40'
                }`}
              >
                {/* Background fill */}
                <div
                  className={`absolute left-0 top-0 bottom-0 opacity-15 transition-all duration-700 ease-out ${
                    isUserPick ? 'bg-[var(--accent-primary)]' : 'bg-white/20'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(4, option.percentage))}%` }}
                />

                <div className="relative z-10 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-display font-bold text-sm text-[var(--text-primary)]">
                          {option.label}
                        </span>
                        {isLeader && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                            LEADER
                          </span>
                        )}
                        {isUserPick && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[var(--accent-primary)] text-[var(--accent-contrast)]">
                            YOUR CHOICE
                          </span>
                        )}
                      </div>
                      {option.subtitle && (
                        <p className="text-xs text-[var(--text-muted)] line-clamp-1 mt-0.5">
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

                  {/* Percentage Bar */}
                  <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        isUserPick
                          ? 'bg-[var(--accent-primary)]'
                          : isLeader
                          ? 'bg-amber-400'
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
            data-testid="submit-audience-vote"
            onClick={handleCastVote}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Cast Official Ballot
          </Button>
        )}

        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">
          <span>
            Total Audience Ballots: <strong className="text-[var(--text-primary)] font-bold">{results?.totalVotes.toLocaleString() || item.totalVotes.toLocaleString()}</strong>
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
