// Tabla única de movimiento (DECISIONS #1002 a #1009; tokens.md §29.9 y §29.10; design/contracts/motion.json). Nacida de
// design/lab/movimiento/r01/medir.mjs: abrir, cerrar y recorrer por tipo de pieza sobre los componentes REALES de dist, en
// los tres motores y con movimiento reducido, comparados con `pieces` y `moments`, con la tolerancia de `behaviour`.
//
// D2 · A (#1002): el fundido de salida solo existe donde hay `overlay`. En Firefox y WebKit la salida de lo que vive en la
// capa superior es instantánea, y ESO NO ES UN FALLO: estas pruebas lo esperan (`behaviour.exitWithoutOverlay`).
//
// También: «una sola luz» de GSelect (select.md, #1004) y de GCombobox (combobox.md, #1017), incluida la marca visible de la opción activa, y que el panel no se
// vacía mientras se funde (#1005; solo Chromium, donde se ve). GSidebar y GTable: personalidad-{sidebar,table}-glide.spec.mjs.
// El rendimiento se exige solo con un worker (`--workers=1`, criterio de #965).
import { test, expect } from './vue-local.mjs'
import { readFileSync } from 'node:fs'
import { watchConsole } from './glide-helpers.mjs'

const motion = JSON.parse(readFileSync(new URL('../../../contracts/motion.json', import.meta.url), 'utf8'))
const TOL = motion.behaviour.toleranceMs
const PAGE = '/design/lab/movimiento/r01/banco.html'
const WAIT = 420 // más que la transición más larga de la tabla

test.setTimeout(120_000)

// Lo que el banco no trae, montado con los componentes reales en una segunda aplicación
async function mountExtras(page) {
  await page.evaluate(() => {
    const { createApp, h, reactive } = Vue
    const G = Grana
    const st = reactive({ groups: 'b', long: null, free: null, filters: [], dlg: false, cb: {} })
    const el = document.createElement('div')
    el.id = 'extras'
    el.style.cssText = 'display:flex;gap:40px;align-items:flex-start;flex-wrap:wrap;margin-block-start:40px'
    document.body.append(el)
    const opt = (n, p = 'Opción') => Array.from({ length: n }, (_, i) => ({ value: `${p}${i}`, label: `${p} ${i + 1}` }))
    const grouped = [{ value: 'a', label: 'Alfa' }, { value: 'x', label: 'Fuera', disabled: true }, { label: 'Grupo', options: [{ value: 'b', label: 'Beta' }, { value: 'c', label: 'Gamma' }] }, { value: 'd', label: 'Delta' }]
    const toaster = G.createToaster({ labels: { region: 'Avisos ({hotkey})', close: 'Cerrar', types: { info: 'Información', success: 'Correcto', warning: 'Advertencia', error: 'Error', loading: 'En curso' }, repeated: '{count} veces', queued: '{count} más', actionHint: 'Pulsa {hotkey} para {action}.' } })
    window.__toast = toaster
    const labels = { group: 'Filtros', add: 'Agregar', clear: 'Limpiar', filterBy: 'Filtrar por {label}', edit: 'Editar {summary}', remove: 'Quitar {summary}', apply: 'Aplicar', cancel: 'Cancelar', required: 'Indica', rule: 'Regla', value: 'Valor', from: 'Desde', to: 'Hasta', ops: {} }
    const fields = [{ key: 'estado', label: 'Estado', filter: { type: 'enum', options: ['activo', 'pausado'], suggest: true } }, { key: 'total', label: 'Total', filter: { type: 'number', suggest: true } }]
    const wrap = (id, kid) => h('div', { id, style: 'width:220px' }, [kid])
    const cbLabels = { close: 'Cerrar', preview: 'Vista previa', previewEmpty: 'Nada', noResults: 'Sin resultados para {text}', selected: '{count} elegidas', chosen: 'Elegidas', done: 'Listo', rest: 'y {count} más', basketEmpty: 'Nada', undo: 'Deshacer', trace: 'Quitada' }
    const cbs = [
      ['c-long', { options: opt(30) }],
      ['c-groups', { options: [{ value: 'a', label: 'Alfa' }, { value: 'x', label: 'Fuera', disabled: true }, { label: 'Grupo', options: [{ value: 'b', label: 'Beta' }, { value: 'c', label: 'Gamma' }] }] }],
      ['c-pal', { appearance: 'palette', options: opt(12) }],
      ['c-multi', { multiple: true, options: opt(8), start: ['Opción1', 'Opción2'] }]
    ]
    createApp({
      render: () => [
        wrap('s-groups', h(G.GSelect, { label: 'Con grupos', options: grouped, createLabel: 'Agregar nuevo', modelValue: st.groups, 'onUpdate:modelValue': (v) => { st.groups = v } })),
        wrap('s-long', h(G.GSelect, { label: 'Larga', options: opt(30), modelValue: st.long, 'onUpdate:modelValue': (v) => { st.long = v } })),
        wrap('s-perf', h(G.GSelect, { label: 'Cien', options: opt(100), modelValue: st.free, 'onUpdate:modelValue': (v) => { st.free = v } })),
        h('div', { id: 'filters', style: 'width:360px' }, [h(G.GFilterBar, { fields, labels, filters: st.filters, 'onUpdate:filters': (v) => { st.filters = v } })]),
        h('div', { id: 'acc', style: 'width:320px' }, [h(G.GAccordion, null, () => [h(G.GAccordionItem, { title: 'Plegado', value: 'uno' }, () => h('p', { style: 'block-size:160px;margin:0' }, 'Contenido'))])]),
        h('button', { id: 'd-open', onClick: () => { st.dlg = true } }, 'Diálogo'),
        h(G.GDialog, { id: 'd-x', modelValue: st.dlg, title: 'Diálogo', closeLabel: 'Cerrar', 'onUpdate:modelValue': (v) => { st.dlg = v } }, () => h('p', 'Contenido')),
        ...cbs.map(([id, props]) => wrap(id, h(GranaCombobox.GCombobox, { label: id, labels: cbLabels, delay: 0, modelValue: st.cb[id] ?? props.start ?? null, 'onUpdate:modelValue': (v) => { st.cb[id] = v }, ...props }))),
        h(G.GToaster)
      ]
    }).use(toaster).mount(el)
  })
}

