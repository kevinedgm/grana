// Tipos de TypeScript de @grana/vue (dueño: bruno). Se ejecuta en `npm run build` después de Vite.
//
// Fuente:
//   - los *.meta.json de cada componente (props con tipo, valores, por defecto y obligatoriedad; eventos con su payload;
//     slots con su alcance; `parts` de GInputGroup y `related` de GTabs para los subcomponentes sin meta propio);
//   - types/shared.d.ts (escrito a mano): la forma de los objetos y de los gestores;
//   - types/overrides.mjs: lo que el meta.json no puede expresar (tipos de objetos, payloads en prosa, lo expuesto);
//   - types/api/<entrada>.d.ts: funciones, claves y plugin de cada entrada.
//
// Salida (una por entrada de package.json `exports`): dist/grana.d.ts, dist/speech.d.ts, dist/status.d.ts,
// dist/combobox.d.ts, dist/file-field.d.ts, dist/time-field.d.ts, dist/slider.d.ts y dist/testing.d.ts, más dist/types/ (copias de shared y
// de api). Cada componente es un `DefineComponent` tipado (GranaComponent) y cada entrada amplía `GlobalComponents` de Vue
// con los que registra su `install`, para que <g-btn> se tipe en las plantillas.
//
// El generador es estricto: si una entrada exporta algo que no es un componente con meta.json ni está declarado en su
// fragmento de types/api, o si un tipo del meta.json no se sabe leer y no hay override, se detiene con el motivo.
import { mkdirSync, readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

export const ENTRIES = [
  { name: 'grana', src: 'src/index.js' },
  { name: 'speech', src: 'src/speech.js' },
  { name: 'status', src: 'src/status.js' },
  { name: 'combobox', src: 'src/combobox.js' },
  { name: 'file-field', src: 'src/file-field.js' },
  { name: 'time-field', src: 'src/time-field.js' },
  { name: 'slider', src: 'src/slider.js' },
  { name: 'testing', src: 'src/testing.js' }
]

// ---------------------------------------------------------------------------------------------------------------------
// Lectura
// ---------------------------------------------------------------------------------------------------------------------

/** Todos los componentes descritos: los meta.json, sus `parts` (GInputGroup) y sus `related` con props (GTabPanel). */
export function readMetas(root = ROOT) {
  const dir = join(root, 'src/components')
  const metas = new Map()
  for (const d of readdirSync(dir, { withFileTypes: true })) {
    if (!d.isDirectory()) continue
    for (const f of readdirSync(join(dir, d.name))) {
      if (!f.endsWith('.meta.json')) continue
      const m = JSON.parse(readFileSync(join(dir, d.name, f), 'utf8'))
      metas.set(m.name, { ...m, file: `src/components/${d.name}/${f}` })
      for (const [name, part] of Object.entries(m.parts || {})) {
        metas.set(name, { name, description: `Parte de ${m.name}.`, props: [], events: [], slots: [], ...part, file: `src/components/${d.name}/${f}` })
      }
      for (const rel of Array.isArray(m.related) ? m.related : []) {
        if (!rel.props || !rel.name) continue
        metas.set(rel.name, { description: rel.purpose, events: [], slots: [{ name: 'default', purpose: 'Contenido' }], ...rel, file: `src/components/${d.name}/${f}` })
      }
    }
  }
  return metas
}

/** Nombres que exporta un módulo fuente (export { a, b as c }, export function, export const, export default). */
export function sourceExports(code) {
  const names = new Set()
  const noComments = code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
  for (const m of noComments.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const part of m[1].split(',')) {
      const p = part.trim()
      if (!p) continue
      const as = p.split(/\s+as\s+/)
      names.add((as[1] || as[0]).trim())
    }
  }
  for (const m of noComments.matchAll(/export\s+(?:async\s+)?(?:function\*?|const|let|class)\s+([A-Za-z_$][\w$]*)/g)) names.add(m[1])
  if (/export\s+default\b/.test(noComments)) names.add('default')
  return names
}

/** Nombres de valor que declara un fragmento de types/api. */
export function declaredExports(code) {
  const names = new Set()
  for (const m of code.matchAll(/export\s+declare\s+(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)/g)) names.add(m[1])
  if (/export\s+default\b/.test(code)) names.add('default')
  return names
}

