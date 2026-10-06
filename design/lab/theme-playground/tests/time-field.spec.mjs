// GTimeField sobre el COMPONENTE REAL del playground (packages/vue/playground, #sec-time; entrada @grana/vue/time-field →
// dist/time-field.umd.js), en Chromium, Firefox y WebKit. Port de design/lab/time-field/verificar.mjs (kiwi: base y A) y de
// los puntos de navegador del contrato (design/contracts/time-field.md «Verificación · Playwright»; DECISIONS.md #400 a
// #414): árbol accesible (ariaSnapshot y CDP en Chromium), escritura en varios idiomas, filtro, pegado, pasos y arco,
// «ahora» con ?now=, 12 h con a. m./p. m. sin mover el foco, las dos lecturas en 24 h, data-compact en g-form-w-xs, la
// lectura a la separación de la caja, error propio al salir y al enviar, envío canónico, fila con GInput, GDatePicker y
// GSelect (Δ top y alto ≤ 1px a 1100/720/320), mínimo publicado en 12 h, RTL y 320px sin desborde.
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/index.html'

async function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana GTimeField|\[Grana\] <GInput>/.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}
async function open(page, { width = 1280, motion = 'reduce', query = '?now=10:40' } = {}) {
  await page.emulateMedia({ reducedMotion: motion })
  await page.setViewportSize({ width, height: 900 })
  await page.goto(PAGE + query)
  await page.waitForSelector('#tf-cita')
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
  await page.evaluate(() => document.fonts.ready)
  await page.locator('#sec-time').scrollIntoViewIfNeeded()
}
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 30)))))
const val = (page, id) => page.evaluate((i) => document.getElementById(i).value, id)
const attr = (page, id, a) => page.evaluate(([i, x]) => document.getElementById(i).getAttribute(x), [id, a])
const act = (page) => page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName)
const model = async (page, key) => {
  const t = await page.locator('#tf-model').textContent()
  const m = t.match(new RegExp(`(?:^|· )${key}: (null|"[^"]*")`))
  return m ? JSON.parse(m[1]) : undefined
}
async function setVal(page, id, text, { blur = true } = {}) {
  await page.click('#' + id)
  await page.evaluate((i) => document.getElementById(i).select(), id)
  await page.keyboard.press('Backspace')
  if (text) await page.keyboard.type(text)
  if (blur) await page.evaluate((i) => document.getElementById(i).blur(), id)
  await settle(page)
}
const root = (page, id) => page.locator(`#${id} >> xpath=ancestor::div[contains(@class,"g-input ")][1]`)

