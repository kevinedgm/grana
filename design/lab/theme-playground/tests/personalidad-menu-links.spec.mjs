// GMenu · personalidad de los elementos-enlace: B · pie de destino (#578) y C · varias pestañas (#577); decisión del usuario
// B + C (#571). Traslado de las partes B y C de design/lab/menu/r02/verificar.mjs al GMenu REAL del UMD (window.Grana).
// Datos de bruno: g-menu__dest (+ is-empty) con host, ruta y etiqueta del activo de M1; g-menu__trace; is-modifier;
// anuncio por el canal cortés de página (.g-load-live, #533). Estética (contraste, alto, pegado abajo): GMenu.css (coco).
import { test, expect } from '@playwright/test'
import { mountLinks, acc, openAcc, isOpen, navs, item, hoverOn, modKey, contrastOf } from './menu-links-helpers.mjs'

test.setTimeout(90_000)

const dest = (p, root = '#ml-account') => p.evaluate((root) => {
  const d = document.querySelector(`${root} .g-menu__list > .g-menu__dest`)
  if (!d) return null
  const t = (c) => d.querySelector(c).textContent
  return { empty: d.classList.contains('is-empty'), host: t('.g-menu__dest-host'), path: t('.g-menu__dest-path'), tag: t('.g-menu__dest-tag'), icon: !!d.querySelector('.g-menu__dest-icon svg'), last: d === d.parentElement.lastElementChild, hidden: d.getAttribute('aria-hidden'), role: d.getAttribute('role') }
}, root)

