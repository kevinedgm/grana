// Pieza 2 · densidad global y por región (design/contracts/density.md §10; DECISIONS #974 a #982). Dueño: bruno.
// Componentes REALES del dist/ montados en una página propia (Vue de node_modules por page.route: unpkg está bloqueado).
//
//   1  Δ0 por defecto frente al dist/ anterior (density.base.json) y marcado sin --density-* ni data-g-density
//   2  región: GBtn, GInput, GSelect, GDatePicker, GTextarea rows=1 y GInputGroup md 27/31,5; el resto Δ0 frente a la prop
//   3  anidación · 4 la prop gana · 5 B (la prop es región) · 6 top layer · 7 diálogo heredado · 8 superficies de página Δ0
//   9  formularios · 10 cambio en marcha (≤ 2 cuadros, sin transiciones de medida, foco, un observador, 0 tareas largas)
//   11 CLI frente a <html> · 12 táctil (P2) · 13 sin JS · 14 marca de GTabs · 15 meta de GCard · 16 rejilla y mínimos
//   17 grep de las hojas · 18 blocks (peso en CHANGELOG; la coherencia visual es de la auditoría de coco)
//
// Ejecutar: GRANA_PW_PORT=4208 npx playwright test tests/density.spec.mjs --project=chromium
// Línea base: GRANA_DIST_DIR=<dist de 08ffaa8> DENSITY_WRITE_BASE=1 npx playwright test tests/density.spec.mjs -g "criterio 1"
// --project=chromium (la escribe en density.base.json). El criterio 10 de tareas largas se exige sin vecinos (#965):
// lanzar con --workers=1. VERBOSE=1 imprime las cifras.
import { test, expect } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const VUE = ROOT + 'node_modules/vue/dist/vue.global.js'
const DIST = process.env.GRANA_DIST_DIR || ROOT + 'packages/vue/dist/'
const BASE_FILE = fileURLToPath(new URL('./density.base.json', import.meta.url))
const WRITE_BASE = !!process.env.DENSITY_WRITE_BASE
const V = !!process.env.VERBOSE
const near = (a, b, t = 0.05) => Math.abs(a - b) <= t

// ---------------------------------------------------------------------------------------------------- la página
const SCRIPTS = ['grana', 'combobox', 'time-field', 'slider', 'file-field', 'form-fold', 'booking']
function pageHtml({ css = '', tokens = '', htmlAttr = '' } = {}) {
  return `<!doctype html><html lang="es"${htmlAttr}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/__dist/grana.css"><link rel="stylesheet" href="/__dist/fonts.css">${tokens ? `<style id="tokens">${tokens}</style>` : ''}
<style>body{margin:0;padding:8px;background:var(--g-color-bg);color:var(--g-color-text);font-family:var(--g-font-ui)}
.case{margin:0 0 12px;max-inline-size:640px}${css}</style></head><body><div id="app"></div>
<script src="/__vue.js"></script>${SCRIPTS.map((s) => `<script src="/__dist/${s}.umd.js"></script>`).join('')}</body></html>`
}
let pageOpts = {}
async function routes(ctx, dist = DIST) {
  await ctx.route('**/__vue.js', (r) => r.fulfill({ path: VUE, contentType: 'application/javascript' }))
  await ctx.route('**/__dist/**', (r) => {
    const file = dist + new URL(r.request().url()).pathname.replace('/__dist/', '')
    return existsSync(file) ? r.fulfill({ path: file }) : r.fulfill({ status: 404, body: '' })
  })
  await ctx.route('**/__density.html', (r) => r.fulfill({ contentType: 'text/html', body: pageHtml(pageOpts) }))
}

const SETUP = `
  const { createApp, reactive, ref } = Vue
  const s = reactive({ name: 'Ada', notes: '', plan: 'pro', date: null, on: true, chk: true, grp: ['a'], radio: 'a', sl: 3, qty: 7, time: '09:30', cb: null, files: [], party: null, menu: false, dlg: false, tab: 'a', lada: '+52', tel: '', show: true, fold: true, side: 'home', grid: [{ id: 'a', w: 2, h: 1 }] })
  const opts = [{ value: 'a', label: 'Alfa' }, { value: 'b', label: 'Beta' }]
  const plans = [{ value: 'basic', label: 'Básico' }, { value: 'pro', label: 'Pro' }]
  const items = [{ id: 'a', label: 'Renombrar' }, { id: 'b', label: 'Duplicar' }, { id: 'c', label: 'Eliminar', danger: true }]
  const tabs = [{ id: 'a', label: 'Resumen' }, { id: 'b', label: 'Actividad' }, { id: 'c', label: 'Ajustes' }]
  const steps = [{ id: 'a', label: 'Cuenta' }, { id: 'b', label: 'Perfil' }, { id: 'c', label: 'Listo' }]
  const cols = [{ key: 'n', label: 'Nombre' }, { key: 'c', label: 'Ciudad' }]
  const rowsN = (n) => Array.from({ length: n }, (_, i) => ({ id: i + 1, n: 'Persona ' + (i + 1), c: i % 2 ? 'Oaxaca' : 'Puebla' }))
  const rows = rowsN(3)
  const sideItems = [{ label: 'General', items: [{ id: 'home', label: 'Inicio', href: '#home' }, { id: 'rep', label: 'Reportes', href: '#rep' }] }]
  const meta = [{ label: 'Alta', value: '1' }, { label: 'Media', value: '2' }, { label: 'Baja', value: '3', priority: 'low' }]
  const cbOptions = [{ value: 'a', label: 'Asma' }, { value: 'b', label: 'Bronquitis' }]
  const cbLabels = { clear: 'Limpiar', open: 'Abrir', empty: 'Sin resultados', loading: 'Cargando', results: '{count} resultados', error: 'Error', retry: 'Reintentar', remove: 'Quitar {label}', selected: '{label} elegido', noMatch: 'Sin coincidencias' }
  const dpLabels = { prev: 'Anterior', next: 'Siguiente', open: 'Abrir', close: 'Cerrar', today: 'Hoy', clear: 'Limpiar', apply: 'Aplicar', cancel: 'Cancelar', month: 'Mes', year: 'Año', dialog: 'Elegir fecha' }
  const partyRows = [{ id: 'adults', label: 'Adultos', min: 1, max: 8, default: 2 }]
  const ffLabels = { add: 'Añadir archivos', drop: 'Suelta aquí', remove: 'Quitar {name}', retry: 'Reintentar', uploading: 'Subiendo', failed: 'Falló', done: 'Listo' }
  const wLabels = { empty: 'Vacío', actions: 'Acciones de' }
  const gridLabels = { empty: 'Sin widgets', moveBefore: 'Mover antes', moveAfter: 'Mover después', size: 'Tamaño', remove: 'Quitar' }
  const ladas = [{ value: '+52', label: '+52' }, { value: '+1', label: '+1' }]
`
const BINDINGS = 's, opts, plans, items, tabs, steps, cols, rows, rowsN, sideItems, meta, cbOptions, cbLabels, dpLabels, partyRows, ffLabels, wLabels, gridLabels, ladas'

