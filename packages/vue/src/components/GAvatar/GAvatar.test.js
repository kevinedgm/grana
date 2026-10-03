import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { Building2 } from 'lucide-static'
import GAvatar from './GAvatar.vue'
import { createIcons } from '../GIcon/registry.js'
import { ICONS } from '../../icons/lucide.js'

// Contrato: design/contracts/avatar.md (lima, #293 a #297). Las medidas (lado = space × n, iniciales que caben, contraste,
// encaje en los huecos de GCard/GTable/GMenu/GSelect/GBadge, sin salto al cargar) y el árbol de accesibilidad real se
// comprueban con Playwright en los tres motores (design/lab/theme-playground/tests/avatar.spec.mjs): jsdom no tiene
// maquetación, ni carga imágenes, ni árbol de accesibilidad.

const wrappers = []
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  while (wrappers.length) wrappers.pop().unmount()
  document.body.innerHTML = ''
})

const mk = (props = {}, opts = {}) => {
  const w = mount(GAvatar, { props, attachTo: document.body, ...opts })
  wrappers.push(w)
  return w
}
const root = (w) => w.find('.g-avatar')
const ini = (w) => (w.find('.g-avatar__initials').exists() ? w.find('.g-avatar__initials').text() : null)
const iconSvg = (w) => w.find('svg.g-avatar__icon')
// Trazos de la librería tal como los serializa el DOM (innerHTML cierra los elementos)
const drawn = (paths) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.innerHTML = paths; return s.innerHTML }
const cat = (w) => root(w).attributes('data-cat') ?? null
// Los avisos son «una vez por causa y valor» (estado de módulo): las pruebas de avisos usan un módulo nuevo
const fresh = async () => { vi.resetModules(); return (await import('./GAvatar.vue')).default }
const spyWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {})
const grana = (s) => s.mock.calls.map((c) => String(c[0])).filter((m) => m.startsWith('[Grana GAvatar]'))

describe('GAvatar · marcado y clases (avatar.md «Estructura» y «Clases»)', () => {
  it('iniciales decorativas: el marcado exacto que espera GAvatar.css', () => {
    const w = mk({ name: 'Ana María López', categories: 8 })
    expect(root(w).element.outerHTML).toBe(
      '<span class="g-avatar g-avatar--size-md g-avatar--shape-circle g-avatar--content-initials" data-cat="2" aria-hidden="true">' +
      '<span class="g-avatar__initials" dir="auto" translate="no">AL</span><!----></span>'
    )
  })

  it('icono por defecto: el GIcon interno con la clase g-avatar__icon, decorativo y no enfocable', () => {
    const w = mk({})
    expect(root(w).classes()).toEqual(['g-avatar', 'g-avatar--size-md', 'g-avatar--shape-circle', 'g-avatar--content-icon'])
    const svg = iconSvg(w)
    expect(svg.exists()).toBe(true)
    expect(svg.classes()).toEqual(['g-icon', 'g-avatar__icon'])
    expect(svg.attributes('aria-hidden')).toBe('true')
    expect(svg.attributes('focusable')).toBe('false')
    expect(svg.element.innerHTML).toBe(drawn(ICONS.user))
    expect(root(w).element.children).toHaveLength(1)
  })

  it('con src: respaldo primero, <img> ÚLTIMA hija con alt="" lazy async y no arrastrable; raíz is-loading', () => {
    const w = mk({ src: 'https://avatar.invalid/a.png', name: 'Luis Torres', size: 'lg', shape: 'square' })
    const el = root(w).element
    expect(root(w).classes()).toEqual(['g-avatar', 'g-avatar--size-lg', 'g-avatar--shape-square', 'g-avatar--content-initials', 'is-loading'])
    expect([...el.children].map((c) => c.className)).toEqual(['g-avatar__initials', 'g-avatar__img'])
    const img = el.lastElementChild
    expect(img.tagName).toBe('IMG')
    expect(img.getAttribute('src')).toBe('https://avatar.invalid/a.png')
    expect(img.getAttribute('alt')).toBe('')
    expect(img.getAttribute('loading')).toBe('lazy')
    expect(img.getAttribute('decoding')).toBe('async')
    expect(img.getAttribute('draggable')).toBe('false')
  })

  it('tamaños y formas: una clase por valor; validator con la lista (api.md)', () => {
    for (const size of ['xs', 'sm', 'md', 'lg', 'xl']) for (const shape of ['circle', 'square']) {
      const w = mk({ name: 'Ana', size, shape })
      expect(root(w).classes()).toContain(`g-avatar--size-${size}`)
      expect(root(w).classes()).toContain(`g-avatar--shape-${shape}`)
    }
    expect(GAvatar.props.size.validator('xxl')).toBe(false)
    expect(GAvatar.props.size.validator('xl')).toBe(true)
    expect(GAvatar.props.shape.validator('pill')).toBe(false)
    expect(GAvatar.props.shape.validator('square')).toBe(true)
    expect(GAvatar.props.size.default).toBe('md')
    expect(GAvatar.props.shape.default).toBe('circle')
  })

  it('ningún elemento lleva tabindex ni es enfocable', () => {
    const w = mk({ src: 'x.png', name: 'Ana', label: 'Ana' })
    expect(w.element.querySelectorAll('[tabindex]')).toHaveLength(0)
    expect(root(w).element.tabIndex).toBe(-1)
  })

  it('sin slots ni eventos: emits vacío declarado', () => {
    expect(GAvatar.emits).toEqual([])
  })
})

