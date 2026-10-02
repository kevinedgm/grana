# Brief · Iconos públicos (r01)

> Brief de kiwi (2026-10-02) a partir del encargo del usuario, verificado contra el repo. No es un componente nuevo con estados: es **cómo una aplicación usa un icono de Lucide** en sus campos, botones, secciones y contenido con Grana, sin trazos a mano ni copiar archivos.

## El problema

`GIcon` existe pero es **interno** (`docs/contract/icons.md` §2: «No se registra como componente público»). La regla vigente (§5, DECISIONS #86) dice que los iconos de la aplicación van por **slots** y que «Grana no trae colección». Pero no hay una vía oficial para que la aplicación obtenga ese icono: la documentación dice «usa Lucide (por ejemplo, con `lucide-vue-next`)», que **no** es dependencia de nadie, y la única forma real que existe hoy en el repo es cargar un archivo del playground.

## Evidencias en el repo

| # | Dónde | Qué pasó |
| --- | --- | --- |
| E1 | `design/lab/migraciones/analisis/notas.md`, fricción 11 (en el encargo, «fricción 6») e `index.html` l. 156–265 | La migración del modal de Bootstrap necesitaba `lock`. Está en la lista de la librería, pero sin forma pública de usarlo: la página carga `packages/vue/playground/lucide-icons.js` (un archivo del playground) y define su propio `<lucide-icon>` |
| E2 | Mismas notas, l. 62 y fricción 1 del «Patrón: formulario con bloqueo de edición» (l. 71) | Falta `lock-open`: el estado «Edición permitida» se quedó **sin icono** porque no está en `icons.json` |
| E3 | `docs/contract/tokens.md` §23.6 | «Iconos en títulos»: `GFormSection` y `GDialog` no tienen hueco de icono; el patrón sería un `lead` como el de `GCard`; «lo decide otra ronda (kiwi, iconos públicos)». Esta |
| E4 | `docs/contract/icons.md` §4 y DECISIONS #137 | `image`, `map-pin` y `play` (ejemplos de `GCard`) viven solo en las listas `playground` y `lab` de `packages/vue/scripts/icons.json`, **nunca en el paquete**: una aplicación que copie el ejemplo del README no tiene de dónde sacarlos |
| E5 | `packages/vue/src/components/GBtn/README.md` l. 67–71 | El README enseña `<g-btn icon aria-label="Añadir"><svg …/></g-btn>`: el `svg` lo pone «quien sea» |
| E6 | `GBtn.meta.json`, `pending` | «Tamaño de icono por token» pendiente |

## Lo que hay hoy (verificado en el código)

- **`GIcon`** (`packages/vue/src/components/GIcon/GIcon.vue`): `name` (de la lista) y `filled`; siempre `aria-hidden="true"`, `focusable="false"`, `currentColor`, trazo 2; nombre desconocido → aviso en desarrollo y no dibuja nada. CSS en `:where(.g-icon)` (especificidad 0), 1em.
- **Datos:** `src/icons/lucide.js` (generado por `scripts/build-icons.mjs` desde `lucide-static` v1.49.0, devDependency) con **25** iconos, un objeto `ICONS` por nombre.
- **Huecos de icono en los componentes:** todos son **slots** envueltos en un `span aria-hidden="true"`: `prepend`/`append` (`GBtn`, `GInput`, `GSelect`), `icon` con ámbito para listas de items (`GTabs`, `GMenu`, `GSidebar`, `GSelect` opciones, `GBadge`), `lead` (`GCard`), `icon-on`/`icon-off` (`GSwitch`), `toggle-icon`, `search-icon`, `more-icon` (`GSidebar`), `trigger` (`GHelper`). En los items (`GTabs`, `GMenu`, `GSidebar`) el campo **`icon` es un dato opaco** que solo se pasa al slot: **sin slot, no se dibuja nada**.
- **`GBtn` ya usa la prop `icon`** como **Boolean** (modo solo icono, con aviso si falta `aria-label`).

## Lo que pide el encargo

Decidir (1) si `GIcon` pasa a ser público y con qué API; (2) cómo se registran los iconos que la librería no incluye; (3) cómo se garantiza «solo Lucide»; (4) la convención de los huecos de icono entre componentes; (5) el impacto en tamaño y en el CLI; (6) qué hacer con `lock-open` y los iconos que viven solo en playground y laboratorio.

## Fuera de esta ronda

- Contratos (`icons.md`, `api.md`), CSS, `.vue`, `icons.json` y el script: son de lima, coco y bruno.
- Iconos de marca (logotipos) y pictogramas propios: no son Lucide (§1 de `icons.md`); siguen yendo por slot.
- Tamaños de icono por token (pendiente de `GBtn`): se deja anotado para lima/coco.
