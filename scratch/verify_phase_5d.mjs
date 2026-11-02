import { spawn } from 'child_process'
import http from 'http'

const PORT = 9222
const APP_URL = 'http://localhost:5173/'
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          try {
            resolve(JSON.parse(data))
          } catch (e) {
            reject(e)
          }
        })
      })
      .on('error', reject)
  })
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl)
    this.id = 1
    this.callbacks = new Map()
    this.events = new Map()

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id)
        this.callbacks.delete(msg.id)
        if (msg.error) reject(msg.error)
        else resolve(msg.result)
      } else if (msg.method) {
        const listeners = this.events.get(msg.method) || []
        listeners.forEach((fn) => fn(msg.params))
      }
    }
  }

  async ready() {
    if (this.ws.readyState === WebSocket.OPEN) return
    return new Promise((resolve, reject) => {
      this.ws.onopen = () => resolve()
      this.ws.onerror = (e) => reject(e)
    })
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++
      this.callbacks.set(id, { resolve, reject })
      this.ws.send(JSON.stringify({ id, method, params }))
    })
  }

  async eval(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    })
    if (res.exceptionDetails) {
      const desc =
        res.exceptionDetails.exception?.description ||
        res.exceptionDetails.text ||
        JSON.stringify(res.exceptionDetails)
      throw new Error(desc)
    }
    return res.result?.value
  }

  close() {
    this.ws.close()
  }
}

