// GCombobox · Fase 2 (`multiple`) sobre el COMPONENTE REAL del playground (packages/vue/playground, #sec-combobox-multiple;
// entrada @grana/vue/combobox), en Chromium, Firefox y WebKit. Port de design/lab/combobox/r03/verificar.mjs (kiwi; A, B y
// C; la referencia «base» no se reproduce) y de los puntos de navegador de design/contracts/combobox.md «Fase 2 ·
// Verificación» (DECISIONS.md #417 a #428). La página toma el concepto de ?cm=A|B|C, como el ?c= de la ronda r03: la
// batería (alergias, diagnósticos, responsables, etiquetas, insumos, diálogo, solo lectura, RTL) se pinta con ese concepto.
// Diferencias con el prototipo, por el contrato: «Elegidas» lleva su recuento separado por un espacio; los nombres de
// «Quitar», del rastro y de los anuncios llevan el código (`code` + `label`, #423); la pasada nueva empieza al volver a
// ESCRIBIR tras salir (#419), no al enfocar. El movimiento está en personalidad-combobox-multiple.spec.mjs y la compuerta
// de rendimiento en combobox-multiple-perf.spec.mjs (un solo worker).
import { test, expect } from '@playwright/test'
import { contrast, watchConsole } from './combobox-helpers.mjs'

const PAGE = '/packages/vue/playground/index.html'

