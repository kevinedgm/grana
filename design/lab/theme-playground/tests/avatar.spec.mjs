// GAvatar sobre el COMPONENTE REAL del playground (packages/vue/playground, #sec-gavatar y los huecos de GCard, GTable,
// GMenu, GSelect, GSidebar y GBadge), en Chromium, Firefox y WebKit. Port de design/lab/avatar/r01/verificar.mjs (kiwi) y de
// los puntos de navegador del contrato (design/contracts/avatar.md «Verificación»; DECISIONS.md #293 a #297).
// Donde hace falta un caso que el playground no muestra (dos letras anchas, vectores del hash), se monta el GAvatar real
// del UMD (window.Grana) en la propia página.
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/index.html'
const UNITS = { xs: 5, sm: 6, md: 8, lg: 10, xl: 16 }
const SIZES = Object.keys(UNITS)
const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#777"/></svg>'

async function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana GAvatar/.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}
async function open(page, { width = 1280, reducedMotion = 'reduce', hold = false } = {}) {
  await page.emulateMedia({ reducedMotion })
  await page.setViewportSize({ width, height: 900 })
  let release = () => {}
  if (hold) {
    const held = new Promise((r) => { release = r })
    await page.route('**/playground/_avatar-lenta.svg*', async (r) => { await held; await r.fulfill({ status: 200, contentType: 'image/svg+xml', body: SVG }) })
  }
  await page.goto(PAGE)
  await page.waitForSelector('#sec-gavatar .g-avatar')
  // WebKit no resuelve document.fonts.ready mientras una imagen diferida sigue pendiente: se cargan las caras a mano
  await page.evaluate(() => { const f = getComputedStyle(document.body).fontFamily; return Promise.race([Promise.all(['400', '600'].map((w) => document.fonts.load(`${w} 16px ${f}`))), new Promise((r) => setTimeout(r, 3000))]) })
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto' })
  return release
}
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 30)))))
const rect = (page, sel) => page.evaluate((s) => { const r = document.querySelector(s)?.getBoundingClientRect(); return r && { x: r.x, y: r.y, w: r.width, h: r.height } }, sel)
const near = (a, b, t = 0.51) => Math.abs(a - b) <= t
// Monta GAvatar reales (UMD) en un contenedor nuevo de la página y devuelve su selector
const mountAvatars = (page, list, id) => page.evaluate(({ list, id }) => {
  const host = document.createElement('div')
  host.id = id
  host.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;padding:8px'
  document.querySelector('#sec-gavatar').append(host)
  window.Vue.createApp({ render: () => list.map((p) => window.Vue.h(window.Grana.GAvatar, p)) }).mount(host)
}, { list, id })

