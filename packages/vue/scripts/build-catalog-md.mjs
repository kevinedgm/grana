// Referencia de componentes en Markdown para los agentes del Fruti Squad (lima la consulta al contratar).
// Se genera desde dist/catalog.json (build-catalog.mjs, DECISIONS #1082): nada se escribe a mano.
//   node packages/vue/scripts/build-catalog-md.mjs [ruta/catalog.json]   → docs/contract/catalogo.md
// Determinista: mismo catálogo → mismos bytes.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const src = resolve(process.argv[2] ?? resolve(ROOT, 'packages/vue/dist/catalog.json'))
const out = resolve(ROOT, 'docs/contract/catalogo.md')
const c = JSON.parse(readFileSync(src, 'utf8'))

const code = (s) => '`' + String(s).replace(/`/g, "'") + '`'
const one = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()
const dflt = (v) => (v === undefined ? '' : ` = ${code(JSON.stringify(v))}`)

const L = []
L.push(`# Catálogo de componentes · ${c.package.name} ${c.package.version}`)
L.push('')
L.push('> **Generado, no se edita a mano.** Fuente: los `meta.json` vía `dist/catalog.json` (`build-catalog.mjs`, #1082).')
L.push('> Regenerar tras `npm run build`: `node packages/vue/scripts/build-catalog-md.mjs`.')
L.push('')
L.push('## Cómo usarlo')
L.push('')
L.push('- Es la lista de lo que **ya existe** como API pública: piezas, props (tipo, valores y por defecto), `v-model`, eventos, slots, métodos, propiedades CSS públicas y claves de `labels`.')
L.push('- Para buscar una pieza: `grep -n "^### GBtn " docs/contract/catalogo.md` y lee hasta el siguiente `###`. Para buscar un nombre de prop o evento en todas: `grep -n "\\`nombre\\`" docs/contract/catalogo.md`.')
L.push('- Antes de contratar una prop, un evento o un token nuevo, comprueba aquí si ya existe con otro nombre o en otra pieza, y reutiliza su nombre y sus valores.')
L.push('- Lo que no está aquí no es API. El contrato completo y el porqué siguen en `design/contracts/` y `DECISIONS.md`.')
L.push('')

const counts = c.components.reduce((a, x) => ((a[x.status] = (a[x.status] || 0) + 1), a), {})
L.push(`## Resumen`)
L.push('')
L.push(`${c.components.length} piezas (${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}), ${c.entries.length} entradas, ${c.tokens.length} tokens, ${c.icons.library.length} iconos, ${c.utilities.length} clases utilitarias.`)
L.push('')
L.push('## Entradas')
L.push('')
for (const e of c.entries) L.push(`- ${code(e.path)} (${e.install ?? 'sin registro'}): ${e.components.join(', ')}`)
L.push('')
L.push('## Piezas')
L.push('')
for (const x of c.components) {
  L.push(`### ${x.name} · ${code('<' + x.tag + '>')} · ${x.status} · ${code(x.entry)}`)
  L.push('')
  if (x.description) L.push(one(x.description))
  const meta = []
  if (x.aliases?.length) meta.push(`alias ${x.aliases.map(code).join(', ')}`)
  if (x.registered === false) meta.push('no se registra con su entrada: importarla')
  if (x.since) meta.push(`desde ${x.since}`)
  if (meta.length) L.push(`(${meta.join('; ')})`)
  L.push('')
  if (x.props?.length) {
    L.push('**Props**')
    for (const p of x.props) {
      const extra = [p.required ? 'obligatoria' : '', p.since && p.since !== x.since ? `desde ${p.since}` : '', p.deprecated ? `obsoleta${p.use ? `, usar ${code(p.use)}` : ''}` : ''].filter(Boolean)
      L.push(`- ${code(p.name)}: ${code(p.ts ?? p.type)}${dflt(p.default)}${extra.length ? ` (${extra.join('; ')})` : ''}${p.description ? `. ${one(p.description)}` : ''}`)
    }
  }
  if (x.models?.length) L.push(`**v-model**: ${x.models.map((m) => `${code(m.directive)} → ${code(m.prop)}`).join(', ')}`)
  if (x.events?.length) {
    L.push('**Eventos**')
    for (const e of x.events) L.push(`- ${code(e.name)}${e.ts && e.ts !== 'void' ? ` (${code(e.ts)})` : ''}${e.description ? `: ${one(e.description)}` : ''}`)
  }
  if (x.slots?.length) {
    L.push('**Slots**')
    for (const s of x.slots) L.push(`- ${code(s.name)}${s.description ? `: ${one(s.description)}` : ''}`)
  }
  if (x.methods?.length) {
    L.push('**Métodos**')
    for (const m of x.methods) L.push(`- ${code(m.signature ?? m.name)}${m.description ? `: ${one(m.description)}` : ''}`)
  }
  if (x.cssProperties?.length) {
    L.push('**Propiedades CSS públicas**')
    for (const p of x.cssProperties) L.push(`- ${code(p.name)}${p.description ? `: ${one(p.description)}` : ''}`)
  }
  if (x.labels?.length) L.push(`**Claves de \`labels\`**: ${x.labels.map(code).join(', ')}`)
  L.push('')
}
L.push('## Tokens del tema')
L.push('')
L.push(c.tokens.map(code).join(', '))
L.push('')
L.push('## Iconos de la librería (Lucide)')
L.push('')
L.push(c.icons.library.map(code).join(', '))
L.push('')
L.push('## Clases utilitarias')
L.push('')
const groups = {}
for (const u of c.utilities) (groups[u.group] ??= []).push(u.class)
for (const [g, list] of Object.entries(groups)) L.push(`- ${g}: ${list.map(code).join(' ')}`)
L.push('')

writeFileSync(out, L.join('\n'))
console.log(`catalogo.md: ${c.components.length} piezas, ${Buffer.byteLength(L.join('\n'))} B → ${out}`)
