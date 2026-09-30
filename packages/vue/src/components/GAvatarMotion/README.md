# GAvatarMotion

Avatar ilustrado que **responde a estados**: tú dices qué está ocurriendo (`state`) y el avatar elige cómo moverse. Sirve para dar personalidad a una ayuda contextual o a un asistente, dentro de un control (el disparador de [`GHelper`](../GHelper/README.md)) o como ilustración suelta. **No es interactivo y no es un icono.**

**Etiqueta:** `<g-avatar-motion>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/avatar-motion/auditoria.md`](../../../../../design/lab/avatar-motion/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`). Exige Vue `^3.5.0`.

## Uso

```vue
<!-- Ilustración suelta con nombre -->
<g-avatar-motion v-model:state="estado" size="xl" label="Asistente"></g-avatar-motion>

<!-- Dentro de GHelper: decorativo, el nombre lo da el botón -->
<g-helper aria-label="Abrir asistente" content-label="Asistente" close-label="Cerrar" @toggle="alAbrir">
  <template #trigger><g-avatar-motion :state="estadoAsistente"></g-avatar-motion></template>
  <template #content><MiAsistente /></template>
</g-helper>
```

```js
const estadoAsistente = ref('idle')
function alAbrir({ open }) {
  if (!open) return (estadoAsistente.value = 'idle')
  estadoAsistente.value = 'thinking'           // mientras carga
  cargar().then(() => (estadoAsistente.value = 'success'), () => (estadoAsistente.value = 'error'))
}
```

## Estados

Dices **qué ocurre**, no cómo animarlo. Los nueve estados se agrupan en cuatro coreografías:

| Estados | Coreografía | Duración |
| --- | --- | --- |
| `idle` (por defecto), `hover`, `attention`, `open` | Reposo: respira y parpadea | **Dos ciclos (~8s) y se queda quieto** |
| `thinking`, `working` | Pensar: se balancea, mira a los lados, mueve antenas y patas | Mientras dure el estado |
| `success` | Se comprime y se estira; entrecierra los ojos | 0.7s, luego reposo |
| `warning`, `error` | Se sacude; achica los ojos | 0.45s, luego reposo |

**Por qué el reposo se detiene:** un movimiento automático de más de 5 segundos junto a otro contenido debe poder pausarse (WCAG 2.2.2). Si quieres el reposo en bucle, usa `idle-loop`, y **ofrece tú un control para pausarlo**. `thinking` no se detiene porque refleja una actividad real, como un indicador de carga.

**Al terminar `success` o `error`**, el avatar muestra reposo por su cuenta y emite `done`. Con `v-model:state`, tu estado vuelve además a `idle`. Para repetir la misma animación, cambia a otro estado y vuelve a pedirla.

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `state` (`v-model:state` opcional) | String | `idle` `hover` `attention` `open` `thinking` `working` `success` `warning` `error` | `idle` |
| `idleLoop` | Boolean | | `false` |
| `size` | String | `sm` (24px) `md` (32px) `lg` (48px) `xl` (96px) | `md` |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | `brand` |
| `label` | String | | sin valor |

- **`size`:** en unidades de `--g-space-1` (6, 8, 12 y 24). Por debajo de `lg`, las bandas y las pupilas apenas se leen; se reconoce por la silueta.
- **`color`:** familia del cuerpo, patas y antenas; los detalles usan su tono suave y los ojos, el color de mayor contraste con el cuerpo. `brand` sigue el color primario de tu tema.
- **`label`:** sin valor, el avatar es **decorativo** (`aria-hidden`). Con valor, es una imagen con nombre (`role="img"`). Grana no trae textos por defecto.
- **Resto de atributos** (`class`, `style`, `data-*`): van a la raíz.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `done` | `'success'`, `'warning'` o `'error'` | Termina una animación finita (o su pose, con movimiento reducido) |
| `update:state` | `'idle'` | Justo después de `done` |

Sin slots.

## Accesibilidad y movimiento

- **Decorativo por defecto:** dentro de un botón, el nombre es el del botón. Con `label`, es una imagen con nombre.
- **No interactivo:** sin foco ni clic. La interacción es del control que lo contiene.
- **Movimiento reducido:** sin animaciones. Cada estado conserva una **pose** (en `success`, ojos entrecerrados; en `error`, achicados) que se mantiene `--g-duration-spin` (800ms por defecto) antes de volver a reposo y emitir `done`.
- **Contraste medido:** ojos sobre el cuerpo ≥ 5.33:1 (claro) y ≥ 4.81:1 (oscuro) en los siete colores; silueta sobre el fondo ≥ 6.2:1.
- **Colores forzados:** silueta en color de texto y ojos en color de fondo del sistema.
- **RTL:** el dibujo no se refleja: es una figura, no texto.

## Tema

El avatar toma el color de tu tema: con el tema por defecto de Grana (`brand` casi negro) es oscuro; con tu `brand` toma tu color.

```css
:root {
  --g-color-primary: #9D1635;        /* núcleo */
  --g-color-primary-strong: #7A1029; /* caparazón, patas, antenas, pupilas */
  --g-color-primary-soft: #F8DDE3;   /* se mezcla con el núcleo para las bandas y las puntas */
  --g-color-on-primary: #FFFFFF;     /* ojos */
}
```

Consume las familias `--g-color-{primary|accent|neutral|success|warning|danger|info}` (con `-strong`, `-soft` y `on-`), `--g-space-1`, `--g-duration-spin` y `--g-ease-out`. **Sin tokens propios.** Las duraciones y amplitudes de la coreografía son parte del dibujo y no se cambian por tema (DECISIONS.md #106).

## Clases

`g-avatar-motion`, `g-avatar-motion--size-*`, `g-avatar-motion--color-*`, `g-avatar-motion--idle-loop`, y `data-motion` (`idle`, `thinking`, `success` o `error`) en la raíz. Las partes del dibujo: `__body`, `__eyes`, `__antenna` (`--start`, `--end`), `__legs` (`--start`, `--end`) y las formas `__shell`, `__core`, `__band`, `__tip`, `__eye`, `__pupil`, `__line`.

## Limitaciones conocidas

- **Un solo avatar** (el del prototipo del Grana Motion Lab). El motor es SVG + CSS; la API no cambiaría con Rive o Lottie.
- Los estados agrupados comparten coreografía; el parpadeo tiene ritmo fijo.
- **Sin verificar:** lector de pantalla con `label`, Firefox y Safari (`transform-box: fill-box` en SVG) y rendimiento en un móvil de gama baja (60 avatares a la vez van a ~60 fps en Chromium de escritorio).

## Fuentes

- API: [`GAvatarMotion.meta.json`](./GAvatarMotion.meta.json) · Contrato: [`design/contracts/avatar-motion.md`](../../../../../design/contracts/avatar-motion.md) · Prototipo: [`design/lab/avatar-motion/r01/`](../../../../../design/lab/avatar-motion/r01/) (con `referencia-usuario.html`) · Estilo: [`design/lab/avatar-motion/estilo.md`](../../../../../design/lab/avatar-motion/estilo.md) · Auditoría: [`design/lab/avatar-motion/auditoria.md`](../../../../../design/lab/avatar-motion/auditoria.md)
