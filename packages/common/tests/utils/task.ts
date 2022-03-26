import { Task, TaskContext, TaskOptions, TaskStatus } from '@jujulego/jill-core';

// Class
export class TestTask extends Task {
  // Constructor
  constructor(readonly name: string, opts: TaskOptions = { context: {} }) {
    super(opts);
  }

  // Methods
  _setContext(ctx: TaskContext): void {
    Object.assign(this._context, ctx);
  }

  _setStatus(status: TaskStatus): void {
    super._setStatus(status);
  }

  _start(): void {
    return;
  }

  _stop(): void {
    return;
  }
}
