import chalk from 'chalk';

// Class
export class CliList {
  // Attributes
  private _headers?: string[];
  private readonly _data: string[][] = [];
  private readonly _columns: number[] = [];

  // Methods
  private static _capitalize(txt: string): string {
    return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
  }

  private static _length(txt: string): number {
    return txt.replace(/\033\[[^m]*m/g, '').length;
  }

  private _updateColumns(data: string[]): void {
    // Add missing columns
    while (data.length > this._columns.length) {
      this._columns.push(0);
    }

    // Update columns
    for (let i = 0; i < data.length; ++i) {
      this._columns[i] = Math.max(this._columns[i], CliList._length(data[i]));
    }
  }

  private _formatValue(value: string, idx: number): string {
    return value + ' '.repeat(this._columns[idx] - CliList._length(value));
  }
  
  setHeaders(headers: string[]): void {
    this._updateColumns(headers);
    this._headers = headers.map(CliList._capitalize);
  }
  
  add(data: string[]): void {
    this._updateColumns(data);
    this._data.push(data);
  }

  *lines(): Generator<string, void> {
    if (this._headers) {
      yield this._headers.map((v, i) => chalk.bold(this._formatValue(v, i)))
          .join('  ');
    }

    for (const data of this._data) {
      yield data.map((v, i) => this._formatValue(v, i))
        .join('  ');
    }
  }

  // Properties
  get columns(): number[] {
    return this._columns;
  }

  get headers(): string[] {
    return this._headers || [];
  }

  get data(): string[][] {
    return this._data;
  }
}