async function load(page, c, { width = 1280, height = 900, motion = 'reduce' } = {}) {
  await page.emulateMedia({ reducedMotion: motion })
  await page.setViewportSize({ width, height })
  await page.addInitScript(() => {
    window.__cbFast = true
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
  await page.goto(`${PAGE}?cm=${c}`)
  await page.waitForSelector('#cm-alg')
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
  await page.evaluate(() => document.fonts.ready)
  await page.locator('#sec-combobox-multiple').scrollIntoViewIfNeeded()
}

/** Utilidades sobre la página de un concepto */
function kit(page, c) {
  const surf = c === 'C'
  const wait = (ms) => page.waitForTimeout(ms)
  const model = (k) => page.evaluate((k) => JSON.parse(JSON.stringify(window.__cm[k])), k)
  const live = async () => { await wait(90); return page.evaluate(() => (window.__cbLive.length ? window.__cbLive[window.__cbLive.length - 1].text : '')) }
  const listVisible = (id) => page.evaluate((id) => { const l = document.getElementById(id + '-list'); return Boolean(l && !l.hidden && l.checkVisibility() && l.getClientRects().length) }, id)
  const surfaceOpen = (id) => page.evaluate((id) => Boolean(document.getElementById(id + '-surface')?.open), id)
  const panelOpen = (id) => page.evaluate((id) => (document.getElementById(id + '-surface')?.open ? true : document.getElementById(id).getAttribute('aria-expanded') === 'true'), id)
  const input = (id) => page.locator(surf ? `#${id}-search` : `#${id}`)
  async function openWith(id, key = 'ArrowDown') {
    await page.locator(`#${id}`).focus()
    await page.keyboard.press(key)
    await wait(surf ? 300 : 160)
  }
  async function typeIn(id, t) {
    if (surf) {
      if (!(await surfaceOpen(id))) {
        await page.locator(`#${id}`).focus()
        await page.keyboard.type(t.slice(0, 1))
        await wait(300)
        await page.keyboard.type(t.slice(1))
      } else {
        await page.locator(`#${id}-search`).fill('')
        await page.keyboard.type(t)
      }
    } else {
      await page.locator(`#${id}`).focus()
      await page.keyboard.type(t)
    }
    await wait(160)
  }
  const activeOf = (id) => page.evaluate((id) => {
    const s = document.getElementById(id + '-surface')
    const i = s && s.open ? document.getElementById(id + '-search') : document.getElementById(id)
    const a = i.getAttribute('aria-activedescendant')
    const el = a && document.getElementById(a)
    return el ? el.textContent.trim() : null
  }, id)
  return { surf, wait, model, live, listVisible, surfaceOpen, panelOpen, input, openWith, typeIn, activeOf }
}

for (const c of ['A', 'B', 'C']) {
  test.describe(`GCombobox multiple · concepto ${c} (${{ A: 'la frase', B: 'la receta', C: 'la cesta' }[c]})`, () => {
    test('reposo, foco y apertura: semántica de varios (aria-multiselectable, aria-selected en todas, casilla decorativa)', async ({ page }) => {
      const errs = await watchConsole(page)
      await load(page, c)
      const k = kit(page, c)
      const r = await page.evaluate(() => {
        const i = document.getElementById('cm-alg')
        return {
          role: i.getAttribute('role'), exp: i.getAttribute('aria-expanded'), pop: i.getAttribute('aria-haspopup'),
          hidden: [...document.querySelectorAll('input[type=hidden][name=alergias]')].map((h) => h.value), libre: document.querySelectorAll('input[type=hidden][name=alergias_libre]').length,
          about: document.getElementById('cm-alg-about')?.textContent, desc: i.getAttribute('aria-describedby') || '', req: i.hasAttribute('required'), name: i.hasAttribute('name'),
          root: i.closest('.g-combobox').className
        }
      })
      expect(r.role).toBe('combobox')
      expect(r.exp).toBe('false')
      expect(r.pop).toBe(k.surf ? 'dialog' : 'listbox')
      expect(r.hidden, 'un oculto por valor, en orden').toEqual(['penicilina', 'latex'])
      expect(r.libre, 'sin textos libres, ningún oculto de customName').toBe(0)
      expect(r.req || r.name, 'el visible no lleva name ni required').toBe(false)
      expect(r.about).toBe('2 seleccionadas: Penicilina y Látex')
      expect(r.desc.startsWith('cm-alg-about')).toBe(true)
      expect(r.root).toContain('g-combobox--multiple')
      expect(r.root).toContain(`g-combobox--selection-${c === 'B' ? 'list' : 'inline'}`)
      expect(r.root).toContain('has-chosen')
      // Enfocar no abre
      await page.locator('#cm-alg').focus()
      await k.wait(100)
      expect(await page.locator('#cm-alg').getAttribute('aria-expanded')).toBe('false')
      expect(await k.listVisible('cm-alg')).toBe(false)
      // Abrir
      await k.openWith('cm-alg')
      const o = await page.evaluate(() => {
        const l = document.getElementById('cm-alg-list')
        const opts = [...l.querySelectorAll('[role=option]:not(.g-combobox__action)')]
        const g = l.querySelector('[role=group]')
        const gl = g && document.getElementById(g.getAttribute('aria-labelledby'))
        return {
          ms: l.getAttribute('aria-multiselectable'), all: opts.every((x) => ['true', 'false'].includes(x.getAttribute('aria-selected'))),
          sel: opts.filter((x) => x.getAttribute('aria-selected') === 'true').map((x) => x.querySelector('.g-summary__title').textContent),
          box: opts.every((x) => x.firstElementChild.matches('.g-combobox__box[aria-hidden="true"]')), check: l.querySelectorAll('.g-combobox__check').length,
          group: gl && gl.textContent.trim(), firstSel: g && [...g.querySelectorAll('[role=option]')].map((x) => x.getAttribute('aria-selected')),
          chosenIds: g ? [...g.querySelectorAll('[role=option]')].map((x) => x.id) : [],
          surface: Boolean(document.getElementById('cm-alg-surface')?.open), basket: document.querySelectorAll('#cm-alg-surface .g-combobox__basket .g-combobox__row').length,
          exp: (document.getElementById('cm-alg-surface')?.open ? document.getElementById('cm-alg-search') : document.getElementById('cm-alg')).getAttribute('aria-expanded')
        }
      })
      expect(o.ms).toBe('true')
      expect(o.all, 'aria-selected explícito en todas').toBe(true)
      expect(o.sel.sort()).toEqual(['Látex', 'Penicilina'])
      expect(o.box, 'casilla decorativa al inicio de cada opción').toBe(true)
      expect(o.check, 'con multiple no se pinta el check del final').toBe(0)
      expect(o.exp).toBe('true')
      if (c === 'A') {
        expect(o.group).toMatch(/^Elegidas\s*2$/)
        expect(o.firstSel).toEqual(['true', 'true'])
        expect(o.chosenIds).toEqual(['cm-alg-opt-c0', 'cm-alg-opt-c1'])
      }
      if (c === 'B') expect(o.group, 'B: sin «Elegidas»; las elegidas en su sitio del catálogo').toBe('Medicamentos')
      if (c === 'C') {
        expect(o.surface, 'C: la paleta se abre').toBe(true)
        expect(o.basket, 'C: la cesta enseña las 2 elegidas').toBe(2)
      }
      expect(errs, errs.join('\n')).toEqual([])
    })

    test('Intro alterna: la lista sigue, el texto queda seleccionado; ya elegida resaltada sola no se quita; flechas + Intro desmarca sin mover; Esc', async ({ page }) => {
      const errs = await watchConsole(page)
      await load(page, c)
      const k = kit(page, c)
      await k.typeIn('cm-alg', 'ibu')
      expect(await k.activeOf('cm-alg')).toMatch(/^Ibuprofeno/)
      await page.keyboard.press('Enter')
      await k.wait(160)
      const sel = await k.input('cm-alg').evaluate((i) => [i.selectionStart, i.selectionEnd, i.value])
      expect(await k.model('alg'), 'Intro agrega al final').toEqual(['penicilina', 'latex', 'ibuprofeno'])
      expect(await k.listVisible('cm-alg'), 'la lista sigue abierta').toBe(true)
      expect(sel, 'el texto queda seleccionado').toEqual([0, 3, 'ibu'])
      expect(await k.live()).toBe('Se agregó Ibuprofeno. 3 seleccionadas.')
      expect(await page.evaluate(() => window.__cm.changes[0])).toEqual({ k: 'alg', added: ['Ibuprofeno'], removed: [], n: 3 })
      expect(await page.locator('input[type=hidden][name=alergias]').count()).toBe(3)
      // Intro sobre una ya elegida que quedó activa sola: no la quita y lo dice
      await k.typeIn('cm-alg', 'peni')
      await page.keyboard.press('Enter')
      await k.wait(120)
      expect(await k.model('alg')).toContain('penicilina')
      expect(await k.live()).toBe('Penicilina ya está elegida')
      // Activada por la persona, Intro la desmarca y la fila no se mueve
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('ArrowUp')
      await k.wait(60)
      const y0 = await page.evaluate(() => { const a = document.activeElement; return document.getElementById(a.getAttribute('aria-activedescendant')).getBoundingClientRect().top })
      await page.keyboard.press('Enter')
      await k.wait(160)
      const r = await page.evaluate(() => { const a = document.activeElement; const el = document.getElementById(a.getAttribute('aria-activedescendant')); return { sel: el.getAttribute('aria-selected'), top: el.getBoundingClientRect().top } })
      expect(await k.model('alg')).not.toContain('penicilina')
      expect(r.sel).toBe('false')
      expect(Math.abs(r.top - y0), 'desmarcar no mueve la fila').toBeLessThan(0.5)
      expect(await k.live()).toBe('Se quitó Penicilina. 2 seleccionadas.')
      await page.keyboard.press('Enter')
      await k.wait(120)
      expect(await k.model('alg'), 'Intro otra vez la marca: al final').toEqual(['latex', 'ibuprofeno', 'penicilina'])
      // Esc
      await page.keyboard.press('Escape')
      await k.wait(160)
      if (k.surf) {
        expect(await k.surfaceOpen('cm-alg'), 'C: Esc cierra la paleta').toBe(false)
        expect((await k.model('alg')).length, 'C: conservando lo elegido').toBe(3)
        expect(await page.evaluate(() => document.activeElement.id)).toBe('cm-alg')
      } else {
        expect(await k.listVisible('cm-alg')).toBe(false)
        expect(await page.locator('#cm-alg').inputValue(), 'Esc cierra y conserva el texto').toBe('peni')
        await page.keyboard.press('Escape')
        await k.wait(60)
        expect(await page.locator('#cm-alg').inputValue(), 'Esc otra vez lo vacía').toBe('')
      }
      expect(errs, errs.join('\n')).toEqual([])
    })

    test('Tab nunca agrega (ni con el texto fantasma) y salir descarta el texto', async ({ page }) => {
      const errs = await watchConsole(page)
      await load(page, c)
      const k = kit(page, c)
      await k.typeIn('cm-alg', 'kiw')
      if (!k.surf) {
        expect(await page.evaluate(() => document.querySelector('#cm-alg').closest('.g-combobox').querySelector('.g-combobox__ghost-rest')?.textContent), 'texto fantasma por prefijo').toBe('i')
        await page.keyboard.press('Tab')
        await k.wait(120)
        expect(await k.model('alg')).toEqual(['penicilina', 'latex'])
        expect(await page.locator('#cm-alg').inputValue(), 'salir descarta').toBe('')
      } else {
        expect(await page.locator('#cm-alg-search').inputValue(), 'C: la primera tecla abre y no se pierde').toBe('kiw')
        await page.keyboard.press('Tab')
        await k.wait(100)
        expect(await k.model('alg')).toEqual(['penicilina', 'latex'])
        await page.keyboard.press('Escape')
      }
      expect(errs, errs.join('\n')).toEqual([])
    })

    test('Retroceso en dos tiempos (sostenido no quita); Ctrl+Z devuelve; «Quitar todas» y su deshacer', async ({ page }) => {
      const errs = await watchConsole(page)
      await load(page, c)
      const k = kit(page, c)
      await page.locator('#cm-alg').focus()
      await page.keyboard.press('Backspace')
      await k.wait(120)
      expect((await k.model('alg')).length, 'Retroceso 1: no quita').toBe(2)
      expect(await k.live()).toBe('Pulsa Retroceso otra vez para quitar Látex')
      const sel = c === 'B' ? '.g-combobox__row.is-armed .g-summary__title' : '.g-combobox__sentence-item.is-armed'
      expect(await page.evaluate((s) => { const e = document.querySelector('#cm-alg').closest('.g-combobox').querySelector(s); return Boolean(e) && getComputedStyle(e).textDecorationLine.includes('line-through') }, sel), 'la marca se ve tachada (no solo color)').toBe(true)
      await page.keyboard.press('Backspace')
      await k.wait(150)
      expect(await k.model('alg'), 'Retroceso 2: quita la última').toEqual(['penicilina'])
      await page.evaluate(() => { const i = document.getElementById('cm-alg'); for (let n = 0; n < 3; n++) i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', repeat: true, bubbles: true, cancelable: true })) })
      await k.wait(100)
      expect((await k.model('alg')).length, 'sostenido (repeat) no quita').toBe(1)
      await page.keyboard.press('Control+z')
      await k.wait(150)
      expect(await k.model('alg'), 'Ctrl+Z la devuelve a su sitio').toEqual(['penicilina', 'latex'])
      expect(await k.live()).toMatch(/^Se restauró Látex/)
      await page.locator('#cm-alg-clear').click()
      await k.wait(150)
      expect(await k.model('alg')).toEqual([])
      expect(await k.live()).toBe('Se quitaron todas')
      expect(await page.evaluate(() => document.activeElement.id), '«Quitar todas» devuelve el foco al campo').toBe('cm-alg')
      expect(await page.evaluate(() => { const b = document.getElementById('cm-alg-clear'); return b ? 'sigue' : 'sin elegidos, sin botón' })).toBe('sin elegidos, sin botón')
      await page.keyboard.press('Control+z')
      await k.wait(150)
      expect(await k.model('alg'), 'Ctrl+Z devuelve todas').toEqual(['penicilina', 'latex'])
      expect(await k.live()).toBe('Se restauraron 2')
      expect(errs, errs.join('\n')).toEqual([])
    })

    test('texto libre: se agrega por su fila, viaja con customName, se describe y no se duplica', async ({ page }) => {
      const errs = await watchConsole(page)
      await load(page, c)
      const k = kit(page, c)
      await k.typeIn('cm-alg', 'Polen de olivo')
      const row = await page.evaluate(() => { const r = document.getElementById('cm-alg-opt-custom'); return r && [r.textContent.trim(), r.getAttribute('role'), r.getAttribute('aria-selected')] })
      expect(row).toEqual(['Usar «Polen de olivo» como texto libre', 'option', 'false'])
      for (let n = 0; n < 6 && (await k.activeOf('cm-alg')) !== 'Usar «Polen de olivo» como texto libre'; n++) await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')
      await k.wait(160)
      expect(await k.model('algC')).toEqual(['Polen de olivo'])
      expect(await k.panelOpen('cm-alg'), 'el panel sigue abierto').toBe(true)
      expect(await page.locator('input[type=hidden][name=alergias_libre]').count()).toBe(1)
      expect(await page.evaluate(() => document.getElementById('cm-alg-about').textContent)).toBe('3 seleccionadas: Penicilina, Látex y Polen de olivo (texto libre)')
      await k.typeIn('cm-alg', 'polen de olivo')
      expect(await page.evaluate(() => Boolean(document.getElementById('cm-alg-opt-custom'))), 'sin duplicar').toBe(false)
      if (k.surf) await page.keyboard.press('Escape')
      expect(errs, errs.join('\n')).toEqual([])
    })

    test('tope (max 3): no elegidas aria-disabled y recorribles, estado del tope, Intro no agrega y lo dice', async ({ page }) => {
      const errs = await watchConsole(page)
      await load(page, c)
      const k = kit(page, c)
      for (const t of ['I10', 'J45.9']) {
        await k.typeIn('cm-dx', t)
        await page.keyboard.press('Enter')
        await k.wait(140)
      }
      expect(await k.model('dx')).toEqual(['E11.9', 'I10', 'J45.9'])
      const r = await page.evaluate(() => {
        const l = document.getElementById('cm-dx-list')
        const opts = [...l.querySelectorAll('[role=option]:not(.g-combobox__action)')]
        return {
          dis: opts.filter((o) => o.getAttribute('aria-selected') === 'false').every((o) => o.getAttribute('aria-disabled') === 'true'),
          selOk: opts.filter((o) => o.getAttribute('aria-selected') === 'true').every((o) => !o.hasAttribute('aria-disabled')),
          status: document.getElementById('cm-dx-status')?.textContent, kind: document.getElementById('cm-dx-status')?.className,
          full: document.getElementById('cm-dx').closest('.g-combobox').classList.contains('is-full')
        }
      })
      expect(r.dis && r.selOk, 'no elegidas aria-disabled; las elegidas no').toBe(true)
      expect(r.status).toContain('Máximo 3')
      expect(r.kind).toContain('g-combobox__status--max')
      expect(r.full).toBe(true)
      await k.typeIn('cm-dx', 'R05')
      await page.keyboard.press('Enter')
      await k.wait(140)
      expect((await k.model('dx')).length).toBe(3)
      expect(await k.live()).toMatch(/^Máximo 3/)
      expect(await k.activeOf('cm-dx'), 'la no elegible se recorre: se lee y se sabe por qué').toContain('Tos')
      if (k.surf) await page.keyboard.press('Escape')
      expect(errs, errs.join('\n')).toEqual([])
    })

    test('envío (un oculto por valor), solo lectura (no abre, se envía) y deshabilitado (no se envía)', async ({ page }) => {
      const errs = await watchConsole(page)
      await load(page, c)
      const k = kit(page, c)
      await page.locator('#cm-send').click()
      await k.wait(150)
      const sent = JSON.parse((await page.locator('#cm-out-sent').textContent()).replace(/^FormData: /, ''))
      expect(sent.etiquetas).toEqual(['t0', 't1'])
      expect(sent.ro, 'solo lectura se envía').toEqual(['t2', 't4', 't8'])
      expect('dis' in sent, 'deshabilitado no se envía').toBe(false)
      expect(sent.servicio, 'el GCombobox de una opción convive').toEqual(['urg'])
      await page.locator('#cm-f-ro').focus()
      await page.keyboard.press('ArrowDown')
      await k.wait(150)
      expect(await k.listVisible('cm-f-ro')).toBe(false)
      expect(await k.surfaceOpen('cm-f-ro')).toBe(false)
      expect(await page.evaluate(() => { const r = document.getElementById('cm-f-ro').closest('.g-combobox'); return r.querySelectorAll('.g-combobox__remove, .g-combobox__clear, .g-combobox__arrow, .g-combobox__undo').length })).toBe(0)
      expect(await page.evaluate(() => { const i = document.getElementById('cm-f-ro'); return i.readOnly && i.getAttribute('aria-readonly') === 'true' && document.getElementById('cm-f-ro-about').textContent.startsWith('3 ') })).toBe(true)
      expect(await page.evaluate(() => [...document.querySelectorAll('input[type=hidden][name=dis]')].every((h) => h.disabled))).toBe(true)
      expect(errs, errs.join('\n')).toEqual([])
    })

    test('en una GFormRow de tres, de 2 a 8 elegidos: la caja y las vecinas no se mueven' + (c === 'B' ? ' (la receta crece hacia abajo)' : ' y la línea de debajo tampoco (Δ0)'), async ({ page }) => {
      const errs = await watchConsole(page)
      await load(page, c)
      const k = kit(page, c)
      const measure = () => page.evaluate(() => {
        const o = document.getElementById('cm-row').getBoundingClientRect().top
        const box = (id) => document.getElementById(id).closest('.g-input__control').getBoundingClientRect()
        const lab = document.querySelector('label[for=cm-f-tags]').getBoundingClientRect()
        return { tags: box('cm-f-tags').height, tagsTop: box('cm-f-tags').top - o, folio: box('cm-f-folio').top - o, serv: box('cm-f-serv').top - o, lab: lab.top - o, notas: box('cm-f-notas').top - o }
      })
      const a = await measure()
      await page.evaluate(() => { window.__cm.tags = ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'] })
      await k.wait(700)
      const b = await measure()
      const d = (n) => Math.round((b[n] - a[n]) * 10) / 10
      expect([d('tagsTop'), d('lab')], 'la caja del campo no se mueve').toEqual([0, 0])
      expect([d('folio'), d('serv')], 'las vecinas no se mueven').toEqual([0, 0])
      expect(d('tags'), 'la caja mide lo mismo con 2 y con 8').toBe(0)
      if (c === 'B') expect(d('notas'), 'B: lo de debajo baja').toBeGreaterThan(0)
      else expect(d('notas'), `${c}: la línea de debajo no se mueve`).toBe(0)
      if (c !== 'B') {
        const s = await page.evaluate(() => { const e = document.querySelector('#cm-f-tags').closest('.g-combobox').querySelector('.g-combobox__sentence'); return { over: e.scrollWidth - e.clientWidth, text: e.textContent } })
        expect(s.over, `la frase no desborda: «${s.text}»`).toBeLessThanOrEqual(1)
        expect(s.text).toMatch(/y \d+ más$/)
      }
      expect(errs, errs.join('\n')).toEqual([])
    })

    test('500 opciones y 40 elegidas: ' + { A: '«Elegidas» con 12 y «Ver los 40»; Retroceso saca a la vista la última; la frase cede', B: '6 renglones y «Ver los 40»', C: 'la cesta con 12 y «Ver los 40»; la frase cede' }[c], async ({ page }) => {
      const errs = await watchConsole(page)
      await load(page, c)
      const k = kit(page, c)
      await k.openWith('cm-big')
      if (c === 'A') {
        expect(await page.evaluate(() => {
          const g = document.querySelector('[aria-labelledby="cm-big-grp-chosen"]')
          const p = document.getElementById('cm-big-opt-all')
          return [g.querySelectorAll('[role=option]:not(.g-combobox__action)').length, p && p.textContent.trim(), p && p.getAttribute('role'), p && p.parentElement === g]
        })).toEqual([12, 'Ver los 40', 'option', true])
        // «Ver las N»: pinta el resto y deja activa la fila 13
        for (let n = 0; n < 12; n++) await page.keyboard.press('ArrowDown') // abrir con ↓ ya activó la primera
        expect(await k.activeOf('cm-big')).toBe('Ver los 40')
        await page.keyboard.press('Enter')
        await k.wait(120)
        expect(await page.evaluate(() => document.querySelectorAll('[aria-labelledby="cm-big-grp-chosen"] [role=option]').length)).toBe(40)
        expect(await page.evaluate(() => document.getElementById('cm-big').getAttribute('aria-activedescendant'))).toBe('cm-big-opt-c12')
      }
      if (c === 'C') {
        expect(await page.evaluate(() => {
          const b = document.querySelector('#cm-big-c-surface .g-combobox__basket, #cm-big-surface .g-combobox__basket')
          const all = b.querySelector('.g-combobox__rows-all')
          return [b.querySelectorAll('.g-combobox__row').length, all && all.textContent.trim(), all && all.getAttribute('aria-expanded')]
        })).toEqual([12, 'Ver los 40', 'false'])
      }
      await page.keyboard.press('Escape')
      await k.wait(150)
      if (!k.surf) await page.keyboard.press('Escape')
      if (c !== 'B') {
        await page.locator('#cm-big').focus()
        await page.keyboard.press('Backspace')
        await k.wait(150)
        expect(await page.evaluate(() => document.querySelector('#cm-big').closest('.g-combobox').querySelector('.g-combobox__sentence-item.is-armed')?.textContent.trim()), 'la última sale a la vista aunque estuviera en «y N más»').toBe('Insumo 040 · vendas')
        await page.keyboard.press('Escape')
        await page.locator('#cm-f-folio').focus()
        await k.wait(150)
        const s = await page.evaluate(() => { const e = document.querySelector('#cm-big').closest('.g-combobox').querySelector('.g-combobox__sentence'); return { rest: e.querySelector('.g-combobox__sentence-rest')?.textContent, over: e.scrollWidth - e.clientWidth, about: document.getElementById('cm-big-about').textContent } })
        expect(s.rest).toMatch(/^\d+ más$/)
        expect(s.over, 'la frase no desborda').toBeLessThanOrEqual(1)
        expect(s.about.startsWith('40 seleccionados: Insumo 001')).toBe(true)
        expect(s.about).toContain('Insumo 040')
      } else {
        expect(await page.evaluate(() => { const r = document.querySelector('#cm-big').closest('.g-combobox'); const b = r.querySelector('.g-combobox__rows-all'); return [r.querySelectorAll('.g-combobox__row').length, b && b.textContent.trim(), b && b.getAttribute('aria-expanded'), b && b.getAttribute('aria-controls')] })).toEqual([6, 'Ver los 40', 'false', 'cm-big-rows'])
        await page.locator('#cm-big').evaluate((i) => i.closest('.g-combobox').querySelector('.g-combobox__rows-all').click())
        await k.wait(100)
        expect(await page.evaluate(() => { const r = document.querySelector('#cm-big').closest('.g-combobox'); const b = r.querySelector('.g-combobox__rows-all'); return [r.querySelectorAll('.g-combobox__row').length, b.textContent.trim(), b.getAttribute('aria-expanded')] })).toEqual([40, 'Ver menos', 'true'])
      }
      expect(errs, errs.join('\n')).toEqual([])
    })

    test('dentro de un GDialog: elige, Esc cierra la lista (o la paleta) y no el diálogo; el anuncio sale dentro', async ({ page }) => {
      const errs = await watchConsole(page)
      await load(page, c)
      const k = kit(page, c)
      await page.locator('#cm-d-open').click()
      await k.wait(300)
      await k.openWith('cm-d-alg')
      expect(k.surf ? await k.surfaceOpen('cm-d-alg') : await k.listVisible('cm-d-alg')).toBe(true)
      await k.typeIn('cm-d-alg', 'mor')
      await page.keyboard.press('Enter')
      await k.wait(160)
      expect(await k.model('dlgAlg')).toEqual(['huevo', 'morfina'])
      await page.keyboard.press('Escape')
      await k.wait(220)
      expect(await page.evaluate(() => [...document.querySelectorAll('dialog[open]')].some((d) => d.contains(document.getElementById('cm-d-alg')))), 'el diálogo sigue abierto').toBe(true)
      expect(await page.evaluate(() => window.__cbLive.some((x) => x.dialog && /morfina/i.test(x.text))), 'el anuncio sale dentro de un diálogo abierto').toBe(true)
      expect(errs, errs.join('\n')).toEqual([])
    })

    test('contraste (tema por defecto) ≥ 4.5', async ({ page }) => {
      const errs = await watchConsole(page)
      await load(page, c)
      if (c === 'B') {
        expect(await contrast(page, '.g-combobox:has(#cm-alg) .g-combobox__row .g-summary__title')).toBeGreaterThanOrEqual(4.5)
        expect(await contrast(page, '.g-combobox:has(#cm-alg) .g-combobox__row .g-summary__subtitle')).toBeGreaterThanOrEqual(4.5)
        expect(await contrast(page, '.g-combobox:has(#cm-dx) .g-combobox__row-number')).toBeGreaterThanOrEqual(4.5)
      } else {
        expect(await contrast(page, '.g-combobox:has(#cm-alg) .g-combobox__sentence-item')).toBeGreaterThanOrEqual(4.5)
        expect(await contrast(page, '.g-combobox:has(#cm-big) .g-combobox__sentence-rest')).toBeGreaterThanOrEqual(4.5)
      }
      expect(errs, errs.join('\n')).toEqual([])
    })

    test(`propio de ${c}: ` + { A: '«Elegidas» es una instantánea (desmarcar deja la fila; al reabrir ya no está)', B: 'renglones numerados, «Nuevo», rastro del mismo alto con el foco en «Deshacer», pasada', C: 'cesta vacía, homónimos con is-diff en resultados, quitar con rastro y «Deshacer», «Listo» y la frase en reposo' }[c], async ({ page }) => {
      const errs = await watchConsole(page)
      await load(page, c)
      const k = kit(page, c)
      if (c === 'A') {
        await k.openWith('cm-alg')
        const before = await page.locator('[aria-labelledby="cm-alg-grp-chosen"] [role=option]').count()
        await page.locator('[aria-labelledby="cm-alg-grp-chosen"] [role=option]').first().click()
        await k.wait(120)
        const r = await page.evaluate(() => { const o = [...document.querySelectorAll('[aria-labelledby="cm-alg-grp-chosen"] [role=option]')]; return { n: o.length, first: o[0].getAttribute('aria-selected') } })
        expect(r, 'desmarcar deja la fila en su sitio, sin marca').toEqual({ n: before, first: 'false' })
        expect(await page.evaluate(() => document.activeElement.id), 'el clic no quita el foco del campo').toBe('cm-alg')
        await page.keyboard.press('Escape')
        await page.keyboard.press('ArrowDown')
        await k.wait(160)
        expect(await page.locator('[aria-labelledby="cm-alg-grp-chosen"] [role=option]').count(), 'al reabrir, ya no está').toBe(before - 1)
        expect((await page.locator('#cm-alg-grp-chosen').textContent()).trim()).toMatch(/^Elegidas\s*1$/)
        // Con texto no hay «Elegidas»: las elegidas salen marcadas en su sitio
        await page.keyboard.type('l')
        await k.wait(160)
        expect(await page.locator('#cm-alg-grp-chosen').count()).toBe(0)
      }
      if (c === 'B') {
        await k.typeIn('cm-dx', 'I10')
        await page.keyboard.press('Enter')
        await k.wait(150)
        await page.keyboard.press('Escape')
        await k.wait(150)
        const root = '.g-combobox:has(#cm-dx)'
        expect(await page.evaluate((root) => { const r = [...document.querySelectorAll(`${root} .g-combobox__row`)]; return [r.length, r.map((x) => x.querySelector('.g-combobox__row-number').textContent).join(), r[1].querySelector('.g-summary__code').textContent] }, root)).toEqual([2, '1,2', 'I10'])
        expect(await page.evaluate((root) => { const r = document.querySelectorAll(`${root} .g-combobox__row`)[1]; return [r.classList.contains('is-fresh'), r.querySelector('.g-combobox__row-fresh')?.textContent] }, root)).toEqual([true, 'Nuevo'])
        expect(await page.evaluate((root) => document.querySelector(`${root} .g-combobox__chosen`).parentElement.matches('.g-input__support') && document.querySelector(`${root} .g-combobox__chosen`).previousElementSibling.matches('.g-input__message'), root), 'N5: al final de g-input__support, después del mensaje').toBe(true)
        const x = page.locator(`${root} .g-combobox__row`).first().locator('.g-combobox__remove')
        expect(await x.getAttribute('aria-label')).toBe('Quitar E11.9 Diabetes mellitus tipo 2, sin mención de complicación')
        const top0 = await page.locator(`${root} .g-combobox__row`).first().evaluate((e) => [e.getBoundingClientRect().top - document.querySelector('label[for=cm-dx]').getBoundingClientRect().top, e.getBoundingClientRect().height])
        await x.click()
        await k.wait(160)
        const r = await page.evaluate((root) => { const t = document.querySelector(`${root} .g-combobox__row.is-trace`); return { top: t && t.getBoundingClientRect().top - document.querySelector('label[for=cm-dx]').getBoundingClientRect().top, h: t && t.getBoundingClientRect().height, focus: document.activeElement.classList.contains('g-combobox__undo'), text: t && t.querySelector('.g-combobox__trace').textContent, desc: document.getElementById(document.activeElement.getAttribute('aria-describedby'))?.textContent } }, root)
        expect(Math.abs(r.top - top0[0]), 'el rastro queda en el mismo sitio').toBeLessThan(0.5)
        expect(Math.abs(r.h - top0[1]), 'y del mismo alto').toBeLessThan(1)
        expect(r.focus, 'el foco pasa a «Deshacer»').toBe(true)
        expect(r.text).toBe('E11.9 Diabetes mellitus tipo 2, sin mención de complicación quitado')
        expect(r.desc, '«Deshacer» descrito por el rastro').toBe(r.text)
        await page.keyboard.press('Enter')
        await k.wait(160)
        expect(await k.model('dx'), '«Deshacer» lo devuelve a su sitio').toEqual(['E11.9', 'I10'])
        expect(await page.evaluate(() => document.activeElement.classList.contains('g-combobox__remove')), 'y el foco a su «Quitar»').toBe(true)
        await page.locator(`${root} .g-combobox__row`).first().locator('.g-combobox__remove').click()
        await k.wait(100)
        await page.locator('#cm-f-folio').focus()
        await k.wait(200)
        expect(await page.locator(`${root} .g-combobox__row.is-trace`).count(), 'salir no pliega el rastro').toBe(1)
        await page.locator('#cm-dx').focus()
        await k.wait(200)
        expect(await page.locator(`${root} .g-combobox__row.is-trace`).count(), 'enfocar tampoco').toBe(1)
        await page.keyboard.type('j')
        await k.wait(300)
        expect(await page.evaluate((root) => [document.querySelectorAll(`${root} .g-combobox__row.is-trace`).length, document.querySelectorAll(`${root} .g-combobox__row.is-fresh`).length, document.querySelectorAll(`${root} .g-combobox__row`).length], root), 'al volver a escribir: el rastro se pliega y «Nuevo» se va').toEqual([0, 0, 1])
      }
      if (c === 'C') {
        await k.openWith('cm-resp', 'Enter')
        expect(await page.locator('#cm-resp-surface .g-combobox__basket-empty').textContent()).toBe('Aún no hay ninguno. Los que marques aparecen aquí.')
        expect(await page.locator('#cm-resp-surface .g-combobox__preview').count(), 'con multiple no hay vista previa').toBe(0)
        expect(await page.locator('#cm-resp-surface .g-combobox__surface-body').getAttribute('class')).toContain('has-basket')
        await page.keyboard.type('ana lop')
        await k.wait(160)
        expect(await page.evaluate(() => { const o = [...document.querySelectorAll('#cm-resp-list [role=option]')].filter((x) => x.textContent.includes('Ana López Ruiz')); return o.length === 2 && o.every((x) => x.querySelector('.g-summary__fact.is-diff')) }), 'homónimos: el dato que los distingue es is-diff').toBe(true)
        await page.keyboard.press('ArrowDown')
        await page.keyboard.press('ArrowUp')
        await page.keyboard.press('Enter')
        await k.wait(200)
        expect(await k.surfaceOpen('cm-resp'), 'elegir no cierra').toBe(true)
        expect(await page.locator('#cm-resp-surface .g-combobox__basket .g-combobox__row').count()).toBe(1)
        expect(await page.locator('#cm-resp-surface .g-combobox__basket-tally').textContent()).toBe('1 seleccionado')
        expect(await page.locator('#cm-resp-surface .g-combobox__foot-tally').textContent()).toBe('1 seleccionado')
        await page.locator('#cm-resp-surface .g-combobox__basket .g-combobox__remove').first().click()
        await k.wait(160)
        expect(await page.evaluate(() => document.activeElement.classList.contains('g-combobox__undo')), 'quitar en la cesta deja «Deshacer» con el foco').toBe(true)
        expect(await k.model('resp')).toEqual([])
        await page.keyboard.press('Enter')
        await k.wait(160)
        expect(await k.model('resp')).toEqual(['u1'])
        await page.locator('#cm-resp-surface .g-combobox__done').click()
        await k.wait(250)
        expect(await k.surfaceOpen('cm-resp'), '«Listo» cierra').toBe(false)
        expect(await page.evaluate(() => document.activeElement.id), 'y devuelve el foco al campo').toBe('cm-resp')
        expect(await page.locator('.g-combobox:has(#cm-resp) .g-combobox__sentence').textContent(), 'en reposo, la frase').toContain('Ana López Ruiz')
      }
      expect(errs, errs.join('\n')).toEqual([])
    })

    for (const w of [375, 320]) {
      test(`móvil ${w}px: la hoja para todos, «Elegidas» arriba, opciones ≥ 44px, sin desbordamiento; «Listo» vuelve al campo`, async ({ page }) => {
        const errs = await watchConsole(page)
        await load(page, c, { width: w, height: 760 })
        const k = kit(page, c)
        await page.locator('#cm-alg').click()
        await k.wait(400)
        const r = await page.evaluate(() => {
          const d = document.getElementById('cm-alg-surface')
          const opts = d && d.open ? [...d.querySelectorAll('[role=option]')] : []
          const g = d && d.querySelector('[role=group]')
          return {
            sheet: Boolean(d && d.open && d.classList.contains('g-combobox-surface--sheet')), chosen: g && document.getElementById(g.getAttribute('aria-labelledby')).textContent.trim(),
            min: Math.min(...opts.map((o) => o.getBoundingClientRect().height)), over: document.documentElement.scrollWidth - innerWidth,
            boxOver: d ? d.getBoundingClientRect().right - innerWidth : 0, basket: d ? d.querySelectorAll('.g-combobox__basket').length : -1, foot: Boolean(d && d.querySelector('.g-combobox__foot .g-combobox__done'))
          }
        })
        expect(r.sheet).toBe(true)
        expect(r.chosen).toMatch(/^Elegidas\s*2$/)
        expect(r.min).toBeGreaterThanOrEqual(44)
        expect(r.over).toBeLessThanOrEqual(0)
        expect(r.boxOver).toBeLessThanOrEqual(0.5)
        expect(r.basket, 'en la hoja la cesta no cabe').toBe(0)
        expect(r.foot).toBe(true)
        await page.locator('#cm-alg-surface .g-combobox__done').click()
        await k.wait(250)
        expect(await page.evaluate(() => document.activeElement.id)).toBe('cm-alg')
        expect(errs, errs.join('\n')).toEqual([])
      })
    }

    test('RTL: lo elegido empieza en el borde de inicio, sin desbordamiento', async ({ page }) => {
      const errs = await watchConsole(page)
      await load(page, c)
      await page.locator('#cm-rtl').scrollIntoViewIfNeeded()
      const r = await page.evaluate((c) => {
        const root = document.getElementById('cm-rtl').closest('.g-combobox')
        const ctl = root.querySelector('.g-input__control').getBoundingClientRect()
        const s = root.querySelector(c === 'B' ? '.g-combobox__row .g-summary' : '.g-combobox__sentence').getBoundingClientRect()
        return { over: document.documentElement.scrollWidth - innerWidth, startRight: ctl.right - s.right }
      }, c)
      expect(r.over).toBeLessThanOrEqual(0)
      expect(r.startRight).toBeLessThan(80)
      expect(errs, errs.join('\n')).toEqual([])
    })
  })
}
