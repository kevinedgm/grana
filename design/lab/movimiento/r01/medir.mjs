// Tabla única de movimiento · medida del comportamiento ACTUAL sobre dist (no aprueba ni suspende nada).
// Ejecutar: node design/lab/movimiento/r01/medir.mjs   (ENGINES=chromium,firefox,webkit por defecto; REDUCE=1 con movimiento reducido)
// Abre por file:// (no ocupa puertos). Requiere `npm run build`.
import { writeFileSync } from 'node:fs'
const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const url = new URL('./banco.html', import.meta.url).href
const engines = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const out = {}

const REC = `window.rec = (sel) => { const xs = []; let on = true; const t0 = performance.now();
  (function f() { const e = document.querySelector(sel); const c = e && getComputedStyle(e);
    xs.push({ t: Math.round(performance.now() - t0), o: c ? +(+c.opacity).toFixed(2) : null, d: c ? c.display : 'x', tr: c ? c.translate : null, sc: c ? c.scale : null, h: e ? Math.round(e.getBoundingClientRect().height) : 0 });
    if (on) requestAnimationFrame(f) })();
  return () => { on = false; return xs } }`
const span = (xs) => {
  const ch = xs.filter((x, i) => i && ['o', 'd', 'tr', 'sc', 'h'].some((k) => x[k] !== xs[i - 1][k]))
  if (!ch.length) return { ms: 0, cambios: 0 }
  return { ms: ch.at(-1).t - ch[0].t, cambios: ch.length, desplaza: xs.some((x) => x.tr && x.tr !== 'none' && x.tr !== '0px'), escala: xs.some((x) => x.sc && x.sc !== 'none' && x.sc !== '1') }
}

for (const engine of engines) {
  const b = await pw[engine].launch()
  const ctx = await b.newContext({ viewport: { width: 1200, height: 800 }, reducedMotion: process.env.REDUCE ? 'reduce' : 'no-preference' })
  const p = await ctx.newPage()
  p.setDefaultTimeout(3000)
  const errs = []
  p.on('pageerror', (e) => errs.push(String(e).slice(0, 160)))
  await p.goto(url)
  await p.waitForFunction(() => window.__ready)
  await p.evaluate(REC)
  const r = {}
  const panel = async (name, sel, open, close) => {
    try {
      await p.evaluate((s) => { window.__s = rec(s) }, sel); await open(); await p.waitForTimeout(450)
      const a = await p.evaluate(() => __s())
      await p.evaluate((s) => { window.__s = rec(s) }, sel); await close(); await p.waitForTimeout(450)
      const c = await p.evaluate(() => __s())
      r[name] = { abrir: span(a), cerrar: span(c) }
    } catch (e) { r[name] = { error: String(e).split('\n')[0].slice(0, 120) } }
    await p.mouse.move(2, 2); await p.waitForTimeout(100)
  }
  const esc = () => p.keyboard.press('Escape')
  await panel('GSelect', '.g-select__list', () => p.click('.g-select__control'), esc)
  await panel('GMenu', '.g-menu__list', () => p.click('.m-trigger'), esc)
  await panel('GHelper', '.g-helper__content', () => p.click('.g-helper__trigger'), esc)
  await panel('GDatePicker', '.g-datepicker__pop', () => p.click('.g-datepicker__field'), esc)
  await panel('GCombobox', '.g-combobox__popup', () => p.click('.g-combobox input'), esc)
  await panel('GTooltip', '.g-tooltip', () => p.hover('#tip'), () => p.mouse.move(2, 2))
  await panel('GDialog', '.g-dialog', () => p.click('#dlgopen'), esc)

  // Recorrer: de la fila 2 a la 4 con el ratón. Cuenta cuadros intermedios y qué recibe el foco
  const walk = async (name, open, rowSel, close, probe) => {
    try {
      await open(); await p.waitForTimeout(350)
      const rows = p.locator(rowSel)
      const a = await rows.nth(1).boundingBox(), z = await rows.nth(3).boundingBox()
      await p.mouse.move(a.x + 20, a.y + 8); await p.waitForTimeout(260)
      await p.evaluate(({ rowSel, probe }) => {
        window.__fr = []; let on = true; const t0 = performance.now()
        ;(function f() { const v = new Function('rowSel', probe)(rowSel); window.__fr.push({ t: Math.round(performance.now() - t0), v }); if (on) requestAnimationFrame(f) })()
        window.__off = () => { on = false; return window.__fr }
      }, { rowSel, probe })
      await p.mouse.move(z.x + 20, z.y + 8); await p.waitForTimeout(320)
      const fr = await p.evaluate(() => __off())
      const ch = fr.filter((x, i) => i && x.v !== fr[i - 1].v)
      r[name] = { estadosDistintos: new Set(fr.map((x) => x.v)).size, msDelCambio: ch.length ? ch.at(-1).t - ch[0].t : 0, foco: await p.evaluate(() => { const e = document.activeElement; return e.getAttribute('role') || e.tagName }), anilloConPuntero: await p.evaluate((s) => [...document.querySelectorAll(s)].some((e) => getComputedStyle(e).outlineStyle !== 'none'), rowSel) }
      await close(); await p.waitForTimeout(300)
    } catch (e) { r[name] = { error: String(e).split('\n')[0].slice(0, 120) } }
    await p.mouse.move(2, 2); await p.waitForTimeout(100)
  }
  const lit = `return [...document.querySelectorAll(rowSel)].map((e) => { const c = getComputedStyle(e); return c.backgroundColor === 'rgba(0, 0, 0, 0)' ? 0 : 1 }).join('')`
  await walk('recorrer.GSelect', () => p.click('.g-select__control'), '.g-select__option', esc, lit)
  await walk('recorrer.GCombobox', () => p.click('.g-combobox input'), '.g-combobox__option', esc, `return [...document.querySelectorAll(rowSel)].map((e) => e.classList.contains('is-active') ? 1 : 0).join('')`)
  await walk('recorrer.GMenu', () => p.click('.m-trigger'), '.g-menu__list [role^="menuitem"]', esc, `return getComputedStyle(document.querySelector('.g-menu__highlight')).translate`)
  r.errores = errs.slice(0, 3)
  out[engine] = r
  await b.close()
}
console.log(JSON.stringify(out))
writeFileSync(new URL(process.env.REDUCE ? './medir-reducido.json' : './medir.json', import.meta.url), JSON.stringify(out, null, 1) + '\n')
