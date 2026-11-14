// DIAGNÓSTICO TEMPORAL (#1079, regresión de accordion.spec.mjs:252 en WebKit). Se retira al cerrar la causa.
// El mismo escenario que «exclusive: un scrollTop de la aplicación 100 ms después del clic no se deshace (#683)», con el
// overflow-anchor en línea de #ac-sticky-scroller forzado a 'none' (lo que hace el grupo sticky desde #1079) y a 'auto'
// (lo de antes, en efecto). Hipótesis: con el contenedor fuera de la selección del ancla del documento, WebKit elige un ancla
// por debajo del «Resultados» que se pliega y desplaza la página lo que queda del plegado tras cancelarse Δ0.
// No afirma nada: imprime la traza. GRANA_PW_PORT propio.
import { test } from './vue-local.mjs'

const PAGE = '/packages/vue/playground/accordion.html'
const frames = (page, n = 2) => page.evaluate((k) => new Promise((r) => { const f = () => (k-- > 0 ? requestAnimationFrame(f) : setTimeout(r, 20)); f() }), n)

for (const forced of ['none', 'auto']) {
  for (const how of ['scrollTop', 'scrollTo']) {
    test(`diag #1079 · #683 ${how} con #ac-sticky-scroller overflow-anchor: ${forced}`, async ({ page, browserName }) => {
      await page.setViewportSize({ width: 1280, height: 900 })
      await page.goto(PAGE)
      await page.waitForSelector('#faq-cambiar.is-ready')
      await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
      await page.evaluate(() => document.fonts.ready)
      await page.mouse.move(2, 2)
      await frames(page, 3)
      // El grupo sticky ya retiene (none) o no; se fuerza el valor para las dos ramas del experimento
      await page.evaluate((v) => { document.getElementById('ac-sticky-scroller').style.overflowAnchor = v }, forced)
      if ((await page.getAttribute('#ex-resultados-toggle', 'aria-expanded')) !== 'true') {
        await page.evaluate(() => { document.getElementById('app').__vue_app__._instance.proxy.ac.excl = ['resultados'] })
        await page.waitForTimeout(600)
      }
      await page.evaluate(() => { const r = document.querySelector('#ex-pago-toggle').getBoundingClientRect(); window.scrollBy(0, r.top - 520) })
      await frames(page)
      await page.click('#ex-pago-toggle', { noWaitAfter: true })
      const out = await page.evaluate(async (how) => {
        await new Promise((r) => setTimeout(r, 100))
        const y = Math.max(0, scrollY - 300)
        if (how === 'scrollTo') window.scrollTo({ top: y, behavior: 'instant' })
        else document.scrollingElement.scrollTop = y
        const target = scrollY
        const sc = document.getElementById('ac-sticky-scroller').getBoundingClientRect()
        const trace = []
        const t0 = performance.now()
        await new Promise((res) => {
          const f = () => {
            trace.push(`${Math.round(performance.now() - t0)}ms y=${Math.round(scrollY)} html.oa=${document.documentElement.style.overflowAnchor || '·'} sc.oa=${document.getElementById('ac-sticky-scroller').style.overflowAnchor || '·'} resH=${document.getElementById('ex-resultados-content').offsetHeight}`)
            if (performance.now() - t0 < 700) requestAnimationFrame(f)
            else res()
          }
          requestAnimationFrame(f)
        })
        return { target, end: scrollY, scTop: Math.round(sc.top), scBottom: Math.round(sc.bottom), vh: innerHeight, trace }
      }, how)
      console.log(`\n[${browserName}] oa=${forced} ${how}: ajeno ${out.target} → final ${out.end} (Δ ${out.end - out.target}); scroller en el visor ${out.scTop}..${out.scBottom} de ${out.vh}\n  ${out.trace.join('\n  ')}`)
    })
  }
}
