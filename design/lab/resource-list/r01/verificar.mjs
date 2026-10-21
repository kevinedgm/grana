// Verificación del prototipo de GResourceList (kiwi r01): base y conceptos A, B y C, escritorio y teléfono, en
// Chromium, Firefox y WebKit. Ejecutar desde la raíz: node design/lab/resource-list/r01/verificar.mjs
//   Puerto 4211 (GRANA_PW_PORT lo cambia). ENGINES=chromium,firefox,webkit  PARTS=base,A,B,C,estados,movil,auditoria  VERBOSE=1
//   Con PARTS=auditoria y SHOTS=1 guarda capturas en capturas/ (escritorio y teléfono por concepto).
// Requiere packages/vue/dist (npm run build) y node_modules/vue. Solo lee; no toca packages/.
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const PORT = Number(process.env.GRANA_PW_PORT || 4211)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json', '.svg': 'image/svg+xml' }
const server = http.createServer(async (req, res) => {
  try {
    const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!path.startsWith(ROOT)) throw new Error('fuera')
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(path))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${PORT}/design/lab/resource-list/r01/index.html`
const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))

const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const PARTS = (process.env.PARTS || 'base,A,B,C,estados,movil,auditoria').split(',')
const V = !!process.env.VERBOSE
const R = []
const rec = (eng, part, name, ok, info = '') => { R.push({ eng, part, name, ok: !!ok }); if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${part} · ${name}${info !== '' ? ' · ' + info : ''}`) }

const settle = (p, ms = 60) => p.evaluate((ms) => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, ms)))), ms)
async function open (b, qs, opts = {}) {
  const { vw = 1280, vh = 860, ...ctx } = opts
  const context = await b.newContext({ viewport: { width: vw, height: vh }, ...ctx })
  const p = await context.newPage()
  const errs = []
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text().slice(0, 240)) })
  p.on('pageerror', (e) => errs.push('pageerror ' + String(e)))
  await p.goto(BASE + qs)
  await p.waitForFunction(() => window.__rl && window.__rl.ready)
  await idle(p)
  p.__errs = errs
  p.__ctx = context
  return p
}
// Espera a que la carga simulada termine (tabla sin aria-busy) y a dos cuadros
const toastWith = (p, text) => p.locator('.g-toast').filter({ hasText: text }).first().waitFor({ timeout: 5000 }).then(() => true, () => false)
const waitEvent = (p, type) => p.waitForFunction((type) => window.__rl.events.some((e) => e.type === type), type, { timeout: 5000 }).then(() => true, () => false)
const idle = async (p) => { await p.waitForFunction(() => !document.querySelector('.g-table__table[aria-busy="true"]') && !document.querySelector('.g-table.is-loading'), null, { timeout: 15000 }).catch(() => {}); await settle(p, 120) }
const active = (p) => p.evaluate(() => { const a = document.activeElement; if (!a) return null; return { tag: a.tagName.toLowerCase(), id: a.id, cls: a.className && String(a.className), name: a.getAttribute('aria-label') || a.textContent.trim().slice(0, 60), role: a.getAttribute('role'), inDialog: !!a.closest('dialog'), inRow: a.closest('tr')?.dataset.rlKey || null, inLens: !!a.closest('.rl-lens'), inDetail: !!a.closest('.g-table__detail') } })
const events = (p) => p.evaluate(() => window.__rl.events.map((e) => e.type))
const lastEvent = (p, type) => p.evaluate((type) => [...window.__rl.events].reverse().find((e) => e.type === type) || null, type)
const rowKeys = (p) => p.evaluate(() => [...document.querySelectorAll('.g-table__table tbody tr.g-table__row')].map((tr) => tr.dataset.rlKey))
const rowTop = (p, k) => p.evaluate((k) => document.querySelector(`tr[data-rl-key="${k}"]`)?.getBoundingClientRect().top ?? null, k)
const live = (p) => p.evaluate(() => document.querySelector('.g-load-live')?.textContent || '')
const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
// Una fila de la página con un estado dado (lo decide la aplicación: «Dar de baja» solo sin mosto)
const rowWith = (p, estados) => p.evaluate((estados) => {
  const rows = window.__rlApp.rows.value
  const r = rows.find((x) => estados.includes(x.estado))
  return r ? r.id : null
}, estados)
const openRowMenu = async (p, k) => {
  await p.locator(`tr[data-rl-key="${k}"] .g-table__actions button`).first().click()
  await p.locator('[role="menu"]').first().waitFor({ state: 'visible' })
  await settle(p)
}
const pickMenu = async (p, name) => { await p.getByRole('menuitem', { name: new RegExp('^' + name) }).first().click(); await settle(p, 150) }
const pickSelect = async (p, scope, label, option) => {
  await p.locator(scope).getByRole('combobox', { name: label }).first().click()
  await settle(p)
  await p.getByRole('option', { name: option, exact: true }).first().click()
  await settle(p)
}

