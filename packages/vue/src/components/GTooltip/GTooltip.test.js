// GTooltip · design/contracts/tooltip.md (#380 a #398) §«Verificación · bruno»: props y validadores, un hijo, semántica
// (kind, detail, atajo), nodo hermano detrás, disabled, avisos 1 a 8, matriz de componentes hijo, GBtn tooltip (#390),
// GHelper (#391) y los componentes que miden a sus hijos por JS (GFormRow, GAdaptiveLayout, GInputGroup).
// jsdom no tiene popover: showPopover/hidePopover se simulan con un atributo. El comportamiento con tiempos está en
// utils/tooltip.test.js; el de navegador real en design/lab/theme-playground/tests/tooltip.spec.mjs.
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import GTooltip from './GTooltip.vue'
import GBtn from '../GBtn/GBtn.vue'
import GIcon from '../GIcon/GIcon.vue'
import GInput from '../GInput/GInput.vue'
import GTextarea from '../GTextarea/GTextarea.vue'
import GSelect from '../GSelect/GSelect.vue'
import GNumberField from '../GNumberField/GNumberField.vue'
import GCombobox from '../GCombobox/GCombobox.vue'
import GDatePicker from '../GDatePicker/GDatePicker.vue'
import GSwitch from '../GSwitch/GSwitch.vue'
import GCheckbox from '../GCheckbox/GCheckbox.vue'
import GHelper from '../GHelper/GHelper.vue'
import GInputGroup from '../GInputGroup/GInputGroup.vue'
import GInputGroupInput from '../GInputGroup/GInputGroupInput.vue'
import GInputGroupSelect from '../GInputGroup/GInputGroupSelect.vue'
import GFormRow from '../GFormRow/GFormRow.vue'
import GAdaptiveLayout from '../GAdaptiveLayout/GAdaptiveLayout.vue'
import GFileField from '../GFileField/GFileField.vue'
import { LABELS as FF_LABELS } from '../GFileField/fileFieldTestEnv.js'
import { _state, OPEN, CLOSE } from '../../utils/tooltip.js'

beforeAll(() => {
  HTMLElement.prototype.showPopover = function () { this.setAttribute('data-test-open', '') }
  HTMLElement.prototype.hidePopover = function () { this.removeAttribute('data-test-open') }
})
const wrappers = []
const mk = (comp, opts = {}) => { const w = mount(comp, { attachTo: document.body, ...opts }); wrappers.push(w); return w }
const mkT = (template, components = {}, setup) => mk(defineComponent({ components: { GTooltip, GBtn, GIcon, ...components }, setup, template }))
afterEach(() => {
  while (wrappers.length) wrappers.pop().unmount()
  _state.lastHide = -Infinity
  _state.navAt = -Infinity
  document.body.innerHTML = ''
  vi.useRealTimers()
  vi.restoreAllMocks()
})
const quiet = () => vi.spyOn(console, 'warn').mockImplementation(() => {})
const warnings = (spy) => spy.mock.calls.map((c) => String(c[0])).filter((m) => m.includes('[Grana GTooltip]'))
const ids = (el, a) => (el.getAttribute(a) || '').split(/\s+/).filter(Boolean)
const tip = (w) => w.element.ownerDocument.querySelector('.g-tooltip')
const ev = (type, init = {}) => {
  const e = new MouseEvent(type, { bubbles: !/enter|leave/.test(type), cancelable: true, button: 0, ...init })
  Object.defineProperty(e, 'pointerType', { value: init.pointerType || 'mouse' })
  return e
}

describe('props', () => {
  it('validadores de kind y placement (los 12 de GHelper)', () => {
    const { validator: k } = GTooltip.props.kind
    const { validator: p } = GTooltip.props.placement
    expect(['auto', 'label', 'description'].every(k)).toBe(true)
    expect(k('none')).toBe(false)
    expect(['top-start', 'top', 'top-end', 'right-start', 'right', 'right-end', 'bottom-end', 'bottom', 'bottom-start', 'left-end', 'left', 'left-start'].every(p)).toBe(true)
    expect(p('center')).toBe(false)
    expect(GTooltip.props.text.required).toBe(true)
  })
})

