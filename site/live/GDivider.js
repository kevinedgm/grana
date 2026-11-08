// Ficha interactiva de GDivider. El vertical exige una fila flex: el anfitrión usa GBtn y GText reales.
import { h } from 'vue'
import { GBtn, GDivider, GText } from '@grana/vue'

function Host(props) {
  const vertical = props.orientation === 'vertical'
  const box = { display: 'flex', gap: 'var(--g-space-2)', flexDirection: vertical ? 'row' : 'column', alignItems: vertical ? 'center' : 'stretch', inlineSize: vertical ? 'auto' : '100%' }
  const kids = vertical
    ? [h(GBtn, { variant: 'ghost', size: 'sm' }, () => 'Editar'), h(GDivider, props), h(GBtn, { variant: 'ghost', size: 'sm' }, () => 'Compartir')]
    : [h(GText, null, () => 'El envío estándar llega en tres a cinco días hábiles.'), h(GDivider, props), h(GText, null, () => 'Las devoluciones se aceptan durante 30 días.')]
  return h('div', { style: box }, kids)
}

export default {
  exclude: [],
  text: ['label'],
  base: {},
  block: true,
  host: Host,
  codeFor: (state, slots, tpl) => {
    const ind = (t, n) => t.replace(/\n/g, '\n' + ' '.repeat(n))
    if (state.orientation === 'vertical') {
      return `<div class="barra" role="group" aria-label="Edición">\n  <g-btn variant="ghost" size="sm">Editar</g-btn>\n  ${ind(tpl, 2)}\n  <g-btn variant="ghost" size="sm">Compartir</g-btn>\n</div>\n\n<style>\n.barra { display: flex; align-items: center; gap: var(--g-space-2); }\n</style>`
    }
    return `<div class="pila">\n  <g-text>El envío estándar llega en tres a cinco días hábiles.</g-text>\n  ${ind(tpl, 2)}\n  <g-text>Las devoluciones se aceptan durante 30 días.</g-text>\n</div>\n\n<style>\n.pila { display: flex; flex-direction: column; gap: var(--g-space-2); }\n</style>`
  },
  cases: [
    {
      title: { es: 'Separar dos opciones de acceso', en: 'Separate two sign-in options' },
      why: { es: 'Con texto centrado («O bien»): frase corta; si el texto titula lo que sigue, usa un encabezado, no un divider.', en: 'With centered text (“Or”): a short phrase; if the text titles what follows, use a heading, not a divider.' },
      props: { label: { es: 'O bien', en: 'Or' } }
    },
    {
      title: { es: 'Línea que es la única señal', en: 'Line as the only cue' },
      why: { es: 'emphasis strong cuando solo la línea separa dos grupos (≥ 3:1); si ya los separa el espacio o un título, deja subtle.', en: 'emphasis strong when only the line separates two groups (≥ 3:1); if space or a title already separates them, keep subtle.' },
      props: { emphasis: 'strong' }
    },
    {
      title: { es: 'Entre grupos de una barra de acciones', en: 'Between groups in an action bar' },
      why: { es: 'Vertical: debe ser hijo directo de una fila flex o grid; en un bloque mide 0 de alto y avisa.', en: 'Vertical: it must be a direct child of a flex row or a grid; in a block it measures 0 high and warns.' },
      props: { orientation: 'vertical' }
    },
    {
      title: { es: 'Separador que solo decora', en: 'Separator that only decorates' },
      why: { es: 'decorative lo quita del árbol de accesibilidad cuando los títulos ya estructuran el contenido; si separa de verdad, déjalo como separador.', en: 'decorative removes it from the accessibility tree when headings already structure the content; if it really separates, keep it as a separator.' },
      props: { decorative: true, inset: 'both' }
    }
  ]
}
