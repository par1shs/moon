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
  console.log('🚀 Checking Profile Selection Screen for Aarav, Mira (Kabir and Kids removed)...')
  const chromeProcess = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${PORT}`,
      '--headless=new',
      '--disable-gpu',
      '--window-size=1440,900',
      '--no-first-run',
      '--no-default-browser-check',
      '--user-data-dir=' + process.env.TEMP + '\\chrome_test_profiles_' + Date.now(),
      APP_URL,
    ],
    { detached: false }
  )

  await sleep(2500)

  try {
    const tabs = await fetchJson(`http://127.0.0.1:${PORT}/json/list`)
    const tab = tabs.find((t) => t.url.includes('5173')) || tabs[0]
    console.log('Target tab connected:', tab.url)
    const cdp = new CDPClient(tab.webSocketDebuggerUrl)
    await cdp.ready()
    await cdp.send('Page.enable')
    await cdp.send('Runtime.enable')

    await cdp.send('Page.navigate', { url: APP_URL })
    await sleep(2000)

    // Ensure we are on profile selection screen
    await cdp.eval(`(() => {
      sessionStorage.setItem('junction_startup_seen', 'true')
      sessionStorage.removeItem('junction_in_streaming')
      localStorage.removeItem('junction_active_profile_v1')
      window.location.reload()
    })()`)
    await sleep(2000)

    // Inspect rendered profile names
    const profileNames = await cdp.eval(`(() => {
      const cards = Array.from(document.querySelectorAll('[data-testid^="profile-card-"]'))
      return cards.map(c => c.textContent.trim())
    })()`)
    console.log('Rendered Profiles on Selection Page:', profileNames)

    const hasAarav = profileNames.some(name => name.includes('Aarav'))
    const hasMira = profileNames.some(name => name.includes('Mira'))
    const hasKabir = profileNames.some(name => name.includes('Kabir'))
    const hasKids = profileNames.some(name => name.includes('Kids'))

    console.log('✓ Aarav present:', hasAarav)
    console.log('✓ Mira present:', hasMira)
    console.log('✓ Kabir removed (should be false):', hasKabir)
    console.log('✓ Kids removed (should be false):', hasKids)

    if (!hasAarav) throw new Error('Aarav profile is missing')
    if (!hasMira) throw new Error('Mira profile is missing')
    if (hasKabir) throw new Error('Kabir is still present on profile selection page!')
    if (hasKids) throw new Error('Kids is still present on profile selection page!')

    console.log('\n🎉 Kabir and Kids successfully removed from profile selection page! 🎉\n')
    cdp.close()
  } catch (err) {
    console.error('❌ Verification failed:', err)
    process.exitCode = 1
  } finally {
    chromeProcess.kill('SIGKILL')
  }
}

main()
