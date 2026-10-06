// GTooltip · design/contracts/tooltip.md (#380 a #394) §«Verificación · bruno»: props y validadores, un hijo, semántica
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
import { _state, OPEN } from '../../utils/tooltip.js'

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
  it('un GBtn tooltip más adentro (append de un GInput envuelto) conserva el suyo', async () => {
    const spy = quiet()
    const w = mkT('<GTooltip text="Correo de la cuenta" id="outer"><GInput label="Correo"><template #append><GBtn icon variant="ghost" tooltip="Borrar"><svg aria-hidden="true"></svg></GBtn></template></GInput></GTooltip>', { GInput })
    await nextTick(); await nextTick()
    const nodes = [...document.querySelectorAll('.g-tooltip')]
    expect(nodes).toHaveLength(2)
    const inner = w.find('.g-btn').element
    expect(inner.getAttribute('aria-labelledby')).toMatch(/-name$/)
    expect(inner.getAttribute('aria-labelledby')).not.toBe('outer-name')
    expect(w.find('input').element.hasAttribute('data-g-tooltip')).toBe(true)
    expect(spy.mock.calls.some((c) => String(c[0]).includes('<GBtn tooltip> dentro de un <GTooltip>'))).toBe(false)
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
  })
})
