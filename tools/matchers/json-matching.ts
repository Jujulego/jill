import type { ExpectationResult, MatcherState } from '@vitest/expect';

// Matcher
export function jsonMatching(this: MatcherState, received: string, expected: unknown): ExpectationResult {
  const options = {
    comment: 'JSON matching',
    isNot: this.isNot,
    promise: this.promise,
  };

  const parse = (received: string): unknown => {
    try {
      return JSON.parse(received);
    } catch (err) {
      throw new Error(`${this.utils.printReceived(received)} value must be a valid json string: ${err.message}`);
    }
  };

  return {
    pass: this.equals(parse(received), expected),
    message: () => this.utils.matcherHint('jsonMatching', this.utils.printReceived(received), this.utils.printExpected(expected), options)
  };
}

// Typings
declare module 'vitest' {
  interface AsymmetricMatchersContaining {
    jsonMatching(obj: unknown): unknown;
  }
}
