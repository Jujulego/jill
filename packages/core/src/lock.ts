// Class
export class AsyncLock {
  // Attributes
  private _promise = Promise.resolve();

  // Methods
  async with<R>(fun: () => Promise<R>): Promise<R> {
    await this._promise;

    // Acquire lock
    let release = () => {}; // eslint-disable-line @typescript-eslint/no-empty-function
    this._promise = new Promise((resolve) => {
      release = resolve;
    });

    // Run secured function
    try {
      return await fun();
    } finally {
      release();
    }
  }
}