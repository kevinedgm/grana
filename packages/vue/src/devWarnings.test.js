// Avisos de desarrollo (#636, api.md «Avisos de desarrollo»): todo aviso vive dentro de la guarda canónica,
//   try { if (process.env.NODE_ENV !== 'production' …) … } catch {}
// escrita en el sitio donde vive el texto, sin constantes ni funciones intermedias. Esta prueba lee el código
// fuente y comprueba la forma; lo que pasa en los empaquetadores lo mide `design/lab/avisos-dev/verificar.mjs`.
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { parse as parseSfc, babelParse } from 'vue/compiler-sfc'

const SRC = join(process.cwd(), 'src')
const files = readdirSync(SRC, { recursive: true })
  .filter((f) => /\.(js|vue)$/.test(f) && !/\.test\.js$/.test(f))
  .map((f) => join(SRC, f))

function blocks(file) {
  const code = readFileSync(file, 'utf8')
  if (!file.endsWith('.vue')) return [{ code, content: code, start: 0 }]
  const { descriptor } = parseSfc(code, { filename: file })
  return [descriptor.script, descriptor.scriptSetup].filter(Boolean).map((b) => ({ code, content: b.content, start: b.loc.start.offset }))
}

function walk(node, fn, anc = []) {
  if (!node || typeof node.type !== 'string') return
  fn(node, anc)
  const next = [...anc, node]
  for (const k of Object.keys(node)) {
    if (k === 'loc' || k === 'leadingComments' || k === 'trailingComments' || k === 'innerComments' || k === 'extra') continue
    const v = node[k]
    if (Array.isArray(v)) v.forEach((c) => c && typeof c.type === 'string' && walk(c, fn, next))
    else if (v && typeof v.type === 'string') walk(v, fn, next)
  }
}

const isNodeEnv = (n) => n.type === 'MemberExpression' && !n.computed && n.property.name === 'NODE_ENV' &&
  n.object.type === 'MemberExpression' && n.object.property.name === 'env' && n.object.object.type === 'Identifier' && n.object.object.name === 'process'
const isG = (n) => n && n.type === 'BinaryExpression' && n.operator === '!==' && isNodeEnv(n.left) && n.right.type === 'StringLiteral' && n.right.value === 'production'
const leftmost = (n) => (n.type === 'LogicalExpression' && n.operator === '&&' ? leftmost(n.left) : n)
// if canónico: su prueba empieza por G y es la única sentencia del bloque de un try con `catch {}` vacío
const canonicalIf = (ifNode, anc) => {
  if (ifNode.type !== 'IfStatement' || !isG(leftmost(ifNode.test))) return false
  const block = anc[anc.length - 1]
  const tryNode = anc[anc.length - 2]
  return block && block.type === 'BlockStatement' && block.body.length === 1 && tryNode && tryNode.type === 'TryStatement' &&
    tryNode.block === block && tryNode.handler && !tryNode.handler.param && tryNode.handler.body.body.length === 0 && !tryNode.finalizer
}
const guarded = (anc, node) => {
  const chain = [...anc, node]
  return chain.some((a, i) => i < chain.length - 1 && a.type === 'IfStatement' && chain[i + 1] === a.consequent && canonicalIf(a, chain.slice(0, i)))
}
const isConsoleWarn = (n) => n.type === 'CallExpression' && n.callee.type === 'MemberExpression' && n.callee.object.name === 'console' && n.callee.property.name === 'warn'
const GLOBAL_HELPERS = new Set(['warn', 'warnOnce', 'warnMissingCategory', 'warnLoadStart'])
const hasLiteral = (n) => { let f = false; walk(n, (x) => { if (x.type === 'StringLiteral' || x.type === 'TemplateLiteral') f = true }); return f }

