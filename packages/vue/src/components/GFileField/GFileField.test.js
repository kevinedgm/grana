// GFileField · design/contracts/file-field.md (#366 a #379): modelo y conciliación por key, validación, adaptador y cola,
// envío, semántica, foco, anuncios, arrastre de página y avisos. Con GForm (error propio, #372): GFileField.form.test.js.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import GFileField from './GFileField.vue'
import { LABELS, file, filesEvent, flush, frame, liveText, manualUploader, withLayout } from './fileFieldTestEnv.js'
import { installTopLayer } from '../GSpeechHost/speechTestEnv.js'

enableAutoUnmount(afterEach)
let warn
beforeEach(() => { warn = vi.spyOn(console, 'warn').mockImplementation(() => {}) })
afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})
const warnings = () => warn.mock.calls.map((c) => String(c[0])).filter((m) => m.startsWith('[Grana GFileField]'))

const mk = (props = {}, opts = {}) => mount(GFileField, { props: { label: 'Fotos', labels: LABELS, ...props }, attachTo: document.body, ...opts })
const chips = (w) => w.findAll('.g-file-field__chip')
const lastModel = (w) => w.emitted('update:modelValue')?.at(-1)?.[0]
const input = (w) => w.find('input[type="file"]')

/** Envoltorio con v-model real (la aplicación guarda la lista) */
function withModel(initial = [], props = {}) {
  const model = ref(initial)
  const Host = defineComponent({
    setup: () => () => h(GFileField, { label: 'Fotos', labels: LABELS, ...props, modelValue: model.value, 'onUpdate:modelValue': (v) => { model.value = v } })
  })
  const w = mount(Host, { attachTo: document.body })
  return { w, model, f: () => w.findComponent(GFileField) }
}

describe('GFileField · estructura accesible (#374)', () => {
  it('tres hijos en flujo, el control es el <input type="file"> con nombre compuesto (etiqueta + cara) y la región viva vacía', () => {
    const w = mk({ id: 'ff', hint: 'PNG · hasta 8 MB', multiple: true })
    const root = w.element
    expect([...root.children].map((c) => c.className.split(' ')[0])).toEqual(['g-file-field__label', 'g-file-field__box', 'g-file-field__foot', 'g-file-field__live'])
    const i = input(w)
    expect(i.attributes('id')).toBe('ff')
    expect(i.classes()).toContain('g-file-field__input')
    expect(i.attributes('aria-labelledby')).toBe('ff-label ff-action')
    expect(w.find('#ff-action').text()).toBe('Adjuntar archivos')
    expect(i.attributes('aria-describedby')).toBe('ff-hint ff-status')
    expect(i.attributes('aria-invalid')).toBeUndefined()
    expect(i.attributes('required')).toBeUndefined()
    const live = w.find('.g-file-field__live')
    expect([live.attributes('role'), live.attributes('aria-live'), live.attributes('aria-atomic')]).toEqual(['status', 'polite', 'true'])
    expect(live.text()).toBe('')
    // Vacía y editable: la pista se copia junto a la cara (aria-hidden) y la del pie sigue en la descripción
    expect(w.find('.g-file-field__add-hint').attributes('aria-hidden')).toBe('true')
    expect(w.find('.g-file-field__add-hint').text()).toBe('PNG · hasta 8 MB')
    expect(w.find('#ff-hint').text()).toBe('PNG · hasta 8 MB')
    expect(w.find('.g-file-field__list').exists()).toBe(false)
    expect(w.find('.g-file-field__target').attributes('aria-hidden')).toBe('true')
    expect(w.find('.g-file-field__message').text()).toBe('')
  })

  it('clases de la raíz según props (como GInput) e is-ready tras montar', async () => {
    const w = mk({ size: 'lg', variant: 'soft', density: 'compact', rounded: 'pill', block: true, multiple: true })
    expect(w.classes()).toEqual(expect.arrayContaining(['g-file-field', 'g-file-field--size-lg', 'g-file-field--variant-soft', 'g-file-field--density-compact', 'g-file-field--rounded-pill', 'g-file-field--block', 'is-multiple']))
    expect(w.classes()).not.toContain('is-ready')
    await frame()
    await frame()
    expect(w.classes()).toContain('is-ready')
  })

  it('aria-required sin required nativo; aria-describedby del consumidor al final; aria-invalid y type del consumidor se ignoran (aviso 7)', () => {
    const w = mk({ id: 'ff', required: true }, { attrs: { 'aria-describedby': 'extra', 'aria-invalid': 'true', type: 'text', 'data-x': '1', capture: 'environment', class: 'mine', style: 'color: red' } })
    const i = input(w)
    expect(i.attributes('aria-required')).toBe('true')
    expect(i.attributes('required')).toBeUndefined()
    expect(i.attributes('aria-describedby')).toBe('ff-status extra')
    expect(i.attributes('aria-invalid')).toBeUndefined()
    expect(i.attributes('type')).toBe('file')
    expect(i.attributes('data-x')).toBe('1')
    expect(i.attributes('capture')).toBe('environment')
    expect(w.classes()).toContain('mine')
    expect(w.attributes('style')).toContain('color')
    expect(i.classes()).not.toContain('mine')
    expect(warnings().some((m) => /aria-invalid/.test(m))).toBe(true)
    expect(warnings().some((m) => /se ignora el atributo type/.test(m))).toBe(true)
  })

  it('sin label: aria-label o aria-labelledby del consumidor sustituyen a la etiqueta en el nombre; sin nada, aviso 1', () => {
    const a = mk({ label: undefined, id: 'a' }, { attrs: { 'aria-label': 'Comprobante' } })
    expect(input(a).attributes('aria-labelledby')).toBe('a-alabel a-action')
    expect(a.find('#a-alabel').text()).toBe('Comprobante')
    expect(input(a).attributes('aria-label')).toBeUndefined()
    const b = mk({ label: undefined, id: 'b' }, { attrs: { 'aria-labelledby': 'ext' } })
    expect(input(b).attributes('aria-labelledby')).toBe('ext b-action')
    expect(warnings().some((m) => /nombre accesible/.test(m))).toBe(false)
    mk({ label: undefined })
    expect(warnings().some((m) => /nombre accesible/.test(m))).toBe(true)
  })

  it('aviso 8: dentro de un GFieldGroup; reservados appearance y expected (aviso 7)', async () => {
    const { default: GFieldGroup } = await import('../GFieldGroup/GFieldGroup.vue')
    mount(GFieldGroup, { props: { label: 'Docs' }, slots: { default: () => h(GFileField, { label: 'INE', labels: LABELS }) }, attachTo: document.body })
    await nextTick()
    expect(warnings().some((m) => /GInputGroup o un GFieldGroup/.test(m))).toBe(true)
    mk({}, { attrs: { appearance: 'gallery', expected: [] } })
    expect(warnings().filter((m) => /reservado/.test(m))).toHaveLength(2)
  })

  it('aviso 2: textos que hacen falta al montar (cara, estado, botones; con uploader, retry, pending y failed)', () => {
    mk({ labels: {}, uploader: () => new Promise(() => {}), multiple: true, max: 3 })
    const w = warnings().join('\n')
    for (const k of ['addMany', 'status', 'remove', 'cancel', 'retry', 'pending', 'failed', 'full']) expect(w, k).toContain(`labels.${k}`)
  })

  it('aviso 3: max sin multiple; concurrency inválida', () => {
    mk({ max: 3 })
    mk({ multiple: true, concurrency: 0 })
    const w = warnings().join('\n')
    expect(w).toMatch(/max solo actúa con multiple/)
    expect(w).toMatch(/concurrency debe ser un entero/)
  })
})

