// grana init (design/contracts/cli-init.md §14, criterios 9 a 17): proyectos simulados en directorios temporales, el gestor
// sustituido por un doble, sin red.
import { describe, it, expect, afterAll } from 'vitest'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { PassThrough, Readable } from 'node:stream'
import { run } from '../src/cli.js'
import { REGISTER_DEFAULT, parseInit } from '../src/init/index.js'
import { editEntry, editViteConfig, unifiedDiff } from '../src/init/edit.js'
import { detectPm } from '../src/init/index.js'

const V = '0.1.0-beta.0'
const dirs = []
afterAll(() => { for (const d of dirs) rmSync(d, { recursive: true, force: true }) })

const MAIN_JS = "import { createApp } from 'vue'\nimport './style.css'\nimport App from './App.vue'\n\ncreateApp(App).mount('#app')\n"
const MAIN_TS = MAIN_JS.replace(/'/g, "'")
const VITE_JS = "import { defineConfig } from 'vite'\nimport vue from '@vitejs/plugin-vue'\n\n// https://vite.dev/config/\nexport default defineConfig({\n  plugins: [vue()],\n})\n"
const PKG = { name: 'app', private: true, type: 'module', scripts: { dev: 'vite', build: 'vite build' }, dependencies: { vue: '^3.5.13' }, devDependencies: { '@vitejs/plugin-vue': '^5.2.1', vite: '^6.0.5' } }
const json = (o) => `${JSON.stringify(o, null, 2)}\n`
const viteApp = (extra = {}) => ({
  'package.json': json(PKG),
  'package-lock.json': '{}\n',
  'index.html': '<!doctype html>\n<div id="app"></div>\n<script type="module" src="/src/main.js"></script>\n',
  'src/main.js': MAIN_JS,
  'src/App.vue': '<template><p>hola</p></template>\n',
  'vite.config.js': VITE_JS,
  ...extra
})
const project = (files) => {
  const dir = mkdtempSync(join(tmpdir(), 'grana-init-'))
  dirs.push(dir)
  for (const [p, c] of Object.entries(files)) {
    if (c === null) continue
    mkdirSync(dirname(join(dir, p)), { recursive: true })
    writeFileSync(join(dir, p), c)
  }
  return dir
}
// Suma y fechas de todos los archivos (sin node_modules)
const snapshot = (dir) => {
  const list = {}
  const walk = (d) => {
    for (const f of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, f.name)
      if (f.isDirectory()) { if (f.name !== 'node_modules') walk(p) } else list[p.slice(dir.length + 1)] = `${createHash('sha256').update(readFileSync(p)).digest('hex')}@${statSync(p).mtimeMs}`
    }
  }
  walk(dir)
  return list
}
// El doble del gestor: anota la orden y, como el real, escribe la dependencia en package.json
const fakePm = (calls, { status = 0 } = {}) => (cmd, args, opts) => {
  calls.push([cmd, ...args])
  if (status) return { status }
  const path = join(opts.cwd, 'package.json')
  const p = JSON.parse(readFileSync(path, 'utf8'))
  const dev = args.includes('-D') || args.includes('-d')
  const spec = args[args.length - 1]
  const name = spec.includes('grana-vue') || spec.startsWith('@grana/vue') ? '@grana/vue' : '@grana/cli'
  const key = dev ? 'devDependencies' : 'dependencies'
  p[key] = { ...p[key], [name]: spec.endsWith('.tgz') ? `file:${spec}` : `^${V}` }
  writeFileSync(path, json(p))
  return { status: 0 }
}
const go = async (dir, argv, { input, isTTY = Boolean(input), env = {}, spawn } = {}) => {
  const out = []
  const err = []
  const calls = []
  const stdin = input === undefined ? Readable.from([]) : Readable.from([input])
  const code = await run(['init', ...argv], { cwd: dir, out: (s) => out.push(s), err: (s) => err.push(s), version: V, spawn: spawn ?? fakePm(calls), isTTY, stdin, env })
  return { code, out: out.join(''), err: err.join(''), calls }
}
const file = (dir, p) => readFileSync(join(dir, p), 'utf8')