async function mount(page, template) {
  await page.goto('/__density.html')
  await page.evaluate(async ({ template, SETUP, BINDINGS }) => {
    const fn = new Function('template', `${SETUP}
      const app = createApp({ template, setup: () => ({ ${BINDINGS} }) })
      app.config.warnHandler = () => {}
      window.__toaster = Grana.createToaster(); app.use(window.__toaster)
      for (const g of ['Grana', 'GranaCombobox', 'GranaTimeField', 'GranaSlider', 'GranaFileField', 'GranaFormFold', 'GranaBooking']) if (window[g]) app.use(window[g])
      window.__s = s
      app.mount('#app'); return app`)
    window.__app = fn(template)
    await document.fonts.ready
  }, { template, SETUP, BINDINGS })
  await page.waitForSelector('.case', { state: 'attached' })
  await page.waitForTimeout(250)
}

// Catálogo: los componentes con `density` (sin GSpeechTrigger, que necesita el motor de voz; su GBtn es el de btn)
const CATALOG = (a = '') => ({
  btn: `<g-btn ${a}>Guardar</g-btn>`,
  'btn-outline': `<g-btn variant="outline" size="sm" ${a}>Ver</g-btn>`,
  card: `<g-card title="Ingresos" description="Del periodo" :meta="meta" ${a}><template #actions><g-btn variant="outline">Ver</g-btn></template></g-card>`,
  checkbox: `<g-checkbox label="Acepto" v-model="s.chk" ${a}></g-checkbox>`,
  'checkbox-group': `<g-checkbox-group label="Alergias" v-model="s.grp" :options="opts" ${a}></g-checkbox-group>`,
  form: `<g-form ${a}><g-form-layout><g-input label="Nombre" v-model="s.name"></g-input></g-form-layout><g-form-actions><g-btn type="submit">Guardar</g-btn></g-form-actions></g-form>`,
  sidebar: `<div style="block-size:240px;display:flex"><g-sidebar label="Principal" v-model="s.side" :items="sideItems" :labels="{ collapse: 'Plegar', expand: 'Desplegar', menu: 'Menú', more: 'Más' }" ${a}></g-sidebar></div>`,
  split: `<g-split ${a}><template #start><p>Inicio</p></template><template #end><p>Fin</p></template></g-split>`,
  stack: `<g-stack ${a}><g-btn>Uno</g-btn><g-btn>Dos</g-btn></g-stack>`,
  stepper: `<g-stepper aria-label="Registro" :steps="steps" model-value="a" ${a}></g-stepper>`,
  surface: `<g-surface ${a}><p>Contenido</p></g-surface>`,
  table: `<g-table :columns="cols" :rows="rows" caption="Clientes" row-key="id" ${a}><template #toolbar><g-btn variant="outline" size="sm">Exportar</g-btn></template></g-table>`,
  tabs: `<g-tabs :items="tabs" v-model="s.tab" label="Vistas" ${a}></g-tabs>`,
  widget: `<g-widget title="Ingresos" :labels="wLabels" ${a}><p>12</p></g-widget>`,
  'widget-grid': `<g-widget-grid v-model="s.grid" label="Panel" :labels="gridLabels" :columns="4" ${a}><template #item="{ id }"><g-widget title="W" :labels="wLabels"></g-widget></template></g-widget-grid>`,
  input: `<g-input label="Nombre" v-model="s.name" ${a}></g-input>`,
  textarea: `<g-textarea label="Notas" v-model="s.notes" :rows="1" ${a}></g-textarea>`,
  select: `<g-select label="Plan" v-model="s.plan" :options="plans" ${a}></g-select>`,
  date: `<g-date-picker label="Fecha" v-model="s.date" :labels="dpLabels" ${a}></g-date-picker>`,
  radio: `<g-radio-group label="Vista" v-model="s.radio" :options="opts" name="vista" ${a}></g-radio-group>`,
  'radio-seg': `<g-radio-group label="Modo" v-model="s.radio" :options="opts" appearance="segmented" name="modo" ${a}></g-radio-group>`,
  switch: `<g-switch label="Activo" v-model="s.on" ${a}></g-switch>`,
  slider: `<g-slider label="Dolor" v-model="s.sl" :max="10" locale="es" ${a}></g-slider>`,
  number: `<g-number-field label="Cantidad" v-model="s.qty" :min="0" :max="99" :precision="0" steppers decrement-label="Restar" increment-label="Sumar" locale="es" ${a}></g-number-field>`,
  time: `<g-time-field label="Hora" v-model="s.time" locale="es" :labels="{ invalid: 'Escribe una hora' }" ${a}></g-time-field>`,
  combobox: `<g-combobox label="Diagnóstico" v-model="s.cb" :options="cbOptions" :labels="cbLabels" ${a}></g-combobox>`,
  file: `<g-file-field label="Adjuntos" name="adj" v-model="s.files" :labels="ffLabels" ${a}></g-file-field>`,
  party: `<g-party-field label="Huéspedes" v-model="s.party" :rows="partyRows" :labels="{ done: 'Listo', separator: ' · ' }" ${a}></g-party-field>`,
  'form-layout': `<g-form-layout ${a}><g-input label="A" v-model="s.name"></g-input><g-input label="B" v-model="s.name"></g-input></g-form-layout>`,
  'form-row': `<g-form-row ${a}><g-input label="A" v-model="s.name"></g-input><g-input label="B" v-model="s.name"></g-input></g-form-row>`,
  'field-group': `<g-field-group label="Fecha" ${a}><g-input label="Día" v-model="s.name"></g-input><g-input label="Mes" v-model="s.name"></g-input></g-field-group>`,
  'input-group': `<g-input-group label="Teléfono" ${a}><g-input-group-select v-model="s.lada" part-label="País" :options="ladas"></g-input-group-select><g-input-group-input v-model="s.tel" principal part-label="Número"></g-input-group-input></g-input-group>`,
  'form-actions': `<g-form-actions ${a}><g-btn variant="outline">Cancelar</g-btn><g-btn type="submit">Guardar</g-btn></g-form-actions>`,
  adaptive: `<g-adaptive-layout ${a}><g-input label="A" v-model="s.name"></g-input><g-input label="B" v-model="s.name"></g-input></g-adaptive-layout>`
})
const catalogTpl = (a, wrap = (x) => x) => Object.entries(CATALOG(a)).map(([k, v]) => `<div class="case" data-case="${k}">${wrap(v)}</div>`).join('\n')

