import { json } from 'body-parser';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import express, { Express, urlencoded } from 'express';
import { existsSync } from 'fs';
import { createServer, Server } from 'http';
import favicon from 'serve-favicon';
import { Controller } from './controller';
import { NotFoundController } from './not-found-controller';

export interface NodeServer {
  /**
   * If given, adds the directory as an express static directory
   * while initialising the express middleware. This value is used exactly.
   */
  staticBase?: string;
  /**
   * If given, adds the favicon middleware while initalising the express
   * middleware. This value is used exactly.
   */
  faviconPath?: string;
  /**
   * If true, disables the standard middleware loading step.
   */
  disableStdMiddleware?: boolean;
  /**
   * If given, adds a catch-all route after calling the router setup
   * to catch and respond to all uncaught requests.
   */
  useCatchAll?: boolean;

  /**
   * If defined, this method is fired just before any configuration is done
   * in the `configure` method.
   * This method should be used to install logger middleware.
   */
  preConfigure?(): Promise<void>;
  /**
   * This method should be used to load in custom middleware and the routes that
   * this application will use.
   */
  mainConfigure?(): Promise<void>;
  /**
   * If defined, this method is fired after all configuration is done
   * in the `configure` method.
   */
  postConfigure?(): Promise<void>;
}

export abstract class NodeServer {
  /**
   * The controller to use for the catch-all router.
   */
  protected catchAllController: new () => Controller = NotFoundController;
  /**
   * The default port to listen on. Overridable.
   */
  protected defaultPort = '3000';

  /**
   * The current express app.
   */
  protected express: Express;
  /**
   * The http server object. Created when `listen` is called.
   */
  protected server?: Server;
  /**
   * The port that the server will listen on.
   */
  protected port?: number;

  public constructor() {
    this.express = express();
    this.port = this.normalizePort(process.env.PORT || this.defaultPort);
  }

  /**
   * Configures the node server with the standard setup.
   * Executes in the following order:
   * - Fires the `preConfigure` method if it was defined
   * - Adds the favicon middleware if `faviconPath` was defined
   * - Loads the standard middleware if `disableStdMiddleware` is not true
   *   - Middleware is loaded in the following order from the given packages
   *     - 'body-parser'.json()
   *     - 'body-parser'.urlencoded({ extended: true })
   *     - 'cookie-parser'()
   *     - 'compression'()
   * - Fires the `mainConfigure` method if it was defined
   *   - This method should be where the majority of the custom middlewares and the routes
   *     should be loaded
   * - Loads the express static middleware if `staticBase` was defined
   * - Loads the catch-all controller if `useCatchAll` is true
   *   - This controller will catch any request that isn't handled via normal routes
   *   - The controller use for this is defined in `catchAllController`
   */
  public async configure(): Promise<void> {
    // fire the pre-configure method if defined
    if (this.preConfigure) {
      await this.preConfigure();
    }

    // load the favicon middleware if the path is defined
    if (this.faviconPath) {
      const favPath = this.faviconPath;
      if (existsSync(favPath)) {
        this.express.use(favicon(favPath));
      } else {
        console.warn('favicon path given but file not found, skipping middleware...');
      }
    }

    // load the standard middleware
    if (!this.disableStdMiddleware) {
      this.express.use(json());
      this.express.use(urlencoded({ extended: true }));
      this.express.use(cookieParser());
      this.express.use(compression());
    }

    // fire the main configure method if defined
    if (this.mainConfigure) {
      await this.mainConfigure();
    }

    // load the static file middleware if the path is defined
    if (this.staticBase) {
      this.express.use(express.static(this.staticBase));
    }

    // load the catch-all controller if we should do so
    if (this.useCatchAll) {
      // catch all other routes
      this.express.use(new this.catchAllController().router());
    }

    // fire the post-configure method if defined
    if (this.postConfigure) {
      await this.postConfigure();
    }
  }

  /**
   * Instantiates a new node.js Server object and starts listening on the port
   * that was defined in `port`.
   */
  public listen() {
    this.server = createServer(this.express);
    this.server.listen(this.port);
    this.server.on('error', this.onError);
    this.server.on('listening', this.onListening);
  }

  protected normalizePort(val: string): number | undefined {
    const ival = parseInt(val, 10);
    if (isNaN(ival)) { // named pipe
      return ival;
    }
    if (ival >= 0) { // port number
      return ival;
    }
    return undefined;
  }

  private onError = (error: any) => {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const bind = typeof this.port === 'string'
      ? 'Pipe ' + this.port
      : 'Port ' + this.port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  }

  private onListening = () => {
    const addr = this.server!.address();
    const bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    console.log('Listening on ' + bind);
  }
}
