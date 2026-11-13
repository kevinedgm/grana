import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { run } from '../src/cli.js'

const VERSION = '1.2.3'
let root
let dir
beforeEach(() => { root = mkdtempSync(join(tmpdir(), 'grana-init-')); dir = root })
afterEach(() => rmSync(root, { recursive: true, force: true }))

const put = (name, content, base = dir) => {
  mkdirSync(join(base, name, '..'), { recursive: true })
  writeFileSync(join(base, name), typeof content === 'string' ? content : JSON.stringify(content))
}
const pkgWith = (extra = {}) => ({ name: 'app', ...extra })
const vue = (v = '^3.5.0') => ({ dependencies: { vue: v } })

/** Ejecuta `grana init` sin red: `exec` registra las órdenes y devuelve lo que se le pida. */
const init = (args = [], { results = [], env = {}, cwd = dir } = {}) => {
  let out = ''
  let err = ''
  const calls = []
  const exec = (cmd, a, opts) => {
    calls.push({ cmd, args: a, cwd: opts.cwd })
    return results[calls.length - 1] ?? { status: 0 }
  }
  const code = run(['init', ...args], { cwd, out: (s) => (out += s), err: (s) => (err += s), version: VERSION, exec, env })
  return { code, out, err, calls, line: (i) => [calls[i].cmd, ...calls[i].args].join(' ') }
}
const files = (d = dir) => ['grana.config.json', 'tokens.css'].filter((f) => existsSync(join(d, f)))

describe('init · gestor (I2)', () => {
  beforeEach(() => put('package.json', pkgWith(vue())))

  it('--pm manda sobre todo', () => {
    put('pnpm-lock.yaml', '')
    const r = init(['--pm', 'yarn'])
    expect(r.code).toBe(0)
    expect(r.calls[0].cmd).toBe('yarn')
    expect(r.out).toContain('Gestor: yarn, por --pm')
  })

  it('packageManager gana al bloqueo, con aviso del desacuerdo; nombre desconocido → 2', () => {
    put('package.json', pkgWith({ ...vue(), packageManager: 'pnpm@9.1.0+sha256.abc' }))
    put('yarn.lock', '')
    const r = init()
    expect(r.calls[0].cmd).toBe('pnpm')
    expect(r.out).toContain('packageManager dice pnpm')
    put('package.json', pkgWith({ ...vue(), packageManager: 'deno@2.0.0' }))
    const bad = init()
    expect(bad.code).toBe(2)
    expect(bad.err).toContain('--pm')
    expect(bad.calls).toHaveLength(0)
  })

  it('packageManager de la raíz del workspace cuando el paquete no lo tiene', () => {
    put('package.json', pkgWith({ workspaces: ['apps/*'], packageManager: 'bun@1.1.0' }), root)
    const app = join(root, 'apps', 'web')
    put('package.json', pkgWith(vue()), app)
    const r = init([], { cwd: app })
    expect(r.code).toBe(0)
    expect(r.calls[0].cmd).toBe('bun')
    expect(r.calls[0].cwd).toBe(app)
    expect(r.out).toContain('Workspace: paquete dentro de ../..')
  })

  it.each([
    ['pnpm-lock.yaml', 'pnpm'], ['yarn.lock', 'yarn'], ['bun.lock', 'bun'], ['bun.lockb', 'bun'],
    ['package-lock.json', 'npm'], ['npm-shrinkwrap.json', 'npm']
  ])('archivo de bloqueo %s → %s', (file, pm) => {
    put(file, '')
    const r = init()
    expect(r.calls[0].cmd).toBe(pm)
    expect(r.out).toContain(`por ${file}`)
  })

  it('bloqueo buscado hacia arriba, sin pasar de un directorio con .git', () => {
    put('pnpm-lock.yaml', '', root)
    const app = join(root, 'packages', 'app')
    put('package.json', pkgWith(vue()), app)
    expect(init([], { cwd: app }).calls[0].cmd).toBe('pnpm')
    mkdirSync(join(root, 'packages', '.git'))
    expect(init([], { cwd: app }).calls[0].cmd).toBe('npm')
  })

  it('dos gestores distintos en el mismo directorio → 2 sin instalar; npm y shrinkwrap juntos no son ambiguos', () => {
    put('pnpm-lock.yaml', '')
    put('yarn.lock', '')
    const r = init()
    expect(r.code).toBe(2)
    expect(r.err).toContain('varios archivos de bloqueo')
    expect(r.calls).toHaveLength(0)
    rmSync(join(dir, 'pnpm-lock.yaml'))
    rmSync(join(dir, 'yarn.lock'))
    put('package-lock.json', '')
    put('npm-shrinkwrap.json', '')
    expect(init().code).toBe(0)
  })

  it('npm_config_user_agent va detrás del bloqueo; sin nada, npm', () => {
    expect(init([], { env: { npm_config_user_agent: 'pnpm/9.0.0 npm/? node/v22 linux x64' } }).calls[0].cmd).toBe('pnpm')
    expect(init([], { env: { npm_config_user_agent: 'bun/1.1.0 npm/? node/v22' } }).calls[0].cmd).toBe('bun')
    put('yarn.lock', '')
    expect(init([], { env: { npm_config_user_agent: 'pnpm/9.0.0' } }).calls[0].cmd).toBe('yarn')
    rmSync(join(dir, 'yarn.lock'))
    const r = init()
    expect(r.calls[0].cmd).toBe('npm')
    expect(init([], { env: { npm_config_user_agent: 'deno/2' } }).calls[0].cmd).toBe('npm')
  })

  it('la raíz de un workspace (workspaces o pnpm-workspace.yaml) → 2', () => {
    put('package.json', pkgWith({ ...vue(), workspaces: ['packages/*'] }))
    const a = init()
    expect(a.code).toBe(2)
    expect(a.err).toContain('raíz de un workspace')
    put('package.json', pkgWith(vue()))
    put('pnpm-workspace.yaml', 'packages:\n  - "packages/*"\n')
    expect(init().code).toBe(2)
    expect(init().calls).toHaveLength(0)
  })
})