async function runBase (b, eng) {
  const part = 'base'
  const p = await open(b, '?c=base')
  rec(eng, part, 'un solo h1 y la tabla se nombra con él', await p.evaluate(() => document.querySelectorAll('h1').length === 1 && document.querySelector('.g-table__table').getAttribute('aria-labelledby') === 'rl-ph-title' && !!document.getElementById('rl-ph-title')))
  rec(eng, part, 'una sola región search con nombre', await p.evaluate(() => document.querySelectorAll('[role="search"]').length === 1 && !!document.querySelector('[role="search"]').getAttribute('aria-label')))
  rec(eng, part, '10 filas y paginación 1–10 de 46', (await rowKeys(p)).length === 10 && /1–10 de 46/.test(await p.locator('.g-pagination').first().innerText()))
  // Crear: diálogo, foco al primer campo, cancelar devuelve el foco al disparador
  await p.locator('#rl-create').click()
  await p.locator('#rl-editor[open]').waitFor()
  await settle(p, 200)
  let a = await active(p)
  rec(eng, part, 'crear: GDialog abierto con el foco en el primer campo', a && a.inDialog && a.role === 'combobox', JSON.stringify(a))
  await p.getByRole('button', { name: 'Cancelar', exact: true }).first().click()
  await settle(p, 300)
  a = await active(p)
  rec(eng, part, 'crear: Cancelar devuelve el foco a «Registrar tina»', a && a.id === 'rl-create', JSON.stringify(a))
  // Crear de verdad: errores primero, luego guardar
  await p.locator('#rl-create').click(); await settle(p, 250)
  await p.locator('#rl-editor').getByRole('button', { name: 'Registrar', exact: true }).click(); await settle(p, 200)
  rec(eng, part, 'crear: enviar vacío revela errores de la aplicación (GForm)', await p.locator('#rl-editor [aria-invalid="true"]').count() >= 1)
  await pickSelect(p, '#rl-editor', /^Estado/, 'Vacía')
  await pickSelect(p, '#rl-editor', /^Maestro mezcalero/, 'Rosa Martínez')
  await p.locator('#rl-editor').getByRole('button', { name: 'Registrar', exact: true }).click()
  await p.waitForFunction(() => !document.querySelector('#rl-editor[open]'), null, { timeout: 8000 }).catch(() => {})
  await idle(p)
  a = await active(p)
  rec(eng, part, 'crear: al guardar cierra y el foco vuelve al disparador', a && a.id === 'rl-create', JSON.stringify(a))
  rec(eng, part, 'crear: 47 tinas y aviso de la aplicación', /47/.test(await p.locator('.g-pagination').first().innerText()) && (await p.locator('.g-toast').count()) >= 1)
  // Editar desde el menú de fila
  const ed = await rowWith(p, ['fermentando', 'lista', 'vacia', 'limpieza'])
  await openRowMenu(p, ed)
  await pickMenu(p, 'Editar')
  await p.locator('#rl-editor[open]').waitFor(); await settle(p, 200)
  rec(eng, part, 'editar: título «Editar T-..» y foco en el primer campo', (await p.locator('#rl-editor').innerText()).includes('Editar ' + ed) && (await active(p))?.role === 'combobox')
  await p.keyboard.press('Escape'); await settle(p, 350)
  a = await active(p)
  rec(eng, part, 'editar: Esc devuelve el foco al botón de acciones de su fila', a && a.inRow === ed && a.tag === 'button', JSON.stringify(a))
  // Disponibilidad con motivo: una tina fermentando no se da de baja (el motivo se lee en el menú)
  const fe = await rowWith(p, ['fermentando'])
  await openRowMenu(p, fe)
  const dis = await p.getByRole('menuitem', { name: /^Dar de baja/ }).first()
  rec(eng, part, 'permiso: «Dar de baja» con aria-disabled y su motivo visible', (await dis.getAttribute('aria-disabled')) === 'true' && /sin mosto/.test(await dis.innerText()))
  await p.keyboard.press('Escape'); await settle(p)
  // Dar de baja: alertdialog con el foco en Cancelar; confirmar quita y ofrece Deshacer
  const rm = await rowWith(p, ['vacia', 'limpieza'])
  await openRowMenu(p, rm)
  await pickMenu(p, 'Dar de baja')
  await p.locator('#rl-confirm[open]').waitFor(); await settle(p, 200)
  a = await active(p)
  rec(eng, part, 'baja: alertdialog con la pregunta y el foco en «Cancelar»', (await p.locator('#rl-confirm').getAttribute('role')) === 'alertdialog' && a && a.name === 'Cancelar', JSON.stringify(a))
  await p.locator('#rl-confirm-ok').click()
  const t1 = await toastWith(p, 'Deshacer')
  await idle(p); await settle(p, 300)
  rec(eng, part, 'baja: la fila sale y el aviso trae «Deshacer»', !(await rowKeys(p)).includes(rm) && t1)
  rec(eng, part, 'baja: evento remove con la clave', JSON.stringify((await lastEvent(p, 'remove'))?.keys) === JSON.stringify([rm]))
  // Búsqueda: espera, vuelve a la página 1 y anuncia; sin resultados, GEmpty «filtered» con la salida
  await p.locator('#rl-search').fill('zzz')
  await p.locator('.g-empty').waitFor({ timeout: 6000 }).catch(() => {}); await idle(p)
  rec(eng, part, 'búsqueda sin resultados: GEmpty filtered con «Quitar «Búsqueda «zzz»»»', await p.locator('.g-empty').count() === 1 && /zzz/.test(await p.locator('.g-empty').innerText()))
  await p.locator('.g-empty').getByRole('button', { name: /zzz/ }).click()
  await p.waitForFunction(() => document.querySelectorAll('.g-table__table tbody tr.g-table__row').length === 10, null, { timeout: 6000 }).catch(() => {}); await idle(p)
  rec(eng, part, 'búsqueda: quitarla desde el vacío restaura la lista', (await rowKeys(p)).length === 10 && (await p.locator('#rl-search').inputValue()) === '')
  // Error con filas: la barra de GTable con Reintentar; reintentar recarga
  await p.locator('#lab-fail').click()
  await p.locator('.g-pagination').getByRole('button', { name: 'Página siguiente' }).first().click()
  await idle(p); await settle(p, 300)
  rec(eng, part, 'error: GTable conserva las filas y pinta la barra con «Reintentar»', await p.locator('.g-table__failed').count() === 1 && (await rowKeys(p)).length === 10)
  await p.locator('.g-table__failed').getByRole('button', { name: 'Reintentar' }).click()
  await idle(p)
  rec(eng, part, 'error: reintentar recarga sin barra', await p.locator('.g-table__failed').count() === 0)
  rec(eng, part, 'sin errores de consola', p.__errs.length === 0, p.__errs.slice(0, 3).join(' | '))
  await p.__ctx.close()
}

