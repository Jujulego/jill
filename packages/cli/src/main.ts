import { hideBin } from 'yargs/helpers';
import yargs from 'yargs';

import { eachCommand } from './commands/each';
import { InfoCommand } from './commands/info.command';
import { ListCommand } from './commands/list.command';
import { RunCommand } from './commands/run.command';
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
    .strictCommands()
    .help()
    .example('$0 list -a', 'List all affected workspaces towards master branch')
    .example('$0 list --no-private', 'List all public workspaces');

  const exit = Promise.race([
    (new InfoCommand(parser)).run(),
    (new ListCommand(parser)).run(),
    (new RunCommand(parser)).run()
  ]);

  await parser.parse();

  process.exit((await exit) ?? 0);
})();
