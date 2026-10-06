// GFileField sobre el COMPONENTE REAL del playground (packages/vue/playground, #sec-file-field; entrada @grana/vue/file-field),
// en Chromium, Firefox y WebKit. Batería de kiwi (design/lab/file-field/verificar.mjs) y del contrato (design/contracts/
// file-field.md «Verificación · Playwright»; DECISIONS.md #366 a #379): control real con nombre compuesto, Tab y foco
// visible, abrir el diálogo, elegir, input.files sincronizado, rechazos con motivo, lleno que no abre, progreso, Δ0 de la
// ficha, ocultos, foco al quitar y al reintentar, envío bloqueado con resumen que enlaza al «Reintentar», soltar y pegar
// simulados, arrastre de página, GFormRow con GInput (Δ0), FormData nativo, 320 px LTR y RTL, objetivos ≥ 24 px, consola.
// El movimiento (aterrizaje, despertar) está en personalidad-file-field.spec.mjs.
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/index.html'

async function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana GFileField|\[Grana\] <GProgress>/.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}

async function open(page, { width = 1280, height = 900, motion = 'reduce', target = '#sec-file-field' } = {}) {
  await page.emulateMedia({ reducedMotion: motion })
  await page.setViewportSize({ width, height })
  await page.addInitScript(() => {
    window.__ffFast = true
    window.__ffLive = []
    const start = () => new MutationObserver((list) => {
      for (const m of list) {
        const el = (m.target.nodeType === 1 ? m.target : m.target.parentElement)?.closest?.('.g-file-field__live')
        const text = el && el.textContent.trim()
        if (text) window.__ffLive.push({ text, dialog: Boolean(el.closest('dialog[open]')) })
      }
    }).observe(document.documentElement, { subtree: true, childList: true, characterData: true })
    if (document.documentElement) start()
    else document.addEventListener('readystatechange', start, { once: true })
  })
  await page.goto(PAGE)
  await page.waitForSelector('#ff-photos')
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
  await page.evaluate(() => document.fonts.ready)
  if (target) await page.locator(target).scrollIntoViewIfNeeded()
}

const frames = (page, n = 2) => page.evaluate((k) => new Promise((r) => { const f = () => (k-- > 0 ? requestAnimationFrame(f) : setTimeout(r, 20)); f() }), n)
const rootOf = (id) => `.g-file-field:has(> .g-file-field__box #${id})`
const png = (name, size = 2000) => ({ name, mimeType: 'image/png', buffer: Buffer.alloc(size, 1) })
const pdf = (name, size = 2000) => ({ name, mimeType: 'application/pdf', buffer: Buffer.alloc(size, 1) })

/** Estado de un campo por el id de su control */
const st = (page, id) => page.evaluate((id) => {
  const i = document.getElementById(id)
  const root = i.closest('.g-file-field')
  const chips = [...root.querySelectorAll('.g-file-field__chip')]
  const name = (el) => (el.getAttribute('aria-labelledby') || '').split(' ').map((x) => document.getElementById(x)?.textContent.trim()).join(' ')
  return {
    cls: [...root.classList],
    name: name(i),
    files: i.files ? [...i.files].map((f) => f.name) : [],
    inputName: i.getAttribute('name'),
    ariaDisabled: i.getAttribute('aria-disabled'),
    states: chips.map((c) => c.dataset.state),
    names: chips.map((c) => c.querySelector('.g-summary__title')?.textContent),
    heights: chips.map((c) => c.getBoundingClientRect().height),
    hidden: [...root.querySelectorAll('input[type="hidden"]')].map((x) => `${x.name}=${x.value}`),
    status: root.querySelector('.g-file-field__status')?.textContent.trim(),
    message: root.querySelector('.g-file-field__message')?.textContent.trim(),
    notice: [...root.querySelectorAll('.g-file-field__notice li')].map((li) => li.textContent.trim()),
    action: root.querySelector('.g-file-field__action')?.textContent.trim(),
    focus: document.activeElement?.id || document.activeElement?.getAttribute('aria-label') || document.activeElement?.tagName
  }
}, id)

