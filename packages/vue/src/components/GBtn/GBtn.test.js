import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createSSRApp, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GBtn from './GBtn.vue'
import { createLoadPhase } from '../../utils/loadPhase.js'

vi.mock('../../utils/loadPhase.js', async (original) => {
  const real = await original()
  return { ...real, createLoadPhase: vi.fn(real.createLoadPhase) }
})

const root = (wrapper) => wrapper.find('.g-btn')
// Avanza los temporizadores falsos y deja que Vue pinte
const tick = async (ms) => { vi.advanceTimersByTime(ms); await nextTick() }

afterEach(() => vi.restoreAllMocks())

describe('GBtn · render y clases', () => {
  it('renderiza <button type="button"> con las clases por defecto', () => {
    const w = mount(GBtn, { slots: { default: 'Guardar' } })
    const el = root(w)
    expect(el.element.tagName).toBe('BUTTON')
    expect(el.attributes('type')).toBe('button')
    expect(el.classes()).toEqual(expect.arrayContaining([
      'g-btn', 'g-btn--color-brand', 'g-btn--variant-solid', 'g-btn--size-md', 'g-btn--density-default'
    ]))
    expect(el.classes().some((c) => c.startsWith('g-btn--rounded-'))).toBe(false)
    expect(el.find('.g-btn__label').text()).toBe('Guardar')
  })

  it('las clases siguen a las props', async () => {
    const w = mount(GBtn, { props: { color: 'danger', variant: 'outline', size: 'lg', density: 'compact', rounded: 'pill', block: true } })
    expect(root(w).classes()).toEqual(expect.arrayContaining([
      'g-btn--color-danger', 'g-btn--variant-outline', 'g-btn--size-lg', 'g-btn--density-compact', 'g-btn--rounded-pill', 'g-btn--block'
    ]))
  })

  it('cada prop enumerada tiene validador que rechaza valores fuera de la lista', () => {
    for (const name of ['color', 'variant', 'size', 'density', 'rounded', 'type']) {
      expect(GBtn.props[name].validator('valor-invalido')).toBe(false)
    }
    expect(GBtn.props.color.validator('accent')).toBe(true)
  })
})

