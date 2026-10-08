import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildTheme, categoryBases, contrast, distance, parseHex, semanticAdjustments, separate, tintedNeutrals, toOklch, usageOf, MIN_DISTANCE } from '../src/index.js'
import { readConfig } from '../src/config.js'
import { DARK } from '../src/defaults.js'
import { run } from '../src/cli.js'

const lch = (hex) => toOklch(parseHex(hex))
const hueDiff = (a, b) => Math.abs(((a - b + 540) % 360) - 180)

describe('semánticos sin choque con la marca', () => {
  it('no toca nada si la marca y el acento no se parecen a un semántico', () => {
    expect(semanticAdjustments({ brand: '#0B1F4D', accent: '#6D28D9' })).toEqual({})
    expect(semanticAdjustments({})).toEqual({})
  })

  it('una marca roja separa «danger» (a ≥ 0.12 de la marca y del acento, en claro y en oscuro)', () => {
    const adj = semanticAdjustments({ brand: '#9D1635', accent: '#D85A70' })
    expect(Object.keys(adj)).toEqual(['danger'])
    expect(adj.danger.ok).toBe(true)
    expect(distance(lch(adj.danger.hex), lch('#9D1635'))).toBeGreaterThanOrEqual(MIN_DISTANCE)
    expect(distance(lch(adj.danger.hex), lch('#D85A70'))).toBeGreaterThanOrEqual(MIN_DISTANCE)
  })

  it('un acento verde azulado separa «success»; una marca gris separa «info» de un acento azul', () => {
    expect(Object.keys(semanticAdjustments({ brand: '#7A1F5C', accent: '#0F766E' }))).toEqual(['success'])
    expect(Object.keys(semanticAdjustments({ brand: '#1F1F1F', accent: '#0B63CE' }))).toEqual(['info'])
  })

  it('el giro es el mínimo: no sale de ±45° de tono ni de ±0.15 de luminosidad', () => {
    const adj = semanticAdjustments({ brand: '#9D1635', accent: '#D85A70' }).danger
    expect(Math.abs(adj.dh)).toBeLessThanOrEqual(45)
    expect(Math.abs(adj.dl)).toBeLessThanOrEqual(0.15 + 1e-9)
  })

  it('separate devuelve el color tal cual si ya está lejos', () => {
    const r = separate('#1E7A46', ['#9D1635'])
    expect(r.changed).toBe(false)
    expect(r.dh).toBe(0)
  })

  it('si no hay forma de separarlo lo dice (ok: false) y el tema avisa', () => {
    const r = buildTheme({ brand: '#0F7A55' })
    const warn = r.issues.filter((i) => i.id === 'semantic-close')
    expect(warn.length).toBeGreaterThan(0)
    expect(warn[0].severity).toBe('warning')
    expect(r.ok).toBe(true)
  })

  it('el tema emite los seis tokens del semántico ajustado, en claro y en oscuro, con contraste (con "semanticCollision": "adjust")', () => {
    const r = buildTheme({ brand: '#9D1635', accent: '#D85A70', semanticCollision: 'adjust' })
    expect(r.ok).toBe(true)
    expect(r.generated['--g-color-danger']).not.toBe('#C4321F')
    for (const k of ['', '-strong', '-soft', '-text']) expect(r.generated[`--g-color-danger${k}`]).toBeDefined()
    expect(r.dark.generated['--g-color-danger']).toBeDefined()
    expect(r.notes.some((n) => n.code === 'semantic-adjusted' && /danger/.test(n.message))).toBe(true)
    expect(r.issues.filter((i) => i.severity === 'error')).toEqual([])
  })

  it('un override de «danger» gana a la derivación (y se avisa si queda pegado a la marca)', () => {
    const r = buildTheme({ brand: '#9D1635', semanticCollision: 'adjust', overrides: { '--g-color-danger': '#C4321F' } })
    expect(r.generated['--g-color-danger']).toBe('#C4321F')
    expect(r.issues.some((i) => i.id === 'semantic-close')).toBe(true)
  })
})

