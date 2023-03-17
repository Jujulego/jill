// Types
export interface CommandLine {
  command: string;
  args: string[];
}

// Utils
export function capitalize(txt: string): string {
  return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
}

function extractPart(line: string, start: number, end: number, cotted: boolean): string {
  if (cotted) {
    start++;
    end--;
  }

  return line.slice(start, end);
}

export function splitCommandLine(line: string): CommandLine {
  line = line.trim();

  const parts: string[] = [];
  let current_cote = '';
  let cotted = false;
  let last = 0;

  for (let i = 1; i < line.length; ++i) {
    const c = line[i];

    if (current_cote) {
      if (c === current_cote) {
        current_cote = '';
        cotted = true;
      }
    } else {
      if (['"', '\''].includes(c)) {
        current_cote = c;
      } else if (c === ' ') {
        parts.push(extractPart(line, last, i, cotted));

        last = i + 1;
        cotted = false;
      }
    }
  }

  parts.push(extractPart(line, last, line.length, cotted));

  const [command, ...args] = parts;
  return { command, args };
}