async function bench(page, { viewport = { width: 1280, height: 1100 }, dir } = {}) {
  await page.setViewportSize(viewport)
  await page.goto(PAGE)
  await page.waitForFunction(() => window.__ready)
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
  await mountExtras(page)
  if (dir) await page.evaluate((d) => { document.documentElement.dir = d }, dir)
  await page.evaluate(() => {
    // Cuadro a cuadro: lo que el motor tiene EN MARCHA sobre el elemento (duración y curva reales, sin el ruido de medir por
    // cuadros con la máquina cargada), si se ve, y qué desplazamiento y escala lleva
    window.rec = (sel) => {
      const xs = []
      let on = true
      ;(function f() {
        const e = document.querySelector(sel)
        const c = e && getComputedStyle(e)
        const run = !e ? [] : e.getAnimations().map((a) => {
          const prop = a.transitionProperty || 'keyframes'
          const list = a.transitionProperty ? c.transitionProperty.split(', ') : null
          const curves = (a.transitionProperty ? c.transitionTimingFunction : c.animationTimingFunction).split(/,\s(?![^(]*\))/)
          const t = a.effect.getTiming()
          return { prop, ms: t.duration + t.delay, curve: curves[list ? Math.max(0, list.indexOf(prop)) % curves.length : 0] }
        })
        xs.push({ shown: Boolean(c) && c.display !== 'none', tr: c ? c.translate : null, sc: c ? c.scale : null, run })
        if (on) requestAnimationFrame(f)
      })()
      return () => { on = false; return xs }
    }
  })
  await page.mouse.move(2, 2)
}

// --g-duration-slow es un calc(): el valor resuelto lo da una transición de prueba
const tokens = (page) => page.evaluate((durations) => {
  const el = document.body.appendChild(document.createElement('i'))
  const out = {}
  for (const [k, v] of Object.entries(durations)) {
    el.style.transitionDuration = `var(${v})`
    out[k] = parseFloat(getComputedStyle(el).transitionDuration) * 1000
  }
  el.remove()
  return out
}, motion.durations)

// Un solo cambio es instantáneo; si hay más, desde el último cuadro sin cambio hasta el último cambio
const elapsed = (xs, ch) => (ch.length > 1 ? ch.at(-1).t - xs[xs.indexOf(ch[0]) - 1].t : 0)
const moved = (xs, k, rest) => xs.some((x) => x[k] && !rest.includes(x[k]))
const span = (xs, prop) => {
  const seen = xs.filter((x) => x.shown).flatMap((x) => x.run).filter((r) => r.prop === prop || (prop === 'opacity' && r.prop === 'keyframes'))
  return {
    ms: seen.length ? Math.max(...seen.map((r) => r.ms)) : 0,
    curves: [...new Set(seen.map((r) => r.curve))],
    instant: seen.length === 0,
    desplaza: moved(xs, 'tr', ['none', '0px', '0px 0px']),
    escala: moved(xs, 'sc', ['none', '1'])
  }
}
async function measure(page, sel, act, prop = 'opacity') {
  await page.evaluate((s) => { window.__s = window.rec(s) }, sel)
  await act()
  await page.waitForTimeout(WAIT)
  return span(await page.evaluate(() => window.__s()), prop)
}
const near = (got, want, what) => expect(Math.abs(got - want), `${what}: ${got} ms frente a ${want} ms`).toBeLessThanOrEqual(TOL)

// Curva de la fila, resuelta con una transición de prueba, frente a la que lleva lo que está en marcha
const curveOf = (page, token) => page.evaluate((v) => {
  const el = document.body.appendChild(document.createElement('i'))
  el.style.transitionTimingFunction = v
  const out = getComputedStyle(el).transitionTimingFunction
  el.remove()
  return out
}, token)
async function checkCurve(page, row, got, what) {
  if (!row.curve || got.instant) return
  const want = await curveOf(page, row.curve === 'linear' ? 'linear' : `var(${motion.curves[row.curve]})`)
  expect(got.curves, `${what}: curva`).toEqual([want])
}

// Salida sujeta a `overlay`: fundido en Chromium; en el acto en los demás (D2 · A, no es fallo)
function checkExit(exit, got, want, engine, what) {
  const instant = exit.requires === 'overlay' && motion.behaviour.exitWithoutOverlay.engines.includes(engine)
  if (instant) expect(got.instant, `${what}: en ${engine} es instantánea (D2 · A)`).toBe(true)
  else near(got.ms, want, what)
}

const esc = (page) => page.keyboard.press('Escape')
const PANELS = {
  GSelect: { sel: '.g-select__list', open: (p) => p.click('.g-select__control'), close: esc },
  GMenu: { sel: '.g-menu__list', open: (p) => p.click('.m-trigger'), close: esc },
  GHelper: { sel: '.g-helper__content', open: (p) => p.click('.g-helper__trigger'), close: esc },
  GDatePicker: { sel: '.g-datepicker__pop', open: (p) => p.click('.g-datepicker__field'), close: esc },
  GFilterBar: { sel: '.g-filter-bar__editor', open: (p) => p.click('.g-filter-bar__suggest >> nth=0'), close: esc }
}