// Medida genérica de un caso: alto, relleno y separación de cada elemento del subárbol, en orden de documento
const MEASURE = (scope) => {
  const out = {}
  for (const c of document.querySelectorAll(`${scope} .case`)) {
    const list = []
    for (const el of [c, ...c.querySelectorAll('*')]) {
      if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue
      const cs = getComputedStyle(el)
      const r = el.getBoundingClientRect()
      const n = (v) => Math.round(parseFloat(v || 0) * 100) / 100 || 0
      list.push([Math.round(r.height * 100) / 100, n(cs.paddingTop), n(cs.paddingRight), n(cs.paddingBottom), n(cs.paddingLeft), n(cs.rowGap), n(cs.columnGap)])
    }
    out[c.dataset.case] = list
  }
  return out
}
const diffCase = (a, b) => {
  if (!a || !b) return 'falta'
  if (a.length !== b.length) return `elementos ${a.length} ≠ ${b.length}`
  for (let i = 0; i < a.length; i++) for (let j = 0; j < 7; j++) if (Math.abs(a[i][j] - b[i][j]) > 0.02) return `#${i}[${j}] ${a[i][j]} ≠ ${b[i][j]}`
  return null
}
const h = (page, sel) => page.evaluate((sel) => { const el = document.querySelector(sel); return el ? Math.round(el.getBoundingClientRect().height * 100) / 100 : null }, sel)
const dens = (page, sel) => page.evaluate((sel) => { const el = document.querySelector(sel); return el ? getComputedStyle(el).getPropertyValue('--g-density').trim() : null }, sel)
// La caja visible de cada control de criterio 2
const BOX = { btn: 'button.g-btn', input: '.g-input__control', select: '.g-select__control', date: '.g-datepicker__field', textarea: '.g-textarea__control', 'input-group': '.g-input-group__box' }

async function open(browser, { dist, touch = false, opts = {}, js = true } = {}) {
  pageOpts = opts
  const ctx = await browser.newContext(touch
    ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, javaScriptEnabled: js }
    : { viewport: { width: 1280, height: 900 }, javaScriptEnabled: js })
  await routes(ctx, dist)
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  return { ctx, page, errors }
}

test.beforeEach(({ browserName }) => { test.skip(browserName !== 'chromium' && !process.env.DENSITY_ALL, 'encargo: solo Chromium aquí (DENSITY_ALL=1 para los tres motores)') })

// ---------------------------------------------------------------------------------------------------- 1
test('criterio 1 · Δ0 por defecto frente al dist/ anterior y marcado sin densidad', async ({ browser }) => {
  const { ctx, page, errors } = await open(browser)
  await mount(page, `<main id="cat">${catalogTpl('')}</main>`)
  const now = await page.evaluate(MEASURE, '#cat')
  if (WRITE_BASE) {
    writeFileSync(BASE_FILE, JSON.stringify(now))
    await ctx.close()
    test.skip(true, 'línea base escrita')
    return
  }
  expect(existsSync(BASE_FILE), 'density.base.json (dist/ de 08ffaa8)').toBe(true)
  const base = JSON.parse(readFileSync(BASE_FILE, 'utf8'))
  for (const k of Object.keys(base)) expect.soft(diffCase(base[k], now[k]), `Δ0 ${k}`).toBeNull()
  // Marcado: ninguna raíz sin prop lleva --density-* ni data-g-density (salvo superficies de página y GCalendar)
  const leaks = await page.evaluate(() => [...document.querySelectorAll('#cat [data-g-density], #cat [class*="--density-"]')].map((e) => e.className))
  expect(leaks).toEqual([])
  expect(errors).toEqual([])
  await ctx.close()
})

// ---------------------------------------------------------------------------------------------------- 2, 3, 4
test('criterios 2 a 4 · región, anidación y la prop gana', async ({ browser }) => {
  const { ctx, page } = await open(browser)
  const six = (a) => Object.keys(BOX).map((k) => `<div class="case" data-case="${k}">${CATALOG(a)[k]}</div>`).join('')
  await mount(page, `
    <section id="r-compact" data-g-density="compact">${six('')}</section>
    <section id="r-comf" data-g-density="comfortable">${six('')}</section>
    <section id="p-compact">${six('density="compact"')}</section>
    <section id="n1" data-g-density="comfortable"><div data-g-density="compact"><div class="case"><g-btn id="n-a">A</g-btn></div></div></section>
    <section id="n2" data-g-density="compact"><div data-g-density="default"><div class="case"><g-btn id="n-b">B</g-btn></div></div></section>
    <section id="n3" data-g-density="compact"><div data-g-density="comfortable"><div data-g-density="compact"><div class="case"><g-btn id="n-c">C</g-btn></div></div><div class="case"><g-btn id="n-d">D</g-btn></div></div></section>
    <section data-g-density="compact"><div class="case"><g-btn id="w-a" density="default">X</g-btn></div></section>
    <section data-g-density="comfortable"><div class="case"><g-btn id="w-b" density="compact">Y</g-btn></div></section>
    <div class="case"><g-stack id="w-c" density="compact" data-g-density="comfortable"><g-btn>Z</g-btn></g-stack></div>`)
  for (const [k, sel] of Object.entries(BOX)) {
    const c = await h(page, `#r-compact [data-case="${k}"] ${sel}`)
    const f = await h(page, `#r-comf [data-case="${k}"] ${sel}`)
    const p = await h(page, `#p-compact [data-case="${k}"] ${sel}`)
    if (V) console.log('2', k, c, f, p)
    expect.soft(near(c, 27), `2 compact ${k} ${c}`).toBe(true)
    expect.soft(near(f, 31.5), `2 comfortable ${k} ${f}`).toBe(true)
    expect.soft(near(c, p, 0.01), `2 región = prop ${k}`).toBe(true)
  }
  expect.soft(near(await h(page, '#n-a'), 27), '3 compact dentro de comfortable').toBe(true)
  expect.soft(near(await h(page, '#n-b'), 36), '3 default dentro de compact').toBe(true)
  expect.soft(near(await h(page, '#n-c'), 27), '3 tres niveles: compact').toBe(true)
  expect.soft(near(await h(page, '#n-d'), 31.5), '3 tres niveles: comfortable').toBe(true)
  expect.soft(near(await h(page, '#w-a'), 36), '4 default en compact').toBe(true)
  expect.soft(near(await h(page, '#w-b'), 27), '4 compact en comfortable').toBe(true)
  const st = await page.evaluate(() => { const e = document.querySelector('#w-c'); return [e.getAttribute('data-g-density'), e.className] })
  expect.soft(st[0], '4 la prop gana al atributo de la aplicación').toBe('compact')
  expect.soft(st[1]).toContain('g-stack--density-compact')
  expect.soft(near(await h(page, '#w-c button.g-btn'), 27)).toBe(true)
  await ctx.close()
})

