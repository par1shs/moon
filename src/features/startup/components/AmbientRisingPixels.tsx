import React, { useMemo } from 'react'
import { motion } from 'motion/react'
import { useReducedMotionPreference } from '../../../hooks/useReducedMotionPreference'

interface AmbientPixel {
  id: number
  leftPercent: number
  sizePx: number
  durationSec: number
  delaySec: number
  driftXPx: number
  colorClass: string
  opacityPeak: number
}

export const AmbientRisingPixels: React.FC = () => {
  const reducedMotion = useReducedMotionPreference()

  // Generate deterministic particles so there is no hydration mismatch
  const particles: AmbientPixel[] = useMemo(() => {
    const list: AmbientPixel[] = []
    const count = 42

    for (let i = 0; i < count; i++) {
      // Pseudo-random deterministic values
      const seed1 = (i * 137.5) % 1
      const seed2 = (i * 269.3) % 1
      const seed3 = (i * 419.7) % 1
      const seed4 = (i * 617.1) % 1

      const sizePx = 4 + Math.floor(seed1 * 8) // 4px to 11px
      const leftPercent = Math.floor(seed2 * 96) + 2 // 2% to 98%
      const durationSec = 3.5 + seed3 * 4.0 // 3.5s to 7.5s
      const delaySec = seed4 * 2.8 // 0s to 2.8s
      const driftXPx = Math.floor((seed1 - 0.5) * 60) // -30px to +30px

      // Cycle colors: primary accent, secondary accent, deep indigo, bright cyan/white
      const colors = [
        'bg-[var(--accent-primary)]',
        'bg-[var(--accent-secondary)]',
        'bg-[#3A4B75]',
        'bg-[#E2E8F8]',
        'bg-[var(--accent-primary)]/80',
      ]
      const colorClass = colors[i % colors.length]
      const opacityPeak = 0.25 + seed3 * 0.55 // 0.25 to 0.80

      list.push({
        id: i,
        leftPercent,
        sizePx,
        durationSec,
        delaySec,
        driftXPx,
        colorClass,
        opacityPeak,
      })
    }
    return list
  }, [])

  if (reducedMotion) return null

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
      data-testid="ambient-rising-pixels"
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            y: '105vh',
            x: 0,
            opacity: 0,
            scale: 0.4,
          }}
          animate={{
            y: '-10vh',
            x: p.driftXPx,
            opacity: [0, p.opacityPeak, p.opacityPeak * 0.8, 0],
            scale: [0.4, 1, 1, 0.7],
          }}
          transition={{
            duration: p.durationSec,
            delay: p.delaySec,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            position: 'absolute',
            left: `${p.leftPercent}%`,
            width: `${p.sizePx}px`,
            height: `${p.sizePx}px`,
            boxShadow: `0 0 ${p.sizePx * 1.5}px currentColor`,
          }}
          className={`${p.colorClass} rounded-[1px]`}
        />
      ))}
    </div>
  )
}
