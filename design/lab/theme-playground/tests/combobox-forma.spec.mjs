// GCombobox · la forma (A + B + C, DECISIONS.md #329) sobre el COMPONENTE REAL del playground, en Chromium, Firefox y
// WebKit. Port de lo propio de design/lab/combobox/r02/verificar.mjs (kiwi; A 114, B 112, A+C 126 por motor) y del
// contrato (combobox.md «Verificación · combobox-forma.spec»):
//   A · el campo se abre: una sola forma (Δ < 1px, costura < 1.5px, también hacia arriba), el campo usable bajo la forma,
//       Δ0 de campo, página y alto, texto fantasma y su contraste, → acepta sin elegir, Tab con homónimas y con etiqueta única.
//   B · paleta: primera tecla, vista previa que cambia con ↓, :modal, Tab no sale, Esc y fondo, sobre GDialog, activa invertida.
//   C · el valor es un objeto: ficha (avatar, código, texto libre), Δ0 de alto, edición sobre la ficha y Esc × 2, fichas con
//       rótulo en la lista, descripción accesible.
//   La fila se parte antes de 240px (--g-form-min: 60) y respeta el valor del consumidor (#336).
import { test, expect } from '@playwright/test'
import { contrast, frames, geo, open, out, st, type, watchConsole } from './combobox-helpers.mjs'

const shape = (page, id) => page.evaluate((id) => {
  const c = document.getElementById(id).closest('.g-input__control').getBoundingClientRect()
  const pop = document.getElementById(id + '-popup')
  const p = pop.getBoundingClientRect()
  const b = pop.querySelector('.g-combobox__popup-body').getBoundingClientRect()
  const root = document.getElementById(id).closest('.g-combobox')
  const up = root.classList.contains('is-up')
  const i = document.getElementById(id).getBoundingClientRect()
  const hit = document.elementFromPoint(i.left + i.width / 2, i.top + i.height / 2)
  return {
    up, dl: Math.abs(c.left - p.left), dw: Math.abs(c.width - p.width), dt: Math.abs(c.top - p.top), db: Math.abs(c.bottom - p.bottom),
    // Costura: dónde empieza la parte con fondo respecto al borde de la caja que toca la lista
    seam: up ? Math.abs(b.bottom - c.top) : Math.abs(b.top - c.bottom),
    bodyH: b.height, hitField: hit === document.getElementById(id), pe: getComputedStyle(pop).pointerEvents,
    boxBorder: getComputedStyle(document.getElementById(id).closest('.g-input__control')).borderTopColor
  }
}, id)