describe('init · instalación (I3)', () => {
  beforeEach(() => put('package.json', pkgWith({})))

  it.each([
    ['npm', 'npm install @grana/vue@^1.0.0 vue@^3.5.0', 'npm install --save-dev @grana/cli@^1.2.3'],
    ['pnpm', 'pnpm add @grana/vue@^1.0.0 vue@^3.5.0', 'pnpm add --save-dev @grana/cli@^1.2.3'],
    ['yarn', 'yarn add @grana/vue@^1.0.0 vue@^3.5.0', 'yarn add --dev @grana/cli@^1.2.3'],
    ['bun', 'bun add @grana/vue@^1.0.0 vue@^3.5.0', 'bun add --dev @grana/cli@^1.2.3']
  ])('órdenes exactas con %s (sin Vue: lo añade con aviso)', (pm, deps, dev) => {
    const r = init(['--pm', pm])
    expect(r.code).toBe(0)
    expect(r.calls).toHaveLength(2)
    expect(r.line(0)).toBe(deps)
    expect(r.line(1)).toBe(dev)
    expect(r.out).toContain('No hay vue en el proyecto')
    expect(r.out).toContain(`$ ${deps}`)
  })

  it('ya instalado: no se reinstala ni se cambia el rango; se omiten las órdenes vacías', () => {
    put('package.json', pkgWith({ dependencies: { vue: '^3.5.0', '@grana/vue': '^1.4.0' }, devDependencies: { '@grana/cli': '^1.0.0' } }))
    const r = init()
    expect(r.calls).toHaveLength(0)
    expect(r.out).toContain('@grana/vue ya está: ^1.4.0')
    expect(r.out).toContain('@grana/cli ya está: ^1.0.0')
    expect(r.out).toContain('No hace falta instalar nada')
    expect(r.code).toBe(0)
  })

  it('declarado en peerDependencies cuenta; una orden sola si falta solo una', () => {
    put('package.json', pkgWith({ peerDependencies: { '@grana/vue': '^1.0.0' }, dependencies: { vue: '^3.5.0' } }))
    const r = init()
    expect(r.calls).toHaveLength(1)
    expect(r.line(0)).toBe('npm install --save-dev @grana/cli@^1.2.3')
  })

  it('mayor declarada distinta de la del CLI → aviso y no se toca', () => {
    put('package.json', pkgWith({ dependencies: { vue: '^3.5.0', '@grana/vue': '^0.1.0-beta.0' }, devDependencies: { '@grana/cli': '^1.0.0' } }))
    const r = init()
    expect(r.code).toBe(0)
    expect(r.out).toContain('no es de la mayor 1')
    expect(r.calls).toHaveLength(0)
  })

  it('nunca pasa por shell: los argumentos son nombres y rangos fijos; el ejecutor recibe el cwd', () => {
    const r = init(['--brand', '#7A1F5C'])
    for (const c of r.calls) { expect(c.cwd).toBe(dir); expect(c.args.join(' ')).not.toContain('7A1F5C') }
  })
})

