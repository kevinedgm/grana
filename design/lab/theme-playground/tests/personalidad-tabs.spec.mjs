// GTabs · personalidad (DECISIONS.md #299 y #302; design/contracts/tabs.md «Personalidad»; plan 016).
// T1 «la marca se estira» y T2 «el contenido llega de su lado», medidos sobre el GTabs REAL del UMD (window.Grana),
// montado en la página del playground como en personalidad-btn.spec.mjs. Criterio de hecho: la medida de kiwi
// (personalidad/r01, `underline`: exceso de ~95px en el trayecto, el borde de delante llega antes, termina exacto;
// panel en +space × 4 adelante, −space × 4 atrás y −space × 4 en RTL adelante; 375px sin desborde).
// La medida es determinista: tras el clic se pausan las transiciones CSS reales (Web Animations) de la marca y del
// panel y se recorre su tiempo cada 4ms, así el exceso y el orden de llegada no dependen de en qué cuadro cae el muestreo.
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/index.html'
const ITEMS = [
  { id: 'res', label: 'Resumen' }, { id: 'act', label: 'Actividad' },
  { id: 'mem', label: 'Miembros del equipo' }, { id: 'fac', label: 'Facturas' }
]
const log = (...a) => { if (process.env.VERBOSE) console.log(...a) }

// Monta GTabs reales: cada caso { id, appearance, orientation, dir, detached, width }
const mount = async (page, cases, { reduce = false, viewport } = {}) => {
  if (reduce) await page.emulateMedia({ reducedMotion: 'reduce' })
  if (viewport) await page.setViewportSize(viewport)
  await page.goto(PAGE)
  await page.waitForSelector('.g-btn')
  await page.evaluate(([cases, items]) => {
    const host = document.createElement('div')
    host.id = 'pt-host'
    host.style.cssText = 'padding:16px;background:var(--g-color-surface)'
    document.body.prepend(host)
    const { createApp, h, reactive } = window.Vue
    const { GTabs, GTabPanel } = window.Grana
    const model = reactive(Object.fromEntries(cases.map((c) => [c.id, 'res'])))
    window.__model = model
    createApp({
      render: () => cases.map((c) => h('div', { dir: c.dir || 'ltr', style: `margin-block-end:24px;${c.width ? `max-inline-size:${c.width}` : ''}` }, [
        h(GTabs, {
          id: c.id, items, label: c.id, appearance: c.appearance || 'underline', orientation: c.orientation || 'horizontal',
          responsive: 'never', detached: !!c.detached, modelValue: model[c.id], 'onUpdate:modelValue': (v) => { model[c.id] = v }
        }, c.detached ? undefined : { panel: ({ item }) => c.edge
          // un hijo pegado a los bordes con el anillo de Grana (focus-width + focus-offset hacia fuera), en rojo puro para contarlo
          ? h('button', { class: 'pt-edge', style: 'display:block;inline-size:100%;margin:0;outline:var(--g-focus-width) solid rgb(255 0 0);outline-offset:var(--g-focus-offset)' }, item.label)
          : h('p', { style: 'margin:0' }, `Contenido de «${item.label}». Una línea de texto de prueba.`) }),
        c.detached ? items.map((it) => h(GTabPanel, { key: it.id, tabs: c.id, value: it.id, active: model[c.id] === it.id }, () => `Panel suelto de «${it.label}».`)) : null
      ]))
    }).mount(host)
    const probe = document.createElement('div'); probe.style.inlineSize = 'calc(var(--g-space-1) * 4)'; document.body.appendChild(probe)
    window.__shift = probe.getBoundingClientRect().width; probe.remove()
    window.__tr = (el) => { const t = getComputedStyle(el).translate; if (!t || t === 'none') return [0, 0]; const [x, y = '0px'] = t.split(' '); return [parseFloat(x), parseFloat(y)] }
  }, [cases, ITEMS])
  for (const c of cases) await expect(page.locator(`#${c.id}`)).toHaveClass(/is-ready/)
  await page.waitForTimeout(100)
}

