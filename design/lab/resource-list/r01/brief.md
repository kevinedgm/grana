# Brief — `GResourceList` (Grana Blocks), r01: base funcional y tres conceptos de pantalla

> kiwi, 2026-10-20. Origen: página de Notion «Grana Blocks» (2026-10-05) y DECISIONS #708 (paquete aparte `@grana/blocks`, `packages/blocks/`, `private`, `0.0.0`). Primer block. Base funcional (HTML, WAI-ARIA APG, WCAG 2.2) **y** tres conceptos divergentes de la **pantalla completa** (A/B/C) prototipados con los **componentes reales de `packages/vue/dist`** y el tema por defecto.

## Para qué

La pantalla de gestión que toda aplicación de negocio repite: **ver** un conjunto de recursos, **encontrar** uno, **revisarlo**, **crearlo**, **cambiarlo** y **retirarlo**, sin perder dónde estaba la persona. Caso real del prototipo: las **tinas de fermentación de un palenque** (PULZ): 46 tinas, cinco estados, alertas por días y temperatura, permisos por estado («no se edita mientras destila», «solo se da de baja una tina sin mosto»). Usuarios: maestros mezcaleros y administración, en escritorio y en el teléfono junto a la tina, con teclado y con lector de pantalla.

## La premisa que se cuestiona

Todos los frameworks traen la misma caja: **cabecera + barra de filtros + tabla + paginación + modal de editar + modal de «¿seguro?»**. Funciona, pero cobra tres impuestos que el usuario final paga en cada uso:

1. **El editor tapa lo que se estaba mirando** (modal centrado): se edita de memoria y, al cerrar, la fila editada se busca otra vez.
2. **La confirmación interrumpe y no protege**: un «¿Seguro?» que se acepta por reflejo; la protección real es poder deshacer.
3. **La consulta no se lee**: chips y controles dicen qué filtros hay, no qué se está viendo.

Cada concepto ataca una premisa distinta: **A · En su sitio** (no hay capas: la fila se abre en su formulario y quitar deja una huella con «Deshacer»), **B · Lente** (la lista es el navegador y la ficha vive al lado, en la página, no encima) y **C · La frase** (la consulta se lee como una frase y la pantalla empieza por lo que pide atención).

## Qué NO es (de Notion y #708)

Sin `fetch`, sin endpoints, sin Pinia ni Supabase; no valida ni guarda (lo hace la aplicación y el block lo refleja); no es un generador; no sustituye a los atómicos. **Transparente:** props, eventos de intención y slots.

## Inventario de reutilización (revisado antes de proponer)

La página de Notion es del 2026-10-05; desde entonces Grana ya trae casi todo lo que el block necesita. El block **ensambla**; no repinta ninguna de estas piezas.

