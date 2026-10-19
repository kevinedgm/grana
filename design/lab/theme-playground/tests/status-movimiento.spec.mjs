// Isla de estado · movimiento cuadro a cuadro (design/contracts/status.md «Formas», «Interrupciones» y «Movimiento»;
// DECISIONS.md #701 y #702; auditoría de coco design/lab/alert/auditoria-movimiento.md, F1 a F3) sobre los COMPONENTES
// REALES del playground, en Chromium, Firefox y WebKit. Cada prueba graba, en cada cuadro (requestAnimationFrame), la etapa,
// la caja y la opacidad de `__shape`, el texto del titular y la posición de referencias de la página.
//   · F2 · el primer cuadro visible nunca tiene un tamaño ajeno: nace como cápsula (≤ su destino) y con opacidad < 1, la
//     primera vez y con un tamaño previo distinto; ningún cuadro más ancho o alto que el destino salvo el sobrepaso del
//     muelle (≤ 4 %).
//   · F1 · con «Guardar» en uso (foco y clic reales), la entrada no se cancela: primer cuadro visible con opacidad < 1 y
//     ninguna transitioncancel de la forma durante la caída; la región nunca escribe `transition` en línea.
//   · I4 / F3 · recogerse: todos los cuadros visibles llevan su texto (nunca se funde vacía); `hidden` llega después de la
//     subida; el último cuadro visible ya se está fundiendo (también en Firefox).
//   · D1 · nada se mueve: las referencias de la página, Δ0 en todas las etapas, también con asomo y lista.
//   · Interrupciones (#702): algo nuevo durante la subida vuelve a caer desde donde está (sin ocultarse ni saltar); durante
//     el estrechamiento se ensancha desde el ancho actual; el puntero cancela una recogida por tiempo; «Ocultar»/Esc durante
//     la entrada y abrir la lista durante el ensanche responden en el cuadro siguiente.
// Un solo proceso por puerto: GRANA_PW_PORT=4212 npx playwright test tests/status-movimiento.spec.mjs
import { test, expect } from '@playwright/test'

test.setTimeout(90_000)

const PAGE = '/packages/vue/playground/index.html'
const REFS = ['#st-cliente', '#st-save', '#st-table-region', '#st-text-mark']

function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana Status\]/.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}
async function open(page, { width = 1280, height = 900 } = {}) {
  await page.setViewportSize({ width, height })
  await page.goto(`${PAGE}?status=none`)
  await page.waitForFunction(() => window.gStatus && window.__st && document.querySelector('.g-status-island.is-ready'))
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
  await page.evaluate(() => document.fonts.ready)
  await page.mouse.move(5, height - 20)
  await page.evaluate(() => document.getElementById('st-save').scrollIntoView({ block: 'center' }))
  await page.waitForTimeout(200)
}
// Grabadora: un registro por cuadro hasta stop()
const record = (page) => page.evaluate((refs) => {
  window.__rec = []
  window.__on = true
  window.__styles = []
  const root = document.querySelector('.g-status-island')
  const sh = root.querySelector('.g-status-island__shape')
  new MutationObserver(() => window.__styles.push(sh.getAttribute('style') || '')).observe(sh, { attributes: true, attributeFilter: ['style'] })
  window.__cancel = 0
  window.__runs = []
  sh.addEventListener('transitioncancel', (e) => { if (e.target === sh && root.dataset.stage === 'drop') window.__cancel++ })
  sh.addEventListener('transitionrun', (e) => { if (e.target === sh) window.__runs.push(`${root.dataset.stage || '-'}:${e.propertyName}`) })
  const f = () => {
    const r = sh.getBoundingClientRect()
    const cs = getComputedStyle(sh)
    const t = root.querySelector('.g-status-island__text:not([aria-hidden])')
    window.__rec.push({
      t: performance.now(), stage: root.dataset.stage || null, form: root.dataset.form, hidden: sh.hidden,
      vis: !sh.hidden && cs.display !== 'none' && +cs.opacity > 0.01 && r.width > 0, op: +cs.opacity, w: r.width, h: r.height, top: r.top,
      text: t ? t.textContent.trim() : '', refs: refs.map((s) => document.querySelector(s).getBoundingClientRect().top)
    })
    if (window.__on) requestAnimationFrame(f)
  }
  requestAnimationFrame(f)
}, REFS)
const stop = (page) => page.evaluate(() => { window.__on = false; return { rec: window.__rec, styles: window.__styles, cancel: window.__cancel, runs: window.__runs } })
const waitStage = (page, s, timeout = 15_000) => page.waitForFunction((x) => (document.querySelector('.g-status-island').dataset.stage || null) === x, s, { timeout })
const rest = (page) => page.waitForFunction(() => { const r = document.querySelector('.g-status-island'); return r.dataset.form !== 'empty' && !r.dataset.stage })
const empty = (page) => page.waitForFunction(() => document.querySelector('.g-status-island').dataset.form === 'empty', null, { timeout: 20_000 })
const fmt = (r) => r.map((x) => `${Math.round(x.t)} ${x.stage || '-'} ${x.form} ${x.vis ? 'V' : '·'} ${Math.round(x.w)}×${Math.round(x.h)} y${Math.round(x.top)} o${x.op.toFixed(2)} «${x.text.slice(0, 18)}»`).join('\n')

