// Verificación del grupo de tarjetas que filtran (kiwi r01): base (única y múltiple) y conceptos A, B y C,
// en Chromium, Firefox y WebKit. Ejecutar: node design/lab/card-group/r01/verificar.mjs
// (solo puerto 4218; ENGINES=chromium,firefox,webkit; VERBOSE=1). Requiere packages/vue/dist (npm run build). Solo lee.
import { serve, pw } from './serve.mjs'

const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const V = !!process.env.VERBOSE
const R = []
const rec = (eng, part, name, ok, info = '') => { R.push({ eng, part, name, ok: !!ok, info }); if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${part} · ${name}${info ? ' · ' + info : ''}`) }
const { server, base } = await serve()

const H = () => {
  window.__rgb = (c) => { const cv = document.createElement('canvas'); cv.width = cv.height = 1; const x = cv.getContext('2d'); x.fillStyle = '#000'; x.fillStyle = c; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  window.__lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  window.__ratio = (a, b) => { const L1 = __lum(a), L2 = __lum(b); return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05) }
  window.__bg = (el) => { for (let a = el; a; a = a.parentElement) { const c = __rgb(getComputedStyle(a).backgroundColor); if (c[3] > 0.95) return c } return __rgb(getComputedStyle(document.body).backgroundColor) }
  window.__contrast = (el) => __ratio(__rgb(getComputedStyle(el).color), __bg(el))
}
async function open(b, q = '', opts = {}) {
  const { vw = 1200, vh = 900, ...ctx } = opts
  const context = await b.newContext({ viewport: { width: vw, height: vh }, ...ctx })
  const p = await context.newPage()
  const errs = []
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()) })
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(base + '/index.html' + q)
  await p.waitForFunction(() => window.__ready)
  await p.evaluate(H)
  await p.evaluate(() => document.fonts.ready)
  p.__errs = errs
  return p
}
const BTN = { 'g-base': '#g-base .g-card__primary', 'g-multi': '#g-multi .g-card__primary', 'g-A': '#g-A .g-card__primary', 'g-B': '#g-B .g-card__primary', 'g-C': '#g-C .lab-c__fig' }
const TBL = { 'g-base': 't-base', 'g-multi': 't-multi', 'g-A': 't-A', 'g-B': 't-B', 'g-C': 't-C' }
const pressed = (p, g) => p.evaluate((s) => [...document.querySelectorAll(s)].map((b) => b.getAttribute('aria-pressed')), BTN[g])
const rows = (p, g) => p.evaluate((t) => [...document.querySelectorAll(`#${t} tbody tr`)].filter((r) => !r.querySelector('.g-empty')).length, TBL[g])
// Región de la propia tabla (hoy calla con un cambio externo de filters: hallazgo L3) y la emulación del laboratorio
const tableLive = (p, g) => p.evaluate((t) => document.querySelector(`#${t} .g-table__sr[aria-live]`)?.textContent || '', TBL[g])
const live = async (p, g, want) => {
  try { await p.waitForFunction(([t, w]) => (document.getElementById(`${t}-lab-live`)?.textContent || '').includes(w), [TBL[g], want], { timeout: 1500 }) } catch {}
  return p.evaluate((t) => document.getElementById(`${t}-lab-live`)?.textContent || '', TBL[g])
}
const chips = (p, g) => p.evaluate((t) => document.querySelectorAll(`#${t} .g-filter-bar__chip`).length, TBL[g])
const click = (p, g, i) => p.locator(BTN[g]).nth(i).click()
const rect = (p, sel, i = 0) => p.evaluate(([s, k]) => { const r = document.querySelectorAll(s)[k].getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, b: r.bottom, r: r.right } }, [sel, i])
// Caja relativa al documento (un clic puede desplazar la página para traer el control a la vista)
const docRect = (p, sel, i = 0) => p.evaluate(([s, k]) => { const r = document.querySelectorAll(s)[k].getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height } }, [sel, i])
const activeIdx = (p, g) => p.evaluate((s) => [...document.querySelectorAll(s)].indexOf(document.activeElement), BTN[g])
// Pone el foco justo antes del grupo (un centinela temporal) para entrar con Tab como lo haría la persona
const tabInto = async (p, g) => {
  await p.evaluate((id) => { let s = document.getElementById('lab-sentinel'); if (!s) { s = document.createElement('button'); s.id = 'lab-sentinel'; s.textContent = 'antes' } document.getElementById(id).before(s); s.focus() }, g)
  await p.keyboard.press('Tab')
}

