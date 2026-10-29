// Verificación de la ronda r01 · densidad por región (kiwi). Mide el prototipo: componentes reales de dist/ + density-proto.css.
// Uso: python3 -m http.server 4212 -d /home/user/grana &  ; copiar este archivo a design/lab/theme-playground/ (para que
// resuelva playwright) y ejecutarlo allí: node density-verificar.mjs. Luego borrar la copia. Solo Chromium (encargo).
// Lo que NO demuestra: el CSS y el .vue definitivos (el shim emula «sin prop» con data-proto-explicit), WebKit/Firefox,
// lector de pantalla, SSR real (se aproxima con JavaScript apagado sobre marcado estático), el observador de JS (no existe aún).
import { chromium } from 'playwright'

const BASE = 'http://localhost:4212/design/lab/density/r01/index.html'
const r = { pass: 0, fail: 0, fails: [], data: {} }
const ok = (cond, label, info) => { if (cond) r.pass++; else { r.fail++; r.fails.push(label + (info !== undefined ? ' ' + JSON.stringify(info) : '')) } }
const near = (a, b, t = 0.51) => Math.abs(a - b) <= t

const browser = await chromium.launch()

async function open (q = '', ctxOpts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1800 }, ...ctxOpts })
  const p = await ctx.newPage()
  const errs = []
  p.on('pageerror', (e) => errs.push(String(e)))
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  await p.goto(BASE + q)
  if (ctxOpts.javaScriptEnabled !== false) await p.waitForSelector('.g-table__row')
  await p.waitForTimeout(300)
  return { p, ctx, errs }
}
// Alto de la caja de una sonda (si la sonda es un componente con raíz envolvente, la caja del control)
const h = (p, probe, inner) => p.evaluate(([probe, inner]) => {
  let el = document.querySelector(`[data-probe="${probe}"]`)
  if (!el) return null
  if (inner) el = el.querySelector(inner) || el
  return Math.round(el.getBoundingClientRect().height * 100) / 100
}, [probe, inner])
const dens = (p, sel) => p.evaluate((sel) => { const el = document.querySelector(sel); return el ? getComputedStyle(el).getPropertyValue('--g-density').trim() : null }, sel)

// Qué caja es la «caja» de GInput en el dist (la del campo visible)
async function inputBox (p, probe) {
  return p.evaluate((probe) => {
    const probeEl = document.querySelector(`[data-probe="${probe}"]`)
    const root = probeEl?.closest('.g-input') || probeEl
    const el = root?.querySelector('[data-g-tooltip-box]') || root
    return el ? Math.round(el.getBoundingClientRect().height * 100) / 100 : null
  }, probe)
}