for (const reduced of [false, true]) {
  test.describe(`por tipo de pieza · ${reduced ? 'movimiento reducido' : 'sin reducir'}`, () => {
    test.use({ contextOptions: { reducedMotion: reduced ? 'reduce' : 'no-preference' } })
    const row = (name) => (reduced ? motion.pieces[name].reduced : motion.pieces[name])

    for (const [name, c] of Object.entries(PANELS)) {
      test(`panel anclado · ${name}`, async ({ page, browserName }) => {
        const errs = watchConsole(page)
        await bench(page)
        const T = await tokens(page)
        const { enter, exit } = row('panelAnclado')
        const a = await measure(page, c.sel, () => c.open(page))
        near(a.ms, T[enter.duration], `${name} abre`)
        await checkCurve(page, enter, a, `${name} abre`)
        expect(a.desplaza, `${name}: desplazamiento al abrir`).toBe(Boolean(enter.offset))
        expect(a.escala, `${name}: escala al abrir`).toBe(false)
        const z = await measure(page, c.sel, () => c.close(page))
        checkExit(exit, z, T[exit.duration], browserName, `${name} cierra`)
        await checkCurve(page, exit, z, `${name} cierra`)
        expect(z.escala, `${name}: escala al cerrar`).toBe(false)
        expect(z.desplaza, `${name}: desplazamiento al cerrar`).toBe(false)
        expect(errs).toEqual([])
      })
    }

    test('hoja móvil · GSelect', async ({ page, browserName }) => {
      await bench(page, { viewport: { width: 400, height: 760 } })
      const T = await tokens(page)
      const { enter, exit } = row('hojaMovil')
      const a = await measure(page, '.g-select__list', () => page.click('.g-select__control'))
      near(a.ms, T[enter.duration], 'la hoja abre')
      expect(a.desplaza).toBe(Boolean(enter.offset))
      const z = await measure(page, '.g-select__list', () => esc(page))
      checkExit(exit, z, T[exit.duration], browserName, 'la hoja cierra')
      expect(z.desplaza).toBe(false)
    })

    test('diálogo · GDialog', async ({ page, browserName }) => {
      await bench(page)
      const T = await tokens(page)
      const { enter, exit } = row('dialogo')
      const a = await measure(page, '#d-x', () => page.click('#d-open'))
      near(a.ms, T[enter.duration], 'el diálogo abre')
      const z = await measure(page, '#d-x', () => esc(page))
      checkExit(exit, z, T[exit.duration], browserName, 'el diálogo cierra')
    })

    test('plegado · GAccordion: altura en slow, sin transición con reducido', async ({ page }) => {
      await bench(page)
      const T = await tokens(page)
      const sel = '#acc .g-accordion-item__panel'
      const btn = '#acc button'
      const a = await measure(page, sel, () => page.click(btn), 'grid-template-rows')
      const z = await measure(page, sel, () => page.click(btn), 'grid-template-rows')
      if (reduced) {
        expect(a.instant, 'abrir sin transición de altura').toBe(true)
        expect(z.instant, 'plegar sin transición de altura').toBe(true)
      } else {
        near(a.ms, T[motion.pieces.plegado.enter.duration], 'abre')
        near(z.ms, T[motion.pieces.plegado.exit.duration], 'pliega')
      }
    })

    test('aviso flotante · GToast', async ({ page }) => {
      await bench(page)
      const T = await tokens(page)
      const { enter, exit } = row('avisoFlotante')
      let id
      const a = await measure(page, '.g-toast', async () => { id = await page.evaluate(() => window.__toast.show({ type: 'info', title: 'Hecho', duration: 0 })) })
      near(a.ms, T[enter.duration], 'el aviso entra')
      const z = await measure(page, '.g-toast', () => page.evaluate((i) => window.__toast.dismiss(i), id))
      near(z.ms, T[exit.duration], 'el aviso sale')
    })

    test('excepción · GCombobox A: abre desplegando y cierra sujeto a overlay', async ({ page, browserName }) => {
      await bench(page)
      const T = await tokens(page)
      const a = await measure(page, '.g-combobox__popup-body', () => page.click('.g-combobox input'), 'grid-template-rows')
      if (reduced) expect(a.instant, 'sin despliegue').toBe(true)
      else near(a.ms, T.slow, 'despliega')
      const z = await measure(page, '.g-combobox__popup', () => esc(page))
      checkExit({ requires: 'overlay' }, z, T.fast, browserName, 'se funde')
    })

    // Recorrer: de la fila 2 a la 4 con el ratón. Cuenta cuadros y el tiempo del cambio
    async function walk(page, { open, rowSel, probe }) {
      await open()
      await page.waitForTimeout(WAIT)
      const rows = page.locator(rowSel)
      const a = await rows.nth(1).boundingBox()
      const z = await rows.nth(3).boundingBox()
      await page.mouse.move(a.x + 20, a.y + 8)
      await page.mouse.move(a.x + 22, a.y + 8) // GCombobox: el primer evento tras abrir solo anota dónde está
      await page.waitForTimeout(WAIT)
      await page.evaluate(({ rowSel, probe }) => {
        window.__fr = []
        let on = true
        const t0 = performance.now()
        const fn = new Function('rowSel', probe)
        ;(function f() { window.__fr.push({ t: Math.round(performance.now() - t0), v: fn(rowSel) }); if (on) requestAnimationFrame(f) })()
        window.__off = () => { on = false; return window.__fr }
      }, { rowSel, probe })
      await page.mouse.move(z.x + 20, z.y + 8)
      await page.waitForTimeout(WAIT)
      const fr = await page.evaluate(() => window.__off())
      const ch = fr.filter((x, i) => i && x.v !== fr[i - 1].v)
      return { states: new Set(fr.map((x) => x.v)).size, ms: elapsed(fr, ch), frames: fr }
    }
    const TRANSLATE = (sel) => `return getComputedStyle(document.querySelector('${sel}')).translate`

    for (const [name, c] of Object.entries({
      GSelect: { open: (p) => p.click('.g-select__control'), rowSel: '.g-select__list >> nth=0 >> .g-select__option', probe: TRANSLATE('.g-select__highlight') },
      GMenu: { open: (p) => p.click('.m-trigger'), rowSel: '.g-menu__list [role^="menuitem"]', probe: TRANSLATE('.g-menu__highlight') },
      GCombobox: { open: (p) => p.click('.g-combobox input'), rowSel: '.g-combobox__option', probe: TRANSLATE('.g-combobox__highlight') }
    })) {
      test(`recorrer filas que se tocan · ${name}`, async ({ page }) => {
        await bench(page)
        const T = await tokens(page)
        const w = await walk(page, { ...c, open: () => c.open(page) })
        const { travel } = motion.moments.recorrerFilas.rule
        if (reduced) {
          expect(w.states, 'solo fundido, sin viaje').toBeLessThanOrEqual(2)
          expect(w.ms).toBeLessThanOrEqual(TOL)
        } else {
          expect(w.states, 'viaja por cuadros intermedios').toBeGreaterThanOrEqual(4)
          near(w.ms, T[travel.duration], 'viaje')
        }
      })
    }
  })
}

