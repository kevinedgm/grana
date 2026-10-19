// Entrada `@grana/vue/fab` (fab.md «Paquete y peso», DECISIONS.md #656): GFab va aparte del paquete principal y toma lo
// compartido de `__shared` (src/shared.js). En el principal crecen el motor de menú extraído (utils/menuNav.js, #657) y
// EDGE_ORDER.fab; el registro de reservas de borde es el mismo (uno por documento: los avisos quedan más allá del FAB).
import { describe, it, expect, vi } from 'vitest'
import { createApp, h } from 'vue'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { gzipSync } from 'node:zlib'
import * as main from './index.js'
import * as entry from './fab.js'
import { shared } from './shared.js'
import * as edge from './utils/edgeReserve.js'
import * as nav from './utils/menuNav.js'
import GBtn from './components/GBtn/GBtn.vue'
import GTooltip from './components/GTooltip/GTooltip.vue'

const SRC = resolve(process.cwd(), 'src')
vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('@grana/vue/fab · entrada propia (#656)', () => {
  it('exporta GFab, install y el plugin por defecto; nada interno', () => {
    expect(Object.keys(entry).sort()).toEqual(['GFab', 'default', 'install'])
    expect(entry.GFab.name).toBe('GFab')
    expect(entry.default.install).toBe(entry.install)
  })

  it('@grana/vue no exporta ni registra GFab', () => {
    expect(main.GFab).toBeUndefined()
    const app = createApp({ render: () => h('i') })
    app.use(main.default)
    expect(app.component('GFab')).toBeUndefined()
  })

  it('app.use(Fab) registra <g-fab> (sin pisar uno ya registrado)', () => {
    const app = createApp({ render: () => h('i') })
    app.use(entry.default)
    expect(app.component('GFab')).toBe(entry.GFab)
    const app2 = createApp({ render: () => h('i') })
    const Mine = { render: () => null }
    app2.component('GFab', Mine)
    app2.use(entry.default)
    expect(app2.component('GFab')).toBe(Mine)
  })

  it('EDGE_ORDER: el FAB después de la voz y el encabezado; la isla, transitoria, detrás del FAB (#659, #699)', () => {
    expect(edge.EDGE_ORDER).toEqual({ speech: 10, pageHeader: 15, fab: 25, status: 30 })
    expect(edge.EDGE_ORDER.fab).toBeLessThan(edge.EDGE_ORDER.status)
  })

  it('package.json, build y configuración: exports ./fab, global GranaFab, Vue y @grana/vue externos', () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'))
    expect(pkg.exports['./fab']).toEqual({ types: './dist/fab.d.ts', import: './dist/fab.js', default: './dist/fab.js' })
    expect(pkg.typesVersions['*'].fab).toEqual(['./dist/fab.d.ts'])
    expect(pkg.scripts.build).toContain('vite build -c vite.fab.config.js')
    const cfg = readFileSync(resolve(process.cwd(), 'vite.fab.config.js'), 'utf8')
    expect(cfg).toContain("external: ['vue', '@grana/vue']")
    expect(cfg).toContain("name: 'GranaFab'")
    expect(cfg).toContain("'@grana/vue': 'Grana'")
    expect(cfg).toContain('this.error(')
  })

  it('el CSS sigue en grana.css, después de GBtn y GTooltip', () => {
    const css = readFileSync(resolve(SRC, 'styles/components.css'), 'utf8')
    const at = (name) => css.indexOf(`components/${name}/${name}.css`)
    expect(at('GFab')).toBeGreaterThan(-1)
    for (const dep of ['GBtn', 'GTooltip']) expect(at('GFab'), `tras ${dep}`).toBeGreaterThan(at(dep))
  })

  it('meta.json: entrada y peso gzip anotado', () => {
    const meta = JSON.parse(readFileSync(resolve(SRC, 'components/GFab/GFab.meta.json'), 'utf8'))
    expect(meta.entry).toBe('@grana/vue/fab')
    expect(meta.bundle.global).toBe('GranaFab')
    expect(meta.bundle.gzip).toBeGreaterThan(0)
    expect(meta.bundle.budget).toBe(10496)
  })

  it('dist (si está construido): compuertas y el peso anotado no se desfasa más de 1 KB (gzip, bytes)', () => {
    const dist = resolve(process.cwd(), 'dist')
    if (!existsSync(resolve(dist, 'fab.js'))) return
    const js = readFileSync(resolve(dist, 'fab.js'))
    expect(readFileSync(resolve(dist, 'grana.css'), 'utf8')).toContain('g-fab__item')
    expect(readFileSync(resolve(dist, 'grana.js'), 'utf8')).not.toContain('GFab')
    expect(js.toString()).toContain('__shared')
    // Sin copia del registro de bordes, del observador, del motor de menú (búfer de la letra) ni de GBtn o GTooltip
    for (const s of ['new WeakMap', 'new ResizeObserver', 'is-highlight-instant', 'g-btn--', 'g-tooltip__']) expect(js.toString(), s).not.toContain(s)
    const meta = JSON.parse(readFileSync(resolve(SRC, 'components/GFab/GFab.meta.json'), 'utf8'))
    expect(Math.abs(gzipSync(js).length - meta.bundle.gzip)).toBeLessThan(1024)
    // El tope de #676 (10 496 B): la entrada no lo supera; si lo hace, vuelve a lima
    expect(gzipSync(js).length).toBeLessThanOrEqual(meta.bundle.budget)
  })
})

