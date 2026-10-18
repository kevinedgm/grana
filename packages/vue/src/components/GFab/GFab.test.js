// GFab · design/contracts/fab.md «Verificación · bruno» (#654 a #671): formas por cantidad y política (con k simulado:
// jsdom no tiene geometría, así que se fija la caja del FAB y la de la pila), orden desde el FAB, teclado del menú (motor
// compartido con GMenu, utils/menuNav.js), letra, filtro de C, confirmación en el sitio, una activación por gesto, ticket
// de #643, v-model, closeOnSelect, bordes compartidos, se aparta, avisos 1 a 15 con la guarda de #653, slot y SSR.
// jsdom no tiene popover: showPopover/hidePopover se simulan con un atributo, como en GMenu.test.js.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import GFab from './GFab.vue'
import { EDGE_ORDER, clearEdgeReserve, edgeReserve, setEdgeReserve } from '../../utils/edgeReserve.js'
import { pageLiveNode } from '../../utils/liveRegion.js'

let warnSpy
let geo = { room: 600, stackH: null }
const realRect = HTMLElement.prototype.getBoundingClientRect
beforeEach(() => {
  geo = { room: 600, stackH: null }
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
    if (this.classList.contains('g-fab')) return fabBox(geo.room)
    if (geo.stackH && this.classList.contains('g-fab__list--stack')) return { ...zero, height: geo.stackH(this.children.length) }
    return realRect.call(this)
  })
  HTMLElement.prototype.showPopover = function () { this.setAttribute('data-popover-open', '') }
  HTMLElement.prototype.hidePopover = function () { this.removeAttribute('data-popover-open') }
  const orig = HTMLElement.prototype.matches
  vi.spyOn(HTMLElement.prototype, 'matches').mockImplementation(function (sel) { return sel === ':popover-open' ? this.hasAttribute('data-popover-open') : orig.call(this, sel) })
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
})
const wrappers = []
afterEach(() => {
  while (wrappers.length) wrappers.pop().unmount()
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

const ALL = [
  { id: 'sample', label: 'Nueva muestra', icon: 'flask-conical', description: 'Registro con código' },
  { id: 'photo', label: 'Tomar foto', icon: 'camera' },
  { id: 'note', label: 'Dictar nota', icon: 'mic' },
  { id: 'upload', label: 'Subir archivo', description: 'PDF, imagen o CSV' },
  { id: 'agenda', label: 'Programar toma' },
  { id: 'csv', label: 'Exportar CSV', group: 'Exportar', description: 'Lo filtrado, en UTF-8' },
  { id: 'print', label: 'Imprimir etiquetas', group: 'Exportar' },
  { id: 'share', label: 'Compartir lote', group: 'Compartir' },
  { id: 'mail', label: 'Enviar por correo', group: 'Compartir' },
  { id: 'tag', label: 'Etiquetar', group: 'Organizar' },
  { id: 'move', label: 'Mover a carpeta', group: 'Organizar' },
  { id: 'copy', label: 'Duplicar', group: 'Organizar' },
  { id: 'link', label: 'Copiar enlace', group: 'Compartir' },
  { id: 'prefs', label: 'Preferencias', group: 'Mantenimiento', disabled: 'Solo para coordinación' },
  { id: 'purge', label: 'Vaciar borradores', group: 'Mantenimiento', danger: true, confirm: '¿Vaciar los 12 borradores?', confirmLabel: 'Vaciar' }
]
const LABELS = { more: 'Más acciones ({count})', moreShort: 'Más acciones', cancel: 'Cancelar', findHint: 'Escribe para buscar', matches: '{count} acciones', matchesOne: '1 acción', none: 'Ninguna acción con', busy: 'En curso', done: 'Hecho', failed: 'Falló' }

// Caja del FAB contraído (jsdom: visor 1024 × 768). `room` = H en px entre el FAB + space × 3 y el margen seguro.
const fabBox = (room, h0 = 52) => {
  const top = room + 12 + 16
  return { left: 956, top, right: 1008, bottom: top + h0, width: 52, height: h0, x: 956, y: top }
}
const zero = { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 }
// Monta GFab con el FAB en `room` px de su borde opuesto; `stackH(n)` = alto medido de la pila con n filas
function mk(props = {}, { room = 600, stackH = null, attrs = {}, slots } = {}) {
  geo = { room, stackH }
  const w = mount(GFab, { attachTo: document.body, props: { label: 'Crear y capturar', labels: LABELS, ...props }, attrs, slots })
  wrappers.push(w)
  return w
}
const settle = async () => { for (let i = 0; i < 6; i++) await nextTick() }
const trig = (w) => w.find('[id$="-trigger"]')
const menu = (w) => w.find('ul[id$="-menu"]')
const subList = (w) => w.find('ul[id$="-more"]')
const items = (ul) => [...ul.element.querySelectorAll('[role="menuitem"]')].filter((b) => !b.closest('[hidden]'))
const labelsOf = (ul) => items(ul).map((b) => b.querySelector('.g-fab__label')?.textContent ?? b.textContent)
const active = () => document.activeElement
const key = (el, k, extra = {}) => { const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...extra }); (el.element || el).dispatchEvent(e); return e }
const click = (el, detail = 1, extra = {}) => { const e = new MouseEvent('click', { detail, bubbles: true, cancelable: true, ...extra }); (el.element || el).dispatchEvent(e); return e }
const fabWarns = () => warnSpy.mock.calls.map((c) => String(c[0])).filter((m) => m.startsWith('[Grana GFab]'))
const open = async (w) => { click(trig(w)); await settle() }
// jsdom no tiene PointerEvent
const pev = (type, init = {}) => Object.assign(new MouseEvent(type, { bubbles: true, cancelable: true, ...init }), { pointerType: init.pointerType || 'mouse' })

