// Verificación de los conceptos A, B y C de la ficha de resumen (kiwi): la batería de r01 más lo propio de cada concepto.
// Ejecutar: node design/lab/summary/r02/verificar.mjs   (GRANA_PW_PORT, por defecto 4211; ENGINES, CONCEPTS, VERBOSE)
import { run } from '../r01/verificar.mjs'
await run('A,B,C')
