import { vi } from 'vitest';

import { INK_APP } from '@/src/ink.config.js';
import { container } from '@/src/inversify.config.js';
import { SpinnerService, type SpinnerState } from '@/src/commons/spinner.service.js';

// Setup
let service: SpinnerService;
const createInkSpy = vi.fn();
const stateEventSpy = vi.fn<[SpinnerState], void>();

beforeEach(() => {
  container.snapshot();
  container.rebind(INK_APP).toDynamicValue(createInkSpy);
  service = container.get(SpinnerService);

  stateEventSpy.mockReset();
  service.on('state', stateEventSpy);
});

afterEach(() => {
  container.restore();
});

// Tests
describe('SpinnerService.spin', () => {
  it('should update service state and emit an update event', () => {
    service.spin('test');

    expect(service.state).toEqual({
      status: 'spin',
      label: 'test'
    });
    expect(stateEventSpy).toHaveBeenCalledWith({
      status: 'spin',
      label: 'test',
    });
    expect(createInkSpy).toHaveBeenCalled();
  });
});

describe('SpinnerService.success', () => {
  it('should update service state and emit an update event', () => {
    service.success('youhou !');

    expect(service.state).toEqual({
      status: 'success',
      label: 'youhou !'
    });
    expect(stateEventSpy).toHaveBeenCalledWith({
      status: 'success',
      label: 'youhou !',
    });
    expect(createInkSpy).toHaveBeenCalled();
  });
});

describe('SpinnerService.failed', () => {
  it('should update service state and emit an update event', () => {
    service.failed('oooooh ...');

    expect(service.state).toEqual({
      status: 'failed',
      label: 'oooooh ...'
    });
    expect(stateEventSpy).toHaveBeenCalledWith({
      status: 'failed',
      label: 'oooooh ...',
    });
    expect(createInkSpy).toHaveBeenCalled();
  });
});

describe('SpinnerService.stop', () => {
  it('should do nothing if was not spinning', () => {
    service.stop();

    expect(service.state).toEqual({
      status: 'stop',
      label: expect.any(String)
    });
    expect(stateEventSpy).not.toHaveBeenCalled();
  });

  it('should update service state and emit an update event', () => {
    service.spin('test');
    service.stop();

    expect(service.state).toEqual({
      status: 'stop',
      label: 'test'
    });
    expect(stateEventSpy).toHaveBeenCalledWith({
      status: 'stop',
      label: 'test',
    });
  });
});
