// GCard · personalidad (DECISIONS.md #299 y #303; design/contracts/card.md «Personalidad»; plan 017).
// C2 «la selección nace de la casilla» y C1 «la luz sigue al puntero», medidos sobre el GCard REAL del UMD (window.Grana)
// montado en la página del playground, como personalidad-btn.spec.mjs. Criterio de hecho: la medida de kiwi (personalidad/r01).
//
// C2 es solo CSS (coco): el ::before se ancla al indicador y su círculo farthest-corner crece con --_card-reach.
// C1: el CSS del halo (coco) lee --_pointer-x/y, que escribe GCard.vue (bruno). Mientras GCard.vue no las escriba, el spec
// instala un sustituto mínimo (pointermove → las dos variables en px desde la caja de borde) para medir el CSS; cuando el
// componente las escriba, el spec lo detecta y mide el componente real (y lo dice en la anotación).
import { test, expect } from '@playwright/test'

test.setTimeout(120_000)

const PAGE = '/packages/vue/playground/index.html'
const THEME = '/design/lab/tema-oscuro/dark-color-presence/generated/spotify.css'

const LABELS = { menu: 'Acciones de', loading: 'Cargando tarjeta', loaded: 'Tarjeta cargada', expand: 'Mostrar más', collapse: 'Mostrar menos', more: 'Más detalles', less: 'Menos detalles', retry: 'Reintentar', empty: 'Aún no hay' }

