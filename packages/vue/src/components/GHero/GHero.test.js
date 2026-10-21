// GHero (hero.md; #725 a #729, #742, #744, #755, #756): región, prioridad, vistas con capas estables, vídeo y avisos.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createSSRApp, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GHero from './GHero.vue'

afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

const MEDIA = { src: '/patio.jpg', width: 1600, height: 2000, alt: 'Patio de cantera verde', credit: 'Foto: la casa' }
const VIEWS = [
  { value: 'patio', label: 'Patio', media: { src: '/patio.jpg', width: 1600, height: 900, alt: 'Patio' } },
  { value: 'hab', label: 'Habitación', media: { src: '/hab.jpg', width: 1600, height: 900, alt: 'Habitación' } },
  { value: 'terraza', label: 'Terraza', media: { src: '/terraza.jpg', width: 1600, height: 900, alt: 'Terraza de noche' } }
]
const mk = (props = {}, opts = {}) => mount(GHero, { attachTo: document.body, props: { title: 'Casa Alcalá', media: MEDIA, ...props }, ...opts })
const warns = (spy) => spy.mock.calls.map((c) => String(c[0]))
const quiet = () => vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('GHero · región, título y orden', () => {
  it('section con aria-labelledby al único h1; contenido antes que la media', () => {
    const w = mk({ eyebrow: 'Hotel', lead: 'Doce habitaciones', aside: 'Desayuno incluido' })
    const s = w.find('section')
    expect(s.classes()).toEqual(expect.arrayContaining(['g-hero', 'g-hero--appearance-window', 'g-hero--frame-arch', 'g-hero--look']))
    const t = w.find('h1.g-hero__title')
    expect(s.attributes('aria-labelledby')).toBe(t.attributes('id'))
    expect(t.attributes('dir')).toBe('auto')
    expect(w.findAll('h1')).toHaveLength(1)
    const kids = [...s.element.children].map((c) => c.className)
    expect(kids).toEqual(['g-hero__content', 'g-hero__media'])
    expect([...w.find('.g-hero__content').element.children].map((c) => c.className)).toEqual(['g-hero__eyebrow', 'g-hero__title', 'g-hero__lead', 'g-hero__aside'])
  })

  it('headingLevel 2 pinta h2; aria-label del consumidor sustituye al nombre por el título', () => {
    const w = mk({ headingLevel: 2 }, { attrs: { 'aria-label': 'Apertura' } })
    expect(w.find('h2.g-hero__title').exists()).toBe(true)
    expect(w.find('section').attributes('aria-labelledby')).toBeUndefined()
    expect(w.find('section').attributes('aria-label')).toBe('Apertura')
  })

  it('slots eyebrow, lead, aside y actions sustituyen o añaden', () => {
    const w = mk({ lead: 'x' }, { slots: { lead: '<em>Bajada</em>', actions: '<a href="#r">Reservar</a>' } })
    expect(w.find('.g-hero__lead em').text()).toBe('Bajada')
    expect(w.find('.g-hero__actions a').text()).toBe('Reservar')
  })

  it('validadores de las props enumeradas', () => {
    expect(GHero.props.appearance.validator('inline')).toBe(false)
    expect(GHero.props.frame.validator('round')).toBe(false)
    expect(GHero.props.headingLevel.validator(3)).toBe(false)
  })
})

