#!/usr/bin/env node
// Genera las páginas del sitio (site/src/, ignorado por git) desde una sola fuente de verdad:
//   - README.md raíz      → inicio, empezar, tematización, accesibilidad, personalidad, índice, proyecto
//   - packages/cli/README → @grana/cli          - CHANGELOG.md → cambios
//   - packages/vue/src/components/<G…>/README.md + *.meta.json → una página por componente
// Español es la fuente. Para inglés se usa `<archivo>.en.md` si existe; si no, la página en
// inglés muestra el español con el aviso «Translation pending».
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

/**
 * Plan de las páginas de guía. `sections` son los `##` del README raíz (por el comienzo del
 * título en español); en inglés se toman las secciones en la misma posición de README.en.md.
 */
export const GUIDE = [
  { id: 'index', file: 'README.md', sections: ['Qué es Grana'], home: true },
  { id: 'getting-started', file: 'README.md', sections: ['Estado', 'Instalación'] },
  { id: 'theming', file: 'README.md', sections: ['Tematización'] },
  { id: 'cli', file: 'packages/cli/README.md', whole: true },
  { id: 'accessibility', file: 'README.md', sections: ['Accesibilidad', 'Navegadores y SSR'] },
  { id: 'personality', file: 'README.md', sections: ['Personalidad'] },
  { id: 'components/', file: 'README.md', sections: ['Componentes'], index: true },
  { id: 'project', file: 'README.md', sections: ['Probarlo en este repositorio', 'Estructura', 'Contribuir', 'Licencia'] },
  { id: 'changelog', file: 'CHANGELOG.md', whole: true }
]

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
      .map((f) => JSON.parse(fs.readFileSync(path.join(base, dir, f), 'utf8')))
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
      page.parts.push({ kind: 'gen', text: `# ${page.title}\n` })
      page.parts.push({ kind: 'src', doc: logical(src.rel), rel: src.rel, text: body, headingOffset: 1 })
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
      if (!g.home && !promote) page.parts.push({ kind: 'gen', text: `# ${page.title}\n` })
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
        page.parts.push({ kind: 'src', doc: 'README.md', rel: src.rel, text: promote ? lib.promoteHeadings(sec.text) : sec.text, headingOffset: offset })
      }
    }
    pages.push(page)
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
    const tags = metas.map((m) => '`<' + m.tag + '>`').join(' ')
    const entry = main ? lib.entryOf(main) : '@grana/vue'
    const names = metas.map((m) => m.name).join(', ')
    const header = [
      `# ${page.title}`,
      '',
      `<p class="grana-meta"><span><strong>${L.tag}</strong> ${metas.map((m) => `<code>&lt;${m.tag}&gt;</code>`).join(' ')}</span>` +
        `<span><strong>${L.status}</strong> <code class="grana-status">${main?.status ?? '—'}</code></span>` +
        `<span><strong>${L.entry}</strong> <code>${entry}</code></span>` +
        (main?.since ? `<span><strong>${L.since}</strong> <code>${main.since}</code></span>` : '') +
        '</p>',
      '',
      '```js',
      `import { ${names} } from '${entry}'`,
      '```',
      ''
    ].join('\n')
    void tags
    page.parts.push({ kind: 'gen', text: header })
    // Ejemplo de respaldo si el README no marca ninguno.
    const segs = lib.extractDemos(body)
    const esSegs = locale === 'es' || src.translated ? segs : segs
    const hasDemo = esSegs.some((s) => s.type === 'demo')
    if (!hasDemo) {
      const demoRel = `site/demos/${c.dir}.vue`
      if (exists(root, demoRel)) {
        page.parts.push({ kind: 'gen', text: `## ${L.example}\n` })
        page.parts.push({ kind: 'demo', file: demoRel, code: read(root, demoRel), fallback: true })
      } else warnings.push(`${c.dir}: sin ejemplo vivo (ni bloque \`vue demo\` en el README ni ${demoRel})`)
    }
    page.demoCount = esSegs.filter((s) => s.type === 'demo').length + (hasDemo ? 0 : exists(root, `site/demos/${c.dir}.vue`) ? 1 : 0)
    page.demoSource = hasDemo ? 'readme' : exists(root, `site/demos/${c.dir}.vue`) ? 'fallback' : null
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
  // las partes `src` de un README de componente: el desplazamiento de encabezados es 1 (H1 fuera)
  // más los encabezados de los segmentos anteriores (los bloques de ejemplo no tienen).
  for (const p of pages.filter((p) => p.component)) {
    let offset = 1
    for (const part of p.parts) {
      if (part.kind !== 'src') continue
      part.headingOffset = offset
      offset += lib.parseHeadings(part.text).length
    }
  }
  return { pages, warnings, components }
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
        const file = `${page.component.slug}-${demoN}.vue`
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
  if (page.home) {
    const H = UI[locale].hero
    fm.push('layout: home', 'hero:', `  name: ${yaml('Grana')}`, `  text: ${yaml(H.text)}`, `  tagline: ${yaml(H.tagline)}`, '  actions:')
    fm.push('    - theme: brand', `      text: ${yaml(H.start)}`, `      link: ${yaml(pageUrl(locale, 'getting-started'))}`)
    fm.push('    - theme: alt', `      text: ${yaml(H.components)}`, `      link: ${yaml(pageUrl(locale, 'components/'))}`)
    if (page.features?.length && page.translated) {
      fm.push('features:')
      for (const f of page.features) fm.push(`  - title: ${yaml(f.title)}`, `    details: ${yaml(f.details)}`)
    }
  }
  fm.push('---', '')
  const out = [fm.join('\n')]
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

