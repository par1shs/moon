import React, { useState, Suspense, lazy } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { BarChart3 } from 'lucide-react'
import type { Profile, AvatarConfig } from '../../profiles/types'
import type { ContentMetadata } from '../../../types'
import { TopNavigation, type NavigationPage } from './TopNavigation'
import { MobileBottomNav } from './MobileBottomNav'
import { HomePage } from '../pages/HomePage'
import { SoundControl } from '../../audio/SoundControl'
import { AmbientAtmosphere } from '../../cinematic/components/AmbientAtmosphere'
import { useReducedMotionPreference } from '../../../hooks/useReducedMotionPreference'

import { EditProfileModal } from '../../profiles/components/ManageProfiles'

// Code-split non-initial routes & heavy modals for rapid initial startup & low memory footprint
const SeriesPage = lazy(() => import('../pages/SeriesPage').then((m) => ({ default: m.SeriesPage })))
const MoviesPage = lazy(() => import('../pages/MoviesPage').then((m) => ({ default: m.MoviesPage })))
const DiscoverPage = lazy(() => import('../pages/DiscoverPage').then((m) => ({ default: m.DiscoverPage })))
const LiveTVPage = lazy(() => import('../pages/LiveTVPage').then((m) => ({ default: m.LiveTVPage })))
const MyListPage = lazy(() => import('../pages/MyListPage').then((m) => ({ default: m.MyListPage })))
const SearchPage = lazy(() => import('../pages/SearchPage').then((m) => ({ default: m.SearchPage })))
const MembershipPage = lazy(() => import('../../subscription/pages/MembershipPage').then((m) => ({ default: m.MembershipPage })))
const AdInsightsPage = lazy(() => import('../../advertising/pages/AdInsightsPage').then((m) => ({ default: m.AdInsightsPage })))
const DeviceExperiencePage = lazy(() => import('../../devices/pages/DeviceExperiencePage').then((m) => ({ default: m.DeviceExperiencePage })))
const ContentDetailsModal = lazy(() => import('../../details/ContentDetailsModal').then((m) => ({ default: m.ContentDetailsModal })))

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
      case 'devices':
        return (
          <DeviceExperiencePage
            profile={profile}
            onNavigateToMembership={() => handleNavigate('membership')}
            onSelectContent={(c) => setSelectedDetailContent(c)}
            onPlayContent={(c) => setSelectedDetailContent(c)}
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
      {/* ─── Intelligent Page-Aware Ambient Atmosphere ─── */}
      <AmbientAtmosphere
        activePage={activePage}
        selectedDetailContent={selectedDetailContent}
      />

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
            <Suspense
              fallback={
                <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] animate-spin" />
                  <span className="font-mono text-xs uppercase tracking-widest text-[var(--text-muted)]">
                    Loading Section...
                  </span>
                </div>
              }
            >
              {renderCurrentPage()}
            </Suspense>
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

          <div className="flex items-center gap-4 flex-wrap justify-center">
            <button
              type="button"
              data-testid="footer-ad-insights-btn"
              onClick={() => handleNavigate('ad-insights')}
              className="hover:text-[var(--text-primary)] hover:underline flex items-center gap-1.5 cursor-pointer transition-colors text-amber-300 hover:text-amber-200"
              title="Open Advertising &amp; Sponsorship Insights"
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Ad Insights</span>
            </button>
            <span>•</span>
            <span>
              Profile: <strong className="text-[var(--text-primary)]">{profile.name}</strong>
            </span>
            <SoundControl variant="inline" />
          </div>
        </div>
      </footer>

      {/* ─── Dedicated Content Details Experience ─── */}
      {selectedDetailContent && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}

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