describe('GFileField · añadir y validar (#370)', () => {
  it('add() devuelve lo añadido y lo rechazado; update:modelValue, change (via api) y reject; un anuncio por gesto', async () => {
    const w = mk({ multiple: true, accept: 'image/*', maxSize: 100, max: 3 })
    const r = w.vm.add([file('a.png', 10), file('doc.pdf', 10, 'application/pdf'), file('big.png', 500), file('vacio.png', 0)])
    expect(r.added.map((e) => e.name)).toEqual(['a.png'])
    expect(r.rejected.map((x) => [x.name, x.reason])).toEqual([['doc.pdf', 'type'], ['big.png', 'size'], ['vacio.png', 'empty']])
    const model = lastModel(w)
    expect(model).toHaveLength(1)
    expect(model[0]).toMatchObject({ name: 'a.png', size: 10, type: 'image/png', state: 'ready', value: null, url: null, error: null })
    expect(model[0].file).toBeInstanceOf(File)
    expect(typeof model[0].key).toBe('string')
    expect(w.emitted('change')).toHaveLength(1)
    expect(w.emitted('change')[0][0]).toMatchObject({ via: 'api', removed: [] })
    expect(w.emitted('change')[0][0].added[0].name).toBe('a.png')
    expect(w.emitted('reject')[0][0].via).toBe('api')
    expect(w.emitted('reject')[0][0].items.map((i) => i.reason)).toEqual(['type', 'size', 'empty'])
    // El orden de eventos: update:modelValue antes que change
    expect(await liveText(w)).toBe('Añadido a.png. No se añadieron 3 archivos: doc.pdf, no es un tipo admitido; big.png, pesa 500 byte, el máximo es 100 byte; vacio.png, está vacío.')
  })

  it('aviso de no añadidos: role group con nombre, motivo en texto, no desaparece solo, «Descartar» devuelve el foco; el siguiente gesto lo sustituye', async () => {
    const w = mk({ multiple: true, accept: '.pdf', id: 'ff' })
    w.vm.add([file('a.png')])
    await nextTick()
    const n = w.find('.g-file-field__notice')
    expect(n.attributes('role')).toBe('group')
    expect(n.attributes('aria-label')).toBe('Archivos no añadidos')
    expect(n.find('li').text()).toBe('a.png: no es un tipo admitido')
    await new Promise((r) => setTimeout(r, 100))
    expect(w.find('.g-file-field__notice').exists()).toBe(true)
    await n.find('button').trigger('click')
    expect(w.find('.g-file-field__notice').exists()).toBe(false)
    expect(document.activeElement.id).toBe('ff')
    w.vm.add([file('b.png')])
    await nextTick()
    expect(w.find('.g-file-field__notice').exists()).toBe(true)
    w.vm.add([file('c.pdf', 5, 'application/pdf')])
    await nextTick()
    expect(w.find('.g-file-field__notice').exists()).toBe(false)
  })

  it('multiple suma cada gesto; duplicado por name, size y lastModified; número por max (entran los primeros)', () => {
    const w = mk({ multiple: true, max: 3 })
    w.vm.add([file('a.png')])
    w.vm.add([file('b.png'), file('a.png')])
    expect(lastModel(w).map((e) => e.name)).toEqual(['a.png', 'b.png'])
    expect(w.emitted('reject').at(-1)[0].items[0].reason).toBe('duplicate')
    const r = w.vm.add([file('c.png'), file('d.png')])
    expect(r.added.map((e) => e.name)).toEqual(['c.png'])
    expect(r.rejected).toEqual([expect.objectContaining({ name: 'd.png', reason: 'count' })])
  })

  it('sin multiple: el nuevo reemplaza (change.removed lleva el anterior, anuncio replaced); de varios entra el primero válido', async () => {
    const w = mk({ accept: 'image/*' })
    w.vm.add([file('uno.png')])
    await liveText(w)
    const r = w.vm.add([file('mal.pdf', 5, 'application/pdf'), file('dos.png'), file('tres.png')])
    expect(r.added.map((e) => e.name)).toEqual(['dos.png'])
    expect(r.rejected.map((x) => x.reason)).toEqual(['type', 'count'])
    expect(lastModel(w).map((e) => e.name)).toEqual(['dos.png'])
    expect(w.emitted('change').at(-1)[0].removed.map((e) => e.name)).toEqual(['uno.png'])
    expect(await liveText(w)).toMatch(/^uno\.png reemplazado por dos\.png\. No se añadieron 2 archivos/)
    await nextTick()
    expect(w.find('.g-file-field__action').text()).toBe('Cambiar archivo')
  })

  it('sin multiple, reemplazar un archivo que sube cancela su subida (signal) y un guardado sale de la lista', async () => {
    const up = manualUploader()
    const { w, model } = withModel([{ key: 'g1', name: 'viejo.pdf', size: 5, type: 'application/pdf', value: 'srv-1' }], { uploader: up })
    await flush()
    w.findComponent(GFileField).vm.add([file('a.png')])
    await flush()
    expect(model.value.map((e) => e.key).includes('g1')).toBe(false)
    expect(up.calls).toHaveLength(1)
    w.findComponent(GFileField).vm.add([file('b.png')])
    await flush()
    expect(up.calls[0].signal.aborted).toBe(true)
    expect(model.value.map((e) => e.name)).toEqual(['b.png'])
  })

  it('lleno (max alcanzado): is-full, cara {count} de {max}, aria-disabled, el clic no abre el diálogo y pegar rechaza con count', async () => {
    const w = mk({ multiple: true, max: 2 })
    w.vm.add([file('a.png'), file('b.png')])
    await nextTick()
    expect(w.classes()).toContain('is-full')
    expect(w.find('.g-file-field__action').text()).toBe('2 de 2')
    expect(input(w).attributes('aria-disabled')).toBe('true')
    expect(input(w).attributes('disabled')).toBeUndefined()
    const click = new MouseEvent('click', { cancelable: true })
    input(w).element.dispatchEvent(click)
    expect(click.defaultPrevented).toBe(true)
    const clickSpy = vi.spyOn(input(w).element, 'click')
    w.vm.open()
    await w.find('.g-file-field__box').trigger('click')
    expect(clickSpy).not.toHaveBeenCalled()
    filesEvent('paste', [file('c.png')], { target: input(w).element })
    expect(w.emitted('reject').at(-1)[0]).toMatchObject({ via: 'paste', items: [expect.objectContaining({ reason: 'count' })] })
  })

  it('elegir en el diálogo (change nativo, via picker); una selección vacía no borra ni emite', async () => {
    const w = mk({ multiple: true })
    const el = input(w).element
    Object.defineProperty(el, 'files', { configurable: true, value: [file('a.png'), file('b.png')] })
    el.dispatchEvent(new Event('change', { bubbles: true }))
    expect(lastModel(w).map((e) => e.name)).toEqual(['a.png', 'b.png'])
    expect(w.emitted('change')[0][0].via).toBe('picker')
    const n = w.emitted('update:modelValue').length
    Object.defineProperty(el, 'files', { configurable: true, value: [] })
    el.dispatchEvent(new Event('change', { bubbles: true }))
    expect(w.emitted('update:modelValue')).toHaveLength(n)
    expect(w.emitted('change')).toHaveLength(1)
  })

  it('pegar con el foco en el control (via paste): sin archivos no hace nada; lo valida accept (por MIME)', () => {
    const w = mk({ multiple: true, accept: 'image/*' })
    const empty = filesEvent('paste', [], { target: input(w).element })
    expect(empty.defaultPrevented).toBe(false)
    const ev = filesEvent('paste', [file('captura.png'), file('nota.txt', 5, 'text/plain')], { target: input(w).element })
    expect(ev.defaultPrevented).toBe(true)
    expect(w.emitted('change')[0][0].via).toBe('paste')
    expect(w.emitted('reject')[0][0]).toMatchObject({ via: 'paste', items: [expect.objectContaining({ name: 'nota.txt', reason: 'type' })] })
  })

  it('el @change del consumidor recibe el objeto, no el evento nativo; su @paste ya ve la lista actualizada (manejadores primero)', () => {
    const onChange = vi.fn()
    let seen = null
    const w = mk({ multiple: true, onChange }, { attrs: { onPaste: () => { seen = (w.emitted('update:modelValue') || []).length } } })
    filesEvent('paste', [file('a.png')], { target: input(w).element })
    expect(seen).toBe(1)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0]).toMatchObject({ via: 'paste' })
    const el = input(w).element
    Object.defineProperty(el, 'files', { configurable: true, value: [] })
    el.dispatchEvent(new Event('change'))
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('solo lectura y deshabilitado: add() no hace nada; sin acciones en la ficha; aria-disabled / disabled nativo', async () => {
    const stored = [{ key: 'g1', name: 'receta.pdf', size: 5, type: 'application/pdf', value: 'srv-1' }]
    const ro = mk({ modelValue: stored, readonly: true, name: 'docs' })
    expect(ro.vm.add([file('a.png')])).toEqual({ added: [], rejected: [] })
    expect(ro.emitted('update:modelValue')).toBeUndefined()
    expect(ro.find('.g-file-field__chip button').exists()).toBe(false)
    expect(input(ro).attributes('aria-disabled')).toBe('true')
    expect(input(ro).attributes('disabled')).toBeUndefined()
    expect(ro.find('.g-file-field__action').text()).toBe('Solo lectura')
    expect(ro.classes()).toContain('is-readonly')
    expect(ro.find('input[type="hidden"]').attributes('disabled')).toBeUndefined()
    const none = mk({ readonly: true })
    expect(none.find('.g-file-field__action').text()).toBe('Sin archivos')
    const dis = mk({ modelValue: stored, disabled: true, name: 'docs' })
    expect(input(dis).attributes('disabled')).toBeDefined()
    expect(dis.find('input[type="hidden"]').attributes('disabled')).toBeDefined()
    expect(dis.find('.g-file-field__chip button').exists()).toBe(false)
    expect(dis.classes()).toContain('is-disabled')
  })
})

