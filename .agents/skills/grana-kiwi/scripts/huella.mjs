#!/usr/bin/env node
// Huella genérica de una ronda de kiwi (adaptado de check-slop.js de kiwi-art-director).
// Uso: node .agents/skills/grana-kiwi/scripts/huella.mjs design/lab/<nombre>/rNN [--json]
// Revisa .html, .css, .js y .mjs de la carpeta (sin node_modules) y separa:
//   reglas  → cualquier aparición falla (reglas de Grana que no se rompen);
//   señales → patrón genérico; dos o más señales distintas fallan.
// Es un apoyo: no sustituye la lectura de direccion-creativa.md §6 ni la observación del prototipo.
// Las líneas con «huella-ok» se ignoran (para citar un patrón a propósito, p. ej. en una comparativa).

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, extname, relative } from 'node:path'

const EXT = new Set(['.html', '.css', '.js', '.mjs'])
const SKIP = new Set(['node_modules', 'dist', '.git'])
// Guiones de verificación: citan patrones para comprobarlos, no los usan.
const SKIP_FILE = /(^|\/)(verificar|auditoria-verificar|serve)\.mjs$/

const REGLAS = [
  {
    id: 'iconos',
    label: 'Icono que no es Lucide (glifo o familia ajena; docs/contract/icons.md)',
    re: [
      /[✓✔✕✖▲▼▾▸●★⚠]/u,
      /class(Name)?=["'][^"']*\b(fa[srlbd]?|fa-[a-z-]+|ph-[a-z-]+|ti-[a-z-]+|ri-[a-z-]+)(?=["'\s])/,
      /font-?awesome|material-(icons|symbols)|heroicons|@phosphor-icons|tabler-icons|remixicon/i,
    ],
  },
  {
    id: 'relleno',
    label: 'Contenido de relleno (Lorem, «Your text here», John/Jane Doe, «Opción 1»)',
    re: [/lorem ipsum/i, /your text here/i, /\b(john|jane) doe\b/i, /\b(opción|option|item|elemento) [123]\b/i],
  },
]

const SENALES = [
  {
    // Señal y no regla: el kit gris de la base no tiene tema; en los conceptos, sí es un error.
    id: 'curva-literal',
    label: 'Curva literal en vez de --g-ease-* (cubic-bezier)',
    re: [/cubic-bezier\(/],
  },
  {
    id: 'transition-all',
    label: 'transition: all',
    re: [/transition(-property)?\s*:\s*all\b/],
  },
  {
    id: 'curva-generica',
    // linear queda fuera: es legítimo en visibility 0s y en fundidos de opacidad.
    label: 'ease-in-out como curva de transición',
    re: [/transition[^;{}]*\bease-in-out\b/],
  },
  {
    id: 'hover-scale',
    label: 'Escala de relleno al hover (scale 1.02–1.05)',
    re: [/scale\(\s*1\.0[2-5]\s*\)/],
  },
  {
    id: 'sombra-generica',
    label: 'Sombra genérica de baja opacidad',
    re: [/rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0?\.1\s*\)/, /\bshadow-(sm|md)\b/],
  },
  {
    id: 'fuente-literal',
    label: 'font-family literal en vez de --g-font-*',
    re: [/font-family\s*:\s*(?!var\(--g-font|inherit|ui-monospace|monospace)["']?[A-Za-z]/],
  },
]

function files(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) out.push(...files(p))
    else if (EXT.has(extname(name)) && !SKIP_FILE.test(p)) out.push(p)
  }
  return out
}

function scan(paths, groups) {
  const hits = new Map()
  for (const p of paths) {
    const lines = readFileSync(p, 'utf8').split('\n')
    lines.forEach((line, i) => {
      if (line.includes('huella-ok')) return
      for (const g of groups) {
        if (g.re.some((r) => r.test(line))) {
          if (!hits.has(g.id)) hits.set(g.id, { label: g.label, where: [] })
          hits.get(g.id).where.push(`${p}:${i + 1}`)
        }
      }
    })
  }
  return hits
}

const args = process.argv.slice(2)
const dir = args.find((a) => !a.startsWith('--'))
if (!dir) {
  console.error('Uso: node .agents/skills/grana-kiwi/scripts/huella.mjs design/lab/<nombre>/rNN [--json]')
  process.exit(2)
}
const paths = files(dir)
const reglas = scan(paths, REGLAS)
const senales = scan(paths, SENALES)
const falla = reglas.size > 0 || senales.size >= 2

if (args.includes('--json')) {
  console.log(JSON.stringify({ dir, archivos: paths.length, reglas: Object.fromEntries(reglas), senales: Object.fromEntries(senales), falla }, null, 2))
} else {
  const show = (title, m) => {
    console.log(`${title}: ${m.size}`)
    for (const { label, where } of m.values()) {
      console.log(`  · ${label} (${where.length})`)
      for (const w of where.slice(0, 5)) console.log(`      ${relative(process.cwd(), w)}`)
      if (where.length > 5) console.log(`      … y ${where.length - 5} más`)
    }
  }
  console.log(`Huella genérica · ${dir} · ${paths.length} archivos`)
  show('Reglas rotas (cualquiera falla)', reglas)
  show('Señales genéricas (dos o más fallan)', senales)
  console.log(falla ? 'Resultado: REPARAR antes de entregar' : 'Resultado: sin huella genérica automática (falta la lectura de §6)')
}
process.exit(falla ? 1 : 0)
