// Auditoría de coco de la tabla única de movimiento (#1002 a #1009): lo que tests/movimiento.spec.mjs no mide, sobre los
// componentes REALES de dist (banco r01/banco.html + una segunda aplicación). No sustituye a la spec: la completa.
// Ejecutar: node design/lab/movimiento/auditoria-verificar.mjs   (ENGINES=chromium,firefox,webkit por defecto). Abre por file://.
// Requiere `npm run build`. Escribe auditoria-resultados.json con las medidas. Un fallo imprime «FALLA motor · nombre».
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const url = new URL('./r01/banco.html', import.meta.url).href
const engines = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const only = process.env.ONLY ? process.env.ONLY.split(',') : null
const themesDir = new URL('../tema-oscuro/dark-color-presence/generated/', import.meta.url)
const themes = readdirSync(themesDir).filter((f) => f.endsWith('.css') && !f.endsWith('.variants.css'))
const out = {}
let ok = 0, ko = 0
const tally = {}
const check = (e, name, pass, extra = '') => {
  tally[e] ||= { ok: 0, ko: 0 }
  pass ? (ok++, tally[e].ok++) : (ko++, tally[e].ko++)
  if (!pass) console.log(`FALLA ${e} · ${name} ${extra}`)
}
const note = (e, k, v) => { (out[e] ||= {})[k] = v }
const on = (s) => !only || only.includes(s)

const EXTRAS = () => {
  const { createApp, h, reactive } = Vue
  const G = Grana
  const C = GranaCombobox.GCombobox
  const opt = (n, p = 'Opción') => Array.from({ length: n }, (_, i) => ({ value: `${p}${i}`, label: `${p} ${i + 1}` }))
  const grouped = [{ value: 'a', label: 'Alfa' }, { value: 'x', label: 'Fuera', disabled: true }, { label: 'Grupo', options: [{ value: 'b', label: 'Beta' }, { value: 'c', label: 'Gamma' }] }, { value: 'd', label: 'Delta' }]
  const st = window.ex = reactive({ groups: 'b', long: null, dyn: 'Opción4', dynOpts: opt(8), cb: null, cbUp: null, filters: [], det: [] })
  const labels = { group: 'Filtros', add: 'Agregar', clear: 'Limpiar', filterBy: 'Filtrar por {label}', edit: 'Editar {summary}', remove: 'Quitar {summary}', apply: 'Aplicar', cancel: 'Cancelar', required: 'Indica', rule: 'Regla', value: 'Valor', from: 'Desde', to: 'Hasta', ops: {} }
  const fields = [{ key: 'estado', label: 'Estado', filter: { type: 'enum', options: ['activo', 'pausado'], suggest: true } }, { key: 'total', label: 'Total', filter: { type: 'number', suggest: true } }]
  const el = document.createElement('div')
  el.id = 'extras'
  el.style.cssText = 'display:flex;gap:40px;align-items:flex-start;flex-wrap:wrap;margin-block-start:40px'
  document.body.append(el)
  const wrap = (id, kid, w = 220) => h('div', { id, style: `width:${w}px` }, [kid])
  createApp({
    render: () => [
      wrap('s-groups', h(G.GSelect, { label: 'Con grupos', options: grouped, createLabel: 'Agregar nuevo', modelValue: st.groups, 'onUpdate:modelValue': (v) => { st.groups = v } })),
      wrap('s-long', h(G.GSelect, { label: 'Larga', options: opt(30), modelValue: st.long, 'onUpdate:modelValue': (v) => { st.long = v } })),
      wrap('s-dyn', h(G.GSelect, { label: 'Viva', options: st.dynOpts, modelValue: st.dyn, 'onUpdate:modelValue': (v) => { st.dyn = v } })),
      wrap('c-long', h(C, { label: 'Lleno', options: opt(30, 'Ficha'), modelValue: st.cb, 'onUpdate:modelValue': (v) => { st.cb = v } }), 280),
      h('div', { id: 'filters', style: 'width:360px' }, [h(G.GFilterBar, { fields, labels, filters: st.filters, 'onUpdate:filters': (v) => { st.filters = v } })]),
      h('div', { id: 'tb', style: 'width:520px' }, [h(G.GTable, { caption: 'Pedidos', rowKey: 'id', columns: [{ key: 'name', label: 'Nombre', primary: true }, { key: 'n', label: 'Total' }], rows: [{ id: 1, name: 'Uno', n: 10 }, { id: 2, name: 'Dos', n: 20 }, { id: 3, name: 'Tres', n: 30 }], expanded: st.det, 'onUpdate:expanded': (v) => { st.det = v } }, { detail: () => h('p', { style: 'block-size:80px;margin:0' }, 'Detalle') })])
    ]
  }).mount(el)
}

