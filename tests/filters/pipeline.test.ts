import { vi } from 'vitest';

import { type PipelineFilter, Pipeline } from '@/src/filters/pipeline.js';
import { TestBed } from '@/tools/test-bed.js';

// Setup
let bed: TestBed;

beforeEach(() => {
  bed = new TestBed();
});

// Tests
describe('Pipeline.filter', () => {
  it('should call filter', async () => {
    const wks = bed.addWorkspace('wks');
    const filter: PipelineFilter = {
      test: vi.fn(),
    };

    const pipeline = new Pipeline();
    pipeline.add(filter);

    await expect(pipeline.filter([wks])).toYield([]);

    expect(filter.test).toHaveBeenCalledWith(wks);
  });

  it('should keep only filtered workspaces', async () => {
    const wks1 = bed.addWorkspace('wks1');
    const wks2 = bed.addWorkspace('wks2');
    const wks3 = bed.addWorkspace('wks3');

    const pipeline = new Pipeline();
    pipeline.add({ test: (wks) => wks.name === 'wks2' });

    await expect(pipeline.filter([wks1, wks2, wks3]))
      .toYield([wks2]);
  });
});
