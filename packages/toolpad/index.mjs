#!/usr/bin/env node
// eslint-disable-next-line import/extensions
import cli from './dist/esm/index.mjs';

cli(process.argv.slice(2));
