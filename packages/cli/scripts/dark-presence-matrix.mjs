// Investigación «Dark Color Presence» (design/lab/tema-oscuro/investigacion-dark-color-presence.md): SOLO MEDICIÓN Y HOJA VISUAL.
// No modifica el Theme Engine ni propone reglas: compara tres HIPÓTESIS aplicadas sobre la derivación actual, por fuera de ella.
//   A · actual: solo contraste ≥ 4.5:1 (deriveDarkColor).
//   B · piso de luminosidad perceptual: la base oscura sube hasta L ≥ 0.70.
//   C · distancia perceptual mínima a la superficie (OKLab ≥ 0.50), sin imponer un L absoluto.
// Uso: node scripts/dark-presence-matrix.mjs <carpeta de salida>   (escribe muestras.json, matriz.md, hojas.html y sensibilidad.html)
import { mkdirSync, writeFileSync } from 'node:fs'
import { contrast, fromOklch, parseHex, toHex, toOklch } from '../src/color.js'
import { deriveDarkColor, pickOn } from '../src/derive.js'
import { distance } from '../src/palette.js'
import { DARK, DEFAULTS } from '../src/defaults.js'

const out = process.argv[2]
if (!out) { console.error('Uso: node scripts/dark-presence-matrix.mjs <carpeta>'); process.exit(2) }
mkdirSync(out, { recursive: true })

const SURFACE = parseHex(DARK['--g-color-surface']) // #1C1C1C
const sL = toOklch(SURFACE)
const FLOOR_L = 0.7
const MIN_DE = 0.5

// Familias: tono OKLCH y croma típico (gris: croma bajo). Tres luminosidades de partida por familia (oscura, media, clara).
const FAMILIES = [
  { id: 'rojo', h: 27, c: 0.17 }, { id: 'naranja', h: 55, c: 0.16 }, { id: 'amarillo', h: 95, c: 0.15 },
  { id: 'verde', h: 145, c: 0.14 }, { id: 'cian', h: 200, c: 0.11 }, { id: 'azul', h: 255, c: 0.16 },
  { id: 'violeta', h: 290, c: 0.17 }, { id: 'magenta', h: 335, c: 0.17 }, { id: 'gris', h: 260, c: 0.02 }
]
const STARTS = [{ tag: 'oscura', l: 0.4 }, { tag: 'media', l: 0.52 }, { tag: 'clara', l: 0.68 }]
// A qué roles aplica cada familia (brand y accent: todas; los semánticos, las familias que los representan)
const ROLES = { rojo: ['brand', 'accent', 'danger'], naranja: ['brand', 'accent', 'warning', 'danger'], amarillo: ['brand', 'accent', 'warning'],
  verde: ['brand', 'accent', 'success'], cian: ['brand', 'accent', 'info', 'success'], azul: ['brand', 'accent', 'info'],
  violeta: ['brand', 'accent', 'info'], magenta: ['brand', 'accent', 'danger'], gris: ['brand', 'accent'] }

const hexOf = (lch) => toHex(fromOklch(lch).map(Math.round))
const lchOf = (hex) => toOklch(parseHex(hex))
const r3 = (n) => Math.round(n * 1000) / 1000

// APCA (informativo, no normativo)
const apca = (fg, bg) => {
  const y = ([r, g, b]) => { const f = (v) => (v / 255) ** 2.4; const c = 0.2126729 * f(r) + 0.7151522 * f(g) + 0.072175 * f(b); return c < 0.022 ? c + (0.022 - c) ** 1.414 : c }
  const yf = y(fg), yb = y(bg)
  if (Math.abs(yb - yf) < 0.0005) return 0
  const lc = yb > yf ? (yb ** 0.56 - yf ** 0.57) * 1.14 : (yb ** 0.65 - yf ** 0.62) * 1.14
  return Math.round((Math.abs(lc) < 0.1 ? 0 : lc > 0 ? lc - 0.027 : lc + 0.027) * 1000) / 10
}

