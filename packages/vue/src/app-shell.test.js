// Entrada `@grana/vue/app-shell` (app-shell.md «Paquete y peso», DECISIONS.md #716): GAppShell va aparte del paquete
// principal y toma lo compartido de `__shared` (src/shared.js). En el principal solo crecen EDGE_ORDER.appShell y la clave del
// canal (utils/appShell.js); el registro de reservas de borde y la clave son los mismos que usa GPageHeader (una sola
// instancia por documento: la isla y los avisos ven la banda; el encabezado ve su chasis).
import { describe, it, expect, vi } from 'vitest'
import { createApp, h } from 'vue'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { gzipSync } from 'node:zlib'
import * as main from './index.js'
import * as entry from './app-shell.js'
import * as pageHeaderEntry from './page-header.js'
import { appShellKey } from './utils/appShell.js'
import { shared } from './shared.js'
import * as edge from './utils/edgeReserve.js'
import { observeSize } from './utils/sizeObserver.js'
import { nextFrame, spaceUnit } from './components/GForm/formContext.js'

const SRC = resolve(process.cwd(), 'src')
vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('@grana/vue/app-shell · entrada propia (#716)', () => {
  it('exporta GAppShell, install y el plugin por defecto; nada interno', () => {
    expect(Object.keys(entry).sort()).toEqual(['GAppShell', 'default', 'install'])
    expect(entry.GAppShell.name).toBe('GAppShell')
    expect(entry.default.install).toBe(entry.install)
  })

  it('@grana/vue no exporta ni registra GAppShell', () => {
    expect(main.GAppShell).toBeUndefined()
    const app = createApp({ render: () => h('i') })
    app.use(main.default)
    expect(app.component('GAppShell')).toBeUndefined()
  })

  it('app.use(AppShell) registra <g-app-shell> (sin pisar uno ya registrado)', () => {
    const app = createApp({ render: () => h('i') })
    app.use(entry.default)
    expect(app.component('GAppShell')).toBe(entry.GAppShell)
    const app2 = createApp({ render: () => h('i') })
    const Mine = { render: () => null }
    app2.component('GAppShell', Mine)
    app2.use(entry.default)
    expect(app2.component('GAppShell')).toBe(Mine)
  })

  it('EDGE_ORDER: el chasis es lo más cercano al borde (5, #714)', () => {
    expect(edge.EDGE_ORDER.appShell).toBe(5)
    for (const k of ['speech', 'pageHeader', 'fab', 'status']) expect(edge.EDGE_ORDER.appShell, k).toBeLessThan(edge.EDGE_ORDER[k])
  })

  it('sin efectos al importar: ni escuchas, ni nodos, ni avisos (#444)', async () => {
    vi.resetModules()
    const add = vi.spyOn(window, 'addEventListener')
    const addDoc = vi.spyOn(document, 'addEventListener')
    const nodes = document.body.innerHTML
    const mod = await import('./app-shell.js')
    expect(mod.GAppShell).toBeTruthy()
    expect(add).not.toHaveBeenCalled()
    expect(addDoc).not.toHaveBeenCalled()
    expect(document.body.innerHTML).toBe(nodes)
    add.mockRestore()
    addDoc.mockRestore()
  })

  it('package.json, build y configuración: exports ./app-shell, global GranaAppShell, Vue y @grana/vue externos', () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'))
    expect(pkg.exports['./app-shell']).toEqual({ types: './dist/app-shell.d.ts', import: './dist/app-shell.js', default: './dist/app-shell.js' })
    expect(pkg.typesVersions['*']['app-shell']).toEqual(['./dist/app-shell.d.ts'])
    expect(pkg.scripts.build).toContain('vite build -c vite.app-shell.config.js')
    const cfg = readFileSync(resolve(process.cwd(), 'vite.app-shell.config.js'), 'utf8')
    expect(cfg).toContain("external: ['vue', '@grana/vue']")
    expect(cfg).toContain("name: 'GranaAppShell'")
    expect(cfg).toContain("'@grana/vue': 'Grana'")
    expect(cfg).toContain('this.error(')
  })

  it('el CSS sigue en grana.css, después de GSidebar, GAccordion y GPageHeader', () => {
    const css = readFileSync(resolve(SRC, 'styles/components.css'), 'utf8')
    const at = (name) => css.indexOf(`components/${name}/${name}.css`)
    expect(at('GAppShell')).toBeGreaterThan(-1)
    for (const dep of ['GSidebar', 'GAccordion', 'GPageHeader']) expect(at('GAppShell'), `tras ${dep}`).toBeGreaterThan(at(dep))
  })

  it('meta.json: entrada y peso gzip anotado', () => {
    const meta = JSON.parse(readFileSync(resolve(SRC, 'components/GAppShell/GAppShell.meta.json'), 'utf8'))
    expect(meta.entry).toBe('@grana/vue/app-shell')
    expect(meta.bundle.global).toBe('GranaAppShell')
    expect(meta.bundle.gzip).toBeGreaterThan(0)
  })

  it('dist (si está construido): compuertas, tope de 4 KiB (#716) y el peso anotado no se desfasa más de 1 KB (gzip, bytes)', () => {
    const dist = resolve(process.cwd(), 'dist')
    if (!existsSync(resolve(dist, 'app-shell.js'))) return
    const js = readFileSync(resolve(dist, 'app-shell.js'))
    const css = readFileSync(resolve(dist, 'grana.css'), 'utf8')
    expect(css).toContain('g-app-shell__frame')
    expect(css).toContain('g-app-shell__skip')
    expect(readFileSync(resolve(dist, 'grana.js'), 'utf8')).not.toContain('GAppShell')
    expect(js.toString()).toContain('__shared')
    // Sin copia del registro de bordes (su WeakMap de documentos) ni del observador compartido
    expect(js.toString()).not.toContain('new WeakMap')
    expect(js.toString()).not.toContain('new ResizeObserver')
    const meta = JSON.parse(readFileSync(resolve(SRC, 'components/GAppShell/GAppShell.meta.json'), 'utf8'))
    expect(Math.abs(gzipSync(js, { level: 9 }).length - meta.bundle.gzip)).toBeLessThan(1024)
    expect(gzipSync(js, { level: 9 }).length).toBeLessThanOrEqual(4096)
  })
})

