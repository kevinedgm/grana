// GEmpty (empty.md «Verificación», bruno): causa, título, icono, salida con cuentas, Intl, registro en la región y avisos.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick, provide, defineComponent, ref } from 'vue'
import GEmpty from './GEmpty.vue'
import { loadRegionKey } from '../../utils/loadPhase.js'

afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

const LABELS = { relax: 'Quitar «{label}»', returns: '{count} vuelven', clear: 'Quitar todos', before: 'Antes había {total}; con {filters}, ninguna.' }
const FILTERS = [
  { key: 'urg', label: 'Urgentes', count: 0 },
  { key: 'closed', label: 'Cerradas', count: 2 },
  { key: 'today', label: 'Hoy', count: 12 },
  { key: 'lot', label: 'Lote 0413', count: 2 }
]
const mk = (props = {}, opts = {}) => mount(GEmpty, { attachTo: document.body, props: { cause: 'none', title: 'Aún no hay muestras', ...props }, ...opts })

describe('GEmpty · estructura', () => {
  it('raíz sin role ni tabindex, clase por causa, título como p sin headingLevel y hN con él; dir="auto"', () => {
    const w = mk({ description: 'Aparecen aquí al registrarlas.' })
    expect(w.classes()).toEqual(expect.arrayContaining(['g-empty', 'g-empty--cause-none']))
    expect(w.attributes('role')).toBeUndefined()
    expect(w.attributes('tabindex')).toBeUndefined()
    expect(w.find('.g-empty__title').element.tagName).toBe('P')
    expect(w.find('.g-empty__title').attributes('dir')).toBe('auto')
    expect(w.find('p.g-empty__description').text()).toBe('Aparecen aquí al registrarlas.')
    expect(w.find('p.g-empty__description').attributes('dir')).toBe('auto')
    expect(w.find('[aria-live]').exists()).toBe(false)
    const hN = mk({ headingLevel: 3 })
    expect(hN.find('.g-empty__title').element.tagName).toBe('H3')
    w.unmount(); hN.unmount()
  })

  it('cause obligatoria y validada; headingLevel 2 a 6', () => {
    const v = GEmpty.props.cause.validator
    expect(GEmpty.props.cause.required).toBe(true)
    expect(GEmpty.props.title.required).toBe(true)
    for (const c of ['none', 'filtered', 'error', 'forbidden']) expect(v(c)).toBe(true)
    expect(v('done')).toBe(false)
    expect(GEmpty.props.headingLevel.validator(1)).toBe(false)
    expect(GEmpty.props.headingLevel.validator(6)).toBe(true)
    expect(GEmpty.props.headingLevel.validator(7)).toBe(false)
  })

  it('icono propio por causa dentro del hueco aria-hidden; none sin icono; el slot icon lo sustituye', () => {
    const icon = (cause) => mk({ cause, title: 'X' }).find('.g-empty__icon')
    expect(icon('none').attributes('aria-hidden')).toBe('true')
    expect(icon('none').element.children).toHaveLength(0)
    for (const c of ['filtered', 'error', 'forbidden']) {
      const i = icon(c)
      expect(i.attributes('aria-hidden')).toBe('true')
      expect(i.find('svg').exists()).toBe(true)
    }
    const own = mk({}, { slots: { icon: ({ cause }) => h('i', { class: 'own' }, cause) } })
    expect(own.find('.g-empty__icon .own').text()).toBe('none')
    expect(own.find('.g-empty__icon svg').exists()).toBe(false)
  })

  it('el slot por defecto sustituye a description; el slot actions recibe la causa', () => {
    const w = mk({ cause: 'error', description: 'No se ve' }, { slots: { default: () => h('a', { href: '#x' }, 'Más'), actions: ({ cause }) => h('button', { class: 'a' }, cause) } })
    expect(w.find('div.g-empty__description a').text()).toBe('Más')
    expect(w.text()).not.toContain('No se ve')
    expect(w.find('.g-empty__actions .a').text()).toBe('error')
  })
})

