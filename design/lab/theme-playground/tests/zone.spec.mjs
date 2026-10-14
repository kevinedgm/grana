// Zona de marca · componentes REALES dentro de la zona (docs/contract/tokens.md §44; design/contracts/surface.md «Zona de marca»;
// DECISIONS.md #620 a #625 y #637). Sobre el UMD del playground (window.Grana, window.GranaTag) montado en un contenedor propio,
// con los cuatro temas del contrato generados por el CLI REAL (buildTheme) y sin capa, como los pone una aplicación:
// por defecto, NisaNabani, hallazgo 15 y marca pálida. Claro y oscuro, en Chromium, Firefox y WebKit.
//
// Se mide en el navegador el color calculado de cada par (texto, contorno de control, indicador de foco) sobre el fondo
// efectivo (las capas translúcidas se componen): texto >= 4,5:1, contornos de control y foco >= 3:1. Dentro de la zona van
// GCard en sus cuatro niveles, GBtn (cuatro variantes por cuatro colores), GInput, GMetric, GBadge, GTag y un GMenu abierto en
// su sitio (el top layer hereda la zona). Las pruebas de unidad del CLI (cli/test/zone.test.js) cubren la derivación; aquí se
// comprueba que lo derivado llega a los componentes.
import { test, expect } from '@playwright/test'
import { buildTheme } from '../../../../packages/cli/src/index.js'

test.setTimeout(120_000)

const PAGE = '/packages/vue/playground/index.html'
const THEMES = {
  defecto: {},
  nisa: { brand: '#24366B', accent: '#C1D324' },
  hallazgo15: { brand: '#0B1F4D', accent: '#0F766E' },
  palida: { brand: '#F5B940', accent: '#5B3FE0' }
}
const CSS = Object.fromEntries(Object.entries(THEMES).map(([k, cfg]) => {
  const r = buildTheme(cfg)
  if (!r.ok) throw new Error(`el tema ${k} no se genera`)
  return [k, r.css]
}))

const MENU = [
  { id: 'ren', label: 'Renombrar' },
  { id: 'dup', label: 'Duplicar' },
  { id: 'off', label: 'No disponible', disabled: true },
  { type: 'separator' },
  { id: 'del', label: 'Eliminar', danger: true }
]