describe('init · Vue (I1.3)', () => {
  it.each([
    [{ dependencies: { vue: '^2.7.16' } }, 'vue ^3.5.0; tienes 2.7.16'],
    [{ devDependencies: { vue: '~3.4.21' } }, 'tienes 3.4.21'],
    [{ peerDependencies: { vue: '>=3.0.0 <4' } }, 'tienes 3.0.0']
  ])('Vue incompatible declarado %j → 2 sin instalar', (extra, msg) => {
    put('package.json', pkgWith(extra))
    const r = init()
    expect(r.code).toBe(2)
    expect(r.err).toContain(msg)
    expect(r.calls).toHaveLength(0)
    expect(files()).toEqual([])
  })

  it('Vue 3.5 declarado pasa', () => {
    put('package.json', pkgWith({ dependencies: { vue: '^3.5.13' } }))
    expect(init().code).toBe(0)
  })

  it('la versión instalada en node_modules manda sobre el rango declarado', () => {
    put('package.json', pkgWith({ dependencies: { vue: '^3.5.0' } }))
    put('node_modules/vue/package.json', { name: 'vue', version: '3.4.0' })
    const r = init()
    expect(r.code).toBe(2)
    expect(r.err).toContain('3.4.0 (instalado)')
    put('node_modules/vue/package.json', { name: 'vue', version: '3.5.2' })
    expect(init().code).toBe(0)
  })

  it.each(['latest', 'workspace:*', 'github:vuejs/core#v3.4', 'https://x.test/vue.tgz', 'next'])('rango ilegible «%s» → aviso y sigue', (range) => {
    put('package.json', pkgWith({ dependencies: { vue: range } }))
    const r = init()
    expect(r.code).toBe(0)
    expect(r.out).toContain('No se pudo leer la versión de vue')
    expect(r.calls.every((c) => !c.args.includes('vue@^3.5.0'))).toBe(true)
  })

  it('sin Vue: instala vue@^3.5.0 con aviso', () => {
    put('package.json', pkgWith({}))
    const r = init()
    expect(r.line(0)).toContain('vue@^3.5.0')
    expect(r.out).toContain('init no prepara un empaquetador')
  })
})

