#!/usr/bin/env node
// Prueba de extremo a extremo de `grana init` (design/contracts/cli-init.md §14, criterios 1 a 8). Necesita red (create-vite
// y las dependencias de las plantillas), `packages/vue/dist` construido (`npm run build`) y Playwright con Chromium.
//   node packages/cli/scripts/init-e2e.mjs [directorio de trabajo]     (puerto: GRANA_PW_PORT, por defecto 4208)
import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildTheme } from '../src/index.js'

const REPO = resolve(fileURLToPath(new URL('../../..', import.meta.url)))
const BIN = join(REPO, 'packages/cli/bin/grana.mjs')
const PORT = Number(process.env.GRANA_PW_PORT) || 4208
const WORK = resolve(process.argv[2] ?? mkdtempSync(join(tmpdir(), 'grana-init-e2e-')))
const BRAND = '#7A1F5C'
mkdirSync(WORK, { recursive: true })

let pass = 0
let fail = 0
const check = (ok, label, detail = '') => {
  if (ok) pass++
  else fail++
  console.log(`${ok ? '✔' : '✖'} ${label}${ok || !detail ? '' : ` — ${detail}`}`)
}
const sh = (cmd, args, cwd, { allowFail = false } = {}) => {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', env: { ...process.env, CI: '1' } })
  if (r.status !== 0 && !allowFail) throw new Error(`${cmd} ${args.join(' ')} (${cwd}) → ${r.status}\n${r.stdout}\n${r.stderr}`)
  return r
}
const grana = (cwd, args) => sh(process.execPath, [BIN, 'init', ...args], cwd, { allowFail: true })
// Suma SHA-256 y mtime de cada archivo, sin node_modules ni dist (con `lock`, también node_modules/.package-lock.json)
const snapshot = (dir, { lock = false } = {}) => {
  const out = {}
  const walk = (d) => {
    for (const f of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, f.name)
      if (f.isDirectory()) { if (f.name !== 'node_modules' && f.name !== 'dist') walk(p) } else out[p.slice(dir.length + 1)] = `${createHash('sha256').update(readFileSync(p)).digest('hex')} ${statSync(p).mtimeMs}`
    }
  }
  walk(dir)
  const pl = join(dir, 'node_modules/.package-lock.json')
  if (lock && existsSync(pl)) out['node_modules/.package-lock.json'] = `${createHash('sha256').update(readFileSync(pl)).digest('hex')} ${statSync(pl).mtimeMs}`
  return out
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const occurrences = (text, s) => text.split(s).length - 1

// 0. Tarballs reales de npm pack
const TGZ = join(WORK, 'tgz')
rmSync(TGZ, { recursive: true, force: true })
mkdirSync(TGZ)
if (!existsSync(join(REPO, 'packages/vue/dist/grana.js'))) throw new Error('Falta packages/vue/dist: ejecuta npm run build')
for (const p of ['vue', 'cli']) sh('npm', ['pack', '--pack-destination', TGZ], join(REPO, 'packages', p))
console.log(`tarballs: ${readdirSync(TGZ).join(', ')}`)

// 1. Plantillas de create-vite, con npm install; una copia intacta de cada una para los casos 6 y 7
const create = (name, template) => {
  const dir = join(WORK, name)
  rmSync(dir, { recursive: true, force: true })
  sh('npm', ['create', 'vite@latest', name, '--', '--template', template, '--no-interactive'], WORK)
  if (template !== 'vanilla') sh('npm', ['install', '--no-audit', '--no-fund'], dir)
  return dir
}
const js = create('app-js', 'vue')
const tsDir = create('app-ts', 'vue-ts')
const pristine = join(WORK, 'app-js-pristine')
rmSync(pristine, { recursive: true, force: true })
cpSync(js, pristine, { recursive: true, preserveTimestamps: true })
const copy = (name) => { const d = join(WORK, name); rmSync(d, { recursive: true, force: true }); cpSync(pristine, d, { recursive: true, preserveTimestamps: true }); return d }

