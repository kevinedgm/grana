// @vitest-environment node
// Tipos de @grana/blocks/marketing (dueño: bruno; _comun.md §6, #443, #815). Comprueba, sin depender de dist/:
//   1. que el generador escribe un Gb<Sección>Props por sección y cada variante con ese mismo tipo, y amplía GlobalComponents;
//   2. que se detiene ante una variante sin exportar, una exportación sin meta.json o un tipo que no sabe leer;
//   3. que el banco de cada sección compila como su Props y que un campo de §2 mal escrito falla (vue-tsc sobre
//      types/test/main.ts, types/test/App.vue y un archivo generado con los bancos).
import { describe, it, expect, beforeAll } from 'vitest'
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'
import { buildMarketingTypes, checkTs, exportedNames, generateMarketingTypes, handTypes, readSectionMetas } from '../scripts/marketing-types.mjs'

const ROOT = resolve(process.cwd())
const OUT = join(ROOT, 'node_modules/.cache/grana-blocks-types')
const VUE_DIST = resolve(ROOT, '../vue/dist')
let generated
beforeAll(() => {
  rmSync(OUT, { recursive: true, force: true })
  buildMarketingTypes({ root: ROOT, outDir: OUT })
  generated = readFileSync(join(OUT, 'marketing.d.ts'), 'utf8')
})

describe('generador de tipos de Marketing', () => {
  it('un Gb<Sección>Props por sección y cada variante con ese tipo', () => {
    for (const meta of readSectionMetas(ROOT)) {
      expect(generated).toContain(`export interface ${meta.name}Props {`)
      for (const v of meta.variants) expect(generated).toContain(`export declare const ${v.name}: BlockComponent<${meta.name}Props, ${meta.name}Emits, ${meta.name}Slots>`)
    }
  })
  it('cada prop del meta.json con su obligatoriedad', () => {
    for (const meta of readSectionMetas(ROOT)) {
      const body = generated.slice(generated.indexOf(`export interface ${meta.name}Props {`))
      const block = body.slice(0, body.indexOf('\n}\n'))
      for (const p of meta.props) expect(block, `${meta.name}.${p.name}`).toMatch(new RegExp(`\\n  ${p.name}${p.required ? '' : '\\?'}: `))
    }
  })
  it('reexporta los tipos a mano y amplía GlobalComponents con todas las variantes', () => {
    expect(generated).toContain("export type * from './types/marketing.js'")
    expect(readFileSync(join(OUT, 'types/marketing.d.ts'), 'utf8')).toBe(readFileSync(join(ROOT, 'types/marketing.d.ts'), 'utf8'))
    for (const meta of readSectionMetas(ROOT)) for (const v of meta.variants) expect(generated).toContain(`    ${v.name}: typeof ${v.name}\n`)
    expect(generated).toContain('export declare const marketing: { install(app: App): void }')
  })
  it('los tipos a mano no admiten firmas de índice', () => {
    expect(readFileSync(join(ROOT, 'types/marketing.d.ts'), 'utf8').replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, '')).not.toMatch(/\[key: string\]/)
  })
  it('checkTs rechaza un nombre desconocido, any y firmas de índice', () => {
    const known = handTypes(ROOT)
    expect(checkTs('Feature[]', known, 'x')).toBe('Feature[]')
    expect(checkTs('{ value: string | number; label: string; media: Media }[]', known, 'x')).toBeTruthy()
    expect(() => checkTs('Featur[]', known, 'x')).toThrow(/Featur/)
    expect(() => checkTs('any', known, 'x')).toThrow()
    expect(() => checkTs('{ [key: string]: unknown }', known, 'x')).toThrow()
  })
  it('exportedNames lee export { … } y export const', () => {
    expect([...exportedNames("export { A, B as C }\n// export { X }\nexport const marketing = {}")].sort()).toEqual(['A', 'C', 'marketing'])
  })
  it('se detiene ante una variante sin exportar o una exportación sin meta.json', () => {
    const tmp = join(OUT, 'roto')
    for (const [js, msg] of [
      ["import GbHero01 from 'x'\nexport { GbHero01 }\nexport const marketing = {}", /no exporta «Gb\w+0\d»/],
      ["export { GbHero01, GbHero02, GbHero03, GbFeatures01, GbFeatures02, GbFeatures03, GbStats01, GbStats02, GbStats03, GbOtra01 }\nexport const marketing = {}", /GbOtra01/]
    ]) {
      rmSync(tmp, { recursive: true, force: true })
      mkdirSync(join(tmp, 'src'), { recursive: true })
      cpSync(join(ROOT, 'types'), join(tmp, 'types'), { recursive: true })
      cpSync(join(ROOT, 'src/blocks'), join(tmp, 'src/blocks'), { recursive: true, filter: (f) => !/\.(vue|js)$/.test(f) || f.endsWith('blocks') })
      writeFileSync(join(tmp, 'src/marketing.js'), js)
      expect(() => generateMarketingTypes({ root: tmp })).toThrow(msg)
    }
  })
})

describe('uso con vue-tsc', () => {
  it('los bancos compilan como su Props; main.ts y App.vue compilan; cada uso erróneo marcado falla', async () => {
    // Los bancos, como literales con el tipo de su sección (comprobación de propiedades de más incluida)
    let banks = "import type { GbHeroProps, GbFeaturesProps, GbStatsProps } from '@grana/blocks/marketing'\n"
    for (const [name, file] of [['Hero', 'GbHero/hero.bank.js'], ['Features', 'GbFeatures/features.bank.js'], ['Stats', 'GbStats/stats.bank.js']]) {
      const bank = await import(/* @vite-ignore */ join(ROOT, 'src/blocks', file))
      banks += `export const ${name.toLowerCase()}: Gb${name}Props = ${JSON.stringify(bank.props)}\n`
    }
    writeFileSync(join(OUT, 'banks.ts'), banks)
    writeFileSync(join(OUT, 'tsconfig.json'), JSON.stringify({
      compilerOptions: {
        target: 'ES2022', module: 'ESNext', moduleResolution: 'Bundler', strict: true, noEmit: true, lib: ['ES2022', 'DOM', 'DOM.Iterable'], types: [],
        baseUrl: '.', paths: { '@grana/blocks/marketing': ['./marketing.d.ts'], '@grana/vue/price': [join(VUE_DIST, 'price.d.ts')] }
      },
      include: [join(OUT, 'banks.ts'), join(ROOT, 'types/test/main.ts'), join(ROOT, 'types/test/App.vue')]
    }))
    const bin = createRequire(import.meta.url).resolve('vue-tsc/bin/vue-tsc.js')
    let output = ''
    try {
      execFileSync(process.execPath, [bin, '-p', join(OUT, 'tsconfig.json')], { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' })
    } catch (err) {
      output = `${err.stdout || ''}${err.stderr || ''}` || String(err)
    }
    expect(output).toBe('')
  }, 120000)
})
