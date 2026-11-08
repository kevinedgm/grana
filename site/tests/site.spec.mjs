// Pruebas de navegador del sitio de documentación (build + `vitepress preview`, puerto 4219 o GRANA_SITE_PORT).
//   cd site && npm run docs:build && npx playwright test --project=chromium
// El marco es Grana (theme/Layout.vue, design/contracts/sitio-marco.md): GAppShell, GSidebar con filtro, GPageHeader con
// GPageIndex, GBreadcrumbs, menús de idioma y tema. Las pruebas del marco están al final («marco: …»).
import { test, expect } from '@playwright/test'

const PAGES = ['components/btn', 'components/tag', 'components/combobox', 'components/form', 'components/table']

/** Recoge errores y avisos de consola y errores de página. */
function watchConsole(page) {
  const problems = []
  page.on('console', async (m) => {
    if (m.type() !== 'error' && m.type() !== 'warning') return
    // Avisos del propio navegador (Firefox: «scroll-linked positioning effect»), no de la página.
    if (/^\[JavaScript Warning:/.test(m.text())) return
    let text = m.text()
    if (/JSHandle@/.test(text)) text = (await Promise.all(m.args().map((a) => a.evaluate((v) => (v instanceof Error ? v.stack || v.message : String(v))).catch(() => '?')))).join(' ')
    problems.push(`${m.type()}: ${page.url()} ${text}`)
  })
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`))
  return problems
}

const hScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

for (const locale of ['', 'en/']) {
  test(`carga del inicio y de cinco componentes (${locale || 'es'})`, async ({ page }) => {
    test.setTimeout(120_000)
    const problems = watchConsole(page)
    const res = await page.goto(locale)
    expect(res.status()).toBe(200)
    await expect(page.locator('main h1')).toHaveCount(1)
    await expect(page.locator('main .g-hero')).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', locale ? 'en' : 'es')
    for (const p of PAGES) {
      const r = await page.goto(`${locale}${p}.html`)
      expect(r.status(), p).toBe(200)
      // esperar a la hidratación: una navegación a mitad de carga aborta los módulos en curso (Firefox lo registra)
      await page.waitForLoadState('networkidle')
      // un solo h1 por página: el de GPageHeader (el `# Nombre` del README pasó al frontmatter)
      await expect(page.locator('h1')).toHaveCount(1)
      await expect(page.locator('main .g-page-header h1')).toBeVisible()
      await expect(page.locator('.grana-demo__stage').first()).toBeVisible()
      // el ejemplo vivo es Grana de verdad: al menos un elemento .g-* dentro
      expect(await page.locator('.grana-demo__stage [class^="g-"], .grana-demo__stage [class*=" g-"]').count(), p).toBeGreaterThan(0)
      if (locale) await expect(page.getByText('Translation pending').first()).toBeVisible()
    }
    expect(problems).toEqual([])
  })
}

test('ejemplo vivo interactivo: quitar una etiqueta deja la huella con «Deshacer»', async ({ page }) => {
  const problems = watchConsole(page)
  await page.goto('components/tag.html')
  const demo = page.locator('.grana-demo').first()
  await demo.scrollIntoViewIfNeeded()
  await demo.getByRole('button', { name: 'Quitar Penicilina' }).click()
  await expect(demo.getByRole('button', { name: 'Deshacer: quitar Penicilina' })).toBeVisible()
  await demo.getByRole('button', { name: 'Deshacer: quitar Penicilina' }).click()
  await expect(demo.getByRole('button', { name: 'Quitar Penicilina' })).toBeVisible()
  expect(problems).toEqual([])
})

test('prueba en vivo: el código es el control (GBtn)', async ({ page }) => {
  const problems = watchConsole(page)
  await page.goto('components/btn.html')
  await page.waitForLoadState('networkidle')
  const live = page.locator('.grana-live')
  const btn = live.locator('.grana-live__mount .g-btn')
  await expect(btn).toHaveClass(/g-btn--color-brand/)
  // cada valor del código es un botón que cicla; la casilla activa la prop
  await live.locator('.t-val').first().click()
  await expect(btn).toHaveClass(/g-btn--color-accent/)
  await live.locator('.t-bool', { hasText: 'disabled' }).click()
  await expect(btn).toBeDisabled()
  await expect(live.locator('.grana-live__code')).toContainText('[x] disabled')
  // tema propio de la vista: oscuro sobre la página clara
  await live.getByRole('button', { name: 'Oscuro' }).click()
  await expect(live.locator('.grana-live__stage')).toHaveAttribute('data-theme', 'dark')
  // un caso se abre en la ficha
  await live.locator('.grana-live__case').nth(1).getByRole('button', { name: 'Abrir en la ficha' }).click()
  await expect(btn).toHaveClass(/g-btn--color-danger/)
  await expect(btn).toHaveClass(/g-btn--variant-outline/)
  expect(problems).toEqual([])
})

