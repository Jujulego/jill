// Enum
export enum SpawnTaskMode {
  /** Managed by myr */
  AUTO    = 'auto',

  /** Managed by the client */
  MANAGED = 'managed',
}

// Model
export interface ISpawnTaskArgs {
  // Attributes
  cwd: string;
  cmd: string;
  args: readonly string[];
  mode?: SpawnTaskMode;
  watchOn?: readonly string[];
}
