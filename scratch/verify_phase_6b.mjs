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
  console.log('🚀 Starting Chrome headless for Phase 6B SVOD Subscription Verification...')
  const tempDir = process.env.TEMP + '\\chrome_test_p6b_' + Date.now()
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

    console.log('\n--- Test 1: Legacy Key Migration ---')
    // Set legacy key 'junction_sub_tier_profile-aarav' to 'premium' without new key
    await cdp.eval(`(() => {
      sessionStorage.setItem('junction_startup_seen', 'true')
      sessionStorage.setItem('junction_in_streaming', 'true')
      localStorage.setItem('junction_active_profile_v1', 'profile-aarav')
      localStorage.setItem('junction_sub_tier_profile-aarav', 'premium')
      localStorage.removeItem('junction_subscription_v1_profile-aarav')
      window.location.reload()
    })()`)
    await sleep(2200)

    // Verify migration into new format
    const migratedSub = await cdp.eval(`(() => {
      const raw = localStorage.getItem('junction_subscription_v1_profile-aarav');
      return raw ? JSON.parse(raw) : null;
    })()`)
    console.log('Migrated Subscription Object:', migratedSub)
    if (!migratedSub || migratedSub.planId !== 'premium' || migratedSub.status !== 'active') {
      throw new Error(`Failed to migrate legacy premium tier: ${JSON.stringify(migratedSub)}`)
    }
    console.log('✅ Legacy premium tier successfully migrated to new SVOD subscription model!')

    console.log('\n--- Test 2: Start with Clean Free Tier ---')
    // Reset to free for clean sequential testing
    await cdp.eval(`(() => {
      localStorage.setItem('junction_sub_tier_profile-aarav', 'free')
      localStorage.removeItem('junction_subscription_v1_profile-aarav')
      window.location.reload()
    })()`)
    await sleep(2000)

    const navBadgeInitial = await cdp.eval(`(() => {
      const el = document.querySelector('[data-testid="nav-subscription-badge"]');
      return el ? el.textContent.trim() : null;
    })()`)
    console.log('Initial Nav Badge:', navBadgeInitial)
    if (!navBadgeInitial || !navBadgeInitial.includes('FREE')) {
      throw new Error(`Expected FREE in nav badge, got: ${navBadgeInitial}`)
    }

    console.log('\n--- Test 3: Navigate to Dedicated Membership Page ---')
    // Click nav subscription badge to navigate directly to Membership page
    await cdp.eval(`(() => {
      const badge = document.querySelector('[data-testid="nav-subscription-badge"]');
      if (badge) badge.click();
    })()`)
    await sleep(1500)

    const isMembershipPageOpen = await cdp.eval(`Boolean(document.querySelector('[data-testid="membership-page"]'))`)
    console.log('Membership Page loaded:', isMembershipPageOpen)
    if (!isMembershipPageOpen) {
      throw new Error('Membership page failed to open on badge click')
    }

    // Verify all 3 plan cards are rendered
    const hasFreeCard = await cdp.eval(`Boolean(document.querySelector('[data-testid="plan-card-free"]'))`)
    const hasStandardCard = await cdp.eval(`Boolean(document.querySelector('[data-testid="plan-card-standard"]'))`)
    const hasPremiumCard = await cdp.eval(`Boolean(document.querySelector('[data-testid="plan-card-premium"]'))`)
    console.log(`Plan cards: Free=${hasFreeCard}, Standard=${hasStandardCard}, Premium=${hasPremiumCard}`)
    if (!hasFreeCard || !hasStandardCard || !hasPremiumCard) {
      throw new Error('All three plan cards (Free, Standard, Premium) must be rendered')
    }

    // Verify current plan badge is on Free card
    const currentPlanBadgeText = await cdp.eval(`(() => {
      const el = document.querySelector('[data-testid="current-plan-badge"]');
      return el ? el.textContent.trim() : null;
    })()`)
    console.log('Active Plan badge text:', currentPlanBadgeText)
    if (!currentPlanBadgeText || !currentPlanBadgeText.toUpperCase().includes('ACTIVE PLAN')) {
      throw new Error(`Expected Active Plan badge on current tier, got: ${currentPlanBadgeText}`)
    }

    console.log('\n--- Test 4: Monthly / Annual Billing Toggle ---')
    // Check initial monthly prices
    const standardMonthlyPrice = await cdp.eval(`(() => {
      const card = document.querySelector('[data-testid="plan-card-standard"]');
      return card ? card.textContent.includes('₹149') : false;
    })()`)
    console.log('Standard card shows ₹149 in monthly mode:', standardMonthlyPrice)
    if (!standardMonthlyPrice) throw new Error('Standard plan card should show ₹149/month')

    // Switch to Annual billing
    await cdp.eval(`(() => {
      const btn = document.querySelector('[data-testid="billing-annual-btn"]');
      if (btn) btn.click();
    })()`)
    await sleep(600)

    const standardAnnualPrice = await cdp.eval(`(() => {
      const card = document.querySelector('[data-testid="plan-card-standard"]');
      return card ? card.textContent.includes('₹1490') : false;
    })()`)
    const premiumAnnualPrice = await cdp.eval(`(() => {
      const card = document.querySelector('[data-testid="plan-card-premium"]');
      return card ? card.textContent.includes('₹2490') : false;
    })()`)
    console.log(`Annual pricing: Standard ₹1490=${standardAnnualPrice}, Premium ₹2490=${premiumAnnualPrice}`)
    if (!standardAnnualPrice || !premiumAnnualPrice) {
      throw new Error('Annual billing toggle should update prices to ₹1490/yr and ₹2490/yr')
    }

    // Switch back to Monthly billing
    await cdp.eval(`(() => {
      const btn = document.querySelector('[data-testid="billing-monthly-btn"]');
      if (btn) btn.click();
    })()`)
    await sleep(500)

    console.log('\n--- Test 5: Upgrade Free -> Standard with Confirmation Modal ---')
    // Click Upgrade to Standard
    await cdp.eval(`(() => {
      const btn = document.querySelector('[data-testid="plan-action-btn-standard"]');
      if (btn) btn.click();
    })()`)
    await sleep(800)

    // Check PlanUpgradeModal is open
    const isModalOpen = await cdp.eval(`Boolean(document.querySelector('[data-testid="plan-upgrade-modal"]'))`)
    console.log('PlanUpgradeModal visible:', isModalOpen)
    if (!isModalOpen) throw new Error('PlanUpgradeModal failed to open on plan action click')

    // Click confirm upgrade
    await cdp.eval(`(() => {
      const btn = document.querySelector('[data-testid="confirm-plan-change-btn"]');
      if (btn) btn.click();
    })()`)
    await sleep(800)

    // Verify Nav Badge updated to STANDARD
    const navBadgeStandard = await cdp.eval(`(() => {
      const el = document.querySelector('[data-testid="nav-subscription-badge"]');
      return el ? el.textContent.trim() : null;
    })()`)
    console.log('Nav Badge after Standard upgrade:', navBadgeStandard)
    if (!navBadgeStandard || !navBadgeStandard.includes('STANDARD')) {
      throw new Error(`Expected STANDARD in nav badge, got: ${navBadgeStandard}`)
    }

    // Verify localStorage updated
    const standardSub = await cdp.eval(`(() => {
      const raw = localStorage.getItem('junction_subscription_v1_profile-aarav');
      return raw ? JSON.parse(raw) : null;
    })()`)
    if (!standardSub || standardSub.planId !== 'standard') {
      throw new Error(`LocalStorage planId should be 'standard', got: ${standardSub?.planId}`)
    }
    console.log('✅ Upgraded to Standard with persistence confirmed!')

    console.log('\n--- Test 6: Feature Gating on Standard Plan ---')
    // Navigate to Home
    await cdp.eval(`(() => {
      const navButtons = Array.from(document.querySelectorAll('nav button'));
      const homeBtn = navButtons.find(b => b.textContent.includes('Home'));
      if (homeBtn) homeBtn.click();
    })()`)
    await sleep(1200)

    // 6A: Ad-Free Playback on Standard Plan
    await cdp.eval(`(() => {
      const playBtn = document.querySelector('[data-testid="content-card-feat-1"] button');
      if (playBtn) playBtn.click();
    })()`)
    await sleep(1500)

    const isPlayerOpen = await cdp.eval(`Boolean(document.querySelector('[data-testid="simulated-player-modal"]'))`)
    if (!isPlayerOpen) throw new Error('Player failed to open')

    const hasAdOnStandard = await cdp.eval(`Boolean(document.querySelector('[data-testid="player-ad-label"]'))`)
    console.log('Ad label visible on Standard plan playback?', hasAdOnStandard)
    if (hasAdOnStandard) {
      throw new Error('Standard tier must have 100% ad-free playback!')
    }
    console.log('✅ Standard tier ad-free playback confirmed!')

    // 6B: Interactive Television Restricted on Standard Plan
    const hasInteractiveBtn = await cdp.eval(`Boolean(document.querySelector('[data-testid="player-interactive-btn"]'))`)
    console.log('Interactive button present:', hasInteractiveBtn)
    if (hasInteractiveBtn) {
      await cdp.eval(`(() => {
        const btn = document.querySelector('[data-testid="player-interactive-btn"]');
        if (btn) btn.click();
      })()`)
      await sleep(800)

      const isPromptOpen = await cdp.eval(`Boolean(document.querySelector('[data-testid="plan-upgrade-modal"]'))`)
      console.log('Upgrade prompt opened for Interactive feature:', isPromptOpen)
      if (!isPromptOpen) {
        throw new Error('Expected PlanUpgradeModal when Standard user clicks Interactive TV')
      }

      // Close modal
      await cdp.eval(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`)
      await sleep(500)
    }

    // 6C: 4K HDR Quality Gated on Standard Plan
    await cdp.eval(`(() => {
      const settingsBtn = document.querySelector('button[title="Audio, Subtitles & Quality Settings"]');
      if (settingsBtn) settingsBtn.click();
    })()`)
    await sleep(500)

    // Click Quality sub-menu
    await cdp.eval(`(() => {
      const buttons = Array.from(document.querySelectorAll('div[class*="Settings Popover"] button, div[class*="z-50"] button'));
      const qBtn = buttons.find(b => b.textContent.includes('Quality'));
      if (qBtn) qBtn.click();
    })()`)
    await sleep(500)

    // Attempt to click 4K HDR
    await cdp.eval(`(() => {
      const buttons = Array.from(document.querySelectorAll('div[class*="z-50"] button'));
      const fourKBtn = buttons.find(b => b.textContent.includes('4K'));
      if (fourKBtn) fourKBtn.click();
    })()`)
    await sleep(800)

    const is4KPromptOpen = await cdp.eval(`Boolean(document.querySelector('[data-testid="plan-upgrade-modal"]'))`)
    console.log('Upgrade prompt opened when attempting 4K quality on Standard:', is4KPromptOpen)
    if (!is4KPromptOpen) {
      throw new Error('Expected PlanUpgradeModal when Standard user attempts 4K HDR quality')
    }

    // Confirm upgrade to Premium from the prompt
    await cdp.eval(`(() => {
      const btn = document.querySelector('[data-testid="confirm-plan-change-btn"]');
      if (btn) btn.click();
    })()`)
    await sleep(800)

    // Verify Nav Badge updated to PREMIUM
    const navBadgePremium = await cdp.eval(`(() => {
      const el = document.querySelector('[data-testid="nav-subscription-badge"]');
      return el ? el.textContent.trim() : null;
    })()`)
    console.log('Nav Badge after upgrading to Premium:', navBadgePremium)
    if (!navBadgePremium || !navBadgePremium.includes('PREMIUM')) {
      throw new Error(`Expected PREMIUM in nav badge, got: ${navBadgePremium}`)
    }
    console.log('✅ In-player contextual upgrade to Premium completed!')

    // Exit player
    await cdp.eval(`(() => {
      const exitBtn = document.querySelector('button[title="Exit Player (Esc)"]');
      if (exitBtn) exitBtn.click();
    })()`)
    await sleep(1000)

    console.log('\n--- Test 7: Premium Access Verified ---')
    // Open player again
    await cdp.eval(`(() => {
      const playBtn = document.querySelector('[data-testid="content-card-feat-1"] button');
      if (playBtn) playBtn.click();
    })()`)
    await sleep(1500)

    // Click interactive button on Premium tier -> opens sidebar directly!
    await cdp.eval(`(() => {
      const btn = document.querySelector('[data-testid="player-interactive-btn"]');
      if (btn) btn.click();
    })()`)
    await sleep(800)

    const isInteractiveSidebarOpen = await cdp.eval(`Boolean(document.querySelector('[data-testid="player-interactive-sidebar"]'))`)
    console.log('Interactive Sidebar opened directly on Premium tier:', isInteractiveSidebarOpen)
    if (!isInteractiveSidebarOpen) {
      throw new Error('Premium tier user should be able to open Interactive Television directly')
    }
    console.log('✅ Premium interactive feature unlocked!')

    // Exit player
    await cdp.eval(`(() => {
      const exitBtn = document.querySelector('button[title="Exit Player (Esc)"]');
      if (exitBtn) exitBtn.click();
    })()`)
    await sleep(1000)

    console.log('\n--- Test 8: Cancellation & Downgrade on Membership Page ---')
    // Navigate to Membership page
    await cdp.eval(`(() => {
      const navButtons = Array.from(document.querySelectorAll('nav button'));
      const memBtn = navButtons.find(b => b.textContent.includes('Membership'));
      if (memBtn) memBtn.click();
    })()`)
    await sleep(1500)

    // Check cancellation button
    const hasCancelBtn = await cdp.eval(`Boolean(document.querySelector('[data-testid="cancel-subscription-btn"]'))`)
    console.log('Cancel plan button visible:', hasCancelBtn)
    if (!hasCancelBtn) throw new Error('Expected cancel plan button for paid subscriber')

    await cdp.eval(`(() => {
      const btn = document.querySelector('[data-testid="cancel-subscription-btn"]');
      if (btn) btn.click();
    })()`)
    await sleep(800)

    const isCancelled = await cdp.eval(`(() => {
      const panel = document.querySelector('[data-testid="active-subscription-panel"]');
      return panel ? panel.textContent.includes('Cancellation Pending') : false;
    })()`)
    console.log('Subscription panel shows Cancellation Pending:', isCancelled)
    if (!isCancelled) throw new Error('Subscription status should show Cancellation Pending')

    // Click Downgrade to Free
    await cdp.eval(`(() => {
      const btn = document.querySelector('[data-testid="plan-action-btn-free"]');
      if (btn) btn.click();
    })()`)
    await sleep(800)

    await cdp.eval(`(() => {
      const btn = document.querySelector('[data-testid="confirm-plan-change-btn"]');
      if (btn) btn.click();
    })()`)
    await sleep(800)

    const navBadgeFinal = await cdp.eval(`(() => {
      const el = document.querySelector('[data-testid="nav-subscription-badge"]');
      return el ? el.textContent.trim() : null;
    })()`)
    console.log('Nav Badge after downgrade to Free:', navBadgeFinal)
    if (!navBadgeFinal || !navBadgeFinal.includes('FREE')) {
      throw new Error(`Expected FREE in nav badge after downgrade, got: ${navBadgeFinal}`)
    }

    // Take screenshot
    const screenshot = await cdp.send('Page.captureScreenshot')
    fs.writeFileSync('scratch/phase_6b_membership.png', Buffer.from(screenshot.data, 'base64'))
    console.log('Saved screenshot: scratch/phase_6b_membership.png')

    console.log('\n🎉 ALL PHASE 6B SVOD SUBSCRIPTION & MEMBERSHIP TESTS PASSED! 🎉\n')
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
