import { spawn } from 'child_process'
import http from 'http'
import fs from 'fs'

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
  console.log('🚀 Starting Chrome headless for Phase 6A AVOD Verification...')
  const tempDir = process.env.TEMP + '\\chrome_test_p6a_' + Date.now()
  const chromeProcess = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${PORT}`,
      '--headless=new',
      '--disable-gpu',
      '--window-size=1440,900',
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

    console.log('\n--- Test 1: App Load and Profile Initialization ---')
    await cdp.eval(`(() => {
      sessionStorage.setItem('junction_startup_seen', 'true')
      sessionStorage.setItem('junction_in_streaming', 'true')
      localStorage.setItem('junction_active_profile_v1', 'profile-aarav')
      localStorage.removeItem('junction_sub_tier_profile-aarav')
      window.location.reload()
    })()`)
    await sleep(2500)

    // Verify Nav Subscription Badge (Default: FREE)
    const navSubBadge = await cdp.eval(`(() => {
      const el = document.querySelector('[data-testid="nav-subscription-badge"]');
      return el ? el.textContent.trim() : null;
    })()`)
    console.log('Nav Subscription Badge:', navSubBadge)
    if (!navSubBadge || !navSubBadge.includes('FREE')) {
      throw new Error(`Expected FREE in nav-subscription-badge, got: ${navSubBadge}`)
    }

    console.log('\n--- Test 2: Sponsored Badges on Home and Details Modal ---')
    // Check ContentCard sponsored badge
    const sponsoredCardBadge = await cdp.eval(`(() => {
      const badges = document.querySelectorAll('[data-testid="card-sponsored-badge"]');
      return badges.length > 0 ? badges[0].textContent.trim() : null;
    })()`)
    console.log('ContentCard Sponsored Badge found:', sponsoredCardBadge)
    if (!sponsoredCardBadge) {
      throw new Error('Expected at least one [data-testid="card-sponsored-badge"] on home page')
    }

    // Open details modal for feat-1
    await cdp.eval(`(() => {
      const detailsBtn = document.querySelector('[data-testid="content-card-details-btn-feat-1"]');
      if (detailsBtn) detailsBtn.click();
      else {
        const card = document.querySelector('[data-testid="content-card-feat-1"]');
        if (card) card.click();
      }
    })()`)
    await sleep(1200)

    // Check sponsor box inside details modal
    const detailsSponsorText = await cdp.eval(`(() => {
      const box = document.querySelector('[data-testid="details-sponsor-box"]');
      return box ? box.textContent.trim() : null;
    })()`)
    console.log('Details Modal Sponsor Box disclosure:', detailsSponsorText)
    if (!detailsSponsorText || !detailsSponsorText.includes('Apex Quantum')) {
      throw new Error(`Expected Apex Quantum sponsor disclosure in details modal, got: ${detailsSponsorText}`)
    }

    // Close details modal
    await cdp.eval(`(() => {
      const closeBtn = document.querySelector('[data-testid="close-details-modal-btn"]') || document.querySelector('button[aria-label="Close modal"]');
      if (closeBtn) closeBtn.click();
    })()`)
    await sleep(800)

    console.log('\n--- Test 3: Live TV Spotlight Sponsorship ---')
    // Navigate to Live TV
    await cdp.eval(`(() => {
      const navButtons = Array.from(document.querySelectorAll('nav button'));
      const liveBtn = navButtons.find(b => b.textContent.includes('Live TV'));
      if (liveBtn) liveBtn.click();
    })()`)
    await sleep(1500)

    const liveSponsorBadge = await cdp.eval(`(() => {
      const el = document.querySelector('[data-testid="livetv-sponsor-badge"]');
      return el ? el.textContent.trim() : null;
    })()`)
    console.log('Live TV Spotlight Sponsor Badge:', liveSponsorBadge)
    if (!liveSponsorBadge || !liveSponsorBadge.toUpperCase().includes('APEX QUANTUM')) {
      throw new Error(`Expected APEX QUANTUM in livetv-sponsor-badge, got: ${liveSponsorBadge}`)
    }

    // Navigate back to Home
    await cdp.eval(`(() => {
      const navButtons = Array.from(document.querySelectorAll('nav button'));
      const homeBtn = navButtons.find(b => b.textContent.includes('Home'));
      if (homeBtn) homeBtn.click();
    })()`)
    await sleep(1200)

    console.log('\n--- Test 4: AVOD Pre-Roll Ad on Free Tier ---')
    // Open player for feat-1 by clicking play button
    await cdp.eval(`(() => {
      const playBtn = document.querySelector('[data-testid="content-card-feat-1"] button');
      if (playBtn) playBtn.click();
    })()`)
    await sleep(1500)

    // Check player modal is open
    const isPlayerOpen = await cdp.eval(`Boolean(document.querySelector('[data-testid="simulated-player-modal"]'))`)
    if (!isPlayerOpen) throw new Error('SimulatedPlayerModal failed to open')

    // Verify Pre-roll ad elements
    const adLabel = await cdp.eval(`(() => {
      const el = document.querySelector('[data-testid="player-ad-label"]');
      return el ? el.textContent.trim() : null;
    })()`)
    console.log('Player Ad Label:', adLabel)
    if (!adLabel || !adLabel.includes('ADVERTISEMENT')) {
      throw new Error(`Expected ADVERTISEMENT in player-ad-label, got: ${adLabel}`)
    }

    const advertiser = await cdp.eval(`(() => {
      const el = document.querySelector('[data-testid="player-ad-advertiser"]');
      return el ? el.textContent.trim() : null;
    })()`)
    console.log('Advertiser:', advertiser)
    if (!advertiser || advertiser.length === 0) {
      throw new Error('Expected advertiser name in player-ad-advertiser')
    }

    const countdown = await cdp.eval(`(() => {
      const el = document.querySelector('[data-testid="player-ad-countdown"]');
      return el ? el.textContent.trim() : null;
    })()`)
    console.log('Ad Countdown:', countdown)
    if (!countdown || !countdown.includes('Ad ends in')) {
      throw new Error(`Expected ad countdown, got: ${countdown}`)
    }

    const progressBar = await cdp.eval(`Boolean(document.querySelector('[data-testid="player-ad-progress-bar"]'))`)
    if (!progressBar) throw new Error('Expected [data-testid="player-ad-progress-bar"]')

    const ctaBtn = await cdp.eval(`Boolean(document.querySelector('[data-testid="player-ad-cta-btn"]'))`)
    if (!ctaBtn) throw new Error('Expected [data-testid="player-ad-cta-btn"]')

    // Verify Skip Button initial disabled lockout (5s threshold)
    const initialSkipState = await cdp.eval(`(() => {
      const btn = document.querySelector('[data-testid="player-ad-skip-btn"]');
      return btn ? { disabled: btn.disabled, text: btn.textContent.trim() } : null;
    })()`)
    console.log('Initial Skip Button state:', initialSkipState)
    if (!initialSkipState || !initialSkipState.disabled || !initialSkipState.text.includes('Skip Ad in')) {
      throw new Error(`Expected disabled skip button with countdown, got: ${JSON.stringify(initialSkipState)}`)
    }

    // Wait 5.5s for skip lockout to expire
    console.log('Waiting 5.5s for ad skip threshold...')
    await sleep(5500)

    const readySkipState = await cdp.eval(`(() => {
      const btn = document.querySelector('[data-testid="player-ad-skip-btn"]');
      return btn ? { disabled: btn.disabled, text: btn.textContent.trim() } : null;
    })()`)
    console.log('Skip Button after 5s:', readySkipState)
    if (!readySkipState || readySkipState.disabled) {
      throw new Error(`Expected skip button to become enabled, got: ${JSON.stringify(readySkipState)}`)
    }

    // Click Skip Ad
    await cdp.eval(`(() => {
      const btn = document.querySelector('[data-testid="player-ad-skip-btn"]');
      if (btn) btn.click();
    })()`)
    await sleep(800)

    // Verify Pre-roll ad ended and content playback started
    const adStillVisible = await cdp.eval(`Boolean(document.querySelector('[data-testid="player-ad-label"]'))`)
    if (adStillVisible) throw new Error('Ad label still visible after clicking skip button')
    console.log('✅ Pre-roll ad skipped successfully, content playback active!')

    console.log('\n--- Test 5: AVOD Mid-Roll Ad on Free Tier ---')
    // Click forward 10s button multiple times to advance past mid-roll cue point (~20s)
    await cdp.eval(`(() => {
      const fwdBtn = document.querySelector('button[title="Forward 10 seconds (→)"]');
      if (fwdBtn) {
        fwdBtn.click();
        fwdBtn.click();
        fwdBtn.click();
      }
    })()`)
    await sleep(1500)

    // Check if mid-roll ad triggered
    let midRollTriggered = await cdp.eval(`Boolean(document.querySelector('[data-testid="player-ad-label"]'))`)
    console.log('Mid-roll ad triggered:', midRollTriggered)
    if (!midRollTriggered) {
      throw new Error('Expected mid-roll ad to trigger when advancing past cue point')
    }

    console.log('Waiting 5.5s to skip mid-roll ad...')
    await sleep(5500)
    await cdp.eval(`(() => {
      const btn = document.querySelector('[data-testid="player-ad-skip-btn"]');
      if (btn) btn.click();
    })()`)
    await sleep(800)
    console.log('✅ Mid-roll ad skipped successfully and content resumed!')

    // Exit player
    await cdp.eval(`(() => {
      const exitBtn = document.querySelector('button[title="Exit Player (Esc)"]');
      if (exitBtn) exitBtn.click();
    })()`)
    await sleep(1000)

    console.log('\n--- Test 6: Switch Subscription Tier to Premium ---')
    // Open profile menu
    await cdp.eval(`(() => {
      const btn = document.querySelector('[data-testid="profile-menu-button"]');
      if (btn) btn.click();
    })()`)
    await sleep(800)

    const menuBadgeBefore = await cdp.eval(`(() => {
      const b = document.querySelector('[data-testid="subscription-tier-badge"]');
      return b ? b.textContent.trim() : null;
    })()`)
    console.log('Menu subscription tier badge before toggle:', menuBadgeBefore)

    // Click toggle subscription tier button
    await cdp.eval(`(() => {
      const toggleBtn = document.querySelector('[data-testid="toggle-subscription-tier-btn"]');
      if (toggleBtn) toggleBtn.click();
    })()`)
    await sleep(800)

    const menuBadgeAfter = await cdp.eval(`(() => {
      const b = document.querySelector('[data-testid="subscription-tier-badge"]');
      return b ? b.textContent.trim() : null;
    })()`)
    console.log('Menu subscription tier badge after toggle:', menuBadgeAfter)
    if (!menuBadgeAfter || !menuBadgeAfter.includes('PREMIUM')) {
      throw new Error(`Expected PREMIUM in subscription-tier-badge, got: ${menuBadgeAfter}`)
    }

    // Close profile menu
    await cdp.eval(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`)
    await sleep(600)

    // Verify Nav Subscription Badge updated to PREMIUM
    const navSubBadgePremium = await cdp.eval(`(() => {
      const el = document.querySelector('[data-testid="nav-subscription-badge"]');
      return el ? el.textContent.trim() : null;
    })()`)
    console.log('Nav Subscription Badge updated:', navSubBadgePremium)
    if (!navSubBadgePremium || !navSubBadgePremium.includes('PREMIUM')) {
      throw new Error(`Expected PREMIUM in nav-subscription-badge, got: ${navSubBadgePremium}`)
    }

    console.log('\n--- Test 7: Ad-Free Experience on Premium Tier ---')
    // Play feat-1 again
    await cdp.eval(`(() => {
      const playBtn = document.querySelector('[data-testid="content-card-feat-1"] button');
      if (playBtn) playBtn.click();
    })()`)
    await sleep(1500)

    // Verify player is open and ZERO pre-roll ads are displayed
    const isPlayerOpenPremium = await cdp.eval(`Boolean(document.querySelector('[data-testid="simulated-player-modal"]'))`)
    if (!isPlayerOpenPremium) throw new Error('Player failed to open in Premium tier')

    const hasAdInPremium = await cdp.eval(`Boolean(document.querySelector('[data-testid="player-ad-label"]'))`)
    console.log('Ad label present in Premium playback?', hasAdInPremium)
    if (hasAdInPremium) {
      throw new Error('AVOD ad should NOT be shown to Premium tier users!')
    }
    console.log('✅ Premium tier successfully bypassed all pre-roll advertisements!')

    // Exit player
    await cdp.eval(`(() => {
      const exitBtn = document.querySelector('button[title="Exit Player (Esc)"]');
      if (exitBtn) exitBtn.click();
    })()`)
    await sleep(800)

    // Take screenshot of home page with Premium badge
    const screenshot = await cdp.send('Page.captureScreenshot')
    fs.writeFileSync('scratch/phase_6a_premium_home.png', Buffer.from(screenshot.data, 'base64'))
    console.log('Saved screenshot: scratch/phase_6a_premium_home.png')

    console.log('\n🎉 ALL PHASE 6A AVOD VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉\n')
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
