import { once$ } from '@jujulego/event-tree';
import { SpawnTask, type SpawnTaskOptions, TaskContext, type TaskManager } from '@jujulego/tasks';
import { inject } from 'inversify';

import { Logger } from '@/src/commons/logger.service.ts';
import { TASK_MANAGER } from '@/src/tasks/task-manager.config.ts';
import { streamLines } from '@/src/utils/streams.ts';
import { Service } from '@/src/modules/service.ts';
import { TaskUIContext } from '@/src/types.ts';

// Types
export interface GitContext extends TaskContext, TaskUIContext {
  command: string;
}

// Git commands
@Service()
export class GitService {
  // Constructor
  constructor(
    @inject(TASK_MANAGER)
    private readonly manager: TaskManager,
    @inject(Logger)
    private readonly logger: Logger,
  ) {}

  // Methods
  /**
   * Runs a git command inside a SpawnTask
   *
   * @param cmd
   * @param args
   * @param options
   */
  command(cmd: string, args: string[], options: SpawnTaskOptions = {}): SpawnTask<GitContext> {
    const opts = { logger: this.logger, ...options };

    // Create task
    const task = new SpawnTask('git', [cmd, ...args], { command: cmd, hidden: true }, opts);
    task.on('stream', ({ data }) => opts.logger.debug(data.toString('utf-8')));

    this.manager.add(task);

    return task;
  }

  /**
   * Runs git branch
   *
   * @param args
   * @param options
   */
  branch(args: string[], options?: SpawnTaskOptions): SpawnTask<GitContext> {
    return this.command('branch', args, options);
  }

  /**
   * Runs git diff
   *
   * @param args
   * @param options
   */
  diff(args: string[], options?: SpawnTaskOptions): SpawnTask<GitContext> {
    return this.command('diff', args, options);
  }

  /**
   * Runs git tag
   *
   * @param args
   * @param options
   */
  tag(args: string[], options?: SpawnTaskOptions): SpawnTask<GitContext> {
    return this.command('tag', args, options);
  }

  /**
   * Uses git diff to detect if given files have been affected since given reference
   *
   * @param reference
   * @param files
   * @param opts
   */
  isAffected(reference: string, files: string[] = [], opts?: SpawnTaskOptions): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const task = this.diff(['--quiet', reference, '--', ...files], opts);

      once$(task, 'status.done', () => resolve(false));
      once$(task, 'status.failed', () => {
        if (task.exitCode) {
          resolve(true);
        } else {
          reject(new Error(`Task ${task.name} failed`));
        }
      });
    });
  }

  /**
   * List git branches
   *
   * @param args
   * @param opts
   */
  async listBranches(args: string[] = [], opts?: SpawnTaskOptions): Promise<string[]> {
    const task = this.branch(['-l', ...args], opts);
    const result: string[] = [];

    for await (const line of streamLines(task, 'stdout')) {
      result.push(line.replace(/^[ *] /, ''));
    }

    return result;
  }

  /**
   * List git tags
   *
   * @param args
   * @param opts
   */
  async listTags(args: string[] = [], opts?: SpawnTaskOptions): Promise<string[]> {
    const task = this.tag(['-l', ...args], opts);
    const result: string[] = [];

    for await (const line of streamLines(task, 'stdout')) {
      result.push(line);
    }

    return result;
  }
}
