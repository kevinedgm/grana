// coco · auditoría (paso 5) de GSplit sobre el COMPONENTE REAL (dist/grana.umd.js) en el banco packages/vue/playground/split.html
// y en #sec-split del playground. Tres motores, tema por defecto y dos del CLI (rústico y lujo), claro y oscuro.
//   GRANA_PW_PORT=4216 node design/lab/split/auditoria-verificar.mjs [--engines=chromium] [--verbose]
// Requiere `npm run build` en packages/vue. Predicción independiente de la regla: se mide space y cuerpo con sondas, no con --_narrow.
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { serve, stop, pw, ENGINES, ok, note, report, ROOT } from '../hero/auditoria-comun.mjs'

const ORIGIN = (await serve()).replace(/\/packages\/vue\/playground\/$/, '')
const BENCH = `${ORIGIN}/packages/vue/playground/split.html`
const PLAY = `${ORIGIN}/packages/vue/playground/index.html`
const VUE = join(ROOT, 'node_modules/vue/dist/vue.global.js')
const THEMES = { defecto: null, rustico: 'packages/blocks/playground/marketing/temas/rustico.css', lujo: 'packages/blocks/playground/marketing/temas/lujo.css' }
const css = {}
for (const [k, f] of Object.entries(THEMES)) css[k] = f ? await readFile(join(ROOT, f), 'utf8') : ''
const K = { sm: 64, md: 80, lg: 96 }
const GF = { none: 0, sm: 0.5, md: 1, lg: 2 }
const DF = { default: 1, comfortable: 0.875, compact: 0.75 }
const RATIOS = { '1-1': [1, 1], '3-2': [3, 2], '2-1': [2, 1], '2-3': [2, 3], '1-2': [1, 2] }
const settle = (p, ms = 120) => p.evaluate((ms) => new Promise((r) => setTimeout(r, ms)), ms)

