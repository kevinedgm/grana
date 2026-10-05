// GSummary sobre el COMPONENTE REAL (packages/vue/playground/summary.html: dist/grana.umd.js), en Chromium, Firefox y
// WebKit. Port de la verificación de coco (design/lab/summary/estilo-verificar.mjs, sobre su simulación) y de los puntos
// de navegador del contrato (design/contracts/summary.md «Verificación · Playwright»; DECISIONS.md #349 a #357):
// cesión por prioridad de 120 a 640px (sin desborde, nada cortado a medias, identificador entero, «+N» = data-clipped,
// data-terse antes de soltar, data-tight ⇒ datos fuera, el lector lo recibe todo, alto constante en row lines 2, Δ0 en el
// campo, 1/2/4 de 4 datos a 240/360/520); contraste de B (pesos); carga Δ0 (incluido el paso de carga a datos); bidi con
// texto RTL real; entrada al ensanchar (y nada al montar ni con reduce); móvil 320; rendimiento con 200 y 500 fichas.
// Ejecutar desde design/lab/theme-playground: GRANA_PW_PORT=4210 npx playwright test tests/summary.spec.mjs
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/summary.html'

function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana/.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}
const frames = (page, n = 4) => page.evaluate((n) => new Promise((r) => { const f = (k) => k ? requestAnimationFrame(() => f(k - 1)) : setTimeout(r, 20); f(n) }), n)
// Visor alto: la medida de las fichas a más de un visor de distancia se aplaza (IntersectionObserver, contrato
// «Mecanismo de adaptación»); con 2400px de alto todos los casos del banco quedan cerca y se miden al cargar
async function open(page, qs = '', { reducedMotion = 'reduce', viewport = { width: 1280, height: 2400 } } = {}) {
  await page.emulateMedia({ reducedMotion })
  await page.setViewportSize(viewport)
  await page.goto(PAGE + qs)
  await page.waitForSelector('[data-ready]')
  await page.evaluate(() => document.fonts.ready)
  await frames(page)
}
const setW = async (page, w) => { await page.evaluate((w) => window.__su.setW(w), w); await frames(page) }

