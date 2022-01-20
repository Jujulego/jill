// Model
export interface ISpawnTaskArgs {
  // Attributes
  cwd: string;
  cmd: string;
  args: readonly string[];
  watchOn?: readonly string[];
}