test('búsqueda: el filtro del índice encuentra un componente y navega a su página', async ({ page }) => {
  await page.goto('')
  await page.waitForLoadState('networkidle')
  const input = page.locator('.g-sidebar__filter-input')
  await input.fill('combobox')
  const nav = page.locator('.g-sidebar__nav')
  await expect(nav.getByRole('link', { name: /GCombobox/ })).toBeVisible()
  await input.press('Enter')
  await expect(page).toHaveURL(/components\/combobox/)
})

test('selector de idioma: de español a inglés en la misma página', async ({ page }) => {
  await page.goto('components/btn.html')
  await page.waitForLoadState('networkidle')
  await page.locator('.site-band__lang button').click()
  const english = page.getByRole('menuitem', { name: 'English' })
  await expect(english).toHaveAttribute('hreflang', 'en')
  await expect(english).toHaveAttribute('lang', 'en')
  await english.click()
  await expect(page).toHaveURL(/\/grana\/en\/components\/btn/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByText('Translation pending').first()).toBeVisible()
  await expect(page.locator('.g-sidebar')).toContainText('Get started')
})

test('modo oscuro: VitePress y los tokens de Grana cambian a la vez', async ({ page }) => {
  await page.goto('components/btn.html')
  await page.waitForLoadState('networkidle')
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-theme', 'light')
  const bgLight = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  const btnLight = await page.locator('.grana-demo .g-btn').first().evaluate((el) => getComputedStyle(el).backgroundColor)
  await page.locator('.site-band__theme').getByRole('radio', { name: 'Oscuro' }).check()
  await expect(html).toHaveClass(/dark/)
  await expect(html).toHaveAttribute('data-theme', 'dark')
  const bgDark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  const btnDark = await page.locator('.grana-demo .g-btn').first().evaluate((el) => getComputedStyle(el).backgroundColor)
  expect(bgDark).not.toBe(bgLight)
  expect(btnDark).not.toBe(btnLight)
  // la preferencia se guarda y se aplica antes de pintar al recargar
  await page.reload()
  await expect(html).toHaveAttribute('data-theme', 'dark')
})

const CONTRAST_TARGETS = {
  'components/btn.html': {
    texto: '.vp-doc p',
    enlace: '.vp-doc a:not(.header-anchor)',
    barraLateral: '.g-sidebar__nav .g-sidebar__label',
    barraActiva: '.g-sidebar__nav [aria-current="page"] .g-sidebar__label',
    filtro: '.g-sidebar__filter-count',
    indice: '.g-page-index__trigger',
    miga: '.g-app-shell__header .g-breadcrumbs a',
    antetitulo: '.g-page-header__eyebrow',
    metaComponente: '.site-import',
    etiquetaEjemplo: '.grana-demo__label',
    codigo: '.vp-doc :not(pre) > code',
    pie: '.site-neighbours .g-card__title'
  },
  '': {
    lema: '.g-hero__lead',
    titular: '.g-hero__title',
    botonPrincipal: '.g-hero__actions .g-btn',
    tarjetaTitulo: '.g-card__title',
    texto: '.vp-doc p'
  },
  'en/components/btn.html': { aviso: '.custom-block.warning p' }
}