describe('GFileField · modelo y conciliación por key (#368)', () => {
  it('guardados: done sin file, data-stored, sin estado en la ficha; miniatura con su url solo si es imagen', () => {
    const w = mk({ multiple: true, modelValue: [
      { key: 'g1', name: 'Receta médica.pdf', size: 220000, type: 'application/pdf', state: 'done', value: 'doc-118', url: 'https://x/doc.pdf' },
      { key: 'g2', name: 'foto.jpg', size: 48000, type: 'image/jpeg', value: 'doc-119', url: 'https://x/thumb.jpg' }
    ] })
    const c = chips(w)
    expect(c).toHaveLength(2)
    expect(c[0].attributes('data-state')).toBe('done')
    expect(c[0].attributes('data-stored')).toBe('')
    expect(c[0].find('.g-summary__title').text()).toBe('Receta médica.pdf')
    expect(c[0].find('.g-summary__status').exists()).toBe(false)
    expect(c[0].find('.g-avatar').exists()).toBe(false)
    expect(c[1].find('img').attributes('src')).toBe('https://x/thumb.jpg')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('aviso 4: sin key o sin name se ignora; key repetida; guardado con otro state se toma done; guardado sin value', () => {
    const w = mk({ multiple: true, modelValue: [
      { name: 'sin-key.pdf' }, { key: 'k', name: 'a.pdf', value: 1 }, { key: 'k', name: 'b.pdf', value: 2 },
      { key: 'u', name: 'u.pdf', state: 'uploading', value: 3 }, { key: 'v', name: 'v.pdf' }
    ] })
    expect(chips(w).map((c) => c.attributes('data-state'))).toEqual(['done', 'done', 'done'])
    const m = warnings().join('\n')
    expect(m).toMatch(/no tiene key o name/)
    expect(m).toMatch(/key «k» está repetida/)
    expect(m).toMatch(/«u\.pdf».*state «uploading»: se toma «done»/)
    expect(m).toMatch(/«v\.pdf» no tiene value/)
  })

  it('una key que desaparece del modelo: cancela su subida (signal) en silencio; una nueva con file entra en la cola', async () => {
    const up = manualUploader()
    const { w, model, f } = withModel([], { uploader: up, multiple: true })
    f().vm.add([file('a.png'), file('b.png')])
    await flush()
    expect(up.calls).toHaveLength(2)
    const changes = f().emitted('change').length
    model.value = model.value.filter((e) => e.name !== 'a.png')
    await flush()
    expect(up.byName('a.png').signal.aborted).toBe(true)
    expect(f().emitted('change')).toHaveLength(changes)
    model.value = [...model.value, { key: 'app-1', name: 'c.png', size: 10, type: 'image/png', file: file('c.png') }]
    await flush()
    expect(up.byName('c.png')).toBeTruthy()
    expect(model.value.find((e) => e.key === 'app-1').state).toBe('uploading')
    expect(chips(w).map((c) => c.attributes('data-state'))).toEqual(['uploading', 'uploading'])
  })

  it('el estado de una entrada que el componente sube es del componente (aviso 5); en error, la aplicación sí lo cambia', async () => {
    const up = manualUploader()
    const { model, f } = withModel([], { uploader: up, multiple: true })
    f().vm.add([file('a.png')])
    await flush()
    model.value = model.value.map((e) => ({ ...e, state: 'done', value: 'hack' }))
    await flush()
    expect(f().find('.g-file-field__chip').attributes('data-state')).toBe('uploading')
    expect(warnings().some((m) => /mientras se sube: gana el del componente/.test(m))).toBe(true)
    up.calls[0].reject({ message: 'Falló' })
    await flush()
    expect(model.value[0].state).toBe('error')
    model.value = model.value.map((e) => ({ ...e, state: 'done', value: 'srv-9', error: null }))
    await flush()
    expect(f().find('.g-file-field__chip').attributes('data-state')).toBe('done')
  })

  it('al montar, las entradas con file en queued o uploading vuelven a la cola desde cero; las error se quedan', async () => {
    const up = manualUploader()
    mk({ uploader: up, multiple: true, modelValue: [
      { key: 'a', name: 'a.png', size: 10, type: 'image/png', state: 'uploading', file: file('a.png') },
      { key: 'b', name: 'b.png', size: 10, type: 'image/png', state: 'error', error: 'x', file: file('b.png') }
    ] })
    await flush()
    expect(up.calls.map((c) => c.file.name)).toEqual(['a.png'])
  })

  it('sin uploader, una entrada con file es ready y su File va al envío nativo', () => {
    const w = mk({ name: 'docs', modelValue: [{ key: 'a', name: 'a.png', state: 'uploading', file: file('a.png') }] })
    expect(chips(w)[0].attributes('data-state')).toBe('ready')
  })
})

describe('GFileField · adaptador y cola (#369)', () => {
  it('empieza al añadir; cola con concurrency en el orden de la lista; en cola: GProgress con labels.queued', async () => {
    const up = manualUploader()
    const w = mk({ uploader: up, multiple: true, concurrency: 2 })
    w.vm.add([file('a.png'), file('b.png'), file('c.png')])
    await flush()
    expect(up.calls.map((c) => c.file.name)).toEqual(['a.png', 'b.png'])
    expect(chips(w).map((c) => c.attributes('data-state'))).toEqual(['uploading', 'uploading', 'queued'])
    const q = chips(w)[2].find('.g-file-field__progress [role="progressbar"]')
    expect(q.attributes('aria-valuetext')).toBe('En cola')
    expect(q.attributes('aria-valuenow')).toBe('0')
    expect(chips(w)[2].find('.g-summary__status .g-badge').text()).toBe('En cola')
    up.calls[0].resolve({ value: 'srv-a' })
    await flush()
    expect(up.calls.map((c) => c.file.name)).toEqual(['a.png', 'b.png', 'c.png'])
    expect(lastModel(w)[0]).toMatchObject({ state: 'done', value: 'srv-a' })
  })

  it('progreso coalescido a un cuadro, recortado, en la barra (sin fila de texto) y nunca en el modelo', async () => {
    const up = manualUploader()
    const w = mk({ uploader: up, locale: 'en-US' })
    w.vm.add([file('a.png', 1000)])
    await flush()
    const n = w.emitted('update:modelValue').length
    up.calls[0].progress(100, 1000)
    up.calls[0].progress(420, 1000)
    up.calls[0].progress(5000, 1000)
    up.calls[0].progress(420, 0) // total 0: se usa file.size
    await frame()
    expect(w.emitted('update:modelValue')).toHaveLength(n)
    const p = w.find('.g-file-field__progress')
    expect(p.classes()).toEqual(expect.arrayContaining(['g-progress', 'g-progress--size-sm', 'g-progress--color-accent']))
    expect(p.find('.g-progress__row').exists()).toBe(false)
    const bar = p.find('[role="progressbar"]')
    expect(bar.attributes('aria-valuenow')).toBe('420')
    expect(bar.attributes('aria-valuemax')).toBe('1000')
    expect(bar.attributes('aria-label')).toBe('Subida de a.png')
    expect(bar.attributes('aria-valuetext')).toBe('42 %, 420 byte de 1 kB')
  })

  it('rechazo con { message }: error con su texto en la ficha, «Reintentar» con descripción y un anuncio', async () => {
    const up = manualUploader()
    const w = mk({ uploader: up, id: 'ff' })
    w.vm.add([file('radiografia.png')])
    await liveText(w)
    up.calls[0].reject({ message: 'Se interrumpió la conexión' })
    await flush()
    const c = chips(w)[0]
    expect(c.attributes('data-state')).toBe('error')
    expect(c.find('.g-summary__fact-value').text()).toBe('Se interrumpió la conexión')
    const err = c.find('.g-file-field__error')
    expect(err.attributes('hidden')).toBeDefined()
    expect(err.text()).toBe('Error: Se interrumpió la conexión')
    const retry = c.find('.g-file-field__retry')
    expect(retry.attributes('aria-label')).toBe('Reintentar radiografia.png')
    expect(retry.attributes('aria-describedby')).toBe(err.attributes('id'))
    expect(retry.attributes('id')).toMatch(/^ff-e\d+-retry$/)
    expect(c.find('.g-file-field__progress').exists()).toBe(false)
    expect(lastModel(w)[0]).toMatchObject({ state: 'error', error: 'Se interrumpió la conexión' })
    expect(await liveText(w)).toBe('No se pudo subir radiografia.png: Se interrumpió la conexión.')
  })

  it('sin message, AbortError ajeno o value nulo (aviso 6): error con labels.uploadFailed; nunca queda uploading', async () => {
    const up = manualUploader()
    const w = mk({ uploader: up, multiple: true })
    w.vm.add([file('a.png'), file('b.png')])
    await flush()
    up.calls[0].reject(new Error(''))
    up.calls[1].reject(Object.assign(new Error('The operation was aborted'), { name: 'AbortError' }))
    await flush()
    w.vm.add([file('c.png')])
    await flush()
    up.calls[2].resolve({ value: null })
    await flush()
    expect(lastModel(w).map((e) => [e.state, e.error])).toEqual([['error', 'No se pudo subir'], ['error', 'No se pudo subir'], ['error', 'No se pudo subir']])
    expect(warnings().some((m) => /sin value/.test(m))).toBe(true)
  })

  it('resuelve { value, url }: done con value y url; estado «Subido» y cierre de lote con un solo anuncio', async () => {
    const up = manualUploader()
    const w = mk({ uploader: up, multiple: true })
    w.vm.add([file('a.png'), file('b.png')])
    expect(await liveText(w)).toBe('Añadidos 2 archivos. Subiendo 2.')
    up.calls[0].resolve({ value: 'srv-a', url: 'https://x/a.png' })
    await flush()
    expect(await liveText(w)).toBe('Añadidos 2 archivos. Subiendo 2.') // aún falta b: sin anuncio
    up.calls[1].resolve({ value: 'srv-b' })
    await flush()
    expect(await liveText(w)).toBe('2 archivos subidos.')
    expect(lastModel(w)[0]).toMatchObject({ state: 'done', value: 'srv-a', url: 'https://x/a.png' })
    expect(chips(w)[0].attributes('data-stored')).toBeUndefined()
    expect(chips(w)[0].find('.g-summary__status .g-badge').text()).toBe('Subido')
  })

  it('reintentar: vuelve a la cola, anuncia, el foco va al botón de la misma ficha («Cancelar subida»)', async () => {
    const up = manualUploader()
    const w = mk({ uploader: up, multiple: true })
    w.vm.add([file('a.png'), file('b.png')])
    await liveText(w)
    up.calls[0].reject({ message: 'x' })
    await liveText(w)
    chips(w)[0].find('.g-file-field__retry').element.focus()
    await chips(w)[0].find('.g-file-field__retry').trigger('click')
    await flush()
    expect(up.calls).toHaveLength(3)
    expect(chips(w)[0].attributes('data-state')).toBe('uploading')
    expect(document.activeElement).toBe(chips(w)[0].find('.g-file-field__remove').element)
    expect(document.activeElement.getAttribute('aria-label')).toBe('Cancelar subida de a.png')
    expect(await liveText(w)).toBe('Reintentando a.png.')
    expect(w.emitted('change')).toHaveLength(1) // reintentar no es un cambio de archivos
  })

  it('cancelar es quitar: aborta, change via cancel y anuncio canceled', async () => {
    const up = manualUploader()
    const w = mk({ uploader: up, multiple: true })
    w.vm.add([file('a.png')])
    await liveText(w)
    await chips(w)[0].find('.g-file-field__remove').trigger('click')
    expect(up.calls[0].signal.aborted).toBe(true)
    expect(w.emitted('change').at(-1)[0]).toMatchObject({ via: 'cancel', added: [] })
    expect(lastModel(w)).toEqual([])
    expect(await liveText(w)).toBe('Subida de a.png cancelada. Quedan 0.')
  })

  it('al desmontar: aborta las subidas, revoca las URL de objeto y no emite nada', async () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    const up = manualUploader()
    const w = mk({ uploader: up })
    w.vm.add([file('a.png')])
    await flush()
    expect(chips(w)[0].find('img').attributes('src')).toMatch(/^blob:/)
    const emitted = w.emitted('update:modelValue')
    const n = emitted.length
    w.unmount()
    expect(up.calls[0].signal.aborted).toBe(true)
    expect(revoke).toHaveBeenCalled()
    up.calls[0].resolve({ value: 'tarde' })
    await flush()
    expect(emitted).toHaveLength(n)
  })

  it('quitar revoca la URL de objeto de la miniatura', async () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    const w = mk({ multiple: true })
    w.vm.add([file('a.png')])
    await nextTick()
    const src = chips(w)[0].find('img').attributes('src')
    await chips(w)[0].find('.g-file-field__remove').trigger('click')
    expect(revoke).toHaveBeenCalledWith(src)
  })
})

