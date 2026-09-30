// Línea de comandos: grana theme | check. Códigos de salida: 0 correcto, 1 tema inválido, 2 uso o configuración ilegible.
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildTheme } from './index.js'

export const HELP = `grana · genera y valida el tema de Grana

Uso:
  grana theme <configuración.json> [--out tokens.css] [--stdout]
      Deriva el tema, lo valida y escribe tokens.css (sin capa CSS).
      Con --doc[=archivo] escribe también tokens.json: cada token con su valor claro y oscuro, su uso y el contraste medido.
  grana check <configuración.json> [--json]
      Solo valida: no escribe nada. Con --json, imprime el informe como JSON.
  grana --help | --version

Códigos de salida: 0 correcto · 1 el tema rompe un mínimo de accesibilidad · 2 uso o configuración ilegible o inválida.
Los avisos (warning) no cambian el código de salida.
`

const parseArgs = (argv) => {
  const args = { positional: [], flags: {} }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--out' || a === '-o') args.flags.out = argv[++i]
    else if (a === '--stdout') args.flags.stdout = true
    else if (a === '--doc') args.flags.doc = 'tokens.json'
    else if (a.startsWith('--doc=')) args.flags.doc = a.slice('--doc='.length) || 'tokens.json'
    else if (a === '--json') args.flags.json = true
    else if (a === '--help' || a === '-h') args.flags.help = true
    else if (a === '--version' || a === '-v') args.flags.version = true
    else if (a.startsWith('-')) args.flags.unknown = a
    else args.positional.push(a)
  }
  return args
}

const formatIssues = (issues) =>
  issues
    .map((i) => `${i.severity === 'error' ? '✖ error' : '⚠ aviso'} [${i.id}] ${i.message}\n    Por qué: ${i.why}`)
    .join('\n')

/**
 * @param {string[]} argv argumentos sin `node` ni el script
 * @param {{ cwd?: string, out?: (s: string) => void, err?: (s: string) => void, version?: string }} [io]
 * @returns {number} código de salida
 */
export const run = (argv, { cwd = process.cwd(), out = (s) => process.stdout.write(s), err = (s) => process.stderr.write(s), version = '0.0.0' } = {}) => {
  const args = parseArgs(argv)
  if (args.flags.version) { out(`${version}\n`); return 0 }
  if (args.flags.help || args.positional.length === 0) { out(HELP); return args.flags.help ? 0 : 2 }
  if (args.flags.unknown) { err(`Opción desconocida: ${args.flags.unknown}\n\n${HELP}`); return 2 }
  const [command, file, ...rest] = args.positional
  if (!['theme', 'check'].includes(command)) { err(`Comando desconocido: «${command}».\n\n${HELP}`); return 2 }
  if (!file || rest.length) { err(`«${command}» necesita exactamente un archivo de configuración.\n\n${HELP}`); return 2 }

  let raw
  const path = resolve(cwd, file)
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'))
  } catch (e) {
    err(`No se pudo leer ${file}: ${e.code === 'ENOENT' ? 'el archivo no existe' : e.message}\n`)
    return 2
  }

  const result = buildTheme(raw, { source: file })
  const errors = result.issues.filter((i) => i.severity === 'error')
  const configInvalid = errors.some((i) => i.kind === 'config')
  const warnings = result.issues.filter((i) => i.severity === 'warning')

  if (command === 'check' && args.flags.json) {
    out(`${JSON.stringify({ ok: result.ok, errors: errors.length, warnings: warnings.length, issues: result.issues }, null, 2)}\n`)
    return result.ok ? 0 : configInvalid ? 2 : 1
  }
  if (result.issues.length) (result.ok ? out : err)(`${formatIssues(result.issues)}\n`)
  if (configInvalid) {
    err(`\nLa configuración no es válida (${errors.length} ${errors.length === 1 ? 'error' : 'errores'}). No se escribió nada.\n`)
    return 2
  }
  if (!result.ok) {
    err(`\nEl tema no cumple los mínimos de accesibilidad (${errors.length} ${errors.length === 1 ? 'error' : 'errores'}). No se escribió nada.\n`)
    return 1
  }
  const count = Object.keys(result.generated).length
  if (command === 'check') {
    out(`✔ El tema cumple los mínimos de accesibilidad (${count} ${count === 1 ? 'token' : 'tokens'} generados, ${warnings.length} ${warnings.length === 1 ? 'aviso' : 'avisos'}).\n`)
    return 0
  }
  if (result.notes.length) out(`${result.notes.map((n) => `ℹ ${n.message}`).join('\n')}\n`)
  if (args.flags.stdout) { out(result.css); return 0 }
  const target = resolve(cwd, args.flags.out ?? 'tokens.css')
  writeFileSync(target, result.css)
  if (args.flags.doc) {
    writeFileSync(resolve(cwd, args.flags.doc), `${JSON.stringify(result.doc, null, 2)}\n`)
    out(`✔ ${args.flags.doc}: ${result.doc.color.tokens.length} tokens de color documentados.\n`)
  }
  out(`✔ ${args.flags.out ?? 'tokens.css'}: ${count} ${count === 1 ? 'token' : 'tokens'} (${warnings.length} ${warnings.length === 1 ? 'aviso' : 'avisos'}).\n`)
  return 0
}
