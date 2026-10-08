import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick, ref } from 'vue'
import GTag from './GTag.vue'
import { categoryOf } from '../../utils/categoryHash.js'
import { stubPopover, resetEngine, ariaOf } from '../../utils/visualTipTestEnv.js'

// Contrato: design/contracts/tag.md (lima, #460 a #473; #505 en api.md). Las medidas (alto 32/24, tapa del alto, área de
// 44px), la vista previa tachada, el recorte con pista y el árbol de accesibilidad real se comprueban con Playwright en los
// tres motores (design/lab/theme-playground/tests/tag.spec.mjs y personalidad-tag.spec.mjs).

const wrappers = []
beforeEach(() => { stubPopover(); resetEngine() })
afterEach(() => {
  vi.restoreAllMocks()
  while (wrappers.length) wrappers.pop().unmount()
  document.body.innerHTML = ''
})
const mk = (props = {}, opts = {}) => {
  const w = mount(GTag, { props, attachTo: document.body, ...opts })
  wrappers.push(w)
  return w
}
const fresh = async () => { vi.resetModules(); return (await import('./GTag.vue')).default }
const spyWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {})
const grana = (s) => s.mock.calls.map((c) => String(c[0])).filter((m) => m.startsWith('[Grana GTag]'))
const L = { remove: 'Quitar {label}' }

describe('GTag · semántica por caso (tag.md §«Semántica», #464)', () => {
  it('estática: <span class="g-tag__body"> sin rol ni tabindex; texto con dir="auto"', () => {
    const w = mk({ label: 'Penicilina' })
    const r = w.find('.g-tag')
    expect(r.element.tagName).toBe('SPAN')
    expect(r.classes()).toEqual(['g-tag', 'g-tag--size-md'])
    const b = w.find('.g-tag__body')
    expect(b.element.tagName).toBe('SPAN')
    expect(b.attributes('role')).toBeUndefined()
    expect(b.attributes('tabindex')).toBeUndefined()
    expect(w.find('.g-tag__text').attributes('dir')).toBe('auto')
    expect(w.find('.g-tag__text').text()).toBe('Penicilina')
    expect(w.find('a, button, [tabindex]').exists()).toBe(false)
  })
  it('enlace: <a class="g-tag__body" href> e is-link', () => {
    const w = mk({ label: 'Vue', href: '#temas-vue' })
    const a = w.find('a.g-tag__body')
    expect(a.attributes('href')).toBe('#temas-vue')
    expect(w.find('.g-tag').classes()).toContain('is-link')
    expect(a.attributes('role')).toBeUndefined()
  })
  it('enlace deshabilitado: role="link" aria-disabled="true" SIN href (fuera del orden de Tab)', () => {
    const w = mk({ label: 'Vue', href: '#temas-vue', disabled: true })
    const a = w.find('a.g-tag__body')
    expect(a.attributes('href')).toBeUndefined()
    expect(a.attributes('role')).toBe('link')
    expect(a.attributes('aria-disabled')).toBe('true')
    expect(w.find('.g-tag').classes()).toEqual(expect.arrayContaining(['is-link', 'is-disabled']))
  })
  it('alternar: <button type="button" aria-pressed> con la marca check decorativa siempre en el DOM', () => {
    const w = mk({ label: 'Solo pendientes', pressed: false })
    const b = w.find('button.g-tag__body')
    expect(b.attributes('type')).toBe('button')
    expect(b.attributes('aria-pressed')).toBe('false')
    const check = w.find('.g-tag__check')
    expect(check.attributes('aria-hidden')).toBe('true')
    expect(check.find('svg').exists()).toBe(true)
    expect(w.find('.g-tag').classes()).toContain('is-toggle')
    expect(w.find('.g-tag').classes()).not.toContain('is-pressed')
  })
  it('quitable: «Quitar» es un <button> HERMANO del cuerpo, con aria-keyshortcuts y nombre en texto oculto', () => {
    const w = mk({ label: 'Penicilina', removable: true, labels: L })
    const x = w.find('button.g-tag__remove')
    expect(x.element.parentElement).toBe(w.find('.g-tag').element)
    expect(x.attributes('type')).toBe('button')
    expect(x.attributes('aria-keyshortcuts')).toBe('Delete Backspace')
    expect(x.find('.g-tag__sr').text()).toBe('Quitar Penicilina')
    expect(x.attributes('aria-label')).toBeUndefined()
    expect(x.attributes('title')).toBeUndefined()
    expect(x.find('svg').exists()).toBe(true)
    expect(w.find('.g-tag').classes()).toContain('is-removable')
  })
  it('enlace quitable: el <a> y «Quitar» son hermanos (nunca anidados)', () => {
    const w = mk({ label: 'Vue', href: '#vue', removable: true, labels: L })
    expect(w.find('a .g-tag__remove').exists()).toBe(false)
    expect(w.find('a.g-tag__body').element.nextElementSibling.classList.contains('g-tag__remove')).toBe(true)
  })
  it('labels.remove como función recibe { label }', () => {
    const w = mk({ label: 'Látex', removable: true, labels: { remove: ({ label }) => `Fuera ${label}` } })
    expect(w.find('.g-tag__sr').text()).toBe('Fuera Látex')
  })
  it('una GTag suelta no tiene huella ni «Deshacer»', async () => {
    const w = mk({ label: 'Látex', removable: true, labels: L })
    await w.find('.g-tag__remove').trigger('click')
    expect(w.find('.g-tag__undo').exists()).toBe(false)
    expect(w.find('.g-tag').classes()).not.toContain('is-ghost')
  })
  it('slot lead: hueco decorativo; slot default sustituye el texto visible', () => {
    const w = mk({ label: 'Vue', href: '#vue' }, { slots: { lead: () => h('svg', { class: 'mi-icono' }), default: () => ['Vue · ', h('b', '12')] } })
    expect(w.find('.g-tag__lead').attributes('aria-hidden')).toBe('true')
    expect(w.find('.g-tag__lead > svg.mi-icono').exists()).toBe(true)
    expect(w.find('.g-tag__text').text()).toBe('Vue · 12')
  })
})

