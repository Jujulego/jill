import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';

import { Task, TaskEventMap } from './task';
import { TaskOptions } from '../task';

// Types
export type SpawnTaskStream = 'stdout' | 'stderr';

export interface SpawnTaskOption extends TaskOptions {
  cwd?: string;
  env?: Partial<Record<string, string>>;
  streamLogLevel?: string | Partial<Record<SpawnTaskStream, string>>;
}

export interface SpawnTaskEventMap extends TaskEventMap {
  data: [SpawnTaskStream, string]
}

// Class
export class SpawnTask extends Task {
  // Attributes
  private _process?: ChildProcess;
  private readonly _streamLogLevel: Record<SpawnTaskStream, string> = {
    stdout: 'info',
    stderr: 'info',
  };

  readonly cwd: string;
  readonly env: Partial<Record<string, string>>;

  // Constructor
  constructor(
    readonly cmd: string,
    readonly args: ReadonlyArray<string> = [],
    opts: SpawnTaskOption = {}
  ) {
    super(opts);

    // Parse options
    this.cwd = opts.cwd ?? process.cwd();
    this.env = opts.env || {};

    if (typeof opts.streamLogLevel === 'object') {
      Object.assign(this._streamLogLevel, opts.streamLogLevel);
    } else if (typeof opts.streamLogLevel === 'string') {
      this._streamLogLevel.stdout = opts.streamLogLevel;
      this._streamLogLevel.stderr = opts.streamLogLevel;
    }
  }

  // Methods
  protected _start(): void {
  }

  protected _stop(): void {
  }

  // Properties
  get name(): string {
    return [this.cmd, ...this.args].join(' ');
  }
}