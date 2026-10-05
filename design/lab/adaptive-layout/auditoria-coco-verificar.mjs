// coco · auditoría independiente de GAdaptiveLayout (paso 5) sobre el componente real y dist/ publicado.
// Banco: design/lab/adaptive-layout/auditoria-coco.html. Temas: por defecto claro y oscuro, y el de esta
// auditoría (auditoria-tema.css, @grana/cli desde auditoria-tema.json: brand #7A2E5C, radius 0, space 5,
// fontSize 18, Georgia) claro y oscuro. Chromium, Firefox y WebKit.
//
//   python3 -m http.server 4209            (desde la raíz del repositorio)
//   node design/lab/adaptive-layout/auditoria-coco-verificar.mjs [chromium firefox webkit]
//
// Sale con código 1 si alguna comprobación falla. Escribe auditoria-coco-resultados.json.
import { chromium, firefox, webkit } from '../theme-playground/node_modules/playwright/index.mjs'
import fs from 'node:fs/promises'

const BASE = `http://localhost:${process.env.GRANA_PW_PORT || 4209}/design/lab/adaptive-layout/auditoria-coco.html`
const HERE = new URL('./', import.meta.url).pathname
const WIDTHS = [240, 280, 320, 360, 400, 460, 600, 720, 960, 1280]
const THEMES = ['defecto-claro', 'defecto-oscuro', 'auditoria-claro', 'auditoria-oscuro']
const engines = { chromium, firefox, webkit }
const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(engines)
const report = { fecha: new Date().toISOString(), motores: {} }
let failed = 0

// ---- medidas dentro de la página -------------------------------------------------------------
const MEASURE = () => {
  const sr = (el) => { const s = getComputedStyle(el); return s.position === 'absolute' && (s.clip !== 'auto' || s.clipPath !== 'none') && el.getBoundingClientRect().width <= 1.5 }
  const clipped = (el, stop) => { for (let n = el.parentElement; n && n !== stop; n = n.parentElement) { const s = getComputedStyle(n); if (s.overflowX !== 'visible' || s.contain.includes('paint')) return true } return false }
  const out = []
  for (const root of document.querySelectorAll('.g-adaptive-layout')) {
    const R = root.getBoundingClientRect(), host = root.parentElement.getBoundingClientRect()
    const rtl = getComputedStyle(root).direction === 'rtl'
    const kids = [...root.children].filter((c) => c.getClientRects().length && !c.inert && getComputedStyle(c).display !== 'none')
    const items = kids.map((c) => {
      const b = c.getBoundingClientRect()
      const spill = []
      for (const d of c.querySelectorAll('*')) {
        if (!d.getClientRects().length || sr(d) || clipped(d, c)) continue
        const s = getComputedStyle(d); if (s.position === 'fixed' || s.visibility === 'hidden') continue
        const r = d.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue
        if (r.left < b.left - 1 || r.right > b.right + 1) spill.push(`${d.className || d.tagName}:${Math.round(r.left - b.left)}..${Math.round(r.right - b.right)}`)
      }
      const labels = [...c.querySelectorAll('.g-input__label,.g-select__label,.g-textarea__label,label')].filter((l) => l.getClientRects().length && !sr(l))
      const box = c.querySelector(':scope > .g-input__row,:scope > .g-select__control,:scope > .g-textarea__control')
      const touch = [...c.querySelectorAll('button,.g-input__control,.g-select__control,.g-textarea__control,select,input:not([type=hidden]):not(.g-input__field)')].filter((x) => x.getClientRects().length && !sr(x) && getComputedStyle(x).visibility !== 'hidden').map((x) => { const r = x.getBoundingClientRect(); return { k: x.className || x.tagName, w: r.width, h: r.height } })
      return { id: c.id || c.querySelector('input:not([type=hidden]),select,textarea,[role=combobox]')?.id || c.className.split(' ')[0], line: +c.dataset.line || 0, l: b.left - R.left, r: b.right - R.left, t: b.top - R.top, b: b.bottom - R.top, w: b.width,
        boxTop: box ? box.getBoundingClientRect().top - R.top : null, spill,
        labelGap: (() => { const l = c.querySelector(':scope > .g-input__label,:scope > .g-select__label,:scope > .g-textarea__label'); return box && l && l.getClientRects().length && !sr(l) ? box.getBoundingClientRect().top - l.getBoundingClientRect().bottom : null })(),
        labelOverflow: labels.filter((l) => l.scrollWidth > l.clientWidth + 1).map((l) => l.textContent.trim()),
        fonts: [...labels, ...c.querySelectorAll('input,select,textarea,.g-summary__title')].filter((x) => x.getClientRects().length && !sr(x)).map((x) => parseFloat(getComputedStyle(x).fontSize)),
        touch }
    })
    out.push({ id: root.id, rtl, w: R.width, hostW: host.width, ready: root.classList.contains('is-ready'), c12: root.classList.contains('has-shared-tracks'), lines: +root.dataset.lines || 0, items })
  }
  return out
}
const CONTRAST = () => {
  const parse = (s) => { const m = s.match(/[\d.]+/g); return m ? m.map(Number) : [0, 0, 0, 0] }
  const lum = (a) => a.slice(0, 3).map((c) => c / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)).reduce((n, c, i) => n + c * [0.2126, 0.7152, 0.0722][i], 0)
  const bgOf = (e) => { const layers = []; for (let n = e; n; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); const a = c.length > 3 ? c[3] : 1; if (a > 0) { layers.push([...c.slice(0, 3), a]); if (a >= 0.999) break } } let bg = [255, 255, 255]; for (const L of layers.reverse()) bg = bg.map((v, i) => L[i] * L[3] + v * (1 - L[3])); return bg }
  const sel = '.g-adaptive-layout .g-input__label,.g-adaptive-layout .g-select__label,.g-adaptive-layout input:not([type=hidden]),.g-adaptive-layout .g-select__value,.g-adaptive-layout .g-summary__title,.g-adaptive-layout td,.g-adaptive-layout th'
  return [...document.querySelectorAll(sel)].filter((e) => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && !e.disabled).map((e) => {
    const fg = parse(getComputedStyle(e).color), bg = bgOf(e), a = lum(fg), b = lum(bg)
    return { k: (e.className || e.tagName).toString().split(' ')[0], ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) }
  })
}

