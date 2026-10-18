// Relleno de familia como forma, después de #672 (PENDIENTES.md §5). Mide, sobre los COMPONENTES REALES del UMD
// (dist/), la forma de cada relleno o figura de familia contra lo que tiene detrás, con el tema por defecto, los cinco
// temas del CLI de btn-limitaciones.spec.mjs (más `categories: 8`) y dentro de data-g-zone="brand", claro y oscuro.
// Forma = el mayor de relleno y contorno (si se ve) contra la superficie; en una figura sin caja, su tinta (color).
// Los casos «exigidos» deben dar ≥ 3:1 en todos los temas; los «exentos» (pares soft de GAvatar y GTag estática) se
// miden y se imprimen (justificación en design/lab/relleno-familia/medida.md). Desde #674 la insignia con caja y el
// contador de GSidebar también se exigen. Además: Δ0 en reposo con el tema por defecto (contorno = relleno).
// Ejecutar: GRANA_PW_PORT=4211 npx playwright test tests/relleno-familia.spec.mjs   (VERBOSE=1 imprime las tablas)
import { test, expect } from '@playwright/test'

const V = !!process.env.VERBOSE
const FAMS = ['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']
const CARD_FAMS = ['brand', 'accent', 'neutral']
const CATS = [1, 2, 3, 4, 5, 6, 7, 8]

const { buildTheme } = await import('../../../../packages/cli/src/index.js')
const CLI_THEMES = [
  { name: 'T1 #1B1F4B', config: { brand: '#1B1F4B', dark: true, categories: 8 } },
  { name: 'T2 #F2C200', config: { brand: '#F2C200', dark: true, categories: 8 } },
  { name: 'T3 #E6007E + #00A3FF', config: { brand: '#E6007E', accent: '#00A3FF', dark: true, categories: 8 } },
  { name: 'T4 sin dark #7A1F5C + #0F766E', config: { brand: '#7A1F5C', accent: '#0F766E', dark: false, categories: 8 } },
  { name: 'T5 primary #FFD400 / #0F3D2E', config: { brand: '#0F3D2E', primary: '#FFD400', dark: true, categories: 8 } }
]
// El tema por defecto no trae categorías: las del playground (generadas por el CLI con el tema por defecto)
const DEFAULT_CATS = '/packages/vue/playground/tag-categories.css'

