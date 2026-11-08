#!/usr/bin/env node
// Genera las páginas del sitio (site/src/, ignorado por git) desde una sola fuente de verdad:
//   - README.md raíz      → inicio, empezar, tematización, accesibilidad, personalidad, índice, proyecto
//   - packages/cli/README → @grana/cli          - CHANGELOG.md → cambios
//   - packages/vue/src/components/<G…>/README.md + *.meta.json → una página por componente
//   - packages/blocks/README.md → índice de blocks/ y de cada familia; packages/blocks/src/blocks/<Gb…>/README.md
//     + <Gb…>.meta.json → una página por sección, blocks/<familia>/<sección>
// Español es la fuente. Para inglés se usa `<archivo>.en.md` si existe; si no, la página en
// inglés muestra el español con el aviso «Translation pending».
// Páginas de guía con `demos: true` en GUIDE (hoy «Utilidades»): igual, desde su propio README.
// Ejemplos vivos: bloques ```vue demo de los README (convención en site/README.md) o, si el
// README no tiene ninguno, la demo de respaldo site/demos/<Componente>.vue.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import * as lib from './lib.mjs'
import { LOCALES, UI, t } from '../.vitepress/i18n.mjs'

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const REPO_URL = 'https://github.com/kevinedgm/grana'
export const COMPONENTS_DIR = 'packages/vue/src/components'
export const BLOCKS_DIR = 'packages/blocks/src/blocks'
export const BLOCKS_README = 'packages/blocks/README.md'
/** Familias de @grana/blocks: `section` es el comienzo del `##` del README del paquete que las describe. */
export const BLOCK_FAMILIES = [
  { id: 'marketing', section: 'Marketing' },
  { id: 'booking', section: 'Booking' },
  { id: 'ecommerce', section: 'Ecommerce' }
]

/**
 * Plan de las páginas de guía. `sections` son los `##` del README raíz (por el comienzo del
 * título en español); en inglés se toman las secciones en la misma posición de README.en.md.
 */
export const GUIDE = [
  { id: 'index', file: 'README.md', sections: ['Qué es Grana'], home: true },
  { id: 'getting-started', file: 'README.md', sections: ['Estado', 'Instalación'] },
  { id: 'theming', file: 'README.md', sections: ['Tematización'] },
  { id: 'cli', file: 'packages/cli/README.md', whole: true },
  // Utilidades (clases `g-*`): sin componente ni meta.json; la página sale de su README y admite ejemplos vivos.
  { id: 'utilities', file: 'packages/vue/src/styles/README-utilities.md', whole: true, demos: true },
  { id: 'accessibility', file: 'README.md', sections: ['Accesibilidad', 'Navegadores y SSR'] },
  { id: 'personality', file: 'README.md', sections: ['Personalidad'] },
  { id: 'components/', file: 'README.md', sections: ['Componentes'], index: true },
  { id: 'project', file: 'README.md', sections: ['Probarlo en este repositorio', 'Estructura', 'Contribuir', 'Licencia'] },
  { id: 'changelog', file: 'CHANGELOG.md', whole: true }
]

/**
 * Páginas de herramienta: no salen de un README, son un componente del tema del sitio
 * (site/.vitepress/theme/) registrado de forma global. Ancho completo (`layout: page`).
 */
export const TOOLS = [{ id: 'playground', component: 'GranaThemePlayground' }]

/**
 * Marco del sitio (design/contracts/sitio-marco.md §3): grupos del índice fuera de los componentes,
 * con el icono de cada página (nombres de Lucide que registra site/.vitepress/theme/icons.js).
 */
export const NAV_SECTIONS = {
  start: ['getting-started', 'theming', 'utilities', 'accessibility', 'personality'],
  tools: ['cli', 'playground'],
  project: ['changelog', 'project']
}
export const NAV_ICONS = {
  'getting-started': 'flag', theming: 'diamond', utilities: 'list', accessibility: 'users', personality: 'activity',
  cli: 'settings', playground: 'target', changelog: 'refresh-cw', project: 'folder', 'blocks/': 'blocks', github: 'external-link'
}

/* ------------------------------------------------------------------ números estables (#1037) */

/** Registro de números estables: site/scripts/numeros.json, `{ "GCombobox": 24, … }`. Un número asignado no cambia. */
export const NUMBERS_FILE = 'site/scripts/numeros.json'

/** Lee el registro y comprueba que ningún número se repite. */
export function loadNumbers(root) {
  const numbers = JSON.parse(read(root, NUMBERS_FILE))
  const seen = new Map()
  for (const [name, n] of Object.entries(numbers)) {
    if (!Number.isInteger(n) || n < 1) throw new Error(`${NUMBERS_FILE}: «${name}» no tiene un número entero positivo (${n})`)
    if (seen.has(n)) throw new Error(`${NUMBERS_FILE}: el número ${n} se repite (${seen.get(n)} y ${name})`)
    seen.set(n, name)
  }
  return numbers
}

/** Falla si un componente con página no tiene número (el siguiente libre se asigna a mano en el registro). */
export function checkNumbers(numbers, names) {
  const missing = names.filter((n) => !(n in numbers))
  if (missing.length) {
    const next = Math.max(0, ...Object.values(numbers)) + 1
    throw new Error(`${NUMBERS_FILE}: sin número para ${missing.join(', ')}. Asigna el siguiente libre (${next}…) y colócalo al final de su grupo; un número no se reutiliza`)
  }
}

/** El número se pinta con dos cifras (tres desde 100). */
export const formatCode = (n) => String(n).padStart(2, '0')

