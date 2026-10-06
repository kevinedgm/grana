// Motor puro de GFileField (dueño: bruno): formato de tamaños, `accept`, validación de un gesto y tipos durante el arrastre.
// Sin estado, sin DOM, sin red. Contrato: design/contracts/file-field.md «Añadir y validar» y «Arrastre de página» (#370,
// #373). Referencia de comportamiento: design/lab/file-field/engine.js (kiwi).

// Unidades decimales (SI, como Finder, iOS y Android), L9
const UNITS = [['byte', 1], ['kilobyte', 1e3], ['megabyte', 1e6], ['gigabyte', 1e9]]

const safeLocale = (locale) => {
  if (!locale) return undefined
  try {
    return Intl.NumberFormat.supportedLocalesOf([locale]).length ? locale : undefined
  } catch {
    return undefined
  }
}

/**
 * Tamaño legible con `Intl.NumberFormat(locale, { style: 'unit', unitDisplay: 'short' })`, unidades decimales y una cifra
 * decimal por debajo de 10 («220 kB», «1,2 MB»). La misma función escribe la ficha, el aviso y la pista de la aplicación.
 * @param {number} bytes
 * @param {string} [locale] etiqueta BCP 47; sin ella, la del entorno
 */
export function formatFileSize(bytes, locale) {
  const n = Number(bytes)
  const b = Number.isFinite(n) && n > 0 ? n : 0
  let u = UNITS[0]
  for (const x of UNITS) if (b >= x[1]) u = x
  const v = b / u[1]
  const opts = { style: 'unit', unit: u[0], unitDisplay: 'short', maximumFractionDigits: v < 10 && u[1] > 1 ? 1 : 0 }
  try {
    return new Intl.NumberFormat(safeLocale(locale), opts).format(v)
  } catch {
    return `${Math.round(v * 10) / 10} ${u[0]}`
  }
}

const tokensOf = (accept) => String(accept || '').split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)

/** ¿El archivo casa con `accept`? Por extensión (`.pdf`, sin mayúsculas) y por MIME (`application/pdf`, `image/*`). */
export function accepts(file, accept) {
  const toks = tokensOf(accept)
  if (!toks.length) return true
  const name = String(file?.name || '').toLowerCase()
  const type = String(file?.type || '').toLowerCase()
  return toks.some((t) => {
    if (t.startsWith('.')) return name.endsWith(t)
    if (!type) return false // sin MIME, solo por extensión
    if (t.endsWith('/*')) return type.startsWith(t.slice(0, -1))
    return type === t
  })
}

/**
 * Durante el arrastre solo se conoce el MIME (Safari a veces ni eso; nunca el nombre). Si `accept` lleva alguna extensión o
 * no hay tipos, se da por bueno y la decisión final es al soltar; si no, cada MIME debe casar con `accept` (r01, 12).
 */
export function dragAccepts(types, accept) {
  const toks = tokensOf(accept)
  const list = Array.isArray(types) ? types : []
  if (!toks.length || !list.length) return true
  if (toks.some((t) => t.startsWith('.'))) return true
  return list.every((t) => !t || accepts({ name: '', type: t }, accept))
}

// Imágenes que el navegador pinta en un <img> (miniatura de la ficha); el resto de image/* (HEIC…) lleva el icono
const PREVIEW = /^image\/(png|jpe?g|gif|webp|avif|bmp|svg\+xml)$/i
export const isPreviewable = (type) => PREVIEW.test(String(type || ''))
export const iconOf = (type) => (/^image\//i.test(String(type || '')) ? 'image' : 'file-text')

/** Duplicado: mismo name, size y lastModified que una entrada con `file`. */
export const sameFile = (a, b) => Boolean(a && b) && a.name === b.name && a.size === b.size && a.lastModified === b.lastModified

/**
 * Valida los archivos de un gesto, en este orden por archivo: tipo › vacío › tamaño › duplicado › número (entran los
 * primeros que caben). Con `single` (sin `multiple`) entra el primero que pasa y el resto es `count`; no hay duplicados
 * (el nuevo reemplaza al que había).
 * @param {File[]} files
 * @param {{ accept?: string, maxSize?: number, room: number, single: boolean, existing: File[] }} o
 * @returns {{ accepted: File[], rejected: Array<{ file: File, name: string, reason: 'type'|'empty'|'size'|'duplicate'|'count' }> }}
 */
export function validate(files, o) {
  const accepted = []
  const rejected = []
  let room = o.single ? 1 : o.room
  for (const file of files) {
    let reason = null
    if (!accepts(file, o.accept)) reason = 'type'
    else if (!file.size) reason = 'empty'
    else if (o.maxSize && file.size > o.maxSize) reason = 'size'
    else if (!o.single && [...(o.existing || []), ...accepted].some((f) => sameFile(f, file))) reason = 'duplicate'
    else if (room <= 0) reason = 'count'
    if (reason) {
      rejected.push({ file, name: file.name, reason })
      continue
    }
    accepted.push(file)
    room--
  }
  return { accepted, rejected }
}
