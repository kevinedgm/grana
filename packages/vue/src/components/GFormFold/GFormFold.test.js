// GFormFold · crear lo que falta en su sitio (form.md §15, DECISIONS.md #587, #588; base de niveles de dialog.md).
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createSSRApp } from 'vue'
import GFormFold from './GFormFold.vue'
import GForm from '../GForm/GForm.vue'
import GInput from '../GInput/GInput.vue'
import GTextarea from '../GTextarea/GTextarea.vue'
import GFormSection from '../GFormSection/GFormSection.vue'
import { LANDED } from '../../utils/landing.js'
import { pageLiveNode } from '../../utils/liveRegion.js'

enableAutoUnmount(afterEach)
let warn
beforeEach(() => { warn = vi.spyOn(console, 'warn').mockImplementation(() => {}) })
afterEach(() => { warn.mockRestore(); document.body.innerHTML = '' })

const wait = (ms = 80) => new Promise((r) => setTimeout(r, ms))
const ticks = async (n = 3) => { for (let i = 0; i < n; i++) await nextTick() }
const warned = (re) => warn.mock.calls.some((c) => re.test(String(c[0])))

/**
 * Formulario de página con el campo Producto y su pliegue «Producto nuevo» (nombre + categoría).
 * `opts.vmodel`: con v-model:open (por defecto) o sin él.
 */
function setup(opts = {}) {
  const open = ref(Boolean(opts.open))
  const model = ref({ producto: '', nombre: '', nota: '', categoria: '' })
  const foldErrors = ref(opts.foldErrors || {})
  const formErrors = ref(opts.formErrors || {})
  const events = []
  const dirty = ref(false)
  const childOpen = ref(Boolean(opts.childOpen))
  const App = defineComponent({
    setup() {
      return () => h(GForm, {
        id: 'f-out',
        errors: formErrors.value,
        dirty: dirty.value,
        'onUpdate:dirty': (v) => { dirty.value = v },
        labels: { error: 'Error:' },
        onSubmit: (e) => events.push(['submit', e]),
        onInvalid: (e) => events.push(['invalid', e])
      }, () => [
        h(GInput, { id: 'producto', name: 'producto', label: 'Producto', modelValue: model.value.producto, 'onUpdate:modelValue': (v) => { model.value.producto = v } }),
        h('button', { id: 'crear', type: 'button' }, 'Crear producto…'),
        h(GFormFold, {
          id: 'fold',
          open: open.value,
          ...(opts.vmodel === false ? {} : { 'onUpdate:open': (v) => { open.value = v } }),
          title: opts.title === undefined ? 'Producto nuevo' : opts.title,
          description: 'Se elegirá en Producto',
          for: 'producto',
          from: opts.from,
          errors: foldErrors.value,
          labels: opts.labels === undefined ? { pending: 'Termina o cancela «{title}»' } : opts.labels,
          onConfirm: (e) => { events.push(['confirm', e]); if (opts.onConfirm) opts.onConfirm(e) },
          onInvalid: (e) => events.push(['fold-invalid', e]),
          onCancel: (e) => events.push(['cancel', e])
        }, {
          default: () => [
            h(GInput, { id: 'nombre', name: 'nombre', label: 'Nombre', modelValue: model.value.nombre, 'onUpdate:modelValue': (v) => { model.value.nombre = v } }),
            h(GTextarea, { id: 'nota', name: 'nota', label: 'Nota', modelValue: model.value.nota, 'onUpdate:modelValue': (v) => { model.value.nota = v } }),
            opts.nested ? h(GFormFold, {
              id: 'child',
              open: childOpen.value,
              'onUpdate:open': (v) => { childOpen.value = v },
              title: 'Categoría nueva',
              labels: { pending: 'Termina o cancela «{title}»' },
              onCancel: (e) => events.push(['child-cancel', e])
            }, {
              default: () => [h(GInput, { id: 'categoria', name: 'categoria', label: 'Categoría', modelValue: model.value.categoria, 'onUpdate:modelValue': (v) => { model.value.categoria = v } })],
              actions: () => [h('button', { id: 'child-ok', type: 'button' }, 'Crear')]
            }) : null
          ],
          ...(opts.noActions ? {} : {
            actions: ({ confirm, cancel }) => [
              h('button', { id: 'cancelar', type: 'button', onClick: cancel }, 'Cancelar'),
              h('button', { id: 'ok', type: 'button', onClick: confirm }, 'Crear y elegir')
            ]
          })
        }),
        h('button', { id: 'enviar', type: 'submit' }, 'Guardar'),
        h('button', { id: 'borrador', type: 'submit', formnovalidate: '' }, 'Guardar borrador')
      ])
    }
  })
  const w = mount(App, { attachTo: document.body })
  const fold = () => w.findComponent(GFormFold)
  const root = () => document.getElementById('fold')
  const submit = async (id = 'enviar') => {
    const form = document.getElementById('f-out')
    const ev = new Event('submit', { cancelable: true, bubbles: true })
    ev.submitter = document.getElementById(id)
    form.dispatchEvent(ev)
    await wait(40)
  }
  return { w, open, model, foldErrors, formErrors, events, dirty, childOpen, fold, root, submit }
}