| Parte de la pantalla | Lo cubre | Cómo lo usa el block |
| --- | --- | --- |
| Título, descripción, acción principal | **`GPageHeader`** (B · zócalo, muelle en estrecho, `actions` con `{ narrow, docked }`, entrada propia) | Raíz del block; la acción «crear» va en su slot `actions`; en estrecho, solo icono con nombre y `tooltip` (receta del contrato) |
| Búsqueda libre | **`GInput type="search"`** en una región `search` | Sin componente nuevo; cambia `filters` desde fuera (#569 ya anuncia el recuento) |
| Filtros | **`GFilterBar`** dentro de **`GTable`** (`filter` en las columnas) | Columnas como objetos; `filterMode="external"` |
| Tabla en escritorio, tarjetas en móvil | **`GTable`** `responsive="auto"` (mismo DOM, `thead` oculto presente, etiquetas por celda) | Sin repintar; la regla «no perder nombres de columna» ya la cumple |
| Carga, refresco, error con reintento | **`GTable`** (#540: retraso 200 ms, mínimo 400 ms, «sigue cargando» a 5 s, barra `failed` con `retry`, foco por `rowKey`) | `loading`, `error`, evento `retry` |
| Vacío inicial / de filtro / sin acceso | **`GEmpty`** (`none`, `filtered` con la salida «Quitar «…» · vuelven N», `forbidden`) dentro del slot `empty` de `GTable` | Las causas distintas que pide Notion ya existen; **no** se crean `GEmptyState/GLoadingState/GErrorState` |
| Paginación y filas por página | **`GTable`** + **`GPagination`** (pie acoplado, fila ancla, anuncio del rango) | `page`, `pageSize`, `pageSizes`, `total` |
| Estado de fila | **`GTable` `rowStatus`** (lomo, sello en la causa) | Pasa tal cual |
| Abrir una fila | **`GTable` puerta** (`rowHref`/`activatable`) y **despliegue** (slot `detail`) | A usa el despliegue; B, la puerta `activatable` |
| Menú de fila | **`GMenu`** (con `danger`, iconos de la librería) | Editar · Duplicar · Dar de baja |
| Editor en diálogo / hoja lateral / pantalla completa | **`GDialog`** (`from`, `placement="end"`, `mobile`) | base y C; B en el teléfono |
| Formulario | **`GForm`** y su sistema (filas, errores, envío) | Slot `form` de la aplicación |
| Confirmación explícita | **`GDialog role="alertdialog"`**; confirmación en el sitio de **`GFab`** (#662) como patrón | base: `alertdialog`; B y C: en el sitio |
| Resultado y «Deshacer» | **`GToast`** con `action` | La aplicación lo pone (base, B, C) |
| Ficha de lectura | **`GDataList`**, **`GBadge`**, **`GSummary`** | B |
| Cuentas por estado | Receta del `summary` de **`table.md`** (#601, cuentas sin su propio filtro) | C: facetas |
| Anuncios del block | Canal cortés de página (`announcePage`, #533) | Hoy es interno (`__shared`): hallazgo |
| Disponibilidad y permisos | Regla 1 de **«Acciones con acuse»** (`api.md`, #643): ausente/`true`, `false` oculta, String = motivo | El mapa `actions` del block |
| FAB | **`GFab`** | **No** se usa: `fab.md` manda las acciones de la página a `GPageHeader` (no duplicar) |
| Isla de estado | **`GStatusIsland`** | Fuera: el fallo de carga ya es de `GTable`; con la isla, `announceError: false` |

## Qué es esta ronda

1. **Base funcional** (forma convencional a propósito, con los componentes reales): para medir contra ella.
2. **Tres conceptos de pantalla completa** con premisas distintas (A · En su sitio, B · Lente, C · La frase), en escritorio y teléfono.
3. **Auditoría previa y posterior** de la vista de gestión (`docs/documentacion/auditoria-visual.md`) y rúbrica de movimiento donde aplica.
4. **API propuesta** para lima (punto de partida: la de Notion, corregida por lo que ya existe), **huecos** de los componentes existentes (enmiendas, no cosas a rehacer en el block), comparativa, recomendación y **una** pregunta.

## Entregables

- `index.html` (`?c=base|A|B|C`, `&data=ok|empty|fail|slow|forbidden`, `&dir=rtl`, `&dark=1`), `rl.js` (el block de laboratorio y la página de la aplicación), `tinas.js` (la aplicación: datos y servidor simulado), `rl.css` (solo lo que el block añade; solo `var(--g-*)`).
- `verificar.mjs` (Playwright en Chromium, Firefox y WebKit, **puerto 4211**; partes `base,A,B,C,estados,movil,auditoria`; `SHOTS=1` guarda capturas en `capturas/`).
- `declaracion.md`: anatomía, decisiones numeradas, auditoría previa, conceptos con «Qué lo hace distinto», auditoría posterior medida, comparativa, recomendación, API propuesta, hallazgos para lima y la pregunta.

## Ver

`python3 -m http.server 4211` desde la raíz del repo y abrir `/design/lab/resource-list/r01/index.html`. Requiere `packages/vue/dist` (`npm run build`) y `node_modules/vue`.