// Tarjetas de prueba: cada modo con indicador que pide card.md (casilla, radio, toggle, horizontal con media lateral,
// compact, RTL, modo lista) y una grande para C1.
const mount = async (page, { reduce = false, scheme = 'light', theme = false } = {}) => {
  if (reduce) await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(PAGE)
  await page.waitForSelector('.g-card', { timeout: 30_000 })
  await page.evaluate(async ({ labels, scheme, theme }) => {
    document.documentElement.dataset.theme = scheme
    if (theme) {
      const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = theme
      await new Promise((res) => { l.onload = res; document.head.appendChild(l) })
    }
    const host = document.createElement('div')
    host.id = 'pc-host'
    host.style.cssText = 'padding:24px;display:grid;gap:24px;grid-template-columns:repeat(2, 420px);background:var(--g-color-bg)'
    document.body.prepend(host)
    const { createApp, h, ref } = window.Vue
    const { GCard } = window.Grana
    const m = { sel: ref(false), radio: ref(''), toggle: ref(false), hmedia: ref(false), compact: ref(false), rtl: ref(false), list: ref(false), big: ref(false) }
    window.__set = (k, v) => { m[k].value = v }
    const media = () => h('div', { style: 'inline-size:100%;block-size:100%;background:var(--g-color-border-strong)' })
    const card = (k, p, slots) => h(GCard, { id: 'pc-' + k, labels, modelValue: m[k].value, 'onUpdate:modelValue': (v) => { m[k].value = v }, ...p }, slots)
    createApp({
      render: () => [
        h('div', { style: 'grid-column:1 / -1' }, [card('big', { href: '#pc-big', title: 'Halo', description: 'Texto atenuado sobre el halo.', selectable: true, style: 'inline-size:640px;min-block-size:420px' })]),
        card('sel', { href: '#pc-sel', title: 'Proyecto Atlas', description: 'Equipo de datos', selectable: true, badge: 'Activo' }),
        card('radio', { interaction: 'select', selectType: 'radio', name: 'pc-plan', value: 'a', title: 'Plan Equipo', description: 'Para crecer.', color: 'accent' }),
        card('toggle', { interaction: 'toggle', title: 'Solo pendientes', description: 'Filtro de la vista.' }),
        card('hmedia', { href: '#pc-hmedia', orientation: 'horizontal', mediaPosition: 'start', title: 'Recorrido por el centro', description: 'Plazas y mercados.', selectable: true }, { media }),
        card('compact', { href: '#pc-compact', density: 'compact', padding: 'sm', title: 'Compacta', description: 'Densidad compacta.', selectable: true }),
        h('div', { dir: 'rtl' }, [card('rtl', { href: '#pc-rtl', title: 'مشروع أطلس', description: 'فريق البيانات', selectable: true })]),
        h('ul', { style: 'margin:0;padding:0;list-style:none' }, [card('list', { as: 'li', level: 'flat', orientation: 'horizontal', href: '#pc-list', title: 'Elemento de lista', description: 'Modo lista.', selectable: true })]),
        h('div')
      ]
    }).mount(host)
    // Lectura de píxeles: PNG (captura de Playwright) → canvas
    window.__pixels = async (b64) => {
      const blob = await (await fetch('data:image/png;base64,' + b64)).blob()
      const bmp = await createImageBitmap(blob)
      const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(bmp, 0, 0)
      return { w: bmp.width, h: bmp.height, d: Array.from(x.getImageData(0, 0, bmp.width, bmp.height).data) }
    }
    window.__sample = (fn, ms) => new Promise((res) => {
      const xs = []; const t0 = performance.now()
      ;(function f() { xs.push({ t: performance.now() - t0, v: fn() }); if (performance.now() - t0 < ms) requestAnimationFrame(f); else res(xs) })()
    })
    window.__reach = (id) => getComputedStyle(document.getElementById(id), '::before').getPropertyValue('--_card-reach').trim()
    // Con carga, WebKit crea las transiciones uno o varios cuadros más tarde: se espera a que exista la transición en vez
    // de muestrear cuadros, y se recorre su tiempo pausada (determinista)
    window.__anim = async (el, prop, pe) => {
      const t0 = performance.now()
      while (performance.now() - t0 < 5000) {
        const a = el.getAnimations({ subtree: true }).find((x) => x.transitionProperty === prop && (pe === undefined || (x.effect.pseudoElement || null) === pe))
        if (a) return a
        await new Promise((r) => setTimeout(r, 10))
      }
      return null
    }
    window.__walk = async (id, prop) => {
      const c = document.getElementById(id)
      // El tinte se anima en la raíz y el ::before lo hereda (WebKit no anima un elemento colocado con anchor()): se
      // pausan las transiciones de la raíz y se lee lo que pinta el ::before
      const a = await window.__anim(c, prop, null)
      if (!a) return null
      const all = c.getAnimations()
      all.forEach((x) => x.pause())
      const dur = a.effect.getComputedTiming().duration
      const read = () => { const cs = getComputedStyle(c, '::before'); return { r: cs.getPropertyValue('--_card-reach').trim(), c: cs.getPropertyValue('--_card-selected').trim() } }
      const pts = []
      for (const fr of [0, 0.1, 0.25, 0.5, 0.75, 0.95]) { all.forEach((x) => { x.currentTime = fr * dur }); pts.push(read()) }
      const others = all.map((x) => x.transitionProperty)
      all.forEach((x) => x.finish())
      // WebKit aplica el final de finish() en la siguiente actualización de estilo
      for (let i = 0; i < 50 && c.getAnimations().length; i++) await new Promise((r) => setTimeout(r, 20))
      await new Promise(requestAnimationFrame)
      return { dur, easing: a.effect.getTiming().easing, pts, others, end: read() }
    }
    // Espera a que la tarjeta quede quieta (sin transiciones finitas en curso) y se cumpla el estado pedido
    window.__settle = async (id, pred) => {
      const c = document.getElementById(id); const ok = new Function('c', 'return (' + pred + ')(c)')
      const t0 = performance.now(); let quiet = 0
      while (performance.now() - t0 < 8000) {
        const busy = c.getAnimations({ subtree: true }).some((a) => a.playState === 'running' && Number.isFinite(a.effect.getComputedTiming().endTime))
        quiet = !busy && ok(c) ? quiet + 1 : 0
        if (quiet >= 3) return true
        await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 30)))
      }
      return false
    }
  }, { labels: LABELS, scheme, theme: theme ? THEME : null })
  await page.waitForSelector('#pc-big')
  await page.waitForTimeout(150)
}

const pixels = async (page, clip) => {
  const b64 = (await page.screenshot({ clip, animations: 'allow' })).toString('base64')
  const px = await page.evaluate((b) => window.__pixels(b), b64)
  // Escala de dispositivo (WebKit «Desktop Safari» = 2): at(x, y) en px CSS desde la esquina del recorte
  px.s = px.w / clip.width
  px.at = (x, y) => { const i = (Math.round(y * px.s) * px.w + Math.round(x * px.s)) * 4; return px.d.slice(i, i + 3) }
  return px
}

