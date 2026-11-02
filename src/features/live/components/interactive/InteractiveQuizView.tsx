import React, { useState, useEffect, useRef } from 'react'
import {
  HelpCircle,
  Timer,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Award,
  AlertCircle,
} from 'lucide-react'
import type { InteractiveItem } from '../../../../types/interactive'
import { useInteractiveContent } from '../../../../hooks/useInteractiveContent'
import { Button } from '../../../../components/common/Button'

export interface InteractiveQuizViewProps {
  item: InteractiveItem
  profileId?: string
  onComplete?: () => void
}

const QUESTION_TIMER_SECONDS = 25

export const InteractiveQuizView: React.FC<InteractiveQuizViewProps> = ({
  item,
  profileId,
  onComplete,
}) => {
  const { hasParticipated, getParticipation, submitQuizAnswers } =
    useInteractiveContent(profileId)

  const isCompleted = hasParticipated(item.id)
  const savedRecord = getParticipation(item.id)

  const questions = item.quizQuestions || []
  const totalQuestions = questions.length

  // In-progress quiz state
  const [currentIdx, setCurrentIdx] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [isAnsweredCurrent, setIsAnsweredCurrent] = useState(false)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIMER_SECONDS)
  const timerRef = useRef<number | null>(null)

  const currentQuestion = questions[currentIdx]

  // Timer countdown per question
  useEffect(() => {
    if (isCompleted || isAnsweredCurrent || !currentQuestion) return

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          // Time expired: auto-reveal as unanswered/incorrect
          setIsAnsweredCurrent(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [currentIdx, isCompleted, isAnsweredCurrent, currentQuestion])

  // Answer selection handler
  const handleSelectOption = (optionId: string) => {
    if (isAnsweredCurrent || isCompleted || !currentQuestion) return
    if (timerRef.current) clearInterval(timerRef.current)

    setSelectedOptionId(optionId)
    setIsAnsweredCurrent(true)

    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }))
  }

  // Next question or finish handler
  const handleNext = () => {
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx((prev) => prev + 1)
      setIsAnsweredCurrent(false)
      setSelectedOptionId(null)
      setTimeLeft(QUESTION_TIMER_SECONDS)
    } else {
      // Calculate final score
      let score = 0
      questions.forEach((q) => {
        const userChoice = userAnswers[q.id] || (q.id === currentQuestion.id ? selectedOptionId : null)
        if (userChoice === q.correctOptionId) {
          score += 1
        }
      })

      const finalAnswers = {
        ...userAnswers,
        ...(currentQuestion && selectedOptionId ? { [currentQuestion.id]: selectedOptionId } : {}),
      }

      submitQuizAnswers(item.id, finalAnswers, score, totalQuestions)
      if (onComplete) {
        onComplete()
      }
    }
  }

  // If already completed previously, show final score summary
  if (isCompleted && savedRecord) {
    const score = savedRecord.quizScore ?? 0
    const total = savedRecord.quizTotal ?? totalQuestions
    const percentScore = total > 0 ? Math.round((score / total) * 100) : 0

    return (
      <div className="space-y-6 select-none" data-testid={`quiz-summary-${item.id}`}>
        {/* Score banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)]/20 via-[var(--bg-elevated)] to-[var(--bg-card)] border border-[var(--accent-primary)]/50 text-center space-y-3 shadow-lg">
          <div className="w-14 h-14 mx-auto rounded-full bg-[var(--accent-primary)]/30 border border-[var(--accent-primary)] flex items-center justify-center text-[var(--accent-secondary)] shadow-inner">
            <Award className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--accent-secondary)] font-bold">
              QUIZ COMPLETED • SCORE CERTIFIED
            </span>
            <h3 className="font-display font-extrabold text-3xl text-[var(--text-primary)]">
              {score} / {total}
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              {percentScore >= 80
                ? 'Outstanding Masterclass! Deep domain expertise demonstrated.'
                : percentScore >= 50
                ? 'Solid performance! Good foundational programme understanding.'
                : 'Good effort! Review the certified answers below to improve your score.'}
            </p>
          </div>

          <div className="w-full max-w-xs mx-auto h-2 rounded-full bg-black/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-700"
              style={{ width: `${percentScore}%` }}
            />
          </div>
        </div>

        {/* Detailed Question Review */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
            Question Review ({totalQuestions} Questions)
          </h4>

          {questions.map((q, idx) => {
            const userPick = savedRecord.quizAnswers?.[q.id]
            const isCorrect = userPick === q.correctOptionId
            const correctOpt = q.options.find((o) => o.id === q.correctOptionId)
            const chosenOpt = q.options.find((o) => o.id === userPick)

            return (
              <div
                key={q.id}
                className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                  isCorrect
                    ? 'border-emerald-500/30 bg-emerald-950/10'
                    : 'border-rose-500/30 bg-rose-950/10'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-[var(--text-primary)]">
                    Q{idx + 1}: {q.question}
                  </div>
                  {isCorrect ? (
                    <span className="shrink-0 flex items-center gap-1 font-mono text-[10px] text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> +1
                    </span>
                  ) : (
                    <span className="shrink-0 flex items-center gap-1 font-mono text-[10px] text-rose-400 font-bold">
                      <XCircle className="w-3.5 h-3.5" /> 0
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-[11px] font-mono">
                  <div>
                    <span className="text-[var(--text-muted)]">Your Answer: </span>
                    <span className={isCorrect ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                      {chosenOpt?.label || 'Timed out / Unanswered'}
                    </span>
                  </div>
                  {!isCorrect && correctOpt && (
                    <div>
                      <span className="text-[var(--text-muted)]">Correct Answer: </span>
                      <span className="text-emerald-400 font-semibold">{correctOpt.label}</span>
                    </div>
                  )}
                </div>

                {q.explanation && (
                  <p className="text-[11px] text-[var(--text-secondary)] italic border-t border-white/5 pt-1.5">
                    {q.explanation}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] opacity-80 pt-2 border-t border-[var(--border-subtle)]">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>Quiz results are securely archived in this viewer profile.</span>
        </div>
      </div>
    )
  }

  // Active Quiz In-Progress View
  if (!currentQuestion) return null

  const isLastQuestion = currentIdx === totalQuestions - 1

  return (
    <div className="space-y-5 select-none" data-testid={`quiz-view-${item.id}`}>
      {/* Quiz Progress & Timer Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center gap-1">
              <HelpCircle className="w-3 h-3" />
              {item.badge || 'PROGRAMME QUIZ'}
            </span>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              Question {currentIdx + 1} of {totalQuestions}
            </span>
          </div>

          {/* Countdown Clock Pill */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold border transition-colors ${
              timeLeft <= 5
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                : 'bg-[var(--bg-elevated)] text-[var(--accent-secondary)] border-[var(--border-subtle)]'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>{timeLeft}s</span>
          </div>
        </div>

        {/* Horizontal Question Progress Tracker */}
        <div className="grid grid-cols-3 gap-1.5 py-1">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentIdx
                  ? 'bg-[var(--accent-primary)]'
                  : idx < currentIdx
                  ? 'bg-emerald-500'
                  : 'bg-white/15'
              }`}
            />
          ))}
        </div>

        {/* Question Text */}
        <h3 className="font-display font-bold text-lg sm:text-xl text-[var(--text-primary)] leading-snug pt-1">
          {currentQuestion.question}
        </h3>
      </div>

      {/* ─── Quiz Options ─── */}
      <div className="space-y-2.5">
        {currentQuestion.options.map((option) => {
          const isSelected = selectedOptionId === option.id
          const isCorrect = option.id === currentQuestion.correctOptionId

          let btnClasses =
            'border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 hover:bg-[var(--bg-elevated)] hover:border-white/20'

          if (isAnsweredCurrent) {
            if (isCorrect) {
              btnClasses = 'border-emerald-500 bg-emerald-950/30 text-emerald-300 ring-2 ring-emerald-500/40'
            } else if (isSelected) {
              btnClasses = 'border-rose-500 bg-rose-950/30 text-rose-300 ring-2 ring-rose-500/40'
            } else {
              btnClasses = 'border-white/5 opacity-40 bg-black/20'
            }
          }

          return (
            <button
              key={option.id}
              type="button"
              disabled={isAnsweredCurrent}
              data-testid={`quiz-option-${option.id}`}
              onClick={() => handleSelectOption(option.id)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${btnClasses}`}
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

              {/* Feedback indicator */}
              {isAnsweredCurrent && (
                <div className="shrink-0">
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 stroke-[2.5]" />
                  ) : isSelected ? (
                    <XCircle className="w-5 h-5 text-rose-400 stroke-[2.5]" />
                  ) : null}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* ─── Immediate Feedback & Explanation ─── */}
      {isAnsweredCurrent && (
        <div
          data-testid="quiz-explanation-box"
          className={`p-3.5 rounded-xl border space-y-1.5 animate-in fade-in duration-200 ${
            selectedOptionId === currentQuestion.correctOptionId
              ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
              : 'border-rose-500/40 bg-rose-950/20 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
            {selectedOptionId === currentQuestion.correctOptionId ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Correct!</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Incorrect</span>
              </>
            )}
          </div>
          {currentQuestion.explanation && (
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {currentQuestion.explanation}
            </p>
          )}
        </div>
      )}

      {/* ─── Next Action ─── */}
      {isAnsweredCurrent && (
        <div className="pt-2">
          <Button
            variant="primary"
            size="md"
            className="w-full"
            data-testid="quiz-next-question-btn"
            onClick={handleNext}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {isLastQuestion ? 'Complete Quiz & View Score' : 'Next Question'}
          </Button>
        </div>
      )}
    </div>
  )
}