const openFold = async (s, opener = 'crear') => {
  document.getElementById(opener)?.focus()
  s.open.value = true
  await ticks()
  await wait(80)
}

describe('GFormFold · estructura y estado', () => {
  it('cerrado y asentado: hidden, sin rol y sin contenido; abierto: group con nombre y descripción, --_d 1', async () => {
    const s = setup()
    await ticks()
    const r = s.root()
    expect(r.hasAttribute('hidden')).toBe(true)
    expect(r.getAttribute('role')).toBeNull()
    expect(r.children.length).toBe(0)
    await openFold(s)
    expect(r.hasAttribute('hidden')).toBe(false)
    expect(r.getAttribute('role')).toBe('group')
    expect(r.getAttribute('aria-labelledby')).toBe('fold-title')
    expect(document.getElementById('fold-title').textContent).toBe('Producto nuevo')
    expect(r.getAttribute('aria-describedby')).toBe('fold-desc')
    expect(r.style.getPropertyValue('--_d')).toBe('1')
    expect(r.classList.contains('g-form-fold')).toBe(true)
    expect(r.classList.contains('g-form-fold--density-default')).toBe(true)
    expect(r.classList.contains('is-open')).toBe(true)
    const body = r.querySelector('fieldset.g-form-fold__body')
    expect(body.getAttribute('role')).toBe('none')
    expect(body.disabled).toBe(false)
    expect(r.querySelector('.g-form-fold__actions #ok')).not.toBeNull()
  })

  it('el encabezado es h(GForm.headingLevel) y el anidado +1, con --_d 2', async () => {
    const s = setup({ nested: true, open: true, childOpen: true })
    await ticks()
    expect(document.getElementById('fold-title').tagName).toBe('H3')
    const child = document.getElementById('child')
    expect(child.querySelector('.g-form-fold__title').tagName).toBe('H4')
    expect(child.style.getPropertyValue('--_d')).toBe('2')
  })

  it('al cancelar se recoge: inert y fieldset disabled durante la salida; al asentarse, hidden y sin contenido', async () => {
    const s = setup()
    await openFold(s)
    document.getElementById('cancelar').click()
    await nextTick()
    const r = s.root()
    expect(r.hasAttribute('inert')).toBe(true)
    expect(r.querySelector('fieldset').disabled).toBe(true)
    expect(r.classList.contains('is-open')).toBe(false)
    await wait(400)
    expect(r.hasAttribute('hidden')).toBe(true)
    expect(r.children.length).toBe(0)
  })

  it('sin v-model no se cierra solo: emite cancel y update:open; la aplicación decide', async () => {
    const s = setup({ vmodel: false })
    await openFold(s)
    document.getElementById('cancelar').click()
    await ticks()
    expect(s.events.some(([n, e]) => n === 'cancel' && e.reason === 'cancel')).toBe(true)
    expect(s.root().hasAttribute('hidden')).toBe(false)
    expect(s.root().getAttribute('role')).toBe('group')
  })

  it('SSR cerrado: hidden y sin contenido', async () => {
    const html = await renderToString(createSSRApp({ render: () => h(GFormFold, { title: 'Producto nuevo' }, { default: () => h('input', { id: 'x' }), actions: () => h('button', { type: 'button' }, 'Ok') }) }))
    expect(html).toContain('hidden')
    expect(html).not.toContain('id="x"')
    expect(html).toContain('g-form-fold')
  })
})

