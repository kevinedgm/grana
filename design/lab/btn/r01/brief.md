# Brief funcional · GBtn · r01

**Agente:** kiwi (ejecutado por el squad siguiendo `.agents/skills/bruno/references/handoffs.md`)
**Ruta:** R1 · prototipo directo **Fidelidad:** F2 · wireframe mid-fi con kit neutral

## Enunciado

Un **desarrollador que usa Grana** necesita **ofrecer al usuario final un control para ejecutar una acción** (guardar, enviar, cancelar, eliminar) porque toda interfaz tiene puntos de decisión, y cada uno debe comunicar su jerarquía, su estado y su resultado sin que el desarrollador lo reconstruya en cada proyecto.

## Pregunta de diseño

¿Qué anatomía, estados y comportamiento necesita `GBtn` para cubrir acciones de distinta jerarquía y acciones asíncronas, sin cambiar de tamaño, sin perder el foco y sin romper los mínimos de accesibilidad en ningún tema?

## Verbo y resultado

- **Verbo principal:** ejecutar una acción.
- **Resultado verificable:** el evento `click` se emite **una sola vez** por activación, y nunca con `disabled` o `loading`.

## Anatomía

| Parte | Obligatoria | Nota |
| --- | --- | --- |
| Raíz | Sí | `<button type="button">`; `<a>` si recibe `href` |
| Icono inicial | No | Decorativo (`aria-hidden`) |
| Etiqueta | Sí, salvo solo-icono | Nombre accesible |
| Icono final | No | Decorativo |
| Indicador de carga | Solo en `loading` | Se superpone; la etiqueta queda invisible pero ocupa su espacio |
| Área táctil | Sí | Pseudo-elemento: ≥ 24px, ≥ 44px con `pointer: coarse`, sin agrandar el aspecto |

## Estados

`default`, `hover`, `focus-visible`, `active`, `disabled`, `loading`.

## Riesgo por acción

El botón no decide confirmaciones. Una acción destructiva se comunica con `color="danger"`; confirmarla o permitir deshacerla es responsabilidad del consumidor.

## Continuidad

- **Acción asíncrona:** `loading` bloquea activaciones repetidas y conserva el ancho.
- **Conexión lenta o error:** los maneja el consumidor. El botón solo refleja `loading`.
- **Cambio de tamaño y zoom 200%:** la etiqueta puede saltar de línea; la altura es mínima, no fija.

## Alcance

| Must | Should | Could | Won't (v0.1) |
| --- | --- | --- | --- |
| API compartida (`color`, `variant`, `size`, `density`, `rounded`, `block`, `disabled`, `loading`) | Render como `<a>` con `href` | Alternancia (`aria-pressed`) | Grupos de botones |
| Iconos inicial y final | | Integración con Vue Router (`to`) | Botón dividido |
| Solo icono con nombre accesible obligatorio | | | Botón con menú |
| `type="button"` por defecto | | | |
| Área táctil mínima | | | |

## Hechos, supuestos e incógnitas

**Hechos**
- Un `<button>` dentro de un `<form>` es `type="submit"` por defecto. Por eso `GBtn` usa `type="button"` salvo que se indique otro.
- Si se aplica `disabled` nativo a un botón que tiene el foco, el navegador pierde el foco. Por eso `loading` usa `aria-disabled`, no `disabled`.
- WCAG 2.2 AA exige un área de objetivo mínima de 24×24 px (2.5.8).

**Supuestos**
- El consumidor entrega sus propios iconos (Grana aún no tiene sistema de iconos). El botón solo reserva los espacios.

**Incógnitas (para lima)**
- ¿`density` reduce también la altura o solo el padding? `docs/contract/tokens.md` §4 no lo precisa. La ronda propone que reduzca la altura, con piso de 24px.
- ¿Debe `loading` anunciarse a lectores de pantalla con un texto (por ejemplo, un `loadingText`), o basta con `aria-busy`?
