# Brief funcional · GSidebar · r01

**Agente:** kiwi (ejecutado por el squad siguiendo `.agents/skills/bruno/references/handoffs.md`)
**Ruta:** R1 · prototipo directo **Fidelidad:** F2 · wireframe mid-fi con kit neutral

## Enunciado

Un **desarrollador que usa Grana** necesita una **navegación lateral** (principal o secundaria) para dashboards, SaaS, herramientas internas y PWAs, que **oriente al usuario** (dónde está y qué más hay), **respete la jerarquía** (grupos, items, hijos) y **ceda espacio al contenido**: expandida en escritorio, **riel de iconos** en anchos medios y **navbar inferior** (o drawer) en móvil, sin construir tres barras distintas ni resolver por su cuenta el teclado, los paneles flotantes ni los nombres accesibles cuando solo se ven iconos.

Decisiones del usuario (respuestas de alcance): la navegación se define con un **arreglo `items`** (grupos, items, hijos) y **slots** (logo, búsqueda, pie, contenido del item); la **búsqueda es solo un disparador** (campo compacto expandido, botón de icono en riel) que emite un evento y la aplicación decide qué abre; la adaptación es **un solo sistema** «expandido → riel → drawer» por el **ancho del contenedor**, con `mode` manual y el estado `collapsed` controlable, y el drawer es un `<dialog>` nativo. **Añadido después por el usuario: en móvil debe poder transformarse en un navbar**, colocado **abajo** (barra de pestañas), con los **primeros N items** y un botón **«Más»** que abre el drawer con toda la navegación. **Estilo elegido: «píldora activa»** (barra flotante; el item actual se expande en una píldora con icono y etiqueta, los demás quedan como icono).

Brief de diseño del usuario (resumen): superficie vertical continua y silenciosa (sin tarjetas sueltas), jerarquía por espaciado, peso y una línea de conexión sutil (profundidad contenida), estado activo integrado (fondo apenas elevado, sin indicadores estridentes), estados default/hover/focus/active/expanded/disabled, iconos lineales y consistentes, grupos con menos peso visual que los items, área de usuario anclada al final, región central con scroll sin mover logo ni perfil, animaciones cortas, variantes expandida, colapsada, flotante, fija, superpuesta, drawer móvil, con búsqueda, con grupos, con submenús y con perfil.

## Pregunta de diseño

¿Qué anatomía, estados y comportamiento necesita `GSidebar` para que **la orientación se conserve al pasar de expandida a riel a drawer** (el item activo y su rama siempre reconocibles), para que **un riel solo de iconos siga siendo plenamente accesible** (nombres reales en el DOM, no solo tooltips; submenús operables con teclado y no solo con el puntero) y para que **una sola API** cubra las tres formas sin ramas por dispositivo?

## Verbo y resultado

- **Verbo principal:** ir a otra sección conservando la orientación.
- **Resultado verificable:** el item activo (`aria-current="page"`) y su rama son reconocibles en los tres estados; cada item del riel se anuncia con su nombre y su indicador; un submenú del riel se abre con clic, Enter, Espacio o →, se cierra con Esc devolviendo el foco, y no depende del puntero; el drawer atrapa el foco, cierra con Esc, con el fondo y al elegir un destino.

## Anatomía

| Parte | Obligatoria | Nota |
| --- | --- | --- |
| Raíz (`g-sidebar`) | Sí | Superficie vertical continua; clases de estado (`expanded`, `rail`, `drawer`, `fixed`, `floating`) |
| Cabecera | No | Logo (slot, con versión de riel), botón de contraer/expandir y búsqueda |
| Búsqueda | No | Campo compacto (botón con aspecto de campo) → botón de icono en riel; emite `search` |
| Región de navegación (`<nav aria-label>`) | Sí | Con scroll propio; contiene **solo** enlaces y botones de submenú |
| Grupo | No | `<ul>` con título de grupo (menos peso; oculto en riel pero **presente para lectores**) |
| Item (enlace) | Sí | `<a href>` con icono, etiqueta, indicador (contador o punto) y `aria-current="page"` si es la ruta actual |
| Item con hijos | No | `<button aria-expanded aria-controls>`; hijos en línea (expandida) o **panel flotante** (riel); un solo nivel de hijos |
| Panel flotante (`g-sidebar__fly`) | Solo riel | `popover` anclado al item, con el nombre del padre y sus hijos |
| Pista (tooltip) | Solo riel | Ayuda visual del nombre; `aria-hidden`, **nunca la única fuente** del nombre |
| Pie / usuario | No | Botón con avatar, nombre y rol (en riel, solo avatar con nombre accesible); anclado abajo |
| Navbar (`g-sidebar` en modo `navbar`) | Solo móvil | `<nav aria-label>` inferior con N items (icono + etiqueta corta de 12px, 52px de alto) y un botón final «Más»; el activo, con la misma superficie elevada |
| Botón «Más» | Con navbar | `aria-haspopup="dialog"`; abre el drawer completo (grupos, búsqueda, usuario); se marca como **rama activa** si la página actual no está en la barra |
| Drawer | Móvil | `<dialog>` modal desde el borde inicial con el mismo contenido expandido; es el «Más» del navbar o, con `mobile="drawer"`, el único formato móvil (botón de menú de la aplicación) |

