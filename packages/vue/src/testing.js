// Entrada de pruebas `@grana/vue/testing` (dueño: bruno). design/contracts/speech.md §1 y §4.7, DECISIONS.md #216.
// No viaja en el paquete principal (`@grana/vue`): se construye aparte (vite.testing.config.js → dist/testing.js y
// dist/testing.umd.js, global GranaTesting) y no importa Vue.
export { createSimulatedSpeechAdapter } from './components/GSpeechHost/simulatedAdapter.js'
