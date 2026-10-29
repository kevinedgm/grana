// Auditoría posterior de coco · densidad global y por región (pieza 2, density.md §10, DECISIONS.md #974 a #982).
// Mide los COMPONENTES REALES de packages/vue/dist/ (CSS de coco + .vue de bruno) en el banco design/lab/density/banco.html
// y en el playground. Los criterios se comprueban sobre todo por EQUIVALENCIA de juegos: el mismo marcado en una región y
// con la prop del mismo paso debe dar cajas idénticas (alto, rellenos, separaciones, cuerpo de letra de cada descendiente).
// Uso (raíz del repo):
//   python3 -m http.server 4209 -d . &
//   node design/lab/density/auditoria-verificar.mjs [--verbose]
//   BASE=/ruta/a/un/dist/anterior node design/lab/density/auditoria-verificar.mjs   (añade el Δ0 del criterio 1 contra
//     ese dist: el playground entero, puntero fino y grueso; sin BASE ese bloque se omite y se dice)
// Solo Chromium (es el único motor instalado en este entorno: /opt/pw-browsers). Vue se sirve desde node_modules.
// Lo que NO demuestra: Firefox y WebKit, un SSR real de aplicación (se aproxima con @vue/server-renderer + JS apagado),
// una tableta que cambia de puntero en caliente, lector de pantalla, la prueba unitaria de useFormField (bruno).
import { chromium } from 'playwright'
import { readFileSync, existsSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'

const ORIGIN = process.env.ORIGIN || 'http://localhost:4209'
const BANCO = ORIGIN + '/design/lab/density/banco.html'
const PLAY = ORIGIN + '/packages/vue/playground/index.html'
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const VUE = readFileSync(ROOT + 'node_modules/vue/dist/vue.global.js', 'utf8')
const BASE = process.env.BASE
// DIST: otro dist/ que servir en lugar de packages/vue/dist (p. ej. el de un worktree construido aparte)
const DIST = process.env.DIST
const verbose = process.argv.includes('--verbose')

const r = { pass: 0, fail: 0, skip: [], fails: [], by: {} }
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

async function open (url, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, ...(opts.ctx || {}) })
  if (opts.init) await ctx.addInitScript(opts.init)
  const p = await ctx.newPage()
  const errs = []
  p.on('pageerror', (e) => errs.push(String(e)))
  p.on('console', (m) => { if (m.type() === 'error' || /hydrat/i.test(m.text())) errs.push(m.type() + ': ' + m.text().slice(0, 200)) })
  await p.route('**/unpkg.com/**', (rt) => rt.fulfill({ body: VUE, contentType: 'text/javascript' }))
  const dist = opts.dist || DIST
  if (dist) await routeDist(p, dist)
  await p.goto(url)
  if (opts.ctx?.javaScriptEnabled !== false) await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(opts.wait ?? 700)
  return { p, ctx, errs }
}
async function routeDist (p, dist) {
  {
    await p.route('**/packages/vue/dist/**', (rt) => {
      const rel = new URL(rt.request().url()).pathname.split('/packages/vue/dist/')[1]
      const f = dist + '/' + rel
      if (!existsSync(f)) return rt.fulfill({ status: 404, body: '' })
      rt.fulfill({ body: readFileSync(f), contentType: f.endsWith('.css') ? 'text/css' : f.endsWith('.woff2') ? 'font/woff2' : 'text/javascript' })
    })
  }
}

// Huella de un subárbol: por cada descendiente (sin SVG) alto, rellenos, separaciones, margen de bloque y cuerpo de letra
const SNAP = (sel) => {
  const root = typeof sel === 'string' ? document.querySelector(sel) : sel
  if (!root) return null
  const out = []
  for (const el of [root, ...root.querySelectorAll('*:not(svg):not(svg *):not(script):not(style)')]) {
    const b = el.getBoundingClientRect(); const cs = getComputedStyle(el)
    if (cs.display === 'none') continue
    const n = (v) => Math.round(parseFloat(v) * 100) / 100
    out.push([el.tagName, Math.round(b.height * 100) / 100, n(cs.paddingBlockStart), n(cs.paddingBlockEnd), n(cs.paddingInlineStart), n(cs.paddingInlineEnd), cs.rowGap, cs.columnGap, n(cs.marginBlockStart), cs.fontSize].join('|'))
  }
  return out
}
const snap = (p, sel) => p.evaluate(SNAP, sel)
const diff = (a, b) => {
  if (!a || !b) return { missing: !a ? 'a' : 'b' }
  const d = []
  if (a.length !== b.length) d.push(`n ${a.length} ≠ ${b.length}`)
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) d.push(`${i}: ${a[i]} ≠ ${b[i]}`)
  return d
}
const same = (a, b, label) => { const d = diff(a, b); ok(Array.isArray(d) && d.length === 0, label, Array.isArray(d) ? d.slice(0, 3) : d) }
const H = (p, sel) => p.evaluate((sel) => { const e = document.querySelector(sel); return e ? Math.round(e.getBoundingClientRect().height * 100) / 100 : null }, sel)
const box = (p, sel) => p.evaluate((sel) => { const e = document.querySelector(sel); const b = e?.closest('.g-input, .g-select, .g-textarea, .g-datepicker, .g-combobox')?.querySelector('[data-g-tooltip-box]') || e?.querySelector('[data-g-tooltip-box]') || e; return b ? Math.round(b.getBoundingClientRect().height * 100) / 100 : null }, sel)
const kitBtn = (k) => `[data-kit="${k}"] [data-m="btn"]`
const kitInput = (k) => `[data-kit="${k}"] .g-input [data-g-tooltip-box]`
const gd = (p, sel) => p.evaluate((sel) => { const e = document.querySelector(sel); return e ? parseFloat(getComputedStyle(e).getPropertyValue('--g-density')) : null }, sel)
const raf2 = (p) => p.evaluate(() => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res))))

