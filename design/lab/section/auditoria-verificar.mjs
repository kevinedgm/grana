// Auditoría de coco (paso 5) sobre el GSection REAL (GSection.vue de bruno, principal) en design/lab/section/auditoria-banco.html
// con GPageHeader, GStack, GSurface, GCard y GBtn reales de dist/, y dentro de GAppShell (packages/vue/playground/app-shell.html).
// Tema por defecto, generados claro y oscuro, uno del CLI, el de prueba (space 5, títulos serif, borde 2 px) y uno solo con
// títulos serif. Mide: anidación real h1 → h2 → h3 → h4 → h4; tamaño por profundidad con la escala de cada tema (el nivel
// fijado no lo cambia); familia de los títulos con --g-font-title serif (la pregunta abierta a lima); aire título → descripción
// → cuerpo; contraste del título y la descripción sobre página, superficie, hundida y tarjeta; acciones en fila y bajo el
// título a 320; título largo sin recortar; región con nombre solo con landmark; sin descripción ni acciones; #id bajo lo
// pegado del chasis; RTL; forced-colors; consola limpia. Captura de la familia de títulos (defecto ↔ serif).
// Requiere dist/ (npm run build). Desde la raíz:  GRANA_PW_PORT=4215 node design/lab/section/auditoria-verificar.mjs
import { pw, serve, stop, open, close, ok, note, near, report, settle, rect, sp, overflowX, ENGINES, setEngine, sideBySide } from '../app-shell/auditoria-comun.mjs'
import { fileURLToPath } from 'node:url'
import { rm } from 'node:fs/promises'

const ORIGIN = await serve()
const URL0 = ORIGIN + '/design/lab/section/auditoria-banco.html'
const SHELL = ORIGIN + '/packages/vue/playground/app-shell.html'
const HERE = fileURLToPath(new URL('./', import.meta.url))
const READY = () => window.__ready && document.querySelector('.g-section')
const THEMES = [['', false], ['', true], ['spotify', false], ['spotify', true], ['medium', false], ['medium', true], ['cli:grana', false], ['cli:grana', true], ['prueba', false], ['prueba', true], ['serif', false]]

const T = (p, id) => p.evaluate((id) => {
  const s = document.getElementById(id); const h = s.querySelector(':scope > .g-section__head .g-section__title'); const d = s.querySelector(':scope > .g-section__head .g-section__desc')
  const cs = getComputedStyle(h); const hr = h.getBoundingClientRect(); const dr = d && d.getBoundingClientRect(); const br = s.querySelector(':scope > .g-section__body').getBoundingClientRect(); const head = s.querySelector(':scope > .g-section__head').getBoundingClientRect()
  return { tag: h.tagName, cls: s.className, size: parseFloat(cs.fontSize), line: parseFloat(cs.lineHeight), weight: cs.fontWeight, fam: cs.fontFamily, dir: h.getAttribute('dir'), hb: hr.bottom, dt: dr && dr.top, db: dr && dr.bottom, headB: head.bottom, bodyT: br.top, tr: window.__textRatio(h), dr: d ? window.__textRatio(d) : null, dsize: d ? parseFloat(getComputedStyle(d).fontSize) : null }
}, id)
const ROOT_PX = (p, name) => p.evaluate((n) => { const d = document.createElement('div'); d.style.fontSize = `var(${n})`; document.body.appendChild(d); const v = parseFloat(getComputedStyle(d).fontSize); d.remove(); return v }, name)

