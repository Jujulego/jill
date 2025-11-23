export class ClientError extends Error {
  name = 'ClientError';

  constructor(message: string) {
    super(message);
  }
}

export class TaskExpressionError extends ClientError {
  name = 'TaskExpressionError';
}

export class TaskSyntaxError extends ClientError {
  name = 'TaskSyntaxError';
}
