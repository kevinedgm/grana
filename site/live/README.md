# Fichas interactivas del sitio («Prueba en vivo»)

Cada `G<Nombre>.js` de esta carpeta pone en la página del componente la **ficha interactiva** del contrato de mora-docs (`docs/documentacion/contrato.md` §3, bloques 4 a 6): el componente real de `@grana/vue` (el `dist/`) con el tema real, sus medidas y los tokens que lee, el **código como control** y los **casos de uso** copiables. Lo pinta `site/.vitepress/theme/GranaLive.vue`; el generador (`site/scripts/generate.mjs`) la añade en cuanto existe el archivo.

**Los controles no se escriben aquí: salen del `meta.json`.** Un control en su valor por defecto no se pasa al componente (ni sale al copiar). Cada prop con `values` es un botón que cicla (Mayús + clic o las flechas, hacia atrás; una prop sin valor por defecto empieza en «—»), cada `Boolean` una casilla. La ficha solo dice lo que el `meta.json` no sabe: los textos que el ejemplo necesita (Grana no trae textos por defecto), los datos, los slots y qué props no tiene sentido tocar en la ficha.

## Forma

```js
import { h } from 'vue'
import { GIcon } from '@grana/vue'

export default {
  exclude: ['href', 'id'],               // props del meta.json que no son controles
  text: ['label', 'hint', 'error'],      // props String que se editan como texto en el código
  controls: ['color', 'size'],
  when: { labelMode: (s) => ['segmented', 'chip'].includes(s.appearance) }, // control que solo aplica con ciertos valores de otros           // opcional: SOLO estas, en este orden (si no, todas las enumeradas y Boolean)
  base: {                                // lo que se pasa siempre: textos y datos ({ es, en } para los textos)
    label: { es: 'Área', en: 'Department' },
    options: [{ value: 'a', label: 'A' }]   // un objeto se declara como `const options = …` en el código
  },
  code: { options: ':options="areas"' }, // opcional: cómo se escribe una prop fija en el código
  model: { prop: 'modelValue', value: 'a', var: 'area' },   // v-model de la ficha (prop por defecto modelValue)
  trigger: { label: { es: 'Abrir', en: 'Open' }, value: true }, // botón que pone el modelo en `value` (diálogos, hojas)
  slots: [
    { name: 'default', text: { es: 'Guardar', en: 'Save' } },
    { name: 'prepend', optional: true, on: false, code: '<g-icon name="save" />', render: () => h(GIcon, { name: 'save' }) },
    { name: 'option', scope: '{ option }', code: '{{ option.label }}', render: ({ option }) => option.label }
  ],
  hidden: ['scenario'],                  // props que el anfitrión (`host`) usa pero que no son del componente: no salen en el código
  ignore: ['create'],                    // eventos del meta.json que la ficha no escucha (escuchar cambia el comportamiento)
  listen: false,                         // no escuchar ningún evento
  measure: '.g-switch__track',           // opcional: qué se mide (por defecto [data-g-tooltip-box] o la raíz)
  block: true,                           // el componente ocupa todo el ancho de la ficha
  imports: ["import { GCombobox } from '@grana/vue/combobox'"], // líneas extra del <script setup> copiado
  script: 'function guardar() {}',       // código extra del <script setup> copiado
  host: Componente,                      // opcional: monta este componente en lugar de la etiqueta (servicios, composiciones)
  unavailable: { es: 'motivo', en: 'reason' }, // sin ficha: la página dice «Vista previa no disponible: motivo»
  cases: [                               // de 2 a 6 casos REALES (contrato §3.6): situación, porqué y props
    {
      title: { es: 'Filtro que se puede vaciar', en: 'Clearable filter' },
      why: { es: 'Cuándo sí y cuándo no, en una frase.', en: '…' },
      props: { clearable: true, clearLabel: { es: 'Quitar', en: 'Clear' } },  // controles o fijas
      slots: { prepend: true },
      model: ['a', 'b']                  // opcional: valor del modelo en este caso
    }
  ]
}
```

## Reglas

- **Solo lo verificado:** props, valores, eventos y slots existen en el `meta.json`; los casos salen del README, del contrato o de `DECISIONS.md`, nunca de una combinación sin situación.
- **Autónomo:** sin `fetch`, sin imágenes de red, todos los textos que el componente exige (si falta uno, Grana avisa en desarrollo y `check-live.mjs` falla). Iconos: los de la librería y los de `site/.vitepress/theme/icons.js`.
- **Sin imitaciones:** si el componente no se puede montar tal cual, `host` con el componente real o `unavailable` con el motivo; nunca CSS que lo simule.
- **Verificación:** `node site/scripts/check-live.mjs --base http://localhost:5174/grana/ G<Nombre>` recorre en Chromium cada valor de cada control, cada casilla y cada caso, en claro a 1280 px y en oscuro a 375 px, y falla con un error, un aviso de Vue o de Grana o desplazamiento horizontal.