// ---------------------------------------------------------------------------------------------------------------------
// 1 · Δ0 por defecto y marcado
crit('1')
{
  const { p, ctx, errs } = await open(BANCO)
  ok(errs.length === 0, '1.0 el banco carga sin errores', errs)
  ok(near(await H(p, kitBtn('page')), 36), '1.1 página: GBtn md 36', await H(p, kitBtn('page')))
  ok(near(await H(p, kitInput('page')), 36), '1.2 página: caja de GInput 36', await H(p, kitInput('page')))
  const mk = await p.evaluate(() => {
    const k = document.querySelector('[data-kit="page"]')
    const cls = [...k.querySelectorAll('[class*="--density-"]')].map((e) => e.className.toString().match(/\S*--density-\S*/)[0])
    const att = [...k.querySelectorAll('[data-g-density]')].map((e) => e.className.toString().split(' ')[0])
    const page = [...document.querySelectorAll('[data-g-density]')].filter((e) => !e.closest('.db-region, #tabs-mark, .db-kits, [data-probe]') && !e.matches('[data-probe], .db-region'))
      .map((e) => [e.className.toString().split(' ')[0], e.getAttribute('data-g-density'), /--density-/.test(e.className.toString())])
    return { cls, att, page }
  })
  ok(mk.cls.length === 0, '1.3 sin prop ninguna raíz lleva clase --density-*', mk.cls.slice(0, 5))
  ok(mk.att.length === 0, '1.4 sin prop ninguna raíz lleva data-g-density', mk.att.slice(0, 5))
  ok(mk.page.every(([c, v, k]) => /^g-(toaster|status-island|speech)/.test(c) && v === 'default' && !k) && mk.page.some(([c]) => /^g-toaster/.test(c)) && mk.page.some(([c]) => /^g-status-island/.test(c)),
    '1.5 fuera de las regiones del banco solo GToaster y GStatusIsland fijan data-g-density="default" (sin clase)', mk.page)
  await ctx.close()
  if (BASE) {
    for (const coarse of [false, true]) {
      const c = coarse ? { hasTouch: true, isMobile: true, viewport: { width: 1280, height: 1000 } } : { viewport: { width: 1280, height: 1000 } }
      const sel = '[class*="g-"]:not(svg):not(svg *)'
      // Cambio esperado de §3.5: el GSplit density="compact" del playground (#spl-b) ahora aprieta sus superficies.
      // Se compara alto, rellenos, separaciones y letra (sin posición: lo de debajo baja esos px) fuera de #spl-b y sus ancestros
      const grab = async (dist) => {
        const o = await open(PLAY, { ctx: c, dist, wait: 1500 })
        const s = await o.p.evaluate((sel) => [...document.querySelectorAll(sel)].map((el) => {
          const b = el.getBoundingClientRect(); const cs = getComputedStyle(el)
          const sp = document.getElementById('spl-b')
          const tag = sp && (sp.contains(el) || el.contains(sp)) ? 'S' : ''
          return tag + [Math.round(b.width * 100) / 100, Math.round(b.height * 100) / 100, cs.paddingBlockStart, cs.paddingInlineStart, cs.rowGap, cs.columnGap, cs.marginBlockStart, cs.fontSize].join('|')
        }), sel)
        await o.ctx.close(); return s
      }
      const a0 = await grab(BASE); const b0 = await grab(null)
      const a = a0.filter((x) => !x.startsWith('S')); const b = b0.filter((x) => !x.startsWith('S'))
      const sa = a0.filter((x) => x.startsWith('S')); const sb = b0.filter((x) => x.startsWith('S'))
      ok(sa.length > 0 && diff(sa, sb).length > 0, `1.7 cambio esperado (§3.5): el GSplit density=compact del playground aprieta sus superficies (${diff(sa, sb).length} cajas)`, diff(sa, sb).slice(0, 2))
      same(a, b, `1.6 playground entero frente al dist anterior (${a.length} cajas, puntero ${coarse ? 'grueso' : 'fino'}): Δ0`)
    }
  } else r.skip.push('1.6 Δ0 del playground frente al dist anterior: sin BASE')
}

// ---------------------------------------------------------------------------------------------------------------------
// 2 · Región = prop · 3 · Anidación
{
  const { p, ctx } = await open(BANCO)
  crit('2')
  const K = {}
  for (const k of ['page', 'rc', 'rf', 'pc', 'pf', 'n-cf', 'n-dc', 'n-3', 'bad']) K[k] = await snap(p, `[data-kit="${k}"]`)
  ok(near(await H(p, kitBtn('rc')), 27), '2.1 región compact: GBtn 27', await H(p, kitBtn('rc')))
  ok(near(await H(p, kitBtn('rf')), 31.5), '2.2 región comfortable: GBtn 31,5', await H(p, kitBtn('rf')))
  const boxes = await p.evaluate(() => {
    const out = {}
    for (const k of ['page', 'rc', 'rf']) {
      const kit = document.querySelector(`[data-kit="${k}"]`)
      const hh = (s) => { const e = kit.querySelector(s); return e ? Math.round(e.getBoundingClientRect().height * 100) / 100 : null }
      out[k] = { input: hh('.g-input [data-g-tooltip-box]'), select: hh('.g-select [data-g-tooltip-box]'), date: hh('.g-datepicker__field'), textarea: hh('.g-textarea [data-g-tooltip-box]'), group: hh('.g-input-group [data-g-tooltip-box]') ?? hh('.g-input-group') }
    }
    return out
  })
  for (const [k, v] of [['rc', 27], ['rf', 31.5], ['page', 36]]) {
    for (const f of ['input', 'select', 'date', 'textarea']) ok(near(boxes[k][f], v), `2.3 ${k}: caja de ${f} ${v}`, boxes[k][f])
  }
  same(K.rc, K.pc, '2.4 juego en región compact = mismo juego con prop compact (todas las cajas)')
  same(K.rf, K.pf, '2.5 juego en región comfortable = mismo juego con prop comfortable')
  ok(diff(K.page, K.rc).length > 0, '2.6 control: la región compact sí cambia el juego frente a la página')
  same(K.bad, K.page, '2.7 un valor fuera de contrato (tiny) no hace nada')
  crit('3')
  same(K['n-cf'], K.rc, '3.1 compact dentro de comfortable = compact')
  same(K['n-dc'], K.page, '3.2 default dentro de compact = página (36)')
  same(K['n-3'], K.rc, '3.3 tres niveles alternos: manda la más cercana')
  await ctx.close()
}

