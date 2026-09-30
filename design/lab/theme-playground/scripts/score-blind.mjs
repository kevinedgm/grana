// Acuerdo entre una evaluación ciega (CSV) y la clasificación visual de las Fases 2 y 4 (visual.json). Solo mide.
// Uso: node scripts/score-blind.mjs ratings.csv
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const csv = process.argv[2]
if (!csv) { console.error('Uso: node scripts/score-blind.mjs ratings.csv'); process.exit(2) }
const key = JSON.parse(readFileSync(join(root, 'blind/key.json'), 'utf8'))
const V = { benchmark: JSON.parse(readFileSync(join(root, '../tema-oscuro/dark-color-presence/visual.json'), 'utf8')), gaps: JSON.parse(readFileSync(join(root, '../tema-oscuro/dark-color-presence-gaps/visual.json'), 'utf8')) }
const ROLES = ['brand', 'accent', 'success', 'warning', 'danger', 'info']
const CLASSES = ['insufficient', 'adequate', 'excessive', 'pastel']
const H = { current: 'A', b: 'B', c: 'C' }
const [head, ...lines] = readFileSync(csv, 'utf8').trim().split('\n')
const cols = head.split(',')
let n = 0, same = 0
const byClass = Object.fromEntries(CLASSES.map((c) => [c, { n: 0, same: 0 }]))
const byStrategy = { A: { n: 0, same: 0 }, B: { n: 0, same: 0 }, C: { n: 0, same: 0 } }
const conf = {}
for (const line of lines) {
  const cells = line.split(',')
  const id = cells[0]
  const k = key[id]
  if (!k) continue
  ROLES.forEach((role) => {
    const r = (cells[cols.indexOf(role)] ?? '').trim().toLowerCase()
    if (!CLASSES.includes(r)) return
    const mine = V[k.set][`${k.theme}/${role}/${H[k.strategy]}/${k.surface === 'real' ? 'actual' : k.surface}`]
    if (!mine) return
    n++; byClass[mine].n++; byStrategy[H[k.strategy]].n++
    if (mine === r) { same++; byClass[mine].same++; byStrategy[H[k.strategy]].same++ }
    const ck = `${mine} → ${r}`; conf[ck] = (conf[ck] ?? 0) + 1
  })
}
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)} % (${a}/${b})` : '—')
console.log(`Observaciones comparadas: ${n}\nAcuerdo global: ${pct(same, n)}\n\nPor clase de la clasificación actual:`)
for (const c of CLASSES) console.log(`  ${c.padEnd(13)} ${pct(byClass[c].same, byClass[c].n)}`)
console.log('\nPor estrategia:'); for (const s of ['A', 'B', 'C']) console.log(`  ${s} ${pct(byStrategy[s].same, byStrategy[s].n)}`)
console.log('\nDiscrepancias (clasificación actual → segunda persona):')
for (const [k, v] of Object.entries(conf).filter(([k]) => { const [a, b] = k.split(' → '); return a !== b }).sort((x, y) => y[1] - x[1])) console.log(`  ${k}: ${v}`)
