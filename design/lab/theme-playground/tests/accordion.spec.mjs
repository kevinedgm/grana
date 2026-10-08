// GAccordion + GAccordionItem sobre el COMPONENTE REAL del playground (packages/vue/playground, #sec-accordion), en
// Chromium, Firefox y WebKit. Traslada design/lab/accordion/r01/verificar.mjs (partes base, A y el pegado y cierre de B) y el
// § «Verificación · Playwright» de design/contracts/accordion.md (#475 a #488): árbol, plegado con hidden="until-found" e
// inert solo al cerrar, flechas, Tab, lazy, OPEN_REQUEST, foco al plegar, suelto, regla de region, Δ0 en exclusive (≤ 1 px
// por cuadro) y su cancelación, #id del elemento y de dentro, #:~:text=, impresión, overflow-anchor, movimiento reducido,
// RTL, ≥ 44 px, ≥ 12 px, contrastes, foco visible, 320 px, sticky bajo una cabecera fija (pegado, cierre Δ ≤ 1 px, Mayús+Tab
// entero a la vista), --_scroll-pad en un GDialog y consola limpia. La continuidad del avance va en
// personalidad-accordion.spec.mjs. Un solo proceso por puerto: GRANA_PW_PORT=4214 (bruno de GAccordion).
// Las medidas van en el banco ligero packages/vue/playground/accordion.html (el mismo marcado y los mismos datos que
// #sec-accordion, accordion-data.js): en WebKit el playground entero da cuadros de ~300 ms y las medidas por cuadro no
// serían del componente. La sección del playground se comprueba aparte (árbol, plegado, flechas y consola limpia).
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/accordion.html'
const PLAYGROUND = '/packages/vue/playground/index.html'
const TAB = (browserName) => (browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
const BACKTAB = (browserName) => (browserName === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab')

async function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana GAccordion|\[Grana GIcon/.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}
async function open(page, { motion = 'no-preference', width = 1280, height = 900, hash = '', url = PAGE } = {}) {
  await page.emulateMedia({ reducedMotion: motion })
  await page.setViewportSize({ width, height })
  await page.goto(url + hash)
  await page.waitForSelector('#faq-cambiar.is-ready')
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(() => {
    window.__ac = () => document.getElementById('app').__vue_app__._instance.proxy.ac
    // Muestreo por cuadro del borde superior de un elemento (DESPUÉS de los rAF del cuadro, los del componente incluidos):
    // máximo |Δ| respecto del inicio
    window.__sample = (sel, ms) => {
      const el = document.querySelector(sel)
      const y0 = el.getBoundingClientRect().top
      const s = { y0, max: 0, done: false, frames: 0, last: 0 }
      const end = performance.now() + ms
      const measure = () => {
        const d = el.getBoundingClientRect().top - y0
        s.max = Math.max(s.max, Math.abs(d))
        s.last = d
        s.frames++
        if (performance.now() < end) requestAnimationFrame(() => setTimeout(measure, 0))
        else s.done = true
      }
      requestAnimationFrame(() => setTimeout(measure, 0))
      window.__s = s
    }
    window.__rgb = (c) => { const cv = document.createElement('canvas'); cv.width = cv.height = 1; const x = cv.getContext('2d'); x.fillStyle = '#000'; x.fillStyle = c; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
    window.__lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
    window.__ratio = (a, b) => { const L1 = __lum(a), L2 = __lum(b); return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05) }
    window.__bg = (el) => { for (let a = el; a; a = a.parentElement) { const c = __rgb(getComputedStyle(a).backgroundColor); if (c[3] > 0.95) return c } return [255, 255, 255] }
    window.__contrast = (el, fg) => __ratio(__rgb(fg || getComputedStyle(el).color), __bg(el))
  })
  await page.mouse.move(2, 2)
  await frames(page)
}
const frames = (page, n = 2) => page.evaluate((k) => new Promise((r) => { const f = () => (k-- > 0 ? requestAnimationFrame(f) : setTimeout(r, 20)); f() }), n)
const exp = (page, id) => page.getAttribute(`#${id}-toggle`, 'aria-expanded')
const state = (page, id) => page.evaluate((id) => ({
  exp: document.getElementById(`${id}-toggle`).getAttribute('aria-expanded'),
  inert: document.querySelector(`#${id} > .g-accordion-item__panel`).hasAttribute('inert'),
  hidden: document.getElementById(`${id}-content`).getAttribute('hidden'),
  h: document.getElementById(`${id}-content`).offsetHeight,
  cls: document.getElementById(id).className
}), id)
const active = (page) => page.evaluate(() => document.activeElement && (document.activeElement.id || document.activeElement.tagName))
const settle = (page, ms = 450) => page.waitForTimeout(ms)
const toView = (page, sel, top = 200) => page.evaluate(([s, t]) => { const r = document.querySelector(s).getBoundingClientRect(); window.scrollBy(0, r.top - t) }, [sel, top])

test.describe('GAccordion · estructura y plegado', () => {
  test('árbol: h3 > button con su nombre, expandido o no; region según la regla (≤ 6 o exclusive); avance como descripción', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page)
    await expect(page.locator('#faq-cambiar').getByRole('heading', { level: 3, name: '¿Puedo cambiar la fecha de mi cita?' })).toBeVisible()
    await expect(page.locator('#ac-faq').getByRole('button', { name: '¿Puedo cambiar la fecha de mi cita?', expanded: false })).toHaveAttribute('aria-describedby', 'faq-cambiar-peek')
    await expect(page.locator('#ac-faq').getByRole('button', { name: 'Historial de pagos Disponible tras tu primera cita' })).toHaveAttribute('aria-disabled', 'true')
    await expect(page.locator('#faq-resultados-toggle')).toHaveAttribute('aria-expanded', 'true')
    // 8 elementos que pueden abrirse a la vez: sin region; 2 (ajustes): region; exclusive: region
    const rg = await page.evaluate(() => ({
      faq: document.querySelector('#faq-resultados-content').getAttribute('role'),
      set: document.querySelector('#set-notif-content').getAttribute('role'),
      lab: document.querySelector('#set-notif-content').getAttribute('aria-labelledby'),
      ex: document.querySelector('#ex-resultados-content').getAttribute('role')
    }))
    expect(rg).toEqual({ faq: null, set: 'region', lab: 'set-notif-toggle', ex: 'region' })
    await expect(page.locator('#ac-excl').getByRole('region', { name: '¿Cuánto tardan los resultados?' })).toBeVisible()
    const snap = await page.locator('#ac-settings').ariaSnapshot()
    expect(snap).toMatch(/heading "Notificaciones 3 activas" \[level=3\]/)
    expect(snap).toMatch(/button "Notificaciones 3 activas"/)
    expect(snap).toMatch(/region "Notificaciones 3 activas"/)
    expect(snap).toMatch(/button "Restablecer"/)
    // Lo plegado y asentado no tiene alto ni está en el árbol (hidden="until-found"). WebKit de Playwright sí lo incluye en
    // su instantánea (content-visibility: hidden); sin un lector real no se sabe si VoiceOver lo expone (README, límite)
    if (browserName !== 'webkit') expect(snap).not.toMatch(/switch|checkbox/)
    expect(await state(page, 'faq-cambiar')).toMatchObject({ hidden: 'until-found', h: 0, inert: false })
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('abrir y cerrar: modelo en orden del documento; inert solo mientras se cierra; asienta con hidden="until-found"', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    await toView(page, '#faq-cambiar')
    await page.click('#faq-cambiar-toggle')
    expect(await exp(page, 'faq-cambiar')).toBe('true')
    await expect(page.locator('#ac-faq-log')).toHaveText('v-model: ["cambiar","resultados"]')
    expect((await state(page, 'faq-cambiar')).hidden).toBeNull()
    await settle(page)
    // Lo que pasa mientras se cierra, cuadro a cuadro (sin depender de la velocidad de la máquina)
    await page.evaluate(() => {
      const it = document.getElementById('faq-cambiar')
      const panel = it.querySelector('.g-accordion-item__panel')
      const content = document.getElementById('faq-cambiar-content')
      window.__seen = []
      const rec = () => window.__seen.push({ animating: it.classList.contains('is-animating'), open: it.classList.contains('is-open'), inert: panel.hasAttribute('inert'), hidden: content.getAttribute('hidden') })
      new MutationObserver(rec).observe(it, { attributes: true, subtree: true, attributeFilter: ['class', 'inert', 'hidden'] })
    })
    await page.click('#faq-cambiar-toggle')
    await page.waitForFunction(() => document.getElementById('faq-cambiar-content').getAttribute('hidden') === 'until-found')
    const seen = await page.evaluate(() => window.__seen)
    const closing = seen.filter((x) => !x.open && x.animating)
    expect(closing.length, JSON.stringify(seen)).toBeGreaterThan(0)
    expect(closing.every((x) => x.inert && x.hidden === null), 'cerrando: inert y sin hidden').toBe(true)
    expect(seen.filter((x) => x.hidden === 'until-found').every((x) => !x.inert && !x.animating), 'asentado: sin inert').toBe(true)
    const end = await state(page, 'faq-cambiar')
    expect(end, 'asentado').toMatchObject({ inert: false, hidden: 'until-found', h: 0 })
    expect(end.cls).not.toContain('is-animating')
    // Abrir no mete el foco en el panel (WebKit no enfoca un botón al hacer clic: body)
    expect(await page.evaluate(() => !document.activeElement.closest('.g-accordion-item__content'))).toBe(true)
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('flechas sin vuelta (alcanzan al deshabilitado), Inicio y Fin; el deshabilitado no abre', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    await page.focus('#faq-cambiar-toggle')
    const seq = []
    for (const k of ['ArrowDown', 'End', 'ArrowDown', 'Home', 'ArrowUp']) { await page.keyboard.press(k); seq.push(await active(page)) }
    expect(seq).toEqual(['faq-documentos-toggle', 'faq-urgencias-toggle', 'faq-urgencias-toggle', 'faq-cambiar-toggle', 'faq-cambiar-toggle'])
    await page.focus('#faq-resultados-toggle')
    await page.keyboard.press('ArrowDown')
    expect(await active(page)).toBe('faq-historial-toggle')
    await page.keyboard.press('Enter')
    await page.keyboard.press('Space')
    await page.click('#faq-historial-toggle', { force: true })
    await page.click('#faq-historial-peek', { force: true })
    expect(await exp(page, 'faq-historial')).toBe('false')
    await expect(page.locator('#ac-faq-log')).toHaveText('v-model: ["resultados"]')
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('Tab: encabezado → acciones → siguiente encabezado (lo plegado no es parada); abierto, entra en el contenido', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page)
    await page.focus('#set-notif-toggle')
    const stops = []
    for (let k = 0; k < 2; k++) { await page.keyboard.press(TAB(browserName)); stops.push(await active(page)) }
    expect(stops).toEqual(['set-notif-reset', 'set-privacy-toggle'])
    await page.click('#set-notif-toggle')
    await settle(page)
    await page.focus('#set-notif-reset')
    await page.keyboard.press(TAB(browserName))
    expect(await page.evaluate(() => !!document.activeElement.closest('#set-notif-content'))).toBe(true)
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('lazy: sin montar antes de abrir; un montaje tras abrir-cerrar-abrir', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    expect(await page.evaluate(() => window.__acLazyMounts || 0)).toBe(0)
    expect(await page.locator('#ac-lazy-text').count()).toBe(0)
    for (let k = 0; k < 3; k++) { await page.click('#ac-lazy-toggle'); await settle(page) }
    expect(await page.evaluate(() => window.__acLazyMounts)).toBe(1)
    await expect(page.locator('#ac-lazy-log')).toHaveText('montajes del contenido lazy: 1')
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('OPEN_REQUEST abre sin animar y el control recibe el foco; plegar con el foco dentro lo lleva al botón', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    const r = await page.evaluate(async () => {
      const input = document.querySelector('#set-notif-content input')
      const ev = new CustomEvent('g-open-request', { bubbles: true, cancelable: true })
      input.dispatchEvent(ev)
      const cls = document.getElementById('set-notif').className
      await new Promise((res) => setTimeout(res, 0))
      input.focus({ preventScroll: true })
      return { prevented: ev.defaultPrevented, cls, exp: document.getElementById('set-notif-toggle').getAttribute('aria-expanded'), active: document.activeElement === input }
    })
    expect(r.prevented).toBe(true)
    expect(r.exp).toBe('true')
    expect(r.active).toBe(true)
    // Plegar por programa con el foco dentro → foco al botón (nunca a body)
    await page.evaluate(() => document.getElementById('set-notif-toggle').click())
    await frames(page)
    expect(await active(page)).toBe('set-notif-toggle')
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('suelto con v-model:open', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    await toView(page, '#ac-solo')
    await page.click('#ac-solo-toggle')
    await expect(page.locator('#ac-solo-log')).toHaveText('v-model:open: true')
    expect(await page.getAttribute('#ac-solo', 'class')).toContain('is-standalone')
    expect(await page.getAttribute('#ac-solo-content', 'role')).toBe('region')
    expect(errs, errs.join('\n')).toEqual([])
  })
})

test.describe('GAccordion · Δ0 (#481)', () => {
  test('exclusive: el encabezado tocado no se mueve (≤ 1 px por cuadro); sin el usuario (modelo) sí se mueve; desplazar cancela', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    const run = async (how) => {
      // «Resultados» (largo) abierto encima de «Pago»
      if ((await exp(page, 'ex-resultados')) !== 'true') { await page.evaluate(() => { window.__ac().excl = ['resultados'] }); await settle(page, 600) }
      await toView(page, '#ex-pago-toggle', 520)
      await frames(page)
      await page.evaluate(() => __sample('#ex-pago-toggle', 700))
      if (how === 'user') await page.click('#ex-pago-toggle', { noWaitAfter: true })
      else if (how === 'model') await page.evaluate(() => { window.__ac().excl = ['pago'] })
      // La rueda del usuario durante el movimiento (en el mismo cuadro que el clic): la compensación se detiene
      else await page.evaluate(() => { document.getElementById('ex-pago-toggle').click(); window.dispatchEvent(new WheelEvent('wheel', { deltaY: 0 })) })
      await page.waitForFunction(() => window.__s.done)
      const s = await page.evaluate(() => ({ max: Math.round(window.__s.max * 10) / 10, last: Math.round(window.__s.last * 10) / 10, frames: window.__s.frames }))
      expect(await exp(page, 'ex-pago'), how).toBe('true')
      expect(await exp(page, 'ex-resultados'), how).toBe('false')
      return s
    }
    const user = await run('user')
    expect(user.max, `usuario: máx ${user.max}px en ${user.frames} cuadros`).toBeLessThanOrEqual(1)
    await expect(page.locator('#ac-excl-log')).toHaveText('v-model: ["pago"]')
    const model = await run('model')
    expect(model.max, `modelo: sin compensar, ${model.max}px`).toBeGreaterThan(40)
    const wheel = await run('wheel')
    expect(Math.abs(wheel.last), `rueda: cancela la compensación (${wheel.last}px)`).toBeGreaterThan(40)
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('overflow-anchor: none en el grupo y en el suelto (el navegador no compensa dos veces)', async ({ page }) => {
    await open(page)
    const oa = await page.evaluate(() => [getComputedStyle(document.getElementById('ac-excl')).overflowAnchor, getComputedStyle(document.getElementById('ac-solo')).overflowAnchor])
    expect(oa).toEqual(['none', 'none'])
  })
})

test.describe('GAccordion · lo plegado se encuentra, se enlaza y se imprime (#480, #482)', () => {
  test('#id del elemento al cargar: abre y lo trae arriba sin mover el foco; hashchange abre otro', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page, { hash: '#faq-pago' })
    await frames(page, 4)
    const hh = await page.evaluate(() => ({ exp: document.getElementById('faq-pago-toggle').getAttribute('aria-expanded'), top: Math.round(document.getElementById('faq-pago-toggle').getBoundingClientRect().top), active: document.activeElement.tagName }))
    // html { scroll-padding-top: 76px } del playground: el encabezado queda bajo la barra del playground
    expect(hh.exp).toBe('true')
    expect(hh.top).toBeGreaterThanOrEqual(60)
    expect(hh.top).toBeLessThanOrEqual(90)
    expect(hh.active).toBe('BODY')
    await page.evaluate(() => { location.hash = 'faq-urgencias' })
    await frames(page, 4)
    expect(await exp(page, 'faq-urgencias')).toBe('true')
    // Lee el fragmento; nunca lo escribe
    await page.click('#faq-cambiar-toggle')
    expect(await page.evaluate(() => location.hash)).toBe('#faq-urgencias')
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('#id de algo de dentro: lo revela el navegador (beforematch) y el elemento se abre', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    await page.evaluate(() => { location.hash = 'ac-dato-entrada' })
    await frames(page, 6)
    const s = await state(page, 'faq-estacionamiento')
    expect(s.exp).toBe('true')
    expect(s.hidden).toBeNull()
    await expect(page.locator('#ac-faq-log')).toHaveText('v-model: ["resultados","estacionamiento"]')
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('#:~:text= abre el elemento que contiene el texto (la búsqueda de la página)', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page, { hash: '#:~:text=subterr%C3%A1neo' })
    await page.waitForFunction(() => document.getElementById('faq-estacionamiento-toggle').getAttribute('aria-expanded') === 'true', null, { timeout: 5000 })
    expect((await state(page, 'faq-estacionamiento')).hidden).toBeNull()
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('impresión: todo el contenido con alto (salvo lazy sin abrir), sin chevron, avance ni acciones', async ({ page }) => {
    await open(page)
    await page.emulateMedia({ media: 'print' })
    await page.waitForTimeout(300)
    const pr = await page.evaluate(() => {
      const cs = [...document.querySelectorAll('#sec-accordion .g-accordion-item__content')].filter((c) => !c.closest('.g-dialog') && c.id !== 'ac-lazy-content')
      return {
        zero: cs.filter((c) => c.offsetHeight === 0).map((c) => c.id),
        n: cs.length,
        chev: getComputedStyle(document.querySelector('#faq-cambiar .g-accordion-item__chevron')).display,
        peek: getComputedStyle(document.getElementById('faq-cambiar-peek')).display,
        actions: getComputedStyle(document.querySelector('#set-notif .g-accordion-item__actions')).display,
        model: document.getElementById('faq-cambiar-toggle').getAttribute('aria-expanded')
      }
    })
    await page.emulateMedia({ media: 'screen' })
    expect(pr.n).toBeGreaterThan(15)
    expect(pr.zero).toEqual([])
    expect(pr).toMatchObject({ chev: 'none', peek: 'none', actions: 'none', model: 'false' })
  })
})

test.describe('GAccordion · movimiento, RTL y mínimos', () => {
  test('movimiento reducido: sin transición de la rejilla; abre, cierra y asienta plegado', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page, { motion: 'reduce' })
    await toView(page, '#faq-cambiar')
    await page.click('#faq-cambiar-toggle')
    const tp = await page.evaluate(() => getComputedStyle(document.querySelector('#faq-cambiar > .g-accordion-item__panel')).transitionProperty)
    expect(tp).not.toMatch(/grid-template-rows/)
    await settle(page, 300)
    await page.click('#faq-cambiar-toggle')
    await settle(page, 400)
    expect(await state(page, 'faq-cambiar')).toMatchObject({ exp: 'false', hidden: 'until-found', inert: false })
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('RTL: chevron espejado y al final lógico (izquierda); título, meta y avance con dir="auto"', async ({ page }) => {
    await open(page)
    const rt = await page.evaluate(() => {
      const it = document.getElementById('ac-rtl-1')
      const ch = it.querySelector('.g-accordion-item__chevron').getBoundingClientRect()
      const t = it.querySelector('.g-accordion-item__title').getBoundingClientRect()
      return { scale: getComputedStyle(it.querySelector('.g-accordion-item__chevron > .g-icon')).scale, chevLeft: ch.right <= t.left + 1, dir: it.querySelector('.g-accordion-item__title').getAttribute('dir') }
    })
    expect(rt.scale).toMatch(/^-1/)
    expect(rt.chevLeft).toBe(true)
    expect(rt.dir).toBe('auto')
  })

  test('≥ 44 px de alto, texto ≥ 12 px, contrastes (título y meta ≥ 4,5; chevron ≥ 3) y foco visible con teclado', async ({ page }) => {
    await open(page)
    const g = await page.evaluate(() => {
      const ts = [...document.querySelectorAll('#sec-accordion .g-accordion-item__toggle')].filter((t) => t.offsetParent)
      const t = document.querySelector('#faq-cambiar .g-accordion-item__title')
      const m = document.querySelector('#faq-historial .g-accordion-item__meta')
      const pk = document.getElementById('faq-cambiar-peek')
      const ch = document.querySelector('#faq-cambiar .g-accordion-item__chevron')
      return {
        minH: Math.min(...ts.map((x) => x.getBoundingClientRect().height)),
        fs: Math.min(...[t, m, pk].map((x) => parseFloat(getComputedStyle(x).fontSize))),
        ct: __contrast(t), cm: __contrast(m), cp: __contrast(pk), cc: __contrast(ch),
        cd: __contrast(document.querySelector('#faq-historial .g-accordion-item__title'))
      }
    })
    expect(g.minH).toBeGreaterThanOrEqual(44)
    expect(g.fs).toBeGreaterThanOrEqual(12)
    expect(g.ct).toBeGreaterThanOrEqual(4.5)
    expect(g.cm).toBeGreaterThanOrEqual(4.5)
    expect(g.cp).toBeGreaterThanOrEqual(4.5)
    expect(g.cc).toBeGreaterThanOrEqual(3)
    expect(g.cd).toBeGreaterThanOrEqual(4.5)
    await page.focus('#faq-documentos-toggle')
    await page.keyboard.press('ArrowUp')
    const fo = await page.evaluate(() => { const cs = getComputedStyle(document.activeElement); return { id: document.activeElement.id, s: cs.outlineStyle, w: parseFloat(cs.outlineWidth) } })
    expect(fo.id).toBe('faq-cambiar-toggle')
    expect(fo.s).not.toBe('none')
    expect(fo.w).toBeGreaterThanOrEqual(2)
  })

  test('320 px: sin desplazamiento horizontal en las secciones del acordeón, abiertas y cerradas', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page, { width: 320, height: 800 })
    await page.evaluate(() => { const ac = window.__ac(); ac.faq = ['cambiar', 'historial', 'largo', 'resultados']; ac.excl = ['pago'] })
    await page.click('#set-notif-toggle')
    await settle(page, 500)
    const o = await page.evaluate(() => {
      const groups = [...document.querySelectorAll('#sec-accordion .g-accordion, #ac-solo')]
      const vw = document.documentElement.clientWidth
      return {
        over: groups.filter((g) => g.scrollWidth > g.clientWidth + 1).map((g) => g.id),
        outside: [...document.querySelectorAll('#sec-accordion .g-accordion-item__toggle, #sec-accordion .g-accordion-item__actions')].filter((e) => e.getBoundingClientRect().right > vw + 1).map((e) => e.id || e.className),
        panels: [...document.querySelectorAll('#sec-accordion .pg-panel')].filter((p) => p.scrollWidth > p.clientWidth + 1).length
      }
    })
    expect(o).toEqual({ over: [], outside: [], panels: 0 })
    expect(errs, errs.join('\n')).toEqual([])
  })
})

test.describe('GAccordion · sticky (#484)', () => {
  const scrollerTo = (page, y) => page.evaluate((y) => { document.getElementById('ac-sticky-scroller').scrollTop = y }, y)
  async function stickPrep(page) {
    await page.evaluate(() => document.getElementById('ac-sticky-scroller').scrollIntoView({ block: 'start' }))
    if ((await exp(page, 'st-prep')) !== 'true') { await page.click('#st-prep-toggle'); await settle(page, 500) }
    // El principio de «Preparación» muy por encima: su encabezado está pegado bajo la cabecera de 48px
    await page.evaluate(() => { const sc = document.getElementById('ac-sticky-scroller'); const it = document.getElementById('st-prep'); sc.scrollTop += it.getBoundingClientRect().top - sc.getBoundingClientRect().top + 500 })
    await frames(page, 3)
  }
  const geo = (page) => page.evaluate(() => {
    const sc = document.getElementById('ac-sticky-scroller').getBoundingClientRect()
    const h = document.querySelector('#st-prep > .g-accordion-item__heading').getBoundingClientRect()
    const it = document.getElementById('st-prep').getBoundingClientRect()
    return { head: Math.round((h.top - sc.top) * 10) / 10, headBottom: h.bottom, item: Math.round(it.top - sc.top), scBottom: sc.bottom, headSize: getComputedStyle(document.getElementById('st-prep')).getPropertyValue('--_head-size').trim() }
  })

  test('el encabezado del abierto se pega bajo la cabecera fija (--g-accordion-sticky-top) con --_head-size medido', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    await stickPrep(page)
    const g = await geo(page)
    expect(g.item).toBeLessThan(-300)
    expect(Math.abs(g.head - 48), `encabezado a ${g.head}px del borde (cabecera de 48px)`).toBeLessThanOrEqual(1)
    expect(g.headSize).toMatch(/^\d+(\.\d+)?px$/)
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('#st-prep > .g-accordion-item__heading')).position)).toBe('sticky')
    // Cerrado no se pega (y sin --_head-size en línea)
    expect(await page.evaluate(() => document.getElementById('st-intro').style.getPropertyValue('--_head-size'))).toBe('')
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('cerrar desde el encabezado pegado: instantáneo, Δ ≤ 1 px y lo siguiente aparece debajo', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    await stickPrep(page)
    // Lo que pasa por la raíz durante el cierre: is-instant sí, is-animating nunca
    await page.evaluate(() => {
      const el = document.getElementById('st-prep')
      window.__seen = { instant: false, animating: false }
      new MutationObserver(() => {
        if (el.classList.contains('is-instant')) window.__seen.instant = true
        if (el.classList.contains('is-animating')) window.__seen.animating = true
      }).observe(el, { attributes: true, attributeFilter: ['class'] })
      __sample('#st-prep > .g-accordion-item__heading', 400)
    })
    await page.click('#st-prep-toggle', { noWaitAfter: true })
    await page.waitForFunction(() => window.__s.done)
    const inst = await page.evaluate(() => window.__seen)
    const r = await page.evaluate(() => {
      const h = document.querySelector('#st-prep > .g-accordion-item__heading').getBoundingClientRect()
      const next = document.getElementById('st-lugar').getBoundingClientRect()
      return { max: Math.round(window.__s.max * 10) / 10, gap: Math.round(next.top - h.bottom) }
    })
    expect(await exp(page, 'st-prep')).toBe('false')
    expect(inst).toEqual({ instant: true, animating: false })
    expect(r.max, `máx ${r.max}px`).toBeLessThanOrEqual(1)
    expect(r.gap).toBeGreaterThanOrEqual(-1)
    expect(r.gap).toBeLessThan(80)
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('Mayús+Tab hacia arriba dentro de un abierto: cada control queda entero a la vista, bajo el encabezado pegado (2.4.11)', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page)
    await stickPrep(page)
    // Desde el último botón del contenido, hacia arriba
    await page.evaluate(() => { const sc = document.getElementById('ac-sticky-scroller'); const b = document.getElementById('st-btn-3'); sc.scrollTop += b.getBoundingClientRect().bottom - sc.getBoundingClientRect().bottom + 20 })
    await page.focus('#st-btn-3')
    const seen = []
    for (let k = 0; k < 3; k++) {
      await page.keyboard.press(BACKTAB(browserName))
      await frames(page, 2)
      const g = await page.evaluate(() => {
        const a = document.activeElement.getBoundingClientRect()
        const h = document.querySelector('#st-prep > .g-accordion-item__heading').getBoundingClientRect()
        const sc = document.getElementById('ac-sticky-scroller').getBoundingClientRect()
        return { id: document.activeElement.id, top: Math.round(a.top - h.bottom), bottom: Math.round(sc.bottom - a.bottom) }
      })
      seen.push(g)
    }
    expect(seen.map((g) => g.id)).toEqual(['st-btn-2', 'st-btn-1', 'st-btn-0'])
    for (const g of seen) {
      expect(g.top, `${g.id} bajo el encabezado pegado`).toBeGreaterThanOrEqual(-1)
      expect(g.bottom, `${g.id} dentro del contenedor`).toBeGreaterThanOrEqual(-1)
    }
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('dentro de un GDialog: --_scroll-pad = relleno de inicio del cuerpo y el encabezado se pega a su borde', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    await page.evaluate(() => document.getElementById('ac-dlg-open').scrollIntoView({ block: 'center' }))
    await page.click('#ac-dlg-open')
    await page.waitForSelector('#ac-dlg-prep.is-ready')
    await frames(page, 3)
    const r = await page.evaluate(async () => {
      const body = document.querySelector('#ac-dlg').closest('.g-dialog__body')
      const pad = parseFloat(getComputedStyle(body).paddingBlockStart)
      body.scrollTop = 400
      await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)))
      const h = document.querySelector('#ac-dlg-prep > .g-accordion-item__heading').getBoundingClientRect()
      return { pad, style: document.getElementById('ac-dlg').style.getPropertyValue('--_scroll-pad'), gap: Math.round((h.top - body.getBoundingClientRect().top) * 10) / 10, scrolled: body.scrollTop }
    })
    expect(r.pad).toBeGreaterThan(0)
    expect(r.style).toBe(`${r.pad}px`)
    expect(r.scrolled).toBeGreaterThan(100)
    expect(Math.abs(r.gap), `encabezado a ${r.gap}px del borde del cuerpo`).toBeLessThanOrEqual(1)
    expect(errs, errs.join('\n')).toEqual([])
  })
})