describe('GHero · foto prioritaria (H-L5)', () => {
  it('A: la foto va dentro de span.g-hero__frame; el detalle fuera, decorativo y sin fetchpriority (#755)', () => {
    const w = mk({ detail: { src: '/copa.jpg', width: 600, height: 600 } })
    const img = w.find('.g-hero__frame > img.g-hero__img')
    expect(img.exists()).toBe(true)
    expect(img.attributes()).toMatchObject({ src: '/patio.jpg', width: '1600', height: '2000', alt: 'Patio de cantera verde', loading: 'eager', fetchpriority: 'high', decoding: 'async' })
    const d = w.find('.g-hero__media > img.g-hero__detail')
    expect(d.attributes('alt')).toBe('')
    expect(d.attributes('aria-hidden')).toBe('true')
    expect(d.attributes('fetchpriority')).toBeUndefined()
    expect(w.find('section').classes()).toContain('g-hero--has-detail')
    expect(w.findAll('[fetchpriority="high"]')).toHaveLength(1)
    expect(w.find('figcaption.g-hero__credit').text()).toBe('Foto: la casa')
  })

  it('el marco existe también con frame="rect" y look=false', () => {
    const w = mk({ frame: 'rect', look: false })
    expect(w.find('.g-hero__frame > .g-hero__img').exists()).toBe(true)
    expect(w.find('section').classes()).toContain('g-hero--frame-rect')
    expect(w.find('section').classes()).not.toContain('g-hero--look')
  })

  it('priority: por defecto con h1; false con h2 (eager sin fetchpriority); explícito gana', () => {
    expect(mk({ headingLevel: 2 }).find('.g-hero__img').attributes('fetchpriority')).toBeUndefined()
    expect(mk({ headingLevel: 2 }).find('.g-hero__img').attributes('loading')).toBe('eager')
    expect(mk({ priority: false }).find('.g-hero__img').attributes('fetchpriority')).toBeUndefined()
    expect(mk({ headingLevel: 2, priority: true }).find('.g-hero__img').attributes('fetchpriority')).toBe('high')
  })

  it('decorative: alt vacío; sin alt ni decorative: alt vacío y aviso 3', () => {
    const spy = quiet()
    expect(mk({ media: { ...MEDIA, alt: undefined, decorative: true } }).find('.g-hero__img').attributes('alt')).toBe('')
    expect(warns(spy).some((m) => m.includes('aviso 3'))).toBe(false)
    expect(mk({ media: { src: '/a.jpg', width: 1, height: 1 } }).find('.g-hero__img').attributes('alt')).toBe('')
    expect(warns(spy).some((m) => m.includes('aviso 3'))).toBe(true)
  })

  it('B y C: la foto es hijo directo de la media, sin marco', () => {
    const c = mk({ appearance: 'threshold' })
    expect(c.find('.g-hero__frame').exists()).toBe(false)
    expect(c.find('.g-hero__media > .g-hero__img').exists()).toBe(true)
    const b = mk({ appearance: 'views', views: VIEWS, labels: { views: 'Vistas' } })
    expect(b.find('.g-hero__frame').exists()).toBe(false)
  })
})

describe('GHero · C · El umbral', () => {
  it('tarjeta con el contenido; consult después de la bajada y antes de las acciones', () => {
    const w = mk({ appearance: 'threshold', lead: 'L' }, { slots: { consult: '<form class="q">Q</form>', actions: '<a href="#">R</a>' } })
    expect(w.find('section > .g-hero__card > .g-hero__content').exists()).toBe(true)
    expect([...w.find('.g-hero__content').element.children].map((c) => c.className)).toEqual(['g-hero__title', 'g-hero__lead', 'g-hero__consult', 'g-hero__actions'])
    expect(w.find('.g-hero__consult .q').exists()).toBe(true)
  })

  it('consult fuera de threshold se ignora y avisa (aviso 6); frame/look/detail fuera de window avisan', () => {
    const spy = quiet()
    const w = mk({}, { slots: { consult: '<form class="q">Q</form>' } })
    expect(w.find('.q').exists()).toBe(false)
    mk({ appearance: 'threshold', frame: 'rect', detail: { src: '/d.jpg', width: 1, height: 1 } })
    const m = warns(spy)
    expect(m.some((x) => x.includes('slot consult'))).toBe(true)
    expect(m.some((x) => x.startsWith('[Grana GHero] frame'))).toBe(true)
    expect(m.some((x) => x.startsWith('[Grana GHero] detail'))).toBe(true)
  })
})

