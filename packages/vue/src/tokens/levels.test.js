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

  // Propiedades públicas de ENTRADA (api.md «Cabecera fija de la aplicación: una variable», #484, #629): longitudes que pone
  // la aplicación con el alto de su cabecera fija. No son del tema: no están en defaults.css; las registra su hoja con
  // @property (<length>, hereda, 0px) y su hoja las pone a 0 dentro de .g-dialog__body (#517). Excepción acotada y nombrada.
  const PUBLIC_INPUTS = {
    'GAccordion/GAccordion.css': ['--g-accordion-sticky-top'],
    'GPageHeader/GPageHeader.css': ['--g-page-header-top']
  }

  it('las propiedades públicas de entrada las registra su hoja con @property y no son tokens del tema', () => {
    for (const [sheet, names] of Object.entries(PUBLIC_INPUTS)) {
      const s = sheets.find((x) => x.name === sheet)
      expect(s, sheet).toBeTruthy()
      for (const n of names) {
        expect(defined.has(n), `${n} no es un token de defaults.css`).toBe(false)
        const reg = s.css.match(new RegExp(`@property\\s+${n}\\s*\\{([^}]*)\\}`))
        expect(reg, `${sheet} registra ${n} con @property`).toBeTruthy()
        expect(reg[1]).toMatch(/syntax:\s*["']<length>["']/)
        expect(reg[1]).toMatch(/inherits:\s*true/)
        expect(s.css, `${sheet} pone ${n} a 0 en .g-dialog__body`).toMatch(new RegExp(`\\.g-dialog__body\\s*\\{[^}]*${n}\\s*:`))
      }
    }
  })

  // Familia condicional de categorías (tokens.md §16.3 y §24; speech.md §23.6 y §28.1; DECISIONS.md #247): `--g-color-cat-K`,
  // `-strong`, `-soft`, `-text`, `--g-color-on-cat-K` y `--g-color-on-cat-K-soft` (K = 1 a 12) solo los emite el tema cuando su
  // configuración trae `categories: N`; defaults.css NO los define (por defecto `categories: 0`) y no debe definirlos. Por eso
  // no pasan la regla «existe en defaults.css». Excepción acotada y nombrada, no un comodín: solo las hojas de este mapa
  // pueden LEER la familia, sin valores de respaldo y con K entero de 1 a 12 (hoy, GTranscript pinta la marca de letra del
  // hablante con `[data-cat="k"]`, que solo se pinta si k <= speakerColors; GAvatar, su relleno con `[data-cat="k"]`, solo
  // `cat-K-soft` y `on-cat-K-soft`, #294). Ninguna hoja la declara (ni siquiera estas).
  const CAT_FAMILY_READERS = {
    'GTranscript/GTranscript.css': 'marca de letra del hablante (speakerColors: n)',
    'GAvatar/GAvatar.css': 'relleno del avatar por categoría (color / categories)',
    'GTag/GTag.css': 'etiqueta por categoría: relleno, pulsada, contorno y raya (color / categories)',
    'GTagGroup/GTagGroup.css': 'lomo del racimo (layout facets)'
  }
  const K = '(?:[1-9]|1[0-2])'
  const CAT_OK = new RegExp(`^--g-color-(?:cat-${K}(?:-strong|-soft|-text)?|on-cat-${K}(?:-soft)?)$`)
  const CAT_ANY = /^--g-color-(?:on-)?cat-/

  it('todo var(--g-*) existe en defaults.css o lo declara el propio componente (o la primitiva que compone, si la publica)', () => {
    const bad = {}
    for (const s of sheets) {
      const declared = new Set([...s.css.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
      for (const p of COMPOSES[s.name] ?? []) for (const n of PUBLISHED[p] ?? []) declared.add(n)
      for (const m of s.css.matchAll(/var\((--g-[a-z0-9-]+)/g)) {
        if (s.name in CAT_FAMILY_READERS && CAT_OK.test(m[1])) continue
        if (!defined.has(m[1]) && !declared.has(m[1])) (bad[s.name] ??= new Set()).add(m[1])
      }
    }
    expect(Object.fromEntries(Object.entries(bad).map(([k, v]) => [k, [...v]]))).toEqual({})
  })

  it('la familia de categorías (--g-color-cat-*, --g-color-on-cat-*) la leen solo las hojas nombradas, nunca está en defaults.css y nadie la declara', () => {
    expect([...defined].filter((n) => CAT_ANY.test(n))).toEqual([])
    const readers = {}
    const declared = {}
    for (const s of sheets) {
      for (const m of s.css.matchAll(/var\((--g-color-(?:on-)?cat-[a-z0-9-]*)/g)) (readers[s.name] ??= new Set()).add(m[1])
      for (const m of s.css.matchAll(/(--g-color-(?:on-)?cat-[a-z0-9-]*)\s*:/g)) (declared[s.name] ??= new Set()).add(m[1])
    }
    expect(Object.fromEntries(Object.entries(declared).map(([k, v]) => [k, [...v]]))).toEqual({})
    const outside = Object.entries(readers).filter(([name]) => !(name in CAT_FAMILY_READERS))
    expect(Object.fromEntries(outside.map(([k, v]) => [k, [...v]]))).toEqual({})
    const malformed = Object.entries(readers).flatMap(([, v]) => [...v]).filter((n) => !CAT_OK.test(n))
    expect(malformed).toEqual([])
  })

  it('el mapa de lectoras de la familia de categorías es válido (las hojas nombradas existen, salvo las aún por llegar)', () => {
    for (const name of Object.keys(CAT_FAMILY_READERS)) expect(name).toMatch(/^G[A-Za-z]+\/G[A-Za-z]+\.css$/)
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

// Zona de marca (tokens.md §44.5, DECISIONS.md #623): todo token del bloque claro de defaults.css se redeclara en el
// bloque [data-g-zone="brand"] o está en la lista de «no se redeclaran». Un token nuevo del grupo de color que falte en
// los dos se resolvería en :root dentro de la zona (el fallo de la integración real).
describe('zona de marca · lista del grupo (tokens.md §44.5)', () => {
  const block = (re) => { const m = re.exec(strip(defaults)); return m ? m[1] : '' }
  const light = block(/:root,\s*\[data-theme="light"\]\s*\{([\s\S]*?)\n\}/)
  const zone = block(/\[data-g-zone="brand"\]\s*\{([\s\S]*?)\n\}/)
  const names = (css) => new Set([...css.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  const SOURCES = ['brand-zone', 'on-brand-zone', 'on-brand-muted', 'on-brand-accent', 'on-brand-success', 'on-brand-warning', 'on-brand-danger', 'on-brand-info', 'on-brand-veil', 'on-brand-accent-veil', 'zone-edge'].map((n) => `--g-color-${n}`)
  // Rellenos con su propio par (§44.5) y velo modal y media; --g-glass-filter no es color (el del tema del usuario sigue valiendo)
  const KEPT = [
    ...['success', 'warning', 'danger', 'info'].flatMap((s) => [s, `${s}-strong`, `${s}-soft`, `on-${s}`, `on-${s}-soft`].map((n) => `--g-color-${n}`)),
    '--g-surface-backdrop', '--g-card-scrim', '--g-card-on-scrim', '--g-glass-filter',
    ...SOURCES
  ]

  it('hay bloque claro y bloque de la zona', () => {
    expect(names(light).size).toBeGreaterThan(80)
    expect(names(zone).size).toBeGreaterThan(50)
  })

  it('todo token del bloque claro está en la zona o en «no se redeclaran»', () => {
    const z = names(zone)
    expect([...names(light)].filter((n) => !z.has(n) && !KEPT.includes(n))).toEqual([])
  })

  it('la zona no redeclara lo que no debe (las fuentes, los rellenos con su par, el velo modal)', () => {
    const z = names(zone)
    expect(KEPT.filter((n) => z.has(n))).toEqual([])
  })

  it('la zona solo redeclara tokens que existen en el bloque claro', () => {
    const l = names(light)
    expect([...names(zone)].filter((n) => !l.has(n))).toEqual([])
  })

  it('las fuentes están en los tres bloques de esquema', () => {
    const media = block(/@media \(prefers-color-scheme: dark\)\s*\{([\s\S]*?)\n\}/)
    const dark = block(/\n\[data-theme="dark"\]\s*\{([\s\S]*?)\n\}/)
    for (const css of [light, media, dark]) expect(SOURCES.filter((n) => !names(css).has(n))).toEqual([])
  })

  it('ningún componente lee las fuentes de la zona, salvo GSurface.css con --g-color-zone-edge', () => {
    const bad = []
    for (const s of sheets) {
      for (const m of s.css.matchAll(/var\((--g-color-[a-z0-9-]+)/g)) {
        if (!SOURCES.includes(m[1])) continue
        if (s.name === 'GSurface/GSurface.css' && m[1] === '--g-color-zone-edge') continue
        bad.push(`${s.name}: ${m[1]}`)
      }
    }
    expect(bad).toEqual([])
  })
})
