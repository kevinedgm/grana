// Panel estable al desplazar la página (reporte del usuario sobre GCombobox, c4b087d: el panel «pivotea, tintinea,
// parpadea»). Las mismas reglas de utils/anchor.js en GSelect, GMenu, GDatePicker, GHelper y el editor de GFilterBar, sobre
// el COMPONENTE REAL del playground (packages/vue/playground) en Chromium, Firefox y WebKit:
//   1. el lado se decide al abrir y se conserva (GSelect, GMenu, GDatePicker: solo cambia si el actual baja de space × 40
//      y el otro ofrece space × 12 más; GHelper: mientras el contenido quepa entero en él);
//   2. --_max se fija al abrir; durante el desplazamiento solo se mueve la posición (alto del panel constante);
//   3. si el ancla sale del visor, el panel se cierra (sin devolver el foco).
// Cada caso abre el panel a 2px del cruce del criterio anterior (que decidía el lado en cada evento de scroll) y desplaza
// la página de 4 en 4px, ida y vuelta ±20px: 0 cambios de lado, alto constante y el panel pegado a su ancla.
// GSelect además: el puntero quieto en el borde inferior de la lista no la desplaza (16 cuadros); el teclado sí.
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/index.html'

async function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errs.push(`console: ${m.text()}`) })
  return errs
}
async function ready(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto(PAGE)
  await page.waitForSelector('.g-btn')
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(300)
}
const frames = (page, n = 2) => page.evaluate((n) => new Promise((r) => { let i = 0; const f = () => (++i >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f) }), n)

// Lleva el borde inferior (o superior) del ancla a la coordenada pedida del visor
async function anchorAt(page, sel, edge, y) {
  const d = await page.evaluate(({ sel, edge, y }) => {
    const r = document.querySelector(sel).getBoundingClientRect()
    const before = scrollY
    scrollBy(0, r[edge] - y)
    return { moved: scrollY - before, want: r[edge] - y }
  }, { sel, edge, y })
  expect(Math.abs(d.moved - d.want), 'la página tiene recorrido para colocar el ancla').toBeLessThan(1)
  await frames(page)
}

// Vaivén de 4px: 5 pasos hacia abajo, 10 hacia arriba, 10 hacia abajo y 5 hacia arriba (±20px alrededor del cruce)
async function sway(page, read) {
  const trace = [await read()]
  for (const d of [...Array(5).fill(4), ...Array(10).fill(-4), ...Array(10).fill(4), ...Array(5).fill(-4)]) {
    await page.evaluate((d) => new Promise((r) => { scrollBy(0, d); requestAnimationFrame(() => requestAnimationFrame(r)) }), d)
    trace.push(await read())
  }
  return trace
}
function expectStable(trace) {
  expect(trace.every((t) => t.open), 'el panel sigue abierto en todo el recorrido').toBe(true)
  const sides = trace.map((t) => t.side)
  expect([...new Set(sides)], `lado en cada paso: ${sides.join(' ')}`).toHaveLength(1)
  const hs = trace.map((t) => t.h)
  expect([...new Set(hs)], `alto del panel en cada paso: ${hs.join(' ')}`).toHaveLength(1)
  if (trace[0].max !== undefined) expect([...new Set(trace.map((t) => t.max))], '--_max constante').toHaveLength(1)
  // Pegado a su ancla: la misma separación en cada paso (la posición sí se actualiza en cada cuadro)
  const gaps = trace.map((t) => t.gap)
  expect(gaps.every((g) => g >= 0 && g <= 24 && Math.abs(g - gaps[0]) < 1), `separación con el ancla en cada paso: ${gaps.join(' ')}`).toBe(true)
}