/** Arrastre simulado: entra en la página y, si se pide, pasa por un campo y suelta en él (DataTransfer construido) */
const drag = (page, { types = ['image/png'], over = null, drop = null, files = [] } = {}) => page.evaluate(({ types, over, drop, files }) => {
  const dt = new DataTransfer()
  for (const f of files) dt.items.add(new File([new Uint8Array(f.size)], f.name, { type: f.type }))
  if (!files.length) for (const t of types) dt.items.add(new File([new Uint8Array(10)], 'x', { type: t }))
  const fire = (type, el) => {
    const ev = new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt })
    el.dispatchEvent(ev)
    return { prevented: ev.defaultPrevented, effect: dt.dropEffect }
  }
  const out = { enter: fire('dragenter', document.body) }
  if (over) {
    const box = document.getElementById(over).closest('.g-file-field').querySelector('.g-file-field__box')
    out.overEnter = fire('dragenter', box)
    out.over = fire('dragover', box)
  }
  if (drop) out.drop = fire('drop', drop === 'body' ? document.body : document.getElementById(drop).closest('.g-file-field').querySelector('.g-file-field__box'))
  return out
}, { types, over, drop, files })
const endDrag = (page) => page.evaluate(() => document.dispatchEvent(new DragEvent('dragend', { bubbles: true })))

