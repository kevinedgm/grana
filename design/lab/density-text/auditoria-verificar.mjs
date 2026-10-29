// Auditoría posterior de coco · el texto sigue la densidad (pieza 3, density.md §16, DECISIONS.md #986 a #995).
// Mide los COMPONENTES REALES de un dist/ (CSS de coco + .vue de bruno) en el banco design/lab/density-text/banco.html y
// en el playground. Criterios de §16.6 que tocan a coco: 1 (tabla por rol), 2 (piso de 12), 3 (cajas Δ0), 4 (anidación y
// prop), 5 (menú y diálogo heredados), 6 (<html> y clave sin tema), 9 (P2 táctil), 10 (superficies fijadas), 11 (ritmo),
// 12 (prosa, GText, GMetric), 13 (icono de GBtn), 14 (Δ0 sin regiones), 15 (sin CSSTransition de texto), 18 (grep).
// Los criterios de CLI (6 con tema, 7, 8, 16, 17) y los temas generados son de bruno.
// Uso (raíz del repo):
//   python3 -m http.server 4209 -d . &
//   DIST=<dist con la pieza> BASE=<dist de 5ad561d> node design/lab/density-text/auditoria-verificar.mjs [--verbose]
//   (sin DIST usa packages/vue/dist; sin BASE se omiten los Δ0 contra el dist anterior y se dice)
// Solo Chromium (único motor instalado en /opt/pw-browsers). Vue se sirve desde node_modules (unpkg bloqueado).
// No demuestra: Firefox y WebKit, Safari real de iPhone, lector de pantalla, la impresión de lectura del 6,25 % en
// pantallas reales, los temas generados por el CLI (bruno) ni los medidores de GSummary/GBreadcrumbs en ≤ 2 cuadros.
import { chromium } from 'playwright'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const ORIGIN = process.env.ORIGIN || 'http://localhost:4209'
const BANCO = ORIGIN + '/design/lab/density-text/banco.html'
const PLAY = ORIGIN + '/packages/vue/playground/index.html'
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const VUE = readFileSync(ROOT + 'node_modules/vue/dist/vue.global.js', 'utf8')
const DIST = process.env.DIST
const BASE = process.env.BASE
const verbose = process.argv.includes('--verbose')

const r = { pass: 0, fail: 0, fails: [], by: {} }
let cur = '0'
const crit = (n) => { cur = n; r.by[n] ||= { pass: 0, fail: 0 } }
const ok = (cond, label, info) => {
  r.by[cur][cond ? 'pass' : 'fail']++
  if (cond) r.pass++
  else { r.fail++; r.fails.push(`[${cur}] ${label}` + (info !== undefined ? ' ' + JSON.stringify(info).slice(0, 400) : '')) }
  if (verbose) console.log((cond ? '  ok ' : '  NO ') + `[${cur}] ${label}` + (info !== undefined && !cond ? ' ' + JSON.stringify(info).slice(0, 300) : ''))
}
const near = (a, b, t = 0.02) => a != null && b != null && Math.abs(a - b) <= t

const browser = await chromium.launch()

async function routeDist (p, dist) {
  await p.route('**/packages/vue/dist/**', (rt) => {
    const rel = new URL(rt.request().url()).pathname.split('/packages/vue/dist/')[1]
    const f = dist + '/' + rel
    if (!existsSync(f)) return rt.fulfill({ status: 404, body: '' })
    rt.fulfill({ body: readFileSync(f), contentType: f.endsWith('.css') ? 'text/css' : f.endsWith('.woff2') ? 'font/woff2' : 'text/javascript' })
  })
}
async function open (url, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, ...(opts.ctx || {}) })
  if (opts.init) await ctx.addInitScript(opts.init)
  const p = await ctx.newPage()
  const errs = []
  p.on('pageerror', (e) => errs.push(String(e)))
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)) })
  await p.route('**/unpkg.com/**', (rt) => rt.fulfill({ body: VUE, contentType: 'text/javascript' }))
  const dist = opts.dist === undefined ? DIST : opts.dist
  if (dist) await routeDist(p, dist)
  await p.goto(url)
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(opts.wait ?? 700)
  return { p, ctx, errs }
}

// [tamaño, interlineado] calculados del primer elemento que casa
const FS = (p, sel) => p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const c = getComputedStyle(e); return [parseFloat(c.fontSize), parseFloat(c.lineHeight)] }, sel)
const BOX = (p, sel) => p.evaluate((s) => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().height * 100) / 100 : null }, sel)

