// Niveles anidados de GDialog · B «El hilo» (GDialogStep, modo pasos) sobre el COMPONENTE REAL (dist/) en
// packages/vue/playground/dialog-levels.html?mode=steps: Detalle → Ingreso → Partida 3 → Producto nuevo → Categoría nueva.
// Contrato: design/contracts/dialog.md §«Niveles anidados» (base 1 a 12, B, «La llegada», «Verificación») y #580 a #591;
// hallazgos H1 y H2 de design/lab/dialog/auditoria-pasos.md (el pie de cada paso es el suyo, también con plantilla compilada).
// Los pliegues (C, GFormFold) están en form-fold.spec.mjs.
import { test, expect } from '@playwright/test'
import { load, settled, openAt, state, takeEvents, rec, liveInDialog, landing, overflowX, clean, animStarts } from './dialog-levels-helpers.mjs'

const STEPS = ['detalle', 'ingreso', 'partida', 'producto', 'categoria']
const OPENERS = { ingreso: 'f-detalle-ingreso', partida: 'f-ingreso-p3', producto: 'crear-producto', categoria: 'crear-categoria' }
const FIRST = { ingreso: 'f-ingreso-oc', producto: 'f-producto-nombre', categoria: 'f-categoria-nombre' }

/** Marcado y pie del paso actual. */
const shape = (page) => page.evaluate(() => {
  const d = document.getElementById('dlg')
  const cur = window.__lv.state.steps.value.at(-1)
  const panels = [...d.querySelectorAll('.g-dialog__body > .g-dialog__step')]
  return {
    cur,
    steps: d.classList.contains('g-dialog--steps'),
    labelledby: d.getAttribute('aria-labelledby'),
    describedby: d.getAttribute('aria-describedby'),
    h2: d.querySelector('.g-dialog__header .g-dialog__title')?.id,
    back: d.querySelector('.g-dialog__back')?.getAttribute('aria-label') ?? null,
    trail: d.querySelector('nav.g-dialog__trail')?.getAttribute('aria-label') ?? null,
    items: [...d.querySelectorAll('.g-dialog__trail-item')].map((li) => ({ cls: li.className.replace('g-dialog__trail-item', '').trim(), tag: li.firstElementChild.tagName, current: li.firstElementChild.getAttribute('aria-current'), name: li.firstElementChild.textContent.replace(/\s+/g, ' ').trim() })),
    panels: panels.map((p) => ({ by: p.getAttribute('aria-labelledby'), hidden: p.hidden, inert: p.hasAttribute('inert'), current: p.classList.contains('is-current'), role: p.getAttribute('role') })),
    footer: [...d.querySelectorAll('.g-dialog__footer > *')].map((b) => ({ id: b.id, type: b.getAttribute('type'), cls: b.className }))
  }
})

