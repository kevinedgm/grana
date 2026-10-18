// Aplicación mínima del banco #636: importa TODO el paquete principal (para medir lo que paga una aplicación que lo usa
// entero) y monta dos componentes con un aviso conocido: GDialog sin closeLabel y GTable sin caption.
import { createApp, h } from 'vue'
import * as Grana from '@grana/vue'
import { run } from './run.js'

window.Grana = Grana // conserva todas las exportaciones en el build de producción
run(createApp, h, Grana)
