// @grana/blocks/marketing (dueño: bruno; design/contracts/blocks/_comun.md §8 «Playwright», hero.md, features.md, stats.md):
// las variantes REALES (packages/blocks/dist/marketing.js) con su banco único en packages/blocks/playground/marketing/.
// Chromium por defecto (la pasada en Firefox y WebKit, una vez al cerrar el lote). Puerto propio: GRANA_PW_PORT=4213.
//   GRANA_PW_PORT=4213 npx playwright test tests/blocks-marketing.spec.mjs --project=chromium
import { test, expect } from '@playwright/test'

const BASE = '/packages/blocks/playground/marketing/'
const PAGES = [
  { name: 'hero 01', file: 'hero.html', qs: 'v=01', h1: 1 },
  { name: 'hero 02', file: 'hero.html', qs: 'v=02', h1: 1 },
  { name: 'hero 03', file: 'hero.html', qs: 'v=03', h1: 1 },
  { name: 'features', file: 'features.html', qs: '', h1: 0, blocks: 3 },
  { name: 'stats', file: 'stats.html', qs: '', h1: 0, blocks: 3 },
  { name: 'testimonials', file: 'testimonials.html', qs: '', h1: 0, blocks: 3 },
  // CTA y FAQ, de una en una: dos CTA en la página avisan A2 (una sola por página) y tres FAQ repetirían los id de las preguntas
  { name: 'cta 01', file: 'cta.html', qs: 'v=01', h1: 0, blocks: 1 },
  { name: 'cta 02', file: 'cta.html', qs: 'v=02', h1: 0, blocks: 1 },
  { name: 'cta 03', file: 'cta.html', qs: 'v=03', h1: 0, blocks: 1 },
  { name: 'faq 01', file: 'faq.html', qs: 'v=01', h1: 0, blocks: 1 },
  { name: 'faq 02', file: 'faq.html', qs: 'v=02', h1: 0, blocks: 1 },
  { name: 'faq 03', file: 'faq.html', qs: 'v=03', h1: 0, blocks: 1 },
  { name: 'newsletter', file: 'newsletter.html', qs: '', h1: 0, blocks: 3 },
  { name: 'blog-list', file: 'blog-list.html', qs: '', h1: 0, blocks: 3 },
  // Footer: 4 bloques porque 03 lleva GbNewsletter01 en su slot `subscribe`; 02 (una línea) no tiene encabezados
  { name: 'footer', file: 'footer.html', qs: '', h1: 0, blocks: 4 }
]
const THEMES = ['defecto', 'rustico', 'lujo']

