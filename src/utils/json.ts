// Utils
export function printJson(data: unknown, stream: NodeJS.WriteStream = process.stdout): void {
  if (stream.isTTY) { // Pretty print for ttys
    stream.write(JSON.stringify(data, null, 2));
  } else {
    stream.write(JSON.stringify(data));
  }
}
