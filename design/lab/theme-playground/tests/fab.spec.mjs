// GFab (design/contracts/fab.md «Verificación · Playwright»; DECISIONS.md #654 a #671) sobre el COMPONENTE REAL (entrada
// @grana/vue/fab por dist/fab.umd.js, global GranaFab) en la sección #sec-fab del playground: su propia aplicación de Vue,
// configurada por la URL (?fab=N, fabmain, fabpos, fabanchor, fabappearance, fabrtl, fabcoarse). Por defecto el FAB vive en
// un marco de 720 × 480 (anchor="container"); con fabanchor=viewport, fijo al visor con GToaster real en el mismo borde.
// En Chromium, Firefox y WebKit. Un solo proceso por puerto: GRANA_PW_PORT=4212 (bruno de GFab).
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/index.html'

function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon|Failed to load resource/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Grana GFab\]|\[Vue warn\]/.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}
const settle = (p) => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 30)))))
async function load(page, qs = '', { width = 1280, height = 900, motion = 'no-preference' } = {}) {
  await page.emulateMedia({ reducedMotion: motion })
  await page.setViewportSize({ width, height })
  await page.goto(`${PAGE}?${qs}`)
  await page.waitForSelector('#fab')
  await page.evaluate(() => document.fonts.ready)
  if (!/fabanchor=viewport/.test(qs)) {
    await page.evaluate(() => document.getElementById('fab-frame').scrollIntoView({ block: 'center', behavior: 'instant' }))
  }
  await settle(page)
}
// Abre y espera a que termine la entrada (≤ 240 ms con el tema por defecto)
async function openFab(page, how = 'click') {
  if (how === 'click') await page.click('#fab-trigger')
  else { await page.focus('#fab-trigger'); await page.keyboard.press(how) }
  await page.waitForFunction(() => document.getElementById('fab').dataset.state === 'open')
  await page.waitForTimeout(300)
}
const rect = (p, sel) => p.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height } }, sel)
const labels = (p, sel = '#fab-menu') => p.evaluate((sel) => [...document.querySelectorAll(`${sel} [role="menuitem"]`)].filter((b) => !b.closest('[hidden]')).map((b) => (b.querySelector('.g-fab__label') || b).textContent.trim()), sel)
const activeText = (p) => p.evaluate(() => (document.activeElement.querySelector('.g-fab__label') || document.activeElement).textContent.trim())
const state = (p) => p.evaluate(() => document.getElementById('fab').dataset.state)
const events = (p, type = 'select') => p.evaluate((type) => window.fabEvents.filter((e) => e.type === type), type)
const itemRect = (p, label) => p.evaluate((label) => {
  const b = [...document.querySelectorAll('#fab-menu .g-fab__item')].find((x) => x.querySelector('.g-fab__label').textContent.trim() === label)
  const r = b.getBoundingClientRect()
  return { top: r.top, bottom: r.bottom, left: r.left, right: r.right }
}, label)
const hit = (a, b) => a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom - 0.5 && a.bottom > b.top + 0.5

