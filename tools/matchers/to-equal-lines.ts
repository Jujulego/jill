// Matcher
export function toEqualLines(this: jest.MatcherContext, received: unknown, expected: unknown[]): jest.CustomMatcherResult {
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
}

// Typings
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toEqualLines(expected: unknown[]): R;
    }
  }
}
