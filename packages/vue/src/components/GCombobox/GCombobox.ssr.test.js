// @vitest-environment node
// GCombobox en el servidor · design/contracts/combobox.md «SSR»: importar y renderizar no toca document, window, navigator
// ni matchMedia. El servidor pinta el campo con la etiqueta de la opción elegida o el texto libre, la ficha, los ocultos y
// el panel cerrado; la superficie, cerrada. is-surface y el umbral móvil se resuelven al montar.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GCombobox from './GCombobox.vue'

afterEach(() => vi.restoreAllMocks())

const LABELS = { close: 'Cerrar', clear: 'Limpiar', custom: 'Texto libre', useCustom: 'Usar «{text}»', preview: 'Vista previa' }
const OPTIONS = [{ value: 'I10', code: 'I10', label: 'Hipertensión esencial', description: 'Circulatorio' }, { value: 'p1', label: 'Ana Ruiz', avatar: true }]
const render = (props) => renderToString(createSSRApp({ render: () => h(GCombobox, { label: 'Diagnóstico', labels: LABELS, options: OPTIONS, ...props }) }))

describe('SSR · GCombobox', () => {
  it('sin valor: campo vacío, panel cerrado con el listbox presente (aria-controls apunta a algo), sin avisos', async () => {
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const html = await render({ name: 'dx', id: 'c' })
    expect(html).toContain('class="g-combobox g-combobox--appearance-field g-input')
    expect(html).toMatch(/<input[^>]*id="c"[^>]*role="combobox"[^>]*aria-expanded="false"[^>]*aria-controls="c-list"/)
    expect(html).not.toMatch(/<input[^>]*id="c"[^>]*value="[^"]/)
    expect(html).toContain('<input type="hidden" name="dx" value="">')
    expect(html).toMatch(/<div id="c-popup" class="g-combobox__popup is-empty"[^>]*popover="manual">/)
    expect(html).toMatch(/<ul class="g-combobox__list" id="c-list" role="listbox"[^>]*hidden/)
    expect(html).not.toContain('role="option"')
    expect(html).toContain('id="c-live" class="g-combobox__live" role="status" aria-live="polite" aria-atomic="true"')
    expect(html).not.toContain('is-open')
    expect(html).not.toContain('is-surface')
    expect(warn).not.toHaveBeenCalled()
  })

  it('con valor: etiqueta en el campo, ficha (aria-hidden), descripción oculta y oculto con el value', async () => {
    const html = await render({ name: 'dx', id: 'c', modelValue: 'I10', clearable: true })
    expect(html).toContain('is-token')
    expect(html).toMatch(/<input[^>]*id="c"[^>]*aria-describedby="c-about"[^>]*value="Hipertensión esencial"/)
    // La ficha del valor es una GSummary inline xs pintada entera en el servidor (#356)
    expect(html).toMatch(/<span class="g-combobox__token"[^>]*aria-hidden="true">.*<span class="g-summary g-summary--layout-inline g-summary--size-xs">.*<span class="g-summary__code" dir="auto">I10<\/span>.*<span class="g-summary__title" id="[^"]+" dir="auto">Hipertensión esencial<\/span>.*<span class="g-summary__subtitle" dir="auto">Circulatorio<\/span>/)
    expect(html).not.toContain('g-combobox__token-label')
    expect(html).toContain('<span id="c-about" class="g-combobox__about">Circulatorio</span>')
    expect(html).toContain('<input type="hidden" name="dx" value="I10">')
    expect(html).toMatch(/<button id="c-clear" type="button" class="g-combobox__clear" aria-labelledby="c-clear-text c-label">/)
  })

  it('texto libre: is-custom y oculto de customName; con avatar, el GAvatar de la ficha se pinta en el servidor', async () => {
    const html = await render({ id: 'c', name: 'dx', customName: 'dx_libre', allowCustom: true, custom: 'Dolor raro' })
    expect(html).toContain('is-token is-custom')
    expect(html).toContain('<input type="hidden" name="dx_libre" value="Dolor raro">')
    expect(html).toMatch(/<span class="g-summary__lead" aria-hidden="true"><svg class="g-icon"/) // el lápiz
    expect(html).toMatch(/<span class="g-summary__title"[^>]*>Dolor raro<\/span>.*<span class="g-summary__subtitle" dir="auto">Texto libre<\/span>/)
    const html2 = await render({ id: 'c', modelValue: 'p1' })
    expect(html2).toMatch(/<span class="g-summary__lead" aria-hidden="true"><span class="g-avatar g-avatar--size-xs/)
  })

  it('appearance="palette": el servidor pinta el disparador y la superficie cerrada (un <dialog> sin contenido)', async () => {
    const html = await render({ id: 'c', appearance: 'palette' })
    expect(html).toContain('g-combobox--appearance-palette is-surface')
    expect(html).toMatch(/<input[^>]*aria-haspopup="dialog"[^>]*aria-controls="c-surface"/)
    expect(html).toMatch(/<dialog class="g-combobox-surface g-combobox-surface--palette g-dialog [^"]*g-dialog--size-lg[^"]*g-dialog--mobile-sheet[^"]*" id="c-surface"[^>]*aria-labelledby="c-surface-title"><!----><\/dialog>/)
    expect(html).not.toContain('g-combobox__search-field')
    expect(html).not.toContain('g-combobox__popup')
  })
})

