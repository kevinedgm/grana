// Tema de la auditoría de GTag + GTagGroup (coco, paso 5): auditoria-tema.json con 8 y 12 categorías, claro y oscuro,
// generado y validado con @grana/cli (buildTheme). Granate y azul petróleo, neutros teñidos, forma cuadrada (radius 0),
// space 3 y texto de 19px en Georgia: espacio pequeño con texto grande, justo lo que el tema por defecto no pone a prueba.
// Ejecutar desde la raíz:  node design/lab/chip/auditoria-tema.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { buildTheme } from '../../../packages/cli/src/index.js'

const base = JSON.parse(readFileSync(new URL('./auditoria-tema.json', import.meta.url), 'utf8'))
for (const categories of [8, 12]) {
  const r = buildTheme({ ...base, categories }, { source: `design/lab/chip/auditoria-tema.json (categories: ${categories})` })
  if (!r.ok) throw new Error(`cat${categories}: ${r.issues.filter((i) => i.severity === 'error').map((e) => e.message).join(' | ')}`)
  writeFileSync(new URL(`./auditoria-tema-cat${categories}.css`, import.meta.url), r.css + '\n')
  console.log(`auditoria-tema-cat${categories}.css`, Object.keys(r.generated).length, 'tokens;', r.issues.length, 'avisos')
}
