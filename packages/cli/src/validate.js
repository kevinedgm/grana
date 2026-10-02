// Validación del tema contra los mínimos de accesibilidad (docs/contract/tokens.md §7 y §12).
// Cada problema explica QUÉ se rompió y POR QUÉ importa.
import { contrast, parseHex, toHex } from './color.js'
import { DEFAULTS } from './defaults.js'
import { MIN_DISTANCE, SEMANTIC, anchorLabel, distance } from './palette.js'
import { toOklch } from './color.js'

export const COLOR_NAMES = ['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']
const BLACK = [0, 0, 0]
const WHITE = [255, 255, 255]

// Resuelve `var(--x)` recursivamente y devuelve el valor final como texto
const resolve = (tokens, value, depth = 0) => {
  const m = /^var\((--[a-z0-9-]+)\)$/.exec(String(value).trim())
  if (!m || depth > 8) return String(value).trim()
  return resolve(tokens, tokens[m[1]] ?? '', depth + 1)
}
const over = (fg, alpha, bg) => fg.map((c, i) => c * alpha + bg[i] * (1 - alpha))

// Color de un token como [r,g,b], compuesto sobre `bg` si tiene transparencia; null si no se puede leer
const colorOf = (tokens, name, bg = [255, 255, 255]) => {
  const v = resolve(tokens, tokens[name])
  const hex = parseHex(v)
  if (hex) return hex
  const m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[/,]\s*([\d.]+%?)\s*)?\)$/.exec(v)
  if (!m) return null
  const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4])
  return over([+m[1], +m[2], +m[3]], a, bg)
}
const lengthPx = (v) => {
  const m = /^(-?[\d.]+)(px|rem)$/.exec(String(v).trim())
  return m ? parseFloat(m[1]) * (m[2] === 'rem' ? 16 : 1) : null
}
const fmt = (n) => (Math.round(n * 100) / 100).toString()

