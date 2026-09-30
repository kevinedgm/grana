// Experimento D (restricción compuesta, SOLO SIMULACIÓN por fuera del Theme Engine): contraste mínimo + distancia perceptual (C)
// + límite superior de transformación. Compara A, B, C y tres variantes exploratorias de D sobre la superficie (L 0.10 a 0.32)
// en los 16 temas (11 del benchmark y 5 de la Fase 4). No adopta ni recomienda valores: mide el comportamiento.
//   D-tope      : como C, pero sin pasar de L 0.74
//   D-croma     : como C, pero deja de subir cuando el croma conservado caería por debajo de 0.80
//   D-ambos     : las dos condiciones a la vez
// Uso: node scripts/strategy-d.mjs   (escribe strategy-d.md y strategy-d.json)
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildTheme } from '../../../../packages/cli/src/index.js'
import { fromOklch, parseHex, toHex, toOklch } from '../../../../packages/cli/src/color.js'
import { deriveDarkColor } from '../../../../packages/cli/src/derive.js'
import { distance } from '../../../../packages/cli/src/palette.js'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const sets = [join(root, '../tema-oscuro/dark-color-presence/themes'), join(root, '../tema-oscuro/dark-color-presence-gaps/themes')]
const ROLES = ['brand', 'accent', 'success', 'warning', 'danger', 'info']
const lch = (hex) => toOklch(parseHex(hex))
const hexOf = (l) => toHex(fromOklch(l).map(Math.round))
const withL = (hex, l) => { const k = lch(hex); return hexOf({ l, c: k.c, h: k.h }) }
const A = (light, surface) => deriveDarkColor(light, { surface })
const B = (light, surface) => (lch(A(light, surface).base).l >= 0.7 ? A(light, surface) : A(withL(light, 0.7), surface))
const ck = (light, d) => { const o = lch(light), k = lch(d.base); return o.c < 0.03 ? 1 : k.c / o.c }
const composite = ({ cap = 1, ckMin = 0 } = {}) => (light, surface) => {
  const s = lch(surface)
  let d = A(light, surface)
  for (let l = lch(d.base).l + 0.005; distance(lch(d.base), s) < 0.5 && l <= cap + 1e-9 && l < 0.97; l += 0.005) {
    const cand = A(withL(light, l), surface)
    if (ck(light, cand) < ckMin) break // límite de presencia: no se sigue aclarando si el color pierde demasiado croma
    d = cand
  }
  return d
}
const STRAT = { A, B, C: composite(), 'D-tope': composite({ cap: 0.74 }), 'D-croma': composite({ ckMin: 0.8 }), 'D-ambos': composite({ cap: 0.74, ckMin: 0.8 }) }
const SURF = [0.1, 0.15, 0.2, 'real', 0.25, 0.3, 0.32]

const themes = sets.flatMap((dir) => readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => ({ id: f.replace('.json', ''), cfg: JSON.parse(readFileSync(join(dir, f), 'utf8')) })))
const acc = {}
for (const { cfg } of themes) {
  const r = buildTheme(cfg)
  const real = lch(r.dark.tokens['--g-color-surface'])
  for (const sl of SURF) {
    const surface = sl === 'real' ? r.dark.tokens['--g-color-surface'] : hexOf({ l: sl, c: real.c, h: real.h })
    const sL = lch(surface)
    for (const role of ROLES) {
      const light = r.tokens[`--g-color-${role}`]
      for (const [name, fn] of Object.entries(STRAT)) {
        const d = fn(light, surface), k = lch(d.base)
        const c = ((acc[name] ??= {})[sl] ??= { n: 0, short: 0, bright: 0, pastel: 0, L: 0, dE: 0, min: 9 })
        const dE = distance(k, sL)
        c.n++; c.L += k.l; c.dE += dE; c.min = Math.min(c.min, dE)
        if (dE < 0.42) c.short++
        if (k.l > 0.74) c.bright++
        if (ck(light, d) < 0.75) c.pastel++
      }
    }
  }
}
const pct = (x, n) => `${Math.round((100 * x) / n)} %`
const head = `| Estrategia | ${SURF.map((s) => (s === 'real' ? 'real' : `L ${s}`)).join(' | ')} |\n| --- | ${SURF.map(() => '---').join(' | ')} |`
const table = (f) => `${head}\n${Object.keys(STRAT).map((n) => `| ${n} | ${SURF.map((s) => f(acc[n][s])).join(' | ')} |`).join('\n')}`
const md = [`# Experimento D · restricción compuesta (simulación; ${themes.length} temas × 6 roles = ${themes.length * 6} observaciones por celda)`, '',
  'Solo medición por fuera del Theme Engine. **No** adopta ni recomienda valores: el tope 0.74 y el croma 0.80 son **exploratorios**. Los semánticos por defecto se repiten en casi todos los temas, así que sus porcentajes cuentan el mismo color varias veces.', '',
  '- **corto** = ΔE < 0.42 (poca presencia) · **claro** = L > 0.74 · **pastel** = croma conservado < 0.75', '',
  '## corto (ΔE < 0.42)', '', table((c) => pct(c.short, c.n)), '', '## claro (L > 0.74)', '', table((c) => pct(c.bright, c.n)), '', '## pastel (croma < 0.75)', '', table((c) => pct(c.pastel, c.n)), '',
  '## ΔE medio · mínimo', '', table((c) => `${(c.dE / c.n).toFixed(3)} · ${c.min.toFixed(3)}`), '', '## L media', '', table((c) => (c.L / c.n).toFixed(3)), '']
writeFileSync(join(root, 'strategy-d.md'), `${md.join('\n')}\n`)
writeFileSync(join(root, 'strategy-d.json'), `${JSON.stringify(acc, null, 2)}\n`)
console.log(md.join('\n'))
