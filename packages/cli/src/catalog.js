// `grana catalog` (dueño: bruno). design/contracts/catalog.md C4, DECISIONS.md #1080.
// Lee el catálogo del @grana/vue que resuelve el proyecto desde el directorio actual (sin red, sin descargar y sin
// depender de @grana/vue). Códigos: 0 respuesta (también una lista filtrada vacía) · 1 la pieza o la búsqueda no existe ·
// 2 uso, @grana/vue ausente o sin catálogo, JSON ilegible o esquema más nuevo que este CLI. Nunca 3 ni escribe nada.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

export const SCHEMA_VERSION = 1
/** Primera versión de @grana/vue que trae el catálogo (C4, «Desde qué versión»). */
export const CATALOG_SINCE = '1.0.0'
const STATUSES = ['stable', 'candidate', 'draft']
const SECTIONS = ['tokens', 'icons', 'utilities']

class Stop extends Error {
  constructor(code, message) { super(message); this.code = code }
}

// ---------- argumentos ----------

const VALUE = { '--find': 'find', '--entry': 'entry', '--status': 'status' }
const FLAG = { '--tokens': 'tokens', '--icons': 'icons', '--utilities': 'utilities', '--json': 'json', '--agents': 'agents' }

export const parseCatalogArgs = (argv) => {
  const a = { positional: [], sections: [] }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const eq = arg.indexOf('=')
    const name = arg.startsWith('--') && eq > 0 ? arg.slice(0, eq) : arg
    if (name in VALUE) {
      const v = eq > 0 && name !== arg ? arg.slice(eq + 1) : argv[++i]
      if (v === undefined || v === '' || (name === arg && v.startsWith('--'))) throw new Stop(2, `${name} necesita un valor.`)
      if (a[VALUE[name]] !== undefined) throw new Stop(2, `${name} va una sola vez.`)
      a[VALUE[name]] = v
    } else if (arg in FLAG) {
      const k = FLAG[arg]
      if (SECTIONS.includes(k)) { if (!a.sections.includes(k)) a.sections.push(k) } else a[k] = true
    } else if (arg.startsWith('-')) throw new Stop(2, `Opción desconocida: ${arg}`)
    else a.positional.push(arg)
  }
  if (a.positional.length > 1) throw new Stop(2, `«catalog» admite una sola pieza; recibió ${a.positional.length}.`)
  a.piece = a.positional[0]
  if (a.sections.length > 1) throw new Stop(2, `--${a.sections.join(', --')}: una sección a la vez.`)
  a.section = a.sections[0]
  if (a.status !== undefined && !STATUSES.includes(a.status)) throw new Stop(2, `--status admite ${STATUSES.join(', ')}; recibió «${a.status}».`)
  const filters = a.find !== undefined || a.entry !== undefined || a.status !== undefined
  if (a.piece !== undefined && (filters || a.section)) throw new Stop(2, 'Con una pieza no van --find, --entry, --status ni una sección.')
  if (a.section && filters) throw new Stop(2, `--${a.section} no admite --find, --entry ni --status.`)
  if (a.agents && (a.piece !== undefined || a.section || filters || a.json)) throw new Stop(2, '--agents va solo: sin pieza, sección, filtros ni --json.')
  return a
}

// ---------- origen ----------

/** El catálogo del @grana/vue que resuelve el proyecto: { path, version, text, data }. */
export const loadCatalog = (cwd) => {
  const req = createRequire(join(cwd, 'package.json'))
  let pkgPath
  try { pkgPath = req.resolve('@grana/vue/package.json') } catch {
    throw new Stop(2, '@grana/vue no está instalado en este proyecto (ni en sus carpetas superiores).\nInstálalo con: npx grana init')
  }
  let version = '?'
  try { version = JSON.parse(readFileSync(pkgPath, 'utf8')).version ?? '?' } catch { /* versión desconocida */ }
  let path
  try { path = req.resolve('@grana/vue/catalog.json') } catch {
    throw new Stop(2, `@grana/vue ${version} no trae catálogo (llega con @grana/vue ${CATALOG_SINCE}).\nActualiza: npm install @grana/vue@latest`)
  }
  let text
  let data
  try { text = readFileSync(path, 'utf8'); data = JSON.parse(text) } catch (e) {
    throw new Stop(2, `No se pudo leer el catálogo de @grana/vue ${version} (${path}): ${e.message}`)
  }
  if (!data || typeof data !== 'object' || !Number.isInteger(data.schemaVersion) || !Array.isArray(data.components)) {
    throw new Stop(2, `El catálogo de @grana/vue ${version} (${path}) no tiene la forma esperada.`)
  }
  if (data.schemaVersion > SCHEMA_VERSION) {
    throw new Stop(2, `El catálogo de @grana/vue ${version} usa el esquema ${data.schemaVersion} y este @grana/cli entiende hasta el ${SCHEMA_VERSION}.\nActualiza: npm install -D @grana/cli@latest`)
  }
  return { path, version: data.package?.version ?? version, text, data, root: dirname(dirname(path)) }
}