test.describe('GCombobox · A · el campo se abre', () => {
  test('una sola forma: el contorno abierto abraza campo y lista (Δ < 1px, costura < 1.5px); el campo se usa a través de ella; Δ0', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    await page.focus('#cb-pac')
    const g0 = await geo(page, 'cb-pac')
    await page.keyboard.type('mar', { delay: 15 })
    await page.waitForTimeout(300)
    const a = await shape(page, 'cb-pac')
    expect(a.up).toBe(false)
    expect(a.dl, `Δ izquierda ${a.dl}`).toBeLessThan(1)
    expect(a.dt, `Δ arriba ${a.dt}`).toBeLessThan(1)
    expect(a.dw, `Δ ancho ${a.dw}`).toBeLessThan(1)
    expect(a.seam, `costura ${a.seam}`).toBeLessThan(1.5)
    expect(a.bodyH).toBeGreaterThan(40)
    expect(a.hitField, 'el punto central del campo devuelve el <input>').toBe(true)
    expect(a.pe).toBe('none')
    const g1 = await geo(page, 'cb-pac')
    expect(Math.abs(g1.top - g0.top) + Math.abs(g1.left - g0.left) + Math.abs(g1.h - g0.h)).toBeLessThan(0.5)
    expect([g1.sy, g1.sh]).toEqual([g0.sy, g0.sh])
    // El campo sigue siendo el de siempre: se puede seguir escribiendo y colocar el cursor con el puntero
    const box = await page.locator('#cb-pac').boundingBox()
    await page.mouse.click(box.x + 8, box.y + box.height / 2)
    const s = await st(page, 'cb-pac')
    expect(s.focus).toBe('cb-pac')
    expect(s.expanded).toBe('true')
    // Sin panel (ni filas ni estado) no hay forma: is-empty y la caja conserva su contorno
    await page.keyboard.press('Escape')
    await page.keyboard.press('Escape')
    const none = await page.evaluate(() => { const p = document.getElementById('cb-pac-popup'); return [p.matches(':popover-open'), document.getElementById('cb-pac').closest('.g-combobox').classList.contains('is-open')] })
    expect(none).toEqual([false, false])
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('sin sitio debajo abre hacia arriba (is-up) y la forma termina en el borde inferior del campo', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page, { height: 640 })
    // El campo, pegado al borde inferior del visor
    await page.evaluate(() => { const r = document.getElementById('cb-dx').closest('.g-input__control').getBoundingClientRect(); scrollBy(0, r.bottom - innerHeight + 40) })
    await frames(page)
    const g0 = await geo(page, 'cb-dx')
    await type(page, 'cb-dx', 'a')
    const a = await shape(page, 'cb-dx')
    expect(a.up).toBe(true)
    expect(a.dl).toBeLessThan(1)
    expect(a.dw).toBeLessThan(1)
    expect(a.db, `Δ abajo ${a.db}`).toBeLessThan(1)
    expect(a.seam, `costura ${a.seam}`).toBeLessThan(1.5)
    expect(a.hitField).toBe(true)
    const g1 = await geo(page, 'cb-dx')
    expect(Math.abs(g1.top - g0.top)).toBeLessThan(0.5)
    expect([g1.sy, g1.sh]).toEqual([g0.sy, g0.sh])
    const inside = await page.evaluate(() => { const b = document.querySelector('#cb-dx-popup .g-combobox__popup-body').getBoundingClientRect(); return b.top >= 0 })
    expect(inside, 'la lista cabe en el visor').toBe(true)
    // Se recoloca al desplazarse un ancestro: la forma sigue a la caja
    await page.evaluate(() => scrollBy(0, -30))
    await frames(page, 3)
    const b = await shape(page, 'cb-dx')
    expect(b.dl + b.dw).toBeLessThan(1)
    expect(b.up ? b.db : b.dt).toBeLessThan(1)
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('reporte del usuario · al desplazar la página de 4 en 4px la forma no alterna de lado ni «respira»; el puntero quieto no desplaza la lista', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page, { height: 329 })
    // La caja, cerca del cruce: tanto sitio arriba como abajo
    await page.evaluate(() => { const r = document.getElementById('cb-pac').closest('.g-input__control').getBoundingClientRect(); scrollBy(0, r.top - 150) })
    await frames(page)
    await type(page, 'cb-pac', 'mar', { wait: 400 })
    const read = () => page.evaluate(() => {
      const root = document.getElementById('cb-pac').closest('.g-combobox'); const pop = document.getElementById('cb-pac-popup')
      const c = root.querySelector('.g-input__control').getBoundingClientRect(); const p = pop.getBoundingClientRect()
      return { open: pop.matches(':popover-open'), up: root.classList.contains('is-up'), max: pop.style.getPropertyValue('--_max'), h: Math.round(pop.querySelector('.g-combobox__panel').getBoundingClientRect().height * 2) / 2, stuck: Math.abs(c.left - p.left) < 1 && (root.classList.contains('is-up') ? Math.abs(c.bottom - p.bottom) : Math.abs(c.top - p.top)) < 1, hasVars: ['--_x', '--_w', '--_max', '--_field-h'].every((n) => pop.style.getPropertyValue(n)) }
    })
    const first = await read()
    expect(first.open).toBe(true)
    const trace = [first]
    // Vaivén por la franja del cruce (la histéresis mide space × 12 = 48px): 5 pasos de 4px en cada sentido, dos veces
    for (const d of [...Array(5).fill(4), ...Array(10).fill(-4), ...Array(10).fill(4), ...Array(5).fill(-4)]) {
      await page.evaluate((d) => new Promise((r) => { scrollBy(0, d); requestAnimationFrame(() => requestAnimationFrame(r)) }), d)
      trace.push(await read())
    }
    expect(trace.every((t) => t.open && t.hasVars), 'sigue abierta y ningún cuadro pierde sus variables').toBe(true)
    expect(trace.every((t) => t.stuck), 'la forma sigue a la caja en cada cuadro').toBe(true)
    let flips = 0
    for (let i = 1; i < trace.length; i++) {
      if (trace[i].up !== trace[i - 1].up) flips++
      else {
        expect(trace[i].max, `--_max constante (paso ${i})`).toBe(trace[i - 1].max)
        expect(trace[i].h, `alto del panel constante (paso ${i})`).toBe(trace[i - 1].h)
      }
    }
    expect(flips, 'como máximo un cambio de lado en todo el recorrido').toBeLessThanOrEqual(1)
    // Puntero quieto en el borde inferior del panel, sobre una opción que asoma: scrollTop no cambia en 16 cuadros
    await page.evaluate(() => scrollTo(0, 0))
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.keyboard.press('Escape')
    await page.keyboard.press('Escape')
    await page.locator('#cb-pac').scrollIntoViewIfNeeded()
    await type(page, 'cb-pac', 'mar', { wait: 400 })
    const edge = await page.evaluate(() => { const p = document.querySelector('#cb-pac-popup .g-combobox__panel'); const r = p.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.bottom - 6 } })
    await page.mouse.move(edge.x - 3, edge.y - 2)
    await page.mouse.move(edge.x, edge.y)
    const tops = await page.evaluate(() => new Promise((resolve) => {
      const p = document.querySelector('#cb-pac-popup .g-combobox__panel'); const out = []
      const tick = () => { out.push(p.scrollTop); out.length < 16 ? requestAnimationFrame(tick) : resolve(out) }
      requestAnimationFrame(tick)
    }))
    expect([...new Set(tops)], 'scrollTop del panel con el puntero quieto').toEqual([0])
    const s = await st(page, 'cb-pac')
    expect(s.active, 'el puntero sí activa la fila bajo él').not.toBe(s.first)
    // El teclado sí lleva la activa a la vista
    await page.keyboard.press('PageDown')
    await frames(page)
    expect(await page.evaluate(() => document.querySelector('#cb-pac-popup .g-combobox__panel').scrollTop)).toBeGreaterThan(0)
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('la caja sale del visor con la lista abierta: se cierra', async ({ page }) => {
    await open(page)
    await type(page, 'cb-dx', 'a')
    expect((await st(page, 'cb-dx')).popOpen).toBe(true)
    await page.evaluate(() => scrollBy(0, innerHeight * 2))
    await frames(page, 3)
    const s = await st(page, 'cb-dx')
    expect([s.popOpen, s.expanded, s.focus]).toEqual([false, 'false', 'cb-dx'])
  })

  test('texto fantasma: resto de la primera coincidencia por prefijo, aria-hidden, contraste ≥ 4.5; → acepta sin elegir', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    await type(page, 'cb-pac', 'mar', { wait: 350 })
    const gh = await page.evaluate(() => {
      const g = document.querySelector('#cb-pac').closest('.g-combobox').querySelector('.g-combobox__ghost')
      if (!g) return null
      const i = document.getElementById('cb-pac'); const rest = g.querySelector('.g-combobox__ghost-rest')
      const cell = g.parentElement.getBoundingClientRect(); const gr = g.getBoundingClientRect()
      return { hidden: g.getAttribute('aria-hidden'), typed: g.querySelector('.g-combobox__ghost-typed').textContent, rest: rest.textContent, pe: getComputedStyle(g).pointerEvents, font: getComputedStyle(rest).fontSize === getComputedStyle(i).fontSize, over: Math.abs(cell.left - gr.left) < 1 && Math.abs(cell.top - gr.top) < 1 }
    })
    expect(gh).toEqual({ hidden: 'true', typed: 'mar', rest: 'ía García López', pe: 'none', font: true, over: true })
    const cg = await contrast(page, '#sec-combobox .g-combobox__ghost-rest')
    expect(cg, `contraste del fantasma ${cg?.toFixed(2)}`).toBeGreaterThanOrEqual(4.5)
    const before = await out(page, 'cb-out-pac')
    await page.keyboard.press('ArrowRight')
    await frames(page)
    let s = await st(page, 'cb-pac')
    expect(s.value).toBe('María García López')
    expect(s.expanded).toBe('true')
    expect(await out(page, 'cb-out-pac'), '→ no elige').toBe(before)
    expect(await page.locator('#sec-combobox .g-combobox__ghost').count()).toBe(0)
    // Buscando por expediente (no es prefijo de la etiqueta) no hay fantasma
    await page.keyboard.press('Escape')
    await page.keyboard.press('Escape')
    await type(page, 'cb-pac', '001007', { wait: 350 })
    s = await st(page, 'cb-pac')
    expect(s.n).toBeGreaterThan(0)
    expect(await page.locator('#sec-combobox .g-combobox__ghost').count()).toBe(0)
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('Tab: con cuatro homónimas el campo completa pero no elige; con etiqueta única y lista completa, elige', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    await type(page, 'cb-pac', 'maría garcía l', { wait: 350 })
    expect(await page.locator('#cb-pac').evaluate((i) => i.closest('.g-combobox').querySelector('.g-combobox__ghost-rest')?.textContent)).toBe('ópez')
    await page.keyboard.press('Tab')
    await frames(page)
    expect(await out(page, 'cb-out-pac'), 'homónimas: Tab no elige').toMatch(/^paciente: null/)
    expect((await st(page, 'cb-pac')).value).toBe('')
    // «mar»: etiqueta de la primera no es única y además hay «Mostrar más»
    await type(page, 'cb-pac', 'mar', { wait: 350 })
    await page.keyboard.press('Tab')
    await frames(page)
    expect(await out(page, 'cb-out-pac')).toMatch(/^paciente: null/)
    // Etiqueta única y lista completa: «diab» + Tab es un diagnóstico entero
    await type(page, 'cb-dx', 'diab')
    await page.keyboard.press('Tab')
    await frames(page)
    expect(await out(page, 'cb-out-dx')).toBe('dx: E10.9')
    const s = await st(page, 'cb-dx')
    expect(s.token).toBe(true)
    expect(s.focus, 'Tab sigue su camino').not.toBe('cb-dx')
    expect(errs, errs.join('\n')).toEqual([])
  })
})