describe('GFileField · foco y anuncios al quitar (#374)', () => {
  it('quitar: el foco va al «Quitar» de la siguiente; si no hay, de la anterior; si no queda ninguna, al control', async () => {
    const w = mk({ multiple: true, id: 'ff' })
    w.vm.add([file('a.png'), file('b.png'), file('c.png')])
    await liveText(w)
    await chips(w)[1].find('.g-file-field__remove').trigger('click')
    await flush()
    expect(document.activeElement.getAttribute('aria-label')).toBe('Quitar c.png')
    expect(await liveText(w)).toBe('Quitado b.png. Quedan 2.')
    await chips(w)[1].find('.g-file-field__remove').trigger('click')
    await flush()
    expect(document.activeElement.getAttribute('aria-label')).toBe('Quitar a.png')
    await chips(w)[0].find('.g-file-field__remove').trigger('click')
    await flush()
    expect(document.activeElement.id).toBe('ff')
    expect(w.find('.g-file-field__list').exists()).toBe(false)
    expect(w.emitted('change').at(-1)[0].via).toBe('remove')
  })

  it('lista con nombre labels.list, role list explícito; ids internos (nunca de la key); estado en la descripción', async () => {
    const w = mk({ multiple: true, max: 5, id: 'ff', modelValue: [{ key: 'clave con espacios', name: 'x.pdf', value: 1 }] })
    const ul = w.find('.g-file-field__list')
    expect(ul.attributes('role')).toBe('list')
    expect(ul.attributes('aria-label')).toBe('Archivos de Fotos')
    expect(w.html()).not.toContain('clave con espacios')
    expect(w.find('#ff-status').text()).toBe('1 de 5')
    expect(input(w).attributes('aria-describedby')).toBe('ff-status')
    expect(w.find('.g-file-field__action').text()).toBe('Añadir más')
  })
})

