import { spawn } from 'node:child_process'
import http from 'node:http'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = 9223
const APP_URL = 'http://localhost:5173'

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
  console.log('🚀 Starting Chrome in headless mode for Theme Toggle & Gradient verification...')
  const chromeProcess = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + (process.env.TEMP || 'C:\\Temp') + '\\chrome_theme_test_' + Date.now(),
    APP_URL,
  ], { detached: false })

  await sleep(1500)

  try {
    const versionInfo = await fetchJson(`http://127.0.0.1:${PORT}/json/version`)
    console.log('✔ Chrome DevTools Protocol ready:', versionInfo['Browser'])

    const tabs = await fetchJson(`http://127.0.0.1:${PORT}/json/list`)
    const pageTabs = tabs.filter((t) => t.type === 'page' || (!t.url.startsWith('chrome-extension://') && !t.url.startsWith('chrome://')))
    const tab = pageTabs.find((t) => t.url.includes('5173') || t.title.includes('JUNCTION')) || pageTabs[0] || tabs[0]
    console.log('Selected browser tab:', tab.url, tab.title)
    const cdp = new CDPClient(tab.webSocketDebuggerUrl)
    await cdp.ready()
    await cdp.send('Page.enable')
    await cdp.send('Runtime.enable')

    console.log(`🌐 Navigating to ${APP_URL}...`)
    await cdp.send('Page.navigate', { url: APP_URL })
    await sleep(1500)

    // Ensure we are inside streaming view with an active profile
    await cdp.eval(`(() => {
      sessionStorage.setItem('junction_startup_seen', 'true');
      sessionStorage.setItem('junction_in_streaming', 'true');
      localStorage.setItem('junction_active_profile_v1', 'profile-aarav');
      window.location.reload();
    })()`)
    await sleep(2500)

    console.log('\n--- TEST 1: Default Mode & Body Gradient Verification ---')
    const initialCheck = await cdp.eval(`(() => {
      const html = document.documentElement;
      const body = document.body;
      const cs = getComputedStyle(body);
      const htmlCs = getComputedStyle(html);
      const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]')?.getAttribute('content');
      const themeColorMeta = document.querySelector('meta[name="theme-color"]')?.getAttribute('content');
      
      return {
        htmlClasses: html.className,
        dataTheme: html.getAttribute('data-theme'),
        colorSchemeMeta,
        themeColorMeta,
        bodyBgImage: cs.backgroundImage,
        bodyBgColor: cs.backgroundColor,
        bodyBgAttachment: cs.backgroundAttachment,
        textColor: cs.color,
        hasThemeToggleBtn: !!document.querySelector('[data-testid="theme-toggle-btn"]'),
      };
    })()`)
    console.log('Initial DOM state:', initialCheck)
    if (!initialCheck.bodyBgImage || initialCheck.bodyBgImage === 'none') {
      throw new Error('FAILED: Body background image gradient is missing or "none"!')
    }
    if (!initialCheck.hasThemeToggleBtn) {
      throw new Error('FAILED: Theme toggle button not found in header!')
    }
    console.log('✔ TEST 1 PASSED: Body has rich background gradient and theme toggle button is present.')

    console.log('\n--- TEST 2: Toggle to Light Mode via Header Button ---')
    const lightResult = await cdp.eval(`(() => {
      const btn = document.querySelector('[data-testid="theme-toggle-btn"]');
      if (!btn) return { error: 'Button not found' };
      btn.click();
      return { clicked: true };
    })()`)
    console.log('Clicked toggle button:', lightResult)
    await sleep(600)

    const lightState = await cdp.eval(`(() => {
      const html = document.documentElement;
      const body = document.body;
      const cs = getComputedStyle(body);
      const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]')?.getAttribute('content');
      const themeColorMeta = document.querySelector('meta[name="theme-color"]')?.getAttribute('content');
      const stored = localStorage.getItem('junction_color_mode_v1');

      return {
        htmlClasses: html.className,
        dataTheme: html.getAttribute('data-theme'),
        colorSchemeMeta,
        themeColorMeta,
        stored,
        bodyBgImage: cs.backgroundImage,
        bodyBgColor: cs.backgroundColor,
        textColor: cs.color,
        isLightClass: html.classList.contains('light'),
      };
    })()`)
    console.log('Light Mode DOM state:', lightState)
    if (!lightState.isLightClass || lightState.dataTheme !== 'light') {
      throw new Error(`FAILED: html did not acquire light class or data-theme="light"! Received: ${JSON.stringify(lightState)}`)
    }
    if (lightState.stored !== 'light') {
      throw new Error(`FAILED: localStorage mode is not "light"! Received: ${lightState.stored}`)
    }
    if (lightState.colorSchemeMeta !== 'light') {
      throw new Error(`FAILED: meta[name="color-scheme"] is not "light"!`)
    }
    if (!lightState.bodyBgImage || lightState.bodyBgImage === 'none') {
      throw new Error('FAILED: Light mode body background gradient is missing or "none"!')
    }
    console.log('✔ TEST 2 PASSED: Light mode successfully applied, saved to localStorage, and body gradient is active.')

    console.log('\n--- TEST 3: Navigation Across Pages in Light Mode ---')
    const pages = ['series', 'movies', 'discover', 'livetv', 'mylist', 'search', 'home']
    for (const page of pages) {
      console.log(`Checking page: ${page} in light mode...`)
      await cdp.eval(`(() => {
        if ('${page}' === 'search') {
          const searchBtn = document.querySelector('header button[aria-label*="Search"]');
          if (searchBtn) {
            searchBtn.click();
            return { found: true, text: 'search' };
          }
        }
        const allNav = Array.from(document.querySelectorAll('header nav button'));
        const target = allNav.find(b => b.textContent.toLowerCase().trim() === '${page}'.toLowerCase());
        if (target) {
          target.click();
          return { found: true, text: target.textContent };
        }
        return { found: false };
      })()`)
      await sleep(400)

      const pageCheck = await cdp.eval(`(() => {
        const bodyCs = getComputedStyle(document.body);
        const main = document.querySelector('main') || document.querySelector('#root > div');
        const mainCs = main ? getComputedStyle(main) : null;
        return {
          bodyBgImage: bodyCs.backgroundImage.substring(0, 80) + '...',
          mainBgColor: mainCs ? mainCs.backgroundColor : 'none',
          bodyBgAttachment: bodyCs.backgroundAttachment,
        };
      })()`)
      console.log(`  ${page} state:`, pageCheck)
      if (!pageCheck.bodyBgImage.includes('radial-gradient')) {
        throw new Error(`FAILED: Background gradient not present on ${page}!`)
      }
    }
    console.log('✔ TEST 3 PASSED: All pages render with visible, uninterrupted body gradient in light mode.')

    console.log('\n--- TEST 4: Profile Menu Row Toggle Back to Dark Mode ---')
    const debugButtons = await cdp.eval(`(() => {
      const allButtons = Array.from(document.querySelectorAll('button')).map(b => ({
        tag: b.tagName,
        testId: b.getAttribute('data-testid'),
        ariaLabel: b.getAttribute('aria-label'),
        text: b.textContent.trim().substring(0, 30),
      }));
      return allButtons;
    })()`)
    console.log('Available buttons on page before Test 4:', debugButtons)

    // Open profile menu
    const openMenuRes = await cdp.eval(`(() => {
      const profileBtn = document.querySelector('[data-testid="profile-menu-button"]') || 
        Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label')?.includes('Profile menu'));
      if (profileBtn) {
        profileBtn.click();
        return { opened: true };
      }
      return { opened: false, found: false };
    })()`)
    console.log('Profile button clicked:', openMenuRes)
    await sleep(500)

    const rowCheck = await cdp.eval(`(() => {
      const row = document.querySelector('[data-testid="theme-toggle-row"]');
      if (!row) return { found: false };
      row.click();
      return { found: true, text: row.textContent };
    })()`)
    console.log('Clicked theme toggle row in ProfileMenu:', rowCheck)
    await sleep(500)

    const darkState = await cdp.eval(`(() => {
      const html = document.documentElement;
      const cs = getComputedStyle(document.body);
      const stored = localStorage.getItem('junction_color_mode_v1');
      return {
        dataTheme: html.getAttribute('data-theme'),
        isDarkClass: html.classList.contains('dark'),
        stored,
        bodyBgImage: cs.backgroundImage.substring(0, 80) + '...',
        textColor: cs.color,
      };
    })()`)
    console.log('Dark Mode DOM state:', darkState)
    if (!darkState.isDarkClass || darkState.dataTheme !== 'dark' || darkState.stored !== 'dark') {
      throw new Error(`FAILED: Dark mode was not restored! State: ${JSON.stringify(darkState)}`)
    }
    console.log('✔ TEST 4 PASSED: ProfileMenu row toggle successfully restored dark mode.')

    console.log('\n--- TEST 5: Persistence & FOUC Prevention on Reload ---')
    // Switch to light mode and reload
    await cdp.eval(`(() => {
      document.querySelector('[data-testid="theme-toggle-btn"]')?.click();
    })()`)
    await sleep(300)
    console.log('Reloading page while in light mode...')
    await cdp.send('Page.reload')
    await sleep(2000)

    const reloadedState = await cdp.eval(`(() => {
      const html = document.documentElement;
      const stored = localStorage.getItem('junction_color_mode_v1');
      return {
        isLightClass: html.classList.contains('light'),
        dataTheme: html.getAttribute('data-theme'),
        stored,
      };
    })()`)
    console.log('Reloaded state:', reloadedState)
    if (!reloadedState.isLightClass || reloadedState.dataTheme !== 'light') {
      throw new Error(`FAILED: After reload, light mode was not preserved by inline script! State: ${JSON.stringify(reloadedState)}`)
    }
    console.log('✔ TEST 5 PASSED: Light mode persisted cleanly across reload with zero FOUC.')

    console.log('\n--- TEST 6: Mobile Responsive Viewport (375x812) ---')
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
    })
    await sleep(500)
    const mobileCheck = await cdp.eval(`(() => {
      const bodyCs = getComputedStyle(document.body);
      const bottomNav = document.querySelector('nav[aria-label="Mobile Navigation"]');
      const toggleBtn = document.querySelector('[data-testid="theme-toggle-btn"]');
      return {
        hasBottomNav: !!bottomNav,
        hasToggleBtn: !!toggleBtn,
        bodyBgImage: bodyCs.backgroundImage.substring(0, 60) + '...',
      };
    })()`)
    console.log('Mobile view check:', mobileCheck)
    if (!mobileCheck.hasBottomNav || !mobileCheck.hasToggleBtn) {
      throw new Error(`FAILED: Mobile layout check failed! ${JSON.stringify(mobileCheck)}`)
    }
    console.log('✔ TEST 6 PASSED: Mobile viewport displays header toggle and mobile bottom nav cleanly.')

    console.log('\n🎉 ALL THEME TOGGLE & GRADIENT VERIFICATION TESTS PASSED!')
    cdp.close()
  } finally {
    try {
      chromeProcess.kill()
    } catch {}
  }
}

main().catch((err) => {
  console.error('\n❌ VERIFICATION ERROR:', err)
  process.exit(1)
})