// ---------- Cambiar de nivel (moments.cambiarNivel, #1020, #1023) ----------
// Solo por comportamiento: GDatePicker del banco, días → meses (sube) y meses → días (baja). Lo detallado (Δ 0 cuadro a
// cuadro, dos meses, interrupción, Esc en GDialog, táctil) está en datepicker-r02.spec.mjs
for (const reduced of [false, true]) {
  test.describe(`cambiarNivel · ${reduced ? 'reducido' : 'sin reducir'}`, () => {
    test.use({ contextOptions: { reducedMotion: reduced ? 'reduce' : 'no-preference' } })
    test('GDatePicker: duración y curva de la fila, escala acotada, Δ 0 del panel; nunca dos vistas', async ({ page }) => {
      const rule = motion.moments.cambiarNivel.rule.enter
      await bench(page)
      const T = await tokens(page)
      await page.click('.g-datepicker__field')
      await page.waitForTimeout(WAIT)
      const size = () => page.evaluate(() => { const r = document.querySelector('.g-datepicker__surface').getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)] })
      const s0 = await size()
      for (const act of [() => page.click('.g-datepicker__title-part--month'), () => page.click('.g-datepicker__pick >> nth=3')]) {
        await page.evaluate(() => {
          const xs = []
          let on = true
          ;(function f() {
            const v = [...document.querySelectorAll('.g-datepicker__view')]
            const c = v[0] && getComputedStyle(v[0])
            xs.push({ kinds: new Set(v.map((e) => e.className)).size, run: v[0] ? v[0].getAnimations().map((a) => ({ ms: a.effect.getTiming().duration, curve: c.animationTimingFunction })) : [], tf: c ? c.transform : 'none' })
            if (on) requestAnimationFrame(f)
          })()
          window.__lv = () => { on = false; return xs }
        })
        await act()
        await page.waitForTimeout(WAIT)
        const xs = await page.evaluate(() => window.__lv())
        const run = xs.flatMap((x) => x.run)
        expect(xs.every((x) => x.kinds <= 1), 'nunca dos vistas').toBe(true)
        near(Math.max(...run.map((r) => r.ms)), T[reduced ? 'fast' : rule.duration], 'cambiarNivel')
        expect([...new Set(run.map((r) => r.curve))]).toEqual([await curveOf(page, reduced ? 'linear' : `var(${motion.curves[rule.curve]})`)])
        const sc = xs.map((x) => (x.tf === 'none' ? 1 : Number(/matrix\(([^,]+)/.exec(x.tf)?.[1] ?? 1)))
        if (reduced) expect(sc.every((v) => v === 1), 'sin escala').toBe(true)
        else expect(Math.min(...sc) >= 0.95 && Math.max(...sc) <= 1.05, `escala ${Math.min(...sc)}…${Math.max(...sc)}`).toBe(true)
        expect(await size(), 'Δ 0 del panel').toEqual(s0)
      }
    })
  })
}

// ---------- GSelect · una sola luz ----------
const OPT = '.g-select__option'
const LIST = (s) => `${s} .g-select__list`
const gap = (page, scope) => page.evaluate((s) => {
  const L = document.querySelector(`${s} .g-select__list`)
  const a = L.querySelector('.is-active').getBoundingClientRect()
  const y = L.querySelector('.g-select__highlight').getBoundingClientRect()
  return Math.max(Math.abs(a.left - y.left), Math.abs(a.top - y.top), Math.abs(a.width - y.width), Math.abs(a.height - y.height))
}, scope)
const ring = (page, scope) => page.evaluate((s) => getComputedStyle(document.querySelector(`${s} .g-select__list .is-active`)).outlineStyle, scope)
const btnOf = (scope) => `${scope} .g-select__button`
async function openSel(page, scope) {
  await page.click(btnOf(scope))
  await page.waitForTimeout(WAIT)
}
const rowsOf = (page, scope) => page.evaluate((s) => [...document.querySelectorAll(`${s} .g-select__option`)].map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, off: e.getAttribute('aria-disabled') === 'true' } }), scope)