test.describe('GCombobox · B · paleta con vista previa', () => {
  test('la primera tecla no se pierde; :modal dentro del visor; la vista previa distingue homónimas con ↓; activa invertida', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    await page.focus('#cb-pal')
    await frames(page)
    expect((await st(page, 'cb-pal')).surface, 'enfocar no abre').toBe(false)
    await page.keyboard.type('maría garcía lópez', { delay: 15 })
    await page.waitForTimeout(400)
    let s = await st(page, 'cb-pal')
    expect(s.surface).toBe(true)
    expect(s.q, 'el texto completo, desde la primera tecla').toBe('maría garcía lópez')
    expect(s.value, 'el campo de la página conserva su texto').toBe('')
    expect(s.focus).toBe('cb-pal-search')
    expect(s.expanded).toBe('true')
    const d = await page.evaluate(() => {
      const el = document.getElementById('cb-pal-surface'); const r = el.getBoundingClientRect(); const f = document.getElementById('cb-pal-search')
      const pv = document.getElementById('cb-pal-preview')
      return {
        modal: el.matches(':modal'), palette: el.classList.contains('g-combobox-surface--palette'), inView: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
        title: document.getElementById(el.getAttribute('aria-labelledby'))?.textContent, fieldName: document.getElementById(f.getAttribute('aria-labelledby'))?.textContent,
        fieldAttrs: [f.getAttribute('role'), f.getAttribute('aria-autocomplete'), f.getAttribute('aria-expanded'), f.getAttribute('aria-controls')],
        previewTag: pv.tagName, previewName: pv.getAttribute('aria-label'), previewLive: pv.getAttribute('aria-live'), bodyTab: el.querySelector('.g-dialog__body').getAttribute('tabindex'),
        bodyScrolls: (() => { const b = el.querySelector('.g-dialog__body'); return b.scrollHeight > b.clientHeight + 1 })(),
        liveIn: Boolean(el.querySelector('.g-combobox__live')), inRoot: el.parentElement === document.getElementById('cb-pal').closest('.g-combobox')
      }
    })
    expect(d).toEqual({ modal: true, palette: true, inView: true, title: 'Paciente (paleta con vista previa)', fieldName: 'Paciente (paleta con vista previa)', fieldAttrs: ['combobox', 'list', 'true', 'cb-pal-list'], previewTag: 'ASIDE', previewName: 'Vista previa', previewLive: null, bodyTab: null, bodyScrolls: false, liveIn: true, inRoot: true })
    expect(s.n).toBeGreaterThanOrEqual(4)
    const exp = () => page.evaluate(() => document.querySelector('#cb-pal-preview .g-combobox__preview-facts dd')?.textContent)
    const e1 = await exp()
    expect(await page.locator('#cb-pal-preview .g-combobox__preview-title').textContent()).toBe('María García López')
    await page.keyboard.press('ArrowDown')
    await frames(page)
    const e2 = await exp()
    expect([e1, e2]).toEqual(['001000', '001007'])
    // El dato que distingue va también en la fila (la vista previa nunca es la única fuente, #335)
    expect((await st(page, 'cb-pal')).activeText).toContain('001007')
    await page.waitForTimeout(250)
    const cB = await contrast(page, '#cb-pal-list .is-active .g-combobox__label')
    expect(cB, `activa invertida ${cB?.toFixed(1)}`).toBeGreaterThanOrEqual(4.5)
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => !document.getElementById('cb-pal-surface').open)
    await frames(page, 3)
    s = await st(page, 'cb-pal')
    expect(await out(page, 'cb-out-pac')).toMatch(/paleta: p001007$/)
    expect(s.focus, 'elegir devuelve el foco al campo').toBe('cb-pal')
    expect(s.token).toBe(true)
    expect(s.about).toBe('Exp. 001007 · 5 años')
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('Tab no sale de la superficie y nunca elige; Esc y el fondo cierran sin elegir y devuelven el foco', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page)
    await page.focus('#cb-pal')
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => document.activeElement.id === 'cb-pal-search')
    await page.keyboard.type('mar', { delay: 15 })
    await page.waitForTimeout(350)
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab')
      expect(await page.evaluate(() => Boolean(document.activeElement.closest('#cb-pal-surface')) || document.activeElement === document.body), `Tab ${i + 1} sigue dentro`).toBe(true)
    }
    // El cierre va antes que el campo en el DOM (cabecera de GDialog): Mayús+Tab desde el campo llega a él.
    // WebKit no enfoca botones con Tab salvo ajuste del sistema: se exime en ese motor (límite conocido del contrato)
    if (browserName !== 'webkit') {
      await page.focus('#cb-pal-search')
      await page.keyboard.press('Shift+Tab')
      expect(await page.evaluate(() => document.activeElement.classList.contains('g-dialog__close'))).toBe(true)
    }
    expect(await out(page, 'cb-out-pac')).toMatch(/paleta: null$/)
    await page.focus('#cb-pal-search')
    await page.keyboard.press('Escape')
    await page.waitForFunction(() => !document.getElementById('cb-pal-surface').open)
    await frames(page, 3)
    let s = await st(page, 'cb-pal')
    expect(s.focus).toBe('cb-pal')
    expect(await out(page, 'cb-out-pac')).toMatch(/paleta: null$/)
    // Flecha (puntero) abre; el fondo cierra
    await page.click('#cb-pal')
    await page.waitForSelector('#cb-pal-surface[open]')
    await frames(page, 3)
    await page.mouse.click(8, 8)
    await page.waitForFunction(() => !document.getElementById('cb-pal-surface').open)
    await frames(page, 3)
    s = await st(page, 'cb-pal')
    expect(s.expanded).toBe('false')
    expect(await out(page, 'cb-out-pac')).toMatch(/paleta: null$/)
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('sobre un GDialog (modal sobre modal): elige, vuelve al campo y el anfitrión sigue abierto; Esc cierra un nivel', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    await page.click('#cb-d-open')
    await page.waitForSelector('#cb-dlg[open]')
    await page.focus('#cb-d-pal')
    await page.keyboard.type('dra')
    await page.waitForTimeout(300)
    let s = await st(page, 'cb-d-pal')
    expect(s.surface).toBe(true)
    expect(s.q).toBe('dra')
    const top = await page.evaluate(() => { const d = document.getElementById('cb-d-pal-surface'); const r = d.getBoundingClientRect(); return [d.matches(':modal'), Boolean(d.closest('#cb-dlg')), Boolean(document.elementFromPoint(r.left + r.width / 2, r.top + 20)?.closest('#cb-d-pal-surface'))] })
    expect(top).toEqual([true, true, true])
    await page.keyboard.press('Escape')
    await page.waitForFunction(() => !document.getElementById('cb-d-pal-surface').open)
    expect(await page.evaluate(() => document.getElementById('cb-dlg').open), 'Esc cierra la superficie, no el anfitrión').toBe(true)
    await frames(page, 3)
    expect((await st(page, 'cb-d-pal')).focus).toBe('cb-d-pal')
    await page.keyboard.press('ArrowDown')
    await page.waitForFunction(() => document.activeElement.id === 'cb-d-pal-search')
    await page.keyboard.type('pediat', { delay: 15 })
    await page.waitForTimeout(300)
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => !document.getElementById('cb-d-pal-surface').open)
    await frames(page, 3)
    s = await st(page, 'cb-d-pal')
    expect(s.value).toBe('Dra. Itzel Córdova Ruiz')
    expect(s.focus).toBe('cb-d-pal')
    expect(await page.evaluate(() => document.getElementById('cb-dlg').open)).toBe(true)
    expect(errs, errs.join('\n')).toEqual([])
  })
})

