// GMenu · personalidad (DECISIONS.md #299 y #305; design/contracts/menu.md «Personalidad»; plan 020, pasos 5–7).
// M1 «una sola luz que viaja», medida sobre el GMenu REAL del UMD (window.Grana) montado en la página del playground,
// como personalidad-btn.spec.mjs. Criterio de hecho: la medida de kiwi (personalidad/r01 §8): al barrer, 0 elementos con
// fondo propio y una sola superficie por lista; cuadros intermedios entre elementos (kiwi: 7); termina exacto sobre el
// elemento; con teclado sigue al foco; el puntero mueve el foco; deshabilitado con puntero: nada cambia; `reduce` salta;
// `forced-colors`: sin capa y con contorno por elemento. Datos (bruno): --_active-y/h, has-highlight, is-highlight-instant.
// La trayectoria se mide de forma determinista: tras mover el puntero se pausan las transiciones CSS reales del
// resaltado (Web Animations) y se recorre su tiempo cada 8ms; en Chromium además se cuentan cuadros en tiempo real.
import { test, expect } from '@playwright/test'

test.setTimeout(120_000)

const PAGE = '/packages/vue/playground/index.html'
const THEME = '/design/lab/tema-oscuro/dark-color-presence/generated/spotify.css'
const log = (...a) => { if (process.env.VERBOSE) console.log(...a) }

const ITEMS = [
  { id: 'ren', label: 'Renombrar', icon: 'pencil', shortcut: 'F2' },
  { id: 'dup', label: 'Duplicar', icon: 'copy', shortcut: '⌘D' },
  { id: 'mov', label: 'Mover a…', disabled: true },
  { id: 'arc', label: 'Archivar' },
  { type: 'separator' },
  { type: 'group', label: 'Mostrar', items: [
    { type: 'checkbox', id: 'grid', label: 'Cuadrícula', checked: true },
    { type: 'radio', id: 'by-name', label: 'Por nombre', checked: true }
  ] },
  { label: 'Exportar como', items: [{ id: 'pdf', label: 'PDF' }, { id: 'csv', label: 'CSV' }, { id: 'png', label: 'Imagen' }] },
  { id: 'del', label: 'Eliminar', danger: true }
]
const LONG = Array.from({ length: 30 }, (_, i) => ({ id: 'l' + i, label: `Elemento ${i + 1}` }))

