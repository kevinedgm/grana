// GSelect · una sola luz, solo CSS (select.md, #1004), sobre el banco de coco con el CSS real: el motor del banco imita lo
// que hará GSelect.vue. No sustituye a tests/movimiento.spec.mjs de bruno, que mide el componente real.
// Ejecutar: node design/lab/select/estilo-luz-verificar.mjs   (ENGINES=chromium,firefox,webkit por defecto). Abre por file://.
const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const url = new URL('./estilo-banco.html', import.meta.url).href
const engines = (process.env.ENGINES || 'chromium,firefox,webkit').split(',')
let ok = 0, ko = 0
const check = (e, name, pass, extra = '') => { pass ? ok++ : ko++; if (!pass) console.log(`FALLA ${e} · ${name} ${extra}`) }

// Distancia entre la luz y la fila activa, en px de pantalla
const gap = (p, i) => p.evaluate((i) => {
  const L = sels[i].list, a = L.querySelector('.is-active').getBoundingClientRect(), y = L.querySelector('.g-select__highlight').getBoundingClientRect()
  return Math.max(Math.abs(a.left - y.left), Math.abs(a.top - y.top), Math.abs(a.width - y.width), Math.abs(a.height - y.height))
}, i)
const ring = (p, i) => p.evaluate((i) => getComputedStyle(sels[i].list.querySelector('.is-active')).outlineStyle, i)
const openAt = async (p, i) => { await p.evaluate((i) => sels[i].btn.scrollIntoView({ block: 'center' }), i); await p.evaluate((i) => sels[i].btn.click(), i); await p.waitForTimeout(260) }
const closeAll = (p) => p.evaluate(() => sels.forEach((s) => s.close()))
const find = (p, label) => p.evaluate((l) => sels.findIndex((s) => s.o.label === l), label)

