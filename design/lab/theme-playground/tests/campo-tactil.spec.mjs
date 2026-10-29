// Pieza 1 · texto editable ≥ 16 px con puntero grueso (DECISIONS #970 a #972, api.md «Texto editable con puntero grueso»).
// Dueño: bruno. Criterios de #972 sobre los componentes REALES del dist/ montados en una página propia (Vue de
// node_modules por page.route: unpkg está bloqueado).
//
//   1. táctil: font-size ≥ 16 en cada control de las listas A y B, cinco `size` × `default`/`compact`
//   2. escritorio: Δ0 (xs 12, sm/md 14, lg/xl 16 con el tema por defecto)
//   3. tema con fontSize 18: en táctil manda el rol (> 16)
//   4. altura en táctil Δ0 frente al dist/ anterior (campo-tactil.base.json), salvo GTextarea xs con rows ≥ 3 (+4 px por fila extra)
//   5. acompañantes de la línea del valor: mismo font-size que su control; etiqueta, ayuda y opciones de GSelect: su rol
//   6. fantasma de GCombobox y espejo de GNumberField/GTimeField alineados con el texto real (Δ ≤ 0,5 px)
//   7. a 320 px: sin desplazamiento horizontal ni desborde
//
// Táctil = isMobile + hasTouch en Chromium (precondición: matchMedia('(pointer: coarse)')). WebKit: el proyecto está en
// playwright.config.mjs, pero la emulación táctil sin isMobile de Firefox no existe (se omite, como btn-limitaciones);
// si el motor no cumple la precondición, el caso se omite y se anota.
//
// Ejecutar: GRANA_PW_PORT=4208 npx playwright test tests/campo-tactil.spec.mjs --project=chromium
// Línea base (el dist/ de e2dad41, antes de la pieza 1): GRANA_DIST_DIR=<ruta/dist> CAMPO_WRITE_BASE=1 lo regenera.
// VERBOSE=1 imprime las cifras.
import { test, expect } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const VUE = fileURLToPath(new URL('../../../../node_modules/vue/dist/vue.global.js', import.meta.url))
const DIST = process.env.GRANA_DIST_DIR || fileURLToPath(new URL('../../../../packages/vue/dist/', import.meta.url))
const BASE_FILE = fileURLToPath(new URL('./campo-tactil.base.json', import.meta.url))
const WRITE_BASE = !!process.env.CAMPO_WRITE_BASE
const V = !!process.env.VERBOSE

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl']
const DENS = ['default', 'compact']
const DESKTOP_PX = { xs: 12, sm: 14, md: 14, lg: 16, xl: 16 }
// Pieza 3 (density.md §16, #986): en compact el texto baja con la escala B (12 · 13,125 · 15); la prop explícita no cede en táctil
const DESKTOP = { default: DESKTOP_PX, compact: { xs: 12, sm: 13.125, md: 13.125, lg: 15, xl: 15 } }
const cli = await import(fileURLToPath(new URL('../../../../packages/cli/src/index.js', import.meta.url)))

// ---------------------------------------------------------------------------------------------------- la página
const SCRIPTS = ['grana', 'combobox', 'time-field', 'booking', 'speech']
function pageHtml(extraCss) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/__dist/grana.css"><link rel="stylesheet" href="/__dist/fonts.css">
<style>body{margin:0;padding:8px;background:var(--g-color-bg);color:var(--g-color-text);font-family:var(--g-font-ui)}
.case{margin:0 0 12px;max-width:100%}${extraCss || ''}</style></head><body><div id="app"></div>
<script src="/__vue.js"></script>${SCRIPTS.map((s) => `<script src="/__dist/${s}.umd.js"></script>`).join('')}</body></html>`
}

async function routes(ctx, extraCss) {
  await ctx.route('**/__vue.js', (r) => r.fulfill({ path: VUE, contentType: 'application/javascript' }))
  await ctx.route('**/__dist/**', (r) => {
    const name = new URL(r.request().url()).pathname.replace('/__dist/', '')
    const file = DIST + name
    if (!existsSync(file)) return r.fulfill({ status: 404, body: '' })
    return r.fulfill({ path: file })
  })
  await ctx.route('**/__campo.html', (r) => r.fulfill({ contentType: 'text/html', body: pageHtml(extraCss) }))
}

// Plantillas por (size, density). Cada caso lleva `data-case` y `data-size`; las medidas se piden por selector dentro de él.
const T = (z, d) => `:size="'${z}'" :density="'${d}'"`
function matrixTemplate(d) {
  return SIZES.map((z) => `<div class="size" data-size="${z}">
  <div class="case" data-case="input"><g-input label="Nombre" hint="Ayuda del campo" v-model="s.name" prefix="$" suffix="kg" output="12" ${T(z, d)}></g-input></div>
  <div class="case" data-case="input-ph"><g-input label="Con marcador" placeholder="Marcador de posición" v-model="s.empty" ${T(z, d)}></g-input></div>
  <div class="case" data-case="textarea"><g-textarea label="Notas" v-model="s.notes" :rows="3" ${T(z, d)}></g-textarea></div>
  <div class="case" data-case="textarea-r1"><g-textarea label="Notas 1" v-model="s.empty" :rows="1" ${T(z, d)}></g-textarea></div>
  <div class="case" data-case="select"><g-select label="Plan" v-model="s.plan" :options="plans" ${T(z, d)}></g-select></div>
  <div class="case" data-case="date"><g-date-picker label="Fecha" v-model="s.date" :labels="dpLabels" ${T(z, d)}></g-date-picker></div>
  <div class="case" data-case="party"><g-party-field label="Huéspedes" v-model="s.party" :rows="partyRows" :labels="{ done: 'Listo', separator: ' · ' }" ${T(z, d)}></g-party-field></div>
  <div class="case" data-case="number"><g-number-field label="Cantidad" v-model="s.qty" :min="0" :max="99" :precision="0" prefix="×" suffix="kg" steppers decrement-label="Restar" increment-label="Sumar" ${T(z, d)}></g-number-field></div>
  <div class="case" data-case="time"><g-time-field label="Hora" v-model="s.time" locale="es" suffix="CDMX" :labels="{ invalid: 'Escribe una hora' }" ${T(z, d)}></g-time-field></div>
  <div class="case" data-case="combobox"><g-combobox label="Diagnóstico" v-model="s.cb" placeholder="Código" :options="cbOptions" :labels="cbLabels" ${T(z, d)}></g-combobox></div>
  <div class="case" data-case="group"><g-input-group label="Teléfono" ${T(z, d)}>
    <g-input-group-select v-model="s.lada" part-label="País" :options="ladas"></g-input-group-select>
    <g-input-group-input v-model="s.tel" principal part-label="Número" placeholder="951 123 4567"></g-input-group-input>
    <g-input-group-text text="mmHg" label="milímetros"></g-input-group-text>
  </g-input-group></div>