const mount = async (page, { reduce = false, forced = false, scheme = 'light', theme = false } = {}) => {
  if (reduce || forced) await page.emulateMedia({ ...(reduce ? { reducedMotion: 'reduce' } : {}), ...(forced ? { forcedColors: 'active' } : {}) })
  await page.goto(PAGE)
  await page.waitForSelector('.g-btn', { timeout: 60_000 })
  await page.evaluate(async ({ items, long, scheme, theme }) => {
    document.documentElement.dataset.theme = scheme
    if (theme) {
      const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = theme
      await new Promise((res) => { l.onload = res; document.head.appendChild(l) })
    }
    const host = document.createElement('div')
    host.id = 'pm-host'
    host.style.cssText = 'padding:24px;display:flex;gap:24px;background:var(--g-color-bg)'
    document.body.prepend(host)
    const { createApp, h, reactive } = window.Vue
    const { GMenu } = window.Grana
    const open = reactive({ pm: false, pr: false, pl: false })
    window.__open = open
    window.__sel = []
    const menu = (id, list, dir) => h('div', { dir }, [h(GMenu, {
      id, items: list, modelValue: open[id], 'onUpdate:modelValue': (v) => { open[id] = v },
      onSelect: (e) => { window.__sel.push(e.id); e.event?.preventDefault?.() }
    }, { trigger: ({ attrs }) => h('button', { ...attrs, class: 'pm-trigger', style: 'font:inherit;padding:8px 12px' }, 'Abrir ' + id) })])
    createApp({ render: () => [menu('pm', items, 'ltr'), menu('pr', items, 'rtl'), menu('pl', long, 'ltr')] }).mount(host)

    const yOf = (el) => { const t = getComputedStyle(el).translate; if (!t || t === 'none') return 0; const p = t.split(' '); return parseFloat(p[1] || '0') }
    const alpha = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return c === 'transparent' ? 0 : 1; const p = m[1].split(/[ ,/]+/).filter(Boolean); return p.length > 3 ? parseFloat(p[3]) : 1 }
    window.__yOf = yOf
    window.__hl = (list) => list.querySelector(':scope > .g-menu__highlight')
    window.__lists = () => [...document.querySelectorAll('#pm-host .g-menu__list, body > .g-menu__list')].filter((l) => l.matches(':popover-open'))
    // Una foto por lista abierta: superficies (elementos con fondo propio + la capa si se ve) y posición de la capa
    window.__snap = () => window.__lists().map((l) => {
      const hl = window.__hl(l)
      const op = hl ? +getComputedStyle(hl).opacity : 0
      const own = [...l.querySelectorAll('.g-menu__item')].filter((i) => i.closest('.g-menu__list') === l && alpha(getComputedStyle(i).backgroundColor) > 0).length
      return { id: l.id, own, lit: op > 0.01 ? 1 : 0, op, y: hl ? yOf(hl) : null, h: hl ? hl.getBoundingClientRect().height : null, ys: [...l.querySelectorAll('.g-menu__item')].filter((i) => i.closest('.g-menu__list') === l).map((i) => i.offsetTop) }
    })
    // Capa frente al elemento: caja de la capa (ya asentada) contra la del elemento
    window.__fit = (item) => {
      const l = item.closest('.g-menu__list'); const hl = window.__hl(l)
      const a = hl.getBoundingClientRect(); const b = item.getBoundingClientRect()
      return { dt: Math.abs(a.top - b.top), dh: Math.abs(a.height - b.height), dl: Math.abs(a.left - b.left), dr: Math.abs(a.right - b.right), op: +getComputedStyle(hl).opacity, has: l.classList.contains('has-highlight') }
    }
    window.__settle = async () => {
      for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame)
      document.querySelectorAll('.g-menu__highlight').forEach((hl) => hl.getAnimations().forEach((a) => a.finish()))
      await new Promise(requestAnimationFrame)
    }
    window.__rec = { on: false, frames: [] }
    window.__recStart = () => {
      const r = window.__rec; r.frames = []; r.on = true
      const tick = () => { if (!r.on) return; r.frames.push(window.__snap()); requestAnimationFrame(tick) }
      requestAnimationFrame(tick)
    }
    window.__recStop = () => { window.__rec.on = false; return window.__rec.frames }
  }, { items: ITEMS, long: LONG, scheme, theme: theme ? THEME : null })
  await page.waitForTimeout(50)
}

const openByClick = async (page, id) => {
  await page.locator(`#${id}-trigger`).click()
  await expect(page.locator(`#${id}-trigger[aria-expanded="true"]`)).toHaveCount(1)
  await expect(page.locator('.g-menu__list:popover-open').first()).toBeVisible()
  await page.evaluate(() => window.__settle())
}
const listOf = (page, id) => page.locator(`.g-menu__list[aria-labelledby="${id}-trigger"]`)
const item = (page, id, label) => listOf(page, id).locator('.g-menu__item', { hasText: label }).first()
const hover = async (page, loc, steps = 4) => {
  const b = await loc.boundingBox()
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps })
}
const expectFit = async (page, loc, label) => {
  await page.evaluate(() => window.__settle())
  const f = await loc.evaluate((el) => window.__fit(el))
  expect(f.has, `${label}: has-highlight`).toBe(true)
  expect(f.op, `${label}: la capa se ve`).toBeGreaterThan(0.99)
  for (const k of ['dt', 'dh', 'dl', 'dr']) expect(f[k], `${label}: ${k} ${f[k].toFixed(2)}`).toBeLessThanOrEqual(1)
}

