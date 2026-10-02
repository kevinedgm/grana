// Verificación de la ronda r01 de captura de voz (kiwi), Chromium.
// Ejecutar desde la raíz del repo: node design/lab/speech/r01/verificar.mjs  (PORT=4238 por defecto)
// Levanta su propio servidor estático (el prototipo importa iconos de node_modules/lucide-static) y usa el
// Playwright de design/lab/theme-playground.
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../../../', import.meta.url))
const port = +(process.env.PORT || 4238)
const srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '-d', root], { stdio: 'ignore' })
const URL_ = `http://127.0.0.1:${port}/design/lab/speech/r01/index.html`
for (let i = 0; i < 50; i++) { try { if ((await fetch(URL_)).ok) break } catch {} await new Promise((r) => setTimeout(r, 100)) }

const { chromium } = await import(new URL('../../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
let pass = 0, fail = 0
const fails = [], errs = []
const ok = (c, m) => { if (c) pass++; else { fail++; fails.push(m) } }
const b = await chromium.launch()
const bReal = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] })
async function open(opts = {}, browser = b) {
  const ctx = await browser.newContext({ viewport: { width: opts.w || 1280, height: opts.h || 900 }, reducedMotion: opts.rm ? 'reduce' : 'no-preference' })
  const p = await ctx.newPage()
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.type() + ': ' + m.text()) })
  p.on('pageerror', (e) => errs.push('pageerror: ' + e))
  await p.goto(URL_); await p.waitForFunction(() => window.__sp?.ready)
  if (opts.perm) await p.selectOption('#b-perm', opts.perm)
  return p
}
const st = (p) => p.evaluate(() => __sp.speech.state.status)
const waitSt = (p, list, timeout = 9000) => p.waitForFunction((l) => l.includes(__sp.speech.state.status), list, { timeout }).then(() => true, () => false)
const CAP = ['listening', 'speech', 'transcribing']
const ann = (p) => p.evaluate(() => __sp.announcements.map((a) => a.ch + '|' + a.t))
const active = (p) => p.evaluate(() => { const a = document.activeElement; return a?.id || a?.dataset?.k || a?.dataset?.role || a?.tagName })

// ---------------------------------------------------------------------------------------------------
// 1) Región única y permanente
{
  const p = await open()
  const r = await p.evaluate(() => {
    const live = [...document.querySelectorAll('[aria-live]:not([aria-live="off"]),[role="status"],[role="alert"],[role="log"]')]
    const host = document.getElementById('sp-host')
    return { n: live.length, inHost: live.every((e) => host.contains(e)), open: host.matches(':popover-open'), parent: host.parentElement.tagName, roles: live.map((e) => e.getAttribute('role')).sort().join(',') }
  })
  ok(r.n === 2, `regiones vivas al cargar: ${r.n} (esperadas 2)`)
  ok(r.inHost && r.roles === 'alert,status', 'los dos canales (status + alert) están en el anfitrión')
  ok(r.open && r.parent === 'BODY', 'anfitrión abierto como popover en body antes de cualquier sesión')
  await p.context().close()
}

