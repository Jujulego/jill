import { Repeater } from '@repeaterjs/repeater';
import { spawn, ChildProcess } from 'child_process';

import { Task, TaskEventMap, TaskOptions } from './task';

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

// Exceptions
export class SpawnTaskFailed extends Error {
  // Constructor
  constructor(task: SpawnTask) {
    super(`Task ${task.name} failed with code ${task.exitCode}`);
  }
}

// Class
export class SpawnTask extends Task<SpawnTaskEventMap> {
  // Attributes
  private _process?: ChildProcess;
  private _exitCode: number | null = null;
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
  private _logStream(stream: 'stdout' | 'stderr', msg: string): void {
    // Log message
    this._logger.log(this._streamLogLevel[stream], msg.replace(/\n$/, ''));
  }

  protected _start(): void {
    this._process = spawn(this.cmd, this.args, {
      cwd: this.cwd,
      shell: true,
      stdio: 'pipe',
      windowsHide: true,
      env: {
        FORCE_COLOR: '1',
        ...process.env,
        ...this.env
      }
    });

    this._process.stdout?.on('data', (buf: Buffer) => {
      const msg = buf.toString('utf-8');

      this._logStream('stdout', msg);
      this.emit('data', 'stdout', msg);
    });

    this._process.stderr?.on('data', (buf: Buffer) => {
      const msg = buf.toString('utf-8');

      this._logStream('stderr', msg);
      this.emit('data', 'stderr', msg);
    });

    this._process.on('close', (code) => {
      this._exitCode = code;

      if (code) {
        this._setStatus('failed');
      } else {
        this._setStatus('done');
      }
    });
  }

  protected _stop(): void {
    this._process?.kill();
  }

  streams(): Repeater<SpawnTaskEventMap['data'], void> {
    return new Repeater(async (push, stop) => {
      // Listening
      function listenData(...args: SpawnTaskEventMap['data']) {
        push(args);
      }

      function fail() {
        stop(new SpawnTaskFailed(this));
      }

      this.on('data', listenData);
      this.on('done', stop);
      this.on('failed', fail);

      // Clean up
      await stop;
      this.off('data', listenData);
      this.off('done', stop);
      this.off('failed', fail);
    });
  }

  async *stdout(): AsyncGenerator<string, void> {
    for await (const [stream, data] of this.streams()) {
      if (stream === 'stdout') yield data;
    }
  }

  async *stderr(): AsyncGenerator<string, void> {
    for await (const [stream, data] of this.streams()) {
      if (stream === 'stderr') yield data;
    }
  }

  // Properties
  get name(): string {
    return [this.cmd, ...this.args].join(' ');
  }

  get exitCode(): number | null {
    return this._exitCode;
  }
}