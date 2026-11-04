import React, { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Search, ChevronDown } from 'lucide-react'
import type { Profile } from '../../profiles/types'
import { BrandLogo } from '../../../components/common/BrandLogo'
import { ThemeToggle } from '../../../components/common/ThemeToggle'
import { AvatarRenderer } from '../../profiles/components/AvatarRenderer'
import { ProfileMenu } from './ProfileMenu'
import { useSubscriptionTier } from '../../../hooks/useSubscriptionTier'
import { ScrollProgressIndicator } from '../../cinematic/components/ScrollProgressIndicator'

export type NavigationPage =
  | 'home'
  | 'series'
  | 'movies'
  | 'discover'
  | 'livetv'
  | 'mylist'
  | 'search'
  | 'membership'
  | 'ad-insights'
  | 'devices'

export interface NavItem {
  id: NavigationPage
  label: string
}

const FULL_NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home' },
  { id: 'series', label: 'Series' },
  { id: 'movies', label: 'Movies' },
  { id: 'discover', label: 'Discover' },
  { id: 'livetv', label: 'Live TV' },
  { id: 'mylist', label: 'My List' },
  { id: 'devices', label: 'Devices' },
  { id: 'membership', label: 'Membership' },
]

import { scrollCoordinator } from '../../../utils/scrollCoordinator'