async function main() {
  console.log('🚀 Starting Chrome headless for Phase 5D Unified TV-to-OTT Verification...')
  const chromeProcess = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${PORT}`,
      '--headless=new',
      '--disable-gpu',
      '--window-size=1440,900',
      '--no-first-run',
      '--no-default-browser-check',
      '--user-data-dir=' + process.env.TEMP + '\\chrome_test_p5d_' + Date.now(),
      APP_URL,
    ],
    { detached: false }
  )

  await sleep(2500)

  try {
    const tabs = await fetchJson(`http://127.0.0.1:${PORT}/json/list`)
    const pageTabs = tabs.filter(
      (t) =>
        !t.url.startsWith('chrome-extension://') &&
        !t.url.startsWith('chrome://') &&
        t.url.includes('5173')
    )
    const tab = pageTabs[0] || tabs.find((t) => t.url.includes('5173')) || tabs[0]
    console.log('Target tab connected:', tab.url, tab.title)
    const cdp = new CDPClient(tab.webSocketDebuggerUrl)
    await cdp.ready()
    await cdp.send('Page.enable')
    await cdp.send('Runtime.enable')

    console.log('\n--- 1. App Launch & Profile Initialization ---')
    await cdp.send('Page.navigate', { url: APP_URL })
    await sleep(2000)

    // Ensure session starts on Home page with Aarav profile
    await cdp.eval(`(() => {
      sessionStorage.setItem('junction_startup_seen', 'true')
      sessionStorage.setItem('junction_in_streaming', 'true')
      localStorage.setItem('junction_active_profile_v1', 'profile-aarav')
      window.location.reload()
    })()`)
    await sleep(2000)

    // --- TEST 1: Homepage Hybrid Discovery Shelf ---
    console.log('\n--- 2. Verify Homepage Hybrid Discovery Shelf ---')
    const hasHybridShelf = await cdp.eval(`Boolean(document.querySelector('[data-testid="hybrid-discovery-shelf"]'))`)
    console.log('✓ Hybrid Discovery Shelf exists:', hasHybridShelf)
    if (!hasHybridShelf) throw new Error('Hybrid discovery shelf missing on HomePage')

    const hybridCardsCount = await cdp.eval(`document.querySelectorAll('[data-testid="hybrid-discovery-shelf"] [data-testid^="content-card-"]').length`)
    console.log('✓ Hybrid Cards Rendered:', hybridCardsCount)
    if (hybridCardsCount === 0) throw new Error('No hybrid content cards rendered')

    // --- TEST 2: Cross-Platform Device Continuity Section ---
    console.log('\n--- 3. Verify Cross-Platform Device Continuity Section ---')
    const hasContinuitySection = await cdp.eval(`Boolean(document.querySelector('[data-testid="device-continuity-section"]'))`)
    console.log('✓ Device Continuity Section exists:', hasContinuitySection)
    if (!hasContinuitySection) throw new Error('Device continuity section missing')

    const hasSmartTvCard = await cdp.eval(`Boolean(document.querySelector('[data-testid="device-card-smart-tv"]'))`)
    const hasDesktopCard = await cdp.eval(`Boolean(document.querySelector('[data-testid="device-card-desktop"]'))`)
    const hasMobileCard = await cdp.eval(`Boolean(document.querySelector('[data-testid="device-card-mobile"]'))`)
    console.log('✓ Smart TV Card:', hasSmartTvCard, '| Desktop Card:', hasDesktopCard, '| Mobile Card:', hasMobileCard)
    if (!hasSmartTvCard || !hasDesktopCard || !hasMobileCard) throw new Error('Device continuity cards missing')

    // --- TEST 3: Content Details Modal Hybrid Broadcast Banner & Journey D ---
    console.log('\n--- 4. Verify ContentDetailsModal Hybrid Experience (Journey D) ---')
    // Open feat-1 (KALEIDOSCOPE) which has live hybrid broadcast
    await cdp.eval(`(() => {
      const detailsBtn = document.querySelector('[data-testid="content-card-details-btn-feat-1"]')
      if (detailsBtn) {
        detailsBtn.click()
        return
      }
      const card = document.querySelector('[data-testid="content-card-feat-1"]') || document.querySelector('[data-testid="hybrid-discovery-shelf"] [data-testid^="content-card-"]')
      if (card) {
        card.click()
      }
    })()`)
    await sleep(1500)

    const isModalOpen = await cdp.eval(`Boolean(document.querySelector('[data-testid="content-details-modal"]'))`)
    console.log('✓ Content Details Modal open:', isModalOpen)
    if (!isModalOpen) throw new Error('Content details modal failed to open')

    const hasHybridBanner = await cdp.eval(`Boolean(document.querySelector('[data-testid="hybrid-broadcast-banner"]'))`)
    console.log('✓ Hybrid Broadcast Banner displayed:', hasHybridBanner)
    if (!hasHybridBanner) throw new Error('Hybrid broadcast banner missing in details modal')

    const hasWatchLiveBtn = await cdp.eval(`Boolean(document.querySelector('[data-testid="hybrid-watch-live-btn"]'))`)
    console.log('✓ Watch Live Button displayed:', hasWatchLiveBtn)
    if (!hasWatchLiveBtn) throw new Error('Watch Live button missing for live broadcast title')

    // --- TEST 4: Extended Edition Selector ---
    console.log('\n--- 5. Verify Extended Edition Selector ---')
    const hasExtendedBtn = await cdp.eval(`Boolean(document.querySelector('[data-testid="hybrid-extended-edition-btn"]'))`)
    console.log('✓ Extended Edition Button displayed:', hasExtendedBtn)
    if (!hasExtendedBtn) throw new Error('Extended Edition button missing for eligible title')

    const initialTitleText = await cdp.eval(`document.querySelector('#details-title')?.textContent`)
    console.log('Initial details title:', initialTitleText)

    // Click extended edition toggle
    await cdp.eval(`document.querySelector('[data-testid="hybrid-extended-edition-btn"]').click()`)
    await sleep(500)
    const toggledTitleText = await cdp.eval(`document.querySelector('#details-title')?.textContent`)
    console.log('Toggled details title:', toggledTitleText)
    const containsCut = toggledTitleText && toggledTitleText.includes("Director's Cut")
    console.log("✓ Director's Cut reflected in title:", containsCut)
    if (!containsCut) throw new Error("Director's Cut title not updated after toggle")

    // --- TEST 5: Bonus Content Shelf & Playback ---
    console.log('\n--- 6. Verify Bonus Content & Behind-the-Scenes Shelf ---')
    const hasBonusSection = await cdp.eval(`Boolean(document.querySelector('[data-testid="hybrid-bonus-content-section"]'))`)
    console.log('✓ Bonus Content Section displayed:', hasBonusSection)
    if (!hasBonusSection) throw new Error('Bonus content shelf missing for title with bonus material')

    const bonusCardsCount = await cdp.eval(`document.querySelectorAll('[data-testid^="bonus-card-"]').length`)
    console.log('✓ Bonus Featurettes Count:', bonusCardsCount)
    if (bonusCardsCount === 0) throw new Error('No bonus featurettes rendered')

    // Click play on first bonus featurette
    console.log('Clicking play on first bonus featurette...')
    await cdp.eval(`document.querySelector('[data-testid^="bonus-play-btn-"]').click()`)
    await sleep(1500)

    const isBonusPlayerOpen = await cdp.eval(`Boolean(document.querySelector('[data-testid="simulated-player-modal"]'))`)
    const hasBonusBadge = await cdp.eval(`Boolean(document.querySelector('[data-testid="player-bonus-badge"]'))`)
    const bonusBadgeText = await cdp.eval(`document.querySelector('[data-testid="player-bonus-badge"]')?.textContent`)
    console.log('✓ Player opened for bonus feature:', isBonusPlayerOpen, '| Badge text:', bonusBadgeText)
    if (!isBonusPlayerOpen || !hasBonusBadge) throw new Error('SimulatedPlayerModal failed to launch bonus featurette')

    // Close player
    await cdp.eval(`(() => {
      const backBtn = document.querySelector('[aria-label="Exit player"]') || document.querySelector('button[title*="Exit"]')
      if (backBtn) backBtn.click()
    })()`)
    await sleep(1000)

    // --- TEST 6: Journey D (OTT to Live TV Stream) ---
    console.log('\n--- 7. Execute Journey D: OTT to Live TV ---')
    await cdp.eval(`document.querySelector('[data-testid="hybrid-watch-live-btn"]').click()`)
    await sleep(1500)

    const onLiveTvAfterJourneyD = await cdp.eval(`Boolean(document.querySelector('[data-testid="live-tv-page"]'))`)
    console.log('✓ Navigated to Live TV via Watch Live button:', onLiveTvAfterJourneyD)
    if (!onLiveTvAfterJourneyD) throw new Error('Journey D: Failed to tune and navigate to Live TV')

    // --- TEST 7: Journey A (Live TV to OTT Exploration) ---
    console.log('\n--- 8. Execute Journey A: Live TV to OTT ---')
    // Open full-screen live stream player
    await cdp.eval(`(() => {
      const playBtn = document.querySelector('[data-testid="spotlight-watch-live-btn"]') || document.querySelector('button[title*="Watch Live"]')
      if (playBtn) playBtn.click()
    })()`)
    await sleep(1500)

    const isLivePlayerOpen = await cdp.eval(`Boolean(document.querySelector('[data-testid="simulated-player-modal"]'))`)
    console.log('Live player open:', isLivePlayerOpen)
    if (!isLivePlayerOpen) throw new Error('Live player failed to open')

    const hasExploreOttBtn = await cdp.eval(`Boolean(document.querySelector('[data-testid="player-explore-ott-btn"]'))`)
    console.log('✓ Explore on OTT button in live stream:', hasExploreOttBtn)
    if (!hasExploreOttBtn) throw new Error('Explore on OTT button missing in Live player for linked title')

    // Click Explore on OTT
    console.log('Selecting "Explore on OTT" from Live Player...')
    await cdp.eval(`document.querySelector('[data-testid="player-explore-ott-btn"]').click()`)
    await sleep(1500)

    const isModalOpenAfterExplore = await cdp.eval(`Boolean(document.querySelector('[data-testid="content-details-modal"]'))`)
    const exploredTitle = await cdp.eval(`document.querySelector('#details-title')?.textContent`)
    console.log('✓ Returned to ContentDetailsModal from Live TV:', isModalOpenAfterExplore, '| Title:', exploredTitle)
    if (!isModalOpenAfterExplore) throw new Error('Journey A: Failed to open ContentDetailsModal from live stream')

    // Close details modal
    await cdp.eval(`(() => {
      const closeBtn = document.querySelector('[aria-label="Close details"]')
      if (closeBtn) closeBtn.click()
    })()`)
    await sleep(1000)

    // --- TEST 8: Journey C (Catch-up TV to OTT) ---
    console.log('\n--- 9. Execute Journey C: Catch-up TV to OTT ---')
    // Switch to Catch-up tab
    await cdp.eval(`(() => {
      const catchUpTab = document.querySelector('[data-testid="mode-catch-up"]')
      if (catchUpTab) catchUpTab.click()
    })()`)
    await sleep(1500)

    const onCatchUpMode = await cdp.eval(`Boolean(document.querySelector('[data-testid="catch-up-section"]'))`)
    console.log('Catch-up view loaded:', onCatchUpMode)
    if (!onCatchUpMode) throw new Error('Catch-up view failed to open')

    // Find and play a catch-up card
    const playedCatchUp = await cdp.eval(`(() => {
      const playBtn = document.querySelector('[data-testid="catch-up-play-btn"]') || document.querySelector('[data-testid^="catch-up-card-"] button')
      if (playBtn) {
        playBtn.click()
        return true
      }
      return false
    })()`)
    console.log('Clicked Play Catch-up:', playedCatchUp)
    await sleep(1500)

    const isCatchUpPlayerOpen = await cdp.eval(`Boolean(document.querySelector('[data-testid="simulated-player-modal"]'))`)
    const hasCatchUpBadge = await cdp.eval(`Boolean(document.querySelector('[data-testid="player-catch-up-badge"]'))`)
    console.log('✓ Catch-up Player active:', isCatchUpPlayerOpen, '| Catch-up badge:', hasCatchUpBadge)
    if (!isCatchUpPlayerOpen) throw new Error('Failed to launch Catch-up player')

    const hasExploreOttInCatchUp = await cdp.eval(`Boolean(document.querySelector('[data-testid="player-explore-ott-btn"]'))`)
    console.log('✓ Explore on OTT button in Catch-up player:', hasExploreOttInCatchUp)

    if (hasExploreOttInCatchUp) {
      console.log('Selecting "Explore on OTT" from Catch-up Player...')
      await cdp.eval(`document.querySelector('[data-testid="player-explore-ott-btn"]').click()`)
      await sleep(1500)

      const isModalOpenFromCatchup = await cdp.eval(`Boolean(document.querySelector('[data-testid="content-details-modal"]'))`)
      console.log('✓ Successfully navigated from Catch-up to ContentDetailsModal:', isModalOpenFromCatchup)
      if (!isModalOpenFromCatchup) throw new Error('Journey C: Failed to navigate from catch-up to details modal')

      // Close details modal
      await cdp.eval(`document.querySelector('[aria-label="Close details"]')?.click()`)
      await sleep(1000)
    }

    // --- TEST 9: Profile-Isolated Progress Separation ---
    console.log('\n--- 10. Verify Profile-Isolated Progress Separation ---')
    const historyAnalysis = await cdp.eval(`(() => {
      const aaravHistory = JSON.parse(localStorage.getItem('junction_history_v1_profile-aarav') || '[]')
      const miraHistory = JSON.parse(localStorage.getItem('junction_history_v1_profile-mira') || '[]')

      return {
        aaravCount: aaravHistory.length,
        miraCount: miraHistory.length,
        hasOttKeys: aaravHistory.some(h => !h.contentId.startsWith('catchup-')),
        hasEpisodeProgress: aaravHistory.some(h => Boolean(h.watchedEpisodes && Object.keys(h.watchedEpisodes).length > 0)),
      }
    })()`)
    console.log('✓ History Analysis:', historyAnalysis)
    if (historyAnalysis.aaravCount === 0) throw new Error('Aarav viewing history is empty')
    if (!historyAnalysis.hasEpisodeProgress) throw new Error('Episode progress separation missing')

    // --- TEST 10: Brand & Pixel Typography Sanity ---
    console.log('\n--- 11. Verify Brand Gradient & Typography Sanity ---')
    const brandSanity = await cdp.eval(`(() => {
      const brandLogo = document.querySelector('header span[class*="font-pixel"]')
      const footerBrand = document.querySelector('footer span[class*="font-pixel"]')
      const hasBrandGradients = Boolean(getComputedStyle(document.documentElement).getPropertyValue('--gradient-brand-subtle'))

      return {
        hasLogoPixelFont: Boolean(brandLogo),
        logoText: brandLogo?.textContent?.trim(),
        hasFooterPixelFont: Boolean(footerBrand),
        footerText: footerBrand?.textContent?.trim(),
        hasBrandGradients,
      }
    })()`)
    console.log('✓ Brand Sanity Check:', brandSanity)
    if (!brandSanity.hasLogoPixelFont || !brandSanity.hasFooterPixelFont) {
      throw new Error('Pixel font brand logo missing in header or footer')
    }

    console.log('\n🎉 ALL 11 PHASE 5D VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉\n')
    cdp.close()
  } catch (err) {
    console.error('\n❌ Phase 5D Verification FAILED:', err)
    process.exitCode = 1
  } finally {
    chromeProcess.kill('SIGKILL')
  }
}

main()