// Escala esperada (tokens.md §5.1) con el tema por defecto
const ROLES = ['caption', 'body-sm', 'body', 'title-sm', 'title', 'title-lg', 'display']
const STEP1 = { caption: [12, 16], 'body-sm': [14, 20], body: [16, 24], 'title-sm': [20, 28], title: [25, 36], 'title-lg': [31.25, 40], display: [39.0624, 48] }
// Calculada con la función de §16.1, no copiada: min(paso1, max(12, paso1 × 15/16)) y min(línea, max(4, round(tamaño × razón / 4) × 4))
const compactOf = (role) => {
  const [s1, l1] = STEP1[role]
  const size = Math.min(s1, Math.max(12, s1 * 15 / 16))
  const razon = l1 / s1
  const line = Math.min(l1, Math.max(4, Math.round(size * razon / 4) * 4))
  return [size, line]
}
const sizeOk = (got, want, tol = 0.02) => got && near(got[0], want[0], tol) && near(got[1], want[1], 0.01)

// ---------------------------------------------------------------------------------------------------------------------
// 0 · el banco carga y la escala de la función coincide con la tabla de tokens.md §5.1
crit('0')
{
  const tabla = { caption: [12, 16], 'body-sm': [13.125, 20], body: [15, 24], 'title-sm': [18.75, 28], title: [23.4375, 32], 'title-lg': [29.297, 36], display: [36.621, 44] }
  for (const k of ROLES) ok(sizeOk(compactOf(k), tabla[k], 0.01), `0.1 la función de §16.1 da la fila de §5.1 para ${k}`, [compactOf(k), tabla[k]])
}

// ---------------------------------------------------------------------------------------------------------------------
// 1 · tabla por rol en los tres pasos
crit('1')
{
  const { p, ctx, errs } = await open(BANCO)
  ok(errs.length === 0, '1.0 el banco carga sin errores de consola', errs)
  for (const [kit, name, esperado] of [['page', 'página', (k) => STEP1[k]], ['rf', 'región comfortable', (k) => STEP1[k]], ['rc', 'región compact', compactOf]]) {
    for (const k of ROLES) {
      const got = await FS(p, `#r-${kit} [data-roles="${kit}"] .dt-role[data-role="${k}"]`)
      ok(sizeOk(got, esperado(k)), `1.1 ${name} · ${k} = ${esperado(k).join('/')}`, got)
    }
  }
  // Valor fuera de contrato: sin regla, hereda la página
  for (const k of ROLES) ok(sizeOk(await FS(p, `#r-bad .dt-role[data-role="${k}"]`), STEP1[k]), `1.2 valor fuera de contrato · ${k} = paso 1`)
  // Tracking y peso sin cambio en los títulos
  const tw = await p.evaluate(() => {
    const g = (s) => { const c = getComputedStyle(document.querySelector(s)); return [c.letterSpacing, c.fontWeight] }
    return { c: g('#r-rc .dt-role[data-role="title"]'), d: g('#r-page .dt-role[data-role="title"]') }
  })
  ok(tw.c[1] === tw.d[1], '1.3 el peso del título compacto no cambia', tw)
  await ctx.close()
}

