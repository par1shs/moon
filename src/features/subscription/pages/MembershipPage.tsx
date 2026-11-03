import React, { useState } from 'react'
import { motion } from 'motion/react'
import {
  Sparkles,
  Check,
  X,
  CreditCard,
  AlertTriangle,
  RotateCcw,
  ChevronDown,
  Info,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '../../../components/common/Button'
import type { Profile } from '../../profiles/types'
import type { SubscriptionPlanId, BillingFrequency } from '../../../types'
import {
  SUBSCRIPTION_PLAN_LIST,
  PLAN_COMPARISON_MATRIX,
  SUBSCRIPTION_FAQS,
  calculateAnnualSavings,
} from '../../../data/subscriptionPlans'
import { useSubscriptionTier } from '../../../hooks/useSubscriptionTier'
import { PlanUpgradeModal } from '../../../components/subscription/PlanUpgradeModal'
import { useReducedMotionPreference } from '../../../hooks/useReducedMotionPreference'

export interface MembershipPageProps {
  profile: Profile
  onNavigateHome?: () => void
}

export const MembershipPage: React.FC<MembershipPageProps> = ({
  profile,
  onNavigateHome,
}) => {
  const reducedMotion = useReducedMotionPreference()
  const {
    subscription,
    tier,
    plan: currentPlan,
    billingFrequency: activeBillingFrequency,
    setPlan,
    cancelSubscription,
    reactivateSubscription,
    resetToFree,
  } = useSubscriptionTier(profile.id)

  const [selectedBillingFrequency, setSelectedBillingFrequency] =
    useState<BillingFrequency>(activeBillingFrequency || 'monthly')

  // Upgrade / Downgrade confirmation modal state
  const [targetPlanToChange, setTargetPlanToChange] = useState<SubscriptionPlanId | null>(null)
  const [faqExpandedIndex, setFaqExpandedIndex] = useState<number | null>(null)

  const handleSelectPlan = (planId: SubscriptionPlanId) => {
    if (planId === tier && selectedBillingFrequency === activeBillingFrequency) {
      return // Already on this plan and frequency
    }
    setTargetPlanToChange(planId)
  }

  const handleConfirmPlanChange = (planId: SubscriptionPlanId, freq: BillingFrequency) => {
    setPlan(planId, freq)
    setTargetPlanToChange(null)
  }

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Active'
    try {
      return new Date(isoString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return isoString
    }
  }

  return (
    <div
      className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 select-none"
      data-testid="membership-page"
    >
      {/* Top back navigation (if provided) */}
      {onNavigateHome && (
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateHome}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            Back to Home
          </Button>
        </div>
      )}

      {/* ─── 1. Header & Hero ─── */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/40 text-[var(--accent-secondary)] shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          <span>Membership &amp; Subscription Plans</span>
        </div>

        <h1 className="font-display font-black text-3xl sm:text-5xl text-[var(--text-primary)] tracking-tight">
          One Story. Every Screen. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-[var(--text-primary)] via-[var(--accent-secondary)] to-[var(--accent-primary)] bg-clip-text text-transparent">
            Your Perfect Plan.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
          Stream cinematic originals, Live TV, and exclusive interactive experiences with flexible plans. Switch or cancel anytime.
        </p>

        {/* Prototype Notice */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-muted)]">
          <Info className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
          <span>Interactive Prototype: Illustrative Indian pricing tiers with frontend-only simulation.</span>
        </div>
      </div>

      {/* ─── 2. Monthly / Annual Billing Toggle ─── */}
      <div className="flex flex-col items-center gap-2 pt-2">
        <div
          data-testid="billing-frequency-toggle"
          className="inline-flex items-center p-1.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-inner"
        >
          <button
            type="button"
            data-testid="billing-monthly-btn"
            onClick={() => setSelectedBillingFrequency('monthly')}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer ${
              selectedBillingFrequency === 'monthly'
                ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Monthly Billing
          </button>

          <button
            type="button"
            data-testid="billing-annual-btn"
            onClick={() => setSelectedBillingFrequency('annual')}
            className={`relative px-5 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
              selectedBillingFrequency === 'annual'
                ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span>Annual Billing</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-bold uppercase tracking-wider">
              Save ~17%
            </span>
          </button>
        </div>

        <span className="text-xs font-mono text-[var(--text-muted)]">
          {selectedBillingFrequency === 'annual'
            ? 'Get 2 months free with annual billing plans.'
            : 'Pay month-to-month with flexible cancellation.'}
        </span>
      </div>

      {/* ─── 3. Three Pricing Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        {SUBSCRIPTION_PLAN_LIST.map((plan) => {
          const isCurrentPlan = tier === plan.id
          const isTargetFreqSame = selectedBillingFrequency === subscription.billingFrequency
          const isExactlyActive = isCurrentPlan && isTargetFreqSame
          const { savingsAmount, monthlyEquivalent } = calculateAnnualSavings(plan)

          const displayPrice =
            selectedBillingFrequency === 'annual' ? plan.annualPrice : plan.monthlyPrice
          const pricePeriod = selectedBillingFrequency === 'annual' ? '/year' : '/month'

          return (
            <motion.div
              key={plan.id}
              data-testid={`plan-card-${plan.id}`}
              initial={{ opacity: 0, y: reducedMotion ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`relative flex flex-col justify-between rounded-3xl p-6 sm:p-8 backdrop-blur-xl transition-all duration-200 border ${
                isCurrentPlan
                  ? 'bg-[var(--bg-elevated)]/90 border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/40 shadow-[0_12px_40px_rgba(0,0,0,0.5)]'
                  : 'bg-[var(--bg-card)]/75 border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/40 hover:bg-[var(--bg-elevated)]/50 shadow-md'
              }`}
            >
              {/* Highlight Aura */}
              <div
                className="absolute top-0 right-0 w-44 h-44 rounded-full blur-[70px] opacity-15 pointer-events-none"
                style={{ backgroundColor: plan.highlightColor }}
              />

              {/* Top Row: Plan Name & Badge */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display font-black text-2xl text-[var(--text-primary)]">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                      {plan.tagline}
                    </p>
                  </div>

                  {isCurrentPlan ? (
                    <span
                      data-testid="current-plan-badge"
                      className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[var(--accent-primary)] text-[var(--accent-contrast)] shadow-md"
                    >
                      Active Plan
                    </span>
                  ) : plan.id === 'standard' ? (
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-500/15 border border-sky-500/40 text-sky-300 shadow-xs"
                    >
                      RECOMMENDED
                    </span>
                  ) : plan.badgeText ? (
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border"
                      style={{
                        backgroundColor: `${plan.highlightColor}15`,
                        borderColor: `${plan.highlightColor}40`,
                        color: plan.highlightColor,
                      }}
                    >
                      {plan.badgeText}
                    </span>
                  ) : null}
                </div>

                {/* Price block */}
                <div className="pt-2 border-t border-[var(--border-subtle)]">
                  <div className="flex items-baseline gap-1">
                    <span className="font-display font-black text-4xl sm:text-5xl text-[var(--text-primary)]">
                      {plan.currency}{displayPrice}
                    </span>
                    <span className="text-xs font-mono text-[var(--text-muted)]">
                      {pricePeriod}
                    </span>
                  </div>

                  {selectedBillingFrequency === 'annual' && plan.monthlyPrice > 0 ? (
                    <div className="mt-1 flex items-center gap-2 text-xs font-mono">
                      <span className="text-emerald-400 font-semibold">
                        ~{plan.currency}{monthlyEquivalent}/mo
                      </span>
                      <span className="text-[var(--text-muted)]">•</span>
                      <span className="text-emerald-400">
                        Save {plan.currency}{savingsAmount}/yr
                      </span>
                    </div>
                  ) : (
                    <div className="mt-1 text-xs font-mono text-[var(--text-muted)]">
                      {plan.monthlyPrice === 0 ? 'Free forever' : 'Billed monthly'}
                    </div>
                  )}
                </div>

                {/* Feature checklist */}
                <div className="pt-3 space-y-2.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent-secondary)] font-semibold block">
                    Plan Features:
                  </span>
                  <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 mt-6 border-t border-[var(--border-subtle)]">
                {isExactlyActive ? (
                  <Button
                    variant="outline"
                    size="md"
                    disabled
                    className="w-full justify-center opacity-80 cursor-default font-mono font-bold text-xs"
                  >
                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                    <span>Current Plan</span>
                  </Button>
                ) : (
                  <Button
                    variant={plan.id === 'premium' ? 'primary' : 'secondary'}
                    size="md"
                    data-testid={`plan-action-btn-${plan.id}`}
                    onClick={() => handleSelectPlan(plan.id)}
                    className="w-full justify-center font-display font-bold text-xs tracking-wider uppercase cursor-pointer"
                  >
                    {isCurrentPlan
                      ? `Switch to ${selectedBillingFrequency === 'annual' ? 'Annual' : 'Monthly'}`
                      : tier === 'free'
                      ? `Upgrade to ${plan.name}`
                      : plan.id === 'premium'
                      ? 'Upgrade to Premium'
                      : plan.id === 'free'
                      ? 'Downgrade to Free'
                      : `Switch to ${plan.name}`}
                  </Button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* ─── 4. Active Subscription Status & Cancellation Panel ─── */}
      <div
        data-testid="active-subscription-panel"
        className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)]/80 border border-[var(--border-subtle)] backdrop-blur-md space-y-6 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-primary)] shadow-sm">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                  Active Subscription: {currentPlan.name}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                    subscription.status === 'cancelled'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {subscription.status === 'cancelled' ? 'Cancellation Pending' : 'Active'}
                </span>
              </div>
              <p className="text-xs font-mono text-[var(--text-muted)]">
                Profile: <strong className="text-[var(--text-primary)]">{profile.name}</strong> • Billing Frequency: {subscription.billingFrequency}
              </p>
            </div>
          </div>

          {/* Cancellation / Reactivation action */}
          {tier !== 'free' && (
            <div className="flex flex-wrap items-center gap-3">
              {subscription.status === 'cancelled' ? (
                <Button
                  variant="primary"
                  size="sm"
                  data-testid="reactivate-subscription-btn"
                  onClick={reactivateSubscription}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  className="font-mono text-xs"
                >
                  Resume Membership
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="cancel-subscription-btn"
                  onClick={cancelSubscription}
                  className="text-xs font-mono text-rose-300 hover:text-rose-200 hover:border-rose-400"
                >
                  Cancel Plan
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                data-testid="debug-reset-free-btn"
                onClick={resetToFree}
                className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-dashed border-[var(--border-subtle)]"
                title="Prototype simulation: immediately revert to Free tier"
              >
                Reset to Free (Debug)
              </Button>
            </div>
          )}
        </div>

        {/* Subscription Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-[var(--bg-elevated)]/50 border border-[var(--border-subtle)] space-y-1">
            <span className="text-[var(--text-muted)] uppercase block">Plan Tier</span>
            <span className="font-bold text-[var(--text-primary)] text-sm">
              {currentPlan.name}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-elevated)]/50 border border-[var(--border-subtle)] space-y-1">
            <span className="text-[var(--text-muted)] uppercase block">Simulated Price</span>
            <span className="font-bold text-[var(--text-primary)] text-sm">
              {currentPlan.currency}
              {subscription.billingFrequency === 'annual'
                ? currentPlan.annualPrice
                : currentPlan.monthlyPrice}
              /{subscription.billingFrequency === 'annual' ? 'yr' : 'mo'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-elevated)]/50 border border-[var(--border-subtle)] space-y-1">
            <span className="text-[var(--text-muted)] uppercase block">Renewal / Expiry</span>
            <span className="font-bold text-[var(--accent-secondary)] text-sm">
              {formatDate(subscription.renewalDateISO)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-elevated)]/50 border border-[var(--border-subtle)] space-y-1">
            <span className="text-[var(--text-muted)] uppercase block">Playback Experience</span>
            <span className="font-bold text-emerald-400 text-sm">
              {currentPlan.adSupported ? 'Ad-Supported' : '100% Ad-Free'}
            </span>
          </div>
        </div>

        {subscription.status === 'cancelled' && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-mono flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Your cancellation is registered. You retain all {currentPlan.name} benefits until {formatDate(subscription.renewalDateISO)}, after which your profile returns to Free.
            </span>
          </div>
        )}
      </div>

      {/* ─── 5. Feature Comparison Table ─── */}
      <div className="space-y-4">
        <div className="text-center space-y-1">
          <h2 className="font-display font-bold text-2xl text-[var(--text-primary)]">
            Compare All Plans Side-by-Side
          </h2>
          <p className="text-xs sm:text-sm font-mono text-[var(--text-muted)]">
            Detailed entitlement comparison across streaming quality, ads, channels, and interactive television.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]/75 backdrop-blur-md overflow-x-auto shadow-md">
          <table className="w-full text-left text-xs font-mono border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/80 text-[var(--text-primary)]">
                <th className="p-4 sm:p-5 font-bold uppercase tracking-wider w-1/3">Features &amp; Entitlements</th>
                <th className="p-4 sm:p-5 font-bold uppercase tracking-wider text-center text-slate-400">
                  Free
                </th>
                <th className="p-4 sm:p-5 font-bold uppercase tracking-wider text-center text-sky-400">
                  Standard
                </th>
                <th className="p-4 sm:p-5 font-bold uppercase tracking-wider text-center text-amber-400">
                  Premium
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {PLAN_COMPARISON_MATRIX.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-[var(--border-subtle)]/40 transition-colors"
                >
                  <td className="p-4 sm:p-5 font-sans font-medium text-[var(--text-primary)]">
                    <span className="block">{row.feature}</span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] block">
                      {row.category}
                    </span>
                  </td>

                  {/* Free cell */}
                  <td className="p-4 sm:p-5 text-center text-[var(--text-secondary)]">
                    {typeof row.free === 'boolean' ? (
                      row.free ? (
                        <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-[var(--text-muted)] opacity-40 mx-auto" />
                      )
                    ) : (
                      <span>{row.free}</span>
                    )}
                  </td>

                  {/* Standard cell */}
                  <td className="p-4 sm:p-5 text-center text-[var(--text-primary)] font-medium">
                    {typeof row.standard === 'boolean' ? (
                      row.standard ? (
                        <Check className="w-4 h-4 text-sky-400 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-[var(--text-muted)] opacity-40 mx-auto" />
                      )
                    ) : (
                      <span>{row.standard}</span>
                    )}
                  </td>

                  {/* Premium cell */}
                  <td className="p-4 sm:p-5 text-center text-[var(--text-primary)] font-semibold bg-amber-500/5">
                    {typeof row.premium === 'boolean' ? (
                      row.premium ? (
                        <Check className="w-4 h-4 text-amber-400 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-[var(--text-muted)] opacity-40 mx-auto" />
                      )
                    ) : (
                      <span>{row.premium}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 6. Frequently Asked Questions (FAQ) ─── */}
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className="text-center space-y-1">
          <h2 className="font-display font-bold text-2xl text-[var(--text-primary)]">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm font-mono text-[var(--text-muted)]">
            Everything you need to know about PIXEL+ membership, billing simulation, and plans.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {SUBSCRIPTION_FAQS.map((faq, idx) => {
            const isExpanded = faqExpandedIndex === idx
            return (
              <div
                key={idx}
                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]/80 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setFaqExpandedIndex(isExpanded ? null : idx)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-sm sm:text-base font-display font-bold text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 shrink-0 ml-2 ${
                      isExpanded ? 'rotate-180 text-[var(--accent-primary)]' : ''
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="p-4 sm:p-5 pt-0 text-xs sm:text-sm text-[var(--text-secondary)] font-sans leading-relaxed border-t border-[var(--border-subtle)]/60">
                    {faq.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Plan Upgrade / Downgrade Confirmation Dialog */}
      {targetPlanToChange && (
        <PlanUpgradeModal
          isOpen={Boolean(targetPlanToChange)}
          onClose={() => setTargetPlanToChange(null)}
          currentPlanId={tier}
          targetPlanId={targetPlanToChange}
          targetBillingFrequency={selectedBillingFrequency}
          onConfirmPlanChange={handleConfirmPlanChange}
        />
      )}
    </div>
  )
}
