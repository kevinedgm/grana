# GHelperScope

Contenedor **sin aspecto propio** que fija el contexto de posición de los [`GHelper`](../GHelper/README.md) flotantes que contiene. Su única regla es `position: relative`: no añade fondo, borde, relleno ni margen.

**Etiqueta:** `<g-helper-scope>` · **Estado:** `candidate` (ver [`design/lab/helper/auditoria.md`](../../../../../design/lab/helper/auditoria.md)) · **Desde:** 0.1.0

```vue
<g-helper-scope as="section" aria-label="Datos de facturación">
  <form>…</form>
  <g-helper mode="float" placement="top-end" attach="edge" aria-label="Ayuda" content-label="Ayuda con la facturación" close-label="Cerrar">
    <template #content>…</template>
  </g-helper>
</g-helper-scope>
```

| Prop | Tipo | Por defecto | Nota |
| --- | --- | --- | --- |
| `as` | String | `div` | Elemento que se renderiza; sin rol propio |

Un solo slot (`default`), sin eventos. El resto de atributos va a la raíz.

**No es obligatorio:** sin él, un `GHelper` flotante se posiciona respecto al ancestro posicionado más cercano (por ejemplo, el cuerpo de un `GDialog` o cualquier elemento con `position: relative`). Úsalo cuando quieras que la referencia sea exactamente esa región.

Fuentes: [`GHelperScope.meta.json`](./GHelperScope.meta.json) · Contrato: [`design/contracts/helper.md`](../../../../../design/contracts/helper.md)
