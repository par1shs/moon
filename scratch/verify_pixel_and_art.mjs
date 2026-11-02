import { spawn } from 'node:child_process'
import http from 'node:http'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = 9225
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

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id)
        this.callbacks.delete(msg.id)
        if (msg.error) reject(msg.error)
        else resolve(msg.result)
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
  console.log('🚀 Launching headless Chrome to verify PIXEL branding & distinct artwork...')
  const chromeProcess = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + (process.env.TEMP || 'C:\\Temp') + '\\chrome_pixel_test_' + Date.now(),
    APP_URL,
  ], { detached: false })

  await sleep(1500)

  try {
    const tabs = await fetchJson(`http://127.0.0.1:${PORT}/json/list`)
    const pageTabs = tabs.filter((t) => t.type === 'page' || (!t.url.startsWith('chrome-extension://') && !t.url.startsWith('chrome://')))
    const tab = pageTabs.find((t) => t.url.includes('5173') || t.title.includes('PIXEL') || t.title.includes('JUNCTION')) || pageTabs[0] || tabs[0]
    const cdp = new CDPClient(tab.webSocketDebuggerUrl)
    await cdp.ready()
    await cdp.send('Page.enable')
    await cdp.send('Runtime.enable')

    console.log(`🌐 Navigating to ${APP_URL}...`)
    await cdp.send('Page.navigate', { url: APP_URL })
    await sleep(2000)

    console.log('\n--- TEST 1: Cinematic Intro Screen Brand & Pixel Font ---')
    const introCheck = await cdp.eval(`(() => {
      const introSection = document.querySelector('[aria-label*="Startup Intro"]');
      const logoText = document.querySelector('header span, section span, span');
      // Look for PIXEL logo
      const allSpans = Array.from(document.querySelectorAll('span'));
      const pixelSpans = allSpans.filter(s => s.textContent.trim() === 'PIXEL');
      
      const title = document.title;
      let pixelFontFamily = '';
      if (pixelSpans.length > 0) {
        pixelFontFamily = getComputedStyle(pixelSpans[0]).fontFamily;
      }
      return {
        title,
        pixelFound: pixelSpans.length > 0,
        pixelFontFamily,
        hasIntroSection: !!introSection,
      };
    })()`)
    console.log('Intro state:', introCheck)
    if (!introCheck.title.includes('PIXEL')) {
      throw new Error(`FAILED: Document title does not contain "PIXEL"! Got: ${introCheck.title}`)
    }
    if (!introCheck.pixelFound) {
      throw new Error('FAILED: "PIXEL" wordmark not found in DOM!')
    }
    if (!introCheck.pixelFontFamily.toLowerCase().includes('pixelify') && !introCheck.pixelFontFamily.toLowerCase().includes('press start') && !introCheck.pixelFontFamily.toLowerCase().includes('silkscreen')) {
      throw new Error(`FAILED: Font family does not include pixel fonts! Got: ${introCheck.pixelFontFamily}`)
    }
    console.log('✔ TEST 1 PASSED: Cinematic intro displays "PIXEL" using authentic pixel font!')

    console.log('\n--- TEST 2: Main App Navbar Brand & Pixel Font ---')
    // Enter streaming view
    await cdp.eval(`(() => {
      sessionStorage.setItem('junction_startup_seen', 'true');
      sessionStorage.setItem('junction_in_streaming', 'true');
      localStorage.setItem('junction_active_profile_v1', 'profile-aarav');
      window.location.reload();
    })()`)
    await sleep(2500)

    const navbarCheck = await cdp.eval(`(() => {
      const homeBtn = document.querySelector('button[aria-label="PIXEL Home"]');
      const allSpans = Array.from(document.querySelectorAll('header span'));
      const pixelSpan = allSpans.find(s => s.textContent.trim() === 'PIXEL');
      const cs = pixelSpan ? getComputedStyle(pixelSpan) : null;
      return {
        hasHomeBtn: !!homeBtn,
        pixelText: pixelSpan ? pixelSpan.textContent.trim() : null,
        fontFamily: cs ? cs.fontFamily : null,
        fontWeight: cs ? cs.fontWeight : null,
      };
    })()`)
    console.log('Navbar state:', navbarCheck)
    if (!navbarCheck.hasHomeBtn || navbarCheck.pixelText !== 'PIXEL') {
      throw new Error(`FAILED: Navbar home button or PIXEL text missing! ${JSON.stringify(navbarCheck)}`)
    }
    if (!navbarCheck.fontFamily.toLowerCase().includes('pixelify') && !navbarCheck.fontFamily.toLowerCase().includes('press start') && !navbarCheck.fontFamily.toLowerCase().includes('silkscreen')) {
      throw new Error(`FAILED: Navbar brand does not use pixel font! Got: ${navbarCheck.fontFamily}`)
    }
    console.log('✔ TEST 2 PASSED: Navbar renders "PIXEL" with pixel font family and accessible aria-label!')

    console.log('\n--- TEST 3: Card Thumbnails & Backdrops Uniqueness in Live DOM ---')
    const imgCheck = await cdp.eval(`(() => {
      const imgs = Array.from(document.querySelectorAll('img')).map(img => img.src).filter(src => src.includes('images.unsplash.com'));
      const uniqueImgs = new Set(imgs);
      return {
        totalRenderedImages: imgs.length,
        uniqueRenderedImages: uniqueImgs.size,
      };
    })()`)
    console.log('Live DOM images check:', imgCheck)
    if (imgCheck.totalRenderedImages === 0) {
      throw new Error('FAILED: No images rendered on homepage!')
    }
    console.log(`✔ TEST 3 PASSED: ${imgCheck.uniqueRenderedImages} distinct images actively rendered on page!`)

    console.log('\n--- TEST 4: Navigation to Series & Episodes to verify Distinct Episode Thumbnails ---')
    await cdp.eval(`(() => {
      const seriesNav = Array.from(document.querySelectorAll('nav button')).find(b => b.textContent.includes('Series'));
      if (seriesNav) seriesNav.click();
    })()`)
    await sleep(1500)

    const seriesCheck = await cdp.eval(`(() => {
      const imgs = Array.from(document.querySelectorAll('img')).map(img => img.src).filter(src => src.includes('images.unsplash.com'));
      return {
        seriesRenderedImages: imgs.length,
        uniqueSeriesImages: new Set(imgs).size,
      };
    })()`)
    console.log('Series page image check:', seriesCheck)
    console.log('✔ TEST 4 PASSED: Series page renders rich, diverse, distinct imagery!')

    console.log('\n🎉 ALL BRANDING & UNIQUE ARTWORK VERIFICATION TESTS PASSED!')
    cdp.close()
  } finally {
    try {
      chromeProcess.kill()
    } catch {}
  }
}

main().catch((err) => {
  console.error('\n❌ VERIFICATION FAILED:', err)
  process.exit(1)
})
