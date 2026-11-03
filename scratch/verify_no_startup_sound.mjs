import { spawn } from 'child_process'
import http from 'http'
import fs from 'fs'

const PORT = 9235
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
  console.log('🚀 Verifying startup intro sound effect has been completely removed...')
  const tempDir = `C:\\tmp\\chrome_test_no_audio_${Date.now()}`
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

    // Inject AudioContext spy before loading
    await client.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        window.__audioSpies = {
          createdOscillators: 0,
          startupSoundCalls: 0
        };
        const origCreateOscillator = AudioContext.prototype.createOscillator;
        AudioContext.prototype.createOscillator = function() {
          window.__audioSpies.createdOscillators++;
          return origCreateOscillator.apply(this, arguments);
        };
      `
    })

    await client.send('Page.navigate', { url: APP_URL })
    await sleep(1500)

    // Clear sessions to ensure we are on the startup intro screen
    await client.eval(`(() => {
      sessionStorage.clear();
      localStorage.clear();
      window.location.reload();
    })()`)
    await sleep(1200)

    // Check Startup screen is mounted
    const hasStartupScreen = await waitForSelector(client, '[data-testid="startup-screen"]', 20)
    console.log(`[TEST 1] Startup screen visible on initial load: ${hasStartupScreen}`)
    if (!hasStartupScreen) {
      throw new Error('Startup screen failed to display!')
    }

    // Wait past the previous 700ms audio trigger window (e.g. 1500ms)
    console.log('Waiting 1.5s during startup animation...')
    await sleep(1500)

    // Check how many oscillators were created
    const audioStats = await client.eval(`window.__audioSpies`)
    console.log(`[TEST 2] Audio activity during intro:`, audioStats)
    if (audioStats.createdOscillators > 0) {
      throw new Error(`FAIL: ${audioStats.createdOscillators} audio oscillators were created during startup intro!`)
    }
    console.log('✅ 0 audio oscillators created during startup intro (Sound removed)!')

    // TEST 3: Check floating sound control is removed from startup intro
    const hasFloatingSound = await client.eval(`
      Boolean(document.querySelector('[data-testid="startup-screen"] button[aria-label*="sound" i], [data-testid="startup-screen"] button[aria-label*="Mute" i]'))
    `)
    console.log(`[TEST 3] Floating sound control on startup screen: ${hasFloatingSound} (Expected: false)`)
    if (hasFloatingSound) {
      throw new Error('FAIL: Startup screen still has floating sound control button!')
    }

    // TEST 4: Advance past intro and verify profile selection screen loads cleanly
    const hasSkipBtn = await client.eval(`Boolean(document.querySelector('[data-testid="skip-intro-btn"]'))`)
    if (hasSkipBtn) {
      await client.eval(`document.querySelector('[data-testid="skip-intro-btn"]').click()`)
    }
    await sleep(1000)

    const hasProfiles = await waitForSelector(client, '[data-testid="profile-card-aarav"]', 20)
    console.log(`[TEST 4] Advanced to Profile Selection screen (found profile-card-aarav): ${hasProfiles}`)
    if (!hasProfiles) {
      throw new Error('Failed to advance to Profile Selection screen after intro!')
    }

    // Take screenshot
    const screenshot = await client.send('Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync('scratch/no_startup_sound_verified.png', Buffer.from(screenshot.data, 'base64'))
    console.log('📸 Screenshot saved to scratch/no_startup_sound_verified.png')

    console.log('\n🎉 ALL STARTUP SOUND REMOVAL VERIFICATION TESTS PASSED!')
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
