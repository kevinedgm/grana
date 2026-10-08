// Contexto de GAccordion (interno; dueño: bruno). NO se exporta desde src/index.js.
// Contrato: design/contracts/accordion.md. Cada GAccordionItem vuelve a proveer la clave como null a su contenido: un
// elemento pertenece al GAccordion más cercano por encima SIN otro elemento entre medias (#478).

export const accordionKey = Symbol('GAccordion')

// ---------- #id del elemento (#482): una sola escucha de hashchange compartida por todos los elementos ----------
// Se pone con el primer elemento montado y se quita con el último (sin efectos en el nivel superior del módulo, #444).
const hashSubs = new Set()
function onHashchange() {
  for (const fn of [...hashSubs]) fn()
}
/** Suscribe `fn` a hashchange. Devuelve la función que se da de baja. */
export function subscribeHash(fn) {
  if (typeof window === 'undefined') return () => {}
  if (!hashSubs.size) window.addEventListener('hashchange', onHashchange)
  hashSubs.add(fn)
  return () => {
    if (!hashSubs.delete(fn)) return
    if (!hashSubs.size) window.removeEventListener('hashchange', onHashchange)
  }
}
/** Fragmento actual, decodificado (sin «#»); '' si no hay. */
export function currentHash() {
  if (typeof location === 'undefined') return ''
  const raw = location.hash || ''
  if (raw.length < 2) return ''
  try {
    return decodeURIComponent(raw.slice(1))
  } catch {
    return raw.slice(1)
  }
}

/** Lo interactivo que no puede ir dentro de un botón ni en la descripción (avisos 6 y 7). */
export const INTERACTIVE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable]:not([contenteditable="false"])'
/** Controles de formulario (aviso 8, #486). */
export const FORM_CONTROLS = 'input:not([type="hidden"]), select, textarea'
