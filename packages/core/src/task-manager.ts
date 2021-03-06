import os from 'os';

import { EventEmitter } from './event-emitter';
import { logger } from './logger';
import { Task } from './tasks';

// Types
export type TaskManagerEventMap = {
  started: [Task];
  completed: [Task];
}

// Class
export class TaskManager extends EventEmitter<TaskManagerEventMap> {
  // Attributes
  private readonly _tasks: Task[] = [];
  private readonly _index = new Set<Task>();
  private readonly _running = new Set<Task>();

  // Constructor
  constructor(
    readonly jobs = os.cpus().length
  ) {
    super();
    logger.verbose(`Run up to ${jobs} tasks at the same time`);
  }

  // Statics
  private static _instance?: TaskManager;

  static get global(): TaskManager {
    if (!this._instance) {
      this._instance = new TaskManager();
    }

    return this._instance;
  }

  // Methods
  private _sortByComplexity() {
    const cache = new Map<Task, number>();
    this._tasks.sort((a, b) => a.complexity(cache) - b.complexity(cache));
  }

  private _add(task: Task) {
    if (this._index.has(task)) return;

    // Add task and it's dependencies
    this._tasks.push(task);
    this._index.add(task);

    for (const t of task.dependencies) {
      this._add(t);
    }
  }

  private _startNext(previous?: Task) {
    // Emit completed for previous task
    if (previous) {
      this._running.delete(previous);
      this.emit('completed', previous);
    }

    // Start other tasks
    for (const t of this._tasks) {
      if (this._running.size >= this.jobs) {
        break;
      }

      if (t.status === 'ready') {
        this._running.add(t);

        t.on('done', () => this._startNext(t));
        t.on('failed', () => this._startNext(t));

        t.start();
        this.emit('started', t);
      }
    }
  }

  add(task: Task): void {
    this._add(task);
    this._sortByComplexity();
    this._startNext();
  }

  // Properties
  get tasks(): Task[] {
    return this._tasks;
  }
}
