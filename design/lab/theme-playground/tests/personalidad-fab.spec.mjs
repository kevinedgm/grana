// GFab · personalidad (DECISIONS.md #655; design/contracts/fab.md «Movimiento» y «Personalidad»; coreografía de coco en
// design/lab/fab/estilo.md «Qué le da personalidad» y «Movimiento»; hallazgo H3 de design/lab/fab/auditoria.md).
// Sobre el COMPONENTE REAL (dist/fab.umd.js) en el banco ligero packages/vue/playground/fab.html, en Chromium, Firefox y
// WebKit. Sin depender del reloj: en cuanto la lista (o la raíz) cambia de estado, un MutationObserver congela las
// transiciones CSS reales del subárbol (Web Animations: pause) y se recorre su tiempo con currentTime; cada medida se toma
// en el mismo turno, antes de cualquier temporizador del componente. Lo que se comprueba:
//   · A: cada píldora sale del CENTRO DEL FAB como semilla (recortada a su círculo e invisible) y se despliega mientras
//     viaja, la más cercana primero (retardo fast × min(i, 4) / 8; translate y recorte en press, opacidad en fast, ease-out,
//     sin muelle); vuelve al FAB como semilla, en fast y sin escalonado; nada supera 240 ms.
//   · El «+» gira 45° y se funde mientras la «x» llega desde −45°: en cada instante son la misma forma (Δ 45°).
//   · C: la cola se convierte en el panel (recorte que parte de la cola y crece en slow, relleno de la cola → superficie,
//     contenido después: fast tras fast).
//   · El panel de «Más acciones» entra con opacidad y escala 0,96 desde la esquina del FAB.
//   · Confirmar parte la píldora por una costura (mismo sitio, extremos de fuera redondos, medios sm) con un fundido.
//   · Acuse: la insignia aparece con escala 0,5 → 1, gira en curso y mira al contenido (esquina de dentro, a 45°).
//   · Se aparta con translate en press y ease-out, con 24px a la vista.
//   · Movimiento reducido (#299 (3), fab.md §29.3): solo fundidos; nada se desplaza, gira, escala ni se recorta.
// Un solo proceso por puerto: GRANA_PW_PORT=4212 npx playwright test tests/personalidad-fab.spec.mjs
import { test, expect } from '@playwright/test'

test.setTimeout(90_000)

const PAGE = '/packages/vue/playground/fab.html'
const FRAMES = new Set(['opacity', 'background-color', 'color']) // lo único que puede animarse con movimiento reducido

function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon|Failed to load resource/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Grana|\[Vue warn\]/.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}

// Ayudantes de la página: congelar al cambiar un atributo, medir semillas y hacer pruebas de impacto
function helpers() {
  const deg = (v) => (!v || v === 'none' ? 0 : parseFloat(v))
  const mid = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } }
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const cx = canvas.getContext('2d', { willReadFrequently: true })
  // Cualquier color CSS a [r, g, b, a] (el lienzo normaliza rgb(), color(srgb …), oklch() y hex en los tres motores)
  const rgba = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); return [...cx.getImageData(0, 0, 1, 1).data] }
  const tok = (name, el = document.getElementById('fab')) => {
    const p = document.createElement('span')
    p.style.cssText = `position:absolute;visibility:hidden;color:var(${name})`
    el.append(p)
    const v = getComputedStyle(p).color
    p.remove()
    return rgba(v)
  }
  const ms = (name) => { const v = getComputedStyle(document.getElementById('fab')).getPropertyValue(name).trim(); return parseFloat(v) * (/ms$/.test(v) ? 1 : 1000) }
  const durationOf = (name) => {
    // --g-duration-slow es un calc(): se resuelve con una transición de prueba
    const p = document.createElement('span')
    p.style.cssText = `transition-duration:var(${name})`
    document.body.append(p)
    const v = getComputedStyle(p).transitionDuration
    p.remove()
    return parseFloat(v) * (/ms$/.test(v) ? 1 : 1000)
  }
  // Congela todas las animaciones del subárbol de `root` cuando `el[attr]` cumple `pred`; `kick` dispara el cambio
  const freeze = (el, attr, pred, kick, root = document.getElementById('fab')) => new Promise((resolve) => {
    const read = () => (attr === 'class' ? el.className : el.getAttribute(attr))
    const mo = new MutationObserver(() => {
      if (!pred(read())) return
      mo.disconnect()
      // Solo las que corren: el giro de carga de GBtn está siempre en el árbol, en pausa y oculto (GBtn.css)
      const anims = root.getAnimations({ subtree: true }).filter((a) => a.playState !== 'paused')
      anims.forEach((a) => a.pause())
      resolve(anims)
    })
    mo.observe(el, { attributes: true, attributeFilter: [attr] })
    kick()
  })
  const seek = (anims, t) => anims.forEach((a) => { a.currentTime = t })
  const timing = (a) => { const t = a.effect.getTiming(); return { prop: a.transitionProperty || a.animationName, delay: t.delay, duration: t.duration, easing: t.easing, iterations: t.iterations, el: a.effect.target } }
  const hits = (el, x, y) => { const at = document.elementFromPoint(x, y); return !!at && (at === el || el.contains(at)) }
  const fabMid = () => mid(document.getElementById('fab-trigger'))
  // Píldoras de la pila por cercanía al FAB (la primera es la más usada)
  const pills = () => { const lis = [...document.querySelectorAll('#fab-menu > li')]; return document.getElementById('fab').dataset.position.startsWith('bottom') ? lis.reverse() : lis }
  const seed = (li) => { const f = fabMid(); const s = mid(li.querySelector('.g-fab__icon')); return { dx: s.x - f.x, dy: s.y - f.y, d: Math.hypot(s.x - f.x, s.y - f.y) } }
  const ease = (v) => String(v).replace(/\s/g, '').replace(/([(,])\./g, (m, c) => c + '0.')
  window.__pf = { ease, deg, mid, rgba, tok, ms, durationOf, freeze, seek, timing, hits, fabMid, pills, seed }
}