// Las tres hipótesis. Todas parten de la derivación actual (deriveDarkColor) y la aplican sobre un color claro ajustado.
const deriveA = (light) => deriveDarkColor(light, { surface: DARK['--g-color-surface'] })
const withL = (light, l) => { const k = lchOf(light); return hexOf({ l, c: k.c, h: k.h }) }
const deriveB = (light) => (lchOf(deriveA(light).base).l >= FLOOR_L ? deriveA(light) : deriveA(withL(light, FLOOR_L)))
const deriveC = (light, min = MIN_DE) => {
  let d = deriveA(light)
  for (let l = lchOf(d.base).l; distance(lchOf(d.base), sL) < min && l < 0.97; l += 0.005) d = deriveA(withL(light, l))
  return d
}
const floorB = (fl) => (light) => (lchOf(deriveA(light).base).l >= fl ? deriveA(light) : deriveA(withL(light, fl)))
const HYP = { A: deriveA, B: deriveB, C: (l) => deriveC(l) }
// Sensibilidad (ver dónde empieza a sobrecorregir): pisos de L y umbrales de ΔE vecinos
const SENS = { 'B·0.66': floorB(0.66), 'B·0.74': floorB(0.74), 'C·0.45': (l) => deriveC(l, 0.45), 'C·0.55': (l) => deriveC(l, 0.55) }

const measure = (light, d) => {
  const o = lchOf(light), k = lchOf(d.base)
  const base = parseHex(d.base)
  return {
    hex: d.base, L: r3(k.l), C: r3(k.c), h: Math.round(k.h),
    wcag: Math.round(contrast(base, SURFACE) * 100) / 100, apca: Math.abs(apca(base, SURFACE)),
    dL: r3(k.l - sL.l), dE: r3(distance(k, sL)),
    chromaKept: o.c ? r3(k.c / o.c) : 1, hueShift: Math.round((((k.h - o.h) % 360) + 540) % 360 - 180),
    onWcag: Math.round(contrast(parseHex(d.on), base) * 100) / 100,
    strong: d.strong, soft: d.soft, text: d.text, on: d.on, onSoft: d.onSoft
  }
}
// Proxy objetivo del resultado visual (se verifica a ojo en la hoja y las excepciones se anotan aparte):
//  insuficiente: presencia baja (ΔE < 0.42 y |APCA Lc| < 40) · excesivo: deslumbrante (L > 0.85) o croma perdido (croma conservado < 0.80) · adecuado: el resto.
//  El «excesivo» por aspecto pastel NO se puede medir de forma fiable con estas cifras: es un juicio visual (columna `visual`, ver VISUAL).
const proxy = (m) => (m.chromaKept < 0.8 || m.L > 0.85 ? 'excesivo' : m.dE < 0.42 && m.apca < 40 ? 'insuficiente' : 'adecuado')

