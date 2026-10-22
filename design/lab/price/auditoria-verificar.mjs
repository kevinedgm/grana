// Auditoría de coco (paso 5) de GPrice, GPriceScope, GNumberField currency y el día con precio de GDatePicker sobre el
// COMPONENTE REAL (dist/price.umd.js + dist/grana.umd.js en packages/vue/playground/price.html, bruno f0b63e5). Mide en
// Chromium, Firefox y WebKit: estático (GPrice.css, GPriceScope.css, GDatePicker.css; .vue sin <style>; tokens de §54);
// contraste ≥ 4,5:1 de todas las partes en el tema por defecto, tres temas del CLI (terracota, añil, pálida) y cinco
// generados, claro y oscuro (Firefox y WebKit: defecto, terracota y stripe); los cinco tamaños (rol de cifra y secundario,
// ≥ 12 px, cifras tabulares); árbol accesible (solo la frase); carta con un borde final; carrito (código solo en lo
// extranjero, cents always alineado); C trace (referencia encima, ahorro en texto) y strike (tachado detrás); B (leyenda
// primera, sello, filete, sin «·», cambio de vista en bloque con «aprox.»); A (cifras que ruedan con el marcado real de
// __total-amount, Δ ancho 0, retirada, interrumpible, reducido sin capa; 50 precios a la vez sin tarea larga > 50 ms en
// Chromium); RTL (ar-EG y página rtl: flecha espejada, separación del importe ltr hacia el lado correcto, P-A1); 320 px
// sin desplazamiento horizontal y sin partir el importe; el campo currency en es-MX/en-US/de-DE/JPY; el día con precio
// (celdas iguales, contenido dentro, elegido y franja ≥ 4,5:1, límite P-C1 de cinco cifras); forced-colors (Chromium);
// consola limpia.
// Ejecutar desde la raíz con dist/ reconstruido:  GRANA_PW_PORT=4209 node design/lab/price/auditoria-verificar.mjs
// Opcional: --engines=chromium  --verbose
import { pw, ENGINES, ok, note, report, serve, stop, opener, overflowX, settle, staticCheck } from '../hero/auditoria-comun.mjs'