test.describe('GDialog · niveles anidados · pasos (B)', () => {
  test('cinco pasos: encabezado, nombre del <dialog>, paneles, hilo y el PIE DE CADA PASO es el suyo (H1)', async ({ page }) => {
    const errs = await load(page, 'mode=steps')
    await page.click('#opener')
    await settled(page)
    let s = await shape(page)
    expect(s.steps).toBe(true)
    expect(s.labelledby).toBe('dlg-step-detalle-title')
    expect(s.back).toBeNull()
    expect(s.trail).toBeNull()
    expect(s.footer).toEqual([])
    for (const name of STEPS.slice(1)) {
      await page.click('#' + OPENERS[name])
      await settled(page)
      s = await shape(page)
      const depth = STEPS.indexOf(name) + 1
      expect(s.cur).toBe(name)
      expect(s.labelledby).toBe(`dlg-step-${name}-title`)
      expect(s.h2).toBe(`dlg-step-${name}-title`)
      expect(s.describedby).toBe(`dlg-step-${name}-desc`)
      expect(s.back).toMatch(/^Volver a /)
      expect(s.trail).toBe('Recorrido')
      expect(s.items).toHaveLength(depth)
      expect(s.items.at(-1)).toMatchObject({ cls: 'is-current', tag: 'SPAN', current: 'step' })
      expect(s.items.at(-2).cls).toBe('is-parent')
      expect(s.items.slice(0, -1).every((i) => i.tag === 'BUTTON' && i.current === null)).toBe(true)
      // summary se lee tras el título del paso (texto oculto)
      expect(s.items[0].name).toContain(', Existencia 48 L')
      // Paneles: uno por paso del historial; solo el actual visible; los de debajo montados, hidden + inert
      expect(s.panels.map((p) => p.by)).toEqual(STEPS.slice(0, depth).map((n) => `dlg-step-${n}-title`))
      expect(s.panels.every((p) => p.role === 'group')).toBe(true)
      expect(s.panels.map((p) => p.current)).toEqual(STEPS.slice(0, depth).map((n) => n === name))
      expect(s.panels.slice(0, -1).every((p) => p.hidden && p.inert)).toBe(true)
      // El pie es el del paso actual: ids, tipo y apariencia, no los del anterior parcheados (H1)
      expect(s.footer.map((b) => b.id)).toEqual([`${name}-cancelar`, `${name}-ok`])
      expect(s.footer.every((b) => b.type === 'button')).toBe(true)
      expect(s.footer[0].cls).toContain('g-btn--variant-ghost')
      expect(s.footer[1].cls).toContain('g-btn--variant-solid')
    }
    // Las escuchas del pie son las del paso actual: confirmar «Categoría nueva» vacía valida ESE paso
    await page.click('#categoria-ok')
    await page.waitForTimeout(150)
    expect(await page.evaluate(() => Object.keys(window.__lv.errors.categoria))).toEqual(['nombre'])
    expect(await page.evaluate(() => Object.keys(window.__lv.errors.producto))).toEqual([])
    // Al volver, el pie vuelve a ser el de abajo
    for (const name of ['producto', 'partida', 'ingreso']) {
      await page.keyboard.press('Escape')
      await settled(page)
      s = await shape(page)
      expect(s.cur).toBe(name)
      expect(s.footer.map((b) => b.id)).toEqual([`${name}-cancelar`, `${name}-ok`])
    }
    await clean(errs, 'pasos')
  })

  test('push, «Volver», Esc, Esc mantenida y salto desde el hilo: un nivel, foco al from, evento step con su reason', async ({ page }) => {
    const errs = await load(page, 'mode=steps')
    await page.focus('#opener')
    await page.keyboard.press('Enter')
    await settled(page)
    expect((await state(page)).id).toBe('f-detalle-ingreso')
    // Ir más hondo con el teclado: el primer control del paso nuevo, nunca «Volver», el cierre ni el hilo (base 3)
    await page.keyboard.press('Enter')
    await settled(page)
    let a = await state(page)
    expect(a).toMatchObject({ id: FIRST.ingreso, inDlg: true, chrome: false, steps: ['detalle', 'ingreso'] })
    let ev = await takeEvents(page)
    expect(ev).toEqual([['step', { from: 'detalle', to: 'ingreso', direction: 'forward', reason: 'push', result: undefined }]])
    // «Volver» baja uno y el foco vuelve al from (base 4)
    await page.click('.g-dialog__back')
    await settled(page)
    a = await state(page)
    expect(a).toMatchObject({ id: 'f-detalle-ingreso', steps: ['detalle'] })
    expect((await takeEvents(page))[0][1]).toMatchObject({ from: 'ingreso', to: 'detalle', direction: 'back', reason: 'back' })
    // Cinco niveles con clics
    for (const n of STEPS.slice(1)) { await page.click('#' + OPENERS[n]); await settled(page) }
    a = await state(page)
    expect(a).toMatchObject({ id: FIRST.categoria, steps: STEPS })
    await takeEvents(page)
    // Esc en un paso > 1: baja uno, sin dismiss, foco al from
    await page.keyboard.press('Escape')
    await settled(page)
    a = await state(page)
    ev = await takeEvents(page)
    expect(a).toMatchObject({ id: 'crear-categoria', steps: STEPS.slice(0, 4), open: true })
    expect(ev.map(([n, e]) => [n, e.reason])).toEqual([['step', 'escape']])
    // Esc mantenida (repeat): un solo nivel (#565)
    await page.keyboard.down('Escape')
    for (let i = 0; i < 5; i++) await page.keyboard.down('Escape')
    await page.keyboard.up('Escape')
    await settled(page)
    a = await state(page)
    ev = await takeEvents(page)
    expect(a).toMatchObject({ id: 'crear-producto', steps: STEPS.slice(0, 3) })
    expect(ev.filter(([n]) => n === 'step')).toHaveLength(1)
    expect(ev.some(([n]) => n === 'dismiss')).toBe(false)
    // Salto desde el hilo con teclado (backTo, reason 'trail'): al paso 1, un solo evento step, foco al from del de encima
    await page.focus('.g-dialog__trail-item:first-child .g-dialog__trail-step')
    await page.keyboard.press('Enter')
    await settled(page)
    a = await state(page)
    ev = await takeEvents(page)
    expect(a).toMatchObject({ id: 'f-detalle-ingreso', steps: ['detalle'] })
    expect(ev).toHaveLength(1)
    expect(ev[0][1]).toMatchObject({ from: 'partida', to: 'detalle', direction: 'back', reason: 'trail' })
    // backTo a un paso intermedio: foco al from del paso que estaba justo encima
    for (const n of ['ingreso', 'partida', 'producto']) { await page.click('#' + OPENERS[n]); await settled(page) }
    await page.focus('.g-dialog__trail-item:nth-child(2) .g-dialog__trail-step')
    await page.keyboard.press('Space')
    await settled(page)
    expect(await state(page)).toMatchObject({ id: 'f-ingreso-p3', steps: ['detalle', 'ingreso'] })
    // Con un solo paso, Esc es el dismiss de siempre
    await page.keyboard.press('Escape')
    await settled(page)
    await takeEvents(page)
    await page.keyboard.press('Escape')
    await expect.poll(() => page.evaluate(() => document.getElementById('dlg').open)).toBe(false)
    ev = await takeEvents(page)
    expect(ev.find(([n]) => n === 'dismiss')[1]).toMatchObject({ reason: 'escape', depth: 1 })
    await clean(errs, 'navegación')
  })

  test('resultado: foco al campo que lo recibe, llegada en su caja, anuncio cortés en el modal; error al confirmar no baja', async ({ page }) => {
    const errs = await load(page, 'mode=steps')
    await openAt(page, STEPS)
    // Error: el paso no baja y el foco va al campo con error del paso actual (base 8)
    await page.click('#categoria-ok')
    await page.waitForTimeout(200)
    let a = await state(page)
    expect(a.steps).toEqual(STEPS)
    expect(a.id).toBe('f-categoria-nombre')
    expect(await page.locator('#f-categoria-nombre').getAttribute('aria-invalid')).toBe('true')
    // Resultado (base 7): back({ focus, announce, result })
    await page.fill('#f-categoria-nombre', 'Tampones')
    await takeEvents(page)
    await page.click('#categoria-ok')
    const l = await landing(page)
    expect(l, 'llegada en la caja visible del GSelect de Categoría').toMatchObject({ box: true })
    expect(l.holds).toContain('f-producto-categoria')
    await settled(page)
    a = await state(page)
    expect(a.steps).toEqual(STEPS.slice(0, 4))
    expect(a.id).toBe('f-producto-categoria')
    const ev = await takeEvents(page)
    expect(ev[0][1]).toMatchObject({ from: 'categoria', to: 'producto', direction: 'back', reason: 'back', result: 'categoria' })
    const live = await liveInDialog(page)
    expect(live.some(([p, t]) => p === 'polite' && /Categoría «Tampones» creada/.test(t)), JSON.stringify(live)).toBe(true)
    expect(live.some(([p, t]) => p === 'assertive' && t)).toBe(false)
    // El valor ya está en el modelo y la llegada se retira sola
    expect(await page.locator('#f-producto-categoria').textContent()).toContain('Tampones')
    await expect.poll(() => page.evaluate(() => !document.querySelector('[data-g-landed]')), { timeout: 3000 }).toBe(true)
    // Sin caja de tooltip (un GBtn), la llegada cae en el propio destino
    await page.click('.g-dialog__trail-item:nth-child(2) .g-dialog__trail-step')
    await settled(page)
    await page.evaluate(() => { window.__lv.draft.ingreso.p3 = { producto: 'hcl', cantidad: '2' } })
    await page.click('#ingreso-ok')
    const l2 = await landing(page)
    expect(l2 && l2.id).toBe('f-detalle-ingreso')
    await settled(page)
    expect(await state(page)).toMatchObject({ id: 'f-detalle-ingreso', steps: ['detalle'] })
    await clean(errs, 'resultado')
  })

  test('fondo y cierre: con varios pasos el fondo no cierra; la X cierra el recorrido con depth; el foco vuelve al from', async ({ page }) => {
    const errs = await load(page, 'mode=steps')
    await openAt(page, STEPS.slice(0, 3))
    await takeEvents(page)
    await page.mouse.click(6, 6)
    await page.waitForTimeout(250)
    expect(await state(page)).toMatchObject({ open: true, steps: STEPS.slice(0, 3) })
    expect(await takeEvents(page)).toEqual([])
    await page.click('.g-dialog__close')
    // Tras `closed`, la aplicación reinicia el historial (receta)
    await expect.poll(() => page.evaluate(() => window.__lv.events.some(([n]) => n === 'closed'))).toBe(true)
    let ev = await takeEvents(page)
    expect(ev.find(([n]) => n === 'dismiss')[1]).toMatchObject({ reason: 'close', depth: 3 })
    expect(await page.evaluate(() => document.activeElement.id)).toBe('opener')
    // Con un paso, el fondo emite dismiss backdrop con depth 1
    await page.click('#opener')
    await settled(page)
    expect((await state(page)).steps).toEqual([])
    await takeEvents(page)
    await page.mouse.click(6, 6)
    await expect.poll(() => page.evaluate(() => document.getElementById('dlg').open)).toBe(false)
    ev = await takeEvents(page)
    expect(ev.find(([n]) => n === 'dismiss')[1]).toMatchObject({ reason: 'backdrop', depth: 1 })
    await clean(errs, 'fondo')
  })

  for (const qs of ['mode=steps', 'mode=steps&dir=rtl']) {
    test(`movimiento (${qs.includes('rtl') ? 'RTL' : 'LTR'}): borde superior Δ0, el paso llega de su lado, el alto cambia sin vaivén y se limpia`, async ({ page }) => {
      const errs = await load(page, qs)
      const rtl = qs.includes('rtl')
      await openAt(page, ['detalle', 'ingreso'])
      const sampler = () => {
        const d = document.getElementById('dlg')
        const p = d.querySelector('.g-dialog__step.is-current')
        const cs = p ? getComputedStyle(p) : null
        const tr = cs && cs.translate !== 'none' ? parseFloat(cs.translate) : 0
        const m = cs && cs.transform !== 'none' ? new DOMMatrix(cs.transform).m41 : 0
        const r = d.getBoundingClientRect()
        const resizeAnim = typeof d.getAnimations === 'function' && d.getAnimations().some((a) => a.animationName === 'g-dialog-resize' && a.playState === 'running')
        return { top: r.top, h: r.height, x: tr + m, anim: cs ? cs.animationName : '', resizing: d.classList.contains('is-resizing'), resizeAnim, from: d.style.getPropertyValue('--_step-from-h'), fwd: d.classList.contains('is-forward'), back: d.classList.contains('is-back'), pinned: d.classList.contains('is-pinned') }
      }
      await animStarts(page)
      const fwd = await rec(page, "document.getElementById('f-ingreso-p3').click()", sampler, 900)
      await settled(page)
      const fwdNames = await animStarts(page)
      const top0 = fwd[0].top
      expect(Math.max(...fwd.map((f) => Math.abs(f.top - top0))), 'borde superior al ir más hondo').toBeLessThanOrEqual(0.5)
      expect(fwd.every((f) => f.pinned)).toBe(true)
      expect(fwd.some((f) => f.fwd)).toBe(true)
      expect(fwdNames).toContain('g-dialog-step-from-end')
      expect(fwdNames).toContain('g-dialog-resize')
      const moved = fwd.filter((f) => Math.abs(f.x) > 0.5)
      // Con cuadros grabados mientras entraba, se vio el desplazamiento (con la máquina muy cargada puede no haber ninguno)
      if (fwd.filter((f) => f.anim === 'g-dialog-step-from-end').length >= 3) expect(moved.length).toBeGreaterThan(0)
      expect(moved.every((f) => Math.sign(f.x) === (rtl ? -1 : 1)), 'llega desde el final (eje lógico)').toBe(true)
      const hs = fwd.map((f) => f.h)
      const h0 = hs[0], h1 = hs.at(-1)
      expect(Math.abs(h1 - h0), 'ingreso y partida miden distinto').toBeGreaterThan(4)
      expect(fwd.some((f) => f.resizing && f.from)).toBe(true)
      expect(hs.every((h, i) => i === 0 || (h1 >= h0 ? h >= hs[i - 1] - 0.5 : h <= hs[i - 1] + 0.5)), 'sin vaivén').toBe(true)
      // La animación del alto corre (g-dialog-resize) y, si hubo cuadros mientras corría, el alto pasa por valores
      // intermedios (con la máquina muy cargada puede no pintarse ningún cuadro intermedio: entonces solo cuenta que corrió)
      const during = fwd.filter((f) => f.resizeAnim)
      if (during.length >= 4) expect(hs.filter((h) => Math.abs(h - h0) > 1 && Math.abs(h - h1) > 1).length, 'pasa por valores intermedios').toBeGreaterThanOrEqual(1)
      expect(fwd.at(-1)).toMatchObject({ resizing: false, from: '', fwd: false })
      // Volver: el destino entra desde el inicio
      const bk = await rec(page, "document.querySelector('.g-dialog__back').click()", sampler, 900)
      await settled(page)
      const bkNames = await animStarts(page)
      expect(Math.max(...bk.map((f) => Math.abs(f.top - top0))), 'borde superior al volver').toBeLessThanOrEqual(0.5)
      expect(bkNames).toContain('g-dialog-step-from-start')
      const movedBack = bk.filter((f) => Math.abs(f.x) > 0.5)
      if (bk.filter((f) => f.anim === 'g-dialog-step-from-start').length >= 3) expect(movedBack.length).toBeGreaterThan(0)
      expect(movedBack.every((f) => Math.sign(f.x) === (rtl ? 1 : -1)), 'llega desde el inicio').toBe(true)
      expect(bk.some((f) => f.back)).toBe(true)
      if (rtl) {
        await page.click('#f-ingreso-p3')
        await settled(page)
        const flip = await page.evaluate(() => { const cs = getComputedStyle(document.querySelector('.g-dialog__back .g-icon')); return cs.transform !== 'none' ? new DOMMatrix(cs.transform).a : cs.scale === 'none' ? 1 : parseFloat(cs.scale) })
        expect(flip, 'chevron de «Volver» espejado').toBeLessThan(0)
      }
      await clean(errs, 'movimiento')
    })
  }

  test('movimiento reducido: solo fundido, sin desplazamiento del paso ni animación del alto; borde superior Δ0', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const errs = await load(page, 'mode=steps')
    await openAt(page, ['detalle', 'ingreso'])
    const sampler = () => {
      const d = document.getElementById('dlg')
      const p = d.querySelector('.g-dialog__step.is-current')
      const cs = p ? getComputedStyle(p) : null
      const tr = cs && cs.translate !== 'none' ? parseFloat(cs.translate) : 0
      const m = cs && cs.transform !== 'none' ? new DOMMatrix(cs.transform).m41 : 0
      return { top: d.getBoundingClientRect().top, x: tr + m, anim: cs ? cs.animationName : '', danim: getComputedStyle(d).animationName, resizing: d.classList.contains('is-resizing') }
    }
    await animStarts(page)
    for (const setup of ["document.getElementById('f-ingreso-p3').click()", "document.querySelector('.g-dialog__back').click()"]) {
      const fr = await rec(page, setup, sampler, 500)
      await settled(page)
      expect(Math.max(...fr.map((f) => Math.abs(f.top - fr[0].top)))).toBeLessThanOrEqual(0.5)
      const names = await animStarts(page)
      expect(names, 'solo el fundido del paso').toContain('g-dialog-step-fade')
      expect(names.filter((n) => /^g-dialog-step-from|^g-dialog-resize/.test(n))).toEqual([])
      expect(fr.every((f) => Math.abs(f.x) < 0.01)).toBe(true)
      expect(fr.every((f) => !/resize/.test(f.danim))).toBe(true)
      expect(fr.slice(1).every((f) => !f.resizing)).toBe(true)
    }
    await clean(errs, 'reducido')
  })

  test('volver a un paso largo restaura su desplazamiento y el disparador queda en su sitio (base 6)', async ({ page }) => {
    const errs = await load(page, 'mode=steps&long=1')
    await openAt(page, ['detalle', 'ingreso'])
    await page.evaluate(() => document.getElementById('f-ingreso-p3').scrollIntoView({ block: 'center' }))
    await page.waitForTimeout(150)
    const before = await page.evaluate(() => ({ st: document.querySelector('#dlg .g-dialog__body').scrollTop, y: document.getElementById('f-ingreso-p3').getBoundingClientRect().top }))
    expect(before.st).toBeGreaterThan(50)
    await page.fill('#f-ingreso-nota', 'Borrador a medias')
    await page.click('#f-ingreso-p3')
    await settled(page)
    expect(await page.evaluate(() => document.querySelector('#dlg .g-dialog__body').scrollTop)).toBe(0)
    await page.keyboard.press('Escape')
    await settled(page)
    const after = await page.evaluate(() => ({ st: document.querySelector('#dlg .g-dialog__body').scrollTop, y: document.getElementById('f-ingreso-p3').getBoundingClientRect().top, f: document.activeElement.id, nota: document.getElementById('f-ingreso-nota').value }))
    expect(Math.abs(after.st - before.st)).toBeLessThanOrEqual(1)
    expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(1)
    expect(after.f).toBe('f-ingreso-p3')
    expect(after.nota, 'volver nunca borra').toBe('Borrador a medias')
    await clean(errs, 'desplazamiento')
  })

  test('hoja a 375px: no baja al ir más hondo ni al volver (has-sheet-hold) y sin desborde horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 740 })
    const errs = await load(page, 'mode=steps')
    await openAt(page, ['detalle'])
    const tops = [await page.evaluate(() => document.getElementById('dlg').getBoundingClientRect().top)]
    for (const n of STEPS.slice(1)) {
      await page.click('#' + OPENERS[n])
      await settled(page)
      tops.push(await page.evaluate(() => document.getElementById('dlg').getBoundingClientRect().top))
      expect(await overflowX(page), `profundidad ${tops.length}`).toEqual([])
    }
    expect(tops.every((t, i) => i === 0 || t <= tops[i - 1] + 0.5), `la hoja no baja al ir más hondo (${tops.map((t) => t.toFixed(0))})`).toBe(true)
    expect(await page.evaluate(() => document.getElementById('dlg').classList.contains('has-sheet-hold'))).toBe(true)
    const deep = tops.at(-1)
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Escape')
      await settled(page)
      const t = await page.evaluate(() => document.getElementById('dlg').getBoundingClientRect().top)
      expect(Math.abs(t - deep), 'la hoja no baja al volver').toBeLessThanOrEqual(0.5)
      expect(await overflowX(page)).toEqual([])
    }
    // Tras cerrar, la hoja se mide de nuevo desde cero
    await page.click('.g-dialog__close')
    await expect.poll(() => page.evaluate(() => !document.getElementById('dlg').open && !document.getElementById('dlg').classList.contains('has-sheet-hold'))).toBe(true)
    await clean(errs, 'hoja')
  })

  test('un aviso de GToaster se traslada al <dialog> modal mientras hay pasos y vuelve a body al cerrar', async ({ page }) => {
    const errs = await load(page, 'mode=steps')
    await openAt(page, ['detalle', 'ingreso', 'partida'])
    await page.evaluate(() => window.__toaster.success('Borrador guardado.'))
    const dlg = page.locator('#dlg')
    await expect(dlg.locator('.g-toaster .g-toast')).toHaveCount(1)
    await page.keyboard.press('Escape')
    await settled(page)
    expect((await state(page)).steps).toEqual(['detalle', 'ingreso'])
    await page.click('.g-dialog__close')
    await expect.poll(() => page.evaluate(() => document.querySelector('.g-toaster').parentElement.localName)).toBe('body')
    await clean(errs, 'avisos')
  })
})
