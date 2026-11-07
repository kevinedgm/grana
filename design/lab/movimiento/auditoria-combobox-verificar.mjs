// Auditoría de coco de GCombobox tras #1017, #1018 y #1019, sobre el componente REAL (dist) en el banco r01: lo que
// tests/movimiento.spec.mjs no mide cuadro a cuadro. Barrido sin dos marcas, anillo solo tras teclado, elegir con is-landing
// sin saltos (field, palette, multiple con cesta y con lista), salida con su anillo (H2), reducido, forced-colors, hoja móvil,
// dentro de GDialog y densidad compacta.
// Ejecutar: node design/lab/movimiento/auditoria-combobox-verificar.mjs   (ENGINES=chromium,firefox,webkit por defecto).
// BASE=<url del banco> para medir otro árbol (por defecto, file://). Requiere `npm run build`. ONLY=barrido,anillo,… filtra.
import { writeFileSync } from 'node:fs'
const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const url = process.env.BASE || new URL('./r01/banco.html', import.meta.url).href
const engines = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const only = process.env.ONLY ? process.env.ONLY.split(',') : null
const on = (s) => !only || only.includes(s)
const out = {}, tally = {}
const check = (e, name, pass, extra = '') => {
  tally[e] ||= { ok: 0, ko: 0 }
  pass ? tally[e].ok++ : tally[e].ko++
  if (!pass) console.log(`FALLA ${e} · ${name} ${typeof extra === 'string' ? extra : JSON.stringify(extra)}`)
}
const note = (e, k, v) => { (out[e] ||= {})[k] = v }

const MOUNT = () => {
  const { createApp, h, reactive } = Vue
  const G = Grana, C = GranaCombobox.GCombobox
  const opt = (n, p = 'Opción') => Array.from({ length: n }, (_, i) => ({ value: `${p}${i}`, label: `${p} ${i + 1}` }))
  const labels = { close: 'Cerrar', preview: 'Vista previa', previewEmpty: 'Nada', noResults: 'Sin resultados para {text}', selected: '{count} elegidas', chosen: 'Elegidas', done: 'Listo', rest: 'y {count} más', basketEmpty: 'Nada', undo: 'Deshacer', trace: 'Quitada', clear: 'Limpiar' }
  const st = window.cb = reactive({ dlg: false, v: {} })
  const list = [
    ['c-field', { options: opt(30) }],
    ['c-pal', { appearance: 'palette', options: opt(12) }],
    ['c-multi', { multiple: true, options: opt(9), start: ['Opción1'] }],
    ['c-list', { multiple: true, selection: 'list', options: opt(9), start: ['Opción1'] }],
    ['c-cesta', { multiple: true, appearance: 'palette', options: opt(9), start: ['Opción1'] }],
    ['c-compact', { density: 'compact', options: opt(12) }]
  ]
  const one = ([id, { start, ...props }], w = 280) => h('div', { id, style: `width:${w}px` }, [h(C, { label: id, labels, delay: 0, modelValue: st.v[id] ?? start ?? null, 'onUpdate:modelValue': (v) => { st.v[id] = v }, ...props })])
  const el = document.createElement('div')
  el.id = 'extras'
  el.style.cssText = 'display:flex;gap:40px;align-items:flex-start;flex-wrap:wrap;margin-block-start:40px'
  document.body.append(el)
  createApp({
    render: () => [...list.map((x) => one(x)),
      h('button', { id: 'd-open', onClick: () => { st.dlg = true } }, 'Diálogo'),
      h(G.GDialog, { id: 'd-x', modelValue: st.dlg, title: 'Diálogo', closeLabel: 'Cerrar', 'onUpdate:modelValue': (v) => { st.dlg = v } }, () => one(['c-dlg', { options: opt(8) }], 260))]
  }).mount(el)
  // Cuadro a cuadro hasta parar
  window.frames = (fn) => { const xs = []; let go = true; (function f() { xs.push(fn()); if (go) requestAnimationFrame(f) })(); return () => { go = false; return xs } }
  window.panelOf = (s) => [...document.querySelectorAll(`${s} .g-combobox__panel`)].at(-1)
  window.paint = (s) => {
    const P = window.panelOf(s)
    if (!P) return null
    const os = [...P.querySelectorAll('.g-combobox__option')]
    const y = P.querySelector('.g-combobox__highlight')
    const cs = (e) => getComputedStyle(e)
    const bg = (e) => { const c = cs(e).backgroundColor; return !(c === 'transparent' || /rgba\(.*,\s*0\)$/.test(c)) }
    return { lit: os.filter(bg).length, rings: os.filter((o) => cs(o).outlineStyle !== 'none').length, act: os.filter((o) => o.classList.contains('is-active')).length, lo: y ? +cs(y).opacity : null, at: y ? cs(y).translate : null, keyed: P.classList.contains('is-keyed') }
  }
  window.gap = (s) => { const P = window.panelOf(s), a = P.querySelector('.is-active'), y = P.querySelector('.g-combobox__highlight'); if (!a || !y) return null; const A = a.getBoundingClientRect(), Y = y.getBoundingClientRect(); return Math.max(Math.abs(A.left - Y.left), Math.abs(A.top - Y.top), Math.abs(A.width - Y.width), Math.abs(A.height - Y.height)) }
  window.tick = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
}

