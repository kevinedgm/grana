import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import GCheckboxGroup from './GCheckboxGroup.vue'
import GCheckbox from '../GCheckbox/GCheckbox.vue'

afterEach(() => vi.restoreAllMocks())

const kids = (defs) => () => defs.map(([value, extra = {}]) => h(GCheckbox, { key: value, value, label: `Opción ${value}`, ...extra }))
const make = async (props = {}, defs = [['a'], ['b'], ['c']]) => {
  const w = mount(GCheckboxGroup, { props: { label: 'Grupo', ...props }, slots: { default: kids(defs) } })
  await nextTick()
  return w
}
const boxes = (w) => w.findAll('.g-checkbox-group__list input')
const master = (w) => w.find('.g-checkbox-group__head input')

describe('GCheckboxGroup · estructura', () => {
  it('es un <fieldset> con <legend>, clases y validadores', async () => {
    const w = await make({ layout: 'chip' })
    expect(w.find('fieldset').exists()).toBe(true)
    expect(w.find('legend.g-checkbox-group__label').text()).toBe('Grupo')
    expect(w.find('.g-checkbox-group').classes()).toContain('g-checkbox-group--layout-chip')
    expect(w.find('.g-checkbox-group__list').exists()).toBe(true)
    for (const name of ['size', 'density', 'color', 'layout']) expect(GCheckboxGroup.props[name].validator('valor-invalido')).toBe(false)
  })

  it('disabled usa el atributo nativo del <fieldset>', async () => {
    const w = await make({ disabled: true })
    expect(w.find('fieldset').attributes('disabled')).toBeDefined()
  })
})

describe('GCheckboxGroup · modelo', () => {
  it('las hijas reflejan el arreglo del grupo', async () => {
    const w = await make({ modelValue: ['b'] })
    expect(boxes(w).map((b) => b.element.checked)).toEqual([false, true, false])
  })

  it('alternar una hija emite el arreglo nuevo (agrega al final o quita)', async () => {
    const w = await make({ modelValue: ['b'] })
    await boxes(w)[0].setValue(true)
    expect(w.emitted('update:modelValue')[0]).toEqual([['b', 'a']])
    await boxes(w)[1].setValue(false)
    expect(w.emitted('update:modelValue')[1]).toEqual([[]])
  })

  it('las hijas heredan size, density, color y layout del grupo; una hija puede sobrescribir', async () => {
    const w = await make({ size: 'lg', density: 'compact', color: 'accent', layout: 'card' }, [['a'], ['b', { size: 'xs', color: 'danger' }]])
    const [a, b] = w.findAll('.g-checkbox-group__list .g-checkbox')
    expect(a.classes()).toEqual(expect.arrayContaining(['g-checkbox--size-lg', 'g-checkbox--density-compact', 'g-checkbox--color-accent', 'g-checkbox--layout-card']))
    expect(b.classes()).toEqual(expect.arrayContaining(['g-checkbox--size-xs', 'g-checkbox--color-danger', 'g-checkbox--density-compact']))
  })

  it('disabled del grupo se propaga a las hijas', async () => {
    const w = await make({ disabled: true })
    expect(boxes(w).every((b) => b.attributes('disabled') !== undefined)).toBe(true)
  })

  it('avisa si una hija no tiene value', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(GCheckboxGroup, { props: { label: 'G' }, slots: { default: () => h(GCheckbox, { label: 'sin value' }) } })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('value'))
  })
})