describe('init · precondiciones (I1) y uso', () => {
  it('sin package.json → 2 con la orden para crear un proyecto, según el gestor', () => {
    const r = init()
    expect(r.code).toBe(2)
    expect(r.err).toContain('añade Grana a un proyecto existente')
    expect(r.err).toContain('npm create vue@latest')
    expect(init(['--pm', 'pnpm']).err).toContain('pnpm create vue@latest')
    expect(r.calls).toHaveLength(0)
  })

  it('package.json que no es JSON → 2', () => {
    put('package.json', '{ roto')
    const r = init()
    expect(r.code).toBe(2)
    expect(r.err).toContain('package.json')
  })

  it('opción desconocida, valor ausente o fuera de la lista, argumento posicional → 2 con la ayuda', () => {
    put('package.json', pkgWith(vue()))
    for (const args of [['--nope'], ['--pm'], ['--pm', 'deno'], ['--theme', 'css'], ['--brand'], ['--out', '--force'], ['algo'], ['--dry-run=1']]) {
      const r = init(args)
      expect(r.code, args.join(' ')).toBe(2)
      expect(r.err).toContain('grana init')
      expect(r.calls).toHaveLength(0)
    }
  })

  it('--help lista init y sale con 0; la ayuda general también', () => {
    let out = ''
    expect(run(['init', '--help'], { out: (s) => (out += s) })).toBe(0)
    expect(out).toContain('grana init')
    expect(out).toContain('3 (solo init)')
    expect(run(['--help'], { out: (s) => (out += s) })).toBe(0)
  })

  it('--opción=valor funciona', () => {
    put('package.json', pkgWith(vue()))
    expect(init(['--pm=bun']).calls[0].cmd).toBe('bun')
  })
})

describe('init · tema (I4)', () => {
  beforeEach(() => put('package.json', pkgWith(vue())))

  it('sin --brand escribe {} y lo dice; con --brand válido escribe { brand }', () => {
    const a = init()
    expect(a.code).toBe(0)
    expect(readFileSync(join(dir, 'grana.config.json'), 'utf8')).toBe('{}\n')
    expect(a.out).toContain('está vacío')
    rmSync(join(dir, 'grana.config.json'))
    const b = init(['--brand', '#7A1F5C'])
    expect(b.code).toBe(0)
    expect(JSON.parse(readFileSync(join(dir, 'grana.config.json'), 'utf8'))).toEqual({ brand: '#7A1F5C' })
    expect(readFileSync(join(dir, 'grana.config.json'), 'utf8')).toBe('{\n  "brand": "#7A1F5C"\n}\n')
  })

  it('--brand inválido → 2 sin instalar ni escribir', () => {
    const r = init(['--brand', 'no-es-un-color'])
    expect(r.code).toBe(2)
    expect(r.err).toContain('brand')
    expect(r.calls).toHaveLength(0)
    expect(files()).toEqual([])
  })

  it('configuración existente que rompe un mínimo → 1, sin instalar ni escribir', () => {
    put('grana.config.json', { overrides: { '--g-focus-width': '1px' } })
    const r = init()
    expect(r.code).toBe(1)
    expect(r.err).toContain('focus-width')
    expect(r.err).toContain('Por qué')
    expect(r.calls).toHaveLength(0)
    expect(files()).toEqual(['grana.config.json'])
    expect(existsSync(join(dir, 'tokens.css'))).toBe(false)
  })

  it('configuración existente inválida o que no es JSON → 2', () => {
    put('grana.config.json', { colour: 'red' })
    expect(init().code).toBe(2)
    put('grana.config.json', '{ no es json')
    const r = init()
    expect(r.code).toBe(2)
    expect(r.err).toContain('grana.config.json')
    expect(r.calls).toHaveLength(0)
  })

  it('configuración existente + --brand → 2; con --force la sobrescribe', () => {
    put('grana.config.json', { brand: '#112233' })
    const r = init(['--brand', '#7A1F5C'])
    expect(r.code).toBe(2)
    expect(r.err).toContain('--force')
    expect(JSON.parse(readFileSync(join(dir, 'grana.config.json'), 'utf8')).brand).toBe('#112233')
    const f = init(['--brand', '#7A1F5C', '--force'])
    expect(f.code).toBe(0)
    expect(JSON.parse(readFileSync(join(dir, 'grana.config.json'), 'utf8')).brand).toBe('#7A1F5C')
  })

  it('configuración existente válida se conserva intacta y se usa para generar', () => {
    const text = '{ "brand": "#7A1F5C" }\n'
    put('grana.config.json', text)
    const r = init(['--theme', 'file'])
    expect(r.code).toBe(0)
    expect(readFileSync(join(dir, 'grana.config.json'), 'utf8')).toBe(text)
    expect(r.out).toContain('conservado')
    expect(readFileSync(join(dir, 'tokens.css'), 'utf8')).toContain('--g-color-brand: #7A1F5C;')
  })

  it('los avisos y las notas del tema se muestran y no cambian el código', () => {
    put('grana.config.json', { space: 3 })
    const r = init(['--theme', 'file'])
    expect(r.code).toBe(0)
    expect(r.out).toContain('space-small')
  })
})

