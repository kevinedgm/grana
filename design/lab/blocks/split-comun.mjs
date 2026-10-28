// coco · medida común de GSplit dentro de los bloques (PO-L1, CR-L1, CK-L1, AV-L1 tras la recomposición de bruno 8710e80, #950).
// La usan design/lab/blocks/{ecommerce,booking}/auditoria-verificar.mjs. Sobre los bloques REALES, sin tocarlos.
// Predicción independiente del tema: umbral = max(space × k, cuerpo × k / 4) × (a + b) / min(a, b) + separación; al lado si la caja
// del GSplit (su ancho) lo alcanza, apilado si no (±0,75 px). Se lee de la propia raíz (--_narrow y column-gap resueltos).
// splitCase(open, ok, note, E, t, caso): open(file, qs, {vw, vh}) → {p, close}; caso = { file, qs, gb, ratio: [a, b], collapse, id }
const TAB = (eng) => (eng === 'webkit' ? 'Alt+Tab' : 'Tab')

// En la página: medidas del GSplit de un bloque (regiones directas de .g-split dentro de data-gb)
const MEASURE = (gb) => {
  const root = document.querySelector(`[data-gb="${gb}"] .g-split`)
  if (!root) return null
  const kids = [...root.children]
  const [s, e] = kids.map((c) => c.getBoundingClientRect())
  const r = root.getBoundingClientRect()
  // --_narrow resuelto: una sonda absoluta (no entra en el flujo del flex)
  const probe = document.createElement('div')
  probe.style.cssText = 'position:absolute;visibility:hidden;inline-size:var(--_narrow);block-size:0'
  root.append(probe)
  const narrow = probe.getBoundingClientRect().width
  probe.remove()
  const cs = getComputedStyle(root)
  const gap = parseFloat(cs.columnGap)
  const cls = [...root.classList]
  const pick = (re) => (cls.find((c) => re.test(c)) || '').replace(re, '')
  return {
    n: kids.length, side: kids.length === 2 && Math.abs(s.top - e.top) <= 1 && s.right <= e.left + 1,
    stacked: kids.length === 2 && e.top >= s.bottom - 1,
    inside: kids.every((c) => { const x = c.getBoundingClientRect(); return x.left >= r.left - 1 && x.right <= r.right + 1 }),
    full: kids.every((c) => Math.abs(c.getBoundingClientRect().width - r.width) <= 1),
    start: s.width, end: e && e.width, root: r.width, narrow, gap, between: e ? Math.max(e.left - s.right, s.left - e.right) : 0,
    ratio: pick(/^g-split--ratio-/), collapse: pick(/^g-split--collapse-/), rtl: cs.direction === 'rtl',
    startFirst: kids[0]?.classList.contains('g-split__region--start'),
    // contenido de las regiones dentro de ellas (sin sobresalir de su caja por el borde final)
    spill: Math.max(0, ...kids.map((c) => { const b = c.getBoundingClientRect(); let m = 0; for (const x of c.querySelectorAll('*')) { const q = x.getBoundingClientRect(); if (q.width > 0 && q.height > 0 && !x.closest('[hidden], .g-sr-only, [inert]')) m = Math.max(m, q.right - b.right, b.left - q.left) } return m }))
  }
}
export const measure = (p, gb) => p.evaluate(MEASURE, gb)

const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
const settle = (p, ms = 250) => p.evaluate((ms) => new Promise((r) => setTimeout(r, ms)), ms)

// Recorre el bloque con Tab: la secuencia de regiones recorridas debe ser «s» y después «e»
async function tabOrder (p, eng, gb, steps) {
  await p.evaluate((gb) => { const b = document.querySelector(`[data-gb="${gb}"]`); const t = document.createElement('button'); t.id = 'tab-probe'; t.textContent = 'antes'; b.before(t); t.focus() }, gb)
  const seq = []
  for (let i = 0; i < steps; i++) {
    await p.keyboard.press(TAB(eng))
    const where = await p.evaluate((gb) => { const el = document.activeElement; const reg = el && el.closest(`[data-gb="${gb}"] .g-split > *`); return reg ? (reg.classList.contains('g-split__region--start') ? 's' : 'e') : null }, gb)
    if (!where && seq.length) break
    if (where && seq[seq.length - 1] !== where) seq.push(where)
  }
  await p.evaluate(() => document.getElementById('tab-probe')?.remove())
  return seq.join('')
}