describe('GTag · alternar (pressed, v-model:pressed)', () => {
  it('pressed ausente = no alterna (default null)', () => {
    expect(GTag.props.pressed.default).toBe(null)
    const w = mk({ label: 'A' })
    expect(w.find('button').exists()).toBe(false)
  })
  it('sin v-model: clic alterna su estado y emite update:pressed', async () => {
    const w = mk({ label: 'A', pressed: false })
    await w.find('button.g-tag__body').trigger('click')
    expect(w.emitted('update:pressed')).toEqual([[true]])
    expect(w.find('button.g-tag__body').attributes('aria-pressed')).toBe('true')
    expect(w.find('.g-tag').classes()).toContain('is-pressed')
    await w.find('button.g-tag__body').trigger('click')
    expect(w.emitted('update:pressed')).toEqual([[true], [false]])
    // La prop que cambia sincroniza
    await w.setProps({ pressed: true })
    expect(w.find('button.g-tag__body').attributes('aria-pressed')).toBe('true')
  })
  it('con v-model:pressed', async () => {
    const on = ref(false)
    const w = mount({ render: () => h(GTag, { label: 'A', pressed: on.value, 'onUpdate:pressed': (v) => { on.value = v } }) }, { attachTo: document.body })
    wrappers.push(w)
    await w.find('button').trigger('click')
    expect(on.value).toBe(true)
    expect(w.find('button').attributes('aria-pressed')).toBe('true')
  })
  it('el nombre del botón no cambia con el estado (APG Button)', async () => {
    const w = mk({ label: 'Solo pendientes', pressed: false })
    const before = w.find('button').text()
    await w.find('button').trigger('click')
    expect(w.find('button').text()).toBe(before)
  })
  it('disabled: botón nativo deshabilitado; no emite', async () => {
    const w = mk({ label: 'A', pressed: false, disabled: true })
    expect(w.find('button.g-tag__body').attributes('disabled')).toBeDefined()
    await w.find('button.g-tag__body').trigger('click')
    expect(w.emitted('update:pressed')).toBeUndefined()
  })
  it('href gana a pressed: es un enlace y avisa (aviso 2)', async () => {
    const G = await fresh()
    const s = spyWarn()
    const w = mount(G, { props: { label: 'A', href: '#a', pressed: true }, attachTo: document.body })
    wrappers.push(w)
    expect(w.find('a.g-tag__body').exists()).toBe(true)
    expect(w.find('[aria-pressed]').exists()).toBe(false)
    expect(w.find('.g-tag').classes()).not.toContain('is-toggle')
    expect(grana(s).some((m) => /href y pressed/.test(m))).toBe(true)
  })
})

