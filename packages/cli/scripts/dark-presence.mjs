// Investigación «Dark Color Presence» (design/lab/tema-oscuro/investigacion-dark-color-presence.md): SOLO MIDE.
// No modifica ninguna regla. Para una muestra de marcas y acentos, deriva el tema oscuro con el CLI actual y mide la
// presencia de cada color sobre la superficie oscura: contraste WCAG, APCA (segunda opinión), L y C en OKLCH y la
// distancia OKLab a la superficie. Uso: node scripts/dark-presence.mjs [--json]
import { buildTheme } from '../src/index.js'
import { contrast, fromOklch, parseHex, toHex, toOklch } from '../src/color.js'
import { distance } from '../src/palette.js'

// APCA (W3 0.0.98G-4g): Lc del texto `fg` sobre el fondo `bg` (valores sRGB 0-255). Solo informativo.
const apca = (fg, bg) => {
  const y = ([r, g, b]) => { const f = (v) => (v / 255) ** 2.4; const c = 0.2126729 * f(r) + 0.7151522 * f(g) + 0.072175 * f(b); return c < 0.022 ? c + (0.022 - c) ** 1.414 : c }
  const yf = y(fg), yb = y(bg)
  if (Math.abs(yb - yf) < 0.0005) return 0
  const lc = yb > yf ? (yb ** 0.56 - yf ** 0.57) * 1.14 : (yb ** 0.65 - yf ** 0.62) * 1.14
  const v = Math.abs(lc) < 0.1 ? 0 : lc > 0 ? lc - 0.027 : lc + 0.027
  return Math.round(v * 100 * 10) / 10
}

// Muestra: una rueda de tonos al mismo L y C (mide el efecto del tono) + marcas reales de familias variadas
const wheel = Array.from({ length: 12 }, (_, k) => ({ name: `h${k * 30}`, hex: toHex(fromOklch({ l: 0.52, c: 0.15, h: k * 30 }).map(Math.round)) }))
const brands = [
  ['rojo carmesí', '#9D1635'], ['rojo', '#C4321F'], ['naranja', '#D2551E'], ['ámbar', '#B8740B'], ['oro Lustre', '#F5B940'],
  ['amarillo', '#E6C200'], ['verde oliva', '#5B6B0A'], ['verde', '#1E7A46'], ['esmeralda', '#0F7A55'], ['verde azulado', '#0F766E'],
  ['cian', '#0E7490'], ['azul', '#0B63CE'], ['azul marino', '#0B1F4D'], ['índigo', '#3730A3'], ['violeta Lustre', '#5B3FE0'],
  ['púrpura', '#7A1F5C'], ['magenta', '#B3236F'], ['rosa', '#D85A70'], ['gris azulado', '#475569'], ['casi negro', '#1F1F1F']
].map(([name, hex]) => ({ name, hex }))

const surfaceOf = (r) => parseHex(r.dark.tokens['--g-color-surface'])
const measure = (hex, surface) => {
  const c = parseHex(hex), k = toOklch(c), s = toOklch(surface)
  return { hex, L: +k.l.toFixed(3), C: +k.c.toFixed(3), wcag: +contrast(c, surface).toFixed(2), apca: apca(c, surface), dE: +distance(k, s).toFixed(3) }
}

const rows = []
for (const { name, hex } of [...wheel, ...brands]) {
  // la muestra se usa como brand y como accent (por separado, para aislar cada derivación)
  for (const role of ['accent', 'brand']) {
    const cfg = role === 'accent' ? { brand: '#1F1F1F', accent: hex } : { brand: hex }
    const r = buildTheme(cfg)
    const tok = role === 'accent' ? '--g-color-accent' : '--g-color-brand'
    const surface = surfaceOf(r)
    const light = toOklch(parseHex(hex))
    rows.push({ name, role, light: { L: +light.l.toFixed(3), C: +light.c.toFixed(3) }, dark: measure(r.dark.tokens[tok], surface) })
  }
}
// semánticos oscuros por defecto (no cambian con la marca salvo colisión)
const base = buildTheme({})
const sem = ['success', 'warning', 'danger', 'info'].map((n) => ({ name: n, ...measure(base.dark.tokens[`--g-color-${n}`], surfaceOf(base)) }))
// referencias hechas a mano (Lustre, oscuro) sobre su papel #1B1A1F
const lustre = [['violeta', '#B2A4FF'], ['éxito', '#4ED3A0'], ['alerta', '#F2B55A'], ['peligro', '#FF8A80'], ['oro', '#F5B940']].map(([name, hex]) => ({ name, ...measure(hex, parseHex('#1B1A1F')) }))

