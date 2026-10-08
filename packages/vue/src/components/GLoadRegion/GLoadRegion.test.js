// GLoadRegion (load-region.md «Verificación», bruno): fases y clases con temporizadores falsos, molde, copia, refresco keep y
// replace, lo nuevo, barra de fallo, anuncios por el canal de página (inicio solo si se ve, 5 s una vez, fin en orden,
// announceError, anidación y grupo), foco (#534), avisos y --_load-slot.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, enableAutoUnmount } from '@vue/test-utils'
import { h, nextTick, defineComponent, ref } from 'vue'
import GLoadRegion from './GLoadRegion.vue'
import GEmpty from '../GEmpty/GEmpty.vue'
import { pageLiveNode } from '../../utils/liveRegion.js'

enableAutoUnmount(afterEach)
beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); document.body.innerHTML = '' })

const flush = async () => { for (let i = 0; i < 4; i++) await nextTick() }
const at = async (ms) => { await flush(); vi.advanceTimersByTime(ms); await flush() }
const ALL = [
  { id: 'm7', name: 'Suero · Ana Ruiz' },
  { id: 'm8', name: 'Orina · Jorge Pérez' },
  { id: 'm9', name: 'Plasma · Lucía Gómez' }
]
const SAMPLE = [{ id: 's1', name: 'Tipo · Nombre Apellido' }, { id: 's2', name: 'Tipo · Nombre Apellido' }]
const LABELS = {
  loading: 'Cargando muestras.', slow: 'Sigue cargando muestras.', refreshing: 'Actualizando',
  loaded: ({ count, fresh }) => `${count} muestras${fresh ? `, ${fresh} nuevas` : ''}.`,
  failed: 'No se pudo actualizar. Lo que ves es lo último que llegó.', retry: 'Reintentar'
}
const seen = []
const tpl = ({ items, mold, fresh, itemAttrs }) => {
  seen.push({ items, mold })
  if (items && (!Array.isArray(items) || items.length)) {
    return h('ul', { class: 'rows' }, (Array.isArray(items) ? items : [items]).map((it) => h('li', { key: it.id, class: 'row', ...itemAttrs(it) }, [
      h('a', { href: `#${it.id}`, class: 'title' }, it.name),
      h('button', { class: 'ver' }, 'Ver'),
      h('button', { class: 'editar' }, 'Editar'),
      fresh(it) ? h('span', { class: 'new' }, 'Nueva') : null
    ])))
  }
  return items ? h(GEmpty, { cause: 'none', title: 'Aún no hay muestras' }, { actions: () => h('button', { class: 'crear' }, 'Registrar') }) : null
}
const mk = (props = {}, opts = {}) => mount(GLoadRegion, {
  attachTo: document.body,
  props: { label: 'Muestras', sample: SAMPLE, labels: LABELS, ...props },
  slots: { default: tpl, ...(opts.slots || {}) },
  ...opts
})
const live = () => pageLiveNode()?.textContent ?? null
const names = (w) => w.findAll('.g-load-region__body .title').map((n) => n.text())
const cls = (w) => w.classes().filter((c) => c.startsWith('is-')).sort()

describe('GLoadRegion · raíz y nombre', () => {
  it('role="group" con nombre; tabindex="-1"; aria-busy; sin nombre no lleva role (aviso)', () => {
    const w = mk()
    expect(w.attributes('role')).toBe('group')
    expect(w.attributes('aria-label')).toBe('Muestras')
    expect(w.attributes('tabindex')).toBe('-1')
    expect(w.attributes('aria-busy')).toBe('false')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const x = mk({ label: undefined, labelledby: undefined })
    expect(x.attributes('role')).toBeUndefined()
    expect(warn.mock.calls.some((c) => /sin label ni labelledby/.test(c[0]))).toBe(true)
    const y = mk({ label: undefined, labelledby: 'h-muestras' })
    expect(y.attributes('aria-labelledby')).toBe('h-muestras')
    expect(y.attributes('role')).toBe('group')
  })
  it('validadores', () => {
    expect(GLoadRegion.props.refresh.validator('keep')).toBe(true)
    expect(GLoadRegion.props.refresh.validator('replace')).toBe(true)
    expect(GLoadRegion.props.refresh.validator('clear')).toBe(false)
    expect(GLoadRegion.emits).toEqual(['retry'])
  })
})

