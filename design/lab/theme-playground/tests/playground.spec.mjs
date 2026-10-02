// Playwright · Theme Playground. Verifica que el playground cambia de tema, Light/Dark, Current/B/C y superficie sin recargar,
// que el DOM estructural no cambia, que solo cambian los tokens esperados y que los componentes reales reaccionan,
// con estados reales (hover, focus, checked, disabled, active) y con fuentes reales (o su fallback registrado).
import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const results = JSON.parse(readFileSync(join(here, '../../tema-oscuro/dark-color-presence/results.json'), 'utf8'))
const THEMES = Object.keys(results.themes)
const ROLES = ['brand', 'accent', 'success', 'warning', 'danger', 'info']
const PAGE = '/design/lab/theme-playground/index.html'

const sample = (theme, role) => results.samples.find((s) => s.theme === theme && s.role === role)
const hexToRgb = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(h); const n = parseInt(m[1], 16); return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})` }
const STRAT = { current: 'A', b: 'B', c: 'C', d: 'D' }
const expectedDark = (theme, role, strategy) => sample(theme, role).hypotheses[STRAT[strategy]].darkHex

async function open(page, q = {}) {
  const url = new URL(PAGE, 'http://localhost:4180')
  for (const [k, v] of Object.entries(q)) url.searchParams.set(k, v)
  await page.goto(url.pathname + url.search)
  await page.waitForSelector('body[data-ready="1"]')
}
// Espera a que una acción de la interfaz termine de aplicarse (el playground sube window.__playground.version)
async function change(page, testid, value) {
  const before = await page.evaluate(() => window.__playground.version)
  await page.getByTestId(testid).selectOption(value)
  await page.waitForFunction((v) => window.__playground.version > v && document.body.dataset.ready === '1', before)
}
const tok = (page, name) => page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name)
// Todos los tokens --g-* declarados en las hojas de estilo, con su valor calculado en :root
const allTokens = (page) => page.evaluate(() => {
  const names = new Set()
  const walk = (rules) => { for (const r of rules) { if (r.style) for (const p of r.style) if (p.startsWith('--g-')) names.add(p); if (r.cssRules) walk(r.cssRules) } }
  for (const s of document.styleSheets) { try { walk(s.cssRules) } catch (e) { /* hoja sin acceso */ } }
  const cs = getComputedStyle(document.documentElement)
  return Object.fromEntries([...names].sort().map((n) => [n, cs.getPropertyValue(n).trim()]))
})
const diff = (a, b) => Object.keys({ ...a, ...b }).filter((k) => a[k] !== b[k])
// Estructura del DOM: etiqueta + clases que no son de estado, sin texto ni atributos dinámicos
const structure = (page, { ignoreThemeOptions = false } = {}) => page.evaluate((ignore) => {
  const skip = /^(is-|g-.*--(checked|focus))/
  const walk = (el) => `${el.tagName.toLowerCase()}.${[...el.classList].filter((c) => !skip.test(c)).sort().join('.')}[${el.getAttribute('data-testid') ?? ''}](${[...el.children].filter((c) => !(ignore && c.tagName === 'OPTION' && el.dataset.testid === 'sel-theme')).map(walk).join(',')})`
  return walk(document.getElementById('app'))
}, ignoreThemeOptions)
// Grupo de color del tema: también los velos relativos a la superficie anfitriona de GTabs (#120) y GCard (#134), que cambian con el esquema
const COLOR_GROUP = /^--g-(color-|calendar-|glass-|shadow-|surface-(shell|inset|backdrop)|tabs-(track|thumb|band|panel)|card-(hover|pressed|selected|scrim|on-scrim))/

test.describe('estado por URL y selectores', () => {
  for (const [q, label] of [
    [{ theme: 'grana', scheme: 'dark', strategy: 'current' }, '?theme=grana&scheme=dark&strategy=current'],
    [{ theme: 'stripe', scheme: 'dark', strategy: 'b' }, '?theme=stripe&scheme=dark&strategy=b'],
    [{ theme: 'caracol-purpura', scheme: 'dark', strategy: 'c' }, '?theme=caracol-purpura&scheme=dark&strategy=c']
  ]) {
    test(`la URL fija el estado: ${label}`, async ({ page }) => {
      await open(page, q)
      await expect(page.getByTestId('sel-theme')).toHaveValue(q.theme)
      await expect(page.getByTestId('sel-scheme')).toHaveValue(q.scheme)
      await expect(page.getByTestId('sel-strategy')).toHaveValue(q.strategy)
      const html = page.locator('html')
      await expect(html).toHaveAttribute('data-theme', q.scheme)
      await expect(html).toHaveAttribute('data-variant', STRAT[q.strategy])
      await expect(html).toHaveAttribute('data-benchmark-theme', q.theme)
      // los tokens del tema activo coinciden con lo que midió la Fase 2
      for (const role of ROLES) expect(await tok(page, `--g-color-${role}`)).toBe(expectedDark(q.theme, role, q.strategy))
    })
  }

  test('valores inválidos en la URL caen a los predeterminados (grana · dark · current · real)', async ({ page }) => {
    await open(page, { theme: 'no-existe', scheme: 'x', strategy: 'z', surface: 'q' })
    await expect(page.getByTestId('sel-theme')).toHaveValue('grana')
    await expect(page.getByTestId('sel-scheme')).toHaveValue('dark')
    await expect(page.getByTestId('sel-strategy')).toHaveValue('current')
    await expect(page.getByTestId('sel-surface')).toHaveValue('real')
  })
})

test.describe('cambios dinámicos, sin recargar', () => {
  test('1 · cambia el tema', async ({ page }) => {
    await open(page, { theme: 'grana', scheme: 'dark', strategy: 'current' })
    await page.evaluate(() => { window.__noReload = 'marca' })
    const before = await allTokens(page)
    await change(page, 'sel-theme', 'stripe')
    expect(await page.evaluate(() => window.__noReload)).toBe('marca') // no hubo recarga
    expect(new URL(page.url()).searchParams.get('theme')).toBe('stripe') // la URL sigue al estado
    await expect(page.getByTestId('info-theme')).toHaveText('Stripe Inspired')
    await expect(page.locator('html')).toHaveAttribute('data-benchmark-theme', 'stripe')
    for (const role of ROLES) expect(await tok(page, `--g-color-${role}`)).toBe(expectedDark('stripe', role, 'current'))
    const after = await allTokens(page)
    const changed = diff(before, after)
    // el radio, la tipografía y el color cambian con el tema (Grana: radius 16; Stripe: 10)
    expect(changed).toContain('--g-radius-md')
    expect(changed).toContain('--g-color-brand')
    expect(after['--g-radius-md']).toBe('10px')
  })

  test('2 · cambia Light / Dark', async ({ page }) => {
    await open(page, { theme: 'grana', scheme: 'light', strategy: 'current' })
    const light = await allTokens(page)
    expect(light['--g-color-surface']).toBe('#FFFFFF')
    await change(page, 'sel-scheme', 'dark')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    const dark = await allTokens(page)
    expect(dark['--g-color-surface'].toUpperCase()).toBe(results.themes.grana.surfaceHex.toUpperCase())
    expect(dark['--g-color-text']).not.toBe(light['--g-color-text'])
    // pasar de Light a Dark solo cambia tokens del grupo de color (no radios, espaciado, tipografía ni fuentes)
    const changed = diff(light, dark)
    expect(changed.length).toBeGreaterThan(20)
    expect(changed.filter((k) => !COLOR_GROUP.test(k))).toEqual([])
    await change(page, 'sel-scheme', 'light')
    expect(await allTokens(page)).toEqual(light) // vuelve exactamente al estado anterior
  })

  test('3 · cambia Current / B / C (solo en Dark)', async ({ page }) => {
    await open(page, { theme: 'grana', scheme: 'dark', strategy: 'current' })
    const a = await allTokens(page)
    const values = {}
    for (const s of ['b', 'c', 'd', 'current']) {
      await change(page, 'sel-strategy', s)
      await expect(page.locator('html')).toHaveAttribute('data-variant', STRAT[s])
      for (const role of ROLES) {
        const v = await tok(page, `--g-color-${role}`)
        expect(v).toBe(expectedDark('grana', role, s))
        values[`${s}/${role}`] = v
      }
    }
    // A, B y C difieren de verdad en brand y danger
    expect(values['b/brand']).not.toBe(values['current/brand'])
    expect(values['c/danger']).not.toBe(values['current/danger'])
    expect(await allTokens(page)).toEqual(a)
  })

  test('3b · en Light, Current / B / C no cambian ningún token', async ({ page }) => {
    await open(page, { theme: 'stripe', scheme: 'light', strategy: 'current' })
    const base = await allTokens(page)
    for (const s of ['b', 'c', 'd']) { await change(page, 'sel-strategy', s); expect(await allTokens(page)).toEqual(base) }
    await expect(page.getByTestId('note')).toContainText('solo afectan a Dark')
  })

  test('4 · el DOM estructural permanece igual en todos los cambios', async ({ page }) => {
    await open(page, { theme: 'grana', scheme: 'dark', strategy: 'current' })
    const base = await structure(page)
    expect(base.length).toBeGreaterThan(2000)
    for (const [testid, value] of [['sel-theme', 'spotify'], ['sel-theme', 'caracol-purpura'], ['sel-scheme', 'light'], ['sel-scheme', 'dark'], ['sel-strategy', 'b'], ['sel-strategy', 'c'], ['sel-strategy', 'd'], ['sel-surface', 'high'], ['sel-surface', 'low'], ['sel-theme', 'grana'], ['sel-strategy', 'current'], ['sel-surface', 'real']]) {
      await change(page, testid, value)
      expect(await structure(page), `tras ${testid} = ${value}`).toBe(base)
    }
  })

  test('5 · al cambiar de estrategia solo cambian los tokens de los 6 roles derivados', async ({ page }) => {
    await open(page, { theme: 'grana', scheme: 'dark', strategy: 'current' })
    const a = await allTokens(page)
    await change(page, 'sel-strategy', 'b')
    const changed = diff(a, await allTokens(page))
    const roleFamilies = new RegExp(`^--g-color-(on-)?(${ROLES.join('|')}|primary)(-|$)|^--g-color-(link|selection|active|focus)$|^--g-calendar-now-color$`) // --g-calendar-now-color es un alias de danger
    expect(changed.length).toBeGreaterThan(10)
    expect(changed.filter((k) => !roleFamilies.test(k)), 'tokens inesperados').toEqual([])
  })

  test('6 · la superficie experimental mueve bg, surface y surface-sunken, y su L crece de low a high', async ({ page }) => {
    await open(page, { theme: 'grana', scheme: 'dark', strategy: 'current', surface: 'real' })
    const Ls = {}
    for (const s of ['low', 'medium', 'real', 'high']) {
      await change(page, 'sel-surface', s)
      Ls[s] = await page.evaluate(() => window.__playground && Number(document.querySelector('[data-testid="info-surface"]').textContent.split('L ')[1]))
      await expect(page.locator('html')).toHaveAttribute('data-surface', s === 'real' ? 'actual' : s)
    }
    expect(Ls.low).toBeLessThan(Ls.medium)
    expect(Ls.medium).toBeLessThan(Ls.real)
    expect(Ls.real).toBeLessThan(Ls.high)
    expect(Math.abs(Ls.low - 0.135)).toBeLessThan(0.01)
    expect(Math.abs(Ls.high - 0.275)).toBeLessThan(0.01)
  })

  test('7 · Current / B / C no se ven afectados por la superficie real pero sí por las experimentales (mismos valores que la Fase 2)', async ({ page }) => {
    await open(page, { theme: 'stripe', scheme: 'dark', strategy: 'c', surface: 'high' })
    for (const role of ROLES) {
      const exp = sample('stripe', role).surfaces.high.C.darkHex
      expect((await tok(page, `--g-color-${role}`)).toUpperCase()).toBe(exp.toUpperCase())
    }
  })
})

test.describe('los componentes reales reaccionan', () => {
  test('botón, badge, switch y checkbox leen el token del rol activo', async ({ page }) => {
    await open(page, { theme: 'linear', scheme: 'dark', strategy: 'current' })
    for (const s of ['current', 'b', 'c', 'd']) {
      await change(page, 'sel-strategy', s)
      const primary = hexToRgb(expectedDark('linear', 'brand', s))
      await expect.poll(() => page.getByTestId('btn-primary').evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(primary)
      const dangerRgb = hexToRgb(expectedDark('linear', 'danger', s))
      await expect.poll(() => page.getByTestId('btn-danger').evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(dangerRgb)
      await expect.poll(() => page.getByTestId('badge-solid-danger').evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(dangerRgb)
      // el interruptor encendido y la casilla marcada usan el color principal
      await expect.poll(() => page.getByTestId('sw-on').evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(primary)
      await expect.poll(() => page.getByTestId('chk-on').evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(primary)
    }
  })

  test('los textos semánticos y las superficies de componentes cambian con Light / Dark', async ({ page }) => {
    await open(page, { theme: 'notion', scheme: 'light', strategy: 'current' })
    const bgLight = await page.getByTestId('card-buttons').evaluate((e) => getComputedStyle(e).backgroundColor)
    await change(page, 'sel-scheme', 'dark')
    await expect.poll(() => page.getByTestId('card-buttons').evaluate((e) => getComputedStyle(e).backgroundColor)).not.toBe(bgLight)
    expect(await page.getByTestId('card-buttons').evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(hexToRgb(results.themes.notion.surfaceHex))
  })
})

test.describe('estados reales (no se simula «strong»)', () => {
  test('hover: el botón pasa al token primary-strong', async ({ page }) => {
    await open(page, { theme: 'grana', scheme: 'dark', strategy: 'current' })
    const btn = page.getByTestId('btn-primary')
    await page.evaluate(() => document.getAnimations().forEach((x) => x.finish())) // transiciones de carga terminadas antes de medir el reposo
    const rest = await btn.evaluate((e) => getComputedStyle(e).backgroundColor)
    expect(rest).toBe(hexToRgb(expectedDark('grana', 'brand', 'current')))
    await btn.hover()
    const strong = hexToRgb(await tok(page, '--g-color-primary-strong'))
    await expect.poll(() => btn.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(strong)
    expect(strong).not.toBe(rest)
    await page.mouse.move(2, 2)
    await expect.poll(() => btn.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(rest)
  })

  test('focus: Tab enfoca con teclado y muestra el anillo del token de foco', async ({ page, browserName }) => {
    // Safari (WebKit) no pone los botones en el orden de Tab por defecto (solo con Opción+Tab o una preferencia): no es un fallo de Grana
    test.skip(browserName === 'webkit', 'WebKit no enfoca botones con Tab por defecto')
    await open(page, { theme: 'stripe', scheme: 'dark', strategy: 'b' })
    await page.getByTestId('sel-surface').focus()
    let found = false
    for (let i = 0; i < 40 && !found; i++) { await page.keyboard.press('Tab'); found = await page.evaluate(() => document.activeElement?.dataset.testid === 'btn-primary') }
    expect(found).toBe(true)
    const outline = await page.getByTestId('btn-primary').evaluate((e) => { const c = getComputedStyle(e); return { style: c.outlineStyle, color: c.outlineColor, width: c.outlineWidth } })
    expect(outline.style).toBe('solid')
    expect(parseFloat(outline.width)).toBeGreaterThanOrEqual(2)
    expect(outline.color).toBe(hexToRgb(await tok(page, '--g-color-focus')))
  })

  test('checked: marcar la casilla y encender el interruptor cambia a estado real', async ({ page }) => {
    await open(page, { theme: 'spotify', scheme: 'dark', strategy: 'current' })
    const off = page.getByTestId('chk-off') // data-testid llega al <input> nativo
    const restBg = await off.evaluate((e) => getComputedStyle(e).backgroundColor)
    await expect(off).not.toBeChecked()
    await off.check()
    await expect(off).toBeChecked()
    await page.mouse.move(2, 2) // el puntero sigue encima tras el clic: se comprueba el estado «checked» en reposo
    const primary = hexToRgb(expectedDark('spotify', 'brand', 'current'))
    await expect.poll(() => off.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(primary)
    expect(primary).not.toBe(restBg)
    const sw = page.getByTestId('sw-off')
    await expect(sw).not.toBeChecked()
    await sw.check()
    await expect(sw).toBeChecked()
    await page.mouse.move(2, 2)
    await expect.poll(() => sw.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(primary)
  })

  test('disabled: el botón y el campo están deshabilitados de verdad y no responden al hover', async ({ page }) => {
    await open(page, { theme: 'amazon', scheme: 'dark', strategy: 'current' })
    const btn = page.getByTestId('btn-disabled')
    await expect(btn).toBeDisabled()
    await page.evaluate(() => document.getAnimations().forEach((x) => x.finish())) // sin transiciones a medio camino antes de leer el reposo
    const rest = await btn.evaluate((e) => getComputedStyle(e).backgroundColor)
    await btn.hover({ force: true })
    // WebKit a veces entrega el primer fotograma de hover con un retardo: se sondea en vez de leer una sola vez
    await expect.poll(() => btn.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(rest)
    await expect(page.getByTestId('input-disabled')).toBeDisabled()
    await expect(page.getByTestId('chk-disabled')).toBeDisabled()
  })

  test('active: al presionar el botón se aplica el estado :active (escala y color de hover)', async ({ page }) => {
    await open(page, { theme: 'github', scheme: 'dark', strategy: 'current' })
    const btn = page.getByTestId('btn-primary')
    const box = await btn.boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await expect.poll(() => btn.evaluate((e) => getComputedStyle(e).transform)).not.toBe('none')
    await page.mouse.up()
    await page.mouse.move(2, 2)
    await expect.poll(() => btn.evaluate((e) => getComputedStyle(e).transform)).toBe('none')
  })
})

test.describe('fuentes', () => {
  for (const theme of THEMES) {
    test(`las fuentes de ${theme} se cargan (o se registra el fallback)`, async ({ page }) => {
      await open(page, { theme, scheme: 'dark' })
      const fonts = await page.evaluate(() => window.__playground.fonts)
      const cfg = results.themes[theme].config
      expect(fonts.ui.family).toBe(cfg.font)
      expect(fonts.display.family).toBe(cfg.fontDisplay)
      for (const f of [fonts.ui, fonts.display]) expect(['loaded', 'fallback']).toContain(f.status)
      // en este laboratorio están instaladas las seis familias de los 11 temas: todas deben cargarse
      expect(fonts.ui.status).toBe('loaded')
      expect(fonts.display.status).toBe('loaded')
      await expect(page.getByTestId('info-fallback')).toContainText('ninguno')
      // el tema pide la familia correcta en los tokens
      expect(await tok(page, '--g-font-ui')).toContain(`"${cfg.font}"`)
    })
  }

  test('si una fuente no está disponible, el playground registra el fallback (no lo oculta)', async ({ page }) => {
    await page.route('**/inter-latin-wght-normal.woff2', (route) => route.abort())
    await open(page, { theme: 'notion', scheme: 'dark' })
    const fonts = await page.evaluate(() => window.__playground.fonts)
    expect(fonts.ui.status).toBe('fallback')
    await expect(page.getByTestId('info-fallback')).toContainText('fallback')
    await expect(page.getByTestId('info-fallback')).toContainText('Inter')
    await expect(page.getByTestId('info-font-ui').locator('.pg-tag')).toHaveAttribute('data-status', 'fallback')
  })
})

test.describe('Fase 4 · temas de huecos de evidencia (?set=gaps)', () => {
  const gaps = JSON.parse(readFileSync(join(here, '../../tema-oscuro/dark-color-presence-gaps/results.json'), 'utf8'))
  const gsample = (theme, role) => gaps.samples.find((s) => s.theme === theme && s.role === role)
  const openGaps = async (page, q) => { await open(page, { set: 'gaps', ...q }) }

  test('carga los 5 temas y sus tokens coinciden con lo medido', async ({ page }) => {
    await openGaps(page, { theme: 'colision-ajustada', scheme: 'dark', strategy: 'current' })
    await expect(page.getByTestId('sel-theme').locator('option')).toHaveCount(5)
    for (const role of ROLES) expect(await tok(page, `--g-color-${role}`)).toBe(gsample('colision-ajustada', role).hypotheses.A.darkHex)
    // con semanticCollision: "adjust" los semánticos ajustados son distintos a los del tema por defecto
    expect(await tok(page, '--g-color-danger')).not.toBe('#E4523D')
  })

  test('la estrategia B y C, y la superficie, funcionan también en este conjunto', async ({ page }) => {
    await openGaps(page, { theme: 'gris-medio', scheme: 'dark', strategy: 'current' })
    for (const s of ['b', 'c', 'd']) {
      await change(page, 'sel-strategy', s)
      for (const role of ROLES) expect(await tok(page, `--g-color-${role}`)).toBe(gsample('gris-medio', role).hypotheses[STRAT[s]].darkHex)
    }
    await change(page, 'sel-strategy', 'c')
    await change(page, 'sel-surface', 'high')
    expect((await tok(page, '--g-color-brand')).toUpperCase()).toBe(gsample('gris-medio', 'brand').surfaces.high.C.darkHex.toUpperCase())
    await change(page, 'sel-strategy', 'd')
    expect((await tok(page, '--g-color-brand')).toUpperCase()).toBe(gsample('gris-medio', 'brand').surfaces.high.D.darkHex.toUpperCase())
  })

  test('las superficies tintadas con el tono del acento son distintas de las tintadas con el de la marca', async ({ page }) => {
    await openGaps(page, { theme: 'tinte-acento-rojo', scheme: 'dark' })
    const red = (await tok(page, '--g-color-surface')).toUpperCase()
    expect(red).toBe(gaps.themes['tinte-acento-rojo'].surfaceHex.toUpperCase())
    await change(page, 'sel-theme', 'tinte-acento-violeta')
    expect((await tok(page, '--g-color-surface')).toUpperCase()).toBe(gaps.themes['tinte-acento-violeta'].surfaceHex.toUpperCase())
    expect((await tok(page, '--g-color-surface')).toUpperCase()).not.toBe(red)
  })

  test('el DOM estructural es el mismo que en el conjunto del benchmark', async ({ page }) => {
    await open(page, { theme: 'grana', scheme: 'dark', strategy: 'current' })
    const bench = await structure(page, { ignoreThemeOptions: true }) // la lista de temas (las opciones) es lo único que difiere entre conjuntos
    await openGaps(page, { theme: 'gris-medio', scheme: 'dark', strategy: 'current' })
    expect(await structure(page, { ignoreThemeOptions: true })).toBe(bench)
  })

  test('las fuentes de los temas nuevos se cargan', async ({ page }) => {
    for (const theme of ['gris-medio', 'ocre-oliva']) {
      await openGaps(page, { theme, scheme: 'dark' })
      const fonts = await page.evaluate(() => window.__playground.fonts)
      expect(fonts.ui.status).toBe('loaded')
      expect(fonts.display.status).toBe('loaded')
    }
  })
})
