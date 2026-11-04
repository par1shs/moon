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
  const [isScrolled, setIsScrolled] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const { subscriptionTier } = useSubscriptionTier(profile.id)

  // Listen for scroll to dynamically animate navbar between initial and transformed state
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 24
      setIsScrolled(scrolled)
      if (scrolled) {
        setIsProfileMenuOpen(false)
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
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

      {/* ─── Viewport-Fixed Top Navigation (Constant size, animated centering & white translucent glow) ─── */}
      <header
        data-testid="top-navigation"
        data-scrolled={isScrolled ? 'true' : 'false'}
        className={`fixed top-0 left-0 right-0 z-40 w-full transition-all duration-500 ease-out ${
          isScrolled
            ? 'nav-scrolled-atmospheric border-none border-b-0 shadow-none'
            : 'bg-gradient-to-b from-[var(--bg-nav)] via-[var(--brand-midnight)]/80 to-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between relative transition-all duration-500 ease-out">
          {/* Left Side: Brand Logo (smoothly scales & fades out when scrolled) */}
          <div
            className={`flex items-center shrink-0 transition-all duration-500 ease-out ${
              isScrolled
                ? 'opacity-0 -translate-x-6 pointer-events-none w-0 overflow-hidden hidden'
                : 'opacity-100 translate-x-0 w-auto'
            }`}
          >
            {!isScrolled && (
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] rounded-lg"
                aria-label="PIXEL Home"
              >
                <BrandLogo size="md" />
              </button>
            )}
          </div>

          {/* Center Navigation Links: Smoothly shifts to exact center and draws closer together */}
          <nav
            aria-label="Main Navigation"
            data-testid={isScrolled ? 'compact-nav-items' : 'full-nav-items'}
            className={`flex items-center justify-center transition-all duration-500 ease-out overflow-x-auto no-scrollbar py-1 ${
              isScrolled
                ? 'mx-auto gap-1 sm:gap-1.5'
                : 'gap-1 lg:gap-2 ml-4 md:ml-8'
            }`}
          >
            {FULL_NAV_ITEMS.map((item) => {
              const isActive = activePage === item.id
              const isExtraItem = item.id === 'devices' || item.id === 'membership'

              // Smoothly collapse Devices and Membership when scrolled
              if (isScrolled && isExtraItem) {
                return null
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`nav-${item.id}`}
                  onClick={() => onNavigate(item.id)}
                  className={`relative shrink-0 whitespace-nowrap rounded-lg transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
                    isScrolled
                      ? 'px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm'
                      : 'px-3 py-1.5 text-sm'
                  } ${
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
                      className="absolute -bottom-1 sm:-bottom-1.5 left-2.5 right-2.5 h-0.5 bg-[var(--accent-primary)] rounded-full shadow-[0_0_8px_var(--accent-glow)]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              )
            })}
          </nav>

          {/* Right Side: Theme Toggle, Search & Profile Menu */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Light / Dark Mode Toggle (Control 7) */}
            <ThemeToggle />

            {/* Search Action Button (Control 8) */}
            <button
              type="button"
              data-testid="search-action-btn"
              onClick={() => onNavigate('search')}
              aria-label="Search series, movies, and channels"
              aria-pressed={activePage === 'search'}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
                activePage === 'search'
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] border border-transparent hover:border-[var(--border-subtle)]'
              }`}
            >
              <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>

            {/* Profile Dropdown Container (Smoothly collapses when scrolled) */}
            <div
              className={`relative transition-all duration-500 ease-out ${
                isScrolled
                  ? 'opacity-0 translate-x-6 pointer-events-none w-0 overflow-hidden hidden'
                  : 'opacity-100 translate-x-0 w-auto'
              }`}
            >
              {!isScrolled && (
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
              )}

              {/* Profile Dropdown Menu */}
              {!isScrolled && (
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
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
