import { Task, TaskOptions } from '../task';

// Class
export class GitTask extends Task {
  // Constructor
  constructor(cmd: string, args: string[] = [], opts: TaskOptions = {}) {
    // Set default log level
    if (typeof opts.streamLogLevel === 'object') {
      opts.streamLogLevel.stdout = opts.streamLogLevel.stdout || 'debug';
      opts.streamLogLevel.stderr = opts.streamLogLevel.stderr || 'warn';
    } else if (!opts.streamLogLevel) {
      opts.streamLogLevel = { stdout: 'debug', stderr: 'warn' };
    }

    super('git', [cmd, ...args], opts);
  }
}