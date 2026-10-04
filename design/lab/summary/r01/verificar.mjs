// Verificación de la ficha de resumen (kiwi): la base (r01) y los conceptos A, B y C (r02) con la MISMA batería.
// Ejecutar: node design/lab/summary/r01/verificar.mjs   (GRANA_PW_PORT, por defecto 4211; ENGINES=chromium,firefox,webkit; CONCEPTS=base,A,B,C; VERBOSE=1)
import { serve, pw } from '../serve.mjs'
import { fileURLToPath } from 'node:url'

const CASES = ['#case-opt', '#case-field', '#case-field-dx', '#case-preview', '#case-card', '#case-cell']
const WIDTHS = []; for (let w = 160; w <= 720; w += 20) WIDTHS.push(w)

// Se ejecuta en la página: mide todas las fichas de un caso
function probe(sel) {
  const host = document.querySelector(sel), stage = host.closest('.stage').getBoundingClientRect(), hb = host.getBoundingClientRect()
  const out = { hostW: hb.width, hostH: hb.height, hostOver: hb.right > stage.right + 0.5 || hb.left < stage.left - 0.5, scroll: host.scrollWidth > host.clientWidth + 1, items: [] }
  const vis = (e) => { // ¿se ve entero? Dentro de todos sus ancestros que recortan, hasta la ficha
    const r = e.getBoundingClientRect(); if (!r.width || !r.height) return false
    for (let a = e.parentElement; a && !a.matches('.stage') && a !== e.closest('.su').parentElement; a = a.parentElement) {
      const cs = getComputedStyle(a); if (cs.display === 'contents' || (cs.overflowX === 'visible' && cs.overflowY === 'visible')) continue
      const b = a.getBoundingClientRect(); if (r.left < b.left - 1 || r.right > b.right + 1 || r.top < b.top - 1 || r.bottom > b.bottom + 1) return false
    }
    return true
  }
  host.querySelectorAll('.su:not(.su--heading)').forEach((su) => {
    if (su.closest('[popover]')) return
    const r = su.getBoundingClientRect(), it = { w: r.width, h: r.height, tier: su.dataset.tier, bad: [] }, pb = su.parentElement.getBoundingClientRect()
    if (r.right > pb.right + 0.5 || r.left < pb.left - 0.5) it.bad.push('la ficha sale de su anfitrión')
    // 1. Nada visible cruza el borde de la ficha ni queda cortado sin elipsis
    su.querySelectorAll('.su__lead,.su__code,.su__title,.su__status,.su__action,.su__fact,.su__more,.su__sub').forEach((e) => {
      const cs = getComputedStyle(e); if (cs.display === 'none' || cs.position === 'absolute' || e.hasAttribute('data-clipped') || e.hidden) return
      const b = e.getBoundingClientRect(); if (!b.width) return
      if (b.right > r.right + 1 || b.left < r.left - 1) it.bad.push('cruza el borde: ' + e.className)
      const cut = !vis(e), ell = cs.textOverflow === 'ellipsis' || e.matches('.su__status')
      if (cut && !ell && !e.matches('.su__fact:not(.is-anchor)')) it.bad.push('cortado sin elipsis: ' + e.className)
      if (cut && e.matches('.su__fact:not(.is-anchor)') && !ell) it.bad.push('dato cortado a medias: ' + e.textContent)
    })
    // 2. El identificador (dato ancla o código) siempre entero
    const anc = su.querySelector('.su__fact.is-anchor .su__v'), code = su.querySelector('.su__code')
    const idEl = code || anc
    if (idEl) { const p = idEl.closest('.su__fact') || idEl; it.idOk = vis(idEl) && p.scrollWidth <= p.clientWidth + 1; if (!it.idOk) it.bad.push('identificador no visible entero') }
    // 3. El título se ve (al menos su suelo)
    const t = su.querySelector('.su__title'); if (t && t.getBoundingClientRect().width < 20) it.bad.push('título < 20px')
    // 4. El lector recibe todo: ningún rótulo ni valor con display:none, visibility:hidden ni aria-hidden
    su.querySelectorAll('.su__title,.su__k,.su__v,.su__code,.su__status').forEach((e) => {
      for (let a = e; a && a !== su.parentElement; a = a.parentElement) {
        const cs = getComputedStyle(a)
        if (cs.display === 'none' || cs.visibility === 'hidden' || a.getAttribute('aria-hidden') === 'true') { it.bad.push('fuera del árbol accesible: ' + e.className + ' «' + e.textContent + '»'); break }
      }
    })
    // 5. «+N» = datos recortados
    const more = su.querySelector(':scope > .su__body .su__more'), n = su.querySelectorAll(':scope > .su__body .su__fact[data-clipped]').length
    if (more && !su.hasAttribute('data-tight')) { const shown = more.hidden ? 0 : parseInt(more.textContent.replace('+', ''), 10); if (shown !== n) it.bad.push(`+N dice ${shown} y hay ${n} recortados`) }
    it.clipped = n; it.facts = su.querySelectorAll(':scope > .su__body .su__fact').length
    out.items.push(it)
  })
  return out
}