// ---------------------------------------------------------------------------------------------------------------------
// 2 · piso de 12px y 3 · cajas Δ0 (frente al dist anterior) con el texto centrado y sin desbordar
crit('2')
const CAJAS = (id) => ({
  btn: ['xs', 'sm', 'md', 'lg', 'xl'].map((s) => `[data-btns="${id}"] .g-btn[data-size="${s}"]`),
  campos: [`[data-fields="${id}"] .g-input__control`, `[data-fields="${id}"] .g-select__control`, `[data-fields="${id}"] .g-textarea__control`],
  fila: `[data-kit="${id}"] .g-table tbody tr`
})
const HEIGHTS = (p, ids) => p.evaluate((ids) => {
  const out = {}
  const h = (s) => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().height * 100) / 100 : null }
  for (const id of ids) {
    out[id] = ['xs', 'sm', 'md', 'lg', 'xl'].map((s) => h(`[data-btns="${id}"] .g-btn[data-size="${s}"]`))
      .concat([h(`[data-fields="${id}"] .g-input__control`), h(`[data-fields="${id}"] .g-select__control`), h(`[data-fields="${id}"] .g-textarea__control`), h(`[data-kit="${id}"] .g-table tbody tr`)])
  }
  return out
}, ids)
{
  const { p, ctx } = await open(BANCO)
  const small = await p.evaluate(() => {
    const out = []
    const w = document.createTreeWalker(document.querySelector('.dt-page'), NodeFilter.SHOW_TEXT)
    while (w.nextNode()) {
      const n = w.currentNode
      if (!n.textContent.trim()) continue
      const el = n.parentElement
      if (el.closest('svg, script, style')) continue
      const c = getComputedStyle(el)
      if (c.display === 'none' || c.visibility === 'hidden' || parseFloat(c.fontSize) === 0) continue
      const fs = parseFloat(c.fontSize)
      if (fs < 12 - 0.001) out.push([el.className.toString().slice(0, 40), fs])
    }
    return out
  })
  ok(small.length === 0, '2.1 ningún texto del banco mide menos de 12 px (los siete roles en página, comfortable, compact, prop)', small.slice(0, 5))
  // Con los demás pasos también: <html> en cada paso
  for (const paso of ['default', 'comfortable', 'compact']) {
    const o = await open(BANCO + '?html=' + paso)
    const bajos = await o.p.evaluate(() => [...document.querySelectorAll('.dt-page *')].filter((e) => !e.closest('svg') && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 12 - 0.001).map((e) => [e.className.toString().slice(0, 30), getComputedStyle(e).fontSize]))
    ok(bajos.length === 0, `2.2 <html ${paso}>: ningún texto < 12 px`, bajos.slice(0, 5))
    await o.ctx.close()
  }
  await ctx.close()
}
crit('3')
{
  const IDS = ['page', 'rf', 'rc', 'pc', 'pd', 'n1', 'n2', 'n3', 'n4']
  const { p, ctx } = await open(BANCO)
  const nuevo = await HEIGHTS(p, IDS)
  ok(near(nuevo.rc[2], 27, 0.01) && near(nuevo.rf[2], 31.5, 0.01) && near(nuevo.page[2], 36, 0.01), '3.1 GBtn md 36 / 31,5 / 27 en página / comfortable / compact', [nuevo.page[2], nuevo.rf[2], nuevo.rc[2]])
  ok(nuevo.rc[7] != null && nuevo.rc.every((v) => v != null) && near(nuevo.rc[5], nuevo.pc[5], 0.01) && near(nuevo.rc[7], nuevo.pc[7], 0.01), '3.2 región compact = prop compact en cajas de campo y fila de tabla', [nuevo.rc, nuevo.pc])
  if (BASE) {
    const a = await open(BANCO, { dist: BASE })
    const antes = await HEIGHTS(a.p, IDS)
    for (const id of IDS) ok(JSON.stringify(antes[id]) === JSON.stringify(nuevo[id]), `3.3 cajas Δ0 frente al dist anterior · ${id} (btn xs a xl, input, select, textarea, fila)`, { antes: antes[id], nuevo: nuevo[id] })
    await a.ctx.close()
  } else console.log('  (3.3 omitido: sin BASE)')
  // Texto centrado (≤ 1 px) y sin desbordar, en cada paso y prop
  const centrado = await p.evaluate(() => {
    const out = []
    for (const id of ['page', 'rf', 'rc', 'pc', 'pd']) {
      for (const b of document.querySelectorAll(`[data-btns="${id}"] .g-btn`)) {
        const bb = b.getBoundingClientRect(); const lb = b.querySelector('.g-btn__label').getBoundingClientRect()
        const c = Math.abs((bb.top + bb.height / 2) - (lb.top + lb.height / 2))
        out.push(['btn-' + id + '-' + b.dataset.size, c, b.scrollHeight - b.clientHeight])
      }
      for (const [s, nom] of [['.g-input__control', 'input'], ['.g-select__control', 'select'], ['.g-textarea__control', 'textarea']]) {
        const c = document.querySelector(`[data-fields="${id}"] ${s}`)
        const f = c.querySelector('input, textarea, .g-select__button, button, [role="combobox"]') || c
        const cb = c.getBoundingClientRect(); const fb = f.getBoundingClientRect()
        out.push([nom + '-' + id, Math.abs((cb.top + cb.height / 2) - (fb.top + fb.height / 2)), c.scrollHeight - c.clientHeight])
      }
    }
    return out
  })
  ok(centrado.every(([, c]) => c <= 1), '3.4 texto centrado en la caja (≤ 1 px) en botones y campos de todos los pasos', centrado.filter(([, c]) => c > 1).slice(0, 5))
  ok(centrado.every(([, , o]) => o <= 1), '3.5 sin desbordar (scrollHeight − clientHeight ≤ 1, el redondeo de la rejilla de medio píxel; también lo da el xs de la página, sin regiones) en botones y campos', centrado.filter(([, , o]) => o > 0).slice(0, 5))
  await ctx.close()
}

