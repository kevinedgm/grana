# Contrato de documentación (mora-docs)

Dueño: **mora-docs**. Fija **cómo se documenta** un componente de Grana: la forma de la página, de dónde sale cada dato y cómo se entrega. No fija API ni tokens (eso es de lima) ni estilo (eso es de coco).

**Forma de referencia:** lienzo «Grana · Plantilla de documentación», ronda r02, **dirección A «Ficha técnica: el código es el control»** (tableros `r02 · Página de componente` y `r02 · Portada`): <https://claude.ai/artifact/3j5XJuZvEXKge8UDmJ62bk>. El lienzo fija la **forma**; los nombres, props, tokens y cifras que aparecen en él son de ejemplo (`GButton`, `--g-grana`, `color="nopal"`…) y **no** son la API de Grana. El contenido real sale siempre de las fuentes de la §2.

## 1. Principios

1. **Solo lo verificado.** Se documenta lo implementado y comprobado; lo reservado o planeado va como «Reservado» con su decisión (#NNN) o no va.
2. **Cada dato tiene un dueño** (§2). La documentación refleja su fuente; nunca la reemplaza. Si dos fuentes se contradicen, se reporta el conflicto (§7) y no se elige.
3. **El código es el control.** La página enseña el componente real y el código que lo produce; cambiar un valor en el código cambia el componente y lo que lee del tema.
4. **Casos reales, no combinaciones.** Un ejemplo existe porque resuelve una situación; nunca una matriz de variantes.
5. **Una sección, un tipo** (Diátaxis): guía (cómo hacer algo), referencia (consultar un dato exacto) o explicación (por qué). No se mezclan dentro de una sección.
6. **Sin preview inventada.** La ficha y los ejemplos montan el componente real de `@grana/vue` con el tema real. **Nunca** se copia el CSS del componente ni se imitan sus estilos para simularlo (crea una segunda implementación que deriva). Si no hay forma de montarlo, se escribe «vista previa no disponible».
7. **Textos sin valor por defecto.** Los ejemplos pasan todos los textos (`label`, `labels`…), como exige Grana.

## 2. Fuentes: quién manda en cada dato

| Dato | Fuente que manda |
| --- | --- |
| Props, eventos, slots, métodos, valores y defaults | `*.meta.json` (contrato de tipos, #443) y el `.vue` |
| Propósito, cuándo usarlo, límites, reservados | `design/contracts/<nombre>.md` y `DECISIONS.md` |
| Tokens que lee | `design/contracts/<nombre>.md`, `docs/contract/tokens.md` y `<Nombre>.css` |
| Teclado, foco y comportamiento | contrato del componente y pruebas (`*.test.js`, specs de Playwright) |
| Cifras de accesibilidad y rendimiento | auditoría de coco (`design/lab/<nombre>/auditoria.md`) y su verificación propia |
| Estado (`candidate`…), versión y entrada del paquete | `CLAUDE.md` «Estado actual», `package.json` (`exports`) y `api.md` |
| Personalidad | decisión de personalidad en `DECISIONS.md` y su plan en `plans/` |
| Orden y forma de la página | este contrato |

Cada cifra lleva su **nivel de evidencia**: `medido` (verificación propia o spec en verde, con su conteo, p. ej. «2647/2647 en los tres motores»), `prueba` (unitaria en verde), `manual` (comprobado a mano, con fecha) o `sin verificar` (se declara como tal en «Limitaciones»). Una afirmación de otro agente sin artefacto no es evidencia.

## 3. Anatomía de la página de componente

Orden fijo. Las secciones que no aplican se omiten; no se dejan vacías.

| # | Bloque | Tipo | Qué lleva | Fuente |
| --- | --- | --- | --- | --- |
| 1 | **Ruta y cabecera** | referencia | Miga `componentes / <nombre>`; antetítulo `COMPONENTE NN · <estado>`; título; la línea de importación exacta (`import { GBtn } from '@grana/vue'` o la entrada propia, p. ej. `@grana/vue/combobox`) | `CLAUDE.md`, `exports` |
| 2 | **Entradilla** | explicación | Una o dos frases: qué hace y qué **no** trae (el color lo pone el tema) | contrato |
| 3 | **En esta página** | — | Enlaces `§ ficha`, `§ ejemplos`, `§ api`, `§ accesibilidad` (y los que existan) que derivan de secciones reales | secciones |
| 4 | **Ficha interactiva** | referencia | El componente real sobre la trama de puntos, con sus **cotas medidas** (alto, relleno); a su lado «**Qué lee del tema**»: fondo, texto, borde, radio, alto y letra, cada uno con el **token real** y su muestra; una línea viva (`aria-live="polite"`) que anuncia los cambios | `meta.json`, CSS, tokens |
| 5 | **Código editable** | referencia | El código del uso actual con **cada valor enumerado como botón** que cicla por los valores del `meta.json` (`aria-label` «prop: valor. Cambiar a siguiente»); los booleanos como casillas `[x]`/`[ ]` con `aria-pressed`; «Restablecer» y «Copiar». **Copiar omite lo que está en su valor por defecto** | `meta.json` |
| 6 | **Ejemplos** | guía | De 2 a 6 casos reales. Cada uno: id (`e1`…), título que nombra la situación, **por qué** en una frase (cuándo sí y cuándo no), el componente real, su código y «Abrir en la ficha ↑», que carga ese caso en la ficha | contrato, decisiones |
| 7 | **API** | referencia | Grupos `PROPS`, `EVENTOS`, `SLOTS` (y `MÉTODOS` / `v-model` si existen). Cada fila: nombre · tipo con default (`'sm' \| 'md' = 'md'`) · descripción de una línea | `meta.json` |
| 8 | **Teclado y foco** | referencia | Tabla tecla → efecto | contrato, pruebas |
| 9 | **Accesibilidad** | referencia | Lista con letras (a., b., c.…) de lo verificado, con su cifra y nivel (§2); al final, un aviso **«Peligro.»** con el error de uso más probable y su consecuencia (p. ej. botón de solo icono sin `aria-label`) | auditoría, contrato |
| 10 | **Personalidad** | explicación | Qué lo hace distinto, cómo se comporta con `prefers-reduced-motion`, y sus límites | `DECISIONS.md`, `plans/` |
| 11 | **Tema** | referencia | Tokens que lee y alias locales que se pueden ajustar | contrato, CSS |
| 12 | **Limitaciones conocidas** | referencia | Límites medidos, motores, lo no verificado y lo reservado con su decisión | auditoría, `DECISIONS.md` |
| 13 | **Páginas vecinas** | — | `← anterior` · `siguiente →` según el índice | índice |

**Marco de la página** (el shell, igual en todas): cabecera con marca, miga, estado de versión, búsqueda (`/`) y botón de tema claro/oscuro; índice lateral con `EMPEZAR` (Instalación, Tema y tokens, Tema oscuro), `COMPONENTES` numerados (`01`, `02`…) con `aria-current="page"` en el actual, y `HERRAMIENTAS` (`@grana/cli`). Un solo marco y una sola navegación global; no se crean marcos paralelos.

**Tono de los textos:** frases cortas en segunda persona («Pruébalo con Tab en la ficha»), cada ejemplo dice su porqué, nada de relleno ni de cifras inventadas.

## 4. Correspondencia con el `README.md`

El sitio de documentación aún no existe. Mientras tanto el `README.md` del componente es la página, en este mismo orden, y será la fuente del sitio:

| Bloque de la página | Sección del README |
| --- | --- |
| 1–2 Cabecera y entradilla | `# <Nombre>`, párrafo inicial, línea `**Etiquetas:** … · **Estado:** … · **Desde:** …` y la importación |
| 4–5 Ficha y código editable | `## Uso` (instalación mínima y el uso básico; en el sitio se vuelve interactivo) |
| 6 Ejemplos | `## Ejemplos`, un `###` por caso con su porqué y su código |
| 7 API | `## Props`, `## Eventos`, `## Slots` (y `## Métodos`) en tablas; `node packages/vue/scripts/check-readme-props.mjs` comprueba que no falte ninguna prop del `meta.json` |
| 8 | `## Teclado y foco` |
| 9 | `## Accesibilidad`, con el aviso `> **Peligro.**` al final |
| 10 | `## Personalidad` |
| 11 | `## Tema` (y `## Clases` si las hay) |
| 12 | `## Limitaciones conocidas` |
| — | `## Fuentes`: contrato, decisiones, auditoría y pruebas citadas |

Los README existentes no se reordenan de golpe: se llevan a esta forma cuando se tocan por otro motivo (modo M3, §5) o cuando el usuario lo pida.

## 5. Modos de trabajo

Antes de escribir, mora-docs declara en una línea `Modo: Mn — porque <motivo>`.

| Modo | Qué hace | Escribe |
| --- | --- | --- |
| **M0 Auditoría documental** | Detecta y prioriza la deriva entre README, `meta.json`, contrato y auditoría (incluye `check-readme-props.mjs` y los pendientes de mora-docs en `PENDIENTES.md`) | No |
| **M1 Estructura** | Índice, orden de secciones, anclas, enlaces y numeración | Sí |
| **M2 Página** | README nuevo de un componente que cerró su flujo | Sí |
| **M3 Sincronización** | Alinea un README existente con su `meta.json`, contrato y auditoría tras un cambio | Sí |

## 6. Reparación: autocorregir, revisar o derivar

| Clase | Cuándo | Ejemplos |
| --- | --- | --- |
| **Autocorregir** | El resultado es inequívoco, la fuente dueña existe y el cambio es reversible | Prop que falta frente al `meta.json`, ancla rota, sección fuera de orden, estado que contradice `CLAUDE.md`, cifra que no coincide con la auditoría |
| **Revisar** (preguntar) | Cambia la arquitectura de la documentación: categorías, rutas públicas, numeración del índice, borrar contenido histórico | Mover un componente de sección, renombrar páginas |
| **Derivar** | Exige código, contrato, CSS o evidencia que no existe | Prop documentada que no está en el `meta.json` → bruno; token sin contrato → lima; cifra sin medir → coco; comportamiento ambiguo → kiwi |

Tras autocorregir se vuelve a ejecutar la comprobación que detectó el defecto.

## 7. Cómo se reporta un problema

**observación → consecuencia para quien lo usa → cambio propuesto → cómo se re-verifica**, y a quién va.

Ejemplo: «`GSlider/README.md` documenta `ticks` pero el `meta.json` no lo declara → quien lo copie recibe un aviso de Vue y no ve marcas → bruno lo añade al `meta.json` o mora-docs lo retira → `check-readme-props.mjs` y `types.test.js` en verde».

## 8. Auto-auditoría antes de entregar

1. ¿Toda prop, evento y slot del `meta.json` está en la API, y nada de la API falta en el `meta.json`? (`check-readme-props.mjs`)
2. ¿Cada cifra de accesibilidad o rendimiento cita su auditoría o prueba y su nivel?
3. ¿Alguna sección mezcla guía, referencia y explicación?
4. ¿Algún ejemplo es una combinación sin caso real, o le falta su porqué?
5. ¿Algo reservado o planeado aparece como disponible?
6. ¿Los ejemplos pasan todos los textos y usan los nombres reales (`GBtn`, `--g-color-*`), no los del lienzo?

Las preguntas 1, 2 y 5 bloquean la entrega con un solo «sí» (o «no» en la 1 y la 2); las demás se corrigen o se declaran.

## 9. Entrega

```text
Modo: M0 | M1 | M2 | M3 — <motivo>
Alcance: <componentes o README>
Corregido: <lista o «nada»>
Por revisar: <lista o «nada»>
Derivado: <defecto → rol>
Verificado: <comprobaciones ejecutadas y su resultado>
No verificado: <lista o «nada»>
```

## Lo que no se adopta (por ahora)

Del plugin `mora-documentation` no se adoptan el manifiesto de trazabilidad (`trace-manifest.yaml`, modo M4) ni sus hooks de gobernanza: Grana ya cubre esa función con el flujo del Fruti Squad, las declaraciones de kiwi y las auditorías de coco, y no tiene registro de piezas ni `.claude/governance/`. Si se quiere, se reabre con decisión del usuario.