describe('estructura y semántica', () => {
  it('clona el hijo sin envoltorio y pone el nodo role="tooltip" persistente inmediatamente detrás', async () => {
    quiet()
    const w = mkT('<div id="host"><GTooltip text="Duplicar" shortcut="Ctrl D" keyshortcuts="Control+D" id="tt"><button type="button" class="b"><svg aria-hidden="true"></svg></button></GTooltip></div>')
    await nextTick()
    const host = w.find('#host').element
    expect([...host.children].map((c) => c.className)).toEqual(['b', 'g-tooltip'])
    const [btn, node] = host.children
    expect(node.id).toBe('tt')
    expect(node.getAttribute('role')).toBe('tooltip')
    expect(node.getAttribute('popover')).toBe('manual')
    expect(node.hasAttribute('tabindex')).toBe(false)
    expect(node.querySelector('.g-tooltip__tab').getAttribute('aria-hidden')).toBe('true')
    expect(node.querySelector('.g-tooltip__body > .g-tooltip__text').id).toBe('tt-name')
    const kbd = node.querySelector('.g-tooltip__body > kbd.g-tooltip__kbd')
    expect(kbd.textContent).toBe('Ctrl D')
    expect(kbd.getAttribute('aria-hidden')).toBe('true')
    expect(btn.getAttribute('aria-labelledby')).toBe('tt-name')
    expect(btn.getAttribute('aria-keyshortcuts')).toBe('Control+D')
    expect(btn.hasAttribute('data-g-tooltip')).toBe(true)
    expect(btn.hasAttribute('title')).toBe(false)
    expect(node.hasAttribute('aria-live')).toBe(false)
  })
  it('detail: g-tooltip--detail, segunda etapa con detalle y atajo, siempre en aria-describedby', async () => {
    quiet()
    const w = mkT('<GTooltip text="Marcar" detail="Avisa al responsable" shortcut="Ctrl M" keyshortcuts="Control+M" id="t2"><button type="button" aria-describedby="mine"></button></GTooltip>')
    await nextTick()
    const node = tip(w)
    expect(node.classList.contains('g-tooltip--detail')).toBe(true)
    const more = node.querySelector('.g-tooltip__body > .g-tooltip__more > .g-tooltip__more-in')
    expect(more.querySelector('.g-tooltip__detail').id).toBe('t2-detail')
    expect(more.querySelector('kbd.g-tooltip__kbd')).not.toBe(null)
    expect(node.querySelectorAll('kbd')).toHaveLength(1)
    const btn = w.find('button').element
    expect(ids(btn, 'aria-describedby')).toEqual(['mine', 't2-detail'])
    expect(btn.getAttribute('aria-labelledby')).toBe('t2-name')
  })
  it('kind="auto": sin nombre → label; mismo nombre → label; otro nombre → description (añadido a la del hijo)', async () => {
    quiet()
    const w = mkT(`<div>
      <GTooltip text="Duplicar" id="a"><button type="button"><svg aria-hidden="true"></svg></button></GTooltip>
      <GTooltip text="Duplicar" id="b"><button type="button" aria-label="duplicar "></button></GTooltip>
      <GTooltip text="Visible para todo el equipo" id="c"><button type="button" aria-describedby="h">Publicar</button></GTooltip>
    </div>`)
    await nextTick()
    await nextTick()
    const [a, b, c] = w.findAll('button').map((x) => x.element)
    expect(a.getAttribute('aria-labelledby')).toBe('a-name')
    expect(b.getAttribute('aria-labelledby')).toBe('b-name')
    expect(c.hasAttribute('aria-labelledby')).toBe(false)
    expect(ids(c, 'aria-describedby')).toEqual(['h', 'c-name'])
  })
  it('kind explícito: label gana sobre aria-label; description describe', async () => {
    quiet()
    const w = mkT(`<div>
      <GTooltip text="Uno" kind="label" id="a"><button type="button" aria-label="Otro">Texto</button></GTooltip>
      <GTooltip text="Dos" kind="description" id="b"><button type="button"></button></GTooltip>
    </div>`)
    await nextTick()
    const [a, b] = w.findAll('button').map((x) => x.element)
    expect(a.getAttribute('aria-labelledby')).toBe('a-name')
    expect(b.getAttribute('aria-describedby')).toBe('b-name')
    expect(b.hasAttribute('aria-labelledby')).toBe(false)
  })
  it('kind="auto" se reevalúa al cambiar text y al cambiar el contenido del control', async () => {
    quiet()
    const Host = defineComponent({
      components: { GTooltip },
      data: () => ({ t: 'Guardar', label: 'Guardar' }),
      template: '<GTooltip :text="t" id="r"><button type="button">{{ label }}</button></GTooltip>'
    })
    const h2 = mk(Host)
    await nextTick(); await nextTick()
    const btn = h2.find('button').element
    expect(btn.getAttribute('aria-labelledby')).toBe('r-name')
    h2.vm.t = 'Guarda el borrador'
    await nextTick(); await nextTick()
    expect(btn.hasAttribute('aria-labelledby')).toBe(false)
    expect(ids(btn, 'aria-describedby')).toContain('r-name')
    h2.vm.label = 'Guarda el borrador'
    await nextTick()
    await new Promise((r) => setTimeout(r, 0))
    await nextTick()
    expect(btn.getAttribute('aria-labelledby')).toBe('r-name')
  })
  it('disabled: no abre y conserva las referencias', async () => {
    quiet()
    vi.useFakeTimers()
    const w = mkT('<GTooltip text="Duplicar" disabled id="d"><button type="button"></button></GTooltip>')
    await nextTick()
    const btn = w.find('button').element
    expect(btn.getAttribute('aria-labelledby')).toBe('d-name')
    btn.dispatchEvent(ev('pointerenter'))
    vi.advanceTimersByTime(OPEN * 2)
    expect(tip(w).hasAttribute('data-test-open')).toBe(false)
  })
  it('abre con el puntero sobre el elemento resuelto (hijo componente con fragmento: GBtn con loadingText)', async () => {
    quiet()
    vi.useFakeTimers()
    const w = mkT('<GTooltip text="Guardar" id="g"><GBtn icon loading-text="Guardando"><svg aria-hidden="true"></svg></GBtn></GTooltip>')
    await nextTick()
    const btn = w.find('button').element
    expect(btn.getAttribute('aria-labelledby')).toBe('g-name')
    btn.dispatchEvent(ev('pointerenter'))
    vi.advanceTimersByTime(OPEN)
    expect(tip(w).hasAttribute('data-test-open')).toBe(true)
  })
  it('desmontar retira las escuchas del documento', async () => {
    quiet()
    const w = mkT('<GTooltip text="Uno"><button type="button"></button></GTooltip>')
    await nextTick()
    expect(_state.count).toBe(1)
    w.unmount(); wrappers.pop()
    expect(_state.count).toBe(0)
    expect(_state.ac).toBe(null)
  })
})