// 2) Dictado en el punto del cursor, provisional bajo el campo, sin robar el foco, deshacer
{
  const p = await open()
  await p.evaluate(() => { const t = document.querySelector('#f-obs'); t.value = 'Uno dos.'; t.dispatchEvent(new Event('input', { bubbles: true })); t.focus(); t.setSelectionRange(3, 3) })
  await p.click('[data-for="f-obs"] button')
  ok(await p.getAttribute('[data-for="f-obs"] button', 'aria-pressed') === 'true', 'dictado: disparador con aria-pressed=true')
  ok(await waitSt(p, CAP), 'dictado: pasa a capturar tras el permiso')
  let sawProv = false
  for (let i = 0; i < 40 && !sawProv; i++) { sawProv = await p.evaluate(() => (document.querySelector('[data-speech-note][data-for="f-obs"] [data-role="prov"]')?.textContent || '').length > 12); await p.waitForTimeout(100) }
  ok(sawProv, 'dictado: el provisional se muestra bajo el campo')
  ok(await p.evaluate(() => document.querySelector('#f-obs').value === 'Uno dos.'), 'dictado: el provisional no toca el valor del campo')
  await p.waitForFunction(() => __sp.speech.state.transcript?.segments.length >= 1, null, { timeout: 9000 })
  const v = await p.evaluate(() => document.querySelector('#f-obs').value)
  ok(v.startsWith('Uno Refiere') && v.endsWith(' dos.'), `dictado: el confirmado entra en el cursor: «${v}»`)
  ok(await p.evaluate(() => document.activeElement.dataset.k === 'trig-f-obs'), 'dictado: el foco sigue en el disparador (no se roba)')
  await p.click('[data-for="f-obs"] button') // conmutar = finalizar
  ok(await waitSt(p, ['processing', 'completed']), 'dictado: pulsar de nuevo finaliza (procesando)')
  ok(await waitSt(p, ['idle'], 9000), 'dictado: con todo insertado, la sesión se cierra sola')
  ok(await p.getAttribute('[data-for="f-obs"] button', 'aria-pressed') === 'false', 'dictado: aria-pressed vuelve a false')
  const a = await ann(p)
  ok(a.some((x) => x.includes('Dictado terminado. Texto añadido a Observaciones.')), 'dictado: anuncio de fin')
  ok(!a.some((x) => /refiere dolor|refiere/i.test(x)), 'dictado: el texto dictado no se anuncia palabra por palabra')
  ok(await p.isVisible('[data-speech-note][data-for="f-obs"] [data-note-act="undo"]'), 'dictado: aparece «Deshacer dictado»')
  await p.click('[data-speech-note][data-for="f-obs"] [data-note-act="undo"]')
  ok(await p.evaluate(() => document.querySelector('#f-obs').value === 'Uno dos.'), 'dictado: deshacer devuelve el valor original')
  await p.context().close()
}

