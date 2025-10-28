import { sequenceFlow$, type SequenceFlowProps } from '@jujulego/tasks';
import { inject$ } from '@kyrielle/injector';
import type { Logger } from '@kyrielle/logger';
import { collect$, filter$, pipe$ } from 'kyrielle';
import type { Workspace } from '../../projects/workspace.js';
import { splitCommandLine } from '../../utils/string.js';
import { ClientError } from '../utils/errors.js';
import { command$ } from './command$.js';

export async function runScript$(
  workspace: Workspace,
  script: string,
  args: string[],
  opts: RunScriptOpts = {}
) {
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
  return pipe$(jobs,
    filter$((job) => job !== null),
    collect$(
      sequenceFlow$({
        label: script,
        type: 'script',
      })
    )
  );
}

async function planScript$(
  workspace: Workspace,
  script: string,
  args: string[],
  opts: RunScriptOpts
) {
  // Load script
  const line = workspace?.getScript(script);

  if (!line) {
    return null;
  }

  // Parse script
  const [command, ...commandArgs] = splitCommandLine(line);

  if (!command) {
    return null;
  }

  if (command === 'jill') {
    const argv = commandArgs.map(arg => arg.replace(/^["'](.+)["']$/, '$1'));

    const { PlannerService } = await import('../services/planner.service.js');
    const plannerService = inject$(PlannerService);
    const job = await plannerService.plan(argv, workspace.root);

    if (job) {
      return job;
    }
  }

  // Run command
  const pm = await workspace.project.packageManager();

  return command$(workspace, command, [...commandArgs, ...args], {
    logger: opts.logger,
    superCommand: pm === 'yarn' ? ['yarn', 'exec'] : undefined,
  });
}

export interface RunScriptOpts extends SequenceFlowProps {
  readonly logger?: Logger;
  readonly runHooks?: boolean;
}

export class ScriptNotFound extends ClientError {
  name = 'ScriptNotFound';
}