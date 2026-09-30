import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import GAvatarMotion from './GAvatarMotion.vue'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers() })

const endSvg = async (w) => {
  const svg = w.find('svg').element
  svg.dispatchEvent(new Event('animationend', { bubbles: true }))
  await nextTick()
}
const reduce = (on) => vi.stubGlobal('matchMedia', (q) => ({ matches: on && q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} }))

describe('GAvatarMotion · render', () => {
  it('span con clases por defecto, data-motion idle y un svg de 160×160', () => {
    const w = mount(GAvatarMotion)
    expect(w.element.tagName).toBe('SPAN')
    expect(w.classes()).toEqual(['g-avatar-motion', 'g-avatar-motion--size-md', 'g-avatar-motion--color-brand'])
    expect(w.attributes('data-motion')).toBe('idle')
    expect(w.find('svg').attributes('viewBox')).toBe('0 0 160 160')
  })

  it('las clases siguen a las props', () => {
    const w = mount(GAvatarMotion, { props: { size: 'xl', color: 'danger', idleLoop: true } })
    expect(w.classes()).toEqual(expect.arrayContaining(['g-avatar-motion--size-xl', 'g-avatar-motion--color-danger', 'g-avatar-motion--idle-loop']))
  })

  it('dibujo con clases de parte y sin colores literales', () => {
    const w = mount(GAvatarMotion)
    for (const part of ['body', 'eyes', 'antenna--start', 'antenna--end', 'legs--start', 'legs--end', 'shell', 'core', 'band', 'tip', 'eye', 'pupil', 'line']) {
      expect(w.find(`.g-avatar-motion__${part}`).exists(), part).toBe(true)
    }
    expect(w.html()).not.toMatch(/fill="|stroke="/)
  })
})

describe('GAvatarMotion · accesibilidad', () => {
  it('decorativo por defecto', () => {
    const w = mount(GAvatarMotion)
    expect(w.attributes('aria-hidden')).toBe('true')
    expect(w.attributes('role')).toBeUndefined()
  })
  it('con label: role img y aria-label', () => {
    const w = mount(GAvatarMotion, { props: { label: 'Asistente pensando' } })
    expect(w.attributes()).toMatchObject({ role: 'img', 'aria-label': 'Asistente pensando' })
    expect(w.attributes('aria-hidden')).toBeUndefined()
  })
  it('no es interactivo ni enfocable', () => {
    const w = mount(GAvatarMotion)
    expect(w.attributes('tabindex')).toBeUndefined()
    expect(w.find('svg').attributes('focusable')).toBe('false')
  })
})

describe('GAvatarMotion · estado → coreografía', () => {
  it.each([
    ['idle', 'idle'], ['hover', 'idle'], ['attention', 'idle'], ['open', 'idle'],
    ['thinking', 'thinking'], ['working', 'thinking'],
    ['success', 'success'], ['warning', 'error'], ['error', 'error']
  ])('%s → %s', (state, motion) => {
    expect(mount(GAvatarMotion, { props: { state } }).attributes('data-motion')).toBe(motion)
  })
})

describe('GAvatarMotion · coreografías finitas', () => {
  it('success: al terminar muestra reposo, emite done y update:state idle', async () => {
    reduce(false)
    const w = mount(GAvatarMotion, { props: { state: 'success' } })
    await endSvg(w)
    expect(w.attributes('data-motion')).toBe('idle')
    expect(w.emitted('done')[0]).toEqual(['success'])
    expect(w.emitted('update:state')[0]).toEqual(['idle'])
  })

  it('warning emite done con warning', async () => {
    reduce(false)
    const w = mount(GAvatarMotion, { props: { state: 'warning' } })
    await endSvg(w)
    expect(w.emitted('done')[0]).toEqual(['warning'])
  })

  it('el fin de una animación de una parte no cuenta', async () => {
    reduce(false)
    const w = mount(GAvatarMotion, { props: { state: 'success' } })
    w.find('.g-avatar-motion__eyes').element.dispatchEvent(new Event('animationend', { bubbles: true }))
    await nextTick()
    expect(w.attributes('data-motion')).toBe('success')
    expect(w.emitted('done')).toBeUndefined()
  })

  it('thinking e idle no emiten done', async () => {
    reduce(false)
    const w = mount(GAvatarMotion, { props: { state: 'thinking' } })
    await endSvg(w)
    expect(w.emitted('done')).toBeUndefined()
    expect(w.attributes('data-motion')).toBe('thinking')
  })

  it('un nuevo estado vuelve a mandar tras el reposo', async () => {
    reduce(false)
    const w = mount(GAvatarMotion, { props: { state: 'success' } })
    await endSvg(w)
    await w.setProps({ state: 'error' })
    expect(w.attributes('data-motion')).toBe('error')
    await endSvg(w)
    expect(w.emitted('done').map((e) => e[0])).toEqual(['success', 'error'])
  })

  it('con v-model:state el padre recibe idle', async () => {
    reduce(false)
    const w = mount(GAvatarMotion, { props: { state: 'success', 'onUpdate:state': (v) => w.setProps({ state: v }) } })
    await endSvg(w); await nextTick()
    expect(w.props('state')).toBe('idle')
    expect(w.attributes('data-motion')).toBe('idle')
  })
})

describe('GAvatarMotion · movimiento reducido', () => {
  it('la pose de success se mantiene --g-duration-spin y luego termina', async () => {
    vi.useFakeTimers()
    reduce(true)
    const w = mount(GAvatarMotion, { props: { state: 'idle' }, attrs: { style: '--g-duration-spin: 800ms' }, attachTo: document.body })
    await w.setProps({ state: 'success' })
    expect(w.attributes('data-motion')).toBe('success')
    vi.advanceTimersByTime(799); await nextTick()
    expect(w.attributes('data-motion')).toBe('success')
    vi.advanceTimersByTime(1); await nextTick()
    expect(w.attributes('data-motion')).toBe('idle')
    expect(w.emitted('done')[0]).toEqual(['success'])
    w.unmount()
  })

  it('acepta la duración en segundos', async () => {
    vi.useFakeTimers()
    reduce(true)
    const w = mount(GAvatarMotion, { props: { state: 'error' }, attrs: { style: '--g-duration-spin: 0.5s' }, attachTo: document.body })
    vi.advanceTimersByTime(500); await nextTick()
    expect(w.emitted('done')[0]).toEqual(['error'])
    w.unmount()
  })

  it('cambiar de estado cancela la pose pendiente', async () => {
    vi.useFakeTimers()
    reduce(true)
    const w = mount(GAvatarMotion, { props: { state: 'success' }, attrs: { style: '--g-duration-spin: 800ms' }, attachTo: document.body })
    await w.setProps({ state: 'thinking' })
    vi.advanceTimersByTime(2000); await nextTick()
    expect(w.emitted('done')).toBeUndefined()
    expect(w.attributes('data-motion')).toBe('thinking')
    w.unmount()
  })
})

describe('GAvatarMotion · validadores', () => {
  it('rechazan valores fuera de la lista', () => {
    const v = (n) => GAvatarMotion.props[n].validator
    expect(v('state')('dancing')).toBe(false)
    expect(v('state')('working')).toBe(true)
    expect(v('size')('xs')).toBe(false)
    expect(v('color')('danger')).toBe(true)
  })
})
