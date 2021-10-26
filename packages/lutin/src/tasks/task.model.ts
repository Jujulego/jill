// Enumeration
export enum TaskStatus {
  ready = 'ready',
  running = 'running',
  done = 'done',
  failed = 'failed',
}

// Models
export interface ITaskOptions {
  cwd?: string;
}

export interface ITask {
  id: string;
  cmd: string;
  args: string[];
  status: TaskStatus;
  options?: ITaskOptions;
}