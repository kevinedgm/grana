// GSidebar r02 · parte funcional en el DOM real (dist UMD): cortes de adaptación (`breakpoints`, #618), representante del
// riel (`is-rep`, #616) y ruta encendida (`has-current`), con el CSS de coco. Contrato: design/contracts/sidebar.md.
// Un solo proceso por puerto: GRANA_PW_PORT=4229 (bruno, r02 del sidebar).
import { test, expect } from '@playwright/test'
import { PAGE, watchConsole, frames } from './visual-tip-helpers.mjs'

const ITEMS = [
  { label: 'Principal', items: [
    { id: 'home', label: 'Inicio', href: '#home', icon: 'house' },
    { id: 'inbox', label: 'Bandeja', href: '#inbox', icon: 'inbox' }
  ] },
  { label: 'Espacio', items: [
    { id: 'proj', label: 'Proyectos', icon: 'folder', children: [
      { id: 'p1', label: 'Todos', href: '#p1' }, { id: 'p2', label: 'Archivados', href: '#p2' }
    ] },
    { id: 'team', label: 'Equipo', href: '#team', icon: 'users' }
  ] }
]
const LABELS = { collapse: 'Contraer', expand: 'Expandir', more: 'Más', moreActive: 'contiene la página actual', drawer: 'Navegación', close: 'Cerrar' }

// Monta un GSidebar nuevo en un anfitrión de ancho controlado, sobre la página del playground (Vue + dist/grana.umd.js)
async function mountSidebar(page, props) {
  await page.goto(PAGE)
  await page.waitForFunction(() => window.Vue && window.Grana)
  await page.evaluate(({ props, ITEMS, LABELS }) => {
    const host = document.createElement('div')
    host.id = 'r02-host'
    host.style.cssText = 'position: relative; width: 1200px; height: 600px; overflow: hidden'
    document.body.prepend(host)
    const { createApp, h, ref } = window.Vue
    const state = window.__sb = { model: ref(props.modelValue ?? null), bp: ref(props.breakpoints ?? null), modes: [] }
    const app = createApp({
      setup: () => () => h(window.Grana.GSidebar, {
        items: ITEMS, labels: LABELS, label: 'Principal', contained: true, mobile: props.mobile, mode: props.mode ?? 'auto',
        modelValue: state.model.value, breakpoints: state.bp.value,
        'onUpdate:modelValue': (v) => { state.model.value = v },
        onModeChange: (e) => state.modes.push(e.mode),
        onNavigate: (e) => e?.event?.preventDefault?.()
      })
    })
    app.use(window.Grana.default ?? window.Grana)
    app.mount(host)
  }, { props, ITEMS, LABELS })
  await frames(page, 3)
}
const setWidth = async (page, px) => { await page.evaluate((w) => { document.getElementById('r02-host').style.width = `${w}px` }, px); await frames(page, 4) }
const formatOf = (page) => page.evaluate(() => {
  const host = document.getElementById('r02-host')
  if (host.querySelector('nav.g-sidebar--mode-navbar')) return 'navbar'
  const side = [...host.querySelectorAll('div.g-sidebar')].find((d) => !d.closest('dialog'))
  return side ? side.dataset.mode : (host.querySelector('dialog.g-sidebar__drawer') ? 'drawer' : 'none')
})