// 3) Conversación: la sesión sobrevive a stepper y tabs; volver no crea otra; un solo anuncio de inicio
{
  const p = await open({ perm: 'granted' })
  await p.click('[data-place="step1"] button')
  ok(await waitSt(p, ['ready']), 'conversación: preparar → ready (micrófono apagado)')
  ok(await p.evaluate(() => __sp.sim.track === null), 'conversación: en ready el micrófono no está abierto')
  ok(await active(p) === 'sp-panel-title', 'panel: al abrirse, el foco va a su título')
  await p.click('[data-act="begin"]')
  ok(await waitSt(p, CAP), 'conversación: empieza a capturar')
  const sid = await p.evaluate(() => __sp.speech.state.sessionId)
  await p.keyboard.press('Escape')
  ok(await p.isHidden('#sp-panel'), 'panel: Esc lo cierra')
  ok(await active(p) === 'trig-step1', 'panel: el foco vuelve al disparador que lo abrió')
  ok(await p.isVisible('#head-pill .sp-pill'), 'pill colocada visible en la cabecera')
  await p.click('#st-next')
  ok(await p.locator('[data-place="step1"]').count() === 0, 'stepper: el disparador que inició la sesión se desmontó')
  const d0 = await p.evaluate(() => __sp.speech.state.duration)
  await p.click('#tab-exploracion'); await p.waitForTimeout(800); await p.click('#tab-plan'); await p.waitForTimeout(800)
  await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(3500)
  const r = await p.evaluate(() => ({ s: __sp.speech.state.status, d: __sp.speech.state.duration, sid: __sp.speech.state.sessionId, n: __sp.speech.state.sessions, segs: __sp.speech.state.transcript.segments.length }))
  ok(['listening', 'speech', 'transcribing'].includes(r.s) && r.d > d0 + 3000, `tabs/stepper: la sesión sigue capturando (${r.s}, +${r.d - d0} ms)`)
  ok(r.sid === sid && r.n === 1, 'tabs/stepper: misma sesión, una sola')
  ok(r.segs >= 1, `tabs/stepper: la transcripción sigue creciendo (${r.segs})`)
  ok(await p.isVisible('#head-pill .sp-pill'), 'tabs/stepper: el indicador permanece')
  await p.click('#st-prev')
  const txt = await p.textContent('[data-place="step1"] button')
  ok(/Ver grabación/.test(txt), `volver al paso 1: el disparador dice «Ver grabación» («${txt.trim()}»)`)
  await p.click('[data-place="step1"] button')
  ok(await p.isVisible('#sp-panel') && await p.evaluate(() => __sp.speech.state.sessions) === 1, 'volver al paso 1: abre el panel, no crea otra sesión')
  await p.keyboard.press('Escape')
  const a = await ann(p)
  ok(a.filter((x) => x.includes('Grabando conversación')).length === 1, 'anuncios: inicio anunciado una vez')
  ok(!a.some((x) => /desde hace|buenos dias|que le trae/i.test(x)), 'anuncios: los parciales y el texto no se anuncian')
  ok(a.length <= 3, `anuncios: pocos durante la captura (${a.length})`)
  const live = await p.evaluate(() => document.querySelectorAll('[aria-live]:not([aria-live="off"]),[role="status"],[role="alert"],[role="log"]').length)
  ok(live === 2, `un solo conjunto de regiones vivas durante la sesión (${live})`)

  // 4) Pill flotante de respaldo al desplazar
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(300)
  ok(await p.isVisible('#sp-float .sp-pill'), 'desplazado: la pill de cabecera sale del visor → aparece la flotante')
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300)
  ok(await p.isHidden('#sp-float'), 'arriba: la flotante se oculta (una sola pill visible)')

  // 5) Atajo Mayús+F8: ir a la pill y volver
  await p.focus('#f-obs')
  await p.keyboard.press('Shift+F8')
  ok(await p.evaluate(() => document.activeElement.dataset.role === 'main' && !!document.activeElement.closest('#head-pill')), 'Mayús+F8: foco a la pill')
  await p.keyboard.press('Shift+F8')
  ok(await active(p) === 'f-obs', 'Mayús+F8 de nuevo: el foco vuelve')
  // F8 solo no se intercepta (es de GToaster)
  const f8 = await p.evaluate(() => { const e = new KeyboardEvent('keydown', { key: 'F8', bubbles: true, cancelable: true }); document.dispatchEvent(e); return e.defaultPrevented })
  ok(!f8, 'F8 sin Mayús no lo intercepta la captura de voz')

  // 6) Pausa y reanudación: el micrófono se libera
  await p.click('#head-pill [data-role="toggle"]')
  ok(await waitSt(p, ['paused']), 'pausa: estado paused')
  const pz = await p.evaluate(() => ({ cap: __sp.speech.state.capture, track: __sp.sim.track, d: __sp.speech.state.duration, label: document.querySelector('#head-pill [data-role="toggle"]').getAttribute('aria-label'), text: document.querySelector('#head-pill [data-role="text"]').textContent }))
  ok(pz.cap === 'off' && pz.track === null, 'pausa: captura apagada y pista del micrófono detenida')
  ok(pz.label === 'Reanudar' && pz.text === 'En pausa', 'pausa: texto «En pausa» y botón «Reanudar»')
  await p.waitForTimeout(1000)
  ok(await p.evaluate((d) => __sp.speech.state.duration === d, pz.d), 'pausa: la duración no avanza')
  await p.click('#head-pill [data-role="toggle"]')
  ok(await waitSt(p, CAP), 'reanudar: vuelve a capturar')
  await p.waitForTimeout(1300)
  const a2 = await ann(p)
  ok(a2.some((x) => x.includes('En pausa. El micrófono no está capturando.')) && a2.some((x) => x.includes('Grabando de nuevo.')), 'anuncios de pausa y reanudación')

  // 7) Diálogo modal: traslado del anfitrión; flotante operable; Esc del panel no cierra el diálogo
  await p.click('#b-dialog')
  await p.waitForTimeout(200)
  const m = await p.evaluate(() => { const h = document.getElementById('sp-host'); return { inDlg: h.parentElement.id, open: h.matches(':popover-open'), float: !document.getElementById('sp-float').hidden } })
  ok(m.inDlg === 'dlg' && m.open, 'modal: el anfitrión se traslada al diálogo y sigue abierto')
  ok(m.float, 'modal: la pill de cabecera queda inerte → se muestra la flotante')
  const hit = await p.evaluate(() => { const t = document.querySelector('#sp-float [data-role="toggle"]'); const r = t.getBoundingClientRect(); const e = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return t.contains(e) })
  ok(hit, 'modal: el botón de la flotante es alcanzable (no inerte ni tapado)')
  await p.click('#sp-float [data-role="toggle"]')
  ok(await waitSt(p, ['paused']), 'modal: pausar desde la flotante funciona')
  await p.click('#dlg-next')
  await p.click('#sp-float [data-role="toggle"]')
  ok(await waitSt(p, CAP), 'modal: el diálogo cambia de paso y la sesión sigue (reanuda)')
  await p.click('#sp-float [data-role="main"]')
  ok(await p.isVisible('#sp-panel'), 'modal: el panel se abre dentro del diálogo')
  await p.keyboard.press('Escape')
  ok(await p.isHidden('#sp-panel') && await p.evaluate(() => document.getElementById('dlg').open), 'modal: Esc cierra el panel y no el diálogo')
  await p.click('#dlg-ok')
  await p.waitForTimeout(200)
  ok(await p.evaluate(() => document.getElementById('sp-host').parentElement === document.body), 'modal: al cerrar, el anfitrión vuelve a body')

  // 8) Finalizar con procesamiento pendiente → revisión: capas, hablantes, roles, inserción y deshacer
  await p.click('#head-pill [data-role="main"]')
  await p.waitForFunction(() => __sp.speech.state.voice === 'speech', null, { timeout: 6000 }).catch(() => {})
  await p.waitForTimeout(600)
  await p.click('[data-act="finish"]')
  ok(await waitSt(p, ['processing'], 3000), 'finalizar: pasa a procesando')
  const proc = await p.evaluate(() => ({ cap: __sp.speech.state.capture, track: __sp.sim.track, pb: !!document.querySelector('#sp-panel [role="progressbar"]'), btns: [...document.querySelectorAll('#sp-panel [data-role="controls"] button')].length, pend: __sp.speech.state.pending }))
  ok(proc.cap === 'off' && proc.track === null, 'procesando: micrófono apagado')
  ok(proc.pb && proc.btns === 0, `procesando: barra de progreso y sin acciones de cierre (${proc.btns})`)
  ok(await waitSt(p, ['completed'], 9000), 'finalizar: transcripción completa')
  await p.waitForTimeout(1500)
  const a3 = await ann(p)
  ok(a3.some((x) => x.includes('Procesando el audio pendiente')) && a3.some((x) => x.includes('Transcripción lista')), 'anuncios de procesamiento y fin')
  ok(await p.evaluate(() => /Audio temporal eliminado/.test(document.querySelector('#sp-panel [data-role="privacy"]').textContent)), 'fin: el panel confirma la eliminación del audio (lo dijo el adaptador)')
  const first = await p.evaluate(() => __sp.speech.state.transcript.segments[0])
  await p.click(`[data-k="ed-${first.id}"]`)
  ok(await active(p) === `ed-t-${first.id}`, 'editar: el foco va al texto')
  await p.fill(`[data-k="ed-t-${first.id}"]`, 'CORREGIDO por la profesional.')
  await p.selectOption(`[data-k="ed-s-${first.id}"]`, 'B')
  await p.click(`[data-k="sv-${first.id}"]`)
  const seg = await p.evaluate((id) => __sp.speech.state.transcript.segments.find((s) => s.id === id), first.id)
  ok(seg.literal === first.literal && seg.corrected === 'CORREGIDO por la profesional.', 'capas: el literal no cambia; la corrección va aparte')
  ok(seg.engineSpeaker === 'A' && seg.speaker === 'B', 'hablantes: el cambio es una reasignación; el hablante del motor se conserva')
  ok(await active(p) === `ed-${first.id}`, 'guardar: el foco vuelve a «Editar»')
  await p.selectOption('[data-k="role-A"]', 'Profesional'); await p.selectOption('[data-k="role-B"]', 'Paciente')
  ok(await p.evaluate(() => /Hablante B · Paciente/.test(document.querySelector('#sp-panel [data-role="tx"]').textContent)), 'roles: se muestran junto al hablante')
  await p.check(`[data-k="pk-${first.id}"]`)
  await p.selectOption('[data-k="r-target"]', 'plan')
  await p.click('[data-k="r-insert"]')
  ok(await p.evaluate(() => __sp.form.plan === 'Paciente: CORREGIDO por la profesional.'), 'insertar: la selección corregida (con rol) va al campo Plan aunque esté desmontado')
  await p.click('[data-k="r-undo"]')
  ok(await p.evaluate(() => __sp.form.plan === ''), 'deshacer inserción')
  await p.click('[data-act="close-session"]')
  ok(await waitSt(p, ['idle']), 'cerrar sesión → idle')
  const done = await p.evaluate(() => __sp.completed[0])
  ok(done && done.segments[0].literal === first.literal && done.segments[0].corrected, 'onComplete recibe el transcript con literal y corrección')
  ok(await p.isHidden('#head-pill .sp-pill'), 'sin sesión: la pill desaparece')
  await p.context().close()
}

