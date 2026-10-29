// Verificación de la ronda r01 · pieza 3 (el texto sigue la densidad, kiwi). Mide el prototipo: componentes reales de dist/
// + proto/*.css generados por gen-proto.mjs desde el CLI real.
// Uso: node design/lab/density-text/r01/gen-proto.mjs ; python3 -m http.server 4212 -d /home/user/grana &
//      cp design/lab/density-text/r01/verificar.mjs design/lab/theme-playground/dt-verificar.mjs
//      (cd design/lab/theme-playground && node dt-verificar.mjs) ; rm design/lab/theme-playground/dt-verificar.mjs
// Solo Chromium (encargo). Lo que NO demuestra: el CSS definitivo de coco ni la salida definitiva del CLI de bruno (las
// reglas son del prototipo), Firefox/WebKit, lector de pantalla, iOS real (la pieza 1 se mide con hasTouch + isMobile).
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const ESC_PATH = [join(HERE, 'proto/escala.json'), join(HERE, '../density-text/r01/proto/escala.json')].find((p) => { try { readFileSync(p); return true } catch { return false } })
const ESC = Object.fromEntries(JSON.parse(readFileSync(ESC_PATH, 'utf8')).map((t) => [t.id, t]))
const BASE = 'http://localhost:4212/design/lab/density-text/r01/index.html'
const r = { pass: 0, fail: 0, fails: [] }
const ok = (c, label, info) => { if (c) r.pass++; else { r.fail++; r.fails.push(label + (info !== undefined ? ' ' + JSON.stringify(info) : '')) } }
const near = (a, b, t = 0.06) => a != null && Math.abs(a - b) <= t
const browser = await chromium.launch()

async function open (q = '', ctxOpts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1480, height: 2400 }, ...ctxOpts })
  const p = await ctx.newPage()
  const errs = []
  p.on('pageerror', (e) => errs.push(String(e)))
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  await p.route(/unpkg\.com\/vue/, (route) => route.fulfill({ path: join(HERE, '../../../../node_modules/vue/dist/vue.global.js') }))
  await p.goto(BASE + q)
  await p.waitForSelector('.g-table__row')
  await p.waitForTimeout(400)
  return { p, ctx, errs }
}
// Texto de una parte de una sonda: tamaño, renglón, peso y caja
const t = (p, probe, sel) => p.evaluate(([probe, sel]) => {
  let el = document.querySelector(`[data-probe="${probe}"]`)
  if (!el) return null
  const root = el
  if (sel) el = el.matches(sel) ? el : (el.querySelector(sel) || el.closest('.g-input,.g-select,.g-card,.g-widget')?.querySelector(sel))
  if (!el) return null
  const cs = getComputedStyle(el)
  return { fs: parseFloat(cs.fontSize), lh: parseFloat(cs.lineHeight) || null, fw: Number(cs.fontWeight), h: root.getBoundingClientRect().height }
}, [probe, sel])
const fieldBox = (p, probe) => p.evaluate((probe) => {
  const el = document.querySelector(`[data-probe="${probe}"]`)
  const root = el?.closest('.g-input') || el
  const box = root?.querySelector('[data-g-tooltip-box]') || root
  const f = root?.querySelector('input')
  return { h: box.getBoundingClientRect().height, fs: f ? parseFloat(getComputedStyle(f).fontSize) : null }
}, probe)

