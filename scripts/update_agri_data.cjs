const fs = require('fs');

let code = fs.readFileSync('src/data/agriData.ts', 'utf8');
const start = code.indexOf('export const CROPS_DATABASE: Record<string, CropData> = {');
const end = code.indexOf('export const ROTATION_PLANS: Record<FarmerPriorityId, RotationPlan> = {');

if (start === -1 || end === -1) {
  console.error('Could not find boundaries', start, end);
  process.exit(1);
}

const newCode = code.slice(0, start) + 'import { CROPS_DATABASE } from "./crops";\nexport { CROPS_DATABASE };\n\n' + code.slice(end);
fs.writeFileSync('src/data/agriData.ts', newCode, 'utf8');
console.log('Successfully updated src/data/agriData.ts');
