// Entrada `@grana/vue/page-index` (page-index.md «Paquete y peso», DECISIONS.md #1042): GPageIndex va aparte del paquete
// principal y toma GMenu, GLibIcon y transitionMs de `__shared` (src/shared.js), sin copia. Tope 3 KiB gzip (#1051).
import { describe, it, expect, vi } from 'vitest'
import { createApp, h } from 'vue'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { gzipSync } from 'node:zlib'
import * as main from './index.js'
import * as entry from './page-index.js'
import { shared } from './shared.js'
import GMenu from './components/GMenu/GMenu.vue'

const SRC = resolve(process.cwd(), 'src')
const CAP = 3072 // #1051
vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('@grana/vue/page-index · entrada propia (#1042)', () => {
  it('exporta GPageIndex, install y el plugin por defecto; nada interno', () => {
    expect(Object.keys(entry).sort()).toEqual(['GPageIndex', 'default', 'install'])
    expect(entry.GPageIndex.name).toBe('GPageIndex')
    expect(entry.default.install).toBe(entry.install)
  })

  it('@grana/vue no exporta ni registra GPageIndex; sí GMenu', () => {
    expect(main.GPageIndex).toBeUndefined()
    expect(main.GMenu).toBe(GMenu)
    const app = createApp({ render: () => h('i') })
    app.use(main.default)
    expect(app.component('GPageIndex')).toBeUndefined()
  })

  it('app.use(PageIndex) registra <g-page-index> (sin pisar uno ya registrado)', () => {
    const app = createApp({ render: () => h('i') })
    app.use(entry.default)
    expect(app.component('GPageIndex')).toBe(entry.GPageIndex)
    const app2 = createApp({ render: () => h('i') })
    const Mine = { render: () => null }
    app2.component('GPageIndex', Mine)
    app2.use(entry.default)
    expect(app2.component('GPageIndex')).toBe(Mine)
  })

  it('package.json, build y configuración: exports ./page-index, global GranaPageIndex, Vue y @grana/vue externos', () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'))
    expect(pkg.exports['./page-index']).toEqual({ types: './dist/page-index.d.ts', import: './dist/page-index.js', default: './dist/page-index.js' })
    expect(pkg.typesVersions['*']['page-index']).toEqual(['./dist/page-index.d.ts'])
    expect(pkg.scripts.build).toContain('vite build -c vite.page-index.config.js')
    const cfg = readFileSync(resolve(process.cwd(), 'vite.page-index.config.js'), 'utf8')
    expect(cfg).toContain("external: ['vue', '@grana/vue']")
    expect(cfg).toContain("name: 'GranaPageIndex'")
    expect(cfg).toContain("'@grana/vue': 'Grana'")
    expect(cfg).toContain('this.error(')
  })

  it('el CSS sigue en grana.css: GPageIndex.css después de GMenu.css', () => {
    const css = readFileSync(resolve(SRC, 'styles/components.css'), 'utf8')
    const at = (name) => css.indexOf(`components/${name}/${name}.css`)
    expect(at('GPageIndex')).toBeGreaterThan(at('GMenu'))
    expect(at('GMenu')).toBeGreaterThan(-1)
  })

  it('meta.json: entrada y peso gzip anotado', () => {
    const meta = JSON.parse(readFileSync(resolve(SRC, 'components/GPageIndex/GPageIndex.meta.json'), 'utf8'))
    expect(meta.entry).toBe('@grana/vue/page-index')
    expect(meta.bundle.gzip).toBeGreaterThan(0)
  })

  it('dist (si está construido): compuertas, sin copia de GMenu y el peso anotado no se desfasa más de 256 B', () => {
    const dist = resolve(process.cwd(), 'dist')
    if (!existsSync(resolve(dist, 'page-index.js'))) return
    const js = readFileSync(resolve(dist, 'page-index.js'))
    expect(readFileSync(resolve(dist, 'grana.css'), 'utf8')).toContain('g-page-index__stack')
    expect(readFileSync(resolve(dist, 'grana.js'), 'utf8')).not.toContain('GPageIndex')
    expect(js.toString()).toContain('__shared')
    expect(js.toString()).not.toContain('g-menu__dest') // sin copia de GMenu
    const gz = gzipSync(js, { level: 9 }).length
    const meta = JSON.parse(readFileSync(resolve(SRC, 'components/GPageIndex/GPageIndex.meta.json'), 'utf8'))
    expect(Math.abs(gz - meta.bundle.gzip)).toBeLessThan(256)
    expect(gz).toBeLessThanOrEqual(CAP)
    expect(meta.bundle.cap).toBe(CAP)
  })
})

describe('@grana/vue/page-index · lo compartido llega del paquete principal (src/shared.js), sin duplicados', () => {
  const own = (key) => key === 'page-index.js' || /^components\/GPageIndex\//.test(key)
  const keyOf = (file) => relative(SRC, file).split(sep).join('/')
  const files = ['page-index.js', ...readdirSync(resolve(SRC, 'components/GPageIndex')).filter((f) => /\.(vue|js)$/.test(f) && !/\.test\.js$/.test(f)).map((f) => `components/GPageIndex/${f}`)]
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
    expect(imports.map((i) => i.key).sort()).toEqual(['components/GIcon/GLibIcon.js', 'components/GMenu/GMenu.vue', 'utils/motion.js'])
    for (const { from, key, names } of imports) {
      expect(shared[key], `${from} → ${key}`).toBeTruthy()
      for (const n of names) expect(shared[key][n], `${from} → ${key} · ${n}`).toBeDefined()
    }
  })

  it('GMenu es el mismo componente del principal', () => {
    expect(shared['components/GMenu/GMenu.vue'].default).toBe(GMenu)
  })
})