describe('GFormFold · foco', () => {
  it('al abrir: primer control del pliegue (#292); [autofocus] gana', async () => {
    const s = setup()
    await openFold(s)
    expect(document.activeElement.id).toBe('nombre')
  })

  it('cancel() y Esc devuelven el foco a from (sin from: el activo al abrir); close() va a focus › for', async () => {
    const s = setup()
    await openFold(s)
    document.getElementById('cancelar').click()
    await ticks()
    expect(document.activeElement.id).toBe('crear')
    await openFold(s)
    document.getElementById('nombre').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    await ticks()
    expect(s.events.filter(([n]) => n === 'cancel').map(([, e]) => e.reason)).toEqual(['cancel', 'escape'])
    expect(document.activeElement.id).toBe('crear')
    await openFold(s)
    s.fold().vm.close()
    await ticks()
    expect(document.activeElement.id).toBe('producto') // for
  })

  it('from explícito (id o elemento) gana al activo; un id que no existe avisa (aviso 7)', async () => {
    const s = setup({ from: 'enviar' })
    await openFold(s)
    s.fold().vm.cancel()
    await ticks()
    expect(document.activeElement.id).toBe('enviar')
    const t = setup({ from: 'no-existe' })
    await openFold(t)
    expect(warned(/from.*no-existe/)).toBe(true)
  })

  it('cerrado desde fuera: con el foco dentro va a from; con el foco fuera, no se mueve', async () => {
    const s = setup()
    await openFold(s)
    s.open.value = false
    await ticks()
    expect(document.activeElement.id).toBe('crear')
    await openFold(s)
    document.getElementById('enviar').focus()
    s.open.value = false
    await ticks()
    expect(document.activeElement.id).toBe('enviar')
  })
})

