import https from 'node:https'

// Complete unique image map for titles
export const titleArt = {
  // feat-1: KALEIDOSCOPE: The Convergence of TV & OTT
  'feat-1': {
    poster: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1600&auto=format&fit=crop',
  },
  // feat-2: SYMPHONY OF THE VOID
  'feat-2': {
    poster: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?q=80&w=1600&auto=format&fit=crop',
  },
  // feat-3: THE CHRONO METROPOLIS
  'feat-3': {
    poster: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1600&auto=format&fit=crop',
  },
  // port-1: The Silent Meridian
  'port-1': {
    poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop',
  },
  // port-4: Architects of Tomorrow
  'port-4': {
    poster: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1600&auto=format&fit=crop',
  },
  // port-6: Neon Odyssey
  'port-6': {
    poster: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1515260268569-9271009adfdb?q=80&w=1600&auto=format&fit=crop',
  },
  // ser-3: Shadow Council
  'ser-3': {
    poster: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=1600&auto=format&fit=crop',
  },
  // ser-5: Subterranean Frequency
  'ser-5': {
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1600&auto=format&fit=crop',
  },
  // ser-6: Tokyo Midnight Protocol
  'ser-6': {
    poster: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?q=80&w=1600&auto=format&fit=crop',
  },
  // ser-7: Arctic Station Omega
  'ser-7': {
    poster: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=1600&auto=format&fit=crop',
  },
  // ser-8: Wild Soundscapes
  'ser-8': {
    poster: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1600&auto=format&fit=crop',
  },
  // port-2: Echoes of Chronos
  'port-2': {
    poster: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=1600&auto=format&fit=crop',
  },
  // port-3: Velocity Night
  'port-3': {
    poster: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=1600&auto=format&fit=crop',
  },
  // port-5: The Solitary Peak
  'port-5': {
    poster: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?q=80&w=1600&auto=format&fit=crop',
  },
  // mov-2: Velocity Night: Apex
  'mov-2': {
    poster: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1600&auto=format&fit=crop',
  },
  // mov-4: Metropolis Redux: 1927
  'mov-4': {
    poster: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=1600&auto=format&fit=crop',
  },
  // mov-5: Oceans of Europa
  'mov-5': {
    poster: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=80&w=1600&auto=format&fit=crop',
  },
  // mov-6: Convergence Point
  'mov-6': {
    poster: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?q=80&w=1600&auto=format&fit=crop',
  },
  // mov-7: The Glass Horizon
  'mov-7': {
    poster: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=1600&auto=format&fit=crop',
  },
  // mov-8: Celestial Mechanics
  'mov-8': {
    poster: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1600&auto=format&fit=crop',
  },
  // com-1: The Glitch Cafe
  'com-1': {
    poster: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1600&auto=format&fit=crop',
  },
  // com-2: Orbiting Roommates
  'com-2': {
    poster: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1600&auto=format&fit=crop',
  },
  // rom-1: Love Across Wavelengths
  'rom-1': {
    poster: 'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?q=80&w=1600&auto=format&fit=crop',
  },
  // rom-2: Parisian Hours
  'rom-2': {
    poster: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=1600&auto=format&fit=crop',
  },
  // real-1: Zero Gravity Kitchen
  'real-1': {
    poster: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=1600&auto=format&fit=crop',
  },
  // real-2: Survival: Deep Arctic
  'real-2': {
    poster: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?q=80&w=1600&auto=format&fit=crop',
  },
  // fam-1: The Starlight Kingdom
  'fam-1': {
    poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop',
  },
  // mys-1: The Clockmaker's Crypt
  'mys-1': {
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1600&auto=format&fit=crop',
  },
}

// 28 Distinct Episode Thumbnails
export const episodeThumbs = [
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1515260268569-9271009adfdb?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1492571350019-22de08371fd3?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=600&auto=format&fit=crop',
]

async function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ url: url.substring(0, 50), status: res.statusCode })
    }).on('error', (e) => {
      resolve({ url: url.substring(0, 50), status: 'ERR: ' + e.message })
    })
  })
}

async function run() {
  const allUrls = [
    ...Object.values(titleArt).flatMap(x => [x.poster, x.backdrop]),
    ...episodeThumbs
  ]
  console.log('Total URLs to check:', allUrls.length)
  console.log('Unique URLs:', new Set(allUrls).size)

  const results = await Promise.all(allUrls.map(checkUrl))
  const failed = results.filter(r => r.status !== 200 && r.status !== 302)
  console.log('Passed:', results.length - failed.length, 'Failed:', failed.length)
  if (failed.length) {
    console.log('Failed URLs:', failed)
  }
}

run()
