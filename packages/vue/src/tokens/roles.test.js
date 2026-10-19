// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

// tokens.md §17: los componentes leen roles de interfaz (primary), no la identidad (brand)
const root = fileURLToPath(new URL('../components', import.meta.url))
const css = readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .flatMap((d) => readdirSync(join(root, d.name)).filter((f) => f.endsWith('.css')).map((f) => join(d.name, f)))

describe('roles de color en los componentes (tokens.md §17)', () => {
  // Excepción (#694, tokens.md §12.1 y §44.2): el anillo exterior de la isla de estado en claro lee la tinta de la zona,
  // --g-color-on-brand-zone, para separarse de una cabecera de marca. Solo ese token y solo en GStatusIsland.css.
  const EXCEPTIONS = { 'GStatusIsland/GStatusIsland.css': ['--g-color-on-brand-zone'] }
  it('ningún componente lee --g-color-brand* ni --g-color-on-brand*: usan primary (salvo la excepción de #694)', () => {
    const bad = []
    for (const f of css) {
      const text = readFileSync(join(root, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
      for (const m of text.matchAll(/--g-color-(?:on-)?brand(?![a-z])[a-z0-9-]*/g)) {
        if (!(EXCEPTIONS[f.split('\\').join('/')] || []).includes(m[0])) bad.push(`${f}: ${m[0]}`)
      }
    }
    expect(bad).toEqual([])
  })

  it('la excepción de #694 existe y es la única: GStatusIsland.css lee --g-color-on-brand-zone', () => {
    const text = readFileSync(join(root, 'GStatusIsland', 'GStatusIsland.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(text).toMatch(/var\(--g-color-on-brand-zone\)/)
    expect(Object.keys(EXCEPTIONS)).toEqual(['GStatusIsland/GStatusIsland.css'])
  })

  it('hay componentes que usan primary (la prueba no es vacía)', () => {
    const using = css.filter((f) => /--g-color-primary/.test(readFileSync(join(root, f), 'utf8')))
    expect(using.length).toBeGreaterThan(10)
  })
})