test.describe('GFileField · componente real (file-field.md)', () => {
  test('reposo: el control es el <input type="file"> real, nombre compuesto, tres hijos en flujo, región viva; Tab llega con foco visible ≥ 2px', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page)
    const s = await st(page, 'ff-photos')
    expect(s.name, 'etiqueta (con su marca de GForm) + texto de la cara').toBe('Fotos de la lesión (opcional) Adjuntar archivos')
    expect(s.inputName, 'con uploader el control no lleva name').toBe(null)
    const rest = await page.evaluate(() => {
      const i = document.getElementById('ff-photos')
      const root = i.closest('.g-file-field')
      const flow = [...root.children].filter((c) => !['absolute', 'fixed'].includes(getComputedStyle(c).position) && getComputedStyle(c).display !== 'none')
      const live = root.querySelector('.g-file-field__live')
      return { type: i.type, tag: i.tagName, flow: flow.map((c) => c.className.split(' ')[0]), live: ['role', 'aria-live', 'aria-atomic'].map((a) => live.getAttribute(a)).join(), desc: i.getAttribute('aria-describedby') }
    })
    expect(rest).toMatchObject({ tag: 'INPUT', type: 'file', live: 'status,polite,true', desc: 'ff-photos-hint ff-photos-status' })
    expect(rest.flow).toEqual(['g-file-field__label', 'g-file-field__box', 'g-file-field__foot'])
    // Tab desde el campo anterior (WebKit con los ajustes de Safari llega con Opción+Tab, como a cualquier botón)
    await page.focus('#ff-rx-folio')
    const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab'
    await page.keyboard.press(tab)
    await frames(page)
    expect(await page.evaluate(() => document.activeElement.id)).toBe('ff-rx')
    const ring = await page.evaluate(() => {
      const box = document.getElementById('ff-rx').closest('.g-file-field__box')
      const cs = getComputedStyle(box)
      return { w: parseFloat(cs.outlineWidth), style: cs.outlineStyle, color: cs.outlineColor }
    })
    expect(ring.style).toBe('solid')
    expect(ring.w).toBeGreaterThanOrEqual(2)
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('clic en la caja y Espacio abren el diálogo del sistema; solo lectura y lleno no lo abren', async ({ page }) => {
    await open(page)
    const chooser = async (fn) => {
      let got = false
      const on = () => { got = true }
      page.on('filechooser', on)
      await fn()
      await page.waitForTimeout(700)
      page.off('filechooser', on)
      return got
    }
    expect(await chooser(() => page.locator(rootOf('ff-rx') + ' .g-file-field__add').click())).toBe(true)
    await page.focus('#ff-rx')
    expect(await chooser(() => page.keyboard.press('Space'))).toBe(true)
    await page.locator('#ff-ro').scrollIntoViewIfNeeded()
    expect(await chooser(() => page.locator(rootOf('ff-ro') + ' .g-file-field__box').click({ position: { x: 20, y: 10 } }))).toBe(false)
    await page.focus('#ff-ro')
    expect(await chooser(() => page.keyboard.press('Space'))).toBe(false)
    // Lleno: max 5
    await page.setInputFiles('#ff-photos', [png('a.png', 3000), png('b.png', 3001), png('c.png', 3002), png('d.png', 3003), png('e.png', 3004)])
    await expect.poll(async () => (await st(page, 'ff-photos')).cls.includes('is-full')).toBe(true)
    const s = await st(page, 'ff-photos')
    expect(s.action).toBe('5 de 5')
    expect(s.ariaDisabled).toBe('true')
    await page.locator('#ff-photos').scrollIntoViewIfNeeded()
    expect(await chooser(() => page.locator(rootOf('ff-photos') + ' .g-file-field__add').click())).toBe(false)
  })

  test('elegir tres: fichas, input.files sincronizado, subida con progreso, Δ0 de la ficha entre estados, ocultos con el value, anuncios por gesto y por lote', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    await page.setInputFiles('#ff-photos', [png('uno.png'), png('dos.png', 2100), png('tres-lento.png', 2200)])
    let s = await st(page, 'ff-photos')
    expect(s.names).toEqual(['uno.png', 'dos.png', 'tres-lento.png'])
    expect(s.files).toEqual(['uno.png', 'dos.png', 'tres-lento.png'])
    // concurrency 2: la tercera espera en cola
    expect(s.states.slice(0, 2)).toEqual(['uploading', 'uploading'])
    expect(s.states[2]).toBe('queued')
    const h0 = s.heights[0]
    await expect.poll(async () => page.evaluate(() => Number(document.querySelector('#ff-photos').closest('.g-file-field').querySelector('.g-file-field__chip [role=progressbar]')?.getAttribute('aria-valuenow') || 0))).toBeGreaterThan(0)
    await expect.poll(async () => (await st(page, 'ff-photos')).states.join(), { timeout: 15000 }).toBe('done,done,done')
    s = await st(page, 'ff-photos')
    for (const h of s.heights) expect(Math.abs(h - h0), 'Δ0 de la ficha entre subiendo y subido').toBeLessThan(0.5)
    expect(s.hidden).toHaveLength(3)
    expect(s.hidden.every((x) => /^fotos=srv-\d+$/.test(x))).toBe(true)
    expect(s.files, 'el control lleva siempre los File de la lista').toHaveLength(3)
    const live = await page.evaluate(() => window.__ffLive.map((x) => x.text))
    expect(live).toContain('Añadidos 3 archivos. Subiendo 3.')
    expect(live).toContain('3 archivos subidos.')
    expect(live.filter((t) => /subido\.$/.test(t)), 'un anuncio por lote, no por archivo').toHaveLength(0)
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('rechazos con motivo: aviso role=group que no desaparece solo, «Descartar» devuelve el foco; lo rechazado no entra en input.files', async ({ page }) => {
    await open(page)
    await page.setInputFiles('#ff-photos', [png('bien.png'), pdf('receta.pdf'), png('enorme.png', 9_000_000)])
    const s = await st(page, 'ff-photos')
    expect(s.names).toEqual(['bien.png'])
    expect(s.files).toEqual(['bien.png'])
    expect(s.notice).toEqual(['receta.pdf: no es un tipo admitido', 'enorme.png: pesa 9 MB, el máximo es 8 MB'])
    await page.waitForTimeout(800)
    expect((await st(page, 'ff-photos')).notice).toHaveLength(2)
    await page.locator(rootOf('ff-photos') + ' .g-file-field__notice button').click()
    const t = await st(page, 'ff-photos')
    expect(t.notice).toHaveLength(0)
    expect(t.focus).toBe('ff-photos')
    expect(await page.locator('#ff-log').textContent()).toBe('reject (photos, picker): receta.pdf · type, enorme.png · size')
  })

  test('fallo y Reintentar: mensaje en la ficha, Δ0, foco en la misma ficha («Cancelar subida»), y sube', async ({ page }) => {
    await open(page)
    await page.locator('#ff-demo-fail').click()
    await expect.poll(async () => (await st(page, 'ff-photos')).states.join(), { timeout: 10000 }).toBe('error')
    const chip = page.locator(rootOf('ff-photos') + ' .g-file-field__chip').first()
    const hErr = (await chip.boundingBox()).height
    await expect(chip.locator('.g-summary__fact-value')).toHaveText('Se interrumpió la conexión')
    const retry = chip.locator('.g-file-field__retry')
    await expect(retry).toHaveAttribute('aria-label', 'Reintentar radiografia-falla.png')
    expect(await retry.evaluate((b) => document.getElementById(b.getAttribute('aria-describedby')).textContent)).toBe('Error: Se interrumpió la conexión')
    expect((await st(page, 'ff-photos')).status).toBe('1 de 5 · 1 con error')
    await retry.focus()
    await page.keyboard.press('Enter')
    await frames(page)
    const s = await st(page, 'ff-photos')
    expect(s.focus).toBe('Cancelar subida de radiografia-falla.png')
    expect(Math.abs(s.heights[0] - hErr), 'Δ0 entre error y subiendo').toBeLessThan(0.5)
    await expect.poll(async () => (await st(page, 'ff-photos')).states.join(), { timeout: 10000 }).toBe('done')
    const live = await page.evaluate(() => window.__ffLive.map((x) => x.text))
    expect(live).toContain('No se pudo subir radiografia-falla.png: Se interrumpió la conexión.')
    expect(live).toContain('Reintentando radiografia-falla.png.')
  })

  test('quitar: el foco va a la siguiente, a la anterior y al control; cancelar aborta (sin ocultos)', async ({ page }) => {
    await open(page)
    await page.setInputFiles('#ff-photos', [png('a.png'), png('b.png', 2001), png('c.png', 2002)])
    await expect.poll(async () => (await st(page, 'ff-photos')).states.join(), { timeout: 10000 }).toBe('done,done,done')
    const btn = (i) => page.locator(rootOf('ff-photos') + ' .g-file-field__remove').nth(i)
    await btn(1).click()
    expect((await st(page, 'ff-photos')).focus).toBe('Quitar c.png')
    await btn(1).click()
    expect((await st(page, 'ff-photos')).focus).toBe('Quitar a.png')
    await btn(0).click()
    let s = await st(page, 'ff-photos')
    expect(s.focus).toBe('ff-photos')
    expect(s.files).toEqual([])
    expect(s.hidden).toEqual([])
    await page.setInputFiles('#ff-photos', [png('lento-x-lento.png')])
    await page.locator(rootOf('ff-photos') + ' .g-file-field__remove').first().click()
    s = await st(page, 'ff-photos')
    expect(s.names).toEqual([])
    expect(await page.evaluate(() => window.PlaygroundFileField.uploader.stats().aborted)).toBeGreaterThan(0)
  })

  test('envío bloqueado: pendiente → resumen al control; fallido → resumen al «Reintentar»; borrador sale; al terminar no se envía solo', async ({ page }) => {
    await open(page)
    await page.setInputFiles('#ff-photos', [png('foto-lento.png')])
    await page.locator('#ff-photos-send').click()
    await frames(page, 3)
    let s = await st(page, 'ff-photos')
    expect(s.cls).toContain('is-invalid')
    expect(s.message).toContain('Espera a que termine de subir foto-lento.png.')
    expect(await page.locator('#ff-photos-out').textContent()).toBe('invalid: fotos → Espera a que termine de subir foto-lento.png. (#ff-photos)')
    const link = page.locator('#ff-photos-form .g-error-summary__link')
    await expect(link).toHaveAttribute('href', '#ff-photos')
    await expect.poll(async () => (await st(page, 'ff-photos')).states.join(), { timeout: 15000 }).toBe('done')
    s = await st(page, 'ff-photos')
    expect(s.cls, 'al terminar el error desaparece en silencio').not.toContain('is-invalid')
    expect(await page.locator('#ff-photos-out').textContent(), 'nunca se envía solo').toMatch(/^invalid/)
    // Fallido: el resumen enlaza al «Reintentar» del primer fallido
    await page.locator('#ff-demo-fail').click()
    await expect.poll(async () => (await st(page, 'ff-photos')).states.join(), { timeout: 10000 }).toBe('done,error')
    await page.locator('#ff-photos-send').click()
    await frames(page, 3)
    const href = await link.getAttribute('href')
    expect(href).toMatch(/^#ff-photos-e\d+-retry$/)
    await link.click()
    await frames(page)
    expect(await page.evaluate(() => document.activeElement.getAttribute('aria-label'))).toBe('Reintentar radiografia-falla.png')
    await page.locator('#ff-photos-draft').click()
    await frames(page)
    expect(await page.locator('#ff-photos-out').textContent()).toMatch(/^FormData \(borrador\): fotos=srv-\d+ & nota=$/)
  })

  test('sin adaptador: el control lleva name y FormData nativo lleva el File; sin multiple, el nuevo reemplaza', async ({ page }) => {
    await open(page)
    await page.fill('#ff-rx-folio', 'R-2026-118')
    await page.setInputFiles('#ff-rx', [pdf('receta.pdf')])
    await page.setInputFiles('#ff-rx', [png('foto-receta.png')])
    const s = await st(page, 'ff-rx')
    expect(s.names).toEqual(['foto-receta.png'])
    expect(s.states).toEqual(['ready'])
    expect(s.files).toEqual(['foto-receta.png'])
    expect(s.inputName).toBe('receta')
    expect(s.action).toBe('Cambiar archivo')
    await expect.poll(async () => (await page.evaluate(() => window.__ffLive.map((x) => x.text))).join(' | ')).toContain('receta.pdf reemplazado por foto-receta.png.')
    await page.locator('#ff-rx-send').click()
    await expect(page.locator('#ff-rx-out')).toHaveText('FormData: folio=R-2026-118 & receta=File(foto-receta.png)')
  })

  test('soltar simulado: la página despierta los campos alcanzables (admite / no admite), Δ0 de las cajas, destino mayor, soltar añade; soltar fuera no navega', async ({ page }) => {
    await open(page)
    const boxes = () => page.evaluate(() => [...document.querySelectorAll('#sec-file-field .g-file-field__box')].map((b) => { const r = b.getBoundingClientRect(); return [r.top, r.height] }))
    const b0 = await boxes()
    await drag(page, { types: ['image/png'] })
    await frames(page)
    const cls = (id) => page.evaluate((id) => [...document.getElementById(id).closest('.g-file-field').classList], id)
    expect(await cls('ff-photos')).toEqual(expect.arrayContaining(['is-awake', 'is-awake-ok']))
    expect(await cls('ff-rx')).toEqual(expect.arrayContaining(['is-awake', 'is-awake-ok']))
    expect(await cls('ff-cfe')).toEqual(expect.arrayContaining(['is-awake', 'is-awake-no']))
    expect(await cls('ff-ro')).not.toContain('is-awake')
    expect(await cls('ff-dis')).not.toContain('is-awake')
    expect(await boxes(), 'despertar es pintura: Δ0 de todas las cajas').toEqual(b0)
    const geo = await page.evaluate(() => {
      const root = document.getElementById('ff-photos').closest('.g-file-field')
      const box = root.querySelector('.g-file-field__box').getBoundingClientRect()
      const t = root.querySelector('.g-file-field__target').getBoundingClientRect()
      return { grow: [box.left - t.left, t.right - box.right, box.top - t.top, t.bottom - box.bottom], text: root.querySelector('.g-file-field__target-text').textContent }
    })
    for (const g of geo.grow) expect(g).toBeGreaterThan(0)
    expect(geo.text).toBe('Soltar aquí · Imagen · hasta 8 MB cada una · máximo 5')
    expect(await page.evaluate(() => document.getElementById('ff-cfe').closest('.g-file-field').querySelector('.g-file-field__target-text').textContent)).toBe('Comprobante de domicilio no admite estos archivos')
    const r = await drag(page, { over: 'ff-photos', drop: 'ff-photos', files: [{ name: 'soltada.png', type: 'image/png', size: 500 }] })
    expect(r.over.prevented).toBe(true)
    expect(r.drop.prevented).toBe(true)
    await frames(page)
    expect((await st(page, 'ff-photos')).names).toEqual(['soltada.png'])
    expect(await page.locator('#ff-log').textContent()).toBe('change (photos, drop): +[soltada.png] −[]')
    expect(await cls('ff-photos')).not.toContain('is-awake')
    // Soltar fuera de un campo: la protección cancela el evento (el navegador no abriría el archivo)
    const out = await drag(page, { drop: 'body', files: [{ name: 'fuera.png', type: 'image/png', size: 10 }] })
    expect(out.drop.prevented).toBe(true)
    expect(page.url()).toContain('/packages/vue/playground/index.html')
    await endDrag(page)
  })

  test('pegar con el foco en el control añade la captura (via paste)', async ({ page, browserName }) => {
    test.skip(browserName === 'firefox', 'Firefox no admite archivos en un ClipboardEvent construido (límite conocido del contrato)')
    await open(page)
    await page.focus('#ff-photos')
    const prevented = await page.evaluate(() => {
      const dt = new DataTransfer()
      dt.items.add(new File([new Uint8Array(300)], 'captura.png', { type: 'image/png' }))
      const ev = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt })
      document.getElementById('ff-photos').dispatchEvent(ev)
      return ev.defaultPrevented
    })
    expect(prevented).toBe(true)
    expect((await st(page, 'ff-photos')).names).toEqual(['captura.png'])
    expect(await page.locator('#ff-log').textContent()).toMatch(/^change \(photos, paste\)/)
  })

  test('en una GFormRow con GInput: Δ0 de top y alto de la caja vacía; con un archivo, la misma línea', async ({ page }) => {
    await open(page)
    const m = () => page.evaluate(() => {
      const a = document.getElementById('ff-rx-folio').closest('.g-input').querySelector('.g-input__control').getBoundingClientRect()
      const b = document.getElementById('ff-rx').closest('.g-file-field__box').getBoundingClientRect()
      const la = document.getElementById('ff-rx-folio').closest('.g-input').querySelector('.g-input__label').getBoundingClientRect()
      const lb = document.getElementById('ff-rx').closest('.g-file-field').querySelector('.g-file-field__label').getBoundingClientRect()
      return { dTop: b.top - a.top, dH: b.height - a.height, dLabel: lb.top - la.top, same: Math.abs(b.top - a.top) < 1 && b.left > a.right }
    })
    let r = await m()
    expect(Math.abs(r.dTop)).toBeLessThan(0.5)
    expect(Math.abs(r.dH)).toBeLessThan(0.5)
    expect(Math.abs(r.dLabel)).toBeLessThan(0.5)
    expect(r.same).toBe(true)
    await page.setInputFiles('#ff-rx', [pdf('Comprobante de domicilio CFE marzo 2026.pdf')])
    r = await m()
    expect(Math.abs(r.dTop)).toBeLessThan(0.5)
    expect(Math.abs(r.dH), 'una línea de fichas mide lo que la caja vacía').toBeLessThan(0.5)
  })

  test('objetivos ≥ 24px (botones de la ficha y la caja); estados de solo lectura y deshabilitado', async ({ page }) => {
    await open(page)
    await page.setInputFiles('#ff-photos', [png('a.png')])
    const sizes = await page.evaluate(() => [...document.querySelectorAll('#sec-file-field .g-file-field__chip .g-btn, #sec-file-field .g-file-field__box')].filter((e) => e.getClientRects().length).map((e) => { const r = e.getBoundingClientRect(); return [r.width, r.height] }))
    for (const [w, h] of sizes) {
      expect(w).toBeGreaterThanOrEqual(24)
      expect(h).toBeGreaterThanOrEqual(24)
    }
    const ro = await st(page, 'ff-ro')
    expect(ro.cls).toContain('is-readonly')
    expect(ro.action).toBe('Solo lectura')
    expect(ro.ariaDisabled).toBe('true')
    expect(await page.locator(rootOf('ff-ro') + ' .g-file-field__chip button').count()).toBe(0)
    expect(await page.locator('#ff-dis').isDisabled()).toBe(true)
    expect((await st(page, 'ff-ro-empty')).action).toBe('Sin archivos')
    const err = await st(page, 'ff-err')
    expect(err.cls).toContain('is-invalid')
    expect(err.message).toContain('Adjunta el consentimiento firmado.')
  })

  test('320px en LTR y RTL: sin desbordamiento con fichas', async ({ page }) => {
    await open(page, { width: 320, height: 800 })
    await page.setInputFiles('#ff-photos', [png('una-foto-con-un-nombre-bastante-largo-de-la-lesion-frontal.png'), png('b.png', 2001)])
    await page.setInputFiles('#ff-rtl', [png('صورة-طويلة-الاسم-جدا.png'), png('b.png', 2001)])
    await frames(page, 3)
    const over = await page.evaluate(() => ['ff-photos', 'ff-rtl'].map((id) => {
      const root = document.getElementById(id).closest('.g-file-field')
      const r = root.getBoundingClientRect()
      const kids = [...root.querySelectorAll('.g-file-field__chip, .g-file-field__add')].map((e) => e.getBoundingClientRect())
      return { id, out: kids.filter((k) => k.left < r.left - 0.5 || k.right > r.right + 0.5).length, dir: getComputedStyle(root).direction }
    }))
    expect(over).toEqual([{ id: 'ff-photos', out: 0, dir: 'ltr' }, { id: 'ff-rtl', out: 0, dir: 'rtl' }])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  })

  test('dentro de un GDialog: añadir y el anuncio en una región dentro del modal; el campo de la página no despierta con el modal abierto', async ({ page }) => {
    await open(page)
    await page.locator('#ff-d-open').click()
    await page.waitForSelector('#ff-dlg[open]')
    await page.setInputFiles('#ff-d', [png('d1.png')])
    await expect.poll(async () => page.evaluate(() => window.__ffLive.filter((x) => x.text.startsWith('Añadido d1.png')).map((x) => x.dialog))).toEqual([true])
    await drag(page)
    await frames(page)
    expect(await page.evaluate(() => document.getElementById('ff-photos').closest('.g-file-field').classList.contains('is-awake'))).toBe(false)
    expect(await page.evaluate(() => document.getElementById('ff-d').closest('.g-file-field').classList.contains('is-awake'))).toBe(true)
    await endDrag(page)
  })
})
