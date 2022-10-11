import { container, GLOBAL_CONFIG, GlobalConfig } from '../src/services/inversify.config';

// Setup global config
container.bind<GlobalConfig>(GLOBAL_CONFIG)
  .toConstantValue({ verbose: 0, jobs: 1 });

// Add custom matchers
expect.extend({
  async toYield(received: any, expected: any[]) {
    const options = {
      comment: 'Yielded values',
      isNot: this.isNot,
      promise: this.promise,
    };

    const results: any[] = [];

    for await (const res of received) {
      results.push(res);
    }

    return {
      pass: this.equals(results, expected),
      message: () => this.utils.matcherHint(
        'toYield',
        this.utils.printReceived(results),
        this.utils.printExpected(expected),
        options,
      )
    };
  }
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toYield(expected: any[]): Promise<R>
    }
  }
}