describe('GEmpty · la salida con cuentas (B)', () => {
  const exit = (props = {}, opts = {}) => mk({ cause: 'filtered', title: 'Ninguna muestra con estos filtros', filters: FILTERS, total: 4, labels: LABELS, locale: 'es', ...props }, opts)

  it('is-exit; solo los filtros con count > 0, de más a menos y estable ante empates; «Quitar todos» con más de uno', async () => {
    const w = exit()
    await nextTick()
    expect(w.classes()).toContain('is-exit')
    const btns = w.findAll('.g-empty__actions button')
    expect(btns.map((b) => b.find('.g-btn__label').element.textContent.replace(/\d.*$/, ''))).toEqual(['Quitar «Hoy»', 'Quitar «Cerradas»', 'Quitar «Lote ', 'Quitar todos'])
    const relax = w.findAll('.g-empty__relax')
    expect(relax.map((b) => b.find('bdi').text())).toEqual(['Hoy', 'Cerradas', 'Lote 0413'])
    expect(relax.map((b) => b.find('.g-empty__count').text())).toEqual(['12', '2', '2'])
    expect(relax.every((b) => b.find('.g-empty__count').attributes('aria-hidden') === 'true')).toBe(true)
    expect(relax.every((b) => b.classes().includes('g-btn--size-sm') && b.classes().includes('g-btn--variant-outline'))).toBe(true)
    expect(btns.at(-1).classes()).toContain('g-btn--variant-ghost')
  })

  it('nombre accesible = texto visible + la cuenta para el lector (con un espacio delante)', () => {
    const w = exit()
    const b = w.findAll('.g-empty__relax')[0]
    expect(b.find('.g-empty__sr').text()).toBe('12 vuelven')
    expect(b.find('.g-empty__sr').element.textContent).toBe(' 12 vuelven')
    expect(b.find('.g-btn__label').element.textContent).toBe('Quitar «Hoy»12 12 vuelven')
    // El lector no oye la cifra visible (aria-hidden): «Quitar «Hoy» 12 vuelven»
  })

  it('relax emite la key; clear emite sin argumento', async () => {
    const w = exit()
    await w.findAll('.g-empty__relax')[1].trigger('click')
    expect(w.emitted('relax')[0]).toEqual(['closed'])
    await w.findAll('.g-empty__actions button').at(-1).trigger('click')
    expect(w.emitted('clear')[0]).toEqual([])
  })

  it('sin ninguna count: solo «Quitar todos» (outline); un filtro con count 0 solo: «Quitar todos»', () => {
    const w = exit({ filters: [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }] })
    const btns = w.findAll('.g-empty__actions button')
    expect(btns).toHaveLength(1)
    expect(btns[0].text()).toBe('Quitar todos')
    expect(btns[0].classes()).toContain('g-btn--variant-outline')
    const one = exit({ filters: [{ key: 'a', label: 'A', count: 0 }] })
    expect(one.findAll('.g-empty__actions button').map((b) => b.text())).toEqual(['Quitar todos'])
    const single = exit({ filters: [{ key: 'a', label: 'A', count: 3 }] })
    expect(single.findAll('.g-empty__actions button')).toHaveLength(1) // un solo filtro que devuelve: sin «Quitar todos»
    expect(single.find('.g-empty__relax').exists()).toBe(true)
  })

  it('la traza con total: {filters} con Intl.ListFormat en el idioma, nombres aislados con <bdi>, cifras con Intl.NumberFormat', () => {
    const w = exit({ filters: [{ key: 'a', label: 'Urgentes', count: 0 }, { key: 'b', label: 'Cerradas', count: 0 }], total: 1200, locale: 'es' })
    const t = w.find('p.g-empty__trace')
    expect(t.text()).toBe(`Antes había ${new Intl.NumberFormat('es').format(1200)}; con Urgentes y Cerradas, ninguna.`)
    expect(t.findAll('bdi').map((b) => b.text())).toEqual(['Urgentes', 'Cerradas'])
    const en = exit({ filters: [{ key: 'a', label: 'A', count: 0 }, { key: 'b', label: 'B', count: 0 }, { key: 'c', label: 'C', count: 0 }], locale: 'en', labels: { ...LABELS, before: 'Before {total}; with {filters}, none.' } })
    expect(en.find('.g-empty__trace').text()).toBe('Before 4; with A, B, and C, none.')
  })

  it('el idioma sale del lang del ancestro más cercano al montar', async () => {
    const host = document.createElement('div')
    host.setAttribute('lang', 'en')
    document.body.append(host)
    const w = mount(GEmpty, { attachTo: host, props: { cause: 'filtered', title: 'X', filters: [{ key: 'a', label: 'A', count: 1500 }, { key: 'b', label: 'B', count: 1 }], total: 2000, labels: LABELS } })
    await nextTick()
    expect(w.find('.g-empty__count').text()).toBe('1,500')
    expect(w.find('.g-empty__trace').text()).toBe('Antes había 2,000; con A and B, ninguna.')
    w.unmount()
  })

  it('labels como Function reciben los valores', () => {
    const w = exit({ labels: { relax: ({ label }) => `Sin ${label}`, returns: ({ count }) => `+${count}`, clear: 'Todo', before: ({ total, filters }) => `${total}: ${filters}` }, filters: [{ key: 'a', label: 'A', count: 3 }, { key: 'b', label: 'B', count: 1 }], locale: 'es' })
    expect(w.find('.g-empty__relax .g-empty__sr').text()).toBe('+3')
    expect(w.find('.g-empty__relax .g-btn__label').element.textContent.startsWith('Sin A3')).toBe(true)
    expect(w.find('.g-empty__trace').text()).toBe('4: A y B')
  })

  it('el slot actions va después de la salida', () => {
    const w = exit({}, { slots: { actions: () => h('button', { class: 'mine' }, 'Exportar') } })
    const btns = w.findAll('.g-empty__actions button')
    expect(btns.at(-1).classes()).toContain('mine')
  })

  it('con otra causa, filters y total se ignoran (aviso)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk({ cause: 'none', filters: FILTERS, total: 4, labels: LABELS })
    expect(w.classes()).not.toContain('is-exit')
    expect(w.find('.g-empty__actions').exists()).toBe(false)
    expect(w.find('.g-empty__trace').exists()).toBe(false)
    expect(warn.mock.calls.filter((c) => /se ignoran/.test(c[0]))).toHaveLength(1)
  })
})

