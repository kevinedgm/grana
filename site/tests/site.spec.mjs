// Pruebas de navegador del sitio de documentación (build + `vitepress preview`, puerto 4219 o GRANA_SITE_PORT).
//   cd site && npm run docs:build && npx playwright test --project=chromium
// El marco es el del sitio anterior hecho con Grana (theme/Layout.vue, design/contracts/sitio-marco.md, #1052): GAppShell
// pinned-wide, GNavBar, GSidebar appearance="index" con filtro, GPageIndex list (columna y plegada), GCombobox command.
// Las pruebas del marco están al final («marco: …»); la paridad visual con la referencia, en tests/paridad.mjs.
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
    // la portada con la marca: el único h1 es el logo W2 (svg role="img" con nombre «Grana»)
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.getByRole('heading', { level: 1, name: 'Grana' })).toBeVisible()
    await expect(page.locator('main .site-hero h1 svg[role="img"][aria-label="Grana"]')).toHaveCount(1)
    await expect(page.locator('html')).toHaveAttribute('lang', locale ? 'en' : 'es')
    for (const p of PAGES) {
      const r = await page.goto(`${locale}${p}.html`)
      expect(r.status(), p).toBe(200)
      // esperar a la hidratación: una navegación a mitad de carga aborta los módulos en curso (Firefox lo registra)
      await page.waitForLoadState('networkidle')
      // un solo h1 por página, el del cuerpo (como en el original)
      await expect(page.locator('h1')).toHaveCount(1)
      await expect(page.locator('main .vp-doc h1')).toBeVisible()
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

test('búsqueda modal: «Buscar» abre la búsqueda, encuentra un componente y navega a su página', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('')
  await page.waitForLoadState('networkidle')
  await page.locator('.site-search').click()
  const input = page.locator('#site-search-surface input')
  await expect(input).toBeFocused()
  await input.fill('combobox')
  // el índice de búsqueda (≈ 3 MB por idioma, unos 6 s de carga en Chromium) se carga con la primera búsqueda: margen
  const first = page.locator('#site-search-surface .g-combobox__option').first()
  await expect(first).toBeVisible({ timeout: 60_000 })
  await expect(page.locator('#site-search-surface')).toContainText('GCombobox')
  await expect(page.locator('#site-search-surface mark').first()).toBeVisible()
  await input.press('Enter')
  await expect(page).toHaveURL(/components\/combobox/)
})

test('selector de idioma: de español a inglés en la misma página', async ({ page }) => {
  await page.goto('components/btn.html')
  await page.waitForLoadState('networkidle')
  await page.locator('.g-nav-bar__actions .site-lang').click()
  const english = page.getByRole('menuitem', { name: 'English' })
  await expect(english).toHaveAttribute('hreflang', 'en')
  await expect(english).toHaveAttribute('lang', 'en')
  await english.click()
  await expect(page).toHaveURL(/\/grana\/en\/components\/btn/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByText('Translation pending').first()).toBeVisible()
  await expect(page.locator('.g-nav-bar')).toContainText('Components')
})