for (const scheme of ['light', 'dark']) for (const [url, sel] of Object.entries(CONTRAST_TARGETS)) {
  test(`contraste del texto del sitio ≥ 4.5:1 (${scheme}, /${url})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme })
    await page.goto(url)
    await page.waitForLoadState('networkidle')
    await page.locator(Object.values(sel)[0]).first().waitFor()
    const results = await page.evaluate((sel) => {
      const parse = (c) => {
        const m = c.match(/rgba?\(([^)]+)\)/)
        if (!m) return null
        const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number)
        return { r, g, b, a }
      }
      const lum = ({ r, g, b }) => {
        const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
      }
      const bgOf = (el) => {
        let layers = []
        for (let e = el; e; e = e.parentElement) {
          const c = parse(getComputedStyle(e).backgroundColor)
          if (c && c.a > 0) {
            layers.push(c)
            if (c.a >= 1) break
          }
        }
        let base = { r: 255, g: 255, b: 255 }
        for (const c of layers.reverse()) base = { r: c.r * c.a + base.r * (1 - c.a), g: c.g * c.a + base.g * (1 - c.a), b: c.b * c.a + base.b * (1 - c.a) }
        return base
      }
      const ratio = (el) => {
        const fg = parse(getComputedStyle(el).color)
        const bg = bgOf(el)
        const blend = { r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a) }
        const [a, b] = [lum(blend), lum(bg)].sort((x, y) => y - x)
        return (a + 0.05) / (b + 0.05)
      }
      const out = {}
      for (const [k, s] of Object.entries(sel)) {
        const el = [...document.querySelectorAll(s)].find((e) => e.getClientRects().length)
        if (el) out[k] = Math.round(ratio(el) * 100) / 100
      }
      return out
    }, sel)
    for (const [k, v] of Object.entries(results)) expect(v, `${k}: ${v}:1`).toBeGreaterThanOrEqual(4.5)
    expect(Object.keys(results).sort()).toEqual(Object.keys(sel).sort())
  })
}

for (const scheme of ['light', 'dark']) {
  test(`contraste del número en el asiento lleno ≥ 4.5:1 (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme })
    await page.goto('components/combobox.html')
    await page.waitForLoadState('networkidle')
    // El asiento es el ::before del hueco del icono (GSidebar.css): el fondo del número no es de un antepasado.
    const ratio = await page.locator('.g-sidebar__nav [aria-current="page"] .g-sidebar__icon').evaluate((el) => {
      const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r, g, b, a } }
      const lum = ({ r, g, b }) => { const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
      let base = { r: 255, g: 255, b: 255 }
      const stack = []
      for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c.a > 0) { stack.push(c); if (c.a >= 1) break } }
      for (const c of stack.reverse()) base = { r: c.r * c.a + base.r * (1 - c.a), g: c.g * c.a + base.g * (1 - c.a), b: c.b * c.a + base.b * (1 - c.a) }
      const seat = parse(getComputedStyle(el, '::before').backgroundColor)
      const bg = { r: seat.r * seat.a + base.r * (1 - seat.a), g: seat.g * seat.a + base.g * (1 - seat.a), b: seat.b * seat.a + base.b * (1 - seat.a) }
      const fg = parse(getComputedStyle(el).color)
      const t = { r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a) }
      const [a, b] = [lum(t), lum(bg)].sort((x, y) => y - x)
      return Math.round(((a + 0.05) / (b + 0.05)) * 100) / 100
    })
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })
}

test('foco visible con teclado en la navegación del sitio', async ({ page, browserName }) => {
  await page.goto('components/btn.html')
  await page.waitForLoadState('networkidle')
  await page.keyboard.press('Tab') // «Saltar al contenido»
  // WebKit no lleva el Tab a los enlaces por omisión (S7, sitio-marco.md §8): ahí el primero es un botón de la banda.
  if (browserName !== 'webkit') await expect(page.locator('.g-app-shell__skip')).toBeFocused()
  await page.keyboard.press('Tab') // primer control de la banda
  const outline = await page.evaluate(() => {
    const s = getComputedStyle(document.activeElement)
    return { el: document.activeElement.className, style: s.outlineStyle, width: parseFloat(s.outlineWidth) }
  })
  expect(outline.style, outline.el).not.toBe('none')
  expect(outline.width).toBeGreaterThanOrEqual(2)
})

for (const p of ['', 'getting-started.html', 'components/btn.html', 'components/table.html', 'en/components/combobox.html']) {
  test(`320 px sin desplazamiento horizontal: /${p}`, async ({ page }) => {
    const problems = watchConsole(page)
    await page.setViewportSize({ width: 320, height: 700 })
    await page.goto(p)
    await page.waitForLoadState('networkidle')
    expect(await hScroll(page)).toBeLessThanOrEqual(0)
    expect(problems).toEqual([])
  })
}