async function runA (b, eng) {
  const part = 'A'
  const p = await open(b, '?c=A')
  rec(eng, part, 'sin diálogos en A (ningún <dialog> de editor ni de confirmación)', await p.evaluate(() => !document.querySelector('#rl-editor, #rl-confirm')))
  // Crear: la fila borrador aparece arriba con el formulario; foco al primer campo
  const before = await rowTop(p, (await rowKeys(p))[0])
  await p.locator('#rl-create').click(); await settle(p, 300)
  let a = await active(p)
  rec(eng, part, 'crear: fila «Tina nueva» arriba, desplegada, con el foco en su primer campo', (await rowKeys(p))[0] === '__rl-new' && a && a.inDetail && a.role === 'combobox', JSON.stringify(a))
  await pickSelect(p, '.g-table__detail', /^Estado/, 'Vacía')
  await pickSelect(p, '.g-table__detail', /^Maestro mezcalero/, 'Lucía Santiago')
  await p.locator('.g-table__detail').getByRole('button', { name: 'Registrar', exact: true }).click()
  await p.waitForFunction(() => !document.querySelector('tr[data-rl-key="__rl-new"]'), null, { timeout: 8000 }).catch(() => {})
  await idle(p); await settle(p, 300)
  const keys = await rowKeys(p)
  a = await active(p)
  rec(eng, part, 'crear: la nueva queda ARRIBA con «Nueva» en el texto y el foco en su puerta', keys[0] === 'T-47' && /Nueva/.test(await p.locator('tr[data-rl-key="T-47"]').innerText()) && a && a.inRow === 'T-47' && /g-table__door/.test(a.cls), JSON.stringify({ k: keys[0], a }))
  rec(eng, part, 'crear: anunciado por el canal cortés de página', /T-47 registrada/.test((await lastEvent(p, 'announce'))?.text || ''))
  // Editar en su sitio: la puerta (divulgación) abre el formulario debajo de la fila; Cancelar pliega y vuelve a la puerta
  const ed = await rowWith(p, ['vacia', 'limpieza', 'lista'])
  const nextKey = keys[keys.indexOf(ed) + 1]
  await p.locator(`tr[data-rl-key="${ed}"] .g-table__door`).click(); await settle(p, 300)
  a = await active(p)
  rec(eng, part, 'editar: la fila se abre en su formulario con el foco en el primer campo', a && a.inDetail && a.role === 'combobox', JSON.stringify(a))
  await p.locator('.g-table__detail').getByRole('button', { name: 'Cancelar', exact: true }).click(); await settle(p, 300)
  a = await active(p)
  rec(eng, part, 'editar: Cancelar pliega y devuelve el foco a la puerta de la fila', a && a.inRow === ed && /g-table__door/.test(a.cls), JSON.stringify(a))
  // Huella: dar de baja NO pregunta ni envía; la fila se queda con «Deshacer» y nada se mueve
  const rm = await rowWith(p, ['vacia', 'limpieza'])
  const k2 = (await rowKeys(p))[(await rowKeys(p)).indexOf(rm) + 1]
  const top2 = await rowTop(p, k2)
  await openRowMenu(p, rm)
  await pickMenu(p, 'Dar de baja'); await settle(p, 250)
  a = await active(p)
  rec(eng, part, 'huella: la fila sigue, dice «Dada de baja» y el foco está en «Deshacer»', (await rowKeys(p)).includes(rm) && /Dada de baja/.test(await p.locator(`tr[data-rl-key="${rm}"]`).innerText()) && a && /Deshacer/.test(a.name), JSON.stringify(a))
  rec(eng, part, 'huella: nada enviado todavía (sin evento remove)', !(await events(p)).includes('remove'))
  rec(eng, part, 'huella: la fila siguiente no se mueve (Δ ≤ 1px)', Math.abs((await rowTop(p, k2)) - top2) <= 1)
  await p.keyboard.press('Enter'); await settle(p, 300)
  a = await active(p)
  rec(eng, part, 'deshacer: la fila vuelve y el foco va a su botón de acciones', !/Dada de baja/.test(await p.locator(`tr[data-rl-key="${rm}"]`).innerText()) && a && a.inRow === rm, JSON.stringify(a))
  // Otra vez, y ahora salir de la fila con el teclado aplica la baja
  await openRowMenu(p, rm)
  await pickMenu(p, 'Dar de baja'); await settle(p, 250)
  await p.mouse.move(2, 2)
  // El foco va a otro control (en WebKit, Tab no recorre botones por defecto: se enfoca la búsqueda directamente)
  await p.locator('#rl-search').focus(); await settle(p, 100)
  await waitEvent(p, 'remove')
  await p.waitForFunction((k) => !document.querySelector(`tr[data-rl-key="${k}"]`), rm, { timeout: 6000 }).catch(() => {}); await idle(p)
  rec(eng, part, 'huella: al salir foco y puntero se envía remove y la fila se va', JSON.stringify((await lastEvent(p, 'remove'))?.keys) === JSON.stringify([rm]) && !(await rowKeys(p)).includes(rm))
  rec(eng, part, 'sin errores de consola', p.__errs.length === 0, p.__errs.slice(0, 3).join(' | '))
  void before; void nextKey
  await p.__ctx.close()
}

