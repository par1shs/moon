import { spawn } from 'node:child_process'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const chrome = spawn(CHROME_PATH, [
  '--remote-debugging-port=9223',
  '--headless=new',
  '--no-first-run',
  '--no-default-browser-check',
  'http://localhost:5174',
])

setTimeout(async () => {
  try {
    const tabs = await fetch('http://127.0.0.1:9223/json/list').then((r) => r.json())
    console.log('Tabs:', tabs.map((t) => ({ url: t.url, title: t.title })))
    const targetTab = tabs.find((t) => t.url.includes('localhost:5174')) || tabs[0]
    const ws = new WebSocket(targetTab.webSocketDebuggerUrl)
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          id: 1,
          method: 'Runtime.evaluate',
          params: {
            expression: `({
              url: window.location.href,
              readyState: document.readyState,
              brandFoundation: getComputedStyle(document.documentElement).getPropertyValue('--brand-foundation').trim(),
              brandMidnight: getComputedStyle(document.documentElement).getPropertyValue('--brand-midnight').trim(),
              brandIndigo: getComputedStyle(document.documentElement).getPropertyValue('--brand-indigo').trim(),
              bgMain: getComputedStyle(document.documentElement).getPropertyValue('--bg-main').trim(),
              bodyBg: getComputedStyle(document.body).backgroundColor,
              accent: getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim(),
            })`,
            returnByValue: true,
          },
        })
      )
    }
    ws.onmessage = (e) => {
      console.log('CDP evaluation result:', JSON.stringify(JSON.parse(e.data), null, 2))
      chrome.kill()
      process.exit(0)
    }
  } catch (err) {
    console.error(err)
    chrome.kill()
    process.exit(1)
  }
}, 2500)
