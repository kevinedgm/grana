// GMenu · elementos-enlace (menu.md «Elementos-enlace», #571 a #576; api.md «Enlaces y navigate», #505 con #574).
// Traslado de la parte base de design/lab/menu/r02/verificar.mjs al GMenu REAL del UMD (window.Grana) en el playground:
// anatomía y nombre accesible, navigate con su guarda, Intro y Espacio, deshabilitado, M1 con enlaces, gestos del navegador
// (modificadores, clic central, clic derecho, target), router simulado y sin router, página actual y RTL.
// La personalidad (B · pie de destino y C · varias pestañas) está en personalidad-menu-links.spec.mjs.
import { test, expect } from '@playwright/test'
import { mountLinks, acc, openAcc, isOpen, active, navs, item, hoverOn, contrastOf } from './menu-links-helpers.mjs'

test.setTimeout(90_000)

test.describe('GMenu · elementos-enlace (base)', () => {
  test('anatomía: <a role=menuitem> solo con href; deshabilitado sin href; un aria-current; acciones y casilla siguen siendo <button>', async ({ page }) => {
    await mountLinks(page)
    await openAcc(page)
    const anat = await page.evaluate(() => {
      const l = document.querySelector('#ml-account .g-menu__list')
      const links = [...l.querySelectorAll('a.g-menu__item')]
      const dis = links.find((a) => a.textContent.includes('Facturación'))
      const docs = links.find((a) => a.textContent.includes('Documentación'))
      return {
        links: links.length, allMenuitem: links.every((a) => a.getAttribute('role') === 'menuitem'),
        disHref: dis.hasAttribute('href'), disAria: dis.getAttribute('aria-disabled'), disTab: dis.getAttribute('tabindex'),
        current: l.querySelectorAll('[aria-current="page"]').length, currentTag: l.querySelector('[aria-current="page"]').tagName,
        buttons: l.querySelectorAll('button.g-menu__item').length,
        docsTarget: docs.getAttribute('target'), docsRel: docs.getAttribute('rel')
      }
    })
    expect(anat.links).toBe(6)
    expect(anat.allMenuitem).toBe(true)
    expect(anat).toMatchObject({ disHref: false, disAria: 'true', disTab: '-1', current: 1, currentTag: 'A', buttons: 2, docsTarget: '_blank', docsRel: null })
  })

  test('nombre accesible con el texto oculto (árbol de accesibilidad)', async ({ page }) => {
    await mountLinks(page)
    await openAcc(page)
    await expect(page.getByRole('menuitem', { name: /^Documentación ?, otro sitio, abre en una pestaña nueva$/ })).toHaveCount(1)
    await expect(page.getByRole('menuitem', { name: /^Estado del servicio ?, otro sitio$/ })).toHaveCount(1)
    await expect(page.getByRole('menuitem', { name: 'Mi perfil', exact: true })).toHaveCount(1)
  })

  test('Intro y Espacio en un enlace: navigate, cierra y devuelve el foco; Espacio no desplaza; el router simulado deja la URL', async ({ page }) => {
    await mountLinks(page)
    await page.evaluate(() => { document.body.style.minHeight = '3000px' })
    await openAcc(page)
    expect(await active(page)).toBe('Mi perfil')
    await page.keyboard.press('Enter'); await page.waitForTimeout(80)
    expect(await navs(page)).toEqual(['perfil'])
    expect(await isOpen(page)).toBe(false)
    expect(await active(page)).toBe('Kevin García')
    expect(await page.evaluate(() => location.hash)).toBe('')
    await openAcc(page); await page.keyboard.press('ArrowDown')
    const y0 = await page.evaluate(() => scrollY)
    await page.keyboard.press(' '); await page.waitForTimeout(80)
    expect((await navs(page)).at(-1)).toBe('ajustes')
    expect(await page.evaluate(() => scrollY)).toBe(y0)
    expect(await isOpen(page)).toBe(false)
    expect(await page.evaluate(() => window.__sel.length)).toBe(0)
  })

  test('Espacio con modificadores no hace nada; la letra busca solo en la etiqueta', async ({ page }) => {
    await mountLinks(page)
    await openAcc(page)
    await page.keyboard.press('Shift+ '); await page.waitForTimeout(60)
    expect(await navs(page)).toEqual([])
    expect(await isOpen(page)).toBe(true)
    await page.keyboard.press('e'); await page.waitForTimeout(30)
    expect(await active(page)).toBe('Estado del servicio')
  })

  test('deshabilitado: alcanzable con flechas; Intro, Espacio y clic no navegan ni cierran; el puntero no se posa', async ({ page }) => {
    await mountLinks(page)
    await openAcc(page)
    for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowDown')
    expect(await active(page)).toBe('Facturación')
    await page.keyboard.press('Enter'); await page.keyboard.press(' '); await page.waitForTimeout(60)
    await item(page, 'Facturación').click({ force: true }); await page.waitForTimeout(60)
    expect(await navs(page)).toEqual([])
    expect(await isOpen(page)).toBe(true)
    await hoverOn(page, 'Ajustes')
    expect(await active(page)).toBe('Ajustes')
    await hoverOn(page, 'Facturación')
    expect(await active(page)).toBe('Ajustes')
  })

  test('M1 con enlaces mezclados: el puntero mueve el foco por enlaces y acciones; una sola luz', async ({ page }) => {
    await mountLinks(page)
    await openAcc(page)
    for (const l of ['Ajustes', 'Invitar al equipo', 'Documentación', 'Tema oscuro', 'Cerrar sesión']) {
      await hoverOn(page, l)
      expect(await active(page)).toBe(l)
      expect(await page.evaluate(() => document.querySelectorAll('#ml-account .g-menu__list.has-highlight').length)).toBe(1)
    }
  })

  test('clic primario: navigate y cierra; sin router el navegador sigue el href', async ({ page }) => {
    await mountLinks(page)
    await openAcc(page)
    await item(page, 'Ajustes').click(); await page.waitForTimeout(80)
    expect(await navs(page)).toEqual(['ajustes'])
    expect(await isOpen(page)).toBe(false)
    expect(await page.evaluate(() => location.hash)).toBe('')
    await page.evaluate(() => { window.__router = false })
    await page.mouse.move(1, 1) // el puntero fuera de la lista: al abrir no le quita el foco al primero
    await openAcc(page)
    await page.keyboard.press('Enter'); await page.waitForTimeout(120)
    expect(await page.evaluate(() => location.hash)).toBe('#/perfil')
  })

  test('sin navigate: Ctrl/⌘+clic (C deja abierto), Mayús+clic y clic central; target _blank cierra; clic derecho sigue abierto', async ({ page, browserName }) => {
    await mountLinks(page)
    await openAcc(page)
    const pages0 = page.context().pages().length
    await item(page, 'Ajustes').click({ modifiers: ['ControlOrMeta'] }); await page.waitForTimeout(250)
    await page.bringToFront()
    expect(await navs(page)).toEqual([])
    if (browserName === 'chromium') expect(page.context().pages().length).toBeGreaterThan(pages0)
    expect(await isOpen(page)).toBe(true)
    await item(page, 'Mi perfil').click({ modifiers: ['Shift'] }); await page.waitForTimeout(250)
    await page.bringToFront()
    expect(await navs(page)).toEqual([])
    expect(await isOpen(page)).toBe(false)
    await openAcc(page)
    await item(page, 'Mi perfil').click({ button: 'middle' }); await page.waitForTimeout(250)
    await page.bringToFront()
    expect(await navs(page)).toEqual([])
    if (await isOpen(page)) await page.keyboard.press('Escape')
    await openAcc(page)
    await item(page, 'Documentación').click(); await page.waitForTimeout(250)
    await page.bringToFront()
    expect(await navs(page)).toEqual([])
    expect(await isOpen(page)).toBe(false)
    await openAcc(page)
    await item(page, 'Estado del servicio').click({ button: 'right' }); await page.waitForTimeout(80)
    expect(await navs(page)).toEqual([])
    expect(await isOpen(page)).toBe(true)
  })

  test('ningún preventDefault de GMenu en pointerdown, mousedown, dragstart ni contextmenu de un enlace', async ({ page }) => {
    await mountLinks(page)
    await openAcc(page)
    const prevented = await page.evaluate(() => {
      const a = [...document.querySelectorAll('#ml-account a.g-menu__item')].find((x) => x.textContent.includes('Ajustes'))
      const out = {}
      for (const t of ['pointerdown', 'mousedown', 'dragstart', 'contextmenu']) {
        const e = new Event(t, { bubbles: true, cancelable: true }); a.dispatchEvent(e); out[t] = e.defaultPrevented
      }
      return out
    })
    expect(prevented).toEqual({ pointerdown: false, mousedown: false, dragstart: false, contextmenu: false })
  })

  test('casilla en un menú con enlaces: alterna sin cerrar (select, no navigate)', async ({ page }) => {
    await mountLinks(page)
    await openAcc(page)
    await hoverOn(page, 'Tema oscuro'); await page.keyboard.press('Enter'); await page.waitForTimeout(80)
    expect(await isOpen(page)).toBe(true)
    await expect(item(page, 'Tema oscuro')).toHaveAttribute('aria-checked', 'true')
    expect(await page.evaluate(() => window.__sel)).toEqual(['oscuro'])
  })

  test('página actual: barra ≥ 3:1 sobre la lista y marca «sale de aquí» ≥ 3:1', async ({ page }) => {
    await mountLinks(page)
    await openAcc(page)
    const c = await page.evaluate(() => {
      const l = document.querySelector('#ml-account .g-menu__list')
      const cur = l.querySelector('[aria-current="page"]')
      return { bar: getComputedStyle(cur, '::before').backgroundColor, leave: getComputedStyle(l.querySelector('.g-menu__leave')).color, bg: getComputedStyle(l).backgroundColor }
    })
    expect(await contrastOf(page, c.bar, c.bg)).toBeGreaterThanOrEqual(3)
    expect(await contrastOf(page, c.leave, c.bg)).toBeGreaterThanOrEqual(3)
  })

  test('RTL: barra de la página actual al inicio lógico (derecha)', async ({ page }) => {
    await mountLinks(page, { dir: 'rtl' })
    await openAcc(page)
    const r = await page.evaluate(() => {
      const el = document.querySelector('#ml-account [aria-current="page"]')
      const b = el.getBoundingClientRect()
      const s = getComputedStyle(el, '::before')
      return { right: parseFloat(s.right), w: parseFloat(s.width), elRight: b.right }
    })
    expect(r.right).toBe(0)
  })

  test('375 px: sin desborde de la página y la lista dentro del visor', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 740 })
    await mountLinks(page)
    await openAcc(page)
    const fit = await page.evaluate(() => {
      const r = document.querySelector('#ml-account .g-menu__list').getBoundingClientRect()
      return { over: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1, inside: r.left >= 0 && r.right <= innerWidth }
    })
    expect(fit).toEqual({ over: false, inside: true })
  })

  test('is-branch en el padre de submenú que contiene la página actual (dos niveles)', async ({ page }) => {
    await mountLinks(page)
    await page.evaluate(() => {
      window.__data.sub = [{ id: 'x', label: 'Otro' }, { label: 'Cuenta', items: [{ label: 'Más', items: [{ id: 'p', label: 'Perfil', href: '#/p', current: true }] }] }]
      window.__open.sub = true
    })
    await page.waitForTimeout(80)
    const cuenta = item(page, 'Cuenta', page.locator('#ml-sub'))
    await expect(cuenta).toHaveClass(/is-branch/)
    expect(await cuenta.getAttribute('aria-current')).toBeNull()
  })

  test('sin errores de página en el recorrido', async ({ page }) => {
    const errs = []
    page.on('pageerror', (e) => errs.push(String(e)))
    await mountLinks(page)
    await openAcc(page)
    for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Escape')
    expect(errs).toEqual([])
  })
})