async function open (b, { url = BENCH, tema, dark, vw = 1440, vh = 900, query = '', zoom = false, fc = false, rm = true }) {
  const ctx = await b.newContext({ viewport: { width: vw, height: vh }, reducedMotion: rm ? 'reduce' : 'no-preference', forcedColors: fc ? 'active' : 'none', colorScheme: dark ? 'dark' : 'light' })
  const p = await ctx.newPage()
  p.__errs = []
  p.on('console', (m) => { const t = m.text(); if ((m.type() === 'error' && !/favicon/.test(t)) || (m.type() === 'warning' && /\[Vue warn\]|\[Grana /.test(t))) p.__errs.push(t.slice(0, 160)) })
  p.on('pageerror', (e) => p.__errs.push(String(e).slice(0, 160)))
  await p.route(/unpkg\.com\/vue@3/, (r) => r.fulfill({ path: VUE, contentType: 'text/javascript' }))
  await p.goto(url + (query ? (url.includes('?') ? '&' : '?') + query : ''), { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.g-split', { timeout: 20000 })
  if (css[tema]) await p.addStyleTag({ content: css[tema] })
  if (dark) await p.evaluate(() => { document.documentElement.dataset.theme = 'dark' })
  if (zoom) await p.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  await p.evaluate(() => document.fonts.ready)
  await settle(p)
  return { p, close: () => ctx.close() }
}

// En la página: space y cuerpo resueltos con sondas, y el narrow esperado por collapse
const BASE = () => {
  const m = (v) => { const d = document.createElement('div'); d.style.cssText = `position:absolute;visibility:hidden;inline-size:${v}`; document.body.append(d); const w = d.getBoundingClientRect().width; d.remove(); return w }
  return { space: m('var(--g-space-1)'), body: m('var(--g-text-body-size)') }
}
const rects = (p, sel) => p.$eval(sel, (el) => [...el.children].map((c) => { const r = c.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width } }))
const side = (rs) => rs.length === 2 && Math.abs(rs[0].t - rs[1].t) < 0.5
const boxAt = (p, w, px) => p.$eval(w, (el, x) => { el.style.inlineSize = x + 'px' }, px)
const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)

async function run (b, eng, tema, dark) {
  const E = `${eng} · ${tema}${dark ? ' oscuro' : ' claro'}`
  const { p, close } = await open(b, { tema, dark })
  const base = await p.evaluate(BASE)
  const narrowOf = (c) => Math.max(base.space * K[c], (base.body * K[c]) / 4)

  // La hoja no pinta nada: sin fondo, borde, sombra, contorno, transición ni animación (la rúbrica de movimiento no aplica)
  {
    const r = await p.evaluate(() => {
      const bad = []
      for (const el of document.querySelectorAll('.g-split, .g-split__region')) {
        const cs = getComputedStyle(el)
        if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.backgroundImage !== 'none') bad.push('fondo')
        if (['Top', 'Right', 'Bottom', 'Left'].some((s) => parseFloat(cs['border' + s + 'Width']) > 0 && cs['border' + s + 'Style'] !== 'none')) bad.push('borde')
        if (cs.boxShadow !== 'none') bad.push('sombra')
        if (cs.outlineStyle !== 'none') bad.push('contorno')
        if (parseFloat(cs.transitionDuration) > 0 || cs.animationName !== 'none') bad.push('movimiento')
        if (cs.position !== 'static' || cs.transform !== 'none' || cs.containerType !== 'normal') bad.push('posición/transform/contención')
      }
      return [...new Set(bad)]
    })
    ok(!r.length, `${E} · no pinta nada: sin fondo, borde, sombra, contorno, movimiento, transform ni contención`, r.join(','))
  }

  // --_narrow resuelto = max(space × k, cuerpo × k / 4), para sm, md y lg (el alias se compara con la predicción independiente)
  for (const c of ['sm', 'md', 'lg']) {
    const got = await p.evaluate((c) => { const root = document.querySelector('#r-3-2'); root.classList.remove('g-split--collapse-sm', 'g-split--collapse-md', 'g-split--collapse-lg'); root.classList.add('g-split--collapse-' + c); const d = document.createElement('div'); d.style.cssText = 'position:absolute;visibility:hidden;inline-size:var(--_narrow)'; root.append(d); const w = d.getBoundingClientRect().width; d.remove(); root.classList.remove('g-split--collapse-' + c); root.classList.add('g-split--collapse-md'); return w }, c)
    ok(Math.abs(got - narrowOf(c)) <= 0.2, `${E} · collapse ${c}: el mínimo del lado estrecho = max(space × ${K[c]}, cuerpo × ${K[c]} / 4) = ${narrowOf(c).toFixed(1)}`, got.toFixed(2))
  }

  // K1/K2: 5 proporciones × 3 collapse × 4 gap × 3 densidades: umbral exacto (apila a umbral − 1, al lado en el umbral) y proporción exacta
  const W = { 1: 'w-r11', 2: 'w-r32', 3: 'w-r21' }
  const wrapOf = { '1-1': 'w-r11', '3-2': 'w-r32', '2-1': 'w-r21', '2-3': 'w-r23', '1-2': 'w-r12' }
  for (const [rid, [a, bb]] of Object.entries(RATIOS)) {
    const id = 'r-' + rid, w = '#' + wrapOf[rid]
    for (const c of ['sm', 'md', 'lg']) for (const g of ['none', 'md', 'lg']) for (const d of ['default', 'compact']) {
      await p.$eval('#' + id, (el, [c, g, d]) => { el.className = el.className.replace(/g-split--(collapse|gap|density)-\S+/g, '').trim() + ` g-split--collapse-${c} g-split--gap-${g} g-split--density-${d}` }, [c, g, d])
      const need = narrowOf(c) * (a + bb) / Math.min(a, bb) + base.space * 6 * GF[g] * DF[d]
      await boxAt(p, w, Math.ceil(need) - 1)
      const lo = side(await rects(p, '#' + id))
      await boxAt(p, w, Math.ceil(need))
      const rs = await rects(p, '#' + id)
      const hi = side(rs)
      let prop = true
      if (hi) { const free = rs[0].w + rs[1].w; prop = Math.abs(rs[0].w - (free * a) / (a + bb)) <= 1.5 && Math.abs(Math.min(rs[0].w, rs[1].w) - Math.min(a, bb) * free / (a + bb)) <= 1.5 }
      ok(!lo && hi && prop, `${E} · K1/K2 ${a}:${bb} ${c} gap ${g} ${d}: apila a ${Math.ceil(need) - 1} y va al lado a ${Math.ceil(need)} con la proporción exacta`, `lo=${lo} hi=${hi} prop=${prop}`)
    }
    await p.$eval('#' + id, (el) => { el.className = el.className.replace(/g-split--(collapse|gap|density)-\S+/g, '').trim() + ' g-split--collapse-md g-split--gap-md g-split--density-default' })
    await boxAt(p, w, 1400)
  }

  // K2 literal del contrato con el tema por defecto: 2:1 md gap md → 983 apila, 984 al lado con el estrecho a 320
  if (tema === 'defecto') {
    await boxAt(p, '#w-k2', 983); const a1 = side(await rects(p, '#k2'))
    await boxAt(p, '#w-k2', 984); const rs = await rects(p, '#k2')
    ok(!a1 && side(rs) && Math.abs(rs[1].w - 320) <= 0.75, `${E} · K2 literal: 983 apila, 984 al lado con el estrecho a 320`, rs.map((x) => x.w.toFixed(1)).join(' · '))
  }

  // K3: la caja, no el visor: un cajón de 480 en un visor de 1440 se apila y llena su caja
  await boxAt(p, '#w-r32', 480)
  { const rs = await rects(p, '#r-3-2'); ok(!side(rs) && Math.abs(rs[0].w - 480) <= 0.75 && Math.abs(rs[1].w - 480) <= 0.75, `${E} · K3 cajón de 480 con visor de 1440: apilado a todo el ancho`) }
  await boxAt(p, '#w-r32', 1400)

  // K4: anidado, cada uno decide por su caja
  {
    await boxAt(p, '#w-k4', 1400)
    const o = await rects(p, '#k4-out'), inn = await rects(p, '#k4-in')
    ok(side(o) && side(inn), `${E} · K4 anidado a 1400: los dos al lado`, `${Math.round(inn[0].w)} · ${Math.round(inn[1].w)}`)
    await boxAt(p, '#w-k4', 700)
    const o2 = await rects(p, '#k4-out'), i2 = await rects(p, '#k4-in')
    ok(!side(o2) && Math.abs(i2[0].w + i2[1].w - 700) < 40, `${E} · K4 anidado a 700: el exterior apilado y el interior decide por su caja (${Math.round(i2[0].w)}·${Math.round(i2[1].w)})`)
    await boxAt(p, '#w-k4', 1400)
  }

  // K5: RTL (start a la derecha, la proporción se conserva, sin desbordar)
  {
    await p.evaluate(() => { document.documentElement.dir = 'rtl' }); await settle(p, 60)
    const rs = await rects(p, '#r-3-2')
    ok(side(rs) && rs[0].l > rs[1].l && Math.abs(rs[0].w / (rs[0].w + rs[1].w) - 0.6) < 0.01, `${E} · K5 RTL: start a la derecha y 3:2 conservada`, rs.map((x) => Math.round(x.w)).join('·'))
    const nest = await rects(p, '#k4-in'); ok(nest[0].l > nest[1].l, `${E} · K5 RTL anidado: start a la derecha`)
    ok(!(await overflow(p)), `${E} · K5 RTL: sin desplazamiento horizontal`)
    await p.evaluate(() => { document.documentElement.dir = 'ltr' }); await settle(p, 60)
  }

  // K6: región vacía no se pinta; la otra llena el ancho; las dos vacías, raíz sin hijos
  {
    const r = await p.evaluate(() => ({ one: document.querySelector('#k6').children.length, w: document.querySelector('#k6').children[0].getBoundingClientRect().width, box: document.querySelector('#w-k6').getBoundingClientRect().width, none: document.querySelector('#k6e').children.length }))
    ok(r.one === 1 && Math.abs(r.w - r.box) <= 1 && r.none === 0, `${E} · K6 región vacía: un solo envoltorio a todo el ancho; las dos vacías, raíz sin hijos`, JSON.stringify(r))
  }

  // K7: separaciones space × 6 × {0, 0,5, 1, 2} y compact 0,75, iguales al lado y apiladas
  {
    for (const [id, f, d] of [['k7-none', 0, 1], ['k7-sm', 0.5, 1], ['k7-md', 1, 1], ['k7-lg', 2, 1], ['k7-compact', 1, 0.75]]) {
      const gap = await p.$eval('#' + id, (el) => parseFloat(getComputedStyle(el).columnGap))
      const rowGap = await p.$eval('#' + id, (el) => parseFloat(getComputedStyle(el).rowGap))
      const want = base.space * 6 * f * d
      ok(Math.abs(gap - want) <= 0.01 && Math.abs(rowGap - want) <= 0.01, `${E} · K7 ${id}: separación ${want.toFixed(1)} px en los dos ejes`, `${gap} / ${rowGap}`)
    }
  }

  // K8: align start y stretch al lado
  {
    const s = await p.evaluate(() => [...document.querySelector('#k8-start').children].map((c) => c.getBoundingClientRect().height))
    const t = await p.evaluate(() => [...document.querySelector('#k8-stretch').children].map((c) => c.getBoundingClientRect().height))
    ok(Math.abs(s[0] - s[1]) > 40 && Math.abs(t[0] - t[1]) < 1, `${E} · K8 align: start conserva alturas y stretch las iguala`, `${s.map(Math.round)} / ${t.map(Math.round)}`)
  }

  // K9: palabra larga se parte en su región (sin desbordar la caja)
  {
    await boxAt(p, '#w-k9', 560)
    const r = await p.evaluate(() => { const l = document.querySelector('#k9-long'); const reg = l.parentElement.getBoundingClientRect(); return { right: l.getBoundingClientRect().right <= reg.right + 1, sw: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 } })
    ok(r.right && !r.sw, `${E} · K9 palabra larga: se parte en su región y no desplaza la página`, JSON.stringify(r))
    await boxAt(p, '#w-k9', 1400)
  }

  // K10: Tab real 1 → 2 → 3 al lado y apilado
  for (const w of [1400, 300]) {
    await boxAt(p, '#w-k10', w)
    await p.evaluate(() => document.getElementById('k10-1').focus())
    const seq = [await p.evaluate(() => document.activeElement.id)]
    const key = eng === 'webkit' ? 'Alt+Tab' : 'Tab'
    for (let i = 0; i < 2; i++) { await p.keyboard.press(key); seq.push(await p.evaluate(() => document.activeElement.id)) }
    const tops = await p.evaluate(() => ['k10-1', 'k10-2'].map((id) => document.getElementById(id).getBoundingClientRect()).map((r) => [r.left, r.top]))
    ok(seq.join() === 'k10-1,k10-2,k10-3', `${E} · K10 Tab a ${w}: 1 → 2 → 3`, seq.join())
    ok(w > 800 ? Math.abs(tops[0][1] - tops[1][1]) < 4 : tops[1][1] > tops[0][1], `${E} · K10 a ${w}: ${w > 800 ? 'al lado' : 'apilado, lo primero arriba'}`)
  }
  await boxAt(p, '#w-k10', 1400)

  // Secuencia de cambios de tamaño sin histéresis (768 → 1440 → 1024 → 1440 → 320 → 1440)
  {
    const seqW = [700, 1400, 900, 1400, 300, 1400]
    const out = []
    for (const w of seqW) { await boxAt(p, '#w-r32', w); out.push(side(await rects(p, '#r-3-2'))) }
    const need = narrowOf('md') * 5 / 2 + base.space * 6
    const want = seqW.map((w) => w >= Math.ceil(need))
    ok(out.join() === want.join(), `${E} · secuencia de tamaños sin histéresis`, `${out.join()} vs ${want.join()}`)
    await boxAt(p, '#w-r32', 1400)
  }

  // GAdaptiveLayout: .g-split hijo directo = bloque de línea completa
  {
    const r = await p.evaluate(() => { const a = document.querySelector('#adapt-split').getBoundingClientRect(), n = document.querySelector('#adapt-next').getBoundingClientRect(); const box = document.querySelector('#adapt').getBoundingClientRect(); return { full: Math.abs(a.width - box.width) <= 1, below: n.top >= a.bottom - 1 } })
    ok(r.full && r.below, `${E} · dentro de GAdaptiveLayout: bloque de línea completa y el siguiente debajo`, JSON.stringify(r))
  }

  // GContainer prose: la prosa de una región se mide a 66ch y no más que su región; la pareja no se corta
  {
    const r = await p.evaluate(() => { const pr = document.querySelector('#prose-p'); const reg = pr.closest('.g-split__region').getBoundingClientRect(); const w = pr.getBoundingClientRect().width; const fs = parseFloat(getComputedStyle(pr).fontSize); const ch = (() => { const d = document.createElement('span'); d.style.cssText = 'position:absolute;visibility:hidden;inline-size:66ch;font:inherit'; pr.append(d); const x = d.getBoundingClientRect().width; d.remove(); return x })(); const sp = document.querySelector('#prose-split').getBoundingClientRect(); return { w, reg: reg.width, ch, sp: sp.width, ok: w <= reg.width + 1 && w <= ch + 1 } })
    ok(r.ok && r.sp > r.ch, `${E} · dentro de GContainer prose: el párrafo ${Math.round(r.w)} ≤ min(66ch ${Math.round(r.ch)}, región ${Math.round(r.reg)}) y la pareja (${Math.round(r.sp)}) no se corta`)
  }

  // as="section" lleva aria-labelledby y la raíz no añade rol
  {
    const r = await p.evaluate(() => { const s = document.querySelector('#sec'); return { tag: s.tagName, labelled: s.getAttribute('aria-labelledby'), role: s.getAttribute('role'), kids: [...s.children].map((c) => c.getAttribute('role') + '|' + c.getAttribute('tabindex')) } })
    ok(r.tag === 'SECTION' && r.labelled === 'sec-h' && !r.role && r.kids.every((k) => k === 'null|null'), `${E} · as="section": etiqueta, aria-labelledby y ni rol ni foco propios`, JSON.stringify(r))
  }
  ok(!p.__errs.length, `${E} · consola limpia`, p.__errs.join(' | '))
  await close()

  // Texto al 200 %: el mínimo del lado estrecho se dobla (cuerpo en rem) y la pareja se apila antes
  {
    const { p: q, close: c2 } = await open(b, { tema, dark, zoom: true, vw: 2200 })
    const b2 = await q.evaluate(BASE)
    const n2 = Math.max(b2.space * 80, (b2.body * 80) / 4)
    ok(Math.abs(b2.body - 2 * base.body) <= 0.5, `${E} · texto 200 %: el cuerpo se dobla (${base.body} → ${b2.body})`)
    // el umbral de 3:2 md con gap md al 200 %: lo que antes cabía en 1400 (≥ ~808) ahora pide el doble
    const need = n2 * 5 / 2 + b2.space * 6
    await boxAt(q, '#w-r32', Math.ceil(need) - 1); const lo = side(await rects(q, '#r-3-2'))
    await boxAt(q, '#w-r32', Math.ceil(need)); const hi = side(await rects(q, '#r-3-2'))
    ok(!lo && hi, `${E} · texto 200 %: el umbral 3:2 md pasa a ${Math.ceil(need)} (apila a ${Math.ceil(need) - 1}, al lado en ${Math.ceil(need)})`, `${lo}/${hi}`)
    if (tema === 'defecto') { await boxAt(q, '#w-r32', 1000); ok(!side(await rects(q, '#r-3-2')), `${E} · texto 200 %: 3:2 md en una caja de 1000 se apila (al 100 % iría al lado)`) }
    await c2()
  }

  // 320 px (y 320 con texto al 200 %): sin desplazamiento horizontal con todos los fixtures, apilados a todo el ancho
  for (const zoom of [false, true]) {
    const { p: q, close: c2 } = await open(b, { tema, dark, vw: 320, vh: 640, zoom })
    for (const w of ['#w-r11', '#w-r32', '#w-r21', '#w-r23', '#w-r12', '#w-k2', '#w-k4', '#w-k7m', '#w-k10']) await q.$eval(w, (el) => { el.style.inlineSize = '' })
    await settle(q, 60)
    const r = await q.evaluate(() => { const roots = [...document.querySelectorAll('.g-split')]; const stackedFull = roots.filter((el) => el.children.length === 2).every((el) => { const [s, e] = [...el.children].map((c) => c.getBoundingClientRect()); const w = el.getBoundingClientRect().width; return e.top >= s.bottom - 1 && Math.abs(s.width - w) <= 1 && Math.abs(e.width - w) <= 1 }); return { stackedFull, n: roots.length } })
    ok(!(await overflow(q)) || r.n === 0, `${E} · 320 px${zoom ? ' al 200 %' : ''}: sin desplazamiento horizontal con los ${r.n} fixtures`, '')
    ok(r.stackedFull, `${E} · 320 px${zoom ? ' al 200 %' : ''}: todas las parejas apiladas a todo el ancho de su caja`)
    await c2()
  }
}

