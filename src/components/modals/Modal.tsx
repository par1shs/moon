import React, { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'
import { modalBackdropVariants, modalDialogVariants, reducedMotionVariants } from '../../styles/animations'
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference'
import { IconButton } from '../common/IconButton'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  hideCloseButton?: boolean
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  className = '',
  hideCloseButton = false,
}) => {
  const reducedMotion = useReducedMotionPreference()

  // Handle Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <motion.div
            variants={reducedMotion ? reducedMotionVariants : modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Dialog Container */}
          <motion.div
            variants={reducedMotion ? reducedMotionVariants : modalDialogVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`relative w-full ${sizeClasses[size]} bg-gradient-to-b from-[var(--bg-card)] to-[var(--bg-main)] border border-[var(--border-subtle)] rounded-xl shadow-[var(--shadow-elevated)] p-6 z-10 overflow-hidden ${className}`}
          >
            {/* Header */}
            {(title || !hideCloseButton) && (
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  {title && (
                    <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">
                      {title}
                    </h3>
                  )}
                  {description && (
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      {description}
                    </p>
                  )}
                </div>

                {!hideCloseButton && (
                  <IconButton
                    icon={<X className="w-5 h-5" />}
                    aria-label="Close dialog"
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                  />
                )}
              </div>
            )}

            {/* Modal Body */}
            <div>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