const read = (root, rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const exists = (root, rel) => fs.existsSync(path.join(root, rel))
const enFile = (rel) => rel.replace(/\.md$/, '.en.md')
const logical = (rel) => rel.replace(/\.en\.md$/, '.md')

/** Ruta de página (sin locale) → URL del sitio en el locale. */
function pageUrl(locale, id) {
  const prefix = LOCALES[locale].prefix
  if (id === 'index') return '/' + prefix
  return '/' + prefix + id
}
function pageFile(locale, id) {
  const prefix = LOCALES[locale].prefix
  const rel = id === 'index' ? 'index.md' : id.endsWith('/') ? id + 'index.md' : id + '.md'
  return prefix + rel
}

/* ------------------------------------------------------------------ descubrimiento */

/** Carpetas sin README cuya página es la de otro componente sin prefijo común. */
const HOSTED_IN = { GPartyField: 'GBookingBar' }

/** Componentes con README: [{ dir, name, slug, readme, metas: [meta] }]. */
export function discoverComponents(root) {
  const base = path.join(root, COMPONENTS_DIR)
  const dirs = fs
    .readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
  const metasOf = (dir) =>
    fs
      .readdirSync(path.join(base, dir))
      .filter((f) => f.endsWith('.meta.json'))
      .sort((a, b) => (a === `${dir}.meta.json` ? -1 : b === `${dir}.meta.json` ? 1 : a.localeCompare(b)))
      .map((f) => {
        const meta = JSON.parse(fs.readFileSync(path.join(base, dir, f), 'utf8'))
        // Ruta real del archivo (no enumerable: no viaja a las tablas ni a .site-data.json). Un meta.json
        // puede llamarse distinto de su carpeta (GToast/GToast.meta.json declara GToaster).
        Object.defineProperty(meta, '__file', { value: `${dir}/${f}`, enumerable: false })
        return meta
      })
  const withReadme = dirs.filter((d) => fs.existsSync(path.join(base, d, 'README.md')))
  const components = withReadme.map((dir) => ({
    dir,
    name: dir,
    slug: lib.componentSlug(dir),
    readme: `${COMPONENTS_DIR}/${dir}/README.md`,
    metas: metasOf(dir)
  }))
  // Carpetas con meta.json pero sin README (p. ej. GTagGroup): van a la página cuyo nombre es
  // su prefijo más largo (GTag). Si no hay ninguno, se informa.
  const orphans = []
  for (const dir of dirs.filter((d) => !withReadme.includes(d))) {
    const metas = metasOf(dir)
    if (!metas.length) continue
    // Piezas documentadas en la página de otro componente que no comparten prefijo (GPartyField en GBookingBar).
    const host = components
      .filter((c) => dir.startsWith(c.dir) || HOSTED_IN[dir] === c.dir)
      .sort((a, b) => b.dir.length - a.dir.length)[0]
    if (host) host.metas.push(...metas)
    else orphans.push(dir)
  }
  return { components, orphans }
}

/** Secciones de @grana/blocks con README y meta.json: [{ dir, name, slug, family, readme, meta }]. */
export function discoverBlocks(root) {
  const base = path.join(root, BLOCKS_DIR)
  if (!fs.existsSync(base)) return []
  const out = []
  for (const d of fs.readdirSync(base, { withFileTypes: true }).filter((d) => d.isDirectory() && /^Gb[A-Z]/.test(d.name)).sort((a, b) => a.name.localeCompare(b.name))) {
    const metaFile = path.join(base, d.name, `${d.name}.meta.json`)
    if (!fs.existsSync(path.join(base, d.name, 'README.md')) || !fs.existsSync(metaFile)) continue
    const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'))
    out.push({ dir: d.name, name: d.name, slug: lib.componentSlug('G' + d.name.slice(2)), family: meta.family, readme: `${BLOCKS_DIR}/${d.name}/README.md`, meta })
  }
  return out
}

/** Orden de las secciones de una familia: el de los enlaces de la tabla de su `##` en el README del paquete. */
export function blockOrder(sectionText) {
  const names = []
  for (const href of lib.listLinks(sectionText)) {
    const m = href.match(/blocks\/(Gb[A-Za-z]+)\/README\.md$/)
    if (m && !names.includes(m[1])) names.push(m[1])
  }
  return names
}

/** Índice de componentes por categoría desde «## Componentes» del README raíz. */
export function componentIndex(readme) {
  const { sections } = lib.splitSections(readme, 2)
  const sec = sections.find((s) => s.title.startsWith('Componentes'))
  if (!sec) return []
  const cats = lib.splitSections(sec.text, 3).sections
  return cats.map((c) => {
    const names = []
    for (const href of lib.listLinks(c.text)) {
      const m = href.match(/components\/(G[A-Za-z]+)\/README\.md$/)
      if (m && !names.includes(m[1])) names.push(m[1])
    }
    return { title: c.title, components: names }
  })
}

/* ------------------------------------------------------------------ fuentes */

/** Texto de un documento en un locale: { rel, text, translated }. */
function source(root, rel, locale) {
  if (locale !== 'es' && exists(root, enFile(rel))) return { rel: enFile(rel), text: read(root, enFile(rel)), translated: true }
  return { rel, text: read(root, rel), translated: locale === 'es' }
}

/** Encabezados de un documento con su slug de GitHub (únicos en el documento), en orden. */
function ghHeadings(text) {
  const slug = lib.uniqueSlugger(lib.ghSlug)
  return lib.parseHeadings(text).map((h) => ({ ...h, gh: slug(h.text) }))
}

/* ------------------------------------------------------------------ plan de páginas */

function buildPlan(root, locale) {
  const L = UI[locale].component
  const pages = []
  const warnings = []

  // --- guía (README raíz, CLI, CHANGELOG)
  const esReadme = read(root, 'README.md')
  const esSplit = lib.splitSections(esReadme, 2)
  for (const g of GUIDE) {
    const src = source(root, g.file, locale)
    const page = { id: g.id, locale, url: pageUrl(locale, g.id), file: pageFile(locale, g.id), parts: [], translated: src.translated, home: !!g.home }
    if (g.whole) {
      const { title, body } = lib.stripH1(src.text)
      page.title = g.id === 'cli' ? title : t(locale, `pages.${g.id}`)
      // Sin `# título` en el cuerpo: el h1 lo pinta GPageHeader desde `title` (sitio-marco.md §6.1).
      if (g.demos) {
        // Páginas de guía con ejemplos vivos: bloques `vue demo` del README, como en un componente.
        page.demoSlug = g.id
        for (const seg of lib.extractDemos(body)) {
          if (seg.type === 'md') page.parts.push({ kind: 'src', doc: logical(src.rel), rel: src.rel, text: seg.text, headingOffset: 1 })
          else page.parts.push({ kind: 'demo', code: seg.code })
        }
      } else page.parts.push({ kind: 'src', doc: logical(src.rel), rel: src.rel, text: body, headingOffset: 1 })
    } else {
      const split = src.rel === 'README.md' ? esSplit : lib.splitSections(src.text, 2)
      const idx = g.sections.map((name) => {
        const i = esSplit.sections.findIndex((s) => s.title.startsWith(name))
        if (i === -1) throw new Error(`README.md: no existe la sección «${name}» (página ${g.id})`)
        return i
      })
      page.title = g.home ? UI[locale].siteTitle : t(locale, `pages.${g.id}`)
      // Una sola sección: su `##` pasa a ser el título de la página (y todo sube un nivel).
      const promote = !g.home && idx.length === 1
      const allHeadings = lib.parseHeadings(src.text)
      // Preámbulo del README (párrafos de presentación) al principio del inicio.
      if (g.home) {
        const pre = lib.stripH1(split.preamble).body
        const lines = pre.split('\n').filter((l) => !/^\s*>/.test(l) && !/^\s*- \*\*/.test(l))
        page.features = featuresFrom(pre)
        page.parts.push({ kind: 'src', doc: 'README.md', rel: src.rel, text: lines.join('\n').trim() + '\n', headingOffset: 1 })
      }
      for (const i of idx) {
        const sec = split.sections[i]
        if (!sec) {
          warnings.push(`${src.rel}: falta la sección ${i + 1} (se espera la misma estructura que README.md)`)
          continue
        }
        // posición del encabezado de la sección dentro del documento (para los slugs de GitHub)
        const offset = allHeadings.findIndex((h) => h.level === 2 && h.text === sec.title)
        // Una sección promovida pierde su `#` (pasa a `title`, el h1 de GPageHeader): el resto empieza un encabezado después.
        if (promote) page.parts.push({ kind: 'src', doc: 'README.md', rel: src.rel, text: lib.stripH1(lib.promoteHeadings(sec.text)).body, headingOffset: offset + 1, titleOffset: offset })
        else page.parts.push({ kind: 'src', doc: 'README.md', rel: src.rel, text: sec.text, headingOffset: offset })
      }
    }
    pages.push(page)
  }

  // --- herramientas (componente del tema del sitio, sin README)
  for (const tool of TOOLS) {
    pages.push({
      id: tool.id, locale, url: pageUrl(locale, tool.id), file: pageFile(locale, tool.id), translated: true, parts: [],
      title: t(locale, `pages.${tool.id}`), description: t(locale, `tools.${tool.id}`), tool: tool.component
    })
  }

  // --- componentes
  const { components, orphans } = discoverComponents(root)
  for (const o of orphans) warnings.push(`${o}: tiene meta.json pero ninguna página lo recoge`)
  for (const c of components) {
    const src = source(root, c.readme, locale)
    const { title, body } = lib.stripH1(src.text)
    const main = c.metas[0]
    const metas = c.metas
    const page = {
      id: `components/${c.slug}`,
      locale,
      url: pageUrl(locale, `components/${c.slug}`),
      file: pageFile(locale, `components/${c.slug}`),
      title: title || c.name,
      component: c,
      translated: src.translated,
      description: main?.description,
      parts: []
    }
    const entry = main ? lib.entryOf(main) : '@grana/vue'
    const names = metas.map((m) => m.name).join(', ')
    // La cabecera (título, estado e importación) la pinta GPageHeader desde el frontmatter (sitio-marco.md §6.1):
    // el cuerpo no lleva `# Nombre` (un segundo h1). Las etiquetas y la entrada siguen en la tabla de la API.
    page.entry = { status: main?.status ?? null, import: `import { ${names} } from '${entry}'`, tags: metas.map((m) => m.tag) }
    // Ficha interactiva (contrato de mora-docs §3, bloques 4 a 6) si existe site/live/<Componente>.js.
    const liveRel = `site/live/${c.dir}.js`
    if (main && exists(root, liveRel)) {
      page.live = { spec: `@site-live/${c.dir}.js`, meta: `@grana-components/${main.__file ?? metaPath(root, c, main).replace(`${COMPONENTS_DIR}/`, '')}` }
      page.parts.push({ kind: 'gen', text: `## ${L.playground}\n\n<p class="grana-api-note">${L.playgroundNote}</p>\n\n<ClientOnly><GranaLive :meta="liveMeta" :spec="liveSpec" /></ClientOnly>\n` })
    }
    // Ejemplo de respaldo si el README no marca ninguno.
    const segs = lib.extractDemos(body)
    const esSegs = locale === 'es' || src.translated ? segs : segs
    const hasDemo = esSegs.some((s) => s.type === 'demo')
    const hasLive = exists(root, `site/live/${c.dir}.js`)
    if (!hasDemo) {
      const demoRel = `site/demos/${c.dir}.vue`
      if (exists(root, demoRel)) {
        page.parts.push({ kind: 'gen', text: `## ${L.example}\n` })
        page.parts.push({ kind: 'demo', file: demoRel, code: read(root, demoRel), fallback: true })
      } else if (!hasLive) warnings.push(`${c.dir}: sin ejemplo vivo (ni bloque \`vue demo\` en el README, ni ${demoRel}, ni site/live/${c.dir}.js)`)
    }
    page.demoCount = esSegs.filter((s) => s.type === 'demo').length + (hasDemo ? 0 : exists(root, `site/demos/${c.dir}.vue`) ? 1 : 0)
    // La ficha interactiva cuenta como ejemplo vivo cuando no hay otro (GToast: un segundo gestor competiría con el suyo).
    page.demoSource = hasDemo ? 'readme' : exists(root, `site/demos/${c.dir}.vue`) ? 'fallback' : hasLive ? 'live' : null
    let n = 0
    for (const s of esSegs) {
      if (s.type === 'md') page.parts.push({ kind: 'src', doc: c.readme, rel: src.rel, text: s.text, headingOffset: null })
      else page.parts.push({ kind: 'demo', code: s.code, index: ++n })
    }
    // API desde los meta.json
    if (metas.length) {
      const metaFiles = c.metas.map((m) => `[\`${m.name}.meta.json\`](${REPO_URL}/blob/main/${metaPath(root, c, m)})`).join(', ')
      page.parts.push({
        kind: 'gen',
        text: `## ${L.api}\n\n<p class="grana-api-note">${L.apiNote} ${metaFiles
          .replace(/\[`([^`]+)`\]\(([^)]+)\)/g, '<a href="$2"><code>$1</code></a>')}</p>\n\n${lib.apiTables(metas, L)}\n`
      })
    }
    page.parts.push({ kind: 'gen', text: `<p class="grana-source">${L.source}: <a href="${REPO_URL}/blob/main/${src.rel}"><code>${src.rel}</code></a></p>\n` })
    pages.push(page)
  }

  // --- @grana/blocks: índice, una página por familia y una por sección
  const blocks = exists(root, BLOCKS_README) ? discoverBlocks(root) : []
  if (blocks.length) {
    const bs = source(root, BLOCKS_README, locale)
    const esB = lib.splitSections(read(root, BLOCKS_README), 2)
    const bSplit = bs.rel === BLOCKS_README ? esB : lib.splitSections(bs.text, 2)
    const bHeadings = lib.parseHeadings(bs.text)
    const BL = UI[locale].blocks
    const familyIdx = new Map()
    BLOCK_FAMILIES.forEach((f) => {
      const i = esB.sections.findIndex((x) => x.title.startsWith(f.section))
      if (i === -1) throw new Error(`${BLOCKS_README}: no existe la sección «${f.section}» (familia ${f.id})`)
      familyIdx.set(f.id, i)
    })
    const srcPart = (i, promote) => {
      const sec = bSplit.sections[i]
      if (!sec) {
        warnings.push(`${bs.rel}: falta la sección ${i + 1} (se espera la misma estructura que README.md)`)
        return null
      }
      const offset = bHeadings.findIndex((h) => h.level === 2 && h.text === sec.title)
      // Promovida: su `#` pasa al título de la página (GPageHeader), fuera del cuerpo.
      if (promote) return { kind: 'src', doc: BLOCKS_README, rel: bs.rel, text: lib.stripH1(lib.promoteHeadings(sec.text)).body, headingOffset: offset + 1, titleOffset: offset, title: sec.title }
      return { kind: 'src', doc: BLOCKS_README, rel: bs.rel, text: sec.text, headingOffset: offset, title: sec.title }
    }
    const byFamily = (id) => blocks.filter((b) => b.family === id)
    for (const b of blocks) if (!BLOCK_FAMILIES.some((f) => f.id === b.family)) warnings.push(`${b.dir}: familia «${b.family}» sin página (BLOCK_FAMILIES)`)

    // índice de blocks/
    {
      const id = 'blocks/'
      const page = { id, locale, url: pageUrl(locale, id), file: pageFile(locale, id), title: t(locale, 'pages.blocks/'), translated: bs.translated, blockIndex: true, parts: [] }
      const pre = lib.stripH1(bSplit.preamble).body
      page.parts.push({ kind: 'src', doc: BLOCKS_README, rel: bs.rel, text: pre.trim() + '\n', headingOffset: 1 })
      const rows = ['## ' + BL.sections, '', `| ${BL.section} | ${BL.family} | ${BL.variants} | ${BL.status} |`, '| --- | --- | --- | --- |']
      for (const f of BLOCK_FAMILIES) {
        for (const b of byFamily(f.id)) {
          rows.push(`| [\`${b.name}\`](${pageUrl(locale, `blocks/${f.id}/${b.slug}`)}) | [${BL[f.id]}](${pageUrl(locale, `blocks/${f.id}/`)}) | ${b.meta.variants.length} | \`${b.meta.status}\` |`)
        }
      }
      page.parts.push({ kind: 'gen', text: rows.join('\n') + '\n' })
      const family = new Set(familyIdx.values())
      esB.sections.forEach((sec, i) => {
        if (family.has(i)) return
        const part = srcPart(i, false)
        if (part) page.parts.push(part)
      })
      pages.push(page)
    }
    // una página por familia (su `##` del README del paquete, promovido a título)
    for (const f of BLOCK_FAMILIES) {
      const id = `blocks/${f.id}/`
      const part = srcPart(familyIdx.get(f.id), true)
      const page = { id, locale, url: pageUrl(locale, id), file: pageFile(locale, id), title: BL[f.id], translated: bs.translated, blockFamily: f.id, parts: part ? [part] : [] }
      pages.push(page)
    }
    // una página por sección
    const BC = UI[locale].component
    for (const b of blocks) {
      const src = source(root, b.readme, locale)
      const { body } = lib.stripH1(src.text)
      const meta = b.meta
      const id = `blocks/${b.family}/${b.slug}`
      const page = {
        id, locale, url: pageUrl(locale, id), file: pageFile(locale, id), title: b.name, block: b, translated: src.translated,
        description: meta.description, demoSlug: `gb-${b.family}-${b.slug}`, parts: []
      }
      const entry = meta.bundle?.entry || `@grana/blocks/${b.family}`
      // Cabecera desde el frontmatter (GPageHeader), como en los componentes.
      page.entry = { status: meta.status, import: `import { ${meta.variants.map((v) => v.name).join(', ')} } from '${entry}'`, tags: meta.variants.map((v) => v.tag) }
      page.group = BL[b.family]
      const segs = lib.extractDemos(body)
      const hasDemo = segs.some((x) => x.type === 'demo')
      const demoRel = `site/demos/${b.dir}.vue`
      if (!hasDemo) {
        if (exists(root, demoRel)) {
          page.parts.push({ kind: 'gen', text: `## ${BC.example}\n` })
          page.parts.push({ kind: 'demo', file: demoRel, code: read(root, demoRel), fallback: true })
        } else warnings.push(`${b.dir}: sin ejemplo vivo (ni bloque \`vue demo\` en el README ni ${demoRel})`)
      }
      page.demoCount = segs.filter((x) => x.type === 'demo').length + (hasDemo ? 0 : exists(root, demoRel) ? 1 : 0)
      page.demoSource = hasDemo ? 'readme' : exists(root, demoRel) ? 'fallback' : null
      let n = 0
      for (const x of segs) {
        if (x.type === 'md') page.parts.push({ kind: 'src', doc: b.readme, rel: src.rel, text: x.text, headingOffset: null })
        else page.parts.push({ kind: 'demo', code: x.code, index: ++n })
      }
      // API desde el meta.json: variantes y la interfaz única de props, eventos y slots
      const vrows = [`| ${BC.variant} | ${BC.tag} | ${BC.concept} |`, '| --- | --- | --- |']
      for (const v of meta.variants) vrows.push(`| \`${v.name}\` | \`<${v.tag}>\` | ${lib.cell(v.concept)} |`)
      const apiMeta = {
        ...meta,
        props: (meta.props || []).map((p) => ({ ...p, type: p.ts ? '`' + p.ts + '`' : p.type, description: p.description || p.note })),
        events: (meta.events || []).map((e) => ({ ...e, payload: e.ts || e.payload })),
        slots: (meta.slots || []).map((sl) => ({ ...sl, scope: sl.ts || sl.scope }))
      }
      const metaRel = `${BLOCKS_DIR}/${b.dir}/${b.dir}.meta.json`
      page.parts.push({
        kind: 'gen',
        text: `## ${BC.api}\n\n<p class="grana-api-note">${BC.apiNote} <a href="${REPO_URL}/blob/main/${metaRel}"><code>${b.dir}.meta.json</code></a></p>\n\n### ${BC.variants}\n\n${vrows.join('\n')}\n\n${lib.apiTables([apiMeta], BC)}\n`
      })
      const links = [`${BC.contract}: <a href="${REPO_URL}/blob/main/${meta.contract}"><code>${meta.contract}</code></a>`]
      const audit = `design/lab/blocks/${b.family}/auditoria.md`
      if (exists(root, audit)) links.push(`${BC.audit}: <a href="${REPO_URL}/blob/main/${audit}"><code>${audit}</code></a>`)
      links.push(`${BC.source}: <a href="${REPO_URL}/blob/main/${src.rel}"><code>${src.rel}</code></a>`)
      page.parts.push({ kind: 'gen', text: `<p class="grana-source">${links.join(' · ')}</p>\n` })
      pages.push(page)
    }
  }
  // las partes `src` de un README de componente: el desplazamiento de encabezados es 1 (H1 fuera)
  // más los encabezados de los segmentos anteriores (los bloques de ejemplo no tienen).
  for (const p of pages.filter((p) => p.component || p.demoSlug)) {  // también las secciones de blocks (demoSlug)
    let offset = 1
    for (const part of p.parts) {
      if (part.kind !== 'src') continue
      part.headingOffset = offset
      offset += lib.parseHeadings(part.text).length
    }
  }
  return { pages, warnings, components, blocks }
}

function metaPath(root, c, m) {
  const own = `${COMPONENTS_DIR}/${c.dir}/${m.name}.meta.json`
  if (exists(root, own)) return own
  return `${COMPONENTS_DIR}/${m.name}/${m.name}.meta.json`
}

/** Las viñetas `- **Título.** texto` del preámbulo del README → features del inicio. */
function featuresFrom(preamble) {
  const out = []
  for (const line of preamble.split('\n')) {
    const m = line.match(/^\s*- \*\*(.+?)\*\*\s*(.*)$/)
    if (!m) continue
    const title = m[1].replace(/\.$/, '')
    const details = m[2].replace(/^[,.:;]\s*/, '')
    out.push({ title: inlineHtml(title), details: inlineHtml(details.charAt(0).toUpperCase() + details.slice(1)) })
  }
  return out
}
function inlineHtml(md) {
  return md
    .split(/(`[^`]*`)/g)
    .map((p, i) =>
      i % 2
        ? `<code>${p.slice(1, -1).replace(/</g, '&lt;')}</code>`
        : p
            .replace(/</g, '&lt;')
            .replace(/\s*\(ver \[[^\]]*\]\([^)]*\)\)/g, '')
            .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    )
    .join('')
}

/* ------------------------------------------------------------------ anclas y enlaces */

/**
 * Mapa de anclas: para cada documento lógico y slug de GitHub, la página y el slug de VitePress
 * finales. Recorre las páginas en su orden final (los slugs de VitePress son únicos por página).
 */
function anchorMap(plan, root) {
  const map = new Map() // `${doc}#${gh}` → { url, slug }
  const docMain = new Map() // doc → url de su página principal
  const ghCache = new Map()
  const ghOf = (rel) => {
    if (!ghCache.has(rel)) ghCache.set(rel, ghHeadings(read(root, rel)))
    return ghCache.get(rel)
  }
  for (const page of plan.pages) {
    const slug = lib.uniqueSlugger(lib.vpSlug)
    for (const part of page.parts) {
      if (part.kind === 'demo') continue
      const hs = lib.parseHeadings(part.text)
      if (part.kind === 'gen') {
        hs.forEach((h) => slug(h.text))
        continue
      }
      if (!docMain.has(part.doc) || page.home) docMain.set(part.doc, page.url)
      const docHs = ghOf(part.rel)
      // El encabezado que pasó a título de la página (GPageHeader) lleva a la página, sin ancla.
      if (part.titleOffset != null) {
        const gh = docHs[part.titleOffset]?.gh
        if (gh && !map.has(`${part.doc}#${gh}`)) map.set(`${part.doc}#${gh}`, { url: page.url, slug: null })
      }
      hs.forEach((h, i) => {
        const vp = slug(h.text)
        const gh = docHs[part.headingOffset + i]?.gh
        if (gh && !map.has(`${part.doc}#${gh}`)) map.set(`${part.doc}#${gh}`, { url: page.url, slug: vp })
      })
    }
  }
  return { map, docMain }
}

/** Resolutor de enlaces de una parte `src` de una página. */
function linkResolver({ root, page, part, anchors, warnings, other }) {
  return (href) => {
    if (lib.isExternal(href) || href.startsWith('mailto:')) return null
    const { file, hash } = lib.splitHref(href)
    let doc = part.doc
    let target = part.rel
    if (file) {
      target = lib.repoPath(part.rel, decodeURI(file))
      doc = logical(target)
    }
    const decoded = hash ? decodeURIComponent(hash) : ''
    // ¿documento con página en el sitio?
    const known = anchors.docMain.get(doc)
    if (known) {
      if (decoded) {
        const hit = anchors.map.get(`${doc}#${decoded}`)
        if (hit && hit.slug == null) return hit.url
        if (hit) return hit.url === page.url ? `#${hit.slug}` : `${hit.url}#${hit.slug}`
        warnings.push(`${part.rel}: ancla #${decoded} no encontrada en ${doc}`)
        return known === page.url ? `#${decoded}` : known
      }
      return known
    }
    if (!file) return null
    // fichero del repositorio sin página: a GitHub
    const abs = path.join(root, target)
    if (!fs.existsSync(abs)) {
      warnings.push(`${part.rel}: enlace a ${target}, que no existe`)
      other.push(target)
      return `${REPO_URL}/blob/main/${target}${hash ? '#' + hash : ''}`
    }
    const kind = fs.statSync(abs).isDirectory() ? 'tree' : 'blob'
    return `${REPO_URL}/${kind}/main/${target.replace(/\/$/, '')}${hash ? '#' + hash : ''}`
  }
}

/* ------------------------------------------------------------------ escritura */

const yaml = (v) => JSON.stringify(v)

function renderPage(page, ctx) {
  const { locale } = page
  const L = UI[locale].component
  const imports = []
  const body = []
  let demoN = 0
  for (const part of page.parts) {
    if (part.kind === 'gen') body.push(part.text)
    else if (part.kind === 'src') {
      const resolve = linkResolver({ ...ctx, page, part })
      const text = lib.rewriteLinks(part.text, resolve)
      const lang = part.rel.endsWith('.en.md') ? '' : locale === 'es' ? '' : ' lang="es"'
      // v-pre: el texto de los README no se compila como plantilla de Vue ({{ }}, etiquetas).
      body.push(`<div v-pre${lang}>\n\n${text.trim()}\n\n</div>\n`)
    } else if (part.kind === 'demo') {
      demoN++
      const name = `GranaExample${demoN}`
      let spec
      if (part.fallback) spec = `@site-demos/${path.basename(part.file)}`
      else {
        const file = `${page.component?.slug ?? page.demoSlug}-${demoN}.vue`
        ctx.demoFiles.set(file, lib.demoToSfc(part.code))
        spec = `@gen-demos/${file}`
      }
      imports.push(`import ${name} from '${spec}'`)
      const fence = part.code.includes('```') ? '````' : '```'
      body.push(`<GranaDemo :label="${yaml(L.live).replace(/"/g, "'")}"><${name} /></GranaDemo>\n\n${fence}vue\n${part.code.trim()}\n${fence}\n`)
    }
  }
  const fm = ['---', `title: ${yaml(page.title)}`]
  if (page.description) fm.push(`description: ${yaml(page.description)}`)
  // Datos del marco (sitio-marco.md §6.1): la cabecera (GPageHeader) y las páginas vecinas salen de aquí.
  if (page.entry) fm.push(`component: ${yaml({ ...(page.code ? { code: page.code } : {}), group: page.group ?? null, status: page.entry.status, import: page.entry.import })}`)
  if (page.prev) fm.push(`prev: ${yaml(page.prev)}`)
  if (page.next) fm.push(`next: ${yaml(page.next)}`)
  if (page.tool) {
    fm.push('layout: page', '---', '')
    return `${fm.join('\n')}\n<${page.tool} />\n`
  }
  if (page.home) {
    const H = UI[locale].hero
    // La portada la compone el Layout con Blocks (GbHero, GbFeatures); los textos de las ventajas, sin HTML.
    const plain = (html) => html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<')
    fm.push('layout: home', `hero: ${yaml({ name: 'Grana', text: H.text, tagline: H.tagline, actions: [
      { theme: 'brand', text: H.start, link: pageUrl(locale, 'getting-started') },
      { theme: 'alt', text: H.components, link: pageUrl(locale, 'components/') }
    ] })}`)
    if (page.features?.length && page.translated) fm.push(`features: ${yaml(page.features.map((f) => ({ title: plain(f.title), details: plain(f.details) })))}`)
  }
  fm.push('---', '')
  const out = [fm.join('\n')]
  if (page.live) imports.push(`import liveSpec from '${page.live.spec}'`, `import liveMeta from '${page.live.meta}'`)
  if (imports.length) out.push(`<script setup>\n${imports.join('\n')}\n</script>\n`)
  if (!page.translated) {
    const P = UI[locale].pending
    out.push(`::: warning ${P.title}\n${P.body}\n:::\n`)
  }
  if (page.home) out.push('<div class="grana-home">\n')
  out.push(body.join('\n'))
  if (page.home) out.push('\n</div>\n')
  return out.join('\n')
}

/** Slugs de VitePress de los encabezados de una página, en orden (los mismos `id` que tendrá el HTML). */
function pageSlugs(page) {
  const slug = lib.uniqueSlugger(lib.vpSlug)
  const out = []
  for (const part of page.parts) {
    if (part.kind === 'demo') continue
    for (const h of lib.parseHeadings(part.text)) out.push({ level: h.level, text: h.text, slug: slug(h.text) })
  }
  return out
}

/**
 * Índice del marco (GSidebar con filtro, sitio-marco.md §3): Empezar · grupos de componentes con su número
 * estable · Blocks (cada familia, un padre) · Herramientas · Proyecto. Devuelve también el orden lineal de los
 * destinos (páginas vecinas) y los componentes que no están en el índice del README.
 */
function navFor(locale, plan, index, numbers, root) {
  const other = locale === 'es' ? 'en' : 'es'
  const F = UI[locale].frame
  const byId = new Map(plan.pages.map((p) => [p.id, p]))
  const guideItem = (id) => {
    const p = byId.get(id)
    if (!p) return null
    const label = id === 'cli' ? '@grana/cli' : t(locale, `pages.${id}`)
    const keywords = [...new Set([id.replace(/\/$/, ''), id === 'cli' ? 'cli' : t(other, `pages.${id}`)])]
    return { id: p.url, label, href: p.url, icon: NAV_ICONS[id], keywords }
  }
  const groups = []
  const order = []
  const push = (group) => {
    if (!group.items.length) return
    groups.push(group)
    for (const it of group.items) {
      if (it.children) it.children.forEach((c) => c.href && order.push({ ...c, group: group.label }))
      else if (it.href && !it.external) order.push({ ...it, group: group.label })
    }
  }
  push({ id: 'g-start', label: F.start, items: NAV_SECTIONS.start.map(guideItem).filter(Boolean) })

  // Componentes, por las categorías del README (`###` de «Componentes»), con su ancla en components/.
  const comps = plan.pages.filter((p) => p.component)
  const byName = new Map(comps.map((p) => [p.component.dir, p]))
  const indexPage = byId.get('components/')
  // La página de índice promueve su sección («Componentes»): las categorías `###` quedan como `##`.
  const anchors = indexPage ? pageSlugs(indexPage).filter((h) => h.level === 2).map((h) => h.slug) : []
  const used = new Set()
  const compItem = (p, group) => {
    const n = p.component.dir
    p.code = formatCode(numbers[n])
    p.group = group
    return {
      id: p.url, label: n, href: p.url, code: formatCode(numbers[n]), status: p.entry?.status ?? null,
      keywords: [...new Set([p.component.slug, n.replace(/^G/, ''), p.component.slug.replace(/-/g, ' ')])]
    }
  }
  index.forEach((cat, ci) => {
    const items = []
    const label = UI[locale].categories[cat.title] || cat.title
    for (const n of cat.components) {
      const p = byName.get(n)
      if (!p || used.has(n)) continue
      used.add(n)
      items.push(compItem(p, label))
    }
    const anchor = indexPage && anchors[ci] ? `${indexPage.url}#${anchors[ci]}` : indexPage?.url
    push({ id: `g-cat-${ci + 1}`, label, anchor, items })
  })
  const rest = comps.filter((p) => !used.has(p.component.dir))
  push({ id: 'g-other', label: t(locale, 'groups.other'), items: rest.map((p) => compItem(p, t(locale, 'groups.other'))) })

  // Blocks: el resumen y cada familia como padre (su página y sus secciones, un nivel).
  const BL = UI[locale].blocks
  const blockIdx = byId.get('blocks/')
  if (blockIdx) {
    const esB = fs.existsSync(path.join(root, BLOCKS_README)) ? lib.splitSections(read(root, BLOCKS_README), 2) : { sections: [] }
    const items = [{ id: blockIdx.url, label: BL.overview, href: blockIdx.url, icon: NAV_ICONS['blocks/'], keywords: ['blocks', '@grana/blocks'] }]
    for (const f of BLOCK_FAMILIES) {
      const fam = byId.get(`blocks/${f.id}/`)
      if (!fam) continue
      const sec = esB.sections.find((x) => x.title.startsWith(f.section))
      const order = sec ? blockOrder(sec.text) : []
      const mine = plan.pages.filter((p) => p.block && p.block.family === f.id)
      const ordered = [...order.map((n) => mine.find((p) => p.block.dir === n)).filter(Boolean), ...mine.filter((p) => !order.includes(p.block.dir))]
      items.push({
        id: `family:${f.id}`, label: BL[f.id], icon: 'folder', keywords: [f.id],
        children: [{ id: fam.url, label: F.familyOverview(BL[f.id]), href: fam.url }, ...ordered.map((p) => ({ id: p.url, label: p.block.name, href: p.url }))]
      })
    }
    push({ id: 'g-blocks', label: t(locale, 'pages.blocks/'), items })
  }
  push({ id: 'g-tools', label: F.tools, items: NAV_SECTIONS.tools.map(guideItem).filter(Boolean) })
  push({
    id: 'g-project', label: F.project,
    items: [...NAV_SECTIONS.project.map(guideItem).filter(Boolean), { id: 'github', label: 'GitHub', href: REPO_URL, icon: NAV_ICONS.github, external: true, keywords: ['repo', 'repositorio', 'repository'] }]
  })
  return { groups, order, unlisted: rest.map((p) => p.component.dir) }
}

/** Anterior y siguiente de cada página por el orden del índice; en las fichas, con el número delante. */
function linkNeighbours(plan, order) {
  const at = new Map(order.map((o, i) => [o.id, i]))
  const brief = (o) => (o ? { text: o.label, link: o.href, ...(o.code ? { code: o.code } : {}) } : undefined)
  for (const page of plan.pages) {
    const i = at.get(page.url)
    if (i == null) continue
    page.prev = brief(order[i - 1])
    page.next = brief(order[i + 1])
  }
}

/* ------------------------------------------------------------------ iconos (Lucide) */

/** CSS que sustituye los iconos de VitePress por los de lucide-static (la versión del proyecto). */
export function lucideCss(root) {
  const dir = path.join(root, 'node_modules/lucide-static/icons')
  const svg = (name, color) => {
    let s = fs.readFileSync(path.join(dir, `${name}.svg`), 'utf8')
    s = s.replace(/<!--[\s\S]*?-->/g, '').replace(/\s*class="[^"]*"/, '').replace(/\n\s*/g, ' ').trim()
    if (color) s = s.replace(/currentColor/g, color)
    return `url("data:image/svg+xml,${encodeURIComponent(s).replace(/'/g, '%27')}")`
  }
  // El marco ya no pinta los componentes del tema de VitePress (VPNav, VPSidebar…): de sus iconos quedan solo los
  // de los estilos de documento (copiar el código y la marca de enlace externo de .vp-doc).
  return [
    '/* Generado por site/scripts/generate.mjs desde lucide-static (ISC): los iconos de los estilos de documento de',
    '   VitePress se sustituyen por los de la versión de Lucide del proyecto (regla «solo Lucide»). */',
    `:is(.vp-external-link-icon, .vp-doc a[href*='://'], .vp-doc a[target='_blank'])::after { --icon: ${svg('arrow-up-right')}; }`,
    `:root { --vp-icon-copy: ${svg('copy', 'rgba(128,128,128,1)')}; --vp-icon-copied: ${svg('check', 'rgba(128,128,128,1)')}; }`
  ].join('\n') + '\n'
}

/* ------------------------------------------------------------------ principal */

/** Escribe solo lo que cambió y borra lo que ya no se genera (el servidor de desarrollo no parpadea). */
function writeTree(out, all) {
  const existing = []
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, e.name)
      if (e.isDirectory()) walk(abs)
      else existing.push(path.relative(out, abs).split(path.sep).join('/'))
    }
  }
  walk(out)
  for (const rel of existing) if (!all.has(rel)) fs.rmSync(path.join(out, rel))
  for (const [rel, text] of all) {
    const abs = path.join(out, rel)
    if (fs.existsSync(abs) && fs.readFileSync(abs, 'utf8') === text) continue
    fs.mkdirSync(path.dirname(abs), { recursive: true })
    fs.writeFileSync(abs, text)
  }
}