test.describe('puntero grueso', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 800 } })
  test('controles de la navegación ≥ 44 px', async ({ page, browserName }) => {
    test.skip(browserName === 'firefox', 'Firefox no emula isMobile')
    await page.goto('components/btn.html')
    await page.waitForLoadState('networkidle')
    expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true)
    // Área táctil real (la que recibe el toque), no la caja visible: Grana la amplía con un seudoelemento (GBtn) o con el
    // enlace estirado de la tarjeta (GCard). Se toca a ±21 px del centro en los dos ejes y debe responder el mismo control.
    const small = await page.evaluate(() =>
      ['.g-app-shell__header button', '.g-app-shell__header a', '.g-page-index__trigger', '.g-page-header button', '.site-neighbours a']
        .flatMap((s) => [...document.querySelectorAll(s)])
        .filter((e) => e.getClientRects().length && !e.closest('[hidden]'))
        .map((e) => {
          e.scrollIntoView({ block: 'center', inline: 'center' })
          const r = e.getBoundingClientRect()
          const cx = r.left + r.width / 2
          const cy = r.top + r.height / 2
          // un seudoelemento cuenta como su dueño en elementFromPoint
          const owner = (x, y) => { const hit = document.elementFromPoint(x, y); return !!hit && e.contains(hit) }
          const ok = [[cx - 21, cy], [cx + 21, cy], [cx, cy - 21], [cx, cy + 21]].every(([x, y]) => owner(x, y))
          return { s: e.className, label: e.getAttribute('aria-label') || e.textContent.trim().slice(0, 24), w: Math.round(r.width), h: Math.round(r.height), ok }
        })
        .filter((r) => !r.ok)
    )
    expect(small).toEqual([])
  })
})

test('blocks: índice, una sección de cada familia con su ejemplo vivo y su familia en el índice', async ({ page }) => {
  test.setTimeout(120_000)
  const problems = watchConsole(page)
  // El 404 del logo es del servidor de previsualización sin la base; no es de estas páginas.
  const real = () => problems.filter((p) => !/Failed to load resource/.test(p))
  for (const p of ['blocks/', 'blocks/marketing/', 'blocks/marketing/features', 'blocks/booking/offer-list', 'en/blocks/booking/search', 'blocks/ecommerce/', 'blocks/ecommerce/product-grid', 'en/blocks/ecommerce/reviews']) {
    const r = await page.goto(p.endsWith('/') ? p : `${p}.html`)
    expect(r.status(), p).toBe(200)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('main .g-page-header h1')).toBeVisible()
    if (!p.endsWith('/')) {
      await expect(page.locator('.grana-block-bank [data-gb]').first()).toBeVisible()
      expect(await page.locator('.grana-block-bank [data-gb]').count(), p).toBe(3)
      expect(await hScroll(page), p).toBeLessThanOrEqual(0)
    }
    // una sola navegación global también en /blocks/ (sitio-marco.md §3): la familia es un padre del índice
    await expect(page.locator('.g-sidebar__nav').getByRole('button', { name: 'Booking' })).toBeVisible()
  }
  await expect(page.locator('.g-sidebar__nav .g-sidebar__group-title', { hasText: 'Blocks' })).toBeVisible()
  expect(real()).toEqual([])
})

/* ------------------------------------------------------------------ marco del sitio (sitio-marco.md §12) */

test('marco: un banner, un main, un h1 y un contentinfo; toda nav con nombre', async ({ page }) => {
  const problems = watchConsole(page)
  for (const p of ['components/combobox.html', 'theming.html', 'blocks/booking/offer-list.html', '']) {
    await page.goto(p)
    await page.waitForLoadState('networkidle')
    const info = await page.evaluate(() => ({
      banner: document.querySelectorAll('header.g-app-shell__header').length,
      main: document.querySelectorAll('main').length,
      h1: document.querySelectorAll('h1').length,
      contentinfo: document.querySelectorAll('footer.g-app-shell__footer').length,
      unnamed: [...document.querySelectorAll('nav')].filter((n) => n.getClientRects().length && !n.getAttribute('aria-label') && !n.getAttribute('aria-labelledby')).length
    }))
    expect(info, p).toEqual({ banner: 1, main: 1, h1: 1, contentinfo: 1, unnamed: 0 })
  }
  await expect(page.getByRole('navigation', { name: 'Documentación' })).toBeVisible()
  expect(problems).toEqual([])
})

