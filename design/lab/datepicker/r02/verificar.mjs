// Verificación de la ronda r02 de GDatePicker (kiwi): prueba el comportamiento propuesto en index.html (no GDatePicker.vue)
// sobre los tokens y el CSS reales de dist. Ejecutar: node design/lab/datepicker/r02/verificar.mjs
// ENGINES=chromium,firefox,webkit por defecto; VERBOSE=1 lista cada comprobación. Abre por file:// (no ocupa puertos).
const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const base = new URL('./index.html', import.meta.url).href
const engines = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
let total = 0; let totalPass = 0

for (const engine of engines) {
  const browser = await pw[engine].launch()
  let pass = 0
  const fails = []; const errs = []
  const ok = (c, m) => { if (c) pass++; else fails.push(m); if (process.env.VERBOSE) console.log(engine, c ? 'ok ' : 'NO ', m) }

  for (const q of ['', '?motion=reduce', '?theme=dark', '?lang=en']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    page.on('pageerror', (e) => errs.push(String(e)))
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
    await page.goto(base + q)
    await page.waitForTimeout(150)
    const tag = q || '(defecto)'

    // ---------- Comunes: mínimos y estructura ----------
    const common = await page.evaluate(() => {
      const r = {}
      const roots = [...document.querySelectorAll('.g-datepicker')]
      r.grids = roots.map((root) => [[...root.querySelectorAll('[role="grid"]')].reduce((n, g) => n + g.querySelectorAll('[tabindex="0"]').length, 0)])
      r.minText = Math.min(...[...document.querySelectorAll('.g-datepicker *')].filter((e) => e.childNodes.length && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && e.getBoundingClientRect().width > 1).map((e) => parseFloat(getComputedStyle(e).fontSize)))
      r.minTarget = Math.min(...[...document.querySelectorAll('.g-datepicker button')].filter((b) => !b.hidden && b.getBoundingClientRect().width > 0).map((b) => { const x = b.getBoundingClientRect(); return Math.min(x.width, x.height) }))
      r.glyphs = [...document.querySelectorAll('.g-datepicker')].some((e) => /[✓▲▼●›‹→←⚠]/.test(e.textContent))
      r.svgNotLucide = [...document.querySelectorAll('.g-datepicker svg')].filter((s) => !s.classList.contains('g-icon')).length
      r.dayNames = [...document.querySelectorAll('.g-datepicker__day')].every((b) => (b.getAttribute('aria-label') || '').length > 8)
      return r
    })
    ok(common.grids.every((g) => g.every((n) => n === 1)), `${tag}: cada superficie con un solo tabstop en sus rejillas`)
    ok(common.minText >= 12, `${tag}: texto ≥ 12 px (mín ${common.minText})`)
    ok(common.minTarget >= 24, `${tag}: objetivos ≥ 24 px (mín ${common.minTarget})`)
    ok(!common.glyphs, `${tag}: sin caracteres pictográficos`)
    ok(common.svgNotLucide === 0, `${tag}: solo iconos Lucide (g-icon)`)
    ok(common.dayNames, `${tag}: cada día con nombre completo`)

    // ---------- Base: dos meses hoy, uno en la propuesta; franja que sigue ----------
    const base1 = await page.evaluate(() => {
      const two = document.querySelector('[data-demo="base2"] .g-datepicker')
      const one = document.querySelector('[data-demo="base1"] .g-datepicker')
      return {
        twoMonths: two.querySelectorAll('.g-datepicker__month').length,
        oneMonths: one.querySelectorAll('.g-datepicker__month').length,
        openEnd: one.querySelectorAll('td.k-open-end').length,
        oneW: one.querySelector('.g-datepicker__surface').getBoundingClientRect().width,
        twoW: two.querySelector('.g-datepicker__surface').getBoundingClientRect().width
      }
    })
    ok(base1.twoMonths === 2 && base1.oneMonths === 1, `${tag}: hoy dos meses, propuesta uno`)
    ok(base1.openEnd === 1, `${tag}: la franja que sigue se abre en el borde (un extremo abierto)`)
    ok(base1.oneW < base1.twoW / 1.6, `${tag}: un mes ocupa menos de 1/1,6 de dos (${Math.round(base1.oneW)} / ${Math.round(base1.twoW)})`)

    // ---------- Compacto ----------
    const sizes = await page.evaluate(() => {
      const s = (k) => document.querySelector(`[data-demo="${k}"] .g-datepicker__surface`).getBoundingClientRect()
      const d = (k) => document.querySelector(`[data-demo="${k}"] .g-datepicker__day`).getBoundingClientRect().width
      return { base1: s('base1').width, A: s('A').width, Ah: s('A').height, dayA: d('A'), dayBase: d('base1') }
    })
    ok(sizes.A < sizes.base1 * 0.85, `${tag}: compacto más estrecho que el mes actual (${Math.round(sizes.A)} < ${Math.round(sizes.base1)})`)
    ok(sizes.dayA >= 24 && sizes.dayA < sizes.dayBase, `${tag}: día compacto ≥ 24 y menor que el actual (${sizes.dayA})`)

    // ---------- A · Zoom de escala ----------
    const A = '[data-demo="A"]'
    const hBefore = await page.locator(`${A} .g-datepicker__surface`).evaluate((e) => e.getBoundingClientRect().height)
    await page.locator(`${A} [data-k="pa-m"]`).click()
    await page.waitForTimeout(250)
    const aMonths = await page.evaluate((A) => {
      const r = document.querySelector(A)
      return { cells: r.querySelectorAll('.pa-grid [role="gridcell"]').length, focus: document.activeElement?.dataset?.m, h: r.querySelector('.g-datepicker__surface').getBoundingClientRect().height }
    }, A)
    ok(aMonths.cells === 12, `${tag}: A abre doce meses`)
    ok(aMonths.focus === '10', `${tag}: A, el foco va al mes mostrado (noviembre)`)
    ok(Math.abs(aMonths.h - hBefore) < 1, `${tag}: A, el panel no cambia de alto al abrir los meses (Δ ${(aMonths.h - hBefore).toFixed(2)})`)
    await page.keyboard.press('ArrowDown') // feb del año siguiente? nov(10)+3 = 13 → ene 2027... comprobamos el resultado
    await page.keyboard.press('Enter')
    await page.waitForTimeout(250)
    const aBack = await page.evaluate((A) => ({ f: document.activeElement?.dataset?.date, title: document.querySelector(A + ' .g-datepicker__title').textContent.trim() }), A)
    ok(aBack.f === '2027-02-18', `${tag}: A, ↓ y Enter llevan a febrero de 2027 con el foco en el mismo día (${aBack.f})`)
    // Año escrito
    await page.locator(`${A} [data-k="pa-y"]`).click()
    await page.waitForTimeout(250)
    for (const d of '1985') await page.keyboard.press(d)
    const y85 = await page.evaluate(() => document.activeElement?.dataset?.y)
    ok(y85 === '1985', `${tag}: A, escribir 1985 en los años lleva el foco a 1985 (${y85})`)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(250)
    const afterYear = await page.evaluate((A) => ({ m: document.activeElement?.dataset?.m, cells: document.querySelectorAll(A + ' .pa-grid [role="gridcell"]').length, t: document.querySelector(A + ' .g-datepicker__title').textContent.trim() }), A)
    ok(afterYear.cells === 12 && afterYear.t.includes('1985'), `${tag}: A, elegir el año baja a los meses de 1985`)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(100)
    const esc = await page.evaluate(() => document.activeElement?.dataset?.k)
    ok(esc === 'pa-m', `${tag}: A, Esc sube a los días y devuelve el foco al botón del mes (${esc})`)
    // Animación: con movimiento reducido solo opacidad
    if (q === '?motion=reduce') {
      await page.locator(`${A} [data-k="pa-m"]`).click()
      const tr = await page.evaluate((A) => { const el = document.querySelector(A + ' .k-stage > *'); const a = el.getAnimations()[0]; return a ? JSON.stringify(a.effect.getKeyframes().map((k) => k.transform || '')) : 'none' }, A)
      ok(!/scale/.test(tr), `${tag}: A, con movimiento reducido no hay escala (${tr})`)
      await page.keyboard.press('Escape')
    } else if (!q) {
      await page.locator(`${A} [data-k="pa-m"]`).click()
      const tr = await page.evaluate((A) => { const el = document.querySelector(A + ' .k-stage > *'); const a = el.getAnimations()[0]; return a ? { d: a.effect.getTiming().duration, o: el.style.transformOrigin } : null }, A)
      ok(tr && tr.d >= 150 && tr.d <= 170 && tr.o !== '', `${tag}: A, el zoom dura press (160 ms) y nace en la pieza (${JSON.stringify(tr)})`)
      await page.keyboard.press('Escape')
    }

    // ---------- B · Regla del tiempo ----------
    const B = '[data-demo="B"]'
    await page.locator(`${B} .pb-lane--m [aria-checked="true"]`).focus()
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(100)
    const b1 = await page.evaluate((B) => ({ checked: document.querySelector(B + ' .pb-lane--m [aria-checked="true"]').dataset.m, focus: document.activeElement?.dataset?.m, title: document.querySelector(B + ' h3').textContent, band: document.querySelectorAll(B + ' .pb-lane--m .is-band').length }), B)
    ok(b1.checked === '11' && b1.focus === '11', `${tag}: B, → en la regla de meses elige diciembre y lo enfoca`)
    ok(/dic|Dec|Dez/i.test(b1.title), `${tag}: B, la rejilla sigue a la regla (${b1.title})`)
    ok(b1.band === 2, `${tag}: B, la franja del rango se pinta sobre noviembre y diciembre en la regla (${b1.band})`)
    await page.locator(`${B} .pb-lane--y [aria-checked="true"]`).focus()
    await page.keyboard.press('PageUp')
    await page.waitForTimeout(100)
    const b2 = await page.evaluate((B) => document.querySelector(B + ' .pb-lane--y [aria-checked="true"]').dataset.y, B)
    ok(b2 === '2016', `${tag}: B, RePág en la regla de años salta diez años (${b2})`)
    const lanes = await page.evaluate((B) => [...document.querySelectorAll(B + ' [role="radiogroup"]')].map((g) => g.querySelectorAll('[tabindex="0"]').length), B)
    ok(lanes.length === 2 && lanes.every((n) => n === 1), `${tag}: B, dos radiogroup con un tabstop cada uno`)

    // ---------- C · El salto dicho ----------
    const C = '[data-demo="C"]'
    await page.locator(`${C} .g-datepicker__day[tabindex="0"]`).focus()
    await page.keyboard.type('mar 2031')
    await page.waitForTimeout(80)
    const c1 = await page.evaluate((C) => ({ active: document.activeElement?.classList.contains('pc-input'), val: document.activeElement?.value, read: document.querySelector(C + ' .pc-reading').textContent }), C)
    ok(c1.active && c1.val === 'mar 2031', `${tag}: C, escribir desde los días salta al título sin perder la primera letra (${c1.val})`)
    if (!q || q === '?motion=reduce' || q === '?theme=dark') ok(/marzo de 2031/.test(c1.read), `${tag}: C, la lectura dice «marzo de 2031» (${c1.read})`)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(80)
    const c2 = await page.evaluate(() => document.activeElement?.dataset?.date)
    ok(c2 === '2031-03-18', `${tag}: C, Intro deja el foco en el mismo día de marzo de 2031 (${c2})`)
    const parse = await page.evaluate(() => {
      const p = window.kiwi.parseJump; const cur = { y: 2026, m: 10 }
      return [p('85', cur), p('1985', cur), p('3/27', cur), p('12', cur), p('dic', cur), p('xyz', cur)]
    })
    if (!q || q === '?motion=reduce' || q === '?theme=dark') {
      ok(parse[0].y === 1985 && parse[1].y === 1985, `${tag}: C, «85» y «1985» → 1985`)
      ok(parse[2].y === 2027 && parse[2].m === 2, `${tag}: C, «3/27» → marzo de 2027`)
      ok(parse[3].m === 11 && parse[3].y === 2026, `${tag}: C, «12» → diciembre del año a la vista`)
      ok(parse[4].m === 11, `${tag}: C, «dic» → diciembre`)
      ok(parse[5] === null, `${tag}: C, texto sin sentido no salta`)
    }
    // Esc revierte
    await page.keyboard.type('2040')
    await page.keyboard.press('Escape')
    const c3 = await page.evaluate((C) => document.querySelector(C + ' h3').textContent, C)
    ok(/2031/.test(c3), `${tag}: C, Esc deshace el salto sin confirmar (${c3})`)

    await page.close()
  }

  // ---------- 320 px: compacto con puntero fino a 320 de visor; táctil dentro de una hoja de 320 ----------
  const page = await browser.newPage({ viewport: { width: 320, height: 800 } })
  await page.goto(base)
  await page.waitForTimeout(150)
  const fine = await page.evaluate(() => ['A', 'B', 'C'].map((k) => { const d = document.querySelector(`[data-demo="${k}"]`); return Math.round(d.querySelector('.g-datepicker__surface').getBoundingClientRect().right - d.getBoundingClientRect().right) }))
  ok(fine.every((x) => x <= 0), `320: el compacto cabe sin desbordar su sección (${fine})`)
  await page.setViewportSize({ width: 420, height: 800 })
  for (const k of ['A', 'B', 'C']) {
    await page.locator(`[data-demo="${k}"] [data-opt="touch"]`).check()
    await page.locator(`[data-demo="${k}"] [data-opt="narrow"]`).check()
  }
  await page.waitForTimeout(150)
  const narrow = await page.evaluate(() => ({
    days: ['A', 'B', 'C'].map((k) => document.querySelector(`[data-demo="${k}"] .g-datepicker__day`).getBoundingClientRect().width),
    widths: ['A', 'B', 'C'].map((k) => document.querySelector(`[data-demo="${k}"] .g-datepicker__surface`).getBoundingClientRect().width)
  }))
  ok(narrow.days.every((d) => d >= 44), `hoja de 320 táctil: días de 44 px (${narrow.days.map(Math.round)})`)
  ok(narrow.widths.every((w) => w <= 320), `hoja de 320 táctil: las superficies caben (${narrow.widths.map(Math.round)})`)
  await page.close()

  await browser.close()
  ok(errs.length === 0, `sin errores de consola (${errs.slice(0, 3).join(' | ')})`)
  const n = pass + fails.length
  total += n; totalPass += pass
  console.log(`${engine}: ${pass}/${n}`)
  for (const f of fails) console.log('  NO', f)
}
console.log(`Total: ${totalPass}/${total}`)
