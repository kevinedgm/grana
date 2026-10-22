// Texto plano de los datos (dueño: bruno; _comun.md §2): párrafos separados por una línea en blanco.
export const has = (v) => typeof v === 'string' ? v.trim() !== '' : v !== undefined && v !== null && v !== ''

export const paragraphs = (text) => (typeof text === 'string' ? text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) : [])
