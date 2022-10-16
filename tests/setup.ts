import chalk from 'chalk';

import { container, GLOBAL_CONFIG, GlobalConfig } from '../src/services/inversify.config';

// Chalk config
chalk.level = 0;

// Setup global config
container.bind<GlobalConfig>(GLOBAL_CONFIG)
  .toConstantValue({ verbose: 0, jobs: 1 });

// Add custom matchers
expect.extend({
  jsonMatching(received: string, expected: any) {
    const options = {
      comment: 'JSON matching',
      isNot: this.isNot,
      promise: this.promise,
    };

    const parse = (received: string): unknown => {
      try {
        return JSON.parse(received);
      } catch (err) {
        throw new Error(
          this.utils.matcherErrorMessage(
            this.utils.matcherHint('jsonMatching', undefined, undefined, options),
            `${this.utils.printExpected('received')} value must be a valid json string: ${err.message}`,
            this.utils.printWithType('Received', received, this.utils.printReceived)
          )
        );
      }
    };

    return {
      pass: this.equals(parse(received), expected),
      message: () => this.utils.matcherHint('jsonMatching', this.utils.printReceived(received), this.utils.printExpected(expected), options)
    };
  },
  toEqualLines(received: any, expected: any[]) {
    try {
      const options = {
        isNot: this.isNot,
        promise: this.promise,
      };

      const lines = typeof received === 'string' ? received.split('\n') : received;

      return {
        pass: this.equals(lines, expected),
        message: () => this.utils.matcherHint(
          'toEqualLines',
          this.utils.printReceived(lines),
          this.utils.printExpected(expected),
          options,
        )
      };
    } catch (e) {
      console.error(e);
      throw e;
    }
  },
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
    interface Expect {
      jsonMatching(obj: unknown): unknown;
    }
    interface InverseAsymmetricMatchers {
      jsonMatching(obj: unknown): unknown;
    }
    interface Matchers<R> {
      toEqualLines(expected: any[]): R;
      toYield(expected: any[]): Promise<R>;
    }
  }
}