// 1 · Página por defecto, regiones, anidación y prop explícita (modo A)
{
  const { p, ctx, errs } = await open('')
  const d = r.data.a = {
    pageBtn: await h(p, 'page-btn'), pageInput: await inputBox(p, 'page-input'),
    cBtn: await h(p, 'compact-btn'), cInput: await inputBox(p, 'compact-input'), cExplicit: await h(p, 'compact-explicit-default'),
    comfBtn: await h(p, 'comf-btn'), comfInput: await inputBox(p, 'comf-input'),
    nestBtn: await h(p, 'nested-btn'), nestInput: await inputBox(p, 'nested-input'),
    abBtn: await h(p, 'ab-btn'),
    cCell: await p.evaluate(() => { const td = document.querySelector('#dp-compact .g-table__row td'); return td ? parseFloat(getComputedStyle(td).paddingBlockStart) : null }),
    pageCell: null
  }
  ok(near(d.pageBtn, 36), '1.1 página: GBtn md 36px', d.pageBtn)
  ok(near(d.pageInput, 36), '1.2 página: caja de GInput 36px', d.pageInput)
  ok(near(d.cBtn, 27), '1.3 región compact: GBtn 27px', d.cBtn)
  ok(near(d.cInput, 27), '1.4 región compact: caja de GInput 27px', d.cInput)
  ok(near(d.cCell, 9), '1.5 región compact: relleno de celda de GTable 9px (3 × 4 × 0,75)', d.cCell)
  ok(near(d.cExplicit, 36), '1.6 prop explícita density="default" gana a la región compact', d.cExplicit)
  ok(near(d.comfBtn, 31.5), '1.7 región comfortable: GBtn 31,5px', d.comfBtn)
  ok(near(d.comfInput, 31.5), '1.8 región comfortable: GInput 31,5px', d.comfInput)
  ok(near(d.nestBtn, 27) && near(d.nestInput, 27), '1.9 anidación: compact dentro de comfortable manda la más cercana', [d.nestBtn, d.nestInput])
  ok(near(d.abBtn, 36), '1.10 modo A: botón en la barra de una tabla con prop compact sigue a la página', d.abBtn)

  // 2 · Menú abierto desde la región: capa superior, hereda la región, fila = disparador
  await p.locator('[data-probe="compact-menu-trigger"]').click()
  await p.waitForTimeout(250)
  const m = await p.evaluate(() => {
    const list = [...document.querySelectorAll('.g-menu__list')].find((l) => l.matches(':popover-open'))
    if (!list) return null
    const item = list.querySelector('[role="menuitem"]')
    const trig = document.querySelector('[data-probe="compact-menu-trigger"]')
    return { open: true, inRegion: list.closest('[data-g-density]')?.getAttribute('data-g-density'), d: getComputedStyle(list).getPropertyValue('--g-density').trim(),
      item: Math.round(item.getBoundingClientRect().height * 100) / 100, trig: Math.round(trig.getBoundingClientRect().height * 100) / 100 }
  })
  r.data.menu = m
  ok(m && m.open, '2.1 el menú de la barra se abre en la capa superior (:popover-open)', m)
  ok(m && m.inRegion === 'compact' && m.d === '0.75', '2.2 el menú hereda la región por el DOM (la capa superior no corta la herencia)', m)
  ok(m && near(m.item, 27) && near(m.item, m.trig), '2.3 la fila del menú mide como el disparador que lo abrió (27px)', m)
  await p.keyboard.press('Escape')
  await p.waitForTimeout(200)

  // 3 · Diálogo escrito dentro de la región
  await p.locator('[data-probe="compact-dialog-trigger"]').click()
  await p.waitForTimeout(400)
  const dg = await p.evaluate(() => {
    const dlg = document.querySelector('dialog.g-dialog[open], .g-dialog[open]')
    if (!dlg) return null
    const inp = dlg.querySelector('[data-probe="dialog-input"]')?.closest('.g-input')
    const box = inp?.querySelector('[data-g-tooltip-box]') || inp
    const btn = dlg.querySelector('[data-probe="dialog-btn"]')
    return { modal: dlg.matches(':modal'), d: getComputedStyle(dlg).getPropertyValue('--g-density').trim(), alias: getComputedStyle(dlg).getPropertyValue('--_d').trim(),
      input: Math.round(box.getBoundingClientRect().height * 100) / 100, btn: Math.round(btn.getBoundingClientRect().height * 100) / 100 }
  })
  r.data.dialog = dg
  ok(dg && dg.modal, '3.1 el diálogo abre como modal (capa superior)', dg)
  ok(dg && dg.d === '0.75' && dg.alias === '0.75' && near(dg.input, 27) && near(dg.btn, 27), '3.2 el diálogo escrito en la región la hereda: carcasa, campo y botón compactos', dg)
  await p.keyboard.press('Escape')
  await p.waitForTimeout(400)

  // 4 · Cambio en tiempo de ejecución: instantáneo, sin transición de alto
  const t = await p.evaluate(async () => {
    const reg = document.getElementById('dp-compact')
    const btn = document.querySelector('[data-probe="compact-btn"]')
    reg.setAttribute('data-g-density', 'default')
    const now = btn.getBoundingClientRect().height
    await new Promise((res) => setTimeout(res, 300))
    const later = btn.getBoundingClientRect().height
    const trans = getComputedStyle(btn).transitionProperty
    reg.setAttribute('data-g-density', 'compact')
    return { now, later, trans }
  })
  r.data.toggle = t
  ok(near(t.now, 36) && near(t.later, 36), '4.1 al cambiar la región, el alto cambia en el mismo cuadro (sin animar)', t)
  ok(!/height|block-size|padding|all/.test(t.trans), '4.2 GBtn no transiciona alto ni relleno', t.trans)

  ok(errs.length === 0, '1.0 sin errores de consola (modo A)', errs)
  await ctx.close()
}

