# Brief funcional · GInput · r01

**Agente:** kiwi (ejecutado por el squad siguiendo `.agents/skills/bruno/references/handoffs.md`)
**Ruta:** R1 · prototipo directo **Fidelidad:** F2 · wireframe mid-fi con kit neutral

## Enunciado

Un **desarrollador que usa Grana** necesita **ofrecer al usuario final un campo para escribir una línea de texto** (nombre, correo, contraseña, búsqueda) porque casi todo formulario los usa, y cada uno debe llegar con etiqueta, ayuda y error correctamente conectados para tecnologías de asistencia, sin que el desarrollador lo reconstruya en cada proyecto.

## Decisiones del usuario (alcance)

| Decisión | Respuesta |
| --- | --- |
| ¿Qué incluye el mismo componente? | **Campo completo:** etiqueta, texto de ayuda, mensaje de error, iconos inicial y final, y contador opcional. Un solo `<g-input>`. |
| ¿Qué tipos de entrada cubre en v0.1? | **Texto y afines:** `text`, `email`, `password`, `search`, `tel`, `url`. Contraseña con botón para mostrar/ocultar. Sin `number`, fecha, hora ni archivo. |

## Pregunta de diseño

¿Qué anatomía, estados y conexiones accesibles necesita `GInput` para que un campo de texto se entienda, se corrija y se use con teclado, lector de pantalla y en pantallas táctiles, sin perder el foco visible ni romper los mínimos de accesibilidad en ningún tema?

## Verbo y resultado

- **Verbo principal:** escribir un valor de una línea.
- **Resultado verificable:** el valor del campo está disponible con `v-model`, y el nombre, la ayuda y el error del campo se anuncian al enfocarlo.

## Anatomía

| Parte | Obligatoria | Nota |
| --- | --- | --- |
| Raíz | Sí | Contenedor del campo completo |
| Etiqueta | Sí | `<label for>` visible sobre el control; nunca solo `placeholder` |
| Indicador de obligatorio | Solo con `required` | Marca visual `aria-hidden`; el anuncio lo da el atributo `required` |
| Control (caja) | Sí | Contiene icono inicial, `<input>` y zona final; recibe el anillo de foco |
| Icono inicial | No | Decorativo (`aria-hidden`) |
| `<input>` nativo | Sí | Único elemento que recibe el foco de escritura |
| Zona final | No | Icono decorativo, indicador de carga o botón mostrar/ocultar (solo `password`) |
| Texto de ayuda | No | Enlazado con `aria-describedby` |
| Mensaje de error | Solo con error | Texto (y marca), enlazado con `aria-describedby` y `aria-invalid="true"` en el input |
| Contador | No (con `maxlength`) | Visible, `aria-hidden`; el límite lo impone el atributo nativo |

## Estados

`default`, `hover`, `focus-visible`, `filled`, `disabled`, `readonly`, `invalid`, `loading`.

## Riesgo por acción

Escribir es reversible. Los errores de validación los decide el consumidor: el campo solo muestra el mensaje que recibe. No borra ni reformatea lo que el usuario escribió.

## Continuidad

- **Validación asíncrona:** `loading` muestra un indicador y `aria-busy`, pero **no bloquea la escritura**.
- **Texto largo:** el valor se desplaza dentro del campo; etiqueta, ayuda y error saltan de línea.
- **Zoom 200% y 320px:** sin desborde horizontal de la página; el campo ocupa el ancho de su contenedor.
- **Autocompletar del navegador:** el atributo nativo `autocomplete` pasa al `<input>`.

## Alcance

| Must | Should | Could | Won't (v0.1) |
| --- | --- | --- | --- |
| API compartida (`color`, `size`, `density`, `rounded`, `block`, `disabled`, `readonly`, `loading`, `modelValue`) | Texto de ayuda | Contador con `maxlength` | `number`, fecha, hora, archivo |
| Etiqueta obligatoria y conectada | Mensaje de error | | Varias líneas (`textarea`) |
| Tipos `text` `email` `password` `search` `tel` `url` | Iconos inicial y final | | Botón de borrar (`clearable`) |
| Mostrar/ocultar contraseña | Indicador `required` | | Máscaras de formato |
| Foco visible en toda la caja | `loading` | | Autocompletado propio |
| Área táctil ≥ 44px con `pointer: coarse` | | | Etiqueta flotante |

## Hechos, supuestos e incógnitas

**Hechos**
- Un `placeholder` no sustituye a la etiqueta: desaparece al escribir y suele tener poco contraste (WCAG 3.3.2, 1.4.3).
- `aria-describedby` acepta varios ids: ayuda y error se anuncian juntos al enfocar el campo.
- Una región viva solo se anuncia de forma confiable si ya existe en el DOM antes de cambiar su contenido (mismo hecho que en `GBtn`, WCAG 4.1.3).
- El `<input>` nativo ya trae teclado, selección, portapapeles y autocompletar. No se reescribe.
- Un `<a>` o `<button>` dentro de la caja necesita nombre accesible propio: el botón de contraseña lo necesita.

**Supuestos**
- El consumidor entrega sus propios iconos (Grana aún no tiene sistema de iconos).
- El consumidor decide cuándo hay error (al salir del campo, al enviar); el campo no valida por su cuenta.

**Incógnitas (para lima)**
- Los textos "mostrar contraseña" y "ocultar contraseña" deben poder traducirse: ¿props propias?
- ¿`loading` en un campo bloquea la escritura, como define la API compartida para controles?
- ¿Cómo se marca el estado de error: prop `error` (texto) o `invalid` + slot?
- ¿`color` afecta al campo? Propuesta: solo el foco y el borde de error.
