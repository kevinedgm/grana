# Declaración de cumplimiento · GAvatarMotion · r01

**Estado:** aprobada (el usuario eligió la opción A del hallazgo 2: `idle` limitado a dos ciclos, bucle solo si la aplicación lo pide). La estructura y la coreografía vienen del prototipo del usuario (`referencia-usuario.html`) y de su especificación (§25–33). Las adaptaciones a las reglas de Grana se derivan de estándares (WCAG 2.2 AA: 1.1.1, 2.2.2, 2.3.3) y contratos vigentes. La decisión de producto del hallazgo 2 ya está tomada: opción A.
**Ruta:** R1 · **Fidelidad:** F2 · **Material:** kit neutral de grises con la forma y la coreografía exactas del prototipo del usuario.
**Siguiente dueño:** lima → excepción en `icons.md` y `design/contracts/avatar-motion.md`.

## Composiciones verificadas

Cuatro estados mínimos más dos compartidos (`warning` → `error`, `working` → `thinking`); cinco tamaños (24 a 150px); dentro del disparador de `GHelper` (decorativo, con `thinking` al abrir y `success` al responder); movimiento reducido.

## Qué se conserva del prototipo del usuario

Forma (SVG de 160×160: cuerpo con tres bandas, ojos, dos antenas, seis patas), coreografía y duraciones exactas: `idle` respira (3s, escala 1.025) y parpadea (4.2s); `thinking` combina balanceo del cuerpo (0.62s), mirada (0.72s), antenas (0.45s) y patas (0.55s); `success` compresión y estiramiento (0.7s) con ojos entrecerrados; `error` sacudida (0.45s).

## Qué cambia respecto al prototipo, y por qué

| # | En el prototipo | En r01 | Fundamento |
| --- | --- | --- | --- |
| 1 | Colores literales (`#9D1635`, `#D85A70`, blanco, `#3a1620`) | Alias (`--av-body`, `--av-accent`, `--av-eye`, `--av-pupil`…) que coco mapeará a tokens | Regla de Grana: sin literales de tema; el avatar debe seguir la marca de cada proyecto |
| 2 | `role="img"` con `aria-label="Avatar Grana"` fijo | **Decorativo por defecto** (`aria-hidden`); con una prop de nombre, `role="img"` | WCAG 1.1.1: dentro de un botón el nombre lo da el botón; un texto fijo en español no es internacional |
| 3 | Vuelta a `idle` con `setTimeout` (1050 y 800ms) | Con **`animationend`** del SVG (verificado: 784ms tras `success`) y un evento `done` | El temporizador no coincide con la animación (0.7s y 0.45s) y se desfasa si coco cambia la duración |
| 4 | El avatar es clicable (`cursor: pointer`, alterna `thinking`) | **No interactivo** | La interacción es del control que lo contiene (`GHelper`); un SVG clicable no es accesible por teclado |
| 5 | `idle` infinito | `idle` hace **2 ciclos** (6 y 8.4s medidos) y se queda quieto; bucle infinito solo si la aplicación lo pide | **WCAG 2.2.2** (pausar, detener, ocultar): movimiento automático de más de 5s junto a otro contenido. Hallazgo 2 |
| 6 | `drop-shadow` literal | Sin sombra en la estructura (la decide coco con `--g-shadow-*`, o ninguna) | Sin literales de tema |
| 7 | Con movimiento reducido, `animation: none` (el estado `success` desaparece al instante) | Sin animación pero con **pose**: `success` entrecierra los ojos, `error` los achica; la pose se mantiene un momento y vuelve a reposo | WCAG 2.3.3; el estado sigue comunicándose sin movimiento |
| 8 | Antenas giran desde su centro | Giran desde su **base** (`transform-origin: bottom center`) | Una antena oscila desde donde nace; al girar desde el centro «flotaba» |

## Decisiones de estructura

