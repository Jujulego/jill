import { logger } from 'packages/core';
import { PidFile } from '@jujulego/pid-file';
import { exhaustMap, filter } from 'rxjs';
import winston, { format } from 'winston';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { Logger } from './logger';
import { AppModule } from './app.module';
import { ControlResolver } from './control/control.resolver';
import { WatchManager } from './tasks/watch-manager';

// Class
export class MyrServer {
  // Attributes
  private readonly _logger = logger.child({ context: MyrServer.name });
  private readonly _pidfile = new PidFile('.jill-myr.pid', this._logger);

  // Constructor
  private constructor(
    readonly app: INestApplication
  ) {}

  // Statics
  static async createServer(): Promise<MyrServer> {
    const app = await NestFactory.create(AppModule, { logger: new Logger() });
    return new MyrServer(app);
  }

  // Methods
  private async _handleShutdown(): Promise<void> {
    this._logger.info('Shutdown signal received');

    // kill all running tasks
    const n = await this.manager.killAll();
    this._logger.info(`${n} tasks killed`);

    // Delete pid file
    await this._pidfile.delete();

    process.exit(0);
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

    this.control.$control.pipe(
      filter((event) => event.action === 'shutdown'),
      exhaustMap(() => this._handleShutdown())
    ).subscribe();
  }

  async start(): Promise<boolean> {
    // Create pidfile
    if (!await this._pidfile.create()) {
      return false;
    }

    // Start server
    this._setupLogger();

    await this.app.listen(5001, () => {
      this._logger.info('Server is listening at http://localhost:5001/');

      this._setupShutdown();
    });

    // Setup app
    // app.use('/', async (req, res, next) => {
    //   const start = Date.now();
    //   next();
    //
    //   const { operationName, variables } = await getGraphQLParams(req as http.IncomingMessage & { url: string });
    //   this._logger.verbose(`${operationName || 'unnamed'} ${JSON.stringify(variables)} took ${Date.now() - start}ms`);
    // });

    return true;
  }

  // Properties
  get control(): ControlResolver {
    return this.app.get(ControlResolver);
  }

  get manager(): WatchManager {
    return this.app.get(WatchManager);
  }
}