const input = (s) => `${s} input[role="combobox"]`
async function boot(page, { dir } = {}) {
  await page.goto(url)
  await page.waitForFunction(() => window.__ready)
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
  await page.evaluate(MOUNT)
  if (dir) await page.evaluate((d) => { document.documentElement.dir = d }, dir)
  await page.mouse.move(2, 2)
}
async function open(page, s) {
  await page.locator(input(s)).scrollIntoViewIfNeeded()
  await page.click(input(s))
  await page.waitForTimeout(420)
}
const rowsOf = (page, s) => page.evaluate((s) => { const P = window.panelOf(s), V = P.getBoundingClientRect(); return [...P.querySelectorAll('.g-combobox__option')].map((e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, h: r.height, in: r.top >= V.top && r.bottom <= V.bottom } }).filter((r) => r.in) }, s)
const startRec = (page, s) => page.evaluate((s) => { window.__stop = window.frames(() => window.paint(s)) }, s)
const stopRec = (page) => page.evaluate(() => window.__stop())

// Las marcas por cuadro, en cualquier forma
async function sweep(e, page, s, label) {
  const rows = (await rowsOf(page, s)).slice(0, 7)
  // Dos movimientos sobre la fila: el primero de la lista no activa (puntero quieto, #358)
  await page.mouse.move(rows[0].x - 6, rows[0].y, { steps: 4 })
  await page.mouse.move(rows[0].x, rows[0].y, { steps: 2 })
  await page.waitForTimeout(220)
  await startRec(page, s)
  const route = [...rows, ...[...rows].reverse()]
  for (const r of route) { await page.mouse.move(r.x, r.y, { steps: 4 }); await page.waitForTimeout(25) }
  await page.waitForTimeout(220)
  const xs = (await stopRec(page)).filter(Boolean)
  check(e, `${label}: barrido sin fondo por fila`, xs.every((x) => x.lit === 0), xs.find((x) => x.lit))
  check(e, `${label}: barrido sin contorno`, xs.every((x) => x.rings === 0), xs.find((x) => x.rings))
  check(e, `${label}: una activa por cuadro`, xs.every((x) => x.act === 1), xs.find((x) => x.act !== 1))
  check(e, `${label}: la luz no se apaga`, xs.every((x) => x.lo === 1), xs.find((x) => x.lo !== 1))
  const pos = new Set(xs.map((x) => x.at)).size
  check(e, `${label}: la luz pasa por cuadros intermedios`, pos > rows.length, pos)
  check(e, `${label}: acaba sobre la activa`, (await page.evaluate((s) => window.gap(s), s)) <= 1)
  return { frames: xs.length, pos }
}
const closeAll = async (page) => { await page.keyboard.press('Escape'); await page.waitForTimeout(260) }

