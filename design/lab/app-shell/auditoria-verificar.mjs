// Auditoría de coco (paso 5) sobre el GAppShell REAL (GAppShell.vue de bruno, entrada @grana/vue/app-shell) en el banco del
// playground packages/vue/playground/app-shell.html, con GSidebar, GPageHeader, GContainer, GStack, GSection, GAccordion,
// GToaster y GStatusIsland reales de dist/. Tema por defecto y temas generados (claro y oscuro) inyectados sin capa, más un
// tema de prueba con otro space (5), títulos serif y borde de 2 px; zona de marca en la cabecera (headerZone).
// Mide: landmarks y salto; reserva por formato; cifra y receta; presupuesto del cuarto (1440×900 … 320×256); S1 Δ0 en los
// tres motores; isla y avisos SIN offset.top (#714); A (dos posiciones, espera = --g-duration-slow, interrupción, reducido);
// B (cede, relevo sin costura cuadro a cuadro, vuelve, el foco hacia la banda cedida con .focus() y Mayús+Tab, reducido);
// GAccordion sticky dentro; RTL; contraste por tema; zona de marca; forced-colors (Chromium); consola limpia.
// Requiere dist/ (npm run build). Desde la raíz:  GRANA_PW_PORT=4215 node design/lab/app-shell/auditoria-verificar.mjs
// Opciones: --engines=chromium,firefox,webkit  --parts=base,budget,s1,edges,A,B,theme,shots  --verbose
import { pw, serve, stop, open, close, ok, note, near, report, settle, rect, px, sp, toY, sy, overflowX, ratio, args, ENGINES, setEngine, sideBySide, cliTheme } from './auditoria-comun.mjs'
import { fileURLToPath } from 'node:url'

const PARTS = (args.parts || 'base,budget,s1,edges,A,B,theme,shots').split(',')
const ORIGIN = await serve()
const URL0 = ORIGIN + '/packages/vue/playground/app-shell.html'
const KIWI = ORIGIN + '/design/lab/app-shell/r01/index.html'
const HERE = fileURLToPath(new URL('./', import.meta.url))
const READY = () => document.querySelector('.g-app-shell > .g-sidebar, .g-app-shell > .g-sidebar__drawer, .g-app-shell > span[hidden]') && document.getElementById('ph') && document.getElementById('ph').classList.contains('is-sticky')
const READY_ANY = () => document.querySelector('.g-app-shell')
// Temas de la auditoría: por defecto, tres generados (uno con marca oscura, uno de color vivo, uno serif) y el de prueba
const THEMES = [['', false], ['', true], ['spotify', false], ['spotify', true], ['medium', false], ['medium', true], ['cli:spotify', false], ['cli:spotify', true], ['cli:stripe', false], ['cli:stripe', true], ['cli:grana', false], ['cli:grana', true], ['prueba', false], ['prueba', true]]

const sampleToggle = (p, ms = 520, interruptAt = 0) => p.evaluate(([ms, interruptAt]) => new Promise((resolve) => {
  const frame = document.querySelector('.g-app-shell__frame'); const sb = document.getElementById('sb')
  const rtl = document.documentElement.dir === 'rtl'
  const edge = () => { const r = frame.getBoundingClientRect(); return Math.round(rtl ? innerWidth - r.right : r.left) }
  const out = []; const t0 = performance.now(); let done = false
  document.querySelector('#sb .g-sidebar__toggle').click()
  const tick = () => {
    const t = performance.now() - t0
    if (interruptAt && !done && t >= interruptAt) { done = true; document.querySelector('#sb .g-sidebar__toggle').click() }
    out.push({ t: Math.round(t), main: edge(), sb: Math.round(sb.getBoundingClientRect().width) })
    if (t < ms) requestAnimationFrame(tick); else resolve(out)
  }
  requestAnimationFrame(tick)
}), [ms, interruptAt])
const yielded = (p) => p.evaluate(() => document.querySelector('.g-app-shell').classList.contains('is-yielded'))
const scrollSteps = async (p, to, step = 80) => { for (let y = await sy(p); y < to; y += step) await toY(p, Math.min(y + step, to)) }

