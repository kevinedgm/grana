// Entrada `@grana/vue/nav-bar` (nav-bar.md «Paquete y peso», DECISIONS.md #1053, #1059): GNavBar va aparte del paquete
// principal y toma GLibIcon, la luz (utils/glide.js), la guarda de `target` y el canal del chasis de `__shared`, sin copia.
// Tope 3,5 KiB gzip; grana.js solo crece por las dos exportaciones nuevas de la luz.
import { describe, it, expect, vi } from 'vitest'
import { createApp, h } from 'vue'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { gzipSync } from 'node:zlib'
import * as main from './index.js'
import * as entry from './nav-bar.js'
import { shared } from './shared.js'
import { createPointerGlide, flashInstant } from './utils/glide.js'
import { appShellKey } from './utils/appShell.js'

const SRC = resolve(process.cwd(), 'src')
const CAP = 3584 // #1059
vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('@grana/vue/nav-bar · entrada propia (#1053)', () => {
  it('exporta GNavBar, install y el plugin por defecto; nada interno', () => {
    expect(Object.keys(entry).sort()).toEqual(['GNavBar', 'default', 'install'])
    expect(entry.GNavBar.name).toBe('GNavBar')
    expect(entry.default.install).toBe(entry.install)
  })

  it('@grana/vue no exporta ni registra GNavBar', () => {
    expect(main.GNavBar).toBeUndefined()
    const app = createApp({ render: () => h('i') })
    app.use(main.default)
    expect(app.component('GNavBar')).toBeUndefined()
  })

  it('app.use(NavBar) registra <g-nav-bar> (sin pisar uno ya registrado)', () => {
    const app = createApp({ render: () => h('i') })
    app.use(entry.default)
    expect(app.component('GNavBar')).toBe(entry.GNavBar)
    const app2 = createApp({ render: () => h('i') })
    const Mine = { render: () => null }
    app2.component('GNavBar', Mine)
    app2.use(entry.default)
    expect(app2.component('GNavBar')).toBe(Mine)
  })

  it('package.json, build y configuración: exports ./nav-bar, global GranaNavBar, Vue y @grana/vue externos', () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'))
    expect(pkg.exports['./nav-bar']).toEqual({ types: './dist/nav-bar.d.ts', import: './dist/nav-bar.js', default: './dist/nav-bar.js' })
    expect(pkg.typesVersions['*']['nav-bar']).toEqual(['./dist/nav-bar.d.ts'])
    expect(pkg.scripts.build).toContain('vite build -c vite.nav-bar.config.js')
    const cfg = readFileSync(resolve(process.cwd(), 'vite.nav-bar.config.js'), 'utf8')
    expect(cfg).toContain("external: ['vue', '@grana/vue']")
    expect(cfg).toContain("name: 'GranaNavBar'")
    expect(cfg).toContain("'@grana/vue': 'Grana'")
    expect(cfg).toContain('this.error(')
  })

  it('el CSS sigue en grana.css (components.css importa GNavBar.css)', () => {
    const css = readFileSync(resolve(SRC, 'styles/components.css'), 'utf8')
    expect(css).toContain('components/GNavBar/GNavBar.css')
  })

  it('dist (si está construido): sin GNavBar en grana.js, sin copia de la luz, ≤ 3,5 KiB y peso anotado', () => {
    const dist = resolve(process.cwd(), 'dist')
    if (!existsSync(resolve(dist, 'nav-bar.js'))) return
    const js = readFileSync(resolve(dist, 'nav-bar.js'))
    expect(readFileSync(resolve(dist, 'grana.js'), 'utf8')).not.toContain('GNavBar')
    expect(js.toString()).toContain('__shared')
    expect(js.toString()).not.toContain('_glideTurn') // utils/glide.js llega por __shared
    expect(js.toString()).not.toContain('<svg') // GLibIcon tampoco se copia
    const gz = gzipSync(js, { level: 9 }).length
    expect(gz).toBeLessThanOrEqual(CAP)
    const meta = JSON.parse(readFileSync(resolve(SRC, 'components/GNavBar/GNavBar.meta.json'), 'utf8'))
    expect(meta.bundle.cap).toBe(CAP)
    expect(Math.abs(gz - meta.bundle.gzip)).toBeLessThan(256)
  })
})

describe('@grana/vue/nav-bar · lo compartido llega del principal (src/shared.js), sin duplicados', () => {
  const own = (key) => key === 'nav-bar.js' || /^components\/GNavBar\//.test(key)
  const keyOf = (file) => relative(SRC, file).split(sep).join('/')
  const files = ['nav-bar.js', ...readdirSync(resolve(SRC, 'components/GNavBar')).filter((f) => /\.(vue|js)$/.test(f) && !/\.test\.js$/.test(f)).map((f) => `components/GNavBar/${f}`)]
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
    expect([...new Set(imports.map((i) => i.key))].sort()).toEqual(['components/GIcon/GLibIcon.js', 'utils/appShell.js', 'utils/glide.js', 'utils/link.js'])
    for (const { from, key, names } of imports) {
      expect(shared[key], `${from} → ${key}`).toBeTruthy()
      for (const n of names) expect(shared[key][n], `${from} → ${key} · ${n}`).toBeDefined()
    }
  })

  it('la luz y la clave del chasis son las del principal (N-H2)', () => {
    expect(shared['utils/glide.js'].createPointerGlide).toBe(createPointerGlide)
    expect(shared['utils/glide.js'].flashInstant).toBe(flashInstant)
    expect(shared['utils/appShell.js'].appShellKey).toBe(appShellKey)
  })
})