describe('GLoadRegion · fases y molde (A)', () => {
  it('primera carga: a 100 ms molde invisible (is-pending + is-mold) con la muestra; a 250 a la vista; a 6000 espera larga', async () => {
    seen.length = 0
    const w = mk({ loading: true, items: null })
    expect(w.attributes('aria-busy')).toBe('true')
    expect(cls(w)).toEqual(['is-busy', 'is-mold', 'is-pending'])
    const body = w.find('.g-load-region__body')
    expect(body.attributes('aria-hidden')).toBe('true')
    expect(body.attributes('inert')).toBe('')
    expect(seen.at(-1)).toEqual({ items: SAMPLE, mold: true })
    expect(names(w)).toEqual(['Tipo · Nombre Apellido', 'Tipo · Nombre Apellido'])
    await at(100)
    expect(cls(w)).toEqual(['is-busy', 'is-mold', 'is-pending'])
    await at(150)
    expect(cls(w)).toEqual(['is-busy', 'is-mold'])
    await at(650)
    expect(cls(w)).toEqual(['is-busy', 'is-mold'])
    await at(5100)
    expect(cls(w)).toEqual(['is-busy', 'is-mold', 'is-slow'])
    const slow = w.find('p.g-load-region__slow')
    expect(slow.text()).toBe('Sigue cargando muestras.')
    expect(slow.element.previousElementSibling).toBe(body.element)
  })

  it('llegada tras verse: revelado is-mold → is-mold + is-revealing → nada; el cuerpo sin aria-hidden ni inert en el revelado', async () => {
    const w = mk({ loading: true, items: null })
    await at(250)
    await w.setProps({ loading: false, items: ALL })
    await at(400)
    // Primer cuadro: los datos reales, todavía en molde
    expect(names(w)).toEqual(ALL.map((i) => i.name))
    expect(cls(w)).toEqual(['is-mold'])
    expect(w.find('.g-load-region__body').attributes('aria-hidden')).toBe('true')
    await at(20) // un cuadro
    expect(cls(w)).toEqual(['is-mold', 'is-revealing'])
    expect(w.find('.g-load-region__body').attributes('aria-hidden')).toBeUndefined()
    expect(w.find('.g-load-region__body').attributes('inert')).toBeUndefined()
    expect(w.attributes('aria-busy')).toBe('false')
    await at(200)
    expect(cls(w)).toEqual([])
  })

  it('una carga de menos de 200 ms no se ve: sin revelado y sin anuncio de inicio', async () => {
    const w = mk({ loading: true, items: null })
    await at(120)
    await w.setProps({ loading: false, items: ALL })
    await flush()
    expect(cls(w)).toEqual([])
    await at(60)
    expect(live()).toBe('3 muestras.')
  })

  it('la copia: sustituir items antes del final no cambia lo pintado; cambia al cumplirse el mínimo', async () => {
    const w = mk({ items: ALL.slice(0, 2) })
    await w.setProps({ loading: true })
    await at(250)
    await w.setProps({ items: ALL })
    await flush()
    expect(names(w)).toEqual(ALL.slice(0, 2).map((i) => i.name))
    await w.setProps({ loading: false })
    await at(300) // se vio a los 200 ms: llega a los ≥ 600
    expect(names(w)).toEqual(ALL.slice(0, 2).map((i) => i.name))
    await at(60)
    expect(names(w)).toEqual(ALL.map((i) => i.name))
  })

  it('una carga que empieza mientras otra espera su mínimo hereda la fase visible', async () => {
    const w = mk({ items: ALL })
    await w.setProps({ loading: true })
    await at(250)
    await w.setProps({ loading: false })
    await at(100)
    await w.setProps({ loading: true })
    await flush()
    expect(cls(w)).toEqual(['is-busy', 'is-stale'])
    expect(live()).toBe('Cargando muestras.')
  })

  it('--_load-slot en px con el alto del primer [data-g-key]', async () => {
    const spy = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
      const hgt = this.matches && this.matches('[data-g-key]') ? 56.5 : 0
      return { width: 100, height: hgt, top: 0, left: 0, right: 100, bottom: hgt }
    })
    const w = mk({ loading: true, items: null })
    await flush()
    expect(w.attributes('style')).toContain('--_load-slot: 56.5px')
    spy.mockRestore()
  })
})

