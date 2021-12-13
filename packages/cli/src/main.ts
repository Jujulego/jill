import { hideBin } from 'yargs/helpers';
import yargs from 'yargs';

import { eachCommand } from './commands/each';
import { InfoCommand } from './commands/info.command';
import { listCommand } from './commands/list';
import { runCommand } from './commands/run';
import { myrCommand } from './myr/command';
import { watchCommand } from './myr/watch';
import { commandHandler } from './wrapper';

// Bootstrap
(async () => {
  // Options
  const parser = await yargs(hideBin(process.argv))
    .scriptName('jill')
    .option('project', {
      alias: 'p',
      type: 'string',
      description: 'Project root directory'
    })
    .option('package-manager', {
      choices: ['yarn', 'npm'],
      type: 'string',
      description: 'Force package manager'
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
      private: {
        type: 'boolean',
        group: 'Filters:',
        desc: 'Print only private workspaces',
      },
      'with-script': {
        type: 'array',
        group: 'Filters:',
        desc: 'Print only workspaces having the given script',
      },
      affected: {
        alias: 'a',
        type: 'string',
        coerce: (rev: string) => rev === '' ? 'master' : rev,
        group: 'Affected:',
        desc: 'Print only affected workspaces towards given git revision. If no revision is given, it will check towards master.\n' +
          'Replaces %name by workspace name.',
      },
      'affected-rev-sort': {
        type: 'string',
        group: 'Affected:',
        desc: 'Sort applied to git tag / git branch command',
      },
      'affected-rev-fallback': {
        type: 'string',
        default: 'master',
        group: 'Affected:',
        desc: 'Fallback revision, used if no revision matching the given format is found',
      },
      attrs: {
        type: 'array',
        choices: ['name', 'version', 'root', 'slug'],
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
    .command('run <script>', 'Run script inside workspace', {
      workspace: {
        alias: 'w',
        type: 'string',
        desc: 'Workspace to use'
      },
      'deps-mode': {
        choice: ['all', 'prod', 'none'],
        default: 'all',
        desc: 'Dependency selection mode:\n' +
          ' - all = dependencies AND devDependencies\n' +
          ' - prod = dependencies\n' +
          ' - none = nothing'
      },
    }, commandHandler(runCommand))
    .command('each <script>', 'Run script on selected workspaces', {
      'deps-mode': {
        choice: ['all', 'prod', 'none'],
        default: 'all',
        desc: 'Dependency selection mode:\n' +
          ' - all = dependencies AND devDependencies\n' +
          ' - prod = dependencies\n' +
          ' - none = nothing'
      },
      private: {
        type: 'boolean',
        group: 'Filters:',
        desc: 'Print only private workspaces',
      },
      affected: {
        alias: 'a',
        type: 'string',
        coerce: (rev: string) => rev === '' ? 'master' : rev,
        group: 'Affected:',
        desc: 'Print only affected workspaces towards given git revision. If no revision is given, it will check towards master.\n' +
          'Replaces %name by workspace name.',
      },
      'affected-rev-sort': {
        type: 'string',
        group: 'Affected:',
        desc: 'Sort applied to git tag / git branch command',
      },
      'affected-rev-fallback': {
        type: 'string',
        default: 'master',
        group: 'Affected:',
        desc: 'Fallback revision, used if no revision matching the given format is found',
      },
    }, commandHandler(eachCommand))
    .command('myr', 'Interact with myr server', myrCommand)
    .command('watch <script>', 'Run script inside workspace and watch over deps', {
      daemon: {
        alias: 'd',
        boolean: true,
        default: false,
        desc: 'Run watch script also in background'
      },
      workspace: {
        alias: 'w',
        type: 'string',
        desc: 'Workspace to use'
      }
    }, commandHandler(watchCommand))
    .demandCommand(1)
    .help()
    .example('$0 list -a', 'List all affected workspaces towards master branch')
    .example('$0 list --no-private', 'List all public workspaces');

  Promise.race([
    (new InfoCommand(parser)).run()
  ]);

  parser.parse();
})();
