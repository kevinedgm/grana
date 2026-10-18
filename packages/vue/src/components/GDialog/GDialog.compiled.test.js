// GDialog · modo pasos con PLANTILLA COMPILADA (H1 de design/lab/dialog/auditoria-pasos.md). Las pruebas de
// GDialog.steps.test.js montan con h(), donde Vue compara todas las props; una plantilla compilada (SFC o plantilla en el
// DOM) lleva pistas del compilador (patchFlag / dynamicProps) y Vue solo parchea lo dinámico. El pie del paso actual se pinta
// en el mismo sitio de GDialog (StepSlot): sin una clave por paso, el pie del paso nuevo se parcheaba sobre el del anterior y
// se quedaba con su `id`, `variant`, `type` y `form` estáticos (un botón con `form="…"` enviaría el formulario equivocado).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import * as Vue from 'vue'
import { compile } from '@vue/compiler-dom'
import GDialog from './GDialog.vue'
import GDialogStep from '../GDialogStep/GDialogStep.vue'
import GBtn from '../GBtn/GBtn.vue'
import { resetDialogStack } from '../../utils/dialogStack.js'
import { installTopLayer } from '../GSpeechHost/speechTestEnv.js'

const { defineComponent, nextTick, ref } = Vue

let restoreTopLayer
beforeEach(() => {
  restoreTopLayer = installTopLayer()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => { restoreTopLayer(); vi.restoreAllMocks(); resetDialogStack(); document.body.innerHTML = '' })

const ticks = async (n = 4) => { for (let i = 0; i < n; i++) await nextTick() }
const $ = (sel) => document.querySelector(sel)

/** Render de una plantilla compilada como lo hace el SFC (hoistStatic y pistas de parcheo incluidas). */
function compiled(template) {
  const { code } = compile(template, { mode: 'function', prefixIdentifiers: true, hoistStatic: true, cacheHandlers: true })
  return new Function('Vue', code)(Vue)
}

const TEMPLATE = `
<GDialog id="dlg" v-model="open" v-model:steps="steps" close-label="Cerrar" :labels="{ back: 'Volver a {title}', trail: 'Recorrido' }">
  <GDialogStep name="ingreso" title="Ingreso">
    <template #default="{ push }">
      <form id="f-ingreso" @submit.prevent></form>
      <button id="to-partida" type="button" @click="push('partida')">Completar partida</button>
    </template>
    <template #footer="{ back }">
      <GBtn id="ingreso-cancelar" variant="ghost" color="neutral" @click="back()">Cancelar</GBtn>
      <GBtn id="ingreso-ok" type="submit" form="f-ingreso" @click="hit('ingreso')">Registrar ingreso</GBtn>
      <button id="ingreso-nat" type="submit" form="f-ingreso" data-step="ingreso" @click="hit('nat-ingreso')">Nativo ingreso</button>
    </template>
  </GDialogStep>
  <GDialogStep name="partida" title="Partida 3">
    <template #default="{ push }">
      <form id="f-partida" @submit.prevent></form>
      <input id="partida-in">
      <button id="to-producto" type="button" @click="push('producto')">Crear producto</button>
    </template>
    <template #footer="{ back }">
      <GBtn id="partida-cancelar" variant="outline" @click="back()">Cancelar</GBtn>
      <GBtn id="partida-ok" variant="soft" color="accent" type="button" form="f-partida" @click="hit('partida')">Guardar partida {{ n }}</GBtn>
      <button id="partida-nat" type="button" form="f-partida" data-step="partida" @click="hit('nat-partida')">Nativo partida</button>
    </template>
  </GDialogStep>
  <GDialogStep name="producto" title="Producto nuevo">
    <input id="producto-in">
  </GDialogStep>
</GDialog>`

function setup() {
  const open = ref(true)
  const steps = ref([])
  const n = ref(3)
  const hits = []
  const App = defineComponent({
    components: { GDialog, GDialogStep, GBtn },
    setup: () => ({ open, steps, n, hit: (k) => hits.push(k) }),
    render: compiled(TEMPLATE)
  })
  const w = mount(App, { attachTo: document.body })
  return { w, open, steps, n, hits }
}

const footer = () => [...document.querySelectorAll('#dlg .g-dialog__footer > *')].map((el) => ({
  id: el.id,
  type: el.getAttribute('type'),
  form: el.getAttribute('form'),
  step: el.getAttribute('data-step'),
  cls: el.className
}))

describe('GDialog · pasos con plantilla compilada (H1)', () => {
  it('el pie de cada paso es el suyo: id, type, form, variant y color al ir más hondo', async () => {
    const s = setup()
    await ticks()
    expect(footer().map((b) => b.id)).toEqual(['ingreso-cancelar', 'ingreso-ok', 'ingreso-nat'])
    $('#to-partida').click()
    await ticks()
    expect(s.steps.value).toEqual(['ingreso', 'partida'])
    const f = footer()
    expect(f.map((b) => b.id)).toEqual(['partida-cancelar', 'partida-ok', 'partida-nat'])
    expect(f[1]).toMatchObject({ type: 'button', form: 'f-partida' })
    expect(f[1].cls).toContain('g-btn--variant-soft')
    expect(f[1].cls).toContain('g-btn--color-accent')
    expect(f[0].cls).toContain('g-btn--variant-outline')
    expect(f[2]).toMatchObject({ type: 'button', form: 'f-partida', step: 'partida' })
    expect($('#partida-ok').textContent).toContain('Guardar partida 3')
    // El botón del pie pertenece al formulario de SU paso
    expect($('#partida-nat').form && $('#partida-nat').form.id).toBe('f-partida')
    s.w.unmount()
  })

  it('al volver, el pie vuelve a ser el del paso de abajo; las escuchas son las de cada paso', async () => {
    const s = setup()
    await ticks()
    $('#to-partida').click()
    await ticks()
    $('#partida-ok').click()
    $('#partida-nat').click()
    $('#partida-cancelar').click() // back()
    await ticks()
    expect(s.steps.value).toEqual(['ingreso'])
    const f = footer()
    expect(f.map((b) => b.id)).toEqual(['ingreso-cancelar', 'ingreso-ok', 'ingreso-nat'])
    expect(f[1]).toMatchObject({ type: 'submit', form: 'f-ingreso' })
    expect(f[1].cls).toContain('g-btn--variant-solid')
    expect(f[0].cls).toContain('g-btn--variant-ghost')
    expect($('#ingreso-nat').form && $('#ingreso-nat').form.id).toBe('f-ingreso')
    $('#ingreso-ok').click()
    expect(s.hits).toEqual(['partida', 'nat-partida', 'ingreso'])
    s.w.unmount()
  })

  it('un paso sin pie retira el pie; lo dinámico del pie sigue reactivo dentro del mismo paso', async () => {
    const s = setup()
    await ticks()
    $('#to-partida').click()
    await ticks()
    s.n.value = 4
    await ticks()
    expect($('#partida-ok').textContent).toContain('Guardar partida 4')
    $('#to-producto').click()
    await ticks()
    expect(s.steps.value).toEqual(['ingreso', 'partida', 'producto'])
    expect($('#dlg .g-dialog__footer')).toBeNull()
    s.w.unmount()
  })

  it('un paso abierto desde un botón del PIE: al volver, el foco va al botón del pie nuevo con el mismo id', async () => {
    const open = ref(true)
    const steps = ref([])
    const App = defineComponent({
      components: { GDialog, GDialogStep, GBtn },
      setup: () => ({ open, steps }),
      render: compiled(`
        <GDialog id="dlg" v-model="open" v-model:steps="steps" close-label="Cerrar" :labels="{ back: 'Volver a {title}', trail: 'Recorrido' }">
          <GDialogStep name="a" title="A">
            <input id="a-in">
            <template #footer="{ push }"><GBtn id="a-next" variant="soft" @click="push('b')">Siguiente</GBtn></template>
          </GDialogStep>
          <GDialogStep name="b" title="B">
            <input id="b-in">
            <template #footer="{ back }"><GBtn id="b-back" variant="ghost" @click="back()">Atrás</GBtn></template>
          </GDialogStep>
        </GDialog>`)
    })
    const w = mount(App, { attachTo: document.body })
    await ticks()
    const first = $('#a-next')
    first.focus()
    first.click()
    await ticks()
    expect(steps.value).toEqual(['a', 'b'])
    expect(document.activeElement.id).toBe('b-in')
    expect(first.isConnected).toBe(false)
    $('#b-back').click()
    await ticks()
    expect(steps.value).toEqual(['a'])
    expect(document.activeElement.id).toBe('a-next')
    expect(document.activeElement.className).toContain('g-btn--variant-soft')
    w.unmount()
  })
})

describe('GDialog · alcance del slot footer fuera del modo pasos (H5)', () => {
  it('el footer recibe { close, push, back, backTo, steps } como el default (dialog.md «Slots»)', async () => {
    const open = ref(true)
    let foot = null
    let body = null
    const App = defineComponent({
      components: { GDialog },
      setup: () => ({ open, seeFoot: (s) => { foot = s }, seeBody: (s) => { body = s } }),
      render: compiled(`
        <GDialog v-model="open" title="T" close-label="Cerrar">
          <template #default="scope">{{ seeBody(scope) }}<input></template>
          <template #footer="scope">{{ seeFoot(scope) }}<button type="button">Ok</button></template>
        </GDialog>`)
    })
    const w = mount(App, { attachTo: document.body })
    await ticks()
    for (const s of [foot, body]) {
      expect(Object.keys(s).sort()).toEqual(['back', 'backTo', 'close', 'push', 'steps'])
      expect(typeof s.close).toBe('function')
      expect(s.steps).toEqual([])
    }
    w.unmount()
  })
})

