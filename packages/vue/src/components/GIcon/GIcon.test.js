// GIcon público y registro de iconos de la aplicación · docs/contract/icons.md v0.2 §7 (pruebas 3 a 6)
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createApp, defineComponent, h, nextTick, provide } from 'vue'
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import * as lucide from 'lucide-static'
import { LockOpen, Unlock, MapPin, Lock, Image, Play } from 'lucide-static'
import GIcon from './GIcon.vue'
import GLibIcon from './GLibIcon.js'
import { createIcons, iconsKey, parseLucide } from './registry.js'
import { ICONS, ALIASES } from '../../icons/lucide.js'
import { readIcon, readExport } from '../../../scripts/build-icons.mjs'
import { ROOT } from '../../../scripts/check-icons.mjs'
import GCheckbox from '../GCheckbox/GCheckbox.vue'
import GHelper from '../GHelper/GHelper.vue'
import Grana, * as api from '../../index.js'

afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

const silence = () => vi.spyOn(console, 'warn').mockImplementation(() => {})
const warnsWith = (spy, text) => spy.mock.calls.filter((c) => String(c[0]).includes(text))
// Monta con un registro de la aplicación (como app.use(createIcons([...])))
const withIcons = (registry, comp, props = {}, opts = {}) => mount(comp, { props, global: { plugins: registry ? [registry] : [] }, ...opts })
const LOCK_OPEN_PATH = 'M7 11V7a5 5 0 0 1 9.9-1'

describe('GIcon público · exportación e instalación', () => {
  it('se exporta con createIcons e iconsKey, e install lo registra (<g-icon> y <GIcon>)', () => {
    expect(api.GIcon).toBe(GIcon)
    expect(typeof api.createIcons).toBe('function')
    expect(typeof api.iconsKey).toBe('symbol')
    const app = createApp({ render: () => null })
    app.use(Grana)
    expect(app.component('GIcon')).toBe(GIcon)
    // install no cambia de firma: sin opciones (§5.5)
    expect(Grana.install.length).toBe(1)
  })
})

