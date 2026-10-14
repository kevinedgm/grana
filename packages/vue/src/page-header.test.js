// Entrada `@grana/vue/page-header` (page-header.md «Paquete y peso», DECISIONS.md #633): GPageHeader va aparte del paquete
// principal y toma lo compartido de `__shared` (src/shared.js). Lo único que crece en el principal es EDGE_ORDER.pageHeader;
// el registro de reservas de borde es el mismo (una sola instancia por documento: la isla y los avisos ven el zócalo).
import { describe, it, expect, vi } from 'vitest'
import { createApp, h } from 'vue'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { gzipSync } from 'node:zlib'
import * as main from './index.js'
import * as entry from './page-header.js'
import { shared } from './shared.js'
import * as edge from './utils/edgeReserve.js'
import { observeSize } from './utils/sizeObserver.js'
import { transitionMs } from './utils/motion.js'

const SRC = resolve(process.cwd(), 'src')
vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('@grana/vue/page-header · entrada propia (#633)', () => {
  it('exporta GPageHeader, install y el plugin por defecto; nada interno', () => {
    expect(Object.keys(entry).sort()).toEqual(['GPageHeader', 'default', 'install'])
    expect(entry.GPageHeader.name).toBe('GPageHeader')
    expect(entry.default.install).toBe(entry.install)
  })

  it('@grana/vue no exporta ni registra GPageHeader', () => {
    expect(main.GPageHeader).toBeUndefined()
    const app = createApp({ render: () => h('i') })
    app.use(main.default)
    expect(app.component('GPageHeader')).toBeUndefined()
  })

  it('app.use(PageHeader) registra <g-page-header> (sin pisar uno ya registrado)', () => {
    const app = createApp({ render: () => h('i') })
    app.use(entry.default)
    expect(app.component('GPageHeader')).toBe(entry.GPageHeader)
    const app2 = createApp({ render: () => h('i') })
    const Mine = { render: () => null }
    app2.component('GPageHeader', Mine)
    app2.use(entry.default)
    expect(app2.component('GPageHeader')).toBe(Mine)
  })

  it('EDGE_ORDER: el encabezado entre la voz y la isla (#631)', () => {
    expect(edge.EDGE_ORDER.speech).toBeLessThan(edge.EDGE_ORDER.pageHeader)
    expect(edge.EDGE_ORDER.pageHeader).toBe(15)
    expect(edge.EDGE_ORDER.pageHeader).toBeLessThan(edge.EDGE_ORDER.status)
  })

  it('package.json, build y configuración: exports ./page-header, global GranaPageHeader, Vue y @grana/vue externos', () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'))
    expect(pkg.exports['./page-header']).toEqual({ types: './dist/page-header.d.ts', import: './dist/page-header.js', default: './dist/page-header.js' })
    expect(pkg.typesVersions['*']['page-header']).toEqual(['./dist/page-header.d.ts'])
    expect(pkg.scripts.build).toContain('vite build -c vite.page-header.config.js')
    const cfg = readFileSync(resolve(process.cwd(), 'vite.page-header.config.js'), 'utf8')
    expect(cfg).toContain("external: ['vue', '@grana/vue']")
    expect(cfg).toContain("name: 'GranaPageHeader'")
    expect(cfg).toContain("'@grana/vue': 'Grana'")
    expect(cfg).toContain('this.error(')
  })

  it('el CSS sigue en grana.css, después de GSurface, GDialog y GTabs', () => {
    const css = readFileSync(resolve(SRC, 'styles/components.css'), 'utf8')
    const at = (name) => css.indexOf(`components/${name}/${name}.css`)
    expect(at('GPageHeader')).toBeGreaterThan(-1)
    for (const dep of ['GSurface', 'GDialog', 'GTabs', 'GBtn']) expect(at('GPageHeader'), `tras ${dep}`).toBeGreaterThan(at(dep))
  })

  it('meta.json: entrada y peso gzip anotado', () => {
    const meta = JSON.parse(readFileSync(resolve(SRC, 'components/GPageHeader/GPageHeader.meta.json'), 'utf8'))
    expect(meta.entry).toBe('@grana/vue/page-header')
    expect(meta.bundle.global).toBe('GranaPageHeader')
    expect(meta.bundle.gzip).toBeGreaterThan(0)
  })

  it('dist (si está construido): compuertas y el peso anotado no se desfasa más de 1 KB (gzip, bytes)', () => {
    const dist = resolve(process.cwd(), 'dist')
    if (!existsSync(resolve(dist, 'page-header.js'))) return
    const js = readFileSync(resolve(dist, 'page-header.js'))
    expect(readFileSync(resolve(dist, 'grana.css'), 'utf8')).toContain('g-page-header__base')
    expect(readFileSync(resolve(dist, 'grana.js'), 'utf8')).not.toContain('GPageHeader')
    expect(js.toString()).toContain('__shared')
    // Sin copia del registro de bordes (su WeakMap de documentos) ni del observador compartido
    expect(js.toString()).not.toContain('new WeakMap')
    expect(js.toString()).not.toContain('new ResizeObserver')
    const meta = JSON.parse(readFileSync(resolve(SRC, 'components/GPageHeader/GPageHeader.meta.json'), 'utf8'))
    expect(Math.abs(gzipSync(js).length - meta.bundle.gzip)).toBeLessThan(1024)
  })
})

describe('@grana/vue/page-header · lo compartido llega del paquete principal (src/shared.js), sin duplicados', () => {
  const own = (key) => key === 'page-header.js' || /^components\/GPageHeader\//.test(key)
  const keyOf = (file) => relative(SRC, file).split(sep).join('/')
  const files = ['page-header.js', ...readdirSync(resolve(SRC, 'components/GPageHeader')).filter((f) => /\.(vue|js)$/.test(f) && !/\.test\.js$/.test(f)).map((f) => `components/GPageHeader/${f}`)]
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

  it('el registro de bordes, el observador y transitionMs son los del paquete principal (una sola instancia)', () => {
    expect(imports.some((i) => i.key === 'utils/edgeReserve.js')).toBe(true)
    expect(shared['utils/edgeReserve.js'].setEdgeReserve).toBe(edge.setEdgeReserve)
    expect(shared['utils/edgeReserve.js'].edgeReserve).toBe(edge.edgeReserve)
    expect(shared['utils/edgeReserve.js'].EDGE_ORDER).toBe(edge.EDGE_ORDER)
    expect(shared['utils/sizeObserver.js'].observeSize).toBe(observeSize)
    expect(shared['utils/motion.js'].transitionMs).toBe(transitionMs)
  })
})
