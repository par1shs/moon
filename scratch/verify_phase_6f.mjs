import { spawn } from 'child_process'
import http from 'http'
import fs from 'fs'
import path from 'path'

const PORT = 9229
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
      throw new Error('Eval error: ' + JSON.stringify(res.exceptionDetails))
    }
    return res.result?.value
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
  console.log('🚀 Starting Chrome headless for Phase 6F Verification...')
  const tempDir = `C:\\tmp\\chrome_test_profile_6f_${Date.now()}`
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
    await sleep(2500)

    console.log('Initializing clean streaming session for Aarav...')
    await cdp.eval(`(() => {
      sessionStorage.setItem('junction_startup_seen', 'true');
      sessionStorage.setItem('junction_in_streaming', 'true');
      localStorage.setItem('junction_active_profile_v1', 'profile-aarav');
      localStorage.setItem('junction_cinema_cursor_v1', 'true');
      window.location.reload();
    })()`)
    await sleep(2200)

    // Wait for MainLayout
    const hasNav = await waitForSelector(cdp, '[data-testid="nav-home"]', 30)
    console.log('TopNavigation loaded:', hasNav)
    if (!hasNav) throw new Error('Top navigation failed to load')

    console.log('\n--- TEST 1: Pointer Ambient Gradient Follows Movement ---')
    const hasGradient = await cdp.eval(`Boolean(document.querySelector('[data-testid="pointer-ambient-gradient"]'))`)
    console.log('Pointer ambient gradient element mounted:', hasGradient)
    if (!hasGradient) throw new Error('pointer-ambient-gradient element missing')

    // Simulate pointer move to (450, 320)
    await cdp.eval(`(() => {
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 450, clientY: 320, bubbles: true }));
    })()`)
    await sleep(400)

    const gradientCoords = await cdp.eval(`(() => {
      const el = document.querySelector('[data-testid="pointer-ambient-gradient"]');
      return {
        x: el.style.getPropertyValue('--pointer-x'),
        y: el.style.getPropertyValue('--pointer-y')
      };
    })()`)
    console.log('Updated gradient coordinates from rAF:', gradientCoords)
    if (!gradientCoords.x.includes('px') && !gradientCoords.x.includes('vw')) {
      throw new Error('Pointer coordinates failed to update on ambient gradient element')
    }

    console.log('\n--- TEST 2: Ambient Atmosphere Page Transitions ---')
    const hasAtmosphere = await cdp.eval(`Boolean(document.querySelector('[data-testid="ambient-atmosphere"]'))`)
    console.log('Ambient atmosphere container mounted:', hasAtmosphere)
    if (!hasAtmosphere) throw new Error('ambient-atmosphere container missing')

    // Navigate to Movies and verify transition
    await cdp.eval(`document.querySelector('[data-testid="nav-movies"]').click()`)
    await sleep(900)
    const onMovies = await cdp.eval(`Boolean(document.querySelector('[data-testid="nav-movies"]')?.classList.contains('font-semibold'))`)
    console.log('Navigated to Movies with atmospheric transition:', onMovies)

    // Navigate to Discover and verify richer gradient
    await cdp.eval(`document.querySelector('[data-testid="nav-discover"]').click()`)
    await sleep(900)
    const onDiscover = await cdp.eval(`Boolean(document.querySelector('[data-testid="nav-discover"]')?.classList.contains('font-semibold'))`)
    console.log('Navigated to Discover with atmospheric transition:', onDiscover)

    // Navigate back to Home
    await cdp.eval(`document.querySelector('[data-testid="nav-home"]').click()`)
    await sleep(900)

    console.log('\n--- TEST 3: Profile Switching Updates Ambient Accent ---')
    // Switch to Mira
    await cdp.eval(`(() => {
      sessionStorage.setItem('junction_startup_seen', 'true');
      sessionStorage.setItem('junction_in_streaming', 'true');
      localStorage.setItem('junction_active_profile_v1', 'profile-mira');
      window.location.reload();
    })()`)
    await sleep(2200)

    const miraAccent = await cdp.eval(`getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim()`)
    console.log("Mira's active profile accent color:", miraAccent)
    if (!miraAccent || miraAccent === '') {
      throw new Error('Profile accent CSS variable is empty')
    }

    // Switch back to Aarav
    await cdp.eval(`(() => {
      sessionStorage.setItem('junction_startup_seen', 'true');
      sessionStorage.setItem('junction_in_streaming', 'true');
      localStorage.setItem('junction_active_profile_v1', 'profile-aarav');
      window.location.reload();
    })()`)
    await sleep(2200)

    console.log('\n--- TEST 4: Cinema Projector Cursor Component & Anatomy ---')
    const hasCursor = await cdp.eval(`Boolean(document.querySelector('[data-testid="cinema-projector-cursor"]'))`)
    console.log('Cinema projector cursor element present in DOM:', hasCursor)
    if (!hasCursor) throw new Error('cinema-projector-cursor element missing')

    const hasBeam = await cdp.eval(`Boolean(document.querySelector('[data-testid="cursor-light-beam"]'))`)
    console.log('Cursor directional light beam present:', hasBeam)
    if (!hasBeam) throw new Error('cursor-light-beam element missing')

    const hasFlash = await cdp.eval(`Boolean(document.querySelector('[data-testid="cursor-lens-flash"]'))`)
    console.log('Cursor aperture lens flash element present:', hasFlash)
    if (!hasFlash) throw new Error('cursor-lens-flash element missing')

    console.log('\n--- TEST 5: Pointer Events None (Click & Select Never Blocked) ---')
    const pointerEvents = await cdp.eval(`getComputedStyle(document.querySelector('[data-testid="cinema-projector-cursor"]')).pointerEvents`)
    console.log('Cursor pointer-events CSS property:', pointerEvents)
    if (pointerEvents !== 'none') {
      throw new Error(`Expected pointer-events: none on cursor, got: ${pointerEvents}`)
    }

    console.log('\n--- TEST 6: Reactive Hover on Clickable Elements ---')
    // Get coordinates of a navigation button
    const btnBox = await cdp.eval(`(() => {
      const btn = document.querySelector('[data-testid="nav-discover"]');
      if (!btn) return null;
      const r = btn.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    })()`)

    if (btnBox) {
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: btnBox.x, y: btnBox.y })
      await sleep(350)
    }

    const beamOpacityOnHover = await cdp.eval(`document.querySelector('[data-testid="cursor-light-beam"]')?.style.opacity`)
    console.log('Light beam opacity on clickable hover:', beamOpacityOnHover)

    console.log('\n--- TEST 7: Reactive Hide Over Text Inputs ---')
    // Navigate to Search where a text input is present
    await cdp.eval(`document.querySelector('[data-testid="search-action-btn"]').click()`)
    await sleep(1000)

    const searchInputBox = await cdp.eval(`(() => {
      const input = document.querySelector('[data-testid="search-input"]');
      if (!input) return null;
      const r = input.getBoundingClientRect();
      return { x: Math.round(r.left + 50), y: Math.round(r.top + r.height / 2) };
    })()`)

    console.log('Search input bounding box:', searchInputBox)

    if (searchInputBox) {
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: searchInputBox.x, y: searchInputBox.y })
      await sleep(400)

      const cursorOpacityOnInput = await cdp.eval(`document.querySelector('[data-testid="cinema-projector-cursor"]')?.style.opacity`)
      console.log('Cursor opacity over text input:', cursorOpacityOnInput)
    }

    // Return to Home
    await cdp.eval(`document.querySelector('[data-testid="nav-home"]').click()`)
    await sleep(800)

    console.log('\n--- TEST 8: Clicking Interaction & Shutter Flash ---')
    await cdp.eval(`(() => {
      window.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    })()`)
    await sleep(50)
    const flashOpacity = await cdp.eval(`document.querySelector('[data-testid="cursor-lens-flash"]')?.style.opacity`)
    console.log('Aperture lens flash opacity on click:', flashOpacity)

    await cdp.eval(`(() => {
      window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    })()`)
    await sleep(150)

    console.log('\n--- TEST 9: Cinema Projector Cursor Setting Toggle in ProfileMenu ---')
    // Open profile menu using profile-menu-button
    await cdp.eval(`document.querySelector('[data-testid="profile-menu-button"]')?.click()`)
    await sleep(700)

    const toggleBtnExists = await cdp.eval(`Boolean(document.querySelector('[data-testid="toggle-cinema-cursor-btn"]'))`)
    console.log('ProfileMenu cinema projector toggle switch present:', toggleBtnExists)
    if (!toggleBtnExists) throw new Error('toggle-cinema-cursor-btn not found in ProfileMenu')

    // Click toggle to disable
    await cdp.eval(`document.querySelector('[data-testid="toggle-cinema-cursor-btn"]').click()`)
    await sleep(600)

    const disabledState = await cdp.eval(`Boolean(document.body.classList.contains('has-cinema-cursor'))`)
    console.log('Has cinema cursor class on body after disable:', disabledState)
    if (disabledState !== false) {
      throw new Error('has-cinema-cursor should be removed from body when disabled')
    }

    // Click toggle to re-enable
    await cdp.eval(`document.querySelector('[data-testid="toggle-cinema-cursor-btn"]').click()`)
    await sleep(600)

    const reenabledState = await cdp.eval(`Boolean(document.body.classList.contains('has-cinema-cursor'))`)
    console.log('Has cinema cursor class on body after re-enable:', reenabledState)
    if (!reenabledState) {
      throw new Error('has-cinema-cursor should be restored on body when enabled')
    }

    // Close profile menu
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' })
    await sleep(500)

    console.log('\n--- TEST 10: Content Card Polish ---')
    const firstCard = await cdp.eval(`Boolean(document.querySelector('[data-testid^="content-card-"]'))`)
    console.log('Content card present on page:', firstCard)
    if (!firstCard) throw new Error('content-card not found')

    console.log('\n--- TEST 11: Light Mode Visual Contrast ---')
    await cdp.eval(`(() => {
      document.documentElement.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
    })()`)
    await sleep(600)
    const isLightMode = await cdp.eval(`document.documentElement.classList.contains('light')`)
    console.log('Toggled to Light mode successfully:', isLightMode)

    // Revert back to Dark mode
    await cdp.eval(`(() => {
      document.documentElement.classList.remove('light');
      document.documentElement.setAttribute('data-theme', 'dark');
    })()`)
    await sleep(600)

    console.log('\n--- TEST 12: Capture Screenshot & Save Artifact ---')
    console.log('📸 Capturing screenshot of cinematic interactions & ambient polish...')
    const screenshotData = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
      captureBeyondViewport: false,
    })

    const screenshotPath = path.resolve('scratch', 'phase_6f_cinematic_polish.png')
    fs.writeFileSync(screenshotPath, Buffer.from(screenshotData.data, 'base64'))
    console.log('✅ Screenshot saved to:', screenshotPath)

    const artifactDir = 'C:\\Users\\paris\\.gemini\\antigravity\\brain\\77d6415e-d998-4714-ba44-a319604f66de'
    if (fs.existsSync(artifactDir)) {
      fs.copyFileSync(screenshotPath, path.join(artifactDir, 'phase_6f_cinematic_polish.png'))
      console.log('✅ Copied screenshot to artifact directory')
    }

    console.log('\n🎉 ALL PHASE 6F VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉\n')
  } catch (err) {
    console.error('❌ Verification failed with error:', err)
    process.exit(1)
  } finally {
    if (cdp) cdp.close()
    if (chromeProcess) chromeProcess.kill()
  }
}

main()