async function open(page, { theme, tokens = '', zone = false, catsHref = null } = {}) {
  await page.route('**/__relleno.html', (r) => r.fulfill({
    contentType: 'text/html',
    body: `<!doctype html><html${theme ? ` data-theme="${theme}"` : ''}><head><meta charset="utf-8">
      <link rel="stylesheet" href="/packages/vue/dist/grana.css">${catsHref ? `<link rel="stylesheet" href="${catsHref}">` : ''}
      <style>*,*::before,*::after{transition:none!important;animation:none!important}
      body{margin:0;padding:16px;background:var(--g-color-surface);color:var(--g-color-text);font-family:var(--g-font-ui)}
      #app>section{display:grid;grid-template-columns:repeat(auto-fill,minmax(480px,1fr));gap:8px;align-items:start;margin-bottom:8px}#app>section>*{justify-self:start}#app>section>.g-stepper{justify-self:stretch}
      .g-sidebar{position:relative!important;inset:auto!important;block-size:auto!important}${tokens}</style></head>
      <body><div id="host"${zone ? ' data-g-zone="brand" style="padding:16px"' : ''}><div id="app"></div></div>
      <script src="/node_modules/vue/dist/vue.global.js"></script><script src="/packages/vue/dist/grana.umd.js"></script>
      <script src="/packages/vue/dist/tag.umd.js"></script><script src="/packages/vue/dist/slider.umd.js"></script></body></html>`
  }))
  await page.goto('/__relleno.html')
  await page.evaluate(async ({ FAMS, CARD_FAMS, CATS }) => {
    const { h, createApp, nextTick } = Vue
    const G = Grana; const T = GranaTag; const S = GranaSlider
    const sec = (k, kids) => h('section', { 'data-k': k }, kids)
    const steps = [{ id: 1, label: 'Uno' }, { id: 2, label: 'Dos' }, { id: 3, label: 'Tres' }]
    createApp({
      render: () => [
        ...FAMS.map((c) => sec(`f-${c}`, [
          h(G.GBadge, { variant: 'solid', color: c, count: 3, 'data-m': `badge-count|${c}` }),
          h(G.GBadge, { variant: 'solid', color: c, label: 'Nuevo', 'data-m': `badge-text|${c}` }),
          h(G.GBadge, { variant: 'solid', color: c, shape: 'circle', label: 'Activo', 'data-m': `badge-figure|${c}` }),
          h(G.GProgress, { value: 40, label: 'Avance', color: c, 'data-m': `progress|${c}` }),
          h(S.GSlider, { modelValue: 40, label: 'Nivel', color: c, 'data-m': `slider|${c}` }),
          h(G.GStepper, { steps, modelValue: 2, navigation: 'free', responsive: 'never', color: c, 'data-m': `stepper|${c}` }),
          h(G.GSidebar, { mode: 'expanded', color: c, label: 'Nav', modelValue: 'x', 'data-m': `sidebar|${c}`, items: [{ id: 'x', label: 'Inicio' }, { id: 'a', label: 'Bandeja', badge: 3, badgeLabel: '3 nuevos' }, { id: 'b', label: 'Avisos', dot: true, badgeLabel: 'nuevo' }] })
        ])),
        sec('cards', CARD_FAMS.map((c) => h(G.GCard, { color: c, title: 'Tarjeta', selectable: true, modelValue: [1], value: 1, 'data-m': `card|${c}` }))),
        sec('cats', [
          h(T.GTag, { label: 'Neutra', pressed: true, 'data-m': 'tag-pressed|neutral' }),
          h(T.GTag, { label: 'Neutra', 'data-m': 'tag-static|neutral' }),
          ...CATS.flatMap((k) => [
            h(T.GTag, { label: `Cat ${k}`, color: k, 'data-m': `tag-static|cat-${k}` }),
            h(T.GTag, { label: `Cat ${k}`, color: k, pressed: true, 'data-m': `tag-pressed|cat-${k}` }),
            h(G.GAvatar, { name: 'Ana Ruiz', color: k, 'data-m': `avatar|cat-${k}` })
          ])
        ])
      ]
    }).mount('#app')
    await nextTick()
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  }, { FAMS, CARD_FAMS, CATS })
  await page.evaluate(probeSrc)
}

const probeSrc = () => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1
  const ctx = cv.getContext('2d', { willReadFrequently: true })
  const rgba = (s) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = s; ctx.fillRect(0, 0, 1, 1); const d = ctx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  const over = (t, b) => { const a = t[3]; return [t[0] * a + b[0] * (1 - a), t[1] * a + b[1] * (1 - a), t[2] * a + b[2] * (1 - a), 1] }
  const lum = (k) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(k[0]) + 0.7152 * f(k[1]) + 0.0722 * f(k[2]) }
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
  const surfaceOf = (el) => { const layers = []; for (let n = el.parentElement; n; n = n.parentElement) { const k = rgba(getComputedStyle(n).backgroundColor); if (k[3] > 0) { layers.push(k); if (k[3] >= 1) break } } let base = [255, 255, 255, 1]; for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base); return base }
  // box: relleno y contorno (si se ve) contra la superficie; ink: la tinta (color) de una figura sin caja
  window.__shape = (el, mode) => {
    const cs = getComputedStyle(el); const surf = surfaceOf(el)
    if (mode === 'ink') { const ink = over(rgba(cs.color), surf); return { shape: ratio(ink, surf), fill: 0, edge: 0, raw: cs.color } }
    const bg = over(rgba(cs.backgroundColor), surf)
    const bw = parseFloat(cs.borderTopWidth); const bc = rgba(cs.borderTopColor)
    let edge = bw > 0 && bc[3] > 0 ? ratio(over(bc, surf), surf) : 0
    let rawEdge = bw > 0 ? cs.borderTopColor : null
    // Sin borde visible, el contorno puede ser un trazo interior (box-shadow inset, §7.1)
    const inset = cs.boxShadow.includes('inset') && cs.boxShadow.match(/rgba?\([^)]*\)/)
    if (!edge && inset) { const k = rgba(inset[0]); if (k[3] > 0) { edge = ratio(over(k, surf), surf); rawEdge = inset[0] } }
    const fill = ratio(bg, surf)
    return { shape: Math.max(fill, edge), fill, edge, raw: cs.backgroundColor, rawEdge }
  }
}