// 5 · Modo B: la prop explícita es región para lo de dentro
{
  const { p, ctx, errs } = await open('?mode=b')
  const ab = await h(p, 'ab-btn')
  const exp = await h(p, 'compact-explicit-default')
  await p.locator('[data-probe="ab-menu-trigger"]').click()
  await p.waitForTimeout(250)
  const item = await p.evaluate(() => { const l = [...document.querySelectorAll('.g-menu__list')].find((x) => x.matches(':popover-open')); const i = l?.querySelector('[role="menuitem"]'); return i ? Math.round(i.getBoundingClientRect().height * 100) / 100 : null })
  r.data.b = { ab, exp, item }
  ok(near(ab, 27), '5.1 modo B: botón en la barra de la tabla con prop compact la sigue (27px)', ab)
  ok(near(item, 27), '5.2 modo B: el menú de esa barra también (27px)', item)
  ok(near(exp, 36), '5.3 modo B: la prop explícita default sigue ganando a la región', exp)
  ok(errs.length === 0, '5.0 sin errores de consola (modo B)', errs)
  await ctx.close()
}

// 6 · Global: clave del CLI y atributo en <html> (preferencia del usuario)
{
  const cases = [
    ['?cli=compact', 27, 'CLI compact: la página entera baja'],
    ['?root=compact', 27, '<html data-g-density="compact">: la página entera baja'],
    ['?cli=compact&root=comfortable', 31.5, '<html> gana al CLI (preferencia en tiempo de ejecución sobre el valor del build)'],
    ['?cli=compact&root=default', 36, '<html data-g-density="default"> devuelve el paso 1 aunque el CLI diga compact']
  ]
  r.data.global = {}
  for (const [qs, want, label] of cases) {
    const { p, ctx } = await open(qs)
    const v = await h(p, 'page-btn')
    const comf = await h(p, 'comf-btn')
    r.data.global[qs] = { page: v, comf }
    ok(near(v, want), `6 ${label}`, v)
    ok(near(comf, 31.5), `6 ${qs}: una región comfortable sigue mandando en su caja`, comf)
    await ctx.close()
  }
}

// 7 · Táctil: 44px y texto editable ≥ 16px ganan a la región compacta
{
  const { p, ctx } = await open('', { hasTouch: true, isMobile: true, viewport: { width: 390, height: 1800 } })
  const coarse = await p.evaluate(() => matchMedia('(pointer: coarse)').matches)
  const btn = await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('[data-probe="compact-btn"]'), '::after').blockSize))
  const btnBox = await h(p, 'compact-btn')
  const box = await inputBox(p, 'compact-input')
  const fs = await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('[data-probe="compact-input"]')).fontSize))
  const d = await dens(p, '#dp-compact')
  r.data.touch = { coarse, btnHit: btn, btnBox, box, fs, d }
  ok(coarse, '7.0 precondición: pointer: coarse', coarse)
  ok(d === '0.75', '7.1 la región sigue siendo compact en táctil', d)
  ok(btn >= 44 - 0.01 && box >= 44 - 0.01, '7.2 con puntero grueso, área táctil del botón (::after) y caja del campo ≥ 44px aunque la región sea compact', { btn, btnBox, box })
  ok(fs >= 16, '7.3 el texto editable mide ≥ 16px (pieza 1, #970) dentro de la región compact', fs)
  const scroll = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)
  ok(scroll, '7.4 a 390px sin desplazamiento horizontal de la página', scroll)
  await ctx.close()
}

// 8 · Sin JavaScript: marcado de servidor, la región basta
{
  const { p, ctx } = await open('', { javaScriptEnabled: false })
  const page = await h(p, 'ssr-page'), comp = await h(p, 'ssr-compact')
  r.data.ssr = { page, comp }
  ok(near(page, 36) && near(comp, 27), '8.1 sin JS: el botón de servidor en la región compacta mide 27px y el de página 36px', { page, comp })
  await ctx.close()
}

await browser.close()
console.log(JSON.stringify(r.data, null, 2))
console.log(`chromium: ${r.pass}/${r.pass + r.fail}`)
for (const f of r.fails) console.log('  FALLA ' + f)
process.exit(r.fail ? 1 : 0)
