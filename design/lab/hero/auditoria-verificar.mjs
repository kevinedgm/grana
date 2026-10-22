// Auditoría de coco (paso 5) de GHero sobre el COMPONENTE REAL (dist/hero.umd.js, packages/vue/playground/hero.html).
// Mide en Chromium, Firefox y WebKit: estático (GHero.css sin literales de color ni respaldos, GHero.vue sin <style>);
// contraste del texto en las tres apariencias con el tema por defecto, terracota, añil, pálida, stripe, apple, spotify y
// lustre, claro y oscuro; la pausa del vídeo sobre «cielo», «noche» y «papel picado» POR PÍXELES (relleno o contorno ≥ 3:1
// con la foto real de debajo) en A, B y C con cuatro temas, claro y oscuro, y su anillo de foco; el vano de A 4:5 con una
// foto vertical más alta que 4:5 y con vídeo (hallazgo H-A1); 1440, 390, 320 y 320×256 (zoom 400 %) en LTR y RTL sin
// desplazamiento horizontal; el fundido de B sin vacío y su duración (slow; reducido fast); la mirada (solo con soporte y
// sin reducido); foco visible en las vistas con Tab + flecha (WebKit con data-g-key-focus) y su contraste en la placa;
// puntero grueso (vistas y pausa ≥ 44 px); forced-colors (Chromium); consola limpia.
// Ejecutar desde la raíz con dist/ reconstruido:  node design/lab/hero/auditoria-verificar.mjs   (puerto GRANA_PW_PORT, 4244)
// Opcional: --engines=chromium  --verbose
import { pw, ENGINES, ok, note, report, serve, stop, opener, overflowX, rect, inter, settle, staticCheck } from './auditoria-comun.mjs'

await staticCheck('packages/vue/src/components/GHero/GHero.css', ['packages/vue/src/components/GHero/GHero.vue'])
const BASE = await serve()
const APPS = ['window', 'views', 'threshold']
const TEMAS = ['defecto', 'terracota', 'anil', 'palida', 'stripe', 'apple', 'spotify', 'lustre']

// Pausa por píxeles: el anillo de foto de 2 a 8 px alrededor del botón frente al relleno y al contorno del botón
async function pauseOverPhoto (p) {
  const r = await p.locator('.g-hero__motion').boundingBox()
  const pad = 9
  const shot = (await p.screenshot({ clip: { x: r.x - pad, y: r.y - pad, width: r.width + pad * 2, height: r.height + pad * 2 }, animations: 'disabled', scale: 'css' })).toString('base64')
  return p.evaluate(async ({ shot, w, h, pad }) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + shot; await img.decode()
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight
    const x = c.getContext('2d'); x.drawImage(img, 0, 0)
    const d = x.getImageData(0, 0, c.width, c.height).data
    const k = c.width / (w + pad * 2)
    const btn = document.querySelector('.g-hero__motion')
    const fill = window.__c.rgba(getComputedStyle(btn).backgroundColor)
    const edge = window.__c.rgba(getComputedStyle(btn).borderTopColor)
    let worst = Infinity, n = 0
    for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) {
      const cx = i / k - pad, cy = j / k - pad
      // Distancia al rectángulo del botón (en px CSS); se toma el anillo 3…8 px (fuera de la sombra cercana, dentro de la foto)
      const dx = Math.max(-cx, 0, cx - w), dy = Math.max(-cy, 0, cy - h)
      const dist = Math.hypot(dx, dy)
      if (dist < 3 || dist > 8) continue
      const o = (j * c.width + i) * 4
      const px = [d[o], d[o + 1], d[o + 2], 1]
      const best = Math.max(window.__c.ratio(fill, px), window.__c.ratio(edge, px))
      if (best < worst) worst = best
      n++
    }
    return { worst: +worst.toFixed(2), n, fill: window.__c.pair(getComputedStyle(btn).backgroundColor, getComputedStyle(btn).borderTopColor) }
  }, { shot, w: r.width, h: r.height, pad })
}

