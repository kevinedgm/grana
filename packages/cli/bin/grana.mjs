#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { run } from '../src/cli.js'

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
// `init` devuelve una promesa (cli-init.md §1): se espera antes de fijar el código
process.exitCode = await run(process.argv.slice(2), { version })