test.describe('GSelect · una sola luz (select.md, #1004)', () => {
  test('marca visible: la opción activa se distingue de las demás en los píxeles, sin teclado', async ({ page }) => {
    await bench(page)
    await openSel(page, '#s-long')
    const rows = await rowsOf(page, '#s-long')
    await page.mouse.move(2, 2)
    expect(await page.evaluate((s) => {
      const L = document.querySelector(`${s} .g-select__list`)
      const y = L.querySelector('.g-select__highlight')
      const c = getComputedStyle(y)
      return { lit: L.classList.contains('has-highlight'), o: c.opacity, d: c.display, bg: c.backgroundColor, list: getComputedStyle(L).backgroundColor }
    }, '#s-long')).toMatchObject({ lit: true, o: '1', d: 'list-item' })
    const active = await page.evaluate((s) => [...document.querySelectorAll(`${s} .g-select__option`)].findIndex((e) => e.classList.contains('is-active')), '#s-long')
    expect(active).toBe(0)
    expect(await ring(page, '#s-long'), 'sin contorno: la marca es la luz').toBe('none')
    // Una franja sin texto del borde inicial de cada fila
    const strip = (r) => page.screenshot({ clip: { x: r.x + 2, y: r.y + r.h / 2 - 2, width: 3, height: 4 } })
    const on = await strip(rows[0])
    const off = await strip(rows[2])
    expect(on.equals(off), 'la fila activa pinta distinto de una fila sin marca').toBe(false)
    expect(await gap(page, '#s-long')).toBeLessThanOrEqual(1)
  })

  test('puntero: una superficie, cuadros intermedios, acaba sobre la activa; foco en el botón y sin contorno', async ({ page }) => {
    const errs = watchConsole(page)
    await bench(page)
    await openSel(page, '#s-long')
    const rows = await rowsOf(page, '#s-long')
    await page.mouse.move(rows[0].x + 20, rows[0].y + 8)
    await page.waitForTimeout(WAIT)
    await page.evaluate((s) => {
      const L = document.querySelector(`${s} .g-select__list`)
      const y = L.querySelector('.g-select__highlight')
      const os = [...L.querySelectorAll('.g-select__option')]
      window.__f = []
      window.__on = true
      ;(function f() { window.__f.push(`${getComputedStyle(y).translate}|${os.filter((e) => getComputedStyle(e).backgroundColor !== 'rgba(0, 0, 0, 0)').length}`); if (window.__on) requestAnimationFrame(f) })()
    }, '#s-long')
    await page.mouse.move(rows[3].x + 20, rows[3].y + 8)
    await page.waitForTimeout(WAIT)
    const fr = await page.evaluate(() => { window.__on = false; return window.__f })
    expect(new Set(fr).size, 'cuadros intermedios').toBeGreaterThanOrEqual(4)
    expect(fr.every((x) => x.endsWith('|0')), 'ninguna opción pinta fondo propio').toBe(true)
    expect(await gap(page, '#s-long')).toBeLessThanOrEqual(1)
    expect(await page.evaluate((s) => document.activeElement === document.querySelector(`${s} .g-select__button`), '#s-long')).toBe(true)
    expect(await ring(page, '#s-long')).toBe('none')
    expect(errs).toEqual([])
  })

  test('teclado: la flecha mueve la luz y pinta el contorno; el ratón lo quita; la siguiente flecha lo devuelve', async ({ page }) => {
    await bench(page)
    await openSel(page, '#s-long')
    const rows = await rowsOf(page, '#s-long')
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(WAIT)
    expect(await ring(page, '#s-long')).toBe('solid')
    expect(await gap(page, '#s-long')).toBeLessThanOrEqual(1)
    await page.mouse.move(rows[3].x + 20, rows[3].y + 8)
    await page.mouse.move(rows[3].x + 24, rows[3].y + 8)
    await page.waitForTimeout(WAIT)
    expect(await ring(page, '#s-long')).toBe('none')
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(WAIT)
    expect(await ring(page, '#s-long')).toBe('solid')
  })

  test('apertura y cierre: aparece sobre la activa sin viajar, también al reabrir; no se apaga antes que la lista', async ({ page }) => {
    await bench(page)
    await openSel(page, '#s-long')
    await page.keyboard.press('End')
    await page.waitForTimeout(WAIT)
    const lit = await page.evaluate((s) => {
      const L = document.querySelector(`${s} .g-select__list`)
      document.querySelector(`${s} .g-select__button`).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      return { cls: L.classList.contains('has-highlight'), o: getComputedStyle(L.querySelector('.g-select__highlight')).opacity }
    }, '#s-long')
    expect(lit).toEqual({ cls: true, o: '1' })
    await page.waitForTimeout(WAIT)
    // Reabrir: la fila elegida no es la última; la capa no viaja desde la posición del cierre
    await page.evaluate((s) => {
      const y = document.querySelector(`${s} .g-select__highlight`)
      window.__t = []
      window.__on = true
      ;(function f() { window.__t.push(new DOMMatrix(getComputedStyle(y).transform).m42 + getComputedStyle(y).translate); if (window.__on) requestAnimationFrame(f) })()
    }, '#s-long')
    await page.click(btnOf('#s-long'))
    await page.waitForTimeout(WAIT)
    const t = await page.evaluate(() => { window.__on = false; return window.__t })
    expect(new Set(t).size, 'dos valores: el de cierre y el de llegada').toBeLessThanOrEqual(2)
    expect(await gap(page, '#s-long')).toBeLessThanOrEqual(1)
  })

  test('huecos: sobre un título, una deshabilitada o fuera de la lista, la luz no cambia', async ({ page }) => {
    await bench(page)
    await openSel(page, '#s-groups')
    const at = () => page.evaluate((s) => getComputedStyle(document.querySelector(`${s} .g-select__highlight`)).translate, '#s-groups')
    const before = await at()
    const label = await page.locator(`${LIST('#s-groups')} .g-select__group-label`).boundingBox()
    const off = await page.locator(`${LIST('#s-groups')} [aria-disabled="true"]`).boundingBox()
    for (const [x, y] of [[label.x + 20, label.y + 6], [off.x + 20, off.y + 6], [2, 2]]) {
      await page.mouse.move(x, y)
      await page.mouse.move(x + 3, y)
      await page.waitForTimeout(220)
      expect(await at()).toBe(before)
    }
    expect(await gap(page, '#s-groups')).toBeLessThanOrEqual(1)
  })

  test('forma: grupos y «Agregar nuevo», lista desplazada y al desplazar va con su opción', async ({ page }) => {
    await bench(page)
    await openSel(page, '#s-groups')
    expect(await gap(page, '#s-groups')).toBeLessThanOrEqual(1)
    await page.keyboard.press('End')
    await page.waitForTimeout(WAIT)
    expect(await gap(page, '#s-groups')).toBeLessThanOrEqual(1)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(WAIT)
    await openSel(page, '#s-long')
    for (let k = 0; k < 22; k++) await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(WAIT)
    expect(await page.evaluate((s) => document.querySelector(`${s} .g-select__list`).scrollTop, '#s-long')).toBeGreaterThan(0)
    expect(await gap(page, '#s-long')).toBeLessThanOrEqual(1)
    await page.evaluate((s) => { document.querySelector(`${s} .g-select__list`).scrollTop -= 40 }, '#s-long')
    await page.waitForTimeout(60)
    expect(await gap(page, '#s-long')).toBeLessThanOrEqual(1)
  })

  test('RTL: luz y fila coinciden', async ({ page }) => {
    await bench(page, { dir: 'rtl' })
    await openSel(page, '#s-long')
    expect(await gap(page, '#s-long')).toBeLessThanOrEqual(1)
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(WAIT)
    expect(await gap(page, '#s-long')).toBeLessThanOrEqual(1)
  })

  test('hoja móvil: luz y fila coinciden', async ({ page }) => {
    await bench(page, { viewport: { width: 400, height: 760 } })
    await page.evaluate(() => document.querySelector('#s-long .g-select__button').click())
    await page.waitForTimeout(WAIT)
    expect(await gap(page, '#s-long')).toBeLessThanOrEqual(1)
  })

  test('ARIA: roles y aria-activedescendant sin cambios; la capa no cuenta como opción', async ({ page }) => {
    await bench(page)
    await openSel(page, '#s-groups')
    const a = await page.evaluate((s) => {
      const b = document.querySelector(`${s} .g-select__button`)
      const L = document.querySelector(`${s} .g-select__list`)
      const y = L.firstElementChild
      return { cls: y.className, role: y.getAttribute('role'), hidden: y.getAttribute('aria-hidden'), active: L.querySelector(`[id="${b.getAttribute('aria-activedescendant')}"]`)?.classList.contains('is-active'), focus: document.activeElement === b, listRole: L.getAttribute('role') }
    }, '#s-groups')
    expect(a).toEqual({ cls: 'g-select__highlight', role: 'none', hidden: 'true', active: true, focus: true, listRole: 'listbox' })
  })

  test('rendimiento: con 100 opciones y la flecha mantenida, 0 tareas largas (--workers=1, #965)', async ({ page, browserName }, info) => {
    test.skip(browserName !== 'chromium', 'longtask solo existe en Chromium')
    test.skip(info.config.workers > 1, 'compuerta de rendimiento: con --workers=1 (#965)')
    await bench(page)
    await openSel(page, '#s-perf')
    const long = await page.evaluate(async (s) => {
      const b = document.querySelector(`${s} .g-select__button`)
      const seen = []
      const po = new PerformanceObserver((l) => seen.push(...l.getEntries().map((e) => Math.round(e.duration))))
      po.observe({ type: 'longtask' })
      for (let i = 0; i < 60; i++) {
        b.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, repeat: true }))
        await new Promise(requestAnimationFrame)
        await new Promise(requestAnimationFrame)
      }
      po.disconnect()
      return seen
    }, '#s-perf')
    expect(long).toEqual([])
  })

  test.describe('movimiento reducido', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } })
    test('sin viaje, con fundido', async ({ page }) => {
      await bench(page)
      await openSel(page, '#s-long')
      const tp = await page.evaluate((s) => { const c = getComputedStyle(document.querySelector(`${s} .g-select__highlight`)); return [c.transitionProperty, c.transitionTimingFunction] }, '#s-long')
      expect(tp).toEqual(['opacity', 'linear'])
    })
  })

  test.describe('forced-colors', () => {
    test.use({ contextOptions: { forcedColors: 'active' } })
    test('sin capa; la activa con contorno tras usar el puntero', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'emulación de forced-colors solo verificada en Chromium')
      await bench(page)
      await openSel(page, '#s-long')
      expect(await page.evaluate((s) => getComputedStyle(document.querySelector(`${s} .g-select__highlight`)).display, '#s-long')).toBe('none')
      expect(await ring(page, '#s-long')).toBe('solid')
    })
  })
})

