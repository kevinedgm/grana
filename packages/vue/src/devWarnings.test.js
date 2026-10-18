// Avisos de desarrollo (#636, api.md «Avisos de desarrollo»): todo aviso vive dentro de la guarda canónica,
//   try { if (process.env.NODE_ENV !== 'production' …) … } catch {}
// escrita en el sitio donde vive el texto, sin constantes ni funciones intermedias. Esta prueba lee el código
// fuente y comprueba la forma; lo que pasa en los empaquetadores lo mide `design/lab/avisos-dev/verificar.mjs`.
// #653: el `if` no lleva `else` (1) y no hay guardas en el código que corre por cuadro, por evento continuo o por
// medida del observador (4) (aquí: dentro de una función que se registra en `observeRow`, `ResizeObserver`,
// `requestAnimationFrame` o un escuchador de `scroll`/`pointermove`/`wheel`…, la comprobación es léxica).
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

const HOT_CALLS = new Set(['observeRow', 'requestAnimationFrame', 'raf', 'ResizeObserver'])
const HOT_EVENTS = new Set(['scroll', 'pointermove', 'mousemove', 'touchmove', 'wheel', 'resize'])
const isFn = (n) => n && /^(FunctionDeclaration|FunctionExpression|ArrowFunctionExpression)$/.test(n.type)
const calleeName = (c) => (c.type === 'Identifier' ? c.name : c.type === 'MemberExpression' && !c.computed ? c.property.name : null)
const newProblems = () => ({ forms: [], unguardedWarn: [], unguardedCall: [], prefix: [], badEnv: [], withElse: [], hotGuard: [] })

/** Analiza un bloque de código (JS o el script de un .vue) y deja los problemas en `problems`; `file` solo rotula. */
function scanBlock(b, file, problems) {
  const where = (n) => `${file}:${b.code.slice(0, b.start + n.start).split('\n').length}`
  if (/typeof process|import\.meta\.env|\bisDev\b/.test(b.content.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, ''))) problems.forms.push(file)
  const ast = babelParse(b.content, { sourceType: 'module', plugins: ['jsx'] })
  // ayudantes del archivo: funciones de aviso (warn…, once, twice) con console.warn en su cuerpo
  const helpers = new Set(GLOBAL_HELPERS)
  const named = new Map()
  walk(ast.program, (n) => {
    let name = null, fn = null
    if (n.type === 'FunctionDeclaration' && n.id) { name = n.id.name; fn = n }
    else if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && n.init && /FunctionExpression$/.test(n.init.type)) { name = n.id.name; fn = n.init }
    if (!name) return
    named.set(name, fn)
    let w = false
    walk(fn.body, (x) => { if (isConsoleWarn(x)) w = true })
    if (w && /warn|once|twice/i.test(name)) helpers.add(name)
  })
  // funciones calientes (4): lo que se registra en un observador de tamaño, un cuadro de animación o un evento continuo
  const hot = new Set()
  const addHot = (arg) => { const fn = isFn(arg) ? arg : arg && arg.type === 'Identifier' ? named.get(arg.name) : null; if (fn) hot.add(fn) }
  walk(ast.program, (n) => {
    if (n.type !== 'CallExpression' && n.type !== 'NewExpression') return
    const name = calleeName(n.callee)
    if (HOT_CALLS.has(name)) n.arguments.forEach(addHot)
    else if (name === 'addEventListener' && n.arguments[0] && n.arguments[0].type === 'StringLiteral' && HOT_EVENTS.has(n.arguments[0].value)) addHot(n.arguments[1])
  })
  for (const fn of hot) {
    walk(fn.body, (n) => { if (n.type === 'IfStatement' && isG(leftmost(n.test))) problems.hotGuard.push(where(n)) })
  }
  walk(ast.program, (n, anc) => {
    if (isNodeEnv(n)) {
      const p = anc[anc.length - 1]
      if (!isG(p)) { problems.badEnv.push(where(n)); return }
      // G solo como cabeza de la prueba de un if canónico
      let i = anc.length - 2
      while (i >= 0 && anc[i].type === 'LogicalExpression' && anc[i].operator === '&&' && leftmost(anc[i]) === p) i--
      const ifNode = anc[i]
      if (!ifNode || ifNode.type !== 'IfStatement' || leftmost(ifNode.test) !== p || !canonicalIf(ifNode, anc.slice(0, i))) problems.badEnv.push(where(n))
      else if (ifNode.alternate) problems.withElse.push(where(ifNode)) // (1) sin `else` ni `else if`
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

const problems = newProblems()
for (const file of files) for (const b of blocks(file)) scanBlock(b, relative(SRC, file), problems)
/** Analiza un fragmento de código suelto (para comprobar que las reglas de arriba de verdad fallan). */
const scanText = (code) => { const p = newProblems(); scanBlock({ code, content: code, start: 0 }, 'muestra', p); return p }

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
  it('el if de la guarda no lleva else ni else if (#653 (1))', () => {
    expect(problems.withElse).toEqual([])
  })
  it('ninguna guarda en lo que corre por medida del observador, por cuadro o por evento continuo (#653 (4))', () => {
    expect(problems.hotGuard).toEqual([])
  })
})

describe('el vigilante rechaza lo que debe rechazar (comprobación de las propias reglas)', () => {
  const ok = "try { if (process.env.NODE_ENV !== 'production') console.warn('[Grana X] a') } catch {}"
  it('la forma canónica sin else pasa', () => {
    const p = scanText(ok)
    for (const k of Object.keys(p)) expect(p[k], k).toEqual([])
  })
  it('un else después del if canónico falla', () => {
    const p = scanText("try { if (process.env.NODE_ENV !== 'production') console.warn('[Grana X] a'); else x() } catch {}")
    expect(p.withElse).toHaveLength(1)
  })
  it('un else if después del if canónico falla', () => {
    const p = scanText("try { if (process.env.NODE_ENV !== 'production') console.warn('[Grana X] a'); else if (y) x() } catch {}")
    expect(p.withElse).toHaveLength(1)
  })
  it('un else con bloque también falla', () => {
    const p = scanText("try { if (process.env.NODE_ENV !== 'production' && z) { console.warn('[Grana X] a') } else { x() } } catch {}")
    expect(p.withElse).toHaveLength(1)
  })
  it('una guarda dentro de la función que registra observeRow, un ResizeObserver, requestAnimationFrame o un scroll falla', () => {
    for (const code of [
      `function run(w) { ${ok} }\nobserveRow(el, run)`,
      `observeRow(el, (w) => { ${ok} })`,
      `const ro = new ResizeObserver(() => { ${ok} })`,
      `requestAnimationFrame(() => { ${ok} })`,
      `el.addEventListener('scroll', () => { ${ok} }, { passive: true })`,
      `const onWheel = () => { items.forEach(() => { ${ok} }) }\nel.addEventListener('wheel', onWheel)`
    ]) expect(scanText(code).hotGuard, code).toHaveLength(1)
  })
  it('la misma guarda fuera de esas funciones, o en un evento puntual, pasa', () => {
    for (const code of [
      `function check() { ${ok} }\nobserveRow(el, () => {})`,
      `onMounted(() => { ${ok} })`,
      `el.addEventListener('click', () => { ${ok} })`
    ]) expect(scanText(code).hotGuard, code).toEqual([])
  })
})