test.describe('GFab · forma y semántica (#654, #660, #665)', () => {
  test('1 acción: el FAB es la acción (sin haspopup); un toque la ejecuta', async ({ page }) => {
    const errs = watchConsole(page)
    await load(page, 'fab=1')
    await expect(page.locator('#fab')).toHaveAttribute('data-appearance', 'single')
    await expect(page.locator('#fab-trigger')).not.toHaveAttribute('aria-haspopup', /.*/)
    await expect(page.getByRole('button', { name: 'Nueva muestra' })).toBeVisible()
    await page.click('#fab-trigger')
    expect((await events(page)).map((e) => e.id)).toEqual(['sample'])
    expect(errs).toEqual([])
  })

  test('3 acciones: pila con la primera pegada al FAB, menú con li role=none, foco en la primera', async ({ page }) => {
    const errs = watchConsole(page)
    await load(page, 'fab=3')
    const t = page.locator('#fab-trigger')
    await expect(t).toHaveAttribute('aria-haspopup', 'menu')
    await expect(t).toHaveAccessibleName('Crear y capturar')
    await openFab(page)
    await expect(t).toHaveAttribute('aria-expanded', 'true')
    expect(await labels(page)).toEqual(['Vaciar borradores', 'Tomar foto', 'Nueva muestra'])
    expect(await activeText(page)).toBe('Nueva muestra')
    expect(await page.evaluate(() => {
      const m = document.getElementById('fab-menu')
      return m.getAttribute('role') === 'menu' && m.getAttribute('aria-labelledby') === 'fab-trigger' && [...m.children].every((li) => li.getAttribute('role') === 'none')
    })).toBe(true)
    // La primera, pegada al FAB: la más baja, sobre él
    const near = await itemRect(page, 'Nueva muestra')
    const fab = await rect(page, '#fab-trigger')
    expect(near.bottom).toBeLessThanOrEqual(fab.top)
    expect(fab.top - near.bottom).toBeLessThan(20)
    expect(errs).toEqual([])
  })

  test('6, 10 y 15: 4 píldoras + «Más acciones (N)» y las cuatro primeras no se mueven (Δ ≤ 0,5px)', async ({ page }) => {
    const errs = watchConsole(page)
    await load(page, 'fab=6')
    const at = {}
    for (const n of [6, 10, 15]) {
      await page.selectOption('#fab-n', String(n))
      await settle(page)
      await openFab(page)
      const more = page.locator('#fab-menu .g-fab__item--more')
      await expect(more).toHaveText(`Más acciones (${n - 4})`)
      await expect(more).toHaveAttribute('aria-haspopup', 'menu')
      await expect(more).toHaveAttribute('aria-controls', 'fab-more')
      at[n] = {}
      for (const l of ['Nueva muestra', 'Tomar foto', 'Dictar nota', 'Subir archivo']) at[n][l] = await itemRect(page, l)
      await page.keyboard.press('Escape')
      await page.waitForFunction(() => document.getElementById('fab').dataset.state === 'closed')
    }
    for (const n of [10, 15]) {
      for (const l of Object.keys(at[6])) {
        expect(Math.abs(at[n][l].top - at[6][l].top), `${l} con ${n}`).toBeLessThanOrEqual(0.5)
        expect(Math.abs(at[n][l].left - at[6][l].left), `${l} con ${n}`).toBeLessThanOrEqual(0.5)
      }
    }
    expect(errs).toEqual([])
  })

  test('la pila queda dentro del marco con margen ≥ 8px y sin solapes; la cola abre el panel agrupado', async ({ page }) => {
    const errs = watchConsole(page)
    await load(page, 'fab=15')
    await openFab(page)
    const frame = await rect(page, '#fab-frame')
    const fab = await rect(page, '#fab-trigger')
    const pills = await page.evaluate(() => [...document.querySelectorAll('#fab-menu > li')].map((li) => { const r = li.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right } }))
    for (const r of pills) {
      expect(r.top - frame.top).toBeGreaterThanOrEqual(8)
      expect(frame.right - r.right).toBeGreaterThanOrEqual(8)
      expect(hit(r, fab)).toBe(false)
    }
    for (let i = 1; i < pills.length; i++) expect(hit(pills[i - 1], pills[i])).toBe(false)
    await page.click('#fab-menu .g-fab__item--more')
    await page.waitForTimeout(300)
    await expect(page.locator('#fab-menu .g-fab__item--more')).toHaveAttribute('aria-expanded', 'true')
    expect(await activeText(page)).toBe('Programar toma')
    const panel = await rect(page, '#fab-more')
    expect(panel.left - frame.left).toBeGreaterThanOrEqual(8)
    expect(frame.right - panel.right).toBeGreaterThanOrEqual(8)
    expect(panel.top - frame.top).toBeGreaterThanOrEqual(8)
    expect(hit(panel, fab)).toBe(false)
    expect(await page.evaluate(() => [...document.querySelectorAll('#fab-more ul[role="group"]')].map((g) => document.getElementById(g.getAttribute('aria-labelledby')).textContent))).toEqual(['Exportar', 'Compartir', 'Organizar', 'Mantenimiento'])
    // ← vuelve a la cola; Esc cierra el panel y luego la lista
    await page.keyboard.press('ArrowLeft')
    await expect(page.locator('#fab-menu .g-fab__item--more')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(page.locator('#fab-trigger')).toBeFocused()
    expect(errs).toEqual([])
  })

  test('appearance="panel" y C: panel con grupos; C filtra al escribir sin campo', async ({ page }) => {
    const errs = watchConsole(page)
    await load(page, 'fab=15&fabmain=1')
    await expect(page.locator('#fab')).toHaveAttribute('data-appearance', 'main')
    await expect(page.getByRole('group', { name: 'Crear y capturar' })).toBeVisible()
    await openFab(page)
    await expect(page.locator('#fab-menu .g-fab__find')).toHaveText('Escribe para buscar')
    expect(await page.locator('#fab-menu [role="textbox"], #fab-menu input').count()).toBe(0)
    await page.keyboard.type('exp')
    await expect(page.locator('#fab-menu .g-fab__find-count')).toHaveText('1 acción')
    expect(await labels(page)).toEqual(['Exportar CSV'])
    expect(await activeText(page)).toBe('Exportar CSV')
    await page.keyboard.press('z')
    await expect(page.locator('#fab-menu .g-fab__find')).toHaveClass(/is-empty-result/)
    expect(await labels(page)).toEqual(['Exportar CSV'])
    await page.keyboard.press('Escape')
    expect((await labels(page)).length).toBe(14)
    await page.keyboard.press('Escape')
    await expect(page.locator('#fab-trigger')).toBeFocused()
    // La principal ejecuta a un toque
    await page.getByRole('button', { name: 'Nueva muestra' }).click()
    expect((await events(page)).map((e) => e.id)).toEqual(['sample'])
    expect(errs).toEqual([])
  })
})

