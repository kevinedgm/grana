// Auditoría de coco (paso 5) sobre el GContainer REAL (GContainer.vue de bruno, principal) en dos bancos con componentes de
// dist/: el de bruno (packages/vue/playground/container.html, sin chasis) y el de la auditoría
// (design/lab/container/auditoria-banco.html: la página del prototipo de kiwi dentro de GAppShell con GSidebar, con
// GPageHeader de primer hijo, GSection, una tabla g-bleed, una banda g-bleed con zona de marca, GTable con g-bleed, GSurface y
// GDialog). Tema por defecto, generados claro y oscuro y el de prueba (space 5).
// Mide: columna = min(caja − 2 × margen, máximo) y márgenes publicados = reales; anidado (contenedor, GSurface, .g-dialog__body);
// B (bandas al borde de la caja, contenido en la columna, desplazable alineado en reposo y al final, GTable con g-bleed);
// A (prose y reading con la fuente de cada tema); L4 de GPageHeader (anotado); pegado a toda la página; RTL; 320×256;
// contraste de la banda con zona de marca; nada pintado; consola limpia. Capturas prototipo ↔ real (B, prose, reading).
// Requiere dist/ (npm run build). Desde la raíz:  GRANA_PW_PORT=4215 node design/lab/container/auditoria-verificar.mjs
import { pw, serve, stop, open, close, ok, note, near, report, settle, rect, px, toY, sy, overflowX, args, ENGINES, setEngine, sideBySide } from '../app-shell/auditoria-comun.mjs'
import { fileURLToPath } from 'node:url'
import { rm } from 'node:fs/promises'

const PARTS = (args.parts || 'base,bleed,prose,hosts,themes,shots').split(',')
const ORIGIN = await serve()
const BANCO = ORIGIN + '/design/lab/container/auditoria-banco.html'
const BRUNO = ORIGIN + '/packages/vue/playground/container.html'
const KIWI = ORIGIN + '/design/lab/container/r01/index.html'
const HERE = fileURLToPath(new URL('./', import.meta.url))
const READY = () => window.__ready && document.querySelector('#ct > .g-container__body')
const READY_B = () => document.querySelector('#c-main > .g-container__body')
const THEMES = [['', false], ['', true], ['spotify', false], ['spotify', true], ['medium', false], ['medium', true], ['cli:spotify', false], ['cli:spotify', true], ['cli:grana', false], ['cli:grana', true], ['prueba', false], ['prueba', true]]

// Geometría de la columna de un contenedor: caja, columna, publicados y el margen esperado por su clamp
const geo = (p, sel) => p.evaluate((sel) => {
  const root = document.querySelector(sel); const col = root.querySelector(':scope > .g-container__body')
  const r = root.getBoundingClientRect(), c = col.getBoundingClientRect(), cs = getComputedStyle(col)
  const pad = parseFloat(getComputedStyle(root).paddingLeft) + parseFloat(getComputedStyle(root).paddingRight)
  return { box: r.width - pad, boxL: r.left, boxR: r.right, colL: c.left, colR: c.right, colW: c.width, ins: parseFloat(cs.getPropertyValue('--g-container-inset-start')), ine: parseFloat(cs.getPropertyValue('--g-container-inset-end')), rtl: getComputedStyle(root).direction === 'rtl' }
}, sel)
const SPACE = (p) => p.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-space-1')))
const want = (box, s, max) => { const g = Math.min(Math.max(s * 4, box * 0.04), s * 12); return { g, col: Math.min(box - 2 * g, max) } }