// [clave, selector dentro de [data-m], modo, exigido]
const TARGETS = [
  ['badge-count', ':scope', 'box', true],
  ['badge-text', ':scope', 'box', true],
  ['badge-figure', '.g-badge__shape', 'ink', true],
  ['progress', '.g-progress__fill', 'box', true],
  ['slider-pill', '.g-slider__pill', 'box', true],
  ['slider-fill', '.g-slider__fill', 'box', true],
  ['stepper-complete', '.g-stepper__step.is-complete .g-stepper__indicator', 'box', true],
  ['stepper-current', '.g-stepper__step.is-current .g-stepper__indicator', 'box', true],
  ['sidebar-count', '.g-sidebar__badge:not(.g-sidebar__badge--dot)', 'box', true],
  ['sidebar-dot', '.g-sidebar__badge--dot', 'ink', true],
  ['card-tick', '.g-card__tick', 'box', true],
  ['tag-pressed', ':scope', 'box', true],
  ['tag-static', ':scope', 'box', false],
  ['avatar', ':scope', 'box', false]
]

async function measure(page) {
  return page.evaluate((TARGETS) => {
    const out = []
    for (const host of document.querySelectorAll('[data-m]')) {
      const [comp, fam] = host.dataset.m.split('|')
      for (const [key, sel, mode, req] of TARGETS) {
        if (!(key === comp || key.startsWith(`${comp}-`))) continue
        const el = sel === ':scope' ? host : host.querySelector(sel)
        if (!el) { out.push({ key, fam, missing: true, req }); continue }
        out.push({ key, fam, req, ...window.__shape(el, mode) })
      }
    }
    return out
  }, TARGETS)
}

// Hover del indicador completado de GStepper (#438: el contorno sigue en -text sobre -strong)
async function stepperHover(page) {
  const out = []
  for (const c of FAMS) {
    const hit = page.locator(`[data-m="stepper|${c}"] .g-stepper__step.is-complete .g-stepper__hit`)
    await hit.hover()
    out.push({ key: 'stepper-complete-hover', fam: c, req: true, ...await page.locator(`[data-m="stepper|${c}"] .g-stepper__step.is-complete .g-stepper__indicator`).evaluate((el) => window.__shape(el, 'box')) })
  }
  await page.mouse.move(0, 0)
  return out
}

const report = (label, rows) => {
  const by = {}
  for (const r of rows) { if (r.missing) continue; const k = r.key; if (!by[k] || r.shape < by[k].shape) by[k] = r }
  const line = Object.entries(by).map(([k, r]) => `${k} ${r.shape.toFixed(2)} (${r.fam})`).join(' · ')
  console.log(`[${label}] ${line}`)
  if (V) for (const r of rows) console.log(`  ${r.key} ${r.fam}: forma ${r.missing ? '—' : r.shape.toFixed(2)} (relleno ${r.fill?.toFixed(2)}, contorno ${r.edge?.toFixed(2)})`)
  const fails = rows.filter((r) => r.req && (r.missing || r.shape < 3)).map((r) => `${r.key} ${r.fam}: ${r.missing ? 'no encontrado' : r.shape.toFixed(2)}`)
  return fails
}

const CASES = [
  ...['light', 'dark'].map((scheme) => ({ name: `defecto · ${scheme}`, theme: scheme, catsHref: DEFAULT_CATS })),
  // En la zona, las categorías llevan el bloque [data-g-zone] del CLI (cat-k-text = on-brand-zone, tokens.md §44.6); la copia
  // del playground lo trae desde #673 (antes, sin él, GTag pulsada con cat-k daba 2,81–2,92 en la zona clara)
  ...['light', 'dark'].map((scheme) => ({ name: `defecto · zona de marca · ${scheme}`, theme: scheme, catsHref: DEFAULT_CATS, zone: true })),
  ...CLI_THEMES.flatMap((th) => ['light', 'dark'].map((scheme) => ({ name: `${th.name} · ${scheme}`, scheme, cli: th }))),
  ...['light', 'dark'].map((scheme) => ({ name: `T2 #F2C200 · zona de marca · ${scheme}`, scheme, cli: CLI_THEMES[1], zone: true }))
]