async function load(page, qs = '', { width = 1280, height = 900, motion = 'no-preference' } = {}) {
  await page.emulateMedia({ reducedMotion: motion })
  await page.setViewportSize({ width, height })
  await page.goto(`${PAGE}?${qs}`)
  await page.waitForFunction(() => window.__ready && document.getElementById('fab'))
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(helpers)
}
const settle = (p, ms = 300) => p.evaluate((ms) => new Promise((r) => requestAnimationFrame(() => setTimeout(r, ms))), ms)
const openAndSettle = async (page) => {
  await page.click('#fab-trigger')
  await page.waitForFunction(() => document.getElementById('fab-menu').dataset.state === 'open')
  await settle(page)
}

test.describe('GFab · personalidad: la pila son brotes del botón (#655)', () => {
  test('A · cada píldora sale del centro del FAB como semilla, recortada e invisible, la más cercana primero', async ({ page }) => {
    const errs = watchConsole(page)
    await load(page, 'n=10')
    const r = await page.evaluate(async () => {
      const P = window.__pf
      const ul = document.getElementById('fab-menu')
      const anims = await P.freeze(ul, 'data-state', (v) => v === 'open', () => document.getElementById('fab-trigger').click())
      const fast = P.ms('--g-duration-fast')
      const press = P.ms('--g-duration-press')
      const ease = P.ease(getComputedStyle(document.getElementById('fab')).getPropertyValue('--g-ease-out'))
      const lis = P.pills()
      const per = lis.map((li) => anims.filter((a) => a.effect.target === li).map(P.timing).sort((a, b) => a.prop.localeCompare(b.prop)))
      const out = { fast, press, ease, n: lis.length, per: per.map((ts) => ts.map((t) => ({ prop: t.prop, delay: t.delay, duration: t.duration, easing: P.ease(t.easing) }))), i: lis.map((li) => li.style.getPropertyValue('--_i')) }
      // t = 0: semillas en el centro del FAB (unas sobre otras), invisibles y recortadas a su círculo: donde estará cada
      // etiqueta no hay nada de la lista que reciba el puntero
      P.seek(anims, 0)
      out.start = lis.map((li) => {
        const s = P.seed(li)
        const icon = P.mid(li.querySelector('.g-fab__icon'))
        const label = P.mid(li.querySelector('.g-fab__label'))
        return { d: s.d, op: getComputedStyle(li).opacity, seedHit: P.hits(ul, icon.x, icon.y), labelHit: P.hits(ul, label.x, label.y) }
      })
      // Trayectoria de la más cercana (sin retardo): se aleja del FAB en cada muestra, sin pasarse
      const near = lis[0]
      out.path = [0, 40, 80, 120, 160].map((t) => { P.seek(anims, t); return P.seed(near).d })
      // Al final de cada una (retardo + press): en su sitio, opaca y la etiqueta ya recibe el puntero
      const max = Math.max(...anims.map((a) => { const t = a.effect.getTiming(); return t.delay + t.duration }))
      out.max = max
      P.seek(anims, max)
      out.end = lis.map((li) => { const label = P.mid(li.querySelector('.g-fab__label')); return { d: P.seed(li).d, op: getComputedStyle(li).opacity, tr: getComputedStyle(li).translate, labelHit: P.hits(li, label.x, label.y) } })
      anims.forEach((a) => a.finish())
      return out
    })
    expect(r.n).toBe(5) // 4 píldoras + «Más acciones (6)»
    expect(r.i).toEqual(['0', '1', '2', '3', '4'])
    r.per.forEach((ts, i) => {
      expect(ts.map((t) => t.prop), `píldora ${i}`).toEqual(['clip-path', 'opacity', 'translate'])
      for (const t of ts) {
        expect(Math.abs(t.delay - (r.fast * Math.min(i, 4)) / 8), `retardo de la píldora ${i}`).toBeLessThan(0.6)
        expect(t.duration, `${t.prop} de la píldora ${i}`).toBe(t.prop === 'opacity' ? r.fast : r.press)
        expect(t.easing, 'ease-out del tema, sin muelle').toBe(r.ease)
        expect(t.easing).not.toMatch(/linear\(/)
      }
    })
    for (const [i, s] of r.start.entries()) {
      expect(s.d, `la semilla ${i} parte del centro del FAB`).toBeLessThan(1)
      expect(s.op).toBe('0')
      expect(s.seedHit, `semilla ${i} visible al puntero`).toBe(true)
      expect(s.labelHit, `etiqueta ${i} recortada al partir`).toBe(false)
    }
    for (let k = 1; k < r.path.length; k++) expect(r.path[k], `trayectoria ${r.path.map((d) => d.toFixed(1))}`).toBeGreaterThan(r.path[k - 1])
    expect(Math.abs(r.path[4] - r.end[0].d)).toBeLessThan(0.5)
    for (const [i, e] of r.end.entries()) {
      expect(e.op).toBe('1')
      expect(e.tr).toBe('none')
      expect(e.labelHit, `etiqueta ${i} desplegada`).toBe(true)
    }
    expect(r.max).toBeLessThanOrEqual(240)
    expect(errs).toEqual([])
  })

  test('A · al cerrar vuelven al FAB como semilla, en fast y sin escalonado', async ({ page }) => {
    const errs = watchConsole(page)
    await load(page, 'n=10')
    await openAndSettle(page)
    const r = await page.evaluate(async () => {
      const P = window.__pf
      const ul = document.getElementById('fab-menu')
      const anims = await P.freeze(ul, 'data-state', (v) => v === 'closing', () => document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })))
      const fast = P.ms('--g-duration-fast')
      const lis = P.pills()
      const ts = anims.filter((a) => lis.includes(a.effect.target)).map(P.timing)
      P.seek(anims, fast)
      const end = lis.map((li) => ({ d: P.seed(li).d, op: getComputedStyle(li).opacity }))
      anims.forEach((a) => a.finish())
      return { fast, ts: ts.map((t) => ({ prop: t.prop, delay: t.delay, duration: t.duration })), end }
    })
    expect(r.ts.length).toBe(15)
    for (const t of r.ts) {
      expect(t.duration, t.prop).toBe(r.fast)
      expect(t.delay, t.prop).toBe(0)
    }
    for (const e of r.end) {
      expect(e.d, 'vuelve al centro del FAB').toBeLessThan(1)
      expect(e.op).toBe('0')
    }
    expect(errs).toEqual([])
  })

  test('el + gira 45° y se funde mientras la x llega desde −45°: en cada instante, la misma forma', async ({ page }) => {
    await load(page, 'n=6')
    const r = await page.evaluate(async () => {
      const P = window.__pf
      const root = document.getElementById('fab')
      const rest = root.querySelector('.g-fab__glyph--rest')
      const open = root.querySelector('.g-fab__glyph--open')
      const sample = (anims) => [0, 20, 40, 80, 120, 160].map((t) => {
        P.seek(anims, t)
        return { t, rest: P.deg(getComputedStyle(rest).rotate), open: P.deg(getComputedStyle(open).rotate), ro: +getComputedStyle(rest).opacity, oo: +getComputedStyle(open).opacity }
      })
      const glyphs = (anims) => anims.filter((a) => a.effect.target === rest || a.effect.target === open)
      let anims = glyphs(await P.freeze(root, 'data-state', (v) => v === 'opening', () => document.getElementById('fab-trigger').click()))
      const props = anims.map(P.timing).map((t) => `${t.el === rest ? 'rest' : 'open'}:${t.prop}:${t.duration}`).sort()
      const opening = sample(anims)
      anims.forEach((a) => a.finish())
      await new Promise((res) => setTimeout(res, 300))
      anims = glyphs(await P.freeze(root, 'data-state', (v) => v === 'closing', () => document.getElementById('fab-trigger').click()))
      const closing = sample(anims)
      anims.forEach((a) => a.finish())
      return { props, opening, closing }
    })
    expect(r.props).toEqual(['open:opacity:120', 'open:rotate:160', 'rest:opacity:120', 'rest:rotate:160'])
    expect(r.opening[0]).toMatchObject({ rest: 0, open: -45, ro: 1, oo: 0 })
    expect(r.opening.at(-1)).toMatchObject({ rest: 45, open: 0, ro: 0, oo: 1 })
    expect(r.closing[0]).toMatchObject({ rest: 45, open: 0 })
    expect(r.closing.at(-1)).toMatchObject({ rest: 0, open: -45 })
    for (const s of [...r.opening, ...r.closing]) expect(Math.abs(s.rest - s.open - 45), `t=${s.t}: + a ${s.rest}°, x a ${s.open}°`).toBeLessThan(0.5)
    // A mitad de camino los dos se ven (cruce), ninguno de golpe
    const m = r.opening.find((s) => s.t === 40)
    expect(m.rest).toBeGreaterThan(5)
    expect(m.rest).toBeLessThan(45)
  })
})

