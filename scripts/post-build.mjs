import { cpSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const distExtension = resolve(root, 'dist/extension');

// Ensure dist/extension exists
mkdirSync(distExtension, { recursive: true });

// 1. Copy manifest.json
cpSync(
  resolve(root, 'manifest.json'),
  resolve(distExtension, 'manifest.json')
);
console.log('✅ manifest.json copied');

// 2. Copy icons (if they exist)
const iconsSource = resolve(root, 'public/icons');
const iconsDest = resolve(distExtension, 'icons');
if (existsSync(iconsSource)) {
  cpSync(iconsSource, iconsDest, { recursive: true });
  console.log('✅ icons/ copied');
} else {
  // Create placeholder icons dir so Chrome doesn't fail hard
  mkdirSync(iconsDest, { recursive: true });
  console.log('⚠️  public/icons not found — icons/ directory created empty. Add PNG icons before loading in Chrome.');
}

// 3. Log final structure
console.log('\n📦 dist/extension/ structure:');
console.log('  manifest.json');
console.log('  icons/');
console.log('  popup/       (Angular build output)');
console.log('  side-panel/  (Angular build output)');
console.log('  dashboard/   (Angular build output)');
console.log('  options/     (Angular build output)');
console.log('  worker/      (esbuild output)');
console.log('\n✅ Post-build assembly complete. Load dist/extension/ as unpacked extension.');
