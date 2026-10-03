import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import GFormSection from './GFormSection.vue'
import GFormLayout from '../GFormLayout/GFormLayout.vue'
import GFormRow from '../GFormRow/GFormRow.vue'
import GFormReveal from '../GFormReveal/GFormReveal.vue'
import GInput from '../GInput/GInput.vue'
import GCheckbox from '../GCheckbox/GCheckbox.vue'

const components = { GFormSection, GFormLayout, GFormRow, GFormReveal, GInput, GCheckbox }
const mounted = []
function make(template) {
  const w = mount(defineComponent({ components, template }), { attachTo: document.body })
  mounted.push(w)
  return w
}
const warns = (spy) => spy.mock.calls.map((c) => c[0]).filter((m) => typeof m === 'string' && m.startsWith('[Grana GFormSection]') && /GFormLayout/.test(m))

afterEach(() => {
  while (mounted.length) mounted.pop().unmount()
  vi.restoreAllMocks()
})

describe('GFormSection · aviso del cuerpo (form.md §3 y §14, #283)', () => {
  it('avisa una vez con un campo directo en el cuerpo', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    make('<g-form-section title="A"><g-input label="Nombre" /><g-checkbox label="Acepto" /></g-form-section>')
    expect(warns(warn)).toHaveLength(1)
  })
  it('avisa con una GFormRow directa', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    make('<g-form-section title="A"><g-form-row><g-input label="Nombre" /></g-form-row></g-form-section>')
    expect(warns(warn)).toHaveLength(1)
  })
  it('avisa con un GFormReveal directo', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    make('<g-form-section title="A"><g-form-reveal :when="true"><g-input label="Nombre" /></g-form-reveal></g-form-section>')
    expect(warns(warn)).toHaveLength(1)
  })
  it('calla con un GFormLayout (aunque contenga campos)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    make('<g-form-section title="A"><g-form-layout><g-input label="Nombre" /><g-form-row><g-input label="Ciudad" /></g-form-row></g-form-layout></g-form-section>')
    expect(warns(warn)).toHaveLength(0)
  })
  it('calla con contenido que no son campos', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    make('<g-form-section title="A"><p>Texto</p><div class="otro">x</div></g-form-section>')
    expect(warns(warn)).toHaveLength(0)
  })
})