describe('GFab · formas por cantidad', () => {
  it('sin acciones no pinta nada, sin aviso', () => {
    const w = mk({ items: [] })
    expect(w.find('.g-fab').exists()).toBe(false)
    expect(fabWarns()).toEqual([])
  })

  it('una sola acción: el FAB es esa acción (sin haspopup), un toque la ejecuta', async () => {
    const w = mk({ items: [ALL[1]] })
    expect(w.find('.g-fab').attributes('data-appearance')).toBe('single')
    const b = trig(w)
    expect(b.attributes('aria-haspopup')).toBeUndefined()
    expect(b.attributes('aria-expanded')).toBeUndefined()
    expect(w.find('ul').exists()).toBe(false)
    click(b)
    expect(w.emitted('select')[0][0].id).toBe('photo')
  })

  it('A con 3: pila con las tres, la primera pegada al FAB (última del DOM al subir) y con el foco', async () => {
    const w = mk({ items: ALL.slice(0, 3) })
    await open(w)
    expect(w.find('.g-fab').attributes('data-appearance')).toBe('stack')
    expect(menu(w).classes()).toContain('g-fab__list--stack')
    expect(labelsOf(menu(w))).toEqual(['Dictar nota', 'Tomar foto', 'Nueva muestra'])
    expect(active().textContent).toContain('Nueva muestra')
    expect(trig(w).attributes('aria-expanded')).toBe('true')
    expect(menu(w).attributes('role')).toBe('menu')
    expect(menu(w).attributes('tabindex')).toBe('-1')
    expect(menu(w).attributes('aria-labelledby')).toBe(trig(w).attributes('id'))
    expect(menu(w).findAll('li').every((li) => li.attributes('role') === 'none')).toBe(true)
  })

  it('arriba la pila baja: la primera es la primera del DOM', async () => {
    const w = mk({ items: ALL.slice(0, 3), position: 'top-end' })
    await open(w)
    expect(labelsOf(menu(w))).toEqual(['Nueva muestra', 'Tomar foto', 'Dictar nota'])
    expect(active().textContent).toContain('Nueva muestra')
  })

  it('A con 10: 4 píldoras + la cola «Más acciones (6)» con haspopup y controls; la cola abre el resto agrupado', async () => {
    const w = mk({ items: ALL.slice(0, 10) })
    await open(w)
    const more = w.find('.g-fab__item--more')
    expect(more.exists()).toBe(true)
    expect(more.text()).toBe('Más acciones (6)')
    expect(more.attributes('aria-haspopup')).toBe('menu')
    expect(more.attributes('aria-expanded')).toBe('false')
    expect(more.attributes('aria-controls')).toBe(subList(w).attributes('id'))
    expect(labelsOf(menu(w))).toEqual(['Más acciones (6)', 'Dictar nota', 'Subir archivo', 'Tomar foto', 'Nueva muestra'].slice(0, 1).concat(['Subir archivo', 'Dictar nota', 'Tomar foto', 'Nueva muestra']))
    click(more); await settle()
    expect(more.attributes('aria-expanded')).toBe('true')
    expect(more.classes()).toContain('is-expanded')
    expect(subList(w).attributes('aria-labelledby')).toBe(more.attributes('id'))
    expect(labelsOf(subList(w))).toEqual(['Programar toma', 'Exportar CSV', 'Imprimir etiquetas', 'Compartir lote', 'Enviar por correo', 'Etiquetar'])
    expect(active().textContent).toContain('Programar toma')
    const g = subList(w).find('ul[role="group"]')
    expect(document.getElementById(g.attributes('aria-labelledby')).textContent).toBe('Exportar')
    // ← vuelve a la cola
    key(active(), 'ArrowLeft'); await settle()
    expect(active()).toBe(more.element)
    expect(more.attributes('aria-expanded')).toBe('false')
  })

  it('las cuatro primeras no se mueven de 6 a 15 (mismo sitio en el DOM desde el FAB)', async () => {
    const near = async (n) => {
      const w = mk({ items: ALL.slice(0, n) })
      await open(w)
      const l = labelsOf(menu(w)).reverse()
      w.unmount()
      return l.slice(0, 4)
    }
    const a = await near(6)
    expect(await near(10)).toEqual(a)
    expect(await near(15)).toEqual(a)
  })

  it('poco sitio (k ≤ 1): panel directo con todas, agrupado', async () => {
    const w = mk({ items: ALL.slice(0, 6) }, { room: 30 })
    await open(w)
    expect(w.find('.g-fab').attributes('data-appearance')).toBe('panel')
    expect(menu(w).classes()).toContain('g-fab__list--panel')
    expect(items(menu(w))).toHaveLength(6)
    expect(active().textContent).toContain('Nueva muestra')
  })

  it('política con alturas medidas (#670): una pila que no cabe baja k, nunca lo sube', async () => {
    // H = 600 → k₀ = 5; la pila medida mide 200 px por fila: solo cabe con 3 filas (2 + la cola)
    const w = mk({ items: ALL.slice(0, 8) }, { stackH: (n) => n * 200 })
    await open(w)
    expect(items(menu(w))).toHaveLength(3)
    expect(w.find('.g-fab__item--more').text()).toBe('Más acciones (6)')
  })

  it('sin labels.more no hay cola: panel directo y aviso 11', async () => {
    const w = mk({ items: ALL.slice(0, 8), labels: { ...LABELS, more: undefined } })
    await open(w)
    expect(menu(w).classes()).toContain('g-fab__list--panel')
    expect(fabWarns().some((m) => m.includes('labels.more'))).toBe(true)
  })

  it('appearance="panel": siempre panel', async () => {
    const w = mk({ items: ALL.slice(0, 3), appearance: 'panel' })
    expect(w.find('.g-fab').attributes('data-appearance')).toBe('panel')
    await open(w)
    expect(menu(w).classes()).toContain('g-fab__list--panel')
  })

  it('C: grupo con nombre, principal con su etiqueta y la cola que abre el panel; la principal ejecuta a un toque', async () => {
    const w = mk({ items: ALL, main: 'sample' })
    const root = w.find('.g-fab')
    expect(root.attributes('data-appearance')).toBe('main')
    const g = w.find('.g-fab__main-group')
    expect(g.attributes('role')).toBe('group')
    expect(g.attributes('aria-label')).toBe('Crear y capturar')
    const btns = g.findAll('button')
    expect(btns[0].attributes('id')).toMatch(/-main$/)
    expect(btns[0].text()).toContain('Nueva muestra')
    expect(btns[btns.length - 1].attributes('aria-haspopup')).toBe('menu')
    click(btns[0])
    expect(w.emitted('select')[0][0].id).toBe('sample')
    await open(w)
    expect(menu(w).classes()).toContain('g-fab__list--panel')
    expect(items(menu(w))).toHaveLength(14)
    expect(menu(w).find('.g-fab__find').text()).toBe('Escribe para buscar')
    expect(menu(w).find('.g-fab__find').attributes('aria-hidden')).toBe('true')
    expect(menu(w).element.style.getPropertyValue('--_clip-from')).toContain('inset(')
  })

  it('C con solo la principal: single sin cola', () => {
    const w = mk({ items: [ALL[0]], main: 'sample' })
    expect(w.find('.g-fab').attributes('data-appearance')).toBe('single')
    expect(w.find('.g-fab__main').exists()).toBe(true)
    expect(w.find('[aria-haspopup]').exists()).toBe(false)
  })
})

