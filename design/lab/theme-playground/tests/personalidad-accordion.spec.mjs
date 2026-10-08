// Personalidad de GAccordion (A «Avance», #475 y #483) sobre el componente real, en Chromium, Firefox y WebKit, en el banco
// ligero packages/vue/playground/accordion.html (mismo marcado y datos que #sec-accordion; accordion-data.js):
//  - A2 · la línea que no se mueve: la primera línea del contenido y el avance, Δ ≤ 1 px en cada cuadro al abrir y al cerrar;
//  - la primera línea está entera antes de la mitad del fundido del avance (retraso fast / 3 + fast / 2);
//  - en ajustes, el avance sigue al estado;
//  - nada se anima al montar (is-ready tras el primer pintado; lo que viene abierto no se desenrolla).
// Un solo proceso por puerto: GRANA_PW_PORT=4214 (bruno de GAccordion).
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/accordion.html'

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
async function open(page, { motion = 'no-preference' } = {}) {
  await page.emulateMedia({ reducedMotion: motion })
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto(PAGE)
  await page.waitForSelector('#faq-cambiar.is-ready')
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
  await page.evaluate(() => document.fonts.ready)
  await page.mouse.move(2, 2)
}
const ms = (v) => (String(v).trim().endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000)

// Cuadro a cuadro desde el clic: posición de la primera línea del contenido frente al avance y alto del contenido
async function track(page, id, frames = 30) {
  return page.evaluate(([id, n]) => new Promise((resolve) => {
    const it = document.getElementById(id)
    const peek = document.getElementById(`${id}-peek`)
    const content = document.getElementById(`${id}-content`)
    const first = content.querySelector('.g-accordion-item__body > p')
    // Inicio del texto del avance (su caja lleva la sangría de lectura, --_inset, como el cuerpo del contenido)
    const b0 = peek.getBoundingClientRect()
    const p0 = { top: b0.top + parseFloat(getComputedStyle(peek).paddingBlockStart), left: b0.left + parseFloat(getComputedStyle(peek).paddingInlineStart) }
    const out = []
    const t0 = performance.now()
    const f = () => {
      const r = first.getBoundingClientRect()
      out.push({ t: Math.round(performance.now() - t0), dy: Math.abs(r.top - p0.top), dx: Math.abs(r.left - p0.left), h: content.getBoundingClientRect().height, op: parseFloat(getComputedStyle(peek).opacity) })
      if (out.length < n) requestAnimationFrame(() => setTimeout(f, 0))
      else resolve({ out, line: parseFloat(getComputedStyle(first).lineHeight), fast: getComputedStyle(it).getPropertyValue('--g-duration-fast') })
    }
    document.getElementById(`${id}-toggle`).click()
    requestAnimationFrame(() => setTimeout(f, 0))
  }), [id, frames])
}

test.describe('GAccordion · personalidad (A «Avance»)', () => {
  test('la línea que no se mueve: primera línea del contenido sobre el avance, Δ ≤ 1 px por cuadro al abrir y al cerrar', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    await page.evaluate(() => { const r = document.getElementById('faq-cambiar').getBoundingClientRect(); window.scrollBy(0, r.top - 200) })
    const opening = await track(page, 'faq-cambiar')
    // Mientras el contenido tiene alto (la primera línea existe en pantalla), coincide con el avance
    const visibleO = opening.out.filter((x) => x.h > 0)
    expect(visibleO.length).toBeGreaterThan(2)
    expect(Math.max(...visibleO.map((x) => Math.max(x.dy, x.dx))), JSON.stringify(visibleO.slice(0, 6))).toBeLessThanOrEqual(1)
    await page.waitForFunction(() => !document.getElementById('faq-cambiar').classList.contains('is-animating'))
    const closing = await track(page, 'faq-cambiar')
    const visibleC = closing.out.filter((x) => x.h > 0)
    expect(Math.max(...visibleC.map((x) => Math.max(x.dy, x.dx)))).toBeLessThanOrEqual(1)
    await page.waitForFunction(() => document.getElementById('faq-cambiar-content').getAttribute('hidden') === 'until-found')
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('la primera línea está entera antes de la mitad del fundido del avance', async ({ page }) => {
    await open(page)
    await page.evaluate(() => { const r = document.getElementById('faq-documentos').getBoundingClientRect(); window.scrollBy(0, r.top - 200) })
    const r = await track(page, 'faq-documentos', 20)
    const fast = ms(r.fast)
    const half = fast / 3 + fast / 2
    // Primer cuadro con la línea entera: con cuadros de la máquina (a veces largos) se exige que el cuadro anterior aún
    // estuviera dentro del plazo o que el avance siga opaco a más de la mitad cuando la línea ya está entera
    const k = r.out.findIndex((x) => x.h >= r.line - 0.5)
    expect(k, JSON.stringify(r.out.slice(0, 8))).toBeGreaterThanOrEqual(0)
    const full = r.out[k]
    expect(full.t <= half || full.op >= 0.5, `entera a los ${full.t} ms (mitad del fundido: ${half} ms), opacidad del avance ${full.op}`).toBe(true)
  })

  test('ajustes: el avance sigue al estado y el contador del meta también', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    await page.click('#set-notif-toggle')
    await page.waitForFunction(() => !document.getElementById('set-notif').classList.contains('is-animating'))
    await expect(page.locator('#set-notif-peek')).toHaveText('Correo y push · resumen semanal')
    await page.click('#set-notif-content .g-switch input >> nth=0', { force: true })
    await expect(page.locator('#set-notif-peek')).toHaveText('push · resumen semanal')
    await expect(page.locator('#set-notif .g-accordion-item__meta')).toHaveText('2 activas')
    await page.click('#set-notif-reset')
    await expect(page.locator('#set-notif-peek')).toHaveText('Correo y push · resumen semanal')
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('nada se anima al montar: lo que viene abierto no se desenrolla y el chevron ya está girado', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.addInitScript(() => {
      window.__mountAnims = []
      document.addEventListener('transitionrun', (e) => { if (e.target.closest && e.target.closest('.g-accordion-item')) window.__mountAnims.push(`${e.target.className} ${e.propertyName}`) }, true)
    })
    await page.goto(PAGE)
    await page.waitForSelector('#faq-cambiar.is-ready')
    await page.waitForTimeout(300)
    expect(await page.evaluate(() => window.__mountAnims)).toEqual([])
    const r = await page.evaluate(() => ({
      h: document.getElementById('faq-resultados-content').getBoundingClientRect().height,
      rot: getComputedStyle(document.querySelector('#faq-resultados .g-accordion-item__chevron > .g-icon')).rotate
    }))
    expect(r.h).toBeGreaterThan(40)
    expect(r.rot).toBe('90deg')
  })
})
