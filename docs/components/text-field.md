# Text Field

> **Componente:** `GInput` · **Etiqueta:** `<g-input>` · **Estado:** `candidate` · **Desde:** `0.1.0`

Campo de texto de una línea con etiqueta, ayuda, error, iconos, contador y acción opcional.

## Cuándo usarlo

Usa `<g-input>` para valores de texto cortos: correo, nombre, búsqueda, teléfono, URL o contraseña.

No lo uses para contenido de varias líneas, números complejos, fechas o archivos. Esos casos requieren componentes especializados.

## Ejemplo mínimo

```vue
<script setup>
import { ref } from 'vue'

const email = ref('')
const emailError = ref('')

function validateEmail() {
  emailError.value = email.value.includes('@') ? '' : 'Escribe un correo válido.'
}
</script>

<template>
  <g-input
    v-model="email"
    label="Correo"
    type="email"
    autocomplete="email"
    hint="Te enviaremos el comprobante."
    :error="emailError"
    @blur="validateEmail"
  />
</template>
```

`GInput` no decide cuándo validar: la aplicación controla el valor de `error`.

## Variantes y estados

```vue
<template>
  <g-input label="Nombre" variant="outline" />

  <g-input label="Código" variant="soft" readonly model-value="GRN-001" />

  <g-input
    label="Contraseña"
    type="password"
    show-password-label="Mostrar contraseña"
    hide-password-label="Ocultar contraseña"
  />

  <g-input label="Biografía" disabled model-value="No disponible" />
</template>
```

- `variant`: `outline` o `soft`.
- `type`: `text`, `email`, `password`, `search`, `tel` o `url`.
- `loading` anuncia que hay una validación asíncrona, pero no bloquea la escritura.
- `readonly` sigue siendo enfocable y se envía; `disabled` no.

## API

| Prop | Tipo | Por defecto | Notas |
| --- | --- | --- | --- |
| `modelValue` | String | `''` | Se usa con `v-model`. |
| `label` | String | — | Nombre visible y accesible del campo. |
| `hint` / `error` | String | — | Ayuda o mensaje de error. |
| `variant` | String | `outline` | `outline` o `soft`. |
| `type` | String | `text` | Tipo de entrada permitido. |
| `size` | String | `md` | `xs` a `xl`. |
| `density` | String | `default` | También puede venir de `GForm`. |
| `color` | String | tema | Colorea foco y borde en foco. |
| `rounded` | String | tema | Radio del campo. |
| `block` | Boolean | `false` | Ocupa el ancho disponible. |
| `disabled` / `readonly` | Boolean | `false` | Estados nativos del campo. |
| `loading` | Boolean | `false` | Indica validación asíncrona. |
| `required` | Boolean | `false` | Añade requisito nativo y marca visual. |
| `counter` | Boolean | `false` | Requiere `maxlength`. |
| `showPasswordLabel` / `hidePasswordLabel` | String | — | Habilitan el botón de contraseña. |
| `id` | String | generado | Identificador estable para etiqueta y mensajes. |

También admite `warning`, `valid`, `mark`, `prefix`, `suffix`, `prefixLabel`, `suffixLabel` y `output` para formularios avanzados.

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | String | Cuando cambia el texto. |

Los atributos nativos como `name`, `placeholder`, `maxlength`, `autocomplete`, `inputmode`, `aria-*` y eventos como `@blur` se aplican al `<input>` interno.

| Slot | Uso |
| --- | --- |
| `label` | Etiqueta enriquecida. |
| `prepend` / `append` | Iconos decorativos. |
| `hint` / `error` | Ayuda o error enriquecidos. |
| `action` | Un `GBtn` acoplado al final; recibe `size`, `density` y `disabled`. |

## Campo con acción

```vue
<form @submit.prevent="subscribe">
  <g-input v-model="email" label="Correo" type="email" block>
    <template #action="{ size, density, disabled }">
      <g-btn type="submit" :size="size" :density="density" :disabled="disabled">
        Suscribirse
      </g-btn>
    </template>
  </g-input>
</form>
```

El botón conserva la altura del campo. En espacios estrechos, un botón con texto baja a una segunda línea.

## Accesibilidad

- Proporciona `label`, el slot `label`, `aria-label` o `aria-labelledby`; el placeholder no sustituye a una etiqueta.
- La ayuda y el error se conectan mediante `aria-describedby`; el error también se anuncia de forma cortés.
- `error` establece `aria-invalid="true"` y no depende sólo del color.
- Los iconos de `prepend` y `append` son decorativos: no coloques información imprescindible ahí.
- El botón de contraseña sólo se muestra con etiquetas traducibles proporcionadas por la aplicación.
- Con táctil, la caja y la acción tienen una altura mínima de 44px.

## Tema

El campo consume tokens de superficie, borde, texto, foco, radios, espaciado, tipografía y movimiento. El foco toma `accent` de manera predeterminada; cambiar sólo `brand` no cambia el aspecto del campo.

Consulta [Tema y tokens](../contract/tokens.md) para configurar un tema completo.

## Referencia técnica

[README técnico de GInput](../../packages/vue/src/components/GInput/README.md) · [metadatos de API](../../packages/vue/src/components/GInput/GInput.meta.json)
