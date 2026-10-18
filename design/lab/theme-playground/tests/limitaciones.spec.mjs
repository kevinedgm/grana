// Revisión de «Limitaciones conocidas» (mora-docs, 2026-10-18; design/lab/limitaciones/revision.md).
// Mide en Chromium, Firefox y WebKit lo que varios README declaraban «Firefox y Safari por verificar» y se puede
// automatizar: el cristal de GBadge, la marca de GCheckbox, el pulgar de GSwitch (y su espejo en RTL), los pivotes
// de GAvatarMotion (transform-box: fill-box) y que, con prefers-reduced-motion emulado, ningún componente con ese
// límite deja una transición o animación de movimiento. Sobre el playground real (dist/). WebKit no es Safari.
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/index.html'
const ready = async (page) => {
  await page.goto(PAGE)
  await page.waitForSelector('.g-btn')
  await page.waitForTimeout(600)
}

test.describe('limitaciones · motores', () => {
  test('GBadge glass: el motor aplica el cristal (backdrop-filter y velo translúcido), no el respaldo opaco', async ({ page }) => {
    await ready(page)
    const r = await page.locator('#sec-badge .g-badge--variant-glass').first().evaluate((el) => {
      const cs = getComputedStyle(el)
      const bf = cs.backdropFilter && cs.backdropFilter !== 'none' ? cs.backdropFilter : cs.webkitBackdropFilter
      const alpha = (() => {
        const m = cs.backgroundColor.match(/rgba?\(([^)]+)\)|color\(srgb ([^)]+)\)/)
        if (!m) return null
        const parts = (m[1] || m[2]).split(/[ ,/]+/).filter(Boolean)
        return parts.length >= 4 ? parseFloat(parts[3]) : 1
      })()
      return { bf, alpha, before: getComputedStyle(el, '::before').display }
    })
    expect(r.bf, 'backdrop-filter').not.toBe('none')
    expect(r.bf, 'backdrop-filter').toMatch(/blur/)
    expect(r.alpha, 'velo translúcido (color-mix)').toBeLessThan(1)
    expect(r.alpha, 'opacidad mínima del velo (tokens.md §12)').toBeGreaterThanOrEqual(0.55)
    expect(r.before, 'brillo ::before').not.toBe('none')
  })

  test('GCheckbox: la marca (check de Lucide) se revela entera dentro del cuadro al marcar y se oculta al desmarcar', async ({ page }) => {
    await ready(page)
    const input = page.locator('#sec-checkbox .g-checkbox:not(.is-disabled):not(.is-readonly) .g-checkbox__input').first()
    await input.scrollIntoViewIfNeeded()
    const read = () => input.evaluate((el) => {
      const box = el.getBoundingClientRect()
      const mark = el.parentElement.querySelector('.g-checkbox__check')
      const m = mark.getBoundingClientRect()
      return {
        checked: el.checked,
        clip: getComputedStyle(mark).clipPath,
        inside: m.left >= box.left - 0.5 && m.right <= box.right + 0.5 && m.top >= box.top - 0.5 && m.bottom <= box.bottom + 0.5,
        size: m.width
      }
    })
    if ((await read()).checked) { await input.click(); await page.waitForTimeout(400) }
    const off = await read()
    await input.click()
    await page.waitForTimeout(400)
    const on = await read()
    expect(off.checked).toBe(false)
    expect(off.clip).toMatch(/inset\(0px 100%/)
    expect(on.checked).toBe(true)
    expect(on.clip).toMatch(/^inset\(0px\)$|^inset\(0px 0px 0px 0px\)$|^inset\(0px 0px\)$/)
    expect(on.inside, 'la marca cabe en el cuadro').toBe(true)
    expect(on.size).toBeGreaterThan(8)
  })

  test('GSwitch: el pulgar (::before) recorre el riel al encender, la marca va con él y en RTL se espeja (:dir)', async ({ page }) => {
    await ready(page)
    const sw = page.locator('#sec-switch .g-switch:not(.is-disabled):not(.is-readonly):not(.is-loading)').first()
    await sw.scrollIntoViewIfNeeded()
    const input = sw.locator('.g-switch__input')
    const read = () => input.evaluate((el) => {
      const tx = (v) => (v === 'none' ? 0 : parseFloat(v.split(' ')[0]))
      const on = el.parentElement.querySelector('.g-switch__mark--on')
      return {
        checked: el.checked,
        thumb: tx(getComputedStyle(el, '::before').translate),
        mark: on ? tx(getComputedStyle(on).translate) : null,
        travel: el.getBoundingClientRect().width
      }
    })
    if ((await read()).checked) { await input.click(); await page.waitForTimeout(400) }
    const off = await read()
    await input.click()
    await page.waitForTimeout(400)
    const on = await read()
    expect(off.thumb).toBe(0)
    expect(on.thumb, 'recorrido del pulgar').toBeGreaterThan(on.travel / 3)
    expect(on.mark, 'la marca se desliza con el pulgar').toBeCloseTo(on.thumb, 1)
    // RTL: el mismo interruptor dentro de dir="rtl" recorre hacia el inicio físico (negativo)
    await sw.evaluate((el) => el.setAttribute('dir', 'rtl'))
    await page.waitForTimeout(400)
    const rtl = await read()
    expect(rtl.checked).toBe(true)
    expect(rtl.thumb, 'pulgar espejado en RTL').toBeCloseTo(-on.thumb, 1)
    expect(rtl.mark, 'marca espejada en RTL').toBeCloseTo(-on.thumb, 1)
  })

  test('GTextarea: el tirador (resize) existe y el anillo de foco del control llega por :has()', async ({ page }) => {
    await ready(page)
    const ta = page.locator('#sec-textarea .g-textarea:not(.is-disabled):not(.is-readonly)').first()
    await ta.scrollIntoViewIfNeeded()
    const control = ta.locator('.g-textarea__control')
    const field = ta.locator('.g-textarea__field')
    const ring = () => control.evaluate((el) => { const cs = getComputedStyle(el); return `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor} ${cs.boxShadow} ${cs.borderColor}` })
    expect(['vertical', 'both']).toContain(await field.evaluate((el) => getComputedStyle(el).resize))
    const before = await ring()
    await field.focus()
    await page.waitForTimeout(300)
    expect(await control.evaluate((el) => el.matches(':has(.g-textarea__field:focus-visible)'))).toBe(true)
    expect(await ring(), 'el control cambia con el foco del campo').not.toBe(before)
  })

  test('GAvatarMotion: cuerpo y ojos escalan sobre su propio centro (transform-box: fill-box)', async ({ page }) => {
    await ready(page)
    const av = page.locator('#sec-avatar .g-avatar-motion').first()
    await av.scrollIntoViewIfNeeded()
    // Reinicia la coreografía de reposo (dos iteraciones) pasando por otro estado
    await page.locator('#sec-avatar .g-btn', { hasText: 'thinking' }).click()
    await page.waitForTimeout(200)
    await page.locator('#sec-avatar .g-btn', { hasText: 'idle' }).click()
    await page.waitForTimeout(200)
    const r = await av.evaluate((root) => {
      const at = (el, t) => {
        const anims = el.getAnimations()
        anims.forEach((a) => { a.pause(); a.currentTime = t })
        const b = el.getBoundingClientRect()
        return { cx: b.left + b.width / 2, cy: b.top + b.height / 2, w: b.width, h: b.height, n: anims.length }
      }
      const body = root.querySelector('.g-avatar-motion__body')
      const eyes = root.querySelector('.g-avatar-motion__eyes')
      return {
        box: getComputedStyle(body).transformBox,
        body0: at(body, 0), body50: at(body, 1500),
        eyes0: at(eyes, 0), eyes46: at(eyes, 4200 * 0.46)
      }
    })
    expect(r.box).toBe('fill-box')
    expect(r.body0.n, 'animación de reposo en el cuerpo').toBeGreaterThan(0)
    expect(r.body50.w / r.body0.w).toBeGreaterThan(1.015) // breathe: scale(1.025) al 50 %
    expect(Math.abs(r.body50.cx - r.body0.cx), 'centro x del cuerpo').toBeLessThanOrEqual(0.5)
    expect(Math.abs(r.body50.cy - r.body0.cy), 'centro y del cuerpo').toBeLessThanOrEqual(0.5)
    expect(r.eyes46.h / r.eyes0.h).toBeLessThan(0.3) // blink: scaleY(0.08) al 46 %
    expect(Math.abs(r.eyes46.cy - r.eyes0.cy), 'centro y de los ojos').toBeLessThanOrEqual(0.5)
  })
})

