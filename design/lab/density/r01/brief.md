# Brief · densidad global y por región (pieza 2) · r01

**Rol:** kiwi · **Fecha:** 2026-10-29 · **Tipo:** ronda de mecanismo (no hay forma visible nueva; sin A/B/C de forma).
**Encargo:** pieza 2 del orden de #969: densidad global y por región con el mecanismo combinado D (atributo `data-g-density` en cualquier elemento, `<html>` incluido, más la clave `density` del CLI y lectura en JS solo donde hay lógica).
**Decisiones vigentes que no se reabren:** #966 (en `compact` el texto baja un escalón con piso de 12 px; es la pieza 3), #967 (tres pasos `compact`/`default`/`comfortable`, sin alias; `GCalendar` en la pieza 4), #969 (orden y mecanismo D), #970 a #973 (16 px editable en táctil), #15 (multiplicador 1 · 0,875 · 0,75, piso de 24 px), #682 (rejilla de 0,5 px), §7 de `tokens.md` (44 px táctil).

## Problema del usuario final

Una pantalla de gestión mezcla zonas que piden aire (un formulario de alta) con zonas que piden ver más (una tabla con su barra). Hoy la densidad se elige **control por control**: para tener una barra compacta hay que escribir `density="compact"` en cada botón, campo, tabla y menú, y aun así se cuela algo (el menú que abre la barra, los botones de `GFormActions`, el diálogo de edición). El resultado es una barra con alturas mezcladas. Y no hay forma de que la persona que usa la aplicación elija «vista compacta» para todo.

## Lo que se pide resolver

1. Precedencia: prop explícita > región más cercana > clave global del tema > `default`, sin romper la API ni los `meta.json` (#443).
2. Cómo se lee la región (CSS, `provide`/`inject` o las dos), con SSR, medidas en JS y peso (#506 sin margen).
3. Paneles que se abren desde una región (capa superior, diálogo, hoja del teléfono, avisos e isla).
4. Anidación, y la región en `<html>` frente a la clave global del CLI.
5. Formularios: `GForm` deja de imponer `'default'`; `GFormRow` y los mínimos publicados.
6. Táctil: 44 px y 16 px ganan siempre.
7. Qué cambia en cada componente.

## Fuentes leídas

`CLAUDE.md`, `AGENTS.md`, `DECISIONS.md` #966 a #973, `design/lab/config-global/inventario.md` (lima, 86ca992), `docs/contract/tokens.md` §4 y §7, `docs/contract/api.md` (fila `density`, «Zona de marca»), `design/contracts/form.md` §2 y las clases de `GForm`/`GFormLayout`/`GFormRow`, `dialog.md`, `menu.md`, el CSS y el `.vue` de `GBtn`, `GInput`, `GForm` (`formContext.js`), `GTable`, `GMenu` y `GDialog`, los `*.meta.json` de los 38 componentes con `density`, los `<Teleport>` del paquete y `~/.agents/skills/fluid-functionalism/references/craft.md` §Sizes.

## Solapes revisados (no se duplica)

- **Zona de marca** (`data-g-zone`, #620 a #625): es el mismo patrón (un ámbito de tokens por atributo, que heredan los paneles de la capa superior). La densidad lo copia, regla por regla, en vez de inventar otro.
- **`data-theme` y #561** (`:root:where(:not([data-theme=…]))`): es la forma en que el CLI emite un valor global que cede ante el atributo en `<html>`. Se reutiliza para la clave `density`.
- **Contexto de formulario** (`formKey`/`layoutKey`, `form.md` §2): ya comparte la densidad con los campos. No se crea una segunda clave: el contexto deja de llevar la densidad para el CSS (lo hace la región) y la conserva solo para la lógica.
- **`utils/glide.js`, `keyFocus.js`, `edgeReserve.js`**: no se tocan.
- **Fluid Functionalism** `SizeProvider`: la referencia de comportamiento. No se copia su mecanismo (contexto de React), porque en Grana los paneles se abren en su sitio (capa superior, sin portal) y el CSS ya cruza.

## Entregables

- `declaracion.md`: decisiones numeradas, tablas de precedencia y de herencia por componente, A/B del alcance de la prop, «Qué lo hace distinto», reservado, hallazgos para lima y preguntas.
- `index.html` + `density-proto.css`: prototipo con los componentes reales de `dist/` y el tema por defecto, más un shim que emula el token y la lectura «sin prop».
- `verificar.mjs`: 36 comprobaciones en Chromium (puerto 4212).
