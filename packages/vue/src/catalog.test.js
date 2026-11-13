// Catálogo para agentes (dueño: bruno). design/contracts/catalog.md C5, DECISIONS.md #1080. Sobre generateCatalog() en
// memoria: sin desfase con el meta.json ni con los tipos, `registered` real con createApp, lista blanca, secciones,
// determinismo y topes de tamaño.
import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import { createApp } from 'vue'
import { ENTRIES, generateTypes, metaProps, readMetas } from '../scripts/build-types.mjs'
import { LIMITS, exposedNames, generateCatalog, readTokens } from '../scripts/build-catalog.mjs'
import * as overrides from '../types/overrides.mjs'

const ROOT = resolve(process.cwd())
const modules = import.meta.glob(['./*.js', '!./*.test.js'])
const metas = readMetas(ROOT)

let gen, catalog, types
beforeAll(async () => {
  gen = await generateCatalog({ root: ROOT })
  catalog = gen.catalog
  types = await generateTypes({ root: ROOT })
}, 60000)

const byName = () => new Map(catalog.components.map((c) => [c.name, c]))
const entryPath = (name) => (name === 'grana' ? '@grana/vue' : `@grana/vue/${name}`)
const block = (text, head) => {
  const i = text.indexOf(head)
  if (i < 0) return ''
  return text.slice(i, text.indexOf('\n}\n', i) + 3)
}

describe('raíz', () => {
  it('schemaVersion 1, paquete y secciones', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
    expect(catalog.schemaVersion).toBe(1)
    expect(catalog.package).toEqual({ name: '@grana/vue', version: pkg.version })
    expect(Object.keys(catalog)).toEqual(['schemaVersion', 'package', 'entries', 'components', 'tokens', 'icons', 'utilities'])
  })
  it('determinista: dos generaciones dan los mismos bytes', async () => {
    const again = await generateCatalog({ root: ROOT })
    expect(again.json).toBe(gen.json)
    expect(again.llms).toBe(gen.llms)
    expect(gen.json.endsWith('}\n')).toBe(true)
    expect(gen.json).toBe(`${JSON.stringify(catalog, null, 2)}\n`)
  })
  it('bajo sus topes (catalog.json ≤ 512 KiB, llms.txt ≤ 32 KiB)', () => {
    expect(Buffer.byteLength(gen.json)).toBeLessThanOrEqual(LIMITS.catalog)
    expect(Buffer.byteLength(gen.llms)).toBeLessThanOrEqual(LIMITS.llms)
    expect(LIMITS).toEqual({ catalog: 512 * 1024, llms: 32 * 1024 })
    expect(gzipSync(gen.json).length).toBeGreaterThan(0)
  })
  it('package.json exporta catalog.json y llms.txt sin types y el build los genera al final', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
    expect(pkg.exports['./catalog.json']).toBe('./dist/catalog.json')
    expect(pkg.exports['./llms.txt']).toBe('./dist/llms.txt')
    expect(pkg.typesVersions['*']['catalog.json']).toBeUndefined()
    expect(pkg.scripts.build).toMatch(/node scripts\/build-catalog\.mjs$/)
    expect(pkg.files).toContain('dist')
  })
})

describe('entradas', () => {
  it('en el orden de ENTRIES, con su ruta de exports, sus piezas y su API', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
    const listed = catalog.entries.map((e) => e.path)
    expect(listed).toEqual(ENTRIES.map((e) => entryPath(e.name)).filter((p) => listed.includes(p)))
    for (const e of ENTRIES) {
      const c = catalog.entries.find((x) => x.path === entryPath(e.name))
      const t = types.entries[e.name]
      if (!c) { expect(t.components.length + t.api.length, e.name).toBe(0); continue }
      expect(c.components).toEqual([...t.components].sort())
      expect(c.functions).toEqual(t.api.filter((n) => n !== 'default' && !n.startsWith('__')))
      expect(c.functions.some((n) => n.startsWith('__'))).toBe(false)
      expect(`./${c.types}`).toBe(pkg.exports[e.name === 'grana' ? '.' : `./${e.name}`].types)
      expect(['default', 'manager', null]).toContain(c.install)
      expect('manager' in c).toBe(c.install === 'manager')
    }
  })
  it('las de gestor nombran su fábrica', () => {
    const m = Object.fromEntries(catalog.entries.filter((e) => e.install === 'manager').map((e) => [e.path, e.manager]))
    expect(m).toEqual({ '@grana/vue/speech': 'createSpeech', '@grana/vue/status': 'createStatus' })
    expect(catalog.entries.find((e) => e.path === '@grana/vue/testing').install).toBe(null)
  })
})

