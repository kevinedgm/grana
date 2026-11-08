// GCombobox · modo comando (combobox.md «Modo comando», #1056): superficie sin campo en la página y sin valor; open(),
// select y slot hints.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createSSRApp, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GCombobox from './GCombobox.vue'

const OPTS = [
  { value: '/components/btn#uso', label: 'Uso', description: 'GBtn › Uso · el botón de la librería' },
  { value: '/components/combobox#props', label: 'Props', description: 'GCombobox › Props · appearance y open' },
  { value: '/guide', label: 'Guía' }
]
const LABELS = { loading: 'Buscando…', noResults: 'Sin resultados para «{text}»', results: (n) => `${n} resultados` }
const mounted = []
let warn
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  while (mounted.length) mounted.pop().unmount()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})
const flush = async () => { for (let i = 0; i < 4; i++) await nextTick() }
async function mk(props = {}, slots = {}) {
  const w = mount(GCombobox, { props: { appearance: 'command', label: 'Buscar en la documentación', labels: LABELS, options: OPTS, delay: 0, ...props }, slots, attachTo: document.body })
  mounted.push(w)
  await flush()
  return w
}
const search = (w) => w.find('.g-combobox__search-field')
const rows = (w) => w.findAll('[role="option"]')
const warnings = () => warn.mock.calls.map((c) => String(c[0])).filter((t) => t.startsWith('[Grana GCombobox]'))
async function key(w, k, init = {}) {
  const ev = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init })
  search(w).element.dispatchEvent(ev)
  await flush()
  return ev
}
async function type(w, t) {
  const el = search(w).element
  el.value = t
  await search(w).trigger('input')
  await flush()
}

describe('GCombobox · appearance="command" (#1056)', () => {
  it('sin GInput, sin oculto y sin campo en la página: solo la superficie GDialog bare con aria-label', async () => {
    const w = await mk({ id: 'cmd' })
    const root = w.get('.g-combobox')
    expect(root.classes()).toEqual(expect.arrayContaining(['g-combobox', 'g-combobox--appearance-command']))
    expect(root.attributes('id')).toBe('cmd')
    expect(w.find('.g-input').exists()).toBe(false)
    expect(w.find('input[type="hidden"]').exists()).toBe(false)
    expect(w.find('.g-combobox__field').exists()).toBe(false)
    const d = w.get('dialog')
    expect(d.classes()).toEqual(expect.arrayContaining(['g-dialog', 'g-dialog--bare', 'g-combobox-surface', 'g-combobox-surface--command']))
    expect(d.attributes('aria-label')).toBe('Buscar en la documentación')
    expect(d.attributes('open')).toBeUndefined()
    expect(d.find('.g-dialog__close').exists()).toBe(false)
  })

  it('open() abre con el foco en la búsqueda; al reabrir, la última búsqueda seleccionada', async () => {
    const w = await mk()
    w.vm.open()
    await flush()
    expect(w.get('dialog').attributes('open')).toBeDefined()
    const s = search(w)
    expect(document.activeElement).toBe(s.element)
    expect(document.getElementById(s.attributes('aria-labelledby'))).toBe(w.get('dialog').element)
    await type(w, 'props')
    expect(rows(w).map((r) => r.text())).toEqual([expect.stringContaining('Props')])
    await key(w, 'Escape')
    w.get('dialog').element.close()
    await flush()
    expect(w.get('dialog').attributes('open')).toBeUndefined()
    const sel = vi.spyOn(HTMLInputElement.prototype, 'select')
    w.vm.open()
    await flush()
    expect(search(w).element.value).toBe('props')
    expect(sel).toHaveBeenCalled()
    w.vm.open() // abierta: no hace nada
    await flush()
    expect(w.emitted('open')).toHaveLength(2)
  })

  it('select { option, event } por Intro y por clic, sin update:* ni change, y cierre después', async () => {
    const w = await mk()
    w.vm.open()
    await flush()
    await type(w, 'uso')
    await key(w, 'ArrowDown')
    const ev = await key(w, 'Enter')
    const sel = w.emitted('select')
    expect(sel).toHaveLength(1)
    expect(sel[0][0].option.value).toBe('/components/btn#uso')
    expect(sel[0][0].event).toBe(ev)
    expect(w.get('dialog').attributes('open')).toBeUndefined()
    w.vm.open()
    await flush()
    const opt = rows(w)[0]
    opt.element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }))
    await flush()
    expect(w.emitted('select')).toHaveLength(2)
    expect(w.emitted('select')[1][0].event.type).toBe('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.emitted('update:custom')).toBeUndefined()
    expect(w.emitted('change')).toBeUndefined()
  })

  it('Tab no elige; con búsqueda pendiente Intro no elige la resaltada sola', async () => {
    const w = await mk({ filter: false, loading: false })
    w.vm.open()
    await flush()
    await key(w, 'Tab')
    expect(w.emitted('select')).toBeUndefined()
    await type(w, 'u')
    await w.setProps({ loading: true })
    await key(w, 'Enter')
    expect(w.emitted('select')).toBeUndefined()
  })

  it('slot hints solo en command, como pie tras la lista', async () => {
    const w = await mk({}, { hints: () => h('span', { class: 'mis-teclas' }, 'esc para cerrar') })
    w.vm.open()
    await flush()
    const hints = w.get('.g-combobox__hints')
    expect(hints.text()).toBe('esc para cerrar')
    expect(hints.attributes('aria-hidden')).toBeUndefined()
    const p = mount(GCombobox, { props: { appearance: 'palette', label: 'X', options: OPTS }, slots: { hints: () => 'h' }, attachTo: document.body })
    mounted.push(p)
    expect(p.find('.g-combobox__hints').exists()).toBe(false)
  })

  it('avisos 18 (sin label o con lo que no aplica) y 19 (open() fuera de command, no abre)', async () => {
    await mk({ label: undefined, name: 'q', clearable: true })
    expect(warnings().some((t) => t.includes('aviso 18'))).toBe(true)
    const f = mount(GCombobox, { props: { label: 'X', options: OPTS }, attachTo: document.body })
    mounted.push(f)
    f.vm.open()
    await flush()
    expect(warnings().some((t) => t.includes('aviso 19'))).toBe(true)
    expect(f.find('.g-combobox').classes()).not.toContain('is-open')
  })

  it('SSR: nada visible en el servidor (la superficie cerrada) y el cliente hidrata sin desajustes', async () => {
    const App = () => ({ render: () => h(GCombobox, { appearance: 'command', id: 'c', label: 'Buscar', options: OPTS }) })
    const html = await renderToString(createSSRApp(App()))
    expect(html).toContain('g-combobox--appearance-command')
    expect(html).not.toContain(' open')
    expect(html).not.toContain('g-input')
    const el = document.createElement('div')
    el.innerHTML = html
    document.body.append(el)
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    createSSRApp(App()).mount(el)
    await flush()
    const mismatch = [...warn.mock.calls, ...error.mock.calls].map((c) => String(c[0])).filter((t) => /hydration/i.test(t))
    expect(mismatch).toEqual([])
  })
})