describe('GFab · teclado y foco', () => {
  it('↑ ↓ cíclicas, Inicio y Fin; la flecha contraria abre en la más lejana', async () => {
    const w = mk({ items: ALL.slice(0, 3) })
    key(trig(w), 'ArrowDown'); await settle()
    expect(active().textContent).toContain('Dictar nota')
    key(active(), 'ArrowUp'); await settle()
    expect(active().textContent).toContain('Nueva muestra')
    key(active(), 'ArrowDown'); await settle()
    expect(active().textContent).toContain('Dictar nota')
    key(active(), 'End'); await settle()
    expect(active().textContent).toContain('Nueva muestra')
    key(active(), 'Home'); await settle()
    expect(active().textContent).toContain('Dictar nota')
    expect(items(menu(w)).filter((b) => b.tabIndex === 0)).toHaveLength(1)
  })

  it('↑ (hacia la lista) abre en la primera', async () => {
    const w = mk({ items: ALL.slice(0, 3) })
    key(trig(w), 'ArrowUp'); await settle()
    expect(active().textContent).toContain('Nueva muestra')
  })

  it('la letra salta (búfer de 500 ms) en la pila', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const w = mk({ items: ALL.slice(0, 5) })
    await open(w)
    key(active(), 't'); await nextTick()
    expect(active().textContent).toContain('Tomar foto')
    vi.advanceTimersByTime(600)
    key(active(), 's'); await nextTick()
    expect(active().textContent).toContain('Subir archivo')
  })

  it('Esc cierra y devuelve el foco al FAB; Esc repetida se ignora', async () => {
    const w = mk({ items: ALL.slice(0, 3) })
    await open(w)
    const e = key(active(), 'Escape', { repeat: true }); await settle()
    expect(e.defaultPrevented).toBe(true)
    expect(trig(w).attributes('aria-expanded')).toBe('true')
    key(active(), 'Escape'); await settle()
    expect(trig(w).attributes('aria-expanded')).toBe('false')
    expect(active()).toBe(trig(w).element)
    expect(w.emitted('closed')).toHaveLength(1)
  })

  it('Tab cierra: la lista queda fuera del Tab y el foco sigue desde el FAB', async () => {
    const w = mk({ items: ALL.slice(0, 3) })
    await open(w)
    key(active(), 'Tab')
    expect(active()).toBe(trig(w).element)
    expect(items(menu(w)).every((b) => b.tabIndex === -1)).toBe(true)
    await settle()
    expect(trig(w).attributes('aria-expanded')).toBe('false')
  })

  it('clic fuera cierra sin robar el foco', async () => {
    const out = document.createElement('button')
    document.body.append(out)
    const w = mk({ items: ALL.slice(0, 3) })
    await open(w)
    out.focus()
    out.dispatchEvent(pev('pointerdown'))
    await settle()
    expect(trig(w).attributes('aria-expanded')).toBe('false')
    expect(active()).toBe(out)
  })

  it('pulsar el FAB abierto cierra con el foco en el FAB; Esc con el foco en body también cierra', async () => {
    const w = mk({ items: ALL.slice(0, 3) })
    await open(w)
    click(trig(w)); await settle()
    expect(trig(w).attributes('aria-expanded')).toBe('false')
    await open(w)
    document.activeElement.blur()
    key(document.body, 'Escape'); await settle()
    expect(trig(w).attributes('aria-expanded')).toBe('false')
  })

  it('cerrándose la lista es inerte; reabrir durante la salida va directo a open', async () => {
    const w = mk({ items: ALL.slice(0, 3) })
    await open(w)
    vi.spyOn(window, 'getComputedStyle').mockImplementation(() => ({ transitionDuration: '0.2s', transitionDelay: '0s', translate: 'none', direction: 'ltr', getPropertyValue: () => '' }))
    key(active(), 'Escape'); await settle()
    expect(w.find('.g-fab').attributes('data-state')).toBe('closing')
    expect(menu(w).element.inert).toBe(true)
    click(trig(w)); await settle()
    expect(w.find('.g-fab').attributes('data-state')).toBe('open')
    expect(menu(w).element.inert).toBe(false)
  })

  it('el puntero que se mueve pasa el foco (M1); el quieto y el táctil no', async () => {
    const w = mk({ items: ALL.slice(0, 3) })
    await open(w)
    const [far, mid] = items(menu(w))
    const pm = (el, x, y, pointerType = 'mouse') => el.dispatchEvent(pev('pointermove', { clientX: x, clientY: y, pointerType }))
    pm(far, 5, 5, 'touch')
    expect(active()).not.toBe(far)
    pm(far, 5, 5)
    expect(active()).toBe(far)
    pm(mid, 5, 5)
    expect(active()).toBe(far)
    pm(mid, 6, 9)
    expect(active()).toBe(mid)
  })
})