describe('init · modo del tema (I5)', () => {
  it('Vite declarado o con vite.config → vite: no escribe tokens.css y muestra el plugin y el módulo virtual', () => {
    put('package.json', pkgWith({ ...vue(), devDependencies: { vite: '^6.0.0' } }))
    put('vite.config.ts', 'export default {}')
    put('src/main.ts', '')
    const r = init()
    expect(r.code).toBe(0)
    expect(existsSync(join(dir, 'tokens.css'))).toBe(false)
    expect(r.out).toContain('modo vite (por detección)')
    expect(r.out).toContain('En vite.config.ts')
    expect(r.out).toContain("import grana from '@grana/cli/vite'")
    expect(r.out).toContain("grana({ config: 'grana.config.json' })")
    expect(r.out).toContain('En src/main.ts')
    expect(r.out).toContain("import 'virtual:grana/tokens.css'")
    expect(r.out).toContain("import '@grana/vue/style.css'")
    expect(r.out).toContain("import '@grana/vue/fonts.css'")
    expect(r.out).toContain('app.use(Grana)')
    // solo con vite.config, sin vite declarado
    put('package.json', pkgWith(vue()))
    expect(init().out).toContain('modo vite')
  })

  it('con varios vite.config gana el primero del orden (js antes que ts)', () => {
    put('package.json', pkgWith({ ...vue(), devDependencies: { vite: '^6.0.0' } }))
    put('vite.config.ts', '')
    put('vite.config.js', '')
    expect(init().out).toContain('En vite.config.js')
  })

  it('Nuxt (declarado o nuxt.config) → file, con el plugin completo y css de Nuxt', () => {
    put('package.json', pkgWith({ dependencies: { vue: '^3.5.0', nuxt: '^4.0.0' }, devDependencies: { vite: '^6.0.0' } }))
    put('tsconfig.json', '{}')
    const r = init()
    expect(r.code).toBe(0)
    expect(existsSync(join(dir, 'tokens.css'))).toBe(true)
    expect(r.out).toContain('Marco: nuxt')
    expect(r.out).toContain('Crea plugins/grana.ts')
    expect(r.out).toContain('nuxtApp.vueApp.use(Grana)')
    expect(r.out).toContain("css: ['@grana/vue/style.css', '@grana/vue/fonts.css', '~~/tokens.css']")
    put('package.json', pkgWith(vue()))
    rmSync(join(dir, 'tsconfig.json'))
    put('nuxt.config.js', '')
    expect(init().out).toContain('Crea plugins/grana.js')
  })

  it('--theme vite con Nuxt está reservado → 2', () => {
    put('package.json', pkgWith({ dependencies: { vue: '^3.5.0', nuxt: '^4.0.0' } }))
    const r = init(['--theme', 'vite'])
    expect(r.code).toBe(2)
    expect(r.err).toContain('reservado')
    expect(r.calls).toHaveLength(0)
  })

  it('ni Vite ni Nuxt → file; importa el archivo relativo a la entrada y sugiere el script', () => {
    put('package.json', pkgWith(vue()))
    put('src/main.js', '')
    const r = init()
    expect(r.out).toContain('modo file (por detección)')
    expect(r.out).toContain("import '../tokens.css'")
    expect(r.out).toContain('"theme": "grana theme grana.config.json"')
    expect(r.out).toContain('init no edita tu código')
    // sin entrada
    rmSync(join(dir, 'src', 'main.js'))
    const s = init()
    expect(s.out).toContain('En tu archivo de entrada')
    expect(s.out).toContain("import './tokens.css'")
  })

  it('--theme file fuerza el archivo aunque haya Vite; --theme vite fuerza el plugin sin Vite', () => {
    put('package.json', pkgWith({ ...vue(), devDependencies: { vite: '^6' } }))
    expect(init(['--theme', 'file']).out).toContain('modo file')
    expect(existsSync(join(dir, 'tokens.css'))).toBe(true)
    rmSync(join(dir, 'tokens.css'))
    put('package.json', pkgWith(vue()))
    const r = init(['--theme', 'vite'])
    expect(r.out).toContain('modo vite')
    expect(r.out).toContain('tu archivo de configuración de Vite')
    expect(existsSync(join(dir, 'tokens.css'))).toBe(false)
  })

  it('--out cambia el archivo, el import y el script; con vite (también por auto) → 2', () => {
    put('package.json', pkgWith(vue()))
    put('src/main.ts', '')
    const r = init(['--out', 'src/styles/tema.css'])
    expect(r.code).toBe(0)
    expect(existsSync(join(dir, 'src', 'styles', 'tema.css'))).toBe(true)
    expect(r.out).toContain("import './styles/tema.css'")
    expect(r.out).toContain('--out src/styles/tema.css')
    put('package.json', pkgWith({ ...vue(), devDependencies: { vite: '^6' } }))
    const v = init(['--out', 'tema.css'])
    expect(v.code).toBe(2)
    expect(v.err).toContain('--out')
    expect(init(['--theme', 'vite', '--out', 'x.css']).code).toBe(2)
  })
})

