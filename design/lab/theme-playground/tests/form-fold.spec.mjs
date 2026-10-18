// GFormFold · C «En su sitio» dentro de un paso de GDialog sobre el COMPONENTE REAL (dist/form-fold.umd.js) en
// packages/vue/playground/dialog-levels.html (modo mixto: dos pasos y tres pliegues anidados bajo «Ingreso»: Partida 3 →
// Producto nuevo → Categoría nueva). Contrato: design/contracts/form.md §15 y dialog.md §«Niveles anidados» (base y C);
// hallazgo H3 de design/lab/dialog/auditoria-pasos.md. El pliegue en la prueba de distribución está en
// form-distribution.spec.mjs (#184).
import { test, expect } from '@playwright/test'
import { load, settled, openAt, state, takeEvents, rec, liveInDialog, landing, overflowX, clean } from './dialog-levels-helpers.mjs'

const FOLDS = [['partida', 'f-ingreso-p3', 'f-partida-producto'], ['producto', 'crear-producto', 'f-producto-nombre'], ['categoria', 'crear-categoria', 'f-categoria-nombre']]

/** Lo de arriba (el disparador, medido dentro del contenido del cuerpo) y el borde superior del diálogo, cuadro a cuadro. */
const sampler = (id) => `() => {
  const d = document.getElementById('dlg'), b = d.querySelector('.g-dialog__body')
  return { top: d.getBoundingClientRect().top, above: document.getElementById('${id}').getBoundingClientRect().top - b.getBoundingClientRect().top + b.scrollTop }
}`
const maxDelta = (fr, k) => Math.max(...fr.map((f) => Math.abs(f[k] - fr[0][k])))

