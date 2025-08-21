import { SpawnTask, type SpawnTaskOptions, type TaskContext } from '@jujulego/tasks';
import { inject$ } from '@kyrielle/injector';
import { collect$, map$, once$, pipe$, waitFor$ } from 'kyrielle';
import { LOGGER, TASK_MANAGER } from '../../tokens.js';
import { instrument } from '../../utils/sentry.js';
import { streamLines$ } from '../../utils/streams.js';
import type { TaskUIContext } from '../../utils/types.js';

export class GitService {
  // Attributes
  private readonly _manager = inject$(TASK_MANAGER);
  private readonly _logger = inject$(LOGGER);

  // Methods
  /**
   * Runs a git command inside a SpawnTask
   *
   * @param cmd
   * @param args
   * @param options
   */
  async command(cmd: string, args: string[], options: SpawnTaskOptions = {}): Promise<SpawnTask<GitContext>> {
    const opts = { logger: this._logger, ...options };

    // Create task
    const task = new SpawnTask('git', [cmd, ...args], { command: cmd, hidden: true }, opts);
    task.events$.on('stream', ({ data }) => opts.logger.debug(data.toString('utf-8')));

    (await this._manager).add(task);

    return task;
  }

  /**
   * Runs git branch
   *
   * @param args
   * @param options
   */
  branch(args: string[], options?: SpawnTaskOptions): Promise<SpawnTask<GitContext>> {
    return this.command('branch', args, options);
  }

  /**
   * Runs git diff
   *
   * @param args
   * @param options
   */
  diff(args: string[], options?: SpawnTaskOptions): Promise<SpawnTask<GitContext>> {
    return this.command('diff', args, options);
  }

  /**
   * Runs git tag
   *
   * @param args
   * @param options
   */
  tag(args: string[], options?: SpawnTaskOptions): Promise<SpawnTask<GitContext>> {
    return this.command('tag', args, options);
  }

  /**
   * Uses git diff to detect if given files have been affected since given reference
   *
   * @param reference
   * @param files
   * @param opts
   */
  @instrument('GitService.isAffected')
  async isAffected(reference: string, files: string[] = [], opts?: SpawnTaskOptions): Promise<boolean> {
    const task = await this.diff(['--quiet', reference, '--', ...files], opts);

    return new Promise((resolve, reject) => {
      once$(task.events$, 'status.done', () => resolve(false));
      once$(task.events$, 'status.failed', () => {
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
  @instrument('GitService.listBranches')
  async listBranches(args: string[] = [], opts?: SpawnTaskOptions): Promise<string[]> {
    const task = await this.branch(['-l', ...args], opts);

    return waitFor$(pipe$(
      streamLines$(task),
      map$((line) => line.replace(/^[ *] /, '')),
      collect$()
    ));
  }

  /**
   * List git tags
   *
   * @param args
   * @param opts
   */
  @instrument('GitService.listTags')
  async listTags(args: string[] = [], opts?: SpawnTaskOptions): Promise<string[]> {
    const task = await this.tag(['-l', ...args], opts);

    return waitFor$(pipe$(streamLines$(task), collect$()));
  }
}

// Types
export interface GitContext extends TaskContext, TaskUIContext {
  command: string;
}
