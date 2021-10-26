// Enumeration
export enum TaskStatus {
  ready = 'ready',
  running = 'running',
  done = 'done',
  failed = 'failed',
}

// Models
export interface ITask {
  cmd: string;
  args: string[];
  cwd: string;
  status: TaskStatus;
}