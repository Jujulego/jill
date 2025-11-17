import type { Workload$ } from '@jujulego/tasks';
import slugify from 'slugify';
import { flatJobPlan } from '../trees/flat-job-plan.js';
import { printJson } from '../utils/json.js';
import { isScriptWorkflow } from '../utils/predicates.js';
import type { Writable } from '../utils/types.js';

export function jobPlanJson(job: Workload$, stream: NodeJS.WriteStream = process.stdout) {
  const plan = flatJobPlan(job);
  const output: PlanItemDto[] = [];

  for (const item of plan) {
    const dto: Writable<PlanItemDto> = {
      id: item.workload.id,
      parentId: item.parent?.id,
      label: item.workload.label,
      type: item.workload.type,
      dependsOn: item.dependsOn.map((idx) => plan[idx].workload.id),
    };

    if (isScriptWorkflow(item.workload)) {
      dto.workspace = {
        name: item.workload.workspace.name,
        slug: slugify(item.workload.workspace.name),
        version: item.workload.workspace.version,
        root: item.workload.workspace.root,
      };
    }

    output.push(dto);
  }

  printJson(output, stream);
}

export interface PlanWorkspaceDto {
  readonly name: string;
  readonly slug: string;
  readonly version: string;
  readonly root: string;
}

export interface PlanItemDto {
  readonly id: string;
  readonly parentId?: string;
  readonly label: string;
  readonly type: string;
  readonly workspace?: PlanWorkspaceDto;
  readonly dependsOn: readonly string[];
}