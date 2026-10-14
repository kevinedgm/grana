// Entrada `@grana/vue/card-group` (card-group.md «Paquete, meta.json y tipos», DECISIONS.md #610): GCardGroup va aparte del
// paquete principal y toma la clave del contexto y transitionMs de `__shared` (src/shared.js). GCard sigue en el principal.
import { describe, it, expect, vi } from 'vitest'
import { createApp, h } from 'vue'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { gzipSync } from 'node:zlib'
import * as main from './index.js'
import * as entry from './card-group.js'
import { shared } from './shared.js'
import GCard from './components/GCard/GCard.vue'
import { cardGroupKey } from './utils/cardGroup.js'
import { transitionMs } from './utils/motion.js'

const SRC = resolve(process.cwd(), 'src')
vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('@grana/vue/card-group · entrada propia (#610)', () => {
  it('exporta GCardGroup, install y el plugin por defecto; nada interno', () => {
    expect(Object.keys(entry).sort()).toEqual(['GCardGroup', 'default', 'install'])
    expect(entry.GCardGroup.name).toBe('GCardGroup')
    expect(entry.default.install).toBe(entry.install)
  })

  it('@grana/vue no exporta ni registra GCardGroup; sí GCard', () => {
    expect(main.GCardGroup).toBeUndefined()
    expect(main.GCard).toBe(GCard)
    const app = createApp({ render: () => h('i') })
    app.use(main.default)
    expect(app.component('GCardGroup')).toBeUndefined()
    expect(app.component('GCard')).toBe(GCard)
  })

  it('app.use(CardGroup) registra <g-card-group> (sin pisar uno ya registrado)', () => {
    const app = createApp({ render: () => h('i') })
    app.use(entry.default)
    expect(app.component('GCardGroup')).toBe(entry.GCardGroup)
    const app2 = createApp({ render: () => h('i') })
    const Mine = { render: () => null }
    app2.component('GCardGroup', Mine)
    app2.use(entry.default)
    expect(app2.component('GCardGroup')).toBe(Mine)
  })

  it('package.json, build y configuración: exports ./card-group, global GranaCardGroup, Vue y @grana/vue externos', () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'))
    expect(pkg.exports['./card-group']).toEqual({ types: './dist/card-group.d.ts', import: './dist/card-group.js', default: './dist/card-group.js' })
    expect(pkg.typesVersions['*']['card-group']).toEqual(['./dist/card-group.d.ts'])
    expect(pkg.scripts.build).toContain('vite build -c vite.card-group.config.js')
    const cfg = readFileSync(resolve(process.cwd(), 'vite.card-group.config.js'), 'utf8')
    expect(cfg).toContain("external: ['vue', '@grana/vue']")
    expect(cfg).toContain("name: 'GranaCardGroup'")
    expect(cfg).toContain("'@grana/vue': 'Grana'")
    expect(cfg).toContain('this.error(')
  })

  it('el CSS sigue en grana.css: GCardGroup.css después de GCard.css', () => {
    const css = readFileSync(resolve(SRC, 'styles/components.css'), 'utf8')
    const at = (name) => css.indexOf(`components/${name}/${name}.css`)
    expect(at('GCardGroup')).toBeGreaterThan(at('GCard'))
    expect(at('GCard')).toBeGreaterThan(-1)
  })

  it('meta.json: entrada y peso gzip anotado; GCard sigue en el principal', () => {
    const meta = JSON.parse(readFileSync(resolve(SRC, 'components/GCardGroup/GCardGroup.meta.json'), 'utf8'))
    expect(meta.entry).toBe('@grana/vue/card-group')
    expect(meta.bundle.gzip).toBeGreaterThan(0)
    expect(meta.bundle.gzip).toBeLessThanOrEqual(8192) // compuerta por componente (#472, #610)
  })

  it('dist (si está construido): compuertas y el peso anotado no se desfasa más de 1 KB (gzip, bytes)', () => {
    const dist = resolve(process.cwd(), 'dist')
    if (!existsSync(resolve(dist, 'card-group.js'))) return
    const js = readFileSync(resolve(dist, 'card-group.js'))
    expect(readFileSync(resolve(dist, 'grana.css'), 'utf8')).toContain('g-card-group__bridge')
    expect(readFileSync(resolve(dist, 'grana.js'), 'utf8')).not.toContain('GCardGroup')
    expect(js.toString()).toContain('__shared')
    // Sin copia de GCard
    expect(js.toString()).not.toContain('g-card__selectbox')
    expect(gzipSync(js, { level: 9 }).length).toBeLessThanOrEqual(8192)
    const meta = JSON.parse(readFileSync(resolve(SRC, 'components/GCardGroup/GCardGroup.meta.json'), 'utf8'))
    expect(Math.abs(gzipSync(js, { level: 9 }).length - meta.bundle.gzip)).toBeLessThan(1024)
  })
})

describe('@grana/vue/card-group · lo compartido llega del paquete principal (src/shared.js), sin duplicados', () => {
  const own = (key) => key === 'card-group.js' || /^components\/GCardGroup\//.test(key)
  const keyOf = (file) => relative(SRC, file).split(sep).join('/')
  const files = ['card-group.js', ...readdirSync(resolve(SRC, 'components/GCardGroup')).filter((f) => /\.(vue|js)$/.test(f) && !/\.test\.js$/.test(f)).map((f) => `components/GCardGroup/${f}`)]
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

  it('la clave del contexto es el mismo Symbol que lee GCard; transitionMs es el del principal', () => {
    expect(shared['utils/cardGroup.js'].cardGroupKey).toBe(cardGroupKey)
    expect(shared['utils/motion.js'].transitionMs).toBe(transitionMs)
  })
})
