// Auditoría de coco del MOVIMIENTO y la APARIENCIA de la isla de estado sobre el componente real (reporte del usuario del
// 2026-10-18: «aparece muy abrupta, muy tosca… queda nada más el icono flotando y no sé qué significa»).
// Playground real (packages/vue/playground, sección #sec-status) con dist/ como se publica. Mide cuadro a cuadro
// (requestAnimationFrame + getComputedStyle + getAnimations) cada paso del ciclo de vida:
//   nacer (de vacía a visible) sin y con «elemento en uso» (el clic real en «Guardar» que abre la isla sola),
//   apertura automática, compacta → abierta, abierta → compacta (Esc y pulsar fuera), abierta → punto («Entendido»),
//   punto → compacta, toque (is-nudge), vaciarse desde compacta y desde abierta, y la apariencia del punto.
// Temas: defecto claro y oscuro y el de @grana/cli de la auditoría (auditoria-tema.css: brand #6B2FA3, radius 4, space 3,
// fontSize 19) claro y oscuro; con prefers-reduced-motion no-preference y reduce; Chromium, Firefox y WebKit.
// Tres clases de comprobación:
//   contrato   lo que status.md (#324, «Movimiento») pide; un fallo es DEFECTO y el script sale con código 1
//   mejora     dentro del contrato, lo que coco propone afinar (auditoria-movimiento.md); se informa, no falla
//   dato       cifras (duraciones reales, sobrepaso, tamaños) para el informe
// Ejecutar desde la raíz (tras `npm run build`): node design/lab/alert/auditoria-movimiento-verificar.mjs
// Opcional: --engines=chromium,firefox,webkit  --verbose  --film (tiras de cuadros en design/lab/alert/movimiento-*.png,
// solo Chromium, por CDP screencast)  GRANA_PW_PORT (coco: 4214)
import http from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
    const body = await readFile(p)
    res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' }).end(body)
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT || 4214), '127.0.0.1', r))
const PLAY = `http://127.0.0.1:${server.address().port}/packages/vue/playground/index.html`
const CLI = 'design/lab/alert/auditoria-tema.css'
const cliCss = await readFile(join(ROOT, CLI), 'utf8')

let ENGINE = 'static'
let LABEL = ''
const tally = { contrato: [0, 0], mejora: [0, 0] }
const fails = { contrato: [], mejora: [] }
const data = []
const check = (kind) => (cond, msg) => {
  tally[kind][0]++
  if (!cond) { tally[kind][1]++; fails[kind].push(`[${ENGINE} · ${LABEL}] ${msg}`) }
  if (args.verbose) console.log(cond ? 'ok ' : (kind === 'contrato' ? 'DEF' : 'MEJ'), ENGINE, LABEL, msg)
}
const contrato = check('contrato')
const mejora = check('mejora')
const dato = (k, v) => data.push({ engine: ENGINE, label: LABEL, k, v })

/* ---------- Grabador en la página: un registro por cuadro y cada animación nueva con su tiempo, curva y extremos ---------- */
const PAGE_REC = () => {
  window.__rec = (ms, trigger) => new Promise((res) => {
    const root = document.querySelector('.g-status-island')
    const fr = []; const seen = new Map(); const t0 = performance.now()
    const part = (el) => {
      if (!el || !el.classList) return '?'
      return [...el.classList].find((c) => /^g-status-(island__|item$)/.test(c)) || el.classList[0] || el.tagName
    }
    const snap = (ph) => {
      const sh = root.querySelector('.g-status-island__shape'); const cs = getComputedStyle(sh); const r = sh.getBoundingClientRect()
      const li = root.querySelector('.g-status-island__shape .g-status-item'); const foot = root.querySelector('.g-status-island__shape .g-status-island__foot')
      const sum = root.querySelector('.g-status-island__summary'); const panel = root.querySelector('.g-status-island__panel')
      const badge = root.querySelector('.g-status-island__summary .g-status-island__badge')
      let anims = []
      try { anims = root.getAnimations({ subtree: true }) } catch {}
      for (const a of anims) {
        const what = a.animationName || a.transitionProperty
        const k = what + '@' + part(a.effect && a.effect.target)
        const tm = a.effect.getTiming()
        let from = '', to = '', kfEase = ''
        try {
          const kf = a.effect.getKeyframes()
          const prop = Object.keys(kf[0] || {}).find((x) => !['offset', 'computedOffset', 'easing', 'composite'].includes(x))
          from = prop ? String(kf[0][prop]) : ''; to = prop ? String(kf[kf.length - 1][prop]) : ''
          kfEase = kf[0] && kf[0].easing ? String(kf[0].easing) : ''
        } catch {}
        // En una animación CSS la curva va en los fotogramas clave (la del efecto es linear); en una transición, en el efecto
        const easing = a.animationName && kfEase && kfEase !== 'linear' ? kfEase : String(tm.easing)
        if (!seen.has(k)) seen.set(k, { t: performance.now() - t0, what, target: part(a.effect && a.effect.target), dur: Number(tm.duration), delay: Number(tm.delay), easing, from, to })
      }
      const scale = cs.scale === 'none' ? 1 : parseFloat(cs.scale)
      fr.push({
        t: performance.now() - t0, ph, form: root.dataset.form, hid: sh.hidden, disp: cs.display, op: parseFloat(cs.opacity), sc: scale,
        lw: sh.offsetWidth, lh: sh.offsetHeight, w: r.width, h: r.height, top: r.top, left: r.left, cx: r.left + r.width / 2,
        sum: !!sum, txt: sum ? sum.querySelector('.g-status-island__text').getBoundingClientRect().width : 0,
        panel: panel ? (panel.hidden ? 'h' : 'v') : '-', panelOp: panel && !panel.hidden ? parseFloat(getComputedStyle(panel).opacity) : null,
        liOp: li ? parseFloat(getComputedStyle(li).opacity) : null, footOp: foot ? parseFloat(getComputedStyle(foot).opacity) : null,
        nudge: root.classList.contains('is-nudge'), badgeW: badge ? badge.offsetWidth : 0,
        bx: badge ? badge.getBoundingClientRect().left + badge.getBoundingClientRect().width / 2 : null
      })
    }
    // Los sucesos de transición y animación llegan aunque el motor dé pocos cuadros (WebKit sin pantalla: 40-60ms por cuadro)
    const ev = []
    const onEv = (e) => ev.push({ t: performance.now() - t0, type: e.type, what: e.propertyName || e.animationName, target: part(e.target) })
    for (const n of ['transitionrun', 'transitioncancel', 'animationstart']) root.addEventListener(n, onEv, true)
    snap('pre')
    if (trigger) trigger()
    const f = () => {
      snap('raf')
      if (performance.now() - t0 < ms) requestAnimationFrame(f)
      else { for (const n of ['transitionrun', 'transitioncancel', 'animationstart']) root.removeEventListener(n, onEv, true); res({ fr, anims: [...seen.values()], ev }) }
    }
    requestAnimationFrame(f)
  })
}

