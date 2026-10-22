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

// Newsletter, Blog list y Footer (bruno C; newsletter.md, blog-list.md, footer.md)
import { GbBlogList01, GbBlogList02, GbBlogList03, GbFooter01, GbFooter02, GbFooter03, GbNewsletter01, GbNewsletter02, GbNewsletter03 } from '@grana/blocks/marketing'
import type { BlockSubmit, Brand, DateLabel, FooterAs, GbBlogListProps, GbFooterProps, GbNewsletterProps, LinkGroup, NavLink, Post } from '@grana/blocks/marketing'

const newsletter: GbNewsletterProps = { title: 'Fechas libres', field: { label: 'Tu correo', hint: 'Un correo al mes' }, action: { label: 'Suscribirme', icon: 'mail' }, legal: { text: 'Baja cuando quieras.', link: { label: 'Privacidad', href: '/privacidad' } }, labels: { busy: 'Suscribiendo…' } }
// @ts-expect-error: field.hint (la promesa) es obligatoria
const noHint: GbNewsletterProps = { title: 'x', field: { label: 'Correo' }, action: { label: 'Ir' } }
// @ts-expect-error: action solo admite label e icon (Pick<Action, 'label' | 'icon'>)
const actionHref: GbNewsletterProps = { title: 'x', field: { label: 'Correo', hint: 'h' }, action: { label: 'Ir', href: '#' } }
const onSubscribe = (p: BlockSubmit) => p.email.trim()

const post: Post = { title: 'Cómo llegar', href: '/notas/como-llegar', date: '2025-11-20', updated: '2026-10-03', tags: ['Guía'] }
const updated: DateLabel = ({ date }) => `Actualizado ${date}`
const blog: GbBlogListProps = { title: 'Notas', posts: [post], locale: 'es-MX', labels: { updated, external: 'se abre en otra pestaña' } }
// @ts-expect-error: Post sin date
const noDate: Post = { title: 'x', href: '/x' }
// @ts-expect-error: labels.updated no admite números
const badUpdated: GbBlogListProps = { title: 'x', posts: [post], labels: { updated: 3 } }

const link: NavLink = { label: 'English', href: '/en', lang: 'en', hreflang: 'en', current: true }
const group: LinkGroup = { title: 'Ayuda', links: [link] }
const brand: Brand = { name: 'Casa Alcalá', href: '/' }
const inShell: FooterAs = 'div'
const footer: GbFooterProps = { brand, contact: { address: ['Calle 1'], channels: [{ label: 'Llamar', href: 'tel:+529515550000' }], hours: '24 h' }, groups: [group], legal: [link], social: [link], note: '© 2026', as: inShell, labels: { nav: 'Mapa', legal: 'Legal', social: 'Redes', external: 'otra pestaña' } }
// @ts-expect-error: as solo admite footer o div
const badAs: GbFooterProps = { brand, as: 'section' }
// @ts-expect-error: brand es obligatoria
const noBrand: GbFooterProps = { note: 'x' }

const sameNewsletter: [Same<PropsOf<typeof GbNewsletter01>, PropsOf<typeof GbNewsletter02>>, Same<PropsOf<typeof GbNewsletter02>, PropsOf<typeof GbNewsletter03>>] = [true, true]
const sameBlog: [Same<PropsOf<typeof GbBlogList01>, PropsOf<typeof GbBlogList02>>, Same<PropsOf<typeof GbBlogList02>, PropsOf<typeof GbBlogList03>>] = [true, true]
const sameFooter: [Same<PropsOf<typeof GbFooter01>, PropsOf<typeof GbFooter02>>, Same<PropsOf<typeof GbFooter02>, PropsOf<typeof GbFooter03>>] = [true, true]

export { newsletter, noHint, actionHref, onSubscribe, blog, noDate, badUpdated, footer, badAs, noBrand, sameNewsletter, sameBlog, sameFooter }