async function mount(page, theme, scheme) {
  await page.goto(PAGE)
  await page.waitForSelector('.g-btn', { timeout: 60_000 })
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(({ css, scheme, menu }) => {
    // Tema del usuario sin capa (como lo emite el CLI) y esquema por atributo, nunca en el mismo elemento que la zona
    document.querySelectorAll('style[data-zt]').forEach((s) => s.remove())
    const st = document.createElement('style'); st.dataset.zt = ''; st.textContent = css; document.head.appendChild(st)
    document.documentElement.dataset.theme = scheme
    document.getElementById('zt-host')?.remove()
    const host = document.createElement('div')
    host.id = 'zt-host'
    host.style.cssText = 'padding:16px;background:var(--g-color-bg);color:var(--g-color-text);position:relative;isolation:isolate'
    host.innerHTML = '<p id="zt-page">Página fuera de la zona.</p><div id="zt-app"></div>'
    document.body.prepend(host)
    const { createApp, h, reactive } = window.Vue
    const G = window.Grana, T = window.GranaTag
    const state = reactive({ menu: false })
    window.__zt = state
    const variants = ['solid', 'soft', 'outline', 'ghost']
    const colors = ['brand', 'accent', 'neutral', 'danger']
    const levels = ['flat', 'outlined', 'raised', 'inset']
    createApp({
      render: () => h(G.GSurface, { id: 'zt-zone', zone: 'brand', level: 'outlined', padding: 'lg' }, () => [
        h('p', { class: 'zt-text' }, 'Texto de la zona'),
        h('p', { class: 'zt-muted', style: 'color:var(--g-color-text-muted)' }, 'Texto secundario'),
        h('p', [h('a', { href: '#', class: 'zt-link', style: 'color:var(--g-color-link)' }, 'Enlace en la zona')]),
        ...variants.map((v) => h('div', { style: 'display:flex;flex-wrap:wrap;gap:8px;margin-block:6px' },
          colors.map((c) => h(G.GBtn, { variant: v, color: c, 'data-m': `btn ${v} ${c}` }, () => `${v} ${c}`)))),
        h('div', { style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-block:8px' }, [
          h(G.GInput, { 'data-m': 'input outline', label: 'Campo', modelValue: 'Texto escrito', hint: 'Ayuda bajo el campo' }),
          h(G.GInput, { 'data-m': 'input soft', variant: 'soft', label: 'Campo soft', modelValue: 'Texto escrito' }),
          h(G.GInput, { 'data-m': 'input ph', label: 'Con marcador', placeholder: 'Marcador' })
        ]),
        h('div', { style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-block:8px' }, [
          ...levels.map((l) => h(G.GCard, { level: l, 'data-m': `card ${l}`, title: `Tarjeta ${l}`, description: 'Descripción de la tarjeta' })),
          h(G.GCard, { level: 'outlined', interaction: 'toggle', modelValue: true, 'data-m': 'card toggle', title: 'Conmutable marcada', description: 'Seleccionada' })
        ]),
        h('div', { style: 'display:flex;flex-wrap:wrap;gap:12px;margin-block:8px' }, [
          h(G.GMetric, { 'data-m': 'metric success', label: 'Muestras', value: '128', trend: '+12 %', direction: 'up', trendColor: 'success', context: 'frente a ayer' }),
          h(G.GMetric, { 'data-m': 'metric danger', label: 'Rechazadas', value: '3', trend: '+2', direction: 'up', trendColor: 'danger', context: 'frente a ayer' }),
          h(G.GMetric, { 'data-m': 'metric warning', label: 'Pendientes', value: '9', trend: '−1', direction: 'down', trendColor: 'warning' })
        ]),
        h('div', { style: 'display:flex;flex-wrap:wrap;gap:8px;margin-block:8px' },
          ['solid', 'soft', 'outline'].flatMap((v) => ['brand', 'neutral', 'success', 'warning', 'danger'].map((c) =>
            h(G.GBadge, { variant: v, color: c, 'data-m': `badge ${v} ${c}` }, () => c)))),
        h('div', { style: 'display:flex;gap:8px;margin-block:8px' }, [
          h(T.GTag, { 'data-m': 'tag neutral', label: 'Hematología' }),
          h(T.GTag, { 'data-m': 'tag cat', label: 'Turno', color: 3 })
        ]),
        h(G.GMenu, { id: 'zt-menu', items: menu, modelValue: state.menu, 'onUpdate:modelValue': (v) => { state.menu = v } },
          { trigger: ({ attrs }) => h('button', { ...attrs, id: 'zt-menu-trigger', style: 'font:inherit;padding:8px 12px;color:var(--g-color-text);background:transparent;border:1px solid var(--g-color-border-control)' }, 'Abrir menú') })
      ])
    }).use(G).use(T).mount('#zt-app')

    // Medición: color calculado compuesto sobre el fondo efectivo
    const cvs = document.createElement('canvas'); cvs.width = cvs.height = 1
    const ctx = cvs.getContext('2d', { willReadFrequently: true })
    const rgba = (s) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = s; ctx.fillRect(0, 0, 1, 1); const d = ctx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
    const over = (t, u) => [0, 1, 2].map((i) => t[i] * t[3] + u[i] * (1 - t[3])).concat(1)
    const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
    const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2])
    const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
    const hex = (c) => '#' + c.slice(0, 3).map((x) => Math.round(x).toString(16).padStart(2, '0')).join('').toUpperCase()
    const bgOf = (el) => {
      const st = []
      for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
        const c = rgba(getComputedStyle(n).backgroundColor)
        if (c[3] > 0) { st.push(c); if (c[3] >= 1) break }
      }
      let a = [255, 255, 255, 1]
      for (let i = st.length - 1; i >= 0; i--) a = over(st[i], a)
      return a
    }
    window.__ztBg = (el) => hex(bgOf(el))
    window.__ztRows = () => {
      const zone = document.getElementById('zt-zone'), Z = bgOf(zone), rows = []
      const pair = (id, fg, bg, min) => rows.push({ id, fg: hex(fg), bg: hex(bg), r: +ratio(fg, bg).toFixed(2), min })
      const txt = (id, el, min = 4.5, bgEl = el) => { if (!el) return; const b = bgOf(bgEl); pair(id, over(rgba(getComputedStyle(el).color), b), b, min) }
      txt('texto', zone.querySelector('.zt-text')); txt('texto secundario', zone.querySelector('.zt-muted')); txt('enlace', zone.querySelector('.zt-link'))
      for (const b of zone.querySelectorAll('.g-btn[data-m]')) {
        const fill = bgOf(b), lab = b.querySelector('.g-btn__label') || b
        pair(`${b.dataset.m} · etiqueta`, over(rgba(getComputedStyle(lab).color), fill), fill, 4.5)
        if (/ outline /.test(b.dataset.m)) pair(`${b.dataset.m} · contorno`, over(rgba(getComputedStyle(b).borderTopColor), Z), Z, 3)
      }
      for (const w of zone.querySelectorAll('.g-input[data-m]')) {
        const id = w.dataset.m, ctl = w.querySelector('.g-input__control') || w.querySelector('input'), f = w.querySelector('input'), fb = bgOf(ctl)
        txt(`${id} · etiqueta`, w.querySelector('label, .g-input__label'))
        if (f.value) pair(`${id} · texto`, over(rgba(getComputedStyle(f).color), fb), fb, 4.5)
        else pair(`${id} · marcador`, over(rgba(getComputedStyle(f, '::placeholder').color), fb), fb, 4.5)
        const bc = rgba(getComputedStyle(ctl).borderTopColor)
        if (bc[3] > 0) pair(`${id} · borde`, over(bc, Z), Z, 3)
      }
      for (const c of zone.querySelectorAll('.g-card[data-m]')) { txt(`${c.dataset.m} · título`, c.querySelector('.g-card__title')); txt(`${c.dataset.m} · descripción`, c.querySelector('.g-card__description')) }
      for (const m of zone.querySelectorAll('.g-metric[data-m]')) for (const k of ['value', 'label', 'trend', 'context']) txt(`${m.dataset.m} · ${k}`, m.querySelector(`.g-metric__${k}`))
      for (const b of zone.querySelectorAll('.g-badge[data-m]')) txt(b.dataset.m, b)
      for (const t of zone.querySelectorAll('.g-tag[data-m]')) txt(t.dataset.m, t.querySelector('.g-tag__body') || t)
      return rows
    }
    // Indicador de foco del elemento activo (outline propio o de su caja visible) frente al fondo de la zona
    window.__ztRing = () => {
      const a = document.activeElement, zone = document.getElementById('zt-zone')
      if (!zone.contains(a)) return null
      const bg = bgOf(zone), hosts = [a, a.closest('.g-input__control'), a.closest('.g-input__row'), a.closest('.g-card'), a.closest('.g-btn')].filter(Boolean)
      for (const h of hosts) for (const p of [null, '::after', '::before']) {
        const cs = getComputedStyle(h, p)
        if (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 && rgba(cs.outlineColor)[3] > 0) {
          const f = over(rgba(cs.outlineColor), bg)
          return { el: a.closest('[data-m]')?.dataset.m || a.id || a.tagName, r: +ratio(f, bg).toFixed(2) }
        }
      }
      return { el: a.closest('[data-m]')?.dataset.m || a.id || a.tagName, r: 0 }
    }
    window.__ztRowsMenu = () => {
      const list = document.querySelector('#zt-menu-list, .g-menu__list:popover-open') || [...document.querySelectorAll('.g-menu__list')].find((l) => l.matches(':popover-open'))
      if (!list) return null
      const zone = document.getElementById('zt-zone'), b = bgOf(list), rows = []
      for (const i of list.querySelectorAll('.g-menu__item:not([disabled]):not([aria-disabled="true"])')) {
        const ib = bgOf(i), lab = i.querySelector('.g-menu__label') || i
        const f = over(rgba(getComputedStyle(lab).color), ib)
        rows.push({ id: i.textContent.trim(), r: +ratio(f, ib).toFixed(2) })
      }
      return { inside: zone.contains(list), zoneAttr: list.closest('[data-g-zone]')?.getAttribute('data-g-zone'), bg: hex(b), rows }
    }
  }, { css: CSS[theme], scheme, menu: MENU })
  await page.waitForSelector('#zt-zone .g-card')
  await page.evaluate(() => document.fonts.ready)
}

