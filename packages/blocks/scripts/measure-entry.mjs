// Peso de una entrada de @grana/blocks con los trozos que importa (dueño: bruno; _comun.md §19: «la medida de peso de una
// entrada incluye los trozos que importa»). Vite pone lo de common/ que usan dos familias en un trozo compartido
// (dist/GbActions-*.js); aquí se suman la entrada y sus trozos, una vez cada uno, y se mide con `gzip -c` (zlib nivel 6).
// Uso: node scripts/measure-entry.mjs <familia> [tope]  → imprime los bytes; con tope, sale con 1 si lo supera.
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../dist')
const family = process.argv[2] || 'marketing'
const cap = process.argv[3] ? Number(process.argv[3]) : Infinity
const seen = new Set()
const parts = []
;(function add(file) {
  if (seen.has(file)) return
  seen.add(file)
  const code = readFileSync(resolve(dist, file), 'utf8')
  parts.push(code)
  for (const m of code.matchAll(/from\s+["']\.\/([^"']+\.js)["']/g)) add(m[1])
})(`${family}.js`)
const size = gzipSync(Buffer.from(parts.join('\n'))).length
console.log(`${family}.js + ${seen.size - 1} trozo(s): ${size} B gzip${Number.isFinite(cap) ? ` (tope ${cap})` : ''}`)
process.exit(size > cap ? 1 : 0)
