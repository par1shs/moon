import { spawn } from 'child_process'
import http from 'http'

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
  console.log('🚀 Starting Chrome headless for Pixel Intro & Footer Verification...')
  const chromeProcess = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${PORT}`,
      '--headless=new',
      '--disable-gpu',
      '--window-size=1440,900',
      '--no-first-run',
      '--no-default-browser-check',
      '--user-data-dir=' + process.env.TEMP + '\\chrome_test_intro_' + Date.now(),
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

    console.log('\n--- 1. Verify Startup Screen & Pixel Convergence Animation ---')
    // Clear storage so startup sequence plays
    await cdp.eval(`(() => {
      sessionStorage.clear()
      localStorage.removeItem('junction_active_profile_v1')
      window.location.reload()
    })()`)
    await sleep(1500)

    // Check Startup screen
    const isStartupVisible = await cdp.eval(`Boolean(document.querySelector('[data-testid="startup-screen"]'))`)
    console.log('Startup screen visible:', isStartupVisible)
    if (!isStartupVisible) throw new Error('Startup screen failed to show')

    // Check Ambient Rising Pixels
    const hasAmbientPixels = await cdp.eval(`Boolean(document.querySelector('[data-testid="ambient-rising-pixels"]'))`)
    console.log('Ambient rising pixels field present:', hasAmbientPixels)
    if (!hasAmbientPixels) throw new Error('Ambient rising pixels field missing')

    // Check Pixel Formation Logo
    const hasFormationLogo = await cdp.eval(`Boolean(document.querySelector('[data-testid="pixel-formation-logo"]'))`)
    console.log('Pixel formation logo stage present:', hasFormationLogo)
    if (!hasFormationLogo) throw new Error('Pixel formation logo stage missing')

    // Check pixel elements inside formation logo
    const pixelBlocksCount = await cdp.eval(`(() => {
      const stage = document.querySelector('[data-testid="pixel-formation-logo"]')
      if (!stage) return 0
      return stage.querySelectorAll('div[class*="rounded-[1.5px]"]').length
    })()`)
    console.log('Formation pixel blocks count:', pixelBlocksCount)
    if (pixelBlocksCount < 80) throw new Error('Expected 81 pixels forming PIXEL+')

    // Wait for pixels to coalesce and tagline to reveal
    await sleep(1500)

    const startupText = await cdp.eval(`document.querySelector('[data-testid="startup-screen"]').textContent`)
    console.log('Startup screen text includes ONE STORY. EVERY SCREEN.:', startupText.includes('ONE STORY. EVERY SCREEN.'))
    console.log('Startup screen text includes Welcome to PIXEL:', startupText.includes('Welcome to PIXEL'))
    if (!startupText.includes('ONE STORY. EVERY SCREEN.') || !startupText.includes('Welcome to PIXEL')) {
      throw new Error('Startup text reveal failed')
    }

    // Skip / Advance to Profile Selection
    console.log('\n--- 2. Advance to Profile Selection Screen & Check Footer ---')
    await cdp.eval(`(() => {
      const skipBtn = document.querySelector('[data-testid="skip-intro-btn"]')
      if (skipBtn) skipBtn.click()
    })()`)
    await sleep(2500)

    const isProfileScreen = await cdp.eval(`Boolean(document.querySelector('[data-testid^="profile-card-"]'))`)
    console.log('Profile Selection screen visible:', isProfileScreen)
    if (!isProfileScreen) throw new Error('Failed to advance to profile selection screen')

    // Check footer on Profile Selection Screen
    const profileFooterText = await cdp.eval(`(() => {
      const f = document.querySelector('footer')
      return f ? f.textContent : ''
    })()`)
    console.log('Profile screen footer text:', profileFooterText)
    if (profileFooterText.includes('JUNCTION')) throw new Error('Footer still contains JUNCTION')
    if (!profileFooterText.includes('PIXEL')) throw new Error('Footer missing PIXEL')

    // Select Aarav profile -> Profile Welcome Screen
    console.log('\n--- 3. Verify Profile Welcome Screen & Footer ---')
    await cdp.eval(`(() => {
      const aaravCard = document.querySelector('[data-testid="profile-card-aarav"]') || document.querySelector('[data-testid^="profile-card-"]')
      if (aaravCard) aaravCard.click()
    })()`)
    await sleep(1500)

    const welcomeBodyText = await cdp.eval(`document.body.textContent`)
    console.log('Welcome screen includes PIXEL+ experience is ready:', welcomeBodyText.includes('PIXEL+ experience is ready'))
    console.log('Welcome screen includes Enter PIXEL+ button:', welcomeBodyText.includes('Enter PIXEL+'))
    console.log('Welcome screen has ambient rising pixels:', await cdp.eval(`Boolean(document.querySelector('[data-testid="ambient-rising-pixels"]'))`))
    if (welcomeBodyText.includes('Enter JUNCTION') || welcomeBodyText.includes('JUNCTION+ experience')) {
      throw new Error('Profile Welcome still contains JUNCTION text')
    }

    // Enter streaming app -> MainLayout
    console.log('\n--- 4. Enter MainLayout & Verify Global Streaming Footer ---')
    await cdp.eval(`(() => {
      const enterBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Enter PIXEL'))
      if (enterBtn) enterBtn.click()
    })()`)
    await sleep(1500)

    const globalFooter = await cdp.eval(`(() => {
      const f = document.querySelector('[data-testid="global-footer"]')
      return {
        exists: Boolean(f),
        text: f ? f.textContent : '',
        hasPixelPlus: f ? f.textContent.includes('PIXEL+') : false,
        hasJunction: f ? f.textContent.includes('JUNCTION') : false,
      }
    })()`)
    console.log('Global Footer verification:', globalFooter)
    if (!globalFooter.exists) throw new Error('Global footer element missing')
    if (!globalFooter.hasPixelPlus) throw new Error('Global footer does not say PIXEL+')
    if (globalFooter.hasJunction) throw new Error('Global footer still says JUNCTION')

    console.log('\n🎉 ALL PIXEL INTRO & FOOTER VERIFICATIONS PASSED SUCCESSFULLY! 🎉\n')
    cdp.close()
  } catch (err) {
    console.error('❌ Verification failed with error:', err)
    process.exitCode = 1
  } finally {
    try {
      chromeProcess.kill('SIGTERM')
    } catch {}
  }
}

main()