describe('sin desfase con el meta.json', () => {
  it('cada pieza de readMetas() sale una sola vez, ordenadas por nombre', () => {
    const names = catalog.components.map((c) => c.name)
    expect(new Set(names).size).toBe(names.length)
    expect([...names].sort()).toEqual([...metas.keys()].sort())
    expect(names).toEqual([...names].sort())
  })
  it('cada pieza que exporta una entrada sale con esa entry', () => {
    const map = byName()
    for (const e of ENTRIES) for (const n of types.entries[e.name].components) expect(map.get(n).entry, n).toBe(entryPath(e.name))
  })
  it('props, eventos y slots con sus nombres y su número', () => {
    const map = byName()
    for (const meta of metas.values()) {
      const c = map.get(meta.name)
      expect(c.props.map((p) => p.name), meta.name).toEqual(metaProps(meta).map((p) => p.name))
      expect(c.events.map((e) => e.name), meta.name).toEqual((meta.events || []).map((e) => e.name))
      expect(c.slots.map((s) => s.name), meta.name).toEqual((meta.slots || []).map((s) => s.name))
      for (const [i, p] of metaProps(meta).entries()) {
        expect(c.props[i].type).toBe(p.type)
        expect(c.props[i].default).toEqual(p.default === undefined ? null : p.default)
        if (p.values !== undefined) expect(c.props[i].values).toEqual(p.values)
        expect(!!c.props[i].required).toBe(!!p.required)
      }
    }
  })
  it('models: un v-model por cada prop con update:prop', () => {
    for (const c of catalog.components) {
      const want = c.props.filter((p) => c.events.some((e) => e.name === `update:${p.name}`))
        .map((p) => ({ prop: p.name, directive: p.name === 'modelValue' ? 'v-model' : `v-model:${p.name}` }))
      expect(c.models || [], c.name).toEqual(want)
    }
    expect(byName().get('GInput').models).toEqual([{ prop: 'modelValue', directive: 'v-model' }])
  })
})

