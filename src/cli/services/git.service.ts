import { isWorkloadEnded, spawn$, type SpawnJob$, type SpawnProps, type TaskContext } from '@jujulego/tasks';
import { inject$ } from '@kyrielle/injector';
import type { Logger } from '@kyrielle/logger';
import { filter$, pipe$, waitFor$ } from 'kyrielle';
import os from 'node:os';
import { text } from 'node:stream/consumers';
import { LOGGER, SCHEDULER } from '../../tokens.js';
import { instrument } from '../../utils/sentry.js';
import type { TaskUIContext } from '../../utils/types.js';

export class GitService {
  // Attributes
  private readonly _scheduler = inject$(SCHEDULER);
  private readonly _logger = inject$(LOGGER);

  // Methods
  /**
   * Runs a git command inside
   */
  async command(cmd: string, args: string[], opts: GitOptions = {}): Promise<SpawnJob$> {
    const { logger = this._logger, ...props } = opts;

    // Create job
    const job = spawn$('git', [cmd, ...args], props);
    job.stdout.on('data', (data: Buffer) => logger.debug(data.toString('utf-8').trimEnd()));
    job.stderr.on('data', (data: Buffer) => logger.warn(data.toString('utf-8').trimEnd()));

    (await this._scheduler).register(job);

    return job;
  }

  /**
   * Runs git branch
   */
  branch(args: string[], opts?: GitOptions): Promise<SpawnJob$> {
    return this.command('branch', args, opts);
  }

  /**
   * Runs git diff
   */
  diff(args: string[], opts?: GitOptions): Promise<SpawnJob$> {
    return this.command('diff', args, opts);
  }

  /**
   * Runs git tag
   */
  tag(args: string[], opts?: GitOptions): Promise<SpawnJob$> {
    return this.command('tag', args, opts);
  }

  /**
   * Uses git diff to detect if given files have been affected since given reference
   */
  @instrument('GitService.isAffected')
  async isAffected(reference: string, files: string[] = [], opts?: GitOptions): Promise<boolean> {
    const job = await this.diff(['--quiet', reference, '--', ...files], opts);
    await waitFor$(pipe$(job.state$, filter$(isWorkloadEnded)));

    return !!job.exitCode;
  }

  /**
   * List git branches
   */
  @instrument('GitService.listBranches')
  async listBranches(args: string[] = [], opts?: GitOptions): Promise<string[]> {
    const job = await this.branch(['-l', ...args], opts);
    const output = await text(job.stdout);

    return output.split(os.EOL);
  }

  /**
   * List git tags
   */
  @instrument('GitService.listTags')
  async listTags(args: string[] = [], opts?: GitOptions): Promise<string[]> {
    const job = await this.tag(['-l', ...args], opts);
    const output = await text(job.stdout);

    return output.split(os.EOL);
  }
}

// Types
export interface GitContext extends TaskContext, TaskUIContext {
  command: string;
}

export interface GitOptions extends SpawnProps {
  readonly logger?: Logger;
}
