# GInputGroup

Campo fusionado: **un dato en varias partes que se lee como uno** (teléfono país + número, valor + unidad elegible, moneda + importe, serie + folio, rango). Una caja, una etiqueta, un mensaje; cada parte con su foco y su nombre accesible. Partes: `GInputGroupInput`, `GInputGroupSelect` (`<select>` nativo, autocompletable) y `GInputGroupText`.

**Etiqueta:** `<g-input-group>` · **Estado:** `candidate` (auditoría de coco r02 aprobada; ver [`design/lab/form/auditoria.md`](../../../../../design/lab/form/auditoria.md)) · **Desde:** 0.1.0

> Forma parte del **sistema de formularios**. La guía completa (cuándo usar cada pieza, recetas, API, teclado, accesibilidad medida y limitaciones) está en [`GForm/README.md`](../GForm/README.md#campos-fusionados-ginputgroup).

## Uso

```vue
<GInputGroup label="Teléfono" name="telefono" required style="--g-form-min: 50">
  <GInputGroupSelect v-model="pais" name="tel-pais" part-label="Código de país" :options="paises" autocomplete="tel-country-code" />
  <GInputGroupInput v-model="numero" name="tel-numero" principal type="tel" autocomplete="tel-national" />
</GInputGroup>
```

## API en breve

Del grupo: `label`, `hint`, `name`, `error`, `warning`, `valid`, `required`, `mark`, `readonly`, `disabled`, `size`, `variant`, `density`, `block`. De las partes: `modelValue`, `name`, `partLabel`, `principal`, `required`, `error`; `type` y `chars` (texto); `options` y `placeholder` (selector); `text`, `label` y `decorative` (texto fijo). Detalle en [`GForm/README.md` · API](../GForm/README.md#api) y en [`GInputGroup.meta.json`](./GInputGroup.meta.json).

## Fuentes

Contrato: [`design/contracts/form.md`](../../../../../design/contracts/form.md) · Prototipo: [`design/lab/form/r02/`](../../../../../design/lab/form/r02/) · Estilo: [`GInputGroup.css`](./GInputGroup.css) · Auditoría: [`design/lab/form/auditoria.md`](../../../../../design/lab/form/auditoria.md)