test('marco: `/` lleva al filtro y «24» + Intro llega a GCombobox con el foco en su h1', async ({ page }) => {
  const problems = watchConsole(page)
  await page.goto('getting-started.html')
  await page.waitForLoadState('networkidle')
  await page.locator('main h1').click()
  await page.keyboard.press('/')
  const input = page.locator('.g-sidebar__filter-input')
  await expect(input).toBeFocused()
  await page.keyboard.type('24')
  await expect(page.locator('.g-sidebar__filter-count')).toHaveText(/^1 de \d+ páginas/)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/components\/combobox\.html/)
  // la página nueva se carga en el cliente (trozo de la ficha con su prueba en vivo): margen para máquinas cargadas
  await expect(page.locator('main h1')).toHaveText('GCombobox', { timeout: 15_000 })
  await expect(page.locator('main h1')).toBeFocused()
  await expect(page.locator('.g-page-header__eyebrow')).toHaveText(/Componente 24 · Campos de entrada/)
  // Ctrl+K y ⌘K también llevan al filtro (fuera y dentro de un campo)
  await page.keyboard.press('ControlOrMeta+k')
  await expect(input).toBeFocused()
  expect(problems).toEqual([])
})

test('marco: «oscuro» no está en ningún título y aparece «En el texto»; Esc vacía y vuelve el total', async ({ page }) => {
  test.setTimeout(90_000)
  await page.goto('components/btn.html')
  await page.waitForLoadState('networkidle')
  const input = page.locator('.g-sidebar__filter-input')
  const count = page.locator('.g-sidebar__filter-count')
  const total = (await count.textContent()).trim()
  await input.fill('oscuro')
  await expect(count).toContainText('Ningún título con «oscuro»')
  // el índice local (≈ 1,6 MB) se carga la primera vez: margen para máquinas cargadas
  const group = page.locator('.g-sidebar__group', { has: page.locator('.g-sidebar__group-title', { hasText: 'En el texto' }) })
  await expect(group).toBeVisible({ timeout: 30_000 })
  await expect(group.getByRole('link', { name: /Tematización · Tema oscuro/ })).toBeVisible()
  expect(await group.getByRole('link').count()).toBeLessThanOrEqual(5)
  await expect(count).toContainText('en el texto')
  await input.press('Escape')
  await expect(input).toHaveValue('')
  await expect(input).toBeFocused()
  await expect(count).toHaveText(total)
  await expect(group).toHaveCount(0)
})

test('marco: aria-current="page" en el índice y "location" en el relevo de la página', async ({ page }) => {
  const problems = watchConsole(page)
  await page.goto('components/combobox.html')
  await page.waitForLoadState('networkidle')
  const current = page.locator('.g-sidebar__nav [aria-current="page"]')
  await expect(current).toHaveCount(1)
  await expect(current).toContainText('GCombobox')
  await expect(current).toContainText('24')
  // elegir una sección del relevo: «location» en el menú y el foco en la sección
  const trigger = page.locator('.g-page-index__trigger')
  await trigger.click()
  const items = page.locator('.g-page-index [role="menuitem"]')
  const n = await items.count()
  expect(n).toBeGreaterThan(2)
  const target = items.nth(2)
  const label = (await target.textContent()).trim()
  const href = await target.getAttribute('href')
  await target.click()
  const id = decodeURIComponent(href.split('#')[1])
  await expect(page.locator(`[id="${id}"]`)).toBeFocused()
  // Que el relevo siga diciendo la elegida tras el salto depende de #1048 (la elegida se mantiene hasta el primer
  // desplazamiento del usuario; pendiente en GPageIndex.vue): si falla aquí, es ese cambio.
  await expect(trigger).toContainText(label)
  await trigger.click()
  await expect(page.locator(`.g-page-index [role="menuitem"][href$="#${id}"]`)).toHaveAttribute('aria-current', 'location')
  await page.keyboard.press('Escape')
  expect(problems).toEqual([])
})

test('marco: idioma con ruta equivalente y enlaces alternos en el head', async ({ page }) => {
  await page.goto('components/combobox.html')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', '/grana/en/components/combobox.html')
  await page.locator('.site-band__lang button').click()
  await expect(page.getByRole('menuitem', { name: 'Español' })).toHaveAttribute('aria-current', 'page')
  await page.getByRole('menuitem', { name: 'English' }).click()
  await expect(page).toHaveURL(/\/grana\/en\/components\/combobox\.html$/)
  await expect(page.locator('.g-page-header__eyebrow')).toHaveText(/Component 24 · Input fields/, { timeout: 15_000 })
  await expect(page.locator('main h1')).toHaveText('GCombobox')
  await page.locator('.site-band__lang button').click()
  await page.getByRole('menuitem', { name: 'Español' }).click()
  await expect(page).toHaveURL(/\/grana\/components\/combobox\.html$/)
})

