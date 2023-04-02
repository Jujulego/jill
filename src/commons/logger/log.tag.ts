import path from 'node:path';

// Types
type Formatter = (arg: string) => string;

// Commands
const COMMANDS: Record<string, Formatter> = {
  'cwd': (arg) => path.relative(process.cwd(), arg) || '.'
};

// Tag
export function $log(strings: TemplateStringsArray, ...args: unknown[]): string {
  let result = strings[0];

  for (let i = 0; i < args.length; ++i) {
    let arg = '' + args[i];

    // Check for commands
    const match = result.match(/#([a-z]+):$/);
    const command = match && COMMANDS[match[1]];

    if (command) {
      result = result.slice(0, result.length - match[0].length);
      arg = command(arg);
    }

    result += arg + strings[i + 1];
  }

  return result;
}
