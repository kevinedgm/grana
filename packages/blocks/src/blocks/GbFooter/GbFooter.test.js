// GbFooter (dueño: bruno): footer.md «Verificación propia» + la batería común de _comun.md §8.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { h } from 'vue'
import { GSection } from '@grana/vue'
import meta from './GbFooter.meta.json'
import * as bank from './footer.bank.js'
import * as section from './props.js'
import GbFooter01 from './GbFooter01.vue'
import GbFooter02 from './GbFooter02.vue'
import GbFooter03 from './GbFooter03.vue'
import { looseTel } from './useFooter.js'
import { sectionSuite } from '../bank/suite.js'
import { click, mountBlock } from '../bank/harness.js'

const variants = { GbFooter01, GbFooter02, GbFooter03 }
sectionSuite({ meta, bank, variants, section, dir: 'src/blocks/GbFooter', headless: ['GbFooter02'], inner: { GbFooter03: 1 } })
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

const run = (C, props = {}, extra = {}) => mountBlock(C, { props: { ...bank.props, ...props }, slots: bank.slots, icons: bank.appIcons, ...extra })
const own = (warnings, n, code) => warnings.filter((t) => t.includes(`[Grana GbFooter${n}]`) && t.includes(`(${code})`))
const ALL = Object.entries({ '01': GbFooter01, '02': GbFooter02, '03': GbFooter03 })
const COLS = [GbFooter01, GbFooter03]
// Lo que pinta el pie (sin la suscripción del slot de 03)
const own$ = (w) => { const r = w.find('[data-gb^="footer"]').element; const sub = r.querySelector('[data-gb^="newsletter"]'); return { r, sub } }