const problems = { forms: [], unguardedWarn: [], unguardedCall: [], prefix: [], badEnv: [] }
for (const file of files) {
  for (const b of blocks(file)) {
    const where = (n) => `${relative(SRC, file)}:${b.code.slice(0, b.start + n.start).split('\n').length}`
    if (/typeof process|import\.meta\.env|\bisDev\b/.test(b.content.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, ''))) problems.forms.push(relative(SRC, file))
    const ast = babelParse(b.content, { sourceType: 'module', plugins: ['jsx'] })
    // ayudantes del archivo: funciones de aviso (warn…, once, twice) con console.warn en su cuerpo
    const helpers = new Set(GLOBAL_HELPERS)
    walk(ast.program, (n) => {
      let name = null, fn = null
      if (n.type === 'FunctionDeclaration' && n.id) { name = n.id.name; fn = n }
      else if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && n.init && /FunctionExpression$/.test(n.init.type)) { name = n.id.name; fn = n.init }
      if (!name) return
      let w = false
      walk(fn.body, (x) => { if (isConsoleWarn(x)) w = true })
      if (w && /warn|once|twice/i.test(name)) helpers.add(name)
    })
    walk(ast.program, (n, anc) => {
      if (isNodeEnv(n)) {
        const p = anc[anc.length - 1]
        if (!isG(p)) { problems.badEnv.push(where(n)); return }
        // G solo como cabeza de la prueba de un if canónico
        let i = anc.length - 2
        while (i >= 0 && anc[i].type === 'LogicalExpression' && anc[i].operator === '&&' && leftmost(anc[i]) === p) i--
        const ifNode = anc[i]
        if (!ifNode || ifNode.type !== 'IfStatement' || leftmost(ifNode.test) !== p || !canonicalIf(ifNode, anc.slice(0, i))) problems.badEnv.push(where(n))
        return
      }
      if (isConsoleWarn(n)) { if (!guarded(anc, n)) problems.unguardedWarn.push(where(n)); return }
      if (n.type === 'CallExpression') {
        const c = n.callee
        const name = c.type === 'Identifier' ? c.name : (c.type === 'MemberExpression' && !c.computed && /^warn(Once)?$/.test(c.property.name) ? c.property.name : null)
        if (name && helpers.has(name) && n.arguments.some(hasLiteral) && !guarded(anc, n)) problems.unguardedCall.push(where(n))
        return
      }
      if ((n.type === 'StringLiteral' && n.value.includes('[Grana')) || (n.type === 'TemplateElement' && n.value.raw.includes('[Grana'))) {
        if (guarded(anc, n)) return
        // `const PREFIX = '[Grana …]'` en el nivel del módulo: vale si todas sus lecturas están guardadas
        const decl = anc[anc.length - 1]
        if (decl.type === 'VariableDeclarator' && decl.id.type === 'Identifier') {
          const refs = []
          walk(ast.program, (x, a2) => { if (x.type === 'Identifier' && x.name === decl.id.name && a2[a2.length - 1] !== decl) refs.push([a2, x]) })
          if (refs.length && refs.every(([a2, x]) => guarded(a2, x))) return
        }
        problems.prefix.push(where(n))
      }
    })
  }
}

describe('avisos de desarrollo con la guarda canónica (#636)', () => {
  it('lee el código fuente de la librería', () => {
    expect(files.length).toBeGreaterThan(80)
  })
  it('sin typeof process, import.meta.env ni constantes isDev', () => {
    expect(problems.forms).toEqual([])
  })
  it('process.env.NODE_ENV solo en la forma try { if (process.env.NODE_ENV !== \'production\' …) … } catch {}', () => {
    expect(problems.badEnv).toEqual([])
  })
  it('todo console.warn está dentro de la guarda', () => {
    expect(problems.unguardedWarn).toEqual([])
  })
  it('toda llamada a un ayudante de aviso con texto lleva la guarda en el sitio de la llamada', () => {
    expect(problems.unguardedCall).toEqual([])
  })
  it('ningún texto «[Grana» fuera de la guarda', () => {
    expect(problems.prefix).toEqual([])
  })
})
