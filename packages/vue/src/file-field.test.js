// Entrada `@grana/vue/file-field` (file-field.md «Entrega y empaquetado», DECISIONS.md #367): GFileField va aparte del paquete
// principal y toma lo compartido de `__shared` (src/shared.js), como la captura de voz (#238), la isla (#328) y el combobox
// (#337). useFormField y las claves de contexto llegan del principal: una copia crearía otro Symbol y no vería su GForm.
import { describe, it, expect, vi } from 'vitest'
import { createApp, h } from 'vue'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { gzipSync } from 'node:zlib'
import * as main from './index.js'
import * as entry from './file-field.js'
import { shared } from './shared.js'
import GBtn from './components/GBtn/GBtn.vue'
import GProgress from './components/GProgress/GProgress.vue'
import GSummary from './components/GSummary/GSummary.vue'
import GLibIcon from './components/GIcon/GLibIcon.js'
import { formKey, revealKey, useFormField } from './components/GForm/formContext.js'
import { formatFileSize } from './components/GFileField/engine.js'

const SRC = resolve(process.cwd(), 'src')
vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('@grana/vue/file-field · entrada propia (#367)', () => {
  it('exporta GFileField, formatFileSize, install y el plugin por defecto; nada interno', () => {
    expect(Object.keys(entry).sort()).toEqual(['GFileField', 'default', 'formatFileSize', 'install'])
    expect(entry.GFileField.name).toBe('GFileField')
    expect(entry.formatFileSize).toBe(formatFileSize)
    expect(entry.default.install).toBe(entry.install)
  })

  it('@grana/vue no lo exporta ni lo registra en su install; tampoco formatFileSize ni el simulado', () => {
    expect(main.GFileField).toBeUndefined()
    expect(main.formatFileSize).toBeUndefined()
    expect(main.createSimulatedUploader).toBeUndefined()
    const app = createApp({ render: () => h('i') })
    app.use(main.default)
    expect(app.component('GFileField')).toBeUndefined()
  })

  it('app.use(FileField) registra <g-file-field> (sin pisar uno ya registrado)', () => {
    const app = createApp({ render: () => h('i') })
    app.use(entry.default)
    expect(app.component('GFileField')).toBe(entry.GFileField)
    const app2 = createApp({ render: () => h('i') })
    const Mine = { render: () => null }
    app2.component('GFileField', Mine)
    app2.use(entry.default)
    expect(app2.component('GFileField')).toBe(Mine)
  })

  it('package.json, build y configuración: exports ./file-field, global GranaFileField, Vue y @grana/vue externos; fileDrag es propio', () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'))
    expect(pkg.exports['./file-field']).toEqual({ types: './dist/file-field.d.ts', import: './dist/file-field.js', default: './dist/file-field.js' })
    expect(pkg.scripts.build).toContain('vite build -c vite.file-field.config.js')
    expect(pkg.scripts.build.indexOf('vite.file-field.config.js')).toBeLessThan(pkg.scripts.build.indexOf('vite.testing.config.js'))
    const cfg = readFileSync(resolve(process.cwd(), 'vite.file-field.config.js'), 'utf8')
    expect(cfg).toContain("external: ['vue', '@grana/vue']")
    expect(cfg).toContain("name: 'GranaFileField'")
    expect(cfg).toContain("'@grana/vue': 'Grana'")
    expect(cfg).toContain("key === 'utils/fileDrag.js'")
    expect(cfg).toContain('this.error(')
  })

  it('el CSS sigue en grana.css: components.css importa GFileField.css después de GSummary, GProgress, GBtn e GIcon', () => {
    const css = readFileSync(resolve(SRC, 'styles/components.css'), 'utf8')
    const at = (name) => css.indexOf(`components/${name}/${name}.css`)
    expect(at('GFileField')).toBeGreaterThan(-1)
    for (const dep of ['GSummary', 'GProgress', 'GBtn', 'GIcon', 'GAvatar']) expect(at('GFileField'), dep).toBeGreaterThan(at(dep))
  })

  it('meta.json: status, entrada y peso gzip anotado', () => {
    const meta = JSON.parse(readFileSync(resolve(SRC, 'components/GFileField/GFileField.meta.json'), 'utf8'))
    expect(meta.name).toBe('GFileField')
    expect(['draft', 'candidate']).toContain(meta.status)
    expect(meta.entry).toBe('@grana/vue/file-field')
    expect(meta.bundle.gzip).toBeGreaterThan(0)
  })

  it('dist (si está construido): compuertas y el peso anotado no se desfasa más de 1 KB (gzip, bytes)', () => {
    const dist = resolve(process.cwd(), 'dist')
    if (!existsSync(resolve(dist, 'file-field.js'))) return
    const js = readFileSync(resolve(dist, 'file-field.js'))
    const css = readFileSync(resolve(dist, 'grana.css'), 'utf8')
    expect(css).toContain('g-file-field__chip')
    expect(css).toContain('g-file-field-land')
    expect(readFileSync(resolve(dist, 'grana.js'), 'utf8')).not.toContain('GFileField')
    expect(js.toString()).toContain('__shared')
    expect(js.toString(), 'la ficha (GSummary) llega por __shared, sin copia').not.toContain('g-summary__')
    expect(js.toString(), 'formContext llega por __shared: un solo Symbol(GForm)').not.toContain("Symbol(\"GForm\")")
    const meta = JSON.parse(readFileSync(resolve(SRC, 'components/GFileField/GFileField.meta.json'), 'utf8'))
    expect(Math.abs(gzipSync(js).length - meta.bundle.gzip)).toBeLessThan(1024)
  })
})

describe('@grana/vue/file-field · lo compartido llega del paquete principal (src/shared.js), sin duplicados', () => {
  const own = (key) => key === 'file-field.js' || key === 'utils/fileDrag.js' || /^components\/GFileField\//.test(key)
  const keyOf = (file) => relative(SRC, file).split(sep).join('/')
  const files = ['file-field.js', 'utils/fileDrag.js', ...readdirSync(resolve(SRC, 'components/GFileField')).filter((f) => /\.(vue|js)$/.test(f) && !/(\.test\.js|TestEnv\.js|simulatedUploader\.js)$/.test(f)).map((f) => `components/GFileField/${f}`)]
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
      expect(readFileSync(resolve(SRC, 'shared.js'), 'utf8')).toContain(`'${key}':`)
    }
  })

  it('GSummary, GProgress, GBtn, GIcon interno y useFormField con sus claves son los mismos del paquete principal', () => {
    expect(shared['components/GSummary/GSummary.vue'].default).toBe(GSummary)
    expect(shared['components/GProgress/GProgress.vue'].default).toBe(GProgress)
    expect(shared['components/GBtn/GBtn.vue'].default).toBe(GBtn)
    expect(shared['components/GIcon/GLibIcon.js'].default).toBe(GLibIcon)
    const fc = shared['components/GForm/formContext.js']
    expect(fc.useFormField).toBe(useFormField)
    expect(fc.formKey).toBe(formKey)
    expect(fc.revealKey).toBe(revealKey)
    expect(main.useFormField).toBe(useFormField)
    expect(main.formKey).toBe(formKey)
  })
})