describe('avisos de desarrollo', () => {
  it('1: varios hijos o ninguno', async () => {
    const spy = quiet()
    mkT('<div><GTooltip text="A"><button type="button"></button><button type="button"></button></GTooltip><GTooltip text="B"></GTooltip></div>')
    await nextTick()
    expect(warnings(spy).filter((m) => m.includes('exactamente un hijo'))).toHaveLength(2)
  })
  it('2: sin elemento enfocable (GIcon con label, texto): no se activa, sin referencias ni nodo', async () => {
    const spy = quiet()
    const w = mkT('<div><GTooltip text="Candado"><GIcon name="lock" label="Bloqueado" /></GTooltip><GTooltip text="X"><span class="s">texto</span></GTooltip></div>')
    await nextTick(); await nextTick()
    expect(warnings(spy).filter((m) => m.includes('enfocable')).length).toBe(2)
    expect(w.findAll('.g-tooltip')).toHaveLength(0)
    expect(w.find('[data-g-tooltip]').exists()).toBe(false)
    expect(w.find('.s').attributes('aria-labelledby')).toBeUndefined()
  })
  it('3: disabled nativo; 4: text vacío; 5: shortcut sin keyshortcuts; 6: title', async () => {
    const spy = quiet()
    mkT(`<div>
      <GTooltip text="A"><button type="button" disabled></button></GTooltip>
      <GTooltip text=" "><button type="button"></button></GTooltip>
      <GTooltip text="C" shortcut="Ctrl C"><button type="button"></button></GTooltip>
      <GTooltip text="D"><button type="button" title="D"></button></GTooltip>
    </div>`)
    await nextTick()
    const m = warnings(spy)
    expect(m.some((x) => x.includes('`disabled` nativo') && x.includes('aria-disabled'))).toBe(true)
    expect(m.some((x) => x.includes('`text` vacío'))).toBe(true)
    expect(m.some((x) => x.includes('`shortcut` sin `keyshortcuts`'))).toBe(true)
    expect(m.some((x) => x.includes('`title`'))).toBe(true)
    // Sin el texto del usuario en el mensaje
    expect(m.some((x) => x.includes('Ctrl C'))).toBe(false)
  })
  it('una vez por instancia y motivo', async () => {
    const spy = quiet()
    const Host = defineComponent({ components: { GTooltip }, data: () => ({ n: 0 }), template: '<GTooltip text="A" shortcut="x" :id="\'i\' + n"><button type="button"></button></GTooltip>' })
    const w = mk(Host)
    await nextTick()
    w.vm.n++
    await nextTick()
    expect(warnings(spy).filter((x) => x.includes('`shortcut`'))).toHaveLength(1)
  })
  it('8: GInputGroupInput y GInputGroupSelect no se admiten (sin referencias ni escuchas)', async () => {
    const spy = quiet()
    const w = mkT(`<GInputGroup label="Teléfono">
      <GTooltip text="Lada"><GInputGroupSelect part-label="Lada" :options="[{ value: '+52', label: 'MX +52' }]" model-value="+52" /></GTooltip>
      <GTooltip text="Número"><GInputGroupInput principal /></GTooltip>
    </GInputGroup>`, { GInputGroup, GInputGroupInput, GInputGroupSelect })
    await nextTick(); await nextTick()
    const m = warnings(spy)
    expect(m.some((x) => x.includes('GInputGroupInput no se admite'))).toBe(true)
    expect(m.some((x) => x.includes('GInputGroupSelect no se admite'))).toBe(true)
    expect(w.findAll('.g-tooltip')).toHaveLength(0)
    expect(w.find('[data-g-tooltip]').exists()).toBe(false)
    expect(_state.count).toBe(0)
  })
})