for (const eng of ENGINES) {
  setEngine(eng)
  const b = await pw[eng].launch()
  const E = (m) => `${eng} ${m}`
  for (const [theme, dark] of THEMES) {
    const lab = `${theme || 'defecto'} ${dark ? 'oscuro' : 'claro'}`
    const p = await open(b, URL0, { ready: READY, theme, dark }); p.__eng = eng
    const s = await p.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-space-1')))
    const tsm = await ROOT_PX(p, '--g-text-title-sm-size'), tb = await ROOT_PX(p, '--g-text-body-size'), tbs = await ROOT_PX(p, '--g-text-body-sm-size')
    const fams = await p.evaluate(() => { const d = document.createElement('div'); document.body.appendChild(d); d.style.fontFamily = 'var(--g-font-title)'; const t = getComputedStyle(d).fontFamily; d.style.fontFamily = 'var(--g-font-ui)'; const u = getComputedStyle(d).fontFamily; d.remove(); return { t, u } })
    const [a1, a2, a3, a4, fx, cd] = [await T(p, 's1'), await T(p, 's2'), await T(p, 's3'), await T(p, 's4'), await T(p, 'sfix'), await T(p, 'scard')]
    ok([a1, a2, a3, a4].map((x) => x.tag).join(' ') === 'H2 H3 H4 H4', E(`${lab}: anidación real h2 → h3 → h4 → h4 bajo el h1 de GPageHeader`), [a1, a2, a3, a4].map((x) => x.tag).join(' '))
    ok(await p.evaluate(() => document.querySelectorAll('h1').length === 1 && !!document.querySelector('#ph h1')), E(`${lab}: un solo h1 (GPageHeader) encima`))
    ok(near(a1.size, tsm, 0.1) && near(a2.size, tb, 0.1) && near(a3.size, tbs, 0.1) && near(a4.size, tbs, 0.1), E(`${lab}: tamaño por profundidad ${tsm} › ${tb} › ${tbs} › ${tbs}`), [a1, a2, a3, a4].map((x) => x.size).join(' › '))
    ok(a1.size > a2.size && a2.size > a3.size && a3.size >= 14, E(`${lab}: el ojo y el esquema no se desalinean (estrictamente decreciente, suelo 14)`))
    ok([a1, a2, a3, a4].every((x) => x.weight === '600' && x.dir === 'auto'), E(`${lab}: peso 600 y dir="auto" en todos los títulos`))
    ok(fx.tag === 'H3' && /depth-2/.test(fx.cls) && near(fx.size, tb, 0.1), E(`${lab}: headingLevel 3 en profundidad 2 → h3 de 16`), `${fx.tag} ${fx.size}`)
    ok(cd.tag === 'H4' && /depth-1/.test(cd.cls) && near(cd.size, tsm, 0.1), E(`${lab}: headingLevel 4 fijado en profundidad 1 → h4 con el tamaño de la profundidad 1 (#196)`), `${cd.tag} ${cd.size}`)
    ok(a1.fam === fams.t && a2.fam === fams.u && a3.fam === fams.u, E(`${lab}: familia: profundidad 1 = --g-font-title, 2 y 3 = --g-font-ui`), `${a1.fam} | ${a2.fam}`)
    if (fams.t !== fams.u) {
      const ph = await p.evaluate(() => getComputedStyle(document.querySelector('#ph h1')).fontFamily)
      const card = await p.evaluate(() => getComputedStyle(document.querySelector('#card .g-card__title')).fontFamily)
      note(`${eng} ${lab} (títulos serif): h1 ${ph.split(',')[0]} · h2 ${a1.fam.split(',')[0]} · h3/h4 ${a2.fam.split(',')[0]} · título de GCard ${card.split(',')[0]} — la familia cambia entre h2 y h3`)
    }
    ok(near(a1.dt - a1.hb, s, 0.6) && near(a1.bodyT - a1.headB, s * 4, 0.6), E(`${lab}: aire título → descripción ${s} y cabecera → cuerpo ${s * 4}`), `${(a1.dt - a1.hb).toFixed(1)} / ${(a1.bodyT - a1.headB).toFixed(1)}`)
    const body = await p.evaluate(() => { const k = [...document.querySelector('#s1 > .g-section__body').children]; return k.slice(1).map((e, i) => e.getBoundingClientRect().top - k[i].getBoundingClientRect().bottom) })
    ok(body.every((v) => near(v, s * 6, 0.6)), E(`${lab}: entre hijos del cuerpo ${s * 6} (pila md)`), body.map((v) => v.toFixed(1)).join(','))
    for (const id of ['s1', 'ssurf', 'ssunk', 'scard']) {
      const x = id === 's1' ? a1 : await T(p, id)
      ok(x.tr >= 4.5 && x.dr >= 4.5, E(`${lab}: ${id} título ≥ 4,5:1 y descripción ≥ 4,5:1`), `${x.tr.toFixed(2)} / ${x.dr.toFixed(2)}`)
    }
    ok(a1.dsize >= 12, E(`${lab}: descripción ≥ 12 px`), `${a1.dsize}`)
    const act = await p.evaluate(() => { const g = document.querySelector('#s1 .g-section__actions'); const t = document.querySelector('#s1 .g-section__title').getBoundingClientRect(); const r = g.getBoundingClientRect(); return { role: g.getAttribute('role'), name: g.getAttribute('aria-label'), same: r.top < t.bottom } })
    ok(act.role === 'group' && act.name === 'Acciones de firmantes' && act.same, E(`${lab}: acciones en un grupo con nombre, en la fila del título`), JSON.stringify(act))
    ok(await p.evaluate(() => !document.querySelector('#sbare .g-section__desc') && !document.querySelector('#sbare .g-section__actions')), E(`${lab}: sin descripción ni acciones no se pintan`))
    ok(await p.evaluate(() => getComputedStyle(document.getElementById('s1')).backgroundColor.endsWith(', 0)') && getComputedStyle(document.getElementById('s1')).borderTopStyle === 'none'), E(`${lab}: la sección no tiene superficie`))
    await close(p, lab)
  }
  // Región con nombre, 320 px, RTL
  {
    const p = await open(b, URL0, { ready: READY }); p.__eng = eng
    const snap = await p.locator('#page').ariaSnapshot()
    const regions = (snap.match(/- region/g) || []).length
    ok(/- region "Región con nombre"/.test(snap) && regions === 1, E('landmark: una sola región, la que lo pide, con el nombre del título'), `${regions}`)
    await close(p, 'landmark')
  }
  for (const dir of ['ltr', 'rtl']) {
    const p = await open(b, URL0 + `?w=320${dir === 'rtl' ? '&dir=rtl' : ''}`, { ready: READY, vw: 320, vh: 640 }); p.__eng = eng
    const m = await p.evaluate(() => { const t = document.querySelector('#s1 .g-section__title').getBoundingClientRect(); const a = document.querySelector('#s1 .g-section__actions').getBoundingClientRect(); const lt = document.querySelector('#slong .g-section__title'); return { below: a.top >= t.bottom - 0.5, aR: a.right, aL: a.left, fit: lt.scrollWidth <= lt.clientWidth + 1, lines: Math.round(lt.getBoundingClientRect().height / parseFloat(getComputedStyle(lt).lineHeight)), align: getComputedStyle(lt).textAlign } })
    ok(m.below && m.aL >= 0 && m.aR <= 320, E(`320 ${dir}: las acciones bajan bajo el título sin desbordar`), JSON.stringify(m))
    ok(m.fit && m.lines >= 2, E(`320 ${dir}: el título largo se parte sin recortarse`), `${m.lines} líneas`)
    if (dir === 'rtl') { const tr = await rect(p, '#s1 .g-section__title'), hr = await rect(p, '#s1 > .g-section__head'); ok(near(tr.right, hr.right, 1), E('RTL: el título empieza a la derecha')) }
    ok(!(await overflowX(p)), E(`320 ${dir}: sin desplazamiento horizontal`))
    await close(p, `320 ${dir}`)
  }
  // Dentro de GAppShell: un #id de sección deja aire bajo lo pegado (scroll-padding del chasis + space × 4)
  {
    const p = await open(b, SHELL, { ready: () => document.getElementById('ph') && document.getElementById('ph').classList.contains('is-sticky') }); p.__eng = eng
    await p.evaluate(() => { location.hash = '#s3' }); await settle(p, 400)
    const top = (await rect(p, '#s3')).top, pad = await sp(p)
    const base = await rect(p, '#ph .g-page-header__base')
    ok(near(top, pad + 16, 1.5) && top >= base.bottom + 15, E('en GAppShell: #id de una sección queda bajo banda + zócalo con space × 4 de aire'), `${top} / scroll-padding ${pad}`)
    await close(p, 'shell #id')
  }
  if (eng === 'chromium') {
    const p = await open(b, URL0, { ready: READY, forcedColors: 'active' }); p.__eng = eng
    const fc = await p.evaluate(() => { const t = getComputedStyle(document.querySelector('#s1 .g-section__title')); const d = getComputedStyle(document.querySelector('#s1 .g-section__desc')); return { t: t.color, d: d.color, bg: getComputedStyle(document.body).backgroundColor } })
    ok(fc.t !== fc.bg && fc.d !== fc.bg, E('forced-colors: título y descripción con colores del sistema distintos del fondo'), JSON.stringify(fc))
    await close(p, 'forced')
    // Captura de la familia de los títulos: por defecto ↔ --g-font-title serif
    const shoot = async (theme, file) => { const q = await open(b, URL0, { ready: READY, theme, vw: 1000, vh: 760 }); await q.screenshot({ path: file }); await q.__ctx.close() }
    await shoot('', HERE + '.tmp-a.png'); await shoot('serif', HERE + '.tmp-b.png')
    await sideBySide(b, ORIGIN, HERE + '.tmp-a.png', HERE + '.tmp-b.png', HERE + 'auditoria-familia.png', ['GSection real · tema por defecto (title = ui)', 'GSection real · --g-font-title serif (h1 y h2 serif, h3 y h4 en ui)'])
    for (const n of ['a', 'b']) await rm(HERE + `.tmp-${n}.png`, { force: true })
    note('captura: design/lab/section/auditoria-familia.png')
  }
  await b.close()
}
await stop()
process.exit(report('GSection · auditoría') ? 1 : 0)
