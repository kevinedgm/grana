// Compuerta de la tabla única de movimiento (DECISIONS #1002 a #1009; tokens.md §29.9 y §29.10). Aplica tal cual las siete
// reglas de `gate` de design/contracts/motion.json sobre el CSS de componentes y de bloques: aquí no se decide nada, y un
// uso nuevo se resuelve en el JSON (dueña: lima), nunca en este archivo. Falla con el archivo, la línea y la regla.
// Uso: node packages/vue/scripts/check-motion.mjs [--root <árbol>]   (--root solo para probar la compuerta sobre una copia)
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const rootArg = process.argv.indexOf('--root')
export const ROOT = rootArg > 0 ? resolve(process.argv[rootArg + 1]) : resolve(here, '../../..')

const norm = (s) => s.replace(/\s+/g, ' ').trim().replace(/\(\s+/g, '(').replace(/\s+\)/g, ')')
// Los comentarios se vacían conservando los saltos: la línea del informe es la del archivo
const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))
const lineOf = (text, i) => text.slice(0, i).split('\n').length
const allows = (v, file) => v === '*' || (Array.isArray(v) && v.includes(file))

/** Expande los dos niveles de `dir/∗/∗.css` de gate.css */
const cssFiles = (root, globs) => globs.flatMap((g) => {
  const [base, ext] = g.split('/*/*')
  const dir = join(root, base)
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((d) => {
    const sub = join(dir, d)
    if (!statSync(sub).isDirectory()) return []
    return readdirSync(sub).filter((f) => f.endsWith(ext)).map((f) => join(sub, f))
  })
})

/** Funciones calc() enteras, con paréntesis anidados */
function calcs(text) {
  const out = []
  const re = /(?<![\w-])calc\(/g
  for (let m; (m = re.exec(text));) {
    let depth = 1
    let i = re.lastIndex
    while (i < text.length && depth) {
      if (text[i] === '(') depth++
      else if (text[i] === ')') depth--
      i++
    }
    out.push({ index: m.index, expr: text.slice(m.index, i) })
    re.lastIndex = i // un calc() dentro de otro es parte del de fuera
  }
  return out
}

export function check(motion, root = ROOT) {
  const fails = []
  const add = (rule, file, line, msg) => fails.push({ rule, file, line, msg })
  const { literals: L, gate, easeUses, durations, durationAliases, durationMultipliers, moments, components, pieces, exceptions } = motion
  const timeRe = new RegExp(L.timePattern, 'g')
  const curveRe = new RegExp(L.curvePattern, 'g')
  const ringRe = new RegExp(moments.foco.ringPattern, 'g')
  const durationTokens = Object.values(durations)
  const counts = { spring: {}, bounce: {} }
  const files = cssFiles(root, gate.css)

  for (const path of files) {
    const file = basename(path)
    const rel = relative(root, path)
    const text = strip(readFileSync(path, 'utf8'))
    const excluded = L.excludedFiles.includes(file)

    if (!excluded) {
      for (const m of text.matchAll(timeRe)) {
        if (!allows(L.times[m[0]], file)) add('literal-time', rel, lineOf(text, m.index), `tiempo literal ${m[0]}`)
      }
      for (const m of text.matchAll(curveRe)) {
        if (!allows(L.curves[norm(m[0])], file)) add('literal-curve', rel, lineOf(text, m.index), `curva literal ${m[0]}`)
      }
      const aliases = Object.keys(durationAliases).filter((k) => k !== '$comment' && durationAliases[k].includes(file))
      const hasDuration = (e) => durationTokens.some((t) => e.includes(t)) || aliases.some((a) => new RegExp(`${a}(?![\\w-])`).test(e))
      for (const { index, expr } of calcs(text)) {
        if (!hasDuration(expr) || !/[*/]/.test(expr)) continue
        const e = norm(expr)
        const known = durationMultipliers.find((d) => norm(d.expr) === e)
        if (!known) add('multiplier', rel, lineOf(text, index), `multiplicador sin registrar: ${e}`)
        else if (!known.files.includes(file)) add('multiplier', rel, lineOf(text, index), `multiplicador registrado en otros archivos: ${e}`)
      }
    }

    for (const curve of ['spring', 'bounce']) {
      const hits = [...text.matchAll(new RegExp(`${motion.curves[curve]}(?![\\w-])`, 'g'))]
      if (hits.length) counts[curve][file] = { rel, line: lineOf(text, hits[0].index), n: hits.length }
    }

    for (const m of text.matchAll(ringRe)) {
      const [, prop, raw] = m
      const value = norm(raw)
      const allowed = moments.foco.ringTransitions[prop]
      if (!allowed || !allows(allowed[value], file)) add('focus-ring', rel, lineOf(text, m.index), `transición del anillo sin registrar: ${prop} ${value}`)
    }
  }

  for (const curve of ['spring', 'bounce']) {
    const uses = easeUses[curve]
    for (const [file, { rel, line, n }] of Object.entries(counts[curve])) {
      if (!uses[file]) add('ease-use', rel, line, `${motion.curves[curve]} fuera de la lista cerrada`)
      else if (uses[file].count !== n) add('ease-use', rel, line, `${motion.curves[curve]}: ${n} usos, la lista dice ${uses[file].count}`)
    }
    for (const [file, { count }] of Object.entries(uses)) {
      if (!counts[curve][file]) add('ease-use', file, 0, `${motion.curves[curve]}: 0 usos, la lista dice ${count}`)
    }
  }

  const dirs = readdirSync(join(root, gate.componentDirs)).filter((d) => statSync(join(root, gate.componentDirs, d)).isDirectory())
  for (const d of dirs) if (!components[d]) add('component-declared', `${gate.componentDirs}/${d}`, 0, 'componente sin clave en motion.json')
  for (const k of Object.keys(components)) if (!dirs.includes(k)) add('component-declared', 'design/contracts/motion.json', 0, `clave sin directorio: ${k}`)

  const ids = new Set(exceptions.map((e) => e.id))
  for (const [name, c] of Object.entries(components)) {
    for (const p of c.pieces || []) if (!pieces[p]) add('pieces-known', 'design/contracts/motion.json', 0, `${name}: pieza desconocida ${p}`)
    for (const x of c.exceptions || []) if (!ids.has(x)) add('pieces-known', 'design/contracts/motion.json', 0, `${name}: excepción desconocida ${x}`)
  }

  return { fails, files: files.length, components: dirs.length }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const motion = JSON.parse(readFileSync(join(ROOT, 'design/contracts/motion.json'), 'utf8'))
  const { fails, files, components } = check(motion)
  for (const f of fails) console.error(`${f.file}${f.line ? `:${f.line}` : ''} · ${f.rule} · ${f.msg}`)
  console.log(`check-motion: ${files} hojas, ${components} componentes, ${motion.gate.rules.length} reglas, ${fails.length} fallos`)
  process.exit(fails.length ? 1 : 0)
}