/* ---------- Análisis ---------- */
const vis = (r) => r.fr.filter((f) => f.ph === 'raf' && f.disp !== 'none' && !f.hid)
const seenF = (r) => vis(r).filter((f) => f.op > 0.02) // cuadros que de verdad se ven (con algo de opacidad)
const last = (r) => r.fr[r.fr.length - 1]
const anim = (r, what, target = 'g-status-island__shape') => r.anims.filter((a) => (typeof what === 'string' ? a.what === what : what.test(a.what)) && a.target === target)
// ¿Hubo transición o animación de `what` en `target` y nadie la canceló? Por getAnimations o por sus sucesos
// (transitionrun, animationstart; transitioncancel la anula: p. ej. un `transition: none` en línea la corta y salta al final)
const ran = (r, what, target = 'g-status-island__shape') => {
  const m = (e) => (typeof what === 'string' ? e.what === what : what.test(e.what)) && e.target === target
  if (r.ev.some((e) => e.type === 'transitioncancel' && m(e))) return false
  return anim(r, what, target).length > 0 || r.ev.some((e) => e.type !== 'transitioncancel' && m(e))
}
const cancelled = (r, what, target = 'g-status-island__shape') => r.ev.some((e) => e.type === 'transitioncancel' && e.what === what && e.target === target)
const SIZE = /^(width|height|inline-size|block-size)$/
const isSpring = (e) => /^linear\(/.test(e)
const settle = (fr, key, end, tol = 1) => { // primer instante desde el que el valor queda a ≤ tol del final
  let s = null
  for (const f of fr) { if (Math.abs(f[key] - end) <= tol) { if (s === null) s = f.t } else s = null }
  return s
}
const fmt = (n, d = 0) => (n === null || n === undefined || Number.isNaN(n) ? '—' : Number(n).toFixed(d))

const THEMES = [['defecto claro', null, false], ['defecto oscuro', null, true], ['cli claro', CLI, false], ['cli oscuro', CLI, true]]
const MOTIONS = ['no-preference', 'reduce']
const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05) }