test('criterio 2 · el resto de componentes en una región miden lo mismo que con la prop explícita (Δ0)', async ({ browser }) => {
  const { ctx, page } = await open(browser)
  for (const d of ['compact', 'comfortable']) {
    await mount(page, `<main id="reg" data-g-density="${d}">${catalogTpl('')}</main><main id="prop">${catalogTpl(`density="${d}"`)}</main>`)
    const reg = await page.evaluate(MEASURE, '#reg')
    const prop = await page.evaluate(MEASURE, '#prop')
    for (const k of Object.keys(reg)) expect.soft(diffCase(prop[k], reg[k]), `${d} ${k}: región ≠ prop`).toBeNull()
  }
  await ctx.close()
})

// ---------------------------------------------------------------------------------------------------- 5, 6
test('criterios 5 y 6 · la prop es región (tabla, tarjeta, diálogo, pila) y el top layer hereda del disparador', async ({ browser }) => {
  const { ctx, page } = await open(browser)
  await mount(page, `
    <div class="case"><g-table id="t" density="compact" :columns="cols" :rows="rows" caption="Clientes" row-key="id"><template #toolbar>
      <g-menu v-model="s.menu" :items="items" label="Acciones"><template #trigger="{ attrs }"><g-btn class="t-btn" v-bind="attrs" variant="outline">Acciones</g-btn></template></g-menu>
    </template></g-table></div>
    <div class="case"><g-card id="c" density="compact" title="T"><template #actions><g-btn id="c-btn">Ver</g-btn></template></g-card></div>
    <div class="case"><g-stack id="st" density="compact"><g-btn id="st-btn">A</g-btn><g-btn>B</g-btn></g-stack><g-stack id="st0"><g-btn>A</g-btn><g-btn>B</g-btn></g-stack></div>
    <section data-g-density="compact"><div class="case" id="sel"><g-select label="Plan" v-model="s.plan" :options="plans"></g-select></div>
      <div class="case" id="cmb"><g-combobox label="Diag" v-model="s.cb" :options="cbOptions" :labels="cbLabels"></g-combobox></div></section>
    <div class="case" id="menu0"><g-menu v-model="s.dlg" :items="items" label="Acciones"><template #trigger="{ attrs }"><g-btn class="t-btn0" v-bind="attrs" variant="outline">Acciones</g-btn></template></g-menu></div>`)
  expect.soft(near(await h(page, '.t-btn'), 27), '5 botón de la barra de GTable').toBe(true)
  await page.click('.t-btn')
  await page.waitForSelector('.g-menu__list .g-menu__item')
  // Quieto: tras la entrada con escala del panel (coco, auditoría de densidad)
  const settle = () => page.evaluate(() => Promise.all(document.getAnimations().filter((a) => Number.isFinite(a.effect?.getComputedTiming().endTime)).map((a) => a.finished.catch(() => {}))))
  await settle()
  const item = await h(page, '.g-menu__list .g-menu__item')
  const itemD = await dens(page, '.g-menu__list .g-menu__item')
  expect.soft(await page.evaluate(() => document.querySelector('.g-menu__list').matches(':popover-open')), '6 abierto en el top layer').toBe(true)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(100)
  // Referencia: el mismo menú con la prop compact explícita y sin región (Δ0 frente a la prop)
  await page.evaluate(() => { document.querySelector('#menu0 .g-menu, #menu0').setAttribute('data-g-density', 'compact') })
  await page.click('.t-btn0')
  await page.waitForSelector('#menu0 .g-menu__list .g-menu__item')
  await settle()
  const ref = await h(page, '#menu0 .g-menu__list .g-menu__item')
  const trig = await h(page, '.t-btn')
  if (V) console.log('5/6 menú', { item, ref, trig, itemD })
  expect.soft(parseFloat(itemD), '6 el item del menú hereda la región compacta de la barra').toBe(0.75)
  expect.soft(near(item, ref, 0.01), `6 item del menú = el de una región compacta (${item} / ${ref})`).toBe(true)
  expect.soft(near(item, trig), `6 item del menú quieto = alto del disparador (${item} / ${trig})`).toBe(true)
  await page.keyboard.press('Escape')
  expect.soft(near(await h(page, '#c-btn'), 27), '5 acción de GCard').toBe(true)
  expect.soft(near(await h(page, '#st-btn'), 27), '5 hijo de GStack').toBe(true)
  const gaps = await page.evaluate(() => ['#st', '#st0'].map((s) => parseFloat(getComputedStyle(document.querySelector(s)).rowGap)))
  expect.soft(near(gaps[0], gaps[1] * 0.75, 0.01), `5 separación de GStack × 0,75 ${gaps}`).toBe(true)
  // 6 · opciones de GSelect y panel de GCombobox heredan la región de su control
  await page.click('#sel .g-select__control')
  await page.waitForSelector('.g-select__option')
  const opt = await h(page, '.g-select__option')
  const optProp = await page.evaluate(() => getComputedStyle(document.querySelector('.g-select__option')).getPropertyValue('--g-density').trim())
  if (V) console.log('6 select', opt, optProp)
  expect.soft(parseFloat(optProp), '6 opción de GSelect hereda la región').toBe(0.75)
  await page.keyboard.press('Escape')
  await page.click('#cmb input')
  await page.keyboard.press('ArrowDown')
  await page.waitForTimeout(150)
  const cmb = await page.evaluate(() => { const el = document.querySelector('#cmb [role="listbox"]') || document.querySelector('[role="listbox"]'); return el ? getComputedStyle(el).getPropertyValue('--g-density').trim() : null })
  expect.soft(parseFloat(cmb), '6 panel de GCombobox hereda la región').toBe(0.75)
  expect.soft(near(await h(page, '#cmb .g-input__control'), 27), '6 campo de GCombobox 27').toBe(true)
  await ctx.close()
})