async function main() {
  for (const name of names) {
    const browser = await engines[name].launch()
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
    const page = await ctx.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => { if (m.type() === 'error' || /ResizeObserver loop/.test(m.text())) errors.push(m.text().slice(0, 160)) })
    const res = { checks: 0, fallos: [], notas: [] }
    report.motores[name] = res
    const ok = (c, msg) => { res.checks++; if (!c) { res.fallos.push(msg); failed++ } }
    const note = (k, v) => res.notas.push({ k, v })
    await page.goto(BASE)
    await page.waitForSelector('#fx-fields.is-ready')
    await page.evaluate(() => document.fonts.ready)
    const set = async (patch, ms = 220) => { await page.evaluate((p) => Object.assign(audit.state, p), patch); await page.waitForTimeout(ms) }
    const theme = async (t) => {
      await page.evaluate((t) => {
        const link = document.getElementById('theme-css')
        if (t.startsWith('auditoria')) { link.href = 'auditoria-tema.css'; link.disabled = false } else { link.disabled = true; link.removeAttribute('href') }
        document.documentElement.dataset.theme = t.endsWith('oscuro') ? 'dark' : 'light'
      }, t)
      await page.waitForTimeout(350)
    }
    const geom = () => page.evaluate(MEASURE)

    const avatarSpill = new Set()
    const verify = (tag, g, { strictReading = true } = {}) => {
      for (const r of g) {
        ok(r.ready, `${tag} ${r.id}: is-ready`)
        ok(r.w <= r.hostW + 0.5, `${tag} ${r.id}: raíz ${r.w} > anfitrión ${r.hostW}`)
        for (const it of r.items) {
          ok(it.l >= -0.6 && it.r <= r.w + 0.6, `${tag} ${r.id}/${it.id}: fuera de la raíz ${it.l.toFixed(1)}..${it.r.toFixed(1)} de ${r.w}`)
          // Ajeno al layout (hallazgo 7): con texto al 200 % las iniciales de GAvatar (rem) desbordan su caja (space) también fuera del layout.
          const own = it.spill.filter((x) => !(tag.startsWith('texto200') && x.startsWith('g-avatar__initials')))
          if (own.length !== it.spill.length) avatarSpill.add(`${tag} ${it.id}`)
          ok(!own.length, `${tag} ${r.id}/${it.id}: contenido sale de su raíz ${own.slice(0, 3)}`)
          ok(!it.labelOverflow.length, `${tag} ${r.id}/${it.id}: etiqueta recortada ${it.labelOverflow}`)
          ok(it.fonts.every((f) => f >= 12), `${tag} ${r.id}/${it.id}: texto < 12px ${it.fonts}`)
          for (const t of it.touch) ok(t.w >= 23.5 && t.h >= 23.5, `${tag} ${r.id}/${it.id}: diana ${t.k} ${t.w.toFixed(1)}×${t.h.toFixed(1)}`)
        }
        // sin solapes entre raíces
        for (let i = 0; i < r.items.length; i++) for (let j = i + 1; j < r.items.length; j++) {
          const a = r.items[i], b = r.items[j]
          const ix = Math.min(a.r, b.r) - Math.max(a.l, b.l), iy = Math.min(a.b, b.b) - Math.max(a.t, b.t)
          ok(!(ix > 0.6 && iy > 0.6), `${tag} ${r.id}: solape ${a.id}/${b.id} ${ix.toFixed(1)}×${iy.toFixed(1)}`)
        }
        // orden visual = orden DOM (1.3.2): línea no decreciente; en la misma línea, avanza en la dirección de lectura
        if (strictReading) for (let i = 1; i < r.items.length; i++) {
          const a = r.items[i - 1], b = r.items[i]
          const good = b.line > a.line ? b.t >= a.t - 0.6 : b.line === a.line && (r.rtl ? b.r <= a.l + 0.6 : b.l >= a.r - 0.6)
          ok(good, `${tag} ${r.id}: orden visual ${a.id}(L${a.line})→${b.id}(L${b.line})`)
        }
        if (r.c12) {
          const byLine = {}
          for (const it of r.items) if (it.boxTop !== null) (byLine[it.line] ||= []).push(it.boxTop)
          for (const tops of Object.values(byLine)) ok(Math.max(...tops) - Math.min(...tops) < 0.7, `${tag} ${r.id}: cajas C12 desalineadas ${tops}`)
          // #348: la etiqueta pegada a su caja (Firefox la dejaba 32 px arriba sin el límite de --_adaptive-width)
          const gaps = {}
          for (const it of r.items) if (it.labelGap !== null) (gaps[it.line] ||= []).push(it.labelGap)
          for (const g of Object.values(gaps)) ok(Math.max(...g) - Math.min(...g) < 0.7 && Math.max(...g) < 12, `${tag} ${r.id}: etiqueta separada de su caja ${g.map((x) => x.toFixed(1))}`)
        }
      }
    }

    // ---------- 1 · matriz de reparto: temas × dirección × anchos ----------
    const contrastMin = {}
    for (const t of THEMES) {
      await theme(t)
      for (const dir of ['ltr', 'rtl']) {
        await set({ dir }, 120)
        ok(await page.locator('#fx-address').evaluate((e) => getComputedStyle(e).direction) === dir, `${t}: direction ${dir} activa`)
        for (const w of WIDTHS) { await set({ w }); verify(`${t}/${dir}/${w}`, await geom()) }
      }
      await set({ dir: 'ltr', w: 460 })
      const cs = await page.evaluate(CONTRAST)
      contrastMin[t] = Math.min(...cs.map((c) => c.ratio))
      for (const c of cs) ok(c.ratio >= 4.5, `${t}: contraste ${c.k} ${c.ratio.toFixed(2)}`)
    }
    note('contraste mínimo de texto (etiquetas, valores, título de ficha, celdas)', contrastMin)

    // ---------- 2 · Δ0 claro ↔ oscuro (el tema oscuro no cambia geometría) ----------
    for (const fam of ['defecto', 'auditoria']) for (const w of [320, 720]) {
      await set({ w }); await theme(`${fam}-claro`); const a = await geom(); await theme(`${fam}-oscuro`); const b = await geom()
      const d = Math.max(...a.flatMap((r, i) => r.items.map((it, j) => { const o = b[i].items[j]; return o ? Math.max(Math.abs(o.l - it.l), Math.abs(o.t - it.t), Math.abs(o.w - it.w)) : 99 })))
      ok(d < 0.01, `Δ0 claro↔oscuro ${fam}/${w}: Δ ${d}`)
    }
    await theme('defecto-claro')

    // ---------- 3 · Δ0 al escribir: ninguna escritura del motor ni movimiento ----------
    await set({ w: 460 })
    const before = await geom()
    await page.evaluate(() => { window.__writes = 0; window.__mo = new MutationObserver((rs) => { for (const r of rs) if (r.target.parentElement?.classList.contains('g-adaptive-layout') || r.target.classList?.contains('g-adaptive-layout')) window.__writes++ }); for (const l of document.querySelectorAll('.g-adaptive-layout')) window.__mo.observe(l, { attributes: true, subtree: true, attributeFilter: ['style', 'data-line', 'data-lines', 'class'] }) })
    await page.click('#street'); await page.keyboard.press('End')
    await page.keyboard.type(' número 1234, colonia Centro, entre calles Norte y Sur', { delay: 8 })
    await page.click('#ext'); await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowUp')
    await page.waitForTimeout(250)
    const writes = await page.evaluate(() => { window.__mo.disconnect(); return window.__writes })
    const after = await geom()
    const moved = before.flatMap((r, i) => r.items.filter((it, j) => { const o = after[i].items[j]; return !o || Math.abs(o.l - it.l) > 0.01 || Math.abs(o.t - it.t) > 0.01 || Math.abs(o.w - it.w) > 0.01 }).map((it) => r.id + '/' + it.id))
    ok(writes === 0, `escribir provoca ${writes} escrituras de colocación`)
    ok(!moved.length, `escribir mueve raíces: ${moved}`)

    // ---------- 4 · Δ0 de lo que no cambia: error, revelado, hidden ----------
    const pick = (g, id) => g.find((r) => r.id === id)
    await set({ err: true }, 300)
    { const g = pick(await geom(), 'fx-address'), o = pick(before, 'fx-address')
      const sameX = g.items.every((it, j) => Math.abs(it.l - o.items[j].l) < 0.01 && Math.abs(it.w - o.items[j].w) < 0.01)
      ok(sameX, 'error: cambia x/ancho de alguna raíz (debe crecer solo en alto)')
      const firstLineTop = g.items.filter((it) => it.line === 1).every((it, j) => Math.abs(it.t - o.items.filter((x) => x.line === 1)[j].t) < 0.01)
      ok(firstLineTop, 'error: la primera línea se mueve en vertical') }
    await set({ err: false }, 300)
    const base = pick(await geom(), 'fx-address')
    await set({ reveal: true }, 700)
    { const g = pick(await geom(), 'fx-address'); const pre = g.items.slice(0, 3), o = base.items.slice(0, 3)
      ok(pre.every((it, j) => Math.abs(it.l - o[j].l) < 0.01 && Math.abs(it.t - o[j].t) < 0.01 && Math.abs(it.w - o[j].w) < 0.01), 'revelado: se mueven hermanos anteriores')
      ok(g.items.some((it) => it.id === 'rev'), 'revelado abierto sin línea propia') }
    await set({ reveal: false }, 900)
    { const g = pick(await geom(), 'fx-address')
      const d = Math.max(...g.items.map((it, j) => Math.max(Math.abs(it.l - base.items[j].l), Math.abs(it.t - base.items[j].t), Math.abs(it.w - base.items[j].w))))
      ok(g.items.length === base.items.length && d < 0.01, `cerrar revelado no vuelve al estado exacto (Δ ${d})`)
      const hRoot = await page.locator('#fx-address').evaluate((e) => e.getBoundingClientRect().height)
      ok(Math.abs(hRoot - Math.max(...base.items.map((i) => i.b))) < 0.6, `revelado cerrado reserva alto: ${hRoot}`) }
    await page.locator('#cp').evaluate((e) => { e.closest('.g-input').hidden = true }); await page.waitForTimeout(250)
    { const g = pick(await geom(), 'fx-address'); ok(!g.items.some((i) => i.id === 'cp'), 'hidden: el campo conserva caja') ; ok(await page.locator('#cp').evaluate((e) => !e.closest('.g-input').dataset.line), 'hidden: conserva data-line') }
    await page.locator('#cp').evaluate((e) => { e.closest('.g-input').hidden = false }); await page.waitForTimeout(250)

    // ---------- 5 · orden de foco = orden DOM y visual (2.4.3), LTR y RTL ----------
    for (const dir of ['ltr', 'rtl']) for (const w of [320, 720]) {
      await set({ dir, w })
      for (const id of ['fx-address', 'fx-fields']) {
        const dom = await page.locator('#' + id).evaluate((root) => [...root.querySelectorAll('input:not([type=hidden]),select,textarea,button,[tabindex]')].filter((e) => e.tabIndex >= 0 && !e.disabled && e.getClientRects().length && !e.closest('[inert]') && getComputedStyle(e).visibility !== 'hidden').map((e) => e.id || e.getAttribute('aria-label') || e.className))
        await page.locator('#' + id).evaluate((root) => { const b = document.createElement('button'); b.id = 'tab-start'; b.textContent = 'inicio'; root.parentElement.before(b); b.focus() })
        const seq = []
        for (let i = 0; i < dom.length; i++) {
          await page.keyboard.press(name === 'webkit' ? 'Alt+Tab' : 'Tab')
          seq.push(await page.evaluate(() => { const e = document.activeElement; const root = e.closest('.g-adaptive-layout > *'); const r = e.getBoundingClientRect(); return { id: e.id || e.getAttribute('aria-label') || e.className, line: +(root?.dataset.line || 0), x: r.left, xr: r.right } }))
        }
        await page.evaluate(() => document.getElementById('tab-start').remove())
        ok(JSON.stringify(seq.map((s) => s.id)) === JSON.stringify(dom), `${dir}/${w} ${id}: Tab ${seq.map((s) => s.id)} ≠ DOM ${dom}`)
        for (let i = 1; i < seq.length; i++) {
          const a = seq[i - 1], b = seq[i]
          ok(b.line > a.line || (b.line === a.line && (dir === 'rtl' ? b.xr <= a.xr + 0.6 : b.x >= a.x - 0.6)), `${dir}/${w} ${id}: foco retrocede visualmente ${a.id}→${b.id}`)
        }
      }
    }
    await set({ dir: 'ltr', w: 460 })

    // ---------- 6 · anillo de foco visible con gap none (vecino pegado) ----------
    for (const gap of ['none', undefined]) {
      await set({ gap, w: 720 }, 300)
      await page.mouse.click(5, 5); await page.waitForTimeout(400) // el anillo se funde (duration-fast): esperar a que se apague
      const zone = await page.locator('#nombre').locator('xpath=ancestor::*[contains(@class,"g-input__control")][1]').evaluate((e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.right), y: Math.round(r.top + 6), h: Math.round(r.height - 12) } })
      const clip = { x: zone.x - 2, y: zone.y, width: 3, height: zone.h }
      const off = await page.screenshot({ clip })
      await page.focus('#nombre'); await page.keyboard.press('Shift+Tab'); await page.keyboard.press(name === 'webkit' ? 'Alt+Tab' : 'Tab'); await page.waitForTimeout(250)
      const on = await page.screenshot({ clip })
      ok(!off.equals(on), `anillo de foco invisible en el lado que da al vecino con gap ${gap}`)
    }
    await set({ gap: undefined, w: 460 })

    // ---------- 7 · tabla directa: palabras partidas por la herencia de overflow-wrap ----------
    for (const w of [460, 600, 720]) {
      await set({ w }, 300)
      const broken = await page.evaluate(() => {
        const count = (sel) => { let n = 0; for (const cell of document.querySelectorAll(sel)) { const walker = document.createTreeWalker(cell, 4); for (let t = walker.nextNode(); t; t = walker.nextNode()) { const re = /\S+/g; let m; while ((m = re.exec(t.textContent))) { const rg = document.createRange(); rg.setStart(t, m.index); rg.setEnd(t, m.index + m[0].length); const lines = new Set([...rg.getClientRects()].map((r) => Math.round(r.top))); if (lines.size > 1) n++ } } } return n }
        return { dentro: count('#tabla td, #tabla th'), fuera: count('#ref-table td, #ref-table th') }
      })
      ok(broken.dentro <= broken.fuera, `${w}: tabla dentro del layout parte ${broken.dentro} palabras (fuera ${broken.fuera})`)
    }
    { const ow = await page.locator('#tabla td').first().evaluate((e) => getComputedStyle(e).overflowWrap); note('overflow-wrap heredado en celdas de GTable dentro del layout', ow) }

    // ---------- 8 · GSummary como hijo: perfil propio (#363), suelo y los dos casos del hallazgo 4 ----------
    // Suelo = caja de identidad + separación de la raíz + 7ch (4ch en inline) del título, 1ch = avance de «0» en su fuente.
    for (const t of ['defecto-claro', 'auditoria-claro']) for (const dir of ['ltr', 'rtl']) {
      await theme(t); await set({ dir }, 120)
      for (const w of [240, 280, 320, 360, 400, 460, 600]) {
        await set({ w })
        const s = await page.evaluate(() => {
          const cv = document.createElement('canvas').getContext('2d')
          return [...document.querySelectorAll('#fx-ident > .g-summary, #fx-squeeze > .g-summary, #fx-sums > .g-summary')].map((e) => {
            const r = e.getBoundingClientRect(), t = e.querySelector('.g-summary__title'), lead = e.querySelector(':scope > .g-summary__lead')
            const ts = getComputedStyle(t); cv.font = `${ts.fontStyle} ${ts.fontWeight} ${ts.fontSize} ${ts.fontFamily}`
            const zero = cv.measureText('0').width
            const identity = lead && lead.getClientRects().length ? lead.getBoundingClientRect().width + (parseFloat(getComputedStyle(e).columnGap) || 0) : 0
            const floor = identity + (e.matches('.g-summary--layout-inline') ? 4 : 7) * zero
            const line = +e.dataset.line, mates = [...e.parentElement.children].filter((c) => c !== e && +c.dataset.line === line && c.getClientRects().length)
            return { id: e.id, layout: e.parentElement.id, w: r.width, rootW: e.parentElement.getBoundingClientRect().width, floor, titleW: t.getBoundingClientRect().width, titleOverflow: t.scrollWidth > t.clientWidth + 1, shared: mates.length > 0, line }
          })
        })
        if (t === 'defecto-claro' && dir === 'ltr') note(`GSummary a ${w}`, s.map((x) => `${x.id} L${x.line} w${x.w.toFixed(0)} suelo ${x.floor.toFixed(0)} título ${x.titleW.toFixed(0)}${x.titleOverflow ? ' (recortado)' : ''}${x.shared ? ' compartida' : ''}`).join(' · '))
        for (const x of s) {
          ok(x.w >= 1, `${t}/${dir}/${w}: ${x.id} perfilado con ancho 0`)
          ok(x.w >= Math.min(x.floor, x.rootW) - 0.6, `${t}/${dir}/${w}: ${x.id} por debajo de su suelo ${x.w.toFixed(1)} < ${x.floor.toFixed(1)}`)
          // Si comparte línea, nunca con el título recortado: apilada cabría (caso general del hallazgo 4)
          ok(!(x.shared && x.titleOverflow), `${t}/${dir}/${w}: ${x.id} comparte línea con el título recortado (${x.titleW.toFixed(0)} px)`)
        }
        const by = (id) => s.find((x) => x.id === id)
        if (w === 400) ok(by('sum1').line !== by('sum2').line || (!by('sum1').titleOverflow && !by('sum2').titleOverflow), `${t}/${dir}/400: las dos fichas juntas con título recortado`)
        if (w === 280) ok(!by('sum3').shared || !by('sum3').titleOverflow, `${t}/${dir}/280: ficha junto a dos números con título recortado`)
      }
    }
    await theme('defecto-claro'); await set({ dir: 'ltr', w: 460 })

    // ---------- 9 · altura fija con vertical center/bottom: nada inalcanzable arriba ----------
    for (const vertical of ['top', 'center', 'bottom']) for (const w of [320, 460]) {
      await set({ vertical, w }, 300)
      const top = await page.locator('#fx-tall').evaluate((root) => { const sc = root.parentElement; sc.scrollTop = 0; const s = sc.getBoundingClientRect(); return Math.min(...[...root.children].map((c) => c.getBoundingClientRect().top - s.top)) })
      ok(top >= -0.6, `vertical ${vertical} a ${w} con desbordamiento: la primera raíz queda ${top.toFixed(1)}px por encima del área desplazable`)
    }
    await set({ vertical: 'top', w: 460 })

    // ---------- 9b · horizontal lógico (#359): start/end en LTR y RTL. Solo con la API nueva ----------
    await set({ w: 1280, vertical: 'top' }, 300)
    const logical = await page.locator('#fx-tall > *').first().evaluate((e) => e.style.getPropertyValue('--_adaptive-start') !== '')
    if (!logical) note('horizontal start/end', 'PENDIENTE: el motor aún escribe --_adaptive-x (API anterior); repetir tras el cambio de bruno')
    else for (const dir of ['ltr', 'rtl']) for (const horizontal of ['start', 'center', 'end']) {
      await set({ dir, horizontal }, 300)
      const g = pick(await geom(), 'fx-tall'), line = g.items.filter((i) => i.line === 1)
      const left = Math.min(...line.map((i) => i.l)), right = Math.max(...line.map((i) => i.r))
      const atStart = dir === 'ltr' ? left : g.w - right, atEnd = dir === 'ltr' ? g.w - right : left
      ok(horizontal === 'start' ? atStart < 0.6 : horizontal === 'end' ? atEnd < 0.6 : Math.abs(atStart - atEnd) < 1.2, `horizontal ${horizontal} ${dir}: inicio ${atStart.toFixed(1)} fin ${atEnd.toFixed(1)}`)
    }
    await set({ dir: 'ltr', horizontal: undefined, w: 460 })

    // ---------- 9c · pistas en el hijo (#364) sobre el componente real ----------
    await set({ extra: true }, 500)
    await page.waitForSelector('#fx-hints.is-ready')
    for (const t of ['defecto-claro', 'auditoria-claro']) {
      await theme(t)
      for (const dir of ['ltr', 'rtl']) {
        await set({ dir }, 120)
        // ninguna pista baja un control de 24 px ni recorta su etiqueta (verify: dianas, etiquetas, desborde, orden)
        for (const w of WIDTHS) { await set({ w }); verify(`pistas/${t}/${dir}/${w}`, (await geom()).filter((r) => ['fx-hints', 'fx-group', 'fx-365', 'fx-c12'].includes(r.id))) }
      }
    }
    await theme('defecto-claro'); await set({ dir: 'ltr', w: 720 })
    { // sin herencia: el registro @property (inherits:false) en el componente real
      const inh = await page.evaluate(() => {
        const v = (el, p) => getComputedStyle(el).getPropertyValue(p).trim()
        const group = document.getElementById('fx-group')
        const piso = document.getElementById('h-piso').closest('.g-adaptive-layout > *'), rule = document.getElementById('h-rule').closest('.g-adaptive-layout > *')
        const under = (root, p) => [...root.querySelectorAll('*')].map((d) => v(d, p)).filter((x) => x !== '0')
        return { group: v(group, '--g-adapt-weight'), groupKids: under(group, '--g-adapt-weight'), piso: v(piso, '--g-adapt-chars'), pisoKids: under(piso, '--g-adapt-chars'), rule: v(rule, '--g-adapt-chars'), ruleKids: under(rule, '--g-adapt-chars') }
      })
      ok(inh.group === '5' && !inh.groupKids.length, `--g-adapt-weight se hereda en el grupo: raíz ${inh.group}, descendientes ${inh.groupKids}`)
      ok(inh.piso === '1' && !inh.pisoKids.length, `--g-adapt-chars (style) se hereda: raíz ${inh.piso}, descendientes ${inh.pisoKids}`)
      ok(inh.rule === '1' && !inh.ruleKids.length, `--g-adapt-chars (regla) se hereda: raíz ${inh.rule}, descendientes ${inh.ruleKids}`)
    }
    { // la pista se lee: quitarla cambia el perfil del hijo (y solo del hijo); devolverla vuelve al estado exacto
      const widths = () => page.evaluate(() => Object.fromEntries(['h-area', 'h-piso', 'h-rule', 'h-sel'].map((id) => [id, document.getElementById(id).closest('#fx-hints > *').getBoundingClientRect().width])))
      const a = await widths()
      await page.evaluate(() => { const r = (id) => document.getElementById(id).closest('#fx-hints > *'); r('h-area').classList.remove('g-adapt-short'); r('h-piso').style.removeProperty('--g-adapt-chars'); r('h-rule').classList.remove('aud-chars-1'); r('h-sel').classList.remove('g-adapt-short') })
      await page.waitForTimeout(250); const b = await widths()
      await page.evaluate(() => { const r = (id) => document.getElementById(id).closest('#fx-hints > *'); r('h-area').classList.add('g-adapt-short'); r('h-piso').style.setProperty('--g-adapt-chars', '1'); r('h-rule').classList.add('aud-chars-1'); r('h-sel').classList.add('g-adapt-short') })
      await page.waitForTimeout(250); const c = await widths()
      note('anchos a 720 con pistas → sin pistas', { con: a, sin: b })
      ok(Object.keys(a).filter((k) => Math.abs(a[k] - b[k]) > 0.5).length >= 2, `quitar las pistas no cambia ningún perfil: ${JSON.stringify(a)} → ${JSON.stringify(b)}`)
      ok(Object.keys(a).every((k) => Math.abs(a[k] - c[k]) < 0.01), `devolver las pistas no vuelve al estado exacto: ${JSON.stringify(c)}`)
    }
    for (const w of [320, 460, 720]) { // el plan interior del grupo es el mismo con y sin --g-adapt-weight en su raíz (a ancho igual)
      await set({ w })
      const inner = () => page.evaluate(() => { const g = document.getElementById('fx-group'); return { gw: g.getBoundingClientRect().width, kids: [...g.children].map((c) => `${c.dataset.line}:${c.getBoundingClientRect().width.toFixed(2)}`).join(',') } })
      const a = await inner()
      await page.evaluate(() => document.getElementById('fx-group').style.removeProperty('--g-adapt-weight')); await page.waitForTimeout(250)
      const b = await inner()
      await page.evaluate(() => document.getElementById('fx-group').style.setProperty('--g-adapt-weight', '5')); await page.waitForTimeout(250)
      if (Math.abs(a.gw - b.gw) < 0.01) ok(a.kids === b.kids, `${w}: el peso del grupo cambia su plan interior ${a.kids} vs ${b.kids}`)
      else note(`grupo a ${w}: el peso cambia el ancho del grupo (${a.gw.toFixed(0)} vs ${b.gw.toFixed(0)}), plan interior no comparable`, [a.kids, b.kids])
    }

    // ---------- 9d · límite conocido #365: [Calle, Exterior][Interior] a 460; g-adapt-full → Calle sola ----------
    for (const t of ['defecto-claro', 'auditoria-claro']) for (const dir of ['ltr', 'rtl']) {
      await theme(t); await set({ dir, w: 460 })
      for (const full of [false, true]) {
        await set({ calleFull: full }, 300)
        const lines = await page.evaluate(() => ['calle', 'exterior', 'interior'].map((id) => +document.getElementById(id).closest('#fx-365 > *').dataset.line))
        const expected = full ? [1, 2, 2] : [1, 1, 2]
        if (t === 'defecto-claro') ok(JSON.stringify(lines) === JSON.stringify(expected), `#365 ${dir} ${full ? 'g-adapt-full' : 'sin pista'}: líneas ${lines}, esperado ${expected}`)
        else { note(`#365 tema de auditoría ${dir} ${full ? 'g-adapt-full' : 'sin pista'}`, lines); if (full) ok(lines[0] === 1 && lines[1] > 1, `#365 auditoría ${dir} g-adapt-full: Calle no queda sola ${lines}`) }
        verify(`#365/${t}/${dir}/${full}`, (await geom()).filter((r) => r.id === 'fx-365'))
      }
      await set({ calleFull: false })
    }
    await theme('defecto-claro'); await set({ dir: 'ltr', extra: false, w: 460 }, 400)

    // ---------- 9e · alias de colocación sin herencia (@property inherits:false, decisión de coste de la ronda 2) ----------
    for (const w of [460, 720]) {
      await set({ w })
      const al = await page.evaluate(() => {
        const v = (el, p) => getComputedStyle(el).getPropertyValue(p).trim()
        const out = { roots: 0, leaks: [], labelMismatch: [] }
        for (const L of document.querySelectorAll('.g-adaptive-layout.is-ready')) for (const c of L.children) {
          if (!c.dataset.line) continue
          out.roots++
          const own = v(c, '--_adaptive-width')
          for (const d of c.querySelectorAll('*')) {
            if (d.closest('.g-adaptive-layout') !== L) continue // grupo anidado: tiene sus propios alias
            const explicit = L.classList.contains('has-shared-tracks') && d.parentElement === c && d.matches('.g-input__label,.g-input__support,.g-select__label,.g-select__support,.g-textarea__label,.g-textarea__support')
            for (const p of ['--_adaptive-line', '--_adaptive-track', '--_adaptive-start', '--_adaptive-rows']) if (v(d, p)) out.leaks.push(`${c.id || c.className.split(' ')[0]} ${d.className.split?.(' ')[0] || d.tagName} ${p}`)
            if (explicit) { if (v(d, '--_adaptive-width') !== own) out.labelMismatch.push(`${d.className} ${v(d, '--_adaptive-width')} ≠ ${own}`) }
            else if (v(d, '--_adaptive-width')) out.leaks.push(`${d.className.split?.(' ')[0] || d.tagName} --_adaptive-width`)
          }
        }
        return out
      })
      ok(al.roots > 10, `${w}: raíces con alias ${al.roots}`)
      ok(!al.leaks.length, `${w}: alias heredados por descendientes ${al.leaks.slice(0, 4)}`)
      ok(!al.labelMismatch.length, `${w}: etiqueta/pie sin el ancho de su raíz ${al.labelMismatch.slice(0, 3)}`)
    }
    await set({ w: 460 })

    // ---------- 10 · texto al 200 % ----------
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%' }); await page.waitForTimeout(400)
    for (const w of [320, 640, 1280]) { await set({ w }, 300); verify(`texto200/${w}`, await geom()) }
    await page.evaluate(() => { document.documentElement.style.fontSize = '' }); await page.waitForTimeout(300)

    // ---------- 11 · espaciado de texto 1.4.12 inyectado como hoja del usuario (sin tocar atributos) ----------
    await page.addStyleTag({ content: '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-block-end:2em!important}' })
    await page.waitForTimeout(300)
    for (const w of [320, 460, 720]) {
      await set({ w }, 300)
      const g = await geom(); verify(`spacing/${w}`, g)
      const breaks = await page.evaluate(() => { let n = 0; for (const l of document.querySelectorAll('.g-adaptive-layout .g-input__label, .g-adaptive-layout .g-select__label')) { const walker = document.createTreeWalker(l, 4); for (let t = walker.nextNode(); t; t = walker.nextNode()) { const re = /\S+/g; let m; while ((m = re.exec(t.textContent))) { const rg = document.createRange(); rg.setStart(t, m.index); rg.setEnd(t, m.index + m[0].length); if (new Set([...rg.getClientRects()].map((r) => Math.round(r.top))).size > 1) n++ } } } return n })
      note(`espaciado de texto a ${w} sin refresh(): palabras de etiqueta partidas`, breaks)
    }

    // ---------- 12 · 320 CSS px de visor: sin scroll horizontal de página ----------
    await page.setViewportSize({ width: 320, height: 800 }); await set({ w: 320 }, 400)
    { const sw = await page.evaluate(() => document.scrollingElement.scrollWidth); ok(sw <= 320, `visor 320: scroll horizontal de página ${sw}`) ; verify('visor320', await geom()) }
    await page.setViewportSize({ width: 1400, height: 1000 }); await set({ w: 460 }, 300)

    // ---------- 13 · movimiento: el reparto no anima; reduced motion ----------
    for (const rm of ['no-preference', 'reduce']) {
      await page.emulateMedia({ reducedMotion: rm }); await set({ w: 460 }, 300)
      await page.evaluate(() => { audit.state.w = 720 }); await page.waitForTimeout(60)
      const anims = await page.evaluate(() => [...document.querySelectorAll('.g-adaptive-layout, .g-adaptive-layout > *')].flatMap((e) => e.getAnimations().map((a) => a.transitionProperty || a.animationName)))
      ok(!anims.length, `${rm}: el recolocado anima ${anims}`)
    }
    await page.emulateMedia({ reducedMotion: 'no-preference' })

    // ---------- 14 · forced-colors (Chromium) ----------
    if (name === 'chromium') {
      await page.emulateMedia({ forcedColors: 'active' }); await page.waitForTimeout(300)
      for (const w of [320, 720]) { await set({ w }); verify(`forced/${w}`, await geom()) }
      await page.focus('#street'); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab'); await page.waitForTimeout(200)
      const ring = await page.locator('#street').locator('xpath=ancestor::*[contains(@class,"g-input__row")][1]').evaluate((e) => getComputedStyle(e).outlineStyle + ' ' + getComputedStyle(e).outlineWidth)
      ok(!ring.startsWith('none'), `forced-colors: sin anillo de foco (${ring})`)
      await page.emulateMedia({ forcedColors: 'none' })
    }

    // ---------- 15 · coste de rendimiento ----------
    {
      await set({ w: 460 }, 300)
      const sweepFn = async () => {
        const raf = () => new Promise((r) => requestAnimationFrame(() => r()))
        const times = []
        for (let w = 240; w <= 1280; w += 20) { const t0 = performance.now(); audit.state.w = w; await raf(); await raf(); await raf(); times.push(performance.now() - t0) }
        times.sort((a, b) => a - b); const q = (p) => times[Math.min(times.length - 1, Math.floor(p * times.length))]
        return { pasos: times.length, p50: q(0.5), p95: q(0.95), max: times.at(-1) }
      }
      const sweep = await page.evaluate(sweepFn)
      if (name === 'chromium') {
        // Coste de CPU del barrido (script + estilo + layout) frente al mismo contenido en GFormLayout.
        const cpu = async (url) => {
          const p2 = await ctx.newPage(); await p2.goto(url); await p2.waitForTimeout(800)
          const cdp = await ctx.newCDPSession(p2); await cdp.send('Performance.enable')
          const m = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((x) => [x.name, x.value]))
          const runs = []
          for (let k = 0; k < 5; k++) { const a = await m(); await p2.evaluate(sweepFn); const b = await m(); runs.push(Object.fromEntries(['ScriptDuration', 'RecalcStyleDuration', 'LayoutDuration'].map((key) => [key, (b[key] - a[key]) * 1000]))) }
          await p2.close()
          const med = (f) => { const s = runs.map(f).sort((x, y) => x - y); return +s[2].toFixed(1) }
          return { total: med((r) => r.ScriptDuration + r.RecalcStyleDuration + r.LayoutDuration), estilo: med((r) => r.RecalcStyleDuration), layout: med((r) => r.LayoutDuration), script: med((r) => r.ScriptDuration) }
        }
        const adaptive = await cpu(BASE), baseline = await cpu(BASE + '?base=1')
        note('CPU del barrido de 53 anchos (mediana de 5, ms): GAdaptiveLayout vs GFormLayout con el mismo contenido', { adaptive, formLayout: baseline, porPaso: +((adaptive.total - baseline.total) / 53).toFixed(2) })
      }
      note('barrido 240→1280 (53 pasos, 7 layouts, 3 cuadros por paso), ms por paso', sweep)
      const typing = await page.evaluate(async () => {
        const raf = () => new Promise((r) => requestAnimationFrame(() => r()))
        const run = async (sel) => { const el = document.querySelector(sel); el.focus(); const t = []; for (let i = 0; i < 40; i++) { const t0 = performance.now(); el.value += 'a'; el.dispatchEvent(new Event('input', { bubbles: true })); await raf(); t.push(performance.now() - t0) } t.sort((a, b) => a - b); return t[20] }
        return { dentro: await run('#street'), fuera: await run('#ref-input') }
      })
      note('tecleo: mediana ms hasta el siguiente cuadro, dentro vs fuera del layout', typing)
      ok(typing.dentro < typing.fuera * 1.5 + 4, `tecleo dentro del layout ${typing.dentro.toFixed(1)} ms vs fuera ${typing.fuera.toFixed(1)}`)
    }
    note('GAvatar con texto al 200 %: iniciales fuera de su caja (ajeno al layout, también fuera de él)', [...avatarSpill])
    ok(!errors.length, `errores de página: ${errors.slice(0, 3)}`)
    note('errores', errors)
    await page.screenshot({ path: `${HERE}auditoria-coco-${name}.png`, fullPage: true })
    await browser.close()
    console.log(`${name}: ${res.checks} comprobaciones, ${res.fallos.length} fallos`)
    for (const f of [...new Set(res.fallos)].slice(0, 40)) console.log('  ✗', f)
  }
  await fs.writeFile(`${HERE}auditoria-coco-resultados.json`, JSON.stringify(report, null, 1))
  process.exit(failed ? 1 : 0)
}
main()