| # | Decisión | Fundamento |
| --- | --- | --- |
| 1 | El consumidor da **`state`** (qué ocurre); el avatar elige la animación | Especificación §26 |
| 2 | Estados de la especificación (§27) → 4 animaciones: `idle`, `hover`, `attention`, `open` → reposo; `thinking`, `working` → pensar; `success` → éxito; `warning`, `error` → error | Especificación §27–28 («se podrán compartir comportamientos») |
| 3 | `success` y `error` son **finitas**: al terminar, el avatar muestra reposo y emite `done` | Especificación §32–33 |
| 4 | `thinking` se mueve **mientras dure** la actividad (sin límite): refleja un proceso real, como un indicador de carga | WCAG 2.2.2 (excepción: movimiento esencial que forma parte de una actividad) |
| 5 | La API no nombra el motor (SVG + CSS hoy) | Especificación §1: cambiar a Rive o Lottie sin tocar la API |
| 6 | Tamaño por prop; el dibujo escala con su `viewBox` | Verificado de 24 a 150px |

## Criterios revisados

| Criterio | Resultado | Cómo |
| --- | --- | --- |
| WCAG 1.1.1 Contenido no textual | Cumple | Decorativo con `aria-hidden` (verificado dentro del botón con `aria-label`) |
| WCAG 2.2.2 Pausar, detener, ocultar | Cumple con `idle` limitado | `idle` termina a los 8.4s; `thinking` es esencial a una actividad |
| WCAG 2.3.1 Tres destellos | Cumple | El parpadeo es una vez cada 4.2s |
| WCAG 2.3.3 Animación por interacción | Cumple | Sin animaciones con movimiento reducido (verificado: ninguna en `thinking`); pose estática de `success` (ojos a 0.35) |

## Comprobaciones ejecutadas

- Chromium (`localhost`), sin errores propios en consola.
- `document.getAnimations()`: `idle` con 2 iteraciones; `thinking` con 6 animaciones infinitas; `success` vuelve a reposo por `animationend` a los 784ms y emite `done`; `warning` usa la animación de `error`.
- Movimiento reducido emulado: sin animaciones; pose de `success`; vuelta a reposo.
- Tamaños medidos: 24, 32, 48, 96 y 150px.

## Comprobaciones NO ejecutadas

- Lector de pantalla con la variante con nombre (`role="img"`).
- Contraste de las partes del avatar con el tema (lo mide coco): a 24px, las bandas y las pupilas no se leen; la silueta sí.
- Rendimiento con muchos avatares animados a la vez.

## Hallazgos para lima

| # | Hallazgo | Severidad | Propuesta de la ronda |
| --- | --- | --- | --- |
| 1 | **Regla de iconos** (DECISIONS.md #85–87): prohíbe trazos escritos a mano | Alta | Añadir a `icons.md` la excepción «**las ilustraciones y mascotas no son iconos**»: un dibujo compuesto, con partes animables y sin significado de pictograma. No sustituye a ningún icono ni se usa como tal |
| 2 | **`idle` continuo** (especificación §29) frente a WCAG 2.2.2 | Alta | **Decisión de producto.** Propuesta: `idle` hace 2 ciclos y reposa; prop `idle="loop"` para un bucle continuo que la aplicación asume (con un control para pausarlo). Alternativa: respetar la especificación y documentar que la aplicación debe ofrecer pausa |
| 3 | Nombre accesible | Alta | Prop `label`: sin ella, `aria-hidden="true"`; con ella, `role="img"` y `aria-label`. Sin texto por defecto |
| 4 | Estados | Alta | `state`: los 9 de §27; validador con la lista |
| 5 | Fin de las animaciones finitas | Alta | Evento `done` con el estado terminado. Con `v-model:state`, además `update:state` con `idle`; sin él, el avatar muestra reposo por su cuenta (§32) |
| 6 | Tamaño | Media | Prop `size`: `sm` `md` `lg` `xl` derivados de `space` (p. ej. 6, 8, 12, 24 unidades), o número de unidades. A tamaño pequeño (≤ 32px) se podría ocultar el detalle (bandas, pupilas) |
| 7 | Color | Media | Tokens: cuerpo = `primary`, detalles = `accent`, ojos = `surface`/`text`. ¿Un grupo `--g-avatar-*` o reutilizar semánticos? Propuesta: semánticos, y prop `color` compartida |
| 8 | Carpeta y archivos | Media | `GAvatarMotion/` con `GAvatarMotion.vue`, `.css`, y el dibujo como render interno; la especificación proponía `motion/avatars/grana/GranaAvatar.vue`: se adapta a la convención de un componente por carpeta; un segundo avatar justificaría la subcarpeta |
| 9 | Movimiento reducido en finitas | Baja | Sin `animationend`: bruno mantiene la pose `--g-duration-*` × N y vuelve; lima decide la duración |
