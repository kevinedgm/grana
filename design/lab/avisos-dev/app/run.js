// Común a todos los modos (empaquetado, ESM sin empaquetar y UMD): recoge los avisos «[Grana» y cualquier error.
export function run(createApp, h, Grana) {
  const out = []
  const orig = console.warn
  // «[Grana» sin escribirlo junto: el banco busca ese texto en el JS de producción
  console.warn = (...args) => { const m = String(args[0]); if (m.charCodeAt(0) === 91 && m.slice(1, 6) === 'Grana') out.push(m); orig(...args) }
  window.addEventListener('error', (e) => out.push(`THROW ${e.message}`))
  try {
    const el = document.getElementById('app')
    createApp({
      render: () => h('div', [
        h(Grana.GDialog, { modelValue: true, title: 'Banco' }, { default: () => 'contenido' }),
        h(Grana.GTable, { columns: [{ key: 'a', label: 'A' }], rows: [{ id: 1, a: 'x' }], rowKey: 'id' })
      ])
    }).mount(el)
  } catch (e) {
    out.push(`THROW ${e && e.message}`)
  }
  setTimeout(() => {
    console.warn = orig
    window.__out = out
    document.title = 'done'
  }, 300)
}
