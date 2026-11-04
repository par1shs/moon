import { spawn } from 'child_process'
import http from 'http'
import fs from 'fs'

const PORT = 9238
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
  console.log('🚀 Verifying About sections for all cards...')
  const tempDir = `C:\\tmp\\chrome_test_about_${Date.now()}`
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
    await sleep(1500)

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

    // Helper to test a card's About section
    async function testCardAbout(cardId, _expectedTitleFragment) {
      console.log(`\nTesting card [${cardId}]...`)
      // Click details button on card
      const clicked = await client.eval(`(() => {
        const btn = document.querySelector('[data-testid="content-card-details-btn-${cardId}"]');
        if (btn) {
          btn.click();
          return true;
        }
        const card = document.querySelector('[data-testid="content-card-${cardId}"]');
        if (card) {
          card.click();
          return true;
        }
        return false;
      })()`)

      if (!clicked) {
        throw new Error(`Could not find or click card [${cardId}]`)
      }
      await sleep(600)

      const modalOpen = await waitForSelector(client, '[data-testid="content-details-modal"]', 20)
      if (!modalOpen) throw new Error(`Modal failed to open for card [${cardId}]`)

      const aboutData = await client.eval(`(() => {
        const section = document.querySelector('[data-testid="about-section"]');
        const descEl = document.querySelector('[data-testid="content-about-description"]');
        const titleEl = document.querySelector('[data-testid="content-details-modal"] h2');
        return {
          hasSection: Boolean(section),
          title: titleEl ? titleEl.textContent : '',
          descriptionText: descEl ? descEl.textContent.trim() : '',
          length: descEl ? descEl.textContent.trim().length : 0
        };
      })()`)

      console.log(`- Title: "${aboutData.title}"`)
      console.log(`- Description length: ${aboutData.length} chars`)
      console.log(`- Text preview: "${aboutData.descriptionText.slice(0, 100)}..."`)

      if (aboutData.length < 50) {
        throw new Error(`Description is too short or missing (<50 chars) for [${cardId}]: "${aboutData.descriptionText}"`)
      }
      if (aboutData.descriptionText === 'Sci-Fi Drama' || aboutData.descriptionText.startsWith('Season 1 •')) {
        throw new Error(`Description is just a tag for [${cardId}]!`)
      }

      // Close modal by pressing Escape
      await client.eval(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`)
      await sleep(500)
    }

    // TEST 1: Check port-1 (The Silent Meridian - previously had "Season 1 • 8 Episodes")
    await testCardAbout('port-1', 'The Silent Meridian')

    // TEST 2: Check port-2 (Echoes of Chronos - previously had "Sci-Fi Drama")
    await testCardAbout('port-2', 'Echoes of Chronos')

    // TEST 3: Check port-3 (Velocity Night - previously had "High-Stakes Thriller")
    await testCardAbout('port-3', 'Velocity Night')

    // TEST 4: Navigate to Series page and test ser-3 (Shadow Council - previously "Political Drama")
    await client.eval(`(() => {
      const btn = document.querySelector('[data-testid="nav-series"]');
      if (btn) btn.click();
    })()`)
    await sleep(1000)

    await testCardAbout('ser-3', 'Shadow Council')
    await testCardAbout('ser-5', 'Subterranean Frequency')

    // TEST 5: Navigate to Movies page and test mov-2 (Velocity Night: Apex)
    await client.eval(`(() => {
      const btn = document.querySelector('[data-testid="nav-movies"]');
      if (btn) btn.click();
    })()`)
    await sleep(1000)

    await testCardAbout('mov-2', 'Velocity Night: Apex')
    await testCardAbout('mov-6', 'Convergence Point')

    // Open one modal and capture a screenshot for visual confirmation
    await client.eval(`(() => {
      const card = document.querySelector('[data-testid="content-card-port-1"]');
      if (card) card.click();
    })()`)
    await sleep(800)

    const screenshot = await client.send('Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync('scratch/card_about_section_verified.png', Buffer.from(screenshot.data, 'base64'))
    console.log('\n📸 Screenshot saved to scratch/card_about_section_verified.png')

    console.log('🎉 ALL CARD ABOUT SECTION TESTS PASSED!')
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