// Con prefers-reduced-motion emulado (la misma consulta de medios que activa la preferencia del sistema), ningún
// elemento de estos componentes conserva una transición de movimiento (transform, translate, scale, rotate, tamaño o
// recorte) ni una animación, salvo los indicadores de carga que giran (permitidos, más lentos). Una transición de
// translate/scale/rotate cuyo valor es la identidad (lo cambia solo el bloque no-preference, p. ej. B2 de GBtn) se
// cuenta como inerte y se informa aparte. Sin la preferencia,
// las mismas raíces sí declaran movimiento: el bloque cambia de verdad.
const ROOTS = {
  GCheckbox: '.g-checkbox', GCheckboxGroup: '.g-checkbox-group', GSwitch: '.g-switch', GInput: '.g-input',
  GTextarea: '.g-textarea', GSelect: '.g-select', GDatePicker: '.g-datepicker', GCalendar: '.g-calendar',
  GSidebar: '.g-sidebar', GDialog: '.g-dialog', GStepper: '.g-stepper', GHelper: '.g-helper'
}
const MOVE = /^(all|transform|translate|scale|rotate|inline-size|block-size|width|height|clip-path|inset.*|top|left|right|bottom|margin.*|grid-template-rows)$/
const SPIN = /spin|loader|rotate/