// Servidor de vista previa + Chromium: el botón con el primary de buildTheme y la fuente cargada (criterio 4)
const { chromium } = await import('playwright')
const browser = await chromium.launch()
const theme = buildTheme({ brand: BRAND, shape: 'rounded', density: 'default', dark: true })
const expected = { light: theme.tokens['--g-color-primary'], dark: theme.dark.tokens['--g-color-primary'] }
const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})` }
const resolveVar = (tokens, v) => { let x = v; for (let i = 0; i < 8 && /^var\(/.test(x); i++) x = tokens[/var\((--[\w-]+)\)/.exec(x)[1]]; return x }
const preview = async (dir, label) => {
  const url = `http://localhost:${PORT}/`
  const up = async () => { try { return (await fetch(url)).ok } catch { return false } }
  if (await up()) throw new Error(`El puerto ${PORT} ya está ocupado: la vista previa mediría otro proyecto`)
  // vite directamente (no npx: matar npx deja vivo a vite) y en su propio grupo de procesos
  const server = spawn(join(dir, 'node_modules/.bin/vite'), ['preview', '--port', String(PORT), '--strictPort'], { cwd: dir, stdio: 'ignore', detached: true })
  const exited = new Promise((r) => server.once('exit', r))
  try {
    for (let i = 0; i < 80 && !(await up()); i++) await new Promise((r) => setTimeout(r, 250))
    // La página servida es la de este proyecto: su dist/index.html
    const served = await (await fetch(url)).text()
    if (served !== readFileSync(join(dir, 'dist/index.html'), 'utf8')) throw new Error(`${label}: el servidor de ${PORT} no sirve ${dir}`)
    for (const scheme of ['light', 'dark']) {
      const page = await browser.newPage({ colorScheme: scheme })
      await page.goto(url)
      await page.waitForSelector('.g-btn')
      const m = await page.evaluate(async () => {
        await document.fonts.ready
        const btn = document.querySelector('.g-btn:not(.g-btn--variant-soft)')
        return { brand: getComputedStyle(document.documentElement).getPropertyValue('--g-color-brand').trim(), bg: getComputedStyle(btn).backgroundColor, font: document.fonts.check('1em "Instrument Sans"'), count: document.querySelectorAll('.g-btn').length }
      })
      const want = resolveVar(scheme === 'light' ? theme.tokens : theme.dark.tokens, expected[scheme])
      if (scheme === 'light') check(m.brand.toUpperCase() === BRAND, `${label}: --g-color-brand es ${BRAND}`, m.brand)
      check(m.count >= 1 && m.bg === rgb(want), `${label} (${scheme}): .g-btn con el --g-color-primary de buildTheme (${want})`, `${m.bg} · ${m.count} botones`)
      if (scheme === 'light') check(m.font, `${label}: Instrument Sans cargada`)
      await page.close()
    }
  } finally {
    try { process.kill(-server.pid, 'SIGTERM') } catch {}
    await Promise.race([exited, new Promise((r) => setTimeout(r, 5000))])
    for (let i = 0; i < 40 && (await up()); i++) await new Promise((r) => setTimeout(r, 250))
  }
}

// 2 a 5. Plantillas vue y vue-ts
for (const [dir, label] of [[js, 'vue'], [tsDir, 'vue-ts']]) {
  const r = grana(dir, ['--yes', '--from', TGZ, '--brand', BRAND, '--example'])
  check(r.status === 0, `${label}: init → 0`, `${r.status}\n${r.stderr}`)
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  check(/^file:/.test(pkg.dependencies?.['@grana/vue'] ?? '') && /^file:/.test(pkg.devDependencies?.['@grana/cli'] ?? ''), `${label}: @grana/vue en dependencies y @grana/cli en devDependencies (file:)`, JSON.stringify([pkg.dependencies, pkg.devDependencies]))
  check(same(JSON.parse(readFileSync(join(dir, 'grana.config.json'), 'utf8')), { brand: BRAND, shape: 'rounded', density: 'default', dark: true }), `${label}: grana.config.json`)
  const vc = readdirSync(dir).find((f) => /^vite\.config\./.test(f))
  const vtext = readFileSync(join(dir, vc), 'utf8')
  check(vtext.includes('@grana/cli/vite') && vtext.includes('grana()'), `${label}: ${vc} con @grana/cli/vite y grana()`)
  const entry = label === 'vue' ? 'src/main.js' : 'src/main.ts'
  const etext = readFileSync(join(dir, entry), 'utf8')
  check(['@grana/vue/style.css', '@grana/vue/fonts.css', 'virtual:grana/tokens.css'].every((s) => occurrences(etext, s) === 1), `${label}: ${entry} con las tres importaciones una vez cada una`)
  // 3. La prueba (no el instalador) monta el ejemplo en App.vue
  const app = join(dir, 'src/App.vue')
  writeFileSync(app, `<script setup${label === 'vue-ts' ? ' lang="ts"' : ''}>\nimport GranaExample from './GranaExample.vue'\n</script>\n\n<template>\n  <GranaExample />\n</template>\n`)
  const b = sh('npm', ['run', 'build'], dir, { allowFail: true })
  check(b.status === 0, `${label}: npm run build${label === 'vue-ts' ? ' (con vue-tsc -b)' : ''}`, `${b.stdout.slice(-1500)}\n${b.stderr.slice(-1500)}`)
  if (b.status === 0) await preview(dir, label)
  // 5. Segunda ejecución: nada que cambiar, sin gestor, mismas sumas y fechas
  const before = snapshot(dir, { lock: true })
  const r2 = grana(dir, ['--yes', '--from', TGZ, '--brand', BRAND, '--example'])
  check(r2.status === 0 && /nada que cambiar/.test(r2.stdout) && !/added|up to date/.test(r2.stdout + r2.stderr), `${label}: segunda ejecución → 0, «nada que cambiar», sin gestor`, r2.stdout + r2.stderr)
  check(same(before, snapshot(dir, { lock: true })), `${label}: segunda ejecución sin cambios (SHA-256 y mtime)`)
}

