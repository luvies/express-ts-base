# Express.JS TypeScript Base
This package provides a few helpers classes that aid in setting up an express server quickly and in an object-orientated manner. This package can also be used in JavaScript.

## NodeServer
This class is similar to the default express app.js setup that the express-generator cli will output, however it uses an abstract class instead. In order to use it, you should extend it like so:

```ts
class AppServer extends NodeServer {
  ...[method/property definitions]
}
```

It provides a few optional properties and methods that can be implemented in order to customise how the server runs. This is the interface that defines all the optional items (copied from the [source](src/server.ts)):

```ts
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
```

### Running the server
To run the server, simply instantiate it, call the `configure` method and then the `listen` method. It will deal with the options in the `configure` call, and will create the webserver in the `listen` call.

```ts
(async () => {
  const app = new AppServer();
  await app.configure();
  app.listen();
})().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
```

## Controller
This class provides a bit of bootstrapping to allow an object-orientated routing system. Each implementing class should always implement the following method:

```ts
protected abstract linkRoutes(router: Router): void;
```

Then, when using the controller as a route, you can do the following in the `AppServer.mainConfigure` method:

```ts
this.express.use('/api', new ApiController().router());
```

The `ApiController` class can also specify sub-routes in the exact same manner, allowing fully nested routes with a clear hierarchy and encapsulated logic. The method of instantiation is entirely optional as well, you could instead use dependency injection and have the sub-controllers be injected already constructed into the controller, and then just call `.router()` in the `linkRoutes` method. This would allow the controllers to also have services be injected if you needed.
