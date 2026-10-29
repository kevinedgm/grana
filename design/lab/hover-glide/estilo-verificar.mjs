// Verificación de estilo de coco para «una sola luz» (#957 a #963) en GSidebar.css y GTable.css (CSS FUENTE).
// Banco: design/lab/hover-glide/estilo-banco.html (componentes de dist/ + src/styles/grana.css + el motor de laboratorio de
// kiwi r01/hg.js, hasta que bruno pinte las capas en el vnode). Mide: caja de la luz = caja del destino (recortada por la
// junta en el sidebar), ≤ 1 luz por lista y 0 fondos propios en un barrido, paso de las filas igual que con el CSS de dist/
// (HEAD 3109911, servido por page.route), piso de 24 px en compact, transiciones (M1 sin muelle; instantánea; reduce = solo opacidad), forced-colors
// (capa oculta), navbar/surface/cards (entrada con fundido, salida instantánea), seleccionada encima, RTL y contraste del
// texto sobre la luz en claro, oscuro, zona de marca y los temas generados de tema-oscuro/dark-color-presence.
// Uso (raíz del repo): python3 -m http.server 4209 -d . &  node design/lab/hover-glide/estilo-verificar.mjs [chromium|firefox|webkit|all] [--verbose]
import { chromium, firefox, webkit } from 'playwright'
import { readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

// Línea base: GSidebar.css y GTable.css de HEAD~ antes de la luz (git show), servidos en lugar de los de src/ por page.route
const BASE_REV = process.env.BASE_REV || '3109911'
const baseline = Object.fromEntries(['GSidebar', 'GTable'].map((c) => [c, execFileSync('git', ['show', `${BASE_REV}:packages/vue/src/components/${c}/${c}.css`], { encoding: 'utf8' })]))

const ORIGIN = process.env.ORIGIN || 'http://localhost:4209'
const BASE = ORIGIN + '/design/lab/hover-glide/estilo-banco.html'
const which = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'all'
const verbose = process.argv.includes('--verbose')
const engines = { chromium, firefox, webkit }
const list = which === 'all' ? Object.keys(engines) : [which]
const THEMES = readdirSync(new URL('../tema-oscuro/dark-color-presence/generated/', import.meta.url))
  .filter((f) => f.endsWith('.css') && !f.includes('.variants')).map((f) => f.replace('.css', ''))

const out = {}
const contrast = []
for (const name of list) {
  const r = out[name] = { pass: 0, fail: 0, fails: [] }
  const ok = (cond, label, info) => { if (cond) r.pass++; else { r.fail++; r.fails.push(label + (info !== undefined ? ' ' + JSON.stringify(info) : '')) } }
  const browser = await engines[name].launch()

  async function open (q = '', ctxOpts = {}, { before = false } = {}) {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 3200 }, ...ctxOpts })
    const p = await ctx.newPage()
    if (before) for (const c of Object.keys(baseline)) await p.route(`**/components/${c}/${c}.css`, (rt) => rt.fulfill({ contentType: 'text/css', body: baseline[c] }))
    const errs = []
    p.on('pageerror', (e) => errs.push(String(e)))
    p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
    await p.goto(BASE + q)
    await p.waitForFunction(() => window.hgReady === true)
    await p.addStyleTag({ content: '*{caret-color:transparent}' })
    await p.waitForTimeout(300)
    return { p, ctx, errs }
  }
  const box = (p, sel) => p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height } }, sel)
  // Caja visible de la luz (rect de la capa con opacidad final 1) de una lista
  const light = (p, hostSel, layerSel) => p.evaluate(([h, l]) => {
    const host = document.querySelector(h); if (!host) return null
    const el = host.querySelector(':scope > ' + l); if (!el) return { missing: true }
    const cs = getComputedStyle(el)
    const b = el.getBoundingClientRect()
    return { on: host.classList.contains('has-highlight'), op: +cs.opacity, display: cs.display, x: b.x, y: b.y, w: b.width, h: b.height, bg: cs.backgroundColor, tp: cs.transitionProperty, td: cs.transitionDuration, radius: cs.borderTopLeftRadius }
  }, [hostSel, layerSel])
  const ownBg = (p, scope) => p.evaluate((s) => {
    const root = document.querySelector(s)
    const bg = (e) => { const c = getComputedStyle(e).backgroundColor; return c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent' }
    return [...root.querySelectorAll('.g-sidebar__link, .g-table__row:not(.is-selected) > td')].filter(bg).length
  }, scope)
  const near = (a, b, t = 1.01) => Math.abs(a - b) <= t
  const center = (b) => [b.x + b.w / 2, b.y + b.h / 2]
  const tokens = (p) => p.evaluate(() => {
    const d = getComputedStyle(document.documentElement)
    const ms = (v) => v.trim().endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000
    return { press: ms(d.getPropertyValue('--g-duration-press')), fast: ms(d.getPropertyValue('--g-duration-fast')), s1: parseFloat(d.getPropertyValue('--g-space-1')) }
  })

  // ---------- 1. Sidebar: caja, junta, color, barrido ----------
  {
    const { p, ctx, errs } = await open()
    const tk = await tokens(p)
    const seam = tk.s1 * 0.5
    console.log(name, 'motor de la luz:', await p.evaluate(() => window.hgEngine))
    await p.locator('#sb-default .g-sidebar__parent').first().click()
    await p.mouse.move(2, 2)
    await p.waitForTimeout(500)
    const links = await p.evaluate(() => [...document.querySelectorAll('#sb-default .g-sidebar__nav .g-sidebar__link')].map((a, i) => {
      a.dataset.hgI = i; const b = a.getBoundingClientRect()
      return { i, x: b.x, y: b.y, w: b.width, h: b.height, dis: a.getAttribute('aria-disabled') === 'true', sub: !!a.closest('.g-sidebar__sub'), cur: a.getAttribute('aria-current') === 'page' }
    }))
    ok(links.length >= 10, 'sidebar: enlaces', links.length)
    // Filas que se tocan dentro de cada lista (incluidos los hijos del submenú abierto)
    const touching = await p.evaluate(() => [...document.querySelectorAll('#sb-default .g-sidebar__list')].map((ul) => {
      const ls = [...ul.querySelectorAll('.g-sidebar__link')].filter((a) => !a.closest('[inert]')).map((a) => a.getBoundingClientRect())
      let gaps = 0; for (let i = 1; i < ls.length; i++) gaps = Math.max(gaps, Math.abs(ls[i].top - ls[i - 1].bottom))
      return gaps
    }))
    ok(touching.every((g) => g < 0.6), 'sidebar: las filas se tocan en cada lista (hueco máx. px)', touching)
    const nav = await box(p, '#sb-default .g-sidebar__nav')
    const visible = links.filter((x) => !x.dis && x.y >= nav.y && x.y + x.h <= nav.y + nav.h)
    ok(visible.length >= 8, 'sidebar: enlaces visibles para medir', visible.length)
    for (const l of visible) {
      await p.mouse.move(l.x + l.w / 2, l.y + l.h / 2, { steps: 2 })
      await p.waitForTimeout(tk.press + 120)
      const host = await p.evaluate((i) => { const a = document.querySelector(`[data-hg-i="${i}"]`); const ul = a.closest('.g-sidebar__list'); ul.id ||= 'hgl' + i; return '#' + ul.id }, l.i)
      const L = await light(p, host, '.g-sidebar__highlight')
      ok(L && L.on && L.op === 1, 'sidebar: luz encendida sobre ' + l.i, L)
      ok(L && near(L.x, l.x) && near(L.w, l.w) && near(L.y, l.y + seam / 2) && near(L.h, l.h - seam), 'sidebar: caja = enlace recortado por la junta ' + l.i, { L, l })
    }
    const L0 = await light(p, '#sb-default .g-sidebar__list', '.g-sidebar__highlight')
    const linkBorder = await p.evaluate(() => { const s = document.createElement('i'); s.style.color = 'var(--g-color-border)'; document.querySelector('#sb-default').append(s); const c = getComputedStyle(s).color; s.remove(); return c })
    ok(L0.bg === linkBorder, 'sidebar: la luz lee --g-color-border', [L0.bg, linkBorder])
    const radius = await p.evaluate(() => getComputedStyle(document.querySelector('#sb-default .g-sidebar__link')).borderTopLeftRadius)
    ok(L0.radius === radius, 'sidebar: radio de la luz = radio del enlace', [L0.radius, radius])
    // Transiciones (M1): translate, inline-size, block-size press; opacity fast; sin muelle
    ok(/translate/.test(L0.tp) && /inline-size|width/.test(L0.tp) && /block-size|height/.test(L0.tp) && /opacity/.test(L0.tp), 'sidebar: propiedades de M1', L0.tp)
    const curves = await p.evaluate(() => getComputedStyle(document.querySelector('#sb-default .g-sidebar__highlight')).transitionTimingFunction)
    const ease = await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--g-ease-spring').trim())
    ok(!curves.includes(ease.replace(/\s/g, '')) && !/linear\(/.test(curves), 'sidebar: sin muelle', curves)
    // Barrido vertical a 1px por el centro: ≤ 1 luz visible y 0 fondos propios
    const sb = await box(p, '#sb-default .g-sidebar__nav')
    let maxLights = 0, maxOwn = 0, darkInside = 0
    for (let y = sb.y + 2; y < sb.y + sb.h - 2; y += 1) {
      await p.mouse.move(sb.x + sb.w / 2, y)
      if (Math.round(y) % 6 === 0) {
        const s = await p.evaluate(([x, y]) => {
          const lights = [...document.querySelectorAll('#sb-default .g-sidebar__highlight')].filter((l) => +getComputedStyle(l).opacity > 0.05).length
          const bg = (e) => { const c = getComputedStyle(e).backgroundColor; return c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent' }
          const own = [...document.querySelectorAll('#sb-default .g-sidebar__link')].filter(bg).length
          return { lights, own }
        }, [sb.x + sb.w / 2, y])
        maxLights = Math.max(maxLights, s.lights); maxOwn = Math.max(maxOwn, s.own)
      }
    }
    ok(maxLights <= 1, 'sidebar: barrido ≤ 1 luz visible', maxLights)
    ok(maxOwn === 0, 'sidebar: barrido 0 fondos propios', maxOwn)
    // Instantánea: solo opacidad
    const inst = await p.evaluate(() => { const ul = document.querySelector('#sb-default .g-sidebar__list'); ul.classList.add('is-highlight-instant'); const tp = getComputedStyle(ul.querySelector('.g-sidebar__highlight')).transitionProperty; ul.classList.remove('is-highlight-instant'); return tp })
    ok(inst === 'opacity', 'sidebar: is-highlight-instant solo opacidad', inst)
    // Asiento del actual intacto bajo la luz
    const cur = links.find((l) => l.cur)
    await p.mouse.move(cur.x + cur.w / 2, cur.y + cur.h / 2)
    await p.waitForTimeout(tk.press + 120)
    const seat = await p.evaluate(() => { const i = document.querySelector('#sb-default [aria-current="page"] .g-sidebar__icon'); return +getComputedStyle(i, '::before').opacity })
    ok(seat === 1, 'sidebar: el asiento del actual sigue lleno con la luz encima del enlace', seat)
    ok(errs.length === 0, 'sidebar: consola limpia', errs)
    await ctx.close()
  }

  // ---------- 2. Paso de las filas igual que con el CSS anterior (dist/) y compact con su piso ----------
  {
    const pitch = async (before) => {
      const { p, ctx } = await open('', {}, { before })
      const v = await p.evaluate(() => Object.fromEntries(['#sb-default', '#sb-compact', '#sb-rail'].map((s) => {
        const ls = [...document.querySelectorAll(s + ' .g-sidebar__list')][1]
        const cs = [...ls.querySelectorAll(':scope > .g-sidebar__item > .g-sidebar__link')].map((a) => { const b = a.getBoundingClientRect(); return b.top + b.height / 2 })
        return [s, { centers: cs.map((c) => c - cs[0]), h: ls.querySelector('.g-sidebar__link').getBoundingClientRect().height }]
      })))
      await ctx.close(); return v
    }
    const now = await pitch(false); const before = await pitch(true)
    for (const s of Object.keys(now)) {
      ok(now[s].centers.every((c, i) => near(c, before[s].centers[i])), 'paso: centros de fila iguales que antes ' + s, { now: now[s].centers, before: before[s].centers })
    }
    ok(now['#sb-compact'].h >= 24, 'compact: área ≥ 24px', now['#sb-compact'].h)
    if (verbose) console.log(name, 'alto de fila', Object.fromEntries(Object.entries(now).map(([k, v]) => [k, [before[k].h, v.h]])))
  }

  // ---------- 3. Navbar: entrada con fundido, salida instantánea ----------
  {
    const { p, ctx } = await open()
    const tabs = await p.evaluate(() => [...document.querySelectorAll('#sb-nav .g-sidebar__bar > li:not(.is-current) > .g-sidebar__tab')].map((t) => { const b = t.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 } }))
    if (tabs.length >= 2) {
      await p.mouse.move(tabs[0].x, tabs[0].y)
      const tin = await p.evaluate(() => { const t = document.querySelectorAll('#sb-nav .g-sidebar__bar > li:not(.is-current) > .g-sidebar__tab')[0]; const cs = getComputedStyle(t); return { tp: cs.transitionProperty, td: cs.transitionDuration } })
      ok(/background-color/.test(tin.tp), 'navbar: el hover entra con fundido', tin)
      await p.waitForTimeout(300)
      await p.mouse.move(tabs[1].x, tabs[1].y)
      const n = await p.evaluate(() => [...document.querySelectorAll('#sb-nav .g-sidebar__tab')].filter((t) => { const c = getComputedStyle(t).backgroundColor; return c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent' }).length)
      ok(n <= 1, 'navbar: nunca dos celdas con fondo (salida instantánea)', n)
      const lay = await p.evaluate(() => document.querySelectorAll('#sb-nav .g-sidebar__highlight').length)
      ok(lay === 0, 'navbar: sin capa', lay)
    } else ok(false, 'navbar: pestañas', tabs.length)
    await ctx.close()
  }

  // ---------- 4. Tabla: llana, A, B; seleccionada encima; casilla sin fondo; transición del td quitada ----------
  {
    const { p, ctx, errs } = await open()
    const tk = await tokens(p)
    const rows = async (id) => p.evaluate((id) => [...document.querySelectorAll(`#${id} .g-table__row`)].map((tr) => {
      const b = tr.getBoundingClientRect(); const c = tr.querySelector('.g-table__cell--primary').getBoundingClientRect(); const o = tr.lastElementChild.getBoundingClientRect()
      return { row: { x: b.x, y: b.y, w: b.width, h: b.height }, prim: { x: c.x, y: c.y, w: c.width, h: c.height }, other: { x: o.x + o.width / 2, y: o.y + o.height / 2 }, sel: tr.classList.contains('is-selected') }
    }), id)
    for (const id of ['t-plain', 't-detail']) {
      const rs = await rows(id)
      for (const rr of rs.slice(0, 4)) {
        await p.mouse.move(rr.other.x, rr.other.y, { steps: 2 })
        await p.waitForTimeout(tk.press + 120)
        const L = await light(p, `#${id} .g-table__scroll`, '.g-table__highlight')
        ok(L.on && L.op === 1 && near(L.x, rr.row.x) && near(L.y, rr.row.y) && near(L.w, rr.row.w) && near(L.h, rr.row.h), `${id}: luz = fila`, { L, rr: rr.row })
      }
      ok(await ownBg(p, '#' + id) === 0 + (id === 't-plain' ? 0 : 0), `${id}: ninguna celda con fondo propio (salvo seleccionada)`)
    }
    // A · la puerta
    const ra = await rows('t-door')
    await p.mouse.move(ra[1].other.x, ra[1].other.y, { steps: 2 }); await p.waitForTimeout(tk.press + 120)
    let LA = await light(p, '#t-door .g-table__scroll', '.g-table__highlight')
    ok(!LA.on, 'A: en otra celda, ninguna luz', LA)
    const sx = await p.evaluate(() => { const td = document.querySelectorAll('#t-door .g-table__row')[1].querySelector('.g-table__select'); const b = td.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 } })
    await p.mouse.move(sx.x, sx.y); await p.waitForTimeout(150)
    const selBg = await p.evaluate(() => getComputedStyle(document.querySelectorAll('#t-door .g-table__row')[1].querySelector('.g-table__select')).backgroundColor)
    ok(selBg === 'rgba(0, 0, 0, 0)', 'A: la casilla no tiene fondo de hover', selBg)
    await p.mouse.move(ra[2].prim.x + ra[2].prim.w / 2, ra[2].prim.y + ra[2].prim.h / 2, { steps: 2 }); await p.waitForTimeout(tk.press + 120)
    LA = await light(p, '#t-door .g-table__scroll', '.g-table__highlight')
    ok(LA.on && near(LA.x, ra[2].prim.x) && near(LA.w, ra[2].prim.w) && near(LA.y, ra[2].prim.y) && near(LA.h, ra[2].prim.h), 'A: luz = celda principal', { LA, prim: ra[2].prim })
    ok(await ownBg(p, '#t-door') === 0, 'A: ninguna celda con fondo propio')
    // Seleccionada: primary-soft encima de la luz
    const rp = await rows('t-plain')
    const si = rp.findIndex((x) => x.sel)
    await p.mouse.move(rp[si].other.x, rp[si].other.y); await p.waitForTimeout(tk.press + 120)
    const sel = await p.evaluate(() => {
      const td = document.querySelector('#t-plain .g-table__row.is-selected > td'); const s = document.createElement('i'); s.style.color = 'var(--g-color-primary-soft)'; td.append(s)
      const want = getComputedStyle(s).color; s.remove()
      const b = td.getBoundingClientRect(); const top = document.elementFromPoint(b.x + 2, b.y + b.height / 2)
      return { bg: getComputedStyle(td).backgroundColor, want, topIsTable: !top.closest('.g-table__highlight') }
    })
    ok(sel.bg === sel.want && sel.topIsTable, 'seleccionada: primary-soft encima de la luz', sel)
    const tdT = await p.evaluate(() => getComputedStyle(document.querySelector('#t-plain td')).transitionProperty)
    ok(!/background/.test(tdT), 'td: sin transición de background-color', tdT)
    // Cabecera pegada tapa la luz: z-index del th sobre una capa sin contexto de apilamiento
    const stack = await p.evaluate(() => { const t = document.querySelector('#t-plain .g-table__table'); const cs = getComputedStyle(t); return { pos: cs.position, z: cs.zIndex, sp: getComputedStyle(t.parentElement).position } })
    ok(stack.pos === 'relative' && stack.z === 'auto' && stack.sp === 'relative', '<table> y __scroll posicionados sin z-index', stack)
    const tL = await light(p, '#t-plain .g-table__scroll', '.g-table__highlight')
    const tSunk = await p.evaluate(() => { const s = document.createElement('i'); s.style.color = 'var(--g-color-surface-sunken)'; document.querySelector('#t-plain').append(s); const c = getComputedStyle(s).color; s.remove(); return c })
    ok(tL.bg === tSunk, 'tabla: la luz lee --g-color-surface-sunken', [tL.bg, tSunk])
    ok(errs.length === 0, 'tabla: consola limpia', errs)
    await ctx.close()
  }

  // ---------- 5. surface y cards: sin capa; entrada con fundido, salida instantánea ----------
  {
    const { p, ctx } = await open()
    for (const id of ['t-surface', 't-cards']) {
      const disp = await p.evaluate((id) => { const l = document.querySelector(`#${id} .g-table__highlight`); return l ? getComputedStyle(l).display : 'none' }, id)
      ok(disp === 'none', `${id}: capa no pintada`, disp)
      const pts = await p.evaluate((id) => [...document.querySelectorAll(`#${id} .g-table__row`)].slice(0, 3).map((tr) => { const b = tr.lastElementChild.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 } }), id)
      await p.mouse.move(pts[0].x, pts[0].y); await p.waitForTimeout(300)
      const tin = await p.evaluate((id) => { const tr = document.querySelector(`#${id} .g-table__row`); const e = id === 't-cards' ? tr : tr.querySelector('td'); const cs = getComputedStyle(e); return { tp: cs.transitionProperty, bg: cs.backgroundColor } }, id)
      ok(/background-color/.test(tin.tp), `${id}: hover entra con fundido`, tin)
      await p.mouse.move(pts[1].x, pts[1].y)
      const two = await p.evaluate((id) => {
        const s = document.createElement('i'); s.style.color = 'var(--g-color-surface-sunken)'; document.querySelector('#' + id).append(s); const sunk = getComputedStyle(s).color; s.remove()
        return [...document.querySelectorAll(`#${id} .g-table__row`)].filter((tr) => [tr, ...tr.children].some((e) => getComputedStyle(e).backgroundColor === sunk)).length
      }, id)
      ok(two <= 1, `${id}: nunca dos filas con fondo de hover`, two)
    }
    await ctx.close()
  }

  // ---------- 6. Movimiento reducido, forced-colors, toque (CSS), RTL ----------
  {
    const { p, ctx } = await open('', { reducedMotion: 'reduce' })
    const t = await p.evaluate(() => [getComputedStyle(document.querySelector('#sb-default .g-sidebar__highlight')).transitionProperty, getComputedStyle(document.querySelector('#t-plain .g-table__highlight')).transitionProperty])
    ok(t.every((x) => x === 'opacity'), 'reduce: solo fundido', t)
    await ctx.close()
  }
  if (name === 'chromium') {
    const { p, ctx } = await open('', { forcedColors: 'active' })
    const d = await p.evaluate(() => [getComputedStyle(document.querySelector('#sb-default .g-sidebar__highlight')).display, getComputedStyle(document.querySelector('#t-plain .g-table__highlight')).display])
    ok(d.every((x) => x === 'none'), 'forced-colors: capa oculta', d)
    await ctx.close()
  }
  {
    const { p, ctx } = await open('?dir=rtl')
    const tk = await tokens(p)
    const seam = tk.s1 * 0.5
    const l = await box(p, '#sb-default .g-sidebar__list .g-sidebar__item:nth-of-type(2) > .g-sidebar__link')
    await p.mouse.move(l.x + l.w / 2, l.y + l.h / 2, { steps: 2 }); await p.waitForTimeout(tk.press + 120)
    const L = await light(p, '#sb-default .g-sidebar__list', '.g-sidebar__highlight')
    ok(L.on && near(L.x, l.x) && near(L.w, l.w) && near(L.y, l.y + seam / 2), 'RTL sidebar: luz sobre el enlace', { L, l })
    const tr = await box(p, '#t-plain .g-table__row:nth-child(2)')
    await p.mouse.move(tr.x + 10, tr.y + tr.h / 2, { steps: 2 }); await p.waitForTimeout(tk.press + 120)
    const T = await light(p, '#t-plain .g-table__scroll', '.g-table__highlight')
    ok(T.on && near(T.x, tr.x) && near(T.w, tr.w) && near(T.y, tr.y), 'RTL tabla: luz sobre la fila', { T, tr })
    await ctx.close()
  }

  // ---------- 7. Contraste del texto sobre la luz (claro, oscuro, zona de marca y temas generados) ----------
  if (name === 'chromium') {
    const variants = [['claro', ''], ['oscuro', '?dark=1'], ...THEMES.flatMap((t) => [[t, '?theme=' + t], [t + ' oscuro', '?theme=' + t + '&dark=1']])]
    for (const [vn, q] of variants) {
      const { p, ctx } = await open(q)
      await p.waitForTimeout(200)
      const res = await p.evaluate(() => {
        const cv = document.createElement('canvas'); cv.width = cv.height = 1; const g = cv.getContext('2d', { willReadFrequently: true })
        const px = (layers) => { g.clearRect(0, 0, 1, 1); for (const c of layers) { g.fillStyle = '#000'; g.fillStyle = c; g.fillRect(0, 0, 1, 1) } return [...g.getImageData(0, 0, 1, 1).data].slice(0, 3) }
        const col = (el, v) => { const s = document.createElement('i'); s.style.color = `var(${v})`; el.append(s); const c = getComputedStyle(s).color; s.remove(); return c }
        const lum = ([r, gg, b]) => { const f = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(gg) + 0.0722 * f(b) }
        const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05) }
        const page = getComputedStyle(document.body).backgroundColor
        const out = []
        const sb = (id, label, bgVar) => {
          const el = document.querySelector(id); const base = [page, getComputedStyle(el).backgroundColor]
          const lightc = px([...base, col(el, bgVar)])
          for (const [what, v] of [['etiqueta', '--g-color-text'], ['icono', '--g-color-text-muted'], ['subtle', '--g-color-text-subtle']]) {
            const fg = px([...base, col(el, bgVar), col(el, v)])
            out.push({ where: label, what, ratio: cr(fg, lightc) })
          }
          // la luz frente a la superficie (no informa estado: referencia)
          out.push({ where: label, what: 'luz/superficie', ratio: cr(lightc, px(base)) })
        }
        sb('#sb-default', 'sidebar', '--g-color-border')
        sb('#sb-zone', 'sidebar zona', '--g-color-border')
        const tb = (id, label) => {
          const el = document.querySelector(id + ' .g-table__scroll'); const base = [page, getComputedStyle(document.querySelector(id).closest('.hg-sec')).backgroundColor, getComputedStyle(document.querySelector(id)).backgroundColor]
          const lightc = px([...base, col(el, '--g-color-surface-sunken')])
          for (const [what, v] of [['texto', '--g-color-text'], ['muted', '--g-color-text-muted']]) out.push({ where: label, what, ratio: cr(px([...base, col(el, '--g-color-surface-sunken'), col(el, v)]), lightc) })
          out.push({ where: label, what: 'luz/superficie', ratio: cr(lightc, px(base)) })
        }
        tb('#t-plain', 'tabla'); tb('#t-zone', 'tabla zona')
        return out
      })
      for (const x of res) contrast.push({ theme: vn, ...x })
      await ctx.close()
    }
    for (const x of contrast) {
      if (x.what === 'luz/superficie' || x.what === 'subtle') continue
      ok(x.ratio >= 4.5, `contraste ${x.theme} · ${x.where} · ${x.what} ≥ 4.5`, +x.ratio.toFixed(2))
    }
  }
  await browser.close()
}

if (contrast.length) {
  const by = {}
  for (const x of contrast) { const k = x.where + ' · ' + x.what; (by[k] ||= []).push(x) }
  console.log('Contraste sobre la luz (mín · tema del mín · claro · oscuro):')
  for (const [k, xs] of Object.entries(by)) {
    const m = xs.reduce((a, b) => (b.ratio < a.ratio ? b : a))
    const f = (t) => (xs.find((x) => x.theme === t) || {}).ratio
    console.log(`  ${k}: ${m.ratio.toFixed(2)} (${m.theme}) · ${f('claro')?.toFixed(2)} · ${f('oscuro')?.toFixed(2)}`)
  }
  if (verbose) for (const x of contrast) console.log(x.theme, x.where, x.what, x.ratio.toFixed(2))
}
let total = 0, pass = 0
for (const [n, r] of Object.entries(out)) {
  total += r.pass + r.fail; pass += r.pass
  console.log(`${n}: ${r.pass}/${r.pass + r.fail}`)
  for (const f of r.fails) console.log('  FALLA', f)
}
console.log(`total ${pass}/${total}`)
process.exit(pass === total ? 0 : 1)
