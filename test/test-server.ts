import { Router } from 'express';
import { Controller, NodeServer } from '../src';

class TestServer extends NodeServer {
  public useCatchAll = true;
  // public disableStdMiddleware = true;
  public faviconPath = __dirname + '/fav';
  // public faviconPath = __filename;
  // public staticBase = __dirname;
  // protected catchAllController = TestController;

  public async preConfigure() {
    console.log('pre-configure fired');
    this.express.use((req, res, next) => {
      console.log(`${req.method} ${req.path}`);
      next();
    });
  }

  public async mainConfigure() {
    console.log('main configure fired');
  }

  public async postConfigure() {
    console.log('post-configure fired');
  }
}

// @ts-ignore
// tslint:disable-next-line:max-classes-per-file
class TestController extends Controller {
  protected linkRoutes(router: Router): void {
    console.log('catch-all link routes call');
  }
}

(async () => {
  const test = new TestServer();
  await test.configure();
  // test.listen();
})().catch(err => console.log(err));