describe('@grana/vue/fab · lo compartido llega del paquete principal (src/shared.js), sin duplicados', () => {
  const own = (key) => key === 'fab.js' || /^components\/GFab\//.test(key)
  const keyOf = (file) => relative(SRC, file).split(sep).join('/')
  const files = ['fab.js', ...readdirSync(resolve(SRC, 'components/GFab')).filter((f) => /\.(vue|js)$/.test(f) && !/\.test\.js$/.test(f)).map((f) => `components/GFab/${f}`)]
  const imports = []
  for (const f of files) {
    const text = readFileSync(resolve(SRC, f), 'utf8')
    for (const [, spec, source] of text.matchAll(/^import\s+([^'"]+?)\s+from\s+'(\.[^']+)'/gm)) {
      const key = keyOf(resolve(dirname(resolve(SRC, f)), source))
      if (own(key)) continue
      const names = []
      const named = spec.match(/\{([^}]*)\}/)
      if (named) for (const n of named[1].split(',')) if (n.trim()) names.push(n.trim().split(/\s+as\s+/)[0])
      if (/^\s*[A-Za-z_$][\w$]*\s*(,|$)/.test(spec)) names.push('default')
      imports.push({ from: f, key, names })
    }
  }

  it('importa del principal solo lo que src/shared.js expone, nombre por nombre', () => {
    expect(imports.length).toBeGreaterThan(0)
    for (const { from, key, names } of imports) {
      expect(shared[key], `${from} → ${key}`).toBeTruthy()
      for (const n of names) expect(shared[key][n], `${from} → ${key} · ${n}`).toBeDefined()
    }
  })

  it('el registro de bordes, el motor de menú, GBtn y GTooltip son los del paquete principal (una sola instancia)', () => {
    for (const k of ['utils/edgeReserve.js', 'utils/menuNav.js', 'components/GBtn/GBtn.vue', 'components/GTooltip/GTooltip.vue']) expect(imports.some((i) => i.key === k), k).toBe(true)
    expect(shared['utils/edgeReserve.js'].setEdgeReserve).toBe(edge.setEdgeReserve)
    expect(shared['utils/edgeReserve.js'].edgeReserve).toBe(edge.edgeReserve)
    expect(shared['utils/edgeReserve.js'].EDGE_ORDER).toBe(edge.EDGE_ORDER)
    for (const n of ['focusItem', 'stepTo', 'createTypeahead', 'createPointer', 'createHighlight', 'repeatGesture']) expect(shared['utils/menuNav.js'][n], n).toBe(nav[n])
    // GBtn reconoce a su GTooltip padre por identidad (#390): los dos deben ser los del principal
    expect(shared['components/GBtn/GBtn.vue'].default).toBe(GBtn)
    expect(shared['components/GTooltip/GTooltip.vue'].default).toBe(GTooltip)
  })
})
