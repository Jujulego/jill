import { ScriptsFilter } from '../../src/filters';
import { TestBed } from '../test-bed';

// Setup
let bed: TestBed;

beforeEach(() => {
  bed = new TestBed();
});

// Tests
describe('Scripts (one script)', () => {
  it('should return false by default (no script by default)', () => {
    const filter = new ScriptsFilter(['test']);

    expect(filter.test(bed.workspace('wks-1'))).toBe(false);
  });

  it('should return true if workspace has the script', () => {
    const filter = new ScriptsFilter(['test']);

    expect(filter.test(bed.workspace('wks-1', { scripts: { test: 'jest' } }))).toBe(true);
  });

  it('should return false if workspace has not the script', () => {
    const filter = new ScriptsFilter(['test']);

    expect(filter.test(bed.workspace('wks-1', { scripts: { lint: 'eslint .' } }))).toBe(false);
  });
});

describe('Scripts (many scripts)', () => {
  it('should return false by default (no script by default)', () => {
    const filter = new ScriptsFilter(['build', 'test', 'start']);

    expect(filter.test(bed.workspace('wks-1'))).toBe(false);
  });

  it('should return true if workspace has the script', () => {
    const filter = new ScriptsFilter(['build', 'test', 'start']);

    expect(filter.test(bed.workspace('wks-1', { scripts: { test: 'jest' } }))).toBe(true);
  });

  it('should return false if workspace has not the script', () => {
    const filter = new ScriptsFilter(['build', 'test', 'start']);

    expect(filter.test(bed.workspace('wks-1', { scripts: { lint: 'eslint .' } }))).toBe(false);
  });
});
