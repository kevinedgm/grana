// Utilidades puras del generador del sitio: secciones, encabezados y slugs, enlaces,
// ejemplos vivos marcados en los README y tablas de API desde los meta.json.
// Sin dependencias: se prueban con `node --test` (generate.test.mjs).

import path from 'node:path'

/* ------------------------------------------------------------------ líneas y vallas */

const FENCE = /^( {0,3})(`{3,}|~{3,})(.*)$/

/** Recorre las líneas marcando si están dentro de un bloque de código cercado. */
export function scanLines(md) {
  const lines = md.split('\n')
  const out = []
  let open = null // { char, len }
  for (const line of lines) {
    const m = line.match(FENCE)
    if (!open && m) {
      open = { char: m[2][0], len: m[2].length }
      out.push({ line, fence: 'open', info: m[3].trim(), indent: m[1].length })
      continue
    }
    if (open && m && m[2][0] === open.char && m[2].length >= open.len && m[3].trim() === '') {
      open = null
      out.push({ line, fence: 'close' })
      continue
    }
    out.push({ line, fence: open ? 'inside' : null })
  }
  return out
}

/* ------------------------------------------------------------------ texto de encabezados */

/** Texto visible de un encabezado Markdown (sin `**`, sin comillas invertidas, enlaces → texto). */
export function headingText(raw) {
  return raw
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/`+([^`]*)`+/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .trim()
}

/** Slug de GitHub (github-slugger): minúsculas, fuera la puntuación, espacios → guiones. */
export function ghSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, '')
    .replace(/ /g, '-')
}

// Slug de VitePress 1.6 (@mdit-vue/shared), copiado tal cual para que los anclajes coincidan.
const rControl = /[\u0000-\u001f]/g
const rSpecial = /[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g
const rCombining = /[̀-ͯ]/g
export function vpSlug(str) {
  return str
    .normalize('NFKD')
    .replace(rCombining, '')
    .replace(rControl, '')
    .replace(rSpecial, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^(\d)/, '_$1')
    .toLowerCase()
}

/** Crea un asignador de slugs únicos (sufijo -1, -2… como GitHub y markdown-it-anchor). */
export function uniqueSlugger(fn) {
  const used = new Set()
  return (text) => {
    const base = fn(text)
    let slug = base
    let n = 0
    while (used.has(slug)) slug = `${base}-${++n}`
    used.add(slug)
    return slug
  }
}

/** Encabezados fuera de las vallas: [{ level, raw, text, line }]. */
export function parseHeadings(md) {
  const out = []
  scanLines(md).forEach((l, i) => {
    if (l.fence) return
    const m = l.line.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/)
    if (m) out.push({ level: m[1].length, raw: m[2], text: headingText(m[2]), line: i })
  })
  return out
}

/* ------------------------------------------------------------------ secciones */

