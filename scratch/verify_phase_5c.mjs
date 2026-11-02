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
  console.log('🚀 Starting Chrome headless for Phase 5C Interactive Television Verification...')
  const chromeProcess = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${PORT}`,
      '--headless=new',
      '--disable-gpu',
      '--window-size=1440,900',
      '--no-first-run',
      '--no-default-browser-check',
      '--user-data-dir=' + process.env.TEMP + '\\chrome_test_p5c_' + Date.now(),
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

    console.log('\n--- 1. App Launch & Profile Selection ---')
    await cdp.send('Page.navigate', { url: APP_URL })
    await sleep(2000)

    // Ensure session starts in streaming mode with Aarav profile
    await cdp.eval(`(() => {
      sessionStorage.setItem('junction_startup_seen', 'true')
      sessionStorage.setItem('junction_in_streaming', 'true')
      localStorage.setItem('junction_active_profile_v1', 'profile-aarav')
      window.location.reload()
    })()`)
    await sleep(2000)

    // Navigate to Live TV
    console.log('\n--- 2. Navigate to Live TV & EPG Page ---')
    const navigated = await cdp.eval(`(() => {
      const liveBtn = Array.from(document.querySelectorAll('header nav button')).find(b => b.textContent && b.textContent.includes('Live TV'))
      if (liveBtn) {
        liveBtn.click()
        return true
      }
      return false
    })()`)
    console.log('Navigated to Live TV:', navigated)
    await sleep(1500)

    // Check Live TV Page is loaded
    const onLivePage = await cdp.eval(`Boolean(document.querySelector('[data-testid="live-tv-page"]'))`)
    console.log('Live TV Page visible:', onLivePage)
    if (!onLivePage) throw new Error('Live TV page failed to render')

    // Check View Mode Switcher has "Interact" tab
    console.log('\n--- 3. Verify Mode Switcher & Interact Tab ---')
    const hasInteractTab = await cdp.eval(`Boolean(document.querySelector('[data-testid="mode-interact"]'))`)
    console.log('Mode Interact Tab present:', hasInteractTab)
    if (!hasInteractTab) throw new Error('Interact tab button missing')

    // Switch to Interact tab
    await cdp.eval(`document.querySelector('[data-testid="mode-interact"]').click()`)
    await sleep(1000)

    const isHubVisible = await cdp.eval(`Boolean(document.querySelector('[data-testid="interaction-hub"]'))`)
    console.log('Interaction Hub visible:', isHubVisible)
    if (!isHubVisible) throw new Error('Interaction Hub failed to render')

    // Check Interaction Cards in Hub
    console.log('\n--- 4. Verify Active and Concluded Interactions ---')
    const cardCounts = await cdp.eval(`(() => {
      const cards = document.querySelectorAll('[data-testid^="interaction-card-"]')
      const polls = Array.from(cards).filter(c => c.textContent.includes('POLL'))
      const votings = Array.from(cards).filter(c => c.textContent.includes('VOTING'))
      const quizzes = Array.from(cards).filter(c => c.textContent.includes('QUIZ'))
      return { total: cards.length, polls: polls.length, votings: votings.length, quizzes: quizzes.length }
    })()`)
    console.log('Interaction Cards Count:', cardCounts)
    if (cardCounts.total < 5) throw new Error('Expected at least 5 interaction cards in hub')

    // Filter by type: Quizzes
    console.log('\n--- 5. Test Type Filtering ---')
    await cdp.eval(`document.querySelector('[data-testid="filter-type-quiz"]').click()`)
    await sleep(500)
    const quizOnlyCount = await cdp.eval(`document.querySelectorAll('[data-testid^="interaction-card-"]').length`)
    console.log('Filtered Quizzes Count:', quizOnlyCount)

    // Reset to All Types
    await cdp.eval(`document.querySelector('[data-testid="filter-type-all"]').click()`)
    await sleep(500)

    // Test Live Poll: poll-101
    console.log('\n--- 6. Test Live Poll Submission (poll-101) ---')
    await cdp.eval(`(() => {
      const pollBtn = document.querySelector('[data-testid="open-interaction-btn-poll-101"]')
      if (pollBtn) pollBtn.click()
    })()`)
    await sleep(1000)

    const pollModalOpen = await cdp.eval(`Boolean(document.querySelector('[data-testid="poll-view-poll-101"]'))`)
    console.log('Poll modal open:', pollModalOpen)
    if (!pollModalOpen) throw new Error('Poll modal did not open')

    // Check options present
    const pollOptionsCount = await cdp.eval(`document.querySelectorAll('[data-testid^="poll-option-"]').length`)
    console.log('Poll options count:', pollOptionsCount)
    if (pollOptionsCount < 2) throw new Error('Poll options not rendered')

    // Select first option and submit vote
    await cdp.eval(`document.querySelector('[data-testid="poll-option-opt-sol-1"]').click()`)
    await sleep(500)
    await cdp.eval(`document.querySelector('[data-testid="submit-poll-vote"]').click()`)
    await sleep(1000)

    // Verify results view displayed
    const resultsShown = await cdp.eval(`Boolean(document.querySelector('[data-testid="poll-result-opt-sol-1"]'))`)
    const hasYourVoteBadge = await cdp.eval(`(() => {
      const res = document.querySelector('[data-testid="poll-result-opt-sol-1"]')
      return Boolean(res && res.textContent.includes('YOUR VOTE'))
    })()`)
    console.log('Poll results displayed:', resultsShown, 'Has "YOUR VOTE" badge:', hasYourVoteBadge)
    if (!resultsShown || !hasYourVoteBadge) throw new Error('Poll submission failed or user vote badge missing')

    // Close modal
    await cdp.eval(`(() => {
      const closeBtn = document.querySelector('[data-testid="close-interactive-panel"]')
      if (closeBtn) closeBtn.click()
    })()`)
    await sleep(800)

    // Test Audience Voting: vote-102
    console.log('\n--- 7. Test Audience Voting (vote-102: Driver of the Day) ---')
    await cdp.eval(`(() => {
      const voteBtn = document.querySelector('[data-testid="open-interaction-btn-vote-102"]')
      if (voteBtn) voteBtn.click()
    })()`)
    await sleep(1000)

    const votingModalOpen = await cdp.eval(`Boolean(document.querySelector('[data-testid="voting-view-vote-102"]'))`)
    console.log('Voting modal open:', votingModalOpen)
    if (!votingModalOpen) throw new Error('Voting modal did not open')

    // Select Marco Silva
    await cdp.eval(`document.querySelector('[data-testid="voting-option-drv-silva"]').click()`)
    await sleep(500)
    await cdp.eval(`document.querySelector('[data-testid="submit-audience-vote"]').click()`)
    await sleep(1000)

    const votingResultsShown = await cdp.eval(`Boolean(document.querySelector('[data-testid="voting-result-drv-silva"]'))`)
    const hasYourChoiceBadge = await cdp.eval(`(() => {
      const res = document.querySelector('[data-testid="voting-result-drv-silva"]')
      return Boolean(res && res.textContent.includes('YOUR CHOICE'))
    })()`)
    console.log('Voting results displayed:', votingResultsShown, 'Has "YOUR CHOICE" badge:', hasYourChoiceBadge)
    if (!votingResultsShown || !hasYourChoiceBadge) throw new Error('Audience vote submission failed')

    // Close modal
    await cdp.eval(`(() => {
      const closeBtn = document.querySelector('[data-testid="close-interactive-panel"]')
      if (closeBtn) closeBtn.click()
    })()`)
    await sleep(800)

    // Test Programme Quiz: quiz-102
    console.log('\n--- 8. Test Programme Quiz (quiz-102) ---')
    await cdp.eval(`(() => {
      const quizBtn = document.querySelector('[data-testid="open-interaction-btn-quiz-102"]')
      if (quizBtn) quizBtn.click()
    })()`)
    await sleep(1000)

    const quizModalOpen = await cdp.eval(`Boolean(document.querySelector('[data-testid="quiz-view-quiz-102"]'))`)
    console.log('Quiz modal open:', quizModalOpen)
    if (!quizModalOpen) throw new Error('Quiz modal did not open')

    // Question 1: Answer with first option
    const q1Options = await cdp.eval(`document.querySelectorAll('[data-testid^="quiz-option-"]').length`)
    console.log('Q1 options count:', q1Options)
    await cdp.eval(`document.querySelectorAll('[data-testid^="quiz-option-"]')[0].click()`)
    await sleep(500)

    const explanationShown = await cdp.eval(`Boolean(document.querySelector('[data-testid="quiz-explanation-box"]'))`)
    console.log('Immediate explanation shown:', explanationShown)
    if (!explanationShown) throw new Error('Quiz explanation box missing after answering')

    // Next question to Q2
    await cdp.eval(`document.querySelector('[data-testid="quiz-next-question-btn"]').click()`)
    await sleep(600)

    // Q2: Select option
    await cdp.eval(`document.querySelectorAll('[data-testid^="quiz-option-"]')[1].click()`)
    await sleep(500)
    await cdp.eval(`document.querySelector('[data-testid="quiz-next-question-btn"]').click()`)
    await sleep(600)

    // Q3: Select option
    await cdp.eval(`document.querySelectorAll('[data-testid^="quiz-option-"]')[1].click()`)
    await sleep(500)
    await cdp.eval(`document.querySelector('[data-testid="quiz-next-question-btn"]').click()`)
    await sleep(1000)

    // Verify Quiz Summary screen
    const quizSummaryShown = await cdp.eval(`Boolean(document.querySelector('[data-testid="quiz-summary-quiz-102"]'))`)
    console.log('Quiz Final Score Summary visible:', quizSummaryShown)
    if (!quizSummaryShown) throw new Error('Quiz summary screen failed to render')

    // Close modal
    await cdp.eval(`(() => {
      const closeBtn = document.querySelector('[data-testid="close-interactive-panel"]')
      if (closeBtn) closeBtn.click()
    })()`)
    await sleep(800)

    // Test Concluded Interaction: poll-closed-1
    console.log('\n--- 9. Test Concluded Interaction (poll-closed-1) ---')
    await cdp.eval(`(() => {
      const closedBtn = document.querySelector('[data-testid="open-interaction-btn-poll-closed-1"]')
      if (closedBtn) closedBtn.click()
    })()`)
    await sleep(1000)

    const isConcludedShown = await cdp.eval(`(() => {
      const view = document.querySelector('[data-testid="poll-view-poll-closed-1"]')
      const hasConcludedBadge = view && view.textContent.includes('CONCLUDED')
      const hasResults = Boolean(document.querySelector('[data-testid="poll-result-cls-1"]'))
      const noSubmitBtn = !document.querySelector('[data-testid="submit-poll-vote"]')
      return Boolean(hasConcludedBadge && hasResults && noSubmitBtn)
    })()`)
    console.log('Concluded poll displays archive results with voting disabled:', isConcludedShown)
    if (!isConcludedShown) throw new Error('Concluded poll validation failed')

    // Close modal
    await cdp.eval(`(() => {
      const closeBtn = document.querySelector('[data-testid="close-interactive-panel"]')
      if (closeBtn) closeBtn.click()
    })()`)
    await sleep(800)

    // Test In-Player Slide-Over Panel (Desktop)
    console.log('\n--- 10. Test In-Player Interactive Experience (Desktop Slide-Over) ---')
    // Switch back to Now & Next
    await cdp.eval(`document.querySelector('[data-testid="mode-now-and-next"]').click()`)
    await sleep(1000)

    // Open Live Player
    await cdp.eval(`(() => {
      const watchLiveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Watch Live Full Screen'))
      if (watchLiveBtn) watchLiveBtn.click()
    })()`)
    await sleep(1500)

    const isPlayerOpen = await cdp.eval(`Boolean(document.querySelector('[data-testid="simulated-player-modal"]'))`)
    console.log('Player modal open:', isPlayerOpen)
    if (!isPlayerOpen) throw new Error('Player modal failed to open')

    // Check player interactive button
    const hasPlayerInteractBtn = await cdp.eval(`Boolean(document.querySelector('[data-testid="player-interactive-btn"]'))`)
    console.log('Player Interactive Button present:', hasPlayerInteractBtn)
    if (!hasPlayerInteractBtn) throw new Error('Player interactive button missing')

    // Click interactive button
    await cdp.eval(`document.querySelector('[data-testid="player-interactive-btn"]').click()`)
    await sleep(800)

    const isSidebarVisible = await cdp.eval(`Boolean(document.querySelector('[data-testid="player-interactive-sidebar"]'))`)
    console.log('Desktop slide-over sidebar visible:', isSidebarVisible)
    if (!isSidebarVisible) throw new Error('Player slide-over sidebar failed to render')

    // Test Mobile Viewport (Bottom Sheet)
    console.log('\n--- 11. Test Mobile Responsive Viewport (Bottom Sheet) ---')
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
    })
    await sleep(800)

    const isBottomSheetVisible = await cdp.eval(`Boolean(document.querySelector('[data-testid="player-interactive-bottomsheet"]'))`)
    console.log('Mobile bottom sheet visible:', isBottomSheetVisible)
    if (!isBottomSheetVisible) throw new Error('Mobile interactive bottom sheet missing')

    // Reset Viewport
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    })
    await sleep(600)

    // Exit Player
    await cdp.eval(`(() => {
      const backBtn = document.querySelector('button[aria-label="Back to content library"]')
      if (backBtn) backBtn.click()
    })()`)
    await sleep(1000)

    // Test EPG Interactive Badges
    console.log('\n--- 12. Verify EPG Programme Badges ---')
    const badgeCount = await cdp.eval(`document.querySelectorAll('[data-testid^="badge-interactive-"]').length`)
    console.log('EPG Interactive Badges count:', badgeCount)
    if (badgeCount < 1) throw new Error('EPG interactive badge missing on programmes')

    // Test Programme Info Modal Interactive Callout
    console.log('\n--- 13. Verify Programme Details Modal Interactive Section ---')
    await cdp.eval(`(() => {
      const badge = document.querySelector('[data-testid^="badge-interactive-"]')
      if (badge) {
        const block = badge.closest('[data-testid^="epg-now-block-"], [data-testid^="epg-next-block-"]')
        if (block) block.click()
      }
    })()`)
    await sleep(1000)

    const hasModalInteractiveSection = await cdp.eval(`Boolean(document.querySelector('[data-testid="modal-interactive-section"]'))`)
    console.log('Modal interactive section displayed:', hasModalInteractiveSection)
    if (!hasModalInteractiveSection) throw new Error('Modal interactive section failed to render')

    // Close info modal if open
    await cdp.eval(`(() => {
      const closeBtn = document.querySelector('button[aria-label="Close modal"]')
      if (closeBtn) closeBtn.click()
    })()`)
    await sleep(800)

    // Test Profile Isolation
    console.log('\n--- 14. Verify Profile Isolation ---')
    // Check Aarav has interactions recorded in localStorage
    const aaravInteractions = await cdp.eval(`(() => {
      return localStorage.getItem('junction_interactions_v1_profile-aarav') ||
             localStorage.getItem('junction_interactions_v1_aarav') ||
             Object.keys(localStorage).filter(k => k.startsWith('junction_interactions_v1_')).length > 0
    })()`)
    console.log('Aarav participation stored in localStorage:', Boolean(aaravInteractions))
    if (!aaravInteractions) throw new Error('Aarav interactions not saved to localStorage')

    // Switch to Mira profile cleanly via localStorage and reload
    await cdp.eval(`(() => {
      localStorage.setItem('junction_active_profile_v1', 'profile-mira')
      window.location.reload()
    })()`)
    await sleep(2000)

    // Navigate to Live TV > Interact under Mira's profile
    await cdp.eval(`(() => {
      const liveBtn = Array.from(document.querySelectorAll('header nav button')).find(b => b.textContent && b.textContent.includes('Live TV'))
      if (liveBtn) liveBtn.click()
    })()`)
    await sleep(1000)

    await cdp.eval(`(() => {
      const interactTab = document.querySelector('[data-testid="mode-interact"]')
      if (interactTab) interactTab.click()
    })()`)
    await sleep(1000)

    // Check that poll-101 is UNVOTED for Mira!
    const miraCardPoll101Text = await cdp.eval(`(() => {
      const card = document.querySelector('[data-testid="interaction-card-poll-101"]')
      return card ? card.textContent : ''
    })()`)
    console.log('Mira Poll 101 card text contains ACTIVE NOW:', miraCardPoll101Text.includes('ACTIVE NOW'))
    if (!miraCardPoll101Text.includes('ACTIVE NOW')) {
      throw new Error('Profile isolation failed: Mira should not inherit Aarav votes')
    }

    console.log('\n🎉 ALL 14 PHASE 5C VERIFICATION CRITERIA PASSED SUCCESSFULLY! 🎉\n')
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
