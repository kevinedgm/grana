// Tipos de TypeScript (dueño: bruno). scripts/build-types.mjs genera un .d.ts por entrada desde los *.meta.json y
// packages/vue/types/. Esta prueba comprueba, sin depender de dist/:
//   1. que los meta.json describen el componente real (props, eventos, valores y obligatoriedad contra el runtime);
//   2. que los tipos generados coinciden con los meta.json (cada prop con su opcionalidad y sus valores; cada evento y slot);
//   3. que cada entrada declara exactamente lo que exporta en runtime (ni de más ni de menos);
//   4. que un uso correcto compila y que cada uso erróneo falla (vue-tsc sobre types/test/main.ts y App.vue, con
//      `@ts-expect-error` y `@vue-expect-error`: si los tipos dejaran de detectar un error, la directiva sobraría y falla).
import { describe, it, expect, beforeAll } from 'vitest'
import { execFileSync } from 'node:child_process'
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'
import ts from 'typescript'
import * as mainEntry from './index.js'
import * as speechEntry from './speech.js'
import * as statusEntry from './status.js'
import * as comboboxEntry from './combobox.js'
import * as fileFieldEntry from './file-field.js'
import * as timeFieldEntry from './time-field.js'
import * as sliderEntry from './slider.js'
import * as testingEntry from './testing.js'
import * as tagEntry from './tag.js'
import * as loadRegionEntry from './load-region.js'
import { ENTRIES, buildTypes, metaProps, readMetas } from '../scripts/build-types.mjs'

const ROOT = resolve(process.cwd())
const OUT = join(ROOT, 'node_modules/.cache/grana-types-test')
const RUNTIME = { grana: mainEntry, speech: speechEntry, status: statusEntry, combobox: comboboxEntry, 'file-field': fileFieldEntry, 'time-field': timeFieldEntry, slider: sliderEntry, testing: testingEntry, tag: tagEntry, 'load-region': loadRegionEntry }
const metas = readMetas(ROOT)
const isComponent = (c) => Boolean(c && typeof c === 'object' && ('setup' in c || 'render' in c || 'props' in c))

let entries
let program
let checker
beforeAll(async () => {
  rmSync(OUT, { recursive: true, force: true })
  ;({ entries } = await buildTypes({ root: ROOT, outDir: OUT }))
  program = ts.createProgram(ENTRIES.map((e) => join(OUT, `${e.name}.d.ts`)), {
    strict: true, noEmit: true, moduleResolution: ts.ModuleResolutionKind.Bundler, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, types: []
  })
  checker = program.getTypeChecker()
}, 60000)

const moduleSymbol = (entry) => checker.getSymbolAtLocation(program.getSourceFile(join(OUT, `${entry}.d.ts`)))
const exportNamed = (entry, name) => checker.getExportsOfModule(moduleSymbol(entry)).find((s) => s.name === name)
const declaredType = (entry, name) => {
  const sym = exportNamed(entry, name)
  return sym ? checker.getDeclaredTypeOfSymbol(sym.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(sym) : sym) : null
}
const entryOf = (component) => Object.entries(entries).find(([, e]) => e.components.includes(component))?.[0]

describe('meta.json frente al componente real', () => {
  it('cada componente exportado tiene meta.json con sus props y eventos de runtime; los valores pasan el validador', () => {
    for (const [entry, mod] of Object.entries(RUNTIME)) {
      for (const [name, comp] of Object.entries(mod)) {
        if (!isComponent(comp) || name === 'default') continue
        const meta = metas.get(name)
        expect(meta, `${entry}: ${name} sin meta.json`).toBeTruthy()
        const runtimeProps = Object.keys(comp.props || {}).sort()
        expect(metaProps(meta).map((p) => p.name).sort(), `${name}: props`).toEqual(runtimeProps)
        const runtimeEmits = (Array.isArray(comp.emits) ? comp.emits : Object.keys(comp.emits || {})).sort()
        expect(meta.events.map((e) => e.name).sort(), `${name}: eventos`).toEqual(runtimeEmits)
        for (const p of metaProps(meta)) {
          const r = comp.props[p.name]
          if (r && r.required) expect(p.required, `${name}.${p.name}: obligatoria en runtime`).toBe(true)
          // Un validador de texto que rechaza lo desconocido es una lista cerrada: el meta.json debe darla (y el tipo, su unión)
          if (r && typeof r.validator === 'function' && r.type === String && r.validator('__no_es_un_valor__') === false) {
            expect(Array.isArray(p.values), `${name}.${p.name}: el validador cierra la lista; falta values en el meta.json`).toBe(true)
          }
          if (!Array.isArray(p.values) || !r || typeof r.validator !== 'function') continue
          for (const v of p.values) {
            if (typeof v === 'string' && /…/.test(v)) continue
            expect(r.validator(v), `${name}.${p.name} acepta ${v}`).toBe(true)
          }
          expect(r.validator('__no_es_un_valor__'), `${name}.${p.name} rechaza lo desconocido`).toBe(false)
        }
      }
    }
  })
})