describe('SSR · GCombobox multiple (combobox.md «Fase 2 · SSR y RTL»)', () => {
  const ML = { ...LABELS, selected: '{count} seleccionadas', chosen: 'Elegidas', done: 'Listo', rest: '{count} más', about: '{count}: {list}', remove: 'Quitar {label}', undo: 'Deshacer', trace: '{label} quitada', fresh: 'Nueva', customItem: '{text} (texto libre)', basketEmpty: 'Vacía' }
  it('ocultos por valor y por texto libre, frase completa (sin cesión) e ID-about; nada animado; sin tocar window', async () => {
    expect(typeof window).toBe('undefined')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const html = await render({ multiple: true, id: 'm', name: 'dx', customName: 'libre', allowCustom: true, modelValue: ['I10', 'p1'], custom: ['Gota'], labels: ML })
    expect(html).toContain('<input type="hidden" name="dx" value="I10"><input type="hidden" name="dx" value="p1">')
    expect(html).toContain('<input type="hidden" name="libre" value="Gota">')
    expect(html).toMatch(/class="g-combobox__sentence" aria-hidden="true">.*I10.*Ana Ruiz.*Gota/)
    expect(html).not.toContain('g-combobox__sentence-rest')
    expect(html).toMatch(/id="m-about"[^>]*>3: I10 Hipertensión esencial, Ana Ruiz,? \S+ Gota \(texto libre\)</)
    expect(html).toContain('g-combobox--multiple g-combobox--selection-inline has-chosen')
    expect(html).not.toMatch(/is-(rolling|ticking|entering|arriving)/)
    expect(warn.mock.calls.filter((c) => String(c[0]).includes('[Grana GCombobox]'))).toEqual([])
  })
  it('la receta (B) se pinta en el servidor, dentro de g-input__support', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const html = await render({ multiple: true, id: 'r', selection: 'list', numbered: true, modelValue: ['I10'], labels: ML })
    expect(html).toMatch(/class="g-input__support">.*class="g-input__message".*<div class="g-combobox__chosen">(<!--\[-->)?<ul class="g-combobox__rows" id="r-rows" aria-labelledby="r-label"><li data-uid="\d+" class="g-combobox__row"[^>]*><span class="g-combobox__row-number">1<\/span>/s)
    expect(html).toContain('aria-label="Quitar I10 Hipertensión esencial"')
    expect(html).not.toContain('g-combobox__sentence')
  })
})
