import { EventEmitter } from 'events';
import os from 'os';

import { Task } from './task';

// Types
export type TaskEvent = 'started' | 'completed';
export type TaskEventListener = (task: Task) => void;

// Class
export class TaskManager extends EventEmitter {
  // Attributes
  private readonly _tasks: Task[] = [];
  private readonly _index = new Set<Task>();
  private readonly _running = new Set<Task>();

  // Constructor
  constructor(
    readonly jobs: number = os.cpus().length
  ) { super(); }

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

// Enforce EventEmitter types
export declare interface TaskManager {
  addListener(event: TaskEvent, listener: TaskEventListener): this;
  removeListener(event: TaskEvent, listener: TaskEventListener): this;
  removeAllListeners(event?: TaskEvent): this;
  on(event: TaskEvent, listener: TaskEventListener): this;
  once(event: TaskEvent, listener: TaskEventListener): this;
  off(event: TaskEvent, listener: TaskEventListener): this;
  listenerCount(event: TaskEvent): number;
  listeners(event: TaskEvent): TaskEventListener[];
  rawListeners(event: TaskEvent): TaskEventListener[];
  emit(event: TaskEvent, ...args: Parameters<TaskEventListener>): boolean;
  prependListener(event: TaskEvent, listener: TaskEventListener): this;
  prependOnceListener(event: TaskEvent, listener: TaskEventListener): this;
  eventNames(): TaskEvent[];
}
