// `grana init`: instala Grana en un proyecto existente (contrato design/contracts/cli-init.md, DECISIONS #1078).
// Valida el tema, instala con el gestor del proyecto y escribe solo archivos de Grana; no edita código de la aplicación.
// Códigos: 0 correcto, 1 el tema rompe un mínimo, 2 uso o precondición, 3 la instalación falló.
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { spawnSync } from 'node:child_process'
import { buildTheme } from './index.js'
import { formatIssues } from './format.js'

const PMS = ['npm', 'pnpm', 'yarn', 'bun']
const THEMES = ['auto', 'vite', 'file']
const CONFIG = 'grana.config.json'
const HEADER = '/* Generado por @grana/cli'
const VUE_RANGE = '^3.5.0'
const LOCKS = [
  ['pnpm-lock.yaml', 'pnpm'], ['yarn.lock', 'yarn'], ['bun.lock', 'bun'], ['bun.lockb', 'bun'],
  ['package-lock.json', 'npm'], ['npm-shrinkwrap.json', 'npm']
]
const VITE_CONFIGS = ['vite.config.js', 'vite.config.mjs', 'vite.config.cjs', 'vite.config.ts', 'vite.config.mts', 'vite.config.cts']
const NUXT_CONFIGS = ['nuxt.config.js', 'nuxt.config.mjs', 'nuxt.config.ts', 'nuxt.config.mts']
const ENTRIES = ['src/main.ts', 'src/main.js', 'src/main.mts', 'src/main.mjs']
const DEP_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies']

/** Corta la ejecución con un código de salida y un mensaje (va por la salida de error). */
class Stop extends Error {
  constructor(code, message, usage = false) { super(message); this.code = code; this.usage = usage }
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const declaredRange = (pkg, name) => {
  for (const f of DEP_FIELDS) if (isObj(pkg[f]) && typeof pkg[f][name] === 'string') return { range: pkg[f][name], field: f }
  return null
}
const posixPath = (p) => p.split(sep).join('/')
const rel = (cwd, p) => posixPath(relative(cwd, p)) || '.'

const readJson = (path, label) => {
  try { return JSON.parse(readFileSync(path, 'utf8')) } catch (e) {
    throw new Stop(2, `No se pudo leer ${label}: ${e.code === 'ENOENT' ? 'el archivo no existe' : e.message}`)
  }
}

/** Directorios desde `cwd` hacia arriba. */
const ancestors = (cwd) => {
  const list = []
  for (let d = cwd; ; d = dirname(d)) { list.push(d); if (dirname(d) === d) break }
  return list
}

// ---------- argumentos ----------

const parseInitArgs = (argv) => {
  const flags = {}
  const valued = ['pm', 'brand', 'theme', 'out']
  const bool = ['no-install', 'dry-run', 'force']
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) throw new Stop(2, `«init» no admite argumentos: «${a}».`, true)
    const [name, inline] = a.slice(2).split(/=(.*)/s)
    if (valued.includes(name)) {
      const value = inline ?? (argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[++i] : undefined)
      if (value === undefined || value === '') throw new Stop(2, `La opción --${name} necesita un valor.`, true)
      flags[name] = value
    } else if (bool.includes(name) && inline === undefined) flags[name] = true
    else throw new Stop(2, `Opción desconocida: ${a}`, true)
  }
  if (flags.pm !== undefined && !PMS.includes(flags.pm)) throw new Stop(2, `--pm admite ${PMS.join(', ')}; recibió «${flags.pm}».`, true)
  if (flags.theme !== undefined && !THEMES.includes(flags.theme)) throw new Stop(2, `--theme admite ${THEMES.join(', ')}; recibió «${flags.theme}».`, true)
  return flags
}

// ---------- gestor de paquetes (I2) ----------

const findLock = (cwd) => {
  for (const d of ancestors(cwd)) {
    const files = LOCKS.filter(([f]) => existsSync(join(d, f)))
    if (files.length) return { dir: d, files: files.map(([f]) => f), pms: [...new Set(files.map(([, pm]) => pm))] }
    if (existsSync(join(d, '.git'))) break
  }
  return null
}