// ---------- GCombobox · una sola luz ----------
const cbPanel = (s) => `${s} .g-combobox__panel`
const cbGap = (page, scope) => page.evaluate((s) => {
  const P = [...document.querySelectorAll(`${s} .g-combobox__panel`)].at(-1)
  const a = P.querySelector('.is-active').getBoundingClientRect()
  const y = P.querySelector('.g-combobox__highlight').getBoundingClientRect()
  return Math.max(Math.abs(a.left - y.left), Math.abs(a.top - y.top), Math.abs(a.width - y.width), Math.abs(a.height - y.height))
}, scope)
const cbRing = (page, scope) => page.evaluate((s) => getComputedStyle(document.querySelector(`${s} .g-combobox__panel .is-active`)).outlineStyle, scope)
const cbInput = (s) => `${s} input[role="combobox"]`
async function openCb(page, scope) {
  await page.locator(cbInput(scope)).scrollIntoViewIfNeeded()
  await page.click(cbInput(scope))
  await page.waitForTimeout(WAIT)
}
const cbRows = (page, scope) => page.evaluate((s) => [...document.querySelectorAll(`${s} .g-combobox__option`)].map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height } }), scope)
const cbAt = (page, scope) => page.evaluate((s) => getComputedStyle(document.querySelector(`${s} .g-combobox__highlight`)).translate, scope)
function watchLight(page, scope) {
  return page.evaluate((s) => {
    const y = document.querySelector(`${s} .g-combobox__highlight`)
    window.__f = []
    window.__on = true
    ;(function f() { window.__f.push(getComputedStyle(y).translate); if (window.__on) requestAnimationFrame(f) })()
  }, scope)
}
const endLight = (page) => page.evaluate(() => { window.__on = false; return window.__f })

