// Class
export class CliList {
  // Attributes
  private readonly _data: string[][] = [];
  private readonly _columns: number[] = [];

  // Methods
  add(data: string[]): void {
    // Add missing columns
    while (data.length > this._columns.length) {
      this._columns.push(0);
    }

    // Update columns
    for (let i = 0; i < data.length; ++i) {
      this._columns[i] = Math.max(this._columns[i], data[i].length);
    }

    this._data.push(data);
  }

  *lines(): Generator<string, void> {
    for (const data of this._data) {
      yield data.map((v, i) => v + ' '.repeat(this._columns[i] - v.length))
        .join('  ');
    }
  }

  // Properties
  get columns(): number[] {
    return this._columns;
  }

  get data(): string[][] {
    return this._data;
  }
}