// Clic en la pestaña `label` de `id`; pausa las transiciones nacidas (marca y panel) y las recorre cada 4ms
const seek = (page, id, label) => page.evaluate(async ([id, label]) => {
  const root = document.getElementById(id)
  const vertical = root.classList.contains('g-tabs--orientation-vertical')
  const mark = root.querySelector('.g-tabs__mark')
  const tab = [...root.querySelectorAll('[role="tab"]')].find((t) => t.textContent.includes(label))
  const panelOf = () => document.getElementById(tab.getAttribute('aria-controls')) || [...document.querySelectorAll('.g-tabs__panel:not([hidden])')].find((p) => p.getAttribute('aria-labelledby') === tab.id)
  const x0 = root.style.getPropertyValue('--_mark-x') + root.style.getPropertyValue('--_mark-y')
  tab.click()
  await window.Vue.nextTick()
  // GTabs mide y escribe --_mark-* tras el render: se espera a que cambien (con carga, puede tardar varios cuadros)
  for (let i = 0; i < 60 && root.style.getPropertyValue('--_mark-x') + root.style.getPropertyValue('--_mark-y') === x0; i++) await new Promise(requestAnimationFrame)
  const panel = panelOf()
  const read = () => {
    const r = mark.getBoundingClientRect()
    const [px, py] = panel ? window.__tr(panel) : [0, 0]
    return { s: vertical ? r.top : r.left, e: vertical ? r.bottom : r.right, len: vertical ? r.height : r.width, px, py, po: panel ? +getComputedStyle(panel).opacity : 1, sw: document.documentElement.scrollWidth }
  }
  read()
  const anims = [...mark.getAnimations(), ...(panel ? panel.getAnimations() : [])].filter((a) => a.transitionProperty !== undefined)
  anims.forEach((a) => a.pause())
  const info = anims.map((a) => ({ el: a.effect.target === mark ? 'mark' : 'panel', prop: a.transitionProperty, dur: a.effect.getComputedTiming().duration, easing: a.effect.getTiming().easing }))
  const xs = []
  for (let t = 0; t <= 260; t += 4) { anims.forEach((a) => { a.currentTime = t }); xs.push({ t, v: read() }) }
  anims.forEach((a) => a.finish())
  await new Promise(requestAnimationFrame)
  const tr = tab.getBoundingClientRect()
  return { info, xs, end: read(), tab: vertical ? { s: tr.top, e: tr.bottom, len: tr.height } : { s: tr.left, e: tr.right, len: tr.width }, dirAttr: root.getAttribute('data-direction'), panelDir: panel?.getAttribute('data-direction') ?? null, shift: window.__shift, sw: document.documentElement.scrollWidth }
}, [id, label])

const tabBox = (page, id, label) => page.evaluate(([id, label]) => {
  const root = document.getElementById(id)
  const vertical = root.classList.contains('g-tabs--orientation-vertical')
  const r = [...root.querySelectorAll('[role="tab"]')].find((t) => t.textContent.includes(label)).getBoundingClientRect()
  return vertical ? { s: r.top, e: r.bottom, len: r.height } : { s: r.left, e: r.right, len: r.width }
}, [id, label])

// Exceso de la marca en el trayecto y orden de llegada de los bordes (visual: `lead` es el borde que avanza en pantalla)
const t1 = (from, run, { physicalForward }) => {
  const { xs, tab: to } = run
  const stretch = Math.max(...xs.map((x) => x.v.len)) - Math.max(from.len, to.len)
  // physicalForward: la marca viaja hacia +x (o +y); el borde que avanza es `e`; si no, `s`
  const leadKey = physicalForward ? 'e' : 's', trailKey = physicalForward ? 's' : 'e'
  // Llegada = asentado: el primer instante desde el que el borde ya no sale de ±1px de su destino (el muelle cruza el
  // destino antes, rebasa un 3,8 % y vuelve: cruzar no es llegar). Así lo midió kiwi, cuadro a cuadro.
  const settle = (k) => { const out = xs.filter((x) => Math.abs(x.v[k] - to[k]) >= 1); const last = out.at(-1); return last ? (xs[xs.indexOf(last) + 1]?.t) : xs[0].t }
  return { stretch, travel: Math.abs(to.s - from.s), leadAt: settle(leadKey), trailAt: settle(trailKey) }
}

