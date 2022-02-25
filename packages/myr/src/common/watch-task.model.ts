import gql from 'graphql-tag';

import { SpawnTaskMode } from './spawn-task.args';

// Enum
export enum WatchTaskStatus {
  BLOCKED = 'blocked',
  READY   = 'ready',
  RUNNING = 'running',
  DONE    = 'done',
  FAILED  = 'failed',
}

// Model
export interface IWatchTask {
  // Attributes
  id: string;
  cwd: string;
  cmd: string;
  args: readonly string[];
  status: WatchTaskStatus;
  mode: SpawnTaskMode;
  watchOn: readonly IWatchTask[];
}

// Fragments
export const WatchTaskFragment = gql`
    fragment WatchTask on WatchTask {
        id
        cwd
        cmd
        args
        status
        mode
    }
`;