describe('GFormFold · confirmar y bajar con resultado', () => {
  it('confirm() sin errores emite confirm con close; con errores, invalid, revela, is-rejected y enfoca el primero', async () => {
    const s = setup({ foldErrors: { nombre: 'Escribe el nombre.' } })
    await openFold(s)
    document.getElementById('nota').focus()
    document.getElementById('ok').click()
    await wait(60)
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    await nextTick()
    const inv = s.events.find(([n]) => n === 'fold-invalid')
    expect(inv[1].errors).toEqual([{ name: 'nombre', message: 'Escribe el nombre.', id: 'nombre' }])
    expect(document.activeElement.id).toBe('nombre')
    expect(s.root().textContent).toContain('Escribe el nombre.')
    expect(document.getElementById('nombre').closest('.g-input').className).toContain('is-rejected')
    expect(s.events.some(([n]) => n === 'confirm')).toBe(false)
    s.foldErrors.value = {}
    await ticks()
    document.getElementById('ok').click()
    await wait(40)
    const c = s.events.find(([n]) => n === 'confirm')
    expect(typeof c[1].close).toBe('function')
  })

  it('close({ focus, announce }): foco al destino, llegada en su caja (data-g-tooltip-box) y anuncio en el canal de página', async () => {
    const s = setup({ onConfirm: (e) => e.close({ focus: 'producto', announce: 'Producto «Tris base» creado y elegido.' }) })
    await openFold(s)
    document.getElementById('ok').click()
    await wait(40)
    await ticks()
    expect(document.activeElement.id).toBe('producto')
    const box = document.getElementById('producto').closest('[data-g-tooltip-box]')
    expect(box.hasAttribute(LANDED)).toBe(true)
    await wait(80)
    expect(pageLiveNode().textContent).toBe('Producto «Tris base» creado y elegido.')
    expect(pageLiveNode().getAttribute('aria-live')).toBe('polite')
  })

  it('sin announce no se anuncia nada; la llegada se retira por animationend g-landed* o a los 1000 ms', async () => {
    const s = setup({ onConfirm: (e) => e.close() })
    await openFold(s)
    await wait(120)
    if (pageLiveNode()) pageLiveNode().textContent = ''
    document.getElementById('ok').click()
    await wait(120)
    await ticks()
    expect(document.activeElement.id).toBe('producto')
    const box = document.getElementById('producto').closest('[data-g-tooltip-box]')
    expect(box.hasAttribute(LANDED)).toBe(true)
    expect(pageLiveNode() ? pageLiveNode().textContent : '').toBe('')
    const other = new Event('animationend', { bubbles: true })
    other.animationName = 'g-reject-shake'
    box.dispatchEvent(other)
    expect(box.hasAttribute(LANDED)).toBe(true)
    const end = new Event('animationend', { bubbles: true })
    end.animationName = 'g-landed-ring'
    box.dispatchEvent(end)
    expect(box.hasAttribute(LANDED)).toBe(false)
  })
})

describe('GFormFold · teclado', () => {
  it('Enter en un campo de texto confirma y NO envía el GForm de fuera; en un textarea no', async () => {
    const s = setup()
    await openFold(s)
    const input = document.getElementById('nombre')
    const ev = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    input.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(true)
    await wait(40)
    expect(s.events.some(([n]) => n === 'confirm')).toBe(true)
    expect(s.events.some(([n]) => n === 'submit' || n === 'invalid')).toBe(false)
    const n0 = s.events.length
    const ta = document.getElementById('nota')
    const ev2 = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    ta.dispatchEvent(ev2)
    expect(ev2.defaultPrevented).toBe(false)
    await wait(40)
    expect(s.events.length).toBe(n0)
  })

  it('Esc repetida se ignora (pero se consume); Esc ya tratada por un descendiente no recoge', async () => {
    const s = setup()
    await openFold(s)
    const input = document.getElementById('nombre')
    const rep = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true, repeat: true })
    input.dispatchEvent(rep)
    expect(rep.defaultPrevented).toBe(true)
    await ticks()
    expect(s.open.value).toBe(true)
    input.addEventListener('keydown', (e) => e.preventDefault(), { once: true })
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    await ticks()
    expect(s.open.value).toBe(true)
    expect(s.events.some(([n]) => n === 'cancel')).toBe(false)
  })
})

