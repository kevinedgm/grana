// Utilidades compartidas de GTabs y GTabPanel (dueño: bruno)
// Contrato: design/contracts/tabs.md
export const TABS_NEST = Symbol('g-tabs-nest')

// Ids que enlazan pestaña y panel (pestaña ID-tab-{id}, panel ID-panel-{id})
export const tabDomId = (root, id) => `${root}-tab-${id}`
export const panelDomId = (root, id) => `${root}-panel-${id}`

const FOCUSABLE = 'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, iframe, audio[controls], video[controls], [contenteditable]:not([contenteditable="false"]), [tabindex]:not([tabindex="-1"])'

// ¿El panel contiene algo que el teclado ya alcance? Si no, el panel mismo debe poder recibir el foco (APG).
export const hasFocusable = (el) => Boolean(el && el.querySelector(FOCUSABLE))

export const isRtl = (el) => {
  if (!el || typeof getComputedStyle !== 'function') return false
  if (getComputedStyle(el).direction === 'rtl') return true
  const host = el.closest?.('[dir]')
  return Boolean(host && host.getAttribute('dir') === 'rtl')
}