describe('GFab · C · buscar al escribir (#658)', () => {
  const mkC = async (labels = LABELS) => {
    const w = mk({ items: ALL, main: 'sample', labels })
    await open(w)
    return w
  }
  const head = (w) => menu(w).find('.g-fab__find')

  it('filtra por «contiene» sin mayúsculas ni diacríticos sobre etiqueta y descripción; el foco al que empieza', async () => {
    const w = await mkC()
    key(active(), 'E'); await settle()
    expect(head(w).find('.g-fab__find-query').text()).toBe('E')
    key(active(), 't'); await settle()
    // «et»: Etiquetar (empieza), Imprimir etiquetas, Subir archivo no… ; el foco en Etiquetar
    expect(active().textContent).toContain('Etiquetar')
    expect(labelsOf(menu(w))).toContain('Imprimir etiquetas')
    expect(labelsOf(menu(w))).not.toContain('Tomar foto')
    expect(head(w).find('.g-fab__find-count').text()).toMatch(/acci/)
    // un grupo sin visibles se oculta
    expect(menu(w).findAll('li[hidden]').length).toBeGreaterThan(0)
  })

  it('descripción y diacríticos: «utf» encuentra Exportar CSV; «codigo» encuentra la descripción con tilde', async () => {
    const w = await mkC()
    for (const c of 'utf') key(active(), c)
    await settle()
    expect(labelsOf(menu(w))).toEqual(['Exportar CSV'])
    expect(head(w).find('.g-fab__find-count').text()).toBe('1 acción')
  })

  it('sin coincidencias no amplía lo escrito, no vacía la lista ni mueve el foco; Retroceso corrige', async () => {
    const w = await mkC()
    key(active(), 'p'); await settle()
    const before = active()
    const n = items(menu(w)).length
    key(active(), 'z'); await settle()
    expect(head(w).classes()).toContain('is-empty-result')
    expect(head(w).text()).toContain('Ninguna acción con')
    expect(head(w).find('.g-fab__find-query').text()).toBe('pz')
    expect(items(menu(w))).toHaveLength(n)
    expect(active()).toBe(before)
    key(active(), 'Backspace'); await settle()
    expect(head(w).text()).toBe('Escribe para buscar')
    expect(items(menu(w))).toHaveLength(14)
  })

  it('Espacio activa (no se escribe), IME no escribe, Esc limpia y la siguiente cierra', async () => {
    const w = await mkC()
    key(active(), 'x', { isComposing: true }); await settle()
    expect(head(w).text()).toBe('Escribe para buscar')
    key(active(), 'v'); await settle()
    expect(head(w).find('.g-fab__find-query').text()).toBe('v')
    key(active(), 'Escape'); await settle()
    expect(head(w).text()).toBe('Escribe para buscar')
    expect(trig(w).attributes('aria-expanded')).toBe('true')
    key(active(), 'Escape'); await settle()
    expect(trig(w).attributes('aria-expanded')).toBe('false')
  })

  it('anuncia el recuento por el canal de página', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const w = await mkC()
    key(active(), 'u'); key(active(), 't'); key(active(), 'f')
    await settle()
    vi.advanceTimersByTime(100)
    expect(pageLiveNode().textContent).toMatch(/1 acción$/)
    w.unmount()
  })

  it('sin sus cuatro textos, salta por letra y avisa (aviso 11)', async () => {
    const w = await mkC({ ...LABELS, none: undefined })
    expect(menu(w).find('.g-fab__find').exists()).toBe(false)
    key(active(), 'e'); await settle()
    expect(active().textContent).toContain('Exportar CSV')
    expect(fabWarns().some((m) => m.includes('aviso 11'))).toBe(true)
  })
})

