import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Sparkles,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldAlert,
  Sliders,
} from 'lucide-react'
import { Button } from '../common/Button'
import type { SubscriptionPlanId, BillingFrequency } from '../../types'
import { getPlanById, calculateAnnualSavings } from '../../data/subscriptionPlans'
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference'

export interface PlanUpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlanId: SubscriptionPlanId
  targetPlanId?: SubscriptionPlanId
  targetBillingFrequency?: BillingFrequency
  featureName?: string
  featureDescription?: string
  onConfirmPlanChange: (planId: SubscriptionPlanId, billing: BillingFrequency) => void
  onNavigateToMembership?: () => void
}

export const PlanUpgradeModal: React.FC<PlanUpgradeModalProps> = ({
  isOpen,
  onClose,
  currentPlanId,
  targetPlanId = 'premium',
  targetBillingFrequency = 'monthly',
  featureName,
  featureDescription,
  onConfirmPlanChange,
  onNavigateToMembership,
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotionPreference()
  const targetPlan = getPlanById(targetPlanId)
  const isDowngrade =
    (currentPlanId === 'premium' && targetPlanId !== 'premium') ||
    (currentPlanId === 'standard' && targetPlanId === 'free')

  const { savingsAmount, monthlyEquivalent } = calculateAnnualSavings(targetPlan)

  // Keyboard navigation & backdrop click
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirmPlanChange(targetPlanId, targetBillingFrequency)
    onClose()
  }

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-upgrade-title"
        data-testid="plan-upgrade-modal"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.95, y: reducedMotion ? 0 : 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.95, y: reducedMotion ? 0 : 16 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-lg rounded-3xl bg-[var(--bg-card)]/95 border border-[var(--border-subtle)] shadow-[0_24px_60px_rgba(0,0,0,0.85)] p-6 sm:p-8 space-y-6 overflow-hidden select-none"
        >
          {/* Ambient Corner Aura */}
          <div
            className="absolute -top-24 -right-24 w-60 h-60 rounded-full blur-[90px] opacity-25 pointer-events-none"
            style={{ backgroundColor: targetPlan.highlightColor }}
          />

          {/* Close Icon Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-5 right-5 p-2 rounded-full bg-[var(--bg-elevated)] hover:bg-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header Icon & Title */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider border flex items-center gap-1.5"
                style={{
                  backgroundColor: `${targetPlan.highlightColor}20`,
                  borderColor: `${targetPlan.highlightColor}50`,
                  color: targetPlan.highlightColor,
                }}
              >
                {isDowngrade ? (
                  <>
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Change Plan</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Plan Upgrade Required</span>
                  </>
                )}
              </span>

              {targetPlan.badgeText && !isDowngrade && (
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                  {targetPlan.badgeText}
                </span>
              )}
            </div>

            <h3
              id="plan-upgrade-title"
              className="font-display font-extrabold text-2xl sm:text-3xl text-[var(--text-primary)] tracking-tight"
            >
              {isDowngrade
                ? `Switch to ${targetPlan.name} Plan`
                : featureName
                ? `Unlock with ${targetPlan.name}`
                : `Upgrade to PIXEL+ ${targetPlan.name}`}
            </h3>

            {/* Contextual description of the restricted feature */}
            {featureName ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-mono flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-300 block">{featureName}</span>
                  <span>{featureDescription || 'This feature requires a higher tier plan to access.'}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                {targetPlan.tagline}
              </p>
            )}
          </div>

          {/* Plan Summary Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-elevated)]/70 border border-[var(--border-subtle)] space-y-4">
            <div className="flex items-baseline justify-between border-b border-[var(--border-subtle)] pb-3">
              <div>
                <span className="text-xs font-mono text-[var(--text-muted)] block uppercase">
                  Selected Plan
                </span>
                <span className="font-display font-bold text-xl text-[var(--text-primary)]">
                  {targetPlan.name}
                </span>
              </div>

              <div className="text-right">
                <div className="font-display font-black text-2xl sm:text-3xl text-[var(--text-primary)]">
                  {targetPlan.currency}
                  {targetBillingFrequency === 'annual'
                    ? targetPlan.annualPrice
                    : targetPlan.monthlyPrice}
                  <span className="text-xs font-mono text-[var(--text-muted)] font-normal">
                    {targetBillingFrequency === 'annual' ? '/yr' : '/mo'}
                  </span>
                </div>
                {targetBillingFrequency === 'annual' && targetPlan.monthlyPrice > 0 && (
                  <span className="text-[11px] font-mono text-emerald-400 block font-semibold">
                    ~{targetPlan.currency}{monthlyEquivalent}/mo • Save {targetPlan.currency}{savingsAmount}
                  </span>
                )}
              </div>
            </div>

            {/* Key benefits list */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-[var(--accent-secondary)] uppercase tracking-wider block">
                What changes with this plan:
              </span>
              <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                {targetPlan.features.slice(0, 4).map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Prototype disclaimer pill */}
          <div className="p-2.5 rounded-xl bg-[var(--bg-main)]/60 border border-[var(--border-subtle)] text-center">
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              Prototype Simulation: Changes update your profile immediately. No real billing or payment method needed.
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              data-testid="confirm-plan-change-btn"
              onClick={handleConfirm}
              className="w-full sm:flex-1 justify-center py-3 font-display font-bold text-sm tracking-wide"
            >
              {isDowngrade ? `Confirm Switch to ${targetPlan.name}` : `Upgrade to ${targetPlan.name} Now`}
            </Button>

            {onNavigateToMembership && (
              <Button
                variant="outline"
                size="md"
                data-testid="view-membership-plans-btn"
                onClick={() => {
                  onClose()
                  onNavigateToMembership()
                }}
                className="w-full sm:w-auto justify-center text-xs font-mono"
              >
                <span>Compare All Plans</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