describe('GTag · navigate (#505)', () => {
  it('clic primario sin modificadores emite { event, href } y es cancelable', async () => {
    const w = mk({ label: 'Vue', href: '#vue' })
    const a = w.find('a').element
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })
    a.dispatchEvent(ev)
    const got = w.emitted('navigate')
    expect(got.length).toBe(1)
    expect(got[0][0].href).toBe('#vue')
    expect(got[0][0].event).toBe(ev)
    got[0][0].event.preventDefault()
    expect(ev.defaultPrevented).toBe(true)
  })
  it('con Ctrl, ⌘, Mayús, Alt o botón central NO emite', () => {
    const w = mk({ label: 'Vue', href: '#vue' })
    const a = w.find('a').element
    for (const init of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
      a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init }))
    }
    expect(w.emitted('navigate')).toBeUndefined()
  })
  it('un clic ya cancelado no emite', () => {
    const w = mk({ label: 'Vue', href: '#vue' })
    const a = w.find('a').element
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })
    ev.preventDefault()
    a.dispatchEvent(ev)
    expect(w.emitted('navigate')).toBeUndefined()
  })
  it('deshabilitado no emite', () => {
    const w = mk({ label: 'Vue', href: '#vue', disabled: true })
    w.find('a').element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }))
    expect(w.emitted('navigate')).toBeUndefined()
  })
})

describe('GTag · quitar (remove)', () => {
  it('botón → { event, source: "button" }', async () => {
    const w = mk({ label: 'A', removable: true, labels: L })
    await w.find('.g-tag__remove').trigger('click')
    const p = w.emitted('remove')[0][0]
    expect(p.source).toBe('button')
    expect(p.event).toBeInstanceOf(Event)
  })
  it('Supr y Retroceso sobre «Quitar» o sobre el cuerpo interactivo → source "key" con preventDefault', async () => {
    const w = mk({ label: 'A', href: '#a', removable: true, labels: L })
    const del = new KeyboardEvent('keydown', { key: 'Delete', bubbles: true, cancelable: true })
    w.find('.g-tag__remove').element.dispatchEvent(del)
    const bs = new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true })
    w.find('a.g-tag__body').element.dispatchEvent(bs)
    expect(w.emitted('remove').map((x) => x[0].source)).toEqual(['key', 'key'])
    expect(del.defaultPrevented && bs.defaultPrevented).toBe(true)
  })
  it('Supr en una etiqueta no quitable no hace nada', () => {
    const w = mk({ label: 'A', pressed: false })
    const e = new KeyboardEvent('keydown', { key: 'Delete', bubbles: true, cancelable: true })
    w.find('button').element.dispatchEvent(e)
    expect(w.emitted('remove')).toBeUndefined()
    expect(e.defaultPrevented).toBe(false)
  })
  it('disabled: «Quitar» deshabilitado y sin remove (botón ni tecla)', async () => {
    const w = mk({ label: 'A', removable: true, disabled: true, labels: L })
    expect(w.find('.g-tag__remove').attributes('disabled')).toBeDefined()
    await w.find('.g-tag__remove').trigger('click')
    w.find('.g-tag__remove').element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true, cancelable: true }))
    expect(w.emitted('remove')).toBeUndefined()
  })
})

