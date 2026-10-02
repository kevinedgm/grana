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

  // Propiedades públicas de solo lectura que publica una primitiva para los componentes que la componen (su raíz ES esa
  // primitiva). Excepción acotada y nombrada, no un comodín: `--g-surface-padding` la declara GSurface.css (DECISIONS.md
  // #131, surface.md «Cambio aparte», tokens.md §19) y solo la lee GCard, cuya raíz es una GSurface.
  const PUBLISHED = { 'GSurface/GSurface.css': ['--g-surface-padding'] }
  const COMPOSES = { 'GCard/GCard.css': ['GSurface/GSurface.css'] }

  it('las propiedades publicadas existen en su primitiva y no son tokens del tema', () => {
    for (const [sheet, names] of Object.entries(PUBLISHED)) {
      const s = sheets.find((x) => x.name === sheet)
      expect(s, sheet).toBeTruthy()
      for (const n of names) {
        expect(s.css, `${sheet} declara ${n}`).toMatch(new RegExp(`${n}\\s*:`))
        expect(defined.has(n), `${n} no es un token de defaults.css`).toBe(false)
      }
    }
  })

  it('todo var(--g-*) existe en defaults.css o lo declara el propio componente (o la primitiva que compone, si la publica)', () => {
    const bad = {}
    for (const s of sheets) {
      const declared = new Set([...s.css.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
      for (const p of COMPOSES[s.name] ?? []) for (const n of PUBLISHED[p] ?? []) declared.add(n)
      for (const m of s.css.matchAll(/var\((--g-[a-z0-9-]+)/g)) if (!defined.has(m[1]) && !declared.has(m[1])) (bad[s.name] ??= new Set()).add(m[1])
    }
    expect(Object.fromEntries(Object.entries(bad).map(([k, v]) => [k, [...v]]))).toEqual({})
  })

  // Anfitrionas de `--g-divider-inset` (DECISIONS.md, decisiones 191 y 195): es un token del tema (defaults.css, :root) que
  // HEREDA GDivider; lo redefinen los consumidores en sus anfitrionas. Un componente de Grana solo puede hacerlo si está
  // nombrado aquí (excepción acotada, como PUBLISHED). Hoy, vacío; único candidato previsto: GFormSection/GFormSection.css
  // en la Fase 3, solo si su contrato lo pide y por decisión de lima.
  const DIVIDER_INSET_HOSTS = {}

  it('--g-divider-inset es un token del tema; GDivider solo lo lee y solo lo redefinen las anfitrionas nombradas (hoy ninguna)', () => {
    expect(defined.has('--g-divider-inset')).toBe(true)
    const divider = sheets.find((x) => x.name === 'GDivider/GDivider.css')
    expect(divider).toBeTruthy()
    expect(divider.css).toMatch(/var\(--g-divider-inset\)/)
    expect(divider.css).not.toMatch(/--g-divider-inset\s*:/)
    const hosts = sheets.filter((x) => /--g-divider-inset\s*:/.test(x.css)).map((x) => x.name).sort()
    expect(hosts).toEqual(Object.keys(DIVIDER_INSET_HOSTS).sort())
  })

  it('ningún componente redeclara un token del tema (un componente no redefine roles: los define el tema)', () => {
    const bad = {}
    for (const s of sheets) {
      for (const m of s.css.matchAll(/(--g-[a-z0-9-]+)\s*:/g)) {
        if (m[1] === '--g-divider-inset' && DIVIDER_INSET_HOSTS[s.name]) continue
        if (defined.has(m[1])) (bad[s.name] ??= new Set()).add(m[1])
      }
    }
    expect(Object.fromEntries(Object.entries(bad).map(([k, v]) => [k, [...v]]))).toEqual({})
  })
})
