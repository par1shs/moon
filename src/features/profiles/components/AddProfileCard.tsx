import React from 'react'
import { motion } from 'motion/react'
import { Plus } from 'lucide-react'
import { useReducedMotionPreference } from '../../../hooks/useReducedMotionPreference'

export interface AddProfileCardProps {
  onClick: () => void
  isAnySelected: boolean
  index: number
}

export const AddProfileCard: React.FC<AddProfileCardProps> = ({
  onClick,
  isAnySelected,
  index,
}) => {
  const reducedMotion = useReducedMotionPreference()

  if (isAnySelected) {
    return null
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: reducedMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reducedMotion ? 0.2 : 0.45,
        delay: index * 0.07,
        ease: [0.2, 0, 0, 1],
      }}
      whileHover={
        reducedMotion
          ? undefined
          : {
              y: -6,
              scale: 1.04,
              transition: { duration: 0.22, ease: 'easeOut' },
            }
      }
      whileTap={reducedMotion ? undefined : { scale: 0.98 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      aria-label="Add new viewer profile"
      className="group relative flex flex-col items-center gap-3.5 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--bg-main)] rounded-2xl select-none"
    >
      {/* Dashed Square Tile matching Avatar dimensions */}
      <div className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-2xl border-2 border-dashed border-[var(--border-subtle)] group-hover:border-[var(--accent-primary)] bg-[var(--bg-card)]/40 hover:bg-[var(--bg-card)]/80 flex flex-col items-center justify-center gap-2 transition-all duration-300 p-4 text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] group-hover:border-[var(--accent-primary)]/50 flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-all duration-200 group-hover:scale-110 shadow-sm">
          <Plus className="w-6 h-6" />
        </div>
        <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
          New Viewer
        </span>
      </div>

      {/* Label and description underneath */}
      <div className="flex flex-col items-center gap-0.5 text-center">
        <span className="font-display font-medium text-sm sm:text-base text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
          Add Profile
        </span>
        <span className="text-[11px] text-[var(--text-muted)]">
          Create a new viewer
        </span>
      </div>
    </motion.div>
  )
}
