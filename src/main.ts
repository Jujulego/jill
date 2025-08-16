import { executeParser } from './cli/parser.js';
import 'reflect-metadata/lite';

// Bootstrap
const parser = executeParser();

await parser
  .wrap(parser.terminalWidth())
  .parseAsync();
