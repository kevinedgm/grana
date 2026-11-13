// Catálogo de componentes legible por agentes (dueño: bruno). design/contracts/catalog.md, DECISIONS.md #1080.
// Se ejecuta en `npm run build` después de build-types.mjs y escribe dist/catalog.json y dist/llms.txt.
//
// Una sola fuente con los tipos (#443): lee los meta.json con `readMetas`, las entradas con `ENTRIES` y `generateTypes`, y el
// tipo de cada prop y de cada evento con las MISMAS funciones que escriben el .d.ts (`propType`, `payloadType`). No copia
// nada de build-types.mjs.
//
// Lista blanca (C1.2): solo salen los campos del contrato; cualquier otra clave del meta.json (contract, pending, bundle,
// prototype…) se queda fuera. Estricto como build-types (C1.5): ante una forma que no sabe leer se detiene con el motivo.
// Determinista: mismo código fuente → mismos bytes (sin fecha, orden fijo por punto de código).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { ENTRIES, generateTypes, metaProps, payloadType, propType } from './build-types.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const SCHEMA_VERSION = 1
/** Topes de tamaño (C5): fuera de #506; superarlos lo decide lima. */
export const LIMITS = { catalog: 512 * 1024, llms: 32 * 1024 }

const byCode = (a, b) => (a < b ? -1 : a > b ? 1 : 0)
const STATUSES = ['stable', 'candidate', 'draft']
const IDENT = /^[A-Za-z_$][\w$]*$/
// Clave de labels: identificadores con punto; un segmento puede ser un patrón documentado (`*`, `<status>`).
const LABEL_KEY = /^[A-Za-z_$][\w$]*(\.([A-Za-z_$][\w$]*|\d+|\*|<[A-Za-z]+>))*$/
const kebab = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

const stripComments = (code) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