test('modo oscuro: VitePress y los tokens de Grana cambian a la vez', async ({ page }) => {
  await page.goto('components/btn.html')
  await page.waitForLoadState('networkidle')
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-theme', 'light')
  const bgLight = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  const btnLight = await page.locator('.grana-demo .g-btn').first().evaluate((el) => getComputedStyle(el).backgroundColor)
  await page.locator('.g-nav-bar__actions .site-theme input').click()
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
    barraLateral: '.g-app-shell > .g-sidebar .g-sidebar__link:not([aria-current]) .g-sidebar__label',
    barraActiva: '.g-app-shell > .g-sidebar [aria-current="page"] .g-sidebar__label',
    numero: '.g-app-shell > .g-sidebar .g-sidebar__link:not([aria-current]) .g-sidebar__code',
    filtro: '.g-sidebar__filter-input',
    indice: '.site-aside .g-page-index__link:not([aria-current])',
    indiceTitulo: '.site-aside .g-page-index__title',
    navegacion: '.g-nav-bar__link:not([aria-current])',
    navegacionActual: '.g-nav-bar__link[aria-current="page"]',
    busqueda: '.site-search__text',
    metaComponente: '.grana-meta',
    etiquetaEjemplo: '.grana-demo__label',
    codigo: '.vp-doc :not(pre) > code',
    pie: '.site-pager__label, .site-pager__title'
  },
  '': {
    lema: '.site-hero__motto',
    entradilla: '.site-hero__lead',
    nombre: '.site-hero__origin',
    botonPrincipal: '.site-hero__start',
    botonAlterno: '.site-hero__browse',
    tarjetaTitulo: '.VPFeature .title',
    tarjetaTexto: '.VPFeature .details',
    texto: '.vp-doc p',
    piePortada: '.site-footer'
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
  // La portada (sin barra local ni tarjetas) con las acciones de BrandHero.
  for (const [url, sels] of [
    ['components/btn.html', ['.g-app-shell__header button', '.g-app-shell__header a', '.site-local button', '.site-pager a']],
    ['', ['.g-app-shell__header button', '.g-app-shell__header a', '.site-hero a']]
  ]) test(`controles de la navegación ≥ 44 px: /${url}`, async ({ page, browserName }) => {
    test.skip(browserName === 'firefox', 'Firefox no emula isMobile')
    await page.goto(url)
    await page.waitForLoadState('networkidle')
    expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true)
    // Área táctil real (la que recibe el toque), no la caja visible: Grana la amplía con un seudoelemento (GBtn) o con el
    // enlace estirado de la tarjeta (GCard). Se toca a ±21 px del centro en los dos ejes y debe responder el mismo control.
    const small = await page.evaluate((sels) =>
      sels
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
        .filter((r) => !r.ok),
      sels
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
    await expect(page.locator('main .vp-doc h1')).toBeVisible()
    if (!p.endsWith('/')) {
      await expect(page.locator('.grana-block-bank [data-gb]').first()).toBeVisible()
      expect(await page.locator('.grana-block-bank [data-gb]').count(), p).toBe(3)
      expect(await hScroll(page), p).toBeLessThanOrEqual(0)
    }
    // su barra propia (como el original, sitio-marco.md §4): grupos por familia, plegables y sin números
    await expect(page.locator('.g-app-shell > .g-sidebar .g-sidebar__group-title', { hasText: 'Booking' })).toBeVisible()
    expect(await page.locator('.g-app-shell > .g-sidebar [data-code]').count(), p).toBe(0)
  }
  await expect(page.locator('.g-nav-bar__link[aria-current="page"]')).toHaveText('Blocks')
  expect(real()).toEqual([])
})

/* ------------------------------------------------------------------ marco calcado (sitio-marco.md §8, §10, §12 «Además») */

test('marco: un banner, un main, un h1; contentinfo solo en la portada; toda nav con nombre', async ({ page }) => {
  const problems = watchConsole(page)
  for (const [p, home] of [['components/combobox.html', false], ['getting-started.html', false], ['blocks/booking/offer-list.html', false], ['', true]]) {
    await page.goto(p)
    await page.waitForLoadState('networkidle')
    const info = await page.evaluate(() => ({
      banner: document.querySelectorAll('header.g-app-shell__header').length,
      main: document.querySelectorAll('main').length,
      h1: document.querySelectorAll('h1').length,
      contentinfo: document.querySelectorAll('footer.g-app-shell__footer').length,
      unnamed: [...document.querySelectorAll('nav')].filter((n) => n.getClientRects().length && !n.getAttribute('aria-label') && !n.getAttribute('aria-labelledby')).length
    }))
    expect(info, p).toEqual({ banner: 1, main: 1, h1: 1, contentinfo: home ? 1 : 0, unnamed: 0 })
  }
  await page.goto('components/combobox.html')
  for (const name of ['Secciones', 'Documentación', 'En esta página']) await expect(page.getByRole('navigation', { name }).first()).toBeVisible()
  expect(problems).toEqual([])
})

test('marco: ⌘K / Ctrl+K abre la búsqueda (también desde un campo) y Esc la cierra', async ({ page, browserName }) => {
  test.setTimeout(120_000)
  await page.goto('components/btn.html')
  await page.waitForLoadState('networkidle')
  const mod = browserName === 'webkit' ? 'Meta' : 'Control'
  await page.locator('.g-sidebar__filter-input').focus()
  await page.keyboard.press(`${mod}+k`)
  const surface = page.locator('#site-search-surface')
  await expect(surface).toHaveJSProperty('open', true)
  await expect(surface.locator('input')).toBeFocused()
  await page.keyboard.type('comb')
  await expect(surface.locator('.g-combobox__option').first()).toBeVisible({ timeout: 60_000 })
  await expect(surface.locator('mark').first()).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(surface).toHaveJSProperty('open', false)
})

test('marco: `/` lleva al filtro y «24» + Intro llega a GCombobox con el foco en su h1', async ({ page }) => {
  const problems = watchConsole(page)
  await page.goto('getting-started.html')
  await page.waitForLoadState('networkidle')
  await page.locator('main h1').click()
  await page.keyboard.press('/')
  const input = page.locator('.g-app-shell > .g-sidebar .g-sidebar__filter-input')
  await expect(input).toBeFocused()
  await page.keyboard.type('24')
  await expect(page.locator('.g-app-shell > .g-sidebar .g-sidebar__link:visible')).toHaveCount(1)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/components\/combobox\.html/)
  await expect(page.locator('main h1')).toHaveText(/GCombobox/, { timeout: 15_000 })
  await expect(page.locator('main h1')).toBeFocused()
  // en la portada (sin índice), `/` abre la búsqueda
  await page.goto('')
  await page.waitForLoadState('networkidle')
  await page.keyboard.press('/')
  await expect(page.locator('#site-search-surface')).toHaveJSProperty('open', true)
  expect(problems).toEqual([])
})

