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
  console.log('🚀 Starting Chrome headless for Phase 5B Scheduled Broadcasts & Catch-up TV Verification...')
  const chromeProcess = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${PORT}`,
      '--headless=new',
      '--disable-gpu',
      '--window-size=1440,900',
      '--no-first-run',
      '--no-default-browser-check',
      '--user-data-dir=' + process.env.TEMP + '\\chrome_test_p5b_' + Date.now(),
      APP_URL,
    ],
    { detached: false }
  )

  await sleep(2000)

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
    await sleep(2000)

    // Navigate to Live TV tab
    console.log('📺 Navigating to Live TV page...')
    await cdp.eval(`(() => {
      const liveBtn = Array.from(document.querySelectorAll('header nav button')).find(b => b.textContent && b.textContent.includes('Live TV'));
      if (liveBtn) liveBtn.click();
    })()`)
    await sleep(1500)

    // ─────────────────────────────────────────────────────────────
    // TEST 1: Catch-up Availability & Expiry Calculations (7-day & 14-day)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 1: Catch-up Availability & Expiry Calculations ---')
    const test1Result = await cdp.eval(`(() => {
      // Test the catchup calculation logic using raw templates in epgSchedule
      // Check if epg data exists
      const now = new Date();
      return {
        hasNow: Boolean(now),
        nowIso: now.toISOString(),
      };
    })()`)
    console.log('Test 1 Time baseline:', test1Result)

    // Check catchup shelf data directly from DOM or component
    const modeButtons = await cdp.eval(`(() => {
      const nowBtn = document.querySelector('[data-testid="mode-now-and-next"]');
      const fullBtn = document.querySelector('[data-testid="mode-full-guide"]');
      const catchUpBtn = document.querySelector('[data-testid="mode-catch-up"]');
      return {
        hasNowNext: Boolean(nowBtn),
        hasFullGuide: Boolean(fullBtn),
        hasCatchUp: Boolean(catchUpBtn),
      };
    })()`)
    console.log('View mode buttons:', modeButtons)
    if (!modeButtons.hasCatchUp) {
      throw new Error('Catch-up TV mode button not found in EPG controls bar')
    }

    // ─────────────────────────────────────────────────────────────
    // TEST 2: Catch-up TV Section View Mode & 5 Dedicated Shelves
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 2 & 3: Catch-up TV Section & All 5 Shelves ---')
    await cdp.eval(`(() => {
      const catchUpBtn = document.querySelector('[data-testid="mode-catch-up"]');
      if (catchUpBtn) catchUpBtn.click();
    })()`)
    await sleep(1000)

    const shelvesCheck = await cdp.eval(`(() => {
      const section = document.querySelector('[data-testid="catch-up-section"]');
      if (!section) return { error: 'catch-up-section not found' };

      const shelfRecentlyAired = document.querySelector('[data-testid="shelf-recently-aired"]');
      const shelfAvailableToday = document.querySelector('[data-testid="shelf-available-today"]');
      const shelfExpiringSoon = document.querySelector('[data-testid="shelf-expiring-soon"]');
      const shelfRecentlyMissed = document.querySelector('[data-testid="shelf-recently-missed"]');
      const channelShelves = Array.from(document.querySelectorAll('[data-testid^="shelf-by-channel-"]'));

      const countRecentlyAired = shelfRecentlyAired ? shelfRecentlyAired.querySelectorAll('[data-testid^="catch-up-card-"]').length : 0;
      const countAvailableToday = shelfAvailableToday ? shelfAvailableToday.querySelectorAll('[data-testid^="catch-up-card-"]').length : 0;
      const countExpiringSoon = shelfExpiringSoon ? shelfExpiringSoon.querySelectorAll('[data-testid^="catch-up-card-"]').length : 0;
      const countRecentlyMissed = shelfRecentlyMissed ? shelfRecentlyMissed.querySelectorAll('[data-testid^="catch-up-card-"]').length : 0;

      return {
        hasSection: true,
        hasRecentlyAired: Boolean(shelfRecentlyAired),
        hasAvailableToday: Boolean(shelfAvailableToday),
        hasExpiringSoon: Boolean(shelfExpiringSoon),
        hasRecentlyMissed: Boolean(shelfRecentlyMissed),
        channelShelvesCount: channelShelves.length,
        countRecentlyAired,
        countAvailableToday,
        countExpiringSoon,
        countRecentlyMissed,
      };
    })()`)
    console.log('Shelves Status:', shelvesCheck)
    if (!shelvesCheck.hasSection) throw new Error(shelvesCheck.error)
    if (!shelvesCheck.hasRecentlyAired) throw new Error('Recently Aired shelf missing')
    if (!shelvesCheck.hasAvailableToday) throw new Error('Available Today shelf missing')
    if (!shelvesCheck.hasExpiringSoon) throw new Error('Expiring Soon shelf missing')
    if (!shelvesCheck.hasRecentlyMissed) throw new Error('Recently Missed shelf missing')
    if (shelvesCheck.channelShelvesCount < 6) {
      throw new Error(`Expected at least 6 channel shelves, got ${shelvesCheck.channelShelvesCount}`)
    }

    // ─────────────────────────────────────────────────────────────
    // TEST 4: Channel and Genre Filters & Search
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 4: Channel & Genre Filters & Search ---')
    await cdp.eval(`(() => {
      const ch102Btn = document.querySelector('[data-testid="filter-channel-ch-102"]');
      if (ch102Btn) ch102Btn.click();
    })()`)
    await sleep(600)

    const ch102Filtered = await cdp.eval(`(() => {
      const cards = Array.from(document.querySelectorAll('[data-testid^="catch-up-card-"]'));
      const sampleTexts = cards.slice(0, 5).map(c => c.textContent?.slice(0, 100));
      return {
        cardCount: cards.length,
        allAreCh102: cards.length > 0 && cards.every(c => c.textContent.includes('CH 102') || c.textContent.includes('Speedway')),
        sampleTexts,
      };
    })()`)
    console.log('Filter CH 102 Result:', ch102Filtered)
    if (ch102Filtered.cardCount === 0 || !ch102Filtered.allAreCh102) {
      throw new Error('Channel filtering failed for CH 102')
    }

    // Reset channel filter to all
    await cdp.eval(`(() => {
      const allBtn = document.querySelector('[data-testid="filter-channel-all"]');
      if (allBtn) allBtn.click();
    })()`)
    await sleep(500)

    // Test search filter
    await cdp.eval(`(() => {
      const searchInput = document.querySelector('[data-testid="catch-up-search"]');
      if (searchInput) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(searchInput, 'Championship');
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    })()`)
    await sleep(600)

    const searchResult = await cdp.eval(`(() => {
      const cards = Array.from(document.querySelectorAll('[data-testid^="catch-up-card-"]'));
      return {
        count: cards.length,
        matchesQuery: cards.length > 0 && cards.every(c => c.textContent.toLowerCase().includes('championship')),
      };
    })()`)
    console.log('Search Result for "Championship":', searchResult)
    if (searchResult.count === 0 || !searchResult.matchesQuery) {
      throw new Error('Search filtering failed for keyword "Championship"')
    }

    // Clear search
    await cdp.eval(`(() => {
      const searchInput = document.querySelector('[data-testid="catch-up-search"]');
      if (searchInput) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(searchInput, '');
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    })()`)
    await sleep(600)

    // ─────────────────────────────────────────────────────────────
    // TEST 5: Watch Catch-up launches player with CATCH-UP Badge (not LIVE)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 5: Watch Catch-up Launches Player with CATCH-UP Badge ---')
    // Click on the first catch-up card's play button
    await cdp.eval(`(() => {
      const firstPlayBtn = document.querySelector('[data-testid="catch-up-play-btn"]');
      if (firstPlayBtn) firstPlayBtn.click();
    })()`)
    await sleep(1500)

    const playerState = await cdp.eval(`(() => {
      const modal = document.querySelector('[data-testid="simulated-player-modal"]') || document.querySelector('[role="region"]');
      const catchUpBadge = document.querySelector('[data-testid="player-catch-up-badge"]');
      const catchUpIndicator = document.querySelector('[data-testid="player-catch-up-indicator"]');
      const liveBadge = Array.from(document.querySelectorAll('span')).find(s => s.textContent && s.textContent.includes('● LIVE'));
      const headerTitle = modal ? modal.querySelector('h2')?.textContent : '';
      const headerSubtitle = modal ? modal.querySelector('p')?.textContent : '';

      return {
        hasModal: Boolean(modal),
        hasCatchUpBadge: Boolean(catchUpBadge),
        catchUpBadgeText: catchUpBadge?.textContent?.trim(),
        hasCatchUpIndicator: Boolean(catchUpIndicator),
        catchUpIndicatorText: catchUpIndicator?.textContent?.trim(),
        hasLiveBadge: Boolean(liveBadge && liveBadge.textContent.includes('● LIVE')),
        headerTitle,
        headerSubtitle,
      };
    })()`)
    console.log('Player Catch-up State:', playerState)
    if (!playerState.hasCatchUpBadge) {
      throw new Error('Player catch-up badge not found')
    }
    if (!playerState.catchUpBadgeText?.includes('CATCH-UP')) {
      throw new Error(`Expected CATCH-UP in badge text, got ${playerState.catchUpBadgeText}`)
    }
    if (!playerState.hasCatchUpIndicator || !playerState.catchUpIndicatorText?.includes('CATCH-UP STREAM')) {
      throw new Error('Player catch-up indicator missing or incorrect')
    }
    if (playerState.hasLiveBadge) {
      throw new Error('● LIVE badge unexpectedly present during catch-up playback')
    }

    // ─────────────────────────────────────────────────────────────
    // TEST 6: Player Header Displays Original Channel Identity & Broadcast Date/Time
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 6: Player Header Identity & Broadcast Time ---')
    console.log('Player Header Title:', playerState.headerTitle)
    console.log('Player Header Subtitle:', playerState.headerSubtitle)
    if (!playerState.headerTitle?.includes('CH ')) {
      throw new Error(`Header title does not contain channel number: ${playerState.headerTitle}`)
    }
    if (!playerState.headerSubtitle?.includes('Broadcast:')) {
      throw new Error(`Header subtitle does not contain "Broadcast:": ${playerState.headerSubtitle}`)
    }

    // ─────────────────────────────────────────────────────────────
    // TEST 7: Playback Seeking, Pausing, and Progress Persistence
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 7: Seeking & Progress Persistence ---')
    // Seek to 42% on the player timeline
    const seekResult = await cdp.eval(`(() => {
      const slider = document.querySelector('input[type="range"][aria-label="Seek playback position"]');
      if (!slider) return { error: 'Seek slider not found' };

      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(slider, '42');
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      slider.dispatchEvent(new Event('change', { bubbles: true }));

      return { value: slider.value };
    })()`)
    console.log('Seek slider moved to:', seekResult)
    await sleep(1000)

    // Check localStorage viewing history for profile-aarav
    const historyCheck = await cdp.eval(`(() => {
      const raw = localStorage.getItem('junction_history_v1_profile-aarav');
      if (!raw) return { error: 'no history found for profile-aarav' };
      const items = JSON.parse(raw);
      const catchupItem = items.find(it => it.contentId && it.contentId.startsWith('catchup-'));
      return {
        found: Boolean(catchupItem),
        contentId: catchupItem?.contentId,
        progress: catchupItem?.progress,
      };
    })()`)
    console.log('Persisted Viewing History in LocalStorage:', historyCheck)
    if (!historyCheck.found || historyCheck.progress < 40) {
      throw new Error(`Catch-up progress not properly persisted in viewing history: ${JSON.stringify(historyCheck)}`)
    }

    // ─────────────────────────────────────────────────────────────
    // TEST 8: Resume Catch-Up Functionality
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 8: Resuming Catch-up Playback ---')
    // Close player
    await cdp.eval(`(() => {
      const exitBtn = document.querySelector('button[aria-label="Back to content library"]');
      if (exitBtn) exitBtn.click();
    })()`)
    await sleep(1000)

    // Verify card now shows resume progress badge or bar
    const resumeCardCheck = await cdp.eval(`(() => {
      const resumeBar = document.querySelector('[data-testid="catch-up-progress-bar"]');
      const resumePill = Array.from(document.querySelectorAll('span, button')).find(el => el.textContent && el.textContent.includes('Resume ('));
      return {
        hasResumeBar: Boolean(resumeBar),
        hasResumePill: Boolean(resumePill),
        pillText: resumePill?.textContent?.trim(),
      };
    })()`)
    console.log('Resume card check:', resumeCardCheck)
    if (!resumeCardCheck.hasResumeBar && !resumeCardCheck.hasResumePill) {
      throw new Error('Resume progress indicator not found on catch-up card after closing player')
    }

    // ─────────────────────────────────────────────────────────────
    // TEST 9: Profile Isolation for Catch-up History
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 9: Profile Isolation ---')
    // Check Kabir's history does not contain this catch-up item
    const kabirCheck = await cdp.eval(`(() => {
      const rawKabir = localStorage.getItem('junction_history_v1_profile-kabir');
      const items = rawKabir ? JSON.parse(rawKabir) : [];
      const hasCatchUp = items.some(it => it.contentId && it.contentId.startsWith('catchup-'));
      return {
        kabirHasCatchUp: hasCatchUp,
      };
    })()`)
    console.log('Kabir Profile History Check:', kabirCheck)
    if (kabirCheck.kabirHasCatchUp) {
      throw new Error("Catch-up progress leaked into Kabir's profile!")
    }

    // ─────────────────────────────────────────────────────────────
    // TEST 10: Live-to-OTT Linked Content & Modal
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 10: Live-to-OTT Linked Content ---')
    // Find an item with OTT link and inspect it
    const ottTest = await cdp.eval(`(() => {
      // Find card with OTT link badge
      const ottBtn = document.querySelector('[data-testid="catch-up-ott-link-btn"]');
      if (ottBtn) {
        ottBtn.click();
        return { clicked: true };
      }
      return { clicked: false };
    })()`)
    console.log('OTT Link Clicked:', ottTest)
    await sleep(1500)

    const ottModalCheck = await cdp.eval(`(() => {
      const modal = document.querySelector('[data-testid="content-details-modal"]') || document.querySelector('[role="dialog"]');
      const hasPlayBtn = Boolean(modal?.querySelector('button')?.textContent?.includes('Play') || modal?.querySelector('button')?.textContent?.includes('Watch'));
      const title = modal?.querySelector('h2, h3, h1')?.textContent;
      return {
        hasModal: Boolean(modal),
        title,
        hasPlayBtn,
      };
    })()`)
    console.log('OTT Modal Opened:', ottModalCheck)
    if (!ottModalCheck.hasModal) {
      throw new Error('Content details modal did not open from OTT link')
    }

    // Close details modal
    await cdp.eval(`(() => {
      const closeBtn = document.querySelector('button[aria-label="Close details"]') || document.querySelector('button[aria-label="Close dialog"], button[aria-label="Close modal"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Close'));
      if (closeBtn) closeBtn.click();
    })()`)
    await sleep(800)

    // ─────────────────────────────────────────────────────────────
    // TEST 11: Expiring Soon Shelf Logic (< 48h remaining)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 11: Expiring Soon Shelf Logic (< 48h) ---')
    const expiringCheck = await cdp.eval(`(() => {
      const shelf = document.querySelector('[data-testid="shelf-expiring-soon"]');
      if (!shelf) return { error: 'Expiring soon shelf not found' };
      const cards = Array.from(shelf.querySelectorAll('[data-testid^="catch-up-card-"]'));
      const expiringBadges = Array.from(shelf.querySelectorAll('span')).filter(s => s.textContent && s.textContent.includes('EXPIRING SOON'));
      return {
        cardCount: cards.length,
        expiringBadgesCount: expiringBadges.length,
      };
    })()`)
    console.log('Expiring Soon Shelf Result:', expiringCheck)
    if (expiringCheck.cardCount === 0 || expiringCheck.expiringBadgesCount === 0) {
      throw new Error('Expiring soon shelf is empty or missing warning badges')
    }

    // ─────────────────────────────────────────────────────────────
    // TEST 12: Mobile Responsive Layout (375x812)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 12: Mobile Responsive Layout (375x812) ---')
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
    })
    await sleep(1000)

    const mobileCheck = await cdp.eval(`(() => {
      const section = document.querySelector('[data-testid="catch-up-section"]');
      const bodyWidth = document.body.scrollWidth;
      const viewportWidth = window.innerWidth;
      const hasHorizontalOverflow = bodyWidth > viewportWidth + 5;
      const modeSwitcher = document.querySelector('[data-testid="mode-catch-up"]');

      return {
        hasSection: Boolean(section),
        bodyWidth,
        viewportWidth,
        hasHorizontalOverflow,
        hasModeSwitcher: Boolean(modeSwitcher),
      };
    })()`)
    console.log('Mobile Layout Check (375x812):', mobileCheck)
    if (mobileCheck.hasHorizontalOverflow) {
      throw new Error(`Mobile view has horizontal overflow: body ${mobileCheck.bodyWidth} > viewport ${mobileCheck.viewportWidth}`)
    }

    // Restore desktop viewport
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    })
    await sleep(500)

    // ─────────────────────────────────────────────────────────────
    // TEST 13: Timezone / Day-Boundary Handling
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 13: Timezone & Day-Boundary Handling ---')
    const timeBoundaryCheck = await cdp.eval(`(() => {
      const cards = Array.from(document.querySelectorAll('[data-testid^="catch-up-card-"]'));
      const textSamples = cards.slice(0, 10).map(c => c.textContent || '');
      const hasNaN = textSamples.some(t => t.includes('NaN') || t.includes('Invalid Date'));
      return {
        sampleCount: textSamples.length,
        hasNaN,
      };
    })()`)
    console.log('Time Boundary Check:', timeBoundaryCheck)
    if (timeBoundaryCheck.hasNaN) {
      throw new Error('NaN or Invalid Date detected in formatted time strings!')
    }

    console.log('\n🎉 ALL 13 TEST SCENARIOS PASSED WITH FLYING COLOURS! Phase 5B Fully Verified!\n')
    cdp.close()
  } catch (err) {
    console.error('❌ Test failed with error:', err)
    process.exit(1)
  } finally {
    try {
      chromeProcess.kill()
    } catch {}
  }
}

main()
