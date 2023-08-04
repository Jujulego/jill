import type { ExpectationResult, MatcherState } from '@vitest/expect';

// Matcher
export function toEqualLines(this: MatcherState, received: unknown, expected: unknown[]): ExpectationResult {
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
declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Assertion<T = any> {
    toEqualLines(expected: unknown[]): T;
  }
}