for (const engine of ENGINES) {
  ENGINE = engine
  const b = await pw[engine].launch()
  const open = async ({ theme = null, dark = false, motion = 'no-preference' } = {}) => {
    const context = await b.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: motion, colorScheme: 'light' })
    const p = await context.newPage()
    p.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(String(e))) console.log(`[${engine}] pageerror: ${e}`) })
    await p.addInitScript((d) => { try { localStorage.setItem('grana-playground', JSON.stringify({ scheme: d ? 'dark' : 'light', themed: false })) } catch {} }, dark)
    await p.goto(`${PLAY}?status=none`)
    await p.waitForFunction(() => window.gStatus && window.__st && document.querySelector('.g-status-island.is-ready'))
    await p.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
    if (theme) await p.addStyleTag({ content: cliCss })
    await p.evaluate(() => Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]))
    await p.evaluate(PAGE_REC)
    await p.waitForTimeout(250)
    return p
  }
  const rec = (p, ms, trig) => p.evaluate(([ms, trig]) => window.__rec(ms, trig ? (0, eval)(trig) : null), [ms, trig])
  const recAround = async (p, ms, act) => { // el grabador arranca antes de una acción real (clic, tecla)
    await p.evaluate((ms) => { window.__P = window.__rec(ms, null) }, ms)
    await act()
    return p.evaluate(() => window.__P)
  }
  const blur = (p) => p.evaluate(() => { if (document.activeElement) document.activeElement.blur() })
  const wait = (p, ms = 350) => p.waitForTimeout(ms)
  const tokens = async (p) => p.evaluate(() => {
    const cs = getComputedStyle(document.documentElement)
    const ms = (n) => { const v = cs.getPropertyValue(n).trim(); const el = document.createElement('div'); el.style.transitionDuration = v; document.body.append(el); const d = parseFloat(getComputedStyle(el).transitionDuration) * 1000; el.remove(); return d }
    return { fast: ms('--g-duration-fast'), press: ms('--g-duration-press'), slow: ms('--g-duration-slow'), space: parseFloat(cs.getPropertyValue('--g-space-1')) * (cs.getPropertyValue('--g-space-1').includes('rem') ? 16 : 1) }
  })

  for (const motion of MOTIONS) {
    const reduce = motion === 'reduce'
    for (const [tname, theme, dark] of THEMES) {
      LABEL = `${tname}${reduce ? ' · reduce' : ''}`
      const p = await open({ theme, dark, motion })
      const tk = await tokens(p)
      const enterDur = reduce ? tk.fast : tk.press
      if (tname === 'defecto claro' && !reduce) dato('tokens', `fast ${tk.fast}ms · press ${tk.press}ms · slow ${tk.slow}ms`)

      /* N1 · nacer por primera vez, sin elemento en uso (sin tamaño medido todavía) */
      await blur(p)
      const n1 = await rec(p, 520, `() => window.gStatus.info('n1', 'Mantenimiento programado esta noche', { description: 'De 23:00 a 23:30.' })`)
      {
        const v = vis(n1); const end = last(n1)
        const fade = anim(n1, 'opacity')[0]; const sc = anim(n1, 'scale')[0]
        contrato(ran(n1, 'opacity') && (!fade || Math.abs(fade.dur - enterDur) <= 1), `nacer (1.ª vez): fundido en ${reduce ? 'duration-fast' : 'duration-press'} (${fade ? fade.dur + 'ms' : ran(n1, 'opacity') ? 'por suceso' : 'sin fundido'})`)
        if (!reduce) contrato(ran(n1, 'scale') && (!sc || (/0\.86/.test(sc.from) && /cubic-bezier\(0\.23, 1, 0\.32, 1\)/.test(sc.easing))), `nacer (1.ª vez): escala desde 0,86 con ease-out (${sc ? sc.from + ' · ' + sc.easing : ran(n1, 'scale') ? 'por suceso' : 'sin escala'})`)
        else contrato(!ran(n1, 'scale'), 'nacer (1.ª vez) con reduce: sin escala')
        dato('nacer · opacidad del primer cuadro visible', `${fmt(v[0] && v[0].op, 2)} a los ${fmt(v[0] && v[0].t)}ms`)
        const sizeA = anim(n1, SIZE)
        const sv = seenF(n1)
        const maxDev = Math.max(...sv.map((f) => Math.abs(f.lw - end.lw)))
        contrato(maxDev <= 2, `nacer (1.ª vez): solo fundido y escala, sin cambio de tamaño (transiciones de tamaño: ${sizeA.map((a) => a.what + ' ' + a.from + '→' + a.to).join(', ') || 'ninguna'}; anchos que se ven ${sv.map((f) => f.lw).filter((x, i, a) => a.indexOf(x) === i).slice(0, 4).join(' → ')}, final ${end.lw})`)
        dato('nacer 1.ª vez · anchos de caja por cuadro', v.map((f) => `${fmt(f.t)}ms ${f.lw}px op ${fmt(f.op, 2)}`).slice(0, 7).join(' · '))
        const opDone = settle(v, 'op', 1, 0.01)
        dato('nacer · opacidad ≥ 0,99 a los', `${fmt(opDone !== null && v[0] ? opDone - v[0].t : null)}ms del primer cuadro visible (op por cuadro: ${v.slice(0, 5).map((f) => fmt(f.op, 2)).join(' ')})`)
      }
      await wait(p)

      /* V1 · vaciarse desde compacta */
      const v1 = await rec(p, 360, `() => window.gStatus.clear()`)
      {
        const fade = anim(v1, 'opacity')[0]
        const fading = v1.fr.filter((f) => f.ph === 'raf' && f.hid && f.disp !== 'none')
        const gone = v1.fr.find((f) => f.ph === 'raf' && f.disp === 'none')
        contrato(ran(v1, 'opacity') && (!fade || Math.abs(fade.dur - tk.fast) <= 1) && fading.length > 0, `vaciarse: fundido de duration-fast (${fade ? fade.dur + 'ms' : 'sin fundido'}; ${fading.length} cuadros visibles fundiéndose)`)
        contrato(gone && gone.t < 260, `vaciarse: la forma termina en display none (a los ${fmt(gone && gone.t)}ms)`)
        mejora(fading.every((f) => f.sum), `vaciarse: la píldora se funde con su contenido (cuadros de fundido sin resumen: ${fading.filter((f) => !f.sum).length} de ${fading.length}, caja ${fading[0] ? fading[0].lw + '×' + fading[0].lh : '—'} vacía)`)
      }
      await wait(p)

      /* N2 · nacer otra vez: la forma conserva el tamaño de la anterior */
      await blur(p)
      const n2 = await rec(p, 520, `() => window.gStatus.info('n2', 'Sin conexión')`)
      {
        const v = seenF(n2); const end = last(n2)
        const sizeA = anim(n2, SIZE)
        const dx = Math.max(...v.map((f) => Math.abs(f.cx - end.cx)))
        contrato(Math.max(...v.map((f) => Math.abs(f.lw - end.lw))) <= 2, `nacer (con tamaño previo): sin cambio de tamaño (anchos que se ven ${v.map((f) => f.lw).filter((x, i, a) => a.indexOf(x) === i).slice(0, 4).join(' → ')}; ${sizeA.length} transiciones de tamaño)`)
        dato('nacer con tamaño previo', `caja ${v[0] && v[0].lw}→${end.lw}px; el borde inicial se desplaza ${fmt(Math.max(...v.map((f) => Math.abs(f.left - end.left))))}px; centro Δ ${fmt(dx, 1)}px`)
      }
      await wait(p)

      /* T · toque: llega otra con la isla visible */
      const t1 = await rec(p, 560, `() => window.gStatus.warning('t1', 'La sesión está por caducar')`)
      {
        const nud = anim(t1, 'g-status-nudge')[0]
        const seen = t1.fr.some((f) => f.nudge) || t1.ev.some((e) => e.what === 'g-status-nudge'); const after = last(t1).nudge
        if (!reduce) {
          contrato(seen && ran(t1, 'g-status-nudge') && (!nud || (Math.abs(nud.dur - tk.slow) <= 1 && isSpring(nud.easing))), `toque: is-nudge y g-status-nudge en duration-slow con el muelle (${nud ? nud.dur + 'ms ' + (isSpring(nud.easing) ? 'muelle' : nud.easing) : ran(t1, 'g-status-nudge') ? 'por suceso' : 'sin animación'})`)
          const minSc = Math.min(...t1.fr.map((f) => f.sc)); const maxSc = Math.max(...t1.fr.map((f) => f.sc))
          contrato(!nud || /0\.86/.test(nud.from), `toque: parte de 0,86 (fotograma clave ${nud ? nud.from : '—'}; mínimo medido en cuadros ${fmt(minSc, 3)}; pico ${fmt(maxSc, 3)})`)
          const off = t1.fr.find((f, i) => i > 0 && t1.fr[i - 1].nudge && !f.nudge)
          contrato(!after && off, `toque: la clase se retira en animationend (a los ${fmt(off && off.t)}ms)`)
          dato('toque', `escala ${fmt(minSc, 3)} → pico ${fmt(maxSc, 3)} → 1; clase retirada a los ${fmt(off && off.t)}ms`)
        } else {
          contrato(!ran(t1, 'g-status-nudge') && !after, `toque con reduce: sin animación y la clase no se queda (${nud ? 'anima' : 'sin animación'}, is-nudge al final ${after})`)
        }
      }
      await wait(p)

      /* A · compacta → abierta */
      const a1 = await rec(p, 520, `() => window.gStatus.open()`)
      {
        const end = last(a1); const v = vis(a1); const start = a1.fr[0]
        const wA = anim(a1, /^(width|inline-size)$/)[0]; const hA = anim(a1, /^(height|block-size)$/)[0]
        const tops = [...new Set(v.map((f) => fmt(f.top, 1)))]
        contrato(tops.length === 1, `abrir: el borde superior no se mueve (top ${tops.join(', ')})`)
        if (!reduce) {
          contrato(wA && hA && isSpring(wA.easing) && Math.abs(wA.dur - tk.slow) <= 1, `abrir: ancho y alto con --g-ease-spring en duration-slow (${wA ? wA.dur + 'ms ' + (isSpring(wA.easing) ? 'muelle' : wA.easing) : 'sin transición'})`)
          const maxH = Math.max(...v.map((f) => f.lh)); const over = (maxH - end.lh) / Math.max(1, end.lh - start.lh)
          contrato(over <= 0.045, `abrir: sobrepaso ≤ 4,5 % (${fmt(over * 100, 1)} %)`)
          const st = settle(v, 'lh', end.lh, 1)
          dato('abrir (compacta → abierta)', `${start.lw}×${start.lh} → ${end.lw}×${end.lh}, asienta (±1px) a los ${fmt(st)}ms, sobrepaso ${fmt(over * 100, 1)} %`)
          const liA = anim(a1, 'opacity', 'g-status-item')[0]; const footA = anim(a1, 'opacity', 'g-status-island__foot')[0]
          const bxs = v.filter((f) => f.bx !== null).map((f) => f.bx)
          dato('abrir · la insignia del resumen viaja', `${fmt(Math.max(...bxs) - Math.min(...bxs))}px en horizontal (va pegada al inicio de la forma, que crece desde el centro)`)
          contrato(liA && footA && liA.dur === tk.press && footA.delay > 0, `abrir: el contenido cae en cascada (aviso ${liA ? liA.dur + 'ms' : '—'}, pie con retardo ${footA ? fmt(footA.delay) + 'ms' : '—'})`)
        } else {
          contrato(!wA && !hA, 'abrir con reduce: la forma salta a su tamaño (sin transición de tamaño)')
          const liA = anim(a1, 'opacity', 'g-status-item')[0]
          contrato(liA && Math.abs(liA.dur - tk.fast) <= 1 && !anim(a1, 'translate', 'g-status-item').length, `abrir con reduce: el contenido solo se funde en duration-fast (${liA ? liA.dur : '—'}ms)`)
        }
      }
      await wait(p)

      /* R1 · abierta → compacta con Esc */
      await p.evaluate(() => document.querySelector('.g-status-island__summary').focus())
      const r1 = await recAround(p, 520, () => p.keyboard.press('Escape'))
      {
        const end = last(r1); const v = vis(r1)
        const firstC = r1.fr.find((f) => f.ph === 'raf' && f.form !== 'open')
        dato('replegar (Esc) · el panel desaparece', `${firstC && firstC.panel === 'h' ? 'en el primer cuadro, sin fundido' : 'con fundido'}`)
        mejora(!firstC || firstC.panel !== 'h' || firstC.panelOp !== null, 'replegar: el contenido del panel se funde al salir (hoy desaparece en el primer cuadro)')
        if (!reduce) {
          const minH = Math.min(...v.map((f) => f.lh))
          mejora(minH >= end.lh - 0.5, `replegar a compacta: el muelle no pasa por debajo del alto de la compacta (mínimo ${minH}px, compacta ${end.lh}px: el resumen se recorta ${fmt(end.lh - minH)}px)`)
          const st = settle(v, 'lh', end.lh, 1)
          dato('replegar (abierta → compacta)', `asienta (±1px) a los ${fmt(st)}ms; mínimo ${minH}px frente a ${end.lh}px`)
        }
        contrato(end.form === 'compact', `Esc: vuelve a compacta (${end.form})`)
      }
      await wait(p)

      /* R2 · pulsar fuera */
      await p.evaluate(() => window.gStatus.open()); await wait(p)
      const r2 = await recAround(p, 420, () => p.mouse.click(40, 860))
      contrato(last(r2).form === 'compact', `pulsar fuera: repliega (${last(r2).form})`)
      await wait(p)

      /* R3 · «Entendido» (clic real) → punto */
      await p.evaluate(() => window.gStatus.open()); await wait(p)
      const r3 = await recAround(p, 560, () => p.click('.g-status-island__ack'))
      {
        const end = last(r3); const v = vis(r3)
        contrato(end.form === 'dot', `«Entendido»: punto (${end.form})`)
        if (!reduce) {
          const minW = Math.min(...v.map((f) => f.lw)); const minH = Math.min(...v.map((f) => f.lh))
          const st = settle(v, 'lw', end.lw, 1)
          const bxs = v.filter((f) => f.bx !== null).map((f) => f.bx)
          const travel = Math.max(...bxs.map((x) => Math.abs(x - end.bx)))
          mejora(travel <= 2, `replegar a punto: la insignia no cruza la isla (viaja ${fmt(travel)}px desde la esquina de la caja hasta el centro)`)
          mejora(minW >= end.lw - 0.5 && minH >= end.lh - 0.5, `replegar a punto: el muelle no encoge el punto por debajo de su tamaño (mínimo ${minW}×${minH}px, punto ${end.lw}×${end.lh}, insignia ${end.badgeW}px: ${minW < end.badgeW ? 'la insignia queda recortada y el círculo se vuelve óvalo' : 'sin recorte'})`)
          dato('replegar (abierta → punto)', `${v[0] && v[0].lw}×${v[0] && v[0].lh} → ${end.lw}×${end.lh}, asienta a los ${fmt(st)}ms; mínimo ${minW}×${minH}px`)
        }
      }
      await wait(p)

      /* P · el punto: apariencia, señales de que se pulsa, contraste */
      {
        await p.mouse.move(1270, 890); await wait(p, 200)
        const dot = await p.evaluate(() => {
          const sh = document.querySelector('.g-status-island__shape'); const sum = document.querySelector('.g-status-island__summary'); const bd = sum.querySelector('.g-status-island__badge')
          const cs = getComputedStyle(sum); const r = sh.getBoundingClientRect()
          return { w: r.width, h: r.height, sumW: sum.offsetWidth, sumH: sum.offsetHeight, badge: bd.offsetWidth, cursor: cs.cursor, title: sum.getAttribute('title') || sh.getAttribute('title'), name: sum.textContent.trim(), bg0: cs.backgroundColor }
        })
        const box = await p.evaluate(() => { const r = document.querySelector('.g-status-island__summary').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2] })
        await p.mouse.move(box[0], box[1]); await wait(p, 700)
        const hov = await p.evaluate(() => {
          const sum = document.querySelector('.g-status-island__summary')
          const tips = [...document.querySelectorAll('[role="tooltip"], .g-tooltip, .g-visual-tip, [data-g-visual-tip]')].filter((e) => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && parseFloat(getComputedStyle(e).opacity) > 0)
          const isl = document.querySelector('.g-status-island')
          return { bg: getComputedStyle(sum).backgroundColor, tips: tips.length, form: isl.dataset.form }
        })
        await p.mouse.move(1270, 890)
        contrato(dot.cursor === 'pointer', `punto: cursor de mano (${dot.cursor})`)
        contrato(hov.bg !== dot.bg0, `punto: el resumen cambia al pasar (velo: ${dot.bg0} → ${hov.bg})`)
        contrato(dot.sumW >= 24 && dot.sumH >= 24, `punto: diana ${dot.sumW}×${dot.sumH} ≥ 24`)
        contrato(/Estado/.test(dot.name), `punto: conserva el nombre accesible («${dot.name.slice(0, 50)}…»)`)
        mejora(!!dot.title || hov.tips > 0 || hov.form !== 'dot', `punto: al pasar o enfocar dice qué es (title ${dot.title ? 'sí' : 'no'}, pistas visibles ${hov.tips}, forma al pasar ${hov.form})`)
        dato('punto', `${fmt(dot.w)}×${fmt(dot.h)}px, insignia ${dot.badge}px, cursor ${dot.cursor}, pista al pasar: ${hov.tips ? 'sí' : 'ninguna'}, cambia de forma al pasar: ${hov.form !== 'dot' ? 'sí' : 'no'}`)
        // Contraste del punto: isla frente a la página (componente gráfico ≥ 3), icono frente al relleno, anillo frente a la isla
        const c = await p.evaluate(() => {
          const cv = document.createElement('canvas'); cv.width = cv.height = 1; const x = cv.getContext('2d', { willReadFrequently: true })
          const rgb = (col) => { x.clearRect(0, 0, 1, 1); x.fillStyle = '#fff'; x.fillRect(0, 0, 1, 1); x.fillStyle = col; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]] }
          const sh = document.querySelector('.g-status-island__shape'); const bd = document.querySelector('.g-status-island__summary .g-status-island__badge')
          const page = getComputedStyle(document.body).backgroundColor
          return { page: rgb(page !== 'rgba(0, 0, 0, 0)' ? page : getComputedStyle(document.documentElement).backgroundColor), island: rgb(getComputedStyle(sh).backgroundColor), fill: rgb(getComputedStyle(bd).backgroundColor), icon: rgb(getComputedStyle(bd).color), ring: rgb(getComputedStyle(bd).borderTopColor) }
        })
        const rIsl = ratio(c.island, c.page); const rIcon = ratio(c.icon, c.fill); const rRing = ratio(c.ring, c.island); const rFill = ratio(c.fill, c.island)
        contrato(rIsl >= 3 && rIcon >= 3 && rRing >= 3, `punto: isla/página ${fmt(rIsl, 2)}, icono/relleno ${fmt(rIcon, 2)}, anillo/isla ${fmt(rRing, 2)} ≥ 3`)
        dato('punto · contraste', `isla/página ${fmt(rIsl, 2)} · icono/relleno ${fmt(rIcon, 2)} · anillo/isla ${fmt(rRing, 2)} · relleno/isla ${fmt(rFill, 2)} (informativo)`)
      }

      /* D · punto → compacta: llega otra */
      const d1 = await rec(p, 520, `() => window.gStatus.info('d1', 'Otra condición nueva')`)
      {
        const end = last(d1)
        contrato(end.form === 'compact', `punto → compacta al llegar otra (${end.form})`)
        if (!reduce) contrato(anim(d1, /^(width|inline-size)$/).some((a) => isSpring(a.easing)) && anim(d1, 'g-status-nudge').length, 'punto → compacta: cambio de forma con el muelle y toque')
      }
      await wait(p)

      /* V2 · vaciarse desde abierta */
      await p.evaluate(() => window.gStatus.open()); await wait(p)
      const v2 = await rec(p, 360, `() => window.gStatus.clear()`)
      {
        const fading = v2.fr.filter((f) => f.ph === 'raf' && f.hid && f.disp !== 'none')
        mejora(fading.every((f) => f.sum || f.lh <= 60), `vaciarse desde abierta: no queda una caja vacía fundiéndose (${fading.length} cuadros de ${fading[0] ? fading[0].lw + '×' + fading[0].lh : '—'}px sin contenido)`)
        dato('vaciarse desde abierta', `${fading.length} cuadros de una caja vacía de ${fading[0] ? fading[0].lw + '×' + fading[0].lh : '—'}px fundiéndose`)
      }
      await wait(p)

      /* E1 · error sin elemento en uso: nace y se abre solo */
      await blur(p)
      const e1 = await rec(p, 520, `() => window.gStatus.error('e1', 'No se pudo guardar la factura', { description: 'El servidor no respondió.', action: { label: 'Reintentar', onClick: () => {} } })`)
      {
        const v = vis(e1); const end = last(e1)
        contrato(end.form === 'open', `error sin elemento en uso: se abre solo (${end.form})`)
        contrato(ran(e1, 'opacity'), `error sin elemento en uso: nace con fundido (${ran(e1, 'opacity') ? 'sí' : 'no'}; opacidad del primer cuadro ${fmt(v[0] && v[0].op, 2)})`)
        contrato(Math.max(...seenF(e1).map((f) => Math.abs(f.lh - end.lh))) <= 2, `error sin elemento en uso: nace ya con su tamaño (altos que se ven ${seenF(e1).map((f) => f.lh).filter((x, i, a) => a.indexOf(x) === i).slice(0, 4).join(' → ')}; ${anim(e1, SIZE).map((a) => a.what + ' ' + a.from + '→' + a.to).join(', ') || 'sin transición de tamaño'})`)
      }
      await p.evaluate(() => window.gStatus.clear()); await wait(p, 450)

      /* E2 · error con el foco en «Guardar» (el elemento en uso): la isla mide su rectángulo abierto antes de pintar */
      await p.evaluate(() => { const bt = document.querySelector('#st-save'); window.scrollBy(0, bt.getBoundingClientRect().top - 640); bt.focus() })
      await wait(p, 200)
      const e2 = await rec(p, 520, `() => window.gStatus.error('e2', 'No se pudo guardar la factura', { description: 'El servidor no respondió.', action: { label: 'Reintentar', onClick: () => {} } })`)
      {
        const v = vis(e2); const end = last(e2)
        contrato(end.form === 'open', `error con elemento en uso que no tapa: se abre solo (${end.form})`)
        contrato(ran(e2, 'opacity'), `error con elemento en uso: nace con fundido (opacidad del primer cuadro ${fmt(v[0] && v[0].op, 2)}, ${ran(e2, 'opacity') ? 'con transición de opacidad' : cancelled(e2, 'opacity') ? 'la transición de opacidad empieza y se cancela' : 'sin transición de opacidad'})`)
        if (!reduce) contrato(ran(e2, 'scale'), `error con elemento en uso: nace con la escala desde 0,86 (${ran(e2, 'scale') ? 'sí' : 'no: aparece de golpe'})`)
        contrato(Math.max(...seenF(e2).map((f) => Math.abs(f.lh - end.lh))) <= 2, `error con elemento en uso: nace ya con su tamaño (altos que se ven ${seenF(e2).map((f) => f.lh).filter((x, i, a) => a.indexOf(x) === i).slice(0, 4).join(' → ')}; ${anim(e2, SIZE).map((a) => a.what + ' ' + a.from + '→' + a.to).join(', ') || 'sin transición de tamaño'})`)
        dato('error con elemento en uso · primeros cuadros', v.slice(0, 4).map((f) => `${fmt(f.t)}ms op ${fmt(f.op, 2)} esc ${fmt(f.sc, 2)} ${f.lw}×${f.lh}`).join(' · '))
      }
      await p.evaluate(() => window.gStatus.clear()); await wait(p, 450)

      /* E3 · el caso real: clic en «Guardar» con el servidor fallando (WebKit no enfoca el botón: el último pointerdown) */
      if (!theme && !dark) {
        await p.evaluate(() => { document.activeElement && document.activeElement.blur(); const bt = document.querySelector('#st-save'); window.scrollBy(0, bt.getBoundingClientRect().top - 640) })
        await wait(p, 200)
        const e3 = await recAround(p, 700, () => p.click('#st-save'))
        const v = vis(e3); const end = last(e3)
        contrato(end.form === 'open' && ran(e3, 'opacity'), `clic real en «Guardar»: se abre sola y nace con fundido (${ran(e3, 'opacity') ? 'sí' : 'no'}; opacidad del primer cuadro ${fmt(v[0] && v[0].op, 2)})`)
        dato('clic real en «Guardar» · primeros cuadros', v.slice(0, 3).map((f) => `op ${fmt(f.op, 2)} esc ${fmt(f.sc, 2)} ${f.lw}×${f.lh}`).join(' · '))
        await p.evaluate(() => window.gStatus.clear()); await wait(p, 450)
      }

      /* Comparación: entrada de un GToast */
      if (tname === 'defecto claro') {
        const toast = await p.evaluate(() => new Promise((res) => {
          const t0 = performance.now(); const fr = []
          window.toaster.info('Guardado')
          const f = () => {
            const el = [...document.querySelectorAll('.g-toast')].pop()
            if (el) { const cs = getComputedStyle(el); fr.push({ t: performance.now() - t0, op: parseFloat(cs.opacity), tr: cs.translate }) }
            if (performance.now() - t0 < 400) requestAnimationFrame(f); else res(fr)
          }
          requestAnimationFrame(f)
        }))
        const v = toast.filter((f) => f.op > 0)
        dato(`GToast · entrada${reduce ? ' (reduce)' : ''}`, toast.slice(0, 6).map((f) => `${fmt(f.t)}ms op ${fmt(f.op, 2)} ${f.tr}`).join(' · ') + (v.length ? '' : ' (sin cuadros visibles)'))
        await p.evaluate(() => window.toaster.clear && window.toaster.clear())
      }
      await p.context().close()
    }
  }
  await b.close()
}