for (const eng of ENGINES) {
  const b = await pw[eng].launch()
  const open = await opener(b, BASE, eng)
  const E = (m) => `${eng} ${m}`
  // WebKit (macOS) solo recorre campos y enlaces con Tab: Opción+Tab es el recorrido completo de teclado
  const TAB = eng === 'webkit' ? 'Alt+Tab' : 'Tab'
  const close = async (p, label) => { ok(p.__errs.length === 0, E(`consola limpia (${label})`), p.__errs.slice(0, 2).join(' | ')); await p.__ctx.close() }

  /* 1 · Contraste del texto: tres apariencias × ocho temas × claro/oscuro */
  let minText = Infinity, minViewBorder = Infinity
  for (const a of APPS) for (const theme of TEMAS) for (const dark of [false, true]) {
    if (eng !== 'chromium' && !['defecto', 'terracota', 'spotify'].includes(theme)) continue
    const p = await open(`hero.html?c=${a}`, { theme, dark })
    const m = await p.evaluate(() => {
      const t = (s) => { const e = document.querySelector(s); return e ? window.__c.text(e) : null }
      const out = { eyebrow: t('.g-hero__eyebrow'), title: t('.g-hero__title'), lead: t('.g-hero__lead'), aside: t('.g-hero__aside'), credit: t('.g-hero__credit') }
      const views = [...document.querySelectorAll('.g-hero__view')]
      if (views.length) {
        out.viewLabel = Math.min(...views.map((v) => window.__c.text(v.querySelector('.g-hero__view-label'))))
        out.viewBorder = Math.min(...views.map((v) => window.__c.line(v, 'borderTopColor')))
        out.legend = t('.g-hero__views-legend')
      }
      return out
    })
    const L = `${a} ${theme} ${dark ? 'oscuro' : 'claro'}`
    for (const [k, v] of Object.entries(m)) {
      if (v === null || k === 'viewBorder') continue
      ok(v >= 4.5, E(`${L}: ${k} ≥ 4,5:1`), v)
      minText = Math.min(minText, v)
    }
    if (m.viewBorder !== undefined) { ok(m.viewBorder >= 3, E(`${L}: borde de la vista ≥ 3:1`), m.viewBorder); minViewBorder = Math.min(minViewBorder, m.viewBorder) }
    await close(p, L)
  }
  note(`${eng}: texto mínimo ${minText}:1; borde de vista mínimo ${minViewBorder}:1`)

  /* 2 · La pausa sobre fotos extremas, por píxeles (H-L14) */
  let minPause = Infinity
  for (const a of APPS) for (const photo of ['cielo', 'noche', 'papel-picado']) for (const theme of ['defecto', 'terracota', 'anil', 'spotify']) for (const dark of [false, true]) {
    if (eng !== 'chromium' && theme !== 'defecto') continue
    const p = await open(`hero.html?c=${a}&video=1&photo=${photo}`, { theme, dark, rm: true })
    await p.waitForFunction(() => { const v = document.querySelector('video'); return v && v.readyState >= 0 })
    await settle(p, 200)
    const r = await pauseOverPhoto(p)
    const L = `${a} ${photo} ${theme} ${dark ? 'oscuro' : 'claro'}`
    ok(r.n > 50 && r.worst >= 3, E(`${L}: pausa (relleno o contorno) ≥ 3:1 con la foto de debajo`), JSON.stringify(r))
    minPause = Math.min(minPause, r.worst)
    if (photo === 'cielo' && theme === 'defecto' && !dark) {
      // Foco por teclado: anillo focus contra el halo surface (que nunca depende de la foto)
      await p.locator('.g-hero__motion').focus()
      await p.keyboard.press(`Shift+${TAB}`); await p.keyboard.press(TAB)
      const f = await p.evaluate(() => { const b = document.querySelector('.g-hero__motion'); const cs = getComputedStyle(b); return { w: parseFloat(cs.outlineWidth), st: cs.outlineStyle, ring: window.__c.pair(cs.outlineColor, cs.backgroundColor), fv: b.matches(':focus-visible') } })
      ok(f.fv && f.w >= 2 && f.st === 'solid' && f.ring >= 3, E(`${L}: foco de la pausa visible y ≥ 3:1 contra su halo`), JSON.stringify(f))
      const s = await p.evaluate(() => { const b = document.querySelector('.g-hero__motion').getBoundingClientRect(); return [b.width, b.height] })
      ok(s[0] >= 44 && s[1] >= 44, E(`${L}: pausa 44 × 44`), s.join('×'))
    }
    await close(p, L)
  }
  note(`${eng}: pausa, peor caso por píxeles ${minPause}:1`)

  /* 3 · Geometría: anchos, RTL, sin desplazamiento; vano 4:5 con foto vertical y con vídeo (H-A1) */
  for (const a of APPS) for (const dir of ['', 'dir=rtl']) for (const [vw, vh] of [[1440, 900], [390, 844], [320, 640], [320, 256]]) {
    const p = await open(`hero.html?c=${a}`, { vw, vh, qs: dir })
    const L = `${a} ${dir || 'ltr'} ${vw}×${vh}`
    ok(!(await overflowX(p)), E(`${L}: sin desplazamiento horizontal`))
    if (a === 'window') {
      const f = await rect(p, '.g-hero__frame')
      ok(Math.abs(f.w / f.h - 0.8) < 0.01 && f.h <= vh * 0.8 + 1, E(`${L}: vano 4:5 y ≤ 80svh`), `${f.w.toFixed(0)}×${f.h.toFixed(0)}`)
    }
    await close(p, L)
  }
  for (const vw of [1280, 390]) {
    // Foto vertical (2:3, más alta que 4:5) en el vano: no lo estira
    const p = await open('hero.html', { vw, vh: 860 })
    await p.evaluate(() => {
      const img = document.querySelector('.g-hero__frame > .g-hero__img')
      img.removeAttribute('srcset'); img.setAttribute('width', '1000'); img.setAttribute('height', '1500'); img.src = window.foto('habitacion', 1000, 1500)
    })
    await settle(p, 200)
    const f = await rect(p, '.g-hero__frame')
    // Caja de diseño (sin el transform de la mirada, que la escala 1,06)
    const i = await p.evaluate(() => { const e = document.querySelector('.g-hero__frame > .g-hero__img'); return { w: e.offsetWidth, h: e.offsetHeight } })
    ok(Math.abs(f.w / f.h - 0.8) < 0.01, E(`${vw}: foto 2:3 en el vano: sigue 4:5`), `${f.w.toFixed(1)}×${f.h.toFixed(1)}`)
    ok(Math.abs(i.w - f.w) < 1 && Math.abs(i.h - f.h) < 1, E(`${vw}: foto 2:3 cubre el vano (cover)`), `${i.w.toFixed(1)}×${i.h.toFixed(1)}`)
    await close(p, `vertical ${vw}`)
    // Vídeo en A (width/height 1600×2000 en el <video>): vano 4:5, ≤ 80svh, el título en la primera pantalla
    const q = await open('hero.html?video=1', { vw, vh: 860, rm: true })
    const g = await rect(q, '.g-hero__frame')
    const v = await rect(q, '.g-hero__frame > video')
    ok(Math.abs(g.w / g.h - 0.8) < 0.01 && g.h <= 860 * 0.8 + 1, E(`${vw}: vídeo en el vano 4:5 y ≤ 80svh`), `${g.w.toFixed(0)}×${g.h.toFixed(0)}`)
    ok(Math.abs(v.w - g.w) < 1 && Math.abs(v.h - g.h) < 1, E(`${vw}: el vídeo llena su marco`), `${v.w.toFixed(0)}×${v.h.toFixed(0)}`)
    const t = await rect(q, '.g-hero__title')
    ok(t.t >= 0 && t.b <= 860, E(`${vw}: con vídeo, el título en la primera pantalla`), `${t.t.toFixed(0)}…${t.b.toFixed(0)}`)
    const m = await rect(q, '.g-hero__motion')
    ok(m.l >= g.l - 0.5 && m.r <= g.r + 0.5 && m.t >= g.t - 0.5 && m.b <= g.b + 0.5, E(`${vw}: la pausa dentro del vano`))
    await close(q, `vídeo ${vw}`)
  }

  /* 4 · B: el fundido sin vacío (slow), reducido (fast), interrumpible */
  for (const rm of [false, true]) {
    const p = await open('hero.html?c=views', { rm })
    const dur = await p.evaluate((rm) => { const d = document.createElement('div'); d.style.transitionDuration = `var(--g-duration-${rm ? 'fast' : 'slow'})`; document.body.append(d); const v = parseFloat(getComputedStyle(d).transitionDuration) * (getComputedStyle(d).transitionDuration.endsWith('ms') ? 1 : 1000); d.remove(); return v }, rm)
    const old = await p.evaluate(() => { const i = document.querySelector('.g-hero__media .g-hero__img'); i.dataset.old = '1'; return true })
    // Elegir y medir a mitad dentro de la página (sin la latencia del protocolo, que en WebKit supera el fast/2 de 60 ms)
    const mid = await p.evaluate(async (half) => {
      document.querySelectorAll('.g-hero__view')[1].click()
      await new Promise((r) => setTimeout(r, half))
      const o = document.querySelector('[data-old]'); const n = document.querySelector('.g-hero__media .g-hero__img.is-current'); return { old: +getComputedStyle(o).opacity, neu: +getComputedStyle(n).opacity, same: o === n, td: getComputedStyle(n).transitionDuration }
    }, dur / 2)
    ok(old && !mid.same && mid.old === 1, E(`fundido ${rm ? 'reducido' : 'slow'}: a mitad la anterior sigue entera (sin vacío)`), JSON.stringify(mid))
    ok(Math.abs(parseFloat(mid.td) * (mid.td.endsWith('ms') ? 1 : 1000) - dur) < 2, E(`fundido ${rm ? 'reducido = fast' : '= slow'}`), mid.td)
    // Interrumpible: otra elección a mitad parte del estado actual (la nueva actual llega a 1)
    await p.locator('.g-hero__view').nth(2).click()
    await p.waitForTimeout(dur + 120)
    const end = await p.evaluate(() => [...document.querySelectorAll('.g-hero__media > img')].map((i) => [i.className, +getComputedStyle(i).opacity]))
    ok(end.filter(([, o]) => o === 1).length === 1 && end.find(([c]) => c.includes('is-current'))[1] === 1, E(`fundido ${rm ? 'reducido' : 'slow'} interrumpido: una sola vista entera al final`), JSON.stringify(end))
    await close(p, `fundido ${rm}`)
  }

  /* 5 · La mirada: solo con soporte de view() y sin reducido; quieta con reducido, look=false y vídeo */
  for (const [qs, rm, label] of [['', false, 'normal'], ['', true, 'reducido'], ['nolook=1', false, 'look=false'], ['video=1', false, 'vídeo']]) {
    const p = await open('hero.html', { qs: qs + (qs ? '&' : '') + 'tall=1', rm })
    const s = await p.evaluate(() => ({ sup: CSS.supports('animation-timeline: view()'), an: getComputedStyle(document.querySelector('.g-hero__frame > *')).animationName }))
    const want = label === 'normal' && s.sup
    ok(want ? s.an === 'g-hero-look' : s.an === 'none', E(`mirada ${label}: ${want ? 'activa' : 'quieta'}`), JSON.stringify(s))
    if (want) {
      // El marco no se mueve respecto al texto al desplazar; la foto sí, ≤ 6 % del alto
      const f0 = await rect(p, '.g-hero__frame'), t0 = await rect(p, '.g-hero__title'), i0 = await rect(p, '.g-hero__frame > img')
      await p.mouse.wheel(0, 300); await settle(p, 200)
      const f1 = await rect(p, '.g-hero__frame'), t1 = await rect(p, '.g-hero__title'), i1 = await rect(p, '.g-hero__frame > img')
      ok(Math.abs((f1.t - f0.t) - (t1.t - t0.t)) < 1, E('mirada: el marco se desplaza con el texto'))
      const rel = Math.abs((i1.t - f1.t) - (i0.t - f0.t))
      ok(rel > 0.5 && rel <= f0.h * 0.06 + 1, E('mirada: la foto se mueve dentro del marco ≤ 6 % del alto'), rel.toFixed(1))
    }
    await close(p, `mirada ${label}`)
  }

  /* 6 · Foco visible en las vistas (Tab + flecha; WebKit con data-g-key-focus) en la placa, tres temas, claro y oscuro */
  for (const theme of ['defecto', 'terracota', 'spotify']) for (const dark of [false, true]) {
    const p = await open('hero.html?c=views', { theme, dark })
    await p.locator('#sec').focus()
    await p.keyboard.press(TAB)
    await p.keyboard.press('ArrowRight')
    await settle(p)
    const f = await p.evaluate(() => {
      const i = document.activeElement; const l = i && i.closest('.g-hero__view'); if (!l) return { none: true }
      const cs = getComputedStyle(l)
      const plate = document.querySelector('.g-hero__plate')
      return { w: parseFloat(cs.outlineWidth), st: cs.outlineStyle, c: window.__c.ratio(window.__c.rgba(cs.outlineColor), window.__c.bgOf(plate)), checked: i.checked, idx: [...document.querySelectorAll('.g-hero__view-input')].indexOf(i) }
    })
    const L = `vistas ${theme} ${dark ? 'oscuro' : 'claro'}`
    ok(!f.none && f.idx === 1 && f.checked && f.w >= 2 && f.st === 'solid' && f.c >= 3, E(`${L}: foco visible tras Tab + → y ≥ 3:1 en la placa`), JSON.stringify(f))
    await close(p, L)
  }

  /* 7 · Puntero grueso: vistas ≥ 44 px de alto; pausa 44 */
  {
    const p = await open('hero.html?c=views&video=1', { coarse: true, vw: 390, vh: 844 })
    const s = await p.evaluate(() => ({ v: Math.min(...[...document.querySelectorAll('.g-hero__view')].map((e) => e.getBoundingClientRect().height)), m: document.querySelector('.g-hero__motion').getBoundingClientRect().height }))
    ok(s.v >= 44 && s.m >= 44, E('puntero grueso: vistas y pausa ≥ 44 px'), JSON.stringify(s))
    await close(p, 'grueso')
  }

  /* 8 · forced-colors (solo Chromium emula) */
  if (eng === 'chromium') {
    for (const a of ['views', 'threshold']) {
      const p = await open(`hero.html?c=${a}&video=1`, { fc: true })
      const s = await p.evaluate(() => {
        const host = document.querySelector('.g-hero__plate, .g-hero__card'); const cs = getComputedStyle(host)
        // El color de sistema se resuelve con el color-scheme del sitio (la placa es zona de marca): se mide dentro
        const sys = (n, at = host) => { const d = document.createElement('i'); d.style.color = n; at.append(d); const c = getComputedStyle(d).color; d.remove(); return c }
        const chk = document.querySelector('.g-hero__view:has(:checked)')
        return { host: [parseFloat(cs.borderTopWidth), cs.borderTopColor === sys('CanvasText')], chk: chk ? getComputedStyle(chk).borderTopColor === sys('Highlight') : true, motion: getComputedStyle(document.querySelector('.g-hero__motion')).borderTopColor === sys('ButtonText', document.querySelector('.g-hero__media')) }
      })
      ok(s.host[0] >= 1 && s.host[1] && s.chk && s.motion, E(`forced-colors ${a}: placa/tarjeta con borde CanvasText, vista elegida Highlight, pausa ButtonText`), JSON.stringify(s))
      await close(p, `forced ${a}`)
    }
  }
  await b.close()
}
stop()
report('GHero')
