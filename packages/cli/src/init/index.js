// `grana init` (design/contracts/cli-init.md, #996 a #1003): detección e instalación (§2, §5.5, §10), preguntas (§3) y plan.
import { spawnSync, execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, posix, resolve } from 'node:path'
import { buildTheme, readConfig } from '../index.js'
import { INIT_CODES, formatIssues } from '../cli.js'
import { createInterface } from 'node:readline/promises'
import { defaultImport, editEntry, editViteConfig, importsOf, jsonStyle, unifiedDiff, writeJson } from './edit.js'
const readJson = (path) => {
  try { return JSON.parse(readFileSync(path, 'utf8')) } catch { return undefined }
}
const fail = (code, message) => ({ code, message })
const depOf = (pkg, name) => pkg.dependencies?.[name] ?? pkg.devDependencies?.[name] ?? pkg.peerDependencies?.[name]
const rangeVersion = (range) => {
  if (typeof range !== 'string' || /^(latest|next|\*|x|workspace:|catalog:)/i.test(range.trim())) return null
  const m = /(\d+)(?:\.(\d+|x|\*))?/.exec(range)
  return m ? [+m[1], /^\d+$/.test(m[2] ?? '') ? +m[2] : 0] : null
}
const ENTRY_FALLBACK = ['ts', 'js', 'mts', 'mjs'].map((x) => `src/main.${x}`)
const VITE_CONFIGS = ['ts', 'mts', 'js', 'mjs'].map((x) => `vite.config.${x}`)
const LOCKS = [['package-lock.json', 'npm'], ['pnpm-lock.yaml', 'pnpm'], ['yarn.lock', 'yarn'], ['bun.lock', 'bun'], ['bun.lockb', 'bun']]
export const PMS = ['npm', 'pnpm', 'yarn', 'bun']

export const detectPm = (root, pkg, { pm, env = process.env } = {}) => {
  if (pm) return { pm }
  const fromField = /^(npm|pnpm|yarn|bun)@/.exec(pkg.packageManager ?? '')?.[1]
  const found = LOCKS.filter(([f]) => existsSync(join(root, f)))
  const kinds = [...new Set(found.map(([, k]) => k))]
  if (kinds.length === 1) return { pm: kinds[0] }
  if (kinds.length > 1) {
    if (fromField) return { pm: fromField }
    return { error: fail(2, `Hay varios archivos de bloqueo (${found.map(([f]) => f).join(', ')}): elige con --pm npm|pnpm|yarn|bun.`) }
  }
  if (fromField) return { pm: fromField }
  const agent = /^(npm|pnpm|yarn|bun)\//.exec(env.npm_config_user_agent ?? '')?.[1]
  return { pm: agent ?? 'npm' }
}