// ---------------------------------------------------------------------------------------------------------------------
// 4 · anidación y prop
crit('4')
{
  const { p, ctx } = await open(BANCO)
  const bs = (kit) => FS(p, `#r-${kit} [data-roles="${kit}"] .dt-role[data-role="body-sm"]`)
  ok(sizeOk(await bs('n1'), STEP1['body-sm']), '4.1 default dentro de compact → body-sm 14', await bs('n1'))
  ok(sizeOk(await bs('n2'), compactOf('body-sm')), '4.2 compact dentro de comfortable → body-sm 13,13', await bs('n2'))
  ok(sizeOk(await bs('n3'), compactOf('body-sm')), '4.3 compact › comfortable › compact → 13,13', await bs('n3'))
  ok(sizeOk(await bs('n4'), STEP1['body-sm']), '4.4 compact › comfortable › compact › default → 14', await bs('n4'))
  const btn = async (kit) => ({ fs: await FS(p, `[data-btns="${kit}"] .g-btn[data-size="md"]`), h: await BOX(p, `[data-btns="${kit}"] .g-btn[data-size="md"]`) })
  const pd = await btn('pd'); const pc = await btn('pc'); const rc = await btn('rc'); const pg = await btn('page')
  ok(near(pd.fs[0], 14) && near(pd.h, 36), '4.5 GBtn density="default" en región compact → 14 y 36', pd)
  ok(near(pc.fs[0], compactOf('body-sm')[0]) && near(pc.h, 27), '4.6 GBtn density="compact" en la página → 13,13 y 27', pc)
  ok(near(rc.fs[0], pc.fs[0]) && near(rc.h, pc.h), '4.7 la región compact y la prop compact dan el mismo botón', [rc, pc])
  ok(near(pg.fs[0], 14) && near(pg.h, 36), '4.8 página → 14 y 36', pg)
  // GBtn de la prop compact dentro de una región default (la prop gana)
  const gana = await p.evaluate(() => { const b = document.querySelector('[data-btns="pc"] .g-btn[data-size="md"]'); return [b.getAttribute('data-g-density'), /--density-compact/.test(b.className)] })
  ok(gana[0] === 'compact' && gana[1], '4.9 la prop se emite como atributo y clase (la prop es la región del componente)', gana)
  await ctx.close()
}

// ---------------------------------------------------------------------------------------------------------------------
// 5 · menú y diálogo heredados
crit('5')
{
  const { p, ctx } = await open(BANCO)
  await p.click('[data-probe="menu-open"]'); await p.waitForTimeout(400)
  const m = await p.evaluate(() => {
    const t = document.querySelector('[data-probe="menu-trigger"]'); const i = document.querySelector('.g-menu__list .g-menu__item')
    return { t: parseFloat(getComputedStyle(t).fontSize), i: i ? parseFloat(getComputedStyle(i).fontSize) : null, ih: i ? i.getBoundingClientRect().height : null }
  })
  ok(m.i != null && near(m.t, m.i) && near(m.i, compactOf('body-sm')[0]), '5.1 GMenu abierto desde una región compact: item = disparador = 13,13', m)
  await p.keyboard.press('Escape'); await p.waitForTimeout(200)
  const cadena = async (probe) => {
    await p.click(`[data-probe="${probe}"]`); await p.waitForTimeout(500)
    const v = await p.evaluate((pr) => {
      const d = document.querySelector(`[data-probe="${pr === 'dl-open-inherit' ? 'dl-inherit' : 'dl-default'}"]`)
      const dlg = d.closest('dialog') || d
      const f = (s) => { const e = dlg.querySelector(s); return e ? parseFloat(getComputedStyle(e).fontSize) : null }
      return [f('.g-dialog__title'), f('[data-p="dl-body"]'), f('.g-dialog__description'), f('[data-p="dl-cap"]')]
    }, probe)
    await p.keyboard.press('Escape'); await p.waitForTimeout(350)
    return v
  }
  const c1 = await cadena('dl-open-inherit')
  const e1 = [compactOf('title-sm')[0], compactOf('body')[0], compactOf('body-sm')[0], 12]
  ok(c1.every((v, i) => v != null && near(v, e1[i], 0.02)), '5.2 GDialog sin prop en región compact: 18,75 › 15 › 13,13 › 12', c1)
  ok(c1[0] > c1[1] && c1[1] > c1[2] && c1[2] > c1[3], '5.3 cuatro niveles distintos y decrecientes', c1)
  const c2 = await cadena('dl-open-default')
  ok(c2.every((v, i) => v != null && near(v, [20, 16, 14, 12][i], 0.02)), '5.4 GDialog density="default" en región compact: 20 › 16 › 14 › 12', c2)
  await ctx.close()
}

