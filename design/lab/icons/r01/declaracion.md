# Declaración de cumplimiento · Iconos públicos · r01

**Estado:** en revisión. Fuente de verdad: `brief.md` de esta ronda.
**Ruta:** R1 · **Fidelidad:** F2 · **Material:** kit neutral de grises; iconos solo Lucide (los de la librería desde `design/lab/lucide-icons.js`, los «de la aplicación» **importados de `lucide-static`** en `node_modules`).
**Siguiente dueño:** lima → `docs/contract/icons.md` v0.2 y `docs/contract/api.md` (y DECISIONS, que revisa en parte la #86). Después coco (`GIcon.css`) y bruno.
**Prototipo:** `index.html` (10 secciones; un `GIcon` y un `createIcons` simulados en JS con la API propuesta). **Verificación:** `node design/lab/icons/r01/verificar.mjs` (Playwright, Chromium): **53/53**.
**Convención:** «propuesta kiwi» = recomendación que se asume si nadie la objeta; las que tocan decisiones del usuario están en §8.

## 0. Solapes revisados antes de proponer

| Ya existe | Relación |
| --- | --- |
| `GIcon` interno (`name`, `filled`, `aria-hidden`, 1em, `:where`) | **Es la base**: se hace público y se amplía; no se crea otro componente |
| Slots de icono de los componentes (`prepend`, `append`, `icon`, `lead`, `icon-on/off`, `toggle-icon`, `search-icon`, `more-icon`) | **Se quedan.** Siguen siendo el hueco; `GIcon` es lo que la aplicación pone dentro |
| Campo `icon` de los items (`GTabs`, `GMenu`, `GSidebar`), hoy dato opaco para el slot | Se le da un dibujo por defecto (§1.7) sin romper el slot |
| `GBtn` prop `icon` (Boolean, solo icono) | **No se toca**: impide usar `icon` como nombre en `GBtn` |
| `playground/lucide-icons.js` y `design/lab/lucide-icons.js` | Siguen siendo de playground y laboratorio; la aplicación **no** los usa (fricción 11 de la migración) |
| `GAvatarMotion` (ilustración, #105) | Sin relación: no es icono |

## 1. Decisiones (derivadas de estándares y de lo ya decidido)

| # | Pregunta | Propuesta | Fundamento |
| --- | --- | --- | --- |
| 1.1 | ¿`GIcon` público? | **Sí**, exportado y registrado por `install` como los demás | Hoy la aplicación no tiene vía oficial (E1, E5): pone «un `svg` cualquiera» o copia un archivo del playground. Todas las librerías de referencia tienen un icono público (Vuetify `v-icon`, Nuxt UI `UIcon`); shadcn delega en `lucide-vue-next` porque no tiene registro propio. Un `GIcon` público da los atributos correctos siempre (`currentColor`, trazo 2, `focusable="false"`, `aria-*`) |
| 1.2 | API | `name` (String, obligatorio) · `label` (String; sin él, decorativo) · `filled` (Boolean, ya existe) · `flip-rtl` (Boolean). **Sin** `size`, `color`, `stroke-width`, `spin` ni `title` | Color: `currentColor` hereda del texto o del control (verificado en botón primario). Tamaño: 1em del texto; cada hueco fija el suyo con su alias local (como hoy) y la aplicación usa su propia clase, que gana a `:where(.g-icon)` sin `!important` (verificado: 48 px). Giro: los componentes ya lo resuelven en su estado `loading` |
| 1.3 | Decorativo o con nombre | **Decorativo por defecto** (`aria-hidden="true"`). Con `label`: `role="img"` + `aria-label`, sin `aria-hidden`. Nunca enfocable. Sin `<title>` | WCAG 1.1.1 (técnica ARIA24: icono con `role="img"` y nombre). Un icono junto a texto es decorativo (H67 por analogía); solo es imagen con nombre si es la única fuente del significado (celda de estado). `<title>` añade tooltip nativo inconsistente entre navegadores y lectores. Si hay que pulsarlo, el nombre va en el **control** (`GBtn icon aria-label`), no en el icono |
| 1.4 | `label` dentro de un hueco `aria-hidden` | **Aviso de desarrollo** al montar (`closest('[aria-hidden="true"]')`); el icono se dibuja igual | Verificado en el árbol real: el nombre se pierde (el botón se llama solo «Permitir edición»). Es un error del consumidor, no un caso de uso |
| 1.5 | ¿Cómo se registra un icono que Grana no trae? | **Registro por aplicación** con cadenas importadas de **`lucide-static`**: `app.use(createIcons([LockOpen, MapPin]))` (atajo: `app.use(Grana, { icons: [...] })`). El **nombre no se escribe**: sale de la marca `class="lucide lucide-<nombre>"` que trae cada cadena; los alias (`Unlock`) dan el nombre canónico (`lock-open`) | `lucide-static` exporta **un módulo ES por icono** con `sideEffects: false`: el empaquetador solo lleva los importados (verificado con Vite: 1 icono = 542 B). No hay archivos copiados ni trazos a mano. Derivar el nombre evita erratas y desajustes nombre↔dibujo. **Por aplicación** (provide/inject), no un registro global de módulo: CLAUDE.md «sin globals de la app», SSR por petición y varias apps en una página; mismo patrón que `createToaster` (#140). Verificado: las **2 117** exportaciones de `lucide-static` v1.49.0 llevan la marca y, normalizadas, coinciden con lo que hoy genera `build-icons.mjs` |
| 1.6 | ¿Cómo se resuelve un nombre? | Registro de la aplicación → lista de la librería → aviso y nada (como hoy). **Los componentes de Grana no consultan el registro**: siguen usando su lista interna | La aplicación no puede cambiar por accidente la `x` de `GDialog` ni el `check` de `GCheckbox`. Registrar un nombre que ya trae la librería se acepta sin aviso (sirve de seguro si la lista base cambia) |
| 1.7 | ¿Cómo se garantiza «solo Lucide»? | **Por la forma del dato, igual en desarrollo y producción**: `GIcon` solo dibuja la lista de la librería o cadenas con la marca de Lucide y **solo elementos de dibujo** (`path circle rect line ellipse polyline polygon`, atributos geométricos y `fill` `none`/`currentColor`). Lo demás **no se registra** (aviso en desarrollo). Lo que no es Lucide (logotipos de marca) va por **slot**, como dice `icons.md` §5 | «Aceptar con aviso» dibujaría en producción cualquier SVG por `innerHTML`: un vector de inyección si la cadena viene de datos. Verificado: un SVG a mano, un texto y una cadena con `<script>` y `onload` disfrazada de Lucide se rechazan; nada se ejecuta ni entra al DOM. Validación por texto (sin `DOMParser`): funciona en SSR |
| 1.8 | Convención de los huecos | **«Dato → nombre; plantilla → slot».** (a) **Items** (`GTabs`, `GMenu`, `GSidebar`; candidato `GSelect` opciones): si el item trae `icon` **cadena** y no hay slot `icon`, el componente dibuja `<GIcon :name="item.icon">` en su hueco `aria-hidden`; con slot, manda el slot; otros valores siguen siendo opacos. (b) **Componentes sueltos** (`GBtn`, `GInput`, `GSelect`, `GSwitch`, `GBadge`, `GCard`): **sin props nuevas**; slot + `<GIcon>`. (c) **Títulos** (`GFormSection`, `GDialog`): slot **`lead`** como `GCard` (responde a `tokens.md` §23.6) | Los items vienen de JS, configuración o API: un nombre es su forma natural y hoy obliga a un `switch` en el slot. En una plantilla, el slot con `<GIcon>` es una línea y no añade API a seis componentes. `prependIcon`/`appendIcon` quedan como nombres **reservados** si algún día se piden; nunca `icon` en `GBtn` (es Boolean). Compatible: hoy un `icon` sin slot no dibuja nada |
| 1.9 | Iconos de dirección en RTL | `flip-rtl` **explícito** (`:dir(rtl)` → `scaleX(-1)`), nunca automático | Lucide no marca qué iconos son direccionales; espejar `check` sería un error. Verificado: solo espeja en RTL y solo donde se pide. El espejo interno de `GCard` sigue siendo interno |
| 1.10 | `lock-open`, `image`, `map-pin`, `play` | **No** entran en la lista de la librería: la aplicación los registra (§1.5). La lista base sigue siendo «lo que usan los componentes» (`icons.md` §4) | Ampliar la base por cada icono que pida una aplicación lleva a toda Lucide en el paquete (+74 % gzip, §6) sin poder podar (un mapa por nombre no se poda). La migración se resuelve con `createIcons([LockOpen])` |
| 1.11 | La lista de la librería, ¿es API? | **Sí**: documentada como «iconos incluidos»; puede crecer, **quitar uno es cambio mayor** | Con `GIcon` público, `<GIcon name="lock">` funciona sin registrar: retirarlo rompería aplicaciones. El seguro de §1.6 permite registrar defensivamente |
| 1.12 | ¿CLI (`grana icons add lock-open`)? | **No en v0.1** | Con un empaquetador, importar de `lucide-static` ya da solo lo usado (verificado); un comando que genere un subconjunto duplica al empaquetador y añade un paso. Solo serviría sin empaquetador (UMD/CDN): queda como pendiente si hay demanda |
| 1.13 | ¿`lucide-static` como dependencia de Grana? | Sigue siendo **devDependency** (#86). La aplicación instala `lucide-static` por su cuenta (su versión, su licencia ISC: el aviso `@license` viaja en su bundle, verificado en la salida de Vite) | Grana no fija la versión de Lucide de la aplicación. Propuesta para lima/bruno: `peerDependency` **opcional** para documentar el rango |

## 2. Anatomía del `svg`

| Atributo | Decorativo | Con `label` |
| --- | --- | --- |
| `class` | `g-icon` (+ `g-icon--filled`, `g-icon--flip-rtl`) | igual |
| `viewBox`, `fill`, `stroke`, `stroke-width`, `stroke-linecap`, `stroke-linejoin` | Los de hoy (`0 0 24 24`, `none`/`currentColor`, `currentColor`, `2`, `round`, `round`) | igual |
| `focusable` | `false` | `false` |
| `aria-hidden` | `true` | — |
| `role` / `aria-label` | — | `img` / el `label` |
| Hijos | Trazos de la lista o del registro (`innerHTML` de una cadena ya validada) | igual |

## 3. Hallazgos para lima (API y tokens; sin valores)

1. **`icons.md` §2:** retirar «No se registra como componente público»; `GIcon` público con `name`, `label`, `filled`, `flip-rtl` (§1.2–1.4). Nombre de `flip-rtl` a elección de lima (`mirror-rtl`, `rtl-flip`…).
2. **`icons.md` §5 nuevo:** «Iconos de la aplicación»: `createIcons(list)` (plugin + `iconsKey` exportada para `provide` manual, como `formKey`/`toasterKey`) y/o la opción `icons` de `install`; lista de cadenas de `lucide-static`; nombre derivado de la marca; rechazos de §1.7; orden de resolución de §1.6. Lima decide si existen las dos formas o solo una (kiwi prefiere `createIcons` + la opción de `install` como atajo).
3. **Convención de huecos** (§1.8) en `api.md`: «dato → nombre; plantilla → slot»; `icon` cadena en items (`GTabs`, `GMenu`, `GSidebar`; decidir `GSelect` opciones); nombres reservados `prependIcon`/`appendIcon`.
4. **Slot `lead`** en `GFormSection` (y decidir `GDialog`): decorativo, antes del título, fuera del nombre del encabezado (cierra `tokens.md` §23.6).
5. **Lista de la librería como API** (§1.11) y la **regla de §4** se mantiene: un icono entra al paquete solo si lo usa un componente.
6. **`icons.md` §7 (prueba):** «`GIcon` con un nombre fuera de la lista» aplica a los **componentes de Grana**, no a la aplicación.
7. **Tokens: ninguno nuevo.** El tamaño de icono por token (pendiente de `GBtn.meta.json`) no lo resuelve esta ronda: cada hueco sigue con su alias local.
8. **DECISIONS:** la propuesta revisa en parte la **#86** («componente interno», «Grana no trae colección») — ver §8.

## 4. Hallazgos para coco y bruno

- **coco (`GIcon.css`):** regla de `flip-rtl`; nada más cambia (el `:where` ya deja ganar a la clase de la aplicación).
- **bruno:** `GIcon` (`label`, `flip-rtl`, aviso de §1.4, consulta del registro); `createIcons` + validación por texto (§1.7) con pruebas contra **todas** las exportaciones de `lucide-static` (si Lucide cambia el formato de la marca, la prueba debe fallar); `GTabs`: hoy `labelMode="icon"` exige el slot (`slots.icon && hasIconValue`): con §1.8, un `icon` cadena también cuenta; lo mismo en `GMenu` (`slots.icon && it.icon !== undefined`) y `GSidebar` (`iconNode`). Playground: generar su módulo con las **cadenas completas** de `lucide-static` (con marca) y registrarlas con `createIcons`, para que el playground ejercite la vía pública.
- **Migración** (`design/lab/migraciones/analisis/index.html`): sustituir el `<lucide-icon>` propio por `GIcon` + `createIcons([LockOpen])` cuando exista (fricción 11 y fricción 1 del patrón de bloqueo).

## 5. Verificado (Chromium, `verificar.mjs`, 53/53)

- **Árbol real (CDP)** de los 24 iconos de ejemplo: 22 fuera del árbol y solo los dos con `label` de la tabla como `image` «Bloqueado» / «Edición permitida».
- Botón solo icono: `button` «Desbloquear» (icono fuera). Botón con texto: «Permitir edición». Con `label` dentro del hueco: también «Permitir edición» (el nombre se pierde, de ahí el aviso). Encabezado con icono y sección con `lead`: nombre = solo el texto.
- Registro: `LockOpen`/`Unlock`/`MapPin`/`Image`/`Play` → `lock-open`/`lock-open`/`map-pin`/`image`/`play`; `Lock` aceptado (ya en la librería); rechazados el SVG a mano, el texto y la cadena con `script`/`onload` (sin ejecución ni rastro en el DOM). `map-pin` dibujado = mismos elementos y atributos que `lucide-static`.
- Exactamente 5 avisos de desarrollo esperados (nombre desconocido, `label` en hueco oculto, 3 rechazos), en el panel; **consola sin errores ni avisos** y sin peticiones fallidas.
- Tamaño 1em sin clase; 48 px con clase de la aplicación; `currentColor` igual al del botón; `flip-rtl` espeja solo en RTL.
- Pestañas desde datos: icono por nombre en las 4 que lo traen, «Notas» sin hueco; flecha derecha mueve el foco.
- 375 px sin desplazamiento horizontal. `check-icons.mjs`: 0 archivos con infracciones.
- Fuera del prototipo (script en el scratchpad, no versionado): **SSR** con `renderToString` de Vue 3 de un `GIcon` mínimo con registro por `provide`/`inject` e `innerHTML`: dos aplicaciones renderizadas a la vez con registros distintos no se mezclan.

## 6. Impacto en tamaño (medido el 2026-10-02)

Método: `gzip -9` (y brotli de referencia) con `node:zlib`; trazos normalizados con `readIcon` de `build-icons.mjs`; poda con `vite build` de un módulo que importa de la entrada principal de `lucide-static`.

| Qué | Bruto | gzip |
| --- | --- | --- |
| `dist/grana.js` actual | 483 453 B | 121 384 B |
| Lista de la librería (25 iconos, ya incluida) | 2 306 B | 712 B (0,6 % del gzip) |
| + 4 iconos (`lock-open`, `image`, `map-pin`, `play`) | +560 B | +160 B |
| Toda Lucide como mapa por nombre (1 857 nombres) | 439 338 B | 89 937 B (**+74 %**) |
| Por icono (bruto, normalizado) | mediana 165 B · p90 296 B · máx. 808 B | — |
| App con 1 icono de `lucide-static` (podado) | 542 B | 373 B |
| App con 4 iconos de `lucide-static` (podado) | 1 748 B | 583 B |

`GIcon` público y `createIcons` añaden código, no datos: unos cientos de bytes (no medido hasta que exista). Las cadenas de `lucide-static` traen espacios y el aviso de licencia (por eso ~540 B frente a ~120–170 B normalizado); es el coste de no copiar archivos.

## 7. NO verificado

- Firefox y WebKit; lectores de pantalla reales (VoiceOver, NVDA) con `role="img"` en `svg`; `forced-colors` real.
- El componente Vue real (el prototipo simula `GIcon` y el registro en JS; el SSR se probó con un componente mínimo, no con `GIcon`).
- Poda con otros empaquetadores (webpack, Rollup puro, esbuild directo): solo Vite.
- Uso sin empaquetador (UMD/CDN) importando `lucide-static` desde una CDN.
- Interoperar con `lucide-vue-next` (o su sucesor) como componentes: no está instalado; la propuesta no lo necesita.
- Estabilidad del formato de la marca `class="lucide lucide-<nombre>"` en versiones de `lucide-static` distintas de la 1.49.0 (de ahí la prueba de §4).
- Tipos de TypeScript para los nombres (autocompletado): fuera de alcance.

## 8. Preguntas de producto abiertas

1. **¿Se revisa la #86 para hacer `GIcon` público con registro por aplicación (`createIcons` con `lucide-static`)?** Era una decisión del usuario («componente interno», «Grana no trae colección»). Propuesta kiwi: **sí**; Grana sigue sin traer colección (solo la lista que usan sus componentes), pero da la vía oficial para Lucide.
2. **¿«Solo Lucide» se impone también a la aplicación dentro de `GIcon`?** Propuesta kiwi: **sí, estricto** (§1.7): `GIcon` solo dibuja Lucide; un logotipo o un icono propio va por slot y es responsabilidad de la aplicación. La alternativa (aceptar cualquier SVG con aviso) abre `innerHTML` a datos arbitrarios y diluye la identidad «solo Lucide».
