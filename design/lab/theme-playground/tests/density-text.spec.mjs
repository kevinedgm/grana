// Pieza 3 · el texto sigue la densidad (design/contracts/density.md §16.6; DECISIONS #986 a #995). Dueño: bruno.
// Componentes REALES del dist/ en una página propia y en el playground (Vue de node_modules por page.route: unpkg está
// bloqueado). Los valores esperados los calcula la función del CLI (`textDensity`, `buildTheme`), no una tabla copiada,
// salvo el criterio 1 del tema por defecto, que además se compara con la tabla de tokens.md §5.1.
//
//   1  tabla por rol (siete roles × tres pasos) en el tema por defecto y en dos temas generados (14/1,2 y 18/1,333)
//   2  piso de 12 en el playground real con <html compact> en los tres temas
//   3  cajas Δ0 frente al dist/ anterior; texto centrado y sin desbordar
//   4  anidación y prop · 5 heredados (GMenu, GDialog) · 6 <html> y clave del CLI (+ prueba negativa «solo defaults»)
//   7  unión de claves (H7) · 8 overrides · 9 P2 táctil + pieza 1 · 10 superficies fijadas Δ0 · 11 ritmo compartido
//   12 prosa, GText y GMetric · 13 icono de GBtn · 14 Δ0 sin regiones (playground) · 15 cambio en marcha · 16 --stdout
//
// Ejecutar: GRANA_PW_PORT=4208 DT_BASE_DIST=<dist/ de 5ad561d> npx playwright test tests/density-text.spec.mjs --project=chromium
// Sin DT_BASE_DIST se omiten las comparaciones con el dist/ anterior (3, 10 y 14). VERBOSE=1 imprime las cifras.
// La línea base: `git worktree add --detach <dir> 5ad561d`, enlazar node_modules y `npm run build` allí.
import { test, expect } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import { existsSync, mkdtempSync, writeFileSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const VUE = ROOT + 'node_modules/vue/dist/vue.global.js'
const DIST = process.env.GRANA_DIST_DIR || ROOT + 'packages/vue/dist/'
const BASE = process.env.DT_BASE_DIST ? process.env.DT_BASE_DIST.replace(/\/?$/, '/') : null
const PLAYGROUND = '/packages/vue/playground/index.html'
const V = !!process.env.VERBOSE
const near = (a, b, t = 0.01) => Math.abs(a - b) <= t
const cli = await import(ROOT + 'packages/cli/src/index.js')

// ---------------------------------------------------------------------------------------------------- valores esperados
const ROLES = ['caption', 'body-sm', 'body', 'title-sm', 'title', 'title-lg', 'display']
const T14 = { fontSize: 14, typeScale: 1.2 }
const T18 = { fontSize: 18, typeScale: 1.333 }
const THEMES = [['defecto', null], ['14/1,2', T14], ['18/1,333', T18]]
const css = (cfg) => (cfg ? cli.buildTheme(cfg).css : '')
/** { D: { rol: { size, line } }, C: { … } } en px, con la función del CLI sobre el tema resuelto */
function expected(cfg) {
  const tokens = cfg ? cli.buildTheme(cfg).tokens : cli.DEFAULTS
  const { C, D } = cli.textDensity(tokens)
  const pick = (o) => Object.fromEntries(ROLES.map((r) => [r, { size: cli.lengthPx(o[`--g-text-${r}-size`]), line: cli.lengthPx(o[`--g-text-${r}-line`]) }]))
  return { D: pick(D), C: pick(C) }
}
// tokens.md §5.1 (tema por defecto)
const TABLE = {
  D: { caption: [12, 16], 'body-sm': [14, 20], body: [16, 24], 'title-sm': [20, 28], title: [25, 36], 'title-lg': [31.25, 40], display: [39.06, 48] },
  C: { caption: [12, 16], 'body-sm': [13.125, 20], body: [15, 24], 'title-sm': [18.75, 28], title: [23.4375, 32], 'title-lg': [29.297, 36], display: [36.621, 44] }
}

// ---------------------------------------------------------------------------------------------------- la página
const ROLE_CSS = ROLES.map((r) => `.r-${r}{font-size:var(--g-text-${r}-size);line-height:var(--g-text-${r}-line);margin:0}`).join('')
const SCRIPTS = ['grana']
function pageHtml({ tokens = '', htmlAttr = '' } = {}) {
  return `<!doctype html><html lang="es"${htmlAttr}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/__dist/grana.css"><link rel="stylesheet" href="/__dist/fonts.css">${tokens ? `<style id="tokens">${tokens}</style>` : ''}
<style>body{margin:0;padding:8px;background:var(--g-color-bg);color:var(--g-color-text);font-family:var(--g-font-ui)}
.case{margin:0 0 12px;max-inline-size:640px}${ROLE_CSS}</style></head><body><div id="app"></div>
<script src="/__vue.js"></script>${SCRIPTS.map((s) => `<script src="/__dist/${s}.umd.js"></script>`).join('')}</body></html>`
}
let pageOpts = {}
async function routes(ctx, dist = DIST) {
  await ctx.route('**/__vue.js', (r) => r.fulfill({ path: VUE, contentType: 'application/javascript' }))
  await ctx.route('**/__dist/**', (r) => {
    const file = dist + new URL(r.request().url()).pathname.replace('/__dist/', '')
    return existsSync(file) ? r.fulfill({ path: file }) : r.fulfill({ status: 404, body: '' })
  })
  await ctx.route('**/__dt.html', (r) => r.fulfill({ contentType: 'text/html', body: pageHtml(pageOpts) }))
}
async function open(browser, { dist, touch = false, opts = {} } = {}) {
  pageOpts = opts
  const ctx = await browser.newContext(touch
    ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }
    : { viewport: { width: 1280, height: 900 } })
  await routes(ctx, dist)
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  return { ctx, page, errors }
}
const SETUP = `
  const { createApp, reactive } = Vue
  const s = reactive({ name: 'Ada', plan: 'pro', menu: false, dlg: false, dlg2: false })
  const plans = [{ value: 'basic', label: 'Básico' }, { value: 'pro', label: 'Pro' }]
  const items = [{ id: 'a', label: 'Renombrar' }, { id: 'b', label: 'Duplicar' }]
  const facts = [{ label: 'Lote', value: 'L-2026-0042' }, { label: 'Cliente', value: 'Mezcalería del Valle' }, { label: 'Cantidad', value: '1 200 botellas' }, { label: 'Agave', value: 'Espadín' }, { label: 'Estado', value: 'En reposo' }, { label: 'Destilador', value: 'Maestro Juan Pérez' }]
  const crumbs = [{ label: 'Inicio', href: '#a' }, { label: 'Producción y trazabilidad', href: '#b' }, { label: 'Lotes de destilación', href: '#c' }, { label: 'Lote L-2026-0042 del Valle', href: '#d' }, { label: 'Detalle de la etiqueta' }]
`
const BINDINGS = 's, plans, items, facts, crumbs'
async function mount(page, template) {
  await page.goto('/__dt.html')
  await page.evaluate(async ({ template, SETUP, BINDINGS }) => {
    const fn = new Function('template', `${SETUP}
      const app = createApp({ template, setup: () => ({ ${BINDINGS} }) })
      app.config.warnHandler = () => {}
      window.__toaster = Grana.createToaster(); app.use(window.__toaster)
      app.use(Grana)
      window.__s = s
      app.mount('#app'); return app`)
    window.__app = fn(template)
    await document.fonts.ready
  }, { template, SETUP, BINDINGS })
  await page.waitForSelector('.case', { state: 'attached' })
  await page.waitForTimeout(150)
}
const rolesHtml = (id, attr = '') => `<div class="case" id="${id}" ${attr}>${ROLES.map((r) => `<p class="r-${r}">Texto ${r}</p>`).join('')}</div>`
const readRoles = (page, sel) => page.evaluate(({ sel, ROLES }) => {
  const box = document.querySelector(sel)
  return Object.fromEntries(ROLES.map((r) => { const cs = getComputedStyle(box.querySelector(`.r-${r}`)); return [r, { size: parseFloat(cs.fontSize), line: parseFloat(cs.lineHeight) }] }))
}, { sel, ROLES })
const fs = (page, sel) => page.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return null; const cs = getComputedStyle(e); return { size: parseFloat(cs.fontSize), line: parseFloat(cs.lineHeight) } }, sel)
const hgt = (page, sel) => page.evaluate((sel) => document.querySelector(sel)?.getBoundingClientRect().height ?? null, sel)
function expectRoles(got, want, msg) {
  for (const r of ROLES) {
    expect.soft(near(got[r].size, want[r].size), `${msg} ${r} tamaño ${got[r].size} = ${want[r].size}`).toBe(true)
    expect.soft(near(got[r].line, want[r].line), `${msg} ${r} renglón ${got[r].line} = ${want[r].line}`).toBe(true)
  }
}

