// Enum
export enum SpawnTaskMode {
  /** Managed by myr */
  AUTO    = 'AUTO',

  /** Managed by the client */
  MANAGED = 'MANAGED',
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
