import { multiplexer, source } from '@jujulego/event-tree';

import { Service } from '@/src/modules/service.ts';
import { container } from '@/src/inversify.config.ts';
import { INK_APP } from '@/src/ink.config.ts';

// Interface
export type SpinnerStatus = 'spin' | 'stop' | 'success' | 'failed';
export interface SpinnerState {
  status: SpinnerStatus;
  label: string;
}

// Service
@Service()
export class SpinnerService {
  // Attributes
  private _status: SpinnerStatus = 'stop';
  private _label = '';
  private _events = multiplexer({
    state: source<SpinnerState>(),
  });

  // Methods
  private _awakeInk() {
    // Ensure ink is instanced => spinner is printed
    container.get(INK_APP);
  }

  spin(label: string) {
    this._status = 'spin';
    this._label = label;

    this._events.emit('state', this.state);
    this._awakeInk();
  }

  success(label: string) {
    this._status = 'success';
    this._label = label;

    this._events.emit('state', this.state);
    this._awakeInk();
  }

  failed(label: string) {
    this._status = 'failed';
    this._label = label;

    this._events.emit('state', this.state);
    this._awakeInk();
  }

  stop() {
    if (this._status === 'spin') {
      this._status = 'stop';

      this._events.emit('state', this.state);
    }
  }

  // Properties
  get on() {
    return this._events.on;
  }

  get off() {
    return this._events.off;
  }

  get state(): SpinnerState {
    return {
      status: this._status,
      label: this._label,
    };
  }
}
