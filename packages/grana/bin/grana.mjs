#!/usr/bin/env node
import { main } from '@grana/cli/main'

process.exitCode = await main()
