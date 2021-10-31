import { Repeater } from '@repeaterjs/repeater';
import { execFile, ChildProcess } from 'child_process';
import kill from 'tree-kill';

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
  protected _exitCode: number | null = null;
  private readonly _streamLogLevel: Record<SpawnTaskStream, string> = {
    stdout: 'info',
    stderr: 'info',
  };
  private readonly _streamBuffer: Record<SpawnTaskStream, string> = {
    stdout: '',
    stderr: '',
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
  private _streamData(stream: 'stdout' | 'stderr', buf: Buffer): void {
    // Parse message
    this._streamBuffer[stream] += buf.toString('utf-8');

    // Extract messages
    const msgs = this._streamBuffer[stream].split('\n');
    if (msgs.length < 2) return;

    this._streamBuffer[stream] = msgs.pop() || '';

    // Log messages
    this._logger.log(this._streamLogLevel[stream], msgs.join('\n'));

    // Emit event
    for (const line of msgs) {
      this.emit('data', stream, line);
    }
  }

  protected _start(): void {
    this._process = execFile(this.cmd, this.args, {
      cwd: this.cwd,
      shell: true,
      windowsHide: true,
      env: {
        FORCE_COLOR: '1',
        ...process.env,
        ...this.env
      }
    });

    this._process.stdout?.on('data', (buf: Buffer) => {
      this._streamData('stdout', buf);
    });

    this._process.stderr?.on('data', (buf: Buffer) => {
      this._streamData('stderr', buf);
    });

    this._process.on('close', (code, signal) => {
      this._exitCode = code;

      if (code) {
        this._setStatus('failed');
      } else {
        this._setStatus('done');
      }

      if (signal) {
        this._logger.verbose(`${this.name} was ended by signal ${signal}`);
      }
    });

    this._process.on('error', (err) => {
      this._logger.warn(`Error in ${this.name}: ${err.stack || err.message}`);
    });
  }

  protected _stop(): void {
    if (this._process) {
      kill(this._process.pid, (err) => {
        if (err) {
          this._logger.warn(`Failed to kill ${this.name}: ${err.stack || err.message}`);
        } else {
          this._logger.debug(`Killed ${this.name}`);
        }
      });
    }
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