// Matriz de componentes hijo (tooltip.md §«El hijo»): las referencias, aria-keyshortcuts y data-g-tooltip llegan al
// elemento enfocable; la del componente (hint) se conserva. kind="description" para comprobar que se AÑADE.
const MATRIX = [
  ['GBtn (button)', { GBtn }, '<GBtn aria-describedby="own">Publicar</GBtn>', 'button'],
  ['GBtn (a)', { GBtn }, '<GBtn href="#x" aria-describedby="own">Abrir</GBtn>', 'a'],
  ['GInput', { GInput }, '<GInput label="Correo" hint="Lo usamos para avisarte" />', 'input'],
  ['GTextarea', { GTextarea }, '<GTextarea label="Nota" hint="Opcional" />', 'textarea'],
  ['GSelect', { GSelect }, '<GSelect label="País" hint="Del envío" :options="[{ value: \'mx\', label: \'México\' }]" />', '[role="combobox"]'],
  ['GNumberField', { GNumberField }, '<GNumberField label="Peso" hint="En kg" locale="es" />', 'input'],
  ['GCombobox', { GCombobox }, '<GCombobox label="Diagnóstico" hint="CIE-10" :options="[{ value: \'R51\', label: \'Cefalea\' }]" :labels="{ clear: \'Limpiar\', close: \'Cerrar\', loading: \'…\', noResults: \'Nada\', minChars: \'Min\', results: \'{count}\', partial: \'{count}\', more: \'Más\', retry: \'Otra\', useCustom: \'Usar\', custom: \'Libre\', create: \'Crear\', preview: \'Vista\', previewEmpty: \'Vacía\', surfaceTitle: \'Buscar\' }" />', 'input'],
  ['GDatePicker', { GDatePicker }, '<GDatePicker label="Fecha" hint="dd/mm/aaaa" locale="es" :labels="{ prev: \'a\', next: \'b\', dialog: \'c\', close: \'d\', today: \'e\', selected: \'f\', clear: \'g\', done: \'h\' }" />', 'button'],
  ['GSwitch', { GSwitch }, '<GSwitch label="Avisos" hint="Por correo" />', 'input'],
  ['GCheckbox', { GCheckbox }, '<GCheckbox label="Acepto" hint="Obligatorio" />', 'input'],
  ['GHelper', { GHelper }, '<GHelper aria-label="Ayuda" content-label="Ayuda" close-label="Cerrar" aria-describedby="own"><template #content>Hola</template></GHelper>', 'button.g-helper__trigger']
]
describe('matriz de componentes hijo', () => {
  for (const [name, comps, tpl, sel] of MATRIX) {
    it(`${name}: referencias, aria-keyshortcuts y data-g-tooltip en el elemento enfocable`, async () => {
      quiet()
      const w = mkT(`<GTooltip text="Pista" kind="description" keyshortcuts="Control+K" id="m">${tpl}</GTooltip>`, comps)
      await nextTick(); await nextTick()
      const all = [...document.querySelectorAll('[data-g-tooltip]')]
      expect(all, 'una sola marca').toHaveLength(1)
      const el = all[0]
      expect(el.matches(sel), `marca en ${el.outerHTML.slice(0, 80)}`).toBe(true)
      expect(el.getAttribute('aria-keyshortcuts')).toBe('Control+K')
      const d = ids(el, 'aria-describedby')
      expect(d).toContain('m-name')
      expect(d.length, 'conserva la descripción propia del componente').toBeGreaterThan(1)
      // El nodo va detrás del hijo, como hermano
      const node = document.getElementById('m')
      expect(node.previousElementSibling.contains(el) || node.previousElementSibling === el || node.previousElementSibling.matches('.g-btn__status')).toBe(true)
    })
  }
  it('kind="auto" en campos con etiqueta visible: describe, nunca sustituye la etiqueta', async () => {
    quiet()
    const w = mkT('<div><GTooltip text="Pista"><GInput label="Correo" /></GTooltip><GTooltip text="Pista"><GCheckbox label="Acepto" /></GTooltip><GTooltip text="Pista"><GSelect label="País" :options="[]" /></GTooltip></div>', { GInput, GCheckbox, GSelect })
    await nextTick(); await nextTick()
    for (const el of document.querySelectorAll('[data-g-tooltip]')) {
      expect(el.hasAttribute('aria-labelledby') && ids(el, 'aria-labelledby').some((x) => x.endsWith('-name') && x.startsWith('g-tooltip')), el.outerHTML.slice(0, 80)).toBe(false)
    }
  })
  it('GHelper: los cuatro atributos van al botón y el resto a la raíz; sin aviso de ariaLabel con aria-labelledby', async () => {
    const spy = quiet()
    const w = mkT('<GTooltip text="Ayuda del formulario" id="hh"><GHelper content-label="Ayuda" close-label="Cerrar" class="extra" data-x="1"><template #content>Hola</template></GHelper></GTooltip>', { GHelper })
    await nextTick()
    const root = w.find('.g-helper').element
    const btn = root.querySelector('.g-helper__trigger')
    expect(btn.getAttribute('aria-labelledby')).toBe('hh-name')
    expect(btn.hasAttribute('data-g-tooltip')).toBe(true)
    expect(root.hasAttribute('aria-labelledby')).toBe(false)
    expect(root.hasAttribute('data-g-tooltip')).toBe(false)
    expect(root.classList.contains('extra')).toBe(true)
    expect(root.getAttribute('data-x')).toBe('1')
    expect(spy.mock.calls.some((c) => String(c[0]).includes('necesita ariaLabel'))).toBe(false)
  })
  it('GHelper abierto (aria-expanded="true"): el tooltip no aparece', async () => {
    quiet()
    vi.useFakeTimers()
    const w = mkT('<GTooltip text="Ayuda"><GHelper aria-label="Ayuda" content-label="Ayuda" close-label="Cerrar" :adaptive="false" :open="true"><template #content>Hola</template></GHelper></GTooltip>', { GHelper })
    await nextTick(); await nextTick()
    const btn = w.find('.g-helper__trigger').element
    expect(btn.getAttribute('aria-expanded')).toBe('true')
    btn.dispatchEvent(ev('pointerenter'))
    vi.advanceTimersByTime(OPEN)
    expect(document.querySelector('.g-tooltip').hasAttribute('data-test-open')).toBe(false)
  })
})

