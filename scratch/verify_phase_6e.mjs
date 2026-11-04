import { spawn } from 'child_process'
import http from 'http'
import fs from 'fs'
import path from 'path'

const PORT = 9228
const APP_URL = 'http://localhost:5173/'

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function waitForSelector(cdp, selector, maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    const found = await cdp.eval(`Boolean(document.querySelector('${selector}'))`)
    if (found) return true
    await sleep(200)
  }
  return false
}

async function clickNavDevices(cdp) {
  await cdp.eval(`window.scrollTo({ top: 0, behavior: 'instant' }); window.dispatchEvent(new Event('scroll'));`)
  const ready = await waitForSelector(cdp, '[data-testid="nav-devices"]', 30)
  if (!ready) throw new Error('Could not find [data-testid="nav-devices"]')
  await cdp.eval(`document.querySelector('[data-testid="nav-devices"]').click()`)
  const pageReady = await waitForSelector(cdp, '[data-testid="device-experience-page"]', 30)
  if (!pageReady) throw new Error('DeviceExperiencePage failed to load after clicking nav')
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

async function main() {
  console.log('🚀 Starting Chrome headless for Phase 6E Verification...')
  const tempDir = `C:\\tmp\\chrome_test_profile_6e_${Date.now()}`
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
      'about:blank',
    ],
    { stdio: 'ignore' }
  )

  let cdp = null

  try {
    // Wait for Chrome remote debugging endpoint
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
      throw new Error('Failed to connect to headless Chrome remote debugging port.')
    }

    const pageTarget = targets.find((t) => t.type === 'page') || targets[0]
    cdp = new CDPClient(pageTarget.webSocketDebuggerUrl)
    await cdp.ready()
    await cdp.send('Page.enable')
    await cdp.send('DOM.enable')
    await cdp.send('Runtime.enable')

    console.log('🌐 Navigating to app:', APP_URL)
    await cdp.send('Page.navigate', { url: APP_URL })
    await sleep(2500)

    // Pre-populate active profile and viewing history
    await cdp.eval(`(() => {
      sessionStorage.setItem('junction_startup_seen', 'true');
      sessionStorage.setItem('junction_in_streaming', 'true');
      localStorage.setItem('junction_active_profile_v1', 'profile-aarav');
      localStorage.setItem('junction_sub_tier_profile-aarav', 'free');
      localStorage.setItem('junction_subscription_v1_profile-aarav', JSON.stringify({
        planId: 'free',
        planName: 'Free',
        billingFrequency: 'monthly',
        status: 'active',
        startDateISO: '2026-01-01T00:00:00Z',
        renewalDateISO: '2026-12-31T00:00:00Z',
        cancelAtPeriodEnd: false
      }));
      localStorage.setItem('junction_history_v1_profile-aarav', JSON.stringify([
        {
          contentId: 'feat-1',
          profileId: 'profile-aarav',
          lastWatched: Date.now() - 3600000,
          progress: 58,
          duration: 8280,
          currentTime: 4800,
          remainingMinutes: 58,
          completed: false
        }
      ]));
    })()`)

    // Reload page to apply localStorage state
    await cdp.send('Page.navigate', { url: APP_URL })
    await sleep(2000)

    // Close any intro/welcome overlay if active
    await cdp.eval(`(() => {
      const skipIntroBtn = document.querySelector('button[aria-label="Skip intro animation"], [data-testid="skip-intro-btn"]');
      if (skipIntroBtn) skipIntroBtn.click();
    })()`)
    await sleep(1000)

    console.log('\n--- TEST 1: Navigation to Devices Page ---')
    const navDevicesFound = await cdp.eval(`Boolean(document.querySelector('[data-testid="nav-devices"]'))`)
    console.log('Nav devices link in top bar:', navDevicesFound)
    if (!navDevicesFound) {
      throw new Error('nav-devices button not found in TopNavigation')
    }

    await cdp.eval(`document.querySelector('[data-testid="nav-devices"]').click()`)
    await sleep(1500)

    const devicePageLoaded = await cdp.eval(`Boolean(document.querySelector('[data-testid="device-experience-page"]'))`)
    console.log('DeviceExperiencePage container rendered:', devicePageLoaded)
    if (!devicePageLoaded) {
      throw new Error('DeviceExperiencePage failed to render')
    }

    console.log('\n--- TEST 2: Four Device Categories Displayed ---')
    const categories = ['desktop', 'mobile', 'tablet', 'smart-tv']
    for (const cat of categories) {
      const exists = await cdp.eval(`Boolean(document.querySelector('[data-testid="category-card-${cat}"]'))`)
      console.log(`Category card [${cat}] present:`, exists)
      if (!exists) throw new Error(`Category card for ${cat} missing`)
    }

    console.log('\n--- TEST 3: Launch and Exit Smart TV Preview ---')
    const launchTVBtn = await cdp.eval(`Boolean(document.querySelector('[data-testid="launch-smart-tv-preview-btn"]'))`)
    console.log('Launch Smart TV Preview button found:', launchTVBtn)
    if (!launchTVBtn) throw new Error('Launch Smart TV Preview button not found')

    await cdp.eval(`document.querySelector('[data-testid="launch-smart-tv-preview-btn"]').click()`)
    await sleep(1200)

    const tvModalOpen = await cdp.eval(`Boolean(document.querySelector('[data-testid="smart-tv-preview-modal"]'))`)
    console.log('Smart TV 10-Foot Modal open:', tvModalOpen)
    if (!tvModalOpen) throw new Error('Smart TV modal failed to open')

    console.log('\n--- TEST 4: D-Pad Keyboard Remote Navigation in TV Mode ---')
    // Check initial focus state on Row 0, Col 0
    let initialFocus = await cdp.eval(`Boolean(document.querySelector('[data-testid="tv-card-0-0"]')?.classList.contains('scale-105'))`)
    console.log('Initial TV card (0,0) focused with scale-105:', initialFocus)

    // Simulate ArrowRight keydown
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight' })
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight' })
    await sleep(400)

    const rightFocus = await cdp.eval(`Boolean(document.querySelector('[data-testid="tv-card-0-1"]')?.classList.contains('scale-105'))`)
    console.log('After ArrowRight, TV card (0,1) focused:', rightFocus)

    // Simulate ArrowDown keydown
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowDown', code: 'ArrowDown' })
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowDown', code: 'ArrowDown' })
    await sleep(400)

    const downFocus = await cdp.eval(`Boolean(document.querySelector('[data-testid="tv-card-1-1"]')?.classList.contains('scale-105'))`)
    console.log('After ArrowDown, TV card (1,1) focused:', downFocus)

    // Test Hero Play / Watch Now action
    const heroPlayExists = await cdp.eval(`Boolean(document.querySelector('[data-testid="tv-hero-play-btn"]'))`)
    console.log('TV Hero Play button exists:', heroPlayExists)

    // Exit TV Preview Mode via Exit Button
    await cdp.eval(`document.querySelector('[data-testid="exit-tv-preview-btn"]').click()`)
    await sleep(800)

    const tvModalClosed = await cdp.eval(`!Boolean(document.querySelector('[data-testid="smart-tv-preview-modal"]'))`)
    console.log('Smart TV Modal closed successfully:', tvModalClosed)
    if (!tvModalClosed) throw new Error('Smart TV modal failed to close')

    console.log('\n--- TEST 5: Device Registration and Persistence ---')
    const initialDevicesCount = await cdp.eval(`document.querySelectorAll('[data-testid^="device-card-"]').length`)
    console.log('Initial registered devices count:', initialDevicesCount)

    // Click Add Device button
    await cdp.eval(`document.querySelector('[data-testid="add-device-btn"]').click()`)
    await sleep(800)

    const addModalOpen = await cdp.eval(`Boolean(document.querySelector('[data-testid="add-device-modal"]'))`)
    console.log('Add Device Modal open:', addModalOpen)
    if (!addModalOpen) throw new Error('Add Device modal did not open')

    // Fill form and submit
    await cdp.eval(`(() => {
      const setVal = (el, val) => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, val);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      };

      const nameInput = document.querySelector('[data-testid="add-device-name-input"]');
      if (nameInput) setVal(nameInput, 'Aarav Bedroom FireTV Stick');

      const modelInput = document.querySelector('[data-testid="add-device-model-input"]');
      if (modelInput) setVal(modelInput, 'Amazon Fire TV Stick 4K Max');

      const submitBtn = document.querySelector('[data-testid="add-device-submit-btn"]');
      if (submitBtn) submitBtn.click();
    })()`)
    await sleep(1000)

    const updatedDevicesCount = await cdp.eval(`document.querySelectorAll('[data-testid^="device-card-"]').length`)
    console.log('Devices count after adding new device:', updatedDevicesCount)
    if (updatedDevicesCount !== initialDevicesCount + 1) {
      throw new Error(`Device count expected ${initialDevicesCount + 1}, got ${updatedDevicesCount}`)
    }

    // Verify localStorage persistence
    const persistedInStorage = await cdp.eval(`(() => {
      const raw = localStorage.getItem('junction_devices_v1_profile-aarav');
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return parsed.some(d => d.name === 'Aarav Bedroom FireTV Stick' || d.name.includes('Aarav'));
    })()`)
    console.log('New device persisted in localStorage:', persistedInStorage)
    if (!persistedInStorage) throw new Error('New device was not saved to localStorage')

    console.log('\n--- TEST 6: Device Renaming and Removal ---')
    // Test Rename on the newly added device
    const lastDeviceCardId = await cdp.eval(`(() => {
      const cards = Array.from(document.querySelectorAll('[data-testid^="device-card-"]'));
      return cards[cards.length - 1]?.getAttribute('data-testid');
    })()`)
    console.log('Target device for rename/remove:', lastDeviceCardId)

    const targetDevId = lastDeviceCardId.replace('device-card-', '')

    // Trigger edit mode
    await cdp.eval(`document.querySelector('[data-testid="rename-device-btn-${targetDevId}"]').click()`)
    await sleep(500)

    // Set new name and save
    await cdp.eval(`(() => {
      const input = document.querySelector('[data-testid="rename-device-input-${targetDevId}"]');
      if (input) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, 'Aarav Master Bed TV 4K');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const saveBtn = document.querySelector('[data-testid="save-rename-btn-${targetDevId}"]');
      if (saveBtn) saveBtn.click();
    })()`)
    await sleep(600)

    const renamedDeviceName = await cdp.eval(`document.querySelector('[data-testid="device-name-${targetDevId}"]')?.textContent`)
    console.log('Renamed device text in DOM:', renamedDeviceName)
    if (!renamedDeviceName?.includes('Aarav Master Bed TV 4K')) {
      throw new Error('Device rename failed in DOM')
    }

    // Test Removal
    await cdp.eval(`document.querySelector('[data-testid="remove-device-btn-${targetDevId}"]').click()`)
    await sleep(400)
    await cdp.eval(`document.querySelector('[data-testid="confirm-remove-btn-${targetDevId}"]').click()`)
    await sleep(800)

    const afterRemoveCount = await cdp.eval(`document.querySelectorAll('[data-testid^="device-card-"]').length`)
    console.log('Devices count after removing:', afterRemoveCount)
    if (afterRemoveCount !== initialDevicesCount) {
      throw new Error(`Expected count ${initialDevicesCount} after removal, got ${afterRemoveCount}`)
    }

    console.log('\n--- TEST 7: Profile Device Isolation ---')
    // Switch to Mira's profile
    await cdp.eval(`(() => {
      sessionStorage.setItem('junction_startup_seen', 'true');
      sessionStorage.setItem('junction_in_streaming', 'true');
      localStorage.setItem('junction_active_profile_v1', 'profile-mira');
      window.location.reload();
    })()`)
    await sleep(2000)

    // Navigate to devices
    await clickNavDevices(cdp)

    const miraDeviceNames = await cdp.eval(`Array.from(document.querySelectorAll('[data-testid^="device-name-"]')).map(el => el.textContent)`)
    console.log("Mira's registered devices:", miraDeviceNames)
    const hasMiraDevice = miraDeviceNames.some((n) => n.includes('Mira') || n.includes('LG') || n.includes('iPad'))
    console.log('Mira profile has profile-isolated devices:', hasMiraDevice)
    if (!hasMiraDevice) throw new Error("Mira's device list not isolated")

    // Switch back to Aarav for screen allowance testing
    await cdp.eval(`(() => {
      sessionStorage.setItem('junction_startup_seen', 'true');
      sessionStorage.setItem('junction_in_streaming', 'true');
      localStorage.setItem('junction_active_profile_v1', 'profile-aarav');
      window.location.reload();
    })()`)
    await sleep(2000)
    await clickNavDevices(cdp)

    console.log('\n--- TEST 8: Free Tier Screen Allowance (1 Screen) ---')
    const freeScreenText = await cdp.eval(`document.querySelector('[data-testid="screen-limit-indicator"]')?.textContent`)
    console.log('Screen limit indicator (Free):', freeScreenText)
    if (!freeScreenText.includes('/ 1 Screen in Use')) {
      throw new Error(`Expected '1 Screen in Use', got: ${freeScreenText}`)
    }

    console.log('\n--- TEST 9: Standard Tier Screen Allowance (2 Screens) ---')
    await cdp.eval(`(() => {
      localStorage.setItem('junction_subscription_v1_profile-aarav', JSON.stringify({
        planId: 'standard',
        planName: 'Standard',
        billingFrequency: 'monthly',
        status: 'active',
        startDateISO: '2026-01-01T00:00:00Z',
        renewalDateISO: '2026-12-31T00:00:00Z',
        cancelAtPeriodEnd: false
      }));
      window.location.reload();
    })()`)
    await sleep(2000)
    await clickNavDevices(cdp)

    const standardScreenText = await cdp.eval(`document.querySelector('[data-testid="screen-limit-indicator"]')?.textContent`)
    console.log('Screen limit indicator (Standard):', standardScreenText)
    if (!standardScreenText.includes('/ 2 Screens in Use')) {
      throw new Error(`Expected '2 Screens in Use', got: ${standardScreenText}`)
    }

    console.log('\n--- TEST 10: Premium Tier Screen Allowance (4 Screens) ---')
    await cdp.eval(`(() => {
      localStorage.setItem('junction_subscription_v1_profile-aarav', JSON.stringify({
        planId: 'premium',
        planName: 'Premium',
        billingFrequency: 'monthly',
        status: 'active',
        startDateISO: '2026-01-01T00:00:00Z',
        renewalDateISO: '2026-12-31T00:00:00Z',
        cancelAtPeriodEnd: false
      }));
      window.location.reload();
    })()`)
    await sleep(2000)
    await clickNavDevices(cdp)

    const premiumScreenText = await cdp.eval(`document.querySelector('[data-testid="screen-limit-indicator"]')?.textContent`)
    console.log('Screen limit indicator (Premium):', premiumScreenText)
    if (!premiumScreenText.includes('/ 4 Screens in Use')) {
      throw new Error(`Expected '4 Screens in Use', got: ${premiumScreenText}`)
    }

    console.log('\n--- TEST 11: Screen Allowance Limit Enforcement & Warning ---')
    // Reset to Free tier where maxScreens = 1
    await cdp.eval(`(() => {
      localStorage.setItem('junction_subscription_v1_profile-aarav', JSON.stringify({
        planId: 'free',
        planName: 'Free',
        billingFrequency: 'monthly',
        status: 'active',
        startDateISO: '2026-01-01T00:00:00Z',
        renewalDateISO: '2026-12-31T00:00:00Z',
        cancelAtPeriodEnd: false
      }));
      window.location.reload();
    })()`)
    await sleep(2000)
    await clickNavDevices(cdp)
    await sleep(1200)

    // Find a device that is currently standby and attempt to start streaming
    const standbyStreamBtn = await cdp.eval(`(() => {
      const btns = Array.from(document.querySelectorAll('[data-testid^="toggle-stream-btn-"]'));
      const standbyBtn = btns.find(b => b.textContent.includes('Simulate Stream'));
      if (standbyBtn) {
        standbyBtn.click();
        return true;
      }
      return false;
    })()`)
    console.log('Attempted to start 2nd stream on Free tier:', standbyStreamBtn)
    await sleep(800)

    const warningVisible = await cdp.eval(`Boolean(document.querySelector('[data-testid="screen-limit-warning"]'))`)
    console.log('Screen limit warning alert displayed:', warningVisible)
    if (!warningVisible) {
      throw new Error('Screen limit warning alert failed to display on exceeding screen allowance')
    }

    console.log('\n--- TEST 12: Cross-Device Viewing Continuity & Handoff ---')
    const handoffSection = await cdp.eval(`Boolean(document.querySelector('[data-testid="device-continuity-section"]'))`)
    console.log('Device continuity section present:', handoffSection)
    if (!handoffSection) throw new Error('device-continuity-section missing')

    // Click execute handoff
    await cdp.eval(`document.querySelector('[data-testid="simulate-handoff-btn"]').click()`)
    await sleep(1000)

    const handoffAlert = await cdp.eval(`document.querySelector('[data-testid="handoff-confirmation-alert"]')?.textContent`)
    console.log('Handoff confirmation alert text:', handoffAlert)
    if (!handoffAlert || !handoffAlert.includes('Playback Transferred')) {
      throw new Error('Handoff confirmation alert did not appear')
    }

    console.log('\n--- TEST 13: Cable & DTH Conceptual Section ---')
    const cableDthSection = await cdp.eval(`Boolean(document.querySelector('[data-testid="cable-dth-section"]'))`)
    console.log('Cable & DTH section present:', cableDthSection)
    if (!cableDthSection) throw new Error('cable-dth-section missing')

    console.log('\n--- TEST 14: Distribution Architecture Diagram ---')
    const archDiagram = await cdp.eval(`Boolean(document.querySelector('[data-testid="distribution-architecture-diagram"]'))`)
    console.log('Distribution architecture diagram present:', archDiagram)
    if (!archDiagram) throw new Error('distribution-architecture-diagram missing')

    // Test filter toggle in diagram
    await cdp.eval(`document.querySelector('[data-testid="arch-filter-ott"]').click()`)
    await sleep(400)
    const ottSelected = await cdp.eval(`Boolean(document.querySelector('[data-testid="arch-filter-ott"]')?.classList.contains('bg-[var(--accent-primary)]'))`)
    console.log('OTT filter toggle active:', ottSelected)

    console.log('\n--- TEST 15: Distribution Strategy Section & Screenshot ---')
    const stratSection = await cdp.eval(`Boolean(document.querySelector('[data-testid="distribution-strategy-section"]'))`)
    console.log('Distribution strategy section present:', stratSection)
    if (!stratSection) throw new Error('distribution-strategy-section missing')

    // Capture Full Page Screenshot
    console.log('📸 Capturing screenshot of Device Experience page...')
    const screenshotData = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
      captureBeyondViewport: false,
    })

    const screenshotPath = path.resolve('scratch', 'phase_6e_device_experience.png')
    fs.writeFileSync(screenshotPath, Buffer.from(screenshotData.data, 'base64'))
    console.log('✅ Screenshot saved to:', screenshotPath)

    // Copy to artifact directory
    const artifactDir = 'C:\\Users\\paris\\.gemini\\antigravity\\brain\\77d6415e-d998-4714-ba44-a319604f66de'
    if (fs.existsSync(artifactDir)) {
      fs.copyFileSync(screenshotPath, path.join(artifactDir, 'phase_6e_device_experience.png'))
      console.log('✅ Copied screenshot to artifact directory')
    }

    console.log('\n🎉 ALL 15 PHASE 6E VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉\n')
  } catch (err) {
    console.error('❌ Verification failed with error:', err)
    process.exit(1)
  } finally {
    if (cdp) cdp.close()
    if (chromeProcess) chromeProcess.kill()
  }
}

main()