describe('GHero · B · Vistas a elegir', () => {
  const mkB = (props = {}) => mk({ appearance: 'views', views: VIEWS, labels: { views: 'Vistas' }, media: undefined, ...props })

  it('placa en la zona de marca con el contenido y el fieldset; legend, radios nativos con un name', () => {
    const w = mkB()
    const plate = w.find('section > .g-hero__plate')
    expect(plate.attributes('data-g-zone')).toBe('brand')
    expect(plate.find('.g-hero__content > fieldset.g-hero__views').exists()).toBe(true)
    expect(w.find('legend.g-hero__views-legend').text()).toBe('Vistas')
    const radios = w.findAll('input.g-hero__view-input[type="radio"]')
    expect(radios).toHaveLength(3)
    expect(new Set(radios.map((r) => r.attributes('name'))).size).toBe(1)
    expect(radios[0].element.checked).toBe(true)
    expect(w.findAll('.g-hero__view-label').map((l) => l.text())).toEqual(['Patio', 'Habitación', 'Terraza'])
    expect(w.find('.g-hero__view-thumb').attributes('alt')).toBe('')
  })

  it('capas: la elegida g-hero__img is-current con su alt; las demás aria-hidden y SIN src hasta el load de la principal', async () => {
    const w = mkB()
    const imgs = w.findAll('.g-hero__media > img')
    expect(imgs[0].classes()).toEqual(['g-hero__img', 'is-current'])
    expect(imgs[0].attributes('alt')).toBe('Patio')
    expect(imgs[0].attributes('fetchpriority')).toBe('high')
    expect(imgs[1].classes()).toEqual(['g-hero__layer'])
    expect(imgs[1].attributes('aria-hidden')).toBe('true')
    expect(imgs[1].attributes('src')).toBeUndefined()
    await imgs[0].trigger('load')
    expect(imgs[1].attributes('src')).toBe('/hab.jpg')
    expect(imgs[1].attributes('fetchpriority')).toBe('low')
  })

  it('elegir una vista: update:view, cambia la clase sin cambiar el nodo, el alt pasa a la nueva; elegida antes del load se pide ya', async () => {
    const w = mkB()
    const before = w.findAll('.g-hero__media > img').map((i) => i.element)
    await w.findAll('input.g-hero__view-input')[2].setValue(true)
    await nextTick()
    expect(w.emitted('update:view')).toEqual([['terraza']])
    const after = w.findAll('.g-hero__media > img').map((i) => i.element)
    expect(after).toEqual(before) // mismos nodos (#759: con un nodo nuevo no hay fundido)
    expect(after[2].className).toBe('g-hero__img is-current')
    expect(after[2].getAttribute('alt')).toBe('Terraza de noche')
    expect(after[2].getAttribute('src')).toBe('/terraza.jpg')
    expect(after[0].className).toBe('g-hero__layer')
    expect(after[0].getAttribute('alt')).toBe('')
    expect(after[1].getAttribute('src')).toBeNull() // la no pedida sigue sin src
  })

  it('v-model:view controla la vista elegida', async () => {
    const w = mkB({ view: 'hab' })
    expect(w.findAll('input.g-hero__view-input')[1].element.checked).toBe(true)
    expect(w.find('.g-hero__img').attributes('alt')).toBe('Habitación')
  })

  it('una sola vista: se pinta como window (aviso 7); cinco: las cuatro primeras', () => {
    const spy = quiet()
    const one = mkB({ views: VIEWS.slice(0, 1) })
    expect(one.find('section').classes()).toContain('g-hero--appearance-window')
    expect(one.find('.g-hero__frame > .g-hero__img').attributes('src')).toBe('/patio.jpg')
    const five = mkB({ views: [...VIEWS, { value: 'd', label: 'D', media: VIEWS[0].media }, { value: 'e', label: 'E', media: VIEWS[0].media }] })
    expect(five.findAll('.g-hero__view')).toHaveLength(4)
    expect(warns(spy).filter((m) => m.includes('aviso 7')).length).toBeGreaterThan(0)
  })

  it('sin labels.views: legend vacío y aviso 8', () => {
    const spy = quiet()
    const w = mkB({ labels: {} })
    expect(w.find('legend').text()).toBe('')
    expect(warns(spy).some((m) => m.includes('aviso 8'))).toBe(true)
  })
})