describe('neutros teñidos', () => {
  it('llevan el tono de la marca a croma bajo y conservan el contraste (texto 4.5:1, control 3:1)', () => {
    for (const dark of [false, true]) {
      const n = tintedNeutrals('#9D1635', { dark })
      const surface = parseHex(dark ? n['--g-color-surface'] : '#FFFFFF')
      const sunken = parseHex(n['--g-color-surface-sunken'])
      expect(lch(n['--g-color-text']).c).toBeGreaterThan(0)
      expect(lch(n['--g-color-text']).c).toBeLessThanOrEqual(0.021)
      expect(hueDiff(lch(n['--g-color-text-muted']).h, lch('#9D1635').h)).toBeLessThan(6)
      for (const bg of [surface, sunken]) {
        for (const t of ['--g-color-text', '--g-color-text-muted', '--g-color-text-subtle']) expect(contrast(parseHex(n[t]), bg)).toBeGreaterThanOrEqual(4.5)
        expect(contrast(parseHex(n['--g-color-border-control']), bg)).toBeGreaterThanOrEqual(3)
      }
    }
  })

  it('una marca casi gris no tiñe nada; "neutrals": "pure" lo desactiva', () => {
    expect(tintedNeutrals('#1F1F1F')).toEqual({})
    const r = buildTheme({ brand: '#9D1635', neutrals: 'pure' })
    expect(r.generated['--g-color-text']).toBeUndefined()
    expect(buildTheme({ brand: '#9D1635' }).generated['--g-color-text']).toBeDefined()
    expect(buildTheme({}).generated['--g-color-text']).toBeUndefined()
  })

  it('el oscuro también se tiñe (fondo, superficie y texto)', () => {
    const r = buildTheme({ brand: '#9D1635' })
    for (const k of ['--g-color-bg', '--g-color-surface', '--g-color-surface-sunken', '--g-color-text']) expect(r.dark.generated[k]).toBeDefined()
    expect(r.css).toMatch(/\[data-theme="dark"\][^}]*--g-color-surface:/)
  })
})

describe('categorías', () => {
  it('reparte los tonos por igual con el mismo L y C', () => {
    const b = categoryBases(6, '#9D1635')
    const hs = b.map((h) => lch(h).h)
    for (let i = 1; i < hs.length; i++) expect(hueDiff(hs[i], hs[i - 1])).toBeGreaterThan(50)
    const ls = b.map((h) => lch(h).l)
    expect(Math.max(...ls) - Math.min(...ls)).toBeLessThan(0.05)
  })

  it('emite cat-1..N con sus seis tokens en claro y oscuro, y todos los pares cumplen el contraste', () => {
    const r = buildTheme({ brand: '#9D1635', categories: 5 })
    expect(r.ok).toBe(true)
    for (let k = 1; k <= 5; k++) {
      for (const s of ['', '-strong', '-soft', '-text']) expect(r.generated[`--g-color-cat-${k}${s}`]).toBeDefined()
      expect(r.generated[`--g-color-on-cat-${k}-soft`]).toBeDefined()
      expect(r.dark.generated[`--g-color-cat-${k}-soft`]).toBeDefined()
    }
    expect(r.generated['--g-color-cat-6']).toBeUndefined()
    expect(r.issues.filter((i) => i.severity === 'error')).toEqual([])
    expect(r.issues.some((i) => i.id === 'unknown-token')).toBe(false)
  })

  it('12 categorías en oscuro con neutros teñidos: cada cat-k-text llega a 4.5:1 sobre la superficie oscura real (teñida)', () => {
    // Antes se derivaban contra la superficie oscura por defecto (#1C1C1C) y la teñida (#1A1D1B) dejaba cat-2-text en
    // 4,49:1 (#2F4B3A) y cat-10-text en 4,49:1 (#0F4C5C): el motor no pasaba su propia validación y no escribía nada
    for (const brand of ['#2F4B3A', '#0F4C5C', '#171560', '#81AF14']) {
      const r = buildTheme({ brand, categories: 12, dark: true })
      const surface = parseHex(r.dark.tokens['--g-color-surface'])
      expect(r.dark.tokens['--g-color-surface']).not.toBe(DARK['--g-color-surface'])
      for (let k = 1; k <= 12; k++) {
        const ratio = contrast(parseHex(r.dark.generated[`--g-color-cat-${k}-text`]), surface)
        expect(ratio, `${brand} cat-${k}-text ${ratio.toFixed(3)}`).toBeGreaterThanOrEqual(4.5)
      }
      expect(r.issues.filter((i) => i.severity === 'error' && /cat-/.test(i.message)), brand).toEqual([])
      expect(r.ok, brand).toBe(true)
    }
  })

  it('valida la configuración: 0 a 12, entero', () => {
    expect(readConfig({ categories: 13 }).errors).toHaveLength(1)
    expect(readConfig({ categories: 2.5 }).errors).toHaveLength(1)
    expect(readConfig({ categories: 0 }).errors).toHaveLength(0)
    expect(readConfig({ neutrals: 'otro' }).errors).toHaveLength(1)
    expect(readConfig({ name: 'Lustre', neutrals: 'pure' }).errors).toHaveLength(0)
  })
})