describe('GFormFold · frente al GForm de fuera (#588)', () => {
  it('el envío de fuera con el pliegue abierto da invalid con labels.pending, enlazado al pliegue, y el foco va dentro', async () => {
    const s = setup()
    await openFold(s)
    document.getElementById('enviar').focus()
    await s.submit()
    const inv = s.events.find(([n]) => n === 'invalid')
    expect(inv).toBeTruthy()
    expect(inv[1].errors).toEqual([{ name: 'g-fold:fold', message: 'Termina o cancela «Producto nuevo»', id: 'nombre' }])
    expect(document.activeElement.id).toBe('nombre')
    expect(s.events.some(([n]) => n === 'submit')).toBe(false)
    // Cerrado: el envío pasa
    s.fold().vm.cancel()
    await ticks()
    await s.submit()
    expect(s.events.some(([n]) => n === 'submit')).toBe(true)
  })

  it('los errores del pliegue no bloquean ni salen fuera; los de fuera no entran al pliegue', async () => {
    const s = setup({ foldErrors: { nombre: 'Escribe el nombre.' } })
    await openFold(s)
    await s.submit()
    const inv = s.events.find(([n]) => n === 'invalid')
    expect(inv[1].errors.map((e) => e.name)).toEqual(['g-fold:fold'])
    expect(s.root().textContent).not.toContain('Escribe el nombre.')
  })

  it('FormData de fuera sin los controles del pliegue, también con formnovalidate; restaura el fieldset', async () => {
    const s = setup()
    await openFold(s)
    s.model.value.producto = 'p1'
    s.model.value.nombre = 'Tris base'
    await ticks()
    await s.submit('borrador')
    const sub = s.events.find(([n]) => n === 'submit')
    expect(sub[1].novalidate).toBe(true)
    expect(sub[1].data.get('producto')).toBe('p1')
    expect(sub[1].data.has('nombre')).toBe(false)
    expect(sub[1].data.has('nota')).toBe(false)
    expect(s.root().querySelector('fieldset').disabled).toBe(false)
  })

  it('escribir en el pliegue no ensucia el GForm de fuera', async () => {
    const s = setup()
    await openFold(s)
    const input = document.getElementById('nombre')
    input.value = 'x'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
    await ticks()
    expect(s.dirty.value).toBe(false)
    const out = document.getElementById('producto')
    out.value = 'y'
    out.dispatchEvent(new Event('input', { bubbles: true }))
    await ticks()
    expect(s.dirty.value).toBe(true)
  })

  it('anidados: el padre ve al hijo como pendiente; cancelar el padre desmonta al hijo', async () => {
    const s = setup({ nested: true, open: true, childOpen: true })
    await ticks()
    await wait(40)
    s.fold().vm.confirm()
    await wait(60)
    const inv = s.events.find(([n]) => n === 'fold-invalid')
    expect(inv[1].errors).toEqual([{ name: 'g-fold:child', message: 'Termina o cancela «Categoría nueva»', id: 'categoria' }])
    expect(document.activeElement.id).toBe('categoria')
    // Esc en el hijo recoge solo el hijo
    document.getElementById('categoria').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    await ticks()
    expect(s.childOpen.value).toBe(false)
    expect(s.open.value).toBe(true)
    s.childOpen.value = true
    await ticks()
    s.fold().vm.cancel()
    await ticks()
    await wait(400)
    expect(document.getElementById('child')).toBeNull()
  })
})

describe('GFormFold · avisos de desarrollo', () => {
  it('1 sin title, 2 sin actions, 3 sin labels.pending dentro de un GForm', async () => {
    const s = setup({ title: '', noActions: true, labels: {} })
    await openFold(s)
    expect(warned(/\[Grana GFormFold\] sin `title`/)).toBe(true)
    expect(warned(/sin slot `actions`/)).toBe(true)
    expect(warned(/labels\.pending/)).toBe(true)
  })

  it('5 GFormSection dentro', async () => {
    mount(defineComponent({ setup: () => () => h(GFormFold, { open: true, title: 'X' }, { default: () => h(GFormSection, { title: 'S' }), actions: () => h('button', { type: 'button' }) }) }), { attachTo: document.body })
    await ticks()
    expect(warned(/GForm o una GFormSection dentro/)).toBe(true)
  })

  it('4 dentro de una GFormRow y 6 más de tres anidados', async () => {
    const deep = (n) => h(GFormFold, { open: true, title: `N${n}` }, { default: () => (n < 4 ? deep(n + 1) : h('input')), actions: () => h('button', { type: 'button' }) })
    mount(defineComponent({ setup: () => () => h('div', { class: 'g-form-row' }, [deep(1)]) }), { attachTo: document.body })
    await ticks()
    expect(warned(/dentro de una GFormRow/)).toBe(true)
    expect(warned(/más de tres pliegues/)).toBe(true)
  })
})