/* 0 · Estático */
const tokens = new Set()
for (const [css, vue] of [['GPrice/GPrice.css', 'GPrice/GPrice.vue'], ['GPriceScope/GPriceScope.css', 'GPriceScope/GPriceScope.vue'], ['GDatePicker/GDatePicker.css', 'GDatePicker/GDatePicker.vue']]) {
  const src = await staticCheck('packages/vue/src/components/' + css, ['packages/vue/src/components/' + vue])
  if (!css.startsWith('GDatePicker')) [...src.matchAll(/var\((--g-[\w-]+)/g)].forEach((m) => tokens.add(m[1]))
}
const ALLOWED = /^--g-(text-(caption|body-sm|body|title-sm|title|display)-(size|line|weight|tracking)|text-action-weight|font-(ui|display)|color-(text|text-muted|success-soft|on-success-soft|border-strong)|border-width|radius-(xs|pill)|space-1|duration-press|ease-out)$/
ok([...tokens].every((t) => ALLOWED.test(t)), 'estático: GPrice + GPriceScope solo leen los tokens de tokens.md §54', [...tokens].filter((t) => !ALLOWED.test(t)).join(','))

const BASE = await serve()
const TEMAS = ['defecto', 'terracota', 'anil', 'palida', 'stripe', 'linear', 'notion', 'amazon', 'caracol-purpura']
const PARTS = ['.g-price__amount', '.g-price__lead', '.g-price__unit', '.g-price__code', '.g-price__approx', '.g-price__sep', '.g-price__compare-label', '.g-price__amount--compare', '.g-price__saving', '.g-price__total-label', '.g-price__total-amount', '.g-price__total-unit', '.g-price--free', '.g-price--on-request', '.g-price-scope__seal', '.g-price-scope__legend-text', '.g-price-scope__taxes', '.g-input__prefix', '.g-input__suffix']
const ready = (p) => p.waitForFunction(() => window.__price && window.__price.ready)

for (const eng of ENGINES) {
  const b = await pw[eng].launch()
  const open0 = await opener(b, BASE, eng)
  const open = async (pg, o) => { const p = await open0(pg, o); await ready(p); await settle(p, 120); return p }
  const E = (m) => `${eng} ${m}`
  const close = async (p, label) => { ok(p.__errs.length === 0, E(`consola limpia (${label})`), p.__errs.slice(0, 2).join(' | ')); await p.__ctx.close() }

  /* 1 · Contraste en temas, claro y oscuro, en C, A y B (B con la vista en USD: aprox.) y con un tramo elegido en el calendario */
  const temas = eng === 'chromium' ? TEMAS : ['defecto', 'terracota', 'stripe']
  let worst = { v: 99 }
  for (const theme of temas) for (const dark of [false, true]) for (const c of ['C', 'A', 'B']) {
    const p = await open(`price.html?c=${c}`, { theme, dark })
    if (c === 'B') { await p.evaluate(() => { window.__price.view.value = 'USD' }); await settle(p, 60) }
    if (c === 'C') {
      // Un tramo en el calendario: el día elegido (on-{color}) y la franja (on-{color}-soft) con su precio
      const days = p.locator('.g-datepicker__day:not(.is-disabled):not(.is-outside)')
      await days.nth(1).click(); await days.nth(4).click(); await settle(p, 400)
    }
    const res = await p.evaluate((PARTS) => {
      const min = {}
      const add = (k, el) => { const v = window.__c.text(el); if (v < (min[k] ?? 99)) min[k] = v }
      for (const sel of PARTS) for (const el of document.querySelectorAll(sel)) if (el.getClientRects().length && !el.closest('.g-datepicker')) add(sel, el)
      for (const d of document.querySelectorAll('.g-datepicker__day:not(.is-disabled):not(.is-outside)')) {
        const a = d.querySelector('.g-price__amount'); if (!a) continue
        const td = d.closest('td'); const has = (c) => d.classList.contains(c) || td.classList.contains(c)
        add('día' + (has('is-selected') || has('is-range-start') || has('is-range-end') ? ' elegido' : has('is-in-range') ? ' franja' : ''), a)
      }
      return min
    }, PARTS)
    const low = Object.entries(res).filter(([, v]) => v < 4.5)
    const L = `${theme} ${dark ? 'oscuro' : 'claro'} ${c}`
    ok(!low.length, E(`contraste ≥ 4,5:1 de todas las partes · ${L}`), low.map(([k, v]) => k + ' ' + v).join(', '))
    if (c === 'C') ok(['día elegido', 'día franja', 'día'].every((k) => k in res), E(`${L}: el calendario tiene día elegido, franja y día suelto con precio`), Object.keys(res).filter((k) => k.startsWith('día')).join(','))
    for (const [k, v] of Object.entries(res)) if (v < worst.v) worst = { v, k, L }
    await close(p, L)
  }
  note(`${eng}: contraste mínimo ${worst.v}:1 (${worst.k}, ${worst.L})`)

  /* 2 · Tamaños, árbol, carta, carrito, C, strike, B, leyenda */
  {
    const p = await open('price.html?c=C', {})
    const m = await p.evaluate(() => {
      const R = (n) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(n)) * 16
      const px = (el) => parseFloat(getComputedStyle(el).fontSize)
      const pick = { xs: '[data-cal] .g-price', sm: '[data-dish="tlayuda"] .g-price', md: '[data-room="terraza"] .g-price', lg: '.pr-cart .g-price--size-lg', xl: '[data-case="xl"] .g-price' }
      const sizes = {}
      for (const [s, sel] of Object.entries(pick)) {
        const r = document.querySelector(sel); const a = r.querySelector('.g-price__amount')
        const sec = r.querySelector('.g-price__unit, .g-price__lead, .g-price__code')
        sizes[s] = { cls: r.classList.contains('g-price--size-' + s), num: px(a), sec: sec ? px(sec) : null, nums: getComputedStyle(a).fontVariantNumeric, lines: Math.round(a.getBoundingClientRect().height / parseFloat(getComputedStyle(a).lineHeight)) }
      }
      const exp = { caption: R('--g-text-caption-size'), bodySm: R('--g-text-body-sm-size'), body: R('--g-text-body-size'), titleSm: R('--g-text-title-sm-size'), title: R('--g-text-title-size'), display: R('--g-text-display-size') }
      const card = document.querySelector('[data-room="patio"] .g-price')
      const cmp = card.querySelector('.g-price__compare').getBoundingClientRect(), now = card.querySelector('.g-price__now').getBoundingClientRect()
      const spoken = card.querySelector('.g-price__spoken'); const sr = spoken.getBoundingClientRect()
      const menuEdges = [...document.querySelectorAll('.pr-menu__price .g-price')].map((x) => Math.round(x.getBoundingClientRect().right))
      const cartEdges = [...document.querySelectorAll('.pr-cart dd .g-price')].map((x) => Math.round(x.getBoundingClientRect().right))
      const cart = [...document.querySelectorAll('.pr-cart dd .g-price__visual')].map((v) => v.textContent)
      const menuCodes = document.querySelectorAll('[data-scope="menu"] .g-price__code').length
      const lg = document.querySelector('[data-scope="menu"] .g-price-scope__legend')
      const tax = getComputedStyle(lg.querySelector('.g-price-scope__taxes'))
      const seal = lg.querySelector('.g-price-scope__seal')
      const saving = card.querySelector('.g-price__saving')
      return {
        sizes, exp, above: cmp.bottom <= now.top + 0.5, hidden: card.querySelector('.g-price__visual').getAttribute('aria-hidden'), sr: sr.width <= 1 && sr.height <= 1, spoken: spoken.textContent,
        menuEdges, cartEdges, cart, menuCodes, legendFirst: lg === lg.parentElement.firstElementChild, noDot: !/·/.test(lg.textContent), tax: tax.borderInlineStartStyle, sealH: seal.getBoundingClientRect().height, sealHidden: seal.getAttribute('aria-hidden'),
        saving: saving.textContent, savingBg: getComputedStyle(saving).backgroundColor !== 'rgba(0, 0, 0, 0)'
      }
    })
    const X = m.exp
    const want = { xs: [X.caption, X.caption], sm: [X.bodySm, null], md: [X.titleSm, X.bodySm], lg: [X.title, null], xl: [X.display, X.body] }
    for (const [s, [n, sec]] of Object.entries(want)) {
      const z = m.sizes[s]
      ok(z.cls && Math.abs(z.num - n) < 0.1 && (sec === null || z.sec === null || Math.abs(z.sec - sec) < 0.1), E(`tamaño ${s}: cifra ${n} px y secundario ${sec ?? '—'} px en el componente real`), JSON.stringify(z))
      ok(z.num >= 12 && (z.sec ?? 12) >= 12, E(`tamaño ${s}: texto ≥ 12 px`))
      ok(/tabular-nums/.test(z.nums) && /lining-nums/.test(z.nums), E(`tamaño ${s}: cifras tabulares y de altura de mayúscula`), z.nums)
      ok(z.lines === 1, E(`tamaño ${s}: el importe en una línea`), z.lines)
    }
    ok(m.hidden === 'true' && m.sr && /pesos mexicanos/.test(m.spoken) && !/\$/.test(m.spoken), E('árbol: lo visible aria-hidden, la frase en texto oculto 1 px y con el nombre de la moneda'), m.spoken)
    const snap = await p.locator('[data-room="patio"] .g-price').ariaSnapshot()
    ok(!/\$|MXN/.test(snap) && /pesos mexicanos/.test(snap), E('ariaSnapshot: solo la frase, sin «$» ni «MXN»'), snap.slice(0, 120))
    ok(m.above, E('C: la referencia va encima del precio actual'))
    ok(/Ahorras/.test(m.saving) && m.savingBg, E('C: el ahorro es texto sobre su pastilla'), m.saving)
    ok(new Set(m.menuEdges).size === 1 && m.menuCodes === 0, E('carta: un borde final y ningún código (la región dice MXN)'), m.menuEdges.join(','))
    ok(new Set(m.cartEdges).size === 1, E('carrito: todas las cifras contra el mismo borde final'), m.cartEdges.join(','))
    ok(/^\$3,700\.00$/.test(m.cart[0]) && /USD/.test(m.cart[1]) && /^−\$200\.00$/.test(m.cart[2]) && !/MXN/.test(m.cart.join('')), E('carrito: el código solo en lo extranjero; menos tipográfico; cents always'), m.cart.join(' | '))
    ok(m.legendFirst && m.noDot && m.tax === 'solid' && m.sealH >= 24 && m.sealHidden === 'true', E('B: leyenda primera, sin «·», filete, sello ≥ 24 px y aria-hidden'), JSON.stringify({ t: m.tax, h: m.sealH }))
    await close(p, 'tamaños y estructura')
  }
  {
    const p = await open('price.html?c=base', {})
    const s = await p.evaluate(() => {
      const r = document.querySelector('[data-room="patio"] .g-price'); const sEl = r.querySelector('s.g-price__compare')
      const now = r.querySelector('.g-price__now').getBoundingClientRect(), st = sEl.getBoundingClientRect()
      return { deco: getComputedStyle(sEl.querySelector('.g-price__amount--compare')).textDecorationLine, after: st.left >= now.left, sameLine: Math.abs(st.bottom - now.bottom) < 6, saving: !!r.querySelector('.g-price__saving') }
    })
    ok(/line-through/.test(s.deco) && s.after && s.sameLine && !s.saving, E('strike: <s> detrás del precio, en su línea, tachado y sin ahorro'), JSON.stringify(s))
    await close(p, 'strike')
  }
  {
    const p = await open('price.html?c=B', {})
    const before = await p.evaluate(() => ({ seal: document.querySelector('[data-scope="cards"] .g-price-scope__seal').textContent, codes: [...document.querySelectorAll('[data-scope="cards"] .g-price__code')].map((c) => c.textContent), tour: document.querySelector('[data-room="tour"] .g-price__visual').textContent }))
    await p.evaluate(() => { window.__price.view.value = 'USD' }); await settle(p, 60)
    const after = await p.evaluate(() => ({ seal: document.querySelector('[data-scope="cards"] .g-price-scope__seal').textContent, legend: document.querySelector('[data-scope="cards"] .g-price-scope__legend-text').textContent, approx: document.querySelectorAll('[data-scope="cards"] .g-price__approx').length, cur: [...document.querySelectorAll('[data-scope="cards"] .g-price')].map((x) => x.dataset.currency) }))
    ok(before.seal === 'MXN' && before.codes.length === 0 && /USD/.test(before.tour), E('B (MXN): sin código en lo propio; el tour en USD conserva el suyo'), JSON.stringify(before))
    ok(after.seal === 'USD' && /USD/.test(after.legend) && after.approx >= 2 && after.cur.every((c) => c === 'USD'), E('B: el cambio de vista mueve sello, leyenda y todos los precios a la vez, con «aprox.»'), JSON.stringify(after))
    await close(p, 'B')
  }

  /* 3 · A · cifras que ruedan sobre el marcado real de __total-amount (partes sin __amount) */
  for (const rm of [false, true]) {
    const p = await open('price.html?c=A', { rm })
    const struct = await p.evaluate(() => {
      const t = document.querySelector('[data-room="patio"] .g-price__total-amount'); const n = t.querySelector('.g-price__number'), c = t.querySelector('.g-price__code')
      const fs = (e) => parseFloat(getComputedStyle(e).fontSize)
      const now = document.querySelector('[data-room="patio"] .g-price__now .g-price__amount')
      return { inner: !!t.querySelector('.g-price__amount'), num: fs(n), code: c ? fs(c) : null, codeMuted: c ? getComputedStyle(c).color === getComputedStyle(document.querySelector('[data-room="patio"] .g-price__total-label')).color : null, dir: t.getAttribute('dir'), bidi: getComputedStyle(t).unicodeBidi, nowFs: fs(now), R: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-text-title-sm-size')) * 16, S: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-text-body-sm-size')) * 16 }
    })
    if (!rm) {
      ok(!struct.inner && Math.abs(struct.num - struct.R) < 0.1 && Math.abs(struct.code - struct.S) < 0.1 && struct.codeMuted && struct.dir === 'ltr' && struct.bidi === 'isolate', E('A: __total-amount pinta las partes sin __amount y el CSS las cubre (cifra de título, código secundario y en voz baja, ltr aislado)'), JSON.stringify(struct))
      ok(Math.abs(struct.nowFs - struct.S) < 0.1, E('A: la tarifa baja al rol secundario debajo del total'), struct.nowFs)
    }
    const r = await p.evaluate(async () => {
      const el = document.querySelector('[data-room="patio"] .g-price__total-amount')
      const raf = () => new Promise((res) => requestAnimationFrame(res))
      const w0 = el.getBoundingClientRect().width
      window.__price.nights.value = 3
      await new Promise((res) => setTimeout(res, 0))
      const slots = el.querySelectorAll('.g-price__roll-slot').length, chars = el.textContent.length
      const anim = [...el.querySelectorAll('*')].map((x) => getComputedStyle(x).animationName).filter((n) => n !== 'none').length
      const ys = new Set(), ws = new Set(); const t0 = performance.now()
      while (el.classList.contains('is-rolling') && performance.now() - t0 < 1500) {
        const n = el.querySelector('.g-price__roll-new'); if (n) ys.add(Math.round(n.getBoundingClientRect().top * 2) / 2)
        ws.add(Math.round(el.getBoundingClientRect().width * 10) / 10); await raf()
      }
      await raf(); await raf()
      const wEnd = Math.round(el.getBoundingClientRect().width * 10) / 10
      const done = !el.classList.contains('is-rolling') && !el.querySelector('.g-price__roll-slot')
      // Interrumpible: dos cambios seguidos no apilan capas
      window.__price.nights.value = 4; await new Promise((res) => setTimeout(res, 0)); await raf()
      window.__price.nights.value = 5; await new Promise((res) => setTimeout(res, 0))
      const stacked = el.querySelectorAll('.g-price__roll-slot .g-price__roll-slot').length
      const layers = el.querySelectorAll('.g-price__roll-old').length
      return { w0, slots, chars, anim, positions: ys.size, ws: [...ws], wEnd, done, stacked, layers, text: el.textContent, ms: Math.round(performance.now() - t0) }
    })
    if (!rm) {
      ok(r.positions >= 3, E('A: ≥ 2 posiciones intermedias'), r.positions)
      ok(r.slots > 0 && r.slots < r.chars, E('A: solo ruedan los caracteres que cambian'), `${r.slots} de ${r.chars}`)
      ok(r.ws.every((w) => Math.abs(w - r.wEnd) <= 0.5), E('A: Δ ancho 0 durante la capa'), r.ws.join(',') + ' → ' + r.wEnd)
      ok(r.done, E('A: la capa se retira al terminar'), r.ms + ' ms')
      ok(r.stacked === 0 && r.layers <= 1 * r.chars, E('A: un cambio durante la capa no apila otra'), JSON.stringify({ s: r.stacked, l: r.layers }))
    } else {
      ok(r.anim === 0 && r.done && r.ws.length <= 1, E('A reducido: sin animación calculada y el total nuevo en su sitio en el acto'), JSON.stringify({ a: r.anim, d: r.done, ws: r.ws }))
    }
    await close(p, `A ${rm ? 'reducido' : 'normal'}`)
  }
  if (eng === 'chromium') {
    const p = await open('price.html?many=50', {})
    const lt = await p.evaluate(async () => {
      const long = []
      const po = new PerformanceObserver((l) => l.getEntries().forEach((e) => long.push(Math.round(e.duration)))); po.observe({ type: 'longtask', buffered: false })
      for (let i = 0; i < 3; i++) { window.__price.nights.value = 3 + i; await new Promise((r) => setTimeout(r, 400)) }
      po.disconnect(); return { long, n: document.querySelectorAll('.g-price--has-total').length }
    })
    ok(lt.n === 50 && lt.long.every((d) => d <= 50), E('A rendimiento: 50 precios con total cambian sin tarea larga > 50 ms'), JSON.stringify(lt))
    note(`chromium: 50 totales cambiando ×3, tareas largas: ${lt.long.length ? lt.long.join(',') + ' ms' : 'ninguna'}`)
    await close(p, 'rendimiento')
  }

  /* 4 · RTL: ar-EG (fila real) y la página en rtl; separación del importe ltr hacia su vecino (P-A1) */
  for (const qs of ['', 'dir=rtl']) {
    const p = await open('price.html?c=C', { qs })
    const r = await p.evaluate(() => {
      const gapOf = (el) => parseFloat(getComputedStyle(el.closest('.g-price')).getPropertyValue('--_gap')) || parseFloat(getComputedStyle(el.closest('.g-price')).marginLeft)
      const pairs = []
      const check = (line) => { const kids = [...line.children]; for (let i = 0; i + 1 < kids.length; i++) { const a = kids[i].getBoundingClientRect(), b = kids[i + 1].getBoundingClientRect(); if (a.bottom <= b.top + 1 || b.bottom <= a.top + 1) continue; const rtl = getComputedStyle(line).direction === 'rtl'; pairs.push({ k: kids[i].className.baseVal ?? kids[i].className, gap: Math.round((rtl ? a.left - b.right : b.left - a.right) * 10) / 10 }) } }
      const scopeSel = document.documentElement.dir === 'rtl' ? '.g-price' : '[data-case="ar"] .g-price'
      document.querySelectorAll(scopeSel).forEach((pr) => pr.querySelectorAll('.g-price__now, .g-price__visual > .g-price__compare, .g-price__total').forEach(check))
      const ar = document.querySelector('[data-case="ar"] .g-price')
      const arrow = ar.querySelector('.g-price__arrow')
      return { pairs, gap: gapOf(ar), arrowScale: getComputedStyle(arrow).scale, amt: getComputedStyle(ar.querySelector('.g-price__amount')).direction, digits: /[٠-٩]/.test(ar.querySelector('.g-price__visual').textContent), bidi: /[‎‏؜]/.test(ar.querySelector('.g-price__visual').textContent) }
    })
    const minGap = Math.min(...r.pairs.map((x) => x.gap))
    ok(minGap >= 3.5, E(`RTL ${qs || 'ar-EG'}: cada parte separada de su vecina (el importe ltr también)`), JSON.stringify(r.pairs.filter((x) => x.gap < 3.5).slice(0, 4)))
    if (!qs) ok(/^-1/.test(r.arrowScale) && r.amt === 'ltr' && r.digits && !r.bidi, E('ar-EG: flecha espejada, importe ltr, cifras arábigo-índicas, sin marcas bidi'), JSON.stringify({ s: r.arrowScale, a: r.amt }))
    ok(!(await overflowX(p)), E(`RTL ${qs || 'ar-EG'}: sin desplazamiento horizontal`))
    await close(p, 'RTL ' + qs)
  }

  /* 5 · 320 px: base, A, B, C y la página rtl, sin desplazamiento ni importes partidos */
  for (const c of ['base', 'A', 'B', 'C', 'C&dir=rtl']) {
    const p = await open(`price.html?c=${c}`, { vw: 320, vh: 800 })
    const r = await p.evaluate(() => ({ split: [...document.querySelectorAll('.g-price__amount, .g-price__total-amount')].filter((a) => a.getClientRects().length > 1 || a.getBoundingClientRect().height > parseFloat(getComputedStyle(a).lineHeight) * 1.5).length, out: [...document.querySelectorAll('.g-price')].filter((x) => { const b = x.getBoundingClientRect(); return b.right > innerWidth + 0.5 || b.left < -0.5 }).length }))
    ok(!(await overflowX(p)) && r.split === 0 && r.out === 0, E(`320 px ${c}: sin desplazamiento horizontal, sin importes partidos, todo dentro`), JSON.stringify(r))
    await close(p, '320 ' + c)
  }

  /* 6 · Campo currency (GNumberField): es-MX, en-US, de-DE, JPY */
  for (const lang of ['es-MX', 'en-US']) {
    const p = await open(`price.html?c=C${lang === 'en-US' ? '&lang=en-US' : ''}`, {})
    const f = await p.evaluate(() => {
      const one = (sel) => { const i = document.querySelector(sel); const r = i.closest('.g-input'); const pre = r.querySelector('.g-input__prefix'), suf = r.querySelector('.g-input__suffix'); const aff = pre || suf; return { text: i.value, pre: pre?.textContent.trim() ?? null, suf: suf?.textContent.trim() ?? null, hidden: aff?.getAttribute('aria-hidden'), fs: aff ? parseFloat(getComputedStyle(aff).fontSize) : 0, c: aff ? window.__c.text(aff) : 0, h: i.closest('.g-input__control, .g-input__field')?.getBoundingClientRect().height ?? i.getBoundingClientRect().height, desc: (i.getAttribute('aria-describedby') || '').split(' ').map((id) => document.getElementById(id)?.textContent || '').join(' | ') } }
      return { main: one('[data-field="main"]'), jpy: one('[data-field="jpy"]'), de: one('[data-field="de"]') }
    })
    if (lang === 'es-MX') ok(f.main.pre === '$ MXN' && f.main.text === '1,850.00' && /pesos mexicanos/.test(f.main.desc), E('campo es-MX: «$ MXN» delante, «1,850.00», lectura con el nombre'), JSON.stringify(f.main))
    else ok(f.main.pre === 'MX$' && f.main.text === '1,850.00' && /Mexican pesos/i.test(f.main.desc), E('campo en-US: «MX$» sin código, lectura con el nombre'), JSON.stringify(f.main))
    ok(f.de.suf === '€' && f.de.text === '1.850,00', E(`campo de-DE (${lang}): «€» detrás y «1.850,00»`), JSON.stringify(f.de))
    ok(f.jpy.pre && /JPY|¥/.test(f.jpy.pre) && /yenes|yen/i.test(f.jpy.desc), E(`campo JPY (${lang}): afijo de la moneda y lectura con su nombre`), JSON.stringify(f.jpy))
    for (const [k, v] of Object.entries(f)) ok(v.hidden === 'true' && v.fs >= 12 && v.c >= 4.5 && v.h >= 24, E(`campo ${k} (${lang}): afijo aria-hidden, ≥ 12 px, ≥ 4,5:1, control ≥ 24 px`), JSON.stringify({ fs: v.fs, c: v.c, h: v.h }))
    if (lang === 'es-MX') {
      await p.evaluate(() => { window.__price.fieldAmount.value = 2500.5; window.__price.fieldCurrency.value = 'JPY' }); await settle(p, 80)
      const j = await p.evaluate(() => ({ model: window.__price.fieldAmount.value, text: document.querySelector('[data-field="main"]').value, im: document.querySelector('[data-field="main"]').inputMode }))
      ok(j.model === 2501 && j.text === '2,501' && j.im === 'numeric', E('campo: cambiar a JPY redondea modelo y texto (defecto 1 de P-L7) e inputmode numeric'), JSON.stringify(j))
    }
    await close(p, 'campo ' + lang)
  }

  /* 7 · Día con precio: celdas iguales, contenido dentro, 320 px; límite P-C1 de cinco cifras */
  for (const vw of [1100, 320]) {
    const p = await open('price.html?c=C', { vw, vh: 900 })
    const r = await p.evaluate(() => {
      const days = [...document.querySelectorAll('.g-datepicker__day')]
      const sizes = new Set(days.map((d) => { const b = d.getBoundingClientRect(); return Math.round(b.width) + 'x' + Math.round(b.height) }))
      const inside = (d) => { const p = d.querySelector('.g-price__amount'); if (!p) return true; const a = p.getBoundingClientRect(), b = d.getBoundingClientRect(); return a.left >= b.left - 0.5 && a.right <= b.right + 0.5 && a.bottom <= b.bottom + 0.5 }
      const withP = days.filter((d) => d.querySelector('.g-price'))
      const fs = parseFloat(getComputedStyle(withP[0].querySelector('.g-price__amount')).fontSize)
      const numTop = new Set(days.map((d) => { const rr = document.createRange(); rr.selectNode(d.firstChild); return Math.round(rr.getBoundingClientRect().top - d.getBoundingClientRect().top) }))
      const root = document.querySelector('[data-cal] .g-datepicker')
      const minDay = Math.min(...days.map((d) => Math.min(d.getBoundingClientRect().width, d.getBoundingClientRect().height)))
      const label = withP[0].getAttribute('aria-label')
      const out4 = days.filter((d) => !inside(d)).length
      // P-C1: cinco cifras en la celda (se escribe «12,400» en el número de cada precio)
      withP.forEach((d) => { d.querySelector('.g-price__number').textContent = '12,400' })
      const over5 = withP.filter((d) => !inside(d)).length
      return { sizes: [...sizes], out: out4, fs, numTop: [...numTop], cls: root.classList.contains('g-datepicker--day-content'), minDay, label, over5, n: withP.length, cellW: Math.round(withP[0].getBoundingClientRect().width) }
    })
    ok(r.cls && r.sizes.length === 1 && r.numTop.length === 1, E(`día ${vw} px: --day-content, todas las celdas iguales y el número en la misma altura`), JSON.stringify({ s: r.sizes, t: r.numTop }))
    ok(r.fs >= 12 && r.minDay >= 24, E(`día ${vw} px: precio ≥ 12 px, área ≥ 24 px`), JSON.stringify({ fs: r.fs, m: r.minDay }))
    ok(r.out === 0, E(`día ${vw} px: el precio de cuatro cifras dentro de su celda`), r.out)
    ok(/pesos mexicanos/.test(r.label), E(`día ${vw} px: dayDescription en el nombre del día`), r.label)
    if (vw === 320) note(`${eng} 320 px: cinco cifras («12,400») ${r.over5 ? `desbordan ${r.over5} de ${r.n} celdas (celda ${r.cellW} px)` : 'caben'}: límite P-C1 (notation compact, #778)`)
    ok(!(await overflowX(p)), E(`día ${vw} px: sin desplazamiento horizontal`))
    await close(p, 'día ' + vw)
  }

  /* 8 · forced-colors (Chromium emulado) */
  if (eng === 'chromium') {
    const p = await open('price.html?c=C', { fc: true })
    const fc = await p.evaluate(() => {
      const sv = document.querySelector('[data-room="patio"] .g-price__saving'), seal = document.querySelector('.g-price-scope__seal'), tax = document.querySelector('.g-price-scope__taxes'), ar = document.querySelector('[data-room="patio"] .g-price__arrow')
      return { saving: getComputedStyle(sv).borderTopStyle, seal: getComputedStyle(seal).borderTopStyle, taxes: getComputedStyle(tax).borderInlineStartStyle, arrow: getComputedStyle(ar).color, text: getComputedStyle(document.body).color }
    })
    ok(fc.saving === 'solid' && fc.seal === 'solid' && fc.taxes === 'solid' && fc.arrow === fc.text, E('forced-colors: ahorro, sello y filete con borde del sistema; flecha en CanvasText'), JSON.stringify(fc))
    await close(p, 'forced-colors')
  }
  await b.close()
}
stop()
report('Auditoría GPrice')
