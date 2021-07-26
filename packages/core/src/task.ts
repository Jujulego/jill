import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { Logger } from 'winston';
import * as path from 'path';

import { logger } from './logger';
import { Workspace } from './workspace';

// Types
export interface TaskOptions {
  cwd?: string;
  env?: Partial<Record<string, string>>
  logger?: Logger;
  workspace?: Workspace,
}

export type TaskStatus = 'waiting' | 'ready' | 'running' | 'done' | 'failed';
export type TaskStatusListener = () => void;

// Class
export class Task extends EventEmitter {
  // Attributes
  private _status: TaskStatus = 'ready';
  private _dependencies: Task[] = [];
  private _process?: ChildProcess;
  private readonly _logger: Logger;

  // Constructor
  constructor(
    readonly cmd: string,
    readonly args: string[] = [],
    readonly opts: TaskOptions = {}
  ) {
    super();
    this._logger = opts.logger || logger;
    this._logger.debug(`${[this.cmd, ...this.args].join(' ')} is ${this._status}`);
  }

  // Methods
  protected _setStatus(status: TaskStatus): void {
    if (this._status === status) return;

    // Update and emit
    this._status = status;
    this._logger.debug(`${[this.cmd, ...this.args].join(' ')} is ${status}`);
    this.emit(status);
  }

  private _recomputeStatus() {
    if (['waiting', 'ready'].includes(this._status)) {
      if (this._dependencies.some(dep => dep.status === 'failed')) {
        // Check if one dependency is failed
        this._setStatus('failed');
      } else if (this._dependencies.every(dep => dep.status === 'done')) {
        // Check if all dependencies are done
        this._setStatus('ready');
      } else {
        this._setStatus('waiting');
      }
    }
  }

  complexity(cache: Map<Task, number> = new Map()): number {
    let complexity = cache.get(this);

    if (complexity === undefined) {
      complexity = 0;

      for (const dep of this.dependencies) {
        complexity += (cache.get(dep) ?? dep.complexity(cache)) + 1;
      }

      cache.set(this, complexity);
    }

    return complexity;
  }

  addDependency(task: Task): void {
    if (['waiting', 'ready'].includes(this._status)) {
      this._dependencies.push(task);
      this._recomputeStatus();

      task.on('done', () => {
        this._recomputeStatus();
      });

      task.on('failed', () => {
        this._recomputeStatus();
      });
    } else {
      throw Error(`Cannot add a dependency to a ${this._status} task`);
    }
  }

  start(): void {
    if (this._status !== 'ready') {
      throw Error(`Cannot start a ${this._status} task`);
    }

    this._logger.verbose(`Running ${[this.cmd, ...this.args].join(' ')} (in ${path.relative(process.cwd(), this.cwd) || '.'})`);
    this._process = spawn(this.cmd, this.args, {
      cwd: this.cwd,
      shell: true,
      stdio: 'pipe',
      env: {
        FORCE_COLOR: '1',
        ...process.env,
        ...this.opts.env
      }
    });

    this._setStatus('running');

    this._process.stdout?.on('data', (msg: Buffer) => {
      this._logger.info(msg.toString('utf-8').replace(/\n$/, ''));
    });
    this._process.stderr?.on('data', (msg: Buffer) => {
      this._logger.info(msg.toString('utf-8').replace(/\n$/, ''));
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
  get dependencies(): Task[] {
    return this._dependencies;
  }

  get cwd(): string {
    return this.opts.cwd ?? process.cwd();
  }

  get status(): TaskStatus {
    return this._status;
  }

  get exitCode(): number | null {
    return this._process?.exitCode || null;
  }

  get workspace(): Workspace | null {
    return this.opts.workspace || null;
  }
}

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