// Caja visible (#395): data-g-tooltip-box estático en la caja de cada campo; el motor ancla en la marcada más cercana
// del elemento resuelto dentro del hijo (sin marca: el propio elemento)
const BOXES = [
  ['GInput', { GInput }, '<GInput label="Correo" prefix="@" suffix="kg" />', '.g-input__control'],
  ['GNumberField', { GNumberField }, '<GNumberField label="Peso" locale="es" decrement-label="Menos" increment-label="Más" />', '.g-input__control'],
  ['GCombobox (field)', { GCombobox }, MATRIX.find((m) => m[0] === 'GCombobox')[2], '.g-input__control'],
  ['GCombobox (palette)', { GCombobox }, MATRIX.find((m) => m[0] === 'GCombobox')[2].replace('<GCombobox ', '<GCombobox appearance="palette" '), '.g-input__control'],
  ['GTextarea', { GTextarea }, '<GTextarea label="Nota" />', '.g-textarea__control'],
  ['GSelect', { GSelect }, '<GSelect label="País" clearable :options="[{ value: \'mx\', label: \'México\' }]" model-value="mx" />', '.g-select__control'],
  ['GFileField', { GFileField }, '<GFileField label="Receta" :labels="ffLabels" />', '.g-file-field__add']
]
const fakeRects = (map) => vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
  const r = map(this) || { left: 0, top: 0, width: 0, height: 0 }
  return { ...r, x: r.left, y: r.top, right: r.left + r.width, bottom: r.top + r.height, toJSON() {} }
})
describe('caja visible (#395)', () => {
  for (const [name, comps, tpl, sel] of BOXES) {
    it(`${name}: data-g-tooltip-box en ${sel}; el tooltip ancla en esa caja (pestaña y puntero)`, async () => {
      quiet()
      vi.useFakeTimers()
      fakeRects((el) => (el.matches('[data-g-tooltip-box]') ? { left: 100, top: 50, width: 240, height: 40 } : el.matches('[data-g-tooltip]') ? { left: 113, top: 55, width: 10, height: 30 } : null))
      const w = mkT(`<GTooltip text="Pista" kind="description" id="bx">${tpl}</GTooltip>`, comps, () => ({ ffLabels: FF_LABELS }))
      await nextTick(); await nextTick()
      const boxes = [...document.querySelectorAll('[data-g-tooltip-box]')]
      expect(boxes, 'una sola caja marcada').toHaveLength(1)
      const box = boxes[0]
      expect(box.matches(sel)).toBe(true)
      expect(box.getAttribute('data-g-tooltip-box')).toBe('')
      const ctrl = document.querySelector('[data-g-tooltip]')
      expect(box.contains(ctrl) && box !== ctrl).toBe(true)
      // El puntero sobre la caja (no sobre el enfocable) abre el del campo y la pestaña mide la caja
      box.dispatchEvent(ev('pointerover', { bubbles: true }))
      box.dispatchEvent(ev('pointerenter'))
      vi.advanceTimersByTime(OPEN)
      const node = document.getElementById('bx')
      expect(node.hasAttribute('data-test-open')).toBe(true)
      expect(node.style.getPropertyValue('--_tooltip-aw')).toBe('240px')
      expect(node.style.getPropertyValue('--_tooltip-ah')).toBe('40px')
      w.unmount(); wrappers.pop()
    })
  }
  // #399: con archivos hay «Quitar» antes del campo; el resuelto es el elemento con data-g-tooltip (el <input type="file">)
  for (const n of [1, 3]) {
    it(`GFileField con ${n} archivo${n > 1 ? 's' : ''} guardado${n > 1 ? 's' : ''} (#399): el ancla es __add y el elemento resuelto el <input type="file">, no el «Quitar» de la primera ficha`, async () => {
      quiet()
      vi.useFakeTimers()
      fakeRects((el) => (el.matches('.g-file-field__add') ? { left: 100, top: 50, width: 240, height: 40 } : el.matches('.g-file-field__remove') ? { left: 10, top: 10, width: 24, height: 24 } : null))
      const stored = Array.from({ length: n }, (_, i) => ({ key: `g${i}`, name: `estudio-${i}.pdf`, size: 5, type: 'application/pdf', value: `srv-${i}` }))
      mkT('<GTooltip text="Pista" kind="description" id="fx"><GFileField label="Estudios" multiple :model-value="stored" :labels="ffLabels" /></GTooltip>', { GFileField }, () => ({ ffLabels: FF_LABELS, stored }))
      await nextTick(); await nextTick()
      const removes = [...document.querySelectorAll('.g-file-field__remove')]
      expect(removes).toHaveLength(n)
      // El primer enfocable del hijo sería el «Quitar»; las referencias están en el <input type="file">
      expect(document.querySelector('.g-file-field').querySelector('button, a[href], input, select, textarea, summary, [tabindex]')).toBe(removes[0])
      const marked = [...document.querySelectorAll('[data-g-tooltip]')]
      expect(marked).toHaveLength(1)
      expect(marked[0].matches('input[type="file"]')).toBe(true)
      for (const r of removes) expect(r.hasAttribute('data-g-tooltip') || ids(r, 'aria-describedby').includes('fx-name')).toBe(false)
      const node = document.getElementById('fx')
      // Foco por navegación en el <input>: abre; en un «Quitar»: no
      removes[0].dispatchEvent(new FocusEvent('focus')); removes[0].dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
      vi.advanceTimersByTime(OPEN)
      expect(node.hasAttribute('data-test-open')).toBe(false)
      // Puntero sobre la caja __add (ancla): abre y la pestaña mide la caja
      const box = document.querySelector('.g-file-field__add')
      expect(box.hasAttribute('data-g-tooltip-box')).toBe(true)
      box.dispatchEvent(ev('pointerover', { bubbles: true }))
      box.dispatchEvent(ev('pointerenter'))
      vi.advanceTimersByTime(OPEN)
      expect(node.hasAttribute('data-test-open')).toBe(true)
      expect(node.style.getPropertyValue('--_tooltip-aw')).toBe('240px')
      expect(node.style.getPropertyValue('--_tooltip-ah')).toBe('40px')
    })
  }
  it('sin marca (GBtn): el ancla es el propio botón', async () => {
    quiet()
    vi.useFakeTimers()
    fakeRects((el) => (el.matches('button') ? { left: 10, top: 10, width: 32, height: 32 } : null))
    const w = mkT('<GTooltip text="Duplicar" id="nb"><GBtn icon><svg aria-hidden="true"></svg></GBtn></GTooltip>')
    await nextTick()
    w.find('button').element.dispatchEvent(ev('pointerenter'))
    vi.advanceTimersByTime(OPEN)
    expect(document.getElementById('nb').style.getPropertyValue('--_tooltip-aw')).toBe('32px')
  })
  it('una marca fuera del hijo (la caja de quien lo contiene) se ignora: el ancla es el elemento resuelto', async () => {
    quiet()
    vi.useFakeTimers()
    fakeRects((el) => (el.matches('.outer') ? { left: 0, top: 0, width: 400, height: 60 } : el.matches('button') ? { left: 10, top: 10, width: 32, height: 32 } : null))
    mkT('<div class="outer" data-g-tooltip-box><span class="pre">x</span><GTooltip text="Duplicar" id="mo"><button type="button"></button></GTooltip></div>')
    await nextTick()
    const outer = document.querySelector('.outer')
    const node = document.getElementById('mo')
    // El puntero en la caja ajena no abre
    outer.querySelector('.pre').dispatchEvent(ev('pointerover', { bubbles: true }))
    outer.dispatchEvent(ev('pointerenter'))
    vi.advanceTimersByTime(OPEN * 2)
    expect(node.hasAttribute('data-test-open')).toBe(false)
    document.querySelector('button').dispatchEvent(ev('pointerenter'))
    vi.advanceTimersByTime(OPEN)
    expect(node.hasAttribute('data-test-open')).toBe(true)
    expect(node.style.getPropertyValue('--_tooltip-aw')).toBe('32px')
  })
  it('el más interno gana: un control con su propio tooltip dentro de la caja abre el suyo, no el del campo', async () => {
    quiet()
    vi.useFakeTimers()
    // Control compuesto de la aplicación: marca su caja y reenvía los atributos a su <input> (receta del contrato)
    const AppField = defineComponent({ inheritAttrs: false, template: '<div class="box" data-g-tooltip-box><input class="f" v-bind="$attrs"><slot /></div>' })
    mkT('<GTooltip text="Campo" id="out"><AppField><GTooltip text="Interior" id="in"><button type="button" class="b"></button></GTooltip></AppField></GTooltip>', { AppField })
    await nextTick(); await nextTick()
    const box = document.querySelector('.box')
    const inner = document.querySelector('.b')
    expect(document.querySelector('.f').hasAttribute('data-g-tooltip')).toBe(true)
    expect(inner.hasAttribute('data-g-tooltip')).toBe(true)
    const shown = []
    const show = HTMLElement.prototype.showPopover
    vi.spyOn(HTMLElement.prototype, 'showPopover').mockImplementation(function () { shown.push(this.id); show.call(this) })
    // Orden real: pointerover en el de debajo, luego pointerenter de fuera hacia dentro
    inner.dispatchEvent(ev('pointerover', { bubbles: true }))
    box.dispatchEvent(ev('pointerenter'))
    inner.dispatchEvent(ev('pointerenter'))
    vi.advanceTimersByTime(OPEN * 2)
    expect(shown, 'el exterior no llega a abrirse').toEqual(['in'])
    expect(document.getElementById('in').hasAttribute('data-test-open')).toBe(true)
    // Del control interior al campo: relevo al del campo
    inner.dispatchEvent(ev('pointerleave', { relatedTarget: document.querySelector('.f') }))
    document.querySelector('.f').dispatchEvent(ev('pointerover', { bubbles: true }))
    expect(document.getElementById('out').hasAttribute('data-test-open')).toBe(true)
    // Y de vuelta al interior: el exterior no se mantiene
    inner.dispatchEvent(ev('pointerover', { bubbles: true }))
    inner.dispatchEvent(ev('pointerenter'))
    vi.advanceTimersByTime(CLOSE)
    expect(document.getElementById('out').hasAttribute('data-test-open')).toBe(false)
  })
  it('controles propios de la caja (borrar de GSelect): el puntero muestra el del campo; su foco no lo abre', async () => {
    quiet()
    vi.useFakeTimers()
    mkT('<GTooltip text="País del envío" kind="description" id="cs"><GSelect label="País" clearable clear-label="Borrar" :options="[{ value: \'mx\', label: \'México\' }]" model-value="mx" /></GTooltip>', { GSelect })
    await nextTick(); await nextTick()
    const clear = document.querySelector('.g-select__clear')
    const box = document.querySelector('.g-select__control')
    expect(clear).not.toBe(null)
    expect(clear.hasAttribute('data-g-tooltip')).toBe(false)
    const node = document.getElementById('cs')
    clear.dispatchEvent(ev('pointerover', { bubbles: true }))
    box.dispatchEvent(ev('pointerenter'))
    vi.advanceTimersByTime(OPEN)
    expect(node.hasAttribute('data-test-open')).toBe(true)
    box.dispatchEvent(ev('pointerleave'))
    vi.advanceTimersByTime(OPEN)
    expect(node.hasAttribute('data-test-open')).toBe(false)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    clear.focus()
    expect(node.hasAttribute('data-test-open')).toBe(false)
  })
})

