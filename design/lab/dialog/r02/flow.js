// kiwi · dialog r02 · motor del flujo de cinco niveles (prototipo; el código definitivo es de bruno).
// Datos del módulo de inventarios (NisaNabani), borradores por nivel, resultado que baja al nivel de abajo,
// canal cortés único que viaja al <dialog> modal superior y reglas comunes de la base (foco, retorno, Esc).
/* global Vue */
(function () {
  const { reactive } = Vue

  // ---------- Catálogos (lo que la aplicación ya tiene) ----------
  const catalog = reactive({
    categorias: [
      { value: 'acidos', label: 'Ácidos' },
      { value: 'solventes', label: 'Solventes' },
      { value: 'sales', label: 'Sales inorgánicas' }
    ],
    productos: [
      { value: 'hcl', label: 'Ácido clorhídrico 37 %' },
      { value: 'etanol', label: 'Etanol absoluto' },
      { value: 'nacl', label: 'Cloruro de sodio' }
    ]
  })
  const unidades = [
    { value: 'kg', label: 'Kilogramo' },
    { value: 'l', label: 'Litro' },
    { value: 'pza', label: 'Pieza' }
  ]
  const ocs = [
    { value: 'oc2291', label: 'OC-2291 · Química del Centro' },
    { value: 'oc2290', label: 'OC-2290 · Vidriería Lab' }
  ]
  const almacenes = [
    { value: 'central', label: 'Almacén central' },
    { value: 'frio', label: 'Cámara fría' }
  ]
  const labelOf = (list, v) => (list.find((o) => o.value === v) || {}).label || ''

  // ---------- Borradores por nivel ----------
  // Regla de la base (§ «Volver nunca borra»): un borrador solo se reinicia al confirmar su nivel o al cerrar todo el flujo.
  const fresh = {
    ingreso: () => ({ oc: 'oc2291', almacen: 'central', partidas: [
      { n: 1, producto: 'hcl', cantidad: '12', unidad: 'l' },
      { n: 2, producto: 'etanol', cantidad: '20', unidad: 'l' },
      { n: 3, producto: null, cantidad: '', unidad: 'kg', pendiente: 'Tris base' }
    ] }),
    partida: () => ({ producto: null, lote: '', cantidad: '' }),
    producto: () => ({ nombre: 'Tris base', categoria: null, unidad: 'kg' }),
    categoria: () => ({ nombre: '', padre: null })
  }
  const draft = reactive({ ingreso: fresh.ingreso(), partida: fresh.partida(), producto: fresh.producto(), categoria: fresh.categoria() })
  const errors = reactive({})

  // ---------- Niveles ----------
  // title: nombre del nivel (h2 o h3 y nombre accesible); waiting: lo que el nivel espera del de arriba (lomo, hilo);
  // receive: id del campo que recibe el resultado del nivel de arriba.
  const LEVELS = {
    detalle: { title: () => 'Ácido clorhídrico 37 %', kind: 'Detalle de producto', purpose: 'Detalle de producto', waiting: () => 'Existencia 48 L' },
    ingreso: { title: () => 'Ingreso desde orden de compra', kind: 'Ingreso', purpose: 'Entrará en Ácido clorhídrico 37 % y el resto de partidas', waiting: () => labelOf(ocs, draft.ingreso.oc).split(' · ')[0] + ' · 3 partidas' },
    partida: { title: () => 'Partida 3', kind: 'Partida', purpose: 'Para el ingreso de la OC-2291', waiting: () => (draft.partida.producto ? labelOf(catalog.productos, draft.partida.producto) : 'Producto: falta') },
    producto: { title: () => 'Producto nuevo', kind: 'Producto', purpose: 'Se elegirá en Producto de la partida 3', waiting: () => (draft.producto.categoria ? labelOf(catalog.categorias, draft.producto.categoria) : 'Categoría: falta') },
    categoria: { title: () => 'Categoría nueva', kind: 'Categoría', purpose: 'Se elegirá en Categoría del producto nuevo', waiting: () => draft.categoria.nombre || 'Sin nombre' }
  }

  // ---------- Canal cortés único (como el de página de liveRegion.js, #533): vive en el modal superior ----------
  let live = null
  const said = []
  function liveNode() {
    if (!live) {
      live = document.createElement('p')
      live.id = 'flow-live'
      live.className = 'sr'
      live.setAttribute('aria-live', 'polite')
      live.setAttribute('aria-atomic', 'true')
      document.body.append(live)
    }
    return live
  }
  function placeLive() {
    const n = liveNode()
    const tops = [...document.querySelectorAll('dialog[open]')].filter((d) => { try { return d.matches(':modal') } catch { return true } })
    const host = tops[tops.length - 1] || document.body
    if (n.parentNode !== host) host.append(n)
  }
  let liveTimer = 0
  function announce(text) {
    said.push(text)
    const n = liveNode()
    placeLive()
    n.textContent = ''
    clearTimeout(liveTimer)
    liveTimer = setTimeout(() => { placeLive(); n.textContent = text; setTimeout(() => { if (n.textContent === text) n.textContent = '' }, 5000) }, 50)
  }

  // ---------- Pila ----------
  function createFlow() {
    const stack = reactive([])
    let seq = 0
    const flow = {
      stack,
      top: () => stack[stack.length - 1] || null,
      parent: () => stack[stack.length - 2] || null,
      // opener: el elemento que abrió el nivel (al que vuelve el foco si no hay resultado)
      push(key, opener) {
        const active = opener || document.activeElement
        stack.push({ key, id: ++seq, opener: active && active !== document.body ? active : null, dir: 'forward' })
        flow.dir = 'forward'
      },
      pop() {
        flow.dir = 'back'
        return stack.pop()
      },
      closeAll() {
        stack.splice(0)
        for (const k of Object.keys(fresh)) draft[k] = fresh[k]()
        for (const k of Object.keys(errors)) delete errors[k]
      },
      dir: 'forward'
    }
    return flow
  }

  // ---------- Confirmar un nivel: valida, aplica el resultado al de abajo y dice qué pasó ----------
  // Devuelve { ok, focus } o { ok:false, focus:id del primer campo con error }.
  function commit(key) {
    for (const k of Object.keys(errors)) if (k.startsWith(key + '.')) delete errors[k]
    if (key === 'categoria') {
      const nombre = draft.categoria.nombre.trim()
      if (!nombre) { errors['categoria.nombre'] = 'Escribe el nombre de la categoría.'; return { ok: false, focus: 'f-categoria-nombre' } }
      const value = 'cat-' + catalog.categorias.length
      catalog.categorias.push({ value, label: nombre })
      draft.producto.categoria = value
      draft.categoria = fresh.categoria()
      return { ok: true, focus: 'f-producto-categoria', said: `Categoría «${nombre}» creada y elegida en Producto nuevo.` }
    }
    if (key === 'producto') {
      const nombre = draft.producto.nombre.trim()
      if (!nombre) { errors['producto.nombre'] = 'Escribe el nombre del producto.'; return { ok: false, focus: 'f-producto-nombre' } }
      if (!draft.producto.categoria) { errors['producto.categoria'] = 'Elige o crea una categoría.'; return { ok: false, focus: 'f-producto-categoria' } }
      const value = 'p-' + catalog.productos.length
      catalog.productos.push({ value, label: nombre })
      draft.partida.producto = value
      draft.producto = fresh.producto()
      return { ok: true, focus: 'f-partida-producto', said: `Producto «${nombre}» creado y elegido en Partida 3.` }
    }
    if (key === 'partida') {
      if (!draft.partida.producto) { errors['partida.producto'] = 'Elige o crea un producto.'; return { ok: false, focus: 'f-partida-producto' } }
      if (!String(draft.partida.cantidad).trim()) { errors['partida.cantidad'] = 'Escribe la cantidad.'; return { ok: false, focus: 'f-partida-cantidad' } }
      const p = draft.ingreso.partidas[2]
      p.producto = draft.partida.producto
      p.cantidad = draft.partida.cantidad
      delete p.pendiente
      draft.partida = fresh.partida()
      return { ok: true, focus: 'f-ingreso-p3', said: `Partida 3 guardada: ${labelOf(catalog.productos, p.producto)}, ${p.cantidad} ${p.unidad}.` }
    }
    if (key === 'ingreso') {
      if (draft.ingreso.partidas.some((p) => !p.producto)) { errors['ingreso.partidas'] = 'Completa la partida 3 antes de registrar.'; return { ok: false, focus: 'f-ingreso-p3' } }
      draft.ingreso = fresh.ingreso()
      return { ok: true, focus: 'f-detalle-ingreso', said: 'Ingreso registrado: 3 partidas en Almacén central.' }
    }
    return { ok: true, focus: null }
  }

  // ---------- Foco (base): resultado → campo que lo recibe; sin resultado → quien abrió; si no, orden de #292 ----------
  const FOCUSABLE = 'a[href], button, input:not([type="hidden"]), select, textarea, [tabindex]'
  function usable(n) {
    if (!n || !n.isConnected || n.matches(':disabled') || n.closest('[inert], [hidden]')) return false
    const t = n.getAttribute('tabindex')
    if (t !== null && Number(t) < 0) return false
    return n.checkVisibility ? n.checkVisibility() : true
  }
  function focusEl(n) { if (usable(n)) { n.focus({ preventScroll: false }); return true } return false }
  function focusFirstIn(root, skip) {
    if (!root) return false
    const auto = [...root.querySelectorAll('[autofocus]')].find(usable)
    if (auto) return focusEl(auto)
    const first = [...root.querySelectorAll(FOCUSABLE)].find((n) => usable(n) && !(skip && n.matches(skip)))
    return focusEl(first)
  }
  function focusReturn(id, opener, root) {
    if (id && focusEl(document.getElementById(id))) return 'field'
    if (focusEl(opener)) return 'opener'
    if (focusFirstIn(root, '.g-dialog__close, .xb-back')) return 'first'
    return 'none'
  }
  // Marca el campo que recibió el valor (personalidad: «aterriza»); se quita al terminar o con reduce al instante
  function land(id) {
    const n = document.getElementById(id)
    const box = n && (n.closest('.g-select, .g-input, .xr-row') || n)
    if (!box) return
    box.classList.remove('is-landed')
    void box.offsetWidth
    box.classList.add('is-landed')
    setTimeout(() => box.classList.remove('is-landed'), 900)
  }

  window.Flow = { catalog, unidades, ocs, almacenes, labelOf, draft, errors, LEVELS, createFlow, commit, announce, placeLive, said, focusReturn, focusFirstIn, usable, land }
})()