// Resultado visual: juicio del asistente sobre las hojas (hojas.html y sensibilidad.html), no una medición. Criterio único: «¿el botón
// sólido y el texto de color se distinguen claramente de la superficie y conservan el carácter del tono?».
//   insuficiente = se ve apagado/sucio (oliva, marrón, pizarra)  ·  excesivo = se vuelve pastel o casi blanco (pierde el carácter del tono)
const DULL = new Set(['sem-warning', 'naranja-oscura', 'amarillo-oscura', 'amarillo-media', 'cian-oscura', 'cian-media', 'gris-oscura', 'gris-media'])
const VISUAL = {
  A: (id) => (DULL.has(id) ? 'insuficiente' : 'adecuado'),
  B: () => 'adecuado',
  C: () => 'adecuado',
  'B·0.66': (id) => (['amarillo-oscura', 'amarillo-media', 'cian-oscura', 'gris-oscura', 'gris-media'].includes(id) ? 'insuficiente' : 'adecuado'),
  'C·0.45': (id) => (['amarillo-oscura', 'amarillo-media', 'cian-oscura', 'gris-oscura', 'gris-media'].includes(id) ? 'insuficiente' : 'adecuado'),
  'B·0.74': (id) => (/^(verde|cian|sem-success)/.test(id) ? 'adecuado' : 'excesivo'),
  'C·0.55': () => 'excesivo'
}
const samples = []
for (const f of FAMILIES) for (const s of STARTS) {
  const light = hexOf({ l: s.l, c: f.c, h: f.h })
  const o = lchOf(light)
  const row = { id: `${f.id}-${s.tag}`, familia: f.id, inicio: s.tag, roles: ROLES[f.id], light, lightOklch: { L: r3(o.l), C: r3(o.c), h: Math.round(o.h) }, hip: {} }
  for (const [name, fn] of Object.entries(HYP)) { const d = fn(light); const m = measure(light, d); m.proxy = proxy(m); m.visual = VISUAL[name](row.id); row.hip[name] = m }
  row.sens = {}
  for (const [name, fn] of Object.entries(SENS)) { const m = measure(light, fn(light)); m.proxy = proxy(m); m.visual = VISUAL[name](row.id); row.sens[name] = m }
  samples.push(row)
}
// Los semánticos por defecto, como muestras más: su color claro pasa por las mismas hipótesis (role-específicos)
for (const n of ['success', 'warning', 'danger', 'info']) {
  const light = DEFAULTS[`--g-color-${n}`]
  const o = lchOf(light)
  const row = { id: `sem-${n}`, familia: 'semántico', inicio: 'por defecto', roles: [n], light, lightOklch: { L: r3(o.l), C: r3(o.c), h: Math.round(o.h) }, hip: {}, sens: {} }
  for (const [name, fn] of Object.entries(HYP)) { const m = measure(light, fn(light)); m.proxy = proxy(m); m.visual = VISUAL[name](row.id); row.hip[name] = m }
  for (const [name, fn] of Object.entries(SENS)) { const m = measure(light, fn(light)); m.proxy = proxy(m); m.visual = VISUAL[name](row.id); row.sens[name] = m }
  samples.push(row)
}
// Semánticos por defecto (lo que se emite hoy cuando no chocan)
const defaults = ['success', 'warning', 'danger', 'info'].map((n) => {
  const hex = DARK[`--g-color-${n}`]
  const k = lchOf(hex)
  return { name: n, hex, L: r3(k.l), C: r3(k.c), wcag: Math.round(contrast(parseHex(hex), SURFACE) * 100) / 100, apca: Math.abs(apca(parseHex(hex), SURFACE)), dE: r3(distance(k, sL)) }
})
writeFileSync(`${out}/muestras.json`, JSON.stringify({ surface: DARK['--g-color-surface'], floorL: FLOOR_L, minDeltaE: MIN_DE, samples, defaults }, null, 2))

// ---------- Matriz en Markdown ----------
const cell = (m) => `${m.hex} · L ${m.L} C ${m.C} h ${m.h} · ${m.wcag}:1 · ΔL ${m.dL} · ΔE ${m.dE} · **${m.visual}** (proxy: ${m.proxy})`
const md = [`# Matriz de muestras · Dark Color Presence`, '', `Superficie oscura \`${DARK['--g-color-surface']}\` (OKLCH L ${r3(sL.l)}). Piso B: L ≥ ${FLOOR_L}. Umbral C: ΔE ≥ ${MIN_DE}. **visual** = juicio del asistente sobre las hojas; **proxy** = regla objetiva simple (insuficiente: ΔE < 0.42 y |APCA| < 40; excesivo: L > 0.85 o croma conservado < 0.80); el aspecto pastel no se mide con cifras.`, '',
  '| Muestra | Claro (HEX · OKLCH) | Roles | A · actual | B · piso L 0.70 | C · ΔE ≥ 0.50 |', '| --- | --- | --- | --- | --- | --- |']
for (const s of samples) md.push(`| ${s.id} | ${s.light} · L ${s.lightOklch.L} C ${s.lightOklch.C} h ${s.lightOklch.h} | ${s.roles.join(', ')} | ${cell(s.hip.A)} | ${cell(s.hip.B)} | ${cell(s.hip.C)} |`)
md.push('', '## Sensibilidad (dónde empieza a sobrecorregir)', '', `| Muestra | ${Object.keys(SENS).join(' | ')} |`, `| --- | ${Object.keys(SENS).map(() => '---').join(' | ')} |`)
for (const s of samples) md.push(`| ${s.id} | ${Object.keys(SENS).map((k) => cell(s.sens[k])).join(' | ')} |`)
md.push('', '## Semánticos oscuros por defecto', '', '| Token | HEX | L | C | WCAG | \\|APCA Lc\\| | ΔE |', '| --- | --- | --- | --- | --- | --- | --- |')
for (const d of defaults) md.push(`| ${d.name} | ${d.hex} | ${d.L} | ${d.C} | ${d.wcag} | ${d.apca} | ${d.dE} |`)
writeFileSync(`${out}/matriz.md`, md.join('\n') + '\n')