describe('tipos generados frente a los meta.json', () => {
  it('cada prop existe con su opcionalidad; las que tienen lista de valores aceptan cada valor y rechazan otro', () => {
    let checked = 0
    for (const [entry, e] of Object.entries(entries)) {
      for (const name of e.components) {
        const meta = metas.get(name)
        const props = declaredType(entry, `${name}Props`)
        expect(props, `${entry}: ${name}Props`).toBeTruthy()
        const declared = checker.getPropertiesOfType(props).map((s) => s.name).sort()
        expect(declared, `${name}Props`).toEqual(metaProps(meta).map((p) => p.name).sort())
        for (const p of metaProps(meta)) {
          const sym = props.getProperty(p.name)
          expect(Boolean(sym.flags & ts.SymbolFlags.Optional), `${name}.${p.name} opcional`).toBe(!p.required)
          const t = checker.getNonNullableType(checker.getTypeOfSymbol(sym))
          if (Array.isArray(p.values) && p.values.every((v) => typeof v === 'string' && !/…/.test(v)) && /^String( \| null)?$/.test(p.type)) {
            const literals = (t.isUnion() ? t.types : [t]).map((x) => x.value)
            expect(literals.sort(), `${name}.${p.name} valores`).toEqual([...p.values].sort())
            checked++
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(100)
  })

  it('cada evento, slot y método del meta.json está en los tipos', () => {
    for (const [entry, e] of Object.entries(entries)) {
      for (const name of e.components) {
        const meta = metas.get(name)
        const emits = declaredType(entry, `${name}Emits`)
        expect(checker.getPropertiesOfType(emits).map((s) => s.name).sort(), `${name}Emits`).toEqual(meta.events.map((ev) => ev.name).sort())
        const slots = declaredType(entry, `${name}Slots`)
        for (const s of meta.slots || []) {
          if (/[{<]/.test(s.name)) continue
          expect(slots.getProperty(s.name), `${name} slot ${s.name}`).toBeTruthy()
        }
        if (Array.isArray(meta.methods) && !['GSpeechHost', 'GStatusIsland', 'GToaster'].includes(name)) {
          const exposed = declaredType(entry, `${name}Exposed`)
          for (const m of meta.methods) expect(exposed.getProperty(typeof m === 'string' ? m : m.name), `${name}.${m.name}`).toBeTruthy()
        }
      }
    }
  })
})

describe('cada entrada declara lo que exporta', () => {
  it.each(ENTRIES.map((e) => e.name))('%s: los nombres de valor del .d.ts son los de runtime', (entry) => {
    const values = checker.getExportsOfModule(moduleSymbol(entry))
      .filter((s) => {
        const target = s.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(s) : s
        return Boolean(target.flags & ts.SymbolFlags.Value)
      })
      .map((s) => s.name)
      .sort()
    expect(values).toEqual(Object.keys(RUNTIME[entry]).sort())
  })

  it('GlobalComponents tipa las etiquetas que registra cada install', () => {
    const app = { component: (n, c) => (c ? (registered[n] = c) : registered[n]), provide() {} }
    const registered = {}
    mainEntry.install(app)
    const text = program.getSourceFile(join(OUT, 'grana.d.ts')).text
    for (const n of Object.keys(registered)) expect(text, n).toMatch(new RegExp(`\\n    ${n}: typeof G`))
  })
})

describe('package.json', () => {
  it('cada entrada publica su .d.ts (types primero), su ESM y el CSS; el build genera los tipos', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
    for (const { name } of ENTRIES) {
      const key = name === 'grana' ? '.' : `./${name}`
      expect(Object.keys(pkg.exports[key])[0], key).toBe('types')
      expect(pkg.exports[key], key).toEqual({ types: `./dist/${name}.d.ts`, import: `./dist/${name}.js`, default: `./dist/${name}.js` })
      if (name !== 'grana') expect(pkg.typesVersions['*'][name], name).toEqual([`./dist/${name}.d.ts`])
    }
    expect(pkg.types).toBe('./dist/grana.d.ts')
    expect(pkg.exports['./style.css']).toBe('./dist/grana.css')
    expect(pkg.exports['./fonts.css']).toBe('./dist/fonts.css')
    expect(pkg.scripts.build).toMatch(/node scripts\/build-types\.mjs$/)
    expect(pkg.peerDependencies.vue).toBeTruthy()
  })
})

describe('uso con vue-tsc', () => {
  it('main.ts y App.vue compilan; cada uso erróneo marcado falla', () => {
    const fixtures = join(ROOT, 'types/test')
    writeFileSync(join(OUT, 'tsconfig.json'), JSON.stringify({
      compilerOptions: {
        target: 'ES2022', module: 'ESNext', moduleResolution: 'Bundler', strict: true, noEmit: true, lib: ['ES2022', 'DOM', 'DOM.Iterable'], types: [],
        baseUrl: '.', paths: { '@grana/vue': ['./grana.d.ts'], '@grana/vue/*': ['./*.d.ts'] }
      },
      include: [join(fixtures, 'main.ts'), join(fixtures, 'App.vue')]
    }))
    const bin = createRequire(import.meta.url).resolve('vue-tsc/bin/vue-tsc.js')
    let output = ''
    try {
      execFileSync(process.execPath, [bin, '-p', join(OUT, 'tsconfig.json')], { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' })
    } catch (err) {
      output = `${err.stdout || ''}${err.stderr || ''}` || String(err)
    }
    expect(output).toBe('')
  }, 120000)
})