// Elegir y seguir la pieza que entra: cuadro a cuadro, translate, opacidad, clases y lo que no debe moverse
async function land(e, page, s, sel, act, label, { reduced = false, up = false, down = true } = {}) {
  const space = await page.evaluate(() => { const i = document.body.appendChild(document.createElement('i')); i.style.width = 'var(--g-space-1)'; const v = parseFloat(getComputedStyle(i).width); i.remove(); return v })
  await page.evaluate(({ s, sel }) => {
    const box = document.querySelector(`${s} .g-input__control`)
    window.__stop = window.frames(() => {
      const t = [...document.querySelectorAll(sel)].at(-1)
      const c = t && getComputedStyle(t)
      const r = t && t.getBoundingClientRect()
      const ty = !c || c.translate === 'none' ? 0 : parseFloat(c.translate.split(' ')[1] ?? 0)
      return { has: Boolean(t), land: Boolean(t && t.classList.contains('is-landing')), o: c ? +c.opacity : null, ty, y: r ? r.y - ty : null, x: r ? r.x : null, boxH: box ? box.getBoundingClientRect().height : null, anim: t ? t.getAnimations().map((a) => a.animationName || a.transitionProperty) : [], ms: t ? t.getAnimations().filter((a) => a.animationName).map((a) => a.effect.getTiming().duration) : [] }
    })
  }, { s, sel })
  await act()
  await page.waitForTimeout(520)
  const xs = await stopRec(page)
  const seen = xs.filter((x) => x.land)
  check(e, `${label}: lleva is-landing`, seen.length > 1, seen.length)
  if (seen.length < 2) return null
  const ys = seen.map((x) => x.ty)
  const name = reduced ? 'g-combobox-land-fade' : 'g-combobox-land'
  check(e, `${label}: keyframes ${name}`, seen.some((x) => x.anim.includes(name)), seen[0].anim)
  check(e, `${label}: arranca a ≤ space × 1`, Math.max(...ys.map(Math.abs)) <= space + 0.05, ys)
  if (!reduced) {
    const sign = down ? 1 : -1
    check(e, `${label}: entra desde el lado del panel`, ys.some((v) => v * sign > 0.1) || ys.every((v) => Math.abs(v) < 0.1), ys)
    check(e, `${label}: nunca rebasa`, ys.every((v) => v * sign >= -0.05), ys)
    check(e, `${label}: acerca sin retroceder`, ys.every((v, i) => !i || Math.abs(v) <= Math.abs(ys[i - 1]) + 0.05), ys)
  } else check(e, `${label}: reducido no desplaza`, ys.every((v) => Math.abs(v) < 0.01), ys)
  const os = seen.map((x) => x.o)
  check(e, `${label}: la opacidad solo sube`, os.every((v, i) => !i || v >= os[i - 1] - 0.001), os)
  const yset = seen.map((x) => x.y)
  check(e, `${label}: su sitio no cambia`, Math.max(...yset) - Math.min(...yset) < 0.6, yset)
  check(e, `${label}: la caja no cambia de alto`, new Set(xs.filter((x) => x.boxH).map((x) => Math.round(x.boxH * 2))).size === 1, [...new Set(xs.map((x) => x.boxH))])
  const fin = xs.at(-1)
  check(e, `${label}: se retira`, !fin.land && fin.o === 1 && fin.ty === 0, fin)
  return { frames: seen.length, ys: ys.slice(0, 6).map((v) => +v.toFixed(2)), ms: seen.find((x) => x.ms.length)?.ms[0] }
}