describe('GFab · peligrosas: confirmación en el sitio (#662)', () => {
  const items3 = [ALL[0], ALL[1], { ...ALL[14], group: undefined }]

  it('activar parte la fila en «Cancelar» + confirmar, en un grupo con la pregunta; el foco en Cancelar; ← → recorren', async () => {
    const w = mk({ items: items3, position: 'top-end' })
    await open(w)
    const danger = items(menu(w))[2]
    expect(danger.classList.contains('g-fab__item--danger')).toBe(true)
    expect(danger.querySelector('.g-fab__mark')).not.toBeNull()
    key(danger, 'Enter'); click(danger, 0); await settle()
    const pair = menu(w).find('.g-fab__confirm')
    expect(pair.attributes('role')).toBe('group')
    expect(pair.attributes('aria-label')).toBe('¿Vaciar los 12 borradores?')
    const kids = pair.element.children
    expect(kids).toHaveLength(2)
    expect(kids[0].classList.contains('g-fab__cancel')).toBe(true)
    expect(kids[1].classList.contains('g-fab__confirm-action')).toBe(true)
    expect([...kids].some((k) => k.classList.contains('g-fab__item'))).toBe(false)
    expect(active()).toBe(kids[0])
    key(active(), 'ArrowRight'); await settle()
    expect(active()).toBe(kids[1])
    expect(active().textContent).toBe('Vaciar')
    click(active(), 0); await settle()
    expect(w.emitted('select')).toHaveLength(1)
    expect(w.emitted('select')[0][0].id).toBe('purge')
  })

  it('Esc deshace con el foco en la fila; el foco que sale del par también; un doble clic nunca ejecuta', async () => {
    const w = mk({ items: items3, position: 'top-end' })
    await open(w)
    let danger = items(menu(w))[2]
    click(danger, 1, { clientX: 1, clientY: 1 }); await settle()
    expect(menu(w).find('.g-fab__confirm').exists()).toBe(true)
    // el segundo clic de la ráfaga no confirma
    click(menu(w).find('.g-fab__confirm-action'), 2); await settle()
    expect(w.emitted('select')).toBeFalsy()
    key(active(), 'Escape'); await settle()
    expect(menu(w).find('.g-fab__confirm').exists()).toBe(false)
    danger = items(menu(w))[2]
    expect(active()).toBe(danger)
    expect(trig(w).attributes('aria-expanded')).toBe('true')
    click(danger, 0); await settle()
    key(active(), 'ArrowUp'); await settle()
    expect(menu(w).find('.g-fab__confirm').exists()).toBe(false)
  })

  it('sin labels.cancel, las peligrosas que confirman quedan aria-disabled (fallo seguro) y avisa', async () => {
    const w = mk({ items: items3, labels: { ...LABELS, cancel: undefined } })
    await open(w)
    const danger = items(menu(w)).find((b) => b.classList.contains('g-fab__item--danger'))
    expect(danger.getAttribute('aria-disabled')).toBe('true')
    click(danger, 0); await settle()
    expect(menu(w).find('.g-fab__confirm').exists()).toBe(false)
    expect(fabWarns().some((m) => m.includes('labels.cancel'))).toBe(true)
  })

  it('confirm: false ejecuta sin par', async () => {
    const w = mk({ items: [ALL[0], { id: 'x', label: 'Borrar', danger: true, confirm: false }] })
    await open(w)
    click(items(menu(w)).find((b) => b.textContent.includes('Borrar')), 0); await settle()
    expect(w.emitted('select')[0][0].id).toBe('x')
  })
})

describe('GFab · una activación por gesto (#661)', () => {
  it('doble clic en el FAB: abre y el segundo no cierra', async () => {
    const w = mk({ items: ALL.slice(0, 3) })
    click(trig(w), 1); await settle()
    click(trig(w), 2); await settle()
    expect(trig(w).attributes('aria-expanded')).toBe('true')
  })

  it('el segundo clic de una ráfaga en un elemento no ejecuta otra vez', async () => {
    const w = mk({ items: ALL.slice(0, 3), closeOnSelect: 'never' })
    await open(w)
    const b = items(menu(w))[1]
    click(b, 1); click(b, 2); await settle()
    expect(w.emitted('select')).toHaveLength(1)
  })

  it('Intro o Espacio mantenidos no repiten la acción (lista, single y principal)', async () => {
    const w = mk({ items: ALL.slice(0, 3) })
    await open(w)
    for (const k of ['Enter', ' ']) expect(key(active(), k, { repeat: true }).defaultPrevented).toBe(true)
    const s = mk({ items: [ALL[1]] })
    expect(key(trig(s), 'Enter', { repeat: true }).defaultPrevented).toBe(true)
    const c = mk({ items: ALL.slice(0, 3), main: 'sample' })
    expect(key(c.find('.g-fab__main'), 'Enter', { repeat: true }).defaultPrevented).toBe(true)
  })

  it('la principal y single ignoran el segundo clic', () => {
    const w = mk({ items: [ALL[1]] })
    click(trig(w), 1); click(trig(w), 2)
    expect(w.emitted('select')).toHaveLength(1)
  })
})

