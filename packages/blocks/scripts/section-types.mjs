// Tipos de las entradas de familia de @grana/blocks (dueño: bruno; _comun.md §6 y §19, #443, #815, #860). Lo llama
// build-types.mjs una vez por familia (marketing, booking…):
//   1. Lee cada src/blocks/Gb*/Gb*.meta.json con kind "block-section" y su `family`.
//   2. Escribe en dist/<familia>.d.ts UN `export interface Gb<Sección>Props` por sección (con sus eventos y slots) y, por
//      cada variante, `export declare const Gb<Sección><NN>: BlockComponent<Gb<Sección>Props, …>` con ese mismo tipo.
//   3. Reexporta los tipos escritos a mano de types/<familia>.d.ts (copiados a dist/types/<familia>.d.ts).
//   4. Amplía GlobalComponents de Vue con todas las variantes de la familia.
//   5. Se detiene si una variante del meta.json no se exporta en src/<familia>.js, si una exportación no consta en ningún
//      meta.json de la familia o si un tipo no se sabe leer.
// Añadir una familia: una fila en FAMILIES (entrada, plugin y archivo de tipos a mano) y su llamada en build-types.mjs.
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Familias: su entrada, el nombre del plugin y los tipos a mano. `needs`: los tipos a mano de otra familia que importa. */
export const FAMILIES = {
  marketing: { entry: 'src/marketing.js', plugin: 'marketing', hand: 'types/marketing.d.ts', needs: [] },
  booking: { entry: 'src/booking.js', plugin: 'booking', hand: 'types/booking.d.ts', needs: ['types/marketing.d.ts'] }
}
const familyOf = (family) => {
  const f = FAMILIES[family]
  if (!f) throw new Error(`familia «${family}» desconocida (scripts/section-types.mjs FAMILIES).`)
  return f
}

// Nombres de tipo que puede citar un `ts` del meta.json: los de types/<familia>.d.ts y los de TypeScript
const KEYWORDS = new Set(['string', 'number', 'boolean', 'null', 'undefined', 'unknown', 'void', 'true', 'false', 'Record'])
const PRIM = { String: 'string', Number: 'number', Boolean: 'boolean' }

/** Nombres que exporta types/<familia>.d.ts (declarados o reexportados con `export type { … } from`). */
export function handTypes(root = ROOT, family = 'marketing') {
  const text = readFileSync(join(root, familyOf(family).hand), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  const names = new Set([...text.matchAll(/export\s+(?:interface|type)\s+([A-Za-z_$][\w$]*)/g)].map((m) => m[1]))
  for (const m of text.matchAll(/export\s+type\s*\{([^}]*)\}/g)) for (const part of m[1].split(',')) { const n = part.trim().split(/\s+as\s+/).pop().trim(); if (n) names.add(n) }
  return names
}

