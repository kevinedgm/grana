#!/usr/bin/env node
// Comprueba que cada traducción `<archivo>.en.md` conserva la forma de su original en español:
// mismos encabezados (número, orden y nivel: el sitio enlaza las anclas por posición), los mismos
// bloques de código en el mismo lenguaje (incluidos los `vue demo`) y los mismos destinos de enlace.
//   node site/scripts/check-translations.mjs [archivo.en.md …]   (sin argumentos: todos los del repositorio)
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
const args = process.argv.slice(2)
const files = args.length
  ? args.map((f) => path.relative(root, path.resolve(f)))
  : execSync('git ls-files --cached --others --exclude-standard "*.en.md"', { cwd: root, encoding: 'utf8' })
      .split('\n')
      .filter((f) => f && !f.includes('node_modules/'))

function shape(text) {
  const headings = []
  const code = []
  const links = []
  let fence = null
  let buf = []
  for (const line of text.split('\n')) {
    const m = line.match(/^(\s*)(`{3,}|~{3,})(.*)$/)
    if (fence) {
      if (m && m[2][0] === fence[0] && m[2].length >= fence.length && !m[3].trim()) {
        code.push(buf.join('\n'))
        fence = null
        buf = []
      } else buf.push(line)
      continue
    }
    if (m) {
      fence = m[2]
      buf = [m[3].trim()]
      continue
    }
    const h = line.match(/^(#{1,6})\s+\S/)
    if (h) headings.push(h[1].length)
    // Solo el destino, sin el ancla: una traducción puede usar las anclas de sus propios encabezados
    // (el sitio las resuelve por posición, porque los encabezados coinciden en número y orden).
    // Los enlaces externos pueden ir a la versión en inglés de la misma página (semver.org/lang/es/ → semver.org/).
    for (const l of line.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) links.push(/^[a-z]+:/i.test(l[1]) ? 'externo' : l[1].split('#')[0] || '#')
  }
  return { headings, code, links }
}

let bad = 0
for (const en of files) {
  const es = en.replace(/\.en\.md$/, '.md')
  if (!fs.existsSync(path.join(root, es))) {
    console.log(`✗ ${en}: no existe el original ${es}`)
    bad++
    continue
  }
  const a = shape(fs.readFileSync(path.join(root, es), 'utf8'))
  const b = shape(fs.readFileSync(path.join(root, en), 'utf8'))
  const errs = []
  if (a.headings.join() !== b.headings.join()) {
    const i = a.headings.findIndex((x, k) => x !== b.headings[k])
    errs.push(`encabezados: ${a.headings.length} en el original y ${b.headings.length} en la traducción (primer desajuste en el n.º ${i + 1})`)
  }
  if (a.code.length !== b.code.length) errs.push(`bloques de código: ${a.code.length} en el original y ${b.code.length} en la traducción`)
  // Mismo lenguaje en cada bloque (`vue demo` sigue siendo `vue demo`); el contenido puede traducir
  // comentarios y textos visibles, así que no se compara byte a byte.
  else a.code.forEach((c, i) => { const la = c.split('\n')[0], lb = b.code[i].split('\n')[0]; if (la !== lb) errs.push(`bloque de código n.º ${i + 1}: «${la}» en el original y «${lb}» en la traducción`) })
  if (a.links.join('\n') !== b.links.join('\n')) {
    const i = a.links.findIndex((x, k) => x !== b.links[k])
    errs.push(`enlaces: ${a.links.length} en el original y ${b.links.length} en la traducción (primer desajuste: «${a.links[i]}» frente a «${b.links[i]}»)`)
  }
  if (errs.length) {
    bad++
    console.log(`✗ ${en}\n  - ${errs.join('\n  - ')}`)
  }
}
console.log(bad ? `\n${bad} de ${files.length} traducciones no conservan la forma del original.` : `${files.length} traducciones conservan la forma del original.`)
process.exit(bad ? 1 : 0)
