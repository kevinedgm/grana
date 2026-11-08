// Extensión `@grana/vue/sidebar-filter` (sidebar.md «Extensión y conexión», DECISIONS.md #1050): el motor del filtro de
// GSidebar va aparte del principal; el plugin conecta por una clave interna que llega de `__shared`. Tope 3 KiB gzip.
import { describe, it, expect, vi } from 'vitest'
import { createApp, createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { gzipSync } from 'node:zlib'
import * as main from './index.js'
import * as entry from './sidebar-filter.js'
import { shared } from './shared.js'
import GSidebar from './components/GSidebar/GSidebar.vue'
import { sidebarFilterKey } from './utils/sidebarFilter.js'

const SRC = resolve(process.cwd(), 'src')
const CAP = 3072
vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('@grana/vue/sidebar-filter · extensión (#1050)', () => {
  it('exporta el motor, install y el plugin por defecto; ningún componente', () => {
    expect(Object.keys(entry).sort()).toEqual(['createSidebarFilter', 'default', 'install'])
    expect(entry.default.install).toBe(entry.install)
  })

  it('el plugin provee el motor con la clave interna; el principal no lo exporta', () => {
    expect(main.createSidebarFilter).toBeUndefined()
    const app = createApp({ render: () => h('i') })
    app.use(entry.default)
    expect(app._context.provides[sidebarFilterKey]).toBe(entry.createSidebarFilter)
  })

  it('SSR: con el plugin, el HTML del servidor trae el campo y la lista filtrada por query', async () => {
    const items = [{ id: 'a', label: 'Alfa', href: '/a' }, { id: 'b', label: 'Beta', href: '/b' }]
    const labels = { filter: 'Filtrar', filterClear: 'Vaciar', filterCount: (n, t) => `${n}/${t}`, filterNone: () => '0' }
    const App = { render: () => h(GSidebar, { mode: 'expanded', filter: true, query: 'bet', items, label: 'N', labels }) }
    const html = await renderToString(createSSRApp(App).use(entry.default))
    expect(html).toContain('g-sidebar__filter-input')
    expect(html).toContain('1/2')
    const bare = await renderToString(createSSRApp(App))
    expect(bare).not.toContain('g-sidebar__filter-input')
  })

  it('package.json, build y configuración: exports ./sidebar-filter, global GranaSidebarFilter, Vue y @grana/vue externos', () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'))
    expect(pkg.exports['./sidebar-filter']).toEqual({ types: './dist/sidebar-filter.d.ts', import: './dist/sidebar-filter.js', default: './dist/sidebar-filter.js' })
    expect(pkg.typesVersions['*']['sidebar-filter']).toEqual(['./dist/sidebar-filter.d.ts'])
    expect(pkg.scripts.build).toContain('vite build -c vite.sidebar-filter.config.js')
    const cfg = readFileSync(resolve(process.cwd(), 'vite.sidebar-filter.config.js'), 'utf8')
    expect(cfg).toContain("external: ['vue', '@grana/vue']")
    expect(cfg).toContain("name: 'GranaSidebarFilter'")
    expect(cfg).toContain('this.error(')
  })

  it('dist (si está construido): sin motor en grana.js, sin copia de GSidebar ni de la normalización, ≤ 3 KiB y peso anotado', () => {
    const dist = resolve(process.cwd(), 'dist')
    if (!existsSync(resolve(dist, 'sidebar-filter.js'))) return
    const js = readFileSync(resolve(dist, 'sidebar-filter.js'))
    const mainJs = readFileSync(resolve(dist, 'grana.js'), 'utf8')
    expect(mainJs).not.toContain('g-sidebar__filter-input')
    expect(mainJs).not.toContain('(F3)')
    expect(js.toString()).toContain('__shared')
    expect(js.toString()).not.toContain('g-sidebar__fly-title')
    expect(js.toString()).not.toContain('NFD')
    const gz = gzipSync(js, { level: 9 }).length
    expect(gz).toBeLessThanOrEqual(CAP)
    const meta = JSON.parse(readFileSync(resolve(SRC, 'components/GSidebar/GSidebar.meta.json'), 'utf8'))
    expect(Math.abs(gz - meta.extension.bundle.gzip)).toBeLessThan(256)
  })
})

describe('@grana/vue/sidebar-filter · lo compartido llega del principal (src/shared.js), sin duplicados', () => {
  const own = (key) => key === 'sidebar-filter.js' || key === 'components/GSidebar/filterEngine.js'
  const keyOf = (file) => relative(SRC, file).split(sep).join('/')
  const imports = []
  for (const f of ['sidebar-filter.js', 'components/GSidebar/filterEngine.js']) {
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
    expect([...new Set(imports.map((i) => i.key))].sort()).toEqual(['components/GIcon/GLibIcon.js', 'utils/liveRegion.js', 'utils/match.js', 'utils/sidebarFilter.js'])
    for (const { from, key, names } of imports) {
      expect(shared[key], `${from} → ${key}`).toBeTruthy()
      for (const n of names) expect(shared[key][n], `${from} → ${key} · ${n}`).toBeDefined()
    }
  })

  it('la clave es el mismo Symbol que inyecta GSidebar', () => {
    expect(shared['utils/sidebarFilter.js'].sidebarFilterKey).toBe(sidebarFilterKey)
  })
})
