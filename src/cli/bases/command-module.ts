import type { Argv, CommandModule } from 'yargs';

export function command<T, U>(module: CommandModule<T, U>) {
  return <V extends T>(parser: Argv<V>) => parser.command(module);
}
