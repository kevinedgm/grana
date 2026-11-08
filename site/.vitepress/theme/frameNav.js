// Funciones puras del marco del sitio (design/contracts/sitio-marco.md §3 a §5): ruta actual, índice con `base`,
// miga con puertas y ruta equivalente en el otro idioma. Sin `window` ni `location`: sirven igual en el servidor.
// Los datos del índice salen de site/scripts/generate.mjs (`.site-data.json`, `nav[locale]`): ids y `href` sin `base`.

export const EN_PREFIX = 'en/'

/** Ruta de VitePress (`/grana/components/btn.html`) → id del índice (`/components/btn`). */
export function routeId(path, base = '/') {
  let p = decodeURI(path.split('#')[0].split('?')[0])
  if (base !== '/' && p.startsWith(base)) p = p.slice(base.length)
  p = p.replace(/^\/+/, '').replace(/\.html$/, '').replace(/(^|\/)index$/, '$1')
  return '/' + p
}

/** ¿Es la página inglesa? (las gemelas viven bajo `en/`). */
export const isEnglish = (id) => id === '/en' || id.startsWith('/' + EN_PREFIX)

/**
 * Ruta equivalente en el otro idioma (§4): quitar o poner `en/` tras `base`. El generador garantiza la gemela.
 * Devuelve la ruta sin `base` y con `.html` donde la tenía la actual.
 */
export function twinPath(path, base = '/', to) {
  let p = path.split('#')[0].split('?')[0]
  if (base !== '/' && p.startsWith(base)) p = p.slice(base.length - 1)
  const rest = p.replace(/^\//, '')
  const en = rest === 'en' || rest.startsWith(EN_PREFIX)
  const target = to ?? (en ? 'es' : 'en')
  const bare = en ? rest.slice(rest === 'en' ? 2 : EN_PREFIX.length) : rest
  return '/' + (target === 'en' ? EN_PREFIX + bare : bare)
}

/** Índice con `href` resueltos por `withBase` (los externos, tal cual). */
export function withBaseItems(groups, withBase) {
  const fix = (it) => {
    const out = { ...it }
    if (it.href && !it.external) out.href = withBase(it.href)
    if (it.children) out.children = it.children.map(fix)
    return out
  }
  return groups.map((g) => ({ ...g, items: g.items.map(fix) }))
}

/** Busca el destino del índice con ese id: `{ group, item, parent }` (parent si es un hijo) o `null`. */
export function findInNav(groups, id) {
  for (const group of groups) {
    for (const item of group.items) {
      if (item.id === id) return { group, item, parent: null }
      for (const child of item.children || []) if (child.id === id) return { group, item: child, parent: item }
    }
  }
  return null
}

/** Todas las etiquetas por ruta (para nombrar la página de un resultado de «En el texto»). */
export function labelsByPath(groups) {
  const map = new Map()
  for (const g of groups) for (const it of g.items) {
    if (it.href) map.set(it.id, it.label)
    for (const c of it.children || []) map.set(c.id, c.label)
  }
  return map
}

/**
 * Miga con puertas (§4, `breadcrumbs.md` §«Puertas»): `children` en el nivel i − 1 son los hermanos del nivel i.
 *  · Componente: Componentes (puertas: los grupos) › Grupo (puertas: sus componentes, con su número) › Componente.
 *  · Guía y herramientas: Grupo (puertas: sus páginas) › Página.
 *  · Blocks: Blocks (puertas: las familias) › Familia (puertas: sus secciones) › Sección.
 * `componentsHref` es la página de índice de componentes (con `base`). Hrefs ya con `base`.
 */
export function crumbsFor(groups, id, { componentsLabel, componentsHref, blocksLabel }) {
  const hit = findInNav(groups, id)
  if (!hit) return []
  const { group, item, parent } = hit
  const named = (it) => ({ label: it.code ? `${it.code} ${it.label}` : it.label, href: it.href })
  if (item.code) {
    const compGroups = groups.filter((g) => g.items.some((i) => i.code))
    return [
      { label: componentsLabel, href: componentsHref, children: compGroups.map((g) => ({ label: g.label, href: g.anchorHref })) },
      { label: group.label, href: group.anchorHref, children: group.items.map(named) },
      { label: item.label }
    ]
  }
  if (parent) {
    // Blocks: la familia es un padre; su primer hijo es su página.
    const families = group.items.filter((i) => i.children)
    const famHref = parent.children[0]?.href
    const crumbs = [
      { label: blocksLabel, href: group.items.find((i) => !i.children)?.href, children: families.map((f) => ({ label: f.label, href: f.children[0]?.href })) }
    ]
    if (item.href === famHref) crumbs.push({ label: parent.label })
    else crumbs.push({ label: parent.label, href: famHref, children: parent.children.slice(1).map(named) }, { label: item.label })
    return crumbs
  }
  const pages = group.items.filter((i) => i.href && !i.external)
  return [{ label: group.label, href: pages[0]?.href, children: pages.map(named) }, { label: item.label }]
}

/* ------------------------------------------------------------------ «En el texto» (sitio-marco.md §6.3) */

export const TEXT_MIN = 3
export const TEXT_MAX = 5
/** ¿La consulta pide «En el texto»? No numérica (los números son direcciones) y de 3 o más caracteres. */
export const wantsText = (q) => {
  const t = (q || '').trim()
  return t.length >= TEXT_MIN && !/^\d+$/.test(t)
}

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/**
 * Resultados de MiniSearch → items del índice: `{ id, label: 'Página · Sección', href, icon: 'file-text' }`.
 * `pageLabel(path)` da el nombre de la página por su ruta (el del índice); `visible` son las etiquetas que ya se ven.
 */
export function textItems(results, { pageLabel, visible = [], max = TEXT_MAX }) {
  const seen = new Set(visible.map(norm))
  const out = []
  for (const r of results) {
    const [path, anchor] = String(r.id).split('#')
    const page = pageLabel(path) || (r.titles && r.titles[0]) || ''
    const section = r.title || ''
    const label = page && section && norm(page) !== norm(section) ? `${page} · ${section}` : page || section
    if (!label || seen.has(norm(label)) || (!anchor && seen.has(norm(page)))) continue
    seen.add(norm(label))
    out.push({ id: `text:${r.id}`, label, href: r.id, icon: 'file-text' })
    if (out.length >= max) break
  }
  return out
}