test.describe('GCombobox · una sola luz (combobox.md, #1017)', () => {
  test('puntero: cuadros intermedios, acaba sobre la activa sin contorno y sin fondo propio; el foco sigue en el campo', async ({ page }) => {
    const errs = watchConsole(page)
    await bench(page)
    await openCb(page, '#c-long')
    const rows = await cbRows(page, '#c-long')
    await page.mouse.move(rows[0].x + 20, rows[0].y + 8)
    await page.mouse.move(rows[0].x + 22, rows[0].y + 8)
    await page.waitForTimeout(WAIT)
    await page.evaluate((s) => {
      const P = document.querySelector(`${s} .g-combobox__panel`)
      const y = P.querySelector('.g-combobox__highlight')
      const os = [...P.querySelectorAll('.g-combobox__option')]
      const paint = (e) => { const c = getComputedStyle(e); return c.backgroundColor !== 'rgba(0, 0, 0, 0)' || c.boxShadow !== 'none' }
      window.__f = []
      window.__on = true
      ;(function f() { window.__f.push(`${getComputedStyle(y).translate}|${os.filter(paint).length}`); if (window.__on) requestAnimationFrame(f) })()
    }, '#c-long')
    await page.mouse.move(rows[3].x + 20, rows[3].y + 8)
    await page.waitForTimeout(WAIT)
    const fr = await endLight(page)
    expect(new Set(fr).size, 'cuadros intermedios').toBeGreaterThanOrEqual(4)
    expect(fr.every((x) => x.endsWith('|0')), 'ninguna opción pinta fondo ni sombra propios').toBe(true)
    expect(await cbGap(page, '#c-long')).toBeLessThanOrEqual(1)
    expect(await page.evaluate((s) => document.activeElement === document.querySelector(s), cbInput('#c-long'))).toBe(true)
    expect(await cbRing(page, '#c-long')).toBe('none')
    expect(errs).toEqual([])
  })

  test('teclado: ↓ mueve la luz y pinta el contorno; escribir también; mover el ratón lo quita', async ({ page }) => {
    await bench(page)
    await openCb(page, '#c-long')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(WAIT)
    expect(await cbRing(page, '#c-long')).toBe('solid')
    expect(await cbGap(page, '#c-long')).toBeLessThanOrEqual(1)
    const rows = await cbRows(page, '#c-long')
    await page.mouse.move(rows[3].x + 20, rows[3].y + 8)
    await page.mouse.move(rows[3].x + 24, rows[3].y + 8)
    await page.waitForTimeout(WAIT)
    expect(await cbRing(page, '#c-long')).toBe('none')
    await page.keyboard.type('op')
    await page.waitForTimeout(WAIT)
    expect(await cbRing(page, '#c-long'), 'Intro elegirá la activa: hay que verla').toBe('solid')
  })

  test('resultados: al cambiar las filas, la luz no viaja', async ({ page }) => {
    await bench(page)
    await openCb(page, '#c-long')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(WAIT)
    await watchLight(page, '#c-long')
    await page.keyboard.type('opción 1')
    await page.waitForTimeout(WAIT)
    const t = await endLight(page)
    expect(new Set(t).size, `posiciones ${[...new Set(t)].join(' · ')}`).toBeLessThanOrEqual(3) // la de antes, la de cada letra que cambia filas se coloca sin pasos
    expect(await cbGap(page, '#c-long')).toBeLessThanOrEqual(1)
  })

  test('huecos: sobre un título, una deshabilitada o fuera del panel, la luz no cambia', async ({ page }) => {
    await bench(page)
    await openCb(page, '#c-groups')
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(WAIT)
    const before = await cbAt(page, '#c-groups')
    const label = await page.locator('#c-groups .g-combobox__group-label').boundingBox()
    const off = await page.locator('#c-groups [role="option"][aria-disabled="true"]').boundingBox()
    for (const [x, y] of [[label.x + 20, label.y + 6], [off.x + 20, off.y + 6], [2, 2]]) {
      await page.mouse.move(x, y)
      await page.mouse.move(x + 3, y)
      await page.waitForTimeout(220)
      expect(await cbAt(page, '#c-groups')).toBe(before)
    }
    expect(await cbGap(page, '#c-groups')).toBeLessThanOrEqual(1)
  })

  test('apertura y cierre: no se apaga durante la salida; al reabrir no viaja desde donde estaba', async ({ page }) => {
    await bench(page)
    await openCb(page, '#c-long')
    for (let k = 0; k < 4; k++) await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(WAIT)
    const lit = await page.evaluate((s) => {
      const P = document.querySelector(`${s} .g-combobox__panel`)
      document.querySelector(`${s} input[role="combobox"]`).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
      return { cls: P.classList.contains('has-highlight'), o: getComputedStyle(P.querySelector('.g-combobox__highlight')).opacity }
    }, '#c-long')
    expect(lit).toEqual({ cls: true, o: '1' })
    await page.waitForTimeout(WAIT)
    await watchLight(page, '#c-long')
    await page.keyboard.press('ArrowDown') // abre y activa la primera: una segunda flecha ya sería un viaje legítimo
    await page.waitForTimeout(WAIT)
    const t = await endLight(page)
    expect(await cbGap(page, '#c-long')).toBeLessThanOrEqual(1)
    expect(new Set(t).size, 'dos valores: el de cierre y el de llegada').toBeLessThanOrEqual(2)
  })

  test('formas: hacia arriba, lista desplazada y al desplazar va con su opción', async ({ page }) => {
    await bench(page)
    await openCb(page, '#c-long')
    for (let k = 0; k < 22; k++) await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(WAIT)
    expect(await page.evaluate((s) => document.querySelector(s).scrollTop, cbPanel('#c-long'))).toBeGreaterThan(0)
    expect(await cbGap(page, '#c-long')).toBeLessThanOrEqual(1)
    await page.evaluate((s) => { document.querySelector(s).scrollTop -= 40 }, cbPanel('#c-long'))
    await page.waitForTimeout(60)
    expect(await cbGap(page, '#c-long')).toBeLessThanOrEqual(1)
    await esc(page)
    await page.waitForTimeout(WAIT)
    await page.evaluate(() => { const c = document.querySelector('#c-long'); c.style.position = 'fixed'; c.style.insetBlockEnd = '24px'; c.style.insetInlineStart = '24px' })
    await page.click(cbInput('#c-long'))
    await page.waitForTimeout(WAIT)
    expect(await page.evaluate(() => document.querySelector('#c-long .g-combobox').classList.contains('is-up'))).toBe(true)
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(WAIT)
    expect(await cbGap(page, '#c-long')).toBeLessThanOrEqual(1)
  })

  test('forma: paleta, también lo medido mientras entra el diálogo', async ({ page }) => {
    await bench(page)
    await page.locator(cbInput('#c-pal')).scrollIntoViewIfNeeded()
    await page.focus(cbInput('#c-pal'))
    await page.keyboard.press('Enter')
    await page.keyboard.press('ArrowDown') // en plena entrada: GDialog aún tiene `scale`
    await page.waitForTimeout(WAIT)
    expect(await cbGap(page, '#c-pal')).toBeLessThanOrEqual(1)
    expect(await cbRing(page, '#c-pal')).toBe('solid')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(WAIT)
    expect(await cbGap(page, '#c-pal')).toBeLessThanOrEqual(1)
  })

  test('forma: multiple con «Elegidas» y con la lista desplazada', async ({ page }) => {
    await bench(page)
    await openCb(page, '#c-multi')
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(WAIT)
    expect(await cbGap(page, '#c-multi')).toBeLessThanOrEqual(1)
    for (let k = 0; k < 5; k++) await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(WAIT)
    expect(await cbGap(page, '#c-multi')).toBeLessThanOrEqual(1)
  })

  test('forma: RTL', async ({ page }) => {
    await bench(page, { dir: 'rtl' })
    await openCb(page, '#c-long')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(WAIT)
    expect(await cbGap(page, '#c-long')).toBeLessThanOrEqual(1)
  })

  test('forma: hoja móvil', async ({ page }) => {
    await bench(page, { viewport: { width: 400, height: 760 } })
    await page.evaluate((s) => { const e = document.querySelector(s); e.scrollIntoView(); e.focus() }, cbInput('#c-long'))
    await page.keyboard.press('Enter')
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(WAIT)
    expect(await page.evaluate(() => Boolean(document.querySelector('#c-long .g-combobox-surface--sheet')))).toBe(true)
    expect(await cbGap(page, '#c-long')).toBeLessThanOrEqual(1)
  })

  test('sin salto: la fila no cambia de color, borde ni sombra al pasar a activa; ARIA intacta y la capa fuera del listbox', async ({ page }) => {
    await bench(page)
    await openCb(page, '#c-long')
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(WAIT)
    const look = () => page.evaluate((s) => {
      const e = document.querySelectorAll(`${s} .g-combobox__option`)[1]
      const c = getComputedStyle(e)
      const t = getComputedStyle(e.querySelector('.g-summary__title') || e)
      return [c.backgroundColor, c.borderTopColor, c.boxShadow, t.color].join('|')
    }, '#c-long')
    const off = await look()
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(WAIT)
    expect(await look()).toBe(off)
    const a = await page.evaluate((s) => {
      const i = document.querySelector(`${s} input[role="combobox"]`)
      const P = document.querySelector(`${s} .g-combobox__panel`)
      return { first: P.firstElementChild.className, hidden: P.firstElementChild.getAttribute('aria-hidden'), inList: Boolean(P.querySelector('[role="listbox"] .g-combobox__highlight')), active: P.querySelector(`[id="${i.getAttribute('aria-activedescendant')}"]`)?.classList.contains('is-active'), focus: document.activeElement === i }
    }, '#c-long')
    expect(a).toEqual({ first: 'g-combobox__highlight', hidden: 'true', inList: false, active: true, focus: true })
  })

  test('rendimiento: con la flecha mantenida, 0 tareas largas (--workers=1, #965)', async ({ page, browserName }, info) => {
    test.skip(browserName !== 'chromium', 'longtask solo existe en Chromium')
    test.skip(info.config.workers > 1, 'compuerta de rendimiento: con --workers=1 (#965)')
    await bench(page)
    await openCb(page, '#c-long')
    const long = await page.evaluate(async (s) => {
      const b = document.querySelector(`${s} input[role="combobox"]`)
      const seen = []
      const po = new PerformanceObserver((l) => seen.push(...l.getEntries().map((e) => Math.round(e.duration))))
      po.observe({ type: 'longtask' })
      for (let i = 0; i < 60; i++) {
        b.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, repeat: true }))
        await new Promise(requestAnimationFrame)
        await new Promise(requestAnimationFrame)
      }
      po.disconnect()
      return seen
    }, '#c-long')
    expect(long).toEqual([])
  })

  test.describe('movimiento reducido', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } })
    test('sin viaje, con fundido', async ({ page }) => {
      await bench(page)
      await openCb(page, '#c-long')
      const tp = await page.evaluate((s) => { const c = getComputedStyle(document.querySelector(`${s} .g-combobox__highlight`)); return [c.transitionProperty, c.transitionTimingFunction] }, '#c-long')
      expect(tp).toEqual(['opacity', 'linear'])
    })
  })

  test.describe('forced-colors', () => {
    test.use({ contextOptions: { forcedColors: 'active' } })
    test('sin capa; la activa con contorno tras usar el puntero', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'emulación de forced-colors solo verificada en Chromium')
      await bench(page)
      await openCb(page, '#c-long')
      const rows = await cbRows(page, '#c-long')
      await page.mouse.move(rows[2].x + 20, rows[2].y + 8)
      await page.mouse.move(rows[2].x + 24, rows[2].y + 8)
      await page.waitForTimeout(WAIT)
      expect(await page.evaluate((s) => getComputedStyle(document.querySelector(`${s} .g-combobox__highlight`)).display, '#c-long')).toBe('none')
      expect(await cbRing(page, '#c-long')).toBe('solid')
    })
  })
})

