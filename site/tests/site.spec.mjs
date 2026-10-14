// Pruebas de navegador del sitio de documentación (build + `vitepress preview`, puerto 4219).
//   cd site && npm run docs:build && npx playwright test --project=chromium
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
    await expect(page.locator('.VPHero .name')).toContainText('Grana')
    await expect(page.locator('html')).toHaveAttribute('lang', locale ? 'en' : 'es')
    for (const p of PAGES) {
      const r = await page.goto(`${locale}${p}.html`)
      expect(r.status(), p).toBe(200)
      // esperar a la hidratación: una navegación a mitad de carga aborta los módulos en curso (Firefox lo registra)
      await page.waitForLoadState('networkidle')
      await expect(page.locator('.vp-doc h1').first()).toBeVisible()
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

test('búsqueda local: encuentra un componente y navega a su página', async ({ page }) => {
  await page.goto('')
  await page.locator('.VPNavBarSearch button').click()
  const input = page.locator('.VPLocalSearchBox input')
  await expect(input).toBeFocused()
  await input.fill('combobox')
  // el índice de búsqueda (≈ 1,6 MB por idioma) se carga al abrir: margen para máquinas cargadas
  const first = page.locator('.VPLocalSearchBox .result').first()
  await expect(first).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('.VPLocalSearchBox .results')).toContainText('GCombobox')
  await input.press('Enter')
  await expect(page).toHaveURL(/components\/combobox/)
})

test('selector de idioma: de español a inglés en la misma página', async ({ page }) => {
  await page.goto('components/btn.html')
  await page.locator('.VPNavBarTranslations button').hover()
  await page.locator('.VPNavBarTranslations').getByRole('link', { name: 'English' }).click()
  await expect(page).toHaveURL(/\/grana\/en\/components\/btn/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByText('Translation pending').first()).toBeVisible()
  await expect(page.locator('.VPNav')).toContainText('Components')
})

test('modo oscuro: VitePress y los tokens de Grana cambian a la vez', async ({ page }) => {
  await page.goto('components/btn.html')
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-theme', 'light')
  const bgLight = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  const btnLight = await page.locator('.grana-demo .g-btn').first().evaluate((el) => getComputedStyle(el).backgroundColor)
  await page.locator('.VPNavBarAppearance button').click()
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
    barraLateral: '.VPSidebarItem .text',
    barraActiva: '.VPSidebarItem.is-active .text',
    indice: '.VPDocAsideOutline .outline-link',
    navegacion: '.VPNavBarMenuLink',
    metaComponente: '.grana-meta',
    etiquetaEjemplo: '.grana-demo__label',
    codigo: '.vp-doc :not(pre) > code',
    pie: '.VPDocFooter .title, .VPDocFooter .desc'
  },
  '': {
    lema: '.VPHero .tagline',
    botonPrincipal: '.VPButton.brand',
    botonAlterno: '.VPButton.alt',
    tarjetaTitulo: '.VPFeature .title',
    tarjetaTexto: '.VPFeature .details',
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

test('foco visible con teclado en la navegación del sitio', async ({ page }) => {
  await page.goto('components/btn.html')
  await page.waitForLoadState('networkidle')
  await page.keyboard.press('Tab') // «Saltar al contenido»
  await page.keyboard.press('Tab')
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
    expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true)
    const small = await page.evaluate(() =>
      ['.VPNavBarHamburger', '.VPNavBarSearch button', '.VPLocalNav .menu', '.VPLocalNavOutlineDropdown button']
        .flatMap((s) => [...document.querySelectorAll(s)])
        .filter((e) => e.getClientRects().length)
        .map((e) => ({ s: e.className, w: e.getBoundingClientRect().width, h: e.getBoundingClientRect().height }))
        .filter((r) => r.w < 44 || r.h < 44)
    )
    expect(small).toEqual([])
  })
})
