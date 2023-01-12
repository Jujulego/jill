import { noColor } from '@/tools/utils';

// Matcher
export function ignoreColor(this: jest.MatcherContext, received: string, expected: unknown): jest.CustomMatcherResult {
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
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Expect {
      ignoreColor(str: unknown): unknown;
    }
    interface InverseAsymmetricMatchers {
      ignoreColor(str: unknown): unknown;
    }
  }
}
