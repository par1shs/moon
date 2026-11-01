import { spawn } from 'node:child_process'
import http from 'node:http'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = 9222
const APP_URL = 'http://localhost:5174'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          reject(e)
        }
      })
    }).on('error', reject)
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
      throw new Error(res.exceptionDetails.text || JSON.stringify(res.exceptionDetails))
    }
    return res.result?.value
  }

  close() {
    this.ws.close()
  }
}

async function main() {
  console.log('🚀 Starting Chrome in headless mode for verification...')
  const chromeProcess = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + process.env.TEMP + '\\chrome_test_profile_' + Date.now(),
    APP_URL,
  ], { detached: false })

  await sleep(1500)

  try {
    const versionInfo = await fetchJson(`http://127.0.0.1:${PORT}/json/version`)
    console.log('✔ Chrome DevTools Protocol ready:', versionInfo['Browser'])

    const tabs = await fetchJson(`http://127.0.0.1:${PORT}/json/list`)
    const pageTabs = tabs.filter((t) => t.type === 'page' || (!t.url.startsWith('chrome-extension://') && !t.url.startsWith('chrome://')))
    const tab = pageTabs.find((t) => t.url.includes('5174') || t.title.includes('JUNCTION')) || pageTabs[0] || tabs[0]
    console.log('Selected browser tab:', tab.url, tab.title)
    const cdp = new CDPClient(tab.webSocketDebuggerUrl)
    await cdp.ready()
    await cdp.send('Page.enable')
    await cdp.send('Runtime.enable')

    console.log(`🌐 Navigating to ${APP_URL}...`)
    await cdp.send('Page.navigate', { url: APP_URL })
    await sleep(2000)

    // 1. Verify CSS Tokens on :root and Body
    console.log('\n--- TEST 1: CSS Design Tokens & Base Background ---')
    const tokens = await cdp.eval(`(() => {
      const cs = getComputedStyle(document.documentElement);
      const bodyCs = getComputedStyle(document.body);
      return {
        brandFoundation: cs.getPropertyValue('--brand-foundation').trim(),
        brandMidnight: cs.getPropertyValue('--brand-midnight').trim(),
        brandIndigo: cs.getPropertyValue('--brand-indigo').trim(),
        bgMain: cs.getPropertyValue('--bg-main').trim(),
        bgSecondary: cs.getPropertyValue('--bg-secondary').trim(),
        bgCard: cs.getPropertyValue('--bg-card').trim(),
        bgElevated: cs.getPropertyValue('--bg-elevated').trim(),
        bgNav: cs.getPropertyValue('--bg-nav').trim(),
        gradientBrandBase: cs.getPropertyValue('--gradient-brand-base').trim(),
        gradientBrandPlayer: cs.getPropertyValue('--gradient-brand-player').trim(),
        bodyBgColor: bodyCs.backgroundColor,
        bodyBgAttachment: bodyCs.backgroundAttachment,
        bodyBgImage: bodyCs.backgroundImage,
      };
    })()`)

    console.log('Token check results:', JSON.stringify(tokens, null, 2))
    if (tokens.brandFoundation !== '#0C0D0F') throw new Error(`Unexpected foundation: ${tokens.brandFoundation}`)
    if (tokens.brandMidnight !== '#10131D') throw new Error(`Unexpected midnight: ${tokens.brandMidnight}`)
    if (tokens.brandIndigo !== '#242B40') throw new Error(`Unexpected indigo: ${tokens.brandIndigo}`)
    if (tokens.bgCard !== '#141824') throw new Error(`Unexpected bgCard: ${tokens.bgCard}`)
    if (tokens.bgElevated !== '#1B2130') throw new Error(`Unexpected bgElevated: ${tokens.bgElevated}`)
    if (!tokens.bodyBgAttachment.includes('fixed')) throw new Error(`Body bg attachment is not fixed: ${tokens.bodyBgAttachment}`)
    console.log('✔ TEST 1 PASSED: Brand primary tokens and layered fixed body gradient are active!')

    // 2. Profile Switching & Dynamic Accent Isolation
    console.log('\n--- TEST 2: Profile Accent Isolation & Brand Stability ---')
    const profileAccents = await cdp.eval(`(() => {
      const stored = localStorage.getItem('junction_profiles_v1');
      if (!stored) return null;
      const profiles = JSON.parse(stored);
      return profiles.map(p => ({ id: p.id, name: p.name, primary: p.themePalette?.primary }));
    })()`)
    console.log('Found default profile themes:', profileAccents)

    // Clear active profile to test ProfileSelectionScreen
    await cdp.eval(`(() => {
      sessionStorage.removeItem('junction_in_streaming');
      localStorage.removeItem('junction_active_profile_v1');
      window.location.reload();
    })()`)
    await sleep(1500)

    const isProfileScreenVisible = await cdp.eval(`Boolean(document.querySelector('h1')?.textContent?.includes("Who's watching"))`)
    console.log("Profile selection screen visible:", isProfileScreenVisible)

    // Select Aarav
    console.log("Selecting Aarav's profile...")
    await cdp.eval(`(() => {
      const el = document.querySelector('[role="button"][aria-label*="Aarav"]') ||
                 Array.from(document.querySelectorAll('*')).find(el => el.textContent === 'Aarav');
      if (el) el.click();
    })()`)
    await sleep(800)

    let currentAccent = await cdp.eval(`getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim()`)
    let currentBrand = await cdp.eval(`getComputedStyle(document.documentElement).getPropertyValue('--brand-midnight').trim()`)
    console.log(`Aarav active: accent = ${currentAccent}, brandMidnight = ${currentBrand}`)
    if (currentAccent !== '#C98769') throw new Error(`Expected Aarav accent #C98769, got ${currentAccent}`)
    if (currentBrand !== '#10131D') throw new Error(`Brand changed unexpectedly! Got ${currentBrand}`)

    // Enter streaming
    await cdp.eval(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const startBtn = btns.find(b => b.textContent && (b.textContent.includes('Enter JUNCTION+') || b.textContent.includes('Enter')));
      if (startBtn) startBtn.click();
    })()`)
    await sleep(1500) // Wait for transition

    // Check homepage has loaded
    let inHomepage = await cdp.eval(`Boolean(document.querySelector('header'))`)
    console.log('Homepage loaded:', inHomepage)

    // Test Mira profile switch from ProfileMenu
    console.log("Testing switch to Mira's profile...")
    await cdp.eval(`(() => {
      // Find profile menu toggle
      const toggle = document.querySelector('header button[aria-label^="Profile menu"]');
      if (toggle) toggle.click();
    })()`)
    await sleep(400)

    // Click Switch Profile in dropdown
    await cdp.eval(`(() => {
      const btns = Array.from(document.querySelectorAll('div[role="menu"] button'));
      const switchBtn = btns.find(b => b.textContent && b.textContent.includes('Switch Profile'));
      if (switchBtn) switchBtn.click();
    })()`)
    await sleep(1000)

    // Select Mira
    await cdp.eval(`(() => {
      const el = document.querySelector('[role="button"][aria-label*="Mira"]') ||
                 Array.from(document.querySelectorAll('*')).find(el => el.textContent === 'Mira');
      if (el) el.click();
    })()`)
    await sleep(800)

    currentAccent = await cdp.eval(`getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim()`)
    currentBrand = await cdp.eval(`getComputedStyle(document.documentElement).getPropertyValue('--brand-midnight').trim()`)
    console.log(`Mira active: accent = ${currentAccent}, brandMidnight = ${currentBrand}`)
    if (currentAccent !== '#D99B52') throw new Error(`Expected Mira accent #D99B52, got ${currentAccent}`)
    if (currentBrand !== '#10131D') throw new Error(`Brand changed unexpectedly! Got ${currentBrand}`)

    // 3. Test Refresh Persistence
    console.log('\n--- TEST 3: Refresh Persistence ---')
    await cdp.eval(`window.location.reload()`)
    await sleep(1500)

    const persistedAccent = await cdp.eval(`getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim()`)
    const persistedActiveId = await cdp.eval(`localStorage.getItem('junction_active_profile_v1')`)
    console.log(`After refresh: activeId = ${persistedActiveId}, accent = ${persistedAccent}`)
    if (persistedAccent !== '#D99B52') throw new Error(`Accent did not persist after refresh! Got ${persistedAccent}`)
    console.log('✔ TEST 3 PASSED: Dynamic accent and active profile persisted after refresh!')

    // Click Enter JUNCTION+ to go from Welcome screen to homepage
    await cdp.eval(`(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Enter'));
      if (btn) btn.click();
    })()`)
    await sleep(1500)

    // 4. Test Content Details Modal & Simulated Player Background
    console.log('\n--- TEST 4: Content Details & Simulated Player Brand Gradients ---')
    // Click "More Info" on hero banner
    console.log('Opening ContentDetailsModal from Hero...')
    await cdp.eval(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const infoBtn = btns.find(b => b.textContent && b.textContent.includes('More Info'));
      if (infoBtn) infoBtn.click();
    })()`)
    await sleep(600)

    const modalVisible = await cdp.eval(`Boolean(document.querySelector('div[role="dialog"]'))`)
    console.log('Details modal visible:', modalVisible)
    if (!modalVisible) throw new Error('Details modal failed to open')

    // Click "Play Now" inside details modal to open SimulatedPlayerModal
    console.log('Launching Simulated Player from Details Modal...')
    await cdp.eval(`(() => {
      const btns = Array.from(document.querySelectorAll('div[role="dialog"] button'));
      const playBtn = btns.find(b => b.textContent && b.textContent.includes('Play Now'));
      if (playBtn) playBtn.click();
    })()`)
    await sleep(800)

    const playerRegion = await cdp.eval(`(() => {
      const el = document.querySelector('div[role="region"][aria-label^="Video player"]');
      if (!el) return null;
      const cs = getComputedStyle(el);
      return {
        bgColor: cs.backgroundColor,
        color: cs.color,
        hasAtmosphericBg: Boolean(el.querySelector('div[style*="gradient-brand-player"]')),
        hasDynamicAccentGlow: Boolean(el.querySelector('div[style*="accent-glow"]')),
      };
    })()`)
    console.log('Player styles & layers check:', JSON.stringify(playerRegion, null, 2))
    if (!playerRegion) throw new Error('Player modal not opened')
    if (!playerRegion.hasAtmosphericBg) throw new Error('Player missing permanent atmospheric brand gradient')
    if (!playerRegion.hasDynamicAccentGlow) throw new Error('Player missing dynamic accent glow')
    console.log('✔ TEST 4 PASSED: Player correctly incorporates permanent brand primary gradient and dynamic profile accent glow!')

    // Close player
    await cdp.eval(`(() => {
      const backBtn = document.querySelector('button[aria-label="Back to content library"]');
      if (backBtn) backBtn.click();
    })()`)
    await sleep(500)

    // Close details modal
    await cdp.eval(`(() => {
      const closeBtn = document.querySelector('button[aria-label="Close details"]');
      if (closeBtn) closeBtn.click();
    })()`)
    await sleep(500)

    // 5. Responsive Check
    console.log('\n--- TEST 5: Responsive Mobile View (375x812) ---')
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
    })
    await sleep(500)

    const mobileNavBg = await cdp.eval(`(() => {
      const nav = document.querySelector('nav[aria-label="Mobile Navigation"]');
      if (!nav) return null;
      return getComputedStyle(nav).backgroundColor;
    })()`)
    console.log('Mobile navigation background color:', mobileNavBg)
    if (!mobileNavBg) throw new Error('Mobile bottom nav not found')
    console.log('✔ TEST 5 PASSED: Mobile navigation surfaces rendered properly!')

    console.log('\n========================================')
    console.log('🎉 ALL BRAND VISUAL REFINEMENT TESTS PASSED!')
    console.log('========================================\n')

    cdp.close()
  } catch (err) {
    console.error('❌ Verification failed:', err)
    process.exitCode = 1
  } finally {
    try {
      chromeProcess.kill()
    } catch {}
  }
}

main()