// Mide todas las fichas con datos de los casos (igual que la verificación de coco, sobre el componente real)
function probe(minId) {
  const out = []
  document.querySelectorAll('[data-case] .g-summary:not(.is-loading):not(.is-empty)').forEach((su, idx) => {
    const host = su.closest('[data-case]'), c = host.dataset.case
    if (c === 'surfaces' || c === 'loading' || c === 'perf') return
    const r = su.getBoundingClientRect(), it = { c, idx, w: r.width, h: r.height, bad: [] }
    const L = su.classList.contains('g-summary--layout-inline') ? 'inline' : su.classList.contains('g-summary--layout-stack') ? 'stack' : 'row'
    it.layout = L; it.multi = su.classList.contains('g-summary--multi')
    const pb = su.parentElement.getBoundingClientRect()
    if (r.right > pb.right + 0.5 || r.left < pb.left - 0.5) it.bad.push('la ficha sale de su anfitrión')
    const stage = host.closest('.stage') || host
    if (stage.scrollWidth > stage.clientWidth + 1 || host.scrollWidth > host.clientWidth + 1) it.bad.push('el anfitrión se desplaza en horizontal')
    const visIn = (e) => {
      const b = e.getBoundingClientRect(); if (!b.width || !b.height) return false
      for (let a = e.parentElement; a && a !== su.parentElement; a = a.parentElement) {
        const cs = getComputedStyle(a); if (cs.display === 'contents' || (cs.overflowX === 'visible' && cs.overflowY === 'visible')) continue
        const q = a.getBoundingClientRect(); if (b.left < q.left - 1 || b.right > q.right + 1 || b.top < q.top - 1 || b.bottom > q.bottom + 1) return false
      }
      return true
    }
    const hiddenSr = (e) => { for (let a = e; a && a !== su; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.position === 'absolute' && cs.clipPath && cs.clipPath !== 'none') return true } return false }
    const clipped = (e) => !!e.closest('[data-clipped]')
    su.querySelectorAll('.g-summary__lead, .g-summary__code, .g-summary__title, .g-summary__status, .g-summary__fact, .g-summary__more, .g-summary__subtitle, .g-summary__action').forEach((e) => {
      const cs = getComputedStyle(e); if (cs.display === 'none' || e.hidden || hiddenSr(e) || clipped(e)) return
      const b = e.getBoundingClientRect(); if (!b.width) return
      if (e.matches('.g-summary__status') && b.top >= e.parentElement.getBoundingClientRect().bottom - 1) return
      if (b.right > r.right + 1 || b.left < r.left - 1) it.bad.push('cruza el borde: ' + e.className)
      if (e.matches('.g-summary__status')) return
      const ell = cs.textOverflow === 'ellipsis'
      if (!visIn(e) && !ell) it.bad.push((e.matches('.g-summary__fact') ? 'dato cortado a medias: ' : 'cortado sin elipsis: ') + e.className + ' «' + e.textContent.slice(0, 24) + '»')
      if (L === 'stack' && ell && e.scrollWidth > e.clientWidth + 1) it.bad.push('stack con elipsis: ' + e.className)
    })
    if (L === 'stack' && su.querySelector('[data-clipped]')) it.bad.push('stack recorta datos')
    const code = su.querySelector('.g-summary__code'), anc = su.querySelector('.g-summary__fact.is-anchor')
    const idEl = code || anc?.querySelector('.g-summary__fact-value')
    if (idEl && it.w >= minId) {
      const box = code || anc
      const whole = visIn(idEl) && box.scrollWidth <= box.clientWidth + 1 && (() => { const rg = document.createRange(); rg.selectNodeContents(idEl); const t = rg.getBoundingClientRect(), q = box.getBoundingClientRect(); return t.right <= q.right + 0.01 && t.left >= q.left - 0.01 })()
      if (!whole) {
        const rg = document.createRange(); rg.selectNodeContents(idEl); const need = rg.getBoundingClientRect().width
        const room = (code ? code.parentElement : anc.parentElement).getBoundingClientRect().width
        if (!(su.hasAttribute('data-tight') && need > room - 0.5 && box.title)) it.bad.push(`identificador no entero «${idEl.textContent}» (necesita ${need.toFixed(1)}, hay ${room.toFixed(1)})`)
        else it.idEllipsis = true
      }
    }
    const t = su.querySelector('.g-summary__title')
    if (t && t.getBoundingClientRect().width < 20 && it.w >= minId) it.bad.push('título < 20px')
    // El lector lo recibe todo
    su.querySelectorAll('.g-summary__title, .g-summary__fact-label, .g-summary__fact-value, .g-summary__code, .g-summary__status, .g-summary__subtitle').forEach((e) => {
      for (let a = e; a && a !== su.parentElement; a = a.parentElement) {
        const cs = getComputedStyle(a)
        if (cs.display === 'none' || cs.visibility === 'hidden' || a.getAttribute('aria-hidden') === 'true') { it.bad.push('fuera del árbol accesible: ' + e.className); break }
      }
    })
    // «+N» y orden de cesión
    const facts = [...su.querySelectorAll('.g-summary__fact:not(.is-anchor)')], cl = facts.map((f) => f.hasAttribute('data-clipped'))
    const n = cl.filter(Boolean).length, more = su.querySelector('.g-summary__more'), tight = su.hasAttribute('data-tight'), terse = su.hasAttribute('data-terse')
    if (more) {
      const shown = more.hidden || getComputedStyle(more).display === 'none' ? 0 : parseInt(more.textContent.replace('+', ''), 10)
      if (!tight && shown !== n) it.bad.push(`+N dice ${shown} y hay ${n} recortados`)
      if (tight && shown) it.bad.push('+N visible en data-tight')
    }
    const first = cl.indexOf(true); if (first >= 0 && cl.slice(first).some((x) => !x)) it.bad.push('los recortados no son el final de la prioridad')
    if (n && facts.some((f) => f.classList.contains('is-bare')) && !terse && L !== 'stack') it.bad.push('dato recortado sin callar antes los rótulos bare')
    if (tight && !it.multi && n !== facts.length) it.bad.push('data-tight con datos a la vista')
    if (L === 'inline' && t && t.scrollWidth > t.clientWidth + 1 && n !== facts.length && !su.querySelector('.g-summary__code')) it.bad.push('inline: el título cede antes que los datos')
    // title nativo solo en lo cortado
    su.querySelectorAll('[title]').forEach((e) => { if (e.scrollWidth <= e.clientWidth + 1 && !e.closest('.g-btn')) it.bad.push('title en una parte sin elipsis: ' + e.className) })
    const st = su.querySelector('.g-summary__status'), head = su.querySelector('.g-summary__head'), name = su.querySelector('.g-summary__name')
    if (st && L === 'row') {
      const sb = st.getBoundingClientRect(), hb = head.getBoundingClientRect(), stVisible = sb.top < hb.bottom - 1
      const p = document.createElement('span'); p.style.cssText = 'position:absolute;inline-size:7ch'; head.append(p); const ch7 = p.getBoundingClientRect().width; p.remove()
      if (stVisible && name.getBoundingClientRect().width < Math.min(ch7, hb.width) - 1) it.bad.push(`estado a la vista con el nombre en ${name.getBoundingClientRect().width.toFixed(1)} < 7ch ${ch7.toFixed(1)}`)
    }
    it.visible = facts.length - n + (anc ? 1 : 0); it.total = facts.length + (anc ? 1 : 0); it.tight = tight; it.terse = terse
    out.push(it)
  })
  const field = {}; ['sm', 'md', 'lg'].forEach((s) => { field[s] = [document.querySelector(`[data-case="ref-${s}"]`).getBoundingClientRect().height, document.querySelector(`[data-case="field-${s}"]`).getBoundingClientRect().height, document.querySelector(`[data-case="field-dx-${s}"]`).getBoundingClientRect().height] })
  return { items: out, field, docScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 }
}