export interface TopNavigationProps {
  activePage: NavigationPage
  onNavigate: (page: NavigationPage) => void
  profile: Profile
  onSwitchProfile: () => void
  onManageProfile: () => void
  onReplayIntro?: () => void
  onOpenDevShell?: () => void
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  activePage,
  onNavigate,
  profile,
  onSwitchProfile,
  onManageProfile,
  onReplayIntro,
  onOpenDevShell,
}) => {
  const [isScrolled, setIsScrolled] = useState(() =>
    typeof window !== 'undefined' ? scrollCoordinator.getScrollY() > 20 : false
  )
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const { subscriptionTier } = useSubscriptionTier(profile.id)

  useEffect(() => {
    let wasScrolled = scrollCoordinator.getScrollY() > 20

    return scrollCoordinator.subscribe((scrollY) => {
      const scrolled = scrollY > 20
      if (scrolled !== wasScrolled) {
        wasScrolled = scrolled
        setIsScrolled(scrolled)
      }
    })
  }, [])

  return (
    <>
      {/* ─── Pinned Scroll Progress Indicator Bar (2px, z-50) ─── */}
      <ScrollProgressIndicator />

      {/* ─── In-Flow Layout Spacer (Prevents content jump below fixed header) ─── */}
      <div
        data-testid="top-navigation-spacer"
        className="h-16 sm:h-20 w-full shrink-0 pointer-events-none"
        aria-hidden="true"
      />

      {/* ─── Persistent Viewport-Fixed Top Navigation (Smooth fading atmospheric nav bar) ─── */}
      <header
        data-testid="top-navigation"
        data-scrolled={isScrolled ? 'true' : 'false'}
        className="fixed top-0 left-0 right-0 z-40 w-full pointer-events-none"
      >
        {/* Seamless Fading Atmospheric Backdrop — smooth vertical gradient & mask so there is no discernable ending edge */}
        <div
          data-testid="nav-fading-backdrop"
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-28 sm:h-36 pointer-events-none transition-all duration-300 ease-out"
          style={{
            background: isScrolled
              ? 'linear-gradient(180deg, var(--bg-nav) 0%, color-mix(in srgb, var(--bg-nav) 90%, transparent) 40%, color-mix(in srgb, var(--bg-nav) 50%, transparent) 70%, color-mix(in srgb, var(--bg-nav) 15%, transparent) 88%, transparent 100%)'
              : 'linear-gradient(180deg, color-mix(in srgb, var(--bg-nav) 92%, transparent) 0%, color-mix(in srgb, var(--bg-nav) 70%, transparent) 35%, color-mix(in srgb, var(--bg-nav) 30%, transparent) 70%, transparent 100%)',
            backdropFilter: isScrolled ? 'blur(16px)' : 'blur(8px)',
            WebkitBackdropFilter: isScrolled ? 'blur(16px)' : 'blur(8px)',
            maskImage:
              'linear-gradient(to bottom, black 0%, black 40%, rgba(0, 0, 0, 0.7) 65%, rgba(0, 0, 0, 0.25) 85%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, black 0%, black 40%, rgba(0, 0, 0, 0.7) 65%, rgba(0, 0, 0, 0.25) 85%, transparent 100%)',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between pointer-events-auto">
          {/* Left Side: Brand Logo & Desktop Navigation Links */}
          <div className="flex items-center gap-6 lg:gap-10">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] rounded-lg"
              aria-label="PIXEL Home"
            >
              <BrandLogo size="md" />
            </button>

            {/* Desktop Navigation Links */}
            <nav
              className="hidden md:flex items-center gap-1 lg:gap-2"
              aria-label="Main Navigation"
              data-testid="full-nav-items"
            >
              {FULL_NAV_ITEMS.map((item) => {
                const isActive = activePage === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-testid={`nav-${item.id}`}
                    onClick={() => onNavigate(item.id)}
                    className={`relative px-3 py-1.5 rounded-lg text-sm transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
                      isActive
                        ? 'text-[var(--text-primary)] font-semibold'
                        : 'text-[var(--text-secondary)] font-normal hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)]'
                    }`}
                  >
                    {item.label}

                    {/* Active Indicator Underline */}
                    {isActive && (
                      <motion.div
                        layoutId="active-nav-indicator"
                        className="absolute -bottom-1.5 left-3 right-3 h-0.5 bg-[var(--accent-primary)] rounded-full shadow-[0_0_8px_var(--accent-glow)]"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Right Side: Search Icon, Theme Toggle & Profile Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Search Action Button */}
            <button
              type="button"
              data-testid="search-action-btn"
              onClick={() => onNavigate('search')}
              aria-label="Search series, movies, and channels"
              aria-pressed={activePage === 'search'}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
                activePage === 'search'
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] border border-transparent hover:border-[var(--border-subtle)]'
              }`}
            >
              <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>

            {/* Light / Dark Mode Toggle */}
            <ThemeToggle />

            {/* Profile Dropdown Container */}
            <div className="relative">
              <button
                type="button"
                data-testid="profile-menu-button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="menu"
                aria-label={`Profile menu for ${profile.name}`}
                className="group flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-[var(--bg-card)]/80 border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] transition-all cursor-pointer select-none"
              >
                <div className="shrink-0 p-0.5 rounded-full border border-[var(--accent-primary)]/40 bg-[var(--bg-main)]">
                  <AvatarRenderer
                    config={profile.avatarConfig}
                    size="sm"
                    isKids={profile.isKidsProfile}
                  />
                </div>

                <span className="hidden lg:inline text-xs font-medium text-[var(--text-primary)] max-w-[100px] truncate">
                  {profile.name}
                </span>

                <span
                  data-testid="nav-subscription-badge"
                  onClick={(e) => {
                    e.stopPropagation()
                    onNavigate('membership')
                  }}
                  title="View Membership Plans"
                  className={`hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                    subscriptionTier === 'free'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                      : subscriptionTier === 'standard'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                  }`}
                >
                  {subscriptionTier.toUpperCase()}
                </span>

                <ChevronDown
                  className={`w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-transform duration-200 ${
                    isProfileMenuOpen ? 'rotate-180 text-[var(--accent-primary)]' : ''
                  }`}
                />
              </button>

              {/* Profile Dropdown Menu */}
              <ProfileMenu
                isOpen={isProfileMenuOpen}
                onClose={() => setIsProfileMenuOpen(false)}
                profile={profile}
                onSwitchProfile={onSwitchProfile}
                onManageProfile={onManageProfile}
                onNavigateToMembership={() => onNavigate('membership')}
                onNavigateToAdInsights={() => onNavigate('ad-insights')}
                onNavigateToDevices={() => onNavigate('devices')}
                onReplayIntro={onReplayIntro}
                onOpenDevShell={onOpenDevShell}
              />
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
