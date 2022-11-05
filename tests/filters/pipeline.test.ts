import { PipelineFilter, Pipeline } from '../../src/filters';
import { TestBed } from '../test-bed';

// Setup
let bed: TestBed;

beforeEach(() => {
  bed = new TestBed();
});

// Tests
describe('Pipeline.filter', () => {
  it('should call filter', async () => {
    const wks = bed.workspace('wks');
    const filter: PipelineFilter = {
      test: jest.fn(),
    };

    const pipeline = new Pipeline();
    pipeline.add(filter);

    await expect(pipeline.filter([wks])).toYield([]);

    expect(filter.test).toHaveBeenCalledWith(wks);
  });

  it('should keep only filtered workspaces', async () => {
    const wks1 = bed.workspace('wks1');
    const wks2 = bed.workspace('wks2');
    const wks3 = bed.workspace('wks3');

    const pipeline = new Pipeline();
    pipeline.add({ test: (wks) => wks.name === 'wks2' });

    await expect(pipeline.filter([wks1, wks2, wks3]))
      .toYield([wks2]);
  });
});