const S = ESC.defecto
// 1 · Tema por defecto: los tres pasos y A
{
  const { p, ctx, errs } = await open('')
  for (const [k, step, name] of [['def', S.base, 'default'], ['comf', S.base, 'comfortable'], ['cb', S.B, 'compact B'], ['ca', S.A, 'compact A']]) {
    const btn = await t(p, `${k}-btn`, '.g-btn__label')
    ok(near(btn.fs, step['body-sm'].size) && near(btn.lh, step['body-sm'].line), `1.${k} ${name}: GBtn md = body-sm del paso`, btn)
    const lab = await t(p, `${k}-input`, '.g-input__label')
    ok(near(lab.fs, step['body-sm'].size) && lab.fw === 500, `1.${k} ${name}: etiqueta de campo body-sm 500`, lab)
    const hint = await t(p, `${k}-input`, '.g-input__hint')
    ok(near(hint.fs, step.caption.size), `1.${k} ${name}: ayuda caption`, hint)
    const field = await fieldBox(p, `${k}-input`)
    ok(near(field.fs, step['body-sm'].size), `1.${k} ${name}: texto editable body-sm (escritorio)`, field)
    const card = await t(p, `${k}-card`, '.g-card__title')
    ok(near(card.fs, step.body.size) && near(card.lh, step.body.line) && card.fw === 600, `1.${k} ${name}: título de GCard body 600`, card)
    const sec = await t(p, `${k}-section`, '.g-form-section__title')
    ok(near(sec.fs, step.body.size), `1.${k} ${name}: título de GFormSection body`, sec)
    const wt = await t(p, `${k}-widget`, '.g-widget__title')
    ok(near(wt.fs, step['body-sm'].size) && wt.fs > step.caption.size - 0.01, `1.${k} ${name}: título de GWidget body-sm (≥ caption)`, wt)
    const cell = await t(p, `${k}-table`, '.g-table__title'); const sub = await t(p, `${k}-table`, '.g-table__subtitle')
    ok(near(cell.fs, step['body-sm'].size) && near(sub.fs, step.caption.size), `1.${k} ${name}: celda título/subtítulo`, [cell, sub])
    const mv = await t(p, `${k}-widget`, '.g-metric__value')
    ok(near(mv.fs, step.title.size), `1.${k} ${name}: valor de GMetric title (sigue la región)`, mv)
    const para = await t(p, `${k}-para`)
    ok(near(para.fs, step['body-sm'].size) && near(para.lh, step['body-sm'].line), `1.${k} ${name}: texto propio de la aplicación sigue la región`, para)
    // Piso de 12 en todo el texto de la región
    const min = await p.evaluate((k) => {
      const reg = document.querySelector(`[data-probe="${k}-card"]`).closest('.dt-region')
      let m = 99
      for (const el of reg.querySelectorAll('*')) if ([...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) m = Math.min(m, parseFloat(getComputedStyle(el).fontSize))
      return m
    }, k)
    ok(min >= 12 - 0.01, `1.${k} ${name}: ningún texto < 12 px`, min)
    // Caja: texto centrado y sin desbordar en el botón y la celda
    const fit = await p.evaluate((k) => {
      const b = document.querySelector(`[data-probe="${k}-btn"]`)
      const l = b.querySelector('.g-btn__label').getBoundingClientRect(), bb = b.getBoundingClientRect()
      return { top: l.top - bb.top, bottom: bb.bottom - l.bottom, over: b.scrollHeight > b.clientHeight + 1 }
    }, k)
    ok(Math.abs(fit.top - fit.bottom) <= 1 && !fit.over, `1.${k} ${name}: etiqueta centrada en la caja del botón, sin desbordar`, fit)
  }
  const bh = { def: (await t(p, 'def-btn')).h, comf: (await t(p, 'comf-btn')).h, cb: (await t(p, 'cb-btn')).h, ca: (await t(p, 'ca-btn')).h }
  ok(near(bh.def, 36, 0.3) && near(bh.comf, 31.5, 0.3) && near(bh.cb, 27, 0.3) && near(bh.ca, 27, 0.3), '1.9 cajas de la pieza 2 sin cambio (36 · 31,5 · 27)', bh)
  // Jerarquía estricta en compacto B: diálogo > sección > etiqueta > ayuda; ninguna pareja colapsa
  const chainB = [S.B['title-sm'].size, S.B.body.size, S.B['body-sm'].size, S.B.caption.size]
  ok(chainB.every((v, i) => i === 0 || chainB[i - 1] - v >= 0.9), '1.10 B: cadena del diálogo con cuatro tamaños distintos (≥ 0,9 px)', chainB)
  // Ritmo compartido: mismo paso de renglón en default y compacto (B) para body-sm y body
  const rd = await t(p, 'rhythm-default'), rc = await t(p, 'rhythm-compact')
  ok(near(rd.lh, rc.lh) && near(rd.lh, 20), '1.11 ritmo: el párrafo body-sm tiene el mismo renglón (20) en default y compacto', [rd, rc])
  ok(S.B.body.line === S.base.body.line && S.A.body.line !== S.base.body.line, '1.12 ritmo: body conserva el renglón con B y lo cambia con A', [S.base.body.line, S.B.body.line, S.A.body.line])
  // Región más cercana y prop
  const no = await t(p, 'nest-outer-btn', '.g-btn__label'), ni = await t(p, 'nest-inner-btn', '.g-btn__label'), npd = await t(p, 'nest-prop-default', '.g-btn__label')
  ok(near(no.fs, S.B['body-sm'].size) && near(ni.fs, 14) && near(npd.fs, 14), '2.1 anidación: default dentro de compacta = 14; prop default gana = 14', [no, ni, npd])
  ok(near((await t(p, 'nest-prop-default')).h, 36, 0.3), '2.2 prop default en región compacta: caja 36', null)
  const isl = await t(p, 'island-text')
  ok(near(isl.fs, 14), '2.3 raíz fija en default (avisos, isla, voz) Δ0', isl)
  const pb = await t(p, 'page-btn', '.g-btn__label'), ppc = await t(p, 'page-prop-compact', '.g-btn__label')
  ok(near(pb.fs, 14) && near(ppc.fs, S.B['body-sm'].size) && near((await t(p, 'page-prop-compact')).h, 27, 0.3), '2.4 prop compact en página normal: caja 27 y texto compacto', [pb, ppc])
  // Menú abierto desde la región compacta: hereda texto y alto
  await p.locator('[data-probe="cb-menu-trigger"]').click(); await p.waitForTimeout(250)
  const m = await p.evaluate(() => {
    const list = [...document.querySelectorAll('.g-menu__list')].find((l) => l.matches(':popover-open'))
    const item = list?.querySelector('[role="menuitem"]')
    const trig = document.querySelector('[data-probe="cb-menu-trigger"]')
    return item ? { fs: parseFloat(getComputedStyle(item).fontSize), h: item.getBoundingClientRect().height, trig: trig.getBoundingClientRect().height } : null
  })
  ok(m && near(m.fs, S.B['body-sm'].size) && Math.abs(m.h - m.trig) <= 0.6, '2.5 GMenu en la capa superior: texto compacto y fila = disparador', m)
  await p.keyboard.press('Escape'); await p.waitForTimeout(150)
  // Diálogo escrito en la región compacta (hereda, #977)
  await p.locator('[data-probe="cb-dialog-trigger"]').click(); await p.waitForTimeout(400)
  const d = await p.evaluate(() => {
    const dlg = [...document.querySelectorAll('dialog[open]')][0]
    const ti = dlg?.querySelector('.g-dialog__title'), de = dlg?.querySelector('.g-dialog__description')
    return ti ? { title: parseFloat(getComputedStyle(ti).fontSize), desc: parseFloat(getComputedStyle(de).fontSize) } : null
  })
  ok(d && near(d.title, S.B['title-sm'].size) && near(d.desc, S.B['body-sm'].size), '2.6 GDialog heredado: título title-sm y descripción body-sm compactos', d)
  ok(errs.length === 0, '2.7 sin errores de consola', errs)
  await ctx.close()
}
// 3 · Sin reglas (dist de hoy): Δ0 frente a hoy en todas las regiones (comprobación de que el prototipo es lo único que cambia)
{
  const { p, ctx } = await open('?sin=1')
  const a = await t(p, 'cb-btn', '.g-btn__label'), b = await t(p, 'def-btn', '.g-btn__label')
  ok(near(a.fs, 14) && near(b.fs, 14), '3.1 sin reglas: compacto conserva 14 (hoy: «copia apretada»)', [a, b])
  await ctx.close()
}
// 4 · <html data-g-density="compact"> con el tema por defecto y con un tema del CLI (M1) y sin sus reglas (fallo)
{
  let { p, ctx } = await open('?root=compact')
  const x = await t(p, 'page-btn', '.g-btn__label')
  ok(near(x.fs, S.B['body-sm'].size), '4.1 <html compact>, tema por defecto: la página toma el texto compacto', x)
  await ctx.close()
  for (const id of ['t14', 't18']) {
    const T = ESC[id]
    ;({ p, ctx } = await open(`?tema=${id}&root=compact`))
    const y = await t(p, 'page-btn', '.g-btn__label'), z = await t(p, 'cb-card', '.g-card__title'), w = await t(p, 'def-btn', '.g-btn__label')
    ok(near(y.fs, T.B['body-sm'].size) && near(z.fs, T.B.body.size) && near(w.fs, T.base['body-sm'].size), `4.${id} tema CLI con reglas (M1): <html compact> y regiones con los valores de SU tema`, [y, z, w])
    const min = await p.evaluate(() => Math.min(...[...document.querySelectorAll('.dt-region *')].filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())).map((el) => parseFloat(getComputedStyle(el).fontSize))))
    ok(min >= 11.99, `4.${id} ningún texto < 12 px`, min)
    await ctx.close()
    ;({ p, ctx } = await open(`?tema=${id}&solo=1&root=compact`))
    const y2 = await t(p, 'page-btn', '.g-btn__label'), z2 = await t(p, 'cb-btn', '.g-btn__label')
    // Evidencia del fallo esperado: sin reglas propias, <html> no baja (el :root sin capa del CLI gana) y la región toma valores de otro tema
    ok(near(y2.fs, T.base['body-sm'].size) && near(z2.fs, S.B['body-sm'].size) && !near(z2.fs, T.B['body-sm'].size), `4.${id} solo defaults (fallo esperado): <html> no baja y la región usa valores del tema por defecto`, [y2, z2])
    await ctx.close()
  }
}
// 5 · Clave density "compact" del CLI
{
  let { p, ctx } = await open('?clave=compact')
  const a = await t(p, 'page-btn', '.g-btn__label'), b = await t(p, 'nest-inner-btn', '.g-btn__label')
  ok(near(a.fs, S.B['body-sm'].size) && near(b.fs, 14), '5.1 clave compact: página compacta; región default dentro = 14', [a, b])
  await ctx.close()
  ;({ p, ctx } = await open('?clave=compact&root=default'))
  const c = await t(p, 'page-btn', '.g-btn__label')
  ok(near(c.fs, 14), '5.2 clave compact + <html default>: la preferencia del usuario gana (14)', c)
  await ctx.close()
}
// 6 · Táctil: P2 y pieza 1
{
  const { p, ctx } = await open('', { hasTouch: true, isMobile: true, viewport: { width: 1280, height: 2400 } })
  const coarse = await p.evaluate(() => matchMedia('(pointer: coarse)').matches)
  ok(coarse, '6.0 precondición pointer: coarse', coarse)
  const a = await t(p, 'cb-btn', '.g-btn__label'), lab = await t(p, 'cb-input', '.g-input__label')
  ok(near(a.fs, 14) && near(lab.fs, 14), '6.1 P2: región compacta cede al dedo, texto del paso 1', [a, lab])
  const f = await fieldBox(p, 'cb-input')
  ok(near(f.fs, 16), '6.2 pieza 1: texto editable 16 en la región', f)
  const pc = await t(p, 'page-prop-compact', '.g-btn__label')
  ok(near(pc.fs, S.B['body-sm'].size), '6.3 prop compact explícita no cede: texto compacto', pc)
  const pci = await fieldBox(p, 'page-prop-compact-input')
  ok(near(pci.fs, 16) && pci.h >= 43.9, '6.4 GInput density="compact" en táctil: texto editable 16 y caja 44', pci)
  await ctx.close()
}
await browser.close()
console.log(`density-text r01 · ${r.pass}/${r.pass + r.fail}`)
if (r.fail) { console.log(r.fails.join('\n')); process.exitCode = 1 }
