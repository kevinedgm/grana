// Referencia del sitio anterior (VitePress 1.6.4 vestido con tokens de Grana, antes de 887c3779).
// Saca capturas y mide la geometría, la tipografía y el color de cada pieza del marco, y resuelve
// cada color al token --g-color-* del que viene. Uso (con el sitio anterior servido en 4237):
//   node design/lab/sitio/referencia/medir.mjs [--base=http://localhost:4237/grana/]
// Escribe capturas *.png y medidas.json en esta carpeta. Chromium.
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(path.resolve(here, '../../theme-playground/package.json'))
const { chromium } = require('playwright')

const BASE = (process.argv.find((a) => a.startsWith('--base=')) || '--base=http://localhost:4237/grana/').slice(7)
const PAGES = { portada: '', empezar: 'getting-started.html', combobox: 'components/combobox.html', blocks: 'blocks/' }
const WIDTHS = [1280, 1024, 768, 375, 320]
const THEMES = ['claro', 'oscuro']

// Piezas del marco que se miden (selectores del tema por defecto de VitePress 1.6.4).
const PIECES = {
  nav: '.VPNav',
  navBar: '.VPNavBar',
  navBarWrapper: '.VPNavBar .wrapper',
  navBarContainer: '.VPNavBar .container',
  navBarDivider: '.VPNavBar .divider-line',
  title: '.VPNavBarTitle .title',
  titleText: '.VPNavBarTitle .title span',
  logo: '.VPNavBarTitle .logo',
  search: '.VPNavBarSearch',
  searchButton: '.DocSearch-Button',
  searchPlaceholder: '.DocSearch-Button-Placeholder',
  searchKeys: '.DocSearch-Button-Keys',
  searchKey: '.DocSearch-Button-Key',
  menu: '.VPNavBarMenu',
  menuLink: '.VPNavBarMenuLink',
  menuLinkActive: '.VPNavBarMenuLink.active',
  translations: '.VPNavBarTranslations',
  translationsButton: '.VPNavBarTranslations .button',
  appearance: '.VPNavBarAppearance',
  switch: '.VPNavBarAppearance .VPSwitch',
  switchCheck: '.VPNavBarAppearance .VPSwitch .check',
  social: '.VPNavBarSocialLinks',
  extra: '.VPNavBarExtra',
  extraButton: '.VPNavBarExtra .button',
  hamburger: '.VPNavBarHamburger',
  localNav: '.VPLocalNav',
  localNavMenu: '.VPLocalNav .menu',
  localNavOutline: '.VPLocalNavOutlineDropdown button',
  sidebar: '.VPSidebar',
  sidebarNav: '.VPSidebar nav',
  sidebarGroup: '.VPSidebar .group',
  sidebarGroupTitle: '.VPSidebarItem.level-0 > .item .text',
  sidebarLink: '.VPSidebarItem.level-1 .link .text',
  sidebarLinkActive: '.VPSidebarItem.is-active > .item .link .text',
  sidebarActiveIndicator: '.VPSidebarItem.is-active > .item > .indicator',
  content: '.VPContent',
  doc: '.VPDoc',
  docContainer: '.VPDoc .container',
  docContent: '.VPDoc .content',
  docContentContainer: '.VPDoc .content-container',
  aside: '.VPDoc .aside',
  asideContainer: '.VPDoc .aside-container',
  outline: '.VPDocAsideOutline',
  outlineTitle: '.VPDocAsideOutline .outline-title',
  outlineMarker: '.VPDocAsideOutline .outline-marker',
  outlineLink: '.VPDocAsideOutline .outline-link',
  outlineLinkNested: '.VPDocAsideOutline .nested .outline-link',
  outlineLinkActive: '.VPDocAsideOutline .outline-link.active',
  outlineContent: '.VPDocAsideOutline .content',
  h1: '.vp-doc h1',
  h2: '.vp-doc h2',
  h3: '.vp-doc h3',
  p: '.vp-doc p',
  docFooter: '.VPDocFooter',
  pager: '.VPDocFooter .pager-link',
  pagerDesc: '.VPDocFooter .pager-link .desc',
  pagerTitle: '.VPDocFooter .pager-link .title',
  footer: '.VPFooter',
  footerMessage: '.VPFooter .message',
  skip: '.VPSkipLink',
  home: '.VPHome',
  heroName: '.VPHero .name',
  heroText: '.VPHero .text',
  heroTagline: '.VPHero .tagline',
  heroAction: '.VPHero .VPButton',
  feature: '.VPFeature'
}