describe('hover (strong) en la dirección correcta', () => {
  it('se aleja del fondo de su texto: más oscuro con texto blanco, más claro con texto oscuro, y se nota (ΔL ≥ 0.05)', () => {
    const r = buildTheme({ brand: '#9D1635', accent: '#D85A70' })
    for (const c of ['brand', 'accent']) {
      const base = lch(r.generated[`--g-color-${c}`]), strong = lch(r.generated[`--g-color-${c}-strong`])
      expect(Math.abs(strong.l - base.l)).toBeGreaterThanOrEqual(0.05)
      const on = r.generated[`--g-color-on-${c}`]
      const onLight = lch(on).l > 0.6
      expect(onLight ? strong.l < base.l : strong.l > base.l).toBe(true)
    }
  })
})

describe('tokens.json', () => {
  it('documenta cada token con su valor claro y oscuro, su uso y el contraste medido', () => {
    const r = buildTheme({ name: 'Lustre', brand: '#9D1635', accent: '#D85A70', categories: 2 })
    expect(r.doc.name).toBe('Lustre')
    expect(r.doc.color.themes.map((t) => t.id)).toEqual(['light', 'dark'])
    const t = (n) => r.doc.color.tokens.find((x) => x.name === n)
    expect(t('brand').value).toEqual({ light: '#9D1635', dark: expect.stringMatching(/^#[0-9A-F]{6}$/) })
    expect(t('brand').usage).toMatch(/marca/)
    expect(t('on-brand').contrast.against).toBe('--g-color-brand')
    expect(t('on-brand').contrast.light).toBeGreaterThanOrEqual(4.5)
    expect(t('on-brand').contrast.dark).toBeGreaterThanOrEqual(4.5)
    expect(t('text-muted').contrast.against).toBe('--g-color-surface')
    expect(t('cat-2-soft').usage).toMatch(/categoría 2/)
    expect(r.doc.spacing.tokens.length).toBeGreaterThan(0)
    expect(r.doc.radius.tokens.some((x) => x.cssVar === '--g-radius-md')).toBe(true)
  })

  it('todos los tokens de color tienen un uso (ninguno queda como «Color del tema»)', () => {
    const r = buildTheme({ brand: '#9D1635', categories: 3 })
    expect(r.doc.color.tokens.filter((x) => x.usage === 'Color del tema.').map((x) => x.name)).toEqual([])
    expect(usageOf('on-danger-soft')).toMatch(/fondo suave/)
  })
})

describe('grana theme --doc', () => {
  let dir
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'grana-doc-')) })
  afterEach(() => rmSync(dir, { recursive: true, force: true }))
  const exec = (argv) => { let out = '', err = ''; const code = run(argv, { cwd: dir, out: (s) => (out += s), err: (s) => (err += s) }); return { code, out, err } }

  it('escribe tokens.json junto a tokens.css y cuenta la derivación', () => {
    writeFileSync(join(dir, 'grana.config.json'), JSON.stringify({ brand: '#9D1635', accent: '#D85A70' }))
    const r = exec(['theme', 'grana.config.json', '--doc'])
    expect(r.code).toBe(0)
    expect(r.out).toContain('tokens.json')
    const doc = JSON.parse(readFileSync(join(dir, 'tokens.json'), 'utf8'))
    expect(doc.color.tokens.length).toBeGreaterThan(40)
    const r2 = exec(['theme', 'grana.config.json', '--doc=docs.json', '--out', 'x.css'])
    expect(r2.code).toBe(0)
    expect(JSON.parse(readFileSync(join(dir, 'docs.json'), 'utf8')).meta.source).toBe('@grana/cli')
    expect(r.out + r.err).toContain('Alternativa calculada')
  })
})