// ---------------------------------------------------------------------------------------------------------------------
// 6 · <html> y la clave del CLI sin tema (tema por defecto)
crit('6')
{
  for (const [q, nom, esperado] of [['?html=compact', '<html compact>', compactOf], ['?html=comfortable', '<html comfortable>', (k) => STEP1[k]], ['?html=default', '<html default>', (k) => STEP1[k]], ['?cli=compact', 'clave compact', compactOf]]) {
    const { p, ctx } = await open(BANCO + q)
    for (const k of ROLES) ok(sizeOk(await FS(p, `#r-page [data-roles="page"] .dt-role[data-role="${k}"]`), esperado(k)), `6.1 ${nom} · página · ${k}`, await FS(p, `#r-page .dt-role[data-role="${k}"]`))
    await ctx.close()
  }
  {
    const { p, ctx } = await open(BANCO + '?html=compact')
    // Una región comfortable o default dentro de <html compact> vuelve al paso 1
    ok(sizeOk(await FS(p, '#r-rf .dt-role[data-role="body"]'), STEP1.body), '6.2 región comfortable dentro de <html compact> → paso 1')
    ok(sizeOk(await FS(p, '#r-rc .dt-role[data-role="body"]'), compactOf('body')), '6.3 región compact dentro de <html compact> → compacto')
    ok(sizeOk(await FS(p, '[data-btns="pd"] .g-btn[data-size="md"]'), [14, 20].map((v, i) => i ? parseFloat(v) : v)) || near((await FS(p, '[data-btns="pd"] .g-btn[data-size="md"]'))[0], 14), '6.4 GBtn density="default" dentro de <html compact> → 14')
    await ctx.close()
  }
  {
    // La clave compact con un <html data-g-density="default"> encima: manda el atributo (paso 1)
    const { p, ctx } = await open(BANCO + '?cli=compact&html=default')
    for (const k of ROLES) ok(sizeOk(await FS(p, `#r-page .dt-role[data-role="${k}"]`), STEP1[k]), `6.5 <html default> sobre la clave compact → paso 1 · ${k}`)
    ok(sizeOk(await FS(p, '#r-rf .dt-role[data-role="body"]'), STEP1.body), '6.6 región comfortable dentro de la clave compact → paso 1')
    await ctx.close()
  }
  {
    // Orden: un segundo tema cargado después gana por orden (H5): un :root sin capa que escribe un token de texto solo vale fuera de las regiones
    const { p, ctx } = await open(BANCO, { init: () => { document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = ':root{--g-text-body-size:1.125rem}'; document.head.appendChild(s) }) } })
    const fuera = await FS(p, '#r-page .dt-role[data-role="body"]'); const dentro = await FS(p, '#r-rc .dt-role[data-role="body"]')
    ok(near(fuera[0], 18) && sizeOk(dentro, compactOf('body')), '6.7 H5: un --g-text-body-size a mano en :root vale fuera de la región y la región compacta lo reasigna', [fuera, dentro])
    await ctx.close()
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// 9 · P2 táctil
crit('9')
{
  const { p, ctx } = await open(BANCO, { ctx: { hasTouch: true, isMobile: true, viewport: { width: 1000, height: 1400 } } })
  ok(await p.evaluate(() => matchMedia('(pointer: coarse)').matches), '9.0 precondición: (pointer: coarse)')
  for (const k of ROLES) ok(sizeOk(await FS(p, `#r-rc .dt-role[data-role="${k}"]`), STEP1[k]), `9.1 región compact con puntero grueso · ${k} → paso 1`, await FS(p, `#r-rc .dt-role[data-role="${k}"]`))
  const pc = await FS(p, '[data-btns="pc"] .g-btn[data-size="md"]')
  ok(near(pc[0], compactOf('body-sm')[0]), '9.2 GBtn density="compact" con puntero grueso → 13,13 (la prop explícita no cede)', pc)
  const inp = await p.evaluate(() => {
    const f = document.querySelector('[data-fields="pc"] .g-input__field'); const c = document.querySelector('[data-fields="pc"] .g-input__control')
    return [parseFloat(getComputedStyle(f).fontSize), c.getBoundingClientRect().height]
  })
  ok(inp[0] >= 16 && inp[1] >= 44, '9.3 GInput density="compact" con puntero grueso: texto editable ≥ 16 y caja ≥ 44 (pieza 1 intacta)', inp)
  const inr = await p.evaluate(() => {
    const f = document.querySelector('[data-fields="rc"] .g-input__field'); const c = document.querySelector('[data-fields="rc"] .g-input__control')
    return [parseFloat(getComputedStyle(f).fontSize), c.getBoundingClientRect().height]
  })
  ok(inr[0] >= 16 && inr[1] >= 44, '9.4 GInput en región compact con puntero grueso: texto editable ≥ 16 y caja ≥ 44', inr)
  await ctx.close()
  const h = await open(BANCO + '?html=compact', { ctx: { hasTouch: true, isMobile: true, viewport: { width: 1000, height: 1400 } } })
  for (const k of ROLES) ok(sizeOk(await FS(h.p, `#r-page .dt-role[data-role="${k}"]`), STEP1[k]), `9.5 <html compact> con puntero grueso · ${k} → paso 1`)
  await h.ctx.close()
  const c = await open(BANCO + '?cli=compact', { ctx: { hasTouch: true, isMobile: true, viewport: { width: 1000, height: 1400 } } })
  for (const k of ROLES) ok(sizeOk(await FS(c.p, `#r-page .dt-role[data-role="${k}"]`), STEP1[k]), `9.6 clave compact con puntero grueso · ${k} → paso 1`)
  await c.ctx.close()
}

