// Enum
export enum SpawnTaskMode {
  /** Managed by myr */
  auto    = 'auto',

  /** Managed by the client */
  managed = 'managed',
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