test.describe('GFab · personalidad: paneles, confirmación, acuse y se aparta (#655, #662, #663, #664)', () => {
  test('C · la cola se convierte en el panel: recorte desde la cola en slow, relleno de la cola a la superficie, contenido después', async ({ page }) => {
    const errs = watchConsole(page)
    await load(page, 'n=15&main=1')
    const r = await page.evaluate(async () => {
      const P = window.__pf
      const ul = document.getElementById('fab-menu')
      const tail = document.getElementById('fab-trigger')
      const tailBg = P.rgba(getComputedStyle(tail).backgroundColor)
      const tb = tail.getBoundingClientRect()
      const anims = await P.freeze(ul, 'data-state', (v) => v === 'open', () => tail.click())
      const slow = P.durationOf('--g-duration-slow')
      const fast = P.ms('--g-duration-fast')
      const ease = P.ease(getComputedStyle(document.getElementById('fab')).getPropertyValue('--g-ease-out'))
      const own = anims.filter((a) => a.effect.target === ul && !a.effect.pseudoElement).map(P.timing).map((t) => ({ prop: t.prop.replace(/^border-(top|right|bottom|left)-color$/, 'border-color'), duration: t.duration, delay: t.delay, easing: P.ease(t.easing) })).filter((t, i, all) => all.findIndex((x) => x.prop === t.prop) === i).sort((a, b) => a.prop.localeCompare(b.prop))
      const rows = anims.filter((a) => a.effect.target.parentElement === ul).map(P.timing)
      // Rejilla de 12 × 12 puntos dentro de la caja final del panel: qué parte recibe el puntero (lo que deja ver el recorte)
      const box = ul.getBoundingClientRect()
      const grid = []
      for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) grid.push([box.left + ((i + 0.5) * box.width) / 12, box.top + ((j + 0.5) * box.height) / 12])
      const seen = (t) => {
        P.seek(anims, t)
        const pts = grid.filter(([x, y]) => P.hits(ul, x, y))
        return { t, frac: pts.length / grid.length, minX: Math.min(...pts.map((p) => p[0])), maxX: Math.max(...pts.map((p) => p[0])), bg: P.rgba(getComputedStyle(ul).backgroundColor), rowOp: +getComputedStyle(ul.querySelector('li:not(.g-fab__find)') || ul.firstElementChild).opacity }
      }
      const steps = [0, slow / 4, slow / 2, (3 * slow) / 4, slow].map(seen)
      const atFast = seen(fast)
      const surface = P.tok('--g-color-surface')
      anims.forEach((a) => a.finish())
      return { slow, fast, ease, own, rows: rows.map((t) => ({ duration: t.duration, delay: t.delay, prop: t.prop })), steps, atFast, tailBg, surface, tail: { l: tb.left, r: tb.right, w: tb.width, h: tb.height }, box: { w: box.width, h: box.height } }
    })
    expect(r.slow).toBe(240)
    expect(r.own.map((t) => t.prop)).toEqual(['background-color', 'border-color', 'clip-path'])
    for (const t of r.own) {
      expect(t.duration, t.prop).toBe(r.slow)
      expect(t.delay).toBe(0)
      expect(t.easing).toBe(r.ease)
    }
    // El contenido entra cuando la caja ya casi está: opacidad fast tras fast
    expect(r.rows.length).toBeGreaterThan(0)
    for (const t of r.rows) expect(t).toEqual({ prop: 'opacity', duration: r.fast, delay: r.fast })
    expect(r.steps[0].rowOp).toBe(0)
    expect(r.atFast.rowOp).toBe(0)
    expect(r.steps.at(-1).rowOp).toBe(1)
    // Parte de la cola: solo una gota del ancho de la cola, alineada con ella, y con su relleno
    const s0 = r.steps[0]
    expect(s0.frac).toBeGreaterThan(0)
    expect(s0.frac).toBeLessThan(((r.tail.w + 4) * (r.tail.h + 4)) / (r.box.w * r.box.h) + 0.05)
    expect(s0.minX).toBeGreaterThanOrEqual(r.tail.l - 1)
    expect(s0.maxX).toBeLessThanOrEqual(r.tail.r + 1)
    expect(s0.bg).toEqual(r.tailBg)
    // Crece sin retroceder hasta la caja entera, con el relleno de la superficie
    for (let k = 1; k < r.steps.length; k++) expect(r.steps[k].frac, `recorte ${r.steps.map((s) => s.frac.toFixed(2))}`).toBeGreaterThanOrEqual(r.steps[k - 1].frac)
    expect(r.steps[2].frac).toBeGreaterThan(s0.frac)
    expect(r.steps.at(-1).frac).toBe(1)
    expect(r.steps.at(-1).bg).toEqual(r.surface)
    expect(r.steps[2].bg).not.toEqual(r.surface)
    expect(errs).toEqual([])
  })

  test('A · el panel de «Más acciones» entra con opacidad y escala 0,96 desde la esquina del FAB', async ({ page }) => {
    await load(page, 'n=15')
    await openAndSettle(page)
    const r = await page.evaluate(async () => {
      const P = window.__pf
      const sub = document.getElementById('fab-more')
      const anims = (await P.freeze(sub, 'data-state', (v) => v === 'open', () => document.querySelector('#fab-menu .g-fab__item--more').click())).filter((a) => a.effect.target === sub && !a.effect.pseudoElement)
      const ts = anims.map(P.timing).map((t) => `${t.prop}:${t.duration}`).sort()
      P.seek(anims, 0)
      const s0 = { scale: getComputedStyle(sub).scale, op: getComputedStyle(sub).opacity }
      const [ox, oy] = getComputedStyle(sub).transformOrigin.split(' ').map(parseFloat)
      const w = sub.offsetWidth, h = sub.offsetHeight
      anims.forEach((a) => a.finish())
      return { ts, s0, ox, oy, w, h, press: P.ms('--g-duration-press') }
    })
    expect(r.ts).toEqual([`opacity:${r.press}`, `scale:${r.press}`])
    expect(r.s0).toEqual({ scale: '0.96', op: '0' })
    // bottom-end: la esquina de abajo al final (la del FAB)
    expect(r.ox).toBeGreaterThan(r.w / 2)
    expect(r.oy).toBeGreaterThan(r.h / 2)
  })

  test('confirmar parte la píldora por una costura: mismo sitio, extremos de fuera redondos, medios sm, con un fundido', async ({ page }) => {
    const errs = watchConsole(page)
    await load(page, 'n=3')
    await openAndSettle(page)
    const r = await page.evaluate(async () => {
      const P = window.__pf
      const ul = document.getElementById('fab-menu')
      const btn = ul.querySelector('.g-fab__item--danger')
      const b = btn.getBoundingClientRect()
      const pair = await new Promise((resolve) => {
        const mo = new MutationObserver(() => { const c = ul.querySelector('.g-fab__confirm'); if (c) { mo.disconnect(); resolve(c) } })
        mo.observe(ul, { childList: true, subtree: true })
        btn.click()
      })
      const fade = pair.getAnimations().map(P.timing).map((t) => `${t.prop}:${t.duration}`)
      pair.getAnimations().forEach((a) => a.finish())
      const p = pair.getBoundingClientRect()
      const [first, last] = [pair.firstElementChild, pair.lastElementChild]
      const f = getComputedStyle(first), l = getComputedStyle(last)
      const probe = document.createElement('span')
      probe.style.cssText = 'position:absolute;border-radius:var(--g-radius-sm)'
      pair.append(probe)
      const sm = parseFloat(getComputedStyle(probe).borderTopLeftRadius)
      probe.remove()
      return {
        fade, fast: P.ms('--g-duration-fast'), sm, h: p.height,
        d: [p.left - b.left, p.right - b.right, p.top - b.top, p.bottom - b.bottom],
        outer: [parseFloat(f.borderStartStartRadius), parseFloat(f.borderEndStartRadius), parseFloat(l.borderStartEndRadius), parseFloat(l.borderEndEndRadius)],
        inner: [parseFloat(f.borderStartEndRadius), parseFloat(f.borderEndEndRadius), parseFloat(l.borderStartStartRadius), parseFloat(l.borderEndStartRadius)],
        cls: [first.className, last.className]
      }
    })
    expect(r.fade).toEqual([`opacity:${r.fast}`])
    for (const d of r.d) expect(Math.abs(d), `la fila no se mueve: ${r.d}`).toBeLessThanOrEqual(0.5)
    for (const o of r.outer) expect(o, 'extremos de fuera de píldora').toBeGreaterThanOrEqual(r.h / 2 - 1)
    for (const i of r.inner) expect(i, 'medios sm').toBe(r.sm)
    expect(r.sm).toBeLessThan(r.h / 2 - 1)
    expect(errs).toEqual([])
  })

  test('acuse: la insignia aparece con escala 0,5 → 1, gira en curso y mira al contenido (esquina de dentro, a 45°)', async ({ page }) => {
    const errs = watchConsole(page)
    for (const rtl of [false, true]) {
      await load(page, `n=6${rtl ? '&rtl=1' : ''}`)
      await page.evaluate(() => { window.__b.plan.photo = 'busy' })
      await openAndSettle(page)
      const r = await page.evaluate(async () => {
        const P = window.__pf
        const root = document.getElementById('fab')
        const badge = root.querySelector('.g-fab__badge')
        const item = [...root.querySelectorAll('.g-fab__item')].find((b) => b.textContent.includes('Tomar foto'))
        const anims = (await P.freeze(root, 'data-ack', (v) => v === 'busy', () => item.click())).filter((a) => a.effect.target === badge)
        const ts = anims.map(P.timing).map((t) => `${t.prop}:${t.duration}`).sort()
        P.seek(anims, 0)
        const s0 = getComputedStyle(badge).scale
        anims.forEach((a) => a.finish())
        await new Promise((res) => requestAnimationFrame(res))
        const spin = badge.querySelector('svg').getAnimations().map(P.timing).map((t) => ({ name: t.prop, duration: t.duration, iterations: t.iterations }))
        const f = P.fabMid()
        const c = P.mid(badge)
        const R = document.getElementById('fab-trigger').getBoundingClientRect().width / 2
        return { ts, s0, spin, dx: c.x - f.x, dy: c.y - f.y, R, press: P.ms('--g-duration-press'), fast: P.ms('--g-duration-fast'), spinMs: P.ms('--g-duration-spin') }
      })
      expect(r.ts).toEqual([`opacity:${r.fast}`, `scale:${r.press}`])
      expect(r.s0).toBe('0.5')
      expect(r.spin).toEqual([{ name: 'g-fab-spin', duration: r.spinMs, iterations: Infinity }])
      // bottom-end: la esquina de dentro es arriba y hacia el contenido (izquierda en LTR, derecha en RTL)
      expect(r.dy).toBeLessThan(0)
      expect(rtl ? r.dx > 0 : r.dx < 0).toBe(true)
      expect(Math.abs(Math.abs(r.dx) - Math.abs(r.dy))).toBeLessThan(1)
      expect(Math.abs(Math.hypot(r.dx, r.dy) - r.R), `centro sobre el borde: ${Math.hypot(r.dx, r.dy).toFixed(1)} frente a ${r.R}`).toBeLessThan(1.5)
    }
    expect(errs).toEqual([])
  })

  test('se aparta con translate en press y ease-out hacia su borde, con 24px a la vista y la insignia dentro del visor', async ({ page }) => {
    const errs = watchConsole(page)
    await load(page, 'n=6')
    await page.evaluate(() => { window.__b.plan.photo = 'busy' })
    await openAndSettle(page)
    await page.click('#fab-menu .g-fab__item:has-text("Tomar foto")')
    await page.waitForFunction(() => document.getElementById('fab').dataset.state === 'closed')
    const r = await page.evaluate(async () => {
      const P = window.__pf
      const a = document.createElement('a')
      a.href = '#x'
      a.id = 'under'
      a.textContent = 'Fila bajo el FAB'
      Object.assign(a.style, { position: 'fixed', right: '16px', bottom: '20px', width: '600px', height: '44px', display: 'block' })
      document.body.append(a)
      const root = document.getElementById('fab')
      const anims = (await P.freeze(root, 'class', (v) => /is-tucked/.test(v), () => a.focus())).filter((x) => x.effect.target === root)
      const ts = anims.map(P.timing).map((t) => ({ prop: t.prop, duration: t.duration, easing: P.ease(t.easing) }))
      anims.forEach((x) => x.finish())
      const f = document.getElementById('fab-trigger').getBoundingClientRect()
      const bd = root.querySelector('.g-fab__badge').getBoundingClientRect()
      const vw = document.documentElement.clientWidth
      return { ts, visible: vw - f.left, badge: { l: bd.left, r: bd.right }, vw, press: P.ms('--g-duration-press'), ease: P.ease(getComputedStyle(root).getPropertyValue('--g-ease-out')) }
    })
    expect(r.ts).toEqual([{ prop: 'translate', duration: r.press, easing: r.ease }])
    expect(Math.abs(r.visible - 24)).toBeLessThanOrEqual(0.5)
    expect(r.badge.l).toBeGreaterThanOrEqual(0)
    expect(r.badge.r).toBeLessThanOrEqual(r.vw)
    expect(errs).toEqual([])
  })
})

