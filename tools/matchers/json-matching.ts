// Matcher
export function jsonMatching(this: jest.MatcherContext, received: string, expected: unknown): jest.CustomMatcherResult {
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
}

// Typings
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Expect {
      jsonMatching(obj: unknown): unknown;
    }
    interface InverseAsymmetricMatchers {
      jsonMatching(obj: unknown): unknown;
    }
  }
}
