# Button

> **Componente:** `GBtn` · **Etiqueta:** `<g-btn>` · **Estado:** `candidate` · **Desde:** `0.1.0`

Un botón de acción. Si recibe `href`, se renderiza como enlace.

## Cuándo usarlo

Usa `<g-btn>` para iniciar una acción: guardar, enviar, crear, confirmar o navegar hacia un destino claro.

No lo uses para texto estático ni para agrupar controles sin acción. Para navegación mediante URL, pasa `href`; no simules un enlace con un botón y un manejador de clic.

## Ejemplo mínimo

```vue
<script setup>
function save() {
  // Guarda los cambios.
}
</script>

<template>
  <g-btn @click="save">Guardar cambios</g-btn>
</template>
```

## Variantes y color

```vue
<template>
  <g-btn>Acción principal</g-btn>
  <g-btn variant="soft">Acción secundaria</g-btn>
  <g-btn variant="outline" color="danger">Eliminar</g-btn>
  <g-btn variant="ghost">Cancelar</g-btn>
  <g-btn href="/reservas" variant="link">Ver reservas</g-btn>
</template>
```

- `variant`: `solid`, `soft`, `outline`, `ghost` o `link`.
- `color`: `brand`, `accent`, `neutral`, `success`, `warning`, `danger` o `info`.
- `size`: `xs`, `sm`, `md`, `lg` o `xl`.
- `density`: `default`, `comfortable` o `compact`.
- `rounded`: `none`, `xs`, `sm`, `md`, `lg`, `xl` o `pill`.

## Estados

```vue
<template>
  <g-btn disabled>No disponible</g-btn>

  <g-btn :loading="saving" loading-text="Guardando cambios">
    Guardar
  </g-btn>
</template>
```

Con `loading`, el botón no emite clics ni envía un formulario por accidente, pero conserva el foco. Proporciona `loading-text` cuando haya una operación asíncrona: Grana no fija un texto porque la aplicación decide el idioma.

## API

| Prop | Tipo | Por defecto | Notas |
| --- | --- | --- | --- |
| `color` | String | `brand` | Color semántico de la acción. |
| `variant` | String | `solid` | Apariencia del botón. |
| `size` | String | `md` | Tamaño visual. |
| `density` | String | `default` | Densidad vertical. |
| `rounded` | String | tema | Sobrescribe el radio del tema. |
| `block` | Boolean | `false` | Ocupa el ancho disponible. |
| `disabled` | Boolean | `false` | Deshabilita el control. |
| `loading` | Boolean | `false` | Evita activación y muestra indicador. |
| `loadingText` | String | — | Texto anunciado durante carga. |
| `type` | String | `button` | `button`, `submit` o `reset`. |
| `href` | String | — | Lo convierte en enlace. |
| `icon` | Boolean | `false` | Lo convierte en botón cuadrado de icono. |

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `click` | `MouseEvent` | Activación por puntero o teclado; nunca en `disabled` ni `loading`. |

| Slot | Uso |
| --- | --- |
| predeterminado | Etiqueta o contenido principal. |
| `prepend` | Icono decorativo antes de la etiqueta. |
| `append` | Icono decorativo después de la etiqueta. |

## Accesibilidad

- Usa el elemento nativo adecuado: botón por defecto y enlace cuando hay `href`.
- Un botón con `icon` necesita `aria-label` o `aria-labelledby`.
- Tab y Shift+Tab usan el comportamiento nativo; Enter activa botón y enlace, y Espacio activa el botón.
- El foco es visible y el área táctil llega a 44px con `pointer: coarse`.
- `loadingText` se anuncia en una región de estado fuera del botón.

## Tema

`GBtn` consume tokens `--g-*`: colores semánticos, radios, espaciado, tipografía, foco y movimiento. Personaliza el tema con el CLI; no sobrescribas colores individuales dentro del componente.

Consulta [Tema y tokens](../contract/tokens.md) para el esquema completo.

## Referencia técnica

[README técnico de GBtn](../../packages/vue/src/components/GBtn/README.md) · [metadatos de API](../../packages/vue/src/components/GBtn/GBtn.meta.json)
