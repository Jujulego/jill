import { ignoreColor, jsonMatching, toEqualLines } from './matchers';

// Add custom matchers
expect.extend({
  ignoreColor,
  jsonMatching,
  toEqualLines,
  toMatchLines(received: any, expected: (string | RegExp)[]) {
    try {
      const options = {
        isNot: this.isNot,
        promise: this.promise,
      };

      let pass = true;
      const lines = typeof received === 'string' ? received.split('\n') : received;

      if (lines.length !== expected.length) {
        pass = false;
      } else {
        for (let i = 0; i < lines.length; ++i) {
          const exp = expected[i];

          if (typeof exp === 'string') {
            pass = this.equals(lines[i], exp);
          } else {
            pass = !!lines[i].match(exp);
          }

          if (!pass) {
            break;
          }
        }
      }

      return {
        pass,
        message: () => this.utils.matcherHint(
          'toMatchLines',
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
    interface Matchers<R> {
      toMatchLines(expected: (string | RegExp)[]): R;
      toYield(expected: any[]): Promise<R>;
    }
  }
}
