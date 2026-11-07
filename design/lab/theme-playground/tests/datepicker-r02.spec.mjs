// GDatePicker r02 (datepicker.md §«Un mes por defecto y salto a mes y año», DECISIONS #1020 a #1029): vistas de meses y
// años, zoom del cambio de nivel, compacto, hoja a 320 px, Esc dentro de un GDialog y rendimiento con props en línea.
// Sobre los componentes REALES de dist (banco de movimiento + una aplicación propia). Tres motores; lo táctil, en Chromium.
import { test, expect } from '@playwright/test'
import { watchConsole } from './glide-helpers.mjs'

const PAGE = '/design/lab/movimiento/r01/banco.html'
const LABELS = {
  prev: 'Mes anterior', next: 'Mes siguiente', dialog: 'Elegir fecha', close: 'Cerrar', today: 'hoy', selected: 'elegida', unavailable: 'no disponible',
  chooseMonth: 'elegir mes', chooseYear: 'elegir año', prevYear: 'Año anterior', nextYear: 'Año siguiente', prevYears: 'Doce años antes', nextYears: 'Doce años después',
  viewMonths: 'Meses de {year}', viewYears: 'Años de {from} a {to}', typeYear: 'Escribe un año', current: 'actual', hasValue: 'contiene lo elegido'
}

async function mount(page, { viewport = { width: 1280, height: 1000 } } = {}) {
  await page.setViewportSize(viewport)
  await page.goto(PAGE)
  await page.waitForFunction(() => window.__ready)
  await page.evaluate((labels) => {
    const { createApp, h, reactive } = Vue
    const G = Grana
    const st = reactive({ a: '2026-10-20', b: '2026-10-20', c: '2026-10-20', d: '2026-10-20', dlg: false, tick: 0 })
    window.__st = st
    const el = document.createElement('div')
    el.id = 'r02'
    el.style.cssText = 'display:flex;gap:40px;align-items:flex-start;flex-wrap:wrap;margin-block-start:40px'
    document.body.prepend(el)
    const dp = (id, props) => h('div', { id, style: 'max-inline-size:100%' }, [h(G.GDatePicker, { locale: 'es', firstDay: 1, labels, ...props })])
    createApp({
      render: () => [
        dp('p-one', { label: 'Una', modelValue: st.a, 'onUpdate:modelValue': (v) => { st.a = v } }),
        dp('p-two', { label: 'Dos', months: 2, modelValue: st.b, 'onUpdate:modelValue': (v) => { st.b = v } }),
        dp('i-compact', { inline: true, density: 'compact', modelValue: st.c, 'onUpdate:modelValue': (v) => { st.c = v } }),
        // props en línea: el padre se vuelve a pintar con `tick`
        dp('i-inline', { inline: true, months: 'auto', 'data-tick': st.tick, labels: { ...labels }, modelValue: st.d, 'onUpdate:modelValue': (v) => { st.d = v } }),
        h('button', { id: 'd-open-r02', onClick: () => { st.dlg = true } }, 'Diálogo'),
        h(G.GDialog, { id: 'd-r02', modelValue: st.dlg, title: 'Fechas', closeLabel: 'Cerrar', 'onUpdate:modelValue': (v) => { st.dlg = v } }, () => h(G.GDatePicker, { inline: true, locale: 'es', labels, modelValue: '2026-10-20' }))
      ]
    }).mount(el)
  }, LABELS)
  await page.mouse.move(2, 2)
}

const box = (page, sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map((v) => Math.round(v * 10) / 10) }, sel)