describe('init · archivos (I6)', () => {
  beforeEach(() => put('package.json', pkgWith(vue())))

  it('un tokens.css con la cabecera de @grana/cli se regenera; uno ajeno → 2 salvo --force', () => {
    put('tokens.css', '/* Generado por @grana/cli a partir de otra.json. */\nviejo')
    const a = init(['--brand', '#7A1F5C'])
    expect(a.code).toBe(0)
    expect(a.out).toContain('regenerado')
    expect(readFileSync(join(dir, 'tokens.css'), 'utf8')).toContain('--g-color-brand')
    rmSync(join(dir, 'grana.config.json'))
    put('tokens.css', ':root { --mio: 1; }')
    const b = init()
    expect(b.code).toBe(2)
    expect(b.err).toContain('no lo generó @grana/cli')
    expect(b.calls).toHaveLength(0)
    expect(readFileSync(join(dir, 'tokens.css'), 'utf8')).toBe(':root { --mio: 1; }')
    const c = init(['--force'])
    expect(c.code).toBe(0)
    expect(readFileSync(join(dir, 'tokens.css'), 'utf8')).toContain('Generado por @grana/cli')
  })

  it('--out fuera del directorio actual, un directorio o la propia configuración → 2', () => {
    for (const out of ['../fuera.css', '/tmp/fuera-grana.css', 'grana.config.json']) {
      const r = init(['--out', out])
      expect(r.code, out).toBe(2)
      expect(r.calls).toHaveLength(0)
    }
    mkdirSync(join(dir, 'carpeta'))
    expect(init(['--out', 'carpeta']).code).toBe(2)
    expect(files()).toEqual([])
  })

  it('--force no cambia la instalación y nunca toca package.json, main ni la configuración de Vite', () => {
    put('src/main.js', '// mío')
    put('vite.config.js', '// mío')
    const before = readFileSync(join(dir, 'package.json'), 'utf8')
    const r = init(['--force'])
    expect(r.code).toBe(0)
    expect(readFileSync(join(dir, 'package.json'), 'utf8')).toBe(before)
    expect(readFileSync(join(dir, 'src', 'main.js'), 'utf8')).toBe('// mío')
    expect(readFileSync(join(dir, 'vite.config.js'), 'utf8')).toBe('// mío')
    expect(r.calls).toHaveLength(2)
  })

  it('repetir init con todo ya instalado y configurado es inocuo (0, sin órdenes)', () => {
    put('package.json', pkgWith({ dependencies: { vue: '^3.5.0', '@grana/vue': '^1.0.0' }, devDependencies: { '@grana/cli': '^1.2.3' } }))
    expect(init(['--theme', 'file', '--brand', '#7A1F5C']).code).toBe(0)
    const css = readFileSync(join(dir, 'tokens.css'), 'utf8')
    const r = init(['--theme', 'file'])
    expect(r.code).toBe(0)
    expect(r.calls).toHaveLength(0)
    expect(r.out).toContain('conservado')
    expect(readFileSync(join(dir, 'tokens.css'), 'utf8')).toBe(css)
  })
})