function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana /.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}
const settle = (p) => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 60)))))
async function open(page, file, qs, { width = 1440, height = 900 } = {}) {
  await page.setViewportSize({ width, height })
  await page.goto(`${BASE}${file}${qs ? `?${qs}` : ''}`)
  await page.waitForSelector('html[data-ready="1"] [data-gb]')
  await page.evaluate(() => document.fonts.ready)
  await settle(page)
}
const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
const headings = (p) => p.evaluate(() => [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((h) => Number(h.tagName[1])))

// Hallazgo B-H1 (para coco, GHero.css): `.g-hero__lead` no parte una palabra larga sin espacios (sin overflow-wrap) y
// desborda a 390 y 320 px con el banco (§7 exige esa palabra). Mientras, el reflujo del héroe se marca como fallo esperado:
// cuando GHero.css lo corrija, la prueba «pasará sin esperarlo» y habrá que quitar la marca.
const HERO_LEAD_OVERFLOW = 'B-H1: .g-hero__lead sin overflow-wrap desborda con la palabra larga del banco (GHero.css, coco)'

for (const pg of PAGES) {
  for (const tema of THEMES) {
    const qs = [pg.qs, `tema=${tema}`].filter(Boolean).join('&')
    test(`${pg.name} · ${tema}: sin desplazamiento horizontal a 1440, 390 y 320 (y 320 con texto al 200 %)`, async ({ page }) => {
      await open(page, pg.file, qs)
      if (pg.blocks) expect(await page.locator('[data-gb]').count()).toBe(pg.blocks)
      for (const [w, h] of [[1440, 900], [390, 844], [320, 640]]) {
        await page.setViewportSize({ width: w, height: h })
        await settle(page)
        expect(await overflow(page), `${w}px`).toBe(false)
      }
      await open(page, pg.file, `${qs}&zoom=2`, { width: 320, height: 640 })
      expect(await overflow(page), '320px · 200 %').toBe(false)
    })
    test(`${pg.name} · ${tema}: consola limpia (sin errores, [Vue warn] ni [Grana …]) a 1440, 390 y 320`, async ({ page }) => {
      const errs = watchConsole(page)
      for (const [w, h] of [[1440, 900], [390, 844], [320, 640]]) await open(page, pg.file, qs, { width: w, height: h })
      expect(errs).toEqual([])
    })
  }

  test(`${pg.name}: ${pg.h1 ? 'un solo h1' : 'ningún h1'} y encabezados sin saltos (también anidado en una GSection)`, async ({ page }) => {
    await open(page, pg.file, pg.qs)
    const levels = await headings(page)
    expect(levels.filter((l) => l === 1)).toHaveLength(pg.h1)
    for (let i = 1; i < levels.length; i++) expect(levels[i], `${levels.join(',')}`).toBeLessThanOrEqual(levels[i - 1] + 1)
    if (!pg.h1) {
      await open(page, pg.file, `${pg.qs}&anidado=1`)
      const nested = await page.evaluate(() => [...document.querySelectorAll('[data-gb]')].map((b) => b.querySelector('h2, h3, h4, h5, h6')).filter(Boolean).map((x) => Number(x.tagName[1]))) // (un bloque sin título, GbFooter02, no cuenta)
      expect(nested.every((l) => l === 3)).toBe(true)
    }
  })

  test(`${pg.name}: oscuro con consola limpia; con movimiento reducido nada del bloque anima`, async ({ page }) => {
    const errs = watchConsole(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, pg.file, `${pg.qs}${pg.qs ? '&' : ''}dark=1`)
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark')
    await page.waitForTimeout(400)
    const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('[data-gb]')).length)
    expect(running).toBe(0)
    expect(errs).toEqual([])
  })

  test(`${pg.name}: el foco es visible al recorrer el bloque con Tab`, async ({ page }) => {
    await open(page, pg.file, pg.qs)
    const n = await page.evaluate(() => document.querySelectorAll('[data-gb] a[href], [data-gb] button:not([disabled]), [data-gb] input, [data-gb] [tabindex="0"]').length)
    let checked = 0
    for (let i = 0; i < Math.min(n + 2, 14); i++) {
      await page.keyboard.press('Tab')
      const r = await page.evaluate(() => {
        const el = document.activeElement
        if (!el || !el.closest('[data-gb]')) return null
        const cs = getComputedStyle(el)
        const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none'
        // GCard enlace: el anillo lo pinta la tarjeta en su ::after (.g-card:has(.g-card__primary:focus-visible)::after)
        const card = el.closest('.g-card')
        const cardRing = card ? (() => { const c = getComputedStyle(card, '::after'); return (c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0) || c.boxShadow !== 'none' })() : false
        // GInput (buscador de FAQ 03): el anillo lo pinta su caja (.g-input__row/.g-input__control:has(:focus-visible))
        const boxRing = [el.closest('.g-input__control'), el.closest('.g-input__row')].some((box) => { if (!box) return false; const c = getComputedStyle(box); return (c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0) || c.boxShadow !== 'none' })
        return { tag: el.tagName, ring: ring || cardRing || boxRing }
      })
      if (r) { checked++; expect(r.ring, `${r.tag} #${i}`).toBe(true) }
    }
    if (n) expect(checked).toBeGreaterThan(0)
  })
}

for (const v of ['01', '03']) {
  test(`hero ${v}: la acción principal sin desplazar a 390×844`, async ({ page }) => {
    await open(page, 'hero.html', `v=${v}`, { width: 390, height: 844 })
    const b = await page.locator('.g-hero__actions .g-btn').first().boundingBox()
    expect(b.y + b.height).toBeLessThanOrEqual(844)
  })
}

test('hero: navigate con clic primario, la aplicación lo intercepta (preventDefault) y no navega', async ({ page }) => {
  await open(page, 'hero.html', 'v=01')
  await page.locator('.g-hero__actions a').first().click()
  expect(await page.evaluate(() => window.blockEvents)).toEqual([['navigate', '01', '#reservar']])
  expect(new URL(page.url()).hash).toBe('')
})

test('stats 02: banda de marca a sangre (g-bleed) con las cifras legibles en la zona', async ({ page }) => {
  await open(page, 'stats.html', '')
  const zone = page.locator('[data-gb="stats-02"]')
  expect(await zone.getAttribute('data-g-zone')).toBe('brand')
  const [zw, vw] = await page.evaluate(() => [document.querySelector('[data-gb="stats-02"]').getBoundingClientRect().width, document.documentElement.clientWidth])
  expect(Math.abs(zw - vw)).toBeLessThanOrEqual(1)
})

// ---------- Testimonials, CTA y FAQ (testimonials.md, cta.md, faq.md «Verificación propia») ----------