for (const eng of ENGINES) {
  setEngine(eng)
  const b = await pw[eng].launch()
  const E = (m) => `${eng} ${m}`
  const O = async (qs = '', opts = {}) => { const p = await open(b, BANCO + qs, { ready: READY, wait: 500, ...opts }); p.__eng = eng; return p }

  /* ---------- 1 · Base: columna, márgenes publicados, anidado, pegado, L4 ---------- */
  if (PARTS.includes('base')) {
    for (const [vw, vh] of [[1440, 900], [1024, 768], [390, 800], [320, 256]]) {
      for (const dir of ['ltr', 'rtl']) {
        const p = await O(dir === 'rtl' ? '?dir=rtl' : '', { vw, vh })
        const s = await SPACE(p)
        const g = await geo(p, '#ct')
        const w = want(g.box, s, s * 192)
        const start = g.rtl ? g.boxR - g.colR : g.colL - g.boxL, end = g.rtl ? g.colL - g.boxL : g.boxR - g.colR
        ok(near(g.colW, w.col, 1) && near(start, end, 1), E(`${vw}×${vh} ${dir}: columna md = min(caja − 2 × margen, 768), centrada`), `${g.colW.toFixed(1)} vs ${w.col.toFixed(1)}`)
        ok(near(g.ins, start, 0.6) && near(g.ine, end, 0.6), E(`${vw}×${vh} ${dir}: márgenes publicados = reales`), `${g.ins}/${start.toFixed(1)}`)
        ok(!(await overflowX(p)), E(`${vw}×${vh} ${dir}: sin desplazamiento horizontal`))
        const fr = await rect(p, '.g-app-shell__frame')
        ok(near(g.boxL, fr.left) && near(g.boxR, fr.right), E(`${vw}×${vh} ${dir}: la caja del contenedor es el marco del chasis`))
        if (vw === 1440 && dir === 'ltr') {
          const n = await geo(p, '#nested')
          ok(near(n.boxL, g.colL) && near(n.colL, g.colL) && near(n.colW, Math.min(g.colW, s * 160), 1), E('anidado (sm, start): sin margen acumulado, empieza en la columna'), `${n.colL}/${g.colL}`)
          const h1 = await rect(p, '#ph h1'), p1 = await rect(p, '#p1'), act = await rect(p, '#ph .g-page-header__actions')
          note(`${eng} L4 (sin arreglar, decisión pendiente en GPageHeader.css): h1 en ${Math.round(h1.left)}, texto de la página en ${Math.round(p1.left)} (Δ ${Math.round(h1.left - p1.left)} px); acciones terminan en ${Math.round(act.right)}, la columna en ${Math.round(g.colR)} (Δ ${Math.round(g.colR - act.right)} px)`)
          ok(near(h1.left - p1.left, s * 6, 1), E('L4 medido: GPageHeader suma su relleno lateral (space × 6) al margen de la columna'), `${h1.left - p1.left}`)
          // Pegado a toda la página dentro del contenedor (#724)
          await toY(p, 1400)
          const base = await rect(p, '#ph .g-page-header__base'), hd = await rect(p, '.g-app-shell__header')
          ok(await p.evaluate(() => document.getElementById('ph').classList.contains('is-stuck')) && near(base.top, hd.bottom), E('GPageHeader primer hijo: el zócalo se pega bajo la banda a toda la página'), `${base.top}/${hd.bottom}`)
          ok(near(base.left, g.colL, 1) && near(base.right, g.colR, 1), E('GPageHeader primer hijo: el zócalo pegado ocupa la columna'), `${base.left}/${g.colL} ${base.right}/${g.colR}`)
        }
        if (vw === 320) {
          const u = await p.evaluate(() => { const e = document.getElementById('p1'); return e.scrollWidth <= e.clientWidth + 1 })
          ok(u, E('320×256: la prosa cabe en la columna'))
        }
        await close(p, `base ${vw} ${dir}`)
      }
    }
    // Banco de bruno sin chasis: as="main", anchos y la URL larga
    for (const [w, maxF] of [['sm', 160], ['lg', 256], ['xl', 320], ['full', 0]]) {
      const p = await open(b, BRUNO + `?width=${w}`, { ready: READY_B, vw: 1440 }); p.__eng = eng
      const s = await SPACE(p), g = await geo(p, '#c-main')
      const ww = want(g.box, s, maxF ? s * maxF : Infinity)
      ok(near(g.colW, ww.col, 1), E(`sin chasis (main) width=${w}: columna ${ww.col.toFixed(0)}`), `${g.colW}`)
      await close(p, `bruno ${w}`)
    }
    const p = await open(b, BRUNO, { ready: READY_B, vw: 320, vh: 256 }); p.__eng = eng
    ok(!(await overflowX(p)) && await p.evaluate(() => { const e = document.getElementById('url'); return e.getBoundingClientRect().right <= document.querySelector('#c-main > .g-container__body').getBoundingClientRect().right + 1 }), E('sin chasis 320×256: la URL larga se parte dentro de la columna'))
    await close(p, 'bruno 320')
  }

  /* ---------- 2 · B · Sangrado alineado con piezas reales ---------- */
  if (PARTS.includes('bleed')) {
    for (const [vw, dir] of [[1440, 'ltr'], [1440, 'rtl'], [390, 'ltr']]) {
      const p = await O(dir === 'rtl' ? '?dir=rtl' : '', { vw })
      const g = await geo(p, '#ct')
      const band = await rect(p, '#band'), bh = await rect(p, '#h-band'), bbtn = await rect(p, '#band-btn')
      ok(near(band.left, g.boxL) && near(band.right, g.boxR), E(`${vw} ${dir}: la banda g-bleed llega a los dos bordes de la caja (nunca bajo el sidebar)`), `${band.left}/${g.boxL}`)
      ok(near(g.rtl ? bh.right : bh.left, g.rtl ? g.colR : g.colL) && (g.rtl ? bbtn.right <= g.colR + 1 : bbtn.left >= g.colL - 1), E(`${vw} ${dir}: título y botón de la banda en la columna`), `${bh.left}/${g.colL}`)
      const sc = await rect(p, '#scroller')
      const first = await p.evaluate(() => { const c = document.querySelector('#scroller th'); const r = c.getBoundingClientRect(); return { l: r.left, r: r.right } })
      ok(near(sc.left, g.boxL) && near(sc.right, g.boxR) && near(g.rtl ? first.r : first.l, g.rtl ? g.colR - 0 : g.colL, 1.5), E(`${vw} ${dir}: el desplazable va de borde a borde y arranca alineado con el texto`), `${first.l}/${g.colL}`)
      await p.evaluate(() => { const s = document.getElementById('scroller'); s.scrollLeft = document.documentElement.dir === 'rtl' ? -s.scrollWidth : s.scrollWidth })
      await settle(p, 120)
      const last = await p.evaluate(() => { const c = [...document.querySelectorAll('#scroller th')].at(-1); const r = c.getBoundingClientRect(); return { l: r.left, r: r.right } })
      ok(near(g.rtl ? last.l : last.r, g.rtl ? g.colL : g.colR, eng === 'webkit' ? 2 : 1.5), E(`${vw} ${dir}: al final, el desplazable termina alineado con la columna`), `${last.r}/${g.colR}`)
      // GTable con g-bleed (L10: sangra la raíz, no su desplazable interno)
      const gt = await rect(p, '#gt'), cap = await p.evaluate(() => { const c = document.querySelector('#gt caption, #gt .g-table__caption'); const th = document.querySelector('#gt th'); return { cap: c && c.getBoundingClientRect().left, th: th && th.getBoundingClientRect().left, thR: th && th.getBoundingClientRect().right } })
      note(`${eng} ${vw} ${dir} GTable con g-bleed: raíz ${Math.round(gt.left)}–${Math.round(gt.right)} (caja ${Math.round(g.boxL)}–${Math.round(g.boxR)}), leyenda en ${Math.round(cap.cap ?? -1)}, primera celda en ${Math.round(cap.th ?? -1)} (columna en ${Math.round(g.colL)})`)
      ok(near(gt.left, g.boxL) && near(gt.right, g.boxR), E(`${vw} ${dir}: GTable con g-bleed llega a los bordes de la caja`))
      ok(!(await overflowX(p)), E(`${vw} ${dir}: sin desplazamiento horizontal con las bandas`))
      await close(p, `bleed ${vw} ${dir}`)
    }
  }

  /* ---------- 3 · A · prose y reading con la fuente real ---------- */
  if (PARTS.includes('prose')) {
    for (const theme of ['', 'medium', 'prueba']) {
      const p = await O('?c=A', { theme })
      const m = await p.evaluate(() => {
        const col = document.querySelector('#ct > .g-container__body')
        const probe = document.createElement('div'); probe.style.inlineSize = '66ch'; col.appendChild(probe); const ch = probe.getBoundingClientRect().width; probe.remove()
        const R = (s) => document.querySelector(s).getBoundingClientRect()
        return { ch, col: R('#ct > .g-container__body'), p1: R('#p1'), ul: R('#ul1'), h2: R('#h-prose'), secp: R('#sec-p'), bandp: R('#band-p'), sc: R('#scroller'), gt: R('#gt'), surf: R('#surf-p') }
      })
      const lab = theme || 'defecto'
      ok(near(m.p1.width, m.ch, 1) && near(m.p1.left, m.col.left), E(`prose (${lab}): el párrafo en 66ch de la fuente de la columna, al inicio`), `${m.p1.width.toFixed(1)}/${m.ch.toFixed(1)}`)
      ok(near(m.ul.right, m.p1.right, 1) && m.h2.width <= m.ch + 1, E(`prose (${lab}): la lista y el título comparten el borde final del párrafo`), `${m.ul.right}/${m.p1.right}`)
      ok(near(m.secp.width, m.ch, 1), E(`prose (${lab}): la prosa dentro de GSection también se mide (primitiva transparente)`), `${m.secp.width}`)
      ok(m.bandp.width <= m.ch + 1, E(`prose (${lab}): la prosa de una banda g-bleed se mide`), `${m.bandp.width}`)
      ok(m.sc.width > m.col.width && m.gt.width > m.col.width, E(`prose (${lab}): el desplazable y GTable usan el ancho entero`))
      ok(m.surf.width > m.ch + 5 || m.col.width < m.ch, E(`prose (${lab}): la prosa dentro de GSurface queda fuera (componente de Grana)`), `${m.surf.width}`)
      await close(p, `prose ${lab}`)
      const q = await O('?w=reading', { theme })
      const r = await q.evaluate(() => { const col = document.querySelector('#ct > .g-container__body'); const probe = document.createElement('div'); probe.style.inlineSize = '66ch'; col.appendChild(probe); const ch = probe.getBoundingClientRect().width; probe.remove(); return { ch, col: col.getBoundingClientRect().width } })
      ok(near(r.col, r.ch, 1), E(`reading (${lab}): la columna es 66ch de su fuente`), `${r.col}/${r.ch}`)
      await close(q, `reading ${lab}`)
    }
    // Texto al 200 %: la medida crece con el texto y no desborda la columna
    const p = await O('?c=A', { theme: ':root{font-size:200%}' })
    const z = await p.evaluate(() => { const c = document.querySelector('#ct > .g-container__body').getBoundingClientRect(); const e = document.getElementById('p1').getBoundingClientRect(); return { c: c.right, e: e.right } })
    ok(z.e <= z.c + 1 && !(await overflowX(p)), E('prose con texto al 200 %: sin desbordar la columna'))
    await close(p, 'prose 200')
  }

  /* ---------- 4 · Anfitrionas: GSurface y .g-dialog__body ---------- */
  if (PARTS.includes('hosts')) {
    const p = await O('?dialog=1')
    const s = await p.evaluate(() => { const sf = document.getElementById('surf'); const cs = getComputedStyle(sf); const r = sf.getBoundingClientRect(); return { l: r.left + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth), r: r.right - parseFloat(cs.paddingRight) - parseFloat(cs.borderRightWidth) } })
    const cs = await geo(p, '#c-surf')
    ok(near(cs.colL, s.l) && near(cs.colR, s.r) && near(cs.ins, 0), E('dentro de GSurface: la columna empieza en su relleno (auto = 0)'), `${cs.colL}/${s.l}`)
    await settle(p, 400)
    const d = await p.evaluate(() => { const bd = document.querySelector('#c-dlg').closest('.g-dialog__body'); const cs = getComputedStyle(bd); const r = bd.getBoundingClientRect(); return { l: r.left + parseFloat(cs.paddingLeft), r: r.right - parseFloat(cs.paddingRight) } })
    const cd = await geo(p, '#c-dlg')
    ok(near(cd.colL, d.l) && near(cd.colR, d.r) && near(cd.ins, 0), E('dentro de .g-dialog__body (GDialog abierto): sin margen propio'), `${cd.colL}/${d.l} ${cd.colR}/${d.r}`)
    await close(p, 'hosts')
    if (eng === 'chromium') {
      const q = await O('', { forcedColors: 'active' })
      const fc = await q.evaluate(() => { const r = getComputedStyle(document.getElementById('ct')); const c = getComputedStyle(document.querySelector('#ct > .g-container__body')); return [r.backgroundColor, r.borderTopStyle, c.backgroundColor, c.borderTopStyle, r.outlineStyle].join(' ') })
      ok(/^rgba\(\d+, \d+, \d+, 0\) none rgba\(\d+, \d+, \d+, 0\) none none$/.test(fc), E('forced-colors: el contenedor no pinta nada que perder'), fc)
      await close(q, 'forced')
    }
  }

  /* ---------- 5 · Temas: nada pintado, columna por space, banda con zona de marca legible ---------- */
  if (PARTS.includes('themes')) {
    for (const [theme, dark] of THEMES) {
      const lab = `${theme || 'defecto'} ${dark ? 'oscuro' : 'claro'}`
      const p = await O('', { theme, dark })
      const s = await SPACE(p), g = await geo(p, '#ct'), w = want(g.box, s, s * 192)
      ok(near(g.colW, w.col, 1), E(`${lab}: columna md = ${w.col.toFixed(0)} (space ${s})`), `${g.colW}`)
      const m = await p.evaluate(() => ({ paint: [getComputedStyle(document.getElementById('ct')).backgroundColor, getComputedStyle(document.querySelector('#ct > .g-container__body')).backgroundColor].join(' '), t: window.__textRatio('#band-p'), h: window.__textRatio('#h-band'), zoneVsPage: window.__ratio(window.__bgOf(document.getElementById('band')), window.__bgOf(document.getElementById('p1'))) }))
      ok(/^rgba\(\d+, \d+, \d+, 0\) rgba\(\d+, \d+, \d+, 0\)$/.test(m.paint), E(`${lab}: el contenedor no pinta`), m.paint)
      ok(m.t >= 4.5 && m.h >= 4.5, E(`${lab}: banda g-bleed con zona de marca, texto ≥ 4,5:1`), `${m.t.toFixed(2)} / ${m.h.toFixed(2)}`)
      note(`${eng} ${lab}: fondo de la banda de marca contra la página ${m.zoneVsPage.toFixed(2)}:1`)
      await close(p, lab)
    }
  }

  /* ---------- 6 · Capturas lado a lado: prototipo de kiwi ↔ componente real ---------- */
  if (PARTS.includes('shots') && eng === 'chromium') {
    const shoot = async (url, file, ready, y = 0) => {
      const ctx = await b.newContext({ viewport: { width: 1200, height: 820 } })
      const q = await ctx.newPage(); await q.goto(url); await q.waitForFunction(ready)
      await q.evaluate(() => document.fonts.ready); await q.waitForTimeout(500)
      if (y) { await q.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: 'start' }), y); await q.waitForTimeout(300) }
      await q.screenshot({ path: file }); await ctx.close()
    }
    const tmp = (n) => HERE + `.tmp-${n}.png`
    const kReady = () => document.querySelector('.ct__body')
    await shoot(KIWI + '?c=B&side=wide', tmp('kb'), kReady, '#s-table'); await shoot(BANCO + '?c=B', tmp('rb'), READY, '#s-table')
    await sideBySide(b, ORIGIN, tmp('kb'), tmp('rb'), HERE + 'auditoria-bleed.png', ['Prototipo r01 · B · Sangrado (kiwi)', 'GContainer real · g-bleed (tabla y banda con zona de marca)'])
    await shoot(KIWI + '?c=A&side=wide', tmp('ka'), kReady, '#s-prose'); await shoot(BANCO + '?c=A', tmp('ra'), READY, '#s-prose')
    await sideBySide(b, ORIGIN, tmp('ka'), tmp('ra'), HERE + 'auditoria-prose.png', ['Prototipo r01 · A · Medida (kiwi, xl)', 'GContainer real · width="xl" prose'])
    await shoot(KIWI + '?c=A&side=wide&w=md', tmp('kr'), kReady, '#s-prose'); await shoot(BANCO + '?w=reading', tmp('rr'), READY, '#s-prose')
    await sideBySide(b, ORIGIN, tmp('kr'), tmp('rr'), HERE + 'auditoria-reading.png', ['Prototipo r01 · A · Medida (kiwi, md)', 'GContainer real · width="reading"'])
    for (const n of ['kb', 'rb', 'ka', 'ra', 'kr', 'rr']) await rm(tmp(n), { force: true })
    note('capturas: design/lab/container/auditoria-bleed.png, auditoria-prose.png, auditoria-reading.png')
  }
  await b.close()
}
await stop()
process.exit(report('GContainer · auditoría') ? 1 : 0)