// ---------------------------------------------------------------------------------------------------------------------
// Tipos desde el meta.json
// ---------------------------------------------------------------------------------------------------------------------

const PRIM = {
  String: 'string',
  Number: 'number',
  Boolean: 'boolean',
  Array: 'unknown[]',
  Object: 'object',
  Function: '(...args: any[]) => any',
  Date: 'Date',
  Element: 'Element',
  null: 'null',
  false: 'false',
  true: 'true'
}
const GLOBALS = new Set(['MouseEvent', 'KeyboardEvent', 'PointerEvent', 'FocusEvent', 'Event', 'SubmitEvent', 'FormData', 'File', 'FileList', 'Date', 'Element', 'HTMLElement'])
const lit = (v) => (typeof v === 'string' ? `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'` : String(v))
const union = (list) => [...new Set(list)].join(' | ')

/** Tipo de un texto como «String | Number | null»; null si no se sabe leer. */
export function parseType(text) {
  const t = String(text ?? '').trim()
  if (!t) return null
  const out = []
  for (const raw of t.split('|')) {
    const p = raw.trim()
    if (p in PRIM) out.push(PRIM[p])
    else if (GLOBALS.has(p)) out.push(p)
    else if (/^'[^']*'$/.test(p)) out.push(p)
    else return null
  }
  return union(out)
}

/** Literales de `values` (con rangos «1 … 12»); null si alguno es prosa. */
function valueLiterals(values, typeText) {
  if (!Array.isArray(values) || !values.length) return null
  const withString = /\bString\b/.test(typeText)
  const out = []
  for (const v of values) {
    const range = typeof v === 'string' && v.match(/^(-?\d+)\s*(?:…|\.\.\.?)\s*(-?\d+)$/)
    if (range) {
      for (let n = Number(range[1]); n <= Number(range[2]); n++) {
        out.push(String(n))
        if (withString) out.push(lit(String(n)))
      }
    } else if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') out.push(lit(v))
    else return null
  }
  return out
}

function propType(meta, p, overrides) {
  const key = `${meta.name}.${p.name}`
  if (overrides.props[key]) return overrides.props[key]
  if (p.name === 'labels' && /Object/.test(p.type)) return 'GranaLabels'
  const base = parseType(p.type)
  if (base === null) throw new Error(`${meta.file}: el tipo de la prop ${key} («${p.type}») no se sabe leer; añade '${key}' a types/overrides.mjs (props).`)
  const literals = valueLiterals(p.values, p.type)
  let type = base
  if (literals) {
    const extra = base.split(' | ').filter((t) => t === 'null' || (t === 'boolean' && !literals.some((l) => l === 'true' || l === 'false')) || t === 'Element' || t === 'Date')
    type = union([...literals, ...extra])
  }
  if ((p.default === null || p.default === 'null') && !p.required && !type.split(' | ').includes('null')) type += ' | null'
  return type
}

/** Payload de un evento; `void` sin argumento. */
function payloadType(meta, e, overrides) {
  const key = `${meta.name}.${e.name}`
  if (key in overrides.events) return overrides.events[key]
  const raw = String(e.payload ?? '').trim()
  if (raw === '' || raw === '—' || raw === '-') return 'void'
  const simple = parseType(raw)
  if (simple !== null) return simple
  const obj = parseObjectShape(raw)
  if (obj !== null) return obj
  throw new Error(`${meta.file}: el payload de ${key} («${raw}») no se sabe leer; añade '${key}' a types/overrides.mjs (events).`)
}

/** «{ a, b?, c: 'x' | 'y', preventDefault() }» → tipo de objeto (campos sin tipo: any); null si no se sabe leer. */
export function parseObjectShape(text) {
  const m = String(text).trim().match(/^\{([^{}]*)\}$/)
  if (!m) return null
  const fields = []
  for (const raw of m[1].split(',')) {
    const f = raw.trim()
    if (!f) continue
    let mm
    if ((mm = f.match(/^([A-Za-z_$][\w$]*)\(\)$/))) fields.push(`${mm[1]}(): void`)
    else if ((mm = f.match(/^([A-Za-z_$][\w$]*)(\?)?$/))) fields.push(`${mm[1]}${mm[2] || ''}: any`)
    else if ((mm = f.match(/^([A-Za-z_$][\w$]*)(\?)?\s*:\s*(.+)$/))) {
      const t = parseType(mm[3])
      if (t === null) return null
      fields.push(`${mm[1]}${mm[2] || ''}: ${t}`)
    } else return null
  }
  return `{ ${fields.join('; ')} }`
}

