import os from 'os';

import { EventEmitter } from './event-emitter';
import { logger } from './logger';
import { Task } from './task';

// Types
export type TaskEvent = 'started' | 'completed';

// Class
export class TaskManager extends EventEmitter<Record<TaskEvent, [Task]>> {
  // Attributes
  private readonly _tasks: Task[] = [];
  private readonly _index = new Set<Task>();
  private readonly _running = new Set<Task>();

  // Constructor
  constructor(
    readonly jobs: number = os.cpus().length
  ) {
    super();
    logger.verbose(`Run up to ${jobs} tasks at the same time`);
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
    if (previous) {
      this._running.delete(previous);
      this.emit('completed', previous);
    }

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
  }

  start(): void {
    this._startNext();
  }

  // Properties
  get tasks(): Task[] {
    return this._tasks;
  }
}