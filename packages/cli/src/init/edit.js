// Edición por texto y diff unificado (LCS propio, §13) con formas estrictas (cli-init.md §5.4, #1001). Sin parser: si una regla no se cumple con exactitud,

export const eolOf = (text) => (text.includes('\r\n') ? '\r\n' : '\n')
const IMPORT_RE = /^import(\s[^;'"]*?)?(['"])([^'"\r\n]+)\2[^\S\r\n]*(;?)/gm

export const importsOf = (text) => {
  const list = []
  for (const m of text.matchAll(IMPORT_RE)) {
    list.push({ clause: (m[1] ?? '').trim(), quote: m[2], spec: m[3], semi: m[4], start: m.index, end: m.index + m[0].length })
  }
  return list
}
const count = (text, re) => [...text.matchAll(re)].length
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
export const defaultImport = (imports, spec) => {
  for (const i of imports) {
    if (i.spec !== spec) continue
    const m = /^([A-Za-z_$][\w$]*)\s*(?:,|from\b)/.exec(i.clause)
    if (m && m[1] !== 'type') return m[1]
  }
  return null
}
const importedNames = (imports) => imports.flatMap((i) => i.clause.replace(/\bfrom\s*$/, '').match(/[A-Za-z_$][\w$]*/g) ?? []).filter((w) => w !== 'from' && w !== 'as' && w !== 'type')