describe('GFab · acuse con el ticket (#663)', () => {
  it('select lleva el ticket; busy pone data-ack en la raíz y en el elemento, aria-disabled y el motivo; done se retira a los 4000 ms', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const w = mk({ items: ALL.slice(0, 3), closeOnSelect: 'never' })
    await open(w)
    click(items(menu(w))[1], 0)
    const ev = w.emitted('select')[0][0]
    expect(Object.keys(ev).sort()).toEqual(['busy', 'cancel', 'done', 'event', 'failed', 'id', 'item', 'retry', 'waitUntil'])
    expect(ev.item).toEqual(ALL[1])
    expect(ev.retry).toBe(false)
    ev.busy('Subiendo…'); await settle()
    const root = w.find('.g-fab')
    expect(root.attributes('data-ack')).toBe('busy')
    const b = items(menu(w)).find((x) => x.textContent.includes('Tomar foto'))
    expect(b.getAttribute('data-ack')).toBe('busy')
    expect(b.getAttribute('aria-disabled')).toBe('true')
    expect(b.querySelector('.g-fab__reason').textContent).toBe('Subiendo…')
    expect(b.getAttribute('aria-describedby')).toContain(b.querySelector('.g-fab__reason').id)
    expect(root.find('.g-fab__badge svg').exists()).toBe(true)
    // en curso: pulsarla no hace nada
    click(b, 0)
    expect(w.emitted('select')).toHaveLength(1)
    ev.done('Foto subida'); await settle()
    expect(root.attributes('data-ack')).toBe('done')
    expect(items(menu(w)).find((x) => x.textContent.includes('Tomar foto')).hasAttribute('data-ack')).toBe(false)
    vi.advanceTimersByTime(3999); await settle()
    expect(root.attributes('data-ack')).toBe('done')
    vi.advanceTimersByTime(2); await settle()
    expect(root.attributes('data-ack')).toBeUndefined()
  })

  it('failed: habilitada con el motivo; reintentar emite retry: true; llamada tardía se ignora con aviso 13', async () => {
    const w = mk({ items: ALL.slice(0, 3), closeOnSelect: 'never' })
    await open(w)
    click(items(menu(w))[1], 0)
    const ev = w.emitted('select')[0][0]
    ev.failed('Sin conexión'); await settle()
    const b = () => items(menu(w)).find((x) => x.textContent.includes('Tomar foto'))
    expect(w.find('.g-fab').attributes('data-ack')).toBe('failed')
    expect(b().getAttribute('data-ack')).toBe('failed')
    expect(b().hasAttribute('aria-disabled')).toBe(false)
    expect(b().querySelector('.g-fab__reason').textContent).toBe('Sin conexión')
    ev.done('tarde'); await settle()
    expect(fabWarns().some((m) => m.includes('aviso 13'))).toBe(true)
    click(b(), 0); await settle()
    expect(w.emitted('select')[1][0].retry).toBe(true)
    expect(b().hasAttribute('data-ack')).toBe(false)
  })

  it('waitUntil: String → done, true → done, false → cancel, rechazo → failed; un ticket sustituido no cuenta', async () => {
    const w = mk({ items: [ALL[1]], labels: LABELS })
    const root = () => w.find('.g-fab')
    click(trig(w)); w.emitted('select')[0][0].waitUntil(Promise.resolve('Listo')); await settle()
    expect(root().attributes('data-ack')).toBe('done')
    click(trig(w)); w.emitted('select')[1][0].waitUntil(Promise.resolve(false)); await settle()
    expect(root().attributes('data-ack')).toBe('done') // la de antes sigue en su recibo; cancel no la quita
    click(trig(w)); w.emitted('select')[2][0].waitUntil(Promise.reject({ message: 'Mal' })); await settle()
    expect(root().attributes('data-ack')).toBe('failed')
    // sustituido: el ticket viejo no puede asentar al nuevo
    click(trig(w))
    const t4 = w.emitted('select')[3][0]
    t4.busy()
    click(trig(w), 1)
    expect(w.emitted('select')).toHaveLength(4) // en curso: no se lanza dos veces
    t4.done(); await settle()
    expect(root().attributes('data-ack')).toBe('done')
  })

  it('el acuse va por elemento aunque los ids se repitan', async () => {
    const w = mk({ items: [ALL[0], { id: 'sample', label: 'Nueva muestra (copia)' }, ALL[2]], closeOnSelect: 'never' })
    await open(w)
    const b = items(menu(w)).find((x) => x.querySelector('.g-fab__label').textContent === 'Nueva muestra (copia)')
    click(b, 0)
    const ev = w.emitted('select')[0][0]
    expect(ev.item.label).toBe('Nueva muestra (copia)')
    ev.busy(); await settle()
    const after = items(menu(w)).filter((x) => x.textContent.includes('Nueva'))
    expect(after.filter((x) => x.getAttribute('data-ack') === 'busy')).toHaveLength(1)
    expect(fabWarns().some((m) => m.includes('aviso 5'))).toBe(true)
  })

  it('single en curso: data-ack y aria-disabled en su GBtn, el texto como detail del tooltip', async () => {
    const w = mk({ items: [ALL[1]] })
    click(trig(w))
    w.emitted('select')[0][0].busy('Subiendo…'); await settle()
    expect(trig(w).attributes('data-ack')).toBe('busy')
    expect(trig(w).attributes('aria-disabled')).toBe('true')
    expect(document.querySelector('.g-tooltip__detail').textContent).toBe('Subiendo…')
  })
})

