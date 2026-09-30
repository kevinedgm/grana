// Sustituye los marcadores {nombre} de un texto (los textos los pone la aplicación).
// Un marcador sin valor se deja tal cual.
export const fill = (text, vars = {}) =>
  typeof text === 'string'
    ? text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] === undefined || vars[k] === null ? m : String(vars[k])))
    : ''