test.describe('GCombobox · C · el valor es un objeto', () => {
  test('ficha: avatar + nombre + línea secundaria; código; texto libre con marca; Δ0 de alto; descripción accesible', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    const h0 = (await geo(page, 'cb-pac')).h
    const hDx0 = (await geo(page, 'cb-dx')).h
    await type(page, 'cb-pac', 'maría garcía', { wait: 350 })
    // Fichas con rótulo en la lista
    const facts = await page.evaluate(() => [...document.querySelectorAll('#cb-pac-list [role=option]')[0].querySelectorAll('.g-combobox__fact')].map((f) => [f.querySelector('.g-combobox__fact-label').textContent, f.textContent]))
    expect(facts.map((f) => f[0])).toEqual(['Exp.', 'Edad', 'Última visita', 'Médico'])
    expect(facts[0][1]).toBe('Exp. 001000')
    await page.keyboard.press('Enter')
    await frames(page, 3)
    const tok = (id) => page.evaluate((id) => {
      const root = document.getElementById(id).closest('.g-combobox'); const t = root.querySelector('.g-combobox__token')
      const i = document.getElementById(id); const cs = getComputedStyle(i)
      const c = root.querySelector('.g-input__control').getBoundingClientRect(); const r = t.getBoundingClientRect()
      return {
        hidden: t.getAttribute('aria-hidden'), pe: getComputedStyle(t).pointerEvents, avatar: Boolean(t.querySelector('.g-combobox__lead .g-avatar--size-xs')), icon: Boolean(t.querySelector('.g-combobox__lead svg')),
        code: t.querySelector('.g-combobox__code')?.textContent || null, label: t.querySelector('.g-combobox__token-label').textContent, meta: t.querySelector('.g-combobox__token-meta')?.textContent || null,
        inputTransparent: /rgba\(0, 0, 0, 0\)|transparent/.test(cs.color), value: i.value, inside: r.left >= c.left - 1 && r.right <= c.right + 1 && r.top >= c.top - 1 && r.bottom <= c.bottom + 1,
        prependHidden: (() => { const p = root.querySelector('.g-input__prepend'); return p ? getComputedStyle(p).display === 'none' : null })()
      }
    }, id)
    let t = await tok('cb-pac')
    expect(t).toMatchObject({ hidden: 'true', pe: 'none', avatar: true, code: null, label: 'María García López', meta: 'Exp. 001000 · 22 años', inputTransparent: true, value: 'María García López', inside: true, prependHidden: true })
    let s = await st(page, 'cb-pac')
    expect(s.focus, 'el foco sigue en el campo con la ficha puesta').toBe('cb-pac')
    expect(s.about).toBe('Exp. 001000 · 22 años')
    expect(s.describedby.split(' ')[0]).toBe('cb-pac-about')
    expect(Math.abs((await geo(page, 'cb-pac')).h - h0), 'Δ0 de alto con ficha').toBeLessThan(0.5)
    const cT = await contrast(page, '#sec-combobox .g-combobox__token-meta')
    expect(cT, `dato secundario ${cT?.toFixed(2)}`).toBeGreaterThanOrEqual(4.5)
    // Diagnóstico: código en su caja
    await type(page, 'cb-dx', 'e11')
    await page.keyboard.press('Enter')
    await frames(page, 3)
    t = await tok('cb-dx')
    expect(t).toMatchObject({ avatar: false, code: 'E11.9', label: 'Diabetes mellitus tipo 2, sin mención de complicación', meta: 'Endocrinas, nutricionales y metabólicas', inside: true })
    expect(Math.abs((await geo(page, 'cb-dx')).h - hDx0)).toBeLessThan(0.5)
    // Texto libre: marca visible y accesible
    await type(page, 'cb-med', 'Jarabe casero')
    await page.keyboard.press('Tab')
    await frames(page, 3)
    t = await tok('cb-med')
    expect(t).toMatchObject({ icon: true, label: 'Jarabe casero', meta: 'Texto libre' })
    s = await st(page, 'cb-med')
    expect(s.custom).toBe(true)
    expect(s.about).toBe('Texto libre')
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('edición sobre la ficha: escribir la reemplaza y busca; Esc × 2 la recupera; Retroceso la vacía; el clic abre', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    await type(page, 'cb-dx', 'cefa')
    await page.keyboard.press('Enter')
    await frames(page, 3)
    expect(await out(page, 'cb-out-dx')).toBe('dx: R51')
    await page.keyboard.type('as', { delay: 15 })
    await page.waitForTimeout(200)
    let s = await st(page, 'cb-dx')
    expect(s.value, 'escribir reemplaza').toBe('as')
    expect(s.token).toBe(false)
    expect(s.expanded).toBe('true')
    expect(s.about).toBe('')
    await page.keyboard.press('Escape')
    await page.keyboard.press('Escape')
    await frames(page)
    s = await st(page, 'cb-dx')
    expect(s.value).toBe('Cefalea')
    expect(s.token).toBe(true)
    expect(await out(page, 'cb-out-dx')).toBe('dx: R51')
    // El clic abre y devuelve el texto editable (seleccionado)
    await page.locator('#cb-dx').blur()
    await page.click('#cb-dx')
    await frames(page)
    s = await st(page, 'cb-dx')
    expect(s.expanded).toBe('true')
    expect(s.token).toBe(false)
    expect(s.n, 'sin escribir: la lista completa').toBe(34)
    expect(await page.evaluate(() => { const i = document.getElementById('cb-dx'); return i.selectionStart === 0 && i.selectionEnd === i.value.length && getComputedStyle(i).color !== 'rgba(0, 0, 0, 0)' })).toBe(true)
    await page.keyboard.press('Backspace')
    await page.waitForTimeout(150)
    await page.keyboard.press('Tab')
    await frames(page)
    expect(await out(page, 'cb-out-dx'), 'Retroceso vacía y salir borra').toBe('dx: null')
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('320px: la ficha cabe en la caja y el nombre gana sitio al dato secundario', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page, { width: 320, height: 720 })
    await page.click('#cb-pac')
    await page.waitForFunction(() => document.activeElement.id === 'cb-pac-search')
    await page.keyboard.type('maría garcía', { delay: 15 })
    await page.waitForTimeout(350)
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => !document.getElementById('cb-pac-surface').open)
    await frames(page, 3)
    const n = await page.evaluate(() => {
      const root = document.getElementById('cb-pac').closest('.g-combobox'); const c = root.querySelector('.g-input__control').getBoundingClientRect()
      const t = root.querySelector('.g-combobox__token').getBoundingClientRect(); const name = root.querySelector('.g-combobox__token-label'); const meta = root.querySelector('.g-combobox__token-meta')
      return { fits: t.left >= c.left - 1 && t.right <= c.right + 1, name: name.getBoundingClientRect().width, nameCut: name.scrollWidth > name.clientWidth + 1, meta: meta.getBoundingClientRect().width, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }
    })
    expect(n.fits).toBe(true)
    // El dato secundario se recorta primero: el nombre solo se recorta cuando el secundario ya no ocupa nada
    expect(!n.nameCut || n.meta < 1, `el nombre gana sitio (${Math.round(n.name)}px; secundaria ${Math.round(n.meta)}px)`).toBe(true)
    expect(n.name).toBeGreaterThan(n.meta)
    expect(n.sw).toBeLessThanOrEqual(n.cw)
    expect(errs, errs.join('\n')).toEqual([])
  })
})

