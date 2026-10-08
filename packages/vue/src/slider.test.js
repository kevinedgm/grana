// Entrada `@grana/vue/slider` (slider.md «Paquete y peso», DECISIONS.md #455): GSlider va aparte del paquete principal
// (más de 8 KB gzip, criterio de #328) y toma lo compartido de `__shared` (src/shared.js), como el campo de hora (#400).
// useFormField y las claves de contexto llegan del principal (una copia crearía otro Symbol y no vería su GForm ni su
// GFormRow) y utils/keyFocus.js también (una sola escucha de documento con recuento). El motor (utils/slider.js) es propio.
import { describe, it, expect, vi } from 'vitest'
import { createApp, h } from 'vue'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { gzipSync } from 'node:zlib'
import * as main from './index.js'
import * as entry from './slider.js'
import { shared } from './shared.js'
import { formKey, layoutKey, useFormField } from './components/GForm/formContext.js'
import { observeSize } from './utils/sizeObserver.js'
import { useKeyFocus } from './utils/keyFocus.js'
import GLibIcon from './components/GIcon/GLibIcon.js'

const SRC = resolve(process.cwd(), 'src')
vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('@grana/vue/slider · entrada propia (#455)', () => {
  it('exporta GSlider, install y el plugin por defecto; nada interno (ni el motor)', () => {
    expect(Object.keys(entry).sort()).toEqual(['GSlider', 'default', 'install'])
    expect(entry.GSlider.name).toBe('GSlider')
    expect(entry.default.install).toBe(entry.install)
  })

  it('@grana/vue no lo exporta ni lo registra', () => {
    expect(main.GSlider).toBeUndefined()
    const app = createApp({ render: () => h('i') })
    app.use(main.default)
    expect(app.component('GSlider')).toBeUndefined()
  })

  it('app.use(Slider) registra <g-slider> (sin pisar uno ya registrado)', () => {
    const app = createApp({ render: () => h('i') })
    app.use(entry.default)
    expect(app.component('GSlider')).toBe(entry.GSlider)
    const app2 = createApp({ render: () => h('i') })
    const Mine = { render: () => null }
    app2.component('GSlider', Mine)
    app2.use(entry.default)
    expect(app2.component('GSlider')).toBe(Mine)
  })

  it('package.json y configuración: exports ./slider, global GranaSlider, Vue y @grana/vue externos; el motor es propio', () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'))
    expect(pkg.exports['./slider']).toEqual({ types: './dist/slider.d.ts', import: './dist/slider.js', default: './dist/slider.js' })
    expect(pkg.typesVersions['*'].slider).toEqual(['./dist/slider.d.ts'])
    expect(pkg.scripts.build).toContain('vite build -c vite.slider.config.js')
    expect(pkg.scripts.build.indexOf('vite.slider.config.js')).toBeLessThan(pkg.scripts.build.indexOf('vite.testing.config.js'))
    const cfg = readFileSync(resolve(process.cwd(), 'vite.slider.config.js'), 'utf8')
    expect(cfg).toContain("external: ['vue', '@grana/vue']")
    expect(cfg).toContain("name: 'GranaSlider'")
    expect(cfg).toContain("'@grana/vue': 'Grana'")
    expect(cfg).toContain("key === 'utils/slider.js'")
    expect(cfg).toContain('this.error(')
  })

  it('el CSS sigue en grana.css: components.css importa GSlider.css después de GFormRow.css', () => {
    const css = readFileSync(resolve(SRC, 'styles/components.css'), 'utf8')
    const at = (name) => css.indexOf(`components/${name}/${name}.css`)
    expect(at('GSlider')).toBeGreaterThan(at('GFormRow'))
  })

  it('meta.json: status, entrada y peso gzip anotado', () => {
    const meta = JSON.parse(readFileSync(resolve(SRC, 'components/GSlider/GSlider.meta.json'), 'utf8'))
    expect(meta.name).toBe('GSlider')
    expect(['draft', 'candidate']).toContain(meta.status)
    expect(meta.entry).toBe('@grana/vue/slider')
    expect(meta.bundle.gzip).toBeGreaterThan(0)
  })

  it('dist (si está construido): compuertas y el peso anotado no se desfasa más de 1 KB (gzip, bytes)', () => {
    const dist = resolve(process.cwd(), 'dist')
    if (!existsSync(resolve(dist, 'slider.js'))) return
    const js = readFileSync(resolve(dist, 'slider.js')).toString()
    expect(readFileSync(resolve(dist, 'grana.css'), 'utf8')).toContain('g-slider__pill')
    expect(readFileSync(resolve(dist, 'grana.js'), 'utf8')).not.toContain('GSlider')
    expect(js).toContain('__shared')
    expect(js, 'formContext llega por __shared: un solo Symbol(GForm)').not.toContain('Symbol("GForm")')
    expect(js, 'keyFocus llega por __shared: una sola escucha de documento').not.toContain('data-g-key-focus')
    const meta = JSON.parse(readFileSync(resolve(SRC, 'components/GSlider/GSlider.meta.json'), 'utf8'))
    expect(Math.abs(gzipSync(js).length - meta.bundle.gzip)).toBeLessThan(1024)
  })
})

describe('@grana/vue/slider · lo compartido llega del paquete principal (src/shared.js), sin duplicados', () => {
  const own = (key) => key === 'slider.js' || key === 'utils/slider.js' || /^components\/GSlider\//.test(key)
  const keyOf = (file) => relative(SRC, file).split(sep).join('/')
  const files = ['slider.js', 'utils/slider.js', ...readdirSync(resolve(SRC, 'components/GSlider')).filter((f) => /\.(vue|js)$/.test(f) && !/\.test\.js$/.test(f)).map((f) => `components/GSlider/${f}`)]
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

  it('useFormField con sus claves, GLibIcon, sizeObserver y keyFocus son los mismos del paquete principal', () => {
    const fc = shared['components/GForm/formContext.js']
    expect(fc.useFormField).toBe(useFormField)
    expect(fc.formKey).toBe(formKey)
    expect(fc.layoutKey).toBe(layoutKey)
    expect(shared['components/GIcon/GLibIcon.js'].default).toBe(GLibIcon)
    expect(shared['utils/sizeObserver.js'].observeSize).toBe(observeSize)
    expect(shared['utils/keyFocus.js'].useKeyFocus).toBe(useKeyFocus)
  })
})