// ---------- búsqueda ----------

const fold = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const lev = (a, b) => {
  const m = a.length
  const n = b.length
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const cur = [i]
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    prev = cur
  }
  return prev[n]
}

const names = (c) => [c.name, c.tag, ...(c.aliases || [])].filter(Boolean)

export const findPiece = (data, query) => {
  const q = fold(query)
  return data.components.find((c) => names(c).some((n) => fold(n) === q))
}

export const search = (data, text) => {
  const q = fold(text)
  return data.components.filter((c) => [...names(c), c.description].some((v) => fold(v).includes(q)))
}

/** Hasta cinco piezas cercanas: por distancia de edición y por texto. */
export const suggest = (data, query) => {
  const q = fold(query).replace(/^g-/, 'g')
  const scored = data.components.map((c) => {
    const d = Math.min(...names(c).map((n) => lev(q, fold(n).replace(/^g-/, 'g').replace(/-/g, ''))), lev(q.replace(/-/g, ''), fold(c.name)))
    return { c, d }
  })
  const out = []
  const limit = Math.max(2, Math.ceil(q.length / 3))
  for (const { c } of scored.filter((s) => s.d <= limit).sort((a, b) => a.d - b.d || (a.c.name < b.c.name ? -1 : 1))) out.push(c.name)
  const bare = q.replace(/^g/, '')
  if (bare.length >= 3) for (const c of search(data, bare)) if (!out.includes(c.name)) out.push(c.name)
  return out.slice(0, 5)
}

// ---------- texto ----------

const firstSentence = (text, max = 160) => {
  const t = String(text || '').replace(/\s+/g, ' ').trim()
  const m = t.match(/^.+?[.;:](?=\s|$)/)
  const s = (m ? m[0] : t).replace(/[;:]$/, '.')
  return s.length <= max ? s : `${s.slice(0, max - 1).replace(/\s+\S*$/, '')}…`
}
const flat = (t) => String(t ?? '').replace(/\s+/g, ' ').trim()
const marks = (c) => [c.status !== 'stable' ? c.status : null, c.deprecated ? `retirada desde ${c.deprecated.since} → ${c.deprecated.use}` : null].filter(Boolean)
const show = (v) => (typeof v === 'string' ? v : JSON.stringify(v))

const header = (cat) => `@grana/vue ${cat.version} · ${cat.path}\n`

const registerLine = (e) =>
  e.install === 'default' ? (e.path === '@grana/vue' ? "import Grana from '@grana/vue'; app.use(Grana)" : `import x from '${e.path}'; app.use(x)`)
    : e.install === 'manager' ? `import { ${e.manager} } from '${e.path}'; app.use(${e.manager}({ … }))`
      : 'no registra nada'

const listText = (cat, components) => {
  const L = [header(cat).trimEnd()]
  const byEntry = new Map()
  for (const c of components) {
    if (!byEntry.has(c.entry)) byEntry.set(c.entry, [])
    byEntry.get(c.entry).push(c)
  }
  const order = (cat.data.entries || []).map((e) => e.path)
  for (const path of [...byEntry.keys()].sort((a, b) => order.indexOf(a) - order.indexOf(b))) {
    const e = (cat.data.entries || []).find((x) => x.path === path)
    L.push('', `${path}${e ? `  (${registerLine(e)})` : ''}`)
    for (const c of byEntry.get(path)) {
      const m = marks(c)
      L.push(`  ${c.name}  <${c.tag}>${m.length ? `  [${m.join(', ')}]` : ''}${c.registered === false ? '  [importar]' : ''}  ${firstSentence(c.description)}`)
    }
  }
  L.push('', `${components.length} ${components.length === 1 ? 'pieza' : 'piezas'}. Detalle: grana catalog <Pieza> · buscar: grana catalog --find <texto>`)
  return `${L.join('\n')}\n`
}

