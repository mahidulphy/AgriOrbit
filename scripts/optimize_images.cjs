const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizeLogo() {
  const logoPath = 'public/assets/agriorbit-logo.png';
  const logoWebp = 'public/assets/agriorbit-logo.webp';

  console.log('Optimizing logo...');
  const image = sharp(logoPath).resize({ width: 512, withoutEnlargement: true });

  // WebP
  await image.clone().webp({ quality: 85, effort: 6 }).toFile(logoWebp);
  const webpSize = fs.statSync(logoWebp).size;
  console.log(`Exported ${logoWebp}: ${Math.round(webpSize / 1024)} KB`);

  // PNG fallback (compressed)
  const tempPng = 'public/assets/agriorbit-logo-opt.png';
  await image.clone().png({ compressionLevel: 9, palette: true }).toFile(tempPng);
  fs.unlinkSync(logoPath);
  fs.renameSync(tempPng, logoPath);
  const pngSize = fs.statSync(logoPath).size;
  console.log(`Updated ${logoPath}: ${Math.round(pngSize / 1024)} KB`);
}

async function optimizeBackgroundImages() {
  const dir = 'src/assets/images';
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.jpg'));

  for (const f of files) {
    const full = path.join(dir, f);
    const base = f.replace('.jpg', '');
    const webpPath = path.join(dir, base + '.webp');
    const oldSize = fs.statSync(full).size;

    console.log(`Processing ${f} (original: ${Math.round(oldSize / 1024)} KB)...`);

    // WebP version (max 1280 width, quality 75)
    await sharp(full)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 72, effort: 6 })
      .toFile(webpPath);
    let newWebpSize = fs.statSync(webpPath).size;
    if (newWebpSize > 145 * 1024) {
      // Re-encode with lower quality to guarantee < 150 KB
      await sharp(full)
        .resize({ width: 1100, withoutEnlargement: true })
        .webp({ quality: 62, effort: 6 })
        .toFile(webpPath);
      newWebpSize = fs.statSync(webpPath).size;
    }
    console.log(`   -> ${base}.webp: ${Math.round(newWebpSize / 1024)} KB`);

    // Compressed JPG fallback (overwrite original)
    const tempJpg = path.join(dir, base + '-temp.jpg');
    await sharp(full)
      .resize({ width: 1200, withoutEnlargement: true })
      .jpeg({ quality: 72, mozjpeg: true })
      .toFile(tempJpg);
    fs.unlinkSync(full);
    fs.renameSync(tempJpg, full);
    const newJpgSize = fs.statSync(full).size;
    console.log(`   -> ${f} compressed: ${Math.round(newJpgSize / 1024)} KB`);
  }

  // Also sync public/assets/images so public dir isn't bloated
  if (fs.existsSync('public/assets/images')) {
    const pubFiles = fs.readdirSync('public/assets/images');
    for (const pf of pubFiles) {
      const pubFull = path.join('public/assets/images', pf);
      if (fs.existsSync(pubFull)) fs.unlinkSync(pubFull);
    }
    // Copy the optimized webp versions to public/assets/images
    for (const f of fs.readdirSync(dir)) {
      fs.copyFileSync(path.join(dir, f), path.join('public/assets/images', f));
    }
    console.log('Synced optimized images to public/assets/images/');
  }
}

async function main() {
  await optimizeLogo();
  await optimizeBackgroundImages();
  console.log('Image optimization complete!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