describe('GTag · color por categoría (#469)', () => {
  const cat = (w) => w.find('.g-tag').attributes('data-cat') ?? null
  it('sin color y categories 0: neutro, sin data-cat', () => {
    expect(cat(mk({ label: 'Penicilina' }))).toBe(null)
  })
  it('color k fija la categoría (número o cadena) y gana al derivado', () => {
    expect(cat(mk({ label: 'A', color: 3 }))).toBe('3')
    expect(cat(mk({ label: 'A', color: '11', categories: 8 }))).toBe('11')
  })
  it('color="neutral" gana a categories', () => {
    expect(cat(mk({ label: 'A', color: 'neutral', categories: 8 }))).toBe(null)
  })
  it('categories deriva de colorKey ?? label con el hash de GAvatar', () => {
    expect(cat(mk({ label: 'Grana Labs', categories: 12 }))).toBe('11')
    expect(cat(mk({ label: 'Otra cosa', colorKey: 'Grana Labs', categories: 12 }))).toBe('11')
    expect(cat(mk({ label: 'Zoë', categories: 8 }))).toBe(String(categoryOf('Zoë', 8)))
  })
  it('colorKey vacía cuenta como ausente', () => {
    expect(cat(mk({ label: 'Grana Labs', colorKey: '  ', categories: 12 }))).toBe('11')
  })
  it('color semántico se ignora con texto propio (aviso 3); categories inválido = 0 (aviso 4)', async () => {
    const G = await fresh()
    const s = spyWarn()
    const a = mount(G, { props: { label: 'A', color: 'danger', categories: 8 }, attachTo: document.body })
    const b = mount(G, { props: { label: 'B', categories: 13 }, attachTo: document.body })
    wrappers.push(a, b)
    expect(a.find('.g-tag').attributes('data-cat')).toBe(String(categoryOf('A', 8)))
    expect(b.find('.g-tag').attributes('data-cat')).toBeUndefined()
    const msgs = grana(s)
    expect(msgs.some((m) => /color semántico/.test(m) && /GBadge/.test(m))).toBe(true)
    expect(msgs.some((m) => /categories=13/.test(m))).toBe(true)
  })
})

describe('GTag · atributos (inheritAttrs: false)', () => {
  it('class, style, id, data-* y lang a la raíz; target/rel/download al <a>; aria-describedby al control', () => {
    const w = mk({ label: 'Vue', href: '#vue' }, { attrs: { class: 'x', style: 'color: red', id: 't1', 'data-k': '1', lang: 'en', target: '_blank', rel: 'noopener', download: '', 'aria-describedby': 'd1' } })
    const r = w.find('.g-tag')
    expect(r.classes()).toContain('x')
    expect(r.attributes('id')).toBe('t1')
    expect(r.attributes('data-k')).toBe('1')
    expect(r.attributes('lang')).toBe('en')
    expect(r.attributes('style')).toContain('color: red')
    const a = w.find('a')
    expect(a.attributes('target')).toBe('_blank')
    expect(a.attributes('rel')).toBe('noopener')
    expect(a.attributes('download')).toBe('')
    expect(a.attributes('aria-describedby')).toBe('d1')
    expect(r.attributes('target')).toBeUndefined()
    expect(r.attributes('aria-describedby')).toBeUndefined()
  })
  it('aria-describedby va al botón de alternar; sin control se ignora', () => {
    expect(mk({ label: 'A', pressed: true }, { attrs: { 'aria-describedby': 'd' } }).find('button').attributes('aria-describedby')).toBe('d')
    const s = mk({ label: 'A' }, { attrs: { 'aria-describedby': 'd' } })
    expect(s.find('[aria-describedby]').exists()).toBe(false)
  })
  it('role, tabindex y aria-* se ignoran y avisan (aviso 1); onClick no se enlaza y avisa (aviso 7)', async () => {
    const G = await fresh()
    const s = spyWarn()
    const click = vi.fn()
    const w = mount(G, { props: { label: 'A' }, attrs: { role: 'button', tabindex: '0', 'aria-label': 'X', onClick: click }, attachTo: document.body })
    wrappers.push(w)
    const r = w.find('.g-tag')
    expect(r.attributes('role')).toBeUndefined()
    expect(r.attributes('tabindex')).toBeUndefined()
    expect(r.attributes('aria-label')).toBeUndefined()
    await r.trigger('click')
    expect(click).not.toHaveBeenCalled()
    const msgs = grana(s)
    expect(msgs.filter((m) => /ignora el atributo/.test(m)).length).toBe(3)
    expect(msgs.some((m) => /escucha de clic/.test(m) && /navigate/.test(m))).toBe(true)
  })
})