describe('init · instalación completa con --yes', () => {
  it('plantilla vue: paquetes, configuración, plugin y hojas; código 0', async () => {
    const dir = project(viteApp())
    const r = await go(dir, ['--yes', '--brand', '#7A1F5C'])
    expect(r.code, r.err).toBe(0)
    expect(r.calls).toEqual([['npm', 'install', `@grana/vue@${V}`], ['npm', 'install', '-D', `@grana/cli@${V}`]])
    expect(JSON.parse(file(dir, 'grana.config.json'))).toEqual({ brand: '#7A1F5C', shape: 'rounded', density: 'default', dark: true })
    expect(file(dir, 'grana.config.json')).toBe('{\n  "brand": "#7A1F5C",\n  "shape": "rounded",\n  "density": "default",\n  "dark": true\n}\n')
    expect(file(dir, 'src/main.js')).toBe("import { createApp } from 'vue'\nimport './style.css'\nimport App from './App.vue'\nimport '@grana/vue/style.css'\nimport '@grana/vue/fonts.css'\nimport 'virtual:grana/tokens.css'\n\ncreateApp(App).mount('#app')\n")
    expect(file(dir, 'vite.config.js')).toBe("import { defineConfig } from 'vite'\nimport vue from '@vitejs/plugin-vue'\nimport grana from '@grana/cli/vite'\n\n// https://vite.dev/config/\nexport default defineConfig({\n  plugins: [grana(), vue()],\n})\n")
    // Resumen: lo escrito, lo instalado, lo derivado y la orden equivalente
    expect(r.out).toMatch(/✔ grana\.config\.json/)
    expect(r.out).toMatch(/✔ @grana\/vue@0\.1\.0-beta\.0/)
    expect(r.out).toMatch(/brand #7A1F5C, on-brand #FFFFFF \(9\.64:1\)/)
    expect(r.out).toContain("Orden equivalente: npx @grana/cli init --yes --brand '#7A1F5C' --shape rounded --density default --dark")
    expect(r.out).toContain("import { GBtn } from '@grana/vue'")
    // Los diffs se imprimen igual con --yes
    expect(r.out).toContain('--- a/src/main.js\n+++ b/src/main.js')
    expect(r.out).toContain('--- /dev/null\n+++ b/grana.config.json')
  })

  it('segunda ejecución: «nada que cambiar», sin gestor y sin tocar fechas', async () => {
    const dir = project(viteApp())
    expect((await go(dir, ['--yes', '--example'])).code).toBe(0)
    const before = snapshot(dir)
    const r = await go(dir, ['--yes', '--example'])
    expect(r.code).toBe(0)
    expect(r.out).toBe(`Grana ya está instalado en ${dir}; nada que cambiar.\n`)
    expect(r.calls).toEqual([])
    expect(snapshot(dir)).toEqual(before)
  })

  it('idempotencia por partes: solo se planifica lo que falta', async () => {
    const dir = project(viteApp({ 'package.json': json({ ...PKG, dependencies: { ...PKG.dependencies, '@grana/vue': 'file:x.tgz' }, devDependencies: { ...PKG.devDependencies, '@grana/cli': '^0.1.0' } }), 'grana.config.json': '{}\n', 'src/main.js': MAIN_JS.replace("import App", "import '@grana/vue/style.css'\nimport App") }))
    const r = await go(dir, ['--yes'])
    expect(r.code).toBe(0)
    expect(r.calls).toEqual([])
    expect(file(dir, 'grana.config.json')).toBe('{}\n')
    const main = file(dir, 'src/main.js')
    expect(main.match(/@grana\/vue\/style\.css/g)).toHaveLength(1)
    expect(main).toContain("import '@grana/vue/fonts.css'")
  })

  it('--example crea src/GranaExample.vue sin tocar App.vue; con TS, lang="ts"', async () => {
    const dir = project(viteApp({ 'index.html': '<script type="module" src="/src/main.ts"></script>', 'src/main.js': null, 'src/main.ts': MAIN_TS, 'vite.config.js': null, 'vite.config.ts': VITE_JS }))
    const app = file(dir, 'src/App.vue')
    expect((await go(dir, ['--yes', '--example'])).code).toBe(0)
    expect(file(dir, 'src/GranaExample.vue')).toBe('<script setup lang="ts">\nimport { GBtn } from \'@grana/vue\'\n</script>\n\n<template>\n  <g-btn>Guardar</g-btn>\n  <g-btn variant="soft">Cancelar</g-btn>\n</template>\n')
    expect(file(dir, 'src/App.vue')).toBe(app)
    expect(file(dir, 'vite.config.ts')).toContain('plugins: [grana(), vue()]')
  })

  it('--register global: import y .use(Grana); el ejemplo sin script', async () => {
    const dir = project(viteApp())
    const r = await go(dir, ['--yes', '--register', 'global', '--example'])
    expect(r.code).toBe(0)
    expect(file(dir, 'src/main.js')).toBe("import { createApp } from 'vue'\nimport './style.css'\nimport App from './App.vue'\nimport '@grana/vue/style.css'\nimport '@grana/vue/fonts.css'\nimport 'virtual:grana/tokens.css'\nimport Grana from '@grana/vue'\n\ncreateApp(App).use(Grana).mount('#app')\n")
    expect(file(dir, 'src/GranaExample.vue').startsWith('<template>')).toBe(true)
    expect(r.out).toContain('--register global')
    expect((await go(dir, ['--yes', '--register', 'global'])).out).toMatch(/nada que cambiar/)
  })

  it('--theme file: src/grana-tokens.css de buildTheme, su import y el script; vite.config intacto', async () => {
    const dir = project(viteApp())
    const r = await go(dir, ['--yes', '--theme', 'file', '--brand', '2563eb'])
    expect(r.code, r.err).toBe(0)
    expect(file(dir, 'src/grana-tokens.css')).toContain('--g-color-brand: #2563EB')
    expect(file(dir, 'src/main.js')).toContain("import './grana-tokens.css'")
    expect(file(dir, 'vite.config.js')).toBe(VITE_JS)
    const pkg = JSON.parse(file(dir, 'package.json'))
    expect(pkg.scripts['grana:theme']).toBe('grana theme grana.config.json --out src/grana-tokens.css')
    // El script se añade sobre el package.json que dejó el gestor
    expect(pkg.dependencies['@grana/vue']).toBe(`^${V}`)
  })

  it('--skip-install escribe los archivos e imprime la orden sin ejecutarla', async () => {
    const dir = project(viteApp())
    const r = await go(dir, ['--yes', '--skip-install'])
    expect(r.code).toBe(0)
    expect(r.calls).toEqual([])
    expect(r.out).toContain(`Sin instalar (--skip-install); ejecuta:\n  npm install @grana/vue@${V}\n  npm install -D @grana/cli@${V}`)
    expect(file(dir, 'grana.config.json')).toContain('"shape": "rounded"')
  })
})

describe('init · detección (criterios 9, 10 y proyectos no compatibles)', () => {
  it.each([['package-lock.json', 'npm', ['install', '-D']], ['pnpm-lock.yaml', 'pnpm', ['add', '-D']], ['yarn.lock', 'yarn', ['add', '-D']], ['bun.lock', 'bun', ['add', '-d']], ['bun.lockb', 'bun', ['add', '-d']]])('%s → %s', async (lock, pm, dev) => {
    const dir = project(viteApp({ 'package-lock.json': null, [lock]: '' }))
    const r = await go(dir, ['--yes', '--skip-install'])
    expect(r.out).toContain(`${pm} ${dev.join(' ')} @grana/cli@${V}`)
  })
  it('packageManager, npm_config_user_agent y npm por defecto', () => {
    const dir = project({ 'package.json': '{}' })
    expect(detectPm(dir, { packageManager: 'pnpm@9.1.0' }, { env: {} }).pm).toBe('pnpm')
    expect(detectPm(dir, {}, { env: { npm_config_user_agent: 'yarn/4.1.0 npm/? node/v22' } }).pm).toBe('yarn')
    expect(detectPm(dir, {}, { env: {} }).pm).toBe('npm')
    expect(detectPm(dir, {}, { pm: 'bun', env: {} }).pm).toBe('bun')
  })
  it('varios archivos de bloqueo sin --pm → 2; con packageManager o --pm, sigue', async () => {
    const dir = project(viteApp({ 'yarn.lock': '' }))
    const before = snapshot(dir)
    const r = await go(dir, ['--yes'])
    expect(r.code).toBe(2)
    expect(r.err).toMatch(/varios archivos de bloqueo \(package-lock\.json, yarn\.lock\)/)
    expect(r.calls).toEqual([])
    expect(snapshot(dir)).toEqual(before)
    expect((await go(dir, ['--yes', '--pm', 'yarn', '--dry-run'])).code).toBe(0)
  })
  it('entrada por index.html aunque no se llame main', async () => {
    const dir = project(viteApp({ 'index.html': '<script type="module" src="./src/boot.js"></script>', 'src/boot.js': MAIN_JS }))
    expect((await go(dir, ['--yes'])).code).toBe(0)
    expect(file(dir, 'src/boot.js')).toContain('virtual:grana/tokens.css')
    expect(file(dir, 'src/main.js')).toBe(MAIN_JS)
  })
  it('entrada por la lista de respaldo (sin index.html)', async () => {
    const dir = project(viteApp({ 'index.html': null, 'src/main.js': null, 'src/main.mjs': MAIN_JS }))
    expect((await go(dir, ['--yes'])).code).toBe(0)
    expect(file(dir, 'src/main.mjs')).toContain('@grana/vue/fonts.css')
  })
  it('sin entrada: pasos a mano con las líneas exactas y código 6; lo demás se escribe', async () => {
    const dir = project(viteApp({ 'index.html': null, 'src/main.js': null }))
    const r = await go(dir, ['--yes'])
    expect(r.code).toBe(6)
    expect(r.err).toContain("import '@grana/vue/style.css'\n    import '@grana/vue/fonts.css'\n    import 'virtual:grana/tokens.css'")
    expect(file(dir, 'vite.config.js')).toContain('grana()')
  })
  it('sin vite.config con el plugin: pasos a mano con el archivo completo; no se crea', async () => {
    const dir = project(viteApp({ 'vite.config.js': null }))
    const r = await go(dir, ['--yes'])
    expect(r.code).toBe(6)
    expect(r.err).toContain('plugins: [grana(), vue()]')
    expect(r.err).toContain('--theme file')
    expect(() => file(dir, 'vite.config.js')).toThrow()
  })
  it.each([
    ['sin package.json', { 'package.json': null }, /No hay package\.json/],
    ['package.json ilegible', { 'package.json': '{ no' }, /No hay package\.json válido/],
    ['Nuxt por dependencia', { 'package.json': json({ ...PKG, dependencies: { ...PKG.dependencies, nuxt: '^3.13.0' } }) }, /Nuxt todavía no/],
    ['Nuxt por nuxt.config.ts', { 'nuxt.config.ts': 'export default {}\n' }, /Nuxt todavía no/],
    ['Vue 2', { 'package.json': json({ ...PKG, dependencies: { vue: '^2.7.0' } }) }, /Grana necesita Vue 3; este proyecto declara vue@\^2\.7\.0/],
    ['sin Vue (vanilla)', { 'package.json': json({ name: 'v', devDependencies: { vite: '^6.0.0' } }) }, /Grana necesita Vue 3; este proyecto declara vue@—/],
    ['sin Vite', { 'package.json': json({ ...PKG, devDependencies: {} }) }, /No es un proyecto Vite/]
  ])('%s → 3, nada cambia', async (_, extra, msg) => {
    const dir = project(viteApp(extra))
    const before = snapshot(dir)
    const r = await go(dir, ['--yes'])
    expect(r.code).toBe(3)
    expect(r.err).toMatch(msg)
    expect(r.out).toBe('')
    expect(r.calls).toEqual([])
    expect(snapshot(dir)).toEqual(before)
  })
  it('Vue 3 bajo 3.5 o rango «latest»: aviso por stderr, sigue', async () => {
    let r = await go(project(viteApp({ 'package.json': json({ ...PKG, dependencies: { vue: '^3.4.0' } }) })), ['--yes', '--dry-run'])
    expect(r.code).toBe(0)
    expect(r.err).toMatch(/⚠ @grana\/vue pide vue \^3\.5\.0/)
    r = await go(project(viteApp({ 'package.json': json({ ...PKG, dependencies: { vue: 'latest' } }) })), ['--yes', '--dry-run'])
    expect(r.code).toBe(0)
    expect(r.err).toMatch(/⚠ No se pudo saber la versión de Vue/)
  })
})

describe('init · formas que se entienden (criterio 11)', () => {
  const W = { style: true, fonts: true, theme: 'virtual:grana/tokens.css', global: true }
  it('createApp(App).use(router).mount( con comillas dobles y punto y coma', () => {
    const t = 'import { createApp } from "vue";\nimport App from "./App.vue";\nimport router from "./router";\n\ncreateApp(App).use(router).mount("#app");\n'
    expect(editEntry(t, W).text).toBe('import { createApp } from "vue";\nimport App from "./App.vue";\nimport router from "./router";\nimport "@grana/vue/style.css";\nimport "@grana/vue/fonts.css";\nimport "virtual:grana/tokens.css";\nimport Grana from "@grana/vue";\n\ncreateApp(App).use(router).use(Grana).mount("#app");\n')
  })
  it('const app = createApp(App) + app.mount( (con su punto y coma) e import de varias líneas', () => {
    const t = "import { createApp } from 'vue'\nimport {\n  a,\n  b\n} from './x'\n\nconst app = createApp(App)\napp.use(pinia)\napp.mount('#app');\n"
    expect(editEntry(t, W).text).toBe("import { createApp } from 'vue'\nimport {\n  a,\n  b\n} from './x'\nimport '@grana/vue/style.css'\nimport '@grana/vue/fonts.css'\nimport 'virtual:grana/tokens.css'\nimport Grana from '@grana/vue'\n\nconst app = createApp(App)\napp.use(pinia)\napp.use(Grana);\napp.mount('#app');\n")
  })
  it('CRLF se conserva', () => {
    const t = "import { createApp } from 'vue'\r\nimport App from './App.vue'\r\n\r\ncreateApp(App).mount('#app')\r\n"
    const r = editEntry(t, W).text
    expect(r).toBe("import { createApp } from 'vue'\r\nimport App from './App.vue'\r\nimport '@grana/vue/style.css'\r\nimport '@grana/vue/fonts.css'\r\nimport 'virtual:grana/tokens.css'\r\nimport Grana from '@grana/vue'\r\n\r\ncreateApp(App).use(Grana).mount('#app')\r\n")
    expect(r.replace(/\r\n/g, '').includes('\n')).toBe(false)
  })
  it('Grana ya importado como otro identificador → GranaPlugin', () => {
    const t = "import { createApp } from 'vue'\nimport Grana from './grana-local'\n\ncreateApp(App).mount('#app')\n"
    const r = editEntry(t, W).text
    expect(r).toContain("import GranaPlugin from '@grana/vue'")
    expect(r).toContain('createApp(App).use(GranaPlugin).mount(')
  })
  it('sin importaciones: al principio', () => {
    expect(editEntry("createApp(App).mount('#app')\n", { ...W, global: false }).text).toBe("import '@grana/vue/style.css'\nimport '@grana/vue/fonts.css'\nimport 'virtual:grana/tokens.css'\n\ncreateApp(App).mount('#app')\n")
  })
  it('vite.config: plugins en línea, vacía y en varias líneas; sin plugins con defineConfig({ y export default {', () => {
    expect(editViteConfig(VITE_JS).text).toContain('plugins: [grana(), vue()],')
    expect(editViteConfig("import vue from '@vitejs/plugin-vue';\nexport default defineConfig({\n  plugins: [],\n});\n").text).toBe("import vue from '@vitejs/plugin-vue';\nimport grana from '@grana/cli/vite';\nexport default defineConfig({\n  plugins: [grana()],\n});\n")
    expect(editViteConfig("import vue from '@vitejs/plugin-vue'\nexport default defineConfig({\n  plugins: [\n    vue(),\n  ],\n})\n").text).toBe("import vue from '@vitejs/plugin-vue'\nimport grana from '@grana/cli/vite'\nexport default defineConfig({\n  plugins: [\n    grana(),\n    vue(),\n  ],\n})\n")
    expect(editViteConfig("import { defineConfig } from 'vite'\n\nexport default defineConfig({\n  server: { port: 3000 },\n})\n").text).toBe("import { defineConfig } from 'vite'\nimport grana from '@grana/cli/vite'\n\nexport default defineConfig({\n  plugins: [grana()],\n  server: { port: 3000 },\n})\n")
    expect(editViteConfig('export default {\n}\n').text).toBe("import grana from '@grana/cli/vite'\n\nexport default {\n  plugins: [grana()],\n}\n")
  })
  it('vite.config: «grana» ya es un identificador → granaTheme', () => {
    const r = editViteConfig("import grana from './grana.js'\nexport default defineConfig({\n  plugins: [grana.x()],\n})\n")
    expect(r.text).toContain("import granaTheme from '@grana/cli/vite'")
    expect(r.text).toContain('plugins: [granaTheme(), grana.x()]')
  })
})

describe('init · formas que no se entienden: archivo byte a byte igual, código 6 y líneas exactas (criterio 11)', () => {
  it.each([
    ['createSSRApp', "import { createSSRApp } from 'vue'\nexport function createApp2() {\n  return createSSRApp(App)\n}\n"],
    ['montaje dentro de una función', "import { createApp } from 'vue'\nfunction boot() {\n  const app = createApp(App)\n  app.mount('#app')\n}\nboot()\n"],
    ['dos aplicaciones', "import { createApp } from 'vue'\ncreateApp(A).mount('#a')\ncreateApp(B).mount('#b')\n"],
    ['montaje en un then', "import { createApp } from 'vue'\nconst app = createApp(App)\nready.then(() => app.mount('#app'))\n"]
  ])('entrada: %s', async (_, main) => {
    const dir = project(viteApp({ 'src/main.js': main }))
    const r = await go(dir, ['--yes', '--register', 'global'])
    expect(r.code).toBe(6)
    expect(file(dir, 'src/main.js')).toBe(main)
    expect(r.err).toContain("import '@grana/vue/style.css'\n    import '@grana/vue/fonts.css'\n    import 'virtual:grana/tokens.css'\n    import Grana from '@grana/vue'")
    expect(r.err).toContain('.use(Grana) justo antes de .mount(')
    // Lo demás sí se aplicó
    expect(file(dir, 'vite.config.js')).toContain('grana()')
  })
  it.each([
    ['función de modo', "import { defineConfig } from 'vite'\nexport default defineConfig(({ mode }) => ({\n  plugins: [vue()],\n}))\n"],
    ['mergeConfig', "import { mergeConfig } from 'vite'\nexport default mergeConfig(base, {\n  plugins: [vue()],\n})\n"],
    ['plugins calculado', "export default defineConfig({\n  plugins: getPlugins(),\n})\n"],
    ['varias apariciones', "const a = { plugins: [] }\nexport default defineConfig({\n  plugins: [vue()],\n})\n"],
    ['configuración en una variable', "const config = {\n  plugins: [vue()],\n}\nexport default config\n"]
  ])('vite.config: %s', async (_, conf) => {
    const dir = project(viteApp({ 'vite.config.js': conf }))
    const r = await go(dir, ['--yes'])
    expect(r.code).toBe(6)
    expect(file(dir, 'vite.config.js')).toBe(conf)
    expect(r.err).toContain("import grana from '@grana/cli/vite'")
    expect(r.err).toContain('grana() como primer elemento de plugins')
    expect(r.err).toContain('--theme file')
  })
  it('la última importación comparte línea con código', () => {
    expect(editEntry("import a from 'a'; run()\ncreateApp(App).mount('#x')\n", { style: true }).error).toMatch(/comparte línea/)
  })
})

describe('init · validación y configuración existente (criterios 12 y 13)', () => {
  it.each([[['--brand', 'nope'], /«brand» debe ser un color hex/], [['--shape', 'square'], /«shape» debe ser "rounded" o "pill"/], [['--density', 'tight'], /`density` debe ser/], [['--register', 'all'], /--register debe ser named \| global/], [['--theme', 'css'], /plugin \| file/], [['--pm', 'deno'], /npm \| pnpm \| yarn \| bun/], [['--bogus'], /Opción desconocida: --bogus/], [['a', 'b'], /un solo directorio/], [['--brand'], /necesita un valor/]])('%j → 2 sin gestor ni escritura', async (argv, msg) => {
    const dir = project(viteApp())
    const before = snapshot(dir)
    const r = await go(dir, ['--yes', ...argv])
    expect(r.code).toBe(2)
    expect(r.err).toMatch(msg)
    expect(r.calls).toEqual([])
    expect(snapshot(dir)).toEqual(before)
  })
  it('configuración existente que rompe un mínimo → 1, nada escrito', async () => {
    const dir = project(viteApp({ 'grana.config.json': json({ overrides: { '--g-color-text-muted': '#CCCCCC' } }) }))
    const before = snapshot(dir)
    const r = await go(dir, ['--yes'])
    expect(r.code).toBe(1)
    expect(r.err).toMatch(/✖ error \[text-contrast\]/)
    expect(r.calls).toEqual([])
    expect(snapshot(dir)).toEqual(before)
  })
  it('una marca que rompe un mínimo con --yes → 1, sin gestor ni escritura', async () => {
    const { buildTheme } = await import('../src/index.js')
    const bad = ['#FFFF00', '#00FF00', '#FFAA00', '#00FFFF'].find((x) => !buildTheme({ brand: x, shape: 'rounded', density: 'default', dark: true }).ok)
    const dir = project(viteApp())
    const before = snapshot(dir)
    const r = await go(dir, ['--yes', '--brand', bad])
    expect(r.code).toBe(1)
    expect(r.err).toMatch(/✖ error/)
    expect(r.calls).toEqual([])
    expect(snapshot(dir)).toEqual(before)
  })
  it('existente y válida: con --yes se conserva byte a byte y --brand se ignora con aviso', async () => {
    const conf = '{"brand":"#2563EB",  "shape":"pill"}'
    const dir = project(viteApp({ 'grana.config.json': conf }))
    const r = await go(dir, ['--yes', '--brand', '#7A1F5C', '--no-dark'])
    expect(r.code).toBe(0)
    expect(file(dir, 'grana.config.json')).toBe(conf)
    expect(r.err).toContain('⚠ Se ignoró --brand: ya existe grana.config.json; edítalo para cambiar el tema.')
    expect(r.err).toContain('⚠ Se ignoró --no-dark')
    expect(r.out).toContain('Orden equivalente: npx @grana/cli init --yes\n')
    expect(r.out).toContain('brand #2563EB')
  })
  it.each([['JSON roto', '{ "brand": '], ['clave desconocida', '{ "color": "#fff" }']])('existente e inválida (%s) → 2', async (_, conf) => {
    const dir = project(viteApp({ 'grana.config.json': conf }))
    const r = await go(dir, ['--yes'])
    expect(r.code).toBe(2)
    expect(r.calls).toEqual([])
    expect(file(dir, 'grana.config.json')).toBe(conf)
  })
})

describe('init · terminal, cancelación y gestor (criterios 14 y 15)', () => {
  it('sin TTY y sin --yes → 2 sin esperar entrada', async () => {
    const dir = project(viteApp())
    const stdin = new PassThrough() // nunca termina: si se esperara, la prueba colgaría
    const err = []
    const code = await run(['init'], { cwd: dir, out: () => {}, err: (s) => err.push(s), version: V, stdin, isTTY: false, spawn: () => { throw new Error('no') } })
    expect(code).toBe(2)
    expect(err.join('')).toMatch(/Sin terminal interactiva: usa --yes/)
  })
  it('interactivo: cuatro preguntas, respuesta inválida repetida, confirmaciones', async () => {
    const dir = project(viteApp())
    const r = await go(dir, [], { input: 'morado\n#7a1f5c\nsquare\npill\n\nn\n\n\n\n\n' })
    expect(r.code, r.err).toBe(0)
    expect(r.err).toMatch(/«brand» debe ser un color hex/)
    expect(r.err).toMatch(/«shape» debe ser "rounded" o "pill"/)
    expect(JSON.parse(file(dir, 'grana.config.json'))).toEqual({ brand: '#7A1F5C', shape: 'pill', density: 'default', dark: false })
    expect(r.out).toContain('Color de marca (hex; vacío = el de Grana) []: ')
    expect(r.out).toContain('¿Instalar? [S/n]')
    expect(r.out).toContain('¿Aplicar a src/main.js? [S/n]')
    expect(r.out).toContain('--no-dark')
  })
  it('interactivo: rechazar un archivo lo deja intacto y lo pasa a pasos a mano (6)', async () => {
    const dir = project(viteApp())
    // marca, forma, densidad, oscuro, instalar, grana.config.json, src/main.js (no), vite.config.js
    const r = await go(dir, [], { input: '\n\n\n\n\n\nn\n\n' })
    expect(r.code).toBe(6)
    expect(file(dir, 'src/main.js')).toBe(MAIN_JS)
    expect(r.err).toMatch(/src\/main\.js: rechazado/)
  })
  it('interactivo: un tema bajo un mínimo vuelve a preguntar la marca', async () => {
    const dir = project(viteApp({ 'grana.config.json': null }))
    // Busca una marca que el motor rechace (on-solid); si no la hay, la prueba no aplica
    const { buildTheme } = await import('../src/index.js')
    const bad = ['#FFFF00', '#00FF00', '#FFAA00', '#00FFFF', '#AAAAAA'].find((b) => !buildTheme({ brand: b, shape: 'rounded', density: 'default', dark: true }).ok)
    expect(bad).toBeTruthy()
    const r = await go(dir, [], { input: `${bad}\n\n\n\n\n\n\n\n\n\n` })
    expect(r.code, r.err).toBe(0)
    expect(r.err).toContain('Elige otro color o pulsa Intro para el de Grana.')
    expect(JSON.parse(file(dir, 'grana.config.json')).brand).toBeUndefined()
  })
  it('interactivo con configuración existente: «n» a mantenerla rehace las preguntas y enseña el diff', async () => {
    const dir = project(viteApp({ 'grana.config.json': '{ "shape": "pill" }\n' }))
    const r = await go(dir, [], { input: 'n\n#2563EB\n\n\n\n\n\n\n\n' })
    expect(r.code, r.err).toBe(0)
    expect(r.out).toContain('Ya existe grana.config.json. ¿Mantenerlo? [S/n]')
    expect(r.out).toContain('--- a/grana.config.json\n+++ b/grana.config.json')
    expect(JSON.parse(file(dir, 'grana.config.json'))).toEqual({ brand: '#2563EB', shape: 'rounded', density: 'default', dark: true })
  })
  it('«n» a la instalación → 5, nada escrito', async () => {
    const dir = project(viteApp())
    const before = snapshot(dir)
    const r = await go(dir, [], { input: '\n\n\n\nn\n' })
    expect(r.code).toBe(5)
    expect(r.calls).toEqual([])
    expect(snapshot(dir)).toEqual(before)
  })
  it('Ctrl+D / fin de la entrada durante las preguntas → 5, nada escrito', async () => {
    const dir = project(viteApp())
    const before = snapshot(dir)
    const r = await go(dir, [], { input: '#7A1F5C\n' })
    expect(r.code).toBe(5)
    expect(r.err).toMatch(/Cancelado/)
    expect(snapshot(dir)).toEqual(before)
  })
  it('falla el gestor → 4, ningún archivo escrito, con la sugerencia de --from', async () => {
    const dir = project(viteApp())
    const before = snapshot(dir)
    const calls = []
    const r = await go(dir, ['--yes'], { spawn: fakePm(calls, { status: 1 }) })
    expect(r.code).toBe(4)
    expect(calls).toHaveLength(1)
    expect(r.err).toMatch(/No se escribió ningún archivo/)
    expect(r.err).toMatch(/prueba con --from <dir>/)
    expect(snapshot(dir)).toEqual(before)
  })
  it('--from sin grana-cli-*.tgz → 4 antes de instalar', async () => {
    const dir = project(viteApp({ 'tgz/grana-vue-0.1.0-beta.0.tgz': 'x' }))
    const before = snapshot(dir)
    const r = await go(dir, ['--yes', '--from', 'tgz'])
    expect(r.code).toBe(4)
    expect(r.err).toMatch(/no hay grana-cli-<versión>\.tgz/)
    expect(r.calls).toEqual([])
    expect(snapshot(dir)).toEqual(before)
  })
  it('--from: la versión del CLI, o la única; varias sin coincidencia → 4', async () => {
    let dir = project(viteApp({ 'tgz/grana-vue-0.1.0-beta.0.tgz': 'x', 'tgz/grana-vue-0.0.9.tgz': 'x', 'tgz/grana-cli-0.0.1.tgz': 'x' }))
    let r = await go(dir, ['--yes', '--from', 'tgz'])
    expect(r.code, r.err).toBe(0)
    expect(r.calls[0][2]).toBe(join(dir, 'tgz/grana-vue-0.1.0-beta.0.tgz'))
    expect(r.calls[1][3]).toBe(join(dir, 'tgz/grana-cli-0.0.1.tgz'))
    expect(r.err).toContain('package.json apunta a archivos locales (file:…)')
    expect(JSON.parse(file(dir, 'package.json')).dependencies['@grana/vue']).toMatch(/^file:/)
    dir = project(viteApp({ 'tgz/grana-vue-0.0.8.tgz': 'x', 'tgz/grana-vue-0.0.9.tgz': 'x', 'tgz/grana-cli-0.1.0-beta.0.tgz': 'x' }))
    r = await go(dir, ['--yes', '--from', 'tgz'])
    expect(r.code).toBe(4)
    expect(r.err).toMatch(/varias versiones de @grana\/vue .*0\.0\.8, 0\.0\.9/)
  })
})

describe('init · --dry-run y salidas (criterio 16)', () => {
  it('no escribe ni instala; stdout solo diffs, órdenes y resumen; avisos por stderr; código de la ejecución real', async () => {
    const dir = project(viteApp({ 'package.json': json({ ...PKG, dependencies: { vue: '^3.4.0' } }) }))
    const before = snapshot(dir)
    const r = await go(dir, ['--yes', '--dry-run', '--brand', '#7A1F5C'])
    expect(r.code).toBe(0)
    expect(r.calls).toEqual([])
    expect(snapshot(dir)).toEqual(before)
    expect(r.out).not.toMatch(/[⚠✖]/)
    expect(r.err).toMatch(/⚠/)
    expect(r.out).toContain(`npm install @grana/vue@${V}`)
    expect(r.out).toContain(`npm install -D @grana/cli@${V}`)
    expect(r.out).toContain('+++ b/vite.config.js')
    expect(r.out).toContain('Simulación (--dry-run)')
    // Con pasos a mano, el código sería 6 (nunca 5)
    const dir2 = project(viteApp({ 'vite.config.js': null }))
    expect((await go(dir2, ['--yes', '--dry-run'])).code).toBe(6)
  })
})

describe('init · opciones, peso e importaciones (criterio 17, §1, §13)', () => {
  it('el registro por defecto es una sola constante: named', () => {
    expect(REGISTER_DEFAULT).toBe('named')
    expect(parseInit([]).register).toBe(REGISTER_DEFAULT)
    expect(parseInit(['--register=global']).register).toBe('global')
  })
  it('theme, check y el plugin no cargan init (import() solo en cli.js)', () => {
    const src = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8')
    for (const f of readdirSync(new URL('../src/', import.meta.url)).filter((f) => f.endsWith('.js'))) {
      const text = src(f)
      if (f === 'cli.js') {
        expect(text).not.toMatch(/^import .*init/m)
        expect(text).toContain("import('./init/index.js')")
      } else expect(text, f).not.toMatch(/init\//)
    }
  })
  it('sin dependencias de producción; vite.d.ts publicado en exports["./vite"]', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
    expect(pkg.dependencies).toBeUndefined()
    expect(pkg.exports['./vite']).toEqual({ types: './src/vite.d.ts', default: './src/vite.js' })
    expect(readFileSync(new URL('../src/vite.d.ts', import.meta.url), 'utf8')).toMatch(/import type \{ Plugin \} from 'vite'/)
    for (const f of readdirSync(new URL('../src/init/', import.meta.url))) {
      for (const m of readFileSync(new URL(`../src/init/${f}`, import.meta.url), 'utf8').matchAll(/^import [^'\n]*?from '([^']+)'/gm)) expect(m[1], f).toMatch(/^(node:|\.)/)
    }
  })
  it('diff unificado: archivo nuevo y cambio con contexto', () => {
    expect(unifiedDiff(null, 'a\nb\n', 'x.txt')).toBe('--- /dev/null\n+++ b/x.txt\n@@ -0,0 +1,2 @@\n+a\n+b\n')
    expect(unifiedDiff('1\n2\n3\n4\n5\n6\n7\n8\n', '1\n2\n3\n4\nX\n5\n6\n7\n8\n', 'f')).toBe('--- a/f\n+++ b/f\n@@ -2,6 +2,7 @@\n 2\n 3\n 4\n+X\n 5\n 6\n 7\n')
  })
  it('run devuelve número para theme/check y promesa para init', () => {
    const quiet = { out: () => {}, err: () => {} }
    expect(typeof run(['check'], quiet)).toBe('number')
    const p = run(['init', '--help'], quiet)
    expect(p).toBeInstanceOf(Promise)
    return p.then((c) => expect(c).toBe(0))
  })
})