test.describe('GTimeField · componente real (time-field.md)', () => {
  test('carga: formato por idioma, modelos «HH:mm» o null, spinbutton y oculto canónico', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    expect(await val(page, 'tf-cita')).toBe('9:07')
    expect(await val(page, 'tf-evento')).toBe('14:05:30')
    expect(await val(page, 'tf12-toma')).toMatch(/^9:30\s?p\.\s?m\.$/)
    expect((await val(page, 'tf-ar')).replace(/\s/g, ' '), 'cualquier espacio antes del marcador (cambia por motor)').toBe('٩:٣٠ م')
    expect(await attr(page, 'tf-ar', 'dir')).toBe('rtl')
    expect(await val(page, 'tf-fi')).toBe('21.30')
    expect(await val(page, 'tf-ko')).toBe('오후 9:30')
    expect(await val(page, 'tf-he')).toBe('21:30')
    expect(await attr(page, 'tf-he', 'dir')).toBe('rtl')
    for (const k of ['cita', 'toma', 'turno', 'evento', 'c12', 't12', 'ar']) {
      const v = await model(page, k)
      expect(v === null || /^\d\d:\d\d(:\d\d)?$/.test(v), `${k}: ${v}`).toBe(true)
    }
    const a = await page.evaluate(() => { const i = document.getElementById('tf-cita'); return [i.type, i.getAttribute('role'), i.inputMode, i.getAttribute('aria-valuenow'), i.getAttribute('aria-valuetext'), i.getAttribute('aria-valuemin'), i.getAttribute('aria-valuemax'), i.hasAttribute('name')] })
    expect(a).toEqual(['text', 'spinbutton', 'numeric', '547', '9:07 de la mañana', '480', '1080', false])
    const hid = await page.evaluate(() => { const h = document.getElementById('tf-cita').closest('.g-input').querySelector('input[type=hidden]'); return [h.name, h.value, h.disabled] })
    expect(hid).toEqual(['cita', '09:07', false])
    expect(await attr(page, 'tf-turno', 'aria-valuemin'), 'arco 22:00–06:00: sin valuemin').toBe(null)
    expect(await attr(page, 'tf-toma', 'aria-required')).toBe('true')
    expect(await attr(page, 'tf-toma', 'required')).toBe(null)
    expect(errs).toEqual([])
  })

  test('árbol accesible: spinbutton con la hora en palabras; a. m./p. m. nombrados con la etiqueta, pulsados y fuera del Tab', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page)
    const snap = await page.locator('#tf-form').ariaSnapshot()
    expect(snap).toMatch(/spinbutton "Hora de la cita/)
    const s12 = await page.locator('#tf-12').ariaSnapshot()
    expect(s12).toMatch(/button "p\.\s?m\. Hora de la toma" \[pressed\]/)
    expect(s12).toMatch(/button "a\.\s?m\. Hora de la toma"/)
    expect(await page.locator('#tf-12 .g-time-field__half').first().getAttribute('tabindex')).toBe('-1')
    if (browserName === 'chromium') {
      const cdp = await page.context().newCDPSession(page)
      await cdp.send('Accessibility.enable')
      const { result } = await cdp.send('Runtime.evaluate', { expression: "document.getElementById('tf12-toma')" })
      const { node } = await cdp.send('DOM.describeNode', { objectId: result.objectId })
      const { nodes } = await cdp.send('Accessibility.queryAXTree', { backendNodeId: node.backendNodeId })
      const n = nodes[0]
      const props = Object.fromEntries((n.properties || []).map((x) => [x.name, x.value.value]))
      expect(n.role.value).toBe('spinbutton')
      expect(n.name.value).toBe('Hora de la toma')
      expect(n.value.value).toBe(1290)
      // Límite de Chromium (medido aquí): en un spinbutton EDITABLE expone como valuetext el texto del campo, no
      // aria-valuetext; la franja llega por el atributo a los demás motores y lectores (pendiente de lector real)
      expect(props.valuetext).toMatch(/^9:30\s?p\.\s?m\.$/)
    }
    expect(await attr(page, 'tf12-toma', 'aria-valuetext')).toBe('9:30 de la noche')
    expect(await attr(page, 'tf-cita', 'aria-valuetext')).toBe('9:07 de la mañana')
    // Tab no se detiene en a. m./p. m.
    await page.focus('#tf12-cita')
    await page.keyboard.press('Tab')
    expect(await act(page)).toBe('tf12-toma')
    expect(errs).toEqual([])
  })

  test('escritura libre: cifras, h, marcadores, franjas; filtro; lo ilegible se conserva', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    const cases = [['930', '09:30', '9:30'], ['2130', '21:30', '21:30'], ['9h30', '09:30', '9:30'], ['9.30', '09:30', '9:30'], ['21', '21:00', '21:00'], ['0005', '00:05', '0:05'], ['24', '00:00', '0:00'], ['9.30p', '21:30', '21:30'], ['9 noche', '21:00', '21:00'], ['7 de la tarde', '19:00', '19:00'], ['mediodía', '12:00', '12:00'], ['3 madrugada', '03:00', '3:00']]
    for (const [t, m, shown] of cases) {
      await setVal(page, 'tf-tele', t)
      expect([t, await model(page, 'tele'), await val(page, 'tf-tele')]).toEqual([t, m, shown])
    }
    await setVal(page, 'tf-tele', 'xyz!')
    expect(await val(page, 'tf-tele')).toBe('')
    await setVal(page, 'tf-tele', '9:3')
    expect(await model(page, 'tele')).toBe(null)
    expect(await val(page, 'tf-tele')).toBe('9:3')
    // otros idiomas
    await setVal(page, 'tf-ar', '٢١٣٠')
    expect(await page.evaluate(() => document.getElementById('tf-ar').getAttribute('aria-valuenow'))).toBe('1290')
    await setVal(page, 'tf-ko', '오전 7:15')
    expect(await attr(page, 'tf-ko', 'aria-valuenow')).toBe(String(7 * 60 + 15))
    await setVal(page, 'tf-fi', '7.45')
    expect(await val(page, 'tf-fi')).toBe('7.45')
    expect(await attr(page, 'tf-fi', 'aria-valuenow')).toBe(String(7 * 60 + 45))
    expect(errs).toEqual([])
  })

  test('pegar una fecha y hora ISO → su hora, formateada', async ({ page, browserName }) => {
    await open(page)
    await page.click('#tf-tele')
    const r = await page.evaluate(() => {
      const el = document.getElementById('tf-tele')
      const dt = new DataTransfer()
      dt.setData('text/plain', '2026-10-06T14:05')
      let ev
      try { ev = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt }) } catch { return 'sin-constructor' }
      if (!ev.clipboardData || !ev.clipboardData.getData('text/plain')) return 'sin-datos'
      el.dispatchEvent(ev)
      return 'ok'
    })
    test.skip(r !== 'ok', `${browserName}: pegado no verificable con evento sintético (${r})`)
    await settle(page)
    expect(await val(page, 'tf-tele')).toBe('14:05')
    expect(await model(page, 'tele')).toBe('14:05')
  })

  test('pasos: rejilla desde min, una hora, máximo, vuelta a medianoche, arco 22:00–06:00, vacío = ahora (?now=10:40)', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    const key = async (id, k, field) => { await page.focus('#' + id); await page.keyboard.press(k); await settle(page); return model(page, field) }
    await setVal(page, 'tf-cita', '9:07', { blur: false })
    expect(await key('tf-cita', 'ArrowUp', 'cita')).toBe('09:15')
    expect(await key('tf-cita', 'ArrowDown', 'cita')).toBe('09:00')
    expect(await key('tf-cita', 'Shift+ArrowUp', 'cita')).toBe('10:00')
    expect(await key('tf-cita', 'PageDown', 'cita')).toBe('09:00')
    expect(await page.evaluate(() => { const i = document.getElementById('tf-cita'); return i.selectionStart === i.value.length })).toBe(true)
    await setVal(page, 'tf-cita', '17:50', { blur: false })
    expect(await key('tf-cita', 'ArrowUp', 'cita')).toBe('18:00')
    expect(await key('tf-cita', 'ArrowUp', 'cita')).toBe('18:00')
    await setVal(page, 'tf-turno', '23:30', { blur: false })
    expect(await key('tf-turno', 'ArrowUp', 'turno')).toBe('00:00')
    await setVal(page, 'tf-turno', '5:30', { blur: false })
    expect(await key('tf-turno', 'ArrowUp', 'turno')).toBe('06:00')
    expect(await key('tf-turno', 'ArrowUp', 'turno')).toBe('06:00')
    await setVal(page, 'tf-turno', '12:00', { blur: false })
    expect(await key('tf-turno', 'ArrowUp', 'turno')).toBe('22:00')
    await setVal(page, 'tf-tele', '23:45', { blur: false })
    expect(await key('tf-tele', 'ArrowUp', 'tele')).toBe('23:46')
    await setVal(page, 'tf-tele', '23:59', { blur: false })
    expect(await key('tf-tele', 'ArrowUp', 'tele')).toBe('00:00')
    await setVal(page, 'tf-tele', '', { blur: false })
    expect(await key('tf-tele', 'ArrowUp', 'tele')).toBe('10:40')
    expect(errs).toEqual([])
  })

  test('change: una vez por gesto de paso (al soltar la tecla); salir sin cambios no emite', async ({ page }) => {
    await open(page)
    const cnt = () => page.evaluate(() => +document.getElementById('tf-changes').textContent)
    await page.focus('#tf-cita')
    const before = await cnt()
    await page.keyboard.down('ArrowDown')
    await page.keyboard.up('ArrowDown')
    await settle(page)
    expect(await cnt()).toBe(before + 1)
    await page.evaluate(() => document.getElementById('tf-cita').blur())
    await settle(page)
    expect(await cnt()).toBe(before + 1)
  })

  test('12 h: «9» de la mañana, «9.30p», 24 h escrita, «a» cambia la mitad, a. m./p. m. sin mover el foco y ≥ 24px', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    await setVal(page, 'tf12-cita', '9')
    expect(await model(page, 'c12')).toBe('09:00')
    await setVal(page, 'tf12-cita', '9.30p')
    expect(await model(page, 'c12')).toBe('21:30')
    await setVal(page, 'tf12-cita', '2130')
    expect(await model(page, 'c12')).toBe('21:30')
    expect(await val(page, 'tf12-cita')).toMatch(/^9:30\s?p\.\s?m\.$/)
    await page.focus('#tf12-cita')
    await page.keyboard.press('a')
    await settle(page)
    expect(await model(page, 'c12')).toBe('09:30')
    await setVal(page, 'tf12-cita', '9')
    expect(await model(page, 'c12'), 'con la anterior de la mañana, «9» sigue en la mañana').toBe('09:00')
    await page.evaluate(() => document.activeElement?.blur())
    const pm = page.locator('#tf-12 .g-time-field__half[data-half=pm]').first()
    await pm.click()
    await settle(page)
    expect(await model(page, 'c12')).toBe('21:00')
    expect(await act(page)).not.toBe('tf12-cita')
    expect(await pm.getAttribute('aria-pressed')).toBe('true')
    const b = await pm.boundingBox()
    expect(b.width >= 24 && b.height >= 24, `${b.width}×${b.height}`).toBe(true)
    // con el foco en el campo, pulsar a. m. lo deja en el campo
    await page.focus('#tf12-cita')
    await page.locator('#tf-12 .g-time-field__half[data-half=am]').first().click()
    await settle(page)
    expect(await act(page)).toBe('tf12-cita')
    expect(await model(page, 'c12')).toBe('09:00')
    expect(errs).toEqual([])
  })

  test('24 h: «9» ofrece las dos lecturas; un toque fija la noche con el foco en el campo; se van al salir', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    await setVal(page, 'tf-toma', '9', { blur: false })
    const ch = await page.evaluate(() => [...document.getElementById('tf-toma').closest('.g-input').querySelectorAll('.g-time-field__choice')].map((b) => [b.getAttribute('aria-pressed'), b.getAttribute('tabindex'), b.textContent.replace(/\s+/g, ' ').trim()]))
    expect(ch).toEqual([['true', '-1', '9:00 de la mañana'], ['false', '-1', '21:00 de la noche']])
    const snap = await root(page, 'tf-toma').ariaSnapshot()
    expect(snap).toMatch(/button "21:00 de la noche Hora de la toma"/)
    await root(page, 'tf-toma').locator('.g-time-field__choice').nth(1).click()
    await settle(page)
    expect(await model(page, 'toma')).toBe('21:00')
    expect(await act(page)).toBe('tf-toma')
    expect(await val(page, 'tf-toma')).toBe('21:00')
    expect(await root(page, 'tf-toma').locator('.g-time-field__choice').count()).toBe(0)
    await setVal(page, 'tf-toma', '9:30', { blur: false })
    expect(await root(page, 'tf-toma').locator('.g-time-field__choice').count()).toBe(2)
    await page.evaluate(() => document.getElementById('tf-toma').blur())
    await settle(page)
    expect(await root(page, 'tf-toma').locator('.g-time-field__choice').count()).toBe(0)
    expect(errs).toEqual([])
  })

  test('las dos lecturas en g-form-w-xs: data-compact y nunca desbordan la caja', async ({ page }) => {
    await open(page)
    await setVal(page, 'tf-r2-hora', '9', { blur: false })
    await settle(page)
    const r = await page.evaluate(() => {
      const g = document.getElementById('tf-r2-hora').closest('.g-input')
      const c = g.querySelector('.g-input__control')
      return { compact: g.querySelector('.g-time-field__choices').hasAttribute('data-compact'), over: c.scrollWidth - c.clientWidth }
    })
    expect(r.compact).toBe(true)
    expect(r.over).toBeLessThanOrEqual(1)
  })

  test('la lectura en palabras va a la separación de la caja (8px en md) y no empuja la hora', async ({ page }) => {
    await open(page)
    const r = await page.evaluate(() => {
      const g = document.getElementById('tf-cita').closest('.g-input')
      const cell = g.querySelector('.g-time-field__value').getBoundingClientRect()
      const word = g.querySelector('.g-time-field__reading-word').getBoundingClientRect()
      const probe = document.createElement('div'); probe.style.inlineSize = 'calc(var(--g-space-1) * 2)'; g.appendChild(probe)
      const gap = probe.getBoundingClientRect().width; probe.remove()
      return { d: word.left - cell.right, gap, text: g.querySelector('.g-time-field__reading-word').textContent }
    })
    expect(r.text).toBe('de la mañana')
    expect(Math.abs(r.d - r.gap), JSON.stringify(r)).toBeLessThanOrEqual(1.5)
  })

  test('error propio: al salir con «99:99» se ve y el texto se conserva; el envío se bloquea con el foco en el campo', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    await setVal(page, 'tf-toma', '99:99', { blur: false })
    await page.keyboard.press('Tab')
    await settle(page)
    const bad = await page.evaluate(() => { const i = document.getElementById('tf-toma'); const g = i.closest('.g-input'); return { v: i.value, inv: i.getAttribute('aria-invalid'), msg: g.querySelector('.g-input__message').textContent, vt: i.getAttribute('aria-valuetext'), now: i.getAttribute('aria-valuenow') } })
    expect(bad).toMatchObject({ v: '99:99', inv: 'true', vt: '99:99', now: null })
    expect(bad.msg).toContain('Escribe una hora')
    await page.click('#tf-send')
    await settle(page)
    await page.waitForTimeout(100)
    expect(await page.locator('#tf-invalid').textContent()).toContain('toma')
    expect(await act(page)).toBe('tf-toma')
    expect(await page.locator('#tf-fd').textContent()).toBe('FormData: (envía el formulario)')
    // corregir: sale y el envío lleva los canónicos
    await setVal(page, 'tf-toma', '8:05')
    expect(await page.evaluate(() => document.getElementById('tf-toma').closest('.g-input').querySelector('.g-input__message').textContent)).toBe('')
    await setVal(page, 'tf-cita', '9:15')
    await page.click('#tf-send')
    await settle(page)
    const sent = await page.locator('#tf-fd').textContent()
    expect(sent).toContain('toma="08:05"')
    expect(sent).toContain('cita="09:15"')
    expect(sent).toContain('evento="14:05:30"')
    expect(errs).toEqual([])
  })

  test('error propio fuera de GForm: al salir, con validationMessage; sale al vaciar', async ({ page }) => {
    await open(page)
    await setVal(page, 'tf-solo', '25')
    const r = await page.evaluate(() => { const i = document.getElementById('tf-solo'); return [i.validationMessage, i.closest('.g-input').querySelector('.g-input__message').textContent] })
    expect(r[0]).toContain('Escribe una hora')
    expect(r[1]).toContain('Escribe una hora')
    await setVal(page, 'tf-solo', '')
    expect(await page.evaluate(() => document.getElementById('tf-solo').validationMessage)).toBe('')
  })

  test('solo lectura y deshabilitado', async ({ page }) => {
    await open(page)
    await page.focus('#tf-ro')
    await page.keyboard.press('ArrowUp')
    const ro = await page.evaluate(() => { const i = document.getElementById('tf-ro'); const g = i.closest('.g-input'); return { ro: i.readOnly, aria: i.getAttribute('aria-readonly'), v: i.value, hidden: g.querySelector('input[type=hidden]').disabled } })
    expect(ro).toEqual({ ro: true, aria: 'true', v: '7:45', hidden: false })
    expect(await page.locator('#tf-ro12 >> xpath=ancestor::div[contains(@class,"g-input ")][1]').locator('.g-time-field__halves').count()).toBe(0)
    const dis = await page.evaluate(() => { const i = document.getElementById('tf-dis'); const g = i.closest('.g-input'); return [i.disabled, g.querySelector('input[type=hidden]').disabled, [...g.querySelectorAll('.g-time-field__half')].every((b) => b.disabled)] })
    expect(dis).toEqual([true, true, true])
  })

  test('fila con GDatePicker, GSelect y GInput: Δ top y alto ≤ 1px a 1100/720/320', async ({ page }) => {
    const errs = await watchConsole(page)
    for (const w of [1100, 720, 320]) {
      await open(page, { width: w })
      await settle(page)
      for (const rowId of ['tf-row', 'tf-row2']) {
        const rows = await page.evaluate((id) => {
          const lines = new Map()
          for (const f of document.getElementById(id).children) {
            const c = f.querySelector(':scope > .g-input__row, :scope > .g-select__control, :scope > .g-datepicker__field').getBoundingClientRect()
            const k = f.dataset.line ?? String(Math.round(f.getBoundingClientRect().top))
            if (!lines.has(k)) lines.set(k, [])
            lines.get(k).push({ top: c.top, h: c.height })
          }
          return [...lines.values()]
        }, rowId)
        const spread = rows.map((l) => Math.max(...l.map((x) => x.top)) - Math.min(...l.map((x) => x.top)))
        const hs = rows.flat().map((x) => x.h)
        expect(spread.every((d) => d <= 1), `${rowId} a ${w}: Δ top ${spread}`).toBe(true)
        expect(Math.max(...hs) - Math.min(...hs), `${rowId} a ${w}: alturas ${hs}`).toBeLessThanOrEqual(1)
      }
    }
    expect(errs).toEqual([])
  })

  test('mínimo publicado en 12 h: la fila se parte antes de que «12:59 p.m.» y a. m./p. m. dejen de caber; desbloquear no reparte', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    await setVal(page, 'tf-r-hora', '12:59p')
    expect(await val(page, 'tf-r-hora')).toMatch(/^12:59\s?p\.\s?m\.$/)
    const probe = () => page.evaluate(() => {
      const g = document.getElementById('tf-r-hora').closest('.g-input')
      const mirror = g.querySelector('.g-time-field__mirror')
      const ctl = g.querySelector('.g-input__control')
      const row = document.getElementById('tf-row')
      return { clipped: mirror.scrollWidth - mirror.clientWidth, over: ctl.scrollWidth - ctl.clientWidth, lines: row.dataset.lines, line: [...row.children].map((c) => c.dataset.line).join(',') }
    })
    const bad = []
    let lastLines = null
    let split = false
    for (let w = 900; w >= 260; w -= 20) {
      await page.evaluate((px) => { document.getElementById('tf-row').closest('.g-form-layout').style.inlineSize = px + 'px' }, w)
      await settle(page)
      const p = await probe()
      if (p.clipped > 1 || p.over > 1) bad.push(`${w}: recorte ${p.clipped}, desborde ${p.over} (líneas ${p.lines})`)
      if (lastLines && p.lines !== lastLines) split = true
      lastLines = p.lines
    }
    expect(split, 'la fila llega a partirse').toBe(true)
    expect(bad).toEqual([])
    for (const w of [700, 520, 400]) {
      await page.evaluate((px) => { document.getElementById('tf-row').closest('.g-form-layout').style.inlineSize = px + 'px' }, w)
      await page.locator('#tf-lock').setChecked(true)
      await settle(page)
      const locked = await probe()
      await page.locator('#tf-lock').setChecked(false)
      await settle(page)
      const unlocked = await probe()
      expect(unlocked.line, `a ${w}: misma distribución con y sin bloqueo`).toBe(locked.line)
    }
    expect(errs).toEqual([])
  })

  test('RTL: ar-EG con el marcador al final lógico y a. m./p. m. a la izquierda', async ({ page }) => {
    await open(page)
    const r = await page.evaluate(() => {
      const i = document.getElementById('tf-ar')
      const c = i.closest('.g-input__control').getBoundingClientRect()
      const h = i.closest('.g-input').querySelector('.g-time-field__halves').getBoundingClientRect()
      return { dir: getComputedStyle(i).direction, halvesLeft: h.left - c.left, text: i.value }
    })
    expect(r.dir).toBe('rtl')
    expect(r.halvesLeft).toBeLessThanOrEqual(1)
    expect(r.text.replace(/\s/g, ' ')).toBe('٩:٣٠ م')
  })

  for (const dir of ['ltr', 'rtl']) {
    test(`320px ${dir}: sin desbordamiento horizontal`, async ({ page }) => {
      await open(page, { width: 320 })
      if (dir === 'rtl') await page.evaluate(() => { document.getElementById('sec-time').setAttribute('dir', 'rtl') })
      await settle(page)
      const r = await page.evaluate(() => {
        const sec = document.getElementById('sec-time')
        const right = sec.getBoundingClientRect().right
        const out = [...sec.querySelectorAll('.g-time-field .g-input__control')].filter((c) => c.getBoundingClientRect().right > right + 1 || c.scrollWidth > c.clientWidth + 1).map((c) => c.querySelector('input').id)
        return { out, page: document.documentElement.scrollWidth - document.documentElement.clientWidth }
      })
      expect(r.out).toEqual([])
      expect(r.page).toBeLessThanOrEqual(1)
    })
  }
})
