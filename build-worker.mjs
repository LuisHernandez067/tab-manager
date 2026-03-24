import * as esbuild from 'esbuild';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

await esbuild.build({
  entryPoints: [resolve(__dirname, 'workers/extension-worker.ts')],
  bundle: true,
  outfile: resolve(__dirname, 'dist/extension/worker/extension-worker.js'),
  platform: 'browser',
  target: 'chrome120',
  format: 'esm',
  tsconfig: resolve(__dirname, 'tsconfig.worker.json'),
  alias: {
    '@app': resolve(__dirname, 'src/app'),
  },
  external: [],
  logLevel: 'info',
});

console.log('✅ Service worker bundled successfully');