const findWorkspaceRoot = (cwd) => {
  for (const d of ancestors(cwd)) {
    if (d !== cwd) {
      let ws = existsSync(join(d, 'pnpm-workspace.yaml'))
      try { if (existsSync(join(d, 'package.json')) && JSON.parse(readFileSync(join(d, 'package.json'), 'utf8')).workspaces) ws = true } catch { /* ilegible: no cuenta */ }
      if (ws) return d
    }
    if (existsSync(join(d, '.git'))) break
  }
  return null
}

const detectPm = ({ flags, pkg, wsRoot, cwd, env }) => {
  const warnings = []
  if (flags.pm) return { pm: flags.pm, source: '--pm', warnings }
  let declared = typeof pkg.packageManager === 'string' ? pkg.packageManager : null
  let from = 'packageManager'
  if (!declared && wsRoot) {
    try {
      const wp = JSON.parse(readFileSync(join(wsRoot, 'package.json'), 'utf8'))
      if (typeof wp.packageManager === 'string') { declared = wp.packageManager; from = `packageManager de ${rel(cwd, wsRoot)}` }
    } catch { /* sin package.json en la raíz */ }
  }
  const lock = findLock(cwd)
  if (declared) {
    const name = declared.split('@')[0]
    if (!PMS.includes(name)) throw new Stop(2, `El campo packageManager nombra «${name}», que init no maneja. Usa --pm ${PMS.join('|')}.`)
    if (lock && !lock.pms.includes(name)) warnings.push(`packageManager dice ${name} pero el archivo de bloqueo es ${lock.files.join(', ')}; manda packageManager.`)
    return { pm: name, source: `${from} «${declared}»`, warnings }
  }
  if (lock) {
    if (lock.pms.length > 1) throw new Stop(2, `Hay varios archivos de bloqueo (${lock.files.join(', ')}); usa --pm para elegir el gestor.`)
    return { pm: lock.pms[0], source: `${lock.files[0]}${lock.dir === cwd ? '' : ` en ${rel(cwd, lock.dir)}`}`, warnings }
  }
  const ua = String(env.npm_config_user_agent ?? '').split(' ')[0].split('/')[0]
  if (PMS.includes(ua)) return { pm: ua, source: 'npm_config_user_agent', warnings }
  return { pm: 'npm', source: null, warnings }
}

const COMMANDS = {
  npm: { add: ['install'], dev: ['install', '--save-dev'] },
  pnpm: { add: ['add'], dev: ['add', '--save-dev'] },
  yarn: { add: ['add'], dev: ['add', '--dev'] },
  bun: { add: ['add'], dev: ['add', '--dev'] }
}

// ---------- Vue (I1.3) ----------

const installedVue = (cwd) => {
  for (const d of ancestors(cwd)) {
    try { const v = JSON.parse(readFileSync(join(d, 'node_modules', 'vue', 'package.json'), 'utf8')).version; if (typeof v === 'string') return v } catch { /* sigue hacia arriba */ }
  }
  return null
}

const checkVue = (cwd, pkg) => {
  const warnings = []
  const declared = declaredRange(pkg, 'vue')
  const installed = installedVue(cwd)
  let version = null
  let source = null
  const m = installed && installed.match(/^(\d+)\.(\d+)/)
  if (m) { version = installed; source = 'instalado' }
  else if (declared) {
    const ok = !/[:/]/.test(declared.range) && declared.range.match(/^[\s^~<>=v]*(\d+)\.(\d+)/)
    if (ok) { version = declared.range.replace(/^[\s^~<>=v]*/, ''); source = `rango declarado en ${declared.field}` }
    else warnings.push(`No se pudo leer la versión de vue (${declared.range}); se comprueba solo al usar la aplicación: @grana/vue necesita vue ${VUE_RANGE}.`)
  }
  if (version) {
    const [, major, minor] = version.match(/^(\d+)\.(\d+)/)
    if (Number(major) !== 3 || Number(minor) < 5) throw new Stop(2, `@grana/vue necesita vue ${VUE_RANGE}; tienes ${version} (${source}). No se instaló nada.`)
  }
  if (!declared && !installed) warnings.push(`No hay vue en el proyecto: se añade vue@${VUE_RANGE}. init no prepara un empaquetador; sin uno (Vite, Nuxt…) los componentes no se usan.`)
  return { version, source, declared: !!declared, warnings }
}