describe('GAvatar · precedencia del contenido (src > initials > icon > name > user)', () => {
  it('con las cinco fuentes, el respaldo es initials (la imagen va encima)', () => {
    const w = mk({ src: 'a.png', initials: 'XY', icon: 'users', name: 'Ana López' })
    expect(ini(w)).toBe('XY')
    expect(w.find('img').exists()).toBe(true)
  })
  it('initials > icon > name > user', () => {
    expect(ini(mk({ initials: 'XY', icon: 'users', name: 'Ana López' }))).toBe('XY')
    const a = mk({ icon: 'users', name: 'Ana López' })
    expect(ini(a)).toBe(null)
    expect(iconSvg(a).element.innerHTML).toBe(drawn(ICONS.users))
    expect(root(a).classes()).toContain('g-avatar--content-icon')
    expect(ini(mk({ name: 'Ana López' }))).toBe('AL')
    expect(iconSvg(mk({})).element.innerHTML).toBe(drawn(ICONS.user))
  })
  it('las cadenas vacías o solo espacios cuentan como ausentes', () => {
    const w = mk({ src: '  ', initials: ' ', icon: '', name: 'Ana López', colorKey: '  ', label: '   ' })
    expect(ini(w)).toBe('AL')
    expect(w.find('img').exists()).toBe(false)
    expect(root(w).classes().some((c) => c.startsWith('is-'))).toBe(false)
    expect(root(w).attributes('aria-hidden')).toBe('true')
    expect(root(w).attributes('role')).toBeUndefined()
  })
  it('un icon que no resuelve sigue la cadena: iniciales de name, y si no, user', () => {
    spyWarn()
    expect(ini(mk({ name: 'Ana', icon: 'no-existe-a' }))).toBe('A')
    expect(iconSvg(mk({ icon: 'no-existe-b' })).element.innerHTML).toBe(drawn(ICONS.user))
  })
  it('icon se resuelve con el registro de la aplicación (registro → librería; building-2 de Lucide se llama building-complex)', () => {
    const w = mk({ icon: 'building-complex', name: 'Grana Labs' }, { global: { plugins: [createIcons([Building2])] } })
    expect(iconSvg(w).exists()).toBe(true)
    expect(ini(w)).toBe(null)
  })
  it('`user` sale SOLO de la librería aunque el registro de la aplicación traiga otro `user`', () => {
    const fake = '<svg xmlns="http://www.w3.org/2000/svg" class="lucide lucide-user"><circle cx="1" cy="1" r="1"/></svg>'
    const w = mk({}, { global: { plugins: [createIcons([fake])] } })
    expect(iconSvg(w).element.innerHTML).toBe(drawn(ICONS.user))
    // mientras que `icon="user"` es un nombre de la aplicación y sí usa su registro
    const w2 = mk({ icon: 'user' }, { global: { plugins: [createIcons([fake])] } })
    expect(iconSvg(w2).element.innerHTML).toBe('<circle cx="1" cy="1" r="1"></circle>')
  })
})

