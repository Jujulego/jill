import { executeParser } from './cli/parser.js';

// Bootstrap
const parser = executeParser();

await parser
  .wrap(parser.terminalWidth())
  .parseAsync();
