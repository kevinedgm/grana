// Auditoría de coco (paso 5) sobre el GStack REAL (GStack.vue de bruno, principal) en design/lab/stack/auditoria-banco.html
// con GSurface, GCard, GBadge, GBtn y GTooltip reales de dist/. Tema por defecto, generados claro y oscuro, uno del CLI y el de
// prueba (space 5, borde 2 px). Mide: separación por gap y density con el space de cada tema; una sola fuente de aire
// (márgenes de hijos a 0); divided (línea en cada visible salvo el primero, hidden ignorado, 2 × gap + borde, contraste de la
// línea anotado); divided con hijos con superficie propia (no se les toca la caja) y con borde propio de la aplicación;
// horizontal que se parte a 320 sin desbordar; alineaciones lógicas en RTL; GTooltip hijo; forced-colors; consola limpia.
// Requiere dist/ (npm run build). Desde la raíz:  GRANA_PW_PORT=4215 node design/lab/stack/auditoria-verificar.mjs
import { pw, serve, stop, open, close, ok, note, near, report, settle, rect, overflowX, ENGINES, setEngine } from '../app-shell/auditoria-comun.mjs'

const ORIGIN = await serve()
const URL0 = ORIGIN + '/design/lab/stack/auditoria-banco.html'
const READY = () => window.__ready && document.querySelector('.g-stack')
const THEMES = [['', false], ['', true], ['spotify', false], ['spotify', true], ['cli:grana', false], ['cli:grana', true], ['prueba', false], ['prueba', true]]

const kids = (p, id) => p.evaluate((id) => [...document.getElementById(id).children].filter((e) => !e.hidden && !e.classList.contains('g-tooltip')).map((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, mt: parseFloat(cs.marginTop), mb: parseFloat(cs.marginBottom), bt: parseFloat(cs.borderTopWidth), bts: cs.borderTopStyle, btc: cs.borderTopColor, pt: parseFloat(cs.paddingTop), pb: parseFloat(cs.paddingBottom), cls: e.className } }), id)

