// Verificación del prototipo del acordeón (kiwi, r01): base y conceptos A, B y C en Chromium, Firefox y WebKit.
// Ejecutar: node design/lab/accordion/r01/verificar.mjs   (solo puerto 4214; ENGINES=chromium,firefox,webkit; PARTS=base,A,B,C; VERBOSE=1)
// Requiere packages/vue/dist (npm run build). Solo lee; no toca packages/.
import { serve, pw } from './serve.mjs'

const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const PARTS = (process.env.PARTS || 'base,A,B,C').split(',')
const V = !!process.env.VERBOSE
const R = [], NOTES = []
const rec = (eng, part, name, ok, info = '') => { R.push({ eng, part, name, ok: !!ok, info }); if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${part} · ${name}${info ? ' · ' + info : ''}`) }
const note = (eng, s) => { NOTES.push(`${eng}: ${s}`) }

const { server, base } = await serve()

const H = () => {
  window.__rgb = (c) => { const cv = document.createElement('canvas'); cv.width = cv.height = 1; const x = cv.getContext('2d'); x.fillStyle = '#000'; x.fillStyle = c; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  window.__lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  window.__ratio = (a, b) => { const L1 = __lum(a), L2 = __lum(b); return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05) }
  window.__bg = (el) => { for (let a = el; a; a = a.parentElement) { const c = __rgb(getComputedStyle(a).backgroundColor); if (c[3] > 0.95) return c } return [255, 255, 255] }
  window.__contrast = (el) => __ratio(__rgb(getComputedStyle(el).color), __bg(el))
  // Muestreo por cuadro del borde superior de un elemento: máximo |Δ| respecto del inicio
  window.__sample = (sel, ms) => {
    const el = document.querySelector(sel); const y0 = el.getBoundingClientRect().top; const s = { y0, max: 0, done: false, frames: 0 }
    const end = performance.now() + ms
    // se mide DESPUÉS de los rAF del cuadro (los del componente incluidos), justo antes de que se pinte el siguiente
    const measure = () => { const d = Math.abs(el.getBoundingClientRect().top - y0); s.max = Math.max(s.max, d); s.frames++; if (performance.now() < end) requestAnimationFrame(() => setTimeout(measure, 0)); else s.done = true }
    requestAnimationFrame(() => setTimeout(measure, 0)); window.__s = s
  }
}

async function open(b, query, opts = {}) {
  const { vw = 1100, vh = 900, hash = '', ...ctx } = opts
  const context = await b.newContext({ viewport: { width: vw, height: vh }, ...ctx })
  const p = await context.newPage()
  const errs = []
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()) })
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(base + '/index.html?' + query + hash)
  await p.waitForFunction(() => window.__ready && document.querySelector('.x-acc__item.is-ready'))
  await p.evaluate(H)
  await p.waitForTimeout(250)
  p.__errs = errs
  return p
}
const attr = (p, sel, a) => p.evaluate(([s, x]) => document.querySelector(s)?.getAttribute(x) ?? null, [sel, a])
const exp = (p, id) => attr(p, `#${id}-btn`, 'aria-expanded')
const settle = (p, ms = 450) => p.waitForTimeout(ms)
const active = (p) => p.evaluate(() => document.activeElement && (document.activeElement.id || document.activeElement.className))

async function base_(eng, b) {
  const P = 'base'
  let p = await open(b, 'c=base')
  // 1 · estructura APG
  const s = await p.evaluate(() => {
    const it = document.querySelector('#faq-cambiar'); const btn = it.querySelector('.x-acc__trigger'); const c = it.querySelector('.x-acc__content')
    return { h: btn.parentElement.tagName, type: btn.type, exp: btn.getAttribute('aria-expanded'), ctl: btn.getAttribute('aria-controls'), cid: c.id, role: c.getAttribute('role'), lab: c.getAttribute('aria-labelledby'), bid: btn.id, hidden: c.getAttribute('hidden'), openHidden: document.querySelector('#faq-resultados-content').getAttribute('hidden'), icon: it.querySelector('.x-acc__icon').getAttribute('aria-hidden'), h0: c.offsetHeight }
  })
  rec(eng, P, 'h3 > button[type=button]', s.h === 'H3' && s.type === 'button')
  rec(eng, P, 'aria-expanded + aria-controls → contenido', s.exp === 'false' && s.ctl === s.cid)
  rec(eng, P, 'contenido role=region con aria-labelledby → botón (4 elementos)', s.role === 'region' && s.lab === s.bid)
  rec(eng, P, 'plegado y asentado: hidden="until-found", alto 0', s.hidden === 'until-found' && s.h0 === 0, `hidden=${s.hidden} h=${s.h0}`)
  rec(eng, P, 'abierto: sin hidden', s.openHidden === null)
  rec(eng, P, 'icono decorativo', s.icon === 'true')
  // 2 · abrir/cerrar, modelo en orden del documento, inert solo durante el cierre
  await p.click('#faq-cambiar-btn')
  rec(eng, P, 'clic abre', (await exp(p, 'faq-cambiar')) === 'true')
  rec(eng, P, 'v-model en orden del documento', (await p.textContent('#out-faq')).includes('["cambiar","resultados"]'), await p.textContent('#out-faq'))
  await settle(p)
  await p.click('#faq-cambiar-btn')
  const mid = await p.evaluate(() => ({ inert: document.querySelector('#faq-cambiar .x-acc__panel').hasAttribute('inert'), hidden: document.querySelector('#faq-cambiar-content').getAttribute('hidden') }))
  rec(eng, P, 'cerrando: panel inert y aún sin hidden (se anima)', mid.inert && mid.hidden === null, JSON.stringify(mid))
  await settle(p)
  const end = await p.evaluate(() => ({ inert: document.querySelector('#faq-cambiar .x-acc__panel').hasAttribute('inert'), hidden: document.querySelector('#faq-cambiar-content').getAttribute('hidden') }))
  rec(eng, P, 'asentado: hidden="until-found" y sin inert', !end.inert && end.hidden === 'until-found', JSON.stringify(end))
  // (WebKit no enfoca un botón al hacer clic, #307: el foco se queda en body; lo que se comprueba es que no entra al panel)
  const fa = await p.evaluate(() => ({ id: document.activeElement.id, tag: document.activeElement.tagName, inside: !!document.activeElement.closest('.x-acc__content') }))
  rec(eng, P, 'abrir no mueve el foco (botón; body en WebKit)', !fa.inside && (fa.id === 'faq-cambiar-btn' || (eng === 'webkit' && fa.tag === 'BODY')), JSON.stringify(fa))
  // 3 · flechas
  await p.focus('#faq-cambiar-btn')
  await p.keyboard.press('ArrowDown'); const a1 = await active(p)
  await p.keyboard.press('End'); const a2 = await active(p)
  await p.keyboard.press('ArrowDown'); const a3 = await active(p)
  await p.keyboard.press('Home'); const a4 = await active(p)
  await p.keyboard.press('ArrowUp'); const a5 = await active(p)
  rec(eng, P, '↓ siguiente, Fin último, sin vuelta, Inicio primero', a1 === 'faq-documentos-btn' && a2 === 'faq-pago-btn' && a3 === 'faq-pago-btn' && a4 === 'faq-cambiar-btn' && a5 === 'faq-cambiar-btn', [a1, a2, a3, a4, a5].join(' '))
  // 4 · Tab salta el contenido plegado (until-found no es enfocable) y entra en el abierto
  await p.focus('#misc-campo-btn'); await p.keyboard.press('Tab')
  const t1 = await active(p)
  rec(eng, P, 'Tab salta el contenido plegado', t1 !== 'campo-ciudad', t1)
  // 5 · deshabilitado: aria-disabled, enfocable, no abre, las flechas lo alcanzan
  await p.focus('#misc-mapa-btn'); await p.keyboard.press('ArrowDown')
  const d = await p.evaluate(() => ({ a: document.activeElement.id, ad: document.activeElement.getAttribute('aria-disabled'), dis: document.activeElement.disabled }))
  await p.click('#misc-off-btn', { force: true })
  rec(eng, P, 'deshabilitado: aria-disabled, enfocable con flechas, no abre', d.a === 'misc-off-btn' && d.ad === 'true' && !d.dis && (await exp(p, 'misc-off')) === 'false', JSON.stringify(d))
  // 6 · carga diferida: se monta al abrir y no se desmonta al cerrar
  const m0 = await p.evaluate(() => window.__acc.mounts['misc-mapa'] || 0)
  await p.click('#misc-mapa-btn'); await settle(p); await p.click('#misc-mapa-btn'); await settle(p); await p.click('#misc-mapa-btn'); await settle(p)
  const m1 = await p.evaluate(() => window.__acc.mounts['misc-mapa'] || 0)
  rec(eng, P, 'lazy: 0 montajes antes, 1 tras abrir-cerrar-abrir', m0 === 0 && m1 === 1, `${m0} → ${m1}`)
  // 7 · OPEN_REQUEST abre en el acto y el control recibe el foco
  await p.click('#btn-goto'); await p.waitForTimeout(120)
  const o = await p.evaluate(() => ({ exp: document.querySelector('#misc-campo-btn').getAttribute('aria-expanded'), a: document.activeElement.id, inst: window.__acc.log.filter((x) => x.id === 'misc-campo' && x.request).pop()?.instant }))
  rec(eng, P, 'OPEN_REQUEST: abre sin animar y el campo recibe el foco', o.exp === 'true' && o.a === 'campo-ciudad' && o.inst === true, JSON.stringify(o))
  // 8 · plegar por programa con el foco dentro → foco al botón (nunca a body)
  await p.evaluate(() => document.querySelector('#misc-campo-btn').click())
  await p.waitForTimeout(60)
  rec(eng, P, 'plegar con el foco dentro → foco al botón', (await active(p)) === 'misc-campo-btn', await active(p))
  // 9 · suelto (v-model:open), sin grupo
  await p.click('#solo-btn')
  rec(eng, P, 'elemento suelto con v-model:open', (await p.textContent('#out-misc')).includes('suelto: true'))
  // 10 · regla de region
  const rg = await p.evaluate(() => ({ many: document.querySelector('#many-cambiar-content').getAttribute('role'), mex: document.querySelector('#mex-cambiar-content').getAttribute('role') }))
  rec(eng, P, 'region: no con 8 que pueden abrirse a la vez; sí con exclusive', rg.many === null && rg.mex === 'region', JSON.stringify(rg))
  // 11 · exclusive y Δ0 del encabezado tocado (compensado, sin compensar, y con el anclaje del navegador)
  async function excl(mode) {
    await p.evaluate((m) => {
      const cb = document.querySelector('#ctl-compensate'); if (cb.checked !== (m === 'on')) cb.click()
      document.querySelector('#g-excl').style.overflowAnchor = m === 'anchor' ? 'auto' : ''
    }, mode)
    await p.waitForTimeout(50)
    if ((await exp(p, 'ex-resultados')) !== 'true') { await p.click('#ex-resultados-btn'); await settle(p, 600) }
    await p.evaluate(() => { const r = document.querySelector('#ex-pago-btn').getBoundingClientRect(); window.scrollBy(0, r.top - 520) })
    await p.waitForTimeout(80)
    await p.evaluate(() => __sample('#ex-pago-btn', 700))
    await p.click('#ex-pago-btn', { noWaitAfter: true })
    await p.waitForFunction(() => window.__s.done)
    const r = await p.evaluate(() => ({ max: Math.round(window.__s.max * 10) / 10, frames: window.__s.frames }))
    const e = { res: await exp(p, 'ex-resultados'), pago: await exp(p, 'ex-pago'), model: await p.textContent('#out-excl') }
    // volver a dejar abierto «Resultados» para la siguiente medida
    await p.click('#ex-resultados-btn'); await settle(p, 600)
    return { ...r, ...e }
  }
  const on = await excl('on')
  rec(eng, P, 'exclusive: abrir uno cierra el otro; modelo de uno', on.res === 'false' && on.pago === 'true' && on.model.includes('["pago"]'), on.model)
  rec(eng, P, 'Δ0: el encabezado tocado no se mueve (compensado, por cuadro)', on.max <= 1, `máx ${on.max}px en ${on.frames} cuadros`)
  const off = await excl('off')
  const anc = await excl('anchor')
  note(eng, `exclusive sin compensar: el encabezado tocado se mueve ${off.max}px; con overflow-anchor del navegador: ${anc.max}px; con la compensación: ${on.max}px`)
  rec(eng, P, 'sin compensar el salto existe (el problema es real)', off.max > 40, `${off.max}px`)
  // 12 · impresión: todo visible, sin iconos
  await p.emulateMedia({ media: 'print' })
  const pr = await p.evaluate(() => { const cs = [...document.querySelectorAll('.x-acc__content')]; return { closed0: cs.filter((c) => c.offsetHeight === 0).length, n: cs.length, icon: getComputedStyle(document.querySelector('.x-acc__icon')).display } })
  rec(eng, P, 'impresión: todo el contenido con alto y sin iconos', pr.closed0 === 0 && pr.icon === 'none', JSON.stringify(pr))
  await p.emulateMedia({ media: 'screen' })
  // 13 · área, tipo, contraste, foco visible
  const g = await p.evaluate(() => {
    const ts = [...document.querySelectorAll('.x-acc__trigger')]
    const minH = Math.min(...ts.map((t) => t.getBoundingClientRect().height))
    const t = document.querySelector('#faq-cambiar-btn .x-acc__title'), m = document.querySelector('#misc-off-btn .x-acc__meta')
    return { minH, fs: Math.min(parseFloat(getComputedStyle(t).fontSize), parseFloat(getComputedStyle(m).fontSize)), ct: __contrast(t), cm: __contrast(m), cd: __contrast(document.querySelector('#misc-off-btn .x-acc__title')), icon: __ratio(__rgb(getComputedStyle(document.querySelector('#faq-cambiar .x-acc__icon')).color), [255, 255, 255]) }
  })
  rec(eng, P, 'encabezado ≥ 44px de alto', g.minH >= 44, `${g.minH}`)
  rec(eng, P, 'texto ≥ 12px', g.fs >= 12, `${g.fs}`)
  rec(eng, P, 'contraste título y dato ≥ 4.5', g.ct >= 4.5 && g.cm >= 4.5, `${g.ct.toFixed(2)} / ${g.cm.toFixed(2)}`)
  rec(eng, P, 'contraste del icono ≥ 3', g.icon >= 3, g.icon.toFixed(2))
  note(eng, `título deshabilitado ${g.cd.toFixed(2)}:1 (exento, 1.4.3)`)
  await p.focus('#faq-documentos-btn'); await p.keyboard.press('ArrowUp')
  const fo = await p.evaluate(() => { const cs = getComputedStyle(document.activeElement); return { s: cs.outlineStyle, w: parseFloat(cs.outlineWidth) } })
  rec(eng, P, 'foco visible con teclado', fo.s !== 'none' && fo.w >= 2, JSON.stringify(fo))
  rec(eng, P, 'sin errores en consola', p.__errs.length === 0, p.__errs.slice(0, 3).join(' | '))
  await p.context().close()

  // 14 · #hash del elemento al cargar y al cambiar
  p = await open(b, 'c=base', { hash: '#many-pago' })
  await p.waitForTimeout(200)
  const hh = await p.evaluate(() => ({ exp: document.querySelector('#many-pago-btn').getAttribute('aria-expanded'), top: Math.round(document.querySelector('#many-pago').getBoundingClientRect().top) }))
  rec(eng, P, '#id del elemento al cargar: abre y lo trae arriba', hh.exp === 'true' && hh.top >= -1 && hh.top <= 80, JSON.stringify(hh))
  await p.evaluate(() => { location.hash = 'many-urgencias' }); await p.waitForTimeout(200)
  rec(eng, P, 'hashchange abre el elemento', (await exp(p, 'many-urgencias')) === 'true')
  // 15 · #id de algo de dentro: lo revela el navegador (beforematch) y el elemento se abre
  await p.evaluate(() => { location.hash = 'dato-entrada' }); await p.waitForTimeout(300)
  const dd = await p.evaluate(() => ({ exp: document.querySelector('#hash-estac-btn').getAttribute('aria-expanded'), hid: document.querySelector('#hash-estac-content').getAttribute('hidden') }))
  rec(eng, P, '#id dentro de un plegado: beforematch lo abre', dd.exp === 'true' && dd.hid === null, JSON.stringify(dd))
  await p.context().close()
  // 16 · #:~:text= (lo mismo que hace la búsqueda en la página)
  p = await open(b, 'c=base', { hash: '#:~:text=subterr%C3%A1neo' })
  await p.waitForTimeout(400)
  const tf = await exp(p, 'many-estacionamiento')
  rec(eng, P, '#:~:text= abre el elemento que contiene el texto', tf === 'true', tf)
  await p.context().close()

  // 17 · movimiento reducido: sin transición de altura; abre, cierra y asienta igual
  p = await open(b, 'c=base', { reducedMotion: 'reduce' })
  await p.click('#faq-cambiar-btn')
  const rm = await p.evaluate(() => getComputedStyle(document.querySelector('#faq-cambiar .x-acc__panel')).transitionProperty)
  await p.click('#faq-cambiar-btn'); await p.waitForTimeout(100)
  rec(eng, P, 'reduced motion: sin transición de la rejilla; asienta plegado', !/grid-template-rows/.test(rm) && (await attr(p, '#faq-cambiar-content', 'hidden')) === 'until-found', rm)
  await p.context().close()
  // 18 · RTL: el chevron se espeja; el icono al inicio (derecha)
  p = await open(b, 'c=base&dir=rtl')
  const rt = await p.evaluate(() => { const i = document.querySelector('#faq-cambiar .x-acc__icon').getBoundingClientRect(), t = document.querySelector('#faq-cambiar .x-acc__title').getBoundingClientRect(); return { scale: getComputedStyle(document.querySelector('#faq-cambiar .x-acc__chevron')).scale, iconRight: i.left > t.left } })
  rec(eng, P, 'RTL: chevron espejado y al inicio lógico', /^-1/.test(rt.scale) && rt.iconRight, JSON.stringify(rt))
  await p.context().close()
}

async function A_(eng, b) {
  const P = 'A'
  const p = await open(b, 'c=A')
  const s = await p.evaluate(() => { const pk = document.querySelector('#a-cambiar-peek'); const r = pk.getBoundingClientRect(); return { db: document.querySelector('#a-cambiar-btn').getAttribute('aria-describedby'), h: Math.round(r.height), lh: parseFloat(getComputedStyle(pk).lineHeight), ct: __contrast(pk), top: r.top, left: r.left, fs: parseFloat(getComputedStyle(pk).fontSize) } })
  rec(eng, P, 'avance enlazado por aria-describedby mientras está cerrado', s.db === 'a-cambiar-peek')
  rec(eng, P, 'avance de una línea', s.h <= s.lh + 1, `${s.h} / ${s.lh}`)
  rec(eng, P, 'avance: contraste ≥ 4.5 y ≥ 12px', s.ct >= 4.5 && s.fs >= 12, s.ct.toFixed(2))
  // alto del contenido por cuadro desde el clic: la primera línea tiene que estar entera antes de que el avance se funda
  await p.evaluate(() => { window.__h = []; const c = document.querySelector('#a-cambiar-content'); const t0 = performance.now(); const f = () => { window.__h.push([Math.round(performance.now() - t0), Math.round(c.getBoundingClientRect().height)]); if (window.__h.length < 12) requestAnimationFrame(f) }; requestAnimationFrame(f); document.querySelector('#a-cambiar-btn').click() })
  await settle(p, 500)
  const hs = await p.evaluate(() => window.__h)
  const lh = s.lh, fadeStart = await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('#g-a-faq')).getPropertyValue('--_t-fast')) || 120)
  const firstFull = (hs.find(([, h]) => h >= lh) || [999])[0]
  const early = hs.map(([t, h]) => t + 'ms:' + h).slice(0, 5).join(' ')
  const o = await p.evaluate(() => { const f = document.querySelector('#a-cambiar-content p').getBoundingClientRect(); return { top: f.top, left: f.left, db: document.querySelector('#a-cambiar-btn').getAttribute('aria-describedby'), peekVis: getComputedStyle(document.querySelector('#a-cambiar-peek')).visibility } })
  rec(eng, P, 'continuidad: la primera línea abierta está donde estaba el avance (Δ ≤ 1px)', Math.abs(o.top - s.top) <= 1 && Math.abs(o.left - s.left) <= 1, `Δy ${(o.top - s.top).toFixed(1)} Δx ${(o.left - s.left).toFixed(1)}`)
  rec(eng, P, 'abierto: sin describedby y avance oculto', o.db === null && o.peekVis === 'hidden', JSON.stringify(o))
  note(eng, `A: alto del contenido por cuadro tras el clic: ${early}; primera línea entera a los ${firstFull}ms (el avance empieza a fundirse a los 40ms)`)
  rec(eng, P, 'la primera línea está entera antes de que el avance vaya por la mitad de su fundido (≤ 100ms)', firstFull <= 100, `${firstFull}ms`)
  // ajustes: el avance refleja el estado; acciones fuera del botón
  await p.click('#set-notif-btn'); await settle(p)
  const before = await p.textContent('#set-notif-peek')
  await p.click('#set-notif .g-switch >> nth=0'); await p.waitForTimeout(80)
  const after = await p.textContent('#set-notif-peek')
  rec(eng, P, 'ajustes: el avance sigue al estado', before !== after, `${before} → ${after}`)
  const outside = await p.evaluate(() => { const a = document.querySelector('#set-notif .x-acc__actions button'); return !!a && !a.closest('.x-acc__trigger') })
  rec(eng, P, 'acciones del grupo fuera del botón', outside)
  rec(eng, P, 'sin errores en consola', p.__errs.length === 0, p.__errs.slice(0, 3).join(' | '))
  await p.context().close()
}