test.beforeEach(({ browserName }) => { test.skip(browserName !== 'chromium' && !process.env.DENSITY_ALL, 'encargo: solo Chromium aquí (DENSITY_ALL=1 para los tres motores)') })

// ---------------------------------------------------------------------------------------------------- 1
test('criterio 1 · tabla por rol en los tres pasos: tema por defecto (= tokens.md §5.1) y dos temas generados', async ({ browser }) => {
  // La función del CLI reproduce la tabla del contrato
  const e0 = expected(null)
  for (const step of ['D', 'C']) for (const r of ROLES) {
    expect(near(e0[step][r].size, TABLE[step][r][0])).toBe(true)
    expect(e0[step][r].line).toBe(TABLE[step][r][1])
  }
  for (const [name, cfg] of THEMES) {
    const { ctx, page } = await open(browser, { opts: { tokens: css(cfg) } })
    await mount(page, rolesHtml('d', 'data-g-density="default"') + rolesHtml('f', 'data-g-density="comfortable"') + rolesHtml('c', 'data-g-density="compact"') + rolesHtml('p'))
    const e = expected(cfg)
    const got = { d: await readRoles(page, '#d'), f: await readRoles(page, '#f'), c: await readRoles(page, '#c'), p: await readRoles(page, '#p') }
    if (V) console.log('1', name, JSON.stringify(got.c))
    expectRoles(got.d, e.D, `1 ${name} default`)
    expectRoles(got.f, e.D, `1 ${name} comfortable`)
    expectRoles(got.c, e.C, `1 ${name} compact`)
    expectRoles(got.p, e.D, `1 ${name} sin región`)
    if (!cfg) {
      const t = (k) => Object.fromEntries(ROLES.map((r) => [r, { size: TABLE[k][r][0], line: TABLE[k][r][1] }]))
      expectRoles(got.c, t('C'), '1 §5.1 compact')
      expectRoles(got.d, t('D'), '1 §5.1 default')
    }
    await ctx.close()
  }
})