test.describe('GAccordion · en el playground (#sec-accordion)', () => {
  test('árbol, abrir y asentar, flechas, avance que sigue al estado y consola limpia dentro de la página entera', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page, { url: PLAYGROUND })
    await page.evaluate(() => document.getElementById('sec-accordion').scrollIntoView({ block: 'start' }))
    await expect(page.locator('#faq-resultados-toggle')).toHaveAttribute('aria-expanded', 'true')
    expect(await page.getAttribute('#faq-cambiar-content', 'hidden')).toBe('until-found')
    expect(await page.getAttribute('#set-notif-content', 'role')).toBe('region')
    expect(await page.getAttribute('#faq-cambiar-content', 'role')).toBeNull()
    await page.click('#faq-cambiar-toggle')
    await expect(page.locator('#ac-faq-log')).toHaveText('v-model: ["cambiar","resultados"]')
    await page.click('#faq-cambiar-toggle')
    await page.waitForFunction(() => document.getElementById('faq-cambiar-content').getAttribute('hidden') === 'until-found' && !document.querySelector('#faq-cambiar > .g-accordion-item__panel').hasAttribute('inert'))
    await page.focus('#faq-cambiar-toggle')
    await page.keyboard.press('End')
    expect(await active(page)).toBe('faq-urgencias-toggle')
    await page.click('#set-notif-toggle')
    await page.waitForFunction(() => !document.getElementById('set-notif').classList.contains('is-animating'))
    const before = await page.textContent('#set-notif-peek')
    await page.click('#set-notif-content .g-switch input', { force: true })
    await expect(page.locator('#set-notif-peek')).not.toHaveText(before)
    expect(errs, errs.join('\n')).toEqual([])
  })
})