async function B_(eng, b) {
  const P = 'B'
  let p = await open(b, 'c=B')
  const n = await p.evaluate(() => { const nd = document.querySelector('#b-cambiar .x-acc__node'); return { ring: __ratio(__rgb(getComputedStyle(nd).borderTopColor), [255, 255, 255]), w: nd.getBoundingClientRect().width } })
  rec(eng, P, 'nudo cerrado: contorno ≥ 3:1 y ≥ 24px', n.ring >= 3 && n.w >= 24, `${n.ring.toFixed(2)} / ${n.w}`)
  await p.click('#b-resultados-btn'); await settle(p, 700)
  const f = await p.evaluate(() => { const fl = document.querySelector('#b-resultados .x-acc__rail-fill'); const nd = document.querySelector('#b-resultados .x-acc__node'); return { scale: getComputedStyle(fl).scale, h: Math.round(fl.getBoundingClientRect().height), c: __ratio(__rgb(getComputedStyle(nd).color), __rgb(getComputedStyle(nd).backgroundColor)) } })
  rec(eng, P, 'tramo abierto: llega a escala 1 y recorre el contenido', (f.scale === '1 1' || f.scale === '1' || f.scale === 'none') && f.h > 60, JSON.stringify(f))
  rec(eng, P, 'nudo abierto: icono sobre la marca ≥ 3:1', f.c >= 3, f.c.toFixed(2))
  // encabezado pegado mientras se lee y cierre que te deja donde estabas
  await p.click('#b-prep-btn'); await settle(p, 700)
  await p.evaluate(() => { const it = document.querySelector('#b-prep'); window.scrollBy(0, it.getBoundingClientRect().top + 900) })
  await p.waitForTimeout(150)
  const st = await p.evaluate(() => ({ h: Math.round(document.querySelector('#b-prep .x-acc__heading').getBoundingClientRect().top), it: Math.round(document.querySelector('#b-prep').getBoundingClientRect().top) }))
  rec(eng, P, 'encabezado pegado arriba mientras se lee', Math.abs(st.h) <= 1 && st.it < -500, JSON.stringify(st))
  await p.evaluate(() => __sample('#b-prep .x-acc__heading', 500))
  await p.click('#b-prep-btn', { noWaitAfter: true })
  await p.waitForFunction(() => window.__s.done)
  const cl = await p.evaluate(() => ({ max: Math.round(window.__s.max * 10) / 10, h: Math.round(document.querySelector('#b-prep .x-acc__heading').getBoundingClientRect().top), next: Math.round(document.querySelector('#b-lugar').getBoundingClientRect().top), inst: window.__acc.log.filter((x) => x.id === 'b-prep' && x.request === false).pop()?.instant }))
  rec(eng, P, 'cerrar desde arriba: el encabezado no se mueve y lo siguiente queda debajo', (await exp(p, 'b-prep')) === 'false' && cl.max <= 1 && cl.next > cl.h && cl.next < 200 && cl.inst === true, JSON.stringify(cl))
  rec(eng, P, 'sin errores en consola', p.__errs.length === 0, p.__errs.slice(0, 3).join(' | '))
  await p.context().close()
  // forced-colors (solo Chromium lo emula): el tramo y el nudo con colores del sistema
  if (eng === 'chromium') {
    p = await open(b, 'c=B', { forcedColors: 'active' })
    await p.click('#b-resultados-btn'); await settle(p, 700)
    const fc = await p.evaluate(() => { const fl = getComputedStyle(document.querySelector('#b-resultados .x-acc__rail-fill')).backgroundColor; const sp = getComputedStyle(document.querySelector('#b-cambiar .x-acc__rail'), '::before').backgroundColor; return { fl, sp } })
    rec(eng, P, 'forced-colors: tramo y eje visibles', fc.fl !== 'rgba(0, 0, 0, 0)' && fc.sp !== 'rgba(0, 0, 0, 0)', JSON.stringify(fc))
    await p.context().close()
  }
}

