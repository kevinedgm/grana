// Banco de coco · GSidebar appearance="index" sobre el componente REAL (packages/vue/dist) dentro del marco calcado de kiwi.
// Mide la piel de GSidebar.css contra la referencia del sitio anterior (design/lab/sitio/referencia/medidas.json) y contra
// la paridad de la ronda r03: estructura Δ 0, piezas Δ ≤ 2, tipografía y color iguales, contraste ≥ 4,5:1 (formas ≥ 3:1)
// en el tema por defecto y en los 11 temas de Dark Color Presence, área ≥ 44 con pointer: coarse, foco, RTL, forced-colors
// y movimiento reducido. Tres motores.
// Desde la raíz:  node design/lab/sidebar/r03-estilo/verificar.mjs
//   Puerto 4242 (GRANA_PW_PORT lo cambia). ENGINES=chromium,firefox,webkit  SHOTS=0  VERBOSE=1
// Requiere packages/vue/dist reconstruido (npm run build). Escribe resultados.json, paridad.json y banco-*.png aquí.
import http from 'node:http'
import { readFile, writeFile, readdir } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const HERE = fileURLToPath(new URL('./', import.meta.url))
const PORT = Number(process.env.GRANA_PW_PORT || 4242)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.json': 'application/json' }
const server = http.createServer(async (req, res) => {
  try {
    const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
    const body = await readFile(p)
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body)
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${PORT}/design/lab/sidebar/r03-estilo/index.html`
const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const REF = JSON.parse(await readFile(join(ROOT, 'design/lab/sitio/referencia/medidas.json'), 'utf8'))
const GEN_DIR = process.env.GEN_DIR || join(ROOT, 'design/lab/tema-oscuro/dark-color-presence/generated')
const THEMES = (await readdir(GEN_DIR)).filter((f) => /^[a-z-]+\.css$/.test(f) && !f.includes('variants')).map((f) => f.replace('.css', ''))

const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const SHOTS = process.env.SHOTS !== '0'
const V = !!process.env.VERBOSE
const R = []
const rec = (eng, part, name, ok, info = '') => { R.push({ eng, part, name, ok: !!ok, info: ok ? undefined : String(info).slice(0, 300) }); if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${part} · ${name}${info !== '' ? ' · ' + info : ''}`) }
const PAR = []
const CONTRASTE = []
const NOTAS = []
const HALLAZGOS = []

const HELPERS = () => {
  window.__b = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x * 10) / 10, y: Math.round(r.y * 10) / 10, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10 } }
  window.__rgb = (c) => { const x = document.createElement('canvas').getContext('2d'); x.fillStyle = '#000'; x.fillStyle = c; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]] }
  window.__over = (a, b) => { const x = document.createElement('canvas').getContext('2d'); x.fillStyle = b; x.fillRect(0, 0, 1, 1); x.fillStyle = a; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return `rgb(${d[0]}, ${d[1]}, ${d[2]})` }
  window.__ratio = (a, b) => { a = __over(a, b); const lum = (p) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(p[0]) + 0.7152 * f(p[1]) + 0.0722 * f(p[2]) }; const A = lum(__rgb(a)), B = lum(__rgb(b)); return Math.round(((Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05)) * 100) / 100 }
  window.__tok = (n) => { const d = document.createElement('span'); d.style.color = `var(${n})`; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c }
  // El botón de un grupo por su nombre visible (el primer nodo de texto: el texto oculto de groupCurrent va aparte)
  window.__tg = (root, label) => [...document.querySelectorAll(root + ' button.g-sidebar__group-title')].find((b) => b.firstChild && b.firstChild.textContent.trim() === label)
  window.__vis = (e) => !!e && e.getClientRects().length > 0 && !e.closest('[hidden]')
}
const SIDE = '.g-sidebar--appearance-index.g-sidebar--mode-expanded:not(.g-sidebar__drawer > *)'
const DRAWER = '.g-sidebar__drawer > .g-sidebar--appearance-index'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

async function open(browser, { w, theme = 'claro', q = '', reduce = false, ctxOpts = {}, css = null }) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 768 ? 740 : 800 }, reducedMotion: reduce ? 'reduce' : 'no-preference', ...ctxOpts })
  const page = await ctx.newPage()
  const errs = []
  page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !/net::ERR_|fonts\.g/.test(m.text())) errs.push(m.text()) })
  page.on('pageerror', (e) => errs.push('pageerror ' + e.message))
  await page.goto(`${BASE}?p=comp${theme === 'oscuro' ? '&theme=dark' : ''}${q}`, { waitUntil: 'load' })
  await page.waitForSelector('.g-sidebar', { state: 'attached' })
  if (css) await page.addStyleTag({ path: css })
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(HELPERS)
  await page.waitForTimeout(350)
  return { ctx, page, errs }
}
async function openDrawer(page) {
  await page.focus('.mk-local__menu')
  await page.keyboard.press('Enter')
  await page.waitForSelector('.g-sidebar__drawer[open] button.g-sidebar__group-title', { timeout: 4000 })
  await page.waitForTimeout(450)
}

