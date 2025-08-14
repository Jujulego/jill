import type { CommandModule } from 'yargs';
import type { WorkspaceDepsMode } from '../../projects/workspace.js';
import { loadWorkspace, withWorkspace, type WorkspaceArgs } from '../middlewares/workspace.middleware.js';

// Command
const command: CommandModule<unknown, ExecArgs> = {
  command: 'exec <command>',
  aliases: ['$0'],
  describe: 'Run command inside workspace, after all its dependencies has been built.',
  builder: (args) => withWorkspace(args)
    .positional('command', { type: 'string', demandOption: true })
    .option('build-script', {
      default: 'build',
      desc: 'Script to use to build dependencies'
    })
    .option('deps-mode', {
      alias: 'd',
      choice: ['all', 'prod', 'none'],
      default: 'all' as const,
      desc: 'Dependency selection mode:\n' +
        ' - all = dependencies AND devDependencies\n' +
        ' - prod = dependencies\n' +
        ' - none = nothing'
    })

    // Documentation
    .example('jill eslint', '')
    .example('jill eslint --env-info', 'Unknown arguments are passed down to command. Here it would run eslint --env-info')
    .example('jill eslint -- -v', 'You can use -- to stop argument parsing. Here it would run eslint -v')

    // Config
    .strict(false)
    .parserConfiguration({
      'unknown-options-as-args': true,
    }),
  async handler(args) {
    const workspace = await loadWorkspace(args);
  },
};

export default command;

// Types
export interface ExecArgs extends WorkspaceArgs {
  readonly command: string;
  readonly 'build-script': string;
  readonly 'deps-mode': WorkspaceDepsMode;
}