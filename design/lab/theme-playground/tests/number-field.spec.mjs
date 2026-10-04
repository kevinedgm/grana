// GNumberField sobre el COMPONENTE REAL del playground (packages/vue/playground, #sec-number y la receta de signos vitales
// de #sec-form), en Chromium, Firefox y WebKit. Port de design/lab/number-field/r01/verificar.mjs (kiwi, 233/233) y de los
// puntos de navegador del contrato (design/contracts/number-field.md «Verificación · Playwright»; DECISIONS.md #309 a
// #314): árbol accesible (ariaSnapshot y CDP en Chromium), teclado, Intl, pegado, FormData canónico, −/+ sin foco y con
// toque, tamaños, estados, P1/P2/P3, fila con GInput y GSelect (Δ top ≤ 1px y misma altura), mínimo publicado (#312),
// RTL ar-EG/he, envío con is-rejected y 320px sin desborde. La distribución de signos vitales está en
// form-distribution.spec.mjs (#184).
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/index.html'

async function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana GNumberField|\[Grana\] <GInput>/.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}
async function open(page, { width = 1280, motion = 'reduce' } = {}) {
  await page.emulateMedia({ reducedMotion: motion })
  await page.setViewportSize({ width, height: 900 })
  await page.goto(PAGE)
  await page.waitForSelector('#nf-qty')
  // Sin desplazamiento suave del armazón del playground: las medidas de P2/P3 son relativas a la caja y estables
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
  await page.evaluate(() => document.fonts.ready)
  await page.locator('#sec-number').scrollIntoViewIfNeeded()
}
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 30)))))
const st = (page, id) => page.evaluate((i) => {
  const el = document.getElementById(i)
  const nowv = el.getAttribute('aria-valuenow')
  return { text: el.value, now: nowv === null ? null : Number(nowv), sel: [el.selectionStart, el.selectionEnd] }
}, id)
const model = async (page, key) => {
  const t = await page.locator('#nf-model').textContent()
  const m = t.match(new RegExp(`${key}: (\\S+) \\((\\w+)\\)`))
  return m ? { v: JSON.parse(m[1]), type: m[2] } : null
}
async function setVal(page, id, text) {
  await page.click('#' + id)
  await page.evaluate((i) => document.getElementById(i).select(), id)
  await page.keyboard.press('Backspace')
  if (text) await page.keyboard.type(text)
}
const act = (page) => page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName)
const btn = (id, kind) => `#${id} >> xpath=ancestor::div[contains(@class,"g-input ")][1]//button[contains(@class,"g-number-field__step--${kind}")]`
const center = async (page, sel) => { const r = await page.locator(sel).boundingBox(); return [r.x + r.width / 2, r.y + r.height / 2] }