for (const eng of ENGINES) {
  const browser = await pw[eng].launch()

  // ---------- A · Estructura, paridad, tipografía, color y contraste: 4 anchos × claro/oscuro ----------
  for (const theme of ['claro', 'oscuro']) {
    for (const w of [1280, 1024, 768, 375]) {
      const narrow = w < 960
      const part = `${theme}/${w}`
      const { ctx, page, errs } = await open(browser, { w, theme })
      const sw = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth])
      rec(eng, part, 'sin desplazamiento horizontal', sw[0] <= sw[1], sw.join('/'))
      if (narrow) {
        rec(eng, part, 'por debajo de 960: sin columna', await page.evaluate((s) => !document.querySelector(s), SIDE))
        await openDrawer(page)
        await page.evaluate(() => { document.querySelector('.g-sidebar__drawer .g-sidebar__nav').scrollTop = 0 })
        await page.waitForTimeout(120)
      }
      const S = await page.evaluate((sel) => {
        const s = document.querySelector(sel)
        const q = (x) => s.querySelector(x)
        const cs = (e) => e && getComputedStyle(e)
        const groups = [...s.querySelectorAll('.g-sidebar__group')]
        const nav = q('.g-sidebar__nav')
        const cur = [...s.querySelectorAll('[aria-current="page"]')].filter((a) => a.getClientRects().length)
        const toggles = [...s.querySelectorAll('button.g-sidebar__group-title')]
        const host = s.closest('.g-sidebar__drawer') || s
        const dlg = s.closest('.g-sidebar__drawer')
        const t0 = q('.g-sidebar__group-title'), l0 = q('.g-sidebar__link'), chev = q('button.g-sidebar__group-title svg'), code = q('.g-sidebar__code'), mark = q('.g-sidebar__mark')
        return {
          box: __b(host), bg: cs(s).backgroundColor, borderEnd: cs(s).borderInlineEndWidth, backdrop: dlg ? getComputedStyle(dlg, '::backdrop').backgroundColor : null,
          groups: groups.length, links: s.querySelectorAll('.g-sidebar__link').length,
          g0: __b(groups[0]), g1Border: cs(groups[1]).borderTopWidth + ' ' + cs(groups[1]).borderTopColor, g0Pad: [cs(groups[0]).paddingTop, cs(groups[0]).paddingBottom],
          t0: __b(t0), t0Style: [cs(t0).fontSize, cs(t0).fontWeight, cs(t0).lineHeight, cs(t0).color, cs(t0).fontFamily], t0Button: t0.tagName === 'BUTTON',
          b0: __b(toggles[0]), b0Style: toggles[0] && [cs(toggles[0]).fontSize, cs(toggles[0]).fontWeight, cs(toggles[0]).lineHeight, cs(toggles[0]).color, cs(toggles[0]).backgroundColor],
          l0: __b(l0), l0Style: [cs(l0).fontSize, cs(l0).fontWeight, cs(l0).lineHeight, cs(l0).color, cs(l0).fontFamily],
          cur: cur.map((a) => a.querySelector('.g-sidebar__label').textContent.trim()), curBox: __b(cur[0]), curColor: cur[0] && cs(cur[0]).color, curWeight: cur[0] && cs(cur[0]).fontWeight,
          curCode: cur[0] && cs(cur[0].querySelector('.g-sidebar__code')).color,
          mark: mark && mark.classList.contains('is-full') ? __b(mark) : null, markColor: mark && cs(mark).backgroundColor, markCls: mark && mark.className,
          toggles: toggles.length, togglesOk: toggles.every((b) => b.getAttribute('aria-expanded') === 'true' && document.getElementById(b.getAttribute('aria-controls'))),
          chev: __b(chev), chevColor: chev && cs(chev).color, chevRot: chev && cs(chev).rotate,
          icons: [...s.querySelectorAll('.g-sidebar__link .g-sidebar__icon')].filter((e) => e.getClientRects().length).length,
          code: __b(code), codeColor: code && cs(code).color, codeStyle: code && [cs(code).fontSize, cs(code).fontVariantNumeric],
          linkRight: __b(l0).x + __b(l0).w,
          filter: __b(q('.g-sidebar__filter-box')), filterVisible: !!q('.g-sidebar__filter-input') && q('.g-sidebar__filter-input').getClientRects().length > 0,
          count: __b(q('.g-sidebar__filter-count')), countInDom: !!q('.g-sidebar__filter-count') && !!q('.g-sidebar__filter-count').textContent.trim(),
          logo: __b(q('.g-sidebar__logo')), logoShown: !!q('.g-sidebar__logo') && q('.g-sidebar__logo').getClientRects().length > 0 && cs(q('.g-sidebar__logo')).display !== 'none',
          headLine: cs(q('.g-sidebar__head'), '::after') && getComputedStyle(q('.g-sidebar__head'), '::after').top, headLineContent: getComputedStyle(q('.g-sidebar__head'), '::after').content,
          close: __b(q('.g-sidebar__toggle')), closeShown: !!q('.g-sidebar__toggle') && q('.g-sidebar__toggle').getClientRects().length > 0,
          tok: { text: __tok('--g-color-text'), muted: __tok('--g-color-text-muted'), subtle: __tok('--g-color-text-subtle'), accent: __tok('--g-color-accent-text'), border: __tok('--g-color-border'), sunken: __tok('--g-color-surface-sunken'), focus: __tok('--g-color-focus') },
          placeholder: q('.g-sidebar__filter-input') && getComputedStyle(q('.g-sidebar__filter-input'), '::placeholder').color,
          sansUi: getComputedStyle(document.documentElement).getPropertyValue('--g-font-ui').trim()
        }
      }, narrow ? DRAWER : SIDE)
      rec(eng, part, '10 grupos y 87 enlaces', S.groups === 10 && S.links === 87, `${S.groups}/${S.links}`)
      rec(eng, part, 'un solo actual visible: GCombobox', S.cur.length === 1 && S.cur[0] === 'GCombobox', JSON.stringify(S.cur))
      rec(eng, part, '«Guía» es span; 9 botones de grupo con aria-expanded y aria-controls', !S.t0Button && S.toggles === 9 && S.togglesOk)
      rec(eng, part, 'sin iconos en los enlaces', S.icons === 0, S.icons)
      rec(eng, part, 'sin borde de columna', S.borderEnd === '0px', S.borderEnd)
      rec(eng, part, 'título 14/24, 700 (ranura del sitio), text, letra de la interfaz', S.t0Style[0] === '14px' && S.t0Style[1] === '700' && S.t0Style[2] === '24px' && S.t0Style[3] === S.tok.text, S.t0Style.join(' | '))
      rec(eng, part, 'botón de grupo con la letra del título y sin fondo', S.b0Style && S.b0Style[0] === '14px' && S.b0Style[1] === '700' && S.b0Style[2] === '24px' && S.b0Style[3] === S.tok.text && /rgba\(0, 0, 0, 0\)|transparent/.test(S.b0Style[4]), S.b0Style && S.b0Style.join(' | '))
      rec(eng, part, 'enlace 14/24, 500, text-muted, misma familia que el título', S.l0Style[0] === '14px' && S.l0Style[1] === '500' && S.l0Style[2] === '24px' && S.l0Style[3] === S.tok.muted && S.l0Style[4] === S.t0Style[4], S.l0Style.join(' | '))
      rec(eng, part, 'fila del enlace 32', Math.abs(S.l0.h - 32) < 0.6, S.l0.h)
      rec(eng, part, 'título y botón de grupo de 32', Math.abs(S.t0.h - 32) < 0.6 && Math.abs(S.b0.h - 32) < 0.6, `${S.t0.h}/${S.b0.h}`)
      rec(eng, part, 'actual en accent-text con el mismo peso (500)', S.curColor === S.tok.accent && S.curWeight === '500', `${S.curColor} ${S.curWeight}`)
      rec(eng, part, 'número del actual en accent-text', S.curCode === S.tok.accent, S.curCode)
      rec(eng, part, 'separador de 1 px en border entre grupos', S.g1Border.startsWith('1px') && S.g1Border.endsWith(S.tok.border), S.g1Border)
      rec(eng, part, 'relleno del grupo abierto 10/24 (0/24 el primero del cajón)', S.g0Pad[0] === (narrow ? '0px' : '10px') && S.g0Pad[1] === '24px', S.g0Pad.join(' '))
      rec(eng, part, 'fondo surface-sunken', S.bg === S.tok.sunken, S.bg)
      rec(eng, part, 'número: caption 12, cifras tabulares, text-subtle, al final y dentro de la fila', S.code && S.codeStyle[0] === '12px' && /tabular-nums/.test(S.codeStyle[1]) && S.codeColor === S.tok.subtle && Math.abs(S.code.x + S.code.w - S.linkRight) <= 0.6, JSON.stringify([S.code, S.codeStyle, S.codeColor]))
      rec(eng, part, 'flecha 18 × 18, centro a 9 del borde del contenido, girada (abierto)', S.chev && Math.abs(S.chev.w - 18) <= 0.6 && Math.abs(S.chev.x + S.chev.w / 2 - (S.linkRight - 9)) <= 1 && S.chevRot === '90deg', JSON.stringify([S.chev, S.chevRot]))
      rec(eng, part, 'recuento oculto a la vista con el campo vacío y presente en el DOM', S.count && S.count.w <= 1 && S.countInDom, JSON.stringify(S.count))
      const C = await page.evaluate((t) => ({
        enlace: __ratio(t.muted, t.sunken), titulo: __ratio(t.text, t.sunken), actual: __ratio(t.accent, t.sunken), actualVsVecino: __ratio(t.accent, t.muted),
        marca: __ratio(t.accent, t.sunken), numero: __ratio(t.subtle, t.sunken), hoverSobreLuz: __ratio(t.text, __over(t.border, t.sunken)), foco: __ratio(t.focus, t.sunken)
      }), S.tok)
      C.flecha = await page.evaluate(([a, b]) => __ratio(a, b), [S.chevColor, S.tok.sunken])
      C.textoEjemplo = S.placeholder ? await page.evaluate(([a, b]) => __ratio(a, b), [S.placeholder, S.tok.sunken]) : null
      if (eng === 'chromium' && (w === 1280 || w === 375)) CONTRASTE.push({ tema: 'defecto', theme, w, ...C })
      rec(eng, part, 'enlace ≥ 4.5:1', C.enlace >= 4.5, C.enlace)
      rec(eng, part, 'actual ≥ 4.5:1', C.actual >= 4.5, C.actual)
      rec(eng, part, 'número ≥ 4.5:1', C.numero >= 4.5, C.numero)
      rec(eng, part, 'hover: text sobre la luz ≥ 4.5:1', C.hoverSobreLuz >= 4.5, C.hoverSobreLuz)
      rec(eng, part, 'marca (forma) ≥ 3:1', C.marca >= 3, C.marca)
      rec(eng, part, 'flecha (forma) ≥ 3:1', C.flecha >= 3, C.flecha)
      rec(eng, part, 'anillo de foco ≥ 3:1', C.foco >= 3, C.foco)
      if (C.textoEjemplo != null) rec(eng, part, 'texto de ejemplo del filtro ≥ 4.5:1', C.textoEjemplo >= 4.5, C.textoEjemplo)

      if (narrow) {
        const refW = w < 384 ? w - 64 : 320
        rec(eng, part, `cajón de ${refW} (320 o el visor − 64)`, Math.abs(S.box.w - refW) < 0.6, S.box.w)
        rec(eng, part, 'velo del sitio rgb(0 0 0 / .6)', /rgba\(0, 0, 0, 0\.6\)/.test(S.backdrop), S.backdrop)
        rec(eng, part, 'cajón: sin logo ni línea de banda; filtro y cerrar en la primera fila (32), a 32 del borde', !S.logoShown && S.headLineContent === 'none' && S.filterVisible && S.closeShown && Math.abs(S.filter.y - 32) <= 0.6 && Math.abs(S.filter.h - 32) <= 0.6 && Math.abs(S.filter.x - 32) <= 0.6 && Math.abs(S.close.y - 32) <= 0.6 && S.close.x + S.close.w <= S.box.w - 31.4, JSON.stringify([S.filter, S.close]))
      } else {
        rec(eng, part, 'la línea de la banda a 63', parseFloat(S.headLine) === 63, S.headLine)
        rec(eng, part, 'marca 2 × 20 a x = 15, centrada en la fila del actual', S.mark && S.mark.x === 15 && S.mark.w === 2 && S.mark.h === 20 && Math.abs(S.mark.y - (S.curBox.y + 6)) <= 0.6, JSON.stringify([S.mark, S.curBox]))
        rec(eng, part, 'marca llena en accent-text', S.markColor === S.tok.accent, S.markColor)
        rec(eng, part, 'F1: filtro 120 × 32 en la banda, al final, sin pisar el logo', S.filter && Math.abs(S.filter.w - 120) <= 0.6 && Math.abs(S.filter.h - 32) <= 0.6 && Math.abs(S.filter.y - 16) <= 0.6 && Math.abs(S.filter.x + S.filter.w - 240) <= 0.6 && S.logoShown, JSON.stringify(S.filter))
      }

      // Paridad con el original (en los tres motores): estructura Δ 0 (≤ 0,5), piezas (marca, flecha) Δ ≤ 2. En el cajón la
      // lista baja 32 (la fila del filtro y cerrar, desviación aceptada en sitio-marco.md §12): se compara con y − 32
      const ref = REF.paginas[`combobox-${w}-${theme}`]
      if (ref && ref.sidebar) {
        const ox = ref.sidebar.box.x
        const rel = (b) => b && { x: b.x - ox, y: b.y, w: b.w, h: b.h }
        const refBox = narrow ? { x: 0, y: 0, w: w < 384 ? w - 64 : 320, h: ref.sidebar.box.h } : rel(ref.sidebar.box)
        const dyN = narrow ? 32 : 0
        const ours = { columna: S.box, grupo: S.g0, título: S.t0, enlace: S.l0, actual: S.curBox, marca: S.mark }
        const refs = { columna: refBox, grupo: rel(ref.sidebarGroup.box), título: rel(ref.sidebarGroupTitle.box), enlace: rel(ref.sidebarLink.box), actual: rel(ref.sidebarLinkActive.box), marca: rel(ref.sidebarActiveIndicator.box) }
        for (const k of Object.keys(ours)) {
          const o = ours[k], r = refs[k]
          if (!o || !r) { PAR.push({ eng, vista: part, pieza: k, ref: r, banco: o, nota: 'sin dato' }); continue }
          // En el cajón el actual se compara solo en x, ancho y alto (la lista se trae al actual al abrir, I5)
          const yRef = k === 'columna' ? r.y : r.y + dyN
          const d = { dx: Math.round((o.x - r.x) * 10) / 10, dy: Math.round((o.y - yRef) * 10) / 10, dw: Math.round((o.w - r.w) * 10) / 10, dh: Math.round((o.h - r.h) * 10) / 10 }
          if (narrow && k === 'actual') d.dy = 0
          if (narrow && k === 'columna') d.dh = 0
          PAR.push({ eng, vista: part, pieza: k, ref: r, banco: o, ...d })
          const tol = k === 'marca' ? 2 : 0.5
          rec(eng, part, `paridad · ${k} Δ ≤ ${tol}`, Math.max(Math.abs(d.dx), Math.abs(d.dy), Math.abs(d.dw), Math.abs(d.dh)) <= tol, JSON.stringify(d))
        }
        rec(eng, part, 'paridad · color del título, el enlace, el actual y el fondo iguales al original', S.t0Style[3] === ref.sidebarGroupTitle.style.color && S.l0Style[3] === ref.sidebarLink.style.color && S.curColor === ref.sidebarLinkActive.style.color && S.bg === ref.sidebar.style.backgroundColor,
          JSON.stringify([S.t0Style[3], ref.sidebarGroupTitle.style.color, S.l0Style[3], ref.sidebarLink.style.color, S.curColor, ref.sidebarLinkActive.style.color, S.bg, ref.sidebar.style.backgroundColor]))
        rec(eng, part, 'paridad · tipografía del título y del enlace igual al original (tamaño, peso, interlínea)', ref.sidebarGroupTitle.style.fontSize === S.t0Style[0] && String(ref.sidebarGroupTitle.style.fontWeight) === S.t0Style[1] && ref.sidebarLink.style.fontSize === S.l0Style[0] && String(ref.sidebarLink.style.fontWeight) === S.l0Style[1] && (ref.sidebarLink.style.lineHeight || '24px') === S.l0Style[2],
          JSON.stringify([ref.sidebarGroupTitle.style, ref.sidebarLink.style].map((x) => [x.fontSize, x.fontWeight, x.lineHeight])))
      }
      rec(eng, part, 'consola limpia', errs.length === 0, errs.slice(0, 2).join(' | '))
      if (SHOTS && eng === 'chromium' && (w === 1280 || w === 375)) await page.screenshot({ path: join(HERE, `banco-${w}-${theme}.png`) })
      await ctx.close()
    }
  }

  // ---------- B · Comportamiento a 1280 (estados que pinta el CSS) ----------
  {
    const part = 'comportamiento/1280'
    const { ctx, page, errs } = await open(browser, { w: 1280 })
    const s = SIDE
    const before = await page.evaluate((s) => __b(document.querySelectorAll(s + ' .g-sidebar__group')[3]).y, s)
    await page.evaluate((s) => __tg(s, 'Acciones y navegación').click(), s)
    await page.waitForTimeout(80)
    const mid = await page.evaluate((s) => { const b = __tg(s, 'Acciones y navegación'); const li = b.closest('.g-sidebar__group'); const body = document.getElementById(b.getAttribute('aria-controls')); return { h: __b(body).h, op: getComputedStyle(body).opacity, clip: getComputedStyle(body.firstElementChild).overflowY, cls: li.className } }, s)
    await page.waitForTimeout(450)
    const B1 = await page.evaluate((s) => {
      const b = __tg(s, 'Acciones y navegación'); const body = document.getElementById(b.getAttribute('aria-controls')); const li = b.closest('.g-sidebar__group')
      return { exp: b.getAttribute('aria-expanded'), hidden: body.getAttribute('hidden'), h: __b(body).h, focusable: [...body.querySelectorAll('a')].some((a) => (a.checkVisibility ? a.checkVisibility() : a.getClientRects().length > 0)), pb: getComputedStyle(li).paddingBottom, next: __b(document.querySelectorAll(s + ' .g-sidebar__group')[3]).y, rot: getComputedStyle(b.querySelector('svg')).rotate, title: __b(b) }
    }, s)
    rec(eng, part, 'plegando: la rejilla se mueve, recorta en bloque y el contenido se funde', mid.h > 0 && mid.h < 300 && mid.clip === 'clip' && parseFloat(mid.op) < 1, JSON.stringify(mid))
    rec(eng, part, 'plegado: aria-expanded=false, cuerpo hidden y de alto 0, sin enlaces alcanzables', B1.exp === 'false' && B1.hidden !== null && B1.h === 0 && !B1.focusable, JSON.stringify(B1))
    rec(eng, part, 'plegado: relleno inferior 10, el grupo siguiente sube, la flecha apunta al final', B1.pb === '10px' && B1.next < before && (B1.rot === 'none' || B1.rot === '0deg'), `${B1.pb} · ${before} → ${B1.next} · ${B1.rot}`)
    rec(eng, part, 'el título no se mueve al plegar', Math.abs(B1.title.h - 32) < 0.6)
    await page.evaluate((s) => __tg(s, 'Acciones y navegación').focus(), s)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(450)
    rec(eng, part, 'Intro despliega', await page.evaluate((s) => __tg(s, 'Acciones y navegación').getAttribute('aria-expanded') === 'true', s))
    const ring = await page.evaluate((s) => { const b = __tg(s, 'Acciones y navegación'); const cs = getComputedStyle(b); return { st: cs.outlineStyle, w: cs.outlineWidth, c: cs.outlineColor, f: __tok('--g-color-focus'), off: cs.outlineOffset } }, s)
    rec(eng, part, 'foco visible en el botón de grupo (anillo ≥ 2 px del color de foco, por fuera)', ring.st !== 'none' && parseFloat(ring.w) >= 2 && ring.c === ring.f && parseFloat(ring.off) >= 0, JSON.stringify(ring))
    await page.keyboard.press('Space')
    await page.waitForTimeout(450)
    rec(eng, part, 'Espacio pliega', await page.evaluate((s) => __tg(s, 'Acciones y navegación').getAttribute('aria-expanded') === 'false', s))

    // La marca hueca en el título del grupo plegado del actual
    await page.evaluate((s) => __tg(s, 'Campos de entrada').click(), s)
    await page.waitForTimeout(600)
    const B2 = await page.evaluate((s) => { const m = document.querySelector(s + ' .g-sidebar__mark'); const t = __tg(s, 'Campos de entrada'); const cs = getComputedStyle(m); return { cls: m.className, my: __b(m).y, mx: __b(m).x, ty: __b(t).y + 6, bg: cs.backgroundColor, bc: cs.borderTopColor, bw: cs.borderTopWidth, op: cs.opacity, acc: __tok('--g-color-accent-text'), sr: t.querySelector('.g-sidebar__sr') && t.querySelector('.g-sidebar__sr').getClientRects().length <= 1 } }, s)
    rec(eng, part, 'grupo del actual plegado: marca hueca (contorno 1 px accent-text, sin relleno) en la fila del título', /is-hollow/.test(B2.cls) && Math.abs(B2.my - B2.ty) <= 1 && B2.mx === 15 && /rgba\(0, 0, 0, 0\)|transparent/.test(B2.bg) && B2.bc === B2.acc && B2.bw === '1px' && B2.op === '1', JSON.stringify(B2))
    if (SHOTS && eng === 'chromium') await page.screenshot({ path: join(HERE, 'banco-estado-plegado-1280-claro.png'), clip: { x: 0, y: 0, width: 400, height: 800 } })

    // La ruta abre el grupo del nuevo actual y la marca llega a su fila
    await page.evaluate(() => { window.__marco.current = 'c-input' })
    await page.waitForTimeout(700)
    const B3 = await page.evaluate((s) => { const a = document.querySelector(s + ' [aria-current="page"]'); const m = document.querySelector(s + ' .g-sidebar__mark'); return { cur: a.querySelector('.g-sidebar__label').textContent, exp: __tg(s, 'Campos de entrada').getAttribute('aria-expanded'), my: __b(m).y, ay: __b(a).y + 6, cls: m.className } }, s)
    rec(eng, part, 'la ruta abre el grupo y la marca llena llega a la fila del nuevo actual', B3.cur === 'GInput' && B3.exp === 'true' && /is-full/.test(B3.cls) && Math.abs(B3.my - B3.ay) <= 1, JSON.stringify(B3))

    // I2 · la marca viaja con el muelle: a mitad no está; al final, ±1; sobrepaso medido por cuadro
    const tr = await page.evaluate((s) => { const cs = getComputedStyle(document.querySelector(s + ' .g-sidebar__mark')); return cs.transitionProperty + ' | ' + cs.transitionTimingFunction }, s)
    rec(eng, part, 'la marca anima translate con el muelle (linear(…))', /translate/.test(tr) && /linear\(/.test(tr), tr)
    const travel = async (id) => page.evaluate(async ([s, id]) => {
      const a = document.querySelector(s + ` [data-id="${id}"]`)
      const m = document.querySelector(s + ' .g-sidebar__mark')
      const y0 = __b(m).y
      a.click()
      const ys = []
      const t0 = performance.now()
      while (performance.now() - t0 < 500) { await new Promise((r) => requestAnimationFrame(r)); ys.push(__b(m).y) }
      const target = __b(a).y + 6
      const dir = Math.sign(target - y0)
      const over = Math.max(0, ...ys.map((y) => (y - target) * dir))
      return { y0, target, dist: Math.round(Math.abs(target - y0)), mid: ys[3], end: ys[ys.length - 1], over: Math.round(over * 10) / 10, cur: a.getAttribute('aria-current') }
    }, [s, id])
    const near = await travel('c-textarea')
    rec(eng, part, 'clic en la fila de al lado: aria-current pasa, la marca viaja y llega (±1)', near.cur === 'page' && Math.abs(near.mid - near.target) > 1 && Math.abs(near.end - near.target) <= 1, JSON.stringify(near))
    rec(eng, part, `sobrepaso del muelle en un paso de una fila (${near.dist} px) ≤ 2 px`, near.over <= 2, near.over)
    const far = await travel('c-app-shell')
    NOTAS.push(`${eng}: sobrepaso de la marca en un salto de ${far.dist} px = ${far.over} px (is-far, sin muelle, #1071); en una fila (${near.dist} px) = ${near.over} px`)
    rec(eng, part, `salto largo (${far.dist} px, is-far #1071): sobrepaso ≤ 2 px`, far.over <= 2, far.over)
    rec(eng, part, 'salto largo: la marca llega (±1)', Math.abs(far.end - far.target) <= 1, JSON.stringify(far))

    // I1 · la luz ensanchada, hover en text y el actual que no lo hereda
    await page.hover(`${s} .g-sidebar__link[data-id="c-table"]`)
    await page.waitForTimeout(300)
    const B5 = await page.evaluate((s) => { const a = document.querySelector(s + ' [data-id="c-table"]'); const ul = a.closest('.g-sidebar__list'); const hl = ul.querySelector('.g-sidebar__highlight'); return { on: ul.classList.contains('has-highlight'), hl: __b(hl), a: __b(a), color: getComputedStyle(a).color, text: __tok('--g-color-text'), r: getComputedStyle(hl).borderTopLeftRadius, sm: getComputedStyle(document.documentElement).getPropertyValue('--g-radius-sm').trim() } }, s)
    rec(eng, part, 'hover: luz bajo la fila, 8 px por fuera a cada lado, alto de la fila, radio sm', B5.on && Math.abs(B5.hl.x - (B5.a.x - 8)) <= 1 && Math.abs(B5.hl.w - (B5.a.w + 16)) <= 1 && Math.abs(B5.hl.h - B5.a.h) <= 1 && B5.r === B5.sm, JSON.stringify([B5.hl, B5.a, B5.r]))
    rec(eng, part, 'hover en text', B5.color === B5.text, B5.color)
    await page.hover(`${s} [aria-current="page"]`)
    await page.waitForTimeout(250)
    rec(eng, part, 'hover sobre el actual: sigue en accent-text (I1)', await page.evaluate((s) => getComputedStyle(document.querySelector(s + ' [aria-current="page"]')).color === __tok('--g-color-accent-text'), s))

    // I3 · «/» enfoca: el campo crece a 208 y tapa el logo; recuento con texto; Esc lo devuelve
    await page.mouse.move(700, 400)
    await page.click('.mk-content h1')
    await page.keyboard.press('/')
    await page.waitForTimeout(120)
    const growMid = await page.evaluate((s) => __b(document.querySelector(s + ' .g-sidebar__filter-box')).w, s)
    await page.waitForTimeout(350)
    const B6a = await page.evaluate((s) => { const fb = document.querySelector(s + ' .g-sidebar__filter-box'); const cs = getComputedStyle(fb); return { focus: document.activeElement.classList.contains('g-sidebar__filter-input'), fb: __b(fb), logo: getComputedStyle(document.querySelector(s + ' .g-sidebar__logo')).visibility, border: cs.borderTopColor, ctl: __tok('--g-color-border-control'), outline: cs.outlineStyle, ow: cs.outlineWidth } }, s)
    rec(eng, part, '«/» enfoca: el campo crece a 208 (con transición) y tapa el logo', B6a.focus && Math.abs(B6a.fb.w - 208) <= 1 && growMid > 120 && growMid < 208 && B6a.logo === 'hidden', JSON.stringify({ ...B6a, growMid }))
    rec(eng, part, 'campo enfocado: borde de control y anillo de foco', B6a.border === B6a.ctl && B6a.outline !== 'none' && parseFloat(B6a.ow) >= 2, JSON.stringify(B6a))
    await page.keyboard.type('tabs')
    await page.waitForTimeout(400)
    const B6b = await page.evaluate((s) => {
      const b = __tg(s, 'Acciones y navegación'); const body = document.getElementById(b.getAttribute('aria-controls'))
      const vis = [...document.querySelectorAll(s + ' .g-sidebar__link')].filter(__vis).map((a) => a.querySelector('.g-sidebar__label').textContent)
      const c = document.querySelector(s + ' .g-sidebar__filter-count')
      return { exp: b.getAttribute('aria-expanded'), dis: b.getAttribute('aria-disabled'), h: __b(body).h, op: getComputedStyle(body).opacity, vis, count: c.textContent, countBox: __b(c), countColor: getComputedStyle(c).color, muted: __tok('--g-color-text-muted'), list: __b(document.querySelector(s + ' .g-sidebar__nav')).y }
    }, s)
    rec(eng, part, 'con texto: el grupo plegado con coincidencias se pinta abierto, entero y opaco', B6b.exp === 'true' && B6b.h > 0 && B6b.op === '1' && B6b.vis.includes('GTabs'), JSON.stringify(B6b))
    rec(eng, part, 'con texto: el recuento se ve en una línea bajo la banda (text-muted)', B6b.countBox.w > 1 && B6b.countBox.y >= 64 && B6b.countBox.h <= 24 && B6b.countColor === B6b.muted, JSON.stringify(B6b.countBox))
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
    const B6c = await page.evaluate((s) => ({ exp: __tg(s, 'Acciones y navegación').getAttribute('aria-expanded'), count: __b(document.querySelector(s + ' .g-sidebar__filter-count')).w, q: document.querySelector(s + ' .g-sidebar__filter-input').value }), s)
    rec(eng, part, 'Esc vacía: el grupo vuelve a plegado y el recuento a oculto', B6c.q === '' && B6c.exp === 'false' && B6c.count <= 1, JSON.stringify(B6c))
    await page.click('.mk-content h1')
    await page.waitForTimeout(450)
    rec(eng, part, 'al salir vacío, el campo vuelve a 120 y el logo a la vista', await page.evaluate((s) => Math.abs(__b(document.querySelector(s + ' .g-sidebar__filter-box')).w - 120) <= 1 && getComputedStyle(document.querySelector(s + ' .g-sidebar__logo')).visibility === 'visible', s))

    // Indicador estático (SSR): sin has-mark, la fila del actual lleva su ::before de 2 × 20 a 15
    const ST = await page.evaluate((s) => {
      const nav = document.querySelector(s + ' .g-sidebar__nav'); nav.classList.remove('has-mark')
      const a = document.querySelector(s + ' .g-sidebar__item > .g-sidebar__link[aria-current="page"]'); const cs = getComputedStyle(a, '::before'); const ar = __b(a)
      const out = { content: cs.content, w: cs.width, h: cs.height, left: ar.x + parseFloat(cs.left), bg: cs.backgroundColor, acc: __tok('--g-color-accent-text') }
      nav.classList.add('has-mark'); out.after = getComputedStyle(a, '::before').content
      return out
    }, s)
    rec(eng, part, 'SSR: sin has-mark, indicador estático 2 × 20 a x = 15 en accent-text; con has-mark se apaga', ST.content !== 'none' && ST.w === '2px' && ST.h === '20px' && Math.abs(ST.left - 15) <= 0.6 && ST.bg === ST.acc && ST.after === 'none', JSON.stringify(ST))
    rec(eng, part, 'consola limpia', errs.length === 0, errs.slice(0, 2).join(' | '))
    await ctx.close()
  }

  // ---------- B9 · movimiento reducido ----------
  {
    const part = 'reducido/1280'
    const { ctx, page } = await open(browser, { w: 1280, reduce: true })
    const s = SIDE
    const tr = await page.evaluate((s) => getComputedStyle(document.querySelector(s + ' .g-sidebar__mark')).transitionProperty, s)
    rec(eng, part, 'la marca sin translate (solo fundido)', !/translate/.test(tr) && /opacity/.test(tr), tr)
    await page.evaluate((s) => __tg(s, 'Datos').click(), s)
    await page.waitForTimeout(120)
    rec(eng, part, 'el plegado es inmediato', await page.evaluate((s) => { const b = __tg(s, 'Datos'); const body = document.getElementById(b.getAttribute('aria-controls')); return __b(body).h === 0 }, s))
    const ft = await page.evaluate((s) => getComputedStyle(document.querySelector(s + ' .g-sidebar__filter-box')).transitionProperty, s)
    rec(eng, part, 'el filtro crece sin transición', !/inline-size|width/.test(ft), ft)
    await ctx.close()
  }

  // ---------- C · Cajón: pointer coarse (≥ 44) y estado compartido ----------
  {
    const part = 'cajón táctil/375'
    const { ctx, page } = await open(browser, { w: 375, ctxOpts: { hasTouch: true, isMobile: eng !== 'firefox' } })
    const coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches)
    if (!coarse) NOTAS.push(`${eng}: pointer: coarse no se emula; área táctil medida solo donde se emula`)
    await openDrawer(page)
    const T = await page.evaluate((s) => {
      const r = document.querySelector(s)
      const min = (sel) => Math.min(...[...r.querySelectorAll(sel)].filter((e) => e.getClientRects().length).map((e) => Math.min(__b(e).h, __b(e).w)))
      return { link: min('.g-sidebar__link'), btn: min('button.g-sidebar__group-title'), close: min('.g-sidebar__toggle'), field: __b(r.querySelector('.g-sidebar__filter-box')).h, fs: getComputedStyle(r.querySelector('.g-sidebar__filter-input')).fontSize }
    }, DRAWER)
    if (coarse) rec(eng, part, 'filas, botones de grupo, cerrar y campo ≥ 44; texto editable 16', T.link >= 44 && T.btn >= 44 && T.close >= 44 && T.field >= 44 && T.fs === '16px', JSON.stringify(T))
    await page.evaluate((s) => __tg(s, 'Paneles').click(), DRAWER)
    await page.waitForTimeout(450)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
    await openDrawer(page)
    rec(eng, part, 'el plegado se conserva al volver a abrir', await page.evaluate((s) => __tg(s, 'Paneles').getAttribute('aria-expanded') === 'false', DRAWER))
    rec(eng, part, 'el actual a la vista al abrir', await page.evaluate(() => { const a = document.querySelector('.g-sidebar__drawer [aria-current="page"]'); const n = document.querySelector('.g-sidebar__drawer .g-sidebar__nav'); const ar = __b(a), nr = __b(n); return ar.y >= nr.y && ar.y + ar.h <= nr.y + nr.h }))
    if (SHOTS && eng === 'chromium') await page.screenshot({ path: join(HERE, 'banco-estado-cajon-375-claro.png') })
    await ctx.close()
  }

  // ---------- D · RTL ----------
  {
    const part = 'rtl/1280'
    const { ctx, page, errs } = await open(browser, { w: 1280, q: '&dir=rtl' })
    const D = await page.evaluate((s) => {
      const r = document.querySelector(s); const rb = __b(r); const m = r.querySelector('.g-sidebar__mark'); const a = r.querySelector('[aria-current="page"]')
      const l = a.querySelector('.g-sidebar__label'), c = a.querySelector('.g-sidebar__code'); const svg = r.querySelector('button.g-sidebar__group-title svg')
      return { rb, m: __b(m), a: __b(a), l: __b(l), c: __b(c), rot: getComputedStyle(svg).rotate, scale: getComputedStyle(svg).scale, chev: __b(svg), fb: __b(r.querySelector('.g-sidebar__filter-box')), logo: __b(r.querySelector('.g-sidebar__logo')) }
    }, SIDE)
    rec(eng, part, 'marca a 15 del borde inicial (derecho)', D.m && Math.abs(D.rb.x + D.rb.w - 15 - (D.m.x + D.m.w)) <= 0.6, JSON.stringify([D.rb, D.m]))
    rec(eng, part, 'número al final (izquierda) y etiqueta al inicio', D.c.x < D.l.x && Math.abs(D.c.x - D.a.x) <= 0.6, JSON.stringify([D.c, D.l]))
    rec(eng, part, 'flecha abierta apunta abajo (espejo + −90°) y cae al final (izquierda)', D.rot === '-90deg' && /-1/.test(D.scale) && D.chev.x < D.rb.x + 60, JSON.stringify([D.rot, D.scale, D.chev]))
    rec(eng, part, 'F1 en RTL: el filtro al final (izquierda) de la banda', D.fb.x < D.logo.x + 30 && Math.abs(D.fb.x - (D.rb.x + 32)) <= 0.6, JSON.stringify([D.fb, D.logo]))
    rec(eng, part, 'consola limpia', errs.length === 0, errs.slice(0, 2).join(' | '))
    if (SHOTS && eng === 'chromium') await page.screenshot({ path: join(HERE, 'banco-rtl-1280-claro.png'), clip: { x: 980, y: 0, width: 300, height: 600 } })
    await ctx.close()
  }

  // ---------- G · Grupos plegables en la apariencia de siempre (#1061 regla 9) ----------
  {
    const part = 'default/1280'
    const { ctx, page, errs } = await open(browser, { w: 1280, q: '&ap=default' })
    const s = '.g-sidebar--appearance-default.g-sidebar--mode-expanded'
    const G = await page.evaluate((s) => {
      const r = document.querySelector(s); const b = __tg(s, 'Datos'); const cs = getComputedStyle(b); const svg = b.querySelector('svg'); const span = r.querySelector('span.g-sidebar__group-title'); const l = r.querySelector('.g-sidebar__link')
      return { tag: b.tagName, fs: cs.fontSize, color: cs.color, subtle: __tok('--g-color-text-subtle'), spanFs: getComputedStyle(span).fontSize, bh: __b(b).h, bw: __b(b).w, spanW: __b(span).w, svg: __b(svg), right: __b(b).x + __b(b).w, rot: getComputedStyle(svg).rotate, bg: cs.backgroundColor, border: cs.borderTopWidth, link: __b(l).h, icon: !!r.querySelector('.g-sidebar__link .g-sidebar__icon') }
    }, s)
    rec(eng, part, 'botón de grupo con el aspecto del título de siempre (caption, text-subtle, sin fondo ni borde)', G.tag === 'BUTTON' && G.fs === G.spanFs && G.color === G.subtle && /rgba\(0, 0, 0, 0\)|transparent/.test(G.bg) && G.border === '0px' && Math.abs(G.bw - G.spanW) <= 0.6, JSON.stringify(G))
    rec(eng, part, 'flecha de 16 al final, girada abierta; área ≥ 24', Math.abs(G.svg.w - 16) <= 0.6 && G.svg.x + G.svg.w <= G.right + 0.6 && G.svg.x + G.svg.w >= G.right - 16 && G.rot === '90deg' && G.bh >= 24, JSON.stringify(G))
    rec(eng, part, 'la apariencia de siempre no cambia (fila 40 + junta, iconos)', Math.abs(G.link - 42) <= 0.6 && G.icon, JSON.stringify(G))
    await page.evaluate((s) => __tg(s, 'Datos').click(), s)
    await page.waitForTimeout(500)
    const G2 = await page.evaluate((s) => { const b = __tg(s, 'Datos'); const body = document.getElementById(b.getAttribute('aria-controls')); return { exp: b.getAttribute('aria-expanded'), h: __b(body).h, rot: getComputedStyle(b.querySelector('svg')).rotate } }, s)
    rec(eng, part, 'plegar en la apariencia de siempre: cuerpo a 0 y la flecha al final', G2.exp === 'false' && G2.h === 0 && (G2.rot === 'none' || G2.rot === '0deg'), JSON.stringify(G2))
    await page.evaluate((s) => __tg(s, 'Datos').focus(), s)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(400)
    // En WebKit (macOS) Tab no para en botones: tras una tecla, el foco por programa también es :focus-visible
    await page.evaluate((s) => document.querySelector(s + ' .g-sidebar__link').focus(), s)
    await page.keyboard.press('Shift')
    await page.evaluate((s) => __tg(s, 'Datos').focus(), s)
    const ring = await page.evaluate(() => { const cs = getComputedStyle(document.activeElement); return { cls: document.activeElement.className, st: cs.outlineStyle, w: cs.outlineWidth } })
    rec(eng, part, 'foco visible en el botón de grupo', /g-sidebar__group-title/.test(ring.cls) && ring.st !== 'none' && parseFloat(ring.w) >= 2, JSON.stringify(ring))
    rec(eng, part, 'consola limpia', errs.length === 0, errs.slice(0, 2).join(' | '))
    if (SHOTS && eng === 'chromium') await page.screenshot({ path: join(HERE, 'banco-default-1280-claro.png'), clip: { x: 0, y: 0, width: 400, height: 800 } })
    await ctx.close()
  }

  // ---------- E · forced-colors (solo Chromium emula) ----------
  if (eng === 'chromium') {
    const part = 'forced-colors/1280'
    const { ctx, page } = await open(browser, { w: 1280, ctxOpts: { forcedColors: 'active' } })
    const F = await page.evaluate((s) => {
      const m = document.querySelector(s + ' .g-sidebar__mark'); const cs = getComputedStyle(m)
      const hl = document.createElement('span'); hl.style.color = 'Highlight'; document.body.appendChild(hl); const H = getComputedStyle(hl).color; hl.remove()
      return { fca: cs.forcedColorAdjust, bg: cs.backgroundColor, bc: cs.borderTopColor, H, op: cs.opacity, line: getComputedStyle(document.querySelector(s + ' .g-sidebar__head'), '::after').borderBottomStyle, sep: getComputedStyle(document.querySelectorAll(s + ' .g-sidebar__group')[1]).borderTopStyle }
    }, SIDE)
    rec(eng, part, 'la marca en Highlight y visible', F.fca === 'none' && F.bg === F.H && F.bc === F.H && F.op === '1', JSON.stringify(F))
    rec(eng, part, 'la línea de la banda y los separadores son bordes (sobreviven)', F.line === 'solid' && F.sep === 'solid', JSON.stringify(F))
    await page.evaluate((s) => __tg(s, 'Campos de entrada').click(), SIDE)
    await page.waitForTimeout(600)
    const F2 = await page.evaluate((s) => { const cs = getComputedStyle(document.querySelector(s + ' .g-sidebar__mark')); return { cls: document.querySelector(s + ' .g-sidebar__mark').className, bg: cs.backgroundColor, bc: cs.borderTopColor } }, SIDE)
    rec(eng, part, 'hueca: contorno Highlight sin relleno', /is-hollow/.test(F2.cls) && /rgba\(0, 0, 0, 0\)|transparent/.test(F2.bg) && F2.bc === F.H, JSON.stringify(F2))
    await ctx.close()
  }

  // ---------- F · Temas: contraste de las piezas del índice en los 11 temas de Dark Color Presence, claro y oscuro ----------
  if (eng === 'chromium') {
    for (const th of THEMES) for (const theme of ['claro', 'oscuro']) {
      const part = `tema ${th}/${theme}`
      const { ctx, page } = await open(browser, { w: 1280, theme, css: join(GEN_DIR, th + '.css') })
      await page.waitForTimeout(150)
      const C = await page.evaluate((s) => {
        const r = document.querySelector(s); const cs = (e, p = 'color') => getComputedStyle(e)[p]
        const bg = cs(r, 'backgroundColor'); const a = r.querySelector('[aria-current="page"]'); const l = r.querySelector('.g-sidebar__link:not([aria-current])'); const c = r.querySelector('.g-sidebar__link:not([aria-current]) .g-sidebar__code'); const t = r.querySelector('.g-sidebar__group-title'); const m = r.querySelector('.g-sidebar__mark'); const chev = r.querySelector('button.g-sidebar__group-title svg')
        return { enlace: __ratio(cs(l), bg), actual: __ratio(cs(a), bg), numero: __ratio(cs(c), bg), titulo: __ratio(cs(t), bg), marca: __ratio(cs(m, 'backgroundColor'), bg), flecha: __ratio(cs(chev), bg), hover: __ratio(__tok('--g-color-text'), __over(__tok('--g-color-border'), bg)), foco: __ratio(__tok('--g-color-focus'), bg) }
      }, SIDE)
      CONTRASTE.push({ tema: th, theme, ...C })
      rec(eng, part, 'texto ≥ 4.5:1 (enlace, número, título, hover sobre la luz)', C.enlace >= 4.5 && C.numero >= 4.5 && C.titulo >= 4.5 && C.hover >= 4.5, JSON.stringify(C))
      // El actual en accent-text sobre surface-sunken: el motor del tema garantiza accent-text sobre surface, no sobre
      // surface-sunken (tokens.md §17.23; el mismo caso de GFileField soft, 4,19:1). Se registra como hallazgo para lima
      if (C.actual < 4.5) HALLAZGOS.push(`tema ${th} ${theme}: el actual (accent-text) sobre la columna (surface-sunken) ${C.actual}:1 < 4,5`)
      rec(eng, part, 'formas ≥ 3:1 (marca, flecha, foco)', C.marca >= 3 && C.flecha >= 3 && C.foco >= 3, JSON.stringify(C))
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
for (const n of NOTAS) console.log('NOTA ' + n)
for (const h of HALLAZGOS) console.log('HALLAZGO ' + h)
const min = (k) => CONTRASTE.reduce((m, c) => (c[k] != null && c[k] < m.v ? { v: c[k], d: `${c.tema} ${c.theme}` } : m), { v: 99, d: '' })
const mins = Object.fromEntries(['enlace', 'actual', 'numero', 'titulo', 'marca', 'flecha', 'hover', 'hoverSobreLuz', 'foco'].map((k) => [k, min(k)]).filter(([, v]) => v.v < 99))
console.log('MÍNIMOS ' + JSON.stringify(mins))
await writeFile(join(HERE, 'resultados.json'), JSON.stringify({ fecha: new Date().toISOString().slice(0, 10), motores: ENGINES, por: by, total: `${ok}/${R.length}`, fallos: R.filter((r) => !r.ok), notas: NOTAS, hallazgos: HALLAZGOS, minimos: mins }, null, 1))
if (ENGINES.includes('chromium')) await writeFile(join(HERE, 'paridad.json'), JSON.stringify({ fecha: new Date().toISOString().slice(0, 10), piezas: PAR, contraste: CONTRASTE }, null, 1))
server.close()
process.exit(ok === R.length ? 0 : 1)
