import { spawn } from 'child_process'
import http from 'http'
import fs from 'fs'

const PORT = 9232
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
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`)
    }
    return res.result?.value
  }

  close() {
    try {
      this.ws.close()
    } catch {}
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

async function run() {
  console.log('🚀 Verifying Ad Insights navigation moved from top navbar to footer...')
  const tempDir = `C:\\tmp\\chrome_test_ad_footer_${Date.now()}`
  fs.mkdirSync(tempDir, { recursive: true })

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${tempDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1600,1050',
    APP_URL,
  ], { stdio: 'ignore' })

  try {
    let version = null
    for (let i = 0; i < 20; i++) {
      await sleep(300)
      try {
        version = await fetchJson(`http://127.0.0.1:${PORT}/json/version`)
        if (version) break
      } catch {}
    }
    if (!version) throw new Error('Chrome did not start')

    const list = await fetchJson(`http://127.0.0.1:${PORT}/json/list`)
    const pageTarget = list.find((t) => t.type === 'page')
    const client = new CDPClient(pageTarget.webSocketDebuggerUrl)
    await client.ready()

    await client.send('Page.enable')
    await client.send('Runtime.enable')

    await client.send('Page.navigate', { url: APP_URL })
    await sleep(2000)

    // Bypass intro and select Aarav profile
    await client.eval(`(() => {
      sessionStorage.setItem('junction_startup_seen', 'true');
      sessionStorage.setItem('junction_in_streaming', 'true');
      localStorage.setItem('junction_active_profile_v1', 'profile-aarav');
      window.location.reload();
    })()`)
    await sleep(2000)

    const hasNav = await waitForSelector(client, '[data-testid="nav-home"]', 30)
    console.log('TopNavigation loaded:', hasNav)
    if (!hasNav) throw new Error('Top navigation failed to load')

    // TEST 1: Check top navigation does NOT have nav-ad-insights
    const topNavAdInsights = await client.eval(`
      Boolean(document.querySelector('[data-testid="nav-ad-insights"]'))
    `)
    console.log(`[TEST 1] Top nav contains 'nav-ad-insights': ${topNavAdInsights} (Expected: false)`)
    if (topNavAdInsights !== false) {
      throw new Error("FAIL: 'nav-ad-insights' is still present in TopNavigation!")
    }

    // Check standard top nav items remain present
    const topNavHome = await client.eval(`Boolean(document.querySelector('[data-testid="nav-home"]'))`)
    const topNavMembership = await client.eval(`Boolean(document.querySelector('[data-testid="nav-membership"]'))`)
    const topNavDevices = await client.eval(`Boolean(document.querySelector('[data-testid="nav-devices"]'))`)
    console.log(`[TEST 1b] Standard links present: Home=${topNavHome}, Membership=${topNavMembership}, Devices=${topNavDevices}`)
    if (!topNavHome || !topNavMembership || !topNavDevices) {
      throw new Error("FAIL: Standard navigation links missing!")
    }

    // TEST 2: Check footer contains 'footer-ad-insights-btn'
    const footerAdBtn = await client.eval(`
      Boolean(document.querySelector('[data-testid="footer-ad-insights-btn"]'))
    `)
    console.log(`[TEST 2] Footer contains 'footer-ad-insights-btn': ${footerAdBtn} (Expected: true)`)
    if (!footerAdBtn) {
      throw new Error("FAIL: 'footer-ad-insights-btn' not found in global footer!")
    }

    // TEST 3: Click 'footer-ad-insights-btn' and verify navigation to Ad Insights page
    await client.eval(`
      (() => {
        const btn = document.querySelector('[data-testid="footer-ad-insights-btn"]');
        if (btn) btn.click();
      })()
    `)
    await sleep(1000)

    const hasDashboard = await waitForSelector(client, '[data-testid="ad-insights-dashboard"]', 20)
    console.log(`[TEST 3] Ad Insights Dashboard rendered after clicking footer button: ${hasDashboard} (Expected: true)`)
    if (!hasDashboard) {
      throw new Error("FAIL: Ad Insights Dashboard did not render when clicking footer button!")
    }

    // TEST 4: Global footer persists on Ad Insights page
    const footerStillThere = await client.eval(`
      Boolean(document.querySelector('[data-testid="global-footer"]'))
    `)
    console.log(`[TEST 4] Footer persists across pages: ${footerStillThere} (Expected: true)`)
    if (!footerStillThere) {
      throw new Error("FAIL: Global footer missing on Ad Insights page!")
    }

    // TEST 5: Profile menu Ad Insights link also works as secondary shortcut
    await client.eval(`
      (() => {
        // Navigate home first
        const homeBtn = document.querySelector('[data-testid="nav-home"]');
        if (homeBtn) homeBtn.click();
      })()
    `)
    await sleep(600)
    // Open profile menu
    await client.eval(`
      (() => {
        const profileBtn = document.querySelector('[data-testid="profile-menu-button"]');
        if (profileBtn) profileBtn.click();
      })()
    `)
    await sleep(400)
    const profileAdInsightsLink = await client.eval(`
      Boolean(document.querySelector('[data-testid="profile-ad-insights-link"]'))
    `)
    console.log(`[TEST 5] Profile menu retains Ad Insights shortcut: ${profileAdInsightsLink} (Expected: true)`)
    if (!profileAdInsightsLink) {
      throw new Error("FAIL: Profile menu Ad Insights shortcut missing!")
    }

    // Take screenshot for confirmation
    const screenshot = await client.send('Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync('scratch/ad_insights_footer_verified.png', Buffer.from(screenshot.data, 'base64'))
    console.log('📸 Screenshot saved to scratch/ad_insights_footer_verified.png')

    console.log('\n🎉 ALL 5 VERIFICATION TESTS PASSED!')
    client.close()
  } finally {
    try {
      chromeProc.kill()
    } catch {}
  }
}

run().catch((err) => {
  console.error('❌ Verification failed:', err)
  process.exit(1)
})
