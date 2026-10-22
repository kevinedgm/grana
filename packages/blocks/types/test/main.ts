// Uso correcto y erróneo de los tipos de @grana/blocks/marketing (src/types.test.js los comprueba con vue-tsc). Cada
// `@ts-expect-error` es un uso erróneo que DEBE fallar: si los tipos dejaran de detectarlo, vue-tsc avisaría de una
// directiva sin error.
import { createApp } from 'vue'
import { GbFeatures01, GbFeatures02, GbFeatures03, GbHero01, GbHero02, GbHero03, GbStats01, GbStats02, GbStats03, marketing } from '@grana/blocks/marketing'
import type { Action, BlockNavigate, Feature, GbFeaturesProps, GbHeroProps, GbStatsProps, Media, Money, Stat } from '@grana/blocks/marketing'

createApp({}).use(marketing)

const media: Media = { src: 'patio.jpg', width: 1600, height: 900, alt: 'Patio' }
const action: Action = { label: 'Reservar', href: '#reservar' }
const feature: Feature = { title: 'Patio', media, action }
const stat: Stat = { value: '4,8', unit: 'de 5', label: 'Calificación', source: 'Google' }
const money: Money = { amount: 1850, currency: 'MXN' }

// @ts-expect-error: un campo de Feature mal escrito falla (sin [key: string]: unknown)
const typo: Feature = { titel: 'Patio' }
// @ts-expect-error: Media sin width
const noWidth: Media = { src: 'a.jpg', height: 1 }
// @ts-expect-error: Stat sin label
const noLabel: Stat = { value: 1 }
// @ts-expect-error: Action sin label
const noActionLabel: Action = { href: '#' }

const hero: GbHeroProps = { title: 'Casa Alcalá', media, actions: [action], labels: { external: 'se abre en otra pestaña' } }
const features: GbFeaturesProps = { title: 'Por qué', items: [feature] }
const stats: GbStatsProps = { title: 'Cifras', items: [stat, stat] }
// @ts-expect-error: items es obligatorio
const noItems: GbFeaturesProps = { title: 'Por qué' }
// @ts-expect-error: labels de Hero no admite claves inventadas
const badLabels: GbHeroProps = { title: 'x', media, labels: { reservar: 'x' } }

// Las tres variantes de una sección tienen la MISMA Props
type PropsOf<C> = C extends abstract new (...args: any) => { $props: infer P } ? P : never
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
const sameHero: [Same<PropsOf<typeof GbHero01>, PropsOf<typeof GbHero02>>, Same<PropsOf<typeof GbHero02>, PropsOf<typeof GbHero03>>] = [true, true]
const sameFeatures: [Same<PropsOf<typeof GbFeatures01>, PropsOf<typeof GbFeatures02>>, Same<PropsOf<typeof GbFeatures02>, PropsOf<typeof GbFeatures03>>] = [true, true]
const sameStats: [Same<PropsOf<typeof GbStats01>, PropsOf<typeof GbStats02>>, Same<PropsOf<typeof GbStats02>, PropsOf<typeof GbStats03>>] = [true, true]

const onNavigate = (p: BlockNavigate<Feature>) => { p.event.preventDefault(); return p.item.title + p.href }

export { hero, features, stats, money, typo, noWidth, noLabel, noActionLabel, noItems, badLabels, sameHero, sameFeatures, sameStats, onNavigate }
