import fs from 'node:fs'
import { titleArt, episodeThumbs } from './test_all_art.mjs'

// 1. Update sampleContent.ts
let content = fs.readFileSync('src/data/sampleContent.ts', 'utf-8')

// Replace brand strings
content = content.replace(/JUNCTION\+/g, 'PIXEL')
content = content.replace(/Junction\+/g, 'Pixel')
content = content.replace(/Junction Central News/g, 'Pixel Central News')
content = content.replace(/Junction Morning Live/g, 'Pixel Morning Live')
content = content.replace(/Junction Evening News/g, 'Pixel Evening News')

// Replace posters and backdrops for each title
for (const [id, art] of Object.entries(titleArt)) {
  // Find id: '${id}', then update its posterUrl and backdropUrl within that object block
  const idRegex = new RegExp(`(id:\\s*['"]${id}['"][\\s\\S]*?)(posterUrl:\\s*['"][^'"]+['"])([\\s\\S]*?)(backdropUrl:\\s*['"][^'"]+['"])`, 'g')
  content = content.replace(idRegex, (_match, p1, _p2, p3) => {
    return `${p1}posterUrl: '${art.poster}'${p3}backdropUrl: '${art.backdrop}'`
  })

  // Also check if backdropUrl comes before posterUrl in some objects
  const idRegexReverse = new RegExp(`(id:\\s*['"]${id}['"][\\s\\S]*?)(backdropUrl:\\s*['"][^'"]+['"])([\\s\\S]*?)(posterUrl:\\s*['"][^'"]+['"])`, 'g')
  content = content.replace(idRegexReverse, (_match, p1, _p2, p3) => {
    return `${p1}backdropUrl: '${art.backdrop}'${p3}posterUrl: '${art.poster}'`
  })
}

// Replace episode thumbnails with unique ones
let thumbIdx = 0
content = content.replace(/thumbnailUrl:\s*['"][^'"]+['"]/g, () => {
  const thumb = episodeThumbs[thumbIdx % episodeThumbs.length]
  thumbIdx++
  return `thumbnailUrl: '${thumb}'`
})

fs.writeFileSync('src/data/sampleContent.ts', content, 'utf-8')
console.log('✔ Updated src/data/sampleContent.ts with unique photos and PIXEL branding!')

// 2. Update epgSchedule.ts
let epg = fs.readFileSync('src/data/epgSchedule.ts', 'utf-8')
epg = epg.replace(/JUNCTION\+/g, 'PIXEL')
epg = epg.replace(/Junction\+/g, 'Pixel')
epg = epg.replace(/Junction Central News/g, 'Pixel Central News')
epg = epg.replace(/Junction Morning Live/g, 'Pixel Morning Live')
epg = epg.replace(/Junction Evening News Live/g, 'Pixel Evening News Live')
epg = epg.replace(/callSign:\s*'JCN-HD'/g, "callSign: 'PCN-HD'")

// Ensure EPG programs have varied unique artwork
let epgArtIdx = 0
epg = epg.replace(/artworkUrl:\s*['"][^'"]+['"]/g, () => {
  const thumb = episodeThumbs[epgArtIdx % episodeThumbs.length]
  epgArtIdx++
  return `artworkUrl: '${thumb}'`
})

fs.writeFileSync('src/data/epgSchedule.ts', epg, 'utf-8')
console.log('✔ Updated src/data/epgSchedule.ts with unique artwork and PIXEL branding!')
