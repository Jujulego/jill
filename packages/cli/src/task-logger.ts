import { Task, TaskSet } from '@jujulego/tasks';
import { transport } from '@jujulego/jill-common';
import { WorkspaceContext } from '@jujulego/jill-core';

// Types
export type TaskLoggerState = 'spin-multiple' | 'spin-simple' | 'fail' | 'succeed';

// Class
export class TaskLogger {
  // Attributes
  private readonly _running = new Set<Task<WorkspaceContext>>();
  private readonly _formats = {
    'spin-multiple': (count: number) => `Building ${count} workspaces ...`,
    'spin-simple': (tsk: Task<WorkspaceContext>) => `Building ${tsk.context.workspace.name} ...`,
    'fail': (tsk: Task<WorkspaceContext>) => `Failed to build ${tsk.context.workspace.name}`,
    'succeed': (tsk: Task<WorkspaceContext>) => `${tsk.context.workspace.name} built`,
  };

  // Methods
  private _refreshSpinner() {
    if (this._running.size > 1) {
      transport.spin(this._formats['spin-multiple'](this._running.size));
    } else if (this._running.size > 0) {
      const tsk = this._running.values().next().value;
      transport.spin(this._formats['spin-simple'](tsk));
    }
  }

  private _handleStarted(task: Task<WorkspaceContext>) {
    this._running.add(task);

    this._refreshSpinner();
  }

  private _handleCompleted(task: Task<WorkspaceContext>) {
    this._running.delete(task);

    if (task.status === 'failed') {
      transport.fail(this._formats['fail'](task));
    } else {
      transport.succeed(this._formats['succeed'](task));
    }

    this._refreshSpinner();
  }

  connect(set: TaskSet<WorkspaceContext>): void {
    set.subscribe('started', (task) => this._handleStarted(task));
    set.subscribe('completed', (task) => this._handleCompleted(task));
  }

  on(state: 'spin-multiple', format: (count: number) => string): void;
  on(state: 'spin-simple', format: (tsk: Task<WorkspaceContext>) => string): void;
  on(state: 'fail', format: (tsk: Task<WorkspaceContext>) => string): void;
  on(state: 'succeed', format: (tsk: Task<WorkspaceContext>) => string): void;
  on(state: TaskLoggerState, format: (arg: any) => string): void {
    this._formats[state] = format;
  }
}