for (const [pref, theme, dark] of [['light', 'light', false], ['dark', 'dark', true], ['auto', 'dark', true]]) {
  test(`marco: tema «${pref}» sin destello al cargar (sistema oscuro) y persistente`, async ({ page }) => {
    const problems = watchConsole(page)
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.addInitScript((p) => {
      if (!sessionStorage.getItem('seeded')) { localStorage.setItem('vitepress-theme-appearance', p); sessionStorage.setItem('seeded', '1') }
      // Lo que hay en <html> en el primer DOMContentLoaded: antes de que Vue monte nada.
      document.addEventListener('DOMContentLoaded', () => {
        window.__first = { theme: document.documentElement.getAttribute('data-theme'), dark: document.documentElement.classList.contains('dark') }
      }, { once: true })
    }, pref)
    await page.goto('components/btn.html')
    await page.waitForLoadState('networkidle')
    expect(await page.evaluate(() => window.__first)).toEqual({ theme, dark })
    const radio = page.locator('.site-band__theme').getByRole('radio', { name: { light: 'Claro', dark: 'Oscuro', auto: 'Sistema' }[pref] })
    await expect(radio).toBeChecked()
    await page.reload()
    await page.waitForLoadState('networkidle')
    expect(await page.evaluate(() => window.__first)).toEqual({ theme, dark })
    await expect(radio).toBeChecked()
    expect(problems).toEqual([])
  })
}

test.describe('estrecho', () => {
  test.use({ viewport: { width: 375, height: 800 } })
  test('marco: drawer del índice; Esc lo cierra y el foco vuelve al botón', async ({ page, browserName }) => {
    const problems = watchConsole(page)
    await page.goto('components/btn.html')
    await page.waitForLoadState('networkidle')
    const open = page.locator('.site-band__menu')
    await expect(open).toBeVisible()
    await open.click()
    const drawer = page.locator('dialog.g-sidebar__drawer[open]')
    await expect(drawer).toBeVisible()
    await expect(drawer.locator('[aria-current="page"]')).toContainText('GBtn')
    await page.keyboard.press('Escape')
    await expect(drawer).toHaveCount(0)
    // WebKit: el drawer no devuelve el foco al botón que lo abrió (defecto S8 de GSidebar, PENDIENTES.md §3).
    if (browserName !== 'webkit') await expect(open).toBeFocused()
    // `/` abre el drawer y enfoca el filtro
    await page.locator('main h1').click()
    await page.keyboard.press('/')
    await expect(page.locator('dialog[open] .g-sidebar__filter-input')).toBeFocused()
    await page.keyboard.type('tag')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/components\/tag\.html/)
    await expect(page.locator('dialog.g-sidebar__drawer[open]')).toHaveCount(0)
    expect(problems).toEqual([])
  })
})

for (const width of [1280, 900, 375]) {
  test(`marco: hidratación sin avisos y CLS del marco 0 a ${width} px`, async ({ page, browserName }) => {
    const problems = watchConsole(page)
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      window.__cls = []
      // Desplazamientos del MARCO: banda, índice, cabecera, pie, o la columna de la página entera (marco, main, contenedor).
      // Lo que se mueve dentro del contenido (.vp-doc: ejemplos vivos y fichas que montan en el cliente) es de cada página.
      const FRAME = '.g-app-shell__header, .g-sidebar, .g-page-header, .g-app-shell__footer'
      const isFrame = (n) => n && n.nodeType === 1 && (!!n.closest(FRAME) || n.matches('.g-app-shell, .g-app-shell__frame, .g-app-shell__main, .g-app-shell__main > .g-container'))
      try {
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) {
            if (e.hadRecentInput) continue
            const nodes = (e.sources || []).map((x) => x.node)
            if (nodes.some(isFrame)) window.__cls.push({ value: e.value, nodes: nodes.map((n) => n?.className || n?.nodeName || '?') })
          }
        }).observe({ type: 'layout-shift', buffered: true })
      } catch { window.__cls = null }
    })
    await page.goto('components/combobox.html')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)
    const cls = await page.evaluate(() => window.__cls)
    // `layout-shift` solo existe en Chromium; en Firefox y WebKit queda la parte de la hidratación (consola limpia).
    if (browserName === 'chromium') {
      const total = cls.reduce((s, e) => s + e.value, 0)
      expect(total, JSON.stringify(cls)).toBe(0)
    }
    expect(problems).toEqual([])
  })
}
