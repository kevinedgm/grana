// Benchmark «Dark Color Presence», Fase 2 (design/lab/tema-oscuro/dark-color-presence/README.md): SOLO MEDICIÓN Y GENERACIÓN.
// No modifica el Theme Engine ni propone reglas. Genera cada tema con las reglas ACTUALES, mide las hipótesis A/B/C por fuera
// de la derivación y escribe los CSS que usa benchmark.html para renderizarlas con componentes reales.
//   A · actual: contraste ≥ 4.5:1 (lo que emite el Theme Engine)
//   B · piso de luminosidad: la base oscura sube hasta L ≥ 0.70 (simulación)
//   C · distancia perceptual mínima a `surface`: OKLab ≥ 0.50 (simulación)
// Uso: node scripts/dark-color-presence.mjs <carpeta del benchmark>   (lee themes/*.json; escribe generated/, results.json y matrix.md)
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildTheme } from '../src/index.js'
import { contrast, fromOklch, parseHex, toHex, toOklch } from '../src/color.js'
import { deriveDarkColor } from '../src/derive.js'
import { distance } from '../src/palette.js'

const dir = process.argv[2]
if (!dir) { console.error('Uso: node scripts/dark-color-presence.mjs <carpeta>'); process.exit(2) }
mkdirSync(join(dir, 'generated'), { recursive: true })

const ROLES = ['brand', 'accent', 'success', 'warning', 'danger', 'info']
const FLOOR_L = 0.7 // hipótesis B (experimental: no es una regla)
const MIN_DE = 0.5 // hipótesis C (experimental: no es una regla)
// Condiciones experimentales de superficie oscura (NO son tokens ni reglas): L de `surface`; bg y surface-sunken se derivan de ella
const SURFACES = { low: 0.135, medium: 0.2, high: 0.275 }
const r3 = (n) => Math.round(n * 1000) / 1000
const lch = (hex) => toOklch(parseHex(hex))
const hexOf = (l) => toHex(fromOklch(l).map(Math.round))
const oklchStr = (k) => `L ${r3(k.l)} C ${r3(k.c)} h ${Math.round(k.h)}`

// ---------- Hipótesis (todas parten de deriveDarkColor, sobre un color claro ajustado) ----------
const withL = (hex, l) => { const k = lch(hex); return hexOf({ l, c: k.c, h: k.h }) }
const deriveA = (light, surface) => deriveDarkColor(light, { surface })
const deriveB = (light, surface) => (lch(deriveA(light, surface).base).l >= FLOOR_L ? deriveA(light, surface) : deriveA(withL(light, FLOOR_L), surface))
const deriveC = (light, surface) => {
  const s = lch(surface)
  let d = deriveA(light, surface)
  for (let l = lch(d.base).l; distance(lch(d.base), s) < MIN_DE && l < 0.97; l += 0.005) d = deriveA(withL(light, l), surface)
  return d
}
// D · restricción compuesta EXPLORATORIA (Fase 5): como C, pero sin pasar de L 0.74 y sin seguir aclarando si el croma conservado caería de 0.80.
// Son valores de experimento, no de producción.
const deriveD = (light, surface) => {
  const s = lch(surface), o = lch(light)
  const keptOf = (d) => (o.c < 0.03 ? 1 : lch(d.base).c / o.c)
  let d = deriveA(light, surface)
  for (let l = lch(d.base).l + 0.005; distance(lch(d.base), s) < MIN_DE && l <= 0.74 + 1e-9 && l < 0.97; l += 0.005) {
    const cand = deriveA(withL(light, l), surface)
    if (keptOf(cand) < 0.8) break
    d = cand
  }
  return d
}
const HYP = { A: deriveA, B: deriveB, C: deriveC, D: deriveD }

const measure = (light, d, surface) => {
  const o = lch(light), k = lch(d.base), s = lch(surface)
  return {
    darkHex: d.base, darkOKLCH: oklchStr(k), L: r3(k.l), C: r3(k.c), deltaL: r3(Math.abs(k.l - s.l)),
    contrast: Math.round(contrast(parseHex(d.base), parseHex(surface)) * 100) / 100, oklabDistance: r3(distance(k, s)),
    chromaKept: o.c ? r3(k.c / o.c) : 1, hueShift: Math.round((((k.h - o.h) % 360) + 540) % 360 - 180),
    onContrast: Math.round(contrast(parseHex(d.on), parseHex(d.base)) * 100) / 100
  }
}
const tokenBlock = (role, d) => ({ [`--g-color-${role}`]: d.base, [`--g-color-${role}-strong`]: d.strong, [`--g-color-${role}-soft`]: d.soft, [`--g-color-${role}-text`]: d.text, [`--g-color-on-${role}`]: d.on, [`--g-color-on-${role}-soft`]: d.onSoft })
const decl = (o) => Object.entries(o).map(([k, v]) => `${k}: ${v};`).join(' ')

