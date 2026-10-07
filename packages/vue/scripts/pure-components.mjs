// Plugin de Vite (dueño: bruno): marca como puras las llamadas a `defineComponent(` de los componentes de Grana.
//
// Vue es externo en dist/grana.js, así que el empaquetador de la aplicación no siempre sabe que `defineComponent` no tiene
// efectos (Rollup lo deduce de la anotación de Vue solo si empaqueta Vue en el mismo grafo; webpack con terser, esbuild
// con Vue externo o el SSR de Vite no). Sin la marca, `export default defineComponent({ … })` de los componentes con
// render propio (GCard, GTable, GSidebar, GMenu…) queda como una llamada suelta que nadie se atreve a quitar, y quien
// importa solo GBtn arrastra la mitad de la librería. Los `<script setup>` ya salen marcados por el compilador de Vue.
//
// También `oneOf(` (utils/oneOf.js, el validador de props: solo devuelve una función): esbuild y terser no analizan el cuerpo
// de una función, y una llamada sin marca dentro de las opciones del componente basta para que conserven el componente
// entero aunque `defineComponent` esté marcada. La marca no cambia el comportamiento: las dos solo devuelven un valor.
//
// Medido (importar solo GBtn, minificado, gzip, sin contar Vue): con Rollup y Vue externo, 66,4 KB → 10,9 KB; con esbuild,
// 137,8 KB → 11,1 KB; con Rollup y Vue en el mismo grafo (una aplicación Vite) ya era 11,7 KB y no cambia. Un comentario
// de bloque que contenga «defineComponent(» u «oneOf(» rompería el build (la marca cerraría el comentario): se nota al construir.
const CALL = /(?<!__PURE__\s*\*\/\s*)(?<![\w$.])(_?defineComponent|oneOf)\s*\(/g

export function pureComponents() {
  return {
    name: 'grana-pure-components',
    apply: 'build',
    enforce: 'post',
    transform(code, id) {
      if (id.startsWith('\0') || id.includes('node_modules') || /[?&]type=style/.test(id)) return null
      if (!/\.(vue|js|mjs)($|\?)/.test(id) || !/defineComponent|oneOf/.test(code)) return null
      const out = code.replace(CALL, '/* @__PURE__ */ $1(')
      return out === code ? null : { code: out, map: null }
    }
  }
}