describe('GBtn · activación', () => {
  it('emite click al activarse', async () => {
    const w = mount(GBtn)
    await root(w).trigger('click')
    expect(w.emitted('click')).toHaveLength(1)
  })

  it('disabled: atributo nativo y sin click', async () => {
    const w = mount(GBtn, { props: { disabled: true } })
    expect(root(w).attributes('disabled')).toBeDefined()
    expect(root(w).classes()).toContain('is-disabled')
    await root(w).trigger('click')
    expect(w.emitted('click')).toBeUndefined()
  })

  it('sin loading respeta el aria-disabled del consumidor (enfocable, sin disabled nativo)', () => {
    const w = mount(GBtn, { attrs: { 'aria-disabled': 'true' }, slots: { default: 'Dictar' } })
    const el = w.find('button')
    expect(el.attributes('aria-disabled')).toBe('true')
    expect(el.attributes('disabled')).toBeUndefined()
  })

  it('loading: aria-disabled y aria-busy, SIN disabled nativo, y sin click', async () => {
    const w = mount(GBtn, { props: { loading: true } })
    const el = root(w)
    expect(el.attributes('disabled')).toBeUndefined()
    expect(el.attributes('aria-disabled')).toBe('true')
    expect(el.attributes('aria-busy')).toBe('true')
    await el.trigger('click')
    expect(w.emitted('click')).toBeUndefined()
  })

  it('loading: la etiqueta sigue en el DOM sin hidden ni aria-hidden (el nombre accesible no cambia)', () => {
    const w = mount(GBtn, { props: { loading: true }, slots: { default: 'Enviar informe' } })
    const label = w.find('.g-btn__label')
    expect(label.exists()).toBe(true)
    expect(label.text()).toBe('Enviar informe')
    expect(label.attributes('hidden')).toBeUndefined()
    expect(label.attributes('aria-hidden')).toBeUndefined()
    expect(label.element.closest('[aria-hidden="true"]')).toBeNull()
  })

  it('loading con type="submit": cancela el envío del formulario', () => {
    const w = mount(GBtn, { props: { loading: true, type: 'submit' } })
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    root(w).element.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
  })

  it('el @click del consumidor no llega al elemento nativo durante loading', async () => {
    const onClick = vi.fn()
    const w = mount(GBtn, { props: { loading: true }, attrs: { onClick } })
    await root(w).trigger('click')
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('GBtn · enlace', () => {
  it('con href renderiza <a href> sin type', () => {
    const w = mount(GBtn, { props: { href: '/reservas' } })
    const el = root(w)
    expect(el.element.tagName).toBe('A')
    expect(el.attributes('href')).toBe('/reservas')
    expect(el.attributes('type')).toBeUndefined()
  })

  it('href + disabled: sin href, aria-disabled, fuera del tabulado y con rol link', () => {
    const w = mount(GBtn, { props: { href: '/reservas', disabled: true } })
    const el = root(w)
    expect(el.attributes('href')).toBeUndefined()
    expect(el.attributes('aria-disabled')).toBe('true')
    expect(el.attributes('tabindex')).toBe('-1')
    expect(el.attributes('role')).toBe('link')
  })
})

describe('GBtn · anuncio de carga (loadingText, #257, #1014)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('con loadingText la región existe, fuera del botón, y se llena con la carga a la vista (200 ms)', async () => {
    const w = mount(GBtn, { props: { loadingText: 'Guardando…' } })
    const status = w.find('.g-btn__status')
    expect(status.exists()).toBe(true)
    expect(status.attributes('role')).toBe('status')
    expect(root(w).element.contains(status.element)).toBe(false)
    expect(status.text()).toBe('')
    await w.setProps({ loading: true })
    expect(status.text()).toBe('')
    await tick(200)
    expect(status.text()).toBe('Guardando…')
    await w.setProps({ loading: false })
    expect(status.text()).toBe('Guardando…') // sigue en la cola del mínimo
    await tick(400)
    expect(status.text()).toBe('')
  })

  it('una carga que no llega a verse no se anuncia', async () => {
    const w = mount(GBtn, { props: { loadingText: 'Guardando…' } })
    await w.setProps({ loading: true })
    await tick(100)
    await w.setProps({ loading: false })
    await tick(500)
    expect(w.find('.g-btn__status').text()).toBe('')
  })

  it('sin loadingText no hay región de estado, cargue o no', async () => {
    const w = mount(GBtn, { props: { loading: true } })
    expect(w.find('.g-btn__status').exists()).toBe(false)
    expect(w.find('[role="status"]').exists()).toBe(false)
    await w.setProps({ loading: false })
    expect(w.find('.g-btn__status').exists()).toBe(false)
  })

  it('loadingText y loading en el mismo cambio: la región se monta vacía y el texto llega con is-shown', async () => {
    const w = mount(GBtn)
    expect(w.find('.g-btn__status').exists()).toBe(false)
    await w.setProps({ loading: true, loadingText: 'Guardando…' })
    expect(w.find('.g-btn__status').text()).toBe('')
    await tick(200)
    expect(w.find('.g-btn__status').text()).toBe('Guardando…')
  })

  it('loadingText que llega con la carga ya a la vista: región vacía y texto en el ciclo siguiente', async () => {
    const w = mount(GBtn, { props: { loading: true } })
    await w.setProps({ loadingText: 'Guardando…' })
    expect(w.find('.g-btn__status').text()).toBe('')
    await tick(60)
    expect(w.find('.g-btn__status').text()).toBe('Guardando…')
  })

  it('montado con loading y loadingText: región vacía al montar y texto después', async () => {
    const w = mount(GBtn, { props: { loading: true, loadingText: 'Enviando…' } })
    expect(w.find('.g-btn__status').text()).toBe('')
    await tick(60)
    expect(w.find('.g-btn__status').text()).toBe('Enviando…')
    await tick(340)
    await w.setProps({ loading: false })
    expect(w.find('.g-btn__status').text()).toBe('')
  })
})

describe('GBtn · fases de carga (A · Retén, #1014)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('pendiente: is-loading sin is-shown; a los 200 ms, is-shown', async () => {
    const w = mount(GBtn)
    await w.setProps({ loading: true })
    expect(root(w).classes()).toContain('is-loading')
    expect(root(w).classes()).not.toContain('is-shown')
    await tick(199)
    expect(root(w).classes()).not.toContain('is-shown')
    await tick(1)
    expect(root(w).classes()).toContain('is-shown')
  })

  it('una carga de 100 ms nunca pone is-shown ni is-leaving y llega en el acto', async () => {
    const w = mount(GBtn)
    await w.setProps({ loading: true })
    await tick(100)
    await w.setProps({ loading: false })
    expect(root(w).classes()).not.toContain('is-loading')
    await tick(500)
    expect(root(w).classes().filter((c) => c.startsWith('is-'))).toEqual([])
  })

  it('cola del mínimo: 400 ms a la vista con is-loading, aria-busy y clic ignorado', async () => {
    const w = mount(GBtn)
    await w.setProps({ loading: true })
    await tick(250) // a la vista desde los 200
    await w.setProps({ loading: false })
    expect(root(w).classes()).toEqual(expect.arrayContaining(['is-loading', 'is-shown']))
    expect(root(w).attributes('aria-busy')).toBe('true')
    expect(root(w).attributes('aria-disabled')).toBe('true')
    await root(w).trigger('click')
    expect(w.emitted('click')).toBeUndefined()
    await tick(349)
    expect(root(w).classes()).toContain('is-loading')
    await tick(1)
    expect(root(w).classes()).not.toContain('is-loading')
    expect(root(w).attributes('aria-busy')).toBeUndefined()
    await root(w).trigger('click')
    expect(w.emitted('click')).toHaveLength(1)
  })

  it('con href la cola también deja el enlace sin href', async () => {
    const w = mount(GBtn, { props: { href: '/x', loading: true } })
    await w.setProps({ loading: false })
    expect(root(w).attributes('href')).toBeUndefined()
    await tick(400)
    expect(root(w).attributes('href')).toBe('/x')
  })

  it('is-leaving 120 ms tras una llegada que se vio, y solo entonces', async () => {
    const w = mount(GBtn, { props: { loading: true } })
    await tick(400)
    await w.setProps({ loading: false })
    expect(root(w).classes()).toContain('is-leaving')
    expect(root(w).classes()).not.toContain('is-shown')
    await tick(119)
    expect(root(w).classes()).toContain('is-leaving')
    await tick(1)
    expect(root(w).classes()).not.toContain('is-leaving')
  })

  it('una carga que vuelve quita is-leaving en el acto; en la cola, hereda la fase visible', async () => {
    const w = mount(GBtn, { props: { loading: true } })
    await tick(100)
    await w.setProps({ loading: false }) // cola: faltan 300 ms
    await w.setProps({ loading: true })
    expect(root(w).classes()).toContain('is-shown')
    await tick(1000)
    expect(root(w).classes()).toContain('is-shown')
    await w.setProps({ loading: false })
    expect(root(w).classes()).toContain('is-leaving')
    await w.setProps({ loading: true })
    expect(root(w).classes()).not.toContain('is-leaving')
    expect(root(w).classes()).not.toContain('is-shown') // carga nueva: otra vez pendiente
  })

  it('montar en carga: is-shown desde el primer render; el mínimo cuenta desde el montaje', async () => {
    const w = mount(GBtn, { props: { loading: true } })
    expect(root(w).classes()).toEqual(expect.arrayContaining(['is-loading', 'is-shown']))
    await tick(100)
    await w.setProps({ loading: false })
    await tick(299)
    expect(root(w).classes()).toContain('is-loading')
    await tick(1)
    expect(root(w).classes()).not.toContain('is-loading')
  })
})

