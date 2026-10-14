// Entrada `@grana/vue/form-fold` (form.md §15, dialog.md «Paquete y peso», DECISIONS.md #590): GFormFold va aparte del
// paquete principal y toma lo compartido de `__shared` (src/shared.js): el motor de formulario (el mismo de GForm, #588), las
// claves de contexto (los mismos Symbol), la clave de pliegues de GDialog, el motor de plegado, la llegada y el canal.
import { describe, it, expect, vi } from 'vitest'
import { createApp, h } from 'vue'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { gzipSync } from 'node:zlib'
import * as main from './index.js'
import * as entry from './form-fold.js'
import { shared } from './shared.js'
import { createFormEngine } from './components/GForm/formEngine.js'
import { foldKey, formKey, layoutKey, useFormField } from './components/GForm/formContext.js'
import { dialogFoldKey } from './components/GDialog/dialogContext.js'
import { useCollapse } from './utils/collapse.js'
import { land } from './utils/landing.js'
import { acquirePageLive, announcePage } from './utils/liveRegion.js'

const SRC = resolve(process.cwd(), 'src')
vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('@grana/vue/form-fold · entrada propia (#590)', () => {
  it('exporta GFormFold, install y el plugin por defecto; nada interno', () => {
    expect(Object.keys(entry).sort()).toEqual(['GFormFold', 'default', 'install'])
    expect(entry.GFormFold.name).toBe('GFormFold')
    expect(entry.default.install).toBe(entry.install)
  })

  it('@grana/vue no exporta ni registra GFormFold; sí GDialogStep y useDialogSteps', () => {
    expect(main.GFormFold).toBeUndefined()
    expect(main.GDialogStep.name).toBe('GDialogStep')
    expect(typeof main.useDialogSteps).toBe('function')
    const app = createApp({ render: () => h('i') })
    app.use(main.default)
    expect(app.component('GFormFold')).toBeUndefined()
    expect(app.component('GDialogStep')).toBe(main.GDialogStep)
  })

  it('las claves internas no salen del principal', () => {
    for (const k of ['foldKey', 'dialogFoldKey', 'dialogStepsKey', 'createFormEngine', 'land']) expect(main[k], k).toBeUndefined()
  })

  it('app.use(FormFold) registra <g-form-fold> (sin pisar uno ya registrado)', () => {
    const app = createApp({ render: () => h('i') })
    app.use(entry.default)
    expect(app.component('GFormFold')).toBe(entry.GFormFold)
    const app2 = createApp({ render: () => h('i') })
    const Mine = { render: () => null }
    app2.component('GFormFold', Mine)
    app2.use(entry.default)
    expect(app2.component('GFormFold')).toBe(Mine)
  })

  it('package.json, build y configuración: exports ./form-fold, global GranaFormFold, Vue y @grana/vue externos', () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'))
    expect(pkg.exports['./form-fold']).toEqual({ types: './dist/form-fold.d.ts', import: './dist/form-fold.js', default: './dist/form-fold.js' })
    expect(pkg.typesVersions['*']['form-fold']).toEqual(['./dist/form-fold.d.ts'])
    expect(pkg.scripts.build).toContain('vite build -c vite.form-fold.config.js')
    const cfg = readFileSync(resolve(process.cwd(), 'vite.form-fold.config.js'), 'utf8')
    expect(cfg).toContain("external: ['vue', '@grana/vue']")
    expect(cfg).toContain("name: 'GranaFormFold'")
    expect(cfg).toContain("'@grana/vue': 'Grana'")
    expect(cfg).toContain('this.error(')
  })

  it('meta.json: entrada declarada', () => {
    const meta = JSON.parse(readFileSync(resolve(SRC, 'components/GFormFold/GFormFold.meta.json'), 'utf8'))
    expect(meta.entry).toBe('@grana/vue/form-fold')
  })

  it('dist (si está construido): GFormFold fuera del principal y sin copia del motor ni de las claves', () => {
    const dist = resolve(process.cwd(), 'dist')
    if (!existsSync(resolve(dist, 'form-fold.js'))) return
    const js = readFileSync(resolve(dist, 'form-fold.js'))
    expect(readFileSync(resolve(dist, 'grana.js'), 'utf8')).not.toMatch(/name:\s*"GFormFold"/)
    expect(js.toString()).toMatch(/name:\s*"GFormFold"/)
    expect(js.toString()).toContain('__shared')
    expect(js.toString()).not.toContain("Symbol('GForm')")
    expect(js.toString()).not.toContain('g-load-live')
    const meta = JSON.parse(readFileSync(resolve(SRC, 'components/GFormFold/GFormFold.meta.json'), 'utf8'))
    if (meta.bundle && meta.bundle.gzip) expect(Math.abs(gzipSync(js).length - meta.bundle.gzip)).toBeLessThan(1024)
  })
})

describe('@grana/vue/form-fold · lo compartido llega del paquete principal (src/shared.js), sin duplicados', () => {
  const own = (key) => key === 'form-fold.js' || /^components\/GFormFold\//.test(key)
  const keyOf = (file) => relative(SRC, file).split(sep).join('/')
  const files = ['form-fold.js', ...readdirSync(resolve(SRC, 'components/GFormFold')).filter((f) => /\.(vue|js)$/.test(f) && !/\.test\.js$/.test(f)).map((f) => `components/GFormFold/${f}`)]
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

  it('el motor, las claves (los mismos Symbol), el plegado, la llegada y el canal son los del paquete principal', () => {
    expect(shared['components/GForm/formEngine.js'].createFormEngine).toBe(createFormEngine)
    expect(shared['components/GForm/formContext.js'].formKey).toBe(formKey)
    expect(shared['components/GForm/formContext.js'].foldKey).toBe(foldKey)
    expect(shared['components/GForm/formContext.js'].layoutKey).toBe(layoutKey)
    expect(shared['components/GForm/formContext.js'].useFormField).toBe(useFormField)
    expect(shared['components/GDialog/dialogContext.js'].dialogFoldKey).toBe(dialogFoldKey)
    expect(shared['utils/collapse.js'].useCollapse).toBe(useCollapse)
    expect(shared['utils/landing.js'].land).toBe(land)
    expect(shared['utils/liveRegion.js'].announcePage).toBe(announcePage)
    expect(shared['utils/liveRegion.js'].acquirePageLive).toBe(acquirePageLive)
  })
})