/** Valida un tipo escrito en el meta.json: solo palabras de TypeScript, nombres de los tipos a mano, literales y claves de objeto. */
export function checkTs(ts, known, where) {
  if (typeof ts !== 'string' || !ts.trim()) throw new Error(`${where}: falta «ts» (tipo de TypeScript) o está vacío.`)
  if (/[;]\s*[;]|=>|\bany\b|\[key:/.test(ts)) throw new Error(`${where}: el tipo «${ts}» no se admite (sin any, funciones ni firmas de índice).`)
  // Quita los literales de cadena ('confirmed') y las claves de objeto («label?:», «value:»); comprueba los identificadores que quedan
  const rest = ts.replace(/'[^']*'/g, ' ').replace(/[A-Za-z_$][\w$]*\??\s*:/g, ' ')
  for (const m of rest.matchAll(/[A-Za-z_$][\w$]*/g)) {
    if (!KEYWORDS.has(m[0]) && !known.has(m[0])) throw new Error(`${where}: el tipo «${ts}» cita «${m[0]}», que no es de TypeScript ni de los tipos a mano de la familia.`)
  }
  return ts.trim()
}

/** Tipo de una prop: `ts` si existe; si no, un primitivo de Vue. */
export function propTs(p, known, where) {
  if (p.ts !== undefined) return checkTs(p.ts, known, where)
  if (p.type in PRIM) return PRIM[p.type]
  throw new Error(`${where}: el tipo «${p.type}» no se sabe leer; añade «ts» con el tipo de TypeScript.`)
}

/** Los meta.json de sección de una familia, en orden de carpeta. */
export function readSectionMetas(root = ROOT, family = 'marketing') {
  const dir = join(root, 'src/blocks')
  const out = []
  for (const name of readdirSync(dir).sort()) {
    if (!/^Gb[A-Z]/.test(name)) continue
    const file = join(dir, name, `${name}.meta.json`)
    if (!existsSync(file)) throw new Error(`src/blocks/${name}: falta ${name}.meta.json.`)
    const meta = JSON.parse(readFileSync(file, 'utf8'))
    meta.file = `src/blocks/${name}/${name}.meta.json`
    if (meta.kind !== 'block-section') throw new Error(`${meta.file}: kind debe ser "block-section".`)
    if (meta.name !== name) throw new Error(`${meta.file}: name «${meta.name}» no coincide con la carpeta.`)
    if (!FAMILIES[meta.family]) throw new Error(`${meta.file}: family «${meta.family}» no está en FAMILIES.`)
    if (meta.family === family) out.push(meta)
  }
  return out
}

/** Nombres de valor que exporta src/<familia>.js (export { … } y export const/function). */
export function exportedNames(code) {
  const clean = code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  const names = new Set()
  for (const m of clean.matchAll(/export\s*\{([^}]*)\}/g)) for (const part of m[1].split(',')) { const n = part.trim().split(/\s+as\s+/).pop().trim(); if (n) names.add(n) }
  for (const m of clean.matchAll(/export\s+(?:const|let|function|class)\s+([A-Za-z_$][\w$]*)/g)) names.add(m[1])
  return names
}