// Superficies experimentales: mismo tono y croma que la superficie oscura real del tema, a otro L
const surfaceSet = (actual, l) => {
  const k = lch(actual)
  const at = (ll) => hexOf({ l: Math.max(ll, 0.08), c: k.c, h: k.h })
  return { '--g-color-bg': at(l - 0.04), '--g-color-surface': at(l), '--g-color-surface-sunken': at(l - 0.07) }
}

const themeFiles = readdirSync(join(dir, 'themes')).filter((f) => f.endsWith('.json')).sort()
const results = { meta: { floorL: FLOOR_L, minDeltaE: MIN_DE, surfacesL: SURFACES, roles: ROLES, note: 'A = lo que emite el Theme Engine; B y C son simulaciones por fuera del motor.' }, themes: {}, samples: [] }
const visualPath = join(dir, 'visual.json')
const visual = existsSync(visualPath) ? JSON.parse(readFileSync(visualPath, 'utf8')) : {}

for (const file of themeFiles) {
  const id = file.replace(/\.json$/, '')
  const cfg = JSON.parse(readFileSync(join(dir, 'themes', file), 'utf8'))
  const r = buildTheme(cfg, { source: `themes/${file}` })
  writeFileSync(join(dir, 'generated', `${id}.css`), r.css ?? '')
  writeFileSync(join(dir, 'generated', `${id}.tokens.json`), `${JSON.stringify(r.doc, null, 2)}\n`)
  const surfaceHex = r.dark.tokens['--g-color-surface']
  const info = {
    config: cfg, ok: r.ok, tokensGenerated: Object.keys(r.generated).length,
    errors: r.issues.filter((i) => i.severity === 'error').map((i) => ({ id: i.id, message: i.message })),
    warnings: r.issues.filter((i) => i.severity === 'warning').map((i) => ({ id: i.id, message: i.message, recommended: i.recommended })),
    semanticClose: r.issues.filter((i) => i.id === 'semantic-close').map((i) => ({ token: i.tokens[0], collidedWith: i.collidedWith, accentDerived: i.accentDerived, distance: i.distance, recommended: i.recommended })),
    notes: r.notes.map((n) => n.code), surfaceHex, surfaceL: r3(lch(surfaceHex).l), tintedNeutrals: Boolean(r.derived.neutralsBrand), adjustments: {}
  }
  const blocks = []
  const variantCss = []
  for (const role of ROLES) {
    const lightHex = r.tokens[`--g-color-${role}`]
    const darkEmitted = r.dark.tokens[`--g-color-${role}`]
    const row = { theme: id, role, lightHex, lightOKLCH: oklchStr(lch(lightHex)), surfaceHex, surfaceL: r3(lch(surfaceHex).l), hypotheses: {}, surfaces: {} }
    // A debe coincidir con lo emitido (la simulación parte de la misma función): si no, se avisa
    const a0 = deriveA(lightHex, surfaceHex)
    row.derivationMatchesEmitted = a0.base.toUpperCase() === String(darkEmitted).toUpperCase()
    for (const [h, fn] of Object.entries(HYP)) row.hypotheses[h] = measure(lightHex, fn(lightHex, surfaceHex), surfaceHex)
    // los campos principales son los de A (lo que emite hoy el motor)
    Object.assign(row, { darkHex: row.hypotheses.A.darkHex, darkOKLCH: row.hypotheses.A.darkOKLCH, L: row.hypotheses.A.L, C: row.hypotheses.A.C, deltaL: row.hypotheses.A.deltaL, contrast: row.hypotheses.A.contrast, oklabDistance: row.hypotheses.A.oklabDistance })
    for (const [sn, sl] of Object.entries(SURFACES)) {
      const set = surfaceSet(surfaceHex, sl)
      const sh = set['--g-color-surface']
      row.surfaces[sn] = { surfaceHex: sh, surfaceL: r3(lch(sh).l) }
      for (const [h, fn] of Object.entries(HYP)) row.surfaces[sn][h] = measure(lightHex, fn(lightHex, sh), sh)
    }
    // ajustes de gamut y de contraste del color oscuro emitido (respecto al claro)
    const o = lch(lightHex), k = lch(darkEmitted)
    const start = o.l >= 0.5 ? o.l : 1 - o.l
    info.adjustments[role] = { gamutReduced: o.c > 0.02 && k.c / o.c < 0.97, raisedForContrast: k.l - start > 0.005, reflected: o.l < 0.5 }
    row.visualResult = visual[`${id}/${role}/A/actual`] ?? 'pending'
    for (const h of ['B', 'C', 'D']) row.hypotheses[h].visualResult = visual[`${id}/${role}/${h}/actual`] ?? 'pending'
    for (const sn of Object.keys(SURFACES)) for (const h of ['A', 'B', 'C', 'D']) row.surfaces[sn][h].visualResult = visual[`${id}/${role}/${h}/${sn}`] ?? 'pending'
    results.samples.push(row)
  }
  // CSS de variantes para benchmark.html: [data-variant][data-surface] sobre el tema oscuro
  for (const variant of ['A', 'B', 'C', 'D']) {
    for (const sn of ['actual', ...Object.keys(SURFACES)]) {
      if (variant === 'A' && sn === 'actual') continue // A en la superficie real es el tema tal cual
      const surface = sn === 'actual' ? surfaceHex : surfaceSet(surfaceHex, SURFACES[sn])['--g-color-surface']
      const o = {}
      if (sn !== 'actual') Object.assign(o, surfaceSet(surfaceHex, SURFACES[sn]))
      for (const role of ROLES) Object.assign(o, tokenBlock(role, HYP[variant](r.tokens[`--g-color-${role}`], surface)))
      variantCss.push(`[data-theme="dark"][data-variant="${variant}"][data-surface="${sn}"] { ${decl(o)} }`)
    }
  }
  writeFileSync(join(dir, 'generated', `${id}.variants.css`), `/* Variantes de simulación (no son parte del tema): A/B/C × superficie real y experimentales. Generado por dark-color-presence.mjs */\n${variantCss.join('\n')}\n`)
  results.themes[id] = info
}
writeFileSync(join(dir, 'results.json'), `${JSON.stringify(results, null, 2)}\n`)