// 9) Dictado con el campo desmontado: no se pierde ni se inserta a ciegas
{
  const p = await open({ perm: 'granted' })
  await p.click('#st-next'); await p.click('#tab-exploracion')
  await p.click('[data-for="f-hallazgos"] button')
  ok(await waitSt(p, CAP), 'dictado en tab: empieza')
  await p.click('#tab-plan')
  await p.waitForFunction(() => __sp.speech.state.transcript?.segments.length >= 1, null, { timeout: 9000 })
  ok(CAP.includes(await st(p)) || await st(p) === 'transcribing', 'dictado en tab: sigue tras desmontar el campo')
  await p.click('#tab-exploracion')
  ok(await p.isVisible('[data-speech-note][data-for="f-hallazgos"] [data-note-act="insert"]'), 'dictado en tab: al volver, «N fragmentos dictados sin insertar · Insertar»')
  await p.click('#head-pill [data-role="finish"]')
  ok(await waitSt(p, ['completed'], 9000), 'dictado en tab: completado sin cerrarse solo (hay fragmentos sin insertar)')
  await p.click('[data-speech-note][data-for="f-hallazgos"] [data-note-act="insert"]')
  ok(await p.evaluate(() => document.querySelector('#f-hallazgos').value.length > 10), 'dictado en tab: «Insertar» los añade al campo')
  ok(await waitSt(p, ['idle'], 4000), 'dictado en tab: después se cierra')
  await p.context().close()
}