// ---------------------------------------------------------------------------------------------------------------------
// 4 · La prop gana · 5 · B: la prop es región · 6 · Top layer · 7 · Diálogo
{
  const { p, ctx } = await open(BANCO)
  crit('4')
  ok(near(await H(p, '[data-probe="win-region"]'), 27), '4.1 control: GBtn sin prop en compact 27')
  ok(near(await H(p, '[data-probe="win-default"]'), 36), '4.2 density="default" dentro de compact → 36', await H(p, '[data-probe="win-default"]'))
  ok(near(await H(p, '[data-probe="win-compact-in-comf"]'), 27), '4.3 density="compact" dentro de comfortable → 27', await H(p, '[data-probe="win-compact-in-comf"]'))
  const wa = await p.evaluate(() => { const e = document.querySelector('[data-probe="win-attr"]'); return { a: e.getAttribute('data-g-density'), c: /g-btn--density-compact/.test(e.className), h: e.getBoundingClientRect().height } })
  ok(wa.a === 'compact' && wa.c && near(wa.h, 27), '4.4 la prop gana al data-g-density de la aplicación en la misma instancia (atributo = clase = compact)', wa)
  const same4 = await p.evaluate(() => [...document.querySelectorAll('[class*="--density-"]')].filter((e) => !/g-calendar/.test(e.className)).every((e) => {
    const v = e.className.toString().match(/--density-(default|comfortable|compact)\b/)?.[1]
    return v && e.getAttribute('data-g-density') === v
  }))
  ok(same4, '4.5 toda raíz con clase --density-X lleva data-g-density="X" en el mismo elemento')
  crit('5')
  ok(near(await H(p, '[data-probe="b-table-btn"]'), 27), '5.1 GTable compact: botón de su toolbar 27', await H(p, '[data-probe="b-table-btn"]'))
  ok(near(await H(p, '[data-probe="b-card-btn"]'), 27), '5.2 GCard compact: su acción 27', await H(p, '[data-probe="b-card-btn"]'))
  ok(near(await H(p, '[data-probe="b-stack-btn"]'), 27), '5.3 GStack compact: GBtn hijo 27', await H(p, '[data-probe="b-stack-btn"]'))
  const gaps = await p.evaluate(() => [parseFloat(getComputedStyle(document.querySelector('[data-probe="b-stack"]')).rowGap), parseFloat(getComputedStyle(document.querySelector('[data-probe="b-stack-default"]')).rowGap)])
  ok(near(gaps[0], gaps[1] * 0.75), '5.4 GStack compact: separación × 0,75', gaps)
  await p.click('[data-probe="b-table-menu-trigger"]'); await p.waitForTimeout(300)
  const bm = await p.evaluate(() => { const l = [...document.querySelectorAll('.g-menu__list')].find((e) => e.matches(':popover-open')); const it = l?.querySelector('[role="menuitem"]'); return it ? Math.round(it.getBoundingClientRect().height * 100) / 100 : null })
  ok(near(bm, 27), '5.5 GTable compact: el menú que abre su toolbar, item 27', bm)
  await p.keyboard.press('Escape'); await p.waitForTimeout(200)
  await p.click('[data-probe="b-dialog-open"]'); await p.waitForTimeout(450)
  ok(near(await box(p, '[data-probe="b-dialog-input"]'), 27), '5.6 GDialog compact: GInput de su contenido 27', await box(p, '[data-probe="b-dialog-input"]'))
  const dB = await snap(p, 'dialog[open]')
  await p.keyboard.press('Escape'); await p.waitForTimeout(450)

  crit('6')
  await p.click('[data-probe="tl-menu-trigger"]'); await p.waitForTimeout(300)
  const m1 = await p.evaluate(() => {
    const l = [...document.querySelectorAll('.g-menu__list')].find((e) => e.matches(':popover-open'))
    const it = l?.querySelector('[role="menuitem"]'); const tr = document.querySelector('[data-probe="tl-menu-trigger"]')
    return { open: !!l, item: it && Math.round(it.getBoundingClientRect().height * 100) / 100, trig: Math.round(tr.getBoundingClientRect().height * 100) / 100, d: l && getComputedStyle(l).getPropertyValue('--g-density').trim() }
  })
  ok(m1.open && near(m1.item, 27) && near(m1.trig, 27), '6.1 GMenu en la capa superior desde una región compact: item = disparador = 27', m1)
  const menuR = await snap(p, '.g-menu__list:popover-open')
  await p.keyboard.press('Escape'); await p.waitForTimeout(250)
  await p.click('[data-probe="tl-menu-trigger-prop"]'); await p.waitForTimeout(300)
  same(menuR, await snap(p, '.g-menu__list:popover-open'), '6.2 lista del menú en región compact = con prop compact')
  await p.keyboard.press('Escape'); await p.waitForTimeout(250)
  const openSel = async (probe) => {
    await p.evaluate((probe) => { const b = document.querySelector(`[data-probe="${probe}"]`)?.closest('.g-select')?.querySelector('[data-g-tooltip-box]') || document.querySelector(`[data-probe="${probe}"]`); b.scrollIntoView({ block: 'center' }) }, probe)
    const t = await p.evaluate((probe) => { const r0 = document.querySelector(`[data-probe="${probe}"]`); const root = r0.closest('.g-select') || r0; const b = root.querySelector('[data-g-tooltip-box]') || root; const q = b.getBoundingClientRect(); return [q.x + q.width / 2, q.y + q.height / 2] }, probe)
    await p.mouse.click(t[0], t[1]); await p.waitForTimeout(350)
    const s = await p.evaluate(() => { const l = [...document.querySelectorAll('[popover]')].find((e) => e.matches(':popover-open')); return l ? [...l.querySelectorAll('[role="option"]')].map((o) => Math.round(o.getBoundingClientRect().height * 100) / 100) : null })
    await p.keyboard.press('Escape'); await p.waitForTimeout(250)
    return s
  }
  const sR = await openSel('tl-select'); const sP = await openSel('tl-select-prop')
  ok(sR && sR.length > 0 && JSON.stringify(sR) === JSON.stringify(sP), '6.3 opciones de GSelect: región compact = prop compact', [sR, sP])
  const cbR = await box(p, '[data-probe="tl-combobox"]'); const cbP = await box(p, '[data-probe="tl-combobox-prop"]')
  ok(near(cbR, 27) && near(cbR, cbP), '6.4 campo de GCombobox en región compact = prop compact = 27', [cbR, cbP])
  const openCb = async (probe) => {
    const inp = await p.evaluate((probe) => { const e = document.querySelector(`[data-probe="${probe}"]`); const i = e.matches('input') ? e : e.querySelector('input'); i.id ||= 'cbx-' + probe; return '#' + i.id }, probe)
    await p.focus(inp); await p.keyboard.press('ArrowDown'); await p.waitForTimeout(400)
    const s = await p.evaluate(() => { const l = [...document.querySelectorAll('[popover], [role="listbox"]')].find((e) => e.matches(':popover-open') || (e.getAttribute('role') === 'listbox' && e.getBoundingClientRect().height > 0)); return l ? [...l.querySelectorAll('[role="option"]')].map((o) => Math.round(o.getBoundingClientRect().height * 100) / 100) : null })
    await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await p.waitForTimeout(250)
    return s
  }
  const cR = await openCb('tl-combobox'); const cP = await openCb('tl-combobox-prop')
  ok(cR && cR.length > 0 && JSON.stringify(cR) === JSON.stringify(cP), '6.5 panel de GCombobox: región compact = prop compact', [cR, cP])

  crit('7')
  await p.click('[data-probe="dl-open-inherit"]'); await p.waitForTimeout(450)
  ok(near(await box(p, '[data-probe="dl-inherit-input"]'), 27), '7.1 GDialog sin prop escrito en compact, abierto como modal: su GInput 27', await box(p, '[data-probe="dl-inherit-input"]'))
  const dI = await snap(p, 'dialog[open]')
  const padI = await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('dialog[open]')).getPropertyValue('padding-inline-start')) || null)
  same(dI.slice(1), dB.slice(1), '7.2 carcasa y contenido del diálogo heredado = diálogo con prop compact (salvo la raíz: título distinto no cambia cajas)')
  await p.keyboard.press('Escape'); await p.waitForTimeout(450)
  await p.click('[data-probe="dl-open-default"]'); await p.waitForTimeout(450)
  ok(near(await box(p, '[data-probe="dl-default-input"]'), 36), '7.3 con density="default" → 36', await box(p, '[data-probe="dl-default-input"]'))
  const dD = await snap(p, 'dialog[open]')
  await p.keyboard.press('Escape'); await p.waitForTimeout(450)
  await p.click('[data-probe="dl-open-page"]'); await p.waitForTimeout(450)
  same(dD.slice(1), (await snap(p, 'dialog[open]')).slice(1), '7.4 diálogo density="default" en compact = diálogo de la página')
  await p.keyboard.press('Escape'); await p.waitForTimeout(450)
  void padI
  await ctx.close()
}