describe('GLoadRegion · lo último conocido (B) y replace', () => {
  it('keep: lo de antes sigue, inerte desde el inicio; a los 200 ms is-stale con la píldora (aria-hidden)', async () => {
    const w = mk({ items: ALL })
    await w.setProps({ loading: true })
    expect(cls(w)).toEqual(['is-busy', 'is-pending'])
    const body = w.find('.g-load-region__body')
    expect(body.attributes('inert')).toBe('')
    expect(body.attributes('aria-hidden')).toBeUndefined()
    expect(w.find('.g-load-region__pill').exists()).toBe(false)
    await at(250)
    expect(cls(w)).toEqual(['is-busy', 'is-stale'])
    const pill = w.find('.g-load-region__pill')
    expect(pill.attributes('aria-hidden')).toBe('true')
    expect(pill.text()).toBe('Actualizando')
    expect(pill.find('svg').exists()).toBe(true)
    expect(names(w)).toEqual(ALL.map((i) => i.name))
  })

  it('lo nuevo: data-g-fresh y fresh(item) hasta la siguiente carga; el anuncio lo cuenta; nunca en la primera', async () => {
    const w = mk({ loading: true, items: null })
    await w.setProps({ loading: false, items: ALL.slice(0, 2) })
    await flush()
    expect(w.find('[data-g-fresh]').exists()).toBe(false)
    await w.setProps({ loading: true })
    await at(250)
    await w.setProps({ loading: false, items: ALL })
    await at(400)
    await at(300)
    const fresh = w.findAll('[data-g-fresh]')
    expect(fresh.map((n) => n.attributes('data-g-key'))).toEqual(['m9'])
    expect(w.findAll('.new')).toHaveLength(1)
    expect(live()).toBe('3 muestras, 1 nuevas.')
  })

  it('replace: dentro del retraso, lo de antes a la vista e inerte; desde 200 ms, el molde de lo último conocido', async () => {
    seen.length = 0
    const w = mk({ items: ALL, refresh: 'replace' })
    await w.setProps({ loading: true })
    expect(cls(w)).toEqual(['is-busy', 'is-pending'])
    await at(250)
    expect(cls(w)).toEqual(['is-busy', 'is-mold'])
    expect(seen.at(-1)).toEqual({ items: ALL, mold: true })
    expect(w.find('.g-load-region__body').attributes('aria-hidden')).toBe('true')
    expect(w.find('.g-load-region__pill').exists()).toBe(false)
  })
})

describe('GLoadRegion · fallo', () => {
  it('con contenido conocido: lo conocido se queda, usable, con la barra antes del cuerpo; retry; anuncia el fallo', async () => {
    const w = mk({ items: ALL })
    await w.setProps({ loading: true })
    await at(250)
    await w.setProps({ loading: false, error: true })
    await at(400)
    expect(cls(w)).toEqual(['is-failed'])
    const bar = w.find('.g-load-region__failed')
    expect(bar.element.nextElementSibling.classList.contains('g-load-region__body')).toBe(true)
    expect(bar.find('.g-load-region__failed-icon').attributes('aria-hidden')).toBe('true')
    expect(bar.find('p.g-load-region__failed-text').text()).toBe(LABELS.failed)
    const btn = bar.find('button.g-btn')
    expect(btn.classes()).toEqual(expect.arrayContaining(['g-btn--size-sm', 'g-btn--variant-soft', 'g-btn--color-neutral']))
    expect(w.find('.g-load-region__body').attributes('inert')).toBeUndefined()
    expect(names(w)).toEqual(ALL.map((i) => i.name))
    await at(60)
    expect(live()).toBe(LABELS.failed)
    await btn.trigger('click')
    expect(w.emitted('retry')).toHaveLength(1)
    // Mientras corre la siguiente carga, la barra no se pinta
    await w.setProps({ loading: true, error: false })
    expect(w.find('.g-load-region__failed').exists()).toBe(false)
  })

  it('error como texto sustituye a labels.failed; el slot failed sustituye el interior con { retry, text }', async () => {
    const w = mk({ items: ALL, error: 'Sin red' }, { slots: { failed: ({ retry, text }) => h('button', { class: 'own', onClick: retry }, text) } })
    expect(w.find('.g-load-region__failed .own').text()).toBe('Sin red')
    expect(w.find('.g-load-region__failed-text').exists()).toBe(false)
    await w.find('.own').trigger('click')
    expect(w.emitted('retry')).toHaveLength(1)
  })

  it('sin contenido conocido no hay barra: la aplicación pinta su GEmpty cause="error" y se anuncia su título', async () => {
    const errTpl = ({ items }) => (items ? null : h(GEmpty, { cause: 'error', title: 'No se pudieron cargar las muestras' }))
    const w = mk({ loading: true, items: null }, { slots: { default: errTpl } })
    await w.setProps({ loading: false, error: true })
    await flush()
    expect(w.find('.g-load-region__failed').exists()).toBe(false)
    await at(60)
    expect(live()).toBe('No se pudieron cargar las muestras')
  })

  it('announceError: false pinta la barra (o el vacío de error) pero no anuncia el fallo', async () => {
    const w = mk({ items: ALL, announceError: false })
    await w.setProps({ loading: true })
    await w.setProps({ loading: false, error: true })
    await at(60)
    expect(w.find('.g-load-region__failed').exists()).toBe(true)
    expect(live()).toBe('')
  })
})