test('marco: aria-current="page" en la barra y en el índice; "location" en la columna, que sigue la lectura', async ({ page }) => {
  const problems = watchConsole(page)
  await page.goto('components/combobox.html')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('.g-nav-bar__link[aria-current="page"]')).toHaveText('Componentes')
  const current = page.locator('.g-app-shell > .g-sidebar [aria-current="page"]')
  await expect(current).toHaveCount(1)
  await expect(current).toContainText('GCombobox')
  await expect(current).toContainText('24')
  // la columna sigue la lectura: tras desplazar, la actual es la última sección cuyo título ya cruzó la línea de lectura
  const links = page.locator('.site-aside .g-page-index__link')
  const href = await links.nth(4).getAttribute('href')
  const id = decodeURIComponent(href.split('#')[1])
  await page.evaluate((i) => { const el = document.getElementById(i); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 120) }, id)
  await expect.poll(() => page.evaluate(() => {
    const cur = document.querySelector('.site-aside .g-page-index__link[aria-current="location"]')
    if (!cur) return 'sin actual'
    const ids = [...document.querySelectorAll('.site-aside .g-page-index__link')].map((a) => decodeURIComponent(a.getAttribute('href').slice(1)))
    const tops = ids.map((i) => document.getElementById(i)?.getBoundingClientRect().top ?? Infinity)
    const k = ids.indexOf(decodeURIComponent(cur.getAttribute('href').slice(1)))
    // su título está por encima de la mitad del visor y el siguiente aún no (la línea de lectura cae entre los dos)
    return tops[k] <= innerHeight / 2 && (k === ids.length - 1 || tops[k + 1] > 0) ? 'ok' : `actual ${ids[k]} (${Math.round(tops[k])})`
  }), { timeout: 5000 }).toBe('ok')
  // elegir en la columna lleva el foco a la sección
  const pick = links.nth(2)
  const pid = decodeURIComponent((await pick.getAttribute('href')).split('#')[1])
  await pick.click()
  await expect(page.locator(`[id="${pid}"]`)).toBeFocused()
  await expect(pick).toHaveAttribute('aria-current', 'location')
  expect(problems).toEqual([])
})

