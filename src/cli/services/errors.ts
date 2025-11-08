import { ClientError } from '../utils/errors.js';

export class TaskExpressionError extends ClientError {
  name = 'TaskExpressionError';
}

export class TaskSyntaxError extends ClientError {
  name = 'TaskSyntaxError';
}
