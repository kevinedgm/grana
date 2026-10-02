import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, h } from 'vue'
import GStepper from './GStepper.vue'

const STEPS = [
  { id: 'plan', label: 'Plan', description: 'Elige tu plan' },
  { id: 'cuenta', label: 'Cuenta' },
  { id: 'pago', label: 'Pago' },
  { id: 'fin', label: 'Confirmación' },
  { id: 'rev', label: 'Revisión' }
]
const LABELS = { complete: 'completado', current: 'paso actual', pending: 'pendiente', error: 'con error', warning: 'con advertencia', disabled: 'bloqueado', optional: 'opcional', progress: 'Paso {current} de {total}', showAll: 'Ver todos', hideAll: 'Ocultar' }
const mk = (props = {}, opts = {}) =>
  mount(GStepper, { attachTo: document.body, attrs: { 'aria-label': 'Registro' }, props: { steps: STEPS, modelValue: 'cuenta', labels: LABELS, ...props }, ...opts })

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); document.body.innerHTML = '' })

describe('GStepper · estructura y clases', () => {
  it('es un <nav> con una lista ordenada y un <li> por paso', () => {
    const w = mk()
    expect(w.element.tagName).toBe('NAV')
    expect(w.find('ol.g-stepper__list').exists()).toBe(true)
    expect(w.findAll('li.g-stepper__step')).toHaveLength(5)
    w.unmount()
  })

  it('clases por defecto y por props', () => {
    const w = mk()
    expect(w.classes()).toEqual(expect.arrayContaining(['g-stepper', 'g-stepper--horizontal', 'g-stepper--indicator-number', 'g-stepper--color-brand', 'g-stepper--size-md', 'g-stepper--density-default']))
    expect(w.classes()).not.toContain('g-stepper--navigable')
    const v = mk({ orientation: 'vertical', indicator: 'segment', color: 'accent', size: 'lg', density: 'compact', navigation: 'back', disabled: true })
    expect(v.classes()).toEqual(expect.arrayContaining(['g-stepper--vertical', 'g-stepper--indicator-segment', 'g-stepper--color-accent', 'g-stepper--size-lg', 'g-stepper--density-compact', 'is-disabled']))
    expect(v.classes()).not.toContain('g-stepper--navigable')
    w.unmount(); v.unmount()
  })

  it('el resto de atributos va al <nav>', () => {
    const w = mk({}, { attrs: { 'aria-label': 'Registro', 'data-x': '1', class: 'mio' } })
    expect(w.attributes('data-x')).toBe('1')
    expect(w.classes()).toContain('mio')
    w.unmount()
  })
})