test.describe('panel estable al desplazar la página (GSelect, GMenu, GDatePicker, GHelper, GFilterBar)', () => {
  test('GSelect · 0 cambios de lado y alto constante en el vaivén; el puntero quieto no desplaza la lista', async ({ page }) => {
    const errs = await watchConsole(page)
    await ready(page)
    const combo = page.getByRole('combobox', { name: /Muchas opciones/ })
    const id = await combo.getAttribute('id')
    const box = `#${id}`
    const read = () => page.evaluate((id) => {
      const l = document.getElementById(`${id}-list`)
      const c = document.getElementById(id).closest('.g-select__control').getBoundingClientRect()
      const p = l.getBoundingClientRect()
      const up = l.classList.contains('is-up')
      const gap = Math.round((up ? c.top - p.bottom : p.top - c.bottom) * 10) / 10
      return { open: l.matches(':popover-open'), side: up ? 'top' : 'bottom', h: Math.round(p.height * 2) / 2, max: l.style.getPropertyValue('--_max'), gap }
    }, id)
    // Cruce del criterio anterior con 40 opciones (más altas que el visor): el mismo sitio arriba que abajo
    const h = await page.evaluate((box) => document.querySelector(box).closest('.g-select__control').getBoundingClientRect().height, box)
    await anchorAt(page, `${box}`, 'top', (900 - h) / 2 + 2)
    await combo.click()
    await frames(page, 3)
    const trace = await sway(page, read)
    expectStable(trace)

    // Puntero quieto en el borde inferior de la lista: scrollTop no cambia en 16 cuadros. WebKit no enfoca un botón al
    // hacer clic (como Safari): el teclado se prueba con el foco puesto en la caja
    await combo.focus()
    await page.keyboard.press('Escape')
    await expect(combo).toHaveAttribute('aria-expanded', 'false')
    await anchorAt(page, box, 'top', 120)
    await combo.click()
    await frames(page, 3)
    const edge = await page.evaluate((id) => { const r = document.getElementById(`${id}-list`).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.bottom - 6 } }, id)
    await page.mouse.move(edge.x - 3, edge.y - 2)
    await page.mouse.move(edge.x, edge.y)
    const tops = await page.evaluate((id) => new Promise((resolve) => {
      const l = document.getElementById(`${id}-list`); const out = []
      const tick = () => { out.push(l.scrollTop); out.length < 16 ? requestAnimationFrame(tick) : resolve(out) }
      requestAnimationFrame(tick)
    }), id)
    expect([...new Set(tops)], 'scrollTop de la lista con el puntero quieto').toHaveLength(1)
    const act = await combo.getAttribute('aria-activedescendant')
    expect(act, 'el puntero sí activa la opción bajo él').not.toBe(`${id}-opt-0`)
    // El teclado sí lleva la activa a la vista
    await combo.focus()
    await page.keyboard.press('End')
    await frames(page)
    expect(await page.evaluate((id) => document.getElementById(`${id}-list`).scrollTop, id)).toBeGreaterThan(tops[0])
    await page.keyboard.press('Escape')
    expect(errs, errs.join('\n')).toEqual([])
  })

  // Safari/WebKit no enfocan un botón al hacer clic: sin foco en el disparador, Esc, Inicio y Fin no llegaban. Aquí NO se
  // enfoca nada a mano: se abre con clic de puntero y el teclado actúa sobre lo que el navegador deje enfocado.
  test('GSelect · abierto con clic de puntero, Fin/Inicio mueven la activa y Esc cierra la lista (sin enfocar a mano)', async ({ page }) => {
    const errs = await watchConsole(page)
    await ready(page)
    const combo = page.getByRole('combobox', { name: /Muchas opciones/ })
    await combo.scrollIntoViewIfNeeded()
    await combo.click()
    await frames(page, 3)
    await expect(combo).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('End')
    await frames(page)
    const last = await combo.getAttribute('aria-activedescendant')
    await page.keyboard.press('Home')
    await frames(page)
    const first = await combo.getAttribute('aria-activedescendant')
    expect(last, 'Fin llega a la lista').not.toBe(first)
    await page.keyboard.press('Escape')
    await frames(page)
    await expect(combo).toHaveAttribute('aria-expanded', 'false')
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('GDatePicker · abierto con clic de puntero, Esc cierra el selector (sin enfocar a mano)', async ({ page }) => {
    const errs = await watchConsole(page)
    await ready(page)
    const f = page.locator('.g-datepicker', { hasText: 'Fecha de entrega' }).locator('button.g-datepicker__field').first()
    const popId = await f.getAttribute('aria-controls')
    await f.scrollIntoViewIfNeeded()
    await f.click()
    await frames(page, 4)
    const open = () => page.evaluate((id) => document.getElementById(id).matches(':popover-open'), popId)
    expect(await open(), 'abierto').toBe(true)
    await page.keyboard.press('Escape')
    await frames(page)
    expect(await open(), 'Esc lo cierra').toBe(false)
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('GMenu · 0 cambios de lado y alto constante en el vaivén', async ({ page }) => {
    const errs = await watchConsole(page)
    await ready(page)
    const trig = '#pg-ic-menu-trigger'
    const read = () => page.evaluate(() => {
      const l = document.getElementById('pg-ic-menu-list')
      if (!l) return { open: false }
      const a = document.getElementById('pg-ic-menu-trigger').getBoundingClientRect()
      const p = l.getBoundingClientRect()
      const top = l.dataset.side === 'top'
      const gap = Math.round((top ? a.top - p.bottom : p.top - a.bottom) * 10) / 10
      return { open: l.matches(':popover-open'), side: l.dataset.side, h: Math.round(p.height * 2) / 2, max: l.style.getPropertyValue('--_max'), gap }
    })
    // Alto natural de la lista (como lo mide GMenu: scrollHeight + 4)
    await anchorAt(page, trig, 'top', 120)
    await page.click(trig)
    await frames(page, 3)
    const natural = await page.evaluate(() => document.getElementById('pg-ic-menu-list').scrollHeight + 4)
    await page.keyboard.press('Escape')
    await frames(page)
    // Cruce del criterio anterior: debajo quedan natural − 2px (se abría arriba y volvía abajo al pasar el cruce)
    await anchorAt(page, trig, 'bottom', 900 - 12 - natural + 2)
    await page.click(trig)
    await frames(page, 3)
    const trace = await sway(page, read)
    expect(trace[0].side).toBe('top')
    expectStable(trace)
    await page.keyboard.press('Escape')
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('GDatePicker · 0 cambios de lado y alto constante en el vaivén', async ({ page }) => {
    const errs = await watchConsole(page)
    await ready(page)
    const field = page.locator('.g-datepicker', { hasText: 'Fecha de entrega' }).locator('button.g-datepicker__field').first()
    const id = await field.getAttribute('id')
    const pop = await field.getAttribute('aria-controls')
    const read = () => page.evaluate(({ id, pop }) => {
      const l = document.getElementById(pop)
      const a = document.getElementById(id).getBoundingClientRect()
      const p = l.getBoundingClientRect()
      const up = l.classList.contains('is-up')
      const gap = Math.round((up ? a.top - p.bottom : p.top - a.bottom) * 10) / 10
      return { open: l.matches(':popover-open'), side: up ? 'top' : 'bottom', h: Math.round(p.height * 2) / 2, max: l.style.getPropertyValue('--_max'), gap }
    }, { id, pop })
    await anchorAt(page, `#${id}`, 'top', 120)
    await field.click()
    await frames(page, 3)
    const natural = await page.evaluate((pop) => document.getElementById(pop).offsetHeight, pop)
    await page.keyboard.press('Escape')
    await frames(page)
    await anchorAt(page, `#${id}`, 'bottom', 900 - 8 - natural + 2)
    await field.click()
    await frames(page, 3)
    const trace = await sway(page, read)
    expect(trace[0].side).toBe('top')
    expectStable(trace)
    await page.keyboard.press('Escape')
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('GHelper · 0 cambios de lado (se conserva mientras quepa) y alto constante en el vaivén', async ({ page }) => {
    const errs = await watchConsole(page)
    await ready(page)
    const trigger = page.getByRole('button', { name: 'Abrir ayuda' }).first()
    await trigger.evaluate((el) => { el.id = el.id || 'pw-helper-trigger' })
    const tid = await trigger.getAttribute('id')
    const content = await trigger.getAttribute('aria-controls')
    const read = () => page.evaluate(({ tid, content }) => {
      const l = document.getElementById(content)
      const a = document.getElementById(tid).getBoundingClientRect()
      const p = l.getBoundingClientRect()
      const side = l.dataset.side
      const gap = Math.round((side === 'top' ? a.top - p.bottom : side === 'bottom' ? p.top - a.bottom : 0) * 10) / 10
      return { open: l.matches(':popover-open'), side, h: Math.round(p.height * 2) / 2, gap }
    }, { tid, content })
    await anchorAt(page, `#${tid}`, 'top', 120)
    await trigger.click()
    await frames(page, 3)
    const m = await page.evaluate(({ content }) => {
      const l = document.getElementById(content)
      // Margen y separación de GHelper: space × 2 (space en rem se pasa a px)
      const v = getComputedStyle(l.closest('.g-helper') || l).getPropertyValue('--g-space-1').trim()
      const space = /rem$/.test(v) ? parseFloat(v) * parseFloat(getComputedStyle(document.documentElement).fontSize) : parseFloat(v)
      return { h: l.offsetHeight, side: l.dataset.side, pad: space * 2 }
    }, { content })
    expect(m.side).toBe('bottom')
    await page.keyboard.press('Escape')
    await frames(page)
    // Cruce del criterio anterior: el contenido deja de caber debajo por 2px (se abría arriba y volvía abajo al caber)
    await anchorAt(page, `#${tid}`, 'bottom', 900 - m.pad - m.h - m.pad + 2)
    await trigger.click()
    await frames(page, 3)
    const trace = await sway(page, read)
    expect(trace[0].side).toBe('top')
    expectStable(trace)
    await page.keyboard.press('Escape')
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('GFilterBar (editor) · sigue a su ancla en el vaivén: mismo lado, alto y --_max constantes', async ({ page }) => {
    const errs = await watchConsole(page)
    await ready(page)
    const chip = page.locator('.g-filter-bar__suggest').first()
    await chip.evaluate((el) => { el.id = el.id || 'pw-filter-chip' })
    const read = () => page.evaluate(() => {
      const a = document.getElementById('pw-filter-chip')
      const l = a.closest('.g-filter-bar').querySelector('.g-filter-bar__editor')
      const r = a.getBoundingClientRect()
      const p = l.getBoundingClientRect()
      const top = p.bottom <= r.top
      const gap = Math.round((top ? r.top - p.bottom : p.top - r.bottom) * 10) / 10
      return { open: l.matches(':popover-open'), side: top ? 'top' : 'bottom', h: Math.round(p.height * 2) / 2, max: l.style.getPropertyValue('--_max'), gap }
    })
    await anchorAt(page, '#pw-filter-chip', 'top', 200)
    await chip.click()
    await frames(page, 3)
    const trace = await sway(page, read)
    expectStable(trace)
    await page.keyboard.press('Escape')
    expect(errs, errs.join('\n')).toEqual([])
  })

  // Regla 3: si el ancla sale del visor, el panel se cierra (sin devolver el foco: la página no vuelve atrás). Con el ancla
  // a 120px del borde superior, se desplaza hasta dejarla a 2px de salir (sigue abierto) y luego 8px más (se cierra).
  const CASES = [
    {
      name: 'GSelect',
      open: async (page) => { const c = page.getByRole('combobox', { name: /Muchas opciones/ }); await c.click(); return `#${await c.getAttribute('id')}` },
      anchor: (sel) => `document.querySelector('${sel}').closest('.g-select__control')`,
      isOpen: (sel) => `document.getElementById(document.querySelector('${sel}').id + '-list').matches(':popover-open')`
    },
    {
      name: 'GMenu',
      open: async (page) => { await page.click('#pg-ic-menu-trigger'); return '#pg-ic-menu-trigger' },
      anchor: (sel) => `document.querySelector('${sel}')`,
      isOpen: () => `Boolean(document.getElementById('pg-ic-menu-list')?.matches(':popover-open'))`
    },
    {
      name: 'GDatePicker',
      open: async (page) => {
        const f = page.locator('.g-datepicker', { hasText: 'Fecha de entrega' }).locator('button.g-datepicker__field').first()
        await f.click()
        return `#${await f.getAttribute('id')}`
      },
      anchor: (sel) => `document.querySelector('${sel}')`,
      isOpen: (sel) => `document.getElementById(document.querySelector('${sel}').getAttribute('aria-controls')).matches(':popover-open')`
    },
    {
      name: 'GHelper',
      open: async (page) => {
        const t = page.getByRole('button', { name: 'Abrir ayuda' }).first()
        await t.evaluate((el) => { el.id = el.id || 'pw-helper-trigger' })
        await t.click()
        return `#${await t.getAttribute('id')}`
      },
      anchor: (sel) => `document.querySelector('${sel}')`,
      isOpen: (sel) => `document.getElementById(document.querySelector('${sel}').getAttribute('aria-controls')).matches(':popover-open')`
    },
    {
      name: 'GFilterBar (editor)',
      open: async (page) => {
        const chip = page.locator('.g-filter-bar__suggest').first()
        await chip.evaluate((el) => { el.id = el.id || 'pw-filter-chip' })
        await chip.click()
        return `#${await chip.getAttribute('id')}`
      },
      anchor: (sel) => `document.querySelector('${sel}')`,
      isOpen: (sel) => `Boolean(document.querySelector('${sel}').closest('.g-filter-bar').querySelector('.g-filter-bar__editor')?.matches(':popover-open'))`
    }
  ]
  for (const c of CASES) {
    test(`${c.name} · si el ancla sale del visor, el panel se cierra (en el borde aún no) y el foco no desplaza la página`, async ({ page }) => {
      const errs = await watchConsole(page)
      await ready(page)
      // Coloca primero (el selector existe antes de abrir) y abre con el ancla a 120px del borde superior
      const sel = await c.open(page)
      await page.keyboard.press('Escape')
      await frames(page)
      // WebKit no enfoca un botón al hacer clic (como Safari): si Esc no llegó, se cierra desde el ancla enfocada
      if (await page.evaluate((code) => new Function(`return ${code}`)(), c.isOpen(sel))) {
        await page.focus(sel)
        await page.keyboard.press('Escape')
        await frames(page)
      }
      expect(await page.evaluate((code) => new Function(`return ${code}`)(), c.isOpen(sel)), 'cerrado antes de colocar').toBe(false)
      await page.evaluate((code) => { const a = new Function(`return ${code}`)(); scrollBy(0, a.getBoundingClientRect().top - 120) }, c.anchor(sel))
      await frames(page)
      await c.open(page)
      await frames(page, 3)
      const isOpen = () => page.evaluate((code) => new Function(`return ${code}`)(), c.isOpen(sel))
      expect(await isOpen(), 'abierto').toBe(true)
      const bottom = await page.evaluate((code) => new Function(`return ${code}`)().getBoundingClientRect().bottom, c.anchor(sel))
      await page.evaluate((d) => new Promise((r) => { scrollBy(0, d); requestAnimationFrame(() => requestAnimationFrame(r)) }), bottom - 2)
      expect(await isOpen(), 'con el ancla a 2px de salir sigue abierto').toBe(true)
      await page.evaluate(() => new Promise((r) => { scrollBy(0, 8); requestAnimationFrame(() => requestAnimationFrame(r)) }))
      await frames(page, 2)
      expect(await isOpen(), 'con el ancla fuera del visor se cierra').toBe(false)
      const y = await page.evaluate(() => scrollY)
      await frames(page, 4)
      expect(await page.evaluate(() => scrollY), 'cerrar no devuelve el foco ni desplaza la página').toBe(y)
      expect(errs, errs.join('\n')).toEqual([])
    })
  }
})