describe('GLoadRegion · anuncios (#533)', () => {
  it('como mucho tres por carga: al verse, a los 5 s (una vez) y al terminar', async () => {
    const w = mk({ loading: true, items: null })
    await at(60)
    expect(live()).toBe('')
    await at(200)
    expect(live()).toBe('Cargando muestras.')
    await at(5000)
    expect(live()).toBe('Sigue cargando muestras.')
    await at(5100)
    expect(live()).toBe('')
    await w.setProps({ loading: false, items: ALL })
    await at(60)
    expect(live()).toBe('3 muestras.')
  })

  it('al terminar con un GEmpty registrado se anuncia su título (lo que se ve es lo que se oye)', async () => {
    const w = mk({ loading: true, items: null })
    await at(250)
    await w.setProps({ loading: false, items: [] })
    await at(400)
    await at(60)
    expect(w.find('.g-empty').exists()).toBe(true)
    expect(live()).toBe('Aún no hay muestras')
  })

  it('sin labels.loading carga en silencio (aviso, una vez); el canal existe desde el montaje', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk({ labels: {}, items: ALL })
    expect(pageLiveNode()).not.toBe(null)
    await w.setProps({ loading: true })
    await at(260)
    expect(live()).toBe('')
    await w.setProps({ loading: false })
    await w.setProps({ loading: true })
    expect(warn.mock.calls.filter((c) => /sin labels.loading/.test(c[0]))).toHaveLength(1)
  })

  it('anidada: la de dentro no habla si la de fuera tiene labels.loading; grupo: habla al verse la primera y al terminar la última', async () => {
    const a = ref(false)
    const b = ref(false)
    const inner = (on) => h(GLoadRegion, { loading: on, items: ALL.slice(0, 1), label: 'Tesela', labels: { loading: 'Cargando', slow: 'Sigue', loaded: 'Cargada' } }, { default: tpl })
    const Host = defineComponent({
      setup: () => () => h(GLoadRegion, { label: 'Panel', items: [], labels: { loading: 'Cargando el panel.', slow: 'Sigue el panel.', loaded: 'Panel actualizado.' } }, {
        default: () => [inner(a.value), inner(b.value)]
      })
    })
    const w = mount(Host, { attachTo: document.body })
    a.value = true
    b.value = true
    await flush()
    await at(260)
    expect(live()).toBe('Cargando el panel.')
    a.value = false
    await at(500)
    expect(live()).toBe('Cargando el panel.') // aún falta la otra
    b.value = false
    await at(500)
    expect(live()).toBe('Panel actualizado.')
    w.unmount()
  })
})

