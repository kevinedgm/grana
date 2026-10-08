// GSlider sobre el COMPONENTE REAL del playground (packages/vue/playground, #sec-slider; entrada @grana/vue/slider →
// dist/slider.umd.js), en Chromium, Firefox y WebKit. Port de design/lab/slider/r01/verificar.mjs (kiwi: base y B) y de lo
// que añade el contrato (design/contracts/slider.md «Verificación · Playwright»; DECISIONS.md #445 a #457): árbol (rol,
// nombres «Precio mínimo/máximo», valuetext, límites dinámicos), secuencia de diez teclas, RTL, rango que se detiene,
// snap="marks", clic en el riel, arrastre, clic en una marca, ajuste del lector, readonly, disabled fuera del Tab, «sin
// elegir» con resumen y envío bloqueado, FormData, fila con GInput y GNumberField (Δ ≤ 1px a 1100/720) y 320px sin
// desborde, mínimo publicado, táctil en Chromium y WebKit (toque en el tramo incluido), anillo y consola limpia.
// Un solo proceso por puerto: GRANA_PW_PORT=4212 (bruno, este encargo).
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/index.html'
const TAB = (browserName) => (browserName === 'webkit' ? 'Alt+Tab' : 'Tab')

async function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana GSlider/.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}
async function open(page, { width = 1280, motion = 'reduce', target = '#sec-slider' } = {}) {
  await page.emulateMedia({ reducedMotion: motion })
  await page.setViewportSize({ width, height: 900 })
  await page.goto(PAGE)
  await page.waitForSelector('#sl-vol')
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'start' }), target)
  await settle(page)
}
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 30)))))
const model = async (page) => JSON.parse(await page.locator('#sl-model').textContent())
const cc = async (page, k) => JSON.parse(await page.locator('#sl-cc').textContent())[k] || 0
const attr = (page, id, a) => page.evaluate(([i, x]) => document.getElementById(i).getAttribute(x), [id, a])
const act = (page) => page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName)
const nb = (s) => (s == null ? s : s.replace(/[\s  ]/g, ' '))
const press = async (page, id, keys) => {
  await page.focus('#' + id)
  for (const k of [].concat(keys)) await page.keyboard.press(k)
  await settle(page)
}
/** Punto (px de la página) del valor de fracción f en el riel del deslizador que contiene #id (recorrido recogido media píldora) */
const pt = (page, id, f) => page.evaluate(([i, f]) => {
  const root = document.getElementById(i).closest('.g-slider')
  const a = root.querySelector('.g-slider__area').getBoundingClientRect()
  const pw = parseFloat(getComputedStyle(root).getPropertyValue('--_pill-w')) || 0
  const rtl = getComputedStyle(root).direction === 'rtl'
  const x = pw / 2 + f * (a.width - pw)
  return [rtl ? a.right - x : a.left + x, a.top + a.height / 2]
}, [id, f])
const ringOn = (page, id) => page.evaluate((i) => {
  const n = document.getElementById(i)
  const cs = getComputedStyle(n.parentElement)
  return n.hasAttribute('data-g-key-focus') && cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0
}, id)
const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)
const setModel = async (page, k, v) => { await page.evaluate(([k, v]) => { window.__sl[k] = v }, [k, v]); await settle(page) }

