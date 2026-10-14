#!/usr/bin/env node
// Comprueba que cada prop de un `*.meta.json` consta en la tabla Props del README
// de su componente (o del README que lo documenta). Sale con código 1 si falta alguna.
// Uso: node scripts/check-readme-props.mjs [--verbose]
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'components')
const verbose = process.argv.includes('--verbose')
const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase())

// Nombres documentados en las tablas de props: toda tabla cuya primera celda de
// encabezado empieza por «Prop» («Prop», «Props», «Prop de `GInputGroup`»…).
function namesIn(md) {
  const names = new Set()
  let inFence = false
  let inProps = false
  for (const line of md.split('\n')) {
    if (/^```/.test(line)) { inFence = !inFence; continue }
    if (inFence) continue
    if (!line.trim().startsWith('|')) { inProps = false; continue }
    const first = line.split('|')[1] || ''
    if (/^\s*-+\s*$/.test(first) || /^\s*:?-+:?\s*$/.test(first)) continue
    if (!inProps) { inProps = /^\s*props?\b/i.test(first); continue }
    for (const m of first.matchAll(/`([^`]+)`/g)) {
      for (const part of m[1].split(/[\s,/]+/)) {
        const n = camel(part.replace(/^:/, '').replace(/^v-model:?/, ''))
        if (n) names.add(n)
        if (part === 'v-model') names.add('modelValue')
      }
    }
  }
  return names
}

// Texto de la sección de `md` cuyo encabezado nombra a `name` (hasta un encabezado de su nivel o superior).
function sectionOf(md, name) {
  const lines = md.split('\n')
  let out = null
  let level = 0
  let inFence = false
  for (const line of lines) {
    if (/^```/.test(line)) inFence = !inFence
    const h = !inFence && /^(#{1,6})\s+(.*)$/.exec(line)
    if (h) {
      if (out === null && new RegExp(`\\b${name}\\b`).test(h[2])) { out = []; level = h[1].length; continue }
      if (out !== null && h[1].length <= level) break
    }
    if (out !== null) out.push(line)
  }
  return out ? out.join('\n') : ''
}

const dirs = readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
const readmes = new Map(dirs.filter((d) => existsSync(join(root, d, 'README.md'))).map((d) => [d, readFileSync(join(root, d, 'README.md'), 'utf8')]))

let missing = 0
let checked = 0
for (const dir of dirs) {
  for (const f of readdirSync(join(root, dir)).filter((x) => x.endsWith('.meta.json'))) {
    const meta = JSON.parse(readFileSync(join(root, dir, f), 'utf8'))
    // README propio; si no hay, el de otro componente que lo nombre en un encabezado.
    let owner = readmes.has(dir) ? dir : [...readmes].find(([, t]) => new RegExp(`^#+ .*\\b${meta.name}\\b`, 'm').test(t))?.[0]
    if (!owner) { console.log(`SIN README  ${meta.name}`); missing++; continue }
    const text = readmes.get(owner)
    let doc = namesIn(text)
    // README de remisión (sin tablas de props): la documentación está en el README enlazado.
    if (!doc.size) for (const [, target] of text.matchAll(/\]\(\.\.\/(G\w+)\/README\.md/g)) {
      if (readmes.has(target)) doc = new Set([...doc, ...namesIn(sectionOf(readmes.get(target), meta.name))])
    }
    const raw = (meta.props || []).map((p) => p.name)
    const compound = raw.filter((n) => /[\s/,]/.test(n))
    if (compound.length) console.log(`AVISO   ${meta.name}: ${f} tiene prop(s) con nombre compuesto (${compound.join(' | ')}); un nombre de prop no admite espacios ni «/»`)
    const props = raw.flatMap((n) => n.split(/[\s/,]+/).filter(Boolean))
    const faltan = props.filter((p) => !doc.has(p))
    checked += props.length
    if (faltan.length) { missing += faltan.length; console.log(`FALTAN  ${meta.name} (${owner}/README.md): ${faltan.join(', ')}`) }
    else if (verbose) console.log(`ok      ${meta.name}: ${props.length} props`)
  }
}
console.log(missing ? `\n${missing} prop(s) sin documentar de ${checked}.` : `\nTodas las props (${checked}) constan en las tablas Props.`)
process.exit(missing ? 1 : 0)