// ---------------------------------------------------------------------------------------------------------------------
// 8 · Superficies de página Δ0 (GToaster, GStatusIsland)
crit('8')
{
  const show = async (p) => {
    await p.evaluate(() => {
      window.dbToaster.show({ id: 'a', title: 'Proyecto archivado', action: { label: 'Deshacer', onClick () {} }, duration: 0 })
      window.dbStatus.warning('off', 'Sin conexión', { description: 'Los cambios se guardarán al volver.', dismissible: true })
    })
    await p.waitForTimeout(900)
    return { t: await snap(p, '.g-toaster'), s: await snap(p, '.g-status-island'), btns: await p.evaluate(() => [...document.querySelectorAll('.g-toaster .g-btn, .g-status-island .g-btn')].map((b) => Math.round(b.getBoundingClientRect().height * 100) / 100)) }
  }
  const ref0 = await (async () => { const o = await open(BANCO + '?only=toast'); const s = await show(o.p); await o.ctx.close(); return s })()
  ok(ref0.btns.length > 0, '8.0 hay botones en el aviso y la isla', ref0.btns)
  for (const q of ['?only=toast&html=compact', '?only=toast&cli=compact', '?only=toast&html=comfortable']) {
    const o = await open(BANCO + q); const s = await show(o.p)
    ok(JSON.stringify(s.btns) === JSON.stringify(ref0.btns), `8.1 ${q}: botones del aviso y la isla iguales a la página por defecto`, [s.btns, ref0.btns])
    same(s.t, ref0.t, `8.2 ${q}: GToaster Δ0`)
    await o.ctx.close()
  }
  // Trasladado al modal superior (un GDialog density=compact)
  const o = await open(BANCO + '?only=b,toast')
  await o.p.click('[data-probe="b-dialog-open"]'); await o.p.waitForTimeout(450)
  const s = await show(o.p)
  const inDlg = await o.p.evaluate(() => !!document.querySelector('dialog[open] .g-toaster, dialog[open] ~ .g-toaster') || !!document.querySelector('.g-toaster')?.closest('dialog'))
  ok(JSON.stringify(s.btns) === JSON.stringify(ref0.btns), `8.3 con un GDialog compact abierto (aviso trasladado: ${inDlg}): botones Δ0`, [s.btns, ref0.btns])
  await o.ctx.close()
}

// ---------------------------------------------------------------------------------------------------------------------
// 9 · Formularios
crit('9')
{
  const { p, ctx } = await open(BANCO + '?only=forms')
  ok(near(await box(p, '[data-probe="f-region-input"]'), 27), '9.1 GForm sin prop en región compact: campo 27', await box(p, '[data-probe="f-region-input"]'))
  ok(near(await box(p, '[data-probe="f-prop-input"]'), 27), '9.2 GForm density=compact: campo 27')
  ok(near(await H(p, '[data-probe="f-prop-submit"]'), 27), '9.3 GForm density=compact: botón de GFormActions 27', await H(p, '[data-probe="f-prop-submit"]'))
  ok(near(await H(p, '[data-probe="f-region-submit"]'), 27), '9.4 GForm en región compact: botón de GFormActions 27')
  ok(near(await box(p, '[data-probe="f-out-input"]'), 36), '9.5 región default entre GForm compact y el campo → 36', await box(p, '[data-probe="f-out-input"]'))
  same((await snap(p, '#f-region .g-form')), (await snap(p, '#f-prop .g-form')), '9.6 GForm en región compact = GForm compact (secciones, revelado y pliegue incluidos)')
  const g = await p.evaluate(() => {
    const out = {}
    for (const id of ['f-region', 'f-prop', 'f-page']) {
      const q = (s) => document.querySelector(`#${id} ${s}`)
      const css = (e, prop) => e ? parseFloat(getComputedStyle(e)[prop]) : null
      out[id] = { section: css(q('.g-form-section'), 'marginBlockStart'), sectionGap: css(q('.g-form-section'), 'rowGap'), reveal: css(q('.g-form-reveal__body') || q('.g-form-reveal'), 'rowGap'), fold: css(q('.g-form-fold'), 'paddingInlineStart') ?? null, foldBody: css(q('.g-form-fold__body') || q('.g-form-fold'), 'rowGap') }
    }
    return out
  })
  ok(JSON.stringify(g['f-region']) === JSON.stringify(g['f-prop']) && JSON.stringify(g['f-region']) !== JSON.stringify(g['f-page']), '9.7 separaciones de GFormSection, GFormReveal y GFormFold siguen a la región', g)
  await ctx.close()
}

