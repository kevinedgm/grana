// GAdaptiveLayout sobre el COMPONENTE REAL (packages/vue/playground/adaptive-layout.html: dist/grana.umd.js), en Chromium,
// Firefox y WebKit. Compuertas de bruno de design/contracts/adaptive-layout.md («Compuertas verificables»; DECISIONS.md
// #339 a #348 y #359 a #364): horizontal lógico start/end en LTR y RTL (#359); GSummary como hijo directo a 240/360/460 px
// sin bajar de su suelo (#363); --g-adapt-* sin herencia (#364); ninguna pista baja un control de 24 px ni recorta su
// etiqueta; foco en orden del DOM; Δ0 al escribir (sin escrituras de colocación); calle + dos enteros compactos a 460 px.
// Ejecutar desde design/lab/theme-playground: GRANA_PW_PORT=4210 npx playwright test tests/adaptive-layout.spec.mjs
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/adaptive-layout.html'

function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana/.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}
const frames = (page, n = 4) => page.evaluate((n) => new Promise((r) => { const f = (k) => (k ? requestAnimationFrame(() => f(k - 1)) : setTimeout(r, 30)); f(n) }), n)
async function open(page) {
  await page.setViewportSize({ width: 1400, height: 1000 })
  await page.goto(PAGE)
  await page.waitForSelector('#address.is-ready')
  await page.evaluate(() => document.fonts.ready)
  await frames(page)
}
// Monta una plantilla Vue en un anfitrión propio, arriba de la página (visible: GSummary aplaza lo que está lejos)
async function fixture(page, template, { width, dir = 'ltr' } = {}) {
  await page.evaluate(({ template, width, dir }) => {
    window.__fx?.app.unmount(); window.__fx?.host.remove()
    const host = document.createElement('div')
    host.id = 'fx-host'; host.dir = dir; host.style.inlineSize = `${width}px`
    document.body.prepend(host)
    const app = Vue.createApp({ template }); app.use(Grana.default)
    app.mount(host)
    window.__fx = { app, host }
  }, { template, width, dir })
  await page.waitForSelector('#fx-host .g-adaptive-layout.is-ready')
  await frames(page)
}
const setWidth = async (page, width) => { await page.evaluate((w) => { document.querySelector('#fx-host').style.inlineSize = `${w}px` }, width); await frames(page) }
const boxes = (page, selector = '#fx-host > .g-adaptive-layout') => page.locator(selector).evaluate((root) => {
  const r = root.getBoundingClientRect()
  return { left: r.left, right: r.right, kids: [...root.children].map((c) => { const b = c.getBoundingClientRect(); return { left: b.left, right: b.right, width: b.width, line: c.dataset.line } }) }
})