async function runB (b, eng) {
  const part = 'B'
  const p = await open(b, '?c=B')
  const keys = await rowKeys(p)
  const k = keys[2]
  await p.locator(`tr[data-rl-key="${k}"] .g-table__door`).click(); await settle(p, 300)
  let a = await active(p)
  rec(eng, part, 'abrir: la lente aparece al lado (no modal) con el foco en su título', await p.locator('.rl-lens').count() === 1 && a && a.id === 'rl-lens-title' && !(await p.evaluate(() => !!document.querySelector('dialog[open]'))), JSON.stringify(a))
  rec(eng, part, 'abrir: la puerta de la fila lleva aria-current y la región se nombra con el código', (await p.locator(`tr[data-rl-key="${k}"] .g-table__door`).getAttribute('aria-current')) === 'true' && (await p.locator('.rl-lens').getAttribute('aria-labelledby')) === 'rl-lens-title' && (await p.locator('#rl-lens-title').innerText()).startsWith(k))
  rec(eng, part, 'abrir: la lista sigue operable (sin inert ni aria-hidden)', await p.evaluate(() => !document.querySelector('.rl-list').closest('[inert],[aria-hidden="true"]')))
  await p.keyboard.press('Escape'); await settle(p, 200)
  a = await active(p)
  rec(eng, part, 'Esc en la lente: el foco vuelve a la puerta y la lente sigue abierta', a && a.inRow === k && await p.locator('.rl-lens').count() === 1, JSON.stringify(a))
  // Siguiente / anterior, y cruzar de página
  await p.locator('#rl-lens-next').click(); await settle(p, 250)
  rec(eng, part, 'siguiente: la lente muestra la fila siguiente y aria-current la sigue', (await p.locator('#rl-lens-title').innerText()).startsWith(keys[3]) && (await p.locator(`tr[data-rl-key="${keys[3]}"] .g-table__door`).getAttribute('aria-current')) === 'true')
  await p.locator(`tr[data-rl-key="${keys[9]}"] .g-table__door`).click(); await settle(p, 250)
  await p.locator('#rl-lens-next').click()
  await idle(p); await settle(p, 300)
  const k2 = await rowKeys(p)
  rec(eng, part, 'siguiente en la última fila: pasa a la página 2 y abre su primera fila', /11–20/.test(await p.locator('.g-pagination').first().innerText()) && (await p.locator('#rl-lens-title').innerText()).startsWith(k2[0]))
  // Editar dentro de la lente: foco al primer campo; Cancelar vuelve a «Editar»
  const ed = await rowWith(p, ['vacia', 'limpieza', 'lista', 'fermentando'])
  await p.locator(`tr[data-rl-key="${ed}"] .g-table__door`).click(); await settle(p, 250)
  await p.locator('#rl-lens-edit').click(); await settle(p, 300)
  a = await active(p)
  rec(eng, part, 'editar en la lente: el formulario ocupa la lente y el foco va al primer campo', a && a.inLens && a.role === 'combobox', JSON.stringify(a))
  await p.locator('.rl-lens').getByRole('button', { name: 'Cancelar', exact: true }).click(); await settle(p, 250)
  a = await active(p)
  rec(eng, part, 'editar en la lente: Cancelar vuelve a «Editar»', a && a.id === 'rl-lens-edit', JSON.stringify(a))
  // Dar de baja desde la lente: confirmación en el sitio, foco en Cancelar; al confirmar la lente pasa a la siguiente
  const rm = await rowWith(p, ['vacia', 'limpieza'])
  const ks = await rowKeys(p)
  await p.locator(`tr[data-rl-key="${rm}"] .g-table__door`).click(); await settle(p, 250)
  await p.locator('#rl-lens-remove').click(); await settle(p, 250)
  a = await active(p)
  rec(eng, part, 'baja en la lente: grupo con la pregunta y el foco en «Cancelar»', a && a.name === 'Cancelar' && a.inLens && /¿Dar de baja la tina/.test(await p.locator('.rl-lens .rl-confirm').getAttribute('aria-label')), JSON.stringify(a))
  await p.locator('.rl-lens .rl-confirm__ok').click()
  await idle(p); await settle(p, 400)
  const after = await p.locator('#rl-lens-title').innerText()
  rec(eng, part, 'baja en la lente: remove emitido y la lente pasa a la siguiente', JSON.stringify((await lastEvent(p, 'remove'))?.keys) === JSON.stringify([rm]) && after.startsWith(ks[ks.indexOf(rm) + 1] || ks[ks.indexOf(rm) - 1]), after)
  // Crear en la lente
  await p.locator('#rl-create').click(); await settle(p, 300)
  a = await active(p)
  rec(eng, part, 'crear: la lente se vuelve «Tina nueva» con el foco en el primer campo', (await p.locator('#rl-lens-title').innerText()).startsWith('Tina nueva') && a && a.inLens && a.role === 'combobox', JSON.stringify(a))
  rec(eng, part, 'sin errores de consola', p.__errs.length === 0, p.__errs.slice(0, 3).join(' | '))
  await p.__ctx.close()
}

