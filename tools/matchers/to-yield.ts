// Matcher
export async function toYield(this: jest.MatcherContext, received: AsyncIterable<unknown>, expected: unknown[]) {
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

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toYield(expected: any[]): Promise<R>;
    }
  }
}