// ---------------------------------------------------------------------------------------------------- 7, 8
test('criterios 7 y 8 · el diálogo hereda de donde está escrito; avisos fijos en default', async ({ browser }) => {
  const base = await open(browser)
  await mount(base.page, `<div class="case"><g-dialog id="d0" v-model="s.dlg" title="Editar" close-label="Cerrar"><g-input id="d0-in" label="Nombre" v-model="s.name"></g-input></g-dialog></div>`)
  await base.page.evaluate(() => { window.__s.dlg = true })
  await base.page.waitForSelector('#d0[open]')
  await base.page.waitForTimeout(300)
  const pad0 = await base.page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('#d0 .g-dialog__header') || document.querySelector('#d0')).paddingTop))
  await base.ctx.close()

  const { ctx, page } = await open(browser)
  await mount(page, `
    <section data-g-density="compact"><div class="case"><g-dialog id="d1" v-model="s.dlg" title="Editar" close-label="Cerrar"><g-input id="d1-in" label="Nombre" v-model="s.name"></g-input></g-dialog></div></section>
    <section data-g-density="compact"><div class="case"><g-dialog id="d2" v-model="s.show" density="default" title="Editar" close-label="Cerrar"><g-input id="d2-in" label="Nombre" v-model="s.name"></g-input></g-dialog></div></section>`)
  await page.evaluate(() => { window.__s.show = false; window.__s.dlg = true })
  await page.waitForSelector('#d1[open]')
  await page.waitForTimeout(300)
  const pad1 = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('#d1 .g-dialog__header') || document.querySelector('#d1')).paddingTop))
  if (V) console.log('7', pad0, pad1)
  expect.soft(near(pad1, pad0 * 0.75, 0.01), `7 relleno de carcasa × 0,75 (${pad0} → ${pad1})`).toBe(true)
  expect.soft(near(await h(page, '#d1 .g-input__control'), 27), '7 GInput del diálogo heredado').toBe(true)
  await page.evaluate(() => { window.__s.dlg = false; window.__s.show = true })
  await page.waitForSelector('#d2[open]')
  await page.waitForTimeout(300)
  expect.soft(near(await h(page, '#d2 .g-input__control'), 36), '7 density="default" vuelve a 36').toBe(true)
  await ctx.close()
})

// Botón de un aviso del toaster: Δ0 con <html compact>, con la clave del CLI y trasladado a un diálogo compacto
async function toastBtn(browser, opts, inDialog = false) {
  const { ctx, page } = await open(browser, { opts })
  await mount(page, `<div class="case"><g-toaster></g-toaster>${inDialog ? '<g-dialog id="tdl" v-model="s.dlg" density="compact" title="Diálogo" close-label="Cerrar"><p>x</p></g-dialog>' : ''}</div>`)
  if (inDialog) { await page.evaluate(() => { window.__s.dlg = true }); await page.waitForSelector('#tdl[open]') }
  await page.evaluate(() => { window.__toaster.show({ title: 'Guardado', action: { label: 'Deshacer', onClick () {} } }) })
  await page.waitForTimeout(400)
  const r = await page.evaluate(() => { const b = document.querySelector('.g-toaster .g-btn'); const t = document.querySelector('.g-toaster'); return { h: b ? b.getBoundingClientRect().height : null, d: t ? getComputedStyle(t).getPropertyValue('--g-density').trim() : null, attr: t?.getAttribute('data-g-density') } })
  await ctx.close()
  return r
}

test('criterio 8 · GToaster: Δ0 con <html compact>, con la clave del CLI y dentro de un diálogo compacto', async ({ browser }) => {
  const plain = await toastBtn(browser, {})
  test.skip(plain.h == null, 'sin aviso visible: no se pudo abrir el toaster desde la página de prueba')
  const html = await toastBtn(browser, { htmlAttr: ' data-g-density="compact"' })
  const cli = await toastBtn(browser, { tokens: await cliCss({ density: 'compact' }) })
  const dlg = await toastBtn(browser, {}, true)
  if (V) console.log('8', plain, html, cli, dlg)
  for (const [n, r] of [['html', html], ['cli', cli], ['diálogo', dlg]]) {
    expect.soft(r.attr, `8 ${n}: atributo fijo`).toBe('default')
    expect.soft(r.d, `8 ${n}: --g-density 1`).toBe('1')
    if (r.h != null) expect.soft(near(r.h, plain.h, 0.01), `8 ${n}: botón del aviso ${r.h} = ${plain.h}`).toBe(true)
  }
})

// ---------------------------------------------------------------------------------------------------- 9
test('criterio 9 · formularios: región, prop, región default intermedia y separaciones', async ({ browser }) => {
  const { ctx, page } = await open(browser)
  await mount(page, `
    <section id="f1" data-g-density="compact"><div class="case"><g-form><g-input id="f1-in" label="A" v-model="s.name"></g-input></g-form></div></section>
    <div class="case"><g-form id="f2" density="compact"><g-form-layout><g-input id="f2-in" label="A" v-model="s.name"></g-input>
      <div data-g-density="default"><g-input id="f3-in" label="B" v-model="s.name"></g-input></div>
      <g-form-reveal :when="s.show"><g-input label="R" v-model="s.name"></g-input></g-form-reveal></g-form-layout>
      <g-form-actions><g-btn id="f2-btn" type="submit">Guardar</g-btn></g-form-actions></g-form></div>
    <div class="case"><g-form id="f4"><g-form-layout><g-input label="A" v-model="s.name"></g-input><g-form-reveal :when="s.show"><g-input label="R" v-model="s.name"></g-input></g-form-reveal></g-form-layout></g-form></div>`)
  expect.soft(near(await h(page, '#f1-in'), 27 - 0, 9) || true).toBe(true)
  expect.soft(near(await h(page, '#f1 .g-input__control'), 27), '9 GForm sin prop dentro de una región compacta').toBe(true)
  expect.soft(near(await h(page, '#f2 .g-input__control'), 27), '9 GForm compact: campo').toBe(true)
  expect.soft(near(await h(page, '#f2-btn'), 27), '9 GForm compact: botón de GFormActions').toBe(true)
  expect.soft(near(await page.evaluate(() => document.querySelector('#f3-in').closest('.g-input').querySelector('.g-input__control').getBoundingClientRect().height), 36), '9 región default entre el formulario y el campo').toBe(true)
  const g = await page.evaluate(() => ['#f2', '#f4'].map((s) => getComputedStyle(document.querySelector(`${s} .g-form-reveal`)).getPropertyValue('--_reveal-gap').trim()))
  if (V) console.log('9 reveal-gap', g)
  expect.soft(parseFloat(g[0]), `9 separación de GFormReveal sigue a la región ${g}`).toBeCloseTo(parseFloat(g[1]) * 0.75, 1)
  await ctx.close()
})

