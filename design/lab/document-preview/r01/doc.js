// Prototipo de kiwi (r01) del visor de documentos (GDocumentPreview, nombre de trabajo). NO es el .vue de bruno: es un
// banco para decidir estructura. Usa los componentes reales de dist/ (GBtn, GMenu, GDialog, GEmpty, GSummary, GProgress,
// GInput) con Vue global y el tema por defecto. Lo de laboratorio: el motor del visor (fases de carga, página actual,
// zoom con ancla, acciones con acuse honesto), tres renderizadores (PDF simulado con las capacidades de pdf.js, imagen
// real desde un Blob y el visor PDF nativo del navegador en un <iframe>) y la geometría de la base y de A, B y C.
// Iconos: solo Lucide (design/lab/lucide-icons.js + los que faltan, importados de lucide-static y registrados con
// Grana.createIcons, la vía pública).
;(async function () {
  const { h, ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount, defineComponent, markRaw, Fragment } = Vue
  const { GBtn, GMenu, GDialog, GEmpty, GSummary, GProgress, GInput } = Grana

  const Q = new URLSearchParams(location.search)
  if (Q.get('dir') === 'rtl') document.documentElement.dir = 'rtl'
  if (Q.get('theme') === 'dark') document.documentElement.dataset.theme = 'dark'

  // ---------------- Iconos: los que faltan, desde lucide-static ----------------
  const LS = '../../../../node_modules/lucide-static/dist/esm/icons/'
  const EXTRA = ['download', 'printer', 'share-2', 'link', 'mail', 'zoom-in', 'zoom-out', 'maximize-2', 'minimize-2', 'panel-left', 'chevron-up', 'chevron-down',
    'chevron-left', 'chevron-right', 'rotate-cw', 'file-x', 'file-question-mark', 'file-lock', 'file-text', 'file', 'image', 'wifi-off', 'ellipsis', 'external-link',
    'info', 'x', 'copy', 'check', 'lock', 'triangle-alert', 'refresh-cw', 'scan', 'book-open', 'file-exclamation-point', 'circle-alert']
  const RAW = {}
  await Promise.all(EXTRA.map(async (n) => {
    const { default: src } = await import(LS + n + '.mjs')
    RAW[n] = src
    const m = src.match(/class="lucide lucide-([a-z0-9-]+)"[^>]*>([\s\S]*?)<\/svg>/)
    if (m && m[1] === n && !window.LUCIDE_ICONS[n]) window.LUCIDE_ICONS[n] = m[2].replace(/\s+/g, ' ').trim()
  }))
  const Ic = (name, cls = '') => h('span', { class: ['lab-ic', cls], 'aria-hidden': 'true', innerHTML: window.lucide(name) })

  // ---------------- Laboratorio: entorno y fallos simulados ----------------
  const LAB = reactive({ failNext: false, noShare: Q.get('env') === 'noshare', offline: false, log: [] })
  const ENV = {
    get share () { return !LAB.noShare && typeof navigator.share === 'function' },
    canShareFile: (f) => { try { return !LAB.noShare && !!navigator.canShare?.({ files: [f] }) } catch { return false } },
    clipboard: !!(navigator.clipboard && navigator.clipboard.writeText) && window.isSecureContext,
    pdfInline: navigator.pdfViewerEnabled === true
  }
  window.__env = { pdfViewerEnabled: navigator.pdfViewerEnabled, share: typeof navigator.share, canShare: typeof navigator.canShare, clipboard: ENV.clipboard, fullscreenEnabled: !!document.fullscreenEnabled, moveBefore: typeof Element.prototype.moveBefore, secure: window.isSecureContext }

  // ---------------- Textos (en Grana: labels de la aplicación) ----------------
  const LOC = document.documentElement.lang || 'es'
  const pct = (s) => new Intl.NumberFormat(LOC, { style: 'percent', maximumFractionDigits: 0 }).format(s)
  const size = (b) => b == null ? '' : b < 1024 ? `${b} B` : b < 1048576 ? new Intl.NumberFormat(LOC, { style: 'unit', unit: 'kilobyte', maximumFractionDigits: 0 }).format(b / 1024) : new Intl.NumberFormat(LOC, { style: 'unit', unit: 'megabyte', maximumFractionDigits: 1 }).format(b / 1048576)
  const date = (d) => d ? new Intl.DateTimeFormat(LOC, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d)) : ''
  const TYPE = { 'application/pdf': 'PDF', 'image/png': 'Imagen PNG', 'image/jpeg': 'Imagen JPEG', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Hoja de cálculo (XLSX)' }
  const L = {
    region: (n) => `Vista previa de ${n}`, tools: 'Herramientas del documento', identity: 'Archivo y acciones',
    prev: 'Página anterior', next: 'Página siguiente', page: 'Página', pageOf: (p, n) => `Página ${p} de ${n}`, of: (n) => `de ${n}`,
    zoomOut: 'Alejar', zoomIn: 'Acercar', zoom: 'Zoom', fitWidth: 'Ajustar al ancho', fitPage: 'Ajustar a la página',
    zoomShort: (z, eff) => z.mode === 'fit-width' ? 'Al ancho' : z.mode === 'fit-page' ? 'Entera' : pct(eff),
    zoomSay: (z, eff) => z.mode === 'fit-width' ? 'Ajustado al ancho' : z.mode === 'fit-page' ? 'Ajustado a la página' : `Zoom ${pct(eff)}`,
    thumbs: 'Miniaturas', pages: 'Páginas', download: 'Descargar', print: 'Imprimir', more: 'Más acciones', rotate: 'Girar a la derecha',
    share: 'Compartir…', copyLink: 'Copiar enlace', email: 'Enviar por correo…', openNew: 'Abrir el original', details: 'Detalles',
    expand: 'Ampliar', fullscreen: 'Pantalla completa', exitFullscreen: 'Salir de pantalla completa', open: 'Abrir', close: 'Cerrar',
    loading: (n) => `Cargando ${n}`, long: (n) => `${n} sigue cargando. Puedes cancelar o esperar.`, cancel: 'Cancelar',
    ready: (n, c) => c ? `${n} listo, ${c} ${c === 1 ? 'página' : 'páginas'}` : `${n} listo`,
    retry: 'Reintentar', downloadAnyway: 'Descargar el original',
    err: {
      network: ['Sin conexión', 'No pudimos traer el documento. Cuando vuelva la conexión lo intentamos solos.'],
      'not-found': ['No encontramos este documento', 'Puede que lo hayan movido o eliminado.'],
      forbidden: ['No tienes acceso a este documento', 'Pide acceso a quien lo compartió.'],
      corrupt: ['El archivo está dañado', 'No se puede mostrar. Descárgalo para abrirlo con otra aplicación.'],
      empty: ['El archivo está vacío', 'No tiene contenido que mostrar (0 bytes).'],
      canceled: ['Carga cancelada', 'El documento no se cargó.'],
      unknown: ['No se pudo mostrar el documento', 'Algo falló al prepararlo.']
    },
    unsupported: 'Este tipo de archivo no tiene vista previa.',
    tooLarge: (lim) => `Es demasiado grande para verlo aquí (límite ${size(lim)}).`,
    noInline: 'Tu navegador no muestra PDF dentro de la página.',
    password: 'Este documento tiene contraseña', passwordLabel: 'Contraseña del documento', passwordWrong: 'La contraseña no es correcta',
    act: {
      download: { busy: 'Preparando la descarga…', done: (n) => `Descargando ${n}`, fail: 'No se pudo descargar' },
      print: { busy: 'Preparando la impresión…', fail: 'No se pudo imprimir aquí: abre el original para imprimirlo' },
      copyLink: { busy: 'Copiando…', done: 'Enlace copiado', fail: 'No se pudo copiar el enlace' },
      share: { busy: 'Abriendo compartir…', done: 'Compartido', fail: 'No se pudo compartir' },
      email: { busy: 'Enviando…', done: (to) => `Enviado a ${to}`, fail: 'No se envió. El servidor de correo no respondió.' }
    },
    unavailable: { offline: 'Sin conexión', loading: 'Disponible cuando termine de cargar', share: 'Este navegador no puede compartir archivos' },
    resume: (p) => `Ibas en la página ${p}`, fromStart: 'Volver al inicio'
  }

  // ---------------- Documentos de ejemplo ----------------
  // El original de la muestra (para descargar e imprimir el PDF completo) es muestra.pdf, del mismo origen.
  const PX = 96 / 72
  const PAGE = { w: 612 * PX, h: 792 * PX }
  async function makeImage () {
    const c = document.createElement('canvas'); c.width = 2400; c.height = 1600
    const x = c.getContext('2d')
    // Píxeles del documento (contenido, no tema): un plano en grises
    x.fillStyle = '#f4f4f2'; x.fillRect(0, 0, 2400, 1600)
    x.strokeStyle = '#3a3a3a'; x.lineWidth = 14; x.strokeRect(120, 120, 2160, 1360)
    x.lineWidth = 8
    ;[[120, 700, 1100, 700], [1100, 120, 1100, 1480], [1100, 900, 2280, 900], [1700, 900, 1700, 1480], [600, 700, 600, 1480]].forEach(([a, b, cc, d]) => { x.beginPath(); x.moveTo(a, b); x.lineTo(cc, d); x.stroke() })
    x.fillStyle = '#3a3a3a'; x.font = '600 56px sans-serif'
    ;[['Sala', 380, 420], ['Cocina', 1560, 520], ['Recámara', 260, 1120], ['Baño', 740, 1120], ['Estudio', 1300, 1220], ['Patio', 1880, 1220]].forEach(([t, a, b]) => x.fillText(t, a, b))
    x.font = '40px sans-serif'; x.fillText('Planta baja · escala 1:50', 140, 1560)
    const blob = await new Promise((r) => c.toBlob(r, 'image/png'))
    return new File([blob], 'Plano planta baja.png', { type: 'image/png', lastModified: Date.parse('2026-10-02T09:30') })
  }
  const planoFile = await makeImage()
  const PLANO_URL = URL.createObjectURL(planoFile) // el componente la crearía y revocaría (como GFileField)

  const SOURCES = {
    contrato: { key: 'contrato', name: 'Contrato de arrendamiento.pdf', type: 'application/pdf', size: 2451000, modified: '2026-09-28T10:14', renderer: 'pdf-sim', pages: 12, original: './muestra.pdf', link: 'https://expedientes.example/doc/7731', download: 'app' },
    plano: { key: 'plano', name: planoFile.name, type: 'image/png', size: planoFile.size, modified: planoFile.lastModified, renderer: 'image', src: PLANO_URL, file: planoFile, original: PLANO_URL, link: 'https://expedientes.example/doc/7732', download: 'native' },
    nativo: { key: 'nativo', name: 'muestra.pdf', type: 'application/pdf', size: 8617, modified: '2026-10-14T08:00', renderer: 'native-pdf', src: './muestra.pdf', original: './muestra.pdf', link: 'https://expedientes.example/doc/7733', download: 'native' },
    hoja: { key: 'hoja', name: 'Presupuesto 2026.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 84200, modified: '2026-08-11T17:40', original: './muestra.pdf', link: 'https://expedientes.example/doc/7734', download: 'app' }
  }

  // ---------------- Renderizadores (interfaz propuesta; capacidades declaradas) ----------------
  const wait = (ms, signal) => new Promise((res, rej) => { const t = setTimeout(res, ms); signal?.addEventListener('abort', () => { clearTimeout(t); rej(Object.assign(new Error('abort'), { name: 'AbortError' })) }) })
  function drawPage (canvas, n, total, scale, rotation, title) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const W = PAGE.w * scale; const H = PAGE.h * scale; const rot = rotation % 180 !== 0
    canvas.width = Math.round((rot ? H : W) * dpr); canvas.height = Math.round((rot ? W : H) * dpr)
    const c = canvas.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0)
    if (rotation === 90) { c.translate(H, 0); c.rotate(Math.PI / 2) } else if (rotation === 180) { c.translate(W, H); c.rotate(Math.PI) } else if (rotation === 270) { c.translate(0, W); c.rotate(-Math.PI / 2) }
    const s = PX * scale; c.scale(s, s)
    // Papel y tinta: píxeles del documento (contenido), no del tema
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, 612, 792)
    c.fillStyle = '#1f1f1f'; c.font = '600 18px sans-serif'; c.fillText(n === 1 ? title.replace(/\.pdf$/, '') : `Cláusula ${n}`, 72, 96)
    c.fillStyle = '#6b6b6b'; c.font = '10px sans-serif'; c.fillText(`Expediente 7731 · ${title}`, 72, 116)
    let r = n * 7919
    for (let i = 0; i < 26; i++) { r = (r * 16807) % 2147483647; const w = 300 + (r % 168); c.fillStyle = i % 9 === 0 ? '#3d3d3d' : '#b9b9b9'; c.fillRect(72, 150 + i * 22, i % 9 === 8 ? w * 0.55 : w, i % 9 === 0 ? 8 : 6) }
    c.fillStyle = '#6b6b6b'; c.font = '10px sans-serif'; c.fillText(`${n} / ${total}`, 290, 760)
  }
  const RENDERERS = [
    { // PDF simulado: lo que daría un adaptador de pdf.js (páginas, zoom, miniaturas, girar; sin capa de texto en la simulación)
      id: 'pdf-sim', accepts: (s) => s.renderer === 'pdf-sim', fit: 'fit-width',
      caps: { pages: true, zoom: true, thumbnails: true, rotate: true, text: false, search: false, print: 'original', progress: true },
      async load (s, { signal, onProgress, password }) {
        const f = s.fail
        const total = f === 'long' ? 6500 : f === 'slow' || f === 'progress' ? 2600 : 700
        if (f === 'password' && password !== 'grana') { await wait(500, signal); throw Object.assign(new Error('password'), { kind: 'password', wrong: password != null }) }
        if (f === 'hang' || f === 'hang-progress') { for (let i = 1; ; i++) { await wait(300, signal); if (f === 'hang-progress') onProgress?.({ loaded: Math.min(i * 0.06, 0.9) * s.size, total: s.size }) } }
        const steps = 10
        for (let i = 1; i <= steps; i++) { await wait(total / steps, signal); if (f === 'progress' || f === 'slow' || f === 'long') onProgress?.({ loaded: i * s.size / steps, total: s.size }) }
        if (f === 'network' && !LAB.recovered) throw Object.assign(new Error('network'), { kind: 'network' })
        if (['not-found', 'forbidden', 'corrupt', 'empty', 'unknown'].includes(f)) throw Object.assign(new Error(f), { kind: f })
        return { pageCount: s.pages, size: () => PAGE, render: (i, cv, o) => drawPage(cv, i + 1, s.pages, o.scale, o.rotation, s.name), destroy () {} }
      }
    },
    { // Imagen: <img> con decode(); el navegador decodifica, nunca innerHTML; SVG solo como <img>
      id: 'image', accepts: (s) => s.renderer === 'image', fit: 'fit-page',
      caps: { pages: false, zoom: true, thumbnails: false, rotate: true, text: false, search: false, print: 'render', progress: false },
      async load (s, { signal }) {
        if (s.fail) { await wait(400, signal); throw Object.assign(new Error(s.fail), { kind: s.fail }) }
        const img = new Image(); img.decoding = 'async'; img.src = s.src; img.alt = ''
        await img.decode()
        if (signal?.aborted) throw Object.assign(new Error('abort'), { name: 'AbortError' })
        return { pageCount: 1, size: () => ({ w: img.naturalWidth, h: img.naturalHeight }), src: s.src, destroy () {} }
      }
    },
    { // Visor PDF nativo del navegador: sin API (ni página, ni zoom, ni eventos); solo si navigator.pdfViewerEnabled
      id: 'native-pdf', accepts: (s) => s.renderer === 'native-pdf', fit: null, native: true,
      caps: { pages: false, zoom: false, thumbnails: false, rotate: false, text: true, search: true, print: 'browser', progress: false },
      async load (s) { return { pageCount: null, native: true, src: s.src, destroy () {} } }
    }
  ]

  // ---------------- Motor del visor (estado compartido por todas las profundidades) ----------------
  let uid = 0
  const ZSTEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4]
  function createViewer (source) {
    const id = `dv${++uid}`
    const v = reactive({
      id, ids: { status: `${id}-status`, live: `${id}-live`, title: `${id}-title`, meta: `${id}-meta` },
      source, phase: 'idle', mold: false, long: false, progress: null, error: null, renderer: null, doc: null,
      page: 1, count: 0, zoom: { mode: null, scale: 1 }, eff: 1, rotation: 0, thumbs: false, details: false,
      expanded: false, fullscreen: false, acts: {}, said: [], lastRead: 0
    })
    let ctrl = null; let timers = []; let moldAt = 0; let stage = null
    const say = (t) => { v.said.push(t); const el = document.getElementById(v.ids.live); if (el) { el.textContent = ''; setTimeout(() => { el.textContent = t }, 30) } }
    const clear = () => { timers.forEach(clearTimeout); timers = [] }
    function load (opts = {}) {
      ctrl?.abort(); clear()
      const s = v.source
      Object.assign(v, { error: null, doc: null, progress: null, long: false, mold: false, count: 0 })
      if (!s) { v.phase = 'idle'; return }
      if (s.fail === 'too-large') { v.phase = 'too-large'; return }
      const r = RENDERERS.find((x) => x.accepts(s))
      if (!r) { v.phase = 'unsupported'; return }
      if (r.native && ((!ENV.pdfInline && Q.get('native') !== 'force') || s.fail === 'no-inline')) { v.phase = 'no-inline'; v.renderer = markRaw(r); return }
      v.renderer = markRaw(r); v.phase = 'loading'
      const c = ctrl = new AbortController()
      timers.push(setTimeout(() => { if (v.phase === 'loading') { v.mold = true; moldAt = performance.now(); say(L.loading(s.name)) } }, 200))
      timers.push(setTimeout(() => { if (v.phase === 'loading') { v.long = true; say(L.long(s.name)) } }, 5000))
      r.load(s, { signal: c.signal, onProgress: (p) => { v.progress = p }, password: opts.password }).then(async (doc) => {
        if (v.mold) { const left = 400 - (performance.now() - moldAt); if (left > 0) await wait(left) }
        if (c !== ctrl) return
        clear(); v.doc = markRaw(doc); v.count = doc.pageCount || 0; v.page = Math.min(Math.max(1, v.page), v.count || 1)
        if (!v.zoom.mode) v.zoom = { mode: r.fit || 'fit-width', scale: 1 }
        v.phase = 'ready'
        if (v.mold || opts.password) say(L.ready(s.name, v.count))
      }).catch((e) => {
        if (e.name === 'AbortError') return
        clear()
        if (e.kind === 'password') { v.phase = 'password'; v.error = e; if (e.wrong) say(L.passwordWrong); return }
        v.phase = 'error'; v.error = e; const [t, d] = L.err[e.kind] || L.err.unknown; say(`${t}. ${d}`)
      })
    }
    function cancel () { ctrl?.abort(); clear(); v.phase = 'error'; v.error = { kind: 'canceled' }; say(L.err.canceled[0]) }
    function setSource (s) { v.source = s; v.page = 1; v.zoom = { mode: null, scale: 1 }; v.rotation = 0; v.acts = {}; load() }
    // La pantalla activa (en línea o la del diálogo) registra su escenario; las demás quedan quietas
    const attach = (api) => { stage = api }
    const detach = (api) => { if (stage === api) stage = null }
    function goTo (n, announce = true) {
      if (!v.count) return
      n = Math.min(Math.max(1, Math.round(n)), v.count)
      v.page = n; stage?.toPage(n)
      if (announce) say(L.pageOf(n, v.count))
    }
    function setZoom (z, announce = true) {
      const a = stage?.anchor(); v.zoom = z
      nextTick(() => { stage?.restore(a); if (announce) say(L.zoomSay(v.zoom, v.eff)) })
    }
    function zoomStep (dir) {
      const cur = v.eff; const list = dir > 0 ? ZSTEPS.filter((s) => s > cur + 0.001) : ZSTEPS.filter((s) => s < cur - 0.001).reverse()
      if (list.length) setZoom({ mode: 'custom', scale: list[0] })
    }
    function rotate () { const a = stage?.anchor(); v.rotation = (v.rotation + 90) % 360; nextTick(() => stage?.restore(a)); say(`Girado ${v.rotation}°`) }

    // Acciones: Grana emite la intención; la aplicación responde. El acuse solo se da con confirmación.
    function act (key, state, msg) { v.acts = { ...v.acts, [key]: { state, msg } }; if (msg) say(msg); if (state === 'done' || state === 'started') setTimeout(() => { if (v.acts[key]?.state === state) v.acts = { ...v.acts, [key]: { state: 'idle', msg: '' } } }, 4000) }
    const appHandler = (ms, ok) => new Promise((res, rej) => setTimeout(() => (LAB.failNext ? (LAB.failNext = false, rej(new Error('fail'))) : res(ok)), ms))
    const busy = (key) => v.acts[key]?.state === 'busy'
    const ACTIONS = {
      async download () {
        const s = v.source
        if (s.download === 'native') { // mismo origen o Blob: <a download> conserva el nombre; el navegador no confirma: «Descargando»
          const a = document.createElement('a'); a.href = s.original; a.download = s.name; a.rel = 'noopener'; document.body.append(a); if (!window.__noDownloadClick) a.click(); a.remove()
          return act('download', 'started', L.act.download.done(s.name))
        }
        act('download', 'busy', L.act.download.busy) // la aplicación prepara el archivo (URL firmada, otro origen)
        try { await appHandler(900); act('download', 'started', L.act.download.done(s.name)) } catch { act('download', 'failed', L.act.download.fail) }
      },
      async print () {
        const s = v.source; const kind = v.renderer?.caps.print
        act('print', 'busy', L.act.print.busy)
        try {
          // PDF: el ORIGINAL completo en un <iframe> oculto del mismo origen (todas las páginas, vectorial).
          // Imagen: un documento propio con la imagen contenida en la hoja (sin recortes).
          const fr = document.createElement('iframe'); fr.className = 'lab-sr'; fr.setAttribute('aria-hidden', 'true'); fr.tabIndex = -1
          if (kind === 'render') fr.srcdoc = `<!doctype html><title>${s.name.replace(/[<&"]/g, '')}</title><style>@page{margin:12mm}html,body{margin:0;height:100%}img{display:block;max-width:100%;max-height:100vh;margin:auto;object-fit:contain}</style><img alt="" src="${s.original}">`
          else fr.src = s.original
          document.body.append(fr)
          await new Promise((r, j) => { fr.onload = r; setTimeout(() => j(new Error('timeout')), 4000) })
          if (!window.__noPrint) fr.contentWindow.print()
          setTimeout(() => fr.remove(), 1000)
          act('print', 'idle', '') // nunca «Impreso»: el navegador no dice si se imprimió o se canceló
        } catch { act('print', 'failed', L.act.print.fail) }
      },
      async copyLink () {
        act('copyLink', 'busy', '')
        try { if (!ENV.clipboard) throw new Error('no'); await navigator.clipboard.writeText(v.source.link); act('copyLink', 'done', L.act.copyLink.done) } catch { act('copyLink', 'failed', L.act.copyLink.fail) }
      },
      async share () {
        const s = v.source
        try {
          const data = s.file && ENV.canShareFile(s.file) ? { files: [s.file], title: s.name } : { url: s.link, title: s.name }
          await navigator.share(data); act('share', 'done', L.act.share.done)
        } catch (e) { if (e.name !== 'AbortError') act('share', 'failed', L.act.share.fail) } // cancelar no es un fallo
      },
      async email () {
        act('email', 'busy', L.act.email.busy)
        try { const to = await appHandler(1300, 'ana.ruiz@notaria.example'); act('email', 'done', L.act.email.done(to)) } catch { act('email', 'failed', L.act.email.fail) }
      }
    }
    // Disponibilidad: entorno (ocultar), estado (aria-disabled con motivo) y permiso de la aplicación (ocultar)
    function availability (key) {
      const s = v.source; const ready = v.phase === 'ready'
      const hidden = { share: !ENV.share, copyLink: !ENV.clipboard, print: !s || !RENDERERS.find((x) => x.accepts(s)) || v.phase === 'no-inline' }
      if (hidden[key]) return { show: false }
      if (LAB.offline && ['download', 'email', 'share', 'print'].includes(key)) return { show: true, disabled: true, reason: L.unavailable.offline }
      if (key === 'print' && !ready) return { show: true, disabled: true, reason: L.unavailable.loading }
      return { show: true, disabled: busy(key) }
    }
    const run = (key) => { const a = availability(key); if (a.show && !a.disabled) ACTIONS[key]() }
    const api = { v, load, cancel, setSource, attach, detach, goTo, setZoom, zoomStep, rotate, run, availability, say, get stage () { return stage } }
    return api
  }

  // ---------------- Escenario: el documento (páginas, imagen o visor nativo) ----------------
  const Stage = defineComponent({
    props: { vw: Object, active: { type: Boolean, default: true }, bottomPad: { type: Number, default: 0 } },
    setup (props) {
      const vw = props.vw; const v = vw.v
      const el = ref(null); const box = reactive({ w: 0, h: 0 })
      const canvases = new Map(); const visible = new Set(); const drawn = new Map()
      let ro; let io; let raf = 0
      const PAD = () => parseFloat(getComputedStyle(el.value).paddingInlineStart) || 0
      const pageSize = () => { const s = v.doc?.size?.(0) || PAGE; return v.rotation % 180 ? { w: s.h, h: s.w } : s }
      const eff = computed(() => {
        if (!v.doc || v.doc.native) return 1
        const s = pageSize(); const w = Math.max(0, box.w); const hh = Math.max(0, box.h)
        const raw = v.zoom.mode === 'fit-width' ? w / s.w : v.zoom.mode === 'fit-page' ? Math.min(w / s.w, hh / s.h) : v.zoom.scale
        return Math.min(Math.max(raw || 1, 0.1), 8)
      })
      watch(eff, (e) => { if (props.active) v.eff = e }, { immediate: true })
      function measure () { if (!el.value) return; const cs = getComputedStyle(el.value); box.w = el.value.clientWidth - parseFloat(cs.paddingInlineStart) - parseFloat(cs.paddingInlineEnd); box.h = el.value.clientHeight - parseFloat(cs.paddingBlockStart) - parseFloat(cs.paddingBlockEnd) - props.bottomPad }
      const pageEls = () => el.value ? [...el.value.querySelectorAll('.lab-page')] : []
      function draw () {
        if (!v.doc?.render) return
        const key = `${eff.value.toFixed(4)}|${v.rotation}`
        if (!box.w || !el.value) return // sin medir no se pinta nada
        const sr = el.value.getBoundingClientRect(); const ps = pageEls()
        visible.forEach((i) => {
          const r = ps[i]?.getBoundingClientRect(); if (!r || r.bottom < sr.top - sr.height || r.top > sr.bottom + sr.height) return // comprobación geométrica: el conjunto del observador puede ir un cuadro atrás
          const cv = canvases.get(i); if (cv && drawn.get(i) !== key) { v.doc.render(i, cv, { scale: eff.value, rotation: v.rotation }); cv.dataset.drawn = '1'; drawn.set(i, key) }
        })
      }
      function track () {
        if (!props.active || !el.value || !v.count) return
        const top = el.value.getBoundingClientRect().top + el.value.clientHeight * 0.3
        let cur = 1
        pageEls().forEach((p, i) => { if (p.getBoundingClientRect().top <= top) cur = i + 1 })
        if (cur !== v.page) v.page = cur // sin anuncio: desplazarse no se narra
      }
      const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(track) }
      const api = {
        toPage (n) { const p = pageEls()[n - 1]; if (p && el.value) el.value.scrollTo({ top: p.offsetTop - parseFloat(getComputedStyle(el.value).paddingBlockStart), behavior: 'instant' }) },
        anchor () { const ps = pageEls(); const p = ps[v.page - 1]; if (!p || !el.value) return null; return { page: v.page, r: (el.value.scrollTop - p.offsetTop) / p.offsetHeight, x: el.value.scrollWidth > el.value.clientWidth ? (el.value.scrollLeft + el.value.clientWidth / 2) / el.value.scrollWidth : null } },
        restore (a) { if (!a || !el.value) return; const p = pageEls()[a.page - 1]; if (!p) return; el.value.scrollTop = p.offsetTop + a.r * p.offsetHeight; if (a.x != null) el.value.scrollLeft = a.x * el.value.scrollWidth - el.value.clientWidth / 2 }
      }
      function observe () {
        io?.disconnect()
        if (!el.value) return
        io = new IntersectionObserver((es) => { es.forEach((e) => { const i = +e.target.dataset.i; e.isIntersecting ? visible.add(i) : visible.delete(i) }); draw() }, { root: el.value, rootMargin: '100% 0px' })
        pageEls().forEach((p) => io.observe(p))
      }
      watch(() => [v.doc, v.count], () => nextTick(() => { drawn.clear(); visible.clear(); observe(); if (props.active) api.toPage(v.page) }))
      watch([eff, () => v.rotation], () => nextTick(draw))
      watch(() => props.active, (a) => { if (a) { vw.attach(api); measure(); nextTick(() => { v.eff = eff.value; api.toPage(v.page) }) } })
      onMounted(() => {
        ro = new ResizeObserver(() => { const a = props.active ? api.anchor() : null; measure(); nextTick(() => a && api.restore(a)) }); ro.observe(el.value)
        measure(); if (props.active) vw.attach(api); observe()
      })
      onBeforeUnmount(() => { ro?.disconnect(); io?.disconnect(); vw.detach(api) })
      // Teclado del escenario: solo con el foco aquí (WCAG 2.1.4); Ctrl/⌘ + rueda o pellizco acercan; Ctrl/⌘ + = no se toca
      function onKey (e) {
        if (e.altKey || e.ctrlKey || e.metaKey || v.phase !== 'ready' || !v.renderer?.caps.zoom) return
        if (e.key === '+' || e.key === '=') { e.preventDefault(); vw.zoomStep(1) } else if (e.key === '-') { e.preventDefault(); vw.zoomStep(-1) } else if (e.key === '0') { e.preventDefault(); vw.setZoom({ mode: v.renderer.fit, scale: 1 }) }
      }
      let wheelAcc = 0; let wheelT = 0
      function onWheel (e) {
        if (!(e.ctrlKey || e.metaKey) || v.phase !== 'ready' || !v.renderer?.caps.zoom) return
        e.preventDefault(); wheelAcc += e.deltaY; clearTimeout(wheelT)
        wheelT = setTimeout(() => { if (Math.abs(wheelAcc) > 4) vw.zoomStep(wheelAcc < 0 ? 1 : -1); wheelAcc = 0 }, 60)
      }
      // Arrastrar para mover una imagen ampliada (también se mueve con las flechas: el escenario se desplaza)
      let drag = null
      function onDown (e) { if (e.button !== 0 || v.renderer?.id !== 'image' || !el.value) return; if (el.value.scrollWidth <= el.value.clientWidth && el.value.scrollHeight <= el.value.clientHeight) return; drag = { x: e.clientX, y: e.clientY, l: el.value.scrollLeft, t: el.value.scrollTop }; el.value.setPointerCapture(e.pointerId); el.value.classList.add('is-panning') }
      function onMove (e) { if (!drag) return; el.value.scrollLeft = drag.l - (e.clientX - drag.x); el.value.scrollTop = drag.t - (e.clientY - drag.y) }
      function onUp () { drag = null; el.value?.classList.remove('is-panning') }

      return () => {
        const s = v.source; const st = v.phase
        let body
        if (st === 'loading') {
          const ps = s?.renderer === 'image' ? [{ w: 4, h: 3 }] : [{ w: 612, h: 792 }, { w: 612, h: 792 }]
          body = h('div', { class: ['lab-molds', v.mold && 'is-shown'], 'aria-hidden': 'true' }, [
            ...ps.map((p, i) => h('div', { class: 'lab-mold', style: { aspectRatio: `${p.w} / ${p.h}` } }, i === 0 && v.progress && v.mold ? h('div', { class: 'lab-mold__bar' }, h(GProgress, { value: Math.round(100 * v.progress.loaded / v.progress.total), max: 100, label: L.loading(s.name), size: 'sm' })) : null))
          ])
        } else if (st === 'ready' && v.doc?.native) {
          // Sin sandbox: Chromium no pinta PDF en un iframe con sandbox. Por eso solo con la política de origen de la aplicación.
          body = h('iframe', { class: 'lab-native', src: v.doc.src + '#view=FitH', title: s.name })
        } else if (st === 'ready' && v.renderer?.id === 'image') {
          const sz = pageSize()
          body = h('div', { class: 'lab-pages lab-pages--image' }, h('div', { class: 'lab-page lab-page--image', 'data-i': 0, role: 'img', 'aria-label': s.name, style: { width: `${sz.w * eff.value}px`, height: `${sz.h * eff.value}px` } },
            h('img', { src: v.doc.src, alt: '', draggable: 'false', style: { width: `${(v.rotation % 180 ? sz.h : sz.w) * eff.value}px`, height: `${(v.rotation % 180 ? sz.w : sz.h) * eff.value}px`, transform: `rotate(${v.rotation}deg)` } })))
        } else if (st === 'ready') {
          const sz = pageSize()
          body = h('div', { class: 'lab-pages' }, Array.from({ length: v.count }, (_, i) => h('div', { class: 'lab-page', key: i, 'data-i': i, role: 'img', 'aria-label': L.pageOf(i + 1, v.count), style: { width: `${sz.w * eff.value}px`, height: `${sz.h * eff.value}px` } },
            h('canvas', { ref: (c) => { if (c) canvases.set(i, c); else canvases.delete(i) }, 'aria-hidden': 'true' }))))
        } else {
          body = h(StateView, { vw })
        }
        const name = s ? L.region(s.name) : 'Vista previa'
        const scrolls = st === 'ready' && !v.doc?.native
        return h('div', {
          ref: el, class: ['lab-stage', `is-${st}`, v.doc?.native && 'is-native', v.renderer?.id === 'image' && 'is-image'],
          // Contenedor con desplazamiento SIN hijos enfocables: necesita su parada de Tab (WCAG 2.1.1; #570 no aplica)
          tabindex: scrolls ? 0 : undefined, role: scrolls ? 'document' : 'group', 'aria-label': name,
          'aria-busy': st === 'loading' ? 'true' : undefined, 'aria-describedby': scrolls ? v.ids.status : undefined,
          style: props.bottomPad ? { '--_bottom': `${props.bottomPad}px` } : null,
          onKeydown: onKey, onWheel, onScroll, onPointerdown: onDown, onPointermove: onMove, onPointerup: onUp, onPointercancel: onUp
        }, [body, st === 'loading' && v.long ? h('div', { class: 'lab-long' }, [h('p', null, L.long(s.name)), h(GBtn, { variant: 'outline', size: 'sm', onClick: vw.cancel }, () => L.cancel)]) : null])
      }
    }
  })

  // ---------------- Estados en el sitio: error, sin vista previa, contraseña, vacío ----------------
  const StateView = defineComponent({
    props: { vw: Object },
    setup (props) {
      const pw = ref('')
      return () => {
        const vw = props.vw; const v = vw.v; const s = v.source; const st = v.phase
        const canDl = vw.availability('download')
        const dl = () => h(GBtn, { variant: 'outline', size: 'sm', disabled: false, onClick: () => vw.run('download') }, { prepend: () => Ic('download'), default: () => L.downloadAnyway })
        if (st === 'idle') return h(GEmpty, { cause: 'none', title: 'Sin documento', description: 'Elige un archivo para verlo aquí.' })
        if (st === 'password') {
          return h('form', { class: 'lab-pass', onSubmit: (e) => { e.preventDefault(); vw.load({ password: pw.value }) } }, [
            h('p', { class: 'lab-pass__title' }, [Ic('file-lock'), L.password]),
            h(GInput, { type: 'password', label: L.passwordLabel, modelValue: pw.value, 'onUpdate:modelValue': (x) => { pw.value = x }, error: v.error?.wrong ? L.passwordWrong : undefined, autocomplete: 'off', showPasswordLabel: 'Mostrar contraseña', hidePasswordLabel: 'Ocultar contraseña' }),
            h(GBtn, { type: 'submit', size: 'sm' }, () => L.open)
          ])
        }
        if (st === 'error') {
          const k = v.error?.kind || 'unknown'; const [t, d] = L.err[k] || L.err.unknown
          const cause = k === 'forbidden' ? 'forbidden' : 'error'
          return h(GEmpty, { cause, title: t, description: d }, {
            icon: k === 'network' ? () => Ic('wifi-off') : k === 'not-found' ? () => Ic('file-question-mark') : k === 'corrupt' || k === 'empty' ? () => Ic('file-exclamation-point') : undefined,
            actions: () => [
              ['network', 'unknown', 'canceled', 'not-found'].includes(k) ? h(GBtn, { size: 'sm', onClick: () => { if (k === 'network') LAB.recovered = true; vw.load() } }, () => L.retry) : null,
              k === 'corrupt' && canDl.show ? dl() : null
            ]
          })
        }
        // Sin vista previa: la ficha del archivo con lo que sí se puede hacer
        const reason = st === 'too-large' ? L.tooLarge(25 * 1048576) : st === 'no-inline' ? L.noInline : L.unsupported
        return h('div', { class: 'lab-fallback' }, [
          h(GSummary, { title: s.name, icon: st === 'no-inline' ? 'file-text' : 'file', facts: facts(s), layout: 'stack', size: 'md' }),
          h('p', { class: 'lab-fallback__why' }, reason),
          h('div', { class: 'lab-fallback__acts' }, [
            canDl.show ? h(GBtn, { size: 'sm', onClick: () => vw.run('download') }, { prepend: () => Ic('download'), default: () => L.download }) : null,
            st === 'no-inline' ? h('a', { class: 'lab-linkbtn', href: s.original, target: '_blank', rel: 'noopener' }, [L.openNew, Ic('external-link')]) : null
          ])
        ])
      }
    }
  })
  const facts = (s, opt = {}) => [
    { label: 'Tipo', value: TYPE[s.type] || s.type, priority: 1 },
    s.pages && !opt.noPages ? { label: 'Páginas', value: String(s.pages), priority: 2 } : null,
    { label: 'Tamaño', value: size(s.size), priority: 2 },
    { label: 'Modificado', value: date(s.modified), priority: 3 }
  ].filter(Boolean)

  // ---------------- Piezas compartidas: campo de página, zoom, acciones ----------------
  // Campo de página: spinbutton de texto (↑/↓ cambian, cifras sustituyen, Intro aplica, Esc revierte)
  const PageField = defineComponent({
    props: { vw: Object, tool: { type: Boolean, default: true }, cls: String },
    setup (props) {
      const draft = ref(null)
      return () => {
        const v = props.vw.v
        const commit = () => { if (draft.value == null) return; const n = parseInt(draft.value, 10); draft.value = null; if (Number.isFinite(n)) props.vw.goTo(n) }
        return h('input', {
          class: ['lab-pagefield', props.cls], type: 'text', inputmode: 'numeric', role: 'spinbutton', 'aria-label': L.page,
          'aria-valuemin': 1, 'aria-valuemax': v.count, 'aria-valuenow': v.page, 'aria-valuetext': L.pageOf(v.page, v.count),
          'data-tool': props.tool ? '' : undefined, value: draft.value ?? String(v.page), size: String(String(v.count).length),
          style: { '--_ch': String(v.count).length },
          onFocus: (e) => e.target.select(),
          onInput: (e) => { draft.value = e.target.value.replace(/\D/g, '') },
          onKeydown: (e) => {
            if (e.key === 'ArrowUp') { e.preventDefault(); draft.value = null; props.vw.goTo(v.page - 1) } else if (e.key === 'ArrowDown') { e.preventDefault(); draft.value = null; props.vw.goTo(v.page + 1) } else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); e.stopPropagation(); draft.value = null; props.vw.goTo(e.key === 'Home' ? 1 : v.count) } else if (e.key === 'Enter') { e.preventDefault(); commit() } else if (e.key === 'Escape' && draft.value != null) { e.preventDefault(); e.stopPropagation(); draft.value = null }
          },
          onBlur: commit
        })
      }
    }
  })
  // Botón de herramienta (GBtn real, solo icono, nombre por su tooltip)
  const Tool = (icon, label, onClick, extra = {}) => h(GBtn, { icon: true, variant: 'ghost', size: 'sm', tooltip: label, 'data-tool': '', onClick, ...extra }, () => Ic(icon))
  const ZoomMenu = defineComponent({
    props: { vw: Object, text: { type: Boolean, default: false }, compact: { type: Boolean, default: false } },
    setup (props) {
      const open = ref(false)
      return () => {
        const vw = props.vw; const v = vw.v
        const items = [{ type: 'group', label: L.zoom, items: [
          { type: 'radio', id: 'fit-width', label: L.fitWidth, checked: v.zoom.mode === 'fit-width' },
          { type: 'radio', id: 'fit-page', label: L.fitPage, checked: v.zoom.mode === 'fit-page' },
          ...[0.5, 0.75, 1, 1.5, 2, 4].map((s) => ({ type: 'radio', id: `s${s}`, label: pct(s), checked: v.zoom.mode === 'custom' && Math.abs(v.zoom.scale - s) < 0.001 }))
        ] }]
        return h(GMenu, { modelValue: open.value, 'onUpdate:modelValue': (x) => { open.value = x }, items, label: L.zoom, closeOnSelect: 'always',
          onSelect: ({ id }) => vw.setZoom(id.startsWith('s') ? { mode: 'custom', scale: +id.slice(1) } : { mode: id, scale: 1 }) }, {
          trigger: ({ attrs }) => h('button', { ...attrs, type: 'button', class: ['lab-valuebtn', props.text && 'lab-valuebtn--text'], 'data-tool': '', 'aria-label': `${L.zoom}: ${L.zoomShort(v.zoom, v.eff)}` }, [h('span', { 'aria-hidden': 'true' }, props.compact ? pct(v.eff) : props.text ? L.zoomShort(v.zoom, v.eff).toLowerCase() : L.zoomShort(v.zoom, v.eff)), Ic('chevron-down', 'lab-ic--sm')])
        })
      }
    }
  })
  const MoreMenu = defineComponent({
    props: { vw: Object, extra: { type: Array, default: () => [] }, trigger: Function },
    setup (props) {
      const open = ref(false)
      return () => {
        const vw = props.vw; const v = vw.v
        const it = (id, label, icon) => { const a = vw.availability(id); return a.show ? { id, label: a.disabled && a.reason ? `${label} (${a.reason.toLowerCase()})` : label, icon, disabled: !!a.disabled } : null }
        const items = [...props.extra, it('share', L.share, 'share-2'), it('copyLink', L.copyLink, 'link'), it('email', L.email, 'mail'),
          v.source?.original ? { id: 'open', label: L.openNew, icon: 'external-link', href: v.source.original, target: '_blank', rel: 'noopener' } : null,
          { type: 'separator' }, { type: 'checkbox', id: 'details', label: L.details, checked: v.details }].filter(Boolean)
        return h(GMenu, { modelValue: open.value, 'onUpdate:modelValue': (x) => { open.value = x }, items, label: L.more, align: 'end',
          onSelect: ({ id }) => { if (id === 'details') v.details = !v.details; else if (id === 'rotate') vw.rotate(); else if (id === 'print' || id === 'download') vw.run(id); else vw.run(id) } }, {
          trigger: ({ attrs }) => props.trigger ? props.trigger(attrs) : h(GBtn, { ...attrs, icon: true, variant: 'ghost', size: 'sm', tooltip: L.more, 'data-tool': '' }, () => Ic('ellipsis'))
        })
      }
    }
  })
  // Acuse de la última acción: texto visible junto a las acciones (el anuncio va por la región viva)
  const lastAct = (v) => { const e = Object.entries(v.acts).filter(([, a]) => a.msg && a.state !== 'idle').pop(); return e ? { key: e[0], ...e[1] } : null }
  const Receipt = (v, cls = '') => { const a = lastAct(v); return a ? h('span', { class: ['lab-receipt', `is-${a.state}`, cls] }, [a.state === 'busy' ? Ic('refresh-cw', 'lab-ic--spin') : a.state === 'failed' ? Ic('circle-alert') : Ic('check'), a.msg, a.state === 'failed' && a.key !== 'print' ? h('button', { type: 'button', class: 'lab-linkbtn', onClick: (e) => { e.stopPropagation(); /* reintentar */ document.dispatchEvent(new CustomEvent('lab-retry', { detail: { v, key: a.key } })) } }, L.retry) : null]) : null }

  // Barra con foco itinerante (APG toolbar): una parada; ←/→ (y ↑/↓ si es vertical) recorren; Inicio/Fin a los extremos
  function rovingKeys (e, vertical = false) {
    const root = e.currentTarget
    const tools = [...root.querySelectorAll('[data-tool]')].filter((t) => t.closest('[data-roving]') === root && !t.closest('[hidden]') && t.offsetParent !== null)
    const i = tools.indexOf(document.activeElement); if (i < 0) return
    const fwd = vertical ? ['ArrowDown'] : [document.documentElement.dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight']
    const back = vertical ? ['ArrowUp'] : [document.documentElement.dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft']
    let n = -1
    if (fwd.includes(e.key)) n = (i + 1) % tools.length; else if (back.includes(e.key)) n = (i - 1 + tools.length) % tools.length
    else if (e.key === 'Home' && document.activeElement.getAttribute('role') !== 'spinbutton') n = 0; else if (e.key === 'End' && document.activeElement.getAttribute('role') !== 'spinbutton') n = tools.length - 1
    if (n < 0) return
    e.preventDefault(); tools.forEach((t, k) => { t.tabIndex = k === n ? 0 : -1 }); tools[n].focus()
  }
  function rovingInit (root) {
    if (!root) return
    const tools = [...root.querySelectorAll('[data-tool]')].filter((t) => t.closest('[data-roving]') === root)
    if (!tools.length) return
    let cur = tools.findIndex((t) => t.tabIndex === 0 && t.dataset.rv === '1')
    if (cur < 0) cur = 0
    tools.forEach((t, k) => { t.tabIndex = k === cur ? 0 : -1; t.dataset.rv = k === cur ? '1' : '0' })
  }
  const useRoving = (r) => { const fix = () => nextTick(() => rovingInit(r.value)); onMounted(fix); Vue.onUpdated(fix); return (e) => { rovingKeys(e); nextTick(() => { const t = r.value?.querySelectorAll('[data-tool]'); t?.forEach((x) => { x.dataset.rv = x.tabIndex === 0 ? '1' : '0' }) }) } }
  const onFocusTool = (e) => { const t = e.target.closest('[data-tool]'); const root = e.currentTarget; if (!t) return; root.querySelectorAll('[data-tool]').forEach((x) => { if (x.closest('[data-roving]') === root) { x.tabIndex = x === t ? 0 : -1; x.dataset.rv = x === t ? '1' : '0' } }) }

  // Metadatos: <dl> (en Grana, GSummary o un slot de la aplicación)
  const Meta = (v) => v.details && v.source ? h('dl', { class: 'lab-meta', id: v.ids.meta }, [
    ...[['Nombre', v.source.name], ['Tipo', TYPE[v.source.type] || v.source.type], v.count ? ['Páginas', String(v.count)] : null, ['Tamaño', size(v.source.size)], ['Modificado', date(v.source.modified)], ['Estado', v.phase === 'ready' ? 'Disponible' : v.phase === 'loading' ? 'Cargando' : 'No disponible']].filter(Boolean)
      .map(([k, x]) => h('div', null, [h('dt', null, k), h('dd', null, x)]))
  ]) : null
  // Línea de estado leída por el escenario (aria-describedby), sin región viva: se consulta, no se narra al desplazar
  const StatusText = (v) => h('span', { id: v.ids.status, class: 'lab-sr' }, v.count ? `${L.pageOf(v.page, v.count)}. ${L.zoomSay(v.zoom, v.eff)}.` : v.renderer?.id === 'image' ? L.zoomSay(v.zoom, v.eff) : '')
  const Live = (v) => h('p', { id: v.ids.live, class: 'lab-sr', 'aria-live': 'polite', 'aria-atomic': 'true' })

  // Miniaturas: lista de botones con aria-current="page"; una parada (↑/↓), contenedor con tabindex=-1 (#570)
  const Thumbs = defineComponent({
    props: { vw: Object },
    setup (props) {
      const root = ref(null); const cvs = new Map(); let io
      const v = props.vw.v
      const draw = (i) => { const c = cvs.get(i); if (c && v.doc?.render && !c.dataset.d) { v.doc.render(i, c, { scale: 0.16, rotation: v.rotation }); c.dataset.d = '1' } }
      onMounted(() => { io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && draw(+e.target.dataset.i)), { root: root.value, rootMargin: '50% 0px' }); root.value.querySelectorAll('canvas').forEach((c) => io.observe(c)) })
      onBeforeUnmount(() => io?.disconnect())
      watch(() => v.rotation, () => cvs.forEach((c, i) => { delete c.dataset.d; draw(i) }))
      watch(() => v.page, (p) => { const b = root.value?.querySelectorAll('button')[p - 1]; b?.scrollIntoView({ block: 'nearest' }) })
      const onKey = (e) => {
        const bs = [...root.value.querySelectorAll('button')]; const i = bs.indexOf(document.activeElement); if (i < 0) return
        const n = e.key === 'ArrowDown' ? Math.min(i + 1, bs.length - 1) : e.key === 'ArrowUp' ? Math.max(i - 1, 0) : e.key === 'Home' ? 0 : e.key === 'End' ? bs.length - 1 : -1
        if (n < 0) return; e.preventDefault(); bs[n].focus()
      }
      const focusIdx = ref(null)
      return () => h('nav', { class: 'lab-thumbs', 'aria-label': L.pages }, h('ol', { ref: root, tabindex: '-1', onKeydown: onKey }, Array.from({ length: v.count }, (_, i) => h('li', { key: i }, h('button', {
        type: 'button', 'aria-current': v.page === i + 1 ? 'page' : undefined, tabindex: (focusIdx.value ?? v.page - 1) === i ? 0 : -1,
        onFocus: () => { focusIdx.value = i }, onClick: () => props.vw.goTo(i + 1)
      }, [h('canvas', { 'data-i': i, ref: (c) => { if (c) cvs.set(i, c) }, 'aria-hidden': 'true' }), h('span', null, L.pageOf(i + 1, v.count).replace(/^Página /, ''))])))))
    }
  })

  // ---------------- Profundidades: ampliar al diálogo y a pantalla completa (el mismo estado, sin recargar) ----------------
  const Expanded = defineComponent({
    props: { vw: Object, layout: Function, from: Object },
    setup (props) {
      return () => {
        const v = props.vw.v
        return h(GDialog, {
          modelValue: v.expanded, 'onUpdate:modelValue': (x) => { v.expanded = x; if (!x) v.fullscreen = false },
          title: v.source?.name || '', description: v.source ? facts(v.source).slice(0, 3).map((f) => f.label === 'Páginas' ? `${f.value} páginas` : f.value).join(' · ') : '',
          size: 'lg', fullscreen: v.fullscreen, mobile: 'fullscreen', closeLabel: L.close, class: 'lab-dlg'
        }, { default: () => v.expanded ? props.layout(true) : null })
      }
    }
  })

  // ======================================================================================
  // BASE: la forma de hoy, a propósito (barra arriba). Decide semántica, teclado y estados.
  // ======================================================================================
  function baseLayout (vw, inDialog) {
    const v = vw.v; const caps = v.renderer?.caps || {}
    const ready = v.phase === 'ready'
    return h('div', { class: ['lab-dp', 'lab-dp--base', inDialog && 'is-in-dialog'] }, [
      h(BaseBar, { vw, inDialog }),
      h('div', { class: 'lab-dp__body' }, [
        v.thumbs && caps.thumbnails && ready ? h(Thumbs, { vw }) : null,
        h(Stage, { vw, active: inDialog ? true : !v.expanded })
      ]),
      Meta(v), StatusText(v)
    ])
  }
  const BaseBar = defineComponent({
    props: { vw: Object, inDialog: Boolean },
    setup (props) {
      const bar = ref(null); const keys = useRoving(bar)
      return () => {
        const vw = props.vw; const v = vw.v; const caps = v.renderer?.caps || {}; const ready = v.phase === 'ready'
        const av = (k) => vw.availability(k)
        const btnA = (k, icon, label) => { const a = av(k); return a.show ? Tool(icon, a.disabled && a.reason ? `${label}. ${a.reason}` : label, () => vw.run(k), { 'aria-disabled': a.disabled ? 'true' : undefined, loading: v.acts[k]?.state === 'busy' }) : null }
        return h('div', { ref: bar, class: 'lab-bar', role: 'toolbar', 'aria-label': L.tools, 'data-roving': '', onKeydown: keys, onFocusin: onFocusTool }, [
          h('div', { class: 'lab-bar__group' }, [
            caps.thumbnails && ready ? Tool('panel-left', L.thumbs, () => { v.thumbs = !v.thumbs }, { 'aria-pressed': String(v.thumbs) }) : null,
            caps.pages && ready ? [Tool('chevron-up', L.prev, () => vw.goTo(v.page - 1), { 'aria-disabled': v.page <= 1 ? 'true' : undefined }),
              h('span', { class: 'lab-bar__page' }, [h(PageField, { vw }), h('span', { 'aria-hidden': 'true' }, L.of(v.count))]),
              Tool('chevron-down', L.next, () => vw.goTo(v.page + 1), { 'aria-disabled': v.page >= v.count ? 'true' : undefined })] : null
          ]),
          caps.zoom && ready ? h('div', { class: 'lab-bar__group' }, [Tool('zoom-out', L.zoomOut, () => vw.zoomStep(-1)), h(ZoomMenu, { vw }), Tool('zoom-in', L.zoomIn, () => vw.zoomStep(1))]) : null,
          h('div', { class: 'lab-bar__group lab-bar__group--end' }, [
            Receipt(v),
            btnA('download', 'download', L.download), btnA('print', 'printer', L.print),
            h(MoreMenu, { vw, extra: caps.rotate && ready ? [{ id: 'rotate', label: L.rotate, icon: 'rotate-cw' }] : [] }),
            props.inDialog ? Tool(v.fullscreen ? 'minimize-2' : 'maximize-2', v.fullscreen ? L.exitFullscreen : L.fullscreen, () => { v.fullscreen = !v.fullscreen }, { 'aria-pressed': String(v.fullscreen) })
              : Tool('maximize-2', L.expand, () => { v.expanded = true }, { 'aria-haspopup': 'dialog' })
          ])
        ])
      }
    }
  })

  // ======================================================================================
  // A · LOMO: la navegación es el lomo del documento; nombre y acciones en un solo sello
  // ======================================================================================
  function lomoLayout (vw, inDialog) {
    const v = vw.v
    return h('div', { class: ['lab-dp', 'lab-dp--A', inDialog && 'is-in-dialog', v.thumbs && 'is-open'] }, [
      h('div', { class: 'lab-dp__body' }, [
        h(Spine, { vw, inDialog }),
        h(Stage, { vw, active: inDialog ? true : !v.expanded, bottomPad: 0 }),
        h(Seal, { vw, inDialog })
      ]),
      Meta(v), StatusText(v)
    ])
  }
  const Spine = defineComponent({
    props: { vw: Object, inDialog: Boolean },
    setup (props) {
      const rail = ref(null); const peek = reactive({ i: null, y: 0, show: false }); const peekCv = ref(null)
      const v = props.vw.v
      const total = () => Math.max(1, v.count)
      const pageAt = (clientY) => { const r = rail.value.getBoundingClientRect(); return Math.min(total(), Math.max(1, Math.floor((clientY - r.top) / r.height * total()) + 1)) }
      const showPeek = (i, y) => { peek.i = i; peek.y = y; peek.show = true; nextTick(() => { if (peekCv.value && v.doc?.render) v.doc.render(i - 1, peekCv.value, { scale: 0.22, rotation: v.rotation }) }) }
      const yOf = (p) => (p - 0.5) / total() * 100
      let dragging = false
      const onDown = (e) => { if (e.button !== 0 || v.phase !== 'ready') return; dragging = true; e.currentTarget.setPointerCapture(e.pointerId); const p = pageAt(e.clientY); props.vw.goTo(p, false); showPeek(p, yOf(p)) }
      const onMove = (e) => { if (v.phase !== 'ready' || !v.count) return; const p = pageAt(e.clientY); if (dragging) props.vw.goTo(p, false); showPeek(p, yOf(p)) }
      const onUp = () => { if (dragging) { dragging = false; props.vw.say(L.pageOf(v.page, v.count)) } }
      // Slider vertical: ↓/→ página siguiente (como desplazarse), ↑/← anterior; Re Pág/Av Pág ±10 %; Inicio/Fin
      const onKey = (e) => {
        const big = Math.max(1, Math.round(v.count / 10))
        const m = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1, PageDown: big, PageUp: -big }[e.key]
        if (m) { e.preventDefault(); props.vw.goTo(v.page + m, false) } else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); props.vw.goTo(e.key === 'Home' ? 1 : v.count, false) } else return
        showPeek(v.page, yOf(v.page))
      }
      return () => {
        const vw = props.vw; const caps = v.renderer?.caps || {}; const ready = v.phase === 'ready'
        const hasPages = caps.pages && ready && v.count > 0
        return h('div', { class: 'lab-spine', 'data-roving': '', role: 'toolbar', 'aria-orientation': 'vertical', 'aria-label': L.pages, onKeydown: (e) => { if (e.target.getAttribute('role') !== 'slider') rovingKeys(e, true) }, onFocusin: onFocusTool }, [
          hasPages && caps.thumbnails ? Tool('panel-left', L.thumbs, () => { v.thumbs = !v.thumbs }, { 'aria-pressed': String(v.thumbs) }) : null,
          hasPages && v.thumbs ? h(Thumbs, { vw }) : null,
          hasPages && !v.thumbs ? h('div', {
            ref: rail, class: 'lab-spine__rail', role: 'slider', tabindex: 0, 'data-tool': '', 'aria-orientation': 'vertical', 'aria-label': L.page,
            'aria-valuemin': 1, 'aria-valuemax': v.count, 'aria-valuenow': v.page, 'aria-valuetext': L.pageOf(v.page, v.count),
            onKeydown: onKey, onPointerdown: onDown, onPointermove: onMove, onPointerup: onUp, onPointerleave: () => { if (!dragging) peek.show = false }, onBlur: () => { peek.show = false; props.vw.say(L.pageOf(v.page, v.count)) }, onFocus: () => showPeek(v.page, yOf(v.page))
          }, [
            ...Array.from({ length: v.count }, (_, i) => h('span', { class: ['lab-spine__tick', i + 1 === v.page && 'is-current'], style: { '--_y': yOf(i + 1) + '%' }, 'aria-hidden': 'true' })),
            h('span', { class: 'lab-spine__mark', style: { '--_y': yOf(v.page) + '%' }, 'aria-hidden': 'true' }, String(v.page)),
            h('span', { class: ['lab-spine__peek', peek.show && 'is-shown'], style: { '--_y': peek.y + '%' }, 'aria-hidden': 'true' }, [h('canvas', { ref: peekCv }), h('span', null, L.pageOf(peek.i || v.page, v.count))])
          ]) : h('div', { class: 'lab-spine__rail is-empty', 'aria-hidden': 'true' }),
          caps.zoom && ready ? h('div', { class: 'lab-spine__zoom' }, [Tool('zoom-in', L.zoomIn, () => vw.zoomStep(1)), h(ZoomMenu, { vw, compact: true }), Tool('zoom-out', L.zoomOut, () => vw.zoomStep(-1))]) : null
        ])
      }
    }
  })
  const Seal = defineComponent({
    props: { vw: Object, inDialog: Boolean },
    setup (props) {
      const bar = ref(null); const keys = useRoving(bar)
      return () => {
        const vw = props.vw; const v = vw.v; const s = v.source; const caps = v.renderer?.caps || {}
        if (!s) return null
        const av = (k) => vw.availability(k)
        const act = (k, icon, label) => { const a = av(k); return a.show ? Tool(icon, a.disabled && a.reason ? `${label}. ${a.reason}` : label, () => vw.run(k), { 'aria-disabled': a.disabled ? 'true' : undefined, loading: v.acts[k]?.state === 'busy' }) : null }
        const r = lastAct(v)
        return h('div', { ref: bar, class: ['lab-seal', r && `is-${r.state}`], role: 'toolbar', 'aria-label': L.identity, 'data-roving': '', onKeydown: keys, onFocusin: onFocusTool }, [
          h('span', { class: 'lab-seal__id' }, [Ic(s.renderer === 'image' ? 'image' : s.renderer ? 'file-text' : 'file'), h('span', { class: 'lab-seal__name' }, s.name),
            h('span', { class: 'lab-seal__facts' }, r ? Receipt(v) : [TYPE[s.type] || '', v.count ? ` · ${v.count} págs.` : '', ` · ${size(s.size)}`])]),
          h('span', { class: 'lab-seal__acts' }, [
            act('download', 'download', L.download), act('print', 'printer', L.print),
            h(MoreMenu, { vw, extra: caps.rotate && v.phase === 'ready' ? [{ id: 'rotate', label: L.rotate, icon: 'rotate-cw' }] : [] }),
            props.inDialog ? Tool(v.fullscreen ? 'minimize-2' : 'maximize-2', v.fullscreen ? L.exitFullscreen : L.fullscreen, () => { v.fullscreen = !v.fullscreen }, { 'aria-pressed': String(v.fullscreen) })
              : Tool('maximize-2', L.expand, () => { v.expanded = true }, { 'aria-haspopup': 'dialog' })
          ])
        ])
      }
    }
  })

  // ======================================================================================
  // B · CRECE DESDE LA FICHA: el archivo es un objeto con profundidades; la portada es la página donde ibas
  // ======================================================================================
  const Ficha = defineComponent({
    props: { vw: Object },
    setup (props) {
      const cover = ref(null); const v = props.vw.v; const settle = ref(false)
      const paint = () => nextTick(() => { if (cover.value && v.doc?.render) v.doc.render(v.page - 1, cover.value, { scale: 0.5, rotation: v.rotation }) })
      watch(() => [v.doc, v.page, v.expanded, v.rotation], paint)
      watch(() => v.expanded, (x, was) => { if (!x && was) { v.lastRead = v.page; settle.value = true; setTimeout(() => { settle.value = false }, 700) } })
      onMounted(paint)
      return () => {
        const vw = props.vw; const s = v.source; if (!s) return null
        const ready = v.phase === 'ready'
        const isImg = v.renderer?.id === 'image'
        const coverBody = ready && v.doc?.render ? h('canvas', { ref: cover, 'aria-hidden': 'true' })
          : ready && isImg ? h('img', { src: v.doc.src, alt: '', style: { transform: `rotate(${v.rotation}deg)` } })
            : v.phase === 'loading' ? h('span', { class: ['lab-mold', 'lab-mold--cover', v.mold && 'is-shown'], 'aria-hidden': 'true' })
              : h('span', { class: 'lab-ficha__noprev' }, [Ic(v.phase === 'error' ? 'file-exclamation-point' : 'file'), h('span', null, v.phase === 'error' ? (L.err[v.error?.kind] || L.err.unknown)[0] : v.phase === 'password' ? L.password : L.unsupported)])
        const canOpen = ready || v.phase === 'password'
        const openLabel = v.count ? `${L.open} ${s.name}, ${L.pageOf(v.page, v.count).toLowerCase()}` : `${L.open} ${s.name}`
        return h('article', { class: ['lab-ficha', settle.value && 'is-settling'], 'aria-labelledby': v.ids.title }, [
          h('div', { class: 'lab-ficha__stack', 'aria-hidden': 'true' }),
          canOpen ? h('button', { type: 'button', class: 'lab-ficha__cover', 'aria-haspopup': 'dialog', 'aria-label': openLabel, onClick: () => { v.expanded = true }, 'aria-busy': v.phase === 'loading' ? 'true' : undefined }, [coverBody, v.count ? h('span', { class: 'lab-ficha__folio', 'aria-hidden': 'true' }, `${v.page} / ${v.count}`) : null])
            : h('div', { class: 'lab-ficha__cover is-static', 'aria-busy': v.phase === 'loading' ? 'true' : undefined }, [coverBody]),
          h('div', { class: 'lab-ficha__body' }, [
            h('h3', { id: v.ids.title, class: 'lab-ficha__name' }, s.name),
            h('p', { class: 'lab-ficha__facts' }, facts(s).map((f) => f.label === 'Modificado' ? `modificado el ${f.value}` : f.label === 'Páginas' ? `${f.value} páginas` : f.value).join(' · ')),
            v.lastRead > 1 && !v.expanded ? h('p', { class: 'lab-ficha__resume' }, [L.resume(v.lastRead), ' · ', h('button', { type: 'button', class: 'lab-linkbtn', onClick: () => { v.page = 1; v.lastRead = 0 } }, L.fromStart)]) : null,
            v.phase === 'error' || v.phase === 'unsupported' || v.phase === 'too-large' || v.phase === 'no-inline' ? h('p', { class: 'lab-ficha__why' }, v.phase === 'error' ? (L.err[v.error?.kind] || L.err.unknown)[1] : v.phase === 'too-large' ? L.tooLarge(25 * 1048576) : v.phase === 'no-inline' ? L.noInline : L.unsupported) : null,
            h('div', { class: 'lab-ficha__acts' }, [
              canOpen ? h(GBtn, { size: 'sm', onClick: () => { v.expanded = true }, 'aria-haspopup': 'dialog' }, { prepend: () => Ic('book-open'), default: () => L.open }) : null,
              v.phase === 'error' && ['network', 'unknown', 'canceled', 'not-found'].includes(v.error?.kind) ? h(GBtn, { size: 'sm', variant: 'outline', onClick: () => { LAB.recovered = true; vw.load() } }, () => L.retry) : null,
              vw.availability('download').show ? h(GBtn, { size: 'sm', variant: 'outline', loading: v.acts.download?.state === 'busy', onClick: () => vw.run('download') }, { prepend: () => Ic('download'), default: () => L.download }) : null,
              h(MoreMenu, { vw }),
              Receipt(v)
            ])
          ]),
          Live(v)
        ])
      }
    }
  })
  function fichaReader (vw) {
    const v = vw.v
    return h('div', { class: ['lab-dp', 'lab-dp--B'] }, [
      h('div', { class: 'lab-dp__body' }, [v.thumbs && v.renderer?.caps.thumbnails && v.phase === 'ready' ? h(Thumbs, { vw }) : null, h(Stage, { vw, active: true })]),
      h(FichaDock, { vw }), Meta(v), StatusText(v)
    ])
  }
  // En el lector de B las herramientas van ABAJO, al alcance del pulgar, como el pie fijo de GDialog
  const FichaDock = defineComponent({
    props: { vw: Object },
    setup (props) {
      const bar = ref(null); const keys = useRoving(bar)
      return () => {
        const vw = props.vw; const v = vw.v; const caps = v.renderer?.caps || {}; const ready = v.phase === 'ready'
        const a = (k, icon, label) => { const x = vw.availability(k); return x.show ? Tool(icon, label, () => vw.run(k), { 'aria-disabled': x.disabled ? 'true' : undefined, loading: v.acts[k]?.state === 'busy' }) : null }
        return h('div', { ref: bar, class: 'lab-dock', role: 'toolbar', 'aria-label': L.tools, 'data-roving': '', onKeydown: keys, onFocusin: onFocusTool }, [
          caps.thumbnails && ready ? Tool('panel-left', L.thumbs, () => { v.thumbs = !v.thumbs }, { 'aria-pressed': String(v.thumbs) }) : null,
          caps.pages && ready ? h('span', { class: 'lab-dock__pages' }, [Tool('chevron-left', L.prev, () => vw.goTo(v.page - 1), { 'aria-disabled': v.page <= 1 ? 'true' : undefined, class: 'lab-flip' }), h(PageField, { vw }), h('span', { 'aria-hidden': 'true' }, L.of(v.count)), Tool('chevron-right', L.next, () => vw.goTo(v.page + 1), { 'aria-disabled': v.page >= v.count ? 'true' : undefined, class: 'lab-flip' })]) : null,
          caps.zoom && ready ? h('span', { class: 'lab-dock__zoom' }, [Tool('zoom-out', L.zoomOut, () => vw.zoomStep(-1)), h(ZoomMenu, { vw }), Tool('zoom-in', L.zoomIn, () => vw.zoomStep(1))]) : null,
          h('span', { class: 'lab-dock__end' }, [Receipt(v), a('download', 'download', L.download), a('print', 'printer', L.print), h(MoreMenu, { vw, extra: caps.rotate && ready ? [{ id: 'rotate', label: L.rotate, icon: 'rotate-cw' }] : [] }),
            Tool(v.fullscreen ? 'minimize-2' : 'maximize-2', v.fullscreen ? L.exitFullscreen : L.fullscreen, () => { v.fullscreen = !v.fullscreen }, { 'aria-pressed': String(v.fullscreen) })])
        ])
      }
    }
  })

  // ======================================================================================
  // C · LA FRASE: sin barra de iconos; una línea que dice dónde estás y cuyos valores se pulsan
  // ======================================================================================
  function fraseLayout (vw, inDialog) {
    const v = vw.v
    return h('div', { class: ['lab-dp', 'lab-dp--C', inDialog && 'is-in-dialog'] }, [
      h('div', { class: 'lab-dp__body' }, [v.thumbs && v.renderer?.caps.thumbnails && v.phase === 'ready' ? h(Thumbs, { vw }) : null, h(Stage, { vw, active: inDialog ? true : !v.expanded })]),
      h(Phrase, { vw, inDialog }), Meta(v), StatusText(v)
    ])
  }
  const Phrase = defineComponent({
    props: { vw: Object, inDialog: Boolean },
    setup (props) {
      const bar = ref(null); const keys = useRoving(bar)
      return () => {
        const vw = props.vw; const v = vw.v; const s = v.source; const caps = v.renderer?.caps || {}; const ready = v.phase === 'ready'
        if (!s) return null
        const word = (k, label, extra = {}) => { const a = vw.availability(k); return a.show ? h('button', { type: 'button', class: 'lab-word', 'data-tool': '', 'aria-disabled': a.disabled ? 'true' : undefined, 'aria-describedby': undefined, onClick: () => vw.run(k), ...extra }, label) : null }
        const sep = () => h('span', { class: 'lab-phrase__sep', 'aria-hidden': 'true' }, ' · ')
        const r = lastAct(v)
        return h('div', { ref: bar, class: 'lab-phrase', role: 'toolbar', 'aria-label': L.tools, 'data-roving': '', onKeydown: keys, onFocusin: onFocusTool }, [
          caps.pages && ready ? h('span', { class: 'lab-phrase__seg' }, [
            h('button', { type: 'button', class: 'lab-word lab-word--icon', 'data-tool': '', 'aria-label': L.prev, 'aria-disabled': v.page <= 1 ? 'true' : undefined, onClick: () => vw.goTo(v.page - 1) }, Ic('chevron-left', 'lab-flip')),
            h('span', { 'aria-hidden': 'true' }, 'Página '), h(PageField, { vw, cls: 'lab-pagefield--word' }), h('span', { 'aria-hidden': 'true' }, ` ${L.of(v.count)}`),
            h('button', { type: 'button', class: 'lab-word lab-word--icon', 'data-tool': '', 'aria-label': L.next, 'aria-disabled': v.page >= v.count ? 'true' : undefined, onClick: () => vw.goTo(v.page + 1) }, Ic('chevron-right', 'lab-flip'))
          ]) : null,
          caps.pages && ready ? sep() : null,
          caps.zoom && ready ? h('span', { class: 'lab-phrase__seg' }, [h('span', { 'aria-hidden': 'true' }, 'vista '), h(ZoomMenu, { vw, text: true })]) : null,
          caps.zoom && ready ? sep() : null,
          h('span', { class: 'lab-phrase__seg lab-phrase__name' }, [h('button', { type: 'button', class: 'lab-word lab-word--name', 'data-tool': '', 'aria-expanded': String(v.details), 'aria-controls': v.ids.meta, onClick: () => { v.details = !v.details } }, s.name), h('span', { class: 'lab-phrase__muted' }, ` ${TYPE[s.type] || ''}, ${size(s.size)}`)]),
          sep(),
          h('span', { class: 'lab-phrase__seg' }, [word('download', L.download), vw.availability('print').show ? [sep(), word('print', L.print)] : null, sep(),
            h(MoreMenu, { vw, extra: caps.rotate && ready ? [{ id: 'rotate', label: L.rotate, icon: 'rotate-cw' }] : [], trigger: (attrs) => h('button', { ...attrs, type: 'button', class: 'lab-word', 'data-tool': '' }, ['más', Ic('chevron-down', 'lab-ic--sm')]) }),
            sep(), props.inDialog ? h('button', { type: 'button', class: 'lab-word', 'data-tool': '', 'aria-pressed': String(v.fullscreen), onClick: () => { v.fullscreen = !v.fullscreen } }, v.fullscreen ? 'salir de pantalla completa' : 'pantalla completa')
              : h('button', { type: 'button', class: 'lab-word', 'data-tool': '', 'aria-haspopup': 'dialog', onClick: () => { v.expanded = true } }, 'ampliar')]),
          r ? h('span', { class: 'lab-phrase__tail' }, [sep(), Receipt(v)]) : null
        ])
      }
    }
  })

  // ---------------- Montaje: un visor por demostración ----------------
  const LAYOUTS = { base: baseLayout, A: lomoLayout, C: fraseLayout }
  const Viewer = defineComponent({
    props: { concept: { type: String, default: 'base' }, src: String, fail: String, variant: { type: String, default: 'embedded' }, picker: { type: Boolean, default: true }, vid: String },
    setup (props) {
      const mk = (k) => k ? { ...SOURCES[k], fail: props.fail || undefined } : null
      const vw = createViewer(mk(props.src))
      window.__views = window.__views || {}; if (props.vid) window.__views[props.vid] = vw
      onMounted(() => vw.load())
      const v = vw.v
      return () => {
        const isB = props.concept === 'B'
        const lay = (inDialog) => isB ? fichaReader(vw) : LAYOUTS[props.concept](vw, inDialog)
        return h('div', { class: ['lab-viewer', `lab-viewer--${props.variant}`, `lab-viewer--${props.concept}`], id: props.vid }, [
          props.picker ? h('div', { class: 'lab-picker', role: 'group', 'aria-label': 'Archivo de ejemplo (laboratorio)' }, Object.values(SOURCES).map((s) => h('button', { type: 'button', class: 'lab-chipbtn', 'aria-pressed': String(v.source?.key === s.key), onClick: () => vw.setSource({ ...s }) }, s.name))) : null,
          h('section', { class: 'lab-viewer__frame', 'aria-label': v.source ? L.region(v.source.name) : 'Vista previa' }, [isB ? h(Ficha, { vw }) : lay(false), isB ? null : Live(v)]),
          h(Expanded, { vw, layout: lay })
        ])
      }
    }
  })
  document.addEventListener('lab-retry', (e) => { const { v, key } = e.detail; Object.values(window.__views).find((x) => x.v === v)?.run(key) })

  const app = Vue.createApp({ setup () { onMounted(() => nextTick(() => { window.__ready = true })); return { LAB } } })
  app.use(Grana.default)
  app.use(Grana.createIcons(EXTRA.filter((n) => !['chevron-left', 'chevron-right', 'chevron-down', 'x', 'check', 'copy', 'image', 'file-text', 'lock', 'triangle-alert', 'refresh-cw', 'info', 'circle-alert', 'search'].includes(n)).map((n) => RAW[n])))
  app.component('lab-viewer', Viewer)
  app.mount('#app')
})()