test.describe('GSlider · componente real (slider.md)', () => {
  test('árbol: rol y nombres, valuetext, nativo step="any" del tamaño del asa, sin name, límites dinámicos', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    const s = await page.evaluate(() => {
      const i = document.getElementById('sl-vol')
      const t = i.parentElement
      const r = i.getBoundingClientRect()
      return { type: i.type, step: i.getAttribute('step'), name: i.name, label: !!document.querySelector('label[for="sl-vol"]'), vt: i.getAttribute('aria-valuetext'), w: r.width, h: r.height, tw: t.clientWidth, th: t.clientHeight }
    })
    expect(s).toMatchObject({ type: 'range', step: 'any', name: '', label: true })
    expect(nb(s.vt)).toMatch(/^40 ?%$/)
    expect(Math.abs(s.w - s.tw), 'el nativo ocupa el interior del asa').toBeLessThanOrEqual(4)
    expect(s.w).toBeGreaterThanOrEqual(16)
    await expect(page.getByRole('slider', { name: /^Volumen de los avisos/ })).toHaveCount(1)
    await expect(page.getByRole('group', { name: /^Precio$/ })).toHaveCount(1)
    await expect(page.getByRole('slider', { name: /^Precio mínimo$/ })).toHaveCount(1)
    await expect(page.getByRole('slider', { name: /^Precio máximo$/ })).toHaveCount(1)
    expect([await attr(page, 'sl-gap', 'max'), await attr(page, 'sl-gap-end', 'min')]).toEqual(['2300', '900'])
    expect(nb(await attr(page, 'sl-precio', 'aria-valuetext'))).toBe('$800')
    expect(nb(await attr(page, 'sl-precio-end', 'aria-valuetext'))).toBe('$2,400')
    expect(await attr(page, 'sl-dolor', 'aria-valuetext')).toBe('Sin elegir')
    expect(await page.locator('.g-slider:has(#sl-dolor) .g-slider__fill').count()).toBe(0)
    expect(await page.locator('.g-slider:has(#sl-dolor) .g-slider__value').textContent()).toBe('Sin elegir')
    expect(errs).toEqual([])
  })

  test('teclado: → ↑ ← Mayús+→ RePág AvPág ↓ Inicio Fin → = 41 42 41 51 61 51 50 0 100 100; nueve change; valuetext sigue', async ({ page }) => {
    await open(page)
    await page.focus('#sl-vol')
    const seq = []
    for (const k of ['ArrowRight', 'ArrowUp', 'ArrowLeft', 'Shift+ArrowRight', 'PageUp', 'PageDown', 'ArrowDown', 'Home', 'End', 'ArrowRight']) {
      await page.keyboard.press(k)
      seq.push((await model(page)).vol)
    }
    expect(seq.join(' ')).toBe('41 42 41 51 61 51 50 0 100 100')
    expect(await cc(page, 'vol')).toBe(9)
    expect(nb(await attr(page, 'sl-vol', 'aria-valuetext'))).toMatch(/^100 ?%$/)
  })

  test('rango que se detiene (minGap 100), cada asa con su teclado; snap="marks" de marca en marca', async ({ page }) => {
    await open(page)
    await press(page, 'sl-gap', 'End')
    expect((await model(page)).gap).toEqual([2300, 2400])
    await press(page, 'sl-gap-end', 'Home')
    expect((await model(page)).gap).toEqual([2300, 2400])
    await press(page, 'sl-gap', 'Home')
    await press(page, 'sl-gap-end', ['ArrowLeft', 'ArrowLeft'])
    expect((await model(page)).gap).toEqual([0, 2300])
    await press(page, 'sl-res', 'ArrowRight')
    const a = (await model(page)).res
    await press(page, 'sl-res', ['ArrowRight', 'ArrowRight'])
    expect([a, (await model(page)).res]).toEqual([50, 100])
  })

  test('RTL (ar-EG): el 40 % a 40 % desde la derecha; ← sube y → baja; el fin a la izquierda del inicio', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    const f = await page.evaluate(() => {
      const root = document.getElementById('sl-ar').closest('.g-slider')
      const t = root.querySelector('.g-slider__thumb').getBoundingClientRect()
      const a = root.querySelector('.g-slider__area').getBoundingClientRect()
      const pw = parseFloat(getComputedStyle(root).getPropertyValue('--_pill-w'))
      return { at: (a.right - (t.left + t.width / 2) - pw / 2) / (a.width - pw), dir: getComputedStyle(root).direction }
    })
    expect(f.dir).toBe('rtl')
    expect(Math.abs(f.at - 0.4)).toBeLessThan(0.01)
    await press(page, 'sl-ar', 'ArrowLeft')
    const up = (await model(page)).ar
    await press(page, 'sl-ar', ['ArrowRight', 'ArrowRight'])
    expect([up, (await model(page)).ar]).toEqual([41, 39])
    expect(await attr(page, 'sl-ar', 'aria-valuetext')).toMatch(/٣٩/)
    const lefts = await page.evaluate(() => [...document.getElementById('sl-ar-r').closest('.g-slider').querySelectorAll('.g-slider__thumb')].map((t) => t.getBoundingClientRect().left))
    expect(lefts[1]).toBeLessThan(lefts[0])
    expect(errs).toEqual([])
  })

  test('puntero: clic en el riel salta (75), arrastre sigue con un solo change, clic en una marca da su valor', async ({ page }) => {
    await open(page)
    await page.mouse.click(5, 5)
    const [x, y] = await pt(page, 'sl-vol', 0.75)
    await page.mouse.click(x, y)
    await settle(page)
    expect((await model(page)).vol).toBe(75)
    expect(await act(page)).toBe('sl-vol')
    expect(await ringOn(page, 'sl-vol'), 'sin anillo tras el clic').toBe(false)
    const before = await cc(page, 'vol')
    await page.mouse.move(x, y)
    await page.mouse.down()
    for (let k = 1; k <= 6; k++) {
      const [mx] = await pt(page, 'sl-vol', 0.75 - k * 0.05)
      await page.mouse.move(mx, y)
    }
    await page.mouse.up()
    await settle(page)
    expect((await model(page)).vol).toBe(45)
    expect(await cc(page, 'vol')).toBe(before + 1)
    await page.keyboard.press('ArrowRight')
    expect(await ringOn(page, 'sl-vol'), 'anillo en cuanto se usa el teclado').toBe(true)
    const mark = await page.locator('.g-slider:has(#sl-dolor) .g-slider__mark[data-value="5"] .g-slider__mark-label').boundingBox()
    await page.mouse.click(mark.x + mark.width / 2, mark.y + mark.height / 2)
    await settle(page)
    expect((await model(page)).dolor).toBe(5)
    expect(await attr(page, 'sl-dolor', 'aria-valuetext')).toBe('5, Moderado')
    expect(await attr(page, 'sl-dolor', 'aria-describedby')).toMatch(/sl-dolor-hint .*sl-dolor-message|sl-dolor-hint sl-dolor-message/)
  })

  test('ajuste del lector (input sin tecla): un paso en esa dirección y un change', async ({ page }) => {
    await open(page)
    const before = await cc(page, 'vol')
    await page.evaluate(() => { const i = document.getElementById('sl-vol'); i.value = String(Number(i.value) + 0.4); i.dispatchEvent(new Event('input', { bubbles: true })) })
    await settle(page)
    expect((await model(page)).vol).toBe(41)
    expect(await cc(page, 'vol')).toBe(before + 1)
    expect(await page.evaluate(() => document.getElementById('sl-vol').value)).toBe('41')
  })

  test('solo lectura: enfocable con aria-readonly, ni teclado ni puntero cambian; deshabilitado fuera del Tab', async ({ page, browserName }) => {
    await open(page, { target: '#sl-ro' })
    await press(page, 'sl-ro', ['ArrowRight', 'End', '5'])
    const [x, y] = await pt(page, 'sl-ro', 0.95)
    await page.mouse.click(x, y)
    await settle(page)
    expect(await page.evaluate(() => document.getElementById('sl-ro').value)).toBe('60')
    expect(await attr(page, 'sl-ro', 'aria-readonly')).toBe('true')
    expect(await act(page)).toBe('sl-ro')
    expect(await page.locator('.g-slider:has(#sl-ro) .g-slider__thumb.is-typing').count()).toBe(0)
    await page.focus('#sl-ro')
    await page.keyboard.press(TAB(browserName))
    expect(await act(page)).not.toBe('sl-dis')
    expect(await page.evaluate(() => document.getElementById('sl-dis').disabled)).toBe(true)
  })

  test('«sin elegir»: enviar bloquea, el resumen lleva al asa con anillo (Intro), ↑ da el mínimo y el error se va; FormData canónico', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    await page.click('#sl-send')
    await settle(page)
    expect(await page.locator('#sl-invalid').textContent()).toBe('invalid: dolor')
    expect(await page.locator('#sl-fd').textContent()).toBe('FormData: (envía el formulario)')
    const link = page.locator('#sl-form .g-error-summary a[href="#sl-dolor"]')
    await expect(link).toHaveCount(1)
    await link.focus()
    await page.keyboard.press('Enter')
    await settle(page)
    expect(await act(page)).toBe('sl-dolor')
    expect(await ringOn(page, 'sl-dolor'), 'Intro en el resumen: anillo (#450)').toBe(true)
    expect(await attr(page, 'sl-dolor', 'aria-invalid')).toBe('true')
    expect(await page.locator('.g-slider:has(#sl-dolor) .g-slider__message').textContent()).toContain('Elige la intensidad del dolor')
    expect(await page.locator('.g-slider:has(#sl-dolor) .g-slider__message svg').count()).toBe(1)
    await page.keyboard.press('ArrowUp')
    await settle(page)
    expect((await model(page)).dolor).toBe(0)
    expect(await attr(page, 'sl-dolor', 'aria-invalid')).toBe(null)
    await page.keyboard.press('ArrowRight')
    await page.click('#sl-send')
    await settle(page)
    expect(await page.locator('#sl-fd').textContent()).toBe('FormData: volumen="40"  dolor="1"  res="25"  temp="21.5"  dur="200"')
    expect(errs).toEqual([])
  })

  test('fila con GInput y GNumberField: centro del riel = centro de la caja (Δ ≤ 1px) a 1100 y 720; 320 sin desborde; mismo v-model', async ({ page }) => {
    const errs = await watchConsole(page)
    for (const w of [1100, 720]) {
      await open(page, { width: w, target: '#sl-row' })
      const r = await page.evaluate(() => {
        const c = (el) => { const q = el.getBoundingClientRect(); return q.top + q.height / 2 }
        const row = document.getElementById('sl-row')
        const track = row.querySelector('.g-slider__track')
        const boxes = [...row.querySelectorAll('.g-input__control')]
        const sl = row.querySelector('.g-slider')
        const lines = [...row.children].map((k) => k.dataset.line)
        return { d: boxes.map((b) => Math.abs(c(b) - c(track))), same: new Set(lines).size === 1, labels: [...row.querySelectorAll('.g-input__label, .g-slider__label')].map((l) => l.getBoundingClientRect().bottom), h: sl.querySelector('.g-slider__area').getBoundingClientRect().height, box: boxes[0].getBoundingClientRect().height }
      })
      if (!r.same) continue
      expect(r.d.every((d) => d <= 1), `a ${w}: Δ ${r.d}`).toBe(true)
      expect(Math.max(...r.labels) - Math.min(...r.labels), `a ${w}: etiquetas`).toBeLessThanOrEqual(1.5)
      expect(Math.abs(r.h - r.box), `a ${w}: alto del área = caja md`).toBeLessThanOrEqual(1)
    }
    await page.focus('#sl-r-vol')
    await page.keyboard.press('ArrowUp')
    await settle(page)
    expect(await page.evaluate(() => document.getElementById('sl-r-num').value)).toBe('41')
    await open(page, { width: 320 })
    expect(await noOverflow(page)).toBe(true)
    await open(page, { width: 320, target: '#sl-ar' })
    expect(await noOverflow(page)).toBe(true)
    expect(errs).toEqual([])
  })

  test('mínimo publicado (#453): la fila se parte antes de que las marcas o las píldoras no quepan', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page, { target: '#sl-row2' })
    const probe = () => page.evaluate(() => {
      const row = document.getElementById('sl-row2')
      const kids = [...row.children]
      const unit = parseFloat(getComputedStyle(row).getPropertyValue('--g-space-1')) || 4
      const out = []
      for (const s of row.querySelectorAll('.g-slider')) {
        const pw = parseFloat(getComputedStyle(s).getPropertyValue('--_pill-w')) || 0
        const labels = [...s.querySelectorAll('.g-slider__mark-label')]
        const marks = labels.reduce((a, l) => a + l.getBoundingClientRect().width, 0) + (labels.length ? unit * 2 * (labels.length - 1) : 0)
        const need = Math.max(unit * 40, pw * (s.classList.contains('g-slider--range') ? 4 : 3), marks)
        const shared = kids.filter((k) => k.dataset.line === s.dataset.line).length > 1
        // Nombres de marcas que se tocan
        const r = labels.map((l) => l.getBoundingClientRect())
        let touch = false
        for (let k = 1; k < r.length; k++) if (r[k].left < r[k - 1].right - 0.5) touch = true
        out.push({ w: s.getBoundingClientRect().width, need, shared, touch })
      }
      return { lines: row.dataset.lines, out }
    })
    const bad = []
    let lastLines = null
    let split = false
    for (let w = 1000; w >= 300; w -= 25) {
      await page.evaluate((px) => { document.getElementById('sl-row2').closest('.g-form-layout').style.inlineSize = px + 'px' }, w)
      await settle(page)
      const p = await probe()
      for (const s of p.out) {
        if (s.shared && s.w < s.need - 1) bad.push(`${w}: ${s.w.toFixed(1)} < ${s.need.toFixed(1)} compartiendo línea`)
        if (s.touch && w >= 340) bad.push(`${w}: nombres de marcas que se tocan`)
      }
      if (lastLines && p.lines !== lastLines) split = true
      lastLines = p.lines
    }
    expect(split, 'la fila llega a partirse').toBe(true)
    expect(bad).toEqual([])
    expect(errs).toEqual([])
  })

  test('anillo (#450): no tras el clic; sí con →, con Tab (Opción+Tab en WebKit)', async ({ page, browserName }) => {
    await open(page)
    const [x, y] = await pt(page, 'sl-vol', 0.4)
    await page.mouse.click(x, y)
    await settle(page)
    expect(await act(page)).toBe('sl-vol')
    expect(await ringOn(page, 'sl-vol')).toBe(false)
    expect(await page.evaluate(() => getComputedStyle(document.getElementById('sl-vol').parentElement).outlineStyle)).toBe('none')
    await page.keyboard.press('ArrowRight')
    expect(await ringOn(page, 'sl-vol')).toBe(true)
    await page.mouse.click(5, 5)
    await page.focus('#sl-send')
    await page.evaluate(() => document.getElementById('sl-vol').closest('.g-form-layout').querySelector('.g-slider').scrollIntoView())
    // Desde el botón anterior al primer deslizador: un botón de partida enfocado por programa justo antes
    await page.evaluate(() => {
      const t = document.getElementById('sl-vol').closest('.g-slider')
      const b = document.createElement('button')
      b.id = '__kf'
      b.textContent = 'antes'
      t.parentElement.insertBefore(b, t)
      b.focus()
    })
    await page.keyboard.press(TAB(browserName))
    await settle(page)
    expect(await act(page)).toBe('sl-vol')
    expect(await ringOn(page, 'sl-vol')).toBe(true)
  })

  test('consola limpia al cargar y al recorrer la sección', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    for (const id of ['sl-vol', 'sl-res', 'sl-temp', 'sl-dur', 'sl-precio', 'sl-precio-end', 'sl-edad', 'sl-ar']) await press(page, id, ['ArrowUp', 'PageDown'])
    expect(errs).toEqual([])
  })
})

