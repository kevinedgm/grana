// Categoría de color por clave (dueño: bruno). INTERNA: no se exporta desde src/index.js (avatar.md «Hash», #294; #469).
// Una sola copia del hash para GAvatar, GTag y GTagGroup: la misma clave da la misma categoría en una etiqueta y en un
// avatar, entre motores y en el servidor. FNV-1a de 32 bits sobre los octetos UTF-8 de la clave normalizada (NFC, recorte,
// espacios Unicode colapsados a uno, toLowerCase() sin configuración regional) + finalizador fmix32; resultado mod n + 1.
// Los vectores de prueba de avatar.md están en categoryHash.test.js: el resultado no cambia sin decisión de lima.
// Sin lecturas de document ni window (SSR).

/** Octetos UTF-8 (TextEncoder si existe; si no, codificación propia equivalente) */
const utf8 = (s) => {
  if (typeof TextEncoder === 'function') return new TextEncoder().encode(s)
  const out = []
  for (const ch of s) {
    let c = ch.codePointAt(0)
    if (c >= 0xd800 && c <= 0xdfff) c = 0xfffd // sustituto suelto → U+FFFD, como TextEncoder
    if (c < 0x80) out.push(c)
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63))
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63))
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63))
  }
  return out
}

/**
 * Categoría 1..n de una clave; null sin clave (vacía tras normalizar) o con n que no es un entero de 1 a 12.
 * @param {string|number} key  colorKey ?? name (GAvatar) · colorKey ?? facet ?? label (GTag, GTagGroup)
 * @param {number} n           categorías del tema (categories: n)
 */
export function categoryOf(key, n) {
  if (!Number.isInteger(n) || n < 1 || n > 12) return null
  if (key === undefined || key === null) return null
  const s = String(key).normalize('NFC').trim().replace(/\s+/gu, ' ').toLowerCase()
  if (!s) return null
  let h = 0x811c9dc5
  for (const b of utf8(s)) {
    h ^= b
    h = Math.imul(h, 0x01000193)
  }
  h ^= h >>> 16
  h = Math.imul(h, 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return ((h >>> 0) % n) + 1
}
