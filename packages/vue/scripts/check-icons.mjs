// Vigilante de la regla «Lucide es la única fuente de iconos» (docs/contract/icons.md §7, DECISIONS.md #87).
// Busca glifos pictográficos, `content:` con escapes de glifos y `clip-path: polygon(` (pictogramas dibujados con CSS).
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
export const ROOT = resolve(here, '../../..')

// Glifos que funcionan como icono (no incluye × de las dimensiones ni las flechas de los textos)
const GLYPHS = /[✓✔✕✖✗✘▲▼◆●■▶◀›‹⚠⋮⋯✎⧉➜↗]/u
const SKIP = new Set(['node_modules', 'dist', '.git', 'lucide.js', 'lucide-icons.js', 'THIRD-PARTY-NOTICES.md'])

const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue
    const path = resolve(dir, name)
    if (statSync(path).isDirectory()) walk(path, out)
    else if (/\.(vue|css|html)$/.test(name) || (name === 'README.md' && path.includes('/packages/'))) out.push(path)
  }
  return out
}

const stripComments = (text, file) => {
  let t = text.replace(/\/\*[\s\S]*?\*\//g, '')
  if (/\.(html|vue|md)$/.test(file)) t = t.replace(/<!--[\s\S]*?-->/g, '')
  if (/\.(vue|html)$/.test(file)) t = t.replace(/(^|[^:'"\w])\/\/[^\n]*/g, '$1')
  return t
}

/** @returns {Record<string, string[]>} archivo (relativo a la raíz) → códigos de infracción */
export const scan = (roots = ['packages/vue/src', 'packages/vue/playground', 'packages/vue/README.md', 'design/lab'].map((p) => resolve(ROOT, p))) => {
  const found = {}
  const files = roots.flatMap((r) => { try { return statSync(r).isDirectory() ? walk(r) : [r] } catch { return [] } })
  for (const file of files) {
    const text = stripComments(readFileSync(file, 'utf8'), file)
    const codes = []
    if (GLYPHS.test(text)) codes.push('glifo')
    if (/\.css$/.test(file)) {
      if (/content:\s*"[^"]*\\(?!00a0|a\b|A\b)[0-9a-fA-F]+/.test(text)) codes.push('content-escape')
      if (/clip-path:\s*polygon\(/.test(text)) codes.push('clip-path')
    }
    if (codes.length) found[relative(ROOT, file)] = codes
  }
  return found
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const r = scan()
  for (const [f, c] of Object.entries(r)) console.log(`${c.join(',').padEnd(24)} ${f}`)
  console.log(`${Object.keys(r).length} archivos`)
}