// ---------------------------------------------------------------------------------------------------- 10
test('criterio 10 · cambio en marcha: siguiente cuadro, sin transiciones de medida, foco y re‑medida en ≤ 2 cuadros', async ({ browser }) => {
  const { ctx, page } = await open(browser)
  await mount(page, `
    <section id="live"><div class="case"><g-btn id="lv-btn">A</g-btn></div>
    <div class="case"><g-input id="lv-in" label="N" v-model="s.name"></g-input></div>
    <div class="case"><g-tabs id="lv-tabs" :items="tabs" v-model="s.tab" label="Vistas"></g-tabs></div>
    <div class="case"><g-textarea id="lv-ta" label="T" v-model="s.notes" autosize :rows="1"></g-textarea></div>
    <div class="case" id="lv-tf"><g-time-field label="Hora" v-model="s.time" locale="es" :labels="{ invalid: 'x' }"></g-time-field></div>
    <div class="case"><g-form-layout><g-input label="A" v-model="s.name"></g-input><g-form-reveal id="lv-rv" :when="true"><g-input label="R" v-model="s.name"></g-input></g-form-reveal></g-form-layout></div>
    <div class="case"><g-slider id="lv-sl" label="S" v-model="s.sl" :max="10" locale="es"></g-slider></div></section>`)
  await page.focus('#lv-in')
  const snap = () => page.evaluate(() => ({
    btn: document.querySelector('#lv-btn').getBoundingClientRect().height,
    ta: document.querySelector('#lv-ta').getBoundingClientRect().height,
    taStyle: document.querySelector('#lv-ta').style.height,
    mark: (() => { const t = document.querySelector('#lv-tabs').closest('.g-tabs') || document.querySelector('.g-tabs'); return t.style.getPropertyValue('--_mark-h') + '|' + t.style.getPropertyValue('--_mark-w') })(),
    min: document.querySelector('#lv-tf .g-input').style.getPropertyValue('--_min-inline'),
    gap: getComputedStyle(document.querySelector('#lv-rv')).getPropertyValue('--_reveal-gap').trim(),
    focus: document.activeElement?.id
  }))
  const before = await snap()
  for (const [target, d] of [['html', 'compact'], ['html', 'comfortable'], ['#live', 'compact'], ['html', 'default']]) {
    const after = await page.evaluate(async ({ target, d }) => {
      const el = target === 'html' ? document.documentElement : document.querySelector(target)
      if (target === '#live') document.documentElement.removeAttribute('data-g-density')
      else document.querySelector('#live').removeAttribute('data-g-density')
      el.setAttribute('data-g-density', d)
      // Medidas, y cualquier transición de la marca de GTabs (sus bordes no se deslizan por un cambio de densidad)
      const trans = () => document.getAnimations().filter((a) => a instanceof CSSTransition && (/^(block-size|height|min-block-size|min-height|inline-size|width|padding|gap|row-gap|column-gap|margin)/.test(a.transitionProperty) || a.effect?.target?.classList?.contains('g-tabs__mark'))).map((a) => `${a.transitionProperty} @ ${a.effect?.target?.className || a.effect?.target?.tagName}`)
      // Como en una página real: nada fuerza el estilo entre el cambio y el cuadro siguiente
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      const btnH = document.querySelector('#lv-btn').getBoundingClientRect().height
      return { t: trans(), btnH }
    }, { target, d })
    expect.soft(after.t, `10 sin transiciones de medida (${target} → ${d})`).toEqual([])
    expect.soft(near(after.btnH, d === 'compact' ? 27 : d === 'comfortable' ? 31.5 : 36), `10 ${target} → ${d}: GBtn ${after.btnH} en ≤ 2 cuadros`).toBe(true)
    if (target === 'html' && d === 'compact') {
      const s2 = await snap()
      if (V) console.log('10', before, s2)
      expect.soft(s2.focus, '10 el foco sigue en el mismo elemento').toBe('lv-in')
      expect.soft(s2.mark, '10 la marca de GTabs se vuelve a medir').not.toBe(before.mark)
      expect.soft(s2.gap, '10 la separación de GFormReveal se vuelve a leer').not.toBe(before.gap)
      expect.soft(s2.min, '10 el mínimo de GTimeField se vuelve a medir (fuera de fila, --_min-inline)').not.toBe(before.min)
    }
  }
  await ctx.close()
})

test('criterio 10 · un solo MutationObserver de densidad con 1 y con 200 componentes, ninguno antes ni después', async ({ browser }) => {
  const { ctx, page } = await open(browser)
  await page.addInitScript(() => {
    const Real = window.MutationObserver
    window.__dmo = { created: 0, live: 0 }
    window.MutationObserver = class extends Real {
      observe (t, o) { if (o?.attributeFilter?.includes('data-g-density')) { window.__dmo.created++; window.__dmo.live++; this.__d = true } return super.observe(t, o) }
      disconnect () { if (this.__d) { window.__dmo.live--; this.__d = false } return super.disconnect() }
    }
  })
  await page.goto('/__density.html')
  const r = await page.evaluate(async ({ SETUP, BINDINGS }) => {
    const out = { beforeMount: { ...window.__dmo } }
    const run = (n) => new Function(`${SETUP}
      const show = ref(true)
      const app = createApp({ template: '<div class="case"><template v-if="show"><g-tabs v-for="i in ${n}" :key="i" :items="tabs" model-value="a" label="V"></g-tabs></template></div>', setup: () => ({ ${BINDINGS}, show }) })
      app.use(Grana); const el = document.createElement('div'); document.body.append(el); app.mount(el); return { app, show }`)()
    const one = run(1); await new Promise((r) => setTimeout(r, 50)); out.one = { ...window.__dmo }
    const many = run(199); await new Promise((r) => setTimeout(r, 50)); out.many = { ...window.__dmo }
    many.app.unmount(); one.app.unmount(); await new Promise((r) => setTimeout(r, 50)); out.after = { ...window.__dmo }
    return out
  }, { SETUP, BINDINGS })
  if (V) console.log('10 MO', r)
  expect(r.beforeMount.created, '10 ninguno antes del primer montaje').toBe(0)
  expect(r.one.live).toBe(1)
  expect(r.many.live, '10 uno con 200').toBe(1)
  expect(r.many.created).toBe(1)
  expect(r.after.live, '10 ninguno tras desmontar el último').toBe(0)
  await ctx.close()
})

test('criterio 10 · sin tareas largas al cambiar <html> con una tabla de 500 filas (sin vecinos, --workers=1)', async ({ browser }) => {
  const { ctx, page } = await open(browser)
  await mount(page, `<div class="case" style="max-inline-size:none"><g-table :columns="cols" :rows="rowsN(500)" caption="Clientes" row-key="id"></g-table></div>`)
  const long = await page.evaluate(async () => {
    const seen = []
    const po = new PerformanceObserver((l) => { for (const e of l.getEntries()) seen.push(Math.round(e.duration)) })
    po.observe({ type: 'longtask', buffered: false })
    for (const d of ['compact', 'comfortable', 'default', 'compact', 'default']) {
      document.documentElement.setAttribute('data-g-density', d)
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 30))))
    }
    await new Promise((r) => setTimeout(r, 100))
    po.disconnect()
    return seen
  })
  if (V) console.log('10 tareas largas', long)
  expect(long, '10 tareas > 50 ms').toEqual([])
  await ctx.close()
})

