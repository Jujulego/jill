import { Task, TaskOptions, TaskStatus } from '@jujulego/jill-core';

// Methods
export class MockTask extends Task {
  // Constructor
  constructor(readonly name: string, opts?: TaskOptions) {
    super(opts);
  }

  // Methods
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