</div>`).join('\n')
}

const SETUP = `
  const { createApp, reactive } = Vue
  const s = reactive({ name: 'Ada', empty: '', notes: 'Una nota\\nde tres\\nlíneas', plan: 'pro', date: null, party: null, qty: 7, time: '09:30', cb: null, lada: '+52', tel: '' })
  const plans = [{ value: 'basic', label: 'Básico' }, { value: 'pro', label: 'Pro' }]
  const ladas = [{ value: '+52', label: '+52' }, { value: '+1', label: '+1' }]
  const cbOptions = [{ value: 'a', label: 'Asma' }, { value: 'b', label: 'Bronquitis' }]
  const cbLabels = { clear: 'Limpiar', open: 'Abrir', empty: 'Sin resultados', loading: 'Cargando', results: '{count} resultados', error: 'Error', retry: 'Reintentar', remove: 'Quitar {label}', selected: '{label} elegido', noMatch: 'Sin coincidencias' }
  const dpLabels = { prev: 'Anterior', next: 'Siguiente', open: 'Abrir', close: 'Cerrar', today: 'Hoy', clear: 'Limpiar', apply: 'Aplicar', cancel: 'Cancelar', month: 'Mes', year: 'Año', dialog: 'Elegir fecha' }
  const partyRows = [{ id: 'adults', label: 'Adultos', min: 1, max: 8, default: 2 }, { id: 'kids', label: 'Niños', min: 0, max: 6, default: 0 }]
