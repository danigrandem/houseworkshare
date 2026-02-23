/**
 * Generates placeholder PWA screenshots (wide + narrow).
 * Run: node scripts/generate-pwa-screenshots.js
 * Requires: npm install -D sharp
 */

const fs = require('fs')
const path = require('path')

const dir = path.join(__dirname, '..', 'public', 'screenshots')
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true })
}

async function main() {
  let sharp
  try {
    sharp = require('sharp')
  } catch {
    console.error('Run: npm install -D sharp')
    process.exit(1)
  }

  const bg = { r: 230, g: 244, b: 255 } // celeste-50
  const brand = { r: 0, g: 149, b: 230 } // celeste-500

  // Wide (desktop): 1280x720
  await sharp({
    create: {
      width: 1280,
      height: 720,
      channels: 3,
      background: bg,
    },
  })
    .png()
    .toFile(path.join(dir, 'wide.png'))

  // Narrow (mobile): 750x1334 (common phone ratio)
  await sharp({
    create: {
      width: 750,
      height: 1334,
      channels: 3,
      background: bg,
    },
  })
    .png()
    .toFile(path.join(dir, 'narrow.png'))

  console.log('PWA screenshots written to public/screenshots/')

  // PWA icons from SVG (Chrome often fails to load SVG from manifest)
  const publicDir = path.join(__dirname, '..', 'public')
  const svgPath = path.join(publicDir, 'icon.svg')
  if (fs.existsSync(svgPath)) {
    const icon192 = path.join(publicDir, 'icon-192.png')
    const icon512 = path.join(publicDir, 'icon-512.png')
    await sharp(svgPath).resize(192, 192).png().toFile(icon192)
    await sharp(svgPath).resize(512, 512).png().toFile(icon512)
    console.log('PWA icons written to public/icon-192.png, public/icon-512.png')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