const REC = () => {
  // Muestra por cuadro lo que devuelve fn hasta parar
  window.frames = (fn) => { const xs = []; let go = true; (function f() { xs.push(fn()); if (go) requestAnimationFrame(f) })(); return () => { go = false; return xs } }
  const lin = (c) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
  const cv = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  // Color computado (también oklch/color-mix) a sRGB por el lienzo
  window.rgb = (css) => { cv.clearRect(0, 0, 1, 1); cv.fillStyle = css; cv.fillRect(0, 0, 1, 1); return [...cv.getImageData(0, 0, 1, 1).data] }
  window.lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  window.ratio = (a, b) => { const [x, y] = [lum(rgb(a)), lum(rgb(b))].sort((m, n) => n - m); return +((x + 0.05) / (y + 0.05)).toFixed(2) }
}

const gap = (p, s) => p.evaluate((s) => {
  const L = document.querySelector(`${s} .g-select__list`)
  const a = L.querySelector('.is-active')?.getBoundingClientRect(), y = L.querySelector('.g-select__highlight').getBoundingClientRect()
  if (!a) return 999
  return Math.max(Math.abs(a.left - y.left), Math.abs(a.top - y.top), Math.abs(a.width - y.width), Math.abs(a.height - y.height))
}, s)
const ring = (p, s) => p.evaluate((s) => { const e = document.querySelector(`${s} .g-select__list .is-active`); return e ? getComputedStyle(e).outlineStyle : 'sin-activa' }, s)
const WAIT = 420

