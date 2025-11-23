import { inject$ } from '@kyrielle/injector';
import type { Logger } from '@kyrielle/logger';
import { sequenceFlow$, type SequenceFlowProps, type Workflow$ } from '@kyrielle/workload';
import { collect$, filter$, pipe$ } from 'kyrielle';
import { ClientError } from '../errors.js';
import type { Workspace } from '../projects/workspace.js';
import { traceImport } from '../utils/sentry.js';
import { escapeCommandLineArg, splitCommandLine } from '../utils/string.js';
import { command$ } from './command$.js';

export async function runScript$(
  workspace: Workspace,
  script: string,
  args: string[],
  opts: RunScriptOpts = {}
): Promise<ScriptWorkflow$> {
  // Run script itself
  const jobs = [await planScript$(workspace, script, args, opts)];

  if (!jobs[0]) {
    throw new ScriptNotFound(`No script ${script} in ${workspace.name}`);
  }

  // Run hooks
  if (opts.runHooks) {
    jobs.unshift(await planScript$(workspace, `pre${script}`, [], opts));
    jobs.push(await planScript$(workspace, `post${script}`, [], opts));
  }

  // Prepare workflow
  const flow = pipe$(jobs,
    filter$((job) => job !== null),
    collect$(
      sequenceFlow$({
        label: script,
        type: 'script',
      })
    )
  );

  return {
    ...flow,
    script,
    workspace,
  };
}

// Utils
async function planScript$(
  workspace: Workspace,
  script: string,
  args: string[],
  opts: RunScriptOpts
) {
  // Load script
  let line = workspace?.getScript(script);

  if (!line) {
    return null;
  }

  // Parse script
  const [command, ...commandArgs] = splitCommandLine(line);

  if (!command) {
    return null;
  }

  if (command === 'jill') {
    const argv = [...commandArgs, ...args].map(arg => arg.replace(/^["'](.+)["']$/, '$1'));

    const { PlannerService } = await traceImport('PlannerService', () => import('../services/planner.service.js'));
    const plannerService = inject$(PlannerService);
    const job = await plannerService.plan(argv, workspace.root);

    if (job) {
      return job;
    }
  }

  // Run command
  const pm = await workspace.project.packageManager();
  line = [line, args.map(escapeCommandLineArg)].join(' ');

  return command$(workspace, line, {
    logger: opts.logger,
    superCommand: pm === 'yarn' && command !== 'yarn' ? 'yarn exec' : undefined,
  });
}

export class ScriptNotFound extends ClientError {
  name = 'ScriptNotFound';
}

// Types
export interface RunScriptOpts extends SequenceFlowProps {
  readonly logger?: Logger;
  readonly runHooks?: boolean;
}

export interface ScriptWorkflow$ extends Workflow$ {
  readonly script: string;
  readonly workspace: Workspace;
}