// avatar.md «Iniciales · Casos»: [props, md, xs]; null = icono `user`; { icon } = ese icono
const CASES = [
  [{ name: 'Ana María López' }, 'AL', 'A'],
  [{ name: '李小龙' }, '李', '李'],
  [{ name: '山田 太郎' }, '山', '山'],
  [{ name: '김민수' }, '김', '김'],
  [{ name: 'ØRSTED' }, 'Ø', 'Ø'],
  [{ name: 'Madonna' }, 'M', 'M'],
  [{ name: '' }, null, null],
  [{ name: '   ' }, null, null],
  [{ name: '🦊' }, null, null],
  [{ name: '🦊 Zorro Plateado' }, 'ZP', 'Z'],
  [{ name: 'jean-luc picard' }, 'JP', 'J'],
  [{ name: "O'Brien" }, 'O', 'O'],
  [{ name: 'Émile Zola' }, 'ÉZ', 'É'],
  [{ name: 'łukasz żółw' }, 'ŁŻ', 'Ł'],
  [{ name: 'محمد علي' }, 'مع', 'م'],
  [{ name: 'Straße' }, 'S', 'S'],
  [{ name: 'ßeta' }, 'ß', 'ß'],
  [{ initials: 'ABC' }, 'AB', 'A'],
  [{ initials: 'ab' }, 'ab', 'a'],
  [{ initials: '🦊' }, '🦊', '🦊'],
  [{ name: 'Ana', icon: 'users' }, { icon: 'users' }, { icon: 'users' }],
  [{ name: 'Ana', icon: 'no-existe' }, 'A', 'A']
]

describe('GAvatar · iniciales (tabla de casos del contrato, md y xs)', () => {
  for (const [props, md, xs] of CASES) {
    it(`${JSON.stringify(props)} → md ${JSON.stringify(md)}, xs ${JSON.stringify(xs)}`, () => {
      spyWarn()
      for (const [size, exp] of [['md', md], ['xs', xs]]) {
        const w = mk({ ...props, size })
        if (exp === null) {
          expect(ini(w), size).toBe(null)
          expect(iconSvg(w).element.innerHTML, size).toBe(drawn(ICONS.user))
        } else if (typeof exp === 'object') {
          expect(ini(w), size).toBe(null)
          expect(iconSvg(w).element.innerHTML, size).toBe(drawn(ICONS[exp.icon]))
        } else {
          expect(ini(w), size).toBe(exp)
          expect(root(w).classes()).toContain('g-avatar--content-initials')
        }
      }
    })
  }

  it('una letra en xs y sm; dos desde md (lg y xl también)', () => {
    const got = Object.fromEntries(['xs', 'sm', 'md', 'lg', 'xl'].map((size) => [size, ini(mk({ name: 'Ana María López', size }))]))
    expect(got).toEqual({ xs: 'A', sm: 'A', md: 'AL', lg: 'AL', xl: 'AL' })
  })
  it('escritura ancha: una sola en cualquier tamaño, también en initials explícitas', () => {
    for (const size of ['md', 'xl']) {
      expect(ini(mk({ name: 'Ana 李', size }))).toBe('A')
      spyWarn()
      expect(ini(mk({ initials: '李小', size }))).toBe('李')
    }
  })
  it('initials: NFC, recorte y sin grafemas de espacio; no se pasan a mayúsculas', () => {
    expect(ini(mk({ initials: '  a b ' }))).toBe('ab')
    expect(ini(mk({ initials: 'Éz' }))).toBe('Éz')
  })
  it('mayúsculas sin configuración regional: «i» turca da «I» (la aplicación pasa initials si le importa)', () => {
    expect(ini(mk({ name: 'ismail' }))).toBe('I')
  })
  it('las iniciales llevan dir="auto" y translate="no"', () => {
    const s = mk({ name: 'محمد علي' }).find('.g-avatar__initials')
    expect(s.attributes('dir')).toBe('auto')
    expect(s.attributes('translate')).toBe('no')
  })
  it('sin Intl.Segmenter cae a puntos de código y sigue derivando', async () => {
    vi.stubGlobal('Intl', { ...Intl, Segmenter: undefined })
    const G = await fresh()
    const w = mount(G, { props: { name: 'Ana María López' } })
    wrappers.push(w)
    expect(w.find('.g-avatar__initials').text()).toBe('AL')
  })
})

