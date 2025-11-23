import { inject$ } from '@kyrielle/injector';
import { type Logger, LogLevel } from '@kyrielle/logger';
import { isWorkloadEnded, spawn$, type SpawnJob$, type SpawnProps } from '@kyrielle/workload';
import { collect$, filter$, map$, pipe$, waitFor$ } from 'kyrielle';
import { text } from 'node:stream/consumers';
import { ClientError } from '../errors.js';
import { LOGGER, SCHEDULER } from '../tokens.js';
import { instrument } from '../utils/sentry.js';
import { logStreamedLines } from '../utils/streams.js';

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
    job.stdout.pipe(logStreamedLines(logger, LogLevel.debug));
    job.stderr.pipe(logStreamedLines(logger, LogLevel.warning));

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

    if (job.exitCode() === 0) {
      return false;
    }

    if (job.exitCode() === 1) {
      return true;
    }

    throw new ClientError(`Error "git diff" command failed (exit code ${job.exitCode()})`);
  }

  /**
   * List git branches
   */
  @instrument('GitService.listBranches')
  async listBranches(args: string[] = [], opts?: GitOptions): Promise<string[]> {
    const job = await this.branch(['-l', ...args], opts);
    const output = await text(job.stdout);

    return pipe$(
      output.split(/\r?\n/),
      map$((line) => line.replace(/^[ *] /, '')),
      filter$((line) => !!line),
      collect$(),
    );
  }

  /**
   * List git tags
   */
  @instrument('GitService.listTags')
  async listTags(args: string[] = [], opts?: GitOptions): Promise<string[]> {
    const job = await this.tag(['-l', ...args], opts);
    const output = await text(job.stdout);

    return output.split(/\r?\n/)
      .filter((line) => !!line);
  }
}

// Types
export interface GitOptions extends SpawnProps {
  readonly logger?: Logger;
}