test.describe('GNumberField · componente real (number-field.md)', () => {
  test('carga: formato del idioma (es), modelos Number o null y atributos del spinbutton', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    expect((await st(page, 'nf-peso')).text).toBe('72,5')
    expect((await st(page, 'nf-pob')).text).toBe('12.345')
    expect((await st(page, 'nf-big')).text).toBe('1234,50')
    for (const k of ['edad', 'peso', 'temp', 'pct', 'qty', 'pob']) expect(['number', 'null']).toContain((await model(page, k)).type)
    const a = await page.evaluate(() => { const i = document.getElementById('nf-peso'); return [i.type, i.getAttribute('role'), i.getAttribute('inputmode'), i.getAttribute('dir'), document.getElementById('nf-edad').getAttribute('inputmode'), i.hasAttribute('name')] })
    expect(a).toEqual(['text', 'spinbutton', 'decimal', 'ltr', 'numeric', false])
    const desc = await page.evaluate(() => { const ids = document.getElementById('nf-peso').getAttribute('aria-describedby').split(' '); return [ids[0], document.getElementById(ids[0]).textContent, ids[1]] })
    expect(desc, 'la unidad (expansión) antes de la ayuda (#166)').toEqual(['nf-peso-suffix', 'kilogramos', 'nf-peso-hint'])
    expect(errs).toEqual([])
  })

  test('árbol accesible: spinbutton con valor legible, −/+ nombrados (acción + etiqueta) y fuera del Tab', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page)
    const snap = await page.locator('#nf-form').ariaSnapshot()
    expect(snap).toMatch(/spinbutton "Peso": "?72,5"?/)
    expect(snap).toMatch(/spinbutton "Edad"/)
    expect(snap).toMatch(/button "Restar Cantidad" \[disabled\]/)
    expect(snap).toMatch(/button "Sumar Cantidad"/)
    if (browserName === 'chromium') {
      const cdp = await page.context().newCDPSession(page)
      await cdp.send('Accessibility.enable')
      const ax = async (sel) => {
        const { result } = await cdp.send('Runtime.evaluate', { expression: `document.querySelector('${sel}')` })
        const { node } = await cdp.send('DOM.describeNode', { objectId: result.objectId })
        const { nodes } = await cdp.send('Accessibility.queryAXTree', { backendNodeId: node.backendNodeId })
        const n = nodes[0]
        const props = Object.fromEntries((n.properties || []).map((x) => [x.name, x.value.value]))
        return { role: n.role?.value, name: n.name?.value, value: n.value?.value, desc: n.description?.value, ...props }
      }
      const peso = await ax('#nf-peso')
      expect(peso.role).toBe('spinbutton')
      expect([peso.valuemin, peso.valuemax, peso.value, peso.valuetext, peso.editable]).toEqual([0, 400, 72.5, '72,5', 'plaintext'])
      expect(peso.desc).toMatch(/kilogramos/)
      const out = await ax('#nf-out')
      expect(out.valuetext, 'fuera de rango: valuetext conserva lo escrito aunque Chromium recorte valuenow').toBe('150')
      expect(out.invalid).toBe('true')
      const qty = await ax('#nf-qty')
      expect(qty.required === undefined || qty.required === false).toBe(true)
      const ro = await ax('#nf-ro')
      expect(ro.role).toBe('spinbutton')
      expect(ro.focusable).toBe(true)
    }
    expect(errs).toEqual([])
  })

  test('teclado: ↑/↓, Shift ×10, Av Pág, Inicio/Fin, filtro, fuera de rango, separador, precisión, parcial, rejilla, miles', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    await setVal(page, 'nf-edad', '36')
    expect(await model(page, 'edad')).toEqual({ v: 36, type: 'number' })
    await page.keyboard.press('ArrowUp'); expect((await st(page, 'nf-edad')).now).toBe(37)
    await page.keyboard.press('Shift+ArrowUp'); expect((await st(page, 'nf-edad')).now).toBe(47)
    await page.keyboard.press('PageDown'); expect((await st(page, 'nf-edad')).now).toBe(37)
    await page.keyboard.press('ArrowDown'); expect((await st(page, 'nf-edad')).now).toBe(36)
    // Inicio/Fin son edición de texto (nativo): el componente no los intercepta (en macOS no mueven el cursor por
    // convención del sistema, así que se comprueba que no se cancelan ni cambian el valor)
    const homeEnd = await page.locator('#nf-edad').evaluate((el) => ['Home', 'End'].map((k) => { const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }); el.dispatchEvent(e); return e.defaultPrevented }))
    expect(homeEnd).toEqual([false, false])
    await page.keyboard.press('Home'); expect((await st(page, 'nf-edad')).now).toBe(36)
    await page.keyboard.press('End'); expect((await st(page, 'nf-edad')).now).toBe(36)
    await page.keyboard.type('a,e')
    expect((await st(page, 'nf-edad')).text, 'Edad (entero): «a», «,» y «e» no entran').toBe('36')
    await setVal(page, 'nf-edad', '150'); await page.keyboard.press('Tab')
    expect(await model(page, 'edad'), 'fuera de rango escrito: no se recorta (#157)').toEqual({ v: 150, type: 'number' })
    expect(await page.locator('#nf-edad').getAttribute('aria-invalid')).toBe('true')
    await page.focus('#nf-edad'); await page.keyboard.press('ArrowUp')
    expect((await model(page, 'edad')).v).toBe(150)
    await page.keyboard.press('ArrowDown')
    expect((await model(page, 'edad')).v, '↓ desde fuera de rango entra al límite').toBe(120)
    // separador y precisión
    await setVal(page, 'nf-temp', '36.5')
    expect([(await st(page, 'nf-temp')).text, (await model(page, 'temp')).v]).toEqual(['36,5', 36.5])
    await setVal(page, 'nf-temp', '36,55')
    expect([(await st(page, 'nf-temp')).text, (await model(page, 'temp')).v], 'precision 1: modelo redondeado, texto crudo').toEqual(['36,55', 36.6])
    await page.keyboard.press('Tab')
    expect((await st(page, 'nf-temp')).text).toBe('36,6')
    await setVal(page, 'nf-temp', '1,')
    expect([(await st(page, 'nf-temp')).text, (await model(page, 'temp')).v], 'parcial «1,»').toEqual(['1,', 1])
    await page.keyboard.type(',.')
    expect((await st(page, 'nf-temp')).text).toBe('1,')
    await setVal(page, 'nf-temp', '')
    expect((await model(page, 'temp')).v).toBe(null)
    await page.keyboard.press('ArrowUp')
    expect((await model(page, 'temp')).v, 'vacío + ↑: el límite más cercano (min 30)').toBe(30)
    await setVal(page, 'nf-temp', '-')
    expect((await st(page, 'nf-temp')).text, 'sin negativos: «-» no entra').toBe('')
    // pasos exactos y rejilla
    await setVal(page, 'nf-peso', '72,5')
    for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowUp')
    expect((await model(page, 'peso')).v).toBe(72.8)
    await setVal(page, 'nf-peso', '72,53'); await page.keyboard.press('ArrowUp')
    expect((await model(page, 'peso')).v).toBe(72.6)
    // miles: crudo al entrar, formateado al salir
    await setVal(page, 'nf-pob', '1234567'); await page.keyboard.press('Tab')
    expect((await st(page, 'nf-pob')).text).toBe('1.234.567')
    await page.keyboard.press('Shift+Tab')
    expect((await st(page, 'nf-pob')).text).toBe('1234567')
    expect(errs).toEqual([])
  })

  test('pegar con la regla del idioma y envío con FormData canónico; change una vez al confirmar', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    const paste = (id, txt) => page.evaluate(([i, t]) => { const el = document.getElementById(i); el.focus(); el.select(); const dt = new DataTransfer(); dt.setData('text/plain', t); el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })) }, [id, txt])
    const synthetic = await page.evaluate(() => { const dt = new DataTransfer(); dt.setData('text/plain', 'x'); return new ClipboardEvent('paste', { clipboardData: dt }).clipboardData?.getData('text/plain') === 'x' })
    if (synthetic) {
      await paste('nf-pob', '12.345'); expect((await model(page, 'pob')).v).toBe(12345)
      await paste('nf-peso', '1,234.5'); expect((await model(page, 'peso')).v).toBe(1234.5)
      await paste('nf-peso', 'setenta'); expect((await model(page, 'peso')).v).toBe(1234.5)
    } else {
      test.info().annotations.push({ type: 'nota', description: 'ClipboardEvent sintético sin datos en este motor: pegado cubierto por vitest (motor)' })
    }
    await setVal(page, 'nf-edad', '40'); await setVal(page, 'nf-peso', '72,5'); await page.keyboard.press('Enter')
    await page.waitForTimeout(80)
    const fd = await page.textContent('#nf-fd')
    expect(fd).toMatch(/edad="40"/)
    expect(fd).toMatch(/peso="72.5"/)
    expect(fd).toMatch(/poblacion="12345"/)
    expect((await st(page, 'nf-peso')).text).toBe('72,5')
    expect(errs).toEqual([])
  })

  test('−/+: no roban el foco, sin foco previo no enfocan, mínimo deshabilitado, repetición al mantener, sin puntero, Tab los salta', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    await page.focus('#nf-pob')
    await page.click(btn('nf-qty', 'increment'))
    expect((await model(page, 'qty')).v).toBe(2)
    expect(await act(page), 'el foco sigue en Población').toBe('nf-pob')
    expect(await page.textContent('#nf-log')).toBe('change: qty=2')
    await page.evaluate(() => document.activeElement.blur())
    await page.click(btn('nf-qty', 'increment'))
    expect(await act(page)).toBe('BODY')
    await page.click(btn('nf-qty', 'decrement')); await page.click(btn('nf-qty', 'decrement'))
    expect((await model(page, 'qty')).v).toBe(1)
    expect(await page.isDisabled(btn('nf-qty', 'decrement'))).toBe(true)
    const [x, y] = await center(page, btn('nf-qty', 'increment'))
    await page.mouse.move(x, y); await page.mouse.down(); await page.waitForTimeout(1000); await page.mouse.up()
    const held = (await model(page, 'qty')).v
    await page.waitForTimeout(250)
    expect(held >= 6 && held <= 14, `mantener 1 s: 400 ms y luego cada 60 ms (1 → ${held})`).toBe(true)
    expect((await model(page, 'qty')).v, 'se detiene al soltar').toBe(held)
    expect(await page.textContent('#nf-log'), 'un solo change por gesto').toBe(`change: qty=${held}`)
    await page.evaluate(() => document.querySelector('#nf-qty').closest('.g-input').querySelector('.g-number-field__step--increment').click())
    expect((await model(page, 'qty')).v, 'click sin puntero (detail 0): un paso').toBe(held + 1)
    await page.focus('#nf-pct'); await page.keyboard.press('Tab')
    expect(await act(page), 'Tab: de Descuento a Cantidad sin pasar por −/+').toBe('nf-qty')
    const sizes = await page.evaluate(() => ['xs', 'sm', 'md', 'lg', 'xl', 'compact'].map((s) => { const g = document.getElementById('nf-z-' + s).closest('.g-input'); const b = g.querySelector('.g-number-field__step--increment').getBoundingClientRect(); const c = g.querySelector('.g-input__control').getBoundingClientRect(); return [s, Math.round(b.width * 10) / 10, Math.round(b.height * 10) / 10, Math.round(c.height * 10) / 10] }))
    expect(sizes.every(([, w, h]) => w >= 24 && h >= 24), `−/+ ≥ 24 × 24: ${JSON.stringify(sizes)}`).toBe(true)
    expect(errs).toEqual([])
  })

  test('estados: solo lectura enfocable sin −/+; deshabilitado; fuera de rango; negativos', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    await page.focus('#nf-ro'); await page.keyboard.press('ArrowUp')
    expect(await act(page)).toBe('nf-ro')
    expect((await st(page, 'nf-ro')).now).toBe(72.5)
    expect(await page.locator('#nf-ro').evaluate((i) => i.closest('.g-input').querySelector('.g-number-field__steppers'))).toBe(null)
    expect(await page.evaluate(() => { const g = document.getElementById('nf-dis').closest('.g-input'); return document.getElementById('nf-dis').disabled && [...g.querySelectorAll('.g-number-field__step')].every((b) => b.disabled) })).toBe(true)
    expect(await page.isDisabled(btn('nf-out', 'increment'))).toBe(true)
    expect(await page.isDisabled(btn('nf-out', 'decrement'))).toBe(false)
    expect(await page.evaluate(() => { const i = document.getElementById('nf-neg'); return [i.value, i.getAttribute('inputmode')] })).toEqual(['-18', 'numeric'])
    expect(errs).toEqual([])
  })

  test('P1: la unidad va a la misma distancia del valor; pulsar el área vacía enfoca con el cursor al final', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    const gapOf = () => page.evaluate(() => { const el = document.getElementById('nf-peso'); const v = el.closest('.g-number-field__value').getBoundingClientRect(); const sf = el.closest('.g-input__control').querySelector('.g-input__suffix').getBoundingClientRect(); return Math.round((sf.left - v.right) * 10) / 10 })
    const gaps = []
    for (const t of ['7', '72,5', '1234,5']) { await setVal(page, 'nf-peso', t); await page.keyboard.press('Tab'); gaps.push(await gapOf()) }
    expect(Math.max(...gaps) - Math.min(...gaps), `misma distancia con 1, 4 y 6 caracteres (${gaps})`).toBeLessThanOrEqual(0.5)
    expect(gaps[0]).toBeLessThanOrEqual(10)
    const ctl = await page.locator('#nf-temp').evaluate((el) => { const c = el.closest('.g-input__control').getBoundingClientRect(); return [c.right - 20, c.top + c.height / 2] })
    await page.mouse.click(ctl[0], ctl[1])
    const s = await st(page, 'nf-temp')
    expect(await act(page)).toBe('nf-temp')
    expect(s.sel[0]).toBe(s.text.length)
    expect(errs).toEqual([])
  })

  test('P2 y P3 con movimiento: ruedan solo las cifras que cambian y la capa se retira; al mantener no rueda; tope ≤ space × 0,5', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page, { motion: 'no-preference' })
    await setVal(page, 'nf-qty', '19'); await page.keyboard.press('Tab')
    // Medida determinista (no depende de los cuadros por segundo del motor, que bajan con carga en paralelo): al nacer la
    // capa se pausan sus animaciones (las de coco), se miden las cifras al 25/50/75 % de su duración y se reanudan
    const probe = page.evaluate(() => new Promise((res) => {
      const root = document.getElementById('nf-qty').closest('.g-input')
      const mo = new MutationObserver(() => {
        const layer = root.querySelector('.g-number-field__roll')
        if (!layer) return
        mo.disconnect()
        const anims = layer.getAnimations({ subtree: true })
        anims.forEach((a) => a.pause())
        const news = [...layer.querySelectorAll('.g-number-field__roll-slot > .g-number-field__roll-new')]
        const pos = []
        for (const f of [0.25, 0.5, 0.75]) {
          anims.forEach((a) => { a.currentTime = a.effect.getComputedTiming().duration * f })
          pos.push(news.map((e) => Math.round((e.getBoundingClientRect().top - e.parentElement.getBoundingClientRect().top) * 10) / 10))
        }
        const input = document.getElementById('nf-qty')
        const info = { slots: news.length, olds: layer.querySelectorAll('.g-number-field__roll-old').length, dir: layer.dataset.direction, hidden: layer.getAttribute('aria-hidden'), val: input.value, now: input.getAttribute('aria-valuenow'), rolling: root.querySelector('.g-number-field__value').classList.contains('is-rolling'), names: anims.map((a) => a.animationName), pos }
        anims.forEach((a) => a.play())
        res(info)
      })
      mo.observe(root, { subtree: true, childList: true })
    }))
    await page.click(btn('nf-qty', 'increment'))
    const r = await probe
    expect([r.slots, r.olds, r.dir, r.hidden, r.val, r.now, r.rolling], '19 → 20: dos cifras, hacia arriba, capa aria-hidden; el <input> y el árbol ya dicen 20').toEqual([2, 2, 'up', 'true', '20', '20', true])
    expect(r.names.length >= 2 && r.names.every((n) => n.startsWith('g-number-roll')), `animaciones de coco (${r.names})`).toBe(true)
    const mids = new Set(r.pos.map((p) => p[0]).filter((t) => t !== 0))
    expect(mids.size, `posiciones intermedias (${JSON.stringify(r.pos)})`).toBeGreaterThanOrEqual(2)
    await page.waitForFunction(() => { const g = document.getElementById('nf-qty').closest('.g-input'); return !g.querySelector('.g-number-field__roll, .is-rolling') }, null, { timeout: 3000 })
    await page.waitForTimeout(200)
    const [x, y] = await center(page, btn('nf-qty', 'increment'))
    const hold = page.evaluate(() => new Promise((res) => { let max = 0; const t0 = performance.now(); (function f() { const k = document.querySelectorAll('#nf-form .g-number-field__roll-slot').length; if (performance.now() - t0 > 450) max = Math.max(max, k); if (performance.now() - t0 < 1100) requestAnimationFrame(f); else res(max) })() }))
    await page.mouse.move(x, y); await page.mouse.down(); await page.waitForTimeout(1000); await page.mouse.up()
    expect(await hold, 'al repetir no rueda').toBe(0)
    // P3: igual, determinista: al ponerse is-bumping se pausa la animación y se mide a mitad
    await page.focus('#nf-max')
    await page.waitForTimeout(100)
    const relMax = () => page.evaluate(() => { const v = document.getElementById('nf-max').closest('.g-number-field__value'); return v.getBoundingClientRect().top - v.closest('.g-input__control').getBoundingClientRect().top })
    const relBefore = await relMax()
    const bump = page.evaluate(() => new Promise((res) => {
      const v = document.getElementById('nf-max').closest('.g-number-field__value')
      const c = v.closest('.g-input__control')
      const rel = () => v.getBoundingClientRect().top - c.getBoundingClientRect().top
      const y0 = rel()
      const mo = new MutationObserver(() => {
        if (!v.classList.contains('is-bumping')) return
        mo.disconnect()
        const anims = v.getAnimations().filter((a) => String(a.animationName).startsWith('g-number-bump'))
        anims.forEach((a) => a.pause())
        const at = [0.25, 0.5, 0.75].map((f) => { anims.forEach((a) => { a.currentTime = a.effect.getComputedTiming().duration * f }); return Math.round((rel() - y0) * 100) / 100 })
        const dir = v.dataset.bump
        anims.forEach((a) => a.play())
        res({ at, dir, names: anims.map((a) => a.animationName) })
      })
      mo.observe(v, { attributes: true, attributeFilter: ['class'] })
    }))
    await page.keyboard.press('ArrowUp')
    const b = await bump
    const dy = Math.max(...b.at.map(Math.abs))
    expect(b.dir).toBe('up')
    expect(b.names.length, 'animación g-number-bump… de coco').toBeGreaterThan(0)
    expect(dy > 0.5 && dy <= 2.01 && b.at.some((d) => d < -0.1), `tope: sube ≤ space × 0,5 (${JSON.stringify(b.at)})`).toBe(true)
    await page.waitForFunction(() => { const v = document.getElementById('nf-max').closest('.g-number-field__value'); return !v.classList.contains('is-bumping') && !v.hasAttribute('data-bump') }, null, { timeout: 3000 })
    expect(Math.abs((await relMax()) - relBefore), 'vuelve a su sitio').toBeLessThan(0.01)
    expect((await st(page, 'nf-max')).now).toBe(9)
    expect(errs).toEqual([])
  })

  test('movimiento reducido: el valor cambia sin capa ni tope y no quedan clases', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page, { motion: 'reduce' })
    const seen = page.evaluate(() => new Promise((res) => { let n = 0, b = 0; const t0 = performance.now(); (function f() { n += document.querySelectorAll('.g-number-field__roll').length; b += document.querySelectorAll('.is-bumping').length; if (performance.now() - t0 < 400) requestAnimationFrame(f); else res({ n, b }) })() }))
    await page.waitForTimeout(20)
    await page.click(btn('nf-qty', 'increment'))
    await page.focus('#nf-max'); await page.keyboard.press('ArrowUp')
    expect(await seen).toEqual({ n: 0, b: 0 })
    expect((await model(page, 'qty')).v).toBe(2)
    expect(errs).toEqual([])
  })

  test('fila con GInput y GSelect: Δ top ≤ 1px y misma altura a 1100/720/320', async ({ page }) => {
    const errs = await watchConsole(page)
    for (const w of [1100, 720, 320]) {
      await open(page, { width: w })
      await settle(page)
      const rows = await page.evaluate(() => {
        const lines = new Map()
        for (const f of document.getElementById('nf-row').children) {
          const c = f.querySelector(':scope > .g-input__row, :scope > .g-select__control').getBoundingClientRect()
          const k = f.dataset.line ?? String(Math.round(f.getBoundingClientRect().top))
          if (!lines.has(k)) lines.set(k, [])
          lines.get(k).push({ top: c.top, h: c.height })
        }
        return [...lines.values()]
      })
      const spread = rows.map((l) => Math.max(...l.map((x) => x.top)) - Math.min(...l.map((x) => x.top)))
      const hs = rows.flat().map((x) => x.h)
      expect(spread.every((d) => d <= 1), `a ${w}: Δ top ${spread}`).toBe(true)
      expect(Math.max(...hs) - Math.min(...hs), `a ${w}: alturas ${hs}`).toBeLessThanOrEqual(1)
    }
    expect(errs).toEqual([])
  })

  test('mínimo publicado (#312): la fila se parte antes de que el valor de referencia deje de caber, y desbloquear no la reparte', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    // Con el valor de referencia escrito (99, el más ancho entre min y max), la celda nunca debe quedar más estrecha que él
    await setVal(page, 'nf-row-qty', '99'); await page.keyboard.press('Tab')
    const probe = () => page.evaluate(() => {
      const g = document.getElementById('nf-row-qty').closest('.g-input')
      const cell = g.querySelector('.g-number-field__value').getBoundingClientRect().width
      const ref = g.querySelector('.g-number-field__measure').getBoundingClientRect().width
      const row = document.getElementById('nf-row')
      return { lines: row.dataset.lines, line: [...row.children].map((c) => c.dataset.line).join(','), cell, ref }
    })
    const bad = []
    let lastLines = null
    let split = false
    for (let w = 900; w >= 260; w -= 20) {
      await page.evaluate((px) => { document.getElementById('nf-layout').style.inlineSize = px + 'px' }, w)
      await settle(page)
      const p = await probe()
      if (p.cell + 0.5 < p.ref) bad.push(`${w}: celda ${p.cell.toFixed(1)} < referencia ${p.ref.toFixed(1)} (líneas ${p.lines})`)
      if (lastLines && p.lines !== lastLines) split = true
      lastLines = p.lines
    }
    expect(split, 'la fila llega a partirse').toBe(true)
    expect(bad).toEqual([])
    // Desbloquear un readonly no reparte la fila
    for (const w of [700, 520, 400]) {
      await page.evaluate((px) => { document.getElementById('nf-layout').style.inlineSize = px + 'px' }, w)
      await page.locator('#nf-lock').setChecked(true)
      await settle(page)
      const locked = await probe()
      await page.locator('#nf-lock').setChecked(false)
      await settle(page)
      const open2 = await probe()
      expect(open2.line, `a ${w}: misma distribución con y sin bloqueo`).toBe(locked.line)
    }
    expect(errs).toEqual([])
  })

  test('RTL ar-EG y he: cifras del idioma, menos delante, −/+ al final lógico; he sin marca bidi', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    const rtl = await page.evaluate(() => { const i = document.getElementById('nf-ar'); const c = i.closest('.g-input__control').getBoundingClientRect(); const s = i.closest('.g-input').querySelector('.g-number-field__steppers').getBoundingClientRect(); const v = i.closest('.g-number-field__value').getBoundingClientRect(); return { text: i.value, dir: getComputedStyle(i).direction, stepLeft: s.left - c.left, valueRight: c.right - v.right } })
    expect(rtl.text).toBe('-٤٫٥')
    expect(rtl.dir).toBe('ltr')
    expect(rtl.stepLeft, '−/+ a la izquierda en RTL').toBeLessThanOrEqual(1)
    expect(rtl.valueRight, 'el valor a la derecha').toBeLessThan(20)
    await setVal(page, 'nf-ar', '٣٫٥'); await page.keyboard.press('Tab')
    expect(await page.evaluate(() => [document.getElementById('nf-ar').value, document.getElementById('nf-ar').getAttribute('aria-valuenow')])).toEqual(['٣٫٥', '3.5'])
    await setVal(page, 'nf-ar', '-7'); await page.keyboard.press('Tab')
    expect((await st(page, 'nf-ar')).text).toBe('-٧٫٠')
    expect((await st(page, 'nf-he')).text).toBe('72.5')
    expect(errs).toEqual([])
  })

  test('envío con GForm: un GNumberField con error recibe is-rejected; el envío corregido lleva el canónico', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    await page.locator('#sec-form').scrollIntoViewIfNeeded()
    await page.fill('#fm-nombre', 'Ana'); await page.fill('#fm-ap1', 'López')
    await setVal(page, 'fm-peso', '500'); await page.keyboard.press('Tab')
    await page.locator('#fm-medium button[type="submit"][value="save"]').click()
    await page.waitForTimeout(60)
    const rej = await page.evaluate(() => { const g = document.getElementById('fm-peso').closest('.g-input'); return g.classList.contains('is-rejected') || g.getAnimations({ subtree: true }).some((a) => a.animationName?.startsWith('g-reject')) })
    expect(rej, 'is-rejected (I2) en el campo de peso').toBe(true)
    expect(await page.locator('#fm-peso').getAttribute('aria-invalid')).toBe('true')
    expect(await page.textContent('#fm-medium-log')).toMatch(/invalid .*m-peso/)
    const hidden = await page.evaluate(() => document.querySelector('#fm-medium input[type="hidden"][name="m-peso"]').value)
    expect(hidden, 'oculto canónico').toBe('500')
    expect(errs).toEqual([])
  })

  test('320px: ningún campo sale de su marco ni desborda su caja; con un número largo la unidad sigue visible', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page, { width: 320 })
    await setVal(page, 'nf-peso', '123456789,5'); await page.keyboard.press('Tab')
    await settle(page)
    const ov = await page.evaluate(() => {
      const sec = document.getElementById('sec-number')
      const bad = [...sec.querySelectorAll('.g-number-field')].filter((e) => { const r = e.getBoundingClientRect(); const p = e.parentElement.getBoundingClientRect(); return r.left < p.left - 0.5 || r.right > p.right + 0.5 }).map((e) => e.querySelector('input').id)
      const ctl = [...sec.querySelectorAll('.g-number-field .g-input__control')].filter((c) => c.scrollWidth > c.clientWidth + 1).map((c) => c.querySelector('input').id)
      const i = document.getElementById('nf-peso')
      const s = i.closest('.g-input__control').querySelector('.g-input__suffix').getBoundingClientRect()
      const c = i.closest('.g-input__control').getBoundingClientRect()
      return { bad, ctl, doc: document.documentElement.scrollWidth - innerWidth, unit: s.right <= c.right + 0.5 && s.width > 0 }
    })
    expect(ov).toEqual({ bad: [], ctl: [], doc: 0, unit: true })
    expect(errs).toEqual([])
  })
})

test.describe('GNumberField · táctil (puntero grueso)', () => {
  test.skip(({ browserName }) => browserName === 'firefox', 'Firefox: sin emulación de puntero grueso en Playwright')
  test.use({ hasTouch: true })
  test('−/+ ≥ 44 × 44 y un toque suma sin enfocar el campo', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    const coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches)
    test.skip(!coarse, 'hasTouch no activa pointer: coarse en este motor')
    const t = await page.evaluate(() => ['xs', 'md'].map((s) => { const b = document.getElementById('nf-z-' + s).closest('.g-input').querySelector('.g-number-field__step--increment').getBoundingClientRect(); return [b.width, b.height] }))
    expect(t.every(([w, h]) => w >= 44 && h >= 44), JSON.stringify(t)).toBe(true)
    await page.evaluate(() => document.activeElement?.blur())
    await page.tap(btn('nf-qty', 'increment'))
    expect((await model(page, 'qty')).v).toBe(2)
    expect(await act(page)).toBe('BODY')
    expect(errs).toEqual([])
  })
})