// ---------------------------------------------------------------------------------------------------------------------
// 10 · superficies fijadas Δ0 (toast con <html compact>, clave compact y trasladado a un diálogo compact)
crit('10')
{
  const medir = async (q, dist, enDialogo) => {
    const o = await open(BANCO + q, { dist })
    if (enDialogo) { await o.p.click('[data-probe="dl-open-inherit"]'); await o.p.waitForTimeout(500) }
    await o.p.evaluate(() => { window.dtToaster.success('Hecho', { description: 'Se guardó el lote L-2041', action: { label: 'Deshacer', onClick: () => {} } }) })
    await o.p.waitForTimeout(900)
    const v = await o.p.evaluate(() => {
      const t = document.querySelector('.g-toaster')
      if (!t) return null
      return [...t.querySelectorAll('*')].filter((e) => !e.closest('svg')).map((e) => { const c = getComputedStyle(e); const b = e.getBoundingClientRect(); return [e.className.toString().slice(0, 24), c.fontSize, c.lineHeight, Math.round(b.width * 10) / 10, Math.round(b.height * 10) / 10].join('|') })
    })
    await o.ctx.close(); return v
  }
  const casos = [['?html=compact', false, '<html compact>'], ['?cli=compact', false, 'clave compact'], ['', true, 'trasladado a un GDialog compact']]
  for (const [q, d, nom] of casos) {
    const nuevo = await medir(q, DIST, d)
    ok(nuevo && nuevo.length > 3, `10.0 ${nom}: el aviso se pinta`, nuevo && nuevo.length)
    const def = await medir('', DIST, false)
    ok(JSON.stringify(nuevo) === JSON.stringify(def), `10.1 ${nom}: texto y cajas del aviso = los de la página en paso 1`, nuevo && def && nuevo.filter((x, i) => x !== def[i]).slice(0, 3))
    // La clave del CLI emula la regla NUEVA (con texto): contra el dist anterior, que no tiene reglas de región, el aviso heredaría ese texto; no es comparable
    if (BASE && !q.startsWith('?cli')) { const antes = await medir(q, BASE, d); ok(JSON.stringify(antes) === JSON.stringify(nuevo), `10.2 ${nom}: Δ0 frente al dist anterior`, antes && nuevo && nuevo.filter((x, i) => x !== antes[i]).slice(0, 3)) }
  }
}

{
  // La isla de estado y la voz fijan su raíz en el paso 1: aquí solo la raíz de la isla (la voz no está en el banco)
  const o = await open(BANCO + '?html=compact')
  const isla = await o.p.evaluate(() => { const e = document.querySelector('.g-status-island'); if (!e) return null; const c = getComputedStyle(e); return [e.getAttribute('data-g-density'), parseFloat(c.getPropertyValue('--g-text-body-sm-size') || 0) || c.fontSize, c.fontSize] })
  const t = await o.p.evaluate(() => { const e = document.querySelector('.g-status-island'); const c = getComputedStyle(e); const m = document.createElement('span'); m.style.cssText = 'font-size:var(--g-text-body-sm-size);position:absolute'; e.appendChild(m); const v = parseFloat(getComputedStyle(m).fontSize); m.remove(); return v })
  ok(isla && isla[0] === 'default' && near(t, 14), '10.3 la raíz de GStatusIsland fija data-g-density="default" y sus roles valen el paso 1 con <html compact> (body-sm 14)', [isla, t])
  await o.ctx.close()
}

