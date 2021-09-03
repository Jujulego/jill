import { EventEmitter } from '../src';

beforeEach(() => {
  jest.resetAllMocks();
});

// Test suites
describe('EventEmitter.waitFor', () => {
  it('should resolve when event is emitted', async () => {
    const emm = new EventEmitter<Record<'test', [number]>>();

    const prom = emm.waitFor('test');
    emm.emit('test', 5);

    await expect(prom).resolves.toEqual([5]);
  });

  it('should resolve when first event is emitted', async () => {
    const emm = new EventEmitter<Record<'test1' | 'test2', [number]>>();

    // should resolve with 1
    const prom = emm.waitFor('test1', 'test2');
    emm.emit('test1', 1);
    emm.emit('test2', 2);

    await expect(prom).resolves.toEqual([1]);
  });
});