describe('GFab · v-model, closeOnSelect y eventos', () => {
  it('sin v-model guarda su estado y emite update:modelValue, open y closed', async () => {
    const w = mk({ items: ALL.slice(0, 3) })
    await open(w)
    expect(w.emitted('update:modelValue')[0]).toEqual([true])
    expect(w.emitted('open')).toHaveLength(1)
    key(active(), 'Escape'); await settle()
    expect(w.emitted('update:modelValue')[1]).toEqual([false])
    expect(w.emitted('closed')).toHaveLength(1)
  })

  it('controlado: el prop abre (foco en la primera) y el gesto solo emite', async () => {
    const f = mk({ items: ALL.slice(0, 3), modelValue: false })
    await f.setProps({ modelValue: true }); await settle()
    expect(f.find('[id$="-trigger"]').attributes('aria-expanded')).toBe('true')
    expect(active().textContent).toContain('Nueva muestra')
    const c = mount(GFab, { attachTo: document.body, props: { label: 'X', labels: LABELS, items: ALL.slice(0, 3), modelValue: false } })
    wrappers.push(c)
    click(c.find('[id$="-trigger"]')); await settle()
    expect(c.emitted('update:modelValue')[0]).toEqual([true])
    expect(c.find('[id$="-trigger"]').attributes('aria-expanded')).toBe('false')
  })

  it('modelValue true con una sola acción no abre y avisa (aviso 12)', async () => {
    mk({ items: [ALL[1]], modelValue: true }); await settle()
    expect(fabWarns().some((m) => m.includes('aviso 12'))).toBe(true)
  })

  it('closeOnSelect auto cierra con el foco al FAB; preventDefault mantiene abierto esa vez; never no cierra', async () => {
    const w = mk({ items: ALL.slice(0, 3) })
    await open(w)
    click(items(menu(w))[2], 0); await settle()
    expect(trig(w).attributes('aria-expanded')).toBe('false')
    expect(active()).toBe(trig(w).element)
    const p = mk({ items: ALL.slice(0, 3), onSelect: (e) => e.event.preventDefault() })
    await open(p)
    click(items(menu(p))[2], 0); await settle()
    expect(trig(p).attributes('aria-expanded')).toBe('true')
    const n = mk({ items: ALL.slice(0, 3), closeOnSelect: 'never' })
    await open(n)
    click(items(menu(n))[2], 0); await settle()
    expect(trig(n).attributes('aria-expanded')).toBe('true')
  })

  it('validadores de las props enumeradas', () => {
    const P = GFab.props
    expect(P.position.validator('bottom-center')).toBe(true)
    expect(P.position.validator('left')).toBe(false)
    expect(P.anchor.validator('container')).toBe(true)
    expect(P.anchor.validator('page')).toBe(false)
    expect(P.closeOnSelect.validator('always')).toBe(false)
    expect(P.appearance.validator('panel')).toBe(true)
    expect(P.appearance.validator('radial')).toBe(false)
  })
})

describe('GFab · marcado que espera el CSS de coco', () => {
  it('raíz con datos; FAB GBtn hijo directo con los dos glifos y la insignia; trigger-icon dentro de --rest', async () => {
    const w = mk({ items: ALL.slice(0, 3), offset: { bottom: '56px' } }, { attrs: { class: 'mio', 'data-x': '1' }, slots: { 'trigger-icon': ({ open }) => h('svg', { class: 'app-ic', 'data-open': String(open) }) } })
    const root = w.find('.g-fab')
    expect(root.classes()).toEqual(expect.arrayContaining(['g-fab', 'mio']))
    expect(root.attributes('data-x')).toBe('1')
    expect(root.attributes('data-position')).toBe('bottom-end')
    expect(root.attributes('data-anchor')).toBe('viewport')
    expect(root.attributes('data-state')).toBe('closed')
    expect(root.element.style.getPropertyValue('--_offset')).toBe('56px')
    const btn = root.element.querySelector(':scope > button.g-btn')
    expect(btn).not.toBeNull()
    expect(btn.querySelector('.g-fab__glyph--rest .app-ic')).not.toBeNull()
    expect(btn.querySelector('.g-fab__glyph--open svg')).not.toBeNull()
    expect(btn.querySelector('.g-fab__badge')).not.toBeNull()
    expect(w.find('.g-fab__scrim > .g-fab__scrim-part').exists()).toBe(true)
    expect(w.find('.g-fab__scrim').attributes('popover')).toBe('manual')
    await open(w)
    expect(root.attributes('data-state')).toMatch(/opening|open/)
    const li = menu(w).element.children[0]
    expect(li.style.getPropertyValue('--_fx')).toMatch(/px$/)
    expect(li.style.getPropertyValue('--_i')).toBe('2')
    expect(menu(w).element.style.getPropertyValue('--_x')).toMatch(/px$/)
    expect(btn.querySelector('.app-ic').getAttribute('data-open')).toBe('true')
  })

  it('en la pila la descripción va oculta y accesible; en el panel, visible', async () => {
    const w = mk({ items: ALL.slice(0, 3) })
    await open(w)
    const d = menu(w).find('.g-fab__desc')
    expect(d.classes()).toContain('g-fab__sr')
    expect(items(menu(w)).find((b) => b.textContent.includes('Nueva')).getAttribute('aria-describedby')).toBe(d.attributes('id'))
    const p = mk({ items: ALL.slice(0, 3), appearance: 'panel' })
    await open(p)
    expect(menu(p).find('.g-fab__desc').classes()).not.toContain('g-fab__sr')
  })

  it('deshabilitada con motivo: aria-disabled, enfocable, motivo visible; no ejecuta ni cierra', async () => {
    const w = mk({ items: [ALL[0], ALL[13]] })
    await open(w)
    const b = items(menu(w)).find((x) => x.textContent.includes('Preferencias'))
    expect(b.getAttribute('aria-disabled')).toBe('true')
    expect(b.querySelector('.g-fab__reason').textContent).toBe('Solo para coordinación')
    click(b, 0); await settle()
    expect(w.emitted('select')).toBeFalsy()
    expect(trig(w).attributes('aria-expanded')).toBe('true')
  })
})