describe('GFileField · envío (#371)', () => {
  it('sin uploader: el <input type="file"> lleva name; ocultos solo para los guardados; form se copia', () => {
    const w = mk({ name: 'fotos', multiple: true, modelValue: [{ key: 'g1', name: 'a.pdf', value: 'srv-1' }] }, { attrs: { form: 'f1' } })
    w.vm.add([file('b.png')])
    expect(input(w).attributes('name')).toBe('fotos')
    expect(input(w).attributes('form')).toBe('f1')
    return nextTick().then(() => {
      const hidden = w.findAll('input[type="hidden"]')
      expect(hidden.map((x) => [x.attributes('name'), x.attributes('value'), x.attributes('form')])).toEqual([['fotos', 'srv-1', 'f1']])
    })
  })

  it('con uploader: el <input type="file"> sin name; un oculto por entrada done (subidas y guardados); lo pendiente no', async () => {
    const up = manualUploader()
    const w = mk({ name: 'fotos', multiple: true, uploader: up, modelValue: [{ key: 'g1', name: 'a.pdf', value: 'srv-1' }] })
    w.vm.add([file('b.png'), file('c.png')])
    await flush()
    up.calls[0].resolve({ value: 'srv-b' })
    await flush()
    expect(input(w).attributes('name')).toBeUndefined()
    expect(w.findAll('input[type="hidden"]').map((x) => x.attributes('value'))).toEqual(['srv-1', 'srv-b'])
  })

  it('fuera de GForm: setCustomValidity con el error propio (pendiente, fallido) y vacía al terminar', async () => {
    const up = manualUploader()
    const w = mk({ uploader: up, multiple: true })
    const el = input(w).element
    const spy = vi.spyOn(el, 'setCustomValidity')
    w.vm.add([file('a.png')])
    await flush()
    expect(spy).toHaveBeenLastCalledWith('Espera a que termine de subir a.png.')
    up.calls[0].reject({ message: 'x' })
    await flush()
    expect(spy).toHaveBeenLastCalledWith('No se pudo subir a.png: reinténtalo o quítalo.')
    await chips(w)[0].find('.g-file-field__remove').trigger('click')
    await flush()
    expect(spy).toHaveBeenLastCalledWith('')
    // Fuera de GForm el error propio nunca se pinta
    expect(w.find('.g-file-field__message').text()).toBe('')
  })
})

