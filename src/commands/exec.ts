import { inject$ } from '@kyrielle/injector';
import { parallelFlow$, type SpawnJob$, WorkloadState } from '@kyrielle/workload';
import { startSpan } from '@sentry/node';
import { collect$, pipe$ } from 'kyrielle';
import { spawn } from 'node:child_process';
import process from 'node:process';
import type { PlanModeArgs } from '../middlewares/with-plan.js';
import { loadWorkspace, withWorkspace, type WorkspaceArgs } from '../middlewares/with-workspace.js';
import type { WorkspaceDepsMode } from '../projects/workspace.js';
import { LOGGER } from '../tokens.js';
import { traceImport } from '../utils/sentry.js';
import type { JobCommandModule } from '../wrappers/job-command.js';

// Command
const command: JobCommandModule<ExecArgs> = {
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
    return await workspace.exec(args.command, rest, {
      buildScript: args.buildScript,
      buildDeps: args.depsMode,
    });
  },
  async execute(args, arg) {
    const job = (arg as SpawnJob$);

    if (job.dependencies().length > 0) {
      const dependencies = pipe$(
        job.dependencies(),
        collect$(parallelFlow$({ label: 'build dependencies' }))
      );

      // Run dependencies first with spinners
      const { JobCommandExecuteInk } = await traceImport('JobCommandExecuteInk', () => import('../wrappers/job-command-execute.ink.jsx'));
      await JobCommandExecuteInk({ job: dependencies, verbose: ['verbose', 'debug'].includes(args.verbose) });

      if (dependencies.state() !== WorkloadState.Succeeded) {
        return;
      }
    } else {
      const logger = inject$(LOGGER);
      logger.verbose('No dependency to build');
    }

    await startSpan({
      op: 'subprocess',
      name: [job.cmd, ...job.args].join(' '),
    }, async () => {
      const child = spawn(job.cmd, job.args, {
        stdio: 'inherit',
        cwd: job.cwd!,
        env: {
          ...process.env,
          ...job.env
        },
        shell: true,
        windowsHide: true,
      });

      process.exitCode = await new Promise<number>((resolve) => {
        child.on('close', (code) => {
          resolve(code ?? 0);
        });
      });
    });
  }
};

export default command;

// Types
export interface ExecArgs extends PlanModeArgs, WorkspaceArgs {
  readonly command: string;
  readonly 'build-script': string;
  readonly 'deps-mode': WorkspaceDepsMode;
}