// Geometría de C2: centro del ::before (capa anclada) frente al centro del indicador visible, en px de la caja de borde
const geometry = (page, id) => page.evaluate((id) => {
  const card = document.getElementById(id)
  const r = card.getBoundingClientRect()
  const ind = card.querySelector('.g-card__header > .g-card__selectbox .g-card__tick, .g-card__header > .g-card__tick--static')
  const ir = ind.getBoundingClientRect()
  const cs = getComputedStyle(card, '::before')
  const ccs = getComputedStyle(card)
  const bl = parseFloat(ccs.borderLeftWidth); const bt = parseFloat(ccs.borderTopWidth)
  const L = parseFloat(cs.left) + bl; const T = parseFloat(cs.top) + bt; const W = parseFloat(cs.width); const H = parseFloat(cs.height)
  const cx = L + W / 2; const cy = T + H / 2
  const ix = ir.left + ir.width / 2 - r.left; const iy = ir.top + ir.height / 2 - r.top
  const far = Math.max(...[[0, 0], [r.width, 0], [0, r.height], [r.width, r.height]].map(([x, y]) => Math.hypot(x - ix, y - iy)))
  return { cx, cy, ix, iy, half: Math.hypot(W, H) / 2, far, w: r.width, h: r.height, x: r.left, y: r.top, tf: ccs.transform, inset: [cs.top, cs.right, cs.bottom, cs.left].join(' ') }
}, id)

// Clic que marca o desmarca: la casilla (o el radio) es el control; en toggle, la tarjeta entera
const toggle = (page, k) => page.evaluate((k) => {
  const c = document.getElementById('pc-' + k)
  ;(c.querySelector('.g-card__select') || c.querySelector('.g-card__primary')).click()
}, k)

const GLOW_ON = "(c) => !/rgba\\(0, 0, 0, 0\\)/.test(getComputedStyle(c).getPropertyValue('--_card-glow'))"
const MODES = ['sel', 'radio', 'toggle', 'hmedia', 'compact', 'rtl', 'list']