// avatar.md «Hash»: vectores de prueba (el resultado no cambia sin decisión de lima)
const VECTORS = [
  ['a', 4, 4, 4],
  ['Ana María López', 2, 2, 2],
  ['  ANA   MARÍA lópez ', 2, 2, 2],
  ['Ana María López'.normalize('NFD'), 2, 2, 2],
  ['李小龙', 1, 1, 1],
  ['محمد علي', 2, 6, 2],
  ['Grana Labs', 3, 3, 11],
  ['u_8f3a2c', 2, 2, 2],
  ['Zoë', 3, 3, 11]
]

describe('GAvatar · color (avatar.md «Color» y «Hash»)', () => {
  for (const [key, c4, c8, c12] of VECTORS) {
    it(`hash ${JSON.stringify(key)} → ${c4} / ${c8} / ${c12} con categories 4 / 8 / 12`, () => {
      expect([4, 8, 12].map((n) => cat(mk({ colorKey: key, categories: n })))).toEqual([String(c4), String(c8), String(c12)])
      // la misma clave por name da lo mismo
      expect(cat(mk({ name: key, categories: 8 }))).toBe(String(c8))
    })
  }
  it('el hash es el mismo sin TextEncoder (codificación UTF-8 propia)', async () => {
    vi.stubGlobal('TextEncoder', undefined)
    const G = await fresh()
    for (const [key, , c8, c12] of VECTORS) {
      const w8 = mount(G, { props: { colorKey: key, categories: 8 } })
      const w12 = mount(G, { props: { colorKey: key, categories: 12 } })
      wrappers.push(w8, w12)
      expect([w8.attributes('data-cat'), w12.attributes('data-cat')], key).toEqual([String(c8), String(c12)])
    }
  })
  it('categories reparte entre n: 200 claves dan las n categorías', () => {
    const seen = new Set()
    for (let i = 0; i < 200; i++) seen.add(cat(mk({ colorKey: 'persona ' + i, categories: 6 })))
    expect([...seen].sort()).toEqual(['1', '2', '3', '4', '5', '6'])
  })
  it('sin color y categories 0 (por defecto): neutro, sin data-cat', () => {
    expect(cat(mk({ name: 'Ana María López' }))).toBe(null)
  })
  it('color fija la categoría (número o cadena numérica) y gana al derivado', () => {
    expect(cat(mk({ name: 'Ana María López', color: 3 }))).toBe('3')
    expect(cat(mk({ name: 'Ana María López', color: '11', categories: 8 }))).toBe('11')
    expect(cat(mk({ color: 12 }))).toBe('12')
  })
  it('color="neutral" gana a categories', () => {
    expect(cat(mk({ name: 'Ana María López', color: 'neutral', categories: 8 }))).toBe(null)
  })
  it('colorKey manda sobre name; un número se convierte con String()', () => {
    expect(cat(mk({ name: 'Ana María López', colorKey: 'a', categories: 8 }))).toBe('4')
    expect(cat(mk({ name: 'Otra persona', colorKey: 'u_8f3a2c', categories: 12 }))).toBe('2')
    expect(cat(mk({ colorKey: 42, categories: 8 }))).toBe(cat(mk({ colorKey: '42', categories: 8 })))
  })
  it('categories sin clave (ni colorKey ni name): neutro', () => {
    expect(cat(mk({ categories: 8 }))).toBe(null)
    expect(cat(mk({ name: '  ', categories: 8 }))).toBe(null)
  })
  it('un color no válido se ignora como si no estuviera: sigue el derivado o el neutro', () => {
    spyWarn()
    expect(cat(mk({ name: 'Ana María López', color: 'danger', categories: 8 }))).toBe('2')
    expect(cat(mk({ name: 'Ana María López', color: 13 }))).toBe(null)
    expect(cat(mk({ name: 'Ana María López', color: 2.5 }))).toBe(null)
    expect(cat(mk({ name: 'Ana María López', color: '#ff0000' }))).toBe(null)
  })
  it('categories fuera de 0..12 o no entero: se trata como 0', () => {
    spyWarn()
    for (const n of [13, -1, 2.5, NaN]) expect(cat(mk({ name: 'Ana María López', categories: n })), String(n)).toBe(null)
  })
})

