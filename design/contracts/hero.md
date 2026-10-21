# Contrato · GHero (apertura de un sitio)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #725 a #729, #742, #744 y #745, 2026-10-21; remates #755, #756 y #759 tras el estilo de coco; `tokens.md` §29.6, §29.8 y §51, `api.md` «Paquete, entradas y tipos», «Zona de marca» y `data-g-key-focus`, `icons.md` v0.13) · **Basado en:** `design/lab/hero/r01/` (kiwi, commit b32b79a: `brief.md`, `declaracion.md` con 13 decisiones de base, conceptos A/B/C, rúbrica de movimiento y hallazgos H-L1 a H-L14, `index.html`, `hero.css`, `hero.js`, `verificar.mjs` 767/767 en Chromium, Firefox y WebKit) y el inventario `design/lab/marketing/r01/declaracion.md` (M-L1 a M-L7)
**Tag:** `g-hero` · **Categoría:** marketing · **Paquete:** entrada propia **`@grana/vue/hero`** (#742)

**Componente complejo** (se solapa con `GPageHeader` y con `GCard media="background"`; B lleva la zona de marca y un grupo de radios propio; compone `GBtn` y, en C, `GBookingBar` por slot): **coco y bruno en Opus** (regla de `CLAUDE.md`).

## Promesa

Abre una página de un **sitio** (hotel, restaurante, tour) con el título, la promesa, la acción y **la foto que vende**, con tres garantías que una receta rompe: **ninguna foto puede romper el contraste del texto**, **la foto principal es la primera en llegar** y **nada se mueve ni cambia solo sin poder pararse**.

**Forma (decisión del usuario del 2026-10-21, #725):** «Héroe: A “La ventana” por defecto; C “El umbral” y B “Vistas a elegir” como apariencias.»

- **Base:** región nombrada por su único `h1`; texto antes que la foto en el DOM; foto como `img` prioritaria con tamaño reservado; pausa visible para lo que se mueve; alto por contenido; margen fluido por la caja (`cqi`).
- **A · La ventana (`appearance="window"`, por defecto):** la foto se ve por un **vano de arco** junto al texto, con una segunda ventana de detalle; el texto nunca toca la foto; dentro del vano la foto se desplaza un 3 % al pasar («la mirada»).
- **C · El umbral (`appearance="threshold"`):** foto a sangre sin nada encima y una tarjeta que cruza su borde inferior con el título y **el hueco de la consulta** (slot `consult`, para `GBookingBar`) antes de la acción.
- **B · Vistas a elegir (`appearance="views"`):** foto a sangre; una **placa de la zona de marca** la solapa y lleva el texto, las acciones y dos a cuatro **vistas con nombre** que la persona elige. Nada cambia solo.

---

## Principios

1. **El texto vive en la página o en una placa opaca, nunca sobre la foto** (H-L4). Sin velo, sin degradado «que suele funcionar». `--g-card-scrim` no se reutiliza.
2. **Una sola foto prioritaria por página** (H-L5): `img` en el DOM, `fetchpriority="high"`, `loading="eager"`, `width`/`height`; nada de fondo CSS.
3. **Nada cambia solo** (WCAG 2.2.2): ni carrusel ni rotación. El vídeo de la aplicación se mueve con pausa visible y arranca en pausa con movimiento reducido.
4. **Alto por contenido, nunca recortado**: sin `100vh`; la media con `aspect-ratio`, mínimo y tope en `svh`.
5. **Mide su caja, no el visor**: `container-type: inline-size`; margen, título y partición por `cqi` e intrínseco, sin puntos de corte.

## Qué lo hace distinto (#729)

En lugar de un rectángulo a sangre con texto encima, el héroe de Grana ofrece una **forma de lugar** (A: la foto vista por el arco de cantera de un portal, con el detalle que vende en una segunda ventana), **una elección** en vez de un carrusel (B: el huésped pide la habitación por su nombre, en una sola parada de Tab) o **la reserva en el umbral** (C: la consulta es parte del héroe y el primer gesto de la página ya es reservar). En los tres, el contraste está garantizado **por construcción** (el texto no toca la foto o vive en una placa cuyo par garantiza el CLI) y la foto que importa llega primero.

## Cuándo usarlo (fronteras)

| Necesito | Uso | No |
| --- | --- | --- |
| La apertura de una página de un sitio con foto | **`GHero`** | `GPageHeader` (página de **aplicación**: se pega, migas, sin media) |
| El encabezado de una vista de gestión | `GPageHeader` | `GHero` (aviso 4 si conviven) |
| Una tarjeta con foto de fondo | `GCard media="background"` | `GHero` (no es un `article` ni lleva velo) |
| Más de cuatro fotos | La acción secundaria abre `GGallery`/`GGalleryViewer` | Vistas de B con cinco o más (aviso 7) |
| La consulta de reserva en la apertura | `appearance="threshold"` + `GBookingBar` en el slot `consult` | Una barra suelta flotando sobre la foto |
| Texto sobre la foto | B (placa de la zona de marca) | Un velo o degradado (H-L4) |
| Cabecera del sitio transparente sobre la foto | **No en v1** (H-L6, reservada) | `GAppShell` con fondo cambiante |

## Uso

```vue
<GHero
  title="Casa Alcalá"
  eyebrow="Hotel boutique · Centro histórico de Oaxaca"
  lead="Doce habitaciones alrededor de un patio de cantera."
  aside="Desayuno incluido · Llegada desde las 15:00"
  :media="{ src: patio.jpg, srcset, sizes, width: 1600, height: 2000, alt: 'Patio de cantera verde con buganvilias al atardecer' }"
  :detail="{ src: copa.jpg, width: 600, height: 600 }"
>
  <template #actions>
    <GBtn size="lg" href="#reservar">Reservar</GBtn>
    <GBtn size="lg" variant="link" href="#habitaciones">Ver habitaciones</GBtn>
  </template>
</GHero>

<!-- C · El umbral -->
<GHero appearance="threshold" title="Casa Alcalá" :media="…">
  <template #consult><GBookingBar kind="stay" title="Consulta disponibilidad" … /></template>
  <template #actions>…</template>
</GHero>
```

## Anatomía

```
section.g-hero.g-hero--appearance-{window|views|threshold}  aria-labelledby="{id}-title"   ← región; container-type: inline-size
├─ div.g-hero__content                       ← PRIMERO en el DOM (en C, dentro de div.g-hero__card; en B, dentro de div.g-hero__plate[data-g-zone="brand"])
│  ├─ p.g-hero__eyebrow                      ← opcional
│  ├─ h{1|2}.g-hero__title#{id}-title  dir="auto"
│  ├─ p.g-hero__lead                         ← opcional
│  ├─ div.g-hero__consult                    ← solo C con slot consult
│  ├─ div.g-hero__actions                    ← slot actions (GBtn lg)
│  ├─ p.g-hero__aside                        ← opcional
│  └─ fieldset.g-hero__views                 ← solo B: legend + radios nativos (ver «B»)
└─ figure.g-hero__media
   ├─ span.g-hero__frame                     ← solo A (#755): el vano; lleva el recorte; no se mueve
   │  └─ img.g-hero__img  loading=eager fetchpriority=high decoding=async width height alt   ← o el slot media (vídeo); en A, dentro del marco; la mirada mueve esto
   ├─ img.g-hero__img                        ← B y C: hijo directo de la media, sin marco
   ├─ img.g-hero__detail  alt="" aria-hidden="true"        ← solo A con detail (fuera del marco)
   ├─ img.g-hero__layer × (n−1)  alt="" aria-hidden="true" ← solo B: vistas no elegidas
   ├─ button.g-hero__motion  type=button aria-pressed     ← solo con vídeo
   │  └─ GLibIcon pause|play + span.g-hero__motion-label  ← texto oculto accesible = labels.pause (#756)
   └─ figcaption.g-hero__credit                          ← opcional (media.credit)
```

- **`span.g-hero__frame` (#755):** en `appearance="window"` la foto principal (o el vídeo del slot `media`) va **siempre** dentro de este `span`, con `frame="arch"` y con `frame="rect"`, con `look` o sin él. El marco lleva la forma y el recorte (`overflow: clip` y el radio, de coco); la `img` de dentro es la que se desplaza con la mirada. Es la única forma de cumplir §29.8.1 («solo dentro de un marco»): un recorte en la propia `img` viaja con su `transform`. Sin el marco (un `.vue` antiguo), el CSS pinta el arco en la `img` y la mirada queda quieta: nada se rompe. El marco es presentacional (sin rol ni nombre); en B y C no existe.

## Props (#726)

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `title` | String | texto | — (**obligatoria**; aviso 1) | propia |
| `eyebrow` | String | texto | sin valor | propia (nombre de `GCard`) |
| `lead` | String | texto | sin valor | propia |
| `aside` | String | texto | sin valor | propia |
| `headingLevel` | Number | `1` `2` | `1` | propia (`GPageHeader`) |
| `appearance` | String | `window` `views` `threshold` | `window` | compartida (`appearance`) |
| `media` | Object | `{ src, srcset?, sizes?, width, height, alt?, decorative?, credit? }` | sin valor | propia |
| `detail` | Object | `{ src, srcset?, sizes?, width, height }` (siempre decorativa) | sin valor | propia (solo `window`) |
| `frame` | String | `arch` `rect` | `arch` | propia (solo `window`; H-L10) |
| `look` | Boolean | | `true` | propia (solo `window`; la mirada, §29.8, #728) |
| `views` | Array | `[{ value, label, media }]` (`media` como arriba; 2 a 4) | `[]` | propia (solo `views`) |
| `view` | String \| Number | `value` de una vista (`v-model:view`) | el primero | propia (solo `views`) |
| `paused` | Boolean | `v-model:paused` | sin valor (resuelto: `true` con movimiento reducido, si no `false`) | propia (solo con vídeo) |
| `priority` | Boolean | | `true` con `headingLevel` 1; `false` con 2 | propia (H-L5) |
| `labels` | Object | `{ views, pause }` (`resume` retirado, #756) | `{}` | compartida (sin valores por defecto, #226) |
| `id` | String | | generado (SSR-seguro) | propia |

### Reglas de props

- **`media`:** foto principal. `width` y `height` **obligatorios** (reservan el hueco: CLS 0; aviso 2). Con `alt` es informativa; con `decorative: true` lleva `alt=""` (la promesa ya la dice el texto); sin ninguno de los dos, aviso 3 y se pinta con `alt=""`. `srcset`/`sizes` pasan tal cual. `credit` se pinta en `figcaption`.
- **`priority`:** con `true`, la `img` principal lleva `fetchpriority="high"` y `loading="eager"`; con `false`, `loading="eager"` sin `fetchpriority`. **Ninguna otra imagen del héroe** lleva `fetchpriority="high"` (detalle de A, vistas de B). Dos héroes con `priority` en el documento: aviso 5.
- **`headingLevel`:** el tamaño **no** sigue al nivel (#196): el título usa siempre la regla fluida (§«Título»).
- **`appearance`, `frame`, `look`, `detail`, `views`:** fuera de su apariencia se ignoran y avisan una vez (aviso 6).
- **`views`:** de 2 a 4 entradas con `value` único, `label` (nombre visible de la vista) y `media` (mismas reglas que `media`, `alt` obligatorio: cambia la foto informativa). Fuera de ese rango, aviso 7 (con una, la apariencia `views` se pinta como `window` sin vistas; con cinco o más, solo las cuatro primeras). Sin `labels.views`, aviso 8 y el `legend` queda vacío.
- **`paused`:** solo existe si el slot `media` trae un `<video>`. `v-model:paused` sincroniza con la aplicación; sin `v-model`, interno.
- **Resto de atributos** (`class`, `style`, `data-*`, `aria-*`): a la raíz `section`. Un `aria-label` o `aria-labelledby` del consumidor sustituye al nombre por el título (desaconsejado).

## Título (#727)

- **Regla fluida derivada** (H-L3, M-L6): tamaño `clamp(var(--g-text-title-lg-size), 7.5cqi, var(--g-hero-title-max))`, interlineado relativo **`1.08`**, `text-wrap: balance`, familia `--g-font-display`, peso `--g-text-display-weight`, tracking `--g-text-display-tracking`. **Nunca baja de `title-lg`** (31 px con el tema por defecto, medido ≥ 31 a 320 px).
- **Un token de componente nuevo: `--g-hero-title-max`** (tope del título; `tokens.md` §51). Valor por defecto lo fija coco en `defaults.css` como derivado de `--g-text-display-size` (la propuesta de kiwi: `display × typeScale²`, 61 px con el tema por defecto). No es un rol tipográfico nuevo: ningún otro componente lo lee (la galería titula con `GSection`; la banda de acción, con los roles vigentes).
- `7.5cqi` y `1.08` son **constantes del héroe** (§29.6), no tokens.
- **1.4.4:** mínimo y tope van en `rem` por su origen; con zoom de página el título escala entero. **Zoom de solo texto a 200 % por verificar** (H-L3, no verificado por kiwi).

## A · La ventana (por defecto)

- **Vano:** la `img` principal recortada con forma de arco (semicírculo arriba y radio de tarjeta abajo con `frame="arch"`; rectángulo con radio de tarjeta con `frame="rect"`). Proporción de la foto **4:5**. Geometría del arco (50 % / 40 % en 4:5) y el **muro de `space × 2`** pintado con `--g-color-bg` entre vano y detalle: **constantes de geometría** (#187; §29.6), no tokens. Un tema con radios 0 deja el arco puro con esquinas rectas abajo (lo decide la forma, no el tema).
- **Detalle (`detail`):** segunda ventana pequeña que solapa la esquina del vano; **siempre decorativa** (`alt=""`, `aria-hidden="true"`); no se difiere (primer pliegue) pero no es prioritaria (`loading="eager"`, sin `fetchpriority`).
- **El texto nunca solapa la foto:** contenido y media se parten por su mínimo intrínseco (`flex-wrap`); en estrecho la acción principal queda sin desplazar a 390×844 (medido).
- **La mirada (`look`, #728):** con `animation-timeline: view()` soportado y **sin** movimiento reducido, la `img` del vano se desplaza dentro de su marco `span.g-hero__frame` (#755) un **3 %** de su alto al atravesar el visor, lineal, solo `transform`; el marco y el texto quedan quietos. Sin soporte (Firefox) o con movimiento reducido: quieta. `look=false` la apaga. Primer uso de la regla común «movimiento ligado al desplazamiento» (`tokens.md` §29.8).

## B · Vistas a elegir

- **Placa:** `div.g-hero__plate` con **`data-g-zone="brand"`** (fija en esta apariencia, no es prop: es la identidad de B; H-L9). La foto queda **fuera** de la zona. La placa solapa el borde inferior de la foto con un labio de `min(space × 40, 12cqi)` y **nunca tapa más de la mitad** de la foto (constantes §29.6). Fondo opaco (alfa 1). Con `forced-colors`, borde `CanvasText`. Dentro, la acción principal se invierte sola (`tokens.md` §44.1).
- **Vistas (H-L7: marcado propio, no `GRadioGroup`):** `fieldset.g-hero__views` con `legend` = `labels.views`; cada vista es `label.g-hero__view` con `input[type=radio].g-hero__view-input` nativo (mismo `name` generado, `value` = índice) + miniatura decorativa (`img.g-hero__view-thumb alt=""`) + texto `view.label` (`dir="auto"`). Una parada de Tab, flechas nativas; la vista elegida cambia la foto principal y su `alt` y emite `update:view`; el foco sigue en el radio.
- **Foco visible en WebKit:** los radios llevan la modalidad de foco `data-g-key-focus` (`utils/keyFocus.js`, `api.md` #441/#450).
- **Capas:** cada vista no elegida es una `img.g-hero__layer` con `alt=""` y `aria-hidden="true"`; la elegida es la `img.g-hero__img` con el `alt` de su vista. **Carga diferida** (H-L5, bruno): hasta el `load` (o `error`) de la principal, las capas no llevan `src` ni `srcset`; después los reciben con `fetchpriority="low"`. Si la persona elige una vista antes, esa se pide al instante.
- **Fundido** (H-L12): opacidad con `--g-duration-slow` + `--g-ease-out`; con movimiento reducido, `--g-duration-fast`. Interrumpible (elegir otra a mitad parte del estado actual). **Sin muelle** (#299).
- **Riesgo aceptado** (elegido por el usuario como apariencia, no por defecto): en el teléfono la foto va primero y la acción principal queda bajo el pliegue (medido a 390×844).

## C · El umbral

- Foto a sangre arriba **sin nada encima** salvo el crédito; una tarjeta (`div.g-hero__card`, superficie `--g-color-surface` opaca) cruza su borde inferior con un labio de `min(space × 28, 16cqi)` y nunca tapa más de la mitad de la foto (medido). Ancho de la tarjeta `min(100% − 2 × margen, space × 220)` (H-L13; constantes §29.6).
- **Slot `consult`:** el hueco de la consulta va **después de la bajada y antes de las acciones** (la acción envía lo consultado; orden de foco). El héroe no sabe de fechas: lo que va en el slot es de la aplicación (normalmente `GBookingBar`, cuyo `headingLevel` por defecto ya queda un nivel por debajo del `h1`). Fuera de `threshold`, el slot se ignora y avisa (aviso 6).

## Movimiento del vídeo (base; H-L8)

- El vídeo es de la aplicación por el slot **`media`** (`<video muted playsinline loop poster>` con `width`/`height`). **La aplicación no pone `autoplay`**: `GHero` llama a `play()` al montar si `paused` resuelto es `false` (sin movimiento reducido) y a `pause()` si es `true`. Un `<video autoplay>` en el slot avisa (aviso 9) y el héroe lo pausa igualmente con movimiento reducido.
- **Botón de pausa** `button.g-hero__motion` (44 px, `GBtn`-like con el icono `pause`/`play` de la librería): nombre **constante** `labels.pause` en un **texto oculto accesible** `span.g-hero__motion-label`, y estado por `aria-pressed` (`true` = en pausa) — corrige el prototipo, que cambiaba el nombre («Pausar»/«Reanudar») y el estado a la vez (APG *Button*, la misma corrección que `GDocumentPreview`, #646). Lo visible es solo el icono, que cambia con el estado (`pause` en marcha, `play` en pausa). **Sin `labels.resume` (#756):** un texto visible distinto del nombre rompería 2.5.3 (el control de voz dice lo que ve), y como `title` daría una descripción que contradice el nombre; una clave `resume` en `labels` se ignora sin aviso. Sin `labels.pause`, aviso 10 y el botón se pinta igual (la salida es obligatoria, 2.2.2).
- El botón va en la esquina de la media, **fuera del texto**. Contraste del botón sobre una foto casi blanca (1.4.11): **encargo a coco** (H-L14: medirlo con `cielo`; si `border-strong` + `shadow-1` no llega a 3:1, anillo de `--g-color-text`).
- Con la foto fija (sin vídeo) no hay botón ni `paused`.

## Estados

| Estado | Qué se ve | Cómo se anuncia |
| --- | --- | --- |
| Reposo | Texto + foto según apariencia | `region` con el nombre del `h1` |
| Foto cargando | Marco `--g-color-surface-sunken` del tamaño final (sin esqueleto animado) | — |
| Foto rota | El `alt` del navegador sobre el marcador | El `alt` |
| Vídeo en marcha | Movimiento + botón de pausa | `aria-pressed="false"` |
| Vídeo en pausa / reducido | Fotograma quieto + botón | `aria-pressed="true"` |
| B · vista elegida | Foto de la vista; la vista con borde doble y peso de acción | Radio marcado |
| C · consulta | Lo que pinte `GBookingBar` | Lo de `GBookingBar` |
| Foco | Anillo `--g-color-focus` (en la placa de B, el de la zona) | — |

Sin `aria-live`: nada cambia solo.

## Teclado y foco

Tab: título y eyebrow no son enfocables; acción principal → secundaria → (C: la consulta va **antes** de las acciones) → (B: grupo de vistas, una parada, flechas) → (con vídeo: pausa). Espacio/Intro en la pausa. Sin manejadores de teclado propios salvo los nativos.

## Estructura accesible

- `section` con `aria-labelledby` al título: es `region` con nombre (APG *Landmark Regions*). Sin `role` propio.
- **Un solo `h1` por página** con `headingLevel` 1: aviso 4 si al montar hay otro `h1` en el documento (incluye el de un `GPageHeader`).
- Orden del DOM: contenido → media (1.3.2, 2.4.3).
- `dir="auto"` en título, bajada, eyebrow, dato y nombres de vista (#282).
- `forced-colors`: placa de B y tarjeta de C con borde real; vista elegida con `Highlight`.

## Avisos de desarrollo (`[Grana GHero]`, una vez por instancia y motivo; guarda canónica de #653)

1. Sin `title`.
2. `media` (o una vista) sin `width`/`height`.
3. `media` sin `alt` ni `decorative`; vista sin `alt`.
4. Otro `h1` en el documento con `headingLevel` 1 (incluye un `GPageHeader`; mensaje propio si es un `GPageHeader`: «un héroe y un encabezado de página no conviven»).
5. Más de un `GHero` con `priority` en el documento.
6. Prop o slot fuera de su apariencia (`frame`, `look`, `detail` sin `window`; `views` sin `views`; slot `consult` sin `threshold`).
7. `views` con menos de 2 o más de 4 entradas, o `value` repetido.
8. `appearance="views"` sin `labels.views`.
9. `<video autoplay>` en el slot `media`.
10. Vídeo sin `labels.pause`.

## Tokens consumidos (`tokens.md` §51)

Lista exacta del `GHero.css` de coco (6945cda; completada en #759): `--g-color-bg` (página y muro de A), `--g-color-surface` (tarjeta de C, relleno de la pausa), `--g-color-surface-sunken` (marco de carga), `--g-color-text` (texto; contorno de la pausa, H-L14), `--g-color-text-muted` (eyebrow, bajada, dato), `--g-color-border`, `--g-color-border-control` (borde de las vistas), `--g-color-focus`, `--g-focus-width`, `--g-focus-offset`, `--g-border-width`, `--g-radius-*` (arco, tarjeta, placa, vistas y pausa: `xs` `sm` `md` `lg` `xl` `pill`), `--g-shadow-1` (pausa), `--g-shadow-2` (tarjeta de C), `--g-text-title-lg-size`, **`--g-hero-title-max`** (nuevo, componente), `--g-text-title-sm-size`, `--g-text-title-sm-line` (la bajada: un bajo de `body` bajo un título de 61 px salta demasiado), `--g-text-display-weight`, `--g-text-display-tracking`, `--g-font-display`, `--g-text-body-*`, `--g-text-body-sm-*`, `--g-text-caption-*` (crédito), `--g-text-action-weight` (vista elegida), `--g-font-ui`, `--g-space-*`, `--g-press-scale` (pausa al apretar), `--g-duration-fast`, `--g-duration-press`, `--g-duration-slow`, `--g-ease-out`, `--g-ease-standard` (cambios de color). `--g-color-border-strong` **no** se lee (la pausa usa el contorno de `text`, H-L14). `--g-text-display-size` solo lo lee `defaults.css` para derivar `--g-hero-title-max`. En la placa de B, todo lo del grupo de color que lee está en la lista de `tokens.md` §44.5 (no se añade ninguno). **Sin `--g-ease-spring` ni `--g-ease-bounce`.**

## Clases y datos (contrato bruno ↔ coco)

| Clase / dato | Dónde | Cuándo |
| --- | --- | --- |
| `g-hero`, `g-hero--appearance-{window\|views\|threshold}` | Raíz | Siempre |
| `g-hero--frame-{arch\|rect}` | Raíz | Solo `window` |
| `g-hero--has-detail`, `g-hero--has-video`, `g-hero--look` | Raíz | Con `detail`; con vídeo; `window` con `look` |
| `is-paused` | Raíz | Vídeo en pausa (también reducido) |
| `__content`, `__eyebrow`, `__title`, `__lead`, `__consult`, `__actions`, `__aside` | Contenido | Según props y slots |
| `__media`, `__img`, `__detail`, `__credit`, `__motion`, `__motion-label` (texto oculto del nombre, #756) | Media | Según props |
| `__frame` | A: `span` que envuelve la foto o el vídeo del vano (#755) | Siempre en `window` |
| `__plate` (`data-g-zone="brand"`), `__views`, `__views-legend` (el `legend`), `__view`, `__view-input`, `__view-thumb`, `__view-label` (el `span` del nombre), `__layer`, `is-current` (capa y vista elegidas) | B | Solo `views` |
| `__card` | C | Solo `threshold` |

`data-g-key-focus` en los radios de B (interno, #441). Ningún dato del `.vue` al CSS más allá de clases.

**B · capas estables (coco, estilo.md):** cada vista es un `img` **estable** con `key` (la elegida lleva `g-hero__img is-current` y su `alt`; las demás, `g-hero__layer`). Al elegir se **cambia la clase, no el nodo**: con un nodo nuevo no hay fundido.

## Peso y paquete (#742)

- **Entrada propia `@grana/vue/hero`** (global UMD `GranaHero`): exporta `GHero` y un plugin que lo registra. `@grana/vue` no lo exporta ni lo registra. **Tope: 4 KiB (4096 B) gzip** en su entrada; `GBtn` no se importa (las acciones son de la aplicación por slot); `GLibIcon` (iconos `pause`/`play` del botón de pausa) y `utils/keyFocus.js` llegan por `__shared` (#240). CSS en `grana.css`.
- Se añade a `exports`, `typesVersions`, `ENTRIES` de `scripts/build-types.mjs` y `src/types.test.js` (#443); compuertas en `gates.sh` (`grep -q "g-hero__media"` en `grana.css`; `! grep -q "GHero"` en `grana.js`; `test -f dist/hero.js`). Si supera el tope, vuelve a lima.

## `meta.json` y tipos (#443)

Props con valores, defaults y obligatoriedad (`title`); eventos `update:view`, `update:paused`; slots `actions`, `consult`, `media`, `eyebrow`, `lead`, `aside` (sustituyen el texto de su prop; sin interactivos salvo `actions` y `consult`); forma de `media`/`detail`/`views` en `overrides.mjs`.

## Verificación (bruno; base: `design/lab/hero/r01/verificar.mjs`)

- **vitest:** región con nombre; un `h1`; orden contenido → media; `fetchpriority` solo en la principal y solo con `priority`; `alt`/`decorative`; `width`/`height`; avisos 1 a 10; B: legend, radios, `update:view`, cambio de `alt`, capas `aria-hidden` y sin `src` hasta el `load` de la principal; vídeo: `play()`/`pause()` según `paused` y movimiento reducido, `aria-pressed`, nombre constante en `__motion-label` y ningún texto visible de `labels.resume` (#756); A: la foto (o el vídeo) dentro de `span.g-hero__frame`, el detalle fuera (#755); B: las capas conservan el nodo al elegir; slot `consult` solo en C; SSR del héroe en las tres apariencias.
- **Playwright (tres motores):** sin desplazamiento horizontal a 1440, 390, 320 y 320×256; título ≥ `title-lg` a 320; acción principal sin desplazar a 390×844 en A y C; contraste del texto con `cielo`, `noche` y `papel-picado` en B y C; la mirada solo con soporte y sin reducido; foco visible en WebKit en las vistas (Tab + →); `forced-colors` (Chromium).

## Fuera de v1 (reservado con nombre)

- **Cabecera transparente sobre el héroe** (H-L6): exigiría una enmienda de `GAppShell` (#713) y medir la navegación contra la foto.
- `zone` como prop del héroe (la placa de B es fija); vídeo de terceros (es `GEmbed`, ronda futura del inventario).

## Límites conocidos (para el README)

- La mirada no existe en Firefox (sin `animation-timeline`): queda quieta.
- B en el teléfono pone la foto primero (la acción bajo el pliegue).
- Zoom de solo texto a 200 % con el título fluido, lector real, LCP con fotos reales y vídeo real: no verificados en la ronda.

## Resolución de hallazgos de kiwi (H-L1 a H-L14)

| # | Hallazgo | Resolución |
| --- | --- | --- |
| H-L1 | Nombre y paquete | `GHero`; entrada propia `@grana/vue/hero`, tope 4 KiB (#742) |
| H-L2 | Datos y avisos | Props y avisos 1 a 10 de este contrato (#726) |
| H-L3 | Título fluido | Regla derivada + token de componente `--g-hero-title-max`; sin rol nuevo (#727) |
| H-L4 | Texto nunca sobre la foto sin placa | Principio 1; `--g-card-scrim` no se reutiliza (#726) |
| H-L5 | Prioridad de carga | `priority`; capas de B sin `src` hasta el `load` de la principal (#726) |
| H-L6 | Cabecera sobre el héroe | Reservada; no se propone (#745) |
| H-L7 | Vistas de B | Marcado propio con radios nativos y `data-g-key-focus` (#726) |
| H-L8 | Pausa | `labels.pause` constante + `aria-pressed`; `play` **no** estaba en la lista: entra (#744) |
| H-L9 | Placa de B | `data-g-zone="brand"` en la placa, fija; borde en forzados (#726) |
| H-L10 | Marco de A | `frame` `arch`/`rect`; geometría como constantes (#726) |
| H-L11 | La mirada | `look` (por defecto `true`, como se prototipó); regla común §29.8 (#728) |
| H-L12 | Fundido de B | `slow` + `ease-out`; reducido `fast` (#728) |
| H-L13 | Slot `consult` | Medidas como constantes; consulta antes de la acción (#726) |
| H-L14 | Contraste de la pausa | Resuelto por coco (6945cda): relleno `surface` + contorno `text`; peor caso √(text/surface), 4,06:1 con el tema por defecto, ≥ 3:1 con «cielo», «noche» y «papel picado» en cuatro temas |

## Remates tras la entrega de coco (#755 a #759)

| # | Hallazgo de coco | Resolución |
| --- | --- | --- |
| H-C1 | La mirada no cabe en §29.8.1 sin un marco | `span.g-hero__frame` en la anatomía de A (#755) |
| H-C2 | `labels.resume` visible rompe 2.5.3 | Retirado; nombre en texto oculto `__motion-label`, solo icono visible (#756) |
| H-C3 | Tokens consumidos sin listar | Lista exacta en «Tokens consumidos» y §51 (#759) |
| H-C4 | Constantes de geometría de B, C y A | §29.6 (#759) |

## Encargos

- **coco (Opus):** `GHero.css` con las tres apariencias, el arco y su muro, la mirada (§29.8), la placa en zona, la tarjeta de C, la regla del título y el valor de `--g-hero-title-max` en `defaults.css`; H-L14 (pausa sobre `cielo`); auditoría con los temas del CLI y dentro de una zona.
- **bruno (Opus):** `GHero.vue` (región, avisos, `priority`, vistas de B con carga diferida y `data-g-key-focus`, control del vídeo), pruebas, `meta.json`, entrada `@grana/vue/hero` (cuatro registros de #443), compuertas, playground y spec; `play` en `library` de `icons.json` antes de usarlo (#744).
