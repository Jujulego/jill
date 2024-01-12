import '@/src/commons/logger.service.js';
import { PrivateFilter } from '@/src/filters/private.filter.js';

import { TestBed } from '@/tools/test-bed.js';

// Setup
let bed: TestBed;

beforeEach(() => {
  bed = new TestBed();
});

// Tests
describe('PrivateFilter (value = true)', () => {
  it('should return false by default (public by default)', () => {
    const filter = new PrivateFilter(true);
    const wks = bed.addWorkspace('wks-1');

    expect(filter.test(wks)).toBe(false);
  });

  it('should return true if workspace is private', () => {
    const filter = new PrivateFilter(true);
    const wks = bed.addWorkspace('wks-1', { private: true });

    expect(filter.test(wks)).toBe(true);
  });

  it('should return false only if workspace is explicitly public', () => {
    const filter = new PrivateFilter(true);
    const wks = bed.addWorkspace('wks-1', { private: false });

    expect(filter.test(wks)).toBe(false);
  });
});

describe('PrivateFilter (value = false)', () => {
  it('should return true by default (public by default)', () => {
    const filter = new PrivateFilter(false);
    const wks = bed.addWorkspace('wks-1');

    expect(filter.test(wks)).toBe(true);
  });

  it('should return false if workspace is private', () => {
    const filter = new PrivateFilter(false);
    const wks = bed.addWorkspace('wks-1', { private: true });

    expect(filter.test(wks)).toBe(false);
  });

  it('should return true only if workspace is explicitly public', () => {
    const filter = new PrivateFilter(false);
    const wks = bed.addWorkspace('wks-1', { private: false });

    expect(filter.test(wks)).toBe(true);
  });
});