/* ---------- Tiras de cuadros (Chromium, defecto claro): lo que ve la persona, cuadro a cuadro ---------- */
if (args.film && ENGINES.includes('chromium')) {
  ENGINE = 'chromium'; LABEL = 'tiras'
  const b = await pw.chromium.launch()
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 })
  const p = await ctx.newPage()
  await p.addInitScript(() => { try { localStorage.setItem('grana-playground', JSON.stringify({ scheme: 'light', themed: false })) } catch {} })
  await p.goto(`${PLAY}?status=none`)
  await p.waitForFunction(() => window.gStatus && document.querySelector('.g-status-island.is-ready'))
  await p.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
  await p.evaluate(() => Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]))
  await p.waitForTimeout(300)
  const cdp = await ctx.newCDPSession(p)
  const film = async (name, title, prepare, act, ms = 420) => {
    if (prepare) { await prepare(); await p.waitForTimeout(450) }
    const frames = []
    const on = async (f) => { frames.push({ data: f.data, ts: f.metadata.timestamp }); try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }) } catch {} }
    cdp.on('Page.screencastFrame', on)
    await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1 })
    await p.waitForTimeout(150)
    const t0 = Date.now() / 1000
    await act()
    await p.waitForTimeout(ms)
    await cdp.send('Page.stopScreencast')
    cdp.off('Page.screencastFrame', on)
    const after = frames.filter((f) => f.ts >= t0 - 0.002).slice(0, 12)
    const html = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#f4f4f4;font:13px system-ui;color:#111">
      <div style="padding:10px 12px;font-weight:600">${title}</div>
      <div style="display:grid;grid-template-columns:repeat(4,340px);gap:8px;padding:0 12px 12px">
      ${after.map((f) => `<figure style="margin:0"><div style="width:340px;height:150px;overflow:hidden;background:#fff;border:1px solid #ccc"><img src="data:image/png;base64,${f.data}" style="width:640px;margin:-20px 0 0 -150px"></div><figcaption>+${Math.round((f.ts - t0) * 1000)} ms</figcaption></figure>`).join('')}
      </div></body>`
    const q = await ctx.newPage()
    await q.setViewportSize({ width: 1400, height: 200 })
    await q.setContent(html)
    await q.waitForTimeout(200)
    const out = join(ROOT, `design/lab/alert/movimiento-${name}.png`)
    await q.screenshot({ path: out, fullPage: true })
    await q.close()
    dato('tira', `${out.replace(ROOT, '')} (${after.length} cuadros)`)
  }
  await film('nacer-primera', 'Nacer por primera vez (sin tamaño medido): la barra ocupa todo el ancho y salta a píldora',
    null, () => p.evaluate(() => window.gStatus.info('f1', 'Mantenimiento programado esta noche', { description: 'De 23:00 a 23:30.' })))
  await film('error-con-guardar', 'Error al pulsar «Guardar»: la isla aparece abierta de golpe (sin fundido ni escala)',
    () => p.evaluate(() => { window.gStatus.clear(); const bt = document.querySelector('#st-save'); window.scrollBy(0, bt.getBoundingClientRect().top - 640) }),
    () => p.click('#st-save'))
  await film('entendido-punto', '«Entendido» → punto: el panel desaparece en el acto y el muelle encoge el punto por debajo de la insignia',
    () => p.evaluate(() => { window.gStatus.clear(); window.gStatus.warning('f3', 'La sesión está por caducar', { description: 'Guarda tu trabajo.' }); window.gStatus.open() }),
    () => p.click('.g-status-island__ack'))
  await film('vaciarse-abierta', 'Vaciarse desde abierta: el contenido se va en el acto y una caja vacía se funde',
    () => p.evaluate(() => { window.gStatus.clear(); window.gStatus.warning('f4', 'La sesión está por caducar', { description: 'Guarda tu trabajo.' }); window.gStatus.open() }),
    () => p.evaluate(() => window.gStatus.clear()), 260)
  await b.close()
}

server.close()

/* ---------- Informe ---------- */
const byKey = new Map()
for (const d of data) { const k = d.k; if (!byKey.has(k)) byKey.set(k, []); byKey.get(k).push(d) }
console.log('\nDatos')
for (const [k, rows] of byKey) {
  console.log(`  ${k}`)
  const uniq = new Map()
  for (const r of rows) { const key = r.v; if (!uniq.has(key)) uniq.set(key, []); uniq.get(key).push(`${r.engine} ${r.label}`) }
  for (const [v, who] of uniq) console.log(`    ${v}   [${who.length > 4 ? who.slice(0, 3).join('; ') + `; +${who.length - 3}` : who.join('; ')}]`)
}
const group = (list) => {
  const m = new Map()
  for (const f of list) { const msg = f.replace(/^\[[^\]]+\] /, '').replace(/ \([^()]*\)$/, ''); const who = f.match(/^\[([^\]]+)\]/)[1]; if (!m.has(msg)) m.set(msg, { ex: f, who: [] }); m.get(msg).who.push(who) }
  return [...m.values()]
}
for (const kind of ['contrato', 'mejora']) {
  const [n, bad] = tally[kind]
  console.log(`\n${kind === 'contrato' ? 'Contrato' : 'Mejoras (dentro del contrato)'}: ${n - bad}/${n} se cumplen`)
  for (const g of group(fails[kind])) {
    const eng = ['chromium', 'firefox', 'webkit'].map((e) => `${e} ${g.who.filter((w) => w.startsWith(e)).length}`).join(', ')
    console.log(`  ${kind === 'contrato' ? 'DEFECTO' : 'mejora'} ×${g.who.length} (${eng}): ${g.ex}`)
  }
}
process.exitCode = tally.contrato[1] ? 1 : 0
