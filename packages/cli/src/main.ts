import { hideBin } from 'yargs/helpers';
import yargs from 'yargs';

import { buildCommand } from './commands/build';
import { eachCommand } from './commands/each';
import { infoCommand } from './commands/info';
import { listCommand } from './commands/list';
import { runCommand } from './commands/run';
import { commandHandler } from './wrapper';

// Bootstrap
(async () => {
  // Options
  await yargs(hideBin(process.argv))
    .scriptName('jill')
    .option('project', {
      alias: 'p',
      type: 'string',
      description: 'Project root directory'
    })
    .option('verbose', {
      alias: 'v',
      type: 'count',
      description: 'Set verbosity level (1 for verbose, 2 for debug)',
    })
    .parserConfiguration({
      'populate--': true,
    })
    .command(['list', 'ls'], 'List workspaces', {
      affected: {
        alias: 'a',
        type: 'string',
        coerce: (rev: string) => rev === '' ? 'master' : rev,
        group: 'Filters:',
        desc: 'Print only affected workspaces towards given git revision. If no revision is given, it will check towards master',
      },
      private: {
        type: 'boolean',
        group: 'Filters:',
        desc: 'Print only private workspaces',
      },
      'with-script': {
        type: 'string',
        nargs: 1,
        group: 'Filters:',
        desc: 'Print only workspaces having the given script',
      },
      attrs: {
        type: 'array',
        choices: ['name', 'version', 'root'],
        group: 'Format:',
        desc: 'Select printed attributes'
      },
      headers: {
        type: 'boolean',
        group: 'Format:',
        desc: 'Prints columns headers'
      },
      long: {
        alias: 'l',
        type: 'boolean',
        conflicts: 'attrs',
        group: 'Format:',
        desc: 'Prints name, version and root of all workspaces',
      },
      json: {
        type: 'boolean',
        group: 'Format:',
        desc: 'Prints data as a JSON array',
      }
    }, commandHandler(listCommand))
    .command('info <workspace>', 'Print workspace data', {}, commandHandler(infoCommand))
    .command('build <workspace>', 'Build workspace', {}, commandHandler(buildCommand))
    .command('run <workspace> <script>', 'Run script inside workspace', {}, commandHandler(runCommand))
    .command('each <script>', 'Run script on selected workspaces', {
      affected: {
        alias: 'a',
        type: 'string',
        coerce: (rev: string) => rev === '' ? 'master' : rev,
        group: 'Filters:',
        desc: 'Print only affected workspaces towards given git revision. If no revision is given, it will check towards master',
      },
      private: {
        type: 'boolean',
        group: 'Filters:',
        desc: 'Print only private workspaces',
      }
    }, commandHandler(eachCommand))
    .demandCommand(1)
    .help()
    .example('$0 list -a', 'List all affected workspaces towards master branch')
    .example('$0 list --no-private', 'List all public workspaces')
    .parse();
})();
