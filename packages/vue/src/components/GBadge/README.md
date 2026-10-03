# GBadge

Insignia **no interactiva** para señalar un estado, una categoría o una cantidad: texto, texto con figura de estado o icono, solo icono, solo figura y contador con tope, y cualquiera de ellas **anclada** a la esquina de otro elemento. Cuatro variantes: `solid`, `soft`, `outline` y `glass` (liquid glass). El significado nunca depende solo del color: se lee por texto, figura o icono.

**Etiqueta:** `<g-badge>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/badge/auditoria.md`](../../../../../design/lab/badge/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`). Exige Vue `^3.5.0`. La variante `glass` usa `backdrop-filter` y `color-mix()`; sin `backdrop-filter` (o con transparencia reducida) se ve como `soft`.

## Uso

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import '@grana/vue/style.css'

createApp(App).use(Grana).mount('#app')
```

```vue
<g-badge color="success" shape="circle">Activo</g-badge>
<g-badge :count="120" label="120 mensajes sin leer" variant="solid" color="danger" />
<g-badge shape="triangle" color="danger" label="Error" />
```

> **En plantillas dentro del HTML** (sin compilar), Vue no admite etiquetas de componente autocerradas: escribe `<g-badge ...></g-badge>`.

## Cuándo usarla

La insignia **solo muestra**: no recibe foco, ni clic, ni teclado. Si necesitas una acción (quitar, filtrar, abrir), usa un botón (`GBtn`), no una insignia.

## Modos (se deducen del contenido)

| Contenido | Modo | Nombre accesible |
| --- | --- | --- |
| `count` con valor | Contador | `label` **obligatorio** |
| Slot por defecto (texto) | Texto, con `shape` o el slot `icon` opcionales delante | El texto; `label` opcional |
| `shape` sin texto ni `count` ni icono | Solo figura | `label` **obligatorio** |
| Slot `icon` sin texto ni `count` ni `shape` | Solo icono | `label` **obligatorio** |

Precedencia si hay varios: `count` > texto > figura > icono. Con `count`, el slot por defecto se ignora y en desarrollo hay `console.warn`. **No hay prop `dot`:** un punto de estado es `shape="circle"` con texto.

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `variant` | String | `solid` `soft` `outline` `glass` | `soft` |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | `neutral` |
| `size` | String | `sm` `md` `lg` | `md` |
| `count` | Number | entero ≥ 0 | sin valor |
| `max` | Number | entero ≥ 1 | `99` |
| `showZero` | Boolean | | `false` |
| `shape` | String | `circle` `square` `diamond` `triangle` | sin valor |
| `label` | String | | sin valor |
| `placement` | String | `top-end` `top-start` `bottom-end` `bottom-start` | `top-end` |

Un valor fuera de la lista muestra una advertencia en desarrollo. `ghost` y `link` no son variantes de una insignia.

- **`count`, `max`, `showZero`:** con `count` mayor que `max` se muestra `max+` (`99+`). Con `count` 0 y sin `showZero`, **no se renderiza la insignia** (anclada: solo el destino). El texto para lectores es `label` (el número real), nunca «99+».
- **`shape`:** con texto, es el punto de estado delante del texto (un icono de Lucide relleno: `circle`, `square`, `diamond` o `triangle`); sin texto (ni `count` ni icono), es la insignia entera. Convención sugerida (la aplicación la ratifica): círculo = en línea o correcto, cuadrado = detenido, rombo = advertencia, triángulo = error. Las formas se dibujan con CSS y **se conservan con colores forzados**.
- **`label`:** nombre accesible. **Obligatorio** en contador, figura sola e icono solo (sin él, en desarrollo hay `console.warn`; un contador sin `label` deja su número visible para lectores). En una insignia con texto visible es opcional, y si se da, **se lee en lugar del texto visible** (no se duplica). No tiene valor por defecto: Grana es internacional.
- **`size`:** `sm`, `md` y `lg` (la altura sale de `--g-space-1`). No hay piso táctil: no es interactiva.
- **`placement`:** esquina lógica (`top-end` por defecto; en RTL se espeja). Solo actúa con el slot `anchor`.
- **Resto de atributos** (`class`, `style`, `data-*`, `aria-*`, `role`): van a la **raíz** (la insignia o, si es anclada, el envoltorio). No se declara ningún evento.

## Slots

| Slot | Contenido |
| --- | --- |
| `default` | Texto de la insignia (una línea; sin interactivos) |
| `icon` | Icono decorativo (`aria-hidden`), delante del texto o solo. Grana no trae iconos; el playground usa SVG de [Lucide](https://lucide.dev) |
| `anchor` | Elemento destino: convierte la raíz en el envoltorio `g-badge-anchor` y coloca la insignia en una esquina |

## Anclada a otro elemento

```vue
<g-badge :count="mensajes" :label="`${mensajes} mensajes sin leer`" variant="solid" color="danger" size="sm">
  <template #anchor>
    <g-btn icon variant="outline" aria-label="Bandeja de entrada"><MailIcon /></g-btn>
  </template>
</g-badge>
```

- El destino va **antes** que la insignia en el orden de lectura («Bandeja de entrada, 120 mensajes sin leer»); conserva su nombre, su foco y su clic.
- La insignia tiene `pointer-events: none` y no recibe foco: un clic en la esquina compartida llega al destino.
- **No pongas `overflow: hidden` en el destino:** recortaría la insignia, que sobresale de la esquina.
- **Sobre un avatar:** si el destino es un `.g-avatar--shape-circle` ([`GAvatar`](../GAvatar/README.md)), la insignia se centra en el contorno a 45° y no en la esquina de la caja (constante geométrica neutra, DECISIONS #187 y #297); sobre `square`, en la esquina. Medido en la auditoría de `GAvatar`: ±1px en LTR y RTL.

## Variante `glass` (liquid glass)

Un **velo** blanco translúcido que desenfoca y satura lo que hay detrás, con borde luminoso, brillo en la mitad superior y sombra suave.

- **El cristal no puede volver ilegible el texto.** El velo tiene una opacidad mínima; con el valor por defecto (blanco al 0.62) y el texto del tema, el contraste del peor caso (fondo negro) es de al menos **5.77:1** en los siete colores. **La regla real es el contraste (≥ 4.5:1 sobre negro), no la opacidad sola:** con un texto más claro o un velo teñido hace falta más opacidad (un tema con texto marrón y velo teñido dio 4.06:1 al 0.60 y 5.73:1 al 0.72).
- **`color` tiñe el velo** con el tono suave del color (siempre claro); el texto, la figura, el punto y el icono usan el color de texto del tema (≥ 3:1 sobre el peor fondo). Una figura sola en cristal lleva una pequeña placa de cristal detrás.
- **Respaldo opaco:** sin `backdrop-filter`, con `prefers-reduced-transparency: reduce` y con `forced-colors`, se ve como `soft` (relleno sólido, sin desenfoque, sin sombra).
- **Sobre un fondo claro, el borde casi desaparece:** la insignia se reconoce por su texto, su brillo y su sombra. Una insignia no exige contorno de 3:1, pero un componente **interactivo** no debería usar cristal sin un borde adicional.

## Accesibilidad

- **No interactiva:** un `<span>` sin `tabindex` ni rol; ninguna de las insignias de la auditoría recibe foco.
- **El significado no depende solo del color** (WCAG 1.4.1): texto, figura (círculo, cuadrado, rombo, triángulo) o icono.
- **Sin texto visible, con nombre:** las partes visibles sin texto (figura, icono, número con `label`) van en `aria-hidden` y el nombre lo da un texto oculto (`g-badge__sr`).
- **Sin anuncios automáticos:** cambiar el contador no dispara un anuncio. Si quieres anunciarlo, pasa `role="status"` (va a la raíz) o usa tu propia región viva.
- **Texto largo:** una línea con elipsis; el texto completo sigue en el DOM. Un contador, un icono o una figura **nunca se encogen ni se recortan**, aunque estén en una fila apretada.
- **Contraste:** con el tema por defecto, el texto llega a 4.76:1 o más (`soft`), 5.33:1 (`solid`, `outline`) y las figuras a 5.35:1; con el tema de prueba de la auditoría, 4.76:1 o más.

## Tema

El componente solo lee tokens `--g-*`. Los colores salen de `--g-color-{color}` (y `-soft`, `-text`, `--g-color-on-{color}`, `-soft`); la forma, de `--g-radius-pill` y `--g-radius-xs`; la altura, de `--g-space-1`. La variante `glass` usa el sistema de **cristal** (`tokens.md` §12):

```css
:root {
  --g-glass-tint: #fff6e5;     /* color del velo, opaco */
  --g-glass-opacity: 0.72;     /* opacidad del velo (≥ 0.55; el contraste manda) */
  --g-glass-filter: blur(14px) saturate(1.8);
  --g-glass-edge: rgb(255 255 255 / 0.75);  /* borde luminoso y línea de luz */
  --g-glass-sheen: rgb(255 255 255 / 0.55); /* inicio del brillo */
}
```

## Clases

Las emite el componente y las estiliza `GBadge.css`: `g-badge`, `g-badge--variant-*`, `g-badge--color-*`, `g-badge--size-*`, `g-badge--kind-{text|count|figure|icon}`, y los elementos `g-badge__shape` (con `--circle`, `--square`, `--diamond`, `--triangle`), `g-badge__icon`, `g-badge__text` y `g-badge__sr`; con el slot `anchor`, `g-badge-anchor` y `g-badge-anchor--{placement}`.

## Limitaciones conocidas

- **Solo presentación:** ni chips pulsables ni cerrables en v0.1 (un componente aparte).
- **`glass` depende de `backdrop-filter` y `color-mix`:** sin ellos, o con transparencia reducida, se ve como `soft`. En Firefox y Safari por verificar.
- **El velo mínimo se valida contra el texto del tema:** un tema con texto claro sobre velo blanco no cumple.
- **Una insignia sin icono entre insignias con icono** no reserva espacio (por diseño): da icono a todas o a ninguna para que el texto quede alineado.
- **Estilos globales sin capa ganan:** una regla global tuya sobre `span` (sin capa) gana al CSS de Grana (capa `grana.components`); acótala con un selector más específico.
- No hay tema oscuro todavía.
- **Sin verificar:** un lector de pantalla real (insignia sin texto y anclada junto a su destino), `prefers-reduced-transparency` real (los bloques se comprobaron aplicados sin condición) y el cristal sobre fotografías reales.

## Fuentes

- API: [`GBadge.meta.json`](./GBadge.meta.json) · Contrato: [`design/contracts/badge.md`](../../../../../design/contracts/badge.md) · Prototipo: [`design/lab/badge/r01/`](../../../../../design/lab/badge/r01/) · Auditoría: [`design/lab/badge/auditoria.md`](../../../../../design/lab/badge/auditoria.md)