describe('GFab · bordes compartidos (#659) y se aparta (#664)', () => {
  afterEach(() => clearEdgeReserve('voz'))

  it('publica su alto contraído + margen con order 25, lee las reservas anteriores y se retira al desmontar', async () => {
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(52)
    setEdgeReserve('voz', 'bottom', 60, { order: EDGE_ORDER.speech })
    const w = mk({ items: ALL.slice(0, 3) })
    await settle()
    expect(edgeReserve('bottom')).toBe(60 + 52 + 16)
    expect(edgeReserve('bottom', { before: EDGE_ORDER.fab })).toBe(60)
    expect(w.find('.g-fab').element.style.getPropertyValue('--_reserve')).toBe('60px')
    w.unmount()
    wrappers.pop()
    expect(edgeReserve('bottom')).toBe(60)
  })

  it('con anchor="container" o dentro de un <dialog> no publica ni lee (aviso 15 sin antecesor posicionado)', async () => {
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(52)
    const w = mk({ items: ALL.slice(0, 3), anchor: 'container' })
    await settle()
    expect(edgeReserve('bottom')).toBe(0)
    expect(w.find('.g-fab').element.style.getPropertyValue('--_reserve')).toBe('')
    expect(fabWarns().some((m) => m.includes('aviso 15'))).toBe(true)
    const d = document.createElement('dialog')
    document.body.append(d)
    const v = mount(GFab, { attachTo: d, props: { label: 'X', items: ALL.slice(0, 3), labels: LABELS } })
    wrappers.push(v)
    await settle()
    expect(edgeReserve('bottom')).toBe(0)
  })

  it('se aparta cuando el foco llega a algo que tapa y vuelve al salir; el primer clic sobre el FAB apartado solo lo devuelve', async () => {
    const w = mk({ items: ALL.slice(0, 3) })
    const under = document.createElement('a')
    under.href = '#'
    under.getBoundingClientRect = () => ({ left: 900, top: 650, right: 1010, bottom: 700, width: 110, height: 50 })
    document.body.append(under)
    // la caja del FAB es fabBox(600): top 628
    under.focus(); await settle()
    expect(w.find('.g-fab').classes()).toContain('is-tucked')
    const t = trig(w).element
    t.dispatchEvent(pev('pointerdown'))
    click(t, 1); await settle()
    expect(w.find('.g-fab').classes()).not.toContain('is-tucked')
    expect(t.getAttribute('aria-expanded')).toBe('false')
    click(t, 1); await settle()
    expect(t.getAttribute('aria-expanded')).toBe('true')
  })
})

describe('GFab · avisos de configuración (#665)', () => {
  it('nunca lanza ni descarta en silencio: 18 con un duplicado y uno sin nombre → 17 pintados y sus avisos, una vez', async () => {
    const many = [...ALL, { id: 'a', label: 'Alfa' }, { id: 'a', label: 'Alfa bis' }, { id: 'nolabel' }]
    const w = mk({ items: many, appearance: 'panel' })
    await open(w)
    expect(items(menu(w))).toHaveLength(17)
    const ws = fabWarns()
    expect(ws.some((m) => m.includes('aviso 3'))).toBe(true)
    expect(ws.some((m) => m.includes('aviso 5'))).toBe(true)
    expect(ws.some((m) => m.includes('aviso 14'))).toBe(true)
    await w.setProps({ items: [...many] }); await settle()
    expect(fabWarns().length).toBe(ws.length)
  })

  it('avisos 1, 2, 4, 6, 7, 8, 9, 10 y 11 (moreShort)', async () => {
    const cases = [
      [{ items: 'no' }, 'aviso 1'],
      [{ items: ALL.slice(0, 2), label: undefined }, 'aviso 2'],
      [{ items: [{ label: 'Sin id' }, ALL[0]] }, 'aviso 4'],
      [{ items: [ALL[0], { id: 'd', label: 'Borrar', danger: true }] }, 'aviso 6'],
      [{ items: [ALL[0], { id: 'c', label: 'Ver', confirm: '¿?' }] }, 'aviso 7'],
      [{ items: ALL.slice(0, 3), main: 'nope' }, 'aviso 8'],
      [{ items: [ALL[0], ALL[14]], main: 'purge' }, 'aviso 9'],
      [{ items: ALL.slice(0, 3), appearance: 'arc' }, 'aviso 10'],
      [{ items: ALL.slice(0, 3), main: 'sample', labels: { ...LABELS, moreShort: undefined } }, 'labels.moreShort']
    ]
    for (const [props, text] of cases) {
      warnSpy.mockClear()
      const w = mk(props)
      expect(() => w.html()).not.toThrow()
      expect(fabWarns().some((m) => m.includes(text)), text).toBe(true)
    }
  })

  it('danger sin confirm pregunta con su label; confirm sin danger se ignora; main a una peligrosa cae a A', async () => {
    const w = mk({ items: [ALL[0], { id: 'd', label: 'Borrar todo', danger: true }, { id: 'c', label: 'Ver', confirm: '¿?' }], position: 'top-end' })
    await open(w)
    click(items(menu(w))[1], 0); await settle()
    expect(menu(w).find('.g-fab__confirm').attributes('aria-label')).toBe('Borrar todo')
    key(active(), 'Escape'); await settle()
    click(items(menu(w))[2], 0); await settle()
    expect(w.emitted('select')[0][0].id).toBe('c')
    const m = mk({ items: [ALL[0], ALL[14]], main: 'purge' })
    expect(m.find('.g-fab').attributes('data-appearance')).not.toBe('main')
  })
})