// ---------- matrix.md ----------
const vr = (x) => x.visualResult ?? 'pending'
const md = ['# Matriz · Dark Color Presence · Fase 2 (11 temas × 6 roles = 66 muestras)', '',
  `Superficie = \`--g-color-surface\` oscuro real del tema. A = lo que emite el Theme Engine; B = piso L ≥ ${FLOOR_L} (simulación); C = ΔE OKLab ≥ ${MIN_DE} (simulación). \`visual\` = clasificación del asistente sobre las capturas (adequate, insufficient, excessive, pastel; \`pending\` si aún no se evalúa). Las cifras están en \`results.json\`.`, '',
  '## Validación de los 11 temas (`grana check`)', '', '| Tema | ¿Pasa? | Errores | Avisos | Colisiones (semantic-close) | Superficie oscura | Neutros teñidos |', '| --- | --- | --- | --- | --- | --- | --- |']
for (const [id, t] of Object.entries(results.themes)) md.push(`| ${id} | ${t.ok ? 'sí' : 'no'} | ${t.errors.length} | ${t.warnings.length} | ${t.semanticClose.map((c) => `${c.token.replace('--g-color-', '')} ↔ ${c.collidedWith}${c.accentDerived ? ' (derivado)' : ''}`).join(', ') || '—'} | ${t.surfaceHex} (L ${t.surfaceL}) | ${t.tintedNeutrals ? 'sí' : 'no'} |`)
md.push('', '## Muestras', '', '| Tema | Rol | Claro | Oscuro A (HEX · L · C) | WCAG | ΔL | ΔE | visual A | B (HEX · L · ΔE) | visual B | C (HEX · L · ΔE) | visual C |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |')
for (const s of results.samples) {
  const { A, B, C } = s.hypotheses
  md.push(`| ${s.theme} | ${s.role} | ${s.lightHex} ${s.lightOKLCH} | ${A.darkHex} · ${A.L} · ${A.C} | ${A.contrast}:1 | ${A.deltaL} | ${A.oklabDistance} | ${vr(s)} | ${B.darkHex} · ${B.L} · ${B.oklabDistance} | ${vr(B)} | ${C.darkHex} · ${C.L} · ${C.oklabDistance} | ${vr(C)} |`)
}
writeFileSync(join(dir, 'matrix.md'), `${md.join('\n')}\n`)
console.log(`${themeFiles.length} temas · ${results.samples.length} muestras · ${dir}`)
const bad = results.samples.filter((s) => !s.derivationMatchesEmitted)
if (bad.length) console.log(`AVISO: ${bad.length} muestras donde deriveDarkColor(claro) no coincide con lo emitido:`, bad.map((s) => `${s.theme}/${s.role}`).join(', '))