test.describe('GSlider · táctil (Chromium y WebKit)', () => {
  test.skip(({ browserName }) => browserName === 'firefox', 'Firefox no emula táctil en Playwright')
  test('área ≥ 44, touch-action pan-y; gesto vertical no cambia; un toque salta; toque en el tramo mueve el asa más cercana', async ({ browser, browserName }) => {
    const context = await browser.newContext({ hasTouch: true, isMobile: browserName === 'chromium', viewport: { width: 390, height: 900 } })
    const page = await context.newPage()
    const errs = await watchConsole(page)
    await page.goto(PAGE)
    await page.waitForSelector('#sl-vol')
    await page.evaluate(() => document.fonts.ready)
    await page.evaluate(() => document.getElementById('sl-precio').scrollIntoView({ block: 'center' }))
    await settle(page)
    const coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches)
    const g = await page.evaluate(() => {
      const root = document.getElementById('sl-vol').closest('.g-slider')
      const a = root.querySelector('.g-slider__area')
      const cs = getComputedStyle(root.querySelector('.g-slider__thumb'), '::after')
      return { h: a.getBoundingClientRect().height, ta: getComputedStyle(a).touchAction, hit: [parseFloat(cs.width), parseFloat(cs.height)] }
    })
    expect(g.ta).toBe('pan-y')
    if (coarse) {
      expect(g.h).toBeGreaterThanOrEqual(44)
      expect(g.hit[0]).toBeGreaterThanOrEqual(44)
      expect(g.hit[1]).toBeGreaterThanOrEqual(44)
    }
    // Puntero táctil sintético sobre el componente (el desplazamiento real lo decide touch-action)
    const synth = (id, sel, steps) => page.evaluate(([id, sel, st]) => {
      const root = document.getElementById(id).closest('.g-slider')
      const el = root.querySelector(sel)
      for (const [type, x, y] of st) el.dispatchEvent(new PointerEvent(type, { pointerType: 'touch', pointerId: 7, isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y, bubbles: true, cancelable: true }))
    }, [id, sel, steps])
    let [x, y] = await pt(page, 'sl-vol', 0.2)
    await synth('sl-vol', '.g-slider__area', [['pointerdown', x, y], ['pointermove', x + 2, y + 30], ['pointerup', x + 2, y + 30]])
    await settle(page)
    expect((await model(page)).vol, 'gesto vertical').toBe(40)
    await synth('sl-vol', '.g-slider__area', [['pointerdown', x, y], ['pointerup', x + 3, y + 2]])
    await settle(page)
    expect((await model(page)).vol, 'toque').toBe(20)
    // Tramo del precio [800, 2400] de 0 a 5000: un toque en 1550 (entre las píldoras) lleva el inicio (más cercano) a 1550
    await page.locator('#sl-precio').scrollIntoViewIfNeeded()
    await settle(page)
    ;[x, y] = await pt(page, 'sl-precio', 1550 / 5000)
    const onFill = await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest('.g-slider__fill'), [x, y])
    expect(onFill, 'el punto cae en el tramo').toBe(true)
    await synth('sl-precio', '.g-slider__fill', [['pointerdown', x, y], ['pointerup', x + 4, y + 1]])
    await settle(page)
    expect((await model(page)).precio).toEqual([1550, 2400])
    expect(errs).toEqual([])
    await context.close()
  })
})
