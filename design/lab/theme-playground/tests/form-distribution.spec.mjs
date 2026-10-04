// Prueba obligatoria de distribución de formularios (design/contracts/form.md §12, DECISIONS.md #184) sobre los
// COMPONENTES REALES del playground (packages/vue/playground, sección #sec-form), en Chromium, Firefox y WebKit.
// Port de design/lab/form/estilo-verificar.mjs (banco de coco) y design/lab/form/r02/verificar.mjs (kiwi).
// Casos: contenedor a 1280/960/720/480/360/320 (ventana 1440) y ventana a esos anchos con contenedor libre, cada uno en
// cuatro estados (limpio; ayuda + error + advertencia + válido; etiquetas largas; ambos). En cada caso:
//   1 mismo borde (±1px) de cada hijo de GFormLayout y de cada línea de GFormRow (incluida la de GFieldGroup);
//   2 cajas de una línea con el mismo top (±1px); 3 sin solapes ni desborde (marco y página);
//   4 orden visual = DOM; 6 etiquetas sin recortar (ni elipsis ni límite de líneas); 7 consola limpia.
// Además: 5 líneas esperadas (signos vitales 1/1/2/3 a 1280/960/720/360; a 360 Calle sola y Ext. · Int. juntos),
// Tab por las partes de un fusionado en orden del DOM y nombres accesibles por parte. GFormReveal (§14): con un bloque
// abierto y anidado (#fr-form), sus hijos terminan en el mismo borde que la pila de fuera y empiezan tras barra + sangría.
// GFormSection (§3, Fase 3): «Preferencias» plegable abierta, «Contacto» con el encabezado al lado según su ancho y las
// secciones de #fx-frame (fuera de GForm) entran en los mismos casos.
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/index.html'
const WIDTHS = ['1280', '960', '720', '480', '360', '320']
const STATES = [[false, false], [true, false], [false, true], [true, true]]

// WebKit da «ResizeObserver loop completed with undelivered notifications» en esta página por componentes ajenos al
// formulario (GTable, GPagination, GWidget, GCalendar): ocurre igual con la sección de formularios quitada (informe de
// bruno). Para no ocultar uno propio, ese aviso no se cuenta como error de consola, pero se instrumenta ResizeObserver:
// una devolución que observa un elemento de #sec-form y cambia el DOM de forma síncrona (en la devolución o en las
// microtareas que encola, p. ej. un parche de Vue) es la causa posible de un bucle y hace fallar la prueba. Las filas,
// el pie y los campos del formulario solo anotan y escriben en el cuadro siguiente (form.md §4.5, §6).
const RO_PROBE = () => {
  const RO = window.ResizeObserver
  const guilty = (window.__roGuilty = [])
  let mo = null
  const watch = () => {
    if (mo || !document.documentElement) return
    mo = new MutationObserver(() => {})
    mo.observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true })
  }
  window.ResizeObserver = class extends RO {
    constructor(cb) {
      super((entries, o) => {
        watch()
        mo && mo.takeRecords()
        const form = entries.filter((e) => e.target.closest && e.target.closest('#sec-form')).map((e) => String(e.target.className).split(' ')[0])
        cb(entries, o)
        if (!form.length) return
        const sync = mo ? mo.takeRecords().length : 0
        queueMicrotask(() => { const later = mo ? mo.takeRecords().length : 0; if (sync || later) guilty.push(...form) })
      })
    }
  }
  window.__roBlame = () => [...new Set(guilty)]
}
async function roBlame(page) {
  return page.evaluate(() => (window.__roBlame ? window.__roBlame() : []))
}
async function watchConsole(page) {
  const errs = []
  await page.addInitScript(RO_PROBE)
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /ResizeObserver|\[Vue warn\]|\[Grana/.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}
async function open(page, width) {
  await page.emulateMedia({ reducedMotion: 'reduce' }) // sin desplazamiento suave del playground: medidas estables
  await page.setViewportSize({ width, height: 900 })
  await page.goto(PAGE)
  await page.waitForSelector('#sec-form .g-form-row[data-lines]')
  await page.evaluate(() => document.fonts.ready)
  await page.locator('#sec-form').scrollIntoViewIfNeeded()
}
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 30))))))
async function bench(page, { w, state, long, density }) {
  if (density !== undefined) await page.selectOption('#fm-bench-density', density)
  if (w !== undefined) await page.selectOption('#fm-bench-w', w)
  if (state !== undefined) await page.locator('#fm-bench-state').setChecked(state)
  if (long !== undefined) await page.locator('#fm-bench-long').setChecked(long)
  await settle(page)
}