describe('GLoadRegion · foco (#534)', () => {
  it('con el foco fuera, la carga no lo toca', async () => {
    const out = document.createElement('button')
    document.body.append(out)
    const w = mk({ items: ALL })
    out.focus()
    await w.setProps({ loading: true })
    await at(250)
    await w.setProps({ loading: false })
    await at(400)
    expect(document.activeElement).toBe(out)
  })

  it('dentro: al empezar pasa a la raíz; al llegar vuelve al mismo enfocable (índice) del elemento con la misma clave', async () => {
    const w = mk({ items: ALL })
    w.findAll('.row')[1].find('.editar').element.focus()
    await w.setProps({ loading: true })
    expect(document.activeElement).toBe(w.element)
    await at(250)
    await w.setProps({ loading: false, items: [ALL[1], ALL[2], ALL[0]] })
    await at(400)
    const a = document.activeElement
    expect(a.classList.contains('editar')).toBe(true)
    expect(a.closest('[data-g-key]').getAttribute('data-g-key')).toBe('m8')
  })

  it('si la clave ya no existe, se queda en la raíz; nunca en body', async () => {
    const w = mk({ items: ALL })
    w.findAll('.row')[1].find('.ver').element.focus()
    await w.setProps({ loading: true })
    await w.setProps({ loading: false, items: [ALL[0]] })
    await flush()
    expect(document.activeElement).toBe(w.element)
  })

  it('el molde nunca tiene enfocables alcanzables (inert)', () => {
    const w = mk({ loading: true, items: null })
    expect(w.find('.g-load-region__body').attributes('inert')).toBe('')
  })

  it('fuera de una carga: un GEmpty que se va con el foco dentro deja el foco en la raíz', async () => {
    const show = ref(true)
    const w = mount(GLoadRegion, {
      attachTo: document.body,
      props: { label: 'X', items: [] },
      slots: { default: () => (show.value ? h(GEmpty, { cause: 'filtered', title: 'Ninguna', filters: [{ key: 'a', label: 'A' }], labels: { clear: 'Quitar todos' } }) : h('p', 'algo')) }
    })
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    w.find('.g-empty button').element.focus()
    show.value = false
    await flush()
    expect(document.activeElement).toBe(w.element)
  })

  it('fuera de una carga: el elemento con el foco desaparece de la plantilla → mismo elemento por clave o raíz', async () => {
    const w = mk({ items: ALL })
    w.findAll('.row')[2].find('.ver').element.focus()
    await w.setProps({ items: ALL.slice(0, 2) })
    await flush()
    expect(document.activeElement).toBe(w.element)
  })
})

describe('GLoadRegion · avisos de desarrollo (una vez cada uno, prefijo [Grana] <GLoadRegion>)', () => {
  it('trío de labels, refreshing, failed y retry, sample, items = [], claves', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mk({ labels: { loading: 'C' }, sample: null, items: null, loading: true })
    const w = mk({ labels: { loading: 'C' }, items: [], loading: true, keyBy: 'nope' })
    await w.setProps({ items: [{ id: 1 }, { id: 1 }] })
    await w.setProps({ loading: false, keyBy: 'id' })
    await w.setProps({ items: [{ id: 1 }, { id: 1 }] })
    await w.setProps({ loading: true })
    await at(250)
    await w.setProps({ loading: false, error: true })
    await at(400)
    const msgs = warn.mock.calls.map((c) => String(c[0]))
    expect(msgs.every((m) => m.startsWith('[Grana] <GLoadRegion>'))).toBe(true)
    const has = (re) => msgs.filter((m) => re.test(m)).length
    expect(has(/van juntos/)).toBe(2) // una vez por instancia: hay dos
    expect(has(/sin labels.refreshing/)).toBe(1)
    expect(has(/sin labels.failed/)).toBe(1)
    expect(has(/sin labels.retry/)).toBe(1)
    expect(has(/sin sample/)).toBe(1)
    expect(has(/items = \[\]/)).toBe(1)
    expect(has(/undefined/)).toBe(1)
    expect(has(/repetidas/)).toBe(1)
  })
})

describe('GLoadRegion · lo nuevo cuando items y loading cambian en el mismo ciclo', () => {
  it('la aplicación asigna items y pone loading en false a la vez: lo nuevo no se pierde', async () => {
    const w = mk({ items: ALL.slice(0, 2) })
    await w.setProps({ loading: true })
    await at(900)
    await w.setProps({ items: ALL, loading: false })
    await at(60)
    expect(w.findAll('[data-g-fresh]').map((n) => n.attributes('data-g-key'))).toEqual(['m9'])
    expect(live()).toBe('3 muestras, 1 nuevas.')
  })
})
