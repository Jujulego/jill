import { spawn, ChildProcess } from 'child_process';
import { Logger } from 'winston';
import * as path from 'path';

import { EventEmitter } from './event-emitter';
import { logger } from './logger';
import { Workspace } from './workspace';

// Types
export interface TaskContext {
  workspace?: Workspace;
}

export interface TaskOptions {
  cwd?: string;
  env?: Partial<Record<string, string>>;
  context?: TaskContext;

  logger?: Logger;
  streamLogLevel?: string | { stdout?: string, stderr?: string };
}

export type TaskStatus = 'waiting' | 'ready' | 'running' | 'done' | 'failed';

export type TaskEventMap = Record<TaskStatus, []> & {
  data: ['stdout' | 'stderr', string]
};

// Class
export class Task extends EventEmitter<TaskEventMap> {
  // Attributes
  private _status: TaskStatus = 'ready';
  private _dependencies: Task[] = [];
  private _process?: ChildProcess;
  private readonly _logger: Logger;

  private readonly _context: TaskContext;

  // Constructor
  constructor(
    readonly cmd: string,
    readonly args: string[] = [],
    readonly opts: TaskOptions = {}
  ) {
    super();
    this._logger = opts.logger || logger;
    this._logger.debug(`${[this.cmd, ...this.args].join(' ')} is ${this._status}`);

    this._context = opts.context || {};
  }

  // Methods
  protected _setStatus(status: TaskStatus): void {
    if (this._status === status) return;

    // Update and emit
    this._status = status;
    this._logger.debug(`${[this.cmd, ...this.args].join(' ')} is ${status}`);
    this.emit(status);
  }

  protected _logStream(stream: 'stdout' | 'stderr', msg: string): void {
    // Get log level
    let level = 'info';

    if (typeof this.opts.streamLogLevel === 'string') {
      level = this.opts.streamLogLevel;
    } else if (typeof this.opts.streamLogLevel === 'object') {
      level = this.opts.streamLogLevel[stream] || level;
    }

    // Log message
    this._logger.log(level, msg.replace(/\n$/, ''));
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
        complexity += dep.complexity(cache) + 1;
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
      windowsHide: true,
      env: {
        FORCE_COLOR: '1',
        ...process.env,
        ...this.opts.env
      }
    });

    this._setStatus('running');

    this._process.stdout?.on('data', (buf: Buffer) => {
      const msg = buf.toString('utf-8');

      this._logStream('stdout', msg);
      this.emit('data', 'stdout', msg);
    });

    this._process.stderr?.on('data', (buf: Buffer) => {
      const msg = buf.toString('utf-8');

      this._logStream('stderr', msg);
      this.emit('data', 'stderr', msg);
    });

    this._process.on('close', (code) => {
      if (code) {
        this._setStatus('failed');
      } else {
        this._setStatus('done');
      }
    });
  }

  async stop(): Promise<void> {
    if (!this._process || this._status !== 'running') {
      return;
    }

    // Kill process
    this._process.kill();

    // Wait for task to end
    await this.waitFor('done', 'failed');
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

  get context(): TaskContext {
    return this._context;
  }
}