test.describe('GCard · C2 la selección nace de la casilla', () => {
  test('origen en el centro del indicador (±2px) y radio hasta la esquina más lejana, en todos los modos con indicador', async ({ page }) => {
    await mount(page)
    for (const k of MODES) {
      const g = await geometry(page, 'pc-' + k)
      expect(Math.abs(g.cx - g.ix), `${k}: origen x (capa ${g.cx.toFixed(2)} · indicador ${g.ix.toFixed(2)}; inset ${g.inset})`).toBeLessThanOrEqual(2)
      expect(Math.abs(g.cy - g.iy), `${k}: origen y (capa ${g.cy.toFixed(2)} · indicador ${g.iy.toFixed(2)})`).toBeLessThanOrEqual(2)
      expect(Math.abs(g.half - g.far), `${k}: farthest-corner ${g.half.toFixed(1)} = esquina más lejana ${g.far.toFixed(1)}`).toBeLessThanOrEqual(2)
      if (process.env.VERBOSE) console.log(`C2 ${test.info().project.name} ${k}: origen Δ(${(g.cx - g.ix).toFixed(2)}, ${(g.cy - g.iy).toFixed(2)}) radio ${g.half.toFixed(1)}/${g.far.toFixed(1)}`)
    }
  })

  test('marcar: radio con cuadros intermedios (0 → 100 %), caja Δ0 y sin transform; desmarcar: se recoge con el color hasta el final', async ({ page }) => {
    await mount(page)
    for (const k of ['sel', 'toggle', 'hmedia', 'rtl']) {
      const id = 'pc-' + k
      const g0 = await geometry(page, id)
      await toggle(page, k)
      const on = await page.evaluate((id) => window.__walk(id, '--_card-reach'), id)
      expect(on, `${k}: hay transición de --_card-reach al marcar (en la raíz)`).toBeTruthy()
      expect(on.dur, `${k}: crecer = --g-duration-slow`).toBeCloseTo(240, 0)
      expect(on.easing, `${k}: --g-ease-out`).toBe('cubic-bezier(0.23, 1, 0.32, 1)')
      const rs = on.pts.map((p) => parseFloat(p.r))
      expect(rs.slice(1).filter((r) => r > 0 && r < 100).length, `${k}: radios intermedios (${on.pts.map((p) => p.r).join(' | ')})`).toBeGreaterThanOrEqual(3)
      expect(rs.every((r, i) => i === 0 || r > rs[i - 1]), `${k}: crece`).toBe(true)
      expect(on.pts.slice(1).every((p) => !/rgba\(0, 0, 0, 0\)/.test(p.c)), `${k}: el tinte está desde el primer cuadro`).toBe(true)
      expect(on.end.r, `${k}: termina cubriendo la tarjeta`).toBe('100%')
      const g1 = await geometry(page, id)
      expect([g1.x - g0.x, g1.y - g0.y, g1.w - g0.w, g1.h - g0.h].every((d) => Math.abs(d) < 0.01), `${k}: caja Δ0 (#127)`).toBe(true)
      expect(g1.tf).toBe('none')

      // Desmarcar: el radio decrece (más corto: --g-duration-press) y el tinte sigue puesto hasta que se ha recogido
      await toggle(page, k)
      const off = await page.evaluate((id) => window.__walk(id, '--_card-reach'), id)
      expect(off, `${k}: hay transición de --_card-reach al desmarcar`).toBeTruthy()
      expect(off.dur, `${k}: recoger = --g-duration-press`).toBeCloseTo(160, 0)
      const ro = off.pts.map((p) => parseFloat(p.r))
      expect(ro.slice(1).filter((r) => r > 0 && r < 100).length, `${k}: radios intermedios al recogerse (${off.pts.map((p) => p.r).join(' | ')})`).toBeGreaterThanOrEqual(3)
      expect(ro.every((r, i) => i === 0 || r < ro[i - 1]), `${k}: decrece`).toBe(true)
      expect(off.pts.every((p) => !/rgba\(0, 0, 0, 0\)/.test(p.c)), `${k}: el tinte no se apaga mientras se recoge (${off.pts.map((p) => p.c).join(' | ')})`).toBe(true)
      expect(off.end.r).toBe('0%')
      expect(off.end.c, `${k}: al final, sin tinte`).toBe('rgba(0, 0, 0, 0)')
      if (process.env.VERBOSE) console.log(`C2 ${test.info().project.name} ${k}: marcar ${on.pts.map((p) => p.r).join(' ')} · desmarcar ${off.pts.map((p) => p.r).join(' ')}`)
    }
  })

  test('píxeles a mitad del crecimiento: tinte junto al indicador y la esquina más lejana todavía sin tinte', async ({ page, browserName }) => {
    // page.screenshot de WebKit da por terminadas las transiciones de propiedades registradas (artefacto de la captura: el
    // vídeo de WebKit sí muestra el círculo creciendo desde el indicador, estilo.md «Personalidad»). Allí cuentan los
    // valores calculados (prueba anterior) y la geometría.
    test.skip(browserName === 'webkit', 'captura de WebKit: termina las transiciones de propiedades registradas')
    await mount(page)
    // Tinte fuerte solo en esta tarjeta para leerlo sin ambigüedad (la geometría no depende de la intensidad)
    await page.evaluate(() => { document.getElementById('pc-sel').style.setProperty('--g-card-selected', 'rgb(255 0 0 / 0.6)') })
    await toggle(page, 'sel')
    const paused = await page.evaluate(async () => {
      const c = document.getElementById('pc-sel')
      const a = await window.__anim(c, '--_card-reach')
      if (!a) return null
      a.pause(); a.currentTime = a.effect.getComputedTiming().duration * 0.35
      return { dur: a.effect.getComputedTiming().duration, easing: a.effect.getTiming().easing, reach: window.__reach('pc-sel') }
    })
    expect(paused, 'hay transición de --_card-reach (en la raíz)').toBeTruthy()
    expect(paused.dur).toBeCloseTo(240, 0)
    const g = await geometry(page, 'pc-sel')
    const px = await pixels(page, { x: g.x, y: g.y, width: g.w, height: g.h })
    const at = px.at
    const red = (p) => p[0] - p[1] > 60
    // Junto al indicador (a un lado de la casilla, fuera de ella) hay tinte; en la esquina más lejana (dentro del radio
    // de la raíz, que recorta), no
    const near = at(g.ix + 20, g.iy + 16)
    const farP = at(g.w - 16, g.h - 16)
    expect(red(near), `tinte junto al indicador (${near}) a ${paused.reach}`).toBe(true)
    expect(red(farP), `esquina lejana sin tinte (${farP}) a ${paused.reach}`).toBe(false)
    await page.evaluate(() => document.getElementById('pc-sel').getAnimations({ subtree: true }).forEach((a) => a.finish()))
    await page.waitForTimeout(50)
    const px2 = await pixels(page, { x: g.x, y: g.y, width: g.w, height: g.h })
    const at2 = px2.at
    expect(red(at2(g.w - 16, g.h - 16)), 'al terminar, la esquina más lejana está teñida').toBe(true)
    if (process.env.VERBOSE) console.log(`C2 ${test.info().project.name}: ${paused.dur}ms ${paused.easing}; a 35 %: ${paused.reach}`)
  })

  test('con movimiento reducido: capa = tarjeta, radio fijo al 100 % y el tinte se funde (plan 008)', async ({ page }) => {
    await mount(page, { reduce: true })
    for (const k of ['sel', 'toggle']) {
      const id = 'pc-' + k
      const g = await geometry(page, id)
      expect(g.inset, `${k}: el ::before cubre la tarjeta`).toBe('0px 0px 0px 0px')
      await toggle(page, k)
      const f = await page.evaluate((id) => window.__walk(id, '--_card-selected'), id)
      expect(f, `${k}: el tinte se funde (transición de --_card-selected)`).toBeTruthy()
      expect(f.dur).toBeCloseTo(120, 0)
      expect(f.others, `${k}: sin transición de --_card-reach`).not.toContain('--_card-reach')
      expect(f.pts.every((p) => p.r === '100%'), `${k}: radio fijo (${[...new Set(f.pts.map((p) => p.r))].join(' | ')})`).toBe(true)
      const al = f.pts.map((p) => { const m = p.c.match(/rgba\([^)]*,\s*([\d.]+)\)/); return m ? parseFloat(m[1]) : 1 })
      expect(al.slice(1, -1).some((a) => a > 0 && a < al.at(-1)), `${k}: alfa intermedio (${f.pts.map((p) => p.c).join(' | ')})`).toBe(true)
    }
  })
})

