// GCombobox multiple · compuerta de rendimiento (design/contracts/combobox.md «Fase 2 · Rendimiento», DECISIONS.md #428):
// abrir con 500 opciones locales y 40 elegidas, hasta el segundo cuadro, < 150 ms en Chromium y Firefox y < 200 ms en
// WebKit, con «Elegidas» (A, #big) y con la cesta (C, #big-c), sobre el COMPONENTE REAL en su banco ligero
// (packages/vue/playground/combobox-multiple.html): en el playground completo, showModal de la superficie (un GDialog
// real) recalcula el estilo de miles de elementos de las demás secciones (57 % del tiempo medido en Chromium) y esa cifra
// es de la página, no del componente.
// Como la de la voz F2 (#264), se exige SOLO con un worker (con varios, la medida no es repetible y solo se anota):
//   GRANA_PW_PORT=4210 npx playwright test tests/combobox-multiple-perf.spec.mjs --workers=1
// Tres aperturas por caso (la primera en frío); se exige la mediana y se anotan las tres.
import { test, expect } from '@playwright/test'
import { watchConsole } from './combobox-helpers.mjs'

const PAGE = '/packages/vue/playground/combobox-multiple.html'
const LIMIT = { chromium: 150, firefox: 150, webkit: 200 }

for (const [id, label, key] of [['big', 'A · «Elegidas»', 'ArrowDown'], ['big-c', 'C · la cesta', 'Enter']]) {
  test(`abrir con 500 opciones y 40 elegidas (${label}) por debajo del umbral`, async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(PAGE)
    await page.waitForSelector('#' + id)
    await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
    await page.evaluate(() => document.fonts.ready)
    await page.locator('#' + id).scrollIntoViewIfNeeded()
    const runs = []
    for (let n = 0; n < 3; n++) {
      await page.focus('#' + id)
      await page.waitForTimeout(150)
      const r = await page.evaluate(([id, key]) => new Promise((resolve) => {
        const i = document.getElementById(id)
        const t0 = performance.now()
        i.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
        requestAnimationFrame(() => requestAnimationFrame(() => resolve({
          ms: performance.now() - t0,
          rows: document.querySelectorAll(`#${id}-list [role=option]`).length,
          basket: document.querySelectorAll(`#${id}-surface .g-combobox__basket .g-combobox__row`).length
        })))
      }), [id, key])
      runs.push(r)
      await page.keyboard.press('Escape')
      await page.waitForTimeout(250)
      if (id === 'big') await page.keyboard.press('Escape')
    }
    // Lo que se pinta: «Elegidas» con 12 + «Ver los 40» + 50 del catálogo (A); 50 del catálogo y 12 renglones en la cesta (C)
    if (id === 'big') expect(runs[0].rows).toBe(12 + 1 + 50 + 1) // + «Mostrar más»
    else {
      expect(runs[0].rows).toBe(50 + 1)
      expect(runs[0].basket).toBe(12)
    }
    const ms = runs.map((r) => Math.round(r.ms))
    const median = [...ms].sort((a, b) => a - b)[1]
    const gate = test.info().config.workers === 1
    test.info().annotations.push({ type: 'rendimiento', description: `${browserName} ${label}: ${ms.join(' / ')} ms (mediana ${median}; umbral ${LIMIT[browserName]} ms)${gate ? ' (exigido)' : ' (registrado: varios workers)'}` })
    console.log(`[multiple 500/40 ${label}] ${browserName}: ${ms.join(' / ')} ms (mediana ${median})`)
    if (gate) expect(median, `mediana ${median} ms (${ms.join(' / ')})`).toBeLessThan(LIMIT[browserName])
    expect(errs, errs.join('\n')).toEqual([])
  })
}
