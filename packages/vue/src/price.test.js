// Entrada `@grana/vue/price` (price.md «Paquete y peso», DECISIONS.md #776): GPrice, GPriceScope, formatPrice y currencyDigits
// aparte del principal; los datos de la moneda (utils/currency.js con la tabla de símbolos), template, oneOf, nextFrame y
// GLibIcon llegan de `__shared` (src/shared.js), sin copia.
import { describe, it, expect, vi } from 'vitest'
import { createApp, h } from 'vue'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { gzipSync } from 'node:zlib'
import * as main from './index.js'
import * as entry from './price.js'
import { shared } from './shared.js'
import * as currency from './utils/currency.js'

const SRC = resolve(process.cwd(), 'src')
vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('@grana/vue/price · entrada propia (#776)', () => {
  it('exporta GPrice, GPriceScope, formatPrice, currencyDigits, install y el plugin', () => {
    expect(Object.keys(entry).sort()).toEqual(['GPrice', 'GPriceScope', 'currencyDigits', 'default', 'formatPrice', 'install'])
    expect(entry.default.install).toBe(entry.install)
    expect(entry.currencyDigits).toBe(currency.currencyDigits)
  })
  it('@grana/vue no los exporta ni los registra', () => {
    for (const k of ['GPrice', 'GPriceScope', 'formatPrice', 'currencyDigits']) expect(main[k], k).toBeUndefined()
    const app = createApp({ render: () => h('i') })
    app.use(main.default)
    expect(app.component('GPrice')).toBeUndefined()
  })
  it('app.use(Price) registra los dos (sin pisar uno ya registrado)', () => {
    const app = createApp({ render: () => h('i') })
    app.use(entry.default)
    expect(app.component('GPrice')).toBe(entry.GPrice)
    expect(app.component('GPriceScope')).toBe(entry.GPriceScope)
    const app2 = createApp({ render: () => h('i') })
    const Mine = { render: () => null }
    app2.component('GPrice', Mine)
    app2.use(entry.default)
    expect(app2.component('GPrice')).toBe(Mine)
  })
  it('package.json y configuración: exports ./price, global GranaPrice, la tabla antes de Vite', () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'))
    expect(pkg.exports['./price']).toEqual({ types: './dist/price.d.ts', import: './dist/price.js', default: './dist/price.js' })
    expect(pkg.typesVersions['*'].price).toEqual(['./dist/price.d.ts'])
    expect(pkg.scripts.build.startsWith('node scripts/currency-symbols.mjs && vite build')).toBe(true)
    expect(pkg.scripts.build).toContain('vite build -c vite.price.config.js')
    const cfg = readFileSync(resolve(process.cwd(), 'vite.price.config.js'), 'utf8')
    expect(cfg).toContain("external: ['vue', '@grana/vue']")
    expect(cfg).toContain("name: 'GranaPrice'")
    expect(cfg).toContain("key === 'utils/price.js'")
  })
  it('components.css registra GPrice.css y GPriceScope.css después de GDatePicker', () => {
    const css = readFileSync(resolve(SRC, 'styles/components.css'), 'utf8')
    const at = (n) => css.indexOf(`components/${n}/${n}.css`)
    expect(at('GPrice')).toBeGreaterThan(at('GDatePicker'))
    expect(at('GPriceScope')).toBeGreaterThan(at('GPrice'))
  })
  it('dist (si está construido): compuertas y peso dentro del tope de 6 KiB', () => {
    const dist = resolve(process.cwd(), 'dist')
    if (!existsSync(resolve(dist, 'price.js'))) return
    const js = readFileSync(resolve(dist, 'price.js'))
    const mainJs = readFileSync(resolve(dist, 'grana.js'), 'utf8')
    expect(mainJs).not.toContain('GPriceScope')
    expect(mainJs).not.toContain('formatPrice')
    expect(mainJs).not.toContain('supportedValuesOf')
    expect(js.toString()).not.toContain('supportedValuesOf')
    expect(js.toString(), 'la tabla llega por __shared').not.toContain('"Rs"')
    expect(gzipSync(js).length).toBeLessThanOrEqual(6144)
    const meta = JSON.parse(readFileSync(resolve(SRC, 'components/GPrice/GPrice.meta.json'), 'utf8'))
    expect(Math.abs(gzipSync(js).length - meta.bundle.gzip)).toBeLessThan(1024)
  })
})

describe('@grana/vue/price · lo compartido llega del principal', () => {
  const own = (key) => key === 'price.js' || key === 'utils/price.js' || /^components\/(GPrice|GPriceScope)\//.test(key)
  const keyOf = (file) => relative(SRC, file).split(sep).join('/')
  const files = ['price.js', 'utils/price.js', ...['GPrice', 'GPriceScope'].flatMap((d) => readdirSync(resolve(SRC, 'components', d)).filter((f) => /\.(vue|js)$/.test(f) && !/\.test\.js$/.test(f)).map((f) => `components/${d}/${f}`))]
  it('importa del principal solo lo que src/shared.js expone, nombre por nombre', () => {
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
      }
    }
    expect(n).toBeGreaterThan(3)
    expect(shared['utils/currency.js'].currencyDigits).toBe(currency.currencyDigits)
  })
})
