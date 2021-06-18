import { Task } from './task';

// Class
export class TaskManager {
  // Attributes
  private readonly _tasks: Task[] = [];
  private readonly _index = new Set<Task>();

  // Methods
  private _add(task: Task) {
    if (this._index.has(task)) return;

    // Add task and it's dependencies
    this._tasks.push(task);
    this._index.add(task);

    for (const t of task.dependencies) {
      this._add(t);
    }
  }

  private _sortByComplexity() {
    const cache = new Map<Task, number>();
    this._tasks.sort((a, b) => a.complexity(cache) - b.complexity(cache));
  }

  add(task: Task): void {
    this._add(task);
    this._sortByComplexity();
  }

  // Properties
  get tasks(): Task[] {
    return this._tasks;
  }
}
