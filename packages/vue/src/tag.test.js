// Entrada `@grana/vue/tag` (tag.md §«Paquete», DECISIONS.md #472): GTag y GTagGroup van aparte del paquete principal y toman
// lo compartido de `__shared` (src/shared.js), como el combobox (#337).
import { describe, it, expect, vi } from 'vitest'
import { createApp, h } from 'vue'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { gzipSync } from 'node:zlib'
import * as main from './index.js'
import * as entry from './tag.js'
import { shared } from './shared.js'
import GBtn from './components/GBtn/GBtn.vue'
import GAvatar from './components/GAvatar/GAvatar.vue'
import { useVisualTips } from './utils/visualTip.js'
import { categoryOf } from './utils/categoryHash.js'

const SRC = resolve(process.cwd(), 'src')
vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('@grana/vue/tag · entrada propia (#472)', () => {
  it('exporta GTag, GTagGroup, install y el plugin por defecto; nada interno', () => {
    expect(Object.keys(entry).sort()).toEqual(['GTag', 'GTagGroup', 'default', 'install'])
    expect(entry.GTag.name).toBe('GTag')
    expect(entry.GTagGroup.name).toBe('GTagGroup')
    expect(entry.default.install).toBe(entry.install)
  })

  it('@grana/vue no los exporta ni los registra en su install', () => {
    expect(main.GTag).toBeUndefined()
    expect(main.GTagGroup).toBeUndefined()
    const app = createApp({ render: () => h('i') })
    app.use(main.default)
    expect(app.component('GTag')).toBeUndefined()
    expect(app.component('GTagGroup')).toBeUndefined()
  })

  it('app.use(Tag) registra <g-tag> y <g-tag-group> (sin pisar uno ya registrado)', () => {
    const app = createApp({ render: () => h('i') })
    app.use(entry.default)
    expect(app.component('GTag')).toBe(entry.GTag)
    expect(app.component('GTagGroup')).toBe(entry.GTagGroup)
    const app2 = createApp({ render: () => h('i') })
    const Mine = { render: () => null }
    app2.component('GTag', Mine)
    app2.use(entry.default)
    expect(app2.component('GTag')).toBe(Mine)
    expect(app2.component('GTagGroup')).toBe(entry.GTagGroup)
  })

  it('package.json, build y configuración: exports ./tag, global GranaTag, Vue y @grana/vue externos', () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'))
    expect(pkg.exports['./tag']).toEqual({ types: './dist/tag.d.ts', import: './dist/tag.js', default: './dist/tag.js' })
    expect(pkg.typesVersions['*'].tag).toEqual(['./dist/tag.d.ts'])
    expect(pkg.scripts.build).toContain('vite build -c vite.tag.config.js')
    const cfg = readFileSync(resolve(process.cwd(), 'vite.tag.config.js'), 'utf8')
    expect(cfg).toContain("external: ['vue', '@grana/vue']")
    expect(cfg).toContain("name: 'GranaTag'")
    expect(cfg).toContain("'@grana/vue': 'Grana'")
    expect(cfg).toContain('this.error(')
  })

  it('el CSS sigue en grana.css: GTag.css antes que GTagGroup.css, ambos después de GAvatar, GBtn y GIcon', () => {
    const css = readFileSync(resolve(SRC, 'styles/components.css'), 'utf8')
    const at = (name) => css.indexOf(`components/${name}/${name}.css`)
    expect(at('GTag')).toBeGreaterThan(-1)
    expect(at('GTagGroup')).toBeGreaterThan(at('GTag'))
    for (const dep of ['GAvatar', 'GBtn', 'GIcon']) expect(at('GTag'), dep).toBeGreaterThan(at(dep))
  })

  it('meta.json: entrada y peso gzip anotado', () => {
    for (const n of ['GTag', 'GTagGroup']) {
      const meta = JSON.parse(readFileSync(resolve(SRC, `components/${n}/${n}.meta.json`), 'utf8'))
      expect(meta.entry).toBe('@grana/vue/tag')
    }
    const meta = JSON.parse(readFileSync(resolve(SRC, 'components/GTagGroup/GTagGroup.meta.json'), 'utf8'))
    expect(meta.bundle.gzip).toBeGreaterThan(0)
  })

  it('dist (si está construido): compuertas y el peso anotado no se desfasa más de 1 KB (gzip, bytes)', () => {
    const dist = resolve(process.cwd(), 'dist')
    if (!existsSync(resolve(dist, 'tag.js'))) return
    const js = readFileSync(resolve(dist, 'tag.js'))
    expect(readFileSync(resolve(dist, 'grana.css'), 'utf8')).toContain('g-tag__undo')
    expect(readFileSync(resolve(dist, 'grana.js'), 'utf8')).not.toContain('GTagGroup')
    expect(js.toString()).toContain('__shared')
    // Sin copia del motor del tooltip ni del hash
    expect(js.toString()).not.toContain('0x811c9dc5')
    expect(js.toString()).not.toMatch(/2166136261|showPopover/)
    const meta = JSON.parse(readFileSync(resolve(SRC, 'components/GTagGroup/GTagGroup.meta.json'), 'utf8'))
    expect(Math.abs(gzipSync(js).length - meta.bundle.gzip)).toBeLessThan(1024)
  })
})

describe('@grana/vue/tag · lo compartido llega del paquete principal (src/shared.js), sin duplicados', () => {
  const own = (key) => key === 'tag.js' || /^components\/(GTag|GTagGroup)\//.test(key)
  const keyOf = (file) => relative(SRC, file).split(sep).join('/')
  const files = ['tag.js', ...['GTag', 'GTagGroup'].flatMap((d) => readdirSync(resolve(SRC, `components/${d}`)).filter((f) => /\.(vue|js)$/.test(f) && !/\.test\.js$/.test(f)).map((f) => `components/${d}/${f}`))]
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

  it('GBtn, GAvatar, visualTip y categoryHash son los mismos del paquete principal', () => {
    expect(shared['components/GBtn/GBtn.vue'].default).toBe(GBtn)
    expect(shared['components/GAvatar/GAvatar.vue'].default).toBe(GAvatar)
    expect(shared['utils/visualTip.js'].useVisualTips).toBe(useVisualTips)
    expect(shared['utils/categoryHash.js'].categoryOf).toBe(categoryOf)
  })
})