/** @param {Record<string,string>} tokens tema completo (defaults + generado + overrides) */
export const validateTheme = (tokens, { generated = {}, scheme = 'light', accentDerived = false } = {}) => {
  const dark = scheme === 'dark'
  const issues = []
  const add = (id, severity, message, why, extra = {}) => issues.push({ id, severity, message, why, ...extra })
  const unreadable = (name) => add('unverifiable', 'warning', `No se pudo leer el color de ${name} («${tokens[name]}»): no se verificó su contraste.`, 'Usa hex (#RRGGBB) o rgb() para que el CLI pueda comprobarlo.', { tokens: [name] })
  const pair = (fgName, bgName, min, id, why, bgOverride) => {
    const bg = bgOverride ?? colorOf(tokens, bgName)
    const fg = bg && colorOf(tokens, fgName, bg)
    if (!bg) return unreadable(bgName)
    if (!fg) return unreadable(fgName)
    const ratio = contrast(fg, bg)
    if (ratio + 1e-9 < min) {
      add(id, 'error', `${fgName} sobre ${bgName}: contraste ${fmt(ratio)}:1, mínimo ${min}:1.`, why, { tokens: [fgName, bgName], ratio: +ratio.toFixed(2), min })
    }
  }

  // Foco (§7): siempre visible y de al menos 2px
  const fw = lengthPx(tokens['--g-focus-width'])
  if (dark) { /* el ancho del foco no cambia con el esquema: ya se validó en el claro */ } else if (fw === null) unreadable('--g-focus-width')
  else if (fw < 2) add('focus-width', 'error', `--g-focus-width es ${fmt(fw)}px; el mínimo es 2px.`, 'WCAG 2.4.13 pide un indicador de foco de al menos 2px: con menos, el foco deja de verse.', { tokens: ['--g-focus-width'] })
  pair('--g-color-focus', '--g-color-surface', 3, 'focus-contrast', 'WCAG 1.4.11: el anillo de foco necesita 3:1 contra la superficie.')

  // Texto y neutros sobre las dos superficies
  for (const s of ['--g-color-surface', '--g-color-surface-sunken']) {
    for (const t of ['--g-color-text', '--g-color-text-muted', '--g-color-text-subtle']) {
      pair(t, s, 4.5, 'text-contrast', 'WCAG 1.4.3: el texto necesita 4.5:1 contra su fondo.')
    }
    pair('--g-color-border-control', s, 3, 'border-control', 'WCAG 1.4.11: el borde de un control necesita 3:1 para identificarlo.')
  }
  // Solo lectura (#186): la caja se rellena con neutral-soft (compuesto sobre la superficie) y conserva el borde
  // discontinuo border-control, que tiene que seguir identificando el campo
  const surface = colorOf(tokens, '--g-color-surface')
  pair('--g-color-border-control', '--g-color-neutral-soft', 3, 'border-control-readonly', 'WCAG 1.4.11: el campo de solo lectura se rellena con --g-color-neutral-soft y su borde (border-control) necesita 3:1 sobre ese relleno para seguir identificándolo (DECISIONS.md #186).', surface ? colorOf(tokens, '--g-color-neutral-soft', surface) || undefined : undefined)

  // Cada color: relleno sólido, blando y texto de color
  // Categorías (--g-color-cat-N) presentes en el tema: los mismos pares que el resto de colores
  const cats = [...new Set(Object.keys(tokens).map((k) => /^--g-color-(cat-\d+)$/.exec(k)?.[1]).filter(Boolean))]
  for (const c of [...COLOR_NAMES, 'primary', ...cats]) {
    pair(`--g-color-on-${c}`, `--g-color-${c}`, 4.5, 'on-solid', `WCAG 1.4.3: el texto sobre el relleno sólido de «${c}» necesita 4.5:1.`)
    pair(`--g-color-on-${c}-soft`, `--g-color-${c}-soft`, 4.5, 'on-soft', `WCAG 1.4.3: el texto sobre el relleno suave de «${c}» necesita 4.5:1.`)
    pair(`--g-color-${c}-text`, '--g-color-surface', 4.5, 'color-text', `WCAG 1.4.3: el texto de color «${c}» sobre la superficie necesita 4.5:1.`)
    pair(`--g-color-on-${c}`, `--g-color-${c}-strong`, 4.5, 'on-strong', `WCAG 1.4.3: el texto sobre el estado hover («strong») de «${c}» necesita 4.5:1.`)
  }

  // Tamaño mínimo de texto (§7): 12px
  for (const [k, v] of dark ? [] : Object.entries(tokens)) {
    if (!/^--g-text-[a-z-]+-size$/.test(k)) continue
    const px = lengthPx(v)
    if (px !== null && px < 12 - 1e-9) add('font-size', 'error', `${k} es ${fmt(px)}px; el mínimo es 12px.`, 'Texto por debajo de 12px es ilegible para muchos usuarios (mínimo de accesibilidad de Grana, contrato §7).', { tokens: [k] })
  }

  // Cristal (§12): el texto sobre el velo debe llegar a 4.5:1 contra el peor fondo (negro)
  const opacity = parseFloat(resolve(tokens, tokens['--g-glass-opacity']))
  if (Number.isFinite(opacity)) {
    if (opacity < 0.55) add('glass-opacity', 'error', `--g-glass-opacity es ${fmt(opacity)}; el mínimo es 0.55.`, 'Con un velo más transparente, el texto de las insignias de cristal pierde legibilidad sobre fondos oscuros.', { tokens: ['--g-glass-opacity'] })
    const text = colorOf(tokens, '--g-color-text')
    const veils = ['--g-glass-tint', ...COLOR_NAMES.map((c) => `--g-color-${c}-soft`)]
    if (text) {
      const failing = []
      for (const v of veils) {
        const tint = colorOf(tokens, v)
        if (!tint) { unreadable(v); continue }
        const composite = over(tint, Math.min(1, Math.max(0, opacity)), dark ? WHITE : BLACK)
        const ratio = contrast(text, composite)
        if (ratio + 1e-9 < 4.5) failing.push({ v, ratio, composite })
      }
      if (failing.length) {
        const worst = failing.reduce((a, b) => (b.ratio < a.ratio ? b : a))
        add('glass-contrast', 'error', `Texto sobre cristal (opacidad ${fmt(opacity)}) sobre un fondo ${dark ? 'blanco' : 'negro'}: contraste ${fmt(worst.ratio)}:1 en el peor velo (${worst.v}, compuesto ${toHex(worst.composite)}); mínimo 4.5:1. Fallan ${failing.length} de ${veils.length} velos: ${failing.map((f) => f.v).join(', ')}.`, 'WCAG 1.4.3: el cristal deja pasar el fondo; el peor caso es el negro. Sube --g-glass-opacity o usa un velo más claro / un texto más oscuro.', { tokens: ['--g-glass-opacity', '--g-color-text', ...failing.map((f) => f.v)], ratio: +worst.ratio.toFixed(2), min: 4.5 })
      }
    } else unreadable('--g-color-text')
  } else add('unverifiable', 'warning', `No se pudo leer --g-glass-opacity («${tokens['--g-glass-opacity']}»).`, 'Debe ser un número entre 0 y 1.', { tokens: ['--g-glass-opacity'] })

  // Espaciado: los controles tienen piso de 24px, pero con una unidad muy pequeña se pierde densidad
  const unit = lengthPx(tokens['--g-space-1'])
  if (!dark && unit !== null && unit < 4) add('space-small', 'warning', `--g-space-1 es ${fmt(unit)}px: los controles xs (6 unidades) medirían ${fmt(unit * 6)}px.`, 'Los componentes aplican un piso de 24px (WCAG 2.5.8), así que los tamaños pequeños dejan de diferenciarse.', { tokens: ['--g-space-1'] })

  // Semánticos demasiado parecidos a la marca o al acento (tokens.md §16): si el usuario los fija con `overrides`, o si no hubo forma de separarlos
  const lch = (name) => { const c = colorOf(tokens, name); return c ? toOklch(c) : null }
  for (const sem of SEMANTIC) {
    const b = lch(`--g-color-${sem}`)
    if (!b) continue
    let nearest = null
    for (const anchor of ['brand', 'accent', 'primary']) {
      const a = lch(`--g-color-${anchor}`)
      if (!a) continue
      const d = distance(a, b)
      if (d > 0.005 && (!nearest || d < nearest.d)) nearest = { anchor, d } // d ≈ 0: idéntico a propósito (p. ej. el acento por defecto y «info»)
    }
    if (nearest && nearest.d < MIN_DISTANCE - 1e-9) {
      // El origen real: un acento que el usuario no definió viene de la marca, y el mensaje lo dice (la colisión concreta sigue siendo con `accent`)
      const derivedAccent = nearest.anchor === 'accent' && accentDerived
      const label = anchorLabel(nearest.anchor, accentDerived)
      const fix = derivedAccent ? `ajusta «brand» (el acento se deriva de ella) o define «accent»` : `ajusta «${nearest.anchor}»`
      add('semantic-close', 'warning', `«${sem}» se parece ${label} (distancia ${fmt(nearest.d)}; mínimo ${MIN_DISTANCE}).`, `Un ${sem === 'danger' ? 'error' : 'estado'} que se confunde con el color de marca deja de leerse como tal. Cambia el tono de «${sem}» con overrides o ${fix}.`, { tokens: [`--g-color-${sem}`, `--g-color-${nearest.anchor}`], distance: +nearest.d.toFixed(3), min: MIN_DISTANCE, collidedWith: nearest.anchor, accentDerived: derivedAccent })
    }
  }

  // Tokens explícitos que no existen (erratas)
  for (const k of Object.keys(generated)) {
    if (!(k in DEFAULTS) && !/^--g-color-(on-)?cat-\d+(-|$)/.test(k)) add('unknown-token', 'warning', `«${k}» no es un token de Grana.`, 'Puede ser una errata: ningún componente lo lee.', { tokens: [k] })
  }
  return dark ? issues.map((i) => ({ ...i, scheme: 'dark', message: `[oscuro] ${i.message}` })) : issues
}
