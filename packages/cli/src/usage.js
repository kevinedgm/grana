// Uso de cada token de color (texto para tokens.json y la documentación). Reglas en docs/contract/tokens.md §2 y §16.

const MEANING = {
  brand: 'Color de marca: acción principal, elemento activo y énfasis de la interfaz.',
  accent: 'Acento: selección, foco, enlaces y un segundo énfasis junto a la marca.',
  neutral: 'Sin significado de estado: insignias, etiquetas y acciones secundarias.',
  success: 'Estados positivos: confirmado, completado, cambios al alza.',
  warning: 'Estados que piden atención sin ser un error: por confirmar, pendiente.',
  danger: 'Errores de formulario, acciones destructivas y cancelaciones. Siempre acompañado de texto o icono.',
  info: 'Información neutral: avisos y ayudas que no cambian el estado.'
}

const FIXED = {
  primary: 'Acción principal y jerarquía interactiva de la interfaz. Hoy vale lo mismo que «brand» (alias); los componentes migrarán a este rol.',
  'primary-strong': 'Hover y presionado de «primary».',
  'primary-soft': 'Fondo suave de «primary».',
  'primary-text': 'Texto y enlaces de «primary» sobre la superficie (≥ 4.5:1).',
  'on-primary': 'Texto e iconos sobre el relleno sólido de «primary».',
  'on-primary-soft': 'Texto e iconos sobre el fondo suave de «primary».',
  link: 'Enlaces de la interfaz. Alias de «accent-text».',
  selection: 'Fondo de lo seleccionado. Alias de «accent-soft».',
  active: 'Elemento activo o en uso. Alias de «accent».',
  bg: 'Fondo de la página. Nunca para tarjetas.',
  surface: 'Superficie de tarjetas, formularios, cabeceras y paneles.',
  'surface-sunken': 'Superficie que se lee como «dentro» de otra: resúmenes, selectores, carcasas.',
  text: 'Texto principal y títulos sobre la superficie, la superficie hundida y el fondo.',
  'text-muted': 'Texto de apoyo: descripciones, metadatos y párrafos secundarios.',
  'text-subtle': 'Leyendas, contadores y marcas de tiempo. No usar por debajo de 12px.',
  border: 'Divisores y contorno de tarjetas en reposo.',
  'border-strong': 'Contorno en hover, botón de línea y chips.',
  'border-control': 'Contorno de campos de texto, casillas y selectores (3:1 sobre la superficie y sobre el relleno de solo lectura, neutral-soft).',
  focus: 'Anillo de foco de teclado; siempre visible.'
}

/** @param {string} name nombre sin el prefijo `--g-color-` (p. ej. «brand-soft», «on-danger», «cat-2-text») */
export const usageOf = (name) => {
  if (FIXED[name]) return FIXED[name]
  let m = /^on-(.+)-soft$/.exec(name)
  if (m) return `Texto e iconos sobre el fondo suave de «${m[1]}».`
  m = /^on-(.+)$/.exec(name)
  if (m) return `Texto e iconos sobre el relleno sólido de «${m[1]}».`
  m = /^(.+)-(strong|soft|text)$/.exec(name)
  const [, base, kind] = m ?? []
  const what = (b) => (/^cat-\d+$/.test(b) ? `la categoría ${b.slice(4)}` : `«${b}»`)
  if (kind === 'strong') return `Hover y presionado del relleno sólido de ${what(base)}.`
  if (kind === 'soft') return `Fondo suave de ${what(base)}: insignias, avisos y estados.`
  if (kind === 'text') return `Texto, iconos y enlaces de color de ${what(base)} sobre la superficie (≥ 4.5:1).`
  if (/^cat-\d+$/.test(name)) return `Categoría ${name.slice(4)}: relleno sólido; su fondo suave y su tinta son «${name}-soft» y «${name}-text». Para iconos, etiquetas e identificación visual; no es una paleta de gráficas de datos.`
  return MEANING[name] ? `${MEANING[name]} Relleno sólido; siempre con «on-${name}».` : 'Color del tema.'
}
