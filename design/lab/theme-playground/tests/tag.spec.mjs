// GTag y GTagGroup sobre el COMPONENTE REAL del playground (packages/vue/playground, #sec-tag), en Chromium, Firefox y
// WebKit. Port de design/lab/chip/r01/verificar.mjs (kiwi) y de los puntos de navegador de design/contracts/tag.md
// §«Verificación» (DECISIONS.md #460 a #473; #505 en api.md): semántica y árbol, alternar con clic/Espacio/Intro, nombres
// únicos, Supr y Retroceso, foco tras quitar, «Quitar todas», «Ver N más», tamaños 32/24 y tapa del alto, 44px con puntero
// grueso, recorte con pista solo si recortado, estática partida, RTL, 320px y consola limpia. La personalidad (Δ0 de la
// huella, vista previa, recogida) va en personalidad-tag.spec.mjs.
import { test, expect } from '@playwright/test'
import { PAGE, TAB, watchConsole, frames, hover, openTexts } from './visual-tip-helpers.mjs'

async function open(page, target = '#tg-flow', { motion = 'reduce', width = 1280, height = 900 } = {}) {
  await page.emulateMedia({ reducedMotion: motion })
  await page.setViewportSize({ width, height })
  await page.goto(PAGE)
  await page.waitForSelector(`${target} .g-tag`)
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), target)
  await page.mouse.move(2, 2)
  await frames(page)
}
const act = (page) => page.evaluate(() => { const a = document.activeElement; return a ? (a.querySelector('.g-tag__sr')?.textContent || a.textContent.trim()) : null })
const live = async (page, sel) => { await page.waitForTimeout(150); return page.evaluate((s) => document.querySelector(`${s} .g-tag-group__live`).textContent, sel) }
const tagEvents = (page) => page.evaluate(() => window.tgEvents.slice())

