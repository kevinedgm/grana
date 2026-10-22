// Pruebas del generador del sitio (node --test). Corren en `npm test` (workspace @grana/site).
// La principal: todo componente con README genera su página en español y en inglés, aparece en
// la navegación y tiene al menos un ejemplo vivo.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as lib from './lib.mjs'
import { generate, discoverComponents, GUIDE, COMPONENTS_DIR } from './generate.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const result = generate({ root: ROOT, write: false })

test('todo componente con README genera su página en español y en inglés', () => {
  const dirs = fs
    .readdirSync(path.join(ROOT, COMPONENTS_DIR), { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(ROOT, COMPONENTS_DIR, d.name, 'README.md')))
    .map((d) => d.name)
  assert.ok(dirs.length >= 60, `se esperaban los ${dirs.length} README de componentes`)
  for (const dir of dirs) {
    const slug = lib.componentSlug(dir)
    assert.ok(result.files.has(`components/${slug}.md`), `${dir}: falta components/${slug}.md`)
    assert.ok(result.files.has(`en/components/${slug}.md`), `${dir}: falta en/components/${slug}.md`)
  }
  const slugs = dirs.map(lib.componentSlug)
  assert.equal(new Set(slugs).size, slugs.length, 'dos componentes comparten slug')
})

test('cada página de componente está en la navegación lateral (índice del README)', () => {
  for (const locale of ['es', 'en']) {
    assert.deepEqual(result.locales[locale].unlisted, [], `${locale}: componentes fuera del índice del README`)
  }
})

test('cada componente tiene al menos un ejemplo vivo (bloque `vue demo` del README o site/demos/)', () => {
  const missing = result.locales.es.pages.filter((p) => p.component && !p.demoSource).map((p) => p.component.dir)
  assert.deepEqual(missing, [], `sin ejemplo vivo: ${missing.join(', ')}`)
})

test('las carpetas con meta.json sin README se recogen en una página', () => {
  const { orphans, components } = discoverComponents(ROOT)
  // GPageHeader tiene README desde mora-docs (2026-10-14); la lista debe estar vacía.
  // Solo puede crecer si se añade un componente sin prefijo padre con meta.json pero sin README.
  const PENDING_ORPHANS = []
  assert.deepEqual(orphans.sort(), PENDING_ORPHANS, `huérfanos inesperados: ${orphans.filter((o) => !PENDING_ORPHANS.includes(o)).join(', ')}`)

  const tag = components.find((c) => c.dir === 'GTag')
  assert.ok(tag.metas.some((m) => m.name === 'GTagGroup'), 'GTagGroup va en la página de GTag')
})

