// GbBlogList (dueño: bruno): blog-list.md «Verificación propia» + la batería común de _comun.md §8.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { GCard, GStack } from '@grana/vue'
import { GTag } from '@grana/vue/tag'
import meta from './GbBlogList.meta.json'
import * as bank from './blog-list.bank.js'
import * as section from './props.js'
import GbBlogList01 from './GbBlogList01.vue'
import GbBlogList02 from './GbBlogList02.vue'
import GbBlogList03 from './GbBlogList03.vue'
import { formatDate, readDate } from './usePosts.js'
import { sectionSuite } from '../bank/suite.js'
import { click, mountBlock } from '../bank/harness.js'

const variants = { GbBlogList01, GbBlogList02, GbBlogList03 }
sectionSuite({ meta, bank, variants, section, dir: 'src/blocks/GbBlogList' })
afterEach(() => vi.restoreAllMocks())

const run = (C, props = {}, extra = {}) => mountBlock(C, { props: { ...bank.props, ...props }, slots: bank.slots, ...extra })
const own = (warnings, n, code) => warnings.filter((t) => t.includes(`[Grana GbBlogList${n}]`) && t.includes(`(${code})`))
const ALL = Object.entries({ '01': GbBlogList01, '02': GbBlogList02, '03': GbBlogList03 })
const N = bank.props.posts.length

