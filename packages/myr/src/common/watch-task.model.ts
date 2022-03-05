import gql from 'graphql-tag';

import { SpawnTaskMode } from './spawn-task.args';

// Enum
export enum WatchTaskStatus {
  blocked = 'blocked',
  ready   = 'ready',
  running = 'running',
  done    = 'done',
  failed  = 'failed',
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
  watchBy: readonly IWatchTask[];
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
