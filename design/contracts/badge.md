# Contrato · GBadge

**Dueño:** lima · **Estado:** aprobado · **Basado en:** `design/lab/badge/r01/` (kiwi)
**Tag:** `g-badge` · **Categoría:** presentación

Insignia **no interactiva** para señalar un estado, una categoría o una cantidad: texto, texto con figura de estado, texto con icono, solo icono, solo figura, contador con tope, y cualquiera de ellas **anclada** a la esquina de otro elemento. Cuatro variantes: `solid`, `soft`, `outline` y `glass` (liquid glass). Alcance decidido por el usuario (DECISIONS.md #59 y #60).

## Principios

- **No interactiva.** Sin `tabindex`, sin rol interactivo, sin eventos. Una acción es un `GBtn`, no una insignia.
- **El significado no depende solo del color:** texto, figura (`circle`, `square`, `diamond`, `triangle`) o icono distintos (WCAG 1.4.1).
- **Sin texto visible, con nombre accesible obligatorio:** icono solo, figura sola y contador llevan un texto oculto con lo que diga la aplicación (`label`), sin valor por defecto (Grana es internacional).
- **Sin anuncios automáticos.** Cambiar el número no dispara nada; si la aplicación quiere anunciarlo, pasa `role="status"` (o su propia región viva).

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `variant` | String | `solid` `soft` `outline` `glass` | `soft` | compartida (subconjunto + `glass`) |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | `neutral` | compartida |
| `size` | String | `sm` `md` `lg` | `md` | compartida (subconjunto, como `GDialog`) |
| `count` | Number | entero ≥ 0 | sin valor | propia |
| `max` | Number | entero ≥ 1 | `99` | propia |
| `showZero` | Boolean | | `false` | propia |
| `shape` | String | `circle` `square` `diamond` `triangle` | sin valor | propia |
| `label` | String | texto libre | sin valor | propia |
| `placement` | String | `top-end` `top-start` `bottom-end` `bottom-start` | `top-end` | propia (solo con el slot `anchor`) |

### Modo de la insignia (se deduce del contenido)

| Contenido | Modo | Clase | Nombre accesible |
| --- | --- | --- | --- |
| `count` con valor | Contador | `g-badge--kind-count` | `label` **obligatorio** |
| Slot por defecto (texto) | Texto (con `shape` o slot `icon` opcionales delante) | `g-badge--kind-text` | El texto; `label` opcional |
| `shape` sin texto ni `count` ni slot `icon` | Solo figura | `g-badge--kind-figure` | `label` **obligatorio** |
| Slot `icon` sin texto ni `count` ni `shape` | Solo icono | `g-badge--kind-icon` | `label` **obligatorio** |

Precedencia si hay varios: `count` > texto > figura > icono. Con `count`, el slot por defecto se ignora y en desarrollo se emite `console.warn`. **No hay prop `dot`:** un punto de estado es `shape="circle"` con texto.

### Reglas de props

- **`variant`:** `ghost` y `link` no aplican a una insignia. `glass` es el cristal (ver "Variante `glass`").
- **`color`:** en `solid` y `soft` da el relleno; en `outline`, el borde y el texto; en `glass`, tiñe **el velo con el tono suave del color** (`--g-color-{color}-soft`, siempre claro: el texto oscuro conserva el contraste); el texto, la figura, el punto y el icono usan el color de texto del tema (un color saturado no llega a 3:1 sobre un velo claro con fondo negro).
- **`size`:** `sm`, `md` y `lg`. La altura sale de `--g-space-1` (5, 6 y 7 unidades; las figuras solas, 3, 4 y 5). No hay piso táctil: no es interactiva.
- **`count`, `max`, `showZero`:** con `count` > `max`, se muestra `max+` (`99+`). Con `count` 0 y sin `showZero`, **no se renderiza la insignia** (anclada: solo el destino). El texto para lectores es `label` (el número real), nunca «99+».
- **`shape`:** con texto, es el punto de estado delante del texto; sin texto (ni `count` ni icono), es la insignia entera. Las formas se dibujan con CSS (no con un relleno que `forced-colors` elimine). Convención sugerida para estatus (la aplicación la ratifica): círculo = en línea o correcto, cuadrado = detenido, rombo = advertencia, triángulo = error.
- **`label`:** nombre accesible. **Obligatorio** en contador, figura sola e icono solo; sin él, en desarrollo se emite `console.warn`. En una insignia con texto visible es opcional, y si se da, **se lee en lugar del texto visible** (el texto visible pasa a `aria-hidden`; no se duplica).
- **`placement`:** esquina lógica (`top-end` por defecto); en RTL se espeja. Solo actúa con el slot `anchor`.
- **Resto de atributos** (`class`, `style`, `data-*`, `aria-*`, `role`): van a la **raíz** (la insignia o, si es anclada, el envoltorio). No se declara ningún evento.

## Estructura accesible

```html
<!-- Insignia sola -->
<span class="g-badge g-badge--variant-soft g-badge--color-neutral g-badge--size-md g-badge--kind-text">
  <span class="g-badge__shape g-badge__shape--circle" aria-hidden="true"></span>      <!-- con shape y texto -->
  <span class="g-badge__icon" aria-hidden="true">…</span>                              <!-- con el slot icon -->
  <span class="g-badge__text">Activo</span>                                            <!-- aria-hidden si hay label -->
  <span class="g-badge__sr">Estado: activo</span>                                      <!-- solo con label -->
</span>

<!-- Anclada -->
<span class="g-badge-anchor g-badge-anchor--top-end">
  …contenido del slot anchor…
  <span class="g-badge g-badge--kind-count …"><span class="g-badge__text" aria-hidden="true">99+</span><span class="g-badge__sr">120 mensajes sin leer</span></span>
</span>
```

- **Las partes visibles sin texto** (`__shape`, `__icon`, y `__text` de un contador o de una insignia con `label`) llevan `aria-hidden="true"`; el nombre lo da `g-badge__sr` (patrón estándar de texto oculto).
- **Anclada:** el destino va **antes** que la insignia en el orden del documento (se lee «Bandeja de entrada, 120 mensajes sin leer»); la insignia tiene `pointer-events: none`, no recibe foco y **no cambia el nombre, el foco ni el clic del destino**.
- **Elipsis:** el texto largo se corta con `…` en una línea (`max-inline-size: 100%`); el texto completo sigue en el DOM.
- **Contraste:** texto ≥ 4.5:1; figuras e iconos ≥ 3:1 contra el fondo (los verifica coco con el tema real).

## Variante `glass` (liquid glass)

Cristal líquido: un **velo** blanco translúcido que desenfoca y satura lo que hay detrás, con borde luminoso, brillo en la mitad superior y sombra suave. Decisiones de contrato (DECISIONS.md #60):

- **El cristal no puede hacer ilegible el texto.** El velo tiene una **opacidad mínima de 0.55** con el texto oscuro del tema: con `#FFFFFF` a 0.62 y `--g-color-text` (#1F1F1F) el contraste **peor caso** (fondo negro) es 6.15:1 (5.77:1 con los tonos suaves de los siete colores). **La regla real es el contraste (≥ 4.5:1 sobre negro), no la opacidad sola:** el CLI calcula el compuesto del velo neutro y de cada tono suave y rechaza el tema que baje de 4.5:1 o cuya `--g-glass-opacity` sea < 0.55. (Un tema oscuro futuro invertirá el velo y el texto.)
- **Respaldo opaco** en tres casos: navegador sin `backdrop-filter` (`@supports`), `prefers-reduced-transparency: reduce` y `forced-colors: active`. En ellos, `glass` se ve como `soft`: relleno sólido, sin desenfoque ni sombra.
- **`color` tiñe el velo** con el tono suave del color; el texto, la figura, el punto y el icono usan el color de texto del tema (≥ 3:1 sobre el peor fondo).
- **Sobre un fondo claro, el borde casi desaparece:** la insignia se reconoce por su texto, su brillo y su sombra, no por el borde (una insignia no interactiva no exige contorno de 3:1).
- **Tokens nuevos** (`tokens.md` §12): `--g-glass-tint` (color opaco del velo), `--g-glass-opacity`, `--g-glass-filter`, `--g-glass-edge` y `--g-glass-sheen`; reutilizables por otros componentes con superficies de cristal.

## Slots

| Slot | Propósito | Anatomía que debe conservar |
| --- | --- | --- |
| `default` | Texto de la insignia | Dentro de `g-badge__text`; una línea; nunca interactivos |
| `icon` | Icono decorativo | Se envuelve con `g-badge__icon` y `aria-hidden="true"`; delante del texto o solo |
| `anchor` | Elemento destino | Convierte la raíz en `g-badge-anchor`; el destino va antes que la insignia |

## Eventos

Ninguno. La insignia no es interactiva.

## Teclado

Ninguno: la insignia no recibe foco. (Tab pasa al destino anclado, si es enfocable, sin detenerse en ella.)

## Tokens consumidos

| Token | Para qué |
| --- | --- |
| `--g-color-{color}`, `--g-color-on-{color}` | `solid`: relleno y texto; figura, punto e icono |
| `--g-color-{color}-soft`, `--g-color-on-{color}-soft` | `soft`: relleno y texto |
| `--g-color-{color}-text` | `outline`: borde y texto; figura e icono sobre superficies claras |
| `--g-glass-tint`, `--g-glass-opacity`, `--g-glass-filter`, `--g-glass-edge`, `--g-glass-sheen` | Variante `glass` (`tokens.md` §12) |
| `--g-color-text`, `--g-color-surface-sunken` | Texto y respaldo opaco de `glass` |
| `--g-shadow-2` | Sombra de `glass` |
| `--g-radius-pill` | Forma de la insignia |
| `--g-space-1..3` | Altura, relleno y separación (`sm`: 5, `md`: 6, `lg`: 7 unidades) |
| `--g-font-ui` | Familia |
| `--g-text-caption-{size|line}`, `--g-text-body-sm-{size|line}`, `--g-text-action-weight` | Texto y contador |
| `--g-border-width` | `outline`, borde de `glass` y líneas del brillo |

**Tokens nuevos:** `--g-glass-tint`, `--g-glass-opacity`, `--g-glass-filter`, `--g-glass-edge`, `--g-glass-sheen` (ver `tokens.md` §12). El resto sale del contrato vigente.

## Clases (contrato entre bruno y coco)

Bruno las emite; coco las estiliza. Ninguno usa otras.

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-badge` | Insignia (`span`) | Siempre |
| `g-badge--variant-{variant}` | Insignia | Siempre |
| `g-badge--color-{color}` | Insignia | Siempre (incluido `neutral`) |
| `g-badge--size-{size}` | Insignia | Siempre |
| `g-badge--kind-{text\|count\|figure\|icon}` | Insignia | Siempre (el modo deducido) |
| `g-badge__shape`, `g-badge__shape--{shape}` | Figura o punto (`aria-hidden`) | Con `shape` |
| `g-badge__icon` | Icono decorativo (`aria-hidden`) | Con el slot `icon` |
| `g-badge__text` | Texto o número | Texto y contador |
| `g-badge__sr` | Texto para lectores (oculto) | Con `label` |
| `g-badge-anchor` | Envoltorio | Con el slot `anchor` |
| `g-badge-anchor--{placement}` | Envoltorio | Con el slot `anchor` |

## Resolución de hallazgos de r01

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| 1 | `variant` | `solid`, `soft`, `outline` y `glass` | Decisión del usuario (`glass`, DECISIONS.md #60) |
| 2 | `size` | `sm`, `md`, `lg` (subconjunto) | Una insignia no es un control |
| 3 | `color` | Los siete; `neutral` por defecto | API compartida |
| 4 | Contenido | `count`, `max`, `showZero`, `shape`, `label`, `placement`; slots `default`, `icon`, `anchor`. **Sin `dot`**: un punto es `shape="circle"` con texto | Una sola forma de decir «figura» |
| 5 | Nombre accesible | `label` obligatorio sin texto visible; con texto visible reemplaza al texto (sin duplicar) | WCAG 1.1.1, 4.1.2 |
| 6 | Modo | Se deduce del contenido, con precedencia `count` > texto > figura > icono | Simplicidad de la API |
| 7 | Anclada | Slot `anchor` y `placement` | Decisión del usuario (DECISIONS.md #59) |
| 8 | Contador en cero | No se renderiza salvo `showZero` | Reducir ruido |
| 9 | Anuncios | Ninguno por defecto; `role="status"` si la aplicación lo quiere | Un contador que cambia sería spam |
| 10 | Atributos | A la raíz; sin eventos | No interactiva |
| 11 | Elipsis | Una línea | WCAG 1.4.10 |
| 12–16 | `glass` (variante, tokens, respaldos, `color`, contraste) | Ver "Variante `glass`" y `tokens.md` §12 | Decisión del usuario y WCAG 1.4.3 |

## Límites conocidos

- **Solo presentación:** ni pulsable ni cerrable. Una etiqueta que se quita, se alterna o se sigue, o una etiqueta de categoría, es **`GTag`** (`tag.md`, #461): `GBadge` dice el estado o la cantidad de otra cosa, con colores semánticos.
- **Sin anuncios automáticos.**
- **Avatar:** no es parte de `GBadge`; la **presencia** se compone con `GAvatar` en el slot `anchor` (#297, `avatar.md` «Presencia»). Sobre un **`.g-avatar--shape-circle`**, la insignia se centra en el **contorno a 45°** y no en la esquina de la caja (que queda 8,3px fuera del círculo `lg`): lo resuelve coco en `GBadge.css` con la constante geométrica `1 − 1/√2` del lado (sin token); sobre `square`, la esquina como siempre.
- **`glass` depende de `backdrop-filter`:** sin él (o con transparencia reducida) se ve como `soft`. En Firefox y Safari por verificar.
- **El velo mínimo se valida contra el texto del tema:** un tema con texto claro sobre velo blanco no cumple (el CLI lo rechaza).
- **Lector de pantalla:** cómo se anuncian la insignia sin texto y la anclada junto a su destino está por verificar con lectores reales.

## Abierto (no bloquea el paso siguiente)

- Valores estéticos (proporciones de figuras, brillo, sombra): los decide coco con los tokens listados.