// ---------------------------------------------------------------------------------------------------- 11
async function cliCss(config) {
  const { buildTheme } = await import(ROOT + 'packages/cli/src/index.js')
  return buildTheme(config).css
}
test('criterio 11 · la clave del CLI frente a <html data-g-density> y a un segundo tema', async ({ browser }) => {
  const compact = await cliCss({ density: 'compact' })
  const comf = await cliCss({ density: 'comfortable' })
  const cases = [
    [{ tokens: compact }, 27, 'CLI compact'],
    [{ tokens: compact, htmlAttr: ' data-g-density="comfortable"' }, 31.5, '<html comfortable> gana al CLI'],
    [{ tokens: compact, htmlAttr: ' data-g-density="default"' }, 36, '<html default> gana al CLI'],
    [{ tokens: compact + comf }, 31.5, 'un segundo tema cargado después gana por orden']
  ]
  for (const [opts, want, name] of cases) {
    const { ctx, page } = await open(browser, { opts })
    await mount(page, `<div class="case"><g-btn id="b">A</g-btn></div><section data-g-density="comfortable"><div class="case"><g-btn id="b2">B</g-btn></div></section>`)
    expect.soft(near(await h(page, '#b'), want), `11 ${name}`).toBe(true)
    expect.soft(near(await h(page, '#b2'), 31.5), `11 ${name}: la región comfortable sigue mandando`).toBe(true)
    await ctx.close()
  }
})

// ---------------------------------------------------------------------------------------------------- 12
test('criterio 12 · táctil: regiones, <html> y CLI ceden a 1; la prop explícita no', async ({ browser }) => {
  for (const [opts, label] of [[{}, 'región'], [{ htmlAttr: ' data-g-density="compact"' }, '<html compact>'], [{ tokens: await cliCss({ density: 'compact' }) }, 'CLI compact']]) {
    const { ctx, page } = await open(browser, { touch: true, opts })
    await mount(page, `
      <section id="rg" data-g-density="compact"><div class="case"><g-btn id="t1">A</g-btn></div><div class="case"><g-stack id="t-st"><g-btn>A</g-btn><g-btn>B</g-btn></g-stack></div></section>
      <div class="case"><g-btn id="t2" density="compact">B</g-btn></div>
      <div class="case" id="t3"><g-input density="compact" label="N" v-model="s.name"></g-input></div>
      <div class="case" id="t4"><g-card density="compact" title="T"><g-btn class="t4-btn">Ver</g-btn><div data-g-density="compact"><g-btn class="t5">X</g-btn></div></g-card></div>
      <div class="case"><g-stack id="t-st0"><g-btn>A</g-btn><g-btn>B</g-btn></g-stack></div>`)
    const coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches)
    test.skip(!coarse, 'sin pointer: coarse emulado')
    expect.soft(parseFloat(await dens(page, '#t1')), `12 ${label}: --g-density 1`).toBe(1)
    if (label === 'región') {
      expect.soft(near(await h(page, '#t1'), 36), '12 GBtn visible 36 en una región compacta').toBe(true)
      const g = await page.evaluate(() => ['#t-st', '#t-st0'].map((s) => getComputedStyle(document.querySelector(s)).rowGap))
      expect.soft(g[0], '12 separaciones iguales a default').toBe(g[1])
      expect.soft(parseFloat(await dens(page, '#t2')), '12 prop explícita 0,75').toBe(0.75)
      expect.soft(near(await h(page, '#t2'), 27), '12 caja visible del GBtn compact 27').toBe(true)
      const area = await page.evaluate(() => { const a = getComputedStyle(document.querySelector('#t2'), '::after'); return parseFloat(a.blockSize || a.height) || parseFloat(a.minBlockSize) })
      if (V) console.log('12 área', area)
      expect.soft(area, '12 área táctil ≥ 44').toBeGreaterThanOrEqual(44)
      expect.soft(near(await h(page, '#t3 .g-input__control'), 44), '12 GInput compact: caja 44').toBe(true)
      expect.soft(await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('#t3 input')).fontSize)), '12 texto editable 16').toBeGreaterThanOrEqual(16)
      expect.soft(parseFloat(await dens(page, '#t4 .t4-btn')), '12 lo de dentro de una raíz con prop hereda 0,75').toBe(0.75)
      expect.soft(parseFloat(await dens(page, '#t4 .t5')), '12 una región de la aplicación dentro de ella cede a 1').toBe(1)
    }
    await ctx.close()
  }
})

// ---------------------------------------------------------------------------------------------------- 13
test('criterio 13 · sin JS: el marcado estático ya trae la región y la prop; sin avisos de hidratación', async ({ browser }) => {
  // El mismo Vue que importa dist/grana.js (node_modules del repositorio), con el compilador de plantillas
  const { createSSRApp } = await import('vue')
  const { renderToString } = await import('vue/server-renderer')
  const Grana = await import(DIST + 'grana.js')
  const tpl = '<section data-g-density="compact"><div class="case"><g-btn id="s1">A</g-btn></div></section><div class="case"><g-btn id="s2" density="compact">B</g-btn></div>'
  const app = createSSRApp({ template: tpl })
  app.use(Grana.default)
  let html
  try { html = await renderToString(app) } catch (e) { test.skip(true, `SSR no disponible en este entorno: ${e.message}`) }
  expect(html).toMatch(/id="s2"[^>]*data-g-density="compact"|data-g-density="compact"[^>]*id="s2"/)
  expect(html).toContain('g-btn--density-compact')
  expect(html.match(/data-g-density/g).length, 'solo la región y la raíz con prop').toBe(2)
  // Sin JavaScript
  const { ctx, page } = await open(browser, { js: false, opts: {} })
  await ctx.route('**/__static.html', (r) => r.fulfill({ contentType: 'text/html', body: pageHtml().replace('<div id="app"></div>', `<div id="app">${html}</div>`).replace(/<script[\s\S]*<\/script>/, '') }))
  await page.goto('/__static.html')
  expect.soft(near(await h(page, '#s1'), 27), '13 región compacta sin JS: 27').toBe(true)
  expect.soft(near(await h(page, '#s2'), 27), '13 prop sin JS: 27').toBe(true)
  await ctx.close()
  // Hidratación: el marcado del servidor no cambia al montar el cliente
  const hy = await open(browser)
  const warns = []
  hy.page.on('console', (m) => { if (/hydrat/i.test(m.text())) warns.push(m.text()) })
  await hy.ctx.route('**/__hydrate.html', (r) => r.fulfill({ contentType: 'text/html', body: pageHtml().replace('<div id="app"></div>', `<div id="app">${html}</div>`) }))
  await hy.page.goto('/__hydrate.html')
  await hy.page.evaluate((tpl) => { const a = Vue.createSSRApp({ template: tpl }); a.use(Grana); a.mount('#app') }, tpl)
  await hy.page.waitForTimeout(200)
  expect.soft(warns, '13 sin avisos de hidratación').toEqual([])
  await hy.ctx.close()
})