describe('GStepper · estado derivado', () => {
  it('complete antes del actual, current, pending después', () => {
    const w = mk({ modelValue: 'pago' })
    const cls = w.findAll('li').map((li) => ['is-complete', 'is-current', 'is-pending'].find((c) => li.classes().includes(c)))
    expect(cls).toEqual(['is-complete', 'is-complete', 'is-current', 'is-pending', 'is-pending'])
    w.unmount()
  })

  it('solo el actual lleva aria-current="step"', () => {
    const w = mk()
    const cur = w.findAll('[aria-current]')
    expect(cur).toHaveLength(1)
    expect(cur[0].attributes('aria-current')).toBe('step')
    expect(cur[0].text()).toContain('Cuenta')
    w.unmount()
  })

  it('sin modelValue el primero es el actual; los pasos sin id usan el índice', () => {
    const w = mk({ modelValue: undefined, steps: [{ label: 'A' }, { label: 'B' }] })
    expect(w.findAll('li')[0].classes()).toContain('is-current')
    const w2 = mk({ modelValue: 1, steps: [{ label: 'A' }, { label: 'B' }] })
    expect(w2.findAll('li')[1].classes()).toContain('is-current')
    w.unmount(); w2.unmount()
  })

  it('un modelValue desconocido deja todos pendientes y avisa', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk({ modelValue: 'nada' })
    expect(w.findAll('.is-current')).toHaveLength(0)
    expect(w.findAll('li.is-pending')).toHaveLength(5)
    expect(warn.mock.calls.some((c) => /modelValue no coincide/.test(c[0]))).toBe(true)
    w.unmount()
  })

  it('las marcas se combinan con lo derivado', () => {
    const steps = [{ id: 'a', label: 'A', status: 'warning' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C', status: 'error', disabled: true, optional: true }]
    const w = mk({ steps, modelValue: 'b' })
    const li = w.findAll('li')
    expect(li[0].classes()).toEqual(expect.arrayContaining(['is-complete', 'is-warning']))
    expect(li[2].classes()).toEqual(expect.arrayContaining(['is-pending', 'is-error', 'is-disabled', 'is-optional']))
    w.unmount()
  })

  it('conectores: hecho, saliente del actual y pendiente (uno solo por elemento)', () => {
    const w = mk({ modelValue: 'pago' })
    const cons = w.findAll('.g-stepper__connector').map((c) => ['is-done', 'is-toward', 'is-pending'].filter((k) => c.classes().includes(k)))
    expect(cons).toEqual([['is-done'], ['is-done'], ['is-toward'], ['is-pending'], ['is-pending']])
    w.unmount()
  })
})

describe('GStepper · accesibilidad', () => {
  it('el texto de estado sigue a la etiqueta, con los textos del consumidor', () => {
    const w = mk({ steps: [{ id: 'a', label: 'A', status: 'error' }, { id: 'b', label: 'B', optional: true }], modelValue: 'b' })
    const st = w.findAll('.g-stepper__status').map((s) => s.text())
    expect(st).toEqual([', completado, con error', ', paso actual, opcional'])
    w.unmount()
  })

  it('sin un texto de estado ese estado no se anuncia y se avisa una vez', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk({ labels: { current: 'actual' } })
    // Solo el actual tiene texto; los demás estados no generan nodo
    expect(w.findAll('.g-stepper__status').map((s) => s.text())).toEqual([', actual'])
    expect(warn.mock.calls.filter((c) => /faltan textos de estado/.test(c[0]))).toHaveLength(1)
    w.unmount()
  })

  it('avisa si el <nav> no tiene nombre accesible', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk({}, { attrs: {} })
    expect(warn.mock.calls.some((c) => /nombre accesible/.test(c[0]))).toBe(true)
    w.unmount()
  })

  it('el indicador es decorativo', () => {
    const w = mk()
    w.findAll('.g-stepper__indicator').forEach((i) => expect(i.attributes('aria-hidden')).toBe('true'))
    w.unmount()
  })

  it('error, advertencia, bloqueado y hecho dibujan su icono interno', () => {
    const steps = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B', status: 'error' }, { id: 'c', label: 'C', status: 'warning' }, { id: 'd', label: 'D', disabled: true }, { id: 'e', label: 'E' }]
    const w = mk({ steps, modelValue: 'e' })
    const ind = w.findAll('.g-stepper__indicator')
    ind.forEach((i, k) => expect(i.find('svg.g-icon').exists(), `paso ${k}`).toBe(k < 4))
    expect(ind[4].text()).toBe('5')
    w.unmount()
  })
})

describe('GStepper · interacción', () => {
  const buttons = (w) => w.findAll('button.g-stepper__hit').map((b) => b.text())

  it('navigation="none": ningún paso es botón', () => {
    const w = mk()
    expect(w.findAll('button.g-stepper__hit')).toHaveLength(0)
    w.unmount()
  })

  it('navigation="back": solo los anteriores al actual', () => {
    const w = mk({ navigation: 'back', modelValue: 'pago' })
    expect(buttons(w)).toHaveLength(2)
    expect(w.find('button').text()).toContain('Plan')
    expect(w.classes()).toContain('g-stepper--navigable')
    w.unmount()
  })

  it('navigation="free": todos menos el actual y los bloqueados', () => {
    const steps = STEPS.map((s, i) => (i === 3 ? { ...s, disabled: true } : s))
    const w = mk({ navigation: 'free', modelValue: 'cuenta', steps })
    expect(buttons(w)).toHaveLength(3)
    expect(w.find('.is-current button').exists()).toBe(false)
    expect(w.find('.is-disabled button').exists()).toBe(false)
    w.unmount()
  })

  it('disabled bloquea toda la navegación', () => {
    const w = mk({ navigation: 'free', disabled: true })
    expect(w.findAll('button.g-stepper__hit')).toHaveLength(0)
    w.unmount()
  })

  it('un clic emite select y update:modelValue con el id', async () => {
    const w = mk({ navigation: 'back', modelValue: 'pago' })
    await w.find('button').trigger('click')
    expect(w.emitted('select')[0][0]).toMatchObject({ id: 'plan', index: 0 })
    expect(w.emitted('update:modelValue')[0]).toEqual(['plan'])
    w.unmount()
  })

  it('select es cancelable: con preventDefault no hay update:modelValue', async () => {
    const w = mk({ navigation: 'back', modelValue: 'pago', onSelect: (e) => e.preventDefault() })
    await w.find('button').trigger('click')
    expect(w.emitted('select')).toHaveLength(1)
    expect(w.emitted('update:modelValue')).toBeUndefined()
    w.unmount()
  })

  it('el foco pasa al paso actual nuevo cuando el consumidor actualiza modelValue', async () => {
    const w = mk({ navigation: 'back', modelValue: 'pago', 'onUpdate:modelValue': (v) => w.setProps({ modelValue: v }) })
    await w.find('button').trigger('click')
    await nextTick(); await nextTick()
    expect(document.activeElement).toBe(w.find('.is-current .g-stepper__hit').element)
    w.unmount()
  })

  it('un cambio de modelValue desde fuera no emite select', async () => {
    const w = mk()
    await w.setProps({ modelValue: 'pago' })
    expect(w.emitted('select')).toBeUndefined()
    w.unmount()
  })
})