/* Geometría (en la página), la misma que la del banco de coco adaptada a los componentes reales */
const geom = () => {
  const out = []
  const T = 1
  const rtl = getComputedStyle(document.documentElement).direction === 'rtl'
  const S = (r) => (rtl ? -r.right : r.left)
  const E = (r) => (rtl ? -r.left : r.right)
  const BOX = ':scope > .g-input__row, :scope > .g-select__control, :scope > .g-textarea__control, :scope > .g-datepicker__field, :scope > .g-input-group__box, :scope > .g-radio-group__options'
  const name = (el) => (el.querySelector('.g-radio-group__label, label, legend, .g-datepicker__label')?.textContent.trim() || el.className.split(' ')[0]).slice(0, 40)
  for (const fr of document.querySelectorAll('#sec-form [data-frame]')) {
    fr.querySelectorAll('.g-form-layout').forEach((lay) => {
      const R = E(lay.getBoundingClientRect())
      for (const c of lay.children) {
        const d = R - E(c.getBoundingClientRect())
        if (Math.abs(d) > T) out.push(`hijo de layout a ${Math.round(d)}px del borde: ${name(c)}`)
      }
    })
    // GFormReveal abierto (form.md §14, #278): cada hijo del cuerpo termina en el mismo borde que la pila de fuera y
    // empieza en el inicio del bloque (= el de la pregunta) + barra + sangría
    fr.querySelectorAll('.g-form-reveal.is-open:not(.is-animating) > .g-form-reveal__body').forEach((body) => {
      const lay = body.parentElement.closest('.g-form-layout')
      if (!lay) return
      const R = E(lay.getBoundingClientRect())
      const cs = getComputedStyle(body)
      const start = S(body.parentElement.getBoundingClientRect()) + parseFloat(cs.borderInlineStartWidth) + parseFloat(cs.paddingInlineStart)
      for (const c of body.children) {
        const r = c.getBoundingClientRect()
        if (Math.abs(R - E(r)) > T) out.push(`hijo de un bloque a ${Math.round(R - E(r))}px del borde: ${name(c)}`)
        if (Math.abs(S(r) - start) > T) out.push(`hijo de un bloque sin la sangría (${Math.round(S(r) - start)}px): ${name(c)}`)
      }
    })
    fr.querySelectorAll('.g-form-row').forEach((row) => {
      if (!row.hasAttribute('data-lines')) out.push(`fila sin medir: ${[...row.children].map(name).join('|')}`)
      const R = E(row.getBoundingClientRect())
      const kids = [...row.children]
      const lines = new Map()
      for (const c of kids) {
        const k = c.dataset.line ?? String(Math.round(c.getBoundingClientRect().top))
        if (!lines.has(k)) lines.set(k, [])
        lines.get(k).push(c)
      }
      let prevBottom = -Infinity
      let domIdx = -1
      ;[...lines.values()].sort((a, b) => a[0].getBoundingClientRect().top - b[0].getBoundingClientRect().top).forEach((ks) => {
        const end = Math.max(...ks.map((k) => E(k.getBoundingClientRect())))
        if (Math.abs(end - R) > T) out.push(`línea que no llega al borde (${Math.round(R - end)}px): ${ks.map(name).join('|')}`)
        const tops = ks.map((k) => k.querySelector(BOX)?.getBoundingClientRect().top).filter((x) => x !== undefined)
        if (tops.length > 1 && Math.max(...tops) - Math.min(...tops) > T) out.push(`cajas desalineadas (${(Math.max(...tops) - Math.min(...tops)).toFixed(1)}px): ${ks.map(name).join('|')}`)
        const sorted = [...ks].sort((a, b) => S(a.getBoundingClientRect()) - S(b.getBoundingClientRect()))
        sorted.forEach((k) => { const i = kids.indexOf(k); if (i < domIdx) out.push(`orden visual ≠ DOM: ${name(k)}`); domIdx = i })
        sorted.slice(1).forEach((k, i) => { if (S(k.getBoundingClientRect()) < E(sorted[i].getBoundingClientRect()) - T) out.push(`solape: ${name(sorted[i])} / ${name(k)}`) })
        const top = Math.min(...ks.map((k) => k.getBoundingClientRect().top))
        if (top < prevBottom - T) out.push(`líneas superpuestas: ${ks.map(name).join('|')}`)
        prevBottom = Math.max(...ks.map((k) => k.getBoundingClientRect().bottom))
        ks.forEach((k) => { const b = k.querySelector(BOX); if (b && E(b.getBoundingClientRect()) > E(k.getBoundingClientRect()) + T) out.push(`caja más ancha que su celda: ${name(k)}`) })
      })
    })
    if (fr.scrollWidth > fr.clientWidth + 1) out.push(`desborde en el marco de ${fr.querySelector('form')?.id}`)
    const FR = fr.getBoundingClientRect()
    fr.querySelectorAll('.g-input__row, .g-select__control, .g-textarea__control, .g-datepicker__field, .g-input-group__box, .g-input-group__part, .g-radio-group__options').forEach((b) => {
      const r = b.getBoundingClientRect()
      if (r.right > FR.right + 1 || r.left < FR.left - 1) out.push(`caja fuera del marco: ${b.closest('.g-input, .g-select, .g-textarea, .g-datepicker, .g-input-group, .g-radio-group')?.id || b.className}`)
    })
    fr.querySelectorAll('.g-input__label, .g-select__label, .g-textarea__label, .g-datepicker__label, .g-input-group__label, .g-field-group__label, .g-radio-group__label, .g-radio-group__option-label').forEach((l) => {
      const cs = getComputedStyle(l)
      if (l.scrollWidth > l.clientWidth + 1 || l.scrollHeight > l.clientHeight + 1) out.push(`etiqueta recortada: ${l.textContent}`)
      if (cs.textOverflow === 'ellipsis' || (cs.webkitLineClamp && cs.webkitLineClamp !== 'none')) out.push(`etiqueta con elipsis o límite de líneas: ${l.textContent}`)
    })
  }
  if (document.documentElement.scrollWidth > window.innerWidth + 1) out.push(`desborde de página ${document.documentElement.scrollWidth - window.innerWidth}px`)
  return out
}