function sidebarFor(locale, plan, index) {
  const groups = [
    {
      text: t(locale, 'groups.guide'),
      items: GUIDE.filter((g) => !g.home && !g.index).map((g) => ({
        text: g.id === 'cli' ? '@grana/cli' : t(locale, `pages.${g.id}`),
        link: pageUrl(locale, g.id)
      }))
    }
  ]
  const comps = plan.pages.filter((p) => p.component)
  const byName = new Map(comps.map((p) => [p.component.dir, p]))
  const used = new Set()
  for (const cat of index) {
    const items = []
    for (const n of cat.components) {
      const p = byName.get(n)
      if (!p || used.has(n)) continue
      used.add(n)
      items.push({ text: n, link: p.url })
    }
    if (items.length) groups.push({ text: UI[locale].categories[cat.title] || cat.title, collapsed: false, items })
  }
  const rest = comps.filter((p) => !used.has(p.component.dir))
  if (rest.length) groups.push({ text: t(locale, 'groups.other'), collapsed: false, items: rest.map((p) => ({ text: p.component.dir, link: p.url })) })
  return { groups, unlisted: rest.map((p) => p.component.dir) }
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
  const vpIcons = fs
    .readFileSync(path.join(root, 'node_modules/vitepress/dist/client/theme-default/styles/icons.css'), 'utf8')
    .match(/\.vpi-[a-z0-9-]+/g)
  const alias = { 'more-horizontal': 'ellipsis' }
  const lines = [
    '/* Generado por site/scripts/generate.mjs desde lucide-static (ISC): los iconos del tema de',
    '   VitePress se sustituyen por los de la versión de Lucide del proyecto (regla «solo Lucide»). */'
  ]
  for (const cls of [...new Set(vpIcons)]) {
    const name = alias[cls.slice(5)] || cls.slice(5)
    if (!fs.existsSync(path.join(dir, `${name}.svg`))) throw new Error(`lucide-static no tiene ${name}.svg (para ${cls})`)
    lines.push(`${cls} { --icon: ${svg(name)}; }`)
  }
  lines.push(`.vp-doc a::after, .vp-external-link-icon::after { --icon: ${svg('arrow-up-right')}; }`)
  lines.push(`.DocSearch-Search-Icon { --icon: ${svg('search')}; }`)
  lines.push(`:root { --vp-icon-copy: ${svg('copy', 'rgba(128,128,128,1)')}; --vp-icon-copied: ${svg('check', 'rgba(128,128,128,1)')}; }`)
  lines.push(`.VPNavBarHamburger { --grana-hamburger: ${svg('menu')}; }`)
  lines.push(`.VPNavBarHamburger.active { --grana-hamburger: ${svg('x')}; }`)
  return lines.join('\n') + '\n'
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

export function generate({ root = path.resolve(SITE, '..'), out = path.join(SITE, 'src'), write = true } = {}) {
  const warnings = []
  const result = { locales: {}, warnings }
  const esReadme = read(root, 'README.md')
  const index = componentIndex(esReadme)
  const files = new Map()
  const demoFiles = new Map()
  for (const locale of Object.keys(LOCALES)) {
    const plan = buildPlan(root, locale)
    warnings.push(...plan.warnings.map((w) => `[${locale}] ${w}`))
    const anchors = anchorMap(plan, root)
    const other = []
    const ctx = { root, anchors, warnings: [], other, demoFiles }
    for (const page of plan.pages) files.set(page.file, renderPage(page, ctx))
    warnings.push(...[...new Set(ctx.warnings)].map((w) => `[${locale}] ${w}`))
    const sidebar = sidebarFor(locale, plan, index)
    result.locales[locale] = { pages: plan.pages, sidebar: sidebar.groups, unlisted: sidebar.unlisted, components: plan.components }
  }
  result.files = files
  result.demoFiles = demoFiles
  if (write) {
    const all = new Map([...files].map(([rel, text]) => [rel, text]))
    for (const [rel, text] of demoFiles) all.set(`.demos/${rel}`, text)
    const data = {
      sidebar: Object.fromEntries(Object.entries(result.locales).map(([l, v]) => [l, v.sidebar])),
      components: result.locales.es.pages.filter((p) => p.component).map((p) => ({ name: p.component.dir, slug: p.component.slug, demo: p.demoSource }))
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
  console.log(
    `sitio generado: ${r.files.size} páginas (${comps.length} componentes × ${Object.keys(LOCALES).length} idiomas), ` +
      `${withDemo.length}/${comps.length} con ejemplo vivo (${comps.filter((p) => p.demoSource === 'readme').length} desde el README), ` +
      `${Math.round(performance.now() - t0)} ms`
  )
  for (const w of r.warnings) console.warn('aviso:', w)
}