// 6. --register global con <g-btn> escrito en App.vue sin importar
{
  const dir = copy('app-global')
  writeFileSync(join(dir, 'src/App.vue'), '<template>\n  <g-btn>Guardar</g-btn>\n  <g-btn variant="soft">Cancelar</g-btn>\n</template>\n')
  const r = grana(dir, ['--yes', '--from', TGZ, '--brand', BRAND, '--register', 'global'])
  check(r.status === 0, 'global: init → 0', r.stderr)
  const main = readFileSync(join(dir, 'src/main.js'), 'utf8')
  check(main.includes("import Grana from '@grana/vue'") && main.includes('.use(Grana).mount('), 'global: import Grana y .use(Grana)')
  const b = sh('npm', ['run', 'build'], dir, { allowFail: true })
  check(b.status === 0, 'global: npm run build', b.stderr.slice(-1500))
  if (b.status === 0) await preview(dir, 'global')
}

// 7. --dry-run en un proyecto recién creado
{
  const dir = copy('app-dry')
  const before = snapshot(dir, { lock: true })
  const r = grana(dir, ['--yes', '--dry-run', '--from', TGZ, '--brand', BRAND])
  check(r.status === 0, '--dry-run → 0', r.stderr)
  check(r.stdout.includes('+++ b/src/main.js') && r.stdout.includes('+++ b/vite.config.js') && r.stdout.includes('+++ b/grana.config.json'), '--dry-run: imprime los diffs')
  check(occurrences(r.stdout, 'npm install ') === 2 && r.stdout.includes('npm install -D '), '--dry-run: imprime las dos órdenes de instalación')
  check(!/[⚠✖]/.test(r.stdout), '--dry-run: stdout sin ⚠ ni ✖')
  check(same(before, snapshot(dir, { lock: true })), '--dry-run: sin cambios (SHA-256 y mtime, también node_modules/.package-lock.json)')
}

// 8. Proyectos no compatibles → 3, nada cambia
{
  const vanilla = create('app-vanilla', 'vanilla')
  const nuxt = join(WORK, 'app-nuxt')
  rmSync(nuxt, { recursive: true, force: true })
  mkdirSync(nuxt)
  writeFileSync(join(nuxt, 'package.json'), `${JSON.stringify({ name: 'n', private: true, dependencies: { nuxt: '^3.13.0', vue: '^3.5.0' } }, null, 2)}\n`)
  const empty = join(WORK, 'app-empty')
  rmSync(empty, { recursive: true, force: true })
  mkdirSync(empty)
  writeFileSync(join(empty, 'README.md'), 'nada\n')
  for (const [dir, label] of [[vanilla, 'vanilla'], [nuxt, 'Nuxt'], [empty, 'sin package.json']]) {
    const before = snapshot(dir, { lock: true })
    const r = grana(dir, ['--yes', '--from', TGZ])
    check(r.status === 3 && r.stderr.trim().length > 0 && r.stdout === '', `${label} → 3 con mensaje por stderr`, `${r.status} ${r.stderr}`)
    check(same(before, snapshot(dir, { lock: true })), `${label}: nada cambia`)
  }
}

await browser.close()
console.log(`\n${pass}/${pass + fail} comprobaciones (trabajo en ${WORK})`)
process.exitCode = fail ? 1 : 0