for (const engine of engines) {
  const b = await pw[engine].launch()
  const page = async (o = {}) => { const c = await b.newContext({ viewport: { width: 1200, height: 800 }, ...o }); const p = await c.newPage(); await p.goto(url); await p.waitForFunction(() => window.sels?.length); return p }

  let p = await page()
  const flat = await find(p, 'Categoría'), long = await find(p, 'Muchas opciones'), grp = await find(p, 'País')

  await openAt(p, flat)
  check(engine, 'apertura: la luz sobre la activa', (await gap(p, flat)) <= 1)
  check(engine, 'puntero: sin contorno al abrir con clic', (await ring(p, flat)) === 'none')
  check(engine, 'la opción activa no pinta fondo', await p.evaluate((i) => getComputedStyle(sels[i].list.querySelector('.is-active')).backgroundColor === 'rgba(0, 0, 0, 0)', flat))
  check(engine, 'la capa no cuenta como opción', await p.evaluate((i) => !sels[i].list.querySelector('.g-select__highlight').matches('[role=option]') && getComputedStyle(sels[i].list.querySelector('.g-select__highlight')).pointerEvents === 'none', flat))

  // Barrer con el ratón: viaja, con cuadros intermedios, y una sola superficie
  const boxes = await p.evaluate((i) => sels[i].els.map((e) => { const r = e.getBoundingClientRect(); return [r.x + 20, r.y + r.height / 2] }), flat)
  await p.mouse.move(...boxes[0]); await p.waitForTimeout(220)
  await p.evaluate((i) => { const y = sels[i].list.querySelector('.g-select__highlight'); window.__f = []; window.__on = true; (function f() { __f.push(getComputedStyle(y).translate + '|' + [...sels[i].els].filter((e) => getComputedStyle(e).backgroundColor !== 'rgba(0, 0, 0, 0)').length); if (__on) requestAnimationFrame(f) })() }, flat)
  await p.mouse.move(...boxes[3]); await p.waitForTimeout(260)
  const fr = await p.evaluate(() => { __on = false; return __f })
  check(engine, 'recorrer: la luz viaja por cuadros intermedios', new Set(fr).size >= 4, `estados ${new Set(fr).size}`)
  check(engine, 'recorrer: ninguna opción pinta fondo propio', fr.every((x) => x.endsWith('|0')))
  check(engine, 'recorrer: acaba sobre la activa', (await gap(p, flat)) <= 1)
  check(engine, 'puntero: sin contorno', (await ring(p, flat)) === 'none')
  check(engine, 'el foco sigue fuera de la lista', await p.evaluate((i) => !sels[i].list.contains(document.activeElement), flat))

  // Teclado: contorno; el ratón lo quita; la flecha lo devuelve
  await p.evaluate((i) => sels[i].btn.focus(), flat)
  await p.keyboard.press('ArrowUp'); await p.waitForTimeout(220)
  check(engine, 'teclado: contorno', (await ring(p, flat)) === 'solid')
  await p.mouse.move(boxes[1][0] + 3, boxes[1][1]); await p.waitForTimeout(220)
  check(engine, 'ratón: quita el contorno', (await ring(p, flat)) === 'none')
  await p.keyboard.press('ArrowDown'); await p.waitForTimeout(220)
  check(engine, 'teclado: lo devuelve', (await ring(p, flat)) === 'solid')

  // Cierre: la luz no se apaga antes que la lista
  await p.evaluate((i) => { const s = sels[i], y = s.list.querySelector('.g-select__highlight'); s.close(); window.__lit = getComputedStyle(y).opacity }, flat)
  check(engine, 'cierre: la luz sigue encendida al empezar la salida', (await p.evaluate(() => __lit)) === '1')
  await p.waitForTimeout(200)

  // Con grupos: la capa pasa por debajo de los títulos; lista desplazada
  await openAt(p, grp)
  check(engine, 'grupos: la capa bajo el contenido', await p.evaluate((i) => getComputedStyle(sels[i].list.querySelector('.g-select__highlight')).zIndex === '-1', grp))
  check(engine, 'grupos: coincide', (await gap(p, grp)) <= 1)
  await closeAll(p); await p.waitForTimeout(200)
  await openAt(p, long); await p.evaluate((i) => sels[i].btn.focus(), long)
  for (let k = 0; k < 14; k++) await p.keyboard.press('ArrowDown')
  await p.waitForTimeout(260)
  check(engine, 'lista desplazada: coincide', (await p.evaluate((i) => sels[i].list.scrollTop > 0, long)) && (await gap(p, long)) <= 1)
  await p.evaluate((i) => { sels[i].list.scrollTop += 40 }, long); await p.waitForTimeout(60)
  check(engine, 'al desplazar va con su opción', (await gap(p, long)) <= 1)
  await p.context().close()

  // RTL
  p = await page()
  await p.evaluate(() => { document.documentElement.dir = 'rtl' })
  await openAt(p, flat)
  check(engine, 'RTL: coincide', (await gap(p, flat)) <= 1)
  await p.context().close()

  // Hoja móvil
  p = await page({ viewport: { width: 400, height: 760 } })
  await openAt(p, flat)
  check(engine, 'hoja: coincide', (await gap(p, flat)) <= 1)
  await p.context().close()

  // Reducido: sin viaje, con fundido
  p = await page({ reducedMotion: 'reduce' })
  await openAt(p, flat)
  const tp = await p.evaluate((i) => { const c = getComputedStyle(sels[i].list.querySelector('.g-select__highlight')); return [c.transitionProperty, c.transitionTimingFunction] }, flat)
  check(engine, 'reducido: solo opacity, linear', tp[0] === 'opacity' && tp[1] === 'linear', tp.join(' '))
  await p.context().close()

  // forced-colors: sin capa; la activa con contorno también tras el puntero
  if (engine === 'chromium') {
    p = await page({ forcedColors: 'active' })
    await openAt(p, flat)
    const fc = await p.evaluate((i) => ({ d: getComputedStyle(sels[i].list.querySelector('.g-select__highlight')).display, keyed: sels[i].list.classList.contains('is-keyed') }), flat)
    check(engine, 'forced-colors: sin capa', fc.d === 'none')
    check(engine, 'forced-colors: contorno sin teclado', !fc.keyed && (await ring(p, flat)) === 'solid')
    await p.context().close()
  }
  await b.close()
}
console.log(`${ok}/${ok + ko}`)
process.exit(ko ? 1 : 0)
