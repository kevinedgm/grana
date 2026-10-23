// Peso de cada variante de una familia importada sola (dueño: bruno; #844, _comun.md §19): esbuild sobre dist/<familia>.js
// con `vue` y `@grana/vue*` externos (lo que paga una aplicación que usa una o dos secciones), `gzip -c` equivalente (zlib
// nivel 6). Uso: node scripts/measure-partial.mjs [tope=4096] [familia=marketing] [Prefijo=tope…]  → imprime «Variante
// bytes» y sale con 1 si alguna lo supera (VERBOSE=1 lista todas). `Prefijo=tope`: tope propio de las variantes cuyo nombre
// empieza por el prefijo (Booking: GbGuestForm=7168, #887).
import { build } from 'esbuild'
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const cap = Number(process.argv[2] || 4096)
const family = process.argv[3] || 'marketing'
const own = process.argv.slice(4).map((a) => a.split('=')).filter(([k, v]) => k && v).map(([k, v]) => [k, Number(v)])
const capOf = (name) => { const hit = own.find(([k]) => name.startsWith(k)); return hit ? hit[1] : cap }
const entry = resolve(root, `dist/${family}.js`)
const names = [...readFileSync(entry, 'utf8').matchAll(/\bas (Gb[A-Za-z]+\d\d)\b/g)].map((m) => m[1])
const variants = [...new Set(names.length ? names : [...readFileSync(resolve(root, `src/${family}.js`), 'utf8').matchAll(/\bGb[A-Za-z]+\d\d\b/g)].map((m) => m[0]))].sort()
let worst = { name: '', size: 0 }
let failed = 0
for (const name of variants) {
  const out = await build({
    stdin: { contents: `export { ${name} } from ${JSON.stringify(entry)}`, resolveDir: root, loader: 'js' },
    bundle: true, format: 'esm', write: false, treeShaking: true, minify: true,
    external: ['vue', '@grana/vue', '@grana/vue/*']
  })
  const size = gzipSync(out.outputFiles[0].contents).length
  if (size > worst.size) worst = { name, size }
  if (size > capOf(name)) { failed++; console.log(`${name} ${size} > ${capOf(name)}`) }
  else if (process.env.VERBOSE) console.log(`${name} ${size}`)
}
console.log(`${family}: ${variants.length} variantes; la mayor: ${worst.name} ${worst.size} B gzip (tope ${cap}${own.length ? `; ${own.map(([k, v]) => `${k} ${v}`).join(', ')}` : ''})`)
process.exit(failed ? 1 : 0)