test.describe('Relleno de familia como forma (#672, PENDIENTES §5)', () => {
  test.setTimeout(120_000)
  for (const cs of CASES) {
    test(`${cs.name}: lo exigido ≥ 3:1`, async ({ page }) => {
      let tokens = ''; let theme = cs.theme
      if (cs.cli) {
        const r = buildTheme(cs.cli.config)
        test.skip(!r.css, 'el CLI rechazó el tema')
        tokens = r.css
        theme = cs.scheme
        if (cs.scheme === 'dark' && cs.cli.config.dark === false) { await page.emulateMedia({ colorScheme: 'dark' }); theme = undefined }
      }
      await open(page, { theme, tokens, zone: cs.zone, catsHref: cs.catsHref })
      const rows = [...await measure(page), ...await stepperHover(page)]
      const fails = report(`${cs.name} ${test.info().project.name}`, rows)
      expect(fails, fails.join('\n')).toEqual([])
    })
  }

  // Δ0 en reposo con el tema por defecto: donde hay contorno -text, es del color del relleno (sin cambio visible)
  for (const scheme of ['light', 'dark']) test(`defecto · ${scheme}: Δ0 en reposo (contorno = relleno)`, async ({ page }) => {
    await open(page, { theme: scheme, catsHref: DEFAULT_CATS })
    const rows = await measure(page)
    const bad = rows.filter((r) => !r.missing && r.rawEdge && r.edge > 0 && r.fill > 1.01 && ['badge-count', 'badge-text', 'sidebar-count', 'stepper-complete', 'card-tick', 'tag-pressed', 'slider-pill'].includes(r.key) && r.rawEdge !== r.raw)
      .map((r) => `${r.key} ${r.fam}: contorno ${r.rawEdge} ≠ relleno ${r.raw}`)
    expect(bad, bad.join('\n')).toEqual([])
  })
})

// Punto de GSidebar sobre la píldora actual del navbar: sin caja (antes heredaba el fondo invertido del contador y se veía
// como un cuadrado) y en on-current, ≥ 3:1 contra el relleno de la píldora (--g-sidebar-current)
test.describe('GSidebar navbar · punto sobre la píldora actual (#673)', () => {
  for (const [name, config] of [['defecto', null], ['T2 #F2C200', CLI_THEMES[1].config], ['T5 primary #FFD400', CLI_THEMES[4].config]]) for (const scheme of ['light', 'dark']) {
    test(`${name} · ${scheme}`, async ({ page }) => {
      await page.setViewportSize({ width: 400, height: 800 })
      const tokens = config ? buildTheme(config).css : ''
      await page.route('**/__navbar.html', (r) => r.fulfill({ contentType: 'text/html', body: `<!doctype html><html data-theme="${scheme}"><head><meta charset="utf-8"><link rel="stylesheet" href="/packages/vue/dist/grana.css"><style>${tokens}</style></head><body><div id="app"></div><script src="/node_modules/vue/dist/vue.global.js"></script><script src="/packages/vue/dist/grana.umd.js"></script></body></html>` }))
      await page.goto('/__navbar.html')
      await page.evaluate(async () => {
        Vue.createApp({ render: () => Vue.h(Grana.GSidebar, { mode: 'navbar', label: 'Nav', modelValue: 'a', items: [{ id: 'a', label: 'Inicio', icon: 'home', dot: true, badgeLabel: 'nuevo' }, { id: 'b', label: 'Bandeja', badge: 2, badgeLabel: '2' }, { id: 'c', label: 'Ajustes' }] }) }).mount('#app')
        await Vue.nextTick(); await new Promise((r) => setTimeout(r, 300))
      })
      await page.evaluate(probeSrc)
      const r = await page.evaluate(() => {
        const dot = document.querySelector('li.is-current .g-sidebar__badge--dot')
        const cs = getComputedStyle(dot)
        const p = document.createElement('i'); p.style.color = 'var(--g-sidebar-current)'; dot.parentElement.append(p); const pill = getComputedStyle(p).color; p.remove()
        const cv = document.createElement('canvas').getContext('2d')
        const rgb = (s) => { cv.fillStyle = s; cv.fillRect(0, 0, 1, 1); return [...cv.getImageData(0, 0, 1, 1).data] }
        const lum = (k) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(k[0]) + 0.7152 * f(k[1]) + 0.0722 * f(k[2]) }
        const a = lum(rgb(cs.color)), b = lum(rgb(pill))
        return { bg: cs.backgroundColor, outline: cs.outlineStyle, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) }
      })
      expect(r.bg, 'el punto no tiene caja').toBe('rgba(0, 0, 0, 0)')
      expect(r.outline).toBe('none')
      expect(r.ratio, `punto / píldora ${r.ratio.toFixed(2)}`).toBeGreaterThanOrEqual(3)
      if (V) console.log(`[navbar ${name} ${scheme} ${test.info().project.name}] punto/píldora ${r.ratio.toFixed(2)}`)
    })
  }
})