async function C_(eng, b) {
  const P = 'C'
  let p = await open(b, 'c=C')
  const cols = await p.evaluate(() => new Set([...document.querySelectorAll('#g-c-faq > .x-acc__item')].map((i) => Math.round(i.getBoundingClientRect().left))).size)
  rec(eng, P, 'índice en columnas a 1100px', cols >= 2, `${cols} columnas`)
  const x0 = await p.evaluate(() => Math.round(document.querySelector('#c-acompanante .x-acc__heading').getBoundingClientRect().left))
  await p.evaluate(() => __sample('#c-acompanante-btn', 900))
  await p.click('#c-acompanante-btn', { noWaitAfter: true })
  await p.waitForFunction(() => window.__s.done)
  const r = await p.evaluate(() => {
    const root = document.querySelector('#g-c-faq').getBoundingClientRect(), it = document.querySelector('#c-acompanante').getBoundingClientRect()
    const items = [...document.querySelectorAll('#g-c-faq > .x-acc__item')]
    const geo = items.map((i, k) => { const r = i.getBoundingClientRect(); return { k, t: Math.round(r.top), l: Math.round(r.left) } })
    const sorted = [...geo].sort((a, b) => a.t - b.t || a.l - b.l).map((g) => g.k)
    return { full: Math.abs(it.width - root.width) <= 1, max: Math.round(window.__s.max * 10) / 10, order: sorted.join() === geo.map((g) => g.k).join(), x: Math.round(document.querySelector('#c-acompanante .x-acc__heading').getBoundingClientRect().left) }
  })
  rec(eng, P, 'la abierta ocupa todo el ancho', r.full)
  rec(eng, P, 'la pregunta tocada no cambia de altura (Δy ≤ 1, por cuadro)', r.max <= 1, `máx ${r.max}px`)
  rec(eng, P, 'orden visual = orden del documento (sin dense)', r.order)
  note(eng, `C: la pregunta 05 viaja en horizontal de x=${x0} a x=${r.x}`)
  rec(eng, P, 'sin errores en consola', p.__errs.length === 0, p.__errs.slice(0, 3).join(' | '))
  await p.context().close()
  p = await open(b, 'c=C', { vw: 375 })
  const one = await p.evaluate(() => new Set([...document.querySelectorAll('#g-c-faq > .x-acc__item')].map((i) => Math.round(i.getBoundingClientRect().left))).size)
  rec(eng, P, 'a 375px, una columna', one === 1, `${one}`)
  await p.context().close()
}

