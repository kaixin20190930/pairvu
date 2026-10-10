#!/usr/bin/env node
import { main } from '../lib/automation/control.mjs';
try { await main(process.argv.slice(2)); }
catch (error) { console.error(`pairvu-control: ${error.message}`); process.exitCode = 1; }