// GFab: acuse done/failed (relleno semántico con icono on- encima) y «Confirmar» (botón sólido de peligro): contorno
// {sem}-text (§7.1, #672, #673). Marcado del contrato con el grana.css real (la forma no depende del .vue)
test.describe('GFab · acuse y confirmar con contorno {sem}-text (#673)', () => {
  const FAB_CASES = [
    ['defecto · light', { theme: 'light' }], ['defecto · dark', { theme: 'dark' }],
    ['defecto · zona de marca · light', { theme: 'light', zone: true }],
    ...CLI_THEMES.flatMap((th) => ['light', 'dark'].map((s) => [`${th.name} · ${s}`, { cli: th, scheme: s }])),
    ['T2 · zona de marca · light', { cli: CLI_THEMES[1], scheme: 'light', zone: true }]
  ]
  for (const [name, o] of FAB_CASES) test(name, async ({ page }) => {
    let tokens = ''; let theme = o.theme
    if (o.cli) { tokens = buildTheme(o.cli.config).css; theme = o.scheme; if (o.scheme === 'dark' && o.cli.config.dark === false) { await page.emulateMedia({ colorScheme: 'dark' }); theme = undefined } }
    const body = `<div class="g-fab" data-ack="done"><span class="g-fab__badge" data-x="done"></span></div>
      <div class="g-fab" data-ack="failed"><span class="g-fab__badge" data-x="failed"></span></div>
      <ul class="g-fab__list"><li class="g-fab__confirm"><button type="button" class="g-fab__confirm-action" data-x="confirm">Borrar</button></li></ul>`
    await page.route('**/__fab.html', (r) => r.fulfill({ contentType: 'text/html', body: `<!doctype html><html${theme ? ` data-theme="${theme}"` : ''}><head><meta charset="utf-8"><link rel="stylesheet" href="/packages/vue/dist/grana.css"><style>*{transition:none!important;animation:none!important}body{background:var(--g-color-surface)}.g-fab{position:static!important;translate:none!important}.g-fab__badge{position:static!important;opacity:1!important;scale:1!important}${tokens}</style></head><body><div id="host"${o.zone ? ' data-g-zone="brand" style="padding:16px"' : ''}>${body}</div></body></html>` }))
    await page.goto('/__fab.html')
    await page.evaluate(probeSrc)
    const rows = await page.evaluate(() => [...document.querySelectorAll('[data-x]')].map((el) => ({ k: el.dataset.x, ...window.__shape(el, 'box') })))
    const fails = rows.filter((r) => r.shape < 3).map((r) => `${r.k}: ${r.shape.toFixed(2)} (relleno ${r.fill.toFixed(2)}, contorno ${r.edge.toFixed(2)})`)
    if (V) console.log(`[fab ${name} ${test.info().project.name}] ${rows.map((r) => `${r.k} ${r.shape.toFixed(2)}`).join(' · ')}`)
    expect(fails, fails.join('\n')).toEqual([])
    if (!o.cli && !o.zone) for (const r of rows) expect(r.rawEdge, `${r.k}: Δ0 (contorno = relleno)`).toBe(r.raw)
  })
})

