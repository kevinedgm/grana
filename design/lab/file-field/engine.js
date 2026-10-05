// Motor del campo de archivos (kiwi, design/lab/file-field). Lo comparten la base (r01) y los conceptos (r02).
// REFERENCIA DE COMPORTAMIENTO, no de implementación: el .vue es de bruno. Sin fetch: la subida la hace el
// «adaptador» de la aplicación (aquí, uno simulado con temporizadores). Expone window.FF.
(function () {
  const { reactive, ref, computed, watch, nextTick, markRaw, onMounted, onBeforeUnmount } = Vue

  // ---------- Formato ----------
  const UNITS = [['byte', 1], ['kilobyte', 1e3], ['megabyte', 1e6], ['gigabyte', 1e9]]
  // Unidades decimales (SI, como Finder, iOS y Android); el límite y el tamaño se escriben con la misma función
  function fmtSize(bytes, locale = 'es-MX') {
    let u = UNITS[0]
    for (const x of UNITS) if (bytes >= x[1]) u = x
    const v = bytes / u[1]
    return new Intl.NumberFormat(locale, { style: 'unit', unit: u[0], unitDisplay: 'short', maximumFractionDigits: v < 10 && u[1] > 1 ? 1 : 0 }).format(v)
  }
  const extOf = (name) => { const m = /\.([^.]+)$/.exec(name || ''); return m ? m[1].toUpperCase() : '' }
  const isImage = (e) => /^image\/(png|jpe?g|gif|webp|avif|bmp|svg\+xml)$/.test(e.type || '')
  const iconOf = (e) => (isImage(e) || /^image\//.test(e.type || '') ? 'image' : 'file-text')

  // ---------- accept: misma sintaxis que el atributo nativo ----------
  function accepts(file, accept) {
    if (!accept) return true
    const name = (file.name || '').toLowerCase(), type = (file.type || '').toLowerCase()
    return accept.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean).some((t) => {
      if (t.startsWith('.')) return name.endsWith(t)
      if (t.endsWith('/*')) return type.startsWith(t.slice(0, -1))
      return type === t
    })
  }
  // Descripción humana de accept (la escribe la aplicación en el real; aquí, derivada para el prototipo)
  function describeAccept(accept) {
    if (!accept) return ''
    const map = { 'image/*': 'imagen', '.pdf': 'PDF', 'application/pdf': 'PDF', '.docx': 'Word', '.xlsx': 'Excel', '.csv': 'CSV', 'image/jpeg': 'JPG', 'image/png': 'PNG' }
    const parts = [...new Set(accept.split(',').map((t) => map[t.trim()] || t.trim().replace(/^\./, '').toUpperCase()))]
    return parts.length > 1 ? parts.slice(0, -1).join(', ') + ' o ' + parts.at(-1) : parts[0]
  }

  const plural = (n, one, many) => (n === 1 ? one : many.replace('{n}', n))
  const listNames = (arr) => (arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + ' y ' + arr.at(-1))

  // ---------- Adaptador simulado (la aplicación pone el suyo: fetch, XHR, S3 prefirmado, tus…) ----------
  // upload(file, { signal, progress(loaded, total) }) → Promise<{ value, url? }>; rechaza con { message } o con AbortError
  const net = reactive({ offline: false, speed: 1, attempts: {} })
  function fakeUpload(file, { signal, progress }) {
    return new Promise((resolve, reject) => {
      const total = file.size || 1
      const key = file.name + ':' + file.size
      const attempt = (net.attempts[key] = (net.attempts[key] || 0) + 1)
      const failsAt = /falla/i.test(file.name) && attempt === 1 ? 0.45 : /servidor/i.test(file.name) ? 0.2 : null
      const steps = /lento/i.test(file.name) ? 40 : 12
      let i = 0
      const tick = () => {
        if (signal.aborted) return
        if (net.offline) { clearInterval(t); return reject({ message: 'Sin conexión' }) }
        i++
        const frac = Math.min(1, i / steps)
        progress(Math.round(total * frac), total)
        if (failsAt !== null && frac >= failsAt) { clearInterval(t); return reject({ message: /servidor/i.test(file.name) ? 'El servidor no admite este archivo' : 'Se interrumpió la conexión' }) }
        if (frac >= 1) { clearInterval(t); resolve({ value: 'srv-' + Math.random().toString(36).slice(2, 8) }) }
      }
      const t = setInterval(tick, 120 / net.speed)
      signal.addEventListener('abort', () => { clearInterval(t); reject(Object.assign(new Error('abort'), { name: 'AbortError' })) })
    })
  }

  // ---------- Archivos de prueba ----------
  function pngFile(name, w = 320, h = 240, hue = 210) {
    const c = document.createElement('canvas'); c.width = w; c.height = h
    const g = c.getContext('2d')
    const grd = g.createLinearGradient(0, 0, w, h); grd.addColorStop(0, `hsl(${hue} 45% 62%)`); grd.addColorStop(1, `hsl(${(hue + 50) % 360} 40% 38%)`)
    g.fillStyle = grd; g.fillRect(0, 0, w, h)
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.arc(w * 0.35, h * 0.45, h * 0.22, 0, Math.PI * 2); g.fill()
    const bin = atob(c.toDataURL('image/png').split(',')[1]); const u = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i)
    return new File([u], name, { type: 'image/png', lastModified: 1767225600000 })
  }
  const blobFile = (name, type, size) => new File([new Uint8Array(size)], name, { type, lastModified: 1767225600000 })
  const SAMPLES = {
    photos: () => [pngFile('lesion-frontal.png', 320, 240, 12), pngFile('lesion-lateral.png', 240, 320, 140), pngFile('lesion-detalle-lento.png', 320, 320, 260)],
    pdf: () => [blobFile('Comprobante de domicilio CFE marzo 2026.pdf', 'application/pdf', 1_240_000)],
    big: () => [blobFile('Estudio tomografía completo.pdf', 'application/pdf', 12_800_000)],
    exe: () => [blobFile('instalador.exe', 'application/x-msdownload', 48_000)],
    fail: () => [pngFile('radiografia-falla.png', 300, 220, 30)],
    server: () => [blobFile('receta-servidor.pdf', 'application/pdf', 310_000)],
    ine: () => [pngFile('INE frente.png', 320, 200, 200), pngFile('INE reverso.png', 320, 200, 230)],
    mixed: () => [blobFile('Receta médica.pdf', 'application/pdf', 220_000), pngFile('foto-receta.png'), blobFile('notas.txt', 'text/plain', 1200)]
  }

  // ---------- Región viva propia (existe vacía antes del cambio; se vacía y se escribe en el ciclo siguiente) ----------
  function createLive() {
    const text = ref('')
    let pending = [], wt = null, ct = null
    return {
      text,
      say(t) {
        if (!t) return
        clearTimeout(ct); text.value = ''; pending.push(t); clearTimeout(wt)
        wt = setTimeout(() => { text.value = pending.join(' '); pending = []; ct = setTimeout(() => { text.value = '' }, 7000) }, 60)
      },
      dispose() { clearTimeout(wt); clearTimeout(ct) }
    }
  }

  // ---------- Arrastre de archivos sobre la página (para el concepto A y la protección al soltar fuera) ----------
  const page = reactive({ dragging: false, types: [], count: 0 })
  let depth = 0, pageInit = false, guards = 0
  const hasFiles = (e) => !!e.dataTransfer && [...(e.dataTransfer.types || [])].includes('Files')
  function initPage() {
    if (pageInit) return; pageInit = true
    const reset = () => { depth = 0; page.dragging = false; page.count = 0; page.types = [] }
    document.addEventListener('dragenter', (e) => {
      if (!hasFiles(e)) return
      depth++; page.dragging = true
      const items = [...(e.dataTransfer.items || [])].filter((i) => i.kind === 'file')
      page.count = items.length; page.types = items.map((i) => i.type)
    })
    document.addEventListener('dragleave', (e) => { if (!hasFiles(e)) return; depth = Math.max(0, depth - 1); if (!depth || e.relatedTarget === null) reset() })
    // Soltar fuera de un campo: el navegador abriría el archivo y la página perdería lo escrito. Solo mientras haya un campo que lo pida.
    document.addEventListener('dragover', (e) => { if (hasFiles(e) && guards && !e.defaultPrevented) { e.preventDefault(); e.dataTransfer.dropEffect = 'none' } })
    document.addEventListener('drop', (e) => { if (hasFiles(e) && guards && !e.defaultPrevented) e.preventDefault(); reset() })
    document.addEventListener('dragend', reset)
  }

  // Durante el arrastre solo se conoce el tipo MIME (Safari a veces ni eso; nunca el nombre): si accept tiene extensiones,
  // un MIME que no casa con ningún token MIME podría casar por extensión, así que se da por bueno; la decisión final es al soltar
  function dragAccepts(types, accept) {
    if (!accept || !types.length) return true
    const toks = accept.split(',').map((t) => t.trim()).filter(Boolean)
    if (toks.some((t) => t.startsWith('.'))) return true
    return types.every((t) => !t || accepts({ name: '', type: t }, accept))
  }

  let uid = 0
  const REASONS = {
    type: (f, o) => `no es ${describeAccept(o.accept)}`,
    size: (f, o) => `pesa ${fmtSize(f.size, o.locale)}, el máximo es ${fmtSize(o.maxSize, o.locale)}`,
    empty: () => 'está vacío',
    count: (f, o) => `ya hay ${o.max} ${plural(o.max, 'archivo', 'archivos')}, el máximo`,
    duplicate: () => 'ya está en la lista'
  }

  /**
   * useFiles(props, emit, opts): el comportamiento entero de un campo de archivos.
   * props: name, accept, maxSize, max, multiple, readonly, disabled, uploader, modelValue, locale, label, concurrency
   * opts.pageAware: el campo se ilumina cuando se arrastran archivos sobre la página (A)
   */
  function useFiles(props, emit, opts = {}) {
    const id = 'ff' + ++uid
    const input = ref(null), root = ref(null)
    const entries = reactive([])
    const notice = ref(null) // { title, items: [{ name, reason }] } del último gesto con rechazos
    const live = createLive()
    const say0 = live.say
    live.say = (t) => { if (t) { say0(t); opts.onSay && opts.onSay(t); window.FF.log && window.FF.log(props.label, t) } }
    const over = reactive({ on: false, valid: true, full: false, count: 0 })
    let depthZone = 0
    const batch = new Set()
    const o = () => ({ accept: props.accept, maxSize: props.maxSize, max: props.max || (props.multiple ? 0 : 1), locale: props.locale || 'es-MX' })

    const norm = (e) => reactive({ key: e.key || 'f' + ++uid, file: e.file ? markRaw(e.file) : null, name: e.name || e.file?.name, size: e.size ?? e.file?.size ?? 0,
      type: e.type ?? e.file?.type ?? '', state: e.state || (props.uploader ? 'queued' : 'ready'), progress: e.state === 'done' ? 1 : 0, loaded: 0,
      value: e.value ?? null, url: e.url ?? null, error: e.error ?? null, ctrl: null, isNew: !!e.isNew })
    for (const e of props.modelValue || []) entries.push(norm({ ...e, state: e.state || 'done' }))

    const count = computed(() => entries.length)
    const max = computed(() => o().max)
    const full = computed(() => !!max.value && count.value >= max.value && props.multiple !== false && max.value > 1)
    const blocked = computed(() => props.disabled || props.readonly)
    const uploading = computed(() => entries.filter((e) => e.state === 'uploading' || e.state === 'queued').length)
    const failed = computed(() => entries.filter((e) => e.state === 'error').length)
    const done = computed(() => entries.filter((e) => e.state === 'done').length)
    const totalProgress = computed(() => {
      const act = entries.filter((e) => e.state === 'uploading' || e.state === 'queued' || (e.state === 'done' && batch.has(e.key)))
      const t = act.reduce((s, e) => s + e.size, 0)
      return t ? act.reduce((s, e) => s + e.size * e.progress, 0) / t : 0
    })

    // Vista previa: URL de objeto propia (se revoca al quitar y al desmontar); la de la aplicación para los existentes
    const urls = new Map()
    const preview = (e) => {
      if (e.url) return e.url
      if (!e.file || !isImage(e)) return null
      if (!urls.has(e.key)) urls.set(e.key, URL.createObjectURL(e.file))
      return urls.get(e.key)
    }
    const revoke = (k) => { if (urls.has(k)) { URL.revokeObjectURL(urls.get(k)); urls.delete(k) } }

    // El <input type="file"> real lleva SIEMPRE los archivos que están en la lista (envío nativo y FormData)
    function syncInput() {
      const el = input.value; if (!el) return
      try { const dt = new DataTransfer(); for (const e of entries) if (e.file) dt.items.add(e.file); el.files = dt.files } catch (err) { /* navegador sin DataTransfer: queda la última selección */ }
    }
    const plain = (e) => ({ key: e.key, name: e.name, size: e.size, type: e.type, state: e.state, value: e.value, error: e.error, file: e.file })
    function emitModel() { emit('update:modelValue', entries.map(plain)); opts.onChange && opts.onChange() }

    function add(list, via = 'picker') {
      if (blocked.value) return { added: [], rejected: [] }
      const files = [...list]
      if (!files.length) { syncInput(); return { added: [], rejected: [] } } // una selección vacía (cancelar) no borra
      const op = o(), added = [], rejected = []
      const single = !props.multiple
      let room = single ? 1 : (op.max ? op.max - entries.length : Infinity)
      let replaced = null
      for (const f of files) {
        let reason = null
        if (!accepts(f, op.accept)) reason = 'type'
        else if (f.size === 0) reason = 'empty'
        else if (op.maxSize && f.size > op.maxSize) reason = 'size'
        else if (!single && entries.some((e) => e.file && e.name === f.name && e.size === f.size && e.file.lastModified === f.lastModified)) reason = 'duplicate'
        else if (!single && room <= 0) reason = 'count'
        else if (single && added.length) reason = 'count'
        if (reason) { rejected.push({ name: f.name, reason, text: REASONS[reason](f, op) }); continue }
        added.push(f); if (!single) room--
      }
      if (single && added.length && entries.length) { replaced = entries[0].name; drop(entries[0]) }
      const fresh = added.map((f) => norm({ file: f, isNew: true }))
      entries.push(...fresh)
      fresh.forEach((e) => batch.add(e.key))
      notice.value = rejected.length ? { items: rejected, via } : null
      syncInput()
      if (fresh.length || replaced) emitModel()
      // Un anuncio por gesto: lo añadido y lo rechazado juntos
      const parts = []
      if (replaced && fresh.length) parts.push(`${replaced} reemplazado por ${fresh[0].name}.`)
      else if (fresh.length === 1) parts.push(`Añadido ${fresh[0].name}.`)
      else if (fresh.length) parts.push(`Añadidos ${fresh.length} archivos.`)
      if (rejected.length === 1) parts.push(`No se añadió ${rejected[0].name}: ${rejected[0].text}.`)
      else if (rejected.length) parts.push(`No se añadieron ${rejected.length} archivos: ` + rejected.map((r) => `${r.name}, ${r.text}`).join('; ') + '.')
      if (fresh.length && props.uploader) parts.push(plural(fresh.length, 'Subiendo.', 'Subiendo {n}.'))
      live.say(parts.join(' '))
      pump()
      return { added: fresh, rejected }
    }

    function drop(e) { // quita sin anunciar ni mover el foco
      if (e.ctrl) { e.ctrl.abort(); e.ctrl = null }
      revoke(e.key); batch.delete(e.key)
      const i = entries.indexOf(e); if (i >= 0) entries.splice(i, 1)
    }

    // Quitar: el foco va a la acción equivalente del siguiente, si no del anterior, si no al control de elegir
    function remove(key, how = 'remove') {
      const i = entries.findIndex((e) => e.key === key); if (i < 0) return
      const e = entries[i], wasUp = e.state === 'uploading' || e.state === 'queued'
      const next = entries[i + 1] || entries[i - 1] || null
      drop(e); syncInput(); emitModel()
      const left = entries.length
      live.say(how === 'cancel' || (wasUp && props.uploader) ? `Subida de ${e.name} cancelada. ${left ? plural(left, 'Queda 1 archivo.', 'Quedan {n} archivos.') : 'Sin archivos.'}`
        : `Quitado ${e.name}. ${left ? plural(left, 'Queda 1 archivo.', 'Quedan {n} archivos.') : 'Sin archivos.'}`)
      nextTick(() => {
        const r = root.value; if (!r) return
        const t = next && r.querySelector(`[data-key="${next.key}"] [data-act="remove"]`)
        ;(t || opts.focusAfterEmpty?.() || input.value)?.focus()
      })
      pump()
    }
    function retry(key) {
      const e = entries.find((x) => x.key === key); if (!e || e.state !== 'error') return
      e.state = 'queued'; e.error = null; e.progress = 0; batch.add(e.key)
      emitModel(); live.say(`Reintentando ${e.name}.`)
      nextTick(() => root.value?.querySelector(`[data-key="${key}"] [data-act="remove"]`)?.focus())
      pump()
    }
    function retryAll() { entries.filter((e) => e.state === 'error').forEach((e) => { e.state = 'queued'; e.error = null; e.progress = 0; batch.add(e.key) }); emitModel(); live.say('Reintentando.'); pump() }

    // Cola de subida con concurrencia fija; el adaptador hace la red
    function pump() {
      if (!props.uploader) return
      let running = entries.filter((e) => e.state === 'uploading').length
      for (const e of entries) {
        if (running >= (props.concurrency || 2)) break
        if (e.state === 'queued' && e.file) { start(e); running++ }
      }
    }
    async function start(e) {
      e.state = 'uploading'; e.progress = 0; e.loaded = 0
      const ctrl = markRaw(new AbortController()); e.ctrl = ctrl
      emitModel()
      try {
        const r = await props.uploader(e.file, { signal: ctrl.signal, progress: (l, t) => { e.loaded = l; e.progress = t ? l / t : 0 } })
        if (ctrl.signal.aborted) return
        e.state = 'done'; e.progress = 1; e.value = r && r.value != null ? r.value : null; e.ctrl = null
      } catch (err) {
        if (ctrl.signal.aborted || err?.name === 'AbortError') return
        e.state = 'error'; e.error = err?.message || 'No se pudo subir'; e.ctrl = null
        live.say(`No se pudo subir ${e.name}: ${e.error}.`)
      }
      emitModel(); settle(); pump()
    }
    // Cierre de lote: un solo anuncio cuando todo lo que se añadió en este tramo ha terminado
    function settle() {
      const mine = entries.filter((e) => batch.has(e.key))
      if (mine.some((e) => e.state === 'uploading' || e.state === 'queued')) return
      const ok = mine.filter((e) => e.state === 'done').length
      if (ok) live.say(ok === 1 ? `${mine.find((e) => e.state === 'done').name} subido.` : `${ok} archivos subidos.`)
      batch.clear()
    }

    // ---------- Gestos ----------
    function onChange() { add(input.value.files, 'picker') }
    // Solo lectura y lleno: el control sigue enfocable y en el envío, pero no abre el selector
    function onClick(ev) { if (props.readonly || full.value) ev.preventDefault() }
    function open() { if (!blocked.value && !full.value) input.value?.click() }
    function onPaste(ev) {
      const files = [...(ev.clipboardData?.files || [])]
      if (!files.length || blocked.value) return
      ev.preventDefault(); add(files, 'paste')
    }
    const dragTypesOk = (ev) => {
      const items = [...(ev.dataTransfer?.items || [])].filter((i) => i.kind === 'file')
      return { ok: dragAccepts(items.map((i) => i.type), props.accept) && !full.value, full: full.value, count: items.length }
    }
    const zone = {
      onDragenter(ev) { if (!hasFiles(ev) || blocked.value) return; ev.preventDefault(); depthZone++; const t = dragTypesOk(ev); over.on = true; over.valid = t.ok; over.full = t.full; over.count = t.count },
      onDragover(ev) { if (!hasFiles(ev) || blocked.value) return; ev.preventDefault(); ev.dataTransfer.dropEffect = over.valid ? 'copy' : 'none' },
      onDragleave(ev) { if (!hasFiles(ev)) return; depthZone = Math.max(0, depthZone - 1); if (!depthZone) over.on = false },
      onDrop(ev) { if (!hasFiles(ev)) return; ev.preventDefault(); depthZone = 0; over.on = false; if (!blocked.value) add(ev.dataTransfer.files, 'drop') }
    }

    onMounted(() => { initPage(); guards++; syncInput() })
    onBeforeUnmount(() => { guards--; live.dispose(); entries.forEach((e) => e.ctrl && e.ctrl.abort()); urls.forEach((u) => URL.revokeObjectURL(u)) })

    const statusText = computed(() => {
      const n = count.value
      if (!n) return 'Ningún archivo'
      const bits = [max.value > 1 ? `${n} de ${max.value}` : plural(n, '1 archivo', '{n} archivos')]
      if (uploading.value) bits.push(`${uploading.value} subiendo`)
      if (failed.value) bits.push(plural(failed.value, '1 con error', '{n} con error'))
      return bits.join(' · ')
    })
    const hint = computed(() => {
      const op = o(), b = []
      if (op.accept) b.push(describeAccept(op.accept))
      if (op.maxSize) b.push('hasta ' + fmtSize(op.maxSize, op.locale) + (props.multiple ? ' cada uno' : ''))
      if (props.multiple && op.max) b.push('máximo ' + op.max)
      return b.join(' · ')
    })

    return { id, input, root, entries, notice, live, over, page, full, blocked, uploading, failed, done, count, max, totalProgress, statusText, hint,
      preview, add, remove, retry, retryAll, open, onChange, onClick, onPaste, zone, syncInput }
  }

  window.FF = { useFiles, dragAccepts, fmtSize, extOf, isImage, iconOf, accepts, describeAccept, plural, listNames, fakeUpload, net, SAMPLES, pngFile, blobFile, page, initPage }
})()