// ---------- C1 ----------
// Sustituto de la escucha de GCard.vue (solo si el componente aún no escribe las variables)
const pointerSource = async (page, id) => {
  const box = await page.locator('#' + id).boundingBox()
  await page.mouse.move(box.x + 50, box.y + 300)
  await page.mouse.move(box.x + 60, box.y + 310)
  await page.waitForTimeout(50)
  const real = await page.evaluate((id) => document.getElementById(id).style.getPropertyValue('--_pointer-x') !== '', id)
  if (!real) {
    await page.evaluate((id) => {
      const c = document.getElementById(id)
      const write = (e) => { if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return; const r = c.getBoundingClientRect(); c.style.setProperty('--_pointer-x', (e.clientX - r.left) + 'px'); c.style.setProperty('--_pointer-y', (e.clientY - r.top) + 'px') }
      c.addEventListener('pointerenter', write); c.addEventListener('pointermove', write)
    }, id)
  }
  test.info().annotations.push({ type: 'C1', description: real ? 'variables escritas por GCard.vue (componente real)' : 'sustituto de la escucha: GCard.vue aún no escribe --_pointer-x/y (bruno, plan 017 paso 2)' })
  await page.mouse.move(box.x - 40, box.y - 40)
  await page.evaluate(([id, p]) => window.__settle(id, p), [id, "(c) => /rgba\\(0, 0, 0, 0\\)/.test(getComputedStyle(c).getPropertyValue('--_card-glow'))"])
  return box
}

