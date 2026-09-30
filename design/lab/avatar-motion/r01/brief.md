# Brief funcional · GAvatarMotion · r01

**Agente:** kiwi (ejecutado por el squad siguiendo `.agents/skills/bruno/references/handoffs.md`)
**Ruta:** R1 · prototipo directo **Fidelidad:** F2 · kit neutral (la forma y la coreografía son la estructura; el color es de coco)
**Fuentes:** especificación técnica del usuario (§25–33) y su prototipo `referencia-usuario.html` («Grana Motion Lab»), que valida `idle`, `thinking`, `success` y `error`. DECISIONS.md #104 lo tenía aplazado hasta tener este prototipo en el repositorio.

## Enunciado

Un **desarrollador que usa Grana** necesita **un avatar que exprese qué está ocurriendo** (en reposo, pensando, terminó bien, falló) para dar personalidad a una ayuda contextual (`GHelper`) o a un asistente, **diciendo el estado, no la animación**: la coreografía pertenece al avatar.

## Pregunta de diseño

¿Qué anatomía, estados, ciclo de vida de las animaciones finitas y límites de movimiento necesita `GAvatarMotion` para que sea reconocible a 24px y a 150px, funcione dentro del botón de `GHelper` como adorno, respete a quien pide menos movimiento y no mueva la pantalla sin fin?

## Alcance de la ronda

- Estados mínimos de la especificación (§28): `idle`, `thinking`, `success`, `error`. Los demás (`hover`, `attention`, `open`, `working`, `warning`) quedan aceptados en la API y se representan con uno de los cuatro (§27: «se podrán compartir comportamientos»).
- Motor SVG + CSS (§25). La API no debe atarse al motor (§1: se podrá cambiar por Rive o Lottie).
- **No** es un icono: es una ilustración. Requiere la excepción en `icons.md` (hallazgo 1).

## Anatomía (del prototipo del usuario)

| Parte | Movimiento que admite |
| --- | --- |
| Cuerpo (elipse con tres bandas) | Respiración (escala), balanceo vertical, compresión/estiramiento |
| Ojos (blanco + pupila) | Parpadeo (escala vertical), mirada horizontal, entrecerrar |
| Antenas (2, con punta) | Oscilación |
| Patas (3 por lado) | Oscilación mínima |

## Continuidad

- **Movimiento reducido:** sin animación; cada estado conserva una pose estática reconocible.
- **Movimiento sin fin:** WCAG 2.2.2 (pausar, detener, ocultar) para lo que se mueve más de 5 segundos.
- **Tamaños:** de 24px (dentro de un disparador) a 150px (ilustración).
- **Accesibilidad:** decorativo por defecto (el nombre lo da el control que lo contiene).