describe('GFileField · arrastre de página y destino (#373)', () => {
  let restoreLayout
  beforeEach(() => { restoreLayout = withLayout() })
  afterEach(() => restoreLayout())

  it('todos los campos alcanzables despiertan; is-awake-ok si admite, is-awake-no si no; textos del destino; dormir al soltar', async () => {
    const a = mk({ accept: 'image/*', hint: 'PNG o JPG' })
    const b = mk({ accept: 'application/pdf', label: 'INE' })
    filesEvent('dragenter', [], { types: ['image/png'], target: document.body })
    await nextTick()
    expect(a.classes()).toEqual(expect.arrayContaining(['is-awake', 'is-awake-ok']))
    expect(b.classes()).toEqual(expect.arrayContaining(['is-awake', 'is-awake-no']))
    expect(a.find('.g-file-field__target-text').text()).toBe('Soltar aquí · PNG o JPG')
    expect(b.find('.g-file-field__target-text').text()).toBe('INE no admite esto')
    // Encima: dropInto si admite; el que no admite sigue diciendo que no
    filesEvent('dragenter', [], { types: ['image/png'], target: a.find('.g-file-field__box').element })
    await nextTick()
    expect(a.classes()).toContain('is-over')
    expect(a.find('.g-file-field__target-text').text()).toBe('Soltar en Fotos')
    filesEvent('drop', [], { target: document.body })
    await nextTick()
    expect(a.classes()).not.toContain('is-awake')
    expect(a.classes()).not.toContain('is-over')
  })

  it('soltar en el campo añade (via drop) y cancela el evento; lo que no admite lo rechaza al soltar', async () => {
    const w = mk({ multiple: true, accept: '.pdf,image/*' })
    filesEvent('dragenter', [], { target: document.body })
    const over = filesEvent('dragover', [], { types: ['image/png'], target: w.find('.g-file-field__box').element })
    expect(over.defaultPrevented).toBe(true)
    expect(over.dataTransfer.dropEffect).toBe('copy')
    const drop = filesEvent('drop', [file('a.png'), file('x.exe', 5, 'application/x-msdownload')], { target: w.find('.g-file-field__box').element })
    expect(drop.defaultPrevented).toBe(true)
    expect(w.emitted('change')[0][0].via).toBe('drop')
    expect(w.emitted('reject')[0][0]).toMatchObject({ via: 'drop', items: [expect.objectContaining({ reason: 'type' })] })
  })

  it('lleno: despierta sin admitir (dropFull), dragover con dropEffect none y soltar no añade', async () => {
    const w = mk({ multiple: true, max: 1, label: 'INE' })
    w.vm.add([file('a.png')])
    filesEvent('dragenter', [], { target: document.body })
    await nextTick()
    expect(w.classes()).toContain('is-awake-no')
    expect(w.find('.g-file-field__target-text').text()).toBe('INE está lleno')
    const over = filesEvent('dragover', [], { target: w.find('.g-file-field__box').element })
    expect(over.dataTransfer.dropEffect).toBe('none')
    const n = w.emitted('change').length
    filesEvent('drop', [file('b.png')], { target: w.find('.g-file-field__box').element })
    expect(w.emitted('change')).toHaveLength(n)
  })

  it('no despiertan: solo lectura, deshabilitado, dentro de un subárbol inert ni fuera del modal superior', async () => {
    const restore = installTopLayer()
    const ro = mk({ readonly: true })
    const dis = mk({ disabled: true })
    const holder = document.createElement('div')
    holder.setAttribute('inert', '')
    document.body.appendChild(holder)
    const inert = mount(GFileField, { props: { label: 'X', labels: LABELS }, attachTo: holder })
    const free = mk()
    const d = document.createElement('dialog')
    document.body.appendChild(d)
    const inDialog = mount(GFileField, { props: { label: 'D', labels: LABELS }, attachTo: d })
    d.showModal()
    await new Promise((r) => setTimeout(r, 0))
    filesEvent('dragenter', [], { target: document.body })
    await nextTick()
    expect(ro.classes()).not.toContain('is-awake')
    expect(dis.classes()).not.toContain('is-awake')
    expect(inert.classes()).not.toContain('is-awake')
    expect(free.classes(), 'bajo el modal').not.toContain('is-awake')
    expect(inDialog.classes()).toContain('is-awake')
    filesEvent('drop', [], { target: document.body })
    d.close()
    restore()
  })

  it('un campo que no está a la vista (sin cajas de layout) no despierta', async () => {
    restoreLayout()
    const w = mk()
    filesEvent('dragenter', [], { target: document.body })
    await nextTick()
    expect(w.classes()).not.toContain('is-awake')
    filesEvent('drop', [], { target: document.body })
    restoreLayout = withLayout()
  })
})

