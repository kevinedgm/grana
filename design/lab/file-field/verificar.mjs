// Verificación del campo de archivos (kiwi): la base (r01) y los conceptos A, B y C (r02) con la misma batería, más lo propio.
// Ejecutar: node design/lab/file-field/verificar.mjs   (GRANA_PW_PORT, por defecto 4212; ENGINES=chromium,firefox,webkit; CONCEPTS=base,A,B,C; VERBOSE=1)
// Requiere packages/vue/dist (npm run build). Solo lee; no toca packages/.
import { serve, pw } from './serve.mjs'

const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const CONCEPTS = (process.env.CONCEPTS || 'base,A,B,C').split(',')
const V = !!process.env.VERBOSE
const R = [], NV = []
const rec = (eng, c, name, ok, info = '') => { R.push({ eng, c, name, ok: !!ok, info }); if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${c} · ${name}${info ? ' · ' + info : ''}`) }

const SEL = {
  base: { url: '/r01/index.html', ro: '[data-field=docs]', multi: '[data-field=fotos]', single: '[data-field=comprobante]', item: '.ff-item', zone: '.ff__zone', face: '.ff__zone', submit: '#case-upload button[type=submit]', out: '#upload-out' },
  A: { url: '/r02/index.html?c=A', ro: '[data-field=fotos]', multi: '[data-field=fotos]', single: '[data-field=receta]', item: '.ffa-chip', zone: '.ffa__box', face: '.ffa__box', submit: '#case-photos button[type=submit]', out: '#sent-out' },
  B: { url: '/r02/index.html?c=B', ro: '[data-field=fotos]', multi: '[data-field=fotos]', single: '[data-field=receta]', item: '.ffb-tile', zone: '.ffb__table', face: '.ffb-add', submit: '#case-photos button[type=submit]', out: '#sent-out' },
  C: { url: '/r02/index.html?c=C', item: '.ffc-file' }
}

// ---- ayudantes en la página ----
const H = () => {
  window.__mk = (k) => FF.SAMPLES[k]()
  window.__img = (name, w = 200, h = 150, hue = 40) => FF.pngFile(name, w, h, hue)
  window.__blob = (name, type, size) => FF.blobFile(name, type, size)
  window.__dt = (files) => { const dt = new DataTransfer(); files.forEach((f) => dt.items.add(f)); return dt }
  window.__drag = (el, type, files) => { const dt = __dt(files); const ev = new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt }); el.dispatchEvent(ev); return ev.defaultPrevented }
  window.__paste = (el, files) => {
    let ev
    try { ev = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: __dt(files) }) } catch { return 'sin-constructor' }
    if (!ev.clipboardData) { try { Object.defineProperty(ev, 'clipboardData', { value: __dt(files) }) } catch { return 'sin-clipboardData' } }
    if (!ev.clipboardData.files.length) return 'sintético-sin-archivos'
    el.dispatchEvent(ev); return ev.defaultPrevented ? 'ok' : 'no'
  }
  window.__live = (root) => [...root.querySelectorAll('[aria-live]')].map((e) => e.textContent).join(' | ')
  window.__rgb = (c) => { const cv = document.createElement('canvas'); cv.width = cv.height = 1; const x = cv.getContext('2d'); x.fillStyle = '#000'; x.fillStyle = c; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  window.__lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  window.__contrast = (el) => {
    const fg = __rgb(getComputedStyle(el).color); let bg = null
    for (let a = el; a; a = a.parentElement) { const c = __rgb(getComputedStyle(a).backgroundColor); if (c[3] > 0.95) { bg = c; break } }
    bg = bg || [255, 255, 255]; const L1 = __lum(fg), L2 = __lum(bg); return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)
  }
}

async function chooser(page, fn, ms = 1200) {
  const p = page.waitForEvent('filechooser', { timeout: ms }).then(() => true, () => false)
  await fn(); return p
}
const until = async (page, fn, arg, ms = 8000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true } catch { return false } }

async function common(page, eng, c) {
  const S = SEL[c]
  const ck = (n, ok, i) => rec(eng, c, n, ok, i)
  const field = page.locator(S.multi).first(), input = field.locator('input[type=file]')
  await page.evaluate(() => { FF.net.speed = 4 })

  // 1. Semántica: un <input type="file"> real, con nombre = etiqueta
  const snap = await input.ariaSnapshot().catch(() => '')
  ck('input file real y nombre accesible = etiqueta', snap.includes('Fotos de la lesión'), snap.split('\n')[0])
  ck('aria-describedby con pista y estado', await input.evaluate((e) => e.getAttribute('aria-describedby').split(' ').every((id) => document.getElementById(id))))
  // 2. Foco visible en la cara y Espacio/Intro abren el selector
  // Safari/WebKit: con los ajustes por defecto, Tab solo recorre campos de texto; botones y input file van con Opción+Tab (como cualquier GBtn)
  const TAB = eng === 'webkit' ? 'Alt+Tab' : 'Tab'
  await input.focus(); await page.keyboard.press('Shift+' + TAB); await page.keyboard.press(TAB)
  ck(eng === 'webkit' ? 'Opción+Tab llega al control' : 'Tab llega al control', await input.evaluate((e) => document.activeElement === e))
  const ow = await field.locator(S.face).first().evaluate((e) => parseFloat(getComputedStyle(e).outlineWidth) * (getComputedStyle(e).outlineStyle === 'none' ? 0 : 1))
  ck('foco visible en la cara (outline ≥ 2px)', ow >= 2, ow + 'px')
  ck('Espacio abre el selector', await chooser(page, () => page.keyboard.press('Space')))
  ck('clic en la cara abre el selector', await chooser(page, () => field.locator(S.face).first().click({ position: { x: 12, y: 12 } })))

  // 3. Elegir: tres fotos
  await input.setInputFiles([1, 2, 3].map((i) => ({ name: `foto-${i}.png`, mimeType: 'image/png', buffer: Buffer.alloc(2000 + i) })))
  ck('elegir añade 3', (await field.locator(S.item).count()) === 3)
  ck('el input lleva los archivos de la lista (DataTransfer)', (await input.evaluate((e) => e.files.length)) === 3)
  await page.waitForTimeout(150)
  ck('anuncio «Añadidos 3»', /Añadidos 3/.test(await field.evaluate((e) => __live(e))), await field.evaluate((e) => __live(e)))
  // 4. Rechazos
  await input.setInputFiles([{ name: 'virus.exe', mimeType: 'application/x-msdownload', buffer: Buffer.alloc(100) }])
  await page.waitForTimeout(150)
  ck('tipo no admitido: no entra', (await field.locator(S.item).count()) === 3 && (await input.evaluate((e) => e.files.length)) === 3)
  ck('tipo no admitido: aviso visible y anunciado', (await field.locator('[aria-label="Archivos no añadidos"]').count()) === 1 && /No se añadió virus\.exe/.test(await field.evaluate((e) => __live(e))))
  await field.locator(S.zone).first().evaluate((z) => __drag(z, 'drop', [__blob('enorme.png', 'image/png', 9_000_000)]))
  await page.waitForTimeout(150)
  ck('tamaño: rechazado con el límite en el texto', /8 MB/.test(await field.locator('[aria-label="Archivos no añadidos"]').innerText().catch(() => '')))
  // 5. Arrastrar encima: Δ0 de la zona y de lo que sigue
  const zone = field.locator(S.zone).first()
  // Referencia: lo primero que sigue a la zona (si la zona creciera, se movería)
  const nextEl = await zone.evaluateHandle((z) => z.nextElementSibling || z.parentElement.nextElementSibling)
  const before = await zone.boundingBox(), nb = await nextEl.boundingBox()
  const pd = await zone.evaluate((z) => { __drag(z, 'dragenter', [__img('x.png')]); return __drag(z, 'dragover', [__img('x.png')]) })
  await page.waitForTimeout(60)
  const during = await zone.boundingBox(), nd = await nextEl.boundingBox()
  ck('arrastrar encima: estado is-over', await field.evaluate((e) => e.classList.contains('is-over')))
  ck('arrastrar encima: dragover aceptado (preventDefault)', pd)
  ck('arrastrar encima: Δ0 zona y página', Math.abs(before.height - during.height) < 0.5 && Math.abs(before.y - during.y) < 0.5 && Math.abs(nb.y - nd.y) < 0.5, `zona ${before.height}→${during.height}, siguiente ${nb.y}→${nd.y}`)
  await zone.evaluate((z) => __drag(z, 'dragleave', [__img('x.png')]))
  // 6. Soltar: duplicados y tope (subida lenta desde aquí para ver el progreso)
  await page.evaluate(() => { FF.net.speed = 0.5 })
  await zone.evaluate((z) => __drag(z, 'drop', [__img('a.png', 210, 150, 10), __img('b.png', 220, 150, 80), __img('c.png', 230, 150, 160)]))
  await page.waitForTimeout(150)
  ck('soltar: 2 entran, 1 por el máximo de 5', (await field.locator(S.item).count()) === 5 && /máximo/.test(await field.locator('[aria-label="Archivos no añadidos"]').innerText().catch(() => '')))
  ck('lleno: aria-disabled y no abre el selector', (await input.getAttribute('aria-disabled')) === 'true' && !(await chooser(page, () => input.evaluate((e) => e.click()), 700)))
  await zone.evaluate((z) => __drag(z, 'drop', [__img('a.png', 210, 150, 10)]))
  await page.waitForTimeout(100)
  // 7. Subida: progreso y Δ0 por estado
  const firstUp = field.locator(`${S.item}[data-state=uploading]`).first()
  const hasBar = await until(page, (s) => !!document.querySelector(s + ' [role=progressbar][aria-valuenow]'), S.multi, 4000)
  ck('subiendo: barra de progreso con valor', hasBar)
  const key = await firstUp.getAttribute('data-key').catch(() => null)
  const hUp = key ? (await field.locator(`[data-key="${key}"]`).boundingBox()).height : 0
  await page.evaluate(() => { FF.net.speed = 4 })
  const allDone = await until(page, (s) => { const it = [...document.querySelectorAll(s + ' [data-state]')]; return it.length && it.every((e) => e.dataset.state === 'done') }, S.multi, 15000)
  ck('todas subidas (done)', allDone)
  await page.waitForTimeout(200)
  const hDone = key ? (await field.locator(`[data-key="${key}"]`).boundingBox()).height : -1
  ck('Δ0: misma altura subiendo y subido', Math.abs(hUp - hDone) < 0.5, `${hUp} / ${hDone}`)
  ck('envío: un campo oculto por archivo subido, con el valor del servidor', (await field.locator('input[type=hidden][name=fotos]').count()) === 5 && (await input.getAttribute('name')) === null)
  ck('anuncio de cierre de lote', /subidos|subido\./.test(await field.evaluate((e) => __live(e))))
  // 8. Quitar: foco a la acción equivalente del siguiente; al vaciar, al control
  const keys = await field.locator(S.item).evaluateAll((els) => els.map((e) => e.dataset.key))
  await field.locator(`[data-key="${keys[1]}"] [data-act=remove]`).click()
  ck('quitar: foco al «Quitar» del siguiente', await page.evaluate((k) => document.activeElement?.closest('[data-key]')?.dataset.key === k && document.activeElement.dataset.act === 'remove', keys[2]))
  await page.waitForTimeout(120)
  ck('quitar: anuncio con lo que queda', /Quitado .* Quedan 4/.test(await field.evaluate((e) => __live(e))))
  for (let i = 0; i < 4; i++) await field.locator(`${S.item} [data-act=remove]`).last().click()
  ck('quitar el último: foco al control de elegir', await input.evaluate((e) => document.activeElement === e))
  ck('sin archivos: input y ocultos vacíos', (await input.evaluate((e) => e.files.length)) === 0 && (await field.locator('input[type=hidden]').count()) === 0)
  // 9. Error y reintento
  await zone.evaluate((z) => __drag(z, 'drop', __mk('fail')))
  const err = await until(page, (s) => !!document.querySelector(s + ' [data-state=error]'), S.multi, 8000)
  await page.waitForTimeout(200)
  ck('fallo: estado error con mensaje', err && /Se interrumpió/.test(await field.locator('[data-state=error]').innerText()))
  ck('fallo: anunciado', /No se pudo subir radiografia-falla\.png/.test(await field.evaluate((e) => __live(e))))
  const rk = await field.locator('[data-state=error]').getAttribute('data-key')
  ck('fallo: «Reintentar» describe el error', await field.locator(`[data-key="${rk}"] [data-act=retry]`).evaluate((b) => /Error/.test(document.getElementById(b.getAttribute('aria-describedby'))?.textContent || '')))
  await field.locator(`[data-key="${rk}"] [data-act=retry]`).click()
  ck('reintentar: foco al botón de la misma ficha', await page.evaluate((k) => document.activeElement?.closest('[data-key]')?.dataset.key === k, rk))
  ck('reintentar: termina subido', await until(page, (k) => document.querySelector(`[data-key="${k}"]`)?.dataset.state === 'done', rk, 8000))
  // 10. Cancelar una subida en curso
  await page.evaluate(() => { FF.net.speed = 0.3 })
  await zone.evaluate((z) => __drag(z, 'drop', [__img('placa-lento.png', 200, 200, 300)]))
  await until(page, (s) => !!document.querySelector(s + ' [data-state=uploading]'), S.multi, 4000)
  await field.locator(`${S.item}[data-state=uploading] [data-act=remove]`).first().click()
  await page.waitForTimeout(150)
  ck('cancelar: nombre del botón y anuncio', /cancelada/.test(await field.evaluate((e) => __live(e))))
  // 11. Envío bloqueado con subidas en curso
  await zone.evaluate((z) => __drag(z, 'drop', [__img('otra-lento.png', 200, 200, 330)]))
  await page.locator(S.submit).click()
  await page.waitForTimeout(250)
  ck('envío con subidas en curso: bloqueado y resumen', (await page.locator(S.out).count()) === 0 && (await page.locator('.g-error-summary').first().isVisible()))
  await page.evaluate(() => { FF.net.speed = 4 })
  await until(page, (s) => ![...document.querySelectorAll(s + ' [data-state]')].some((e) => /uploading|queued/.test(e.dataset.state)), S.multi, 10000)
  // 12. Pegar
  const pr = await input.evaluate((e) => __paste(e, [__img('captura.png', 180, 120, 200)]))
  if (pr === 'sintético-sin-archivos') NV.push(`${eng} ${c}: pegar (el motor no admite archivos en un ClipboardEvent construido)`)
  else ck('pegar con el foco en el campo añade', pr === 'ok' && (await field.locator(S.item).count()) >= 2, pr)
  // 13. Solo lectura y deshabilitado
  const rof = page.locator(S.ro).first(), roin = rof.locator('input[type=file]')
  await page.locator('#t-ro').check()
  ck('solo lectura: sin quitar ni reintentar', (await rof.locator('[data-act]').count()) === 0)
  ck('solo lectura: enfocable, en el envío, aria-disabled, no abre', !(await roin.evaluate((e) => e.disabled)) && (await roin.getAttribute('aria-disabled')) === 'true' && (await rof.locator('input[type=hidden]:not([disabled])').count()) >= 1 && !(await chooser(page, () => roin.evaluate((e) => e.click()), 700)))
  await rof.locator(S.zone).first().evaluate((z) => __drag(z, 'drop', [__img('no.png')]))
  ck('solo lectura: soltar no añade', !(await rof.locator(S.item).evaluateAll((els) => els.some((x) => x.textContent.includes('no.png')))))
  await page.locator('#t-ro').uncheck(); await page.locator('#t-dis').check()
  ck('deshabilitado: input y ocultos deshabilitados (fuera del envío y del Tab)', (await roin.evaluate((e) => e.disabled)) && (await rof.locator('input[type=hidden]:not([disabled])').count()) === 0)
  await page.locator('#t-dis').uncheck()

  // 14. Un solo archivo: elegir otro reemplaza
  const single = page.locator(S.single).first(), sin = single.locator('input[type=file]')
  await sin.setInputFiles([{ name: 'uno.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(3000) }])
  await sin.setInputFiles([{ name: 'dos.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(4000) }])
  await page.waitForTimeout(150)
  ck('un archivo: elegir otro reemplaza y lo anuncia', (await single.locator(S.item).count()) === 1 && /uno\.pdf reemplazado por dos\.pdf/.test(await single.evaluate((e) => __live(e))))
  ck('un archivo: selección vacía (cancelar) no borra', await sin.evaluate((e) => { e.dispatchEvent(new Event('change', { bubbles: true })); return true }) && (await single.locator(S.item).count()) === 1)
  if (c === 'base') {
    await page.locator('#case-native button[type=submit]').click()
    ck('envío nativo: FormData lleva el File con el name', /comprobante[\s\S]*File «dos\.pdf»/.test(await page.locator('#native-out').innerText().catch(() => '')))
  }
}

async function conceptA(page, eng) {
  const ck = (n, ok, i) => rec(eng, 'A', n, ok, i)
  // Comparte fila con GInput: misma parte superior y alto de caja
  const g = await page.locator('#case-row .g-input__control').first().boundingBox(), b = await page.locator('[data-field=receta] .ffa__box').boundingBox()
  ck('en GFormRow: caja alineada con GInput (top y alto)', Math.abs(g.y - b.y) < 1 && Math.abs(g.height - b.height) < 1, `GInput ${g.y.toFixed(1)}/${g.height} · campo ${b.y.toFixed(1)}/${b.height}`)
  ck('en GFormRow: misma línea', Math.abs(g.y - b.y) < 1 && b.x > g.x + g.width - 1)
  // La página despierta los destinos al arrastrar un PDF: fotos (image/*) dice que no; receta y docs dicen que sí; Δ0
  const boxes = await page.locator('.ffa__box').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()))
  await page.evaluate(() => { const dt = __dt([__blob('x.pdf', 'application/pdf', 100)]); document.dispatchEvent(new DragEvent('dragenter', { bubbles: true, dataTransfer: dt })) })
  await page.waitForTimeout(250)
  ck('arrastre en la página: se encienden los que admiten', await page.locator('[data-field=receta]').evaluate((e) => e.classList.contains('is-awake-ok')) && await page.locator('[data-field=docs]').evaluate((e) => e.classList.contains('is-awake-ok')))
  ck('arrastre en la página: el que no admite lo dice', await page.locator('[data-field=fotos]').evaluate((e) => e.classList.contains('is-awake-no')))
  const boxes2 = await page.locator('.ffa__box').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()))
  ck('arrastre en la página: Δ0 de todas las cajas', boxes.every((r, i) => Math.abs(r.y - boxes2[i].y) < 0.5 && Math.abs(r.height - boxes2[i].height) < 0.5))
  const pr = await page.locator('[data-field=receta] .ffa__portal').boundingBox(), br = await page.locator('[data-field=receta] .ffa__box').boundingBox()
  ck('destino más grande que la caja', pr && pr.width > br.width + 8 && pr.height > br.height + 8, pr ? `${pr.width}×${pr.height} sobre ${br.width}×${br.height}` : 'sin capa')
  const out = await page.evaluate(() => { const dt = __dt([__blob('x.pdf', 'application/pdf', 100)]); const ev = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }); document.querySelector('.lab-lead').dispatchEvent(ev); return ev.defaultPrevented })
  ck('soltar fuera de un campo no abre el archivo (preventDefault)', out)
  ck('al soltar se apagan los destinos', !(await page.locator('.ffa.is-awake').count()))
  // Ficha que se llena: --_p crece
  await page.evaluate(() => { FF.net.speed = 0.4 })
  const z = page.locator('[data-field=docs] .ffa__box')
  await z.evaluate((x) => __drag(x, 'drop', [__img('doc-lento.png', 300, 300, 20)]))
  await page.waitForTimeout(700)
  const p = await page.locator('[data-field=docs] .ffa-chip[data-state=uploading]').first().evaluate((e) => [parseFloat(e.style.getPropertyValue('--_p')), getComputedStyle(e, '::before').transform]).catch(() => null)
  ck('la ficha es la barra (relleno = progreso)', p && p[0] > 0 && p[1] !== 'none', JSON.stringify(p))
  await page.evaluate(() => { FF.net.speed = 4 })
}

async function conceptB(page, eng) {
  const ck = (n, ok, i) => rec(eng, 'B', n, ok, i)
  const f = page.locator('[data-field=fotos]')
  while (await f.locator('.ffb-tile [data-act=remove]').count()) await f.locator('.ffb-tile [data-act=remove]').first().click()
  await page.evaluate(() => { FF.net.speed = 0.4 })
  await f.locator('.ffb__table').evaluate((z) => __drag(z, 'drop', __mk('photos')))
  await page.waitForTimeout(500)
  const v = await f.locator('.ffb-tile[data-state=uploading] .ffb-tile__veil').first().evaluate((e) => getComputedStyle(e, '::before').transform).catch(() => null)
  ck('subiendo: el velo cubre lo que falta (transform)', v && v !== 'none', v)
  const k = await f.locator('.ffb-tile').first().getAttribute('data-key')
  const h1 = (await f.locator(`[data-key="${k}"]`).boundingBox()).height
  await page.evaluate(() => { FF.net.speed = 4 })
  await until(page, () => [...document.querySelectorAll('[data-field=fotos] .ffb-tile')].every((e) => e.dataset.state === 'done'), null, 10000)
  ck('Δ0: la pieza no cambia de alto al subir', Math.abs(h1 - (await f.locator(`[data-key="${k}"]`).boundingBox()).height) < 0.5)
  ck('«Añadir» es la última pieza de la mesa', await f.locator('.ffb__table').evaluate((t) => t.lastElementChild.classList.contains('ffb-add')))
  const add = await f.locator('.ffb-add').boundingBox()
  ck('«Añadir» ≥ 44px', add.width >= 44 && add.height >= 44, `${add.width}×${add.height}`)
  await f.locator('.ffb__table').evaluate((z) => __drag(z, 'dragenter', [__img('a.png'), __img('b.png')]))
  await page.waitForTimeout(150)
  ck('arrastrar: «Añadir» dice cuántos se sueltan (Chromium y Firefox; WebKit sin items)', /Soltar 2|Soltar aquí/.test(await f.locator('.ffb-add__text').innerText()), await f.locator('.ffb-add__text').innerText())
  await f.locator('.ffb__table').evaluate((z) => __drag(z, 'dragleave', [__img('a.png')]))
  const btn = await f.locator('.ffb-tile [data-act=remove]').first().boundingBox()
  ck('quitar en la esquina ≥ 24px', btn.width >= 24 && btn.height >= 24, `${btn.width}×${btn.height}`)
}

async function conceptC(page, eng) {
  const ck = (n, ok, i) => rec(eng, 'C', n, ok, i)
  await page.evaluate(() => { FF.net.speed = 4 })
  const fs = page.locator('fieldset[data-field=docs]')
  ck('fieldset con legend y una casilla por documento', (await fs.locator('legend').innerText()) === 'Documentos de identidad' && (await fs.locator('.ffc-slot').count()) === 3)
  ck('cada casilla es su propio input file con su etiqueta', (await fs.locator('input[type=file]').count()) === 3 && /INE · frente/.test(await fs.locator('[data-slot=ine-frente] input[type=file]').ariaSnapshot()))
  // Reparto por nombre
  await fs.evaluate((x) => __drag(x.querySelector('.ffc__progress'), 'drop', __mk('ine').reverse()))
  await page.waitForTimeout(200)
  ck('soltar en el grupo: reparte por nombre', /INE frente/.test(await fs.locator('[data-slot=ine-frente]').innerText()) && /INE reverso/.test(await fs.locator('[data-slot=ine-reverso]').innerText()))
  ck('reparto anunciado', /INE frente\.png → INE · frente/.test(await fs.evaluate((e) => __live(e))))
  await until(page, () => [...document.querySelectorAll('fieldset[data-field=docs] .ffc-file')].every((e) => e.dataset.state === 'done'), null, 8000)
  ck('recuento «2 de 3» y lo pendiente', /2 de 3/.test(await fs.locator('.ffc__count').innerText()) && /Comprobante/.test(await fs.locator('.ffc__missing').innerText()))
  ck('envío: un oculto por casilla con su clave', (await fs.locator('input[type=hidden][name="docs[ine-frente]"]').count()) === 1 && (await fs.locator('input[type=hidden][name="docs[ine-reverso]"]').count()) === 1)
  // Envío con una casilla vacía: el resumen enlaza a ESA casilla
  await page.locator('#case-docs button[type=submit]').click()
  await page.waitForTimeout(250)
  const id = await fs.locator('[data-slot=comprobante] input[type=file]').getAttribute('id')
  const link = await page.locator('#case-docs .g-error-summary a').first().getAttribute('href').catch(() => null)
  ck('resumen: enlaza a la casilla que falta', link === '#' + id, `${link} / #${id}`)
  ck('casilla que falta: marca de error', await fs.locator('[data-slot=comprobante]').evaluate((e) => e.classList.contains('is-missing')))
  // Soltar en una casilla concreta: solo esa
  await fs.locator('[data-slot=comprobante]').evaluate((e) => __drag(e, 'drop', [__blob('virus.exe', 'application/x-msdownload', 10)]))
  await page.waitForTimeout(150)
  ck('casilla: rechazo con aviso en la casilla', (await fs.locator('[data-slot=comprobante] [aria-label="Archivos no añadidos"]').count()) === 1)
  const s = fs.locator('[data-slot=comprobante] input[type=file]')
  const TAB = eng === 'webkit' ? 'Alt+Tab' : 'Tab'
  await s.focus(); await page.keyboard.press('Shift+' + TAB); await page.keyboard.press(TAB)
  ck('casilla: Tab llega y Espacio abre el selector', (await s.evaluate((e) => document.activeElement === e)) && await chooser(page, () => page.keyboard.press('Space')))
  await s.setInputFiles([{ name: 'cfe.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(5000) }])
  await until(page, () => document.querySelector('[data-slot=comprobante] .ffc-file')?.dataset.state === 'done', null, 8000)
  ck('completo: «3 de 3» y marca de lista', /3 de 3/.test(await fs.locator('.ffc__count').innerText()) && (await fs.locator('.ffc-slot.is-filled').count()) === 3)
  // Quitar en una casilla de un archivo: foco al control de esa casilla
  await fs.locator('[data-slot=comprobante] [data-act=remove]').click()
  ck('quitar en casilla: foco a su control', await s.evaluate((e) => document.activeElement === e))
  // Δ0 de una casilla entre subiendo y subida
  await page.evaluate(() => { FF.net.speed = 0.4 })
  await s.setInputFiles([{ name: 'cfe.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(5000) }])
  await until(page, () => document.querySelector('[data-slot=comprobante] .ffc-file')?.dataset.state === 'uploading', null, 4000)
  // (se mide el cuerpo: el pie lleva el mensaje de la aplicación «Espera a que termine…», que en el real solo sale al enviar, L7)
  const h1 = (await fs.locator('[data-slot=comprobante] .ffc-slot__body').boundingBox()).height
  await page.evaluate(() => { FF.net.speed = 4 })
  await until(page, () => document.querySelector('[data-slot=comprobante] .ffc-file')?.dataset.state === 'done', null, 8000)
  ck('Δ0: la casilla no cambia de alto al subir', Math.abs(h1 - (await fs.locator('[data-slot=comprobante] .ffc-slot__body').boundingBox()).height) < 0.5)
  // Varias en una casilla («Otras fotos», multiple)
  const fp = page.locator('fieldset[data-field=fotos]')
  await fp.evaluate((x) => __drag(x.querySelector('.ffc__progress'), 'drop', __mk('photos')))
  await page.waitForTimeout(200)
  ck('fotos: reparto en las tres casillas obligatorias', (await fp.locator('.ffc-slot:not(.is-many) .ffc-file').count()) === 3)
  await page.locator('#t-ro').check()
  ck('solo lectura: sin acciones, controles enfocables', (await fp.locator('[data-act]').count()) === 0 && !(await fp.locator('input[type=file]').first().evaluate((e) => e.disabled)))
  await page.locator('#t-ro').uncheck()
  const pr = await fs.locator('[data-slot=ine-frente] input[type=file]').evaluate((e) => __paste(e, [__img('pegada.png')]))
  if (pr === 'sintético-sin-archivos') NV.push(`${eng} C: pegar (el motor no admite archivos en un ClipboardEvent construido)`)
  else ck('pegar en una casilla la llena (reemplaza)', pr === 'ok' && /pegada\.png/.test(await fs.locator('[data-slot=ine-frente]').innerText()), pr)
}

async function layout(browser, base, eng, c) {
  const S = SEL[c]
  for (const [w, dir] of [[320, 'ltr'], [320, 'rtl'], [1024, 'rtl']]) {
    const page = await browser.newPage({ viewport: { width: w, height: 800 } })
    await page.goto(base + S.url + (S.url.includes('?') ? '&' : '?') + 'dir=' + dir); await page.addInitScript(H); await page.evaluate(H)
    await page.evaluate(() => { FF.net.speed = 8 })
    // Con archivos de nombre largo en todos los campos
    await page.evaluate(() => document.querySelectorAll('[data-field]').forEach((f) => {
      const z = f.querySelector('.ffa__box,.ffb__table,.ff__zone') || (f.matches('.ffc-slot') ? f : null); if (!z) return
      __drag(z, 'drop', [__img('Fotografía de la lesión en la cara anterior del antebrazo izquierdo tomada en consulta.png', 200, 160, 60)])
    }))
    await page.waitForTimeout(1200)
    const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
    rec(eng, c, `${w}px ${dir}: sin desbordamiento horizontal`, o.sw <= o.cw + 1, `${o.sw}/${o.cw}`)
    const small = await page.evaluate(() => [...document.querySelectorAll('[data-act], .ffb-add, .ffc-slot__pick, .ffa__add')].filter((e) => e.offsetParent).map((e) => e.getBoundingClientRect()).filter((r) => r.width < 24 || r.height < 24).length)
    rec(eng, c, `${w}px ${dir}: objetivos ≥ 24px`, small === 0, small + ' pequeños')
    await page.close()
  }
}

async function motion(browser, base, eng, c) {
  if (c === 'base') return
  const S = SEL[c]
  for (const rm of ['no-preference', 'reduce']) {
    const page = await browser.newPage(); await page.emulateMedia({ reducedMotion: rm })
    await page.goto(base + S.url); await page.evaluate(H)
    const n = await page.evaluate(async () => {
      const f = document.querySelector('[data-field=fotos]'); const z = f.querySelector('.ffa__box,.ffb__table') || f.querySelector('.ffc__progress')
      __drag(z, 'drop', __mk('photos').slice(0, 1)); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      return document.getAnimations().filter((a) => /ffx-land|ffc-pop/.test(a.animationName || '')).length
    })
    rec(eng, c, `movimiento (${rm}): aterrizaje`, rm === 'reduce' ? n === 0 : n > 0, n + ' animaciones')
    await page.close()
  }
}

async function contrast(page, c) {
  const sels = { base: ['.ff__hint', '.ff__status', '.ff__choose'], A: ['.ffa__meta', '.ffa__add-text', '.ffa__add-hint'], B: ['.ffb__meta', '.ffb-add__text', '.ffb-add__count'], C: ['.ffc__missing', '.ffc-slot__hint', '.ffc-slot__pick'] }[c]
  const out = []
  for (const s of sels) { const v = await page.locator(s).first().evaluate((e) => __contrast(e)).catch(() => null); if (v) out.push([s, +v.toFixed(2)]) }
  rec('chromium', c, 'contraste de texto ≥ 4.5:1', out.length && out.every((x) => x[1] >= 4.5), out.map((x) => x.join(' ')).join(', '))
}

const { server, base } = await serve()
try {
  for (const eng of ENGINES) {
    const browser = await pw[eng].launch()
    for (const c of CONCEPTS) {
      const page = await browser.newPage({ viewport: { width: 1000, height: 900 } })
      const errs = []
      page.on('console', (m) => { if (m.type() === 'error' || (m.type() === 'warning' && /Vue warn|\[Grana\]/.test(m.text()))) errs.push(m.text().slice(0, 160)) })
      page.on('pageerror', (e) => errs.push('pageerror ' + e.message))
      await page.goto(base + SEL[c].url); await page.evaluate(H); await page.waitForTimeout(300)
      if (eng === 'chromium') await contrast(page, c)
      try {
        if (c === 'C') await conceptC(page, eng)
        else { await common(page, eng, c); if (c === 'A') await conceptA(page, eng); if (c === 'B') await conceptB(page, eng) }
      } catch (e) { rec(eng, c, 'la batería terminó sin excepción', false, e.message.split('\n')[0]) }
      rec(eng, c, 'consola limpia', errs.length === 0, errs.slice(0, 3).join(' || '))
      await page.close()
      await layout(browser, base, eng, c)
      await motion(browser, base, eng, c)
    }
    await browser.close()
  }
} finally { server.close() }
const pass = R.filter((r) => r.ok).length
console.log(`\n${pass}/${R.length} comprobaciones pasan`)
for (const eng of ENGINES) for (const c of CONCEPTS) { const x = R.filter((r) => r.eng === eng && r.c === c); if (x.length) console.log(`  ${eng} ${c}: ${x.filter((r) => r.ok).length}/${x.length}`) }
if (NV.length) console.log('No verificable aquí:\n  ' + NV.join('\n  '))
process.exitCode = pass === R.length ? 0 : 1