describe('GAvatar · imagen (avatar.md «Imagen»)', () => {
  it('load → is-loaded; la <img> y el respaldo siguen en el DOM', async () => {
    const w = mk({ src: 'a.png', name: 'Ana López' })
    expect(root(w).classes()).toContain('is-loading')
    await w.find('img').trigger('load')
    expect(root(w).classes()).toContain('is-loaded')
    expect(root(w).classes()).not.toContain('is-loading')
    expect(w.find('img').exists()).toBe(true)
    expect(ini(w)).toBe('AL')
  })
  it('error → is-failed y se QUITA la <img>; queda el respaldo (iniciales o icono)', async () => {
    const w = mk({ src: 'roto.png', name: 'Marta Gil' })
    await w.find('img').trigger('error')
    expect(root(w).classes()).toContain('is-failed')
    expect(w.find('img').exists()).toBe(false)
    expect(ini(w)).toBe('MG')
    const w2 = mk({ src: 'roto2.png' })
    await w2.find('img').trigger('error')
    expect(w2.find('img').exists()).toBe(false)
    expect(iconSvg(w2).exists()).toBe(true)
  })
  it('cambiar src vuelve a is-loading con una <img> NUEVA (key = src), también tras un fallo', async () => {
    const w = mk({ src: 'a.png', name: 'Ana' })
    const first = w.find('img').element
    await w.find('img').trigger('load')
    await w.setProps({ src: 'b.png' })
    expect(root(w).classes()).toContain('is-loading')
    const second = w.find('img').element
    expect(second).not.toBe(first)
    expect(second.getAttribute('src')).toBe('b.png')
    await w.find('img').trigger('error')
    expect(w.find('img').exists()).toBe(false)
    await w.setProps({ src: 'c.png' })
    expect(root(w).classes()).toContain('is-loading')
    expect(w.find('img').attributes('src')).toBe('c.png')
  })
  it('un evento tardío de la imagen anterior no cambia el estado de la nueva', async () => {
    const w = mk({ src: 'a.png' })
    const old = w.find('img')
    const oldLoad = old.element
    await w.setProps({ src: 'b.png' })
    oldLoad.dispatchEvent(new Event('load'))
    await nextTick()
    expect(root(w).classes()).toContain('is-loading')
  })
  it('quitar src deja solo el respaldo, sin clase de estado', async () => {
    const w = mk({ src: 'a.png', name: 'Ana' })
    await w.setProps({ src: undefined })
    expect(w.find('img').exists()).toBe(false)
    expect(root(w).classes().some((c) => c.startsWith('is-'))).toBe(false)
  })
  it('imagen ya en caché al montar: complete + naturalWidth → is-loaded sin esperar a load', async () => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true)
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(64)
    const w = mk({ src: 'cache.png', name: 'Ana' })
    await nextTick()
    expect(root(w).classes()).toContain('is-loaded')
  })
  it('completa sin tamaño natural: decode() decide (rechaza → is-failed; resuelve → is-loaded)', async () => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true)
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(0)
    HTMLImageElement.prototype.decode = vi.fn(() => Promise.reject(new Error('EncodingError')))
    const broken = mk({ src: 'roto-cache.png', name: 'Ana' })
    await new Promise((r) => setTimeout(r))
    expect(root(broken).classes()).toContain('is-failed')
    expect(broken.find('img').exists()).toBe(false)
    HTMLImageElement.prototype.decode = vi.fn(() => Promise.resolve())
    const svg = mk({ src: 'sin-tamano.svg', name: 'Ana' })
    await new Promise((r) => setTimeout(r))
    expect(root(svg).classes()).toContain('is-loaded')
    delete HTMLImageElement.prototype.decode
  })
  it('cambio de src con la nueva imagen ya en caché: is-loaded tras el render, sin esperar a load', async () => {
    const w = mk({ src: 'a.png' })
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true)
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(32)
    await w.setProps({ src: 'cache2.png' })
    // microtareas: sin pintar entre medias (sin parpadeo)
    await new Promise((r) => setTimeout(r))
    expect(root(w).classes()).toContain('is-loaded')
  })
})

