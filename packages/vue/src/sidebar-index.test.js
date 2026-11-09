// Extensión `@grana/vue/sidebar-index` (sidebar.md §«Apariencia `index`» «Extensión y conexión», DECISIONS.md #1069): la piel
// index, los grupos plegables y la marca de GSidebar van aparte del principal; el plugin conecta por una clave interna que
// llega de `__shared`. Topes: dist/sidebar-index.js ≤ 3 840 B gzip.
import { describe, it, expect, vi } from 'vitest'
import { createApp, createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { gzipSync } from 'node:zlib'
import * as main from './index.js'
import * as entry from './sidebar-index.js'
import { shared } from './shared.js'
import GSidebar from './components/GSidebar/GSidebar.vue'
import { sidebarIndexKey } from './utils/sidebarIndex.js'
import { createSidebarIndex } from './components/GSidebar/indexEngine.js'

const SRC = resolve(process.cwd(), 'src')
const CAP = 3840
vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('@grana/vue/sidebar-index · extensión (#1069)', () => {
  it('exporta solo el plugin por defecto; ningún componente ni motor', () => {
    expect(Object.keys(entry)).toEqual(['default'])
    expect(typeof entry.default.install).toBe('function')
  })

  it('el plugin provee el motor con la clave interna; el principal no lo exporta', () => {
    expect(main.createSidebarIndex).toBeUndefined()
    const app = createApp({ render: () => h('i') })
    app.use(entry.default)
    expect(app._context.provides[sidebarIndexKey]).toBe(createSidebarIndex)
  })

  it('SSR: con el plugin, el servidor pinta index y los plegados con until-found; sin él, default y abiertos', async () => {
    const items = [{ id: 'g', label: 'Grupo', collapsible: true, collapsed: true, items: [{ id: 'a', label: 'Alfa', href: '/a', code: '7' }] }]
    const App = { render: () => h(GSidebar, { appearance: 'index', mode: 'expanded', items, label: 'N', labels: {} }) }
    const html = await renderToString(createSSRApp(App).use(entry.default))
    expect(html).toContain('g-sidebar--appearance-index')
    expect(html).toContain('hidden="until-found"')
    expect(html).toContain('g-sidebar__mark')
    const bare = await renderToString(createSSRApp(App))
    expect(bare).toContain('g-sidebar--appearance-default')
    expect(bare).not.toContain('until-found')
    expect(bare).not.toContain('g-sidebar__group-body')
  })

  it('package.json, build y configuración: exports ./sidebar-index, global GranaSidebarIndex, Vue y @grana/vue externos', () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'))
    expect(pkg.exports['./sidebar-index']).toEqual({ types: './dist/sidebar-index.d.ts', import: './dist/sidebar-index.js', default: './dist/sidebar-index.js' })
    expect(pkg.typesVersions['*']['sidebar-index']).toEqual(['./dist/sidebar-index.d.ts'])
    expect(pkg.scripts.build).toContain('vite build -c vite.sidebar-index.config.js')
    const cfg = readFileSync(resolve(process.cwd(), 'vite.sidebar-index.config.js'), 'utf8')
    expect(cfg).toContain("external: ['vue', '@grana/vue']")
    expect(cfg).toContain("name: 'GranaSidebarIndex'")
    expect(cfg).toContain('this.error(')
  })

  it('dist (si está construido): sin motor en grana.js, sin copia de GSidebar ni de collapse.js, ≤ 3 840 B y peso anotado', () => {
    const dist = resolve(process.cwd(), 'dist')
    if (!existsSync(resolve(dist, 'sidebar-index.js'))) return
    const js = readFileSync(resolve(dist, 'sidebar-index.js'))
    const mainJs = readFileSync(resolve(dist, 'grana.js'), 'utf8')
    expect(mainJs).not.toContain('(A1)')
    expect(mainJs).not.toContain('g-sidebar__mark')
    expect(js.toString()).toContain('__shared')
    expect(js.toString()).not.toContain('g-sidebar__fly-title')
    expect(js.toString()).not.toContain('keepInPlace')
    const gz = gzipSync(js, { level: 9 }).length
    expect(gz).toBeLessThanOrEqual(CAP)
    const meta = JSON.parse(readFileSync(resolve(SRC, 'components/GSidebar/GSidebar.meta.json'), 'utf8'))
    expect(Math.abs(gz - meta.indexExtension.bundle.gzip)).toBeLessThan(256)
  })
})

describe('@grana/vue/sidebar-index · lo compartido llega del principal (src/shared.js), sin duplicados', () => {
  const own = (key) => key === 'sidebar-index.js' || key === 'components/GSidebar/indexEngine.js'
  const keyOf = (file) => relative(SRC, file).split(sep).join('/')
  const imports = []
  for (const f of ['sidebar-index.js', 'components/GSidebar/indexEngine.js']) {
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
    expect([...new Set(imports.map((i) => i.key))].sort()).toEqual(['components/GForm/formContext.js', 'components/GIcon/GLibIcon.js', 'utils/motion.js', 'utils/sidebarIndex.js'])
    for (const { from, key, names } of imports) {
      expect(shared[key], `${from} → ${key}`).toBeTruthy()
      for (const n of names) expect(shared[key][n], `${from} → ${key} · ${n}`).toBeDefined()
    }
  })

  it('la clave es el mismo Symbol que inyecta GSidebar', () => {
    expect(shared['utils/sidebarIndex.js'].sidebarIndexKey).toBe(sidebarIndexKey)
  })
})
