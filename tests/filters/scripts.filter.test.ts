import '@/src/commons/logger.service.js';
import { ScriptsFilter } from '@/src/filters/scripts.filter.js';
import { TestBed } from '@/tools/test-bed.js';

// Setup
let bed: TestBed;

beforeEach(() => {
  bed = new TestBed();
});

// Tests
describe('Scripts (one script)', () => {
  it('should return false by default (no script by default)', () => {
    const filter = new ScriptsFilter(['test']);
    const wks = bed.addWorkspace('wks-1');

    expect(filter.test(wks)).toBe(false);
  });

  it('should return true if workspace has the script', () => {
    const filter = new ScriptsFilter(['test']);
    const wks = bed.addWorkspace('wks-1', { scripts: { test: 'jest' } });

    expect(filter.test(wks)).toBe(true);
  });

  it('should return false if workspace has not the script', () => {
    const filter = new ScriptsFilter(['test']);
    const wks = bed.addWorkspace('wks-1', { scripts: { lint: 'eslint .' } });

    expect(filter.test(wks)).toBe(false);
  });
});

describe('Scripts (many scripts)', () => {
  it('should return false by default (no script by default)', () => {
    const filter = new ScriptsFilter(['build', 'test', 'start']);
    const wks = bed.addWorkspace('wks-1');

    expect(filter.test(wks)).toBe(false);
  });

  it('should return true if workspace has the script', () => {
    const filter = new ScriptsFilter(['build', 'test', 'start']);
    const wks = bed.addWorkspace('wks-1', { scripts: { test: 'jest' } });

    expect(filter.test(wks)).toBe(true);
  });

  it('should return false if workspace has not the script', () => {
    const filter = new ScriptsFilter(['build', 'test', 'start']);
    const wks = bed.addWorkspace('wks-1', { scripts: { lint: 'eslint .' } });

    expect(filter.test(wks)).toBe(false);
  });
});