describe('init · fallos de instalación (I8, código 3)', () => {
  beforeEach(() => put('package.json', pkgWith({})))

  it('una orden que falla → 3, ningún archivo escrito, con las órdenes completadas y el reintento', () => {
    const r = init(['--pm', 'pnpm', '--brand', '#7A1F5C'], { results: [{ status: 0 }, { status: 1 }] })
    expect(r.code).toBe(3)
    expect(r.calls).toHaveLength(2)
    expect(files()).toEqual([])
    expect(r.err).toContain('pnpm add --save-dev @grana/cli@^1.2.3')
    expect(r.err).toContain('Ya completadas: pnpm add @grana/vue@^1.0.0 vue@^3.5.0')
    expect(r.err).toContain('package.json')
    expect(r.err).toContain('Para reintentar a mano')
  })

  it('la primera orden falla → 3 y no se lanza la segunda', () => {
    const r = init([], { results: [{ status: 1 }] })
    expect(r.code).toBe(3)
    expect(r.calls).toHaveLength(1)
    expect(r.err).toContain('No se completó ninguna orden')
    expect(r.err).toContain('npm install --save-dev @grana/cli@^1.2.3')
    expect(files()).toEqual([])
  })

  it('el gestor no existe (ENOENT) → 3 con la sugerencia de instalarlo o usar --pm', () => {
    const error = Object.assign(new Error('spawn pnpm ENOENT'), { code: 'ENOENT' })
    const r = init(['--pm', 'pnpm'], { results: [{ status: null, error }] })
    expect(r.code).toBe(3)
    expect(r.err).toContain('No se encontró el gestor «pnpm»')
    expect(r.err).toContain('--pm')
    expect(r.err).toContain('cambia el gestor del proyecto')
    expect(files()).toEqual([])
  })
})

describe('init · --no-install y --dry-run', () => {
  beforeEach(() => put('package.json', pkgWith({})))

  it('--no-install imprime las órdenes, no llama al ejecutor, escribe los archivos y deja la orden pendiente', () => {
    const r = init(['--no-install', '--pm', 'yarn', '--brand', '#7A1F5C'])
    expect(r.code).toBe(0)
    expect(r.calls).toHaveLength(0)
    expect(files()).toEqual(['grana.config.json', 'tokens.css'])
    expect(r.out).toContain('no se ejecuta: --no-install')
    expect(r.out).toContain('Instala los paquetes:')
    expect(r.out).toContain('yarn add --dev @grana/cli@^1.2.3')
  })

  it('--dry-run no escribe ni llama al ejecutor y lista lo que haría', () => {
    const r = init(['--dry-run', '--brand', '#7A1F5C'])
    expect(r.code).toBe(0)
    expect(r.calls).toHaveLength(0)
    expect(files()).toEqual([])
    expect(r.out).toContain('--dry-run')
    expect(r.out).toContain('se escribiría')
    expect(r.out).toContain('npm install @grana/vue@^1.0.0 vue@^3.5.0')
  })

  it('--dry-run da el mismo código que la ejecución real antes de instalar (1 y 2)', () => {
    put('grana.config.json', { overrides: { '--g-focus-width': '1px' } })
    expect(init(['--dry-run']).code).toBe(1)
    put('grana.config.json', { colour: 'red' })
    expect(init(['--dry-run']).code).toBe(2)
    rmSync(join(dir, 'grana.config.json'))
    put('package.json', pkgWith({ dependencies: { vue: '^2.7.0' } }))
    const r = init(['--dry-run'])
    expect(r.code).toBe(2)
    expect(r.calls).toHaveLength(0)
  })

  it('--dry-run y --no-install a la vez: manda --dry-run', () => {
    const r = init(['--dry-run', '--no-install'])
    expect(r.code).toBe(0)
    expect(files()).toEqual([])
    expect(r.out).toContain('no se ejecuta: --dry-run')
  })

  it('--dry-run con archivos existentes dice cuáles conservaría, regeneraría o sobrescribiría', () => {
    put('grana.config.json', '{ "brand": "#7A1F5C" }')
    put('tokens.css', '/* Generado por @grana/cli a partir de x */')
    const r = init(['--dry-run', '--theme', 'file'])
    expect(r.out).toContain('se conservaría')
    expect(r.out).toContain('se regeneraría')
  })
})