// ---------------------------------------------------------------------------------------------------------------------
// 11 · ritmo compartido · 12 · prosa, GText y GMetric · 13 · icono de GBtn
crit('11')
{
  const { p, ctx } = await open(BANCO)
  for (const [k, linea] of [['caption', 16], ['body-sm', 20], ['body', 24], ['title-sm', 28]]) {
    for (const kit of ['page', 'rf', 'rc']) {
      const got = await FS(p, `#r-${kit} .dt-role[data-role="${k}"]`)
      ok(got && near(got[1], linea, 0.01), `11.1 interlineado de ${k} = ${linea} en ${kit}`, got)
    }
  }
  // Un párrafo body de varias líneas: el paso de renglón es el mismo y el alto es múltiplo del renglón
  const par = await p.evaluate(() => {
    const f = (id) => { const e = document.querySelector(`#r-${id} .dt-prose`); return [parseFloat(getComputedStyle(e).lineHeight), Math.round(e.getBoundingClientRect().height * 100) / 100] }
    return { page: f('page'), rc: f('rc') }
  })
  ok(par.page[0] === par.rc[0] && par.rc[1] % par.rc[0] === 0 && par.page[1] % par.page[0] === 0, '11.2 el párrafo body de varias líneas tiene el mismo paso de renglón en compact y default', par)
  await ctx.close()
}
crit('12')
{
  const { p, ctx } = await open(BANCO)
  const pr = await FS(p, '#r-rc .dt-prose'); ok(sizeOk(pr, compactOf('body')), '12.1 <p> de la aplicación que lee --g-text-body-* en una región compact → 15/24', pr)
  const gt = await FS(p, '#r-rc [data-p="gtext"]'); ok(sizeOk(gt, compactOf('body')), '12.2 GText body en región compact → 15/24', gt)
  const mv = await p.evaluate(() => ['rc', 'page'].map((id) => parseFloat(getComputedStyle(document.querySelector(`#r-${id} .g-metric__value`)).fontSize)))
  ok(near(mv[0], compactOf('title')[0]) && near(mv[1], 25), '12.3 el valor de GMetric md baja con su rol: 23,44 en región compact, 25 en la página (GMetric no tiene prop density)', mv)
  await ctx.close()
}
crit('13')
{
  const { p, ctx } = await open(BANCO)
  const w = await p.evaluate(() => ['rc', 'page', 'pc', 'rf'].map((id) => document.querySelector(`[data-btns="${id}"] .g-btn[data-size="md"] .g-btn__prepend svg`).getBoundingClientRect().width))
  ok(near(w[0], 15.09, 0.1) && near(w[1], 16.1, 0.1) && near(w[2], w[0], 0.01) && near(w[3], w[1], 0.01), '13.1 icono de GBtn md: compact 15,1 · página 16,1 · comfortable 16,1', w)
  await ctx.close()
}

// ---------------------------------------------------------------------------------------------------------------------
// 14 · Δ0 sin regiones: el playground entero frente al dist anterior, puntero fino y grueso
crit('14')
if (BASE) {
  for (const coarse of [false, true]) {
    const c = coarse ? { hasTouch: true, isMobile: true, viewport: { width: 1280, height: 1000 } } : { viewport: { width: 1280, height: 1000 } }
    // Se compara tamaño y texto de los elementos que NO están dentro de una región/prop de densidad ni la contienen
    // (los que sí cambian por diseño; lo de debajo se desplaza pero no cambia de medida)
    const grab = async (dist) => {
      const o = await open(PLAY, { ctx: c, dist, wait: 1600 })
      const s = await o.p.evaluate(() => {
        const regs = [...document.querySelectorAll('[data-g-density]')]
        return [...document.querySelectorAll('[class*="g-"]:not(svg):not(svg *)')].map((el, i) => {
          const dentro = !!el.closest('[data-g-density]'); const contiene = regs.some((r) => el.contains(r))
          const b = el.getBoundingClientRect(); const cs = getComputedStyle(el)
          return [i, dentro || contiene ? 'R' : 'F', Math.round(b.width * 100) / 100, Math.round(b.height * 100) / 100, cs.fontSize, cs.lineHeight].join('|')
        })
      })
      const nReg = await o.p.evaluate(() => document.querySelectorAll('[data-g-density]').length)
      await o.ctx.close(); return { s, nReg }
    }
    const a = await grab(BASE); const b = await grab(DIST)
    ok(a.s.length === b.s.length && a.s.length > 500, `14.1 (${coarse ? 'grueso' : 'fino'}) el playground tiene los mismos elementos (${a.s.length})`, [a.s.length, b.s.length])
    const fa = a.s.filter((x) => x.split('|')[1] === 'F'); const fb = b.s.filter((x) => x.split('|')[1] === 'F')
    const dif = fa.map((x, i) => (x === fb[i] ? null : [x, fb[i]])).filter(Boolean)
    ok(fa.length > 400 && dif.length === 0, `14.2 (${coarse ? 'grueso' : 'fino'}) ${fa.length} elementos fuera de regiones: ancho, alto, tamaño de letra e interlineado iguales (regiones en el playground: ${b.nReg})`, dif.slice(0, 3))
  }
} else console.log('  (14 omitido: sin BASE)')

