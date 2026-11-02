import https from 'node:https'

const testUrls = [
  'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1600&auto=format&fit=crop',
]

async function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ url: url.substring(0, 55), status: res.statusCode })
    }).on('error', (e) => {
      resolve({ url: url.substring(0, 55), status: 'ERR: ' + e.message })
    })
  })
}

async function run() {
  console.log(`Checking ${testUrls.length} image URLs...`)
  const results = await Promise.all(testUrls.map(checkUrl))
  const failed = results.filter(r => r.status !== 200 && r.status !== 302)
  console.log('Passed:', results.length - failed.length, 'Failed:', failed.length)
  if (failed.length) {
    console.log('Failures:', failed)
  }
}

run()
