import type { EPGChannel, EPGProgram, CatchUpStatus } from '../types/epg'
import { SAMPLE_LIVE_CHANNELS } from './sampleContent'

export const EPG_CHANNELS: EPGChannel[] = SAMPLE_LIVE_CHANNELS.map((ch) => ({
  id: ch.id,
  channelNumber: ch.channelNumber,
  title: ch.title,
  subtitle: ch.subtitle || '',
  category: ch.category,
  quality: (ch.quality as '4K HDR' | 'HD' | 'Dolby Atmos') || 'HD',
  backdropUrl: ch.backdropUrl || '',
  logoText: ch.title.split(' ')[0],
  contentRef: ch,
}))

export interface ProgramTemplate {
  slotId: string
  title: string
  description: string
  startMinutes: number // minutes from 00:00
  durationMinutes: number
  genre: string
  rating: string
  artworkUrl: string
  linkedContentId?: string
  badge?: string
  isCatchUpEligible?: boolean
  catchUpDays?: number // default 7, premium 14
}

export const EPG_SCHEDULE_TEMPLATES: Record<string, ProgramTemplate[]> = {
  'ch-101': [
    {
      slotId: '101-01',
      title: 'Overnight Global Wire',
      description: 'Live continuous dispatches from international newsdesks in Tokyo, London, Singapore, and Frankfurt as Asian markets begin trading.',
      startMinutes: 0,
      durationMinutes: 120,
      genre: 'News & Analysis',
      rating: 'PG',
      artworkUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800&auto=format&fit=crop',
      badge: 'LIVE WIRE',
      isCatchUpEligible: false,
    },
    {
      slotId: '101-02',
      title: 'World Financial Markets Replay',
      description: 'Comprehensive late-night breakdown of global indices, currency shifts, commodities, and macroeconomic indicators.',
      startMinutes: 120,
      durationMinutes: 180,
      genre: 'Finance',
      rating: 'PG',
      artworkUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 7,
    },
    {
      slotId: '101-03',
      title: 'First Light Business Dispatch',
      description: 'Early morning corporate executive briefings, pre-market futures, and opening bell anticipation from European financial capitals.',
      startMinutes: 300,
      durationMinutes: 120,
      genre: 'Business',
      rating: 'PG',
      artworkUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 7,
    },
    {
      slotId: '101-04',
      title: 'Junction Morning Live',
      description: 'Flagship morning television broadcast with breaking international news, climate updates, culture reports, and live interviews.',
      startMinutes: 420,
      durationMinutes: 150,
      genre: 'Morning News',
      rating: 'PG',
      artworkUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=800&auto=format&fit=crop',
      badge: 'FLAGSHIP',
      isCatchUpEligible: true,
      catchUpDays: 7,
    },
    {
      slotId: '101-05',
      title: 'Global Headlines & In-Depth Analysis',
      description: 'Anchored field reporting, geopolitical risk assessments, and investigative segments examining diplomatic summits.',
      startMinutes: 570,
      durationMinutes: 120,
      genre: 'World News',
      rating: 'PG',
      artworkUrl: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 7,
    },
    {
      slotId: '101-06',
      title: 'The Midday Forex & Energy Briefing',
      description: 'Real-time analysis of renewable energy transitions, crude benchmarks, and monetary policy decisions worldwide.',
      startMinutes: 690,
      durationMinutes: 90,
      genre: 'Markets',
      rating: 'PG',
      artworkUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 7,
    },
    {
      slotId: '101-07',
      title: 'Frontline Geopolitics Live',
      description: 'Live field correspondence from frontline diplomatic envoys, defense analysts, and international correspondents.',
      startMinutes: 780,
      durationMinutes: 120,
      genre: 'International',
      rating: '13+',
      artworkUrl: 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?q=80&w=800&auto=format&fit=crop',
      badge: 'SPECIAL',
      isCatchUpEligible: true,
      catchUpDays: 7,
    },
    {
      slotId: '101-08',
      title: 'Tech & AI Frontier Round',
      description: 'Examining breakthroughs in machine intelligence, quantum computing systems, biotechnology, and silicon supply chains.',
      startMinutes: 900,
      durationMinutes: 120,
      genre: 'Technology',
      rating: 'PG',
      artworkUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 7,
    },
    {
      slotId: '101-09',
      title: 'The Evening World Hour',
      description: 'The defining newscast of the day with anchor Maya Thorne, delivering definitive coverage of the most vital global stories.',
      startMinutes: 1020,
      durationMinutes: 120,
      genre: 'Flagship News',
      rating: 'PG',
      artworkUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=800&auto=format&fit=crop',
      badge: 'FLAGSHIP',
      isCatchUpEligible: true,
      catchUpDays: 7,
    },
    {
      slotId: '101-10',
      title: 'Prime Debate: Global Economy',
      description: 'Heated panel debate featuring central bankers, leading economists, and technological futurists on inflation, labor, and innovation.',
      startMinutes: 1140,
      durationMinutes: 120,
      genre: 'Debate',
      rating: '13+',
      artworkUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 14,
    },
    {
      slotId: '101-11',
      title: 'The Nightly Investigation',
      description: 'Award-winning investigative reporting exploring cyber warfare operations and undercover corporate probes.',
      startMinutes: 1260,
      durationMinutes: 90,
      genre: 'Investigative',
      rating: '16+',
      artworkUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 14,
    },
    {
      slotId: '101-12',
      title: 'Late Edition Wrap & Editorial',
      description: 'Closing summary of the international news cycle, tomorrow morning preview, and editorial column commentary.',
      startMinutes: 1350,
      durationMinutes: 90,
      genre: 'Nightly News',
      rating: 'PG',
      artworkUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: false,
    },
  ],
  'ch-102': [
    {
      slotId: '102-01',
      title: 'Night Rally: Trans-Alpine Highlights',
      description: 'Thrilling night stages through ice-covered mountain passes with onboard telemetry and helicopter thermal cameras.',
      startMinutes: 0,
      durationMinutes: 180,
      genre: 'Motorsport',
      rating: 'G',
      artworkUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 7,
    },
    {
      slotId: '102-02',
      title: 'World Endurance Championship Replay',
      description: 'Full replay of the 6 Hours of Spa-Francorchamps with multi-class battles, pit stop masterclasses, and aero telemetry.',
      startMinutes: 180,
      durationMinutes: 180,
      genre: 'Racing',
      rating: 'G',
      artworkUrl: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 7,
    },
    {
      slotId: '102-03',
      title: 'Pitlane Morning Warmup & Telemetry',
      description: 'Engineers tune aerodynamic downforce, suspension stiffness, and tyre degradation telemetry prior to qualifying.',
      startMinutes: 360,
      durationMinutes: 150,
      genre: 'Analysis',
      rating: 'G',
      artworkUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: false,
    },
    {
      slotId: '102-04',
      title: 'Apex Velocity Cup: Practice Sessions',
      description: 'Live broadcast of high-speed GT3 testing sessions featuring apex corner speeds and brake bias diagnostics.',
      startMinutes: 510,
      durationMinutes: 150,
      genre: 'Live Racing',
      rating: 'G',
      artworkUrl: 'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?q=80&w=800&auto=format&fit=crop',
      badge: 'PRACTICE',
      isCatchUpEligible: false,
    },
    {
      slotId: '102-05',
      title: 'Grand Prix Qualifying Round 1',
      description: 'Knockout qualifying shootout as twenty drivers push prototype machines to the physical limit for pole position.',
      startMinutes: 660,
      durationMinutes: 150,
      genre: 'Live Sports',
      rating: 'G',
      artworkUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=800&auto=format&fit=crop',
      badge: 'QUALIFYING',
      isCatchUpEligible: true,
      catchUpDays: 7,
    },
    {
      slotId: '102-06',
      title: 'Formula Kinetic: Grid Walk & Driver Debrief',
      description: 'Celebrity pitlane walk with team bosses, race strategists, and aerodynamics directors.',
      startMinutes: 810,
      durationMinutes: 150,
      genre: 'Interviews',
      rating: 'G',
      artworkUrl: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 7,
    },
    {
      slotId: '102-07',
      title: 'Championship Feature Race: Monaco Circuit',
      description: 'The pinnacle event: 78 laps through the streets of Monte Carlo in full native 4K HDR with dynamic spatial sound.',
      startMinutes: 960,
      durationMinutes: 180,
      genre: 'Live Motorsport',
      rating: 'G',
      artworkUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=800&auto=format&fit=crop',
      badge: 'MAIN EVENT',
      isCatchUpEligible: true,
      catchUpDays: 14,
    },
    {
      slotId: '102-08',
      title: 'Post-Race Podium & Technical Review',
      description: 'Champagne celebrations, FIA telemetry analysis, steward inquiries, and driver post-race press conferences.',
      startMinutes: 1140,
      durationMinutes: 90,
      genre: 'Sports Talk',
      rating: 'G',
      artworkUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 7,
    },
    {
      slotId: '102-09',
      title: 'Superbike World Tour: Sprint Shootout',
      description: 'High-octane motorcycle racing reaching 340 km/h with lean-angle camera sensors and rider heart rate monitors.',
      startMinutes: 1230,
      durationMinutes: 120,
      genre: 'Superbikes',
      rating: 'G',
      artworkUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 7,
    },
    {
      slotId: '102-10',
      title: "Speed & Friction: The Driver's Diary",
      description: 'Intimate fly-on-the-wall docuseries exploring the psychological preparation, injury recovery, and rivalries of elite racers.',
      startMinutes: 1350,
      durationMinutes: 90,
      genre: 'Documentary',
      rating: 'G',
      artworkUrl: 'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 14,
    },
  ],
  'ch-103': [
    {
      slotId: '103-01',
      title: 'Shadows of Chinatown (1948 Noir)',
      description: 'A rain-slicked private investigator gets entangled in an art forgery conspiracy across wartime San Francisco.',
      startMinutes: 0,
      durationMinutes: 150,
      genre: 'Film Noir',
      rating: '13+',
      artworkUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop',
      linkedContentId: 'mov-8',
      badge: '4K RESTORATION',
      isCatchUpEligible: true,
      catchUpDays: 14,
    },
    {
      slotId: '103-02',
      title: 'The Midnight Express (1955)',
      description: 'High-suspense train journey through the Alps carrying five strangers who each possess a key to a missing diplomatic pouch.',
      startMinutes: 150,
      durationMinutes: 135,
      genre: 'Mystery / Thriller',
      rating: '16+',
      artworkUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=800&auto=format&fit=crop',
      linkedContentId: 'mov-1',
      isCatchUpEligible: true,
      catchUpDays: 14,
    },
    {
      slotId: '103-03',
      title: 'Silent Era Pioneers: Metropolis Restored',
      description: 'Fritz Lang visionary sci-fi masterpiece presented with the reconstructed score played by the Berlin Radio Symphony.',
      startMinutes: 285,
      durationMinutes: 120,
      genre: 'Silent Masterpiece',
      rating: 'G',
      artworkUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 14,
    },
    {
      slotId: '103-04',
      title: 'Morning Matinee: The Lavender Hill Heist',
      description: 'Classic British Ealing comedy featuring an unassuming bank clerk who concocts an eccentric scheme to smuggle bullion.',
      startMinutes: 405,
      durationMinutes: 135,
      genre: 'Classic Comedy',
      rating: 'PG',
      artworkUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 14,
    },
    {
      slotId: '103-05',
      title: "Golden Age Epics: Cleopatra's Gate",
      description: 'Lavish technicolor epic photographed in 70mm with staggering practical sets, thousand-person crowd sequences, and timeless drama.',
      startMinutes: 540,
      durationMinutes: 150,
      genre: 'Historical Epic',
      rating: 'PG',
      artworkUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 14,
    },
    {
      slotId: '103-06',
      title: 'High Noon on Sunset Boulevard',
      description: 'Billy Wilder-inspired psychological masterclass on fading fame, Hollywood ghosts, and tragic obsessions.',
      startMinutes: 690,
      durationMinutes: 150,
      genre: 'Classic Drama',
      rating: '13+',
      artworkUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 14,
    },
    {
      slotId: '103-07',
      title: 'Masterpiece Showcase: The Third Secret',
      description: 'Psychiatrist attempts to decode the mysterious demise of his mentor, unearthing five patients with dangerous secrets.',
      startMinutes: 840,
      durationMinutes: 150,
      genre: 'Psychological Noir',
      rating: '13+',
      artworkUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop',
      linkedContentId: 'mov-5',
      badge: 'VAULT SELECTION',
      isCatchUpEligible: true,
      catchUpDays: 14,
    },
    {
      slotId: '103-08',
      title: 'Cinematheque Restorations: Roman Holiday 4K',
      description: 'Audrey Hepburn and Gregory Peck dazzle in a sparkling, newly rescanned monochrome print of romance in the Eternal City.',
      startMinutes: 990,
      durationMinutes: 150,
      genre: 'Romance',
      rating: 'PG',
      artworkUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 14,
    },
    {
      slotId: '103-09',
      title: 'Vault Feature: The Long Goodbye Remastered',
      description: 'Robert Altman subversive 1973 neo-noir adapting Raymond Chandler with loose jazz aesthetics and dry cynicism.',
      startMinutes: 1140,
      durationMinutes: 150,
      genre: 'Neo-Noir',
      rating: '16+',
      artworkUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 14,
    },
    {
      slotId: '103-10',
      title: 'Midnight Cinema Club: Night of the Hunter',
      description: 'Charles Laughton haunting fairy-tale noir masterpiece with Robert Mitchum as the sinister preacher pursuing children down a moonlit river.',
      startMinutes: 1290,
      durationMinutes: 150,
      genre: 'Gothic Thriller',
      rating: '16+',
      artworkUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 14,
    },
  ],
  'ch-104': [
    {
      slotId: '104-01',
      title: 'Deep Space Pulsar Array & Drone Ambiance',
      description: 'Radio astronomy telemetry transposed into gentle low-frequency acoustic drone compositions accompanied by deep cosmos photography.',
      startMinutes: 0,
      durationMinutes: 180,
      genre: 'Cosmic Ambient',
      rating: 'All',
      artworkUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop',
      linkedContentId: 'feat-2',
      badge: 'SPATIAL AUDIO',
      isCatchUpEligible: true,
      catchUpDays: 14,
    },
    {
      slotId: '104-02',
      title: 'Orbital Sunrise: ISS Live Feeds & Synthesizers',
      description: 'Continuous orbital views of Earth transitioning from night to day over the Pacific Ocean paired with ambient synthesizer textures.',
      startMinutes: 180,
      durationMinutes: 180,
      genre: 'Earth & Space',
      rating: 'All',
      artworkUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 14,
    },
    {
      slotId: '104-03',
      title: 'Dawn Over the Patagonian Fjords',
      description: 'Glacial waterfalls, pristine southern beech forests, and Andean peaks bathed in pink morning alpine light in 4K HDR.',
      startMinutes: 360,
      durationMinutes: 150,
      genre: 'Nature',
      rating: 'All',
      artworkUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 14,
    },
    {
      slotId: '104-04',
      title: 'Atmospheric Rivers: Cloud Formations in 4K',
      description: 'Macro time-lapse photography capturing cloud ocean physics, thunderhead formations, and jet stream velocity over mountain ranges.',
      startMinutes: 510,
      durationMinutes: 150,
      genre: 'Earth Science',
      rating: 'All',
      artworkUrl: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 7,
    },
    {
      slotId: '104-05',
      title: 'Coral Reef Twilight: Micronesian Atoll',
      description: 'Hydrophone recordings of nocturnal reef life, bioluminescent plankton blooms, and gentle tidal oscillations.',
      startMinutes: 660,
      durationMinutes: 150,
      genre: 'Marine Life',
      rating: 'All',
      artworkUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=800&auto=format&fit=crop',
      linkedContentId: 'ser-8',
      isCatchUpEligible: true,
      catchUpDays: 14,
    },
    {
      slotId: '104-06',
      title: 'Geothermal Rhythms of Iceland',
      description: 'Basalt lava flows, steaming fumaroles, sulfur pools, and midnight sun reflections across volcanic black sand shores.',
      startMinutes: 810,
      durationMinutes: 150,
      genre: 'Volcanology',
      rating: 'All',
      artworkUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 7,
    },
    {
      slotId: '104-07',
      title: 'Solar Flares & the Magnetic Veil',
      description: 'Extreme ultraviolet solar dynamics captured by solar orbiters, rendering coronal mass ejections with symphonic resonance.',
      startMinutes: 960,
      durationMinutes: 150,
      genre: 'Astrophysics',
      rating: 'All',
      artworkUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=800&auto=format&fit=crop',
      badge: 'ATMOS MASTER',
      isCatchUpEligible: true,
      catchUpDays: 14,
    },
    {
      slotId: '104-08',
      title: 'Aurora Borealis Symphony: Tromsø Skies',
      description: 'Green, violet, and crimson auroral curtains dancing over snowcapped Arctic fjords recorded in native low-light 4K.',
      startMinutes: 1110,
      durationMinutes: 150,
      genre: 'Natural Wonder',
      rating: 'All',
      artworkUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 14,
    },
    {
      slotId: '104-09',
      title: 'Deep Ocean Trench: Bioluminescent Abyss',
      description: 'Submersible lights illuminate siphonophores, comb jellies, and anglerfish in the Mariana Trench at 8,000 meters.',
      startMinutes: 1260,
      durationMinutes: 90,
      genre: 'Deep Sea',
      rating: 'All',
      artworkUrl: 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 7,
    },
    {
      slotId: '104-10',
      title: 'Meditation with Planetary Rings',
      description: 'Cassini data visualizations recreating orbits through Saturn rings paired with therapeutic 432Hz ambient sound waves.',
      startMinutes: 1350,
      durationMinutes: 90,
      genre: 'Cosmic Ambient',
      rating: 'All',
      artworkUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 14,
    },
  ],
  'ch-105': [
    {
      slotId: '105-01',
      title: 'Overnight Speedrun Marathon: Retro Classics',
      description: 'Frame-perfect glitch exhibitions, tool-assisted speedrun demonstrations, and world record attempts on 16-bit platformers.',
      startMinutes: 0,
      durationMinutes: 180,
      genre: 'Speedrunning',
      rating: 'PG',
      artworkUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 7,
    },
    {
      slotId: '105-02',
      title: 'Asia-Pacific Pro Scrims & Casts',
      description: 'Elite Seoul and Tokyo teams face off in high-level scrimmages with pro analyst coaching commentary and replay dissection.',
      startMinutes: 180,
      durationMinutes: 180,
      genre: 'Esports',
      rating: '13+',
      artworkUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: false,
    },
    {
      slotId: '105-03',
      title: 'The Morning Respawn: Patch Notes & Meta',
      description: 'Daily esports talk show reviewing competitive balances, weapon balance hotfixes, roster trades, and tournament seedings.',
      startMinutes: 360,
      durationMinutes: 150,
      genre: 'Gaming Talk',
      rating: 'PG',
      artworkUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 7,
    },
    {
      slotId: '105-04',
      title: 'Neon Arena Majors: Lower Bracket Quarterfinals',
      description: 'Live survival match: Best of 5 series between defending champions Team Zero and challenger squad CyberVortex.',
      startMinutes: 510,
      durationMinutes: 150,
      genre: 'Live Tournament',
      rating: '13+',
      artworkUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop',
      badge: 'LIVE ARENA',
      isCatchUpEligible: true,
      catchUpDays: 7,
    },
    {
      slotId: '105-05',
      title: 'Tactical Strike League: EMEA Showdown',
      description: 'Clutch defusals, economy round comebacks, and sniper duels across European championship servers.',
      startMinutes: 660,
      durationMinutes: 150,
      genre: 'Competitive FPS',
      rating: '16+',
      artworkUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 7,
    },
    {
      slotId: '105-06',
      title: 'Sim Racing Masters: Nürburgring 24h Challenge',
      description: 'Virtual endurance drivers battle weather dynamics, force feedback telemetry, and traffic management in identical GT3 rigs.',
      startMinutes: 810,
      durationMinutes: 150,
      genre: 'Sim Racing',
      rating: 'G',
      artworkUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 7,
    },
    {
      slotId: '105-07',
      title: 'Neon Arena Majors: Grand Finals Live',
      description: 'The championship showdown in a packed 20,000-seat stadium with stadium projection mapping, pyrotechnics, and a $2M prize pool.',
      startMinutes: 960,
      durationMinutes: 180,
      genre: 'Championship',
      rating: '13+',
      artworkUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop',
      badge: 'GRAND FINALS',
      isCatchUpEligible: true,
      catchUpDays: 14,
    },
    {
      slotId: '105-08',
      title: 'Pro League Post-Game Desk & MVP Analysis',
      description: 'Casters and pro coaches breakdown round heatmaps, economy turning points, and present the tournament MVP trophy.',
      startMinutes: 1140,
      durationMinutes: 120,
      genre: 'Esports Desk',
      rating: '13+',
      artworkUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 7,
    },
    {
      slotId: '105-09',
      title: 'Fighting Game Legends: EVO Throwback',
      description: 'Legendary moments in competitive fighting game history: parry comebacks, frame-trap reads, and iconic grand finals.',
      startMinutes: 1260,
      durationMinutes: 120,
      genre: 'FGC',
      rating: '13+',
      artworkUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 14,
    },
    {
      slotId: '105-10',
      title: 'Lofi Gamer Lounge: Late Night Chill Streams',
      description: 'Relaxing ambient puzzle playthroughs, isometric world exploration, and smooth chillhop beats to wind down the night.',
      startMinutes: 1380,
      durationMinutes: 60,
      genre: 'Casual Play',
      rating: 'PG',
      artworkUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: false,
    },
  ],
  'ch-106': [
    {
      slotId: '106-01',
      title: 'Secrets of the Deep Trenches',
      description: 'Exploring subterranean hydrothermal vents and chemosynthetic organisms flourishing without sunlight in crushing pressures.',
      startMinutes: 0,
      durationMinutes: 150,
      genre: 'Oceanography',
      rating: 'PG',
      artworkUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 7,
    },
    {
      slotId: '106-02',
      title: 'Ancient Megastructures of the Andes',
      description: 'LIDAR laser scanning reveals monumental stone networks, agricultural terraces, and lost citadel architectures.',
      startMinutes: 150,
      durationMinutes: 150,
      genre: 'Archaeology',
      rating: 'PG',
      artworkUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 14,
    },
    {
      slotId: '106-03',
      title: 'Dawn Patrol: Arctic Wolf Pack',
      description: 'Following a family of wolves navigating Ellesmere Island during the thaw, balancing hunting territories with pup rearing.',
      startMinutes: 300,
      durationMinutes: 150,
      genre: 'Wildlife',
      rating: 'PG',
      artworkUrl: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 7,
    },
    {
      slotId: '106-04',
      title: 'Serengeti Migration: The Great River Crossing',
      description: 'Millions of wildebeest and zebras brave crocodile-infested Mara River rapids in the annual cycle of renewal.',
      startMinutes: 450,
      durationMinutes: 150,
      genre: 'Nature',
      rating: 'PG',
      artworkUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=800&auto=format&fit=crop',
      linkedContentId: 'ser-8',
      badge: 'SPECIAL',
      isCatchUpEligible: true,
      catchUpDays: 14,
    },
    {
      slotId: '106-05',
      title: 'Lost Cities of Mesopotamia',
      description: 'Satellite archaeology uncovers ancient canal networks, cuneiform libraries, and the origins of human urban civilization.',
      startMinutes: 600,
      durationMinutes: 150,
      genre: 'History',
      rating: 'PG',
      artworkUrl: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 14,
    },
    {
      slotId: '106-06',
      title: 'Volcanic Island Ecosystems: Galápagos',
      description: 'How isolation, ocean currents, and volcanic plumes produced Darwin finches, marine iguanas, and giant tortoises.',
      startMinutes: 750,
      durationMinutes: 150,
      genre: 'Biodiversity',
      rating: 'PG',
      artworkUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 7,
    },
    {
      slotId: '106-07',
      title: 'Himalayan High Altitude Explorers',
      description: 'Sherpa guides, glaciologists, and high-altitude climbers monitor retreating ice shelves and collect core samples on K2.',
      startMinutes: 900,
      durationMinutes: 150,
      genre: 'Adventure',
      rating: '13+',
      artworkUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop',
      badge: 'EXPLORATION',
      isCatchUpEligible: true,
      catchUpDays: 14,
    },
    {
      slotId: '106-08',
      title: 'Wild Amazon: The Canopy Secret',
      description: 'Scientists erect suspended research cables 50 meters into the canopy to document previously unrecorded treefrog species.',
      startMinutes: 1050,
      durationMinutes: 120,
      genre: 'Rainforest Ecology',
      rating: 'PG',
      artworkUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 7,
    },
    {
      slotId: '106-09',
      title: 'The Human Genome: Blueprint of Life',
      description: 'A cinematic scientific journey into CRISPR gene editing, ancient Neanderthal DNA markers, and evolutionary biology.',
      startMinutes: 1170,
      durationMinutes: 150,
      genre: 'Science',
      rating: 'PG',
      artworkUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 14,
    },
    {
      slotId: '106-10',
      title: 'Night Hunters of the Kalahari',
      description: 'Thermal imaging follows black-maned lions, leopards, and aardvarks across the dunes under starry desert skies.',
      startMinutes: 1320,
      durationMinutes: 120,
      genre: 'Predators',
      rating: '13+',
      artworkUrl: 'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?q=80&w=800&auto=format&fit=crop',
      isCatchUpEligible: true,
      catchUpDays: 7,
    },
  ],
}

