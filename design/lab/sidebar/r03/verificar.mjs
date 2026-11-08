// Verificación del índice calcado (GSidebar real + appearance="index" de r03) y paridad con el sitio anterior.
// Ejecutar desde la raíz: node design/lab/sidebar/r03/verificar.mjs
//   Puerto 4239 (GRANA_PW_PORT lo cambia). ENGINES=chromium,firefox,webkit  SHOTS=0 (sin capturas)  VERBOSE=1
// Requiere packages/vue/dist y node_modules/vue. Lee la referencia de design/lab/sitio/referencia/medidas.json.
// Escribe proto-*.png y paridad.json en esta carpeta. No toca nada más.
import http from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const HERE = fileURLToPath(new URL('./', import.meta.url))
const PORT = Number(process.env.GRANA_PW_PORT || 4239)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.json': 'application/json' }
const server = http.createServer(async (req, res) => {
  try {
    const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(await readFile(p))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${PORT}/design/lab/sidebar/r03/index.html`
const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const REF = JSON.parse(await readFile(join(ROOT, 'design/lab/sitio/referencia/medidas.json'), 'utf8'))

const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const SHOTS = process.env.SHOTS !== '0'
const V = !!process.env.VERBOSE
const R = []
const rec = (eng, part, name, ok, info = '') => { R.push({ eng, part, name, ok: !!ok }); if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${part} · ${name}${info !== '' ? ' · ' + info : ''}`) }
const PAR = []
const HALLAZGOS = []
const CONTRASTE = []
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// Utilidades en la página: cajas, cociente de contraste y token resuelto
const HELPERS = () => {
  window.__b = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x * 10) / 10, y: Math.round(r.y * 10) / 10, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10 } }
  window.__rgb = (c) => { const x = document.createElement('canvas').getContext('2d'); x.fillStyle = '#000'; x.fillStyle = c; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]] }
  window.__over = (a, b) => { const x = document.createElement('canvas').getContext('2d'); x.fillStyle = b; x.fillRect(0, 0, 1, 1); x.fillStyle = a; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return `rgb(${d[0]}, ${d[1]}, ${d[2]})` }
  window.__ratio = (a, b) => { a = __over(a, b); const lum = (p) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(p[0]) + 0.7152 * f(p[1]) + 0.0722 * f(p[2]) }; const A = lum(__rgb(a)), B = lum(__rgb(b)); return Math.round(((Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05)) * 100) / 100 }
  window.__tok = (n) => { const d = document.createElement('span'); d.style.color = `var(${n})`; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c }
}
const root = (narrow) => (narrow ? '.g-sidebar__drawer > .g-sidebar' : '.g-sidebar--appearance-index')

async function open(browser, { w, theme = 'claro', q = '', reduce = false }) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 768 ? 740 : 800 }, reducedMotion: reduce ? 'reduce' : 'no-preference' })
  const page = await ctx.newPage()
  const errs = []
  // Los fallos de red de Google Fonts (Instrument Serif del sitio) no son del prototipo: se ignoran solo los net::ERR_
  page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !/net::ERR_/.test(m.text())) errs.push(m.text()) })
  page.on('pageerror', (e) => errs.push('pageerror ' + e.message))
  await page.goto(`${BASE}?p=comp${theme === 'oscuro' ? '&theme=dark' : ''}${q}`, { waitUntil: 'load' })
  await page.waitForSelector('.g-sidebar', { state: 'attached' })
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(HELPERS)
  await page.waitForTimeout(300)
  return { ctx, page, errs }
}
async function openDrawer(page) {
  // Con el teclado: en WebKit un clic no enfoca un botón, y el cajón devuelve el foco a quien lo tenía al abrir
  await page.focus('.mk-local__menu')
  await page.keyboard.press('Enter')
  await page.waitForSelector('.g-sidebar__drawer[open] .ix-toggle', { timeout: 3000 })
  await page.waitForTimeout(450)
}