test('marco: idioma con ruta equivalente y enlaces alternos en el head', async ({ page }) => {
  await page.goto('components/combobox.html')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', '/grana/en/components/combobox.html')
  await page.locator('.g-nav-bar__actions .site-lang').click()
  await expect(page.getByRole('menuitem', { name: 'Español' })).toHaveAttribute('aria-current', 'page')
  await page.getByRole('menuitem', { name: 'English' }).click()
  await expect(page).toHaveURL(/\/grana\/en\/components\/combobox\.html$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en', { timeout: 15_000 })
  await expect(page.locator('.g-nav-bar__link[aria-current="page"]')).toHaveText('Components')
  await page.locator('.g-nav-bar__actions .site-lang').click()
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
    // el interruptor enseña el tema resuelto
    const sw = page.locator('.g-nav-bar__actions .site-theme input')
    if (dark) await expect(sw).toBeChecked()
    else await expect(sw).not.toBeChecked()
    await page.reload()
    await page.waitForLoadState('networkidle')
    expect(await page.evaluate(() => window.__first)).toEqual({ theme, dark })
    expect(await page.evaluate(() => localStorage.getItem('vitepress-theme-appearance'))).toBe(pref)
    // pulsar escribe el contrario explícito (dos estados, como el original)
    await sw.click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', dark ? 'light' : 'dark')
    expect(await page.evaluate(() => localStorage.getItem('vitepress-theme-appearance'))).toBe(dark ? 'light' : 'dark')
    expect(problems).toEqual([])
  })
}

test.describe('estrecho', () => {
  test.use({ viewport: { width: 375, height: 800 } })
  test('marco: «Menú» abre el cajón del índice; Esc lo cierra; `/` lo abre con el filtro; navegar lo cierra', async ({ page, browserName }) => {
    const problems = watchConsole(page)
    await page.goto('components/btn.html')
    await page.waitForLoadState('networkidle')
    const open = page.locator('.site-local__menu')
    await expect(open).toBeVisible()
    await open.click()
    const drawer = page.locator('dialog.g-sidebar__drawer[open]')
    await expect(drawer).toBeVisible()
    await expect(drawer.locator('[aria-current="page"]')).toContainText('GBtn')
    await page.keyboard.press('Escape')
    await expect(drawer).toHaveCount(0)
    // WebKit: el cajón no devuelve el foco al botón que lo abrió (defecto S8 de GSidebar, PENDIENTES.md §3).
    if (browserName !== 'webkit') await expect(open).toBeFocused()
    await page.locator('main h1').click()
    await page.keyboard.press('/')
    await expect(page.locator('dialog[open] .g-sidebar__filter-input')).toBeFocused()
    await page.keyboard.type('tag')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/components\/tag\.html/)
    await expect(page.locator('dialog.g-sidebar__drawer[open]')).toHaveCount(0)
    // «En esta página» plegado en la barra local: abre, «Volver arriba» y Esc
    const fold = page.locator('.site-local__index .g-page-index__fold')
    // con el teclado (WebKit no enfoca un botón al pulsarlo: Esc solo cierra con el foco dentro)
    await fold.focus()
    await page.keyboard.press('Enter')
    await expect(fold).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('Escape')
    await expect(fold).toHaveAttribute('aria-expanded', 'false')
    expect(problems).toEqual([])
  })
})