// ---------------------------------------------------------------------------------------------------------------------
// 10 · Cambio en marcha (sin animación, foco, nueva medida, un observador)
crit('10')
{
  const init = () => {
    window.__densObs = { created: 0, active: new Set() }
    const MO = window.MutationObserver
    const proto = MO.prototype
    const obs = proto.observe; const dis = proto.disconnect
    proto.observe = function (t, o) { if (o?.attributeFilter?.includes('data-g-density')) { window.__densObs.created++; window.__densObs.active.add(this) } return obs.call(this, t, o) }
    proto.disconnect = function () { window.__densObs.active.delete(this); return dis.call(this) }
  }
  const { p, ctx } = await open(BANCO + '?only=kits', { init })
  const rc = await snap(p, '[data-kit="rc"]'); const rf = await snap(p, '[data-kit="rf"]'); const pg = await snap(p, '[data-kit="page"]')
  ok(await p.evaluate(() => window.__densObs.active.size) === 1, '10.1 un solo MutationObserver de densidad con 9 juegos montados', await p.evaluate(() => window.__densObs.created))
  await p.focus('[data-kit="page"] .g-input input')
  await p.evaluate(() => { window.__tr = []; document.addEventListener('transitionrun', (e) => window.__tr.push(e.propertyName), true) })
  const step = async (v) => {
    await p.evaluate((v) => document.documentElement.setAttribute('data-g-density', v), v)
    const h1 = await p.evaluate(() => new Promise((res) => requestAnimationFrame(() => res(document.querySelector('[data-kit="page"] [data-m="btn"]').getBoundingClientRect().height))))
    await raf2(p)
    const anim = await p.evaluate(() => document.getAnimations().filter((a) => a instanceof CSSTransition && /^(block-size|min-block-size|inline-size|height|width|min-height|padding|gap|row-gap|column-gap|margin)/.test(a.transitionProperty)).map((a) => a.transitionProperty))
    return { h1, anim, foc: await p.evaluate(() => document.activeElement?.closest('[data-kit]')?.getAttribute('data-kit') + ':' + document.activeElement?.tagName) }
  }
  const s1 = await step('compact')
  ok(near(s1.h1, 27), '10.2 <html> default → compact: el alto cambia en el siguiente cuadro', s1.h1)
  ok(s1.anim.length === 0, '10.3 sin CSSTransition sobre alto, ancho, relleno, separación ni margen', s1.anim)
  ok(s1.foc === 'page:INPUT', '10.4 el foco sigue en el mismo elemento', s1.foc)
  same(await snap(p, '[data-kit="page"]'), rc, '10.5 ≤ 2 cuadros: el juego de la página = el de la región compact (mediciones de JS incluidas: marca de GTabs, deslizador, filas)')
  const s2 = await step('comfortable')
  ok(near(s2.h1, 31.5) && s2.anim.length === 0 && s2.foc === 'page:INPUT', '10.6 compact → comfortable: siguiente cuadro, sin transición, foco', s2)
  same(await snap(p, '[data-kit="page"]'), rf, '10.7 ≤ 2 cuadros: = región comfortable')
  // Una región que cambia
  await p.evaluate(() => document.documentElement.removeAttribute('data-g-density'))
  await p.evaluate(() => document.querySelector('#r-comf').setAttribute('data-g-density', 'compact'))
  await raf2(p)
  same(await snap(p, '[data-kit="rf"]'), rc, '10.8 cambiar el atributo de una región: su juego pasa a compact en ≤ 2 cuadros')
  same(await snap(p, '[data-kit="page"]'), pg, '10.9 y la página vuelve a default')
  const tr = await p.evaluate(() => window.__tr.filter((n) => /^(block-size|min-block-size|inline-size|height|width|padding|gap|row-gap|column-gap|margin)/.test(n)))
  ok(tr.length === 0, '10.10 ningún transitionrun de geometría durante los cambios', tr)
  await p.evaluate(() => window.dbVueApp.unmount()); await p.waitForTimeout(100)
  ok(await p.evaluate(() => window.__densObs.active.size) === 0, '10.11 ningún observador tras desmontar el último componente')
  await ctx.close()
  // Reducción de movimiento: lo mismo (no hay movimiento que reducir)
  const o = await open(BANCO + '?only=kits', { ctx: { reducedMotion: 'reduce' } })
  await o.p.evaluate(() => document.documentElement.setAttribute('data-g-density', 'compact')); await raf2(o.p)
  same(await snap(o.p, '[data-kit="page"]'), await snap(o.p, '[data-kit="rc"]'), '10.12 con prefers-reduced-motion: mismo resultado')
  await o.ctx.close()
  // Tareas largas con una tabla de 500 filas (entorno compartido: informativo salvo que supere mucho)
  const t = await open(BANCO + '?only=perf&rows=500', { wait: 1500 })
  // Control: el mismo reflujo provocado por un token puro (--g-space-1), sin atributo ni observador. Si el cambio de
  // densidad cuesta lo mismo que el control, la tarea larga es del reflujo del navegador, no del mecanismo
  const lt = await t.p.evaluate(async () => {
    const run = async (kind) => {
      const seen = []
      const po = new PerformanceObserver((l) => { for (const e of l.getEntries()) seen.push(Math.round(e.duration)) })
      po.observe({ type: 'longtask', buffered: false })
      for (const v of ['compact', 'comfortable', 'default', 'compact', 'default']) {
        if (kind === 'attr') document.documentElement.setAttribute('data-g-density', v)
        else document.documentElement.style.setProperty('--g-space-1', { compact: '3px', comfortable: '3.5px', default: '4px' }[v])
        await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(res, 80))))
      }
      po.disconnect()
      return seen.length ? Math.max(...seen) : 0
    }
    const out = { attr: [], control: [] }
    for (let i = 0; i < 3; i++) { out.attr.push(await run('attr')); out.control.push(await run('space')) }
    return out
  })
  const med = (a) => [...a].sort((x, y) => x - y)[1]
  r.notes = (r.notes || []).concat(`10.13 tareas largas con 500 filas (mediana de 3 pasadas): cambio de densidad ${med(lt.attr)} ms, control con un token puro ${med(lt.control)} ms (${JSON.stringify(lt)})`)
  ok(med(lt.attr) <= Math.max(50, med(lt.control) + 16), '10.13 con 500 filas el cambio de densidad no cuesta más que el mismo reflujo con un token puro (+1 cuadro de margen); el umbral absoluto de 50 ms se exige sin vecinos (#965)', lt)
  await t.ctx.close()
}

