/**
 * generate-icons.mjs
 *
 * Generates extension PNG icons from the bootstrap-icons `collection-fill` SVG.
 * Uses `sharp` (which bundles librsvg) to rasterize at each required size.
 *
 * Output: public/icons/icon{16,32,48,128}.png
 *
 * Usage: node scripts/generate-icons.mjs
 */

import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const SVG_SOURCE = resolve(
  root,
  'node_modules/bootstrap-icons/icons/collection-fill.svg'
);
const OUTPUT_DIR = resolve(root, 'public/icons');

// Extension icon sizes required by Chrome MV3
const SIZES = [16, 32, 48, 128];

// Brand color — Bootstrap's primary blue
const BACKGROUND_COLOR = '#0d6efd';
const ICON_COLOR = '#ffffff';

/**
 * Reads the SVG and replaces `currentColor` with a solid white so the icon
 * is visible against the colored background.
 */
function buildSvgWithColor(svgPath, color) {
  const raw = readFileSync(svgPath, 'utf-8');
  return raw.replace(/currentColor/g, color);
}

async function generateIcon(size) {
  const coloredSvg = buildSvgWithColor(SVG_SOURCE, ICON_COLOR);

  // Padding: 12% on each side so the icon doesn't bleed to the edges
  const padding = Math.round(size * 0.12);
  const innerSize = size - padding * 2;

  // Step 1 — rasterize the SVG at the inner size
  const iconBuffer = await sharp(Buffer.from(coloredSvg))
    .resize(innerSize, innerSize)
    .png()
    .toBuffer();

  // Step 2 — compose onto a colored square background
  const outputPath = resolve(OUTPUT_DIR, `icon${size}.png`);
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BACKGROUND_COLOR,
    },
  })
    .composite([{ input: iconBuffer, gravity: 'centre' }])
    .png()
    .toFile(outputPath);

  console.log(`✅ icon${size}.png → ${outputPath}`);
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('🎨 Generating extension icons from bootstrap-icons/collection-fill…\n');

  for (const size of SIZES) {
    await generateIcon(size);
  }

  console.log('\n✅ All icons generated in public/icons/');
}

main().catch((err) => {
  console.error('❌ Icon generation failed:', err);
  process.exit(1);
});