describe('GTag · avisos de desarrollo', () => {
  it('5: removable sin labels.remove', async () => {
    const G = await fresh()
    const s = spyWarn()
    wrappers.push(mount(G, { props: { label: 'A', removable: true }, attachTo: document.body }))
    expect(grana(s).some((m) => /removable sin labels.remove/.test(m))).toBe(true)
  })
  it('6: contenido interactivo en el slot por defecto (al montar)', async () => {
    const G = await fresh()
    const s = spyWarn()
    wrappers.push(mount(G, { props: { label: 'A' }, slots: { default: () => h('a', { href: '#' }, 'x') }, attachTo: document.body }))
    expect(grana(s).some((m) => /contenido interactivo/.test(m))).toBe(true)
  })
  it('8: label vacía no pinta la etiqueta', async () => {
    const G = await fresh()
    const s = spyWarn()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const w = mount(G, { props: { label: '   ' }, attachTo: document.body })
    wrappers.push(w)
    expect(w.find('.g-tag').exists()).toBe(false)
    expect(grana(s).some((m) => /label es obligatoria/.test(m))).toBe(true)
  })
  it('una etiqueta correcta no avisa', async () => {
    const G = await fresh()
    const s = spyWarn()
    wrappers.push(mount(G, { props: { label: 'A', href: '#a', removable: true, labels: L, categories: 8 }, attachTo: document.body }))
    wrappers.push(mount(G, { props: { label: 'B', pressed: true, color: 'neutral' }, attachTo: document.body }))
    expect(grana(s)).toEqual([])
  })
})

describe('GTag · pista visual (#470, modo visual del motor del tooltip)', () => {
  it('nodos <span class="g-tooltip" aria-hidden> al final de la raíz: cuerpo interactivo y «Quitar»', async () => {
    const w = mk({ label: 'Vue', href: '#vue', removable: true, labels: L })
    await nextTick()
    const nodes = w.findAll('.g-tag > .g-tooltip')
    expect(nodes.length).toBe(2)
    for (const n of nodes) {
      expect(n.element.tagName).toBe('SPAN')
      expect(n.attributes('aria-hidden')).toBe('true')
      expect(n.attributes('role')).toBeUndefined()
      expect(n.attributes('id')).toBeUndefined()
      expect(n.attributes('popover')).toBe('manual')
    }
    expect(nodes.map((n) => n.text())).toEqual(['Vue', 'Quitar Vue'])
    expect(w.find('.g-tag').element.lastElementChild).toBe(nodes[1].element)
  })
  it('estática sin control: sin nodos', () => {
    expect(mk({ label: 'Penicilina' }).find('.g-tooltip').exists()).toBe(false)
  })
  it('el nombre accesible del control no cambia con la pista', () => {
    const w = mk({ label: 'Vue', pressed: false, removable: true, labels: L })
    const b = w.find('button.g-tag__body').element
    expect(ariaOf(b)).toEqual({ 'aria-pressed': 'false' })
  })
})
