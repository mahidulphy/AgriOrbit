const fs = require('fs');

const listTxt = fs.readFileSync('docs/crops/crop-list.txt', 'utf8');
const rulesTxt = fs.readFileSync('docs/crops/crop-rules.txt', 'utf8');

// Parse rule crops
const ruleBlocks = rulesTxt.split(/(?=### \*\*)/).filter(b => b.trim().startsWith('### **'));
const rulesMap = {};

ruleBlocks.forEach(b => {
  const m = b.match(/### \*\*([০-৯\d]+)\.\s*([^(]+)\(([^)]+)\)\*\*/);
  if (m) {
    const num = m[1].trim();
    const bnName = m[2].trim();
    const enName = m[3].trim();
    const tempM = b.match(/\*\*তাপমাত্রা থ্রেশহোল্ড:\*\*(.*?)(?=\*\*|$)/s);
    const waterM = b.match(/\*\*পানির চাহিদা ও স্যাটেলাইট আর্দ্রতা:\*\*(.*?)(?=\*\*|$)/s);
    const stageM = b.match(/\*\*ধাপভিত্তিক সময়কাল:\*\*(.*?)(?=\*\*|$)/s);
    const algoM = b.match(/\*\*অ্যালগরিদমের? সিদ্ধান্ত লজিক:\*\*(.*?)(?=\n---|###|\n\*\*|$)/s);

    rulesMap[enName.toLowerCase()] = {
      rawNum: num,
      rawBn: bnName,
      rawEn: enName,
      temp: tempM ? tempM[1].trim().replace(/\s+/g, ' ') : 'MISSING',
      water: waterM ? waterM[1].trim().replace(/\s+/g, ' ') : 'MISSING',
      stages: stageM ? stageM[1].trim().replace(/\s+/g, ' ') : 'MISSING',
      algo: algoM ? algoM[1].trim().replace(/\s+/g, ' ') : 'MISSING',
      fullText: b
    };
  }
});

console.log('Rules mapped:', Object.keys(rulesMap).length);