// ---------- marco y modo de tema (I5) ----------

const detectFramework = (cwd, pkg) => {
  const has = (n) => !!declaredRange(pkg, n)
  const nuxt = has('nuxt') || NUXT_CONFIGS.some((f) => existsSync(join(cwd, f)))
  const viteConfig = VITE_CONFIGS.find((f) => existsSync(join(cwd, f))) ?? null
  const vite = has('vite') || !!viteConfig
  return { nuxt, vite, viteConfig, framework: nuxt ? 'nuxt' : vite ? 'vite' : 'ninguno' }
}

// ---------- ejecutor por defecto ----------

const defaultExec = (cmd, args, { cwd }) => {
  // Argumentos fijos (nombres y rangos), nunca texto del usuario. En Windows los gestores son .cmd y necesitan shell.
  const win = process.platform === 'win32'
  const quote = (a) => (/[\^&|<>%"\s]/.test(a) ? `"${a}"` : a)
  const r = spawnSync(cmd, win ? args.map(quote) : args, { cwd, stdio: 'inherit', shell: win })
  return { status: r.status, error: r.error }
}

const toRelImport = (fromDir, target) => {
  const p = posixPath(relative(fromDir, target))
  return p.startsWith('.') ? p : `./${p}`
}

/**
 * @param {string[]} argv argumentos tras `init`
 * @param {{ cwd: string, out: (s: string) => void, err: (s: string) => void, version: string,
 *   exec?: Function, env?: Record<string, string | undefined>, help: string }} io
 * @returns {number} código de salida
 */
export const runInit = (argv, { cwd, out, err, version, exec = defaultExec, env = process.env, help }) => {
  const lines = []
  const say = (s = '') => lines.push(s)
  const flush = () => { if (lines.length) out(`${lines.join('\n')}\n`); lines.length = 0 }
  try {
    return initFlow(argv, { cwd, out, err, version, exec, env, say, flush })
  } catch (e) {
    if (!(e instanceof Stop)) throw e
    flush()
    err(`${e.message}${e.code === 2 && e.usage ? `\n\n${help}` : ''}\n`)
    return e.code
  }
}

const initFlow = (argv, { cwd, out, err, version, exec, env, say, flush }) => {
  const flags = parseInitArgs(argv)
  const dry = !!flags['dry-run']
  const noInstall = !!flags['no-install']
  const major = Number.parseInt(version, 10) || 0
  const warnings = []

  // I1.1 package.json
  const pkgPath = join(cwd, 'package.json')
  if (!existsSync(pkgPath)) {
    let pm = 'npm'
    try { pm = detectPm({ flags, pkg: {}, wsRoot: null, cwd, env }).pm } catch { /* ambiguo: npm solo para sugerir */ }
    const create = pm === 'yarn' ? 'yarn create vue' : `${pm} create vue@latest`
    throw new Stop(2, `No hay package.json en ${cwd}. «init» añade Grana a un proyecto existente; no crea proyectos.\nCrea uno con «${create}» (o «${pm === 'yarn' ? 'yarn create vite' : `${pm} create vite@latest`}») y vuelve a ejecutar init dentro de él.`)
  }
  const pkg = readJson(pkgPath, 'package.json')
  if (!isObj(pkg)) throw new Stop(2, 'package.json no es un objeto JSON.')

  // I1.2 raíz de workspace
  if (pkg.workspaces || existsSync(join(cwd, 'pnpm-workspace.yaml'))) {
    throw new Stop(2, 'Este directorio es la raíz de un workspace: ejecuta «init» en el paquete de la aplicación, no en la raíz.')
  }
  const wsRoot = findWorkspaceRoot(cwd)

  // I2 gestor
  const pmInfo = detectPm({ flags, pkg, wsRoot, cwd, env })
  warnings.push(...pmInfo.warnings)
  const { pm } = pmInfo

  // I1.3 Vue
  const vue = checkVue(cwd, pkg)
  warnings.push(...vue.warnings)

  // marco y modo de tema (I5)
  const fw = detectFramework(cwd, pkg)
  let mode = flags.theme ?? 'auto'
  const requested = mode
  if (mode === 'auto') mode = fw.nuxt ? 'file' : fw.vite ? 'vite' : 'file'
  if (mode === 'vite' && fw.nuxt) throw new Stop(2, '--theme vite con Nuxt está reservado hasta verificarlo; usa --theme file (o auto).')
  if (mode === 'vite' && flags.out !== undefined) throw new Stop(2, 'En el modo vite no se escribe ningún archivo de tema: --out no se admite.')

  // I4 configuración y validación del tema
  const configPath = join(cwd, CONFIG)
  const configExists = existsSync(configPath)
  if (configExists && flags.brand !== undefined && !flags.force) {
    throw new Stop(2, `Ya existe ${CONFIG}: no se mezcla --brand con un archivo ajeno. Edítalo a mano o usa --force para sobrescribirlo.`)
  }
  let config
  let writeConfig
  if (configExists && !flags.force) { config = readJson(configPath, CONFIG); writeConfig = false }
  else { config = flags.brand !== undefined ? { brand: flags.brand } : {}; writeConfig = true }
  const result = buildTheme(config, { source: CONFIG })
  const errors = result.issues.filter((i) => i.severity === 'error')

  // I6 archivos
  let outPath = null
  let outStatus = null
  if (mode === 'file') {
    const outArg = flags.out ?? 'tokens.css'
    outPath = resolve(cwd, outArg)
    const r = relative(cwd, outPath)
    if (r === '' || r.startsWith('..') || isAbsolute(r)) throw new Stop(2, `--out debe quedar dentro del directorio actual: «${outArg}».`)
    if (outPath === configPath) throw new Stop(2, `--out no puede ser ${CONFIG}.`)
    if (existsSync(outPath)) {
      if (statSync(outPath).isDirectory()) throw new Stop(2, `--out apunta a un directorio: «${outArg}».`)
      if (readFileSync(outPath, 'utf8').startsWith(HEADER)) outStatus = 'regenerado'
      else if (flags.force) outStatus = 'sobrescrito'
      else throw new Stop(2, `${rel(cwd, outPath)} existe y no lo generó @grana/cli: no se sobrescribe. Elige otro --out o usa --force.`)
    } else outStatus = 'escrito'
  }

  // ---------- bloque 1: detección ----------
  say(`grana init${dry ? ' (--dry-run: no se instala ni se escribe nada)' : ''}`)
  say(`  Gestor: ${pm}${pmInfo.source ? `, por ${pmInfo.source}` : ' (por defecto, sin otra señal)'}`)
  if (wsRoot) say(`  Workspace: paquete dentro de ${rel(cwd, wsRoot)} (la orden se ejecuta aquí)`)
  say(`  Vue: ${vue.version ? `${vue.version} (${vue.source})` : vue.declared ? 'declarado, versión ilegible' : 'no encontrado'}`)
  say(`  Marco: ${fw.framework}`)
  say(`  Tema: modo ${mode}${requested === 'auto' ? ' (por detección)' : ''}`)
  for (const w of warnings) say(`⚠ ${w}`)

  // ---------- bloque 2: diagnósticos del tema ----------
  const emit = result.ok ? (s) => say(s) : (s) => { flush(); err(`${s}\n`) }
  if (result.issues.length) emit(formatIssues(result.issues))
  if (errors.some((i) => i.kind === 'config')) {
    flush()
    throw new Stop(2, `\nLa configuración no es válida (${errors.length} ${errors.length === 1 ? 'error' : 'errores'}). No se instaló ni se escribió nada.`)
  }
  if (!result.ok) {
    flush()
    throw new Stop(1, `\nEl tema no cumple los mínimos de accesibilidad (${errors.length} ${errors.length === 1 ? 'error' : 'errores'}). No se instaló ni se escribió nada.`)
  }
  if (result.notes.length) say(result.notes.map((n) => `ℹ ${n.message}`).join('\n'))

  // ---------- bloque 3: instalación ----------
  const cmds = []
  const deps = []
  const dev = []
  const grana = declaredRange(pkg, '@grana/vue')
  const cli = declaredRange(pkg, '@grana/cli')
  const majorOf = (r) => { const m = r.match(/^[\s^~<>=v]*(\d+)/); return m ? Number(m[1]) : null }
  say('')
  say('Instalación:')
  if (grana) {
    say(`  @grana/vue ya está: ${grana.range}`)
    if (majorOf(grana.range) !== null && majorOf(grana.range) !== major) say(`⚠ @grana/vue ${grana.range} no es de la mayor ${major} del CLI; no se cambia (actualizar es decisión de la aplicación).`)
  } else deps.push(`@grana/vue@^${major}.0.0`)
  if (vue.declared) say(`  vue ya está declarado${vue.version ? `: ${vue.version}` : ''}`)
  else deps.push(`vue@${VUE_RANGE}`)
  if (cli) {
    say(`  @grana/cli ya está: ${cli.range}`)
    if (majorOf(cli.range) !== null && majorOf(cli.range) !== major) say(`⚠ @grana/cli ${cli.range} no es de la mayor ${major}; no se cambia.`)
  } else dev.push(`@grana/cli@^${version}`)
  if (deps.length) cmds.push([pm, ...COMMANDS[pm].add, ...deps])
  if (dev.length) cmds.push([pm, ...COMMANDS[pm].dev, ...dev])
  if (!cmds.length) say('  No hace falta instalar nada.')

  const done = []
  for (const c of cmds) {
    const text = c.join(' ')
    if (dry || noInstall) { say(`  $ ${text}   (${dry ? 'no se ejecuta: --dry-run' : 'no se ejecuta: --no-install'})`); continue }
    say(`  $ ${text}`)
    flush()
    const r = exec(c[0], c.slice(1), { cwd })
    if (r?.error || r?.status !== 0) {
      const missing = r?.error?.code === 'ENOENT'
      const pending = cmds.slice(done.length).map((x) => `  ${x.join(' ')}`).join('\n')
      throw new Stop(3, [
        `✖ ${missing ? `No se encontró el gestor «${c[0]}» en el sistema` : `La instalación falló (${r?.error ? r.error.message : `código ${r?.status}`})`}: ${text}`,
        done.length ? `Ya completadas: ${done.map((x) => x.join(' ')).join(' · ')}` : 'No se completó ninguna orden.',
        `El gestor puede haber dejado cambios en package.json y en el archivo de bloqueo. No se escribió ningún archivo de Grana.`,
        `Para reintentar a mano:\n${pending}`,
        missing ? `Instala ${c[0]} o elige otro con --pm (eso cambia el gestor del proyecto).` : ''
      ].filter(Boolean).join('\n'))
    }
    done.push(c)
  }

  // ---------- bloque 4: archivos ----------
  say('')
  say('Archivos:')
  const cfgText = `${JSON.stringify(config, null, 2)}\n`
  const verb = (past, future) => (dry ? future : past)
  if (writeConfig) {
    say(`  ✔ ${CONFIG}: ${configExists ? verb('sobrescrito (--force)', 'se sobrescribiría (--force)') : verb('escrito', 'se escribiría')}`)
    if (!dry) writeFileSync(configPath, cfgText)
  } else say(`  ✔ ${CONFIG}: ${verb('conservado', 'se conservaría')}`)
  if (mode === 'file') {
    const name = rel(cwd, outPath)
    const futureVerb = { escrito: 'se escribiría', regenerado: 'se regeneraría', sobrescrito: 'se sobrescribiría (--force)' }[outStatus]
    const count = Object.keys(result.generated).length
    say(`  ✔ ${name}: ${verb(outStatus, futureVerb)} (${count} ${count === 1 ? 'token' : 'tokens'})`)
    if (!dry) {
      try { mkdirSync(dirname(outPath), { recursive: true }); writeFileSync(outPath, result.css) } catch (e) {
        throw new Stop(2, `No se pudo escribir ${name}: ${e.message}`)
      }
    }
  } else say('  Modo vite: el tema llega por el plugin; no se escribe archivo de tema.')
  if (writeConfig && !flags.brand) say(`  ℹ ${CONFIG} está vacío (tema por defecto): añade "brand" con tu color; claves en tokens.md §1 y en el README de @grana/cli.`)

  // ---------- bloque 5: siguientes pasos ----------
  say('')
  say('Siguientes pasos (init no edita tu código):')
  if (noInstall && !dry && cmds.length) {
    say('  Instala los paquetes:')
    for (const c of cmds) say(`    ${c.join(' ')}`)
  }
  const outRel = outPath ? posixPath(relative(cwd, outPath)) : null
  const ts = existsSync(join(cwd, 'tsconfig.json')) || !!declaredRange(pkg, 'typescript')
  if (fw.nuxt) {
    const plugin = `plugins/grana.${ts ? 'ts' : 'js'}`
    say(`  1. Crea ${plugin}:`)
    say('')
    say(`     import Grana from '@grana/vue'`)
    say('')
    say('     export default defineNuxtPlugin((nuxtApp) => {')
    say('       nuxtApp.vueApp.use(Grana)')
    say('     })')
    say('')
    say('  2. En nuxt.config, en la cadena css:')
    say('')
    say(`     css: ['@grana/vue/style.css', '@grana/vue/fonts.css', '~~/${outRel}']`)
    say('')
    say('     (fonts.css es opcional: la fuente Instrument Sans)')
  } else {
    let n = 1
    if (mode === 'vite') {
      say(`  ${n++}. En ${fw.viteConfig ?? 'tu archivo de configuración de Vite (vite.config.*)'}:`)
      say('')
      say(`     import grana from '@grana/cli/vite'`)
      say(`     // y en plugins: [ …, grana({ config: '${CONFIG}' }) ]`)
      say('')
    }
    const entry = ENTRIES.find((f) => existsSync(join(cwd, f)))
    say(`  ${n++}. En ${entry ?? 'tu archivo de entrada'}:`)
    say('')
    say(`     import Grana from '@grana/vue'`)
    say(`     import '@grana/vue/style.css'`)
    say(`     import '@grana/vue/fonts.css' // opcional: la fuente Instrument Sans`)
    say(mode === 'vite' ? `     import 'virtual:grana/tokens.css'` : `     import '${entry ? toRelImport(dirname(join(cwd, entry)), outPath) : `./${outRel}`}'`)
    say('     // …y al crear la aplicación: app.use(Grana)')
    if (mode === 'file') {
      say('')
      say(`  ${n++}. Para regenerar el tema al cambiar ${CONFIG}, añade a package.json en "scripts":`)
      say('')
      say(`     "theme": "grana theme ${CONFIG}${flags.out !== undefined && outRel !== 'tokens.css' ? ` --out ${outRel}` : ''}"`)
    }
  }
  say('')
  say('  ¿Diseñas con agentes de IA? npx grana catalog --agents imprime el bloque para AGENTS.md o CLAUDE.md.')
  say('')
  say(dry ? '✔ Plan completo; no se instaló ni se escribió nada.' : '✔ Listo.')
  flush()
  return 0
}
