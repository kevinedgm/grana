#!/usr/bin/env node
// Comprueba que cada ejemplo ```vue / ```html de los README que usa identificadores sin declarar
// (o un slot suelto, sin componente que lo reciba) lleve la marca
// `<!-- Fragmento: `x` es de tu aplicación -->`: un ejemplo no montable debe decirlo.
// Cubre el <template> y el <script setup> del bloque. Sale con código 1 si hay pendientes.
// Uso: node scripts/check-readme-fragments.mjs [--verbose]
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const KW = new Set((
  'true false null undefined NaN Infinity this typeof in of new instanceof void delete if else return for while do ' +
  'switch case default break continue try catch finally throw const let var function async await class extends ' +
  'import export from as yield with static get set ' +
  'Math Number String Array Object Date JSON console window document Intl Boolean Promise parseInt parseFloat ' +
  'isNaN isFinite setTimeout clearTimeout setInterval clearInterval requestAnimationFrame navigator crypto URL ' +
  'FormData File Blob Set Map WeakMap RegExp Error Symbol globalThis structuredClone fetch AbortController ' +
  'Event CustomEvent localStorage sessionStorage defineProps defineEmits defineExpose defineOptions defineSlots defineModel withDefaults'
).split(' '))
const ID = '[\\p{L}_$][\\p{L}\\p{N}_$]*'