test.describe('GAdaptiveLayout · componente real', () => {
  test('horizontal lógico (#359): start y end en LTR y RTL; en RTL, end queda a la izquierda y el orden no cambia', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page)
    const two = (h) => `<g-adaptive-layout horizontal="${h}"><g-number-field label="Uno" :precision="0" :min="0" :max="9"></g-number-field><g-number-field label="Dos" :precision="0" :min="0" :max="9"></g-number-field></g-adaptive-layout>`
    for (const dir of ['ltr', 'rtl']) {
      for (const h of ['start', 'center', 'end']) {
        await fixture(page, two(h), { width: 720, dir })
        const g = await boxes(page)
        const [a, b] = g.kids
        expect(a.line, `${dir} ${h}`).toBe(b.line)
        expect(a.width + b.width, `${dir} ${h}: la línea no se llena`).toBeLessThan(600)
        // orden de lectura: el primero va al inicio en línea (izquierda en LTR, derecha en RTL)
        if (dir === 'ltr') expect(a.left).toBeLessThan(b.left); else expect(a.left).toBeGreaterThan(b.left)
        const lineLeft = Math.min(a.left, b.left), lineRight = Math.max(a.right, b.right)
        const atLeft = Math.abs(lineLeft - g.left) < 1, atRight = Math.abs(lineRight - g.right) < 1
        if (h === 'center') expect(Math.abs((lineLeft - g.left) - (g.right - lineRight)), `${dir} center`).toBeLessThan(1)
        else if ((h === 'start') === (dir === 'ltr')) expect(atLeft && !atRight, `${dir} ${h}: a la izquierda`).toBe(true)
        else expect(atRight && !atLeft, `${dir} ${h}: a la derecha`).toBe(true)
        // colocación lógica: nada físico en línea
        const style = await page.locator('#fx-host > .g-adaptive-layout > *').first().evaluate((c) => c.getAttribute('style'))
        expect(style).toContain('--_adaptive-start')
        expect(style).not.toContain('--_adaptive-x')
      }
    }
    expect(errs).toEqual([])
  })

  test('calle + dos enteros a 460 px: una línea larga y dos compactos juntos; nunca tres cortos a ancho completo', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page)
    // Banco del brief (kiwi r01, #340): enteros 0–9 con −/+, sin pistas ni nombres programados
    await fixture(page, '<g-adaptive-layout><g-input label="Calle"></g-input><g-number-field label="Exterior" steppers decrement-label="Reducir exterior" increment-label="Aumentar exterior" :precision="0" :min="0" :max="9"></g-number-field><g-number-field label="Interior" steppers decrement-label="Reducir interior" increment-label="Aumentar interior" :precision="0" :min="0" :max="9"></g-number-field></g-adaptive-layout>', { width: 460 })
    const g = await boxes(page)
    expect(g.kids.map((k) => k.line)).toEqual(['1', '2', '2'])
    expect(g.kids[1].width + g.kids[2].width).toBeLessThan(460)
    expect(errs).toEqual([])
  })

  test('GSummary como hijo directo (#363): a 240, 360 y 460 px nunca baja de su suelo, comparte línea cuando cabe y no avisa de ancho 0', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page)
    await fixture(page, `<g-adaptive-layout><g-summary avatar title="María López Hernández" code="EXP-0042" :facts="[{ label: 'Edad', value: '42 años' }, { label: 'Consultorio', value: '4' }]"></g-summary><g-number-field label="Piso" :precision="0" :min="0" :max="9"></g-number-field></g-adaptive-layout>`, { width: 460 })
    const lines = {}
    for (const w of [240, 360, 460]) {
      await setWidth(page, w)
      const m = await page.locator('#fx-host .g-summary').evaluate((su) => {
        const title = su.querySelector('.g-summary__title'), lead = su.querySelector(':scope > .g-summary__lead')
        const ctx = document.createElement('canvas').getContext('2d')
        const s = getComputedStyle(title); ctx.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`
        const zero = ctx.measureText('0').width
        const floor = (lead ? lead.getBoundingClientRect().width + (parseFloat(getComputedStyle(su).columnGap) || 0) : 0) + (su.classList.contains('g-summary--layout-inline') ? 4 : 7) * zero
        const t = title.getBoundingClientRect()
        return { width: su.getBoundingClientRect().width, floor, titleWidth: t.width, need: Math.min((su.classList.contains('g-summary--layout-inline') ? 4 : 7) * zero, title.scrollWidth), line: su.dataset.line, next: su.nextElementSibling.dataset.line }
      })
      expect(m.width, `${w}px: la ficha recibe al menos su suelo`).toBeGreaterThanOrEqual(m.floor - 0.5)
      expect(m.titleWidth, `${w}px: el título conserva su suelo (7ch, o entero si es más corto)`).toBeGreaterThanOrEqual(m.need - 1)
      lines[w] = m.line === m.next
    }
    expect(lines[460], 'a 460 px la ficha comparte línea con el número').toBe(true)
    // Hallazgo 4 de coco: dos fichas a 400 px y una ficha junto a dos números a 280 px, sin título por debajo de 7ch
    const sumCase = async (template, width) => {
      await fixture(page, template, { width })
      return page.locator('#fx-host .g-summary').evaluateAll((list) => list.map((su) => {
        const title = su.querySelector('.g-summary__title'), ctx = document.createElement('canvas').getContext('2d')
        const s = getComputedStyle(title); ctx.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`
        return { title: title.getBoundingClientRect().width, need: Math.min(7 * ctx.measureText('0').width, title.scrollWidth) }
      }))
    }
    const facts = `:facts="[{ label: 'Edad', value: '42 años' }, { label: 'Consultorio', value: '4' }]"`
    for (const m of await sumCase(`<g-adaptive-layout><g-summary avatar title="María López Hernández" ${facts}></g-summary><g-summary avatar title="Juan Pérez Gómez" ${facts}></g-summary></g-adaptive-layout>`, 400)) expect(m.title, 'dos fichas a 400 px').toBeGreaterThanOrEqual(m.need - 1)
    for (const m of await sumCase(`<g-adaptive-layout><g-summary avatar title="María López Hernández" ${facts}></g-summary><g-number-field label="Piso" :precision="0" :min="0" :max="9"></g-number-field><g-number-field label="Cuarto" :precision="0" :min="0" :max="9"></g-number-field></g-adaptive-layout>`, 280)) expect(m.title, 'ficha junto a dos números a 280 px').toBeGreaterThanOrEqual(m.need - 1)
    expect(errs.filter((e) => /GSummary/.test(e))).toEqual([])
    expect(errs).toEqual([])
  })

  test('--g-adapt-* sin herencia (#364): el peso del grupo no llega a sus campos y el plan interior no cambia', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page)
    const group = (style) => `<g-adaptive-layout><g-adaptive-layout id="fx-group" style="${style}"><g-input label="Nombre" style="--g-adapt-weight: 0"></g-input><g-input label="Apellido"></g-input><g-number-field label="Edad" :precision="0" :min="0" :max="120"></g-number-field></g-adaptive-layout></g-adaptive-layout>`
    const inner = () => page.locator('#fx-group').evaluate((g) => [...g.children].map((c) => ({ line: c.dataset.line, width: Math.round(c.getBoundingClientRect().width * 10) / 10, weight: getComputedStyle(c).getPropertyValue('--g-adapt-weight').trim(), chars: getComputedStyle(c).getPropertyValue('--g-adapt-chars').trim() })))
    await fixture(page, group(''), { width: 720 })
    const plain = await inner()
    await fixture(page, group('--g-adapt-weight: 5; --g-adapt-chars: 3'), { width: 720 })
    const hinted = await inner()
    expect(await page.locator('#fx-group').evaluate((g) => getComputedStyle(g).getPropertyValue('--g-adapt-weight').trim())).toBe('5')
    for (const c of hinted) { expect(Number(c.weight)).toBe(0); expect(Number(c.chars)).toBe(0) }
    expect(hinted.map((c) => [c.line, c.width])).toEqual(plain.map((c) => [c.line, c.width]))
    // (el aviso de pista sin efecto es de desarrollo: el UMD no lo emite; lo cubre GAdaptiveLayout.test.js)
    expect(errs).toEqual([])
  })

  test('ninguna pista baja un control de 24 px ni recorta su etiqueta, de 240 a 720 px', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page)
    await fixture(page, `<g-adaptive-layout>
      <g-input class="g-adapt-short" style="--g-adapt-chars: 1" label="Código"></g-input>
      <g-number-field class="g-adapt-short" style="--g-adapt-chars: 1" label="Cantidad de prueba" steppers decrement-label="Menos" increment-label="Más" :precision="0" :min="0" :max="99"></g-number-field>
      <g-select class="g-adapt-short" style="--g-adapt-chars: 1" label="Municipio" :options="[{ value: 1, label: 'Oaxaca de Juárez' }]"></g-select>
      <g-textarea class="g-adapt-short" style="--g-adapt-chars: 1" label="Observaciones"></g-textarea>
      <label class="g-adapt-short" style="--g-adapt-chars: 1; display: block">Nativo<input style="display: block; inline-size: 100%; box-sizing: border-box" name="nativo"></label>
    </g-adaptive-layout>`, { width: 720 })
    for (const w of [240, 320, 460, 720]) {
      await setWidth(page, w)
      const bad = await page.locator('#fx-host > .g-adaptive-layout').evaluate((root) => {
        const out = []
        // El control es la caja (con sus −/+) o el nativo; la zona de texto de dentro sigue a la pista (--g-adapt-chars: 1)
        for (const el of root.querySelectorAll('.g-input__control, .g-select__control, .g-textarea__control, button, .g-adaptive-layout > label > input')) {
          const r = el.getBoundingClientRect(); if (!r.width || getComputedStyle(el).visibility === 'hidden') continue
          if (r.width < 24 - 0.5 || (!el.matches('input') && r.height < 24 - 0.5)) out.push(`${el.className || el.tagName} ${r.width.toFixed(1)}×${r.height.toFixed(1)}`)
        }
        for (const l of root.querySelectorAll('.g-input__label, .g-select__label, .g-textarea__label')) {
          if (l.scrollWidth > l.clientWidth + 1) out.push(`etiqueta recortada: ${l.textContent}`)
          const p = l.closest('.g-adaptive-layout > *').getBoundingClientRect(), b = l.getBoundingClientRect()
          if (b.left < p.left - 1 || b.right > p.right + 1) out.push(`etiqueta fuera de su raíz: ${l.textContent}`)
        }
        return out
      })
      expect(bad, `${w}px`).toEqual([])
    }
    expect(errs).toEqual([])
  })

  test('foco en orden del DOM en LTR y RTL a 320 y 720 px', async ({ page, browserName }) => {
    const errs = watchConsole(page)
    await open(page)
    const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab'
    for (const dir of ['ltr', 'rtl']) for (const w of [320, 720]) {
      await fixture(page, '<g-adaptive-layout><g-input label="Calle" name="calle"></g-input><g-number-field label="Exterior" name="ext" :precision="0" :min="0" :max="9"></g-number-field><g-number-field label="Interior" name="int" :precision="0" :min="0" :max="9"></g-number-field><g-select label="Estado" name="estado" :options="[{ value: 1, label: \'Oaxaca\' }]"></g-select><g-input label="Colonia" name="colonia"></g-input></g-adaptive-layout>', { width: w, dir })
      const expected = await page.locator('#fx-host').evaluate((h) => [...h.querySelectorAll('input:not([type=hidden]),button,select,textarea,[tabindex]:not([tabindex="-1"])')].filter((e) => !e.disabled && e.tabIndex >= 0 && e.getClientRects().length).map((e) => e.id || e.name || e.className))
      await page.locator('#fx-host input').first().focus()
      const seen = [await page.evaluate(() => { const e = document.activeElement; return e.id || e.name || e.className })]
      for (let i = 1; i < expected.length; i++) { await page.keyboard.press(tab); seen.push(await page.evaluate(() => { const e = document.activeElement; return e.id || e.name || e.className })) }
      expect(seen, `${dir} ${w}`).toEqual(expected)
    }
    expect(errs).toEqual([])
  })

  test('Δ0 al escribir: ninguna escritura de colocación y ninguna raíz se mueve', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page)
    await fixture(page, '<g-adaptive-layout><g-input label="Calle" name="calle"></g-input><g-number-field label="Exterior" name="ext" :precision="0" :min="0" :max="9"></g-number-field><g-number-field label="Interior" name="int" :precision="0" :min="0" :max="9"></g-number-field></g-adaptive-layout>', { width: 460 })
    const before = await boxes(page)
    await page.evaluate(() => {
      window.__writes = 0
      const root = document.querySelector('#fx-host > .g-adaptive-layout')
      window.__mo = new MutationObserver((rs) => { for (const r of rs) if (r.attributeName === 'data-line' || (r.attributeName === 'style' && /--_adaptive/.test(`${r.oldValue}|${r.target.getAttribute('style')}`) && r.oldValue !== r.target.getAttribute('style'))) window.__writes++ })
      window.__mo.observe(root, { attributes: true, attributeOldValue: true, attributeFilter: ['style', 'data-line', 'data-lines', 'class'] })
      for (const c of root.children) window.__mo.observe(c, { attributes: true, attributeOldValue: true, attributeFilter: ['style', 'data-line'] })
    })
    const calle = page.locator('#fx-host input[name=calle]')
    await calle.click()
    await calle.pressSequentially('Avenida de los Insurgentes Sur número 1602 interior B', { delay: 0 })
    await page.locator('#fx-host input[role=spinbutton]').first().press('ArrowUp')
    await frames(page, 6)
    expect(await page.evaluate(() => window.__writes)).toBe(0)
    const after = await boxes(page)
    expect(after.kids.map((k) => [k.line, k.left, k.width])).toEqual(before.kids.map((k) => [k.line, k.left, k.width]))
    expect(await calle.inputValue()).toBe('Avenida de los Insurgentes Sur número 1602 interior B')
    expect(errs).toEqual([])
  })

  test('un <style> insertado vuelve a medir sin cambio de ancho (hallazgo 6); refresh() también', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page)
    await fixture(page, '<g-adaptive-layout><g-number-field label="Cantidadextensa" :precision="0" :min="0" :max="9"></g-number-field><g-input label="Notas"></g-input></g-adaptive-layout>', { width: 720 })
    const width = () => page.locator('#fx-host .g-number-field').evaluate((el) => el.getBoundingClientRect().width)
    const before = await width()
    await page.addStyleTag({ content: '#fx-host .g-input__label { letter-spacing: 0.3em }' })
    await frames(page, 6)
    const after = await width()
    expect(after, 'la palabra más larga de la etiqueta creció').toBeGreaterThan(before + 10)
    await page.evaluate(() => { document.head.lastElementChild.remove() })
    await frames(page, 6)
    expect(Math.abs((await width()) - before)).toBeLessThan(0.5)
    expect(errs).toEqual([])
  })

  // Migrado de packages/vue/tests/adaptive-layout.browser.mjs (Codex): banco compuesto #345, natural genérico, C12 #348
  test('banco compuesto (#345): avatar natural + grupo comparten línea a 460 px y la tabla va sola; una imagen natural conserva su ancho', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page)
    await page.locator('#width').evaluate((el) => { el.value = '460'; el.dispatchEvent(new Event('input', { bubbles: true })) })
    await frames(page)
    const mixed = () => page.locator('#mixed').evaluate((el) => [...el.children].map((x) => ({ line: x.dataset.line, width: x.getBoundingClientRect().width })))
    let m = await mixed()
    expect(m[0].line).toBe(m[1].line)
    expect(m[2].line).not.toBe(m[1].line)
    const avatar = m[0].width
    expect(await page.locator('#avatar').evaluate((el) => el.getBoundingClientRect().height)).toBeCloseTo(avatar, 0)
    // Otra pieza natural: una imagen 160×80 sin alto explícito, a 460 y a 320 px
    await page.evaluate(() => { const img = new Image(); img.id = 'natural-image'; img.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="80"><rect width="160" height="80" fill="gray"/></svg>'); document.querySelector('#mixed').prepend(img) })
    await page.waitForFunction(() => document.querySelector('#natural-image').complete)
    await frames(page, 6)
    expect(await page.locator('#natural-image').evaluate((el) => el.getBoundingClientRect().width)).toBeCloseTo(160, 0)
    await page.locator('#width').evaluate((el) => { el.value = '320'; el.dispatchEvent(new Event('input', { bubbles: true })) })
    await frames(page)
    expect(await page.locator('#natural-image').evaluate((el) => el.getBoundingClientRect().width)).toBeCloseTo(160, 0)
    m = await mixed()
    expect(m.at(-1).line).not.toBe(m.at(-2).line)
    expect(errs).toEqual([])
  })

  test('compañeros C12 (#348): cajas de una línea con el mismo borde superior; el número compacto conserva su límite (240 a 720 px, LTR/RTL, gap none/md/lg)', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page)
    for (const width of [240, 320, 460, 720]) for (const dir of ['ltr', 'rtl']) for (const gap of ['none', 'md', 'lg']) {
      await page.locator('#width').evaluate((el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })) }, String(width))
      await page.locator('#direction').selectOption(dir); await page.locator('#gap').selectOption(gap)
      await frames(page)
      const fields = await page.locator('#form-layout').evaluate((el) => [...el.children].filter((x) => x.matches('.g-input')).map((x) => ({ line: x.dataset.line, top: x.querySelector('.g-input__row').getBoundingClientRect().top, width: x.getBoundingClientRect().width, inside: x.querySelector('.g-input__label').getBoundingClientRect().top >= x.getBoundingClientRect().top - 0.5 })))
      const tag = `${width} ${dir} ${gap}`
      for (const f of fields) expect(f.inside, tag).toBe(true)
      for (let i = 0; i < fields.length; i++) for (let j = i + 1; j < fields.length; j++) if (fields[i].line === fields[j].line) expect(Math.abs(fields[i].top - fields[j].top), tag).toBeLessThan(0.7)
      expect(fields[2].width, `${tag}: Cantidad 0–9 compacta`).toBeLessThan(width >= 460 ? 160 : width + 1)
    }
    expect(errs).toEqual([])
  })

  test('500 hijos nativos: respaldo voraz, una pista por línea, coste medido y limpieza de observadores al montar y desmontar', async ({ page, browserName }) => {
    const errs = watchConsole(page)
    await page.addInitScript(() => {
      const targets = (window.__roTargets = new Set())
      const RO = window.ResizeObserver
      window.ResizeObserver = class extends RO { observe(t, ...a) { targets.add(t); return super.observe(t, ...a) } unobserve(t) { targets.delete(t); return super.unobserve(t) } }
    })
    await open(page)
    await page.locator('#count').selectOption('500')
    const t0 = Date.now()
    await page.locator('#mount').click()
    await page.waitForSelector('#performance.is-ready')
    const cold = Date.now() - t0
    const perf = page.locator('#performance')
    expect(await perf.getAttribute('data-strategy')).toBe('linear')
    expect(await perf.evaluate((el) => el.classList.contains('has-shared-tracks'))).toBe(false)
    expect(await perf.evaluate((el) => el.style.getPropertyValue('--_adaptive-rows'))).toBe('none')
    expect(await perf.evaluate((el) => el.children.length)).toBe(500)
    const samples = await page.evaluate(async () => {
      const raf = () => new Promise((r) => requestAnimationFrame(() => r()))
      const input = document.querySelector('#width'), out = []
      for (let i = 0; i < 12; i++) { const t = performance.now(); input.value = String(i % 2 ? 460 : 1120); input.dispatchEvent(new Event('input', { bubbles: true })); await raf(); await raf(); out.push(performance.now() - t) }
      return out.sort((a, b) => a - b)
    })
    test.info().annotations.push({ type: 'rendimiento', description: `${browserName}: 500 nativos, montaje ${cold} ms; redimensionado p50 ${samples[6].toFixed(1)} ms, p95 ${samples[11].toFixed(1)} ms (dos cuadros)` })
    await page.locator('#mount').click()
    await frames(page)
    const baseline = await page.evaluate(() => window.__roTargets.size)
    for (let i = 0; i < 10; i++) { await page.locator('#mount').click(); await page.waitForSelector('#performance.is-ready'); await page.locator('#mount').click() }
    await frames(page)
    expect(await page.evaluate(() => window.__roTargets.size)).toBe(baseline)
    expect(await page.evaluate(() => [...window.__roTargets].filter((x) => !x.isConnected).length)).toBe(0)
    expect(errs).toEqual([])
  })

  test('el banco real usa la API corregida sin avisos: valores nuevos, pistas en el hijo y regla de la página', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page)
    for (const sel of ['#address', '#mixed', '#native', '#hinted', '#summary-layout']) await expect(page.locator(sel)).toHaveClass(/is-ready/)
    await expect(page.locator('#address')).toHaveClass(/g-adaptive-layout--horizontal-start/)
    await expect(page.locator('#address')).toHaveClass(/g-adaptive-layout--gap-md/)
    // la regla .campo-cp { --g-adapt-chars: 5 } vale como el style en línea: el código postal queda corto y acotado
    // (el id de GInput va al <input>; la raíz, hijo directo del layout, es su .g-input)
    const cp = await page.locator('.g-input:has(#hinted-cp)').evaluate((el) => ({ chars: getComputedStyle(el).getPropertyValue('--g-adapt-chars').trim(), width: el.getBoundingClientRect().width, colonia: el.nextElementSibling.getBoundingClientRect().width }))
    expect(Number(cp.chars)).toBe(5)
    expect(cp.width).toBeLessThan(cp.colonia)
    expect(errs).toEqual([])
  })
})