describe('sin desfase con los tipos', () => {
  it('el ts de cada prop y el payload de cada evento son los del .d.ts de su entrada', () => {
    const entryFile = new Map(catalog.entries.map((e) => [e.path, types.files[e.types.replace(/^dist\//, '')]]))
    let checked = 0
    for (const c of catalog.components) {
      const dts = entryFile.get(c.entry)
      const props = block(dts, `export interface ${c.name}Props {`)
      const emits = block(dts, `export type ${c.name}Emits = {`)
      for (const p of c.props) {
        const key = /^[A-Za-z_$][\w$]*$/.test(p.name) ? p.name : `'${p.name}'`
        expect(props, `${c.name}.${p.name}`).toContain(`\n  ${key}${p.required ? '' : '?'}: ${p.ts}\n`)
        checked++
      }
      for (const e of c.events) {
        const key = /^[A-Za-z_$][\w$]*$/.test(e.name) ? e.name : `'${e.name}'`
        expect(emits, `${c.name}.${e.name}`).toContain(`\n  ${key}: ${e.ts === 'void' ? '() => void' : `(payload: ${e.ts}) => void`}\n`)
      }
    }
    expect(checked).toBeGreaterThan(1000)
  })
})

describe('registered es real (createApp)', () => {
  for (const e of ENTRIES) {
    it(entryPath(e.name), async () => {
      const entry = catalog.entries.find((x) => x.path === entryPath(e.name))
      const mod = await modules[`./${e.src.replace(/^src\//, '')}`]()
      const app = createApp({})
      if (!entry || entry.install === null) {
        expect(mod.default?.install).toBeUndefined()
        return
      }
      app.use(entry.install === 'manager' ? mod[entry.manager]() : mod.default)
      const got = Object.keys(app._context.components).sort()
      const want = []
      for (const name of entry.components) {
        const c = catalog.components.find((x) => x.name === name)
        if (c.registered) want.push(name, ...(c.aliases || []))
      }
      expect(got).toEqual(want.sort())
    })
  }
})

describe('métodos, labels y lista blanca', () => {
  it('lo expuesto por ref está completo en methods (salvo gestores)', () => {
    const map = byName()
    for (const [name, text] of Object.entries(overrides.exposed)) {
      const methods = (map.get(name).methods || []).map((m) => m.name)
      for (const n of exposedNames(text)) expect(methods, `${name}.${n}`).toContain(n)
    }
    for (const name of overrides.managerMethods) expect(map.get(name).methods).toBeUndefined()
    expect(exposedNames('{ add(files: FileList | File[]): R; readonly size: string; open(): void }')).toEqual(['add', 'size', 'open'])
  })
  it('labels son claves (sin textos ni parámetros)', () => {
    const map = byName()
    expect(map.get('GTag').labels).toEqual(['remove'])
    expect(map.get('GFileField').labels).toContain('reasons.duplicate')
    expect(map.get('GStatusIsland').labels).toContain('types.warning')
    for (const c of catalog.components) for (const k of c.labels || []) expect(k, c.name).toMatch(/^[A-Za-z_$][\w$]*(\.([A-Za-z_$][\w$]*|\d+|\*|<[A-Za-z]+>))*$/)
  })
  it('ninguna pieza lleva claves fuera de C1.2 ni rutas del repositorio', () => {
    const KEYS = ['name', 'tag', 'aliases', 'status', 'since', 'deprecated', 'description', 'entry', 'registered', 'props', 'models', 'events', 'slots', 'methods', 'labels', 'cssProperties']
    const SUB = {
      props: ['name', 'type', 'ts', 'values', 'default', 'resolvedDefault', 'required', 'since', 'deprecated', 'description'],
      events: ['name', 'payload', 'ts', 'description'],
      slots: ['name', 'props', 'description'],
      methods: ['name', 'signature', 'description'],
      models: ['prop', 'directive'],
      cssProperties: ['name', 'description']
    }
    for (const c of catalog.components) {
      for (const k of Object.keys(c)) expect(KEYS, `${c.name}.${k}`).toContain(k)
      for (const k of ['props', 'events', 'slots']) expect(Array.isArray(c[k])).toBe(true)
      for (const [k, allowed] of Object.entries(SUB)) for (const item of c[k] || []) for (const f of Object.keys(item)) expect(allowed, `${c.name}.${k}.${f}`).toContain(f)
      for (const [k, v] of Object.entries(c)) if (!['props', 'events', 'slots'].includes(k)) expect(v === null || (Array.isArray(v) && !v.length), `${c.name}.${k}`).toBe(false)
      expect(['stable', 'candidate', 'draft']).toContain(c.status)
      expect(typeof c.registered).toBe('boolean')
    }
    expect(gen.json).not.toMatch(/\b(design|packages)\//)
    expect(gen.json).not.toContain('"prototype"')
    expect(gen.json).not.toContain('"contract":')
    expect(gen.json).not.toContain('"pending":')
  })
  it('alias: GDatePicker lleva GDatepicker', () => {
    expect(byName().get('GDatePicker').aliases).toEqual(['GDatepicker'])
  })
})

describe('secciones', () => {
  it('tokens = --g-* declarados en defaults.css', () => {
    const css = readFileSync(join(ROOT, 'src/styles/defaults.css'), 'utf8')
    expect(catalog.tokens).toEqual(readTokens(css))
    expect(catalog.tokens).toContain('--g-color-brand')
    expect(catalog.tokens.every((t) => t.startsWith('--g-'))).toBe(true)
    expect(new Set(catalog.tokens).size).toBe(catalog.tokens.length)
  })
  it('icons.library = icons.json library, con sus alias; sin playground ni lab', () => {
    const icons = JSON.parse(readFileSync(join(ROOT, 'scripts/icons.json'), 'utf8'))
    expect(catalog.icons).toEqual({ library: icons.library, aliases: icons.aliases })
  })
  it('utilities = clases de utilities.json en su orden', () => {
    const u = JSON.parse(readFileSync(join(ROOT, '../../design/contracts/utilities.json'), 'utf8'))
    expect(catalog.utilities).toEqual(u.classes.map((c) => ({ class: c.class, group: c.group })))
  })
})

describe('llms.txt', () => {
  it('nombra la versión, cada entrada y cada pieza', () => {
    expect(gen.llms).toContain(catalog.package.version)
    for (const e of catalog.entries) expect(gen.llms).toContain(`\`${e.path}\``)
    for (const c of catalog.components) expect(gen.llms).toContain(`- ${c.name} \`<${c.tag}>\``)
    expect(gen.llms).toContain('npx grana catalog')
    expect(gen.llms).toContain('node_modules/@grana/vue/dist/catalog.json')
    expect(gen.llms).toMatch(/· draft ·/)
  })
})