test.describe('GCard · C1 la luz sigue al puntero', () => {
  test('centro del halo = puntero (±1px), caja Δ0, transform none y velo uniforme conservado', async ({ page }) => {
    await mount(page)
    const id = 'pc-big'
    // Velo y halo intensos solo en esta tarjeta para ubicar el centro con precisión; texto transparente para no mezclarlo
    await page.evaluate((id) => {
      const c = document.getElementById(id); c.style.setProperty('--g-card-hover', 'rgb(0 0 0 / 0.3)')
      const s = document.createElement('style'); s.textContent = `#${id}, #${id} * { color: transparent !important; text-decoration: none !important; } #${id} .g-card__tick, #${id} .g-badge { visibility: hidden; }`; document.head.appendChild(s)
    }, id)
    const box = await pointerSource(page, id)
    const g0 = await geometry(page, id)
    const P = { x: 330, y: 230 }
    await page.mouse.move(box.x + P.x - 5, box.y + P.y - 5)
    await page.mouse.move(box.x + P.x, box.y + P.y)
    expect(await page.evaluate(([id, p]) => window.__settle(id, p), [id, GLOW_ON]), 'halo encendido y quieto').toBe(true)
    const st = await page.evaluate((id) => { const c = document.getElementById(id); return { img: getComputedStyle(c).backgroundImage, veil: getComputedStyle(c).getPropertyValue('--_card-veil').trim(), tf: getComputedStyle(c).transform } }, id)
    expect(st.img, 'halo pintado').toContain('radial-gradient')
    expect(st.veil, 'velo uniforme conservado').not.toBe('rgba(0, 0, 0, 0)')
    expect(st.tf).toBe('none')
    const g1 = await geometry(page, id)
    expect([g1.x - g0.x, g1.y - g0.y, g1.w - g0.w, g1.h - g0.h].every((d) => Math.abs(d) < 0.01), 'caja Δ0 (#127)').toBe(true)
    const px = await pixels(page, { x: g1.x, y: g1.y, width: g1.w, height: g1.h })
    const lum = (x, y) => px.d[(y * px.w + x) * 4]
    // Línea base: velo uniforme lejos del halo (dentro de la tarjeta)
    const base = px.at(12, Math.round(g1.h) - 12)[0]
    let sw = 0; let sx = 0; let sy = 0
    const m = Math.ceil(4 * px.s)
    for (let y = m; y < px.h - m; y++) for (let x = m; x < px.w - m; x++) { const w = Math.max(0, base - lum(x, y) - 1); sw += w; sx += w * (x + 0.5); sy += w * (y + 0.5) }
    const cx = sx / sw / px.s; const cy = sy / sw / px.s
    expect(Math.abs(cx - P.x), `centro x ${cx.toFixed(2)} (puntero ${P.x}); base ${base}`).toBeLessThanOrEqual(1)
    expect(Math.abs(cy - P.y), `centro y ${cy.toFixed(2)} (puntero ${P.y})`).toBeLessThanOrEqual(1)
    // Sigue al puntero sin transición de posición: un salto de 80px se refleja en el siguiente cuadro
    await page.mouse.move(box.x + P.x + 80, box.y + P.y)
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
    const img2 = await page.evaluate((id) => getComputedStyle(document.getElementById(id)).backgroundImage, id)
    expect(img2, 'posición nueva sin transición').toContain(`${P.x + 80}px`)
    if (process.env.VERBOSE) console.log(`C1 ${test.info().project.name}: centro (${cx.toFixed(2)}, ${cy.toFixed(2)}) puntero (${P.x}, ${P.y})`)
  })

  test('el halo aparece y se va con el hover (fundido de color); sin hover, sin halo', async ({ page }) => {
    await mount(page)
    const id = 'pc-big'
    const box = await pointerSource(page, id)
    const glow = () => page.evaluate((id) => getComputedStyle(document.getElementById(id)).getPropertyValue('--_card-glow').trim(), id)
    expect(await glow()).toBe('rgba(0, 0, 0, 0)')
    await page.mouse.move(box.x + 300, box.y + 200)
    const f = await page.evaluate(async (id) => {
      const c = document.getElementById(id)
      const a = await window.__anim(c, '--_card-glow', null)
      if (!a) return null
      a.pause(); const dur = a.effect.getComputedTiming().duration
      const pts = []
      for (const fr of [0, 0.5, 1]) { a.currentTime = fr * dur; pts.push(getComputedStyle(c).getPropertyValue('--_card-glow').trim()) }
      a.finish()
      return { dur, pts }
    }, id)
    expect(f, 'el halo se enciende con una transición de color').toBeTruthy()
    expect(f.dur).toBeCloseTo(160, 0)
    expect(new Set(f.pts).size, `fundido con valor intermedio (${f.pts.join(' | ')})`).toBe(3)
    await page.mouse.move(box.x - 40, box.y - 40)
    expect(await page.evaluate(([id, p]) => window.__settle(id, p), [id, "(c) => /rgba\\(0, 0, 0, 0\\)/.test(getComputedStyle(c).getPropertyValue('--_card-glow'))"]), 'sin hover, el halo se apaga').toBe(true)
  })

  test('con movimiento reducido: sin halo aunque existan las variables', async ({ page }) => {
    await mount(page, { reduce: true })
    const id = 'pc-big'
    await page.evaluate((id) => { const c = document.getElementById(id); c.style.setProperty('--_pointer-x', '200px'); c.style.setProperty('--_pointer-y', '200px') }, id)
    const box = await page.locator('#' + id).boundingBox()
    await page.mouse.move(box.x + 200, box.y + 200)
    expect(await page.evaluate((id) => window.__settle(id, "(c) => getComputedStyle(c).getPropertyValue('--_card-veil').trim() !== 'rgba(0, 0, 0, 0)'"), id), 'velo de hover alcanzado').toBe(true)
    const st = await page.evaluate((id) => { const c = document.getElementById(id); return { img: getComputedStyle(c).backgroundImage, veil: getComputedStyle(c).getPropertyValue('--_card-veil').trim() } }, id)
    expect(st.img).toBe('none')
    expect(st.veil, 'el velo uniforme sigue siendo la señal').not.toBe('rgba(0, 0, 0, 0)')
  })

  test('táctil (375px, hover: none): sin halo aunque existan las variables', async ({ browser, browserName }) => {
    test.skip(browserName === 'firefox', 'Firefox no emula isMobile/hover: none en Playwright')
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true })
    const page = await ctx.newPage()
    await mount(page)
    const hv = await page.evaluate(() => matchMedia('(hover: hover)').matches)
    test.skip(hv, 'este motor no emula hover: none')
    const id = 'pc-sel'
    await page.evaluate((id) => { const c = document.getElementById(id); c.style.setProperty('--_pointer-x', '100px'); c.style.setProperty('--_pointer-y', '60px') }, id)
    const b = await page.locator('#' + id + ' .g-card__description').boundingBox()
    await page.touchscreen.tap(b.x + 4, b.y + b.height / 2)
    await page.waitForTimeout(250)
    expect(await page.evaluate((id) => getComputedStyle(document.getElementById(id)).backgroundImage, id)).toBe('none')
    await ctx.close()
  })

  test('colores forzados: sin halo ni círculo (la selección es el anillo Highlight)', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'forcedColors solo se emula en Chromium')
    await page.emulateMedia({ forcedColors: 'active' })
    await mount(page)
    const id = 'pc-big'
    await page.evaluate((id) => { const c = document.getElementById(id); c.style.setProperty('--_pointer-x', '200px'); c.style.setProperty('--_pointer-y', '200px') }, id)
    const box = await page.locator('#' + id).boundingBox()
    await page.mouse.move(box.x + 200, box.y + 200)
    await page.waitForTimeout(250)
    await toggle(page, 'big')
    await page.waitForTimeout(300)
    const st = await page.evaluate((id) => { const c = document.getElementById(id); return { img: getComputedStyle(c).backgroundImage, before: getComputedStyle(c, '::before').display, ring: getComputedStyle(c, '::after').borderTopWidth } }, id)
    expect(st.img).toBe('none')
    expect(st.before).toBe('none')
    expect(parseFloat(st.ring)).toBeGreaterThan(1)
  })

  test('tarjeta no interactiva, deshabilitada o de media de fondo: sin halo', async ({ page }) => {
    await mount(page)
    const ids = await page.evaluate(() => {
      const out = []
      for (const sel of ['#cd-basic', '#cd-bg']) { const c = document.querySelector(sel); if (c) { c.style.setProperty('--_pointer-x', '40px'); c.style.setProperty('--_pointer-y', '40px'); out.push(sel) } }
      return out
    })
    expect(ids.length).toBe(2)
    for (const sel of ids) {
      await page.locator(sel).scrollIntoViewIfNeeded()
      const b = await page.locator(sel).boundingBox()
      await page.mouse.move(b.x + 40, b.y + 40)
      await page.waitForTimeout(200)
      expect(await page.evaluate((s) => getComputedStyle(document.querySelector(s)).backgroundImage, sel), sel).toBe('none')
    }
  })

  // Contraste del texto en el punto más intenso del halo (centro), sobre velo, halo y (si aplica) selección o pulsación
  for (const scheme of ['light', 'dark']) {
    for (const theme of [false, true]) {
      test(`contraste ≥ 4,5:1 en el centro del halo · ${scheme} · ${theme ? 'tema generado (spotify)' : 'tema por defecto'}`, async ({ page }) => {
        await mount(page, { scheme, theme })
        const id = 'pc-big'
        const colors = await page.evaluate((id) => {
          const c = document.getElementById(id)
          return { text: getComputedStyle(c.querySelector('.g-card__title')).color, muted: getComputedStyle(c.querySelector('.g-card__description')).color }
        }, id)
        await page.evaluate((id) => { const s = document.createElement('style'); s.textContent = `#${id}, #${id} * { color: transparent !important; text-decoration: none !important; }`; document.head.appendChild(s) }, id)
        const box = await pointerSource(page, id)
        const P = { x: 330, y: 230 }
        const rows = []
        for (const state of ['hover', 'selected+hover', 'selected+pressed']) {
          if (state === 'selected+hover') await page.evaluate(() => window.__set('big', true))
          await page.mouse.move(box.x + P.x - 3, box.y + P.y - 3)
          await page.mouse.move(box.x + P.x, box.y + P.y)
          if (state === 'selected+pressed') await page.mouse.down()
          const want = state === 'selected+pressed' ? "(c) => /rgba\\(0, 0, 0, 0\\)/.test(getComputedStyle(c).getPropertyValue('--_card-glow'))" : GLOW_ON
          expect(await page.evaluate(([id, p]) => window.__settle(id, p), [id, want]), `${state}: estado alcanzado`).toBe(true)
          const px = await pixels(page, { x: box.x + P.x - 1, y: box.y + P.y - 1, width: 3, height: 3 })
          if (state === 'selected+pressed') { await page.evaluate(() => { addEventListener('click', (e) => e.preventDefault(), { capture: true, once: true }) }); await page.mouse.up() }
          const bg = px.at(1, 1)
          const ratios = await page.evaluate(({ bg, colors }) => {
            const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
            const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
            const rgb = (s) => { const c = document.createElement('canvas').getContext('2d'); c.fillStyle = s; c.fillRect(0, 0, 1, 1); return Array.from(c.getImageData(0, 0, 1, 1).data.slice(0, 3)) }
            const cr = (a, b) => { const x = L(a); const y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
            return { text: cr(rgb(colors.text), bg), muted: cr(rgb(colors.muted), bg) }
          }, { bg, colors })
          rows.push({ state, bg, ...ratios })
          expect(ratios.text, `${state}: texto ${ratios.text.toFixed(2)} sobre rgb(${bg})`).toBeGreaterThanOrEqual(4.5)
          expect(ratios.muted, `${state}: texto atenuado ${ratios.muted.toFixed(2)} sobre rgb(${bg})`).toBeGreaterThanOrEqual(4.5)
        }
        // El halo se ve: el centro difiere del velo uniforme lejos del puntero (en hover)
        if (process.env.VERBOSE) console.log(`C1 contraste ${test.info().project.name} ${scheme} ${theme ? 'spotify' : 'defecto'}: ` + rows.map((r) => `${r.state} rgb(${r.bg}) ${r.text.toFixed(2)}/${r.muted.toFixed(2)}`).join(' · '))
      })
    }
  }
})