`

async function mount(page, template, { fontCss } = {}) {
  await page.goto('/__campo.html')
  await page.evaluate(async ({ template, SETUP }) => {
    const fn = new Function('template', `${SETUP}
      const app = createApp({ template, setup: () => ({ s, plans, ladas, cbOptions, cbLabels, dpLabels, partyRows }) })
      app.use(Grana); if (window.GranaCombobox) app.use(GranaCombobox); if (window.GranaTimeField) app.use(GranaTimeField); if (window.GranaBooking) app.use(GranaBooking)
      app.mount('#app'); return app`)
    window.__app = fn(template)
    await document.fonts.ready
  }, { template, SETUP })
  await page.waitForSelector('.case')
  await page.waitForTimeout(300)
}

// Medidas de un caso: font-size de cada selector (y de ::placeholder), alto de la caja, desborde.
async function measure(page, spec) {
  return page.evaluate((spec) => {
    const out = {}
    for (const sizeEl of document.querySelectorAll('.size')) {
      const z = sizeEl.dataset.size
      for (const [caseName, sels] of Object.entries(spec)) {
        const root = sizeEl.querySelector(`[data-case="${caseName}"]`)
        if (!root) { out[`${z}|${caseName}`] = null; continue }
        const m = {}
        for (const [key, sel] of Object.entries(sels)) {
          const placeholder = sel.endsWith('::placeholder')
          const el = root.querySelector(placeholder ? sel.replace('::placeholder', '') : sel)
          if (!el) { m[key] = null; continue }
          const cs = getComputedStyle(el, placeholder ? '::placeholder' : null)
          m[key] = parseFloat(cs.fontSize)
          if (key === 'main') { m.h = el.getBoundingClientRect().height; m.lh = cs.lineHeight }
        }
        const box = root.querySelector('.g-input__control, .g-textarea__control, .g-select__control, .g-datepicker__field, .g-party-field__trigger, .g-input-group__box')
        m.boxH = box ? box.getBoundingClientRect().height : null
        out[`${z}|${caseName}`] = m
      }
    }
    return out
  }, spec)
}

// Qué se mide por caso: `main` es el control (lista A o B); el resto son acompañantes («sube con el campo») o roles.
const SPEC = {
  input: { main: '.g-input__field', prefix: '.g-input__prefix', suffix: '.g-input__suffix', output: '.g-input__output', label: '.g-input__label', hint: '.g-input__hint' },
  'input-ph': { main: '.g-input__field', placeholder: '.g-input__field::placeholder' },
  textarea: { main: '.g-textarea__field', label: '.g-textarea__label' },
  'textarea-r1': { main: '.g-textarea__field' },
  select: { main: '.g-select__button', value: '.g-select__value', label: '.g-select__label' },
  date: { main: '.g-datepicker__field', value: '.g-datepicker__value', label: '.g-datepicker__label' },
  party: { main: '.g-party-field__trigger', value: '.g-party-field__value', label: '.g-party-field__label' },
  number: { main: '.g-input__field', prefix: '.g-input__prefix', suffix: '.g-input__suffix', step: '.g-number-field__step', label: '.g-input__label' },
  time: { main: '.g-input__field', suffix: '.g-input__suffix', reading: '.g-time-field__reading', label: '.g-input__label' },
  combobox: { main: '.g-input__field', label: '.g-input__label' },
  group: { main: '.g-input-group__part--input .g-input-group__control', select: '.g-input-group__part--select .g-input-group__control', text: '.g-input-group__part--text', label: '.g-input-group__label' }
}
// Acompañantes que deben medir lo mismo que `main` (criterio 5) y roles que no cambian con el puntero
const COMPANIONS = ['prefix', 'suffix', 'output', 'placeholder', 'value', 'step', 'reading', 'select', 'text']
const ROLES = ['label', 'hint']

// ---------------------------------------------------------------------------------------------------- pruebas
const base = existsSync(BASE_FILE) ? JSON.parse(readFileSync(BASE_FILE, 'utf8')) : null
const results = {} // se acumula para la línea base


for (const dens of DENS) {
  test.describe(`densidad ${dens}`, () => {
    let touchData, deskData

    test.beforeAll(async ({ browser, browserName }) => {
      // Escritorio
      const desk = await browser.newContext({ viewport: { width: 1280, height: 900 } })
      await routes(desk)
      const dp = await desk.newPage()
      await mount(dp, matrixTemplate(dens))
      deskData = await measure(dp, SPEC)
      await desk.close()
      // Táctil (Firefox no admite isMobile)
      if (browserName === 'firefox') { touchData = null; return }
      const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 })
      await routes(touch)
      const tp = await touch.newPage()
      await mount(tp, matrixTemplate(dens))
      const coarse = await tp.evaluate(() => matchMedia('(pointer: coarse)').matches)
      touchData = coarse ? await measure(tp, SPEC) : null
      await touch.close()
      results[dens] = { touch: touchData, desk: deskData }
    })

    test('escritorio (2): el tamaño de letra no cambia (Δ0; en compact, la escala B de la pieza 3)', async () => {
      test.skip(WRITE_BASE, 'regenerando la línea base')
      for (const z of SIZES) {
        for (const [c, m] of Object.entries(deskData).filter(([k]) => k.startsWith(z + '|'))) {
          const spec = SPEC[c.split('|')[1]]
          if (m?.main == null) { expect.soft(m, `${c}: control sin montar`).not.toBeNull(); continue }
          if (c.endsWith('group')) continue // la parte de texto fija su propio tamaño en escritorio (se compara con el control en táctil)
          expect.soft(m.main, `${dens} ${c}`).toBeCloseTo(DESKTOP[dens][z], 2)
          for (const k of COMPANIONS) if (m[k] != null && spec[k]) expect.soft(m[k], `${dens} ${c} ${k}`).toBeCloseTo(DESKTOP[dens][z], 2)
        }
      }
    })

    test('táctil (1, 5): cada control y su línea del valor miden ≥ 16 y lo mismo; etiqueta y ayuda conservan su rol', async ({ browserName }) => {
      test.skip(WRITE_BASE, 'regenerando la línea base')
      test.skip(!touchData, `${browserName}: sin pointer: coarse emulado (se omite y se anota)`)
      for (const z of SIZES) {
        const want = Math.max(16, DESKTOP[dens][z])
        for (const [c, m] of Object.entries(touchData).filter(([k]) => k.startsWith(z + '|'))) {
          if (!m) { expect.soft(m, `${c}: sin montar`).not.toBeNull(); continue }
          expect.soft(m.main, `${dens} ${c} main`).toBeGreaterThanOrEqual(16)
          expect.soft(m.main, `${dens} ${c} main = max(16, rol)`).toBe(want)
          for (const k of COMPANIONS) if (m[k] != null) expect.soft(m[k], `${dens} ${c} ${k} = su control`).toBe(m.main)
          const d = deskData[c]
          for (const k of ROLES) if (m[k] != null) expect.soft(m[k], `${dens} ${c} ${k} conserva su rol`).toBe(d[k])
        }
      }
      if (V) console.log(dens, JSON.stringify(touchData))
    })

    test('altura en táctil (4): Δ0 frente al dist/ anterior, salvo GTextarea xs con rows ≥ 3', async ({ browserName }) => {
      test.skip(!touchData, `${browserName}: sin pointer: coarse emulado`)
      test.skip(!base && !WRITE_BASE, 'falta campo-tactil.base.json (regenerar con GRANA_DIST_DIR y CAMPO_WRITE_BASE=1)')
      if (WRITE_BASE) return
      const b = base[dens]
      for (const [c, m] of Object.entries(touchData)) {
        if (!m || !b[c]) continue
        const [z, name] = c.split('|')
        const extra = name === 'textarea' && z === 'xs' ? 4 * 2 : 0 // rows 3 → 2 filas extra (+4 px cada una)
        expect.soft(m.boxH, `${dens} ${c} alto de la caja`).toBeCloseTo(b[c].boxH + extra, 1)
        if (!extra) expect.soft(m.h, `${dens} ${c} alto del control`).toBeCloseTo(b[c].h, 1)
      }
    })

    test.afterAll(() => {
      if (WRITE_BASE) {
        const prev = existsSync(BASE_FILE) ? JSON.parse(readFileSync(BASE_FILE, 'utf8')) : {}
        const slim = {}
        for (const [k, v] of Object.entries(results[dens].touch || {})) slim[k] = v && { boxH: v.boxH, h: v.h }
        prev[dens] = slim
        writeFileSync(BASE_FILE, JSON.stringify(prev, null, 1) + '\n')
      }
    })
  })
}


// ============================================================ otros controles de la lista A (sin `size`)
const MISC_SETUP = `
  const { createApp, reactive, ref } = Vue
  const flt = ref([]); const open = ref(false); const added = {}
  const cols = [
    { key: 'name', label: 'Cliente', sortable: true, filter: { type: 'text', suggest: true } },
    { key: 'plan', label: 'Plan', sortable: true, filter: { type: 'enum', options: ['Básico', 'Pro'], suggest: true } },
    { key: 'total', label: 'Total', align: 'end', sortable: true, filter: { type: 'number', suggest: true } }
  ]
  const rows = [{ id: 1, name: 'Ana', plan: 'Pro', total: 10 }, { id: 2, name: 'Luis', plan: 'Básico', total: 20 }]
  const tbLabels = { selectAll: 'Seleccionar todo', selectRow: 'Seleccionar {title}', rowActions: 'Acciones de {title}', actionsHeader: 'Acciones', selectedCount: '{count} seleccionados', sortBy: 'Ordenar por', ascending: 'ascendente', descending: 'descendente', sorted: 'Ordenado por {label}, {direction}', loading: 'Cargando', empty: 'Sin datos', emptyFiltered: 'Ningún resultado', clearFilters: 'Limpiar', results: '{count} resultados',
    filters: { group: 'Filtros', add: 'Agregar filtro', clear: 'Limpiar filtros', filterBy: 'Filtrar por {label}', edit: 'Editar filtro: {summary}', remove: 'Quitar filtro: {summary}', field: 'Campo', operator: 'Operador', value: 'Valor', apply: 'Aplicar', cancel: 'Cancelar', close: 'Cerrar', from: 'Desde', to: 'Hasta', empty: 'Sin filtros' } }
  const at = (h) => '2026-09-29T' + h
  const resources = [{ id: 'a', title: 'Recurso A' }, { id: 'b', title: 'Recurso B' }]
  const events = [{ id: 'e1', resourceId: 'a', title: 'Reunión', start: at('09:00'), end: at('10:00') }]
  const calLabels = { previous: 'Anterior', next: 'Siguiente', today: 'Hoy', resources: 'Recurso' }
  const galItems = [{ id: 'g1', title: 'Ingresos', category: 'Finanzas', description: 'Ingresos', sizes: ['m', 'l'], value: '$1' }, { id: 'g2', title: 'Tareas', category: 'Equipo', description: 'Tareas', sizes: ['s', 'm'], value: '2' }]
  const galSizes = [{ id: 's', label: 'Pequeño' }, { id: 'm', label: 'Mediano' }, { id: 'l', label: 'Grande' }]
  const galLabels = { search: 'Buscar widgets', all: 'Todas', categories: 'Categoría', add: 'Añadir', size: 'Tamaño inicial', results: '{count} widgets', empty: 'Ninguno', added: 'Ya añadido', addedCount: 'En el panel: {count}', addedShort: 'Añadido', addedToPanel: '{title} añadido', alreadyAdded: '{title} ya está', close: 'Cerrar', list: 'Widgets' }
  const tx = GranaSpeech.createTranscript({ mode: 'conversation', expectedSpeakers: 2, speakers: [{ id: 'spk_0' }, { id: 'spk_1' }], segments: [{ id: 's1', t0: 0, t1: 2000, literal: 'Buenos días, cuénteme.', speaker: 'spk_0' }, { id: 's2', t0: 3000, t1: 5000, literal: 'Me duele la cabeza.', speaker: 'spk_1' }] })
  const txLabels = {}