test.describe('GFab · teclado, foco y una activación por gesto (#660, #661)', () => {
  test('Intro abre en la primera; ↓ (la contraria) en la más lejana; Esc devuelve el foco; Tab sigue desde el FAB', async ({ page }) => {
    const errs = watchConsole(page)
    await load(page, 'fab=6')
    await openFab(page, 'Enter')
    expect(await activeText(page)).toBe('Nueva muestra')
    await page.keyboard.press('ArrowUp')
    expect(await activeText(page)).toBe('Tomar foto')
    await page.keyboard.press('Escape')
    await expect(page.locator('#fab-trigger')).toBeFocused()
    await openFab(page, 'ArrowDown')
    expect(await activeText(page)).toBe('Más acciones (2)')
    await page.keyboard.press('Tab')
    await page.waitForFunction(() => document.getElementById('fab').dataset.state === 'closed')
    expect(await page.evaluate(() => document.getElementById('fab').contains(document.activeElement))).toBe(false)
    expect(errs).toEqual([])
  })

  test('clic fuera cierra sin robar el foco; Esc con el foco en body también cierra', async ({ page }) => {
    await load(page, 'fab=6')
    await openFab(page)
    await page.click('#fab-n')
    await page.waitForFunction(() => document.getElementById('fab').dataset.state === 'closed')
    await expect(page.locator('#fab-n')).toBeFocused()
    await openFab(page)
    await page.evaluate(() => document.activeElement.blur())
    await page.keyboard.press('Escape')
    await page.waitForFunction(() => document.getElementById('fab').dataset.state === 'closed')
  })

  test('doble clic en el FAB: abre y el segundo clic no cierra; Intro mantenido no repite la acción', async ({ page }) => {
    await load(page, 'fab=6')
    await page.dblclick('#fab-trigger')
    await page.waitForTimeout(300)
    expect(await state(page)).toBe('open')
    await page.keyboard.press('Escape')
    await page.waitForFunction(() => document.getElementById('fab').dataset.state === 'closed')
    await page.focus('#fab-trigger')
    await page.keyboard.down('Enter')
    await page.keyboard.down('Enter')
    await page.keyboard.down('Enter')
    await page.keyboard.up('Enter')
    await page.waitForTimeout(300)
    expect(await events(page)).toEqual([])
    expect(await state(page)).toBe('open')
  })
})