for (const width of [1280, 1024, 900, 375, 320]) {
  test(`marco: hidratación sin avisos y CLS del marco 0 a ${width} px`, async ({ page, browserName }) => {
    const problems = watchConsole(page)
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      window.__cls = []
      // Desplazamientos del MARCO: banda, índice, barra local, columna derecha, o la columna de la página entera.
      const FRAME = '.g-app-shell__header, .g-sidebar, .site-local, .site-aside, .g-app-shell__footer'
      const isFrame = (n) => n && n.nodeType === 1 && (!!n.closest(FRAME) || n.matches('.g-app-shell, .g-app-shell__frame, .g-app-shell__main, .site-doc, .site-doc__inner, .site-content'))
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

// Portada con la marca (manual de marca v1, BrandHero.vue + brandMark.js): «La impresión» corre una vez, al cargar la
// portada; nunca al llegar a ella navegando dentro del sitio, ni al volver, y con «reducir movimiento» el logo sale completo.
const markState = (page) => page.evaluate(() => {
  const svg = document.querySelector('main .site-hero h1 svg')
  if (!svg) return null
  const anims = svg.getAnimations({ subtree: true })
  return { print: svg.classList.contains('grana-mov'), anims: anims.length, names: [...new Set(anims.map((a) => a.animationName))].sort() }
})

// Navegación SPA a la portada: un enlace del cuerpo que intercepta el router de VitePress (la marca de la banda recarga
// el documento: eso es «cargar la portada» y sí imprime).
async function spaHome(page) {
  await page.evaluate(() => {
    window.__spa = true
    const a = document.createElement('a')
    a.id = 'zz-home'; a.href = document.querySelector('.site-brand').getAttribute('href'); a.textContent = 'inicio'
    // fuera del árbol de Vue (el contenido nuevo no lo quita); el router de VitePress escucha los clics en toda la ventana
    a.style.cssText = 'position:fixed;inset-block-start:0;inset-inline-start:0;z-index:2147483647'
    document.body.append(a)
  })
  await page.locator('#zz-home').click()
  await expect(page.locator('main .site-hero h1 svg')).toHaveCount(1)
  await page.evaluate(() => document.getElementById('zz-home')?.remove())
  expect(await page.evaluate(() => window.__spa), 'la navegación a la portada fue SPA').toBe(true)
}

test('portada: «La impresión» corre una vez al cargar la portada', async ({ page }) => {
  const problems = watchConsole(page)
  await page.goto('')
  const first = await markState(page)
  expect(first.print).toBe(true)
  // trazado (3 trazos), tinte (aparece + registro) y nombre (aparece + registro): 7 animaciones de CSS
  expect(first.names).toEqual(['grana-registro', 'grana-registro2', 'grana-tenir', 'grana-trazar'])
  // terminan (sin bucle): a 1,6 s ninguna sigue corriendo
  await page.waitForTimeout(1600)
  expect(await page.evaluate(() => document.querySelector('main .site-hero h1 svg').getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length)).toBe(0)
  // a otra página y de vuelta por la marca (navegación SPA): sin impresión
  await page.locator('.site-hero__start').click()
  await expect(page).toHaveURL(/getting-started/)
  await page.waitForLoadState('networkidle')
  await spaHome(page)
  expect(await markState(page)).toEqual({ print: false, anims: 0, names: [] })
  // y con «atrás» del navegador desde otra página (popstate, SPA)
  await page.locator('.site-hero__start').click()
  await expect(page).toHaveURL(/getting-started/)
  await page.goBack()
  await expect(page.locator('main .site-hero h1 svg')).toHaveCount(1)
  expect(await page.evaluate(() => window.__spa)).toBe(true)
  expect(await markState(page)).toEqual({ print: false, anims: 0, names: [] })
  expect(problems).toEqual([])
})

test('portada: llegar navegando desde otra página no imprime el logo', async ({ page }) => {
  const problems = watchConsole(page)
  await page.goto('getting-started.html')
  await page.waitForLoadState('networkidle')
  await spaHome(page)
  expect(await markState(page)).toEqual({ print: false, anims: 0, names: [] })
  expect(problems).toEqual([])
})

test('portada: con «reducir movimiento» el logo aparece completo', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('')
  const st = await markState(page)
  expect(st.anims).toBe(0)
  // el tinte y el nombre, visibles y en su sitio desde el primer cuadro
  const tint = await page.evaluate(() => {
    const t = document.querySelector('main .site-hero .grana__tinte')
    const cs = getComputedStyle(t)
    return { opacity: cs.opacity, translate: cs.translate }
  })
  expect(tint.opacity).toBe('1')
  expect(['none', '0px', '0px 0px']).toContain(tint.translate)
})

for (const width of [1280, 375, 320]) {
  // CLS de la estructura (logo, impresión, hidratación): sin la fuente web, para no medir el cambio de la fuente de respaldo
  // a Instrument Sans, que re-parte el texto y es de las métricas de respaldo de grana-site.css (coco; BrandHero.vue).
  test(`portada: hidratación sin avisos y CLS 0 a ${width} px (logo, lema y acciones)`, async ({ page, browserName }) => {
    const problems = watchConsole(page)
    await page.route(/\.woff2?(\?|$)/, (r) => r.abort())
    await page.setViewportSize({ width, height: 800 })
    await page.addInitScript(() => {
      window.__cls = []
      try {
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls.push({ value: e.value, nodes: (e.sources || []).map((x) => x.node?.className?.baseVal ?? x.node?.className ?? x.node?.nodeName) })
        }).observe({ type: 'layout-shift', buffered: true })
      } catch { window.__cls = null }
    })
    await page.goto('')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1600) // la impresión entera (1380 ms)
    if (browserName === 'chromium') expect(await page.evaluate(() => window.__cls)).toEqual([])
    expect(await hScroll(page)).toBeLessThanOrEqual(0)
    expect(problems.filter((p) => !/Failed to load resource|downloadable font|woff/.test(p))).toEqual([])
  })
}
