import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { Profile, AvatarConfig } from '../../profiles/types'
import type { ContentMetadata } from '../../../types'
import { TopNavigation, type NavigationPage } from './TopNavigation'
import { MobileBottomNav } from './MobileBottomNav'
import { EditProfileModal } from '../../profiles/components/ManageProfiles'
import { ContentDetailsModal } from '../../details/ContentDetailsModal'
import { HomePage } from '../pages/HomePage'
import { SeriesPage } from '../pages/SeriesPage'
import { MoviesPage } from '../pages/MoviesPage'
import { DiscoverPage } from '../pages/DiscoverPage'
import { LiveTVPage } from '../pages/LiveTVPage'
import { MyListPage } from '../pages/MyListPage'
import { SearchPage } from '../pages/SearchPage'
import { MembershipPage } from '../../subscription/pages/MembershipPage'
import { AdInsightsPage } from '../../advertising/pages/AdInsightsPage'
import { SoundControl } from '../../audio/SoundControl'
import { useReducedMotionPreference } from '../../../hooks/useReducedMotionPreference'

export interface MainLayoutProps {
  profile: Profile
  profiles: Profile[]
  onSwitchProfile: () => void
  onUpdateProfile: (id: string, updates: Partial<Pick<Profile, 'name' | 'isKidsProfile'>>) => void
  onUpdateAvatar: (id: string, avatarConfig: AvatarConfig) => void
  onDeleteProfile?: (id: string) => boolean
  onReplayIntro?: () => void
  onOpenDevShell?: () => void
  initialPage?: NavigationPage
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  profile,
  profiles,
  onSwitchProfile,
  onUpdateProfile,
  onUpdateAvatar,
  onDeleteProfile,
  onReplayIntro,
  onOpenDevShell,
  initialPage = 'home',
}) => {
  const [activePage, setActivePage] = useState<NavigationPage>(initialPage)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedDetailContent, setSelectedDetailContent] = useState<ContentMetadata | null>(null)
  const [liveTunedChannelId, setLiveTunedChannelId] = useState<string | undefined>(undefined)
  const reducedMotion = useReducedMotionPreference()

  const handleNavigate = (page: NavigationPage) => {
    setActivePage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Active page renderer
  const renderCurrentPage = () => {
    switch (activePage) {
      case 'home':
        return (
          <HomePage
            profile={profile}
            onExploreSeries={() => handleNavigate('series')}
            onExploreMovies={() => handleNavigate('movies')}
            onSelectContent={(c) => setSelectedDetailContent(c)}
            onNavigateToMembership={() => handleNavigate('membership')}
          />
        )
      case 'series':
        return (
          <SeriesPage
            profile={profile}
            onSelectContent={(c) => setSelectedDetailContent(c)}
            onExploreDiscover={() => handleNavigate('discover')}
          />
        )
      case 'movies':
        return (
          <MoviesPage
            profile={profile}
            onSelectContent={(c) => setSelectedDetailContent(c)}
            onExploreDiscover={() => handleNavigate('discover')}
          />
        )
      case 'discover':
        return (
          <DiscoverPage
            profile={profile}
            onSelectContent={(c) => setSelectedDetailContent(c)}
          />
        )
      case 'livetv':
        return (
          <LiveTVPage
            profile={profile}
            initialChannelId={liveTunedChannelId}
            onSelectContent={(c) => setSelectedDetailContent(c)}
            onNavigateToMembership={() => handleNavigate('membership')}
          />
        )
      case 'mylist':
        return (
          <MyListPage
            profile={profile}
            onExploreHome={() => handleNavigate('home')}
            onExploreDiscover={() => handleNavigate('discover')}
            onSelectContent={(c) => setSelectedDetailContent(c)}
          />
        )
      case 'search':
        return (
          <SearchPage
            profile={profile}
            onSelectContent={(c) => setSelectedDetailContent(c)}
          />
        )
      case 'membership':
        return (
          <MembershipPage
            profile={profile}
            onNavigateHome={() => handleNavigate('home')}
          />
        )
      case 'ad-insights':
        return (
          <AdInsightsPage
            profile={profile}
            onNavigateHome={() => handleNavigate('home')}
          />
        )
      default:
        return (
          <HomePage
            profile={profile}
            onExploreSeries={() => handleNavigate('series')}
            onExploreMovies={() => handleNavigate('movies')}
            onSelectContent={(c) => setSelectedDetailContent(c)}
          />
        )
    }
  }

  return (
    <div className="relative min-h-screen w-full bg-transparent text-[var(--text-primary)] flex flex-col justify-between antialiased selection:bg-[var(--accent-primary)] selection:text-[var(--accent-contrast)]">
      {/* ─── Persistent Cinematic Atmospheric Brand Gradient Background ─── */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden="true">
        {/* Top Header & Hero Aura (adapts to light/dark via CSS token) */}
        <div
          className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[140vw] max-w-[1600px] h-[650px] rounded-[100%] blur-[120px] opacity-80 transition-all duration-500"
          style={{
            background: 'var(--gradient-brand-aura-top)',
          }}
        />

        {/* Dynamic Profile Accent Subtle Secondary Glow Aura */}
        <div
          className="absolute top-[80px] -right-[150px] w-[600px] h-[600px] rounded-full blur-[160px] opacity-25"
          style={{
            background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
          }}
        />

        {/* Mid-Page Atmospheric Pockets (adapts to light/dark via CSS token) */}
        <div
          className="absolute top-[650px] -left-[200px] w-[700px] h-[700px] rounded-full blur-[170px] opacity-40 transition-all duration-500"
          style={{
            background: 'var(--gradient-brand-aura-mid)',
          }}
        />
      </div>

      {/* ─── Persistent Top Navigation ─── */}
      <TopNavigation
        activePage={activePage}
        onNavigate={handleNavigate}
        profile={profile}
        onSwitchProfile={onSwitchProfile}
        onManageProfile={() => setIsEditModalOpen(true)}
        onReplayIntro={onReplayIntro}
        onOpenDevShell={onOpenDevShell}
      />

      {/* ─── Main Content Container with Transitions ─── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:pb-12 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reducedMotion ? 0 : -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {renderCurrentPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ─── Mobile Bottom Navigation (Visible on md:hidden) ─── */}
      <MobileBottomNav activePage={activePage} onNavigate={handleNavigate} />

      {/* ─── Global Streaming Footer ─── */}
      <footer className="w-full border-t border-[var(--border-subtle)] bg-[var(--bg-nav)] backdrop-blur-md py-6 pb-24 md:pb-6" data-testid="global-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[var(--text-muted)]">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <span className="font-pixel font-bold text-[var(--text-primary)] text-sm tracking-wider flex items-center">
              PIXEL<span className="text-[var(--accent-primary)]">+</span>
            </span>
            <span>•</span>
            <span className="text-[var(--accent-secondary)]">ONE STORY. EVERY SCREEN.</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Linear &amp; On-Demand Streaming</span>
          </div>

          <div className="flex items-center gap-4">
            <span>
              Profile: <strong className="text-[var(--text-primary)]">{profile.name}</strong>
            </span>
            <SoundControl variant="inline" />
          </div>
        </div>
      </footer>

      {/* ─── Dedicated Content Details Experience ─── */}
      <ContentDetailsModal
        isOpen={Boolean(selectedDetailContent)}
        content={selectedDetailContent}
        onClose={() => setSelectedDetailContent(null)}
        profile={profile}
        onSelectRelated={(c) => setSelectedDetailContent(c)}
        onWatchLive={(channelId) => {
          setSelectedDetailContent(null)
          setLiveTunedChannelId(channelId)
          handleNavigate('livetv')
        }}
        onWatchCatchUp={(_programId, channelId) => {
          setSelectedDetailContent(null)
          setLiveTunedChannelId(channelId)
          handleNavigate('livetv')
        }}
        onNavigateToMembership={() => {
          setSelectedDetailContent(null)
          handleNavigate('membership')
        }}
      />

      {/* ─── Edit Active Profile Modal ─── */}
      <EditProfileModal
        profile={profile}
        isOpen={isEditModalOpen}
        canDelete={profiles.length > 1}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={onUpdateProfile}
        onUpdateAvatar={onUpdateAvatar}
        onDelete={(id) => {
          if (onDeleteProfile) {
            const ok = onDeleteProfile(id)
            if (ok) {
              setIsEditModalOpen(false)
              onSwitchProfile()
            }
          }
        }}
      />
    </div>
  )
}
