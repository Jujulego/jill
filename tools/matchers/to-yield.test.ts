import { vi } from 'vitest';

import { toYield } from './to-yield';

// Tests
describe('toYield', () => {
  it('should compare to all generated data', async () => {
    const context = {
      isNot: false,
      promise: false,
      equals: vi.fn().mockReturnValue(true),
    };

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
