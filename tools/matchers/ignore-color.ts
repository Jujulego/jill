import type { ExpectationResult, MatcherState } from '@vitest/expect';

import { noColor } from '@/tools/utils';

// Matcher
export function ignoreColor(this: MatcherState, received: string, expected: unknown): ExpectationResult {
  const options = {
    comment: 'String matching ignoring style escape codes',
    isNot: this.isNot,
    promise: this.promise,
  };

  received = noColor(received);

  let pass: boolean;

  if (expected instanceof RegExp) {
    pass = !!received.match(expected);
  } else if (typeof expected === 'string') {
    pass = this.equals(received, noColor(expected));
  } else {
    pass = this.equals(received, expected);
  }

  return {
    pass,
    message: () => this.utils.matcherHint('ignoreColor', this.utils.printReceived(received), this.utils.printExpected(expected), options)
  };
}

// Typings
declare module 'vitest' {
  interface AsymmetricMatchersContaining {
    ignoreColor(str: unknown): unknown;
  }
}