const insertImports = (text, imports, lines) => {
  if (!lines.length) return { text }
  const eol = eolOf(text)
  if (!imports.length) return { text: lines.join(eol) + eol + (text.length && !/^\r?\n/.test(text) ? eol : '') + text }
  const last = imports[imports.length - 1]
  const nl = text.indexOf('\n', last.end)
  const rest = text.slice(last.end, nl === -1 ? text.length : nl).replace(/\r$/, '')
  if (rest.trim() && !/^\s*\/\//.test(rest)) return { error: 'la última importación comparte línea con otro código' }
  if (nl === -1) return { text: text + eol + lines.join(eol) + eol }
  return { text: text.slice(0, nl + 1) + lines.join(eol) + eol + text.slice(nl + 1) }
}
const styleOf = (imports) => {
  const last = imports[imports.length - 1]
  return last ? { q: last.quote, s: last.semi } : { q: "'", s: '' }
}
const balanced = (text, open) => {
  let depth = 0
  for (let k = open; k < text.length; k++) {
    if (text[k] === '(') depth++
    else if (text[k] === ')' && --depth === 0) return k + 1
  }
  return -1
}

export const editEntry = (text, want) => {
  const imports = importsOf(text)
  const { q, s } = styleOf(imports)
  const imp = (spec, clause = '') => `import ${clause ? `${clause} from ` : ''}${q}${spec}${q}${s}`
  const lines = []
  if (want.style) lines.push(imp('@grana/vue/style.css'))
  if (want.fonts) lines.push(imp('@grana/vue/fonts.css'))
  if (want.theme) lines.push(imp(want.theme))
  let use
  let next = text
  if (want.global) {
    let name = defaultImport(imports, '@grana/vue')
    if (!name) {
      name = importedNames(imports).includes('Grana') ? 'GranaPlugin' : 'Grana'
      lines.push(imp('@grana/vue', name))
    }
    use = `.use(${name})`
    if (!text.includes(`.use(${name}`)) {
      const reg = registerGlobal(text, name)
      if (reg.error) return { error: reg.error, lines, use }
      next = reg.text
    }
  }
  const ins = insertImports(next, importsOf(next), lines)
  if (ins.error) return { error: ins.error, lines, use }
  return { text: ins.text, lines, use }
}

const registerGlobal = (text, name) => {
  const eol = eolOf(text)
  const opens = [...text.matchAll(/createApp\(/g)]
  if (opens.length !== 1) return { error: opens.length ? 'hay varias llamadas a createApp(' : 'no hay createApp( (¿createSSRApp o montaje en otra parte?)' }
  const at = opens[0].index
  const lineStart = text.lastIndexOf('\n', at) + 1
  const before = text.slice(lineStart, at)
  if (before === '') {
    let k = balanced(text, at + 'createApp'.length)
    while (k > 0 && text.startsWith('.use(', k)) k = balanced(text, k + 4)
    if (k > 0 && text.startsWith('.mount(', k) && count(text, /\.mount\(/g) === 1) return { text: text.slice(0, k) + `.use(${name})` + text.slice(k) }
    return { error: 'createApp(…) no termina en .mount(' }
  }
  const m = /^(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*$/.exec(before)
  if (!m) return { error: 'forma de createApp( no reconocida' }
  const app = m[1]
  const mounts = [...text.matchAll(new RegExp(`^${esc(app)}\\.mount\\(`, 'gm'))]
  if (mounts.length !== 1 || mounts[0].index < at || count(text, /\.mount\(/g) !== 1) return { error: `no hay exactamente una línea que empiece por ${app}.mount( después de createApp(` }
  const mountLine = text.slice(mounts[0].index, (text.indexOf('\n', mounts[0].index) + 1 || text.length + 1) - 1).replace(/\r$/, '')
  const semi = mountLine.trimEnd().endsWith(';') ? ';' : ''
  return { text: text.slice(0, mounts[0].index) + `${app}.use(${name})${semi}${eol}` + text.slice(mounts[0].index) }
}

const freeName = (text, base, alt) => (new RegExp(`(?<![\\w$@/.'"-])${base}(?![\\w$/'"-])`).test(text) ? alt : base)

export const editViteConfig = (text) => {
  const eol = eolOf(text)
  const imports = importsOf(text)
  const { q, s } = styleOf(imports)
  const name = freeName(text, 'grana', 'granaTheme')
  const lines = [`import ${name} from ${q}@grana/cli/vite${q}${s}`]
  const call = `${name}()`
  const fail = (error) => ({ error, lines, call })
  if (/\bmergeConfig\b/.test(text)) return fail('usa mergeConfig')
  if (/defineConfig\(\s*(?!\{)/.test(text)) return fail('defineConfig recibe una función o una variable')
  const roots = count(text, /export\s+default\s+(?:defineConfig\(\s*)?\{/g)
  if (roots !== 1) return fail('no hay un único export default defineConfig({ o export default {')
  let next
  const pluginKeys = count(text, /\bplugins\s*:/g)
  const lists = [...text.matchAll(/\bplugins\s*:\s*\[/g)]
  if (pluginKeys > 1 || lists.length > 1) return fail('hay varias apariciones de plugins:')
  if (pluginKeys === 1 && lists.length !== 1) return fail('plugins no es una lista escrita ([…])')
  if (lists.length === 1) {
    const open = lists[0].index + lists[0][0].length
    const nl = text.indexOf('\n', open)
    const restOfLine = text.slice(open, nl === -1 ? text.length : nl).replace(/\r$/, '')
    if (restOfLine.trim()) {
      const empty = /^\s*\]/.test(restOfLine)
      next = text.slice(0, open) + (empty ? call : `${call}, `) + text.slice(open).replace(/^[^\S\r\n]+/, '')
    } else {
      const after = text.slice(nl + 1)
      const m = /^([^\S\r\n]*)(\S)/.exec(after)
      if (!m || m[2] === ']') return fail('lista de plugins vacía en varias líneas')
      next = text.slice(0, nl + 1) + `${m[1]}${call},${eol}` + after
    }
  } else {
    const m = /export\s+default\s+(?:defineConfig\(\s*)?\{[^\S\r\n]*\r?\n/.exec(text)
    if (!m) return fail('la apertura no termina la línea')
    const at = m.index + m[0].length
    const lineStart = text.lastIndexOf('\n', m.index) + 1
    const nextIndent = /^([^\S\r\n]*)\S/.exec(text.slice(at))
    const indent = nextIndent && !/^\s*[})]/.test(text.slice(at)) ? nextIndent[1] : `${/^[^\S\r\n]*/.exec(text.slice(lineStart))[0]}  `
    next = text.slice(0, at) + `${indent}plugins: [${call}],${eol}` + text.slice(at)
  }
  const ins = insertImports(next, importsOf(next), lines)
  if (ins.error) return fail(ins.error)
  return { text: ins.text, lines, call }
}

export const jsonStyle = (text) => ({ indent: /^[{[][^\S\r\n]*\r?\n([ \t]+)\S/.exec(text)?.[1] ?? '  ', eol: eolOf(text), final: /\n$/.test(text) })
export const writeJson = (obj, { indent, eol, final }) => JSON.stringify(obj, null, indent).replace(/\n/g, eol) + (final ? eol : '')


const split = (s) => (s === '' ? [] : s.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n'))

export const unifiedDiff = (before, after, path, context = 3) => {
  const a = split(before ?? '')
  const b = split(after)
  const n = a.length
  const m = b.length
  const L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1))
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1])
  const ops = []
  let i = 0
  let j = 0
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) ops.push([' ', a[i], i++, j++])
    else if (j < m && (i === n || L[i][j + 1] >= L[i + 1][j])) ops.push(['+', b[j], i, j++])
    else ops.push(['-', a[i], i++, j])
  }
  const out = [`--- ${before === null ? '/dev/null' : `a/${path}`}`, `+++ b/${path}`]
  let k = 0
  while (k < ops.length) {
    if (ops[k][0] === ' ') { k++; continue }
    let start = Math.max(0, k - context)
    let end = k
    while (end < ops.length) {
      if (ops[end][0] !== ' ') { end++; continue }
      let run = 0
      while (end + run < ops.length && ops[end + run][0] === ' ') run++
      if (end + run >= ops.length || run > context * 2) { end = Math.min(ops.length, end + context); break }
      end += run
    }
    const hunk = ops.slice(start, end)
    const aStart = hunk[0][2]
    const bStart = hunk[0][3]
    const aLen = hunk.filter((o) => o[0] !== '+').length
    const bLen = hunk.filter((o) => o[0] !== '-').length
    out.push(`@@ -${aLen ? aStart + 1 : aStart},${aLen} +${bLen ? bStart + 1 : bStart},${bLen} @@`)
    for (const [t, line] of hunk) out.push(`${t}${line}`)
    k = end
  }
  return `${out.join('\n')}\n`
}