/**
 * Generate scheduled programme instances for a specific calendar day in user's local timezone.
 */
export function generateScheduleForDay(channelId: string, referenceDate: Date): EPGProgram[] {
  const templates = EPG_SCHEDULE_TEMPLATES[channelId] || []
  if (templates.length === 0) return []

  const dayStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
    0,
    0,
    0,
    0
  )
  const dayStartTime = dayStart.getTime()
  const dateKey = `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, '0')}-${String(referenceDate.getDate()).padStart(2, '0')}`

  return templates.map((tmpl) => {
    const startTime = new Date(dayStartTime + tmpl.startMinutes * 60 * 1000)
    const endTime = new Date(dayStartTime + (tmpl.startMinutes + tmpl.durationMinutes) * 60 * 1000)
    const isCatchUpEligible = tmpl.isCatchUpEligible !== false
    const catchUpDays = tmpl.catchUpDays ?? 7
    const catchUpExpiresAt = new Date(endTime.getTime() + catchUpDays * 24 * 60 * 60 * 1000)

    return {
      id: `prog-${channelId}-${dateKey}-${tmpl.slotId}`,
      channelId,
      title: tmpl.title,
      description: tmpl.description,
      startTime,
      endTime,
      durationMinutes: tmpl.durationMinutes,
      genre: tmpl.genre,
      artworkUrl: tmpl.artworkUrl,
      rating: tmpl.rating,
      linkedContentId: tmpl.linkedContentId,
      badge: tmpl.badge,
      isCatchUpEligible,
      catchUpDays,
      catchUpExpiresAt,
    }
  })
}

