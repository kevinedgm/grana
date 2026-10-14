// GTable · activación de fila (A «la puerta» por defecto, B «despliegue» como opción) y estado de fila (#597 a #600) sobre
// el COMPONENTE REAL (packages/vue/playground/table-rows.html?c=A|B|status: dist/grana.umd.js), en Chromium, Firefox y
// WebKit. Port de la verificación de kiwi (design/lab/table/r03/verificar.mjs, A y B) y de los puntos de navegador del
// contrato (design/contracts/table.md «Pruebas (bruno)»): semántica (tabla de datos, una puerta nativa por fila, nombre =
// título, el estado la describe), prueba de impacto en el borde de la celda principal, doble clic en otra celda selecciona
// texto sin activar, Ctrl/⌘+clic no emite, rastro y foco al volver de un diálogo, despliegue y foco, Esc, orden de Tab
// (salvo WebKit), estado con forma y texto, y 360px.
// Ejecutar desde design/lab/theme-playground: GRANA_PW_PORT=4227 npx playwright test tests/table-rows.spec.mjs
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/table-rows.html'
const MOD = process.platform === 'darwin' ? 'Meta' : 'Control'

function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana/.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}
const frames = (page, n = 3) => page.evaluate((n) => new Promise((r) => { const f = (k) => (k ? requestAnimationFrame(() => f(k - 1)) : setTimeout(r, 20)); f(n) }), n)
async function open(page, c, qs = '', viewport = { width: 1200, height: 1400 }) {
  await page.setViewportSize(viewport)
  await page.goto(`${PAGE}?c=${c}${qs}`)
  await page.waitForFunction(() => window.__tb && window.__tb.ready && document.querySelector('#tb tbody tr.g-table__row'))
  await page.evaluate(() => { document.fonts.ready; document.querySelector('#tb').scrollIntoView({ block: 'start' }) })
  await frames(page)
}
const row = (i) => `#tb tbody tr.g-table__row:nth-child(${i + 1} of .g-table__row)`
const ev = (page, name) => page.evaluate((n) => window.__tb.events.value.filter((e) => e[0] === n).map((e) => e.slice(1)), name)
const clearEv = (page) => page.evaluate(() => { window.__tb.events.value = [] })
const box = (page, sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, l: r.left, r: r.right, t: r.top, b: r.bottom } }, sel)

test.describe('GTable · la puerta y el estado (comunes)', () => {
  for (const c of ['A', 'B']) {
    test(`${c}: tabla de datos sin grid ni tabindex en filas; una puerta nativa por fila con el título por nombre; el estado la describe`, async ({ page }) => {
      const errs = watchConsole(page)
      await open(page, c)
      const s = await page.evaluate(() => {
        const t = document.querySelector('#tb table')
        const rows = [...t.tBodies[0].querySelectorAll('tr.g-table__row')]
        const doors = rows.map((r) => r.querySelectorAll('.g-table__door'))
        return {
          grid: !!document.querySelector('[role="grid"],[role="treegrid"]'),
          rowTab: rows.some((r) => r.hasAttribute('tabindex')),
          one: doors.every((d) => d.length === 1),
          tags: [...new Set(doors.map((d) => d[0].tagName))],
          inTitle: doors.every((d) => d[0].parentElement.classList.contains('g-table__title')),
          names: doors.slice(0, 3).map((d) => d[0].textContent.trim()),
          described: rows.filter((r) => r.dataset.status).every((r) => { const id = r.querySelector('.g-table__door').getAttribute('aria-describedby'); const el = id && document.getElementById(id); return el && el.textContent.trim() && r.contains(el) }),
          plain: rows.filter((r) => !r.dataset.status).every((r) => !r.querySelector('.g-table__door').hasAttribute('aria-describedby')),
          noSel: !t.querySelector('[aria-selected]'),
          noMsg: !t.querySelector('tbody [role="status"], tbody [role="alert"]'),
          ids: (() => { const all = [...document.querySelectorAll('[id]')].map((e) => e.id); return all.length === new Set(all).size })()
        }
      })
      expect(s.grid || s.rowTab).toBe(false)
      expect(s.one && s.inTitle).toBe(true)
      expect(s.tags).toEqual([c === 'B' ? 'BUTTON' : 'A'])
      expect(s.names.every((n) => /^LT-\d{4}$/.test(n))).toBe(true)
      expect(s.described && s.plain && s.noSel && s.noMsg && s.ids).toBe(true)
      expect(errs).toEqual([])
    })

    test(`${c}: la casilla y el menú no activan; arrastrar para seleccionar texto no activa`, async ({ page }) => {
      await open(page, c)
      await clearEv(page)
      await page.click(`${row(0)} .g-table__select input`)
      await page.click(`${row(0)} .mas`)
      const b = await box(page, `${row(0)} td:nth-child(3)`)
      await page.mouse.move(b.l + 4, b.y); await page.mouse.down(); await page.mouse.move(b.r - 4, b.y, { steps: 6 }); await page.mouse.up()
      const sel = await page.evaluate(() => String(getSelection()).trim())
      expect(sel.length).toBeGreaterThan(0)
      expect(await ev(page, 'navigate')).toEqual([])
      expect(await ev(page, 'update:expanded')).toEqual([])
      expect(await page.evaluate(() => document.querySelector('#dlg').open)).toBe(false)
    })
  }

  test('estado: lomo con forma distinta por valor y las columnas no se mueven', async ({ page }) => {
    await open(page, 'A')
    const s = await page.evaluate(() => {
      const out = {}
      for (const st of ['error', 'warning', 'info']) {
        const tr = document.querySelector(`#tb tr[data-status="${st}"]`)
        if (tr) out[st] = getComputedStyle(tr.querySelector('td')).borderInlineStartStyle
      }
      const xs = [...document.querySelectorAll('#tb tbody tr.g-table__row')].map((r) => Math.round(r.cells[1].getBoundingClientRect().left))
      return { out, aligned: new Set(xs).size === 1, has: document.querySelector('#tb').classList.contains('has-row-status') }
    })
    expect(s.has && s.aligned).toBe(true)
    expect(new Set(Object.values(s.out)).size).toBe(Object.keys(s.out).length)
    expect(Object.values(s.out).every((v) => v !== 'none' && v !== 'hidden')).toBe(true)
  })

  test('estado: sello en la causa (la etiqueta en la celda de su columna, con texto)', async ({ page }) => {
    await open(page, 'status')
    const s = await page.evaluate(() => {
      const tr = document.querySelector('#tb tr[data-status="warning"]')
      const td = tr.querySelector('td.g-table__cell--cause')
      return { status: td && td.dataset.status, text: td && td.querySelector('.g-table__status')?.textContent.trim(), title: !!tr.querySelector('td.g-table__cell--primary .g-table__status') }
    })
    expect(s.status).toBe('warning')
    expect(s.text).toMatch(/^Caduca en \d+ días$/)
    expect(s.title).toBe(false)
  })
})