const expectT1 = (r, run, label) => {
  // Exceso proporcional al recorrido (kiwi, underline: 95px en 347px, ≈ 27 %); se exige ≥ 20 % del recorrido
  expect(r.stretch, `${label}: la marca se estira (exceso ${r.stretch.toFixed(1)}px en ${r.travel.toFixed(0)}px)`).toBeGreaterThan(r.travel * 0.2)
  expect(r.leadAt, `${label}: llega el borde de delante`).toBeDefined()
  expect(r.trailAt, `${label}: llega el borde de atrás`).toBeDefined()
  expect(r.leadAt, `${label}: el de delante (${r.leadAt}ms) antes que el de atrás (${r.trailAt}ms)`).toBeLessThan(r.trailAt)
  expect(Math.abs(run.end.s - run.tab.s), `${label}: inicio exacto`).toBeLessThanOrEqual(0.5)
  expect(Math.abs(run.end.e - run.tab.e), `${label}: fin exacto`).toBeLessThanOrEqual(0.5)
  const m = run.info.filter((i) => i.el === 'mark')
  expect(m.some((i) => i.prop === '--_tabs-s'), JSON.stringify(m)).toBe(true)
  expect(m.some((i) => i.prop === '--_tabs-e')).toBe(true)
  const spring = m.filter((i) => i.easing.startsWith('linear('))
  expect(spring.length, 'un solo borde con el muelle').toBe(1)
  expect(spring[0].dur).toBeCloseTo(240, 0)
}

test.describe('GTabs · T1 la marca se estira', () => {
  test('underline: adelante y atrás, el borde que avanza llega primero, termina exacto (medida de kiwi)', async ({ page }) => {
    await mount(page, [{ id: 'tu' }])
    const a = await tabBox(page, 'tu', 'Resumen')
    const fw = await seek(page, 'tu', 'Facturas')
    expect(fw.dirAttr).toBe('forward')
    const rf = t1(a, fw, { physicalForward: true })
    expectT1(rf, fw, 'underline adelante')
    expect(rf.stretch, 'kiwi: ~95px').toBeGreaterThan(80)
    // adelante: con forward, el borde final (--_tabs-e) es el rápido y el de inicio el del muelle
    expect(fw.info.find((i) => i.prop === '--_tabs-s').easing.startsWith('linear(')).toBe(true)
    const z = await tabBox(page, 'tu', 'Facturas')
    const bw = await seek(page, 'tu', 'Resumen')
    expect(bw.dirAttr).toBe('back')
    const rb = t1(z, bw, { physicalForward: false })
    expectT1(rb, bw, 'underline atrás')
    expect(rb.stretch, 'kiwi: ~95,6px').toBeGreaterThan(80)
    expect(bw.info.find((i) => i.prop === '--_tabs-e').easing.startsWith('linear(')).toBe(true)
    log(`T1 underline ${test.info().project.name}: exceso ${rf.stretch.toFixed(1)}px adelante (delante ${rf.leadAt}ms, atrás ${rf.trailAt}ms) · ${rb.stretch.toFixed(1)}px atrás (delante ${rb.leadAt}ms, atrás ${rb.trailAt}ms)`)
  })

  test('pill, segmented, contained y vertical (underline y pill): se estira, el de delante primero, exacto', async ({ page }) => {
    const cases = [
      { id: 'tp', appearance: 'pill' }, { id: 'ts', appearance: 'segmented' }, { id: 'tc', appearance: 'contained' },
      { id: 'tvu', orientation: 'vertical' }, { id: 'tvp', orientation: 'vertical', appearance: 'pill' }
    ]
    await mount(page, cases)
    const out = []
    for (const c of cases) {
      const a = await tabBox(page, c.id, 'Resumen')
      const fw = await seek(page, c.id, 'Facturas')
      const rf = t1(a, fw, { physicalForward: true })
      expectT1(rf, fw, `${c.id} adelante`)
      const z = await tabBox(page, c.id, 'Facturas')
      const bw = await seek(page, c.id, 'Resumen')
      const rb = t1(z, bw, { physicalForward: false })
      expectT1(rb, bw, `${c.id} atrás`)
      out.push(`${c.id} +${rf.stretch.toFixed(1)}/${rb.stretch.toFixed(1)}px en ${rf.travel.toFixed(0)}px (asentados ${rf.leadAt}<${rf.trailAt}ms)`)
    }
    log(`T1 apariencias ${test.info().project.name}: ${out.join(' · ')}`)
  })

  test('RTL: adelante (lógico) la marca viaja a la izquierda y llega primero su borde izquierdo', async ({ page }) => {
    await mount(page, [{ id: 'tr', dir: 'rtl' }])
    const a = await tabBox(page, 'tr', 'Resumen')
    const fw = await seek(page, 'tr', 'Facturas')
    expect(fw.dirAttr).toBe('forward')
    expect(fw.tab.s).toBeLessThan(a.s) // en pantalla, hacia la izquierda
    const r = t1(a, fw, { physicalForward: false })
    expectT1(r, fw, 'RTL adelante')
    log(`T1 RTL ${test.info().project.name}: exceso ${r.stretch.toFixed(1)}px (delante ${r.leadAt}ms, atrás ${r.trailAt}ms)`)
  })

  test('al montar no se anima (is-ready): la marca nace en su sitio, sin transiciones', async ({ page }) => {
    await mount(page, [{ id: 'tm' }])
    const n = await page.evaluate(() => document.querySelector('#tm .g-tabs__mark').getAnimations().length)
    expect(n).toBe(0)
    const a = await tabBox(page, 'tm', 'Resumen')
    const m = await page.evaluate(() => { const r = document.querySelector('#tm .g-tabs__mark').getBoundingClientRect(); return { s: r.left, e: r.right } })
    expect(Math.abs(m.s - a.s)).toBeLessThanOrEqual(0.5)
    expect(Math.abs(m.e - a.e)).toBeLessThanOrEqual(0.5)
  })
})