test.describe('formularios r02 · prueba obligatoria de distribución (form.md §12)', () => {
  test('contenedor a 1280/960/720/480/360/320 × cuatro estados, líneas esperadas y consola limpia', async ({ page, browserName }) => {
    test.setTimeout(180_000)
    const errs = await watchConsole(page)
    await open(page, 1440)
    // Un bloque condicional abierto entra en la prueba (#184, form.md §14): factura Sí · persona Moral, con filas dentro
    expect(await page.locator('#sec-form [data-frame] .g-form-reveal.is-open .g-form-reveal.is-open .g-form-row').count(), 'bloque anidado abierto con una fila').toBeGreaterThan(0)
    // Una GFormSection plegable ABIERTA entra en la prueba (form.md §3 «Verificación (Fase 3)»): «Preferencias» de
    // #fm-medium, con una fila dentro; y una sección con el encabezado al lado (#fm-sec-contacto a partir de space × 200)
    expect(await page.locator('#sec-form [data-frame] .g-form-section--mode-collapsible.is-open > .g-form-section__panel .g-form-row').count(), 'plegable abierta con una fila').toBeGreaterThan(0)
    const fails = []
    for (const w of WIDTHS) {
      for (const [state, long] of STATES) {
        await bench(page, { w, state, long })
        const g = await page.evaluate(geom)
        if (g.length) fails.push(`contenedor ${w} mensajes=${state} largas=${long}: ${g.slice(0, 6).join(' · ')}`)
      }
    }
    expect(fails, browserName).toEqual([])
    // §12.5 líneas esperadas
    await bench(page, { state: false, long: false })
    for (const [w, n] of [['1280', 1], ['960', 1], ['720', 2], ['360', 3]]) {
      await bench(page, { w })
      expect(await page.locator('#fm-vitals').getAttribute('data-lines'), `signos vitales a ${w}`).toBe(String(n))
    }
    // Fila con GCombobox (combobox.md «En una GFormRow», #336): dos campos de catálogo que comparten línea mientras cada
    // uno conserva --g-form-min: 60 (240px con space 4, declarado por el CSS sobre appearance="field"); por debajo, se parte
    for (const [w, n] of [['1280', 1], ['720', 1], ['360', 2], ['320', 2]]) {
      await bench(page, { w })
      const cl = await page.evaluate(() => {
        const row = document.querySelector('#fm-clinica')
        return { lines: row.dataset.lines, roles: [...row.children].map((c) => c.querySelector('input:not([type="hidden"])')?.getAttribute('role')), cb: [...row.children].every((c) => c.classList.contains('g-combobox') && c.classList.contains('g-input')), ws: [...row.children].map((c) => c.getBoundingClientRect().width), flow: [...row.children].map((c) => [...c.children].filter((k) => !['absolute', 'fixed'].includes(getComputedStyle(k).position) && getComputedStyle(k).display !== 'none').length) }
      })
      expect(cl.lines, `fila con GCombobox a ${w}`).toBe(String(n))
      expect(cl.roles).toEqual(['combobox', 'combobox'])
      expect(cl.cb).toBe(true)
      expect(cl.flow, 'tres hijos en flujo (etiqueta · caja · pie): comparte línea').toEqual([3, 3])
      if (n === 1) for (const cw of cl.ws) expect(cw, `a ${w}: cada GCombobox ≥ 240px`).toBeGreaterThanOrEqual(239)
    }
    await bench(page, { w: '720' })
    const vit720 = await page.evaluate(() => [...document.querySelector('#fm-vitals').children].map((c) => c.dataset.line))
    expect(vit720, 'a 720: Temperatura · Presión / FC · Sat. · Peso · Estatura').toEqual(['0', '0', '1', '1', '1', '1'])
    // Receta de signos vitales con GNumberField (#314): FC, Sat., Peso y Estatura son spinbutton con la unidad pegada y
    // sin −/+ (miden lo que GInput: la distribución de r02 no cambia); el envío lleva el canónico en un oculto
    const vit = await page.evaluate(() => [...document.querySelector('#fm-vitals').children].map((c) => [c.classList.contains('g-number-field'), c.querySelector('input:not([type="hidden"])')?.getAttribute('role') || null, Boolean(c.querySelector('.g-number-field__steppers'))]))
    expect(vit, 'signos vitales: dos GInputGroup y cuatro GNumberField sin −/+').toEqual([[false, null, false], [false, null, false], [true, 'spinbutton', false], [true, 'spinbutton', false], [true, 'spinbutton', false], [true, 'spinbutton', false]])
    await bench(page, { w: '360' })
    const addr = await page.evaluate(() => ['fa-calle', 'fa-ext', 'fa-int'].map((id) => document.getElementById(id).closest('.g-input').dataset.line))
    expect(addr[0] !== addr[1] && addr[1] === addr[2], `dirección a 360: Calle sola y Ext. · Int. juntos (${addr})`).toBe(true)
    // Nombre | Apellido: apilados a 360 (ancho propio 326) y juntos a 375 (343), como en kiwi r02
    expect(await page.locator('#fs-nombre').evaluate((i) => i.closest('.g-form-row').dataset.lines)).toBe('2')
    await page.evaluate(() => { document.querySelectorAll('#sec-form [data-frame]').forEach((f) => { f.style.inlineSize = '375px' }) })
    await settle(page)
    expect(await page.locator('#fs-nombre').evaluate((i) => i.closest('.g-form-row').dataset.lines)).toBe('1')
    // GRadioGroup en fila (#268, #271): Fecha · Sexo (segmented) · ¿Primera consulta? (inline). A 1280 comparten una línea
    // con las cajas al mismo top; al estrechar, la fila se parte ANTES de que el segmentado se apile (por su ancho natural)
    await page.evaluate(() => { document.querySelectorAll('#sec-form [data-frame]').forEach((f) => { f.style.inlineSize = '' }) })
    const rgRow = async () => page.evaluate(() => {
      const sexo = document.getElementById('fm-sexo')
      const row = sexo.closest('.g-form-row')
      const box = (el) => el.querySelector(':scope > .g-input__row, :scope > .g-datepicker__field, :scope > .g-radio-group__options').getBoundingClientRect()
      const kids = [...row.children]
      return { lines: row.dataset.lines, line: kids.map((k) => k.dataset.line), tops: kids.map((k) => Math.round(box(k).top * 10) / 10), stacked: sexo.classList.contains('is-stacked'), segH: box(sexo).height, dateH: box(kids[0]).height }
    })
    await bench(page, { w: '1280', state: false, long: false })
    let r = await rgRow()
    expect(r.lines, `1280: Fecha · Sexo · Primera en una línea (${JSON.stringify(r)})`).toBe('1')
    expect(Math.max(...r.tops) - Math.min(...r.tops), `1280: cajas al mismo top ${r.tops}`).toBeLessThanOrEqual(1)
    expect(Math.abs(r.segH - r.dateH), 'la caja del segmentado mide lo que la del campo vecino').toBeLessThanOrEqual(1)
    for (const w of ['960', '720', '480', '360']) {
      await bench(page, { w })
      r = await rgRow()
      // Mientras Sexo no está solo en su línea, no se apila
      const alone = r.line.filter((l) => l === r.line[1]).length === 1
      expect(!r.stacked || alone, `${w}: Sexo apilado compartiendo línea (${JSON.stringify(r)})`).toBe(true)
      for (const l of new Set(r.line)) {
        const ts = r.tops.filter((_, i) => r.line[i] === l)
        expect(Math.max(...ts) - Math.min(...ts), `${w}: línea ${l} con cajas al mismo top (${ts})`).toBeLessThanOrEqual(1)
      }
    }
    await bench(page, { w: '480' })
    r = await rgRow()
    expect(r.stacked, `480: Sexo cabe sin apilarse en su línea (${JSON.stringify(r)})`).toBe(false)
    expect(errs, browserName).toEqual([])
    expect(await roBlame(page), `${browserName}: bucle de ResizeObserver con observaciones del formulario`).toEqual([])
  })

  for (const vw of WIDTHS.map(Number)) {
    test(`ventana a ${vw}px con contenedor libre × cuatro estados`, async ({ page, browserName }) => {
      const errs = await watchConsole(page)
      await open(page, vw)
      const fails = []
      for (const [state, long] of STATES) {
        await bench(page, { state, long })
        const g = await page.evaluate(geom)
        if (g.length) fails.push(`ventana ${vw} mensajes=${state} largas=${long}: ${g.slice(0, 6).join(' · ')}`)
      }
      expect(fails, browserName).toEqual([])
      expect(errs, browserName).toEqual([])
      expect(await roBlame(page), `${browserName}: bucle de ResizeObserver con observaciones del formulario`).toEqual([])
    })
  }

  // Además (§12): densidades comfortable y compact, y pointer: coarse en Chromium (las cajas crecen en alto; 1–3 siguen)
  for (const [density, coarse] of [['comfortable', false], ['compact', false], ['compact', true]]) {
    test(`densidad ${density}${coarse ? ' con pointer: coarse' : ''}: contenedor a los seis anchos × cuatro estados`, async ({ browser, browserName }) => {
      test.skip(browserName !== 'chromium', 'densidades y puntero grueso: solo en Chromium (form.md §12)')
      test.setTimeout(180_000)
      const ctx = await browser.newContext(coarse ? { hasTouch: true, isMobile: true, viewport: { width: 1440, height: 900 } } : {})
      const page = await ctx.newPage()
      const errs = await watchConsole(page)
      await open(page, 1440)
      if (coarse) expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true)
      await bench(page, { density })
      const fails = []
      for (const w of WIDTHS) {
        for (const [state, long] of STATES) {
          await bench(page, { w, state, long })
          const g = await page.evaluate(geom)
          if (g.length) fails.push(`${density} contenedor ${w} mensajes=${state} largas=${long}: ${g.slice(0, 6).join(' · ')}`)
        }
      }
      if (coarse) {
        const h = await page.evaluate(() => Math.min(...[...document.querySelectorAll('#fm-short .g-input__control, #fm-short .g-input-group__box')].map((b) => b.getBoundingClientRect().height)))
        expect(h, 'cajas ≥ 44px con puntero grueso').toBeGreaterThanOrEqual(44)
      }
      expect(fails).toEqual([])
      expect(errs).toEqual([])
      expect(await roBlame(page)).toEqual([])
      await ctx.close()
    })
  }

  test('la sonda de ResizeObserver detecta una devolución del formulario que escribe de forma síncrona (prueba negativa)', async ({ page }) => {
    await watchConsole(page)
    await open(page, 1280)
    expect(await roBlame(page)).toEqual([])
    await page.evaluate(() => new Promise((r) => {
      const el = document.querySelector('#fm-short')
      const ro = new ResizeObserver(() => { el.setAttribute('data-probe', String(Math.random())); ro.disconnect(); requestAnimationFrame(r) })
      ro.observe(el)
    }))
    expect(await roBlame(page)).toEqual(['g-form'])
  })

  test('Tab sigue el DOM, una parada por parte; nombre accesible de cada parte = etiqueta + parte', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page, 1280)
    // Nombres accesibles (2.5.3)
    await expect(page.getByRole('combobox', { name: 'Teléfono Código de país', exact: true }).first()).toHaveAttribute('id', 'fs-tel-pais')
    await expect(page.getByRole('textbox', { name: 'Teléfono', exact: true }).first()).toHaveAttribute('id', 'fs-tel-num')
    await expect(page.getByRole('textbox', { name: 'Presión arterial (opcional) sistólica', exact: true })).toHaveAttribute('id', 'fm-pa-s')
    await expect(page.getByRole('combobox', { name: 'Temperatura Unidad', exact: true }).first()).toHaveAttribute('id', 'fm-temp-u')
    // La etiqueta enfoca la parte principal
    await page.locator('#fs-tel .g-input-group__label').click()
    await expect(page.locator('#fs-tel-num')).toBeFocused()
    // Tab en orden del DOM (WebKit en macOS solo tabula a controles de texto salvo con la preferencia del sistema:
    // Playwright lo emula con Tab completo; si no, se comprueba la secuencia de los campos de texto)
    await page.locator('#fs-nombre').focus()
    const seq = ['fs-nombre']
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab')
      seq.push(await page.evaluate(() => document.activeElement.id))
    }
    const full = ['fs-nombre', 'fs-apellido', 'fs-correo', 'fs-tel-pais', 'fs-tel-num', 'fs-ext', 'fs-com']
    if (browserName === 'webkit' && !seq.includes('fs-tel-pais')) expect(seq.slice(0, 6)).toEqual(full.filter((x) => x !== 'fs-tel-pais'))
    else expect(seq).toEqual(full)
    // Pulsar un texto fijo («/») enfoca la parte siguiente
    await page.locator('#fm-pa .g-input-group__part--text').first().click()
    await expect(page.locator('#fm-pa-d')).toBeFocused()
    expect(errs, browserName).toEqual([])
    expect(await roBlame(page)).toEqual([])
  })
})