for (const engine of engines) {
  const e = engine
  const browser = await pw[engine].launch()
  const ctxOf = (o = {}) => browser.newContext({ viewport: { width: 1280, height: 1100 }, ...o })

  if (on('barrido')) {
    const ctx = await ctxOf(), page = await ctx.newPage()
    await boot(page)
    const res = {}
    for (const [s, l] of [['#c-field', 'field'], ['#c-multi', 'multiple'], ['#c-list', 'multiple lista'], ['#c-compact', 'compacta']]) {
      await open(page, s)
      res[l] = await sweep(e, page, s, l)
      await closeAll(page); await page.mouse.move(2, 2)
    }
    for (const [s, l] of [['#c-pal', 'palette'], ['#c-cesta', 'multiple cesta']]) {
      await open(page, s)
      await page.waitForTimeout(200) // el diálogo sigue entrando: el barrido empieza sobre la lista quieta
      res[l] = await sweep(e, page, s, l)
      await closeAll(page); await page.mouse.move(2, 2); await page.waitForTimeout(150)
    }
    // Teclado: como mucho un contorno, y sobre la activa
    await open(page, '#c-field')
    await startRec(page, '#c-field')
    for (let i = 0; i < 8; i++) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(30) }
    await page.waitForTimeout(220)
    const xs = (await stopRec(page)).filter(Boolean)
    check(e, 'teclado: un contorno como mucho por cuadro', xs.every((x) => x.rings <= 1 && x.lit === 0), xs.find((x) => x.rings > 1 || x.lit))
    check(e, 'teclado: sobre la activa', (await page.evaluate(() => window.gap('#c-field'))) <= 1)
    await closeAll(page)
    note(e, 'barrido', res)
    await ctx.close()
  }

  if (on('anillo')) {
    const ctx = await ctxOf(), page = await ctx.newPage()
    await boot(page)
    for (const [s, l] of [['#c-field', 'field'], ['#c-pal', 'palette'], ['#c-multi', 'multiple']]) {
      const ring = () => page.evaluate((s) => { const a = window.panelOf(s).querySelector('.is-active'); return a ? getComputedStyle(a).outlineStyle : 'sin activa' }, s)
      await open(page, s)
      const rows = await rowsOf(page, s)
      await page.mouse.move(rows[1].x, rows[1].y, { steps: 4 }); await page.waitForTimeout(200)
      check(e, `${l}: con puntero, sin anillo`, (await ring()) === 'none')
      await page.keyboard.press('ArrowDown'); await page.waitForTimeout(200)
      check(e, `${l}: flecha, con anillo`, (await ring()) === 'solid')
      await page.mouse.move(rows[3].x, rows[3].y, { steps: 3 }); await page.waitForTimeout(200)
      check(e, `${l}: el puntero lo quita`, (await ring()) === 'none')
      await page.keyboard.press('ArrowUp'); await page.waitForTimeout(200)
      check(e, `${l}: otra flecha lo devuelve`, (await ring()) === 'solid')
      await page.keyboard.type('o'); await page.waitForTimeout(250)
      check(e, `${l}: escribir cuenta`, (await ring()) === 'solid')
      await closeAll(page); await page.mouse.move(2, 2); await page.waitForTimeout(150)
      await page.evaluate((s) => { document.querySelector(`${s} input[role="combobox"]`).blur() }, s)
      await open(page, s)
      const r2 = await rowsOf(page, s)
      await page.mouse.move(r2[1].x, r2[1].y, { steps: 4 }); await page.waitForTimeout(200)
      check(e, `${l}: reabrir con clic tras teclado, sin anillo`, (await ring()) === 'none')
      await closeAll(page); await page.mouse.move(2, 2); await page.waitForTimeout(150)
    }
    await ctx.close()
  }

  if (on('elegir')) {
    const ctx = await ctxOf(), page = await ctx.newPage()
    await boot(page)
    const r = {}
    const tok = (s) => `${s} .g-combobox__token`
    // field: puntero y teclado
    await open(page, '#c-field')
    let rows = await rowsOf(page, '#c-field')
    await page.mouse.move(rows[3].x, rows[3].y, { steps: 4 }); await page.waitForTimeout(200)
    r.fieldPuntero = await land(e, page, '#c-field', tok('#c-field'), () => page.mouse.down().then(() => page.mouse.up()), 'field con puntero')
    await page.evaluate(() => { window.cb.v['c-field'] = null }); await page.mouse.move(2, 2); await page.evaluate(() => document.activeElement.blur()); await page.waitForTimeout(200)
    await open(page, '#c-field')
    await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown'); await page.waitForTimeout(200)
    r.fieldTeclado = await land(e, page, '#c-field', tok('#c-field'), () => page.keyboard.press('Enter'), 'field con Intro')
    // field hacia arriba: entra por el otro lado
    await page.evaluate(() => { window.cb.v['c-field'] = null; document.activeElement.blur(); const c = document.querySelector('#c-field'); c.style.position = 'fixed'; c.style.insetBlockEnd = '24px'; c.style.insetInlineStart = '24px' })
    await page.waitForTimeout(200)
    await open(page, '#c-field')
    check(e, 'field abre hacia arriba', await page.evaluate(() => document.querySelector('#c-field .g-combobox').classList.contains('is-up')))
    rows = await rowsOf(page, '#c-field')
    await page.mouse.move(rows.at(-2).x, rows.at(-2).y, { steps: 4 }); await page.waitForTimeout(200)
    r.fieldArriba = await land(e, page, '#c-field', tok('#c-field'), () => page.mouse.down().then(() => page.mouse.up()), 'field hacia arriba', { down: false })
    // palette
    await open(page, '#c-pal')
    rows = await rowsOf(page, '#c-pal')
    await page.mouse.move(rows[2].x, rows[2].y, { steps: 4 }); await page.waitForTimeout(200)
    // palette y hoja: sin is-landing por contrato (combobox.md, «desde la lista de field»): la ficha ya está al fundirse la superficie
    await page.evaluate((s) => {
      const box = document.querySelector('#c-pal .g-input__control')
      window.__stop = window.frames(() => { const t = document.querySelector(s); return { land: Boolean(t && t.classList.contains('is-landing')), has: Boolean(t), h: box.getBoundingClientRect().height, tr: t ? getComputedStyle(t).translate : null, o: t ? +getComputedStyle(t).opacity : null } })
    }, tok('#c-pal'))
    await page.mouse.down(); await page.mouse.up()
    await page.waitForTimeout(420)
    const pal = await stopRec(page)
    check(e, 'palette: sin is-landing (contrato)', pal.every((x) => !x.land))
    check(e, 'palette: la ficha aparece en su sitio, sin moverse ni fundirse', pal.filter((x) => x.has).every((x) => (x.tr === 'none' || x.tr === '0px') && x.o === 1) && pal.at(-1).has, pal.at(-1))
    check(e, 'palette: la caja no cambia de alto', new Set(pal.map((x) => Math.round(x.h * 2))).size === 1)
    await page.mouse.move(2, 2)
    // multiple cesta: el renglón entra; lo que ya está no se mueve
    await open(page, '#c-cesta')
    rows = await rowsOf(page, '#c-cesta')
    const before = await page.evaluate(() => [...document.querySelectorAll('#c-cesta .g-combobox__basket .g-combobox__row')].map((x) => Math.round(x.getBoundingClientRect().y)))
    await page.mouse.move(rows[4].x, rows[4].y, { steps: 4 }); await page.waitForTimeout(200)
    r.cesta = await land(e, page, '#c-cesta', '#c-cesta .g-combobox__basket .g-combobox__row:last-child', () => page.mouse.down().then(() => page.mouse.up()), 'cesta')
    const after = await page.evaluate(() => [...document.querySelectorAll('#c-cesta .g-combobox__basket .g-combobox__row')].map((x) => Math.round(x.getBoundingClientRect().y)))
    check(e, 'cesta: los renglones anteriores no se mueven', before.every((v, i) => v === after[i]), { before, after })
    check(e, 'cesta: la lista sigue abierta', await page.evaluate(() => Boolean(document.querySelector('dialog[open].g-combobox-surface'))))
    await closeAll(page); await page.mouse.move(2, 2); await page.waitForTimeout(150)
    // multiple lista e inline: la lista sigue abierta; el campo no crece y la luz se queda en su fila
    for (const [s, l] of [['#c-list', 'multiple lista'], ['#c-multi', 'multiple frase']]) {
      await open(page, s)
      rows = await rowsOf(page, s)
      await page.mouse.move(rows[3].x, rows[3].y, { steps: 4 }); await page.waitForTimeout(200)
      await startRec(page, s)
      const h0 = await page.evaluate((s) => document.querySelector(`${s} .g-input__control`).getBoundingClientRect().height, s)
      await page.mouse.down(); await page.mouse.up()
      await page.waitForTimeout(350)
      const xs = (await stopRec(page)).filter(Boolean)
      check(e, `${l}: al elegir sin segunda marca`, xs.every((x) => x.lit === 0 && x.rings === 0 && x.act === 1 && x.lo === 1), xs.find((x) => x.lit || x.rings || x.act !== 1 || x.lo !== 1))
      check(e, `${l}: la luz sigue en la fila`, (await page.evaluate((s) => window.gap(s), s)) <= 1)
      check(e, `${l}: el campo no crece`, Math.abs(h0 - await page.evaluate((s) => document.querySelector(`${s} .g-input__control`).getBoundingClientRect().height, s)) < 0.6)
      await closeAll(page); await page.mouse.move(2, 2); await page.waitForTimeout(150)
    }
    note(e, 'elegir', r)
    await ctx.close()
  }

  if (on('salida')) {
    const ctx = await ctxOf(), page = await ctx.newPage()
    await boot(page)
    // H2: mientras se ve, la forma conserva su anillo y su contorno; al acabar queda el del campo. Nunca un cuadro sin anillo
    const res = {}
    for (const [key, how] of [['Escape', 'Esc'], ['Tab', 'Tab']]) {
      await open(page, '#c-field')
      await page.keyboard.press('ArrowDown'); await page.waitForTimeout(220)
      await page.evaluate(() => {
        const p = document.getElementById(document.querySelector('#c-field input[role="combobox"]').getAttribute('aria-controls')?.replace(/-list$/, '-popup')) || document.querySelector('#c-field .g-combobox__popup')
        const row = document.querySelector('#c-field .g-input__row')
        const hl = p.querySelector('.g-combobox__highlight')
        window.__stop = window.frames(() => { const c = getComputedStyle(p), r = getComputedStyle(row), a = p.querySelector('.g-combobox__option.is-active'); return { o: +c.opacity, d: c.display, ring: c.outlineStyle, field: r.outlineStyle, fw: r.outlineColor, inert: p.hasAttribute('inert'), lo: hl ? +getComputedStyle(hl).opacity : null, hr: hl ? getComputedStyle(hl).outlineStyle : null, rows: p.querySelectorAll('.g-combobox__option').length } })
      })
      await page.keyboard.press(key)
      await page.waitForTimeout(320)
      const xs = await stopRec(page)
      const fading = xs.filter((x) => x.d !== 'none' && x.o < 1 && x.o > 0.001)
      if (engine === 'chromium') {
        check(e, `${how}: hay fundido`, fading.length >= 5, fading.length)
        check(e, `${how}: la forma conserva el anillo mientras se ve`, fading.every((x) => x.ring === 'solid'), fading.map((x) => x.ring))
        check(e, `${how}: sigue llena`, new Set(fading.map((x) => x.rows)).size === 1, fading.map((x) => x.rows))
        check(e, `${how}: la luz no se apaga en la salida`, fading.every((x) => x.lo === 1), fading.map((x) => x.lo))
        const ops = fading.map((x) => x.o)
        check(e, `${how}: linear, sin saltos grandes`, ops.every((v, i) => !i || ops[i - 1] - v < 0.3), ops)
        check(e, `${how}: el contorno de la activa se funde con la luz`, fading.every((x) => x.hr === 'solid'), fading.map((x) => x.hr))
        res[how] = { cuadros: fading.length, opacidad: ops.map((v) => +v.toFixed(2)) }
      } else {
        check(e, `${how}: en el acto (D2 · A)`, fading.length === 0, fading.length)
      }
      if (key === 'Escape') {
        const fin = xs.at(-1)
        check(e, `${how}: el campo recupera su anillo`, fin.field === 'solid', fin)
        check(e, `${how}: sin cuadro sin anillo`, xs.every((x) => x.field === 'solid' || (x.ring === 'solid' && x.d !== 'none')), xs.find((x) => x.field !== 'solid' && (x.ring !== 'solid' || x.d === 'none')))
      }
      check(e, `${how}: inert no queda colgado`, !xs.at(-1).inert)
      await page.evaluate(() => document.activeElement.blur()); await page.waitForTimeout(150)
    }
    note(e, 'salida', res)
    await ctx.close()
  }

  if (on('reducido')) {
    const ctx = await ctxOf({ reducedMotion: 'reduce' }), page = await ctx.newPage()
    await boot(page)
    await open(page, '#c-field')
    const rows = await rowsOf(page, '#c-field')
    await page.mouse.move(rows[0].x, rows[0].y, { steps: 4 }); await page.waitForTimeout(200)
    await startRec(page, '#c-field')
    for (const r of rows.slice(1, 6)) { await page.mouse.move(r.x, r.y, { steps: 4 }); await page.waitForTimeout(70) }
    await page.waitForTimeout(200)
    const xs = (await stopRec(page)).filter(Boolean)
    const moves = new Set(xs.map((x) => x.at)).size
    check(e, 'reducido: la luz no viaja (una posición por fila)', moves <= 6, moves)
    check(e, 'reducido: una marca', xs.every((x) => x.lit === 0 && x.rings === 0 && x.act === 1), xs.find((x) => x.lit || x.rings))
    check(e, 'reducido: transición solo de opacidad', (await page.evaluate(() => getComputedStyle(document.querySelector('#c-field .g-combobox__highlight')).transitionProperty)) === 'opacity')
    const r5 = rows[4]
    await page.mouse.move(r5.x, r5.y, { steps: 4 }); await page.waitForTimeout(150)
    const lr = await land(e, page, '#c-field', '#c-field .g-combobox__token', () => page.mouse.down().then(() => page.mouse.up()), 'reducido, field', { reduced: true })
    await page.mouse.move(2, 2)
    await open(page, '#c-cesta')
    const rc = await rowsOf(page, '#c-cesta')
    await page.mouse.move(rc[4].x, rc[4].y, { steps: 4 }); await page.waitForTimeout(200)
    const lc = await land(e, page, '#c-cesta', '#c-cesta .g-combobox__basket .g-combobox__row:last-child', () => page.mouse.down().then(() => page.mouse.up()), 'reducido, cesta', { reduced: true })
    await closeAll(page)
    note(e, 'reducido', { moves, lr, lc })
    await ctx.close()
  }

  if (on('forzado')) {
    const ctx = await ctxOf({ forcedColors: 'active' }), page = await ctx.newPage()
    await boot(page)
    for (const [s, l] of [['#c-field', 'field'], ['#c-pal', 'palette'], ['#c-multi', 'multiple']]) {
      await open(page, s)
      const rows = await rowsOf(page, s)
      await page.mouse.move(rows[2].x, rows[2].y, { steps: 4 }); await page.waitForTimeout(220)
      const f = await page.evaluate((s) => { const P = window.panelOf(s), y = P.querySelector('.g-combobox__highlight'), a = P.querySelector('.is-active'); return { capa: y ? getComputedStyle(y).display : 'no', ring: a ? getComputedStyle(a).outlineStyle : 'sin activa', act: P.querySelectorAll('.is-active').length } }, s)
      check(e, `${l}: forced-colors sin capa`, f.capa === 'none' || f.capa === 'no', f)
      check(e, `${l}: forced-colors contorno con puntero`, f.ring === 'solid' && f.act === 1, f)
      await closeAll(page); await page.mouse.move(2, 2); await page.waitForTimeout(150)
    }
    await ctx.close()
  }

  if (on('hoja')) {
    const mobile = engine === 'firefox' ? {} : { hasTouch: true, isMobile: true }
    const ctx = await browser.newContext({ viewport: { width: 375, height: 760 }, ...mobile }), page = await ctx.newPage()
    await boot(page)
    const act = (s) => (engine === 'firefox' ? page.click(input(s)) : page.tap(input(s)))
    for (const [s, l] of [['#c-field', 'hoja field'], ['#c-cesta', 'hoja cesta'], ['#c-list', 'hoja lista']]) {
      await page.locator(input(s)).scrollIntoViewIfNeeded()
      await act(s); await page.waitForTimeout(520)
      const sheet = await page.evaluate(() => Boolean(document.querySelector('dialog[open].g-combobox-surface--sheet')))
      check(e, `${l}: abre en hoja`, sheet)
      const rows = await rowsOf(page, s)
      check(e, `${l}: filas ≥ 44 px`, rows.every((r) => r.h >= 44), rows.map((r) => r.h))
      const o = rows[2]
      if (engine === 'firefox') await page.mouse.click(o.x, o.y); else await page.touchscreen.tap(o.x, o.y)
      await page.waitForTimeout(460)
      const st = await page.evaluate((s) => { const p = window.panelOf(s); return { open: Boolean(document.querySelector('dialog[open].g-combobox-surface')), rings: p ? p.querySelectorAll('.is-active').length : 0, ring: p?.querySelector('.is-active') ? getComputedStyle(p.querySelector('.is-active')).outlineStyle : 'none' } }, s)
      check(e, `${l}: el toque no pinta contorno`, st.ring === 'none', st)
      if (st.open) await page.keyboard.press('Escape')
      await page.waitForTimeout(320)
      check(e, `${l}: se cierra`, await page.evaluate(() => !document.querySelector('dialog[open].g-combobox-surface')))
      check(e, `${l}: sin desborde`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    }
    // En la hoja no hay entrada: la superficie se funde y la ficha ya está
    await page.evaluate(() => { window.cb.v['c-field'] = null; document.activeElement.blur() })
    await page.waitForTimeout(150)
    await act('#c-field'); await page.waitForTimeout(520)
    const rows = await rowsOf(page, '#c-field')
    await (engine === 'firefox' ? page.mouse.click(rows[1].x, rows[1].y) : page.touchscreen.tap(rows[1].x, rows[1].y))
    await page.waitForTimeout(460)
    const tk = await page.evaluate(() => { const t = document.querySelector('#c-field .g-combobox__token'); return t ? { land: t.classList.contains('is-landing'), o: +getComputedStyle(t).opacity } : null })
    check(e, 'hoja field: ficha en su sitio, sin is-landing (contrato)', tk && !tk.land && tk.o === 1, tk)
    await ctx.close()
  }

  if (on('dialogo')) {
    const ctx = await ctxOf(), page = await ctx.newPage()
    await boot(page)
    await page.locator('#d-open').scrollIntoViewIfNeeded()
    await page.click('#d-open'); await page.waitForTimeout(350)
    await page.click(input('#c-dlg')); await page.waitForTimeout(420)
    const top = await page.evaluate(() => { const o = document.querySelector('#c-dlg .g-combobox__option'), r = o.getBoundingClientRect(), hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return Boolean(hit && hit.closest('.g-combobox__option')) })
    check(e, 'GDialog: la lista queda encima', top)
    const res = await sweep(e, page, '#c-dlg', 'GDialog')
    await page.keyboard.press('Escape'); await page.waitForTimeout(280)
    check(e, 'GDialog: Esc cierra la lista, no el diálogo', await page.evaluate(() => document.querySelector('#d-x').open))
    await page.click(input('#c-dlg')); await page.waitForTimeout(420)
    const rows = await rowsOf(page, '#c-dlg')
    await page.mouse.move(rows[2].x, rows[2].y, { steps: 4 }); await page.waitForTimeout(200)
    const lr = await land(e, page, '#c-dlg', '#c-dlg .g-combobox__token', () => page.mouse.down().then(() => page.mouse.up()), 'GDialog: ficha')
    check(e, 'GDialog: sigue abierto al elegir', await page.evaluate(() => document.querySelector('#d-x').open))
    note(e, 'dialogo', { res, lr })
    await ctx.close()
  }

  if (on('compacta')) {
    const ctx = await ctxOf(), page = await ctx.newPage()
    await boot(page)
    await open(page, '#c-compact')
    const d = await page.evaluate(() => { const a = (s) => [...window.panelOf(s).querySelectorAll('.g-combobox__option')].slice(0, 4).map((o) => o.getBoundingClientRect().height); return { c: a('#c-compact'), box: document.querySelector('#c-compact .g-input__control').getBoundingClientRect().height } })
    await closeAll(page)
    await open(page, '#c-field')
    const n = await page.evaluate(() => ({ c: [...window.panelOf('#c-field').querySelectorAll('.g-combobox__option')].slice(0, 4).map((o) => o.getBoundingClientRect().height), box: document.querySelector('#c-field .g-input__control').getBoundingClientRect().height }))
    await closeAll(page)
    check(e, 'compacta: filas más bajas', d.c[0] < n.c[0], { d, n })
    check(e, 'compacta: caja más baja', d.box < n.box, { d, n })
    check(e, 'compacta: alto ≥ 24 px', d.c.every((h) => h >= 24) && d.box >= 24, d)
    await open(page, '#c-compact')
    const rows = await rowsOf(page, '#c-compact')
    for (const r of rows.slice(0, 4)) { await page.mouse.move(r.x, r.y, { steps: 2 }); await page.waitForTimeout(190); check(e, 'compacta: la luz cubre la fila', (await page.evaluate(() => window.gap('#c-compact'))) <= 1) }
    const lr = await land(e, page, '#c-compact', '#c-compact .g-combobox__token', () => page.mouse.down().then(() => page.mouse.up()), 'compacta: ficha')
    note(e, 'compacta', { d, n, lr })
    await ctx.close()
  }
  await browser.close()
  console.log(`${engine}: ${tally[e]?.ok ?? 0} ok, ${tally[e]?.ko ?? 0} fallan`)
}
writeFileSync(new URL('./auditoria-combobox-resultados.json', import.meta.url), JSON.stringify({ tally, out }, null, 1) + '\n')
process.exit(Object.values(tally).some((t) => t.ko) ? 1 : 0)