test.describe('GMenu · M1 una sola luz que viaja', () => {
  test('barrido con el puntero: 0 elementos con fondo propio, una superficie por lista, el puntero mueve el foco y termina exacto', async ({ page }) => {
    await mount(page)
    await openByClick(page, 'pm')
    await page.evaluate(() => window.__recStart())
    const labels = ['Renombrar', 'Duplicar', 'Mover a…', 'Archivar', 'Cuadrícula', 'Por nombre', 'Eliminar', 'Archivar', 'Renombrar']
    for (const l of labels) {
      await hover(page, item(page, 'pm', l), 6)
      if (l !== 'Mover a…') expect(await page.evaluate(() => document.activeElement?.textContent.trim()), `foco tras el puntero en «${l}»`).toContain(l)
    }
    await page.waitForTimeout(250)
    const frames = await page.evaluate(() => window.__recStop())
    const per = frames.flat()
    const maxOwn = Math.max(...per.map((s) => s.own))
    const maxSurf = Math.max(...per.map((s) => s.own + s.lit))
    log(`M1 barrido ${test.info().project.name}: ${frames.length} cuadros, fondo propio máx ${maxOwn}, superficies por lista máx ${maxSurf}`)
    expect(frames.length).toBeGreaterThan(10)
    expect(maxOwn, 'ningún elemento con fondo propio').toBe(0)
    expect(maxSurf, 'una sola superficie por lista').toBeLessThanOrEqual(1)
    await expectFit(page, item(page, 'pm', 'Renombrar'), 'final del barrido')
    // Una sola capa por lista (marcado de bruno) y bajo el contenido: el texto del elemento se pinta encima
    const order = await listOf(page, 'pm').evaluate((l) => {
      const hl = window.__hl(l); const it = l.querySelector('.g-menu__item')
      const r = it.querySelector('.g-menu__label').getBoundingClientRect()
      return { n: l.querySelectorAll(':scope > .g-menu__highlight').length, top: document.elementFromPoint(r.left + 4, r.top + r.height / 2)?.closest('.g-menu__item') === it, pe: getComputedStyle(hl).pointerEvents }
    })
    expect(order.n).toBe(1)
    expect(order.top, 'el elemento queda encima de la capa').toBe(true)
    expect(order.pe).toBe('none')
  })

  test('trayecto entre elementos: cuadros intermedios en press y ease-out, sin sobrepaso, y termina exacto', async ({ page }) => {
    await mount(page)
    await openByClick(page, 'pm')
    await hover(page, item(page, 'pm', 'Renombrar'))
    await expectFit(page, item(page, 'pm', 'Renombrar'), 'origen')
    const from = await item(page, 'pm', 'Renombrar').evaluate((el) => el.offsetTop)
    const to = await item(page, 'pm', 'Por nombre').evaluate((el) => el.offsetTop)
    // El movimiento del puntero se despacha dentro de la página (pointermove de ratón sobre el elemento, el mismo manejador
    // de GMenu.vue) para pausar la transición en su primer cuadro: en WebKit, page.mouse.move vuelve cuando ya terminó
    const run = await listOf(page, 'pm').evaluate(async (l) => {
      const hl = window.__hl(l)
      const target = [...l.querySelectorAll('.g-menu__item')].find((i) => i.textContent.includes('Por nombre'))
      const b = target.getBoundingClientRect()
      target.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse', clientX: b.left + b.width / 2, clientY: b.top + b.height / 2 }))
      let anims = []
      for (let i = 0; i < 30 && !anims.length; i++) { anims = hl.getAnimations().filter((a) => a.transitionProperty === 'translate'); if (!anims.length) await new Promise(requestAnimationFrame) }
      const all = hl.getAnimations().filter((a) => a.transitionProperty !== undefined)
      all.forEach((a) => a.pause())
      const info = all.map((a) => ({ prop: a.transitionProperty, dur: a.effect.getComputedTiming().duration, easing: a.effect.getTiming().easing }))
      const ys = []
      for (let t = 0; t <= 168; t += 8) { all.forEach((a) => { a.currentTime = t }); ys.push(window.__yOf(hl)) }
      all.forEach((a) => a.finish())
      return { info, ys, focus: document.activeElement === target }
    })
    log(`M1 trayecto ${test.info().project.name}: ${from}→${to} · ${run.ys.map((y) => y.toFixed(1)).join(' ')} · ${JSON.stringify(run.info)}`)
    expect(run.focus, 'el puntero movió el foco').toBe(true)
    const tr = run.info.find((i) => i.prop === 'translate')
    expect(tr, JSON.stringify(run.info)).toBeTruthy()
    expect(tr.dur).toBeCloseTo(160, 0)
    expect(tr.easing.replace(/\s/g, '')).toBe('cubic-bezier(0.23,1,0.32,1)')
    expect(run.info.some((i) => i.easing.startsWith('linear(')), 'sin muelle (#299)').toBe(false)
    const mids = run.ys.filter((y) => y > from + 0.5 && y < to - 0.5)
    expect(mids.length, 'cuadros intermedios').toBeGreaterThanOrEqual(5)
    for (let i = 1; i < run.ys.length; i++) expect(run.ys[i], 'monótono').toBeGreaterThanOrEqual(run.ys[i - 1] - 0.01)
    expect(Math.max(...run.ys), 'sin sobrepaso').toBeLessThanOrEqual(to + 0.01)
    await expectFit(page, item(page, 'pm', 'Por nombre'), 'destino')
  })

  test('tiempo real (Chromium): cuadros intermedios al saltar entre elementos (kiwi: 7)', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'el conteo rAF en tiempo real es inestable con carga fuera de Chromium; los tres motores se miden arriba de forma determinista')
    await mount(page)
    await openByClick(page, 'pm')
    await hover(page, item(page, 'pm', 'Renombrar'))
    await page.evaluate(() => window.__settle())
    const to = await item(page, 'pm', 'Eliminar').evaluate((el) => el.offsetTop)
    await page.evaluate(() => window.__recStart())
    await hover(page, item(page, 'pm', 'Eliminar'), 1)
    await page.waitForTimeout(300)
    const frames = (await page.evaluate(() => window.__recStop())).map((f) => f[0])
    const from = frames[0].y
    const mids = frames.filter((f) => f.y > from + 0.5 && f.y < to - 0.5).length
    log(`M1 tiempo real: ${mids} cuadros intermedios (${from}→${to})`)
    expect(mids).toBeGreaterThanOrEqual(4)
    expect(Math.abs(frames.at(-1).y - to)).toBeLessThanOrEqual(0.5)
  })

  test('teclado: la capa sigue al foco (también al deshabilitado) y cada submenú tiene la suya; el padre expandido sigue resaltado', async ({ page }) => {
    await mount(page)
    await page.locator('#pm-trigger').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.locator('.g-menu__list:popover-open')).toHaveCount(1)
    let ok = 0
    const expected = ['Renombrar', 'Duplicar', 'Mover a…', 'Archivar', 'Cuadrícula', 'Por nombre', 'Exportar como', 'Eliminar']
    for (let i = 0; i < expected.length; i++) {
      if (i) await page.keyboard.press('ArrowDown')
      const label = await page.evaluate(() => document.activeElement.textContent.trim())
      expect(label).toContain(expected[i])
      await expectFit(page, page.locator(':focus'), `teclado «${expected[i]}»`)
      ok++
    }
    expect(ok).toBe(expected.length)
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('.g-menu__list:popover-open')).toHaveCount(2)
    expect(await page.evaluate(() => document.activeElement.textContent.trim())).toContain('PDF')
    await expectFit(page, page.locator(':focus'), 'submenú, primer elemento')
    await expectFit(page, item(page, 'pm', 'Exportar como'), 'padre expandido')
    await page.keyboard.press('ArrowDown')
    await expectFit(page, page.locator(':focus'), 'submenú, segundo elemento')
    const snap = await page.evaluate(() => window.__snap())
    expect(snap.length).toBe(2)
    for (const s of snap) { expect(s.own).toBe(0); expect(s.lit).toBe(1) }
    await page.keyboard.press('Escape')
    await expect(page.locator('.g-menu__list:popover-open')).toHaveCount(1)
    await expectFit(page, page.locator(':focus'), 'vuelta al padre')
  })

  test('primera colocación sin viaje: al abrir (con clic y con ↑) y al abrir un submenú', async ({ page }) => {
    await mount(page)
    // Abre con ↑ (foco en el último): debe aparecer ya sobre él, sin venir desde 0
    const firstFrames = async (open) => {
      await page.evaluate(() => {
        window.__early = []
        const r = window.__early
        const before = new Set(window.__lists())
        let n = 0
        const tick = () => {
          // Solo la lista que se abre ahora (no la raíz que ya estaba abierta)
          const ls = window.__lists().filter((l) => !before.has(l))
          if (ls.length) {
            const l = ls.at(-1); const hl = window.__hl(l)
            r.push({ inst: l.classList.contains('is-highlight-instant'), has: l.classList.contains('has-highlight'), y: window.__yOf(hl), moving: hl.getAnimations().filter((a) => a.transitionProperty === 'translate' || a.transitionProperty === 'block-size').length, target: parseFloat(l.style.getPropertyValue('--_active-y')) })
            n++
          }
          if (n < 8) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      })
      await open()
      await page.waitForTimeout(250)
      return page.evaluate(() => window.__early)
    }
    const check = (fr, label) => {
      log(`instant ${label} ${test.info().project.name}: ${JSON.stringify(fr.slice(0, 5))}`)
      const lit = fr.filter((f) => f.has)
      expect(lit.length, `${label}: con activo`).toBeGreaterThan(0)
      expect(lit.some((f) => f.inst), `${label}: is-highlight-instant en la primera colocación`).toBe(true)
      expect(fr.at(-1).inst, `${label}: se retira`).toBe(false)
      expect(Math.max(...lit.map((f) => f.moving)), `${label}: sin transición de posición ni alto`).toBe(0)
      for (const f of lit) expect(Math.abs(f.y - f.target), `${label}: en su sitio desde el primer cuadro`).toBeLessThanOrEqual(0.5)
    }
    await page.locator('#pm-trigger').focus()
    check(await firstFrames(() => page.keyboard.press('ArrowUp')), 'abrir con ↑')
    expect(await page.evaluate(() => document.activeElement.textContent.trim())).toContain('Eliminar')
    await page.keyboard.press('Escape')
    await expect(page.locator('.g-menu__list:popover-open')).toHaveCount(0)
    await page.waitForTimeout(250)
    check(await firstFrames(() => page.locator('#pm-trigger').click()), 'abrir con clic')
    await page.keyboard.press('End')
    await page.keyboard.press('ArrowUp')
    check(await firstFrames(() => page.keyboard.press('ArrowRight')), 'abrir submenú')
  })

  test('deshabilitado con el puntero: no mueve foco ni capa', async ({ page }) => {
    await mount(page)
    await openByClick(page, 'pm')
    await hover(page, item(page, 'pm', 'Duplicar'))
    await page.evaluate(() => window.__settle())
    const y0 = await listOf(page, 'pm').evaluate((l) => window.__yOf(window.__hl(l)))
    await hover(page, item(page, 'pm', 'Mover a…'))
    await page.waitForTimeout(250)
    expect(await page.evaluate(() => document.activeElement.textContent.trim())).toContain('Duplicar')
    const y1 = await listOf(page, 'pm').evaluate((l) => window.__yOf(window.__hl(l)))
    expect(y1).toBe(y0)
    await expectFit(page, item(page, 'pm', 'Duplicar'), 'sigue en el habilitado')
  })

  test('lista con desplazamiento y RTL: la capa va con el contenido y ocupa el ancho del elemento', async ({ page }) => {
    await mount(page)
    await openByClick(page, 'pl')
    const scrolls = await listOf(page, 'pl').evaluate((l) => l.scrollHeight > l.clientHeight + 4)
    expect(scrolls, 'la lista larga se desplaza').toBe(true)
    await page.keyboard.press('End')
    await expectFit(page, page.locator(':focus'), 'último, con la lista desplazada')
    await listOf(page, 'pl').evaluate((l) => { l.scrollTop = Math.max(0, l.scrollTop - 60) })
    await expectFit(page, page.locator(':focus'), 'tras desplazar la lista')
    await page.keyboard.press('Escape')
    await openByClick(page, 'pr')
    expect(await listOf(page, 'pr').evaluate((l) => getComputedStyle(l).direction)).toBe('rtl')
    await hover(page, item(page, 'pr', 'Archivar'))
    await expectFit(page, item(page, 'pr', 'Archivar'), 'RTL')
  })

  test('movimiento reducido: la capa salta (sin transición de posición), con fundido', async ({ page }) => {
    await mount(page, { reduce: true })
    await openByClick(page, 'pm')
    await hover(page, item(page, 'pm', 'Renombrar'))
    await page.evaluate(() => window.__settle())
    await hover(page, item(page, 'pm', 'Eliminar'), 1)
    const r = await listOf(page, 'pm').evaluate(async (l) => {
      const hl = window.__hl(l)
      const out = []
      for (let i = 0; i < 6; i++) { await new Promise(requestAnimationFrame); out.push({ y: window.__yOf(hl), t: parseFloat(l.style.getPropertyValue('--_active-y')), moving: hl.getAnimations().filter((a) => a.transitionProperty === 'translate').length }) }
      const cs = getComputedStyle(hl)
      return { out, prop: cs.transitionProperty, dur: cs.transitionDuration }
    })
    log(`reduce ${test.info().project.name}: ${JSON.stringify(r)}`)
    expect(r.prop).toBe('opacity')
    expect(Math.max(...r.out.map((o) => o.moving))).toBe(0)
    for (const o of r.out) expect(Math.abs(o.y - o.t)).toBeLessThanOrEqual(0.5)
    await expectFit(page, item(page, 'pm', 'Eliminar'), 'reduce')
  })

  test('colores forzados (Chromium): sin capa y contorno de sistema en el activo y en el padre expandido', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'forcedColors solo se emula en Chromium')
    await mount(page, { forced: true })
    await openByClick(page, 'pm')
    await hover(page, item(page, 'pm', 'Archivar'))
    await page.waitForTimeout(100)
    const r = await listOf(page, 'pm').evaluate((l) => {
      const hl = window.__hl(l); const it = document.activeElement; const cs = getComputedStyle(it)
      return { display: getComputedStyle(hl).display, label: it.textContent.trim(), ow: parseFloat(cs.outlineWidth), os: cs.outlineStyle }
    })
    expect(r.label).toContain('Archivar')
    expect(r.display).toBe('none')
    expect(r.os).toBe('solid')
    expect(r.ow).toBeGreaterThan(0)
    // El puntero sale de la lista antes de usar el teclado (con el puntero quieto sobre un elemento del padre, abrir un
    // submenú con → lo cierra al instante: defecto previo de GMenu.vue, anotado para bruno)
    await page.mouse.move(2, 2)
    await page.waitForTimeout(100)
    await page.keyboard.press('End')
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('.g-menu__list:popover-open')).toHaveCount(2)
    expect(await page.evaluate(() => document.activeElement.textContent.trim())).toContain('PDF')
    const parent = await item(page, 'pm', 'Exportar como').evaluate((el) => { const cs = getComputedStyle(el); return { os: cs.outlineStyle, ow: parseFloat(cs.outlineWidth) } })
    expect(parent.os).toBe('solid')
    expect(parent.ow).toBeGreaterThan(0)
  })

  // Contraste del texto de cada elemento sobre la capa (capa compuesta sobre la lista y la lista sobre la página)
  for (const scheme of ['light', 'dark']) {
    for (const theme of [false, true]) {
      test(`contraste sobre la capa ≥ 4,5:1 · ${scheme} · ${theme ? 'tema generado (spotify)' : 'tema por defecto'}`, async ({ page }) => {
        await mount(page, { scheme, theme })
        await page.locator('#pm-trigger').focus()
        await page.keyboard.press('ArrowDown')
        await expect(page.locator('.g-menu__list:popover-open')).toHaveCount(1)
        const rows = []
        for (const label of ['Renombrar', 'Mover a…', 'Eliminar']) {
          while (!(await page.evaluate(() => document.activeElement.textContent.trim())).includes(label)) await page.keyboard.press('ArrowDown')
          await page.evaluate(() => window.__settle())
          const r = await page.evaluate(() => {
            const it = document.activeElement; const l = it.closest('.g-menu__list'); const hl = window.__hl(l)
            const rgba = (s) => { const c = document.createElement('canvas').getContext('2d'); c.fillStyle = s; c.fillRect(0, 0, 1, 1); const d = c.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
            const over = (top, under) => top.slice(0, 3).map((v, i) => v * top[3] + under[i] * (1 - top[3]))
            const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
            const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
            const cr = (a, b) => { const x = L(a); const y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
            const page = over(rgba(getComputedStyle(document.body).backgroundColor), [255, 255, 255])
            const list = over(rgba(getComputedStyle(l).backgroundColor), page)
            const bg = over(rgba(getComputedStyle(hl).backgroundColor), list)
            const fg = (el) => over(rgba(getComputedStyle(el).color), bg)
            const out = { label: it.textContent.trim(), bg: bg.map(Math.round), text: cr(fg(it.querySelector('.g-menu__label')), bg), surface: cr(bg, list) }
            const sc = it.querySelector('.g-menu__shortcut'); if (sc) out.shortcut = cr(fg(sc), bg)
            const ic = it.querySelector('.g-menu__icon > svg'); if (ic) out.icon = cr(fg(ic), bg)
            return out
          })
          rows.push(r)
        }
        log(`contraste ${test.info().project.name} ${scheme} ${theme ? 'spotify' : 'defecto'}: ` + rows.map((r) => `${r.label} rgb(${r.bg}) texto ${r.text.toFixed(2)}${r.shortcut ? ` atajo ${r.shortcut.toFixed(2)}` : ''}${r.icon ? ` icono ${r.icon.toFixed(2)}` : ''}`).join(' · '))
        for (const r of rows) {
          expect(r.text, `${r.label}: texto ${r.text.toFixed(2)}`).toBeGreaterThanOrEqual(4.5)
          if (r.shortcut) expect(r.shortcut, `${r.label}: atajo ${r.shortcut.toFixed(2)}`).toBeGreaterThanOrEqual(4.5)
          if (r.icon) expect(r.icon, `${r.label}: icono ${r.icon.toFixed(2)}`).toBeGreaterThanOrEqual(3)
        }
      })
    }
  }
})