test.describe('GFab · movimiento reducido: solo fundidos (#299 (3); fab.md §29.3)', () => {
  // Toda animación del subárbol es de opacidad (o de color), sin retardo; ninguna CSSAnimation
  const onlyFades = (list) => {
    for (const t of list) {
      expect(FRAMES.has(t.prop), `${t.prop} en ${t.where}`).toBe(true)
      expect(t.delay, `${t.prop} en ${t.where} sin retardo`).toBe(0)
    }
  }
  const brief = () => `(anims) => anims.map(window.__pf.timing).map((t) => ({ prop: t.prop, delay: t.delay, where: t.el.className || t.el.localName }))`

  test('pila: las píldoras aparecen en su sitio con un fundido; el + no gira; cerrar también funde', async ({ page }) => {
    const errs = watchConsole(page)
    await load(page, 'n=10', { motion: 'reduce' })
    const r = await page.evaluate(async (brief) => {
      const P = window.__pf
      const B = eval(brief)
      const root = document.getElementById('fab')
      const ul = document.getElementById('fab-menu')
      const rest = root.querySelector('.g-fab__glyph--rest')
      let anims = await P.freeze(ul, 'data-state', (v) => v === 'open', () => document.getElementById('fab-trigger').click())
      const opening = B(anims)
      P.seek(anims, 0)
      const lis = P.pills()
      const at0 = lis.map((li) => { const label = P.mid(li.querySelector('.g-fab__label')); return { tr: getComputedStyle(li).translate, clip: getComputedStyle(li).clipPath, d: P.seed(li).d, labelHit: P.hits(li, label.x, label.y) } })
      const rot0 = getComputedStyle(rest).rotate
      anims.forEach((a) => a.finish())
      const final = lis.map((li) => P.seed(li).d)
      await new Promise((res) => setTimeout(res, 200))
      anims = await P.freeze(ul, 'data-state', (v) => v === 'closing', () => document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })))
      const closing = B(anims)
      P.seek(anims, 0)
      const closing0 = lis.map((li) => P.seed(li).d)
      anims.forEach((a) => a.finish())
      return { opening, closing, at0, final, closing0, rot0, glyphRot: [...root.querySelectorAll('.g-fab__glyph')].map((g) => getComputedStyle(g).rotate) }
    }, brief())
    onlyFades(r.opening)
    onlyFades(r.closing)
    expect(r.opening.filter((t) => t.where === 'li').length).toBe(5)
    for (const [i, s] of r.at0.entries()) {
      expect(s.tr).toBe('none')
      expect(s.clip).toBe('none')
      expect(Math.abs(s.d - r.final[i]), 'aparece en su sitio').toBeLessThan(0.5)
      expect(s.labelHit).toBe(true)
      expect(Math.abs(r.closing0[i] - r.final[i]), 'se va sin moverse').toBeLessThan(0.5)
    }
    expect(r.rot0).toBe('none')
    for (const g of r.glyphRot) expect(g).toBe('none')
    expect(errs).toEqual([])
  })

  test('C sin recorte ni relleno de la cola; panel de «Más acciones» sin escala', async ({ page }) => {
    await load(page, 'n=15&main=1', { motion: 'reduce' })
    const c = await page.evaluate(async (brief) => {
      const P = window.__pf
      const ul = document.getElementById('fab-menu')
      const anims = await P.freeze(ul, 'data-state', (v) => v === 'open', () => document.getElementById('fab-trigger').click())
      const list = eval(brief)(anims)
      P.seek(anims, 0)
      const box = ul.getBoundingClientRect()
      const pts = [[0.1, 0.1], [0.5, 0.5], [0.9, 0.1], [0.1, 0.9], [0.9, 0.9]].map(([a, b]) => P.hits(ul, box.left + a * box.width, box.top + b * box.height))
      const out = { list, clip: getComputedStyle(ul).clipPath, bg: P.rgba(getComputedStyle(ul).backgroundColor), surface: P.tok('--g-color-surface'), pts }
      anims.forEach((a) => a.finish())
      return out
    }, brief())
    onlyFades(c.list)
    expect(c.clip).toBe('none')
    expect(c.bg).toEqual(c.surface)
    expect(c.pts).toEqual([true, true, true, true, true])

    await load(page, 'n=15', { motion: 'reduce' })
    await openAndSettle(page)
    const s = await page.evaluate(async (brief) => {
      const P = window.__pf
      const sub = document.getElementById('fab-more')
      const anims = await P.freeze(sub, 'data-state', (v) => v === 'open', () => document.querySelector('#fab-menu .g-fab__item--more').click())
      const list = eval(brief)(anims)
      P.seek(anims, 0)
      const scale = getComputedStyle(sub).scale
      anims.forEach((a) => a.finish())
      return { list, scale }
    }, brief())
    onlyFades(s.list)
    expect(s.scale).toBe('none')
  })

  test('acuse sin escala y con la insignia quieta; se aparta sin moverse; confirmar funde', async ({ page }) => {
    const errs = watchConsole(page)
    await load(page, 'n=3', { motion: 'reduce' })
    await page.evaluate(() => { window.__b.plan.photo = 'busy' })
    // Confirmar: el par aparece con un fundido (igual que con movimiento)
    await openAndSettle(page)
    const fade = await page.evaluate(async () => {
      const ul = document.getElementById('fab-menu')
      const pair = await new Promise((resolve) => {
        const mo = new MutationObserver(() => { const c = ul.querySelector('.g-fab__confirm'); if (c) { mo.disconnect(); resolve(c) } })
        mo.observe(ul, { childList: true, subtree: true })
        ul.querySelector('.g-fab__item--danger').click()
      })
      const a = pair.getAnimations().map(window.__pf.timing).map((t) => `${t.prop}:${t.duration}`)
      pair.getAnimations().forEach((x) => x.finish())
      return a
    })
    expect(fade).toEqual([`opacity:${await page.evaluate(() => window.__pf.ms('--g-duration-fast'))}`])
    await page.keyboard.press('Escape')
    await page.keyboard.press('Escape')
    await page.waitForFunction(() => document.getElementById('fab').dataset.state === 'closed')
    await openAndSettle(page)
    const r = await page.evaluate(async (brief) => {
      const P = window.__pf
      const root = document.getElementById('fab')
      const badge = root.querySelector('.g-fab__badge')
      const item = [...root.querySelectorAll('.g-fab__item')].find((b) => b.textContent.includes('Tomar foto'))
      const anims = (await P.freeze(root, 'data-ack', (v) => v === 'busy', () => item.click())).filter((a) => a.effect.target === badge || a.effect.target.parentElement === badge)
      const ack = eval(brief)(anims)
      P.seek(anims, 0)
      const s0 = getComputedStyle(badge).scale
      anims.forEach((a) => a.finish())
      await new Promise((res) => setTimeout(res, 300))
      const spin = badge.querySelector('svg').getAnimations().length + ':' + getComputedStyle(badge.querySelector('svg')).animationName
      // Se aparta: aparece en su sitio (sin transición de translate)
      const a = document.createElement('a')
      a.href = '#x'
      Object.assign(a.style, { position: 'fixed', right: '16px', bottom: '20px', width: '600px', height: '44px', display: 'block' })
      a.textContent = 'Fila bajo el FAB'
      document.body.append(a)
      const tuck = (await P.freeze(root, 'class', (v) => /is-tucked/.test(v), () => a.focus())).filter((x) => x.effect.target === root)
      const visible = document.documentElement.clientWidth - document.getElementById('fab-trigger').getBoundingClientRect().left
      return { ack, s0, spin, tuck: tuck.length, visible }
    }, brief())
    onlyFades(r.ack)
    expect(r.s0).toBe('none')
    expect(r.spin).toBe('0:none')
    expect(r.tuck).toBe(0)
    expect(Math.abs(r.visible - 24)).toBeLessThanOrEqual(0.5)
    expect(errs).toEqual([])
  })
})

// En tiempo real (Chromium): la entrada se ve en varios cuadros, no de golpe; los demás motores la miden congelada (arriba)
test('Chromium · en tiempo real la píldora más cercana pasa por cuadros intermedios entre el FAB y su sitio', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'la cuenta de cuadros en tiempo real solo es estable en Chromium; la trayectoria se mide congelada en los tres')
  await load(page, 'n=6')
  const r = await page.evaluate(() => new Promise((resolve) => {
    const P = window.__pf
    const ul = document.getElementById('fab-menu')
    const ds = []
    const t0 = performance.now()
    const tick = () => {
      if (ul.dataset.state === 'open' && ul.children.length) ds.push(P.seed(P.pills()[0]).d)
      if (performance.now() - t0 < 600) requestAnimationFrame(tick)
      else resolve(ds)
    }
    document.getElementById('fab-trigger').click()
    requestAnimationFrame(tick)
  }))
  const end = r.at(-1)
  const mids = new Set(r.filter((d) => d > 1 && d < end - 0.5).map((d) => d.toFixed(1)))
  expect(mids.size, `cuadros intermedios: ${[...mids].join(' ')}`).toBeGreaterThanOrEqual(3)
})
