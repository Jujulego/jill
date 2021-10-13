import { Task, TaskManager } from '@jujulego/jill-core';

import { logger } from './logger';

// Types
export type TaskLoggerState = 'spin-multiple' | 'spin-simple' | 'fail' | 'succeed';

// Class
export class TaskLogger {
  // Attributes
  private readonly _running = new Set<Task>();
  private readonly _formats = {
    'spin-multiple': (count: number) => `Building ${count} workspaces ...`,
    'spin-simple': (tsk: Task) => `Building ${tsk.context.workspace?.name} ...`,
    'fail': (tsk: Task) => `Failed to build ${tsk.context.workspace?.name}`,
    'succeed': (tsk: Task) => `${tsk.context.workspace?.name} built`,
  };

  // Methods
  private _refreshSpinner() {
    if (this._running.size > 1) {
      logger.spin(this._formats['spin-multiple'](this._running.size));
    } else if (this._running.size > 0) {
      const tsk = this._running.values().next().value;
      logger.spin(this._formats['spin-simple'](tsk));
    }
  }

  private _handleStarted(task: Task) {
    this._running.add(task);

    this._refreshSpinner();
  }

  private _handleCompleted(task: Task) {
    this._running.delete(task);

    if (task.status === 'failed') {
      logger.fail(this._formats['fail'](task));
    } else {
      logger.succeed(this._formats['succeed'](task));
    }

    this._refreshSpinner();
  }

  connect(manager: TaskManager): void {
    manager.on('started', (task) => this._handleStarted(task));
    manager.on('completed', (task) => this._handleCompleted(task));
  }

  on(state: 'spin-multiple', format: (count: number) => string): void;
  on(state: 'spin-simple', format: (tsk: Task) => string): void;
  on(state: 'fail', format: (tsk: Task) => string): void;
  on(state: 'succeed', format: (tsk: Task) => string): void;
  on(state: TaskLoggerState, format: (arg: never) => string): void {
    this._formats[state] = format;
  }
}