test.describe('GFormFold · pliegues dentro de un paso (C)', () => {
  test('recorrido de kiwi: tres pliegues anidados; foco dentro; lo de arriba Δ0 al abrir y al cerrar; borde del diálogo fijo; a la vista', async ({ page }) => {
    const errs = await load(page)
    await openAt(page, ['detalle', 'ingreso'])
    for (const [i, [name, opener, first]] of FOLDS.entries()) {
      const fr = await rec(page, `document.getElementById('${opener}').click()`, new Function('return ' + sampler(opener))(), 700)
      await settled(page)
      expect(maxDelta(fr, 'top'), `${name}: borde superior del diálogo`).toBeLessThanOrEqual(0.5)
      expect(maxDelta(fr, 'above'), `${name}: lo de arriba dentro del cuerpo`).toBeLessThanOrEqual(0.5)
      const f = await page.evaluate((name) => {
        const el = document.getElementById('fold-' + name)
        const b = document.querySelector('#dlg .g-dialog__body').getBoundingClientRect()
        const r = el.getBoundingClientRect()
        return {
          role: el.getAttribute('role'),
          named: document.getElementById(el.getAttribute('aria-labelledby'))?.textContent,
          desc: Boolean(document.getElementById(el.getAttribute('aria-describedby'))),
          d: el.style.getPropertyValue('--_d'),
          open: el.classList.contains('is-open'),
          fits: r.height <= b.height,
          inView: r.top >= b.top - 1.5 && r.bottom <= b.bottom + 1.5,
          focusIn: el.contains(document.activeElement),
          active: document.activeElement.id
        }
      }, name)
      expect(f).toMatchObject({ role: 'group', desc: true, d: String(i + 1), open: true, focusIn: true })
      expect(f.named).toBeTruthy()
      if (name !== 'partida') expect(f.active).toBe(first) // en partida, el primer control es el disparador del GSelect
      if (f.fits) expect(f.inView, `${name}: el pliegue entero a la vista`).toBe(true)
    }
    expect((await state(page)).folds).toEqual({ partida: true, producto: true, categoria: true })
    // Cerrar sin resultado (Cancelar): lo de arriba sigue en su sitio y el foco vuelve al from
    const fr = await rec(page, "document.getElementById('categoria-cancelar').click()", new Function('return ' + sampler('crear-categoria'))(), 700)
    await settled(page)
    expect(maxDelta(fr, 'top')).toBeLessThanOrEqual(0.5)
    expect(maxDelta(fr, 'above')).toBeLessThanOrEqual(0.5)
    const a = await state(page)
    expect(a.id).toBe('crear-categoria')
    expect(a.folds).toEqual({ partida: true, producto: true, categoria: false })
    await expect(page.locator('#fold-categoria')).toBeHidden()
    expect(await page.locator('#fold-categoria').evaluate((el) => el.children.length), 'cerrado: sin contenido').toBe(0)
    await clean(errs, 'recorrido')
  })

  test('Esc recoge solo el pliegue de arriba (también mantenida), sin dismiss ni cambio de paso; foco a su from', async ({ page }) => {
    const errs = await load(page)
    await openAt(page, ['detalle', 'ingreso'])
    for (const [, opener] of FOLDS) { await page.click('#' + opener); await settled(page) }
    await takeEvents(page)
    await page.keyboard.press('Escape')
    await settled(page)
    let a = await state(page)
    expect(a).toMatchObject({ id: 'crear-categoria', open: true, steps: ['detalle', 'ingreso'], folds: { partida: true, producto: true, categoria: false } })
    // Mantenida: un solo pliegue por pulsación (#565)
    await page.focus('#f-producto-nombre')
    await page.keyboard.down('Escape')
    for (let i = 0; i < 5; i++) await page.keyboard.down('Escape')
    await page.keyboard.up('Escape')
    await settled(page)
    a = await state(page)
    expect(a).toMatchObject({ id: 'crear-producto', open: true, steps: ['detalle', 'ingreso'], folds: { partida: true, producto: false, categoria: false } })
    expect((await takeEvents(page)).filter(([n]) => n === 'dismiss' || n === 'step')).toEqual([])
    // Con el foco fuera de los pliegues, Esc es del diálogo: baja el paso
    await page.focus('#f-ingreso-oc')
    await page.keyboard.press('Escape')
    await settled(page)
    expect((await state(page)).steps).toEqual(['detalle'])
    await clean(errs, 'Esc')
  })

  test('el fondo del diálogo no cierra con un pliegue abierto; sin pliegues, sí (base 5)', async ({ page }) => {
    const errs = await load(page)
    await openAt(page, ['ingreso'])
    await page.click('#f-ingreso-p3')
    await settled(page)
    await takeEvents(page)
    await page.mouse.click(6, 6)
    await page.waitForTimeout(300)
    expect((await state(page)).open).toBe(true)
    expect(await takeEvents(page)).toEqual([])
    await page.click('#partida-cancelar')
    await settled(page)
    await page.waitForTimeout(200)
    await page.mouse.click(6, 6)
    await expect.poll(() => page.evaluate(() => document.getElementById('dlg').open)).toBe(false)
    expect((await takeEvents(page)).find(([n]) => n === 'dismiss')[1]).toMatchObject({ reason: 'backdrop', depth: 1 })
    await clean(errs, 'fondo')
  })

  test('confirmar: con error no se cierra y el foco va al error; con resultado se cierra, el campo aterriza y se anuncia en el modal', async ({ page }) => {
    const errs = await load(page)
    await openAt(page, ['detalle', 'ingreso'])
    for (const [, opener] of FOLDS) { await page.click('#' + opener); await settled(page) }
    // Producto con la categoría abierta: lo bloquea el pendiente «Termina o cancela…» (y su categoría vacía); no se cierra
    // y el foco va al primer error, dentro del pliegue
    await page.click('#producto-ok')
    await page.waitForTimeout(250)
    let a = await state(page)
    expect(a.folds).toEqual({ partida: true, producto: true, categoria: true })
    expect(await page.evaluate(() => document.getElementById('fold-producto').contains(document.activeElement))).toBe(true)
    expect(await page.locator('#fold-producto').evaluate((el) => el.classList.contains('is-rejected') || Boolean(el.querySelector('[aria-invalid="true"]')))).toBe(true)
    // Categoría vacía: el pliegue revela su error, sigue abierto y el foco va al campo
    await page.click('#categoria-ok')
    await page.waitForTimeout(250)
    a = await state(page)
    expect(a.folds.categoria).toBe(true)
    expect(a.id).toBe('f-categoria-nombre')
    expect(await page.locator('#f-categoria-nombre').getAttribute('aria-invalid')).toBe('true')
    // Resultado: «Crear y elegir» cierra el pliegue (H4), el foco va al campo que lo recibe, aterriza y se anuncia
    await page.fill('#f-categoria-nombre', 'Tampones')
    await page.click('#categoria-ok')
    const l = await landing(page)
    expect(l && l.box).toBe(true)
    expect(l.holds).toContain('f-producto-categoria')
    await settled(page)
    a = await state(page)
    expect(a.folds).toEqual({ partida: true, producto: true, categoria: false })
    expect(a.id).toBe('f-producto-categoria')
    expect(await page.locator('#f-producto-categoria').textContent()).toContain('Tampones')
    const live = await liveInDialog(page)
    expect(live.some(([p, t]) => p === 'polite' && /Categoría «Tampones» creada/.test(t)), JSON.stringify(live)).toBe(true)
    // Enter en un campo de texto del pliegue confirma (y no envía el GForm del paso)
    await page.focus('#f-producto-nombre')
    await page.keyboard.press('Enter')
    await expect.poll(() => state(page).then((s) => s.folds.producto)).toBe(false)
    await settled(page)
    expect((await state(page)).id).toBe('f-partida-producto')
    // Partida: cantidad y guardar; vuelve al botón de la fila
    await page.fill('#f-partida-cantidad', '2')
    await page.click('#partida-ok')
    await expect.poll(() => state(page).then((s) => s.folds.partida)).toBe(false)
    await settled(page)
    expect((await state(page)).id).toBe('f-ingreso-p3')
    expect(await page.locator('#p3-text').textContent()).toContain('Tris base · 2 kg')
    await clean(errs, 'confirmar')
  })

  test('375px con tres pliegues abiertos: sin desborde horizontal; el diálogo crece hacia abajo con el borde fijo', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 740 })
    const errs = await load(page)
    await openAt(page, ['detalle', 'ingreso'])
    for (const [name, opener] of FOLDS) {
      await page.click('#' + opener)
      await settled(page)
      expect(await overflowX(page), name).toEqual([])
    }
    const w = await page.evaluate(() => document.getElementById('f-categoria-nombre').getBoundingClientRect().width)
    expect(w, 'el tercer nivel deja campos utilizables').toBeGreaterThan(150)
    await clean(errs, '375px')
  })

  test('RTL: raíl y sangría al inicio (a la derecha)', async ({ page }) => {
    const errs = await load(page, 'dir=rtl')
    await openAt(page, ['detalle', 'ingreso'])
    for (const [, opener] of FOLDS) { await page.click('#' + opener); await settled(page) }
    const r = await page.evaluate(() => ['partida', 'producto', 'categoria'].map((n) => {
      const el = document.getElementById('fold-' + n)
      const p = el.querySelector(':scope > .g-form-fold__panel')
      const cs = getComputedStyle(p)
      const parent = el.parentElement.getBoundingClientRect()
      const box = el.getBoundingClientRect()
      return { right: parseFloat(cs.borderRightWidth), left: parseFloat(cs.borderLeftWidth), padR: parseFloat(cs.paddingRight), padL: parseFloat(cs.paddingLeft), indentEnd: parent.right - box.right, indentStart: box.left - parent.left }
    }))
    for (const f of r) {
      expect(f.right).toBeGreaterThan(0)
      expect(f.left).toBe(0)
      expect(f.padR).toBeGreaterThan(f.padL)
      expect(f.indentEnd, 'la sangría está al inicio (derecha)').toBeGreaterThan(f.indentStart + 1)
    }
    await clean(errs, 'RTL')
  })

  test('movimiento reducido: sin deslizamiento; el alto en un cuadro; lo de arriba y el borde del diálogo Δ0', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const errs = await load(page)
    await openAt(page, ['detalle', 'ingreso'])
    const fr = await rec(page, "document.getElementById('f-ingreso-p3').click()", () => {
      const d = document.getElementById('dlg'), b = d.querySelector('.g-dialog__body'), f = document.getElementById('fold-partida')
      return { top: d.getBoundingClientRect().top, above: document.getElementById('f-ingreso-p3').getBoundingClientRect().top - b.getBoundingClientRect().top + b.scrollTop, h: f.getBoundingClientRect().height, tr: getComputedStyle(f).transitionDuration }
    }, 600)
    await settled(page)
    expect(maxDelta(fr, 'top')).toBeLessThanOrEqual(0.5)
    expect(maxDelta(fr, 'above')).toBeLessThanOrEqual(0.5)
    const h1 = fr.at(-1).h
    expect(h1).toBeGreaterThan(40)
    const between = fr.filter((f) => f.h > 0.5 && Math.abs(f.h - h1) > 0.5)
    expect(between.length, `alto en un cuadro (${fr.map((f) => f.h.toFixed(0)).join(',')})`).toBeLessThanOrEqual(1)
    await clean(errs, 'reducido')
  })
})
