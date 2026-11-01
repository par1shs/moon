import React from 'react'
import { BrandLogo } from '../common/BrandLogo'

/**
 * Navigation placeholder for Phase 1.
 * Full streaming navigation bar with profile switcher and categories
 * will be implemented in subsequent phases.
 */
export const NavbarPlaceholder: React.FC = () => {
  return (
    <nav className="w-full h-16 px-6 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-main)]/80 backdrop-blur-md">
      <BrandLogo size="sm" />
      <span className="text-xs font-mono text-[var(--text-muted)]">
        NAVIGATION FOUNDATION
      </span>
    </nav>
  )
}
