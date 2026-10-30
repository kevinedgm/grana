// Tipos del plugin (cli-init.md §4): sin ellos, vue-tsc -b falla con TS7016 en vite.config.ts.
import type { Plugin } from 'vite'

export declare const VIRTUAL_ID: 'virtual:grana/tokens.css'
export default function grana(options?: { config?: string | object }): Plugin
