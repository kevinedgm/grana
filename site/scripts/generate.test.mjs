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
import { execFileSync } from 'node:child_process'
import vm from 'node:vm'
import { generate, discoverComponents, discoverBlocks, loadNumbers, checkNumbers, GUIDE, COMPONENTS_DIR, BLOCKS_DIR, BLOCK_FAMILIES, NUMBERS_FILE } from './generate.mjs'

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

test('cada componente candidate tiene su ficha interactiva (site/live/<Componente>.js) y la página la monta', () => {
  const missing = []
  for (const p of result.locales.es.pages.filter((x) => x.component)) {
    const meta = p.component.metas[0]
    if (meta?.status !== 'candidate') continue
    if (!fs.existsSync(path.join(ROOT, 'site/live', `${p.component.dir}.js`))) { missing.push(p.component.dir); continue }
    for (const locale of ['es', 'en']) {
      const text = result.files.get(`${locale === 'es' ? '' : 'en/'}components/${p.component.slug}.md`)
      assert.match(text, /<GranaLive :meta="liveMeta" :spec="liveSpec" \/>/, `${p.component.dir} (${locale}): la página no monta la ficha`)
      assert.match(text, new RegExp(`import liveSpec from '@site-live/${p.component.dir}\\.js'`), `${p.component.dir} (${locale}): no importa su ficha`)
    }
  }
  assert.deepEqual(missing, [], `candidate sin ficha interactiva: ${missing.join(', ')}`)
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
    assert.ok(guide.some((i) => i.href === (locale === 'es' ? '/utilities' : '/en/utilities')), `${locale}: «Utilidades» no está en el grupo Guía`)
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
  const r = generate({ root: tmp, write: false, numbers: { GBtn: 1, GNuevo: 2 } })
  assert.ok(r.files.has('components/nuevo.md'))
  assert.ok(r.files.has('en/components/nuevo.md'))
  assert.match(r.files.get('components/nuevo.md'), /\]\(\/components\/btn\)/)
  assert.ok(r.demoFiles.has('nuevo-1.vue'))
  fs.rmSync(tmp, { recursive: true, force: true })
})

/* ---------------------------------------------------------------- @grana/blocks */

test('blocks: cada sección con README y meta.json genera su página en los dos idiomas, con ejemplo vivo', () => {
  const blocks = discoverBlocks(ROOT)
  const onDisk = fs.readdirSync(path.join(ROOT, BLOCKS_DIR), { withFileTypes: true }).filter((d) => d.isDirectory() && /^Gb[A-Z]/.test(d.name) && fs.existsSync(path.join(ROOT, BLOCKS_DIR, d.name, 'README.md')))
  assert.equal(blocks.length, onDisk.length, 'una sección con README no tiene meta.json (o al revés)')
  assert.ok(blocks.length >= 29, `se esperaban las 29 secciones (Marketing 9, Booking 11 y Ecommerce 9 con README), hay ${blocks.length}`)
  // Ecommerce: toda sección `candidate` tiene README (y por tanto página); las `draft` (EC-L7) pueden no tenerlo todavía
  const ecoDirs = fs.readdirSync(path.join(ROOT, BLOCKS_DIR), { withFileTypes: true }).filter((d) => d.isDirectory() && /^Gb[A-Z]/.test(d.name))
  for (const d of ecoDirs) {
    const metaFile = path.join(ROOT, BLOCKS_DIR, d.name, `${d.name}.meta.json`)
    if (!fs.existsSync(metaFile)) continue
    const m = JSON.parse(fs.readFileSync(metaFile, 'utf8'))
    if (m.family === 'ecommerce' && m.status === 'candidate') assert.ok(blocks.some((b) => b.dir === d.name), `${d.name}: Ecommerce candidate sin README`)
  }
  assert.ok(blocks.filter((b) => b.family === 'ecommerce').length >= 9, 'se esperaban las 9 secciones de Ecommerce con README')
  for (const b of blocks) {
    assert.ok(BLOCK_FAMILIES.some((f) => f.id === b.family), `${b.dir}: familia «${b.family}» sin página`)
    for (const prefix of ['', 'en/']) {
      const file = `${prefix}blocks/${b.family}/${b.slug}.md`
      assert.ok(result.files.has(file), `${b.dir}: falta ${file}`)
      const page = result.files.get(file)
      assert.match(page, /GranaExample\d/, `${file}: sin ejemplo vivo`)
      assert.match(page, new RegExp(`<code>&lt;${b.meta.variants[0].tag}&gt;</code>`), `${file}: sin la etiqueta de la primera variante`)
      assert.match(page, new RegExp(`blob/main/${b.meta.contract}`), `${file}: sin enlace a su contrato`)
      assert.match(page, new RegExp(`blob/main/design/lab/blocks/${b.family}/auditoria\\.md`), `${file}: sin enlace a su auditoría`)
    }
  }
  const slugs = blocks.map((b) => `${b.family}/${b.slug}`)
  assert.equal(new Set(slugs).size, slugs.length, 'dos secciones comparten ruta')
  const missing = result.locales.es.pages.filter((p) => p.block && !p.demoSource).map((p) => p.block.dir)
  assert.deepEqual(missing, [], `sin ejemplo vivo: ${missing.join(', ')}`)
})