test.describe('GTabs · T2 el contenido llega de su lado', () => {
  test('horizontal: +space × 4 adelante, −space × 4 atrás; RTL adelante −space × 4; vertical por el bloque', async ({ page }) => {
    await mount(page, [{ id: 'pl' }, { id: 'pr', dir: 'rtl' }, { id: 'pv', orientation: 'vertical' }])
    const fw = await seek(page, 'pl', 'Facturas')
    const shift = fw.shift
    expect(shift).toBeGreaterThan(0)
    const pinfo = fw.info.filter((i) => i.el === 'panel')
    expect(pinfo.find((i) => i.prop === 'translate')?.dur, JSON.stringify(pinfo)).toBeCloseTo(240, 0)
    expect(pinfo.find((i) => i.prop === 'opacity')?.dur).toBeCloseTo(160, 0)
    expect(fw.xs[0].v.px).toBeCloseTo(shift, 1)
    expect(fw.xs[0].v.py).toBe(0)
    expect(fw.xs[0].v.po).toBe(0)
    expect(fw.end.px).toBe(0)
    expect(fw.end.po).toBe(1)
    const bw = await seek(page, 'pl', 'Actividad')
    expect(bw.xs[0].v.px).toBeCloseTo(-shift, 1)
    const rt = await seek(page, 'pr', 'Miembros')
    expect(rt.dirAttr).toBe('forward')
    expect(rt.xs[0].v.px).toBeCloseTo(-shift, 1)
    const rb = await seek(page, 'pr', 'Resumen')
    expect(rb.xs[0].v.px).toBeCloseTo(shift, 1)
    const vf = await seek(page, 'pv', 'Facturas')
    expect(vf.xs[0].v.px).toBe(0)
    expect(vf.xs[0].v.py).toBeCloseTo(shift, 1)
    const vb = await seek(page, 'pv', 'Resumen')
    expect(vb.xs[0].v.py).toBeCloseTo(-shift, 1)
    log(`T2 ${test.info().project.name}: adelante ${fw.xs[0].v.px}px, atrás ${bw.xs[0].v.px}px, RTL adelante ${rt.xs[0].v.px}px, RTL atrás ${rb.xs[0].v.px}px, vertical ${vf.xs[0].v.py}/${vb.xs[0].v.py}px (space × 4 = ${shift}px)`)
  })

  test('detached (GTabPanel suelto): la misma dirección en el panel', async ({ page }) => {
    await mount(page, [{ id: 'pd', detached: true }])
    const fw = await seek(page, 'pd', 'Facturas')
    expect(fw.panelDir).toBe('forward')
    expect(fw.xs[0].v.px).toBeCloseTo(fw.shift, 1)
    expect(fw.xs[0].v.po).toBe(0)
    const bw = await seek(page, 'pd', 'Resumen')
    expect(bw.panelDir).toBe('back')
    expect(bw.xs[0].v.px).toBeCloseTo(-fw.shift, 1)
    expect(bw.end.px).toBe(0)
  })

  // A 375px, con el margen lateral habitual (16px) y a sangre (la pestaña toca el borde de la ventana: el peor caso).
  // El recorte de los paneles existe donde hay overflow-clip-margin (Chromium, Firefox); WebKit no lo tiene y allí, a
  // sangre, el panel que entra rebasa como mucho space × 4 durante ≤ 240ms (límite conocido, tabs.md; estilo.md)
  for (const bleed of [false, true]) {
    test(`375px ${bleed ? 'a sangre' : 'con margen de 16px'}: sin desborde horizontal de la página durante la entrada`, async ({ page }) => {
      await mount(page, [{ id: 'pn' }], { viewport: { width: 375, height: 760 } })
      await page.evaluate((bleed) => { const h = document.getElementById('pt-host'); h.style.padding = bleed ? '0' : '0 16px' }, bleed)
      const sw0 = await page.evaluate(() => document.documentElement.scrollWidth)
      expect(sw0).toBeLessThanOrEqual(375)
      const clip = await page.evaluate(() => CSS.supports('overflow-clip-margin: 1px'))
      const xs = []
      for (const label of ['Actividad', 'Resumen', 'Facturas']) xs.push(...(await seek(page, 'pn', label)).xs)
      // y en tiempo real, cuadro a cuadro
      const rt = await page.evaluate(async () => {
        const tab = [...document.querySelectorAll('#pn [role="tab"]')].find((t) => t.textContent.includes('Miembros'))
        tab.click()
        const out = []; const t0 = performance.now()
        while (performance.now() - t0 < 300) { out.push(document.documentElement.scrollWidth); await new Promise(requestAnimationFrame) }
        return out
      })
      const max = Math.max(...xs.map((x) => x.v.sw), ...rt)
      const end = await page.evaluate(() => document.documentElement.scrollWidth)
      expect(end, 'al terminar, sin desborde').toBeLessThanOrEqual(375)
      if (bleed) {
        // A sangre: con recorte, lo que asoma es el margen del recorte (el anillo, focus-width + focus-offset); sin
        // overflow-clip-margin (WebKit), como mucho space × 4. Solo durante la entrada: al terminar, nada
        const lim = await page.evaluate((clip) => clip ? (() => { const p = document.createElement('div'); p.style.inlineSize = 'calc(var(--g-focus-width) + var(--g-focus-offset))'; document.body.appendChild(p); const w = p.getBoundingClientRect().width; p.remove(); return w })() : window.__shift, clip)
        expect(max, `a sangre: como mucho ${lim}px y solo durante la entrada`).toBeLessThanOrEqual(375 + lim)
        test.info().annotations.push({ type: 'límite conocido', description: `a sangre: scrollWidth máx ${max} durante la entrada (${clip ? 'margen del recorte' : 'sin overflow-clip-margin'})` })
      } else {
        expect(max, `scrollWidth máx durante la entrada`).toBeLessThanOrEqual(375)
      }
      log(`T2 375px ${bleed ? 'a sangre' : 'margen 16'} ${test.info().project.name}: scrollWidth máx ${max} (antes ${sw0}, al final ${end}; recorte ${clip ? 'sí' : 'no'})`)
    })
  }
})