test.describe('GTag y GTagGroup · componente real (tag.md)', () => {
  test('semántica por caso y árbol de accesibilidad', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    const sem = await page.evaluate(() => {
      const q = (s) => document.querySelector(s)
      const st = q('#tg-static .g-tag-group__list')
      return {
        flow: [q('#tg-flow .g-tag-group__list').tagName, q('#tg-flow .g-tag-group__list').getAttribute('role'), q('#tg-flow .g-tag-group__list').getAttribute('aria-label')],
        staticFocusable: [...document.querySelectorAll('#tg-static .g-tag')].some((t) => t.matches('[tabindex]') || t.querySelector('a, button, [tabindex]')),
        staticRole: [st.tagName, st.getAttribute('role')],
        view: [q('#tg-view .g-tag-group__list').tagName, q('#tg-view .g-tag-group__list').getAttribute('role')],
        disabledToggle: q('#tg-view [data-id="v4"] button').disabled,
        links: [...document.querySelectorAll('#tg-links a.g-tag__body[href]')].length,
        linkDisabled: [q('#tg-links [data-id="l4"] a').getAttribute('role'), q('#tg-links [data-id="l4"] a').getAttribute('aria-disabled'), q('#tg-links [data-id="l4"] a').hasAttribute('href')],
        removeInLink: Boolean(q('#tg-links a .g-tag__remove')),
        checkHidden: q('#tg-view .g-tag__check').getAttribute('aria-hidden'),
        textDir: q('#tg-flow .g-tag__text').getAttribute('dir'),
        tipsOutsideList: [...document.querySelectorAll('#tg-flow .g-tooltip')].every((n) => n.parentElement.id === 'tg-flow' && n.getAttribute('aria-hidden') === 'true')
      }
    })
    expect(sem.flow).toEqual(['UL', 'list', 'Alergias'])
    expect(sem.staticFocusable).toBe(false)
    expect(sem.staticRole).toEqual(['UL', 'list'])
    expect(sem.view).toEqual(['DIV', 'group'])
    expect(sem.disabledToggle).toBe(true)
    expect(sem.links).toBe(3)
    expect(sem.linkDisabled).toEqual(['link', 'true', false])
    expect(sem.removeInLink).toBe(false)
    expect(sem.checkHidden).toBe('true')
    expect(sem.textDir).toBe('auto')
    expect(sem.tipsOutsideList).toBe(true)
    const snap = await page.locator('#tg-flow').ariaSnapshot()
    expect(snap).toMatch(/list "Alergias"/)
    expect((snap.match(/listitem/g) || []).length).toBe(6)
    expect(snap).toMatch(/button "Quitar Penicilina"/)
    const snapT = await page.locator('#tg-view').ariaSnapshot()
    expect(snapT).toMatch(/group "Vista"/)
    expect(snapT).toMatch(/button "Solo pendientes" \[pressed\]/)
    const snapF = await page.locator('#tg-facets').ariaSnapshot()
    expect(snapF).toMatch(/list "Estado"/)
    expect(snapF).toMatch(/button "Quitar Alta de Prioridad"/)
    expect(snapF).toMatch(/button "Quitar Alta de Impacto"/)
    const snapFT = await page.locator('#tg-facet-toggles').ariaSnapshot()
    expect(snapFT).toMatch(/group "Estado"/)
    expect(errs).toEqual([])
  })

  test('nombres de «Quitar» únicos entre hermanos (también con el mismo texto en dos facetas)', async ({ page }) => {
    await open(page, '#tg-facets')
    for (const g of ['#tg-flow', '#tg-facets', '#tg-people']) {
      const names = await page.evaluate((s) => [...document.querySelectorAll(`${s} .g-tag__remove .g-tag__sr`)].map((x) => x.textContent), g)
      expect(new Set(names).size, g).toBe(names.length)
    }
  })

  test('alternar con clic, Espacio e Intro: aria-pressed, is-pressed y evento toggle', async ({ page }) => {
    await open(page, '#tg-view')
    const b = '#tg-view [data-id="v2"] button'
    await page.click(b)
    await expect(page.locator(b)).toHaveAttribute('aria-pressed', 'true')
    await page.focus(b)
    await page.keyboard.press('Space')
    await expect(page.locator(b)).toHaveAttribute('aria-pressed', 'false')
    await page.keyboard.press('Enter')
    await expect(page.locator(b)).toHaveAttribute('aria-pressed', 'true')
    expect(await page.evaluate((s) => document.querySelector(s).closest('.g-tag').classList.contains('is-pressed'), b)).toBe(true)
    const ev = (await tagEvents(page)).filter((e) => e.name === 'toggle' && e.group === 'view')
    expect(ev.map((e) => e.pressed)).toEqual([true, false, true])
    // El nombre no cambia con el estado
    await expect(page.locator(b)).toHaveAccessibleName('Con adjuntos')
    // Suelta con v-model:pressed
    await page.click('[data-test="s-toggle"] button')
    await expect(page.locator('[data-test="s-toggle"] button')).toHaveAttribute('aria-pressed', 'true')
  })

  test('quitar con clic: foco a «Deshacer», anuncio; Supr y Retroceso quitan con source key', async ({ page }) => {
    await open(page)
    await page.click('#tg-flow [data-id="lat"] .g-tag__remove')
    expect(await act(page)).toBe('Deshacer: quitar Látex')
    expect(await live(page, '#tg-flow')).toBe('Látex quitada. Deshacer disponible')
    expect(await page.getAttribute('#tg-flow .g-tag-group__live', 'role')).toBe('status')
    await page.focus('#tg-flow [data-id="nue"] .g-tag__remove')
    await page.keyboard.press('Delete')
    expect(await act(page)).toBe('Deshacer: quitar Nueces')
    await page.focus('#tg-flow [data-id="pol"] .g-tag__remove')
    await page.keyboard.press('Backspace')
    expect(await act(page)).toBe('Deshacer: quitar Polen')
    const ev = (await tagEvents(page)).filter((e) => e.name === 'remove' && e.group === 'flow')
    expect(ev.map((e) => [e.id, e.source])).toEqual([['lat', 'button'], ['nue', 'key'], ['pol', 'key']])
    // Deshacer con Intro: vuelve a su sitio, foco a su «Quitar»
    await page.keyboard.press('Enter')
    expect(await act(page)).toBe('Quitar Polen')
    expect(await live(page, '#tg-flow')).toBe('Polen restaurada')
  })

  test('foco por programa cuando el grupo se queda sin controles: emptyFocus', async ({ page }) => {
    await open(page)
    // Quitar todas → el mismo botón pasa a «Deshacer» con el foco; deshacer las devuelve en su orden
    await page.click('#tg-flow .g-tag-group__clear')
    expect(await page.evaluate(() => document.activeElement.classList.contains('g-tag-group__clear') && document.activeElement.classList.contains('is-undo'))).toBe(true)
    expect(await live(page, '#tg-flow')).toBe('Se quitaron 6 etiquetas')
    await page.keyboard.press('Enter')
    expect(await page.evaluate(() => [...document.querySelectorAll('#tg-flow .g-tag__text')].map((x) => x.textContent).join(','))).toBe('Penicilina,Látex,Nueces,Polen,Ácido acetilsalicílico y otros antiinflamatorios no esteroideos,Mariscos')
    expect(await page.evaluate(() => document.activeElement.classList.contains('g-tag-group__clear') && !document.activeElement.classList.contains('is-undo'))).toBe(true)
    expect(await live(page, '#tg-flow')).toBe('6 etiquetas restauradas')
    // Quitar todas y salir (foco y puntero, #466.6): el «Deshacer» se va y se emite settle
    await page.click('#tg-flow .g-tag-group__clear')
    await page.focus('#tg-add')
    await page.mouse.move(2, 2)
    await page.waitForTimeout(50)
    expect(await page.locator('#tg-flow .g-tag-group__clear').count()).toBe(0)
    expect(await page.locator('#tg-flow .g-tag-group__empty').textContent()).toBe('Sin etiquetas')
    const settle = (await tagEvents(page)).filter((e) => e.name === 'settle' && e.group === 'flow').pop()
    expect(settle.ids.length).toBe(6)
  })

  test('«Quitar todas» y «Deshacer» con CLIC: deshace en los tres motores (hallazgo 5 de la auditoría, #466.6)', async ({ page }) => {
    await open(page)
    const order = 'Penicilina,Látex,Nueces,Polen,Ácido acetilsalicílico y otros antiinflamatorios no esteroideos,Mariscos'
    const texts = () => page.evaluate(() => [...document.querySelectorAll('#tg-flow .g-tag__text')].map((x) => x.textContent).join(','))
    const flowEvents = async () => (await tagEvents(page)).filter((e) => e.group === 'flow').map((e) => e.name)
    await page.click('#tg-flow .g-tag-group__clear')
    expect(await page.locator('#tg-flow .g-tag-group__clear.is-undo').count()).toBe(1)
    // El mousedown de WebKit saca el foco del botón: el puntero con hover retiene el «Deshacer» hasta el clic
    await page.click('#tg-flow .g-tag-group__clear')
    expect(await texts()).toBe(order)
    expect(await flowEvents()).toEqual(['clear', 'restore'])
    expect(await live(page, '#tg-flow')).toBe('6 etiquetas restauradas')
    expect(await page.locator('#tg-flow .g-tag-group__clear:not(.is-undo)').count()).toBe(1)
    // Otra vez, con el foco fuera del grupo antes del clic (lo que hace WebKit en el mousedown) y el puntero encima:
    // sigue deshaciendo. (Tras «Quitar todas» el botón sube; el puntero vuelve a él para pulsar.)
    await page.click('#tg-flow .g-tag-group__clear')
    await page.hover('#tg-flow .g-tag-group__clear')
    await page.evaluate(() => document.activeElement.blur())
    await page.waitForTimeout(50)
    expect(await page.locator('#tg-flow .g-tag-group__clear.is-undo').count()).toBe(1)
    await page.click('#tg-flow .g-tag-group__clear')
    expect(await texts()).toBe(order)
    expect(await flowEvents()).toEqual(['clear', 'restore', 'clear', 'restore'])
    // Sin foco dentro, al salir el puntero el «Deshacer» se va y se emite settle
    await page.click('#tg-flow .g-tag-group__clear')
    await page.evaluate(() => document.activeElement.blur())
    await page.mouse.move(2, 2)
    await page.waitForTimeout(50)
    expect(await page.locator('#tg-flow .g-tag-group__clear').count()).toBe(0)
    const ev = (await tagEvents(page)).filter((e) => e.group === 'flow')
    expect(ev.map((e) => e.name)).toEqual(['clear', 'restore', 'clear', 'restore', 'clear', 'settle'])
    expect(ev.pop().ids.length).toBe(6)
  })

  test('«Ver N más» (Disclosure): aria-expanded, aria-controls, ocultas fuera del árbol, foco en el botón', async ({ page }) => {
    await open(page, '#tg-limit')
    const more = '#tg-limit .g-tag-group__more'
    const m = await page.evaluate((s) => { const b = document.querySelector(s); return { t: b.textContent.trim(), exp: b.getAttribute('aria-expanded'), ctl: !!document.getElementById(b.getAttribute('aria-controls')), hidden: document.querySelectorAll('#tg-limit [data-id][hidden]').length } }, more)
    expect(m).toEqual({ t: 'Ver 5 más', exp: 'false', ctl: true, hidden: 5 })
    await page.click(more)
    expect(await page.evaluate((s) => { const b = document.querySelector(s); return b.getAttribute('aria-expanded') === 'true' && b === document.activeElement && !document.querySelector('#tg-limit [data-id][hidden]') && b.textContent.trim() === 'Ver menos' }, more)).toBe(true)
  })

  test('tamaños: md 32 y sm 24; la tapa mide el alto de la etiqueta; cuerpo interactivo ≥ 24', async ({ page }) => {
    await open(page, '#tg-single')
    const sz = await page.evaluate(() => {
      const r = (s) => document.querySelector(s).getBoundingClientRect()
      return {
        md: r('#tg-flow [data-id="pen"] .g-tag').height,
        sm: r('#tg-limit [data-id="m0"] .g-tag').height,
        capMd: [r('#tg-flow [data-id="pen"] .g-tag__remove').width, r('#tg-flow [data-id="pen"] .g-tag__remove').height],
        capSm: [r('#tg-limit [data-id="m0"] .g-tag__remove').width, r('#tg-limit [data-id="m0"] .g-tag__remove').height],
        smToggle: r('[data-test="s-sm-toggle"]').height,
        // El área de 24px de la tapa sm y del cuerpo sm (::after)
        afterSm: parseFloat(getComputedStyle(document.querySelector('#tg-limit [data-id="m0"] .g-tag__remove'), '::after').height)
      }
    })
    expect(Math.round(sz.md)).toBe(32)
    expect(Math.round(sz.sm)).toBe(24)
    expect(sz.capMd.map(Math.round)).toEqual([32, 32])
    expect(sz.capSm.map(Math.round)).toEqual([24, 24])
    expect(Math.round(sz.smToggle)).toBe(24)
    expect(sz.afterSm).toBeGreaterThanOrEqual(24)
  })

  test('recorte: la interactiva se recorta con pista; la estática no se recorta, se parte', async ({ page, browserName }) => {
    await open(page, '#tg-links', { motion: 'no-preference' })
    const cut = await page.evaluate(() => {
      const t = document.querySelector('#tg-links [data-id="l3"] .g-tag__text')
      const s = document.querySelector('#tg-static [data-id="s4"] .g-tag__text')
      return { inter: t.scrollWidth > t.clientWidth + 1, staticCut: s.scrollWidth > s.clientWidth + 1, lines: Math.round(s.getBoundingClientRect().height / parseFloat(getComputedStyle(s).lineHeight)) }
    })
    expect(cut.inter).toBe(true)
    expect(cut.staticCut).toBe(false)
    expect(cut.lines).toBeGreaterThanOrEqual(2)
    // El nombre accesible del enlace recortado es el texto entero
    await expect(page.locator('#tg-links [data-id="l3"] a')).toHaveAccessibleName('Hipertensión arterial esencial (primaria) controlada con tratamiento')
    // Pista al apuntar el enlace recortado: el texto entero
    await hover(page, '#tg-links [data-id="l3"] a')
    await expect.poll(() => openTexts(page), { timeout: 5000 }).toEqual(['Hipertensión arterial esencial (primaria) controlada con tratamiento'])
    // Un enlace no recortado no abre pista
    await page.mouse.move(2, 2)
    await page.waitForTimeout(600)
    await hover(page, '#tg-links [data-id="l1"] a')
    await page.waitForTimeout(900)
    expect(await openTexts(page)).toEqual([])
    // «Quitar» siempre enseña su nombre
    await hover(page, '#tg-links [data-id="l3"] .g-tag__remove')
    await expect.poll(() => openTexts(page), { timeout: 5000 }).toEqual(['Quitar Hipertensión arterial esencial (primaria) controlada con tratamiento'])
    // El nombre accesible del control no cambia con la pista abierta
    await expect(page.locator('#tg-links [data-id="l3"] .g-tag__remove')).toHaveAccessibleName('Quitar Hipertensión arterial esencial (primaria) controlada con tratamiento')
    void browserName
  })

  test('pista de «Deshacer» de la huella al llegar con teclado', async ({ page, browserName }) => {
    await open(page, '#tg-flow', { motion: 'no-preference' })
    await page.click('#tg-flow [data-id="pen"] .g-tag__remove')
    // Foco por programa: no abre la pista (regla del motor)
    await page.waitForTimeout(700)
    expect(await openTexts(page)).toEqual([])
    // Navegar fuera y volver con Mayús+Tab la abre
    await page.keyboard.press(TAB(browserName))
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab')
    expect(await act(page)).toBe('Deshacer: quitar Penicilina')
    await expect.poll(() => openTexts(page), { timeout: 5000 }).toEqual(['Deshacer: quitar Penicilina'])
  })

  test('navigate: clic primario cancelable (router); con modificador no se emite (#505)', async ({ page, browserName }) => {
    await open(page, '#tg-links')
    const url = page.url()
    await page.click('#tg-links [data-id="l1"] a')
    expect(page.url()).toBe(url) // preventDefault() de la aplicación
    let ev = (await tagEvents(page)).filter((e) => e.name === 'navigate')
    expect(ev.map((e) => [e.id, e.href])).toEqual([['l1', '#tema-vue']])
    // Con Mayús, Ctrl, ⌘ o Alt (pestaña o ventana nueva, descarga): no hay navigate
    await page.evaluate(() => { const a = document.querySelector('#tg-links [data-id="l2"] a'); for (const m of ['shiftKey', 'ctrlKey', 'metaKey', 'altKey']) a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, [m]: true })) })
    ev = (await tagEvents(page)).filter((e) => e.name === 'navigate')
    expect(ev.length).toBe(1)
    // Intro sobre el enlace emite
    await page.focus('#tg-links [data-id="l2"] a')
    await page.keyboard.press('Enter')
    ev = (await tagEvents(page)).filter((e) => e.name === 'navigate')
    expect(ev.map((e) => e.id)).toEqual(['l1', 'l2'])
    void browserName
  })

  test('RTL: tapa al final lógico (izquierda), lomo al inicio lógico (derecha), undo-2 espejado', async ({ page }) => {
    await open(page, '#tg-rtl')
    const g = await page.evaluate(() => {
      const tag = document.querySelector('#tg-rtl [data-id="r1"] .g-tag').getBoundingClientRect()
      const cap = document.querySelector('#tg-rtl [data-id="r1"] .g-tag__remove').getBoundingClientRect()
      const facet = document.querySelector('#tg-rtl .g-tag-group__facet')
      const cs = getComputedStyle(facet)
      return { capLeft: Math.abs(cap.left - tag.left) < 2, spineRight: parseFloat(cs.borderRightWidth) > parseFloat(cs.borderLeftWidth) }
    })
    expect(g).toEqual({ capLeft: true, spineRight: true })
    await page.click('#tg-rtl [data-id="r1"] .g-tag__remove')
    // g-icon--flip-rtl espeja con la propiedad individual `scale` (GIcon.css)
    const flip = await page.evaluate(() => { const s = document.querySelector('#tg-rtl [data-id="r1"] .g-tag__undo svg'); return [s.classList.contains('g-icon--flip-rtl'), getComputedStyle(s).scale] })
    expect(flip).toEqual([true, '-1 1'])
  })

  test('320px: sin desplazamiento horizontal del grupo', async ({ page }) => {
    await open(page, '#tg-flow', { width: 320 })
    const o = await page.evaluate(() => [...document.querySelectorAll('#tg-app .g-tag-group')].map((g) => ({ id: g.id, over: g.scrollWidth - g.clientWidth })).filter((x) => x.over > 1))
    expect(o).toEqual([])
    const doc = await page.evaluate(() => document.querySelector('#sec-tag').scrollWidth <= document.querySelector('#sec-tag').clientWidth + 1)
    expect(doc).toBe(true)
  })
})

test.describe('GTag · área táctil con puntero grueso', () => {
  test.skip(({ browserName }) => browserName === 'firefox', 'Firefox: sin puntero grueso en Playwright')
  test.use({ hasTouch: true, isMobile: true })
  test('tapa, «Deshacer» y cuerpo interactivo ≥ 44px de área (::after centrado)', async ({ page }) => {
    await open(page, '#tg-limit', { width: 400 })
    expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true)
    const a = await page.evaluate(() => {
      const after = (s) => { const cs = getComputedStyle(document.querySelector(s), '::after'); return [parseFloat(cs.width), parseFloat(cs.height)] }
      return { cap: after('#tg-limit [data-id="m0"] .g-tag__remove'), body: after('#tg-view [data-id="v1"] button') }
    })
    expect(Math.min(...a.cap)).toBeGreaterThanOrEqual(44)
    expect(Math.min(...a.body)).toBeGreaterThanOrEqual(44)
  })
})