test.describe('GMenu · B pie de destino', () => {
  test('solo en la lista que sale de la aplicación; último hijo, fuera del árbol accesible', async ({ page }) => {
    await mountLinks(page)
    await openAcc(page)
    await page.evaluate(() => { window.__open.file = true }); await page.waitForTimeout(80)
    const d = await dest(page)
    expect(d).toMatchObject({ last: true, hidden: 'true', role: 'none' })
    expect(await dest(page, '#ml-file')).toBeNull()
  })

  test('en un submenú que sale lo lleva el submenú y no su padre', async ({ page }) => {
    await mountLinks(page)
    await page.locator('#ml-sub .ml-trigger').focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(60)
    await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(120)
    const r = await page.evaluate(() => {
      const root = document.querySelector('#ml-sub .g-menu__list')
      const sub = root.querySelector('[role="menu"]')
      return { root: !!root.querySelector(':scope > .g-menu__dest'), sub: !!sub?.querySelector(':scope > .g-menu__dest') }
    })
    expect(r).toEqual({ root: false, sub: true })
    const d = await page.evaluate(() => document.querySelector('#ml-sub [role="menu"] [role="menu"] > .g-menu__dest, #ml-sub .g-menu__list [role="menu"] > .g-menu__dest').querySelector('.g-menu__dest-host').textContent)
    expect(d).toBe('example.org')
  })

  test('contenido por caso; sigue al teclado y al puntero; el alto de la lista no cambia', async ({ page }) => {
    await mountLinks(page)
    await openAcc(page)
    const h0 = await page.evaluate(() => document.querySelector('#ml-account .g-menu__list').offsetHeight)
    expect(await dest(page)).toMatchObject({ empty: false, host: '', path: '#/perfil', tag: '', icon: false })
    await hoverOn(page, 'Documentación')
    expect(await dest(page)).toMatchObject({ empty: false, host: 'example.org', path: '/docs/grana/menu', tag: 'Pestaña nueva', icon: true })
    await hoverOn(page, 'Estado del servicio')
    expect(await dest(page)).toMatchObject({ empty: false, host: 'status.example.org', path: '', tag: 'Otro sitio', icon: true })
    await hoverOn(page, 'Invitar al equipo')
    expect((await dest(page)).empty).toBe(true)
    await page.keyboard.press('End'); await page.waitForTimeout(40)
    expect(await dest(page)).toMatchObject({ empty: false, path: '#/salir' })
    await page.keyboard.press('ArrowUp'); await page.waitForTimeout(40) // casilla
    expect((await dest(page)).empty).toBe(true)
    await page.keyboard.press('ArrowUp'); await page.waitForTimeout(40) // deshabilitado
    expect((await dest(page)).empty).toBe(true)
    expect(await page.evaluate(() => document.querySelector('#ml-account .g-menu__list').offsetHeight)).toBe(h0)
  })

  test('mailto: el href tal cual; dominio internacional en punycode', async ({ page }) => {
    await mountLinks(page)
    await page.evaluate(() => {
      window.__data.file = [{ id: 'm', label: 'Escribir', href: 'mailto:hola@example.org', external: true }, { id: 'n', label: 'Muñeca', href: 'https://muñeca.example/ruta', external: true }]
      window.__open.file = true
    })
    await page.waitForTimeout(100)
    const fileItem = (l) => item(page, l, page.locator('#ml-file'))
    await fileItem('Escribir').hover(); await page.waitForTimeout(40)
    expect(await dest(page, '#ml-file')).toMatchObject({ host: '', path: 'mailto:hola@example.org' })
    await fileItem('Muñeca').hover(); await page.waitForTimeout(40)
    const d = await dest(page, '#ml-file')
    expect(d.host.startsWith('xn--')).toBe(true)
    expect(d.path).toBe('/ruta')
  })

  test('pegado al borde inferior con la lista desplazada; texto ≥ 12px y ≥ 4.5:1 sobre el pie', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 420 })
    await mountLinks(page)
    await openAcc(page)
    await hoverOn(page, 'Documentación')
    await page.evaluate(() => { const l = document.querySelector('#ml-account .g-menu__list'); l.scrollTop = l.scrollHeight })
    await page.waitForTimeout(60)
    const m = await page.evaluate(() => {
      const l = document.querySelector('#ml-account .g-menu__list'); const d = l.querySelector(':scope > .g-menu__dest')
      const lr = l.getBoundingClientRect(); const dr = d.getBoundingClientRect()
      return { gap: Math.abs(lr.bottom - l.clientTop - dr.bottom), fs: parseFloat(getComputedStyle(d).fontSize), host: getComputedStyle(d.querySelector('.g-menu__dest-host')).color, path: getComputedStyle(d.querySelector('.g-menu__dest-path')).color, bg: getComputedStyle(d).backgroundColor }
    })
    expect(m.gap).toBeLessThanOrEqual(2)
    expect(m.fs).toBeGreaterThanOrEqual(12)
    expect(await contrastOf(page, m.host, m.bg)).toBeGreaterThanOrEqual(4.5)
    expect(await contrastOf(page, m.path, m.bg)).toBeGreaterThanOrEqual(4.5)
  })

  test('RTL: la URL del pie se lee en LTR', async ({ page }) => {
    await mountLinks(page, { dir: 'rtl' })
    await openAcc(page)
    await hoverOn(page, 'Documentación')
    const d = await page.evaluate(() => ['host', 'path'].map((p) => getComputedStyle(document.querySelector(`#ml-account .g-menu__dest-${p}`)).direction))
    expect(d).toEqual(['ltr', 'ltr'])
  })
})

