// Prototipo de kiwi · GText r01. «Después» de MK-L1 sobre los bloques REALES: sobre el DOM que pinta
// packages/blocks/dist/marketing.js (banco de bruno, packages/blocks/playground/marketing/*.html) pone las clases de
// trabajo de GText donde el bloque pondría <GText> (mismo elemento: `as` = la etiqueta que ya hay) o envuelve los párrafos
// en un div.g-text (as="div"). No toca packages/: lo usan index.html (iframe del mismo origen) y verificar.mjs.
// La tabla PLAN es la propuesta de uso por bloque para lima (declaracion.md, X-L7).
(function () {
  const CSS_HREF = new URL('./tx.css', document.currentScript ? document.currentScript.src : location.href).href
  const mark = (el, size = 'body', tone = 'default') => {
    el.classList.add('g-text', `g-text--size-${size}`, `g-text--tone-${tone}`)
    el.dataset.lab = `${el.tagName.toLowerCase()}·${size}·${tone}`
    return el
  }
  const wrap = (nodes, size = 'body', tone = 'default') => {
    if (!nodes.length) return null
    const d = nodes[0].ownerDocument.createElement('div')
    nodes[0].before(d)
    nodes.forEach((n) => d.append(n))
    return mark(d, size, tone)
  }
  const kids = (el, sel) => [...el.children].filter((c) => c.matches(sel))

  // gb (prefijo de data-gb) → transformación. Cada línea = un <GText …> en el bloque.
  const PLAN = {
    testimonials: (blk) => blk.querySelectorAll('figure').forEach((f) => {
      const dense = !!f.closest('.g-card') // en tarjeta, el contexto es body-sm (GCard)
      mark(f, dense ? 'sm' : 'body') //                    <GText as="figure" :size>
      f.querySelectorAll(':scope > blockquote').forEach((q) => mark(q, dense ? 'sm' : 'body')) // <GText as="blockquote" :size lang cite>
      f.querySelectorAll(':scope > figcaption').forEach((c) => mark(c, 'sm', 'muted')) //   <GText as="figcaption" size="sm" tone="muted">
    }),
    // assurance: sm muted; en el pie de GCard (02), el rol de ese hueco (caption), para no salirse de él
    cta: (blk) => blk.querySelectorAll('p[id]').forEach((p) => mark(p, p.closest('.g-card__footer') ? 'caption' : 'sm', 'muted')),
    newsletter: (blk) => blk.querySelectorAll('form.g-form > p').forEach((p) => mark(p, 'caption', 'muted')), // legal
    footer: (blk) => {
      blk.querySelectorAll('address').forEach((a) => mark(a, 'sm')) //  <GText as="address" size="sm">
      blk.querySelectorAll('p').forEach((p) => { if (!p.closest('address')) mark(p, 'caption', 'muted') }) // nota (<GText size="caption" tone="muted">)
    },
    stats: (blk) => blk.querySelectorAll('.g-container__body').forEach((b) => wrap(kids(b, 'p'))), // <GText as="div">
    faq: (blk) => blk.querySelectorAll('.g-accordion-item__body').forEach((b) => wrap(kids(b, 'p'))) // <GText as="div">
  }

  function apply (doc = document) {
    if (!doc.querySelector('link[data-lab-tx]')) {
      const l = doc.createElement('link'); l.rel = 'stylesheet'; l.href = CSS_HREF; l.dataset.labTx = '1'; doc.head.append(l)
    }
    for (const blk of doc.querySelectorAll('[data-gb]')) {
      const key = blk.dataset.gb.replace(/-\d+$/, '')
      if (PLAN[key] && !blk.dataset.labDone) { PLAN[key](blk); blk.dataset.labDone = '1' }
    }
    const l = doc.querySelector('link[data-lab-tx]')
    return l.sheet ? Promise.resolve() : new Promise((r) => l.addEventListener('load', r, { once: true }))
  }
  window.GTextLab = { apply, PLAN, CSS_HREF }
})()
