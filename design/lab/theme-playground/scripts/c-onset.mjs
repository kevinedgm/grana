// ¿Desde qué superficie empieza C a sobrecorregir? Barrido fino de la luminosidad de `surface` (L 0.10 a 0.32, paso 0.01) por tema.
// SOLO MEDICIÓN: no define ningún límite ni regla. Usa las mismas funciones que la Fase 2 (deriveDarkColor + simulación de C).
// Uso: node scripts/c-onset.mjs   (escribe c-onset.json y c-onset.md en esta carpeta)
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildTheme } from '../../../../packages/cli/src/index.js'
import { contrast, fromOklch, parseHex, toHex, toOklch } from '../../../../packages/cli/src/color.js'
import { deriveDarkColor } from '../../../../packages/cli/src/derive.js'
import { distance } from '../../../../packages/cli/src/palette.js'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const themesDir = join(root, '../tema-oscuro/dark-color-presence/themes')
const THEMES = ['notion', 'apple', 'medium', 'stripe', 'caracol-purpura', 'amazon', 'github', 'spotify', 'linear', 'grana', 'lustre']
const ROLES = ['brand', 'accent', 'success', 'warning', 'danger', 'info']
const MIN_DE = 0.5
const lch = (hex) => toOklch(parseHex(hex))
const hexOf = (l) => toHex(fromOklch(l).map(Math.round))
const withL = (hex, l) => { const k = lch(hex); return hexOf({ l, c: k.c, h: k.h }) }
const derive = (light, surface) => deriveDarkColor(light, { surface })
const deriveC = (light, surface) => {
  const s = lch(surface)
  let d = derive(light, surface)
  for (let l = lch(d.base).l; distance(lch(d.base), s) < MIN_DE && l < 0.97; l += 0.005) d = derive(withL(light, l), surface)
  return d
}
const SURF = []
for (let l = 0.1; l <= 0.3201; l += 0.01) SURF.push(Math.round(l * 100) / 100)

const out = { meta: { note: 'Solo medición. Umbrales de lectura: L > 0.74 («muy claro») y croma conservado < 0.75 («pastel» por gamut); no son reglas.', surfaceL: SURF }, themes: {} }
for (const t of THEMES) {
  const cfg = JSON.parse(readFileSync(join(themesDir, `${t}.json`), 'utf8'))
  const r = buildTheme(cfg)
  const real = lch(r.dark.tokens['--g-color-surface'])
  const rows = SURF.map((sl) => {
    const surface = hexOf({ l: sl, c: real.c, h: real.h })
    const perRole = ROLES.map((role) => {
      const light = r.tokens[`--g-color-${role}`]
      const a = derive(light, surface), c = deriveC(light, surface)
      const ka = lch(a.base), kc = lch(c.base), kl = lch(light)
      return { role, L: +kc.l.toFixed(3), lift: +(kc.l - ka.l).toFixed(3), ck: kl.c ? +(kc.c / kl.c).toFixed(2) : 1, dE: +distance(kc, lch(surface)).toFixed(3), wcag: +contrast(parseHex(c.base), parseHex(surface)).toFixed(2) }
    })
    return { surfaceL: sl, meanL: +(perRole.reduce((s, x) => s + x.L, 0) / perRole.length).toFixed(3), maxLift: Math.max(...perRole.map((x) => x.lift)), rolesOver74: perRole.filter((x) => x.L > 0.74).map((x) => x.role), rolesPastel: perRole.filter((x) => x.ck < 0.75).map((x) => x.role), perRole }
  })
  const first = (pred) => rows.find(pred)?.surfaceL ?? null
  // el «nuevo» exceso: roles que no estaban ya por encima de 0.74 con la superficie más baja (p. ej. neón de Spotify)
  const baseline74 = new Set(rows[0].rolesOver74)
  out.themes[t] = {
    realSurfaceL: +real.l.toFixed(3),
    onset: {
      meanLAbove074: first((x) => x.meanL > 0.74),
      anyRoleAbove074New: first((x) => x.rolesOver74.some((r) => !baseline74.has(r))),
      anyRolePastel: first((x) => x.rolesPastel.length > 0),
      twoRolesPastel: first((x) => x.rolesPastel.length >= 2),
      liftAbove008: first((x) => x.maxLift > 0.08)
    },
    rows
  }
}
writeFileSync(join(root, 'c-onset.json'), `${JSON.stringify(out, null, 2)}\n`)

const f = (v) => (v === null ? '—' : v.toFixed(2))
const md = ['# C · ¿desde qué superficie empieza a sobrecorregir?', '', 'Barrido de `surface` L 0.10 a 0.32 (paso 0.01), con el mismo tono y croma que la superficie real de cada tema. Solo medición (`scripts/c-onset.mjs`); **no** define ningún límite.', '',
  'Cada celda es la **primera superficie L** en la que ocurre el hecho (— = nunca en el rango). «Nuevo» excluye los roles que ya eran muy claros con la superficie más baja (el neón y la menta de Spotify, el naranja de Amazon, el gris de Medium).', '',
  '| Tema | Superficie real | L media de C > 0.74 | Algún rol nuevo con L > 0.74 | Algún rol con croma < 0.75 | 2+ roles con croma < 0.75 | C eleva > 0.08 sobre A |', '| --- | --- | --- | --- | --- | --- | --- |']
for (const t of THEMES) { const o = out.themes[t].onset; md.push(`| ${t} | ${out.themes[t].realSurfaceL} | ${f(o.meanLAbove074)} | ${f(o.anyRoleAbove074New)} | ${f(o.anyRolePastel)} | ${f(o.twoRolesPastel)} | ${f(o.liftAbove008)} |`) }
const med = (k) => { const v = THEMES.map((t) => out.themes[t].onset[k]).filter((x) => x !== null).sort((a, b) => a - b); return v.length ? `${v[0].toFixed(2)} a ${v[v.length - 1].toFixed(2)} (mediana ${v[Math.floor(v.length / 2)].toFixed(2)}, ${v.length}/11 temas)` : '—' }
md.push('', '## Resumen', '', ...Object.entries({ 'L media de C > 0.74': 'meanLAbove074', 'algún rol nuevo con L > 0.74': 'anyRoleAbove074New', 'algún rol con croma < 0.75': 'anyRolePastel', '2+ roles con croma < 0.75': 'twoRolesPastel', 'C eleva > 0.08 sobre A': 'liftAbove008' }).map(([n, k]) => `- **${n}:** superficie ${med(k)}`))
md.push('', '## Evolución de C con la superficie (media de los 6 roles)', '', '| Tema | ' + [0.1, 0.15, 0.2, 0.25, 0.3].map((l) => `L ${l.toFixed(2)}`).join(' | ') + ' |', '| --- | --- | --- | --- | --- | --- |')
for (const t of THEMES) md.push(`| ${t} | ${[0.1, 0.15, 0.2, 0.25, 0.3].map((l) => { const x = out.themes[t].rows.find((r) => Math.abs(r.surfaceL - l) < 1e-6); return `${x.meanL.toFixed(3)} (${x.rolesPastel.length} pastel)` }).join(' | ')} |`)
writeFileSync(join(root, 'c-onset.md'), `${md.join('\n')}\n`)
console.log(md.slice(0, 22).join('\n'))