test.describe('GMenu · M1 en consumidores (playground)', () => {
  test('menú de fila de GTable (Chromium): una superficie, el puntero mueve el foco y la capa termina exacta', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'consumidor: comprobación en Chromium (plan 020)')
    await page.goto(PAGE)
    await page.waitForSelector('#sec-table .g-table__actions .g-btn', { timeout: 30_000 })
    const btn = page.locator('#sec-table .g-table__actions .g-btn').first()
    await btn.scrollIntoViewIfNeeded()
    await btn.click()
    const list = page.locator('.g-menu__list:popover-open')
    await expect(list).toHaveCount(1)
    const editar = list.locator('.g-menu__item', { hasText: 'Editar' })
    const b = await editar.boundingBox()
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 4 })
    await expect(editar).toBeFocused()
    await page.waitForTimeout(250)
    const r = await list.evaluate((l) => {
      const hl = l.querySelector(':scope > .g-menu__highlight'); const it = document.activeElement
      const a = hl.getBoundingClientRect(); const c = it.getBoundingClientRect()
      const own = [...l.querySelectorAll('.g-menu__item')].filter((i) => !/rgba\(0, 0, 0, 0\)|transparent/.test(getComputedStyle(i).backgroundColor)).length
      return { own, op: +getComputedStyle(hl).opacity, dt: Math.abs(a.top - c.top), dh: Math.abs(a.height - c.height) }
    })
    expect(r.own).toBe(0)
    expect(r.op).toBeGreaterThan(0.99)
    expect(r.dt).toBeLessThanOrEqual(1)
    expect(r.dh).toBeLessThanOrEqual(1)
  })
})