test.describe('GFab · confirmación en el sitio y acuse (#662, #663, #669)', () => {
  test('la peligrosa se parte en «Cancelar» bajo el puntero + «Vaciar»; un doble clic no ejecuta; con teclado, una vez', async ({ page }) => {
    const errs = watchConsole(page)
    await load(page, 'fab=3')
    await openFab(page)
    const danger = page.locator('#fab-menu .g-fab__item--danger')
    await danger.dblclick({ position: { x: 20, y: 10 } })
    await page.waitForTimeout(200)
    const pair = page.getByRole('group', { name: '¿Vaciar los 12 borradores?' })
    await expect(pair).toBeVisible()
    expect(await events(page)).toEqual([])
    await expect(page.locator('#fab-menu .g-fab__cancel')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(pair).toHaveCount(0)
    expect(await activeText(page)).toBe('Vaciar borradores')
    await page.keyboard.press('Enter')
    await expect(page.locator('#fab-menu .g-fab__cancel')).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('#fab-menu .g-fab__confirm-action')).toBeFocused()
    await page.keyboard.press('Enter')
    await page.waitForTimeout(200)
    expect((await events(page)).map((e) => e.id)).toEqual(['purge'])
    expect(errs).toEqual([])
  })

  test('acuse: en curso y fallo en la raíz y en el elemento; reintentar lleva retry; hecho con su texto como detail', async ({ page }) => {
    const errs = watchConsole(page)
    await load(page, 'fab=10')
    await openFab(page)
    await page.click('#fab-menu .g-fab__item:has-text("Tomar foto")')
    await expect(page.locator('#fab')).toHaveAttribute('data-ack', 'busy')
    await expect(page.locator('#fab .g-fab__badge svg')).toHaveCount(1)
    await expect(page.locator('#fab')).toHaveAttribute('data-ack', 'failed', { timeout: 3000 })
    await openFab(page)
    const photo = page.locator('#fab-menu .g-fab__item', { hasText: 'Tomar foto' })
    await expect(photo).toHaveAttribute('data-ack', 'failed')
    await expect(photo.locator('.g-fab__reason')).toHaveText('Sin conexión')
    await expect(photo).not.toHaveAttribute('aria-disabled', /.*/)
    await photo.click()
    expect((await events(page)).map((e) => e.retry)).toEqual([false, true])
    await page.waitForFunction(() => document.getElementById('fab').dataset.state === 'closed')
    expect(errs).toEqual([])
  })

  test('acuse hecho: Exportar CSV (en el panel de la cola) pone la insignia «hecho» y su texto como detail del FAB', async ({ page }) => {
    const errs = watchConsole(page)
    await load(page, 'fab=10')
    await openFab(page)
    await page.click('#fab-menu .g-fab__item--more')
    await page.waitForTimeout(300)
    await page.click('#fab-more .g-fab__item:has-text("Exportar CSV")')
    await expect(page.locator('#fab')).toHaveAttribute('data-ack', 'busy')
    await expect(page.locator('#fab')).toHaveAttribute('data-ack', 'done', { timeout: 3000 })
    const detail = await page.evaluate(() => { const t = document.getElementById('fab-trigger'); return (t.getAttribute('aria-describedby') || '').split(' ').map((id) => document.getElementById(id)?.textContent).join('|') })
    expect(detail).toContain('CSV exportado')
    expect(errs).toEqual([])
  })
})