describe('GAvatar · semántica (avatar.md «Semántica»)', () => {
  it('sin label: aria-hidden="true" en la raíz, sin rol ni nombre', () => {
    const r = root(mk({ name: 'Ana López' }))
    expect(r.attributes('aria-hidden')).toBe('true')
    expect(r.attributes('role')).toBeUndefined()
    expect(r.attributes('aria-label')).toBeUndefined()
  })
  it('con label: role="img" + aria-label, sin aria-hidden; name NO es el nombre accesible', () => {
    const r = root(mk({ name: 'Ana López', label: 'Ana María López' }))
    expect(r.attributes('role')).toBe('img')
    expect(r.attributes('aria-label')).toBe('Ana María López')
    expect(r.attributes('aria-hidden')).toBeUndefined()
    expect(root(mk({ name: 'Ana López' })).attributes('aria-label')).toBeUndefined()
  })
  it('la <img> lleva SIEMPRE alt="" (cargando, cargada, con y sin label)', async () => {
    const w = mk({ src: 'a.png', label: 'Ana' })
    expect(w.find('img').attributes('alt')).toBe('')
    await w.find('img').trigger('load')
    expect(w.find('img').attributes('alt')).toBe('')
    expect(root(w).attributes('aria-label')).toBe('Ana')
    expect(mk({ src: 'a.png' }).find('img').attributes('alt')).toBe('')
  })
})

