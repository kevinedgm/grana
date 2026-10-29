// Ronda r01 de kiwi · pieza 3. Genera las hojas del prototipo desde escala.mjs (valores del CLI real).
// Uso: node design/lab/density-text/r01/gen-proto.mjs   → escribe design/lab/density-text/r01/proto/*.css
// Forma propuesta (M1 · «reglas de región en el tema», declaracion.md §5): la escala compacta se escribe como valores
// literales del tema reasignados EN el elemento de la región, nunca con selectores descendientes:
//   [data-g-density="compact"]                                  → valores compactos
//   [data-g-density="default"], [data-g-density="comfortable"]  → valores del paso 1 (vuelta dentro de una compacta)
//   @media (pointer: coarse) { [data-g-density] → paso 1;  [data-g-density="compact"][class*="--density-compact"] → compacto }  (P2)
//   Clave density del CLI: :root:where(:not([data-g-density])) → compacto (y su vuelta táctil)
// En defaults.css (capa grana.defaults) con el tema por defecto; el CLI emite lo mismo, sin capa, con los valores de su tema.
// Solo se escriben los tokens que cambian (en el tema por defecto, `caption` y varios interlineados no cambian).
// La variante A se añade SOLO para comparar en la misma página, calificada con [data-dt-escala="a"] (no es contrato).
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { ROLES, THEMES, baseFromCli, cliCss, scaleA, scaleB } from './escala.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, 'proto')
mkdirSync(OUT, { recursive: true })
const rem = (px) => `${Math.round((px / 16) * 10000) / 10000}rem`
const LAYERS = '@layer grana.defaults, grana.components, grana.blocks, grana.utilities;'

function decls (scale, base, only = null) {
  const out = []
  for (const r of ROLES) {
    for (const k of ['size', 'line']) {
      if (only && scale[r][k] === base[r][k]) continue
      out.push(`--g-text-${r}-${k}: ${rem(scale[r][k])};`)
    }
  }
  return out
}
// Las claves que cambian en alguna de las dos direcciones (las mismas en las cuatro reglas)
function changed (compact, base) {
  const keys = []
  for (const r of ROLES) for (const k of ['size', 'line']) if (compact[r][k] !== base[r][k]) keys.push([r, k])
  return keys
}
const pick = (scale, keys) => keys.map(([r, k]) => `--g-text-${r}-${k}: ${rem(scale[r][k])};`).join(' ')

export function regionRules (base, compact, { keyRule = false } = {}) {
  const keys = changed(compact, base)
  const c = pick(compact, keys), d = pick(base, keys)
  const lines = [
    `[data-g-density="compact"] { ${c} }`,
    `[data-g-density="default"], [data-g-density="comfortable"] { ${d} }`,
    '@media (pointer: coarse) {',
    `  [data-g-density] { ${d} }`,
    `  [data-g-density="compact"][class*="--density-compact"] { ${c} }`,
    '}'
  ]
  if (keyRule) lines.push(`:root:where(:not([data-g-density])) { ${c} }`, `@media (pointer: coarse) { :root:where(:not([data-g-density])) { ${d} } }`)
  return { css: lines.join('\n'), keys: keys.length }
}
function compareA (base, a) {
  const keys = changed(a, base)
  return `[data-g-density="compact"][data-dt-escala="a"] { ${pick(a, keys)} }`
}

const report = []
for (const t of THEMES) {
  const base = baseFromCli(t.cfg)
  const B = scaleB(base, t.cfg), A = scaleA(base)
  const rules = regionRules(base, B)
  const cmp = `/* Solo para comparar A en la misma página (no es contrato) */\n${compareA(base, A)}`
  if (t.id === 'defecto') {
    // Tema por defecto: lo que escribiría coco en defaults.css, en la capa grana.defaults
    const css = `${LAYERS}\n/* Prototipo de kiwi (r01): reglas de texto por región, tema por defecto, escala B. Capa grana.defaults como defaults.css */\n@layer grana.defaults {\n${rules.css}\n${cmp}\n}\n`
    writeFileSync(join(OUT, 'texto-defecto.css'), css)
    report.push({ file: 'texto-defecto.css', decl: rules.keys, gzip: gzipSync(rules.css, { level: 9 }).length, raw: rules.css.length })
    // Clave density "compact" del CLI con el tema por defecto: salida real del CLI + regla de la clave con el texto
    const keyCss = cliCss({ ...t.cfg, density: 'compact' })
    const kr = regionRules(base, B, { keyRule: true })
    writeFileSync(join(OUT, 'clave-compact.css'), `/* Salida real de @grana/cli con density: "compact" + reglas de texto (M1, sin capa) */\n${keyCss}\n${kr.css}\n`)
    report.push({ file: 'clave-compact.css (solo reglas de texto)', decl: kr.keys, gzip: gzipSync(kr.css, { level: 9 }).length, raw: kr.css.length })
  } else {
    const cli = cliCss(t.cfg)
    writeFileSync(join(OUT, `tema-${t.id}.css`), `/* Salida real de @grana/cli (${t.name}) + reglas de texto por región que emitiría el CLI (M1, sin capa) */\n${cli}\n${rules.css}\n${cmp}\n`)
    // Demostración del fallo: tema del CLI sin reglas propias (solo las de defaults.css, con valores del tema por defecto)
    writeFileSync(join(OUT, `tema-${t.id}-solo.css`), `/* Salida real de @grana/cli (${t.name}) SIN reglas de región: demuestra por qué el CLI debe emitirlas */\n${cli}\n`)
    report.push({ file: `tema-${t.id}.css (solo reglas de texto)`, decl: rules.keys, gzip: gzipSync(rules.css, { level: 9 }).length, raw: rules.css.length })
  }
}
writeFileSync(join(OUT, 'escala.json'), JSON.stringify(THEMES.map((t) => {
  const base = baseFromCli(t.cfg)
  return { id: t.id, name: t.name, base, A: scaleA(base), B: scaleB(base, t.cfg) }
}), null, 2))
console.table(report)
