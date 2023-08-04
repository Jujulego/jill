import type { MatcherState } from '@vitest/expect';

// Matcher
export async function toYield(this: MatcherState, received: AsyncIterable<unknown>, expected: unknown[]) {
  const options = {
    comment: 'Yielded values',
    isNot: this.isNot,
    promise: this.promise,
  };

  const results: unknown[] = [];

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

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Assertion<T = any> {
    toYield(expected: unknown[]): Promise<T>;
  }
}
