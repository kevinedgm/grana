// GFormSection Fase 3 sobre el COMPONENTE REAL del playground (packages/vue/playground, #sec-form), en Chromium, Firefox
// y WebKit. Port de design/lab/form-section/r01/verificar.mjs (kiwi) a GFormSection (design/contracts/form.md §3;
// DECISIONS.md #284 a #291). La distribución con una plegable abierta está en form-distribution.spec.mjs (#184).
// Fijos del playground: formulario #fm-medium (dentro de GForm, con resumen): «Información básica» (fija, con acción),
// «Contacto» (fija, headerPlacement auto, divider), «Signos vitales» (divider), «Datos fiscales» (addable, divider),
// «Preferencias» (collapsible ABIERTA al cargar, con summary y dos campos obligatorios, divider). Marco #fx-frame (fuera
// de GForm, todas auto): #fx-1 fija (divider en la primera: no se pinta), #fx-2 collapsible plegada con acción y summary,
// #fx-3 addable sin agregar.
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/index.html'

// Transiciones creadas en paneles de sección desde la carga (transitionrun): «sin transición al cargar»
const RUNS = () => {
  window.__runs = []
  document.addEventListener('transitionrun', (e) => {
    const t = e.target
    if (t && t.classList && t.classList.contains('g-form-section__panel')) window.__runs.push(`${t.id}:${e.propertyName}`)
  }, true)
}
async function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana/.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}
async function open(page, { width = 1280, height = 900, reduced = false } = {}) {
  await page.addInitScript(RUNS)
  await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' })
  await page.setViewportSize({ width, height })
  await page.goto(PAGE)
  await page.waitForSelector('#fm-sec-pref.is-ready')
  await page.waitForSelector('#fx-2.is-ready')
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto'
    window.__track = (sel, ms) => new Promise((res) => {
      const el = document.querySelector(sel)
      const r0 = el.getBoundingClientRect()
      const s0 = scrollY
      let dt = 0, dl = 0, ds = 0, n = 0
      const t0 = performance.now()
      ;(function f() {
        const r = el.getBoundingClientRect()
        dt = Math.max(dt, Math.abs(r.top - r0.top)); dl = Math.max(dl, Math.abs(r.left - r0.left)); ds = Math.max(ds, Math.abs(scrollY - s0)); n++
        if (performance.now() - t0 < ms) requestAnimationFrame(f); else res({ dt, dl, ds, n })
      })()
    })
    window.__st = (id) => {
      const sec = document.getElementById(id)
      const pn = document.getElementById(`${id}-panel`)
      const cs = getComputedStyle(pn)
      const body = pn.firstElementChild
      const t = document.getElementById(`${id}-toggle`)
      return { inert: pn.hasAttribute('inert'), vis: cs.visibility, op: +cs.opacity, h: pn.getBoundingClientRect().height, ovf: getComputedStyle(body).overflowY,
        anim: sec.classList.contains('is-animating'), open: sec.classList.contains('is-open'), exp: t ? t.getAttribute('aria-expanded') : null, desc: t ? t.getAttribute('aria-describedby') : null }
    }
    window.__fd = (id) => [...new FormData(document.getElementById(id)).keys()]
    window.__fm = () => document.getElementById('app').__vue_app__._instance.proxy.fm
    window.__app = () => document.getElementById('app').__vue_app__._instance.proxy
    window.__pause = (id, frac = 0.5) => {
      const el = document.getElementById(id)
      const as = el.getAnimations()
      const main = as.find((a) => a.transitionProperty === 'grid-template-rows') || as.find((a) => a.transitionProperty === 'opacity')
      if (!main) return null
      const t = main.effect.getComputedTiming()
      const at = (t.delay || 0) + t.duration * frac
      as.forEach((a) => { a.pause(); a.currentTime = at })
      return as.map((a) => a.transitionProperty)
    }
    window.__finish = (id) => document.getElementById(id).getAnimations().forEach((a) => { try { a.finish() } catch {} })
    window.__inView = (el) => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight }
  })
}
const settled = (page, id) => page.waitForFunction((i) => !document.getElementById(i).classList.contains('is-animating'), id, { timeout: 4000 })
const act = (page) => page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName)
const bench = async (page, { w, density }) => {
  if (density !== undefined) await page.selectOption('#fm-bench-density', density)
  if (w !== undefined) await page.selectOption('#fm-bench-w', w)
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 50))))))
}
// Modelo válido de #fm-medium (la fecha por el modelo: el calendario no es lo que se prueba)
const fillValid = (page) => page.evaluate(() => Object.assign(__fm().m, { nombre: 'Ana', apellido1: 'Godínez', nacimiento: '1990-05-04', sexo: 'f', temp: '36.5', avisos: ['mail'], privacidad: true }))