for (const eng of ENGINES) {
  setEngine(eng)
  const b = await pw[eng].launch()
  const E = (m) => `${eng} ${m}`
  for (const [theme, dark] of THEMES) {
    const lab = `${theme || 'defecto'} ${dark ? 'oscuro' : 'claro'}`
    const p = await open(b, URL0, { ready: READY, theme, dark }); p.__eng = eng
    const s = await p.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-space-1')))
    const bw = await p.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-border-width')))
    for (const [g, f] of [['sm', 3], ['md', 6], ['lg', 12], ['none', 0]]) {
      const k = await kids(p, 'g-' + g)
      const gaps = k.slice(1).map((x, i) => +(x.top - k[i].bottom).toFixed(2))
      ok(gaps.every((v) => near(v, s * f, 0.5)) && k.every((x) => x.mt === 0 && x.mb === 0), E(`${lab}: gap ${g} = ${s * f} y márgenes de los hijos (p, h3) en 0`), gaps.join(','))
    }
    for (const [d, f] of [['comfortable', 0.875], ['compact', 0.75]]) {
      const k = await kids(p, 'd-' + d)
      ok(near(k[1].top - k[0].bottom, s * 6 * f, 0.5), E(`${lab}: density ${d} = ${s * 6 * f}`), `${k[1].top - k[0].bottom}`)
    }
    const dv = await kids(p, 'div')
    ok(dv[0].bt === 0 && dv.slice(1).every((x) => near(x.bt, bw, 0.1) && x.bts === 'solid'), E(`${lab}: divided, línea (${bw} px) en cada visible salvo el primero; el hidden no cuenta`), dv.map((x) => x.bt).join(','))
    const dist = dv.slice(1).map((x, i) => +(x.top + x.bt + x.pt - dv[i].bottom).toFixed(2))
    ok(dist.every((v) => near(v, 2 * s * 6 + bw, 0.6)), E(`${lab}: divided, entre contenidos 2 × gap + línea`), dist.join(','))
    const line = await p.evaluate(() => { const e = document.getElementById('div').children[1]; return window.__pair(getComputedStyle(e).borderTopColor, e) })
    note(`${eng} ${lab}: línea de divided contra la página ${line.toFixed(2)}:1 (decorativa: la separación también la da el aire)`)
    // divided con hijos con superficie propia: la pila no toca su caja (borde y relleno de la superficie)
    const sf = await kids(p, 'div-surf')
    const ref = await kids(p, 'gap-surf')
    ok(sf.slice(0, 2).every((x) => near(x.pt, ref[0].pt, 0.1) && x.btc === ref[0].btc && near(x.bt, ref[0].bt, 0.1)), E(`${lab}: divided con GSurface hijas: relleno y borde de arriba de la superficie intactos`), sf.map((x) => `${x.pt}/${x.btc}`).join(' · '))
    ok(near(sf[1].top - sf[0].bottom, s * 6, 0.5) && near(sf[2].top - sf[1].bottom, s * 6, 0.5), E(`${lab}: divided con superficies: las separa el gap`), `${sf[1].top - sf[0].bottom}`)
    const card = await p.evaluate(() => { const c = document.getElementById('dc3'); const cs = getComputedStyle(c); const ref = document.createElement('div'); return { pt: cs.paddingTop, btc: cs.borderTopColor, blc: cs.borderLeftColor } })
    ok(card.btc === card.blc, E(`${lab}: divided con GCard hija: su borde de arriba es el de sus otros lados`), JSON.stringify(card))
    const own = await kids(p, 'div-own')
    note(`${eng} ${lab}: hijo con borde superior propio de la aplicación (sin capa): borde ${own[1].bt} px y relleno ${own[1].pt} px suyos (la aplicación gana, #516)`)
    ok(near(own[1].bt, 3) && near(own[1].pt, 6), E(`${lab}: divided, un borde propio de la aplicación sin capa gana`))
    await close(p, lab)
  }

  // Horizontal que se parte, alineaciones lógicas, GTooltip hijo (tema por defecto, LTR y RTL)
  for (const dir of ['ltr', 'rtl']) {
    const p = await open(b, URL0 + (dir === 'rtl' ? '?dir=rtl' : ''), { ready: READY }); p.__eng = eng
    const row = await kids(p, 'row')
    const lines = [...new Set(row.map((x) => Math.round(x.top)))]
    const box = await rect(p, '#row')
    ok(lines.length >= 2 && row.every((x) => x.left >= box.left - 0.5 && x.right <= box.right + 0.5), E(`${dir}: horizontal en 320 px se parte en ${lines.length} filas sin desbordar`))
    const rowGap = await p.evaluate(() => getComputedStyle(document.getElementById('row')).rowGap)
    ok(rowGap === '12px', E(`${dir}: misma separación entre filas (sm)`), rowGap)
    const start = dir === 'rtl' ? box.right - Math.max(...row.filter((x) => Math.round(x.top) === lines[0]).map((x) => x.right)) : Math.min(...row.filter((x) => Math.round(x.top) === lines[0]).map((x) => x.left)) - box.left
    ok(near(start, 0), E(`${dir}: la fila empieza al inicio lógico`), `${start}`)
    const re = await kids(p, 'row-end'), rb = await rect(p, '#row-end')
    ok(dir === 'rtl' ? near(Math.min(...re.map((x) => x.left)), rb.left) : near(Math.max(...re.map((x) => x.right)), rb.right), E(`${dir}: horizontal="end" al final lógico`))
    const cs = await kids(p, 'col-start'), cb = await rect(p, '#col-start')
    ok(dir === 'rtl' ? near(cs[0].right, cb.right) && cs[0].left > cb.left + 50 : near(cs[0].left, cb.left) && cs[0].right < cb.right - 50, E(`${dir}: vertical horizontal="start" no estira y va al inicio lógico`))
    const t0 = await kids(p, 'tip')
    await p.hover('#tip-btn'); await settle(p, 900)
    const t1 = await kids(p, 'tip')
    const open1 = await p.evaluate(() => !!document.querySelector('#tip .g-tooltip'))
    const gp = (k) => [k[1].top - k[0].bottom, k[2].top - k[1].bottom].map((v) => +v.toFixed(2))
    ok(open1 && t1.length === 3 && gp(t1).every((v) => near(v, 24, 0.5)) && JSON.stringify(gp(t0)) === JSON.stringify(gp(t1)), E(`${dir}: con GTooltip hijo (abierto) la separación no cambia`), `${gp(t0)} → ${gp(t1)}`)
    ok(!(await overflowX(p)), E(`${dir}: sin desplazamiento horizontal`))
    await close(p, dir)
  }
  if (eng === 'chromium') {
    const p = await open(b, URL0, { ready: READY, forcedColors: 'active' }); p.__eng = eng
    const fc = await p.evaluate(() => { const e = document.getElementById('div').children[1]; const cs = getComputedStyle(e); return { w: parseFloat(cs.borderTopWidth), st: cs.borderTopStyle, c: cs.borderTopColor, canvas: getComputedStyle(document.body).backgroundColor } })
    ok(fc.w >= 1 && fc.st === 'solid' && fc.c !== fc.canvas, E('forced-colors: la línea de divided es un borde visible'), JSON.stringify(fc))
    await close(p, 'forced')
  }
  await b.close()
}
await stop()
process.exit(report('GStack · auditoría') ? 1 : 0)
