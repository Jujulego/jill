import { EventSource } from '@jujulego/event-tree';
import { decorate, injectable } from 'inversify';

import { Service } from '@/src/modules/service.js';
import { container } from '@/src/inversify.config.js';
import { INK_APP } from '@/src/ink.config.jsx';

// Setup
decorate(injectable(), EventSource);

// Interface
export type SpinnerStatus = 'spin' | 'stop' | 'success' | 'failed';
export interface SpinnerState {
  status: SpinnerStatus;
  label: string;
}

export type SpinnerEventMap = Record<`update.${SpinnerStatus}`, SpinnerState>;

// Service
@Service()
export class SpinnerService extends EventSource<SpinnerEventMap> {
  // Attributes
  private _status: SpinnerStatus = 'stop';
  private _label = '';

  // Methods
  private _awakeInk() {
    // Ensure ink is instanced => spinner is printed
    container.get(INK_APP);
  }

  spin(label: string) {
    this._status = 'spin';
    this._label = label;

    this.emit('update.spin', this.state);
    this._awakeInk();
  }

  success(label: string) {
    this._status = 'success';
    this._label = label;

    this.emit('update.success', this.state);
    this._awakeInk();
  }

  failed(label: string) {
    this._status = 'failed';
    this._label = label;

    this.emit('update.failed', this.state);
    this._awakeInk();
  }

  stop() {
    if (this._status === 'spin') {
      this._status = 'stop';

      this.emit('update.stop', this.state);
    }
  }

  // Properties
  get state(): SpinnerState {
    return {
      status: this._status,
      label: this._label,
    };
  }
}