/** Cómo registra una entrada (C1.1 `install`) y qué nombres registra, leído de su fuente. */
export function entryInstall(code) {
  const src = stripComments(code)
  const registered = new Set()
  for (const m of src.matchAll(/const\s+components\s*=\s*\{([^}]*)\}/g)) {
    for (const part of m[1].split(',')) {
      const n = part.split(':')[0].trim()
      if (n) registered.add(n)
    }
  }
  for (const m of src.matchAll(/app\.component\(\s*'([A-Za-z_$][\w$]*)'\s*,/g)) registered.add(m[1])
  if (/export\s+default\b/.test(src)) return { install: 'default', registered }
  const factory = src.match(/export\s+function\s+(create[A-Z]\w*)\s*\(/)
  if (factory && /\.install\s*=/.test(src)) return { install: 'manager', manager: factory[1], registered }
  return { install: null, registered: new Set() }
}

/** Miembros de nivel superior de un tipo de objeto «{ a(): void; readonly b: string }». */
export function exposedNames(text) {
  const body = String(text || '').trim().replace(/^\{/, '').replace(/\}$/, '')
  const names = []
  let depth = 0
  let cur = ''
  for (const ch of body) {
    if ('({[<'.includes(ch)) depth++
    else if (')}]>'.includes(ch)) depth--
    if (ch === ';' && depth === 0) { names.push(cur); cur = '' } else cur += ch
  }
  names.push(cur)
  return names
    .map((m) => m.trim().replace(/^readonly\s+/, '').match(/^([A-Za-z_$][\w$]*)/))
    .filter(Boolean)
    .map((m) => m[1])
}

function normMethods(meta, overrides) {
  if (overrides.managerMethods.includes(meta.name)) return []
  const out = []
  for (const m of meta.methods || []) {
    if (typeof m === 'string') {
      const name = m.split('(')[0].trim()
      if (!IDENT.test(name)) throw new Error(`${meta.file}: el método «${m}» no empieza por un nombre.`)
      out.push({ name, signature: m })
    } else if (m && typeof m === 'object') {
      if (!IDENT.test(String(m.name)) || typeof m.signature !== 'string') {
        throw new Error(`${meta.file}: el método ${meta.name}.${m.name} necesita name (identificador) y signature (texto).`)
      }
      const description = m.purpose ?? m.description
      out.push({ name: m.name, signature: m.signature, ...(description ? { description } : {}) })
    } else throw new Error(`${meta.file}: un método de ${meta.name} no es texto ni objeto.`)
  }
  for (const k of ['exposed', 'exposes']) {
    if (meta[k] !== undefined) throw new Error(`${meta.file}: «${k}» es una forma heredada; lo expuesto va en «methods» (catalog.md C1.5).`)
  }
  const have = new Set(out.map((m) => m.name))
  for (const name of exposedNames(overrides.exposed[meta.name])) {
    if (!have.has(name)) throw new Error(`${meta.file}: ${meta.name} expone «${name}» (types/overrides.mjs) y no consta en «methods».`)
  }
  return out
}

function normLabels(meta) {
  const l = meta.labels
  if (l === undefined) return undefined
  let keys
  if (Array.isArray(l) && l.every((s) => typeof s === 'string')) keys = l.map((s) => s.trim().split(/\s+/)[0])
  else if (l && typeof l === 'object' && !Array.isArray(l) && Object.values(l).every((v) => v === null || typeof v !== 'object')) keys = Object.keys(l)
  else throw new Error(`${meta.file}: «labels» de ${meta.name} no es un arreglo de textos ni un objeto plano (catalog.md C1.5).`)
  for (const k of keys) {
    if (!LABEL_KEY.test(k)) throw new Error(`${meta.file}: la clave de labels «${k}» de ${meta.name} no es una clave (una por entrada, sin «a|b» ni «a/b»).`)
  }
  return [...new Set(keys)]
}

function normSlots(meta) {
  return (meta.slots || []).map((s) => {
    if (s.scope !== undefined && s.props !== undefined) throw new Error(`${meta.file}: el slot ${meta.name}.${s.name} lleva scope y props a la vez.`)
    const props = s.scope ?? s.props
    if (props !== undefined && typeof props !== 'string') throw new Error(`${meta.file}: el alcance del slot ${meta.name}.${s.name} no es texto.`)
    return { name: s.name, ...(props !== undefined ? { props } : {}), description: s.purpose }
  })
}

function normDeprecated(d, where) {
  if (d === undefined) return undefined
  if (!d || typeof d !== 'object' || typeof d.since !== 'string' || typeof d.use !== 'string') {
    throw new Error(`${where}: «deprecated» debe ser { since, use }.`)
  }
  return { since: d.since, use: d.use }
}

function piece(meta, { entry, registered, aliases, parent, overrides }) {
  const N = meta.name
  const status = meta.status ?? parent?.status
  if (!STATUSES.includes(status)) throw new Error(`${meta.file}: ${N} tiene status «${status}», fuera de ${STATUSES.join('/')}.`)
  const since = meta.since ?? parent?.since
  const props = metaProps(meta).map((p) => {
    const description = p.note || p.description
    return {
      name: p.name,
      type: p.type,
      ts: propType({ ...meta, name: N }, p, overrides),
      ...(p.values !== undefined ? { values: p.values } : {}),
      default: p.default === undefined ? null : p.default,
      ...(p.resolvedDefault !== undefined ? { resolvedDefault: p.resolvedDefault } : {}),
      ...(p.required ? { required: true } : {}),
      ...(p.since ? { since: p.since } : {}),
      ...(p.deprecated !== undefined ? { deprecated: normDeprecated(p.deprecated, `${meta.file} ${N}.${p.name}`) } : {}),
      ...(description ? { description } : {})
    }
  })
  const events = (meta.events || []).map((e) => ({
    name: e.name,
    payload: e.payload,
    ts: payloadType(meta, e, overrides),
    description: e.trigger
  }))
  const eventNames = new Set(events.map((e) => e.name))
  const models = props
    .filter((p) => eventNames.has(`update:${p.name}`))
    .map((p) => ({ prop: p.name, directive: p.name === 'modelValue' ? 'v-model' : `v-model:${p.name}` }))
  const methods = normMethods(meta, overrides)
  const labels = normLabels(meta)
  const cssProperties = (meta.publicProperties || []).map((c) => {
    if (typeof c === 'string') return { name: c }
    if (!c || typeof c.name !== 'string') throw new Error(`${meta.file}: publicProperties de ${N} sin name.`)
    const description = c.note ?? c.description
    return { name: c.name, ...(description ? { description } : {}) }
  })
  return {
    name: N,
    tag: meta.tag || kebab(N),
    ...(aliases.length ? { aliases } : {}),
    status,
    ...(since ? { since } : {}),
    ...(meta.deprecated !== undefined ? { deprecated: normDeprecated(meta.deprecated, meta.file) } : {}),
    description: meta.description,
    entry,
    registered,
    props,
    ...(models.length ? { models } : {}),
    events,
    slots: normSlots(meta),
    ...(methods.length ? { methods } : {}),
    ...(labels && labels.length ? { labels } : {}),
    ...(cssProperties.length ? { cssProperties } : {})
  }
}

/** `--g-*` declarados en defaults.css, sin repetir y ordenados. */
export function readTokens(css) {
  const names = new Set()
  for (const m of stripComments(css).matchAll(/(?<![\w(-])(--g-[\w-]+)\s*:/g)) names.add(m[1])
  return [...names].sort(byCode)
}

/** Genera el catálogo y el texto en memoria: { catalog, json, llms }. */
export async function generateCatalog({ root = ROOT } = {}) {
  const overrides = await import(pathToFileURL(join(root, 'types/overrides.mjs')).href)
  const { entries: typed, metas } = await generateTypes({ root })
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

  // Padre de cada parte o `related` (mismo archivo meta): hereda status y since.
  const parents = new Map()
  for (const m of metas.values()) if (m.file && m.file.endsWith(`/${m.name}.meta.json`)) parents.set(m.file, m)

  const entries = []
  const entryOf = new Map()
  const regOf = new Map()
  for (const e of ENTRIES) {
    const path = e.name === 'grana' ? '@grana/vue' : `@grana/vue/${e.name}`
    const key = e.name === 'grana' ? '.' : `./${e.name}`
    const exp = pkg.exports && pkg.exports[key]
    if (!exp || typeof exp.types !== 'string') throw new Error(`package.json: la entrada ${key} no está en exports con types.`)
    const { components, api } = typed[e.name]
    const functions = api.filter((n) => n !== 'default' && !n.startsWith('__')).sort(byCode)
    const src = readFileSync(join(root, e.src), 'utf8')
    const inst = entryInstall(src)
    // Sin piezas, sin API y sin registro no se lista (C1.1); una extensión que solo se registra (sidebar-index) sí.
    if (!components.length && !functions.length && !inst.install) continue
    for (const c of components) {
      if (entryOf.has(c)) throw new Error(`${c} lo exportan dos entradas: ${entryOf.get(c)} y ${path}.`)
      entryOf.set(c, path)
      regOf.set(c, inst.registered.has(c))
    }
    entries.push({
      path,
      install: inst.install,
      ...(inst.install === 'manager' ? { manager: inst.manager } : {}),
      components: [...components].sort(byCode),
      functions,
      types: exp.types.replace(/^\.\//, '')
    })
  }

  const aliasesOf = new Map()
  for (const [alias, target] of Object.entries(overrides.aliases)) {
    if (!aliasesOf.has(target)) aliasesOf.set(target, [])
    aliasesOf.get(target).push(alias)
  }

  const components = []
  for (const meta of [...metas.values()].sort((a, b) => byCode(a.name, b.name))) {
    const entry = entryOf.get(meta.name)
    if (!entry) throw new Error(`${meta.file}: ${meta.name} tiene meta.json pero ninguna entrada de ENTRIES la exporta.`)
    const parent = parents.get(meta.file)
    components.push(piece(meta, {
      entry,
      registered: regOf.get(meta.name),
      aliases: (aliasesOf.get(meta.name) || []).slice().sort(byCode),
      parent: parent && parent !== meta ? parent : null,
      overrides
    }))
  }

  const icons = JSON.parse(readFileSync(join(root, 'scripts/icons.json'), 'utf8'))
  const utilities = JSON.parse(readFileSync(join(root, '../../design/contracts/utilities.json'), 'utf8'))
  const catalog = {
    schemaVersion: SCHEMA_VERSION,
    package: { name: pkg.name, version: pkg.version },
    entries,
    components,
    tokens: readTokens(readFileSync(join(root, 'src/styles/defaults.css'), 'utf8')),
    icons: { library: [...icons.library], aliases: { ...icons.aliases } },
    utilities: utilities.classes.map((c) => ({ class: c.class, group: c.group }))
  }

  // Ningún texto del catálogo cita rutas del repositorio (lista blanca, C5).
  const walk = (v, at) => {
    if (typeof v === 'string') { if (/\b(design|packages)\//.test(v)) throw new Error(`catálogo: ${at} cita una ruta del repositorio: «${v.slice(0, 120)}».`) }
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, `${at}.${k}`)
  }
  walk(catalog.components, 'components')

  const json = `${JSON.stringify(catalog, null, 2)}\n`
  return { catalog, json, llms: renderLlms(catalog) }
}

// ---------------------------------------------------------------------------------------------------------------------
// llms.txt (C2): generado desde el mismo objeto; el texto es de bruno y no es API.
// ---------------------------------------------------------------------------------------------------------------------

export const AGENT_RULES = [
  'Usa solo piezas, props, valores, eventos, slots y clases que estén en el catálogo **de la versión instalada**. Si algo no está, no existe: no lo inventes; consulta con `npx grana catalog --find <texto>` o pregunta.',
  'Importa cada pieza desde su `entry`. Si no es `@grana/vue`, registra su entrada (`install`) o impórtala en el componente; con `registered: false` hay que importarla.',
  '`stable` está prometido por semver; `candidate` puede cambiar en una menor; `draft` no tiene promesa: no lo uses sin que la persona lo acepte. Lo `deprecated` no se usa: usa lo que dice `use`.',
  'Estilo por tokens: importa `@grana/vue/style.css`; el color y la marca vienen del tema (`grana.config.json`); no pises componentes con colores literales ni con selectores sobre sus partes internas (`g-*__*` no es API).',
  'Iconos: solo Lucide. En las piezas, por nombre de la lista de la librería (`--icons`) o registrados con `createIcons`; nunca caracteres ni SVG a mano.',
  'Respeta las props obligatorias (`required`) y da nombre accesible a lo que lo pide (`labels`, `label`, `aria-label`).'
]

export const QUERY_LINES = [
  '`npx grana catalog`: lista de piezas por entrada.',
  '`npx grana catalog <Pieza>`: detalle (props con tipo, valores y por defecto, `v-model`, eventos, slots, métodos, claves de `labels`). Acepta nombre, alias o etiqueta (`GBtn`, `g-btn`).',
  '`npx grana catalog --find <texto>`: busca por nombre, etiqueta o descripción. Código 1 = no existe.',
  '`npx grana catalog --json`: lo mismo en JSON (esquema `schemaVersion: 1`).',
  'Sin terminal: `node_modules/@grana/vue/dist/catalog.json`.'
]

const installText = (e) =>
  e.install === 'default' ? (e.path === '@grana/vue' ? 'registro `app.use(Grana)`' : `registro \`import x from '${e.path}'; app.use(x)\``)
    : e.install === 'manager' ? `registro \`app.use(${e.manager}(…))\``
      : 'no registra nada'

// En el índice, una frase: la primera de la descripción, a lo sumo 160 caracteres (la completa está en el catálogo).
export const firstSentence = (text, max = 160) => {
  const t = String(text || '').replace(/\s+/g, ' ').trim()
  const m = t.match(/^.+?[.;:](?=\s|$)/)
  const s = (m ? m[0] : t).replace(/[;:]$/, '.')
  return s.length <= max ? s : `${s.slice(0, max - 1).replace(/\s+\S*$/, '')}…`
}

const statusMark = (c) => [c.status, c.deprecated ? `deprecated → ${c.deprecated.use}` : null].filter(Boolean).join(', ')

export function renderLlms(catalog) {
  const { version } = catalog.package
  const L = []
  L.push(`# Grana · @grana/vue ${version}`)
  L.push('')
  L.push('> Librería de componentes Vue 3 con tema por tokens (`--g-*`): la estructura y la accesibilidad son de la librería y el color lo pone cada proyecto.')
  L.push(`> Este archivo describe exactamente la versión ${version} instalada; lo que no esté en su catálogo no es API.`)
  L.push('')
  L.push('## Cómo consultar')
  L.push('')
  for (const l of QUERY_LINES) L.push(`- ${l}`)
  L.push('')
  L.push('## Reglas para agentes')
  L.push('')
  AGENT_RULES.forEach((r, i) => L.push(`${i + 1}. ${r}`))
  L.push('')
  L.push('## Entradas')
  L.push('')
  for (const e of catalog.entries) {
    const parts = e.components.length ? e.components.join(', ') : 'sin piezas'
    L.push(`- \`${e.path}\` · ${installText(e)} · ${parts}`)
  }
  L.push('')
  L.push('## Piezas')
  L.push('')
  for (const c of catalog.components) {
    L.push(`- ${c.name} \`<${c.tag}>\` · ${statusMark(c)} · ${c.entry}${c.registered ? '' : ' (importar)'} — ${firstSentence(c.description)}`)
  }
  L.push('')
  L.push('## Tokens, iconos y clases')
  L.push('')
  L.push(`- ${catalog.tokens.length} tokens \`--g-*\` (solo nombres; los valores los da el tema): \`npx grana catalog --tokens\`.`)
  L.push(`- ${catalog.icons.library.length} iconos de la librería (Lucide): \`npx grana catalog --icons\`.`)
  L.push(`- ${catalog.utilities.length} clases utilitarias (\`@grana/vue/utilities.css\`, también en \`style.css\`): \`npx grana catalog --utilities\`.`)
  L.push('')
  return L.join('\n')
}

/** Escribe dist/catalog.json y dist/llms.txt. */
export async function buildCatalog({ root = ROOT, outDir = join(ROOT, 'dist') } = {}) {
  const { catalog, json, llms } = await generateCatalog({ root })
  const jsonBytes = Buffer.byteLength(json)
  const llmsBytes = Buffer.byteLength(llms)
  if (jsonBytes > LIMITS.catalog) throw new Error(`catalog.json mide ${jsonBytes} B, por encima del tope de ${LIMITS.catalog} B (lo decide lima).`)
  if (llmsBytes > LIMITS.llms) throw new Error(`llms.txt mide ${llmsBytes} B, por encima del tope de ${LIMITS.llms} B (lo decide lima).`)
  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'catalog.json'), json)
  writeFileSync(join(outDir, 'llms.txt'), llms)
  return { catalog, jsonBytes, llmsBytes }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const { catalog, jsonBytes, llmsBytes } = await buildCatalog()
  const props = catalog.components.reduce((n, c) => n + c.props.length, 0)
  console.log(`catálogo: ${catalog.components.length} piezas, ${props} props, ${catalog.entries.length} entradas, ${catalog.tokens.length} tokens, ${catalog.icons.library.length} iconos, ${catalog.utilities.length} clases; catalog.json ${jsonBytes} B, llms.txt ${llmsBytes} B`)
}
