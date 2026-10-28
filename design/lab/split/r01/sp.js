// Prototipo de kiwi · GSplit r01. «Después» de EC-L7 sobre los bloques REALES: sobre el DOM que pintan
// packages/blocks/dist/{ecommerce,booking}.js (bancos de bruno, packages/blocks/playground/**) pone un div.sp con dos
// div.sp__region donde el bloque pondría <GSplit> con sus slots start y end, y mueve dentro los dos envoltorios que hoy son
// hijos de GAdaptiveLayout (o de GStack). El contenedor viejo queda vacío y `hidden`. No toca packages/: lo usan index.html
// (iframe del mismo origen) y verificar.mjs. Limitación del laboratorio: mover nodos de Vue vale para medir y recorrer con
// Tab; un re-render que reinserte en el contenedor viejo fallaría (no se ejercita).
// La tabla PLAN es la propuesta de uso por bloque para lima (declaracion.md, S-L6).
(function () {
  const CSS_HREF = new URL('./sp.css', document.currentScript ? document.currentScript.src : location.href).href
  // gb → [selector del contenedor actual dentro del bloque, props de GSplit]
  const PLAN = {
    'product-overview-01': { from: '.g-adaptive-layout', ratio: '1-1', gap: 'lg', collapse: 'lg' }, // galería | panel
    'cart-01': { from: '.g-adaptive-layout', ratio: '3-2', gap: 'lg', collapse: 'md' }, //               líneas | resumen
    'checkout-03': { from: '.g-adaptive-layout', ratio: '3-2', gap: 'lg', collapse: 'md' }, //            pasos | pedido
    'availability-03': { from: '.g-price-scope > .g-stack', ratio: '2-1', gap: 'lg', collapse: 'md' } // calendario | tarjeta
    // booking-summary-03: NO es un caso de GSplit (tres piezas en una línea; GAdaptiveLayout, #906). Ver declaracion.md
  }
  const q = new URLSearchParams(location.search)
  function build (doc, gb, cfg) {
    const blk = doc.querySelector(`[data-gb="${gb}"]`)
    if (!blk || blk.dataset.labSplit) return null
    const from = blk.querySelector(cfg.from)
    if (!from) return null
    const kids = [...from.children]
    const sp = doc.createElement('div')
    const ratio = q.get('ratio') || cfg.ratio
    const gap = q.get('gap') || cfg.gap
    const collapse = q.get('collapse') || cfg.collapse
    sp.className = `sp sp--ratio-${ratio} sp--gap-${gap} sp--collapse-${collapse}`
    sp.dataset.lab = `<GSplit ratio="${ratio.replace('-', ':')}" gap="${gap}" collapse="${collapse}">`
    kids.forEach((k, i) => {
      const r = doc.createElement('div')
      r.className = `sp__region sp__region--${i === 0 ? 'start' : 'end'}`
      r.append(k)
      sp.append(r)
    })
    from.before(sp)
    from.hidden = true
    blk.dataset.labSplit = '1'
    return sp
  }
  function apply (doc = document) {
    if (!doc.querySelector('link[data-lab-sp]')) {
      const l = doc.createElement('link'); l.rel = 'stylesheet'; l.href = CSS_HREF; l.dataset.labSp = '1'; doc.head.append(l)
    }
    for (const [gb, cfg] of Object.entries(PLAN)) build(doc, gb, cfg)
    const l = doc.querySelector('link[data-lab-sp]')
    return l.sheet ? Promise.resolve() : new Promise((r) => l.addEventListener('load', r, { once: true }))
  }
  window.GSplitLab = { apply, PLAN, CSS_HREF }
})()
