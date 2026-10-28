// coco · GSplit: corre el verificar.mjs de kiwi (r01) con el CSS REAL (GSplit.css) en lugar de sp.css.
//   GRANA_PW_PORT=4219 node design/lab/split/estilo-verificar.mjs [--engines=chromium] [--parts=casos,bloques] [--verbose]
// Genera design/lab/split/_estilo/ (copia de r01 con los nombres del contrato: .sp → .g-split, sp__ → g-split__, sp-- → g-split--)
// y la apunta a packages/vue/src/components/GSplit/GSplit.css. Solo lee r01 y GSplit.css; la copia se regenera cada vez.
// Los casos de lo RESERVADO (align="center" y sticky: K8 center, K11) fallan o se omiten a propósito: no existen en el CSS.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const R = fileURLToPath(new URL('./r01/', import.meta.url))
const D = fileURLToPath(new URL('./_estilo/', import.meta.url))
await mkdir(D, { recursive: true })
const rename = (s) => s
  .replace(/\bsp__/g, 'g-split__').replace(/\bsp--/g, 'g-split--')
  .replace(/(?<!\w)sp\.(children|querySelectorAll)/g, '§$1').replace(/\.sp(?![\w-])/g, '.g-split').replace(/§(children|querySelectorAll)/g, 'sp.$1')
  .replace(/class="sp(?![\w-])/g, 'class="g-split')
  .replace(/`sp sp--/g, '`g-split g-split--').replace(/className = `sp /g, 'className = `g-split ')
for (const f of ['index.html', 'sp.js', 'verificar.mjs']) {
  let s = rename(await readFile(R + f, 'utf8'))
  if (f === 'index.html') s = s.replace('<link rel="stylesheet" href="./sp.css">', '<link rel="stylesheet" href="/packages/vue/src/components/GSplit/GSplit.css">')
  if (f === 'sp.js') s = s.replace(/new URL\('\.\/sp\.css'.*?\)\.href/, "'/packages/vue/src/components/GSplit/GSplit.css'")
  if (f === 'verificar.mjs') {
    s = s.replace("new URL('../../../../', import.meta.url)", "new URL('../../../../', import.meta.url)")
      .replace("new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url)", "new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url)")
      .replaceAll('/design/lab/split/r01/', '/design/lab/split/_estilo/')
  }
  await writeFile(D + f, s)
}
const r = spawnSync('node', [D + 'verificar.mjs', ...process.argv.slice(2)], { stdio: 'inherit', env: process.env })
process.exit(r.status ?? 1)
