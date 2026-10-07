// Modo visual del motor del tooltip (dueño: bruno). design/contracts/tooltip.md §«Modo visual» (#433).
// Para los clientes internos cuyo nombre ya vive en su DOM como etiqueta oculta visualmente (GTabs #434, GRadioGroup
// #435, riel de GSidebar #436): la pista solo ENSEÑA ese nombre a quien ve. Nodo `g-tooltip` con aria-hidden="true",
// sin role, id, referencias ni región viva; un nodo por control, persistente y cerrado desde el montaje; mismas clases y
// CSS que GTooltip. El comportamiento es el del motor (utils/tooltip.js), sin excepciones.
// Sin lecturas de document o window fuera de los ganchos de montaje (SSR).
import { h, onBeforeUnmount, onMounted, onUpdated } from 'vue'
import { attach } from './tooltip.js'

/**
 * opt.find(key, node) → { ctrl, box? } | null: el elemento enfocable de esa pista (y su caja visible si es otra), leído
 * del DOM ya parcheado. opt.disabled(key, ctrl) → true mientras la etiqueta esté visible. opt.placement(key, ctrl) →
 * lado pedido (solo si el grupo no declara su orientación).
 * Devuelve { ref(key), node(key, text), sync(), check(), hide(), instances }.
 */
export function useVisualTips(opt) {
  const nodes = new Map()
  const refs = new Map()
  const live = new Map()

  // Una función estable por clave: Vue la llama con el elemento al montar y parchear, y con null al desmontar
  const ref = (key) => {
    let f = refs.get(key)
    if (!f) {
      f = (el) => {
        if (el) nodes.set(key, el)
        else nodes.delete(key)
      }
      refs.set(key, f)
    }
    return f
  }

  /** Nodo del modo visual (render function). Texto = la etiqueta oculta que ya da el nombre */
  const node = (key, text) => h('div', { key: `g-vtip-${key}`, ref: ref(key), class: 'g-tooltip', popover: 'manual', 'aria-hidden': 'true' }, [
    h('span', { class: 'g-tooltip__tab' }),
    h('span', { class: 'g-tooltip__body' }, [h('span', { class: 'g-tooltip__text', dir: 'auto' }, text)])
  ])

  const drop = (key) => {
    const r = live.get(key)
    if (!r) return
    r.inst.destroy()
    live.delete(key)
  }

  // Engancha el motor a cada nodo montado; suelta los que se fueron o cambiaron de control
  function sync() {
    for (const [key, r] of [...live]) {
      const n = nodes.get(key)
      if (!n || n !== r.node || !n.isConnected || !r.ctrl.isConnected) drop(key)
    }
    for (const [key, n] of nodes) {
      if (!n.isConnected) continue
      const f = opt.find(key, n)
      const ctrl = f && f.ctrl
      const box = (f && f.box) || ctrl
      const r = live.get(key)
      if (r && r.ctrl === ctrl && r.box === box) continue
      drop(key)
      if (!ctrl) continue
      const inst = attach(ctrl, n, {
        box,
        placement: () => (opt.placement ? opt.placement(key, ctrl) : undefined),
        disabled: () => Boolean(opt.disabled && opt.disabled(key, ctrl)),
        chars: () => (n.textContent || '').length
      })
      live.set(key, { ctrl, box, node: n, inst })
    }
  }
  /** El control cambió (aria-expanded, formato): la pista que ya no puede mostrarse se cierra */
  const check = () => { for (const r of live.values()) r.inst.check() }
  const hide = () => { for (const r of live.values()) r.inst.hide('state') }

  onMounted(sync)
  onUpdated(sync)
  onBeforeUnmount(() => {
    for (const key of [...live.keys()]) drop(key)
    nodes.clear()
  })

  return { ref, node, sync, check, hide, instances: live }
}