test.describe('GTabs · recorte del panel', () => {
  test('el recorte no corta el anillo de foco de un hijo pegado al borde (cuatro lados)', async ({ page }) => {
    await mount(page, [{ id: 'pe', edge: true }])
    const box = await page.locator('#pe .g-tabs__panel:not([hidden]) .pt-edge').boundingBox()
    const ring = await page.evaluate(() => { const p = document.createElement('div'); p.style.inlineSize = 'calc(var(--g-focus-width) + var(--g-focus-offset))'; document.body.appendChild(p); const w = p.getBoundingClientRect().width; p.remove(); return w })
    const red = async (clip) => page.evaluate(async (b64) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode()
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
      const x = c.getContext('2d'); x.drawImage(img, 0, 0)
      const d = x.getImageData(0, 0, c.width, c.height).data; let n = 0
      for (let i = 0; i < d.length; i += 4) if (d[i] > 200 && d[i + 1] < 60 && d[i + 2] < 60) n++
      return n
    }, (await page.screenshot({ clip })).toString('base64'))
    const mid = box.y + box.height / 2
    const sides = {
      inicio: await red({ x: box.x - ring, y: mid - 4, width: ring, height: 8 }),
      fin: await red({ x: box.x + box.width, y: mid - 4, width: ring, height: 8 }),
      arriba: await red({ x: box.x + box.width / 2 - 4, y: box.y - ring, width: 8, height: ring }),
      abajo: await red({ x: box.x + box.width / 2 - 4, y: box.y + box.height, width: 8, height: ring })
    }
    const ov = await page.evaluate(() => { const cs = getComputedStyle(document.querySelector('#pe .g-tabs__panels')); return `${cs.overflowX}/${cs.overflowY} ${cs.overflowClipMargin ?? '—'}` })
    log(`recorte ${test.info().project.name}: ${ov}; anillo visible ${JSON.stringify(sides)}; caja ${JSON.stringify(box)}`)
    for (const [k, n] of Object.entries(sides)) expect(n, `anillo visible por ${k}`).toBeGreaterThan(0)
  })
})