test.describe('GTable · A · la puerta', () => {
  test('clic fuera de la celda principal no activa; doble clic en otra celda selecciona una palabra sin activar', async ({ page }) => {
    await open(page, 'A')
    await clearEv(page)
    await page.click(`${row(1)} td:nth-child(5)`)
    const b = await box(page, `${row(1)} td:nth-child(3)`)
    await page.mouse.dblclick(b.l + 24, b.y)
    const sel = await page.evaluate(() => String(getSelection()).trim())
    expect(sel.length).toBeGreaterThan(0)
    expect(await ev(page, 'navigate')).toEqual([])
    expect(await page.evaluate(() => document.querySelector('#dlg').open)).toBe(false)
  })

  test('el borde de la celda principal es la puerta (prueba de impacto) y abre el detalle; al volver, foco en la puerta, rastro e is-here', async ({ page }) => {
    await open(page, 'A')
    const b = await box(page, `${row(1)} td.g-table__cell--primary`)
    const hit = await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest('.g-table__door'), [b.r - 6, b.b - 4])
    expect(hit).toBe(true)
    await page.mouse.click(b.r - 6, b.b - 4)
    expect(await page.evaluate(() => document.querySelector('#dlg').open)).toBe(true)
    const nav = await ev(page, 'navigate')
    expect(nav[0]).toEqual(['LT-0002', '#lote/LT-0002'])
    expect(await ev(page, 'update:lastOpened')).toEqual([['LT-0002']])
    await page.keyboard.press('Escape')
    await page.waitForTimeout(60)
    const after = await page.evaluate((s) => { const tr = document.querySelector(s); return { focus: document.activeElement === tr.querySelector('.g-table__door'), last: tr.classList.contains('is-last-opened'), here: tr.classList.contains('is-here') } }, row(1))
    expect(after).toEqual({ focus: true, last: true, here: true })
  })

  test(`${MOD}+clic, Mayús+clic y clic central en la puerta no emiten navigate (#505)`, async ({ page, context }) => {
    await open(page, 'A')
    context.on('page', (p) => p.close().catch(() => {}))
    await clearEv(page)
    await page.click(`${row(0)} .g-table__door`, { modifiers: [MOD] })
    await page.click(`${row(0)} .g-table__door`, { modifiers: ['Shift'] })
    await page.click(`${row(0)} .g-table__door`, { button: 'middle' })
    await page.waitForTimeout(300)
    expect(await ev(page, 'navigate')).toEqual([])
    expect(await page.evaluate(() => document.querySelector('#dlg').open)).toBe(false)
  })

  test('Intro en la puerta abre; con foco de teclado el anillo rodea la celda y la flecha asoma', async ({ page }) => {
    await open(page, 'A')
    await page.focus(`${row(2)} .g-table__door`)
    await page.keyboard.press('Enter')
    expect(await page.evaluate(() => document.querySelector('#dlg').open)).toBe(true)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(350)
    const s = await page.evaluate((r) => {
      const tr = document.querySelector(r)
      const td = tr.querySelector('td.g-table__cell--primary')
      const cs = getComputedStyle(td)
      const ring = cs.outlineStyle !== 'none' || cs.boxShadow !== 'none' || getComputedStyle(td, '::after').outlineStyle !== 'none' || getComputedStyle(tr.querySelector('.g-table__door'), '::after').outlineStyle !== 'none'
      return { ring, arrow: Number(getComputedStyle(tr.querySelector('.g-table__door-arrow')).opacity) }
    }, row(2))
    expect(s.ring).toBe(true)
    expect(s.arrow).toBeGreaterThan(0.9)
  })

  test('volver de una ruta: montar con lastOpened y su fila a la vista la ilumina', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 1400 })
    await page.goto(`${PAGE}?c=A&last=LT-0003`)
    await page.waitForFunction(() => window.__tb && window.__tb.ready)
    await frames(page, 2)
    const s = await page.evaluate((r) => { const tr = document.querySelector(r); return [tr.classList.contains('is-last-opened'), tr.classList.contains('is-here')] }, row(2))
    expect(s).toEqual([true, true])
  })
})

