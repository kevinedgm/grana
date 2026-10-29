// Texto editable con puntero grueso (DECISIONS.md #970 a #972, api.md «Texto editable con puntero grueso», criterio 8):
// el literal `16px` solo puede aparecer en las hojas de los componentes dentro de `@media (pointer: coarse)`, en
// `font-size` o en el alias local que lo lleva (`--_fs`), y como piso de un `max()`. Fuera de ahí (un `16px` suelto, o
// en otra propiedad, o fuera de la consulta) es un literal de tema y un error. Los verificadores de coco que listan
// literales permitidos lo admiten solo en ese sitio. Vigila también las hojas de `@grana/blocks`.
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'

const ROOT = resolve(process.cwd(), '..', '..')

function cssFiles(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) cssFiles(p, out)
    else if (name.endsWith('.css')) out.push(p)
  }
  return out
}

// Declaraciones con su pila de preludios (@media, @layer, selectores): recorrido por llaves, sin comentarios.
function declarations(text) {
  const src = text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  const stack = []
  const out = []
  let buf = ''
  let line = 1
  let startLine = 1
  for (const ch of src) {
    if (ch === '\n') line++
    if (ch === '{') {
      stack.push(buf.trim())
      buf = ''
      startLine = line
    } else if (ch === '}') {
      if (buf.trim()) out.push({ decl: buf.trim(), stack: [...stack], line: startLine })
      stack.pop()
      buf = ''
      startLine = line
    } else if (ch === ';') {
      if (buf.trim()) out.push({ decl: buf.trim(), stack: [...stack], line: startLine })
      buf = ''
      startLine = line
    } else {
      if (!buf.trim()) startLine = line
      buf += ch
    }
  }
  return out
}

const files = [...cssFiles(resolve(ROOT, 'packages/vue/src/components')), ...cssFiles(resolve(ROOT, 'packages/blocks/src'))]
const LITERAL = /(?<![\d.\w-])16px(?![\w])/
const COARSE = /@media[^{]*\(\s*pointer\s*:\s*coarse\s*\)/

describe('16px solo con puntero grueso (#970 a #972, criterio 8)', () => {
  it('hay hojas que revisar', () => {
    expect(files.length).toBeGreaterThan(50)
  })

  it('cada `16px` está en font-size o --_fs, dentro de @media (pointer: coarse) y como piso de max()', () => {
    const bad = []
    let total = 0
    for (const f of files) {
      for (const { decl, stack, line } of declarations(readFileSync(f, 'utf8'))) {
        if (!LITERAL.test(decl)) continue
        total++
        const i = decl.indexOf(':')
        const prop = decl.slice(0, i).trim()
        const value = decl.slice(i + 1)
        const where = `${f.replace(ROOT + '/', '')}:${line}`
        if (!stack.some((s) => COARSE.test(s))) bad.push(`${where}: 16px fuera de @media (pointer: coarse) → ${decl}`)
        else if (prop !== 'font-size' && prop !== '--_fs') bad.push(`${where}: 16px en «${prop}» (solo font-size o --_fs) → ${decl}`)
        else if (!/max\(\s*16px\s*,/.test(value)) bad.push(`${where}: 16px sin ser el piso de max(16px, …) → ${decl}`)
      }
    }
    expect(bad).toEqual([])
    // Con la pieza 1 entregada hay un 16px por hoja de la lista (api.md): si no hay ninguno, el test no mide nada
    expect(total).toBeGreaterThan(0)
  })

  it('el recorrido distingue un 16px fuera de la consulta (comprobación del propio test)', () => {
    const ds = declarations('.a { font-size: 16px; }\n@media (pointer: coarse) { .a { --_fs: max(16px, var(--_fs-role)); } }')
    const hits = ds.filter((d) => LITERAL.test(d.decl))
    expect(hits).toHaveLength(2)
    expect(hits[0].stack.some((s) => COARSE.test(s))).toBe(false)
    expect(hits[1].stack.some((s) => COARSE.test(s))).toBe(true)
  })
})