describe('init · siguientes pasos (I7, #1080)', () => {
  it('terminan con la línea de grana catalog --agents, antes del cierre, también con --dry-run y en Nuxt', () => {
    put('package.json', pkgWith(vue()))
    for (const args of [[], ['--dry-run']]) {
      const r = init(args)
      expect(r.code).toBe(0)
      const steps = r.out.slice(r.out.indexOf('Siguientes pasos'))
      const lines = steps.trimEnd().split('\n')
      expect(lines.at(-1)).toMatch(/^✔ /)
      expect(lines.at(-3)).toContain('npx grana catalog --agents')
      expect(r.out.match(/grana catalog --agents/g)).toHaveLength(1)
    }
    put('package.json', pkgWith({ dependencies: { vue: '^3.5.0', nuxt: '^3.0.0' } }))
    expect(init(['--dry-run']).out).toContain('npx grana catalog --agents')
  })
})

describe('init · paridad con theme', () => {
  it('el tokens.css de init --theme file es byte a byte el de grana theme', () => {
    put('package.json', pkgWith(vue()))
    put('grana.config.json', { brand: '#7A1F5C', accent: '#0F766E', radius: 12, space: 5 })
    expect(init(['--theme', 'file']).code).toBe(0)
    const fromInit = readFileSync(join(dir, 'tokens.css'), 'utf8')
    const other = mkdtempSync(join(tmpdir(), 'grana-init-theme-'))
    try {
      writeFileSync(join(other, 'grana.config.json'), readFileSync(join(dir, 'grana.config.json')))
      expect(run(['theme', 'grana.config.json'], { cwd: other, out: () => {}, err: () => {} })).toBe(0)
      expect(readFileSync(join(other, 'tokens.css'), 'utf8')).toBe(fromInit)
    } finally { rmSync(other, { recursive: true, force: true }) }
  })

  it('con --brand también coincide con theme sobre el mismo grana.config.json', () => {
    put('package.json', pkgWith(vue()))
    init(['--theme', 'file', '--brand', '#B45309'])
    const fromInit = readFileSync(join(dir, 'tokens.css'), 'utf8')
    rmSync(join(dir, 'tokens.css'))
    run(['theme', 'grana.config.json'], { cwd: dir, out: () => {}, err: () => {} })
    expect(readFileSync(join(dir, 'tokens.css'), 'utf8')).toBe(fromInit)
  })
})

describe('init · sin dependencias nuevas y binario', () => {
  it('@grana/cli no declara dependencias en producción', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
    expect(pkg.dependencies).toBeUndefined()
  })

  it('el ejecutable real: --dry-run con el ejecutor por defecto no instala nada y sale con 0; sin package.json, 2', () => {
    const bin = fileURLToPath(new URL('../bin/grana.mjs', import.meta.url))
    const none = spawnSync('node', [bin, 'init'], { cwd: dir, encoding: 'utf8' })
    expect(none.status).toBe(2)
    put('package.json', pkgWith(vue()))
    const dry = spawnSync('node', [bin, 'init', '--dry-run'], { cwd: dir, encoding: 'utf8' })
    expect(dry.status).toBe(0)
    expect(dry.stdout).toContain('Siguientes pasos')
    expect(files()).toEqual([])
  })
})