describe('GCheckboxGroup · casilla maestra', () => {
  const opts = { selectAll: true, selectAllLabel: 'Todas' }

  it('solo se muestra con selectAll y selectAllLabel; sin etiqueta avisa', async () => {
    expect(master(await make())).toBeUndefined
    expect((await make()).find('.g-checkbox-group__head').exists()).toBe(false)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = await make({ selectAll: true })
    expect(w.find('.g-checkbox-group__head').exists()).toBe(false)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('selectAllLabel'))
    expect(master(await make(opts)).exists()).toBe(true)
  })

  it('se deriva de las hijas: ninguna, algunas (mixta) y todas', async () => {
    const w = await make({ ...opts, modelValue: [] })
    expect([master(w).element.checked, master(w).element.indeterminate]).toEqual([false, false])
    await w.setProps({ modelValue: ['a'] })
    await nextTick()
    expect([master(w).element.checked, master(w).element.indeterminate]).toEqual([false, true])
    await w.setProps({ modelValue: ['a', 'b', 'c'] })
    await nextTick()
    expect([master(w).element.checked, master(w).element.indeterminate]).toEqual([true, false])
  })

  it('al activarla mixta o vacía marca todas las habilitadas; marcada, las desmarca', async () => {
    const w = await make({ ...opts, modelValue: ['a'] })
    await master(w).setValue(true)
    expect(w.emitted('update:modelValue')[0]).toEqual([['a', 'b', 'c']])
    const w2 = await make({ ...opts, modelValue: ['a', 'b', 'c'] })
    await master(w2).setValue(false)
    expect(w2.emitted('update:modelValue')[0]).toEqual([[]])
  })

  it('ignora las hijas deshabilitadas: no cuentan y no cambian', async () => {
    const defs = [['a'], ['b'], ['c', { disabled: true }]]
    const w = await make({ ...opts, modelValue: ['c'] }, defs)
    // 'c' está marcada pero deshabilitada: no cuenta; entre las habilitadas (a, b) no hay ninguna
    expect([master(w).element.checked, master(w).element.indeterminate]).toEqual([false, false])
    await master(w).setValue(true)
    expect(w.emitted('update:modelValue')[0]).toEqual([['c', 'a', 'b']])
    const w2 = await make({ ...opts, modelValue: ['a', 'b', 'c'] }, defs)
    await master(w2).setValue(false)
    expect(w2.emitted('update:modelValue')[0]).toEqual([['c']])
  })

  it('aria-controls lista los ids de las hijas habilitadas; la maestra no es una hija', async () => {
    const w = await make({ ...opts }, [['a'], ['b'], ['c', { disabled: true }]])
    const ids = boxes(w).filter((b) => !b.element.disabled).map((b) => b.attributes('id'))
    expect(master(w).attributes('aria-controls')).toBe(ids.join(' '))
    expect(ids).toHaveLength(2)
  })

  it('hereda size, density y color del grupo, siempre con layout default', async () => {
    const w = await make({ ...opts, size: 'lg', color: 'accent', layout: 'chip' })
    const m = w.find('.g-checkbox-group__head .g-checkbox')
    expect(m.classes()).toEqual(expect.arrayContaining(['g-checkbox--size-lg', 'g-checkbox--color-accent', 'g-checkbox--layout-default']))
  })

  it('sin hijas habilitadas, la maestra queda deshabilitada', async () => {
    const w = await make({ ...opts }, [['a', { disabled: true }]])
    expect(master(w).attributes('disabled')).toBeDefined()
  })
})

describe('GCheckboxGroup · conteo, ayuda y error', () => {
  it('countText recibe (seleccionadas, total habilitadas) en una región viva', async () => {
    const countText = vi.fn((n, t) => `${n} de ${t} seleccionadas`)
    const w = await make({ countText, modelValue: ['a'] }, [['a'], ['b'], ['c', { disabled: true }]])
    const region = w.find('.g-checkbox-group__count')
    expect(region.attributes('aria-live')).toBe('polite')
    expect(region.text()).toBe('1 de 2 seleccionadas')
    await w.setProps({ modelValue: [] })
    expect(w.find('.g-checkbox-group__count').text()).toBe('0 de 2 seleccionadas')
  })

  it('sin countText no hay conteo ni cabecera (si tampoco hay selectAll)', async () => {
    const w = await make()
    expect(w.find('.g-checkbox-group__count').exists()).toBe(false)
  })

  it('error del grupo: región viva siempre presente y aria-describedby en el fieldset', async () => {
    const w = await make({ hint: 'Ayuda', id: 'g' })
    expect(w.find('.g-checkbox-group__message').attributes('aria-live')).toBe('polite')
    expect(w.find('.g-checkbox-group__message').text()).toBe('')
    expect(w.find('fieldset').attributes('aria-describedby')).toBe('g-hint')
    await w.setProps({ error: 'Elige al menos una' })
    expect(w.find('.g-checkbox-group__message').text()).toBe('Elige al menos una')
    expect(w.find('fieldset').attributes('aria-describedby')).toBe('g-hint g-message')
  })

  it('avisa sin nombre accesible', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(GCheckboxGroup)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('nombre accesible'))
  })
})