## Estados

Item: default, hover, focus-visible, active (`aria-current`), rama activa (padre con hijo activo), expanded (padre abierto), disabled. Barra: expanded, rail, drawer abierto/cerrado, fixed, floating, overlay (el riel expandido sobre el contenido), con/sin búsqueda, grupos, submenús y usuario, con scroll.

## Comportamiento

- **Adaptación (`mode` automático):** por el ancho del contenedor: ≥ ~960px expandida, ~600–959px riel, < ~600px **navbar** (o drawer, con `mobile="drawer"`). El usuario puede contraer y expandir a mano; esa elección **se conserva mientras el ancho no cambie de clase**. `mode` fija el estado y `collapsed` es controlable.
- **Riel:** las etiquetas se ocultan visualmente pero **siguen en el DOM**; los títulos de grupo, igual. El estado activo se conserva; los contadores pasan a una marca pequeña sobre el icono con su texto oculto.
- **Panel flotante (riel):** un padre abre su panel con **clic, Enter, Espacio o →**, y con el **puntero encima** (con retardo y margen de gracia para llegar al panel). **El foco solo no lo abre** (mostraría paneles al tabular). Al abrir con teclado, el foco va al primer hijo; Esc o ← lo cierran y devuelven el foco al padre; Tab hacia fuera lo cierra. El panel está pegado al item (sin hueco) y lleva su nombre.
- **Teclado:** Tab recorre los enlaces (patrón de navegación con divulgación); además ↑ ↓ Inicio Fin mueven entre los items visibles.
- **Subniveles:** un solo nivel de hijos (profundidad contenida), con línea de conexión sutil y sangría corta.
- **Drawer:** se abre con `open` desde el botón de la aplicación, atrapa el foco, cierra con Esc, con el fondo o al elegir un destino (`closeOnNavigate`), y devuelve el foco al botón.
- **Navbar:** muestra los items marcados `primary` o, si no hay, los **primeros N** (4 por defecto, 3 a 5) que no estén deshabilitados; un padre en la barra **abre el drawer con su rama abierta**; «Más» abre el drawer completo. Si la página actual **no** está en la barra, el botón «Más» (o el padre) se marca como rama activa con un texto oculto «contiene la página actual». La búsqueda y el usuario viven en el drawer. Tab recorre; ← → Inicio Fin mueven entre los items de la barra.
- **Scroll:** la región central hace scroll; cabecera y pie quedan fijos.

## Riesgo por acción

Ninguno (navegar es reversible). El riesgo es de **orientación**: perder el item activo al colapsar o abrir un submenú que solo el puntero alcanza. Por eso el estado activo y su rama siempre se ven, los nombres viven en el DOM y los paneles se abren con teclado.

## Continuidad

- **Objetivos:** item de 40px (44px con `pointer: coarse`); botón de icono del riel de 44px; item del navbar de al menos 44×52px; etiquetas del navbar de 12px como mínimo.
- **Zoom 200% y 320px:** el drawer ocupa el ancho disponible sin desborde.
- **Movimiento:** expandir/contraer, aparecer etiquetas, abrir panel y drawer con transiciones cortas; `prefers-reduced-motion` las quita.
- **Colores forzados:** el item activo conserva un contorno; el foco, `Highlight`.
- **RTL:** propiedades lógicas; el panel flotante y la pista salen hacia el lado final.

## Alcance

| Must | Should | Could | Won't (v0.1) |
| --- | --- | --- | --- |
| Expandida, riel, **navbar inferior** y drawer con un solo sistema; grupos; items; un nivel de hijos; activo y rama | Panel flotante en riel con teclado; pista visual en riel | Variante `overlay` (riel que se expande sobre el contenido) | Árbol de más de un nivel de hijos; navbar superior o con scroll horizontal |
| Nombres reales en el DOM en riel; `aria-current` | Buscador disparador; pie con usuario | Contadores y puntos | Buscador propio que filtre los items |
| Región central con scroll; cabecera y pie fijos | Variantes `fixed` y `floating` | Estado persistido (lo hace la aplicación) | Menú contextual completo del usuario (será `GMenu`) |
| Teclado completo; foco visible | `mode` y `collapsed` controlables | | Reordenar o arrastrar items; anclar favoritos |
