// Extensión `@grana/vue/page-index-list` (page-index.md «Extensión», DECISIONS.md #1054): la forma `list` de GPageIndex va
// aparte del principal y de page-index.js; el plugin conecta por una clave interna que llega de `__shared`. Tope 2 KiB.
import { describe, it, expect, vi } from 'vitest'
import { createApp, h } from 'vue'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { gzipSync } from 'node:zlib'
import * as main from './index.js'
import * as entry from './page-index-list.js'
import { shared } from './shared.js'
import GPageIndexList from './components/GPageIndex/GPageIndexList.js'
import { pageIndexListKey } from './utils/pageIndexList.js'

const SRC = resolve(process.cwd(), 'src')
const CAP = 2304 // #1067
vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('@grana/vue/page-index-list · extensión (#1054)', () => {
  it('exporta install y el plugin por defecto; ningún componente', () => {
    expect(Object.keys(entry).sort()).toEqual(['default', 'install'])
    expect(entry.default.install).toBe(entry.install)
  })

  it('el plugin provee la forma con la clave interna; el principal no la exporta', () => {
    expect(Object.values(main)).not.toContain(GPageIndexList)
    const app = createApp({ render: () => h('i') })
    app.use(entry.default)
    expect(app._context.provides[pageIndexListKey]).toBe(GPageIndexList)
  })

  it('package.json, build y configuración: exports ./page-index-list, global GranaPageIndexList, Vue y @grana/vue externos', () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'))
    expect(pkg.exports['./page-index-list']).toEqual({ types: './dist/page-index-list.d.ts', import: './dist/page-index-list.js', default: './dist/page-index-list.js' })
    expect(pkg.typesVersions['*']['page-index-list']).toEqual(['./dist/page-index-list.d.ts'])
    expect(pkg.scripts.build).toContain('vite build -c vite.page-index-list.config.js')
    const cfg = readFileSync(resolve(process.cwd(), 'vite.page-index-list.config.js'), 'utf8')
    expect(cfg).toContain("external: ['vue', '@grana/vue']")
    expect(cfg).toContain("name: 'GranaPageIndexList'")
    expect(cfg).toContain('this.error(')
  })

  it('dist (si está construido): la forma no viaja en page-index.js ni en grana.js, sin copia del motor, ≤ 2 KiB y peso anotado', () => {
    const dist = resolve(process.cwd(), 'dist')
    if (!existsSync(resolve(dist, 'page-index-list.js'))) return
    const js = readFileSync(resolve(dist, 'page-index-list.js'))
    expect(readFileSync(resolve(dist, 'page-index.js'), 'utf8')).not.toContain('g-page-index__marker')
    expect(readFileSync(resolve(dist, 'grana.js'), 'utf8')).not.toContain('g-page-index__marker')
    expect(js.toString()).toContain('__shared')
    expect(js.toString()).not.toContain('scrollPaddingBlockStart') // el motor de lectura se queda en page-index.js
    const gz = gzipSync(js, { level: 9 }).length
    expect(gz).toBeLessThanOrEqual(CAP)
    const meta = JSON.parse(readFileSync(resolve(SRC, 'components/GPageIndex/GPageIndex.meta.json'), 'utf8'))
    expect(meta.extension.cap).toBe(CAP)
    expect(Math.abs(gz - meta.extension.gzip)).toBeLessThan(256)
  })
})

describe('@grana/vue/page-index-list · lo compartido llega del principal (src/shared.js), sin duplicados', () => {
  const own = (key) => key === 'page-index-list.js' || key === 'components/GPageIndex/GPageIndexList.js'
  const keyOf = (file) => relative(SRC, file).split(sep).join('/')
  const imports = []
  for (const f of ['page-index-list.js', 'components/GPageIndex/GPageIndexList.js']) {
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
    expect([...new Set(imports.map((i) => i.key))].sort()).toEqual(['components/GIcon/GLibIcon.js', 'utils/pageIndexList.js'])
    for (const { from, key, names } of imports) {
      expect(shared[key], `${from} → ${key}`).toBeTruthy()
      for (const n of names) expect(shared[key][n], `${from} → ${key} · ${n}`).toBeDefined()
    }
  })

  it('la clave es el mismo Symbol que inyecta GPageIndex', () => {
    expect(shared['utils/pageIndexList.js'].pageIndexListKey).toBe(pageIndexListKey)
  })
})