// ---------------------------------------------------------------------------------------------------------------------
// 15 · cambio en marcha sin animación de texto
crit('15')
{
  const { p, ctx } = await open(BANCO)
  await p.evaluate(() => {
    window.__tr = []
    for (const t of ['transitionrun', 'transitionstart']) document.addEventListener(t, (e) => { if (/font|line-height|letter/.test(e.propertyName)) window.__tr.push(e.propertyName) }, true)
  })
  const seq = []
  for (const paso of ['compact', 'comfortable', 'default', 'compact']) {
    await p.evaluate((v) => document.documentElement.setAttribute('data-g-density', v), paso)
    await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())))
    seq.push([paso, (await FS(p, '#r-page .dt-role[data-role="body"]'))[0], (await p.evaluate(() => document.getAnimations().filter((a) => a instanceof CSSTransition && /font|line-height|letter/.test(a.transitionProperty)).length))])
  }
  ok(seq[0][1] === compactOf('body')[0] && seq[1][1] === 16 && seq[2][1] === 16 && seq[3][1] === 15, '15.1 <html>: el texto cambia en el siguiente cuadro (15 › 16 › 16 › 15)', seq)
  ok(seq.every((s) => s[2] === 0), '15.2 ningún CSSTransition sobre font-size, line-height ni letter-spacing', seq)
  // Región: cambia el atributo de una región
  await p.evaluate(() => { document.documentElement.removeAttribute('data-g-density'); document.getElementById('r-rc').setAttribute('data-g-density', 'default') })
  await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())))
  ok(near((await FS(p, '#r-rc .dt-role[data-role="body"]'))[0], 16), '15.3 región: compact → default cambia en el siguiente cuadro', await FS(p, '#r-rc .dt-role[data-role="body"]'))
  const tr = await p.evaluate(() => window.__tr)
  ok(tr.length === 0, '15.4 ningún evento transitionrun/transitionstart de texto', tr)
  // Ningún selector de la hoja transiciona font-size / line-height (grep sobre el CSS del dist)
  const css = readFileSync((DIST || ROOT + 'packages/vue/dist') + '/grana.css', 'utf8')
  const tfs = [...css.matchAll(/transition(?:-property)?:[^;}]*(font-size|line-height|letter-spacing)[^;}]*/g)].map((m) => m[0].slice(0, 80))
  ok(tfs.length === 0, '15.5 ninguna regla de grana.css transiciona font-size, line-height o letter-spacing', tfs.slice(0, 3))
  await ctx.close()
}

// ---------------------------------------------------------------------------------------------------------------------
// 18 · grep: ninguna hoja de components/ cambia, ningún selector con descendiente, literales como hoy
crit('18')
{
  const sh = (c) => { try { return execSync(c, { cwd: ROOT, encoding: 'utf8' }).trim() } catch { return '' } }
  const cambiadas = sh('git diff --name-only 5ad561d -- packages/vue/src/components').split('\n').filter((f) => f.endsWith('.css'))
  ok(cambiadas.length === 0, '18.1 ninguna hoja de packages/vue/src/components/ cambia desde 5ad561d', cambiadas.slice(0, 5))
  const css = readFileSync(ROOT + 'packages/vue/src/styles/defaults.css', 'utf8')
  const desc = css.split('\n').filter((l) => /\[data-g-density[^\]]*\]\s+[.\w\[:>*]/.test(l.replace(/\/\*.*?\*\//g, '')) && !/^\s*\/?\*/.test(l))
  ok(desc.length === 0, '18.2 ningún selector [data-g-density…] con descendiente en defaults.css', desc.slice(0, 3))
  const lit = (s) => ({ px24: (s.match(/\b24px/g) || []).length, px44: (s.match(/\b44px/g) || []).length, px16: (s.match(/\b16px/g) || []).length })
  const antes = lit(sh('git show 5ad561d:packages/vue/src/styles/defaults.css')); const ahora = lit(css)
  ok(JSON.stringify(antes) === JSON.stringify(ahora), '18.3 24px, 44px y 16px en defaults.css como en 5ad561d', { antes, ahora })
  const calcSelf = css.split('\n').filter((l) => /--g-text-[a-z-]+-(size|line)\s*:\s*calc\(var\(--g-text/.test(l))
  ok(calcSelf.length === 0, '18.4 ningún calc() sobre un token de texto (sin ciclo ni fallback)', calcSelf.slice(0, 2))
  // sync-defaults.mjs solo lee lo anterior a «/* === OSCURO» y el bloque [data-theme="dark"]: las reglas de región van después
  const [claro, resto] = css.split('/* === OSCURO')
  const oscuro = resto.split('[data-theme="dark"] {')[1].split('}')[0]
  const fuga = /data-g-density/.test(claro.replace(/\/\*[\s\S]*?\*\//g, '')) || /--g-text-/.test(oscuro)
  ok(!fuga && claro.indexOf('--g-density: 1;') > 0, '18.5 sync-defaults del CLI no copia las reglas de región (están tras la marca OSCURO y fuera del bloque oscuro)', fuga)
}

// ---------------------------------------------------------------------------------------------------------------------
console.log('\nResultado por criterio:')
for (const [k, v] of Object.entries(r.by)) console.log(`  ${k.padStart(2)}: ${v.pass} ok${v.fail ? ', ' + v.fail + ' FALLAN' : ''}`)
console.log(`\nTotal: ${r.pass}/${r.pass + r.fail}`)
if (r.fails.length) { console.log('\nFallos:'); for (const f of r.fails) console.log('  ' + f) }
if (!BASE) console.log('\nSin BASE: omitidos 3.3, 10.2 y 14.')
await browser.close()
process.exit(r.fail ? 1 : 0)