export const detect = (root, { pm, env } = {}) => {
  const warnings = []
  const pkgPath = join(root, 'package.json')
  const pkg = existsSync(pkgPath) ? readJson(pkgPath) : undefined
  if (!pkg || typeof pkg !== 'object') return { error: fail(3, `No hay package.json${existsSync(pkgPath) ? ' válido' : ''} en ${root}: ejecuta \`grana init\` en la raíz de tu aplicación.`) }
  if (depOf(pkg, 'nuxt') || ['ts', 'js', 'mjs', 'mts'].some((x) => existsSync(join(root, `nuxt.config.${x}`)))) {
    return { error: fail(3, 'Nuxt todavía no lo instala `grana init` (reservado). Instalación manual: añade `@grana/vue/style.css` y `@grana/vue/fonts.css` a `css` en `nuxt.config` y registra los componentes en un plugin; ver el README.') }
  }
  const installed = readJson(join(root, 'node_modules/vue/package.json'))?.version
  const vueRange = depOf(pkg, 'vue')
  const vue = rangeVersion(installed ?? vueRange)
  if ((!installed && vueRange === undefined) || (vue && vue[0] !== 3)) return { error: fail(3, `Grana necesita Vue 3; este proyecto declara vue@${installed ?? vueRange ?? "—"}.`) }
  if (!vue) warnings.push(`No se pudo saber la versión de Vue (vue@${vueRange}); @grana/vue necesita vue ^3.5.0.`)
  else if (vue[1] < 5) warnings.push(`@grana/vue pide vue ^3.5.0 como dependencia par; este proyecto tiene vue@${installed ?? vueRange}.`)
  const viteRange = pkg.devDependencies?.vite ?? pkg.dependencies?.vite
  if (viteRange === undefined) return { error: fail(3, 'No es un proyecto Vite; para otra configuración, sigue la instalación manual del README.') }
  const vite = rangeVersion(readJson(join(root, 'node_modules/vite/package.json'))?.version ?? viteRange)
  if (vite && vite[0] < 5) warnings.push(`Vite ${vite[0]} es anterior a 5: puede no funcionar.`)
  let entry = null
  try {
    const html = readFileSync(join(root, 'index.html'), 'utf8')
    for (const tag of html.match(/<script\b[^>]*>/gi) ?? []) {
      if (!/\btype\s*=\s*["']?module\b/i.test(tag)) continue
      const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]
      if (src && !/^[a-z]+:/i.test(src)) { entry = src.replace(/^\.?\//, ''); break }
    }
  } catch {}
  if (entry && !existsSync(join(root, entry))) entry = null
  entry ??= ENTRY_FALLBACK.find((f) => existsSync(join(root, f))) ?? null
  const viteConfig = VITE_CONFIGS.find((f) => existsSync(join(root, f))) ?? null
  const p = detectPm(root, pkg, { pm, env })
  if (p.error) return p
  return { pkg, warnings, entry, viteConfig, pm: p.pm }
}

const ADD = { npm: ['install'], pnpm: ['add'], yarn: ['add'], bun: ['add'] }
const DEV = { npm: '-D', pnpm: '-D', yarn: '-D', bun: '-d' }

export const installCommand = (pm, specs, dev) => ({ cmd: pm, args: [...ADD[pm], ...(dev ? [DEV[pm]] : []), ...specs] })
const quote = (a) => (/^[\w@./:=+-]+$/.test(a) ? a : `'${a.replace(/'/g, `'\\''`)}'`)
export const showCommand = ({ cmd, args }) => [cmd, ...args].map(quote).join(' ')

export const findTarball = (dir, name, version) => {
  let files
  try { files = readdirSync(dir) } catch { return { error: `--from: no se pudo leer ${dir}.` } }
  const prefix = `${name.replace('@', '').replace('/', '-')}-`
  const found = files.filter((f) => f.startsWith(prefix) && f.endsWith('.tgz')).map((f) => ({ path: resolve(dir, f), version: f.slice(prefix.length, -4) }))
  const same = found.find((t) => t.version === version)
  if (same) return same
  if (found.length === 1) return found[0]
  if (!found.length) return { error: `--from: no hay ${prefix}<versión>.tgz en ${dir} (créalo con \`npm pack\` en el paquete ${name}).` }
  return { error: `--from: hay varias versiones de ${name} en ${dir} y ninguna es ${version}: ${found.map((t) => t.version).join(', ')}.` }
}

const CANCEL = Symbol('cancel')

const createAsker = (input, write, { sigint = false } = {}) => {
  const rl = createInterface({ input, terminal: false })
  const lines = []
  const waiting = []
  let closed = false
  const stop = () => { closed = true; while (waiting.length) waiting.shift().reject(CANCEL) }
  rl.on('line', (l) => (waiting.length ? waiting.shift().resolve(l) : lines.push(l)))
  rl.on('close', stop)
  if (sigint) process.on('SIGINT', stop)
  return {
    ask(q) {
      write(q)
      if (lines.length) return Promise.resolve(lines.shift())
      if (closed) return Promise.reject(CANCEL)
      return new Promise((resolve, reject) => waiting.push({ resolve, reject }))
    },
    close() {
      if (sigint) process.off('SIGINT', stop)
      rl.removeListener('close', stop)
      rl.close()
    }
  }
}

// Sí/no con «sí» por defecto (§3)
const yesNo = async (asker, question, warn) => {
  for (;;) {
    const a = (await asker.ask(`${question} [S/n] `)).trim().toLowerCase()
    if (!a) return true
    if (/^(s|si|sí|y|yes)$/.test(a)) return true
    if (/^(n|no)$/.test(a)) return false
    warn('Responde «s» o «n».')
  }
}

export const REGISTER_DEFAULT = 'named'
const THEME_DEFAULT = 'plugin'
const CHOICES = { register: ['named', 'global'], theme: ['plugin', 'file'], pm: PMS }
const VALUED = ['register', 'theme', 'pm', 'from', 'brand', 'shape', 'density']
const THEME_FLAGS = ['brand', 'shape', 'density', 'dark']
const CONFIG = 'grana.config.json'
const EXAMPLE = 'src/GranaExample.vue'
const TOKENS_FILE = 'src/grana-tokens.css'
const SCRIPT = 'grana theme grana.config.json --out src/grana-tokens.css'

export const INIT_HELP = `grana init · instala Grana en un proyecto Vite + Vue 3

  npx @grana/cli init [directorio] [opciones]

Tema (si no hay grana.config.json): --brand <hex> · --shape rounded|pill · --density default|comfortable|compact · --dark | --no-dark
  -y, --yes                sin preguntas: opciones dadas y valores por defecto
  --dry-run                enseña diffs y órdenes; no escribe ni instala
  --register named|global  registro de componentes (${REGISTER_DEFAULT})
  --theme plugin|file      plugin de Vite o src/grana-tokens.css (${THEME_DEFAULT})
  --example                crea src/GranaExample.vue
  --pm npm|pnpm|yarn|bun   gestor (por defecto, el del archivo de bloqueo)
  --from <dir>             instala los .tgz de \`npm pack\` de <dir>
  --skip-install           escribe los archivos e imprime la orden sin instalar

Códigos: 0 hecho o nada que cambiar · 1 tema bajo un mínimo · 2 uso o configuración. ${INIT_CODES}
`

export const parseInit = (argv) => {
  const o = { positional: [], set: {} }
  for (let i = 0; i < argv.length; i++) {
    let a = argv[i]
    let v
    const eq = a.indexOf('=')
    if (a.startsWith('--') && eq > 0) { v = a.slice(eq + 1); a = a.slice(0, eq) }
    const key = a.replace(/^--/, '')
    if (a === '-y' || a === '--yes') o.yes = true
    else if (a === '-h' || a === '--help') o.help = true
    else if (a === '--dry-run') o.dryRun = true
    else if (a === '--example') o.example = true
    else if (a === '--skip-install') o.skipInstall = true
    else if (a === '--dark' || a === '--no-dark') { o.set.dark = a === '--dark' }
    else if (VALUED.includes(key) && a.startsWith('--')) {
      v ??= argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[++i] : undefined
      if (v === undefined) return { error: `${a} necesita un valor.` }
      if (CHOICES[key] && !CHOICES[key].includes(v)) return { error: `${a} debe ser ${CHOICES[key].join(' | ')}; se recibió «${v}».` }
      if (THEME_FLAGS.includes(key)) o.set[key] = v
      else o[key] = v
    } else if (a.startsWith('-')) return { error: `Opción desconocida: ${a}` }
    else o.positional.push(a)
  }
  if (o.positional.length > 1) return { error: '«init» admite un solo directorio.' }
  o.register ??= REGISTER_DEFAULT
  o.theme ??= THEME_DEFAULT
  return o
}

const toConfig = ({ brand, shape = 'rounded', density = 'default', dark = true }) => ({ ...(brand ? { brand: (brand.startsWith('#') ? brand : `#${brand}`).toUpperCase() } : {}), shape, density, dark })
const firstError = (raw) => readConfig(raw).errors[0]?.message
const read = (path) => { try { return readFileSync(path, 'utf8') } catch { return null } }

const atomicWrite = (path, text) => {
  mkdirSync(dirname(path), { recursive: true })
  const tmp = join(dirname(path), `.${posix.basename(path)}.grana-${process.pid}.tmp`)
  try { writeFileSync(tmp, text); renameSync(tmp, path) } catch (e) { rmSync(tmp, { force: true }); throw e }
}

const exampleFile = (global, ts) => `${global ? '' : `<script setup${ts ? ' lang="ts"' : ''}>\nimport { GBtn } from '@grana/vue'\n</script>\n\n`}<template>\n  <g-btn>Guardar</g-btn>\n  <g-btn variant="soft">Cancelar</g-btn>\n</template>\n`
const VITE_FILE = `import { defineConfig } from 'vite'\nimport vue from '@vitejs/plugin-vue'\nimport grana from '@grana/cli/vite'\n\nexport default defineConfig({\n  plugins: [grana(), vue()],\n})`

export const init = async (argv, io = {}) => {
  const { cwd = process.cwd(), out = (s) => process.stdout.write(s), err = (s) => process.stderr.write(s), version = '0.0.0', stdin = process.stdin, env = process.env, spawn = spawnSync, platform = process.platform } = io
  const isTTY = io.isTTY ?? Boolean(stdin.isTTY)
  const a = parseInit(argv)
  if (a.error) { err(`✖ ${a.error}\n\n${INIT_HELP}`); return 2 }
  if (a.help) { out(INIT_HELP); return 0 }
  const flagError = firstError(toConfig(a.set))
  if (flagError) { err(`✖ ${flagError}\n`); return 2 }
  const root = resolve(cwd, a.positional[0] ?? '.')
  const d = detect(root, { pm: a.pm, env })
  if (d.error) { err(`✖ ${d.error.message}\n`); return d.error.code }
  if (!a.yes && !isTTY) { err('✖ Sin terminal interactiva: usa --yes y las opciones (--brand, --shape, --density, --dark/--no-dark).\n'); return 2 }
  for (const w of d.warnings) err(`⚠ ${w}\n`)
  const asker = a.yes ? null : createAsker(stdin, out, { sigint: stdin === process.stdin })
  try {
    return await run(a, { root, d, out, err, version, spawn, platform, asker })
  } catch (e) {
    if (e === CANCEL) { err('\n✖ Cancelado: no se escribió ni se instaló nada.\n'); return 5 }
    throw e
  } finally {
    asker?.close()
  }
}

const run = async (a, { root, d, out, err, version, spawn, platform, asker }) => {
  const warn = (s) => err(`⚠ ${s}\n`)
  const manual = []
  const files = []
  const configPath = join(root, CONFIG)
  const configBefore = read(configPath)
  let raw = null
  if (configBefore !== null) {
    try { raw = JSON.parse(configBefore) } catch (e) { err(`✖ No se pudo leer ${CONFIG}: ${e.message}\n`); return 2 }
    const r = buildTheme(raw, { source: CONFIG })
    if (r.issues.some((i) => i.severity === 'error' && i.kind === 'config')) { err(`${formatIssues(r.issues)}\n\n✖ ${CONFIG} no es válido. No se escribió nada.\n`); return 2 }
    if (!r.ok) { err(`${formatIssues(r.issues)}\n\n✖ El tema de ${CONFIG} no cumple los mínimos de accesibilidad. No se escribió nada.\n`); return 1 }
  }

  const pkg = d.pkg
  const needVue = !pkg.dependencies?.['@grana/vue']
  const needCli = !(pkg.devDependencies?.['@grana/cli'] ?? pkg.dependencies?.['@grana/cli'])
  const entryText = d.entry ? read(join(root, d.entry)) : null
  const specs = entryText ? importsOf(entryText).map((i) => i.spec) : []
  const entryDir = posix.dirname(d.entry ?? 'src/main.js')
  const tokensSpec = (() => { const r = posix.relative(entryDir, TOKENS_FILE); return r.startsWith('.') ? r : `./${r}` })()
  const want = {
    style: !specs.includes('@grana/vue/style.css'),
    fonts: !specs.includes('@grana/vue/fonts.css'),
    theme: a.theme === 'plugin' ? (specs.includes('virtual:grana/tokens.css') ? null : 'virtual:grana/tokens.css') : specs.some((s) => s.endsWith('grana-tokens.css')) ? null : tokensSpec,
    global: false
  }
  if (a.register === 'global') {
    const name = entryText && defaultImport(importsOf(entryText), '@grana/vue')
    want.global = !(name && entryText.includes(`.use(${name}`))
  }
  const entryNeeded = want.style || want.fonts || want.theme || want.global
  const viteText = d.viteConfig ? read(join(root, d.viteConfig)) : null
  const viteNeeded = a.theme === 'plugin' && !(viteText && importsOf(viteText).some((i) => i.spec === '@grana/cli/vite'))
  const tokensNeeded = a.theme === 'file' && !existsSync(join(root, TOKENS_FILE))
  const scriptNow = pkg.scripts?.['grana:theme']
  const scriptNeeded = a.theme === 'file' && scriptNow !== SCRIPT
  const exampleNeeded = a.example && !existsSync(join(root, EXAMPLE))
  if (configBefore !== null && !needVue && !needCli && !entryNeeded && !viteNeeded && !tokensNeeded && !scriptNeeded && !exampleNeeded) {
    out(`Grana ya está instalado en ${root}; nada que cambiar.\n`)
    return 0
  }

  const given = THEME_FLAGS.filter((k) => a.set[k] !== undefined)
  let keep = configBefore !== null
  if (keep && asker) keep = await yesNo(asker, `Ya existe ${CONFIG}. ¿Mantenerlo?`, warn)
  let theme
  if (keep) {
    for (const k of given) warn(`Se ignoró --${k === 'dark' ? (a.set.dark ? 'dark' : 'no-dark') : k}: ya existe ${CONFIG}; edítalo para cambiar el tema.`)
    theme = buildTheme(raw, { source: CONFIG })
  } else {
    const answers = { ...a.set }
    const ask = async (key, q, def) => {
      if (answers[key] !== undefined || !asker) return
      for (;;) {
        const v = (await asker.ask(`${q} [${def}]: `)).trim()
        if (!v) return
        const e = firstError(toConfig({ ...answers, [key]: v }))
        if (!e) { answers[key] = v; return }
        err(`✖ ${e}\n`)
      }
    }
    const askBrand = () => ask('brand', 'Color de marca (hex; vacío = el de Grana)', '')
    await askBrand()
    await ask('shape', 'Forma (rounded, pill)', 'rounded')
    await ask('density', 'Densidad (default, comfortable, compact)', 'default')
    if (answers.dark === undefined && asker) answers.dark = await yesNo(asker, 'Modo oscuro', warn)
    for (;;) {
      raw = toConfig(answers)
      theme = buildTheme(raw, { source: CONFIG })
      if (theme.ok) break
      err(`${formatIssues(theme.issues.filter((i) => i.severity === 'error'))}\n`)
      if (!asker) { err('\n✖ El tema no cumple los mínimos de accesibilidad. No se escribió ni se instaló nada.\n'); return 1 }
      err('Elige otro color o pulsa Intro para el de Grana.\n')
      delete answers.brand
      await askBrand()
    }
    files.push({ path: CONFIG, before: configBefore, after: `${JSON.stringify(raw, null, 2)}\n` })
  }
  const warnings = theme.issues.filter((i) => i.severity === 'warning')
  if (warnings.length) err(`${formatIssues(warnings)}\n`)

  const ts = /\.m?ts$/.test(d.entry ?? d.viteConfig ?? '')
  const indent = (l) => l.map((x) => `    ${x}`).join('\n')
  if (entryNeeded) {
    const plan = editEntry(entryText ?? '', want)
    if (entryText === null || plan.error) manual.push(`${entryText === null ? 'No se encontró el archivo de entrada (src/main.*)' : `${d.entry}: ${plan.error}`}. Añade tras la última importación:\n${indent(plan.lines)}${plan.use ? `\n  y ${plan.use} justo antes de .mount(…)` : ''}`)
    else files.push({ path: d.entry, before: entryText, after: plan.text })
  }
  if (viteNeeded) {
    if (!viteText) manual.push(`No hay vite.config: créalo (vite.config.${ts ? 'ts' : 'js'}) con:\n${indent(VITE_FILE.split('\n'))}\n  o vuelve a ejecutar con --theme file.`)
    else {
      const plan = editViteConfig(viteText)
      if (plan.error) manual.push(`${d.viteConfig}: ${plan.error}. Añade tras la última importación:\n    ${plan.lines[0]}\n  y ${plan.call} como primer elemento de plugins: […]; o vuelve a ejecutar con --theme file.`)
      else files.push({ path: d.viteConfig, before: viteText, after: plan.text })
    }
  }
  if (tokensNeeded) files.push({ path: TOKENS_FILE, before: null, after: theme.css })
  if (scriptNeeded) {
    if (scriptNow !== undefined) manual.push(`package.json ya tiene otro script «grana:theme»; para regenerar el tema:\n    "grana:theme": "${SCRIPT}"`)
    else {
      const pkgText = read(join(root, 'package.json'))
      const addScript = (text) => { const p = JSON.parse(text); p.scripts = { ...p.scripts, 'grana:theme': SCRIPT }; return writeJson(p, jsonStyle(text)) }
      files.push({ path: 'package.json', before: pkgText, after: addScript(pkgText), remake: addScript })
    }
  }
  if (exampleNeeded) files.push({ path: EXAMPLE, before: null, after: exampleFile(a.register === 'global', ts) })

  const commands = []
  const installed = []
  for (const [name, need, dev] of [['@grana/vue', needVue, false], ['@grana/cli', needCli, true]]) {
    if (!need) continue
    const t = a.from && findTarball(resolve(root, a.from), name, version)
    if (t?.error) { err(`✖ ${t.error}\nNo se instaló ni se escribió nada.\n`); return 4 }
    commands.push(installCommand(d.pm, [t?.path ?? `${name}@${version}`], dev))
    installed.push([name, t?.path])
  }

  if (existsSync(join(root, '.git')) && files.some((f) => f.before !== null)) {
    try {
      const dirty = execFileSync('git', ['status', '--porcelain', '--', ...files.filter((f) => f.before !== null).map((f) => f.path)], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
      if (dirty) warn(`Sin commitear: ${dirty.split('\n').map((l) => l.slice(3)).join(', ')}. Revisa el diff antes de aceptar.`)
    } catch {}
  }

  const confirm = !a.dryRun && asker
  if (commands.length) {
    out(`\nInstalación:\n${commands.map((c) => `  ${showCommand(c)}`).join('\n')}\n`)
    if (confirm && !(await yesNo(asker, '¿Instalar?', warn))) throw CANCEL
  }
  const accepted = []
  for (const f of files) {
    out(`\n${unifiedDiff(f.before, f.after, f.path)}`)
    if (confirm && !(await yesNo(asker, `¿Aplicar a ${f.path}?`, warn))) {
      manual.push(`${f.path}: rechazado; para aplicarlo a mano, el diff de arriba.`)
      continue
    }
    accepted.push(f)
  }

  const written = []
  if (!a.dryRun) {
    for (const c of commands) {
      if (a.skipInstall) continue
      const r = spawn(platform === 'win32' ? `${c.cmd}.cmd` : c.cmd, c.args, { cwd: root, stdio: 'inherit' })
      if (r?.error || r?.status !== 0) {
        err(`\n✖ Falló «${showCommand(c)}»${r?.error ? `: ${r.error.message}` : ` (código ${r?.status})`}. No se escribió ningún archivo.\n`)
        err(a.from ? `Se usó ${c.args[c.args.length - 1]}.\n` : 'Si el error es 404 o "No matching version", @grana/vue todavía no está en npm: prueba con --from <dir> y los .tgz de `npm pack` (ver la guía).\n')
        return 4
      }
    }
    for (const f of accepted) {
      const path = join(root, f.path)
      const now = read(path)
      atomicWrite(path, f.remake && now !== null ? f.remake(now) : f.after)
      written.push(f.path)
    }
  }

  const lines = ['']
  if (a.dryRun) lines.push('Simulación (--dry-run): no se escribió ni se instaló nada.')
  for (const p of written) lines.push(`✔ ${p}`)
  if (a.skipInstall && commands.length && !a.dryRun) lines.push(`Sin instalar (--skip-install); ejecuta:\n${commands.map((c) => `  ${showCommand(c)}`).join('\n')}`)
  else if (!a.dryRun) for (const [name, path] of installed) lines.push(`✔ ${name}${path ? ` (file:${path})` : `@${version}`}`)
  const tok = (n) => theme.doc?.color.tokens.find((t) => t.name === n)
  const brand = tok('brand')
  const on = tok('on-brand')
  if (brand && on) {
    lines.push(`Tema: brand ${brand.value.light}, on-brand ${on.value.light} (${on.contrast?.light}:1)${brand.value.dark && on.contrast?.dark ? `; oscuro: brand ${brand.value.dark}, on-brand ${on.value.dark} (${on.contrast.dark}:1)` : ''}.`)
  }
  const cfg = keep ? null : raw
  const eq = ['npx @grana/cli init --yes']
  if (a.positional[0]) eq.push(a.positional[0])
  if (cfg) {
    if (cfg.brand) eq.push(`--brand '${cfg.brand}'`)
    eq.push(`--shape ${cfg.shape}`, `--density ${cfg.density}`, cfg.dark ? '--dark' : '--no-dark')
  }
  if (a.register !== REGISTER_DEFAULT) eq.push(`--register ${a.register}`)
  if (a.theme !== THEME_DEFAULT) eq.push(`--theme ${a.theme}`)
  if (a.example) eq.push('--example')
  if (a.pm) eq.push(`--pm ${a.pm}`)
  if (a.from) eq.push(`--from ${a.from}`)
  lines.push(`Orden equivalente: ${eq.join(' ')}`)
  const runDev = d.pm === 'npm' ? 'npm run dev' : `${d.pm} ${d.pm === 'bun' ? 'run ' : ''}dev`
  lines.push(`Siguiente: ${runDev}`)
  if (a.register === 'named') lines.push("Cada componente se importa donde se usa:\n  <script setup>\n  import { GBtn } from '@grana/vue'\n  </script>\n  <template><g-btn>Guardar</g-btn></template>")
  else lines.push('app.use(Grana) carga todo el principal (≈ 219 KiB gzip); las entradas propias (/combobox, /slider…) van aparte.')
  if (a.example) lines.push("Ejemplo: import GranaExample from './GranaExample.vue' y <GranaExample /> en App.vue.")
  out(`${lines.join('\n')}\n`)
  if (a.from && installed.length && !a.dryRun) warn('package.json apunta a archivos locales (file:…); cámbialo a la versión de npm cuando se publique.')
  if (manual.length) {
    err(`\nPasos a mano (${manual.length}):\n${manual.map((m) => `- ${m}`).join('\n')}\n`)
    return 6
  }
  return 0
}