/**
 * Generate schedules spanning yesterday, today, and tomorrow for a given channel.
 */
export function generateRollingSchedule(channelId: string, now: Date = new Date()): EPGProgram[] {
  const days = [-1, 0, 1]
  const allPrograms: EPGProgram[] = []

  for (const offset of days) {
    const d = new Date(now)
    d.setDate(d.getDate() + offset)
    allPrograms.push(...generateScheduleForDay(channelId, d))
  }

  return allPrograms.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
}

/**
 * Generate extended catch-up catalogue spanning past N days (up to 14 days back) for all channels.
 */
export function generateCatchUpCatalogue(now: Date = new Date(), pastDays = 14): EPGProgram[] {
  const allPrograms: EPGProgram[] = []
  const nowMs = now.getTime()

  for (let offset = -pastDays; offset <= 0; offset++) {
    const d = new Date(now)
    d.setDate(d.getDate() + offset)
    for (const ch of EPG_CHANNELS) {
      const dayProgs = generateScheduleForDay(ch.id, d)
      allPrograms.push(...dayProgs)
    }
  }

  // Filter programmes whose broadcast has ended
  return allPrograms
    .filter((p) => p.endTime.getTime() <= nowMs)
    .sort((a, b) => b.endTime.getTime() - a.endTime.getTime()) // Newest first
}

