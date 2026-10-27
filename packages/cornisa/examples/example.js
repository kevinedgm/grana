import { createIsland } from '../src/index.js';

const island = createIsland({ labels: { close: 'Cerrar', more: (n) => `Mostrar la siguiente (${n} en espera)` } });
window.island = island;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const demos = {
  toast: () => island.show({ title: 'Cambios guardados', intent: 'success' }),
  async upload() {
    const h = island.show({ title: 'Subiendo informe.pdf', progress: 0, duration: 'persistent', actions: [{ label: 'Cancelar', onSelect: (x) => x.dismiss('cancel') }] });
    for (let p = 5; p <= 100; p += 5) { await wait(180); if (!h.update({ progress: p, body: `${(p * 0.08).toFixed(1)} MB de 8 MB` })) return; }
    h.update({ title: 'Informe subido', intent: 'success', progress: null, body: 'Disponible en Documentos.', actions: [{ label: 'Abrir' }], duration: 5000 });
  },
  promise: () => island.promise(wait(1800).then(() => 42), {
    loading: 'Calculando totales',
    success: (v) => ({ title: `Total listo: ${v} registros` }),
    error: 'No se pudo calcular',
  }),
  timer: () => island.show({ id: 'pomodoro', title: 'Pomodoro', timer: { endsAt: Date.now() + 25 * 60e3 }, duration: 'persistent', body: 'Bloque 2 de 4', actions: [{ label: 'Detener', onSelect: (h) => h.dismiss('stop') }] }),
  media: () => island.show({ id: 'media', title: 'Episodio 12 · Diseño sin color', duration: 'persistent', body: 'Podcast de ejemplo · 18:20 / 41:05', actions: [{ label: 'Pausar' }, { label: '+15 s' }] }),
  undo: () => island.show({ title: 'Conversación archivada', duration: 8000, actions: [{ label: 'Deshacer', onSelect: (h) => { h.dismiss('undo'); island.show({ title: 'Archivado deshecho', intent: 'success' }); } }] }),
  error: () => island.show({ title: 'No se pudo subir informe.pdf', intent: 'error', priority: 'high', body: 'Se perdió la conexión. El archivo sigue en tu dispositivo.', actions: [{ label: 'Reintentar' }] }),
  burst() { island.show({ title: 'Sincronizado', intent: 'success' }); island.show({ title: '3 comentarios nuevos' }); island.show({ title: 'Recordatorio: reunión 10:30', priority: 'low' }); },
  long: () => island.show({ title: 'Sincronización completada para «Presupuesto anual del departamento de operaciones internacionales 2026»', duration: 'persistent', body: 'Se actualizaron 1.284 filas en 37 hojas.', actions: [{ label: 'Ver cambios' }, { label: 'Descartar', onSelect: (h) => h.dismiss() }] }),
  clear: () => island.dismissAll(),
};
document.querySelector('.grid').addEventListener('click', (e) => { const b = e.target.closest('[data-demo]'); if (b) demos[b.dataset.demo](); });
