// Verificación de GCombobox (kiwi): base funcional (r01) y, con CONCEPTS=A,B,C, los conceptos de r02. Chromium, Firefox y WebKit.
// Ejecutar: node design/lab/combobox/r01/verificar.mjs   (Playwright de design/lab/theme-playground; GRANA_PW_PORT, por defecto 4209)
// Requiere `npm run build`. ENGINES=chromium CONCEPTS=base,A VERBOSE=1 para filtrar o ver todo.
import { serve, pw } from '../serve.mjs'

export async function run(defaults) {
  const { server, base } = await serve()
  const report = []
  for (const engine of (process.env.ENGINES || 'chromium,firefox,webkit').split(',')) {
    const b = await pw[engine].launch()
    for (const C of (process.env.CONCEPTS || defaults).split(',')) {
      let pass = 0; const fails = []; const errs = []
      const ok = (c, m) => { if (c) pass++; else fails.push(m); if (process.env.VERBOSE) console.log(engine, C, c ? 'ok ' : 'NO ', m) }
      const A = C.includes('A') && C !== 'base', CC = C.includes('C'); const S = C === 'B' // superficie modal también en escritorio
      const url = C === 'base' ? `${base}/r01/index.html` : `${base}/r02/index.html?c=${C}`
      const open = async (opts = {}) => {
        const { vw = 1000, vh = 800, q = '', fast = true, ...ctx } = opts
        const context = await b.newContext({ viewport: { width: vw, height: vh }, ...ctx })
        const p = await context.newPage()
        p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()) })
        p.on('pageerror', (e) => errs.push(String(e)))
        await p.goto(url + (q ? (url.includes('?') ? '&' : '?') + q : ''))
        await p.waitForFunction(() => window.__S && document.querySelector('#paciente'))
        await p.evaluate((f) => { window.__fast = f }, fast)
        return p
      }
      const st = (p, id) => p.evaluate((id) => {
        const i = document.getElementById(id); const root = i.closest('.xc'); const surf = document.getElementById(id + '-surface'); const qi = document.getElementById(id + '-q')
        const list = document.getElementById(id + '-list'); const cb = surf && surf.open ? qi : i
        const opts = [...list.querySelectorAll('[role=option]')]
        return {
          open: root.dataset.open === 'true', expanded: i.getAttribute('aria-expanded'), active: cb.getAttribute('aria-activedescendant'), activeOk: !cb.getAttribute('aria-activedescendant') || Boolean(list.querySelector('#' + CSS.escape(cb.getAttribute('aria-activedescendant')))),
          n: opts.filter((o) => o.dataset.row === 'option').length, acts: opts.filter((o) => o.dataset.row !== 'option').map((o) => o.dataset.row), first: opts[0] ? opts[0].id : null, ids: opts.map((o) => o.id),
          activeText: (list.querySelector('.is-active') || {}).textContent || '', activeRow: (list.querySelector('.is-active') || { dataset: {} }).dataset.row || null,
          value: i.value, q: qi ? qi.value : null, status: (document.getElementById(id + '-status') || {}).textContent || '', statusKind: (document.getElementById(id + '-status') || { className: '' }).className,
          busy: list.getAttribute('aria-busy'), focus: document.activeElement && document.activeElement.id, surface: Boolean(surf && surf.open), listHidden: list.hidden,
          popOpen: Boolean(document.getElementById(id + '-pop') && document.getElementById(id + '-pop').matches(':popover-open'))
        }
      }, id)
      const model = (p, id) => p.evaluate((id) => document.getElementById('out-' + id).textContent, id)
      const live = (p) => p.evaluate(() => window.__live.map((x) => ({ ...x })))
      const settle = (p, ms = 220) => p.waitForTimeout(ms)
      const type = async (p, id, text) => { await p.focus('#' + id); await p.keyboard.type(text, { delay: 15 }); await settle(p) }
      const geo = (p, id) => p.evaluate((id) => { const c = document.getElementById(id).closest('.g-input__control').getBoundingClientRect(); return { top: c.top, left: c.left, w: c.width, h: c.height, sy: scrollY, sh: document.documentElement.scrollHeight, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth } }, id)
      const contrast = (p, sel) => p.evaluate((sel) => {
        const lum = (c) => { const [r, g, b] = c.match(/[\d.]+/g).slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
        const el = document.querySelector(sel); if (!el) return null
        let bg = null; for (let n = el; n && !bg; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor; if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) bg = c }
        const a = lum(getComputedStyle(el).color), z = lum(bg || 'rgb(255,255,255)'); return (Math.max(a, z) + 0.05) / (Math.min(a, z) + 0.05)
      }, sel)

      // ============ 1. Reposo: semántica ============
      let p = await open()
      const rest = await p.evaluate(() => { const i = document.getElementById('paciente'); return { role: i.getAttribute('role'), exp: i.getAttribute('aria-expanded'), ctl: Boolean(document.getElementById(i.getAttribute('aria-controls'))), auto: i.getAttribute('aria-autocomplete'), pop: i.getAttribute('aria-haspopup'), label: document.querySelector('label[for=paciente]').textContent.trim(), ac: i.getAttribute('autocomplete'), tag: i.tagName, type: i.type } })
      ok(rest.role === 'combobox' && rest.tag === 'INPUT' && rest.type === 'text', '1 el campo es <input type=text role=combobox>')
      ok(rest.exp === 'false' && rest.ctl, '1 aria-expanded=false y aria-controls apunta a un elemento que existe')
      ok(S ? rest.pop === 'dialog' : rest.auto === 'list' && rest.pop === 'listbox', '1 aria-autocomplete=list y aria-haspopup=listbox (superficie: haspopup=dialog)')
      ok(rest.label === 'Paciente' && rest.ac === 'off', '1 etiqueta ligada con for; autocomplete=off')
      const lb = await p.evaluate(() => { const l = document.getElementById('paciente-list'); return { role: l.getAttribute('role'), by: Boolean(document.getElementById(l.getAttribute('aria-labelledby'))) } })
      ok(lb.role === 'listbox' && lb.by, '1 la lista es role=listbox con nombre (aria-labelledby a la etiqueta del campo)')

      // ============ 2. El foco por Tab no abre ============
      await p.focus('#paciente'); await settle(p, 80)
      let s = await st(p, 'paciente')
      ok(!s.open && s.expanded === 'false', '2 enfocar con el teclado no abre la lista')
      const g0 = await geo(p, 'paciente')
      const calls0 = await p.evaluate(() => window.__S.server.calls)

      // ============ 3. Escribir: antirrebote, resultados, resaltado, anuncio, Δ0 ============
      await p.keyboard.type('m', { delay: 15 }); await settle(p)
      s = await st(p, 'paciente')
      ok(s.open && s.n === 0 && /al menos 2/.test(s.status), '3 un carácter (minChars 2): se abre con la pista «Escribe al menos 2 caracteres», sin opciones')
      ok((await p.evaluate(() => window.__S.server.calls)) === calls0, '3 por debajo de minChars no se emite search')
      await p.keyboard.type('ar', { delay: 5 }); await settle(p, 300)
      s = await st(p, 'paciente')
      ok(s.open && s.expanded === 'true' && s.n === 20, `3 «mar»: lista abierta con 20 opciones (${s.n})`)
      ok((await p.evaluate(() => window.__S.server.calls)) <= calls0 + 2, '3 antirrebote: a lo sumo una búsqueda por pausa, no una por tecla')
      ok(s.acts.join() === 'more', `3 fila de acción «Mostrar más» al final (${s.acts})`)
      ok(s.active === s.first && s.activeOk, '3 la primera opción queda activa tras asentarse (aria-activedescendant existe en la lista)')
      ok(await p.evaluate(() => document.querySelector('#paciente-list [role=option] mark')?.textContent.toLowerCase() === 'mar'), '3 la coincidencia va marcada con <mark>')
      let lv = await live(p)
      ok(lv.some((x) => /^20 de [\d,. ]+ resultados$/.test(x.text)), `3 anuncio educado del recuento («20 de N resultados»): ${JSON.stringify(lv.map((x) => x.text))}`)
      ok(lv.filter((x) => /resultados/.test(x.text)).length === 1, '3 un solo anuncio de recuento (sin saturar)')
      const g1 = await geo(p, 'paciente')
      ok(Math.abs(g1.top - g0.top) < 0.5 && g1.sy === g0.sy && g1.sh === g0.sh && Math.abs(g1.h - g0.h) < 0.5, `3 Δ0: abrir no mueve el campo ni la página ni cambia el alto del documento (Δtop ${g1.top - g0.top}, Δalto doc ${g1.sh - g0.sh})`)
      ok(!S ? s.popOpen : s.surface, '3 la lista vive en la capa superior (popover abierto / diálogo modal)')
      ok(await p.evaluate(() => { const o = document.querySelector('#paciente-list [role=option]'); const r = o.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return o.contains(hit) }), '3 la primera opción es la que recibe el puntero (nada la tapa)')

      // ============ 4. Teclado ============
      await p.keyboard.press('ArrowDown'); s = await st(p, 'paciente')
      ok(s.active === s.ids[1], '4 ↓ pasa a la segunda opción')
      await p.keyboard.press('ArrowUp'); await p.keyboard.press('ArrowUp'); s = await st(p, 'paciente')
      ok(s.active === s.ids[0], '4 ↑ vuelve y no cicla en la primera')
      await p.keyboard.press('PageDown'); s = await st(p, 'paciente')
      ok(s.active === s.ids[10], '4 Av Pág avanza diez')
      ok(s.focus === (S ? 'paciente-q' : 'paciente'), '4 el foco real no sale del campo mientras se navega')
      ok(await p.evaluate(() => { const a = document.querySelector('#paciente-list .is-active').getBoundingClientRect(); const sc = document.querySelector('#paciente-list').closest('.xc-panel').getBoundingClientRect(); return a.top >= sc.top - 1 && a.bottom <= sc.bottom + 1 }), '4 la opción activa siempre queda a la vista dentro de la lista')
      ok((await geo(p, 'paciente')).sy === g0.sy, '4 navegar no desplaza la página')
      // Mostrar más
      await p.keyboard.press('PageDown'); await p.keyboard.press('PageDown'); s = await st(p, 'paciente')
      ok(s.activeRow === 'more', '4 la fila «Mostrar más» es la última navegable')
      await p.keyboard.press('Enter'); await settle(p, 300); s = await st(p, 'paciente')
      ok(s.open && s.n === 40 && s.active === s.ids[20], `4 Intro en «Mostrar más»: 40 opciones, sigue abierta y la activa es la primera nueva (${s.n})`)
      await p.keyboard.press('Enter'); await settle(p)
      s = await st(p, 'paciente')
      const m4 = await model(p, 'paciente')
      ok(!s.open && /^p\d+$/.test(m4), `4 Intro elige la activa y cierra (modelo ${m4})`)
      ok(s.focus === 'paciente' && s.value.length > 5, '4 el foco queda en el campo y su valor es la etiqueta de la opción')

      // ============ 5. Esc ============
      await p.keyboard.type('zz', { delay: 15 }); await settle(p)
      s = await st(p, 'paciente'); ok(s.open, '5 escribir sobre un valor reabre')
      await p.keyboard.press('Escape'); s = await st(p, 'paciente')
      ok(!s.open && (S || s.value === 'zz') && s.focus === 'paciente', '5 Esc cierra la lista; el foco sigue en el campo')
      if (!S) { await p.keyboard.press('Escape'); await settle(p, 60); s = await st(p, 'paciente'); ok(s.value.length > 5 && (await model(p, 'paciente')) === m4, '5 segundo Esc restaura el texto de la opción elegida; el modelo no cambió') }

      // ============ 6. Salir del campo ============
      if (!S) {
        await p.keyboard.type('xyz', { delay: 15 }); await settle(p); await p.keyboard.press('Tab'); await settle(p, 80)
        s = await st(p, 'paciente')
        ok(!s.open && s.value.length > 5 && (await model(p, 'paciente')) === m4, '6 texto que no coincide + Tab: se descarta y vuelve la opción elegida')
        await p.focus('#paciente'); await p.keyboard.type('mar', { delay: 15 }); await settle(p, 300)
        s = await st(p, 'paciente'); const firstText = s.activeText
        await p.keyboard.press('Tab'); await settle(p, 80)
        const m6 = await model(p, 'paciente')
        ok(m6 === m4 && firstText.length > 0, '6 Tab NO elige la opción resaltada sola: el modelo no cambia' + (A ? ' (A: hay homónimas, Tab tampoco acepta el texto completado)' : ''))
        // Vaciar y salir borra
        await p.focus('#paciente'); await p.keyboard.press('Backspace'); await settle(p); await p.keyboard.press('Tab'); await settle(p, 80)
        ok((await model(p, 'paciente')) === 'null', '6 vaciar el texto y salir borra el valor (null)')
      } else {
        await p.focus('#paciente'); await p.keyboard.press('Enter'); await settle(p)
        s = await st(p, 'paciente'); ok(s.surface && s.focus === 'paciente-q', '6 [B] Intro en el campo abre la superficie y enfoca su campo')
        await p.keyboard.press('Tab'); ok(engine === 'webkit' || (await st(p, 'paciente')).focus === 'paciente-close', '6 [B] Tab queda dentro de la superficie (cerrar)') // WebKit: Tab no enfoca botones por ajuste del sistema (no es del componente)
        await p.keyboard.press('Tab'); ok(await p.evaluate(() => { const a = document.activeElement; return a === document.body || a.closest('#paciente-surface') !== null }), '6 [B] otro Tab no llega a la página de detrás (modal nativo: el resto es inerte)')
        await p.keyboard.press('Shift+Tab'); await p.focus('#paciente-q')
        await p.keyboard.press('Escape'); await settle(p, 80); s = await st(p, 'paciente')
        ok(!s.surface && s.focus === 'paciente' && (await model(p, 'paciente')) === m4, '6 [B] Esc cierra sin cambiar y devuelve el foco al campo')
      }
      // Botón de limpiar
      if ((await model(p, 'paciente')) === 'null') { await type(p, 'paciente', 'ana'); await settle(p, 200); await p.keyboard.press('Enter'); await settle(p) }
      ok((await model(p, 'paciente')) !== 'null', '6 hay valor antes de limpiar')
      const clr = await p.evaluate(() => { const b = document.getElementById('paciente-clear'); const r = b.getBoundingClientRect(); return { name: b.getAttribute('aria-label'), w: r.width, h: r.height } })
      ok(clr.name === 'Limpiar Paciente' && clr.w >= 24 && clr.h >= 24, '6 botón de limpiar con nombre accesible y ≥ 24px')
      await p.click('#paciente-clear'); await settle(p, 80); s = await st(p, 'paciente')
      ok((await model(p, 'paciente')) === 'null' && s.value === '' && s.focus === 'paciente', '6 limpiar: null, campo vacío y foco en el campo')

      // ============ 7. Sin resultados, error y reintento ============
      await type(p, 'paciente', 'qqqq'); await settle(p, 200); s = await st(p, 'paciente')
      ok(s.open && s.n === 0 && /Sin resultados para «qqqq»/.test(s.status) && s.listHidden, '7 sin resultados: mensaje en el panel, lista sin opciones')
      ok((await live(p)).some((x) => /Sin resultados para «qqqq»/.test(x.text)), '7 «Sin resultados» se anuncia')
      await p.keyboard.press('Escape'); if (!S) await p.keyboard.press('Escape')
      await p.evaluate(() => { window.__failNext = true })
      await p.focus('#paciente'); await p.keyboard.insertText('lop'); await settle(p, 300); s = await st(p, 'paciente')
      ok(/No se pudieron cargar/.test(s.status) && /error/.test(s.statusKind) && s.acts.includes('retry'), `7 error de carga: mensaje en la lista y fila «Reintentar» (${s.acts})`)
      ok((await live(p)).some((x) => /No se pudieron cargar/.test(x.text)), '7 el error de carga se anuncia')
      ok((await p.evaluate(() => document.getElementById('paciente').getAttribute('aria-invalid'))) !== 'true', '7 el error de carga no marca el campo como inválido (no es error de validación)')
      await p.keyboard.press('ArrowDown'); s = await st(p, 'paciente')
      ok(s.activeRow === 'retry', '7 ↓ llega a «Reintentar»')
      await p.keyboard.press('Enter'); await settle(p, 300); s = await st(p, 'paciente')
      ok(s.open && s.n > 0 && !s.status, `7 Intro reintenta: resultados (${s.n}) y el mensaje desaparece`)
      await p.context().close()

      // ============ 8. Cargando sin perder resultados; Intro no elige un resultado obsoleto ============
      p = await open({ fast: false })
      await p.focus('#paciente'); await p.keyboard.type('mar'); await p.waitForTimeout(1100)
      s = await st(p, 'paciente'); ok(s.n === 20, '8 resultados de «mar» cargados (tiempos reales)')
      await p.keyboard.type('i'); await p.waitForTimeout(60)
      s = await st(p, 'paciente')
      ok(s.n === 20 && s.busy === 'true', `8 mientras busca «mari» siguen los resultados anteriores y la lista lleva aria-busy (${s.n}, ${s.busy})`)
      await p.keyboard.press('Enter'); await p.waitForTimeout(60)
      ok((await st(p, 'paciente')).open && (await model(p, 'paciente')) === 'null', '8 Intro durante la búsqueda NO elige el resultado obsoleto resaltado solo')
      await p.waitForTimeout(1100); s = await st(p, 'paciente')
      ok(s.busy === null && s.n > 0 && s.active === s.first, '8 al llegar los nuevos: sin aria-busy y la primera activa')
      await p.context().close()

      // ============ 9. Lista local: grupos, código, acentos ============
      p = await open()
      await type(p, 'dx', 'diab'); s = await st(p, 'dx')
      ok(s.n === 2 && s.acts.length === 0, `9 «diab» filtra en local a 2 opciones (${s.n})`)
      ok(await p.evaluate(() => { const g = document.querySelector('#dx-list [role=group]'); return g && document.getElementById(g.getAttribute('aria-labelledby')).textContent.includes('Endocrinas') && g.parentElement.getAttribute('role') === 'presentation' }), '9 los grupos son role=group con nombre')
      ok(/E10\.9/.test(s.activeText), '9 la opción incluye su código en el texto')
      await p.keyboard.press('Enter'); await settle(p, 80)
      ok((await model(p, 'dx')) === 'E10.9', '9 Intro elige E10.9')
      await p.focus('#dx'); await p.keyboard.type('j45', { delay: 15 }); await settle(p); s = await st(p, S ? 'dx' : 'dx')
      ok(s.n === 1 && /Asma/.test(s.activeText), '9 se busca también por código («j45» → Asma)')
      await p.keyboard.press('Escape'); if (!S) await p.keyboard.press('Escape')
      await p.focus('#dx'); await p.keyboard.type('migrana', { delay: 15 }); await settle(p); s = await st(p, 'dx')
      ok(s.n === 1 && /Migraña/.test(s.activeText), '9 búsqueda sin acentos ni eñes («migrana» → Migraña)')
      await p.keyboard.press('Escape'); if (!S) await p.keyboard.press('Escape')
      // Abrir sin escribir: la elegida queda marcada y activa
      await p.focus('#dx'); await p.keyboard.press('ArrowDown'); await settle(p, 120); s = await st(p, 'dx')
      ok(s.open && s.n === 34, `9 ↓ abre la lista completa (${s.n} de 34)`)
      ok(await p.evaluate(() => document.querySelector('#dx-list [aria-selected=true]')?.textContent.includes('E10.9') && document.querySelectorAll('#dx-list [aria-selected=true]').length === 1), '9 solo la elegida lleva aria-selected=true')
      await p.keyboard.press('Escape')
      ok((await p.evaluate(() => document.getElementById('dx').getAttribute('aria-required'))) === 'true' || (await p.evaluate(() => document.getElementById('dx').required)), '9 obligatorio expuesto en el campo')

      // ============ 10. Texto libre y fila de agregar ============
      await type(p, 'med', 'Clonazepam 2 mg'); s = await st(p, 'med')
      ok(s.n === 0 && s.acts.join() === 'custom', `10 texto sin coincidencia con allowCustom: fila «Usar … como texto libre» (${s.acts})`)
      if (!S) { await p.keyboard.press('Tab'); await settle(p, 80) } else { await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await settle(p, 80) }
      ok((await model(p, 'med')) === 'Clonazepam 2 mg' && (await st(p, 'med')).value === 'Clonazepam 2 mg', '10 el texto libre queda como valor (' + (S ? 'Intro en la fila' : 'al salir del campo') + ')')
      await type(p, 'med', 'parace'); s = await st(p, 'med')
      ok(s.n === 2 && s.acts.join() === 'custom', '10 con coincidencias, la fila de texto libre va al final')
      await p.keyboard.press('Enter'); await settle(p, 80)
      ok((await model(p, 'med')) === 'm0', '10 Intro elige la opción del catálogo (m0)')
      await type(p, 'cliente', 'Nuevo SA'); s = await st(p, 'cliente')
      ok(s.acts.join() === 'create' && s.ids[s.ids.length - 1].endsWith('-create'), '10 fila «Agregar «texto»…» siempre la última (#57)')
      ok(await p.evaluate(() => { const o = document.getElementById('cliente-opt-create'); return o.getAttribute('role') === 'option' && o.getAttribute('aria-selected') === 'false' && /Agregar «Nuevo SA»/.test(o.textContent) }), '10 es role=option con aria-selected=false y lleva el texto tecleado')
      await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await settle(p, 120)
      s = await st(p, 'cliente')
      ok((await p.evaluate(() => document.getElementById('out-created').textContent)) === 'Nuevo SA' && s.focus === 'cliente' && !s.open, '10 Intro en la fila emite create con el texto y el foco queda en el campo')
      ok(s.value === 'Nuevo SA', '10 la aplicación agregó la opción y el campo la muestra')

      // ============ 11. Formulario ============
      const row = await p.evaluate(() => ['f-pac', 'f-sel', 'f-nota'].map((id) => { const c = document.getElementById(id).closest('.g-input__control, .g-select__control').getBoundingClientRect(); return { t: c.top, b: c.bottom, l: c.left, r: c.right } }))
      ok(Math.max(...row.map((r) => r.t)) - Math.min(...row.map((r) => r.t)) < 1 && Math.max(...row.map((r) => r.b)) - Math.min(...row.map((r) => r.b)) < 1, `11 en GFormRow las tres cajas comparten línea (tops ${row.map((r) => Math.round(r.t))})`)
      const rowW = await p.evaluate(() => { const r = document.getElementById('row').getBoundingClientRect(); return { w: r.width } })
      ok(Math.abs(row[2].r - row[0].l - rowW.w) < 2, '11 la fila llena el ancho sin huecos')
      ok(await p.evaluate(() => document.getElementById('f-pac').value === window.__S.patients[57].label), '11 valor inicial que no está en options: se pinta con selectedOption')
      await p.click('#f-ro'); await settle(p, 80); s = await st(p, 'f-ro')
      ok(!s.open && (await p.evaluate(() => document.getElementById('f-ro').readOnly && !document.getElementById('f-ro-clear'))), '11 solo lectura: enfocable, no abre, sin limpiar')
      await p.keyboard.press('ArrowDown'); ok(!(await st(p, 'f-ro')).open, '11 solo lectura: ↓ no abre')
      ok(await p.evaluate(() => document.getElementById('f-dis').disabled), '11 deshabilitado: el campo nativo está disabled')
      ok(await p.evaluate(() => document.getElementById('f-bad').getAttribute('aria-invalid') === 'true' && document.getElementById(document.getElementById('f-bad').getAttribute('aria-describedby').split(' ').pop()).textContent.includes('Elige un diagnóstico')), '11 error: aria-invalid y mensaje descrito')
      await p.click('#send'); await settle(p, 80)
      ok(/"paciente":"p\d+"/.test(await p.evaluate(() => document.getElementById('out-sent').textContent)), '11 el envío lleva el value de la opción (campo oculto con name), no el texto')

      // ============ 12. Dentro de GDialog ============
      await p.click('#d-open'); await p.waitForSelector('#dlg[open], dialog[open]'); await settle(p, 300)
      const livePre = (await live(p)).length
      await type(p, 'd-dx', 'asma'); s = await st(p, 'd-dx')
      ok(s.open && s.n === 1, '12 en un diálogo modal la lista abre y filtra')
      ok(await p.evaluate(() => { const o = document.querySelector('#d-dx-list [role=option]'); const r = o.getBoundingClientRect(); return o.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)) && !o.closest('[inert]') }), '12 la opción queda por encima del diálogo y recibe el puntero')
      ok((await live(p)).slice(livePre).every((x) => x.host === 'dialog') && (await live(p)).length > livePre, '12 el recuento se anuncia en la región viva del diálogo (el resto de la página es inerte)')
      await p.keyboard.press('Escape'); await settle(p, 80)
      ok(!(await st(p, 'd-dx')).open && (await p.evaluate(() => document.querySelector('dialog.g-dialog').open)), '12 Esc cierra la lista, no el diálogo')
      if (!S) { await p.keyboard.press('Escape'); await settle(p, 80); ok((await st(p, 'd-dx')).value !== 'asma' && (await p.evaluate(() => document.querySelector('dialog.g-dialog').open)), '12 segundo Esc restaura el texto y tampoco cierra el diálogo') }
      await p.focus('#d-dx'); await p.keyboard.type('asma', { delay: 15 }); await settle(p)
      await p.click('#d-dx-list [role=option]'); await settle(p, 120)
      ok((await model(p, 'dx')) === 'J45.9', '12 elegir con el puntero dentro del diálogo funciona')
      await p.context().close()

      // ============ 13. Quinientas opciones ============
      p = await open()
      await p.focus('#big')
      const t13 = await p.evaluate(async () => { const t0 = performance.now(); document.getElementById('big').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); return performance.now() - t0 })
      s = await st(p, 'big')
      ok(s.open && s.n === 50 && s.acts.join() === 'more', `13 500 opciones: se pintan 50 y «Mostrar más» (${s.n})`)
      ok(t13 < 150, `13 abrir con 500 opciones tarda ${Math.round(t13)} ms (< 150)`)
      await p.keyboard.type('499', { delay: 15 }); await settle(p); s = await st(p, 'big')
      ok(s.n === 1, '13 el filtro local recorre las 500, no solo las pintadas')
      await p.context().close()

      // ============ 14. Móvil 375 y 320: hoja con el campo arriba ============
      for (const vw of [375, 320]) {
        p = await open({ vw, vh: 700, hasTouch: engine !== 'firefox', isMobile: engine === 'chromium' })
        let g = await geo(p, 'paciente')
        ok(g.sw <= g.cw, `14 ${vw}px: sin desbordamiento horizontal (${g.sw} ≤ ${g.cw})`)
        await p.click('#paciente'); await settle(p, 250); s = await st(p, 'paciente')
        ok(s.surface && s.focus === 'paciente-q', `14 ${vw}px: tocar el campo abre la hoja y enfoca su campo`)
        const sheet = await p.evaluate(() => { const b = document.querySelector('#paciente-surface .xc-surface__box').getBoundingClientRect(); const i = document.getElementById('paciente-q').parentElement.getBoundingClientRect(); return { top: b.top, w: b.width, itop: i.top, ih: i.height, vw: innerWidth } })
        ok(sheet.top === 0 && Math.abs(sheet.w - sheet.vw) < 1 && sheet.itop < 120 && sheet.ih >= 43, `14 ${vw}px: hoja arriba, ancho completo, campo arriba y ≥ 44px (${sheet.ih})`)
        ok(s.n === 4 && (await p.evaluate(() => document.querySelector('#paciente-list .xc-group__label')?.textContent === 'Recientes')), '14 sin escribir: recientes como grupo')
        await p.keyboard.type('gar', { delay: 15 }); await settle(p, 300); s = await st(p, 'paciente')
        ok(s.n === 20 && (await p.evaluate(() => [...document.querySelectorAll('#paciente-list [role=option]')].every((o) => o.getBoundingClientRect().height >= 43.5))), '14 opciones ≥ 44px en la hoja')
        ok(await p.evaluate(() => { const b = document.querySelector('#paciente-surface .xc-surface__box'); return b.scrollWidth <= b.clientWidth + 1 }), '14 la hoja no desborda en horizontal')
        await p.click('#paciente-list [role=option]'); await settle(p, 150); s = await st(p, 'paciente')
        ok(!s.surface && /^p\d+$/.test(await model(p, 'paciente')) && s.focus === 'paciente', '14 elegir cierra la hoja, fija el valor y devuelve el foco al campo')
        g = await geo(p, 'paciente'); ok(g.sw <= g.cw, `14 ${vw}px: con valor, sin desbordamiento`)
        await p.context().close()
      }

      // ============ 15. RTL ============
      p = await open({ q: 'dir=rtl' })
      await type(p, 'paciente', 'mar'); await settle(p, 250)
      const rtl = await p.evaluate(() => {
        const c = document.getElementById('paciente').closest('.g-input__control').getBoundingClientRect(); const s = document.getElementById('paciente-surface')
        const box = s && s.open ? s.querySelector('.xc-surface__box') : document.getElementById('paciente-pop'); const r = box.getBoundingClientRect()
        const o = document.querySelector('#paciente-list [role=option]'); const lead = o.querySelector('.xc-opt__lead').getBoundingClientRect(); const main = o.querySelector('.xc-opt__main').getBoundingClientRect()
        return { cr: c.right, r: r.right, l: r.left, vw: document.documentElement.clientWidth, leadAfter: lead.left > main.left, sw: document.documentElement.scrollWidth }
      })
      ok(S || Math.abs(rtl.cr - rtl.r) < 1.5, `15 RTL: el panel se alinea al borde de inicio (derecho) de la caja (${rtl.cr} / ${rtl.r})`)
      ok(rtl.l >= 0 && rtl.r <= rtl.vw + 0.5 && rtl.sw <= rtl.vw && rtl.leadAfter, '15 RTL: dentro del visor y con el avatar al inicio (derecha)')
      await p.context().close()

      // ============ 16. Reduced motion y contraste ============
      p = await open({ reducedMotion: 'reduce', fast: false })
      await p.focus('#dx'); await p.keyboard.type('diab'); await p.waitForTimeout(500)
      s = await st(p, 'dx'); ok(s.open && s.n === 2, '16 reduced motion: abre y filtra igual')
      ok(await p.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && !(a.animationName || '').includes('spin')).length === 0), '16 reduced motion: ninguna animación ni transición en curso al abrir')
      const cA = await contrast(p, '#dx-list .is-active .xc-opt__label'); const cD = await contrast(p, '#dx-list .xc-group__label'); const cC = await contrast(p, '#dx-list .is-active .xc-code')
      ok(cA >= 4.5 && cD >= 4.5 && cC >= 4.5, `16 contraste: opción activa ${cA.toFixed(1)}, encabezado de grupo ${cD.toFixed(1)}, código ${cC.toFixed(1)} (≥ 4.5)`)
      await p.keyboard.press('Enter'); await p.waitForTimeout(150)
      ok(await p.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length === 0), '16 reduced motion: elegir no anima')
      await p.context().close()

      // ============ 17. Propio de cada concepto ============
      if (A) {
        p = await open()
        await type(p, 'paciente', 'mar'); await settle(p, 300)
        const a = await p.evaluate(() => {
          const ce = document.getElementById('paciente').closest('.g-input__control'); const c = ce.getBoundingClientRect(); const pop = document.getElementById('paciente-pop').getBoundingClientRect(); const inn = document.querySelector('#paciente-pop .xc-pop__in').getBoundingClientRect()
          const g = document.querySelector('.xc-ghost'); const gr = g && g.querySelector('.xc-ghost__rest'); const i = document.getElementById('paciente')
          return { dl: Math.abs(c.left - pop.left), dt: Math.abs(c.top - pop.top), dw: Math.abs(c.width - pop.width), seam: Math.abs(inn.top - c.bottom), ghost: gr ? gr.textContent : null, hidden: g && g.getAttribute('aria-hidden'), pe: getComputedStyle(document.getElementById('paciente-pop')).pointerEvents, hit: document.elementFromPoint(c.left + 60, c.top + c.height / 2) === i }
        })
        ok(a.dl < 1 && a.dt < 1 && a.dw < 1 && a.seam < 1.5, `17 [A] una sola forma: el contorno abierto abraza campo y lista (Δ ${a.dl}/${a.dt}/${a.dw}, costura ${a.seam})`)
        ok(a.hit && a.pe === 'none', '17 [A] el campo sigue recibiendo el puntero bajo la forma abierta')
        ok(a.ghost === 'ía García López' && a.hidden === 'true', `17 [A] texto fantasma con el resto de la primera coincidencia, oculto al lector (${a.ghost})`)
        const cg = await contrast(p, '.xc-ghost__rest'); ok(cg >= 4.5, `17 [A] contraste del texto fantasma ${cg.toFixed(1)} ≥ 4.5`)
        await p.keyboard.press('ArrowRight'); await settle(p, 60); s = await st(p, 'paciente')
        ok(s.value === 'María García López' && s.open && (await model(p, 'paciente')) === 'null', '17 [A] → al final acepta el texto sin elegir todavía')
        await p.keyboard.press('Enter'); await settle(p, 80)
        ok(/^p/.test(await model(p, 'paciente')), '17 [A] Intro elige')
        await p.keyboard.type('x'); await settle(p, 200)
        ok((await p.evaluate(() => document.querySelector('.xc-ghost'))) === null, '17 [A] sin coincidencia por prefijo no hay texto fantasma')
        await type(p, 'dx', 'diab'); await p.keyboard.press('Tab'); await settle(p, 100)
        ok((await model(p, 'dx')) === 'E10.9' && (await st(p, 'dx')).value.startsWith('Diabetes mellitus tipo 1'), '17 [A] etiqueta única: Tab acepta lo que el campo muestra completado (E10.9)')
        await p.context().close()
        p = await open({ vh: 500 }) // sin sitio debajo: se abre hacia arriba, la forma sigue siendo una
        await p.evaluate(() => { const c = document.getElementById('paciente').closest('.g-input__control'); scrollTo(0, c.getBoundingClientRect().top + scrollY - 440) })
        await type(p, 'paciente', 'mar'); await settle(p, 300)
        const u = await p.evaluate(() => { const c = document.getElementById('paciente').closest('.g-input__control').getBoundingClientRect(); const pop = document.getElementById('paciente-pop').getBoundingClientRect(); return { up: document.getElementById('paciente').closest('.xc').classList.contains('is-up'), db: Math.abs(c.bottom - pop.bottom), top: pop.top } })
        ok(u.up && u.db < 1 && u.top >= 0, `17 [A] sin sitio debajo abre hacia arriba y el contorno termina en el borde inferior del campo (Δ ${u.db})`)
        await p.context().close()
      }
      if (C === 'B') {
        p = await open()
        await p.focus('#paciente'); await p.keyboard.type('maría garcía lópez', { delay: 15 }); await settle(p, 350)
        s = await st(p, 'paciente')
        ok(s.surface && s.q === 'maría garcía lópez', `17 [B] escribir con el foco en el campo abre la paleta con ese texto, sin perder la primera tecla (${s.q})`)
        const pv = async () => p.evaluate(() => { const a = document.getElementById('paciente-preview'); return { name: a.querySelector('.xb-preview__name')?.textContent, exp: a.querySelector('dd')?.textContent, label: a.getAttribute('aria-label'), w: a.getBoundingClientRect().width } })
        const p1 = await pv(); await p.keyboard.press('ArrowDown'); const p2 = await pv()
        ok(p1.name === 'María García López' && p2.name === 'María García López' && p1.exp !== p2.exp, `17 [B] cuatro homónimas: la ficha distingue por expediente (${p1.exp} → ${p2.exp})`)
        ok(p1.label === 'Vista previa' && p1.w > 200, '17 [B] la ficha es una región con nombre')
        ok(await p.evaluate(() => { const o = document.querySelector('#paciente-list .is-active'); return /Exp\. \d+/.test(o.textContent) }), '17 [B] el dato que distingue también está en la opción (la ficha no es la única fuente)')
        const cB = await contrast(p, '#paciente-list .is-active .xc-opt__desc'); ok(cB >= 4.5, `17 [B] contraste de la opción activa invertida ${cB.toFixed(1)} ≥ 4.5`)
        const box = await p.evaluate(() => { const b = document.querySelector('#paciente-surface .xc-surface__box').getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom, vw: innerWidth, vh: innerHeight, modal: document.getElementById('paciente-surface').matches(':modal') } })
        ok(box.modal && box.l > 0 && box.r < box.vw && box.b <= box.vh, '17 [B] superficie modal centrada dentro del visor')
        await p.mouse.click(5, 5); await settle(p, 80)
        ok(!(await st(p, 'paciente')).surface, '17 [B] pulsar el fondo cierra sin elegir')
        await p.context().close()
        p = await open(); await p.click('#d-open'); await settle(p, 300)
        await p.focus('#d-dx'); await p.keyboard.press('Enter'); await settle(p, 150); await p.keyboard.type('tos'); await settle(p)
        await p.keyboard.press('Enter'); await settle(p, 120)
        ok((await model(p, 'dx')) === 'R05' && (await st(p, 'd-dx')).focus === 'd-dx' && (await p.evaluate(() => document.querySelector('dialog.g-dialog, .g-dialog')?.matches(':modal, [open]'))), '17 [B] paleta sobre un GDialog: elige, vuelve al campo y el diálogo sigue abierto')
        await p.context().close()
      }
      if (CC) {
        p = await open()
        const h0 = (await geo(p, 'paciente')).h
        await type(p, 'paciente', 'mar'); await settle(p, 300); await p.keyboard.press('Enter'); await settle(p, 120)
        const t = await p.evaluate(() => {
          const i = document.getElementById('paciente'); const tk = i.closest('.xc').querySelector('.xc-token'); const d = (i.getAttribute('aria-describedby') || '').split(' ').map((x) => document.getElementById(x)?.textContent).join(' ')
          return { token: Boolean(tk), hidden: tk?.getAttribute('aria-hidden'), name: tk?.querySelector('.xc-token__name').textContent, meta: tk?.querySelector('.xc-token__meta')?.textContent, avatar: Boolean(tk?.querySelector('.g-avatar')), value: i.value, desc: d, focus: document.activeElement === i, tw: tk.getBoundingClientRect().width }
        })
        ok(t.token && t.avatar && t.name === 'María García López' && /Exp\. \d+ · \d+ años/.test(t.meta), `17 [C] elegido: ficha con avatar, nombre y expediente/edad (${t.meta})`)
        ok(t.hidden === 'true' && t.value === 'María García López' && /Exp\./.test(t.desc), '17 [C] para el lector: el valor es el nombre y el expediente/edad va en aria-describedby')
        ok(Math.abs((await geo(p, 'paciente')).h - h0) < 0.5, '17 [C] la ficha no cambia el alto del campo (Δ0)')
        ok(t.focus, '17 [C] el foco sigue en el campo con la ficha puesta')
        const cT = await contrast(p, '#case-paciente .xc-token__meta'); ok(cT >= 4.5, `17 [C] contraste del dato secundario ${cT.toFixed(1)} ≥ 4.5`)
        await p.keyboard.type('an', { delay: 15 }); await settle(p, 300)
        s = await st(p, 'paciente')
        ok(s.value === 'an' && s.open && !(await p.evaluate(() => document.querySelector('#case-paciente .xc-token'))), '17 [C] escribir sobre la ficha la reemplaza por texto y busca')
        ok(await p.evaluate(() => document.querySelector('#paciente-list [role=option] .xc-facts .xc-fact')?.textContent.includes('Exp.')), '17 [C] los resultados son fichas con los datos que distinguen')
        await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await settle(p, 80)
        ok(Boolean(await p.evaluate(() => document.querySelector('#case-paciente .xc-token'))), '17 [C] Esc dos veces: vuelve la ficha')
        await type(p, 'dx', 'i10'); await p.keyboard.press('Enter'); await settle(p, 120)
        ok(await p.evaluate(() => { const tk = document.querySelector('#case-dx .xc-token'); return tk.querySelector('.xc-code').textContent === 'I10' && /Hipertensión/.test(tk.querySelector('.xc-token__name').textContent) && /I10/.test(document.getElementById('dx-about').textContent) }), '17 [C] diagnóstico: código + descripción en el campo, y el código en la descripción accesible')
        await type(p, 'med', 'Clonazepam 2 mg'); await p.keyboard.press('Tab'); await settle(p, 120)
        ok(await p.evaluate(() => { const x = document.getElementById('med').closest('.xc'); return x.classList.contains('is-custom') && x.querySelector('.xc-token__meta').textContent === 'Texto libre' && document.getElementById('med-about').textContent === 'Texto libre' }), '17 [C] el texto libre lleva su propia marca (visible y para el lector)')
        await p.click('#med'); await settle(p, 150)
        ok((await st(p, 'med')).open && !(await p.evaluate(() => document.querySelector('#case-med .xc-token'))), '17 [C] pulsar la ficha abre la lista y deja el texto editable')
        await p.context().close()
        p = await open({ vw: 320, vh: 700 })
        await p.evaluate(() => { window.__S.pat.value = window.__S.patients[0].value; window.__S.pat.options = [window.__S.patients[0]] }); await settle(p, 120)
        const n = await p.evaluate(() => { const tk = document.querySelector('#case-paciente .xc-token'); const c = tk.closest('.g-input__control'); return { fits: tk.getBoundingClientRect().right <= c.getBoundingClientRect().right, name: tk.querySelector('.xc-token__name').getBoundingClientRect().width, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth } })
        ok(n.fits && n.name > 60 && n.sw <= n.cw, `17 [C] 320px: la ficha cabe; el nombre gana sitio al dato secundario (${Math.round(n.name)}px)`)
        await p.context().close()
      }

      ok(errs.length === 0, `0 consola limpia: ${errs.slice(0, 3).join(' | ')}`)
      report.push({ engine, C, pass, fails })
      console.log(`${engine} ${C}: ${pass} ok, ${fails.length} fallos`)
      for (const f of fails) console.log('   NO  ' + f)
    }
    await b.close()
  }
  server.close()
  const total = report.reduce((a, r) => a + r.pass, 0), bad = report.reduce((a, r) => a + r.fails.length, 0)
  console.log(`\nTOTAL: ${total}/${total + bad}`)
  process.exitCode = bad ? 1 : 0
}
if (import.meta.url === `file://${process.argv[1]}`) await run('base')