test.describe('GMenu · C varias pestañas', () => {
  const traceOf = (p, l) => item(p, l).locator('.g-menu__trace').textContent()
  const live = (p) => p.evaluate(() => document.querySelector('.g-load-live')?.textContent || '')

  test('Ctrl/⌘+clic y clic central: sigue abierto, huella «Abierta», un anuncio; sin navigate', async ({ page }) => {
    await mountLinks(page)
    await openAcc(page)
    await item(page, 'Ajustes').click({ modifiers: ['ControlOrMeta'] }); await page.waitForTimeout(250)
    await page.bringToFront()
    expect(await isOpen(page)).toBe(true)
    expect(await traceOf(page, 'Ajustes')).toBe('Abierta')
    await page.waitForTimeout(120)
    expect(await live(page)).toBe('Ajustes abierta en otra pestaña')
    await item(page, 'Mi perfil').click({ button: 'middle' }); await page.waitForTimeout(250)
    await page.bringToFront()
    expect(await isOpen(page)).toBe(true)
    expect(await traceOf(page, 'Mi perfil')).toBe('Abierta')
    expect(await navs(page)).toEqual([])
  })

  test('Ctrl/⌘+Intro: sigue abierto con huella (Chromium abre la pestaña en segundo plano)', async ({ page, browserName }) => {
    await mountLinks(page)
    await openAcc(page)
    await page.keyboard.press('ArrowDown')
    const pages0 = page.context().pages().length
    await page.keyboard.press('ControlOrMeta+Enter'); await page.waitForTimeout(250)
    await page.bringToFront()
    expect(await navs(page)).toEqual([])
    if (browserName === 'chromium') {
      expect(page.context().pages().length).toBeGreaterThan(pages0)
      expect(await isOpen(page)).toBe(true)
      expect(await traceOf(page, 'Ajustes')).toBe('Abierta')
    }
  })

  test('sin opened/openedLive, Ctrl/⌘+clic cierra (E6)', async ({ page }) => {
    await mountLinks(page, { labels: { external: ', otro sitio', newTab: ', abre en una pestaña nueva', destExternal: 'Otro sitio', destNewTab: 'Pestaña nueva', copied: 'Enlace copiado', copiedLive: 'Enlace de {label} copiado' } })
    await openAcc(page)
    await item(page, 'Ajustes').click({ modifiers: ['ControlOrMeta'] }); await page.waitForTimeout(250)
    await page.bringToFront()
    expect(await isOpen(page)).toBe(false)
  })

  test('is-modifier con Ctrl/⌘ pulsado; fuera con keyup y al cerrar; la acción apartada sigue ≥ 4.5:1', async ({ page, browserName }) => {
    await mountLinks(page)
    await openAcc(page)
    const k = modKey(browserName)
    await page.keyboard.down(k); await page.waitForTimeout(40)
    const on = await page.evaluate(() => document.querySelector('#ml-account .g-menu__list').classList.contains('is-modifier'))
    const c = await page.evaluate(() => {
      const l = document.querySelector('#ml-account .g-menu__list')
      return { fg: getComputedStyle(l.querySelector('button.g-menu__item:not([aria-disabled])')).color, bg: getComputedStyle(l).backgroundColor }
    })
    await page.keyboard.up(k); await page.waitForTimeout(40)
    const off = await page.evaluate(() => document.querySelector('#ml-account .g-menu__list').classList.contains('is-modifier'))
    expect(on).toBe(true)
    expect(off).toBe(false)
    expect(await contrastOf(page, c.fg, c.bg)).toBeGreaterThanOrEqual(4.5)
    await page.keyboard.down(k); await page.keyboard.up(k)
    await page.keyboard.down(k)
    await page.evaluate(() => { window.__open.account = false }); await page.waitForTimeout(40)
    await page.keyboard.up(k)
  })

  test('Ctrl/⌘+C copia la URL absoluta con huella y anuncio al resolverse; con texto seleccionado no; al cerrar se borran las huellas', async ({ page, browserName }) => {
    if (browserName === 'chromium') await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
    await mountLinks(page)
    if (browserName !== 'chromium') {
      await page.evaluate(() => {
        window.__copied = null
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: (t) => { window.__copied = t; return Promise.resolve() } } })
      })
    }
    await openAcc(page)
    await hoverOn(page, 'Estado del servicio')
    await page.keyboard.press('ControlOrMeta+c'); await page.waitForTimeout(150)
    const copied = browserName === 'chromium' ? await page.evaluate(() => navigator.clipboard.readText()) : await page.evaluate(() => window.__copied)
    expect(copied).toBe('https://status.example.org/')
    expect(await traceOf(page, 'Estado del servicio')).toBe('Enlace copiado')
    expect(await live(page)).toContain('Enlace de Estado del servicio copiado')
    // Con texto seleccionado no se intercepta
    await page.evaluate(() => { const p = document.createElement('p'); p.id = 'ml-sel'; p.textContent = 'texto'; document.body.append(p); getSelection().selectAllChildren(p) })
    await hoverOn(page, 'Ajustes')
    const prevented = await page.evaluate(() => { const e = new KeyboardEvent('keydown', { key: 'c', ctrlKey: true, metaKey: true, bubbles: true, cancelable: true }); document.activeElement.dispatchEvent(e); return e.defaultPrevented })
    expect(prevented).toBe(false)
    await page.keyboard.press('Escape'); await page.waitForTimeout(60)
    await openAcc(page)
    const traces = await page.evaluate(() => [...document.querySelectorAll('#ml-account .g-menu__trace')].map((t) => t.textContent))
    expect(traces.every((t) => t === '')).toBe(true)
  })
})
