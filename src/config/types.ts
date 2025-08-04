import { type cosmiconfig } from 'cosmiconfig';

// Types
/** @deprecated use Config instead */
export interface IConfig {
  jobs?: number;
  hooks?: boolean;
  plugins?: string[];
  verbose?: 'info' | 'verbose' | 'debug';
}

export type IConfigExplorer = ReturnType<typeof cosmiconfig>;

/**
 * Jill configuration
 */
export interface Config {

  /**
   * Instructs jill to run hook scripts
   * @default true
   */
  readonly hooks: boolean;

  /**
   * Number of allowed parallel tasks, defaults to CPU number - 1.
   */
  readonly jobs: number;

  /**
   * Paths to plugin files.
   */
  readonly plugins: readonly string[];
}