describe('GFileField · anuncios con un modal encima (traslado al modal superior)', () => {
  it('con un <dialog> modal que tapa el campo, el anuncio se escribe en una región dentro del modal', async () => {
    const restore = installTopLayer()
    const w = mk({ multiple: true })
    const d = document.createElement('dialog')
    document.body.appendChild(d)
    d.showModal()
    await new Promise((r) => setTimeout(r, 0))
    await nextTick()
    const region = d.querySelector('.g-file-field__live')
    expect(region).toBeTruthy()
    expect(region.getAttribute('role')).toBe('status')
    w.vm.add([file('a.png')])
    await new Promise((r) => setTimeout(r, 80))
    expect(region.textContent).toBe('Añadido a.png.')
    expect(w.find('.g-file-field__live').text()).toBe('')
    d.close()
    await new Promise((r) => setTimeout(r, 0))
    await nextTick()
    expect(d.querySelector('.g-file-field__live')).toBe(null)
    restore()
  })
})

describe('GFileField · aterrizaje (#376)', () => {
  it('is-landing solo al añadir por un gesto; se retira en el acto sin animación calculada; nunca al montar ni al conciliar', async () => {
    const { model, f } = withModel([{ key: 'g', name: 'g.pdf', value: 1 }], { multiple: true })
    expect(f().find('.is-landing').exists()).toBe(false)
    f().vm.add([file('a.png')])
    await nextTick()
    expect(f().findAll('.g-file-field__chip')[1].classes()).toContain('is-landing')
    await flush()
    expect(f().find('.is-landing').exists()).toBe(false)
    model.value = [...model.value, { key: 'z', name: 'z.pdf', value: 2 }]
    await nextTick()
    expect(f().find('.is-landing').exists()).toBe(false)
  })

  it('con animación: se retira en animationend de g-file-field-land… (no con otra)', async () => {
    const real = window.getComputedStyle
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
      const s = real(el)
      return el.classList && el.classList.contains('is-landing') ? { ...s, animationName: 'g-file-field-land' } : s
    })
    const w = mk({ multiple: true })
    w.vm.add([file('a.png')])
    await flush()
    const li = chips(w)[0]
    expect(li.classes()).toContain('is-landing')
    li.element.dispatchEvent(Object.assign(new Event('animationend', { bubbles: true }), { animationName: 'g-summary-enter' }))
    await nextTick()
    expect(li.classes()).toContain('is-landing')
    li.element.dispatchEvent(Object.assign(new Event('animationend', { bubbles: true }), { animationName: 'g-file-field-land' }))
    await nextTick()
    expect(li.classes()).not.toContain('is-landing')
  })
})