test.describe('GTable · B · despliegue', () => {
  test('clic en la fila despliega con el foco en la puerta; doble clic deja la ficha abierta', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page, 'B')
    await page.click(`${row(0)} td:nth-child(4)`)
    await frames(page, 4)
    const s = await page.evaluate((r) => {
      const tr = document.querySelector(r)
      const d = tr.querySelector('.g-table__door')
      const det = tr.nextElementSibling
      return { exp: d.getAttribute('aria-expanded'), ctl: d.getAttribute('aria-controls') === det.querySelector('.g-table__detail-body').id, det: det.classList.contains('g-table__detail'), focus: document.activeElement === d }
    }, row(0))
    expect(s).toEqual({ exp: 'true', ctl: true, det: true, focus: true })
    await page.dblclick(`${row(1)} td:nth-child(4)`)
    await page.waitForTimeout(500)
    expect(await page.evaluate(() => window.__tb.expanded.value)).toEqual(['LT-0001', 'LT-0002'])
    expect(errs).toEqual([])
  })

  test('Esc dentro de la ficha la pliega y devuelve el foco a la puerta; Intro abre y Espacio cierra', async ({ page }) => {
    await open(page, 'B')
    await page.click(`${row(0)} .g-table__door`)
    await page.waitForSelector('#tb tr.g-table__detail.is-open')
    await page.focus('#tb tr.g-table__detail .abrir')
    await page.keyboard.press('Escape')
    await page.waitForFunction(() => !document.querySelector('#tb tr.g-table__detail'), null, { timeout: 3000 })
    expect(await page.evaluate((r) => document.activeElement === document.querySelector(`${r} .g-table__door`), row(0))).toBe(true)
    await page.keyboard.press('Enter')
    await page.waitForSelector('#tb tr.g-table__detail.is-open')
    await page.keyboard.press('Space')
    await page.waitForFunction(() => !document.querySelector('#tb tr.g-table__detail'), null, { timeout: 3000 })
  })

  test('orden de Tab: puerta → acciones de la fila → ficha', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'WebKit sin «acceso total por teclado» no da Tab a enlaces ni botones')
    await open(page, 'B')
    await page.click(`${row(0)} .g-table__door`)
    await page.waitForSelector('#tb tr.g-table__detail.is-open')
    await page.focus(`${row(0)} .g-table__door`)
    const order = []
    for (let i = 0; i < 3; i++) { await page.keyboard.press('Tab'); order.push(await page.evaluate(() => document.activeElement.className.split(' ')[0])) }
    expect(order).toEqual(['mas', 'abrir', 'baja'])
  })

  test('cambiar de página depura expanded', async ({ page }) => {
    await open(page, 'B')
    await page.click(`${row(0)} .g-table__door`)
    await page.waitForSelector('#tb tr.g-table__detail.is-open')
    await page.evaluate(() => { window.__tb.page.value = 2 })
    await frames(page, 3)
    expect(await page.evaluate(() => window.__tb.expanded.value)).toEqual([])
  })

  test('movimiento reducido: la ficha se abre y se cierra sin transición', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, 'B')
    await page.click(`${row(0)} .g-table__door`)
    await page.waitForSelector('#tb tr.g-table__detail.is-open')
    const td = await page.evaluate(() => getComputedStyle(document.querySelector('#tb .g-table__detail-body')).transitionDuration)
    expect(td.split(',').every((d) => parseFloat(d) === 0)).toBe(true)
  })
})

test.describe('GTable · activación de fila en 360px', () => {
  for (const c of ['A', 'B']) {
    test(`${c}: tarjetas sin desborde`, async ({ page }) => {
      await open(page, c, '', { width: 360, height: 760 })
      const s = await page.evaluate(() => ({ cards: document.querySelector('#tb').classList.contains('g-table--mode-cards'), over: document.documentElement.scrollWidth - document.documentElement.clientWidth }))
      expect(s.cards).toBe(true)
      expect(s.over).toBeLessThanOrEqual(0)
    })
  }
})
