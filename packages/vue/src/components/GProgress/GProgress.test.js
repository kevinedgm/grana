// GProgress · showLabel (widget.md, DECISIONS.md #375): sin la etiqueta visible sigue siendo el nombre accesible; con
// showLabel y showValue a false no hay fila (barra sola: la ficha de GFileField). class y atributos van a la raíz.
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import GProgress from './GProgress.vue'

describe('GProgress · showLabel', () => {
  it('por defecto pinta la etiqueta y el valor', () => {
    const w = mount(GProgress, { props: { value: 40, label: 'Subida' } })
    expect(w.find('.g-progress__row').text()).toBe('Subida40%')
  })
  it('showLabel false: la etiqueta no se pinta, sigue en aria-label; con showValue queda la fila del valor', () => {
    const w = mount(GProgress, { props: { value: 40, label: 'Subida', showLabel: false } })
    expect(w.find('.g-progress__row').text()).toBe('40%')
    expect(w.find('[role="progressbar"]').attributes('aria-label')).toBe('Subida')
  })
  it('showLabel y showValue false: sin g-progress__row; la barra conserva nombre, valor y texto', () => {
    const w = mount(GProgress, { props: { value: 40, max: 200, label: 'Subida de a.png', valueText: 'En cola', showLabel: false, showValue: false } })
    expect(w.find('.g-progress__row').exists()).toBe(false)
    const bar = w.find('[role="progressbar"]')
    expect([bar.attributes('aria-label'), bar.attributes('aria-valuenow'), bar.attributes('aria-valuemax'), bar.attributes('aria-valuetext')]).toEqual(['Subida de a.png', '40', '200', 'En cola'])
  })
  it('class y atributos del consumidor van a la raíz', () => {
    const w = mount(GProgress, { props: { label: 'A' }, attrs: { class: 'g-file-field__progress', 'data-x': '1' } })
    expect(w.classes()).toEqual(expect.arrayContaining(['g-progress', 'g-file-field__progress']))
    expect(w.attributes('data-x')).toBe('1')
  })
  it('sin label avisa (sigue obligatoria aunque no se pinte)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(GProgress, { props: { showLabel: false, showValue: false } })
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