test.describe('isla de estado · movimiento (status.md #701, #702)', () => {
  test('F2: nace como cápsula con opacidad < 1, la primera vez y con un tamaño previo distinto; nunca más grande que su destino (sobrepaso ≤ 4 %)', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page)
    for (const [id, title] of [['largo', 'La sesión caduca pronto: guarda tu trabajo o sigue conectado'], ['corto', 'Sin conexión']]) {
      await record(page)
      await page.evaluate(([i, t]) => window.gStatus.warning(i, t), [id, title])
      await rest(page)
      await page.waitForTimeout(150)
      const { rec, styles, runs } = await stop(page)
      const vis = rec.filter((x) => x.vis)
      const final = vis[vis.length - 1]
      // El primer cuadro que se pinta (aunque sea transparente): la cápsula, nunca más que su destino
      const first = rec.find((x) => !x.hidden && x.w > 0)
      const msg = `${id} ${runs.join(' ')}\n${fmt(rec.slice(0, 40))}`
      // La entrada es un fundido que corre (con cuadros espaciados, el primero visible puede llegar ya opaco)
      expect(first.op, msg).toBeLessThan(1)
      expect(runs.some((r) => r === 'drop:opacity'), msg).toBe(true)
      expect(first.w, msg).toBeLessThanOrEqual(final.w + 0.5)
      expect(first.h, msg).toBeLessThanOrEqual(final.h + 0.5)
      for (const x of vis) {
        expect(x.w, msg).toBeLessThanOrEqual(final.w * 1.04 + 1)
        expect(x.h, msg).toBeLessThanOrEqual(final.h * 1.04 + 1)
      }
      expect(styles.some((s) => /transition/.test(s)), 'sin transition en línea (F1)').toBe(false)
      await page.evaluate(() => window.gStatus.hide())
      await empty(page)
      expect(await page.evaluate(() => document.querySelector('.g-status-island__shape').style.getPropertyValue('--_island-w')), 'vacía: sin tamaño guardado').toBe('')
    }
    expect(errs).toEqual([])
  })

  test('F1: con «Guardar» en uso (foco y clic reales) la entrada no se cancela; Δ0 en la página durante la entrada', async ({ page, browserName }) => {
    const errs = watchConsole(page)
    const TOL = browserName === 'webkit' ? 1.5 : 1
    await open(page)
    await page.focus('#st-save')
    await record(page)
    await page.click('#st-save')
    await rest(page)
    await page.waitForTimeout(150)
    const { rec, styles, cancel, runs } = await stop(page)
    const vis = rec.filter((x) => x.vis)
    const first = rec.find((x) => !x.hidden && x.w > 0)
    const msg = `${runs.join(' ')}\n${fmt(rec.slice(0, 40))}`
    expect(first.op, msg).toBeLessThan(1)
    expect(runs.some((r) => r === 'drop:opacity'), msg).toBe(true)
    expect(first.w, msg).toBeLessThanOrEqual(vis[vis.length - 1].w + 0.5)
    expect(cancel, 'ninguna transitioncancel de la forma durante la caída').toBe(0)
    expect(styles.some((s) => /transition/.test(s))).toBe(false)
    for (let i = 0; i < REFS.length; i++) {
      const ys = rec.map((x) => x.refs[i])
      expect(Math.max(...ys) - Math.min(...ys), `${REFS[i]} Δ`).toBeLessThanOrEqual(TOL)
    }
    if (browserName !== 'webkit') expect(await page.evaluate(() => document.activeElement.id)).toBe('st-save') // WebKit no enfoca un botón al pulsarlo
    expect(errs).toEqual([])
  })

  test('I4 / F3: se recoge con su texto en cada cuadro visible, se funde antes de ocultarse (también en Firefox) y `hidden` llega tras la subida; D1 con asomo y lista', async ({ page, browserName }) => {
    const errs = watchConsole(page)
    const TOL = browserName === 'webkit' ? 1.5 : 1
    await open(page)
    await record(page)
    await page.evaluate(() => window.__st.offline())
    await rest(page)
    await page.hover('.g-status-island__summary')
    await page.waitForTimeout(400)
    await page.click('.g-status-island__summary')
    await page.waitForTimeout(400)
    await page.mouse.move(5, 880)
    await page.evaluate(() => window.gStatus.close())
    await empty(page)
    await page.waitForTimeout(100)
    const { rec } = await stop(page)
    const msg = fmt(rec)
    const leaving = rec.filter((x) => x.stage === 'fold' || x.stage === 'rise')
    expect(leaving.length, msg).toBeGreaterThan(0)
    for (const x of leaving.filter((y) => y.vis)) expect(x.text, msg).toMatch(/Sin conexión/)
    expect(leaving.some((x) => x.hidden), '`hidden` no llega durante fold ni rise').toBe(false)
    const lastVis = [...rec].reverse().find((x) => x.vis)
    expect(lastVis.op, `el último cuadro visible ya se funde\n${msg}`).toBeLessThan(1)
    expect(rec.some((x) => x.form === 'list'), 'hubo lista').toBe(true)
    for (let i = 0; i < REFS.length; i++) {
      const ys = rec.map((x) => x.refs[i])
      expect(Math.max(...ys) - Math.min(...ys), `${REFS[i]} Δ en todas las etapas`).toBeLessThanOrEqual(TOL)
    }
    expect(errs).toEqual([])
  })

  test('interrupción: algo nuevo durante la subida vuelve a caer desde donde está, sin ocultarse ni saltar', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page)
    await page.evaluate(() => window.__st.offline())
    await rest(page)
    await record(page)
    // A mitad de `rise` llega otra condición. La transición nueva de la caída debe partir del valor de ese momento (Chromium y
    // WebKit: el mismo; Firefox: el del cuadro en que aplica el estilo, un poco más arriba), nunca de su origen
    // (−(100 % + margen), opacidad 0): se leen sus primeros fotogramas (Web Animations)
    const at = await page.evaluate(() => new Promise((res) => {
      const root = document.querySelector('.g-status-island')
      const sh = root.querySelector('.g-status-island__shape')
      const pct = (v) => parseFloat(/(-?[\d.]+)%/.exec(v || '')?.[1] ?? 'NaN')
      const mo = new MutationObserver(() => {
        if (root.dataset.stage !== 'rise') return
        mo.disconnect()
        setTimeout(async () => {
          const cs = getComputedStyle(sh)
          const before = { y: pct(cs.translate), op: +cs.opacity }
          window.gStatus.error('boom', 'El servidor no responde')
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
          const k = (prop) => { const a = sh.getAnimations().find((x) => x.transitionProperty === prop); return a ? a.effect.getKeyframes()[0][prop] : null }
          res({ before, from: { y: pct(k('translate')), op: k('opacity') === null ? null : +k('opacity') }, stage: root.dataset.stage, hidden: sh.hidden })
        }, 80)
      })
      mo.observe(root, { attributes: true, attributeFilter: ['data-stage'] })
      window.gStatus.hide()
    }))
    await page.waitForFunction(() => window.gStatus.state.current === 'boom')
    await rest(page)
    await page.waitForTimeout(100)
    const { rec } = await stop(page)
    const msg = `${JSON.stringify(at)}\n${fmt(rec)}`
    expect(at.stage, msg).toBe('drop')
    expect(at.hidden, msg).toBe(false)
    // Cada motor muestrea el valor de partida en su propio instante (Firefox, en el cuadro en que aplica el estilo); lo que
    // no puede pasar es que la caída empiece en su origen (−100 %, opacidad 0) habiendo una isla a medio subir
    expect(at.from.y, `la caída parte de donde estaba, no de −100 %\n${msg}`).toBeGreaterThan(-98)
    if (at.before.op > 0.05) expect(at.from.op, `ni de opacidad 0\n${msg}`).toBeGreaterThan(0.02)
    expect(rec.some((x) => x.hidden || x.form === 'empty'), msg).toBe(false)
    expect(rec[rec.length - 1].text).toMatch(/El servidor no responde/)
    expect(errs).toEqual([])
  })

  test('interrupción: algo nuevo durante el estrechamiento se ensancha desde el ancho actual; el puntero cancela una recogida por tiempo', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page)
    await page.evaluate(() => window.gStatus.info('a', 'Mantenimiento programado esta noche'))
    await rest(page)
    await record(page)
    // A mitad de `fold` llega otra: el ensanche parte del ancho de ese momento (o del cuadro siguiente), nunca de la cápsula
    const at = await page.evaluate(() => new Promise((res) => {
      const root = document.querySelector('.g-status-island')
      const sh = root.querySelector('.g-status-island__shape')
      const mo = new MutationObserver(() => {
        if (root.dataset.stage !== 'fold') return
        mo.disconnect()
        setTimeout(async () => {
          const before = sh.getBoundingClientRect().width
          window.gStatus.warning('b', 'Sin conexión con el analizador 2')
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
          const a = sh.getAnimations().find((x) => x.transitionProperty === '--_status-w')
          res({ before, from: a ? parseFloat(a.effect.getKeyframes()[0]['--_status-w']) : null, capsule: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-space-1')) * 24, stage: root.dataset.stage })
        }, 20)
      })
      mo.observe(root, { attributes: true, attributeFilter: ['data-stage'] })
      window.gStatus.hide()
    }))
    await page.waitForFunction(() => window.gStatus.state.current === 'b')
    await rest(page)
    const { rec } = await stop(page)
    const msg = `${JSON.stringify(at)}\n${fmt(rec)}`
    expect(at.stage, msg).toBe('grow')
    if (at.from !== null) {
      // El valor de partida es el del momento (cada motor lo muestrea a su manera), nunca la cápsula si aún no había llegado
      if (at.before > at.capsule + 30) expect(at.from, `no desde la cápsula\n${msg}`).toBeGreaterThan(at.capsule + 4)
    }
    expect(rec.some((x) => x.stage === 'rise' || x.stage === 'drop' || x.hidden), `no vuelve a caer\n${msg}`).toBe(false)
    // Recogida por tiempo: el puntero sobre la isla la cancela y vuelve en pausa
    await waitStage(page, 'fold', 20_000)
    const box = await page.evaluate(() => { const r = document.querySelector('.g-status-island__summary').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })
    await page.mouse.move(box.x, box.y) // no page.hover: espera a que la forma deje de moverse
    await page.waitForFunction(() => window.gStatus.state.current === 'b' && document.querySelector('.g-status-island').dataset.stage !== 'fold')
    await rest(page)
    await expect(page.locator('.g-status-island')).toHaveClass(/is-paused/)
    expect(errs).toEqual([])
  })

  test('ninguna acción espera a un movimiento: hide durante la caída pasa a recogerse; abrir la lista durante el ensanche quita la etapa', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page)
    const r = await page.evaluate(() => new Promise((res) => {
      const root = document.querySelector('.g-status-island')
      const out = []
      const mo = new MutationObserver(() => {
        const s = root.dataset.stage || null
        out.push(s)
        if (s === 'drop' && out.length === 1) requestAnimationFrame(() => window.gStatus.hide())
      })
      mo.observe(root, { attributes: true, attributeFilter: ['data-stage', 'data-form'] })
      window.gStatus.info('a', 'Uno')
      setTimeout(() => { mo.disconnect(); res(out) }, 1500)
    }))
    expect(r.slice(0, 2)).toEqual(['drop', 'fold'])
    await empty(page)
    const s = await page.evaluate(() => new Promise((res) => {
      const root = document.querySelector('.g-status-island')
      const mo = new MutationObserver(() => {
        if (root.dataset.stage === 'grow') { mo.disconnect(); window.gStatus.open(); requestAnimationFrame(() => res({ form: root.dataset.form, stage: root.dataset.stage || null })) }
      })
      mo.observe(root, { attributes: true, attributeFilter: ['data-stage'] })
      window.gStatus.warning('b', 'Dos')
    }))
    expect(s).toEqual({ form: 'list', stage: null })
    expect(errs).toEqual([])
  })
})