describe('GbBlogList · fechas (#825)', () => {
  it('readDate lee el día escrito (con hora o sin ella) y rechaza lo que Date no lee', () => {
    expect(readDate('2026-10-03').toISOString()).toBe('2026-10-03T00:00:00.000Z')
    expect(readDate('2026-04-02T23:30:00-06:00').toISOString()).toBe('2026-04-02T00:00:00.000Z')
    expect(readDate('3 de octubre')).toBeNull()
    expect(readDate('2026-02-30')).toBeNull()
    expect(readDate(undefined)).toBeNull()
  })
  it('<time datetime> con el ISO y el texto de Intl en es-MX y en en-US', () => {
    for (const [locale, text] of [['es-MX', formatDate(new Date(Date.UTC(2026, 5, 12)), 'es-MX')], ['en-US', 'June 12, 2026']]) {
      for (const [, C] of ALL) {
        const { w } = run(C, { locale })
        const t = w.findAll('time')[0]
        expect(t.attributes('datetime')).toBe('2026-06-12')
        expect(t.text()).toBe(text)
      }
    }
    expect(formatDate(new Date(Date.UTC(2026, 5, 12)), 'es-MX')).toMatch(/12 de junio de 2026/)
  })
  it('con updated gana la fecha de actualización con labels.updated (cadena con {date} o función)', () => {
    for (const [, C] of ALL) {
      const t = run(C).w.findAll('time')[1]
      expect(t.attributes('datetime')).toBe('2026-10-03')
      expect(t.text()).toBe('Actualizado 3 de octubre de 2026')
      const fn = run(C, { labels: { ...bank.props.labels, updated: ({ date }) => `Revisado el ${date}` } }).w.findAll('time')[1]
      expect(fn.text()).toBe('Revisado el 3 de octubre de 2026')
    }
  })
  it('la fecha va en el antetítulo (eyebrow) de la tarjeta, por encima del título', () => {
    const { w } = run(GbBlogList02)
    const card = w.findAllComponents(GCard)[0].element
    const time = card.querySelector('time')
    const h = card.querySelector('h3')
    expect(time.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})

describe('GbBlogList · cada forma', () => {
  it('01: rejilla de article con foto donde la hay, etiquetas GTag estáticas (sin href) en una lista', () => {
    const { w } = run(GbBlogList01)
    const items = w.findAll('[role="listitem"]')
    expect(items).toHaveLength(N)
    for (const i of items) expect(i.classes()).toEqual(['g-adapt-wide'])
    expect(w.findAll('article')).toHaveLength(N)
    expect(w.findAll('img')).toHaveLength(2)
    const tags = w.findAllComponents(GTag)
    expect(tags.map((t) => t.props('label'))).toEqual(['Fiestas', 'Julio'])
    for (const t of tags) {
      expect(t.props('href')).toBeFalsy()
      expect(t.find('a').exists()).toBe(false)
      expect(t.element.parentElement.tagName).toBe('LI')
    }
    for (const img of w.findAll('img')) {
      expect(img.attributes('loading')).toBe('lazy')
      expect(img.attributes('decoding')).toBe('async')
      expect(img.attributes('fetchpriority')).toBeUndefined()
      expect(img.attributes('width')).toBe('1200')
    }
  })
  it('02: ul gap="sm" sin divided (#843) › GCard as="li" level="flat", sin imágenes ni etiquetas', () => {
    const { w } = run(GbBlogList02)
    const stack = w.findComponent(GStack)
    expect(stack.element.tagName).toBe('UL')
    expect(stack.props('gap')).toBe('sm')
    expect(stack.props('divided')).toBe(false)
    expect(stack.classes()).not.toContain('g-stack--divided')
    const cards = w.findAllComponents(GCard)
    expect(cards).toHaveLength(N)
    expect(cards.every((c) => c.element.tagName === 'LI' && c.props('level') === 'flat')).toBe(true)
    expect(w.findAll('img')).toHaveLength(0)
    expect(w.findAllComponents(GTag)).toHaveLength(0)
  })
  it('03: una sola lista; la primera horizontal (auto, foto al inicio) con foto y etiquetas; las demás como 02', () => {
    const { w } = run(GbBlogList03)
    expect(w.findAll('ul')).toHaveLength(2) // la lista de notas + la de etiquetas de la destacada
    const cards = w.findAllComponents(GCard)
    expect(cards).toHaveLength(N)
    expect(cards[0].props('orientation')).toBe('auto')
    expect(cards[0].props('mediaPosition')).toBe('start')
    expect(cards[0].find('img').exists()).toBe(true)
    expect(cards[0].findAllComponents(GTag)).toHaveLength(2)
    for (const c of cards.slice(1)) {
      expect(c.props('level')).toBe('flat')
      expect(c.find('img').exists()).toBe(false)
    }
    expect(cards.every((c) => c.element.parentElement === cards[0].element.parentElement)).toBe(true)
  })
  it('slot post sustituye el contenido de la tarjeta', () => {
    for (const [, C] of ALL) {
      const { w } = mountBlock(C, { props: bank.props, slots: { post: ({ item, index }) => `POST ${index} ${item.title.slice(0, 5)}` } })
      expect(w.text()).toContain('POST 0 Guela')
    }
  })
})

describe('GbBlogList · tarjeta = enlace', () => {
  it('navigate de la tarjeta reemitido con item, solo con clic primario', () => {
    for (const [, C] of ALL) {
      const { w } = run(C)
      w.element.addEventListener('click', (e) => e.preventDefault()) // jsdom no navega
      const a = w.findAllComponents(GCard)[1].find('a.g-card__primary').element
      a.dispatchEvent(click())
      a.dispatchEvent(click({ metaKey: true }))
      a.dispatchEvent(click({ shiftKey: true }))
      a.dispatchEvent(click({ button: 1 }))
      const ev = w.findComponent(C).emitted('navigate')
      expect(ev).toHaveLength(1)
      expect(ev[0][0]).toMatchObject({ href: '/notas/como-llegar', item: bank.props.posts[1] })
    }
  })
  it('externa: otra pestaña, marca nombrada con labels.external y sin navigate', () => {
    for (const [, C] of ALL) {
      const { w } = run(C)
      w.element.addEventListener('click', (e) => e.preventDefault())
      const a = w.findAllComponents(GCard)[4].find('a.g-card__primary')
      expect(a.attributes('target')).toBe('_blank')
      expect(a.attributes('rel')).toBe('noopener')
      expect(a.find('.g-icon[role="img"]').attributes('aria-label')).toBe('se abre en otra pestaña')
      a.element.dispatchEvent(click())
      expect(w.findComponent(C).emitted('navigate')).toBeUndefined()
    }
  })
  it('preventDefault() en la escucha de navigate impide la navegación', () => {
    const { w } = mountBlock(GbBlogList01, { props: { ...bank.props, onNavigate: ({ event }) => event.preventDefault() } })
    const e = click()
    w.findAllComponents(GCard)[1].find('a').element.dispatchEvent(e)
    expect(e.defaultPrevented).toBe(true)
  })
})

describe('GbBlogList · avisos (una vez por instancia y motivo)', () => {
  it('C1: sin notas no pinta nada', () => {
    for (const [n, C] of ALL) {
      const { w, warnings } = run(C, { posts: [] })
      expect(w.find('[data-gb]').exists()).toBe(false)
      expect(own(warnings, n, 'C1')).toHaveLength(1)
    }
  })
  it('C2: sin title, href o date se omite; C3: id repetido usa el índice', () => {
    const posts = [{ id: 'a', title: 'Uno', href: '/1', date: '2026-01-01' }, { id: 'a', title: 'Dos', href: '/2', date: '2026-01-02' }, { title: 'Sin fecha', href: '/3' }]
    for (const [n, C] of ALL) {
      const { w, warnings } = run(C, { posts })
      expect(w.findAllComponents(GCard)).toHaveLength(2)
      expect(own(warnings, n, 'C2')).toHaveLength(1)
      expect(own(warnings, n, 'C3')).toHaveLength(1)
    }
  })
  it('C4 solo donde se pinta la foto (01 todas; 03 la destacada; 02 nunca)', () => {
    const posts = [{ title: 'A', href: '/a', date: '2026-01-01', media: { src: 'a.jpg' } }, { title: 'B', href: '/b', date: '2026-01-01', media: { src: 'b.jpg' } }]
    expect(own(run(GbBlogList01, { posts }).warnings, '01', 'C4')).toHaveLength(4)
    expect(own(run(GbBlogList03, { posts }).warnings, '03', 'C4')).toHaveLength(2)
    expect(own(run(GbBlogList02, { posts }).warnings, '02', 'C4')).toHaveLength(0)
  })
  it('C5: updated sin labels.updated (fecha sin prefijo) y externa sin labels.external', () => {
    for (const [n, C] of ALL) {
      const { w, warnings } = run(C, { labels: {} })
      expect(own(warnings, n, 'C5')).toHaveLength(2)
      expect(w.findAll('time')[1].text()).toBe('3 de octubre de 2026')
    }
  })
  it('C6: href javascript: deja la tarjeta sin enlace', () => {
    const posts = [{ title: 'Mal', href: 'javascript:alert(1)', date: '2026-01-01' }]
    for (const [n, C] of ALL) {
      const { w, warnings } = run(C, { posts })
      expect(own(warnings, n, 'C6')).toHaveLength(1)
      expect(w.find('a').exists()).toBe(false)
      expect(w.text()).toContain('Mal')
    }
  })
  it('C7: más de 24 se pintan todas y avisa', () => {
    const posts = Array.from({ length: 25 }, (_, i) => ({ id: i, title: `N${i}`, href: `/n/${i}`, date: '2026-01-01' }))
    const { w, warnings } = run(GbBlogList02, { posts })
    expect(w.findAllComponents(GCard)).toHaveLength(25)
    expect(own(warnings, '02', 'C7')).toHaveLength(1)
  })
  it('P1: fecha que no se lee se pinta tal cual (sin datetime); P2: updated anterior a date', () => {
    const posts = [{ title: 'A', href: '/a', date: 'pronto' }, { title: 'B', href: '/b', date: '2026-05-01', updated: '2026-01-01' }]
    for (const [n, C] of ALL) {
      const { w, warnings } = run(C, { posts })
      const t = w.findAll('time')[0]
      expect(t.text()).toBe('pronto')
      expect(t.attributes('datetime')).toBeUndefined()
      expect(own(warnings, n, 'P1')).toHaveLength(1)
      expect(own(warnings, n, 'P2')).toHaveLength(1)
    }
  })
})