test('testimonials 01: tarjetas iguales a 1440 y una sola columna a 320', async ({ page }) => {
  await open(page, 'testimonials.html', 'v=01')
  const boxes = () => page.evaluate(() => [...document.querySelectorAll('[data-gb="testimonials-01"] [role="listitem"]')].map((li) => { const r = li.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) } }))
  const wide = await boxes()
  expect(new Set(wide.map((b) => b.w)).size, JSON.stringify(wide)).toBe(1)
  expect(new Set(wide.map((b) => b.y)).size, 'más de una por fila a 1440').toBeLessThan(wide.length)
  await page.setViewportSize({ width: 320, height: 640 })
  await settle(page)
  const narrow = await boxes()
  expect(new Set(narrow.map((b) => b.x)).size, JSON.stringify(narrow)).toBe(1)
})

test('testimonials: la cita en inglés lleva lang="en" y la fuente externa se abre en otra pestaña sin navigate', async ({ page }) => {
  await open(page, 'testimonials.html', 'v=02')
  expect(await page.locator('blockquote[lang="en"]').count()).toBe(1)
  const ext = page.locator('figcaption cite a[target="_blank"]').first()
  expect(await ext.getAttribute('aria-label')).toBe('TripAdvisor, se abre en otra pestaña')
  await page.locator('figcaption cite a[href="#opiniones-google"]').click()
  expect(await page.evaluate(() => window.blockEvents)).toEqual([['navigate', '02', '#opiniones-google']])
})

// Contraste de la acción principal sobre su fondo (canvas: cualquier sintaxis de color → sRGB)
const primaryContrast = (p, sel) => p.evaluate((sel) => {
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  const rgba = (c) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data] }
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  const btn = document.querySelector(sel)
  let el = btn, bg = rgba(getComputedStyle(el).backgroundColor)
  while (bg[3] === 0 && el.parentElement) { el = el.parentElement; bg = rgba(getComputedStyle(el).backgroundColor) }
  const fg = rgba(getComputedStyle(btn).color)
  const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x)
  return (a + 0.05) / (b + 0.05)
}, sel)