const PROPS = ['display', 'position', 'top', 'zIndex', 'boxSizing', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'marginTop', 'marginBottom', 'gap', 'columnGap', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing',
  'color', 'backgroundColor', 'borderTopWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderRightWidth', 'borderTopColor',
  'borderBottomColor', 'borderLeftColor', 'borderRadius', 'boxShadow', 'opacity', 'transition', 'textDecorationLine',
  'maxWidth', 'whiteSpace', 'overflowY', 'backdropFilter']

function parse(c) {
  const m = /rgba?\(([^)]+)\)/.exec(c || '')
  if (!m) return null
  const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number)
  return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 }
}

async function tokens(page) {
  return page.evaluate(() => {
    const names = new Set()
    for (const s of document.styleSheets) {
      let rules
      try { rules = s.cssRules } catch { continue }
      const walk = (rs) => { for (const r of rs) { if (r.style) for (const n of r.style) if (n.startsWith('--g-color-')) names.add(n); if (r.cssRules) walk(r.cssRules) } }
      walk(rules)
    }
    const probe = document.createElement('i')
    document.body.append(probe)
    const out = {}
    for (const n of names) {
      probe.style.color = `var(${n})`
      const v = getComputedStyle(probe).color
      if (v && v !== 'rgba(0, 0, 0, 0)') out[n] = v
    }
    probe.remove()
    return out
  })
}

function tokenFor(color, map) {
  const c = parse(color)
  if (!c) return null
  if (c.a === 0) return 'transparent'
  const hits = []
  for (const [n, v] of Object.entries(map)) {
    const t = parse(v)
    if (t && Math.abs(t.r - c.r) <= 1 && Math.abs(t.g - c.g) <= 1 && Math.abs(t.b - c.b) <= 1 && Math.abs(t.a - c.a) < 0.02) hits.push(n)
  }
  // Preferir los nombres de rol (sin -raw ni escalas) primero.
  hits.sort((a, b) => a.length - b.length)
  return hits.length ? hits.slice(0, 4).join(' | ') : null
}

