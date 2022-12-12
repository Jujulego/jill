import { ESC } from '../ink-screen';

// Matcher
export function ignoreColor(this: jest.MatcherContext, received: string, expected: string): jest.CustomMatcherResult {
  const options = {
    comment: 'String matching ignoring style escape codes',
    isNot: this.isNot,
    promise: this.promise,
  };

  received = received.replace(new RegExp(`${ESC}\\[(\\d{1,2};)*\\d{1,2}m`, 'g'), '');

  return {
    pass: this.equals(received, expected),
    message: () => this.utils.matcherHint('ignoreColor', this.utils.printReceived(received), this.utils.printExpected(expected), options)
  };
}

// Typings
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Expect {
      ignoreColor(str: string): unknown;
    }
    interface InverseAsymmetricMatchers {
      ignoreColor(str: string): unknown;
    }
  }
}