export function generate({ root = path.resolve(SITE, '..'), out = path.join(SITE, 'src'), write = true, numbers = null } = {}) {
  const warnings = []
  const result = { locales: {}, warnings }
  const esReadme = read(root, 'README.md')
  const index = componentIndex(esReadme)
  // Números estables (#1037): falla si un componente con página no tiene número o si uno se repite.
  const nums = numbers ?? loadNumbers(root)
  checkNumbers(nums, discoverComponents(root).components.map((c) => c.dir))
  const files = new Map()
  const demoFiles = new Map()
  for (const locale of Object.keys(LOCALES)) {
    const plan = buildPlan(root, locale)
    warnings.push(...plan.warnings.map((w) => `[${locale}] ${w}`))
    const nav = navFor(locale, plan, index, nums, root)
    linkNeighbours(plan, nav.order)
    const anchors = anchorMap(plan, root)
    const other = []
    const ctx = { root, anchors, warnings: [], other, demoFiles }
    for (const page of plan.pages) files.set(page.file, renderPage(page, ctx))
    warnings.push(...[...new Set(ctx.warnings)].map((w) => `[${locale}] ${w}`))
    result.locales[locale] = { pages: plan.pages, nav: nav.groups, order: nav.order, unlisted: nav.unlisted, components: plan.components, blocks: plan.blocks }
  }
  result.files = files
  result.demoFiles = demoFiles
  result.numbers = nums
  if (write) {
    const all = new Map([...files].map(([rel, text]) => [rel, text]))
    for (const [rel, text] of demoFiles) all.set(`.demos/${rel}`, text)
    const version = JSON.parse(read(root, 'packages/vue/package.json')).version
    const data = {
      version,
      // Índice del marco por idioma (GSidebar con filtro): grupos e items con id, label, href (sin base), code, keywords, icon.
      nav: Object.fromEntries(Object.entries(result.locales).map(([l, v]) => [l, v.nav])),
      components: result.locales.es.pages.filter((p) => p.component).map((p) => ({ name: p.component.dir, slug: p.component.slug, code: p.code, demo: p.demoSource })),
      blocks: result.locales.es.pages.filter((p) => p.block).map((p) => ({ name: p.block.dir, family: p.block.family, slug: p.block.slug, demo: p.demoSource }))
    }
    all.set('.site-data.json', JSON.stringify(data, null, 2) + '\n')
    all.set('.lucide.css', lucideCss(root))
    writeTree(out, all)
  }
  return result
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const t0 = performance.now()
  const r = generate()
  const comps = r.locales.es.pages.filter((p) => p.component)
  const withDemo = comps.filter((p) => p.demoSource)
  const blks = r.locales.es.pages.filter((p) => p.block)
  console.log(
    `sitio generado: ${r.files.size} páginas (${comps.length} componentes × ${Object.keys(LOCALES).length} idiomas), ` +
      `${withDemo.length}/${comps.length} con ejemplo vivo (${comps.filter((p) => p.demoSource === 'readme').length} desde el README), ` +
      `${Math.round(performance.now() - t0)} ms`
  )
  const bIdx = r.locales.es.pages.filter((p) => p.blockIndex || p.blockFamily)
  console.log(
    `blocks: ${blks.length} secciones + ${bIdx.length} índices (resumen y familias) × ${Object.keys(LOCALES).length} idiomas = ${(blks.length + bIdx.length) * Object.keys(LOCALES).length} páginas, ` +
      `${blks.filter((p) => p.demoSource).length}/${blks.length} con ejemplo vivo (${blks.filter((p) => p.demoSource === 'readme').length} desde el README)`
  )
  for (const w of r.warnings) console.warn('aviso:', w)
}