for (const tema of THEMES) {
  test(`cta 01 · ${tema}: banda de marca a sangre; la principal invertida con contraste ≥ 4,5:1 y descrita por assurance`, async ({ page }) => {
    await open(page, 'cta.html', `v=01&tema=${tema}`)
    const zone = page.locator('[data-gb="cta-01"]')
    expect(await zone.getAttribute('data-g-zone')).toBe('brand')
    const [zw, vw] = await page.evaluate(() => [document.querySelector('[data-gb="cta-01"]').getBoundingClientRect().width, document.documentElement.clientWidth])
    expect(Math.abs(zw - vw)).toBeLessThanOrEqual(1)
    const ratio = await primaryContrast(page, '[data-gb="cta-01"] .g-btn--variant-solid')
    expect(ratio, `contraste ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5)
    const id = await page.locator('[data-gb="cta-01"] .g-btn--variant-solid').getAttribute('aria-describedby')
    expect(await page.locator(`[id="${id}"]`).textContent()).toContain('Sin pago ahora')
  })
}

test('cta: las tres en la misma página avisan A2 (una sola llamada a la acción por página)', async ({ page }) => {
  const warns = []
  page.on('console', (m) => { if (m.type() === 'warning' && /\[Grana GbCta0\d\].*\(A2\)/.test(m.text())) warns.push(m.text()) })
  await open(page, 'cta.html', '')
  expect(await page.locator('[data-gb^="cta-"]').count()).toBe(3)
  expect(warns.length).toBeGreaterThan(0)
})

for (const v of ['01', '03']) {
  test(`faq ${v}: #mascotas en la URL abre esa respuesta; la búsqueda del navegador encuentra texto plegado`, async ({ page }) => {
    await open(page, 'faq.html', `v=${v}#mascotas`)
    await expect(page.locator('[id="mascotas"] [aria-expanded="true"]')).toHaveCount(1)
    expect(await page.locator('[aria-expanded="true"]').count()).toBe(1)
    // Plegada, la respuesta sigue en el documento con hidden="until-found"; un fragmento de texto la abre (beforematch)
    expect(await page.locator('[id="llegada"] [hidden="until-found"]').count()).toBe(1)
    await page.goto(`${BASE}faq.html?v=${v}#:~:text=te%20dejamos%20la%20llave`)
    await page.waitForSelector('html[data-ready="1"] [data-gb]')
    await expect(page.locator('[id="llegada"] [aria-expanded="true"]')).toHaveCount(1)
  })
}

test('faq 02: #mascotas en la URL lleva a la sección de esa pregunta', async ({ page }) => {
  await open(page, 'faq.html', 'v=02#mascotas')
  const top = await page.evaluate(() => document.getElementById('mascotas').getBoundingClientRect().top)
  expect(Math.abs(top)).toBeLessThan(80)
})

test('faq 03: buscar sin diacríticos filtra, la cuenta llega al output y el vacío devuelve el foco al campo', async ({ page }) => {
  await open(page, 'faq.html', 'v=03')
  const input = page.locator('[data-gb="faq-03"] input[type="search"]')
  await input.fill('NINO')
  await expect(page.locator('[data-gb="faq-03"] .g-accordion-item')).toHaveCount(1)
  await expect(page.locator('[data-gb="faq-03"] output')).toHaveText('1 de 8 preguntas')
  await input.fill('xyz')
  await page.locator('[data-gb="faq-03"] .g-empty button').click()
  await expect(input).toBeFocused()
  await expect(input).toHaveValue('')
  await expect(page.locator('[data-gb="faq-03"] .g-accordion-item')).toHaveCount(8)
  expect(await page.locator('[data-gb="faq-03"] [aria-expanded="true"]').count()).toBe(0)
})

// Newsletter, Blog list y Footer (bruno C; newsletter.md, blog-list.md, footer.md «Verificación propia»)
test('newsletter: campo y botón en una línea a 390; a 320 el botón no se sale de la caja', async ({ page }) => {
  for (const [w, h] of [[390, 844], [320, 640]]) {
    await open(page, 'newsletter.html', '', { width: w, height: h })
    for (const n of ['01', '02', '03']) {
      const root = page.locator(`[data-gb="newsletter-${n}"]`)
      const box = await root.locator('.g-input__box, .g-input__control').first().boundingBox()
      const btn = await root.locator('button[type="submit"]').boundingBox()
      const row = await root.locator('.g-input__row').boundingBox()
      if (w === 390) expect(Math.abs((btn.y + btn.height / 2) - (box.y + box.height / 2)), `${n} misma línea`).toBeLessThanOrEqual(2)
      expect(btn.x + btn.width, `${n} ${w}px`).toBeLessThanOrEqual(row.x + row.width + 1)
    }
    expect(await overflow(page)).toBe(false)
  }
})

test('newsletter: vacío o mal formado no envía y enseña el error en el campo; válido emite submit con el correo', async ({ page }) => {
  await open(page, 'newsletter.html', 'v=01')
  const root = page.locator('[data-gb="newsletter-01"]')
  await root.locator('button[type="submit"]').click()
  await expect(root.locator('input')).toHaveAttribute('aria-invalid', 'true')
  await expect(root.locator('input')).toBeFocused()
  await root.locator('input').fill('  ana@correo.mx ')
  await root.locator('button[type="submit"]').click()
  await expect.poll(() => page.evaluate(() => window.blockEvents)).toEqual([['submit', '01', 'ana@correo.mx']])
})

test('blog-list: la fecha es un <time datetime> en es-MX con «Actualizado …» para la nota revisada', async ({ page }) => {
  await open(page, 'blog-list.html', '')
  const times = await page.locator('[data-gb="blog-list-02"] time').evaluateAll((ts) => ts.map((t) => [t.getAttribute('datetime'), t.textContent]))
  expect(times[1]).toEqual(['2026-10-03', 'Actualizado 3 de octubre de 2026'])
  expect(times[0][1]).toMatch(/12 de junio de 2026/)
})

test('footer: dentro de GAppShell (as="div"), un solo contentinfo y ningún footer anidado; sin desbordamiento a 320', async ({ page }) => {
  const errs = watchConsole(page)
  await open(page, 'footer.html', 'shell=1', { width: 320, height: 640 })
  const snap = await page.locator('body').ariaSnapshot()
  expect(snap.match(/contentinfo/g) || []).toHaveLength(1)
  expect(await page.locator('footer footer').count()).toBe(0)
  expect(await page.locator('[data-gb="footer-01"]').evaluate((el) => el.tagName)).toBe('DIV')
  expect(await overflow(page)).toBe(false)
  const logo = await page.locator('[data-gb="footer-01"] img').boundingBox()
  expect(logo.x + logo.width).toBeLessThanOrEqual(320)
  expect(errs).toEqual([])
})

test('footer: el contacto (address) va antes que la navegación; tel:, mailto: y externos no emiten navigate', async ({ page }) => {
  await open(page, 'footer.html', 'v=01')
  const order = await page.locator('[data-gb="footer-01"]').evaluate((r) => r.querySelector('address').compareDocumentPosition(r.querySelector('nav')) & Node.DOCUMENT_POSITION_FOLLOWING)
  expect(order).toBeTruthy()
  await page.locator('[data-gb="footer-01"] a[href="/terminos"]').click()
  expect(await page.evaluate(() => window.blockEvents)).toEqual([['navigate', '01', '/terminos']])
})