// forced-colors y movimiento: el componente no pinta ni anima, así que la geometría no cambia
async function forced (b, eng) {
  const E = `${eng} · forced-colors`
  const a = await open(b, { fc: true, rm: false })
  const g = await rects(a.p, '#r-3-2')
  const paint = await a.p.evaluate(() => [...document.querySelectorAll('.g-split, .g-split__region')].filter((el) => { const cs = getComputedStyle(el); return (!/, 0\)$/.test(cs.backgroundColor) && cs.backgroundColor !== 'transparent') || cs.borderTopStyle !== 'none' || cs.outlineStyle !== 'none' }).map((el) => el.className + ' ' + getComputedStyle(el).backgroundColor).slice(0, 2))
  const n = await open(b, { fc: false, rm: false })
  const g2 = await rects(n.p, '#r-3-2')
  ok(!paint.length && g.every((r, i) => Math.abs(r.w - g2[i].w) <= 1), `${E}: nada que pintar y la misma geometría que sin colores forzados`, `${paint.join(';')} ${g.map((r) => Math.round(r.w))} / ${g2.map((r) => Math.round(r.w))}`)
  await a.close(); await n.close()
}

// Playground #sec-split: el componente en la página de documentación
async function playground (b, eng) {
  const E = `${eng} · #sec-split`
  const { p, close } = await open(b, { url: PLAY, query: '' })
  await p.waitForSelector('#spl-a')
  const r = await p.evaluate(() => { const g = (id) => [...document.querySelector(id).children].map((c) => c.getBoundingClientRect()); const a = g('#spl-a'), c = g('#spl-c'); const box = document.querySelector('#spl-demo').getBoundingClientRect(); const demo = document.querySelector('#spl-a').getBoundingClientRect(); return { aSide: Math.abs(a[0].top - a[1].top) < 1, aW: demo.width, aShare: a[0].width / (a[0].width + a[1].width), cN: c.length, cFull: Math.abs(c[0].width - document.querySelector('#spl-c').getBoundingClientRect().width) <= 1, b: g('#spl-b').map((x) => Math.round(x.height)) } })
  const need = 848
  ok(r.cN === 1 && r.cFull, `${E}: una sola región a todo el ancho`)
  ok(r.aSide === (r.aW >= need - 1) && (!r.aSide || Math.abs(r.aShare - 0.6) < 0.01), `${E}: 3:2 md lg ${r.aSide ? 'al lado' : 'apilado'} con la caja de ${Math.round(r.aW)} (umbral 848) y proporción conservada`)
  ok(Math.abs(r.b[0] - r.b[1]) <= 1, `${E}: align stretch iguala las alturas`, r.b.join('·'))
  ok(!p.__errs.length, `${E}: consola limpia`, p.__errs.join(' | '))
  await close()
}

for (const eng of ENGINES) {
  const b = await pw[eng].launch()
  for (const tema of Object.keys(THEMES)) for (const dark of [false, true]) await run(b, eng, tema, dark)
  await forced(b, eng)
  await playground(b, eng)
  await b.close()
}
stop()
report('Auditoría de GSplit (componente real)')
