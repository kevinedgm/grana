// «La aplicación» del caso real: tinas de fermentación de un palenque (PULZ). NO es del block: es lo que el block nunca hace
// (datos, consulta, guardado). Servidor simulado en memoria con latencia, para que el block solo emita intención y reciba
// rows/total/loading/error, como en una aplicación real. window.TINAS = { api, ESTADOS, AGAVES, MAESTROS }.
;(() => {
  const AGAVES = ['Espadín', 'Tobalá', 'Tepeztate', 'Cuishe', 'Madrecuishe', 'Arroqueño']
  const MAESTROS = ['Aurelio Cruz', 'Rosa Martínez', 'Fidel Hernández', 'Lucía Santiago', 'Tomás Pérez']
  const ESTADOS = [
    { value: 'fermentando', label: 'Fermentando' },
    { value: 'lista', label: 'Lista para destilar' },
    { value: 'destilando', label: 'Destilando' },
    { value: 'limpieza', label: 'En limpieza' },
    { value: 'vacia', label: 'Vacía' }
  ]
  const ESTADO = Object.fromEntries(ESTADOS.map((e) => [e.value, e.label]))
  // Generador determinista (mismas tinas en cada carga y en cada motor)
  let seed = 7
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }
  const pick = (a) => a[Math.floor(rnd() * a.length)]
  const make = (n) => {
    const estado = pick(['fermentando', 'fermentando', 'fermentando', 'lista', 'destilando', 'limpieza', 'vacia'])
    const activa = estado === 'fermentando' || estado === 'lista'
    return {
      id: 'T-' + String(n).padStart(2, '0'),
      codigo: 'T-' + String(n).padStart(2, '0'),
      agave: estado === 'vacia' || estado === 'limpieza' ? '—' : pick(AGAVES),
      estado,
      dias: activa ? 2 + Math.floor(rnd() * 10) : null,
      volumen: [1200, 1500, 1800, 2000, 2500][Math.floor(rnd() * 5)],
      temp: activa ? Math.round((24 + rnd() * 11) * 10) / 10 : null,
      maestro: pick(MAESTROS),
      lote: activa ? 'L-26-' + String(20 + Math.floor(rnd() * 30)).padStart(3, '0') : '—'
    }
  }
  let db = Array.from({ length: 46 }, (_, i) => make(i + 1))
  let next = 47
  // Estado de fila (rowStatus de GTable): lo calcula la aplicación, no el block
  const status = (r) => {
    if (r.estado === 'fermentando' && r.dias > 9) return { status: 'error', text: 'Pasa de 9 días', key: 'dias' }
    if (r.temp != null && r.temp > 32) return { status: 'warning', text: 'Temperatura alta', key: 'temp' }
    return null
  }
  const severity = (r) => { const s = status(r); return s ? (s.status === 'error' ? 0 : 1) : 2 }
  const norm = (s) => String(s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  const textOf = (r, keys) => keys.map((k) => r[k]).join(' ')
  const test = (r, f, cols) => {
    if (f.key === 'atencion') return !!status(r)
    const col = cols.find((c) => c.key === f.key)
    const type = col?.filter?.type
    const fields = col?.filter?.fields || (col?.title ? [col.title, col.subtitle].filter(Boolean) : [f.key])
    const v = type === 'text' ? norm(textOf(r, fields)) : r[f.key]
    switch (f.op) {
      case 'contains': return v.includes(norm(f.value))
      case 'is': return v === norm(f.value)
      case 'starts': return v.startsWith(norm(f.value))
      case 'in': return f.value.includes(r[f.key])
      case 'gt': return v != null && v > f.value
      case 'lt': return v != null && v < f.value
      case 'eq': return v === f.value
      case 'between': return v != null && v >= f.value[0] && v <= f.value[1]
      default: return true
    }
  }
  // Fallos y lentitud a la carta (barra del laboratorio)
  const lab = { failNext: false, slow: false, empty: false, forbidden: false, latency: 450 }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const api = {
    lab,
    status,
    get size () { return db.length },
    // query = { search, filters, sort, page, pageSize } → { rows, total, counts }
    async list (q, cols) {
      await wait(lab.slow ? 6000 : lab.latency)
      if (lab.forbidden) { const e = new Error('forbidden'); e.code = 403; throw e }
      if (lab.failNext) { lab.failNext = false; throw new Error('No responde el servidor del palenque') }
      const all = lab.empty ? [] : db
      const s = norm(q.search)
      const base = all.filter((r) => !s || norm(textOf(r, ['codigo', 'agave', 'maestro', 'lote'])).includes(s))
      const apply = (rows, except) => rows.filter((r) => (q.filters || []).every((f) => f.key === except || test(r, f, cols)))
      let rows = apply(base)
      // Cuentas por estado SIN su propio filtro (receta del summary de table.md, #601)
      const forCounts = apply(base, 'estado')
      const counts = Object.fromEntries(ESTADOS.map((e) => [e.value, forCounts.filter((r) => r.estado === e.value).length]))
      counts.atencion = forCounts.filter((r) => status(r)).length
      const sort = q.sort
      if (sort && sort.key === 'atencion') rows = [...rows].sort((a, b) => severity(a) - severity(b) || a.codigo.localeCompare(b.codigo))
      else if (sort) {
        const key = sort.key === 'tina' ? 'codigo' : sort.key
        const dir = sort.direction === 'descending' ? -1 : 1
        rows = [...rows].sort((a, b) => {
          const x = a[key]; const y = b[key]
          if (x == null && y == null) return 0
          if (x == null) return 1
          if (y == null) return -1
          return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y), 'es')) * dir
        })
      }
      // Salida del vacío (GEmpty): cuántas volverían quitando SOLO cada filtro, y cuántas hay sin ninguno
      const returns = { __all: all.length }
      if (q.search) returns.__search = apply(all).length
      ;(q.filters || []).forEach((f) => { returns[f.key] = apply(base, f.key).length })
      const total = rows.length
      const size = q.pageSize || 10
      const page = Math.min(q.page || 1, Math.max(1, Math.ceil(total / size)))
      return { rows: rows.slice((page - 1) * size, page * size).map((r) => ({ ...r })), total, page, counts, returns }
    },
    async save (item) {
      await wait(lab.latency)
      if (lab.failNext) { lab.failNext = false; throw new Error('No se pudo guardar') }
      if (item.id && db.some((r) => r.id === item.id)) {
        db = db.map((r) => (r.id === item.id ? { ...r, ...item } : r))
        return { ...item }
      }
      const id = 'T-' + String(next++).padStart(2, '0')
      const row = { dias: item.estado === 'fermentando' ? 0 : null, temp: null, lote: '—', ...item, id, codigo: id }
      db = [row, ...db]
      return { ...row }
    },
    async remove (ids) {
      await wait(lab.latency)
      const gone = db.filter((r) => ids.includes(r.id))
      db = db.filter((r) => !ids.includes(r.id))
      return gone
    },
    async restore (rows) {
      await wait(lab.latency / 2)
      db = [...rows, ...db].sort((a, b) => a.id.localeCompare(b.id))
    }
  }
  window.TINAS = { api, AGAVES, MAESTROS, ESTADOS, ESTADO }
})()