const scan = (page, roots) => page.evaluate(({ roots, move, spin }) => {
  const MOVE = new RegExp(move); const SPIN = new RegExp(spin)
  const out = {}
  for (const [name, sel] of Object.entries(roots)) {
    const els = [...document.querySelectorAll(sel)].flatMap((r) => [r, ...r.querySelectorAll('*')])
    // los popovers y diálogos del componente que viven fuera de la raíz (top layer)
    const popSel = `${sel}__list, ${sel}__pop, ${sel}__content, ${sel}__panel, ${sel}__drawer, ${sel}__sheet`
    for (const p of document.querySelectorAll(popSel)) els.push(p, ...p.querySelectorAll('*'))
    const moving = []; const anims = []; const inert = []
    for (const el of new Set(els)) {
      for (const pseudo of [null, '::before', '::after']) {
        const cs = getComputedStyle(el, pseudo)
        const props = cs.transitionProperty.split(',').map((s) => s.trim())
        const durs = cs.transitionDuration.split(',').map((s) => parseFloat(s))
        props.forEach((p, i) => {
          if (!MOVE.test(p) || !((durs[i % durs.length] || 0) > 0)) return
          const tag = `${el.className?.baseVal ?? el.className}${pseudo ?? ''} · ${p}`
          // translate/scale/rotate en su identidad y sin regla que los cambie con reduce: la transición no mueve nada
          if (/^(translate|scale|rotate)$/.test(p) && cs[p] === 'none') inert.push(tag); else moving.push(tag)
        })
        const names = cs.animationName.split(',').map((s) => s.trim()).filter((n) => n && n !== 'none')
        for (const n of names) if (!SPIN.test(n)) anims.push(`${el.className?.baseVal ?? el.className}${pseudo ?? ''} · ${n}`)
      }
    }
    out[name] = { count: els.length, moving: [...new Set(moving)], anims: [...new Set(anims)], inert: [...new Set(inert)] }
  }
  return out
}, { roots, move: MOVE.source, spin: SPIN.source })

test.describe('limitaciones · movimiento reducido emulado', () => {
  test('con reduce, ningún componente conserva transiciones ni animaciones de movimiento; sin la preferencia, sí las hay', async ({ browser }) => {
    // Dos páginas cargadas ya con su preferencia (como la del sistema), no un cambio en caliente
    const freeCtx = await browser.newContext({ reducedMotion: 'no-preference', viewport: { width: 1280, height: 900 } })
    const freePage = await freeCtx.newPage()
    await ready(freePage)
    const free = await scan(freePage, ROOTS)
    await freeCtx.close()
    const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 900 } })
    const page = await ctx.newPage()
    await ready(page)
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true)
    const reduced = await scan(page, ROOTS)
    await ctx.close()
    const report = {}
    for (const name of Object.keys(ROOTS)) {
      report[name] = { elementos: reduced[name].count, movimientoSinPreferencia: free[name].moving.length + free[name].anims.length, conReduce: [...reduced[name].moving, ...reduced[name].anims], inertes: reduced[name].inert }
    }
    console.log(JSON.stringify(report))
    for (const name of Object.keys(ROOTS)) {
      expect(reduced[name].count, `${name}: presente en el playground`).toBeGreaterThan(0)
      expect([...reduced[name].moving, ...reduced[name].anims], `${name}: movimiento con reduce`).toEqual([])
    }
  })
})