// ---------- Hoja visual (HTML estático; colores ya calculados) ----------
const chip = (m) => `<div class="cell"><div class="row"><span class="btn" style="background:${m.hex};color:${m.on}">Guardar</span><span class="btn" style="background:${m.soft};color:${m.onSoft}">Suave</span><span class="txt" style="color:${m.text}">Texto</span><span class="out" style="border-color:${m.hex};color:${m.text}">Línea</span></div><div class="num">L ${m.L} · ${m.wcag}:1 · ΔE ${m.dE} · ${m.visual}</div></div>`
const html = `<!doctype html><meta charset="utf-8"><title>Dark Color Presence · hojas</title>
<style>body{margin:0;padding:8px;background:${DARK['--g-color-surface']};color:#F2F2F2;font:12px system-ui}h2{font-size:14px;margin:18px 0 6px}table{border-collapse:collapse;width:100%}td,th{padding:5px 5px;border-top:1px solid #333;vertical-align:top;text-align:left}th{color:#aaa;font-weight:500}
.row{display:flex;gap:5px;align-items:center}.btn{padding:5px 9px;border-radius:8px;font-weight:600;font-size:12px}.out{padding:3px 7px;border:1.5px solid;border-radius:8px;font-size:12px}.txt{font-weight:600}.num{margin-top:3px;color:#9C9C9C;font-size:10px}.sw{display:inline-block;inline-size:14px;block-size:14px;border-radius:3px;vertical-align:-3px;margin-inline-end:4px}</style>
<h1 style="font-size:16px">Dark Color Presence · muestras sobre la superficie oscura ${DARK['--g-color-surface']}</h1>
<p>Cada celda: botón sólido (base y texto sobre ella), chip suave, texto de color y botón de línea. A = regla actual; B = piso L ≥ ${FLOOR_L}; C = ΔE ≥ ${MIN_DE}. Es una hoja de medición: no cambia el Theme Engine.</p>
<table><tr><th>Muestra (claro)</th><th>A · actual</th><th>B · piso L 0.70</th><th>C · ΔE ≥ 0.50</th></tr>
${samples.map((s) => `<tr id="${s.id}"><td style="width:92px"><b>${s.id}</b><br><span class="sw" style="background:${s.light}"></span>${s.light}<br><small>L ${s.lightOklch.L}</small></td><td>${chip(s.hip.A)}</td><td>${chip(s.hip.B)}</td><td>${chip(s.hip.C)}</td></tr>`).join('\n')}
</table>`
const sensHtml = html.replace(/<table>[\s\S]*<\/table>/, `<table><tr><th>Muestra (claro)</th>${Object.keys(SENS).map((k) => `<th>${k}</th>`).join('')}</tr>
${samples.map((s) => `<tr id="${s.id}"><td style="width:92px"><b>${s.id}</b><br><span class="sw" style="background:${s.light}"></span>${s.light}<br><small>L ${s.lightOklch.L}</small></td>${Object.keys(SENS).map((k) => `<td>${chip(s.sens[k])}</td>`).join('')}</tr>`).join('\n')}
</table>`).replace('A = regla actual; B = piso L ≥ ' + FLOOR_L + '; C = ΔE ≥ ' + MIN_DE + '.', 'Sensibilidad: pisos de L 0.66 y 0.74 y umbrales de ΔE 0.45 y 0.55 (la hoja principal trae A, B·0.70 y C·0.50).')
writeFileSync(`${out}/sensibilidad.html`, sensHtml.replace("<style>", "<style>body{zoom:.72}"))
writeFileSync(`${out}/hojas.html`, html)
console.log(`${samples.length} muestras · ${out}`)
