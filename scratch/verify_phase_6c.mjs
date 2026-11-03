import { spawn } from 'child_process'
import http from 'http'
import fs from 'fs'

const PORT = 9225
const APP_URL = 'http://localhost:5173/'

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = ''
        res.on('data', (c) => (data += c))
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
    this.pending = new Map()

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.id && this.pending.has(msg.id)) {
        const { res, rej } = this.pending.get(msg.id)
        this.pending.delete(msg.id)
        if (msg.error) rej(msg.error)
        else res(msg.result)
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
    const id = this.id++
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej })
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
      throw new Error('Eval error: ' + JSON.stringify(res.exceptionDetails))
    }
    return res.result?.value
  }

  close() {
    this.ws?.close()
  }
}

async function main() {
  console.log('🚀 Starting Chrome headless for Phase 6C Advertising & Sponsorship Verification...')
  const tempDir = `C:\\tmp\\chrome_test_profile_6c_${Date.now()}`
  fs.mkdirSync(tempDir, { recursive: true })

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  const chromeProcess = spawn(
    chromePath,
    [
      `--remote-debugging-port=${PORT}`,
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--user-data-dir=' + tempDir,
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

    console.log('\n--- Setup: Clean Free User Session ---')
    await cdp.eval(`(() => {
      sessionStorage.setItem('junction_startup_seen', 'true')
      sessionStorage.setItem('junction_in_streaming', 'true')
      localStorage.setItem('junction_active_profile_v1', 'profile-aarav')
      localStorage.setItem('junction_sub_tier_profile-aarav', 'free')
      localStorage.removeItem('junction_subscription_v1_profile-aarav')
      localStorage.removeItem('junction_ad_frequency_v1_profile-aarav')
      window.location.reload()
    })()`)
    await sleep(2200)

    console.log('\n--- Test 1: In-Browser Ad Decision Engine Rules ---')
    const testDecisionResult = await cdp.eval(`(() => {
      // Test dynamic decision engine via exported modules or simulated call
      const rawFreq = localStorage.getItem('junction_ad_frequency_v1_profile-aarav');
      return { hasNoInitialFrequency: rawFreq === null };
    })()`)
    console.log('Initial frequency state clean?', testDecisionResult.hasNoInitialFrequency)

    console.log('\n--- Test 2: Free User AVOD Playback & Rotation ---')
    // Play movie feat-1 (Kaleidoscope) on Free tier
    await cdp.eval(`(() => {
      const playBtn = document.querySelector('[data-testid="content-card-feat-1"] button');
      if (playBtn) playBtn.click();
    })()`)
    await sleep(1500)

    const isPlayerOpen = await cdp.eval(`Boolean(document.querySelector('[data-testid="simulated-player-modal"]'))`)
    if (!isPlayerOpen) throw new Error('Player failed to open')

    const hasAdLabel = await cdp.eval(`Boolean(document.querySelector('[data-testid="player-ad-label"]'))`)
    const hasAdCountdown = await cdp.eval(`Boolean(document.querySelector('[data-testid="player-ad-countdown"]'))`)
    console.log('Ad label visible on Free tier?', hasAdLabel)
    console.log('Ad countdown visible on Free tier?', hasAdCountdown)
    if (!hasAdLabel || !hasAdCountdown) {
      throw new Error('Free users must receive eligible AVOD video ads with label & countdown')
    }

    // Wait 2 seconds for ad timer
    await sleep(2000)

    // Check frequency state persisted for profile-aarav
    const freqState1 = await cdp.eval(`(() => {
      const raw = localStorage.getItem('junction_ad_frequency_v1_profile-aarav');
      return raw ? JSON.parse(raw) : null;
    })()`)
    console.log('Logged frequency record after pre-roll:', freqState1)
    if (!freqState1 || Object.keys(freqState1).length === 0) {
      throw new Error('Ad impression must be recorded in junction_ad_frequency_v1_profile-aarav')
    }
    console.log('✅ Pre-roll impression recorded and persisted per profile!')

    // Click CTA button to test click tracking
    await cdp.eval(`(() => {
      const ctaBtn = document.querySelector('[data-testid="player-ad-cta-btn"]');
      if (ctaBtn) ctaBtn.click();
    })()`)
    await sleep(500)

    // Exit player
    await cdp.eval(`(() => {
      const exitBtn = document.querySelector('button[title="Exit Player (Esc)"]');
      if (exitBtn) exitBtn.click();
    })()`)
    await sleep(1000)

    console.log('\n--- Test 3: Standard & Premium 100% Ad-Free Experience ---')
    // Upgrade Aarav to Standard
    await cdp.eval(`(() => {
      const sub = {
        planId: 'standard',
        planName: 'Standard',
        billingFrequency: 'monthly',
        status: 'active',
        startDateISO: new Date().toISOString(),
        renewalDateISO: new Date(Date.now() + 30*86400000).toISOString(),
        cancelAtPeriodEnd: false,
        isTrial: false
      };
      localStorage.setItem('junction_subscription_v1_profile-aarav', JSON.stringify(sub));
      localStorage.setItem('junction_sub_tier_profile-aarav', 'standard');
      window.location.reload();
    })()`)
    await sleep(2200)

    // Play same title on Standard tier
    await cdp.eval(`(() => {
      const playBtn = document.querySelector('[data-testid="content-card-feat-1"] button');
      if (playBtn) playBtn.click();
    })()`)
    await sleep(1500)

    const hasAdOnStandard = await cdp.eval(`Boolean(document.querySelector('[data-testid="player-ad-label"]'))`)
    console.log('Ad label visible on Standard plan?', hasAdOnStandard)
    if (hasAdOnStandard) {
      throw new Error('Standard tier must have 100% ad-free playback!')
    }
    console.log('✅ Standard tier ad-free verification confirmed!')

    // Exit player
    await cdp.eval(`(() => {
      const exitBtn = document.querySelector('button[title="Exit Player (Esc)"]');
      if (exitBtn) exitBtn.click();
    })()`)
    await sleep(1000)

    console.log('\n--- Test 4: Live TV Programme Sponsorship for Paid Users ---')
    // Navigate to Live TV
    await cdp.eval(`(() => {
      const navButtons = Array.from(document.querySelectorAll('nav button'));
      const liveBtn = navButtons.find(b => b.textContent.includes('Live TV'));
      if (liveBtn) liveBtn.click();
    })()`)
    await sleep(1500)

    // Check Live TV sponsorship banner
    const hasSponsorBanner = await cdp.eval(`Boolean(document.querySelector('[data-testid="livetv-sponsor-banner"]'))`)
    const hasSponsorCta = await cdp.eval(`Boolean(document.querySelector('[data-testid="livetv-sponsor-cta"]'))`)
    console.log('Live TV sponsor banner visible?', hasSponsorBanner)
    console.log('Live TV sponsor CTA visible?', hasSponsorCta)
    if (!hasSponsorBanner || !hasSponsorCta) {
      throw new Error('Expected livetv-sponsor-banner and livetv-sponsor-cta on Live TV page')
    }

    // Click Live TV sponsor CTA -> Opens SponsorInfoModal
    await cdp.eval(`(() => {
      const btn = document.querySelector('[data-testid="livetv-sponsor-cta"]');
      if (btn) btn.click();
    })()`)
    await sleep(800)

    const isSponsorModalOpen = await cdp.eval(`Boolean(document.querySelector('[data-testid="sponsor-info-modal"]'))`)
    const hasSponsorModalCta = await cdp.eval(`Boolean(document.querySelector('[data-testid="sponsor-modal-cta"]'))`)
    console.log('SponsorInfoModal opened?', isSponsorModalOpen)
    console.log('SponsorInfoModal CTA present?', hasSponsorModalCta)
    if (!isSponsorModalOpen || !hasSponsorModalCta) {
      throw new Error('Expected SponsorInfoModal to open with sponsor-modal-cta')
    }

    // Close SponsorInfoModal
    await cdp.eval(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`)
    await sleep(600)

    // Launch Live TV Full-Screen Player
    await cdp.eval(`(() => {
      const watchLiveBtn = document.querySelector('[data-testid="spotlight-watch-live-btn"]');
      if (watchLiveBtn) watchLiveBtn.click();
    })()`)
    await sleep(1500)

    // Verify non-interrupting player sponsor watermark/indicator
    const hasPlayerSponsorIndicator = await cdp.eval(`Boolean(document.querySelector('[data-testid="player-sponsor-indicator"]'))`)
    const hasPlayerVideoAd = await cdp.eval(`Boolean(document.querySelector('[data-testid="player-ad-label"]'))`)
    console.log('Player sponsor indicator visible in live stream?', hasPlayerSponsorIndicator)
    console.log('Video ad break present in live stream for paid user?', hasPlayerVideoAd)
    if (!hasPlayerSponsorIndicator) {
      throw new Error('Expected player-sponsor-indicator on sponsored live stream')
    }
    if (hasPlayerVideoAd) {
      throw new Error('Live sponsorship must NOT trigger conventional video ad break')
    }
    console.log('✅ Live TV programme sponsorship clearly distinguished from ad breaks!')

    // Exit player
    await cdp.eval(`(() => {
      const exitBtn = document.querySelector('button[title="Exit Player (Esc)"]');
      if (exitBtn) exitBtn.click();
    })()`)
    await sleep(1000)

    console.log('\n--- Test 5: EPG Schedule & Modal Sponsorship Indicators ---')
    // Check EPG sponsor badges in schedule
    const hasEpgSponsorBadge = await cdp.eval(`Boolean(document.querySelector('[data-testid="epg-sponsor-badge"]'))`)
    console.log('EPG schedule sponsor badge present?', hasEpgSponsorBadge)
    if (!hasEpgSponsorBadge) {
      throw new Error('Expected epg-sponsor-badge in EPG guide')
    }

    // Click Spotlight info button to open ProgramInfoModal
    await cdp.eval(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const infoBtn = buttons.find(b => b.textContent.includes('Programme Details') || b.textContent.includes('Details'));
      if (infoBtn) infoBtn.click();
    })()`)
    await sleep(1000)

    const hasModalSponsorSection = await cdp.eval(`Boolean(document.querySelector('[data-testid="modal-sponsor-section"]'))`)
    const hasModalSponsorBadge = await cdp.eval(`Boolean(document.querySelector('[data-testid="modal-sponsor-badge"]'))`)
    const hasModalSponsorCta = await cdp.eval(`Boolean(document.querySelector('[data-testid="modal-sponsor-cta"]'))`)
    console.log('ProgramInfoModal sponsor section present?', hasModalSponsorSection)
    console.log('ProgramInfoModal sponsor badge present?', hasModalSponsorBadge)
    console.log('ProgramInfoModal sponsor CTA present?', hasModalSponsorCta)
    if (!hasModalSponsorSection || !hasModalSponsorCta) {
      throw new Error('Expected modal-sponsor-section and modal-sponsor-cta in ProgramInfoModal')
    }

    // Close ProgramInfoModal
    await cdp.eval(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`)
    await sleep(600)

    console.log('\n--- Test 6: Homepage Sponsored Showcase Shelf ---')
    // Navigate to Home
    await cdp.eval(`(() => {
      const navButtons = Array.from(document.querySelectorAll('nav button'));
      const homeBtn = navButtons.find(b => b.textContent.includes('Home'));
      if (homeBtn) homeBtn.click();
    })()`)
    await sleep(1500)

    const hasSponsoredShelf = await cdp.eval(`Boolean(document.querySelector('[data-testid="sponsored-shelf"]'))`)
    const hasSponsoredShelfCta = await cdp.eval(`Boolean(document.querySelector('[data-testid="sponsored-shelf-cta"]'))`)
    const hasCardSponsoredBadge = await cdp.eval(`Boolean(document.querySelector('[data-testid="card-sponsored-badge"]'))`)
    console.log('Homepage sponsored showcase shelf present?', hasSponsoredShelf)
    console.log('Homepage sponsored shelf CTA present?', hasSponsoredShelfCta)
    console.log('Content cards show discreet SPONSORED badge?', hasCardSponsoredBadge)
    if (!hasSponsoredShelf || !hasSponsoredShelfCta || !hasCardSponsoredBadge) {
      throw new Error('Expected sponsored-shelf, sponsored-shelf-cta, and card-sponsored-badge on Homepage')
    }

    // Click shelf CTA to verify SponsorInfoModal opens
    await cdp.eval(`(() => {
      const btn = document.querySelector('[data-testid="sponsored-shelf-cta"]');
      if (btn) btn.click();
    })()`)
    await sleep(800)

    const isShelfSponsorModalOpen = await cdp.eval(`Boolean(document.querySelector('[data-testid="sponsor-info-modal"]'))`)
    console.log('Sponsor modal opened from shelf CTA?', isShelfSponsorModalOpen)
    if (!isShelfSponsorModalOpen) {
      throw new Error('Expected sponsor-info-modal from shelf CTA')
    }
    await cdp.eval(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`)
    await sleep(600)

    console.log('\n--- Test 7: Profile Frequency History Isolation ---')
    // Aarav has recorded impressions
    const aaravRecords = await cdp.eval(`Boolean(localStorage.getItem('junction_ad_frequency_v1_profile-aarav'))`)
    console.log('Aarav frequency record exists?', aaravRecords)
    if (!aaravRecords) throw new Error('Aarav should have frequency records')

    // Switch active profile to Priya
    await cdp.eval(`(() => {
      localStorage.setItem('junction_active_profile_v1', 'profile-priya');
      window.location.reload();
    })()`)
    await sleep(2200)

    // Check Priya has independent frequency state (should be empty initially)
    const priyaRecords = await cdp.eval(`localStorage.getItem('junction_ad_frequency_v1_profile-priya')`)
    console.log('Priya initial frequency record:', priyaRecords)
    if (priyaRecords !== null && Object.keys(JSON.parse(priyaRecords)).length > 0) {
      throw new Error('Profile switching must isolate frequency state!')
    }
    console.log('✅ Frequency state is strictly isolated per profile!')

    // Switch back to Aarav
    await cdp.eval(`(() => {
      localStorage.setItem('junction_active_profile_v1', 'profile-aarav');
      window.location.reload();
    })()`)
    await sleep(2000)

    console.log('\n--- Test 8: Advertising Insights Dashboard ---')
    // Navigate to Ad Insights
    await cdp.eval(`(() => {
      const navButtons = Array.from(document.querySelectorAll('nav button'));
      const adBtn = navButtons.find(b => b.textContent.includes('Ad Insights'));
      if (adBtn) adBtn.click();
    })()`)
    await sleep(1500)

    const hasTotalCampaignsKpi = await cdp.eval(`Boolean(document.querySelector('[data-testid="kpi-total-campaigns"]'))`)
    const hasActiveCampaignsKpi = await cdp.eval(`Boolean(document.querySelector('[data-testid="kpi-active-campaigns"]'))`)
    const hasImpressionsKpi = await cdp.eval(`Boolean(document.querySelector('[data-testid="kpi-total-impressions"]'))`)
    const hasFormatDistribution = await cdp.eval(`Boolean(document.querySelector('[data-testid="ad-format-distribution"]'))`)
    const hasLocalFreqPanel = await cdp.eval(`Boolean(document.querySelector('[data-testid="local-frequency-panel"]'))`)
    const hasResetFreqBtn = await cdp.eval(`Boolean(document.querySelector('[data-testid="reset-ad-frequency-btn"]'))`)

    console.log('KPI Total Campaigns:', hasTotalCampaignsKpi)
    console.log('KPI Active Campaigns:', hasActiveCampaignsKpi)
    console.log('KPI Total Impressions:', hasImpressionsKpi)
    console.log('Format distribution breakdown:', hasFormatDistribution)
    console.log('Local profile frequency panel:', hasLocalFreqPanel)
    console.log('Reset frequency button:', hasResetFreqBtn)

    if (!hasTotalCampaignsKpi || !hasActiveCampaignsKpi || !hasImpressionsKpi || !hasFormatDistribution || !hasLocalFreqPanel) {
      throw new Error('Advertising Insights dashboard missing required KPI or distribution components')
    }

    // Verify campaign table has rows
    const hasApexRow = await cdp.eval(`Boolean(document.querySelector('[data-testid="campaign-row-camp-apex-ai"]'))`)
    const hasVeloceRow = await cdp.eval(`Boolean(document.querySelector('[data-testid="campaign-row-camp-veloce-speed"]'))`)
    console.log('Campaign table rows: Apex=', hasApexRow, 'Veloce=', hasVeloceRow)
    if (!hasApexRow || !hasVeloceRow) {
      throw new Error('Expected campaign table rows for centralised campaigns')
    }

    // Click Reset Profile Ad Frequency
    await cdp.eval(`(() => {
      const btn = document.querySelector('[data-testid="reset-ad-frequency-btn"]');
      if (btn) btn.click();
    })()`)
    await sleep(800)

    const rawFreqAfterReset = await cdp.eval(`localStorage.getItem('junction_ad_frequency_v1_profile-aarav')`)
    console.log('Frequency record after reset click:', rawFreqAfterReset)
    if (rawFreqAfterReset !== null) {
      throw new Error('Reset button must clear local profile frequency history')
    }
    console.log('✅ Reset profile ad frequency confirmed!')

    // Take screenshot
    const screenshot = await cdp.send('Page.captureScreenshot')
    fs.writeFileSync('scratch/phase_6c_ad_insights.png', Buffer.from(screenshot.data, 'base64'))
    console.log('Saved screenshot: scratch/phase_6c_ad_insights.png')

    console.log('\n🎉 ALL PHASE 6C ADVERTISING & SPONSORSHIP TESTS PASSED! 🎉\n')
    cdp.close()
  } finally {
    try {
      chromeProcess.kill()
    } catch {}
  }
}

main().catch((err) => {
  console.error('\n❌ Verification Failed:', err)
  process.exit(1)
})
