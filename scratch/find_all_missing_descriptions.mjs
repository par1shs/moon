import fs from 'fs';

const text = fs.readFileSync('src/data/sampleContent.ts', 'utf8');

const lines = text.split('\n');
const cards = [];
let currentCard = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (/^\s*id:\s*['"][a-zA-Z0-9_-]+['"],/.test(line) && currentCard === null) {
    currentCard = { startLine: i + 1, lines: [line] };
  } else if (currentCard) {
    currentCard.lines.push(line);
    if (/^\s*\},?\s*$/.test(line)) {
      const block = currentCard.lines.join('\n');
      const idMatch = block.match(/id:\s*['"]([^'"]+)['"]/);
      const titleMatch = block.match(/title:\s*['"`]([^'"`]+)['"`]/);
      const descMatch = block.match(/description:\s*['"`]([^'"`]+)['"`]/);
      const subtitleMatch = block.match(/subtitle:\s*['"`]([^'"`]+)['"`]/);
      const typeMatch = block.match(/type:\s*['"]([^'"]+)['"]/);

      if (idMatch && titleMatch && !idMatch[1].startsWith('bf-') && !idMatch[1].includes('-s')) {
        cards.push({
          id: idMatch[1],
          title: titleMatch[1],
          type: typeMatch ? typeMatch[1] : 'unknown',
          hasDescription: Boolean(descMatch),
          description: descMatch ? descMatch[1] : null,
          subtitle: subtitleMatch ? subtitleMatch[1] : null,
          startLine: currentCard.startLine,
          endLine: i + 1,
        });
      }
      currentCard = null;
    }
  }
}

console.log('Total standalone content cards found:', cards.length);
console.log('Cards with description:', cards.filter((c) => c.hasDescription).length);
console.log('Cards MISSING description:', cards.filter((c) => !c.hasDescription).length);