// GFab montado (UMD de dist/fab.umd.js): acuse failed y done en la insignia y el par de confirmación de una acción peligrosa
test.describe('GFab montado · acuse y confirmar (#673)', () => {
  const MOUNT_CASES = [
    ['defecto · light', { theme: 'light' }], ['defecto · dark', { theme: 'dark' }],
    ...[CLI_THEMES[1], CLI_THEMES[2], CLI_THEMES[4]].flatMap((th) => ['light', 'dark'].map((s) => [`${th.name} · ${s}`, { cli: th, scheme: s }]))
  ]
  for (const [name, o] of MOUNT_CASES) test(name, async ({ page }) => {
    const tokens = o.cli ? buildTheme(o.cli.config).css : ''
    const theme = o.cli ? o.scheme : o.theme
    await page.route('**/__fab-real.html', (r) => r.fulfill({ contentType: 'text/html', body: `<!doctype html><html data-theme="${theme}"><head><meta charset="utf-8"><link rel="stylesheet" href="/packages/vue/dist/grana.css"><style>*,*::before,*::after{transition:none!important;animation:none!important}body{margin:0;min-height:100vh;background:var(--g-color-surface)}${tokens}</style></head><body><div id="app"></div><script src="/node_modules/vue/dist/vue.global.js"></script><script src="/packages/vue/dist/grana.umd.js"></script><script src="/packages/vue/dist/fab.umd.js"></script></body></html>` }))
    await page.goto('/__fab-real.html')
    await page.evaluate(async () => {
      const labels = { more: ({ count }) => `${count} más`, moreShort: 'Más', cancel: 'Cancelar', busy: 'En curso', done: 'Hecho', failed: 'Falló' }
      window.__mode = 'failed'
      Vue.createApp({ render: () => Vue.h(GranaFab.GFab, { label: 'Acciones', labels, items: [{ id: 'exp', label: 'Exportar', icon: 'download' }, { id: 'del', label: 'Borrar', icon: 'trash-2', danger: true }], onSelect: (e) => { if (e.id === 'exp') e[window.__mode]() } }) }).mount('#app')
      await Vue.nextTick()
    })
    await page.evaluate(probeSrc)
    const read = (sel) => page.locator(sel).first().evaluate((el) => window.__shape(el, 'box'))
    const fab = page.locator('.g-fab > .g-btn, .g-fab .g-btn').first()
    const rows = []
    for (const mode of ['failed', 'done']) {
      await page.evaluate((m) => { window.__mode = m }, mode)
      await fab.click()
      await page.getByRole('menuitem', { name: 'Exportar' }).click()
      await expect(page.locator(`.g-fab[data-ack="${mode}"] .g-fab__badge`)).toHaveCount(1)
      // La insignia va dentro del botón del FAB con un aro de surface (box-shadow de 2 × border-width): lo que toca su
      // contorno es el aro, no el relleno del FAB. Se mide el contorno y el relleno contra el color del aro
      rows.push({ k: `acuse ${mode}`, ...await page.locator(`.g-fab[data-ack="${mode}"] .g-fab__badge`).evaluate((el) => {
        const cs = getComputedStyle(el); const ring = cs.boxShadow.match(/rgba?\([^)]*\)/)[0]
        const host = document.createElement('i'); host.style.backgroundColor = ring; document.body.append(host)
        const probe = document.createElement('i'); probe.style.cssText = `background:${cs.backgroundColor};border:${cs.borderTopWidth} solid ${cs.borderTopColor}`; host.append(probe)
        const r = window.__shape(probe, 'box'); host.remove(); return { ...r, raw: cs.backgroundColor, rawEdge: cs.borderTopColor }
      }) })
      if (await page.locator('.g-fab[data-state="open"]').count()) await page.keyboard.press('Escape')
    }
    await fab.click()
    await page.getByRole('menuitem', { name: 'Borrar' }).click()
    await expect(page.locator('.g-fab__confirm-action')).toHaveCount(1)
    rows.push({ k: 'confirmar', ...await read('.g-fab__confirm-action') })
    if (V) console.log(`[fab montado ${name} ${test.info().project.name}] ${rows.map((r) => `${r.k} ${r.shape.toFixed(2)}`).join(' · ')}`)
    const fails = rows.filter((r) => r.shape < 3).map((r) => `${r.k}: ${r.shape.toFixed(2)}`)
    expect(fails, fails.join('\n')).toEqual([])
    if (!o.cli) for (const r of rows) expect(r.rawEdge, `${r.k}: Δ0`).toBe(r.raw)
  })
})

