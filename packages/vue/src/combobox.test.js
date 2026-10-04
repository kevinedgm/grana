// Entrada `@grana/vue/combobox` (combobox.md «Entrega y empaquetado», DECISIONS.md #337): GCombobox va aparte del paquete
// principal y toma lo compartido de `__shared` (src/shared.js), como la captura de voz (#238) y la isla de estado (#328).
import { describe, it, expect, vi } from 'vitest'
import { createApp, h } from 'vue'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { gzipSync } from 'node:zlib'
import * as main from './index.js'
import * as entry from './combobox.js'
import { shared } from './shared.js'
import GInput from './components/GInput/GInput.vue'
import GAvatar from './components/GAvatar/GAvatar.vue'
import GDialog from './components/GDialog/GDialog.vue'
import GIcon from './components/GIcon/GIcon.vue'

const SRC = resolve(process.cwd(), 'src')
vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('@grana/vue/combobox · entrada propia (#337)', () => {
  it('exporta GCombobox, install y el plugin por defecto; nada interno', () => {
    expect(Object.keys(entry).sort()).toEqual(['GCombobox', 'default', 'install'])
    expect(entry.GCombobox.name).toBe('GCombobox')
    expect(entry.default.install).toBe(entry.install)
  })

  it('@grana/vue no lo exporta ni lo registra en su install', () => {
    expect(main.GCombobox).toBeUndefined()
    const app = createApp({ render: () => h('i') })
    app.use(main.default)
    expect(app.component('GCombobox')).toBeUndefined()
  })

  it('app.use(Combobox) registra <g-combobox> (sin pisar uno ya registrado)', () => {
    const app = createApp({ render: () => h('i') })
    app.use(entry.default)
    expect(app.component('GCombobox')).toBe(entry.GCombobox)
    const app2 = createApp({ render: () => h('i') })
    const Mine = { render: () => null }
    app2.component('GCombobox', Mine)
    app2.use(entry.default)
    expect(app2.component('GCombobox')).toBe(Mine)
  })

  it('package.json, build y configuración: exports ./combobox, global GranaCombobox, Vue y @grana/vue externos', () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'))
    expect(pkg.exports['./combobox']).toEqual({ import: './dist/combobox.js' })
    expect(pkg.scripts.build).toContain('vite build -c vite.combobox.config.js')
    const cfg = readFileSync(resolve(process.cwd(), 'vite.combobox.config.js'), 'utf8')
    expect(cfg).toContain("external: ['vue', '@grana/vue']")
    expect(cfg).toContain("name: 'GranaCombobox'")
    expect(cfg).toContain("'@grana/vue': 'Grana'")
    expect(cfg).toContain('this.error(')
  })

  it('el CSS sigue en grana.css: components.css importa GCombobox.css después de GInput, GAvatar y GDialog', () => {
    const css = readFileSync(resolve(SRC, 'styles/components.css'), 'utf8')
    const at = (name) => css.indexOf(`components/${name}/${name}.css`)
    expect(at('GCombobox')).toBeGreaterThan(-1)
    for (const dep of ['GInput', 'GAvatar', 'GDialog']) expect(at('GCombobox'), dep).toBeGreaterThan(at(dep))
  })

  it('meta.json: status, entrada y peso gzip anotado', () => {
    const meta = JSON.parse(readFileSync(resolve(SRC, 'components/GCombobox/GCombobox.meta.json'), 'utf8'))
    expect(meta.name).toBe('GCombobox')
    expect(meta.entry).toBe('@grana/vue/combobox')
    expect(meta.bundle.gzip).toBeGreaterThan(0)
  })

  it('dist (si está construido): las tres compuertas y el peso anotado no se desfasa más de 1 KB (gzip, bytes)', () => {
    const dist = resolve(process.cwd(), 'dist')
    if (!existsSync(resolve(dist, 'combobox.js'))) return
    const js = readFileSync(resolve(dist, 'combobox.js'))
    expect(readFileSync(resolve(dist, 'grana.css'), 'utf8')).toContain('g-combobox__ghost')
    expect(readFileSync(resolve(dist, 'grana.js'), 'utf8')).not.toContain('GCombobox')
    expect(js.toString()).toContain('__shared')
    const meta = JSON.parse(readFileSync(resolve(SRC, 'components/GCombobox/GCombobox.meta.json'), 'utf8'))
    expect(Math.abs(gzipSync(js).length - meta.bundle.gzip)).toBeLessThan(1024)
  })
})

describe('@grana/vue/combobox · lo compartido llega del paquete principal (src/shared.js), sin duplicados', () => {
  const own = (key) => key === 'combobox.js' || /^components\/GCombobox\//.test(key)
  const keyOf = (file) => relative(SRC, file).split(sep).join('/')
  const files = ['combobox.js', ...readdirSync(resolve(SRC, 'components/GCombobox')).filter((f) => /\.(vue|js)$/.test(f) && !/\.test\.js$/.test(f)).map((f) => `components/GCombobox/${f}`)]
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

  it('GInput, GAvatar, GDialog y GIcon son los mismos del paquete principal', () => {
    expect(shared['components/GInput/GInput.vue'].default).toBe(GInput)
    expect(shared['components/GAvatar/GAvatar.vue'].default).toBe(GAvatar)
    expect(shared['components/GDialog/GDialog.vue'].default).toBe(GDialog)
    expect(shared['components/GIcon/GIcon.vue'].default).toBe(GIcon)
    expect(main.GInput).toBe(GInput)
  })
})