export async function run(concepts) {
  const { server, base } = await serve()
  const engines = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
  const list = (process.env.CONCEPTS || concepts).split(',')
  const V = !!process.env.VERBOSE
  let pass = 0, fail = 0
  const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log('  FALLA ·', msg) } }
  for (const eng of engines) {
    const browser = await pw[eng].launch()
    for (const c of list) {
      const url = (c === 'base' ? '/r01/index.html?x=1' : '/r02/index.html?c=' + c)
      const tag = `[${eng} ${c}]`
      const errs = []
      for (const dir of ['ltr', 'rtl']) {
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
        page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
        await page.goto(base + url + (dir === 'rtl' ? '&dir=rtl' : '')); await page.waitForSelector('#case-cell .su'); await page.evaluate(() => document.fonts.ready)
        const heights = {}
        for (const w of WIDTHS) {
          await page.evaluate((v) => __lab.setWidth(v), w)
          await page.evaluate(async () => { await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 30)))); await Promise.race([Promise.allSettled(document.getAnimations().filter((a) => a.effect?.target?.closest?.('.su') && a.effect.getComputedTiming().iterations !== Infinity).map((a) => a.finished)), new Promise((r) => setTimeout(r, 600))]) })
          for (const sel of CASES) {
            const res = await page.evaluate(probe, sel)
            const where = `${tag} ${dir} ${sel} ${w}px`
            ok(sel === '#case-cell' || (!res.hostOver && !res.scroll), `${where}: el anfitrión desborda el escenario`)
            ok(res.items.length > 0, `${where}: sin fichas`)
            res.items.forEach((it, i) => ok(it.bad.length === 0, `${where} ficha ${i} (${it.tier}): ${it.bad.join(' | ')}`))
            ;(heights[sel] ||= []).push({ w, h: res.hostH, hs: res.items.map((i) => i.h) })
          }
          if (dir === 'ltr') {
            const d = await page.evaluate(() => [document.querySelector('#field-ref').getBoundingClientRect().height, document.querySelector('#case-field').getBoundingClientRect().height, document.querySelector('#case-field-dx').getBoundingClientRect().height])
            ok(d[0] === d[1] && d[0] === d[2], `${tag} Δ0 del campo a ${w}px: referencia ${d[0]}, ficha ${d[1]}, código ${d[2]}`)
          }
        }
        // Alto por contexto: opción y celda no cambian de alto con el ancho; el campo, tampoco
        for (const sel of ['#case-opt', '#case-field', '#case-cell']) {
          const hs = heights[sel].map((x) => x.h), min = Math.min(...hs), max = Math.max(...hs)
          const lim = sel === '#case-field' ? 0 : c === 'B' ? 200 : 0   // B pasa de dos líneas a una al ensanchar: se informa
          ok(max - min <= lim, `${tag} ${dir} ${sel}: el alto varía ${min}–${max}px con el ancho`)
          if (V || (dir === 'ltr' && sel !== '#case-field')) console.log(`  ${tag} ${dir} ${sel}: alto ${min}–${max}px; alto de ficha máx ${Math.max(...heights[sel].flatMap((x) => x.hs))}px`)
        }
        if (dir === 'ltr') {
          const hs = heights['#case-card'].map((x) => `${x.w}:${Math.round(x.h)}`)
          console.log(`  ${tag} tarjeta, alto por ancho: ${hs.filter((_, i) => i % 4 === 0).join(' ')}`)
          // Lector: el nombre accesible de una opción con datos recortados los incluye todos (a 240px)
          await page.evaluate(() => __lab.setWidth(240)); await page.waitForTimeout(80)
          const txt = await page.evaluate(() => { const o = document.querySelector('#case-opt [role=option]'); return { t: o.textContent, n: o.querySelectorAll('[data-clipped]').length } })
          ok(['María García López', '001000', '22 años', '03/02/2026', 'Dra. Ruiz', 'Edad', 'Última visita', 'Médico'].every((s) => txt.t.includes(s)), `${tag} lector a 240px: falta texto en la opción («${txt.t}»)`)
          ok(txt.n > 0, `${tag} a 240px debería haber datos recortados en la opción`)
          if (eng === 'chromium') {
            const snap = await page.locator('#case-opt [role=option]').first().ariaSnapshot()
            ok(['001000', '22 años', '03/02/2026', 'Dra. Ruiz'].every((s) => snap.includes(s)), `${tag} árbol accesible a 240px sin todos los datos: ${snap}`)
            if (V) console.log('  ' + snap.replace(/\n/g, ' '))
          }
          // RTL: se comprueba aparte (bucle); aquí, móvil 320: sin desplazamiento horizontal de la página
          await page.setViewportSize({ width: 320, height: 700 }); await page.evaluate(() => { __lab.setWidth(320); __lab.setGrid(288) }); await page.waitForTimeout(150)
          const sw = await page.evaluate(() => document.documentElement.scrollWidth)
          ok(sw <= 320, `${tag} móvil 320: la página mide ${sw}px de ancho`)
          await page.setViewportSize({ width: 1280, height: 900 })
          // Rejilla: de 200 a 928 en pasos de 52, con mínimo 224: ninguna tarjeta desborda
          for (let g = 200; g <= 928; g += 52) {
            await page.evaluate((v) => __lab.setGrid(v, 56), g); await page.waitForTimeout(40)
            const bad = await page.evaluate(() => { const f = document.querySelector('#grid'); const fb = f.getBoundingClientRect(); return [...f.querySelectorAll('.su')].filter((s) => !s.closest('[popover]')).filter((s) => { const r = s.getBoundingClientRect(); return r.right > fb.right + 0.5 || s.scrollWidth > s.clientWidth + 1 }).length })
            ok(bad === 0, `${tag} rejilla a ${g}px: ${bad} fichas desbordan`)
          }
        } else {
          // RTL: la identidad queda al inicio (derecha)
          await page.evaluate(() => __lab.setWidth(360)); await page.waitForTimeout(80)
          const r = await page.evaluate(() => { const s = document.querySelector('#case-opt [role=option] .su'); const l = s.querySelector('.su__lead').getBoundingClientRect(), t = s.querySelector('.su__title').getBoundingClientRect(); return l.left > t.left })
          ok(r, `${tag} RTL: la identidad no está al inicio`)
        }
        await page.close()
      }
      // Movimiento reducido: tras cambiar de ancho no queda ninguna animación ni transición en curso
      {
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
        await page.goto(base + url); await page.waitForSelector('#case-cell .su')
        let running = 0
        for (const w of [160, 400, 720, 180, 560]) { await page.evaluate((v) => __lab.setWidth(v), w); await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))); running += await page.evaluate(() => document.getAnimations().filter((a) => { const t = a.effect?.target; return t?.closest?.('.su') && !t.closest('.g-avatar,.g-badge,.g-btn') }).map((a) => a.animationName || a.transitionProperty).length) }
        ok(running === 0, `${tag} movimiento reducido: ${running} animaciones en curso`)
        await page.close()
      }
      // Con movimiento: A anima los datos que entran; C anima el cambio de tramo
      if (c === 'A' || c === 'C') {
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
        await page.goto(base + url); await page.waitForSelector('#case-cell .su'); await page.evaluate(() => document.fonts.ready)
        await page.evaluate(() => __lab.setWidth(190)); await page.waitForTimeout(400)
        const n = await page.evaluate(async (c) => { __lab.setWidth(c === 'A' ? 520 : 400); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))); return document.getAnimations().filter((a) => a.effect?.target?.closest?.(c === 'A' ? '#case-opt .su' : '#case-card .su')).length }, c)
        ok(n > 0, `${tag} movimiento: se esperaba animación al ensanchar (${n})`)
        if (c === 'C') {
          // Tramos y segunda cara
          const tiers = []
          for (const w of [170, 260, 400, 640]) { await page.evaluate((v) => __lab.setWidth(v), w); await page.waitForTimeout(350); tiers.push(await page.evaluate(() => document.querySelector('#case-card .su').dataset.tier)) }
          ok(tiers.join() === 'inline,row,stack,panel', `${tag} tramos de la tarjeta: ${tiers.join()}`)
          await page.evaluate(() => __lab.setWidth(260)); await page.waitForTimeout(150)
          const btn = page.locator('#case-card .su__more--btn')
          await btn.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(450)
          const face = await page.evaluate(() => { const p = document.querySelector('#case-card .su-face'); const r = p.getBoundingClientRect(); return { open: p.matches(':popover-open'), txt: p.textContent, inView: r.left >= 0 && r.right <= innerWidth, exp: document.querySelector('#case-card .su__more--btn').getAttribute('aria-expanded'), focus: document.activeElement.className } })
          ok(face.open && face.exp === 'true' && face.txt.includes('Dra. Ruiz') && face.inView, `${tag} segunda cara: ${JSON.stringify(face)}`)
          ok(face.focus.includes('su__more--btn'), `${tag} segunda cara: el foco se queda en el botón (${face.focus})`)
          await page.keyboard.press('Escape'); await page.waitForTimeout(400)
          const closed = await page.evaluate(() => ({ open: document.querySelector('#case-card .su-face').matches(':popover-open'), focus: document.activeElement.className, exp: document.querySelector('#case-card .su__more--btn').getAttribute('aria-expanded') }))
          ok(!closed.open && closed.exp === 'false' && closed.focus.includes('su__more--btn'), `${tag} segunda cara, Esc: ${JSON.stringify(closed)}`)
          const hit = await btn.boundingBox(); ok(hit.width >= 24 && hit.height >= 24, `${tag} «+N» botón ${hit.width}×${hit.height}`)
        }
        await page.close()
      }
      if (c === 'B') {
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
        await page.goto(base + url + '&w=600'); await page.waitForSelector('#case-cell .su'); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(150)
        const col = await page.evaluate(() => {
          const rows = [...document.querySelectorAll('#case-opt .su')]
          const xs = (key) => rows.map((r) => { const f = r.querySelector(`.su__fact[data-key="${key}"]`); return f && !f.hasAttribute('data-clipped') ? Math.round(f.getBoundingClientRect().left * 10) / 10 : null })
          const w = (sel) => getComputedStyle(document.querySelector(sel)).fontWeight
          return { exp: xs('Expediente'), edad: xs('Edad'), same: w('#case-opt [role=option] .su__fact.is-same .su__v'), diff: w('#case-opt [role=option] .su__fact.is-diff .su__v'),
            sameN: document.querySelectorAll('#case-opt [role=option] .su__fact.is-same').length, lastHasDiff: !!document.querySelector('#case-opt [role=option]:last-child .su__fact:is(.is-same,.is-diff)') }
        })
        ok(new Set(col.exp).size === 1 && new Set(col.edad).size === 1 && col.exp[0] !== null, `${tag} columnas alineadas entre fichas (incluida la cabecera): ${JSON.stringify(col)}`)
        ok(+col.diff > +col.same && col.sameN > 0, `${tag} lo que distingue pesa más: ${col.diff} vs ${col.same}`)
        ok(!col.lastHasDiff, `${tag} la ficha sin homónimos no lleva marcas`)
        await page.close()
      }
      // Contraste (tema por defecto, claro): texto atenuado de rótulos y valores apagados sobre su fondo real
      if (eng === 'chromium') {
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
        await page.goto(base + url + '&w=600'); await page.waitForSelector('#case-cell .su'); await page.waitForTimeout(150)
        const cr = await page.evaluate(() => {
          const lum = (c) => { const [r, g, b] = c.match(/[\d.]+/g).slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
          const bg = (e) => { for (let a = e; a; a = a.parentElement) { const c = getComputedStyle(a).backgroundColor; if (c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') return c } return 'rgb(255,255,255)' }
          let min = 99, who = ''
          document.querySelectorAll('.su :is(.su__k,.su__v,.su__title,.su__code,.su__sub,.su__more)').forEach((e) => {
            if (e.closest('.su--loading') || !e.getBoundingClientRect().width) return
            const a = lum(getComputedStyle(e).color), b = lum(bg(e)), r = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
            if (r < min) { min = r; who = e.className + ' en ' + (e.closest('[id]')?.id || '') }
          })
          return { min: Math.round(min * 100) / 100, who }
        })
        ok(cr.min >= 4.5, `${tag} contraste mínimo ${cr.min}:1 (${cr.who})`)
        console.log(`  ${tag} contraste mínimo de texto: ${cr.min}:1 (${cr.who})`)
        await page.close()
      }
      ok(errs.length === 0, `${tag} errores de consola: ${errs.slice(0, 3).join(' | ')}`)
    }
    await browser.close()
  }
  server.close()
  console.log(`\n${pass} comprobaciones pasan, ${fail} fallan (${engines.join(', ')}; ${list.join(', ')})`)
  process.exitCode = fail ? 1 : 0
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await run('base')
