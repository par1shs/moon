import { spawn } from 'child_process'
import http from 'http'
import fs from 'fs'

const PORT = 9240
const APP_URL = 'http://localhost:5173/'

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = ''
      res.on('data', (c) => (data += c))
      res.on('end', () => resolve(JSON.parse(data)))
    }).on('error', reject)
  })
}

async function main() {
  const tempDir = `C:\\tmp\\chrome_diag_${Date.now()}`
  fs.mkdirSync(tempDir, { recursive: true })
  const chromeProcess = spawn(
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    [
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${tempDir}`,
      '--headless=new',
      '--disable-gpu',
      '--window-size=1600,1050',
      APP_URL,
    ],
    { stdio: 'ignore' }
  )

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

    const pageTarget = targets.find((t) => t.type === 'page') || targets[0]
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl)
    let id = 1
    const pending = new Map()
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg.result || msg.error)
        pending.delete(msg.id)
      }
    }
    const send = (method, params = {}) => new Promise((res) => {
      const curId = id++
      pending.set(curId, res)
      ws.send(JSON.stringify({ id: curId, method, params }))
    })
    const evalExpr = async (expr) => {
      const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })
      return r.result?.value
    }

    await sleep(2000)
    await evalExpr(`(() => {
      sessionStorage.setItem('junction_startup_seen', 'true');
      sessionStorage.setItem('junction_in_streaming', 'true');
      localStorage.setItem('junction_active_profile_v1', 'profile-aarav');
      window.location.reload();
    })()`)
    await sleep(2500)

    console.log('--- DIAGNOSTIC RESULTS ---')
    const initialRect = await evalExpr(`(() => {
      const h = document.querySelector('header');
      if (!h) return null;
      const r = h.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, height: r.height, width: r.width, y: r.y };
    })()`)
    console.log('Initial header rect (scrollY=0):', initialRect)

    // Check ancestor overflows
    const ancestorStyles = await evalExpr(`(() => {
      const results = [];
      let el = document.querySelector('header');
      while (el && el.parentElement) {
        el = el.parentElement;
        const s = window.getComputedStyle(el);
        results.push({
          tag: el.tagName,
          className: el.className,
          overflow: s.overflow,
          overflowX: s.overflowX,
          overflowY: s.overflowY,
          transform: s.transform,
          filter: s.filter,
          contain: s.contain,
          height: s.height
        });
      }
      return results;
    })()`)
    console.log('Ancestor styles of header:', JSON.stringify(ancestorStyles, null, 2))

    // Scroll to 500
    await evalExpr(`window.scrollTo({ top: 500, behavior: 'instant' }); window.dispatchEvent(new Event('scroll'));`)
    await sleep(500)

    const scrolledRect = await evalExpr(`(() => {
      const h = document.querySelector('header');
      if (!h) return null;
      const r = h.getBoundingClientRect();
      return {
        rect: { top: r.top, bottom: r.bottom, height: r.height, width: r.width, y: r.y },
        style: {
          position: window.getComputedStyle(h).position,
          top: window.getComputedStyle(h).top,
          zIndex: window.getComputedStyle(h).zIndex,
          opacity: window.getComputedStyle(h).opacity,
          display: window.getComputedStyle(h).display,
          visibility: window.getComputedStyle(h).visibility,
          background: window.getComputedStyle(h).background,
        },
        scrollY: window.scrollY
      };
    })()`)
    console.log('Scrolled header rect (scrollY=500):', scrolledRect)

    // Screenshot at scroll 500
    const shot = await send('Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync('scratch/diag_scroll_500.png', Buffer.from(shot.data, 'base64'))
    console.log('Screenshot saved to scratch/diag_scroll_500.png')

    ws.close()
  } finally {
    chromeProcess.kill('SIGTERM')
    try { fs.rmSync(tempDir, { recursive: true, force: true }) } catch {}
  }
}
main()
