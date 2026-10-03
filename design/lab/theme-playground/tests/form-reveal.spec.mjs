// GFormReveal sobre el COMPONENTE REAL del playground (packages/vue/playground, #sec-form, formulario #fr-form), en
// Chromium, Firefox y WebKit. Port de design/lab/form-reveal/r01/verificar.mjs (kiwi) a GFormReveal y al registro inactivo
// real de GForm (design/contracts/form.md §14 y §2; DECISIONS.md #274 a #280). La distribución con un bloque abierto está
// en form-distribution.spec.mjs (#184).
// Estado inicial del ejemplo: «¿Requiere factura?» Sí · «Tipo de persona» Moral (bloques abiertos); Física y alergias cerrados.
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/index.html'

async function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana/.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}
async function open(page, { width = 1280, reduced = false } = {}) {
  await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' })
  await page.setViewportSize({ width, height: 900 })
  await page.goto(PAGE)
  await page.waitForSelector('#fr-rv-factura.is-ready')
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(() => {
    // Sin desplazamiento suave del playground: las medidas de Δscroll son las del bloque
    document.documentElement.style.scrollBehavior = 'auto'
    window.__track = (sel, ms) => new Promise((res) => {
      const el = document.querySelector(sel)
      const r0 = el.getBoundingClientRect()
      const s0 = scrollY
      let dt = 0, dl = 0, ds = 0, n = 0
      const t0 = performance.now()
      ;(function f() {
        const r = el.getBoundingClientRect()
        dt = Math.max(dt, Math.abs(r.top - r0.top)); dl = Math.max(dl, Math.abs(r.left - r0.left)); ds = Math.max(ds, Math.abs(scrollY - s0)); n++
        if (performance.now() - t0 < ms) requestAnimationFrame(f); else res({ dt, dl, ds, n })
      })()
    })
    window.__st = (id) => {
      const el = document.getElementById(id); const cs = getComputedStyle(el); const body = el.firstElementChild
      return { inert: el.hasAttribute('inert'), disabled: body.disabled, vis: cs.visibility, op: +cs.opacity, h: el.getBoundingClientRect().height,
        ovf: getComputedStyle(body).overflowY, anim: el.classList.contains('is-animating'), open: el.classList.contains('is-open') }
    }
    window.__fd = () => [...new FormData(document.getElementById('fr-form')).keys()]
    window.__fm = () => document.getElementById('app').__vue_app__._instance.proxy.fm
    // Pausa las transiciones de la raíz en una fracción de la de altura (o de la de opacidad si no hay altura)
    window.__pause = (id, frac = 0.5) => {
      const el = document.getElementById(id); const as = el.getAnimations()
      const main = as.find((a) => a.transitionProperty === 'grid-template-rows') || as.find((a) => a.transitionProperty === 'opacity')
      if (!main) return null
      const t = main.effect.getComputedTiming(); const at = (t.delay || 0) + t.duration * frac
      as.forEach((a) => { a.pause(); a.currentTime = at })
      return as.map((a) => a.transitionProperty)
    }
    // Cambia la respuesta por programa y pausa en la misma tarea (con carga en paralelo, un clic puede tardar más que el fundido)
    window.__answerAndPause = async (v, frac) => { window.__fm().r.factura = v; await Vue.nextTick(); return window.__pause('fr-rv-factura', frac) }
    window.__finish = (id) => document.getElementById(id).getAnimations().forEach((a) => { try { a.finish() } catch {} })
  })
  await page.locator('#fr-form').scrollIntoViewIfNeeded()
}
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 30))))))
const settled = (page, id) => page.waitForFunction((i) => !document.getElementById(i).classList.contains('is-animating'), id, { timeout: 3000 })
const choose = async (page, id) => { await page.click(`label[for="${id}"]`) }
const active = (page) => page.evaluate(() => { const a = document.activeElement; return a?.type === 'radio' ? `${a.id}${a.checked ? '*' : ''}` : a?.id || a?.tagName })
const fd = (page) => page.evaluate(() => window.__fd())
const FISCAL = ['r-persona', 'r-curp', 'r-razon', 'r-constitucion', 'r-representante', 'r-rfc', 'r-regimen', 'r-cpf', 'r-envio']