// ---------------------------------------------------------------------------------------------------------------------
// 11 · CLI frente a <html>
crit('11')
{
  const cases = [['?only=kits&cli=compact', 27, 31.5], ['?only=kits&cli=compact&html=comfortable', 31.5, 31.5], ['?only=kits&cli=compact&html=default', 36, 31.5], ['?only=kits&cli=compact&cli2=comfortable', 31.5, 31.5]]
  for (const [q, page, rf] of cases) {
    const { p, ctx } = await open(BANCO + q)
    ok(near(await H(p, kitBtn('page')), page), `11.1 ${q}: página ${page}`, await H(p, kitBtn('page')))
    ok(near(await H(p, kitBtn('rf')), rf), `11.2 ${q}: una región comfortable dentro sigue mandando (${rf})`, await H(p, kitBtn('rf')))
    if (q === '?only=kits&cli=compact') same(await snap(p, '[data-kit="page"]'), await snap(p, '[data-kit="pc"]'), '11.3 clave compact del CLI: la página entera = prop compact')
    await ctx.close()
  }
  // Salida real del CLI (bruno, §6): la que el banco emula con ?cli=
  try {
    const dir = mkdtempSync(join(tmpdir(), 'g-dens-'))
    const cfg = join(dir, 'grana.config.json')
    writeFileSync(cfg, JSON.stringify({ brand: '#5B3FD6', density: 'compact' }))
    const out = execSync(`node ${ROOT}packages/cli/bin/grana.mjs theme ${cfg} --stdout`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    const flat = out.replace(/\s+/g, ' ')
    if (!/--g-density/.test(out)) r.skip.push('11.4 salida real del CLI: todavía sin --g-density (clave de bruno en curso)')
    else {
      ok(flat.includes(':root:where(:not([data-g-density])) { --g-density: 0.75; }'), '11.4 la salida real del CLI con density "compact" emite la regla del banco', flat.slice(flat.indexOf('g-density') - 50, flat.indexOf('g-density') + 200))
      ok(/@media \(pointer: coarse\) \{ :root:where\(:not\(\[data-g-density\]\)\) \{ --g-density: 1; \} \}/.test(flat), '11.5 y su restablecimiento táctil')
      writeFileSync(cfg, JSON.stringify({ brand: '#5B3FD6' }))
      ok(!/--g-density/.test(execSync(`node ${ROOT}packages/cli/bin/grana.mjs theme ${cfg} --stdout`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })), '11.6 sin la clave, nada de densidad en tokens.css')
    }
  } catch (e) { r.skip.push('11.4 salida real del CLI: no se pudo ejecutar (' + String(e.message).slice(0, 80) + ')') }
}