/** Alcance de un slot: override, `scope`/`props` o «Alcance: { … }» del propósito. */
function slotScope(meta, s, overrides) {
  const key = `${meta.name}.${s.name}`
  if (overrides.slots[key]) return overrides.slots[key]
  const text = s.scope || s.props || ((s.purpose || '').match(/[Aa]lcance:?\s*(\{[^}]*\})/) || [])[1]
  if (!text) return 'GranaSlotScope'
  const shape = parseObjectShape(text)
  if (shape === null) throw new Error(`${meta.file}: el alcance del slot ${key} («${text}») no se sabe leer; añade '${key}' a types/overrides.mjs (slots).`)
  return shape
}

/** Nombre de slot a clave de TypeScript: «cell-{key}» y «tab-<id>» son plantillas. */
function slotKey(name) {
  const dyn = name.match(/^(.*?)(?:\{[^}]+\}|<[^>]+>)(.*)$/)
  if (dyn) return { key: `[name: \`${dyn[1]}\${string}${dyn[2]}\`]`, dynamic: true }
  return { key: /^[A-Za-z_$][\w$]*$/.test(name) ? name : `'${name}'`, dynamic: false }
}
const propKey = (name) => (/^[A-Za-z_$][\w$]*$/.test(name) ? name : `'${name}'`)