for (const theme of Object.keys(THEMES)) {
  for (const scheme of ['light', 'dark']) {
    test.describe(`zona de marca · ${theme} · ${scheme}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await page.addInitScript(() => { window.__errs = []; addEventListener('error', (e) => window.__errs.push(e.message)) })
      })

      test('la zona pinta con la marca, es oscura o clara según la tinta y no filtra a la página', async ({ page }) => {
        await mount(page, theme, scheme)
        const r = await page.evaluate(() => {
          const zone = document.getElementById('zt-zone')
          const cs = getComputedStyle(zone), root = getComputedStyle(document.documentElement)
          return {
            attr: zone.getAttribute('data-g-zone'),
            cls: zone.classList.contains('g-surface--zone-brand'),
            bg: window.__ztBg(zone),
            zoneVar: cs.getPropertyValue('--g-color-brand-zone').trim(),
            pageBg: window.__ztBg(document.getElementById('zt-host')),
            pageBgVar: root.getPropertyValue('--g-color-bg').trim(),
            scheme: cs.colorScheme
          }
        })
        expect(r.attr).toBe('brand')
        expect(r.cls).toBe(true)
        expect(r.bg.toUpperCase()).toBe(r.zoneVar.toUpperCase())
        // La página sigue con su fondo: la zona redeclara en su elemento, no en :root
        expect(r.pageBg).not.toBe(r.bg)
        expect(['dark', 'light']).toContain(r.scheme.split(' ')[0])
        if (theme === 'palida') expect(r.scheme.split(' ')[0]).toBe('light')
        else expect(r.scheme.split(' ')[0]).toBe('dark')
      })

      test('todos los pares de los componentes dentro de la zona cumplen su mínimo', async ({ page }) => {
        await mount(page, theme, scheme)
        const rows = await page.evaluate(() => window.__ztRows())
        expect(rows.length).toBeGreaterThan(40)
        const bad = rows.filter((x) => x.min && x.r + 0.005 < x.min)
        expect(bad, JSON.stringify(bad)).toEqual([])
      })

      test('el foco por teclado es visible (>= 3:1 frente a la zona) en cada parada', async ({ page, browserName }) => {
        await mount(page, theme, scheme)
        await page.evaluate(() => { document.activeElement?.blur(); document.getElementById('zt-page').scrollIntoView() })
        await page.mouse.click(2, 2)
        const TAB = browserName === 'webkit' ? 'Alt+Tab' : 'Tab'
        const stops = []
        for (let i = 0; i < 70; i++) {
          await page.keyboard.press(TAB)
          const r = await page.evaluate(() => window.__ztRing())
          if (r) stops.push(r)
        }
        expect(stops.length).toBeGreaterThan(20)
        // El enlace propio del banco usa el anillo del navegador: no es de un componente de Grana
        const bad = stops.filter((s) => s.r < 3 && s.el !== 'A')
        expect(bad, JSON.stringify(bad)).toEqual([])
      })

      test('un GMenu abierto en su sitio hereda la zona y sus elementos cumplen 4,5:1', async ({ page }) => {
        await mount(page, theme, scheme)
        await page.locator('#zt-menu-trigger').click()
        await page.waitForFunction(() => window.__ztRowsMenu() !== null)
        const m = await page.evaluate(() => window.__ztRowsMenu())
        expect(m.inside).toBe(true)
        expect(m.zoneAttr).toBe('brand')
        expect(m.rows.length).toBeGreaterThanOrEqual(3)
        const bad = m.rows.filter((x) => x.r + 0.005 < 4.5)
        expect(bad, JSON.stringify(bad)).toEqual([])
        // El panel se pinta con la zona, no vuelve al fondo de la página
        const z = await page.evaluate(() => window.__ztBg(document.getElementById('zt-zone')))
        const pg = await page.evaluate(() => window.__ztBg(document.getElementById('zt-host')))
        expect(m.bg).not.toBe(pg === z ? '' : pg)
      })

      test('consola limpia', async ({ page }) => {
        const errs = []
        page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(e.message) })
        page.on('console', (m) => { if (m.type() === 'error' && !/favicon|unpkg|ERR_/.test(m.text())) errs.push(m.text()) })
        await mount(page, theme, scheme)
        await page.locator('#zt-menu-trigger').click()
        await page.waitForTimeout(150)
        expect(errs).toEqual([])
      })
    })
  }
}

test('GSurface zone: avisos W1 (valor desconocido) y W3 (tone sunken) y sin zona por defecto', async ({ page }) => {
  const warns = []
  page.on('console', (m) => { if (m.type() === 'warning') warns.push(m.text()) })
  await page.goto(PAGE)
  await page.waitForSelector('.g-btn', { timeout: 60_000 })
  const r = await page.evaluate(() => {
    const { createApp, h } = window.Vue, { GSurface } = window.Grana
    const host = document.createElement('div'); document.body.prepend(host)
    createApp({ render: () => [
      h(GSurface, { id: 'w-none' }, () => 'a'),
      h(GSurface, { id: 'w-inv', zone: 'inverse' }, () => 'b'),
      h(GSurface, { id: 'w-sun', zone: 'brand', tone: 'sunken' }, () => 'c')
    ] }).use(window.Grana).mount(host)
    const q = (id) => document.getElementById(id)
    return { none: q('w-none').hasAttribute('data-g-zone'), inv: q('w-inv').hasAttribute('data-g-zone'), sun: q('w-sun').getAttribute('data-g-zone'), sunTone: q('w-sun').className }
  })
  expect(r.none).toBe(false)
  expect(r.inv).toBe(false)
  expect(r.sun).toBe('brand')
  expect(r.sunTone).toContain('g-surface--tone-surface')
  expect(r.sunTone).not.toContain('tone-sunken')
  // En la compilación de producción del UMD los avisos de desarrollo no salen; si salen, deben ser los de la zona
  for (const w of warns.filter((x) => /GSurface/.test(x))) expect(w).toMatch(/zone|tone/)
})