describe('GAvatar · atributos (inheritAttrs: false)', () => {
  it('class, style, id, title, data-* y lang van a la raíz; nunca a la <img>', () => {
    const w = mk({ src: 'a.png', name: 'Ana' }, { attrs: { class: 'mia', style: 'margin: 0', id: 'av1', title: 'Ana', 'data-x': '1', lang: 'es' } })
    const r = root(w)
    expect(r.classes()).toContain('mia')
    expect(r.classes()[0]).toBe('g-avatar')
    expect(r.attributes('style')).toContain('margin')
    expect(r.attributes('id')).toBe('av1')
    expect(r.attributes('title')).toBe('Ana')
    expect(r.attributes('data-x')).toBe('1')
    expect(r.attributes('lang')).toBe('es')
    const img = w.find('img')
    for (const a of ['class', 'id', 'title', 'data-x', 'lang', 'style']) if (a !== 'class') expect(img.attributes(a), a).toBeUndefined()
    expect(img.classes()).toEqual(['g-avatar__img'])
  })
  it('role, aria-*, tabindex y escuchas NO llegan a la raíz (y un clic no llama al manejador)', async () => {
    spyWarn()
    const onClick = vi.fn()
    const w = mk({ name: 'Ana' }, { attrs: { role: 'button', 'aria-label': 'X', 'aria-describedby': 'd', tabindex: '0', onClick, onKeydown: vi.fn() } })
    const r = root(w)
    expect(r.attributes('role')).toBeUndefined()
    expect(r.attributes('aria-label')).toBeUndefined()
    expect(r.attributes('aria-describedby')).toBeUndefined()
    expect(r.attributes('tabindex')).toBeUndefined()
    expect(r.attributes('aria-hidden')).toBe('true')
    await r.trigger('click')
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('GAvatar · avisos de desarrollo (avatar.md «Avisos», siete causas)', () => {
  it('1 · label dentro de un antecesor aria-hidden (al montar); fuera de él, nada', async () => {
    const G = await fresh()
    const s = spyWarn()
    const w = mount({ render: () => h('span', { 'aria-hidden': 'true' }, [h(G, { label: 'Ana María López', name: 'Ana' })]) }, { attachTo: document.body })
    wrappers.push(w)
    expect(grana(s).filter((m) => m.includes('aria-hidden') && m.includes('Ana María López'))).toHaveLength(1)
    const w2 = mount(G, { props: { label: 'Otra' }, attachTo: document.body })
    wrappers.push(w2)
    expect(grana(s).filter((m) => m.includes('Otra'))).toHaveLength(0)
  })
  it('2 · initials con más grafemas que el máximo absoluto: corta y avisa una vez; xs/sm sin aviso extra', async () => {
    const G = await fresh()
    const s = spyWarn()
    mount(G, { props: { initials: 'ABC' } })
    mount(G, { props: { initials: 'ABC' } })
    expect(grana(s).filter((m) => m.includes('initials="ABC"'))).toHaveLength(1)
    mount(G, { props: { initials: 'AB', size: 'xs' } })
    mount(G, { props: { initials: '李小', size: 'md' } })
    expect(grana(s).filter((m) => m.includes('initials="AB"'))).toHaveLength(0)
    expect(grana(s).filter((m) => m.includes('initials="李小"'))).toHaveLength(1)
  })
  it('3 · color no válido: semánticos con su propio texto, otros con el genérico', async () => {
    const G = await fresh()
    const s = spyWarn()
    mount(G, { props: { color: 'danger' } })
    mount(G, { props: { color: 'brand' } })
    mount(G, { props: { color: 'rojo' } })
    mount(G, { props: { color: 13 } })
    const m = grana(s)
    expect(m.find((x) => x.includes('color="danger"'))).toMatch(/color semántico/)
    expect(m.find((x) => x.includes('color="brand"'))).toMatch(/color semántico/)
    expect(m.find((x) => x.includes('color="rojo"'))).not.toMatch(/semántico/)
    expect(m.find((x) => x.includes('color="13"'))).toBeTruthy()
    mount(G, { props: { color: 'neutral' } })
    mount(G, { props: { color: 4 } })
    mount(G, { props: { color: '4' } })
    expect(grana(s)).toHaveLength(4)
  })
  it('4 · categories fuera de 0..12 o no entero', async () => {
    const G = await fresh()
    const s = spyWarn()
    mount(G, { props: { categories: 13 } })
    mount(G, { props: { categories: 2.5 } })
    mount(G, { props: { categories: 12 } })
    mount(G, { props: { categories: 0 } })
    const m = grana(s)
    expect(m.filter((x) => x.includes('categories='))).toHaveLength(2)
  })
  it('5 · role, aria-*, tabindex y escuchas: no se pasan y avisan (remite a label o a un <button>)', async () => {
    const G = await fresh()
    const s = spyWarn()
    mount(G, { attrs: { role: 'button', 'aria-label': 'x', tabindex: '0', onClick: () => {} } })
    const m = grana(s)
    for (const k of ['role', 'aria-label', 'tabindex']) expect(m.find((x) => x.includes(`«${k}»`)), k).toMatch(/label/)
    expect(m.find((x) => x.includes('«onClick»'))).toMatch(/<button>/)
  })
  it('6 · icon que no está en el registro ni en la librería: sigue la cadena y explica cómo registrarlo', async () => {
    const G = await fresh()
    const s = spyWarn()
    const w = mount(G, { props: { icon: 'no-existe-xyz', name: 'Ana López' } })
    mount(G, { props: { icon: 'no-existe-xyz' } })
    expect(w.find('.g-avatar__initials').text()).toBe('AL')
    const m = grana(s).filter((x) => x.includes('no-existe-xyz'))
    expect(m).toHaveLength(1)
    expect(m[0]).toMatch(/createIcons/)
  })
  it('7 · contenido en el slot por defecto: no se pinta y avisa', async () => {
    const G = await fresh()
    const s = spyWarn()
    const w = mount(G, { props: { name: 'Ana' }, slots: { default: () => 'Hola' } })
    expect(w.text()).not.toContain('Hola')
    expect(grana(s).filter((x) => /src, initials, icon o label/.test(x))).toHaveLength(1)
  })
  it('sin causas, ningún aviso (ni de Grana ni de Vue)', async () => {
    const G = await fresh()
    const s = spyWarn()
    mount(G, { props: { src: 'a.png', name: 'Ana López', size: 'xl', shape: 'square', color: 3, categories: 8, colorKey: 7, label: 'Ana' } })
    mount(G, { props: { icon: 'users', initials: 'AB' } })
    expect(s.mock.calls).toEqual([])
  })
  it('en producción no avisa', async () => {
    const G = await fresh()
    const s = spyWarn()
    const prev = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    try {
      mount(G, { props: { color: 'danger', categories: 99, initials: 'ABCD', icon: 'no-existe-prod' }, attrs: { role: 'button' } })
    } finally {
      process.env.NODE_ENV = prev
    }
    expect(grana(s)).toEqual([])
  })
})
