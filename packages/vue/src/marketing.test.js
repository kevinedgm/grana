// Entradas de marketing (#742): @grana/vue/hero, @grana/vue/gallery y @grana/vue/booking. Cada una va aparte del principal,
// con su tope gzip, y toma lo compartido de `__shared` (src/shared.js) sin copias. En el principal solo crece el lote de
// enmiendas (GDialog bare y from vivo, GDatePicker noches, GMenu lang/hreflang, EDGE_ORDER.bookingDock y __shared).
import { describe, it, expect, vi } from 'vitest'
import { createApp, h } from 'vue'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { gzipSync } from 'node:zlib'
import * as main from './index.js'
import * as hero from './hero.js'
import * as gallery from './gallery.js'
import * as booking from './booking.js'
import { shared } from './shared.js'
import * as edge from './utils/edgeReserve.js'

const SRC = resolve(process.cwd(), 'src')
vi.spyOn(console, 'warn').mockImplementation(() => {})

const ENTRIES = [
  { name: 'hero', mod: hero, global: 'GranaHero', components: ['GHero'], dirs: ['GHero'], limit: 4096, gate: 'g-hero__media' },
  { name: 'gallery', mod: gallery, global: 'GranaGallery', components: ['GGallery', 'GGalleryViewer'], dirs: ['GGallery'], limit: 12288, gate: 'g-gallery-viewer__stage' },
  { name: 'booking', mod: booking, global: 'GranaBooking', components: ['GBookingBar', 'GPartyField'], dirs: ['GBookingBar', 'GPartyField'], limit: 14336, gate: 'g-booking-bar__phrase' }
]
const metaOf = (c) => {
  for (const d of readdirSync(resolve(SRC, 'components'))) {
    const f = resolve(SRC, 'components', d, `${c}.meta.json`)
    if (existsSync(f)) return JSON.parse(readFileSync(f, 'utf8'))
  }
  return null
}