async function narrow(eng, b) {
  for (const c of ['base', 'A', 'B', 'C', 'all']) {
    const p = await open(b, 'c=' + c, { vw: 320 })
    await p.evaluate(() => document.querySelectorAll('.x-acc__trigger').forEach((t, i) => { if (i % 2 === 0) t.click() }))
    await p.waitForTimeout(500)
    const o = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    rec(eng, c, '320px sin desplazamiento horizontal', o <= 0, `${o}px`)
    await p.context().close()
  }
}

for (const eng of ENGINES) {
  const b = await pw[eng].launch()
  try {
    if (PARTS.includes('base')) await base_(eng, b)
    if (PARTS.includes('A')) await A_(eng, b)
    if (PARTS.includes('B')) await B_(eng, b)
    if (PARTS.includes('C')) await C_(eng, b)
    await narrow(eng, b)
  } catch (e) { rec(eng, '-', 'excepción', false, String(e).slice(0, 400)) }
  await b.close()
}
server.close()
const ok = R.filter((r) => r.ok).length
console.log('\nNotas medidas:\n' + NOTES.map((n) => '  ' + n).join('\n'))
console.log(`\n${ok}/${R.length} comprobaciones en ${ENGINES.join(', ')}`)
process.exit(ok === R.length ? 0 : 1)