export async function splitCase (open, ok, note, eng, E, t, c) {
  const { file, qs, gb, ratio: [a, b], id, tabs = 60 } = c
  const q = (...xs) => xs.filter(Boolean).join('&')
  const K = { sm: 64, md: 80, lg: 96 }
  // Umbral predicho con las medidas resueltas de la raíz (al lado ⇔ caja ≥ umbral)
  const predict = (m) => {
    const need = m.narrow * (a + b) / Math.min(a, b) + m.gap
    return { need, side: m.root >= need - 0.75, stacked: m.root < need + 0.75 }
  }
  // 1440, 1024, 768, 390, 320: la regla de la caja (independiente del tema) y la geometría que promete el contrato
  {
    const { p, close } = await open(file, q(qs, t), { vw: 1440, vh: 900 })
    for (const vw of [1440, 1024, 768, 390, 320]) {
      await p.setViewportSize({ width: vw, height: 900 })
      await settle(p)
      const m = await measure(p, gb)
      ok(m && m.n === 2 && m.startFirst, `${E} · ${gb} a ${vw}: GSplit con dos regiones, start primero en el DOM (${id})`, JSON.stringify(m && { n: m.n }))
      if (!m || m.n !== 2) continue
      const pr = predict(m)
      ok(m.inside && (m.side || m.stacked), `${E} · ${gb} a ${vw}: cada región dentro de la caja del GSplit y o al lado o apilada (${id})`, JSON.stringify({ inside: m.inside, side: m.side, stacked: m.stacked }))
      ok(m.ratio === `${a}-${b}`, `${E} · ${gb}: proporción ${a}:${b} en la clase (${id})`, m.ratio)
      if (m.side) {
        ok(pr.side, `${E} · ${gb} a ${vw}: al lado solo si la caja alcanza el umbral (${Math.round(m.root)} ≥ ${Math.round(pr.need)}) (${id})`)
        const free = m.start + m.end
        ok(Math.abs(m.start - (free * a) / (a + b)) <= 1.5 && Math.abs(m.end - (free * b) / (a + b)) <= 1.5, `${E} · ${gb} a ${vw}: proporción ${a}:${b} exacta ±1,5 px (${id})`, `${Math.round(m.start)} · ${Math.round(m.end)}`)
        const narrowSide = Math.min(m.start, m.end)
        ok(narrowSide >= m.narrow - 1, `${E} · ${gb} a ${vw}: el lado estrecho (${Math.round(narrowSide)}) no baja de collapse (${Math.round(m.narrow)}) (${id})`)
        ok(Math.abs(m.between - m.gap) <= 1, `${E} · ${gb} a ${vw}: separación entre regiones = ${m.gap} px (${id})`, String(m.between))
      } else {
        ok(pr.stacked, `${E} · ${gb} a ${vw}: apilado solo si la caja no alcanza el umbral (${Math.round(m.root)} < ${Math.round(pr.need)}) (${id})`)
        ok(m.full, `${E} · ${gb} a ${vw}: apilado, cada región a todo el ancho de la caja (${id})`, `${Math.round(m.start)} · ${Math.round(m.end)} / ${Math.round(m.root)}`)
      }
      ok(!(await overflow(p)), `${E} · ${gb} a ${vw}: sin desplazamiento horizontal (${id})`)
      if (vw === 1440) {
        // La regla manda: con el tema por defecto y el de lujo (cuerpo 16 px) la caja de 1024 alcanza el umbral de los cuatro; con rústico
        // (cuerpo 17 px) el lado estrecho sube a 340 y un caso (2:1) pasa a apilarse a 1440: es la regla, no un defecto (se anota)
        ok(m.side === pr.side, `${E} · ${gb} a 1440: las dos columnas al lado cuando la caja alcanza el umbral (${Math.round(m.root)} vs ${Math.round(pr.need)}) (${id})`, `${Math.round(m.start)} · ${Math.round(m.end)} / caja ${Math.round(m.root)}`)
        if (!m.side) note(`${E} · ${gb} a 1440: apilado por la regla (caja ${Math.round(m.root)} < umbral ${Math.round(pr.need)}; lado estrecho mínimo ${Math.round(m.narrow)} con el cuerpo de este tema)`)
        else if (t === 'tema=defecto') ok(true, `${E} · ${gb} a 1440: las dos columnas al lado en el tema por defecto (${id})`)
        if (c.side1440 && t === 'tema=defecto') ok(Math.abs(Math.min(m.start, m.end) - c.side1440) <= 2, `${E} · ${gb} a 1440: lado estrecho ≈ ${c.side1440} (contrato, tema por defecto) (${id})`, String(Math.round(Math.min(m.start, m.end))))
        if (m.side) {
          const tab = await tabOrder(p, eng, gb, tabs)
          ok(/^se?$/.test(tab), `${E} · ${gb} a 1440: Tab recorre start y después end (${id})`, tab)
        }
      }
      if (vw <= 768 && t === 'tema=defecto') ok(m.stacked, `${E} · ${gb} a ${vw}: apilado limpio (${id})`)
      if (vw === 390 || vw === 320) {
        ok(m.stacked && m.full && m.spill <= 1, `${E} · ${gb} a ${vw}: apilado limpio, nada sobresale de su región (${id})`, `spill ${Math.round(m.spill)}`)
        const tab = await tabOrder(p, eng, gb, tabs)
        ok(/^se?$/.test(tab), `${E} · ${gb} a ${vw}: Tab recorre start y después end (${id})`, tab)
      }
    }
    // 768 → 1440: decide igual que al cargar (sin suelo de contenido, regla 6)
    await p.setViewportSize({ width: 768, height: 900 }); await settle(p)
    await p.setViewportSize({ width: 1440, height: 900 }); await settle(p)
    const back = await measure(p, gb)
    const want = predict(back).side
    ok(back.side === want, `${E} · ${gb}: 768 → 1440 decide igual que al cargar (${want ? 'al lado' : 'apilado'}), sin atascarse (${id})`)
    await p.setViewportSize({ width: 320, height: 900 }); await settle(p)
    await p.setViewportSize({ width: 1440, height: 900 }); await settle(p)
    { const m2 = await measure(p, gb); ok(m2.side === predict(m2).side, `${E} · ${gb}: 320 → 1440 decide igual que al cargar (${id})`) }
    ok(!p.__errs.length, `${E} · ${gb}: consola limpia (${id})`, p.__errs.join(' | '))
    await close()
  }
  // Texto al 200 %: el lado estrecho sigue al texto; la regla de la caja se cumple y a 320 no hay desplazamiento
  for (const vw of [1440, 320]) {
    const { p, close } = await open(file, q(qs, t, 'zoom=2'), { vw, vh: vw === 320 ? 640 : 900 })
    const m = await measure(p, gb)
    const pr = predict(m)
    if (vw === 1440) {
      ok(m.stacked && pr.stacked, `${E} · ${gb} a 1440 con el texto al 200 %: apilado (el mínimo del lado estrecho se dobla) (${id})`, `caja ${Math.round(m.root)} vs umbral ${Math.round(pr.need)}`)
    } else {
      ok(m.stacked && m.full, `${E} · ${gb} a 320 con el texto al 200 %: apilado a todo el ancho (${id})`)
    }
    ok(m.inside, `${E} · ${gb} a ${vw} al 200 %: regiones dentro de la caja (${id})`)
    ok(!(await overflow(p)), `${E} · ${gb} a ${vw} al 200 %: sin desplazamiento horizontal (${id})`)
    await close()
  }
  // RTL: start va al inicio en línea (a la derecha) y la proporción se conserva
  {
    const { p, close } = await open(file, q(qs, t), { vw: 1440, vh: 900 })
    const wide = (await measure(p, gb)).side
    await p.evaluate(() => { document.documentElement.dir = 'rtl' })
    await settle(p)
    const r = await p.evaluate(([gb, wide]) => { const root = document.querySelector(`[data-gb="${gb}"] .g-split`); const [s, e] = [...root.children].map((c) => c.getBoundingClientRect()); return { wide, startRight: s.left > e.left, side: Math.abs(s.top - e.top) <= 1, over: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 } }, [gb, wide])
    ok(r.side === (r.wide), `${E} · ${gb} en RTL a 1440: decide igual que en LTR (${id})`, JSON.stringify(r))
    ok(!r.side || r.startRight, `${E} · ${gb} en RTL a 1440: start a la derecha cuando va al lado, y apilado arriba si no (${id})`, JSON.stringify(r))
    ok(!r.over, `${E} · ${gb} en RTL: sin desplazamiento horizontal (${id})`)
    await close()
  }
}