describe('@grana/vue/app-shell · lo compartido llega del paquete principal (src/shared.js), sin duplicados', () => {
  const own = (key) => key === 'app-shell.js' || /^components\/GAppShell\//.test(key)
  const keyOf = (file) => relative(SRC, file).split(sep).join('/')
  const files = ['app-shell.js', ...readdirSync(resolve(SRC, 'components/GAppShell')).filter((f) => /\.(vue|js)$/.test(f) && !/\.test\.js$/.test(f)).map((f) => `components/GAppShell/${f}`)]
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

  it('el registro de bordes, la clave del canal y el observador son los del paquete principal (una sola instancia)', () => {
    expect(imports.some((i) => i.key === 'utils/edgeReserve.js')).toBe(true)
    expect(imports.some((i) => i.key === 'utils/appShell.js')).toBe(true)
    expect(shared['utils/edgeReserve.js'].setEdgeReserve).toBe(edge.setEdgeReserve)
    expect(shared['utils/edgeReserve.js'].clearEdgeReserve).toBe(edge.clearEdgeReserve)
    expect(shared['utils/edgeReserve.js'].EDGE_ORDER).toBe(edge.EDGE_ORDER)
    expect(shared['utils/appShell.js'].appShellKey).toBe(appShellKey)
    expect(shared['utils/sizeObserver.js'].observeSize).toBe(observeSize)
    expect(shared['components/GForm/formContext.js'].spaceUnit).toBe(spaceUnit)
    expect(shared['components/GForm/formContext.js'].nextFrame).toBe(nextFrame)
  })

  it('GPageHeader (otra entrada) inyecta la misma clave por __shared', () => {
    const src = readFileSync(resolve(SRC, 'components/GPageHeader/GPageHeader.vue'), 'utf8')
    expect(src).toContain("import { appShellKey } from '../../utils/appShell.js'")
    expect(pageHeaderEntry.GPageHeader).toBeTruthy()
  })

  it('dist (si está construido): app-shell.js toma la clave y el registro de __shared, sin copias', () => {
    const dist = resolve(process.cwd(), 'dist')
    if (!existsSync(resolve(dist, 'app-shell.js'))) return
    const js = readFileSync(resolve(dist, 'app-shell.js'), 'utf8')
    expect(js).toContain('__shared')
    expect(js).not.toContain('new WeakMap')
    expect(js).not.toContain('new ResizeObserver')
    expect(js).not.toContain('Symbol("g-app-shell")')
    expect(js).not.toContain("Symbol('g-app-shell')")
  })
})
