#!/usr/bin/env node
// Compuerta de paridad del marco calcado (design/contracts/sitio-marco.md §12): el sitio CONSTRUIDO (docs:build +
// vitepress preview) medido contra la referencia congelada del sitio anterior (design/lab/sitio/referencia/medidas.json,
// kiwi; no se regenera) con las tolerancias de §12 y sus desviaciones aceptadas. Base del mapa de piezas: el banco de
// coco (design/lab/sitio/calco-estilo/verificar.mjs), aquí con los selectores del Layout real.
//
//   cd site && npm run docs:build && npx vitepress preview . --port 4234 &
//   node site/tests/paridad.mjs [--base http://localhost:4234/grana/]   ENGINES=chromium,firefox,webkit  VERBOSE=1
//
// Vistas: portada, Empezar, GCombobox y Blocks × 1280/1024/768/375/320 × claro/oscuro; estados: búsqueda abierta
// («comb»), idioma, «…» a 1024, pantalla de menú, «En esta página» desplegado y cajón a 375. Escribe
// site/tests/paridad-resultados.json (ref, grana y delta por pieza) y termina con código 1 si algo no llega.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, firefox, webkit } from '@playwright/test'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../..')
const args = process.argv.slice(2)
const bi = args.indexOf('--base')
const BASE = bi >= 0 ? args[bi + 1] : `http://localhost:${process.env.GRANA_SITE_PORT || 4234}/grana/`
const REF = JSON.parse(fs.readFileSync(path.join(ROOT, 'design/lab/sitio/referencia/medidas.json'), 'utf8'))
const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const V = !!process.env.VERBOSE
const R = []
const PAR = []
const rec = (eng, part, name, ok, info = '') => {
  R.push({ motor: eng, vista: part, prueba: name, ok: !!ok, info: String(info).slice(0, 300) })
  if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${part} · ${name}${info !== '' ? ' · ' + info : ''}`)
}

const helpers = `
window.__ratio = (a, b) => { const parse = (c) => { const x = document.createElement('canvas').getContext('2d'); x.fillStyle = '#000'; x.fillStyle = c; x.fillRect(0,0,1,1); const d = x.getImageData(0,0,1,1).data; return [d[0], d[1], d[2], d[3] / 255] }; const over = (f, g) => [0,1,2].map((i) => f[i] * f[3] + g[i] * (1 - f[3])); const lum = (p) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(p[0]) + 0.7152 * f(p[1]) + 0.0722 * f(p[2]) }; const B = parse(b); const bb = B[3] < 1 ? over(B, [255,255,255]) : B; const A = parse(a); const aa = A[3] < 1 ? over(A, bb) : A; const x = lum(aa), y = lum(bb); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) };
window.__vis = (s) => [...document.querySelectorAll(s)].find((x) => { if (!x.getClientRects().length) return false; const cs = getComputedStyle(x); return cs.visibility !== 'hidden' });
window.__box = (s) => { const e = window.__vis(s); if (!e) return null; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); const r1 = (v) => Math.round(v * 10) / 10; return { x: r1(r.x), y: r1(r.y + scrollY), w: r1(r.width), h: r1(r.height), ff: cs.fontFamily.split(',')[0].replace(/"/g, '').trim(), fs: cs.fontSize, fw: cs.fontWeight, lh: cs.lineHeight, color: cs.color, bg: cs.backgroundColor } };
`
const ffOf = (s) => (s || '').split(',')[0].replace(/"/g, '').trim()

// Piezas: referencia (medidas.json) → Layout real. kind: 'est' (estructura, ≤ 1 px) | 'pz' (piezas, ≤ 2 px).
const PIECES = [
  { ref: 'nav', sel: '.g-app-shell__header', kind: 'est', keys: 'yh', name: 'banda (alto 64)' },
  { ref: 'navBarDivider', sel: '.g-app-shell__header', kind: 'est', keys: 'xw', name: 'banda (línea: x y ancho)' },
  { ref: 'title', sel: '.g-nav-bar__brand .site-brand', kind: 'pz', keys: 'xywh', name: 'marca', onlyIf: (r) => r.box.w < 150 },
  { ref: 'titleText', sel: '.g-nav-bar__brand .site-brand__name', kind: 'pz', keys: 'xh', name: 'marca (texto)', typo: true, color: true, onlyIf: (r, v) => v.p === 'home' || v.w < 960 },
  { ref: 'searchButton', sel: '.site-search', kind: 'pz', keys: 'xywh', name: 'búsqueda (botón)' },
  { ref: 'searchPlaceholder', sel: '.site-search__text', kind: 'pz', keys: 'x', name: 'búsqueda (texto)', typoNoLh: true, color: true },
  { ref: 'menu', sel: '.g-nav-bar__nav', kind: 'pz', keys: 'xywh', name: 'enlaces (bloque)' },
  { ref: 'menuLink', sel: '.g-nav-bar__link', kind: 'pz', keys: 'xywh', name: 'primer enlace', typo: true, color: true },
  { ref: 'menuLinkActive', sel: '.g-nav-bar__link[aria-current="page"]', kind: 'pz', keys: 'xywh', name: 'enlace actual', typo: true, color: true },
  { ref: 'translationsButton', sel: '.site-lang', kind: 'pz', keys: 'xywh', name: 'idioma' },
  { ref: 'switch', sel: '.g-nav-bar__actions .site-theme .g-switch__control', kind: 'pz', keys: 'xywh', name: 'interruptor' },
  { ref: 'extraButton', sel: '.g-nav-bar__more-btn', kind: 'pz', keys: 'xywh', name: '«…»' },
  { ref: 'hamburger', sel: '.g-nav-bar__toggle', kind: 'pz', keys: 'xywh', name: 'hamburguesa' },
  { ref: 'sidebar', sel: '.g-app-shell > .g-sidebar--mode-expanded', kind: 'est', keys: 'xw', name: 'columna izquierda (272)', onlyIf: (r, v) => v.w >= 960 },
  // El índice como columna (≥ 960). Por debajo el original lo medía fuera del visor (cajón cerrado, con transform); aquí el
  // cajón cerrado no se pinta: se mide abierto, en el estado «cajón» a 375.
  { ref: 'sidebarGroupTitle', sel: '.g-app-shell > .g-sidebar .g-sidebar__group-title', kind: 'pz', keys: 'xyh', name: 'índice (título de grupo)', typo: true, color: true, onlyIf: (r, v) => v.w >= 960 },
  { ref: 'sidebarLink', sel: '.g-app-shell > .g-sidebar .g-sidebar__link', kind: 'pz', keys: 'xyh', name: 'índice (primer enlace)', typo: true, color: true, onlyIf: (r, v) => v.w >= 960 },
  { ref: 'localNav', sel: '.site-local', kind: 'est', keys: 'yh', name: 'barra local (48)' },
  { ref: 'localNavOutline', sel: '.site-local__index .g-page-index__fold', kind: 'pz', keys: 'xywh', name: 'desplegable (botón)', typo: true, color: true },
  { ref: 'outline', sel: '.site-aside .g-page-index', kind: 'est', keys: 'xyw', name: 'columna «En esta página»' },
  { ref: 'outlineTitle', sel: '.site-aside .g-page-index__title', kind: 'pz', keys: 'xywh', name: '«En esta página» (título)', typo: true, color: true },
  { ref: 'outlineLink', sel: '.site-aside .g-page-index__link', colorSel: '.site-aside .g-page-index__link:not([aria-current])', kind: 'pz', keys: 'xywh', name: '«En esta página» (enlace h2)', typo: true, color: true },
  { ref: 'outlineLinkNested', sel: '.site-aside .g-page-index__sub .g-page-index__link:not([aria-current])', kind: 'pz', keys: 'xwh', name: '«En esta página» (enlace h3)', typo: true, color: true },
  { ref: 'h1', sel: '.site-content h1', kind: 'est', keys: 'xywh', name: 'h1', typo: true, color: true },
  { ref: 'docContentContainer', sel: '.site-content > .vp-doc', kind: 'est', keys: 'xyw', name: 'columna de texto' },
  { ref: 'pager', sel: '.site-pager__card', kind: 'pz', keys: 'xwh', name: 'tarjeta anterior/siguiente' },
  { ref: 'pagerDesc', sel: '.site-pager__label', kind: 'pz', keys: 'h', name: 'tarjeta (rótulo)', typo: true, color: true },
  { ref: 'pagerTitle', sel: '.site-pager__title', kind: 'pz', keys: 'h', name: 'tarjeta (título)', typo: true, color: true },
  { ref: 'footer', sel: '.g-app-shell__footer', kind: 'est', keys: 'xwh', name: 'pie (portada)' }
]

// Desviaciones aceptadas de §12, cada una con su cota
const allow = (v, piece, k, d) => {
  const mid = v.w >= 960 && v.w < 1280 && v.p !== 'home'
  if (mid && ['menu', 'menuLink', 'menuLinkActive', 'extraButton'].includes(piece.ref) && k === 'x' && Math.abs(d) <= 4) return 'desviación 2'
  if (piece.ref === 'searchButton' && k === 'w' && d < 0 && mid) return 'desviación 3'
  if (['translationsButton', 'hamburger', 'extraButton'].includes(piece.ref) && k === 'w' && Math.abs(d) <= 4) return 'desviación 1 (iconos enteros)'
  if (piece.ref === 'titleText' && k === 'w' && Math.abs(d) <= 2) return 'desviación 7'
  return null
}
// Tipografía: §12 desviación 8 (peso 600 del idioma actual) no aplica a estas piezas; las variantes de Instrument Sans cuentan como iguales
const sameFamily = (a, b) => a === b || (a.startsWith('Instrument Sans') && b.startsWith('Instrument Sans')) || (a.startsWith('Instrument Serif') && b.startsWith('Instrument Serif'))

const ROUTE = { comp: 'components/combobox.html', guide: 'getting-started.html', blocks: 'blocks/', home: '' }
const REFNAME = { comp: 'combobox', guide: 'empezar', blocks: 'blocks', home: 'portada' }
const views = []
for (const p of ['home', 'guide', 'comp', 'blocks']) for (const w of [1280, 1024, 768, 375, 320]) views.push({ p, w })

async function open(browser, url, { w, h = w < 768 ? 740 : 800, theme, touch = false, eng }) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: theme === 'oscuro' ? 'dark' : 'light', ...(touch ? { hasTouch: true, isMobile: eng !== 'firefox' } : {}) })
  await ctx.addInitScript((d) => { try { localStorage.setItem('vitepress-theme-appearance', d ? 'dark' : 'light') } catch {} }, theme === 'oscuro')
  const page = await ctx.newPage()
  const errs = []
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 200)) })
  page.on('pageerror', (e) => errs.push('pageerror ' + e.message.slice(0, 200)))
  await page.goto(BASE + url, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.addScriptTag({ content: helpers })
  await page.waitForTimeout(400)
  return { page, ctx, errs }
}
const stateRow = (eng, vista, pieza, refBox, b, extra = {}) => {
  const ref = { x: refBox[0], y: refBox[1], w: refBox[2], h: refBox[3] }
  const delta = Object.fromEntries(Object.keys(ref).filter((k) => b[k] != null && ref[k] != null).map((k) => [k, Math.round((b[k] - ref[k]) * 10) / 10]))
  PAR.push({ motor: eng, vista, pieza, tipo: 'pz', ref, grana: b, delta, ...extra })
  return delta
}

for (const eng of ENGINES) {
  const browser = await { chromium, firefox, webkit }[eng].launch()
  for (const theme of ['claro', 'oscuro']) {
    for (const v of views) {
      const part = `${REFNAME[v.p]}-${v.w}-${theme}`
      const { page, ctx, errs } = await open(browser, ROUTE[v.p], { w: v.w, theme, eng })
      rec(eng, part, 'consola sin errores', errs.length === 0, errs.slice(0, 2).join(' | '))
      const s = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
      rec(eng, part, 'sin desplazamiento horizontal', s.sw <= s.cw, `${s.sw}/${s.cw}`)
      const ref = REF.paginas[part]
      for (const piece of PIECES) {
        const r = ref && ref[piece.ref]
        const b = await page.evaluate((sel) => window.__box(sel), piece.sel)
        const rv = r && r.visible
        if (!rv && !b) continue
        if (piece.onlyIf && rv && !piece.onlyIf(r, v)) continue
        const row = { motor: eng, vista: part, pieza: piece.name, tipo: piece.kind, ref: rv ? r.box : null, grana: b ? { x: b.x, y: b.y, w: b.w, h: b.h } : null }
        if (!rv || !b) {
          row.delta = rv ? 'falta en el sitio' : 'sobra en el sitio'
          PAR.push(row)
          rec(eng, part, `paridad · ${piece.name}`, false, row.delta)
          continue
        }
        const tol = piece.kind === 'est' ? 1 : 2
        row.delta = {}
        const bad = []
        for (const k of piece.keys) {
          const d = Math.round((b[k] - r.box[k]) * 10) / 10
          row.delta[k] = d
          if (Math.abs(d) > tol + 0.05) {
            const a = allow(v, piece, k, d)
            if (a) row.desviacion = a
            else bad.push(`${k} ${d}`)
          }
        }
        if (piece.typo || piece.typoNoLh) {
          const st = r.style
          const tr = { ff: ffOf(st.fontFamily), fs: st.fontSize, fw: st.fontWeight, lh: st.lineHeight }
          const tb = { ff: b.ff, fs: b.fs, fw: b.fw, lh: b.lh }
          const diff = Object.keys(tr).filter((k) => !(piece.typoNoLh && k === 'lh') && (k === 'ff' ? !sameFamily(tr.ff, tb.ff) : String(tr[k]) !== String(tb[k])))
          row.tipografia = diff.length ? diff.map((k) => `${k} ${tr[k]} → ${tb[k]}`).join('; ') : 'igual'
          if (diff.length) bad.push('tipografía ' + row.tipografia)
        }
        if (piece.colorSel) {
          const c = await page.evaluate((sel) => window.__box(sel), piece.colorSel)
          if (c) b.color = c.color
        }
        if (piece.color) {
          row.color = r.style.color === b.color ? 'igual' : `${r.style.color} → ${b.color}`
          if (r.style.color !== b.color) bad.push('color ' + row.color)
        }
        PAR.push(row)
        rec(eng, part, `paridad · ${piece.name}`, bad.length === 0, bad.join(' · '))
      }
      await ctx.close()
    }

    // ---------- Estados a 1280 (ficha): búsqueda con «comb» e idioma ----------
    {
      const { page, ctx } = await open(browser, ROUTE.comp, { w: 1280, theme, eng })
      const part = `estado-1280-${theme}`
      await page.keyboard.press(eng === 'webkit' ? 'Meta+k' : 'Control+k')
      await page.waitForTimeout(300)
      await page.keyboard.type('comb')
      await page.waitForFunction(() => document.querySelectorAll('#site-search-surface .g-combobox__option').length > 0, null, { timeout: 60_000 }).catch(() => {})
      const sb = await page.evaluate(() => { const d = document.querySelector('#site-search-surface'); if (!d) return null; const r = d.getBoundingClientRect(); const cs = getComputedStyle(d); return { open: d.open, x: Math.round(r.x * 10) / 10, y: r.y, w: r.width, h: r.height, bg: cs.backgroundColor, radius: cs.borderRadius, pad: cs.paddingTop, n: d.querySelectorAll('.g-combobox__option').length, mark: !!d.querySelector('mark'), focus: document.activeElement?.classList.contains('g-combobox__search-field') } })
      const refS = REF.estados[`busqueda-1280-${theme}`]
      if (sb) stateRow(eng, part, 'búsqueda abierta (panel)', refS.box, sb, { nota: 'alto: la referencia sin resultados; aquí con los de «comb»' })
      rec(eng, part, 'búsqueda: ⌘K/Ctrl+K abre; caja x, y, ancho ≤ 2 del calco', sb && sb.open && Math.abs(sb.x - refS.box[0]) <= 2 && Math.abs(sb.y - refS.box[1]) <= 2 && Math.abs(sb.w - refS.box[2]) <= 2, JSON.stringify(sb))
      rec(eng, part, 'búsqueda: fondo, radio y relleno del calco', sb && sb.bg === refS.bg && sb.radius === refS.radius && sb.pad === refS.padding, sb && `${sb.bg}/${refS.bg} ${sb.radius}/${refS.radius} ${sb.pad}/${refS.padding}`)
      rec(eng, part, 'búsqueda: «comb» da resultados con <mark> y el foco en el campo', sb && sb.n > 0 && sb.mark && sb.focus, sb && `${sb.n} resultados`)
      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)
      await page.locator('.g-nav-bar__actions .site-lang').click()
      await page.waitForTimeout(350)
      const lg = await page.evaluate(() => { const l = [...document.querySelectorAll('.g-menu__list')].find((x) => x.getClientRects().length); if (!l) return null; const r = l.getBoundingClientRect(); const cs = getComputedStyle(l); return { x: r.x, y: r.y, w: r.width, h: r.height, radius: cs.borderRadius } })
      const refL = REF.estados[`idioma-1280-${theme}`]
      if (lg) stateRow(eng, part, 'idioma abierto (panel)', refL.box, lg)
      rec(eng, part, 'idioma: abre al pulsar; panel ≤ 2 del calco (x, y, ancho, alto)', lg && ['x', 'y', 'w', 'h'].every((k, i) => Math.abs(lg[k] - refL.box[i]) <= 2), JSON.stringify(lg))
      await ctx.close()
    }

    // ---------- «…» a 1024 ----------
    for (const p of ['comp', 'home']) {
      const { page, ctx } = await open(browser, ROUTE[p], { w: 1024, theme, eng })
      const part = `estado-mas-1024-${REFNAME[p]}-${theme}`
      await page.locator('.g-nav-bar__more-btn').click()
      await page.waitForTimeout(350)
      const mo = await page.evaluate(() => { const pn = document.querySelector('.g-nav-bar__more-panel'); const r = pn.getBoundingClientRect(); const btn = document.querySelector('.g-nav-bar__more-btn'); return { open: pn.matches(':popover-open'), exp: btn.getAttribute('aria-expanded'), x: r.x, y: r.y, w: r.width, h: r.height, right: r.right, sw: document.documentElement.scrollWidth } })
      const refM = REF.estados[`mas-1024-${theme}`]
      stateRow(eng, part, '«…» abierto (panel)', refM.box, mo)
      rec(eng, part, '«…» abre con aria-expanded, dentro del visor; ancho y alto ≤ 2 del calco', mo.open && mo.exp === 'true' && mo.right <= 1024 && mo.sw <= 1024 && Math.abs(mo.w - refM.box[2]) <= 2 && Math.abs(mo.h - refM.box[3]) <= 2, JSON.stringify(mo))
      await ctx.close()
    }

    // ---------- 375: pantalla de menú, «En esta página» desplegado y cajón ----------
    {
      const { page, ctx } = await open(browser, ROUTE.comp, { w: 375, theme, eng })
      const part = `estado-375-${theme}`
      await page.locator('.g-nav-bar__toggle').click()
      await page.waitForTimeout(300)
      const sc = await page.evaluate(() => { const s = document.querySelector('.g-nav-bar__screen'); const r = s.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, rows: s.querySelectorAll('.g-nav-bar__screen-link').length } })
      const refMM = REF.estados[`menu-movil-375-${theme}`]
      stateRow(eng, part, 'menú móvil (pantalla)', refMM.box, sc)
      rec(eng, part, 'pantalla de menú: x, y y ancho ≤ 2 del calco, seis enlaces', Math.abs(sc.x - refMM.box[0]) <= 2 && Math.abs(sc.y - refMM.box[1]) <= 2 && Math.abs(sc.w - refMM.box[2]) <= 2 && sc.rows === 6, JSON.stringify(sc))
      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)
      await page.locator('.site-local__index .g-page-index__fold').click()
      await page.waitForTimeout(300)
      const dp = await page.evaluate(() => { const d = document.querySelector('.site-local__index .g-page-index__drop'); const r = d.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, radius: getComputedStyle(d).borderRadius, sw: document.documentElement.scrollWidth } })
      const refE = REF.estados[`en-esta-pagina-375-${theme}`]
      stateRow(eng, part, '«En esta página» desplegado', refE.box, dp)
      rec(eng, part, 'desplegado: x, y y ancho ≤ 2 del calco, radio del calco, sin desbordar', Math.abs(dp.x - refE.box[0]) <= 2 && Math.abs(dp.y - refE.box[1]) <= 2 && Math.abs(dp.w - refE.box[2]) <= 2 && dp.radius === refE.radius && dp.sw <= 375, JSON.stringify(dp))
      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)
      await page.locator('.site-local__menu').click()
      await page.waitForTimeout(500)
      const dr = await page.evaluate(() => { const d = document.querySelector('dialog.g-sidebar__drawer[open]'); if (!d) return null; const r = d.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, backdrop: getComputedStyle(d, '::backdrop').backgroundColor } })
      const refD = REF.estados[`drawer-375-${theme}`]
      if (dr) stateRow(eng, part, 'cajón del índice', refD.box, dr)
      rec(eng, part, 'cajón: abre con «Menú»; x, ancho ≤ 2 del calco y el velo del original', dr && Math.abs(dr.x - refD.box[0]) <= 2 && Math.abs(dr.w - refD.box[2]) <= 2 && dr.backdrop === refD.backdrop, JSON.stringify(dr))
      await ctx.close()
    }
  }
  await browser.close()
}

fs.writeFileSync(path.join(HERE, 'paridad-resultados.json'), JSON.stringify({ fecha: new Date().toISOString(), base: BASE, pruebas: R, piezas: PAR }, null, 1) + '\n')
const by = {}
for (const r of R) { const k = `${r.motor} ${r.vista.replace(/-(claro|oscuro)$/, '')}`; by[k] ||= [0, 0]; by[k][1]++; if (r.ok) by[k][0]++ }
for (const [k, [a, b]] of Object.entries(by)) console.log(`${a === b ? 'ok   ' : 'FALLA'} ${k}: ${a}/${b}`)
const ok = R.filter((r) => r.ok).length
console.log(`\nparidad: ${ok}/${R.length}`)
process.exitCode = ok === R.length ? 0 : 1