describe('GEmpty · avisos de desarrollo (una vez cada uno)', () => {
  it('salida sin labels: relax, returns, clear, before; filtered sin filtros ni actions', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk({ cause: 'filtered', title: 'X', filters: FILTERS, total: 4 })
    await w.setProps({ filters: [...FILTERS] })
    const msgs = warn.mock.calls.map((c) => String(c[0]))
    expect(msgs.every((m) => m.startsWith('[Grana] <GEmpty>'))).toBe(true)
    for (const k of ['labels.relax', 'labels.returns', 'labels.clear', 'labels.before']) expect(msgs.filter((m) => m.includes(k))).toHaveLength(1)
    // El botón se dibuja igual
    expect(w.findAll('.g-empty__relax')).toHaveLength(3)
    mk({ cause: 'filtered', title: 'Y' })
    mk({ cause: 'filtered', title: 'Z' }, { slots: { actions: () => h('button', 'Limpiar') } })
    expect(warn.mock.calls.filter((c) => /sin salida/.test(c[0]))).toHaveLength(1)
  })

  it('un GIcon con label en el slot icon avisa (lo dice GIcon, icons.md §2.4)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { GIcon } = await import('../../index.js')
    mk({}, { slots: { icon: () => h(GIcon, { name: 'check', label: 'Hecho' }) } })
    await nextTick()
    expect(warn.mock.calls.some((c) => /aria-hidden/.test(String(c[0])))).toBe(true)
  })
})

describe('GEmpty · registro en la región (#533, #534)', () => {
  const fakeRegion = () => {
    const calls = []
    return {
      calls,
      ctx: {
        registerEmpty: (e) => calls.push(['register', e.title, e.cause]),
        unregisterEmpty: (e, hadFocus) => calls.push(['unregister', e.title, hadFocus])
      }
    }
  }
  it('se registra con su title y su cause; al desmontarse avisa si tenía el foco dentro', async () => {
    const r = fakeRegion()
    const show = ref(true)
    const Host = defineComponent({
      setup() {
        provide(loadRegionKey, r.ctx)
        return () => (show.value ? h(GEmpty, { cause: 'error', title: 'No se pudieron cargar' }, { actions: () => h('button', { class: 'retry' }, 'Reintentar') }) : null)
      }
    })
    const w = mount(Host, { attachTo: document.body })
    expect(r.calls).toEqual([['register', 'No se pudieron cargar', 'error']])
    w.find('.retry').element.focus()
    show.value = false
    await nextTick()
    expect(r.calls.at(-1)).toEqual(['unregister', 'No se pudieron cargar', true])
    w.unmount()
  })
  it('fuera de una región no se registra ni escribe en una región viva', () => {
    const w = mk()
    expect(document.querySelector('[aria-live]')).toBe(null)
    w.unmount()
  })
})