for (const eng of ENGINES) {
  setEngine(eng)
  const b = await pw[eng].launch()
  const E = (m) => `${eng} ${m}`
  const O = async (qs = '', opts = {}) => { const p = await open(b, URL0 + qs, { ready: opts.ready || READY, ...opts }); p.__eng = eng; return p }
  const TAB = eng === 'webkit' ? 'Alt+Tab' : 'Tab'
  const STAB = eng === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab'

  /* ---------- 1 · Base con el componente real ---------- */
  if (PARTS.includes('base')) {
    let p = await O()
    const snap = await p.locator('body').ariaSnapshot()
    ok(/- banner/.test(snap) && /- navigation "Principal"/.test(snap) && /- main/.test(snap) && /- contentinfo/.test(snap), E('landmarks: banner, navigation «Principal», main, contentinfo'))
    ok(await p.evaluate(() => document.querySelectorAll('main, [role="main"]').length === 1), E('un solo main'))
    ok((await rect(p, '.g-app-shell__skip')).bottom <= 0, E('salto fuera del visor sin foco'))
    await p.keyboard.press(TAB); await settle(p, 220)
    const sk = await p.evaluate(() => { const a = document.activeElement; const r = a.getBoundingClientRect(); const cs = getComputedStyle(a); return { cls: a.className, top: r.top, h: r.height, w: r.width, outline: cs.outlineStyle, ow: parseFloat(cs.outlineWidth), off: parseFloat(cs.outlineOffset), text: a.textContent.trim() } })
    ok(sk.cls.includes('g-app-shell__skip') && near(sk.top, 0) && sk.h >= 24 && sk.text === 'Saltar al contenido', E('salto: primer Tab, cuelga del borde, ≥ 24 px y con su texto'), JSON.stringify(sk))
    ok(sk.outline === 'solid' && sk.ow >= 2 && sk.off < 0, E('salto: anillo visible por dentro'), `${sk.outline} ${sk.ow} ${sk.off}`)
    const hash0 = await p.evaluate(() => location.hash)
    await p.keyboard.press('Enter'); await settle(p)
    ok(await p.evaluate(([h]) => document.activeElement.classList.contains('g-app-shell__main') && getComputedStyle(document.activeElement).outlineStyle === 'none' && location.hash === h, [hash0]), E('salto: Intro → foco en main, sin anillo en la región, sin cambiar el hash'))
    await p.keyboard.press(TAB); await settle(p, 120)
    ok(await p.evaluate(() => { const a = document.activeElement; return !!a.closest('.g-app-shell__main') && a !== document.querySelector('.g-app-shell__main') }), E('salto: el siguiente Tab cae en la página'), await p.evaluate(() => document.activeElement.id || document.activeElement.className))
    const hd = await rect(p, '.g-app-shell__header'), mn = await rect(p, '.g-app-shell__main'), sb = await rect(p, '#sb')
    ok(near(mn.left, 264) && near(hd.left, 264) && near(sb.width, 264) && near(sb.left, 0), E('reserva expandida 264'), `${mn.left}/${hd.left}/${sb.width}`)
    ok(near(hd.height, 56), E('banda de contrato 56'), `${hd.height}`)
    ok(near(await px(p, '.g-app-shell', '--g-app-shell-top'), 56) && near(await px(p, '#ph', '--g-page-header-top'), 56) && near(await px(p, '.g-app-shell', '--g-accordion-sticky-top'), 104) && near(await sp(p), 104), E('cifra 56 / page-header-top 56 / acordeón 104 / scroll-padding 104'))
    await toY(p, 1500)
    const sb2 = await rect(p, '#sb'), hd2 = await rect(p, '.g-app-shell__header'), base2 = await rect(p, '#ph .g-page-header__base')
    ok(near(sb2.top, 0) && near(sb2.height, 900), E('sidebar fijo del alto del visor al desplazar'), `${sb2.top}/${sb2.height}`)
    ok(near(hd2.top, 0) && base2 && near(base2.top, 56), E('banda en 0 y zócalo pegado en 56'), base2 && `${base2.top}`)
    await toY(p, 0)
    await p.evaluate(() => document.getElementById('far-btn').focus()); await settle(p, 200)
    const fb = await rect(p, '#far-btn')
    ok(fb.top >= 103 && fb.bottom <= 900, E('focus() lejano: queda bajo banda + zócalo (2.4.11)'), `${fb.top}`)
    ok(!(await overflowX(p)), E('sin desplazamiento horizontal a 1440'))
    const fr0 = await rect(p, '.g-app-shell__frame'), band = await rect(p, '#band'), bandH = await rect(p, '#band-t'), col = await rect(p, '#ct > .g-container__body')
    ok(near(band.left, fr0.left) && near(band.right, fr0.right) && near(bandH.left, col.left), E('GContainer dentro: g-bleed llega al borde del marco (no bajo el sidebar), su texto en la columna'), `${band.left}/${fr0.left} ${bandH.left}/${col.left}`)
    // L4 (anotado, no se arregla aquí): el h1 de GPageHeader frente al texto de la página
    const h1 = await rect(p, '#ph h1'), s1t = await rect(p, '#s1 .g-section__title')
    note(`${eng} L4 en el chasis: h1 de GPageHeader en x=${Math.round(h1.left)}, título de la primera GSection en x=${Math.round(s1t.left)} (Δ ${Math.round(h1.left - s1t.left)} px)`)
    await close(p, 'base')

    const fmt = [['?mode=rail', 64, 'riel'], ['?mode=rail&overlay=1', 64, 'riel superpuesto'], ['?variant=floating', 288, 'flotante'], ['?variant=floating&mode=rail', 88, 'flotante riel'], ['?mode=drawer', 0, 'drawer']]
    for (const [qs, want, label] of fmt) {
      p = await O(qs, { ready: READY_ANY, wait: 500 })
      ok(near((await rect(p, '.g-app-shell__main')).left, want), E(`reserva ${label}: ${want}`), `${(await rect(p, '.g-app-shell__main')).left}`)
      if (label === 'riel superpuesto') {
        await p.click('#sb .g-sidebar__toggle'); await settle(p, 420); await toY(p, 1200)
        const ov = await rect(p, '#sb'), om = await rect(p, '.g-app-shell__main')
        ok(near(om.left, 64) && ov.width > 200 && near(ov.top, 0) && near(ov.height, 900), E('superpuesto: crece encima y sigue fijo tras desplazar (S2)'), `${ov.width}/${om.left}/${ov.top}`)
      }
      await close(p, label)
    }
    p = await O('', { vw: 390, vh: 800, ready: READY_ANY, wait: 500 })
    ok(near((await rect(p, '.g-app-shell__main')).left, 0) && near(await px(p, '.g-app-shell__frame', 'padding-bottom'), 68), E('390: navbar, pista 0 y 68 reservados al final del marco'))
    const reg = await p.evaluate(() => { const e = window.shell.edge; const r = e && (e.edgeReserve ? e.edgeReserve('bottom') : null); return r })
    note(`${eng} navbar: reserva de borde abajo publicada = ${JSON.stringify(reg)}`)
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await settle(p, 200)
    const ft = await rect(p, '.g-app-shell__footer'), bar = await rect(p, '.g-sidebar__bar')
    ok(bar && ft.bottom <= bar.top + 1, E('navbar: el pie termina encima de la barra'), bar && `${ft.bottom}/${bar.top}`)
    ok(!(await overflowX(p)), E('sin desplazamiento horizontal a 390'))
    await close(p, 'navbar')
    p = await O('?dir=rtl')
    const rs = await rect(p, '#sb'), rm = await rect(p, '.g-app-shell__main'), rh = await rect(p, '.g-app-shell__header')
    ok(near(rs.right, 1440) && near(rm.right, 1176) && near(rh.right, 1176), E('RTL: sidebar al final, cabecera y página a su izquierda'), `${rs.right}/${rm.right}/${rh.right}`)
    const rband = await rect(p, '#band'), rfr = await rect(p, '.g-app-shell__frame')
    ok(near(rband.right, rfr.right) && near(rband.left, rfr.left), E('RTL: g-bleed llega a los dos bordes del marco'))
    await p.keyboard.press(TAB); await settle(p, 220)
    const rsk = await rect(p, '.g-app-shell__skip')
    ok(near(rsk.top, 0) && rsk.right <= 1440 - 15 && rsk.left > 720, E('RTL: el salto cuelga al inicio (derecha)'), `${rsk.left}/${rsk.right}`)
    await toY(p, 1200)
    await p.evaluate(() => document.querySelector('#sb .g-sidebar__toggle').focus()); await settle(p, 200)
    ok(near(await sy(p), 1200, 2), E('RTL: S1 Δ0 al enfocar el sidebar'))
    await close(p, 'rtl')
    p = await O('?hh=72')
    ok(near((await rect(p, '.g-app-shell__header')).height, 72) && near(await px(p, '#ph', '--g-page-header-top'), 72) && near(await sp(p), 120), E('--g-app-shell-header 72 en :root → 72 / 72 / 120'))
    await close(p, 'hh72')
    p = await O('?nohead=1')
    ok(!(await p.evaluate(() => !!document.querySelector('.g-app-shell__header'))) && near(await px(p, '.g-app-shell', '--g-app-shell-top'), 0) && near(await sp(p), 48), E('sin cabecera: cifra 0, scroll-padding 48'))
    await close(p, 'nohead')
    p = await O('?phsticky=0', { ready: READY_ANY })
    ok(near(await sp(p), 56), E('zócalo sin sticky: scroll-padding 56'))
    await close(p, 'phsticky0')
    if (eng === 'chromium') {
      p = await O('', { forcedColors: 'active' })
      const fc = await p.evaluate(() => { const h = getComputedStyle(document.querySelector('.g-app-shell__header')); const f = getComputedStyle(document.querySelector('.g-app-shell__footer')); return { h: h.borderBottomStyle + ' ' + h.borderBottomWidth + ' ' + h.borderBottomColor, f: f.borderTopStyle + ' ' + f.borderTopWidth + ' ' + f.borderTopColor, bg: h.backgroundColor } })
      ok(/solid/.test(fc.h) && /solid/.test(fc.f) && !/rgba\(0, 0, 0, 0\)/.test(fc.h + fc.f), E('forced-colors: borde real de la banda y del pie'), JSON.stringify(fc))
      await p.keyboard.press('Tab'); await settle(p, 200)
      const fs = await p.evaluate(() => { const cs = getComputedStyle(document.activeElement); return cs.outlineStyle + ' ' + cs.outlineWidth })
      ok(/solid|auto/.test(fs) && parseFloat(fs.split(' ')[1]) >= 2, E('forced-colors: el salto conserva el anillo'), fs)
      await close(p, 'forced')
    }
  }

  /* ---------- 2 · Presupuesto del cuarto ---------- */
  if (PARTS.includes('budget')) {
    for (const [vw, vh, pinned] of [[1440, 900, true], [800, 430, true], [800, 400, false], [320, 256, false]]) {
      const p = await O('', { vw, vh, ready: READY_ANY, wait: 500 })
      const top = await px(p, '.g-app-shell', '--g-app-shell-top')
      ok(pinned ? near(top, 56) : near(top, 0), E(`presupuesto ${vw}×${vh}: banda ${pinned ? 'pegada' : 'despegada'}`), `${top}`)
      await toY(p, 1200)
      const h = await rect(p, '.g-app-shell__header')
      const stuck = await p.evaluate(() => { const ph = document.getElementById('ph'); return ph.classList.contains('is-stuck') ? ph.querySelector('.g-page-header__base').getBoundingClientRect().bottom : 0 })
      const glued = Math.max(pinned ? h.bottom : 0, stuck)
      ok(pinned ? near(h.top, 0) : h.bottom <= 0, E(`presupuesto ${vw}×${vh}: la banda ${pinned ? 'sigue arriba' : 'se va con la página'}`), `${h.top}`)
      ok(glued <= vh / 4 + 0.5, E(`presupuesto ${vw}×${vh}: lo pegado arriba ≤ 25 % del visor`), `${Math.round(glued)}/${vh}`)
      ok(!(await overflowX(p)), E(`presupuesto ${vw}×${vh}: sin desplazamiento horizontal`))
      if (vw === 320) {
        const nav = await p.evaluate(() => { const bar = document.querySelector('.g-sidebar__bar'); return bar ? Math.round(bar.getBoundingClientRect().height) : 0 })
        note(`${eng} 320×256: lo pegado arriba ${Math.round(glued)} px (${Math.round(glued / vh * 100)} %); el navbar ocupa ${nav} px abajo (${Math.round(nav / vh * 100)} %, S9 de GSidebar, fuera de este lote)`)
        await p.evaluate(() => document.getElementById('far-btn').focus()); await settle(p, 200)
        const fb = await rect(p, '#far-btn')
        ok(fb.top >= glued - 1 && fb.bottom <= vh, E('320×256: el foco lejano queda visible (2.4.11)'), `${fb.top}/${fb.bottom}`)
      }
      await close(p, `budget ${vw}`)
    }
  }

  /* ---------- 3 · S1 con el .vue real ---------- */
  if (PARTS.includes('s1')) {
    for (const qs of ['?acc=1', '?acc=1&header=relay']) {
      const p = await O(qs)
      for (const sel of ['#sb .g-sidebar__toggle', '#sb .g-sidebar__link', '#hdr-search', '#hdr-mail', '#ph-pub', '#ph-hist', '#ph-tabs [role="tab"]']) {
        await toY(p, 1200)
        if (qs.includes('relay')) await settle(p, 200)
        await p.evaluate((s) => document.querySelector(s).focus(), sel); await settle(p, 220)
        ok(near(await sy(p), 1200, 2), E(`S1 ${qs.includes('relay') ? '(B) ' : ''}enfocar ${sel} con la página en 1200 → Δ0`), `${await sy(p)}`)
        await p.evaluate(() => document.activeElement.blur())
      }
      // Tab real hacia atrás desde el zócalo pegado
      await toY(p, 1200)
      await p.evaluate(() => document.getElementById('ph-pub').focus()); await settle(p, 120)
      for (let i = 0; i < 3; i++) await p.keyboard.press(STAB)
      await settle(p, 220)
      ok(near(await sy(p), 1200, 2), E(`S1 ${qs.includes('relay') ? '(B) ' : ''}Mayús+Tab ×3 desde el zócalo pegado → Δ0`), `${await sy(p)} · ${await p.evaluate(() => document.activeElement.id || document.activeElement.className)}`)
      // GAccordion sticky dentro del chasis
      await p.evaluate(() => document.querySelector('#acc-a1-toggle').click()); await settle(p, 450)
      const a1 = await p.evaluate(() => Math.round(document.getElementById('acc-a1').getBoundingClientRect().top + scrollY))
      await toY(p, a1 + 200); await settle(p, 200)
      const head = await rect(p, '#acc-a1 .g-accordion-item__heading')
      const want = await px(p, '.g-app-shell', '--g-accordion-sticky-top')
      if (!qs.includes('relay')) ok(near(head.top, want) && near(want, 104), E('GAccordion sticky en el chasis: el encabezado abierto se pega en 104 (banda + zócalo)'), `${head.top}/${want}`)
      else {
        await p.evaluate(() => document.activeElement && document.activeElement.blur())
        for (let i = 0; i < 5; i++) await toY(p, (await sy(p)) + 80)
        await settle(p, 300)
        const hy = await rect(p, '#acc-a1 .g-accordion-item__heading'), wy = await px(p, '.g-app-shell', '--g-accordion-sticky-top')
        ok(await yielded(p) && near(hy.top, 48) && near(wy, 48), E('B + GAccordion sticky: cedida, el encabezado abierto sube a 48 (solo el zócalo)'), `${await yielded(p)} ${hy.top}/${wy}`)
      }
      for (const sel of ['#acc-a1-toggle', '#acc-act-a1']) {
        const y0 = await sy(p)
        await p.evaluate((s) => document.querySelector(s).focus(), sel); await settle(p, 220)
        const r = await rect(p, sel)
        ok(sel === '#acc-a1-toggle' ? near(await sy(p), y0, 2) : r.top >= want - 1, E(`GAccordion sticky ${qs.includes('relay') ? '(B) ' : ''}enfocar ${sel}: ${sel === '#acc-a1-toggle' ? 'Δ0' : 'queda bajo lo pegado'}`), `${y0}→${await sy(p)} top ${Math.round(r.top)}`)
        await p.evaluate(() => document.activeElement.blur())
      }
      await close(p, 's1 ' + qs)
    }
  }

  /* ---------- 4 · Bordes compartidos: isla y avisos SIN offset.top (#714) ---------- */
  if (PARTS.includes('edges')) {
    const p = await O()
    await p.click('#toast-btn'); await p.click('#status-btn'); await settle(p, 900)
    const t = await p.evaluate(() => { const e = document.querySelector('.g-toast'); return e && e.getBoundingClientRect().top })
    const isl = await p.evaluate(() => { const e = document.querySelector('.g-status-island__shape, .g-status-island'); return e && e.getBoundingClientRect().top })
    ok(t !== null && t >= 56 - 0.5, E('GToaster sin offset.top: el aviso queda bajo la banda'), `${t}`)
    ok(isl !== null && isl >= 56 - 0.5, E('GStatusIsland sin offset.top: la isla queda bajo la banda'), `${isl}`)
    note(`${eng} reposo: aviso en ${Math.round(t)}, isla en ${Math.round(isl)} (banda 56)`)
    await toY(p, 1500); await settle(p, 600)
    const t2 = await p.evaluate(() => { const e = document.querySelector('.g-toast'); return e && e.getBoundingClientRect().top })
    const i2 = await p.evaluate(() => { const e = document.querySelector('.g-status-island__shape, .g-status-island'); return e && e.getBoundingClientRect().top })
    const baseB = (await rect(p, '#ph .g-page-header__base')).bottom
    ok(t2 === null || t2 >= baseB - 0.5, E('aviso bajo el zócalo pegado al desplazar'), `${t2}/${baseB}`)
    ok(i2 === null || i2 >= baseB - 0.5, E('isla bajo el zócalo pegado al desplazar'), `${i2}/${baseB}`)
    note(`${eng} desplazada: zócalo hasta ${Math.round(baseB)}, aviso ${t2 === null ? 'ya cerrado' : Math.round(t2)}, isla ${i2 === null ? 'recogida' : Math.round(i2)}`)
    await close(p, 'edges')
    const q = await O('?header=relay')
    await q.click('#toast-btn'); await settle(q, 300)
    await scrollSteps(q, 1600); await settle(q, 500)
    const ty = await yielded(q)
    const t3 = await q.evaluate(() => { const e = document.querySelector('.g-toast'); return e && e.getBoundingClientRect().top })
    const b3 = (await rect(q, '#ph .g-page-header__base')).bottom
    ok(ty && (t3 === null || (t3 >= b3 - 0.5 && t3 < b3 + 40)), E('B cedida: el aviso sube con el relevo y queda bajo el zócalo en 0'), `${ty} ${t3}/${b3}`)
    await close(q, 'edges B')
  }

  /* ---------- 5 · A · Cortina con el .vue real ---------- */
  if (PARTS.includes('A')) {
    let p = await O()
    await p.evaluate(() => { const e = document.getElementById('p2'); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 300) }); await settle(p, 200)
    const a0 = await rect(p, '#p2')
    await p.focus('#sb .g-sidebar__toggle')
    const s = await sampleToggle(p)
    const a1 = await rect(p, '#p2')
    const pos = [...new Set(s.map((x) => x.main))]
    ok(pos.length <= 2 && near(s.at(-1).main, 64), E('A contraer: dos posiciones (264 → 64)'), pos.join(','))
    const firstMove = s.find((x) => near(x.main, 64))
    ok(firstMove && firstMove.t <= 60, E('A contraer: la página se ensancha al empezar'), firstMove && `${firstMove.t} ms`)
    ok(s.some((x) => x.sb > 70 && near(x.main, 64)), E('A contraer: el riel se encoge sobre la página ya ensanchada'))
    ok(near(a1.left, a0.left, 300) && await p.evaluate(() => document.activeElement.classList.contains('g-sidebar__toggle')), E('A contraer: el foco sigue en el botón'))
    note(`${eng} A contraer: el párrafo de referencia pasa de ${Math.round(a0.top)} a ${Math.round(a1.top)} (alto ${Math.round(a0.height)} → ${Math.round(a1.height)}; la columna lg está en su máximo a 1440)`)
    ok(near(a1.top, a0.top, 0.5) && near(a1.height, a0.height, 0.5), E('A contraer: Δ0 del párrafo que se leía'), `${a0.top}→${a1.top}`)
    await settle(p, 300)
    const e = await sampleToggle(p, 520)
    const slow = await p.evaluate(() => { const d = document.createElement('div'); d.style.transitionDuration = 'var(--g-duration-slow)'; document.body.appendChild(d); const v = parseFloat(getComputedStyle(d).transitionDuration) * 1000; d.remove(); return v })
    const sbDur = await p.evaluate(() => getComputedStyle(document.getElementById('sb')).transitionDuration)
    note(`${eng} A: --g-duration-slow = ${slow} ms; transition-duration del sidebar = ${sbDur}`)
    const mid = e.filter((x) => x.t >= 90 && x.t <= 160)
    ok(mid.length && mid.every((x) => near(x.main, 64)) && mid.some((x) => x.sb > 70 && x.sb < 264), E('A expandir: a mitad la página sigue en 64 y el sidebar crece encima'), mid.map((x) => `${x.t}:${x.main}/${x.sb}`).join(' '))
    const jump = e.find((x) => near(x.main, 264))
    ok(jump && jump.t >= slow - 40 && jump.t <= slow + 80, E(`A expandir: la página se aparta una vez, tras --g-duration-slow (${slow} ms)`), jump && `${jump.t}`)
    ok([...new Set(e.map((x) => x.main))].length <= 2, E('A expandir: dos posiciones'))
    await settle(p, 300)
    await p.click('#sb .g-sidebar__toggle'); await settle(p, 450)
    const it = await sampleToggle(p, 520, 80)
    ok(it.every((x) => near(x.main, 64)), E('A interrumpir a 80 ms: la página no salta'), [...new Set(it.map((x) => x.main))].join(','))
    await close(p, 'A')
    p = await O('', { reducedMotion: 'reduce' })
    await p.click('#sb .g-sidebar__toggle'); await settle(p, 300)
    const r = await sampleToggle(p, 200)
    const rj = r.find((x) => near(x.main, 264))
    ok(rj && rj.t <= 60, E('A reducido: sin espera'), rj && `${rj.t}`)
    await close(p, 'A reducido')
    // Al montar con el sidebar ya expandido no hay espera (is-ready): la pista reserva 264 en el primer pintado útil
    p = await O('', { ready: READY_ANY, wait: 0 })
    ok(near((await rect(p, '.g-app-shell__main')).left, 264), E('A al cargar: la pista reserva 264 sin espera'), `${(await rect(p, '.g-app-shell__main')).left}`)
    await close(p, 'A carga')
  }

  /* ---------- 6 · B · Relevo de franja con el .vue real ---------- */
  if (PARTS.includes('B')) {
    let p = await O('?header=relay')
    await scrollSteps(p, 1600); await settle(p, 300)
    const hd = await rect(p, '.g-app-shell__header'), base = await rect(p, '#ph .g-page-header__base')
    ok(await yielded(p) && hd.bottom <= 0.5 && near(base.top, 0) && near(await sp(p), 48), E('B bajar: cede (banda fuera, zócalo en 0, scroll-padding 48)'), `${hd.bottom}/${base.top}/${await sp(p)}`)
    ok(await p.evaluate(() => document.getElementById('ph').classList.contains('is-stuck')), E('B: GPageHeader sigue pegado'))
    const pub = await p.evaluate(() => { const e = window.shell.edge; return e && e.edgeReserve ? e.edgeReserve('top') : null })
    note(`${eng} B cedida: reserva de borde arriba = ${JSON.stringify(pub)}`)
    const seam = async (dir) => p.evaluate((dir) => new Promise((resolve) => {
      const out = []; const t0 = performance.now()
      const H = document.querySelector('.g-app-shell__header'), B = document.querySelector('#ph .g-page-header__base')
      window.scrollTo(0, scrollY + dir * 80)
      requestAnimationFrame(() => { window.scrollTo(0, scrollY + dir * 80) })
      const tick = () => { const t = performance.now() - t0; const h = H.getBoundingClientRect(), b = B.getBoundingClientRect(); out.push({ t: Math.round(t), hb: +h.bottom.toFixed(1), bt: +b.top.toFixed(1) }); if (t < 400) requestAnimationFrame(tick); else resolve(out) }
      requestAnimationFrame(tick)
    }), dir)
    const up = await seam(-1)
    const gu = up.map((x) => Math.abs(x.hb - x.bt))
    const inter = up.filter((x) => x.hb > 1 && x.hb < 55).length
    ok(Math.max(...gu) <= 1, E('B volver: relevo sin costura cuadro a cuadro'), `máx ${Math.max(...gu).toFixed(1)} · ${up.filter((x, i) => i % 3 === 0).map((x) => `${x.t}:${x.hb}/${x.bt}`).join(' ')}`)
    ok(inter >= 2, E('B volver: se desliza (cuadros intermedios)'), `${inter}`)
    ok(!(await yielded(p)) && near((await rect(p, '.g-app-shell__header')).top, 0), E('B: vuelve al subir 160 en dos pasos'))
    await settle(p, 200)
    for (let i = 0; i < 4; i++) await toY(p, (await sy(p)) + 80)
    await settle(p, 300)
    ok(await yielded(p), E('B: vuelve a ceder al bajar otra vez'))
    const down = await seam(1)
    ok(Math.max(...down.map((x) => Math.abs(x.hb - x.bt))) <= 1, E('B ceder: relevo sin costura (la banda sale con el zócalo)'))
    // Foco hacia la banda cedida: .focus() y Mayús+Tab desde el sidebar
    await settle(p, 300)
    const y0 = await sy(p)
    await p.evaluate(() => document.getElementById('hdr-search').focus()); await settle(p, 300)
    const hb = await rect(p, '.g-app-shell__header'), fr = await rect(p, '#hdr-search')
    ok(!(await yielded(p)) && near(hb.top, 0) && fr.top >= 0 && near(await sy(p), y0, 2), E('B foco con .focus() en la banda cedida: vuelve, el control a la vista y Δ0'), `${await yielded(p)} ${hb.top} ${y0}→${await sy(p)}`)
    await p.evaluate(() => document.activeElement.blur())
    for (let i = 0; i < 4; i++) await toY(p, (await sy(p)) + 80)
    await settle(p, 300)
    ok(await yielded(p), E('B: cedida otra vez antes de Mayús+Tab'))
    const y1 = await sy(p)
    await p.evaluate(() => document.querySelector('#sb .g-sidebar__toggle, #sb .g-sidebar__link').focus()); await settle(p, 120)
    const first = await p.evaluate(() => { const f = [...document.querySelectorAll('#sb button, #sb a[href], #sb [tabindex="0"]')].filter((e) => e.offsetParent || e.getClientRects().length)[0]; f.focus(); return f.className })
    await p.keyboard.press(STAB); await settle(p, 300)
    const act = await p.evaluate(() => ({ id: document.activeElement.id, inHead: !!document.activeElement.closest('.g-app-shell__header') }))
    const hb2 = await rect(p, '.g-app-shell__header')
    ok(act.inHead && !(await yielded(p)) && near(hb2.top, 0) && near(await sy(p), y1, 2), E('B Mayús+Tab desde el sidebar a la banda cedida: vuelve antes de pintar y Δ0'), `${first} → ${act.id} ${hb2.top} ${y1}→${await sy(p)}`)
    // Mientras el foco está dentro, no cede
    for (let i = 0; i < 4; i++) await toY(p, (await sy(p)) + 80)
    await settle(p, 300)
    ok(!(await yielded(p)), E('B: con el foco en la banda no cede'))
    await p.evaluate(() => document.activeElement.blur())
    await toY(p, 0); await settle(p, 300)
    ok(!(await yielded(p)), E('B: arriba del todo, la banda está (nunca sin franja)'))
    await close(p, 'B')
    p = await O('?header=relay&ph=0', { ready: READY_ANY })
    await scrollSteps(p, 1600); await settle(p, 300)
    ok(!(await yielded(p)) && near((await rect(p, '.g-app-shell__header')).top, 0), E('B sin GPageHeader: no cede'))
    await close(p, 'B ph0')
    p = await O('?header=relay', { vw: 800, vh: 400, ready: READY_ANY })
    await scrollSteps(p, 1600); await settle(p, 300)
    ok(!(await yielded(p)), E('B con la banda despegada por el presupuesto (800×400): no cede'))
    await close(p, 'B budget')
    p = await O('?header=relay', { reducedMotion: 'reduce' })
    await scrollSteps(p, 1600); await settle(p, 300)
    const red = await p.evaluate(() => new Promise((resolve) => {
      const out = []; const t0 = performance.now(); const H = document.querySelector('.g-app-shell__header')
      window.scrollTo(0, scrollY - 80); requestAnimationFrame(() => window.scrollTo(0, scrollY - 80))
      const tick = () => { const t = performance.now() - t0; out.push(+H.getBoundingClientRect().bottom.toFixed(1)); if (t < 300) requestAnimationFrame(tick); else resolve(out) }
      requestAnimationFrame(tick)
    }))
    ok(red.filter((v) => v > 1 && v < 55).length === 0, E('B reducido: sin cuadros intermedios'), red.join(','))
    await close(p, 'B reducido')
  }

  /* ---------- 7 · Temas: contraste de la banda, el pie, el salto y la zona de marca ---------- */
  if (PARTS.includes('theme')) {
    for (const [theme, dark] of THEMES) {
      const label = `${theme || 'defecto'} ${dark ? 'oscuro' : 'claro'}`
      for (const zone of ['', 'header']) {
        const p = await O(zone ? '?zone=header' : '', { theme, dark })
        const m = await p.evaluate(() => {
          const H = document.querySelector('.g-app-shell__header')
          const icon = document.querySelector('#hdr-search')
          const hcs = getComputedStyle(H)
          return {
            band: window.__textRatio('.brand span:last-child'),
            icon: window.__pair(getComputedStyle(icon).color, icon),
            edge: window.__ratio(window.__rgb(hcs.borderBottomColor, window.__bgOf(H)), window.__bgOf(document.querySelector('.g-app-shell__main'))),
            bandVsPage: window.__ratio(window.__bgOf(H), window.__bgOf(document.querySelector('.g-app-shell__main'))),
            foot: window.__textRatio('.g-app-shell__footer'),
            h: H.getBoundingClientRect().height, zone: H.dataset.gZone || ''
          }
        })
        const sp1 = await px(p, ':root', '--g-space-1')
        const band = Math.max(sp1 * 14, 44)
        ok(near(m.h, band), E(`${label}${zone ? ' zona' : ''}: banda de contrato (${band})`), `${m.h}`)
        ok(m.band >= 4.5, E(`${label}${zone ? ' zona' : ''}: texto de la banda ≥ 4,5:1`), m.band.toFixed(2))
        ok(m.icon >= 3, E(`${label}${zone ? ' zona' : ''}: icono de los botones de la banda ≥ 3:1`), m.icon.toFixed(2))
        if (zone) {
          ok(m.zone === 'brand' && m.bandVsPage > 1.05, E(`${label} zona: data-g-zone en la banda y fondo propio`), `${m.zone} ${m.bandVsPage.toFixed(2)}`)
          // El foco en la zona: el anillo de un botón de la banda contra su fondo
          await p.evaluate(() => document.getElementById('hdr-search').focus({ focusVisible: true }))
          await p.keyboard.press('Shift'); await settle(p, 120)
          await p.evaluate(() => { document.getElementById('hdr-mail').focus() }); await p.keyboard.press(TAB); await p.keyboard.press(STAB); await settle(p, 120)
          const ring = await p.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { id: a.id, style: cs.outlineStyle, r: window.__pair(cs.outlineColor, document.querySelector('.g-app-shell__header')) } })
          ok(ring.style !== 'none' && ring.r >= 3, E(`${label} zona: anillo de foco en la banda ≥ 3:1`), `${ring.id} ${ring.style} ${ring.r.toFixed(2)}`)
        } else {
          note(`${eng} ${label}: borde de la banda contra la página ${m.edge.toFixed(2)}:1 (separación decorativa; la banda es opaca y su borde es real)`)
          ok(m.foot >= 4.5, E(`${label}: pie text-muted ≥ 4,5:1`), m.foot.toFixed(2))
          await p.keyboard.press(TAB); await settle(p, 220)
          const s = await p.evaluate(() => { const e = document.querySelector('.g-app-shell__skip'); return { t: window.__textRatio(e), ring: window.__pair(getComputedStyle(e).outlineColor, e) } })
          ok(s.t >= 4.5 && s.ring >= 3, E(`${label}: salto texto ≥ 4,5:1 y anillo ≥ 3:1`), `${s.t.toFixed(2)} / ${s.ring.toFixed(2)}`)
          if (theme === 'prueba') {
            ok(near(await sp(p), 70 + 60) && near((await rect(p, '.g-app-shell__main')).left, (await rect(p, '#sb')).width), E(`${label}: otro space → banda 70, scroll-padding 130, pista = --g-sidebar-width`), `${await sp(p)}`)
            const sec = await p.evaluate(() => getComputedStyle(document.querySelector('#s1 .g-section__title')).fontFamily)
            ok(/Georgia/.test(sec), E(`${label}: el título de la primera sección sigue --g-font-title (serif)`), sec)
          }
        }
        await close(p, label + (zone ? ' zona' : ''))
      }
    }
  }

  /* ---------- 8 · Capturas lado a lado: prototipo de kiwi ↔ componente real ---------- */
  if (PARTS.includes('shots') && eng === 'chromium') {
    const shoot = async (url, file, after) => {
      const ctx = await b.newContext({ viewport: { width: 1200, height: 760 } })
      await ctx.route(/unpkg\.com\/vue@3\/dist\/vue\.global\.js/, (r) => r.fulfill({ path: fileURLToPath(new URL('../../../node_modules/vue/dist/vue.global.prod.js', import.meta.url)), contentType: 'text/javascript' }))
      const q = await ctx.newPage(); await q.goto(url); await q.waitForFunction(() => document.querySelector('.g-sidebar') && document.querySelector('.g-page-header.is-sticky'))
      await q.evaluate(() => document.fonts.ready); await q.waitForTimeout(500)
      if (after) await after(q)
      await q.screenshot({ path: file }); await ctx.close()
    }
    const tmp = (n) => HERE + `.tmp-${n}.png`
    const down = async (q) => { for (let y = 80; y <= 1600; y += 80) { await q.evaluate((y) => window.scrollTo(0, y), y); await q.waitForTimeout(60) } await q.waitForTimeout(500) }
    await shoot(KIWI + '?c=A', tmp('ka')); await shoot(URL0, tmp('ra'))
    await sideBySide(b, ORIGIN, tmp('ka'), tmp('ra'), HERE + 'auditoria-A.png', ['Prototipo r01 · A · Cortina (kiwi)', 'GAppShell real · header="pinned"'])
    await shoot(KIWI + '?c=B', tmp('kb'), down); await shoot(URL0 + '?header=relay', tmp('rb'), down)
    await sideBySide(b, ORIGIN, tmp('kb'), tmp('rb'), HERE + 'auditoria-B.png', ['Prototipo r01 · B · Relevo cedido (kiwi)', 'GAppShell real · header="relay" cedido'])
    await shoot(URL0 + '?zone=header', tmp('rz')); await shoot(URL0 + '?zone=header&theme=x', tmp('rz2'), async (q) => { await q.addStyleTag({ path: cliTheme('spotify') }); await q.evaluate(() => { document.documentElement.dataset.theme = 'dark' }); await q.waitForTimeout(300) })
    await sideBySide(b, ORIGIN, tmp('rz'), tmp('rz2'), HERE + 'auditoria-zona.png', ['GAppShell real · headerZone="brand" (defecto)', 'GAppShell real · headerZone="brand" (spotify del CLI, oscuro)'])
    const { rm } = await import('node:fs/promises')
    for (const n of ['ka', 'ra', 'kb', 'rb', 'rz', 'rz2']) await rm(tmp(n), { force: true })
    note('capturas: design/lab/app-shell/auditoria-A.png, auditoria-B.png, auditoria-zona.png')
  }
  await b.close()
}
await stop()
process.exit(report('GAppShell · auditoría') ? 1 : 0)
