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
  it('ningún componente lee --g-color-brand* ni --g-color-on-brand*: usan primary', () => {
    const bad = css.filter((f) => /--g-color-(on-)?brand(?![a-z])/.test(readFileSync(join(root, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')))
    expect(bad).toEqual([])
  })

  it('hay componentes que usan primary (la prueba no es vacía)', () => {
    const using = css.filter((f) => /--g-color-primary/.test(readFileSync(join(root, f), 'utf8')))
    expect(using.length).toBeGreaterThan(10)
  })
})
