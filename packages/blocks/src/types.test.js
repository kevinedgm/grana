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
import { buildFamilyTypes, generateFamilyTypes, handTypes as familyHand, readSectionMetas as familyMetas } from '../scripts/section-types.mjs'

const ROOT = resolve(process.cwd())
const OUT = join(ROOT, 'node_modules/.cache/grana-blocks-types')
const VUE_DIST = resolve(ROOT, '../vue/dist')
let generated
beforeAll(() => {
  rmSync(OUT, { recursive: true, force: true })
  buildMarketingTypes({ root: ROOT, outDir: OUT })
  buildFamilyTypes({ root: ROOT, outDir: OUT, family: 'booking' })
  generated = readFileSync(join(OUT, 'marketing.d.ts'), 'utf8')
})

describe('generador de tipos de Booking (§19, #860)', () => {
  it('un Gb<Sección>Props por sección de booking, cada variante con ese tipo y GlobalComponents', () => {
    const b = readFileSync(join(OUT, 'booking.d.ts'), 'utf8')
    const metas = familyMetas(ROOT, 'booking')
    expect(metas.length).toBeGreaterThanOrEqual(4)
    for (const meta of metas) {
      expect(b).toContain(`export interface ${meta.name}Props {`)
      for (const v of meta.variants) {
        expect(b).toContain(`export declare const ${v.name}: BlockComponent<${meta.name}Props, ${meta.name}Emits, ${meta.name}Slots>`)
        expect(b).toContain(`    ${v.name}: typeof ${v.name}\n`)
      }
      for (const p of meta.props) expect(b).toMatch(new RegExp(`\\n  ${p.name}${p.required ? '' : '\\?'}: `))
    }
    expect(b).toContain("export type * from './types/booking.js'")
    expect(b).toContain('export declare const booking: { install(app: App): void }')
    // Booking no declara Marketing ni al revés
    expect(b).not.toContain('GbHero01')
    expect(generated).not.toContain('GbOfferList01')
    expect(readFileSync(join(OUT, 'types/booking.d.ts'), 'utf8')).toBe(readFileSync(join(ROOT, 'types/booking.d.ts'), 'utf8'))
  })
  it('el slot de plantilla field-{name} es una firma con plantilla de cadena', () => {
    expect(readFileSync(join(OUT, 'booking.d.ts'), 'utf8')).toContain('[slot: `field-${string}`]: (props: GuestFieldSlot) => BlockSlotContent')
  })
  it('los tipos a mano de Booking leen los reexportados y no admiten firmas de índice', () => {
    const known = familyHand(ROOT, 'booking')
    for (const n of ['Media', 'Action', 'NavLink', 'BookingQuery', 'PriceSpec', 'Offer', 'GuestField', 'Photo', 'PartyRow']) expect(known.has(n), n).toBe(true)
    expect(readFileSync(join(ROOT, 'types/booking.d.ts'), 'utf8').replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, '')).not.toMatch(/\[key: string\]/)
    expect(checkTs("'confirmed' | 'requested'", known, 'x')).toBeTruthy()
  })
  it('se detiene ante una variante de booking sin exportar', () => {
    const tmp = join(OUT, 'roto-booking')
    rmSync(tmp, { recursive: true, force: true })
    mkdirSync(join(tmp, 'src'), { recursive: true })
    cpSync(join(ROOT, 'types'), join(tmp, 'types'), { recursive: true })
    cpSync(join(ROOT, 'src/blocks'), join(tmp, 'src/blocks'), { recursive: true, filter: (f) => !/\.(vue|js)$/.test(f) || f.endsWith('blocks') })
    writeFileSync(join(tmp, 'src/booking.js'), "export { GbSearch01 }\nexport const booking = {}")
    expect(() => generateFamilyTypes({ root: tmp, family: 'booking' })).toThrow(/no exporta «Gb\w+0\d»/)
  })
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
      // Todas las variantes de los meta.json y una de más (la lista sale de los meta.json: no hay que tocarla al añadir una sección)
      [`export { ${readSectionMetas(ROOT).flatMap((m) => m.variants.map((v) => v.name)).join(', ')}, GbOtra01 }\nexport const marketing = {}`, /GbOtra01/]
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
    let banks = ''
    for (const [name, file] of [
      ['Hero', 'GbHero/hero.bank.js'],
      ['Features', 'GbFeatures/features.bank.js'],
      ['Stats', 'GbStats/stats.bank.js'],
      ['Testimonials', 'GbTestimonials/testimonials.bank.js'],
      ['Cta', 'GbCta/cta.bank.js'],
      ['Faq', 'GbFaq/faq.bank.js'],
      ['Newsletter', 'GbNewsletter/newsletter.bank.js'],
      ['BlogList', 'GbBlogList/blog-list.bank.js'],
      ['Footer', 'GbFooter/footer.bank.js']
    ]) {
      const bank = await import(/* @vite-ignore */ join(ROOT, 'src/blocks', file))
      banks += `import type { Gb${name}Props } from '@grana/blocks/marketing'\n`
      banks += `export const ${name.toLowerCase()}: Gb${name}Props = ${JSON.stringify(bank.props)}\n`
    }
    for (const [name, file] of [
      ['Search', 'GbSearch/search.bank.js'],
      ['OfferList', 'GbOfferList/offer-list.bank.js'],
      ['GuestForm', 'GbGuestForm/guest-form.bank.js'],
      ['Confirmation', 'GbConfirmation/confirmation.bank.js'],
      ['Itinerary', 'GbItinerary/itinerary.bank.js'],
      ['Location', 'GbLocation/location.bank.js'],
      ['Policies', 'GbPolicies/policies.bank.js'],
      ['OfferDetail', 'GbOfferDetail/offer-detail.bank.js']
    ]) {
      const bank = await import(/* @vite-ignore */ join(ROOT, 'src/blocks', file))
      // Las funciones (filas del grupo, noches contadas, reglas de días) no pasan por JSON: van como `null as never`, que
      // encaja en cualquier tipo de función (lo demás del banco se comprueba entero); la escucha de submit no es una prop
      const { onSubmit: _s, ...data } = bank.props
      const json = JSON.stringify(data, (_k, v) => (typeof v === 'function' ? '__fn__' : v)).replace(/"__fn__"/g, '(null as never)')
      banks += `import type { Gb${name}Props } from '@grana/blocks/booking'\n`
      banks += `export const booking${name}: Gb${name}Props = ${json}\n`
    }
    writeFileSync(join(OUT, 'banks.ts'), banks)
    writeFileSync(join(OUT, 'tsconfig.json'), JSON.stringify({
      compilerOptions: {
        target: 'ES2022', module: 'ESNext', moduleResolution: 'Bundler', strict: true, noEmit: true, lib: ['ES2022', 'DOM', 'DOM.Iterable'], types: [],
        baseUrl: '.', paths: {
          '@grana/blocks/marketing': ['./marketing.d.ts'],
          '@grana/blocks/booking': ['./booking.d.ts'],
          '@grana/vue': [join(VUE_DIST, 'grana.d.ts')],
          '@grana/vue/*': [join(VUE_DIST, '*.d.ts')]
        }
      },
      include: [join(OUT, 'banks.ts'), join(ROOT, 'types/test/main.ts'), join(ROOT, 'types/test/booking.ts'), join(ROOT, 'types/test/App.vue')]
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
