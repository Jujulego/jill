import { TaskOptions } from '../task';
import { GitTask } from './git.task';

// Class
export class GitDiffTask extends GitTask {
  // Attributes
  readonly result: string[] = [];

  // Constructor
  constructor(args: string[] = [], opts: TaskOptions = {}) {
    super('diff', args, opts);

    // Listen for result
    this.on('data', (stream, data) => {
      if (stream === 'stdout') {
        this.result.push(data)
      }
    });
  }
}