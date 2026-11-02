import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'motion/react'
import { useReducedMotionPreference } from '../../../hooks/useReducedMotionPreference'

interface PixelNode {
  id: string
  col: number
  row: number
  isPlus: boolean
  startOffsetY: number
  startOffsetX: number
  delay: number
  duration: number
}

// 5x7 bitmap matrix for P - I - X - E - L and +
const GLYPH_DATA: Record<string, { matrix: number[][]; colOffset: number; isPlus?: boolean }> = {
  P: {
    matrix: [
      [1, 1, 1, 1, 0],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 0],
      [1, 0, 0, 0, 0],
      [1, 0, 0, 0, 0],
      [1, 0, 0, 0, 0],
    ],
    colOffset: 0,
  },
  I: {
    matrix: [
      [1, 1, 1, 1, 1],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [1, 1, 1, 1, 1],
    ],
    colOffset: 6,
  },
  X: {
    matrix: [
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [0, 1, 0, 1, 0],
      [0, 0, 1, 0, 0],
      [0, 1, 0, 1, 0],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
    ],
    colOffset: 12,
  },
  E: {
    matrix: [
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0],
      [1, 0, 0, 0, 0],
      [1, 1, 1, 1, 0],
      [1, 0, 0, 0, 0],
      [1, 0, 0, 0, 0],
      [1, 1, 1, 1, 1],
    ],
    colOffset: 18,
  },
  L: {
    matrix: [
      [1, 0, 0, 0, 0],
      [1, 0, 0, 0, 0],
      [1, 0, 0, 0, 0],
      [1, 0, 0, 0, 0],
      [1, 0, 0, 0, 0],
      [1, 0, 0, 0, 0],
      [1, 1, 1, 1, 1],
    ],
    colOffset: 24,
  },
  '+': {
    matrix: [
      [0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [1, 1, 1, 1, 1],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 0, 0, 0],
    ],
    colOffset: 31,
    isPlus: true,
  },
}

const TOTAL_COLS = 36
const TOTAL_ROWS = 7

export interface PixelFormationLogoProps {
  onFormed?: () => void
  className?: string
}

export const PixelFormationLogo: React.FC<PixelFormationLogoProps> = ({
  onFormed,
  className = '',
}) => {
  const reducedMotion = useReducedMotionPreference()
  const [isFormed, setIsFormed] = useState(reducedMotion)

  // Generate pixels
  const pixels: PixelNode[] = useMemo(() => {
    const list: PixelNode[] = []

    Object.entries(GLYPH_DATA).forEach(([char, glyph]) => {
      glyph.matrix.forEach((row, r) => {
        row.forEach((active, c) => {
          if (!active) return

          const col = glyph.colOffset + c
          // Deterministic pseudo-random offsets for smooth rendering
          const seed = (col * 17 + r * 31) % 100
          const startOffsetY = 160 + (seed / 100) * 180 // +160px to +340px down
          const startOffsetX = ((seed - 50) / 100) * 120 // -60px to +60px drift

          // Bottom rows rise up first, creating an upward wave
          const baseDelay = 0.12 + (6 - r) * 0.07 + (col / TOTAL_COLS) * 0.28
          const jitter = (seed % 10) * 0.015
          const delay = baseDelay + jitter
          const duration = 0.72 + (seed % 15) * 0.01

          list.push({
            id: `${char}-${r}-${c}`,
            col,
            row: r,
            isPlus: Boolean(glyph.isPlus),
            startOffsetY,
            startOffsetX,
            delay,
            duration,
          })
        })
      })
    })

    return list
  }, [])

  // Trigger formed state after pixels arrive
  useEffect(() => {
    if (reducedMotion) {
      onFormed?.()
      return
    }

    const timer = window.setTimeout(() => {
      setIsFormed(true)
      onFormed?.()
    }, 1350)

    return () => window.clearTimeout(timer)
  }, [reducedMotion, onFormed])

  return (
    <div
      className={`relative inline-flex flex-col items-center select-none ${className}`}
      data-testid="pixel-formation-logo"
    >
      {/* ─── Ambient Glow behind the logo ─── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: isFormed ? 0.35 : 0.15,
          scale: isFormed ? 1.05 : 0.9,
        }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="absolute -inset-10 rounded-full blur-2xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
        }}
      />

      {/* ─── Pixel Matrix Assembly Stage ─── */}
      <div
        className="relative w-[280px] h-[56px] sm:w-[360px] sm:h-[72px] md:w-[432px] md:h-[84px] overflow-visible"
        style={{
          aspectRatio: `${TOTAL_COLS} / ${TOTAL_ROWS}`,
        }}
      >
        {/* The 81 Converging Pixels coming up from below */}
        {pixels.map((p) => {
          const leftPct = (p.col / TOTAL_COLS) * 100
          const topPct = (p.row / TOTAL_ROWS) * 100
          const widthPct = (0.92 / TOTAL_COLS) * 100
          const heightPct = (0.92 / TOTAL_ROWS) * 100

          return (
            <motion.div
              key={p.id}
              initial={
                reducedMotion
                  ? { opacity: 0 }
                  : {
                      y: p.startOffsetY,
                      x: p.startOffsetX,
                      opacity: 0,
                      scale: 0.25,
                      rotate: (p.col % 2 === 0 ? 90 : -90),
                    }
              }
              animate={{
                y: 0,
                x: 0,
                opacity: 1,
                scale: 1,
                rotate: 0,
              }}
              transition={{
                duration: reducedMotion ? 0.3 : p.duration,
                delay: reducedMotion ? 0 : p.delay,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{
                position: 'absolute',
                left: `${leftPct}%`,
                top: `${topPct}%`,
                width: `${widthPct}%`,
                height: `${heightPct}%`,
                boxShadow: p.isPlus
                  ? '0 0 8px var(--accent-glow)'
                  : isFormed
                  ? '0 0 6px rgba(255, 255, 255, 0.25)'
                  : '0 0 10px rgba(255, 255, 255, 0.4)',
              }}
              className={`rounded-[1.5px] transition-colors duration-500 ${
                p.isPlus
                  ? 'bg-[var(--accent-primary)]'
                  : isFormed
                  ? 'bg-[#F4F0EA] border border-white/20'
                  : 'bg-white'
              }`}
            />
          )
        })}

        {/* ─── Laser Light Sweep across the assembled logo ─── */}
        {!reducedMotion && isFormed && (
          <motion.div
            initial={{ x: '-120%', opacity: 0 }}
            animate={{
              x: '220%',
              opacity: [0, 0.5, 0.7, 0.3, 0],
            }}
            transition={{
              duration: 0.95,
              ease: [0.4, 0, 0.2, 1],
              delay: 0.1,
            }}
            className="absolute inset-y-0 w-1/3 pointer-events-none z-20"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.45) 50%, transparent 100%)',
              transform: 'skewX(-20deg)',
            }}
          />
        )}
      </div>

      {/* ─── Solidified Pixelated Wordmark Overlay (Appears once formed) ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isFormed ? 1 : 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mt-3 flex items-center gap-2"
      >
        <span
          className="font-pixel font-bold text-xs sm:text-sm tracking-[0.25em] text-[var(--accent-secondary)] uppercase drop-shadow-sm"
        >
          AUTHENTIC STREAMING RETRO-CINEMA
        </span>
      </motion.div>
    </div>
  )
}