`

async function mountMisc(page, density) {
  const d = density
  const template = `
  <div class="case" data-case="table"><g-table responsive="cards" density="${d}" :columns="cols" :rows="rows" caption="Clientes" :labels="tbLabels" v-model:filters="flt"></g-table></div>
  <div class="case" data-case="calendar"><g-calendar view="week" date="2026-09-29" :events="events" :resources="resources" locale="es-MX" label="Calendario" :labels="calLabels"></g-calendar></div>
  <div class="case" data-case="gallery"><g-widget-gallery v-model="open" density="${d}" title="Añadir" :items="galItems" :sizes="galSizes" :added="added" :labels="galLabels"></g-widget-gallery></div>
  <div class="case" data-case="transcript"><g-transcript :transcript="tx" editable label="Consulta" max-height="300px"></g-transcript></div>`
  await page.goto('/__campo.html')
  await page.evaluate(async ({ template, MISC_SETUP }) => {
    const fn = new Function('template', `${MISC_SETUP}
      const app = createApp({ template, setup: () => ({ flt, open, added, cols, rows, tbLabels, events, resources, calLabels, galItems, galSizes, galLabels, tx, txLabels }) })
      app.use(Grana); app.use(GranaSpeech.createSpeech({ labels: {} })); app.mount('#app'); return app`)
    window.__app = fn(template)
    await document.fonts.ready
  }, { template, MISC_SETUP })
  await page.waitForSelector('.case')
  await page.waitForTimeout(300)
}

const fs = (page, sel) => page.evaluate((sel) => [...document.querySelectorAll(sel)].map((e) => parseFloat(getComputedStyle(e).fontSize)), sel)

async function miscMeasure(page) {
  const out = {}
  out.tableSort = await fs(page, '[data-case="table"] select, [data-case="table"] .g-table__bar select')
  // editor del filtro: la chip sugerida abre el editor
  const chip = page.locator('[data-case="table"] .g-filter-bar__suggest').first()
  if (await chip.count()) {
    await chip.click()
    await page.waitForSelector('.g-filter-bar__input', { timeout: 3000 }).catch(() => {})
    out.filterEditor = await fs(page, '.g-filter-bar__rule, .g-filter-bar__input')
    await page.keyboard.press('Escape')
  }
  out.calendarResource = await fs(page, '[data-case="calendar"] .g-calendar__resource-select select')
  // galería
  await page.evaluate(() => { document.querySelector('[data-case="gallery"]'); window.__app._instance.setupState.open = true })
  await page.waitForSelector('.g-widget-gallery__search', { timeout: 3000 }).catch(() => {})
  out.gallerySearch = await fs(page, '.g-widget-gallery__search input')
  out.gallerySize = await fs(page, '.g-widget-gallery select')
  await page.keyboard.press('Escape')
  // editor del transcript: foco en la celda de texto y Enter
  const cell = page.locator('[data-case="transcript"] .g-transcript__cell--text').first()
  if (await cell.count()) {
    await cell.focus()
    await page.keyboard.press('Enter')
    await page.waitForSelector('.g-transcript__field', { timeout: 3000 }).catch(() => {})
    out.transcriptEditor = await fs(page, '.g-transcript__field')
  }
  return out
}

for (const dens of DENS) {
  test(`otros controles de la lista A · ${dens}: táctil = max(16, escritorio); escritorio Δ0 frente al dist/ anterior (1, 2)`, async ({ browser, browserName }) => {
    const desk = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    await routes(desk)
    const dp = await desk.newPage()
    await mountMisc(dp, dens)
    const D = await miscMeasure(dp)
    await desk.close()
    let T = null
    if (browserName !== 'firefox') {
      const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 })
      await routes(touch)
      const tp = await touch.newPage()
      await mountMisc(tp, dens)
      if (await tp.evaluate(() => matchMedia('(pointer: coarse)').matches)) T = await miscMeasure(tp)
      await touch.close()
    }
    if (V) console.log('misc', dens, JSON.stringify({ D, T }))
    if (WRITE_BASE) {
      const prev = existsSync(BASE_FILE) ? JSON.parse(readFileSync(BASE_FILE, 'utf8')) : {}
      prev.misc = { ...(prev.misc || {}), [dens]: D }
      writeFileSync(BASE_FILE, JSON.stringify(prev, null, 1) + '\n')
      return
    }
    test.skip(!T, `${browserName}: sin pointer: coarse emulado`)
    for (const [k, vals] of Object.entries(T)) {
      expect.soft(vals.length, `${dens} ${k}: el control existe en táctil`).toBeGreaterThan(0)
      expect.soft(D[k].length, `${dens} ${k}: el control existe en escritorio`).toBeGreaterThan(0)
      for (const v of vals) expect.soft(v, `${dens} ${k} táctil ≥ 16`).toBeGreaterThanOrEqual(16)
      // Escritorio Δ0 frente al dist/ anterior; en compact, cada rol de entonces con la escala B de la pieza 3 (#986)
      if (base?.misc?.[dens]?.[k]) {
        // GCalendar y GTranscript no llevan `density` y aquí no están en una región: su texto no cambia (Δ0)
        const follows = dens === 'compact' && !['calendarResource', 'transcriptEditor'].includes(k)
        const want = follows ? base.misc[dens][k].map((v) => (v == null ? v : cli.compactSize(v))) : base.misc[dens][k]
        expect.soft(D[k].length, `${dens} ${k} escritorio: mismos controles`).toBe(want.length)
        D[k].forEach((v, i) => expect.soft(Math.abs(v - want[i]) <= 0.01, `${dens} ${k}[${i}] escritorio ${v} = ${want[i]}`).toBe(true))
      }
    }
  })
}


// ============================================================ helpers de táctil para el resto de criterios
const TOUCH = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }
async function touchPage(browser, browserName, { css, viewport } = {}) {
  if (browserName === 'firefox') return null
  const ctx = await browser.newContext({ ...TOUCH, ...(viewport ? { viewport } : {}) })
  await routes(ctx, css)
  const page = await ctx.newPage()
  return { ctx, page }
}
const coarse = (page) => page.evaluate(() => matchMedia('(pointer: coarse)').matches)

// ============================================================ 3 · con un tema de letra mayor manda el rol
// Temas del CLI real (H5 de la pieza 3, density.md §16.7): un --g-text-* escrito a mano en :root no vale dentro de una raíz
// con prop explícita (la matriz pasa density="default"); el tema de texto se hace con las claves del CLI, que emiten sus reglas
const THEMES = [
  // fontSize 18 según scales.js: caption max(12, 18×0,75), body-sm 18×0,875, body 18
  { name: 'fontSize 18', css: cli.buildTheme({ fontSize: 18 }).css, roles: { xs: 13.5, sm: 15.75, md: 15.75, lg: 18, xl: 18 } },
  // fontSize 20: el rol de md (17,5) ya supera 16 (lo que #972 criterio 3 llama «fontSize 18»: con 18, body-sm da 15,75)
  { name: 'fontSize 20', css: cli.buildTheme({ fontSize: 20 }).css, roles: { xs: 15, sm: 17.5, md: 17.5, lg: 20, xl: 20 } }
]
for (const th of THEMES) {
  test(`tema ${th.name} (3): en táctil manda el rol (max(16, rol)) en el control y su línea del valor`, async ({ browser, browserName }) => {
    const t = await touchPage(browser, browserName, { css: th.css })
    test.skip(!t, `${browserName}: sin isMobile`)
    await mount(t.page, matrixTemplate('default'))
    test.skip(!(await coarse(t.page)), `${browserName}: sin pointer: coarse emulado`)
    const m = await measure(t.page, SPEC)
    for (const z of SIZES) {
      const want = Math.max(16, th.roles[z])
      for (const [c, v] of Object.entries(m).filter(([k]) => k.startsWith(z + '|'))) {
        expect.soft(v.main, `${th.name} ${c} main`).toBeCloseTo(want, 2)
        for (const k of COMPANIONS) if (v[k] != null) expect.soft(v[k], `${th.name} ${c} ${k}`).toBeCloseTo(want, 2)
      }
    }
    // en escritorio con ese tema el rol sigue mandando sin piso (Δ0 respecto del rol)
    await t.ctx.close()
    const desk = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    await routes(desk, th.css)
    const dp = await desk.newPage()
    await mount(dp, matrixTemplate('default'))
    const dm = await measure(dp, SPEC)
    for (const z of SIZES) for (const [c, v] of Object.entries(dm).filter(([k]) => k.startsWith(z + '|') && !k.endsWith('group'))) expect.soft(v.main, `${th.name} escritorio ${c}`).toBeCloseTo(th.roles[z], 2)
    await desk.close()
  })
}

// ============================================================ 5 · listas y paneles se quedan en su rol
test('listas abiertas (5): las opciones de GSelect y de GCombobox miden en táctil lo mismo que en escritorio (su rol)', async ({ browser, browserName }) => {
  const t = await touchPage(browser, browserName)
  test.skip(!t, `${browserName}: sin isMobile`)
  const optFs = (page) => page.evaluate(() => {
    const lists = [...document.querySelectorAll('[role=listbox]')].filter((l) => l.getClientRects().length > 0)
    const o = lists.length ? lists[lists.length - 1].querySelector('[role=option]') : null
    return o ? parseFloat(getComputedStyle(o).fontSize) : null
  })
  const collect = async (page) => {
    const out = {}
    for (const z of ['xs', 'md', 'xl']) {
      await page.locator(`.size[data-size="${z}"] [data-case="select"] .g-select__button`).click()
      await page.waitForFunction(() => [...document.querySelectorAll('[role=listbox]')].some((l) => l.getClientRects().length > 0))
      out[`select ${z}`] = await optFs(page)
      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)
      await page.locator(`.size[data-size="${z}"] [data-case="combobox"] input.g-input__field`).click()
      await page.waitForFunction(() => [...document.querySelectorAll('[role=listbox]')].some((l) => l.getClientRects().length > 0))
      out[`combobox ${z}`] = await optFs(page)
      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)
    }
    return out
  }
  const desk = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await routes(desk)
  const dp = await desk.newPage()
  await mount(dp, matrixTemplate('default'))
  const D = await collect(dp)
  await desk.close()
  await mount(t.page, matrixTemplate('default'))
  test.skip(!(await coarse(t.page)), `${browserName}: sin pointer: coarse emulado`)
  const T = await collect(t.page)
  if (V) console.log('LISTAS', JSON.stringify({ D, T }))
  for (const k of Object.keys(D)) {
    expect.soft(D[k], `${k}: existe`).not.toBeNull()
    expect.soft(T[k], `${k}: en táctil conserva su rol (= escritorio)`).toBe(D[k])
  }
  for (const z of ['xs', 'md', 'xl']) expect.soft(D[`select ${z}`], `GSelect ${z}: opción en el rol del control`).toBe(DESKTOP_PX[z])
  await t.ctx.close()
})

test('GCombobox appearance="palette" (1): el campo de la paleta mide ≥ 16 en táctil', async ({ browser, browserName }) => {
  const t = await touchPage(browser, browserName)
  test.skip(!t, `${browserName}: sin isMobile`)
  await mount(t.page, `<div class="size" data-size="md"><div class="case" data-case="palette"><g-combobox appearance="palette" label="Diagnóstico" v-model="s.cb" placeholder="Código" :options="cbOptions" :labels="cbLabels"></g-combobox></div></div>`)
  test.skip(!(await coarse(t.page)), `${browserName}: sin pointer: coarse emulado`)
  await t.page.locator('[data-case="palette"] input, [data-case="palette"] button').first().click()
  await t.page.waitForSelector('dialog[open] input, .g-combobox__panel input')
  const sizes = await t.page.evaluate(() => [...document.querySelectorAll('dialog[open] input:not([type=hidden]), .g-combobox__panel input:not([type=hidden])')].map((e) => parseFloat(getComputedStyle(e).fontSize)))
  expect(sizes.length).toBeGreaterThan(0)
  for (const v of sizes) expect.soft(v).toBeGreaterThanOrEqual(16)
  await t.ctx.close()
})

// ============================================================ 6 · las capas que copian el texto miden lo mismo que el texto real
const PROBE = `
  const probe = (el, text) => {
    const cs = getComputedStyle(el)
    const s = document.createElement('span')
    s.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;font-family:' + cs.fontFamily + ';font-size:' + cs.fontSize + ';font-weight:' + cs.fontWeight + ';font-style:' + cs.fontStyle + ';letter-spacing:' + cs.letterSpacing + ';font-variant-numeric:' + cs.fontVariantNumeric
    s.textContent = text
    document.body.appendChild(s)
    const w = s.getBoundingClientRect().width
    s.remove()
    return w
  }
