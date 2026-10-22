# @grana/blocks

Capa de composición sobre `@grana/vue`: secciones y pantallas armadas con los componentes de Grana, con props, eventos de intención y slots. Un block no hace `fetch`, no valida ni guarda y no conoce endpoints; lo que la persona decide sale como evento y lo resuelve tu aplicación.

**Estado: en construcción.** Paquete privado (`0.0.0`); no se publica con la beta `0.1.0` de `@grana/vue`. Dos familias, con una entrada propia cada una:

| Entrada | Qué trae | Estado |
| --- | --- | --- |
| `@grana/blocks/marketing` | **Marketing P0**: 9 secciones, cada una con 3 variantes (27 componentes) | 3 secciones `candidate`, 6 en `draft` (tabla abajo) |
| `@grana/blocks` | Gestión (CRUD, editor, detalle, dashboard). **Sin componentes todavía**: `dist/blocks.js` no exporta ninguno | `GResourceList` tiene contrato y CSS (`GResourceList.css`, de coco), pero aún no tiene `.vue` ni `meta.json` ni README |

Booking y Ecommerce están planeados (DECISIONS #763, #815) y **no existen**.

## Marketing P0

Entrada `@grana/blocks/marketing`. Los bloques son **estructurales** (DECISIONS #763): sin CSS, sin `<style>` y sin clases utilitarias. Toda la forma sale de las primitivas de `@grana/vue` y del tema, así que cualquier tema de tu proyecto los viste.

| Sección | Variantes | Estado | README |
| --- | --- | --- | --- |
| `GbHero` | `GbHero01` La ventana, `02` Vistas, `03` El umbral | `candidate` | [`GbHero/README.md`](./src/blocks/GbHero/README.md) |
| `GbFeatures` | `GbFeatures01` Rejilla, `02` Alternada, `03` Lectura | `candidate` | [`GbFeatures/README.md`](./src/blocks/GbFeatures/README.md) |
| `GbBlogList` | `GbBlogList01` Rejilla, `02` Lista con fecha, `03` Destacada y lista | `candidate` | [`GbBlogList/README.md`](./src/blocks/GbBlogList/README.md) |
| `GbStats` | `01` a `03` | `draft` | — |
| `GbTestimonials` | `01` a `03` | `draft` | — |
| `GbCta` | `01` a `03` | `draft` | — |
| `GbFaq` | `01` a `03` | `draft` | — |
| `GbNewsletter` | `01` a `03` | `draft` | — |
| `GbFooter` | `01` a `03` | `draft` | — |

Las seis secciones en `draft` están exportadas y tienen contrato, pero **no se recomiendan en producción**: la auditoría de coco ([`design/lab/blocks/marketing/auditoria.md`](../../design/lab/blocks/marketing/auditoria.md)) encontró en ellas texto suelto con el estilo del navegador (hallazgo MK-L1, a la espera de la primitiva de texto `GText`, DECISIONS #841, decisión del usuario pendiente); además Newsletter tenía abierto MK-B1 (el `error` presente al montar no se ve) y bruno informa de su remate en el commit bc843a6. Se documentarán cuando pasen a `candidate`.

### Instalación

`@grana/vue` y `vue` son *peer dependencies* y externos en el build: el paquete no lleva copia de ninguno. Las entradas de `@grana/vue` que un bloque compone también son *peer* (`@grana/vue/hero`, `@grana/vue/tag`); las paga tu aplicación.

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import '@grana/vue/style.css'
import { marketing } from '@grana/blocks/marketing'

createApp(App).use(Grana).use(marketing).mount('#app') // registra <gb-hero-01> ... <gb-footer-03>
```

Para pagar solo lo que usas, importa la variante por nombre: `import { GbHero01 } from '@grana/blocks/marketing'` (cada variante está marcada como pura para la importación parcial). Hasta publicarse se usa desde el repositorio, con el `dist/` construido (ver «Comandos»).

### Una página con bloques

```vue
<script setup>
import { GContainer } from '@grana/vue'
import { GbHero01, GbFeatures01 } from '@grana/blocks/marketing'
import { hero, features } from './datos.js'
</script>

<template>
  <GContainer>
    <GbHero01 v-bind="hero" />
    <GbFeatures01 v-bind="features" />
  </GContainer>
</template>
```

Cambiar `GbFeatures01` por `GbFeatures02` no toca los datos: las tres variantes de una sección comparten la misma interfaz.

## Reglas de bloque estructural

Valen para todo bloque de Marketing (`design/contracts/blocks/_comun.md`, `docs/contract/api.md` «Grana Blocks»):

1. **Una sola `interface Props` por sección** (#763): las tres variantes importan el mismo objeto `props` y el mismo `emits`. Una variante no añade props; lo que no usa lo ignora en silencio, también frente a lo que compone, para que los mismos datos no hagan avisar a ninguna.
2. **Sin CSS ni utilidades** (#763, #807): lo que falte de forma es un hallazgo para el contrato o para el componente, nunca CSS del bloque. Las únicas clases que escribe son las pistas `g-adapt-*` de `GAdaptiveLayout`.
3. **Solo API pública de `@grana/vue`** (#792): nunca `__shared`, clases internas ni el DOM de lo que compone.
4. **Acciones por posición:** como mucho dos; la primera es la principal. El dato no dice cuál manda.
5. **Eventos de intención:** `navigate` (clic primario sin modificadores, nunca con `external` ni con `tel:`, `mailto:` o `sms:`; `event.preventDefault()` deja la navegación a tu router) y `activate` (una acción sin `href`). `item` es el elemento de datos que lleva el enlace.
6. **Encabezados por anidación:** el título de la sección lo pone su `GSection`; lo de dentro baja un nivel (`useSectionLevel()`). El único `h1` de la página es el de `GbHero`.
7. **Nada se mueve solo:** el único movimiento es el de los componentes que compone, con su movimiento reducido.
8. **Textos en `labels`, sin valores por defecto.** Falta uno que el estado necesita: aviso `C5` en desarrollo.
9. **Raíz con `data-gb="<sección>-<nn>"`** (identifica el bloque para pruebas, no es un gancho de estilo) y `$attrs` (`class`, `id`, `aria-*`, `data-*`).
10. **Avisos de desarrollo** con prefijo `[Grana Gb<Sección><NN>]`, una vez por instancia y motivo. Los comunes son C1 (lista vacía), C2 (elemento sin campo obligatorio), C3 (`id` repetido), C4 (`Media` sin tamaño o sin `alt`), C5 (falta un texto de `labels`), C6 (`href` `javascript:`), C7 (más elementos de los recomendados) y C8 (más de dos acciones).

## Tipos

Un `.d.ts` por entrada, generado en `npm run build` desde los `*.meta.json` (contrato de tipos #443) y los tipos compartidos de `types/marketing.d.ts`. Cada sección tiene su `Gb<Sección>Props`, y las 27 variantes y el plugin `marketing` amplían `GlobalComponents`. `dist/blocks.d.ts` (Gestión) sigue siendo mínimo. Los datos de marketing son estrictos (sin `[key: string]: unknown`): un campo mal escrito falla al compilar.

## Playground

Un banco por sección con los bloques reales y el banco de datos de la sección (`src/blocks/Gb<Sección>/<seccion>.bank.js`), en `playground/marketing/<seccion>.html`. Desde la raíz del repositorio, con `@grana/vue` y este paquete construidos:

```bash
python3 -m http.server 4213
# http://localhost:4213/packages/blocks/playground/marketing/hero.html
```

Parámetros: `?tema=defecto|rustico|lujo` (los dos últimos son temas generados con `@grana/cli`), `?dark=1`, `?v=01|02|03` (una sola variante; el héroe la exige, una página tiene un `h1`), `?zoom=2` (texto al 200 %), `?anidado=1` (los bloques dentro de una `GSection`).

## Comandos

```bash
npm test -w @grana/blocks         # vitest: 422 pruebas en 12 archivos
npm run build -w @grana/blocks    # vite build + tipos (scripts/build-types.mjs)
bash packages/blocks/scripts/gates.sh   # compuertas del paquete (tras el build); también las corre .github/scripts/gates.sh
```

Las compuertas vigilan que ningún bloque estructural lleve CSS, `<style>` ni utilidades, que `dist/marketing.js` no incluya Vue, `__shared` ni clases internas, que Gestión no arrastre Marketing y los topes de peso.

## Peso

Medido con `gzip -c` (2026-10-22, según los `meta.json` y la compuerta): `dist/marketing.js` **17 187 B** con tope de **18 432 B** (DECISIONS #844); una variante importada sola, de 1659 B (`GbFeatures01`) a 2431 B (`GbBlogList03`) entre las tres secciones `candidate` (tope **4096 B**), medida con `scripts/measure-partial.mjs`. `dist/blocks.js` tiene su propio tope de 8 KiB (#793).

## Qué no hay todavía

Reservado (`design/contracts/blocks/_comun.md` §11): la primitiva de texto `GText` (B-L5, #841), el nivel de encabezado propio de un acordeón en una sección (B-L4), la línea entre tarjetas planas (B-L6) y las secciones fuera del lote 2 (por ejemplo, `Member` para un bloque de equipo). Nada de eso se documenta como disponible.
