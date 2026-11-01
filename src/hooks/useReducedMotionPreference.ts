import { useReducedMotion } from 'motion/react'

/**
 * Hook to detect whether the user has requested reduced motion.
 * Respects system accessibility preferences across all animations.
 */
export function useReducedMotionPreference(): boolean {
  const prefersReduced = useReducedMotion()
  return Boolean(prefersReduced)
}
