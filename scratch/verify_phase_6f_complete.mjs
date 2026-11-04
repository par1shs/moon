import { spawn } from 'child_process'
import http from 'http'
import fs from 'fs'
import path from 'path'

const PORT = 9235
const APP_URL = 'http://localhost:5173/'
const ARTIFACT_DIR = 'C:\\Users\\paris\\.gemini\\antigravity\\brain\\77d6415e-d998-4714-ba44-a319604f66de'

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

  async captureScreenshot(filePath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'))
    console.log(`📸 Screenshot saved: ${filePath}`)
  }

  close() {
    this.ws?.close()
  }
}

async function waitForSelector(cdp, selector, maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    const found = await cdp.eval(`Boolean(document.querySelector('${selector}'))`)
    if (found) return true
    await sleep(200)
  }
  return false
}

async function main() {
  console.log('🚀 Launching headless Chrome for Phase 6F Verification...')
  const tempDir = `C:\\tmp\\chrome_test_profile_6f_comp_${Date.now()}`
  fs.mkdirSync(tempDir, { recursive: true })

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  const chromeProcess = spawn(
    chromePath,
    [
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${tempDir}`,
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--window-size=1600,1050',
      APP_URL,
    ],
    { stdio: 'ignore' }
  )

  let cdp = null

  try {
    let targets = null
    for (let i = 0; i < 30; i++) {
      try {
        targets = await fetchJson(`http://127.0.0.1:${PORT}/json`)
        if (targets && targets.length > 0) break
      } catch {
        await sleep(200)
      }
    }

    if (!targets || targets.length === 0) {
      throw new Error('Failed to connect to headless Chrome.')
    }

    const pageTarget = targets.find((t) => t.type === 'page') || targets[0]
    cdp = new CDPClient(pageTarget.webSocketDebuggerUrl)
    await cdp.ready()
    await cdp.send('Page.enable')
    await cdp.send('DOM.enable')
    await cdp.send('Runtime.enable')

    console.log('🌐 Connected. Navigating to app:', APP_URL)
    await cdp.send('Page.navigate', { url: APP_URL })
    await sleep(2000)

    console.log('Initializing streaming session for Aarav...')
    await cdp.eval(`(() => {
      sessionStorage.setItem('junction_startup_seen', 'true');
      sessionStorage.setItem('junction_in_streaming', 'true');
      localStorage.setItem('junction_active_profile_v1', 'profile-aarav');
      localStorage.setItem('junction_cinema_cursor_v1', 'true');
      window.location.reload();
    })()`)
    await sleep(2200)

    const hasNav = await waitForSelector(cdp, '[data-testid="top-navigation"]', 30)
    console.log('TopNavigation mounted:', hasNav)
    if (!hasNav) throw new Error('TopNavigation not found')

    // ─────────────────────────────────────────────────────────────
    // TEST 1: TOP OF PAGE STATE (window.scrollY === 0)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 1: Top of Page Full Navigation State ---')
    const topState = await cdp.eval(`(() => {
      const nav = document.querySelector('[data-testid="top-navigation"]');
      const isScrolled = nav.getAttribute('data-scrolled') === 'true';
      const hasFullNav = Boolean(document.querySelector('[data-testid="full-nav-items"]'));
      const hasBrandLogo = Boolean(document.querySelector('button[aria-label="PIXEL Home"]'));
      const hasProfileMenu = Boolean(document.querySelector('[data-testid="profile-menu-button"]'));
      const hasSearch = Boolean(document.querySelector('[data-testid="search-action-btn"]'));
      const hasThemeToggle = Boolean(document.querySelector('[data-testid="theme-toggle-btn"]'));
      const hasDevices = Boolean(document.querySelector('[data-testid="nav-devices"]'));
      const hasMembership = Boolean(document.querySelector('[data-testid="nav-membership"]'));

      return {
        isScrolled,
        hasFullNav,
        hasBrandLogo,
        hasProfileMenu,
        hasSearch,
        hasThemeToggle,
        hasDevices,
        hasMembership,
        classes: nav.className
      };
    })()`)

    console.log('Top state checks:', topState)
    if (topState.isScrolled) throw new Error('Expected nav to NOT be scrolled at top')
    if (!topState.hasFullNav) throw new Error('Expected full-nav-items to be visible at top')
    if (!topState.hasBrandLogo) throw new Error('Expected BrandLogo to be visible at top')
    if (!topState.hasProfileMenu) throw new Error('Expected ProfileMenu to be visible at top')
    if (!topState.hasDevices || !topState.hasMembership) throw new Error('Expected Devices and Membership to be present in full nav')

    await cdp.captureScreenshot(path.join(ARTIFACT_DIR, 'phase_6f_nav_top.png'))

    // ─────────────────────────────────────────────────────────────
    // TEST 2: SCROLLED DOWN STATE (Sticky Compact Nav: Exactly 8 Controls)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 2: Scrolled State (Sticky Compact Navigation: Exactly 8 Controls) ---')
    await cdp.eval(`window.scrollTo(0, 450); window.dispatchEvent(new Event('scroll'));`)
    await sleep(400)

    const scrolledState = await cdp.eval(`(() => {
      const nav = document.querySelector('[data-testid="top-navigation"]');
      const isScrolled = nav.getAttribute('data-scrolled') === 'true';
      const hasAtmosphericGradient = nav.classList.contains('nav-scrolled-atmospheric');
      const computed = window.getComputedStyle(nav);

      // Check for elements that MUST be hidden
      const hasBrandLogo = Boolean(document.querySelector('button[aria-label="PIXEL Home"]'));
      const hasProfileMenu = Boolean(document.querySelector('[data-testid="profile-menu-button"]'));
      const hasDevices = Boolean(document.querySelector('[data-testid="nav-devices"]'));
      const hasMembership = Boolean(document.querySelector('[data-testid="nav-membership"]'));

      // Check the EXACT 8 controls
      const compactContainer = document.querySelector('[data-testid="compact-nav-items"]');
      const compactButtons = compactContainer ? Array.from(compactContainer.querySelectorAll('button')) : [];
      const textNavLabels = compactButtons.map(b => b.textContent.trim());

      // Check if text buttons contain any SVG icons (strict requirement: pure text)
      const iconsInTextNav = compactButtons.map(b => Boolean(b.querySelector('svg')));

      const themeToggle = document.querySelector('[data-testid="theme-toggle-btn"]');
      const searchBtn = document.querySelector('[data-testid="search-action-btn"]');

      return {
        isScrolled,
        hasAtmosphericGradient,
        borderBottom: computed.borderBottomWidth,
        borderRadius: computed.borderRadius,
        hasBrandLogo,
        hasProfileMenu,
        hasDevices,
        hasMembership,
        textNavCount: compactButtons.length,
        textNavLabels,
        iconsInTextNav,
        hasThemeToggle: Boolean(themeToggle),
        hasSearch: Boolean(searchBtn)
      };
    })()`)

    console.log('Scrolled state checks:', scrolledState)
    if (!scrolledState.isScrolled) throw new Error('Expected isScrolled to be true')
    if (!scrolledState.hasAtmosphericGradient) throw new Error('Expected nav-scrolled-atmospheric class')
    if (scrolledState.hasBrandLogo) throw new Error('BrandLogo must be hidden in scrolled state')
    if (scrolledState.hasProfileMenu) throw new Error('ProfileMenu must be hidden in scrolled state')
    if (scrolledState.hasDevices || scrolledState.hasMembership) throw new Error('Devices/Membership must be hidden in scrolled compact state')

    // Verify exactly 6 text options + 1 theme toggle + 1 search = 8 controls
    const expectedLabels = ['Home', 'Series', 'Movies', 'Discover', 'Live TV', 'My List']
    if (scrolledState.textNavCount !== 6) {
      throw new Error(`Expected 6 compact text nav buttons, got ${scrolledState.textNavCount}`)
    }
    for (const expected of expectedLabels) {
      if (!scrolledState.textNavLabels.includes(expected)) {
        throw new Error(`Expected compact nav to contain "${expected}", found: ${scrolledState.textNavLabels.join(', ')}`)
      }
    }
    // Verify no icons added inside text nav
    if (scrolledState.iconsInTextNav.some(Boolean)) {
      throw new Error('Icons detected inside text navigation options. Must remain pure text!')
    }
    if (!scrolledState.hasThemeToggle) throw new Error('ThemeToggle (Control 7) is missing')
    if (!scrolledState.hasSearch) throw new Error('Search button (Control 8) is missing')

    console.log('✅ Exactly 8 controls verified in compact scrolled navigation!')

    await cdp.captureScreenshot(path.join(ARTIFACT_DIR, 'phase_6f_nav_scrolled_8controls.png'))

    // ─────────────────────────────────────────────────────────────
    // TEST 3: SCROLL PROGRESS INDICATOR
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 3: Scroll Progress Indicator ---')
    const progressData = await cdp.eval(`(() => {
      const container = document.querySelector('[data-testid="scroll-progress-indicator"]');
      const bar = document.querySelector('[data-testid="scroll-progress-bar"]');
      if (!container || !bar) return null;

      const containerStyle = window.getComputedStyle(container);
      const barStyle = window.getComputedStyle(bar);
      return {
        height: containerStyle.height,
        position: containerStyle.position,
        zIndex: containerStyle.zIndex,
        transform: bar.style.transform,
        bg: barStyle.backgroundColor,
        boxShadow: barStyle.boxShadow
      };
    })()`)

    console.log('Scroll Progress Indicator data:', progressData)
    if (!progressData) throw new Error('scroll-progress-indicator not found')
    if (progressData.height !== '2px') throw new Error(`Expected 2px height, got ${progressData.height}`)
    if (!progressData.transform.includes('scaleX')) throw new Error('Expected transform scaleX')

    // ─────────────────────────────────────────────────────────────
    // TEST 4: SCROLL-REACTIVE ATMOSPHERIC BACKGROUND & GRAIN OVERLAY
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 4: Atmospheric Background Layers & Film Grain ---')
    const atmosData = await cdp.eval(`(() => {
      const atmos = document.querySelector('[data-testid="ambient-atmosphere"]');
      const grain = document.querySelector('[data-testid="cinematic-grain-overlay"]');
      const l1 = document.querySelector('[data-testid="atmos-layer-1"]');
      const l2 = document.querySelector('[data-testid="atmos-layer-2"]');
      const l3 = document.querySelector('[data-testid="atmos-layer-3"]');
      const pocket = document.querySelector('[data-testid="atmos-static-pocket"]');

      const grainStyle = grain ? window.getComputedStyle(grain) : null;

      return {
        hasAtmos: Boolean(atmos),
        hasGrain: Boolean(grain),
        grainOpacity: grainStyle ? grainStyle.opacity : null,
        grainMixBlend: grainStyle ? grainStyle.mixBlendMode : null,
        hasL1: Boolean(l1),
        hasL2: Boolean(l2),
        hasL3: Boolean(l3),
        hasPocket: Boolean(pocket),
        offset1: atmos.style.getPropertyValue('--atmos-offset-1'),
        offset2: atmos.style.getPropertyValue('--atmos-offset-2'),
        offset3: atmos.style.getPropertyValue('--atmos-offset-3')
      };
    })()`)

    console.log('Atmospheric Background check:', atmosData)
    if (!atmosData.hasAtmos) throw new Error('ambient-atmosphere container missing')
    if (!atmosData.hasGrain) throw new Error('cinematic-grain-overlay missing')
    if (!atmosData.hasL1 || !atmosData.hasL2 || !atmosData.hasL3) throw new Error('3 atmospheric layers missing')
    if (!atmosData.hasPocket) throw new Error('Static atmospheric depth pocket missing')

    // Scroll deeper and verify layers move within 15-30px
    await cdp.eval(`window.scrollTo(0, 1200); window.dispatchEvent(new Event('scroll'));`)
    await sleep(300)

    const deeperAtmos = await cdp.eval(`(() => {
      const atmos = document.querySelector('[data-testid="ambient-atmosphere"]');
      return {
        offset1: parseFloat(atmos.style.getPropertyValue('--atmos-offset-1')),
        offset2: parseFloat(atmos.style.getPropertyValue('--atmos-offset-2')),
        offset3: parseFloat(atmos.style.getPropertyValue('--atmos-offset-3'))
      };
    })()`)

    console.log('Deeper scroll offsets (px):', deeperAtmos)
    if (deeperAtmos.offset1 <= 0 || deeperAtmos.offset1 > 18) {
      throw new Error(`offset1 out of expected range (0-18px): ${deeperAtmos.offset1}`)
    }
    if (deeperAtmos.offset2 <= 0 || deeperAtmos.offset2 > 26) {
      throw new Error(`offset2 out of expected range (0-26px): ${deeperAtmos.offset2}`)
    }
    if (deeperAtmos.offset3 <= 0 || deeperAtmos.offset3 > 32) {
      throw new Error(`offset3 out of expected range (0-32px): ${deeperAtmos.offset3}`)
    }

    // ─────────────────────────────────────────────────────────────
    // TEST 5: SECTION REVEAL ANIMATIONS
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 5: Section Reveal Animations ---')
    const reveals = await cdp.eval(`(() => {
      const els = document.querySelectorAll('[data-testid^="reveal-"]');
      return Array.from(els).map(el => ({
        id: el.getAttribute('data-testid'),
        revealed: el.getAttribute('data-revealed'),
        opacity: window.getComputedStyle(el).opacity
      }));
    })()`)

    console.log(`Found ${reveals.length} reveal wrappers:`, reveals)
    if (reveals.length < 5) throw new Error('Expected at least 5 SectionReveal wrappers on HomePage')
    const revealedCount = reveals.filter(r => r.revealed === 'true').length
    console.log(`Sections currently revealed: ${revealedCount}/${reveals.length}`)
    if (revealedCount < 1) throw new Error('No sections were revealed')

    // ─────────────────────────────────────────────────────────────
    // TEST 6: RESTORE TOP OF PAGE (window.scrollTo(0, 0))
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 6: Scroll Back to Top Restores Full Branded Nav ---')
    await cdp.eval(`window.scrollTo({ top: 0, behavior: 'instant' }); window.dispatchEvent(new Event('scroll'));`)
    await sleep(400)

    const restoredTop = await cdp.eval(`(() => {
      const nav = document.querySelector('[data-testid="top-navigation"]');
      return {
        isScrolled: nav.getAttribute('data-scrolled') === 'true',
        hasBrandLogo: Boolean(document.querySelector('button[aria-label="PIXEL Home"]')),
        hasProfileMenu: Boolean(document.querySelector('[data-testid="profile-menu-button"]')),
        hasDevices: Boolean(document.querySelector('[data-testid="nav-devices"]')),
        hasMembership: Boolean(document.querySelector('[data-testid="nav-membership"]'))
      };
    })()`)

    console.log('Restored top state:', restoredTop)
    if (restoredTop.isScrolled) throw new Error('Nav should not be scrolled after scrollTo(0,0)')
    if (!restoredTop.hasBrandLogo) throw new Error('BrandLogo did not restore')
    if (!restoredTop.hasProfileMenu) throw new Error('ProfileMenu did not restore')
    if (!restoredTop.hasDevices) throw new Error('Devices nav item did not restore')

    // ─────────────────────────────────────────────────────────────
    // TEST 7: RESPONSIVE COMPACT NAVIGATION (Mobile Viewport 390x844)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 7: Responsive Compact Navigation on Mobile Viewport ---')
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    })
    await sleep(300)
    await cdp.eval(`window.scrollTo(0, 350); window.dispatchEvent(new Event('scroll'));`)
    await sleep(400)

    const mobileScrolled = await cdp.eval(`(() => {
      const nav = document.querySelector('[data-testid="top-navigation"]');
      const compact = document.querySelector('[data-testid="compact-nav-items"]');
      const bodyWidth = document.body.clientWidth;
      const htmlWidth = document.documentElement.scrollWidth;

      return {
        isScrolled: nav.getAttribute('data-scrolled') === 'true',
        compactPresent: Boolean(compact),
        hasHorizontalOverflow: htmlWidth > bodyWidth + 2,
        compactScrollWidth: compact ? compact.scrollWidth : 0,
        compactClientWidth: compact ? compact.clientWidth : 0
      };
    })()`)

    console.log('Mobile scrolled navigation checks:', mobileScrolled)
    if (!mobileScrolled.isScrolled) throw new Error('Expected isScrolled on mobile')
    if (!mobileScrolled.compactPresent) throw new Error('Compact nav items not present on mobile scrolled state')
    if (mobileScrolled.hasHorizontalOverflow) throw new Error('Page has horizontal overflow on mobile')

    await cdp.captureScreenshot(path.join(ARTIFACT_DIR, 'phase_6f_nav_mobile_scrolled.png'))

    // Reset viewport back to desktop
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1600,
      height: 1050,
      deviceScaleFactor: 1,
      mobile: false,
    })
    await sleep(300)
    await cdp.eval(`window.scrollTo(0, 600); window.dispatchEvent(new Event('scroll'));`)
    await sleep(300)
    await cdp.captureScreenshot(path.join(ARTIFACT_DIR, 'phase_6f_scroll_atmosphere.png'))

    console.log('\n🎉 ALL PHASE 6F VERIFICATION TESTS PASSED SUCCESSFULLY!')
  } finally {
    if (cdp) cdp.close()
    chromeProcess.kill('SIGTERM')
    try {
      fs.rmSync(tempDir, { recursive: true, force: true })
    } catch {
      // ignore temp dir cleanup errors
    }
  }
}

main().catch((err) => {
  console.error('\n❌ VERIFICATION TEST FAILED:', err)
  process.exit(1)
})
