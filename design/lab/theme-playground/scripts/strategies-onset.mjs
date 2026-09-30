// Compara A, B y C a lo largo de la luminosidad de `surface` (L 0.10 a 0.32) en los 11 temas. SOLO MEDICIÓN.
// Indicadores por (tema, rol) y superficie: «corto» = ΔE < 0.42 (poca presencia), «claro» = L > 0.74, «pastel» = croma conservado < 0.75.
// Uso: node scripts/strategies-onset.mjs   (escribe strategies-onset.md y .json)
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildTheme } from '../../../../packages/cli/src/index.js'
import { fromOklch, parseHex, toHex, toOklch } from '../../../../packages/cli/src/color.js'
import { deriveDarkColor } from '../../../../packages/cli/src/derive.js'
import { distance } from '../../../../packages/cli/src/palette.js'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const themesDir = join(root, '../tema-oscuro/dark-color-presence/themes')
const THEMES = ['notion', 'apple', 'medium', 'stripe', 'caracol-purpura', 'amazon', 'github', 'spotify', 'linear', 'grana', 'lustre']
const ROLES = ['brand', 'accent', 'success', 'warning', 'danger', 'info']
const lch = (hex) => toOklch(parseHex(hex))
const hexOf = (l) => toHex(fromOklch(l).map(Math.round))
const withL = (hex, l) => { const k = lch(hex); return hexOf({ l, c: k.c, h: k.h }) }
const A = (light, surface) => deriveDarkColor(light, { surface })
const B = (light, surface) => (lch(A(light, surface).base).l >= 0.7 ? A(light, surface) : A(withL(light, 0.7), surface))
const C = (light, surface) => { const s = lch(surface); let d = A(light, surface); for (let l = lch(d.base).l; distance(lch(d.base), s) < 0.5 && l < 0.97; l += 0.005) d = A(withL(light, l), surface); return d }
const STRAT = { A, B, C }
const SURF = [0.1, 0.15, 0.2, 'real', 0.25, 0.3]

const acc = {} // acc[strategy][surface] = { n, short, bright, pastel, meanL:[] }
for (const t of THEMES) {
  const cfg = JSON.parse(readFileSync(join(themesDir, `${t}.json`), 'utf8'))
  const r = buildTheme(cfg)
  const real = lch(r.dark.tokens['--g-color-surface'])
  for (const sl of SURF) {
    const surface = sl === 'real' ? r.dark.tokens['--g-color-surface'] : hexOf({ l: sl, c: real.c, h: real.h })
    for (const role of ROLES) {
      const light = r.tokens[`--g-color-${role}`]
      for (const [name, fn] of Object.entries(STRAT)) {
        const k = lch(fn(light, surface).base), o = lch(light)
        const cell = ((acc[name] ??= {})[sl] ??= { n: 0, short: 0, bright: 0, pastel: 0, L: [] })
        cell.n++; cell.L.push(k.l)
        if (distance(k, lch(surface)) < 0.42) cell.short++
        if (k.l > 0.74) cell.bright++
        if (o.c && k.c / o.c < 0.75) cell.pastel++
      }
    }
  }
}
const pct = (x, n) => `${Math.round((100 * x) / n)} %`
const md = ['# A, B y C a lo largo de la superficie (66 observaciones por celda; 22 combinaciones brand/accent y 4 semánticos únicos)', '',
  'Solo medición (`scripts/strategies-onset.mjs`). «corto» = ΔE < 0.42 (poca presencia) · «claro» = L > 0.74 · «pastel» = croma conservado < 0.75. **Son indicadores de lectura, no reglas.** Como los 4 semánticos son iguales en los 11 temas, cada indicador de semánticos cuenta el mismo color 11 veces.', '']
for (const [ind, label] of [['short', 'corto (ΔE < 0.42)'], ['bright', 'claro (L > 0.74)'], ['pastel', 'pastel (croma < 0.75)']]) {
  md.push(`## ${label}`, '', `| Estrategia | ${SURF.map((s) => (s === 'real' ? 'real (0.226)' : `L ${s}`)).join(' | ')} |`, `| --- | ${SURF.map(() => '---').join(' | ')} |`)
  for (const name of ['A', 'B', 'C']) md.push(`| ${name} | ${SURF.map((s) => pct(acc[name][s][ind], acc[name][s].n)).join(' | ')} |`)
  md.push('')
}
md.push('## L media', '', `| Estrategia | ${SURF.map((s) => (s === 'real' ? 'real (0.226)' : `L ${s}`)).join(' | ')} |`, `| --- | ${SURF.map(() => '---').join(' | ')} |`)
for (const name of ['A', 'B', 'C']) md.push(`| ${name} | ${SURF.map((s) => (acc[name][s].L.reduce((a, b) => a + b, 0) / acc[name][s].n).toFixed(3)).join(' | ')} |`)
writeFileSync(join(root, 'strategies-onset.md'), `${md.join('\n')}\n`)
writeFileSync(join(root, 'strategies-onset.json'), `${JSON.stringify(Object.fromEntries(Object.entries(acc).map(([k, v]) => [k, Object.fromEntries(Object.entries(v).map(([s, c]) => [s, { n: c.n, short: c.short, bright: c.bright, pastel: c.pastel, meanL: +(c.L.reduce((a, b) => a + b, 0) / c.n).toFixed(3) }]))])), null, 2)}\n`)
console.log(md.join('\n'))