test.describe('GSidebar r02 · cortes de adaptación (breakpoints)', () => {
  test('caso real: { expanded: 1024, rail: 1024 } + mobile="drawer" → drawer por debajo de 1024, sin riel', async ({ page }) => {
    const errs = await watchConsole(page)
    await mountSidebar(page, { breakpoints: { expanded: 1024, rail: 1024 }, mobile: 'drawer', modelValue: 'home' })
    await setWidth(page, 1100)
    expect(await formatOf(page)).toBe('expanded')
    await setWidth(page, 1000)
    expect(await formatOf(page)).toBe('drawer')
    await setWidth(page, 1024)
    expect(await formatOf(page)).toBe('expanded')
    await setWidth(page, 700)
    expect(await formatOf(page)).toBe('drawer')
    const modes = await page.evaluate(() => window.__sb.modes)
    expect(modes).not.toContain('rail')
    expect(modes.at(-1)).toBe('drawer')
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('sin breakpoints: los cortes de siempre (960 / 600); el cambio de la prop decide al momento', async ({ page }) => {
    const errs = await watchConsole(page)
    await mountSidebar(page, { modelValue: 'home' })
    await setWidth(page, 1000)
    expect(await formatOf(page)).toBe('expanded')
    await setWidth(page, 800)
    expect(await formatOf(page)).toBe('rail')
    await setWidth(page, 500)
    expect(await formatOf(page)).toBe('navbar')
    // Sin redimensionar: rail: 0 → riel; luego expanded: 400 → expandida
    await page.evaluate(() => { window.__sb.bp.value = { rail: 0 } })
    await frames(page, 3)
    expect(await formatOf(page)).toBe('rail')
    await page.evaluate(() => { window.__sb.bp.value = { expanded: 400 } })
    await frames(page, 3)
    expect(await formatOf(page)).toBe('expanded')
    expect(errs, errs.join('\n')).toEqual([])
  })
})

test.describe('GSidebar r02 · asiento: is-rep y has-current en el DOM real', () => {
  test('expandida: rama sin is-rep, has-current en sus hijos, aria-current solo en el hijo; el riel la convierte en representante', async ({ page }) => {
    const errs = await watchConsole(page)
    await mountSidebar(page, { mode: 'expanded', modelValue: 'p2' })
    const read = () => page.evaluate(() => {
      const host = document.getElementById('r02-host')
      const side = [...host.querySelectorAll('div.g-sidebar')].find((d) => !d.closest('dialog'))
      const parent = side.querySelector('.g-sidebar__nav [data-id="proj"]')
      const sub = side.querySelector('.g-sidebar__sub')
      const icon = parent.querySelector('.g-sidebar__icon')
      return {
        mode: side.dataset.mode,
        parent: [...parent.classList].filter((c) => c.startsWith('is-')),
        parentCurrent: parent.getAttribute('aria-current'),
        sub: [...sub.classList],
        currents: [...side.querySelectorAll('[aria-current="page"]')].map((e) => e.dataset.id),
        iconW: icon.getBoundingClientRect().width,
        same: parent === window.__sbParent
      }
    })
    await page.evaluate(() => { window.__sbParent = document.querySelector('#r02-host .g-sidebar__nav [data-id="proj"]') })
    const a = await read()
    expect(a.mode).toBe('expanded')
    expect(a.parent).toContain('is-branch')
    expect(a.parent).not.toContain('is-rep')
    expect(a.parentCurrent).toBeNull()
    expect(a.sub).toEqual(expect.arrayContaining(['g-sidebar__sub', 'is-open', 'has-current']))
    expect(a.currents).toEqual(['p2'])
    await page.click('#r02-host .g-sidebar__toggle')
    await frames(page, 4)
    const b = await read()
    expect(b.mode).toBe('rail')
    expect(b.same).toBe(true)
    expect(b.parent).toEqual(expect.arrayContaining(['is-branch', 'is-rep']))
    expect(b.parentCurrent).toBeNull()
    // El asiento mide lo mismo en expandida y en riel (no cambia de forma al contraer)
    expect(Math.abs(b.iconW - a.iconW)).toBeLessThan(0.5)
    // Al abrir el panel, el hijo actual sigue siendo el único con aria-current
    await page.click('#r02-host .g-sidebar__nav [data-id="proj"]')
    await frames(page, 4)
    const fly = await page.evaluate(() => [...document.querySelectorAll('#r02-host .g-sidebar__fly [aria-current="page"]')].map((e) => e.dataset.id))
    expect(fly).toEqual(['p2'])
    await page.keyboard.press('Escape')
    await page.click('#r02-host .g-sidebar__toggle')
    await frames(page, 4)
    const c = await read()
    expect(c.mode).toBe('expanded')
    expect(c.same).toBe(true)
    expect(c.parent).not.toContain('is-rep')
    expect(errs, errs.join('\n')).toEqual([])
  })

  test('is-rep y has-current siguen al modelo al navegar', async ({ page }) => {
    const errs = await watchConsole(page)
    await mountSidebar(page, { mode: 'rail', modelValue: 'p1' })
    const st = () => page.evaluate(() => ({
      rep: [...document.querySelectorAll('#r02-host .is-rep')].map((e) => e.dataset.id),
      has: document.querySelectorAll('#r02-host .g-sidebar__sub.has-current').length
    }))
    expect(await st()).toEqual({ rep: ['proj'], has: 1 })
    await page.evaluate(() => { window.__sb.model.value = 'team' })
    await frames(page, 2)
    expect(await st()).toEqual({ rep: [], has: 0 })
    expect(errs, errs.join('\n')).toEqual([])
  })
})
