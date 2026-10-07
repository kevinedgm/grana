// Entrada `@grana/vue/time-field` (time-field.md «Paquete y peso», DECISIONS.md #400): GTimeField va aparte del paquete
// principal (más de 8 KB gzip, criterio de #328) y toma lo compartido de `__shared` (src/shared.js), como el combobox (#337)
// y el campo de archivos (#367). useFormField, las claves de contexto y ownFieldKey (N4 de GInput, #409) llegan del principal:
// una copia crearía otro Symbol y no vería su GForm ni su GInput.
import { describe, it, expect, vi } from 'vitest'
import { createApp, h } from 'vue'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { gzipSync } from 'node:zlib'
import * as main from './index.js'
import * as entry from './time-field.js'
import { shared } from './shared.js'
import GInput from './components/GInput/GInput.vue'
import { formKey, layoutKey, ownFieldKey, useFormField } from './components/GForm/formContext.js'
import { observeSize } from './utils/sizeObserver.js'

const SRC = resolve(process.cwd(), 'src')
vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('@grana/vue/time-field · entrada propia (#400)', () => {
  it('exporta GTimeField, install y el plugin por defecto; nada interno (ni el motor)', () => {
    expect(Object.keys(entry).sort()).toEqual(['GTimeField', 'default', 'install'])
    expect(entry.GTimeField.name).toBe('GTimeField')
    expect(entry.default.install).toBe(entry.install)
  })

  it('@grana/vue no lo exporta ni lo registra; tampoco ownFieldKey', () => {
    expect(main.GTimeField).toBeUndefined()
    expect(main.ownFieldKey).toBeUndefined()
    const app = createApp({ render: () => h('i') })
    app.use(main.default)
    expect(app.component('GTimeField')).toBeUndefined()
  })

  it('app.use(TimeField) registra <g-time-field> (sin pisar uno ya registrado)', () => {
    const app = createApp({ render: () => h('i') })
    app.use(entry.default)
    expect(app.component('GTimeField')).toBe(entry.GTimeField)
    const app2 = createApp({ render: () => h('i') })
    const Mine = { render: () => null }
    app2.component('GTimeField', Mine)
    app2.use(entry.default)
    expect(app2.component('GTimeField')).toBe(Mine)
  })

  it('package.json y configuración: exports ./time-field, global GranaTimeField, Vue y @grana/vue externos; timeInput es propio', () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'))
    expect(pkg.exports['./time-field']).toEqual({ types: './dist/time-field.d.ts', import: './dist/time-field.js', default: './dist/time-field.js' })
    expect(pkg.scripts.build).toContain('vite build -c vite.time-field.config.js')
    expect(pkg.scripts.build.indexOf('vite.time-field.config.js')).toBeLessThan(pkg.scripts.build.indexOf('vite.testing.config.js'))
    const cfg = readFileSync(resolve(process.cwd(), 'vite.time-field.config.js'), 'utf8')
    expect(cfg).toContain("external: ['vue', '@grana/vue']")
    expect(cfg).toContain("name: 'GranaTimeField'")
    expect(cfg).toContain("'@grana/vue': 'Grana'")
    expect(cfg).toContain("key === 'utils/timeInput.js'")
    expect(cfg).toContain('this.error(')
  })

  it('el CSS sigue en grana.css: components.css importa GTimeField.css después de GInput y GNumberField', () => {
    const css = readFileSync(resolve(SRC, 'styles/components.css'), 'utf8')
    const at = (name) => css.indexOf(`components/${name}/${name}.css`)
    expect(at('GTimeField')).toBeGreaterThan(at('GNumberField'))
    expect(at('GNumberField')).toBeGreaterThan(at('GInput'))
  })

  it('meta.json: status, entrada y peso gzip anotado', () => {
    const meta = JSON.parse(readFileSync(resolve(SRC, 'components/GTimeField/GTimeField.meta.json'), 'utf8'))
    expect(meta.name).toBe('GTimeField')
    expect(['draft', 'candidate']).toContain(meta.status)
    expect(meta.entry).toBe('@grana/vue/time-field')
    expect(meta.bundle.gzip).toBeGreaterThan(0)
  })

  it('dist (si está construido): compuertas y el peso anotado no se desfasa más de 1 KB (gzip, bytes)', () => {
    const dist = resolve(process.cwd(), 'dist')
    if (!existsSync(resolve(dist, 'time-field.js'))) return
    const js = readFileSync(resolve(dist, 'time-field.js')).toString()
    expect(readFileSync(resolve(dist, 'grana.css'), 'utf8')).toContain('g-time-field__reading')
    expect(readFileSync(resolve(dist, 'grana.js'), 'utf8')).not.toContain('GTimeField')
    expect(js).toContain('__shared')
    expect(js, 'GInput llega por __shared, sin copia').not.toMatch(/name: "GInput"/)
    expect(js, 'formContext llega por __shared: un solo Symbol(GForm)').not.toContain('Symbol("GForm")')
    expect(js).not.toContain('Symbol("GInputOwn")')
    const meta = JSON.parse(readFileSync(resolve(SRC, 'components/GTimeField/GTimeField.meta.json'), 'utf8'))
    expect(Math.abs(gzipSync(js).length - meta.bundle.gzip)).toBeLessThan(1024)
  })
})

describe('@grana/vue/time-field · lo compartido llega del paquete principal (src/shared.js), sin duplicados', () => {
  const own = (key) => key === 'time-field.js' || key === 'utils/timeInput.js' || /^components\/GTimeField\//.test(key)
  const keyOf = (file) => relative(SRC, file).split(sep).join('/')
  const files = ['time-field.js', 'utils/timeInput.js', ...readdirSync(resolve(SRC, 'components/GTimeField')).filter((f) => /\.(vue|js)$/.test(f) && !/\.test\.js$/.test(f)).map((f) => `components/GTimeField/${f}`)]
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

  it('GInput, useFormField con sus claves (y ownFieldKey) y sizeObserver son los mismos del paquete principal', () => {
    expect(shared['components/GInput/GInput.vue'].default).toBe(GInput)
    const fc = shared['components/GForm/formContext.js']
    expect(fc.useFormField).toBe(useFormField)
    expect(fc.formKey).toBe(formKey)
    expect(fc.layoutKey).toBe(layoutKey)
    expect(fc.ownFieldKey).toBe(ownFieldKey)
    expect(shared['utils/sizeObserver.js'].observeSize).toBe(observeSize)
    expect(main.formKey).toBe(formKey)
  })
})