async function runC (b, eng) {
  const part = 'C'
  const p = await open(b, '?c=C')
  const n = (k) => p.locator(`.rl-facet[data-facet="${k}"] .rl-facet__n`).innerText()
  const lista = await n('lista')
  await p.locator('.rl-facet[data-facet="fermentando"]').click()
  await idle(p)
  rec(eng, part, 'faceta: alterna con aria-pressed y filtra', (await p.locator('.rl-facet[data-facet="fermentando"]').getAttribute('aria-pressed')) === 'true' && (await p.evaluate(() => window.__rlApp.rows.value.every((r) => r.estado === 'fermentando'))))
  rec(eng, part, 'faceta: las demás cuentan sin su propio filtro (no caen a 0)', (await n('lista')) === lista)
  rec(eng, part, 'frase: el hueco de estado dice el valor elegido', /Fermentando/.test(await p.locator('#rl-phrase').innerText()))
  // Un hueco de la frase es un GMenu de radios
  await p.locator('#rl-phrase').getByRole('button', { name: /Agave/ }).click(); await settle(p)
  rec(eng, part, 'frase: el hueco abre un menú de radios con «cualquier agave» marcado', (await p.getByRole('menuitemradio', { name: 'cualquier agave' }).getAttribute('aria-checked')) === 'true')
  await p.getByRole('menuitemradio', { name: 'Espadín' }).click()
  await idle(p)
  rec(eng, part, 'frase: elegir «Espadín» filtra y se lee en la frase', /Espadín/.test(await p.locator('#rl-phrase').innerText()) && (await p.evaluate(() => window.__rlApp.rows.value.every((r) => r.agave === 'Espadín'))))
  await p.locator('.rl-facet[data-facet="fermentando"]').click(); await idle(p)
  await p.locator('#rl-phrase').getByRole('button', { name: /Agave/ }).click(); await settle(p)
  await p.getByRole('menuitemradio', { name: 'cualquier agave' }).click(); await idle(p)
  // Baja en el sitio desde el menú de fila
  const rm = await rowWith(p, ['vacia', 'limpieza', 'lista'])
  if (rm) {
    await openRowMenu(p, rm)
    const item = p.getByRole('menuitem', { name: /^Dar de baja/ }).first()
    if ((await item.getAttribute('aria-disabled')) !== 'true') {
      await pickMenu(p, 'Dar de baja'); await settle(p, 250)
      let a = await active(p)
      rec(eng, part, 'baja en la fila: la celda se parte en Cancelar | Dar de baja, foco en Cancelar', a && a.name === 'Cancelar' && a.inRow === rm, JSON.stringify(a))
      await p.keyboard.press('Enter'); await settle(p, 250)
      a = await active(p)
      rec(eng, part, 'baja en la fila: Cancelar devuelve el foco al botón de acciones', a && a.inRow === rm && a.tag === 'button' && /Acciones/.test(a.name), JSON.stringify(a))
    } else { await p.keyboard.press('Escape') }
  }
  // Selección: la barra aparece; baja múltiple en el sitio
  await p.locator('.rl-facet[data-facet="vacia"]').click(); await idle(p)
  await p.locator('.g-table__table tbody tr.g-table__row input[type="checkbox"]').nth(0).check()
  await p.locator('.g-table__table tbody tr.g-table__row input[type="checkbox"]').nth(1).check()
  await settle(p)
  rec(eng, part, 'selección: barra «2 seleccionadas» con nombre de grupo', await p.locator('.rl-bulk').count() === 1 && /2 seleccionadas/.test(await p.locator('.rl-bulk').getAttribute('aria-label')))
  await p.locator('.rl-bulk__remove').click(); await settle(p, 250)
  rec(eng, part, 'selección: confirmación en el sitio con el foco en Cancelar', (await active(p))?.name === 'Cancelar')
  await p.locator('.rl-bulk .rl-confirm__ok').click()
  const t2 = await toastWith(p, 'Deshacer'); await idle(p)
  rec(eng, part, 'selección: remove con dos claves y aviso con Deshacer', (await lastEvent(p, 'remove'))?.keys?.length === 2 && t2)
  // Crear: hoja lateral (GDialog placement end)
  await p.locator('#rl-create').click(); await p.locator('#rl-editor[open]').waitFor(); await settle(p, 250)
  rec(eng, part, 'crear: hoja lateral (placement end) con el foco en el primer campo', /placement-end/.test(await p.locator('#rl-editor').getAttribute('class')) && (await active(p))?.role === 'combobox')
  await p.keyboard.press('Escape'); await settle(p, 300)
  rec(eng, part, 'crear: Esc devuelve el foco al disparador', (await active(p))?.id === 'rl-create')
  rec(eng, part, 'sin errores de consola', p.__errs.length === 0, p.__errs.slice(0, 3).join(' | '))
  await p.__ctx.close()
}