describe('política semanticCollision (tokens.md §17.12)', () => {
  it('por defecto es «warn»: conserva el semántico, avisa con la alternativa calculada y no cambia el CSS', () => {
    const r = buildTheme({ brand: '#9D1635', accent: '#D85A70' })
    expect(r.ok).toBe(true)
    expect(r.generated['--g-color-danger']).toBeUndefined()
    const w = r.issues.filter((i) => i.id === 'semantic-close' && i.tokens[0] === '--g-color-danger')
    expect(w.length).toBeGreaterThan(0)
    expect(w[0].recommended).toMatch(/^#[0-9A-F]{6}$/)
    expect(w[0].message).toContain('Alternativa calculada')
    const d = r.diagnostics.find((x) => x.code === 'semantic-close')
    expect(d).toMatchObject({ token: 'danger', status: 'default', reason: 'semantic-close', source: 'semantic' })
    expect(d.recommended).toBe(w[0].recommended)
  })

  it('la alternativa de «warn» es la misma que aplica «adjust»', () => {
    const warn = buildTheme({ brand: '#9D1635', accent: '#D85A70' })
    const adj = buildTheme({ brand: '#9D1635', accent: '#D85A70', semanticCollision: 'adjust' })
    expect(adj.generated['--g-color-danger']).toBe(warn.diagnostics.find((x) => x.code === 'semantic-close').recommended)
    expect(adj.diagnostics.find((x) => x.token === 'danger')).toMatchObject({ code: 'semantic-adjusted', status: 'adjusted', input: '#C4321F' })
    expect(adj.issues.filter((i) => i.severity === 'error')).toEqual([])
  })

  it('valida la configuración', () => {
    expect(readConfig({ semanticCollision: 'otra' }).errors).toHaveLength(1)
    expect(readConfig({ semanticCollision: 'adjust' }).errors).toHaveLength(0)
  })

  it('sin choque no hay diagnóstico ni aviso de colisión', () => {
    const r = buildTheme({ brand: '#0B1F4D', accent: '#6D28D9' })
    expect(r.diagnostics.filter((d) => d.code.startsWith('semantic'))).toEqual([])
    expect(r.issues.some((i) => i.id === 'semantic-close')).toBe(false)
  })
})

describe('transparencia y arquitectura en tokens.json (§17.13, §17.18)', () => {
  const tok = (r, n) => r.doc.color.tokens.find((t) => t.name === n)

  it('cada token lleva level, source y status', () => {
    const r = buildTheme({ brand: '#9D1635', accent: '#D85A70', categories: 2, overrides: { '--g-color-focus': '#5B3FE0' } })
    expect(tok(r, 'brand')).toMatchObject({ level: 'reference', source: 'brand', status: 'derived' })
    expect(tok(r, 'accent-soft')).toMatchObject({ level: 'reference', source: 'accent', status: 'derived' })
    expect(tok(r, 'surface')).toMatchObject({ level: 'semantic', status: 'default' })
    expect(tok(r, 'text')).toMatchObject({ level: 'semantic', source: 'brand', status: 'derived' }) // neutro teñido
    expect(tok(r, 'cat-1')).toMatchObject({ level: 'reference', source: 'brand', status: 'derived' })
    expect(tok(r, 'danger')).toMatchObject({ level: 'semantic', status: 'default' })
    expect(tok(r, 'focus')).toMatchObject({ level: 'semantic', status: 'override' })
    expect(r.doc.color.tokens.every((t) => ['reference', 'semantic'].includes(t.level) && ['default', 'derived', 'adjusted', 'override'].includes(t.status))).toBe(true)
  })

  it('la colisión sin aplicar queda documentada en el token y en diagnostics', () => {
    const r = buildTheme({ brand: '#9D1635', accent: '#D85A70' })
    expect(tok(r, 'danger').recommended).toMatchObject({ reason: 'semantic-close' })
    expect(tok(r, 'danger').recommended.value).toMatch(/^#[0-9A-F]{6}$/)
    expect(r.doc.diagnostics.some((d) => d.code === 'semantic-close' && d.token === 'danger')).toBe(true)
    const adj = buildTheme({ brand: '#9D1635', accent: '#D85A70', semanticCollision: 'adjust' })
    expect(tok(adj, 'danger').status).toBe('adjusted')
    expect(tok(adj, 'danger-soft').status).toBe('adjusted')
  })

  it('«categories» se documenta como colores categóricos, no paleta de datos', () => {
    const r = buildTheme({ brand: '#9D1635', categories: 2 })
    expect(r.doc.meta.categories).toMatch(/no una paleta de visualización de datos/)
    expect(tok(r, 'cat-1').usage).toMatch(/no es una paleta de gráficas/)
  })
})

describe('roles de interfaz (alias, tokens.md §17.4 y §17.7)', () => {
  it('primary, link, selection y active son alias de brand y accent y siguen al tema, claro y oscuro', () => {
    const r = buildTheme({ brand: '#9D1635', accent: '#D85A70' })
    expect(r.tokens['--g-color-primary']).toBe('var(--g-color-brand)')
    expect(r.tokens['--g-color-link']).toBe('var(--g-color-accent-text)')
    expect(r.tokens['--g-color-selection']).toBe('var(--g-color-accent-soft)')
    expect(r.tokens['--g-color-active']).toBe('var(--g-color-accent)')
    expect(r.dark.tokens['--g-color-primary']).toBe('var(--g-color-brand)')
    const t = r.doc.color.tokens
    expect(t.find((x) => x.name === 'primary').value.light).toBe('#9D1635')
    expect(t.find((x) => x.name === 'primary').value.dark).toBe(r.dark.generated['--g-color-brand'])
    expect(t.find((x) => x.name === 'on-primary').contrast.against).toBe('--g-color-primary')
    expect(t.find((x) => x.name === 'link').contrast.light).toBeGreaterThanOrEqual(4.5)
  })
})

describe('neutralsHue: de qué color se toma el tono de los neutros', () => {
  const cfg = { brand: '#F5B940', accent: '#5B3FE0' }
  const n = (hue) => buildTheme({ ...cfg, ...(hue ? { neutralsHue: hue } : {}) })
  const hueOf = (hex) => lch(hex).h

  it('por defecto es «brand»: sin la clave, el resultado es idéntico a neutralsHue: "brand"', () => {
    expect(n().css).toBe(n('brand').css)
    expect(n().doc.color.tokens).toEqual(n('brand').doc.color.tokens)
  })

  it('«brand» toma el tono de la marca y «accent» el del acento', () => {
    const t = (r) => r.generated['--g-color-text-muted']
    expect(hueOf(t(n('brand')))).toBeGreaterThan(60)
    expect(hueOf(t(n('brand')))).toBeLessThan(100)
    expect(hueDiff(hueOf(t(n('accent'))), lch('#5B3FE0').h)).toBeLessThan(8)
    expect(hueDiff(hueOf(n('accent').dark.generated['--g-color-surface']), lch('#5B3FE0').h)).toBeLessThan(10)
  })

  it('solo cambia el tono: la luminosidad, el croma y el contraste siguen las mismas reglas', () => {
    const a = n('brand'), b = n('accent')
    for (const scheme of ['light', 'dark']) {
      const ta = scheme === 'light' ? a.generated : a.dark.generated
      const tb = scheme === 'light' ? b.generated : b.dark.generated
      for (const k of ['--g-color-surface-sunken', '--g-color-text', '--g-color-text-muted', '--g-color-text-subtle', '--g-color-border-control']) {
        const x = lch(ta[k]), y = lch(tb[k])
        expect(Math.abs(x.l - y.l)).toBeLessThan(0.03)
        expect(Math.abs(x.c - y.c)).toBeLessThan(0.006)
      }
      const surface = parseHex(scheme === 'light' ? '#FFFFFF' : tb['--g-color-surface'])
      for (const k of ['--g-color-text', '--g-color-text-muted', '--g-color-text-subtle']) expect(contrast(parseHex(tb[k]), surface)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(parseHex(tb['--g-color-border-control']), surface)).toBeGreaterThanOrEqual(3)
    }
    expect(b.issues.filter((i) => i.severity === 'error')).toEqual([])
  })

  it('no se infiere: sin `neutralsHue` siempre es la marca, aunque el acento sea más cromático', () => {
    const r = buildTheme({ brand: '#1F3A5F', accent: '#FF3B30' })
    expect(Math.abs(hueOf(r.generated['--g-color-text-muted']) - lch('#1F3A5F').h)).toBeLessThan(8)
  })

  it('el croma sigue saliendo de la marca aunque el tono sea del acento', () => {
    const brandChromaRule = (hex) => Math.min(0.02, Math.max(0.006, lch(hex).c * 0.08))
    const r = buildTheme({ brand: '#F5B940', accent: '#5B3FE0', neutralsHue: 'accent' })
    expect(lch(r.generated['--g-color-text-muted']).c).toBeLessThanOrEqual(brandChromaRule('#F5B940') + 0.002)
  })

  it('tokens.json y diagnostics indican de dónde sale el tono', () => {
    const r = n('accent')
    expect(r.doc.color.tokens.find((t) => t.name === 'text').source).toBe('accent')
    expect(r.doc.color.tokens.find((t) => t.name === 'brand').source).toBe('brand')
    expect(r.diagnostics.find((d) => d.code === 'neutrals-tinted')).toMatchObject({ source: 'accent' })
    expect(r.diagnostics.find((d) => d.code === 'neutrals-tinted').message).toContain('del acento')
    expect(n('brand').doc.color.tokens.find((t) => t.name === 'text').source).toBe('brand')
  })

  it('valida la configuración', () => {
    expect(readConfig({ neutralsHue: 'otro' }).errors).toHaveLength(1)
    expect(readConfig({ neutralsHue: 'accent' }).errors).toHaveLength(0)
    expect(readConfig({ neutralsHue: 'brand' }).errors).toHaveLength(0)
  })

  it('con "neutrals": "pure" no se tiñe nada, sea cual sea neutralsHue', () => {
    expect(buildTheme({ ...cfg, neutrals: 'pure', neutralsHue: 'accent' }).generated['--g-color-text']).toBeUndefined()
  })
})

describe('colisiones: valor configurado frente a valor derivado', () => {
  const close = (r, token = '--g-color-danger') => r.issues.filter((i) => i.id === 'semantic-close' && i.tokens[0] === token)

  it('sin `accent` del usuario, el aviso habla de la marca a través del acento derivado (no «accent»)', () => {
    const r = buildTheme({ brand: '#E5483A' })
    const w = close(r)
    expect(w.length).toBeGreaterThan(0)
    for (const i of w) expect(i.message).not.toMatch(/«accent»|\bal acento|se separó del acento/)
    const viaAccent = w.filter((i) => i.collidedWith === 'accent')
    expect(viaAccent.length).toBeGreaterThan(0)
    expect(viaAccent[0].message).toContain('a la marca (a través del acento derivado)')
    expect(viaAccent[0].accentDerived).toBe(true)
    expect(viaAccent[0].why).toContain('define «accent»')
    expect(viaAccent[0].tokens).toContain('--g-color-accent') // internamente la colisión sigue siendo con accent
  })

  it('con `accent` definido por el usuario sigue diciendo «el acento»', () => {
    const r = buildTheme({ brand: '#1F1F1F', accent: '#E5483A' })
    const w = close(r).filter((i) => i.collidedWith === 'accent')
    expect(w.length).toBeGreaterThan(0)
    expect(w[0].message).toContain('se parece al acento')
    expect(w[0].message).not.toContain('derivado')
    expect(w[0].accentDerived).toBe(false)
  })

  it('cuando choca con la marca directamente, dice «la marca» (con o sin acento)', () => {
    const r = buildTheme({ brand: '#E5483A', accent: '#0B63CE' })
    const w = close(r).filter((i) => i.collidedWith === 'brand')
    expect(w.length).toBeGreaterThan(0)
    expect(w[0].message).toMatch(/se parece a la marca \(distancia/)
    expect(w[0].accentDerived).toBe(false)
  })

  it('diagnostics y tokens.json conservan con quién chocó y si el acento era derivado', () => {
    const warn = buildTheme({ brand: '#E5483A' })
    const d = warn.diagnostics.find((x) => x.code === 'semantic-close')
    expect(d.collidedWith).toBeDefined()
    if (d.collidedWith === 'accent') {
      expect(d.accentDerived).toBe(true)
      expect(d.message).toContain('a través del acento derivado')
    }
    const adj = buildTheme({ brand: '#E5483A', semanticCollision: 'adjust' })
    const a = adj.diagnostics.find((x) => x.code === 'semantic-adjusted')
    expect(a.message).not.toMatch(/«accent»|\bal acento|se separó del acento/)
    const explicit = buildTheme({ brand: '#1F1F1F', accent: '#E5483A', semanticCollision: 'adjust' })
    expect(explicit.diagnostics.find((x) => x.code === 'semantic-adjusted').message).toContain('se separó del acento')
  })
})

describe('`primary` como clave propia (tokens.md §17.4, DECISIONS.md #107)', () => {
  const tok = (r, n) => r.doc.color.tokens.find((t) => t.name === n)

  it('sin `primary`, el rol es un alias de brand y no se emite ningún token primary', () => {
    const r = buildTheme({ brand: '#9D1635', accent: '#D85A70' })
    expect(Object.keys(r.generated).filter((k) => /primary/.test(k))).toEqual([])
    expect(r.tokens['--g-color-primary']).toBe('var(--g-color-brand)')
    expect(tok(r, 'primary').source).toBe('brand')
  })

  it('con `primary`, sus seis tokens se derivan del color dado y brand no cambia', () => {
    const base = buildTheme({ brand: '#9D1635', accent: '#D85A70' })
    const r = buildTheme({ brand: '#9D1635', accent: '#D85A70', primary: '#7D1230' })
    expect(r.ok).toBe(true)
    for (const k of ['', '-strong', '-soft', '-text']) expect(r.generated[`--g-color-primary${k}`]).toBeDefined()
    expect(r.generated['--g-color-on-primary']).toBeDefined()
    expect(r.generated['--g-color-on-primary-soft']).toBeDefined()
    expect(r.generated['--g-color-primary']).toBe('#7D1230')
    // brand y accent siguen siendo los mismos
    for (const k of Object.keys(base.generated).filter((x) => /(brand|accent)/.test(x))) expect(r.generated[k]).toBe(base.generated[k])
    expect(r.generated['--g-color-primary']).not.toBe(r.generated['--g-color-brand'])
  })

  it('también en oscuro (derivado aparte) y con `dark: { primary }` explícito', () => {
    const r = buildTheme({ brand: '#9D1635', primary: '#7D1230' })
    expect(r.dark.generated['--g-color-primary']).toBeDefined()
    expect(r.dark.generated['--g-color-primary']).not.toBe(r.generated['--g-color-primary'])
    const e = buildTheme({ brand: '#9D1635', primary: '#7D1230', dark: { primary: '#F2A1B3' } })
    expect(e.ok).toBe(true)
    expect(e.dark.generated['--g-color-primary']).not.toBe(r.dark.generated['--g-color-primary'])
    expect(r.css).toMatch(/--g-color-primary:/)
  })

  it('se valida como cualquier color (los dos esquemas) y se documenta en tokens.json', () => {
    const r = buildTheme({ brand: '#9D1635', primary: '#7D1230' })
    expect(r.issues.filter((i) => i.severity === 'error')).toEqual([])
    expect(tok(r, 'primary')).toMatchObject({ level: 'semantic', source: 'primary', status: 'derived' })
    expect(tok(r, 'on-primary').contrast.light).toBeGreaterThanOrEqual(4.5)
    expect(tok(r, 'brand').source).toBe('brand')
  })

  it('un `primary` que rompe un mínimo de contraste no puede salir: se deriva siempre con contraste', () => {
    for (const hex of ['#FFFF00', '#000000', '#7F7F7F', '#FF0000']) {
      const r = buildTheme({ brand: '#1F1F1F', primary: hex })
      expect(r.ok, hex).toBe(true)
    }
  })

  it('`primary` cuenta como ancla de colisión con los semánticos y el aviso lo nombra', () => {
    const r = buildTheme({ brand: '#1F1F1F', accent: '#0B63CE', primary: '#CF4030' })
    const w = r.issues.filter((i) => i.id === 'semantic-close' && i.collidedWith === 'primary')
    expect(w.length).toBeGreaterThan(0)
    expect(w[0].message).toContain('al color primario')
  })

  it('valida la configuración', () => {
    expect(readConfig({ primary: 'rojo' }).errors).toHaveLength(1)
    expect(readConfig({ primary: '#7D1230' }).errors).toHaveLength(0)
    expect(readConfig({ dark: { primary: 'x' } }).errors).toHaveLength(1)
    expect(readConfig({ dark: { primary: '#F2A1B3' } }).errors).toHaveLength(0)
  })
})