describe('GBtn · acuse (done, doneText, #1011 y #1012)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())
  const doneEvents = (w) => (w.emitted('update:done') || []).length
  const cls = (w) => root(w).classes()

  it('en reposo: is-done, marca con pathLength, doneText en el ciclo siguiente, retirada a 960 ms y un solo update:done', async () => {
    const w = mount(GBtn, { props: { doneText: 'Guardado' } })
    expect(w.find('.g-btn__done').exists()).toBe(false)
    await w.setProps({ done: true })
    expect(cls(w)).toContain('is-done')
    const mark = w.find('.g-btn__done')
    expect(mark.attributes('aria-hidden')).toBe('true')
    expect(mark.element.parentElement).toBe(root(w).element)
    expect(mark.element.previousElementSibling.classList.contains('g-btn__loader')).toBe(true)
    expect(mark.find('path').attributes('pathLength')).toBe('1')
    expect(w.find('.g-btn__status').text()).toBe('')
    await tick(50)
    expect(w.find('.g-btn__status').text()).toBe('Guardado')
    await tick(909)
    expect(cls(w)).toContain('is-done')
    expect(doneEvents(w)).toBe(0)
    await tick(1)
    expect(cls(w)).not.toContain('is-done')
    expect(w.find('.g-btn__status').text()).toBe('')
    expect(w.emitted('update:done')).toEqual([[false]])
    expect(w.find('.g-btn__done').exists()).toBe(true) // se queda
    await w.setProps({ done: false })
    await tick(2000)
    expect(doneEvents(w)).toBe(1)
  })

  it('seguir en true no repite ni alarga', async () => {
    const w = mount(GBtn)
    await w.setProps({ done: true })
    await tick(960)
    expect(cls(w)).not.toContain('is-done')
    await w.setProps({ color: 'danger' })
    await tick(100)
    expect(cls(w)).not.toContain('is-done')
    expect(doneEvents(w)).toBe(1)
  })

  it('repetir el mismo texto lo vuelve a escribir', async () => {
    const w = mount(GBtn, { props: { doneText: 'Copiado' } })
    await w.setProps({ done: true })
    await tick(100)
    await w.setProps({ done: false })
    expect(w.find('.g-btn__status').text()).toBe('')
    await w.setProps({ done: true })
    expect(w.find('.g-btn__status').text()).toBe('')
    await tick(50)
    expect(w.find('.g-btn__status').text()).toBe('Copiado')
  })

  it('doneText que llega con done: la región se monta vacía', async () => {
    const w = mount(GBtn)
    await w.setProps({ done: true, doneText: 'Guardado' })
    expect(w.find('.g-btn__status').text()).toBe('')
    await tick(50)
    expect(w.find('.g-btn__status').text()).toBe('Guardado')
  })

  it('done y loading a false en el mismo cambio: acuse a la llegada, con y sin cola', async () => {
    const quick = mount(GBtn)
    await quick.setProps({ loading: true })
    await quick.setProps({ loading: false, done: true })
    expect(cls(quick)).toContain('is-done')

    const seen = mount(GBtn)
    await seen.setProps({ loading: true })
    await tick(250)
    await seen.setProps({ loading: false, done: true })
    expect(cls(seen)).not.toContain('is-done')
    await tick(350)
    expect(cls(seen)).toContain('is-done')
    expect(cls(seen)).toContain('is-leaving') // pueden coincidir
    expect(cls(seen)).not.toContain('is-loading')
  })

  it('done antes que el fin de la carga, y a la vez que su inicio: espera a la llegada', async () => {
    const w = mount(GBtn)
    await w.setProps({ loading: true })
    await w.setProps({ done: true })
    expect(cls(w)).not.toContain('is-done')
    await tick(1000)
    expect(cls(w)).not.toContain('is-done')
    await w.setProps({ loading: false })
    await tick(400)
    expect(cls(w)).toContain('is-done')

    const both = mount(GBtn)
    await both.setProps({ loading: true, done: true })
    expect(cls(both)).not.toContain('is-done')
    expect(both.emitted('update:done')).toBeUndefined()
    await both.setProps({ loading: false })
    expect(cls(both)).toContain('is-done')
  })

  it('done que vuelve a false antes de la llegada: no hay acuse', async () => {
    const w = mount(GBtn)
    await w.setProps({ loading: true })
    await w.setProps({ done: true })
    await w.setProps({ done: false })
    await w.setProps({ loading: false })
    await tick(1000)
    expect(cls(w)).not.toContain('is-done')
    expect(w.find('.g-btn__done').exists()).toBe(false)
  })

  it('loading a false y done en cambios seguidos: acuse al llegar el segundo', async () => {
    const w = mount(GBtn)
    await w.setProps({ loading: true })
    await w.setProps({ loading: false })
    await tick(100)
    await w.setProps({ done: true })
    expect(cls(w)).toContain('is-done')
  })

  it('un fallo es reposo: la llegada sin done no deja marca', async () => {
    const w = mount(GBtn, { props: { loading: true, doneText: 'Guardado' } })
    await tick(400)
    await w.setProps({ loading: false })
    await tick(1000)
    expect(cls(w)).not.toContain('is-done')
    expect(w.find('.g-btn__done').exists()).toBe(false)
    expect(w.find('.g-btn__status').text()).toBe('')
  })

  it('montar con done: reposo y un update:done(false), también con loading', async () => {
    const w = mount(GBtn, { props: { done: true, doneText: 'Guardado' } })
    expect(cls(w)).not.toContain('is-done')
    expect(w.find('.g-btn__done').exists()).toBe(false)
    expect(w.emitted('update:done')).toEqual([[false]])
    await tick(2000)
    expect(w.find('.g-btn__status').text()).toBe('')
    expect(doneEvents(w)).toBe(1)

    const load = mount(GBtn, { props: { done: true, loading: true } })
    expect(load.emitted('update:done')).toEqual([[false]])
    await tick(400)
    await load.setProps({ loading: false })
    expect(cls(load)).not.toContain('is-done')
  })

  it('el clic retira y actúa, en orden update:done → click y síncrono', async () => {
    const order = []
    const w = mount(GBtn, { props: { doneText: 'Guardado', 'onUpdate:done': () => order.push('done'), onClick: () => order.push('click') } })
    await w.setProps({ done: true })
    await tick(100)
    root(w).element.click()
    expect(order).toEqual(['done', 'click'])
    await w.setProps({ done: false })
    expect(cls(w)).not.toContain('is-done')
    expect(w.find('.g-btn__status').text()).toBe('')
    await tick(2000)
    expect(order).toHaveLength(2)
  })

  it('el clic del acuse no cancela un envío', async () => {
    const w = mount(GBtn, { props: { type: 'submit' } })
    await w.setProps({ done: true })
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    root(w).element.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })

  it('un clic que cierra y una acción síncrona que vuelve a afirmar: acuse nuevo (v-model)', async () => {
    const Host = {
      components: { GBtn },
      data: () => ({ ok: false, runs: 0 }),
      template: '<GBtn v-model:done="ok" done-text="Copiado" @click="ok = true; runs++">Copiar</GBtn>'
    }
    const w = mount(Host)
    root(w).element.click()
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(cls(w)).toContain('is-done')
    await tick(500)
    root(w).element.click()
    expect(cls(w)).toContain('is-done') // aún sin renderizar
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(cls(w)).toContain('is-done')
    expect(w.vm.ok).toBe(true)
    await tick(959)
    expect(cls(w)).toContain('is-done') // el tiempo vuelve a empezar
    await tick(1)
    expect(cls(w)).not.toContain('is-done')
    expect(w.vm.ok).toBe(false)
  })

  it('sin nadie que escuche update:done, un clic no es un flanco aunque done siga en true', async () => {
    const w = mount(GBtn)
    await w.setProps({ done: true })
    await root(w).trigger('click')
    await w.vm.$nextTick()
    expect(cls(w)).not.toContain('is-done')
  })

  it('loading a true retira y empieza la carga', async () => {
    const w = mount(GBtn, { props: { doneText: 'Guardado' } })
    await w.setProps({ done: true })
    await tick(60)
    await w.setProps({ loading: true })
    expect(cls(w)).not.toContain('is-done')
    expect(cls(w)).toContain('is-loading')
    expect(w.find('.g-btn__status').text()).toBe('')
    expect(w.emitted('update:done')).toEqual([[false]])
    await tick(2000)
    expect(doneEvents(w)).toBe(1)
  })

  it('disabled retira la marca con update:done, el anuncio sigue hasta DONE_MS', async () => {
    const w = mount(GBtn, { props: { doneText: 'Guardado' } })
    await w.setProps({ done: true })
    await tick(60)
    await w.setProps({ disabled: true })
    expect(cls(w)).not.toContain('is-done')
    expect(w.emitted('update:done')).toEqual([[false]])
    await w.setProps({ done: false }) // el v-model devuelve el false: no cancela el anuncio
    expect(w.find('.g-btn__status').text()).toBe('Guardado')
    await tick(899)
    expect(w.find('.g-btn__status').text()).toBe('Guardado')
    await tick(1)
    expect(w.find('.g-btn__status').text()).toBe('')
    expect(doneEvents(w)).toBe(1)
  })

  it('disabled en el mismo cambio que done: sin marca, con anuncio y update:done en el acto', async () => {
    const w = mount(GBtn, { props: { doneText: 'Guardado' } })
    await w.setProps({ done: true, disabled: true })
    expect(cls(w)).not.toContain('is-done')
    expect(w.find('.g-btn__done').exists()).toBe(false)
    expect(w.emitted('update:done')).toEqual([[false]])
    await tick(50)
    expect(w.find('.g-btn__status').text()).toBe('Guardado')
    await tick(910)
    expect(w.find('.g-btn__status').text()).toBe('')
    expect(doneEvents(w)).toBe(1)
  })

  it('la aplicación pone done en false: se retira sin emitir', async () => {
    const w = mount(GBtn, { props: { doneText: 'Guardado' } })
    await w.setProps({ done: true })
    await tick(60)
    await w.setProps({ done: false })
    expect(cls(w)).not.toContain('is-done')
    expect(w.find('.g-btn__status').text()).toBe('')
    await tick(2000)
    expect(w.emitted('update:done')).toBeUndefined()
  })

  it('done false y loading true en el mismo cambio: la retirada no emite', async () => {
    const w = mount(GBtn)
    await w.setProps({ done: true })
    await w.setProps({ done: false, loading: true })
    expect(w.emitted('update:done')).toBeUndefined()
  })

  it('desmontar no deja temporizadores ni emite', async () => {
    const onDone = vi.fn()
    const w = mount(GBtn, { props: { doneText: 'Guardado', loadingText: 'Guardando…', 'onUpdate:done': onDone } })
    await w.setProps({ loading: true })
    await tick(250)
    await w.setProps({ loading: false })
    w.unmount()
    expect(vi.getTimerCount()).toBe(0)

    const ack = mount(GBtn, { props: { doneText: 'Guardado', 'onUpdate:done': onDone } })
    await ack.setProps({ done: true })
    await tick(100)
    ack.unmount()
    expect(vi.getTimerCount()).toBe(0)
    await tick(2000)
    expect(onDone).not.toHaveBeenCalled()
  })

  it('un clic que desmonta el botón no vuelve a afirmar después', async () => {
    const Host = {
      components: { GBtn },
      data: () => ({ on: true, ok: false }),
      template: '<GBtn v-if="on" v-model:done="ok" @click="ok = true; on = false">Copiar</GBtn>'
    }
    const w = mount(Host)
    w.vm.ok = true
    await w.vm.$nextTick()
    root(w).element.click()
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('con href done se ignora: sin clases, marca, anuncio ni update:done, y doneText no crea región', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(GBtn, { props: { href: '/x', doneText: 'Guardado', done: true } })
    expect(w.emitted('update:done')).toBeUndefined()
    await w.setProps({ done: false })
    expect(warn).not.toHaveBeenCalled()
    await w.setProps({ done: true })
    await tick(2000)
    expect(cls(w)).not.toContain('is-done')
    expect(w.find('.g-btn__done').exists()).toBe(false)
    expect(w.find('.g-btn__status').exists()).toBe(false)
    expect(w.emitted('update:done')).toBeUndefined()
    expect(warn).toHaveBeenCalledWith('[Grana] <GBtn done> con href: lo que navega no vuelve, done se ignora.')
  })

  it('acuse sin doneText: la marca sale y avisa; sin región; montar con done no avisa', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(GBtn, { props: { done: true } })
    expect(warn).not.toHaveBeenCalled()
    await w.setProps({ done: false })
    await w.setProps({ done: true })
    expect(cls(w)).toContain('is-done')
    expect(w.find('.g-btn__status').exists()).toBe(false)
    expect(warn).toHaveBeenCalledWith('[Grana] <GBtn done> sin doneText: la marca se ve, pero no se anuncia a los lectores de pantalla.')
  })
})

