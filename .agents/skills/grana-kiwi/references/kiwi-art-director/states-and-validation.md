# Estados y validación

Esta referencia se usa tres veces: en la Fase 1 para declarar qué estados tiene cada alternativa, en la Fase 4 para construirlos y en la Fase 5 para comprobarlos sobre el artefacto renderizado. La profundidad es proporcional a la fidelidad: un flujo valida pasos y errores; un wireframe añade navegación y jerarquía; la construcción completa valida todo lo siguiente.

## Matriz de estados y casos extremos

| Caso | Qué comprobar |
|---|---|
| Datos largos | Nombres y títulos de 2 a 3 veces lo normal no rompen la huella |
| Datos faltantes | `null`, 0, sin foto, sin reseñas: no parecen un error |
| Vacío inicial | Explica qué falta y ofrece la siguiente acción útil |
| Vacío por filtros | Muestra los filtros activos y permite limpiarlos en un paso |
| Carga | Skeleton con la misma huella; lo ya visible sigue operativo |
| Error recuperable | Causa y `Reintentar`; no se pierde lo capturado |
| Sin conexión | Distingue contenido guardado de estado actual; indica qué se encola |
| Objeto ya modificado | Conflicto explicado; conserva la selección y ofrece alternativa |
| Abandono de formulario | Aviso solo si hay cambios; borrador si aplica |
| Permisos | Sin permiso: explica por qué, no oculta sin motivo |
| Listas grandes | Paginación o virtualización declarada; búsqueda disponible |
| Acción repetida | Doble envío bloqueado; resultado idempotente declarado |
| Localización | Textos un 30 % más largos, formatos de fecha y moneda, RTL con propiedades lógicas |
| Responsive | compact, medium y expanded; la misma tarea es completable en cada modo |
| Teclado | Orden lógico, foco visible, Esc cierra capas, el foco vuelve al disparador |
| Movimiento reducido | Con `prefers-reduced-motion: reduce` la tarea se completa sin animaciones de desplazamiento |

Para cada estado responde por escrito: **qué lo dispara, qué pasa si falla y cómo se vuelve.**

## Estados en la dirección de arte

Los estados no son pantallas de segunda clase. El material elegido en la Fase 2 se aplica también a ellos:

- **Carga:** el skeleton usa la superficie del material (la misma textura, borde o translucidez), no un gris genérico. Si hay animación de brillo, se detiene con movimiento reducido.
- **Vacío:** es la oportunidad más visible del motivo distintivo. Usa una ilustración o composición propia del producto, nunca un icono de caja vacía genérico, y siempre una acción.
- **Error:** el color de peligro mantiene contraste AA sobre la superficie del material y nunca es la única señal: acompáñalo de texto e icono con etiqueta.
- **Éxito:** confirma con el estado resultante (el elemento cambia), no solo con un aviso temporal.
- **Deshabilitado:** explica por qué está deshabilitado cuando no es obvio; considera ocultarlo solo si el usuario no puede hacer nada para habilitarlo.

## Principios de UX que se comprueban

| Principio | Pregunta de verificación |
|---|---|
| Jerarquía visual | ¿Lo primero que se ve es el dato dominante del brief? |
| Proximidad y agrupación | ¿Lo que se relaciona está junto y lo que no, separado, sin depender de bordes? |
| Divulgación progresiva | ¿El detalle aparece cuando se necesita, sin esconder lo operativo? |
| Carga cognitiva | ¿Cuántas decisiones exige la vista antes de la acción primaria? |
| Predictibilidad | ¿La misma acción tiene el mismo nombre, lugar y resultado en todo el flujo? |
| Ley de Fitts | ¿Las acciones frecuentes son grandes y cercanas al punto de atención? |
| Restricciones | ¿La interfaz impide los errores evitables en lugar de solo informarlos? |
| No dependencia del color | ¿Cada estado se entiende en escala de grises? |
| Ética | ¿Hay patrones que presionen, oculten costes o dificulten cancelar? Si los hay, se eliminan |

Registra los riesgos de privacidad, sesgo, manipulación y representación como restricciones o preguntas abiertas, no como reglas inventadas.

## Procedimiento de la Fase 5

1. Abre el artefacto renderizado en un navegador real. El código fuente no basta para juzgar.
2. Recorre cada modo: compact (por ejemplo 393×852), medium (834×1194) y expanded (1440×1024). Busca desbordamiento horizontal en el cuerpo y en los contenedores con scroll propio.
3. Fuerza cada estado de la matriz y compruébalo en los tres modos.
4. Recorre el flujo principal solo con teclado.
5. Activa `prefers-reduced-motion` y repite el flujo principal.
6. Mide el contraste de cada par texto/fondo efectivo, incluido el texto sobre superficies translúcidas o degradados (en el punto más desfavorable).
7. Revisa la consola: cero errores de JavaScript.
8. Ejecuta la auto-auditoría estética y la compuerta de accesibilidad de `SKILL.md`.

Registra cada problema con el formato **observación → consecuencia para el usuario → cambio → re-verificación**, y etiqueta lo que no pudiste verificar (por ejemplo, «sin lector de pantalla disponible»). El usuario evalúa una propuesta ya revisada; no sustituye esta verificación.