test.describe('GCombobox · en una GFormRow (#336)', () => {
  test('la fila se parte antes de que A quede por debajo de 240px (--g-form-min: 60) y respeta el valor del consumidor', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    await page.locator('#cb-row').scrollIntoViewIfNeeded()
    const at = async (w) => {
      await page.evaluate((w) => { document.getElementById('cb-layout').style.inlineSize = w + 'px' }, w)
      await frames(page, 4)
      return page.evaluate(() => {
        const row = document.getElementById('cb-row'); const cb = document.getElementById('cb-f-pac').closest('.g-combobox')
        return { lines: Number(row.dataset.lines), w: cb.getBoundingClientRect().width, line: cb.dataset.line, min: getComputedStyle(cb).getPropertyValue('--g-form-min').trim() }
      })
    }
    const wide = await at(900)
    expect(wide.min).toBe('60')
    expect(wide.lines).toBe(1)
    const seen = []
    for (const w of [900, 800, 760, 720, 680, 640, 600, 560, 520, 480, 420, 360, 300]) {
      const r = await at(w)
      seen.push([w, r.lines, Math.round(r.w)])
      // Mientras comparte línea o tiene sitio, nunca por debajo de 240; solo el propio contenedor puede estrecharlo
      if (w >= 240) expect(r.w, `contenedor ${w}: campo de ${r.w}px`).toBeGreaterThanOrEqual(239)
    }
    const firstBreak = seen.find(([, lines]) => lines > 1)
    expect(firstBreak, JSON.stringify(seen)).toBeTruthy()
    // Con un mínimo menor puesto por el consumidor, la misma anchura cabe en una línea
    const wBreak = firstBreak[0]
    expect((await at(wBreak)).lines).toBeGreaterThan(1)
    await page.evaluate(() => document.getElementById('cb-f-pac').closest('.g-combobox').style.setProperty('--g-form-min', '30'))
    const custom = await at(wBreak)
    expect(custom.min).toBe('30')
    expect(custom.lines, `a ${wBreak}px con --g-form-min: 30`).toBe(1)
    expect(custom.w).toBeLessThan(239)
    expect(errs, errs.join('\n')).toEqual([])
  })
})