/**
 * Calculate detailed catch-up availability status for a programme.
 */
export function getCatchUpStatus(program: EPGProgram, now: Date = new Date()): CatchUpStatus {
  const nowMs = now.getTime()
  const endMs = program.endTime.getTime()
  const isEligible = Boolean(program.isCatchUpEligible)
  const expiresAtMs = program.catchUpExpiresAt ? program.catchUpExpiresAt.getTime() : 0
  const isExpired = isEligible && nowMs > expiresAtMs
  const isAvailable = isEligible && nowMs >= endMs && nowMs <= expiresAtMs

  const remainingMs = Math.max(0, expiresAtMs - nowMs)
  const remainingHours = Math.floor(remainingMs / (3600 * 1000))
  const remainingDays = Math.ceil(remainingMs / (24 * 3600 * 1000))
  const isExpiringSoon = isAvailable && remainingHours <= 48

  let expiryText = 'Catch-up Unavailable'
  if (isExpired) {
    expiryText = 'Catch-up Expired'
  } else if (isAvailable) {
    if (remainingHours <= 24) {
      expiryText = `Expiring soon • ${Math.max(1, remainingHours)}h left`
    } else if (remainingHours <= 48) {
      expiryText = `Expiring soon • ${remainingDays} days left`
    } else {
      expiryText = `Available for ${remainingDays} days`
    }
  }

  // Format broadcast date string
  const isToday = program.startTime.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = program.startTime.toDateString() === yesterday.toDateString()

  const timeStr = program.startTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  let broadcastDateText = ''
  if (isToday) {
    broadcastDateText = `Today at ${timeStr}`
  } else if (isYesterday) {
    broadcastDateText = `Yesterday at ${timeStr}`
  } else {
    const dateStr = program.startTime.toLocaleDateString([], {
      day: 'numeric',
      month: 'short',
    })
    broadcastDateText = `${dateStr} at ${timeStr}`
  }

  return {
    isAvailable,
    isExpired,
    isEligible,
    remainingHours,
    remainingDays,
    expiryText,
    isExpiringSoon,
    broadcastDateText,
  }
}
