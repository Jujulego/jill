import { Task, TaskStatus } from '@jujulego/jill-core';

// Methods
export class MockTask extends Task {
  // Methods
  setStatus(status: TaskStatus): MockTask {
    this._setStatus(status);
    return this;
  }
}
