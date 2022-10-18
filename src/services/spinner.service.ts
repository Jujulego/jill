import { injectable } from 'inversify';

import { container } from './inversify.config';

// Interface
export type SpinnerStatus = 'spin' | 'stop' | 'success' | 'failed';
export interface SpinnerState {
  status: SpinnerStatus;
  label: string;
}

export type SpinnerStateListener = (state: SpinnerState) => void;

// Service
@injectable()
export class SpinnerService {
  // Attributes
  private _status: SpinnerStatus = 'stop';
  private _label = '';

  private readonly _listeners = new Set<SpinnerStateListener>();

  // Methods
  private _propagate() {
    for (const listener of this._listeners) {
      listener(this.state);
    }
  }

  subscribe(listener: SpinnerStateListener) {
    this._listeners.add(listener);

    return () => {
      this._listeners.delete(listener);
    };
  }

  spin(label: string) {
    this._status = 'spin';
    this._label = label;

    this._propagate();
  }

  success(label: string) {
    this._status = 'success';
    this._label = label;

    this._propagate();
  }

  failed(label: string) {
    this._status = 'failed';
    this._label = label;

    this._propagate();
  }

  stop() {
    if (this._status === 'spin') {
      this._status = 'stop';

      this._propagate();
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

container.bind(SpinnerService)
  .toSelf()
  .inSingletonScope();