test.describe('GFormReveal · componente real (form.md §14)', () => {
  test('carga sin transiciones; cerrado sin hueco, fuera de FormData, de :invalid y de Tab; Física/Moral/No con anidados', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page)
    expect(await page.evaluate(() => document.getAnimations().filter((a) => a.effect?.target?.classList?.contains('g-form-reveal')).length), 'al cargar no corre ninguna transición de bloque').toBe(0)
    // Física cerrada: inert, fieldset deshabilitado, invisible, sin altura y margen = −row-gap del padre
    let s = await page.evaluate(() => __st('fr-rv-fisica'))
    expect(s.inert && s.disabled && s.vis === 'hidden' && s.h === 0, JSON.stringify(s)).toBe(true)
    const gap = await page.evaluate(() => {
      const el = document.getElementById('fr-rv-fisica')
      return { v: el.style.getPropertyValue('--_reveal-gap'), mt: getComputedStyle(el).marginBlockStart, pg: getComputedStyle(el.parentElement).rowGap }
    })
    expect(gap.v, 'variable en línea = row-gap del padre').toBe(gap.pg)
    expect(parseFloat(gap.mt)).toBeCloseTo(-parseFloat(gap.pg), 1)
    // Bloque en el cuerpo de GFormSection (sin GFormLayout): row-gap normal → 0px
    expect(await page.evaluate(() => document.getElementById('fr-rv-alergias').style.getPropertyValue('--_reveal-gap'))).toBe('0px')
    // Moral (estado inicial): FormData con razón social, constitución (GDatePicker) y régimen (GSelect), sin CURP
    let keys = await fd(page)
    expect(['r-factura', 'r-persona', 'r-razon', 'r-constitucion', 'r-regimen', 'r-rfc'].every((k) => keys.includes(k)) && !keys.includes('r-curp'), `Moral: ${keys}`).toBe(true)
    expect(await page.evaluate(() => document.querySelectorAll('#fr-rv-fisica :invalid').length), 'Física cerrada: nada dentro en :invalid').toBe(0)
    expect(await page.evaluate(() => document.querySelectorAll('#fr-rv-moral :invalid').length), 'Moral abierta: la razón social vacía en :invalid').toBeGreaterThan(0)
    // Física
    await choose(page, 'fr-persona-0')
    await settled(page, 'fr-rv-fisica')
    keys = await fd(page)
    expect(keys.includes('r-curp') && !keys.includes('r-razon') && !keys.includes('r-constitucion') && !keys.includes('r-representante'), `Física: ${keys}`).toBe(true)
    // No: ningún campo del bloque ni de sus anidados (GSelect, GDatePicker y GCheckboxGroup incluidos)
    await page.locator('#fr-envio input[value="correo"]').check()
    await choose(page, 'fr-factura-1')
    await settled(page, 'fr-rv-factura')
    keys = await fd(page)
    expect(keys.includes('r-factura') && !FISCAL.some((k) => keys.includes(k)), `No: ${keys}`).toBe(true)
    expect(await page.evaluate(() => document.querySelectorAll('#fr-rv-factura :invalid').length)).toBe(0)
    // Sin hueco: pregunta → siguiente hijo de la pila = una separación
    const dist = await page.evaluate(() => {
      const q = document.getElementById('fr-factura'); const next = document.getElementById('fr-obs').closest('#fr-layout > *')
      return { d: next.getBoundingClientRect().top - q.getBoundingClientRect().bottom, g: parseFloat(getComputedStyle(document.getElementById('fr-layout')).rowGap) }
    })
    expect(Math.abs(dist.d - dist.g), `pregunta → Observaciones ${dist.d} vs ${dist.g}`).toBeLessThanOrEqual(0.5)
    // Tab salta el cerrado (WebKit en macOS no tabula a los radios: desde el nombre)
    if (browserName === 'webkit') await page.focus('#fr-nombre'); else await page.focus('#fr-factura-1')
    await page.keyboard.press('Tab')
    expect(await active(page)).toBe('fr-obs')
    // Árbol accesible: el cerrado no aparece
    expect(await page.locator('#fr-layout').ariaSnapshot()).not.toMatch(/RFC|Tipo de persona|Razón social/)
    // Reabrir: Tab entra en el bloque; conserva lo elegido (Física) y lo marcado
    await choose(page, 'fr-factura-0')
    await settled(page, 'fr-rv-factura')
    if (browserName === 'webkit') await page.focus('#fr-nombre'); else await page.focus('#fr-factura-0')
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => document.getElementById('fr-rv-factura').contains(document.activeElement)), `Tab entra en el bloque (${await active(page)})`).toBe(true)
    const snap = await page.locator('#fr-layout').ariaSnapshot()
    expect(/RFC/.test(snap) && !/^\s*- group\s*$/m.test(snap), 'abierto aparece; el cuerpo no añade un grupo sin nombre').toBe(true)
    expect(await page.locator('#fr-persona-0').isChecked()).toBe(true)
    expect(await page.locator('#fr-envio input[value="correo"]').isChecked()).toBe(true)
    expect(errs, browserName).toEqual([])
  })

  test('disparador Δ 0px y Δscroll 0 al abrir y cerrar (LTR y RTL); intermedios; overflow visible al asentarse; interrupción', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page)
    for (const dir of ['ltr', 'rtl']) {
      await page.evaluate((d) => document.getElementById('fr-form').closest('[data-frame]').setAttribute('dir', d), dir)
      await page.evaluate(() => document.getElementById('fr-factura').scrollIntoView({ block: 'center' }))
      for (const opt of ['fr-factura-1', 'fr-factura-0']) {
        const tr = page.evaluate(() => __track('#fr-factura', 600))
        await page.waitForTimeout(40)
        await choose(page, opt)
        const t = await tr
        await settled(page, 'fr-rv-factura')
        expect(t.dt === 0 && t.dl === 0 && t.ds === 0, `${dir} ${opt}: Δtop ${t.dt} Δinicio ${t.dl} Δscroll ${t.ds} (${t.n} cuadros)`).toBe(true)
        expect(t.n, 'cuadros medidos').toBeGreaterThan(3)
      }
    }
    // RTL: barra a la derecha
    const rtl = await page.evaluate(() => { const cs = getComputedStyle(document.querySelector('#fr-rv-factura > .g-form-reveal__body')); return { r: parseFloat(cs.borderRightWidth), l: parseFloat(cs.borderLeftWidth) } })
    expect(rtl.r > 0 && rtl.l === 0, JSON.stringify(rtl)).toBe(true)
    await page.evaluate(() => document.getElementById('fr-form').closest('[data-frame]').removeAttribute('dir'))
    // Asentado y abierto
    const full = await page.evaluate(() => __st('fr-rv-factura'))
    expect(full.open && !full.anim && !full.inert && !full.disabled && full.ovf === 'visible' && full.vis === 'visible', JSON.stringify(full)).toBe(true)
    // Cerrar y pausar a la mitad: visible, intermedio, recortado, ya inert y disabled
    const props = await page.evaluate(() => __answerAndPause('no', 0.5))
    expect(props, 'transiciones de la raíz al cerrar').toEqual(expect.arrayContaining(['grid-template-rows', 'opacity']))
    expect(props.some((p) => /margin/.test(p)), `margen animado (${props})`).toBe(true)
    let s = await page.evaluate(() => __st('fr-rv-factura'))
    expect(s.h > 0 && s.h < full.h && s.vis === 'visible' && s.inert && s.disabled && s.ovf === 'hidden' && s.anim, `cerrando a la mitad ${JSON.stringify(s)}`).toBe(true)
    // Interrupción: al 50 % del cierre se vuelve a abrir; la nueva transición parte de la altura actual
    // (por programa y en la misma tarea: un clic tarda cuadros y la transición inversa es corta por el factor de reversión)
    const h1 = s.h
    const h2 = await page.evaluate(async () => { __fm().r.factura = 'si'; await Vue.nextTick(); return document.getElementById('fr-rv-factura').getBoundingClientRect().height })
    expect(Math.abs(h2 - h1), `interrupción ${h1.toFixed(1)} → ${h2.toFixed(1)} de ${full.h.toFixed(1)}`).toBeLessThan(full.h * 0.05)
    await settled(page, 'fr-rv-factura')
    // Abrir desde cerrado y pausar a la mitad: altura intermedia, recortado, sin inert; a 3/4 opacidad intermedia
    await choose(page, 'fr-factura-1')
    await settled(page, 'fr-rv-factura')
    await page.evaluate(() => __answerAndPause('si', 0.5))
    s = await page.evaluate(() => __st('fr-rv-factura'))
    expect(s.h > 0 && s.h < full.h && !s.inert && !s.disabled && s.ovf === 'hidden' && s.anim, `abriendo a la mitad ${JSON.stringify(s)}`).toBe(true)
    await page.evaluate(() => __pause('fr-rv-factura', 0.75))
    s = await page.evaluate(() => __st('fr-rv-factura'))
    expect(s.op > 0 && s.op < 1, `abriendo a 3/4: opacidad ${s.op}`).toBe(true)
    await page.evaluate(() => __finish('fr-rv-factura'))
    await settled(page, 'fr-rv-factura')
    // Reabrir el padre no anima al anidado que ya estaba abierto (Moral)
    await choose(page, 'fr-factura-1')
    await settled(page, 'fr-rv-factura')
    await choose(page, 'fr-factura-0')
    expect(await page.evaluate(() => document.getElementById('fr-rv-moral').getAnimations().length)).toBe(0)
    expect(await page.evaluate(() => document.getElementById('fr-rv-moral').classList.contains('is-animating'))).toBe(false)
    await settled(page, 'fr-rv-factura')
    expect(errs, browserName).toEqual([])
  })

  test('conserva valores; foco al cerrar por programa → opción elegida; ciclo resumen → «No» → envío → reabrir → envío', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page)
    await page.fill('#fr-razon', 'Clínica del Valle SA de CV')
    await page.fill('#fr-rfc', 'CVA010203AB1')
    await choose(page, 'fr-factura-1')
    await settled(page, 'fr-rv-factura')
    await choose(page, 'fr-factura-0')
    await settled(page, 'fr-rv-factura')
    expect(await page.inputValue('#fr-razon')).toBe('Clínica del Valle SA de CV')
    expect(await page.inputValue('#fr-rfc')).toBe('CVA010203AB1')
    expect(await page.locator('#fr-persona-1').isChecked()).toBe(true)
    // Cierre por programa con el foco dentro: a la opción elegida de la pregunta, nunca a <body>, sin desplazar
    await page.focus('#fr-rfc')
    const y0 = await page.evaluate(() => scrollY)
    await page.evaluate(() => { __fm().r.factura = 'no' })
    await settled(page, 'fr-rv-factura')
    expect(await active(page)).toBe('fr-factura-1*')
    expect(await page.evaluate(() => scrollY)).toBe(y0)
    // Ciclo del resumen: Física con CURP vacía → Guardar → resumen con #fr-curp
    await choose(page, 'fr-factura-0')
    await choose(page, 'fr-persona-0')
    await settled(page, 'fr-rv-fisica')
    await page.click('#fr-save')
    await expect(page.locator('#fr-log')).toContainText('invalid')
    const links = () => page.evaluate(() => { const s = document.querySelector('#fr-form .g-error-summary'); return { hidden: s.hidden, links: [...s.querySelectorAll('a')].map((a) => a.getAttribute('href')) } })
    let sum = await links()
    expect(!sum.hidden && sum.links.includes('#fr-curp') && !sum.links.includes('#fr-razon') && !sum.links.includes('#fr-alergias-cual'), JSON.stringify(sum)).toBe(true)
    expect(await page.getAttribute('#fr-curp', 'aria-invalid')).toBe('true')
    expect(await page.locator('#fr-log').textContent()).not.toMatch(/r-razon|r-alergias-cual/)
    // «No»: los errores del bloque salen en silencio del resumen y este se oculta
    await choose(page, 'fr-factura-1')
    await settled(page, 'fr-rv-factura')
    sum = await links()
    expect(sum.hidden && sum.links.length === 0, JSON.stringify(sum)).toBe(true)
    // Envío con el bloque cerrado: submit (no invalid) y FormData sin sus campos
    await page.click('#fr-save')
    await expect(page.locator('#fr-log')).toContainText('submit')
    const log = await page.locator('#fr-log').textContent()
    expect(FISCAL.some((k) => log.includes(k)), log).toBe(false)
    // Reabrir: sin errores visibles; el siguiente envío los revela
    await choose(page, 'fr-factura-0')
    await settled(page, 'fr-rv-factura')
    expect(await page.getAttribute('#fr-curp', 'aria-invalid')).toBeNull()
    expect((await page.locator('#fr-curp').evaluate((i) => i.closest('.g-input').querySelector('.g-input__message').textContent)).trim()).toBe('')
    expect((await links()).hidden).toBe(true)
    await page.click('#fr-save')
    await expect(page.locator('#fr-log')).toContainText('invalid')
    expect(await page.getAttribute('#fr-curp', 'aria-invalid')).toBe('true')
    expect((await links()).links).toContain('#fr-curp')
    expect(errs, browserName).toEqual([])
  })

  test('showErrors() con bloques cerrados: no revela ni lista sus campos; GSelect, GDatePicker y GCheckboxGroup dentro', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page)
    // Física abierta (Moral cerrada, con GDatePicker dentro); alergias cerrado
    await choose(page, 'fr-persona-0')
    await settled(page, 'fr-rv-fisica')
    await page.click('#fr-show')
    await page.waitForTimeout(200)
    const st = await page.evaluate(() => {
      const s = document.querySelector('#fr-form .g-error-summary')
      const inv = (id) => document.getElementById(id).getAttribute('aria-invalid')
      return { hidden: s.hidden, links: [...s.querySelectorAll('a')].map((a) => a.getAttribute('href')), curp: inv('fr-curp'), razon: inv('fr-razon'), alergias: inv('fr-alergias-cual'), envio: document.querySelector('#fr-envio .g-checkbox-group__message').textContent.trim(), focus: document.activeElement.classList.contains('g-error-summary') }
    })
    expect(!st.hidden && st.links.includes('#fr-curp') && !st.links.includes('#fr-razon') && !st.links.includes('#fr-alergias-cual'), JSON.stringify(st)).toBe(true)
    expect(st.curp, 'CURP (bloque activo) revelada').toBe('true')
    expect(st.razon, 'razón social (Moral cerrada) sin revelar').toBeNull()
    expect(st.alergias, 'alergias cerrado sin revelar').toBeNull()
    expect(st.envio, 'GCheckboxGroup activo revelado').toContain('Elige cómo enviar la factura')
    expect(st.focus, 'el foco va al resumen').toBe(true)
    // Con «No», showErrors() solo lista lo de fuera (nada): el resumen queda oculto
    await choose(page, 'fr-factura-1')
    await settled(page, 'fr-rv-factura')
    await page.click('#fr-show')
    await page.waitForTimeout(200)
    expect(await page.evaluate(() => document.querySelector('#fr-form .g-error-summary').hidden)).toBe(true)
    // GSelect y GDatePicker dentro de un bloque cerrado: sus <input hidden> fuera de FormData
    const keys = await fd(page)
    expect(keys.includes('r-regimen') || keys.includes('r-constitucion'), `${keys}`).toBe(false)
    // Dentro de un bloque abierto el GSelect se abre y elige
    await choose(page, 'fr-factura-0')
    await settled(page, 'fr-rv-factura')
    await page.click('#fr-regimen')
    await page.locator('#fr-regimen-opt-2').click()
    expect(await page.evaluate(() => new FormData(document.getElementById('fr-form')).get('r-regimen'))).toBe('626')
    expect(errs, browserName).toEqual([])
  })

  test('movimiento reducido: altura y margen en un cuadro, fundido al abrir y al cerrar, Δ 0, fase cerrada por el respaldo', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page, { reduced: true })
    await choose(page, 'fr-factura-1')
    await settled(page, 'fr-rv-factura')
    await page.evaluate(() => document.getElementById('fr-factura').scrollIntoView({ block: 'center' }))
    const tr = page.evaluate(() => __track('#fr-factura', 400))
    await page.waitForTimeout(40)
    const rm = await page.evaluate(async () => { __fm().r.factura = 'si'; await Vue.nextTick(); const el = document.getElementById('fr-rv-factura'); return { props: el.getAnimations().map((a) => a.transitionProperty), h: el.getBoundingClientRect().height } })
    const t = await tr
    const t0 = Date.now()
    await settled(page, 'fr-rv-factura')
    const took = Date.now() - t0
    const fullH = (await page.evaluate(() => __st('fr-rv-factura'))).h
    expect(!rm.props.includes('grid-template-rows') && !rm.props.some((p) => /margin/.test(p)) && rm.props.includes('opacity'), `${rm.props}`).toBe(true)
    expect(Math.abs(rm.h - fullH), 'altura final en el mismo cuadro').toBeLessThan(0.5)
    expect(t.dt, 'el disparador no se mueve').toBe(0)
    expect(took, 'is-animating se cierra por el temporizador de respaldo (sin transitionend de grid-template-rows)').toBeLessThan(1000)
    await page.evaluate(() => __answerAndPause('no', 0.5))
    const s = await page.evaluate(() => __st('fr-rv-factura'))
    expect(s.vis === 'visible' && s.op > 0 && s.op < 1 && s.inert, `cerrando con movimiento reducido ${JSON.stringify(s)}`).toBe(true)
    await page.evaluate(() => __finish('fr-rv-factura'))
    await settled(page, 'fr-rv-factura')
    expect(errs, browserName).toEqual([])
  })

  test('320 con dos niveles abiertos: sin desborde; barra al inicio de la pregunta y fin de las filas igual al de fuera', async ({ page, browserName }) => {
    const errs = await watchConsole(page)
    await open(page)
    await page.selectOption('#fm-bench-w', '320')
    await settle(page)
    const g = await page.evaluate(() => {
      const fr = document.getElementById('fr-form').closest('[data-frame]')
      const lay = document.getElementById('fr-layout').getBoundingClientRect()
      const q = document.getElementById('fr-factura').getBoundingClientRect()
      const root = document.getElementById('fr-rv-factura').getBoundingClientRect()
      const row = document.querySelector('#fr-rv-moral .g-form-row').getBoundingClientRect()
      return { sw: fr.scrollWidth, cw: fr.clientWidth, doc: document.documentElement.scrollWidth - window.innerWidth, barStart: root.left - q.left, rowEnd: lay.right - row.right, rowStart: row.left - root.left }
    })
    expect(g.sw <= g.cw && g.doc <= 0, JSON.stringify(g)).toBe(true)
    expect(Math.abs(g.barStart), 'barra alineada con el inicio de la pregunta').toBeLessThanOrEqual(1)
    expect(Math.abs(g.rowEnd), 'las filas del bloque terminan en el mismo borde').toBeLessThanOrEqual(1)
    expect(g.rowStart, 'sangría de dos niveles').toBeGreaterThan(0)
    expect(errs, browserName).toEqual([])
  })
})
