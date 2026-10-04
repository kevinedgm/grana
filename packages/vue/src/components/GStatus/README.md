# GStatus

Condición **declarativa** de la isla de estado, **sin pintura**: mientras el componente está montado, su condición existe. Sirve para que el fallo de una vista no sobreviva a la vista (por ejemplo, «No se pudieron cargar las facturas» mientras `loadFailed` sea verdadero). Es parte del sistema de la isla: **la documentación completa está en [`GStatusIsland/README.md`](../GStatusIsland/README.md)** (modelo de una condición, anuncios, foco, instalación, accesibilidad medida y limitaciones).

**Etiqueta:** `<g-status>` · **Entrada:** `@grana/vue/status` (la registra `app.use(status)`) · **Estado:** `candidate` · **Desde:** 0.1.0

```vue
<GStatus v-if="loadFailed" id="invoices" type="error" title="No se pudieron cargar las facturas"
         description="El servidor tardó demasiado en responder."
         :action="{ label: 'Reintentar', busyLabel: 'Cargando…', onClick: reload }"
         :origin="{ label: 'Ir a Facturas', target: 'invoices-region' }"
         @remove="loadFailed = false" />
```

## Props

| Prop | Tipo | Por defecto | Qué es |
| --- | --- | --- | --- |
| `id` | String \| Number | **obligatoria** | Clave de la condición |
| `type` | String | `info` | `info` `success` `warning` `error` |
| `title` | String | | **Obligatorio** para registrar la condición (sin título avisa y no se registra) |
| `description` · `details` · `action` · `link` · `origin` · `persistent` · `dismissible` · `deadline` · `politeness` | | los del modelo | Como en «Modelo de una condición» de la isla |
| `status` | Object | el gestor inyectado | Gestor de `createStatus` |

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `remove` | `reason` | La condición se retiró por una vía distinta de su propio desmontaje (`dismiss`, `acknowledge`, `api`, `clear`): apaga tu `v-if` |
| `expire` | | `deadline` llegó a cero (la condición no se quita sola) |

Sin slots.

## Comportamiento

- **Al montar** hace `set(id, props)`; **al cambiar una prop** hace `update`; **al desmontar** hace `remove` (motivo `unmount`, que no emite `remove`). Cambiar `id` retira la condición anterior y declara la nueva.
- **Retirada con el componente aún montado** (la persona la descartó o la reconoció): **no se vuelve a registrar** hasta que el componente se monte de nuevo; por eso existe `@remove`.
- **Anuncios:** montado junto con la isla al cargar, no anuncia; montado después (una vista nueva, un fallo), anuncia como cualquier condición nueva.
- **Dos `<GStatus>` con el mismo `id`:** avisa en desarrollo. **Sin gestor:** avisa y no registra nada. **En el servidor** no hace nada.
- Los eventos `remove` y `expire` están declarados en `emits` (no llegan al DOM).

## Fuentes

- API: [`GStatus.meta.json`](./GStatus.meta.json) · Contrato: [`design/contracts/status.md`](../../../../../design/contracts/status.md) («`GStatus`», #318) · Auditoría: [`design/lab/alert/auditoria.md`](../../../../../design/lab/alert/auditoria.md)
