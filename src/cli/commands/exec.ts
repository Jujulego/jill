import { TaskSet } from '@jujulego/tasks';
import { inject$ } from '@kyrielle/injector';
import cp from 'node:child_process';
import process from 'node:process';
import type { WorkspaceDepsMode } from '../../projects/workspace.js';
import type { CommandTask } from '../../tasks/command-task.js';
import { LOGGER } from '../../tokens.js';
import { traceImport } from '../../utils/sentry.js';
import type { PlanModeArgs, JobModule } from '../bases/job-module.js';
import { loadWorkspace, withWorkspace, type WorkspaceArgs } from '../middlewares/workspace.js';

// Command
const command: JobModule<ExecArgs> = {
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
    .example('jill exec eslint', '')
    .example('jill exec eslint --env-info', 'Unknown arguments are passed down to command. Here it will run "eslint --env-info"')
    .example('jill exec eslint -- -v', 'You can use -- to stop argument parsing. Here it will run "eslint -v"')

    // Config
    .strict(false)
    .parserConfiguration({
      'unknown-options-as-args': true,
    }),
  async prepare(args) {
    const workspace = await loadWorkspace(args);

    // Extract arguments
    const rest = args._.map(arg => arg.toString());

    if (rest[0] === 'exec') {
      rest.splice(0, 1);
    }

    // Run script in workspace
    return await workspace.exec$(args.command, rest, {
      buildScript: args.buildScript,
      buildDeps: args.depsMode,
    });
  },
  // async execute(args, job) {
  //   const task = tasks.tasks[0] as CommandTask;
  //
  //   if (task.dependencies.length > 0) {
  //     const dependencies = new TaskSet();
  //
  //     for (const dep of task.dependencies) {
  //       dependencies.add(dep);
  //     }
  //
  //     // Run dependencies first with spinners
  //     const { default: JobExecInk } = await traceImport('JobExecInk', () => import('../bases/job-exec.ink.js'));
  //     await JobExecInk({ tasks: dependencies, verbose: ['verbose', 'debug'].includes(args.verbose) });
  //   } else {
  //     const logger = inject$(LOGGER);
  //     logger.verbose('No dependency to build');
  //   }
  //
  //   const child = cp.spawn(task.cmd, task.args, {
  //     stdio: 'inherit',
  //     cwd: task.cwd,
  //     env: {
  //       ...process.env,
  //       ...task.env
  //     },
  //     shell: true,
  //     windowsHide: true,
  //   });
  //
  //   process.exitCode = await new Promise<number>((resolve) => {
  //     child.on('close', (code) => {
  //       resolve(code ?? 0);
  //     });
  //   });
  // }
};

export default command;

// Types
export interface ExecArgs extends PlanModeArgs, WorkspaceArgs {
  readonly command: string;
  readonly 'build-script': string;
  readonly 'deps-mode': WorkspaceDepsMode;
}
