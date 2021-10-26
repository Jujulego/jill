// Enumeration
export enum TaskStatus {
  ready = 'ready',
  running = 'running',
  done = 'done',
  failed = 'failed',
}

// Models
export interface ITask {
  cwd: string;
  cmd: string;
  args: string[];
  status: TaskStatus;
}

export interface ISpawnArgs {
  cwd: string;
  cmd: string;
  args?: string[];
}