async function run(eng) {
  const b = await pw[eng].launch()
  const ck = (part) => (n, ok, i) => rec(eng, part, n, ok, i)

  // ================= Semántica, filtro y sincronía (base, A, B, C) =================
  {
    const p = await open(b)
    for (const g of ['g-base', 'g-A', 'g-B', 'g-C']) {
      const c = ck(g)
      const sem = await p.evaluate(([s, t]) => {
        const bs = [...document.querySelectorAll(s)]
        const tb = bs[0].closest('[role="toolbar"]')
        return {
          toolbar: !!tb, name: tb?.getAttribute('aria-label') || '', n: bs.length,
          zero: bs.filter((x) => x.tabIndex === 0).length,
          ctrl: bs.every((x) => x.getAttribute('aria-controls') === t) && !!document.getElementById(t),
          buttons: bs.every((x) => x.tagName === 'BUTTON' && x.type === 'button'),
          desc: bs.map((x) => (x.getAttribute('aria-describedby') || '').split(' ').filter(Boolean).map((id) => document.getElementById(id)?.textContent || '').join(' ')),
          names: bs.map((x) => x.textContent.replace(/\s+/g, ' ').trim())
        }
      }, [BTN[g], TBL[g]])
      c('raíz role="toolbar" con nombre', sem.toolbar && sem.name === 'Filtrar facturas por estado', sem.name)
      c('cuatro <button type="button">', sem.n === 4 && sem.buttons)
      c('una sola parada (tabindex 0)', sem.zero === 1, `${sem.zero}`)
      c('aria-controls → la tabla', sem.ctrl)
      c('todas aria-pressed="false" al montar', (await pressed(p, g)).every((x) => x === 'false'))
      if (g === 'g-C') c('nombre = cifra + palabra', sem.names[1] === '4 vencidas', sem.names[1])
      else c('la cifra está en la descripción del botón', /4/.test(sem.desc[1]) && /Facturas/.test(sem.desc[1]), sem.desc[1].slice(0, 60))

      const before = await rect(p, BTN[g], 1)
      const cardSel = g === 'g-C' ? BTN[g] : `#${g} .g-card`
      const cardsBefore = await Promise.all([0, 1, 2, 3].map((i) => docRect(p, cardSel, i)))
      await click(p, g, 1)
      c('pulsar: solo esa aria-pressed="true"', JSON.stringify(await pressed(p, g)) === JSON.stringify(['false', 'true', 'false', 'false']))
      c('la tabla se filtra (4 filas)', (await rows(p, g)) === 4, `${await rows(p, g)}`)
      c('se anuncia el recuento («4 facturas», emulación de L3)', (await live(p, g, '4 facturas')).includes('4 facturas'))
      c('L3 confirmado: la región de GTable calla ante el cambio externo', !(await tableLive(p, g)).includes('4 facturas'), await tableLive(p, g))
      c('el chip aparece en la barra de la tabla', (await chips(p, g)) === 1)
      const cardsAfter = await Promise.all([0, 1, 2, 3].map((i) => docRect(p, cardSel, i)))
      const moved = Math.max(...cardsAfter.map((r, i) => Math.max(Math.abs(r.x - cardsBefore[i].x), Math.abs(r.y - cardsBefore[i].y), Math.abs(r.w - cardsBefore[i].w), Math.abs(r.h - cardsBefore[i].h))))
      c('pulsar no mueve ninguna tarjeta ni cifra (Δ caja)', moved < 0.5, `${moved.toFixed(2)}px`)
      await click(p, g, 1)
      c('volver a pulsar suelta (ninguna pulsada)', (await pressed(p, g)).every((x) => x === 'false'))
      c('… y la tabla vuelve a 24', (await rows(p, g)) === 24 && (await chips(p, g)) === 0)
      await click(p, g, 1)
      await click(p, g, 2)
      c('exclusiva: pulsar otra suelta la anterior', JSON.stringify(await pressed(p, g)) === JSON.stringify(['false', 'false', 'true', 'false']))
      c('… y la tabla enseña las 10 pagadas', (await rows(p, g)) === 10)
      await p.locator(`#${TBL[g]} .g-filter-bar__remove`).first().click()
      c('quitar el chip en la barra suelta la tarjeta (una sola verdad)', (await pressed(p, g)).every((x) => x === 'false'))
      c('… y la tabla vuelve a 24', (await rows(p, g)) === 24)
      void before
    }
    // ---- A: el puente ----
    {
      const c = ck('A')
      await click(p, 'g-A', 1)
      await p.waitForTimeout(450)
      const g = await p.evaluate(() => {
        const br = document.querySelector('#g-A .lab-a__bridge'), card = document.querySelectorAll('#g-A .g-card')[1], pan = document.querySelector('#g-A .lab-cg__panel')
        if (!br) return null
        const a = br.getBoundingClientRect(), k = card.getBoundingClientRect(), q = pan.getBoundingClientRect()
        return { dx: Math.abs(a.left - k.left), dw: Math.abs(a.width - k.width), top: a.top - k.bottom, over: a.bottom - q.top, edge: parseFloat(getComputedStyle(pan).borderTopWidth), hidden: br.getAttribute('aria-hidden'), panCol: getComputedStyle(pan).borderTopColor, mark: getComputedStyle(br).borderLeftColor }
      })
      c('pulsar dibuja el puente bajo la tarjeta (x y ancho Δ0)', g && g.dx < 0.5 && g.dw < 0.5, g && `${g.dx.toFixed(2)} · ${g.dw.toFixed(2)}`)
      c('el puente nace en el borde inferior de la tarjeta', g && Math.abs(g.top) < 0.5, g && g.top.toFixed(2))
      c('el puente cubre el borde superior de la tabla (se unen)', g && g.over >= g.edge - 0.5 && g.over <= g.edge + 0.5, g && `${g.over.toFixed(2)} / ${g.edge}`)
      c('el marco de la tabla toma el color de la marca', g && g.panCol === g.mark, g && g.panCol)
      c('el puente es decorativo (aria-hidden)', g && g.hidden === 'true')
      await click(p, 'g-A', 3)
      await p.waitForTimeout(450)
      const g2 = await p.evaluate(() => { const br = document.querySelectorAll('#g-A .lab-a__bridge'); const k = document.querySelectorAll('#g-A .g-card')[3].getBoundingClientRect(); return { n: br.length, dx: br[0] ? Math.abs(br[0].getBoundingClientRect().left - k.left) : 99 } })
      c('cambiar de tarjeta: un solo puente que llega a la nueva', g2.n === 1 && g2.dx < 0.5, `${g2.n} · ${g2.dx.toFixed(2)}`)
      await click(p, 'g-A', 3)
      c('soltar retira el puente y el marco vuelve al neutro', await p.evaluate(() => !document.querySelector('#g-A .lab-a__bridge') && !document.querySelector('#g-A .lab-cg__panel.is-filtered')))
    }
    // ---- B: el complemento y la proporción ----
    {
      const c = ck('B')
      const w = await Promise.all([0, 1, 2, 3].map((i) => rect(p, '#g-B .g-card', i)))
      c('el ancho dice la parte (Pagadas 10 > Pendientes 8 > Vencidas 4)', w[2].w > w[0].w && w[0].w > w[1].w, w.map((x) => x.w.toFixed(0)).join(' · '))
      await click(p, 'g-B', 1)
      const s = await p.evaluate(() => ({
        out: [...document.querySelectorAll('#g-B .g-card')].map((k) => k.classList.contains('is-out')),
        sum: document.querySelector('#g-B .lab-b__sum').textContent,
        cr: Math.min(...[...document.querySelectorAll('#g-B .g-card.is-out :is(.g-metric__value, .g-card__title, .lab-cg__share)')].map(__contrast)),
        dash: getComputedStyle(document.querySelector('#g-B .g-card.is-out'), '::after').borderTopStyle
      }))
      c('las demás quedan fuera (is-out) y la elegida no', JSON.stringify(s.out) === JSON.stringify([true, false, true, true]))
      c('fuera = contorno discontinuo (forma, no solo color)', s.dash === 'dashed', s.dash)
      c('la línea dice «4 de 24 facturas»', /4\s*de 24 facturas/.test(s.sum), s.sum)
      c('lo de fuera sigue legible (≥ 4.5:1)', s.cr >= 4.5, s.cr.toFixed(2))
      await click(p, 'g-B', 1)
    }
    // ---- C: la cola cambia, las cifras no ----
    {
      const c = ck('C')
      await click(p, 'g-C', 1)
      await p.waitForTimeout(300) // el color se funde en --g-duration-fast: medir al final
      const s = await p.evaluate(() => ({
        tail: document.querySelector('#g-C .lab-c__tail').textContent,
        on: __contrast(document.querySelector('#g-C .lab-c__fig.is-on')),
        out: Math.min(...[...document.querySelectorAll('#g-C .lab-c__fig.is-out')].map(__contrast)),
        deco: getComputedStyle(document.querySelector('#g-C .lab-c__fig.is-on')).textDecorationStyle,
        decoOut: getComputedStyle(document.querySelector('#g-C .lab-c__fig.is-out')).textDecorationStyle
      }))
      c('la cola dice «Se ven solo las 4 vencidas.»', s.tail === 'Se ven solo las 4 vencidas.', s.tail)
      c('pulsada: subrayado continuo; las demás de puntos (forma)', s.deco === 'solid' && s.decoOut === 'dotted', `${s.deco}/${s.decoOut}`)
      c('contraste de la pulsada y de las atenuadas ≥ 4.5:1', s.on >= 4.5 && s.out >= 4.5, `${s.on.toFixed(2)} · ${s.out.toFixed(2)}`)
      await click(p, 'g-C', 1)
    }
    ck('página')('sin errores ni avisos en consola', p.__errs.length === 0, p.__errs.slice(0, 3).join(' | '))
    await p.context().close()
  }

  // ================= Teclado =================
  {
    const p = await open(b)
    for (const g of ['g-base', 'g-A', 'g-C']) {
      const c = ck(g + ' teclado')
      await tabInto(p, g)
      c('Tab entra en la primera (sin pulsada)', (await activeIdx(p, g)) === 0)
      await p.keyboard.press('ArrowRight')
      c('→ mueve el foco a la siguiente', (await activeIdx(p, g)) === 1)
      c('… sin filtrar (las flechas no eligen)', (await pressed(p, g)).every((x) => x === 'false') && (await rows(p, g)) === 24)
      const fv = await p.evaluate(([s, isCard]) => {
        const a = document.activeElement
        const ring = isCard ? getComputedStyle(a.closest('.g-card'), '::after').outlineStyle : getComputedStyle(a).outlineStyle
        return { fv: a.matches(':focus-visible'), ring }
      }, [BTN[g], g !== 'g-C'])
      c('foco visible tras la flecha (:focus-visible y anillo)', fv.fv && fv.ring === 'solid', JSON.stringify(fv))
      await p.keyboard.press('Space')
      c('Espacio filtra por la enfocada', (await pressed(p, g))[1] === 'true' && (await rows(p, g)) === 4)
      await p.keyboard.press('End')
      c('Fin → la última', (await activeIdx(p, g)) === 3)
      await p.keyboard.press('Home')
      c('Inicio → la primera', (await activeIdx(p, g)) === 0)
      await p.keyboard.press('ArrowLeft')
      c('← en la primera no da la vuelta', (await activeIdx(p, g)) === 0)
      await tabInto(p, g)
      c('al volver con Tab, entra en la pulsada', (await activeIdx(p, g)) === 1)
      c('… y sigue habiendo una sola parada', await p.evaluate((s) => [...document.querySelectorAll(s)].filter((x) => x.tabIndex === 0).length === 1, BTN[g]))
      await p.keyboard.press('Enter')
      c('Intro suelta la pulsada', (await pressed(p, g)).every((x) => x === 'false') && (await rows(p, g)) === 24)
      await p.keyboard.press('Tab')
      c('Tab sale del grupo (no recorre las tarjetas)', (await activeIdx(p, g)) === -1)
    }
    await p.context().close()
  }

  // ================= RTL =================
  {
    const p = await open(b, '?dir=rtl')
    const c = ck('RTL')
    await tabInto(p, 'g-base')
    await p.keyboard.press('ArrowLeft')
    c('← avanza en RTL (espejo)', (await activeIdx(p, 'g-base')) === 1)
    await p.keyboard.press('ArrowRight')
    c('→ retrocede en RTL', (await activeIdx(p, 'g-base')) === 0)
    await click(p, 'g-A', 1)
    await p.waitForTimeout(450)
    const dx = await p.evaluate(() => { const br = document.querySelector('#g-A .lab-a__bridge'); const k = document.querySelectorAll('#g-A .g-card')[1]; return br ? Math.abs(br.getBoundingClientRect().left - k.getBoundingClientRect().left) : 99 })
    c('A: el puente sigue a la tarjeta en RTL', dx < 0.5, dx.toFixed(2))
    await p.context().close()
  }

  // ================= Múltiple =================
  {
    const p = await open(b)
    const c = ck('múltiple')
    await click(p, 'g-multi', 0)
    await click(p, 'g-multi', 1)
    c('dos pulsadas a la vez', JSON.stringify(await pressed(p, 'g-multi')) === JSON.stringify(['true', 'true', 'false', 'false']))
    c('la tabla une las dos (O): 8 + 4 = 12', (await rows(p, 'g-multi')) === 12)
    const f = await p.evaluate(() => JSON.stringify(window.__lab.multi.filters))
    c('un solo filtro { op: "in", value: [2] }', f === '[{"key":"estado","op":"in","value":["pendiente","vencida"]}]', f)
    await click(p, 'g-multi', 0)
    c('soltar una deja la otra', JSON.stringify(await pressed(p, 'g-multi')) === JSON.stringify(['false', 'true', 'false', 'false']) && (await rows(p, 'g-multi')) === 4)
    await p.context().close()
  }

  // ================= Móvil (375px) =================
  {
    const touch = eng !== 'firefox'
    const p = await open(b, '', { vw: 375, vh: 800, ...(touch ? { hasTouch: true, isMobile: true } : {}) })
    const c = ck('móvil 375')
    c('sin desplazamiento horizontal de la página', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 0.5))
    const r0 = await rect(p, '#g-base .g-card', 0), r1 = await rect(p, '#g-base .g-card', 1)
    c('base: rejilla de dos columnas', Math.abs(r0.y - r1.y) < 0.5 && r1.x > r0.x, `${r0.w.toFixed(0)}px`)
    const a = await p.evaluate(() => { const s = document.querySelector('#g-A .lab-cg__strip'); const k = [...s.querySelectorAll('.g-card')].map((x) => x.getBoundingClientRect().top); return { scroll: s.scrollWidth > s.clientWidth, row: Math.max(...k) - Math.min(...k) } })
    c('A: una sola fila que se desplaza', a.scroll && a.row < 0.5, JSON.stringify(a))
    await tabInto(p, 'g-A')
    c('A: Tab entra en una tarjeta, no en la tira que se desplaza', (await activeIdx(p, 'g-A')) === 0)
    await p.keyboard.press('End')
    await p.waitForTimeout(400)
    const vis = await p.evaluate(() => {
      const s = document.querySelector('#g-A .lab-cg__strip').getBoundingClientRect(); const k = document.activeElement.closest('.g-card')?.getBoundingClientRect()
      if (!k) return 'sin foco'
      return k.left >= s.left - 0.5 && k.right <= s.right + 0.5 ? true : `${k.left.toFixed(1)}–${k.right.toFixed(1)} en ${s.left.toFixed(1)}–${s.right.toFixed(1)}`
    })
    c('A: Fin trae la última tarjeta a la vista', vis === true, String(vis))
    if (touch) {
      const t = await p.evaluate(() => Math.min(...[...document.querySelectorAll('#g-C .lab-c__fig')].map((x) => x.getBoundingClientRect().height)))
      c('C: cifras ≥ 44px de alto con puntero grueso', t >= 44, t.toFixed(1))
      await p.locator(BTN['g-A']).nth(0).tap()
      c('A: tocar filtra', (await rows(p, 'g-A')) === 8)
    }
    await p.context().close()
  }

  // ================= Oscuro y movimiento reducido =================
  {
    const p = await open(b, '?theme=dark', { reducedMotion: 'reduce' })
    const c = ck('oscuro + reduce')
    await click(p, 'g-C', 1)
    await p.waitForTimeout(300)
    const cr = await p.evaluate(() => ({ on: __contrast(document.querySelector('#g-C .lab-c__fig.is-on')), out: Math.min(...[...document.querySelectorAll('#g-C .lab-c__fig.is-out')].map(__contrast)) }))
    c('C en oscuro: contraste ≥ 4.5:1', cr.on >= 4.5 && cr.out >= 4.5, `${cr.on.toFixed(2)} · ${cr.out.toFixed(2)}`)
    await click(p, 'g-B', 1)
    await p.waitForTimeout(300)
    const bo = await p.evaluate(() => Math.min(...[...document.querySelectorAll('#g-B .g-card.is-out :is(.g-metric__value, .g-card__title)')].map(__contrast)))
    c('B en oscuro: lo de fuera ≥ 4.5:1', bo >= 4.5, bo.toFixed(2))
    await click(p, 'g-A', 1)
    const tr = await p.evaluate(() => getComputedStyle(document.querySelector('#g-A .lab-a__bridge')).transitionProperty)
    c('A con reduce: el puente solo se funde (sin transform ni viaje)', !/transform|left|width/.test(tr), tr)
    c('sin errores ni avisos en consola', p.__errs.length === 0, p.__errs.slice(0, 3).join(' | '))
    await p.context().close()
  }
  await b.close()
}

for (const e of ENGINES) await run(e)
server.close()
const by = {}
for (const r of R) { by[r.eng] ??= [0, 0]; by[r.eng][r.ok ? 0 : 1]++ }
const ok = R.filter((r) => r.ok).length
console.log(`\n${ok}/${R.length} ` + Object.entries(by).map(([e, [a, f]]) => `${e} ${a}/${a + f}`).join(' · '))
process.exit(ok === R.length ? 0 : 1)