test('blocks: la página de una sección trae variantes, props, eventos y slots desde el meta.json', () => {
  const page = result.files.get('blocks/marketing/features.md')
  assert.match(page, /\| `GbFeatures02` \| `<gb-features-02>` \| Alternada \|/)
  assert.match(page, /### Props/)
  assert.match(page, /\| `items` \| `Feature\[\]` \|/)
  assert.match(page, /### Eventos/)
  assert.match(page, /\| `navigate` \| `BlockNavigate<Feature>` \|/)
  assert.match(page, /### Slots/)
  assert.match(page, /\| `item` \| `\{ item: Feature; index: number \}` \|/)
  assert.match(result.files.get('en/blocks/marketing/features.md'), /### Variants/)
  assert.match(result.files.get('en/blocks/marketing/features.md'), /::: warning Translation pending/)
})

test('blocks: cada prop de cada meta.json consta en la tabla Props de su README', () => {
  const faltan = []
  for (const b of discoverBlocks(ROOT)) {
    const readme = fs.readFileSync(path.join(ROOT, b.readme), 'utf8')
    const rows = readme.split('\n').filter((l) => /^\|\s*`/.test(l)).join('\n')
    for (const p of b.meta.props || []) if (!rows.includes('`' + p.name + '`')) faltan.push(`${b.dir}: ${p.name}`)
  }
  assert.deepEqual(faltan, [])
})

test('blocks: índice, índice por familia, navegación y barra lateral', () => {
  for (const [prefix, locale] of [['', 'es'], ['en/', 'en']]) {
    const index = result.files.get(`${prefix}blocks/index.md`)
    assert.ok(index, `${locale}: falta blocks/index.md`)
    assert.match(index, /Reglas de bloque estructural|Structural block rules/)
    for (const b of discoverBlocks(ROOT)) assert.ok(index.includes(`/${prefix}blocks/${b.family}/${b.slug})`), `${locale}: el índice no enlaza ${b.dir}`)
    for (const f of BLOCK_FAMILIES) {
      const fam = result.files.get(`${prefix}blocks/${f.id}/index.md`)
      assert.ok(fam, `${locale}: falta el índice de ${f.id}`)
      for (const b of discoverBlocks(ROOT).filter((x) => x.family === f.id)) assert.ok(fam.includes(`/${prefix}blocks/${f.id}/${b.slug})`), `${locale}/${f.id}: no enlaza ${b.dir}`)
    }
    // Su barra propia, como en el original (sitio-marco.md §4): grupos por familia plegables, sin números
    const groups = result.locales[locale].blocksSidebar
    assert.deepEqual(result.locales[locale].blocksUnlisted, [], `${locale}: secciones fuera de la barra lateral`)
    assert.equal(groups.flatMap((g) => g.items).filter((i) => /\/blocks\/[a-z]+\/[a-z-]+$/.test(i.href)).length, discoverBlocks(ROOT).length)
    assert.ok(groups.slice(1).every((g) => g.collapsible && g.id && g.collapsed === false), `${locale}: familias sin plegar`)
    assert.ok(groups.flatMap((g) => g.items).every((i) => !i.code), `${locale}: números en /blocks/`)
  }
  const frame = fs.readFileSync(path.join(ROOT, 'site/.vitepress/theme/frameNav.js'), 'utf8')
  assert.match(frame, /activeMatch: `\^\$\{p\}blocks\/`/, 'falta «Blocks» en la barra superior')
  assert.ok(result.files.has('blocks/marketing/hero.md') && result.files.has('en/blocks/booking/search.md') && result.files.has('en/blocks/ecommerce/product-grid.md'))
})

test('blocks: el tema registra los plugins y el sitio depende de @grana/blocks', () => {
  const theme = fs.readFileSync(path.join(ROOT, 'site/.vitepress/theme/index.js'), 'utf8')
  assert.match(theme, /from '@grana\/blocks\/marketing'/)
  assert.match(theme, /from '@grana\/blocks\/booking'/)
  assert.match(theme, /from '@grana\/blocks\/ecommerce'/)
  assert.match(theme, /\.use\(marketing\)\.use\(booking\)\.use\(ecommerce\)/)
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'site/package.json'), 'utf8'))
  assert.equal(pkg.dependencies['@grana/blocks'], '*')
})

test('blocks: sin glifos de pictograma en el texto generado', () => {
  for (const [file, text] of result.files) {
    if (!file.includes('blocks/')) continue
    assert.doesNotMatch(text, /[\u2713\u2714\u25B2\u25CF\u203A\u26A0]/u, `${file}: glifo en lugar de icono`)
  }
})

test('los GText y GPrice nuevos salen en «Componentes»', () => {
  for (const slug of ['text', 'price']) assert.ok(result.files.has(`components/${slug}.md`), `falta components/${slug}.md`)
})

/* ---------------------------------------------------------------- marco del sitio (sitio-marco.md §5, §6, §12.8) */

test('números estables: todo componente con página tiene número, ninguno se repite y se pintan con dos cifras', () => {
  const numbers = loadNumbers(ROOT)
  const { components } = discoverComponents(ROOT)
  for (const c of components) assert.ok(c.dir in numbers, `${c.dir}: sin número en ${NUMBERS_FILE}`)
  const values = Object.values(numbers)
  assert.equal(new Set(values).size, values.length, 'un número se repite')
  for (const locale of ['es', 'en']) {
    for (const g of result.locales[locale].sidebar) for (const it of g.items) {
      if (!it.code) continue
      assert.match(it.code, /^\d{2,}$/, `${it.label}: código «${it.code}»`)
      assert.equal(Number(it.code), numbers[it.label], `${it.label}: el índice no lleva su número`)
    }
  }
  assert.equal(numbers.GCombobox, 24, 'GCombobox es «24» (la dirección del contrato)')
})

test('números estables: ningún número asignado cambia ni se reutiliza (comparado con el registro en git)', (t) => {
  let committed
  try {
    committed = JSON.parse(execFileSync('git', ['show', `HEAD:${NUMBERS_FILE}`], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }))
  } catch {
    t.skip(`${NUMBERS_FILE} aún no está en HEAD`)
    return
  }
  const now = loadNumbers(ROOT)
  for (const [name, n] of Object.entries(committed)) {
    assert.ok(name in now, `${name} desapareció del registro: un componente retirado conserva su número (no se reutiliza)`)
    assert.equal(now[name], n, `${name}: su número cambió de ${n} a ${now[name]}`)
  }
})

test('números estables: el generador falla si falta un número o si uno se repite', () => {
  assert.throws(() => checkNumbers({ GBtn: 1 }, ['GBtn', 'GNuevo']), /sin número para GNuevo/)
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'grana-numeros-'))
  fs.mkdirSync(path.join(tmp, path.dirname(NUMBERS_FILE)), { recursive: true })
  fs.writeFileSync(path.join(tmp, NUMBERS_FILE), JSON.stringify({ GBtn: 3, GTag: 3 }))
  assert.throws(() => loadNumbers(tmp), /el número 3 se repite/)
  fs.rmSync(tmp, { recursive: true, force: true })
})

test('un solo h1 por página, en el cuerpo (como en 1d11c448): fichas y guías con su `# Título`', () => {
  for (const [file, text] of result.files) {
    const body = text.replace(/^---\n[\s\S]*?\n---\n/, '')
    const h1 = lib.parseHeadings(body).filter((h) => h.level === 1)
    const home = /^layout: home$/m.test(text)
    const tool = /^layout: page$/m.test(text)
    // la portada lleva su h1 en BrandHero (logo W2) y las herramientas en su componente
    assert.equal(h1.length, home || tool ? 0 : 1, `${file}: ${h1.length} h1 en el cuerpo`)
    assert.match(text, /^---\ntitle: "[^"]+"/, `${file}: sin title en el frontmatter`)
  }
  assert.match(result.files.get('components/combobox.md'), /^# GCombobox$/m)
  assert.match(result.files.get('components/combobox.md'), /<p class="grana-meta">/)
  assert.match(result.files.get('components/combobox.md'), /import \{ GCombobox \} from '@grana\/vue\/combobox'/)
})

test('frontmatter: páginas vecinas por el orden de la barra lateral de cada página (sin número)', () => {
  for (const locale of ['es', 'en']) {
    for (const [key, filter] of [['sidebar', (p) => !(p.block || p.blockIndex || p.blockFamily)], ['blocksSidebar', (p) => p.block || p.blockIndex || p.blockFamily]]) {
      const order = result.locales[locale][key].flatMap((g) => g.items)
      for (const p of result.locales[locale].pages.filter(filter)) {
        const i = order.findIndex((o) => o.href === p.url)
        if (i < 0) continue
        const text = result.files.get(p.file)
        const fm = Object.fromEntries(text.split('\n---\n')[0].split('\n').slice(1).map((l) => [l.slice(0, l.indexOf(':')), l.slice(l.indexOf(':') + 2)]))
        if (i > 0) assert.deepEqual(JSON.parse(fm.prev), { text: order[i - 1].label, link: order[i - 1].href }, `${p.file}: prev`)
        else assert.equal(fm.prev, undefined, `${p.file}: prev en el primero`)
        if (i < order.length - 1) assert.deepEqual(JSON.parse(fm.next), { text: order[i + 1].label, link: order[i + 1].href }, `${p.file}: next`)
      }
    }
  }
  assert.match(result.files.get('components/combobox.md'), /^prev: \{"text":"GSelect","link":"\/components\/select"\}$/m)
})

test('índice izquierdo: Guía sin plegar y grupos de componentes plegables con id, collapsed false y números; ids únicos', () => {
  for (const locale of ['es', 'en']) {
    const groups = result.locales[locale].sidebar
    assert.equal(groups[0].id, 'g-guide')
    assert.ok(!groups[0].collapsible, 'Guía no se pliega')
    for (const g of groups.slice(1)) {
      assert.ok(g.collapsible && g.id && g.collapsed === false, `${locale}: ${g.label} sin plegar`)
      assert.ok(g.items.every((i) => /^\d{2,}$/.test(i.code) && i.keywords?.length && i.href), `${locale}: ${g.label} sin números o palabras clave`)
    }
    const ids = groups.flatMap((g) => g.items.map((i) => i.id))
    assert.equal(new Set(ids).size, ids.length, `${locale}: ids repetidos`)
    assert.ok(groups.flatMap((g) => g.items).every((i) => !i.icon), `${locale}: el índice calcado no lleva iconos`)
  }
  // los ids de grupo son estables entre idiomas
  assert.deepEqual(result.locales.es.sidebar.map((g) => g.id), result.locales.en.sidebar.map((g) => g.id))
})

test('búsqueda modal: forma del índice local de VitePress (@localSearchIndex) en el sitio construido', (t) => {
  const assets = path.join(ROOT, 'site/.vitepress/dist/assets/chunks')
  if (!fs.existsSync(assets)) {
    t.skip('sin site/.vitepress/dist: ejecuta antes npm run docs:build')
    return
  }
  const files = fs.readdirSync(assets)
  // Una carga perezosa por idioma (claves `root` y `en` del módulo virtual), cada una con el JSON de MiniSearch.
  for (const key of ['root', 'en']) {
    const f = files.find((x) => x.startsWith(`@localSearchIndex${key}.`) && x.endsWith('.js'))
    assert.ok(f, `falta el índice local de «${key}»`)
    const src = fs.readFileSync(path.join(assets, f), 'utf8')
    const m = src.match(/^const \w+=(["'`])([\s\S]*)\1;export\{\w+ as default\};?\s*$/)
    assert.ok(m, `@localSearchIndex${key}: no exporta una cadena por defecto`)
    const json = JSON.parse(vm.runInNewContext(m[1] + m[2] + m[1]))
    assert.ok(Array.isArray(json.fieldIds ? Object.keys(json.fieldIds) : null), 'sin fieldIds')
    assert.deepEqual(Object.keys(json.fieldIds).sort(), ['text', 'title', 'titles'])
    const stored = Object.values(json.storedFields)
    assert.ok(stored.length > 100, `@localSearchIndex${key}: ${stored.length} secciones`)
    assert.ok(stored.every((s) => typeof s.title === 'string' && Array.isArray(s.titles)), 'storedFields sin title/titles')
    const ids = Object.values(json.documentIds)
    assert.ok(ids.every((id) => typeof id === 'string' && id.startsWith('/grana/')), 'ids sin la base')
    assert.ok(ids.some((id) => /\/theming\.html#tema-oscuro$/.test(id)) || key === 'en', 'sin la sección «Tema oscuro» de Tematización')
  }
  const client = files.filter((x) => x.endsWith('.js')).map((x) => fs.readFileSync(path.join(assets, x), 'utf8')).find((x) => x.includes('@localSearchIndexroot'))
  assert.ok(client && /root:\(\)=>/.test(client) && /en:\(\)=>/.test(client), 'el módulo virtual ya no es { root: () => import(…), en: () => import(…) }')
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

test('anclas: el enlace del original (español) a un encabezado resuelve en la traducción', () => {
  // Los README de componente en español enlazan #tema-oscuro; en /en/ el README raíz está traducido
  // y sus slugs son otros, así que el generador registra también los del original.
  const sinAncla = result.warnings.filter((w) => /ancla #.* no encontrada/.test(w))
  assert.deepEqual(sinAncla, [])
})
