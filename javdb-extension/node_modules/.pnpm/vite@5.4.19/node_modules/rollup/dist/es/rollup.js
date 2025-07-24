/*
  @license
	Rollup.js v4.45.1
	Tue, 15 Jul 2025 13:08:50 GMT - commit a9b04957eac7803e61390d4387e3e96dbe4118c4

	https://github.com/rollup/rollup

	Released under the MIT License.
*/
export { version as VERSION, defineConfig, rollup, watch } from './shared/node-entry.js';
import './shared/parseAst.js';
import '../native.js';
import 'node:path';
import 'path';
import 'node:process';
import 'node:perf_hooks';
import 'node:fs/promises';
