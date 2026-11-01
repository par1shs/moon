import type { Variants, Transition } from 'motion/react'

/**
 * JUNCTION+ Animation System
 *
 * Designed for a cinematic, restrained, and premium OTT experience.
 * Avoids bouncy or game-like movements. Uses subtle easing and damping.
 */

// Cinematic smooth transitions
export const smoothTransition: Transition = {
  duration: 0.35,
  ease: 'easeOut',
}

export const subtleSpring: Transition = {
  type: 'spring',
  damping: 26,
  stiffness: 240,
  mass: 0.8,
}

export const slowCinematic: Transition = {
  duration: 0.6,
  ease: 'easeInOut',
}

/**
 * Reusable Motion Presets
 */

// Simple Fade In
export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: smoothTransition,
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
}

// Fade Up (subtle 16px slide + fade)
export const fadeUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: smoothTransition,
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
}

// Subtle Scale In (0.96 -> 1.0)
export const scaleInVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: subtleSpring,
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
}

// Staggered Container for lists, cards, and grid items
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
}

// Page Transition for screen and section routing
export const pageTransitionVariants: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
      staggerChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.25,
      ease: 'easeInOut',
    },
  },
}

// Hover Lift for cards and interactive surfaces
export const hoverLift: Variants = {
  initial: {
    y: 0,
    scale: 1,
  },
  hover: {
    y: -4,
    scale: 1.02,
    transition: {
      duration: 0.25,
      ease: 'easeOut',
    },
  },
  tap: {
    y: 0,
    scale: 0.99,
    transition: {
      duration: 0.1,
    },
  },
}

// Modal Backdrop & Dialog Transition
export const modalBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
}

export const modalDialogVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 12,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: subtleSpring,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: { duration: 0.18, ease: 'easeIn' },
  },
}

/**
 * Fallback empty variants for prefers-reduced-motion
 */
export const reducedMotionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.01 } },
  exit: { opacity: 0, transition: { duration: 0.01 } },
}
