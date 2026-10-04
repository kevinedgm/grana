// Verificación de los conceptos A, B y C de GCombobox r02 (kiwi): la misma batería de r01 más lo propio de cada concepto.
// Ejecutar: node design/lab/combobox/r02/verificar.mjs   (GRANA_PW_PORT, por defecto 4209; ENGINES, CONCEPTS, VERBOSE)
import { run } from '../r01/verificar.mjs'
await run('A,B,C,AC')