test.describe('GFormSection Fase 3 · componente real (form.md §3)', () => {
  test('carga sin transiciones; anatomía APG; plegada sin hueco, en FormData y fuera de Tab; sin agregar fuera de FormData', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page)
    await page.waitForTimeout(400)
    expect(await page.evaluate(() => window.__runs), 'al cargar no corre ninguna transición de panel (is-ready tras la primera medida)').toEqual([])
    // #fx-2: plegada al cargar (y al lado)
    let s = await page.evaluate(() => __st('fx-2'))
    expect(s.inert && s.vis === 'hidden' && s.h === 0 && s.exp === 'false' && s.desc === 'fx-2-summary', JSON.stringify(s)).toBe(true)
    expect(await page.evaluate(() => { const t = document.getElementById('fx-2-toggle'); return t.parentElement.tagName === 'H3' && t.type === 'button' && !!document.getElementById(t.getAttribute('aria-controls')) })).toBe(true)
    const snap = await page.locator('#fx-2').ariaSnapshot()
    expect(snap, snap).toMatch(/heading "Notas de la consulta" \[level=3\]/)
    expect(snap).toMatch(/button "Notas de la consulta"/)
    expect(snap).not.toMatch(/textbox "Notas"/)
    // Plegada no deja hueco bajo el encabezado
    await page.locator('#fm-sec-pref-toggle').click()
    await settled(page, 'fm-sec-pref')
    const gap = await page.evaluate(() => { const sec = document.getElementById('fm-sec-pref'); return sec.getBoundingClientRect().bottom - sec.querySelector('.g-form-section__header').getBoundingClientRect().bottom })
    expect(Math.abs(gap), `fondo sección − fondo encabezado ${gap}`).toBeLessThanOrEqual(0.5)
    // FormData: la plegada SÍ (inert sin fieldset disabled); la no agregada NO
    const keys = await page.evaluate(() => __fd('fm-medium'))
    expect(keys, keys.join(',')).toEqual(expect.arrayContaining(['m-idioma', 'm-horario', 'm-obs']))
    expect(keys.some((k) => /m-rfc|m-razon|m-cpf/.test(k)), keys.join(',')).toBe(false)
    // Sin agregar: sin encabezado en el árbol; botón descrito por la descripción
    const snapF = await page.locator('#fm-sec-fiscal').ariaSnapshot()
    expect(snapF).not.toMatch(/heading/)
    expect(snapF).toMatch(/button "Agregar datos fiscales"/)
    expect(await page.evaluate(() => { const b = document.querySelector('#fm-sec-fiscal .g-form-section__add-button'); return document.getElementById(b.getAttribute('aria-describedby'))?.textContent })).toContain('factura')
    // Tab salta el panel plegado y la agregable sin agregar
    if (browserName !== 'webkit') {
      await page.locator('#fm-sec-fiscal .g-form-section__add-button').focus()
      await page.keyboard.press('Tab')
      expect(await act(page), 'de «Agregar…» al botón de la plegada, sin pasar por los campos fiscales').toBe('fm-sec-pref-toggle')
      await page.keyboard.press('Tab')
      expect(await page.evaluate(() => document.activeElement.closest('.g-form-actions') !== null), `de la plegada al pie (${await act(page)})`).toBe(true)
    } else {
      // WebKit en macOS tabula solo a campos de texto (preferencia del sistema): de Estatura al siguiente texto, fuera
      // de las dos secciones
      await page.focus('#fm-est')
      await page.keyboard.press('Tab')
      const a = await act(page)
      expect(a !== 'fm-rfc' && a !== 'fm-horario' && a !== 'fm-obs', `Tab salta lo plegado y lo no agregado (${a})`).toBe(true)
    }
    expect(errs, browserName).toEqual([])
  })

  test('abrir y plegar: Δ0 del botón y del desplazamiento (a media vista, pegado arriba, RTL, al lado); foco quieto; intermedios; plegar por programa', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page)
    await page.evaluate(() => document.getElementById('fm-sec-pref').scrollIntoView({ block: 'center' }))
    const name0 = await page.evaluate(() => document.getElementById('fm-sec-pref-toggle').textContent.trim())
    await page.focus('#fm-sec-pref-toggle')
    for (const key of ['Space', 'Enter']) {
      const tr = page.evaluate(() => __track('#fm-sec-pref-toggle', 700))
      await page.waitForTimeout(40)
      await page.keyboard.press(key)
      const t = await tr
      await settled(page, 'fm-sec-pref')
      expect(t.dt === 0 && t.dl === 0 && t.ds === 0, `${key}: Δtop ${t.dt} Δleft ${t.dl} Δscroll ${t.ds} (${t.n} cuadros)`).toBe(true)
      expect(t.n).toBeGreaterThan(3)
      expect(await act(page), 'el foco se queda en el botón').toBe('fm-sec-pref-toggle')
      expect(await page.evaluate(() => document.getElementById('fm-sec-pref-toggle').textContent.trim())).toBe(name0)
    }
    let s = await page.evaluate(() => __st('fm-sec-pref'))
    expect(s.exp === 'true' && !s.inert && s.vis === 'visible' && s.ovf === 'visible' && s.desc === null, JSON.stringify(s)).toBe(true)
    if (browserName !== 'webkit') {
      await page.keyboard.press('Tab')
      expect(await page.evaluate(() => document.getElementById('fm-sec-pref-panel').contains(document.activeElement)), 'abierta: Tab entra en el cuerpo').toBe(true)
    }
    // Plegar por programa (v-model:open) con el foco dentro: al botón antes de inert, nunca a <body>
    await page.focus('#fm-horario')
    await page.evaluate(() => { __fm().prefOpen = false })
    await settled(page, 'fm-sec-pref')
    expect(await act(page)).toBe('fm-sec-pref-toggle')
    expect(await page.evaluate(() => __st('fm-sec-pref').inert)).toBe(true)
    // Pegado arriba de la vista (con el teclado: el clic de Playwright desplaza lo que tapa la barra fija del playground)
    await page.evaluate(() => { const r = document.getElementById('fm-sec-pref-toggle').getBoundingClientRect(); scrollBy(0, r.top - 60) })
    await page.evaluate(() => document.getElementById('fm-sec-pref-toggle').focus({ preventScroll: true }))
    for (let i = 0; i < 2; i++) {
      const tr = page.evaluate(() => __track('#fm-sec-pref-toggle', 700))
      await page.waitForTimeout(40)
      await page.keyboard.press('Enter')
      const t = await tr
      await settled(page, 'fm-sec-pref')
      expect(t.dt === 0 && t.ds === 0, `arriba (${i ? 'plegar' : 'abrir'}): Δ ${t.dt}, Δscroll ${t.ds}`).toBe(true)
    }
    // A la mitad de la apertura: altura y opacidad intermedias, recortado, sin inert; asentado: overflow visible
    await page.evaluate(() => document.getElementById('fm-sec-pref').scrollIntoView({ block: 'center' }))
    // (tras el bucle está plegada) abierta y asentada → altura completa; se vuelve a plegar
    await page.click('#fm-sec-pref-toggle')
    await settled(page, 'fm-sec-pref')
    const full = await page.evaluate(() => __st('fm-sec-pref'))
    await page.click('#fm-sec-pref-toggle')
    await settled(page, 'fm-sec-pref')
    const props = await page.evaluate(async () => { document.getElementById('fm-sec-pref-toggle').click(); await Vue.nextTick(); return __pause('fm-sec-pref-panel', 0.5) })
    expect(props, 'transiciones del panel al abrir').toEqual(expect.arrayContaining(['grid-template-rows', 'opacity']))
    s = await page.evaluate(() => __st('fm-sec-pref'))
    expect(s.h > 0 && s.h < full.h && !s.inert && s.ovf === 'hidden' && s.anim, `abriendo a la mitad ${JSON.stringify(s)} de ${full.h}`).toBe(true)
    await page.evaluate(() => __pause('fm-sec-pref-panel', 0.9))
    s = await page.evaluate(() => __st('fm-sec-pref'))
    expect(s.op > 0 && s.op < 1, `opacidad intermedia al final de la apertura (${s.op})`).toBe(true)
    await page.evaluate(() => __finish('fm-sec-pref-panel'))
    await settled(page, 'fm-sec-pref')
    // RTL: Δ0 (también del inicio) y chevron al inicio (derecha), espejado; abierta apunta abajo
    await page.evaluate(() => document.getElementById('fm-medium').closest('[data-frame]').setAttribute('dir', 'rtl'))
    for (let i = 0; i < 2; i++) {
      const tr = page.evaluate(() => __track('#fm-sec-pref-toggle', 700))
      await page.waitForTimeout(40)
      await page.click('#fm-sec-pref-toggle')
      const t = await tr
      await settled(page, 'fm-sec-pref')
      expect(t.dt === 0 && t.dl === 0 && t.ds === 0, `RTL: Δ ${t.dt}/${t.dl}/${t.ds}`).toBe(true)
    }
    const rtl = await page.evaluate(() => { const svg = document.querySelector('#fm-sec-pref .g-form-section__chevron > svg'); const tg = document.getElementById('fm-sec-pref-toggle').getBoundingClientRect(); const ch = svg.parentElement.getBoundingClientRect(); return { rot: getComputedStyle(svg).rotate, scale: getComputedStyle(svg).scale, right: ch.left > tg.left + tg.width / 2, open: document.getElementById('fm-sec-pref').classList.contains('is-open') } })
    expect(rtl.open && rtl.rot === '-90deg' && /-1/.test(rtl.scale) && rtl.right, JSON.stringify(rtl)).toBe(true)
    await page.evaluate(() => document.getElementById('fm-medium').closest('[data-frame]').removeAttribute('dir'))
    // Al lado (#fx-2): el botón va en la columna del encabezado y no se mueve; el panel en la del cuerpo
    await page.evaluate(() => document.getElementById('fx-2').scrollIntoView({ block: 'center' }))
    expect(await page.evaluate(() => document.getElementById('fx-2').classList.contains('is-header-side'))).toBe(true)
    const tr = page.evaluate(() => __track('#fx-2-toggle', 700))
    await page.waitForTimeout(40)
    await page.click('#fx-2-toggle')
    const t = await tr
    await settled(page, 'fx-2')
    const sideOk = await page.evaluate(() => document.getElementById('fx-2-panel').getBoundingClientRect().left > document.querySelector('#fx-2 > .g-form-section__header').getBoundingClientRect().right)
    expect(t.dt === 0 && t.dl === 0 && t.ds === 0 && sideOk, `al lado: Δ ${t.dt}/${t.dl}/${t.ds}, panel en la columna del cuerpo ${sideOk}`).toBe(true)
    expect(errs, browserName).toEqual([])
  })

  test('envío con errores: abre sin animar las plegadas con error y enfoca el resumen; «N errores» al volver a plegar; enlace, focusFirstError() y showErrors() abren', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page)
    await page.click('#fm-sec-pref-toggle')
    await settled(page, 'fm-sec-pref')
    await page.evaluate(() => Object.assign(__fm().m, { nombre: 'Ana', apellido1: 'Godínez', nacimiento: '1990-05-04', sexo: 'f', temp: '36.5' }))
    await page.evaluate(() => { window.__runs = [] })
    await page.click('#fm-medium button[value="save"]')
    await page.waitForFunction(() => document.activeElement?.classList.contains('g-error-summary'))
    let s = await page.evaluate(() => __st('fm-sec-pref'))
    expect(s.open && s.exp === 'true' && !s.inert, `la plegada con errores se abre (${JSON.stringify(s)})`).toBe(true)
    expect(await page.evaluate(() => window.__runs.filter((r) => r.startsWith('fm-sec-pref-panel:grid'))), 'abrir para llevar a un campo: sin transición de altura').toEqual([])
    // Los campos de la plegada CUENTAN (están en el resumen); los de la agregable sin agregar no
    const hrefs = await page.evaluate(() => [...document.querySelectorAll('#fm-medium .g-error-summary__link')].map((a) => a.getAttribute('href')))
    expect(hrefs.some((h) => /privacidad/.test(h)), hrefs.join(',')).toBe(true)
    expect(hrefs.some((h) => /rfc/.test(h)), hrefs.join(',')).toBe(false)
    // Volver a plegar: estado de errores en el encabezado (texto + icono), descripción del botón
    await page.click('#fm-sec-pref-toggle')
    await settled(page, 'fm-sec-pref')
    const dg = await page.evaluate(() => { const d = document.getElementById('fm-sec-pref-summary'); return { txt: d?.textContent.replace(/\s+/g, ' ').trim(), icon: !!d?.querySelector('.g-form-section__status > svg.g-icon'), desc: document.getElementById('fm-sec-pref-toggle').getAttribute('aria-describedby') } })
    expect(dg.txt?.startsWith('2 errores') && dg.icon && dg.desc === 'fm-sec-pref-summary', JSON.stringify(dg)).toBe(true)
    // Enlace del resumen a un campo de la plegada: abre en un cuadro, enfoca, etiqueta a la vista, sin desplazamiento interno
    await page.locator('#fm-medium .g-error-summary__link', { hasText: 'aviso de privacidad' }).click()
    await page.waitForTimeout(120)
    const nav = await page.evaluate(() => { const b = document.querySelector('#fm-sec-pref-panel > .g-form-section__body'); const a = document.activeElement; const lab = a.closest('.g-checkbox')
      return { inPanel: document.getElementById('fm-sec-pref-panel').contains(a), type: a.type, exp: document.getElementById('fm-sec-pref-toggle').getAttribute('aria-expanded'), st: b.scrollTop, pst: document.getElementById('fm-sec-pref-panel').scrollTop, lab: __inView(lab) } })
    expect(nav.inPanel && nav.type === 'checkbox' && nav.exp === 'true' && nav.st === 0 && nav.pst === 0 && nav.lab, JSON.stringify(nav)).toBe(true)
    // focusFirstError(): abre la plegada y resuelve true con el foco ya puesto
    await page.click('#fm-sec-pref-toggle')
    await settled(page, 'fm-sec-pref')
    const ff = await page.evaluate(async () => { const r = await __app().fmMedium.focusFirstError(); return { r, a: document.activeElement.id, inPanel: document.getElementById('fm-sec-pref-panel').contains(document.activeElement), open: document.getElementById('fm-sec-pref').classList.contains('is-open') } })
    expect(ff.r === true && ff.inPanel && ff.open, JSON.stringify(ff)).toBe(true)
    // showErrors() (error del servidor): abre las plegadas con errores que bloquean
    await page.click('#fm-sec-pref-toggle')
    await settled(page, 'fm-sec-pref')
    await page.click('#fm-server')
    await page.waitForFunction(() => document.getElementById('fm-sec-pref').classList.contains('is-open'))
    expect(await page.evaluate(() => __st('fm-sec-pref').inert)).toBe(false)
    expect(errs, browserName).toEqual([])
  })

  test('addable: fuera del envío sin agregar; agregar enfoca el título; quitar con confirmación (Cancelar enfocado, Esc), descarta y vuelve a «Agregar…»', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page)
    await fillValid(page)
    // Sin agregar: envía aunque la aplicación calcule m-rfc sin condiciones
    await page.click('#fm-medium button[value="save"]')
    await page.waitForFunction(() => /^submit/.test(document.getElementById('fm-medium-log').textContent))
    await page.evaluate(() => document.getElementById('fm-sec-fiscal').scrollIntoView({ block: 'center' }))
    const tr = page.evaluate(() => __track('#fm-sec-fiscal', 600))
    await page.waitForTimeout(40)
    await page.click('#fm-sec-fiscal .g-form-section__add-button')
    const t = await tr
    await settled(page, 'fm-sec-fiscal')
    expect(await act(page)).toBe('fm-sec-fiscal-title')
    expect(t.dt === 0 && t.ds === 0, `agregar: la sección no se mueve (Δ ${t.dt}, Δscroll ${t.ds})`).toBe(true)
    expect(await page.evaluate(() => __fm().fiscal)).toBe(true)
    expect(await page.evaluate(() => __fd('fm-medium'))).toEqual(expect.arrayContaining(['m-rfc', 'm-razon', 'm-cpf']))
    await page.keyboard.press('Tab')
    if (browserName !== 'webkit') {
      expect(await page.evaluate(() => document.activeElement.classList.contains('g-form-section__remove'))).toBe(true)
      await page.keyboard.press('Tab')
    }
    expect(await act(page), 'Tab desde el título: «Quitar…» y el primer campo').toBe('fm-rfc')
    // Agregada: sus errores bloquean
    await page.click('#fm-medium button[value="save"]')
    await page.waitForFunction(() => /^invalid/.test(document.getElementById('fm-medium-log').textContent))
    expect(await page.textContent('#fm-medium-log')).toContain('m-rfc')
    // Con datos escritos: alertdialog con el foco en «Cancelar»
    await page.fill('#fm-rfc', 'GOD')
    await page.locator('#fm-sec-fiscal .g-form-section__remove').focus()
    await page.keyboard.press('Enter')
    await page.waitForSelector('#fm-sec-fiscal dialog.g-form-section__confirm[open]')
    await page.waitForTimeout(300)
    let dlg = await page.evaluate(() => { const d = document.querySelector('#fm-sec-fiscal dialog'); return { role: d.getAttribute('role'), a: document.activeElement.textContent.trim(), inside: d.contains(document.activeElement) } })
    expect(dlg.role === 'alertdialog' && dlg.a === 'Cancelar' && dlg.inside, JSON.stringify(dlg)).toBe(true)
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => !document.querySelector('#fm-sec-fiscal dialog').open)
    await page.waitForTimeout(400)
    expect(await page.evaluate(() => __fm().fiscal)).toBe(true)
    expect(await page.evaluate(() => document.activeElement.classList.contains('g-form-section__remove')), 'Cancelar: foco de vuelta a «Quitar…»').toBe(true)
    // Esc también cancela
    await page.keyboard.press('Enter')
    await page.waitForSelector('#fm-sec-fiscal dialog[open]')
    await page.waitForTimeout(300)
    await page.keyboard.press('Escape')
    await page.waitForFunction(() => !document.querySelector('#fm-sec-fiscal dialog').open)
    await page.waitForTimeout(400)
    expect(await page.evaluate(() => __fm().fiscal)).toBe(true)
    expect(await page.evaluate(() => document.activeElement.classList.contains('g-form-section__remove')), 'Esc: foco de vuelta a «Quitar…»').toBe(true)
    // Confirmar: quita, descarta y enfoca «Agregar…»; errores fuera del resumen; la aplicación vació su modelo; dirty
    await page.keyboard.press('Enter')
    await page.waitForSelector('#fm-sec-fiscal dialog[open]')
    await page.waitForTimeout(300)
    await page.locator('#fm-sec-fiscal dialog .g-btn--color-danger').click()
    await page.waitForFunction(() => document.activeElement?.classList.contains('g-form-section__add-button'), null, { timeout: 4000 })
    await settled(page, 'fm-sec-fiscal')
    const rem = await page.evaluate(() => ({ links: [...document.querySelectorAll('#fm-medium .g-error-summary__link')].map((x) => x.getAttribute('href')), fd: __fd('fm-medium'), model: __fm().m.rfc, dirty: __fm().dirty }))
    expect(rem.links.some((h) => /rfc/.test(h)), rem.links.join(',')).toBe(false)
    expect(rem.fd.some((k) => /m-rfc/.test(k)) || rem.model !== '' || !rem.dirty, JSON.stringify(rem)).toBe(false)
    // Volver a agregar: vacía y sin errores revelados; quitar sin haber escrito: directo
    await page.click('#fm-sec-fiscal .g-form-section__add-button')
    await settled(page, 'fm-sec-fiscal')
    expect(await page.inputValue('#fm-rfc')).toBe('')
    expect(await page.getAttribute('#fm-rfc', 'aria-invalid')).toBeNull()
    await page.click('#fm-sec-fiscal .g-form-section__remove')
    await page.waitForTimeout(150)
    dlg = await page.evaluate(() => ({ added: __fm().fiscal, open: document.querySelector('#fm-sec-fiscal dialog').open, add: document.activeElement.classList.contains('g-form-section__add-button') }))
    expect(!dlg.added && !dlg.open && dlg.add, JSON.stringify(dlg)).toBe(true)
    expect(errs, browserName).toEqual([])
  })

  test('headerPlacement y L9 por ancho propio: al lado ≥ space × 200 con el título alineado a la primera etiqueta; acciones abajo a 320', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page, { width: 1440 })
    await bench(page, { w: '1280' })
    const side = await page.evaluate(() => {
      const sec = document.getElementById('fm-sec-contacto')
      const ttl = sec.querySelector('.g-form-section__title').getBoundingClientRect()
      const lab = sec.querySelector('.g-form-section__body label').getBoundingClientRect()
      return { side: sec.classList.contains('is-header-side'), hdR: sec.querySelector('.g-form-section__header').getBoundingClientRect().right, bdL: sec.querySelector('.g-form-section__body').getBoundingClientRect().left, dTop: ttl.top - lab.top, w: sec.getBoundingClientRect().width,
        fx1: document.getElementById('fx-1').classList.contains('is-header-side'), add: Math.abs(document.querySelector('#fx-3 > .g-form-section__add').getBoundingClientRect().width - document.getElementById('fx-3').getBoundingClientRect().width) }
    })
    expect(side.side && side.hdR < side.bdL && Math.abs(side.dTop) <= 1 && side.fx1, `al lado a ${side.w}px: ${JSON.stringify(side)}`).toBe(true)
    expect(side.add, 'al lado, sin agregar: «Agregar…» a todo el ancho').toBeLessThan(1)
    for (const [w, want] of [['720', false], ['960', true], ['480', false]]) {
      await bench(page, { w })
      const r = await page.evaluate(() => ({ s: document.getElementById('fm-sec-contacto').classList.contains('is-header-side'), w: document.getElementById('fm-sec-contacto').getBoundingClientRect().width, space: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-space-1')) }))
      expect(r.s, `contenedor ${w}: ${r.w}px frente a ${r.space * 200}`).toBe(r.w >= r.space * 200)
      expect(r.s).toBe(want)
    }
    // L9 a 320: título ≥ space × 40 junto a una acción (fija y plegable); a 480 las acciones siguen al lado
    await bench(page, { w: '320' })
    // Espacio del título = ancho de __heading (el hN es un elemento flexible del ancho de su texto)
    const l9 = await page.evaluate(() => ['fm-sec-basica', 'fx-2'].map((id) => { const s = document.getElementById(id); const t = s.querySelector('.g-form-section__title'); const space = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-space-1')); return { id, below: s.classList.contains('is-actions-below'), w: s.querySelector('.g-form-section__heading').getBoundingClientRect().width, lines: Math.round(t.getBoundingClientRect().height / parseFloat(getComputedStyle(t).lineHeight)), min: space * 40, actTop: s.querySelector('.g-form-section__actions').getBoundingClientRect().top, descBottom: s.querySelector(':scope > .g-form-section__header > .g-form-section__description').getBoundingClientRect().bottom } }))
    for (const r of l9) expect(r.below && r.w >= r.min && r.lines === 1 && r.actTop >= r.descBottom - 1, JSON.stringify(r)).toBe(true)
    await bench(page, { w: '480' })
    expect(await page.evaluate(() => document.getElementById('fm-sec-basica').classList.contains('is-actions-below')), 'a 480 la acción cabe junto al título').toBe(false)
    expect(errs, browserName).toEqual([])
  })

  test('divider: gap × densidad dentro (40/35/30) y 40 fuera, línea centrada; sin línea en la primera; con plegadas y abiertas', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page, { width: 1440 })
    await bench(page, { w: '720' })
    const measure = (ids) => page.evaluate((list) => list.map((id) => {
      const sec = document.getElementById(id)
      const prev = sec.previousElementSibling.getBoundingClientRect()
      const first = sec.querySelector(':scope > .g-form-section__header, :scope > .g-form-section__add').getBoundingClientRect()
      const hr = sec.querySelector(':scope > .g-form-section__divider').getBoundingClientRect()
      return { id, dist: +(first.top - prev.bottom).toFixed(2), mid: +((hr.top + hr.bottom) / 2 - (prev.bottom + first.top) / 2).toFixed(2), w: Math.abs(hr.width - sec.getBoundingClientRect().width) }
    }), ids)
    const IN = ['fm-sec-contacto', 'fm-sec-vitales', 'fm-sec-fiscal', 'fm-sec-pref']
    for (const [density, gap] of [['default', 40], ['comfortable', 35], ['compact', 30]]) {
      await bench(page, { density })
      for (const pref of ['abierta', 'plegada']) {
        const m = await measure(IN)
        for (const r of m) expect(Math.abs(r.dist - gap) <= 1 && Math.abs(r.mid) <= 1 && r.w < 1, `${density} (${pref}): ${JSON.stringify(r)}`).toBe(true)
        await page.click('#fm-sec-pref-toggle')
        await settled(page, 'fm-sec-pref')
      }
    }
    // Fuera de GForm: 40, también tras una plegada (#fx-2 plegada antes de #fx-3) y abierta
    for (const st of ['plegada', 'abierta']) {
      const m = await measure(['fx-2', 'fx-3'])
      for (const r of m) expect(Math.abs(r.dist - 40) <= 1 && Math.abs(r.mid) <= 1, `fuera (${st}): ${JSON.stringify(r)}`).toBe(true)
      await page.click('#fx-2-toggle')
      await settled(page, 'fx-2')
    }
    const first = await page.evaluate(() => ({ fx1: getComputedStyle(document.querySelector('#fx-1 > .g-form-section__divider')).display, tag: document.querySelector('#fx-2 > .g-form-section__divider').tagName, aria: document.querySelector('#fx-2 > .g-form-section__divider').getAttribute('aria-hidden') }))
    expect(first, 'la primera sección no dibuja línea; GDivider <hr aria-hidden>').toEqual({ fx1: 'none', tag: 'HR', aria: 'true' })
    expect(errs, browserName).toEqual([])
  })

  test('320: sin desborde con todo abierto y agregado', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page, { width: 320, height: 800 })
    await page.click('#fx-2-toggle')
    await page.click('#fx-3 .g-form-section__add-button')
    await page.click('#fm-sec-fiscal .g-form-section__add-button')
    await page.waitForTimeout(600)
    const ov = await page.evaluate(() => ({ page: document.documentElement.scrollWidth - innerWidth, frames: [...document.querySelectorAll('#sec-form [data-frame]')].map((f) => f.scrollWidth - f.clientWidth).filter((d) => d > 1) }))
    expect(ov.page <= 0 && ov.frames.length === 0, JSON.stringify(ov)).toBe(true)
    expect(errs, browserName).toEqual([])
  })

  test('movimiento reducido: altura en un cuadro, solo fundido; al plegar sigue visible mientras se funde y ya es inert', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page, { reduced: true })
    await page.evaluate(() => document.getElementById('fx-2').scrollIntoView({ block: 'center' }))
    const r = await page.evaluate(async () => { document.getElementById('fx-2-toggle').click(); await Vue.nextTick(); return new Promise((res) => requestAnimationFrame(() => { const pn = document.getElementById('fx-2-panel'); res({ props: pn.getAnimations().map((a) => a.transitionProperty), h: pn.getBoundingClientRect().height }) })) })
    await settled(page, 'fx-2')
    const full = await page.evaluate(() => __st('fx-2').h)
    expect(!r.props.includes('grid-template-rows') && !r.props.includes('margin-block-start') && Math.abs(r.h - full) < 0.5, `${JSON.stringify(r)} de ${full}`).toBe(true)
    const c = await page.evaluate(async () => { document.getElementById('fx-2-toggle').click(); await Vue.nextTick(); __pause('fx-2-panel', 0.5); return __st('fx-2') })
    expect(c.vis === 'visible' && c.op > 0 && c.op < 1 && c.inert, JSON.stringify(c)).toBe(true)
    await page.evaluate(() => __finish('fx-2-panel'))
    await settled(page, 'fx-2')
    expect(await page.evaluate(() => __st('fx-2').vis)).toBe('hidden')
    expect(errs, browserName).toEqual([])
  })
  test('de «al lado» a arriba, is-actions-below no parpadea al cruzar el umbral (1280 ↔ 720, varias veces)', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page)
    await page.evaluate(() => {
      window.__flash = []
      window.__muts = 0
      new MutationObserver((ms) => {
        for (const m of ms) {
          if (!/^fx-[23]$/.test(m.target.id)) continue
          window.__muts++
          if (m.target.classList.contains('is-actions-below')) window.__flash.push(m.target.id)
        }
      }).observe(document.getElementById('fx-frame'), { subtree: true, attributes: true, attributeFilter: ['class'] })
    })
    for (const w of ['720', '', '720', '', '720', '']) await bench(page, { w })
    expect(await page.evaluate(() => window.__flash), browserName).toEqual([])
    // El umbral sí cambió is-header-side (la prueba mide algo)
    expect(await page.evaluate(() => window.__muts)).toBeGreaterThan(0)
    expect(errs, browserName).toEqual([])
  })
})
