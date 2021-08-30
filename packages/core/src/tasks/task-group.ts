import { Logger } from 'winston';

import { EventEmitter } from '../event-emitter';
import { TaskManager } from '../task-manager';
import { logger } from '../logger';
import { Task } from './task';

// Types
export interface TaskGroupOptions {
  logger?: Logger;
  manager?: TaskManager;
}

export type TaskGroupStatus = 'created' | 'started' | 'waiting' | 'done' | 'failed';
export type TaskGroupEventMap = Record<TaskGroupStatus, []> & {
  start: [Task];
  finished: [Task];
};

// Class
export abstract class TaskGroup extends EventEmitter<TaskGroupEventMap> {
  // Attributes
  private _status: TaskGroupStatus = 'created';
  private readonly _tasks = new Set<Task>();

  protected readonly _logger: Logger;
  protected readonly _manager: TaskManager;

  // Constructor
  protected constructor(opts: TaskGroupOptions = {}) {
    super();

    this._logger = opts.logger || logger;
    this._manager = opts.manager || TaskManager.global;
  }

  // Methods
  protected _setStatus(status: TaskGroupStatus): void {
    if (this._status === status) return;

    // Update and emit
    this._status = status;
    this._logger.debug(`${this.name} is ${status}`);
    this.emit(status);
  }

  add(task: Task): void {
    if (this._status !== 'created') {
      throw new Error(`Cannot add task to a ${this._status} task group`);
    }

    this._tasks.add(task);
  }

  // Properties
  abstract get name(): string;

  get tasks(): IterableIterator<Task> {
    return this._tasks.values();
  }
}