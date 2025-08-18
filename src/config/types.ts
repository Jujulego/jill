// Types
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
}