// ---------- #1005: el panel no se vacía mientras se funde (solo Chromium: en los demás no hay fundido) ----------
test.describe('la salida no vacía el panel (#1005)', () => {
  test.beforeEach(({ browserName }) => { test.skip(browserName !== 'chromium', 'D2 · A: en Firefox y WebKit la salida es instantánea') })
  // Cierra en este mismo cuadro y anota, cuadro a cuadro mientras se ve, opacidad, contenido, lado y caja
  async function exitFrames(page, sel, probe, close) {
    await page.evaluate(({ sel, probe }) => {
      const el = document.querySelector(sel)
      const fn = new Function('el', probe)
      window.__x = []
      window.__on = true
      ;(function f() {
        const c = getComputedStyle(el)
        const r = el.getBoundingClientRect()
        window.__x.push({ o: +c.opacity, d: c.display, v: fn(el), y: Math.round(r.y), x: Math.round(r.x), h: Math.round(r.height) })
        if (window.__on) requestAnimationFrame(f)
      })()
    }, { sel, probe })
    await close()
    await page.waitForTimeout(WAIT)
    const xs = await page.evaluate(() => { window.__on = false; return window.__x })
    return xs.filter((x) => x.d !== 'none' && x.o > 0.001 && x.o < 1) // por debajo no se ve: el temporizador ya pudo vaciarlo
  }

  test('GHelper: el contenido y la caja siguen mientras baja la opacidad; reabrir a mitad lo conserva', async ({ page }) => {
    await bench(page)
    await page.click('.g-helper__trigger')
    await page.waitForTimeout(WAIT)
    const fading = await exitFrames(page, '.g-helper__content', "return el.textContent", () => esc(page))
    expect(fading.length, 'hay fundido').toBeGreaterThan(2)
    expect(fading.every((x) => x.v.includes('Texto de ayuda')), 'con contenido').toBe(true)
    expect(new Set(fading.map((x) => `${x.x},${x.y},${x.h}`)).size, 'sin saltar').toBe(1)
    await page.click('.g-helper__trigger')
    await page.waitForTimeout(WAIT)
    await esc(page)
    await page.waitForTimeout(40)
    await page.click('.g-helper__trigger')
    await page.waitForTimeout(WAIT)
    expect(await page.textContent('.g-helper__content')).toContain('Texto de ayuda')
    expect(await page.evaluate(() => document.querySelector('.g-helper__content').inert)).toBe(false)
  })

  test('GFilterBar: el editor sigue lleno al fundirse, con el foco ya en el chip; abrir otro nada más cerrar', async ({ page }) => {
    await bench(page)
    await page.click('.g-filter-bar__suggest >> nth=0')
    await page.waitForTimeout(WAIT)
    const fading = await exitFrames(page, '.g-filter-bar__editor', "return el.querySelector('.g-filter-bar__editor-title')?.textContent + '|' + el.querySelectorAll('input').length", () => esc(page))
    expect(fading.length, 'hay fundido').toBeGreaterThan(2)
    expect(fading.every((x) => x.v === 'Filtrar por Estado|2'), 'lleno').toBe(true)
    expect(new Set(fading.map((x) => `${x.x},${x.y},${x.h}`)).size, 'sin saltar').toBe(1)
    expect(await page.evaluate(() => document.activeElement.className)).toContain('g-filter-bar__suggest')
    await page.click('.g-filter-bar__suggest >> nth=0')
    await page.waitForTimeout(WAIT)
    await esc(page)
    await page.locator('.g-filter-bar__suggest').nth(1).click()
    await page.waitForTimeout(WAIT)
    expect(await page.textContent('.g-filter-bar__editor-title')).toBe('Filtrar por Total')
    expect(await page.evaluate(() => document.querySelector('.g-filter-bar__editor').matches(':popover-open'))).toBe(true)
  })

  test('GCombobox A: filas, lado y colocación siguen al fundirse, también abierto hacia arriba; reabrir a mitad', async ({ page }) => {
    await bench(page)
    // Abajo del todo para que abra hacia arriba
    await page.evaluate(() => { const c = document.querySelector('.g-combobox'); c.style.position = 'fixed'; c.style.insetBlockEnd = '24px'; c.style.insetInlineStart = '24px'; c.style.inlineSize = '260px' })
    await page.click('.g-combobox input')
    await page.waitForTimeout(WAIT)
    expect(await page.evaluate(() => document.querySelector('.g-combobox').classList.contains('is-up'))).toBe(true)
    const fading = await exitFrames(page, '.g-combobox__popup', "return el.querySelectorAll('[role=option]').length + '|' + el.classList.contains('is-empty') + '|' + document.querySelector('.g-combobox').classList.contains('is-up')", () => esc(page))
    expect(fading.length, 'hay fundido').toBeGreaterThan(2)
    expect(fading.every((x) => x.v === '5|false|true'), 'con filas, sin is-empty y hacia arriba').toBe(true)
    expect(new Set(fading.map((x) => `${x.x},${x.y},${x.h}`)).size, 'sin saltar de lado').toBe(1)
    await page.click('.g-combobox input')
    await page.waitForTimeout(WAIT)
    await esc(page)
    await page.waitForTimeout(40)
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(WAIT)
    expect(await page.evaluate(() => document.querySelectorAll('.g-combobox__popup [role=option]').length)).toBe(5)
  })
})