// ---------------------------------------------------------------------------------------------------- 2
async function routePlayground(ctx, dist = DIST) {
  await ctx.route(/unpkg\.com\/vue@3\/dist\/vue\.global\.js/, (r) => r.fulfill({ path: VUE, contentType: 'application/javascript' }))
  if (dist !== DIST) {
    await ctx.route('**/packages/vue/dist/**', (r) => {
      const file = dist + new URL(r.request().url()).pathname.replace(/^.*\/packages\/vue\/dist\//, '')
      return existsSync(file) ? r.fulfill({ path: file }) : r.fulfill({ status: 404, body: '' })
    })
  }
}
async function openPlayground(browser, { dist = DIST, tokens = '', htmlDensity = null, query = '' } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
  await routePlayground(ctx, dist)
  const page = await ctx.newPage()
  await page.goto(PLAYGROUND + query)
  await page.waitForSelector('.g-btn', { timeout: 60_000 })
  if (tokens) await page.addStyleTag({ content: tokens })
  // Tras cargar (en un script de inicio aún no hay documentElement)
  if (htmlDensity) await page.evaluate((d) => document.documentElement.setAttribute('data-g-density', d), htmlDensity)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(600)
  return { ctx, page }
}

test('criterio 2 · piso de 12: ningún texto del playground mide menos de 12 px en compact, en los tres temas', async ({ browser }) => {
  test.setTimeout(180_000)
  for (const [name, cfg] of THEMES) {
    const { ctx, page } = await openPlayground(browser, { tokens: css(cfg), htmlDensity: 'compact' })
    expect(await page.evaluate(() => document.documentElement.getAttribute('data-g-density')), '2 <html compact>').toBe('compact')
    const r = await page.evaluate(() => {
      const bad = []
      let n = 0
      for (const el of document.querySelectorAll('body *')) {
        if (!['#text'].some(() => [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim()))) continue
        const b = el.getBoundingClientRect()
        if (b.width <= 1 || b.height <= 1) continue // texto oculto accesible o sin caja
        n++
        const f = parseFloat(getComputedStyle(el).fontSize)
        if (f === 0) continue // texto apagado a propósito (p. ej. el número del indicador de GStepper con icono)
        if (f < 12 - 0.01) bad.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} ${f}px «${el.textContent.trim().slice(0, 24)}»`)
      }
      return { n, bad: [...new Set(bad)].slice(0, 20) }
    })
    if (V) console.log('2', name, r.n)
    expect.soft(r.n, `2 ${name}: elementos con texto medidos`).toBeGreaterThan(500)
    expect.soft(r.bad, `2 ${name}: texto < 12 px en compact`).toEqual([])
    await ctx.close()
  }
})

// ---------------------------------------------------------------------------------------------------- 3
const BOXES = `
  <div class="case" id="b3">${['xs', 'sm', 'md', 'lg', 'xl'].map((z) => `<g-btn class="b-${z}" size="${z}">Guardar cambios</g-btn>`).join(' ')}</div>
  <div class="case" id="i3"><g-input label="Nombre" v-model="s.name"></g-input></div>
  <div class="case" id="s3"><g-select label="Plan" v-model="s.plan" :options="plans"></g-select></div>
  <div class="case" id="m3"><g-menu v-model="s.menu" :items="items" label="Acciones"><template #trigger="{ attrs }"><g-btn v-bind="attrs">Acciones</g-btn></template></g-menu></div>`
async function boxes(browser, { dist, tokens, step }) {
  const { ctx, page } = await open(browser, { dist, opts: { tokens } })
  await mount(page, `<section id="w" data-g-density="${step}">${BOXES}</section>`)
  await page.evaluate(() => { window.__s.menu = true })
  await page.waitForSelector('.g-menu__item', { state: 'visible' })
  await page.waitForTimeout(300)
  const r = await page.evaluate(() => {
    const box = (el) => el ? Math.round(el.getBoundingClientRect().height * 100) / 100 : null
    // Sin desbordar: cada caja de texto dentro de la caja visible del control (el área táctil por fuera no cuenta)
    const fit = (el) => {
      if (!el) return null
      const o = el.getBoundingClientRect()
      const texts = [...el.querySelectorAll('*'), el].filter((n) => n.tagName === 'INPUT' || [...n.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim()))
      return texts.length > 0 && texts.every((n) => { const b = n.getBoundingClientRect(); return b.top >= o.top - 0.5 && b.bottom <= o.bottom + 0.5 })
    }
    const center = (outer, inner) => { const o = outer.getBoundingClientRect(); const i = inner.getBoundingClientRect(); return Math.abs((o.top + o.bottom) / 2 - (i.top + i.bottom) / 2) }
    const out = {}
    for (const z of ['xs', 'sm', 'md', 'lg', 'xl']) {
      const b = document.querySelector(`#b3 .b-${z}`)
      out[`btn-${z}`] = { h: box(b), fit: fit(b), off: center(b, b.querySelector('.g-btn__label')) }
    }
    const ic = document.querySelector('#i3 .g-input__control')
    out.input = { h: box(document.querySelector('#i3 [data-g-tooltip-box]') || ic), fit: fit(ic) }
    const sc = document.querySelector('#s3 .g-select__control')
    out.select = { h: box(sc), fit: fit(sc) }
    const mi = document.querySelector('.g-menu__item')
    out.menu = { h: box(mi), fit: fit(mi) }
    return out
  })
  await ctx.close()
  return r
}
test('criterio 3 · cajas Δ0 frente al dist/ anterior en los tres pasos y temas; texto centrado (≤ 1 px) y sin desbordar', async ({ browser }) => {
  test.skip(!BASE, 'sin DT_BASE_DIST (dist/ de 5ad561d)')
  test.setTimeout(240_000)
  const oldCli = await import(BASE.replace(/packages\/vue\/dist\/$/, '') + 'packages/cli/src/index.js')
  for (const [name, cfg] of THEMES) {
    for (const step of ['default', 'comfortable', 'compact']) {
      const now = await boxes(browser, { tokens: css(cfg), step })
      const was = await boxes(browser, { dist: BASE, tokens: cfg ? oldCli.buildTheme(cfg).css : '', step })
      if (V) console.log('3', name, step, JSON.stringify(now))
      for (const k of Object.keys(now)) {
        // Las alturas de la pieza 2 (md, campos, item de menú) no cambian; un tamaño cuya caja ya empujaba el texto (con un
        // renglón del tema mayor que su caja, p. ej. `sm` con 18/1,333) puede quedar por debajo de antes, nunca por encima
        if (['btn-md', 'input', 'select', 'menu'].includes(k)) expect.soft(near(now[k].h, was[k].h, 0.02), `3 ${name} ${step} ${k}: caja ${now[k].h} = ${was[k].h}`).toBe(true)
        else expect.soft(now[k].h, `3 ${name} ${step} ${k}: caja ${now[k].h} ≤ ${was[k].h}`).toBeLessThanOrEqual(was[k].h + 0.02)
        expect.soft(now[k].fit, `3 ${name} ${step} ${k}: sin desbordar`).toBe(true)
        if ('off' in now[k]) expect.soft(now[k].off, `3 ${name} ${step} ${k}: texto centrado`).toBeLessThanOrEqual(1)
      }
    }
  }
})

// ---------------------------------------------------------------------------------------------------- 4
test('criterio 4 · anidación y prop', async ({ browser }) => {
  const { ctx, page } = await open(browser)
  await mount(page, `
    <div data-g-density="compact"><div data-g-density="default"><p class="r-body-sm" id="n1">a</p></div></div>
    <div data-g-density="comfortable"><div data-g-density="compact"><p class="r-body-sm" id="n2">b</p></div></div>
    <div data-g-density="compact"><p class="r-body-sm" id="n3a">c</p><div data-g-density="default"><p class="r-body-sm" id="n3b">d</p><div data-g-density="compact"><p class="r-body-sm" id="n3c">e</p></div></div></div>
    <div class="case" data-g-density="compact"><g-btn id="p1" density="default">Guardar</g-btn></div>
    <div class="case"><g-btn id="p2" density="compact">Guardar</g-btn></div>`)
  const v = async (s) => (await fs(page, s)).size
  expect.soft(await v('#n1'), '4 default dentro de compact').toBeCloseTo(14, 2)
  expect.soft(await v('#n2'), '4 compact dentro de comfortable').toBeCloseTo(13.125, 2)
  const lv = [await v('#n3a'), await v('#n3b'), await v('#n3c')]
  expect.soft(near(lv[0], 13.125) && near(lv[1], 14) && near(lv[2], 13.125), `4 tres niveles alternos ${lv}`).toBe(true)
  expect.soft(await v('#p1 .g-btn__label'), '4 GBtn density="default" en región compacta: texto').toBeCloseTo(14, 2)
  expect.soft(near(await hgt(page, '#p1'), 36, 0.05), '4 … y caja 36').toBe(true)
  expect.soft(await v('#p2 .g-btn__label'), '4 GBtn density="compact" en la página: texto').toBeCloseTo(13.125, 2)
  expect.soft(near(await hgt(page, '#p2'), 27, 0.05), '4 … y caja 27').toBe(true)
  await ctx.close()
})

// ---------------------------------------------------------------------------------------------------- 5
test('criterio 5 · heredados: GMenu abierto desde una región compacta y GDialog escrito en ella', async ({ browser }) => {
  const { ctx, page } = await open(browser)
  const dlg = (id, model, attr = '') => `<g-dialog id="${id}" v-model="s.${model}" title="Editar lote" description="Cambia los datos del lote" close-label="Cerrar" ${attr}><p class="dl-body">Cuerpo del diálogo</p><g-input label="Nombre" hint="Como aparece en la etiqueta" v-model="s.name"></g-input></g-dialog>`
  await mount(page, `<section class="case" data-g-density="compact">
    <span id="mt"><g-menu v-model="s.menu" :items="items" label="Acciones"><template #trigger="{ attrs }"><g-btn v-bind="attrs">Acciones</g-btn></template></g-menu></span>
    ${dlg('dc', 'dlg')}${dlg('dd', 'dlg2', 'density="default"')}</section>`)
  await page.evaluate(() => { window.__s.menu = true })
  await page.waitForSelector('.g-menu__item', { state: 'visible' })
  const trig = await fs(page, '#mt .g-btn__label')
  const item = await page.evaluate(() => { const el = document.querySelector('.g-menu__item'); const t = [...el.querySelectorAll('*')].find((n) => [...n.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) || el; return parseFloat(getComputedStyle(t).fontSize) })
  expect.soft(trig.size, '5 disparador').toBeCloseTo(13.125, 2)
  expect.soft(item, '5 item del menú = disparador').toBeCloseTo(trig.size, 2)
  await page.evaluate(() => { window.__s.menu = false })
  const chain = async (id) => {
    const r = []
    for (const s of [`#${id} .g-dialog__title`, `#${id} .dl-body`, `#${id} .g-input__label`, `#${id} .g-input__message`]) r.push((await fs(page, s))?.size ?? null)
    return r
  }
  await page.evaluate(() => { window.__s.dlg = true })
  await page.waitForSelector('#dc[open]')
  const c = await chain('dc')
  await page.evaluate(() => { window.__s.dlg = false; window.__s.dlg2 = true })
  await page.waitForSelector('#dd[open]')
  const d = await chain('dd')
  if (V) console.log('5', trig, item, c, d)
  for (const [got, want, n] of [[c, [18.75, 15, 13.125, 12], 'sin prop'], [d, [20, 16, 14, 12], 'density="default"']]) {
    got.forEach((g, i) => expect.soft(near(g, want[i]), `5 GDialog ${n}: nivel ${i + 1} ${g} = ${want[i]}`).toBe(true))
  }
  await ctx.close()
})

// ---------------------------------------------------------------------------------------------------- 6
// El CSS del tema sin sus reglas de región (para la prueba negativa: así se vería con un CLI que no las emite)
const withoutRegions = (t) => t.split('\n').filter((l) => !/^\s*\[data-g-density/.test(l)).join('\n').replace(/@media \(pointer: coarse\) \{\n\}\n?/g, '')
test('criterio 6 · <html> y clave del CLI; la prueba negativa «solo defaults»', async ({ browser }) => {
  const e0 = expected(null)
  const e14 = expected(T14)
  const run = async (opts, tpl = rolesHtml('p')) => { const { ctx, page } = await open(browser, { opts }); await mount(page, tpl); const r = { p: await readRoles(page, '#p'), x: (await page.$('#x')) ? await readRoles(page, '#x') : null, y: (await page.$('#y')) ? await readRoles(page, '#y') : null }; await ctx.close(); return r }
  const HTML = ' data-g-density="compact"'
  expectRoles((await run({ htmlAttr: HTML })).p, e0.C, '6 <html compact> sin tema')
  const t14 = css(T14)
  const withRules = await run({ htmlAttr: HTML, tokens: t14 }, rolesHtml('p') + rolesHtml('x', 'data-g-density="compact"'))
  expectRoles(withRules.p, e14.C, '6 <html compact> con tema 14/1,2')
  expectRoles(withRules.x, e14.C, '6 región compacta con tema 14/1,2')
  // Negativa: sin las reglas de región del CLI, <html compact> da los del :root del tema y una región, los del tema por defecto
  const neg = await run({ htmlAttr: HTML, tokens: withoutRegions(t14) }, rolesHtml('p') + rolesHtml('x', 'data-g-density="compact"'))
  expectRoles(neg.p, e14.D, '6 negativa: <html compact> sin reglas = :root del tema')
  expect.soft(near(neg.x.body.size, e0.C.body.size) && !near(neg.x.body.size, e14.C.body.size), '6 negativa: la región toma el compacto del tema por defecto').toBe(true)
  // H7 visto desde fuera: el renglón de title de la región es el compacto del tema por defecto (32), no el del tema (28)
  expect.soft([neg.x.title.line, e14.C.title.line], '6 negativa: renglón de title del tema por defecto').toEqual([e0.C.title.line, 28])
  // Clave compact sin tipografía: página compacta; <html default> sobre la clave → paso 1; comfortable dentro → paso 1
  const key = css({ density: 'compact' })
  const k = await run({ tokens: key }, rolesHtml('p') + rolesHtml('x', 'data-g-density="comfortable"'))
  expectRoles(k.p, e0.C, '6 clave compact (sin tipografía) = §5.1')
  expectRoles(k.x, e0.D, '6 clave compact: región comfortable dentro → paso 1')
  expectRoles((await run({ tokens: key, htmlAttr: ' data-g-density="default"' })).p, e0.D, '6 <html default> sobre la clave → paso 1')
  // Clave compact con tipografía: los del tema
  const kt = await run({ tokens: css({ ...T14, density: 'compact' }) }, rolesHtml('p') + rolesHtml('x', 'data-g-density="default"'))
  expectRoles(kt.p, e14.C, '6 clave compact + tema 14/1,2')
  expectRoles(kt.x, e14.D, '6 clave compact + tema: región default dentro')
})

// ---------------------------------------------------------------------------------------------------- 7 y 8
test('criterios 7 y 8 · unión de claves (H7) y overrides', async ({ browser }) => {
  {
    const { ctx, page } = await open(browser, { opts: { tokens: css(T14) } })
    await mount(page, rolesHtml('x', 'data-g-density="compact"'))
    const line = await page.evaluate(() => getComputedStyle(document.querySelector('#x')).getPropertyValue('--g-text-title-line').trim())
    expect.soft(line, '7 tema 14/1,2: --g-text-title-line en compact = el del tema (28 px), no 32').toBe('1.75rem')
    expect.soft((await readRoles(page, '#x')).title.line, '7 renglón de title').toBe(28)
    await ctx.close()
  }
  {
    const { ctx, page } = await open(browser, { opts: { tokens: css({ overrides: { '--g-text-body-size': '1.125rem' } }) } })
    await mount(page, `<div data-g-density="compact">${rolesHtml('c')}<div data-g-density="default">${rolesHtml('d')}</div></div>`)
    expect.soft((await readRoles(page, '#d')).body.size, '8 región default dentro de una compacta → 18').toBeCloseTo(18, 2)
    expect.soft((await readRoles(page, '#c')).body.size, '8 región compacta → 16,875').toBeCloseTo(16.875, 2)
    await ctx.close()
  }
  {
    const v = 'clamp(1rem, 0.9rem + 0.5vw, 1.25rem)'
    const { ctx, page } = await open(browser, { opts: { tokens: css({ overrides: { '--g-text-body-size': v } }) } })
    await mount(page, rolesHtml('d', 'data-g-density="default"') + rolesHtml('f', 'data-g-density="comfortable"') + rolesHtml('c', 'data-g-density="compact"'))
    const sizes = [(await readRoles(page, '#d')).body.size, (await readRoles(page, '#f')).body.size, (await readRoles(page, '#c')).body.size]
    expect.soft(new Set(sizes).size, `8 clamp(): igual en los tres pasos (${sizes})`).toBe(1)
    await ctx.close()
  }
})

// ---------------------------------------------------------------------------------------------------- 9
test('criterio 9 · P2 táctil: regiones, <html> y clave vuelven al paso 1; la prop no cede; pieza 1 intacta', async ({ browser }) => {
  const e0 = expected(null)
  const tpl = `${rolesHtml('x', 'data-g-density="compact"')}${rolesHtml('p')}
    <div class="case"><g-btn id="tb" density="compact">Guardar</g-btn></div>
    <div class="case" id="ti"><g-input density="compact" label="Nombre" v-model="s.name"></g-input></div>`
  for (const [opts, label] of [[{}, 'región'], [{ htmlAttr: ' data-g-density="compact"' }, '<html compact>'], [{ tokens: css({ density: 'compact' }) }, 'clave compact'], [{ tokens: css(T14), htmlAttr: ' data-g-density="compact"' }, '<html compact> + tema 14/1,2']]) {
    const { ctx, page } = await open(browser, { touch: true, opts })
    await mount(page, tpl)
    const coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches)
    test.skip(!coarse, 'sin pointer: coarse emulado')
    const e = opts.tokens && opts.tokens.includes('0.7656rem') ? expected(T14) : e0
    expectRoles(await readRoles(page, label === 'región' ? '#x' : '#p'), e.D, `9 ${label}: texto del paso 1`)
    expect.soft((await fs(page, '#tb .g-btn__label')).size, `9 ${label}: GBtn density="compact" no cede`).toBeCloseTo(e.C['body-sm'].size, 2)
    expect.soft((await fs(page, '#ti input')).size, `9 ${label}: GInput compact, texto editable 16`).toBeCloseTo(16, 2)
    const box = await hgt(page, '#ti .g-input__control')
    expect.soft(box, `9 ${label}: GInput compact, caja ≥ 44`).toBeGreaterThanOrEqual(43.9)
    await ctx.close()
  }
})

// ---------------------------------------------------------------------------------------------------- 10
async function fixedText(browser, { dist, opts = {}, inDialog = false }) {
  const { ctx, page } = await open(browser, { dist, opts })
  await mount(page, `<div class="case"><g-toaster></g-toaster>${inDialog ? '<g-dialog id="tdl" v-model="s.dlg" density="compact" title="Diálogo" close-label="Cerrar"><p>x</p></g-dialog>' : ''}</div>`)
  if (inDialog) { await page.evaluate(() => { window.__s.dlg = true }); await page.waitForSelector('#tdl[open]') }
  await page.evaluate(() => { window.__toaster.show({ title: 'Guardado', description: 'El lote quedó registrado', action: { label: 'Deshacer', onClick () {} } }) })
  await page.waitForTimeout(400)
  const r = await page.evaluate(() => [...document.querySelectorAll('.g-toaster *')].filter((n) => [...n.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())).map((n) => { const cs = getComputedStyle(n); return `${n.className}:${cs.fontSize}/${cs.lineHeight}` }))
  await ctx.close()
  return r
}
async function islandText(browser, { dist, tokens = '', htmlDensity = null }) {
  const { ctx, page } = await openPlayground(browser, { dist, tokens, htmlDensity, query: '?status=seed' })
  // Solo la isla: GStatusMark es contenido de la página (va junto a su control) y sigue la densidad
  const r = await page.evaluate(() => [...document.querySelectorAll('.g-status-island *')].filter((n) => [...n.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())).map((n) => { const cs = getComputedStyle(n); return `${String(n.className).split(' ')[0]}:${cs.fontSize}/${cs.lineHeight}` }))
  await ctx.close()
  return r
}
test('criterio 10 · superficies fijadas Δ0: avisos e isla con <html compact>, con la clave y dentro de un diálogo compacto', async ({ browser }) => {
  test.skip(!BASE, 'sin DT_BASE_DIST (dist/ de 5ad561d)')
  test.setTimeout(180_000)
  const was = await fixedText(browser, { dist: BASE })
  expect(was.length, '10 el aviso pinta texto').toBeGreaterThan(0)
  for (const [n, a] of [['<html compact>', { opts: { htmlAttr: ' data-g-density="compact"' } }], ['clave compact', { opts: { tokens: css({ density: 'compact' }) } }], ['diálogo compacto', { inDialog: true }]]) {
    expect.soft(await fixedText(browser, a), `10 GToaster ${n}`).toEqual(was)
  }
  const iWas = await islandText(browser, { dist: BASE })
  expect(iWas.length, '10 la isla pinta texto').toBeGreaterThan(0)
  expect.soft(await islandText(browser, { htmlDensity: 'compact' }), '10 isla <html compact>').toEqual(iWas)
  expect.soft(await islandText(browser, { tokens: css({ density: 'compact' }) }), '10 isla clave compact').toEqual(iWas)
})

// ---------------------------------------------------------------------------------------------------- 11 a 13
test('criterios 11 a 13 · ritmo compartido, prosa/GText/GMetric e icono de GBtn', async ({ browser }) => {
  const { ctx, page } = await open(browser)
  const five = 'Uno<br>Dos<br>Tres<br>Cuatro<br>Cinco'
  await mount(page, `${rolesHtml('d', 'data-g-density="default"')}${rolesHtml('f', 'data-g-density="comfortable"')}${rolesHtml('c', 'data-g-density="compact"')}
    <div style="display:flex;gap:16px;align-items:flex-start">
      <p id="pd" data-g-density="default" style="margin:0;font:400 var(--g-text-body-size)/var(--g-text-body-line) var(--g-font-ui)">${five}</p>
      <p id="pc" data-g-density="compact" style="margin:0;font:400 var(--g-text-body-size)/var(--g-text-body-line) var(--g-font-ui)">${five}</p></div>
    <div class="case" data-g-density="compact"><span id="gt"><g-text size="body">Texto de lectura</g-text></span>
      <div id="gm"><g-metric label="Ingresos" value="12 400"></g-metric></div><span id="bi"><g-btn><template #prepend><g-icon name="plus"></g-icon></template>Añadir</g-btn></span></div>
    <div class="case"><div id="gm0"><g-metric label="Ingresos" value="12 400"></g-metric></div><span id="bi0"><g-btn><template #prepend><g-icon name="plus"></g-icon></template>Añadir</g-btn></span></div>`)
  const d = await readRoles(page, '#d')
  const f = await readRoles(page, '#f')
  const c = await readRoles(page, '#c')
  for (const [r, l] of [['caption', 16], ['body-sm', 20], ['body', 24], ['title-sm', 28]]) {
    expect.soft([d[r].line, f[r].line, c[r].line], `11 ${r}: mismo renglón en los tres pasos`).toEqual([l, l, l])
  }
  const [hd, hc] = [await hgt(page, '#pd'), await hgt(page, '#pc')]
  expect.soft(near(hd, 120, 0.05) && near(hc, 120, 0.05), `11 cinco líneas body lado a lado: ${hd} = ${hc} = 120`).toBe(true)
  const gt = await page.evaluate(() => { const el = document.querySelector('#gt .g-text'); const cs = getComputedStyle(el); return { size: parseFloat(cs.fontSize), line: parseFloat(cs.lineHeight) } })
  expect.soft(gt, '12 GText body en compact → 15/24').toEqual({ size: 15, line: 24 })
  expect.soft((await fs(page, '#pc')).size, '12 prosa de la aplicación en compact → 15').toBe(15)
  const mv = (await fs(page, '#gm .g-metric__value')).size
  const mv0 = (await fs(page, '#gm0 .g-metric__value')).size
  expect.soft(near(mv, mv0 * 15 / 16, 0.02), `12 GMetric baja con su rol: ${mv0} → ${mv}`).toBe(true)
  const icon = async (s) => page.evaluate((s) => { const i = document.querySelector(`${s} svg, ${s} .g-icon`); return i ? i.getBoundingClientRect().height : null }, s)
  const [i0, i1] = [await icon('#bi0'), await icon('#bi')]
  if (V) console.log('13', i0, i1)
  expect.soft(near(i0, 16.1, 0.1), `13 icono md default ${i0} ≈ 16,1`).toBe(true)
  expect.soft(near(i1, 15.1, 0.1), `13 icono md compact ${i1} ≈ 15,1`).toBe(true)
  await ctx.close()
})

// ---------------------------------------------------------------------------------------------------- 14
async function snapshotPlayground(browser, dist) {
  const { ctx, page } = await openPlayground(browser, { dist })
  const r = await page.evaluate(() => {
    const regions = [...document.querySelectorAll('[data-g-density], [class*="--density-"]')]
    const out = []
    const all = document.querySelectorAll('body *')
    all.forEach((el, i) => {
      if (el.closest('[data-g-density], [class*="--density-"]')) return
      if (regions.some((g) => el.contains(g))) { out.push([i, el.tagName, null]); return } // la caja de un antecesor de una región sí puede cambiar
      const cs = getComputedStyle(el)
      const b = el.getBoundingClientRect()
      // Una caja que gira (los cargadores de GInput, GSelect…) cambia de rectángulo con el tiempo: solo se compara su texto
      let spin = false
      for (let a = el, k = 0; a && k < 4; a = a.parentElement, k++) if (a.getAnimations().length) spin = true
      out.push([i, el.tagName, `${cs.fontSize}/${cs.lineHeight}/${cs.letterSpacing}`, spin ? 0 : Math.round(b.width * 10) / 10, spin ? 0 : Math.round(b.height * 10) / 10])
    })
    return { n: all.length, regions: regions.length, out }
  })
  await ctx.close()
  return r
}
test('criterio 14 · Δ0 sin regiones: el playground mide lo mismo que con el dist/ anterior; tokens.css Δ0 bytes', async ({ browser }) => {
  test.skip(!BASE, 'sin DT_BASE_DIST (dist/ de 5ad561d)')
  test.setTimeout(180_000)
  const oldCli = await import(BASE.replace(/packages\/vue\/dist\/$/, '') + 'packages/cli/src/index.js')
  for (const cfg of [{}, { brand: '#0B1F4D', space: 5, radius: 8 }, { density: 'comfortable' }]) {
    expect.soft(cli.buildTheme(cfg).css, `14 tokens.css Δ0 bytes ${JSON.stringify(cfg)}`).toBe(oldCli.buildTheme(cfg).css)
  }
  const was = await snapshotPlayground(browser, BASE)
  const now = await snapshotPlayground(browser, DIST)
  expect(now.n, '14 mismo marcado').toBe(was.n)
  const diff = []
  const prev = new Map(was.out.map((x) => [x[0], x]))
  for (const x of now.out) {
    const y = prev.get(x[0])
    if (!y || x[2] === null) continue
    if (x[2] !== y[2]) diff.push(`${x[1]}#${x[0]} texto ${y[2]} → ${x[2]}`)
    else if (Math.abs(x[3] - y[3]) > 0.15 || Math.abs(x[4] - y[4]) > 0.15) diff.push(`${x[1]}#${x[0]} caja ${y[3]}×${y[4]} → ${x[3]}×${x[4]}`)
  }
  if (V) console.log('14', now.n, now.regions, now.out.length, diff.slice(0, 20))
  expect(now.out.length, '14 elementos comparados').toBeGreaterThan(1000)
  expect(diff.slice(0, 30), `14 Δ0 fuera de las regiones (${now.regions} regiones de demostración excluidas)`).toEqual([])
})

// ---------------------------------------------------------------------------------------------------- 15
test('criterio 15 · cambio en marcha: siguiente cuadro, sin transiciones de texto, GSummary y GBreadcrumbs se reajustan', async ({ browser }) => {
  const { ctx, page } = await open(browser)
  const tpl = `<section id="live">${rolesHtml('p')}
    <div class="case" id="sum" style="inline-size:540px"><g-summary title="Lote L-2026-0042 del Valle" :facts="facts" layout="row"></g-summary></div>
    <div class="case" id="bc" style="inline-size:396px"><g-breadcrumbs :items="crumbs" :labels="{ nav: 'Ruta', up: 'Subir a {label}', path: 'Ruta hasta {label}' }"></g-breadcrumbs></div></section>`
  await mount(page, tpl)
  await page.evaluate(async () => {
    const wait = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    for (const id of ['#sum', '#bc']) { const el = document.querySelector(id); const w = el.style.inlineSize; el.style.inlineSize = `${parseFloat(w) - 60}px`; await wait(); el.style.inlineSize = w; await wait() }
  })
  // Estado de medida: lo que GSummary deja fuera («+N», data-terse, data-tight) y la etapa de GBreadcrumbs con sus nombres
  // recortados. Anchos elegidos en el umbral (barrido): a 540 px la ficha deja fuera 4 datos en default y 3 en compact (en el centro del tramo: en su borde, 360 px, la medida de GSummary depende del camino, también sin densidad);
  // a 396 px la ruta va en `shrink` en default y en `liquid` en compact
  const STATE = () => {
    const sum = document.querySelector('#sum .g-summary')
    const bc = document.querySelector('#bc .g-breadcrumbs')
    // Verdad geométrica de la ficha: un dato marcado está fuera de la caja que recorta y uno sin marcar, dentro; «+N» = marcados
    const clip = sum.querySelector('.g-summary__facts').getBoundingClientRect()
    const facts = [...sum.querySelectorAll('.g-summary__fact:not(.is-anchor)')]
    const lies = facts.filter((f) => { const b = f.getBoundingClientRect(); const out = b.top >= clip.bottom - 1 || b.bottom > clip.bottom + 1 || b.right > clip.right + 1; return out !== f.hasAttribute('data-clipped') }).length
    const more = sum.querySelector('.g-summary__more')
    const n = facts.filter((f) => f.hasAttribute('data-clipped')).length
    const plus = !more || more.hidden ? 0 : Number(more.textContent.replace('+', ''))
    return { summary: { lies, plusMatches: plus === n || sum.hasAttribute('data-tight'), clipped: n }, stage: bc.getAttribute('data-stage'), bcClipped: bc.querySelectorAll(':scope > ol > [data-clipped]').length }
  }
  const steps = []
  for (const [target, d] of [['html', 'compact'], ['html', 'default'], ['#live', 'compact'], ['#live', 'comfortable']]) {
    const r = await page.evaluate(async ({ target, d, STATE }) => {
      const st = new Function(`return (${STATE})()`)
      const el = target === 'html' ? document.documentElement : document.querySelector(target)
      document.documentElement.removeAttribute('data-g-density'); document.querySelector('#live').removeAttribute('data-g-density')
      el.setAttribute('data-g-density', d)
      const trans = () => document.getAnimations().filter((a) => a instanceof CSSTransition && /^(font-size|line-height|letter-spacing|font)$/.test(a.transitionProperty)).map((a) => `${a.transitionProperty} @ ${a.effect?.target?.className}`)
      await new Promise((r) => requestAnimationFrame(r))
      const size1 = parseFloat(getComputedStyle(document.querySelector('#p .r-body')).fontSize)
      const t = trans()
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      return { size1, t, state: st() }
    }, { target, d, STATE: STATE.toString() })
    steps.push([target, d, r])
    expect.soft(r.t, `15 sin transiciones de texto (${target} → ${d})`).toEqual([])
    expect.soft(r.size1, `15 ${target} → ${d}: el texto cambia en el cuadro siguiente`).toBeCloseTo(d === 'compact' ? 15 : 16, 2)
  }
  await ctx.close()
  // Referencia: la misma página montada ya en cada paso, con una medida desde cero tras cargar las fuentes (se estrecha y
  // se vuelve a ensanchar: la medida del montaje puede ser anterior a la fuente del «+N» y GSummary no la repite)
  for (const [target, d, r] of steps) {
    const { ctx: c2, page: p2 } = await open(browser, { opts: target === 'html' ? { htmlAttr: ` data-g-density="${d}"` } : {} })
    await mount(p2, target === 'html' ? tpl : tpl.replace('<section id="live">', `<section id="live" data-g-density="${d}">`))
    await p2.evaluate(async () => {
      const wait = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      for (const id of ['#sum', '#bc']) { const el = document.querySelector(id); const w = el.style.inlineSize; el.style.inlineSize = `${parseFloat(w) - 60}px`; await wait(); el.style.inlineSize = w; await wait() }
    })
    const ref = await p2.evaluate(new Function(`return (${STATE})()`))
    if (V) console.log('15', target, d, r.state, ref)
    // GBreadcrumbs: la misma etapa y los mismos recortes que montada ya en ese paso. GSummary: su medida depende del camino
    // en un mismo ancho (también sin densidad: al montar frente a tras ensanchar), así que se exige la verdad geométrica
    expect.soft({ stage: r.state.stage, bcClipped: r.state.bcClipped }, `15 ${target} → ${d}: GBreadcrumbs medido al día en ≤ 2 cuadros`).toEqual({ stage: ref.stage, bcClipped: ref.bcClipped })
    expect.soft({ lies: r.state.summary.lies, plus: r.state.summary.plusMatches }, `15 ${target} → ${d}: GSummary medido al día en ≤ 2 cuadros (${r.state.summary.clipped} fuera; montada: ${ref.summary.clipped})`).toEqual({ lies: 0, plus: true })
    await c2.close()
  }
})

// ---------------------------------------------------------------------------------------------------- 16
test('criterio 16 · grana theme --stdout > t.css: CSS válido; avisos y notas en stderr; código de salida de antes', () => {
  const dir = mkdtempSync(join(tmpdir(), 'grana-dt-'))
  const bin = ROOT + 'packages/cli/bin/grana.mjs'
  writeFileSync(join(dir, 'cfg.json'), JSON.stringify({ brand: '#7A1F5C', space: 3, categories: 3, ...T14, overrides: { '--g-text-display-size': 'clamp(2rem, 5vw, 3rem)' } }))
  const p = spawnSync('sh', ['-c', `node "${bin}" theme cfg.json --stdout > t.css`], { cwd: dir, encoding: 'utf8' })
  expect(p.status, '16 código de salida 0, como antes').toBe(0)
  const t = readFileSync(join(dir, 't.css'), 'utf8')
  expect(t.startsWith('/* Generado por @grana/cli')).toBe(true)
  expect(t.replace(/\/\*[\s\S]*?\*\//g, '').trimStart().startsWith(':root {'), '16 primera regla :root {').toBe(true)
  expect(t, '16 sin ℹ ni ⚠ en el archivo').not.toMatch(/[ℹ⚠✖✔]/)
  expect(p.stderr, '16 avisos en stderr').toContain('⚠ aviso')
  expect(p.stderr, '16 nota text-density en stderr').toContain('`--g-text-display-size` no es una longitud en rem o px: se queda igual en los tres pasos de densidad.')
  writeFileSync(join(dir, 'malo.json'), JSON.stringify({ overrides: { '--g-focus-width': '1px' } }))
  expect(spawnSync('sh', ['-c', `node "${bin}" theme malo.json --stdout > m.css`], { cwd: dir }).status, '16 tema inválido: 1, como antes').toBe(1)
})
