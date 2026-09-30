# GCheckboxGroup

Grupo de casillas con modelo de arreglo, **casilla maestra** ("seleccionar todas") derivada de las hijas y **conteo** anunciado en una región viva. Las hijas son [`GCheckbox`](../GCheckbox/README.md) con `value`.

**Etiqueta:** `<g-checkbox-group>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/checkbox/auditoria.md`](../../../../../design/lab/checkbox/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`). Exige Vue `^3.5.0`.

## Uso

```vue
<g-checkbox-group
  v-model="elegidas"
  label="Reservas"
  select-all
  select-all-label="Seleccionar todas"
  :count-text="(n, total) => `${n} de ${total} seleccionadas`"
>
  <g-checkbox v-for="r in reservas" :key="r.id" :value="r.id" :label="r.nombre" />
</g-checkbox-group>
```

> **En plantillas dentro del HTML** (sin compilar), Vue no admite etiquetas de componente autocerradas: escribe `<g-checkbox ...></g-checkbox>`.

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `modelValue` (`v-model`) | Array | | `[]` |
| `label` | String | | sin valor |
| `hint` | String | | sin valor |
| `error` | String | | sin valor |
| `selectAll` | Boolean | | `false` |
| `selectAllLabel` | String | | sin valor |
| `countText` | Function | `(seleccionadas, total) => string` | sin valor |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` |
| `density` | String | `default` `comfortable` `compact` | `default` |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | `brand` |
| `layout` | String | `default` `card` `chip` | `default` |
| `disabled` | Boolean | | `false` |
| `id` | String | | generado |

- **Elemento:** un `<fieldset>` con `<legend>` para `label`. Es el agrupamiento nativo: rol `group`, nombre accesible y `disabled` heredado por todas las hijas.
- **`label`:** el grupo necesita nombre. Sin `label`, sin slot `label` y sin `aria-label` ni `aria-labelledby`, en desarrollo se emite `console.warn`.
- **Hijas:** cada `GCheckbox` del grupo **necesita `value`** (en desarrollo, si falta, se avisa). Se registran solas al montarse; no hay lista de opciones aparte. El modelo es el arreglo de los `value` marcados; el componente agrega al final.
- **Propagación:** `size`, `density`, `color`, `layout` y `disabled` del grupo pasan a las hijas; una hija puede sobrescribirlos con su propio prop.
- **`selectAll` y `selectAllLabel`:** con `selectAll` aparece una casilla maestra arriba de la lista. **`selectAllLabel` no tiene valor por defecto** (Grana es internacional). Sin ella, la maestra no se muestra y, en desarrollo, se avisa.
- **Estado de la maestra:** se deriva **solo de las hijas habilitadas**: todas marcadas → marcada; ninguna → sin marcar; algunas → **mixta**. Al activarla, marca todas las habilitadas (si estaba sin marcar o mixta) o las desmarca (si estaba marcada). Las hijas deshabilitadas no cambian y no cuentan. Con `aria-controls`, la maestra lista los ids de las hijas habilitadas.
- **`countText`:** función que devuelve el texto del conteo. **Sin valor por defecto**, por internacionalización. Se llama con las seleccionadas y el total de hijas **habilitadas**, también con 0. Sin ella, no hay conteo.
- **`error` y `hint`:** son del **grupo** (por ejemplo, "Elige al menos una"). El `<fieldset>` los referencia con `aria-describedby`. El componente no valida.

## Estructuras

- **`default`:** las casillas en una columna.
- **`chip`:** los chips en una fila que salta de línea (filtros).
- **`card`:** las tarjetas en una cuadrícula que se adapta al ancho (una columna por debajo de unos 240px por tarjeta).

```vue
<g-checkbox-group v-model="servicios" label="Filtrar por servicio" layout="chip" color="accent">
  <g-checkbox value="wifi" label="Wifi" />
  <g-checkbox value="desayuno" label="Desayuno" />
</g-checkbox-group>
```

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `Array` | El usuario alterna una hija o la maestra |

## Slots

| Slot | Contenido |
| --- | --- |
| `default` | Las casillas hijas (`GCheckbox` con `value`) |
| `label` | Título del grupo con contenido rico (sustituye a `label`) |
| `hint` | Ayuda del grupo con contenido rico |
| `error` | Error del grupo con contenido rico; solo se muestra si `error` tiene valor |

## Accesibilidad

- **Agrupamiento nativo:** `<fieldset>`/`<legend>`, sin roles ARIA añadidos.
- **Teclado:** Tab recorre la maestra y las hijas en el orden del documento; Espacio alterna. Sin flechas (no es un grupo de radios).
- **Conteo:** el texto vive en una región `aria-live="polite"` que se actualiza sin mover el foco.
- **Error del grupo:** región viva, siempre presente (vacía si no hay error), con un icono `triangle-alert` de Lucide que los lectores no leen.
- **Deshabilitado:** con `disabled`, el `<fieldset>` deshabilita a todas las hijas y a la maestra.
- **Táctil:** las filas del grupo miden al menos 44px con `pointer: coarse`.
- El grupo hereda el foco, el contraste y el movimiento de `GCheckbox`.

## Tema

El grupo solo lee tokens `--g-*`: `--g-color-border` (línea bajo la cabecera), `--g-color-text`, `--g-color-text-muted`, `--g-color-text-subtle`, `--g-color-danger-text`, `--g-space-1..4`, `--g-font-ui`, `--g-text-{caption|body-sm}-{size|line}`, `--g-text-action-weight` y `--g-border-width`. La cuadrícula de tarjetas deriva su ancho mínimo de `--g-space-1`. Las casillas se estilizan con el tema de `GCheckbox`.

## Clases

`g-checkbox-group`, `g-checkbox-group--layout-*`, `g-checkbox-group__label`, `g-checkbox-group__head`, `g-checkbox-group__count`, `g-checkbox-group__list`, `g-checkbox-group__hint` y `g-checkbox-group__error`.

## Limitaciones conocidas

- **Maestra con muchas hijas:** `aria-controls` con decenas de ids es válido pero su soporte es irregular; no dependas de él.
- **Conteo muy frecuente:** una región viva educada puede tardar o agruparse si se alterna muy rápido; es el comportamiento esperado.
- **Sin árbol de casillas anidadas** ni grupos dentro de grupos.
- No hay tema oscuro todavía.
- **Sin verificar:** un lector de pantalla real (conteo y estado mixto de la maestra), las preferencias reales de `prefers-reduced-motion` y `forced-colors`, el zoom al 200% y un dispositivo táctil real.

## Fuentes

- API: [`GCheckboxGroup.meta.json`](./GCheckboxGroup.meta.json) · Contrato: [`design/contracts/checkbox.md`](../../../../../design/contracts/checkbox.md) · Prototipo: [`design/lab/checkbox/r01/`](../../../../../design/lab/checkbox/r01/) · Auditoría: [`design/lab/checkbox/auditoria.md`](../../../../../design/lab/checkbox/auditoria.md)