// 10) Errores: estado, texto + icono, anuncio enérgico, qué pasó con la grabación y el audio
{
  let p = await open({ perm: 'denied' })
  await p.click('[data-for="f-obs"] button')
  ok(await waitSt(p, ['denied']), 'permiso denegado → denied')
  await p.waitForTimeout(200)
  let a = await ann(p)
  ok(a.some((x) => x.startsWith('assertive|') && x.includes('No se grabó nada')), 'denied: anuncio enérgico con «No se grabó nada»')
  ok(await p.textContent('#head-pill [data-role="text"]') === 'Permiso denegado', 'denied: texto en la pill')
  ok(await p.evaluate(() => __sp.sim.track === null), 'denied: el micrófono no se abrió')
  await p.context().close()

  p = await open({ perm: 'granted' }); await p.check('#b-nodev')
  await p.click('[data-for="f-obs"] button')
  ok(await waitSt(p, ['unavailable']), 'sin micrófono → unavailable')
  await p.context().close()

  p = await open({ perm: 'granted' })
  await p.click('[data-for="f-obs"] button'); await waitSt(p, CAP); await p.waitForTimeout(1500)
  await p.click('[data-inj="disconnect"]')
  ok(await waitSt(p, ['unavailable']), 'desconexión en sesión → unavailable')
  await p.waitForTimeout(200); a = await ann(p)
  ok(a.some((x) => x.startsWith('assertive|') && x.includes('se desconectó') && x.includes('La grabación se detuvo.')), 'desconexión: dice que la grabación se detuvo')
  ok(await p.isVisible('#head-pill [data-role="toggle"]') && await p.getAttribute('#head-pill [data-role="toggle"]', 'aria-label') === 'Reanudar', 'desconexión: se puede reanudar')
  ok(await p.waitForFunction(() => !__sp.speech.state.transcript.partial && __sp.speech.state.pending === 0, null, { timeout: 5000 }).then(() => true, () => false), 'desconexión: el provisional en curso se cierra y se procesa (no queda colgado)')
  await p.context().close()

  // Servicio caído con almacenamiento temporal: la grabación continúa
  p = await open({ perm: 'granted' })
  await p.click('[data-place="head"] button'); await waitSt(p, ['ready']); await p.click('[data-act="begin"]'); await waitSt(p, CAP)
  await p.click('[data-inj="down"]')
  ok(await waitSt(p, ['reconnecting']), 'servicio caído → reconnecting')
  ok(await p.evaluate(() => __sp.speech.state.capture === 'live') && await p.textContent('#head-pill [data-role="text"]') === 'Reconectando · grabando', 'con almacenamiento temporal: la captura continúa y la pill lo dice')
  await p.click('[data-inj="up"]')
  ok(await waitSt(p, CAP, 4000), 'servicio restablecido → vuelve a capturar')
  await p.waitForTimeout(1200); a = await ann(p)
  ok(a.some((x) => x.includes('La grabación continúa; el audio se guarda temporalmente')) && a.some((x) => x.includes('Servicio de transcripción restablecido')), 'anuncios de reconexión y restablecimiento')
  // Fallo de un fragmento: no detiene
  await p.click('[data-inj="fail"]')
  await p.waitForFunction(() => __sp.speech.state.transcript.segments.some((s) => s.failed), null, { timeout: 12000 })
  ok(CAP.includes(await st(p)), 'fallo de un fragmento: la grabación continúa')
  await p.click('#head-pill [data-role="main"]')
  ok(await p.isVisible('#sp-panel [data-act="retry-seg"]'), 'fallo de un fragmento: el panel ofrece reintentarlo (audio guardado)')
  await p.keyboard.press('Escape')
  await p.context().close()

  // Servicio caído sin almacenamiento temporal: la captura se retiene (micrófono apagado) y acaba en error
  p = await open({ perm: 'granted' }); await p.uncheck('#b-buf')
  await p.click('[data-place="head"] button'); await waitSt(p, ['ready']); await p.click('[data-act="begin"]'); await waitSt(p, CAP)
  await p.click('[data-inj="down"]')
  ok(await waitSt(p, ['reconnecting']), 'sin almacenamiento: reconnecting')
  ok(await p.evaluate(() => __sp.speech.state.capture === 'held' && __sp.sim.track === null), 'sin almacenamiento: micrófono apagado mientras reconecta')
  ok(await waitSt(p, ['error'], 7000), 'sin almacenamiento: tras 3 intentos → error')
  await p.waitForTimeout(200); a = await ann(p)
  ok(a.some((x) => x.startsWith('assertive|') && x.includes('Servicio de transcripción no disponible')), 'servicio no disponible: anuncio enérgico')
  await p.context().close()

  // Captura congelada: nunca sigue diciendo «Grabando»
  p = await open({ perm: 'granted' })
  await p.click('[data-for="f-obs"] button'); await waitSt(p, CAP); await p.waitForTimeout(800)
  await p.click('[data-inj="freeze"]')
  ok(await waitSt(p, ['error'], 2500), 'sin fotogramas → error «interrumpida» en menos de 2,5 s')
  ok(await p.evaluate(() => __sp.speech.state.error.kind === 'interrupted' && !/Grabando|Voz|Transcribiendo/.test(document.querySelector('#head-pill [data-role="text"]').textContent)), 'interrumpida: la pill ya no dice «Grabando»')
  await p.context().close()

  // Motor externo no permitido: no se abre el micrófono
  p = await open({ perm: 'granted' }); await p.selectOption('#b-loc', 'remote')
  await p.click('[data-for="f-obs"] button')
  ok(await waitSt(p, ['error']), 'motor externo sin permiso de la app → error')
  ok(await p.evaluate(() => __sp.speech.state.error.kind === 'remote-not-allowed' && __sp.sim.track === null && __sp.dev.some((d) => /remote/.test(d))), 'motor externo: micrófono sin abrir y aviso de desarrollo')
  await p.context().close()

  // Sin espacio
  p = await open({ perm: 'granted' })
  await p.click('[data-for="f-obs"] button'); await waitSt(p, CAP); await p.waitForTimeout(500)
  await p.click('[data-inj="full"]')
  ok(await waitSt(p, ['error']) && await p.evaluate(() => __sp.speech.state.error.kind === 'storage-full' && __sp.speech.state.capture === 'off'), 'sin espacio → error, captura detenida')
  await p.context().close()

  // Transición ilegal: se rechaza
  p = await open()
  ok(await p.evaluate(() => { __sp.speech.pause(); return __sp.speech.state.status === 'idle' }), 'pausar sin sesión no hace nada')
  await p.context().close()
}

