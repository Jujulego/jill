import { SpawnTask, SpawnTaskOption, TaskStatus } from '@jujulego/jill-core';

// Methods
export class MockTask extends SpawnTask {
  // Constructor
  constructor(cmd: string, opts?: SpawnTaskOption) {
    super(cmd, [], opts);
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