describe('GBtn tooltip (#390)', () => {
  it('icono sin aria-label: el tooltip es su nombre; estructura botón, nodo, estado; sin aviso de nombre', async () => {
    const spy = quiet()
    const w = mkT('<div id="h"><GBtn icon tooltip="Duplicar" loading-text="Duplicando"><svg aria-hidden="true"></svg></GBtn></div>')
    await nextTick(); await nextTick()
    const host = w.find('#h').element
    expect([...host.children].map((c) => c.className.split(' ')[0])).toEqual(['g-btn', 'g-tooltip', 'g-btn__status'])
    const btn = host.querySelector('button')
    const node = host.querySelector('.g-tooltip')
    expect(btn.getAttribute('aria-labelledby')).toBe(`${node.id}-name`)
    expect(node.textContent).toBe('Duplicar')
    expect(spy.mock.calls.some((c) => String(c[0]).includes('<GBtn icon> necesita'))).toBe(false)
  })
  it('aria-label igual: un nombre; distinto o con texto propio: describe', async () => {
    quiet()
    const w = mkT('<div><GBtn icon aria-label="Duplicar" tooltip="duplicar"><svg aria-hidden="true"></svg></GBtn><GBtn tooltip="Visible para todos">Publicar</GBtn><GBtn icon aria-label="Copia" tooltip="Duplicar"><svg aria-hidden="true"></svg></GBtn></div>')
    await nextTick(); await nextTick()
    const [a, b, c] = w.findAll('button').map((x) => x.element)
    expect(a.getAttribute('aria-labelledby')).toMatch(/-name$/)
    expect(b.hasAttribute('aria-labelledby')).toBe(false)
    expect(b.getAttribute('aria-describedby')).toMatch(/-name$/)
    expect(c.hasAttribute('aria-labelledby')).toBe(false)
    expect(c.getAttribute('aria-describedby')).toMatch(/-name$/)
  })
  it('sin tooltip, GBtn icon sin nombre sigue avisando', () => {
    const spy = quiet()
    mkT('<GBtn icon><svg aria-hidden="true"></svg></GBtn>')
    expect(spy.mock.calls.some((c) => String(c[0]).includes('<GBtn icon> necesita'))).toBe(true)
  })
  it('envuelto por un GTooltip (hijo directo): gana el envoltorio, un solo nodo y aviso de GBtn', async () => {
    const spy = quiet()
    const w = mkT('<GTooltip text="Copiar" id="w"><GBtn icon tooltip="Duplicar"><svg aria-hidden="true"></svg></GBtn></GTooltip>')
    await nextTick(); await nextTick()
    expect(document.querySelectorAll('.g-tooltip')).toHaveLength(1)
    expect(document.querySelector('.g-tooltip').id).toBe('w')
    expect(w.find('button').attributes('aria-labelledby')).toBe('w-name')
    expect(spy.mock.calls.some((c) => String(c[0]).includes('<GBtn tooltip> dentro de un <GTooltip>'))).toBe(true)
  })
  it('un GBtn tooltip más adentro (action de un GInput envuelto, #397) conserva el suyo', async () => {
    const spy = quiet()
    const w = mkT('<GTooltip text="Correo de la cuenta" id="outer"><GInput label="Correo"><template #action><GBtn icon variant="ghost" tooltip="Borrar"><svg aria-hidden="true"></svg></GBtn></template></GInput></GTooltip>', { GInput })
    await nextTick(); await nextTick()
    const nodes = [...document.querySelectorAll('.g-tooltip')]
    expect(nodes).toHaveLength(2)
    const inner = w.find('.g-btn').element
    expect(inner.getAttribute('aria-labelledby')).toMatch(/-name$/)
    expect(inner.getAttribute('aria-labelledby')).not.toBe('outer-name')
    expect(w.find('input').element.hasAttribute('data-g-tooltip')).toBe(true)
    // El botón va en la fila, fuera de la caja visible del campo
    expect(inner.closest('.g-input__action')).not.toBe(null)
    expect(inner.closest('[data-g-tooltip-box]')).toBe(null)
    expect(spy.mock.calls.some((c) => String(c[0]).includes('<GBtn tooltip> dentro de un <GTooltip>'))).toBe(false)
  })
  it('orden del nodo con un hijo fragmento (#398): envoltorio → botón, estado, nodo; GBtn tooltip → botón, nodo, estado', async () => {
    quiet()
    const w = mkT('<div><div id="a"><GTooltip text="Guardar"><GBtn icon loading-text="Guardando"><svg aria-hidden="true"></svg></GBtn></GTooltip></div><div id="b"><GBtn icon tooltip="Guardar" loading-text="Guardando"><svg aria-hidden="true"></svg></GBtn></div></div>')
    await nextTick(); await nextTick()
    const order = (id) => [...w.find(`#${id}`).element.children].map((c) => c.className.split(' ')[0])
    expect(order('a')).toEqual(['g-btn', 'g-btn__status', 'g-tooltip'])
    expect(order('b')).toEqual(['g-btn', 'g-tooltip', 'g-btn__status'])
    // En los dos, las referencias llegan al botón
    for (const id of ['a', 'b']) expect(w.find(`#${id} button`).attributes('aria-labelledby')).toMatch(/-name$/)
  })
  it('GBtn.props.tooltip es String sin valor por defecto', () => {
    expect(GBtn.props.tooltip.type).toBe(String)
    expect(GBtn.props.tooltip.default).toBe(undefined)
  })
})