test.describe('GSummary · componente real', () => {
  test('barrido 160 a 720px (contrato): cesión por prioridad, identificador entero, «+N» = data-clipped, el lector lo recibe todo, altos constantes', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page, '?w=360')
    const heights = new Map(), counts = {}, bad = []
    for (let w = 160; w <= 720; w += 20) {
      await setW(page, w)
      const m = await page.evaluate(`(${probe.toString()})(160)`)
      for (const it of m.items) {
        for (const b of it.bad) bad.push(`${w}px ${it.c}#${it.idx} (${it.layout}): ${b}`)
        if (it.layout === 'row' && !it.multi) { const k = it.c + '#' + it.idx; (heights.get(k) || heights.set(k, []).get(k)).push(it.h) }
      }
      for (const s of ['sm', 'md', 'lg']) { const [ref, f, dx] = m.field[s]; if (Math.abs(ref - f) >= 0.5 || Math.abs(ref - dx) >= 0.5) bad.push(`${w}px inline Δ0 campo ${s}: ${ref} / ${f} / ${dx}`) }
      if (m.docScroll) bad.push(`${w}px: la página se desplaza en horizontal`)
      const opt = m.items.find((x) => x.c === 'opt'); if ([240, 360, 520].includes(w)) counts[w] = `${opt.visible}/${opt.total}`
    }
    expect(bad, bad.slice(0, 20).join('\n')).toEqual([])
    for (const [k, hs] of heights) expect(Math.max(...hs) - Math.min(...hs), `row lines 2 de alto variable ${k}`).toBeLessThan(0.5)
    expect(counts).toEqual({ 240: '1/4', 360: '2/4', 520: '4/4' })
    const rowH = await page.evaluate(() => [...document.querySelectorAll('[data-case="sizes"] .g-summary')].map((s) => s.getBoundingClientRect().height))
    expect(rowH[2]).toBe(44)
    // Monotonía: al ensanchar no se ven menos datos
    let prev = 0
    for (let w = 160; w <= 640; w += 40) { await setW(page, w); const v = await page.evaluate(() => document.querySelector('[data-case="opt"] .g-summary').querySelectorAll('.g-summary__fact:not([data-clipped])').length); expect(v, `${w}px`).toBeGreaterThanOrEqual(prev); prev = v }
    expect(errs).toEqual([])
  })

  test('contraste de B: lo único pesa, lo compartido se apaga, el identificador no se apaga; vecino sin homónimos sin marcas; coincidencia con peso y subrayado', async ({ page }) => {
    await open(page, '?w=520')
    const wt = await page.evaluate(() => {
      const fw = (s) => { const e = document.querySelector(s); return e ? Number(getComputedStyle(e).fontWeight) : 0 }
      const tok = (() => { const i = document.createElement('i'); i.style.fontWeight = 'var(--g-text-title-sm-weight)'; document.body.append(i); const v = Number(getComputedStyle(i).fontWeight); i.remove(); return v })()
      const opts = [...document.querySelectorAll('[data-case="opt"] .g-summary')]
      const mk = document.querySelector('[data-case="opt"] .g-summary__mark')
      const a = document.querySelector('[data-case="opt"] .is-anchor .g-summary__fact-value'), t = document.querySelector('[data-case="opt"] .g-summary__title')
      return { diff: fw('[data-case="opt"] .is-diff:not(.is-anchor) .g-summary__fact-value'), same: fw('[data-case="opt"] .is-same:not(.is-anchor) .g-summary__fact-value'), anchor: fw('[data-case="opt"] .is-anchor .g-summary__fact-value'), title: fw('[data-case="opt"] .g-summary__title'), tok,
        anchorColor: getComputedStyle(a).color === getComputedStyle(t).color, neighbor: opts[4].querySelectorAll('.is-diff, .is-same').length, marked: opts.filter((o) => o.querySelector('.g-summary__mark')).length,
        mark: mk ? [Number(getComputedStyle(mk).fontWeight), getComputedStyle(mk).textDecorationLine, getComputedStyle(mk).backgroundColor] : null }
    })
    expect(wt.diff).toBe(wt.tok)
    expect(wt.diff).toBeGreaterThan(wt.same)
    expect(wt.anchor).toBe(wt.tok)
    expect(wt.title).toBe(wt.tok)
    expect(wt.anchorColor).toBe(true)
    expect(wt.neighbor).toBe(0)
    expect(wt.marked).toBe(5)
    expect(wt.mark[0]).toBe(wt.tok)
    expect(wt.mark[1]).toContain('underline')
    expect(wt.mark[2]).toMatch(/rgba\(0, 0, 0, 0\)|transparent/)
  })

  test('carga Δ0: row lines 2, inline y row lines 4; y al pasar de carga a datos el alto no se mueve', async ({ page }) => {
    await open(page, '?w=360')
    for (const w of [240, 360, 520]) {
      await setW(page, w)
      const c = await page.evaluate(() => {
        const H = (k) => [...document.querySelectorAll('[data-pair="' + k + '"]')].map((e) => (e.querySelector('.g-summary') || e).getBoundingClientRect().height)
        const r4 = document.querySelectorAll('[data-pair="row4"] .g-summary'); const head = r4[0].querySelector('.g-summary__head').getBoundingClientRect().height
        const lh = parseFloat(getComputedStyle(r4[0].querySelector('.g-summary__data')).lineHeight), gap = parseFloat(getComputedStyle(r4[0].querySelector('.g-summary__flow')).rowGap)
        return { row2: H('row2'), lis: [...document.querySelectorAll('li[data-pair="row2"]')].map((e) => e.getBoundingClientRect().height), inline: [...document.querySelectorAll('[data-pair="inline"]')].map((e) => e.getBoundingClientRect().height), row4: [r4[0].getBoundingClientRect().height, r4[1].getBoundingClientRect().height, head + 3 * lh + 2 * gap], busy: document.querySelectorAll('[aria-busy="true"].is-loading').length }
      })
      expect(Math.abs(c.row2[0] - c.row2[1]), `${w}px row2 ${c.row2}`).toBeLessThan(0.5)
      expect(Math.abs(c.lis[0] - c.lis[1]), `${w}px li ${c.lis}`).toBeLessThan(0.5)
      expect(Math.abs(c.inline[0] - c.inline[1]), `${w}px inline ${c.inline}`).toBeLessThan(0.5)
      expect(Math.abs(c.row4[1] - c.row4[2]), `${w}px row4 ${c.row4}`).toBeLessThan(0.5)
      expect(c.busy).toBe(4)
    }
    // De carga a datos sin mover el alto; medida al llegar los datos («+N» aparece)
    await setW(page, 300)
    const before = await page.evaluate(() => document.querySelector('[data-test="swap"]').getBoundingClientRect().height)
    await page.click('#t-load')
    await frames(page)
    const after = await page.evaluate(() => { const s = document.querySelector('[data-test="swap"]'); return { h: s.getBoundingClientRect().height, busy: s.getAttribute('aria-busy'), more: s.querySelector('.g-summary__more')?.hidden, enter: s.querySelectorAll('[data-enter]').length } })
    expect(after.h).toBe(before)
    expect(after.busy).toBeNull()
    expect(after.more).toBe(false)
    expect(after.enter).toBe(0)
  })

  test('bidi: texto árabe y hebreo reales y latino en contenedor RTL; sin desplazamiento del anfitrión; dir="auto"', async ({ page }) => {
    await open(page, '?w=360')
    for (const w of [160, 240, 360]) {
      await setW(page, w)
      const b = await page.evaluate(() => {
        const lat = document.querySelector('[data-case="rtl-latin"] .is-anchor'); const l = lat.querySelector('.g-summary__fact-label').getBoundingClientRect(), v = lat.querySelector('.g-summary__fact-value').getBoundingClientRect()
        const ar = document.querySelector('[data-case="rtl-opt"] .is-anchor'); const al = ar.querySelector('.g-summary__fact-label').getBoundingClientRect(), av = ar.querySelector('.g-summary__fact-value').getBoundingClientRect()
        const scroll = [...document.querySelectorAll('[dir="rtl"]')].some((s) => s.scrollWidth > s.clientWidth + 1 || [...s.querySelectorAll('.lb, .fld, .pv')].some((x) => x.scrollWidth > x.clientWidth + 1))
        return { latinOrder: l.left > v.left || lat.closest('[data-tight]') != null, arOrder: al.left > av.left || ar.closest('[data-tight]') != null, scroll, dirs: [...document.querySelectorAll('[data-case="rtl-opt"] :is(.g-summary__title, .g-summary__fact-label, .g-summary__fact-value, .g-summary__subtitle)')].every((e) => e.getAttribute('dir') === 'auto') }
      })
      expect(b.latinOrder && b.arOrder, `${w}px: el rótulo no va antes (a la derecha) del valor`).toBe(true)
      expect(b.scroll, `${w}px: el anfitrión se desplaza`).toBe(false)
      expect(b.dirs).toBe(true)
    }
  })

  test('móvil 320: sin desplazamiento horizontal', async ({ page }) => {
    await open(page, '?w=320', { viewport: { width: 320, height: 2400 } })
    const s = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(s).toBeLessThanOrEqual(1)
  })

  test('entrada: nada al montar; al ensanchar de 190 a 520 entran datos (g-summary-enter / -rtl desde el inicio) y se retira data-enter', async ({ page }) => {
    await open(page, '?w=360', { reducedMotion: 'no-preference' })
    expect(await page.evaluate(() => document.querySelectorAll('[data-enter]').length)).toBe(0)
    const run = async (sel) => {
      await setW(page, 190); await page.waitForTimeout(300)
      await page.evaluate((sel) => { const su = document.querySelector(sel); const log = window.__log = { names: new Set(), samples: [], seen: 0, dur: 0 }
        const mo = new MutationObserver((ms) => ms.forEach((m) => { const f = m.target; if (!f.hasAttribute('data-enter')) return; log.seen++
          const an = f.getAnimations().find((x) => x.animationName?.startsWith('g-summary-enter')); if (!an) return; log.names.add(an.animationName)
          if (log.samples.length) return
          const d = an.effect.getComputedTiming().duration; log.dur = d; an.pause()
          for (const k of [0, 0.25, 0.5]) { an.currentTime = d * k; const cs = getComputedStyle(f); log.samples.push([+parseFloat(cs.opacity).toFixed(2), cs.translate]) }
          an.play() }))
        mo.observe(su, { subtree: true, attributes: true, attributeFilter: ['data-enter'] }); log.mo = mo }, sel)
      await setW(page, 520); await page.waitForTimeout(1200)
      return page.evaluate((sel) => { const l = window.__log; l.mo.disconnect(); return { names: [...l.names], seen: l.seen, dur: l.dur, samples: l.samples, left: document.querySelectorAll(sel + ' [data-enter]').length } }, sel)
    }
    const ok = (r, sign) => r.seen > 0 && r.left === 0 && r.samples.length === 3 && r.samples[0][0] === 0 && r.samples[1][0] > 0 && r.samples[1][0] < 1 && r.samples[2][0] > r.samples[1][0] && Math.sign(parseFloat(r.samples[0][1])) === sign && Math.abs(parseFloat(r.samples[2][1])) < Math.abs(parseFloat(r.samples[0][1]))
    const r = await run('[data-case="opt"] .g-summary')
    expect(r.names, JSON.stringify(r)).toEqual(['g-summary-enter'])
    expect(ok(r, -1), JSON.stringify(r)).toBe(true)
    const q = await run('[data-case="rtl-opt"] .g-summary')
    expect(q.names, JSON.stringify(q)).toEqual(['g-summary-enter-rtl'])
    expect(ok(q, 1), JSON.stringify(q)).toBe(true)
  })

  test('con prefers-reduced-motion: reduce nada entra (ni atributo ni animación)', async ({ page }) => {
    await open(page, '?w=360', { reducedMotion: 'reduce' })
    await setW(page, 190); await page.waitForTimeout(200)
    await page.evaluate(() => { window.__n = 0; const t = () => { window.__n += document.querySelectorAll('[data-enter]').length; if (!window.__stop) requestAnimationFrame(t) }; requestAnimationFrame(t) })
    await setW(page, 520); await page.waitForTimeout(500)
    const n = await page.evaluate(() => { window.__stop = true; const f = document.querySelector('[data-case="opt"] .g-summary__fact:not(.is-anchor)'); f.setAttribute('data-enter', ''); const a = getComputedStyle(f).animationName; f.removeAttribute('data-enter'); return { n: window.__n, a, visible: document.querySelector('[data-case="opt"] .g-summary').querySelectorAll('.g-summary__fact:not([data-clipped])').length } })
    expect(n.n).toBe(0)
    expect(n.a).toBe('none')
    expect(n.visible).toBe(4)
  })

  test('semántica: group con aria-labelledby al título; «+N» aria-hidden; la opción se lee con los cuatro datos a 240px', async ({ page }) => {
    await open(page, '?w=240')
    const a = await page.evaluate(() => {
      const pv = document.querySelector('[data-case="preview"] .g-summary')
      const opt = document.querySelector('[data-case="opt"] [role="option"]')
      // Texto que recibe el lector: sin los subárboles aria-hidden (identidad, «+N»)
      const spoken = (n) => n.nodeType === 3 ? n.textContent : n.getAttribute('aria-hidden') === 'true' ? '' : [...n.childNodes].map(spoken).join('')
      return { role: pv.getAttribute('role'), labelled: document.getElementById(pv.getAttribute('aria-labelledby'))?.className, more: [...document.querySelectorAll('.g-summary__more')].every((m) => m.getAttribute('aria-hidden') === 'true'), optText: spoken(opt).replace(/\s+/g, ' ').trim(), clipped: opt.querySelectorAll('[data-clipped]').length }
    })
    expect(a.role).toBe('group')
    expect(a.labelled).toBe('g-summary__title')
    expect(a.more).toBe(true)
    expect(a.clipped).toBe(3)
    expect(a.optText).toBe('María García López; Exp. 001000; Edad 22 años; Última visita 03/02/2026; Médico Dra. Ruiz;')
    const snap = await page.locator('[data-case="opt"] [role="option"]').first().ariaSnapshot()
    expect(snap).toContain('Exp. 001000')
    expect(snap).toContain('Médico Dra. Ruiz')
    expect(snap).not.toContain('+3')
  })

  test('rendimiento: 200 y 500 fichas en una rejilla, montaje y un cambio de ancho', async ({ page }, testInfo) => {
    const out = {}
    for (const n of [200, 500]) {
      await open(page, `?w=360&n=${n}`, { viewport: { width: 1280, height: 900 } })
      const perf = await page.evaluate(() => window.__perf)
      // La rejilla queda a la vista (sin la carga de las secciones de arriba): la medida por lotes de las fichas visibles
      await page.evaluate(() => document.querySelector('.perf').scrollIntoView())
      await frames(page)
      const t = []
      for (const w of [180, 320, 220]) t.push(await page.evaluate((w) => window.__su.timePw(w), w))
      const visible = await page.evaluate(() => document.querySelectorAll('.perf .g-summary[data-terse], .perf .g-summary[data-tight]').length)
      out[n] = { mount: perf.mount, layout: perf.layout, measure: perf.measure, resize: t, visibleMeasured: visible }
      expect(perf.measure, `montaje n=${n}: medida ${perf.measure} ms`).toBeLessThan(150)
      for (const ms of t) expect(ms, `cambio de ancho n=${n}: ${ms} ms`).toBeLessThan(150)
    }
    testInfo.annotations.push({ type: 'rendimiento', description: JSON.stringify(out) })
    console.log(`[summary ${testInfo.project.name}] rendimiento`, JSON.stringify(out))
  })
})