async function runEstados (b, eng) {
  const part = 'estados'
  let p = await open(b, '?c=base&data=empty')
  rec(eng, part, 'vacío inicial: GEmpty «none» con «Registrar la primera tina»', await p.locator('.g-empty').count() === 1 && await p.locator('.g-empty').getByRole('button', { name: 'Registrar la primera tina' }).count() === 1)
  rec(eng, part, 'vacío inicial: la acción del vacío no es una segunda principal sólida', !/variant-solid/.test(await p.locator('.g-empty .g-btn').first().getAttribute('class')))
  await p.__ctx.close()
  p = await open(b, '?c=base&data=forbidden')
  rec(eng, part, 'sin acceso: GEmpty «forbidden» y sin tabla', await p.locator('.g-empty').count() === 1 && await p.locator('.g-table').count() === 0)
  await p.__ctx.close()
  p = await open(b, '?c=base&data=fail')
  rec(eng, part, 'fallo sin filas: GEmpty de error con Reintentar (de GTable)', await p.locator('.g-empty').count() === 1 && await p.locator('.g-empty').getByRole('button', { name: 'Reintentar' }).count() === 1)
  await p.locator('.g-empty').getByRole('button', { name: 'Reintentar' }).click(); await idle(p)
  rec(eng, part, 'fallo sin filas: reintentar carga las 10', (await rowKeys(p)).length === 10)
  await p.__ctx.close()
}

async function runMovil (b, eng) {
  const part = 'movil'
  const mobile = { vw: 390, vh: 844, hasTouch: true, isMobile: eng !== 'firefox' }
  for (const c of ['base', 'A', 'B', 'C']) {
    const p = await open(b, '?c=' + c, mobile)
    rec(eng, part, `${c}: GTable en tarjetas`, await p.locator('.g-table--mode-cards').count() === 1)
    rec(eng, part, `${c}: sin desplazamiento horizontal de la página`, !(await overflow(p)))
    rec(eng, part, `${c}: «Registrar tina» de solo icono con nombre`, (await p.locator('#rl-create').getAttribute('aria-label')) === 'Registrar tina')
    if (c === 'B') {
      const k = (await rowKeys(p))[1]
      await p.locator(`tr[data-rl-key="${k}"] .g-table__door`).click()
      await p.locator('#rl-lens-layer[open]').waitFor({ timeout: 4000 }).catch(() => {})
      await settle(p, 300)
      rec(eng, part, 'B: en el teléfono la lente es una capa a pantalla completa (GDialog)', await p.locator('#rl-lens-layer[open]').count() === 1)
      await p.locator('#rl-lens-layer').getByRole('button', { name: 'Volver a la lista' }).click(); await settle(p, 400)
      const a = await active(p)
      rec(eng, part, 'B: «Volver a la lista» devuelve el foco a la puerta de la tarjeta', a && a.inRow === k, JSON.stringify(a))
    }
    if (c === 'A') {
      await p.locator('#rl-create').click(); await settle(p, 300)
      const a = await active(p)
      rec(eng, part, 'A: crear abre la tarjeta borrador con el foco en su primer campo', a && a.inDetail && a.role === 'combobox', JSON.stringify(a))
      rec(eng, part, 'A: sin desplazamiento horizontal con el formulario abierto', !(await overflow(p)))
    }
    if (c === 'C') {
      const sizes = await p.evaluate(() => [...document.querySelectorAll('.rl-slot, .rl-facet')].map((e) => e.getBoundingClientRect()).map((r) => Math.min(r.width, r.height)))
      rec(eng, part, 'C: huecos de la frase y facetas ≥ 44px con puntero grueso', sizes.every((s) => s >= 43.5), JSON.stringify(sizes))
    }
    rec(eng, part, `${c}: sin errores de consola`, p.__errs.length === 0, p.__errs.slice(0, 3).join(' | '))
    await p.__ctx.close()
  }
}