const detailText = (cat, c) => {
  const e = (cat.data.entries || []).find((x) => x.path === c.entry)
  const L = [header(cat).trimEnd(), '']
  const m = marks(c)
  L.push(`${c.name}  <${c.tag}>  · ${c.status}${c.since ? ` · desde ${c.since}` : ''}${c.deprecated ? ` · retirada desde ${c.deprecated.since}: usa ${c.deprecated.use}` : ''}`)
  if (c.aliases?.length) L.push(`Alias: ${c.aliases.join(', ')}`)
  L.push(flat(c.description))
  if (m.includes('draft')) L.push('draft: sin promesa; no lo uses sin que la persona lo acepte.')
  L.push('', `Entrada: ${c.entry}`)
  if (c.registered && e) L.push(`  Registro global: ${registerLine(e)}`)
  else L.push(`  No la registra la entrada: impórtala en el componente.`)
  L.push(`  Local: import { ${c.name} } from '${c.entry}'`)
  L.push('', `Props (${c.props.length}):`)
  for (const p of c.props) {
    const extra = [
      p.required ? 'obligatoria' : null,
      p.default !== null && p.default !== undefined ? `por defecto ${show(p.default)}` : null,
      p.resolvedDefault !== undefined ? `resuelto ${show(p.resolvedDefault)}` : null,
      p.since ? `desde ${p.since}` : null,
      p.deprecated ? `retirada desde ${p.deprecated.since}: usa ${p.deprecated.use}` : null
    ].filter(Boolean)
    L.push(`  ${p.name}: ${p.ts}${extra.length ? `  (${extra.join('; ')})` : ''}`)
    const inTs = (v) => p.ts.includes(typeof v === 'string' ? `'${v}'` : String(v))
    if (Array.isArray(p.values) && p.values.length && !p.values.every(inTs)) L.push(`      valores: ${p.values.map(show).join(' | ')}`)
    else if (typeof p.values === 'string') L.push(`      valores: ${flat(p.values)}`)
    if (p.description) L.push(`      ${flat(p.description)}`)
  }
  if (c.models?.length) {
    L.push('', 'v-model:')
    for (const md of c.models) L.push(`  ${md.directive}  (prop ${md.prop})`)
  }
  L.push('', `Eventos (${c.events.length}):`)
  for (const ev of c.events) L.push(`  ${ev.name}${ev.ts === 'void' ? '' : ` (${ev.ts})`}${ev.description ? ` — ${flat(ev.description)}` : ''}`)
  L.push('', `Slots (${c.slots.length}):`)
  for (const s of c.slots) L.push(`  ${s.name}${s.props ? ` ${flat(s.props)}` : ''}${s.description ? ` — ${flat(s.description)}` : ''}`)
  if (c.methods?.length) {
    L.push('', 'Métodos (ref):')
    for (const me of c.methods) L.push(`  ${me.signature}${me.description ? ` — ${flat(me.description)}` : ''}`)
  }
  if (c.labels?.length) L.push('', `Claves de labels: ${c.labels.join(', ')}`)
  if (c.cssProperties?.length) {
    L.push('', 'Propiedades CSS:')
    for (const p of c.cssProperties) L.push(`  ${p.name}${p.description ? ` — ${flat(p.description)}` : ''}`)
  }
  return `${L.join('\n')}\n`
}

const sectionText = (cat, section) => {
  const d = cat.data
  const L = [header(cat).trimEnd(), '']
  if (section === 'tokens') {
    L.push(`${d.tokens.length} tokens (solo nombres; los valores los da el tema):`, ...d.tokens.map((t) => `  ${t}`))
  } else if (section === 'icons') {
    L.push(`${d.icons.library.length} iconos de la librería (Lucide):`, ...d.icons.library.map((i) => `  ${i}`))
    const al = Object.entries(d.icons.aliases || {})
    if (al.length) L.push('', 'Alias de compatibilidad:', ...al.map(([a, t]) => `  ${a} → ${t}`))
  } else {
    L.push(`${d.utilities.length} clases utilitarias (@grana/vue/utilities.css, también en style.css):`, ...d.utilities.map((u) => `  ${u.class}  (${u.group})`))
  }
  return `${L.join('\n')}\n`
}

