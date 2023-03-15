import { container } from '@/src/services/inversify.config';
import { SpinnerService, SpinnerState } from '@/src/services/spinner.service';

// Setup
let service: SpinnerService;
const updateEventSpy = jest.fn<void, [SpinnerState]>();

beforeEach(() => {
  container.snapshot();
  service = container.get(SpinnerService);

  updateEventSpy.mockReset();
  service.subscribe('update', updateEventSpy);
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
    expect(updateEventSpy).toHaveBeenCalledWith(
      {
        status: 'spin',
        label: 'test',
      },
      {
        key: 'update.spin',
        origin: service
      }
    );
  });
});

describe('SpinnerService.success', () => {
  it('should update service state and emit an update event', () => {
    service.success('youhou !');

    expect(service.state).toEqual({
      status: 'success',
      label: 'youhou !'
    });
    expect(updateEventSpy).toHaveBeenCalledWith(
      {
        status: 'success',
        label: 'youhou !',
      },
      {
        key: 'update.success',
        origin: service
      }
    );
  });
});

describe('SpinnerService.failed', () => {
  it('should update service state and emit an update event', () => {
    service.failed('oooooh ...');

    expect(service.state).toEqual({
      status: 'failed',
      label: 'oooooh ...'
    });
    expect(updateEventSpy).toHaveBeenCalledWith(
      {
        status: 'failed',
        label: 'oooooh ...',
      },
      {
        key: 'update.failed',
        origin: service
      }
    );
  });
});

describe('SpinnerService.stop', () => {
  it('should do nothing if was not spinning', () => {
    service.stop();

    expect(service.state).toEqual({
      status: 'stop',
      label: expect.any(String)
    });
    expect(updateEventSpy).not.toHaveBeenCalled();
  });

  it('should update service state and emit an update event', () => {
    service.spin('test');
    service.stop();

    expect(service.state).toEqual({
      status: 'stop',
      label: 'test'
    });
    expect(updateEventSpy).toHaveBeenCalledWith(
      {
        status: 'stop',
        label: 'test',
      },
      {
        key: 'update.stop',
        origin: service
      }
    );
  });
});