// Destino de un enlace según su atributo `target` (interno; dueño: bruno). api.md «Enlaces y `navigate`» (#505 con #574).
// Otro contexto: con valor y distinto de `_self` (`_blank`, un nombre de ventana, `_parent`, `_top`): no se emite `navigate`.
// Otra pestaña: `_blank` o un nombre de ventana (no empieza por `_`); `_parent` y `_top` no lo son (menu.md «Elementos-enlace»).
// Los nombres reservados de `target` no distinguen mayúsculas (HTML). Un `<base target>` del documento no cuenta (límite).
const norm = (t) => (typeof t === 'string' ? t.trim().toLowerCase() : '')
export const otherContext = (t) => { const v = norm(t); return v !== '' && v !== '_self' }
export const newTab = (t) => { const v = norm(t); return v === '_blank' || (v !== '' && v[0] !== '_') }
