# GStatusMark

Marca **en línea** de la isla de estado. Con `for` es la **cápsula junto al origen** de una condición (el botón «Guardar», el hueco de las filas de una tabla) que abre la isla en su aviso; sin `for` es una **línea de texto** (insignia, texto y una acción opcional) para una advertencia que es **contenido** de una sección, tarjeta o diálogo y que no entra en la isla. Es parte del sistema de la isla: **la documentación completa está en [`GStatusIsland/README.md`](../GStatusIsland/README.md)** (qué va a la isla y qué no, instalación, anuncios, foco, accesibilidad medida, tema y limitaciones).

**Etiqueta:** `<g-status-mark>` · **Entrada:** `@grana/vue/status` (la registra `app.use(status)`) · **Estado:** `candidate` · **Desde:** 0.1.0

```vue
<!-- Enlace: junto al origen, antes del botón; tipo y busy salen de la condición -->
<GFormActions>
  <GStatusMark for="save" v-slot="{ type, busy }">{{ type === 'success' ? 'Guardada' : busy ? 'Reintentando…' : 'No se guardó' }}</GStatusMark>
  <GBtn type="submit">Guardar</GBtn>
</GFormActions>

<!-- Texto: contenido de la sección, no entra en la isla -->
<GStatusMark type="warning">
  Tu tarjeta caduca este mes.
  <template #action><GBtn size="sm" variant="outline" color="neutral">Actualizar</GBtn></template>
</GStatusMark>
```

## Props

| Prop | Tipo | Valores | Por defecto | Qué es |
| --- | --- | --- | --- | --- |
| `for` | String \| Number | `id` de una condición | sin valor | Con valor, la marca es un enlace a esa condición |
| `type` | String | `info` `success` `warning` `error` | `info` | **Solo sin `for`** (con `for`, el tipo es el de la condición; pasar los dos avisa y se ignora `type`) |
| `typeLabel` | String | texto libre | `labels.types[type]` del gestor | Prefijo oculto de tipo («Advertencia: ») |
| `status` | Object | | el gestor inyectado | Gestor de `createStatus` |

Sin eventos propios.

## Slots

| Slot | Propósito |
| --- | --- |
| `default` | Texto **corto**, solo texto. Con `for`: alcance `{ condition, type, busy }` y, sin slot, el `title` de la condición. Sin `for`: alcance `{ type, busy }` |
| `action` | **Solo sin `for`:** una acción opcional (`GBtn size="sm"`), después del texto y fuera del `p` |

## Comportamiento

- **Enlace (`for`):** un `button` que **existe solo mientras exista la condición** (sin ella no renderiza nada) y que no se renderiza en el servidor (aparece al montar). Su tipo y su `busy` **se derivan de la condición**, no son props: la marca y la isla nunca dicen cosas distintas. `aria-expanded` = la isla está abierta, con `aria-controls` al panel; en móvil `aria-haspopup="dialog"` y sin esos dos. Con `busy`: `is-busy` y `aria-busy="true"`, y la insignia gira.
- **Al activarla:** guarda la marca como elemento de vuelta, abre la isla en su condición y el foco va, dentro de ella, a la **acción** si está habilitada; si no, a «Ir a…», al enlace, a descartar o al propio aviso. La vuelta es `Alt+F8` o «Ir a…» (que lleva al origen); al cerrar la hoja móvil, el foco vuelve a la marca. **Nunca anuncia nada**, ni a la ida ni a la vuelta.
- **Dónde ponerla (no empuja nada):** en `GFormActions`, como hijo del slot por defecto **antes** del botón (la fila alinea al final; medido Δ 0px de «Guardar»); en `GTable`, dentro del slot `empty`. **Nunca en el slot `status` de `GFormActions`**: es `role="status"` y duplicaría el anuncio.
- **Texto (sin `for`):** un `div` con insignia, un `p` y la acción opcional; sin caja, sin detalle ni varias acciones (eso es de la isla). **Estática: no anuncia, no se cierra.** Si debe anunciarse al aparecer, es una condición de la isla y no una marca de texto. Insignia sin relleno (anillo e icono en el color `-text` del tipo) para que se lea como contenido y no como una segunda isla; a 320px las líneas y la acción quedan alineadas con el texto.
- **Sin gestor:** la marca de texto se dibuja igual (necesita `typeLabel` para su prefijo; sin él avisa en desarrollo); la marca con `for` no pinta nada y avisa.

## Accesibilidad (medida, ver la isla)

Tipo sin color: forma del icono, prefijo de texto oculto y estilo del anillo de la insignia (sólido, discontinuo, punteado). Cápsula con área ≥ 24px y ≥ 44px con `pointer: coarse` (por un `::after`); mide 134 × 32px con el tema por defecto. Contraste mínimo en ocho temas y tres motores: marca enlace y texto de la marca de texto **15,22:1**, icono y anillo de la marca de texto **4,52:1**, anillo de foco exterior de la marca **4,61:1**. Con movimiento reducido, el icono de «reintentando» no gira. `forced-colors` (emulado): borde `CanvasText`. Sin verificar con lector de pantalla real.

## Tema

Sin tokens propios. La marca enlace usa la superficie inversa de la isla (`--g-color-text` de fondo, `--g-color-surface` de texto); la marca de texto, `--g-color-{tipo}-text` en la insignia y `--g-color-text` en el texto. Ver «Tema» en la isla.

## Clases

`g-status-mark`, `g-status-mark--link` o `--text`, `g-status-mark--type-{info|success|warning|error}`, `data-type`, `is-busy`; `g-status-mark__badge`, `__text`, `__type`, `__action`.

## Fuentes

- API: [`GStatusMark.meta.json`](./GStatusMark.meta.json) · Contrato: [`design/contracts/status.md`](../../../../../design/contracts/status.md) («`GStatusMark`», #323) · Prototipo: [`design/lab/alert/r02/`](../../../../../design/lab/alert/r02/) · Auditoría: [`design/lab/alert/auditoria.md`](../../../../../design/lab/alert/auditoria.md)
