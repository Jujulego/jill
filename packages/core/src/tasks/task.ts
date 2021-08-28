import { Logger } from 'winston';

import { EventEmitter } from '../event-emitter';
import { logger } from '../logger';
import { Workspace } from '../workspace';

// Types
export interface TaskContext {
  workspace?: Workspace;
}

export interface TaskOptions {
  context?: TaskContext;
  logger?: Logger;
}

export type TaskStatus = 'waiting' | 'ready' | 'running' | 'done' | 'failed';
export type TaskEventMap = Record<TaskStatus, []>;

// Class
export abstract class Task<M extends TaskEventMap = TaskEventMap> extends EventEmitter<M> {
  // Attributes
  private _status: TaskStatus = 'ready';
  private _dependencies: Task[] = [];

  protected readonly _logger: Logger;
  protected readonly _context: Readonly<TaskContext>;

  // Constructor
  protected constructor(opts: TaskOptions = {}) {
    super();

    this._logger = opts.logger || logger;
    this._context = opts.context || {};
  }

  // Methods
  protected abstract _start(): void;
  protected abstract _stop(): void;

  protected _setStatus(status: TaskStatus): void {
    if (this._status === status) return;

    // Update and emit
    this._status = status;
    this._logger.debug(`${this.name} is ${status}`);
    this.emit(status);
  }

  private _recomputeStatus(): void {
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

  /**
   * Add a dependency to this task.
   * A task will be waiting as long as all it's dependencies aren't done.
   * If a task fails, all tasks that depends on it will also fails without running.
   *
   * @param task the dependency to add
   */
  dependsOn(task: Task): void {
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

  /**
   * Computes task complexity.
   * The task complexity equals to the count of all it's direct and indirect dependencies.
   *
   * @param cache stores all computed complexities, to not recompute complexities while running threw the whole graph.
   */
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

  /**
   * Start the task.
   * The task will be started only if it's status is "ready".
   * In other cases, it will throw an error.
   */
  start(): void {
    if (this._status !== 'ready') {
      throw Error(`Cannot start a ${this._status} task`);
    }

    this._logger.verbose(`Running ${this.name}`);
    this._setStatus('running');
    this._start();
  }

  /**
   * Stop the task.
   * The task will be stopped only if it's status is "running".
   * In other cases, it won't do anything.
   */
  stop(): void {
    if (this._status !== 'running') {
      return;
    }

    this._stop();
  }

  // Properties
  abstract get name(): string;

  get context(): Readonly<TaskContext> {
    return this._context;
  }

  get dependencies(): ReadonlyArray<Task> {
    return this._dependencies;
  }

  get status(): TaskStatus {
    return this._status;
  }

  get completed(): boolean {
    return ['done', 'failed'].includes(this.status);
  }
}