/** Parte un documento por encabezados de nivel `level`: { preamble, sections: [{ title, text }] }. */
export function splitSections(md, level = 2) {
  const lines = md.split('\n')
  const scan = scanLines(md)
  const sections = []
  let preamble = []
  let current = null
  scan.forEach((l, i) => {
    const m = !l.fence && l.line.match(/^(#{1,6})\s+(.*)$/)
    if (m && m[1].length === level) {
      current = { title: headingText(m[2]), lines: [lines[i]] }
      sections.push(current)
    } else if (m && m[1].length < level) {
      ;(current ? current.lines : preamble).push(lines[i])
    } else {
      ;(current ? current.lines : preamble).push(lines[i])
    }
  })
  return {
    preamble: preamble.join('\n'),
    sections: sections.map((s) => ({ title: s.title, text: s.lines.join('\n').replace(/\s+$/, '') + '\n' }))
  }
}

/** Sube un nivel todos los encabezados (## → #), fuera de las vallas. */
export function promoteHeadings(md) {
  const scan = scanLines(md)
  return scan.map((l) => (!l.fence && /^#{2,6}\s/.test(l.line) ? l.line.slice(1) : l.line)).join('\n')
}

/** Quita el primer encabezado de nivel 1 y lo devuelve aparte. */
export function stripH1(md) {
  const scan = scanLines(md)
  for (let i = 0; i < scan.length; i++) {
    if (scan[i].fence) continue
    const m = scan[i].line.match(/^#\s+(.*)$/)
    if (m) {
      const lines = md.split('\n')
      lines.splice(i, 1)
      return { title: headingText(m[1]), body: lines.join('\n') }
    }
    if (scan[i].line.trim() !== '') break
  }
  return { title: null, body: md }
}

/* ------------------------------------------------------------------ ejemplos vivos */

/**
 * Convención de ejemplo vivo: un bloque cercado de primer nivel (sin sangría) con la
 * información `vue demo`. Se pinta en vivo y se muestra su código, en el mismo sitio.
 * Devuelve segmentos [{ type: 'md', text } | { type: 'demo', code, info }].
 */
export function extractDemos(md) {
  const scan = scanLines(md)
  const segments = []
  let buf = []
  let demo = null
  for (const l of scan) {
    if (!demo && l.fence === 'open' && l.indent === 0 && /^vue\s+demo\b/.test(l.info)) {
      if (buf.length) segments.push({ type: 'md', text: buf.join('\n') })
      buf = []
      demo = { type: 'demo', info: l.info, lines: [] }
      continue
    }
    if (demo) {
      if (l.fence === 'close') {
        segments.push({ type: 'demo', info: demo.info, code: demo.lines.join('\n') })
        demo = null
      } else demo.lines.push(l.line)
      continue
    }
    buf.push(l.line)
  }
  if (demo) throw new Error('Bloque `vue demo` sin cerrar')
  if (buf.length) segments.push({ type: 'md', text: buf.join('\n') })
  return segments
}

/** Convierte el código de un ejemplo en un SFC: si ya es un SFC lo deja; si es plantilla, la envuelve. */
export function demoToSfc(code) {
  if (/^\s*<(template|script)[\s>]/m.test(code)) return code.trim() + '\n'
  return `<template>\n  <div class="grana-demo__flow">\n${code
    .trim()
    .split('\n')
    .map((l) => '    ' + l)
    .join('\n')}\n  </div>\n</template>\n`
}

/* ------------------------------------------------------------------ enlaces */

const LINK = /(!?)\[((?:[^\]\\]|\\.)*)\]\(\s*(<[^>]*>|[^)\s]+)(\s+"[^"]*")?\s*\)/g

/** Aplica `fn` a los fragmentos de texto fuera de vallas y de código en línea. */
export function mapProse(md, fn) {
  const scan = scanLines(md)
  const out = []
  let block = []
  const flush = () => {
    if (!block.length) return
    const text = block.join('\n')
    // protege el código en línea (`…`) con marcadores para no tocarlo
    const codes = []
    const masked = text.replace(/(`+)[\s\S]*?\1/g, (m) => `\u0000${codes.push(m) - 1}\u0000`)
    out.push(fn(masked).replace(/\u0000(\d+)\u0000/g, (_, i) => codes[+i]))
    block = []
  }
  for (const l of scan) {
    if (l.fence) {
      flush()
      out.push(l.line)
    } else block.push(l.line)
  }
  flush()
  return out.join('\n')
}

/**
 * Reescribe los destinos de los enlaces Markdown con `resolve(href)`, que devuelve el nuevo
 * destino o `null` para dejarlo igual.
 */
export function rewriteLinks(md, resolve) {
  return mapProse(md, (text) =>
    text.replace(LINK, (all, bang, label, href, title = '') => {
      const clean = href.startsWith('<') ? href.slice(1, -1) : href
      const next = resolve(clean, { image: !!bang })
      if (next == null) return all
      return `${bang}[${label}](${next}${title})`
    })
  )
}

/** Lista los destinos de enlace de un documento (para pruebas y diagnósticos). */
export function listLinks(md) {
  const found = []
  mapProse(md, (text) => {
    for (const m of text.matchAll(LINK)) found.push(m[3].startsWith('<') ? m[3].slice(1, -1) : m[3])
    return text
  })
  return found
}

/** Separa un destino en ruta y ancla. */
export function splitHref(href) {
  const i = href.indexOf('#')
  return i === -1 ? { file: href, hash: '' } : { file: href.slice(0, i), hash: href.slice(i + 1) }
}

export const isExternal = (href) => /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')

/** Resuelve un destino relativo de un documento del repositorio a una ruta del repositorio. */
export function repoPath(fromFile, file) {
  if (file.startsWith('/')) return file.replace(/^\/+/, '')
  return path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), file)).replace(/^\.\//, '')
}

/* ------------------------------------------------------------------ componentes */

/** GFormSection → form-section; GBtn → btn. */
export function componentSlug(name) {
  return name
    .replace(/^G(?=[A-Z])/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

/** Entrada de importación a partir del campo `entry` (texto libre) del meta.json. */
export function entryOf(meta) {
  const m = String(meta.entry || '').match(/@grana\/vue(\/[a-z-]+)?/)
  return m ? m[0] : '@grana/vue'
}

/* ------------------------------------------------------------------ tablas de API */

/** Celda de tabla segura: `<` y `>` escapados fuera del código en línea; `|` escapado. */
export function cell(value) {
  if (value == null || value === '') return ''
  const text = String(value).replace(/\r?\n/g, ' ')
  return text
    .split(/(`+[^`]*?`+)/g)
    .map((p, i) => (i % 2 ? p : p.replace(/</g, '&lt;').replace(/>/g, '&gt;')))
    .join('')
    .replace(/\|/g, '\\|')
}

const code = (v) => {
  const s = String(v)
  const ticks = s.includes('`') ? '`` ' : '`'
  return ticks + s + (ticks === '`' ? '`' : ' ``')
}

function formatDefault(p) {
  const d = p.resolvedDefault !== undefined ? p.resolvedDefault : p.default
  if (d === undefined || d === null) return ''
  if (typeof d === 'string') return code(d === '' ? "''" : d)
  return code(JSON.stringify(d))
}

function asText(item) {
  if (item == null) return ''
  if (typeof item === 'string') return item
  if (typeof item === 'object') {
    const name = item.name || item.key || ''
    const rest = item.description || item.purpose || item.trigger || item.note || item.returns || item.signature || ''
    const sig = item.signature && item.signature !== rest ? ` ${code(item.signature)}` : ''
    return [name ? code(name) : '', sig, rest ? ` — ${rest}` : ''].join('').trim()
  }
  return String(item)
}

/** Tablas de props, eventos, slots y métodos de uno o varios meta.json. `L` = textos de la interfaz. */
export function apiTables(metas, L) {
  const out = []
  const several = metas.length > 1
  for (const meta of metas) {
    const h = several ? '###' : '###'
    if (several) out.push(`### ${meta.name}`, '', cell(meta.description), '')
    const sub = several ? '####' : h
    // props
    out.push(`${sub} ${L.props}`, '')
    if (meta.props?.length) {
      out.push(`| ${L.prop} | ${L.type} | ${L.values} | ${L.default} | ${L.notes} |`, '| --- | --- | --- | --- | --- |')
      for (const p of meta.props) {
        const values = Array.isArray(p.values) ? p.values.map(code).join(' ') : p.values ? code(p.values) : ''
        const notes = [p.required ? `**${L.required}**` : '', cell(p.description || p.note || '')].filter(Boolean).join('. ')
        out.push(`| ${code(p.name)} | ${cell(p.type)} | ${cell(values)} | ${cell(formatDefault(p))} | ${notes} |`)
      }
    } else out.push(L.none)
    out.push('')
    // eventos
    out.push(`${sub} ${L.events}`, '')
    if (meta.events?.length) {
      out.push(`| ${L.event} | ${L.payload} | ${L.when} |`, '| --- | --- | --- |')
      for (const e of meta.events) {
        if (typeof e === 'string') out.push(`| ${code(e)} | | |`)
        else out.push(`| ${code(e.name)} | ${cell(e.payload ? code(e.payload) : '')} | ${cell(e.trigger)} |`)
      }
    } else out.push(L.none)
    out.push('')
    // slots
    out.push(`${sub} ${L.slots}`, '')
    if (meta.slots?.length) {
      out.push(`| ${L.slot} | ${L.scope} | ${L.content} |`, '| --- | --- | --- |')
      for (const s of meta.slots) {
        if (typeof s === 'string') out.push(`| ${code(s)} | | |`)
        else {
          const scope = s.scope ?? s.props
          const scopeText = scope == null ? '' : typeof scope === 'string' ? code(scope) : code(JSON.stringify(scope))
          out.push(`| ${code(s.name)} | ${cell(scopeText)} | ${cell(s.purpose)} |`)
        }
      }
    } else out.push(L.none)
    out.push('')
    // métodos y lo expuesto
    const methods = [...(meta.methods || []), ...(meta.exposes || []), ...(meta.exposed || [])]
    if (methods.length) {
      out.push(`${sub} ${L.methods}`, '')
      for (const m of methods) out.push(`- ${cell(asText(m)).replace(/\\\|/g, '|')}`)
      out.push('')
    }
  }
  return out.join('\n')
}