`
async function alignment(page, mode) {
  const out = {}
  for (const z of SIZES) {
    // fantasma del combobox: se teclea «As» y el resto («ma») aparece detrás
    const input = page.locator(`.size[data-size="${z}"] [data-case="combobox"] input.g-input__field`)
    await input.click()
    await input.pressSequentially('As')
    await page.waitForSelector(`.size[data-size="${z}"] .g-combobox__ghost`, { timeout: 3000 }).catch(() => {})
    out[`${mode} ${z} ghost`] = await page.evaluate(({ z, PROBE }) => {
      const probe = new Function(PROBE + '; return probe')()
      const root = document.querySelector(`.size[data-size="${z}"] [data-case="combobox"]`)
      const inp = root.querySelector('input.g-input__field')
      const typed = root.querySelector('.g-combobox__ghost-typed')
      const rest = root.querySelector('.g-combobox__ghost-rest')
      if (!typed || !rest) return null
      const cs = getComputedStyle(inp)
      const left = inp.getBoundingClientRect().left + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth)
      return { fontInput: cs.fontSize, fontGhost: getComputedStyle(typed).fontSize, typedW: typed.getBoundingClientRect().width, textW: probe(inp, inp.value), restLeft: rest.getBoundingClientRect().left, expectLeft: left + probe(inp, inp.value) }
    }, { z, PROBE })
    await page.keyboard.press('Escape')
    // espejos: misma letra que el campo; el margen que el espejo añade al texto (cursor) es el mismo en táctil y en escritorio
    for (const [c, mirror] of [['number', '.g-number-field__mirror'], ['time', '.g-time-field__mirror']]) {
      out[`${mode} ${z} ${c}`] = await page.evaluate(({ z, c, mirror, PROBE }) => {
        const probe = new Function(PROBE + '; return probe')()
        const root = document.querySelector(`.size[data-size="${z}"] [data-case="${c}"]`)
        const inp = root.querySelector('input.g-input__field')
        const m = root.querySelector(mirror)
        if (!m) return null
        const fi = parseFloat(getComputedStyle(inp).fontSize)
        const mw = m.getBoundingClientRect().width
        const tw = probe(inp, m.textContent)
        return { fontInput: fi, fontMirror: parseFloat(getComputedStyle(m).fontSize), slackEm: (mw - tw) / fi, inputOverflow: inp.scrollWidth - inp.clientWidth }
      }, { z, c, mirror, PROBE })
    }
  }
  return out
}

test('espejos y fantasma (6): alineados con el texto real en táctil (Δ ≤ 0,5 px) y con el mismo margen que en escritorio', async ({ browser, browserName }) => {
  // Táctil de tableta (820 px): en teléfono GCombobox abre una hoja y no hay fantasma
  const t = await touchPage(browser, browserName, { viewport: { width: 820, height: 1200 } })
  test.skip(!t, `${browserName}: sin isMobile`)
  const desk = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await routes(desk)
  const dp = await desk.newPage()
  await mount(dp, matrixTemplate('default'))
  const D = await alignment(dp, 'desktop')
  await desk.close()
  await mount(t.page, matrixTemplate('default'))
  test.skip(!(await coarse(t.page)), `${browserName}: sin pointer: coarse emulado`)
  const T = await alignment(t.page, 'touch')
  if (V) console.log('ALIGN', JSON.stringify({ D, T }))
  for (const [name, r] of [...Object.entries(D), ...Object.entries(T)]) {
    expect.soft(r, `${name}: la capa existe`).not.toBeNull()
    if (!r) continue
    if ('typedW' in r) {
      expect.soft(r.fontGhost, `${name}: mismo font-size que el campo`).toBe(r.fontInput)
      if (name.startsWith('touch')) expect.soft(parseFloat(r.fontInput), `${name}: el campo mide ≥ 16`).toBeGreaterThanOrEqual(16)
      expect.soft(Math.abs(r.restLeft - r.expectLeft), `${name}: el resto del fantasma empieza donde acaba lo tecleado`).toBeLessThanOrEqual(0.5)
      expect.soft(Math.abs(r.typedW - r.textW), `${name}: lo tecleado del fantasma mide lo mismo que el texto real`).toBeLessThanOrEqual(0.5)
    } else {
      expect.soft(r.fontMirror, `${name}: mismo font-size que el campo`).toBe(r.fontInput)
      if (name.startsWith('touch')) expect.soft(r.fontInput, `${name}: el campo mide ≥ 16`).toBeGreaterThanOrEqual(16)
      expect.soft(r.inputOverflow, `${name}: el texto cabe en el campo`).toBeLessThanOrEqual(0)
    }
  }
  // El margen que el espejo suma al texto (px) de cada `size` en táctil (todos 16 px) es el del escritorio a 16 px (lg)
  for (const c of ['number', 'time']) {
    const ref = D[`desktop lg ${c}`]
    for (const z of SIZES) {
      const r = T[`touch ${z} ${c}`]
      if (r && ref) expect.soft(Math.abs(r.slackEm * r.fontInput - ref.slackEm * ref.fontInput), `touch ${z} ${c}: margen del espejo (px) = el de escritorio a 16 px`).toBeLessThanOrEqual(0.5)
    }
  }
  await t.ctx.close()
})

// ============================================================ 7 · a 320 px, sin desborde
for (const dens of DENS) {
  test(`320 px (7) · ${dens}: sin desplazamiento horizontal ni desborde de la caja; la hora dicha, todo o nada`, async ({ browser, browserName }) => {
    const t = await touchPage(browser, browserName, { viewport: { width: 320, height: 640 } })
    test.skip(!t, `${browserName}: sin isMobile`)
    const row = `<div class="size" data-size="rows"><g-form-layout>
      <g-form-row><g-input label="Nombre" v-model="s.name" density="${dens}"></g-input><g-input label="Apellido" v-model="s.empty" density="${dens}"></g-input></g-form-row>
      <g-form-row><g-number-field label="Cantidad" v-model="s.qty" :min="0" :max="99" suffix="kg" density="${dens}"></g-number-field><g-time-field label="Hora" v-model="s.time" locale="es" density="${dens}" :labels="{ invalid: 'x' }"></g-time-field></g-form-row>
      <g-form-row><g-select label="Plan" v-model="s.plan" :options="plans" density="${dens}"></g-select><g-date-picker label="Fecha" v-model="s.date" :labels="dpLabels" density="${dens}"></g-date-picker></g-form-row>
    </g-form-layout></div>`
    await mount(t.page, matrixTemplate(dens) + row)
    test.skip(!(await coarse(t.page)), `${browserName}: sin pointer: coarse emulado`)
    const r = await t.page.evaluate(() => {
      const vw = document.documentElement.clientWidth
      const boxes = [...document.querySelectorAll('.g-input__control, .g-textarea__control, .g-select__control, .g-datepicker__field, .g-party-field__trigger, .g-input-group__box')]
      const bad = boxes.filter((b) => { const x = b.getBoundingClientRect(); return x.right > vw + 0.5 || x.left < -0.5 }).map((b) => b.className)
      const clipped = [...document.querySelectorAll('.g-input__field')].filter((i) => i.scrollWidth > i.clientWidth + 1).length
      const readings = [...document.querySelectorAll('.g-time-field__reading')].map((e) => {
        const cs = getComputedStyle(e)
        const hidden = cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0
        return hidden || e.scrollWidth <= e.clientWidth + 1
      })
      return { vw, sw: document.documentElement.scrollWidth, bad, clipped, readings, boxes: boxes.length }
    })
    if (V) console.log('320', dens, JSON.stringify(r))
    expect.soft(r.sw, 'sin desplazamiento horizontal de la página').toBeLessThanOrEqual(r.vw)
    expect.soft(r.bad, 'cajas dentro del visor').toEqual([])
    expect.soft(r.readings.every(Boolean), 'la hora dicha cabe entera o no se muestra').toBe(true)
    expect(r.boxes).toBeGreaterThan(10)
    await t.ctx.close()
  })
}