describe.each(ENTRIES)('@grana/vue/$name · entrada propia (#742)', (e) => {
  it('exporta sus componentes, install y el plugin por defecto; nada interno', () => {
    expect(Object.keys(e.mod).sort()).toEqual([...e.components, 'default', 'install'].sort())
    expect(e.mod.default.install).toBe(e.mod.install)
  })

  it('@grana/vue no los exporta ni los registra', () => {
    const app = createApp({ render: () => h('i') })
    app.use(main.default)
    for (const c of e.components) {
      expect(main[c]).toBeUndefined()
      expect(app.component(c)).toBeUndefined()
    }
  })

  it('app.use registra sus componentes sin pisar uno ya registrado', () => {
    const app = createApp({ render: () => h('i') })
    app.use(e.mod.default)
    for (const c of e.components) expect(app.component(c)).toBe(e.mod[c])
    const app2 = createApp({ render: () => h('i') })
    const Mine = { render: () => null }
    app2.component(e.components[0], Mine)
    app2.use(e.mod.default)
    expect(app2.component(e.components[0])).toBe(Mine)
  })

  it('sin efectos al importar (#444)', async () => {
    vi.resetModules()
    const add = vi.spyOn(window, 'addEventListener')
    const addDoc = vi.spyOn(document, 'addEventListener')
    const nodes = document.body.innerHTML
    const mod = await import(`./${e.name}.js`)
    expect(mod.default.install).toBeTypeOf('function')
    expect(add).not.toHaveBeenCalled()
    expect(addDoc).not.toHaveBeenCalled()
    expect(document.body.innerHTML).toBe(nodes)
    add.mockRestore(); addDoc.mockRestore()
  })

  it('package.json y configuración: exports, typesVersions, build, global y externos', () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'))
    expect(pkg.exports[`./${e.name}`]).toEqual({ types: `./dist/${e.name}.d.ts`, import: `./dist/${e.name}.js`, default: `./dist/${e.name}.js` })
    expect(pkg.typesVersions['*'][e.name]).toEqual([`./dist/${e.name}.d.ts`])
    expect(pkg.scripts.build).toContain(`vite build -c vite.${e.name}.config.js`)
    const cfg = readFileSync(resolve(process.cwd(), `vite.${e.name}.config.js`), 'utf8')
    expect(cfg).toContain("external: ['vue', '@grana/vue']")
    expect(cfg).toContain(`name: '${e.global}'`)
    expect(cfg).toContain('this.error(')
  })

  it('meta.json: entrada, global y status draft hasta la auditoría de coco', () => {
    for (const c of e.components) {
      const m = metaOf(c)
      expect(m, c).toBeTruthy()
      expect(m.entry).toBe(`@grana/vue/${e.name}`)
      expect(m.bundle.global).toBe(e.global)
      expect(m.status).toBe('draft')
    }
  })

  it('el CSS sigue en grana.css (components.css)', () => {
    const css = readFileSync(resolve(SRC, 'styles/components.css'), 'utf8')
    for (const d of e.dirs) expect(css).toContain(`components/${d}/${d}.css`)
  })

  it('importa del principal solo lo que src/shared.js expone, nombre por nombre', () => {
    const own = (key) => key === `${e.name}.js` || e.dirs.some((d) => key.startsWith(`components/${d}/`))
    const keyOf = (file) => relative(SRC, file).split(sep).join('/')
    const files = [`${e.name}.js`, ...e.dirs.flatMap((d) => readdirSync(resolve(SRC, 'components', d)).filter((f) => /\.(vue|js)$/.test(f) && !/\.test\.js$/.test(f)).map((f) => `components/${d}/${f}`))]
    let n = 0
    for (const f of files) {
      const text = readFileSync(resolve(SRC, f), 'utf8')
      for (const [, spec, source] of text.matchAll(/^import\s+([^'"]+?)\s+from\s+'(\.[^']+)'/gm)) {
        const key = keyOf(resolve(dirname(resolve(SRC, f)), source))
        if (own(key)) continue
        n++
        expect(shared[key], `${f} → ${key}`).toBeTruthy()
        const named = spec.match(/\{([^}]*)\}/)
        if (named) for (const x of named[1].split(',')) if (x.trim()) expect(shared[key][x.trim().split(/\s+as\s+/)[0]], `${f} → ${key} · ${x}`).toBeDefined()
        if (/^\s*[A-Za-z_$][\w$]*\s*(,|$)/.test(spec)) expect(shared[key].default, `${f} → ${key} · default`).toBeDefined()
      }
    }
    expect(n).toBeGreaterThan(0)
  })

  it('dist (si está construido): compuertas, tope gzip y peso anotado (± 1 KB)', () => {
    const dist = resolve(process.cwd(), 'dist')
    if (!existsSync(resolve(dist, `${e.name}.js`))) return
    const js = readFileSync(resolve(dist, `${e.name}.js`))
    expect(readFileSync(resolve(dist, 'grana.css'), 'utf8')).toContain(e.gate)
    const mainJs = readFileSync(resolve(dist, 'grana.js'), 'utf8')
    for (const c of e.components) expect(mainJs).not.toContain(c)
    expect(js.toString()).toContain('__shared')
    expect(js.toString()).not.toContain('new WeakMap')
    const gz = gzipSync(js, { level: 9 }).length
    expect(gz).toBeLessThanOrEqual(e.limit)
    expect(Math.abs(gz - metaOf(e.components[0]).bundle.gzip)).toBeLessThan(1024)
  })
})

describe('lote de enmiendas en el principal (#742)', () => {
  it('EDGE_ORDER.bookingDock = 20: encima del encabezado de página y debajo del FAB (#740)', () => {
    expect(edge.EDGE_ORDER.bookingDock).toBe(20)
    expect(edge.EDGE_ORDER.pageHeader).toBeLessThan(20)
    expect(edge.EDGE_ORDER.fab).toBeGreaterThan(20)
  })
  it('la consulta usa el mismo registro de bordes (una sola instancia por documento)', () => {
    expect(shared['utils/edgeReserve.js'].EDGE_ORDER).toBe(edge.EDGE_ORDER)
    expect(shared['utils/edgeReserve.js'].setEdgeReserve).toBe(edge.setEdgeReserve)
  })
})