// 11) Movimiento reducido
{
  const p = await open({ perm: 'granted', rm: true })
  await p.click('[data-place="head"] button'); await waitSt(p, ['ready']); await p.click('[data-act="begin"]'); await waitSt(p, CAP)
  await p.waitForTimeout(800)
  const r = await p.evaluate(() => ({ rm: document.querySelector('#sp-panel [data-role="wave"]').hasAttribute('data-rm'), shown: [...document.querySelectorAll('#sp-panel [data-role="wave"] i')].filter((i) => i.style.display !== 'none').length, spin: getComputedStyle(document.querySelector('#gallery .sp-spin .g-icon')).animationName }))
  ok(r.rm && r.shown === 5, `movimiento reducido: medidor discreto de 5 segmentos (${r.shown})`)
  ok(r.spin === 'none', 'movimiento reducido: el indicador de procesamiento no gira')
  await p.click('[data-act="wave"]')
  ok(await p.evaluate(() => document.querySelector('#sp-panel [data-role="wave"]').hidden && document.querySelector('#head-pill [data-role="meter"]').hidden), '2.2.2: «Ocultar actividad» oculta la onda y el medidor (el texto de estado queda)')
  await p.context().close()
}

// 12) 320 px: sin desborde, hoja inferior, pill dentro del visor
{
  const p = await open({ perm: 'granted', w: 320, h: 640 })
  await p.click('[data-place="head"] button'); await waitSt(p, ['ready'])
  const s1 = await p.evaluate(() => ({ sheet: document.getElementById('sp-sheet').open, r: document.querySelector('#sp-sheet .sp-panel').getBoundingClientRect().toJSON() }))
  ok(s1.sheet && s1.r.left >= 0 && s1.r.right <= 320 && s1.r.bottom <= 641, `320: el panel es una hoja inferior dentro del visor (${Math.round(s1.r.left)}–${Math.round(s1.r.right)})`)
  ok(await active(p) === 'sp-panel-title', '320: foco al título de la hoja')
  await p.click('[data-act="begin"]'); await waitSt(p, CAP); await p.waitForTimeout(2500)
  const ov = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, pw: document.querySelector('#sp-sheet .sp-panel').scrollWidth, cw: document.querySelector('#sp-sheet .sp-panel').clientWidth }))
  ok(ov.sw <= 320 && ov.pw <= ov.cw + 1, `320: sin desborde horizontal (página ${ov.sw}, hoja ${ov.pw}/${ov.cw})`)
  await p.keyboard.press('Escape')
  ok(await p.evaluate(() => !document.getElementById('sp-sheet').open), '320: Esc cierra la hoja')
  const pr = await p.evaluate(() => document.querySelector('#head-pill .sp-pill').getBoundingClientRect().toJSON())
  ok(pr.left >= 0 && pr.right <= 320, `320: la pill de cabecera cabe (${Math.round(pr.left)}–${Math.round(pr.right)})`)
  await p.evaluate(() => window.scrollTo(0, 2000)); await p.waitForTimeout(300)
  const fr = await p.evaluate(() => ({ edge: document.getElementById('sp-float').dataset.edge, r: document.querySelector('#sp-float .sp-pill').getBoundingClientRect().toJSON(), sw: document.documentElement.scrollWidth }))
  ok(fr.edge === 'bottom' && fr.r.right <= 320 && fr.r.left >= 0 && fr.r.bottom <= 640, '320: flotante abajo, dentro del visor')
  ok(fr.sw <= 320, '320: sin desborde con la flotante')
  await p.context().close()
}

