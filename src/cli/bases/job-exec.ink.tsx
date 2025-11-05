import { isWorkloadEnded, type Job$, WorkloadState } from '@jujulego/tasks';
import { inject$ } from '@kyrielle/injector';
import { filter$, pipe$, waitFor$ } from 'kyrielle';
import process from 'node:process';
import { SCHEDULER } from '../../tokens.js';
import WorkloadTreeCompleted from '../components/WorkloadTreeCompleted.jsx';
import WorkloadTreeSpinner from '../components/WorkloadTreeSpinner.jsx';
import { inked } from '../inked.jsx';

const JobExecInk = inked(async function* ({ job, verbose }: JobExecInkProps) {
  const scheduler = await inject$(SCHEDULER);

  yield <WorkloadTreeSpinner workload={job} verbose={verbose} />;
  scheduler.register(job);

  const outcome = await waitFor$(pipe$(job.state$, filter$(isWorkloadEnded)));
  yield <WorkloadTreeCompleted workload={job} verbose={verbose} />;

  if (outcome !== WorkloadState.Succeeded) {
    process.exitCode = 1;
  }
});

export default JobExecInk;

// Types
export interface JobExecInkProps {
  readonly job: Job$;
  readonly verbose?: boolean;
}
