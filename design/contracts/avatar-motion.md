# Contrato · GAvatarMotion

**Dueño:** lima · **Estado:** aprobado · **Basado en:** `design/lab/avatar-motion/r01/` (kiwi), el prototipo del usuario (`referencia-usuario.html`) y su especificación técnica (§25–33).
**Tag:** `g-avatar-motion` · **Categoría:** ilustración

Avatar ilustrado que **responde a estados semánticos**: el consumidor dice qué ocurre (`state`) y el avatar elige la coreografía. Se usa como adorno dentro de un control (el disparador de `GHelper`) o como ilustración suelta. **No es interactivo** y **no es un icono** (`icons.md`, DECISIONS.md #105).

---

## Principios

- **Estado, no animación.** No hay props de velocidad, distancia ni ángulo (especificación §26).
- **La API no nombra el motor.** Hoy SVG + CSS; mañana Rive o Lottie sin cambiar props ni eventos (especificación §1).
- **Decorativo por defecto.** El nombre lo da el control que lo contiene.
- **Movimiento acotado.** `idle` se detiene tras dos ciclos (WCAG 2.2.2, decisión del usuario, DECISIONS.md #106); sin movimiento con `prefers-reduced-motion: reduce`, pero con pose.

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `state` | String | `idle` `hover` `attention` `open` `thinking` `working` `success` `warning` `error` | `idle` | propia (`v-model:state` opcional) |
| `idleLoop` | Boolean | | `false` | propia |
| `size` | String | `sm` `md` `lg` `xl` | `md` | propia |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | `brand` | compartida |
| `label` | String | texto libre | sin valor | propia |

### Reglas de props

- **`state` → coreografía** (especificación §27–28: los estados pueden compartir comportamiento):

  | Estados | Coreografía | Duración |
  | --- | --- | --- |
  | `idle`, `hover`, `attention`, `open` | Reposo: respiración (escala 1.025, 3s) y parpadeo (4.2s) | 2 ciclos y quieto; en bucle con `idleLoop` |
  | `thinking`, `working` | Pensar: balanceo del cuerpo, mirada, antenas y patas | Mientras dure el estado |
  | `success` | Compresión y estiramiento; ojos entrecerrados | Finita (0.7s) |
  | `warning`, `error` | Sacudida; ojos achicados | Finita (0.45s) |

  Los estados agrupados podrán tener coreografía propia en versiones posteriores **sin cambiar la API**.
- **Finitas (`success`, `warning`, `error`):** al terminar, el avatar **muestra reposo** y emite `done`. Con `v-model:state`, emite además `update:state` con `idle`; sin él, el reposo es interno (especificación §32) y un nuevo `state` distinto vuelve a mandar. Volver a pedir el mismo estado finito (p. ej. `success` otra vez) lo reproduce de nuevo si el consumidor lo cambia a otro estado antes (Vue no notifica un valor igual).
- **`idleLoop`:** reposo en bucle continuo. **La aplicación asume WCAG 2.2.2**: debe ofrecer un modo de pausarlo (se documenta; el componente no lo impide).
- **`thinking` / `working`:** se mueven mientras el estado dure: reflejan una actividad real, como un indicador de carga (excepción de WCAG 2.2.2 para movimiento esencial de una actividad).
- **`size`:** lado del cuadro en unidades de `--g-space-1`: `sm` 6 (24px), `md` 8 (32px), `lg` 12 (48px), `xl` 24 (96px). El dibujo escala con su `viewBox`; por debajo de `lg`, las bandas y las pupilas dejan de leerse y se reconoce por la silueta (kiwi, comprobado a 24px).
- **`color`:** familia de color del cuerpo, las patas y las antenas; los detalles (bandas, puntas) usan el tono suave de la misma familia; los ojos contrastan con el cuerpo. `brand` lee `--g-color-primary*` (DECISIONS.md #95).
- **`label`:** sin valor, el avatar es **decorativo** (`aria-hidden="true"` en la raíz). Con valor, `role="img"` y `aria-label`. Sin texto por defecto.
- **Resto de atributos** (`class`, `style`, `data-*`): van a la raíz.

## Movimiento reducido

Con `prefers-reduced-motion: reduce` no hay animaciones. Cada estado conserva una **pose estática**: `success` entrecierra los ojos, `error` los achica; `thinking` queda quieto en reposo. Como no hay `animationend`, la pose de un estado finito se mantiene **`--g-duration-spin`** (800ms por defecto) y luego se comporta como si hubiera terminado (`done`, reposo, `update:state`).

## Estructura

```html
<span class="g-avatar-motion g-avatar-motion--size-md g-avatar-motion--color-brand" data-motion="idle" aria-hidden="true">
  <svg viewBox="0 0 160 160" focusable="false">
    <g class="g-avatar-motion__antenna g-avatar-motion__antenna--start">…</g>
    <g class="g-avatar-motion__antenna g-avatar-motion__antenna--end">…</g>
    <g class="g-avatar-motion__legs g-avatar-motion__legs--start">…</g>
    <g class="g-avatar-motion__legs g-avatar-motion__legs--end">…</g>
    <g class="g-avatar-motion__body">… <g class="g-avatar-motion__eyes">…</g></g>
  </svg>
</span>
```

- `data-motion` es la **coreografía** (`idle`, `thinking`, `success`, `error`, `still`), no el estado pedido: la calcula bruno. `still` es el reposo quieto tras los dos ciclos.
- El dibujo es el del prototipo del usuario, con los colores sustituidos por las clases de parte (los colores los pone coco en CSS, nunca atributos `fill`/`stroke` literales).

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `done` | estado terminado (`success`, `warning` o `error`) | Termina una coreografía finita (o su pose, con movimiento reducido) |
| `update:state` | `'idle'` | Tras `done` (solo tiene efecto con `v-model:state`) |

## Slots

Ninguno.

## Teclado

No aplica: no es interactivo ni enfocable.

## Tokens consumidos

`--g-color-primary`, `--g-color-primary-strong`, `--g-color-primary-soft`, `--g-color-on-primary` y los equivalentes de `accent`, `neutral`, `success`, `warning`, `danger`, `info`; `--g-space-1`; `--g-duration-spin` (pose con movimiento reducido).

**Sin tokens nuevos.** Las **constantes de coreografía** (duraciones, distancias y ángulos de los fotogramas clave, en unidades del `viewBox`) son parte del dibujo, como los trazos de su `path`: se escriben literales **solo en `GAvatarMotion.css`** (excepción documentada en `tokens.md` §7, DECISIONS.md #106). No son tema: un proyecto cambia el color del avatar, no su forma de moverse.

## Clases (contrato entre bruno y coco)

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-avatar-motion` | Raíz | Siempre |
| `g-avatar-motion--size-{sm\|md\|lg\|xl}` | Raíz | Siempre |
| `g-avatar-motion--color-*` | Raíz | Siempre |
| `data-motion="{idle\|thinking\|success\|error\|still}"` | Raíz | Siempre |
| `g-avatar-motion__body`, `__eyes`, `__antenna` (`--start`, `--end`), `__legs` (`--start`, `--end`) | Partes del SVG | Siempre |
| `g-avatar-motion__shell`, `__core`, `__band`, `__tip`, `__eye`, `__pupil`, `__line` | Formas (para el color) | Siempre |

## Resolución de hallazgos

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| 1 | Regla de iconos | Excepción en `icons.md` para ilustraciones y mascotas | DECISIONS.md #105 |
| 2 | `idle` continuo | Dos ciclos y quieto; `idleLoop` para el bucle, con la pausa a cargo de la aplicación | Decisión del usuario (opción A); WCAG 2.2.2 (DECISIONS.md #106) |
| 3 | Nombre accesible | `label`: sin ella, decorativo; con ella, `role="img"` | WCAG 1.1.1 |
| 4 | Estados | `state` con los 9 de la especificación | Especificación §27 |
| 5 | Fin de finitas | `done` + `update:state('idle')`; reposo interno sin `v-model` | Especificación §32 |
| 6 | Tamaño | `size` `sm`…`xl` desde `space` | Patrón de Grana |
| 7 | Color | Semánticos y `color` compartida; sin grupo `--g-avatar-*` | `tokens.md` §17.6 |
| 8 | Carpeta | `GAvatarMotion/` (un componente por carpeta); el dibujo es interno. Un segundo avatar justificará `avatars/` | AGENTS.md |
| 9 | Movimiento reducido en finitas | Pose durante `--g-duration-spin` | WCAG 2.3.3 |

## Límites conocidos

- Un solo avatar (el del prototipo del usuario). Parpadeo con ritmo fijo (la variación pseudoaleatoria es posterior, especificación §30).
- Estados agrupados comparten coreografía en v0.1.
- Sin `@grana/motion` todavía: vive en `@grana/vue` (especificación §4).
