import { inject$ } from '@kyrielle/injector';
import { isWorkloadEnded, type Job$, WorkloadState } from '@kyrielle/workload';
import { filter$, pipe$, waitFor$ } from 'kyrielle';
import process from 'node:process';
import { WorkloadTreeCompleted } from '../components/WorkloadTreeCompleted.jsx';
import { WorkloadTreeSpinner } from '../components/WorkloadTreeSpinner.jsx';
import { SCHEDULER } from '../tokens.js';
import { inked } from './inked.jsx';

export const JobCommandExecuteInk = inked(async function* ({ job, verbose }: JobExecInkProps) {
  const scheduler = await inject$(SCHEDULER);

  yield <WorkloadTreeSpinner workload={job} verbose={verbose} />;
  scheduler.register(job);

  const outcome = await waitFor$(pipe$(job.state$, filter$(isWorkloadEnded)));
  yield <WorkloadTreeCompleted workload={job} verbose={verbose} />;

  if (outcome !== WorkloadState.Succeeded) {
    process.exitCode = 1;
  }
});

// Types
export interface JobExecInkProps {
  readonly job: Job$;
  readonly verbose?: boolean;
}
