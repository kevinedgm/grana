// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

// tokens.md §17 (DECISIONS.md #94, #107): los componentes leen tokens del tema, no valores primitivos ni semillas.
//  - no leen semillas (`--g-seed-*`) ni literales de color (hex, rgb, hsl);
//  - todo `var(--g-*)` existe en defaults.css (los tokens del tema) o lo declara el propio componente (un token de componente registrado).
const root = fileURLToPath(new URL('../components', import.meta.url))
const defaults = readFileSync(fileURLToPath(new URL('../styles/defaults.css', import.meta.url)), 'utf8')
const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '')
const sheets = readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .flatMap((d) => readdirSync(join(root, d.name)).filter((f) => f.endsWith('.css')).map((f) => ({ name: `${d.name}/${f}`, css: strip(readFileSync(join(root, d.name, f), 'utf8')) })))

describe('niveles de tokens en los componentes (tokens.md §17)', () => {
  it('hay hojas de estilo que comprobar', () => { expect(sheets.length).toBeGreaterThan(20) })

  it('ningún componente lee semillas (--g-seed-*)', () => {
    expect(sheets.filter((s) => /var\(--g-seed-/.test(s.css)).map((s) => s.name)).toEqual([])
  })

  it('ningún componente escribe colores literales (hex, rgb, hsl); solo tokens y colores del sistema', () => {
    const bad = sheets.filter((s) => /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\((?!\s*(?:var|from))/.test(s.css)).map((s) => s.name)
    expect(bad).toEqual([])
  })

  it('todo var(--g-*) existe en defaults.css o lo declara el propio componente', () => {
    const bad = {}
    for (const s of sheets) {
      const declared = new Set([...s.css.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
      for (const m of s.css.matchAll(/var\((--g-[a-z0-9-]+)/g)) if (!defined.has(m[1]) && !declared.has(m[1])) (bad[s.name] ??= new Set()).add(m[1])
    }
    expect(Object.fromEntries(Object.entries(bad).map(([k, v]) => [k, [...v]]))).toEqual({})
  })

  it('ningún componente redeclara un token del tema (un componente no redefine roles: los define el tema)', () => {
    const bad = {}
    for (const s of sheets) for (const m of s.css.matchAll(/(--g-[a-z0-9-]+)\s*:/g)) if (defined.has(m[1])) (bad[s.name] ??= new Set()).add(m[1])
    expect(Object.fromEntries(Object.entries(bad).map(([k, v]) => [k, [...v]]))).toEqual({})
  })
})
