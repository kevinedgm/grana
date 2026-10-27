// Tamaño de los archivos publicados (sin minificar) y comprimidos con gzip/brotli. Sin dependencias.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync, brotliCompressSync } from 'node:zlib';
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk('src');
let raw = 0, all = '';
for (const f of files) { const b = readFileSync(f); raw += b.length; all += b.toString(); console.log(`${f.padEnd(28)} ${String(b.length).padStart(6)} B`); }
const js = files.filter((f) => f.endsWith('.js')).map((f) => readFileSync(f, 'utf8')).join('\n');
const css = readFileSync('src/cornisa.css', 'utf8');
const k = (n) => (n / 1024).toFixed(1) + ' KiB';
console.log(`\nTotal sin minificar: ${k(raw)}`);
console.log(`JS  (concatenado) gzip ${k(gzipSync(js, { level: 9 }).length)} · brotli ${k(brotliCompressSync(js).length)}`);
console.log(`CSS gzip ${k(gzipSync(css, { level: 9 }).length)} · brotli ${k(brotliCompressSync(css).length)}`);
console.log('Nota: sin minificar ni tree-shaking; es una cota superior del coste en red.');
