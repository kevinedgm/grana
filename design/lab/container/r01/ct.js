// Prototipo de GContainer (kiwi r01): monta la página del concepto pedido y el asa de C. Solo laboratorio.
// ?c=base|A|B|C  &w=sm|md|lg|xl|2xl|full  &h=start  &g=none|sm|md|lg  &side=wide|rail|none  &dir=rtl  &guides=1
(() => {
  const q = new URLSearchParams(location.search)
  const C = ['base', 'A', 'B', 'C'].includes(q.get('c')) ? q.get('c') : 'B'
  const W = q.get('w') || ({ base: 'md', A: 'xl', B: 'md', C: 'md' })[C]
  const H = q.get('h') === 'start' ? 'start' : 'center'
  const G = q.get('g') || 'auto'
  const root = document.documentElement
  root.dataset.side = q.get('side') || 'wide'
  if (q.get('dir') === 'rtl') root.dir = 'rtl'
  if (q.get('guides') === '1') root.dataset.guides = '1'
  const icon = (n) => window.lucide(n)

  // ---------- Barra del laboratorio ----------
  const link = (k, v, label, cur) => { const u = new URLSearchParams(q); u.set(k, v); return `<a href="?${u}"${cur ? ' aria-current="true"' : ''}>${label}</a>` }
  document.getElementById('lab-concepts').innerHTML = ['base', 'A', 'B', 'C'].map((c) => link('c', c, { base: 'Base', A: 'A · Medida', B: 'B · Sangrado', C: 'C · A la mano' }[c], c === C)).join(' ')
  document.getElementById('lab-widths').innerHTML = ['sm', 'md', 'lg', 'xl', 'full'].map((w) => link('w', w, w, w === W)).join(' ')
  document.getElementById('lab-side').innerHTML = ['wide', 'rail', 'none'].map((s) => link('side', s, { wide: 'barra', rail: 'riel', none: 'sin barra' }[s], s === root.dataset.side)).join(' ') + ' ' + link('h', H === 'start' ? 'center' : 'start', H === 'start' ? 'centrar' : 'al inicio', false) + ' ' + link('guides', q.get('guides') === '1' ? '0' : '1', 'guías', q.get('guides') === '1')
  document.querySelectorAll('[data-icon]').forEach((el) => el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon)))

  // ---------- Piezas de la página (la aplicación) ----------
  const cls = (w, extra = '') => `ct ct--w-${w} ct--g-${G}${H === 'start' ? ' ct--h-start' : ''}${extra}`
  const header = (bleed) => `
    <div class="lab-ph${bleed ? ' ct-bleed' : ''}" id="ph" ${bleed ? 'data-g-zone="brand"' : ''}>
      <p class="lab-ph__eyebrow">Configuración · Laboratorio central</p>
      <h1 id="page-title" tabindex="-1" dir="auto">Políticas de validación</h1>
      <p class="lab-muted">Reglas que deciden cuándo un resultado puede salir sin revisión manual y quién firma cuando no.</p>
      <div class="lab-ph__actions"><button type="button" class="g-btn g-btn--variant-solid g-btn--size-md g-btn--color-brand"><span class="g-btn__label">Publicar cambios</span></button><button type="button" class="g-btn g-btn--variant-outline g-btn--size-md g-btn--color-neutral"><span class="g-btn__label">Ver historial</span></button></div>
    </div>
    <nav class="lab-base${bleed ? ' ct-bleed' : ''}" id="base" aria-label="Secciones de la página"><a href="#s-prose" aria-current="true">Reglas</a><a href="#s-form">Firmantes</a><a href="#s-table">Analitos</a><a href="#s-band">Auditoría</a></nav>`
  const prose = `
    <section class="lab-sec" id="s-prose" aria-labelledby="h-prose">
      <h2 id="h-prose">Reglas de liberación automática</h2>
      <p class="lab-p" id="p1">Un resultado sale sin revisión cuando todos sus analitos están dentro del intervalo de referencia, el control de calidad del lote pasó en las últimas ocho horas y no hay una nota clínica que pida revisión. Si cualquiera de las tres condiciones falla, el resultado espera a un firmante con permiso sobre el área.</p>
      <p class="lab-p">Los valores críticos nunca salen solos: se llaman al médico solicitante y la llamada queda registrada con hora, persona y medio. La política se revisa cada trimestre; la versión vigente está en https://intranet.laboratorio-central.example/politicas/validacion/automatica/version-2026-10-trimestre-cuatro-borrador-final.pdf y la anterior en el archivo.</p>
      <ul class="lab-p"><li>Intervalos por edad y sexo, del catálogo de analitos.</li><li>Control de calidad del lote vigente.</li><li>Sin notas clínicas pendientes.</li></ul>
    </section>`
  const form = `
    <section class="lab-sec" id="s-form" aria-labelledby="h-form">
      <h2 id="h-form">Firmante de guardia</h2>
      <div class="${cls('sm', '').replace(`ct--g-${G}`, 'ct--g-auto').replace(' ct--h-start', '')} ct--h-start" id="nested">
        <div class="ct__body" id="nested-body"><div class="lab-fields">
          <div class="lab-field"><label for="f1">Nombre del firmante</label><input id="f1" autocomplete="off" value="Dra. Rebeca Solís Montaño"></div>
          <div class="lab-field"><label for="f2">Cédula profesional</label><input id="f2" autocomplete="off" value="12 345 678"></div>
        </div></div>
      </div>
    </section>`
  const cols = ['Analito', 'Clave', 'Unidad', 'Intervalo (adulto)', 'Crítico bajo', 'Crítico alto', 'Método', 'Equipo', 'Área', 'Revisión', 'Firma']
  const rows = [['Hemoglobina', 'HGB', 'g/dL', '12,0 – 17,5', '7,0', '20,0', 'Fotometría', 'XN-1000', 'Hematología', 'Trimestral', 'Auto'], ['Leucocitos', 'WBC', '10³/µL', '4,5 – 11,0', '2,0', '30,0', 'Impedancia', 'XN-1000', 'Hematología', 'Trimestral', 'Auto'], ['Potasio', 'K', 'mmol/L', '3,5 – 5,1', '2,8', '6,2', 'ISE indirecto', 'c702', 'Química', 'Mensual', 'Manual'], ['Glucosa', 'GLU', 'mg/dL', '70 – 99', '40', '450', 'Hexoquinasa', 'c702', 'Química', 'Mensual', 'Auto']]
  const table = (bleed) => `
    <section class="lab-sec" id="s-table" aria-labelledby="h-table">
      <h2 id="h-table">Analitos con liberación automática</h2>
      <div class="lab-scroll${bleed ? ' ct-bleed' : ''}" id="scroller" role="region" aria-labelledby="h-table" tabindex="0"><table class="lab-table" id="table"><thead><tr>${cols.map((c) => `<th scope="col">${c}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, i) => i ? `<td>${c}</td>` : `<th scope="row">${c}</th>`).join('')}</tr>`).join('')}</tbody></table></div>
    </section>`
  const band = (bleed) => `
    <section class="lab-band${bleed ? ' ct-bleed' : ''}" id="s-band" data-g-zone="brand" aria-labelledby="h-band">
      <h2 id="h-band">Auditoría externa · noviembre</h2>
      <p class="lab-p" id="band-p">La auditoría revisa las políticas publicadas el último día del mes. Lo que no esté publicado entonces se audita con la versión anterior.</p>
      <button type="button" class="g-btn g-btn--variant-solid g-btn--size-md g-btn--color-brand"><span class="g-btn__label">Preparar paquete</span></button>
    </section>`
  const media = (bleed) => `<div class="lab-media${bleed ? ' ct-bleed-raw' : ''}" id="media" role="img" aria-label="Diagrama del flujo de validación (marcador)" data-icon="image"></div>`
  const host = `
    <div class="g-surface g-surface--level-outlined g-surface--padding-md g-surface--density-default lab-host-wrap" id="host">
      <div class="${cls('md').replace(`ct--g-${G}`, 'ct--g-auto')}" id="in-host"><div class="ct__body" id="in-host-body"><p class="lab-p" style="margin:0">Contenedor dentro de una superficie con relleno propio: no suma margen; la superficie ya deja el aire.</p></div></div>
    </div>`
  const rule = (bleed) => `<hr class="lab-rule${bleed ? ' ct-bleed-raw' : ''}" id="rule">`
  const more = Array.from({ length: 5 }, (_, i) => `<p class="lab-p lab-muted">Párrafo de relleno ${i + 1} para que la página sea larga y el zócalo tenga por dónde pegarse: el pegado debe durar toda la página, no solo el primer tramo. La medida de la columna y el margen no cambian al desplazar.</p>`).join('')
  const dock = '<div class="lab-dock" id="dock" aria-hidden="true"></div>'

  const col = document.getElementById('col')
  if (C === 'base') {
    // Base: la página es de la aplicación; el ancho completo por composición (emparedado)
    col.innerHTML = `<main id="main" class="app-main" tabindex="-1">
      <section class="${cls(W)}" id="ct" aria-label="Contenido"><div class="ct__body" id="body">${header(false)}${prose}${form}${table(false)}</div></section>
      <div class="${cls('full').replace(`ct--g-${G}`, 'ct--g-none')}" id="band-wrap" data-g-zone="brand"><div class="ct__body"><div class="${cls(W).replace(`ct--g-${G}`, 'ct--g-md')}" id="band-ct"><div class="ct__body" id="band-body">${band(false).replace('data-g-zone="brand"', '')}</div></div></div></div>
      <div class="${cls(W)}" id="ct2"><div class="ct__body">${media(false)}${host}${rule(false)}${more}${dock}</div></div>
    </main>`
  } else {
    const extra = C === 'A' ? ' ct--prose' : C === 'C' ? ' ct--adjust' : ''
    const bleed = C === 'B'
    col.innerHTML = `<main id="main" class="${cls(W, extra)}" tabindex="-1"><div class="ct__body" id="body">${header(bleed)}${prose}${form}${table(bleed)}${band(bleed)}${media(bleed)}${host}${rule(bleed)}${more}${dock}${C === 'C' ? grips() : ''}</div></main>`
  }
  col.querySelectorAll('[data-icon]').forEach((el) => el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon)))

  // ---------- C · Medida a la mano ----------
  function grips () {
    return `<div class="ct__grips" id="grips">
      <span class="ct__grip ct__grip--start" aria-hidden="true" data-grip="start">${icon('grip-vertical')}</span>
      <span class="ct__grip ct__grip--end" id="grip" role="separator" tabindex="0" aria-orientation="vertical" aria-label="Ancho de lectura" aria-controls="body" data-grip="end">${icon('grip-vertical')}</span>
      <span class="ct__count" id="count" hidden></span>
    </div>`
  }
  const MIN = 45, MAX = 90, DEF = 66, STEP = 2
  const main = document.getElementById('main')
  const body = document.getElementById('body')
  const chPx = () => { const s = document.createElement('span'); s.textContent = '0000000000'; s.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap'; body.appendChild(s); const w = s.getBoundingClientRect().width / 10; s.remove(); return w }
  const state = { ready: false, concept: C, measure: DEF, dragging: false, applied: 0 }
  window.__ct = state

  if (C === 'C') {
    const grip = document.getElementById('grip')
    const count = document.getElementById('count')
    let guides = []
    const rtl = () => getComputedStyle(main).direction === 'rtl'
    const gutter = () => parseFloat(getComputedStyle(body).getPropertyValue('--_ct-g'))
    const effMax = () => Math.max(MIN, Math.min(MAX, Math.floor((main.clientWidth - 2 * gutter()) / chPx())))
    const sync = () => {
      const max = effMax()
      grip.setAttribute('aria-valuemin', MIN); grip.setAttribute('aria-valuemax', max)
      grip.setAttribute('aria-valuenow', state.measure); grip.setAttribute('aria-valuetext', `${state.measure} caracteres por línea`)
      // Sin holgura: la columna no puede crecer por encima del mínimo o no hay margen para el asa
      const start = parseFloat(getComputedStyle(body).getPropertyValue('--g-container-inset-start'))
      const need = Math.max(24, matchMedia('(pointer: coarse)').matches ? 44 : 24) + 2 * parseFloat(getComputedStyle(root).getPropertyValue('--g-space-2'))
      main.classList.toggle('is-tight', max <= MIN || start < need)
    }
    const apply = (n) => {
      state.measure = Math.max(MIN, Math.min(effMax(), Math.round(n)))
      body.style.setProperty('--_ct-measure', state.measure + 'ch')
      state.applied++
      sync()
    }
    grip.addEventListener('keydown', (e) => {
      const wid = rtl() ? 'ArrowLeft' : 'ArrowRight', nar = rtl() ? 'ArrowRight' : 'ArrowLeft'
      const map = { [wid]: STEP, ArrowUp: STEP, [nar]: -STEP, ArrowDown: -STEP, PageUp: 10, PageDown: -10 }
      if (e.key in map) { e.preventDefault(); apply(state.measure + map[e.key]) } else if (e.key === 'Home') { e.preventDefault(); apply(MIN) } else if (e.key === 'End') { e.preventDefault(); apply(effMax()) }
    })
    const onDown = (e) => {
      if (e.button !== 0) return
      e.preventDefault()
      const el = e.currentTarget
      el.setPointerCapture(e.pointerId)
      const r = body.getBoundingClientRect(), cx = r.left + r.width / 2, ch = chPx()
      state.dragging = true; main.classList.add('is-dragging')
      guides = [0, 1].map(() => { const g = document.createElement('div'); g.className = 'ct__guide'; document.body.appendChild(g); return g })
      let n = state.measure
      const show = () => { const half = (n * ch) / 2; guides[0].style.left = (cx - half) + 'px'; guides[1].style.left = (cx + half) + 'px'; count.hidden = false; count.textContent = `${n} car.` }
      show()
      const move = (ev) => { n = Math.max(MIN, Math.min(effMax(), Math.round((2 * Math.abs(ev.clientX - cx)) / ch))); show(); state.preview = n }
      const end = (commit) => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', cancel); window.removeEventListener('keydown', esc, true); guides.forEach((g) => g.remove()); guides = []; count.hidden = true; state.dragging = false; main.classList.remove('is-dragging'); if (commit) apply(n) }
      const up = () => end(true), cancel = () => end(false)
      const esc = (ev) => { if (ev.key === 'Escape') { ev.preventDefault(); end(false) } }
      el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', cancel); window.addEventListener('keydown', esc, true)
    }
    document.querySelectorAll('[data-grip]').forEach((g) => { g.addEventListener('pointerdown', onDown); g.addEventListener('dblclick', () => apply(DEF)) })
    new ResizeObserver(sync).observe(main)
    sync()
  }

  // ---------- Lectura del laboratorio ----------
  const out = document.getElementById('readout')
  const read = () => {
    const cs = getComputedStyle(body)
    const p = document.getElementById('p1').getBoundingClientRect().width
    const ch = chPx()
    out.textContent = `caja ${Math.round((C === 'base' ? document.getElementById('ct') : main).clientWidth)} · columna ${Math.round(body.getBoundingClientRect().width)} · margen ${Math.round(parseFloat(cs.getPropertyValue('--g-container-inset-start')))}/${Math.round(parseFloat(cs.getPropertyValue('--g-container-inset-end')))} · párrafo ≈ ${Math.round(p / ch)} car.`
  }
  new ResizeObserver(read).observe(document.getElementById('col'))
  document.fonts.ready.then(() => { read(); state.ready = true })
})()
