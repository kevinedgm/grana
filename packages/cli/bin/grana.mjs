#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { run } from '../src/cli.js'

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
process.exitCode = run(process.argv.slice(2), { version })
