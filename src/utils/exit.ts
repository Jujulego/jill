// Class
export class ExitException extends Error {
  // Constructor
  constructor(readonly code: number, message?: string) {
    super(message);
  }
}
