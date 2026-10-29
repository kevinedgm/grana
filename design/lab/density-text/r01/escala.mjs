// Ronda r01 de kiwi · pieza 3 (el texto sigue la densidad, #966). Calcula la escala compacta candidata en tres temas
// leyendo los valores base del CLI real (@grana/cli: `grana theme <cfg> --stdout`), no de una copia de la fórmula.
// Uso: node design/lab/density-text/r01/escala.mjs [--json]
// Candidatas:
//   A · Peldaño       compacto(rol) = rol de abajo (tamaño e interlineado); `caption` se queda; `body-sm`, que caería
//                     sobre `caption`, toma el punto medio entre los dos (la lectura literal de #966 con el único parche
//                     que evita el choque en el piso; inventario de lima §3.2-2: «como mucho un valor nuevo, ~13 px»).
//   B · Hermano menor compacto = la misma escala calculada con fontSize × 15/16 (el paso de 1 px de FF en `body`),
//                     las mismas razones de interlineado y el mismo redondeo a 4 px de tokens.md §5; piso 12 en todos.
//   A0 · Peldaño puro (descartada, solo para mostrar el choque): rol de abajo sin parche.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../../..')
const CLI = join(ROOT, 'packages/cli/bin/grana.mjs')
export const ROLES = ['caption', 'body-sm', 'body', 'title-sm', 'title', 'title-lg', 'display']
const RATIO = { caption: 1.333, 'body-sm': 1.43, body: 1.5, 'title-sm': 1.4, title: 1.44, 'title-lg': 1.28, display: 1.23 }
const TYPE_EXP = { body: 0, 'title-sm': 1, title: 2, 'title-lg': 3, display: 4 }

export const THEMES = [
  { id: 'defecto', name: 'Tema por defecto (fontSize 16, typeScale 1.25; idéntico a defaults.css)', cfg: { fontSize: 16, typeScale: 1.25 } },
  { id: 't14', name: 'CLI · fontSize 14, typeScale 1.2', cfg: { fontSize: 14, typeScale: 1.2 } },
  { id: 't18', name: 'CLI · fontSize 18, typeScale 1.333', cfg: { fontSize: 18, typeScale: 1.333 } }
]

const dir = mkdtempSync(join(tmpdir(), 'grana-dt-'))
const remToPx = (v) => Math.round(parseFloat(v) * 16 * 1000) / 1000

export function cliCss (cfg) {
  const f = join(dir, `cfg-${Math.random().toString(36).slice(2)}.json`)
  writeFileSync(f, JSON.stringify(cfg))
  // Con --out y no --stdout: con --stdout los avisos «ℹ …» del CLI salen por la misma salida que el CSS y rompen la
  // primera regla (hallazgo para bruno, declaracion.md H1)
  const o = f.replace(/\.json$/, '.css')
  execFileSync('node', [CLI, 'theme', f, '--out', o], { stdio: 'ignore' })
  return readFileSync(o, 'utf8')
}

export function baseFromCli (cfg) {
  const css = cliCss(cfg)
  const out = {}
  for (const r of ROLES) {
    const size = css.match(new RegExp(`--g-text-${r}-size:\\s*([\\d.]+)rem`))
    const line = css.match(new RegExp(`--g-text-${r}-line:\\s*([\\d.]+)rem`))
    out[r] = { size: remToPx(size[1]), line: remToPx(line[1]) }
  }
  return out
}

const line4 = (size, role) => Math.max(4, Math.round((size * RATIO[role]) / 4) * 4)

export function scaleA0 (base) {
  const out = {}
  ROLES.forEach((r, i) => { out[r] = i === 0 ? { ...base.caption } : { ...base[ROLES[i - 1]] } })
  return out
}
export function scaleA (base) {
  const out = scaleA0(base)
  const s = Math.max(12, (base['body-sm'].size + base.caption.size) / 2)
  out['body-sm'] = { size: s, line: line4(s, 'body-sm') }
  return out
}
export function scaleB (base, cfg) {
  const fs = (cfg.fontSize ?? 16) * 15 / 16
  const ts = cfg.typeScale ?? 1.25
  const out = {}
  for (const r of ROLES) {
    let size
    if (r === 'caption') size = fs * 0.75
    else if (r === 'body-sm') size = fs * 0.875
    else size = fs * ts ** TYPE_EXP[r]
    size = Math.max(12, size)
    out[r] = { size, line: line4(size, r) }
  }
  return out
}

const fmt = (n) => (Math.round(n * 100) / 100).toString().replace('.', ',')
const pct = (a, b) => `${b === a ? '0' : ((b / a - 1) * 100).toFixed(1).replace('.', ',')} %`

export function all () {
  return THEMES.map((t) => {
    const base = baseFromCli(t.cfg)
    return { ...t, base, A0: scaleA0(base), A: scaleA(base), B: scaleB(base, t.cfg) }
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const res = all()
  if (process.argv.includes('--json')) { console.log(JSON.stringify(res, null, 2)); process.exit(0) }
  for (const t of res) {
    console.log(`\n### ${t.name}\n`)
    console.log('| Rol | Default | A · Peldaño | Δ A | B · Hermano menor | Δ B | A0 · Peldaño puro |')
    console.log('| --- | --- | --- | --- | --- | --- | --- |')
    for (const r of ROLES) {
      const b = t.base[r], a = t.A[r], bb = t.B[r], a0 = t.A0[r]
      console.log(`| \`${r}\` | ${fmt(b.size)}/${fmt(b.line)} | ${fmt(a.size)}/${fmt(a.line)} | ${pct(b.size, a.size)} | ${fmt(bb.size)}/${fmt(bb.line)} | ${pct(b.size, bb.size)} | ${fmt(a0.size)}/${fmt(a0.line)} |`)
    }
    // Choques: dos roles distintos con el mismo tamaño (± 0,25 px) en la escala compacta
    for (const k of ['A0', 'A', 'B']) {
      const s = t[k]; const hits = []
      for (let i = 1; i < ROLES.length; i++) if (Math.abs(s[ROLES[i]].size - s[ROLES[i - 1]].size) <= 0.25) hits.push(`${ROLES[i - 1]}≈${ROLES[i]}`)
      console.log(`${k}: ${hits.length ? 'choques ' + hits.join(', ') : 'sin choques'}`)
    }
  }
}