describe('GStepper · slots', () => {
  it('label y description reciben { step, index, state }', () => {
    const w = mk({}, { slots: { label: ({ step, index, state }) => `${index}:${step.id}:${state}`, description: ({ state }) => `d-${state}` } })
    expect(w.findAll('.g-stepper__label')[1].text()).toBe('1:cuenta:current')
    expect(w.findAll('.g-stepper__description')[0].text()).toBe('d-complete')
    w.unmount()
  })

  it('icon solo se usa con indicator="icon"; sin él, el número', () => {
    const slots = { icon: ({ step }) => h('i', { class: 'mi-icono' }, step.id) }
    const a = mk({ indicator: 'icon', modelValue: 'plan' }, { slots })
    expect(a.findAll('.mi-icono')).toHaveLength(5)
    const b = mk({ indicator: 'number', modelValue: 'plan' }, { slots })
    expect(b.findAll('.mi-icono')).toHaveLength(0)
    a.unmount(); b.unmount()
  })

  it('content solo en vertical: el del actual, o todos con expandAll', () => {
    const slots = { content: ({ step }) => `contenido ${step.id}` }
    const h1 = mk({ orientation: 'horizontal' }, { slots })
    expect(h1.findAll('.g-stepper__content')).toHaveLength(0)
    const v = mk({ orientation: 'vertical' }, { slots })
    expect(v.findAll('.g-stepper__content').map((c) => c.text())).toEqual(['contenido cuenta'])
    const all = mk({ orientation: 'vertical', expandAll: true }, { slots })
    expect(all.findAll('.g-stepper__content')).toHaveLength(5)
    h1.unmount(); v.unmount(); all.unmount()
  })
})

describe('GStepper · opcional y descripción', () => {
  it('el texto visible «opcional» sale de labels.optional', () => {
    const w = mk({ steps: [{ id: 'a', label: 'A', optional: true }], modelValue: 'a' })
    expect(w.find('.g-stepper__optional').text()).toBe('(opcional)')
    w.unmount()
  })
  it('la descripción solo existe si se da', () => {
    const w = mk()
    expect(w.findAll('.g-stepper__description')).toHaveLength(1)
    w.unmount()
  })
})