// ---------------------------------------------------------------------------------------------------------------------
// 12 · Táctil (P2 · cede al dedo) · 15 · meta de GCard en táctil
crit('12')
{
  const touch = { hasTouch: true, isMobile: true, viewport: { width: 1280, height: 1000 } }
  for (const q of ['?only=kits,b,card', '?only=kits,b,card&html=compact', '?only=kits,b,card&cli=compact']) {
    const { p, ctx } = await open(BANCO + q, { ctx: touch })
    const coarse = await p.evaluate(() => matchMedia('(pointer: coarse)').matches)
    ok(coarse, `12.0 ${q}: precondición pointer: coarse`)
    ok(await gd(p, kitBtn('rc')) === 1 && await gd(p, kitBtn('page')) === 1, `12.1 ${q}: --g-density = 1 en la región compact y en la página`, [await gd(p, kitBtn('rc')), await gd(p, kitBtn('page'))])
    ok(near(await H(p, kitBtn('rc')), 36) && near(await H(p, kitBtn('page')), 36), `12.2 ${q}: GBtn visible 36 (no 27)`, [await H(p, kitBtn('rc')), await H(p, kitBtn('page'))])
    if (q === '?only=kits,b,card') {
      const P = await snap(p, '[data-kit="page"]')
      same(await snap(p, '[data-kit="rc"]'), P, '12.3 región compact = página (separaciones de default)')
      same(await snap(p, '[data-kit="rf"]'), P, '12.4 región comfortable = página')
      ok(await gd(p, kitBtn('pc')) === 0.75 && near(await H(p, kitBtn('pc')), 27), '12.5 GBtn density="compact" explícito: --g-density 0,75 y caja visible 27', [await gd(p, kitBtn('pc')), await H(p, kitBtn('pc'))])
      const area = await p.evaluate((s) => { const e = document.querySelector(s); const a = getComputedStyle(e, '::after'); return [parseFloat(a.blockSize) || parseFloat(a.height), parseFloat(a.minBlockSize) || 0] }, kitBtn('pc'))
      ok(Math.max(...area) >= 44 || area.some((v) => v >= 44), '12.6 su área táctil (::after) ≥ 44', area)
      const inp = await p.evaluate(() => { const b = document.querySelector('[data-kit="pc"] .g-input [data-g-tooltip-box]'); const i = b.querySelector('input'); return [Math.round(b.getBoundingClientRect().height * 100) / 100, parseFloat(getComputedStyle(i).fontSize)] })
      ok(near(inp[0], 44) && inp[1] >= 16, '12.7 GInput density="compact": caja 44 y texto editable 16', inp)
      ok(await gd(p, '[data-probe="b-table-btn"]') === 0.75, '12.8 lo de dentro de una raíz con prop hereda 0,75 (botón de la toolbar de GTable compact)', await gd(p, '[data-probe="b-table-btn"]'))
      ok(await gd(p, '[data-probe="b-stack-inner-region"]') === 1, '12.9 una región de la aplicación dentro de una raíz con prop cede a 1', await gd(p, '[data-probe="b-stack-inner-region"]'))
      crit('15')
      const low = await p.evaluate(() => Object.fromEntries(['card-rc', 'card-pc'].map((k) => [k, !!document.querySelector(`[data-probe="${k}"] .g-card__meta-item--low`)])))
      ok(low['card-rc'] === true && low['card-pc'] === false, '15.3 táctil: meta low visible en región compact (P2) y oculta con prop compact', low)
      crit('12')
    }
    await ctx.close()
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// 13 · Sin JS (SSR con @vue/server-renderer sobre el ESM de dist/) e hidratación
crit('13')
{
  const Grana = await import((DIST ? DIST + '/' : ROOT + 'packages/vue/dist/') + 'grana.js')
  const tpl = `<div><div data-g-density="compact"><g-btn data-probe="ssr-region">Región</g-btn></div><g-btn density="compact" data-probe="ssr-prop">Prop</g-btn><g-btn data-probe="ssr-page">Página</g-btn><div data-g-density="compact"><g-input label="Nombre" data-probe="ssr-input"></g-input></div></div>`
  const app = createSSRApp({ template: tpl })
  app.use(Grana.default || Grana.Grana || Grana)
  let html = ''
  try { html = await renderToString(app) } catch (e) { html = 'ERR ' + e.message }
  ok(!html.startsWith('ERR'), '13.0 renderToString sin error', html.slice(0, 200))
  const page = `<!doctype html><html lang="es"><head><meta charset="utf-8"><link rel="stylesheet" href="/packages/vue/dist/fonts.css"><link rel="stylesheet" href="/packages/vue/dist/grana.css"></head><body><div id="app">${html}</div>
<script src="/node_modules/vue/dist/vue.global.js"></script><script src="/packages/vue/dist/grana.umd.js"></script>
<script>window.__ssr = true; if (window.Vue) { const a = Vue.createSSRApp({ template: ${JSON.stringify(tpl)} }); a.use(Grana); a.mount('#app'); window.__hydrated = true }</script></body></html>`
  for (const js of [false, true]) {
    const ctx = await browser.newContext({ javaScriptEnabled: js, viewport: { width: 1000, height: 700 } })
    const p = await ctx.newPage()
    const errs = []
    p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text().slice(0, 160)) })
    if (DIST) await routeDist(p, DIST)
    await p.route(ORIGIN + '/ssr.html', (rt) => rt.fulfill({ body: page, contentType: 'text/html' }))
    await p.goto(ORIGIN + '/ssr.html'); await p.waitForTimeout(600)
    const hs = await p.evaluate(() => Object.fromEntries(['ssr-region', 'ssr-prop', 'ssr-page'].map((k) => [k, Math.round(document.querySelector(`[data-probe="${k}"]`).getBoundingClientRect().height * 100) / 100])))
    ok(near(hs['ssr-region'], 27) && near(hs['ssr-prop'], 27) && near(hs['ssr-page'], 36), `13.1 JS ${js ? 'activo (hidratado)' : 'apagado'}: región 27, prop 27, página 36`, hs)
    if (!js) {
      const mk = await p.evaluate(() => { const e = document.querySelector('[data-probe="ssr-prop"]'); return [e.getAttribute('data-g-density'), e.className] })
      ok(mk[0] === 'compact' && /g-btn--density-compact/.test(mk[1]), '13.2 la raíz con prop ya trae clase y atributo en el marcado del servidor', mk)
    } else {
      ok(await p.evaluate(() => window.__hydrated === true), '13.3 se hidrata')
      const hyd = errs.filter((e) => /hydrat|mismatch/i.test(e))
      ok(hyd.length === 0, '13.4 sin avisos de hidratación', hyd)
    }
    await ctx.close()
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// 14 · Marca de GTabs · 15 · meta de GCard · 16 · rejilla y mínimos · paridad en oscuro
{
  const { p, ctx } = await open(BANCO + '?only=tabs,card')
  crit('14')
  const mark = async () => p.evaluate(() => {
    const out = {}
    for (const k of ['default', 'comfortable', 'compact']) {
      for (const w of ['r', 'p']) {
        const t = document.querySelector(`[data-probe="tabs-${w}-${k}"]`) || document.querySelector(`[data-probe="tabs-${w}-${k}"]`)
        const root = t?.closest('.g-tabs') || t
        const m = root?.querySelector('.g-tabs__mark')
        const probe = document.createElement('div'); probe.style.blockSize = `var(--g-tabs-mark-${k})`; root.appendChild(probe)
        out[`${w}-${k}`] = [m ? Math.round(parseFloat(getComputedStyle(m).blockSize) * 1000) / 1000 : null, Math.round(parseFloat(getComputedStyle(probe).blockSize) * 1000) / 1000]
        probe.remove()
      }
    }
    return out
  })
  const m0 = await mark()
  for (const [k, [got, want]] of Object.entries(m0)) ok(near(got, want, 0.01), `14.1 tema por defecto · ${k}: grosor de la marca = token (${want})`, [got, want])
  await p.evaluate(() => { const s = document.documentElement.style; s.setProperty('--g-tabs-mark-default', '5px'); s.setProperty('--g-tabs-mark-comfortable', '3.5px'); s.setProperty('--g-tabs-mark-compact', '1.25px') })
  await p.waitForTimeout(150)
  const m1 = await mark()
  for (const [k, [got, want]] of Object.entries(m1)) ok(near(got, want, 0.01), `14.2 tema con los tres tokens cambiados · ${k}: grosor = token (${want})`, [got, want])
  crit('15')
  const low = await p.evaluate(() => Object.fromEntries(['card-rc', 'card-rf', 'card-page', 'card-pc'].map((k) => [k, !!document.querySelector(`[data-probe="${k}"] .g-card__meta-item--low`)])))
  ok(low['card-rc'] === false && low['card-pc'] === false, '15.1 meta low oculta en región compact (tras montar) y con prop compact', low)
  ok(low['card-rf'] === true && low['card-page'] === true, '15.2 visible en comfortable y default', low)
  await p.evaluate(() => document.querySelector('#card-rc').setAttribute('data-g-density', 'default')); await raf2(p); await p.waitForTimeout(50)
  ok(await p.evaluate(() => !!document.querySelector('[data-probe="card-rc"] .g-card__meta-item--low')), '15.4 al cambiar la región a default en marcha, la meta low vuelve (densityEpoch)')
  await ctx.close()
}
crit('16')
{
  for (const s1 of ['4.375px', '3.75px']) {
    const { p, ctx } = await open(BANCO + '?only=kits')
    await p.evaluate((s1) => document.documentElement.style.setProperty('--g-space-1', s1), s1); await raf2(p); await p.waitForTimeout(100)
    const bad = await p.evaluate(() => {
      const out = []
      for (const k of ['page', 'rc', 'rf', 'pc', 'pf']) {
        const kit = document.querySelector(`[data-kit="${k}"]`)
        const els = [...kit.querySelectorAll('.g-btn, [data-g-tooltip-box], .g-tabs__tab')]
        for (const e of els) { const hh = e.getBoundingClientRect().height; if (hh > 0 && Math.abs(hh * 2 - Math.round(hh * 2)) > 0.011) out.push([k, e.className.toString().split(' ')[0], Math.round(hh * 1000) / 1000]) }
      }
      return out
    })
    ok(bad.length === 0, `16.1 --g-space-1 ${s1}: alto × 2 entero en botones, cajas de campo y pestañas de cada paso`, bad.slice(0, 6))
    await ctx.close()
  }
  const { p, ctx } = await open(BANCO + '?only=kits')
  const small = await p.evaluate(() => [...document.querySelectorAll('.g-btn')].map((b) => b.getBoundingClientRect().height).filter((hh) => hh > 0 && hh < 23.99))
  ok(small.length === 0, '16.2 ningún GBtn por debajo de 24 px en ningún paso', small)
  const fonts = await p.evaluate(() => [...document.querySelectorAll('[data-kit] *')].map((e) => parseFloat(getComputedStyle(e).fontSize)).filter((f) => f < 12))
  ok(fonts.length === 0, '16.3 ningún texto por debajo de 12 px (la densidad no toca el texto en esta pieza)', fonts.slice(0, 4))
  await ctx.close()
  const t = await open(BANCO + '?only=kits', { ctx: { hasTouch: true, isMobile: true, viewport: { width: 1280, height: 1000 } } })
  const ed = await t.p.evaluate(() => [...document.querySelectorAll('[data-kit] input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=hidden]), [data-kit] textarea')].filter((i) => i.getBoundingClientRect().width > 2).map((i) => [i.closest('[class^="g-"]')?.className.toString().split(' ')[0], parseFloat(getComputedStyle(i).fontSize)]).filter(([, f]) => f < 16))
  ok(ed.length === 0, '16.4 táctil: texto editable ≥ 16 px en todos los juegos (#972)', ed.slice(0, 4))
  await t.ctx.close()
  crit('16·oscuro')
  const d = await open(BANCO + '?only=kits&dark=1')
  same(await snap(d.p, '[data-kit="rc"]'), await snap(d.p, '[data-kit="pc"]'), '16.5 en oscuro: región compact = prop compact (la densidad no depende del esquema)')
  await d.ctx.close()
}

// ---------------------------------------------------------------------------------------------------------------------
// 17 · Grep sobre las hojas
crit('17')
{
  const comp = ROOT + 'packages/vue/src/components'
  const sh = (c) => { try { return execSync(c, { encoding: 'utf8', cwd: ROOT }).trim() } catch (e) { return (e.stdout || '').trim() } }
  ok(sh(`grep -rln -- "--g-density:" ${comp} --include=*.css`) === '', '17.1 ninguna hoja de components/ declara --g-density')
  ok(sh(`grep -rn -- "\\.g-form--density-[a-z]* \\." ${comp} --include=*.css`) === '', '17.2 ninguna hoja lee .g-form--density-* desde un descendiente')
  const only = sh(`grep -rnE -- "--density-(default|comfortable|compact)[^{]*\\{ *--_(density|d|df|adaptive-density): *[0-9.]+; *(--_mark-t: [^;]+; *)?\\}" ${comp} --include=*.css`)
  ok(only === '', '17.3 no queda ninguna regla --density-* que solo reasigne el multiplicador (GCalendar tiene escala propia)', only.split('\n').slice(0, 4))
  const count = (re, ref) => Number(sh(`git grep -h -o -E "${re}" ${ref || ''} -- 'packages/vue/src/components/*.css' | wc -l`))
  for (const lit of ['16px', '24px', '44px']) {
    const now = count(`\\b${lit}`); const before = count(`\\b${lit}`, '08ffaa8')
    ok(now === before, `17.4 literal ${lit}: ${now} usos, igual que antes de la pieza (${before})`, [now, before])
  }
  const al = sh(`grep -rhoE -- "--_(density|d|df|adaptive-density): var\\(--g-density\\);" ${comp} --include=*.css | wc -l`)
  ok(Number(al) === 34, '17.5 los 34 alias de raíz leen var(--g-density)', al)
}

// ---------------------------------------------------------------------------------------------------------------------
// 18 · Blocks
crit('18')
{
  const bdist = ROOT + 'packages/blocks/dist'
  if (!existsSync(bdist)) r.skip.push('18 blocks: packages/blocks/dist no existe (sin construir)')
  else r.skip.push('18 blocks: revisión visual en la auditoría (auditoria.md §18), no automatizada aquí')
}

await browser.close()
console.log('\nPor criterio:')
for (const [k, v] of Object.entries(r.by)) console.log(`  ${k.padEnd(9)} ${v.pass}/${v.pass + v.fail}`)
if (r.skip.length) console.log('\nOmitido:\n  ' + r.skip.join('\n  '))
if (r.notes?.length) console.log('\nNotas:\n  ' + r.notes.join('\n  '))
if (r.fails.length) console.log('\nFallos:\n  ' + r.fails.join('\n  '))
console.log(`\nChromium: ${r.pass}/${r.pass + r.fail}`)
process.exit(r.fail ? 1 : 0)
