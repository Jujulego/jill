import type { MatcherState } from '@vitest/expect';
import { vi } from 'vitest';

import { toYield } from './to-yield.js';

// Tests
describe('toYield', () => {
  it('should compare to all generated data', async () => {
    const context = {
      isNot: false,
      promise: false,
      equals: vi.fn().mockReturnValue(true),
    } as unknown as MatcherState;

    const generator = (async function* () {
      yield 'toto';
      yield 'tata';
    })();

    await expect(toYield.call(context, generator, ['toto', 'tata']))
      .resolves.toMatchObject({
        pass: true
      });

    expect(context.equals).toHaveBeenCalledWith(['toto', 'tata'], ['toto', 'tata']);
  });
});