test.describe('GFab · en el visor: bordes, se aparta, velo y estrecho (#659, #664, #668)', () => {
  test('publica su reserva: un aviso de GToaster queda por encima del FAB', async ({ page }) => {
    const errs = watchConsole(page)
    await load(page, 'fab=6&fabanchor=viewport')
    await page.evaluate(() => window.toaster.show({ title: 'Guardado', duration: Infinity }))
    await page.waitForSelector('.g-toast')
    await page.waitForTimeout(400)
    const toast = await rect(page, '.g-toast')
    const fab = await rect(page, '#fab-trigger')
    if (toast.top > 450) expect(toast.bottom).toBeLessThanOrEqual(fab.top + 0.5)
    expect(errs).toEqual([])
  })

  test('se aparta del foco con 24px visibles, cubre ≤ 5 % y nunca el centro; el primer clic solo lo devuelve', async ({ page }) => {
    const errs = watchConsole(page)
    await load(page, 'fab=6&fabanchor=viewport')
    await page.evaluate(() => {
      const a = document.createElement('a')
      a.href = '#x'
      a.id = 'under'
      a.textContent = 'Fila bajo el FAB'
      Object.assign(a.style, { position: 'fixed', right: '16px', bottom: '20px', width: '600px', height: '44px', display: 'block', background: 'transparent' })
      document.body.append(a)
    })
    await page.focus('#under')
    await expect(page.locator('#fab')).toHaveClass(/is-tucked/)
    await page.waitForTimeout(300)
    const fab = await rect(page, '#fab-trigger')
    const vw = await page.evaluate(() => document.documentElement.clientWidth)
    expect(vw - fab.left).toBeGreaterThanOrEqual(23.5)
    expect(vw - fab.left).toBeLessThanOrEqual(26)
    const u = await rect(page, '#under')
    const ox = Math.max(0, Math.min(fab.right, u.right) - Math.max(fab.left, u.left))
    const oy = Math.max(0, Math.min(fab.bottom, u.bottom) - Math.max(fab.top, u.top))
    expect((ox * oy) / (u.width * u.height)).toBeLessThanOrEqual(0.05)
    const cx = (u.left + u.right) / 2
    expect(cx < fab.left || cx > fab.right).toBe(true)
    await page.mouse.click(fab.left + 10, fab.top + fab.height / 2)
    await page.waitForTimeout(300)
    await expect(page.locator('#fab')).not.toHaveClass(/is-tucked/)
    expect(await state(page)).toBe('closed')
    await page.click('#fab-trigger')
    await page.waitForFunction(() => document.getElementById('fab').dataset.state !== 'closed')
    expect(errs).toEqual([])
  })

  test('320px: abrir la lista no añade desplazamiento horizontal; el panel de la cola ocupa el ancho menos los márgenes', async ({ page }) => {
    const errs = watchConsole(page)
    await load(page, 'fab=15&fabanchor=viewport', { width: 320, height: 640 })
    // El playground entero desborda a 320px (su índice y sus demos); lo que se mide es que el FAB no añada nada
    const sw = () => page.evaluate(() => document.documentElement.scrollWidth)
    const base = await sw()
    await openFab(page)
    expect(await sw()).toBeLessThanOrEqual(base)
    const vw = await page.evaluate(() => document.documentElement.clientWidth)
    for (const r of await page.evaluate(() => [...document.querySelectorAll('#fab-menu > li')].map((li) => li.getBoundingClientRect().right))) expect(r).toBeLessThanOrEqual(vw - 8)
    await page.click('#fab-menu .g-fab__item--more')
    await page.waitForTimeout(300)
    const panel = await rect(page, '#fab-more')
    expect(panel.left).toBeGreaterThanOrEqual(15.5)
    expect(vw - panel.right).toBeGreaterThanOrEqual(15.5)
    expect(await sw()).toBeLessThanOrEqual(base)
    expect(errs).toEqual([])
  })

  // #687: el panel de la cola que cubre la pila nunca es más estrecho que ella (nada de la pila asoma, texto incluido)
  for (const [w, h] of [[1000, 420], [320, 420]]) {
    test(`el panel que cubre la pila la contiene con una etiqueta larga a ${w}px (#687); no sale del visor`, async ({ page }) => {
      const errs = watchConsole(page)
      await load(page, 'fab=15&fabanchor=viewport&fablong=1', { width: w, height: h })
      await openFab(page)
      await page.click('#fab-menu .g-fab__item--more')
      await page.waitForTimeout(300)
      expect(await page.evaluate(() => document.getElementById('fab-more').style.getPropertyValue('--_minh'))).not.toBe('')
      const vw = await page.evaluate(() => document.documentElement.clientWidth)
      const panel = await rect(page, '#fab-more')
      const stack = await rect(page, '#fab-menu')
      expect(panel.left).toBeLessThanOrEqual(stack.left + 0.5)
      expect(panel.right).toBeGreaterThanOrEqual(stack.right - 0.5)
      for (const r of await page.evaluate(() => [...document.querySelectorAll('#fab-menu > li')].flatMap((li) => [...li.querySelectorAll('*')].concat(li).map((e) => { const b = e.getBoundingClientRect(); return { left: b.left, right: b.right, w: b.width } })))) {
        if (r.w === 0) continue
        expect(r.left).toBeGreaterThanOrEqual(panel.left - 0.5)
        expect(r.right).toBeLessThanOrEqual(panel.right + 0.5)
      }
      expect(panel.left).toBeGreaterThanOrEqual(-0.5)
      expect(panel.right).toBeLessThanOrEqual(vw + 0.5)
      expect(errs).toEqual([])
    })
  }

  test('sin cubrir, el panel de la cola mide lo de siempre aunque la pila sea más ancha (#687)', async ({ page }) => {
    const errs = watchConsole(page)
    await load(page, 'fab=15&fabanchor=viewport&fablong=1', { width: 1000, height: 900 })
    await openFab(page)
    await page.click('#fab-menu .g-fab__item--more')
    await page.waitForTimeout(300)
    expect(await page.evaluate(() => document.getElementById('fab-more').style.getPropertyValue('--_minh'))).toBe('')
    const space = await page.evaluate(() => parseFloat(getComputedStyle(document.getElementById('fab')).getPropertyValue('--g-space-1')) || 4)
    const panel = await rect(page, '#fab-more')
    expect(Math.abs(panel.width - space * 80)).toBeLessThanOrEqual(0.5)
    expect(errs).toEqual([])
  })

  test('velo táctil: tocar fuera cierra sin seguir el enlace de debajo y el foco vuelve al FAB; ventana en px enteros', async ({ browser, browserName }) => {
    test.skip(browserName === 'firefox', 'Firefox no emula el toque (hasTouch); el velo se mide en Chromium y WebKit')
    const ctx = await browser.newContext({ viewport: { width: 390, height: 760 }, hasTouch: true, baseURL: test.info().project.use.baseURL })
    const page = await ctx.newPage()
    const errs = watchConsole(page)
    await page.goto(`${PAGE}?fab=6&fabanchor=viewport&fabcoarse=1`)
    await page.waitForSelector('#fab')
    await page.evaluate(() => document.fonts.ready)
    await page.tap('#fab-trigger')
    await page.waitForFunction(() => document.getElementById('fab').dataset.state === 'open')
    await page.waitForTimeout(300)
    const holes = await page.evaluate(() => { const s = document.querySelector('#fab .g-fab__scrim'); return ['x', 'y', 'w', 'h'].map((k) => s.style.getPropertyValue(`--_hole-${k}`)) })
    for (const v of holes) expect(v).toMatch(/^-?\d+px$/)
    const before = await page.evaluate(() => location.hash)
    await page.touchscreen.tap(60, 200)
    await page.waitForFunction(() => document.getElementById('fab').dataset.state === 'closed')
    expect(await page.evaluate(() => location.hash)).toBe(before)
    await expect(page.locator('#fab-trigger')).toBeFocused()
    expect(errs).toEqual([])
    await ctx.close()
  })
})

test.describe('GFab · RTL y movimiento reducido', () => {
  test('RTL: bottom-end va a la izquierda del marco y la pila con él', async ({ page }) => {
    await load(page, 'fab=3&fabrtl=1')
    const frame = await rect(page, '#fab-frame')
    const fab = await rect(page, '#fab-trigger')
    expect(fab.left - frame.left).toBeLessThan(30)
    await openFab(page)
    const near = await itemRect(page, 'Nueva muestra')
    expect(near.left - frame.left).toBeLessThan(40)
  })

  test('movimiento reducido: las píldoras sin translate ni recorte al abrir', async ({ page }) => {
    await load(page, 'fab=6', { motion: 'reduce' })
    await openFab(page)
    const s = await page.evaluate(() => [...document.querySelectorAll('#fab-menu > li')].map((li) => { const c = getComputedStyle(li); return `${c.translate}|${c.clipPath}` }))
    for (const v of s) expect(v).toBe('none|none')
  })
})
