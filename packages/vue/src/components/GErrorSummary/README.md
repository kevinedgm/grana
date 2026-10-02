# GErrorSummary

Resumen de errores (patrón GOV.UK): tras un envío con errores muestra el título con la cantidad y **un enlace por pregunta** con el mismo texto que el error en línea, y recibe el foco. Al corregir, cada elemento sale en silencio. Dentro de un `GForm` lee sus errores; fuera, recibe `errors`.

**Etiqueta:** `<g-error-summary>` · **Estado:** `candidate` (auditoría de coco r02 aprobada; ver [`design/lab/form/auditoria.md`](../../../../../design/lab/form/auditoria.md)) · **Desde:** 0.1.0

> Forma parte del **sistema de formularios**. La guía completa (cuándo usar cada pieza, recetas, API, teclado, accesibilidad medida y limitaciones) está en [`GForm/README.md`](../GForm/README.md#resumen-de-errores-gerrorsummary).

## Uso

```vue
<GErrorSummary :labels="{ title: (n) => `Hay ${n} problemas con el formulario` }" />
```

## API en breve

`errors` (`[{ name?, id?, message }]`, solo fuera de `GForm`), `headingLevel`, `labels.title` (String con `{count}` o función); evento `navigate` (`{ name, id, event, preventDefault() }`, cancelable). Contraste medido: título ≥ 15.22:1, enlaces y borde ≥ 4.52:1; enlaces de 44px con puntero grueso. Detalle en [`GForm/README.md` · API](../GForm/README.md#api) y en [`GErrorSummary.meta.json`](./GErrorSummary.meta.json).

## Fuentes

Contrato: [`design/contracts/form.md`](../../../../../design/contracts/form.md) · Prototipo: [`design/lab/form/r02/`](../../../../../design/lab/form/r02/) · Estilo: [`GErrorSummary.css`](./GErrorSummary.css) · Auditoría: [`design/lab/form/auditoria.md`](../../../../../design/lab/form/auditoria.md)
