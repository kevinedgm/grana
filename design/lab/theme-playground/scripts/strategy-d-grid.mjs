// Sensibilidad de D a sus dos parámetros exploratorios (tope de L y croma conservado mínimo). SOLO SIMULACIÓN. (Experimento D): contraste mínimo + distancia perceptual (C)
// + límite superior de transformación. Compara A, B, C y tres variantes exploratorias de D sobre la superficie (L 0.10 a 0.32)
// en los 16 temas (11 del benchmark y 5 de la Fase 4). No adopta ni recomienda valores: mide el comportamiento.
//   D-tope      : como C, pero sin pasar de L 0.74
//   D-croma     : como C, pero deja de subir cuando el croma conservado caería por debajo de 0.80
//   D-ambos     : las dos condiciones a la vez
// Uso: node scripts/strategy-d-grid.mjs   (escribe strategy-d-grid.md)
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
const CAPS = [0.72, 0.74, 0.76, 0.78, 1]
const CKS = [0, 0.7, 0.75, 0.8, 0.85]
const SURF = ['real', 0.25, 0.3]
const themes = sets.flatMap((dir) => readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8'))))
const res = {}
for (const cfg of themes) {
  const r = buildTheme(cfg)
  const real = lch(r.dark.tokens['--g-color-surface'])
  for (const sl of SURF) {
    const surface = sl === 'real' ? r.dark.tokens['--g-color-surface'] : hexOf({ l: sl, c: real.c, h: real.h })
    const sL = lch(surface)
    for (const role of ROLES) {
      const light = r.tokens[`--g-color-${role}`]
      for (const cap of CAPS) for (const ckMin of CKS) {
        const d = composite({ cap, ckMin })(light, surface), k = lch(d.base)
        const c = ((res[`${cap}|${ckMin}`] ??= {})[sl] ??= { n: 0, short: 0, pastel: 0, min: 9, L: 0 })
        const dE = distance(k, sL)
        c.n++; c.L += k.l; c.min = Math.min(c.min, dE)
        if (dE < 0.42) c.short++
        if (ck(light, d) < 0.75) c.pastel++
      }
    }
  }
}
const pct = (x, n) => `${Math.round((100 * x) / n)} %`
const md = ['# D · sensibilidad a sus parámetros (simulación; 16 temas × 6 roles por celda)', '', 'Solo medición. **corto** = ΔE < 0.42 · **pastel** = croma conservado < 0.75. Cada fila es una combinación (tope de L, croma conservado mínimo); `1` = sin tope y `0` = sin condición de croma (con ambos, D = C).', '',
  '| Tope L | Croma mín. | corto real | corto 0.25 | corto 0.30 | pastel real | pastel 0.25 | pastel 0.30 | ΔE mín. real | L media 0.30 |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |']
for (const cap of CAPS) for (const ckMin of CKS) {
  const a = res[`${cap}|${ckMin}`]
  md.push(`| ${cap} | ${ckMin} | ${pct(a.real.short, a.real.n)} | ${pct(a[0.25].short, a[0.25].n)} | ${pct(a[0.3].short, a[0.3].n)} | ${pct(a.real.pastel, a.real.n)} | ${pct(a[0.25].pastel, a[0.25].n)} | ${pct(a[0.3].pastel, a[0.3].n)} | ${a.real.min.toFixed(3)} | ${(a[0.3].L / a[0.3].n).toFixed(3)} |`)
}
writeFileSync(join(root, 'strategy-d-grid.md'), `${md.join('\n')}\n`)
console.log(md.join('\n'))
