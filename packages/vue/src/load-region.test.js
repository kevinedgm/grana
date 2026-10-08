// Entrada `@grana/vue/load-region` (load-region.md «Paquete y peso», DECISIONS.md #530): GLoadRegion va aparte del
// paquete principal y toma lo compartido de `__shared` (src/shared.js), como las etiquetas (#510). GEmpty, el motor y el
// canal de página viven en el principal (los usa GTable).
import { describe, it, expect, vi } from 'vitest'
import { createApp, h } from 'vue'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { gzipSync } from 'node:zlib'
import * as main from './index.js'
import * as entry from './load-region.js'
import { shared } from './shared.js'
import GEmpty from './components/GEmpty/GEmpty.vue'
import GBtn from './components/GBtn/GBtn.vue'
import { loadRegionKey, createLoadPhase } from './utils/loadPhase.js'
import { announcePage, acquirePageLive } from './utils/liveRegion.js'

const SRC = resolve(process.cwd(), 'src')
vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('@grana/vue/load-region · entrada propia (#530)', () => {
  it('exporta GLoadRegion, install y el plugin por defecto; nada interno', () => {
    expect(Object.keys(entry).sort()).toEqual(['GLoadRegion', 'default', 'install'])
    expect(entry.GLoadRegion.name).toBe('GLoadRegion')
    expect(entry.default.install).toBe(entry.install)
  })

  it('@grana/vue no exporta ni registra GLoadRegion; sí GEmpty', () => {
    expect(main.GLoadRegion).toBeUndefined()
    expect(main.GEmpty).toBe(GEmpty)
    const app = createApp({ render: () => h('i') })
    app.use(main.default)
    expect(app.component('GLoadRegion')).toBeUndefined()
    expect(app.component('GEmpty')).toBe(GEmpty)
  })

  it('app.use(LoadRegion) registra <g-load-region> (sin pisar uno ya registrado)', () => {
    const app = createApp({ render: () => h('i') })
    app.use(entry.default)
    expect(app.component('GLoadRegion')).toBe(entry.GLoadRegion)
    const app2 = createApp({ render: () => h('i') })
    const Mine = { render: () => null }
    app2.component('GLoadRegion', Mine)
    app2.use(entry.default)
    expect(app2.component('GLoadRegion')).toBe(Mine)
  })

  it('package.json, build y configuración: exports ./load-region, global GranaLoadRegion, Vue y @grana/vue externos', () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'))
    expect(pkg.exports['./load-region']).toEqual({ types: './dist/load-region.d.ts', import: './dist/load-region.js', default: './dist/load-region.js' })
    expect(pkg.typesVersions['*']['load-region']).toEqual(['./dist/load-region.d.ts'])
    expect(pkg.scripts.build).toContain('vite build -c vite.load-region.config.js')
    const cfg = readFileSync(resolve(process.cwd(), 'vite.load-region.config.js'), 'utf8')
    expect(cfg).toContain("external: ['vue', '@grana/vue']")
    expect(cfg).toContain("name: 'GranaLoadRegion'")
    expect(cfg).toContain("'@grana/vue': 'Grana'")
    expect(cfg).toContain('this.error(')
  })

  it('el CSS sigue en grana.css: GEmpty.css y GLoadRegion.css después de GBtn.css y GIcon.css', () => {
    const css = readFileSync(resolve(SRC, 'styles/components.css'), 'utf8')
    const at = (name) => css.indexOf(`components/${name}/${name}.css`)
    for (const n of ['GEmpty', 'GLoadRegion']) {
      expect(at(n), n).toBeGreaterThan(-1)
      for (const dep of ['GBtn', 'GIcon']) expect(at(n), `${n} tras ${dep}`).toBeGreaterThan(at(dep))
    }
  })

  it('meta.json: entrada y peso gzip anotado', () => {
    const meta = JSON.parse(readFileSync(resolve(SRC, 'components/GLoadRegion/GLoadRegion.meta.json'), 'utf8'))
    expect(meta.entry).toBe('@grana/vue/load-region')
    expect(meta.bundle.gzip).toBeGreaterThan(0)
    expect(JSON.parse(readFileSync(resolve(SRC, 'components/GEmpty/GEmpty.meta.json'), 'utf8')).entry).toBe('@grana/vue')
  })

  it('dist (si está construido): compuertas y el peso anotado no se desfasa más de 1 KB (gzip, bytes)', () => {
    const dist = resolve(process.cwd(), 'dist')
    if (!existsSync(resolve(dist, 'load-region.js'))) return
    const js = readFileSync(resolve(dist, 'load-region.js'))
    const css = readFileSync(resolve(dist, 'grana.css'), 'utf8')
    expect(css).toContain('g-load-region__pill')
    expect(css).toContain('g-empty__count') // g-empty__relax es solo marcado: GEmpty.css no tiene regla para ella
    expect(readFileSync(resolve(dist, 'grana.js'), 'utf8')).not.toContain('GLoadRegion')
    expect(js.toString()).toContain('__shared')
    // Sin copia de GEmpty, del motor ni del canal
    expect(js.toString()).not.toContain('g-empty__')
    expect(js.toString()).not.toContain('g-load-live')
    const meta = JSON.parse(readFileSync(resolve(SRC, 'components/GLoadRegion/GLoadRegion.meta.json'), 'utf8'))
    expect(Math.abs(gzipSync(js).length - meta.bundle.gzip)).toBeLessThan(1024)
  })
})

describe('@grana/vue/load-region · lo compartido llega del paquete principal (src/shared.js), sin duplicados', () => {
  const own = (key) => key === 'load-region.js' || /^components\/GLoadRegion\//.test(key)
  const keyOf = (file) => relative(SRC, file).split(sep).join('/')
  const files = ['load-region.js', ...readdirSync(resolve(SRC, 'components/GLoadRegion')).filter((f) => /\.(vue|js)$/.test(f) && !/\.test\.js$/.test(f)).map((f) => `components/GLoadRegion/${f}`)]
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

  it('GEmpty, GBtn, la clave de la región (el mismo Symbol), el motor y el canal son los del paquete principal', () => {
    expect(shared['components/GEmpty/GEmpty.vue'].default).toBe(GEmpty)
    expect(shared['components/GBtn/GBtn.vue'].default).toBe(GBtn)
    expect(shared['utils/loadPhase.js'].loadRegionKey).toBe(loadRegionKey)
    expect(shared['utils/loadPhase.js'].createLoadPhase).toBe(createLoadPhase)
    expect(shared['utils/liveRegion.js'].announcePage).toBe(announcePage)
    expect(shared['utils/liveRegion.js'].acquirePageLive).toBe(acquirePageLive)
  })
})