for (const engine of engines) {
  const b = await pw[engine].launch()
  const open = async (o = {}) => {
    const c = await b.newContext({ viewport: { width: 1280, height: 1000 }, ...o })
    const p = await c.newPage()
    p.setDefaultTimeout(6000)
    p.errs = []
    p.on('pageerror', (e) => p.errs.push(String(e).slice(0, 200)))
    await p.goto(url)
    await p.waitForFunction(() => window.__ready)
    await p.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
    await p.evaluate(EXTRAS)
    await p.evaluate(REC)
    await p.mouse.move(2, 2)
    return p
  }
  const done = async (p, what) => { check(engine, `${what}: sin errores de página`, p.errs.length === 0, p.errs.join(' | ')); await p.context().close() }
  const btn = (s) => `${s} .g-select__button`
  const clickOpen = async (p, s) => { await p.click(btn(s)); await p.waitForTimeout(WAIT) }

  // ---------- 1. GSelect: una sola marca, nunca dos, en el componente real ----------
  if (on('select')) {
    const p = await open()
    await clickOpen(p, '#s-long')
    const rows = await p.evaluate(() => [...document.querySelectorAll('#s-long .g-select__option')].slice(0, 7).map((e) => { const r = e.getBoundingClientRect(); return [r.x + 30, r.y + r.height / 2] }))
    check(engine, 'apertura con clic: sin contorno', (await ring(p, '#s-long')) === 'none')
    check(engine, 'apertura con clic: luz encendida sobre la activa', (await gap(p, '#s-long')) <= 1)
    // Barrido rápido: cuántas superficies pinta cada cuadro (la capa + cualquier fila con fondo o contorno)
    await p.evaluate(() => {
      const L = document.querySelector('#s-long .g-select__list')
      const os = [...L.querySelectorAll('.g-select__option')]
      window.__st = frames(() => ({
        bg: os.filter((e) => getComputedStyle(e).backgroundColor !== 'rgba(0, 0, 0, 0)').length,
        ring: os.filter((e) => getComputedStyle(e).outlineStyle !== 'none').length,
        act: L.querySelectorAll('.is-active').length,
        o: +getComputedStyle(L.querySelector('.g-select__highlight')).opacity
      }))
    })
    for (const r of [...rows, ...rows.slice().reverse()]) { await p.mouse.move(...r, { steps: 3 }); await p.waitForTimeout(30) }
    await p.waitForTimeout(WAIT)
    const f = await p.evaluate(() => __st())
    check(engine, 'barrido: nunca un fondo por fila', f.every((x) => x.bg === 0))
    check(engine, 'barrido: nunca un contorno', f.every((x) => x.ring === 0))
    check(engine, 'barrido: siempre una activa', f.every((x) => x.act === 1))
    check(engine, 'barrido: la luz nunca se apaga', f.every((x) => x.o === 1), `mín ${Math.min(...f.map((x) => x.o))}`)
    note(engine, 'select.barridoCuadros', f.length)
    check(engine, 'barrido: acaba sobre la activa', (await gap(p, '#s-long')) <= 1)
    await p.keyboard.press('Escape'); await p.waitForTimeout(WAIT)

    // El teclado no deja el contorno para la siguiente apertura con puntero, ni al revés
    await p.focus(btn('#s-long')); await p.keyboard.press('Enter'); await p.waitForTimeout(WAIT)
    check(engine, 'abrir con Intro: contorno', (await ring(p, '#s-long')) === 'solid')
    await p.keyboard.press('Escape'); await p.waitForTimeout(WAIT)
    await p.click(btn('#s-long')); await p.waitForTimeout(WAIT)
    check(engine, 'reabrir con clic tras teclado: sin contorno', (await ring(p, '#s-long')) === 'none')
    await p.keyboard.press('ArrowDown'); await p.waitForTimeout(WAIT)
    check(engine, 'flecha tras clic: contorno', (await ring(p, '#s-long')) === 'solid')
    // Puntero quieto mientras se usan flechas: no quita el contorno (#358)
    await p.keyboard.press('Home'); await p.waitForTimeout(100)
    await p.keyboard.type('Opción 9', { delay: 10 }); await p.waitForTimeout(WAIT)
    check(engine, 'escritura rápida: la luz la sigue, con contorno', (await gap(p, '#s-long')) <= 1 && (await ring(p, '#s-long')) === 'solid')
    await p.keyboard.press('Escape'); await p.waitForTimeout(WAIT)
    await done(p, 'select')
  }

  // ---------- 2. Lista larga: rueda con el puntero quieto, y el puntero que vuelve a moverse ----------
  if (on('larga')) {
    const p = await open()
    await clickOpen(p, '#s-long')
    const box = await p.evaluate(() => { const r = document.querySelector('#s-long .g-select__list').getBoundingClientRect(); return [r.x + 40, r.y + 40] })
    await p.mouse.move(...box); await p.waitForTimeout(WAIT)
    const a0 = await p.evaluate(() => document.querySelector('#s-long .is-active').textContent)
    await p.mouse.wheel(0, 120); await p.waitForTimeout(WAIT)
    const s = await p.evaluate(() => ({ top: document.querySelector('#s-long .g-select__list').scrollTop, act: document.querySelector('#s-long .is-active').textContent }))
    check(engine, 'rueda: la lista se desplaza', s.top > 0, `scrollTop ${s.top}`)
    check(engine, 'rueda con puntero quieto: la activa no cambia (#358)', s.act === a0, `${a0} → ${s.act}`)
    check(engine, 'rueda: la luz va con su opción', (await gap(p, '#s-long')) <= 1)
    await p.mouse.move(box[0] + 4, box[1] + 2); await p.waitForTimeout(WAIT)
    check(engine, 'puntero que vuelve a moverse: luz bajo él', (await gap(p, '#s-long')) <= 1 && (await p.evaluate(() => document.querySelector('#s-long .is-active').textContent)) !== a0)
    // La luz no se sale de la lista: recortada por su overflow
    const clip = await p.evaluate(() => { const L = document.querySelector('#s-long .g-select__list'); return getComputedStyle(L).overflowY })
    check(engine, 'la lista recorta la capa', clip === 'auto')
    await done(p, 'larga')
  }

  // ---------- 3. Grupos y «Agregar nuevo» ----------
  if (on('grupos')) {
    const p = await open()
    await clickOpen(p, '#s-groups')
    check(engine, 'grupos: coincide con la elegida dentro del grupo', (await gap(p, '#s-groups')) <= 1)
    await p.keyboard.press('End'); await p.waitForTimeout(WAIT)
    check(engine, '«Agregar nuevo»: la luz la sigue', (await gap(p, '#s-groups')) <= 1 && (await p.evaluate(() => document.querySelector('#s-groups .is-active').classList.contains('g-select__create'))))
    // El título del grupo se lee por encima de la luz: la capa va detrás
    const z = await p.evaluate(() => { const y = document.querySelector('#s-groups .g-select__highlight'); return { z: getComputedStyle(y).zIndex, first: y === y.parentElement.firstElementChild } })
    check(engine, 'capa detrás y primer hijo', z.z === '-1' && z.first)
    await done(p, 'grupos')
  }

  // ---------- 4. Filas o tamaño que cambian con la lista abierta (select.md «Una sola luz» 5) ----------
  if (on('vivo')) {
    const p = await open()
    await clickOpen(p, '#s-dyn')
    check(engine, 'viva: empieza sobre la elegida', (await gap(p, '#s-dyn')) <= 1)
    await p.evaluate(() => { const a = [...ex.dynOpts]; ex.dynOpts = [{ value: 'n1', label: 'Nueva 1' }, { value: 'n2', label: 'Nueva 2' }, ...a] })
    await p.waitForTimeout(WAIT)
    const g1 = await gap(p, '#s-dyn')
    check(engine, 'options cambia con la lista abierta: la luz se recoloca', g1 <= 1, `Δ ${g1}px`)
    note(engine, 'select.gapOptionsCambian', g1)
    await p.setViewportSize({ width: 1100, height: 900 }); await p.waitForTimeout(WAIT)
    if (await p.evaluate(() => document.querySelector('#s-dyn .g-select__list').matches(':popover-open'))) {
      const g2 = await gap(p, '#s-dyn')
      check(engine, 'ventana que cambia: la luz se recoloca', g2 <= 1, `Δ ${g2}px`)
    }
    await done(p, 'vivo')
  }

  // ---------- 5. Movimiento reducido en el componente real ----------
  if (on('reducido')) {
    const p = await open({ reducedMotion: 'reduce' })
    await clickOpen(p, '#s-long')
    const rows = await p.evaluate(() => [...document.querySelectorAll('#s-long .g-select__option')].slice(0, 5).map((e) => { const r = e.getBoundingClientRect(); return [r.x + 30, r.y + r.height / 2] }))
    await p.mouse.move(...rows[1]); await p.waitForTimeout(WAIT)
    await p.evaluate(() => { const y = document.querySelector('#s-long .g-select__highlight'); window.__st = frames(() => getComputedStyle(y).translate) })
    await p.mouse.move(...rows[4]); await p.waitForTimeout(WAIT)
    const f = await p.evaluate(() => __st())
    check(engine, 'reducido: la luz salta sin cuadros intermedios', new Set(f).size <= 2, `estados ${new Set(f).size}`)
    check(engine, 'reducido: acaba sobre la activa', (await gap(p, '#s-long')) <= 1)
    await done(p, 'reducido')
  }

  // ---------- 6. forced-colors (Playwright lo emula en Chromium; en los demás se dice y no se supone) ----------
  if (on('forzado')) {
    const p = await open({ forcedColors: 'active' })
    const fc = await p.evaluate(() => matchMedia('(forced-colors: active)').matches)
    note(engine, 'forcedColorsEmulado', fc)
    if (fc) {
      await clickOpen(p, '#s-long')
      const r = await p.evaluate(() => { const L = document.querySelector('#s-long .g-select__list'); const a = L.querySelector('.is-active'); const c = getComputedStyle(a); return { d: getComputedStyle(L.querySelector('.g-select__highlight')).display, keyed: L.classList.contains('is-keyed'), style: c.outlineStyle, w: c.outlineWidth } })
      check(engine, 'forced-colors: sin capa, contorno sin teclado', r.d === 'none' && !r.keyed && r.style === 'solid' && parseFloat(r.w) >= 1, JSON.stringify(r))
    }
    await done(p, 'forzado')
  }

  // ---------- 7. Temas: claro y oscuro, luz frente a texto y a la lista ----------
  if (on('temas') && engine === 'chromium') {
    const rows = []
    for (const t of ['(por defecto)', ...themes]) {
      for (const scheme of ['light', 'dark']) {
        const p = await open({ colorScheme: scheme })
        if (t !== '(por defecto)') await p.addStyleTag({ content: readFileSync(new URL(t, themesDir), 'utf8') })
        await p.evaluate((s) => { document.documentElement.dataset.theme = s }, scheme)
        await clickOpen(p, '#s-groups')
        const r = await p.evaluate(() => {
          const L = document.querySelector('#s-groups .g-select__list')
          const y = getComputedStyle(L.querySelector('.g-select__highlight')).backgroundColor
          const l = getComputedStyle(L).backgroundColor
          const o = getComputedStyle(L.querySelector('.is-active')).color
          const lab = getComputedStyle(L.querySelector('.g-select__group-label')).color
          const dis = getComputedStyle(L.querySelector('[aria-disabled="true"]')).color
          const focus = getComputedStyle(document.querySelector('#s-groups .g-select')).getPropertyValue('--_focus')
          return { luzLista: ratio(y, l), textoLuz: ratio(o, y), grupoLuz: ratio(lab, y), deshabLuz: ratio(dis, y), foco: ratio(focus, y) }
        })
        rows.push({ tema: t.replace('.css', ''), esquema: scheme, ...r })
        check(engine, `${t} ${scheme}: texto sobre la luz ≥ 4.5`, r.textoLuz >= 4.5, JSON.stringify(r))
        check(engine, `${t} ${scheme}: título de grupo que la luz cruza ≥ 4.5`, r.grupoLuz >= 4.5, JSON.stringify(r))
        check(engine, `${t} ${scheme}: contorno sobre la luz ≥ 3`, r.foco >= 3, JSON.stringify(r))
        await p.context().close()
      }
    }
    note(engine, 'temas', rows)
  }

  // ---------- 8. Hoja móvil real: toque, 44 px, sin arrastre que mueva la activa ----------
  if (on('hoja')) {
    const touch = engine !== 'firefox' // Playwright: Firefox no admite isMobile, y hasTouch sin él no da toques útiles
    const p = await open({ viewport: { width: 400, height: 760 }, hasTouch: touch, isMobile: engine === 'chromium' })
    await p.evaluate(() => document.querySelector('#s-long .g-select__button').scrollIntoView({ block: 'center' }))
    if (touch) await p.tap(btn('#s-long')); else await p.click(btn('#s-long'))
    await p.waitForTimeout(WAIT)
    const r = await p.evaluate(() => { const L = document.querySelector('#s-long .g-select__list'); const a = L.querySelector('.g-select__option'); return { open: L.matches(':popover-open'), h: a.getBoundingClientRect().height, keyed: L.classList.contains('is-keyed'), lit: L.classList.contains('has-highlight') } })
    check(engine, 'hoja: abre, filas ≥ 44 px, sin contorno, con luz', r.open && r.h >= 44 && !r.keyed && r.lit, JSON.stringify(r))
    check(engine, 'hoja: luz y fila coinciden', (await gap(p, '#s-long')) <= 1)
    if (engine === 'chromium') {
      // Arrastre táctil real por la hoja (CDP): desplaza la lista y no mueve la activa
      const cdp = await p.context().newCDPSession(p)
      const a0 = await p.evaluate(() => document.querySelector('#s-long .is-active').textContent)
      const box = await p.evaluate(() => { const r = document.querySelector('#s-long .g-select__list').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height - 40 } })
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [box] })
      for (let i = 1; i <= 8; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: box.x, y: box.y - i * 20 }] }); await p.waitForTimeout(16) }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      await p.waitForTimeout(WAIT)
      const s = await p.evaluate(() => ({ top: document.querySelector('#s-long .g-select__list').scrollTop, act: document.querySelector('#s-long .is-active').textContent }))
      check(engine, 'hoja: arrastrar no mueve la activa', s.act === a0, `${a0} → ${s.act}`)
      note(engine, 'hoja.arrastreScroll', s.top)
      check(engine, 'hoja: tras arrastrar, luz con su opción', (await gap(p, '#s-long')) <= 1)
    }
    await done(p, 'hoja')
  }

  // ---------- 9. Reabrir a mitad de salida: seis paneles, a 1 y 3 cuadros del cierre ----------
  if (on('reabrir')) {
    const panels = {
      GSelect: { sel: '.g-select__list', click: '.g-select__button' },
      GMenu: { sel: '.g-menu__list', click: '.m-trigger' },
      GHelper: { sel: '.g-helper__content', click: '.g-helper__trigger', text: 'Texto de ayuda' },
      GDatePicker: { sel: '.g-datepicker__pop', click: '.g-datepicker__field' },
      GFilterBar: { sel: '.g-filter-bar__editor', click: '.g-filter-bar__suggest >> nth=0', text: 'Filtrar por Estado' },
      GCombobox: { sel: '.g-combobox__popup', click: '.g-combobox input', text: 'Uno' }
    }
    const res = {}
    for (const [name, c] of Object.entries(panels)) {
      for (const ms of [1, 3]) {
        const p = await open()
        await p.click(c.click); await p.waitForTimeout(WAIT)
        // Cierre y reapertura dentro de la página, a N cuadros: la latencia de Playwright no ensucia la medida
        await p.evaluate(async ({ s, t, n }) => {
          const el = document.querySelector(s)
          window.__st = frames(() => { const k = getComputedStyle(el); return { o: +(+k.opacity).toFixed(3), d: k.display, po: el.matches(':popover-open') } })
          document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
          for (let i = 0; i < n; i++) await new Promise(requestAnimationFrame)
          document.querySelector(t).click()
        }, { s: c.sel, t: c.click.split(' >> ')[0], n: ms })
        await p.waitForTimeout(WAIT)
        const f = await p.evaluate(() => __st())
        const st = await p.evaluate((s) => { const el = document.querySelector(s); const k = getComputedStyle(el); return { open: el.matches(':popover-open'), o: +k.opacity, inert: el.inert, text: el.textContent } }, c.sel)
        check(engine, `${name} reabre a los ${ms} cuadros: abierto, opaco, no inerte`, st.open && st.o === 1 && !st.inert, JSON.stringify({ ...st, text: st.text.slice(0, 30) }))
        if (c.text) check(engine, `${name} reabre a los ${ms} cuadros: con contenido`, st.text.includes(c.text), st.text.slice(0, 40))
        // Lo que se ve de la interrupción: la opacidad cuadro a cuadro desde el cierre
        const min = Math.min(...f.map((x) => x.o))
        ;(res[name] ||= {})[`${ms}cuadros`] = { minOpacidad: min, secuencia: f.slice(0, 12).map((x) => x.o) }
        await p.context().close()
      }
    }
    note(engine, 'reabrir', res)
  }

  // ---------- 10. La salida conserva, y luego limpia ----------
  if (on('salida')) {
    const p = await open()
    const cases = {
      GHelper: { click: '.g-helper__trigger', sel: '.g-helper__content', full: (e) => e.textContent.includes('Texto de ayuda') },
      GFilterBar: { click: '.g-filter-bar__suggest >> nth=0', sel: '.g-filter-bar__editor' },
      GCombobox: { click: '.g-combobox input', sel: '.g-combobox__popup' }
    }
    for (const [name, c] of Object.entries(cases)) {
      await p.click(c.click); await p.waitForTimeout(WAIT)
      await p.keyboard.press('Escape'); await p.waitForTimeout(WAIT)
      const r = await p.evaluate((s) => { const e = document.querySelector(s); return { shown: getComputedStyle(e).display !== 'none', inert: e.inert, n: e.childElementCount, len: e.textContent.length } }, c.sel)
      check(engine, `${name}: tras la salida, oculto y sin inert colgado`, !r.shown && !r.inert, JSON.stringify(r))
      note(engine, `salida.${name}.alFinal`, r)
    }
    await done(p, 'salida')
  }

  // ---------- 11. GCombobox: junta campo-panel con el panel lleno, y qué pasa con la fila activa al cerrar ----------
  if (on('junta')) {
    for (const up of [false, true]) {
      const p = await open()
      if (up) await p.evaluate(() => { const c = document.querySelector('#c-long'); c.style.cssText = 'position:fixed;inset-block-end:24px;inset-inline-start:24px;inline-size:280px' })
      else await p.evaluate(() => { const c = document.querySelector('#c-long'); c.style.cssText = 'position:fixed;inset-block-start:24px;inset-inline-start:24px;inline-size:280px' })
      await p.click('#c-long input'); await p.waitForTimeout(WAIT)
      const g = await p.evaluate(() => {
        const root = document.querySelector('#c-long .g-combobox')
        const c = document.querySelector('#c-long .g-input__control').getBoundingClientRect()
        const pop = document.querySelector('#c-long .g-combobox__popup')
        const pr = pop.getBoundingClientRect()
        const body = pop.querySelector('.g-combobox__popup-body').getBoundingClientRect()
        const panel = pop.querySelector('.g-combobox__panel')
        return { up: root.classList.contains('is-up'), dx: Math.abs(c.left - pr.left), dw: Math.abs(c.width - pr.width), seam: root.classList.contains('is-up') ? Math.abs(body.bottom - c.top) : Math.abs(body.top - c.bottom), scroll: panel.scrollHeight > panel.clientHeight, rows: pop.querySelectorAll('[role=option]').length }
      })
      check(engine, `junta ${up ? 'arriba' : 'abajo'}: mismo borde, mismo ancho, costura ≤ 2 px, panel lleno`, g.up === up && g.dx <= 1 && g.dw <= 1 && g.seam <= 2 && g.scroll, JSON.stringify(g))
      note(engine, `junta.${up ? 'arriba' : 'abajo'}`, g)
      // Salida: forma quieta; el campo recupera su contorno en el acto
      await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown'); await p.waitForTimeout(120)
      await p.evaluate(() => {
        const pop = document.querySelector('#c-long .g-combobox__popup')
        const ctl = document.querySelector('#c-long .g-input__control')
        const row = document.querySelector('#c-long .g-input__row')
        const act = pop.querySelector('.is-active')
        window.__act = act
        window.__st = frames(() => {
          const k = getComputedStyle(pop), r = pop.getBoundingClientRect(), cc = getComputedStyle(ctl), rr = getComputedStyle(row), a = getComputedStyle(act)
          return { o: +(+k.opacity).toFixed(3), d: k.display, y: Math.round(r.y), h: Math.round(r.height), bi: cc.borderImageSource !== 'none', ring: rr.outlineStyle, popRing: k.outlineStyle, actBorder: a.borderTopColor, actShadow: a.boxShadow !== 'none', isActive: act.classList.contains('is-active'), rows: pop.querySelectorAll('[role=option]').length }
        })
      })
      await p.keyboard.press('Escape'); await p.waitForTimeout(WAIT)
      const f = await p.evaluate(() => __st())
      const closing = f.findIndex((x) => x.o < 1)
      const fade = f.filter((x) => x.d !== 'none' && x.o > 0.001 && x.o < 1)
      if (engine === 'chromium') {
        check(engine, `junta ${up ? 'arriba' : 'abajo'}: hay fundido`, fade.length > 2, `${fade.length}`)
        check(engine, `junta ${up ? 'arriba' : 'abajo'}: la forma no se mueve al fundirse`, new Set(fade.map((x) => `${x.y},${x.h}`)).size === 1)
        check(engine, `junta ${up ? 'arriba' : 'abajo'}: el panel sigue lleno`, fade.every((x) => x.rows === 30))
        check(engine, `junta ${up ? 'arriba' : 'abajo'}: el campo recupera su contorno en el acto`, fade.every((x) => !x.bi))
        // La fila activa: desde qué opacidad del panel ha perdido la marca
        const lost = f.findIndex((x) => !x.isActive)
        note(engine, `combobox.filaActiva.${up ? 'arriba' : 'abajo'}`, { pierdeMarcaEnOpacidad: f[lost]?.o, primerCuadroDeFundido: f[closing]?.o, cuadrosFundido: fade.length, muestra: f.slice(Math.max(0, lost - 1), lost + 3).map((x) => ({ o: x.o, activa: x.isActive, borde: x.actBorder, sombra: x.actShadow })) })
      }
      await done(p, `junta ${up}`)
    }
  }

  // ---------- 12. Entra desde el lado del disparador: seis paneles, arriba y abajo, también en RTL ----------
  if (on('lado')) {
    for (const dir of ['ltr', 'rtl']) {
      for (const [name, c] of Object.entries({ GSelect: ['.g-select__list', '#s-long .g-select__button'], GMenu: ['.g-menu__list', '.m-trigger'], GHelper: ['.g-helper__content', '.g-helper__trigger'], GDatePicker: ['.g-datepicker__pop', '.g-datepicker__field'], GFilterBar: ['.g-filter-bar__editor', '.g-filter-bar__suggest >> nth=0'] })) {
        for (const pos of ['top', 'bottom']) {
          const p = await open()
          await p.evaluate((d) => { document.documentElement.dir = d }, dir)
          const trigger = c[1].split(' >> ')[0]
          // Lleva el control al borde del visor para forzar el lado
          await p.evaluate(({ t, pos }) => { const e = document.querySelector(t).closest('.g-select, .g-datepicker, .g-helper, .g-filter-bar, .g-menu') || document.querySelector(t); e.style.position = 'fixed'; e.style.insetInlineStart = '200px'; e.style[pos === 'top' ? 'top' : 'bottom'] = '12px'; e.style.zIndex = 5 }, { t: trigger, pos })
          await p.waitForTimeout(40)
          const sel = name === 'GSelect' ? `#s-long ${c[0]}` : c[0]
          await p.evaluate((s) => { window.__st = frames(() => { const el = document.querySelector(s); if (!el) return { d: 'none' }; const k = getComputedStyle(el); const r = el.getBoundingClientRect(); return { d: k.display, tr: k.translate, y: r.y, o: +k.opacity } }) }, sel)
          await p.click(c[1]); await p.waitForTimeout(WAIT)
          const f = await p.evaluate(() => __st())
          const vis = f.filter((x) => x.d !== 'none')
          const rest = vis.at(-1)
          const first = vis.find((x) => x.tr !== 'none' && x.tr !== '0px' && x.tr !== '0px 0px')
          const trig = await p.evaluate((t) => document.querySelector(t).getBoundingClientRect().y, trigger)
          const below = rest.y > trig
          ;((out[engine] ||= {}).lados ||= {})[`${name} ${dir} ${pos}`] = below ? 'abajo' : 'arriba'
          if (first) {
            const dy = parseFloat(first.tr.split(' ')[1] ?? 0) // negativo: viene de arriba
            const fine = below ? dy < 0 : dy > 0
            check(engine, `${name} ${dir} ${pos}: entra desde el lado del disparador`, fine, `abajo=${below} ${first.tr}`)
            check(engine, `${name} ${dir} ${pos}: desplazamiento ≤ space × 1`, Math.abs(dy) <= 4, first.tr)
          } else check(engine, `${name} ${dir} ${pos}: hay desplazamiento al entrar`, false, JSON.stringify(vis.slice(0, 3)))
          await p.context().close()
        }
      }
    }
  }

  // ---------- 13. GDatePicker: una marca por día, nunca dos; la salida de un día es instantánea ----------
  if (on('dias')) {
    for (const reduced of [false, true]) {
      const p = await open({ reducedMotion: reduced ? 'reduce' : 'no-preference' })
      await p.click('.g-datepicker__field'); await p.waitForTimeout(WAIT)
      const days = await p.evaluate(() => [...document.querySelectorAll('.g-datepicker__pop .g-calendar__day, .g-datepicker__pop [role=gridcell] button, .g-datepicker__pop button[data-date]')].filter((e) => !e.disabled).slice(8, 15).map((e) => { const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2] }))
      check(engine, 'días encontrados', days.length >= 5, `${days.length}`)
      await p.evaluate(() => {
        const ds = [...document.querySelectorAll('.g-datepicker__pop .g-calendar__day, .g-datepicker__pop [role=gridcell] button, .g-datepicker__pop button[data-date]')]
        const base = ds.map((e) => getComputedStyle(e).backgroundColor)
        window.__base = base
        window.__st = frames(() => ds.filter((e, i) => { const k = getComputedStyle(e); return k.backgroundColor !== 'rgba(0, 0, 0, 0)' && !e.matches('[aria-selected="true"], [aria-current]') }).length)
      })
      for (const d of days) { await p.mouse.move(...d); await p.waitForTimeout(45) }
      await p.waitForTimeout(WAIT)
      const f = await p.evaluate(() => __st())
      note(engine, `dias.maxMarcados${reduced ? 'Reducido' : ''}`, Math.max(...f))
      check(engine, `días ${reduced ? 'reducido' : ''}: nunca dos a la vez`, Math.max(...f) <= 1, `máx ${Math.max(...f)}`)
      await done(p, 'dias')
    }
  }

  // ---------- 14. GTable: detalle en plegado, sin muelle ----------
  if (on('tabla')) {
    for (const reduced of [false, true]) {
      const p = await open({ reducedMotion: reduced ? 'reduce' : 'no-preference' })
      await p.evaluate(() => { document.querySelector('#tb').scrollIntoView() })
      await p.click('#tb .g-table__door >> nth=0'); await p.waitForTimeout(WAIT)
      const r = await p.evaluate(() => {
        const b = document.querySelector('#tb .g-table__detail-body'), ct = document.querySelector('#tb .g-table__detail-content'), ch = document.querySelector('#tb .g-table__door-chevron')
        const t = (e) => { const k = getComputedStyle(e); return { p: k.transitionProperty, d: k.transitionDuration, f: k.transitionTimingFunction } }
        const probe = document.body.appendChild(document.createElement('i'))
        probe.style.transitionTimingFunction = 'var(--g-ease-out)'
        const out = getComputedStyle(probe).transitionTimingFunction
        probe.style.transitionTimingFunction = 'var(--g-ease-spring)'
        const spring = getComputedStyle(probe).transitionTimingFunction
        probe.remove()
        return { body: t(b), content: t(ct), chevron: t(ch), out, spring }
      })
      const all = [r.body.f, r.content.f, r.chevron.f].join(' ')
      check(engine, `tabla ${reduced ? 'reducido' : ''}: sin muelle en la ficha ni en el chevron`, !all.includes(r.spring), all)
      if (!reduced) {
        check(engine, 'tabla: la ficha en slow + ease-out', r.body.d.split(', ').includes('0.24s') && r.body.f.includes(r.out), JSON.stringify(r.body))
        check(engine, 'tabla: el chevron en fast + ease-out', r.chevron.d.startsWith('0.12s') && r.chevron.f.includes(r.out), JSON.stringify(r.chevron))
        check(engine, 'tabla: el contenido funde en fast', r.content.d === '0.12s', JSON.stringify(r.content))
      } else {
        check(engine, 'tabla reducido: sin transición de altura', !/grid-template-rows/.test(r.body.p) || /^0s/.test(r.body.d), JSON.stringify(r.body))
      }
      note(engine, `tabla${reduced ? 'Reducido' : ''}`, r)
      await done(p, 'tabla')
    }
  }
  await b.close()
}
writeFileSync(new URL('./auditoria-resultados.json', import.meta.url), JSON.stringify({ tally, out }, null, 1) + '\n')
console.log(JSON.stringify(tally))
console.log(`${ok}/${ok + ko}`)
process.exit(ko ? 1 : 0)
