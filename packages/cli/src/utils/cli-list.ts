import chalk from 'chalk';

// Class
export class CliList {
  // Attributes
  private _headers?: string[];
  private readonly _data: string[][] = [];
  private readonly _columns: number[] = [];

  // Methods
  private _updateColumns(data: string[]): void {
    // Add missing columns
    while (data.length > this._columns.length) {
      this._columns.push(0);
    }

    // Update columns
    for (let i = 0; i < data.length; ++i) {
      this._columns[i] = Math.max(this._columns[i], data[i].length);
    }
  }

  private _formatValue(value: string, idx: number): string {
    return value + ' '.repeat(this._columns[idx] - value.length);
  }
  
  setHeaders(...headers: string[]): void {
    this._updateColumns(headers);
    this._headers = headers;
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