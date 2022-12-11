import { point } from '@jujulego/2d-maths';
import stream from 'node:stream';

// Constants
export const ESC = '\x1b';

// Types
type Callback = (error?: (Error | null)) => void;

// Class
export class InkScreen extends stream.Writable {
  // Attributes
  private _cursor = point(0, 0);
  private readonly _screen: string[] = [];

  // Methods
  override _write(chunk: Buffer, encoding: BufferEncoding, done: Callback) {
    const lines = chunk.toString().split('\n');

    for (let i = 0; i < lines.length; i++){
      this._parse(lines[i]);

      if (i < lines.length - 1) {
        this._cursor.y += 1;
      }
    }

    done();
  }

  private _parse(txt: string) {
    let idx = txt.indexOf(ESC);

    while (idx !== -1) {
      let parsed = false;

      // Text before escape code
      if (idx > 0) {
        this._print(txt.slice(0, idx));
        txt = txt.slice(idx);
      }

      // parse escape codes
      // - empty current line
      if (txt.startsWith(`${ESC}[2K`)) {
        this._screen[this._cursor.y] = '';
        txt = txt.slice(4);
        parsed = true;
      }

      // - move cursor
      const move = txt.match(new RegExp(`^${ESC}\\[([0-9]*)([ABCDEFG])`));

      if (move) {
        const val = parseInt(move[1] || '0', 10);

        switch (move[2]) {
          case 'A':
            this._cursor.y -= val;
            break;

          case 'B':
            this._cursor.y += val;
            break;

          case 'C':
            this._cursor.x += val;
            break;

          case 'D':
            this._cursor.x -= val;
            break;

          case 'E':
            this._cursor.x = 0;
            this._cursor.y += val + 1;
            break;

          case 'F':
            this._cursor.x = 0;
            this._cursor.y -= val + 1;
            break;

          case 'G':
            this._cursor.x = val;
        }

        this._cursor.y = Math.max(this._cursor.y, 0);
        this._cursor.x = Math.max(this._cursor.x, 0);

        txt = txt.slice(3 + move[1].length);
        parsed = true;
      }

      idx = txt.indexOf(ESC, parsed ? 0 : 1);
    }

    if (txt.length > 0) {
      this._print(txt);
    }
  }

  private _print(txt: string) {
    while (this._screen.length <= this._cursor.y) {
      this._screen.push('');
    }

    const line = this._screen[this._cursor.y];
    this._screen[this._cursor.y] = line.slice(0, this._cursor.x) + txt + line.slice(this._cursor.x + txt.length + 1);
    this._cursor.x += txt.length;
  }

  // Properties
  get screen(): string {
    return this._screen.join('\n').trimEnd();
  }
}