describe('GIcon · anatomía y accesibilidad (§2.3, §2.4)', () => {
  it('decorativo por defecto: aria-hidden, sin role ni aria-label, nunca enfocable', () => {
    const svg = mount(GIcon, { props: { name: 'lock' } }).find('svg')
    expect(svg.classes()).toEqual(['g-icon'])
    expect(svg.attributes()).toMatchObject({ xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', focusable: 'false', 'aria-hidden': 'true' })
    expect(svg.attributes('role')).toBeUndefined()
    expect(svg.attributes('aria-label')).toBeUndefined()
    expect(svg.attributes('tabindex')).toBeUndefined()
    expect(svg.find('title').exists()).toBe(false)
  })

  it('con label: role="img" + aria-label, sin aria-hidden; label vacío = decorativo', () => {
    const svg = mount(GIcon, { props: { name: 'lock', label: 'Bloqueado' } }).find('svg')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('Bloqueado')
    expect(svg.attributes('aria-hidden')).toBeUndefined()
    expect(svg.attributes('focusable')).toBe('false')
    expect(svg.attributes('tabindex')).toBeUndefined()
    const empty = mount(GIcon, { props: { name: 'lock', label: '' } }).find('svg')
    expect(empty.attributes('aria-hidden')).toBe('true')
    expect(empty.attributes('role')).toBeUndefined()
  })

  it('filled rellena con currentColor; flipRtl pone g-icon--flip-rtl (el espejo lo hace el CSS solo en RTL)', () => {
    const f = mount(GIcon, { props: { name: 'circle', filled: true } }).find('svg')
    expect(f.attributes('fill')).toBe('currentColor')
    expect(f.classes()).toContain('g-icon--filled')
    const r = mount(GIcon, { props: { name: 'chevron-right', flipRtl: true } }).find('svg')
    expect(r.classes()).toEqual(['g-icon', 'g-icon--flip-rtl'])
    expect(mount(GIcon, { props: { name: 'chevron-right' } }).find('svg').classes()).not.toContain('g-icon--flip-rtl')
    // en plantilla: flip-rtl
    const tpl = mount(defineComponent({ components: { GIcon }, template: '<GIcon name="chevron-right" flip-rtl />' }))
    expect(tpl.find('svg').classes()).toContain('g-icon--flip-rtl')
  })

  it('los atributos de la aplicación (class, id, data-*, style) pasan al svg; los fijos no se sobrescriben', () => {
    const svg = mount(GIcon, { props: { name: 'lock' }, attrs: { class: 'mi-icono', id: 'i1', 'data-x': '1', style: 'color: red', fill: 'red', viewBox: '0 0 1 1', 'stroke-width': '5', focusable: 'true' } }).find('svg')
    expect(svg.classes()).toEqual(['g-icon', 'mi-icono'])
    expect(svg.attributes()).toMatchObject({ id: 'i1', 'data-x': '1', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '2', focusable: 'false' })
    expect(svg.attributes('style')).toContain('color')
  })

  it('role, aria-* y tabindex como atributos se ignoran y avisan (una vez por causa y nombre)', () => {
    const warn = silence()
    const attrs = { role: 'button', 'aria-label': 'X', 'aria-hidden': 'false', 'aria-labelledby': 'a', 'aria-describedby': 'b', tabindex: '0' }
    const svg = mount(GIcon, { props: { name: 'minus' }, attrs }).find('svg')
    expect(svg.attributes('role')).toBeUndefined()
    expect(svg.attributes('aria-label')).toBeUndefined()
    expect(svg.attributes('aria-hidden')).toBe('true')
    expect(svg.attributes('aria-labelledby')).toBeUndefined()
    expect(svg.attributes('aria-describedby')).toBeUndefined()
    expect(svg.attributes('tabindex')).toBeUndefined()
    for (const k of Object.keys(attrs)) expect(warnsWith(warn, `«${k}»`).length, k).toBe(1)
    mount(GIcon, { props: { name: 'minus' }, attrs: { tabindex: '0' } })
    expect(warnsWith(warn, '«tabindex»')).toHaveLength(1)
    // con label, el aria-label propio es el del label
    const named = mount(GIcon, { props: { name: 'minus', label: 'Menos' }, attrs: { 'aria-label': 'Otro' } }).find('svg')
    expect(named.attributes('aria-label')).toBe('Menos')
  })

  it('label dentro de un antecesor aria-hidden avisa al montar y dibuja igual; sin label o fuera, no avisa', async () => {
    const warn = silence()
    const Host = defineComponent({ components: { GIcon }, props: ['label'], template: '<span aria-hidden="true"><b><GIcon name="lock" :label="label" /></b></span>' })
    const w = mount(Host, { props: { label: 'Bloqueado' }, attachTo: document.body })
    await nextTick()
    expect(w.find('svg').attributes('role')).toBe('img')
    expect(warnsWith(warn, 'aria-hidden')).toHaveLength(1)
    w.unmount()
    mount(Host, { props: { label: undefined }, attachTo: document.body })
    mount(defineComponent({ components: { GIcon }, template: '<span><GIcon name="check" label="Hecho" /></span>' }), { attachTo: document.body })
    expect(warnsWith(warn, 'aria-hidden')).toHaveLength(1)
  })

  it('un nombre desconocido no dibuja nada y avisa una vez cómo registrarlo', () => {
    const warn = silence()
    expect(mount(GIcon, { props: { name: 'no-existe-abc' } }).find('svg').exists()).toBe(false)
    mount(GIcon, { props: { name: 'no-existe-abc' } })
    const calls = warnsWith(warn, 'no-existe-abc')
    expect(calls).toHaveLength(1)
    expect(calls[0][0]).toContain('createIcons')
    expect(calls[0][0]).toContain('lucide-static')
  })
})

describe('createIcons · nombre derivado de la marca, alias y repetidos (§5.2)', () => {
  it('registra cadenas de lucide-static por el nombre de su marca; un alias (Unlock) da el nombre canónico', () => {
    const warn = silence()
    const reg = createIcons([LockOpen, Unlock, MapPin])
    expect(warn).not.toHaveBeenCalled()
    const svg = withIcons(reg, GIcon, { name: 'lock-open' }).find('svg')
    expect(svg.html()).toContain(LOCK_OPEN_PATH)
    expect(withIcons(reg, GIcon, { name: 'map-pin' }).find('svg').exists()).toBe(true)
    // 'unlock' no existe: el nombre es el de la marca
    expect(withIcons(reg, GIcon, { name: 'unlock' }).find('svg').exists()).toBe(false)
  })

  it('el dibujo registrado es el mismo que genera build-icons.mjs y no lleva los atributos del svg raíz', () => {
    const reg = createIcons([LockOpen])
    const svg = withIcons(reg, GIcon, { name: 'lock-open' }).find('svg')
    expect(parseLucide(LockOpen).paths).toBe(readIcon('lock-open'))
    expect(svg.element.innerHTML).toBe('<rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path>')
    expect(svg.attributes('width')).toBeUndefined()
    expect(svg.attributes('class')).toBe('g-icon')
  })

  it('repetidos con el mismo dibujo dan una entrada sin aviso; con dibujos distintos, el primero y aviso', () => {
    const warn = silence()
    createIcons([LockOpen, LockOpen, Unlock])
    expect(warn).not.toHaveBeenCalled()
    const other = LockOpen.replace('M7 11V7a5 5 0 0 1 9.9-1', 'M7 11V7a5 5 0 0 1 10 0')
    const reg = createIcons([LockOpen, other])
    expect(warnsWith(warn, 'lock-open')).toHaveLength(1)
    expect(withIcons(reg, GIcon, { name: 'lock-open' }).find('svg').html()).toContain(LOCK_OPEN_PATH)
  })

  it('un nombre que ya trae la librería se acepta sin aviso', () => {
    const warn = silence()
    const reg = createIcons([Lock])
    expect(warn).not.toHaveBeenCalled()
    expect(withIcons(reg, GIcon, { name: 'lock' }).find('svg').html()).toContain('M7 11V7a5 5 0 0 1 10 0v4')
  })

  it('un argumento que no es arreglo da un registro vacío y avisa', () => {
    const warn = silence()
    for (const bad of [undefined, null, LockOpen, { LockOpen }]) {
      const reg = createIcons(bad)
      expect(withIcons(reg, GIcon, { name: 'lock-open' }).find('svg').exists()).toBe(false)
    }
    expect(warnsWith(warn, 'arreglo').length).toBeGreaterThanOrEqual(1)
  })
})

describe('createIcons · validación estricta (§5.3): rechazos', () => {
  const lockOpen = (inner, root = '') => `<svg class="lucide lucide-lock-open"${root} viewBox="0 0 24 24">${inner}</svg>`
  const REJECTED = {
    'texto (un nombre)': 'lock-open',
    'SVG a mano sin la marca': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>',
    'SVG de otra colección': '<svg class="feather feather-lock" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11"/></svg>',
    'componente (objeto)': { name: 'LockOpen', render: () => null },
    'función': () => LockOpen,
    'número': 42,
    '<script> disfrazado': lockOpen('<path d="M4 4h16"/><script>window.__pwned = 1</script>'),
    'atributo onload': lockOpen('<path d="M4 4h16" onload="window.__pwned = 1"/>'),
    'atributo style': lockOpen('<path d="M4 4h16" style="fill: red"/>'),
    'href': lockOpen('<path d="M4 4h16" href="x"/>'),
    'xlink:href': lockOpen('<path d="M4 4h16" xlink:href="x"/>'),
    '<use>': lockOpen('<use href="#a"/>'),
    '<foreignObject>': lockOpen('<foreignObject><img src="x" onerror="window.__pwned = 1"/></foreignObject>'),
    '<g>': lockOpen('<g><path d="M4 4h16"/></g>'),
    '<image>': lockOpen('<image width="1" height="1"/>'),
    '<title>': lockOpen('<title>Candado</title><path d="M4 4h16"/>'),
    '<style>': lockOpen('<style>path{fill:red}</style><path d="M4 4h16"/>'),
    'texto suelto': lockOpen('hola<path d="M4 4h16"/>'),
    'comentario': lockOpen('<!-- x --><path d="M4 4h16"/>'),
    'entidad': lockOpen('<path d="M4&#32;4h16"/>'),
    'CDATA': lockOpen('<![CDATA[x]]><path d="M4 4h16"/>'),
    'elemento no vacío': lockOpen('<path d="M4 4h16"></path>'),
    'comillas simples': lockOpen("<path d='M4 4h16'/>"),
    'fill de color': lockOpen('<path d="M4 4h16" fill="#f00"/>'),
    'fill por referencia': lockOpen('<path d="M4 4h16" fill="url(#a)"/>'),
    'valor con paréntesis': lockOpen('<path d="M4 4h16" x="calc(1)"/>'),
    'stroke (atributo no geométrico)': lockOpen('<path d="M4 4h16" stroke="red"/>'),
    'dos svg': lockOpen('<path d="M4 4h16"/>') + lockOpen('<path d="M4 4h16"/>'),
    'svg anidado': lockOpen('<svg><path d="M4 4h16"/></svg>'),
    'svg vacío': lockOpen(''),
    'marca fuera de la etiqueta de apertura': '<svg viewBox="0 0 24 24"><path d="M4 4h16"/></svg><!-- class="lucide lucide-lock-open" -->',
    'declaración XML delante': '<?xml version="1.0"?>' + lockOpen('<path d="M4 4h16"/>')
  }

  it.each(Object.entries(REJECTED))('rechaza %s: no se registra y avisa', (label, value) => {
    const warn = silence()
    expect(parseLucide(value).error, label).toBeTruthy()
    const reg = createIcons([value])
    expect(warnsWith(warn, 'createIcons: se ignora').length, label).toBe(1)
    expect(withIcons(reg, GIcon, { name: 'lock-open' }).find('svg').exists(), label).toBe(false)
  })

  it('nada se ejecuta ni entra al DOM (la cadena se rechaza entera, nunca una versión «limpiada»)', async () => {
    silence()
    window.__pwned = 0
    const reg = createIcons([REJECTED['<script> disfrazado'], REJECTED['atributo onload'], REJECTED['<foreignObject>']])
    const w = mount(defineComponent({ components: { GIcon }, template: '<div><GIcon name="lock-open" /></div>' }), { global: { plugins: [reg] }, attachTo: document.body })
    await nextTick()
    await new Promise((r) => setTimeout(r, 20))
    expect(window.__pwned).toBe(0)
    expect(document.body.querySelector('svg, script, foreignObject, img')).toBeNull()
    expect(w.html()).not.toContain('pwned')
  })

  it('los atributos del svg raíz de la cadena se descartan (también los peligrosos)', () => {
    const reg = createIcons([lockOpen('<path d="M4 4h16"/>', ' onload="window.__pwned = 1" style="color: red" width="99"')])
    const svg = withIcons(reg, GIcon, { name: 'lock-open' }).find('svg')
    expect(svg.attributes('onload')).toBeUndefined()
    expect(svg.attributes('style')).toBeUndefined()
    expect(svg.attributes('width')).toBeUndefined()
    expect(svg.element.innerHTML).toBe('<path d="M4 4h16"></path>')
  })

  it('el mismo criterio sin avisos en producción: se rechaza en silencio y nunca lanza', () => {
    const prev = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    const warn = vi.spyOn(console, 'warn')
    try {
      const reg = createIcons(Object.values(REJECTED))
      expect(withIcons(reg, GIcon, { name: 'lock-open' }).find('svg').exists()).toBe(false)
      expect(() => createIcons('no')).not.toThrow()
      expect(warn).not.toHaveBeenCalled()
      const ok = createIcons([LockOpen])
      expect(withIcons(ok, GIcon, { name: 'lock-open' }).find('svg').exists()).toBe(true)
    } finally { process.env.NODE_ENV = prev }
  })
})

describe('createIcons · todo Lucide (§7 prueba 3; si cambia el formato de lucide-static, esta prueba debe fallar)', () => {
  it('todas las exportaciones en cadena de lucide-static se aceptan y su nombre tiene archivo en icons/', () => {
    const files = new Set(readdirSync(resolve(ROOT, 'node_modules/lucide-static/icons')).map((f) => f.replace(/\.svg$/, '')))
    const exports = Object.entries(lucide).filter(([, v]) => typeof v === 'string')
    expect(exports.length).toBeGreaterThan(2000)
    const bad = []
    for (const [key, value] of exports) {
      const r = parseLucide(value)
      if (r.error || !files.has(r.name)) bad.push(`${key}: ${r.error || r.name}`)
    }
    expect(bad).toEqual([])
    // Un registro con todas, sin avisos (alias y repetidos con el mismo dibujo dan una entrada)
    const warn = silence()
    createIcons(exports.map(([, v]) => v))
    expect(warn).not.toHaveBeenCalled()
  })

  it('cada módulo de lucide-static: el nombre derivado es el de su archivo y el dibujo coincide con build-icons.mjs', async () => {
    const dir = resolve(ROOT, 'node_modules/lucide-static/dist/esm/icons')
    const mods = readdirSync(dir).filter((f) => f.endsWith('.mjs'))
    expect(mods.length).toBeGreaterThan(1800)
    const bad = []
    await Promise.all(mods.map(async (f) => {
      const file = f.replace(/\.mjs$/, '')
      const { default: value } = await import(/* @vite-ignore */ pathToFileURL(resolve(dir, f)).href)
      const r = parseLucide(value)
      if (r.error) bad.push(`${file}: ${r.error}`)
      else if (r.name !== file) bad.push(`${file}: nombre ${r.name}`)
      else if (r.paths !== readIcon(file)) bad.push(`${file}: dibujo distinto`)
    }))
    expect(bad).toEqual([])
  }, 60000)

  // Prueba 3 (#206): se compara con el MÓDULO de dist/esm/icons/ de lucide-static (readExport), no con el identificador
  // importado: `CircleHelp` y `CircleQuestionMark` exportan el mismo módulo, pero un identificador de alias no prueba el nombre
  it('la lista de la librería coincide con el módulo de dist/esm/icons/ de lucide-static (mismo normalizado y mismo nombre)', () => {
    for (const n of Object.keys(ICONS)) {
      const [, exported] = readExport(n)
      const r = parseLucide(exported)
      expect(r.name, n).toBe(n)
      expect(r.paths, n).toBe(ICONS[n])
    }
  })
})

describe('Nombres canónicos de la librería (§7 prueba 9, #206)', () => {
  const moduleFiles = () => new Set(readdirSync(resolve(ROOT, 'node_modules/lucide-static/dist/esm/icons')).filter((f) => f.endsWith('.mjs')).map((f) => f.replace(/\.mjs$/, '')))

  it('cada nombre de la lista tiene su módulo en dist/esm/icons/ y la marca de ese módulo es el mismo nombre (si Lucide renombra uno, falla)', () => {
    const files = moduleFiles()
    const bad = []
    for (const n of Object.keys(ICONS)) {
      if (!files.has(n)) { bad.push(`${n}: no es un módulo canónico de lucide-static`); continue }
      const r = parseLucide(readExport(n)[1])
      if (r.name !== n) bad.push(`${n}: la marca dice ${r.name}`)
    }
    expect(bad).toEqual([])
  })

  it('un alias de compatibilidad apunta a un canónico de la lista, con el mismo dibujo y sin duplicarlo en el paquete', () => {
    const files = moduleFiles()
    expect(Object.keys(ALIASES)).toEqual(['circle-help'])
    for (const [alias, target] of Object.entries(ALIASES)) {
      expect(Object.keys(ICONS), alias).toContain(target)
      expect(Object.keys(ICONS), `${alias} no se duplica en la lista`).not.toContain(alias)
      expect(files.has(alias), `${alias} no es canónico (es un archivo de alias de icons/)`).toBe(false)
      // el alias dibuja lo mismo en Lucide y en la librería
      expect(readIcon(alias), alias).toBe(readIcon(target))
      expect(mount(GLibIcon, { props: { name: alias } }).html()).toBe(mount(GLibIcon, { props: { name: target } }).html())
    }
  })

  it('un alias dibuja sin aviso y sin registrar; el canónico y el alias dan el mismo svg', () => {
    const warn = silence()
    const a = mount(GIcon, { props: { name: 'circle-help' } }).find('svg')
    const c = mount(GIcon, { props: { name: 'circle-question-mark' } }).find('svg')
    expect(a.exists()).toBe(true)
    expect(a.html()).toBe(c.html())
    expect(c.html()).toContain('M9.09 9a3 3 0 0 1 5.83 1')
    expect(warn).not.toHaveBeenCalled()
  })

  it('GHelper usa el nombre canónico en su disparador por defecto', () => {
    const w = mount(GHelper, { props: { ariaLabel: 'Abrir ayuda', contentLabel: 'Ayuda', closeLabel: 'Cerrar' }, slots: { content: () => 'x' } })
    expect(w.find('button.g-helper__trigger svg').html()).toBe(mount(GLibIcon, { props: { name: 'circle-question-mark' } }).find('svg').html())
  })
})

describe('Resolución (§5.4)', () => {
  // Una cadena con la marca de un icono de la librería y otro dibujo (§8: pasa la validación)
  const fakeX = '<svg class="lucide lucide-x" viewBox="0 0 24 24"><circle cx="1" cy="1" r="1"/></svg>'

  it('nombres de la aplicación: el registro más cercano gana a la librería', () => {
    silence()
    const reg = createIcons([fakeX])
    expect(withIcons(reg, GIcon, { name: 'x' }).find('svg').html()).toContain('<circle cx="1" cy="1" r="1">')
    expect(mount(GIcon, { props: { name: 'x' } }).find('svg').html()).toContain('M18 6 6 18')
  })

  it('los iconos propios de un componente ignoran el registro (solo la librería)', () => {
    silence()
    const reg = createIcons([fakeX])
    expect(withIcons(reg, GLibIcon, { name: 'x' }).find('svg').html()).toContain('M18 6 6 18')
    // el check de GCheckbox sigue siendo el de la librería con un registro que trae otra «check»
    const fakeCheck = '<svg class="lucide lucide-check" viewBox="0 0 24 24"><circle cx="2" cy="2" r="2"/></svg>'
    const cb = withIcons(createIcons([fakeCheck]), GCheckbox, { label: 'Acepto', modelValue: true })
    expect(cb.find('svg.g-checkbox__check').html()).toContain('M20 6 9 17l-5-5')
    expect(cb.html()).not.toContain('cx="2"')
    // un nombre que solo está en el registro no lo dibuja un icono propio
    expect(withIcons(createIcons([LockOpen]), GLibIcon, { name: 'lock-open' }).find('svg').exists()).toBe(false)
  })

  it('un provide(iconsKey) en un subárbol sustituye entero al de la aplicación (no se mezclan)', () => {
    const app = createIcons([LockOpen])
    const sub = createIcons([MapPin])
    const Sub = defineComponent({ setup(_, { slots }) { provide(iconsKey, sub); return () => slots.default() } })
    const w = mount(defineComponent({
      components: { GIcon, Sub },
      template: '<div><GIcon class="a" name="lock-open" /><Sub><GIcon class="b" name="lock-open" /><GIcon class="c" name="map-pin" /><GIcon class="d" name="lock" /></Sub></div>'
    }), { global: { plugins: [app] } })
    silence()
    expect(w.find('svg.a').exists()).toBe(true)
    expect(w.find('svg.b').exists()).toBe(false) // el del subárbol no trae lock-open
    expect(w.find('svg.c').exists()).toBe(true)
    expect(w.find('svg.d').exists()).toBe(true) // la librería sigue detrás
  })

  it('un segundo registro en la misma aplicación lo sustituye y avisa', () => {
    const warn = silence()
    const host = document.createElement('div')
    const app = createApp({ render: () => [h(GIcon, { name: 'lock-open', class: 'a' }), h(GIcon, { name: 'map-pin', class: 'b' })] })
    app.use(createIcons([LockOpen])).use(createIcons([MapPin]))
    app.mount(host)
    expect(warnsWith(warn, 'sustituye')).toHaveLength(1)
    expect(warn.mock.calls.filter((c) => String(c[0]).includes('[Vue warn]'))).toHaveLength(0)
    expect(host.querySelector('svg.a')).toBeNull()
    expect(host.querySelector('svg.b')).not.toBeNull()
    app.unmount()
  })

  it('un valor provisto que no es un registro se ignora (la librería sigue)', () => {
    const w = mount(GIcon, { props: { name: 'lock' }, global: { provide: { [iconsKey]: { lock: '<script>x</script>' } } } })
    expect(w.find('svg').html()).not.toContain('script')
    expect(w.find('svg').html()).toContain('M7 11V7a5 5 0 0 1 10 0v4')
  })

  it('el registro admite los iconos de ejemplo de GCard (image, play); image entró en la librería con GFileField (#377), play no', () => {
    const reg = createIcons([Image, Play])
    expect(ICONS.image).toBeDefined()
    expect(ICONS.play).toBeUndefined()
    expect(withIcons(reg, GIcon, { name: 'image' }).find('svg').exists()).toBe(true)
    expect(withIcons(reg, GIcon, { name: 'play' }).find('svg').exists()).toBe(true)
  })
})