export const AGENT_RULES = [
  'Usa solo piezas, props, valores, eventos, slots y clases que estén en el catálogo **de la versión instalada**. Si algo no está, no existe: no lo inventes; consulta con `npx grana catalog --find <texto>` o pregunta.',
  'Importa cada pieza desde su `entry`. Si no es `@grana/vue`, registra su entrada (`install`) o impórtala en el componente; con `registered: false` hay que importarla.',
  '`stable` está prometido por semver; `candidate` puede cambiar en una menor; `draft` no tiene promesa: no lo uses sin que la persona lo acepte. Lo `deprecated` no se usa: usa lo que dice `use`.',
  'Estilo por tokens: importa `@grana/vue/style.css`; el color y la marca vienen del tema (`grana.config.json`); no pises componentes con colores literales ni con selectores sobre sus partes internas (`g-*__*` no es API).',
  'Iconos: solo Lucide. En las piezas, por nombre de la lista de la librería (`npx grana catalog --icons`) o registrados con `createIcons`; nunca caracteres ni SVG a mano.',
  'Respeta las props obligatorias (`required`) y da nombre accesible a lo que lo pide (`labels`, `label`, `aria-label`).'
]

const agentsText = (cat) => {
  const L = []
  L.push(`## Grana (@grana/vue ${cat.version})`)
  L.push('')
  L.push('Este proyecto usa Grana, librería de componentes Vue 3 con tema por tokens. Antes de usar una pieza, una prop o una clase, compruébala en el catálogo de la versión instalada:')
  L.push('')
  L.push('- `npx grana catalog`: piezas por entrada.')
  L.push('- `npx grana catalog <Pieza>`: props (tipo, valores, por defecto), `v-model`, eventos, slots, métodos y claves de `labels`.')
  L.push('- `npx grana catalog --find <texto>`: buscar; código de salida 1 = no existe.')
  L.push('- `npx grana catalog --json`: lo mismo en JSON. Sin terminal: `node_modules/@grana/vue/dist/catalog.json` y `node_modules/@grana/vue/dist/llms.txt`.')
  L.push('')
  L.push('Reglas:')
  L.push('')
  AGENT_RULES.forEach((r, i) => L.push(`${i + 1}. ${r}`))
  return `${L.join('\n')}\n`
}

// ---------- orden ----------

export const runCatalog = (argv, { cwd, out, err }) => {
  try {
    const a = parseCatalogArgs(argv)
    const cat = loadCatalog(cwd)
    const d = cat.data
    if (a.agents) { out(agentsText(cat)); return 0 }
    if (a.section) {
      const key = a.section
      if (d[key] === undefined) throw new Stop(2, `El catálogo de @grana/vue ${cat.version} no trae la sección ${key}.`)
      out(a.json ? `${JSON.stringify(d[key], null, 2)}\n` : sectionText(cat, key))
      return 0
    }
    if (a.piece !== undefined) {
      const c = findPiece(d, a.piece)
      if (!c) {
        const near = suggest(d, a.piece)
        err(`No existe «${a.piece}» en @grana/vue ${cat.version}.${near.length ? `\n¿Quisiste decir? ${near.join(', ')}` : ''}\nBusca con: grana catalog --find <texto>\n`)
        return 1
      }
      out(a.json ? `${JSON.stringify(c, null, 2)}\n` : detailText(cat, c))
      return 0
    }
    const filtered = a.find !== undefined || a.entry !== undefined || a.status !== undefined
    if (!filtered && a.json) { out(cat.text); return 0 }
    let list = d.components
    if (a.entry !== undefined) {
      const paths = (d.entries || []).map((e) => e.path)
      const want = a.entry.startsWith('@grana/vue') ? a.entry : `@grana/vue/${a.entry.replace(/^\.?\//, '')}`
      if (!paths.includes(want)) throw new Stop(2, `--entry: «${a.entry}» no es una entrada de @grana/vue ${cat.version}. Entradas: ${paths.join(', ')}`)
      list = list.filter((c) => c.entry === want)
    }
    if (a.status !== undefined) list = list.filter((c) => c.status === a.status)
    if (a.find !== undefined) {
      const hits = search({ components: list }, a.find)
      if (!hits.length) {
        if (a.json) out(`${JSON.stringify({ components: [] }, null, 2)}\n`)
        const near = suggest(d, a.find)
        err(`Ninguna pieza coincide con «${a.find}» en @grana/vue ${cat.version}.${near.length ? `\n¿Quisiste decir? ${near.join(', ')}` : ''}\n`)
        return 1
      }
      list = hits
    }
    out(a.json ? `${JSON.stringify({ components: list }, null, 2)}\n` : listText(cat, list))
    return 0
  } catch (e) {
    if (e instanceof Stop) { err(`${e.message}\n`); return e.code }
    throw e
  }
}
