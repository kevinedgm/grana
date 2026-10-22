// Verificación del prototipo de moneda y precio (kiwi r01): base, A, B, C y el campo, en Chromium, Firefox y WebKit.
// Ejecutar desde la raíz: node design/lab/price/r01/verificar.mjs
//   Puerto 4234 (GRANA_PW_PORT lo cambia). ENGINES=chromium,firefox,webkit  VERBOSE=1
// Requiere packages/vue/dist/ (npm run build). Solo lee; no toca packages/.
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const PORT = Number(process.env.GRANA_PW_PORT || 4234)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!path.startsWith(ROOT)) throw new Error('fuera')
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(path))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${PORT}/design/lab/price/r01/index.html`
const pw = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))

const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
const V = !!process.env.VERBOSE
const R = []
const INFO = []
const rec = (eng, part, name, ok, info = '') => { R.push({ eng, part, name, ok: !!ok }); if (V || !ok) console.log(`${ok ? 'ok  ' : 'FALLA'} ${eng} ${part} · ${name}${info !== '' ? ' · ' + info : ''}`) }
const note = (eng, what, val) => { INFO.push(`${eng} · ${what}: ${val}`) }

async function open (b, qs, opts = {}) {
  const { vw = 1280, vh = 900, ...ctx } = opts
  const context = await b.newContext({ viewport: { width: vw, height: vh }, ...ctx })
  const p = await context.newPage()
  const errs = []
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()) })
  p.on('pageerror', (e) => errs.push(String(e)))
  p.on('response', (r) => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()) })
  await p.goto(BASE + qs)
  try { await p.waitForFunction(() => window.__pr && window.__pr.ready, null, { timeout: 15000 }) } catch { throw new Error(`no arranca ${qs}: ${errs.join(' | ')}`) }
  await settle(p, 120)
  p.__errs = errs; p.__ctx = context
  return p
}
const settle = (p, ms = 40) => p.evaluate((ms) => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, ms)))), ms)
const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
const close = async (p, eng, part, label) => { rec(eng, part, `consola limpia (${label})`, p.__errs.length === 0, p.__errs.slice(0, 2).join(' | ')); await p.__ctx.close() }
const price = (p, sel) => p.evaluate((sel) => {
  const e = document.querySelector(sel)
  if (!e) return null
  const v = e.querySelector('.xp__visual')
  return { visual: (v ? v.textContent : e.textContent).replace(/\s+/g, ' ').trim(), spoken: e.querySelector('.xp__spoken')?.textContent || null, hidden: v ? v.getAttribute('aria-hidden') : null, s: e.querySelectorAll('s').length }
}, sel)

// Contraste: color del texto contra el primer fondo opaco de sus ancestros, ambos pasados por canvas (sRGB)
const CONTRAST = `(() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', { willReadFrequently: true })
  const rgb = (c) => { cx.clearRect(0,0,1,1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0,0,1,1); const d = cx.getImageData(0,0,1,1).data; return [d[0], d[1], d[2], d[3] / 255] }
  const lum = ([r,g,b]) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126*f(r) + 0.7152*f(g) + 0.0722*f(b) }
  const bgOf = (el) => { for (let n = el; n; n = n.parentElement) { const c = rgb(getComputedStyle(n).backgroundColor); if (c[3] > 0.5) return c } return rgb(getComputedStyle(document.body).backgroundColor) }
  window.__ratio = (el) => { const f = rgb(getComputedStyle(el).color), b = bgOf(el); const a = lum(f), z = lum(b); return (Math.max(a, z) + 0.05) / (Math.min(a, z) + 0.05) }
})()`

for (const eng of ENGINES) {
  const b = await pw[eng].launch()
  try {
    // ---------------- Base ----------------
    {
      const part = 'base'
      const p = await open(b, '?c=base')
      const pat = await price(p, '[data-room="patio"] .xp')
      rec(eng, part, 'visible corto con código porque «$» es de varias monedas', pat.visual.startsWith('desde $1,850 MXN / noche'), pat.visual)
      rec(eng, part, 'lectura completa con el nombre de la moneda', pat.spoken === 'desde 1,850 pesos mexicanos por noche. Antes: 2,300 pesos mexicanos', pat.spoken)
      rec(eng, part, 'lo visible va aria-hidden (no se lee dos veces)', pat.hidden === 'true')
      rec(eng, part, 'la referencia en la base es <s> visible y se lee con su etiqueta', pat.s === 1 && /Antes: 2,300/.test(pat.spoken))
      const snap = await p.locator('[data-room="patio"] .xp').first().ariaSnapshot()
      rec(eng, part, 'árbol accesible: solo la frase, sin «$» ni «MXN»', /pesos mexicanos por noche/.test(snap) && !/\$|MXN/.test(snap), snap.replace(/\n/g, ' '))
      const tour = await price(p, '[data-room="tour"] .xp')
      rec(eng, part, 'USD en página es-MX: Intl ya dice «USD», sin código duplicado', tour.visual === 'USD 95 por persona', tour.visual)
      const cases = {
        range: ['$900 a $1,400 MXN por persona', '900 a 1,400 pesos mexicanos por persona'],
        each: ['$45 MXN c/u', '45 pesos mexicanos cada uno'],
        negative: ['−$200.00 MXN', '-200 pesos mexicanos'],
        jpy: ['JPY 12,800', '12,800 yenes japoneses'],
        kwd: ['KWD 12.125', '12.125 dinares kuwaitíes'],
        'en-mxn': ['MX$1,850', '1,850 Mexican pesos'],
        'eur-de': ['1.850 €', '1.850 Euro'],
        approx: ['aprox. USD 105', 'aprox. 105 dólares estadounidenses']
      }
      for (const [k, [vis, sp]] of Object.entries(cases)) {
        const r = await price(p, `[data-case="${k}"] .xp`)
        rec(eng, part, `caso ${k}: visible`, r.visual.replace(/ /g, ' ') === vis, r.visual)
        rec(eng, part, `caso ${k}: lectura`, r.spoken === sp, r.spoken)
      }
      const free = await p.evaluate(() => { const e = document.querySelector('[data-case="free"] .xp'); return { t: e.textContent.trim(), sp: !!e.querySelector('.xp__spoken'), hid: !!e.querySelector('[aria-hidden]') } })
      rec(eng, part, '«Gratis» es texto que se lee tal cual, sin duplicar', free.t === 'Gratis' && !free.sp && !free.hid)
      const onr = await p.evaluate(() => document.querySelector('[data-case="on-request"] .xp').textContent.trim())
      rec(eng, part, 'sin valor: «Precio a consultar» (texto de la app)', onr === 'Precio a consultar')
      const ar = await price(p, '[data-case="ar"] .xp')
      rec(eng, part, 'ar-EG: cifras del idioma y nombre árabe en la lectura', /[٠-٩]/.test(ar.visual) && /جني/.test(ar.spoken), ar.visual + ' | ' + ar.spoken)
      const sh = await p.evaluate(() => ({ s: window.__pr.shared, ms: window.__pr.ambiguityMs }))
      rec(eng, part, 'símbolos compartidos sacados de Intl ($, ¥, kr, £)', ['$', '¥', 'kr', '£'].every((x) => sh.s.includes(x)), sh.s.join(' '))
      note(eng, 'tabla de símbolos compartidos calculada al vuelo', `${sh.ms} ms, ${sh.s.length} símbolos: ${sh.s.join(' ')}`)
      // Carta: cifras tabulares y alineadas al final
      const menu = await p.evaluate(() => {
        const ps = [...document.querySelectorAll('.pr-menu__price .xp')]
        const ends = ps.map((e) => Math.round(e.getBoundingClientRect().right))
        return { tab: getComputedStyle(ps[0]).fontVariantNumeric, same: new Set(ends).size === 1 }
      })
      rec(eng, part, 'carta: cifras tabulares y precios alineados al final', /tabular-nums/.test(menu.tab) && menu.same, JSON.stringify(menu))
      // Contraste y tamaño mínimo
      await p.evaluate(CONTRAST)
      const cr = await p.evaluate(() => ['.xp__amount', '.xp__unit', '.xp__code', '.xp__lead', '.xp__compare', '.xp--on-request'].map((s) => { const e = document.querySelector(s); return [s, e ? Math.round(window.__ratio(e) * 100) / 100 : null] }))
      for (const [s, r] of cr) rec(eng, part, `contraste ${s} ≥ 4.5:1`, r >= 4.5, r)
      const minFont = await p.evaluate(() => Math.min(...[...document.querySelectorAll('.xp, .xp *')].filter((e) => e.textContent.trim() && !e.closest('.xp__spoken')).map((e) => parseFloat(getComputedStyle(e).fontSize))))
      rec(eng, part, 'texto del precio ≥ 12px (también xs del calendario)', minFont >= 12, minFont)
      // Calendario: precio en el slot day
      const cal = await p.evaluate(() => {
        const btns = [...document.querySelectorAll('[data-cal] .g-datepicker__day')]
        const withP = btns.filter((x) => x.querySelector('.xp'))
        const without = btns.find((x) => !x.querySelector('.xp') && !x.closest('[aria-hidden]'))
        const a = withP[0]
        const fits = withP.every((x) => { const xp = x.querySelector('.xp'); const r = xp.getBoundingClientRect(), q = x.getBoundingClientRect(); return r.left >= q.left - 0.5 && r.right <= q.right + 0.5 })
        return { n: withP.length, name: a ? (a.getAttribute('aria-label') || a.textContent) : '', vis: a ? a.textContent : '', fits, wA: a ? Math.round(a.getBoundingClientRect().width) : 0, hA: a ? Math.round(a.getBoundingClientRect().height) : 0, wB: without ? Math.round(without.getBoundingClientRect().width) : 0, hB: without ? Math.round(without.getBoundingClientRect().height) : 0 }
      })
      rec(eng, part, 'calendario: los días con precio lo pintan dentro de la celda', cal.n > 0 && cal.fits, JSON.stringify(cal))
      rec(eng, part, 'calendario: el precio no cambia el tamaño del día', cal.wA === cal.wB && cal.hA === cal.hB, `${cal.wA}×${cal.hA} vs ${cal.wB}×${cal.hB}`)
      rec(eng, part, 'calendario (hallazgo P-L6 medido): el nombre del día NO lleva el precio', !/1,?850|2,?250/.test(cal.name), cal.name)
      note(eng, 'nombre accesible de un día con precio', `«${cal.name}» (visible: «${cal.vis}»)`)
      rec(eng, part, 'sin desbordamiento horizontal a 1280', !(await overflow(p)))
      await close(p, eng, part, '1280')
    }

    // ---------------- A · La cuenta ----------------
    for (const reduce of [false, true]) {
      const part = reduce ? 'A-reducido' : 'A'
      const p = await open(b, '?c=A', { reducedMotion: reduce ? 'reduce' : 'no-preference' })
      const t0 = await price(p, '[data-room="patio"] .xp')
      rec(eng, part, 'total arriba y tarifa como contexto', t0.visual.startsWith('Total $3,700 MXN por 2 noches'), t0.visual)
      rec(eng, part, 'la lectura empieza por el total', t0.spoken.startsWith('Total por 2 noches: 3,700 pesos mexicanos.'), t0.spoken)
      const rolls0 = await p.evaluate(() => window.__pr.rolls || 0)
      await p.locator('[data-nights] button').last().click()
      await p.waitForTimeout(30)
      const mid = await p.evaluate(() => ({ slots: document.querySelectorAll('[data-room="patio"] .xp__roll-slot').length, rolls: window.__pr.rolls || 0 }))
      await p.waitForTimeout(600)
      const t1 = await price(p, '[data-room="patio"] .xp')
      rec(eng, part, 'el total lo da la app: 3 noches = 5,950 (viernes más caro), no 3 × 1,850', /Total \$5,950 MXN por 3 noches/.test(t1.visual) && /Total por 3 noches: 5,950 pesos mexicanos/.test(t1.spoken), t1.visual)
      if (reduce) rec(eng, part, 'movimiento reducido: no se crea la capa que rueda', mid.slots === 0 && mid.rolls === rolls0, JSON.stringify(mid))
      else rec(eng, part, 'ruedan solo las cifras que cambian', mid.slots > 0 && mid.slots < 6, JSON.stringify(mid))
      const left = await p.evaluate(() => document.querySelectorAll('.xp__roll-slot').length)
      rec(eng, part, 'la capa se retira al terminar', left === 0, left)
      const live = await p.evaluate(() => document.querySelector('[data-live]').textContent)
      rec(eng, part, 'ningún precio habla solo (sin región viva propia)', live === '' && (await p.locator('.xp [aria-live]').count()) === 0)
      await close(p, eng, part, 'A')
    }

    // ---------------- B · La moneda se dice una vez ----------------
    {
      const part = 'B'
      const p = await open(b, '?c=B')
      const leg = await p.evaluate(() => [...document.querySelectorAll('.xps__legend')].map((e) => e.textContent.replace(/\s+/g, ' ').trim()))
      rec(eng, part, 'la región dice su moneda una vez (leyenda)', leg.length === 3 && leg[0].includes('Precios en pesos mexicanos (MXN)'), leg[0])
      const pat = await price(p, '[data-room="patio"] .xp')
      rec(eng, part, 'dentro de la región el símbolo basta (sin «MXN»)', pat.visual.startsWith('desde $1,850 / noche'), pat.visual)
      rec(eng, part, 'la lectura sigue diciendo la moneda', pat.spoken.startsWith('desde 1,850 pesos mexicanos'), pat.spoken)
      const cartUsd = await p.evaluate(() => [...document.querySelectorAll('.pr-cart .xp')].map((e) => e.querySelector('.xp__visual')?.textContent.trim() || e.textContent.trim()))
      rec(eng, part, 'en la región MXN, lo extranjero conserva su código', cartUsd.some((t) => /USD/.test(t)) && cartUsd.filter((t) => /MXN/.test(t)).length === 0, cartUsd.join(' | '))
      await p.locator('[data-view] input[value="USD"]').check({ force: true })
      await settle(p, 80)
      const pat2 = await price(p, '[data-room="patio"] .xp')
      const leg2 = await p.evaluate(() => document.querySelector('.xps__legend').textContent)
      rec(eng, part, 'la vista en USD cambia todos los precios de la región a la vez', /aprox\. USD 105\.11/.test(pat2.visual) && /dólares estadounidenses/.test(leg2), pat2.visual + ' | ' + leg2)
      rec(eng, part, 'lo convertido se lee «aprox.»', /^desde aprox\. 105\.11 dólares estadounidenses/.test(pat2.spoken), pat2.spoken)
      const menuStill = await price(p, '.pr-menu .xp')
      rec(eng, part, 'una región sin alternativas no cambia (la carta sigue en pesos)', menuStill.visual === '$185', menuStill.visual)
      await p.evaluate(CONTRAST)
      const seal = await p.evaluate(() => { const e = document.querySelector('.xps__seal'); const r = e.getBoundingClientRect(); return { c: window.__ratio(e), h: r.height, hidden: e.getAttribute('aria-hidden') } })
      rec(eng, part, 'sello: contraste ≥ 4.5:1, decorativo (la leyenda lo dice en texto)', seal.c >= 4.5 && seal.hidden === 'true', JSON.stringify(seal))
      await close(p, eng, part, 'B')
    }

    // ---------------- C · El antes y el ahora ----------------
    for (const theme of ['', '&theme=dark']) {
      const part = theme ? 'C-oscuro' : 'C'
      const p = await open(b, '?c=C' + theme)
      const pat = await price(p, '[data-room="patio"] .xp')
      rec(eng, part, 'sin tachado: la referencia dice qué es', pat.s === 0 && /^Temporada alta \$2,300/.test(pat.visual), pat.visual)
      rec(eng, part, 'el ahorro en texto, calculado sin error de coma flotante', /Ahorras \$450/.test(pat.visual), pat.visual)
      rec(eng, part, 'se lee igual que se ve', pat.spoken === 'desde 1,850 pesos mexicanos por noche. Temporada alta: 2,300 pesos mexicanos. Ahorras 450 pesos mexicanos', pat.spoken)
      const order = await p.evaluate(() => { const t = document.querySelector('[data-room="patio"] .xp__trace').getBoundingClientRect(); const n = document.querySelector('[data-room="patio"] .xp__now').getBoundingClientRect(); return t.bottom <= n.top + 1 })
      rec(eng, part, 'la referencia queda encima y el precio actual al final de la lectura visual', order)
      await p.evaluate(CONTRAST)
      const cr = await p.evaluate(() => ['.xp__was', '.xp__saving', '.xp__amount'].map((s) => [s, Math.round(window.__ratio(document.querySelector(s)) * 100) / 100]))
      for (const [s, r] of cr) rec(eng, part, `contraste ${s} ≥ 4.5:1`, r >= 4.5, r)
      await close(p, eng, part, 'C')
    }

    // ---------------- Campo de moneda (GNumberField real con props derivadas) ----------------
    {
      const part = 'campo'
      const p = await open(b, '?c=base')
      const inp = p.locator('[data-field="main"] input[role="spinbutton"]')
      const attrs = await inp.evaluate((e) => ({ im: e.inputMode || e.getAttribute('inputmode'), type: e.type, desc: (e.getAttribute('aria-describedby') || '').split(' ').map((id) => document.getElementById(id)?.textContent.trim()).filter(Boolean) }))
      rec(eng, part, 'spinbutton de texto con inputmode decimal (MXN, 2 decimales)', attrs.type === 'text' && attrs.im === 'decimal', JSON.stringify(attrs))
      rec(eng, part, 'la descripción lleva el nombre de la moneda (prefixLabel)', attrs.desc.some((t) => t === 'pesos mexicanos'), attrs.desc.join(' | '))
      await inp.click()
      await inp.selectText()
      await inp.press('Backspace')
      await inp.pressSequentially('2500.5')
      const typing = await inp.inputValue()
      rec(eng, part, 'mientras se escribe: sin miles ni símbolo', typing === '2500.5', typing)
      await inp.press('Tab')
      await settle(p)
      const out = await inp.inputValue()
      const hid = await p.locator('[data-field="main"] input[type="hidden"][name="precio"]').inputValue()
      rec(eng, part, 'al salir: formato del idioma con los decimales de la moneda', out === '2,500.50', out)
      rec(eng, part, 'canónico oculto para el envío nativo', hid === '2500.5', hid)
      const model = await p.evaluate(() => document.querySelector('[data-model]').textContent)
      rec(eng, part, 'modelo { amount, currency } en la app (Number + currency)', model === '{"amount":2500.5,"currency":"MXN"}', model)
      // Cambiar a JPY (0 decimales): qué pasa con 2500.5
      await p.evaluate(() => { window.__pr.fieldCurrency.value = 'JPY' })
      await settle(p, 80)
      const jp = { text: await inp.inputValue(), model: await p.evaluate(() => window.__pr.fieldAmount.value), im: await inp.evaluate((e) => e.inputMode) }
      rec(eng, part, 'JPY: sin decimales e inputmode numeric', !/\./.test(jp.text) && jp.im === 'numeric', JSON.stringify(jp))
      note(eng, 'MXN 2500.5 → cambiar a JPY', `texto «${jp.text}», modelo ${jp.model}`)
      // Pegar un precio con símbolo y código
      await p.evaluate(() => { window.__pr.fieldCurrency.value = 'MXN' })
      await settle(p, 60)
      await inp.click()
      await inp.selectText()
      await inp.press('Backspace')
      await inp.evaluate((e) => { const dt = new DataTransfer(); dt.setData('text/plain', '$1,850.00 MXN'); e.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })) })
      await settle(p)
      note(eng, 'pegar «$1,850.00 MXN» en el campo real', `texto «${await inp.inputValue()}», modelo ${await p.evaluate(() => window.__pr.fieldAmount.value)}`)
      // Alemán: símbolo detrás, coma decimal
      const de = p.locator('[data-field="de"] input[role="spinbutton"]')
      const deSuffix = await p.evaluate(() => { const r = document.querySelector('[data-field="de"]'); const s = r.querySelector('.g-input__suffix'); return s ? s.textContent.trim() : null })
      rec(eng, part, 'de-DE: el símbolo va detrás (sufijo) y sin código (€ no es compartido)', deSuffix === '€', deSuffix)
      await de.click()
      await de.selectText()
      await de.press('Backspace')
      await de.pressSequentially('1850,5')
      await de.press('Tab')
      await settle(p, 80)
      const deActive = await p.evaluate(() => document.activeElement?.closest('[data-field="de"]') ? 'sigue dentro' : (document.activeElement?.tagName || 'nada'))
      note(eng, 'foco tras Tab desde el último campo', deActive)
      if (deActive === 'sigue dentro') { await de.blur(); await settle(p, 80) }
      rec(eng, part, 'de-DE: «1.850,50» al salir', (await de.inputValue()) === '1.850,50', await de.inputValue())
      const sym = await p.evaluate(() => { const v = document.querySelector('[data-field="main"] .g-input__prefix'); const i = document.querySelector('[data-field="main"] input[role="spinbutton"]'); return v && i ? Math.round(i.getBoundingClientRect().left - v.getBoundingClientRect().right) : null })
      rec(eng, part, 'el símbolo va pegado a la cifra (P1 de GNumberField)', sym !== null && sym <= 12, sym)
      await close(p, eng, part, 'campo')
    }

    // ---------------- Reflujo a 320px, página en inglés ----------------
    for (const c of ['base', 'A', 'B', 'C']) {
      const p = await open(b, `?c=${c}`, { vw: 320, vh: 800 })
      rec(eng, '320', `${c}: sin desbordamiento horizontal`, !(await overflow(p)))
      const clipped = await p.evaluate(() => [...document.querySelectorAll('.xp__visual')].filter((e) => { const r = e.getBoundingClientRect(); return r.right > document.documentElement.clientWidth + 1 }).length)
      rec(eng, '320', `${c}: ningún precio sale del visor`, clipped === 0, clipped)
      await close(p, eng, '320', c)
    }
    {
      const p = await open(b, '?c=base&lang=en-US')
      const pat = await price(p, '[data-room="patio"] .xp')
      rec(eng, 'en-US', 'MXN en inglés: «MX$» ya es inequívoco, sin código', pat.visual.startsWith('from MX$1,850 / night'), pat.visual)
      rec(eng, 'en-US', 'lectura en inglés', pat.spoken === 'from 1,850 Mexican pesos per night. Was: 2,300 Mexican pesos', pat.spoken)
      await close(p, eng, 'en-US', 'en')
    }
  } catch (e) {
    rec(eng, 'motor', 'sin excepción', false, String(e).slice(0, 300))
  } finally { await b.close() }
}

server.close()
for (const i of INFO) console.log('medido · ' + i)
const ok = R.filter((r) => r.ok).length
const by = {}
for (const r of R) { by[r.eng] = by[r.eng] || [0, 0]; by[r.eng][1]++; if (r.ok) by[r.eng][0]++ }
console.log(Object.entries(by).map(([e, [a, t]]) => `${e} ${a}/${t}`).join(' · '))
console.log(`${ok}/${R.length}`)
process.exit(ok === R.length ? 0 : 1)
