// Matcher
export function toMatchLines(this: jest.MatcherContext, received: unknown, expected: unknown[]) {
  try {
    const options = {
      isNot: this.isNot,
      promise: this.promise,
    };

    let pass = true;
    const lines = typeof received === 'string' ? received.split('\n') : (received as string[]);

    if (lines.length !== expected.length) {
      pass = false;
    } else {
      for (let i = 0; i < lines.length; ++i) {
        const exp = expected[i];

        if (exp instanceof RegExp) {
          pass = !!lines[i].match(exp);
        } else {
          pass = this.equals(lines[i], exp);
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
}

// Typings
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toMatchLines(expected: (unknown | RegExp)[]): R;
    }
  }
}
