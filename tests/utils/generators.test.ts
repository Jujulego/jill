import { combine } from '@/src/utils/generators.js';
import { describe, expect, it } from 'vitest';

// Tests
describe('combine', () => {
  it('should yield all item yielded by given generators in order', async () => {
    const gen1 = async function* () {
      yield 1;
      yield 2;
    };

    const gen2 = async function* () {
      yield* [10, 12];
    };

    await expect(combine(gen1(), gen2()))
      .toYield([1, 2, 10, 12]);
  });
});
