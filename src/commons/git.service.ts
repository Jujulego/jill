import { SpawnTask, SpawnTaskOptions, TaskContext, TaskManager } from '@jujulego/tasks';
import { inject, injectable } from 'inversify';

import { container } from '@/src/inversify.config';
import { Logger } from '@/src/logger.service';
import { TASK_MANAGER } from '@/src/tasks/task-manager.config';
import { streamLines } from '@/src/utils/streams';

// Types
export interface GitContext extends TaskContext {
  command: string;
}

// Git commands
@injectable()
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
    const task = new SpawnTask('git', [cmd, ...args], { command: cmd }, opts);
    task.subscribe('stream', ({ data }) => opts.logger.debug(data.toString('utf-8')));

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

      task.subscribe('status.done', () => resolve(false));
      task.subscribe('status.failed', () => {
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

container.bind(GitService).toSelf().inSingletonScope();
