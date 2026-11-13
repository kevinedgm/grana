// Entrada interna de los bin (#1079, I9): la usan `bin/grana.mjs` de este paquete y el
// envoltorio sin ámbito `grana`. Fuera de semver: el envoltorio fija la versión exacta.
import { readFileSync } from 'node:fs'
import { run } from './cli.js'

export const main = (argv = process.argv.slice(2)) => {
  const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  return run(argv, { version })
}
