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
});