describe('GHero · vídeo y pausa (H-L8, #756)', () => {
  const VIDEO = '<video muted playsinline loop poster="/p.jpg" width="1600" height="900"></video>'
  const withVideo = (props = {}, reduced = false) => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: reduced, addEventListener() {}, removeEventListener() {} })
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    const w = mk({ labels: { pause: 'Pausar movimiento', resume: 'Reanudar' }, ...props }, { slots: { media: VIDEO } })
    return { w, play, pause }
  }

  it('el vídeo va dentro del marco en A; play() al montar sin movimiento reducido; botón con nombre constante en texto oculto', async () => {
    const { w, play } = withVideo()
    await nextTick()
    expect(w.find('.g-hero__frame > video').exists()).toBe(true)
    expect(play).toHaveBeenCalled()
    const b = w.find('button.g-hero__motion')
    expect(b.attributes('type')).toBe('button')
    expect(b.attributes('aria-pressed')).toBe('false')
    expect(b.find('.g-hero__motion-label').text()).toBe('Pausar movimiento')
    expect(b.text()).toBe('Pausar movimiento') // el único texto es el oculto: nada visible de labels.resume
    expect(w.text()).not.toContain('Reanudar')
    expect(b.find('svg').exists()).toBe(true)
    expect(w.find('section').classes()).toContain('g-hero--has-video')
  })

  it('pulsar la pausa: aria-pressed true, is-paused, pause(), update:paused; el nombre no cambia', async () => {
    const { w, pause } = withVideo()
    await nextTick()
    await w.find('.g-hero__motion').trigger('click')
    await nextTick()
    expect(w.emitted('update:paused')).toEqual([[true]])
    expect(w.find('.g-hero__motion').attributes('aria-pressed')).toBe('true')
    expect(w.find('section').classes()).toContain('is-paused')
    expect(pause).toHaveBeenCalled()
    expect(w.find('.g-hero__motion-label').text()).toBe('Pausar movimiento')
  })

  it('con movimiento reducido arranca en pausa (pause, no play)', async () => {
    const { w, play, pause } = withVideo({}, true)
    await nextTick(); await nextTick()
    expect(w.find('.g-hero__motion').attributes('aria-pressed')).toBe('true')
    expect(pause).toHaveBeenCalled()
    expect(play).not.toHaveBeenCalled()
  })

  it('v-model:paused manda', async () => {
    const { w } = withVideo({ paused: true })
    await nextTick()
    expect(w.find('.g-hero__motion').attributes('aria-pressed')).toBe('true')
  })

  it('autoplay en el slot (aviso 9) y vídeo sin labels.pause (aviso 10)', async () => {
    const spy = quiet()
    window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener() {}, removeEventListener() {} })
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
    mk({}, { slots: { media: '<video autoplay muted width="1" height="1"></video>' } })
    await nextTick()
    expect(warns(spy).some((m) => m.includes('aviso 9'))).toBe(true)
    expect(warns(spy).some((m) => m.includes('aviso 10'))).toBe(true)
  })

  it('con la foto fija no hay botón ni is-paused', () => {
    const w = mk()
    expect(w.find('.g-hero__motion').exists()).toBe(false)
  })
})

describe('GHero · avisos de documento', () => {
  it('sin title (aviso 1); sin width/height (aviso 2)', () => {
    const spy = quiet()
    mk({ title: undefined, media: { src: '/a.jpg', alt: 'a' } })
    expect(warns(spy).some((m) => m.includes('aviso 1'))).toBe(true)
    expect(warns(spy).some((m) => m.includes('aviso 2'))).toBe(true)
  })

  it('otro h1 (aviso 4) y mensaje propio con un GPageHeader', () => {
    const spy = quiet()
    document.body.insertAdjacentHTML('beforeend', '<h1>Otro</h1>')
    mk()
    expect(warns(spy).some((m) => m.includes('otro h1'))).toBe(true)
    document.body.innerHTML = '<header class="g-page-header"><h1>Panel</h1></header>'
    mk()
    expect(warns(spy).some((m) => m.includes('un héroe y un encabezado de página no conviven'))).toBe(true)
  })

  it('dos héroes con priority (aviso 5)', () => {
    const spy = quiet()
    mk(); mk({ headingLevel: 2, priority: true })
    expect(warns(spy).some((m) => m.includes('aviso 5'))).toBe(true)
  })
})

describe('GHero · SSR', () => {
  it.each(['window', 'views', 'threshold'])('%s se renderiza en el servidor', async (appearance) => {
    const app = createSSRApp({ render: () => h(GHero, { title: 'Casa', appearance, media: MEDIA, views: VIEWS, labels: { views: 'Vistas' } }) })
    const html = await renderToString(app)
    expect(html).toContain('g-hero--appearance-' + appearance)
    expect(html).toContain('fetchpriority="high"')
  })
})
