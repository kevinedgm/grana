// Tabla de símbolos compartidos por varias monedas (dueño: bruno). design/contracts/price.md «Tabla de símbolos compartidos»
// (P-L4, DECISIONS.md #770). Corre en `npm run build` ANTES de Vite y escribe src/utils/currencySymbols.js (versionado).
//
// Recorre Intl.supportedValuesOf('currency') con currencyDisplay: 'narrowSymbol' en `en`, descarta los símbolos que son el
// propio código (tres letras mayúsculas) y guarda los que comparten dos o más monedas. **Solo crece:** escribe la unión de
// lo que ya estaba en la tabla y lo que da el Intl de Node (un símbolo que un CLDR posterior deje de compartir sigue hasta
// que lima lo retire: enseñar el código de más es inocuo; de menos, no). `--check` no escribe: sale con 1 si falta algo.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/utils/currencySymbols.js')

/** Símbolos estrechos que comparten dos o más monedas según el Intl de este entorno. */
export function sharedFromIntl() {
  const count = new Map()
  for (const c of Intl.supportedValuesOf('currency')) {
    try {
      const s = new Intl.NumberFormat('en', { style: 'currency', currency: c, currencyDisplay: 'narrowSymbol' })
        .formatToParts(1).find((p) => p.type === 'currency').value
      if (/^[A-Z]{3}$/.test(s)) continue
      count.set(s, (count.get(s) || 0) + 1)
    } catch {}
  }
  return [...count].filter(([, n]) => n > 1).map(([s]) => s)
}

/** Lo que ya está en la tabla versionada. */
export function current(file = OUT) {
  if (!existsSync(file)) return []
  const m = readFileSync(file, 'utf8').match(/SHARED_SYMBOLS = (\[[^\]]*\])/)
  return m ? JSON.parse(m[1]) : []
}

export function render(list) {
  return `// Generado por packages/vue/scripts/currency-symbols.mjs (price.md «Tabla de símbolos compartidos», #770). No editar a mano:
// la tabla solo crece (la unión de lo que había y lo que da Intl); un símbolo lo retira lima.
// Símbolos que comparten dos o más monedas: con display="auto", el precio añade el código detrás.
export const SHARED_SYMBOLS = ${JSON.stringify(list)}
`
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const before = current()
  const missing = sharedFromIntl().filter((s) => !before.includes(s))
  if (process.argv.includes('--check')) {
    if (missing.length) {
      console.error(`currencySymbols.js no contiene ${missing.join(' ')}: ejecutar node scripts/currency-symbols.mjs`)
      process.exit(1)
    }
  } else {
    const list = [...before, ...missing]
    if (missing.length || !existsSync(OUT)) writeFileSync(OUT, render(list))
    console.log(`currencySymbols.js: ${list.length} símbolos${missing.length ? ` (+${missing.join(' ')})` : ''}`)
  }
}