describe('GStepper · compacto y adaptación', () => {
  it('responsive="compact": resumen, barra y botón; la lista completa queda oculta (para medir)', async () => {
    const w = mk({ responsive: 'compact' })
    expect(w.classes()).toContain('g-stepper--is-compact')
    expect(w.find('.g-stepper__summary-name').text()).toBe('Cuenta')
    expect(w.find('.g-stepper__summary-count').text()).toBe('Paso 2 de 5')
    expect(w.findAll('.g-stepper__bar-seg')).toHaveLength(5)
    // La lista completa sigue en el DOM como hija directa (el CSS la oculta en compacto); no hay lista desplegada
    expect(w.findAll('nav > ol.g-stepper__list')).toHaveLength(1)
    expect(w.find('.g-stepper__compact ol').exists()).toBe(false)
    expect(w.find('.g-stepper__compact').element.nextElementSibling.classList.contains('g-stepper__list')).toBe(true)
    const tog = w.find('.g-stepper__toggle')
    expect(tog.attributes('aria-expanded')).toBe('false')
    expect(tog.text()).toBe('Ver todos')
    w.unmount()
  })

  it('el botón despliega la lista vertical numerada, y cambia su nombre', async () => {
    const w = mk({ responsive: 'compact', indicator: 'icon', navigation: 'back', modelValue: 'pago' }, { slots: { icon: () => h('i', { class: 'mi-icono' }) } })
    await w.find('.g-stepper__toggle').trigger('click')
    const tog = w.find('.g-stepper__toggle')
    expect(tog.attributes('aria-expanded')).toBe('true')
    expect(tog.text()).toBe('Ocultar')
    const list = w.find('.g-stepper__compact ol')
    expect(list.attributes('id')).toBe(tog.attributes('aria-controls'))
    expect(list.findAll('li')).toHaveLength(5)
    expect(list.findAll('.mi-icono')).toHaveLength(0) // siempre numerada
    expect(list.findAll('button.g-stepper__hit')).toHaveLength(2)
    w.unmount()
  })

  it('sin labels.progress se muestran solo los números; sin showAll no hay botón', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk({ responsive: 'compact', labels: {} })
    expect(w.find('.g-stepper__summary-count').text()).toBe('2/5')
    expect(w.find('.g-stepper__toggle').exists()).toBe(false)
    expect(warn.mock.calls.some((c) => /labels\.showAll/.test(c[0]))).toBe(true)
    w.unmount()
  })

  describe('medición por contenedor (tramos por ancho natural, #151)', () => {
    // Anchos naturales que «mide» la lista según las clases de la raíz durante la lectura (--measure)
    let NEEDS
    let width
    const listWidth = (nav) => {
      if (!nav.classList.contains('g-stepper--measure')) return width
      if (nav.classList.contains('g-stepper--current-only')) return NEEDS.current
      if (nav.classList.contains('g-stepper--condensed')) return NEEDS.condensed
      return NEEDS.full
    }
    const stub = (w, needs = { full: 640.4, condensed: 520, current: 300 }) => {
      let cb
      width = w
      NEEDS = needs
      vi.stubGlobal('ResizeObserver', class { constructor(fn) { cb = fn } observe() {} disconnect() {} })
      vi.stubGlobal('requestAnimationFrame', (fn) => { fn(); return 0 }) // el cuadro siguiente, de inmediato
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
        const v = this.classList.contains('g-stepper__list') && this.parentElement.classList.contains('g-stepper') ? listWidth(this.parentElement) : width
        return { width: v, height: 0, top: 0, left: 0, right: v, bottom: 0 }
      })
      return { resize: (nw) => { width = nw; cb([{ contentRect: { width: nw } }]) } }
    }
    const tiers = (w) => ['g-stepper--condensed', 'g-stepper--current-only', 'g-stepper--is-compact'].filter((c) => w.classes().includes(c))

    it('amplio: cabe la lista con descripciones → completo, sin clase de tramo', async () => {
      stub(641) // 640.4 redondeado hacia arriba: cabe justo
      const w = mk(); await nextTick()
      expect(tiers(w)).toEqual([])
      expect(w.findAll('.g-stepper__description')).toHaveLength(1)
      w.unmount()
    })

    it('intermedio: no caben las descripciones → condensado (sin descripciones, títulos enteros)', async () => {
      stub(640)
      const w = mk(); await nextTick()
      expect(tiers(w)).toEqual(['g-stepper--condensed'])
      w.unmount()
    })

    it('estrecho: no caben todos los títulos → solo el actual con texto; los demás conservan su nombre accesible', async () => {
      stub(400)
      const w = mk({ navigation: 'free' }); await nextTick()
      expect(tiers(w)).toEqual(['g-stepper--current-only'])
      // El texto de cada paso sigue en el DOM (el CSS lo oculta visualmente): cada botón conserva su nombre
      const hits = w.findAll('button.g-stepper__hit')
      expect(hits.map((b) => b.find('.g-stepper__label').text())).toEqual(['Plan', 'Pago', 'Confirmación', 'Revisión'])
      expect(w.find('.is-current .g-stepper__label').text()).toBe('Cuenta')
      expect(w.find('.g-stepper__compact').exists()).toBe(false)
      w.unmount()
    })

    it('muy estrecho: ni el actual cabe → compacto', async () => {
      stub(299)
      const w = mk(); await nextTick()
      expect(tiers(w)).toEqual(['g-stepper--is-compact'])
      expect(w.find('.g-stepper__summary-name').text()).toBe('Cuenta')
      w.unmount()
    })

    it('la lectura deja la raíz como estaba (sin --measure ni tramos ajenos)', async () => {
      stub(400)
      const w = mk(); await nextTick()
      expect(w.classes()).not.toContain('g-stepper--measure')
      expect(w.classes()).toContain('g-stepper--current-only')
      expect(w.classes()).toEqual(expect.arrayContaining(['g-stepper', 'g-stepper--horizontal', 'g-stepper--indicator-number']))
      w.unmount()
    })

    it('el umbral sale del contenido: el mismo ancho da tramos distintos según lo que mide la lista', async () => {
      stub(700, { full: 640, condensed: 500, current: 300 })
      const corto = mk(); await nextTick()
      expect(tiers(corto)).toEqual([])
      corto.unmount()
      stub(700, { full: 1400, condensed: 1200, current: 520 })
      const largo = mk(); await nextTick()
      expect(tiers(largo)).toEqual(['g-stepper--current-only'])
      largo.unmount()
    })

    it('vuelve a medir cuando cambia el contenido (pasos o paso actual)', async () => {
      stub(700, { full: 640, condensed: 500, current: 300 })
      const w = mk(); await nextTick()
      expect(tiers(w)).toEqual([])
      NEEDS = { full: 900, condensed: 800, current: 600 } // p. ej. títulos más largos
      await w.setProps({ steps: STEPS.map((s) => ({ ...s, label: s.label + ' con un texto mucho más largo' })) }); await nextTick()
      expect(tiers(w)).toEqual(['g-stepper--current-only'])
      NEEDS = { full: 900, condensed: 800, current: 720 } // el nuevo actual tiene un título más largo
      await w.setProps({ modelValue: 'fin' }); await nextTick()
      expect(tiers(w)).toEqual(['g-stepper--is-compact'])
      w.unmount()
    })

    it('reacciona al ancho del contenedor en ambos sentidos, también desde compacto', async () => {
      const { resize } = stub(700)
      const w = mk(); await nextTick()
      expect(tiers(w)).toEqual([])
      resize(600); await nextTick()
      expect(tiers(w)).toEqual(['g-stepper--condensed'])
      resize(350); await nextTick()
      expect(tiers(w)).toEqual(['g-stepper--current-only'])
      resize(200); await nextTick()
      expect(tiers(w)).toEqual(['g-stepper--is-compact'])
      resize(900); await nextTick() // en compacto la lista oculta sigue midiéndose
      expect(tiers(w)).toEqual([])
      w.unmount()
    })

    it('al salir de compacto se cierra la lista desplegada', async () => {
      const { resize } = stub(200)
      const w = mk(); await nextTick()
      await w.find('.g-stepper__toggle').trigger('click')
      expect(w.find('.g-stepper__compact ol').exists()).toBe(true)
      resize(900); await nextTick(); await nextTick()
      expect(w.find('.g-stepper__compact').exists()).toBe(false)
      resize(200); await nextTick()
      expect(w.find('.g-stepper__toggle').attributes('aria-expanded')).toBe('false')
      w.unmount()
    })

    it('el foco tras activar un paso desde la lista desplegada queda en esa lista, no en la oculta', async () => {
      stub(200)
      const w = mk({ navigation: 'back', modelValue: 'pago', 'onUpdate:modelValue': (v) => w.setProps({ modelValue: v }) })
      await nextTick()
      await w.find('.g-stepper__toggle').trigger('click')
      await w.findAll('.g-stepper__compact button.g-stepper__hit')[0].trigger('click')
      await nextTick(); await nextTick()
      const active = document.activeElement
      expect(active.closest('.g-stepper__compact')).not.toBeNull()
      expect(active.closest('.g-stepper__step').classList.contains('is-current')).toBe(true)
      w.unmount()
    })

    it('vertical y responsive="never" no miden ni cambian de tramo', async () => {
      stub(200)
      const v = mk({ orientation: 'vertical' }); await nextTick()
      const n = mk({ responsive: 'never' }); await nextTick()
      expect(tiers(v)).toEqual([])
      expect(tiers(n)).toEqual([])
      v.unmount(); n.unmount()
    })

    it('sin medición (sin ResizeObserver ni maquetación) se renderiza completo', async () => {
      const w = mk(); await nextTick()
      expect(tiers(w)).toEqual([])
      w.unmount()
    })
  })
})

describe('GStepper · validadores', () => {
  it('rechazan valores fuera de la lista', () => {
    const v = (name) => GStepper.props[name].validator
    expect(v('orientation')('diagonal')).toBe(false)
    expect(v('indicator')('icon')).toBe(true)
    expect(v('indicator')('bar')).toBe(false)
    expect(v('navigation')('free')).toBe(true)
    expect(v('responsive')('x')).toBe(false)
    expect(v('size')('xl')).toBe(false)
    expect(v('density')('compact')).toBe(true)
    expect(v('color')('danger')).toBe(true)
  })
})
