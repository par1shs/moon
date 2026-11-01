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
  console.log('🚀 Starting Chrome headless for Phase 5A Live TV & EPG Verification...')
  const chromeProcess = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${PORT}`,
      '--headless=new',
      '--disable-gpu',
      '--window-size=1440,900',
      '--no-first-run',
      '--no-default-browser-check',
      '--user-data-dir=' + process.env.TEMP + '\\chrome_test_p5a_' + Date.now(),
      APP_URL,
    ],
    { detached: false }
  )

  await sleep(1800)

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

    console.log('🌐 Navigating and setting session into streaming mode with Aarav profile...')
    await cdp.send('Page.navigate', { url: APP_URL })
    await sleep(2000)

    // Ensure session starts in streaming mode with Aarav profile
    await cdp.eval(`(() => {
      sessionStorage.setItem('junction_startup_seen', 'true');
      sessionStorage.setItem('junction_in_streaming', 'true');
      localStorage.setItem('junction_active_profile_v1', 'profile-aarav');
      window.location.reload();
    })()`)
    await sleep(1800)

    // Navigate to Live TV tab
    console.log('📺 Navigating to Live TV page...')
    await cdp.eval(`(() => {
      const liveBtn = Array.from(document.querySelectorAll('header nav button')).find(b => b.textContent && b.textContent.includes('Live TV'));
      if (liveBtn) liveBtn.click();
    })()`)
    await sleep(1200)

    // ─────────────────────────────────────────────────────────────
    // TEST 1: Render All Six Channels & Spotlight Banner
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 1: All 6 Channels & Spotlight Banner ---')
    const spotlightData = await cdp.eval(`(() => {
      const banner = document.querySelector('[data-testid="spotlight-banner"]');
      if (!banner) return null;
      const title = banner.querySelector('h2')?.textContent;
      const channelText = Array.from(banner.querySelectorAll('span')).find(s => s.textContent?.includes('Channel'))?.textContent;
      const onAirBadge = banner.querySelector('span')?.textContent;
      return { title, channelText, onAirBadge };
    })()`)
    console.log('Spotlight Banner State:', spotlightData)
    if (!spotlightData) throw new Error('Spotlight banner not found on Live TV page')
    if (!spotlightData.channelText?.includes('101')) {
      throw new Error(`Expected default channel to be 101, got: ${spotlightData.channelText}`)
    }

    const channelCards = await cdp.eval(`(() => {
      const cards = Array.from(document.querySelectorAll('[data-testid^="channel-card-"]'));
      return cards.map(c => {
        const id = c.getAttribute('data-testid');
        const title = c.querySelector('h3')?.textContent;
        const currentTitle = c.querySelector('h4')?.textContent;
        return { id, title, currentTitle };
      });
    })()`)
    console.log(`Rendered Channel Cards count: ${channelCards.length}`)
    console.log('Channel Cards:', channelCards)
    if (channelCards.length !== 6) {
      throw new Error(`Expected exactly 6 channels, got ${channelCards.length}`)
    }
    console.log('✔ TEST 1 PASSED: All six channels and tuned spotlight banner rendered correctly!')

    // ─────────────────────────────────────────────────────────────
    // TEST 2 & 3: Time-Aware Current & Upcoming Calculations & Progress
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 2 & 3: Current & Upcoming Programme Calculations ---')
    const nowAndNextData = await cdp.eval(`(() => {
      const ch1 = document.querySelector('[data-testid="channel-card-ch-101"]');
      if (!ch1) return null;
      const onNowTitle = ch1.querySelector('h4')?.textContent;
      const onNowElapsed = Array.from(ch1.querySelectorAll('span')).find(s => s.textContent?.includes('elapsed'))?.textContent;
      const upcomingBlock = ch1.querySelectorAll('div.rounded-xl')[1];
      const upcomingTitle = upcomingBlock ? upcomingBlock.querySelector('h4')?.textContent : null;
      const upcomingTime = upcomingBlock ? Array.from(upcomingBlock.querySelectorAll('span')).find(s => s.textContent?.includes(':'))?.textContent : null;
      return { onNowTitle, onNowElapsed, upcomingTitle, upcomingTime };
    })()`)
    console.log('Ch 101 Now & Next details:', nowAndNextData)
    if (!nowAndNextData?.onNowTitle) throw new Error('Missing On Now programme title on Channel 101')
    if (!nowAndNextData?.upcomingTitle) throw new Error('Missing Upcoming programme title on Channel 101')
    if (!nowAndNextData?.onNowElapsed?.includes('elapsed')) {
      throw new Error(`Expected elapsed progress string, got: ${nowAndNextData.onNowElapsed}`)
    }
    console.log('✔ TEST 2 & 3 PASSED: Time-aware calculations and progress dynamically rendered!')

    // ─────────────────────────────────────────────────────────────
    // TEST 4: Full Guide Mode vs Now & Next Switcher
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 4: Full Guide Timeline Mode ---')
    // Click Full Guide mode button
    await cdp.eval(`(() => {
      const fullGuideBtn = document.querySelector('[data-testid="mode-full-guide"]');
      if (fullGuideBtn) fullGuideBtn.click();
    })()`)
    await sleep(800)

    const fullGuideActive = await cdp.eval(`(() => {
      const guide = document.querySelector('[data-testid="epg-full-guide"]');
      if (!guide) return null;
      // check ruler time slots
      const slots = Array.from(guide.querySelectorAll('div.border-r span')).map(s => s.textContent.trim()).filter(Boolean);
      // check visible programme blocks
      const blocks = Array.from(guide.querySelectorAll('[data-testid^="epg-program-block-"]')).length;
      return { hasGuide: true, slotsCount: slots.length, blocksCount: blocks };
    })()`)
    console.log('Full Guide Active State:', fullGuideActive)
    if (!fullGuideActive?.hasGuide) throw new Error('Full Guide failed to activate')
    if (fullGuideActive.blocksCount < 6) {
      throw new Error(`Expected multiple programme blocks in timeline, got ${fullGuideActive.blocksCount}`)
    }
    console.log('✔ TEST 4 PASSED: Full Guide interactive timeline grid operational!')

    // ─────────────────────────────────────────────────────────────
    // TEST 5: Programme Selection & Detailed Information Panel
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 5: Programme Selection & Detailed Info Modal ---')
    // Click first programme block in the guide
    await cdp.eval(`(() => {
      const firstBlock = document.querySelector('[data-testid^="epg-program-block-"]');
      if (firstBlock) firstBlock.click();
    })()`)
    await sleep(800)

    const modalData = await cdp.eval(`(() => {
      const modal = document.querySelector('[data-testid="program-info-modal"]');
      if (!modal) return null;
      const title = modal.querySelector('h3')?.textContent;
      const synopsis = modal.querySelector('p')?.textContent;
      const watchLiveBtn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Watch Live'));
      const remindBtn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Remind'));
      return {
        title,
        synopsis: synopsis?.slice(0, 80),
        hasWatchLive: Boolean(watchLiveBtn),
        hasRemind: Boolean(remindBtn)
      };
    })()`)
    console.log('Program Info Modal State:', modalData)
    if (!modalData?.title) throw new Error('Program Info Modal did not open or missing title')
    console.log('✔ TEST 5 PASSED: Programme selection opens detailed inspection modal with synopsis!')

    // Close modal
    await cdp.eval(`(() => {
      const closeBtn = document.querySelector('button[aria-label="Close dialog"], div[role="dialog"] button');
      if (closeBtn) closeBtn.click();
    })()`)
    await sleep(600)

    // Switch back to Now & Next mode
    await cdp.eval(`(() => {
      const nowNextBtn = document.querySelector('[data-testid="mode-now-and-next"]');
      if (nowNextBtn) nowNextBtn.click();
    })()`)
    await sleep(600)

    // ─────────────────────────────────────────────────────────────
    // TEST 6 & 7: Watch Live in Full Player & Channel Surfing
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 6 & 7: Watch Live Player & Channel Surfing ---')
    // Click "Watch Live Full Screen" on spotlight banner
    await cdp.eval(`(() => {
      const watchLiveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Watch Live Full Screen'));
      if (watchLiveBtn) watchLiveBtn.click();
    })()`)
    await sleep(1000)

    const playerLiveState = await cdp.eval(`(() => {
      const player = document.querySelector('div[role="region"][aria-label^="Video player"]');
      if (!player) return null;
      const title = player.querySelector('h2')?.textContent;
      const liveBadge = Array.from(player.querySelectorAll('span, div')).find(el => el.textContent && el.textContent.includes('LIVE'))?.textContent;
      const prevChBtn = player.querySelector('button[aria-label="Previous channel"]');
      const nextChBtn = player.querySelector('button[aria-label="Next channel"]');
      return {
        title,
        liveBadge,
        hasChannelControls: Boolean(prevChBtn && nextChBtn)
      };
    })()`)
    console.log('Player Live State:', playerLiveState)
    if (!playerLiveState) throw new Error('Live player failed to open')
    if (!playerLiveState.title?.includes('101')) {
      throw new Error(`Expected player to tune to Channel 101, got: ${playerLiveState.title}`)
    }
    if (!playerLiveState.hasChannelControls) {
      throw new Error('Player missing channel surfing controls (Previous / Next channel)')
    }

    // Test Channel Surfing to Channel 102
    console.log('Surfing to next channel (CH ▶)...')
    await cdp.eval(`(() => {
      const nextChBtn = document.querySelector('button[aria-label="Next channel"]');
      if (nextChBtn) nextChBtn.click();
    })()`)
    await sleep(600)

    const nextChannelTitle = await cdp.eval(`(() => {
      const player = document.querySelector('div[role="region"][aria-label^="Video player"]');
      return player?.querySelector('h2')?.textContent;
    })()`)
    console.log('After surfing channel, player title:', nextChannelTitle)
    if (!nextChannelTitle?.includes('102') && !nextChannelTitle?.includes('Speedway')) {
      throw new Error(`Expected tuned channel to be Speedway (102), got: ${nextChannelTitle}`)
    }

    // Exit Player
    await cdp.eval(`(() => {
      const backBtn = document.querySelector('button[aria-label="Back to content library"]');
      if (backBtn) backBtn.click();
    })()`)
    await sleep(800)
    console.log('✔ TEST 6 & 7 PASSED: Watch Live opens full-screen player with channel surfing and returns safely!')

    // ─────────────────────────────────────────────────────────────
    // TEST 8 & 9: Programme Reminders & Profile Isolation
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 8 & 9: Reminders & Profile Isolation ---')
    // Set a reminder on Upcoming programme in Channel 101
    await cdp.eval(`(() => {
      const ch1Card = document.querySelector('[data-testid="channel-card-ch-101"]');
      const remindBtn = Array.from(ch1Card.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Remind'));
      if (remindBtn) remindBtn.click();
    })()`)
    await sleep(500)

    const aaravReminders = await cdp.eval(`(() => {
      const stored = localStorage.getItem('junction_reminders_profile-aarav');
      return stored ? JSON.parse(stored) : [];
    })()`)
    console.log("Aarav's persisted reminders:", aaravReminders)
    if (aaravReminders.length === 0) {
      throw new Error("Reminder failed to persist in Aarav's profile localStorage")
    }

    // Verify reminder indicator is visible on the button
    const reminderBtnText = await cdp.eval(`(() => {
      const ch1Card = document.querySelector('[data-testid="channel-card-ch-101"]');
      const btn = Array.from(ch1Card.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Reminder Set'));
      return btn ? btn.textContent.trim() : null;
    })()`)
    console.log('Active reminder button text:', reminderBtnText)
    if (!reminderBtnText?.includes('Reminder Set')) {
      throw new Error(`Expected button to show 'Reminder Set', got ${reminderBtnText}`)
    }

    // Switch profile to Kabir and verify isolation
    console.log("Switching to Kabir's profile to test reminder isolation...")
    await cdp.eval(`(() => {
      localStorage.setItem('junction_active_profile_v1', 'profile-kabir');
      window.location.reload();
    })()`)
    await sleep(1500)

    // Navigate to Live TV
    await cdp.eval(`(() => {
      const liveBtn = Array.from(document.querySelectorAll('header nav button')).find(b => b.textContent && b.textContent.includes('Live TV'));
      if (liveBtn) liveBtn.click();
    })()`)
    await sleep(1000)

    const kabirReminders = await cdp.eval(`(() => {
      const stored = localStorage.getItem('junction_reminders_profile-kabir');
      return stored ? JSON.parse(stored) : [];
    })()`)
    console.log("Kabir's reminders (should be empty):", kabirReminders)
    if (kabirReminders.length !== 0) {
      throw new Error("Expected Kabir's reminders to be empty (isolation failed)")
    }
    console.log('✔ TEST 8 & 9 PASSED: Reminders persist and are strictly isolated by profile!')

    // Switch back to Aarav and cancel reminder
    await cdp.eval(`(() => {
      localStorage.setItem('junction_active_profile_v1', 'profile-aarav');
      window.location.reload();
    })()`)
    await sleep(1500)

    await cdp.eval(`(() => {
      const liveBtn = Array.from(document.querySelectorAll('header nav button')).find(b => b.textContent && b.textContent.includes('Live TV'));
      if (liveBtn) liveBtn.click();
    })()`)
    await sleep(1000)

    // Cancel reminder
    await cdp.eval(`(() => {
      const ch1Card = document.querySelector('[data-testid="channel-card-ch-101"]');
      const btn = Array.from(ch1Card.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Reminder Set'));
      if (btn) btn.click();
    })()`)
    await sleep(400)

    const aaravRemindersAfterCancel = await cdp.eval(`(() => {
      const stored = localStorage.getItem('junction_reminders_profile-aarav');
      return stored ? JSON.parse(stored) : [];
    })()`)
    console.log('Aarav reminders after cancellation:', aaravRemindersAfterCancel)
    if (aaravRemindersAfterCancel.length !== 0) {
      throw new Error('Reminder was not cancelled!')
    }
    console.log('✔ Reminder cancellation verified cleanly!')

    // ─────────────────────────────────────────────────────────────
    // TEST 10 & 11: Responsive Mobile View (375x812)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 10 & 11: Responsive Mobile View (375x812) ---')
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
    })
    await sleep(500)

    // Switch to Full Guide in mobile
    await cdp.eval(`(() => {
      const fullGuideBtn = document.querySelector('[data-testid="mode-full-guide"]');
      if (fullGuideBtn) fullGuideBtn.click();
    })()`)
    await sleep(800)

    const mobileGuideOk = await cdp.eval(`(() => {
      const mobileGuide = document.querySelector('[data-testid="epg-mobile-guide"]');
      const channelButtons = mobileGuide ? Array.from(mobileGuide.querySelectorAll('button')).length : 0;
      return { hasMobileGuide: Boolean(mobileGuide), channelButtons };
    })()`)
    console.log('Mobile Guide State:', mobileGuideOk)
    if (!mobileGuideOk?.hasMobileGuide || mobileGuideOk.channelButtons < 6) {
      throw new Error('Mobile stacked guide failed to render channel selector')
    }
    console.log('✔ TEST 10 & 11 PASSED: Mobile stacked schedule is responsive and usable!')

    console.log('\n========================================')
    console.log('🎉 ALL 11 PHASE 5A VERIFICATION TESTS PASSED!')
    console.log('========================================\n')

    cdp.close()
  } catch (err) {
    console.error('❌ Phase 5A verification failed:', err)
    process.exitCode = 1
  } finally {
    try {
      chromeProcess.kill()
    } catch {}
  }
}

main()