// Sustituye cadenas y comentarios por vacíos para no leer su contenido como código.
function strip(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:\\])\/\/[^\n]*/g, '$1')
    .replace(/'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"/g, '""')
    .replace(/`(?:\\.|[^`\\])*`/g, (t) => {
      // Conserva las expresiones ${…} de las plantillas de texto: también usan identificadores.
      const parts = [...t.matchAll(/\$\{([^}]*)\}/g)].map((m) => ` ${m[1]} `)
      return '""' + parts.join('')
    })
}

// Nombres que introduce un patrón de desestructuración o una lista de parámetros: `{ a, b: c = 1, ...r }`, `[x, y]`, `a, b = 2`.
function patternNames(p) {
  const names = []
  let depthDefault = 0
  let skipDefault = false
  let token = ''
  const flush = () => { if (token && !KW.has(token)) names.push(token); token = '' }
  const chars = [...p]
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i]
    if (/[\p{L}\p{N}_$]/u.test(c)) { if (!skipDefault) token += c; continue }
    if (c === ':' && !skipDefault) { token = ''; continue } // clave: se queda el alias que sigue
    if (c === '=' && !skipDefault) { flush(); skipDefault = true; depthDefault = 0; continue }
    if (skipDefault) {
      if ('([{'.includes(c)) depthDefault++
      else if (')]}'.includes(c)) { if (depthDefault === 0) skipDefault = false; else depthDefault-- }
      else if (c === ',' && depthDefault === 0) skipDefault = false
      continue
    }
    flush()
  }
  flush()
  return names
}

// Declaraciones de un <script>: const/let/var (con coma y desestructuración), function, class, import, parámetros.
function declaredIn(script) {
  const s = strip(script)
  const declared = new Set()
  for (const m of s.matchAll(/\b(?:const|let|var)\s+/g)) {
    // recorre los declaradores hasta el fin de la sentencia (salto de línea o `;` a profundidad 0)
    let i = m.index + m[0].length
    let depth = 0
    let start = i
    let inInit = false
    const takeDeclarator = (from, to) => {
      const text = s.slice(from, to).trim()
      const head = text.split(/=(?!=|>)/)[0]
      patternNames(head).forEach((n) => declared.add(n))
    }
    for (; i < s.length; i++) {
      const c = s[i]
      if ('([{'.includes(c)) depth++
      else if (')]}'.includes(c)) { if (depth === 0) break; depth-- }
      else if (c === ',' && depth === 0) { takeDeclarator(start, i); start = i + 1; inInit = false }
      else if (c === '=' && depth === 0 && s[i + 1] !== '>' && s[i - 1] !== '=') inInit = true
      else if ((c === ';' || c === '\n') && depth === 0) {
        // una continuación (`,` al final, o `+`, `?`, `.` al empezar la línea siguiente) sigue el declarador
        const rest = s.slice(i + 1).match(/^\s*(\S)/)
        const prev = s.slice(start, i).trimEnd().slice(-1)
        if (c === ';' || !(prev === ',' || prev === '=' || (rest && /[.?+\-*/&|:,]/.test(rest[1])))) break
      }
    }
    void inInit
    takeDeclarator(start, i)
  }
  for (const m of s.matchAll(new RegExp(`\\b(?:function\\*?|class)\\s+(${ID})`, 'gu'))) declared.add(m[1])
  for (const m of s.matchAll(/\bimport\s+([^;\n]*?)\s+from\b/g)) {
    for (const n of patternNames(m[1].replace(/\*\s*as/g, '').replace(/\bas\s+/g, ': ').replace(/[{}]/g, ',').replace(/\btype\s+/g, ''))) declared.add(n)
  }
  // parámetros de funciones y flechas: `function f(a, {b})`, `(a, b) =>`, `a =>`
  for (const m of s.matchAll(/\bfunction\*?\s*[\p{L}\p{N}_$]*\s*\(([^()]*(?:\([^()]*\)[^()]*)*)\)/gu)) patternNames(m[1]).forEach((n) => declared.add(n))
  for (const m of s.matchAll(/\(([^()]*(?:\([^()]*\)[^()]*)*)\)\s*=>/g)) patternNames(m[1]).forEach((n) => declared.add(n))
  for (const m of s.matchAll(new RegExp(`(?<![\\p{L}\\p{N}_$.])(${ID})\\s*=>`, 'gu'))) declared.add(m[1])
  for (const m of s.matchAll(/\bcatch\s*\(\s*([\p{L}_$][\p{L}\p{N}_$]*)/gu)) declared.add(m[1])
  return declared
}

// Identificadores libres (raíz de una expresión, sin `.x`, sin clave de objeto) de un trozo de JS/expresión.
function freeIdents(expr) {
  const s = strip(expr)
  const out = new Set()
  const local = declaredIn(s) // flechas y parámetros dentro de la propia expresión
  for (const m of s.matchAll(new RegExp(`(?<![\\p{L}\\p{N}_$.])(${ID})`, 'gu'))) {
    const id = m[1]
    if (KW.has(id) || id.startsWith('$')) continue
    const before = s.slice(0, m.index)
    const after = s.slice(m.index + id.length)
    if (/\?\.\s*$/.test(before)) continue
    if (/^\s*:(?!:)/.test(after) && /[{,]\s*$/.test(before)) continue // clave de objeto
    if (/^\s*\(/.test(after) && /(?:^|[{,]\s*)(?:async\s+|get\s+|set\s+)?$/.test(before.slice(-12)) && /[{,]\s*$/.test(before) && /\)\s*\{/.test(after)) continue // método de objeto
    if (/^\d/.test(id)) continue
    out.add(id)
  }
  return [...out].filter((x) => !local.has(x))
}

// Analiza un bloque ```vue / ```html. Devuelve { free, orphanSlot }.
export function analyze(code) {
  const declared = new Set()
  const used = new Set()
  const scripts = [...code.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1])
  for (const sc of scripts) {
    declaredIn(sc).forEach((n) => declared.add(n))
  }
  for (const sc of scripts) {
    // Uso en el script: raíces libres que no se declaran en ningún sitio del bloque.
    for (const id of freeIdents(sc)) used.add(id)
  }
  const tpl = code.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<!--[\s\S]*?-->/g, '')
  for (const m of tpl.matchAll(/v-for="\s*\(?([^")]*?)\)?\s+(?:in|of)\s+([^"]*)"/g)) {
    patternNames(m[1]).forEach((n) => declared.add(n))
    freeIdents(m[2]).forEach((x) => used.add(x))
  }
  for (const m of tpl.matchAll(/(?:#[\w.:\-[\]]+|v-slot(?::[\w.\-]+)?|slot-scope)="([^"]*)"/g)) patternNames(m[1]).forEach((n) => declared.add(n))
  for (const m of tpl.matchAll(/\s(?:v-(?!for\b|slot\b)[\w:.\-[\]]*|[:@][\w:.\-[\]]+)="([^"]*)"/g)) freeIdents(m[1]).forEach((x) => used.add(x))
  for (const m of tpl.matchAll(/\{\{([\s\S]*?)\}\}/g)) freeIdents(m[1]).forEach((x) => used.add(x))

  // Slot suelto: <template #x> sin elemento que lo contenga (no hay componente que lo reciba).
  let orphanSlot = false
  const stack = []
  for (const m of tpl.matchAll(/<(\/?)([A-Za-z][\w\-.]*)([^>]*?)(\/?)>/g)) {
    const [, close, tag, attrs, self] = m
    if (self || /^(br|hr|img|input|meta|link)$/i.test(tag)) continue
    if (close) { stack.pop(); continue }
    if (tag === 'template' && /^\s*(#|v-slot)/.test(attrs) && stack.length === 0) orphanSlot = true
    stack.push(tag)
  }
  return { free: [...used].filter((x) => !declared.has(x)).sort(), orphanSlot }
}

// Bloques de un README con su línea y si llevan la marca.
export function blocksOf(md) {
  const out = []
  for (const m of md.matchAll(/```(vue|html)\n([\s\S]*?)```/g)) {
    out.push({ lang: m[1], code: m[2], line: md.slice(0, m.index).split('\n').length, marked: /Fragmento:/.test(m[2]) })
  }
  return out
}

function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'components')
  const verbose = process.argv.includes('--verbose')
  let total = 0
  let marked = 0
  const pending = []
  for (const d of readdirSync(root).sort()) {
    const f = join(root, d, 'README.md')
    if (!existsSync(f)) continue
    for (const b of blocksOf(readFileSync(f, 'utf8'))) {
      total++
      const r = analyze(b.code)
      const loose = r.free.length > 0 || r.orphanSlot
      if (b.marked) { marked++; continue }
      if (loose) pending.push({ file: `${d}/README.md`, line: b.line, ...r })
      else if (verbose) console.log(`ok  ${d}/README.md:${b.line}`)
    }
  }
  console.log(`README: ${total} ejemplos vue/html, ${marked} marcados como fragmento.`)
  if (!pending.length) { console.log('Todos los ejemplos montan solos o llevan la marca de fragmento.'); return }
  console.error(`\n${pending.length} ejemplo(s) usan nombres sin declarar o un slot suelto y no llevan la marca:`)
  for (const p of pending) {
    console.error(`  ${p.file}:${p.line}  ${p.free.map((x) => `\`${x}\``).join(', ')}${p.orphanSlot ? ' [slot suelto]' : ''}`)
  }
  console.error('\nAñade «<!-- Fragmento: `x` es de tu aplicación -->» al bloque, o declara los nombres en un <script setup>.')
  process.exitCode = 1
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main()
