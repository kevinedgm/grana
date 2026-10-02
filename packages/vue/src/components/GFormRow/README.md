# GFormRow

Fila de campos que van juntos. Mide **su propio ancho** y reparte cada línea entera por pesos (`g-form-w-xs|sm|md|lg` = 2 · 3 · 4 · 8); si un campo recibiría menos que su mínimo, se parte en líneas contiguas en orden del DOM que vuelven a llenar el ancho. Tres pistas compartidas por línea (etiqueta · caja · pie): las cajas de una línea quedan a la misma altura.

**Etiqueta:** `<g-form-row>` · **Estado:** `candidate` (auditoría de coco r02 aprobada; ver [`design/lab/form/auditoria.md`](../../../../../design/lab/form/auditoria.md)) · **Desde:** 0.1.0

> Forma parte del **sistema de formularios**. La guía completa (cuándo usar cada pieza, recetas, API, teclado, accesibilidad medida y limitaciones) está en [`GForm/README.md`](../GForm/README.md#filas-explícitas-y-pesos).

## Uso

```vue
<GFormRow>
  <GInput class="g-form-w-lg" label="Calle" name="calle" autocomplete="address-line1" />
  <GInput class="g-form-w-xs" label="Núm. exterior" name="num-ext" />
  <GInput class="g-form-w-xs" label="Núm. interior" name="num-int" />
</GFormRow>
```

## API en breve

`keep` (Boolean, `false`: nunca se parte) y `density`. En cada hijo: una clase `g-form-w-*` y, si hace falta, `style="--g-form-min: N"` (mínimo propio en múltiplos de `space`). Detalle en [`GForm/README.md` · API](../GForm/README.md#api) y en [`GFormRow.meta.json`](./GFormRow.meta.json).

## Fuentes

Contrato: [`design/contracts/form.md`](../../../../../design/contracts/form.md) · Prototipo: [`design/lab/form/r02/`](../../../../../design/lab/form/r02/) · Estilo: [`GFormRow.css`](./GFormRow.css) · Auditoría: [`design/lab/form/auditoria.md`](../../../../../design/lab/form/auditoria.md)