describe('GBtn · reposo y servidor (#1014)', () => {
  it('un botón que nunca carga no llama al motor ni crea marca ni región', async () => {
    createLoadPhase.mockClear()
    const w = mount(GBtn, { slots: { default: 'Guardar' } })
    await w.setProps({ color: 'danger', disabled: true })
    expect(createLoadPhase).not.toHaveBeenCalled()
    expect(w.find('.g-btn__done').exists()).toBe(false)
    expect(w.find('.g-btn__status').exists()).toBe(false)
    await w.setProps({ disabled: false, loading: true })
    await w.setProps({ loading: false })
    await w.setProps({ loading: true })
    expect(createLoadPhase).toHaveBeenCalledOnce() // uno solo, aunque la carga se repita
  })

  it('renderToString: con done sin marca ni emitir; con loading, is-loading is-shown y sin temporizadores', async () => {
    vi.useFakeTimers()
    try {
      const onDone = vi.fn()
      const done = await renderToString(createSSRApp({ render: () => h(GBtn, { done: true, doneText: 'Guardado', 'onUpdate:done': onDone }, () => 'Guardar') }))
      expect(done).not.toContain('g-btn__done')
      expect(done).not.toContain('Guardado')
      expect(done).not.toContain('is-done')
      expect(onDone).not.toHaveBeenCalled()
      const load = await renderToString(createSSRApp({ render: () => h(GBtn, { loading: true }, () => 'Guardar') }))
      expect(load).toContain('is-loading')
      expect(load).toContain('is-shown')
      expect(load).toContain('aria-busy="true"')
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('GBtn · atributos, slots y accesibilidad', () => {
  it('los atributos del consumidor van al botón, no a la región de estado', () => {
    const w = mount(GBtn, { attrs: { id: 'guardar', 'data-test': 'x', class: 'mi-clase' } })
    const el = root(w)
    expect(el.attributes('id')).toBe('guardar')
    expect(el.attributes('data-test')).toBe('x')
    expect(el.classes()).toContain('mi-clase')
    const w2 = mount(GBtn, { props: { loadingText: 'Guardando…' }, attrs: { id: 'guardar' } })
    expect(w2.find('.g-btn__status').attributes('id')).toBeUndefined()
  })

  it('el consumidor no puede anular los atributos controlados', () => {
    const w = mount(GBtn, { props: { loading: true }, attrs: { 'aria-busy': 'false' } })
    expect(root(w).attributes('aria-busy')).toBe('true')
  })

  it('prepend y append se envuelven como decorativos', () => {
    const w = mount(GBtn, { slots: { default: 'Guardar', prepend: '<svg />', append: '<svg />' } })
    expect(w.find('.g-btn__prepend').attributes('aria-hidden')).toBe('true')
    expect(w.find('.g-btn__append').attributes('aria-hidden')).toBe('true')
  })

  it('sin slots prepend/append no renderiza sus envolturas', () => {
    const w = mount(GBtn, { slots: { default: 'Guardar' } })
    expect(w.find('.g-btn__prepend').exists()).toBe(false)
    expect(w.find('.g-btn__append').exists()).toBe(false)
  })

  it('icon sin aria-label avisa en desarrollo', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(GBtn, { props: { icon: true } })
    expect(warn).toHaveBeenCalledOnce()
  })

  it('icon con aria-label no avisa', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(GBtn, { props: { icon: true }, attrs: { 'aria-label': 'Eliminar' } })
    expect(warn).not.toHaveBeenCalled()
  })
})
