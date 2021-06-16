import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

// Types
export interface TaskOptions {
  cwd?: string;
  env?: Partial<Record<string, string>>
}

export type TaskStatus = 'waiting' | 'ready' | 'running' | 'done' | 'failed';
export type TaskStatusListener = () => void;

// Enforce EventEmitter types
export declare interface Task {
  addListener(event: TaskStatus, listener: TaskStatusListener): this;
  removeListener(event: TaskStatus, listener: TaskStatusListener): this;
  removeAllListeners(event?: TaskStatus): this;
  on(event: TaskStatus, listener: TaskStatusListener): this;
  once(event: TaskStatus, listener: TaskStatusListener): this;
  off(event: TaskStatus, listener: TaskStatusListener): this;
  listenerCount(event: TaskStatus): number;
  listeners(event: TaskStatus): TaskStatusListener[];
  rawListeners(event: TaskStatus): TaskStatusListener[];
  emit(event: TaskStatus): boolean;
  prependListener(event: TaskStatus, listener: TaskStatusListener): this;
  prependOnceListener(event: TaskStatus, listener: TaskStatusListener): this;
  eventNames(): TaskStatus[];
}

// Class
export class Task extends EventEmitter {
  // Attributes
  private _status: TaskStatus = 'ready';
  private _dependencies: Task[] = [];
  private _process?: ChildProcess;

  // Constructor
  constructor(
    readonly cmd: string,
    readonly args: string[],
    readonly opts: TaskOptions = {}
  ) { super(); }

  // Methods
  private _setStatus(status: TaskStatus) {
    if (this._status === status) return;

    // Update and emit
    this._status = status;
    this.emit(status);
  }

  private _recomputeStatus() {
    if (['waiting', 'ready'].includes(this._status)) {
      // Check if one dependency is failed
      if (this._dependencies.some(dep => dep.status === 'failed')) {
        this._setStatus('failed');
      }

      // Check if all dependencies are done
      if (this._dependencies.every(dep => dep.status === 'done')) {
        this._setStatus('ready');
      } else {
        this._setStatus('waiting');
      }
    }
  }

  addDependency(task: Task) {
    if (['waiting', 'ready'].includes(this._status)) {
      this._dependencies.push(task);
      this._recomputeStatus();

      task.on('done', () => {
        this._recomputeStatus();
      });
    } else {
      throw Error(`Cannot add a dependency to a ${this._status} task`);
    }
  }

  start() {
    if (this._status !== 'ready') {
      throw Error(`Cannot start a ${this._status} task`);
    }

    this._process = spawn(this.cmd, this.args, {
      cwd: this.cwd,
      shell: true,
      stdio: 'inherit',
      env: {
        FORCE_COLOR: '1',
        ...process.env,
        ...this.opts.env
      }
    });

    this._process.on('close', (code) => {
      if (code) {
        this._setStatus('failed');
      } else {
        this._setStatus('done');
      }
    });
  }

  // Properties
  get cwd(): string {
    return this.opts.cwd ?? process.cwd();
  }

  get status(): TaskStatus {
    return this._status;
  }

  get exitCode(): number | null {
    return this._process?.exitCode || null;
  }
}
