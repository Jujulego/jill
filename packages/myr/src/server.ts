import { logger } from '@jujulego/jill-core';
import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import { useServer } from 'graphql-ws/lib/use/ws';
import { exhaustMap, filter } from 'rxjs';
import winston, { format } from 'winston';
import ws from 'ws';

import { $control } from './control/control.resolvers';
import { manager } from './tasks/tasks.resolvers';
import { resolvers } from './resolvers';
import { schema } from './schema';
import { PidFile } from './pidfile';

// Class
export class MyrServer {
  // Attributes
  private readonly _logger = logger.child({ context: MyrServer.name });
  private readonly _pidfile = new PidFile();

  // Methods
  private async _handleShutdown(): Promise<void> {
    this._logger.info('Shutdown signal received');

    // kill all running tasks
    const n = await manager.killAll();
    this._logger.info(`${n} tasks killed`);

    // Delete pid file
    await this._pidfile.delete();

    process.exit(0);
  }

  private async _setupDevtools(app: express.Router): Promise<void> {
    const { default: playground } = await import('graphql-playground-middleware-express');

    app.get('/graphql', playground({
      endpoint: '/graphql',
      subscriptionEndpoint: 'ws://localhost:5001/graphql'
    }));

    this._logger.verbose('Will serve graphql-playground');
  }

  private _setupLogger(): void {
    logger.add(new winston.transports.File({
      filename: '.jill-myr.log',
      options: { flag: 'w' },
      level: 'debug',
      format: format.combine(
        format.timestamp(),
        format.json(),
      ),
    }));
  }

  private _setupShutdown(): void {
    process.once('SIGTERM', () => this._handleShutdown());
    process.once('SIGINT', () => this._handleShutdown());
    process.once('SIGUSR1', () => this._handleShutdown());
    process.once('SIGUSR2', () => this._handleShutdown());

    $control.pipe(
      filter((event) => event.action === 'shutdown'),
      exhaustMap(() => this._handleShutdown())
    ).subscribe();
  }

  async start(): Promise<boolean> {
    // Create pidfile
    if (!await this._pidfile.create()) {
      return false;
    }

    this._setupLogger();
    this._setupShutdown();

    // Setup app
    const app = express();

    if (process.env.NODE_ENV === 'development') {
      await this._setupDevtools(app);
    }

    // Setup graphql
    app.use('/graphql', graphqlHTTP({
      schema,
      rootValue: resolvers,
      graphiql: false,
    }));

    const server = await app.listen(5001);

    // Setup websockets
    const wsServer = new ws.Server({ server, path: '/graphql' });
    useServer({ schema }, wsServer);

    this._logger.info('Server is accessible at http://localhost:5001/graphql');
    return true;
  }
}