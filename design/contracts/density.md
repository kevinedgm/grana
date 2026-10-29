# Contrato · densidad global y por región (piezas 2 y 3 de la configuración global)

**Dueño:** lima · **Estado:** pieza 2 construida y auditada (#985); **pieza 3 (el texto sigue la densidad, §16, #986 a #995) contratada el 2026-10-29, pendiente de coco y de bruno** · **Basado en:** `design/lab/density/r01/` (kiwi, c7f42d1: `declaracion.md` D1 a D9, P1, P2, G1 a G6, L1 a L6; prototipo y `verificar.mjs` 36/36 en Chromium) · **Decisiones:** #974 a #982 (`DECISIONS.md`) · **Antecedentes que no se reabren:** #15 (multiplicador 1 · 0,875 · 0,75 y piso de 24 px), #561 (forma de emisión del CLI), #566 (el diálogo corta el contexto de formulario), #682 (rejilla de 0,5 px), #966 (el texto baja con `compact`: pieza 3), #967 (tres pasos), #969 (orden y mecanismo D), #970 a #973 (16 px editable en táctil), `tokens.md` §7 (44 px táctil).

**Regla en una línea.** La densidad viaja por CSS: un token heredable, `--g-density`, que reasigna el atributo `data-g-density` en cualquier elemento; la prop `density` de un componente **es la región de ese componente**; el JS solo lee la densidad donde hay lógica que mide.

---

## 1. Precedencia

| Orden | Fuente | Dónde vive | Quién la escribe |
| --- | --- | --- | --- |
| 1 | **Prop `density` explícita** | `data-g-density="{valor}"` **y** clase `g-<tag>--density-{valor}` en la raíz del componente | La aplicación, por instancia |
| 2 | **Región más cercana**: el ancestro del DOM más próximo con `data-g-density` (incluida la raíz de un componente con prop, que es una región por la regla 1) | `[data-g-density="…"] { --g-density: … }` en `grana.defaults` | La aplicación, en **sus propios elementos** (§3.3) |
| 3 | **`<html data-g-density>`**: la preferencia de quien usa la aplicación (P1) | La misma regla, sobre `:root` | La aplicación (un ajuste «Vista compacta · normal · amplia», guardado y pintado por el servidor) |
| 4 | **Clave `density` del CLI**: el valor del producto | `:root:where(:not([data-g-density])) { --g-density: … }`, **sin capa** (forma de #561) | `@grana/cli` (§6) |
| 5 | **`default`** | `:root { --g-density: 1; }` en `grana.defaults` | coco |

- **Anidación:** manda la región más cercana (herencia del DOM). `data-g-density="default"` es un valor válido que **devuelve el paso 1** dentro de una región más apretada; para heredar no se escribe nada.
- **Con puntero grueso** (`pointer: coarse`) las fuentes 2 a 4 **ceden al dedo** y valen 1; la 1 no cede (§5).
- **Sin `provide`/`inject` de densidad** (#975): la herencia del DOM ya resuelve la región, la anidación, el top layer y el SSR.

## 2. El token y el atributo

| Nombre | Qué es | Valores |
| --- | --- | --- |
| **`--g-density`** | Multiplicador de densidad heredable (número, no palabra: lo consumen los `calc()`). Grupo de estructura (`tokens.md` §6 y §58) | `1` (`default`), `0.875` (`comfortable`), `0.75` (`compact`). **Solo esos tres** (#967); cualquier otro valor no es contrato |
| **`data-g-density`** | Atributo público de región | `default` · `comfortable` · `compact`. Otro valor: no hace nada (ninguna regla lo reconoce); sin aviso |

- **Lo escriben solo** `defaults.css` (coco: las reglas de §2.1) y el CLI (§6). Ninguna hoja de componente declara `--g-density`; cada raíz lo **lee** en su alias local (`--_density: var(--g-density)`, `--_d`, `--_df`…), sin valor de respaldo.
- **Se cambia con el atributo, no con el token.** Una aplicación que escriba `style.setProperty('--g-density', …)` o un `tokens.css` con `--g-density` en `:root` queda fuera de contrato: el observador de §7 no lo ve y una regla sin capa en `:root` taparía `<html data-g-density>`. Por eso el CLI **rechaza** `--g-density` en `overrides` (§6).

### 2.1 Reglas de `defaults.css` (capa `grana.defaults`; texto exacto a criterio de coco, efecto de contrato)

```css
:root { --g-density: 1; }
[data-g-density="default"] { --g-density: 1; }
[data-g-density="comfortable"] { --g-density: 0.875; }
[data-g-density="compact"] { --g-density: 0.75; }

@media (pointer: coarse) {                                   /* P2 · cede al dedo (§5) */
  :root, [data-g-density] { --g-density: 1; }
  [data-g-density="comfortable"][class*="--density-comfortable"] { --g-density: 0.875; }
  [data-g-density="compact"][class*="--density-compact"] { --g-density: 0.75; }
}
```

`sync-defaults.mjs` del CLI copia solo el bloque `:root` (con `--g-density: 1`): las reglas de atributo y la consulta táctil no entran en `DEFAULTS` (bruno lo comprueba en su prueba de desfase).

## 3. La prop es una región (B, decisión del usuario)

### 3.1 Qué emite un componente con `density`

| | Sin prop (`undefined`) | Con prop explícita (incluido `'default'`) |
| --- | --- | --- |
| Clase `g-<tag>--density-{d}` | **No** | Sí, en la raíz |
| Atributo `data-g-density="{d}"` | **No** | Sí, en el **mismo elemento** que la clase, escrito **después** de `$attrs` (la prop gana a un `data-g-density` de la aplicación) |
| Qué aprieta | Sigue la región por CSS | El componente **y todo lo que lleva dentro** (botones de la barra de `GTable`, contenido de `GDialog`, `GCard`, `GSurface`, `GSidebar`, `GStack`, `GSplit`…) |

- **Raíz de fragmento o raíz que no es la caja:** clase y atributo van en el elemento que pinta. `GMenu`: en `g-menu__list` (la lista y sus submenús, que van dentro). `GCard`: en su raíz, que es la `GSurface` (`g-surface--density-*`, `card.md`). `GWidgetConfig` y `GWidgetGallery`: en el `<dialog>` raíz, junto a `g-dialog`.
- **Para salir de la región dentro de un componente con prop:** `density` en el hijo (`<GBtn density="default">`) o `data-g-density` en un elemento propio que envuelva la parte. Es el coste aceptado de B.
- **`GDatePicker inline` ignora la prop pero sigue la región** (#983): su superficie lee `var(--g-density)` como cualquier hoja; no escribe clase ni atributo (la prop se ignora con su aviso, `datepicker.md`). Antes de #976 un `GForm` con `density` no lo apretaba porque `inline` no leía el contexto; ahora sí porque la densidad ya no viaja por el contexto, y es lo que B pide (la región manda sobre lo que contiene).
- **`GCalendar` no entra** (escala propia `compact`/`comfortable`/`spacious`, #967): sigue con su clase «Siempre», no escribe `data-g-density` y no lee la región hasta la pieza 4.

### 3.2 Default de la prop: `null` con `resolvedDefault` (D1)

Las **18 raíces** que hoy declaran `default: 'default'` —`GBtn`, `GCard`, `GCheckbox` (solo su `meta.json`; el `.vue` ya es `undefined`), `GDialog`, `GForm`, `GMenu`, `GSidebar`, `GSpeechTrigger`, `GSplit`, `GStack`, `GStepper`, `GSurface`, `GTable`, `GTabs`, `GWidget`, `GWidgetConfig`, `GWidgetGallery`, `GWidgetGrid`— pasan a `default: undefined` en el `.vue` y, en el `meta.json`, a la forma ya contratada de los campos:

```json
{ "name": "density", "type": "String", "default": null, "values": ["default", "comfortable", "compact"], "resolvedDefault": "default", "note": "Sin valor: la región más cercana (data-g-density) › <html data-g-density> › clave density del tema › default (density.md §1)" }
```

El tipo de los `.d.ts` no cambia (`'default' | 'comfortable' | 'compact'`, opcional; #443). La **nota de los campos** (`GInput` y los de G2, que hoy dicen «prop explícita › contexto de GForm › default de siempre») pasa al mismo texto. También `GResourceList` (`@grana/blocks`, `resource-list.md`): `default: null` y pasa `density ?? undefined` a `GTable`.

### 3.3 Dónde escribe la aplicación el atributo

- **En sus propios elementos** (`<section data-g-density="compact">`, `<html>`), y en la raíz de un componente **que no tiene `density`** y hereda atributos en la raíz.
- **En un componente con `density`, la prop**, nunca el atributo: los campos (`GInput`, `GSelect`, `GTextarea`…) tienen `inheritAttrs: false` y mandan los atributos al control nativo, así que un `data-g-density` en `<GInput>` caería en el `<input>` y no apretaría nada. Sin aviso de desarrollo (no compensa su peso en 37 componentes); lo dice el README de cada uno (mora-docs).

### 3.4 Componentes que componen otros: solo lo explícito (D6)

Un componente que compone otro le pasa **`density ?? undefined`** (nunca un valor resuelto con `'default'` como último recurso, que convertiría al hijo en explícito y taparía la región). Lista comprobada por kiwi: `GNumberField`, `GCombobox`, `GTimeField` (`PASS`), `GCheckboxGroup`, `GSpeechTrigger`, `GWidgetConfig`, `GWidgetGallery`, `GFieldGroup`, `GCard` (a su `GSurface` y a su `GMenu`), la prop de slot `density` del slot `action` de `GInput` (vale `undefined` sin prop) y los blocks (`GResourceList`, y cualquier `Gb*` que pase un valor resuelto). Bruno busca en el repo cualquier `density ?? 'default'` o `|| 'default'` que alimente a un hijo y lo corrige.

### 3.5 Qué cambia para quien ya usa la prop

Cambio visible aceptado por el usuario (paquete sin publicar): un contenedor con `density` distinta de `default` aprieta ahora su contenido. Casos conocidos que coco revisa en su auditoría: `GbProductCard03` y `GbConfirmation03` (`GCard density="compact"`: su `GBtn` de acción pasa a compacto), `GResourceList` con `density` (barra y menús de la tabla), `GStack`/`GSplit` con `density` (`stack.md`, `split.md`: ya no «solo a su separación»), y `GForm` con `density` (los botones de `GFormActions` y todo lo de dentro lo siguen; era la incoherencia del inventario §2.3). **Lista completa de blocks que cambian** (#984, construcción de bruno; todos por `GCard density="compact"`, que ahora aprieta lo que lleva dentro): `GbProductCard03`, `GbConfirmation03`, `GbCart`, `GbOfferList03`, `GbOrderHistory03`, `GbTrust01`, `GbCategoryPreviews02` y `GbCategoryPreviews03` (más `GResourceList` con `density`). Coco audita su coherencia visual (criterio 18 se amplía a la lista); si alguno resulta una regresión, la salida es `density="default"` en el hijo afectado o quitar la prop del `GCard`, decisión de producto del block, no de este contrato.

## 4. Formularios (D9, D7)

- **`GForm`, `GFormLayout`, `GFormRow`, `GFieldGroup`, `GInputGroup`, `GFormActions` y `GAdaptiveLayout`** con prop explícita escriben `data-g-density` y su clase (§3.1); sin prop, nada. `GForm` deja de imponer `'default'` (`default: undefined`) y deja de emitir `g-form--density-default` sin prop: un `GForm` dentro de una región la sigue.
- **Los campos sacan su clase solo de su prop.** Lo que hoy reciben del contexto (`formKey`, `layoutKey`) les llega por CSS, porque el contenedor con prop es una región. Así una región que la aplicación ponga entre el formulario y el campo manda («la más cercana»).
- **`GFormSection`, `GFormReveal` y `GFormFold`** (sin prop `density`) leen `var(--g-density)` heredado. `GFormSection.css` deja de leer `.g-form--density-* .g-form-section`. **`GFormReveal` y `GFormFold` dejan de emitir** `g-form-reveal--density-{d}` y `g-form-fold--density-{d}` (reflejaban el valor del contexto y mentirían bajo una región) y dejan de reproveer un valor resuelto con `'default'`.
- **El contexto conserva `density` solo para la lógica.** `useFormField()` es público y **no cambia de forma ni de valor**: su `density` sigue resolviendo prop › sub‑contexto › `GForm` › `'default'` y **no ve la región**. Se documenta así: «para medir o pintar, `var(--g-density)` o `readDensity(el)`». **No se añade `densityExplicit`** (L3): un campo propio que compone un `GInput` le pasa **su propia prop** (`props.density`), que ya tiene, no `ff.density`.
- **`GFormRow` y los mínimos publicados** (#312, #410) se miden por posiciones y siguen la densidad real; un cambio de región en marcha vuelve a medir por `densityEpoch` (§7) además del `ResizeObserver`. Sin regla nueva.
- **`GDialog` sigue cortando `formKey`/`layoutKey`** (#566); como la densidad ya no viaja por ahí, el corte no la toca (§5.2).

## 5. Superficies, top layer y táctil

### 5.1 Qué hereda cada superficie

| Superficie | Hereda de | Regla |
| --- | --- | --- |
| `popover` en su sitio: `GMenu` (y submenús), `GSelect`, `GDatePicker`, `GHelper`, `GTooltip`, `GBreadcrumbs`, `GPartyField`, `GBookingBar`, `GFab` | La región de su disparador | El top layer no corta la herencia (regla 3 de la zona de marca, `api.md`). La fila del menú se alinea con el control que lo abrió |
| `GCombobox` (popover y superficie del teléfono) | La región de su `GInput` | Su `<Teleport>` va a la raíz de `GInput` |
| **`GDialog`** (y `GWidgetConfig`, `GWidgetGallery`, `GDialogStep`) | **La región donde está escrito** (decisión del usuario, #977) | Para salir: `density` en el diálogo o un envoltorio propio. La hoja del teléfono, igual que su panel |
| `GPageHeader` (muelle) | Su cabecera | El nodo del muelle vive dentro de la cabecera |
| **`GToaster`, `GStatusIsland`, `GSpeechHost`** (y el diálogo de revisión `g-speech-review`, que va a `body`) | **Nada: Δ0** | Su raíz lleva **`data-g-density="default"` fijo** (sin clase). Viven en `body` y se mudan al modal superior: si heredaran, un aviso cambiaría de tamaño al abrirse un diálogo compacto. Seguir la densidad de la página queda reservado (R3) |

**Regla para componentes nuevos:** lo que se abre en su sitio hereda; lo que un `<Teleport>` saca a `body` o a otro nodo lo declara en su contrato (tomará la página) o fija `data-g-density`.

### 5.2 P2 · «Cede al dedo» (decisión del usuario, #978)

Con `pointer: coarse` (la misma consulta del 44 px), **las regiones, `<html data-g-density>` y la clave del CLI vuelven a `1`**; **la prop explícita de una instancia no cede**.

- **Cómo se distingue sin JS:** la raíz con prop es la única que lleva a la vez `data-g-density="X"` **y** una clase que contiene `--density-X` (§3.1). La regla de §2.1 reafirma el valor solo en ese caso (especificidad 0,2,0 frente a 0,1,0, misma capa). Una región de la aplicación no lleva esa clase y cede. El CLI emite su propio restablecimiento táctil (§6), porque su regla va sin capa y ganaría a la de `grana.defaults`.
- **Lo de dentro de una raíz con prop** sigue heredando su valor (es su región, B); una región de la aplicación escrita **dentro** cede a 1 como cualquier otra.
- **44 px y 16 px ganan siempre** (D3): ya van después del multiplicador (`max(44px, …)`, `max(16px, …)`). P2 no los toca.
- **Falso positivo aceptado:** un elemento de la aplicación con `data-g-density="compact"` y una clase propia que contenga `--density-compact` no cede. Es un nombre que la aplicación no tiene por qué usar; se documenta.

### 5.3 Límite L6 (sin P2, con prop explícita)

Con puntero grueso, un `GBtn density="compact"` **se ve** de 27 px (su 44 px es el área `::after`, invisible) junto a un campo de 44 px en la misma barra. Con P2 ya no pasa en las regiones; con la prop explícita sigue pasando y es deliberado (la instancia lo pidió). Queda escrito en `btn.md` como límite.

## 6. Clave `density` del CLI (`@grana/cli`, contrato para bruno)

| Aspecto | Contrato |
| --- | --- |
| Clave | `density` en `grana.config.json`, opcional; se añade a `KEYS` (`config.js`) y a `tokens.md` §1 |
| Valores | `"default"` · `"comfortable"` · `"compact"` (cadena). Sin valor = `default` |
| Validación | Otro valor o tipo (incluidos los números `0.75`, `1`): error **`bad-density`**: «`density` debe ser "default", "comfortable" o "compact"; se recibió …». `--g-density` dentro de `overrides` o de `dark.overrides`: error **`density-override`**: «`--g-density` no se sobrescribe: usa la clave `density` (density.md §6)». `grana check` informa igual que `theme` |
| Salida con `default` o sin clave | **Nada** (Δ0 de bytes en `tokens.css`) |
| Salida con `comfortable`/`compact` | Después del bloque `:root` de tokens que no son de color, y fuera de los bloques de color y de oscuro: |

```css
:root:where(:not([data-g-density])) { --g-density: 0.75; }
@media (pointer: coarse) {
  :root:where(:not([data-g-density])) { --g-density: 1; }
}
```

- **Especificidad (0,1,0)**, como el resto de selectores de `:root` del CLI (#561): un segundo tema cargado después gana por orden.
- **`<html data-g-density>` gana al CLI** porque el selector deja de coincidir con el atributo presente; entonces rigen las reglas de §2.1 (en capa), sin choque con el tema sin capa (el problema de #637 no se da).
- **`tokens.json` (`--doc`):** `--g-density` figura con el valor emitido, sin valor oscuro (no depende del esquema) y con su uso; si `usage.js` exige uso por token, bruno añade la entrada.
- **Pruebas** (`packages/cli/test/`): los tres valores, cada error con su `id`, Δ0 de bytes sin clave y con `default`, el orden de los bloques y que `sync-defaults` deja fuera las reglas de atributo.

## 7. Lectura en JS: `utils/density.js` (bruno)

| Nombre | Firma | Contrato |
| --- | --- | --- |
| **`readDensity(el)`** | `(Element) → 'compact' \| 'comfortable' \| 'default'` | Lee el `--g-density` calculado del elemento y devuelve el paso más cercano (≤ 0,8125 → `compact`; ≤ 0,9375 → `comfortable`; si no, `default`; vacío o no numérico → `default`). Ve la cascada real: región, `<html>`, CLI y P2. Sin `el` o sin `getComputedStyle` (servidor): `'default'` |
| **`densityEpoch`** | `ShallowRef<number>` | Contador que sube **una vez por cuadro** cuando cambia cualquier `data-g-density` del documento. Un **único** `MutationObserver` perezoso sobre `document.documentElement` (`subtree: true`, `attributes: true`, `attributeFilter: ['data-g-density']`), creado por el primer suscriptor **en `onMounted`** y desconectado al desmontar el último (sin efectos en el nivel superior del módulo, #444) |
| **`useDensityEpoch()`** (o el nombre que bruno elija; interno) | composable | Registra la suscripción en `onMounted`/`onUnmounted` y devuelve `densityEpoch` |

- **Interno, no público:** no se exporta desde `src/index.js` (sin API nueva). Si una aplicación lo pide, se abre como API con su decisión.
- **Quién lo usa** (los `watch` que hoy miran `density` para volver a medir): `GTextarea`, `GRadioGroup`, `GSlider`, `GTabs`, `GAdaptiveLayout` (`useAdaptiveLayout.js`), `GFormRow`, la publicación de mínimos de `GNumberField` y `GTimeField`, y la lectura de separación de `GFormReveal` y `GFormFold` (`--_reveal-gap`, `--_fold-gap`). Cada uno añade `densityEpoch` como **fuente separada** del `watch` (lección de bd888df: nunca un getter que devuelva un arreglo nuevo). `GCalendar` no (pieza 4).
- **`GCard`** (oculta la meta de prioridad `low` en `compact`) usa `readDensity(root)` al montar y en cada `densityEpoch`. **Límite SSR aceptado:** sin prop y en una región compacta, la meta baja se pinta en el servidor y se quita al hidratar, una sola vez y sin animación (R4: por CSS con consultas de estilo, cuando las tres familias las tengan).
- **Rendimiento:** en un mismo cuadro, primero todas las lecturas (`getComputedStyle`) y después las escrituras (lección de #964). Ninguna lectura en el render del padre.
- **Límite:** el observador ve el atributo, no un cambio del token a mano (§2).

## 8. Qué lee cada hoja (para coco)

- **Alias de raíz:** el `1` literal del alias local (`--_density`, `--_d`, `--_df`, `--_adaptive-density`) pasa a `var(--g-density)`. Las reglas de clase `--density-*` que solo reasignan ese multiplicador **se quitan** (las hace el atributo); con ellas desaparece la mayor parte del CSS de densidad.
- **Valores por paso que no son un multiplicador** (`GTabs`: `--_mark-t` elige `--g-tabs-mark-default|comfortable|compact`, `tokens.md` §18): se interpolan **exactamente** desde `--g-density` sin token nuevo, con los pesos de Lagrange en los tres pasos:
  `--_mark-t: calc((var(--g-density) - 0.875) * (var(--g-density) - 0.75) * 32 * var(--g-tabs-mark-default) - (var(--g-density) - 1) * (var(--g-density) - 0.75) * 64 * var(--g-tabs-mark-comfortable) + (var(--g-density) - 1) * (var(--g-density) - 0.875) * 32 * var(--g-tabs-mark-compact))`.
  Da el token exacto en 1, 0,875 y 0,75 (los tres son binarios exactos). Coco puede escribir una forma equivalente; el criterio 14 mide el resultado.
- **Superficies de página:** `GStatusIsland.css` y `GSpeechPill.css` leen `--_density` por dentro; con la raíz fijada a `default` (§5.1) quedan en Δ0.
- **Pieza 3 (texto)**: contratada en §16. Reasigna los tokens de texto **en el elemento de la región** (`[data-g-density="compact"] { --g-text-…: … }`, como la zona de marca redeclara el color), nunca con selectores descendientes del tipo `[data-g-density="compact"] .g-btn`, que no respetan «la más cercana». Ninguna hoja de componente cambia.
- **Literales:** ninguno nuevo; `0.75`/`0.875`/`1` viven solo en `defaults.css` (y los pesos numéricos de la interpolación, que no son medidas).

## 9. Movimiento (rúbrica `docs/documentacion/rubrica-movimiento.md`)

**El cambio de densidad no se anima** (decisión derivada: reflujo de toda la página, mareo, tareas largas; #964). No hay movimiento nuevo.

| Dimensión | Estado | Evidencia / riesgo / recomendación |
| --- | --- | --- |
| Propósito | No aplica | Sin movimiento; el cambio es instantáneo, en el mismo cuadro (kiwi 4.1, 4.2) |
| Comodidad visual | Cumple por diseño | Sin transiciones de alto, relleno ni separación al cambiar el token. Riesgo: una hoja con `transition` sobre `block-size`, `padding*`, `gap`, `min-block-size` o `inline-size` se dispararía; criterio 10 |
| Estabilidad | Riesgo medido aparte | El contenido se reordena al cambiar la densidad de una región grande; el foco no se pierde (criterio 10). Mantener en su sitio la fila enfocada queda reservado (R1, `setDensity`) |
| Interrumpible / control | No aplica | No hay animación que interrumpir; el control es el ajuste de la aplicación (P1) |
| Accesibilidad | Cumple por diseño | `prefers-reduced-motion` no cambia nada (no hay movimiento); 44/16 px intactos; P2 evita dianas de 44 con huecos compactos (WCAG 2.5.8) |
| Rendimiento | Criterio 10 y peso §11 | Un observador por documento, lecturas agrupadas, sin medida por render |

## 10. Criterios de aceptación (spec de bruno `tests/density.spec.mjs`; auditoría de coco)

Tema por defecto (`space` 4: `md` = 9 unidades = 36 px → 31,5 en `comfortable` y 27 en `compact`); tres motores salvo donde se dice.

1. **Δ0 por defecto.** Página sin regiones, sin prop y sin clave del CLI: alto, relleno y separación de los 37 componentes con `density` iguales al `dist/` anterior (Δ0 px). En el marcado, ninguna raíz sin prop lleva `--density-*` ni `data-g-density` (cambio de marcado esperado; las pruebas que esperaban `--density-default` se actualizan), salvo las tres superficies de página (`data-g-density="default"`) y `GCalendar` (su clase de siempre).
2. **Región.** Dentro de `<section data-g-density="compact">`: `GBtn`, `GInput`, `GSelect`, `GDatePicker`, `GTextarea rows=1` y `GInputGroup` `md` miden 27; en `comfortable`, 31,5; la fila de `GTable`, el item de `GSidebar`, el item de `GMenu`, la casilla, el interruptor, el deslizador y los demás de G1/G2 miden lo mismo que con la prop explícita del mismo paso (Δ0 frente a la prop).
3. **Anidación.** `compact` dentro de `comfortable` → 27; `default` dentro de `compact` → 36; tres niveles alternos, cada uno con el valor de su región más cercana.
4. **La prop gana.** `GBtn density="default"` dentro de `compact` → 36; `density="compact"` dentro de `comfortable` → 27. La raíz con prop lleva clase y atributo con el mismo valor; un `data-g-density` de la aplicación en la misma instancia (componente que hereda atributos en la raíz) pierde ante la prop.
5. **B · la prop es región.** `GTable density="compact"`: botones de su `toolbar` y el `GMenu` que abren → 27. `GCard density="compact"`: su acción `GBtn` → 27. `GDialog density="compact"`: un `GInput` de su contenido → 27. `GStack density="compact"`: un `GBtn` hijo → 27 y la separación × 0,75.
6. **Top layer.** `GMenu` abierto (`:popover-open`) desde un disparador en una región compacta: alto del item = alto del disparador (27). Lo mismo para las opciones de `GSelect` y el campo/panel de `GCombobox`.
7. **Diálogo heredado.** `GDialog` sin prop escrito en una región compacta, abierto como modal: relleno de carcasa × 0,75 y su `GInput` 27; con `density="default"` → 36.
8. **Superficies de página Δ0.** Con `<html data-g-density="compact">`, con la clave del CLI `compact` y con el `GToaster`/`GStatusIsland` trasladado a un `GDialog density="compact"`: sus `GBtn` miden lo mismo que en el `dist/` anterior.
9. **Formularios.** `GForm` sin prop dentro de una región compacta → campos 27. `GForm density="compact"` → campos y botones de `GFormActions` 27. Región `default` entre un `GForm compact` y un campo → el campo 36. Separaciones de `GFormSection`, `GFormReveal` y `GFormFold` siguen a la región. `useFormField().density` devuelve lo mismo que hoy en todos los casos (prueba unitaria).
10. **Cambio en marcha.** Cambiar el atributo de `<html>` (`default` → `compact` → `comfortable`) y el de una región: los altos cambian en el siguiente cuadro; `document.getAnimations()` no contiene ninguna `CSSTransition` sobre `block-size`, `min-block-size`, `inline-size`, `padding*`, `gap*` o `margin*`; el foco sigue en el mismo elemento; `GTextarea autosize`, el ajuste de `GRadioGroup`, `GSlider`, la marca de `GTabs`, las líneas y mínimos de `GFormRow`, los mínimos de `GNumberField`/`GTimeField` y la separación de `GFormReveal`/`GFormFold` se vuelven a medir en ≤ 2 cuadros. **Un solo** `MutationObserver` de densidad en el documento con 1 o con 200 componentes, ninguno antes del primer montaje y ninguno tras desmontar el último (instrumentado). Sin tareas largas (> 50 ms) al cambiar `<html>` con una tabla de 500 filas (entorno sin vecinos, #965).
11. **CLI frente a `<html>`.** Con `tokens.css` de `density: "compact"`: página → 27; `<html data-g-density="comfortable">` → 31,5; `<html data-g-density="default">` → 36; una región `comfortable` dentro sigue mandando. Un segundo tema cargado después (`density: "comfortable"`) gana por orden.
12. **Táctil** (Chromium y WebKit con `hasTouch` e `isMobile`; precondición `matchMedia('(pointer: coarse)').matches`; Firefox se omite, precedente `btn-limitaciones.spec.mjs`). Región `compact`, `<html compact>` y CLI `compact`: `--g-density` calculado = 1 en los elementos, separaciones iguales a `default` y el `GBtn` **visible** 36 (no 27). `GBtn density="compact"` explícito: `--g-density` 0,75, caja visible 27, área táctil 44; `GInput density="compact"`: caja 44 y texto editable 16. Lo de dentro de una raíz con prop hereda 0,75; una región de la aplicación dentro de ella, 1.
13. **Sin JS.** Marcado estático (SSR con `@vue/server-renderer`, o el HTML servido con JavaScript desactivado): región compacta → `GBtn` 27; la raíz con prop ya trae clase y atributo; ninguna diferencia de marcado al hidratar (sin avisos de hidratación).
14. **`GTabs`.** Grosor calculado de la marca = `--g-tabs-mark-{paso}` en los tres pasos, por región y por prop (Δ ≤ 0,01 px), también con un tema que cambie los tres tokens.
15. **`GCard`.** Meta `low` oculta en región `compact` tras montar, visible en `default`/`comfortable` y visible en región `compact` con puntero grueso (P2); con prop `compact`, oculta también en táctil.
16. **Rejilla y mínimos.** Con `--g-space-1` 4,375 y 3,75 px, alto × 2 entero (±0,01) en cada paso por región (#682); 24, 44 y 16 px intactos (los criterios de #972 siguen en verde).
17. **Grep.** Ninguna hoja de `components/` declara `--g-density`; ninguna lee `.g-form--density-*` desde un descendiente; no queda ninguna regla `--density-*` que solo reasigne el multiplicador (salvo `GCalendar`); `16px`, `24px` y `44px` como hoy.
18. **Blocks.** `GbProductCard03`, `GbConfirmation03` y `GResourceList` con `density` se ven coherentes (auditoría de coco, cambio esperado de §3.5); `dist/blocks.js` dentro de su tope.

**No verificable aquí:** SSR real de una aplicación con su servidor (se aproxima con `@vue/server-renderer` y JS desactivado), una tableta con teclado y panel táctil cambiando de puntero en caliente (P2 se evalúa al cambiar la consulta; los mínimos publicados se miden al montar y en cada época), lector de pantalla (sin cambio semántico esperado).

## 11. Peso (lote propio fuera de #506; con más, vuelve a lima y decide el usuario)

| Salida | Tope (gzip -9, copia aislada antes y después; bruno lo registra en `CHANGELOG.md`) |
| --- | --- |
| `dist/grana.js` | **≤ +768 B** para todo el lote: `utils/density.js`, props a `undefined`, atributo y clase solo con prop, `?? undefined` en los compuestos, épocas en los `watch`, formularios y superficies fijadas. Kiwi estimó ≤ 512 B solo para la utilidad, sin medir; quitar el `'default'` y el cálculo desde el contexto puede ahorrar |
| Entradas propias (`combobox`, `time-field`, `slider`, `file-field`, `speech`, `status`, `fab`, `page-header`, `app-shell`, `card-group`, `form-fold`, `tag`, `load-region`) | **≤ +256 B** cada una (la utilidad llega por `__shared`, sin copia) |
| `dist/blocks.js` (`@grana/blocks`) | **≤ +128 B** |
| `dist/grana.css` | **≤ +256 B**; lo esperado es que **baje** (se quitan ~37 × 3 reglas de clase y se añaden siete reglas en `defaults.css` y la interpolación de `GTabs`). Si crece, coco lo explica en su informe |
| `tokens.css` del CLI | Sin la clave o con `default`: **Δ0 bytes**; con la clave: las dos reglas de §6 |

**Medido por bruno (`CHANGELOG.md`, #985):** `grana.js` **+586 B** (tope +768), `grana.css` **−739 B**, entradas propias **≤ +57 B** (tope +256; `slider` +57, `time-field` +32, `speech` +19…), `dist/blocks.js` **Δ0** (tope +128) y `tokens.css` **Δ0 sin clave**. Dentro de tope en todas las salidas.

## 12. Reparto y orden

| Paso | Quién | Qué | Archivos |
| --- | --- | --- | --- |
| 1 (en paralelo) | **coco** | Token y atributo: §2.1 en `defaults.css`; alias de raíz a `var(--g-density)` **conservando** por ahora las reglas de clase (Δ0 mientras bruno no cambia el marcado); `GFormSection`, `GFormReveal`, `GFormFold` leen el token; interpolación de `GTabs`; verificadores de coco | `styles/defaults.css` y las 40 hojas que hoy leen densidad (todas salvo `GCalendar.css`): `GAdaptiveLayout`, `GBtn`, `GCard`, `GCheckbox`, `GCombobox`, `GDatePicker`, `GDialog`, `GFieldGroup`, `GFileField`, `GForm`, `GFormActions`, `GFormFold`, `GFormLayout`, `GFormReveal`, `GFormRow`, `GFormSection`, `GInput`, `GInputGroup`, `GMenu`, `GNumberField`, `GPartyField`, `GRadioGroup`, `GSelect`, `GSidebar`, `GSlider`, `GSpeechPill`, `GSplit`, `GStack`, `GStatusIsland`, `GStepper`, `GSurface`, `GSwitch`, `GTable`, `GTabs`, `GTextarea`, `GTimeField`, `GWidget`, `GWidgetConfig`, `GWidgetGallery`, `GWidgetGrid` |
| 1 (en paralelo) | **bruno** | Props a `undefined` y `meta.json` (§3.2); clase y atributo solo con prop (§3.1); `?? undefined` (§3.4); formularios (§4); superficies fijadas (§5.1); `utils/density.js` y sus usuarios (§7); clave del CLI (§6); pruebas unitarias y `tests/density.spec.mjs` | Los `.vue` y `meta.json` de G1 (18), G2 (`GInput`, `GTextarea`, `GSelect`, `GDatePicker`, `GCheckboxGroup`, `GRadioGroup`, `GSwitch`, `GSlider`, `GNumberField`, `GTimeField`, `GCombobox`, `GFileField`, `GPartyField`, `GFormLayout`, `GFormRow`, `GFieldGroup`, `GInputGroup`, `GFormActions`, `GAdaptiveLayout`, `GCheckbox`), G3 (`GFormSection`, `GFormReveal`, `GFormFold`), `GToaster`, `GStatusIsland`, `GSpeechHost`, `GCard`, `formContext.js`, `utils/density.js` (+ prueba), `packages/cli/src/config.js` y `theme.js` (+ pruebas), `packages/blocks` (`GResourceList` y los `Gb*` que pasen valores resueltos), playground |
| 2 | **coco** | Quitar las reglas de clase `--density-*` que solo reasignan el multiplicador (necesita el atributo de bruno: si se quitan antes, la prop explícita deja de apretar) | Las mismas hojas |
| 3 | **coco** | Auditoría posterior (`auditoria-visual.md` y rúbrica de movimiento) con los criterios de §10; banco `design/lab/density/` | `design/lab/density/auditoria.md` |
| 4 | **mora-docs** | README: la fila `density` de cada componente («sin valor: la región»), la regla de §3.3 y una sección común | READMEs |

**Fuera de esta pieza:** el texto que baja con `compact` (pieza 3, contratada en §16), la densidad de `GPagination`, `GTag`/`GTagGroup`, `GBadge`, `GAccordion`, `GFilterBar`, `GBreadcrumbs` y la alineación de `GCalendar` (pieza 4, #967): **hasta entonces no siguen la región** (en una barra compacta quedan en el paso 1; límite visible aceptado por el orden de #969).

## 13. Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Pruebas y snapshots que esperan `--density-default` siempre | Se actualizan en el mismo commit de bruno; el criterio 1 fija el marcado nuevo |
| Contenedores con prop que aprietan lo de dentro (§3.5) | Auditoría de coco en los casos listados; salida con prop en el hijo |
| `data-g-density` en un campo cae en el `<input>` | Regla §3.3 y README |
| Falso positivo del selector de P2 | §5.2; nombre que la aplicación no usa |
| Coste del observador | Uno por documento, filtrado por atributo, agrupado por cuadro, lecturas antes que escrituras |
| Valores resueltos que se cuelan en un compuesto | Búsqueda de bruno (§3.4) y criterio 2 (Δ0 frente a la prop) |
| Orden coco/bruno | Paso 2 solo tras el atributo de bruno |
| `GCalendar` y G5 no siguen la región | Límite escrito en sus README hasta la pieza 4 |

## 14. Reservado

- **R1 · `setDensity(el, value)`** que mantenga en su sitio la fila o el campo enfocado al cambiar (WebKit sin `overflow-anchor`). Solo si se pide.
- **R2 · `GDensity`** (componente de región): no hace falta; el atributo lo da.
- **R3 · Densidad de avisos, isla y voz:** si llega, leen la de la página (`<html>` o el CLI), nunca la de su sitio; hoy fijas en `default`.
- **R4 · Meta de `GCard` por CSS** con consultas de estilo sobre `--g-density`.
- **Exportar `readDensity`/`densityEpoch`** como API pública: solo con un caso real.

## 15. Auditoría visual previa (`docs/documentacion/auditoria-visual.md`)

Pieza de mecanismo, sin forma nueva. Estructura y jerarquía: no cambian (la densidad aprieta, no reordena). Contraste y delimitación: sin cambio de color; las regiones las delimita la aplicación. Espaciado: deriva de los tres pasos de #15 y de la herencia; P2 impide huecos compactos entre dianas de 44 px. Controles, tablas y formularios: alturas comunes por paso (criterio 2, Δ0 frente a la prop). Estados de interfaz: sin cambio. Consistencia: reutiliza el patrón de la zona de marca (`data-g-zone`) y la forma de #561; ningún componente ni clave de contexto nuevos; un solo token global. **Sin decoración y sin movimiento.**

---

## 16. Pieza 3 · el texto sigue la densidad (#986 a #995)

**Basado en:** `design/lab/density-text/r01/` (kiwi, 4e7502c: `declaracion.md` §1 a §10, H1 a H6; `escala.mjs`, `proto/escala.json`, prototipo con `dist/` real y `verificar.mjs` 74/74 en Chromium). **Decisiones del usuario (2026-10-29):** P1 · escala **B «Hermano menor»**; P2 · **sí**, el texto de lectura de una región compacta también baja. **Enmienda** la frase «sin cambiar la tipografía» de #15 (`tokens.md` §4, `api.md` fila `density`), como anunció #966.

**Regla en una línea.** En `compact`, el tema reasigna **en el elemento de la región** los tokens públicos `--g-text-{rol}-size|line` a la misma escala calculada con `fontSize × 15/16`; los componentes no cambian, y todo lo que lee un rol dentro de la región baja con ella.

### 16.1 La escala (B, #986)

Fórmula y tabla en `tokens.md` §5.1. Resumen: **tamaño compacto = `min(paso1, max(12px, paso1 × 15/16))`** e **interlineado = `min(línea paso1, max(4px, round(tamaño × razón del rol / 4) × 4))`** con las razones de §5; tracking y peso sin cambio. Con el tema por defecto cambian 9 tokens: `caption` 12/16 · `body-sm` 13,13/20 · `body` 15/24 · `title-sm` 18,75/28 · `title` 23,44/32 · `title-lg` 29,3/36 · `display` 36,62/44.

- **Honestidad sobre #966.** #966 decía «un escalón». B es una lectura **más suave**: baja un 6,25 % en todos los roles, no el rol de abajo. La eligió el usuario con la comparativa A/B a la vista (`index.html` §2). **A · Peldaño** (cada rol toma el de abajo, con `body-sm` en el punto medio para no chocar con `caption`) queda **descartada**: los títulos caían del 20 al 25 % según la `typeScale` del tema, la bajada dependía del tema y necesitaba un parche en el piso. **A0** (peldaño puro) ponía cinco roles de etiqueta y título a 12. **× 0,875** dejaba `body-sm` a 0,25 px de `caption` y bajaba los títulos un 12,5 %.
- **Piso:** 12px (§7) por construcción, también en temas de `fontSize` bajo (14/1,2: `body-sm` 12,25 → 12 = `caption`; el choque lo trae el tema, no la escala).
- **Nunca sube:** el `min(paso1, …)` evita que un rol ya por debajo de 12 en el paso 1 (fuera de contrato, el CLI lo rechaza con `font-size`) suba en compacto.

### 16.2 Pasos y títulos (#988, #989)

- **`comfortable` no cambia el texto.** En Grana es el paso intermedio (caja × 0,875, entre `default` y `compact`); subir el texto invertiría la escalera y medio escalón de B serían 0,4 px. Comparte la regla de vuelta con `default`.
- **Los títulos bajan con la escala** y conservan peso (600) y tracking. `tokens.md` §23.4 pasa a relativa: **«nunca un título por debajo del `body-sm` de su paso»** (14 en `default`/`comfortable`, 13,13 en `compact` con el tema por defecto). Cadena del diálogo en compacto: 18,75/28 › 15/24 › 13,13/20 (500) › 12/16, cuatro niveles distintos.
- **Interlineado:** la regla de §5, sin regla nueva. Con el tema por defecto, `caption`, `body-sm`, `body` y `title-sm` conservan su renglón en los tres pasos; `title`, `title-lg` y `display` bajan 4 px.

### 16.3 Alcance (P2, #987)

**Sigue la región todo texto que lee un rol dentro de ella**, porque el token se reasigna en la región y no en el componente: controles, filas, etiquetas, ayudas, mensajes, celdas, opciones, títulos de contenedor (`GDialog`, `GSection`, `GCard`, `GFormSection`, `GWidget`, `<caption>` de `GTable`), el valor de `GMetric`, `GText` y **la prosa propia de la aplicación que lea `--g-text-*`** (decisión del usuario: una región es una región; sin tokens fuente ni excepción para la lectura). Lo que se abre en su sitio (menús, `GDialog` escrito en la región) hereda como en §5.1.

- **Iconos medidos desde el texto** (`GBtn`: `--_icon = --_fs × 1,15`) bajan con él (`md` 16,1 → 15,1), sin regla nueva.
- **No lo siguen:** `GToaster`, `GStatusIsland`, `GSpeechHost` y `g-speech-review` (su raíz fija `data-g-density="default"`: la regla de vuelta les da el paso 1, Δ0); el texto de la aplicación que no lee tokens; `--g-hero-title-max` (límite H4, §16.7).
- **Pieza 1 intacta:** con puntero grueso el texto editable sigue en `max(16px, rol)` (#970), también con prop `compact` explícita.

### 16.4 Mecanismo M1 (#990): reglas de región en el tema

Forma de contrato (`K` = las claves que se escriben, §16.5; `C` = sus valores compactos; `D` = sus valores del paso 1):

```css
[data-g-density="compact"] { C }
[data-g-density="default"], [data-g-density="comfortable"] { D }   /* vuelta dentro de una región compacta */
@media (pointer: coarse) {                                         /* P2 (#978) */
  [data-g-density] { D }
  [data-g-density="compact"][class*="--density-compact"] { C }   /* la prop explícita no cede */
}
```

- **`defaults.css` (coco, capa `grana.defaults`):** estas cuatro reglas con los valores del tema por defecto y `K` = los 9 tokens que cambian (§16.1). **Después** del bloque `:root` de tokens (mismo peso 0,1,0 sobre `<html data-g-density>`: manda el orden) y junto a las reglas de `--g-density` de §2.1; texto exacto a criterio de coco. `sync-defaults.mjs` no las copia a `DEFAULTS` (solo el bloque `:root`, como §2.1).
- **`tokens.css` del CLI (bruno, sin capa):** las mismas reglas con los valores de su tema (§16.5). Sin ellas, el `:root` sin capa del tema ganaría a la regla en capa sobre `<html data-g-density="compact">` y una región compacta tomaría los valores **del tema por defecto** (medido por kiwi: 4.t14 y 4.t18 «solo defaults»).
- **Descartados:** **M2** (fuentes `…-default`/`…-compact` y resolutor en `defaults.css`): obliga al CLI a dejar de emitir los nombres públicos y añade 28 tokens de tema. **M3** (`calc()` en CSS): un token no puede derivarse de sí mismo (ciclo) y el redondeo a 4 px copiaría en CSS las razones de §5.
- **Nunca** selectores descendientes (`[data-g-density="compact"] .g-btn`): no respetan «la más cercana».

### 16.5 Contrato del CLI (`@grana/cli`, bruno) (#991)

| Aspecto | Contrato |
| --- | --- |
| **Cuándo «el tema fija texto» (T)** | `fontSize` o `typeScale` en la configuración, **o** algún `--g-text-*-size` / `--g-text-*-line` en `overrides` |
| **Valores** | `D` = el valor final del paso 1 de cada clave (generado y con `overrides` aplicados; si el tema no la toca, el de `DEFAULTS`). `C` = la función de §16.1 aplicada a `D`, en `rem` con el redondeo de `scales.js` (`r4`). Una sola función, compartida con `typography()` (no una segunda tabla) |
| **Claves `K`** (hallazgo H7 de lima) | **Unión** de: (a) las que cambian en el tema (C ≠ D); (b) las que escribe `defaults.css`, calculadas aplicando la misma función a `DEFAULTS` (hoy las 9 de §16.1; no una lista fija); (c) las sobrescritas en `overrides`. Sin (b), un tema donde una clave no cambia dejaría pasar el valor compacto del tema por defecto: con 14/1,2, `--g-text-title-line` quedaría en 32 px (2rem) dentro de una región en vez de los 28 del tema. El prototipo de kiwi solo escribía (a) |
| **Valor no derivable** | Si el valor final de una clave de `K` no es una longitud en `rem` o `px` (p. ej. `clamp(…)`, `var(…)`), se escribe **igual** en `C` y en `D` (no sigue la densidad) y el CLI añade la nota **`text-density`**: «`--g-text-…` no es una longitud en rem o px: se queda igual en los tres pasos de densidad.» |
| **Sin T y sin `density: "compact"`** | **Nada** de texto (Δ0 bytes en `tokens.css`): mandan las reglas de `defaults.css` |
| **Con T** | Las cuatro reglas de §16.4 con `K`, `C` y `D` |
| **Con `density: "compact"`** (con o sin T) | El texto compacto va **en la misma regla de la clave** de §6 (sin selector nuevo): `:root:where(:not([data-g-density])) { --g-density: 0.75; C }` y, en su consulta táctil, `{ --g-density: 1; D }`. Sin T, `K`, `C` y `D` salen de `DEFAULTS` (el `:root` del CLI no toca el texto y la regla en capa no ve un `<html>` sin atributo). Con `comfortable`, la regla de §6 sin texto |
| **Orden** | Bloque `:root` de tokens que no son de color › regla de la clave (§6) › reglas de región de texto › bloques de color, oscuro y zona (sin cambio). Todas (0,1,0) salvo la de la prop explícita (0,2,0); un segundo tema cargado después gana por orden, como #561 |
| **`dark.overrides`** | El texto no depende del esquema: `--g-text-*` en `dark.overrides` queda fuera de contrato y no entra en `K` |
| **`tokens.json` (`--doc`)** | Sin cambio en este lote (documentar los valores compactos queda reservado, R5) |
| **Validación** | El mínimo de 12 px (`font-size`) ya lo cumple la función; la prueba lo comprueba en una malla de `fontSize` 12 a 20 y `typeScale` 1,067 a 1,618 |

**Corrección H1 (en este lote):** con `grana theme … --stdout`, los avisos (`formatIssues`) y las notas (`ℹ …`) salen hoy por la **misma salida** que el CSS (`cli.js`: `(result.ok ? out : err)(…)` y `out(notes)`); al redirigir a un archivo, la primera regla queda inválida y el tema se pierde sin aviso. **Contrato:** en `theme` y en `check` sin `--json`, **avisos y notas van siempre por `stderr`**; por `stdout` solo el CSS (con `--stdout`) o las líneas de resumen `✔` (sin él). `check --json` no cambia. **Los códigos de salida no cambian.** Las pruebas que esperaban los avisos en `out` se actualizan; el README del CLI lo dice (mora-docs).

### 16.6 Criterios de aceptación (spec de bruno `tests/density-text.spec.mjs`, pruebas del CLI en `packages/cli/test/`, auditoría de coco)

Tres motores salvo donde se dice. «Temas generados» = `fontSize` 14 / `typeScale` 1,2 y `fontSize` 18 / 1,333 con el CLI real; los valores esperados los calcula la prueba con la función del CLI, no con una tabla copiada.

1. **Tabla por rol.** `font-size` y `line-height` calculados de un elemento por rol (siete roles) dentro de `default`, `comfortable` y `compact`: tema por defecto = `tokens.md` §5.1 (± 0,01 px); temas generados = función de §16.1 sobre sus valores.
2. **Piso de 12.** Ningún elemento con texto de las secciones del playground mide menos de 12 px en `compact`, en los tres temas.
3. **Cajas Δ0.** Las alturas de la pieza 2 (criterio 2 de §10: `md` 36 / 31,5 / 27, fila de `GTable`, item de `GSidebar` y de `GMenu`) no cambian en ningún paso ni tema; en `GBtn` `xs` a `xl` compacto, el texto queda centrado (≤ 1 px) y sin desbordar (`scrollHeight ≤ clientHeight`) en `GBtn`, `GInput`, `GSelect` y el item de `GMenu`.
4. **Anidación y prop.** `default` dentro de `compact` → `body-sm` 14; `compact` dentro de `comfortable` → 13,13; tres niveles alternos; `GBtn density="default"` en una región compacta → 14 y caja 36; `GBtn density="compact"` en la página → 13,13 y 27.
5. **Heredados.** `GMenu` abierto desde una región compacta: texto del item = texto del disparador (13,13). `GDialog` sin prop escrito en una región compacta: cadena 18,75 › 15 › 13,13 › 12; con `density="default"`, 20 › 16 › 14 › 12.
6. **`<html>` y clave del CLI.** `<html data-g-density="compact">` sin tema → valores de §5.1; con un tema generado con tipografía → **los del tema** (y la prueba negativa del CLI: sin sus reglas de región, `<html>` compacta da los del `:root` del tema). Clave `compact`: página compacta; `<html data-g-density="default">` sobre la clave → paso 1; una región `comfortable` dentro → paso 1. Clave `compact` sin tipografía → valores de §5.1.
7. **Unión de claves (H7).** Tema 14/1,2 en una región compacta: `--g-text-title-line` = 28 px (el del tema), no 32.
8. **Overrides.** `overrides: { "--g-text-body-size": "1.125rem" }`: región `default` dentro de una compacta → 18; región compacta → 16,875. Un valor `clamp(…)` → igual en los tres pasos y nota `text-density` en `stderr`.
9. **P2 táctil** (Chromium y WebKit con `hasTouch`/`isMobile`; precondición `matchMedia('(pointer: coarse)')`). Región `compact`, `<html compact>` y clave `compact` → texto del paso 1. `GBtn density="compact"` → 13,13. `GInput density="compact"` → texto editable 16 y caja 44 (pieza 1).
10. **Superficies fijadas Δ0.** Con `<html data-g-density="compact">`, con la clave `compact` y con `GToaster`/`GStatusIsland` trasladados a un `GDialog density="compact"`: su texto mide lo mismo que en el `dist/` anterior.
11. **Ritmo compartido.** Tema por defecto: el interlineado de `caption`, `body-sm`, `body` y `title-sm` es el mismo en los tres pasos (16/20/24/28); un párrafo `body` de cinco líneas en una región compacta y otro en `default`, lado a lado, tienen el mismo paso de renglón.
12. **Prosa y `GMetric` (P2).** Un `<p>` de la aplicación con `font: var(--g-text-body-size)/var(--g-text-body-line) …` y un `GText` `body` en una región compacta → 15/24; el valor de `GMetric` baja con su rol.
13. **Icono de `GBtn`.** `md` compacto: icono 15,1 px (± 0,1), antes 16,1.
14. **Δ0 sin regiones.** Página sin atributos, sin prop y sin clave: `font-size`, `line-height` y cajas de todos los elementos del playground iguales al `dist/` anterior; `tokens.css` Δ0 bytes sin T y sin `compact`.
15. **Cambio en marcha.** Cambiar el atributo de `<html>` y el de una región: el texto cambia en el siguiente cuadro; `document.getAnimations()` sin `CSSTransition` sobre `font-size`, `line-height` ni `letter-spacing`; los medidores de §7 (y `GSummary`, `GBreadcrumbs`, que miden texto) se reajustan en ≤ 2 cuadros.
16. **`--stdout` (H1).** `grana theme cfg.json --stdout > t.css` con una configuración que da avisos y notas: `t.css` empieza por el comentario del CLI y su primera regla es `:root {`, sin `ℹ` ni `⚠`; los avisos están en `stderr`; el código de salida es el de antes.
17. **CLI, forma.** Δ0 bytes sin T ni `compact`; con T, cuatro reglas en el orden de §16.5; con `compact`, el texto dentro de la regla de la clave (sin selector nuevo); `sync-defaults` deja fuera las reglas de región; ningún valor compacto < 12 en la malla de §16.5.
18. **Grep.** Ninguna hoja de `components/` cambia por esta pieza; ningún selector `[data-g-density…]` con descendiente en `defaults.css`; `16px`, `24px` y `44px` como hoy.

**No verificable aquí:** lectura real con lector de pantalla (sin cambio semántico esperado), Safari real de iPhone para la pieza 1 en región compacta, y la impresión de lectura del 6,25 % en pantallas reales de baja densidad de píxeles.

### 16.7 Límites

- **H3 · G5 y `GCalendar`, a medias hasta la pieza 4.** `GPagination`, `GTag`/`GTagGroup`, `GBadge`, `GAccordion`, `GFilterBar`, `GBreadcrumbs` y `GCalendar` leen los roles y su **texto baja** en una región compacta, pero su **caja no** (p. ej. 13,13 en una caja de 36). Inofensivo y transitorio; se corrige con la pieza 4 (#969).
- **H4 · `--g-hero-title-max`** se resuelve en `:root` con `var(--g-text-display-size)` y **no** sigue la región (el héroe es de página). Aceptado. Regla para tokens futuros: un token derivado de un rol que deba seguir la región no se declara con `var()` en `:root`.
- **H5 · `tokens.css` a mano.** Un `--g-text-*` escrito a mano en `:root` (o con `style.setProperty`) solo vale fuera de los elementos con `data-g-density`; dentro de una región, de una raíz con prop explícita (también `density="default"`) y de las raíces fijadas de avisos, isla y voz, las reglas del tema lo reasignan. Para el texto: claves del CLI (`fontSize`, `typeScale`, `overrides`), que emiten también sus reglas. Lo documenta mora-docs.
- **Ritmo compartido según el tema.** Los renglones iguales en los tres pasos son exactos con el tema por defecto y con 14/1,2 en `caption`…`title-sm`; con 18/1,333 `body-sm` y `body` bajan un renglón (24 → 20, 28 → 24) por el redondeo a 4 px. Es la regla de §5, no un defecto.
- **Falso positivo de P2** como en §5.2.

### 16.8 Movimiento (rúbrica `rubrica-movimiento.md`)

**El cambio de densidad no se anima** (§9): el texto cambia en el mismo cuadro que la caja. Propósito, interrumpible y control: no aplican. Comodidad visual y estabilidad: el texto de varias líneas se reparte en horizontal y, con el tema por defecto, no cambia de paso vertical en los roles de lectura (criterio 11); el reflujo de una región grande es el de la pieza 2. Accesibilidad: sin movimiento, 12/16/24/44 intactos. Rendimiento: solo CSS, sin observador nuevo (criterio 15). Riesgo: una `transition` sobre `font-size` o `line-height` en una hoja; lo vigila el criterio 15.

### 16.9 Peso (lote propio fuera de #506; con más, vuelve a lima y decide el usuario)

| Salida | Tope (gzip -9, copia aislada antes y después; bruno lo registra en `CHANGELOG.md`) |
| --- | --- |
| `dist/grana.css` | **≤ +384 B** (kiwi midió +272 B para las reglas solas) |
| `tokens.css` sin T y sin `compact` | **Δ0 bytes** |
| `tokens.css` con `compact` sin T | **≤ +256 B** (texto dentro de la regla de la clave; medido aparte ≈ 226 B) |
| `tokens.css` con T | **≤ +384 B** (medido 267 a 311 B con la unión de claves) |
| `tokens.css` con T y `compact` | **≤ +448 B** (medido 300 a 348 B) |
| `dist/grana.js`, entradas propias, `dist/blocks.js` | **Δ0** esperado. Solo si el criterio 15 obliga a añadir `densityEpoch` a `GSummary` o `GBreadcrumbs`: ≤ +128 B en total, con su porqué en `CHANGELOG.md` |

### 16.10 Reparto y orden

| Paso | Quién | Qué | Archivos |
| --- | --- | --- | --- |
| 1 (en paralelo) | **coco** | Reglas de §16.4 en `defaults.css` con el tema por defecto; comprobar que ningún banco ni playground escribe `--g-text-*` a mano en `:root` (H5) y, si alguno lo hace, anotarlo a su dueño | `packages/vue/src/styles/defaults.css` |
| 1 (en paralelo) | **bruno** | CLI de §16.5 (función compacta compartida con `typography()`, unión de claves, `overrides`, nota `text-density`, texto en la regla de la clave, orden); H1 en `cli.js`; pruebas del CLI; `sync-defaults` sin las reglas; spec `tests/density-text.spec.mjs` (criterios 1 a 16) con bancos en el playground si hacen falta; pesos en `CHANGELOG.md`. Ningún `.vue` salvo el caso del criterio 15 | `packages/cli/src/theme.js`, `scales.js`, `cli.js`, `index.js` (+ pruebas), `scripts/` si hace falta, `design/lab/theme-playground/tests/density-text.spec.mjs`, playground |
| 2 | **coco** | Auditoría posterior (`auditoria-visual.md` y rúbrica de movimiento) con los criterios de §16.6, en el banco de kiwi o uno propio | `design/lab/density-text/auditoria.md` |
| 3 | **mora-docs** | Guía de densidad del README raíz (el texto baja en `compact`; P2; H5), README del CLI (`--stdout`: avisos por `stderr`), límite H3 en los README de G5 y `GCalendar` | READMEs |

Modelos: bruno en Opus (la unión de claves y los `overrides` son criterio delicado); coco en Sonnet basta (cuatro reglas y una auditoría con criterios cerrados).

### 16.11 Auditoría visual previa (`docs/documentacion/auditoria-visual.md`)

Pieza de mecanismo, sin forma nueva. **Estructura y jerarquía:** no cambian; la cadena del diálogo conserva cuatro niveles y los títulos ganan presencia relativa (la caja baja un 25 %, el texto un 6,25 %). **Contraste:** sin cambio de color; el umbral de 4,5:1 no depende del tamaño por encima de 12. **Espaciado y controles:** cajas de la pieza 2 sin cambio (criterio 3); el renglón cabe en la caja compacta (`md` 27 = 3,5 + 20 + 3,5). **Tablas y formularios:** siguen la región entera, texto incluido; G5 y `GCalendar` a medias hasta la pieza 4 (H3). **Estados de interfaz:** sin cambio. **Consistencia:** solo reasigna tokens existentes, con el patrón de la zona de marca; ningún token, componente ni prop nuevos. **Mínimos:** 12 px por construcción, 16 px editable táctil, 24 y 44 px intactos. **Sin decoración y sin movimiento.**

### 16.12 Reservado

- **R5 · `tokens.json` con los valores compactos** de cada rol (transparencia del motor, §17.13): solo si se pide.
- **R6 · `comfortable` con texto propio:** solo si un día `comfortable` deja de ser el paso intermedio.