// ---- Auditoría posterior medible (docs/documentacion/auditoria-visual.md §3): contraste, objetivos, alineación, jerarquía ----
const CONTRAST = () => {
  window.__rgb = (c) => { const cv = document.createElement('canvas'); cv.width = cv.height = 1; const x = cv.getContext('2d'); x.fillStyle = '#010203'; x.fillStyle = c; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3]] }
  window.__bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; if (window.__rgb(c)[3] > 250) return c } return getComputedStyle(document.body).backgroundColor }
  // Color con alfa: se compone sobre el fondo antes de medir (un borde rgba(0,0,0,.08) sobre blanco es ≈ 1,17:1, no 21:1)
  window.__over = (fg, bg) => { const f = window.__rgb(fg); const g = window.__rgb(bg); const a = f[3] / 255; return `rgb(${[0, 1, 2].map((i) => Math.round(f[i] * a + g[i] * (1 - a))).join(',')})` }
  window.__ratio = (a, b) => { a = window.__over(a, b) ; const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }; const [h, l] = [lum(window.__rgb(a)), lum(window.__rgb(b))].sort((x, y) => y - x); return Math.round(((h + 0.05) / (l + 0.05)) * 100) / 100 }
}
const textRatio = (p, sel) => p.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return null; return window.__ratio(getComputedStyle(e).color, window.__bgOf(e)) }, sel)
const borderRatio = (p, sel, side = 'Top') => p.evaluate(([sel, side]) => { const e = document.querySelector(sel); if (!e) return null; return window.__ratio(getComputedStyle(e)['border' + side + 'Color'], window.__bgOf(e.parentElement)) }, [sel, side])
// Área de pulsación: la caja, o la de su ::after si es mayor (GBtn agranda su diana a 44px con puntero grueso por ::after)
const minSide = (p, sel) => p.evaluate((sel) => [...document.querySelectorAll(sel)].filter((e) => e.getClientRects().length).map((e) => { const r = e.getBoundingClientRect(); const a = getComputedStyle(e, '::after'); const w = Math.max(r.width, parseFloat(a.width) || 0); const h = Math.max(r.height, parseFloat(a.height) || 0); return Math.round(Math.min(w, h) * 10) / 10 }), sel)
async function runAuditoria (b, eng) {
  const part = 'auditoria'
  const M = (name, ok, val) => rec(eng, part, name, ok, typeof val === 'string' ? val : JSON.stringify(val))
  for (const [vw, label] of [[1280, 'escritorio'], [390, 'teléfono']]) {
    const opts = vw < 500 ? { vw, vh: 844, hasTouch: true, isMobile: eng !== 'firefox' } : { vw }
    for (const c of ['base', 'A', 'B', 'C']) {
      const p = await open(b, '?c=' + c, opts)
      await p.evaluate(CONTRAST)
      const tag = `${label} ${c}`
      // Jerarquía: un h1; una sola acción principal sólida a la vista
      const solid = await p.evaluate(() => [...document.querySelectorAll('.g-btn--variant-solid.g-btn--color-brand')].filter((e) => e.getClientRects().length).length)
      M(`${tag}: una sola acción principal sólida a la vista`, solid === 1, solid)
      // Alineación: la consulta empieza en el mismo borde que la tabla
      const al = await p.evaluate(() => { const q = document.querySelector('.rl-query').getBoundingClientRect().left; const t = document.querySelector('.g-table').getBoundingClientRect().left; const r = document.createRange(); r.selectNodeContents(document.querySelector('h1')); const h = r.getBoundingClientRect().left; return { h1: Math.round(h), consulta: Math.round(q), tabla: Math.round(t) } })
      M(`${tag}: h1, consulta y tabla al mismo borde (Δ ≤ 1px)`, Math.abs(al.consulta - al.tabla) <= 1 && Math.abs(al.h1 - al.tabla) <= 1, al)
      // Cabecera: hueco entre la descripción y el zócalo de acciones (¿flota la acción?)
      const gap = await p.evaluate(() => { const d = document.querySelector('.g-page-header__desc, .g-page-header__description')?.getBoundingClientRect(); const a = document.querySelector('#rl-create')?.getBoundingClientRect(); return d && a ? Math.round(a.top - d.bottom) : null })
      M(`${tag}: hueco descripción → acción principal (medido; ver auditoría)`, true, gap)
      // Texto del block sobre su fondo
      const ph = await textRatio(p, '.g-page-header .g-page-header__desc, .g-page-header p')
      M(`${tag}: descripción de la cabecera ≥ 4,5:1`, ph >= 4.5, ph)
      if (c === 'C') {
        const s1 = await textRatio(p, '.rl-slot:not(.is-set)'); const s2 = await textRatio(p, '.rl-slot.is-set'); const pl = await textRatio(p, '.rl-phrase')
        M(`${tag}: frase (enlace de la consulta) ≥ 4,5:1`, s1 >= 4.5 && s2 >= 4.5 && pl >= 4.5, { libre: s1, puesto: s2, unión: pl })
        const fl = await textRatio(p, '.rl-facet__label'); const fn = await textRatio(p, '.rl-facet--warning .rl-facet__n'); const fb = await borderRatio(p, '.rl-facet')
        M(`${tag}: faceta: etiqueta y cifra ≥ 4,5:1`, fl >= 4.5 && fn >= 4.5, { etiqueta: fl, cifra: fn })
        M(`${tag}: faceta: borde frente a la página (delimitación; 1.4.11 no lo exige con texto)`, true, fb)
        await p.locator('.rl-facet[data-facet="vacia"]').click(); await idle(p)
        const pb = await borderRatio(p, '.rl-facet[aria-pressed="true"]'); const pl2 = await textRatio(p, '.rl-facet[aria-pressed="true"] .rl-facet__label')
        M(`${tag}: faceta pulsada: borde ≥ 3:1 y texto ≥ 4,5:1 (el estado no depende solo del relleno)`, pb >= 3 && pl2 >= 4.5, { borde: pb, texto: pl2 })
        const t = await minSide(p, '.rl-slot, .rl-facet')
        M(`${tag}: huecos y facetas ≥ ${vw < 500 ? 44 : 24}px`, t.every((x) => x >= (vw < 500 ? 43.5 : 23.5)), Math.min(...t))
        await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab'); await settle(p)
        await p.locator('.rl-slot').first().focus()
        const fo = await p.evaluate(() => { const s = getComputedStyle(document.activeElement); return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2 })
        M(`${tag}: foco visible en el hueco de la frase`, fo, fo)
      }
      if (c === 'B' && vw > 500) {
        await p.locator('tr.g-table__row .g-table__door').nth(1).click(); await settle(p, 300)
        const lb = await borderRatio(p, '.rl-lens'); const lt = await textRatio(p, '.rl-lens__title'); const pos = await textRatio(p, '.rl-lens__pos')
        M(`${tag}: lente: título ≥ 4,5:1 y posición ≥ 4,5:1`, lt >= 4.5 && pos >= 4.5, { título: lt, posición: pos })
        M(`${tag}: lente: borde frente a la página (medido)`, true, lb)
        const top = await p.evaluate(() => Math.round(document.querySelector('.rl-lens').getBoundingClientRect().top - document.querySelector('.rl-list').getBoundingClientRect().top))
        M(`${tag}: lente alineada con el inicio de la lista (Δ ≤ 1px)`, Math.abs(top) <= 1, top)
        const cur = await p.evaluate(() => { const td = document.querySelector('tr:has([aria-current]) > td'); return window.__ratio(getComputedStyle(td).backgroundColor, getComputedStyle(document.body).backgroundColor) })
        M(`${tag}: fila apuntada: fondo distinto de la página + lomo (medido)`, cur > 1, cur)
        const t = await minSide(p, '.rl-lens button')
        M(`${tag}: botones de la lente ≥ 24px`, t.every((x) => x >= 23.5), Math.min(...t))
      }
      if (c === 'A') {
        const k = await rowWith(p, ['vacia', 'limpieza'])
        await openRowMenu(p, k); await pickMenu(p, 'Dar de baja'); await settle(p, 300)
        const g = await textRatio(p, `tr[data-rl-key="${k}"] .g-table__subtitle`); const ob = await p.evaluate((k) => window.__ratio(getComputedStyle(document.querySelector(`tr[data-rl-key="${k}"]`)).outlineColor, window.__bgOf(document.querySelector(`tr[data-rl-key="${k}"]`))), k)
        M(`${tag}: huella: «Dada de baja» ≥ 4,5:1 y contorno ≥ 3:1`, g >= 4.5 && ob >= 3, { texto: g, contorno: ob })
        const t = await minSide(p, '.rl-undo')
        M(`${tag}: «Deshacer» ≥ ${vw < 500 ? 44 : 24}px`, t.every((x) => x >= (vw < 500 ? 43.5 : 23.5)), t)
      }
      if (c === 'base' && vw > 500) {
        const k = await rowWith(p, ['fermentando'])
        await openRowMenu(p, k)
        const why = await textRatio(p, '[role="menu"] .rl-mi__why')
        M(`${tag}: motivo de la acción no disponible ≥ 4,5:1`, why >= 4.5, why)
        await p.keyboard.press('Escape')
      }
      M(`${tag}: sin desplazamiento horizontal`, !(await overflow(p)), '')
      if (process.env.SHOTS) await p.screenshot({ path: fileURLToPath(new URL(`./capturas/${c}-${vw}.png`, import.meta.url)), fullPage: false }).catch(() => {})
      await p.__ctx.close()
    }
  }
}

const RUN = { auditoria: runAuditoria, base: runBase, A: runA, B: runB, C: runC, estados: runEstados, movil: runMovil }
for (const eng of ENGINES) {
  const b = await pw[eng].launch()
  for (const part of PARTS) {
    try { await RUN[part](b, eng) } catch (e) { rec(eng, part, 'sin excepción', false, String(e).split('\n')[0]) }
  }
  await b.close()
}
server.close()
const ok = R.filter((r) => r.ok).length
console.log(`\n${ok}/${R.length} comprobaciones` + ENGINES.map((e) => ` · ${e} ${R.filter((r) => r.eng === e && r.ok).length}/${R.filter((r) => r.eng === e).length}`).join(''))
process.exit(ok === R.length ? 0 : 1)
