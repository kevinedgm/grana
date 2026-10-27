import { createIsland, type ActivityHandle } from '../../types/index';
import { createManager, Drop } from '../../types/core';

const island = createIsland({ labels: { close: 'Cerrar' } });
const h: ActivityHandle = island.show({ title: 'Subiendo', progress: 10, actions: [{ label: 'Cancelar', onSelect: (x) => x.dismiss() }] });
h.update({ progress: 50 });
h.on('statechange', (e) => e.state satisfies 'queued' | 'entering' | 'compact' | 'expanded' | 'dismissing' | 'removed');
const off = island.on('reservedchange', (e) => e.height.toFixed());
off();
island.promise(Promise.resolve(1), { loading: 'Cargando', success: (v) => `Listo ${v}`, error: 'Falló' });
createManager().snapshot();
new Drop().step(1 / 240);

// @ts-expect-error title es obligatorio
island.show({ body: 'sin título' });
// @ts-expect-error intent desconocido
island.show({ title: 'x', intent: 'danger' });
// @ts-expect-error no hay props de estilo
island.show({ title: 'x', color: 'red' });
// @ts-expect-error icon no acepta cadenas HTML
island.show({ title: 'x', icon: '<img>' });
