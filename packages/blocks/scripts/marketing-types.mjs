// Tipos de la entrada @grana/blocks/marketing (dueño: bruno; _comun.md §6, #443, #815). Lo llama build-types.mjs.
//   1. Lee cada src/blocks/Gb*/Gb*.meta.json con kind "block-section" y family "marketing".
//   2. Escribe en dist/marketing.d.ts UN `export interface Gb<Sección>Props` por sección (con sus eventos y slots) y, por
//      cada variante, `export declare const Gb<Sección><NN>: BlockComponent<Gb<Sección>Props, …>` con ese mismo tipo.
//   3. Reexporta los tipos escritos a mano de types/marketing.d.ts (copiados a dist/types/marketing.d.ts).
//   4. Amplía GlobalComponents de Vue con todas las variantes.
//   5. Se detiene si una variante del meta.json no se exporta en src/marketing.js, si una exportación no consta en ningún
//      meta.json o si un tipo no se sabe leer.
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Nombres de tipo que puede citar un `ts` del meta.json: los de types/marketing.d.ts y los primitivos de TypeScript
const KEYWORDS = new Set(['string', 'number', 'boolean', 'null', 'undefined', 'unknown', 'void', 'true', 'false'])
const PRIM = { String: 'string', Number: 'number', Boolean: 'boolean' }

/** Nombres que exporta types/marketing.d.ts. */
export function handTypes(root = ROOT) {
  const text = readFileSync(join(root, 'types/marketing.d.ts'), 'utf8')
  return new Set([...text.matchAll(/export\s+(?:interface|type)\s+([A-Za-z_$][\w$]*)/g)].map((m) => m[1]))
}

/** Valida un tipo escrito en el meta.json: solo palabras de TypeScript, nombres de types/marketing.d.ts y claves de objeto. */
export function checkTs(ts, known, where) {
  if (typeof ts !== 'string' || !ts.trim()) throw new Error(`${where}: falta «ts» (tipo de TypeScript) o está vacío.`)
  if (/[;]\s*[;]|=>|\bany\b|\[key:/.test(ts)) throw new Error(`${where}: el tipo «${ts}» no se admite (sin any, funciones ni firmas de índice).`)
  // Quita las claves de objeto («label?:», «value:») y comprueba los identificadores que quedan
  const rest = ts.replace(/[A-Za-z_$][\w$]*\??\s*:/g, ' ')
  for (const m of rest.matchAll(/[A-Za-z_$][\w$]*/g)) {
    if (!KEYWORDS.has(m[0]) && !known.has(m[0])) throw new Error(`${where}: el tipo «${ts}» cita «${m[0]}», que no es de TypeScript ni de types/marketing.d.ts.`)
  }
  return ts.trim()
}

/** Tipo de una prop: `ts` si existe; si no, un primitivo de Vue. */
export function propTs(p, known, where) {
  if (p.ts !== undefined) return checkTs(p.ts, known, where)
  if (p.type in PRIM) return PRIM[p.type]
  throw new Error(`${where}: el tipo «${p.type}» no se sabe leer; añade «ts» con el tipo de TypeScript.`)
}

/** Los meta.json de sección de Marketing, en orden de carpeta. */
export function readSectionMetas(root = ROOT) {
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
    if (meta.family === 'marketing') out.push(meta)
  }
  return out
}

/** Nombres de valor que exporta src/marketing.js (export { … } y export const/function). */
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
    out += `  ${e.name}: (payload: ${checkTs(e.ts, known, `${meta.file} · evento ${e.name}`)}) => void\n`
  }
  out += '}\n'
  out += `export type ${N}Slots = {\n`
  for (const s of meta.slots || []) {
    out += doc([s.purpose, s.variants ? `Solo lo usa ${s.variants.join(', ')}.` : null], '  ')
    const scope = s.ts !== undefined ? checkTs(s.ts, known, `${meta.file} · slot ${s.name}`) : 'Record<string, never>'
    out += `  ${/^[A-Za-z_$][\w$]*$/.test(s.name) ? s.name : `'${s.name}'`}?: (props: ${scope}) => BlockSlotContent\n`
  }
  out += '}\n'
  for (const v of meta.variants) {
    if (!new RegExp(`^${N}\\d{2}$`).test(v.name)) throw new Error(`${meta.file}: la variante «${v.name}» no sigue ${N}NN.`)
    out += doc([`${v.concept}. ${v.root || ''}`, `Etiqueta: \`<${v.tag}>\`.`])
    out += `export declare const ${v.name}: BlockComponent<${N}Props, ${N}Emits, ${N}Slots>\n`
  }
  return out
}

/** Genera dist/marketing.d.ts y dist/types/marketing.d.ts en memoria. */
export function generateMarketingTypes({ root = ROOT } = {}) {
  const known = handTypes(root)
  // Record es de TypeScript; se admite en los alcances de slot
  known.add('Record')
  const metas = readSectionMetas(root)
  const exported = exportedNames(readFileSync(join(root, 'src/marketing.js'), 'utf8'))
  const variants = metas.flatMap((m) => m.variants.map((v) => v.name))
  for (const name of variants) if (!exported.has(name)) throw new Error(`src/marketing.js no exporta «${name}», que declara su meta.json.`)
  for (const name of exported) if (name !== 'marketing' && !variants.includes(name)) throw new Error(`src/marketing.js exporta «${name}», que no consta en ningún meta.json de sección.`)
  if (!exported.has('marketing')) throw new Error('src/marketing.js no exporta el plugin «marketing».')

  let out = '// GENERADO por packages/blocks/scripts/build-types.mjs desde los *.meta.json de sección. No editar a mano.\n'
  out += "import type { App } from 'vue'\n"
  out += `import type { ${[...handTypes(root)].sort().join(', ')} } from './types/marketing.js'\n`
  out += "export type * from './types/marketing.js'\n\n"
  for (const meta of metas) out += sectionDeclaration(meta, known) + '\n'
  out += '/** Plugin: `app.use(marketing)` registra todas las variantes. */\n'
  out += 'export declare const marketing: { install(app: App): void }\n\n'
  out += "declare module 'vue' {\n  export interface GlobalComponents {\n"
  for (const name of variants) out += `    ${name}: typeof ${name}\n`
  out += '  }\n}\n'
  return {
    files: { 'marketing.d.ts': out, 'types/marketing.d.ts': readFileSync(join(root, 'types/marketing.d.ts'), 'utf8') },
    sections: metas.map((m) => m.name),
    variants
  }
}

export function buildMarketingTypes({ root = ROOT, outDir = join(ROOT, 'dist') } = {}) {
  const { files, sections, variants } = generateMarketingTypes({ root })
  for (const [rel, text] of Object.entries(files)) {
    const target = join(outDir, rel)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, text)
  }
  return { files: Object.keys(files), sections, variants }
}