for (const eng of ENGINES) {
  const browser = await pw[eng].launch()

  // ---------- A · Estructura, paridad y contraste: 4 anchos × claro/oscuro ----------
  for (const theme of ['claro', 'oscuro']) {
    for (const w of [1280, 1024, 768, 375]) {
      const narrow = w < 960
      const part = `${theme}/${w}`
      const { ctx, page, errs } = await open(browser, { w, theme })
      rec(eng, part, 'consola limpia', errs.length === 0, errs.slice(0, 2).join(' | '))
      const sw = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth])
      rec(eng, part, 'sin desplazamiento horizontal', sw[0] <= sw[1], sw.join('/'))
      if (narrow) {
        const menu = await page.evaluate(() => { const b = document.querySelector('.mk-local__menu'); return !!b && !b.hidden && b.getClientRects().length > 0 })
        rec(eng, part, 'por debajo de 960: índice como cajón, botón «Menú» visible', menu)
        rec(eng, part, 'por debajo de 960: sin columna', await page.evaluate(() => !document.querySelector('.g-sidebar--appearance-index.g-sidebar--mode-expanded')))
        await openDrawer(page)
        // La paridad se mide con la lista arriba del todo (el original no desplazaba el cajón; el prototipo trae el actual)
        await page.evaluate(() => { document.querySelector('.g-sidebar__drawer .g-sidebar__nav').scrollTop = 0 })
        await page.waitForTimeout(100)
      }
      const S = await page.evaluate((sel) => {
        const s = document.querySelector(sel)
        const q = (x) => s.querySelector(x)
        const cs = (e) => e && getComputedStyle(e)
        const groups = [...s.querySelectorAll('.g-sidebar__group')]
        const nav = q('.g-sidebar__nav')
        const lists = [...s.querySelectorAll('.g-sidebar__list')]
        const cur = [...document.querySelectorAll('.g-sidebar [aria-current="page"]')].filter((a) => a.getClientRects().length)
        const toggles = [...s.querySelectorAll('.ix-toggle')]
        const host = s.closest('.g-sidebar__drawer') || s
        const bd = s.closest('.g-sidebar__drawer') ? getComputedStyle(s.closest('.g-sidebar__drawer'), '::backdrop').backgroundColor : null
        return {
          box: __b(host), bg: cs(s).backgroundColor, backdrop: bd,
          navLabel: nav.getAttribute('aria-label'),
          groups: groups.length, links: s.querySelectorAll('.g-sidebar__link').length,
          g0: __b(groups[0]), g1: __b(groups[1]), g1Border: cs(groups[1]).borderTopWidth + ' ' + cs(groups[1]).borderTopColor, g0Pad: [cs(groups[0]).paddingTop, cs(groups[0]).paddingBottom],
          t0: __b(q('.g-sidebar__group-title')), t0Style: [cs(q('.g-sidebar__group-title')).fontSize, cs(q('.g-sidebar__group-title')).fontWeight, cs(q('.g-sidebar__group-title')).lineHeight, cs(q('.g-sidebar__group-title')).color],
          t0Button: !!q('.g-sidebar__group-title').querySelector('.ix-toggle'),
          l0: __b(q('.g-sidebar__link')), l0Style: [cs(q('.g-sidebar__link')).fontSize, cs(q('.g-sidebar__link')).fontWeight, cs(q('.g-sidebar__link')).lineHeight, cs(q('.g-sidebar__link')).color],
          cur: cur.map((a) => a.textContent.trim()), curBox: __b(cur[0]), curColor: cur[0] && cs(cur[0]).color,
          mark: __b(q('.ix-mark.is-on')) || __b([...s.querySelectorAll('[aria-current="page"]')].map((a) => a)[0]) && null,
          markColor: q('.ix-mark') && cs(q('.ix-mark')).backgroundColor,
          toggles: toggles.length, togglesOk: toggles.every((b) => b.getAttribute('aria-expanded') === 'true' && document.getElementById(b.getAttribute('aria-controls'))),
          listsNamed: lists.every((u) => { const id = u.getAttribute('aria-labelledby'); return id && document.getElementById(id)?.textContent.trim() }),
          chev: __b(q('.ix-toggle__chev svg')), chevColor: q('.ix-toggle__chev') && cs(q('.ix-toggle__chev')).color,
          icons: [...s.querySelectorAll('.g-sidebar__icon:not([data-code])')].filter((e) => e.getClientRects().length).length,
          code: __b(q('[data-code]')), codeColor: q('[data-code]') && cs(q('[data-code]')).color,
          linkRight: __b(q('.g-sidebar__link')) && __b(q('.g-sidebar__link')).x + __b(q('.g-sidebar__link')).w,
          filter: __b(q('.g-sidebar__filter-box')), filterVisible: !!q('.g-sidebar__filter-input') && q('.g-sidebar__filter-input').getClientRects().length > 0,
          logo: __b(q('.mk-brand')), headLine: s.querySelector('.g-sidebar__head') && getComputedStyle(s.querySelector('.g-sidebar__head'), '::after').top,
          tok: { text: __tok('--g-color-text'), muted: __tok('--g-color-text-muted'), subtle: __tok('--g-color-text-subtle'), accent: __tok('--g-color-accent-text'), border: __tok('--g-color-border'), sunken: __tok('--g-color-surface-sunken') },
          placeholder: q('.g-sidebar__filter-input') && getComputedStyle(q('.g-sidebar__filter-input'), '::placeholder').color
        }
      }, root(narrow))
      rec(eng, part, '<nav> con nombre «Documentación»', S.navLabel === 'Documentación')
      rec(eng, part, '10 grupos y 87 enlaces (los del original)', S.groups === 10 && S.links === 87, `${S.groups}/${S.links}`)
      rec(eng, part, 'un solo aria-current="page": GCombobox', S.cur.length === 1 && S.cur[0].endsWith('GCombobox'), JSON.stringify(S.cur))
      rec(eng, part, '«Guía» no es botón; los 9 grupos de componentes, botón con aria-expanded y aria-controls', !S.t0Button && S.toggles === 9 && S.togglesOk)
      rec(eng, part, 'cada lista con nombre (aria-labelledby)', S.listsNamed)
      rec(eng, part, 'sin iconos en los enlaces', S.icons === 0, S.icons)
      rec(eng, part, 'título 14/24, peso 700, color text', S.t0Style[0] === '14px' && S.t0Style[1] === '700' && S.t0Style[2] === '24px' && S.t0Style[3] === S.tok.text, S.t0Style.join(' '))
      rec(eng, part, 'enlace 14/24, 500, text-muted', S.l0Style[0] === '14px' && S.l0Style[1] === '500' && S.l0Style[2] === '24px' && S.l0Style[3] === S.tok.muted, S.l0Style.join(' '))
      rec(eng, part, 'fila del enlace de 32', Math.abs(S.l0.h - 32) < 0.6, S.l0.h)
      rec(eng, part, 'actual en accent-text', S.curColor === S.tok.accent, S.curColor)
      rec(eng, part, 'separador de 1 px en border entre grupos', S.g1Border.startsWith('1px') && S.g1Border.endsWith(S.tok.border), S.g1Border)
      rec(eng, part, 'fondo surface-sunken', S.bg === S.tok.sunken, S.bg)
      rec(eng, part, 'el número no se sale de la fila', !S.code || S.code.x + S.code.w <= S.linkRight + 0.5, `${S.code && S.code.x + S.code.w} ≤ ${S.linkRight}`)
      rec(eng, part, 'la flecha cae en la columna del original (centro a 1 px del borde − 9)', !S.chev || Math.abs(S.chev.x + S.chev.w / 2 - (S.linkRight - 9)) <= 1, S.chev && S.chev.x + S.chev.w / 2)
      if (!narrow) rec(eng, part, 'la línea de la banda a 63', parseFloat(S.headLine) === 63, S.headLine)
      // Contraste (pares del índice)
      const C = await page.evaluate((t) => ({
        enlace: __ratio(t.muted, t.sunken), titulo: __ratio(t.text, t.sunken), actual: __ratio(t.accent, t.sunken),
        actualVsVecino: __ratio(t.accent, t.muted), marca: __ratio(t.accent, t.sunken), numero: __ratio(t.subtle, t.sunken),
        separador: __ratio(t.border, t.sunken)
      }), S.tok)
      C.flecha = await page.evaluate(([a, b]) => __ratio(a, b), [S.chevColor, S.tok.sunken])
      C.textoEjemplo = S.placeholder ? await page.evaluate(([a, b]) => __ratio(a, b), [S.placeholder, S.tok.sunken]) : null
      if (eng === 'chromium' && w === 1280) CONTRASTE.push({ theme, ...C })
      rec(eng, part, 'enlace ≥ 4.5:1', C.enlace >= 4.5, C.enlace)
      rec(eng, part, 'actual ≥ 4.5:1', C.actual >= 4.5, C.actual)
      rec(eng, part, 'marca del actual (forma) ≥ 3:1', C.marca >= 3, C.marca)
      rec(eng, part, 'número ≥ 4.5:1', C.numero >= 4.5, C.numero)
      rec(eng, part, 'flecha (forma) ≥ 3:1', C.flecha >= 3, C.flecha)
      if (C.textoEjemplo != null) rec(eng, part, 'texto de ejemplo del filtro ≥ 4.5:1', C.textoEjemplo >= 4.5, C.textoEjemplo)

      if (narrow) {
        const refW = w < 384 ? w - 64 : 320
        rec(eng, part, `cajón de ${refW} (320 o el visor − 64)`, Math.abs(S.box.w - refW) < 0.6, S.box.w)
        rec(eng, part, 'velo rgba(0,0,0,.6) o equivalente', !!S.backdrop && S.backdrop !== 'rgba(0, 0, 0, 0)', S.backdrop)
        rec(eng, part, 'el filtro está en el cajón', S.filterVisible)
      } else {
        rec(eng, part, 'marca del actual 2 × 20 a x = 15, centrada en la fila', S.mark && S.mark.x === 15 && S.mark.w === 2 && S.mark.h === 20 && Math.abs(S.mark.y - (S.curBox.y + 6)) <= 1, JSON.stringify(S.mark))
        rec(eng, part, 'F1: el filtro en la banda, a la derecha de la marca, sin pisarla', S.filter && S.filter.y >= 0 && S.filter.y + S.filter.h <= 64 && S.logo.x + S.logo.w <= S.filter.x + 30, JSON.stringify(S.filter))
      }

      // Paridad (Chromium): pieza a pieza, coordenadas relativas al borde del índice
      if (eng === 'chromium') {
        const ref = REF.paginas[`combobox-${w}-${theme}`]
        const ox = ref.sidebar.box.x
        const rel = (b) => b && { x: b.x - ox, y: b.y, w: b.w, h: b.h }
        const refBox = narrow ? { x: 0, y: 0, w: (REF.estados[`drawer-375-${theme}`] && w === 375) ? REF.estados[`drawer-375-${theme}`].box[2] : 320, h: ref.sidebar.box.h } : rel(ref.sidebar.box)
        const ours = { columna: S.box, grupo: S.g0, título: S.t0, enlace: S.l0, actual: S.curBox, marca: S.mark }
        const refs = { columna: refBox, grupo: rel(ref.sidebarGroup.box), título: rel(ref.sidebarGroupTitle.box), enlace: rel(ref.sidebarLink.box), actual: rel(ref.sidebarLinkActive.box), marca: rel(ref.sidebarActiveIndicator.box) }
        for (const k of Object.keys(ours)) {
          const o = ours[k], r = refs[k]
          if (!o || !r) { PAR.push({ vista: part, pieza: k, ref: r, proto: o, nota: 'sin dato' }); continue }
          // En el cajón la lista se desplaza para traer el actual: se compara la x, el ancho y el alto del actual, no su y
          const d = { dx: Math.round((o.x - r.x) * 10) / 10, dy: Math.round((o.y - r.y) * 10) / 10, dw: Math.round((o.w - r.w) * 10) / 10, dh: Math.round((o.h - r.h) * 10) / 10 }
          PAR.push({ vista: part, pieza: k, ref: r, proto: o, ...d, nota: narrow && k !== 'columna' ? 'cajón: la fila del filtro y el botón de cerrar (32) empujan la lista' : '' })
        }
        PAR.push({ vista: part, pieza: 'color', ref: { titulo: ref.sidebarGroupTitle.style.color, enlace: ref.sidebarLink.style.color, actual: ref.sidebarLinkActive.style.color, fondo: ref.sidebar.style.backgroundColor, marca: ref.sidebarActiveIndicator.style.backgroundColor, velo: narrow ? (REF.estados[`drawer-375-${theme}`] || {}).backdrop : undefined },
          proto: { titulo: S.t0Style[3], enlace: S.l0Style[3], actual: S.curColor, fondo: S.bg, marca: S.markColor, velo: S.backdrop || undefined } })
        if (SHOTS) await page.screenshot({ path: join(HERE, `proto-${w}-${theme}.png`) })
      }
      await ctx.close()
    }
  }

  // ---------- B · Comportamiento a 1280 ----------
  {
    const part = 'comportamiento/1280'
    const { ctx, page } = await open(browser, { w: 1280 })
    const sel = root(false)
    // B1 · plegar y desplegar con el botón
    const before = await page.evaluate((s) => __b(document.querySelectorAll(s + ' .g-sidebar__group')[3]).y, sel)
    await page.click(`${sel} .ix-toggle[data-label="Acciones y navegación"]`)
    await page.waitForTimeout(450)
    const B1 = await page.evaluate((s) => {
      const b = document.querySelector(s + ' .ix-toggle[data-label="Acciones y navegación"]')
      const ul = document.getElementById(b.getAttribute('aria-controls'))
      const li = b.closest('.g-sidebar__group')
      return { exp: b.getAttribute('aria-expanded'), hidden: ul.getAttribute('hidden'), focusable: [...ul.querySelectorAll('a')].some((a) => (a.checkVisibility ? a.checkVisibility() : a.getClientRects().length > 0)), pb: getComputedStyle(li).paddingBottom, next: __b(document.querySelectorAll(s + ' .g-sidebar__group')[3]).y, focus: document.activeElement === b }
    }, sel)
    rec(eng, part, 'plegar: aria-expanded=false, la lista oculta (until-found o hidden) y sin enlaces alcanzables', B1.exp === 'false' && B1.hidden !== null && !B1.focusable, JSON.stringify(B1))
    rec(eng, part, 'plegado: relleno inferior 10 (el del original) y el grupo siguiente sube', B1.pb === '10px' && B1.next < before, `${B1.pb} · ${before} → ${B1.next}`)
    // En WebKit (macOS) un clic no enfoca un botón: convención de la plataforma, no se exige
    if (eng !== 'webkit') rec(eng, part, 'el foco se queda en el botón', B1.focus)
    await page.focus(`${sel} .ix-toggle[data-label="Acciones y navegación"]`)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(450)
    rec(eng, part, 'Intro en el botón despliega', await page.evaluate((s) => document.querySelector(s + ' .ix-toggle[data-label="Acciones y navegación"]').getAttribute('aria-expanded') === 'true', sel))
    await page.keyboard.press('Space')
    await page.waitForTimeout(450)
    rec(eng, part, 'Espacio pliega', await page.evaluate((s) => document.querySelector(s + ' .ix-toggle[data-label="Acciones y navegación"]').getAttribute('aria-expanded') === 'false', sel))

    // B2 · la marca representa al actual dentro de un grupo plegado y vuelve al desplegar
    await page.click(`${sel} .ix-toggle[data-label="Campos de entrada"]`)
    await page.waitForTimeout(500)
    const B2 = await page.evaluate((s) => { const m = document.querySelector(s + ' .ix-mark'); const t = document.querySelector(s + ' .ix-toggle[data-label="Campos de entrada"]'); return { rep: m.classList.contains('is-rep'), on: m.classList.contains('is-on'), my: __b(m).y, ty: __b(t).y + 6 } }, sel)
    rec(eng, part, 'grupo del actual plegado: la marca hueca en la fila del título', B2.on && B2.rep && Math.abs(B2.my - B2.ty) <= 1, JSON.stringify(B2))

    // B3 · derivado de la ruta: el actual pasa a un grupo plegado → se abre y la marca viaja
    await page.evaluate(() => { window.__marco.current = 'c-input' })
    await page.waitForTimeout(600)
    const B3 = await page.evaluate((s) => { const a = document.querySelector(s + ' [aria-current="page"]'); const m = document.querySelector(s + ' .ix-mark'); return { cur: a.textContent.trim(), exp: document.querySelector(s + ' .ix-toggle[data-label="Campos de entrada"]').getAttribute('aria-expanded'), my: __b(m).y, ay: __b(a).y + 6, rep: m.classList.contains('is-rep') } }, sel)
    rec(eng, part, 'la ruta abre el grupo del nuevo actual y la marca llega a su fila', B3.cur.endsWith('GInput') && B3.exp === 'true' && !B3.rep && Math.abs(B3.my - B3.ay) <= 1, JSON.stringify(B3))

    // B4 · la marca viaja con transición (sin reducción) al elegir otro destino con el puntero
    const tr = await page.evaluate((s) => getComputedStyle(document.querySelector(s + ' .ix-mark')).transitionProperty, sel)
    rec(eng, part, 'la marca anima translate', /translate/.test(tr), tr)
    await page.click(`${sel} .g-sidebar__link[data-id="c-select"]`)
    await page.waitForTimeout(80)
    const mid = await page.evaluate((s) => { const m = document.querySelector(s + ' .ix-mark'); const a = document.querySelector(s + ' [data-id="c-select"]'); return { my: __b(m).y, ay: __b(a).y + 6 } }, sel)
    await page.waitForTimeout(500)
    const end = await page.evaluate((s) => { const m = document.querySelector(s + ' .ix-mark'); const a = document.querySelector(s + ' [data-id="c-select"]'); return { my: __b(m).y, ay: __b(a).y + 6, cur: a.getAttribute('aria-current') } }, sel)
    rec(eng, part, 'clic en GSelect: aria-current pasa y la marca viaja hasta su fila', end.cur === 'page' && Math.abs(end.my - end.ay) <= 1 && Math.abs(mid.my - mid.ay) > 1, `a mitad ${mid.my}≠${mid.ay}; al final ${end.my}=${end.ay}`)

    // B5 · la luz (#957): el puntero la mueve, el color del hover no es el del actual, y no mueve el foco
    const fBefore = await page.evaluate(() => document.activeElement && (document.activeElement.dataset.id || document.activeElement.className))
    await page.hover(`${sel} .g-sidebar__link[data-id="c-table"]`)
    await page.waitForTimeout(300)
    const B5 = await page.evaluate((s) => { const a = document.querySelector(s + ' [data-id="c-table"]'); const ul = a.closest('.g-sidebar__list'); const hl = ul.querySelector('.g-sidebar__highlight'); return { on: ul.classList.contains('has-highlight'), hl: __b(hl), a: __b(a), color: getComputedStyle(a).color, accent: __tok('--g-color-accent-text'), text: __tok('--g-color-text'), focus: document.activeElement && (document.activeElement.dataset.id || document.activeElement.className) } }, sel)
    rec(eng, part, 'hover: la luz bajo la fila, 8 px por fuera a cada lado', B5.on && Math.abs(B5.hl.x - (B5.a.x - 8)) <= 1 && Math.abs(B5.hl.w - (B5.a.w + 16)) <= 1, JSON.stringify([B5.hl, B5.a]))
    rec(eng, part, 'hover en text, no en accent (el puntero no imita al actual)', B5.color === B5.text && B5.color !== B5.accent, B5.color)
    rec(eng, part, 'el puntero no mueve el foco', B5.focus === fBefore, `${fBefore} → ${B5.focus}`)

    // B6 · filtro: «/» lo enfoca, crece sobre la marca, abre los grupos plegados con coincidencias y los devuelve al vaciar
    await page.mouse.move(700, 400)
    await page.click('.mk-content h1')
    await page.keyboard.press('/')
    await page.waitForTimeout(400)
    const B6a = await page.evaluate((s) => ({ focus: document.activeElement.classList.contains('g-sidebar__filter-input'), fb: __b(document.querySelector(s + ' .g-sidebar__filter-box')), logo: getComputedStyle(document.querySelector(s + ' .g-sidebar__logo')).visibility }), sel)
    rec(eng, part, '«/» enfoca el filtro, que crece a 208 y tapa la marca', B6a.focus && Math.abs(B6a.fb.w - 208) <= 1 && B6a.logo === 'hidden', JSON.stringify(B6a))
    await page.keyboard.type('tabs')
    await page.waitForTimeout(400)
    const B6b = await page.evaluate((s) => {
      const b = document.querySelector(s + ' .ix-toggle[data-label="Acciones y navegación"]')
      const vis = [...document.querySelectorAll(s + ' .g-sidebar__link')].filter((a) => a.getClientRects().length && !a.closest('[hidden]')).map((a) => a.textContent.trim())
      const count = document.querySelector(s + ' .g-sidebar__filter-count')
      return { exp: b.getAttribute('aria-expanded'), vis, count: count.textContent, countShown: __b(count).w > 1, state: window.__indice.state()['Acciones y navegación'] }
    }, sel)
    rec(eng, part, 'con texto: el grupo plegado con coincidencias se abre (sin cambiar la elección del usuario)', B6b.exp === 'true' && B6b.vis.some((v) => v.endsWith('GTabs')) && B6b.state === false, JSON.stringify(B6b))
    rec(eng, part, 'con texto: el recuento se ve', B6b.countShown, B6b.count)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(450)
    const B6c = await page.evaluate((s) => ({ exp: document.querySelector(s + ' .ix-toggle[data-label="Acciones y navegación"]').getAttribute('aria-expanded'), countShown: __b(document.querySelector(s + ' .g-sidebar__filter-count')).w > 1, q: document.querySelector(s + ' .g-sidebar__filter-input').value }), sel)
    rec(eng, part, 'Esc vacía: el grupo vuelve a plegado y el recuento a oculto', B6c.q === '' && B6c.exp === 'false' && !B6c.countShown, JSON.stringify(B6c))
    await page.keyboard.type('24')
    await page.waitForTimeout(300)
    const B6d = await page.evaluate((s) => [...document.querySelectorAll(s + ' .g-sidebar__link')].filter((a) => a.getClientRects().length && !a.closest('[hidden]')).map((a) => a.textContent.trim()), sel)
    rec(eng, part, '«24» deja solo GCombobox (el número sigue funcionando)', B6d.length === 1 && B6d[0].includes('GCombobox'), JSON.stringify(B6d))
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)

    // B7 · orden de Tab: marca → filtro → enlaces de «Guía» → botón del grupo siguiente → sus enlaces (los plegados se saltan)
    await page.click('.mk-content h1')
    await page.waitForTimeout(300)
    await page.evaluate((s) => document.querySelector(s + ' .mk-brand').focus(), sel)
    const order = []
    let navStop = false
    for (let i = 0; i < 13; i++) {
      await page.keyboard.press('Tab')
      // Firefox hace parada de Tab de toda región desplazable: la región del índice lo es (hallazgo SB-B6, del GSidebar actual)
      if (await page.evaluate(() => document.activeElement.classList.contains('g-sidebar__nav'))) { navStop = true; await page.keyboard.press('Tab') }
      order.push(await page.evaluate(() => { const e = document.activeElement; return e.classList.contains('ix-toggle') ? '[' + e.dataset.label + ']' : e.classList.contains('g-sidebar__filter-input') ? '(filtro)' : (e.querySelector?.('.g-sidebar__label')?.textContent || e.textContent).trim() }))
    }
    if (navStop) HALLAZGOS.push(`${eng}: la región <nav> del índice es parada de Tab (región desplazable sin tabindex="-1", #570)`)
    const expectOrder = eng === 'webkit' ? null : ['(filtro)', 'Empezar', 'Tematización', '@grana/cli', 'Utilidades', 'Accesibilidad', 'Personalidad', 'Proyecto', 'Cambios', 'Playground de tema', '[Estructura de página]', 'GAppShell', 'GContainer']
    rec(eng, part, 'Tab: filtro → Guía → [botón del grupo] → enlaces', !expectOrder || JSON.stringify(order) === JSON.stringify(expectOrder), JSON.stringify(order))
    // B7b · foco visible en el botón del grupo
    const ring = await page.evaluate(() => { const b = document.querySelector('.g-sidebar--appearance-index .ix-toggle'); b.focus(); const cs = getComputedStyle(b); return cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2 })
    rec(eng, part, 'foco visible en el botón del grupo (anillo ≥ 2 px)', ring)

    // B8 · until-found: beforematch abre el grupo (búsqueda de la página)
    const B8 = await page.evaluate(async (s) => {
      const b = document.querySelector(s + ' .ix-toggle[data-label="Datos"]'); b.click(); await new Promise((r) => setTimeout(r, 450))
      const ul = document.getElementById(b.getAttribute('aria-controls'))
      const supported = 'onbeforematch' in document.body
      const h = ul.getAttribute('hidden')
      ul.dispatchEvent(new Event('beforematch')); await new Promise((r) => setTimeout(r, 100))
      return { supported, hidden: h, exp: b.getAttribute('aria-expanded'), after: ul.getAttribute('hidden') }
    }, sel)
    rec(eng, part, 'plegado con hidden="until-found" donde el navegador lo admite; beforematch lo abre', (B8.supported ? B8.hidden === 'until-found' : B8.hidden === '') && B8.exp === 'true' && B8.after === null, JSON.stringify(B8))
    if (SHOTS && eng === 'chromium') {
      // Plegados «Acciones y navegación» y «Campos de entrada» (el del actual, GSelect: la marca hueca lo representa)
      await page.evaluate(() => { const st = window.__indice.state(); for (const l of ['Acciones y navegación', 'Campos de entrada', 'Datos']) if ((l === 'Datos') === (st[l] === false)) window.__indice.toggle(l) })
      await page.mouse.move(700, 400)
      await page.waitForTimeout(500)
      await page.screenshot({ path: join(HERE, 'estado-plegado-1280-claro.png') })
      await page.hover('.g-sidebar--appearance-index .g-sidebar__link[data-id="p-utilities"]')
      await page.waitForTimeout(300)
      await page.screenshot({ path: join(HERE, 'estado-hover-1280-claro.png'), clip: { x: 0, y: 0, width: 400, height: 500 } })
      await page.mouse.move(700, 400)
      await page.keyboard.press('/')
      await page.keyboard.type('form')
      await page.waitForTimeout(400)
      await page.screenshot({ path: join(HERE, 'estado-filtro-1280-claro.png') })
    }
    await ctx.close()
  }

  // ---------- B9 · movimiento reducido: la marca no viaja, el plegado no anima ----------
  {
    const part = 'reducido/1280'
    const { ctx, page } = await open(browser, { w: 1280, reduce: true })
    const sel = root(false)
    const tr = await page.evaluate((s) => getComputedStyle(document.querySelector(s + ' .ix-mark')).transitionProperty, sel)
    rec(eng, part, 'la marca sin transición de translate', !/translate/.test(tr), tr)
    await page.click(`${sel} .ix-toggle[data-label="Datos"]`)
    await page.waitForTimeout(30)
    rec(eng, part, 'el plegado es inmediato', await page.evaluate((s) => document.getElementById(document.querySelector(s + ' .ix-toggle[data-label="Datos"]').getAttribute('aria-controls')).hasAttribute('hidden'), sel))
    await ctx.close()
  }

  // ---------- C · Cajón a 768 y 375: abrir, foco, Esc, estado compartido ----------
  for (const w of [768, 375]) {
    const part = `cajón/${w}`
    const { ctx, page } = await open(browser, { w })
    await openDrawer(page)
    const C1 = await page.evaluate(() => { const d = document.querySelector('.g-sidebar__drawer'); return { open: d.open, modal: d.matches(':modal'), inside: d.contains(document.activeElement) } })
    rec(eng, part, 'abre como <dialog> modal con el foco dentro', C1.open && C1.modal && C1.inside, JSON.stringify(C1))
    await page.click('.g-sidebar__drawer .ix-toggle[data-label="Paneles"]')
    await page.waitForTimeout(450)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
    const C2 = await page.evaluate(() => ({ open: document.querySelector('.g-sidebar__drawer').open, focus: document.activeElement.classList.contains('mk-local__menu') }))
    rec(eng, part, 'Esc cierra y devuelve el foco a «Menú»', !C2.open && C2.focus, JSON.stringify(C2))
    await openDrawer(page)
    rec(eng, part, 'el plegado se conserva al volver a abrir (un solo estado)', await page.evaluate(() => document.querySelector('.g-sidebar__drawer .ix-toggle[data-label="Paneles"]').getAttribute('aria-expanded') === 'false'))
    const cur = await page.evaluate(() => { const a = document.querySelector('.g-sidebar__drawer [aria-current="page"]'); const n = document.querySelector('.g-sidebar__drawer .g-sidebar__nav'); const ar = __b(a), nr = __b(n); return ar.y >= nr.y && ar.y + ar.h <= nr.y + nr.h })
    rec(eng, part, 'el actual a la vista al abrir', cur)
    if (SHOTS && eng === 'chromium') await page.screenshot({ path: join(HERE, `estado-cajon-${w}-claro.png`) })
    await ctx.close()
  }

  // ---------- D · Variantes: F2 (filtro en fila) y C2 (números al filtrar) ----------
  for (const [q, name] of [['&filtro=fila', 'F2'], ['&num=filtro', 'C2']]) {
    for (const theme of ['claro', 'oscuro']) {
      const part = `${name}/${theme}/1280`
      const { ctx, page, errs } = await open(browser, { w: 1280, theme, q })
      rec(eng, part, 'consola limpia', errs.length === 0, errs.slice(0, 2).join(' | '))
      const D = await page.evaluate(() => { const s = document.querySelector('.g-sidebar--appearance-index'); const code = [...s.querySelectorAll('[data-code]')].find((e) => e.getClientRects().length); return { t0: __b(s.querySelector('.g-sidebar__group-title')), fb: __b(s.querySelector('.g-sidebar__filter-box')), code: !!code } })
      if (name === 'F2') rec(eng, part, 'F2: el filtro en una fila a lo ancho; la lista baja 42 (título a 116)', Math.abs(D.fb.w - 208) <= 1 && Math.abs(D.t0.y - 116) <= 1, JSON.stringify(D))
      if (name === 'C2') {
        rec(eng, part, 'C2: en reposo sin números (reposo = original)', !D.code)
        await page.keyboard.press('/')
        await page.keyboard.type('g')
        await page.waitForTimeout(300)
        rec(eng, part, 'C2: con texto, los números aparecen', await page.evaluate(() => [...document.querySelectorAll('.g-sidebar--appearance-index [data-code]')].some((e) => e.getClientRects().length)))
      }
      if (SHOTS && eng === 'chromium') await page.screenshot({ path: join(HERE, `variante-${name}-1280-${theme}.png`), clip: { x: 0, y: 0, width: 400, height: 560 } })
      await ctx.close()
    }
  }
  await browser.close()
}

const by = {}
for (const r of R) { by[r.eng] = by[r.eng] || [0, 0]; by[r.eng][1]++; if (r.ok) by[r.eng][0]++ }
console.log(Object.entries(by).map(([e, [a, b]]) => `${e} ${a}/${b}`).join(' · '))
const ok = R.filter((r) => r.ok).length
console.log(`TOTAL ${ok}/${R.length}`)
for (const h of new Set(HALLAZGOS)) console.log('HALLAZGO ' + h)
if (ENGINES.includes('chromium')) await writeFile(join(HERE, 'paridad.json'), JSON.stringify({ fecha: new Date().toISOString().slice(0, 10), motor: 'chromium', piezas: PAR, contraste: CONTRASTE }, null, 1))
server.close()
process.exit(ok === R.length ? 0 : 1)