async function measure(page, map) {
  const raw = await page.evaluate(({ PIECES, PROPS }) => {
    const out = {}
    for (const [k, sel] of Object.entries(PIECES)) {
      const all = [...document.querySelectorAll(sel)]
      const el = all.find((e) => e.getClientRects().length) || null
      if (!el) continue
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      const st = {}
      for (const p of PROPS) st[p] = cs[p]
      out[k] = { count: all.length, visible: all.filter((e) => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden').length,
        box: { x: Math.round(r.x * 10) / 10, y: Math.round(r.y * 10) / 10, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10 },
        text: (el.textContent || '').trim().slice(0, 60), style: st }
    }
    out._doc = { scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, scrollPaddingTop: getComputedStyle(document.documentElement).scrollPaddingTop }
    return out
  }, { PIECES, PROPS })
  for (const v of Object.values(raw)) {
    if (!v.style) continue
    v.tokens = {}
    for (const p of ['color', 'backgroundColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor']) {
      const t = tokenFor(v.style[p], map)
      if (t) v.tokens[p] = t
    }
  }
  return raw
}

async function setTheme(page, theme) {
  await page.addInitScript((t) => { try { localStorage.setItem('vitepress-theme-appearance', t) } catch {} }, theme === 'oscuro' ? 'dark' : 'light')
}

const browser = await chromium.launch()
const result = { base: BASE, fecha: new Date().toISOString(), motor: 'chromium', paginas: {}, estados: {}, tokens: {}, teclado: {} }

for (const theme of THEMES) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  await setTheme(page, theme)
  for (const [pk, url] of Object.entries(PAGES)) {
    for (const w of WIDTHS) {
      await page.setViewportSize({ width: w, height: w < 768 ? 740 : 800 })
      await page.goto(BASE + url, { waitUntil: 'networkidle' })
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(150)
      if (!result.tokens[theme]) result.tokens[theme] = await tokens(page)
      const key = `${pk}-${w}-${theme}`
      result.paginas[key] = await measure(page, result.tokens[theme])
      await page.screenshot({ path: path.join(here, `${key}.png`) })
      if (pk === 'combobox' && (w === 1280 || w === 375)) {
        // Lectura: con una sección a mitad del documento, la marca del índice.
        await page.evaluate(() => { const h = [...document.querySelectorAll('.vp-doc h2')][3]; h && h.scrollIntoView() })
        await page.waitForTimeout(400)
        result.paginas[`${key}-lectura`] = await measure(page, result.tokens[theme])
        await page.screenshot({ path: path.join(here, `${key}-lectura.png`) })
      }
    }
  }

  // Estados en la ficha (1280 y 375)
  const S = (k, v) => { result.estados[`${k}-${theme}`] = v }
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto(BASE + PAGES.combobox, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  // hover en un enlace de la barra
  const links = page.locator('.VPNavBarMenuLink')
  await links.nth(2).hover()
  await page.waitForTimeout(300)
  S('hover-1280', await page.evaluate(() => { const a = document.querySelectorAll('.VPNavBarMenuLink')[2]; const cs = getComputedStyle(a); return { color: cs.color, bg: cs.backgroundColor, deco: cs.textDecorationLine, transition: cs.transition } }))
  result.estados[`hover-1280-${theme}`].colorToken = tokenFor(result.estados[`hover-1280-${theme}`].color, result.tokens[theme])
  await page.screenshot({ path: path.join(here, `estado-hover-1280-${theme}.png`), clip: { x: 0, y: 0, width: 1280, height: 120 } })
  // foco por teclado: recorrido de Tab desde el principio
  await page.mouse.move(640, 600)
  await page.evaluate(() => { document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0) })
  await page.keyboard.press('Tab')
  const order = []
  for (let i = 0; i < 16; i++) {
    order.push(await page.evaluate(() => { const e = document.activeElement; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { tag: e.tagName.toLowerCase(), cls: (e.className && e.className.baseVal === undefined ? e.className : '').toString().slice(0, 60), name: (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50), box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor} offset ${cs.outlineOffset}` } }))
    if (i === 4) await page.screenshot({ path: path.join(here, `estado-foco-1280-${theme}.png`), clip: { x: 0, y: 0, width: 1280, height: 120 } })
    await page.keyboard.press('Tab')
  }
  result.teclado[`tab-1280-${theme}`] = order
  // menú de idioma (hover abre el panel en VitePress)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.locator('.VPNavBarTranslations .button').hover()
  await page.waitForTimeout(400)
  S('idioma-1280', await page.evaluate(() => { const m = document.querySelector('.VPNavBarTranslations .menu'); if (!m) return null; const r = m.getBoundingClientRect(); const cs = getComputedStyle(m); const items = [...m.querySelectorAll('.VPMenuLink a, .title')].map((a) => ({ text: a.textContent.trim(), fs: getComputedStyle(a).fontSize, fw: getComputedStyle(a).fontWeight, color: getComputedStyle(a).color, h: Math.round(a.getBoundingClientRect().height) })); const flyout = m.querySelector('.VPMenu'); const fcs = flyout ? getComputedStyle(flyout) : cs; return { box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], opacity: cs.opacity, visibility: cs.visibility, radius: fcs.borderRadius, shadow: fcs.boxShadow, bg: fcs.backgroundColor, border: fcs.border, padding: fcs.padding, transition: cs.transition, items } }))
  await page.screenshot({ path: path.join(here, `estado-idioma-1280-${theme}.png`), clip: { x: 640, y: 0, width: 640, height: 260 } })
  await page.mouse.move(400, 500)
  // búsqueda abierta con Ctrl+K y con "/"
  await page.keyboard.press('/')
  await page.waitForTimeout(400)
  const slashOpens = await page.locator('.VPLocalSearchBox').count()
  if (!slashOpens) { await page.locator('.DocSearch-Button').click(); await page.waitForTimeout(400) }
  await page.keyboard.type('comb')
  await page.waitForTimeout(600)
  S('busqueda-1280', await page.evaluate(() => { const b = document.querySelector('.VPLocalSearchBox .shell'); if (!b) return null; const r = b.getBoundingClientRect(); const cs = getComputedStyle(b); const bd = getComputedStyle(document.querySelector('.VPLocalSearchBox .backdrop')); return { box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], radius: cs.borderRadius, bg: cs.backgroundColor, shadow: cs.boxShadow, padding: cs.padding, backdrop: bd.backgroundColor, results: document.querySelectorAll('.VPLocalSearchBox .result').length, focus: document.activeElement && document.activeElement.className } }))
  result.estados[`busqueda-1280-${theme}`].slashAbre = !!slashOpens
  await page.screenshot({ path: path.join(here, `estado-busqueda-1280-${theme}.png`) })
  await page.keyboard.press('Escape')
  await page.waitForTimeout(200)
  // móvil: menú abierto, idioma dentro y desplegable «En esta página»
  await page.setViewportSize({ width: 375, height: 740 })
  await page.goto(BASE + PAGES.combobox, { waitUntil: 'networkidle' })
  await page.locator('.VPNavBarHamburger').click()
  await page.waitForTimeout(500)
  S('menu-movil-375', await page.evaluate(() => { const s = document.querySelector('.VPNavScreen'); if (!s) return null; const r = s.getBoundingClientRect(); const cs = getComputedStyle(s); return { box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], bg: cs.backgroundColor, transition: cs.transition, links: [...s.querySelectorAll('.VPNavScreenMenuLink')].map((a) => ({ t: a.textContent.trim(), h: Math.round(a.getBoundingClientRect().height), fs: getComputedStyle(a).fontSize, fw: getComputedStyle(a).fontWeight, bb: getComputedStyle(a).borderBottom })), hamburgerExpanded: document.querySelector('.VPNavBarHamburger').getAttribute('aria-expanded'), bodyOverflow: getComputedStyle(document.body).overflow } }))
  await page.screenshot({ path: path.join(here, `estado-menu-movil-375-${theme}.png`) })
  await page.locator('.VPNavBarHamburger').click()
  await page.waitForTimeout(400)
  await page.locator('.VPLocalNavOutlineDropdown button').click()
  await page.waitForTimeout(400)
  S('en-esta-pagina-375', await page.evaluate(() => { const s = document.querySelector('.VPLocalNavOutlineDropdown .items'); if (!s) return null; const r = s.getBoundingClientRect(); const cs = getComputedStyle(s); const b = document.querySelector('.VPLocalNavOutlineDropdown button'); return { box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], bg: cs.backgroundColor, radius: cs.borderRadius, shadow: cs.boxShadow, border: cs.border, padding: cs.padding, button: b.textContent.trim().replace(/\s+/g, ' '), buttonExpanded: b.getAttribute('aria-expanded'), links: [...s.querySelectorAll('.outline-link')].slice(0, 6).map((a) => ({ t: a.textContent.trim(), fs: getComputedStyle(a).fontSize, color: getComputedStyle(a).color })) } }))
  await page.screenshot({ path: path.join(here, `estado-en-esta-pagina-375-${theme}.png`) })
  await page.keyboard.press('Escape')
  // menú del lateral (drawer) a 375
  await page.locator('.VPLocalNav .menu').click()
  await page.waitForTimeout(500)
  S('drawer-375', await page.evaluate(() => { const s = document.querySelector('.VPSidebar'); const r = s.getBoundingClientRect(); const cs = getComputedStyle(s); const bd = document.querySelector('.VPBackdrop'); return { box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], bg: cs.backgroundColor, transition: cs.transition, shadow: cs.boxShadow, backdrop: bd ? getComputedStyle(bd).backgroundColor : null } }))
  await page.screenshot({ path: path.join(here, `estado-drawer-375-${theme}.png`) })
  // 1024: el «…» que recoge idioma y apariencia
  await page.setViewportSize({ width: 1024, height: 800 })
  await page.goto(BASE + PAGES.combobox, { waitUntil: 'networkidle' })
  await page.locator('.VPNavBarExtra .button').click()
  await page.waitForTimeout(400)
  S('mas-1024', await page.evaluate(() => { const b = document.querySelector('.VPNavBarExtra .button'); const m = document.querySelector('.VPNavBarExtra .VPMenu'); if (!m) return null; const r = m.getBoundingClientRect(); return { button: { name: b.getAttribute('aria-label'), expanded: b.getAttribute('aria-expanded'), box: [Math.round(b.getBoundingClientRect().width), Math.round(b.getBoundingClientRect().height)] }, box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], text: m.innerText.replace(/\s+/g, ' ').trim() } }))
  await page.screenshot({ path: path.join(here, `estado-mas-1024-${theme}.png`), clip: { x: 512, y: 0, width: 512, height: 320 } })
  // barra al desplazar en 1280 (¿se oculta? ¿cambia el fondo?) y en 768
  for (const w of [1280, 768]) {
    await page.setViewportSize({ width: w, height: 800 })
    await page.goto(BASE + PAGES.combobox, { waitUntil: 'networkidle' })
    const before = await page.evaluate(() => { const n = document.querySelector('.VPNavBar'); const c = document.querySelector('.VPNavBar .content-body'); return { top: n.getBoundingClientRect().top, cls: n.className, bg: getComputedStyle(c).backgroundColor } })
    await page.mouse.wheel(0, 900)
    await page.waitForTimeout(500)
    const after = await page.evaluate(() => { const n = document.querySelector('.VPNavBar'); const c = document.querySelector('.VPNavBar .content-body'); const d = document.querySelector('.VPNavBar .divider-line'); return { top: n.getBoundingClientRect().top, cls: n.className, bg: getComputedStyle(c).backgroundColor, divider: d ? getComputedStyle(d).backgroundColor : null, y: scrollY } })
    S(`scroll-${w}`, { before, after })
  }
  await ctx.close()
}

await browser.close()
fs.writeFileSync(path.join(here, 'medidas.json'), JSON.stringify(result, null, 1))
console.log('ok', Object.keys(result.paginas).length, 'medidas,', Object.keys(result.estados).length, 'estados')
