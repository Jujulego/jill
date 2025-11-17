import type { Argv } from 'yargs';
import type { LoggerArgs } from './with-logger.js';

export function withPlan<T>(parser: Argv<T>) {
  return parser
    .option('plan', {
      type: 'boolean',
      default: false,
      describe: 'Only prints tasks to be run',
    })
    .option('plan-format', {
      type: 'string',
      desc: 'Plan output format',
      choices: ['json', 'tree'] as const,
      default: 'tree' as const
    });
}

// Types
export interface PlanModeArgs extends LoggerArgs {
  readonly plan: boolean;
  readonly 'plan-format': 'json' | 'tree';
}
