// Ayudantes comunes de los specs de GCombobox (combobox.spec, combobox-forma.spec, personalidad-combobox.spec) sobre el
// COMPONENTE REAL del playground (packages/vue/playground, #sec-combobox). No es un spec.
export const PAGE = '/packages/vue/playground/index.html'

export async function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana GCombobox|\[Grana\] <G(Input|Dialog)>/.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}

/** fast: red simulada a 30 ms y antirrebote de 20 ms (window.__cbFast); sin él, tiempos reales (380 ms y 250 ms) */
export async function open(page, { width = 1280, height = 900, motion = 'reduce', fast = true, target = '#sec-combobox' } = {}) {
  await page.emulateMedia({ reducedMotion: motion })
  await page.setViewportSize({ width, height })
  if (fast) await page.addInitScript(() => { window.__cbFast = true })
  // Registro de anuncios: cada texto no vacío que entra en una región viva de GCombobox
  await page.addInitScript(() => {
    window.__cbLive = []
    const start = () => new MutationObserver((list) => {
      for (const m of list) {
        const el = (m.target.nodeType === 1 ? m.target : m.target.parentElement)?.closest?.('.g-combobox__live')
        const text = el && el.textContent.trim()
        if (text) window.__cbLive.push({ text, dialog: Boolean(el.closest('dialog[open]')) })
      }
    }).observe(document.documentElement, { subtree: true, childList: true, characterData: true })
    if (document.documentElement) start()
    else document.addEventListener('readystatechange', start, { once: true })
  })
  await page.goto(PAGE)
  await page.waitForSelector('#cb-pac')
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
  await page.evaluate(() => document.fonts.ready)
  if (target) await page.locator(target).scrollIntoViewIfNeeded()
}

export const frames = (page, n = 2) => page.evaluate((k) => new Promise((r) => { const f = () => (k-- > 0 ? requestAnimationFrame(f) : setTimeout(r, 20)); f() }), n)
export const live = (page) => page.evaluate(() => window.__cbLive.map((x) => ({ ...x })))
export const calls = (page) => page.evaluate(() => window.PlaygroundCombobox.server.calls)

/** Estado de un GCombobox por el id de su campo */
export const st = (page, id) => page.evaluate((id) => {
  const i = document.getElementById(id)
  const root = i.closest('.g-combobox')
  const surf = document.getElementById(id + '-surface')
  const sf = document.getElementById(id + '-search')
  const list = document.getElementById(id + '-list')
  const pop = document.getElementById(id + '-popup')
  const cb = surf && surf.open ? sf : i
  const opts = list ? [...list.querySelectorAll('[role=option]')] : []
  const isAct = (o) => o.classList.contains('g-combobox__action')
  const act = cb.getAttribute('aria-activedescendant')
  const status = document.getElementById(id + '-status')
  const marked = list ? list.querySelector('.is-active') : null
  return {
    open: root.classList.contains('is-open'), up: root.classList.contains('is-up'), token: root.classList.contains('is-token'), custom: root.classList.contains('is-custom'),
    expanded: i.getAttribute('aria-expanded'), active: act, activeOk: !act || Boolean(list && list.querySelector('#' + CSS.escape(act))),
    n: opts.filter((o) => !isAct(o)).length, acts: opts.filter(isAct).map((o) => (o.className.match(/g-combobox__action--(\w+)/) || [])[1]),
    ids: opts.map((o) => o.id), first: opts[0] ? opts[0].id : null,
    activeText: marked ? marked.textContent : '', activeAct: marked && isAct(marked) ? (marked.className.match(/g-combobox__action--(\w+)/) || [])[1] : null,
    oneActive: list ? list.querySelectorAll('.is-active').length <= 1 : true,
    value: i.value, q: sf ? sf.value : null, status: status ? status.textContent : '', statusKind: status ? status.className : '',
    busy: list ? list.getAttribute('aria-busy') : null, listHidden: list ? list.hidden : null,
    focus: document.activeElement && document.activeElement.id, surface: Boolean(surf && surf.open),
    popOpen: Boolean(pop && pop.matches(':popover-open')), about: (document.getElementById(id + '-about') || {}).textContent || '',
    describedby: i.getAttribute('aria-describedby') || ''
  }
}, id)

export const geo = (page, id) => page.evaluate((id) => {
  const c = document.getElementById(id).closest('.g-input__control').getBoundingClientRect()
  const d = document.documentElement
  return { top: c.top, left: c.left, w: c.width, h: c.height, sy: scrollY, sh: d.scrollHeight, sw: d.scrollWidth, cw: d.clientWidth }
}, id)

/** Contraste del texto de `sel` contra el primer fondo no transparente de sus ancestros */
export const contrast = (page, sel) => page.evaluate((sel) => {
  const cv = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  const rgb = (c) => { cv.clearRect(0, 0, 1, 1); cv.fillStyle = '#000'; cv.fillStyle = c; cv.fillRect(0, 0, 1, 1); return [...cv.getImageData(0, 0, 1, 1).data] }
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  const el = document.querySelector(sel)
  if (!el) return null
  let bg = null
  for (let n = el; n && !bg; n = n.parentElement) { const c = rgb(getComputedStyle(n).backgroundColor); if (c[3] > 250) bg = c }
  const a = lum(rgb(getComputedStyle(el).color)); const z = lum(bg || [255, 255, 255])
  return (Math.max(a, z) + 0.05) / (Math.min(a, z) + 0.05)
}, sel)

export async function type(page, id, text, { delay = 15, wait = 260 } = {}) {
  await page.focus('#' + id)
  await page.keyboard.type(text, { delay })
  await page.waitForTimeout(wait)
}
export const out = (page, id) => page.locator('#' + id).textContent()