describe('GbFooter · el contacto primero (#826)', () => {
  it('marca y contacto antes que cualquier nav en el DOM; address con canales', () => {
    for (const [, C] of ALL) {
      const { w } = run(C)
      const { r } = own$(w)
      const address = r.querySelector('address')
      expect(address).not.toBeNull()
      for (const nav of r.querySelectorAll('nav')) expect(address.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      const hrefs = [...address.querySelectorAll('a')].map((a) => a.getAttribute('href'))
      expect(hrefs).toEqual(['https://wa.me/529515550000', 'tel:+529515550000', 'mailto:hola@casaalcala.mx'])
      expect(address.querySelector('ul').tagName).toBe('UL')
    }
  })
  it('01 y 03: dirección y horario; 02 solo los canales', () => {
    for (const C of COLS) {
      const t = run(C).w.find('address').text()
      expect(t).toContain('Calle Macedonio Alcalá 407')
      expect(t).toContain('Recepción 24 h')
    }
    const t2 = run(GbFooter02).w.find('address').text()
    expect(t2).not.toContain('Macedonio')
    expect(t2).not.toContain('Recepción 24 h')
    expect(t2).toContain('Llamar a recepción')
  })
  it('la marca es un GBtn link a inicio con el logo (alt = nombre, sin texto repetido)', () => {
    for (const [, C] of ALL) {
      const { w } = run(C)
      const a = w.find('[data-gb^="footer"] a.g-btn[href="/"]')
      const img = a.find('img')
      expect(img.attributes('alt')).toBe('Casa Alcalá')
      expect(img.attributes('width')).toBe('160')
      expect(img.attributes('height')).toBe('48')
      expect(a.text()).toBe('')
    }
  })
})

describe('GbFooter · navegación', () => {
  it('01 y 03: un solo nav de grupos con nombre; cada grupo una GSection con su lista; aria-current en el actual', () => {
    for (const C of COLS) {
      const { w } = run(C)
      const { r, sub } = own$(w)
      const navs = [...r.querySelectorAll('nav')].filter((n) => !sub || !sub.contains(n))
      expect(navs.map((n) => n.getAttribute('aria-label'))).toEqual(['Mapa del sitio', 'Legal'])
      const groups = navs[0].querySelectorAll('section')
      expect(groups).toHaveLength(3)
      expect([...navs[0].querySelectorAll('h2')].map((x) => x.textContent)).toEqual(['Hotel', 'Visita', 'Ayuda'])
      const current = navs[0].querySelectorAll('[aria-current="page"]')
      expect([...current].map((a) => a.textContent)).toEqual(['Habitaciones'])
      const en = navs[0].querySelector('a[href="/en"]')
      expect(en.getAttribute('lang')).toBe('en')
      expect(en.getAttribute('hreflang')).toBe('en')
    }
  })
  it('02 ignora groups: solo el nav de legales', () => {
    const { w } = run(GbFooter02)
    expect(w.findAll('nav').map((n) => n.attributes('aria-label'))).toEqual(['Legal'])
    expect(w.find('a[href="/habitaciones"]').exists()).toBe(false)
  })
  it('redes: lista con nombre, enlaces externos con texto, otra pestaña y «se abre en otra pestaña»', () => {
    for (const [, C] of ALL) {
      const { w } = run(C)
      const ul = w.find('ul[aria-label="Redes"]')
      const a = ul.findAll('a')
      expect(a.map((x) => x.attributes('aria-label'))).toEqual(['Instagram, se abre en otra pestaña', 'Facebook, se abre en otra pestaña'])
      expect(a.every((x) => x.attributes('target') === '_blank' && x.attributes('rel') === 'noopener')).toBe(true)
    }
  })
  it('navigate con los enlaces internos (item = el NavLink; brand en la marca); nunca tel:, mailto: ni externos', () => {
    for (const [, C] of ALL) {
      const { w } = run(C)
      w.element.addEventListener('click', (e) => e.preventDefault()) // jsdom no navega
      const root = w.find('[data-gb^="footer"]')
      for (const sel of ['a[href="tel:+529515550000"]', 'a[href="mailto:hola@casaalcala.mx"]', 'a[href="https://wa.me/529515550000"]', 'a[href^="https://instagram"]']) root.find(sel).element.dispatchEvent(click())
      expect(w.findComponent(C).emitted('navigate')).toBeUndefined()
      // (en 03 el primer /privacidad es el de la suscripción del slot, que no es de este bloque)
      const priv = root.findAll('nav[aria-label="Legal"] a[href="/privacidad"]').at(-1).element
      priv.dispatchEvent(click())
      priv.dispatchEvent(click({ altKey: true }))
      root.find('a[href="/"]').element.dispatchEvent(click())
      const ev = w.findComponent(C).emitted('navigate').map((e) => e[0])
      expect(ev.map((e) => e.href)).toEqual(['/privacidad', '/'])
      expect(ev[0].item).toBe(bank.props.legal[0])
      expect(ev[1].item).toBe(bank.props.brand)
    }
  })
})

describe('GbFooter · raíz y chasis', () => {
  it('as="footer" por defecto; as="div" sin ningún footer (dentro del slot footer de GAppShell)', () => {
    for (const [, C] of ALL) {
      expect(run(C).w.element.tagName).toBe('FOOTER')
      const { w } = run(C, { as: 'div' })
      expect(w.element.tagName).toBe('DIV')
      expect(w.element.querySelectorAll('footer')).toHaveLength(0)
    }
  })
  it('O1: as="footer" dentro de un footer avisa; con as="div" no', () => {
    for (const [n, C] of ALL) {
      const host = document.createElement('footer')
      document.body.append(host)
      const bad = run(C, {}, { attachTo: host })
      expect(own(bad.warnings, n, 'O1')).toHaveLength(1)
      bad.w.unmount()
      const ok = run(C, { as: 'div' }, { attachTo: host })
      expect(own(ok.warnings, n, 'O1')).toHaveLength(0)
      ok.w.unmount()
    }
  })
  it('03: la suscripción arriba, un GDivider y debajo el pie de 01; sin slot avisa O2 y se pinta como 01', () => {
    const { w } = run(GbFooter03)
    const root = w.element
    const sub = root.querySelector('[data-gb="newsletter-01"]')
    expect(sub).not.toBeNull()
    expect(root.firstElementChild).toBe(sub)
    expect(sub.nextElementSibling.matches('hr, [role="separator"], .g-divider')).toBe(true)
    const bare = mountBlock(GbFooter03, { props: bank.props, icons: bank.appIcons })
    expect(own(bare.warnings, '03', 'O2')).toHaveLength(1)
    expect(bare.w.find('[data-gb^="newsletter"]').exists()).toBe(false)
    expect(bare.w.findAll('nav')).toHaveLength(2)
  })
  it('01 y 02 ignoran el slot subscribe', () => {
    for (const C of [GbFooter01, GbFooter02]) expect(run(C).w.find('[data-gb^="newsletter"]').exists()).toBe(false)
  })
  it('slots brand y note', () => {
    for (const [, C] of ALL) {
      const { w } = mountBlock(C, { props: bank.props, icons: bank.appIcons, slots: { ...bank.slots, brand: () => 'MARCA', note: () => 'NOTA' } })
      expect(w.text()).toContain('MARCA')
      expect(w.text()).toContain('NOTA')
      expect(w.find('a[href="/"]').exists()).toBe(false)
    }
  })
  it('sin brand.href la marca es texto (sin enlace)', () => {
    const { w } = run(GbFooter02, { brand: { name: 'Casa Alcalá' } })
    expect(w.find('p').text()).toBe('Casa Alcalá')
    expect(w.find('a[href="/"]').exists()).toBe(false)
  })
})

describe('GbFooter · avisos (una vez por instancia y motivo)', () => {
  it('C5: faltan labels nav (01, 03), legal, social y external', () => {
    for (const [n, C] of ALL) {
      const { w, warnings } = run(C, { labels: {} })
      expect(own(warnings, n, 'C5').length).toBe(n === '02' ? 3 : 4)
      expect(w.find('nav').exists()).toBe(true)
    }
  })
  it('C2: un enlace sin label o href se omite; C3: id de grupo repetido; C7: más de cinco columnas', () => {
    const groups = Array.from({ length: 6 }, (_, i) => ({ title: `G${i}`, links: [{ label: 'A', href: `/a${i}` }, { label: 'Sin href' }] }))
    for (const C of COLS) {
      const n = C === GbFooter01 ? '01' : '03'
      const { w, warnings } = run(C, { groups })
      expect(w.findAll('nav')[0].findAll('section')).toHaveLength(6)
      expect(own(warnings, n, 'C2').length).toBeGreaterThan(0)
      expect(own(warnings, n, 'C7')).toHaveLength(1)
    }
    const { warnings } = run(GbFooter02, { social: [{ id: 'x', label: 'A', href: '/a' }, { id: 'x', label: 'B', href: '/b' }] })
    expect(own(warnings, '02', 'C3')).toHaveLength(1)
  })
  it('C4: logo sin width/height', () => {
    for (const [n, C] of ALL) {
      const { warnings } = run(C, { brand: { name: 'Casa', href: '/', logo: { src: 'logo.svg' } } })
      expect(own(warnings, n, 'C4')).toHaveLength(1)
    }
  })
  it('C6: href javascript: deja un GBtn deshabilitado sin enlace', () => {
    for (const [n, C] of ALL) {
      const { w, warnings } = run(C, { legal: [{ label: 'Mal', href: 'javascript:void(0)' }] })
      expect(own(warnings, n, 'C6')).toHaveLength(1)
      expect(w.find('a[href^="javascript"]').exists()).toBe(false)
      expect(w.find('nav[aria-label="Legal"] button[disabled]').text()).toBe('Mal')
    }
  })
  it('O3: tel: con letras o espacios', () => {
    expect(looseTel('tel:+52 951 555 0000')).toBe(true)
    expect(looseTel('tel:+52-951-ABC')).toBe(true)
    expect(looseTel('tel:+529515550000')).toBe(false)
    expect(looseTel('mailto:a b')).toBe(false)
    for (const [n, C] of ALL) {
      const { warnings } = run(C, { contact: { channels: [{ label: 'Tel', href: 'tel:+52 951 555 0000' }] } })
      expect(own(warnings, n, 'O3')).toHaveLength(1)
    }
  })
})