const doc = (lines, indent = '') => {
  const clean = lines.filter(Boolean).map((l) => String(l).replace(/\*\//g, '*\\/').replace(/\s+/g, ' ').trim())
  if (!clean.length) return ''
  if (clean.length === 1) return `${indent}/** ${clean[0]} */\n`
  return `${indent}/**\n${clean.map((l) => `${indent} * ${l}`).join('\n')}\n${indent} */\n`
}

/** Las props de un meta.json, con los nombres compuestos («a / b / c») separados. */
export function metaProps(meta) {
  const out = []
  for (const p of meta.props || []) {
    for (const name of String(p.name).split('/').map((s) => s.trim()).filter(Boolean)) out.push({ ...p, name })
  }
  return out
}

/** Declaración de un componente. */
export function componentDeclaration(meta, overrides) {
  const N = meta.name
  let out = ''
  out += doc([meta.description, meta.tag ? `Etiqueta: \`<${meta.tag}>\`.` : null, meta.contract ? `Contrato: ${meta.contract}.` : null])
  out += `export interface ${N}Props {\n`
  for (const p of metaProps(meta)) {
    const type = propType({ ...meta, name: N }, p, overrides)
    const def = p.default === undefined || p.default === null || p.default === 'null' ? null : `@default ${typeof p.default === 'string' ? p.default : JSON.stringify(p.default)}`
    const note = p.note || p.description || (typeof p.values === 'string' ? p.values : null)
    out += doc([note, def], '  ')
    out += `  ${propKey(p.name)}${p.required ? '' : '?'}: ${type}\n`
  }
  out += '}\n'
  out += `export type ${N}Emits = {\n`
  for (const e of meta.events || []) {
    const t = payloadType(meta, e, overrides)
    out += doc([e.trigger], '  ')
    out += `  ${propKey(e.name)}: ${t === 'void' ? '() => void' : `(payload: ${t}) => void`}\n`
  }
  out += '}\n'
  out += `export type ${N}Slots = {\n`
  const slots = meta.slots && meta.slots.length ? meta.slots : []
  for (const s of slots) {
    const { key, dynamic } = slotKey(s.name)
    out += doc([s.purpose], '  ')
    out += `  ${key}${dynamic ? '' : '?'}: (props: ${slotScope(meta, s, overrides)}) => GranaSlotContent\n`
  }
  out += '}\n'
  const exposed = overrides.exposed[N]
  out += `export interface ${N}Exposed ${exposed || '{}'}\n`
  out += `export declare const ${N}: GranaComponent<${N}Props, ${N}Emits, ${N}Slots, ${N}Exposed>\n`
  return out
}

// ---------------------------------------------------------------------------------------------------------------------
// Generación
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Genera todos los archivos en memoria. Devuelve { files: { 'grana.d.ts': texto, 'types/shared.d.ts': texto, … },
 * entries: { grana: { components, api } } } sin escribir nada.
 */
export async function generateTypes({ root = ROOT } = {}) {
  const overrides = await import(pathToFileURL(join(root, 'types/overrides.mjs')).href)
  const metas = readMetas(root)
  const shared = readFileSync(join(root, 'types/shared.d.ts'), 'utf8')
  const sharedNames = new Set([...shared.matchAll(/export\s+(?:interface|type)\s+([A-Za-z_$][\w$]*)/g)].map((m) => m[1]))
  const files = { 'types/shared.d.ts': shared }
  const entries = {}

  // Los métodos del meta.json (los de un componente, no los de un gestor) deben estar en lo expuesto
  for (const meta of metas.values()) {
    if (!meta.methods || overrides.managerMethods.includes(meta.name)) continue
    const exp = overrides.exposed[meta.name] || ''
    for (const m of meta.methods) {
      const name = typeof m === 'string' ? m.split('(')[0].trim() : m.name
      if (!new RegExp(`\\b${name}\\b`).test(exp)) throw new Error(`${meta.file}: el método ${meta.name}.${name} no está en types/overrides.mjs (exposed).`)
    }
  }

  for (const entry of ENTRIES) {
    const src = readFileSync(join(root, entry.src), 'utf8')
    const apiFile = join(root, 'types/api', `${entry.name}.d.ts`)
    const api = existsSync(apiFile) ? readFileSync(apiFile, 'utf8') : ''
    const exported = sourceExports(src)
    const declared = declaredExports(api)
    const components = []
    for (const name of exported) {
      if (metas.has(name)) components.push(name)
      else if (!declared.has(name)) throw new Error(`${entry.src} exporta «${name}», que no tiene meta.json ni está declarado en types/api/${entry.name}.d.ts.`)
    }
    for (const name of declared) {
      if (!exported.has(name)) throw new Error(`types/api/${entry.name}.d.ts declara «${name}», que ${entry.src} no exporta.`)
    }
    components.sort()
    let body = ''
    for (const name of components) body += '\n' + componentDeclaration(metas.get(name), overrides)
    const used = [...sharedNames].filter((n) => new RegExp(`\\b${n}\\b`).test(body))
    const needs = new Set(['GranaComponent', 'GranaSlotContent', ...used])
    let out = `// Generado por packages/vue/scripts/build-types.mjs desde los *.meta.json y packages/vue/types/. No editar a mano.\n`
    if (components.length) out += `import type { ${[...needs].sort().join(', ')} } from './types/shared.js'\n`
    out += `export * from './types/shared.js'\n`
    if (api) {
      out += `export * from './types/api/${entry.name}.js'\n`
      if (declared.has('default')) out += `export { default } from './types/api/${entry.name}.js'\n`
      files[`types/api/${entry.name}.d.ts`] = api
    }
    out += body
    // Plantillas: los que registra el `install` de la entrada (o `app.use(gestor)`), con sus alias
    if (components.length) {
      out += `\ndeclare module 'vue' {\n  export interface GlobalComponents {\n`
      for (const name of components) out += `    ${name}: typeof ${name}\n`
      for (const [alias, target] of Object.entries(overrides.aliases)) if (components.includes(target)) out += `    ${alias}: typeof ${target}\n`
      out += `  }\n}\n`
    }
    files[`${entry.name}.d.ts`] = out
    entries[entry.name] = { components, api: [...declared].sort() }
  }
  return { files, entries, metas }
}

/** Escribe los archivos en `outDir` (por defecto dist/). */
export async function buildTypes({ root = ROOT, outDir = join(ROOT, 'dist') } = {}) {
  const { files, entries } = await generateTypes({ root })
  for (const [rel, text] of Object.entries(files)) {
    const target = join(outDir, rel)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, text)
  }
  return { files: Object.keys(files), entries }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const { files, entries } = await buildTypes()
  const count = Object.values(entries).reduce((n, e) => n + e.components.length, 0)
  console.log(`tipos generados: ${files.length} archivos, ${count} componentes en ${Object.keys(entries).length} entradas`)
}