// 13) Micrófono real (dispositivo falso de Chromium): nivel real y pista viva; pausa la detiene
{
  const p = await open({}, bReal)
  await p.check('input[name=src][value=real]')
  await p.evaluate(() => { window.__max = 0; __sp.speech.onLevel((v, live) => { if (live) window.__max = Math.max(window.__max, v) }) })
  await p.click('[data-for="f-obs"] button')
  ok(await waitSt(p, CAP, 6000), 'micrófono real: captura')
  await p.waitForTimeout(2500)
  const r = await p.evaluate(() => ({ max: window.__max, track: __sp.sim.track?.readyState, perm: __sp.speech.state.permission }))
  ok(r.max > 0.05 && r.track === 'live', `micrófono real: nivel medido ${r.max.toFixed(2)} con pista viva`)
  await p.click('#head-pill [data-role="toggle"]')
  ok(await waitSt(p, ['paused']) && await p.evaluate(() => __sp.sim.track === null), 'micrófono real: pausa detiene la pista')
  await p.context().close()
}

// 14) Objetivos táctiles ≥ 24px en pill y panel
{
  const p = await open({ perm: 'granted' })
  await p.click('[data-place="head"] button'); await waitSt(p, ['ready']); await p.click('[data-act="begin"]'); await waitSt(p, CAP)
  await p.waitForTimeout(3500)
  const small = await p.evaluate(() => [...document.querySelectorAll('#head-pill button, #sp-panel button, #sp-panel select, #sp-panel input, [data-speech-trigger] button')].filter((e) => e.offsetParent !== null).map((e) => { const r = e.getBoundingClientRect(); return [e.dataset.k || e.dataset.role || e.type, Math.round(r.width), Math.round(r.height)] }).filter(([, w, h]) => w < 24 && !(w >= 16)).concat([...document.querySelectorAll('#head-pill button, #sp-panel button, [data-speech-trigger] button')].filter((e) => e.offsetParent !== null).map((e) => { const r = e.getBoundingClientRect(); return [e.dataset.k || e.dataset.role, Math.round(r.width), Math.round(r.height)] }).filter(([, w, h]) => w < 24 || h < 24)))
  ok(small.length === 0, `objetivos ≥ 24px: ${JSON.stringify(small)}`)
  await p.context().close()
}

ok(errs.length === 0, `consola limpia: ${errs.slice(0, 5).join(' | ')}`)
await b.close(); await bReal.close(); srv.kill()
console.log(`\n${pass} correctas, ${fail} fallidas`)
if (fails.length) { console.log('Fallos:\n- ' + fails.join('\n- ')); process.exitCode = 1 }
