// Funciones puras del marco calcado (design/contracts/sitio-marco.md §3, §4 y §6): ruta actual, barra superior, índice
// con `base`, ruta equivalente en el otro idioma, secciones de la página y opciones de la búsqueda. Sin `window` ni
// `location`: sirven igual en el servidor y se prueban con `node --test`.

export const EN_PREFIX = 'en/'
export const SEARCH_LIMIT = 20

/** Ruta de VitePress (`/grana/components/btn.html`) → ruta del sitio sin `base` (`/components/btn`). */
export function routeId(path, base = '/') {
  let p = decodeURI(String(path).split('#')[0].split('?')[0])
  if (base !== '/' && p.startsWith(base)) p = p.slice(base.length)
  p = p.replace(/^\/+/, '').replace(/\.html$/, '').replace(/(^|\/)index$/, '$1')
  return '/' + p
}

/** Ruta equivalente en el otro idioma (`to`: 'es' | 'en'): quitar o poner `en/` tras `base`. Sin `base`. */
export function twinPath(path, base = '/', to) {
  let p = String(path).split('#')[0].split('?')[0]
  if (base !== '/' && p.startsWith(base)) p = p.slice(base.length - 1)
  const rest = p.replace(/^\//, '')
  const en = rest === 'en' || rest.startsWith(EN_PREFIX)
  const target = to ?? (en ? 'es' : 'en')
  const bare = en ? rest.slice(rest === 'en' ? 2 : EN_PREFIX.length) : rest
  return '/' + (target === 'en' ? EN_PREFIX + bare : bare)
}

/**
 * Los seis enlaces de la barra del original (config.mjs de 1d11c448), con `activeMatch` contra la ruta sin `base`.
 * `t` son los textos `nav` del idioma; `prefix` es '' o 'en/'.
 */
export function navBarItems(t, prefix, withBase) {
  const p = '/' + prefix
  return [
    { id: 'guide', label: t.guide, href: withBase(p + 'getting-started.html'), activeMatch: `^${p}(getting-started|theming|cli|utilities|accessibility|personality|project)` },
    { id: 'components', label: t.components, href: withBase(p + 'components/'), activeMatch: `^${p}components/` },
    { id: 'blocks', label: t.blocks, href: withBase(p + 'blocks/'), activeMatch: `^${p}blocks/` },
    { id: 'playground', label: t.playground, href: withBase(p + 'playground.html'), activeMatch: `^${p}playground` },
    { id: 'changelog', label: t.changelog, href: withBase(p + 'changelog.html'), activeMatch: `^${p}changelog` },
    { id: 'github', label: t.github, href: 'https://github.com/kevinedgm/grana', external: true }
  ]
}

/** Índice con `href` resueltos por `withBase` (los externos, tal cual). */
export function withBaseItems(groups, withBase) {
  const fix = (it) => ({ ...it, href: it.href && !it.external ? withBase(it.href) : it.href })
  return groups.map((g) => ({ ...g, items: g.items.map(fix) }))
}

/** `page.headers` de VitePress (anidados o planos, niveles 2 y 3) → `items` de GPageIndex `{ id, label, level }`. */
export function pageSections(headers) {
  const out = []
  const walk = (list) => {
    for (const h of list || []) {
      if ((h.level === 2 || h.level === 3) && h.slug) out.push({ id: h.slug, label: h.title, level: h.level })
      if (h.children?.length) walk(h.children)
    }
  }
  walk(headers)
  return out
}

/**
 * Resultados de MiniSearch → opciones de GCombobox: `{ value: id, label: título de la sección, description: la ruta
 * de títulos («Página › Sección») }`. Como mucho SEARCH_LIMIT. El id ya trae `base` y el ancla.
 */
export function searchOptions(results, limit = SEARCH_LIMIT) {
  const out = []
  for (const r of results) {
    if (out.length >= limit) break
    const titles = (r.titles || []).filter(Boolean)
    out.push({ value: String(r.id), label: String(r.title || titles[titles.length - 1] || ''), description: titles.length ? titles.join(' › ') : undefined })
  }
  return out
}
