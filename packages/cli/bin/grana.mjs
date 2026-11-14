#!/usr/bin/env node
import { main } from '../src/main.js'

process.exitCode = await main()
