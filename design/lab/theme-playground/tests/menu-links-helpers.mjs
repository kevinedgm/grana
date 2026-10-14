// Montaje común de los specs de elementos-enlace de GMenu (menu.md «Elementos-enlace», #571 a #579), sobre el GMenu REAL del
// UMD (window.Grana) en la página del playground, con los datos de la ronda design/lab/menu/r02/ (verificar.mjs).
export const PAGE = '/packages/vue/playground/index.html'

export const LABELS = {
  external: ', otro sitio',
  newTab: ', abre en una pestaña nueva',
  destExternal: 'Otro sitio',
  destNewTab: 'Pestaña nueva',
  opened: 'Abierta',
  openedLive: '{label} abierta en otra pestaña',
  copied: 'Enlace copiado',
  copiedLive: 'Enlace de {label} copiado'
}
export const ACCOUNT = [
  { id: 'perfil', label: 'Mi perfil', icon: 'user', href: '#/perfil', current: true },
  { id: 'ajustes', label: 'Ajustes', icon: 'settings', href: '#/ajustes', shortcut: 'Ctrl+,' },
  { id: 'invitar', label: 'Invitar al equipo', icon: 'user-plus' },
  { type: 'separator' },
  { id: 'docs', label: 'Documentación', icon: 'file-text', href: 'https://example.org/docs/grana/menu', target: '_blank', external: true },
  { id: 'estado', label: 'Estado del servicio', icon: 'search', href: 'https://status.example.org/', external: true },
  { id: 'factura', label: 'Facturación', icon: 'credit-card', href: '#/facturacion', disabled: true },
  { type: 'separator' },
  { id: 'oscuro', type: 'checkbox', label: 'Tema oscuro', checked: false },
  { type: 'separator' },
  { id: 'salir', label: 'Cerrar sesión', icon: 'unplug', href: '#/salir' }
]
export const FILE = [
  { id: 'abrir', label: 'Abrir ficha', icon: 'file-text', href: '#/muestras/m-0007' },
  { id: 'historial', label: 'Historial', href: '#/muestras/m-0007/historial' },
  { id: 'duplicar', label: 'Duplicar', icon: 'copy' },
  { id: 'mover', label: 'Mover a…', disabled: true },
  { type: 'separator' },
  { id: 'eliminar', label: 'Eliminar', icon: 'trash', danger: true }
]
export const SUB = [
  { id: 'inicio', label: 'Inicio', href: '#/inicio' },
  { label: 'Ayuda', items: [
    { id: 'guia', label: 'Guía', href: 'https://example.org/guia', external: true },
    { id: 'atajos', label: 'Atajos' }
  ] }
]

// Monta tres menús (cuenta, ficha y uno con submenú). window.__nav: ids de navigate; window.__sel: ids de select;
// window.__router (true por defecto): navigate cancela (router simulado). window.__open: estado abierto por menú.
export async function mountLinks(page, { dir = 'ltr', labels = LABELS, theme = null, scheme = 'light' } = {}) {
  await page.context().route(/example\.org/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<title>externo</title>' }))
  await page.goto(PAGE)
  await page.waitForSelector('.g-btn', { timeout: 60_000 })
  await page.evaluate(async ({ dir, labels, account, file, sub, theme, scheme }) => {
    document.documentElement.dataset.theme = scheme
    if (dir === 'rtl') document.documentElement.dir = 'rtl'
    if (theme) {
      const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = theme
      await new Promise((res) => { l.onload = res; document.head.appendChild(l) })
    }
    const host = document.createElement('div')
    host.id = 'ml-host'
    host.style.cssText = 'padding:24px;display:flex;gap:24px;background:var(--g-color-bg)'
    document.body.prepend(host)
    const { createApp, h, reactive } = window.Vue
    const { GMenu } = window.Grana
    const open = reactive({ account: false, file: false, sub: false })
    const data = reactive({ account, file, sub })
    window.__open = open
    window.__data = data
    window.__nav = []
    window.__sel = []
    window.__router = true
    const menu = (id, name) => h('div', { id: `ml-${id}` }, [h(GMenu, {
      id: `ml-${id}`, items: data[id], labels, modelValue: open[id], 'onUpdate:modelValue': (v) => { open[id] = v },
      onSelect: (e) => {
        window.__sel.push(e.id)
        if (e.type === 'checkbox') data[id] = data[id].map((x) => (x.id === e.id ? { ...x, checked: e.checked } : x))
      },
      onNavigate: (e) => { window.__nav.push(e.id); if (window.__router) e.event.preventDefault() }
    }, { trigger: ({ attrs }) => h('button', { ...attrs, class: 'ml-trigger', type: 'button', style: 'font:inherit;padding:8px 12px' }, name) })])
    createApp({ render: () => [menu('account', 'Kevin García'), menu('file', 'Muestra M-0007'), menu('sub', 'Ayuda y más')] }).mount(host)
  }, { dir, labels, account: ACCOUNT, file: FILE, sub: SUB, theme, scheme })
}

export const acc = (p) => p.locator('#ml-account')
export const openAcc = async (p) => { await acc(p).locator('.ml-trigger').focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(60) }
export const isOpen = (p, id = 'account') => p.evaluate((id) => window.__open[id], id)
export const active = (p) => p.evaluate(() => document.activeElement?.querySelector?.('.g-menu__label')?.textContent?.trim() || document.activeElement?.textContent?.trim() || document.activeElement?.tagName)
export const navs = (p) => p.evaluate(() => window.__nav.slice())
export const item = (p, label, root = acc(p)) => root.locator('.g-menu__item', { has: p.locator('.g-menu__label', { hasText: label }) })
export const hoverOn = async (p, label) => { await item(p, label).hover(); await p.waitForTimeout(40) }
export const modKey = (browserName) => (process.platform === 'darwin' && browserName !== 'firefox' ? 'Meta' : 'Control')

// Contraste WCAG entre dos colores calculados (canvas: normaliza oklch, color-mix…)
export const contrastOf = (p, fg, bg) => p.evaluate(([fg, bg]) => {
  const rgb = (c) => { const cv = document.createElement('canvas'); cv.width = cv.height = 1; const x = cv.getContext('2d'); x.fillStyle = c; x.fillRect(0, 0, 1, 1); return [...x.getImageData(0, 0, 1, 1).data].slice(0, 3) }
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  const a = lum(rgb(fg)); const b = lum(rgb(bg))
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}, [fg, bg])