test.describe('GAvatar · componente real (avatar.md)', () => {
  test('lado = space × n en los cinco tamaños, tres fuentes y las dos formas; también con space 5', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    for (const kind of ['img', 'ini', 'icon', 'square']) for (const s of SIZES) {
      const r = await rect(page, `[data-test="size-${kind}-${s}"]`)
      expect(near(r.w, 4 * UNITS[s]) && near(r.h, 4 * UNITS[s]), `${kind} ${s}: ${r.w}×${r.h}`).toBe(true)
    }
    await page.evaluate(() => document.documentElement.style.setProperty('--g-space-1', '5px'))
    for (const s of SIZES) {
      const r = await rect(page, `[data-test="size-ini-${s}"]`)
      expect(near(r.w, 5 * UNITS[s]) && near(r.h, 5 * UNITS[s]), `space 5, ${s}: ${r.w}×${r.h}`).toBe(true)
    }
    // Radio: círculo 50 %; square, un paso de la escala que crece con el tamaño (nunca --g-radius-shape)
    const radii = await page.evaluate((sizes) => sizes.map((s) => [getComputedStyle(document.querySelector(`[data-test="size-ini-${s}"]`)).borderTopLeftRadius, parseFloat(getComputedStyle(document.querySelector(`[data-test="size-square-${s}"]`)).borderTopLeftRadius)]), SIZES)
    expect(radii.every(([c]) => c === '50%')).toBe(true)
    expect(radii.map(([, q]) => q).every((q, i, a) => q > 0 && (i === 0 || q >= a[i - 1]))).toBe(true)
    expect(errs).toEqual([])
  })

  test('iniciales: dos letras anchas caben en md, lg y xl (círculo, 1px de aire); texto ≥ 12px; una letra en xs y sm', async ({ page }) => {
    await open(page)
    const list = SIZES.flatMap((s) => [{ initials: 'WM', size: s, 'data-fit': `WM-${s}` }, { initials: 'ЖШ', size: s, 'data-fit': `ZH-${s}` }])
    await mountAvatars(page, list, 'av-fit')
    await settle(page)
    const fit = await page.evaluate(() => [...document.querySelectorAll('#av-fit .g-avatar')].map((av) => {
      const t = av.querySelector('.g-avatar__initials')
      const cs = getComputedStyle(t); const fs = parseFloat(cs.fontSize); const d = av.getBoundingClientRect().width
      const r = d / 2, cap = 0.72 * fs, chord = 2 * Math.sqrt(r * r - (cap / 2) ** 2) - 2
      return { id: av.dataset.fit, text: t.textContent, w: t.getBoundingClientRect().width, chord, fs }
    }))
    for (const f of fit) {
      const s = f.id.split('-')[1]
      expect(f.fs, `${f.id}: ${f.fs}px`).toBeGreaterThanOrEqual(12)
      if (s === 'xs' || s === 'sm') expect(f.text.length, `${f.id}: «${f.text}»`).toBe(1)
      else {
        expect(f.text.length).toBe(2)
        expect(f.w, `${f.id}: ${f.w.toFixed(1)}px en una cuerda de ${f.chord.toFixed(1)}px`).toBeLessThanOrEqual(f.chord)
      }
    }
    // Las de la página: escrituras anchas y RTL
    const scripts = await page.evaluate(() => [...document.querySelectorAll('#av-scripts .g-avatar')].map((a) => [a.getAttribute('aria-label'), a.querySelector('.g-avatar__initials')?.textContent ?? null]))
    expect(Object.fromEntries(scripts)).toEqual({ '李小龙': '李', '山田 太郎': '山', '김민수': '김', 'محمد علي': 'مع', 'ØRSTED': 'Ø', '🦊 Zorro Plateado': 'ZP', 'Émile Zola': 'ÉZ', 'łukasz żółw': 'ŁŻ', 'Straße': 'S' })
  })

  test('hash: los vectores del contrato dan la misma categoría en este motor', async ({ page }) => {
    await open(page)
    const V = [['a', 4, 4, 4], ['Ana María López', 2, 2, 2], ['  ANA   MARÍA lópez ', 2, 2, 2], ['李小龙', 1, 1, 1], ['محمد علي', 2, 6, 2], ['Grana Labs', 3, 3, 11], ['u_8f3a2c', 2, 2, 2], ['Zoë', 3, 3, 11]]
    const list = V.flatMap(([key]) => [4, 8, 12].map((n) => ({ colorKey: key, categories: n })))
    await mountAvatars(page, list, 'av-hash')
    const got = await page.evaluate(() => [...document.querySelectorAll('#av-hash .g-avatar')].map((a) => Number(a.dataset.cat)))
    expect(got).toEqual(V.flatMap(([, a, b, c]) => [a, b, c]))
  })

  test('contraste ≥ 4.5:1 de iniciales e icono en neutro y en las 8 categorías, claro y oscuro', async ({ page }) => {
    await open(page)
    for (const scheme of ['light', 'dark']) {
      await page.evaluate((s) => { document.documentElement.dataset.theme = s }, scheme)
      await settle(page)
      const rows = await page.evaluate(() => {
        const lum = (c) => { const m = c.match(/[\d.]+/g).map(Number); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]) }
        const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
        return [...document.querySelectorAll('#av-colors .g-avatar, [data-test="size-icon-md"]')].map((a) => {
          const cs = getComputedStyle(a); const svg = a.querySelector('svg')
          const ink = svg ? getComputedStyle(svg).stroke : getComputedStyle(a.querySelector('.g-avatar__initials')).color
          return { test: a.dataset.test, cat: a.dataset.cat ?? null, bg: cs.backgroundColor, ink, cr: cr(ink, cs.backgroundColor) }
        })
      })
      expect(rows.length).toBeGreaterThan(15)
      for (const r of rows) {
        expect(r.bg, `${scheme} ${r.test}: relleno`).not.toBe('rgba(0, 0, 0, 0)')
        expect(r.cr, `${scheme} ${r.test} (${r.ink} / ${r.bg})`).toBeGreaterThanOrEqual(4.5)
      }
      // Las ocho categorías derivadas o fijas están presentes
      expect(new Set(rows.map((r) => r.cat).filter(Boolean)).size).toBe(8)
    }
  })

  test('árbol accesible: decorativos fuera, label → img con nombre, botón con su nombre; presencia con texto', async ({ page }) => {
    await open(page)
    const sem = await page.evaluate(() => {
      const g = (t) => document.querySelector(`[data-test="${t}"]`)
      return {
        dec: [g('sem-dec').getAttribute('aria-hidden'), g('sem-dec').getAttribute('role')],
        named: [g('sem-named').getAttribute('role'), g('sem-named').getAttribute('aria-label'), g('sem-named').hasAttribute('aria-hidden')],
        alt: [...document.querySelectorAll('.g-avatar__img')].every((i) => i.getAttribute('alt') === ''),
        focusable: [...document.querySelectorAll('.g-avatar, .g-avatar *')].some((a) => a.tabIndex >= 0 || a.hasAttribute('tabindex'))
      }
    })
    expect(sem.dec).toEqual(['true', null])
    expect(sem.named).toEqual(['img', 'Luis Torres', false])
    expect(sem.alt).toBe(true)
    expect(sem.focusable).toBe(false)
    const snap = await page.locator('#av-sem').ariaSnapshot()
    expect(snap).toMatch(/img "Luis Torres"/)
    expect(snap).toMatch(/button "Cuenta de Ana"/)
    expect((snap.match(/- img/g) || []).length, snap).toBe(1)
    const st = await page.locator('#av-status').ariaSnapshot()
    for (const t of ['En línea', 'Ausente', 'Ocupado', 'img "Grana Labs"']) expect(st, st).toContain(t)
    // Iniciales en otras escrituras: cada una con label, una imagen con nombre por avatar
    const scripts = await page.locator('#av-scripts').ariaSnapshot()
    expect((scripts.match(/- img/g) || []).length).toBe(9)
  })

  test('imagen: cargando → cargada sin salto; fallida sin <img>; 3:1 con cover; cambio de foto', async ({ page }) => {
    const errs = await watchConsole(page)
    const release = await open(page, { reducedMotion: 'no-preference', hold: true })
    await page.locator('#av-img').scrollIntoViewIfNeeded()
    const st = (t) => page.evaluate((x) => {
      const a = document.querySelector(`[data-test="${x}"]`); const n = document.querySelector(`[data-next="${x}"]`); const r = a.getBoundingClientRect()
      const ini = a.querySelector('.g-avatar__initials')
      return { cls: a.className, w: r.width, h: r.height, nx: n?.getBoundingClientRect().x, img: !!a.querySelector('img'), ini: ini?.textContent ?? null, vis: ini ? getComputedStyle(ini).visibility : null, icon: !!a.querySelector('svg.g-avatar__icon'), last: a.lastElementChild?.className }
    }, t)
    const before = await st('img-slow')
    await page.click('#av-slow-btn')
    await expect(page.locator('[data-test="img-slow"]')).toHaveClass(/is-loading/)
    const loading = await st('img-slow')
    expect(loading.ini).toBe('LT')
    expect(loading.vis).toBe('visible')
    expect(loading.last).toBe('g-avatar__img')
    release()
    await expect(page.locator('[data-test="img-slow"]')).toHaveClass(/is-loaded/)
    await page.waitForTimeout(400)
    const loaded = await st('img-slow')
    expect(loaded.vis).toBe('hidden')
    expect([before.w, before.h, loading.w, loading.h]).toEqual([loaded.w, loaded.h, loaded.w, loaded.h])
    expect(near(before.nx, loaded.nx, 0.01) && near(loading.nx, loaded.nx, 0.01), `texto vecino ${before.nx} → ${loading.nx} → ${loaded.nx}`).toBe(true)

    const ok = await st('img-ok')
    expect(ok.cls).toMatch(/is-loaded/)
    const br = await st('img-broken')
    expect(br.cls).toMatch(/is-failed/)
    expect(br.img).toBe(false)
    expect([br.ini, br.vis, br.w, br.h]).toEqual(['MG', 'visible', 40, 40])
    expect([br.w, br.h]).toEqual([ok.w, ok.h])
    const brn = await st('img-broken-noname')
    expect(brn.cls).toMatch(/is-failed/)
    expect(brn.icon).toBe(true)
    const wide = await st('img-wide')
    expect([wide.w, wide.h]).toEqual([40, 40])
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('[data-test="img-wide"] img')).objectFit)).toBe('cover')

    const sw0 = await st('img-swap')
    await page.click('#av-swap')
    await expect(page.locator('[data-test="img-swap"]')).toHaveClass(/is-loaded/)
    const sw1 = await st('img-swap')
    expect([sw1.w, sw1.h]).toEqual([sw0.w, sw0.h])
    expect(errs).toEqual([])
  })

  test('movimiento: fundido sin preferencia; nada con reduce', async ({ page, browser }) => {
    await open(page, { reducedMotion: 'no-preference' })
    const dur = await page.evaluate(() => getComputedStyle(document.querySelector('[data-test="img-ok"] img')).transitionDuration)
    expect(dur.split(',').some((d) => parseFloat(d) > 0), dur).toBe(true)
    const ctx = await browser.newContext({ reducedMotion: 'reduce' })
    const p2 = await ctx.newPage()
    await p2.goto(PAGE)
    await p2.waitForSelector('[data-test="img-ok"] img')
    const dur2 = await p2.evaluate(() => getComputedStyle(document.querySelector('[data-test="img-ok"] img')).transitionDuration)
    expect(dur2.split(',').every((d) => parseFloat(d) === 0), dur2).toBe(true)
    await ctx.close()
  })

  test('colores forzados (Chromium): borde CanvasText sin cambiar el tamaño', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'forced-colors solo se emula en Chromium')
    await open(page)
    await page.emulateMedia({ forcedColors: 'active' })
    await settle(page)
    const fc = await page.evaluate(() => [...document.querySelectorAll('#av-sizes .g-avatar, #av-colors .g-avatar')].map((a) => { const cs = getComputedStyle(a); return { s: cs.borderTopStyle, w: parseFloat(cs.borderTopWidth), side: a.getBoundingClientRect().width } }))
    expect(fc.every((x) => x.s === 'solid' && x.w >= 1)).toBe(true)
    expect((await rect(page, '[data-test="size-ini-md"]')).w).toBe(32)
  })

  test('huecos: GCard lead, GTable leading y GSidebar user adoptan la caja del avatar', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    // GCard lead (lg): caja 40 = avatar 40; una sola forma (sin borde ni relleno propios)
    const card = await page.evaluate(() => [...document.querySelectorAll('.cd-list .g-card__lead')].map((l) => {
      const a = l.querySelector(':scope > .g-avatar'); const cs = getComputedStyle(l)
      return { lead: l.getBoundingClientRect().width, av: a?.getBoundingClientRect().width, bw: cs.borderTopWidth, bg: cs.backgroundColor, hidden: l.getAttribute('aria-hidden') }
    }))
    expect(card).toHaveLength(3)
    for (const c of card) {
      expect([c.lead, c.av]).toEqual([40, 40])
      expect([c.bw, c.bg]).toEqual(['0px', 'rgba(0, 0, 0, 0)'])
    }
    // GTable leading-cliente (md): hueco 32 = avatar 32, sin relleno ni recorte; filas de la misma altura
    await page.locator('#sec-table').scrollIntoViewIfNeeded()
    const tbl = await page.evaluate(() => {
      const leads = [...document.querySelectorAll('#sec-table .g-table__leading')]
      return {
        sizes: leads.map((l) => [l.getBoundingClientRect().width, l.querySelector(':scope > .g-avatar')?.getBoundingClientRect().width]),
        hidden: leads.every((l) => l.getAttribute('aria-hidden') === 'true'),
        rows: [...document.querySelectorAll('#sec-table tbody tr')].map((r) => r.getBoundingClientRect().height),
        photos: document.querySelectorAll('#sec-table .g-table__leading .g-avatar__img').length
      }
    })
    expect(tbl.sizes.length).toBeGreaterThan(0)
    for (const [l, a] of tbl.sizes) expect([l, a]).toEqual([32, 32])
    expect(tbl.hidden).toBe(true)
    expect(Math.max(...tbl.rows) - Math.min(...tbl.rows)).toBeLessThanOrEqual(1)
    expect(tbl.photos).toBeGreaterThan(0)
    // GSidebar user (md): decorativo dentro del botón de la aplicación, que lleva el nombre
    const sb = await page.evaluate(() => { const a = document.querySelector('[data-test="sb-user-av"]'); const b = a.closest('button'); return { w: a.getBoundingClientRect().width, hidden: a.getAttribute('aria-hidden'), btn: b?.getAttribute('aria-label') || b?.textContent.trim() } })
    expect([sb.w, sb.hidden]).toEqual([32, 'true'])
    expect(sb.btn).toMatch(/Ana García/)
    expect(errs).toEqual([])
  })

  test('GBadge anclada: sobre un círculo, la insignia se centra en el contorno (±1.5px), en LTR y en RTL', async ({ page }) => {
    await open(page)
    await page.locator('#av-status').scrollIntoViewIfNeeded()
    const pos = () => page.evaluate(() => [...document.querySelectorAll('#av-status .g-badge-anchor')].map((an) => {
      const av = an.querySelector(':scope > .g-avatar'); const a = av.getBoundingClientRect(); const b = an.querySelector(':scope > .g-badge').getBoundingClientRect()
      const dx = (b.x + b.width / 2) - (a.x + a.width / 2); const dy = (b.y + b.height / 2) - (a.y + a.height / 2)
      return { circle: av.classList.contains('g-avatar--shape-circle'), dx, dy, r: a.width / 2, off: Math.hypot(dx, dy) - a.width / 2, corner: [Math.abs(dx) - a.width / 2, Math.abs(dy) - a.height / 2] }
    }))
    const ltr = await pos()
    expect(ltr).toHaveLength(4)
    for (const p of ltr.filter((x) => x.circle)) {
      expect(Math.abs(p.off), `contorno: ${p.off.toFixed(2)}px`).toBeLessThanOrEqual(1.5)
      expect(p.dx > 0 && p.dy > 0).toBe(true)
    }
    // square: en la esquina
    const sq = ltr.find((x) => !x.circle)
    expect(Math.abs(sq.corner[0]) <= 1.5 && Math.abs(sq.corner[1]) <= 1.5, JSON.stringify(sq)).toBe(true)
    await page.evaluate(() => document.querySelector('#av-status').setAttribute('dir', 'rtl'))
    await settle(page)
    const rtl = await pos()
    for (const p of rtl.filter((x) => x.circle)) {
      expect(Math.abs(p.off)).toBeLessThanOrEqual(1.5)
      expect(p.dx < 0 && p.dy > 0, 'se espeja').toBe(true)
    }
    // RTL no invierte las iniciales
    expect(await page.evaluate(() => [...document.querySelectorAll('#av-status .g-avatar__initials')].map((s) => s.textContent))).toEqual(['AL', 'LT', 'MG'])
  })

  test('GMenu: avatares en item.icon; todos los huecos a space × 5, etiquetas alineadas y alto del elemento igual', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    const trigger = page.locator('[data-test="mn-people-trigger"]')
    await trigger.scrollIntoViewIfNeeded()
    await trigger.click()
    const list = page.locator('.g-menu__list[aria-label="Asignar a"]:popover-open')
    await expect(list).toBeVisible()
    await settle(page)
    const items = await list.evaluate((l) => [...l.querySelectorAll('[role=menuitem]')].map((i) => {
      const slot = i.querySelector('.g-menu__icon'); const a = slot.firstElementChild
      return { h: i.getBoundingClientRect().height, slot: slot.getBoundingClientRect().width, kind: a.classList.contains('g-avatar') ? 'avatar' : 'icon', a: a.getBoundingClientRect().width, label: i.querySelector('.g-menu__label').getBoundingClientRect().left, hidden: slot.getAttribute('aria-hidden') }
    }))
    expect(items.map((i) => i.kind)).toEqual(['avatar', 'avatar', 'avatar', 'icon'])
    for (const i of items) {
      expect(near(i.slot, 20), `hueco ${i.slot}`).toBe(true)
      expect(i.hidden).toBe('true')
    }
    expect(items.filter((i) => i.kind === 'avatar').every((i) => near(i.a, 20))).toBe(true)
    expect(Math.max(...items.map((i) => i.label)) - Math.min(...items.map((i) => i.label))).toBeLessThanOrEqual(0.5)
    expect(Math.max(...items.map((i) => i.h)) - Math.min(...items.map((i) => i.h))).toBeLessThanOrEqual(0.5)
    const snap = await list.ariaSnapshot()
    expect(snap).toMatch(/menuitem "Ana María López"/)
    await page.keyboard.press('Escape')
    // Alto del elemento igual al de un menú solo con iconos (Acciones)
    await page.locator('#sec-menu').getByRole('button', { name: 'Acciones', exact: true }).click()
    const plain = page.locator('.g-menu__list[aria-label="Acciones del archivo"]:popover-open')
    await expect(plain).toBeVisible()
    const hPlain = await plain.evaluate((l) => l.querySelector('[role=menuitem]').getBoundingClientRect().height)
    expect(near(hPlain, items[0].h, 0.5), `${hPlain} vs ${items[0].h}`).toBe(true)
    await page.keyboard.press('Escape')
    expect(errs).toEqual([])
  })

  test('GSelect: avatar xs centrado en la línea de texto, en la lista y junto al valor; alto del control sin cambio', async ({ page }) => {
    const errs = await watchConsole(page)
    await open(page)
    const combo = page.getByRole('combobox', { name: 'Responsable (avatares)' })
    await combo.scrollIntoViewIfNeeded()
    const h0 = await combo.evaluate((b) => b.getBoundingClientRect().height)
    const hCountry = await page.getByRole('combobox', { name: /País/ }).first().evaluate((b) => b.getBoundingClientRect().height)
    expect(near(h0, hCountry, 0.5), `${h0} vs ${hCountry}`).toBe(true)
    await combo.click()
    const list = page.locator('.g-select__list:popover-open')
    await expect(list).toBeVisible()
    await settle(page)
    const centre = (rootSel) => page.evaluate((s) => [...document.querySelectorAll(s)].map((icon) => {
      const a = icon.querySelector(':scope > .g-avatar').getBoundingClientRect(); const box = icon.parentElement
      const txt = [...box.childNodes].filter((n) => n !== icon && (n.nodeType === 3 ? n.textContent.trim() : n.nodeType === 1 && !n.classList.contains('g-select__check')))
      const rg = document.createRange(); rg.setStartBefore(txt[0]); rg.setEndAfter(txt[txt.length - 1]); const t = rg.getBoundingClientRect()
      return { w: a.width, slot: icon.getBoundingClientRect().width, d: (a.y + a.height / 2) - (t.y + t.height / 2) }
    }), rootSel)
    const opts = await centre('.g-select__list:popover-open .g-select__icon')
    expect(opts).toHaveLength(4)
    for (const o of opts) {
      expect([o.w, o.slot]).toEqual([20, 20])
      expect(Math.abs(o.d), `opción Δ ${o.d}`).toBeLessThanOrEqual(1)
    }
    await page.locator('.g-select__list:popover-open [role="option"]').first().click()
    await expect(list).toHaveCount(0)
    const val = await centre('.g-select__value .g-select__icon:has(> .g-avatar)')
    expect(val).toHaveLength(1)
    expect(Math.abs(val[0].d), `valor Δ ${val[0].d}`).toBeLessThanOrEqual(1)
    expect(near(await combo.evaluate((b) => b.getBoundingClientRect().height), h0, 0.5)).toBe(true)
    expect(errs).toEqual([])
  })

  test('320px: la sección no desborda la página', async ({ page }) => {
    await open(page, { width: 320 })
    await page.locator('#sec-gavatar').scrollIntoViewIfNeeded()
    const over = await page.evaluate(() => [...document.querySelectorAll('#sec-gavatar .g-avatar')].filter((a) => a.getBoundingClientRect().right > innerWidth + 0.5).length)
    expect(over).toBe(0)
    expect(await page.evaluate(() => document.scrollingElement.scrollWidth)).toBeLessThanOrEqual(321)
  })
})