// Cuadro a cuadro: tamaño del panel y de la cabecera, y la animación en marcha sobre la vista
async function record(page, root) {
  await page.evaluate((r) => {
    const xs = []
    let on = true
    ;(function f() {
      const pop = document.querySelector(`${r} .g-datepicker__surface`)
      const head = document.querySelector(`${r} .g-datepicker__head`)
      const v = document.querySelector(`${r} .g-datepicker__view`)
      const a = v ? v.getAnimations() : []
      const cs = v && getComputedStyle(v)
      xs.push({
        pop: pop && [pop.getBoundingClientRect().width, pop.getBoundingClientRect().height].map(Math.round),
        head: head && Math.round(head.getBoundingClientRect().height),
        views: new Set([...document.querySelectorAll(`${r} .g-datepicker__view`)].map((e) => e.className)).size,
        anim: a.map((x) => ({ ms: x.effect.getTiming().duration, curve: cs.animationTimingFunction, name: x.animationName })),
        tf: cs ? cs.transform : null
      })
      if (on) requestAnimationFrame(f)
    })()
    window.__stop = () => { on = false; return xs }
  }, root)
}
const tokenMs = (page, v) => page.evaluate((t) => { const i = document.body.appendChild(document.createElement('i')); i.style.transitionDuration = `var(${t})`; const ms = parseFloat(getComputedStyle(i).transitionDuration) * 1000; i.remove(); return ms }, v)
const curveOf = (page, v) => page.evaluate((t) => { const i = document.body.appendChild(document.createElement('i')); i.style.transitionTimingFunction = t; const c = getComputedStyle(i).transitionTimingFunction; i.remove(); return c }, v)
const scaleOf = (tf) => { if (!tf || tf === 'none') return 1; const m = /matrix\(([^,]+)/.exec(tf); return m ? Number(m[1]) : 1 }

for (const reduced of [false, true]) {
  test.describe(`cambio de nivel · ${reduced ? 'reducido' : 'sin reducir'}`, () => {
    test.use({ contextOptions: { reducedMotion: reduced ? 'reduce' : 'no-preference' } })

    for (const id of ['p-one', 'p-two']) {
      test(`Δ 0 del panel y de la cabecera; ${reduced ? 'fundido fast linear sin escala' : 'press + ease-out, escala 0,97…1,03'} · ${id}`, async ({ page }) => {
        const errs = watchConsole(page)
        await mount(page)
        await page.click(`#${id} .g-datepicker__field`)
        await page.waitForTimeout(400)
        const before = await box(page, `#${id} .g-datepicker__surface`)
        const head0 = await box(page, `#${id} .g-datepicker__head`)
        await record(page, `#${id}`)
        await page.click(`#${id} .g-datepicker__title-part--month >> nth=0`) // sube: meses
        await page.waitForTimeout(400)
        const up = await page.evaluate(() => window.__stop())
        await expect(page.locator(`#${id} .g-datepicker__view--months`)).toBeVisible()
        const after = await box(page, `#${id} .g-datepicker__surface`)
        expect(after, 'Δ 0 del panel').toEqual(before)
        expect(Math.abs((await box(page, `#${id} .g-datepicker__head`))[3] - head0[3]), 'Δ 0 de la cabecera').toBeLessThanOrEqual(0.5)
        for (const x of up) {
          expect(x.views, 'nunca dos vistas (de niveles distintos)').toBeLessThanOrEqual(1)
          if (x.pop) expect(Math.abs(x.pop[0] - Math.round(before[2])) + Math.abs(x.pop[1] - Math.round(before[3])), 'Δ 0 durante el zoom').toBeLessThanOrEqual(1)
        }
        const run = up.flatMap((x) => x.anim)
        expect(run.length, 'hay animación de entrada').toBeGreaterThan(0)
        const T = await tokenMs(page, reduced ? '--g-duration-fast' : '--g-duration-press')
        expect(Math.max(...run.map((r) => r.ms))).toBeCloseTo(T, 0)
        expect([...new Set(run.map((r) => r.curve))]).toEqual([await curveOf(page, reduced ? 'linear' : 'var(--g-ease-out)')])
        const scales = up.map((x) => scaleOf(x.tf))
        if (reduced) expect(scales.every((s) => s === 1), 'sin escala').toBe(true)
        else {
          const ps = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-press-scale')))
          expect(Math.min(...scales)).toBeGreaterThanOrEqual(1 - 1e-3)
          expect(Math.max(...scales)).toBeLessThanOrEqual(2 - ps + 1e-3)
        }
        // baja: elegir un mes, en la escala de la pulsación hacia 1
        await record(page, `#${id}`)
        await page.click(`#${id} .g-datepicker__pick >> nth=4`)
        await page.waitForTimeout(400)
        const down = await page.evaluate(() => window.__stop())
        expect(await box(page, `#${id} .g-datepicker__surface`)).toEqual(before)
        const ds = down.map((x) => scaleOf(x.tf))
        if (!reduced) expect(Math.max(...ds)).toBeLessThanOrEqual(1 + 1e-3)
        expect(errs).toEqual([])
      })
    }
  })
}

test('interrupción: dos cambios seguidos terminan en la vista correcta con el foco en su celda', async ({ page }) => {
  await mount(page)
  await page.click('#p-one .g-datepicker__field')
  await page.waitForTimeout(300)
  await page.click('#p-one .g-datepicker__title-part--month')
  await page.click('#p-one .g-datepicker__title-part--year') // antes de que acabe el zoom
  await page.waitForTimeout(250)
  await expect(page.locator('#p-one .g-datepicker__view')).toHaveCount(1)
  await expect(page.locator('#p-one .g-datepicker__view--years')).toBeVisible()
  expect(await page.evaluate(() => document.activeElement.dataset.value)).toBe('2026')
  await page.keyboard.press('Escape')
  await expect(page.locator('#p-one .g-datepicker__view--months')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('#p-one .g-datepicker__view--days')).toBeVisible()
  await expect(page.locator('#p-one .g-datepicker__pop')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('#p-one .g-datepicker__pop')).toBeHidden()
})

test('teclado y año escrito en el navegador real', async ({ page }) => {
  await mount(page)
  await page.click('#p-one .g-datepicker__field')
  await page.waitForTimeout(300)
  await page.click('#p-one .g-datepicker__title-part--year')
  for (const k of '1984') await page.keyboard.press(k)
  expect(await page.evaluate(() => document.activeElement.dataset.value)).toBe('1984')
  await page.keyboard.press('Enter')
  await expect(page.locator('#p-one .g-datepicker__grid--months')).toHaveAttribute('aria-label', 'Meses de 1984')
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('Enter')
  await expect(page.locator('#p-one h3')).toHaveText(/septiembre\s+1984/i)
  expect(await page.evaluate(() => document.activeElement.dataset.date)).toBe('1984-09-20')
})

test('una marca de hover por cuadro también en meses y años', async ({ page }) => {
  await mount(page)
  await page.click('#i-compact .g-datepicker__title-part--month')
  await page.waitForTimeout(300)
  await page.evaluate(() => {
    const xs = []
    let on = true
    ;(function f() {
      const lit = [...document.querySelectorAll('#i-compact .g-datepicker__pick')].filter((b) => { const c = getComputedStyle(b).backgroundColor; return c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent' && !b.matches('.is-selected, .is-current') })
      xs.push(lit.length)
      if (on) requestAnimationFrame(f)
    })()
    window.__stopH = () => { on = false; return xs }
  })
  const picks = page.locator('#i-compact .g-datepicker__pick')
  for (const i of [0, 1, 2, 5, 4, 3, 6, 7]) await picks.nth(i).hover()
  await page.waitForTimeout(200)
  const xs = await page.evaluate(() => window.__stopH())
  expect(Math.max(...xs)).toBeLessThanOrEqual(1)
})

test('compacto con puntero fino: celda 30 px, texto ≥ 12 px, objetivos ≥ 24 px', async ({ page }) => {
  await mount(page)
  const m = await page.evaluate(() => {
    const r = document.querySelector('#i-compact')
    const d = r.querySelector('.g-datepicker__day').getBoundingClientRect()
    const fonts = [...r.querySelectorAll('.g-datepicker__day, .g-datepicker__title-part, th')].map((e) => parseFloat(getComputedStyle(e).fontSize))
    const targets = [...r.querySelectorAll('button:not([hidden])')].map((b) => b.getBoundingClientRect()).filter((b) => b.width).map((b) => Math.min(b.width, b.height))
    return { cell: d.height, minFont: Math.min(...fonts), minTarget: Math.min(...targets) }
  })
  expect(m.cell).toBeCloseTo(30, 0)
  expect(m.minFont).toBeGreaterThanOrEqual(12)
  expect(m.minTarget).toBeGreaterThanOrEqual(24)
})

test('GDialog: Esc en la vista de meses sube y no cierra el diálogo', async ({ page }) => {
  await mount(page)
  await page.click('#d-open-r02')
  await page.waitForTimeout(400)
  const dlg = page.locator('dialog.g-dialog[open]')
  await expect(dlg).toBeVisible()
  await dlg.locator('.g-datepicker__title-part--month').click()
  await expect(dlg.locator('.g-datepicker__view--months')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dlg.locator('.g-datepicker__view--days')).toBeVisible()
  await page.waitForTimeout(300)
  await expect(dlg).toBeVisible()
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)
  await expect(page.locator('dialog.g-dialog[open]')).toHaveCount(0)
})

test('rendimiento: con props en línea, volver a pintar el padre no mide nada', async ({ page }) => {
  await mount(page)
  await page.waitForTimeout(200)
  const n = await page.evaluate(async () => {
    let c = 0
    const orig = Element.prototype.getBoundingClientRect
    Element.prototype.getBoundingClientRect = function () { if (this.closest && this.closest('#i-inline')) c++; return orig.call(this) }
    for (let i = 0; i < 20; i++) { window.__st.tick++; await new Promise((r) => requestAnimationFrame(r)) }
    Element.prototype.getBoundingClientRect = orig
    return c
  })
  expect(n).toBe(0)
})

test.describe('táctil (Chromium)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'pointer: coarse solo se emula con isMobile en Chromium')
  test.use({ hasTouch: true, isMobile: true })

  for (const w of [320, 375]) {
    test(`hoja a ${w} px con puntero grueso: sin desborde, celdas de 44 px, en las tres vistas`, async ({ page }) => {
      await mount(page, { viewport: { width: w, height: 760 } })
      await page.tap('#p-one .g-datepicker__field')
      await page.waitForTimeout(500)
      const check = () => page.evaluate(() => {
        const pop = document.querySelector('#p-one .g-datepicker__pop')
        const s = pop.querySelector('.g-datepicker__surface')
        const cells = [...pop.querySelectorAll('.g-datepicker__day, .g-datepicker__pick')].map((b) => b.getBoundingClientRect())
        const pr = pop.getBoundingClientRect()
        return {
          overflow: Math.max(s.scrollWidth - s.clientWidth, pop.scrollWidth - pop.clientWidth, document.documentElement.scrollWidth - innerWidth),
          outside: cells.filter((c) => c.left < pr.left - 0.5 || c.right > pr.right + 0.5).length,
          minCell: Math.min(...cells.map((c) => Math.min(c.width, c.height)))
        }
      })
      const days = await check()
      expect(days.overflow).toBeLessThanOrEqual(0)
      expect(days.outside).toBe(0)
      expect(days.minCell).toBeGreaterThanOrEqual(44 - 0.5)
      await page.tap('#p-one .g-datepicker__title-part--year')
      await page.waitForTimeout(400)
      const years = await check()
      expect(years.overflow).toBeLessThanOrEqual(0)
      expect(years.outside).toBe(0)
      expect(years.minCell).toBeGreaterThanOrEqual(44 - 0.5)
    })
  }

  test('compacto con puntero grueso: la celda es de 44 px', async ({ page }) => {
    await mount(page)
    const cell = await page.evaluate(() => document.querySelector('#i-compact .g-datepicker__day').getBoundingClientRect().height)
    expect(cell).toBeGreaterThanOrEqual(44 - 0.5)
  })
})