describe('medición por JS que salta el nodo (#394)', () => {
  it('GFormRow: el nodo no recibe data-line ni variables de colocación', async () => {
    quiet()
    const w = mkT('<GFormRow><GTooltip text="Pista"><GInput label="Uno" /></GTooltip><GInput label="Dos" /></GFormRow>', { GFormRow, GInput })
    await nextTick(); await nextTick()
    const row = w.find('.g-form-row').element
    // jsdom no tiene caja (ancho 0): se fuerza una pasada con un ancho medido
    const node = row.querySelector('.g-tooltip')
    expect(node).not.toBe(null)
    expect(node.hasAttribute('data-line')).toBe(false)
    expect(node.style.getPropertyValue('--_form-row-column')).toBe('')
  })
  it('GAdaptiveLayout: visibleChild descarta el nodo aunque esté abierto', async () => {
    const { visibleChild } = await import('../GAdaptiveLayout/adaptiveProfiles.js')
    const n = document.createElement('div')
    n.className = 'g-tooltip'
    document.body.append(n)
    expect(visibleChild(n, { display: 'flex' })).toBe(false)
  })
  it('GInputGroup: un GBtn con tooltip como parte no hace avisar por el nodo hermano', async () => {
    const spy = quiet()
    mkT(`<GInputGroup label="Teléfono">
      <GInputGroupInput principal />
      <GInputGroupInput part-label="Ext." />
      <GBtn tooltip="Llamar" icon><svg aria-hidden="true"></svg></GBtn>
    </GInputGroup>`, { GInputGroup, GInputGroupInput })
    await nextTick(); await nextTick()
    const msgs = spy.mock.calls.map((c) => String(c[0])).filter((m) => m.includes('[Grana GInputGroup]') && m.includes('no es una parte'))
    expect(msgs.some((m) => m.includes('g-tooltip'))).toBe(false)
    // #397: el GBtn no es una parte (aviso 4, correcto) y el nodo no añade otro: un solo aviso
    expect(msgs).toHaveLength(1)
    expect(msgs[0]).toContain('g-btn')
  })
})