// Anfitriones que redefinen .g-btn sobre otra superficie (§7.1 «Sobre otra superficie»): GToast, GStatusIsland (lista y
// superficie inversa), panel y disparador de la voz, barra de GTranscript. Ninguno pinta un relleno de familia salvo
// «Descartar» (solid danger) del panel, que hereda #672; se mide la forma de cada uno contra su superficie real
test.describe('Anfitriones de .g-btn sobre otra superficie (#673)', () => {
  const b = (cls, extra = '') => `<button type="button" class="g-btn g-btn--size-sm ${cls}" ${extra}><span class="g-btn__label">Acción</span></button>`
  const BODY = `
    <div class="g-toaster"><div class="g-toast"><div class="g-toast__actions">${b('g-btn--variant-outline g-btn--color-neutral g-toast__action', 'data-x="toast · acción"')}</div></div></div>
    <ul class="g-status-list"><li class="g-status-item">${b('g-btn--variant-outline g-btn--color-neutral g-status-item__action', 'data-x="isla · acción en la lista"')}</li></ul>
    <div class="g-status-island"><div class="g-status-island__shape">${b('g-btn--variant-outline g-btn--color-neutral g-status-island__ack', 'data-x="isla · «Entendido» sobre la inversa"')}</div></div>
    <div class="g-speech-panel">${b('g-btn--variant-outline g-btn--color-neutral', 'data-x="panel de voz · outline"')}${b('g-btn--variant-solid g-btn--color-danger', 'data-x="panel de voz · descartar (solid)"')}<div class="g-speech-panel__activity">${b('g-btn--variant-ghost g-btn--color-neutral', 'aria-pressed="true" data-x="panel de voz · actividad pulsada"')}</div></div>
    <span class="g-speech-trigger" data-status="listening">${b('g-btn--variant-ghost g-btn--color-neutral g-btn--icon g-speech-trigger__btn', 'aria-pressed="true" data-x="disparador · escuchando" data-inset')}</span>
    <span class="g-speech-trigger" data-status="error">${b('g-btn--variant-ghost g-btn--color-neutral g-btn--icon g-speech-trigger__btn', 'data-x="disparador · error"')}</span>
    <div class="g-transcript"><div class="g-transcript__bar">${b('g-btn--variant-ghost g-btn--color-neutral', 'aria-pressed="true" data-x="transcripción · pulsado"')}</div></div>`
  const HOST_CASES = [
    ['defecto · light', { theme: 'light' }], ['defecto · dark', { theme: 'dark' }],
    ...CLI_THEMES.flatMap((th) => ['light', 'dark'].map((s) => [`${th.name} · ${s}`, { cli: th, scheme: s }])),
    ['T2 · zona de marca · light', { cli: CLI_THEMES[1], scheme: 'light', zone: true }]
  ]
  for (const [name, o] of HOST_CASES) test(name, async ({ page }) => {
    let tokens = ''; let theme = o.theme
    if (o.cli) { tokens = buildTheme(o.cli.config).css; theme = o.scheme; if (o.scheme === 'dark' && o.cli.config.dark === false) { await page.emulateMedia({ colorScheme: 'dark' }); theme = undefined } }
    await page.route('**/__hosts.html', (r) => r.fulfill({ contentType: 'text/html', body: `<!doctype html><html${theme ? ` data-theme="${theme}"` : ''}><head><meta charset="utf-8"><link rel="stylesheet" href="/packages/vue/dist/grana.css"><style>*,*::before,*::after{transition:none!important;animation:none!important}body{background:var(--g-color-surface)}.g-toaster,.g-status-island,.g-speech-panel{position:static!important;inset:auto!important;translate:none!important;transform:none!important;opacity:1!important;visibility:visible!important}${tokens}</style></head><body><div${o.zone ? ' data-g-zone="brand" style="padding:16px"' : ''}>${BODY}</div></body></html>` }))
    await page.goto('/__hosts.html')
    await page.evaluate(probeSrc)
    const rows = await page.evaluate(() => [...document.querySelectorAll('[data-x]')].map((el) => {
      const r = window.__shape(el, 'box')
      if (el.hasAttribute('data-inset')) {
        // contorno interior (box-shadow inset) contra la superficie: se mide con una sonda de ese color
        const cs = getComputedStyle(el); const ring = cs.boxShadow.match(/rgba?\([^)]*\)/)?.[0]
        if (ring) { const p = document.createElement('i'); p.style.cssText = `display:block;border:1px solid ${ring}`; el.parentElement.append(p); const q = window.__shape(p, 'box'); p.remove(); r.shape = Math.max(r.shape, q.edge); r.edge = q.edge }
      }
      return { k: el.dataset.x, ...r }
    }))
    if (V) console.log(`[anfitriones ${name} ${test.info().project.name}] ${rows.map((r) => `${r.k} ${r.shape.toFixed(2)}`).join(' · ')}`)
    const fails = rows.filter((r) => r.shape < 3).map((r) => `${r.k}: ${r.shape.toFixed(2)} (relleno ${r.fill.toFixed(2)}, contorno ${r.edge.toFixed(2)})`)
    expect(fails, fails.join('\n')).toEqual([])
  })
})
