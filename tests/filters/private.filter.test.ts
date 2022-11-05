import { PrivateFilter } from '../../src/filters';
import { TestBed } from '../test-bed';

// Setup
let bed: TestBed;

beforeEach(() => {
  bed = new TestBed();
});

// Tests
describe('PrivateFilter (value = true)', () => {
  it('should return false by default (public by default)', () => {
    const filter = new PrivateFilter(true);

    expect(filter.test(bed.workspace('wks-1'))).toBe(false);
  });

  it('should return true if workspace is private', () => {
    const filter = new PrivateFilter(true);

    expect(filter.test(bed.workspace('wks-1', { private: true }))).toBe(true);
  });

  it('should return false only if workspace is explicitly public', () => {
    const filter = new PrivateFilter(true);

    expect(filter.test(bed.workspace('wks-1', { private: false }))).toBe(false);
  });
});

describe('PrivateFilter (value = false)', () => {
  it('should return true by default (public by default)', () => {
    const filter = new PrivateFilter(false);

    expect(filter.test(bed.workspace('wks-1'))).toBe(true);
  });

  it('should return false if workspace is private', () => {
    const filter = new PrivateFilter(false);

    expect(filter.test(bed.workspace('wks-1', { private: true }))).toBe(false);
  });

  it('should return true only if workspace is explicitly public', () => {
    const filter = new PrivateFilter(false);

    expect(filter.test(bed.workspace('wks-1', { private: false }))).toBe(true);
  });
});