if (process.argv.includes('--json')) { console.log(JSON.stringify({ rows, sem, lustre }, null, 2)); process.exit(0) }
const f = (x) => String(x).padEnd(7)
console.log('## Acento derivado en oscuro (la muestra como `accent`)\n')
console.log('muestra'.padEnd(16), 'L clara'.padEnd(8), 'C', ' ', '→ oscuro: L'.padEnd(12), 'C'.padEnd(7), 'WCAG'.padEnd(7), 'APCA'.padEnd(7), 'ΔE a superficie')
for (const r of rows.filter((x) => x.role === 'accent')) console.log(r.name.padEnd(16), f(r.light.L), f(r.light.C), f(r.dark.L), f(r.dark.C), f(r.dark.wcag), f(r.dark.apca), r.dark.dE)
console.log('\n## Semánticos oscuros por defecto\n')
for (const s of sem) console.log(s.name.padEnd(10), s.hex, 'L', f(s.L), 'C', f(s.C), 'WCAG', f(s.wcag), 'APCA', f(s.apca), 'ΔE', s.dE)
console.log('\n## Referencia hecha a mano (Lustre, oscuro)\n')
for (const s of lustre) console.log(s.name.padEnd(10), s.hex, 'L', f(s.L), 'C', f(s.C), 'WCAG', f(s.wcag), 'APCA', f(s.apca), 'ΔE', s.dE)

// ---------- Simulación de reglas candidatas (SOLO MEDICIÓN: no cambia ninguna derivación) ----------
// Para cada tono de la rueda (L y C como en la muestra), se sube L hasta un piso y se mide qué pasa con el croma
// (la gama sRGB lo recorta a L alto), la presencia y si el texto `on` sigue cumpliendo 4.5:1.
if (process.argv.includes('--simulate')) {
  const surface = surfaceOf(buildTheme({ brand: '#1F1F1F', accent: '#0B63CE' }))
  const ink = parseHex('#17151A')
  const floors = [0.66, 0.7, 0.74]
  console.log('\n## Simulación: subir L de la base oscura hasta un piso (croma original = 0.15)\n')
  console.log('tono'.padEnd(6), ...floors.map((l) => `L≥${l}: C/WCAG/APCA/on`.padEnd(30)))
  const lossByFloor = floors.map(() => [])
  for (let h = 0; h < 360; h += 30) {
    const cells = floors.map((l, i) => {
      const rgb = fromOklch({ l, c: 0.15, h }).map(Math.round)
      const k = toOklch(rgb)
      lossByFloor[i].push(k.c / 0.15)
      return `${k.c.toFixed(3)}/${contrast(rgb, surface).toFixed(1)}/${Math.abs(apca(rgb, surface))}/${contrast(ink, rgb).toFixed(1)}`.padEnd(30)
    })
    console.log(String(h).padEnd(6), ...cells)
  }
  console.log('\nCroma conservado (media / mínimo) por piso:', floors.map((l, i) => `L≥${l}: ${(lossByFloor[i].reduce((a, b) => a + b, 0) / 12 * 100).toFixed(0)}% / ${(Math.min(...lossByFloor[i]) * 100).toFixed(0)}%`).join(' · '))
  // L mínimo por tono para llegar a APCA |Lc| 45 y 60 (objetivos de referencia de APCA para texto grande y de contenido)
  console.log('\nL mínimo por tono para APCA |Lc| 45 / 60 sobre la superficie oscura:')
  for (let h = 0; h < 360; h += 30) {
    const need = (lc) => { for (let l = 0.4; l < 1; l += 0.005) { if (Math.abs(apca(fromOklch({ l, c: 0.15, h }).map(Math.round), surface)) >= lc) return l.toFixed(3) } return '—' }
    console.log(String(h).padEnd(6), need(45), need(60))
  }
}
