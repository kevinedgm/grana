# Contrato de API y máquina de estados: v0 APROBADA (2026-10-26)

> Paquete: `cornisa`. Varias actividades = una gota con «+N» (`maxVisible` queda fijo en 1 en el MVP). Tokens: `--cornisa-*`. Altura expuesta: `--cornisa-reserved` + evento `reservedchange`. Las fases de la gota son internas del renderer.

Deriva de la estructura r01 (kiwi) y de las reglas de `skills/lima/reference/component-api.md`: la API expresa **intención, contenido y comportamiento**, nunca estilo; no hay variantes inventadas; el estado lo controla el consumidor. Todavía **no** está registrado en el registry, porque lima registra cuando la estructura queda aprobada.

## 1. Capas
```
core   (sin DOM)  machine.js · manager.js (cola/prioridad/huecos) · announcer-model.js · clock inyectable
dom    renderer.js (FLIP + WAAPI interrumpible) · live-regions.js · keyboard.js · popover-or-fixed.js
css    tokens --isl-* + estilos base neutros (sin identidad)
```
- `core` se ejecuta en Node sin jsdom, con un reloj falso que permite tests deterministas.
- `dom` se suscribe a los eventos de `core`; `core` nunca importa `dom`.
- El render va por lotes en microtarea (hallazgo H-06).

## 2. API pública (imperativa, basada en funciones)
```js
import { createIsland } from '<nombre>';          // ESM, 0 dependencias

const island = createIsland({
  container?: HTMLElement,          // por defecto document.body
  labels?: { region, expand, collapse, close, more: n => string },   // i18n; nada de texto fijo
  maxVisible?: 1 | 2,               // por defecto 2 (primaria + secundaria)
});

const a = island.show({
  id?: string,                      // si ya existe → equivale a update() (idempotente)
  intent?: 'neutral' | 'success' | 'warning' | 'error',
  icon?: Node,                      // nodo del consumidor (se clona); nunca string HTML
  title: string,                    // obligatorio; se usa como nombre accesible
  body?: string,
  progress?: number | 'indeterminate',   // 0–100
  timer?: { endsAt: number },       // muestra mm:ss con role=timer
  actions?: [{ label: string, onSelect: (handle) => void }],   // máx. 2 (error si hay más)
  duration?: number | 'persistent', // por defecto 4000; error → 'persistent'
  priority?: 'low' | 'normal' | 'high',
});

a.update(partial)          // misma instancia; admitido en queued/entering/compact/expanded
a.expand(); a.collapse()   // en cola se guardan como intención (H-03)
a.dismiss(reason?)         // → Promise<void> cuando termina la salida
a.state                    // 'queued'|'entering'|'compact'|'expanded'|'dismissing'|'removed'
a.on(type, fn) → off       // 'statechange' | 'action' | 'dismiss'

island.promise(p, { loading, success, error })   // azúcar sobre show + update
island.dismissAll()
island.destroy()           // quita nodos, timers, listeners (AbortController) y regiones vivas
```
**No hay, a propósito:** `color`, `background`, `radius`, `width` ni `position` como props; tampoco `html: string`, `theme: 'glass'` ni posiciones fuera del borde superior. La personalización es solo con tokens CSS.

### Tokens CSS (nombres provisionales; los valores los fija F3)
`--isl-bg --isl-fg --isl-radius-compact --isl-radius-expanded --isl-max-width --isl-gap --isl-offset-top --isl-z --isl-duration --isl-easing` y `--isl-reserved` (solo lectura: el alto que ocupa, por si el anfitrión quiere reservar espacio; D-08).

## 3. Máquina de estados por actividad
| Desde \ evento | promote | entered | expand | collapse | update | demote | dismiss | removed |
|---|---|---|---|---|---|---|---|---|
| **queued** | entering | — | *intención* | *intención* | queued | — | removed (sin animación) | — |
| **entering** | — | compact | expanded | — | entering | — | dismissing | — |
| **compact** | — | — | expanded | — | compact | queued | dismissing | — |
| **expanded** | — | — | — | compact | expanded | — | dismissing | — |
| **dismissing** | — | — | — | — | *ignorado* | — | — | removed |

Reglas del gestor:
- Huecos visibles: `maxVisible`. Orden: prioridad y luego llegada. **No se desplaza** una primaria expandida o con el foco dentro.
- El timer solo corre en `compact`, con la pestaña visible y sin hover ni foco dentro (WCAG 2.2.1). `persistent` = sin timer.
- Las animaciones son **interrumpibles**: cualquier transición cancela la animación en curso y parte del tamaño medido actual. Los eventos de fase no dependen de que la animación termine cuando el movimiento está reducido (se emiten igual).
- `dismiss` con el foco dentro → el foco vuelve al disparador registrado si sigue en el DOM; si no, al `main` o al `body`.

## 4. Contrato de accesibilidad
| Aspecto | Contrato |
|---|---|
| Anuncios | Regiones `status` (cortés) y `alert` (solo error) **persistentes**, creadas en `createIsland`. Cola FIFO coalescida por actividad, ≥ 1 s entre anuncios. Progreso: hitos del 25 % y resultado. Se anuncia al hacerse visible, no al encolarse |
| Estructura | Actividad = `role=group` con `aria-labelledby` → título. Conmutador = `button[aria-expanded][aria-controls]`. Progreso = `role=progressbar` con `aria-valuenow` |
| Teclado | Tab/Shift+Tab nativos; Enter/Espacio en el conmutador; Esc contrae; foco o clic fuera contrae (2.4.11) |
| Foco | Nunca se mueve al aparecer ni al actualizar. Se conserva entre re-renders |
| Targets | ≥ 44×44 px (perfil); mínimo normativo 24 px (2.5.8) |
| Movimiento | `prefers-reduced-motion` → solo opacidad; mismos estados y eventos |
| Color | La intención se comunica con forma de icono + texto, nunca solo con color |

## 5. Seguridad
- Todo el texto va por `textContent`; los iconos son `Node` clonados. No se usa `innerHTML` con datos del consumidor, así que funciona con `Content-Security-Policy` estricta (sin `unsafe-inline` para scripts; los estilos van en hoja externa o en `adoptedStyleSheets`).
- 0 dependencias runtime y sin código condicionado a la geolocalización, el idioma o el dominio.
- No hay red, almacenamiento ni telemetría.

## 6. Web Components: evaluación (no entra en el alcance inicial)
- **A favor:** encapsulación con Shadow DOM, un `<x-island>` declarativo y tematización con `::part`.
- **En contra para el MVP:** Shadow DOM complica las regiones vivas y `aria-labelledby` entre raíces (las referencias de ID no cruzan el límite de la sombra), los estilos del anfitrión (`font: inherit` sí se hereda; las clases no) y el SSR. Además, duplicaría la superficie de API.
- **Propuesta:** sacarlo más adelante como adaptador fino sobre `core`/`dom` (`@<nombre>/element`), sin cambiar el núcleo. El diseño en capas actual lo permite sin romper la API.

## 7. Decisiones que necesito aprobar
1. Esta API v0 (en particular `show` idempotente por `id`, `maxVisible`, el máximo de 2 acciones y `promise()`).
2. La máquina de estados con `queued` y `demote`.
3. D-08…D-12 (ver `design-hub/lab/isla/r01/decisiones.yaml`).