test('todas las secciones ## del README raíz tienen página', () => {
  const { sections } = lib.splitSections(fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8'), 2)
  const used = GUIDE.flatMap((g) => g.sections || [])
  for (const s of sections) {
    assert.ok(used.some((u) => s.title.startsWith(u)), `la sección «${s.title}» del README no está en ninguna página (site/scripts/generate.mjs, GUIDE)`)
  }
})

test('los enlaces del contenido apuntan al sitio o a GitHub, nunca a un .md relativo', () => {
  for (const [file, text] of result.files) {
    for (const href of lib.listLinks(text)) {
      if (lib.isExternal(href) || href.startsWith('/') || href.startsWith('#')) continue
      assert.fail(`${file}: enlace relativo sin resolver «${href}»`)
    }
  }
  assert.deepEqual(result.warnings.filter((w) => /no existe|no encontrada/.test(w)), [])
})

test('inglés: sin README.en.md, aviso «Translation pending» y el texto español marcado con lang="es"', () => {
  const btn = result.files.get('en/components/btn.md')
  const hasEn = fs.existsSync(path.join(ROOT, COMPONENTS_DIR, 'GBtn/README.en.md'))
  if (!hasEn) {
    assert.match(btn, /::: warning Translation pending/)
    assert.match(btn, /<div v-pre lang="es">/)
    assert.match(btn, /\]\(\/en\/components\/icon/, 'los enlaces entre componentes se quedan en /en/')
  }
  assert.doesNotMatch(result.files.get('components/btn.md'), /Translation pending/)
})

test('los ejemplos marcados en un README se extraen como SFC', () => {
  const btn = result.locales.es.pages.find((p) => p.component?.dir === 'GBtn')
  assert.equal(btn.demoSource, 'readme')
  assert.ok([...result.demoFiles.keys()].some((k) => k.startsWith('btn-')), 'falta el SFC del ejemplo de GBtn')
})

test('utilidades: página de guía en los dos idiomas, con ejemplos vivos y en la navegación lateral', () => {
  for (const [file, locale] of [['utilities.md', 'es'], ['en/utilities.md', 'en']]) {
    assert.ok(result.files.has(file), `falta ${file}`)
    const page = result.files.get(file)
    assert.match(page, /GranaExample1/, `${file}: sin ejemplo vivo (bloque \`vue demo\` del README)`)
    const guide = result.locales[locale].sidebar[0].items
    assert.ok(guide.some((i) => i.link === (locale === 'es' ? '/utilities' : '/en/utilities')), `${locale}: «Utilidades» no está en el grupo Guía`)
  }
  assert.ok([...result.demoFiles.keys()].some((k) => k.startsWith('utilities-')), 'falta el SFC del ejemplo de las utilidades')
  assert.match(result.files.get('en/utilities.md'), /::: warning Translation pending/)
})

test('fixture: un componente nuevo con README genera página aunque no tenga meta.json', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'grana-site-'))
  const w = (rel, text) => {
    fs.mkdirSync(path.dirname(path.join(tmp, rel)), { recursive: true })
    fs.writeFileSync(path.join(tmp, rel), text)
  }
  const sections = GUIDE.flatMap((g) => g.sections || []).map((s) => `## ${s}\n\nTexto.\n`)
  w('README.md', `# Grana\n\nIntro.\n\n- **Uno.** Dos.\n\n${sections.join('\n')}\n### Acciones\n\n[\`GNuevo\`](packages/vue/src/components/GNuevo/README.md)\n`)
  w('CHANGELOG.md', '# Changelog\n\n## [Sin publicar]\n')
  w('packages/cli/README.md', '# @grana/cli\n\nTexto.\n')
  w('packages/vue/src/styles/README-utilities.md', '# Clases utilitarias\n\nTexto.\n')
  w(`${COMPONENTS_DIR}/GNuevo/README.md`, '# GNuevo\n\nUn componente.\n\n```vue demo\n<g-btn>Hola</g-btn>\n```\n\nVer [GBtn](../GBtn/README.md).\n')
  w(`${COMPONENTS_DIR}/GBtn/README.md`, '# GBtn\n\nBotón.\n\n## Uso\n\nTexto.\n')
  const r = generate({ root: tmp, write: false })
  assert.ok(r.files.has('components/nuevo.md'))
  assert.ok(r.files.has('en/components/nuevo.md'))
  assert.match(r.files.get('components/nuevo.md'), /\]\(\/components\/btn\)/)
  assert.ok(r.demoFiles.has('nuevo-1.vue'))
  fs.rmSync(tmp, { recursive: true, force: true })
})

/* ---------------------------------------------------------------- utilidades */

test('slugs: GitHub y VitePress', () => {
  assert.equal(lib.ghSlug(lib.headingText('Estado: `0.1.0-beta`')), 'estado-010-beta')
  assert.equal(lib.ghSlug('Tamaño e importación parcial'), 'tamaño-e-importación-parcial')
  assert.equal(lib.vpSlug('Tamaño e importación parcial'), 'tamano-e-importacion-parcial')
  assert.equal(lib.vpSlug('Estado: 0.1.0-beta'), 'estado-0-1-0-beta')
  const u = lib.uniqueSlugger(lib.vpSlug)
  assert.deepEqual([u('Props'), u('Props'), u('Props')], ['props', 'props-1', 'props-2'])
  assert.equal(lib.componentSlug('GFormSection'), 'form-section')
  assert.equal(lib.componentSlug('GBtn'), 'btn')
})

test('enlaces: el código en línea no se toca y las etiquetas con código sí se reescriben', () => {
  const md = 'Ver [`SECURITY.md`](SECURITY.md) y `[no](enlace)`.\n\n```md\n[tampoco](x.md)\n```\n'
  const out = lib.rewriteLinks(md, (h) => 'https://x/' + h)
  assert.match(out, /\[`SECURITY.md`\]\(https:\/\/x\/SECURITY.md\)/)
  assert.match(out, /`\[no\]\(enlace\)`/)
  assert.match(out, /\[tampoco\]\(x\.md\)/)
})

test('ejemplos: solo bloques `vue demo` de primer nivel; plantilla → SFC', () => {
  const segs = lib.extractDemos('a\n\n```vue demo\n<g-btn>Hola</g-btn>\n```\n\n  ```vue demo\n<x/>\n  ```\n\n```vue\n<y/>\n```\n')
  assert.equal(segs.filter((s) => s.type === 'demo').length, 1)
  assert.match(lib.demoToSfc('<g-btn>Hola</g-btn>'), /^<template>/)
  const sfc = '<script setup>\nconst a = 1\n</script>\n\n<template><p>{{ a }}</p></template>'
  assert.equal(lib.demoToSfc(sfc), sfc + '\n')
})

test('tablas de API: escapan < y | fuera del código', () => {
  assert.equal(lib.cell('a <b> | `c<d>`'), 'a &lt;b&gt; \\| `c<d>`')
})
