import { Task, TaskOptions, TaskStatus, SpawnTask } from '../../src';

// Class
export class TestTask extends Task {
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

export class TestSpawnTask extends SpawnTask {
  // Methods
  _setStatus(status: TaskStatus): void {
    super._setStatus(status);
  }

  _setExitCode(code: number): void {
    this._exitCode = code;
    this._setStatus(code === 0 ? 'done' : 'failed');
  }

  _start(): void {
    return;
  }

  _stop(): void {
    return;
  }
}