const doc = (lines, indent = '') => {
  const clean = lines.filter(Boolean).map((l) => String(l).replace(/\*\//g, '*\\/').replace(/\s+/g, ' ').trim())
  if (!clean.length) return ''
  if (clean.length === 1) return `${indent}/** ${clean[0]} */\n`
  return `${indent}/**\n${clean.map((l) => `${indent} * ${l}`).join('\n')}\n${indent} */\n`
}

/** Declaraciones de una sección: Props, Emits, Slots y una constante por variante. */
export function sectionDeclaration(meta, known) {
  const N = meta.name
  if (!Array.isArray(meta.variants) || !meta.variants.length) throw new Error(`${meta.file}: faltan variants.`)
  let out = doc([meta.description, `Contrato: ${meta.contract}.`])
  out += `export interface ${N}Props {\n`
  for (const p of meta.props || []) {
    if (!/^[A-Za-z_$][\w$]*$/.test(p.name)) throw new Error(`${meta.file}: prop «${p.name}» no es un identificador.`)
    out += doc([p.note, p.variants ? `Solo la usa ${p.variants.join(', ')}; las demás la ignoran.` : null], '  ')
    out += `  ${p.name}${p.required ? '' : '?'}: ${propTs(p, known, `${meta.file} · prop ${p.name}`)}\n`
  }
  out += '}\n'
  out += `export type ${N}Emits = {\n`
  for (const e of meta.events || []) {
    out += doc([e.trigger], '  ')
    // `update:query` y demás nombres con dos puntos van entre comillas
    out += `  ${/^[A-Za-z_$][\w$]*$/.test(e.name) ? e.name : `'${e.name}'`}: (payload: ${checkTs(e.ts, known, `${meta.file} · evento ${e.name}`)}) => void\n`
  }
  out += '}\n'
  out += `export type ${N}Slots = {\n`
  for (const s of meta.slots || []) {
    out += doc([s.purpose, s.variants ? `Solo lo usa ${s.variants.join(', ')}.` : null], '  ')
    const scope = s.ts !== undefined ? checkTs(s.ts, known, `${meta.file} · slot ${s.name}`) : 'Record<string, never>'
    // Un slot con nombre de plantilla («field-{name}») es una familia de slots: firma con plantilla de cadena
    const key = /\{[A-Za-z]+\}/.test(s.name) ? `[slot: \`${s.name.replace(/\{[A-Za-z]+\}/g, '${string}')}\`]` : /^[A-Za-z_$][\w$]*$/.test(s.name) ? s.name : `'${s.name}'`
    out += `  ${key}${key.startsWith('[') ? '' : '?'}: (props: ${scope}) => BlockSlotContent\n`
  }
  out += '}\n'
  for (const v of meta.variants) {
    if (!new RegExp(`^${N}\\d{2}$`).test(v.name)) throw new Error(`${meta.file}: la variante «${v.name}» no sigue ${N}NN.`)
    out += doc([`${v.concept}. ${v.root || ''}`, `Etiqueta: \`<${v.tag}>\`.`])
    out += `export declare const ${v.name}: BlockComponent<${N}Props, ${N}Emits, ${N}Slots>\n`
  }
  return out
}

/** Genera dist/<familia>.d.ts y dist/types/<familia>.d.ts (y los tipos a mano que importa) en memoria. */
export function generateFamilyTypes({ root = ROOT, family = 'marketing' } = {}) {
  const fam = familyOf(family)
  const hand = handTypes(root, family)
  const known = new Set(hand)
  const metas = readSectionMetas(root, family)
  const exported = exportedNames(readFileSync(join(root, fam.entry), 'utf8'))
  const variants = metas.flatMap((m) => m.variants.map((v) => v.name))
  for (const name of variants) if (!exported.has(name)) throw new Error(`${fam.entry} no exporta «${name}», que declara su meta.json.`)
  for (const name of exported) if (name !== fam.plugin && !variants.includes(name)) throw new Error(`${fam.entry} exporta «${name}», que no consta en ningún meta.json de sección de ${family}.`)
  if (!exported.has(fam.plugin)) throw new Error(`${fam.entry} no exporta el plugin «${fam.plugin}».`)

  let out = '// GENERADO por packages/blocks/scripts/build-types.mjs desde los *.meta.json de sección. No editar a mano.\n'
  out += "import type { App } from 'vue'\n"
  out += `import type { ${[...hand].sort().join(', ')} } from './types/${family}.js'\n`
  out += `export type * from './types/${family}.js'\n\n`
  for (const meta of metas) out += sectionDeclaration(meta, known) + '\n'
  out += `/** Plugin: \`app.use(${fam.plugin})\` registra todas las variantes. */\n`
  out += `export declare const ${fam.plugin}: { install(app: App): void }\n\n`
  out += "declare module 'vue' {\n  export interface GlobalComponents {\n"
  for (const name of variants) out += `    ${name}: typeof ${name}\n`
  out += '  }\n}\n'
  const files = { [`${family}.d.ts`]: out, [`types/${family}.d.ts`]: readFileSync(join(root, fam.hand), 'utf8') }
  for (const rel of fam.needs) files[rel.replace(/^types\//, 'types/')] = readFileSync(join(root, rel), 'utf8')
  return { files, sections: metas.map((m) => m.name), variants }
}

export function buildFamilyTypes({ root = ROOT, outDir = join(ROOT, 'dist'), family = 'marketing' } = {}) {
  const { files, sections, variants } = generateFamilyTypes({ root, family })
  for (const [rel, text] of Object.entries(files)) {
    const target = join(outDir, rel)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, text)
  }
  return { files: Object.keys(files), sections, variants }
}