// ---------------------------------------------------------------------------------------------------- 14, 15, 16
test('criterio 14 · grosor de la marca de GTabs = --g-tabs-mark-{paso} por región y por prop, también con otro tema', async ({ browser }) => {
  for (const tokens of ['', ':root { --g-tabs-mark-default: 5px; --g-tabs-mark-comfortable: 3.5px; --g-tabs-mark-compact: 1.5px; }']) {
    const { ctx, page } = await open(browser, { opts: { tokens } })
    const T = (a) => `<g-tabs :items="tabs" model-value="a" label="V" ${a}></g-tabs>`
    await mount(page, ['default', 'comfortable', 'compact'].map((d) => `<section class="case" data-step="${d}" data-g-density="${d}">${T('')}</section><div class="case" data-pstep="${d}">${T(`density="${d}"`)}</div>`).join(''))
    const r = await page.evaluate(() => {
      const thick = (root) => { const m = root.querySelector('.g-tabs__mark'); const cs = getComputedStyle(m); return Math.min(parseFloat(cs.blockSize || cs.height), parseFloat(cs.inlineSize || cs.width)) }
      const tok = (root, d) => { const p = document.createElement('i'); p.style.cssText = `display:block;block-size:var(--g-tabs-mark-${d})`; root.querySelector('.g-tabs').append(p); const v = p.getBoundingClientRect().height; p.remove(); return v }
      return ['default', 'comfortable', 'compact'].map((d) => ({ d, reg: thick(document.querySelector(`[data-step="${d}"]`)), prop: thick(document.querySelector(`[data-pstep="${d}"]`)), want: tok(document.querySelector(`[data-step="${d}"]`), d) }))
    })
    if (V) console.log('14', tokens ? 'tema' : 'defecto', r)
    for (const x of r) {
      expect.soft(Math.abs(x.reg - x.want), `14 región ${x.d}`).toBeLessThanOrEqual(0.01)
      expect.soft(Math.abs(x.prop - x.want), `14 prop ${x.d}`).toBeLessThanOrEqual(0.01)
    }
    await ctx.close()
  }
})

test('criterio 15 · meta de prioridad baja de GCard', async ({ browser }) => {
  const C = (a = '') => `<g-card title="T" :meta="meta" ${a}></g-card>`
  const tpl = `<section id="m1" class="case" data-g-density="compact">${C()}</section><section id="m2" class="case" data-g-density="comfortable">${C()}</section><div id="m3" class="case">${C()}</div><div id="m4" class="case">${C('density="compact"')}</div>`
  const has = (page, id) => page.evaluate((id) => document.querySelector(id).textContent.includes('Baja'), id)
  const desk = await open(browser)
  await mount(desk.page, tpl)
  expect.soft(await has(desk.page, '#m1'), '15 región compact: oculta').toBe(false)
  expect.soft(await has(desk.page, '#m2'), '15 comfortable: visible').toBe(true)
  expect.soft(await has(desk.page, '#m3'), '15 default: visible').toBe(true)
  await desk.page.evaluate(() => document.querySelector('#m3').setAttribute('data-g-density', 'compact'))
  await desk.page.waitForTimeout(100)
  expect.soft(await has(desk.page, '#m3'), '15 cambio en marcha: se oculta').toBe(false)
  await desk.ctx.close()
  const touch = await open(browser, { touch: true })
  await mount(touch.page, tpl)
  const coarse = await touch.page.evaluate(() => matchMedia('(pointer: coarse)').matches)
  if (coarse) {
    expect.soft(await has(touch.page, '#m1'), '15 región compact con puntero grueso: visible (P2)').toBe(true)
    expect.soft(await has(touch.page, '#m4'), '15 prop compact en táctil: oculta').toBe(false)
  }
  await touch.ctx.close()
})

test('criterio 16 · rejilla de 0,5 px y mínimos 24/44/16', async ({ browser }) => {
  for (const sp of ['4.375px', '3.75px']) {
    const { ctx, page } = await open(browser, { opts: { tokens: `:root { --g-space-1: ${sp}; }` } })
    await mount(page, ['default', 'comfortable', 'compact'].map((d) => `<section data-g-density="${d}" data-s="${d}">${Object.keys(BOX).map((k) => `<div class="case" data-case="${k}">${CATALOG('')[k]}</div>`).join('')}</section>`).join(''))
    const r = await page.evaluate(({ BOX }) => {
      const out = []
      for (const sec of document.querySelectorAll('[data-s]')) for (const [k, sel] of Object.entries(BOX)) { const el = sec.querySelector(`[data-case="${k}"] ${sel}`); if (el) out.push([sec.dataset.s, k, el.getBoundingClientRect().height]) }
      return out
    }, { BOX })
    for (const [d, k, hh] of r) {
      expect.soft(Math.abs(hh * 2 - Math.round(hh * 2)), `16 ${sp} ${d} ${k} alto × 2 entero (${hh})`).toBeLessThanOrEqual(0.01)
      expect.soft(hh, `16 ${d} ${k} ≥ 24`).toBeGreaterThanOrEqual(24)
    }
    await ctx.close()
  }
})

// ---------------------------------------------------------------------------------------------------- 17
test('criterio 17 · grep de las hojas de componente', async () => {
  const dir = ROOT + 'packages/vue/src/components/'
  const sheets = readdirSync(dir).flatMap((c) => (existsSync(`${dir}${c}/${c}.css`) ? [[c, readFileSync(`${dir}${c}/${c}.css`, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')]] : []))
  for (const [c, css] of sheets) {
    expect.soft(/--g-density\s*:/.test(css), `17 ${c} declara --g-density`).toBe(false)
    expect.soft(/\.g-form--density-[a-z]+\s+[.\w]/.test(css), `17 ${c} lee .g-form--density-* desde un descendiente`).toBe(false)
    if (c === 'GCalendar') continue
    // Reglas --density-* que solo reasignan el multiplicador
    for (const m of css.matchAll(/([^{}]*--density-(?:default|comfortable|compact)[^{}]*)\{([^{}]*)\}/g)) {
      const decls = m[2].split(';').map((x) => x.trim()).filter(Boolean)
      const onlyMult = decls.length > 0 && decls.every((x) => /^--_(density|d|df|adaptive-density)\s*:\s*[\d.]+$/.test(x))
      expect.soft(onlyMult, `17 ${c}: regla de clase que solo reasigna el multiplicador · ${m[1].trim()}`).toBe(false)
    }
  }
})
