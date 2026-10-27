// Genera dist/ para uso por CDN o <script>. Sin dependencias en runtime; esbuild solo en desarrollo.
//   dist/cornisa.esm.js        ESM en un solo archivo (legible)
//   dist/cornisa.esm.min.js    ESM minificado
//   dist/cornisa.iife.js       <script> clásico → window.Cornisa (legible)
//   dist/cornisa.iife.min.js   <script> clásico minificado
//   dist/cornisa.css / .min.css
//   dist/sri.json              hashes SRI (sha384) de cada archivo
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const banner = `/*! cornisa v${pkg.version} | MIT License | sin dependencias */`;
// Navegadores del suelo declarado (Chrome/Edge 84, Firefox 69, Safari 14): esbuild rebaja la sintaxis que haga falta
const target = ['chrome84', 'edge84', 'firefox69', 'safari14'];

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist');

const common = { entryPoints: ['src/index.js'], bundle: true, target, banner: { js: banner }, legalComments: 'none', logLevel: 'warning' };
await build({ ...common, format: 'esm', outfile: 'dist/cornisa.esm.js' });
await build({ ...common, format: 'esm', minify: true, outfile: 'dist/cornisa.esm.min.js' });
await build({ ...common, format: 'iife', globalName: 'Cornisa', outfile: 'dist/cornisa.iife.js' });
await build({ ...common, format: 'iife', globalName: 'Cornisa', minify: true, outfile: 'dist/cornisa.iife.min.js' });
const cssCommon = { entryPoints: ['src/cornisa.css'], bundle: true, banner: { css: banner }, logLevel: 'warning',
  target: ['chrome84', 'edge84', 'firefox69', 'safari14'] };
await build({ ...cssCommon, outfile: 'dist/cornisa.css' });
await build({ ...cssCommon, minify: true, outfile: 'dist/cornisa.min.css' });

const files = ['cornisa.esm.js', 'cornisa.esm.min.js', 'cornisa.iife.js', 'cornisa.iife.min.js', 'cornisa.css', 'cornisa.min.css'];
const sri = {};
for (const f of files) {
  const buf = readFileSync(`dist/${f}`);
  sri[f] = `sha384-${createHash('sha384').update(buf).digest('base64')}`;
  console.log(`${f.padEnd(22)} ${String(buf.length).padStart(6)} B · gzip ${String(gzipSync(buf, { level: 9 }).length).padStart(5)} B`);
}
writeFileSync('dist/sri.json', JSON.stringify({ version: pkg.version, note: 'Recalcular en cada release: el SRI solo vale si el CDN sirve exactamente estos bytes.', files: sri }, null, 2) + '\n');
console.log('dist/sri.json escrito');
