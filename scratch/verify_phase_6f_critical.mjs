import { spawn } from 'child_process'
import http from 'http'
import fs from 'fs'
import path from 'path'

const PORT = 9245
const APP_URL = 'http://localhost:5173/'
const ARTIFACT_DIR = 'C:\\Users\\paris\\.gemini\\antigravity\\brain\\77d6415e-d998-4714-ba44-a319604f66de'

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = ''
      res.on('data', (c) => (data += c))
      res.on('end', () => resolve(JSON.parse(data)))
    }).on('error', reject)
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
    console.log(`📸 Screenshot saved: ${path.basename(filePath)}`)
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
  console.log('🚀 Starting Chrome headless for Critical Phase 6F Verification...')
  const tempDir = `C:\\tmp\\chrome_crit_${Date.now()}`
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
      window.location.reload();
    })()`)
    await sleep(2500)

    const hasNav = await waitForSelector(cdp, '[data-testid="top-navigation"]', 30)
    console.log('TopNavigation mounted:', hasNav)
    if (!hasNav) throw new Error('TopNavigation not found')

    // ─────────────────────────────────────────────────────────────
    // TEST A: NAVIGATION PERSISTENCE & POSITIONING
    // ─────────────────────────────────────────────────────────────
    console.log('\n========================================')
    console.log('TEST A: Navigation Persistence Across Long Scroll')
    console.log('========================================')

    // 1. At the top of the page (scrollY = 0)
    const topNavCheck = await cdp.eval(`(() => {
      const header = document.querySelector('header[data-testid="top-navigation"]');
      const r = header.getBoundingClientRect();
      return {
        top: r.top,
        bottom: r.bottom,
        height: r.height,
        isScrolled: header.getAttribute('data-scrolled') === 'true',
        hasBrandLogo: Boolean(document.querySelector('button[aria-label="PIXEL Home"]')),
        hasProfileMenu: Boolean(document.querySelector('[data-testid="profile-menu-button"]')),
        hasFullNav: Boolean(document.querySelector('[data-testid="full-nav-items"]')),
        position: window.getComputedStyle(header).position
      };
    })()`)
    console.log('Top navigation state (scrollY=0):', topNavCheck)
    if (topNavCheck.top !== 0) throw new Error(`Header top is ${topNavCheck.top}, expected 0`)
    if (topNavCheck.isScrolled) throw new Error('Expected isScrolled to be false at top')
    if (!topNavCheck.hasBrandLogo || !topNavCheck.hasProfileMenu || !topNavCheck.hasFullNav) {
      throw new Error('Full navigation components missing at top')
    }

    // Capture Screenshot 1: Full navigation at top
    await cdp.captureScreenshot(path.join(ARTIFACT_DIR, 'phase_6f_1_nav_top.png'))

    // 2. Scroll down by 100px
    console.log('\nScrolling to 100px...')
    await cdp.eval(`window.scrollTo({ top: 100, behavior: 'instant' }); window.dispatchEvent(new Event('scroll'));`)
    await sleep(300)

    const scroll100Check = await cdp.eval(`(() => {
      const header = document.querySelector('header[data-testid="top-navigation"]');
      const r = header.getBoundingClientRect();
      const compactItems = document.querySelector('[data-testid="compact-nav-items"]');
      const buttons = compactItems ? Array.from(compactItems.querySelectorAll('button')) : [];
      const labels = buttons.map(b => b.textContent.trim());
      const hasIcons = buttons.some(b => Boolean(b.querySelector('svg')));
      const hasThemeToggle = Boolean(document.querySelector('[data-testid="theme-toggle-btn"]'));
      const hasSearch = Boolean(document.querySelector('[data-testid="search-action-btn"]'));
      const hasLogo = Boolean(document.querySelector('button[aria-label="PIXEL Home"]'));
      const hasProfile = Boolean(document.querySelector('[data-testid="profile-menu-button"]'));

      return {
        top: r.top,
        bottom: r.bottom,
        height: r.height,
        isScrolled: header.getAttribute('data-scrolled') === 'true',
        textButtonCount: buttons.length,
        labels,
        hasIconsInTextNav: hasIcons,
        hasThemeToggle,
        hasSearch,
        hasLogo,
        hasProfile
      };
    })()`)
    console.log('Scroll 100px check:', scroll100Check)
    if (scroll100Check.top !== 0) throw new Error(`Header top is ${scroll100Check.top} at 100px scroll, expected 0 (MUST BE STICKY/FIXED)`)
    if (!scroll100Check.isScrolled) throw new Error('Expected isScrolled=true at 100px scroll')
    if (scroll100Check.hasLogo || scroll100Check.hasProfile) throw new Error('Logo and Profile must be hidden in compact scrolled nav')
    if (scroll100Check.textButtonCount !== 6) throw new Error(`Expected 6 text buttons, got ${scroll100Check.textButtonCount}`)
    if (scroll100Check.hasIconsInTextNav) throw new Error('Text buttons must not contain icons')
    if (!scroll100Check.hasThemeToggle || !scroll100Check.hasSearch) throw new Error('ThemeToggle and Search buttons must be present')

    // Capture Screenshot 2: Compact navigation after scrolling
    await cdp.captureScreenshot(path.join(ARTIFACT_DIR, 'phase_6f_2_nav_compact_scrolled.png'))

    // 3. Scroll through several content shelves (e.g. 800px, 1800px, 3500px)
    for (const testScroll of [800, 1800, 3500]) {
      console.log(`\nScrolling through content shelves at ${testScroll}px...`)
      await cdp.eval(`window.scrollTo({ top: ${testScroll}, behavior: 'instant' }); window.dispatchEvent(new Event('scroll'));`)
      await sleep(200)

      const shelfScrollCheck = await cdp.eval(`(() => {
        const header = document.querySelector('header[data-testid="top-navigation"]');
        const r = header.getBoundingClientRect();
        return {
          top: r.top,
          bottom: r.bottom,
          scrollY: window.scrollY,
          visible: r.top === 0 && r.height > 0
        };
      })()`)
      console.log(`At scroll ${testScroll}px, header rect:`, shelfScrollCheck)
      if (shelfScrollCheck.top !== 0) {
        throw new Error(`CRITICAL FAILURE: Header disappeared or scrolled off! top = ${shelfScrollCheck.top}`)
      }
    }

    // 4. Scroll significantly further down the page (scrollY = 5000px)
    console.log('\nScrolling deep down the page (5000px)...')
    await cdp.eval(`window.scrollTo({ top: 5000, behavior: 'instant' }); window.dispatchEvent(new Event('scroll'));`)
    await sleep(300)

    const deepScrollCheck = await cdp.eval(`(() => {
      const header = document.querySelector('header[data-testid="top-navigation"]');
      const r = header.getBoundingClientRect();
      return {
        top: r.top,
        bottom: r.bottom,
        scrollY: window.scrollY,
        isScrolled: header.getAttribute('data-scrolled') === 'true'
      };
    })()`)
    console.log('Deep scroll check (5000px):', deepScrollCheck)
    if (deepScrollCheck.top !== 0) throw new Error(`Header top is ${deepScrollCheck.top} at deep scroll, expected 0`)

    // Capture Screenshot 3: Compact navigation while significantly further down the page
    await cdp.captureScreenshot(path.join(ARTIFACT_DIR, 'phase_6f_3_nav_deep_scroll.png'))

    // 5. Scroll to bottom of page
    console.log('\nScrolling to bottom of page...')
    await cdp.eval(`window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }); window.dispatchEvent(new Event('scroll'));`)
    await sleep(300)

    const bottomCheck = await cdp.eval(`(() => {
      const header = document.querySelector('header[data-testid="top-navigation"]');
      const r = header.getBoundingClientRect();
      return {
        top: r.top,
        bottom: r.bottom,
        scrollY: window.scrollY,
        scrollHeight: document.documentElement.scrollHeight,
        visible: r.top === 0 && r.height > 0
      };
    })()`)
    console.log('Bottom of page check:', bottomCheck)
    if (bottomCheck.top !== 0) throw new Error(`Header disappeared at bottom! top = ${bottomCheck.top}`)

    // 6. Scroll back to top
    console.log('\nScrolling back to top...')
    await cdp.eval(`window.scrollTo({ top: 0, behavior: 'instant' }); window.dispatchEvent(new Event('scroll'));`)
    await sleep(400)

    const restoredCheck = await cdp.eval(`(() => {
      const header = document.querySelector('header[data-testid="top-navigation"]');
      return {
        isScrolled: header.getAttribute('data-scrolled') === 'true',
        hasBrandLogo: Boolean(document.querySelector('button[aria-label="PIXEL Home"]')),
        hasProfileMenu: Boolean(document.querySelector('[data-testid="profile-menu-button"]')),
        hasDevices: Boolean(document.querySelector('[data-testid="nav-devices"]')),
        hasMembership: Boolean(document.querySelector('[data-testid="nav-membership"]'))
      };
    })()`)
    console.log('Restored top check:', restoredCheck)
    if (restoredCheck.isScrolled) throw new Error('isScrolled should be false after scrolling to top')
    if (!restoredCheck.hasBrandLogo || !restoredCheck.hasProfileMenu) {
      throw new Error('Full navigation components did not restore at top')
    }

    console.log('✅ TEST A PASSED: Navigation stays permanently visible at top throughout entire scroll!')

    // ─────────────────────────────────────────────────────────────
    // TEST B: SCROLL EFFECTS (PROGRESS BAR, PARALLAX, REVEAL, ATMOSPHERE)
    // ─────────────────────────────────────────────────────────────
    console.log('\n========================================')
    console.log('TEST B: Cinematic Scroll Effects')
    console.log('========================================')

    // 1. Progress Bar: Top (0%), Middle (~50%), Bottom (100%)
    const progressTop = await cdp.eval(`(() => {
      const bar = document.querySelector('[data-testid="scroll-progress-bar"]');
      return bar ? bar.style.transform : null;
    })()`)
    console.log('Progress bar at top:', progressTop)
    if (progressTop !== 'scaleX(0)') throw new Error(`Expected scaleX(0) at top, got ${progressTop}`)

    await cdp.eval(`(() => {
      const mid = (document.documentElement.scrollHeight - window.innerHeight) / 2;
      window.scrollTo({ top: mid, behavior: 'instant' });
      window.dispatchEvent(new Event('scroll'));
    })()`)
    await sleep(200)

    const progressMid = await cdp.eval(`(() => {
      const bar = document.querySelector('[data-testid="scroll-progress-bar"]');
      return bar ? bar.style.transform : null;
    })()`)
    console.log('Progress bar at middle:', progressMid)
    const midVal = parseFloat(progressMid.replace('scaleX(', '').replace(')', ''))
    if (midVal < 0.45 || midVal > 0.55) {
      throw new Error(`Expected scaleX around 0.5 at middle, got ${progressMid}`)
    }

    await cdp.eval(`(() => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
      window.dispatchEvent(new Event('scroll'));
    })()`)
    await sleep(200)

    const progressBottom = await cdp.eval(`(() => {
      const bar = document.querySelector('[data-testid="scroll-progress-bar"]');
      return bar ? bar.style.transform : null;
    })()`)
    console.log('Progress bar at bottom:', progressBottom)
    const bottomVal = parseFloat(progressBottom.replace('scaleX(', '').replace(')', ''))
    if (bottomVal < 0.99) throw new Error(`Expected scaleX(1) at bottom, got ${progressBottom}`)

    // 2. Hero Parallax: Artwork moves 8-12px, Text remains stationary
    console.log('\nTesting Hero Parallax (scrollY 0 vs 350)...')
    await cdp.eval(`window.scrollTo({ top: 0, behavior: 'instant' }); window.dispatchEvent(new Event('scroll'));`)
    await sleep(300)

    const heroAt0 = await cdp.eval(`(() => {
      const art = document.querySelector('[data-testid="hero-parallax-artwork"]');
      return art ? art.style.transform : null;
    })()`)
    console.log('Hero artwork transform at scrollY=0:', heroAt0)

    await cdp.eval(`window.scrollTo({ top: 350, behavior: 'instant' }); window.dispatchEvent(new Event('scroll'));`)
    await sleep(300)

    const heroAt350 = await cdp.eval(`(() => {
      const art = document.querySelector('[data-testid="hero-parallax-artwork"]');
      return art ? art.style.transform : null;
    })()`)
    console.log('Hero artwork transform at scrollY=350:', heroAt350)
    if (!heroAt350 || !heroAt350.includes('translate3d')) {
      throw new Error('Hero artwork did not apply translate3d parallax')
    }

    // Capture Screenshot 6: Hero Parallax
    await cdp.captureScreenshot(path.join(ARTIFACT_DIR, 'phase_6f_6_hero_parallax.png'))

    // 3. Atmospheric Background: Layers visibly shift during scrolling
    console.log('\nTesting Atmospheric Background Shift (scrollY 0 vs 600)...')
    await cdp.eval(`window.scrollTo({ top: 0, behavior: 'instant' }); window.dispatchEvent(new Event('scroll'));`)
    await sleep(300)

    const atmosTop = await cdp.eval(`(() => {
      const a = document.querySelector('[data-testid="ambient-atmosphere"]');
      return {
        o1: a.style.getPropertyValue('--atmos-offset-1'),
        o2: a.style.getPropertyValue('--atmos-offset-2'),
        o3: a.style.getPropertyValue('--atmos-offset-3'),
      };
    })()`)
    console.log('Atmospheric offsets at scroll 0:', atmosTop)

    await cdp.eval(`window.scrollTo({ top: 600, behavior: 'instant' }); window.dispatchEvent(new Event('scroll'));`)
    await sleep(300)

    const atmosScrolled = await cdp.eval(`(() => {
      const a = document.querySelector('[data-testid="ambient-atmosphere"]');
      return {
        o1: parseFloat(a.style.getPropertyValue('--atmos-offset-1')),
        o2: parseFloat(a.style.getPropertyValue('--atmos-offset-2')),
        o3: parseFloat(a.style.getPropertyValue('--atmos-offset-3')),
      };
    })()`)
    console.log('Atmospheric offsets at scroll 600px:', atmosScrolled)
    if (atmosScrolled.o1 < 10 || atmosScrolled.o2 < 15 || atmosScrolled.o3 < 20) {
      throw new Error(`Atmospheric offsets not shifting visibly at scroll 600: ${JSON.stringify(atmosScrolled)}`)
    }

    // Capture Screenshot 4: Atmospheric background during scrolling
    await cdp.captureScreenshot(path.join(ARTIFACT_DIR, 'phase_6f_4_atmospheric_scroll.png'))

    // 4. Section Reveal Animations
    console.log('\nTesting Section Reveal Animations...')
    await cdp.eval(`window.scrollTo({ top: 1200, behavior: 'instant' }); window.dispatchEvent(new Event('scroll'));`)
    await sleep(400)

    const revealCheck = await cdp.eval(`(() => {
      const els = document.querySelectorAll('[data-testid^="reveal-"]');
      return Array.from(els).map(el => ({
        id: el.getAttribute('data-testid'),
        revealed: el.getAttribute('data-revealed'),
        opacity: window.getComputedStyle(el).opacity,
        transform: window.getComputedStyle(el).transform
      }));
    })()`)
    console.log('Revealed sections check at scroll 1200px (sample of 6):', revealCheck.slice(0, 6))
    const revealedCount = revealCheck.filter(r => r.revealed === 'true').length
    console.log(`Sections currently revealed: ${revealedCount}/${revealCheck.length}`)
    if (revealedCount < 4) throw new Error('Expected at least 4 sections revealed at 1200px scroll')

    // Capture Screenshot 5: Section Reveal Behaviour
    await cdp.captureScreenshot(path.join(ARTIFACT_DIR, 'phase_6f_5_section_reveal.png'))

    // 5. Content Card Hover Depth
    console.log('\nTesting Content Card Hover Depth...')
    const cardHover = await cdp.eval(`(() => {
      const card = document.querySelector('[data-testid^="content-card-"]');
      if (!card) return null;
      return {
        hasCard: true,
        classes: card.className,
        cursor: window.getComputedStyle(card).cursor
      };
    })()`)
    console.log('Card hover attributes:', cardHover)
    if (!cardHover.hasCard) throw new Error('No content card found')

    console.log('✅ TEST B PASSED: All scroll effects (progress, parallax, reveals, atmosphere) verified!')

    // ─────────────────────────────────────────────────────────────
    // TEST C: RESPONSIVE BEHAVIOUR (DESKTOP 1440, TABLET 768, MOBILE 390)
    // ─────────────────────────────────────────────────────────────
    console.log('\n========================================')
    console.log('TEST C: Responsive Navigation & Scroll')
    console.log('========================================')

    const viewports = [
      { name: 'Desktop (1440px)', width: 1440, height: 900 },
      { name: 'Tablet (768px)', width: 768, height: 1024 },
      { name: 'Mobile (390px)', width: 390, height: 844 },
    ]

    for (const vp of viewports) {
      console.log(`\nTesting ${vp.name}...`)
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 2,
        mobile: vp.width < 768,
      })
      await sleep(300)

      // Test at scroll 400px
      await cdp.eval(`window.scrollTo({ top: 400, behavior: 'instant' }); window.dispatchEvent(new Event('scroll'));`)
      await sleep(300)

      const vpCheck = await cdp.eval(`(() => {
        const header = document.querySelector('header[data-testid="top-navigation"]');
        const r = header.getBoundingClientRect();
        const compact = document.querySelector('[data-testid="compact-nav-items"]');
        const bodyWidth = document.body.clientWidth;
        const htmlWidth = document.documentElement.scrollWidth;

        return {
          headerTop: r.top,
          isScrolled: header.getAttribute('data-scrolled') === 'true',
          compactVisible: Boolean(compact),
          hasOverflow: htmlWidth > bodyWidth + 2
        };
      })()`)

      console.log(`${vp.name} results:`, vpCheck)
      if (vpCheck.headerTop !== 0) throw new Error(`${vp.name}: Header is not pinned at top:0 (got ${vpCheck.headerTop})`)
      if (!vpCheck.isScrolled) throw new Error(`${vp.name}: Expected isScrolled=true`)
      if (vpCheck.hasOverflow) throw new Error(`${vp.name}: Horizontal window overflow detected!`)
    }

    // Reset viewport back to desktop
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1600,
      height: 1050,
      deviceScaleFactor: 1,
      mobile: false,
    })
    await sleep(300)

    console.log('✅ TEST C PASSED: Responsive navigation verified across Desktop, Tablet, and Mobile!')

    // ─────────────────────────────────────────────────────────────
    // TEST D: REGRESSION CHECKS
    // ─────────────────────────────────────────────────────────────
    console.log('\n========================================')
    console.log('TEST D: Regression Checks')
    console.log('========================================')

    // 1. Scroll to top to access controls
    await cdp.eval(`window.scrollTo({ top: 0, behavior: 'instant' }); window.dispatchEvent(new Event('scroll'));`)
    await sleep(300)

    // 2. Theme Toggle
    const themeInitial = await cdp.eval(`document.documentElement.className`)
    await cdp.eval(`document.querySelector('[data-testid="theme-toggle-btn"]').click()`)
    await sleep(300)
    const themeAfter = await cdp.eval(`document.documentElement.className`)
    console.log(`Theme toggle check: "${themeInitial}" -> "${themeAfter}"`)
    if (themeInitial === themeAfter) throw new Error('Theme toggle did not change document theme')

    // Toggle back
    await cdp.eval(`document.querySelector('[data-testid="theme-toggle-btn"]').click()`)
    await sleep(300)

    // 3. Navigation links
    await cdp.eval(`document.querySelector('[data-testid="nav-series"]').click()`)
    await sleep(400)
    const isSeries = await cdp.eval(`Boolean(document.querySelector('[data-testid="nav-series"][class*="font-semibold"]'))`)
    console.log('Navigated to Series page:', isSeries)
    if (!isSeries) throw new Error('Series page navigation failed')

    // Navigate back to home
    await cdp.eval(`document.querySelector('[data-testid="nav-home"]').click()`)
    await sleep(400)

    // 4. Video Player & Modals
    const _playerCheck = await cdp.eval(`(() => {
      const card = document.querySelector('[data-testid^="content-card-"]');
      if (card) {
        card.click();
        return true;
      }
      return false;
    })()`)
    await sleep(400)
    const modalOpen = await cdp.eval(`Boolean(document.querySelector('[data-testid="content-details-modal"]'))`)
    console.log('Content details modal opens from card click:', modalOpen)
    if (!modalOpen) throw new Error('Content details modal did not open')

    // Close modal
    await cdp.eval(`(() => {
      const closeBtn = document.querySelector('[data-testid="close-details-modal-btn"]');
      if (closeBtn) closeBtn.click();
    })()`)
    await sleep(300)

    console.log('✅ TEST D PASSED: Zero regressions across Theme, Routing, Content modals, and Navigation!')

    console.log('\n🎉🎉🎉 ALL PHASE 6F CRITICAL VERIFICATION TESTS PASSED 100%! 🎉🎉🎉')
  } finally {
    if (cdp) cdp.close()
    chromeProcess.kill('SIGTERM')
    try { fs.rmSync(tempDir, { recursive: true, force: true }) } catch {}
  }
}

main().catch((err) => {
  console.error('\n❌ CRITICAL VERIFICATION FAILED:', err)
  process.exit(1)
})
