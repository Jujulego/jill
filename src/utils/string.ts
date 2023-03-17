// Types
export interface CommandLine {
  command: string;
  args: string[];
}

// Utils
export function capitalize(txt: string): string {
  return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
}

export function splitCommandLine(line: string): CommandLine {
  line = line.trim();

  const parts: string[] = [];
  let current_cote = '';
  let last = 0;

  for (let i = 1; i < line.length; ++i) {
    const c = line[i];

    if (current_cote) {
      if (c === current_cote) {
        current_cote = '';
      }
    } else {
      if (['"', '\''].includes(c)) {
        current_cote = c;
      } else if (c === ' ') {
        parts.push(line.slice(last, i));

        last = i + 1;
      }
    }
  }

  parts.push(line.slice(last));

  const [command, ...args] = parts;
  return { command, args };
}
