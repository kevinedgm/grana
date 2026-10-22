// Uso correcto y erróneo de los tipos de @grana/blocks/marketing (src/types.test.js los comprueba con vue-tsc). Cada
// `@ts-expect-error` es un uso erróneo que DEBE fallar: si los tipos dejaran de detectarlo, vue-tsc avisaría de una
// directiva sin error.
import { createApp } from 'vue'
import { GbFeatures01, GbFeatures02, GbFeatures03, GbHero01, GbHero02, GbHero03, GbStats01, GbStats02, GbStats03, marketing } from '@grana/blocks/marketing'
import type { Action, BlockNavigate, Feature, GbFeaturesProps, GbHeroProps, GbStatsProps, Media, Money, Stat } from '@grana/blocks/marketing'
import { GbCta01, GbCta02, GbCta03, GbFaq01, GbFaq02, GbFaq03, GbTestimonials01, GbTestimonials02, GbTestimonials03 } from '@grana/blocks/marketing'
import type { BlockActivate, Faq, FaqLabels, GbCtaProps, GbFaqProps, GbTestimonialsProps, Testimonial } from '@grana/blocks/marketing'

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

// Testimonials, CTA y FAQ (parte 2 del lote)
const testimonial: Testimonial = { quote: 'Volveríamos.', lang: 'en', author: { name: 'Rosa' }, source: { label: 'Google', href: 'https://g', external: true } }
const testimonials: GbTestimonialsProps = { title: 'Opiniones', items: [testimonial], labels: { external: 'se abre en otra pestaña' } }
// @ts-expect-error: Testimonial sin author.name
const noAuthor: Testimonial = { quote: 'x', author: {} }
// @ts-expect-error: rating está reservado (M-L2)
const rated: Testimonial = { quote: 'x', author: { name: 'A' }, rating: 5 }
const cta: GbCtaProps = { title: 'Reserva', actions: [action], assurance: 'Sin pago ahora', media, labels: { actions: 'Acciones', external: 'se abre en otra pestaña' } }
// @ts-expect-error: actions es obligatorio en CTA
const noActions: GbCtaProps = { title: 'Reserva' }
const faq: Faq = { id: 'mascotas', question: '¿Mascotas?', answer: 'Sí.' }
const faqLabels: FaqLabels = { search: 'Buscar', matches: ({ count, total }) => `${count} de ${total}`, none: 'Nada', clear: 'Borrar' }
const faqs: GbFaqProps = { title: 'Preguntas', items: [faq], labels: faqLabels }
// @ts-expect-error: Faq sin answer
const noAnswer: Faq = { question: '¿Y?' }
// @ts-expect-error: labels de FAQ no admite claves inventadas
const badFaqLabels: GbFaqProps = { title: 'x', items: [faq], labels: { buscar: 'x' } }
const sameTestimonials: [Same<PropsOf<typeof GbTestimonials01>, PropsOf<typeof GbTestimonials02>>, Same<PropsOf<typeof GbTestimonials02>, PropsOf<typeof GbTestimonials03>>] = [true, true]
const sameCta: [Same<PropsOf<typeof GbCta01>, PropsOf<typeof GbCta02>>, Same<PropsOf<typeof GbCta02>, PropsOf<typeof GbCta03>>] = [true, true]
const sameFaq: [Same<PropsOf<typeof GbFaq01>, PropsOf<typeof GbFaq02>>, Same<PropsOf<typeof GbFaq02>, PropsOf<typeof GbFaq03>>] = [true, true]
const onCtaActivate = (p: BlockActivate<Action>) => p.item.label
const onQuoteNavigate = (p: BlockNavigate<Testimonial>) => p.item.author.name
export { testimonials, noAuthor, rated, cta, noActions, faqs, noAnswer, badFaqLabels, sameTestimonials, sameCta, sameFaq, onCtaActivate, onQuoteNavigate }

const onNavigate = (p: BlockNavigate<Feature>) => { p.event.preventDefault(); return p.item.title + p.href }

export { hero, features, stats, money, typo, noWidth, noLabel, noActionLabel, noItems, badLabels, sameHero, sameFeatures, sameStats, onNavigate }