test.describe('GTabs · movimiento reducido', () => {
  test('la marca salta (sin estirarse) y el panel solo se funde, sin desplazamiento', async ({ page }) => {
    await mount(page, [{ id: 'rr' }, { id: 'rd', detached: true }], { reduce: true })
    const fw = await seek(page, 'rr', 'Facturas')
    expect(fw.info.filter((i) => i.el === 'mark'), 'sin transiciones en la marca').toEqual([])
    expect(Math.abs(fw.xs[0].v.s - fw.tab.s)).toBeLessThanOrEqual(0.5)
    const p = fw.info.filter((i) => i.el === 'panel')
    expect(p.map((i) => i.prop)).toEqual(['opacity'])
    expect(p[0].dur).toBeCloseTo(120, 0)
    expect(fw.xs.every((x) => x.v.px === 0 && x.v.py === 0)).toBe(true)
    expect(fw.xs[0].v.po).toBe(0)
    const d = await seek(page, 'rd', 'Facturas')
    expect(d.info.filter((i) => i.el === 'panel').map((i) => i.prop)).toEqual(['opacity'])
    expect(d.xs.every((x) => x.v.px === 0)).toBe(true)
  })
})

test.describe('GTabs · slot tabs de GDialog (detached)', () => {
  test('el panel del cuerpo entra desde su lado y el cuerpo no gana desplazamiento horizontal', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'el diálogo del playground se cubre en Chromium; detached se mide en los tres motores arriba')
    await page.goto(PAGE)
    await page.waitForSelector('.g-btn')
    await page.waitForTimeout(400)
    const demo = page.locator('#tabs-demo')
    await demo.scrollIntoViewIfNeeded()
    await demo.getByRole('button', { name: 'Diálogo con pestañas' }).click()
    const dlg = page.locator('dialog.g-dialog[open]')
    await expect(dlg.locator('.g-dialog__tabs [role="tablist"]')).toBeVisible()
    await page.waitForTimeout(500)
    await page.evaluate(() => { window.__shift = (() => { const p = document.createElement('div'); p.style.inlineSize = 'calc(var(--g-space-1) * 4)'; document.body.appendChild(p); const w = p.getBoundingClientRect().width; p.remove(); return w })() })
    const r = await page.evaluate(async () => {
      const root = document.getElementById('tb-dlg')
      const tabs = [...root.querySelectorAll('[role="tab"]')]
      const cur = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true')
      const tab = tabs[cur + 1]
      const body = document.querySelector('dialog.g-dialog[open] .g-dialog__body')
      tab.click()
      await window.Vue.nextTick()
      const panel = document.getElementById(tab.getAttribute('aria-controls'))
      const t = getComputedStyle(panel).translate
      const anims = panel.getAnimations()
      anims.forEach((a) => { a.pause(); a.currentTime = 0 })
      const x0 = parseFloat(getComputedStyle(panel).translate) || 0
      const over = body.scrollWidth - body.clientWidth
      anims.forEach((a) => a.finish())
      return { dir: panel.getAttribute('data-direction'), x0, over, t, shift: window.__shift }
    })
    expect(r.dir).toBe('forward')
    expect(r.x0).toBeCloseTo(r.shift, 1)
    expect(r.over, 'el cuerpo no se desplaza en horizontal').toBeLessThanOrEqual(0)
  })
})
