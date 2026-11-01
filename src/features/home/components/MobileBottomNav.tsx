import React from 'react'
import { motion } from 'motion/react'
import { Home, Compass, Tv, Radio, Bookmark } from 'lucide-react'
import type { NavigationPage } from './TopNavigation'

export interface MobileBottomNavProps {
  activePage: NavigationPage
  onNavigate: (page: NavigationPage) => void
}

interface MobileNavItem {
  id: NavigationPage
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const MOBILE_ITEMS: MobileNavItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'discover', label: 'Discover', icon: Compass },
  { id: 'series', label: 'Series', icon: Tv },
  { id: 'livetv', label: 'Live TV', icon: Radio },
  { id: 'mylist', label: 'My List', icon: Bookmark },
]

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activePage,
  onNavigate,
}) => {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-nav)] backdrop-blur-xl border-t border-[var(--border-subtle)] pb-safe shadow-[0_-8px_24px_rgba(0,0,0,0.6)]"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around px-2 py-1.5 h-16">
        {MOBILE_ITEMS.map((item) => {
          const isActive = activePage === item.id
          const IconComponent = item.icon

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-primary)] ${
                isActive
                  ? 'text-[var(--accent-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className="relative">
                <IconComponent className="w-5 h-5 transition-transform duration-150" />
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-dot"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent-primary)] shadow-[0_0_6px_var(--accent-glow)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  />
                )}
              </div>
              <span className={`text-[10px] font-medium tracking-tight mt-1 ${isActive ? 'font-semibold text-[var(--text-primary)]' : ''}`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
